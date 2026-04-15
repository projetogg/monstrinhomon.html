/**
 * FULL CYCLE INTEGRATION TESTS (FASE S)
 *
 * Testa o fluxo completo: XP → level up → evolução → save/restore de campos.
 * Usa mocks mínimos (sem acesso a GameState, DOM ou localStorage).
 *
 * Módulos testados em integração:
 *   - js/progression/xpCore.js    (calculateBattleXP)
 *   - js/progression/xpActions.js (giveXP, levelUpMonster)
 *   - js/data/evolutionSystem.js  (checkEvolution, executeEvolution)
 *   - js/progression/friendshipSystem.js (getFriendshipBonuses)
 */

import { describe, it, expect } from 'vitest';

import { calculateBattleXP } from '../js/progression/xpCore.js';
import { giveXP, levelUpMonster } from '../js/progression/xpActions.js';
import { checkEvolution, executeEvolution } from '../js/data/evolutionSystem.js';
import {
    getFriendshipBonuses,
    DEFAULT_FRIENDSHIP,
} from '../js/progression/friendshipSystem.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcXpNeeded(level) {
    const L = Math.max(1, Number(level) || 1);
    return Math.round(40 + 6 * L + 0.6 * (L * L));
}

function makeMon(overrides = {}) {
    const level = overrides.level || 1;
    return {
        instanceId: 'mi_test_001',
        name: 'TestMon',
        monsterId: 't_base',
        level,
        xp: 0,
        xpNeeded: calcXpNeeded(level),
        hp: 30,
        hpMax: 30,
        rarity: 'Comum',
        class: 'Mago',
        friendship: DEFAULT_FRIENDSHIP,
        ...overrides,
    };
}

function makeEnemy(level = 1, rarity = 'Comum') {
    return { level, rarity };
}

/**
 * Deps mínimas para xpActions (sem GameState real).
 */
function makeDeps(mon = null) {
    return {
        state: { currentEncounter: { log: [] } },
        constants: {
            DEFAULT_FRIENDSHIP,
            maxLevel: 100,
        },
        helpers: {
            ensureMonsterProgressFields(m) {
                if (!m) return;
                m.level = Math.max(1, Number(m.level) || 1);
                m.xp = Math.max(0, Number(m.xp) || 0);
                m.xpNeeded = Math.max(1, Number(m.xpNeeded) || calcXpNeeded(m.level));
                if (m.hpMax == null && m.maxHp != null) m.hpMax = m.maxHp;
                if (m.hp == null && m.hpMax != null) m.hp = m.hpMax;
            },
            calcXpNeeded,
            recalculateStatsFromTemplate() {},
            getFriendshipBonuses,
            formatFriendshipBonusPercent: (mult) => Math.round((mult - 1) * 100),
            updateFriendship() {},
            maybeEvolveAfterLevelUp() {},
            maybeUpgradeSkillsModelB() {},
        },
    };
}

// ─── calculateBattleXP ────────────────────────────────────────────────────────

describe('calculateBattleXP — cálculo de XP de batalha', () => {
    const config = {
        battleXpBase: 15,
        rarityXP: { Comum: 1.0, Incomum: 1.05, Raro: 1.10, Místico: 1.15, Lendário: 1.25 },
    };

    it('calcula XP para inimigo nível 1 Comum', () => {
        // (15 + 1*2) * 1.0 = 17
        expect(calculateBattleXP(makeEnemy(1, 'Comum'), null, config)).toBe(17);
    });

    it('calcula XP para inimigo nível 5 Raro', () => {
        // (15 + 5*2) * 1.10 = 27.5 → 27
        expect(calculateBattleXP(makeEnemy(5, 'Raro'), null, config)).toBe(27);
    });

    it('aplica bônus de boss (×1.5)', () => {
        const base = calculateBattleXP(makeEnemy(1, 'Comum'), null, config);
        const boss = calculateBattleXP(makeEnemy(1, 'Comum'), 'boss', config);
        expect(boss).toBe(Math.floor(base * 1.5));
    });
});

// ─── giveXP — integração XP + friendship ─────────────────────────────────────

describe('giveXP — progressão com amizade', () => {
    it('adiciona XP ao monstro', () => {
        const mon = makeMon();
        const deps = makeDeps(mon);
        giveXP(deps, mon, 10, []);
        expect(mon.xp).toBeGreaterThan(0);
    });

    it('aplica bônus de amizade nível 2 (+5%)', () => {
        // Usar nível 99 para xpNeeded alto e evitar level up durante o teste
        const mon = makeMon({ friendship: 25, level: 99, xpNeeded: calcXpNeeded(99) });
        const deps = makeDeps(mon);
        const log = [];
        giveXP(deps, mon, 100, log);
        // Esperado: round(100 * 1.05) = 105
        expect(mon.xp).toBe(105);
        expect(log[0]).toContain('Bônus Amizade');
    });

    it('sem bônus de amizade nível 1 (amizade < 25)', () => {
        // Usar nível 99 para xpNeeded alto e evitar level up durante o teste
        const mon = makeMon({ friendship: 10, level: 99, xpNeeded: calcXpNeeded(99) });
        const deps = makeDeps(mon);
        const log = [];
        giveXP(deps, mon, 100, log);
        expect(mon.xp).toBe(100);
    });

    it('sobe de nível quando XP >= xpNeeded', () => {
        const mon = makeMon({ level: 1, xpNeeded: calcXpNeeded(1) });
        const deps = makeDeps(mon);
        giveXP(deps, mon, calcXpNeeded(1) + 10, []);
        expect(mon.level).toBe(2);
    });
});

// ─── levelUpMonster — stats após level up ────────────────────────────────────

describe('levelUpMonster — atualização de atributos', () => {
    it('incrementa nível em 1', () => {
        const mon = makeMon({ level: 5, xpNeeded: calcXpNeeded(5) });
        const deps = makeDeps(mon);
        levelUpMonster(deps, mon, []);
        expect(mon.level).toBe(6);
    });

    it('atualiza xpNeeded para o novo nível', () => {
        const mon = makeMon({ level: 3, xpNeeded: calcXpNeeded(3) });
        const deps = makeDeps(mon);
        levelUpMonster(deps, mon, []);
        expect(mon.xpNeeded).toBe(calcXpNeeded(4));
    });

    it('não ultrapassa nível máximo (100)', () => {
        const mon = makeMon({ level: 100, xpNeeded: calcXpNeeded(100) });
        const deps = makeDeps(mon);
        // Forçar xp acima do limite
        mon.xp = calcXpNeeded(100) + 50;
        giveXP(deps, mon, 0, []);
        expect(mon.level).toBeLessThanOrEqual(100);
    });
});

// ─── checkEvolution → executeEvolution — ciclo completo ──────────────────────

describe('checkEvolution + executeEvolution — ciclo completo', () => {
    const baseTemplate = { id: 't_base',  name: 'Basemon',  baseHp: 30,  evolvesAt: 16, evolvesTo: 't_evo' };
    const evoTemplate  = { id: 't_evo',   name: 'Evomon',   baseHp: 50 };
    const templateWithEvo = { ...baseTemplate, evolution: { atLv: 16, toId: 't_evo' } };

    it('não deve evoluir abaixo do nível de evolução', () => {
        const mon = makeMon({ level: 15 });
        const { shouldEvolve } = checkEvolution(mon, templateWithEvo);
        expect(shouldEvolve).toBe(false);
    });

    it('deve evoluir no nível exato de evolução', () => {
        const mon = makeMon({ level: 16 });
        const { shouldEvolve, newTemplateId } = checkEvolution(mon, templateWithEvo);
        expect(shouldEvolve).toBe(true);
        expect(newTemplateId).toBe('t_evo');
    });

    it('executeEvolution atualiza nome e hpMax', () => {
        const mon = makeMon({ level: 16, hp: 15, hpMax: 30 });
        executeEvolution(mon, evoTemplate);
        expect(mon.name).toBe('Evomon');
        expect(mon.hpMax).toBeGreaterThan(0);
    });

    it('executeEvolution preserva HP% atual', () => {
        const mon = makeMon({ level: 16, hp: 15, hpMax: 30 }); // 50% HP
        executeEvolution(mon, evoTemplate);
        const newPct = mon.hp / mon.hpMax;
        // Deve estar próximo de 50%
        expect(newPct).toBeCloseTo(0.5, 1);
    });

    it('executeEvolution preserva HP% via opts.hpPct', () => {
        const mon = makeMon({ level: 16 });
        executeEvolution(mon, evoTemplate, { hpPct: 0.75 });
        const pct = mon.hp / mon.hpMax;
        expect(pct).toBeCloseTo(0.75, 1);
    });
});

// ─── Save/restore — integridade de campos críticos ───────────────────────────

describe('Save/restore — integridade de campos do monstro', () => {
    /**
     * Simula save → JSON → parse (como seria o localStorage).
     */
    function serialize(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    it('preserva nível após serialização', () => {
        const mon = makeMon({ level: 7 });
        const restored = serialize(mon);
        expect(restored.level).toBe(7);
    });

    it('preserva XP após serialização', () => {
        const mon = makeMon({ level: 3, xp: 45 });
        const restored = serialize(mon);
        expect(restored.xp).toBe(45);
    });

    it('preserva HP% após serialização', () => {
        const mon = makeMon({ hp: 15, hpMax: 30 });
        const restored = serialize(mon);
        expect(restored.hp / restored.hpMax).toBe(0.5);
    });

    it('preserva monsterId após serialização', () => {
        const mon = makeMon();
        mon.monsterId = 't_evo';
        const restored = serialize(mon);
        expect(restored.monsterId).toBe('t_evo');
    });

    it('preserva amizade após serialização', () => {
        const mon = makeMon({ friendship: 75 });
        const restored = serialize(mon);
        expect(restored.friendship).toBe(75);
    });

    it('serialização → level up → serialização mantém consistência', () => {
        const mon = makeMon({ level: 1 });
        const deps = makeDeps(mon);
        giveXP(deps, mon, calcXpNeeded(1) + 10, []);

        const saved    = serialize(mon);
        const restored = serialize(saved);

        expect(restored.level).toBe(mon.level);
        expect(restored.xpNeeded).toBe(mon.xpNeeded);
    });
});
