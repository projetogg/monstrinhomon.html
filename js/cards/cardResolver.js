/**
 * CARD RESOLVER — adaptador fino entre skills efetivas e Card Layer visual.
 * Não altera skill, não chama kit swap e não toca mecânica de combate.
 */

import { findCardForSkill } from './cardLayer.js';

const KIT_SWAP_CARD_IDENTITY_ALIASES = Object.freeze({
    /**
     * Ferrozimon/shieldhorn troca a skill base do Guerreiro por Golpe Pesado I.
     * A skill efetiva continua sendo executada pelo runtime legado; este alias é
     * apenas visual para a Card Layer conseguir usar o card base do slot 1.
     */
    shieldhorn_heavy_strike: Object.freeze({
        class: 'Guerreiro',
        groupKey: 'Golpe de Espada',
        stageIndex: 0,
        cardAliasReason: 'kit_swap_visual_alias',
    }),
    /**
     * shieldhorn_heavy_strike_ii é a versão II do kit swap do Ferrozimon/Cavalheiromon.
     * Mapeia visualmente para o estágio II de Golpe de Espada (stageIndex: 1).
     */
    shieldhorn_heavy_strike_ii: Object.freeze({
        class: 'Guerreiro',
        groupKey: 'Golpe de Espada',
        stageIndex: 1,
        cardAliasReason: 'kit_swap_visual_alias',
    }),
});

/**
 * Mapa de inferência visual por nome para skills canônicas do Guerreiro.
 * Usado apenas quando a skill chega sem class e/ou groupKey.
 * Apenas visual — não altera mecânica nem skill original.
 */
const WARRIOR_SKILL_NAME_VISUAL_MAP = Object.freeze({
    'Escudo I':            Object.freeze({ class: 'Guerreiro', groupKey: 'Escudo',        stageIndex: 0 }),
    'Escudo II':           Object.freeze({ class: 'Guerreiro', groupKey: 'Escudo',        stageIndex: 1 }),
    'Escudo III':          Object.freeze({ class: 'Guerreiro', groupKey: 'Escudo',        stageIndex: 2 }),
    'Golpe de Espada I':   Object.freeze({ class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0 }),
    'Golpe de Espada II':  Object.freeze({ class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 1 }),
    'Golpe de Espada III': Object.freeze({ class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 2 }),
    'Provocar I':          Object.freeze({ class: 'Guerreiro', groupKey: 'Provocar',      stageIndex: 0 }),
    'Provocar II':         Object.freeze({ class: 'Guerreiro', groupKey: 'Provocar',      stageIndex: 1 }),
    'Provocar III':        Object.freeze({ class: 'Guerreiro', groupKey: 'Provocar',      stageIndex: 2 }),
});

function normalizeStageIndex(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Resolve a identidade visual de uma skill efetiva sem modificar a skill original.
 *
 * Prioridade de resolução:
 * 1. Alias explícito de kit swap (KIT_SWAP_CARD_IDENTITY_ALIASES).
 * 2. Inferência por nome canônico do Guerreiro quando class/groupKey ausentes
 *    (WARRIOR_SKILL_NAME_VISUAL_MAP). Apenas visual — entry.skill não é mutada.
 *
 * Kit swaps desconhecidos e skills sem mapeamento por nome continuam sem
 * identidade visual e acionam fallback legado.
 */
export function resolveCardSkillIdentity(skill) {
    if (!skill || typeof skill !== 'object') return skill;

    const kitSwapId = String(skill._kitSwapId || '').trim();
    const alias = kitSwapId ? KIT_SWAP_CARD_IDENTITY_ALIASES[kitSwapId] : null;

    if (alias) {
        return {
            ...skill,
            class: alias.class,
            groupKey: alias.groupKey,
            stageIndex: normalizeStageIndex(skill.stageIndex, alias.stageIndex),
            _cardLayerAlias: true,
            _cardLayerAliasReason: alias.cardAliasReason,
            _cardLayerAliasSource: kitSwapId,
        };
    }

    const hasClass = String(skill.class || '').trim() !== '';
    const hasGroupKey = String(skill.groupKey || '').trim() !== '';

    if (!hasClass || !hasGroupKey) {
        const skillName = String(skill.name || '').trim();
        const inferred = skillName ? WARRIOR_SKILL_NAME_VISUAL_MAP[skillName] : null;

        if (inferred) {
            return {
                ...skill,
                class: inferred.class,
                groupKey: inferred.groupKey,
                stageIndex: normalizeStageIndex(skill.stageIndex, inferred.stageIndex),
                _visualIdentityInferred: true,
                _visualIdentityReason: 'warrior_skill_name_alias',
            };
        }
    }

    return skill;
}

export function resolveCardsForMonster(monster, options = {}) {
    const getMonsterSkills = options.getMonsterSkills;
    if (typeof getMonsterSkills !== 'function') return [];

    const skills = getMonsterSkills(monster) || [];
    if (!Array.isArray(skills) || skills.length === 0) return [];

    const findCard = typeof options.findCardForSkill === 'function'
        ? options.findCardForSkill
        : findCardForSkill;

    return skills.map((skill, skillIndex) => {
        const lookupSkill = resolveCardSkillIdentity(skill);
        const mapping = findCard(lookupSkill, {
            catalog: options.catalog,
            index: options.index,
        });

        return {
            skill,
            lookupSkill,
            skillIndex,
            card: mapping.card || null,
            stage: mapping.stage || null,
            mapped: !!(mapping.card && mapping.stage),
            reason: mapping.reason || null,
            usedDefaultStage: mapping.usedDefaultStage === true,
            cardAliasApplied: !!lookupSkill?._cardLayerAlias,
            cardAliasReason: lookupSkill?._cardLayerAliasReason || null,
        };
    });
}
