/**
 * DROP SYSTEM MODULE
 * 
 * Sistema de drops/loot para batalhas.
 * Gera itens aleatórios após vitórias baseado em tabelas de drop.
 * 
 * Dados baseados em DROPS.csv:
 * - DROP_001: Encontro selvagem (wild)
 * - DROP_002: Treinador/Boss
 * 
 * IDs mapeados:
 * - IT_CAP_01 (legado) → CLASTERORB_COMUM (atual)
 * - IT_HEAL_01 → IT_HEAL_01 (sem mudança)
 */

// ═══════════════════════════════════════════════════
// DROP TABLES (baseado em DROPS.csv)
// ═══════════════════════════════════════════════════

/**
 * Mapeamento de IDs legados para IDs atuais
 * (DROPS.csv usa IT_CAP_01, mas o jogo migrou para CLASTERORB_COMUM)
 */
const LEGACY_ID_MAP = {
    'IT_CAP_01': 'CLASTERORB_COMUM',
    'IT_CAP_02': 'CLASTERORB_INCOMUM'
};

/**
 * Resolve um item ID, convertendo IDs legados para atuais
 * @param {string} itemId - ID do item (pode ser legado)
 * @returns {string} - ID atual do item
 */
export function resolveItemId(itemId) {
    return LEGACY_ID_MAP[itemId] || itemId;
}

/**
 * Tabelas de drop do jogo
 * Cada tabela contém uma lista de possíveis drops com chance e quantidade
 */
export const DROP_TABLES = {
    'DROP_001': {
        id: 'DROP_001',
        name: 'Encontro Selvagem',
        entries: [
            { itemId: 'CLASTERORB_COMUM', chance: 0.35, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_01',       chance: 0.25, minQty: 1, maxQty: 2 }
        ]
    },
    'DROP_002': {
        id: 'DROP_002',
        name: 'Treinador',
        entries: [
            { itemId: 'CLASTERORB_COMUM', chance: 0.50, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_01',       chance: 0.40, minQty: 1, maxQty: 2 }
        ]
    }
};

// ═══════════════════════════════════════════════════
// DROP GENERATION (funções puras)
// ═══════════════════════════════════════════════════

/**
 * Gera drops aleatórios baseado em uma tabela de drop.
 * Cada entrada na tabela é rolada independentemente.
 * 
 * @param {string} dropTableId - ID da tabela de drop (ex: 'DROP_001')
 * @param {Function} [rngFn] - Função de RNG (retorna 0-1). Default: Math.random
 * @returns {Array<{itemId: string, qty: number}>} - Array de drops gerados
 */
export function generateDrops(dropTableId, rngFn) {
    const rng = typeof rngFn === 'function' ? rngFn : Math.random;
    
    const table = DROP_TABLES[dropTableId];
    if (!table || !Array.isArray(table.entries)) {
        return [];
    }
    
    const drops = [];
    
    for (const entry of table.entries) {
        // Validar entrada
        if (!entry.itemId || typeof entry.chance !== 'number') continue;
        if (entry.chance <= 0) continue;
        
        // Rolar chance
        const roll = rng();
        if (roll >= entry.chance) continue;
        
        // Calcular quantidade
        const minQty = Math.max(1, Math.floor(entry.minQty) || 1);
        const maxQty = Math.max(minQty, Math.floor(entry.maxQty) || minQty);
        
        let qty;
        if (minQty === maxQty) {
            qty = minQty;
        } else {
            // Gerar quantidade aleatória entre min e max (inclusive)
            qty = Math.min(maxQty, minQty + Math.floor(rng() * (maxQty - minQty + 1)));
        }
        
        drops.push({ itemId: entry.itemId, qty });
    }
    
    return drops;
}

/**
 * Adiciona drops ao inventário de um jogador.
 * 
 * @param {Object} player - Jogador que receberá os drops
 * @param {Array<{itemId: string, qty: number}>} drops - Array de drops
 * @returns {boolean} - true se pelo menos 1 item foi adicionado
 */
export function addDropsToInventory(player, drops) {
    if (!player || !Array.isArray(drops) || drops.length === 0) {
        return false;
    }
    
    player.inventory = player.inventory || {};
    
    let added = false;
    for (const drop of drops) {
        if (!drop.itemId || !drop.qty || drop.qty <= 0) continue;
        
        player.inventory[drop.itemId] = (player.inventory[drop.itemId] || 0) + drop.qty;
        added = true;
    }
    
    return added;
}

// ═══════════════════════════════════════════════════
// ITEM NAME MAP (para exibição no log)
// ═══════════════════════════════════════════════════

/**
 * Mapa de nomes e emojis para itens que podem ser dropados
 */
const ITEM_DISPLAY = {
    'CLASTERORB_COMUM':   { name: 'ClasterOrb Comum',   emoji: '⚪' },
    'CLASTERORB_INCOMUM': { name: 'ClasterOrb Incomum',  emoji: '🔵' },
    'CLASTERORB_RARA':    { name: 'ClasterOrb Rara',     emoji: '🟣' },
    'IT_HEAL_01':         { name: 'Petisco de Cura',     emoji: '💚' },
    'IT_HEAL_02':         { name: 'Ração Revigorante',   emoji: '🍖' },
    'IT_HEAL_03':         { name: 'Elixir Máximo',       emoji: '✨' }
};

/**
 * Formata drops para exibição no log de batalha.
 * 
 * @param {Array<{itemId: string, qty: number}>} drops - Array de drops
 * @param {Object} [itemNameMap] - Mapa de nomes customizado (opcional)
 * @returns {string[]} - Array de linhas de log formatadas
 */
export function formatDropsLog(drops, itemNameMap) {
    if (!Array.isArray(drops) || drops.length === 0) {
        return [];
    }
    
    const nameMap = itemNameMap || ITEM_DISPLAY;
    const lines = [];
    
    lines.push('🎁 Drops:');
    
    for (const drop of drops) {
        const display = nameMap[drop.itemId] || { name: drop.itemId, emoji: '📦' };
        lines.push(`   ${display.emoji} ${display.name} x${drop.qty}`);
    }
    
    return lines;
}

/**
 * Determina qual tabela de drop usar baseado no tipo de encontro.
 * 
 * @param {string} encounterType - Tipo do encontro ('wild', 'group_trainer', 'boss', 'trainer')
 * @returns {string|null} - ID da tabela de drop ou null se não houver
 */
export function getDropTableForEncounter(encounterType) {
    if (!encounterType) return null;
    
    const type = String(encounterType).toLowerCase();
    
    if (type === 'wild') {
        return 'DROP_001';
    }
    
    if (type === 'group_trainer' || type === 'trainer' || type === 'boss') {
        return 'DROP_002';
    }
    
    return null;
}
