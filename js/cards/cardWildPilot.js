/**
 * CARD LAYER — integração visual do Wild Loop (Fase 1C).
 * Camada de apresentação com fallback total para a UI legada.
 * Não executa mecânica, apenas decide/renderiza HTML visual.
 */

import { CARD_LAYER_FEATURE_FLAGS } from './cardFeatureFlags.js';
import {
    resolveMonsterEffectiveClass,
    resolveMonsterCurrentEne,
} from '../combat/monsterRuntimeFields.js';

const OFFENSIVE_TARGETS = new Set(['enemy', 'inimigo', 'area', 'área']);
const DEFENSIVE_TARGETS = new Set(['self', 'ally', 'aliado']);
const QA_DIAGNOSTIC_REASONS = Object.freeze({
    pilot_disabled: 'Flag desligada ou classe fora do piloto.',
    catalog_unavailable: 'Catálogo visual data/cards.json ainda não carregou.',
    missing_card_layer_dependencies: 'Dependências da Card Layer não estão disponíveis.',
    empty_card_entries: 'Nenhuma entrada visual foi resolvida para as skills.',
    unmapped_skills_fallback: 'Uma ou mais skills não têm card visual mapeado.',
    no_mapped_entries: 'Nenhuma skill mapeada para card visual.',
    empty_card_html: 'Renderer não gerou HTML de cards.',
    card_layer_error: 'Erro ao renderizar Card Layer; fallback seguro acionado.',
    missing_resolveMonsterSkills: 'Resolver legado de skills ausente.',
});

function normalizeTarget(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function readSkillName(skill) {
    return skill?.name || skill?.nome || String(skill?.id || 'Habilidade');
}

function readSkillCost(skill) {
    return Number(skill?.cost ?? skill?.energy_cost ?? skill?.eneCost ?? 0) || 0;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function shouldShowQaDiagnostic(flags) {
    if (!flags || flags.enabled !== true) return false;
    if (typeof window === 'undefined') return true;
    try {
        const params = new URLSearchParams(window.location?.search || '');
        return params.get('cardLayerPilot') === '1'
            || String(params.get('cardLayerPilot') || '').toLowerCase() === 'true';
    } catch (_) {
        return true;
    }
}

function renderCardLayerQaDiagnostic({ mode, reason, monster, entries = [] }, flags) {
    if (!shouldShowQaDiagnostic(flags)) return '';
    const { value: monsterClass } = resolveMonsterEffectiveClass(monster);
    const unmapped = Array.isArray(entries)
        ? entries.filter(entry => !entry?.mapped).map(entry => {
            const skillName = readSkillName(entry?.skill);
            const entryReason = entry?.reason || 'sem motivo informado';
            return `${skillName}: ${entryReason}`;
        })
        : [];
    const reasonText = QA_DIAGNOSTIC_REASONS[reason] || reason || 'sem diagnóstico';
    const details = unmapped.length > 0
        ? `<div class="card-layer-qa-diagnostic__details">${escapeHtml(unmapped.join(' | '))}</div>`
        : '';

    return `<div class="card-layer-qa-diagnostic" data-card-layer-mode="${escapeHtml(mode || 'legacy')}" data-card-layer-reason="${escapeHtml(reason || '')}">
        <strong>🧪 Card Layer QA:</strong>
        <span>${escapeHtml(mode === 'card-layer' ? 'ativa' : 'fallback legado')}</span>
        <small>motivo: ${escapeHtml(reasonText)} · classe: ${escapeHtml(monsterClass || 'não resolvida')}</small>
        ${details}
    </div>`;
}

function withQaDiagnostic(result, flags, monster, entries = []) {
    if (!result || result.mode === 'card-layer') return result;
    const diagnostic = renderCardLayerQaDiagnostic({
        mode: result.mode,
        reason: result.reason,
        monster,
        entries,
    }, flags);
    if (!diagnostic) return result;
    return {
        ...result,
        html: `${diagnostic}${result.html || ''}`,
    };
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

        const name = readSkillName(skill);
        const cost = readSkillCost(skill);
        const icon = skill.icon || '';
        const kitBadge = skill._kitSwapId ? (skill._kitSwapId.endsWith('_ii') ? ' ⭐' : ' 🌟') : '';
        const label = [icon, name].filter(Boolean).join(' ') + kitBadge;
        const canUse = canUseSkillNow(skill, playerMonster) && Number(playerMonster?.hp || 0) > 0;
        const target = normalizeTarget(skill.target);
        const skillType = (skill.type || '').toUpperCase();
        const isOff = OFFENSIVE_TARGETS.has(target)
            || (!DEFENSIVE_TARGETS.has(target) && skillType === 'DAMAGE');
        const btnClass = isOff ? 'btn-skill-offensive' : 'btn-skill-defensive';
        const skillDesc = skill.desc || '';
        const skillMeta = [skill.category, skill.status ? `→ ${skill.status}` : null].filter(Boolean).join(' · ');
        const currentEne = resolveMonsterCurrentEne(playerMonster);
        const tooltip = !tutorialAllows
            ? 'Tutorial: ainda não liberado'
            : (!canUse
                ? `ENE insuficiente (${currentEne}/${cost})`
                : (skillMeta ? `${skillDesc}\n${skillMeta}` : skillDesc));

        return `<button class="${btnClass}" onclick="useSkillWild(${idx})"
                ${!canUse || !tutorialAllows ? 'disabled' : ''}
                title="${tooltip}">${label}</button>`;
    });

    return `<div class="skill-grid skill-grid--legacy">${slots.join('')}</div>`;
}

export function canUseCardLayerPilot(monster, flags = CARD_LAYER_FEATURE_FLAGS) {
    if (!flags || flags.enabled !== true) return false;
    const { value: monsterClass } = resolveMonsterEffectiveClass(monster);
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
        return withQaDiagnostic({ mode: 'legacy', html: '<div class="skill-grid"></div>', reason: 'missing_resolveMonsterSkills' }, flags, monster);
    }

    const skills = resolveMonsterSkills(monster) || [];
    const legacyHtml = renderLegacyWildSkillGrid(skills, {
        monster,
        canUseSkillNow: options.canUseSkillNow,
        tutorialAllows: options.tutorialAllows,
    });

    if (!canUseCardLayerPilot(monster, flags)) {
        return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'pilot_disabled' }, flags, monster);
    }

    if (!catalog || !Array.isArray(catalog.cards) || catalog.cards.length === 0) {
        return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'catalog_unavailable' }, flags, monster);
    }

    if (typeof getMonsterSkills !== 'function'
        || typeof resolveCardsForMonster !== 'function'
        || typeof renderCardGrid !== 'function') {
        return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'missing_card_layer_dependencies' }, flags, monster);
    }

    try {
        const entries = resolveCardsForMonster(monster, { getMonsterSkills });
        if (!Array.isArray(entries) || entries.length === 0) {
            return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'empty_card_entries' }, flags, monster, entries);
        }

        const unmappedEntries = entries.filter(entry => !entry?.mapped);
        if (unmappedEntries.length > 0 && flags.logUnmappedSkills && typeof logger?.warn === 'function') {
            logger.warn('[CardLayer][Fase1C] Skills sem card mapeado; fallback para UI legada.', {
                monsterClass: resolveMonsterEffectiveClass(monster).value ?? monster?.class,
                reasons: unmappedEntries.map(entry => entry.reason || 'unmapped'),
            });
        }

        if (unmappedEntries.length > 0 && flags.fallbackToSkillUI !== false) {
            return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'unmapped_skills_fallback' }, flags, monster, entries);
        }

        const mappedEntries = entries.filter(entry => entry?.mapped);
        if (mappedEntries.length === 0) {
            return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'no_mapped_entries' }, flags, monster, entries);
        }

        const cardHtml = renderCardGrid(mappedEntries, {
            monster,
            canUseSkillNow: options.canUseSkillNow,
            tutorialAllows: options.tutorialAllows,
        });

        if (!cardHtml) {
            return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'empty_card_html' }, flags, monster, entries);
        }

        const diagnostic = renderCardLayerQaDiagnostic({ mode: 'card-layer', reason: 'active', monster, entries }, flags);
        return { mode: 'card-layer', html: `${diagnostic}${cardHtml}`, reason: null };
    } catch (error) {
        if (typeof logger?.warn === 'function') {
            logger.warn('[CardLayer][Fase1C] Falha ao renderizar piloto; fallback para UI legada.', error);
        }
        return withQaDiagnostic({ mode: 'legacy', html: legacyHtml, reason: 'card_layer_error' }, flags, monster);
    }
}

export function wireCardLayerSkillButtons(rootElement, onUseSkill) {
    if (!rootElement || typeof rootElement.querySelectorAll !== 'function') return 0;
    if (typeof onUseSkill !== 'function') return 0;

    const buttons = rootElement.querySelectorAll('.skill-grid--card-layer .card-layer-skill[data-skill-index]');
    let wiredCount = 0;

    buttons.forEach((button) => {
        if (!button || !button.dataset) return;
        if (button.dataset.cardLayerBound === 'true') return;
        button.dataset.cardLayerBound = 'true';
        wiredCount += 1;
        button.addEventListener('click', () => {
            const parsed = Number.parseInt(button.dataset.skillIndex, 10);
            if (Number.isNaN(parsed) || parsed < 0) return;
            onUseSkill(parsed);
        });
    });

    return wiredCount;
}
