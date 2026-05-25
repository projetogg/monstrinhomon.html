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

const CARD_LAYER_QA_STYLE = `<style data-card-layer-qa-style="true">
.skill-grid--card-layer{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(190px,1fr))!important;gap:10px!important;align-items:stretch!important;}
.card-layer-skill{min-height:118px!important;padding:12px!important;border-radius:14px!important;border:1px solid rgba(255,255,255,.18)!important;background:rgba(255,255,255,.08)!important;color:#fff!important;text-align:left!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;gap:8px!important;box-shadow:0 6px 16px rgba(0,0,0,.22)!important;white-space:normal!important;line-height:1.25!important;}
.card-layer-skill:not(:disabled){cursor:pointer!important;}
.card-layer-skill:disabled{opacity:.55!important;cursor:not-allowed!important;filter:saturate(.6)!important;}
.card-layer-skill--attack{background:linear-gradient(135deg,rgba(214,48,49,.85),rgba(225,112,85,.45))!important;border-color:rgba(255,118,117,.65)!important;}
.card-layer-skill--defense{background:linear-gradient(135deg,rgba(255,255,255,.92),rgba(220,224,235,.78))!important;color:#111!important;border-color:rgba(255,255,255,.85)!important;}
.card-layer-skill--control{background:linear-gradient(135deg,rgba(108,92,231,.85),rgba(0,206,201,.45))!important;border-color:rgba(162,155,254,.65)!important;}
.card-layer-skill--heal{background:linear-gradient(135deg,rgba(0,184,148,.82),rgba(85,239,196,.42))!important;border-color:rgba(85,239,196,.65)!important;}
.card-layer-skill__top{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:8px!important;font-weight:900!important;font-size:14px!important;}
.card-layer-skill__top small{font-size:11px!important;font-weight:900!important;padding:3px 7px!important;border-radius:999px!important;background:rgba(0,0,0,.22)!important;white-space:nowrap!important;color:inherit!important;}
.card-layer-skill--defense .card-layer-skill__top small{background:rgba(0,0,0,.08)!important;}
.card-layer-skill__text{font-size:12px!important;opacity:.95!important;font-weight:700!important;}
.card-layer-skill__meta{display:flex!important;flex-wrap:wrap!important;gap:5px!important;font-size:10px!important;opacity:.86!important;}
.card-layer-skill__meta span{padding:2px 6px!important;border-radius:999px!important;background:rgba(0,0,0,.18)!important;}
.card-layer-skill--defense .card-layer-skill__meta span{background:rgba(0,0,0,.08)!important;}
.card-layer-qa-diagnostic{margin:0 0 10px 0!important;padding:9px 11px!important;border-radius:12px!important;border:1px dashed rgba(253,203,110,.75)!important;background:rgba(253,203,110,.14)!important;color:#fff!important;font-size:12px!important;display:flex!important;flex-direction:column!important;gap:3px!important;}
.card-layer-qa-diagnostic small{opacity:.86!important;}
.card-layer-qa-diagnostic__details{font-size:11px!important;opacity:.84!important;}
@media(max-width:760px){.skill-grid--card-layer{grid-template-columns:1fr!important}.card-layer-skill{min-height:105px!important}}
</style>`;

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
    return `${CARD_LAYER_QA_STYLE}<div class="skill-grid skill-grid--card-layer">${cardsHtml}</div>`;
}
