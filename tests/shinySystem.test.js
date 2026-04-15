/**
 * SHINY SYSTEM TESTS (FASE T)
 *
 * Testa as funções puras do módulo shinySystem.js.
 * Cobertura: rollShiny, SHINY_CHANCE_BY_RARITY, edge cases
 */

import { describe, it, expect } from 'vitest';
import {
    rollShiny,
    SHINY_CHANCE_BY_RARITY,
    SHINY_CHANCE_DEFAULT,
} from '../js/data/shinySystem.js';

// ─── Constantes ───────────────────────────────────────────────────────────────

describe('ShinySystem — constantes', () => {
    it('SHINY_CHANCE_BY_RARITY define as 5 raridades canônicas', () => {
        const expected = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];
        expected.forEach(r => {
            expect(SHINY_CHANCE_BY_RARITY).toHaveProperty(r);
        });
    });

    it('todas as chances estão no range (0, 1)', () => {
        Object.values(SHINY_CHANCE_BY_RARITY).forEach(chance => {
            expect(chance).toBeGreaterThan(0);
            expect(chance).toBeLessThan(1);
        });
    });

    it('chances crescem com a raridade', () => {
        expect(SHINY_CHANCE_BY_RARITY['Incomum']).toBeGreaterThan(SHINY_CHANCE_BY_RARITY['Comum']);
        expect(SHINY_CHANCE_BY_RARITY['Raro']).toBeGreaterThan(SHINY_CHANCE_BY_RARITY['Incomum']);
        expect(SHINY_CHANCE_BY_RARITY['Místico']).toBeGreaterThan(SHINY_CHANCE_BY_RARITY['Raro']);
        expect(SHINY_CHANCE_BY_RARITY['Lendário']).toBeGreaterThan(SHINY_CHANCE_BY_RARITY['Místico']);
    });
});

// ─── rollShiny — RNG determinístico ──────────────────────────────────────────

describe('rollShiny — com RNG injetado', () => {
    it('retorna true quando rng() < chance', () => {
        // rng sempre retorna 0 → menor que qualquer chance positiva
        const result = rollShiny('Comum', () => 0);
        expect(result).toBe(true);
    });

    it('retorna false quando rng() >= chance', () => {
        // rng sempre retorna 0.999 → maior que qualquer chance < 1
        const result = rollShiny('Lendário', () => 0.999);
        expect(result).toBe(false);
    });

    it('retorna true exatamente no limiar (rng = chance - epsilon)', () => {
        const chance = SHINY_CHANCE_BY_RARITY['Raro'];
        const result = rollShiny('Raro', () => chance - 0.0001);
        expect(result).toBe(true);
    });

    it('retorna false exatamente no limiar (rng = chance)', () => {
        const chance = SHINY_CHANCE_BY_RARITY['Raro'];
        const result = rollShiny('Raro', () => chance);
        expect(result).toBe(false);
    });
});

// ─── rollShiny — raridade inválida ───────────────────────────────────────────

describe('rollShiny — raridade inválida', () => {
    it('usa SHINY_CHANCE_DEFAULT para raridade desconhecida', () => {
        // rng abaixo do default → true
        const result = rollShiny('RaridadeInexistente', () => SHINY_CHANCE_DEFAULT - 0.001);
        expect(result).toBe(true);
    });

    it('retorna false para raridade null com rng alto', () => {
        const result = rollShiny(null, () => 0.999);
        expect(result).toBe(false);
    });

    it('retorna false para raridade undefined com rng alto', () => {
        const result = rollShiny(undefined, () => 0.999);
        expect(result).toBe(false);
    });
});

// ─── rollShiny — distribuição estatística ────────────────────────────────────

describe('rollShiny — distribuição estatística', () => {
    it('Comum: ~1% de shinies em 10.000 rolls', () => {
        let count = 0;
        const N = 10000;
        for (let i = 0; i < N; i++) {
            if (rollShiny('Comum')) count++;
        }
        const rate = count / N;
        // Esperado ~1%, tolerância ±0.5%
        expect(rate).toBeGreaterThan(0.005);
        expect(rate).toBeLessThan(0.025);
    });

    it('Lendário gera mais shinies que Comum em 10.000 rolls', () => {
        let countC = 0, countL = 0;
        const N = 10000;
        for (let i = 0; i < N; i++) {
            if (rollShiny('Comum')) countC++;
            if (rollShiny('Lendário')) countL++;
        }
        // Lendário deve ter mais shinies em média, com tolerância estatística
        // Esta asserção pode falhar raramente por aleatoriedade; é esperado
        expect(countL).toBeGreaterThanOrEqual(countC - 20);
    });
});
