/**
 * POSITION SYSTEM — Posicionamento Frente/Meio/Trás
 * 100% puro, sem side effects, sem imports.
 */

export const POSITION = { FRONT: 'front', MID: 'mid', BACK: 'back' };

// Alcance por classe: 1=Curto, 2=Médio, 3=Longo
export const RANGE_BY_CLASS = {
    'Guerreiro':  1,
    'Bárbaro':    1,
    'Animalista': 1,
    'Curandeiro': 2,
    'Ladino':     2,
    'Mago':       3,
    'Bardo':      3,
    'Caçador':    3,
};

// Bônus defensivo por posição (somado ao RC defensivo)
export const POSITION_DEF_BONUS = { front: 0, mid: 1, back: 2 };

/**
 * Sugere posição automática por classe.
 * Guerreiro/Bárbaro → Frente
 * Mago/Curandeiro/Bardo/Caçador → Trás
 * Ladino/Animalista → Meio
 */
export function suggestPosition(monClass) {
    if (['Guerreiro', 'Bárbaro'].includes(monClass)) return POSITION.FRONT;
    if (['Mago', 'Curandeiro', 'Bardo', 'Caçador'].includes(monClass)) return POSITION.BACK;
    return POSITION.MID;
}

/**
 * Verifica se atacante pode atingir a posição do alvo.
 *
 * Regras simplificadas para o jogo:
 * - Alcance 1 (curto): só pode atingir frente do lado inimigo
 * - Alcance 2 (médio): pode atingir frente e meio
 * - Alcance 3 (longo): pode atingir qualquer posição
 *
 * A posição do atacante (`attackerPos`) está disponível para extensões futuras
 * (ex.: restrição de que corpo-a-corpo exige estar na frente).
 *
 * Mapeamento de posição para índice: front=0, mid=1, back=2
 */
export function canReach(attackerRange, attackerPos, targetPos) {
    const posIndex = { front: 0, mid: 1, back: 2 };
    const targetIdx = posIndex[targetPos] ?? 0;
    // Com alcance N, pode atingir posições com índice 0 até N-1
    return targetIdx <= attackerRange - 1;
}

/**
 * Retorna bônus defensivo de posição.
 * O bônus só vale se há aliado vivo na linha à frente (proteção real).
 *
 * @param {string} pos - 'front'|'mid'|'back'
 * @param {boolean} frontLineHasAlly - Se a linha da frente tem aliado vivo
 * @returns {number} Bônus defensivo (0, 1 ou 2)
 */
export function getDefensiveBonus(pos, frontLineHasAlly) {
    if (pos === POSITION.FRONT) return 0;
    if (!frontLineHasAlly) return 0; // sem proteção se linha da frente vazia
    return POSITION_DEF_BONUS[pos] ?? 0;
}

/**
 * Verifica se uma linha tem aliados vivos.
 *
 * @param {Array} combatants - Array de { position, hp, side }
 * @param {string} line - 'front'|'mid'|'back'
 * @param {string} side - 'player'|'enemy'
 * @returns {boolean}
 */
export function lineHasAlive(combatants, line, side) {
    if (!Array.isArray(combatants)) return false;
    return combatants.some(c =>
        c.side === side &&
        c.position === line &&
        (Number(c.hp) || 0) > 0
    );
}

/**
 * Atribui posições padrão: todos na frente por default.
 * Se playerData disponível, sugere posição por classe.
 *
 * @param {Array} playerIds - Array de IDs de jogadores
 * @param {object} playerData - Mapa playerId → { class }
 * @returns {object} Mapa playerId → position
 */
export function assignDefaultPositions(playerIds, playerData) {
    const result = {};
    for (const pid of (playerIds || [])) {
        const monClass = playerData?.[pid]?.class;
        result[pid] = monClass ? suggestPosition(monClass) : POSITION.FRONT;
    }
    return result;
}

/**
 * Avança linha automaticamente quando linha da frente fica vazia.
 * Meio avança para frente; Trás avança para meio.
 *
 * @param {object} posMap - Mapa id → position
 * @param {Array} combatants - Array de { id, hp, side, position }
 * @param {string} side - 'player'|'enemy'
 * @returns {object} Novo posMap após avanços
 */
export function autoAdvancePositions(posMap, combatants, side) {
    const newMap = { ...posMap };

    // Verificar se linha da frente está vazia para este side
    const frontAlive = combatants.some(c =>
        c.side === side &&
        newMap[c.id] === POSITION.FRONT &&
        (Number(c.hp) || 0) > 0
    );

    if (!frontAlive) {
        // Avançar meio para frente
        for (const id of Object.keys(newMap)) {
            if (newMap[id] === POSITION.MID) {
                const combatant = combatants.find(c => c.id === id);
                if (combatant && combatant.side === side && (Number(combatant.hp) || 0) > 0) {
                    newMap[id] = POSITION.FRONT;
                }
            }
        }

        // Re-verificar se ainda sem frente, avançar trás
        const frontAlive2 = combatants.some(c =>
            c.side === side &&
            newMap[c.id] === POSITION.FRONT &&
            (Number(c.hp) || 0) > 0
        );
        if (!frontAlive2) {
            for (const id of Object.keys(newMap)) {
                if (newMap[id] === POSITION.BACK) {
                    const combatant = combatants.find(c => c.id === id);
                    if (combatant && combatant.side === side && (Number(combatant.hp) || 0) > 0) {
                        newMap[id] = POSITION.FRONT;
                    }
                }
            }
        }
    }

    return newMap;
}

/**
 * Filtra alvos acessíveis por alcance e posição do atacante.
 *
 * @param {Array} targets - Array de { id, position, hp }
 * @param {string} attackerClass - Classe do atacante (para lookup RANGE_BY_CLASS)
 * @param {string} attackerPos - Posição do atacante
 * @returns {Array} Alvos acessíveis
 */
export function filterReachableTargets(targets, attackerClass, attackerPos) {
    const range = RANGE_BY_CLASS[attackerClass] ?? 3; // default: alcance máximo
    return (targets || []).filter(t => {
        const tPos = t.position || POSITION.FRONT;
        return canReach(range, attackerPos, tPos) && (Number(t.hp) || 0) > 0;
    });
}
