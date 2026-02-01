/**
 * DATA MODULE INDEX (PR9A + PR10A + PR14A)
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

// Items (PR11B + PR14A)
export {
    loadItems,
    getItemById,
    getAllItems,
    getItemsByTier,
    canItemBreak,
    getItemBreakChance,
    getItemStats,
    getItemsByCategory,
    getAllEggs
} from './itemsLoader.js';

// Eggs (PR14A)
export {
    chooseRandom,
    getMonstersByRarity,
    hatchEgg,
    isValidEgg,
    getEggInfo
} from './eggHatcher.js';

// Egg UI (PR14A)
export {
    handleHatchEgg,
    renderEggActionButton,
    initEggUI,
    checkIfEgg
} from './eggUI.js';
