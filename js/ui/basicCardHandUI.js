import { getBasicCardsByClass } from '../data/basicCards.js';

const PREVIEW_AVAILABLE_REASON = 'ENE suficiente — execução em breve.';
const EXECUTABLE_READY_REASON = 'Pronta para usar.';
const INSUFFICIENT_ENE_REASON = 'Precisa de mais ENE.';

function normalizeCurrentEne(currentEne) {
    const parsed = Number(currentEne);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
}

/**
 * Monta a mão de cartas em formato seguro para visualização (preview).
 * Não executa efeitos, não altera estado e não consome ENE.
 *
 * @param {string} className
 * @param {object} [options]
 * @param {number} [options.currentEne=0]
 * @returns {Array<object>}
 */
export function buildBasicCardHandViewModel(className, options = {}) {
    if (!className || typeof className !== 'string') return [];

    const cards = getBasicCardsByClass(className);
    const currentEne = normalizeCurrentEne(options?.currentEne);
    const isWarriorCardEnabled = className === 'Guerreiro';

    return cards.map(card => {
        const canAfford = currentEne >= card.cost;
        const availability = canAfford ? 'preview_available' : 'insufficient_ene';

        return {
            id: card.id,
            name: card.name,
            class: card.class,
            cost: card.cost,
            type: card.type,
            childText: card.childText,
            runtimeAction: card.runtimeAction,
            canAfford,
            previewOnly: !isWarriorCardEnabled || card.id !== 'CARD_GUERREIRO_GOLPE_FIRME',
            executable: isWarriorCardEnabled && card.id === 'CARD_GUERREIRO_GOLPE_FIRME' && canAfford,
            enabled: isWarriorCardEnabled && card.id === 'CARD_GUERREIRO_GOLPE_FIRME' && canAfford,
            availability,
            disabledReason: canAfford
                ? (isWarriorCardEnabled && card.id === 'CARD_GUERREIRO_GOLPE_FIRME' ? EXECUTABLE_READY_REASON : PREVIEW_AVAILABLE_REASON)
                : INSUFFICIENT_ENE_REASON,
        };
    });
}

export function getBasicCardPreviewDisabledReason(availability = 'preview_available') {
    return availability === 'insufficient_ene' ? INSUFFICIENT_ENE_REASON : PREVIEW_AVAILABLE_REASON;
}