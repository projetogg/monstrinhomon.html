/**
 * CLASS ELIGIBILITY (Fase 19)
 *
 * Funções puras para determinar e exibir a elegibilidade de um monstrinho
 * para batalha com base na classe do jogador.
 *
 * REGRA (GAME_RULES.md):
 *   Em batalha, o jogador só pode usar monstrinhos da MESMA CLASSE do jogador.
 *   Exceção: config.masterMode desativa a restrição.
 *
 * Estas funções são usadas pela UI de equipe e pela seleção de batalha para
 * tornar a regra visível e pedagógica para o jogador.
 */

/**
 * Determina se um monstrinho é elegível para batalha com este jogador.
 *
 * PURE: sem side effects.
 *
 * @param {object} monster  - Instância de monstrinho com { class }
 * @param {object} player   - Jogador com { class }
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {boolean}
 */
export function isEligibleForBattle(monster, player, config = {}) {
    if (!monster || !player) return false;
    if (config?.masterMode) return true;
    const monClass = monster.class || '';
    const playerClass = player.class || '';
    if (!monClass || !playerClass) return false;
    return monClass === playerClass;
}

/**
 * Retorna o rótulo textual de elegibilidade para exibição na UI.
 *
 * @param {object} monster  - Instância de monstrinho com { class }
 * @param {object} player   - Jogador com { class }
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {{ eligible: boolean, text: string, title: string }}
 */
export function getEligibilityLabel(monster, player, config = {}) {
    if (!monster || !player) {
        return {
            eligible: false,
            text: '✖ Sem classe',
            title: 'Dados incompletos — não é possível determinar elegibilidade'
        };
    }

    const masterMode = config?.masterMode || false;
    const monClass = monster.class || '';
    const playerClass = player.class || '';

    if (masterMode) {
        return {
            eligible: true,
            text: '✔ Modo Mestre',
            title: 'Modo Mestre: restrição de classe desativada'
        };
    }

    if (!playerClass) {
        return {
            eligible: false,
            text: '✖ Jogador sem classe',
            title: 'O jogador não tem classe definida'
        };
    }

    if (!monClass) {
        return {
            eligible: false,
            text: '✖ Sem classe',
            title: 'Este monstrinho não tem classe definida'
        };
    }

    if (monClass === playerClass) {
        return {
            eligible: true,
            text: '✔ Elegível',
            title: `Classe ${monClass} — pode batalhar com este treinador`
        };
    }

    return {
        eligible: false,
        text: '✖ Fora da classe',
        title: `Classe ${monClass} — este treinador é da classe ${playerClass}`
    };
}

/**
 * Renderiza o badge HTML de elegibilidade para uso em templates de equipe.
 *
 * @param {object} monster  - Instância de monstrinho
 * @param {object} player   - Jogador
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {string} HTML do badge
 */
export function renderEligibilityBadge(monster, player, config = {}) {
    const label = getEligibilityLabel(monster, player, config);
    const cssClass = label.eligible
        ? 'eligibility-badge eligibility-badge--eligible'
        : 'eligibility-badge eligibility-badge--ineligible';
    return `<span class="${cssClass}" title="${label.title}">${label.text}</span>`;
}
