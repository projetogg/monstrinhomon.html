/**
 * CARD LAYER — Banner de QA independente e sempre visível.
 *
 * Aparece no bloco de batalha quando a URL contém `?cardLayerPilot=1` ou `?cardLayerPilot=true`.
 * Mostra dados reais do runtime para diagnóstico — não persiste nada, não altera mecânica.
 */

import { resolveMonsterEffectiveClass } from '../combat/monsterRuntimeFields.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/**
 * Verifica se o banner QA deve ser exibido com base na query string.
 * @param {string} search - window.location.search ou equivalente
 * @returns {boolean}
 */
export function shouldShowUrlQaBanner(search) {
    try {
        const params = new URLSearchParams(typeof search === 'string' ? search : '');
        const raw = (params.get('cardLayerPilot') || '').trim().toLowerCase();
        return raw === '1' || raw === 'true';
    } catch (_) {
        return false;
    }
}

/**
 * Constrói o HTML do banner de QA da Card Layer.
 * Retorna string vazia se cardLayerPilot não estiver ativo na URL.
 *
 * @param {object} params
 * @param {string} params.search - window.location.search
 * @param {object} params.baseFlags - CARD_LAYER_FEATURE_FLAGS
 * @param {object} params.effectiveFlags - resultado de getEffectiveCardLayerFlags()
 * @param {object|null} params.catalog - resultado de getCardCatalogSync()
 * @param {object} params.skillsUi - resultado de buildWildSkillGridHtml() (mode, reason, html)
 * @param {object|null} params.playerMonster - monstrinho do jogador
 * @param {Array} params.skills - skills efetivas resolvidas
 * @returns {string} HTML do banner ou string vazia
 */
export function buildCardLayerUrlQaBanner({
    search = '',
    baseFlags = {},
    effectiveFlags = {},
    catalog = null,
    skillsUi = {},
    playerMonster = null,
    skills = [],
} = {}) {
    if (!shouldShowUrlQaBanner(search)) return '';

    const flagEnabled = effectiveFlags?.enabled === true;
    const baseFlagEnabled = baseFlags?.enabled === true;
    const catalogLoaded = !!(catalog && Array.isArray(catalog.cards) && catalog.cards.length > 0);
    const mode = skillsUi?.mode || 'indisponível';
    const reason = skillsUi?.reason || 'indisponível';

    const { value: effectiveClass } = resolveMonsterEffectiveClass(playerMonster);
    const monsterName = playerMonster?.name || 'indisponível';
    const monsterClass = playerMonster?.class || playerMonster?.monsterClass || 'indisponível';

    const safeSkills = Array.isArray(skills) ? skills : [];
    const skillNames = safeSkills.length > 0
        ? safeSkills.map(s => s?.name || s?.nome || s?.id || '?').join(', ')
        : 'indisponível';

    const kitSwapIds = safeSkills
        .filter(s => s?._kitSwapId)
        .map(s => s._kitSwapId);
    const kitSwapIdsText = kitSwapIds.length > 0 ? kitSwapIds.join(', ') : 'indisponível';

    const cardsResolved = skillsUi?.mode === 'card-layer' ? 'sim' : 'não';

    return `<div class="card-layer-url-qa-banner" data-testid="card-layer-url-qa-banner" style="margin:0 0 10px 0;padding:10px 12px;border-radius:12px;border:2px dashed rgba(253,203,110,0.85);background:rgba(253,203,110,0.15);color:#fff;font-size:12px;font-family:monospace;line-height:1.6">
<strong>🧪 Card Layer URL QA</strong><br>
<span>search: ${escapeHtml(search)}</span><br>
<span>flagEnabled: ${flagEnabled}</span><br>
<span>baseFlagEnabled: ${baseFlagEnabled}</span><br>
<span>catalogLoaded: ${catalogLoaded}</span><br>
<span>skillsUi.mode: ${escapeHtml(mode)}</span><br>
<span>skillsUi.reason: ${escapeHtml(reason)}</span><br>
<span>playerMonster.class: ${escapeHtml(monsterClass)}</span><br>
<span>effectiveClass: ${escapeHtml(effectiveClass || 'indisponível')}</span><br>
<span>playerMonster.name: ${escapeHtml(monsterName)}</span><br>
<span>skills: ${escapeHtml(skillNames)}</span><br>
<span>kitSwapIds: ${escapeHtml(kitSwapIdsText)}</span><br>
<span>cardsResolved: ${escapeHtml(cardsResolved)}</span>
</div>`;
}
