/**
 * SKILLS LOADER MODULE (PR10A)
 * 
 * Carrega skills de arquivos JSON com fallback seguro.
 * Funções puras para validação e normalização.
 * Cache em memória para evitar fetches repetidos.
 * 
 * Segue o mesmo padrão do dataLoader.js (PR9A)
 */

// Cache em memória
let skillsCache = null;
let cacheStatus = { loaded: false, error: null, timestamp: null };

/**
 * Valida schema básico de uma skill
 * @param {Object} skill - Skill data
 * @returns {boolean} true se válido
 */
export function validateSkillSchema(skill) {
    if (!skill || typeof skill !== 'object') {
        return false;
    }
    
    // Campos obrigatórios
    const required = ['id', 'name', 'class', 'category', 'power', 'accuracy', 'energy_cost', 'target'];
    for (const field of required) {
        if (skill[field] === undefined || skill[field] === null) {
            return false;
        }
    }
    
    // Validação de tipos básicos
    if (typeof skill.id !== 'string') return false;
    if (typeof skill.name !== 'string') return false;
    if (typeof skill.class !== 'string') return false;
    if (typeof skill.category !== 'string') return false;
    if (typeof skill.target !== 'string') return false;
    
    // Validação de números
    if (typeof skill.power !== 'number' || skill.power < 0) return false;
    if (typeof skill.accuracy !== 'number' || skill.accuracy < 0 || skill.accuracy > 1) return false;
    if (typeof skill.energy_cost !== 'number' || skill.energy_cost < 0) return false;
    
    return true;
}

/**
 * Normaliza dados da skill, preenchendo campos faltantes com defaults
 * NÃO modifica valores existentes, apenas preenche faltantes
 * @param {Object} skill - Skill data
 * @returns {Object} Skill normalizada (novo objeto)
 */
export function normalizeSkillData(skill) {
    if (!skill) return null;
    
    // Clone para não modificar o original
    const normalized = { ...skill };
    
    // Garantir que números sejam números (conversão defensiva)
    normalized.power = Number(normalized.power);
    normalized.accuracy = Number(normalized.accuracy);
    normalized.energy_cost = Number(normalized.energy_cost);
    
    // Campos opcionais com defaults
    if (!normalized.status) {
        normalized.status = '';
    }
    
    if (!normalized.desc) {
        normalized.desc = '';
    }
    
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
        module: 'SkillsLoader',
        level,
        message,
        timestamp: new Date().toISOString(),
        ...context
    };
    
    if (level === 'error') {
        console.error('[SkillsLoader]', message, context);
    } else if (level === 'warn') {
        console.warn('[SkillsLoader]', message, context);
    } else {
        console.log('[SkillsLoader]', message, context);
    }
}

/**
 * Carrega skills do JSON e retorna Map por skillId
 * Usa cache em memória. Se fetch falhar, retorna null e registra erro.
 * 
 * @returns {Promise<Map<string, Object>|null>} Map de skills por ID, ou null se falhar
 */
export async function loadSkills() {
    // Se já temos cache válido, retornar
    if (skillsCache && cacheStatus.loaded) {
        log('info', 'Returning cached skills', { 
            count: skillsCache.size,
            cachedAt: cacheStatus.timestamp 
        });
        return skillsCache;
    }
    
    try {
        log('info', 'Fetching skills.json...');
        
        const response = await fetch('data/skills.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data || !Array.isArray(data.skills)) {
            throw new Error('Invalid JSON structure: missing skills array');
        }
        
        log('info', 'JSON loaded successfully', { 
            version: data.version,
            count: data.skills.length 
        });
        
        // Validar e normalizar cada skill
        const validSkills = [];
        const invalidIds = [];
        
        for (const skill of data.skills) {
            if (validateSkillSchema(skill)) {
                const normalized = normalizeSkillData(skill);
                validSkills.push(normalized);
            } else {
                invalidIds.push(skill?.id || 'UNKNOWN');
                log('warn', 'Invalid skill schema', { skillId: skill?.id });
            }
        }
        
        if (invalidIds.length > 0) {
            log('warn', 'Some skills failed validation', { 
                invalidCount: invalidIds.length,
                invalidIds 
            });
        }
        
        // Criar Map por ID
        const skillsMap = new Map();
        for (const skill of validSkills) {
            skillsMap.set(skill.id, skill);
        }
        
        // Atualizar cache
        skillsCache = skillsMap;
        cacheStatus = {
            loaded: true,
            error: null,
            timestamp: new Date().toISOString()
        };
        
        log('info', 'Skills cached successfully', { 
            validCount: validSkills.length,
            totalInFile: data.skills.length
        });
        
        return skillsMap;
        
    } catch (error) {
        log('error', 'Failed to load skills.json', { 
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
 * Retorna Map de skills SINCRONAMENTE (sem fetch)
 * Usado por getSkillById() e outras funções para lookup rápido
 * @returns {Map<string, Object>|null} Map de skills se já carregado, null caso contrário
 */
export function getSkillsMapSync() {
    return skillsCache;
}

/**
 * Retorna status do cache
 * @returns {Object} Cache status
 */
export function getSkillsCacheStatus() {
    return {
        ...cacheStatus,
        cachedCount: skillsCache ? skillsCache.size : 0
    };
}

/**
 * Limpa cache (útil para testes)
 */
export function clearSkillsCache() {
    skillsCache = null;
    cacheStatus = { loaded: false, error: null, timestamp: null };
}
