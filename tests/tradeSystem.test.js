/**
 * TRADE SYSTEM TESTS — FASE IX
 *
 * Cobertura: validateTrade, executeTrade, getTradeableMonsters, getTradeSuggestions
 */

import { describe, it, expect } from 'vitest';
import {
    validateTrade,
    executeTrade,
    getTradeableMonsters,
    getTradeSuggestions,
    TRADE_ERROR,
} from '../js/combat/tradeSystem.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeMon = (id, cls, overrides = {}) => ({
    id,
    name: `Mon-${id}`,
    class: cls,
    hp: 30, hpMax: 30,
    level: 5,
    ownerId: null,
    ...overrides,
});

const makePlayer = (id, cls, team) => ({
    id,
    name: `Jogador-${id}`,
    class: cls,
    team: team || [],
    activeIndex: 0,
});

// ─── validateTrade ────────────────────────────────────────────────────────────

describe('validateTrade', () => {
    it('deve retornar válido para troca entre dois jogadores com monstrinhos diferentes', () => {
        const monA1 = makeMon('m1', 'Mago');
        const monA2 = makeMon('m2', 'Guerreiro');
        const monB1 = makeMon('m3', 'Guerreiro');
        const monB2 = makeMon('m4', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA1, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB1, monB2]);

        const result = validateTrade(pA, monA2, pB, monB1);
        expect(result.valid).toBe(true);
        expect(result.reason).toBeNull();
    });

    it('deve rejeitar troca entre o mesmo jogador', () => {
        const monA = makeMon('m1', 'Mago');
        const monB = makeMon('m2', 'Guerreiro');
        const p = makePlayer('pA', 'Mago', [monA, monB]);

        const result = validateTrade(p, monA, p, monB);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.SAME_PLAYER);
    });

    it('deve rejeitar se monstrinho não pertence ao time do jogador', () => {
        const monA = makeMon('m1', 'Mago');
        const monFake = makeMon('m999', 'Ladino');
        const monB = makeMon('m2', 'Guerreiro');
        const monB2 = makeMon('m3', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA, monFake]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        const result = validateTrade(pA, makeMon('m_nao_existe', 'Curandeiro'), pB, monB);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });

    it('deve rejeitar se o time do jogador tem apenas 1 monstrinho', () => {
        const monA = makeMon('m1', 'Mago');
        const monB = makeMon('m2', 'Guerreiro');
        const monB2 = makeMon('m3', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA]); // só 1
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        const result = validateTrade(pA, monA, pB, monB);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.EMPTY_TEAM);
    });

    it('deve rejeitar se parâmetros forem null', () => {
        const result = validateTrade(null, null, null, null);
        expect(result.valid).toBe(false);
    });
});

// ─── executeTrade ─────────────────────────────────────────────────────────────

describe('executeTrade', () => {
    it('deve trocar monstrinhos entre os times dos jogadores', () => {
        const monA1 = makeMon('m1', 'Mago');
        const monA2 = makeMon('m2', 'Guerreiro');
        const monB1 = makeMon('m3', 'Guerreiro');
        const monB2 = makeMon('m4', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA1, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB1, monB2]);

        const result = executeTrade(pA, monA2, pB, monB1);

        expect(result.success).toBe(true);
        expect(pA.team).toContain(monB1);
        expect(pB.team).toContain(monA2);
        expect(pA.team).not.toContain(monA2);
        expect(pB.team).not.toContain(monB1);
    });

    it('deve atualizar ownerId após a troca', () => {
        const monA1 = makeMon('m1', 'Mago', { ownerId: 'pA' });
        const monA2 = makeMon('m2', 'Guerreiro', { ownerId: 'pA' });
        const monB1 = makeMon('m3', 'Guerreiro', { ownerId: 'pB' });
        const monB2 = makeMon('m4', 'Mago', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA1, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB1, monB2]);

        executeTrade(pA, monA2, pB, monB1);

        expect(monA2.ownerId).toBe('pB');
        expect(monB1.ownerId).toBe('pA');
    });

    it('deve registrar log de troca', () => {
        const monA1 = makeMon('m1', 'Mago');
        const monA2 = makeMon('m2', 'Guerreiro');
        const monB1 = makeMon('m3', 'Guerreiro');
        const monB2 = makeMon('m4', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA1, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB1, monB2]);

        const { log } = executeTrade(pA, monA2, pB, monB1);

        expect(log.length).toBe(1);
        expect(log[0]).toContain('trocou');
    });

    it('deve registrar evento no therapyLog quando fornecido', () => {
        const monA1 = makeMon('m1', 'Mago');
        const monA2 = makeMon('m2', 'Guerreiro');
        const monB1 = makeMon('m3', 'Guerreiro');
        const monB2 = makeMon('m4', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA1, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB1, monB2]);
        const therapyLog = [];

        executeTrade(pA, monA2, pB, monB1, therapyLog);

        expect(therapyLog.length).toBe(1);
        expect(therapyLog[0].event).toBe('trade');
        expect(therapyLog[0].playerAId).toBe('pA');
    });

    it('deve retornar failure para troca inválida', () => {
        const monA = makeMon('m1', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA]);
        const monB = makeMon('m2', 'Guerreiro');
        const pB = makePlayer('pB', 'Guerreiro', [monB]);

        const result = executeTrade(pA, monA, pB, monB); // ambos têm 1 mon
        expect(result.success).toBe(false);
    });

    it('deve resetar activeIndex se o monstrinho ativo foi trocado', () => {
        const monA1 = makeMon('m1', 'Mago');
        const monA2 = makeMon('m2', 'Guerreiro');
        const monB1 = makeMon('m3', 'Guerreiro');
        const monB2 = makeMon('m4', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monA1, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB1, monB2]);
        pA.activeIndex = 0; // monA1 é o ativo

        executeTrade(pA, monA1, pB, monB1); // troca o ativo de pA

        // activeIndex deve apontar para um monstro vivo válido
        expect(pA.activeIndex).toBeGreaterThanOrEqual(0);
        const newActive = pA.team[pA.activeIndex];
        expect(newActive).toBeDefined();
    });
});

// ─── getTradeableMonsters ─────────────────────────────────────────────────────

describe('getTradeableMonsters', () => {
    it('deve retornar monstrinhos de classes diferentes do jogador', () => {
        const player = makePlayer('p1', 'Mago', [
            makeMon('m1', 'Mago'),      // mesma classe → não listado
            makeMon('m2', 'Guerreiro'), // diferente → listado
            makeMon('m3', 'Curandeiro'),// diferente → listado
        ]);

        const result = getTradeableMonsters(player);
        expect(result).toHaveLength(2);
        expect(result.map(m => m.class)).not.toContain('Mago');
    });

    it('deve retornar todos se o jogador não tem classe definida', () => {
        const player = makePlayer('p1', null, [
            makeMon('m1', 'Mago'),
            makeMon('m2', 'Guerreiro'),
        ]);
        player.class = null;

        const result = getTradeableMonsters(player);
        expect(result).toHaveLength(2);
    });

    it('deve retornar array vazio se player é null', () => {
        const result = getTradeableMonsters(null);
        expect(result).toEqual([]);
    });

    it('deve retornar array vazio se todos são da mesma classe', () => {
        const player = makePlayer('p1', 'Mago', [
            makeMon('m1', 'Mago'),
            makeMon('m2', 'Mago'),
        ]);

        const result = getTradeableMonsters(player);
        expect(result).toHaveLength(0);
    });
});

// ─── getTradeSuggestions ──────────────────────────────────────────────────────

describe('getTradeSuggestions', () => {
    it('deve sugerir pares onde ambos recebem monstrinhos de sua classe', () => {
        const pA = makePlayer('pA', 'Mago', [
            makeMon('m1', 'Mago'),       // útil para pA
            makeMon('m2', 'Guerreiro'),  // útil para pB
        ]);
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('m3', 'Guerreiro'),  // útil para pB
            makeMon('m4', 'Mago'),       // útil para pA
        ]);

        const suggestions = getTradeSuggestions(pA, pB);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].monA.class).toBe('Guerreiro'); // monA que vai para pB
        expect(suggestions[0].monB.class).toBe('Mago');      // monB que vai para pA
    });

    it('deve retornar array vazio se nenhuma troca benéfica existe', () => {
        const pA = makePlayer('pA', 'Mago', [makeMon('m1', 'Mago'), makeMon('m2', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [makeMon('m3', 'Curandeiro'), makeMon('m4', 'Bardo')]);

        const suggestions = getTradeSuggestions(pA, pB);
        expect(suggestions).toHaveLength(0);
    });

    it('deve retornar array vazio para players null', () => {
        expect(getTradeSuggestions(null, null)).toEqual([]);
    });

    it('deve retornar array vazio se players não têm classe', () => {
        const pA = makePlayer('pA', null, [makeMon('m1', 'Mago')]);
        const pB = makePlayer('pB', null, [makeMon('m2', 'Guerreiro')]);
        pA.class = null;
        pB.class = null;

        expect(getTradeSuggestions(pA, pB)).toHaveLength(0);
    });
});
