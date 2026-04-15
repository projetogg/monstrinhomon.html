/**
 * TRADE SYSTEM — Sistema de Troca entre Jogadores (FASE O)
 *
 * Módulo puro: não acessa estado global, não toca DOM, não chama save().
 * Implementa a regra canônica: jogadores trocam Monstrinhos para poder usá-los
 * em batalha (cada jogador só usa Monstrinhos da própria classe em combate).
 *
 * Funções exportadas:
 *   validateTrade(fromPlayer, toPlayer, instanceId, playersData)
 *   proposeTradeAction(fromPlayer, toPlayer, instanceId, playersData)
 *   acceptTrade(tradeProposal, playersData)
 */

// ─── Códigos de erro ─────────────────────────────────────────────────────────

export const TRADE_ERROR = {
    INVALID_PLAYER:       'INVALID_PLAYER',
    SAME_PLAYER:          'SAME_PLAYER',
    MONSTER_NOT_FOUND:    'MONSTER_NOT_FOUND',
    MONSTER_IN_BATTLE:    'MONSTER_IN_BATTLE',
    MONSTER_KO:           'MONSTER_KO',
    INVALID_INSTANCE:     'INVALID_INSTANCE',
};

// ─── validateTrade ────────────────────────────────────────────────────────────

/**
 * Valida se uma troca é permitida pelas regras do jogo.
 *
 * @param {Object} fromPlayer   - Jogador que oferece o monstro
 * @param {Object} toPlayer     - Jogador que recebe o monstro
 * @param {string} instanceId   - ID da instância de monstro a transferir
 * @param {Object} [context]    - Contexto opcional
 *   @param {boolean} [context.inBattle=false] - Se uma batalha está ativa
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateTrade(fromPlayer, toPlayer, instanceId, context = {}) {
    if (!fromPlayer || typeof fromPlayer !== 'object') {
        return { valid: false, error: TRADE_ERROR.INVALID_PLAYER };
    }
    if (!toPlayer || typeof toPlayer !== 'object') {
        return { valid: false, error: TRADE_ERROR.INVALID_PLAYER };
    }
    if (fromPlayer.id === toPlayer.id) {
        return { valid: false, error: TRADE_ERROR.SAME_PLAYER };
    }
    if (!instanceId || typeof instanceId !== 'string') {
        return { valid: false, error: TRADE_ERROR.INVALID_INSTANCE };
    }

    // Localizar a instância na equipe do cedente
    const team = Array.isArray(fromPlayer.team) ? fromPlayer.team : [];
    const monIdx = team.findIndex(m => m && (m.id === instanceId || m.instanceId === instanceId));
    if (monIdx === -1) {
        return { valid: false, error: TRADE_ERROR.MONSTER_NOT_FOUND };
    }

    const mon = team[monIdx];

    // Não pode trocar monstro que está como ativo durante batalha
    if (context.inBattle && fromPlayer.activeIndex === monIdx) {
        return { valid: false, error: TRADE_ERROR.MONSTER_IN_BATTLE };
    }

    // Não pode trocar monstro com 0 HP (KO)
    if (Number(mon.hp) <= 0) {
        return { valid: false, error: TRADE_ERROR.MONSTER_KO };
    }

    return { valid: true, error: null };
}

// ─── proposeTradeAction ───────────────────────────────────────────────────────

/**
 * Cria uma proposta de troca (imutável, não modifica os jogadores).
 * Deve ser seguido por acceptTrade() para efetivar.
 *
 * @param {Object} fromPlayer - Jogador cedente
 * @param {Object} toPlayer   - Jogador receptor
 * @param {string} instanceId - ID da instância a trocar
 * @param {Object} [context]  - Contexto (inBattle, etc)
 * @returns {{ ok: boolean, trade: Object|null, error: string|null }}
 */
export function proposeTradeAction(fromPlayer, toPlayer, instanceId, context = {}) {
    const validation = validateTrade(fromPlayer, toPlayer, instanceId, context);
    if (!validation.valid) {
        return { ok: false, trade: null, error: validation.error };
    }

    const team = Array.isArray(fromPlayer.team) ? fromPlayer.team : [];
    const mon  = team.find(m => m && (m.id === instanceId || m.instanceId === instanceId));

    const trade = {
        fromPlayerId: fromPlayer.id,
        toPlayerId:   toPlayer.id,
        instanceId,
        monsterName:  mon.nickname || mon.name || instanceId,
        createdAt:    Date.now(),
    };

    return { ok: true, trade, error: null };
}

// ─── acceptTrade ──────────────────────────────────────────────────────────────

/**
 * Efetiva uma troca: move o monstro do cedente para o receptor.
 * Modifica `fromPlayer.team` e `toPlayer.team` in-place.
 *
 * @param {Object} trade      - Proposta criada por proposeTradeAction
 * @param {Object} fromPlayer - Jogador cedente (mutado in-place)
 * @param {Object} toPlayer   - Jogador receptor (mutado in-place)
 * @param {Object} [context]  - Contexto opcional (inBattle, etc)
 * @returns {{ ok: boolean, error: string|null, monsterName: string|null }}
 */
export function acceptTrade(trade, fromPlayer, toPlayer, context = {}) {
    if (!trade || !fromPlayer || !toPlayer) {
        return { ok: false, error: TRADE_ERROR.INVALID_PLAYER, monsterName: null };
    }

    // Re-validar no momento da aceitação (estado pode ter mudado)
    const validation = validateTrade(fromPlayer, toPlayer, trade.instanceId, context);
    if (!validation.valid) {
        return { ok: false, error: validation.error, monsterName: null };
    }

    const team   = Array.isArray(fromPlayer.team) ? fromPlayer.team : [];
    const monIdx = team.findIndex(m => m && (m.id === trade.instanceId || m.instanceId === trade.instanceId));
    if (monIdx === -1) {
        return { ok: false, error: TRADE_ERROR.MONSTER_NOT_FOUND, monsterName: null };
    }

    // Transferir monstro
    const [mon] = team.splice(monIdx, 1);
    if (!Array.isArray(toPlayer.team)) toPlayer.team = [];
    toPlayer.team.push(mon);

    // Ajustar activeIndex do cedente se necessário
    if (typeof fromPlayer.activeIndex === 'number' && fromPlayer.activeIndex >= team.length) {
        fromPlayer.activeIndex = Math.max(0, team.length - 1);
    }

    return { ok: true, error: null, monsterName: mon.nickname || mon.name || trade.instanceId };
}
