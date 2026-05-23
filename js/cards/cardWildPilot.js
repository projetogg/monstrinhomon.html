/**
 * CARD LAYER — integração visual do Wild Loop (Fase 1C).
 * Camada de apresentação com fallback total para a UI legada.
 * Não executa mecânica, apenas decide/renderiza HTML visual.
 */

import { CARD_LAYER_FEATURE_FLAGS } from './cardFeatureFlags.js';

function toClassName(value) {
    return String(value || '').trim();
}

export function renderLegacyWildSkillGrid(skills, runtimeContext = {}) {
    const safeSkills = Array.isArray(skills) ? skills : [];
    const playerMonster = runtimeContext.monster || null;
    const canUseSkillNow = typeof runtimeContext.canUseSkillNow === 'function'
        ? runtimeContext.canUseSkillNow
        : () => true;
    const tutorialAllows = runtimeContext.tutorialAllows !== false;

    const slots = [0, 1, 2, 3].map(idx => {
        const skill = safeSkills[idx];
        if (!skill) return '<div class="btn-skill-empty" aria-hidden="true"></div>';

        const name = skill.name || skill.nome || String(skill.id || 'Habilidade');
        const cost = Number(skill.cost ?? skill.energy_cost ?? skill.eneCost ?? 0) || 0;
        const icon = skill.icon || '';
        const kitBadge = skill._kitSwapId ? (skill._kitSwapId.endsWith('_ii') ? ' ⭐' : ' 🌟') : '';
        const label = [icon, name].filter(Boolean).join(' ') + kitBadge;
        const canUse = canUseSkillNow(skill, playerMonster) && Number(playerMonster?.hp || 0) > 0;
        const target = skill.target || '';
        const skillType = (skill.type || '').toUpperCase();
        const isOff = (target === 'enemy' || target === 'area' || target === 'Inimigo' || target === 'Área')
            || (target !== 'self' && target !== 'ally' && target !== 'Self' && target !== 'Aliado' && skillType === 'DAMAGE');
        const btnClass = isOff ? 'btn-skill-offensive' : 'btn-skill-defensive';
        const skillDesc = skill.desc || '';
        const skillMeta = [skill.category, skill.status ? `→ ${skill.status}` : null].filter(Boolean).join(' · ');
        const currentEne = Number(playerMonster?.ene) || 0;
        const tooltip = !tutorialAllows
            ? 'Tutorial: ainda não liberado'
            : (!canUse
                ? `ENE insuficiente (${currentEne}/${cost})`
                : (skillMeta ? `${skillDesc}\n${skillMeta}` : skillDesc));

        return `<button class="${btnClass}" onclick="useSkillWild(${idx})"
                ${!canUse || !tutorialAllows ? 'disabled' : ''}
                title="${tooltip}">${label}</button>`;
    });

    return `<div class="skill-grid">${slots.join('')}</div>`;
}

export function canUseCardLayerPilot(monster, flags = CARD_LAYER_FEATURE_FLAGS) {
    if (!flags || flags.enabled !== true) return false;
    const monsterClass = toClassName(monster?.class);
    if (!monsterClass) return false;
    if (!Array.isArray(flags.pilotClasses) || flags.pilotClasses.length === 0) return false;
    return flags.pilotClasses.includes(monsterClass);
}

export function buildWildSkillGridHtml(monster, options = {}) {
    const flags = options.flags || CARD_LAYER_FEATURE_FLAGS;
    const resolveMonsterSkills = options.resolveMonsterSkills;
    const getMonsterSkills = options.getMonsterSkills;
    const resolveCardsForMonster = options.resolveCardsForMonster;
    const renderCardGrid = options.renderCardGrid;
    const catalog = options.catalog || null;
    const logger = options.logger || console;

    if (typeof resolveMonsterSkills !== 'function') {
        return { mode: 'legacy', html: '<div class="skill-grid"></div>', reason: 'missing_resolveMonsterSkills' };
    }

    const skills = resolveMonsterSkills(monster) || [];
    const legacyHtml = renderLegacyWildSkillGrid(skills, {
        monster,
        canUseSkillNow: options.canUseSkillNow,
        tutorialAllows: options.tutorialAllows,
    });

    if (!canUseCardLayerPilot(monster, flags)) {
        return { mode: 'legacy', html: legacyHtml, reason: 'pilot_disabled' };
    }

    if (!catalog || !Array.isArray(catalog.cards) || catalog.cards.length === 0) {
        return { mode: 'legacy', html: legacyHtml, reason: 'catalog_unavailable' };
    }

    if (typeof getMonsterSkills !== 'function'
        || typeof resolveCardsForMonster !== 'function'
        || typeof renderCardGrid !== 'function') {
        return { mode: 'legacy', html: legacyHtml, reason: 'missing_card_layer_dependencies' };
    }

    try {
        const entries = resolveCardsForMonster(monster, { getMonsterSkills });
        if (!Array.isArray(entries) || entries.length === 0) {
            return { mode: 'legacy', html: legacyHtml, reason: 'empty_card_entries' };
        }

        const unmappedEntries = entries.filter(entry => !entry?.mapped);
        if (unmappedEntries.length > 0 && flags.logUnmappedSkills && typeof logger?.warn === 'function') {
            logger.warn('[CardLayer][Fase1C] Skills sem card mapeado; fallback para UI legada.', {
                class: monster?.class,
                reasons: unmappedEntries.map(entry => entry.reason || 'unmapped'),
            });
        }

        if (unmappedEntries.length > 0 && flags.fallbackToSkillUI !== false) {
            return { mode: 'legacy', html: legacyHtml, reason: 'unmapped_skills_fallback' };
        }

        const mappedEntries = entries.filter(entry => entry?.mapped);
        if (mappedEntries.length === 0) {
            return { mode: 'legacy', html: legacyHtml, reason: 'no_mapped_entries' };
        }

        const cardHtml = renderCardGrid(mappedEntries, {
            monster,
            canUseSkillNow: options.canUseSkillNow,
            tutorialAllows: options.tutorialAllows,
        });

        if (!cardHtml) {
            return { mode: 'legacy', html: legacyHtml, reason: 'empty_card_html' };
        }

        return { mode: 'card-layer', html: cardHtml, reason: null };
    } catch (error) {
        if (typeof logger?.warn === 'function') {
            logger.warn('[CardLayer][Fase1C] Falha ao renderizar piloto; fallback para UI legada.', error);
        }
        return { mode: 'legacy', html: legacyHtml, reason: 'card_layer_error' };
    }
}

export function wireCardLayerSkillButtons(rootElement, onUseSkill) {
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return 0;
    if (typeof onUseSkill !== 'function') return 0;

    const buttons = rootElement.querySelectorAll('.skill-grid--card-layer .card-layer-skill[data-skill-index]');
    let wiredCount = 0;

    buttons.forEach((button) => {
        if (!button || button.dataset?.cardLayerBound === 'true') return;
        if (!button.dataset) button.dataset = {};
        button.dataset.cardLayerBound = 'true';
        wiredCount += 1;
        button.addEventListener('click', () => {
            const parsed = Number.parseInt(button.dataset.skillIndex, 10);
            if (!Number.isInteger(parsed) || parsed < 0) return;
            onUseSkill(parsed);
        });
    });

    return wiredCount;
}
