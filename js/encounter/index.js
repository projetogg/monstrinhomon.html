/**
 * ENCOUNTER MODULE — Exports centralizados
 *
 * Motor de geração de encontros selvagens por área progressiva.
 * Ver encounterEngine.js para documentação completa.
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
