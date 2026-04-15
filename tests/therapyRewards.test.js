/**
 * THERAPY REWARDS TESTS (FASE H)
 *
 * Testa as funções puras do módulo therapyRewards.js.
 * Cobertura: getMedalRewards, applyTherapyMedalRewards
 */

import { describe, it, expect, vi } from 'vitest';
import {
    MEDAL_REWARDS,
    getMedalRewards,
    applyTherapyMedalRewards
} from '../js/therapy/therapyRewards.js';

// ─── getMedalRewards ──────────────────────────────────────────────────────────

describe('getMedalRewards', () => {
    it('retorna recompensas corretas para bronze', () => {
        expect(getMedalRewards('bronze')).toEqual({ xp: 20, moeda: 1 });
    });

    it('retorna recompensas corretas para silver (prata)', () => {
        expect(getMedalRewards('silver')).toEqual({ xp: 50, moeda: 3 });
    });

    it('retorna recompensas corretas para gold (ouro)', () => {
        expect(getMedalRewards('gold')).toEqual({ xp: 150, moeda: 7 });
    });

    it('retorna null para medalha inválida', () => {
        expect(getMedalRewards('platina')).toBeNull();
        expect(getMedalRewards('')).toBeNull();
        expect(getMedalRewards(null)).toBeNull();
    });

    it('MEDAL_REWARDS tem valores positivos', () => {
        for (const [, v] of Object.entries(MEDAL_REWARDS)) {
            expect(v.xp).toBeGreaterThan(0);
            expect(v.moeda).toBeGreaterThan(0);
        }
    });

    it('recompensas crescem bronze < silver < gold', () => {
        expect(MEDAL_REWARDS.bronze.xp).toBeLessThan(MEDAL_REWARDS.silver.xp);
        expect(MEDAL_REWARDS.silver.xp).toBeLessThan(MEDAL_REWARDS.gold.xp);
        expect(MEDAL_REWARDS.bronze.moeda).toBeLessThan(MEDAL_REWARDS.silver.moeda);
        expect(MEDAL_REWARDS.silver.moeda).toBeLessThan(MEDAL_REWARDS.gold.moeda);
    });
});

// ─── applyTherapyMedalRewards ─────────────────────────────────────────────────

function makePlayer(overrides = {}) {
    return {
        id: 'player_1',
        name: 'Ana',
        moeda: 0,
        activeIndex: 0,
        team: [
            { monsterId: 'MON_001', name: 'Cantapau', level: 5, hp: 20, hpMax: 28 }
        ],
        ...overrides
    };
}

describe('applyTherapyMedalRewards', () => {
    it('retorna zeros se player for null', () => {
        const deps = { giveXP: vi.fn() };
        const result = applyTherapyMedalRewards(null, 'bronze', deps);
        expect(result).toEqual({ xpAwarded: 0, moedaAwarded: 0, monsterName: null });
        expect(deps.giveXP).not.toHaveBeenCalled();
    });

    it('retorna zeros para medalha inválida', () => {
        const player = makePlayer();
        const deps = { giveXP: vi.fn() };
        const result = applyTherapyMedalRewards(player, 'platina', deps);
        expect(result).toEqual({ xpAwarded: 0, moedaAwarded: 0, monsterName: null });
    });

    it('bronze: chama giveXP com 20 XP e adiciona 1 moeda', () => {
        const player = makePlayer({ moeda: 5 });
        const deps = { giveXP: vi.fn() };

        const result = applyTherapyMedalRewards(player, 'bronze', deps);

        expect(deps.giveXP).toHaveBeenCalledWith(player.team[0], 20, []);
        expect(result.xpAwarded).toBe(20);
        expect(result.moedaAwarded).toBe(1);
        expect(player.moeda).toBe(6);
        expect(result.monsterName).toBe('Cantapau');
    });

    it('silver: chama giveXP com 50 XP e adiciona 3 moedas', () => {
        const player = makePlayer({ moeda: 0 });
        const deps = { giveXP: vi.fn() };

        const result = applyTherapyMedalRewards(player, 'silver', deps);

        expect(deps.giveXP).toHaveBeenCalledWith(player.team[0], 50, []);
        expect(result.xpAwarded).toBe(50);
        expect(result.moedaAwarded).toBe(3);
        expect(player.moeda).toBe(3);
    });

    it('gold: chama giveXP com 150 XP e adiciona 7 moedas', () => {
        const player = makePlayer({ moeda: 10 });
        const deps = { giveXP: vi.fn() };

        const result = applyTherapyMedalRewards(player, 'gold', deps);

        expect(deps.giveXP).toHaveBeenCalledWith(player.team[0], 150, []);
        expect(result.xpAwarded).toBe(150);
        expect(result.moedaAwarded).toBe(7);
        expect(player.moeda).toBe(17);
    });

    it('não aplica XP se monstro ativo estiver com HP=0 (KO)', () => {
        const player = makePlayer();
        player.team[0].hp = 0;
        const deps = { giveXP: vi.fn() };

        const result = applyTherapyMedalRewards(player, 'bronze', deps);

        expect(deps.giveXP).not.toHaveBeenCalled();
        expect(result.xpAwarded).toBe(0);
        // Moeda ainda é aplicada
        expect(result.moedaAwarded).toBe(1);
    });

    it('usa addPlayerMoeda de deps se fornecida', () => {
        const player = makePlayer({ moeda: 0 });
        const addPlayerMoeda = vi.fn();
        const deps = { giveXP: vi.fn(), addPlayerMoeda };

        applyTherapyMedalRewards(player, 'bronze', deps);

        expect(addPlayerMoeda).toHaveBeenCalledWith(player, 1);
    });

    it('inicializa moeda=0 quando player.moeda é undefined', () => {
        const player = makePlayer();
        delete player.moeda;
        const deps = { giveXP: vi.fn() };

        const result = applyTherapyMedalRewards(player, 'gold', deps);

        expect(player.moeda).toBe(7);
        expect(result.moedaAwarded).toBe(7);
    });

    it('usa activeIndex correto se diferente de 0', () => {
        const player = makePlayer({
            moeda: 0,
            activeIndex: 1,
            team: [
                { monsterId: 'MON_001', name: 'Bancado', level: 5, hp: 0, hpMax: 28 }, // KO
                { monsterId: 'MON_002', name: 'Ativo', level: 8, hp: 30, hpMax: 42 }
            ]
        });
        const deps = { giveXP: vi.fn() };

        const result = applyTherapyMedalRewards(player, 'silver', deps);

        expect(deps.giveXP).toHaveBeenCalledWith(player.team[1], 50, []);
        expect(result.monsterName).toBe('Ativo');
    });

    it('passa logArr para giveXP quando fornecido', () => {
        const player = makePlayer();
        const deps = { giveXP: vi.fn() };
        const log = [];

        applyTherapyMedalRewards(player, 'bronze', deps, log);

        expect(deps.giveXP).toHaveBeenCalledWith(player.team[0], 20, log);
    });
});
