/**
 * DATA MODULE INDEX (PR9A + PR10A)
 * 
 * Exporta funções de data loading
 */

// Monsters (PR9A)
export {
    loadMonsters,
    getMonstersMapSync,
    validateMonsterSchema,
    normalizeMonsterData,
    getCacheStatus,
    clearCache
} from './dataLoader.js';

// Skills (PR10A)
export {
    loadSkills,
    getSkillsMapSync,
    validateSkillSchema,
    normalizeSkillData,
    getSkillsCacheStatus,
    clearSkillsCache
} from './skillsLoader.js';
