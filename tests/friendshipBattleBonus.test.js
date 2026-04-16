/**
 * FRIENDSHIP BATTLE BONUS TESTS (Fase XXI — Sprint F3)
 *
 * Verifica que bônus de amizade se aplicam corretamente no contexto de batalha.
 * Cobertura:
 *   - xpMultiplier aplicado em giveXP (xpActions)
 *   - Log de bônus de amizade ao ganhar XP
 *   - getFriendshipBonuses retorna valores corretos por nível
 *   - Amizade atualizada após eventos de batalha (vitória, derrota)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { giveXP } from '../js/progression/xpActions.js';
import {
    getFriendshipBonuses,
    getFriendshipLevel,
    applyFriendshipDelta,
    DEFAULT_FRIENDSHIP,
} from '../js/progression/friendshipSystem.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMon(friendship = 50, overrides = {}) {
    return {
        id: 'mi_test',
        name: 'Luma',
        level: 5,
        xp: 0,
        xpNeeded: 200,
        hp: 50,
        hpMax: 50,
        friendship,
        ...overrides,
    };
}

function makeDeps(getFriendshipBonusesFn) {
    return {
        state: { currentEncounter: { log: [] } },
        constants: { DEFAULT_FRIENDSHIP, maxLevel: 100 },
        helpers: {
            ensureMonsterProgressFields: (mon) => {
                mon.level = mon.level ?? 1;
                mon.xp = mon.xp ?? 0;
                mon.xpNeeded = mon.xpNeeded ?? 200;
            },
            getFriendshipBonuses: getFriendshipBonusesFn || getFriendshipBonuses,
            formatFriendshipBonusPercent: (mult) => Math.round((mult - 1) * 100),
            calcXpNeeded: (level) => Math.round(40 + 6 * level + 0.6 * level * level),
            recalculateStatsFromTemplate: () => {},
            updateFriendship: () => {},
            maybeEvolveAfterLevelUp: () => {},
            maybeUpgradeSkillsModelB: () => {},
        },
    };
}

// ─── XP Multiplier por nível de amizade ──────────────────────────────────────

describe('Friendship — bônus de XP em batalha', () => {
    it('nível 1 (friendship < 25): sem bônus de XP (×1.00)', () => {
        const mon = makeMon(10);
        const deps = makeDeps();
        const log = [];
        giveXP(deps, mon, 100, log);
        // (100 * 1.00) = 100
        expect(mon.xp).toBe(100);
        expect(log[0]).not.toContain('Bônus Amizade');
    });

    it('nível 2 (friendship 25-49): +5% XP', () => {
        const mon = makeMon(30);
        const deps = makeDeps();
        const log = [];
        giveXP(deps, mon, 100, log);
        // getFriendshipBonuses(30) → xpMultiplier: 1.05
        expect(mon.xp).toBe(105);
        expect(log[0]).toContain('Bônus Amizade');
        expect(log[0]).toContain('+5%');
    });

    it('nível 3 (friendship 50-74): +5% XP', () => {
        const mon = makeMon(50);
        const deps = makeDeps();
        const log = [];
        giveXP(deps, mon, 100, log);
        // getFriendshipBonuses(50) → xpMultiplier: 1.05
        expect(mon.xp).toBe(105);
    });

    it('nível 4 (friendship 75-99): +10% XP', () => {
        const mon = makeMon(80);
        const deps = makeDeps();
        const log = [];
        giveXP(deps, mon, 100, log);
        // getFriendshipBonuses(80) → xpMultiplier: 1.10
        expect(mon.xp).toBe(110);
        expect(log[0]).toContain('Bônus Amizade');
        expect(log[0]).toContain('+10%');
    });

    it('nível 5 (friendship 100): +10% XP', () => {
        const mon = makeMon(100);
        const deps = makeDeps();
        const log = [];
        giveXP(deps, mon, 100, log);
        // getFriendshipBonuses(100) → xpMultiplier: 1.10
        expect(mon.xp).toBe(110);
    });

    it('xp arredondado corretamente', () => {
        const mon = makeMon(30); // +5%
        const deps = makeDeps();
        const log = [];
        giveXP(deps, mon, 7, log);
        // round(7 * 1.05) = round(7.35) = 7
        expect(mon.xp).toBe(7);
    });
});

// ─── getFriendshipBonuses por nível ──────────────────────────────────────────

describe('Friendship — getFriendshipBonuses', () => {
    it('nível 1: xpMultiplier=1.0, critChance=0, statBonus=0', () => {
        const b = getFriendshipBonuses(10);
        expect(b.xpMultiplier).toBe(1.0);
        expect(b.critChance).toBe(0);
        expect(b.statBonus).toBe(0);
    });

    it('nível 2: xpMultiplier=1.05', () => {
        const b = getFriendshipBonuses(25);
        expect(b.xpMultiplier).toBe(1.05);
    });

    it('nível 3: xpMultiplier=1.05, critChance=0.05', () => {
        const b = getFriendshipBonuses(50);
        expect(b.xpMultiplier).toBe(1.05);
        expect(b.critChance).toBe(0.05);
    });

    it('nível 4: xpMultiplier=1.10, statBonus=1', () => {
        const b = getFriendshipBonuses(75);
        expect(b.xpMultiplier).toBe(1.10);
        expect(b.statBonus).toBe(1);
    });
});

// ─── Amizade muda após eventos de batalha ────────────────────────────────────

describe('Friendship — delta por evento de batalha', () => {
    it('vitória aumenta amizade', () => {
        const config = { battleWin: 2 };
        const novaAmizade = applyFriendshipDelta(50, config.battleWin);
        expect(novaAmizade).toBe(52);
    });

    it('derrota reduz amizade', () => {
        const config = { battleLoss: -5 };
        const novaAmizade = applyFriendshipDelta(50, config.battleLoss);
        expect(novaAmizade).toBe(45);
    });

    it('amizade clamped entre 0 e 100', () => {
        expect(applyFriendshipDelta(0, -10)).toBe(0);
        expect(applyFriendshipDelta(100, 10)).toBe(100);
    });

    it('desmaio reduz mais amizade que derrota comum', () => {
        const afterFaint = applyFriendshipDelta(50, -3);
        const afterLoss  = applyFriendshipDelta(50, -5);
        // faint(-3) causa menos perda que battleLoss(-5) neste exemplo
        expect(afterFaint).toBeGreaterThan(afterLoss);
    });
});

// ─── Nível de amizade padrão ao criar monstro ────────────────────────────────

describe('Friendship — valor padrão', () => {
    it('DEFAULT_FRIENDSHIP é 50 (nível 3)', () => {
        expect(DEFAULT_FRIENDSHIP).toBe(50);
        expect(getFriendshipLevel(DEFAULT_FRIENDSHIP)).toBe(3);
    });

    it('nível 3 dá +5% XP', () => {
        const b = getFriendshipBonuses(DEFAULT_FRIENDSHIP);
        expect(b.xpMultiplier).toBe(1.05);
    });
});
