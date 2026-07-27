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

function normalizeStageIndex(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Resolve a identidade visual de uma skill efetiva sem modificar a skill original.
 *
 * Skills vindas de kit swap podem não carregar class/groupKey/stageIndex, ou podem
 * carregar uma identidade diferente da skill canônica substituída. Para a Fase 1C,
 * apenas aliases explícitos e seguros são aceitos. Kit swaps desconhecidos continuam
 * sem mapeamento e acionam fallback legado.
 *
 * Skills canônicas (Guerreiro e demais classes) devem chegar com class/groupKey/stageIndex
 * preservados pelo runtime (buildRuntimeSkillDefs). O resolver não decide stageIndex
 * por conta própria — esse contrato pertence ao loader/runtime.
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
