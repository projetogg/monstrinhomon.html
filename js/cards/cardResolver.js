/**
 * CARD RESOLVER — adaptador fino entre skills efetivas e Card Layer visual.
 * Não altera skill, não chama kit swap e não toca mecânica de combate.
 */

import { findCardForSkill } from './cardLayer.js';

export function resolveCardsForMonster(monster, options = {}) {
    const getMonsterSkills = options.getMonsterSkills;
    if (typeof getMonsterSkills !== 'function') return [];

    const skills = getMonsterSkills(monster) || [];
    if (!Array.isArray(skills) || skills.length === 0) return [];

    const findCard = typeof options.findCardForSkill === 'function'
        ? options.findCardForSkill
        : findCardForSkill;

    return skills.map((skill, skillIndex) => {
        const mapping = findCard(skill, {
            catalog: options.catalog,
            index: options.index,
        });

        return {
            skill,
            skillIndex,
            card: mapping.card || null,
            stage: mapping.stage || null,
            mapped: !!(mapping.card && mapping.stage),
            reason: mapping.reason || null,
            usedDefaultStage: mapping.usedDefaultStage === true,
        };
    });
}
