import { describe, it, expect } from 'vitest';
import { buildBasicCardHandViewModel } from '../js/ui/basicCardHandUI.js';

describe('basicCardHandUI — preview seguro (MVP 0.4)', () => {
    it('retorna cartas apenas da classe pedida', () => {
        const hand = buildBasicCardHandViewModel('Guerreiro');
        expect(hand.length).toBeGreaterThan(0);
        for (const card of hand) {
            expect(card.class).toBe('Guerreiro');
        }
    });

    it('não retorna cartas de outras classes', () => {
        const hand = buildBasicCardHandViewModel('Bardo');
        expect(hand.every(card => card.class === 'Bardo')).toBe(true);
    });

    it('classe inválida retorna fallback seguro vazio', () => {
        expect(buildBasicCardHandViewModel('ClasseInexistente')).toEqual([]);
        expect(buildBasicCardHandViewModel('')).toEqual([]);
        expect(buildBasicCardHandViewModel(null)).toEqual([]);
    });

    it('expõe campos esperados no view model', () => {
        const [card] = buildBasicCardHandViewModel('Mago');
        expect(card).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            class: expect.any(String),
            cost: expect.any(Number),
            type: expect.any(String),
            childText: expect.any(String),
            runtimeAction: expect.any(String),
            enabled: false,
            disabledReason: expect.any(String),
        });
    });

    it('sempre retorna enabled=false e reason explícita', () => {
        const hand = buildBasicCardHandViewModel('Animalista');
        expect(hand.length).toBeGreaterThan(0);
        for (const card of hand) {
            expect(card.enabled).toBe(false);
            expect(card.disabledReason).toContain('MVP 0.4');
        }
    });
});
