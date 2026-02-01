/**
 * DATA LOADER MODULE (PR9A)
 * 
 * Carrega dados de arquivos JSON com fallback seguro.
 * Funções puras para validação e normalização.
 * Cache em memória para evitar fetches repetidos.
 */

// Cache em memória
let monstersCache = null;
let cacheStatus = { loaded: false, error: null, timestamp: null };

/**
 * Valida schema básico de um monster
 * @param {Object} monster - Monster data
 * @returns {boolean} true se válido
 */
export function validateMonsterSchema(monster) {
    if (!monster || typeof monster !== 'object') {
        return false;
    }
    
    // Campos obrigatórios
    const required = ['id', 'name', 'class', 'rarity', 'baseHp'];
    for (const field of required) {
        if (!monster[field]) {
            return false;
        }
    }
    
    // Validação de tipos básicos
    if (typeof monster.id !== 'string') return false;
    if (typeof monster.name !== 'string') return false;
    if (typeof monster.class !== 'string') return false;
    if (typeof monster.rarity !== 'string') return false;
    if (typeof monster.baseHp !== 'number' || monster.baseHp <= 0) return false;
    
    return true;
}

/**
 * Normaliza dados do monster, preenchendo campos faltantes com defaults
 * NÃO modifica valores existentes, apenas preenche faltantes
 * @param {Object} monster - Monster data
 * @returns {Object} Monster normalizado (novo objeto)
 */
export function normalizeMonsterData(monster) {
    if (!monster) return null;
    
    // Clone para não modificar o original
    const normalized = { ...monster };
    
    // Garantir que números sejam números (conversão defensiva)
    normalized.baseHp = Number(normalized.baseHp);
    
    // Converter strings para números se existirem, senão usar defaults
    if (normalized.baseAtk !== undefined && normalized.baseAtk !== null) {
        normalized.baseAtk = Number(normalized.baseAtk);
    } else {
        normalized.baseAtk = 5;
    }
    
    if (normalized.baseDef !== undefined && normalized.baseDef !== null) {
        normalized.baseDef = Number(normalized.baseDef);
    } else {
        normalized.baseDef = 3;
    }
    
    if (normalized.baseSpd !== undefined && normalized.baseSpd !== null) {
        normalized.baseSpd = Number(normalized.baseSpd);
    } else {
        normalized.baseSpd = 5;
    }
    
    if (normalized.baseEne !== undefined && normalized.baseEne !== null) {
        normalized.baseEne = Number(normalized.baseEne);
    } else {
        normalized.baseEne = 6;
    }
    
    if (!normalized.emoji) {
        normalized.emoji = '❓';
    }
    
    // Campos de evolução são opcionais, não tocar se não existirem
    // evolvesTo, evolvesAt permanecem undefined se não fornecidos
    
    return normalized;
}

/**
 * Loga mensagens com contexto estruturado
 * @param {string} level - 'info' | 'warn' | 'error'
 * @param {string} message - Mensagem
 * @param {Object} context - Contexto adicional
 */
function log(level, message, context = {}) {
    const logEntry = {
        module: 'DataLoader',
        level,
        message,
        timestamp: new Date().toISOString(),
        ...context
    };
    
    if (level === 'error') {
        console.error('[DataLoader]', message, context);
    } else if (level === 'warn') {
        console.warn('[DataLoader]', message, context);
    } else {
        console.log('[DataLoader]', message, context);
    }
}

/**
 * Carrega monsters do JSON e retorna Map por monsterId
 * Usa cache em memória. Se fetch falhar, retorna null e registra erro.
 * 
 * @returns {Promise<Map<string, Object>|null>} Map de monsters por ID, ou null se falhar
 */
export async function loadMonsters() {
    // Se já temos cache válido, retornar
    if (monstersCache && cacheStatus.loaded) {
        log('info', 'Returning cached monsters', { 
            count: monstersCache.size,
            cachedAt: cacheStatus.timestamp 
        });
        return monstersCache;
    }
    
    try {
        log('info', 'Fetching monsters.json...');
        
        const response = await fetch('data/monsters.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !Array.isArray(data.monsters)) {
            throw new Error('Invalid JSON structure: missing monsters array');
        }
        
        log('info', 'JSON loaded successfully', { 
            version: data.version,
            count: data.monsters.length 
        });
        
        // Validar e normalizar cada monster
        const validMonsters = [];
        const invalidIds = [];
        
        for (const monster of data.monsters) {
            if (validateMonsterSchema(monster)) {
                const normalized = normalizeMonsterData(monster);
                validMonsters.push(normalized);
            } else {
                invalidIds.push(monster?.id || 'UNKNOWN');
                log('warn', 'Invalid monster schema', { monsterId: monster?.id });
            }
        }
        
        if (invalidIds.length > 0) {
            log('warn', 'Some monsters failed validation', { 
                invalidCount: invalidIds.length,
                invalidIds 
            });
        }
        
        // Criar Map por ID
        const monstersMap = new Map();
        for (const monster of validMonsters) {
            monstersMap.set(monster.id, monster);
        }
        
        // Atualizar cache
        monstersCache = monstersMap;
        cacheStatus = {
            loaded: true,
            error: null,
            timestamp: new Date().toISOString()
        };
        
        log('info', 'Monsters cached successfully', { 
            validCount: validMonsters.length,
            totalInFile: data.monsters.length
        });
        
        return monstersMap;
        
    } catch (error) {
        log('error', 'Failed to load monsters.json', { 
            error: error.message,
            stack: error.stack 
        });
        
        cacheStatus = {
            loaded: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        
        return null;
    }
}

/**
 * Retorna status do cache
 * @returns {Object} Cache status
 */
export function getCacheStatus() {
    return {
        ...cacheStatus,
        cachedCount: monstersCache ? monstersCache.size : 0
    };
}

/**
 * Limpa cache (útil para testes)
 */
export function clearCache() {
    monstersCache = null;
    cacheStatus = { loaded: false, error: null, timestamp: null };
}
