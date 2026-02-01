/**
 * ITEMS LOADER - PR11B
 * 
 * Carrega e valida definições de itens equipáveis do arquivo items.json
 * 
 * Estrutura de Item:
 * {
 *   id: string,              // ID único do item (ex: "IT_ATK_COMUM")
 *   name: string,            // Nome exibido
 *   description: string,     // Descrição do efeito
 *   type: "held",           // Tipo do item (sempre "held" para equipáveis)
 *   tier: string,           // Tier: "comum", "incomum", "raro", "mistico", "lendario"
 *   stats: {                // Bônus de stats
 *     atk: number,          // Bônus de ATK
 *     def: number           // Bônus de DEF
 *   },
 *   break: {                // Regras de quebra
 *     enabled: boolean,     // Se true, item pode quebrar
 *     chance: number        // Chance de quebra (0.0 a 1.0)
 *   }
 * }
 */

let itemsCache = null;
let itemsById = null;

/**
 * Carrega items.json
 * @returns {Promise<Array>} Array de itens
 */
export async function loadItems() {
    if (itemsCache) {
        return itemsCache;
    }

    try {
        const response = await fetch('/data/items.json');
        if (!response.ok) {
            throw new Error(`Failed to load items.json: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data || !Array.isArray(data.items)) {
            throw new Error('items.json: invalid format (expected { items: [...] })');
        }

        // Validar cada item
        const validItems = [];
        for (const item of data.items) {
            if (validateItem(item)) {
                validItems.push(item);
            } else {
                console.warn('[ItemsLoader] Invalid item skipped:', item?.id || 'unknown');
            }
        }

        itemsCache = validItems;
        buildItemsIndex();
        
        console.log(`[ItemsLoader] Loaded ${validItems.length} items`);
        return validItems;

    } catch (error) {
        console.error('[ItemsLoader] Failed to load items:', error);
        itemsCache = [];
        return [];
    }
}

/**
 * Valida estrutura de um item
 * @param {object} item - Item a validar
 * @returns {boolean} true se válido
 */
function validateItem(item) {
    if (!item || typeof item !== 'object') return false;
    
    // Campos obrigatórios
    if (!item.id || typeof item.id !== 'string') return false;
    if (!item.name || typeof item.name !== 'string') return false;
    if (!item.type || item.type !== 'held') return false;
    if (!item.tier || typeof item.tier !== 'string') return false;
    
    // Stats obrigatórios
    if (!item.stats || typeof item.stats !== 'object') return false;
    if (typeof item.stats.atk !== 'number') return false;
    if (typeof item.stats.def !== 'number') return false;
    
    // Break rules obrigatórias
    if (!item.break || typeof item.break !== 'object') return false;
    if (typeof item.break.enabled !== 'boolean') return false;
    if (typeof item.break.chance !== 'number') return false;
    
    // Chance de quebra deve estar entre 0 e 1
    if (item.break.chance < 0 || item.break.chance > 1) return false;
    
    return true;
}

/**
 * Constrói índice de itens por ID para acesso rápido
 */
function buildItemsIndex() {
    itemsById = {};
    if (itemsCache) {
        for (const item of itemsCache) {
            itemsById[item.id] = item;
        }
    }
}

/**
 * Busca item por ID
 * @param {string} itemId - ID do item
 * @returns {object|null} Item ou null se não encontrado
 */
export function getItemById(itemId) {
    if (!itemsById) {
        console.warn('[ItemsLoader] Items not loaded yet');
        return null;
    }
    return itemsById[itemId] || null;
}

/**
 * Retorna todos os itens carregados
 * @returns {Array} Array de itens
 */
export function getAllItems() {
    return itemsCache || [];
}

/**
 * Filtra itens por tier
 * @param {string} tier - Tier desejado
 * @returns {Array} Itens do tier especificado
 */
export function getItemsByTier(tier) {
    if (!itemsCache) return [];
    return itemsCache.filter(item => item.tier === tier);
}

/**
 * Verifica se um item pode quebrar
 * @param {string} itemId - ID do item
 * @returns {boolean} true se o item pode quebrar
 */
export function canItemBreak(itemId) {
    const item = getItemById(itemId);
    if (!item) return false;
    return item.break.enabled === true;
}

/**
 * Retorna chance de quebra de um item
 * @param {string} itemId - ID do item
 * @returns {number} Chance de quebra (0.0 a 1.0) ou 0 se não quebra
 */
export function getItemBreakChance(itemId) {
    const item = getItemById(itemId);
    if (!item || !item.break.enabled) return 0;
    return item.break.chance;
}

/**
 * Retorna bônus de stats de um item
 * @param {string} itemId - ID do item
 * @returns {object} { atk: number, def: number } ou { atk: 0, def: 0 } se item inválido
 */
export function getItemStats(itemId) {
    const item = getItemById(itemId);
    if (!item || !item.stats) {
        return { atk: 0, def: 0 };
    }
    return {
        atk: Number(item.stats.atk) || 0,
        def: Number(item.stats.def) || 0
    };
}
