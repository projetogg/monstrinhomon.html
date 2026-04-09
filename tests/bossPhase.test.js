/**
 * BOSS PHASE TESTS (PR-05)
 *
 * Testes para o sistema de Boss Fase 2.
 * Cobertura:
 *   - applyBossMultipliers: HP×2.5, ATK×1.5, DEF×1.5; flags isBoss/noFlee/_phase
 *   - checkBossPhaseTransition: HP ≤ 50% → ATK +20% (uma vez); HP > 50% → sem efeito
 *   - isBossImmuneToStatus: stun/root imunes; outros não
 *   - BOSS_MULTIPLIERS, BOSS_PHASE2_ATK_MULT, BOSS_IMMUNE_STATUS constantes
 */

import { describe, it, expect } from 'vitest';
import {
    applyBossMultipliers,
    checkBossPhaseTransition,
    isBossImmuneToStatus,
    BOSS_MULTIPLIERS,
    BOSS_PHASE2_ATK_MULT,
    BOSS_IMMUNE_STATUS,
} from '../js/combat/bossSystem.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEnemy(overrides = {}) {
    return {
        id: 'e1',
        name: 'Chefão',
        class: 'Bárbaro',
        hp: overrides.hp ?? 40,
        hpMax: overrides.hpMax ?? 40,
        atk: overrides.atk ?? 10,
        def: overrides.def ?? 8,
        spd: 5,
        ...overrides,
    };
}

// ─── BOSS_MULTIPLIERS constantes ─────────────────────────────────────────────

describe('BOSS_MULTIPLIERS', () => {
    it('hp multiplicador = 2.5', () => expect(BOSS_MULTIPLIERS.hp).toBe(2.5));
    it('atk multiplicador = 1.5', () => expect(BOSS_MULTIPLIERS.atk).toBe(1.5));
    it('def multiplicador = 1.5', () => expect(BOSS_MULTIPLIERS.def).toBe(1.5));
    it('BOSS_PHASE2_ATK_MULT = 1.20', () => expect(BOSS_PHASE2_ATK_MULT).toBe(1.20));
    it('BOSS_IMMUNE_STATUS inclui stun', () => expect(BOSS_IMMUNE_STATUS).toContain('stun'));
    it('BOSS_IMMUNE_STATUS inclui root', () => expect(BOSS_IMMUNE_STATUS).toContain('root'));
});

// ─── applyBossMultipliers ─────────────────────────────────────────────────────

describe('applyBossMultipliers', () => {
    it('multiplica HP por 2.5 e seta hp = hpMax', () => {
        const enemy = makeEnemy({ hpMax: 40, hp: 40 });
        applyBossMultipliers(enemy);
        expect(enemy.hpMax).toBe(100); // 40 * 2.5
        expect(enemy.hp).toBe(100);    // HP cheio ao início
    });

    it('multiplica ATK por 1.5', () => {
        const enemy = makeEnemy({ atk: 10 });
        applyBossMultipliers(enemy);
        expect(enemy.atk).toBe(15); // 10 * 1.5
    });

    it('multiplica DEF por 1.5', () => {
        const enemy = makeEnemy({ def: 8 });
        applyBossMultipliers(enemy);
        expect(enemy.def).toBe(12); // 8 * 1.5
    });

    it('arredonda multiplicações (round)', () => {
        const enemy = makeEnemy({ atk: 7, def: 5, hpMax: 30 });
        applyBossMultipliers(enemy);
        expect(enemy.atk).toBe(Math.round(7 * 1.5));   // 11
        expect(enemy.def).toBe(Math.round(5 * 1.5));   // 8
        expect(enemy.hpMax).toBe(Math.round(30 * 2.5)); // 75
    });

    it('define isBoss = true', () => {
        const enemy = makeEnemy();
        applyBossMultipliers(enemy);
        expect(enemy.isBoss).toBe(true);
    });

    it('define noFlee = true', () => {
        const enemy = makeEnemy();
        applyBossMultipliers(enemy);
        expect(enemy.noFlee).toBe(true);
    });

    it('define _phase = 1', () => {
        const enemy = makeEnemy();
        applyBossMultipliers(enemy);
        expect(enemy._phase).toBe(1);
    });

    it('define _phase2Done = false', () => {
        const enemy = makeEnemy();
        applyBossMultipliers(enemy);
        expect(enemy._phase2Done).toBe(false);
    });

    it('retorna o mesmo objeto mutado', () => {
        const enemy = makeEnemy();
        const result = applyBossMultipliers(enemy);
        expect(result).toBe(enemy);
    });

    it('não quebra com enemy null', () => {
        expect(() => applyBossMultipliers(null)).not.toThrow();
    });
});

// ─── checkBossPhaseTransition ─────────────────────────────────────────────────

describe('checkBossPhaseTransition', () => {
    describe('sem transição (HP > 50%)', () => {
        it('HP 100% → sem transição', () => {
            const boss = makeEnemy({ hp: 100, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            const result = checkBossPhaseTransition(boss);
            expect(result.transitioned).toBe(false);
            expect(boss._phase).toBe(1);
        });

        it('HP 51% → sem transição', () => {
            const boss = makeEnemy({ hp: 51, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            const result = checkBossPhaseTransition(boss);
            expect(result.transitioned).toBe(false);
        });

        it('HP exato 50% → transição', () => {
            const boss = makeEnemy({ hp: 50, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            const result = checkBossPhaseTransition(boss);
            expect(result.transitioned).toBe(true);
        });
    });

    describe('transição para Fase 2', () => {
        it('HP 49% → transição, _phase = 2', () => {
            const boss = makeEnemy({ hp: 49, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            checkBossPhaseTransition(boss);
            expect(boss._phase).toBe(2);
            expect(boss._phase2Done).toBe(true);
        });

        it('ATK aumenta +20% na transição', () => {
            const boss = makeEnemy({ hp: 40, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            const result = checkBossPhaseTransition(boss);
            // 15 * 1.20 = 18 (arredondado)
            expect(boss.atk).toBe(Math.round(15 * 1.20));
            expect(result.atkDelta).toBe(boss.atk - 15);
            expect(result.transitioned).toBe(true);
        });

        it('transição ocorre UMA ÚNICA VEZ (_phase2Done previne repetição)', () => {
            const boss = makeEnemy({ hp: 30, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            checkBossPhaseTransition(boss); // primeira vez
            const atkAfterFirst = boss.atk;
            checkBossPhaseTransition(boss); // segunda vez (não deve alterar)
            expect(boss.atk).toBe(atkAfterFirst);
        });

        it('_phase2Done = true previne nova transição mesmo com HP baixo', () => {
            const boss = makeEnemy({ hp: 10, hpMax: 100, atk: 18, isBoss: true, _phase: 2, _phase2Done: true });
            const result = checkBossPhaseTransition(boss);
            expect(result.transitioned).toBe(false);
            expect(boss.atk).toBe(18); // sem mudança
        });

        it('adiciona mensagem de log na transição', () => {
            const boss = makeEnemy({ hp: 40, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            const log = [];
            checkBossPhaseTransition(boss, log);
            expect(log).toHaveLength(1);
            expect(log[0]).toContain('FASE 2');
            expect(log[0]).toContain(boss.name);
        });

        it('não adiciona log se array não fornecido', () => {
            const boss = makeEnemy({ hp: 40, hpMax: 100, atk: 15, isBoss: true, _phase: 1, _phase2Done: false });
            expect(() => checkBossPhaseTransition(boss)).not.toThrow();
        });
    });

    describe('guards', () => {
        it('retorna sem transição se enemy não é boss (isBoss = false)', () => {
            const enemy = makeEnemy({ hp: 10, hpMax: 100, atk: 15 });
            const result = checkBossPhaseTransition(enemy);
            expect(result.transitioned).toBe(false);
        });

        it('retorna sem transição se enemy null', () => {
            const result = checkBossPhaseTransition(null);
            expect(result.transitioned).toBe(false);
        });
    });
});

// ─── isBossImmuneToStatus ─────────────────────────────────────────────────────

describe('isBossImmuneToStatus', () => {
    const boss = { isBoss: true, name: 'Boss' };
    const normal = { name: 'Inimigo' };

    it('boss é imune a stun', () => expect(isBossImmuneToStatus(boss, 'stun')).toBe(true));
    it('boss é imune a root', () => expect(isBossImmuneToStatus(boss, 'root')).toBe(true));
    it('boss é imune a paralysis', () => expect(isBossImmuneToStatus(boss, 'paralysis')).toBe(true));
    it('boss NÃO é imune a poison', () => expect(isBossImmuneToStatus(boss, 'poison')).toBe(false));
    it('boss NÃO é imune a burn', () => expect(isBossImmuneToStatus(boss, 'burn')).toBe(false));
    it('mob normal não é imune a stun', () => expect(isBossImmuneToStatus(normal, 'stun')).toBe(false));
    it('target null → false', () => expect(isBossImmuneToStatus(null, 'stun')).toBe(false));
    it('case insensitive: STUN → imune', () => expect(isBossImmuneToStatus(boss, 'STUN')).toBe(true));
});
