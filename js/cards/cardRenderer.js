/**
 * CARD RENDERER — render visual puro para botões de habilidade.
 * Não busca dados e não executa efeitos.
 */

const OFFENSIVE_TARGETS = new Set(['enemy', 'area', 'inimigo', 'área', 'todos']);
const DEFENSIVE_TARGETS = new Set(['self', 'ally', 'aliado']);

export function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function getSkillButtonClass(skill) {
    const target = String(skill?.target || '').trim().toLowerCase();
    const skillType = String(skill?.type || '').toUpperCase();
    const isOffensive = OFFENSIVE_TARGETS.has(target)
        || (!DEFENSIVE_TARGETS.has(target) && skillType === 'DAMAGE');
    return isOffensive ? 'btn-skill-offensive' : 'btn-skill-defensive';
}

export function renderCard(cardEntry, runtimeContext = {}) {
    if (!cardEntry || !cardEntry.skill) return '';

    const { skill, skillIndex, card, stage } = cardEntry;
    const canUseSkillNow = typeof runtimeContext.canUseSkillNow === 'function'
        ? runtimeContext.canUseSkillNow
        : () => true;
    const skillMonster = runtimeContext.monster || null;
    const tutorialAllows = runtimeContext.tutorialAllows !== false;
    const canUse = canUseSkillNow(skill, skillMonster) && (Number(skillMonster?.hp || 0) > 0);
    const cost = Number(skill.cost ?? skill.energy_cost ?? skill.eneCost ?? 0) || 0;
    const currentEne = Number(skillMonster?.ene) || 0;
    const stageTitle = stage?.title || card?.groupKey || skill.name || 'Habilidade';
    const stageText = stage?.text_child || skill.desc || '';
    const icon = card?.icon_key ? `🃏 ${card.icon_key}` : '🃏';
    const tooltip = !tutorialAllows
        ? 'Tutorial: ainda não liberado'
        : (!canUse
            ? `ENE insuficiente (${currentEne}/${cost})`
            : stageText);

    return `<button class="${getSkillButtonClass(skill)} card-layer-skill"
        data-card-id="${escapeHtml(card?.id || '')}"
        data-skill-index="${Number(skillIndex) || 0}"
        onclick="useSkillWild(${Number(skillIndex) || 0})"
        ${!canUse || !tutorialAllows ? 'disabled' : ''}
        title="${escapeHtml(tooltip)}">
        <strong>${escapeHtml(stageTitle)}</strong>
        <small>${escapeHtml(icon)} · ENE ${cost}</small>
    </button>`;
}

export function renderCardGrid(cardEntries, runtimeContext = {}) {
    if (!Array.isArray(cardEntries) || cardEntries.length === 0) return '';
    const cardsHtml = cardEntries.map(entry => renderCard(entry, runtimeContext)).filter(Boolean).join('');
    if (!cardsHtml) return '';
    return `<div class="skill-grid skill-grid--card-layer">${cardsHtml}</div>`;
}
