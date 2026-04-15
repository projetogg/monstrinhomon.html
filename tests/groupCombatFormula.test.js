/**
 * GROUP COMBAT FORMULA TESTS
 *
 * Testa: getModNivel, classifyRC, resolveConfrontation, computeGroupDamage, checkOneTurnBonus
 */
import { describe, it, expect } from 'vitest';
import {
    getModNivel,
    classifyRC,
    RC_CATEGORY,
    RC_MULTIPLIER,
    resolveConfrontation,
    computeGroupDamage,
    checkOneTurnBonus,
} from '../js/combat/groupCombatFormula.js';

describe('groupCombatFormula - getModNivel', () => {
    it('deve retornar -5 para diferença ≤ -20', () => {
        expect(getModNivel(-20)).toBe(-5);
        expect(getModNivel(-25)).toBe(-5);
    });
    it('deve retornar -4 para diferença -15 a -19', () => {
        expect(getModNivel(-15)).toBe(-4);
        expect(getModNivel(-19)).toBe(-4);
    });
    it('deve retornar -3 para diferença -10 a -14', () => {
        expect(getModNivel(-10)).toBe(-3);
        expect(getModNivel(-14)).toBe(-3);
    });
    it('deve retornar -2 para diferença -6 a -9', () => {
        expect(getModNivel(-6)).toBe(-2);
        expect(getModNivel(-9)).toBe(-2);
    });
    it('deve retornar -1 para diferença -3 a -5', () => {
        expect(getModNivel(-3)).toBe(-1);
        expect(getModNivel(-5)).toBe(-1);
    });
    it('deve retornar 0 para diferença -2 a +2', () => {
        expect(getModNivel(0)).toBe(0);
        expect(getModNivel(-2)).toBe(0);
        expect(getModNivel(2)).toBe(0);
    });
    it('deve retornar 1 para diferença +3 a +5', () => {
        expect(getModNivel(3)).toBe(1);
        expect(getModNivel(5)).toBe(1);
    });
    it('deve retornar 2 para diferença +6 a +9', () => {
        expect(getModNivel(6)).toBe(2);
        expect(getModNivel(9)).toBe(2);
    });
    it('deve retornar 3 para diferença +10 a +14', () => {
        expect(getModNivel(10)).toBe(3);
        expect(getModNivel(14)).toBe(3);
    });
    it('deve retornar 4 para diferença +15 a +19', () => {
        expect(getModNivel(15)).toBe(4);
        expect(getModNivel(19)).toBe(4);
    });
    it('deve retornar 5 para diferença ≥ +20', () => {
        expect(getModNivel(20)).toBe(5);
        expect(getModNivel(30)).toBe(5);
    });
});

describe('groupCombatFormula - classifyRC', () => {
    it('deve classificar RC ≤ -8 como FALHA_TOTAL', () => {
        expect(classifyRC(-8)).toBe(RC_CATEGORY.FALHA_TOTAL);
        expect(classifyRC(-15)).toBe(RC_CATEGORY.FALHA_TOTAL);
    });
    it('deve classificar RC -7 a -3 como CONTATO_NEUTRALIZADO', () => {
        expect(classifyRC(-7)).toBe(RC_CATEGORY.CONTATO_NEUTRALIZADO);
        expect(classifyRC(-3)).toBe(RC_CATEGORY.CONTATO_NEUTRALIZADO);
    });
    it('deve classificar RC -2 a +3 como ACERTO_REDUZIDO', () => {
        expect(classifyRC(-2)).toBe(RC_CATEGORY.ACERTO_REDUZIDO);
        expect(classifyRC(0)).toBe(RC_CATEGORY.ACERTO_REDUZIDO);
        expect(classifyRC(3)).toBe(RC_CATEGORY.ACERTO_REDUZIDO);
    });
    it('deve classificar RC +4 a +10 como ACERTO_NORMAL', () => {
        expect(classifyRC(4)).toBe(RC_CATEGORY.ACERTO_NORMAL);
        expect(classifyRC(10)).toBe(RC_CATEGORY.ACERTO_NORMAL);
    });
    it('deve classificar RC ≥ +11 como ACERTO_FORTE', () => {
        expect(classifyRC(11)).toBe(RC_CATEGORY.ACERTO_FORTE);
        expect(classifyRC(20)).toBe(RC_CATEGORY.ACERTO_FORTE);
    });
});

describe('groupCombatFormula - resolveConfrontation', () => {
    it('deve calcular RC básico com parâmetros neutros', () => {
        const result = resolveConfrontation({
            d20A: 10, d20D: 10,
            atkAtk: 5, atkDef: 4,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (10 + 5 + 0 + 0 + 0) - (10 + ceil(4/2) + 0 + 0) = 15 - 12 = 3
        expect(result.rc).toBe(3);
        expect(result.category).toBe(RC_CATEGORY.ACERTO_REDUZIDO);
    });

    it('deve aplicar bônus de d20 natural 20 do atacante (+4 RC)', () => {
        const result = resolveConfrontation({
            d20A: 20, d20D: 10,
            atkAtk: 5, atkDef: 4,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (20 + 4 + 5 + 0 + 0 + 0) - (10 + 2 + 0 + 0) = 29 - 12 = 17
        expect(result.rc).toBe(17);
        expect(result.d20ANatural).toBe(true);
        expect(result.critDmgBonus).toBe(0.20);
    });

    it('deve aplicar penalidade de d20=1 do atacante (-6 RC)', () => {
        const result = resolveConfrontation({
            d20A: 1, d20D: 10,
            atkAtk: 5, atkDef: 4,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (1 + (-6) + 5 + 0 + 0 + 0) - (10 + 2 + 0 + 0) = 0 - 12 = -12
        expect(result.rc).toBe(-12);
        expect(result.category).toBe(RC_CATEGORY.FALHA_TOTAL);
    });

    it('deve aplicar bônus de d20 natural 20 do defensor (+5 defesa)', () => {
        const result = resolveConfrontation({
            d20A: 15, d20D: 20,
            atkAtk: 5, atkDef: 4,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (15 + 5 + 0 + 0 + 0) - (20 + 5 + 2 + 0 + 0) = 20 - 27 = -7
        expect(result.rc).toBe(-7);
        expect(result.d20DNatural).toBe(true);
    });

    it('deve aplicar modificador de nível', () => {
        const result = resolveConfrontation({
            d20A: 10, d20D: 10,
            atkAtk: 5, atkDef: 4,
            atkLvl: 20, defLvl: 5, // diff = +15 → modNivel = +4
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (10 + 5 + 4 + 0 + 0) - (10 + 2 + 0 + 0) = 19 - 12 = 7
        expect(result.rc).toBe(7);
    });

    it('deve aplicar modificador de classe', () => {
        const result = resolveConfrontation({
            d20A: 10, d20D: 10,
            atkAtk: 5, atkDef: 4,
            atkLvl: 1, defLvl: 1,
            classModAtk: 2, // vantagem de classe
            posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (10 + 5 + 0 + 2 + 0) - (10 + 2 + 0 + 0) = 17 - 12 = 5
        expect(result.rc).toBe(5);
        expect(result.category).toBe(RC_CATEGORY.ACERTO_NORMAL);
    });
});

describe('groupCombatFormula - computeGroupDamage', () => {
    it('deve retornar 0 dano para FALHA_TOTAL', () => {
        const { damage } = computeGroupDamage({
            pwr: 5, atk: 7, lvlDiff: 0, defEnemy: 4,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.FALHA_TOTAL,
        });
        expect(damage).toBe(0);
    });

    it('deve retornar dano com multiplicador ×0.60 para ACERTO_REDUZIDO', () => {
        const { damage } = computeGroupDamage({
            pwr: 5, atk: 7, lvlDiff: 0, defEnemy: 4,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_REDUZIDO,
        });
        // DanoBase = 5 + 7 + 0 - floor(4/2) = 12 - 2 = 10
        // DanoFinal = max(1, floor(10 × 0.60)) = 6
        expect(damage).toBe(6);
    });

    it('deve retornar dano completo para ACERTO_NORMAL', () => {
        const { damage } = computeGroupDamage({
            pwr: 5, atk: 7, lvlDiff: 0, defEnemy: 4,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_NORMAL,
        });
        // DanoBase = 10, mult=1.0 → 10
        expect(damage).toBe(10);
    });

    it('deve retornar dano aumentado para ACERTO_FORTE', () => {
        const { damage } = computeGroupDamage({
            pwr: 5, atk: 7, lvlDiff: 0, defEnemy: 4,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_FORTE,
        });
        // DanoBase = 10, mult=1.25 → 12
        expect(damage).toBe(12);
    });

    it('deve aplicar bônus crítico de +20%', () => {
        const { damage } = computeGroupDamage({
            pwr: 5, atk: 7, lvlDiff: 0, defEnemy: 4,
            damageMult: 1.0, critBonus: 0.20,
            category: RC_CATEGORY.ACERTO_FORTE,
        });
        // DanoBase = 10, forte=1.25 → 12, crit 1.20 → round(12*1.20) = 14
        expect(damage).toBe(14);
    });

    it('deve retornar dano ilusório (1) quando defensor muito superior', () => {
        const { damage, isIlusory } = computeGroupDamage({
            pwr: 5, atk: 5, lvlDiff: -10, // defensor 10 níveis acima
            defEnemy: 4, damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_REDUZIDO,
        });
        expect(damage).toBe(1);
        expect(isIlusory).toBe(true);
    });

    it('deve aplicar multiplicador de classe na fórmula', () => {
        const { damage } = computeGroupDamage({
            pwr: 5, atk: 7, lvlDiff: 0, defEnemy: 4,
            damageMult: 1.10, critBonus: 0, // vantagem de classe
            category: RC_CATEGORY.ACERTO_NORMAL,
        });
        // DanoBase = 10, mult=1.10 → floor(11) = 11
        expect(damage).toBe(11);
    });
});

describe('groupCombatFormula - checkOneTurnBonus', () => {
    it('deve retornar true para ACERTO_FORTE com vantagem de classe', () => {
        expect(checkOneTurnBonus(RC_CATEGORY.ACERTO_FORTE, true)).toBe(true);
    });
    it('deve retornar false para ACERTO_FORTE sem vantagem', () => {
        expect(checkOneTurnBonus(RC_CATEGORY.ACERTO_FORTE, false)).toBe(false);
    });
    it('deve retornar false para ACERTO_NORMAL com vantagem', () => {
        expect(checkOneTurnBonus(RC_CATEGORY.ACERTO_NORMAL, true)).toBe(false);
    });
    it('deve retornar false para FALHA_TOTAL', () => {
        expect(checkOneTurnBonus(RC_CATEGORY.FALHA_TOTAL, true)).toBe(false);
    });
});
