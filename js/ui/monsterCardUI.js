/**
 * Monster Card UI — js/ui/monsterCardUI.js
 *
 * Funções puras de renderização para cards de monstrinhos.
 * Dependências injetadas como parâmetros — sem uso de window.*.
 *
 * Exportações:
 *   renderSpeciesIdentityBlock(monster, speciesDisplay)        → string HTML
 *   renderTeamReadinessIndicator(monster, speciesDisplay)      → string HTML
 *   renderEligibilityBadgeForTeam(monster, player, classEligibility) → string HTML
 */

/**
 * Renderiza o bloco de identidade canônica de espécie para o card do monstrinho.
 * Fase 15: visibilidade persistente fora do combate.
 *
 * Retorna string HTML vazia se o monstrinho não tiver espécie canônica mapeada.
 *
 * @param {object} monster        - Instância de monstrinho.
 * @param {object} speciesDisplay - Módulo SpeciesDisplay (injetado).
 * @returns {string} HTML do bloco de identidade.
 */
export function renderSpeciesIdentityBlock(monster, speciesDisplay) {
    if (!speciesDisplay?.getSpeciesDisplayInfo) return '';
    const info = speciesDisplay.getSpeciesDisplayInfo(monster);
    if (!info.hasSpecies) return '';

    const promotionBadge = info.isPromoted ? '⭐' : '🌟';
    const promotionSuffix = info.isPromoted ? ' (Promoção)' : '';
    const kitCssClass = info.isPromoted
        ? 'species-identity__kit species-identity__kit--promoted'
        : 'species-identity__kit';
    const kitHtml = info.hasKitSwap
        ? `<div class="${kitCssClass}">${promotionBadge} ${info.kitSwapName}${promotionSuffix}</div>`
        : '';

    const milestoneHtml = info.nextMilestone
        ? `<div class="species-identity__milestone">⏳ ${info.nextMilestone}</div>`
        : '';

    return `
                <div class="species-identity">
                    <div class="species-identity__header">🧬 ${info.speciesLabel} · ${info.archetype}</div>
                    <div class="species-identity__passive">✨ ${info.passiveName} — ${info.passiveDesc}</div>
                    ${kitHtml}
                    ${milestoneHtml}
                </div>
            `;
}

/**
 * Fase 17 — Indicador leve de prontidão canônica para a visão de equipe.
 *
 * Renderiza um badge compacto informando o estado de progressão canônica
 * do monstrinho sem duplicar a ficha completa de identidade.
 *
 * Estados:
 *  - 'complete'     → ✅ Completo (identidade totalmente ativa)
 *  - 'near_promo'   → ⚡ Nv.X (perto da promoção do kit_swap)
 *  - 'near_unlock'  → ⚡ Nv.X (perto do desbloqueio do kit_swap)
 *  - null           → string vazia (silencioso — sem poluição visual)
 *
 * @param {object} monster        - Instância de monstrinho.
 * @param {object} speciesDisplay - Módulo SpeciesDisplay (injetado).
 * @returns {string} HTML do badge ou string vazia.
 */
export function renderTeamReadinessIndicator(monster, speciesDisplay) {
    if (!speciesDisplay?.getTeamReadinessIndicator) return '';
    const readiness = speciesDisplay.getTeamReadinessIndicator(monster);
    if (!readiness) return '';

    switch (readiness.state) {
        case 'complete':
            return '<span class="readiness-badge readiness-badge--complete" title="Identidade canônica completa">✅ Completo</span>';
        case 'near_promo':
            return `<span class="readiness-badge readiness-badge--near" title="Promoção no Nv. ${readiness.targetLevel}">⚡ Nv.${readiness.targetLevel}</span>`;
        case 'near_unlock':
            return `<span class="readiness-badge readiness-badge--near" title="Habilidade especial no Nv. ${readiness.targetLevel}">⚡ Nv.${readiness.targetLevel}</span>`;
        default:
            return '';
    }
}

/**
 * Fase 19 — Badge de elegibilidade por classe para a visão de equipe.
 *
 * Delega para classEligibility.renderEligibilityBadge().
 * Retorna string vazia se classEligibility não estiver disponível (graceful degradation).
 *
 * @param {object} monster          - Instância de monstrinho.
 * @param {object} player           - Jogador dono do time.
 * @param {object} classEligibility - Módulo ClassEligibility (injetado).
 * @returns {string} HTML do badge.
 */
export function renderEligibilityBadgeForTeam(monster, player, classEligibility) {
    if (!classEligibility?.renderEligibilityBadge) return '';
    return classEligibility.renderEligibilityBadge(monster, player);
}
