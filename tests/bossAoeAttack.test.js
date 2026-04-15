/**
 * BOSS AOE ATTACK TESTS (XVII-E)
 *
 * Testes para bossAoeAttack (FASE VII-E):
 * - AoE atinge apenas monstrinhos com position === 'front'
 * - Fallback: atinge todos se não há alvos na frente
 * - Cálculo de dano: max(1, bossAtk - monDef + 3)
 * - Retorna hitTargets e totalDamage
 */

import { describe, it, expect } from 'vitest';
import { bossAoeAttack } from '../js/combat/bossSystem.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeBoss(overrides = {}) {
    return { name: 'BossTest', atk: 15, hp: 200, hpMax: 200, isBoss: true, _phase: 2, ...overrides };
}

function makeTarget(playerId, position, monOverrides = {}) {
    return {
        playerId,
        monster: { name: 'Mon_' + playerId, hp: 50, hpMax: 50, def: 8, ...monOverrides }
    };
}

function makeDeps() {
    const logs = [];
    return {
        deps: { helpers: { log: (enc, msg) => logs.push(msg) } },
        logs,
        enc: { positions: {} }
    };
}

// ── Testes ─────────────────────────────────────────────────────────────────

describe('bossAoeAttack - alvo por posição', () => {
    it('atinge apenas alvos na frente quando há alvos front', () => {
        const boss = makeBoss();
        const frontTarget = makeTarget('p1', 'front');
        const backTarget  = makeTarget('p2', 'back');
        const { deps, enc } = makeDeps();
        enc.positions = { p1: 'front', p2: 'back' };

        const { hitTargets } = bossAoeAttack(boss, [frontTarget, backTarget], deps, enc);

        expect(hitTargets).toContain('p1');
        expect(hitTargets).not.toContain('p2');
    });

    it('atinge todos os alvos como fallback quando não há alvos front', () => {
        const boss = makeBoss();
        const midTarget  = makeTarget('p1', 'mid');
        const backTarget = makeTarget('p2', 'back');
        const { deps, enc } = makeDeps();
        enc.positions = { p1: 'mid', p2: 'back' };

        const { hitTargets } = bossAoeAttack(boss, [midTarget, backTarget], deps, enc);

        expect(hitTargets).toContain('p1');
        expect(hitTargets).toContain('p2');
    });

    it('não atinge monstrinhos com hp <= 0', () => {
        const boss = makeBoss();
        const aliveTarget = makeTarget('p1', 'front');
        const deadTarget  = makeTarget('p2', 'front', { hp: 0 });
        const { deps, enc } = makeDeps();
        enc.positions = { p1: 'front', p2: 'front' };

        const { hitTargets } = bossAoeAttack(boss, [aliveTarget, deadTarget], deps, enc);

        expect(hitTargets).toContain('p1');
        expect(hitTargets).not.toContain('p2');
    });

    it('calcula dano: max(1, bossAtk - monDef + 3)', () => {
        // bossAtk=15, monDef=8 → 15 - 8 + 3 = 10
        const boss = makeBoss({ atk: 15 });
        const target = makeTarget('p1', 'front', { hp: 50, def: 8 });
        const { deps, enc } = makeDeps();
        enc.positions = { p1: 'front' };

        bossAoeAttack(boss, [target], deps, enc);

        expect(target.monster.hp).toBe(40); // 50 - 10 = 40
    });

    it('dano mínimo é 1 mesmo com DEF muito alto', () => {
        const boss = makeBoss({ atk: 5 });
        const target = makeTarget('p1', 'front', { hp: 30, def: 100 });
        const { deps, enc } = makeDeps();
        enc.positions = { p1: 'front' };

        bossAoeAttack(boss, [target], deps, enc);

        // max(1, 5 - 100 + 3) = max(1, -92) = 1
        expect(target.monster.hp).toBe(29);
    });

    it('totalDamage é soma do dano em todos os alvos', () => {
        const boss = makeBoss({ atk: 15 });
        const t1 = makeTarget('p1', 'front', { hp: 50, def: 8 });
        const t2 = makeTarget('p2', 'front', { hp: 50, def: 8 });
        const { deps, enc } = makeDeps();
        enc.positions = { p1: 'front', p2: 'front' };

        const { totalDamage } = bossAoeAttack(boss, [t1, t2], deps, enc);

        // cada um: 15 - 8 + 3 = 10
        expect(totalDamage).toBe(20);
    });

    it('retorna hitTargets vazio e totalDamage=0 para lista vazia', () => {
        const boss = makeBoss();
        const { deps, enc } = makeDeps();

        const { hitTargets, totalDamage } = bossAoeAttack(boss, [], deps, enc);

        expect(hitTargets).toEqual([]);
        expect(totalDamage).toBe(0);
    });

    it('não lança erro quando helpers.log é undefined', () => {
        const boss = makeBoss();
        const target = makeTarget('p1', 'front');
        const enc = { positions: { p1: 'front' } };

        expect(() => {
            bossAoeAttack(boss, [target], { helpers: {} }, enc);
        }).not.toThrow();
    });

    it('trata posição ausente como front (fallback padrão)', () => {
        const boss = makeBoss({ atk: 10 });
        const target = makeTarget('p1', undefined);
        const { deps, enc } = makeDeps();
        enc.positions = {}; // posição não definida → fallback 'front'

        const { hitTargets } = bossAoeAttack(boss, [target], deps, enc);

        // Sem posição definida, fallback para 'front' — alvo deve ser atingido
        expect(hitTargets).toContain('p1');
    });

    it('registra mensagem de AoE no log', () => {
        const boss = makeBoss({ atk: 15 });
        const target = makeTarget('p1', 'front', { hp: 50, def: 8 });
        const { deps, enc, logs } = makeDeps();
        enc.positions = { p1: 'front' };

        bossAoeAttack(boss, [target], deps, enc);

        expect(logs.some(l => l.includes('AoE'))).toBe(true);
    });
});
