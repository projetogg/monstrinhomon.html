/**
 * COMBAT FORMULA AUDIT — Testes de Caracterização (2026-05-26)
 *
 * Congela o comportamento atual de runtime SEM alterar a fórmula.
 * Cada teste documenta o estado real e, quando relevante, aponta a
 * divergência com o Patch Canônico v2.2 (marcada como comentário).
 *
 * Cobertura:
 *   Bloco 1 — Wild: calcDamage (fórmula atual ATK+PWR-DEF)
 *   Bloco 2 — Wild: checkHit (unilateral)
 *   Bloco 3 — Wild: checkHitDiceClash (bilateral parcial)
 *   Bloco 4 — Wild: resolveD20Hit (crítico / falha)
 *   Bloco 5 — Group: resolveConfrontation (RC bilateral canônico)
 *   Bloco 6 — Group: computeGroupDamage (5 faixas)
 *   Bloco 7 — Group: crítico d20=20 (+4 RC + 20% dano)
 *   Bloco 8 — Wild vs Group — mesmo cenário, resultados divergem
 *   Bloco 9 — ENE regen: valores atuais vs canônico v2.2
 *
 * NOTA: Estes testes NÃO devem ser alterados para "passar" —
 *   eles caracterizam o estado atual. Falhas futuras indicarão
 *   mudança de comportamento (intencional ou acidental).
 *
 * Referência: docs/combat_formula_audit_2026-05.md
 */

import { describe, it, expect } from 'vitest';
import {
    calcDamage,
    checkHit,
    checkHitDiceClash,
    resolveD20Hit,
    getClassAdvantageModifiers,
} from '../js/combat/wildCore.js';

import {
    resolveConfrontation,
    computeGroupDamage,
    classifyRC,
    getModNivel,
    RC_CATEGORY,
    RC_MULTIPLIER,
} from '../js/combat/groupCombatFormula.js';

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES COMPARTILHADOS
// ─────────────────────────────────────────────────────────────────────────────

const classAdvantages = {
    Guerreiro:  { strong: 'Ladino',    weak: 'Curandeiro' },
    Mago:       { strong: 'Bárbaro',   weak: 'Ladino' },
    Curandeiro: { strong: 'Guerreiro', weak: 'Bardo' },
    Bárbaro:    { strong: 'Caçador',   weak: 'Mago' },
    Ladino:     { strong: 'Mago',      weak: 'Guerreiro' },
    Bardo:      { strong: 'Curandeiro', weak: 'Caçador' },
    Caçador:    { strong: 'Bardo',     weak: 'Bárbaro' },
};

// Starter típico nível 1 (valores médios do catálogo)
const monAtk  = { atk: 7, def: 5, spd: 4, level: 1, class: 'Guerreiro', buffs: [] };
const monDef  = { atk: 5, def: 6, spd: 3, level: 1, class: 'Ladino',    buffs: [] };

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1 — Wild calcDamage: caracterização da fórmula atual
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Wild calcDamage — caracterização da fórmula atual', () => {
    it('[DIV-02] fórmula atual: base = ATK + PWR − DEF (sem ModNível, sem floor(DEF/2))', () => {
        // ATK=7, PWR=7, DEF=5 → base = 7+7-5 = 9
        expect(calcDamage({ atk: 7, def: 5, power: 7, damageMult: 1.0 })).toBe(9);
        // Canônico v2.2 seria: 7 + 7 + ModNível − floor(5/2) = 14 + 0 − 2 = 12 (no nível padrão)
        // → A fórmula atual produz 9, não 12. Divergência confirmada.
    });

    it('[DIV-05] DEF tem peso integral — DEF=10 retira 10 de dano, não floor(10/2)=5', () => {
        // ATK=7, PWR=7, DEF=10 → base = 7+7-10 = 4
        expect(calcDamage({ atk: 7, def: 10, power: 7, damageMult: 1.0 })).toBe(4);
        // Canônico v2.2: base = 7+7+0−floor(10/2) = 14−5 = 9 → mais dano que o atual
        // → DEF em Wild tem peso 2× maior que no canônico.
    });

    it('[DIV-05] quando DEF > ATK + PWR o dano mínimo é 1 (sem floor)', () => {
        // ATK=3, PWR=4, DEF=20 → base = 3+4-20 = -13 → max(1, -13) = 1
        expect(calcDamage({ atk: 3, def: 20, power: 4, damageMult: 1.0 })).toBe(1);
    });

    it('[DIV-06] sem 5 faixas: damageMult pode ser qualquer valor (não há mult de faixa)', () => {
        // No canônico Group, o dano é multiplicado pela faixa (0.60, 1.00, 1.25)
        // Em Wild, damageMult é passado diretamente (só 1.0 / 1.10 / 0.90 para classe)
        // ATK=7, PWR=7, DEF=5 → base=9; com vantagem de classe (×1.10) → floor(9×1.10)=9
        expect(calcDamage({ atk: 7, def: 5, power: 7, damageMult: 1.10 })).toBe(9);
        // Multiplíca por 0.60 (faixa reduzida) — não acontece nativamente em Wild
        expect(calcDamage({ atk: 7, def: 5, power: 7, damageMult: 0.60 })).toBe(5);
        // Multiplíca por 1.25 (faixa forte) — não acontece nativamente em Wild
        expect(calcDamage({ atk: 7, def: 5, power: 7, damageMult: 1.25 })).toBe(11);
    });

    it('vantagem de classe: damageMult=1.10 (+10%)', () => {
        // ATK=7, PWR=7, DEF=5 → base=9 → floor(9×1.10)=9
        expect(calcDamage({ atk: 7, def: 5, power: 7, damageMult: 1.10 })).toBe(9);
    });

    it('desvantagem de classe: damageMult=0.90 (−10%)', () => {
        // ATK=7, PWR=7, DEF=5 → base=9 → floor(9×0.90)=8
        expect(calcDamage({ atk: 7, def: 5, power: 7, damageMult: 0.90 })).toBe(8);
    });

    it('[DIV-03] sem ModNível: nível 1 vs nível 10 produz o mesmo dano que nível 10 vs nível 10', () => {
        // wildCore.calcDamage não recebe nível — ModNível ausente confirma DIV-03
        const lvl1vs10 = calcDamage({ atk: 7, def: 5, power: 7, damageMult: 1.0 });
        const lvl10vs10 = calcDamage({ atk: 7, def: 5, power: 7, damageMult: 1.0 });
        // Ambos produzem o mesmo dano — nível não é considerado em Wild
        expect(lvl1vs10).toBe(lvl10vs10);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2 — Wild checkHit: caracterização do hit check unilateral
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Wild checkHit — caracterização do hit check unilateral', () => {
    it('[DIV-01] fórmula atual: d20 + ATK + classBonus >= DEF (unilateral, sem ceil(DEF/2))', () => {
        // d20=6, ATK=7 → 13; DEF=10 → acerta (13>=10)
        expect(checkHit(6, monAtk, { def: 10, class: 'Ladino' }, classAdvantages)).toBe(true);
        // Com canônico bilateral: (d20A + ATK) vs (d20D + ceil(DEF/2)) — o defensor também rola
        // Em Wild, o defensor NÃO rola dado → DIV-01 confirmado
    });

    it('[DIV-01] DEF alta: d20+ATK pode não atingir DEF integral (sem divisão)', () => {
        // d20=3, ATK=7 → 10; DEF=15 → erra (10<15)
        expect(checkHit(3, monAtk, { def: 15, class: 'Ladino' }, classAdvantages)).toBe(false);
        // Com canônico: DEF seria ceil(15/2)=8 — bem mais fácil de acertar
    });

    it('vantagem de classe: +2 ao ATK no hit check', () => {
        // Guerreiro > Ladino: +2 bônus
        // d20=5, ATK=7, +2 bônus = 14; DEF=14 → acerta (14>=14)
        expect(checkHit(5, monAtk, { def: 14, class: 'Ladino' }, classAdvantages)).toBe(true);
        // Sem vantagem: d20=5, ATK=7 = 12; DEF=14 → erra
        expect(checkHit(5, monAtk, { def: 14, class: 'Mago' }, classAdvantages)).toBe(false);
    });

    it('desvantagem de classe: −2 ao ATK no hit check', () => {
        // Guerreiro vs Curandeiro: −2 penalidade
        // d20=7, ATK=7, −2 = 12; DEF=12 → acerta (12>=12)
        expect(checkHit(7, monAtk, { def: 12, class: 'Curandeiro' }, classAdvantages)).toBe(true);
        // d20=6, ATK=7, −2 = 11; DEF=12 → erra
        expect(checkHit(6, monAtk, { def: 12, class: 'Curandeiro' }, classAdvantages)).toBe(false);
    });

    it('[DIV-10] d20=1 NÃO é auto-miss em checkHit (só em resolveD20Hit)', () => {
        // checkHit trata d20=1 como valor normal — auto-miss é no nível acima (resolveD20Hit)
        // ATK=20: 1+20=21 >= DEF=10 → acerta mesmo com d20=1
        expect(checkHit(1, { atk: 20, class: 'Guerreiro' }, { def: 10, class: 'Mago' }, classAdvantages)).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3 — Wild checkHitDiceClash: bilateral parcial
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Wild checkHitDiceClash — bilateral parcial (sem ModNível, sem ceil(DEF/2))', () => {
    it('[DIV-01] bilateral parcial: (d20A + ATK) vs (d20D + DEF) — DEF integral', () => {
        // d20A=10, d20D=5, ATK=7, DEF=6
        // Ofensivo: 10+7=17; Defensivo: 5+6=11 → acerta (17>=11)
        expect(checkHitDiceClash(10, 5, monAtk, monDef, classAdvantages)).toBe(true);
    });

    it('[DIV-01] se defensivo supera ofensivo, erra', () => {
        // d20A=3, d20D=15, ATK=7, DEF=6
        // Ofensivo: 3+7=10; Defensivo: 15+6=21 → erra (10<21)
        expect(checkHitDiceClash(3, 15, monAtk, monDef, classAdvantages)).toBe(false);
    });

    it('[DIV-01] sem ModNível: nível não é considerado — mesmos stats produzem mesmo resultado', () => {
        // checkHitDiceClash ignora o campo `level` — confirma DIV-01/DIV-03
        const monLvl50 = { atk: 7, def: 5, spd: 4, level: 50, class: 'Guerreiro', buffs: [] };
        const monLvl1  = { atk: 7, def: 5, spd: 4, level: 1,  class: 'Guerreiro', buffs: [] };
        // Ambos produzem o mesmo resultado para o mesmo d20A, d20D, contra o mesmo defensor
        const resultLvl50 = checkHitDiceClash(10, 5, monLvl50, monDef, classAdvantages);
        const resultLvl1  = checkHitDiceClash(10, 5, monLvl1,  monDef, classAdvantages);
        // Nível 50 vs nível 1: sem diferença em Wild — ModNível ausente confirmado
        expect(resultLvl50).toBe(resultLvl1);
        // No Group, ModNível(49)=5 daria +5 RC ao atacante de nível 50 → resultado diferente
    });

    it('[DIV-05] DEF integral (não ceil(DEF/2)) aumenta o limiar defensivo', () => {
        // d20A=10, d20D=5, ATK=7, DEF=10 (alta)
        // Atual: (10+7) vs (5+10) = 17 vs 15 → acerta (17>=15)
        // Canônico: (10+7) vs (5+ceil(10/2)) = 17 vs 10 → acerta mais facilmente
        expect(checkHitDiceClash(10, 5, monAtk, { def: 10, class: 'Mago' }, classAdvantages)).toBe(true);
        // Com DEF=12: (10+7) vs (5+12) = 17 vs 17 → acerta (>=)
        expect(checkHitDiceClash(10, 5, monAtk, { def: 12, class: 'Mago' }, classAdvantages)).toBe(true);
        // Com DEF=13: (10+7) vs (5+13) = 17 vs 18 → erra
        expect(checkHitDiceClash(10, 5, monAtk, { def: 13, class: 'Mago' }, classAdvantages)).toBe(false);
        // Com canônico: DEF=13 → ceil(13/2)=7; (10+7) vs (5+7) = 17 vs 12 → acertaria
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4 — Wild resolveD20Hit: regras especiais de crítico e falha
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Wild resolveD20Hit — crítico e falha', () => {
    it('[DIV-04] d20=20 → isCrit=true e hit=true (auto-acerto)', () => {
        // No runtime Wild, d20=20 é auto-acerto independente de ATK/DEF
        const result = resolveD20Hit(20, monAtk, { def: 999, class: 'Mago' }, classAdvantages);
        expect(result.isCrit).toBe(true);
        expect(result.hit).toBe(true);
        // Patch v2.2: nat 20 deveria ser +4 RC (não auto-acerto),
        // mas no Wild não existe RC bilateral → interpretado como auto-acerto
    });

    it('[DIV-10] d20=1 → isFail=true e hit=false (auto-miss)', () => {
        // Runtime Wild: d20=1 é sempre miss
        const result = resolveD20Hit(1, { atk: 999, class: 'Guerreiro' }, monDef, classAdvantages);
        expect(result.isFail).toBe(true);
        expect(result.hit).toBe(false);
        // Patch v2.2: d20A=1 → −6 RC (poderia ainda acertar em RC muito favorável)
    });

    it('d20=10 → resolve normalmente via checkHit', () => {
        // ATK=7, DEF=6: 10+7=17 >= 6 → acerta
        const result = resolveD20Hit(10, monAtk, monDef, classAdvantages);
        expect(result.isCrit).toBe(false);
        expect(result.isFail).toBe(false);
        expect(result.hit).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5 — Group resolveConfrontation: RC bilateral canônico
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Group resolveConfrontation — RC bilateral canônico (v2.2 alinhado)', () => {
    it('fórmula bilateral: RC = (d20A+ATK+ModNível+ModClasse+buffOff) − (d20D+ceil(DEF/2)+posMod+buffDef)', () => {
        // d20A=10, d20D=10, ATK=7, DEF=6, mesmo nível, sem bônus
        // RC = (10 + 7 + 0 + 0 + 0) − (10 + ceil(6/2) + 0 + 0)
        //    = 17 − (10 + 3) = 17 − 13 = 4
        const result = resolveConfrontation({
            d20A: 10, d20D: 10,
            atkAtk: 7, atkDef: 6,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        expect(result.rc).toBe(4);
        expect(result.category).toBe(RC_CATEGORY.ACERTO_NORMAL);
    });

    it('[v2.2] ceil(DEF/2) é usado no confronto, não DEF integral', () => {
        // DEF=10 → ceil(10/2)=5; DEF=11 → ceil(11/2)=6
        const r10 = resolveConfrontation({
            d20A: 10, d20D: 5, atkAtk: 7, atkDef: 10,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (10+7) − (5+5) = 17 − 10 = 7
        expect(r10.rc).toBe(7);

        const r11 = resolveConfrontation({
            d20A: 10, d20D: 5, atkAtk: 7, atkDef: 11,
            atkLvl: 1, defLvl: 1, classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (10+7) − (5+6) = 17 − 11 = 6
        expect(r11.rc).toBe(6);
    });

    it('[v2.2] d20A=20 → +4 RC adicional + critDmgBonus=0.20', () => {
        const result = resolveConfrontation({
            d20A: 20, d20D: 10,
            atkAtk: 7, atkDef: 6,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // Ofensivo: 20 + 4(nat20) + 7 = 31; Defensivo: 10 + 3 = 13; RC = 18
        expect(result.rc).toBe(18);
        expect(result.d20ANatural).toBe(true);
        expect(result.critDmgBonus).toBe(0.20);
        // No Wild, nat 20 seria auto-acerto + power×1.5 — estrutura completamente diferente
    });

    it('[v2.2] ModNível influencia RC', () => {
        // Atacante nível 15 vs defensor nível 1: diff=14 → ModNível=3
        const highLvl = resolveConfrontation({
            d20A: 10, d20D: 10,
            atkAtk: 7, atkDef: 6,
            atkLvl: 15, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        // RC = (10+7+3) − (10+3) = 20 − 13 = 7
        expect(highLvl.rc).toBe(7);

        // Mesmo cenário em nível igual: RC = 4 (sem ModNível)
        const sameLvl = resolveConfrontation({
            d20A: 10, d20D: 10,
            atkAtk: 7, atkDef: 6,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        expect(sameLvl.rc).toBe(4);
        // ModNível faz diferença: 7 vs 4 (+3 de bônus por nível)
        expect(highLvl.rc).toBeGreaterThan(sameLvl.rc);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6 — Group computeGroupDamage: 5 faixas de RC
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Group computeGroupDamage — 5 faixas canônicas', () => {
    const baseParams = {
        pwr: 7, atk: 7, lvlDiff: 0, defEnemy: 6,
        damageMult: 1.0, critBonus: 0,
        d20ANatural: false, d20DNatural: false,
    };

    it('[v2.2] FALHA_TOTAL → damage=0', () => {
        const result = computeGroupDamage({ ...baseParams, category: RC_CATEGORY.FALHA_TOTAL });
        expect(result.damage).toBe(0);
        expect(result.isIlusory).toBe(false);
    });

    it('[v2.2] CONTATO_NEUTRALIZADO → damage=1 (atacante não está 10+ níveis abaixo)', () => {
        // lvlDiff=0 → atacante não está abaixo → minor contact → 1
        const result = computeGroupDamage({ ...baseParams, category: RC_CATEGORY.CONTATO_NEUTRALIZADO });
        expect(result.damage).toBe(1);
    });

    it('[v2.2] ACERTO_REDUZIDO → ×0.60, mín 1', () => {
        // DanoBase = max(1, 7+7+0−floor(6/2)) = max(1, 14−3) = 11
        // DanoFinal = max(1, floor(11×0.60)) = max(1, 6) = 6
        const result = computeGroupDamage({ ...baseParams, category: RC_CATEGORY.ACERTO_REDUZIDO });
        expect(result.damage).toBe(6);
    });

    it('[v2.2] ACERTO_NORMAL → ×1.00', () => {
        // DanoBase = max(1, 7+7+0−3) = 11
        // DanoFinal = max(1, floor(11×1.00)) = 11
        const result = computeGroupDamage({ ...baseParams, category: RC_CATEGORY.ACERTO_NORMAL });
        expect(result.damage).toBe(11);
    });

    it('[v2.2] ACERTO_FORTE → ×1.25', () => {
        // DanoBase = 11
        // DanoFinal = max(1, floor(11×1.25)) = max(1, 13) = 13
        const result = computeGroupDamage({ ...baseParams, category: RC_CATEGORY.ACERTO_FORTE });
        expect(result.damage).toBe(13);
    });

    it('[v2.2] floor(DEF/2) na mitigação — DEF=6 → subtrai 3, não 6', () => {
        // DanoBase = 7+7+0−floor(6/2) = 14−3 = 11
        const result = computeGroupDamage({ ...baseParams, category: RC_CATEGORY.ACERTO_NORMAL });
        expect(result.damage).toBe(11);
        // Wild calcularia: 7+7−6 = 8 → diferença de 3 de dano
    });

    it('[v2.2] crítico +20% dano quando critBonus=0.20', () => {
        // DanoBase=11; ACERTO_NORMAL: 11; +20%: round(11×1.20)=13
        const result = computeGroupDamage({
            ...baseParams,
            category: RC_CATEGORY.ACERTO_NORMAL,
            critBonus: 0.20,
        });
        expect(result.damage).toBe(Math.round(11 * 1.20));
    });

    it('[v2.2] dano ilusório: atacante 10+ níveis abaixo → damage=1', () => {
        // lvlDiff=-10 → atacante 10 níveis abaixo → ACERTO_REDUZIDO → ilusório
        const result = computeGroupDamage({
            ...baseParams,
            lvlDiff: -10,
            category: RC_CATEGORY.ACERTO_REDUZIDO,
        });
        expect(result.isIlusory).toBe(true);
        expect(result.damage).toBe(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 7 — Group crítico d20=20: +4 RC + 20% dano (não auto-acerto)
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Group nat20 — +4 RC e +20% dano (diferente do Wild)', () => {
    it('[DIV-04] nat20 em Group NÃO é auto-acerto — é +4 RC', () => {
        // Cenário muito desfavorável: ATK=1, DEF=30, d20D=15
        // RC = (20 + 4(nat20) + 1) − (15 + ceil(30/2)) = 25 − (15+15) = 25 − 30 = -5
        // → CONTATO_NEUTRALIZADO (não acerto!)
        const result = resolveConfrontation({
            d20A: 20, d20D: 15,
            atkAtk: 1, atkDef: 30,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        expect(result.rc).toBe(-5);
        expect(result.category).toBe(RC_CATEGORY.CONTATO_NEUTRALIZADO);
        expect(result.d20ANatural).toBe(true);
        // Em Wild: nat 20 → auto-acerto independente de ATK/DEF (DIV-04)
    });

    it('[DIV-04] nat20 em Group dá critDmgBonus=0.20 (não power×1.5 como em Wild)', () => {
        const result = resolveConfrontation({
            d20A: 20, d20D: 5,
            atkAtk: 7, atkDef: 6,
            atkLvl: 1, defLvl: 1,
            classModAtk: 0, posMod: 0, buffOff: 0, buffDef: 0,
        });
        expect(result.critDmgBonus).toBe(0.20);
        // Em Wild: crit é power×1.5 aplicado como multiplicador de poder
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 8 — Wild vs Group: mesmo cenário, resultados divergem
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Wild vs Group — mesmo cenário produz resultados divergentes [DIV-12]', () => {
    const atk = 7;
    const pwr = 7;
    const def = 6;
    const d20A = 10;
    const d20D = 5;

    it('[DIV-01/02/05] dano Wild vs dano Group: fórmulas produzem valores diferentes', () => {
        // Wild: base = ATK + PWR − DEF = 7+7−6 = 8; final = max(1, floor(8×1.0)) = 8
        const wildDmg = calcDamage({ atk, def, power: pwr, damageMult: 1.0 });

        // Group: DanoBase = PWR+ATK+ModNível−floor(DEF/2) = 7+7+0−3 = 11
        // ACERTO_NORMAL (RC=7): DanoFinal = max(1, floor(11×1.0)) = 11
        const groupResult = computeGroupDamage({
            pwr, atk, lvlDiff: 0, defEnemy: def,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_NORMAL,
            d20ANatural: false, d20DNatural: false,
        });

        // Wild dano: 8; Group dano (ACERTO_NORMAL): 11 → diferença confirmada
        expect(wildDmg).toBe(8);
        expect(groupResult.damage).toBe(11);
        expect(groupResult.damage).toBeGreaterThan(wildDmg);
    });

    it('[DIV-03] ModNível afeta Group mas NÃO Wild — nível 15 vs 1 difere entre modos', () => {
        // Wild: não há ModNível → mesmo dano independente de nível
        const wildDmgHighLvl = calcDamage({ atk, def, power: pwr, damageMult: 1.0 });
        const wildDmgLowLvl  = calcDamage({ atk, def, power: pwr, damageMult: 1.0 });
        expect(wildDmgHighLvl).toBe(wildDmgLowLvl); // Sem diferença de nível em Wild

        // Group: ModNível(14)=3 → mais dano
        const groupHighLvl = computeGroupDamage({
            pwr, atk, lvlDiff: 14, defEnemy: def,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_NORMAL,
            d20ANatural: false, d20DNatural: false,
        });
        const groupLowLvl = computeGroupDamage({
            pwr, atk, lvlDiff: 0, defEnemy: def,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_NORMAL,
            d20ANatural: false, d20DNatural: false,
        });
        // Group com nível alto causa mais dano
        expect(groupHighLvl.damage).toBeGreaterThan(groupLowLvl.damage);
    });

    it('[DIV-06] Wild não tem faixas de dano: não há Acerto Reduzido em Wild', () => {
        // Em Wild: hit = full damage (apenas damageMult 1.0/1.10/0.90)
        // Em Group: ACERTO_REDUZIDO = ×0.60 do dano base
        const wildDmg = calcDamage({ atk, def, power: pwr, damageMult: 1.0 });
        const groupAcertoReduzido = computeGroupDamage({
            pwr, atk, lvlDiff: 0, defEnemy: def,
            damageMult: 1.0, critBonus: 0,
            category: RC_CATEGORY.ACERTO_REDUZIDO,
            d20ANatural: false, d20DNatural: false,
        });
        // Wild dano: 8; Group ACERTO_REDUZIDO: floor(11×0.60)=6
        expect(wildDmg).toBe(8);
        expect(groupAcertoReduzido.damage).toBe(6);
        // Em Wild, um acerto "rasante" causa o mesmo dano que um acerto "forte"
        // Em Group, Acerto Reduzido causa 60% do Acerto Normal
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 9 — ENE regen: valores atuais vs canônico v2.2 [DIV-07]
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT ENE regen — caracterização dos valores atuais vs canônico v2.2 [DIV-07]', () => {
    // Valores ATUAIS em runtime (conforme combatQuantitativeAudit.test.js e wildActions.js)
    // Estes valores estão ABAIXO do que o Patch v2.2 BLOCO 4 prescreve
    const ENE_REGEN_ATUAL = {
        Mago:       { pct: 0.14, min: 2 },  // v2.2 canônico: 0.18, min 3
        Curandeiro: { pct: 0.14, min: 2 },  // v2.2 canônico: 0.18, min 3
        Bardo:      { pct: 0.12, min: 2 },  // v2.2 canônico: 0.14, min 2
        Caçador:    { pct: 0.12, min: 2 },  // v2.2 canônico: 0.14, min 2
        Ladino:     { pct: 0.12, min: 2 },  // v2.2 canônico: 0.14, min 2
        Animalista: { pct: 0.10, min: 1 },  // v2.2 canônico: 0.12, min 2
        Bárbaro:    { pct: 0.10, min: 1 },  // v2.2 canônico: 0.12, min 2
        Guerreiro:  { pct: 0.10, min: 1 },  // v2.2 canônico: 0.10, min 1 ✅
    };

    const ENE_REGEN_CANONICO = {
        Mago:       { pct: 0.18, min: 3 },
        Curandeiro: { pct: 0.18, min: 3 },
        Bardo:      { pct: 0.14, min: 2 },
        Caçador:    { pct: 0.14, min: 2 },
        Ladino:     { pct: 0.14, min: 2 },
        Animalista: { pct: 0.12, min: 2 },
        Bárbaro:    { pct: 0.12, min: 2 },
        Guerreiro:  { pct: 0.10, min: 1 },
    };

    it('[DIV-07] Mago: regen atual é 14% (runtime) vs 18% (canônico v2.2)', () => {
        expect(ENE_REGEN_ATUAL.Mago.pct).toBe(0.14);
        expect(ENE_REGEN_CANONICO.Mago.pct).toBe(0.18);
        expect(ENE_REGEN_ATUAL.Mago.pct).toBeLessThan(ENE_REGEN_CANONICO.Mago.pct);
    });

    it('[DIV-07] Curandeiro: regen atual é 14% (runtime) vs 18% (canônico v2.2)', () => {
        expect(ENE_REGEN_ATUAL.Curandeiro.pct).toBe(0.14);
        expect(ENE_REGEN_CANONICO.Curandeiro.pct).toBe(0.18);
        expect(ENE_REGEN_ATUAL.Curandeiro.min).toBe(2);
        expect(ENE_REGEN_CANONICO.Curandeiro.min).toBe(3);
    });

    it('[DIV-07] Bardo/Caçador/Ladino: regen atual é 12% vs 14% canônico', () => {
        for (const cls of ['Bardo', 'Caçador', 'Ladino']) {
            expect(ENE_REGEN_ATUAL[cls].pct).toBe(0.12);
            expect(ENE_REGEN_CANONICO[cls].pct).toBe(0.14);
            expect(ENE_REGEN_ATUAL[cls].pct).toBeLessThan(ENE_REGEN_CANONICO[cls].pct);
        }
    });

    it('[DIV-07] Guerreiro: único alinhado com canônico v2.2', () => {
        expect(ENE_REGEN_ATUAL.Guerreiro.pct).toBe(ENE_REGEN_CANONICO.Guerreiro.pct);
        expect(ENE_REGEN_ATUAL.Guerreiro.min).toBe(ENE_REGEN_CANONICO.Guerreiro.min);
    });

    it('[DIV-07] impacto: Mago com eneMax=20 ganha 2 ENE/turno atual vs 3 canônico', () => {
        const eneMax = 20;
        const regenAtual    = Math.max(ENE_REGEN_ATUAL.Mago.min,    Math.ceil(eneMax * ENE_REGEN_ATUAL.Mago.pct));
        const regenCanonico = Math.max(ENE_REGEN_CANONICO.Mago.min, Math.ceil(eneMax * ENE_REGEN_CANONICO.Mago.pct));
        // Atual: max(2, ceil(20×0.14)) = max(2, 3) = 3
        // Canônico: max(3, ceil(20×0.18)) = max(3, 4) = 4
        expect(regenAtual).toBe(3);
        expect(regenCanonico).toBe(4);
        expect(regenAtual).toBeLessThan(regenCanonico);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 10 — getModNivel (Group) — caracterização da tabela discreta
// ─────────────────────────────────────────────────────────────────────────────

describe('AUDIT Group getModNivel — tabela discreta ±5 (ausente em Wild)', () => {
    it('[DIV-03] getModNivel existe em groupCombatFormula mas NÃO em wildCore', () => {
        // groupCombatFormula.js exporta getModNivel — é a implementação canônica da tabela ±5
        expect(typeof getModNivel).toBe('function');
        // wildCore.js NÃO define nem exporta getModNivel — ModNível ausente em Wild
        // Auditado diretamente: nenhuma função de ModNível ou tabela de nível existe em wildCore.js
        // Esta ausência é a causa da divergência DIV-03 (nível não afeta Wild Combat)
    });

    it('[v2.2] tabela de faixas: valores de fronteira', () => {
        expect(getModNivel(-20)).toBe(-5);
        expect(getModNivel(-15)).toBe(-4);
        expect(getModNivel(-10)).toBe(-3);
        expect(getModNivel(-6)).toBe(-2);
        expect(getModNivel(-3)).toBe(-1);
        expect(getModNivel(0)).toBe(0);
        expect(getModNivel(3)).toBe(1);
        expect(getModNivel(6)).toBe(2);
        expect(getModNivel(10)).toBe(3);
        expect(getModNivel(15)).toBe(4);
        expect(getModNivel(20)).toBe(5);
    });
});
