/**
 * TRADE SYSTEM — FASE IX / FASE XX
 *
 * Sistema de trocas de Monstrinhos entre jogadores.
 * 100% puro (sem DOM, sem imports externos).
 *
 * REGRA DE DESIGN:
 *   - Captura: qualquer jogador pode capturar Monstrinhos de QUALQUER classe.
 *   - Batalha: o jogador só pode USAR em combate Monstrinhos da MESMA classe.
 *   - Troca: incentiva jogadores a trocar Monstrinhos de classes diferentes.
 *
 * FUNÇÕES EXPORTADAS:
 *   validateTrade(playerA, monA, playerB, monB, sharedBox?) → { valid, reason }
 *   executeTrade(playerA, monA, playerB, monB, therapyLog?, sharedBox?) → { success, log }
 *   getTradeableMonsters(player, sharedBox?)   → Array de instâncias (inclui Box)
 *   getTradeSuggestions(playerA, playerB, sharedBox?) → Array de sugestões
 *
 * FASE XX: Monstrinhos da Box são incluídos nas trocas.
 *   - Monstrinhos da Box retornados por getTradeableMonsters têm _boxSlotId definido.
 *   - executeTrade remove do box e insere no time (ou box destino se time cheio).
 *   - validateTrade aceita monstrinhos de box sem exigir time mínimo do lado do box.
 */

// Tamanho máximo do time (espelha GameState.config?.maxTeamSize || 6)
const TEAM_MAX_DEFAULT = 6;

// ── Erros de validação ────────────────────────────────────────────────────────

export const TRADE_ERROR = {
    SAME_PLAYER:       'Não é possível trocar com você mesmo.',
    MONSTER_NOT_FOUND: 'Monstrinho não encontrado na equipe ou Box do jogador.',
    MONSTER_IN_BATTLE: 'Não é possível trocar durante uma batalha.',
    EMPTY_TEAM:        'Jogador precisa ter pelo menos 2 Monstrinhos no time para trocar.',
    SAME_CLASS:        'A troca é mais útil quando as classes são diferentes!',
};

// ── validateTrade ─────────────────────────────────────────────────────────────

/**
 * Valida se uma troca é válida.
 *
 * Regras:
 *   1. playerA !== playerB
 *   2. monA pertence ao time OU Box de playerA (identificado por ID)
 *   3. monB pertence ao time OU Box de playerB
 *   4. Se monA é do TIME: playerA.team.length >= 2 (não pode ficar sem Monstrinhos)
 *   5. Se monB é do TIME: playerB.team.length >= 2
 *   (Se o Monstrinho é da Box, não há mínimo de time exigido)
 *
 * @param {object}   playerA   - Jogador A
 * @param {object}   monA      - Monstrinho de playerA a ser trocado (objeto ou { id })
 * @param {object}   playerB   - Jogador B
 * @param {object}   monB      - Monstrinho de playerB a ser trocado (objeto ou { id })
 * @param {Array}    [sharedBox] - Array de slots { slotId, ownerPlayerId, monster }
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateTrade(playerA, monA, playerB, monB, sharedBox = []) {
    if (!playerA || !playerB || !monA || !monB) {
        return { valid: false, reason: 'Parâmetros inválidos.' };
    }

    if (playerA.id === playerB.id) {
        return { valid: false, reason: TRADE_ERROR.SAME_PLAYER };
    }

    const teamA = playerA.team || [];
    const teamB = playerB.team || [];

    const monAInTeam = teamA.some(m => m && m.id === monA.id);
    const monAInBox  = sharedBox.some(s => s.ownerPlayerId === playerA.id && s.monster?.id === monA.id);
    if (!monAInTeam && !monAInBox) {
        return { valid: false, reason: TRADE_ERROR.MONSTER_NOT_FOUND };
    }

    const monBInTeam = teamB.some(m => m && m.id === monB.id);
    const monBInBox  = sharedBox.some(s => s.ownerPlayerId === playerB.id && s.monster?.id === monB.id);
    if (!monBInTeam && !monBInBox) {
        return { valid: false, reason: TRADE_ERROR.MONSTER_NOT_FOUND };
    }

    // Mínimo de time apenas ao trocar DO time (não da Box)
    if (monAInTeam && teamA.filter(Boolean).length < 2) {
        return { valid: false, reason: TRADE_ERROR.EMPTY_TEAM };
    }
    if (monBInTeam && teamB.filter(Boolean).length < 2) {
        return { valid: false, reason: TRADE_ERROR.EMPTY_TEAM };
    }

    return { valid: true, reason: null };
}

// ── executeTrade ──────────────────────────────────────────────────────────────

/**
 * Executa a troca de Monstrinhos entre dois jogadores.
 *
 * Muta os arrays `team` dos jogadores diretamente (e `sharedBox` quando aplicável).
 * Atualiza `ownerId` de cada Monstrinho.
 *
 * Suporte à Box (Fase XX):
 *   - Se um Monstrinho está na Box (_boxSlotId ou encontrado via sharedBox), ele é
 *     removido da Box. O Monstrinho recebido vai para o time do jogador (se tiver vaga)
 *     ou de volta para a Box.
 *
 * @param {object} playerA      - Jogador A
 * @param {object} monA         - Monstrinho de playerA (objeto completo)
 * @param {object} playerB      - Jogador B
 * @param {object} monB         - Monstrinho de playerB (objeto completo)
 * @param {Array}  [therapyLog] - Array de log terapêutico para registrar evento
 * @param {Array}  [sharedBox]  - Array de slots { slotId, ownerPlayerId, monster }
 * @returns {{ success: boolean, log: string[] }}
 */
export function executeTrade(playerA, monA, playerB, monB, therapyLog = null, sharedBox = []) {
    const { valid, reason } = validateTrade(playerA, monA, playerB, monB, sharedBox);
    if (!valid) return { success: false, log: [reason] };

    const log = [];
    const nameA    = playerA.name || playerA.nome || 'Jogador A';
    const nameB    = playerB.name || playerB.nome || 'Jogador B';
    const monNameA = monA.nickname || monA.name || monA.nome || 'Monstrinho';
    const monNameB = monB.nickname || monB.name || monB.nome || 'Monstrinho';

    // Determinar origem de cada monstrinho (time ou box)
    const idxA     = playerA.team.findIndex(m => m && m.id === monA.id);
    const boxSlotA = idxA === -1 ? sharedBox.find(s => s.ownerPlayerId === playerA.id && s.monster?.id === monA.id) : null;
    const monAFromBox = !!boxSlotA;

    const idxB     = playerB.team.findIndex(m => m && m.id === monB.id);
    const boxSlotB = idxB === -1 ? sharedBox.find(s => s.ownerPlayerId === playerB.id && s.monster?.id === monB.id) : null;
    const monBFromBox = !!boxSlotB;

    // Referências aos objetos reais (não cópias com _boxSlotId)
    const actualMonA = monAFromBox ? boxSlotA.monster : playerA.team[idxA];
    const actualMonB = monBFromBox ? boxSlotB.monster : playerB.team[idxB];

    // Remover das origens de box
    if (monAFromBox) {
        const bIdx = sharedBox.indexOf(boxSlotA);
        if (bIdx >= 0) sharedBox.splice(bIdx, 1);
    }
    if (monBFromBox) {
        const bIdx = sharedBox.indexOf(boxSlotB);
        if (bIdx >= 0) sharedBox.splice(bIdx, 1);
    }

    // Colocar actualMonA na posse de playerB
    if (!monBFromBox) {
        playerB.team[idxB] = actualMonA;
    } else {
        // playerB liberou um slot de box — tenta colocar no time, senão na box
        if ((playerB.team || []).filter(Boolean).length < TEAM_MAX_DEFAULT) {
            playerB.team.push(actualMonA);
        } else {
            sharedBox.push({ slotId: `trade_${Date.now()}_toB`, ownerPlayerId: playerB.id, monster: actualMonA });
        }
    }

    // Colocar actualMonB na posse de playerA
    if (!monAFromBox) {
        playerA.team[idxA] = actualMonB;
    } else {
        // playerA liberou um slot de box — tenta colocar no time, senão na box
        if ((playerA.team || []).filter(Boolean).length < TEAM_MAX_DEFAULT) {
            playerA.team.push(actualMonB);
        } else {
            sharedBox.push({ slotId: `trade_${Date.now()}_toA`, ownerPlayerId: playerA.id, monster: actualMonB });
        }
    }

    // Atualizar ownerId
    if (actualMonA.ownerId !== undefined) actualMonA.ownerId = playerB.id;
    if (actualMonB.ownerId !== undefined) actualMonB.ownerId = playerA.id;

    // Resetar activeIndex se o monstrinho ativo do time foi trocado
    if (!monAFromBox && (playerA.activeIndex ?? 0) === idxA) {
        playerA.activeIndex = playerA.team.findIndex(m => m && (Number(m.hp) || 0) > 0);
        if (playerA.activeIndex < 0) playerA.activeIndex = 0;
    }
    if (!monBFromBox && (playerB.activeIndex ?? 0) === idxB) {
        playerB.activeIndex = playerB.team.findIndex(m => m && (Number(m.hp) || 0) > 0);
        if (playerB.activeIndex < 0) playerB.activeIndex = 0;
    }

    // Log
    log.push(`🔄 ${nameA} trocou ${monNameA} com ${nameB} por ${monNameB}!`);

    // Log terapêutico
    if (Array.isArray(therapyLog)) {
        therapyLog.push({
            event: 'trade',
            playerAId: playerA.id,
            playerBId: playerB.id,
            monAId: actualMonA.id,
            monBId: actualMonB.id,
        });
    }

    return { success: true, log };
}

// ── getTradeableMonsters ──────────────────────────────────────────────────────

/**
 * Retorna os Monstrinhos de um jogador que fazem sentido trocar.
 * Inclui monstrinhos do time que não são da classe do jogador E monstrinhos
 * da Box que não são da classe do jogador.
 *
 * Monstrinhos da Box são retornados como cópias rasas com `_boxSlotId` definido,
 * para que a UI e executeTrade saibam diferenciá-los.
 *
 * @param {object} player     - Jogador (precisa de .team e opcionalmente .class)
 * @param {Array}  [sharedBox] - Array de slots { slotId, ownerPlayerId, monster }
 * @returns {Array} Array de instâncias de Monstrinhos
 */
export function getTradeableMonsters(player, sharedBox = []) {
    if (!player) return [];
    const team = (player.team || []).filter(Boolean);
    const playerClass = player.class || null;

    // Time: monstrinhos de classes diferentes (ou todos se sem classe)
    const teamTradeable = playerClass ? team.filter(m => m.class !== playerClass) : [...team];

    // Box: slots deste jogador com monstrinhos de classes diferentes
    const boxSlots = sharedBox.filter(s => s.ownerPlayerId === player.id && s.monster);
    const boxTradeable = playerClass
        ? boxSlots.filter(s => s.monster.class !== playerClass)
        : boxSlots;
    const boxMonsters = boxTradeable.map(s => ({ ...s.monster, _boxSlotId: s.slotId }));

    return [...teamTradeable, ...boxMonsters];
}

// ── getTradeSuggestions ───────────────────────────────────────────────────────

/**
 * Sugere pares de troca benéficos entre dois jogadores.
 * Retorna pares onde monA (de playerA) tem classe == playerB.class
 * e monB (de playerB) tem classe == playerA.class.
 * Isso resulta em ambos recebendo um Monstrinho que podem usar.
 *
 * Inclui monstrinhos da Box (Fase XX).
 *
 * @param {object} playerA    - Jogador A
 * @param {object} playerB    - Jogador B
 * @param {Array}  [sharedBox] - Array de slots { slotId, ownerPlayerId, monster }
 * @returns {Array<{ monA: object, monB: object }>}
 */
export function getTradeSuggestions(playerA, playerB, sharedBox = []) {
    if (!playerA || !playerB) return [];

    const classA = playerA.class || null;
    const classB = playerB.class || null;

    if (!classA || !classB) return [];

    const tradeableA = getTradeableMonsters(playerA, sharedBox);
    const tradeableB = getTradeableMonsters(playerB, sharedBox);

    const suggestions = [];

    for (const monA of tradeableA) {
        if (monA.class !== classB) continue; // monA seria útil para playerB
        for (const monB of tradeableB) {
            if (monB.class !== classA) continue; // monB seria útil para playerA
            suggestions.push({ monA, monB });
        }
    }

    return suggestions;
}
