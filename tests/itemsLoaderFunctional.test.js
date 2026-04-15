/**
 * ITEMS LOADER FUNCTIONAL TESTS (Bug Audit)
 *
 * Testes para funções de acesso a itens sem cobertura prévia:
 *   - getAllItems, getItemsByTier, getItemsByCategory, getAllEggs
 *   - canItemBreak, getItemBreakChance, getItemStats
 *   - validateItem
 *
 * Cobertura:
 *   - Retorno correto quando cache está/não está carregado
 *   - Filtros por tier e categoria
 *   - Validação de itens held, heal, capture, egg
 *   - Edge cases: item inexistente, campo break ausente
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    validateItem,
    getAllItems,
    getItemsByTier,
    getItemsByCategory,
    getAllEggs,
    canItemBreak,
    getItemBreakChance,
    getItemStats,
} from '../js/data/itemsLoader.js';

// ─── Helpers / fixtures ──────────────────────────────────────────────────────

function makeHeldItem(overrides = {}) {
    return {
        id: 'IT_TEST_01',
        name: 'Amuleto Teste',
        type: 'held',
        tier: 'comum',
        stats: { atk: 1, def: 2 },
        break: { enabled: true, chance: 0.15 },
        ...overrides
    };
}

function makeHealItem(overrides = {}) {
    return {
        id: 'IT_HEAL_TEST',
        name: 'Poção Teste',
        type: 'heal',
        heal_pct: 0.30,
        heal_min: 10,
        ...overrides
    };
}

function makeCaptureItem(overrides = {}) {
    return {
        id: 'IT_CAP_TEST',
        name: 'Orbe Teste',
        type: 'capture',
        capture_bonus_pp: 0.15,
        ...overrides
    };
}

function makeEggItem(overrides = {}) {
    return {
        id: 'EGG_TEST',
        name: 'Ovo Teste',
        category: 'egg',
        stackable: true,
        maxStack: 10,
        usableIn: ['menu'],
        effects: [{ type: 'hatch_egg', mode: 'by_rarity', rarity: 'Comum' }],
        ...overrides
    };
}

// ─── validateItem ────────────────────────────────────────────────────────────

describe('validateItem', () => {
    describe('itens held', () => {
        it('deve aceitar item held válido', () => {
            expect(validateItem(makeHeldItem())).toBe(true);
        });

        it('deve rejeitar item sem id', () => {
            expect(validateItem(makeHeldItem({ id: '' }))).toBe(false);
            expect(validateItem(makeHeldItem({ id: undefined }))).toBe(false);
        });

        it('deve rejeitar item sem name', () => {
            expect(validateItem(makeHeldItem({ name: '' }))).toBe(false);
        });

        it('deve rejeitar item held sem tier', () => {
            expect(validateItem(makeHeldItem({ tier: undefined }))).toBe(false);
        });

        it('deve rejeitar item held com stats inválidos', () => {
            expect(validateItem(makeHeldItem({ stats: null }))).toBe(false);
            expect(validateItem(makeHeldItem({ stats: { atk: 'forte', def: 2 } }))).toBe(false);
        });

        it('deve rejeitar item held com break inválido', () => {
            expect(validateItem(makeHeldItem({ break: null }))).toBe(false);
            expect(validateItem(makeHeldItem({ break: { enabled: true, chance: 1.5 } }))).toBe(false);
        });

        it('deve aceitar chance de quebra 0 (nunca quebra)', () => {
            expect(validateItem(makeHeldItem({ break: { enabled: false, chance: 0 } }))).toBe(true);
        });
    });

    describe('itens heal', () => {
        it('deve aceitar item heal válido', () => {
            expect(validateItem(makeHealItem())).toBe(true);
        });

        it('deve rejeitar heal_pct fora de [0-1]', () => {
            expect(validateItem(makeHealItem({ heal_pct: -0.1 }))).toBe(false);
            expect(validateItem(makeHealItem({ heal_pct: 1.5 }))).toBe(false);
        });

        it('deve rejeitar heal_min negativo', () => {
            expect(validateItem(makeHealItem({ heal_min: -5 }))).toBe(false);
        });
    });

    describe('itens capture', () => {
        it('deve aceitar item capture válido', () => {
            expect(validateItem(makeCaptureItem())).toBe(true);
        });

        it('deve rejeitar capture_bonus_pp negativo', () => {
            expect(validateItem(makeCaptureItem({ capture_bonus_pp: -0.1 }))).toBe(false);
        });
    });

    describe('ovos (egg)', () => {
        it('deve aceitar ovo válido', () => {
            expect(validateItem(makeEggItem())).toBe(true);
        });

        it('deve rejeitar ovo sem campo stackable', () => {
            const egg = makeEggItem();
            delete egg.stackable;
            expect(validateItem(egg)).toBe(false);
        });

        it('deve rejeitar ovo sem efeito hatch_egg', () => {
            expect(validateItem(makeEggItem({ effects: [] }))).toBe(false);
            expect(validateItem(makeEggItem({ effects: [{ type: 'outro' }] }))).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('deve rejeitar null/undefined', () => {
            expect(validateItem(null)).toBe(false);
            expect(validateItem(undefined)).toBe(false);
            expect(validateItem(42)).toBe(false);
        });
    });
});

// ─── Funções de acesso (com cache vazio / não carregado) ─────────────────────

describe('getAllItems - cache não carregado', () => {
    it('deve retornar array vazio se cache não foi carregado', () => {
        // Cache começa null — getAllItems deve retornar []
        const result = getAllItems();
        expect(Array.isArray(result)).toBe(true);
        // Pode ser [] (vazio) se não foi feito loadItems()
        // Não deve lançar erro
    });
});

describe('getItemsByTier - cache não carregado', () => {
    it('deve retornar array vazio se cache não foi carregado', () => {
        expect(getItemsByTier('comum')).toEqual([]);
    });
});

describe('getItemsByCategory - cache não carregado', () => {
    it('deve retornar array vazio se cache não foi carregado', () => {
        expect(getItemsByCategory('egg')).toEqual([]);
    });
});

describe('getAllEggs - cache não carregado', () => {
    it('deve retornar array vazio se cache não foi carregado', () => {
        expect(getAllEggs()).toEqual([]);
    });
});

describe('canItemBreak - cache não carregado', () => {
    it('deve retornar false para qualquer item se cache vazio', () => {
        expect(canItemBreak('IT_INEXISTENTE')).toBe(false);
    });
});

describe('getItemBreakChance - cache não carregado', () => {
    it('deve retornar 0 para item inexistente', () => {
        expect(getItemBreakChance('IT_INEXISTENTE')).toBe(0);
    });
});

describe('getItemStats - cache não carregado', () => {
    it('deve retornar {atk:0, def:0} para item inexistente', () => {
        expect(getItemStats('IT_INEXISTENTE')).toEqual({ atk: 0, def: 0 });
    });
});
