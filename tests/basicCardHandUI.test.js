import { describe, it, expect, vi } from 'vitest';
import {
    buildBasicCardHandViewModel,
    inspectBasicCardReadiness,
    executeBasicCardFromHand,
    getBasicCardActionFeedback,
} from '../js/ui/basicCardHandUI.js';

function makeReadyContext(overrides = {}) {
    const player = { id: 'P1', class: 'Guerreiro', ...overrides.player };
    const playerMonster = {
        id: 'M1',
        class: 'Guerreiro',
        hp: 20,
        ene: 2,
        ...overrides.playerMonster,
    };
    const encounter = {
        active: true,
        wildMonster: { id: 'W1', hp: 15 },
        ...overrides.encounter,
    };
    return { player, playerMonster, encounter };
}

describe('basicCardHandUI - wiring seguro (MVP 0.4)', () => {
    it('retorna cartas apenas da classe pedida', () => {
        const hand = buildBasicCardHandViewModel('Guerreiro', { currentEne: 3 });
        expect(hand.length).toBeGreaterThan(0);
        for (const card of hand) {
            expect(card.class).toBe('Guerreiro');
        }
    });

    it('nao retorna cartas de outras classes', () => {
        const hand = buildBasicCardHandViewModel('Bardo', { currentEne: 1 });
        expect(hand.every(card => card.class === 'Bardo')).toBe(true);
    });

    it('classe invalida retorna fallback seguro vazio', () => {
        expect(buildBasicCardHandViewModel('ClasseInexistente', { currentEne: 2 })).toEqual([]);
        expect(buildBasicCardHandViewModel('', { currentEne: 2 })).toEqual([]);
        expect(buildBasicCardHandViewModel(null, { currentEne: 2 })).toEqual([]);
    });

    it('expoe campos esperados no view model', () => {
        const [card] = buildBasicCardHandViewModel('Mago', { currentEne: 1 });
        expect(card).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            class: expect.any(String),
            cost: expect.any(Number),
            type: expect.any(String),
            childText: expect.any(String),
            runtimeAction: expect.any(String),
            canAfford: expect.any(Boolean),
            previewOnly: true,
            executable: false,
            enabled: false,
            availability: expect.any(String),
            disabledReason: expect.any(String),
        });
    });

    it('marca Golpe Firme como executavel quando Guerreiro tem ENE e contexto valido', () => {
        const ctx = makeReadyContext();
        const [card] = buildBasicCardHandViewModel('Guerreiro', {
            currentEne: ctx.playerMonster.ene,
            actionHandlersConnected: true,
            ...ctx,
        });

        expect(card.id).toBe('CARD_GUERREIRO_GOLPE_FIRME');
        expect(card.canAfford).toBe(true);
        expect(card.enabled).toBe(true);
        expect(card.executable).toBe(true);
        expect(card.previewOnly).toBe(false);
        expect(card.availability).toBe('ready');
        expect(card.disabledReason).toBe('Pronta para usar - custa 1 ENE.');
    });

    it('mantem Golpe Firme em preview se handler real nao foi conectado', () => {
        const ctx = makeReadyContext();
        const [card] = buildBasicCardHandViewModel('Guerreiro', {
            currentEne: ctx.playerMonster.ene,
            ...ctx,
        });

        expect(card.canAfford).toBe(true);
        expect(card.enabled).toBe(false);
        expect(card.executable).toBe(false);
        expect(card.previewOnly).toBe(true);
        expect(card.availability).toBe('preview_available');
    });

    it('diagnostica class_mismatch quando a instância ativa permanece sem classe resolvida', () => {
        const ctx = makeReadyContext({
            playerMonster: {
                class: 'Neutro',
                templateId: 'MON_001',
            },
        });

        const diagnostics = inspectBasicCardReadiness({
            cardId: 'CARD_GUERREIRO_GOLPE_FIRME',
            player: ctx.player,
            playerMonster: ctx.playerMonster,
            encounter: ctx.encounter,
            actionHandlersConnected: true,
        });

        expect(diagnostics.readiness).toEqual({ ok: false, reason: 'class_mismatch' });
        expect(diagnostics.checks.playerMonsterClass).toBe(null);
        expect(diagnostics.checks.playerMonsterClassSource).toBe('unresolved');
        expect(diagnostics.checks.playerMonsterEneOk).toBe(true);
        expect(diagnostics.checks.encounterValid).toBe(true);
        expect(diagnostics.checks.wildMonsterHpOk).toBe(true);
    });

    it('marca Golpe Firme como executavel com shape real legado quando a classe vem do template', () => {
        const ctx = makeReadyContext({
            playerMonster: {
                class: 'Neutro',
                templateId: 'MON_001',
            },
        });
        const resolveMonsterTemplate = vi.fn((templateId) => (
            templateId === 'MON_001' ? { id: 'MON_001', class: 'Guerreiro' } : null
        ));

        const [card] = buildBasicCardHandViewModel('Guerreiro', {
            currentEne: ctx.playerMonster.ene,
            actionHandlersConnected: true,
            ...ctx,
            resolveMonsterTemplate,
        });

        expect(resolveMonsterTemplate).toHaveBeenCalledWith('MON_001');
        expect(card.enabled).toBe(true);
        expect(card.executable).toBe(true);
        expect(card.previewOnly).toBe(false);
        expect(card.availability).toBe('ready');
    });

    it('diagnostica sucesso quando a classe efetiva vem do template canônico', () => {
        const ctx = makeReadyContext({
            playerMonster: {
                class: 'Neutro',
                templateId: 'MON_001',
            },
        });

        const diagnostics = inspectBasicCardReadiness({
            cardId: 'CARD_GUERREIRO_GOLPE_FIRME',
            player: ctx.player,
            playerMonster: ctx.playerMonster,
            encounter: ctx.encounter,
            actionHandlersConnected: true,
            resolveMonsterTemplate: (templateId) => (
                templateId === 'MON_001' ? { id: 'MON_001', class: 'Guerreiro' } : null
            ),
        });

        expect(diagnostics.readiness).toEqual({ ok: true, reason: 'ready' });
        expect(diagnostics.checks.playerMonsterClass).toBe('Guerreiro');
        expect(diagnostics.checks.playerMonsterClassSource).toBe('catalog');
        expect(diagnostics.checks.playerMonsterEneOk).toBe(true);
    });

    it('bloqueia Golpe Firme quando ENE e insuficiente', () => {
        const ctx = makeReadyContext({ playerMonster: { ene: 0 } });
        const [card] = buildBasicCardHandViewModel('Guerreiro', {
            currentEne: ctx.playerMonster.ene,
            actionHandlersConnected: true,
            ...ctx,
        });

        expect(card.canAfford).toBe(false);
        expect(card.enabled).toBe(false);
        expect(card.executable).toBe(false);
        expect(card.previewOnly).toBe(true);
        expect(card.availability).toBe('insufficient_ene');
        expect(card.disabledReason).toBe('Precisa de mais ENE.');
    });

    it('mantem outras cartas bloqueadas mesmo com ENE suficiente e handler conectado', () => {
        const classes = ['Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];

        for (const className of classes) {
            const player = { id: `P_${className}`, class: className };
            const playerMonster = { id: `M_${className}`, class: className, hp: 20, ene: 10 };
            const encounter = { active: true, wildMonster: { id: 'W1', hp: 12 } };
            const [card] = buildBasicCardHandViewModel(className, {
                currentEne: 10,
                actionHandlersConnected: true,
                player,
                playerMonster,
                encounter,
            });

            expect(card.enabled).toBe(false);
            expect(card.executable).toBe(false);
            expect(card.previewOnly).toBe(true);
            expect(card.availability).toBe('coming_soon');
            expect(card.disabledReason).toBe('Essa carta ainda não está disponível.');
        }
    });

    it('trata ENE ausente, nula ou invalida de forma segura', () => {
        const [noOptions] = buildBasicCardHandViewModel('Bárbaro');
        const [nullEne] = buildBasicCardHandViewModel('Bárbaro', { currentEne: null });
        const [invalidEne] = buildBasicCardHandViewModel('Bárbaro', { currentEne: 'abc' });
        const [negativeEne] = buildBasicCardHandViewModel('Bárbaro', { currentEne: -10 });

        expect(noOptions.canAfford).toBe(false);
        expect(nullEne.canAfford).toBe(false);
        expect(invalidEne.canAfford).toBe(false);
        expect(negativeEne.canAfford).toBe(false);
    });

    it('helper de UI chama executeBasicCardAction com wrapper fechado de executeWildAttack', () => {
        const ctx = makeReadyContext();
        const executeWildAttack = vi.fn(() => ({ success: true, result: 'ongoing' }));
        const executeBasicCardActionImpl = vi.fn(({ dependencies }) => {
            const attackResult = dependencies.executeWildAttack();
            return {
                success: true,
                reason: 'card_executed',
                attackResult,
            };
        });
        const dependencies = { marker: 'wild-deps' };

        const result = executeBasicCardFromHand({
            cardId: 'CARD_GUERREIRO_GOLPE_FIRME',
            ...ctx,
            d20Roll: 14,
            defenderRoll: 3,
            executeWildAttack,
            dependencies,
            executeBasicCardActionImpl,
            resolveMonsterTemplate: () => ({ id: 'MON_001', class: 'Guerreiro' }),
        });

        expect(result.success).toBe(true);
        expect(executeBasicCardActionImpl).toHaveBeenCalledWith(expect.objectContaining({
            cardId: 'CARD_GUERREIRO_GOLPE_FIRME',
            player: ctx.player,
            playerMonster: ctx.playerMonster,
            encounter: ctx.encounter,
        }));
        expect(executeWildAttack).toHaveBeenCalledWith({
            encounter: ctx.encounter,
            player: ctx.player,
            playerMonster: ctx.playerMonster,
            d20Roll: 14,
            defenderRoll: 3,
            dependencies,
        });
    });

    it('helper nao chama action para cartas nao suportadas', () => {
        const ctx = makeReadyContext();
        const executeWildAttack = vi.fn();
        const executeBasicCardActionImpl = vi.fn();

        const result = executeBasicCardFromHand({
            cardId: 'CARD_MAGO_FAISCA_ARCANA',
            ...ctx,
            d20Roll: 10,
            defenderRoll: 2,
            executeWildAttack,
            executeBasicCardActionImpl,
        });

        expect(result).toEqual({ success: false, reason: 'unsupported_card' });
        expect(executeBasicCardActionImpl).not.toHaveBeenCalled();
        expect(executeWildAttack).not.toHaveBeenCalled();
    });

    it('helper nao chama action quando ENE é insuficiente', () => {
        const ctx = makeReadyContext({ playerMonster: { ene: 0 } });
        const executeWildAttack = vi.fn();
        const executeBasicCardActionImpl = vi.fn();

        const result = executeBasicCardFromHand({
            cardId: 'CARD_GUERREIRO_GOLPE_FIRME',
            ...ctx,
            d20Roll: 10,
            defenderRoll: 2,
            executeWildAttack,
            executeBasicCardActionImpl,
        });

        expect(result).toEqual({ success: false, reason: 'insufficient_ene' });
        expect(executeBasicCardActionImpl).not.toHaveBeenCalled();
        expect(executeWildAttack).not.toHaveBeenCalled();
    });

    it('helper aceita ENE legado via currentEne no monstrinho quando o template resolve Guerreiro', () => {
        const ctx = makeReadyContext({
            playerMonster: {
                class: 'Neutro',
                ene: undefined,
                currentEne: 2,
                templateId: 'MON_001',
            },
        });
        const executeWildAttack = vi.fn(() => ({ success: true, result: 'ongoing' }));
        const executeBasicCardActionImpl = vi.fn(() => ({ success: true, reason: 'card_executed' }));

        const result = executeBasicCardFromHand({
            cardId: 'CARD_GUERREIRO_GOLPE_FIRME',
            ...ctx,
            d20Roll: 12,
            defenderRoll: 4,
            executeWildAttack,
            executeBasicCardActionImpl,
            resolveMonsterTemplate: () => ({ id: 'MON_001', class: 'Guerreiro' }),
        });

        expect(result.success).toBe(true);
        expect(executeBasicCardActionImpl).toHaveBeenCalledTimes(1);
    });

    it('traduz motivos tecnicos para feedback seguro', () => {
        expect(getBasicCardActionFeedback('insufficient_ene')).toBe('Você precisa de mais ENE.');
        expect(getBasicCardActionFeedback('unsupported_card')).toBe('Essa carta ainda não está disponível.');
        expect(getBasicCardActionFeedback('player_monster_fainted')).toBe('Esse monstrinho não pode agir agora.');
        expect(getBasicCardActionFeedback('invalid_encounter')).toBe('A carta não pode ser usada nesta batalha.');
    });
});
