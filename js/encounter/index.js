/**
 * ENCOUNTER MODULE — Exports centralizados
 *
 * Motor de geração de encontros selvagens por área progressiva.
 * Ver encounterEngine.js para documentação completa.
 * Ver worldMap.js para lógica de navegação de nós.
 */

export {
    pickRarityByWeight,
    pickSpeciesFromPool,
    generateEncounterLevel,
    applyModifiers,
    isRareSpot,
    findArea,
    resolveSpeciesPool,
    generateWildEncounter,
    pickEncounterType
} from './encounterEngine.js';

export {
    BIOME_EMOJI,
    BIOME_COLOR,
    getEnrichedNodes,
    isNodeUnlocked,
    getSpotsForLocation,
    findSpot,
    locationIdFromSpotId,
    buildSpotModifiers
} from './worldMap.js';
