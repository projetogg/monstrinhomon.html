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

// Skills (PR10A + FASE A)
export {
    loadSkills,
    getSkillsMapSync,
    validateSkillSchema,
    normalizeSkillData,
    getSkillsCacheStatus,
    clearSkillsCache,
    buildRuntimeSkillDefs,
    getSkillDefsSync
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

// Drop System
export {
    generateDrops,
    addDropsToInventory,
    formatDropsLog,
    getDropTableForEncounter,
    resolveItemId,
    DROP_TABLES
} from './dropSystem.js';

// Quest System
export {
    QUESTS_DATA,
    QUEST_OBJECTIVE_TYPES,
    getQuest,
    getQuestsByLocation,
    isQuestAvailable,
    getNextQuest,
    getQuestChain
} from './questSystem.js';

// Starters (fonte única de verdade para starter por classe)
export {
    STARTER_BY_CLASS,
    LEGACY_BUGGY_STARTER_IDS,
    isContaminatedStarterId,
    migrateContaminatedStarterMeta
} from './starters.js';
