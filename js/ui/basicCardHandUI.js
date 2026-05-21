import { getBasicCardById, getBasicCardsByClass } from '../data/basicCards.js';
import { executeBasicCardAction, SUPPORTED_WILD_CARD_ID } from '../combat/wildCardActions.js';
import { resolveMonsterCurrentEne, resolveMonsterEffectiveClass } from '../combat/monsterRuntimeFields.js';

const READY_REASON = 'Pronta para usar - custa 1 ENE.';
const PREVIEW_AVAILABLE_REASON = 'Execução em breve.';
const INSUFFICIENT_ENE_REASON = 'Precisa de mais ENE.';
const UNAVAILABLE_REASON = 'A carta não pode ser usada nesta batalha.';
const FAINTED_REASON = 'Esse monstrinho não pode agir agora.';

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
    resolveMonsterTemplate,
    resolvedPlayerMonsterClass,
    resolvedPlayerMonsterEne,
} = {}) {
    const diagnostics = inspectBasicCardReadiness({
        cardId,
        player,
        playerMonster,
        encounter,
        actionHandlersConnected,
        resolveMonsterTemplate,
        resolvedPlayerMonsterClass,
        resolvedPlayerMonsterEne,
    });
    return diagnostics.readiness;
}

export function inspectBasicCardReadiness({
    cardId,
    player,
    playerMonster,
    encounter,
    actionHandlersConnected = false,
    resolveMonsterTemplate,
    resolvedPlayerMonsterClass,
    resolvedPlayerMonsterEne,
} = {}) {
    const card = getBasicCardById(cardId);
    const playerMonsterClass = resolvedPlayerMonsterClass || resolveMonsterEffectiveClass(playerMonster, { resolveMonsterTemplate });
    const currentEne = resolvedPlayerMonsterEne ?? resolveMonsterCurrentEne(playerMonster);
    const checks = {
        cardFound: !!card,
        cardSupported: card?.id === SUPPORTED_WILD_CARD_ID,
        actionHandlersConnected: actionHandlersConnected === true,
        playerValid: !!player && typeof player === 'object',
        playerClass: player?.class || null,
        playerClassOk: player?.class === 'Guerreiro',
        playerMonsterValid: !!playerMonster && typeof playerMonster === 'object',
        playerMonsterClass: playerMonsterClass.value,
        playerMonsterClassSource: playerMonsterClass.source,
        playerMonsterClassOk: playerMonsterClass.value === 'Guerreiro',
        playerMonsterHp: Number(playerMonster?.hp) || 0,
        playerMonsterHpOk: isAlive(playerMonster),
        playerMonsterEne: currentEne,
        playerMonsterEneOk: !!card && currentEne >= card.cost,
        encounterValid: !!encounter && encounter.active === true,
        wildMonsterHp: Number(encounter?.wildMonster?.hp) || 0,
        wildMonsterHpOk: isAlive(encounter?.wildMonster),
    };

    let readiness;
    if (!checks.cardFound) readiness = { ok: false, reason: 'card_not_found' };
    else if (!checks.cardSupported) readiness = { ok: false, reason: 'unsupported_card' };
    else if (!checks.actionHandlersConnected) readiness = { ok: false, reason: 'handler_not_connected' };
    else if (!checks.playerValid) readiness = { ok: false, reason: 'invalid_player' };
    else if (!checks.playerClassOk) readiness = { ok: false, reason: 'class_mismatch' };
    else if (!checks.playerMonsterValid) readiness = { ok: false, reason: 'invalid_player_monster' };
    else if (!checks.playerMonsterClassOk) readiness = { ok: false, reason: 'class_mismatch' };
    else if (!checks.playerMonsterHpOk) readiness = { ok: false, reason: 'player_monster_fainted' };
    else if (!checks.playerMonsterEneOk) readiness = { ok: false, reason: 'insufficient_ene' };
    else if (!checks.encounterValid) readiness = { ok: false, reason: 'invalid_encounter' };
    else if (!checks.wildMonsterHpOk) readiness = { ok: false, reason: 'invalid_wild_monster' };
    else readiness = { ok: true, reason: 'ready' };

    return { readiness, checks };
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
    const currentEne = resolveMonsterCurrentEne({ ene: options?.currentEne });
    const actionHandlersConnected = options?.actionHandlersConnected === true;
    const resolveMonsterTemplate = options?.resolveMonsterTemplate;
    const resolvedPlayerMonsterClass = resolveMonsterEffectiveClass(options?.playerMonster, { resolveMonsterTemplate });
    const resolvedPlayerMonsterEne = resolveMonsterCurrentEne(options?.playerMonster);

    return cards.map(card => {
        const canAfford = currentEne >= card.cost;
        const readiness = getBasicCardReadiness({
            cardId: card.id,
            player: options?.player,
            playerMonster: options?.playerMonster,
            encounter: options?.encounter,
            actionHandlersConnected,
            resolveMonsterTemplate,
            resolvedPlayerMonsterClass,
            resolvedPlayerMonsterEne,
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
    resolveMonsterTemplate,
} = {}) {
    const readiness = getBasicCardReadiness({
        cardId,
        player,
        playerMonster,
        encounter,
        actionHandlersConnected: true,
        resolveMonsterTemplate,
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
            resolveMonsterTemplate,
        },
    });
}
