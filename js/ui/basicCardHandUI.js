import { getBasicCardById, getBasicCardsByClass } from '../data/basicCards.js';
import { executeBasicCardAction, SUPPORTED_WILD_CARD_ID } from '../combat/wildCardActions.js';

const READY_REASON = 'Pronta para usar - custa 1 ENE.';
const PREVIEW_AVAILABLE_REASON = 'Execução em breve.';
const INSUFFICIENT_ENE_REASON = 'Precisa de mais ENE.';
const UNAVAILABLE_REASON = 'A carta não pode ser usada nesta batalha.';
const FAINTED_REASON = 'Esse monstrinho não pode agir agora.';

function normalizeCurrentEne(currentEne) {
    const parsed = Number(currentEne);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
}

function isAlive(monster) {
    return !!monster && Number(monster.hp) > 0;
}

export function getBasicCardActionFeedback(reason = 'unavailable') {
    const messages = {
        insufficient_ene: 'Você precisa de mais ENE.',
        unsupported_card: 'Essa carta ainda não está disponível.',
        card_not_found: 'Essa carta ainda não está disponível.',
        player_monster_fainted: FAINTED_REASON,
        invalid_player_monster: FAINTED_REASON,
        invalid_player: UNAVAILABLE_REASON,
        class_mismatch: UNAVAILABLE_REASON,
        invalid_encounter: UNAVAILABLE_REASON,
        invalid_wild_monster: UNAVAILABLE_REASON,
        missing_attack_pipeline: UNAVAILABLE_REASON,
        attack_pipeline_failed: UNAVAILABLE_REASON,
        handler_not_connected: PREVIEW_AVAILABLE_REASON,
    };
    return messages[reason] || UNAVAILABLE_REASON;
}

export function getBasicCardReadiness({
    cardId,
    player,
    playerMonster,
    encounter,
    actionHandlersConnected = false,
} = {}) {
    const card = getBasicCardById(cardId);
    if (!card) return { ok: false, reason: 'card_not_found' };
    if (card.id !== SUPPORTED_WILD_CARD_ID) return { ok: false, reason: 'unsupported_card' };
    if (!actionHandlersConnected) return { ok: false, reason: 'handler_not_connected' };

    if (!player || typeof player !== 'object') return { ok: false, reason: 'invalid_player' };
    if (player.class !== 'Guerreiro') return { ok: false, reason: 'class_mismatch' };

    if (!playerMonster || typeof playerMonster !== 'object') return { ok: false, reason: 'invalid_player_monster' };
    if (playerMonster.class !== 'Guerreiro') return { ok: false, reason: 'class_mismatch' };
    if (!isAlive(playerMonster)) return { ok: false, reason: 'player_monster_fainted' };

    const currentEne = normalizeCurrentEne(playerMonster.ene);
    if (currentEne < card.cost) return { ok: false, reason: 'insufficient_ene' };

    if (!encounter || encounter.active !== true) return { ok: false, reason: 'invalid_encounter' };
    if (!isAlive(encounter.wildMonster)) return { ok: false, reason: 'invalid_wild_monster' };

    return { ok: true, reason: 'ready' };
}

/**
 * Monta a mão de cartas em formato seguro para visualização e execução controlada.
 * Não executa efeitos, não altera estado e não consome ENE.
 *
 * Observação MVP 0.4:
 * Somente Golpe Firme fica executável, e apenas quando a UI informar que
 * o handler real está conectado ao contexto atual da batalha.
 *
 * @param {string} className
 * @param {object} [options]
 * @param {number} [options.currentEne=0]
 * @param {boolean} [options.actionHandlersConnected=false]
 * @param {object} [options.player]
 * @param {object} [options.playerMonster]
 * @param {object} [options.encounter]
 * @returns {Array<object>}
 */
export function buildBasicCardHandViewModel(className, options = {}) {
    if (!className || typeof className !== 'string') return [];

    const cards = getBasicCardsByClass(className);
    const currentEne = normalizeCurrentEne(options?.currentEne);
    const actionHandlersConnected = options?.actionHandlersConnected === true;

    return cards.map(card => {
        const canAfford = currentEne >= card.cost;
        const readiness = getBasicCardReadiness({
            cardId: card.id,
            player: options?.player,
            playerMonster: options?.playerMonster,
            encounter: options?.encounter,
            actionHandlersConnected,
        });

        const executable = canAfford && readiness.ok;
        const availability = !canAfford
            ? 'insufficient_ene'
            : executable
                ? 'ready'
                : readiness.reason === 'unsupported_card'
                    ? 'coming_soon'
                    : 'preview_available';
        const disabledReason = executable
            ? READY_REASON
            : availability === 'insufficient_ene'
                ? INSUFFICIENT_ENE_REASON
                : getBasicCardActionFeedback(readiness.reason);

        return {
            id: card.id,
            name: card.name,
            class: card.class,
            cost: card.cost,
            type: card.type,
            childText: card.childText,
            runtimeAction: card.runtimeAction,
            canAfford,
            previewOnly: !executable,
            executable,
            enabled: executable,
            availability,
            disabledReason,
        };
    });
}

export function getBasicCardPreviewDisabledReason(availability = 'preview_available') {
    if (availability === 'insufficient_ene') return INSUFFICIENT_ENE_REASON;
    if (availability === 'ready') return READY_REASON;
    return PREVIEW_AVAILABLE_REASON;
}

export function executeBasicCardFromHand({
    cardId,
    player,
    playerMonster,
    encounter,
    d20Roll,
    defenderRoll,
    executeWildAttack,
    dependencies = {},
    executeBasicCardActionImpl = executeBasicCardAction,
} = {}) {
    const readiness = getBasicCardReadiness({
        cardId,
        player,
        playerMonster,
        encounter,
        actionHandlersConnected: true,
    });

    if (!readiness.ok) {
        return { success: false, reason: readiness.reason };
    }
    if (typeof executeWildAttack !== 'function') {
        return { success: false, reason: 'missing_attack_pipeline' };
    }

    const executeWildAttackForCard = () => executeWildAttack({
        encounter,
        player,
        playerMonster,
        d20Roll,
        defenderRoll,
        dependencies,
    });

    return executeBasicCardActionImpl({
        cardId,
        player,
        playerMonster,
        encounter,
        dependencies: {
            executeWildAttack: executeWildAttackForCard,
        },
    });
}
