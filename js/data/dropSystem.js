/**
 * DROP SYSTEM MODULE
 *
 * Sistema de drops/loot para batalhas.
 * Gera itens aleatórios após vitórias baseado em tabelas de drop.
 *
 * Dados baseados em DROPS.csv:
 * - DROP_001: Encontro selvagem básico (LOC_001, LOC_002)
 * - DROP_002: Treinador básico (LOC_001, LOC_002)
 * - DROP_003: Boss de bioma (qualquer local)
 * - DROP_004: Selvagem intermediário (LOC_003, LOC_004, LOC_005)
 * - DROP_005: Selvagem avançado (LOC_006, LOC_007)
 * - DROP_006: Selvagem elite (LOC_008)
 * - DROP_007: Treinador intermediário (LOC_003, LOC_004, LOC_005)
 * - DROP_008: Treinador avançado (LOC_006, LOC_007, LOC_008)
 *
 * IDs mapeados:
 * - IT_CAP_01 (legado) → CLASTERORB_COMUM (atual)
 * - IT_CAP_02 (legado) → CLASTERORB_INCOMUM (atual)
 * - IT_HEAL_01 → IT_HEAL_01 (sem mudança)
 */

// ═══════════════════════════════════════════════════
// DROP TABLES (baseado em DROPS.csv)
// ═══════════════════════════════════════════════════

/**
 * Mapeamento de IDs legados para IDs atuais
 * (ITENS.csv usa IT_CAP_01/IT_CAP_02, mas o sistema usa CLASTERORB_*)
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
    // ── DROP_001: Selvagem básico (LOC_001, LOC_002) ──────────────────────
    'DROP_001': {
        id: 'DROP_001',
        name: 'Encontro Selvagem Básico',
        entries: [
            { itemId: 'CLASTERORB_COMUM', chance: 0.35, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_01',       chance: 0.25, minQty: 1, maxQty: 2 }
        ]
    },
    // ── DROP_002: Treinador básico (LOC_001, LOC_002) ─────────────────────
    'DROP_002': {
        id: 'DROP_002',
        name: 'Treinador Básico',
        entries: [
            { itemId: 'CLASTERORB_COMUM', chance: 0.50, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_01',       chance: 0.40, minQty: 1, maxQty: 2 }
        ]
    },
    // ── DROP_003: Boss de bioma (qualquer local) ──────────────────────────
    'DROP_003': {
        id: 'DROP_003',
        name: 'Boss de Bioma',
        entries: [
            { itemId: 'CLASTERORB_INCOMUM', chance: 0.80, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_02',         chance: 0.60, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_03',         chance: 0.25, minQty: 1, maxQty: 1 },
            { itemId: 'EGG_U',              chance: 0.10, minQty: 1, maxQty: 1 }
        ]
    },
    // ── DROP_004: Selvagem intermediário (LOC_003, LOC_004, LOC_005) ───────
    'DROP_004': {
        id: 'DROP_004',
        name: 'Encontro Selvagem Intermediário',
        entries: [
            { itemId: 'CLASTERORB_COMUM', chance: 0.30, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_01',       chance: 0.20, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_02',       chance: 0.10, minQty: 1, maxQty: 1 },
            { itemId: 'EGG_C',            chance: 0.05, minQty: 1, maxQty: 1 }
        ]
    },
    // ── DROP_005: Selvagem avançado (LOC_006, LOC_007) ────────────────────
    'DROP_005': {
        id: 'DROP_005',
        name: 'Encontro Selvagem Avançado',
        entries: [
            { itemId: 'CLASTERORB_INCOMUM', chance: 0.25, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_02',         chance: 0.20, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_03',         chance: 0.08, minQty: 1, maxQty: 1 },
            { itemId: 'EGG_C',              chance: 0.08, minQty: 1, maxQty: 1 }
        ]
    },
    // ── DROP_006: Selvagem elite (LOC_008) ────────────────────────────────
    'DROP_006': {
        id: 'DROP_006',
        name: 'Encontro Selvagem Elite',
        entries: [
            { itemId: 'CLASTERORB_INCOMUM', chance: 0.30, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_02',         chance: 0.25, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_03',         chance: 0.12, minQty: 1, maxQty: 1 },
            { itemId: 'EGG_U',              chance: 0.05, minQty: 1, maxQty: 1 }
        ]
    },
    // ── DROP_007: Treinador intermediário (LOC_003, LOC_004, LOC_005) ──────
    'DROP_007': {
        id: 'DROP_007',
        name: 'Treinador Intermediário',
        entries: [
            { itemId: 'CLASTERORB_COMUM', chance: 0.45, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_01',       chance: 0.35, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_02',       chance: 0.20, minQty: 1, maxQty: 1 },
            { itemId: 'EGG_C',            chance: 0.10, minQty: 1, maxQty: 1 }
        ]
    },
    // ── DROP_008: Treinador avançado (LOC_006, LOC_007, LOC_008) ─────────
    'DROP_008': {
        id: 'DROP_008',
        name: 'Treinador Avançado',
        entries: [
            { itemId: 'CLASTERORB_INCOMUM', chance: 0.40, minQty: 1, maxQty: 1 },
            { itemId: 'IT_HEAL_02',         chance: 0.35, minQty: 1, maxQty: 2 },
            { itemId: 'IT_HEAL_03',         chance: 0.15, minQty: 1, maxQty: 1 },
            { itemId: 'EGG_U',              chance: 0.08, minQty: 1, maxQty: 1 }
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
    'IT_HEAL_03':         { name: 'Elixir Máximo',       emoji: '✨' },
    'EGG_C':              { name: 'Ovo Comum',           emoji: '🥚' },
    'EGG_U':              { name: 'Ovo Incomum',         emoji: '🪺' },
    'EGG_R':              { name: 'Ovo Raro',            emoji: '💎' }
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

// ═══════════════════════════════════════════════════
// MAPEAMENTO DE DROPS POR LOCAL
// ═══════════════════════════════════════════════════

/**
 * Drop table para encontros selvagens por local.
 * Locais iniciais usam DROP_001; biomas intermediários/avançados
 * usam tabelas progressivas com melhores recompensas.
 */
const LOCATION_WILD_DROP = {
    'LOC_001': 'DROP_001',
    'LOC_002': 'DROP_001',
    'LOC_003': 'DROP_004',
    'LOC_004': 'DROP_004',
    'LOC_005': 'DROP_004',
    'LOC_006': 'DROP_005',
    'LOC_007': 'DROP_005',
    'LOC_008': 'DROP_006'
};

/**
 * Drop table para encontros de treinador por local.
 * Progride de DROP_002 (básico) → DROP_007 (intermediário) → DROP_008 (avançado).
 */
const LOCATION_TRAINER_DROP = {
    'LOC_001': 'DROP_002',
    'LOC_002': 'DROP_002',
    'LOC_003': 'DROP_007',
    'LOC_004': 'DROP_007',
    'LOC_005': 'DROP_007',
    'LOC_006': 'DROP_008',
    'LOC_007': 'DROP_008',
    'LOC_008': 'DROP_008'
};

/**
 * Determina qual tabela de drop usar baseado no tipo de encontro e local.
 * Boss sempre usa DROP_003 (independente do local).
 * Selvagem e Treinador usam tabelas progressivas por local.
 *
 * @param {string} encounterType - Tipo do encontro ('wild', 'group_trainer', 'boss', 'trainer')
 * @param {string} [locationId]  - ID do local (ex: 'LOC_001'). Opcional; sem ele usa tabela base.
 * @returns {string|null} - ID da tabela de drop ou null se não houver
 */
export function getDropTableForEncounter(encounterType, locationId) {
    if (!encounterType) return null;

    const type = String(encounterType).toLowerCase();

    // Boss sempre usa DROP_003 (recompensa especial de chefe)
    if (type === 'boss') {
        return 'DROP_003';
    }

    if (type === 'wild') {
        if (locationId && LOCATION_WILD_DROP[locationId]) {
            return LOCATION_WILD_DROP[locationId];
        }
        return 'DROP_001';
    }

    if (type === 'group_trainer' || type === 'trainer') {
        if (locationId && LOCATION_TRAINER_DROP[locationId]) {
            return LOCATION_TRAINER_DROP[locationId];
        }
        return 'DROP_002';
    }

    return null;
}
