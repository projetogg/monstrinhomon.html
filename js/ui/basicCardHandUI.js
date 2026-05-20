import { getBasicCardsByClass } from '../data/basicCards.js';

const PREVIEW_AVAILABLE_REASON = 'ENE suficiente — execução preparada para próxima etapa.';
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
 * Observação MVP 0.4:
 * A action de Golpe Firme pode existir/testar em camada de combate,
 * mas esta UI permanece preview até o wiring de clique ser implementado.
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
    const previewOnly = true;

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
            previewOnly,
            executable: false,
            enabled: false,
            availability,
            disabledReason: canAfford ? PREVIEW_AVAILABLE_REASON : INSUFFICIENT_ENE_REASON,
        };
    });
}

export function getBasicCardPreviewDisabledReason(availability = 'preview_available') {
    return availability === 'insufficient_ene' ? INSUFFICIENT_ENE_REASON : PREVIEW_AVAILABLE_REASON;
}