/**
 * CLASS ELIGIBILITY — Funções puras de elegibilidade por classe em batalha
 *
 * Módulo canônico que expõe a regra de elegibilidade de classe para uso em
 * qualquer ponto do sistema (equipe, combate, modal de troca, UI).
 *
 * Regra oficial (GAME_RULES.md):
 *   BATALHA: o jogador só pode USAR em combate Monstrinhos da MESMA classe do jogador.
 *   Exceção: masterMode desativa a restrição.
 *
 * Vocabulário consolidado (em linha com Fase 19):
 *   "Elegível"       — monstrinho pode ser usado em batalha pelo jogador
 *   "Fora da classe" — monstrinho é de classe diferente
 */

/**
 * Verifica se um monstrinho é elegível para batalha pelo jogador.
 *
 * @param {object} mon    - Instância do Monstrinho (precisa de .class)
 * @param {object} player - Jogador (precisa de .class)
 * @param {object} [config] - { masterMode?: boolean }
 * @returns {boolean}
 */
export function isEligibleForBattle(mon, player, config = {}) {
    if (!mon || !player) return false;
    if (config?.masterMode) return true;
    const monClass = mon.class || '';
    const playerClass = player.class || '';
    if (!monClass || !playerClass) return false;
    return monClass === playerClass;
}

/**
 * Retorna label de elegibilidade para exibição na UI.
 * Vocabulário alinhado com Fase 19 (renderEligibilityBadgeForTeam).
 *
 * @param {object} mon
 * @param {object} player
 * @param {object} [config]
 * @returns {string} — 'Elegível' | 'Fora da classe' | 'Sem classe'
 */
export function getEligibilityLabel(mon, player, config = {}) {
    if (!mon || !player) return 'Sem classe';
    if (config?.masterMode) return 'Elegível';
    const monClass = mon.class || '';
    const playerClass = player.class || '';
    if (!monClass || !playerClass) return 'Sem classe';
    return monClass === playerClass ? 'Elegível' : 'Fora da classe';
}

/**
 * Retorna HTML de um badge de elegibilidade para uso inline na UI.
 * Compatível com os badges da Fase 19 (.eligibility-badge--eligible / --ineligible).
 *
 * @param {object} mon
 * @param {object} player
 * @param {object} [config]
 * @returns {string} HTML do badge
 */
export function renderEligibilityBadge(mon, player, config = {}) {
    const label = getEligibilityLabel(mon, player, config);
    const cls = label === 'Elegível'
        ? 'eligibility-badge eligibility-badge--eligible'
        : 'eligibility-badge eligibility-badge--ineligible';
    return `<span class="${cls}">${label}</span>`;
}
