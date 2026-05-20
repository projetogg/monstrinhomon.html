import { getBasicCardsByClass } from '../data/basicCards.js';

const PREVIEW_DISABLED_REASON = 'As cartas ainda não estão conectadas nesta etapa do MVP 0.4.';

/**
 * Monta a mão de cartas em formato seguro para visualização (preview).
 * Não executa efeitos, não altera estado e não consome ENE.
 *
 * @param {string} className
 * @returns {Array<object>}
 */
export function buildBasicCardHandViewModel(className) {
    if (!className || typeof className !== 'string') return [];

    const cards = getBasicCardsByClass(className);
    return cards.map(card => ({
        id: card.id,
        name: card.name,
        class: card.class,
        cost: card.cost,
        type: card.type,
        childText: card.childText,
        runtimeAction: card.runtimeAction,
        enabled: false,
        disabledReason: PREVIEW_DISABLED_REASON,
    }));
}

export function getBasicCardPreviewDisabledReason() {
    return PREVIEW_DISABLED_REASON;
}
