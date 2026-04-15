/**
 * THERAPY REWARDS MODULE (FASE H)
 *
 * Funções puras para calcular e aplicar recompensas de medalhas terapêuticas.
 * Sem side-effects: não acessa GameState, não toca DOM, não chama save().
 *
 * Recompensas canônicas:
 *   Bronze → 1 moeda, 20 XP
 *   Prata  → 3 moedas, 50 XP
 *   Ouro   → 7 moedas, 150 XP
 */

/**
 * Tabela de recompensas por medalha.
 * @type {{ [medal: string]: { xp: number, moeda: number } }}
 */
export const MEDAL_REWARDS = {
    bronze: { xp: 20,  moeda: 1 },
    silver: { xp: 50,  moeda: 3 },
    gold:   { xp: 150, moeda: 7 }
};

/**
 * Retorna as recompensas associadas a uma medalha.
 *
 * @param {string} medal - 'bronze' | 'silver' | 'gold'
 * @returns {{ xp: number, moeda: number } | null}
 */
export function getMedalRewards(medal) {
    return MEDAL_REWARDS[medal] ?? null;
}

/**
 * Aplica as recompensas de uma medalha recém-conquistada a um jogador:
 *   - XP para o monstro ativo do jogador (se vivo)
 *   - Moeda ao jogador
 *
 * @param {Object} player - Objeto do jogador (mutado in-place)
 * @param {string} medal  - 'bronze' | 'silver' | 'gold'
 * @param {Object} deps   - Dependências injetadas:
 *   @param {Function} deps.giveXP         - giveXP(mon, amount, logArr) — aplica XP à instância
 *   @param {Function} [deps.addPlayerMoeda] - addPlayerMoeda(player, amount) — opcional
 * @param {Array}  [logArr] - Array de log (opcional, passado ao giveXP)
 * @returns {{ xpAwarded: number, moedaAwarded: number, monsterName: string | null }}
 */
export function applyTherapyMedalRewards(player, medal, deps, logArr = []) {
    const rewards = getMedalRewards(medal);
    if (!rewards || !player) return { xpAwarded: 0, moedaAwarded: 0, monsterName: null };

    const { xp, moeda } = rewards;
    let xpAwarded    = 0;
    let moedaAwarded = 0;
    let monsterName  = null;

    // XP para o monstro ativo (se vivo)
    const activeIdx = typeof player.activeIndex === 'number' ? player.activeIndex : 0;
    const activeMon = player.team?.[activeIdx];
    if (activeMon && Number(activeMon.hp) > 0 && typeof deps.giveXP === 'function') {
        deps.giveXP(activeMon, xp, logArr);
        xpAwarded   = xp;
        monsterName = activeMon.nickname || activeMon.name || null;
    }

    // Moeda ao jogador
    if (typeof deps.addPlayerMoeda === 'function') {
        deps.addPlayerMoeda(player, moeda);
        moedaAwarded = moeda;
    } else if (typeof player.moeda === 'number') {
        player.moeda += moeda;
        moedaAwarded = moeda;
    } else if (player.moeda == null) {
        player.moeda = moeda;
        moedaAwarded = moeda;
    }

    return { xpAwarded, moedaAwarded, monsterName };
}
