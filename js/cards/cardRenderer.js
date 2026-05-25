/**
 * CARD RENDERER — render visual puro da Card Layer.
 *
 * Regras rígidas da Fase 1B:
 * - Não chama nenhuma função de runtime de combate (useSkillWild, resolveMonsterSkills, etc).
 * - Não emite atributos onclick nem handlers executáveis no HTML gerado.
 * - Retorna apenas HTML descritivo ou view model passível de composição visual.
 * - Quem integrar este módulo é responsável por adicionar os handlers de clique.
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

function getCardToneClass(cardEntry) {
    const category = String(cardEntry?.card?.category_visual || '').toLowerCase();
    if (category.includes('defesa')) return 'card-layer-skill--defense';
    if (category.includes('controle')) return 'card-layer-skill--control';
    if (category.includes('cura')) return 'card-layer-skill--heal';
    return 'card-layer-skill--attack';
}

/**
 * Constrói um view model puro para um card entry.
 * Não contém handler executável — o integrador decide como ligar o clique.
 *
 * @param {object} cardEntry - Entrada vinda do cardResolver
 * @param {object} [runtimeContext] - Contexto de apresentação (monster, canUseSkillNow, tutorialAllows)
 * @returns {object|null} View model visual-only ou null se inválido
 */
export function buildCardViewModel(cardEntry, runtimeContext = {}) {
    if (!cardEntry || !cardEntry.skill) return null;

    const { skill, skillIndex, card, stage } = cardEntry;
    const canUseSkillNow = typeof runtimeContext.canUseSkillNow === 'function'
        ? runtimeContext.canUseSkillNow
        : () => true;
    const skillMonster = runtimeContext.monster || null;
    const tutorialAllows = runtimeContext.tutorialAllows !== false;
    const canUse = canUseSkillNow(skill, skillMonster) && (Number(skillMonster?.hp || 0) > 0);
    const cost = Number(skill.cost ?? skill.energy_cost ?? skill.eneCost ?? 0) || 0;
    const currentEne = Number(skillMonster?.ene ?? skillMonster?.currentEne ?? skillMonster?.energy ?? 0) || 0;
    const stageTitle = stage?.title || card?.groupKey || skill.name || 'Habilidade';
    const stageText = stage?.text_child || skill.desc || '';
    const iconKey = card?.icon_key || '';
    const categoryVisual = card?.category_visual || 'habilidade';
    const visualSource = cardEntry.cardAliasApplied ? 'kit swap' : 'skill';
    const icon = iconKey ? `🃏 ${iconKey}` : '🃏';
    const tooltip = !tutorialAllows
        ? 'Tutorial: ainda não liberado'
        : (!canUse
            ? `ENE insuficiente (${currentEne}/${cost})`
            : stageText);

    return {
        skillIndex: Number(skillIndex) || 0,
        cardId: card?.id || '',
        buttonClass: getSkillButtonClass(skill),
        toneClass: getCardToneClass(cardEntry),
        stageTitle,
        stageText,
        icon,
        iconKey,
        categoryVisual,
        visualSource,
        runtimeSkillName: skill.name || skill.nome || skill.id || 'Skill',
        cost,
        currentEne,
        tooltip,
        canUse,
        tutorialAllows,
        disabled: !canUse || !tutorialAllows,
    };
}

/**
 * Renderiza um card como HTML visual sem handlers de clique.
 * Use `data-skill-index` para wiring na Fase 1C.
 *
 * @param {object} cardEntry - Entrada vinda do cardResolver
 * @param {object} [runtimeContext] - Contexto de apresentação
 * @returns {string} HTML descritivo sem onclick
 */
export function renderCard(cardEntry, runtimeContext = {}) {
    const vm = buildCardViewModel(cardEntry, runtimeContext);
    if (!vm) return '';

    return `<button class="${vm.buttonClass} card-layer-skill ${vm.toneClass}"
        data-card-id="${escapeHtml(vm.cardId)}"
        data-skill-index="${vm.skillIndex}"
        ${vm.disabled ? 'disabled' : ''}
        title="${escapeHtml(vm.tooltip)}">
        <span class="card-layer-skill__top">
            <strong>${escapeHtml(vm.stageTitle)}</strong>
            <small>ENE ${vm.cost}</small>
        </span>
        <span class="card-layer-skill__text">${escapeHtml(vm.stageText)}</span>
        <span class="card-layer-skill__meta">
            <span>${escapeHtml(vm.categoryVisual)}</span>
            <span>${escapeHtml(vm.runtimeSkillName)}</span>
            <span>${escapeHtml(vm.visualSource)}</span>
        </span>
    </button>`;
}

/**
 * Renderiza a grade de cards como HTML visual.
 * Não contém handler executável — wiring é responsabilidade da Fase 1C.
 *
 * @param {object[]} cardEntries - Entradas mapeadas vindas do cardResolver
 * @param {object} [runtimeContext] - Contexto de apresentação
 * @returns {string} HTML da grade visual sem onclick
 */
export function renderCardGrid(cardEntries, runtimeContext = {}) {
    if (!Array.isArray(cardEntries) || cardEntries.length === 0) return '';
    const cardsHtml = cardEntries.map(entry => renderCard(entry, runtimeContext)).filter(Boolean).join('');
    if (!cardsHtml) return '';
    return `<div class="skill-grid skill-grid--card-layer">${cardsHtml}</div>`;
}
