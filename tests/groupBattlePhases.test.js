/**
 * GROUP BATTLE PHASES TESTS
 *
 * Testes para FASE I (integração RC), FASE III (TAUNT/MARK), FASE IV (applyBuff)
 */

import { describe, it, expect } from 'vitest';
import { resolveConfrontation, computeGroupDamage, RC_CATEGORY, applyBuff } from '../js/combat/groupCombatFormula.js';

describe('FASE I — resolveConfrontation integração', () => {
    it('d20A=1 resulta em FALHA_TOTAL', () => {
        const result = resolveConfrontation({
            d20A: 1, d20D: 10, atkAtk: 5, atkDef: 3,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        expect(result.category).toBe(RC_CATEGORY.FALHA_TOTAL);
    });

    it('d20A=20 resulta em d20ANatural=true e critDmgBonus=0.20', () => {
        const result = resolveConfrontation({
            d20A: 20, d20D: 1, atkAtk: 5, atkDef: 3,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        expect(result.d20ANatural).toBe(true);
        expect(result.critDmgBonus).toBe(0.20);
    });

    it('posição defensiva (back) aumenta defesa quando há aliado na frente', () => {
        // Com posMod=2 (trás), RC deve ser menor (mais difícil acertar)
        const sem = resolveConfrontation({
            d20A: 10, d20D: 10, atkAtk: 5, atkDef: 3,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        const com = resolveConfrontation({
            d20A: 10, d20D: 10, atkAtk: 5, atkDef: 3,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 2, buffOff: 0, buffDef: 0,
        });
        expect(com.rc).toBeLessThan(sem.rc);
    });

    it('MARK debuff (-2 buffDef) reduz o RC defensivo (piora defesa)', () => {
        const sem = resolveConfrontation({
            d20A: 10, d20D: 10, atkAtk: 5, atkDef: 3,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        const com = resolveConfrontation({
            d20A: 10, d20D: 10, atkAtk: 5, atkDef: 3,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: -2,
        });
        // buffDef negativo aumenta RC (piora defesa = facilita acerto)
        expect(com.rc).toBeGreaterThan(sem.rc);
    });
});

describe('FASE I — computeGroupDamage', () => {
    it('FALHA_TOTAL retorna damage=0', () => {
        const r = computeGroupDamage({
            pwr: 5, atk: 5, lvlDiff: 0, defEnemy: 3,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.FALHA_TOTAL,
            d20ANatural: false, d20DNatural: false,
        });
        expect(r.damage).toBe(0);
    });

    it('ACERTO_FORTE aplica multiplicador 1.25', () => {
        const normal = computeGroupDamage({
            pwr: 5, atk: 5, lvlDiff: 0, defEnemy: 3,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_NORMAL,
            d20ANatural: false, d20DNatural: false,
        });
        const forte = computeGroupDamage({
            pwr: 5, atk: 5, lvlDiff: 0, defEnemy: 3,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_FORTE,
            d20ANatural: false, d20DNatural: false,
        });
        expect(forte.damage).toBeGreaterThan(normal.damage);
    });

    it('critBonus=0.20 aumenta dano em ~20%', () => {
        const sem = computeGroupDamage({
            pwr: 5, atk: 5, lvlDiff: 0, defEnemy: 3,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_NORMAL,
            d20ANatural: false, d20DNatural: false,
        });
        const com = computeGroupDamage({
            pwr: 5, atk: 5, lvlDiff: 0, defEnemy: 3,
            damageMult: 1.0, critBonus: 0.20,
            category: RC_CATEGORY.ACERTO_NORMAL,
            d20ANatural: true, d20DNatural: false,
        });
        expect(com.damage).toBeGreaterThan(sem.damage);
    });
});

describe('FASE IV — applyBuff', () => {
    it('adiciona buff a monstro sem buffs', () => {
        const mon = {};
        applyBuff(mon, { type: 'atk', power: 2, duration: 1, source: 'Teste' });
        expect(mon.buffs).toHaveLength(1);
        expect(mon.buffs[0].type).toBe('atk');
    });

    it('substitui buff do mesmo tipo', () => {
        const mon = { buffs: [{ type: 'atk', power: 1, duration: 1 }] };
        applyBuff(mon, { type: 'atk', power: 3, duration: 2 });
        expect(mon.buffs).toHaveLength(1);
        expect(mon.buffs[0].power).toBe(3);
    });

    it('limita a 2 buffs, removendo o mais antigo', () => {
        const mon = {
            buffs: [
                { type: 'atk', power: 1, duration: 1 },
                { type: 'def', power: 2, duration: 1 },
            ]
        };
        applyBuff(mon, { type: 'spd', power: 1, duration: 1 });
        expect(mon.buffs).toHaveLength(2);
        // atk foi removido (era o mais antigo)
        expect(mon.buffs.find(b => b.type === 'atk')).toBeUndefined();
        expect(mon.buffs.find(b => b.type === 'spd')).toBeDefined();
    });

    it('não aplica a monstro nulo', () => {
        expect(() => applyBuff(null, { type: 'atk', power: 1 })).not.toThrow();
    });
});
