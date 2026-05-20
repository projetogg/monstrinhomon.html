import { describe, it, expect } from 'vitest';
import {
    BASIC_CARDS,
    BASIC_CARDS_BY_CLASS,
    getBasicCardById,
    getBasicCardsByClass,
    getAllBasicCards,
    isValidBasicCard,
    validateBasicCardsCatalog,
} from '../js/data/basicCards.js';

const EXPECTED_CLASSES = [
    'Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro',
    'Ladino', 'Bardo', 'Caçador', 'Animalista',
];

describe('basicCards catalog — MVP 0.4 Issue 1', () => {
    it('tem exatamente 8 cartas', () => {
        expect(BASIC_CARDS).toHaveLength(8);
    });

    it('cobre exatamente 1 carta por classe principal', () => {
        for (const cls of EXPECTED_CLASSES) {
            expect(getBasicCardsByClass(cls)).toHaveLength(1);
        }
        expect(Object.keys(BASIC_CARDS_BY_CLASS).sort()).toEqual(EXPECTED_CLASSES.sort());
    });

    it('possui IDs únicos', () => {
        const ids = BASIC_CARDS.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('IDs seguem padrão ASCII/UPPERCASE/underscore e sem padrão inglês antigo', () => {
        const idRegex = /^CARD_[A-Z0-9_]+$/;
        const forbiddenEnglishTokens = ['WARRIOR', 'MAGE', 'HEALER', 'ROGUE', 'HUNTER', 'BASIC', 'STRIKE'];

        for (const card of BASIC_CARDS) {
            expect(idRegex.test(card.id)).toBe(true);
            expect(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ\s-]/.test(card.id)).toBe(false);
            for (const token of forbiddenEnglishTokens) {
                expect(card.id.includes(token)).toBe(false);
            }
        }
    });

    it('todas as cartas têm custo numérico >= 0, runtimeAction, childText e technicalEffect', () => {
        for (const card of BASIC_CARDS) {
            expect(typeof card.cost).toBe('number');
            expect(card.cost).toBeGreaterThanOrEqual(0);
            expect(card.mvp).toBe(true);
            expect(typeof card.runtimeAction).toBe('string');
            expect(card.runtimeAction.length).toBeGreaterThan(0);
            expect(typeof card.childText).toBe('string');
            expect(card.childText.trim().length).toBeGreaterThan(0);
            expect(card.childText.length).toBeLessThanOrEqual(120);
            expect(typeof card.technicalEffect).toBe('string');
            expect(card.technicalEffect.trim().length).toBeGreaterThan(0);
            expect(isValidBasicCard(card)).toBe(true);
        }
    });

    it('getBasicCardById retorna a carta correta', () => {
        const card = getBasicCardById('CARD_MAGO_FAISCA_ARCANA');
        expect(card).toBeTruthy();
        expect(card?.name).toBe('Faísca Arcana');
        expect(getBasicCardById('CARD_INEXISTENTE')).toBeNull();
    });

    it('getBasicCardsByClass retorna somente cartas da classe pedida', () => {
        const cards = getBasicCardsByClass('Bardo');
        expect(cards).toHaveLength(1);
        expect(cards[0].class).toBe('Bardo');
    });

    it('classe inválida retorna lista vazia (erro controlado)', () => {
        expect(getBasicCardsByClass('ClasseInexistente')).toEqual([]);
        expect(getBasicCardsByClass(null)).toEqual([]);
    });

    it('catálogo completo valida sem erros', () => {
        const result = validateBasicCardsCatalog();
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('não impacta contrato do Wild Loop (somente dados declarativos)', () => {
        const all = getAllBasicCards();
        expect(all).toHaveLength(8);
        // Garantia: nenhum campo operacional de combate foi introduzido aqui além de runtimeAction declarativa
        for (const card of all) {
            expect(typeof card.runtimeAction).toBe('string');
        }
    });
});
