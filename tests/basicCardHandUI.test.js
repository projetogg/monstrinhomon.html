import { describe, it, expect } from 'vitest';
import { buildBasicCardHandViewModel } from '../js/ui/basicCardHandUI.js';

describe('basicCardHandUI — preview seguro (MVP 0.4)', () => {
    it('retorna cartas apenas da classe pedida', () => {
        const hand = buildBasicCardHandViewModel('Guerreiro', { currentEne: 3 });
        expect(hand.length).toBeGreaterThan(0);
        for (const card of hand) {
            expect(card.class).toBe('Guerreiro');
        }
    });

    it('não retorna cartas de outras classes', () => {
        const hand = buildBasicCardHandViewModel('Bardo', { currentEne: 1 });
        expect(hand.every(card => card.class === 'Bardo')).toBe(true);
    });

    it('classe inválida retorna fallback seguro vazio', () => {
        expect(buildBasicCardHandViewModel('ClasseInexistente', { currentEne: 2 })).toEqual([]);
        expect(buildBasicCardHandViewModel('', { currentEne: 2 })).toEqual([]);
        expect(buildBasicCardHandViewModel(null, { currentEne: 2 })).toEqual([]);
    });

    it('expõe campos esperados no view model', () => {
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

    it('mantém Golpe Firme em preview na UI mesmo com ENE suficiente', () => {
        const [card] = buildBasicCardHandViewModel('Guerreiro', { currentEne: 1 });
        expect(card.id).toBe('CARD_GUERREIRO_GOLPE_FIRME');
        expect(card.canAfford).toBe(true);
        expect(card.enabled).toBe(false);
        expect(card.executable).toBe(false);
        expect(card.previewOnly).toBe(true);
        expect(card.availability).toBe('preview_available');
        expect(card.disabledReason).toContain('execução preparada');
    });

    it('marca canAfford=false quando ENE é insuficiente e traz razão clara', () => {
        const [card] = buildBasicCardHandViewModel('Bárbaro', { currentEne: 1 });
        expect(card.cost).toBe(2);
        expect(card.canAfford).toBe(false);
        expect(card.enabled).toBe(false);
        expect(card.executable).toBe(false);
        expect(card.previewOnly).toBe(true);
        expect(card.availability).toBe('insufficient_ene');
        expect(card.disabledReason).toContain('Precisa de mais ENE');
    });

    it('mantém outras cartas em preview, mesmo com ENE suficiente', () => {
        const [card] = buildBasicCardHandViewModel('Mago', { currentEne: 10 });

        expect(card.canAfford).toBe(true);
        expect(card.previewOnly).toBe(true);
        expect(card.enabled).toBe(false);
        expect(card.executable).toBe(false);
    });

    it('trata ENE ausente, nula ou inválida de forma segura', () => {
        const [noOptions] = buildBasicCardHandViewModel('Bárbaro');
        const [nullEne] = buildBasicCardHandViewModel('Bárbaro', { currentEne: null });
        const [invalidEne] = buildBasicCardHandViewModel('Bárbaro', { currentEne: 'abc' });
        const [negativeEne] = buildBasicCardHandViewModel('Bárbaro', { currentEne: -10 });

        expect(noOptions.canAfford).toBe(false);
        expect(nullEne.canAfford).toBe(false);
        expect(invalidEne.canAfford).toBe(false);
        expect(negativeEne.canAfford).toBe(false);
    });
});