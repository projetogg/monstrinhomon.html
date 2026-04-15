/**
 * TRADE SYSTEM — FASE IX
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
 *   validateTrade(playerA, monA, playerB, monB) → { valid, reason }
 *   executeTrade(playerA, monA, playerB, monB, therapyLog?) → { success, log }
 *   getTradeableMonsters(player)               → Array de instâncias
 *   getTradeSuggestions(playerA, playerB)      → Array de sugestões
 */

// ── Erros de validação ────────────────────────────────────────────────────────

export const TRADE_ERROR = {
    SAME_PLAYER:     'Não é possível trocar com você mesmo.',
    MONSTER_NOT_FOUND: 'Monstrinho não encontrado na equipe do jogador.',
    MONSTER_IN_BATTLE: 'Não é possível trocar durante uma batalha.',
    EMPTY_TEAM:      'Jogador precisa ter pelo menos 2 Monstrinhos para trocar.',
    SAME_CLASS:      'A troca é mais útil quando as classes são diferentes!',
};

// ── validateTrade ─────────────────────────────────────────────────────────────

/**
 * Valida se uma troca é válida.
 *
 * Regras:
 *   1. playerA !== playerB
 *   2. monA pertence ao time de playerA (por ID)
 *   3. monB pertence ao time de playerB (por ID)
 *   4. playerA.team.length >= 2 (não pode ficar sem Monstrinhos)
 *   5. playerB.team.length >= 2
 *
 * @param {object} playerA - Jogador A
 * @param {object} monA    - Monstrinho de playerA a ser trocado (objeto ou { id })
 * @param {object} playerB - Jogador B
 * @param {object} monB    - Monstrinho de playerB a ser trocado (objeto ou { id })
 * @returns {{ valid: boolean, reason: string|null }}
 */
export function validateTrade(playerA, monA, playerB, monB) {
    if (!playerA || !playerB || !monA || !monB) {
        return { valid: false, reason: 'Parâmetros inválidos.' };
    }

    if (playerA.id === playerB.id) {
        return { valid: false, reason: TRADE_ERROR.SAME_PLAYER };
    }

    const teamA = playerA.team || [];
    const teamB = playerB.team || [];

    const monAInTeam = teamA.some(m => m && m.id === monA.id);
    if (!monAInTeam) {
        return { valid: false, reason: TRADE_ERROR.MONSTER_NOT_FOUND };
    }

    const monBInTeam = teamB.some(m => m && m.id === monB.id);
    if (!monBInTeam) {
        return { valid: false, reason: TRADE_ERROR.MONSTER_NOT_FOUND };
    }

    if (teamA.filter(Boolean).length < 2) {
        return { valid: false, reason: TRADE_ERROR.EMPTY_TEAM };
    }

    if (teamB.filter(Boolean).length < 2) {
        return { valid: false, reason: TRADE_ERROR.EMPTY_TEAM };
    }

    return { valid: true, reason: null };
}

// ── executeTrade ──────────────────────────────────────────────────────────────

/**
 * Executa a troca de Monstrinhos entre dois jogadores.
 *
 * Muta os arrays `team` dos jogadores diretamente.
 * Atualiza `ownerId` de cada Monstrinho.
 *
 * @param {object} playerA      - Jogador A
 * @param {object} monA         - Monstrinho de playerA (objeto completo)
 * @param {object} playerB      - Jogador B
 * @param {object} monB         - Monstrinho de playerB (objeto completo)
 * @param {Array}  [therapyLog] - Array de log terapêutico para registrar evento
 * @returns {{ success: boolean, log: string[] }}
 */
export function executeTrade(playerA, monA, playerB, monB, therapyLog = null) {
    const { valid, reason } = validateTrade(playerA, monA, playerB, monB);
    if (!valid) return { success: false, log: [reason] };

    const log = [];
    const nameA = playerA.name || playerA.nome || 'Jogador A';
    const nameB = playerB.name || playerB.nome || 'Jogador B';
    const monNameA = monA.nickname || monA.name || monA.nome || 'Monstrinho';
    const monNameB = monB.nickname || monB.name || monB.nome || 'Monstrinho';

    // Encontrar índices
    const idxA = playerA.team.findIndex(m => m && m.id === monA.id);
    const idxB = playerB.team.findIndex(m => m && m.id === monB.id);

    // Trocar nas equipes
    playerA.team[idxA] = monB;
    playerB.team[idxB] = monA;

    // Atualizar ownerId (compatível com saves que usam ownerId)
    if (monA.ownerId !== undefined) monA.ownerId = playerB.id;
    if (monB.ownerId !== undefined) monB.ownerId = playerA.id;

    // Se o monstro trocado era o ativo, resetar activeIndex para 0
    if ((playerA.activeIndex ?? 0) === idxA) {
        playerA.activeIndex = playerA.team.findIndex(m => m && (Number(m.hp) || 0) > 0);
        if (playerA.activeIndex < 0) playerA.activeIndex = 0;
    }
    if ((playerB.activeIndex ?? 0) === idxB) {
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
            monAId: monA.id,
            monBId: monB.id,
        });
    }

    return { success: true, log };
}

// ── getTradeableMonsters ──────────────────────────────────────────────────────

/**
 * Retorna os Monstrinhos de um jogador que fazem sentido trocar.
 * Inclui todos que não são da classe do jogador (eles não podem ser usados em batalha).
 * Se o jogador não tem classe definida, retorna todos.
 *
 * @param {object} player  - Jogador (precisa de .team e opcionalmente .class)
 * @returns {Array} Array de instâncias de Monstrinhos
 */
export function getTradeableMonsters(player) {
    if (!player) return [];
    const team = (player.team || []).filter(Boolean);
    const playerClass = player.class || null;

    if (!playerClass) return team;

    // Retorna Monstrinhos de outras classes (os que o jogador não pode usar)
    return team.filter(m => m.class !== playerClass);
}

// ── getTradeSuggestions ───────────────────────────────────────────────────────

/**
 * Sugere pares de troca benéficos entre dois jogadores.
 * Retorna pares onde monA (de playerA) tem classe == playerB.class
 * e monB (de playerB) tem classe == playerA.class.
 * Isso resulta em ambos recebendo um Monstrinho que podem usar.
 *
 * @param {object} playerA - Jogador A
 * @param {object} playerB - Jogador B
 * @returns {Array<{ monA: object, monB: object }>}
 */
export function getTradeSuggestions(playerA, playerB) {
    if (!playerA || !playerB) return [];

    const classA = playerA.class || null;
    const classB = playerB.class || null;

    if (!classA || !classB) return [];

    const teamA = (playerA.team || []).filter(Boolean);
    const teamB = (playerB.team || []).filter(Boolean);

    const suggestions = [];

    for (const monA of teamA) {
        if (monA.class !== classB) continue; // monA seria útil para playerB
        for (const monB of teamB) {
            if (monB.class !== classA) continue; // monB seria útil para playerA
            suggestions.push({ monA, monB });
        }
    }

    return suggestions;
}
