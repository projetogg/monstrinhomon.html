/**
 * XP CORE MODULE (PR8A)
 * Funções 100% puras para cálculo de XP
 * Sem dependências de DOM, GameState global ou storage
 */

/**
 * Calcula XP de batalha baseado no inimigo derrotado
 * @param {Object} defeatedEnemy - Inimigo derrotado
 * @param {string|null} encounterType - Tipo de encontro (ex: 'boss')
 * @param {Object} config - Configuração de XP { battleXpBase: number, rarityXP: Object }
 * @returns {number} XP calculado (mínimo 1)
 */
export function calculateBattleXP(defeatedEnemy, encounterType = null, config = {}) {
    const base = config.battleXpBase ?? 15;
    const level = Math.max(1, Number(defeatedEnemy?.level) || 1);
    const rarity = defeatedEnemy?.rarity || defeatedEnemy?.raridade || null;
    
    // Multiplicador de raridade (com fallback)
    const rarityMult = Number(config.rarityXP?.[rarity]) || 1.0;
    
    let xp = Math.floor((base + level * 2) * rarityMult);
    
    // Boss bonus (se encounterType for fornecido)
    if (encounterType && String(encounterType).toLowerCase() === 'boss') {
        xp = Math.floor(xp * 1.5);
    }
    
    return Math.max(1, xp);
}
