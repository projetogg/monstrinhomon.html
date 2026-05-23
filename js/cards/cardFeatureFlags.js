/**
 * CARD LAYER — Feature Flags canônicas.
 * Fonte única de defaults da Fase 1B.
 * Não deve ser importado por módulos de mecânica ou combate.
 */

export const CARD_LAYER_FEATURE_FLAGS = Object.freeze({
    /** Habilita Card Layer visual no Wild Loop. Fase 1B: desligado por padrão. */
    enabled: false,

    /** Classes piloto para renderização via Card Layer. */
    pilotClasses: ['Guerreiro'],

    /** Quando true, cai para UI legada se Card Layer não tiver mapeamento. */
    fallbackToSkillUI: true,

    /** Quando true, emite warn no console para skills sem card mapeado. */
    logUnmappedSkills: true,

    /** Quando true, renderiza placeholder visual para slots vazios (dev only). */
    devShowMissingSlots: false,
});
