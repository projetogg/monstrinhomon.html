import { describe, it, expect } from 'vitest';
import { executeWildAttack } from '../js/combat/wildActions.js';
import { resolveConfrontation, computeGroupDamage, RC_CATEGORY } from '../js/combat/groupCombatFormula.js';

function makePlayerMonster(overrides = {}) {
  return {
    id: 'pm1',
    name: 'Hero',
    class: 'Mago',
    level: 1,
    hp: 100,
    hpMax: 100,
    atk: 7,
    def: 4,
    ene: 10,
    eneMax: 20,
    buffs: [],
    ...overrides,
  };
}

function makeWildMonster(overrides = {}) {
  return {
    id: 'w1',
    name: 'Wild',
    class: 'Mago',
    level: 1,
    hp: 100,
    hpMax: 100,
    atk: 6,
    def: 10,
    ene: 10,
    eneMax: 20,
    buffs: [],
    ...overrides,
  };
}

function makeDeps(overrides = {}) {
  return {
    classAdvantages: {},
    getBasicPower: () => 10,
    eneRegenData: {},
    rollD20: () => 10,
    audio: { playSfx: () => {} },
    ui: { flashTarget: () => {}, showFloatingText: () => {}, updateDiceClash: () => {} },
    ...overrides,
  };
}

function runAttack({ d20A, d20D, playerMonster = {}, wildMonster = {}, deps = {} }) {
  const player = { id: 'p1', name: 'Player', class: playerMonster.class || 'Mago', inventory: {} };
  const pm = makePlayerMonster(playerMonster);
  const wild = makeWildMonster(wildMonster);
  const encounter = { active: true, selectedPlayerId: 'p1', wildMonster: wild, log: [] };

  const result = executeWildAttack({
    encounter,
    player,
    playerMonster: pm,
    d20Roll: d20A,
    defenderRoll: d20D,
    dependencies: makeDeps(deps),
  });

  return { result, encounter, playerMonster: pm, wildMonster: wild };
}

describe('Wild Combat Formula v2.2', () => {
  it('usa d20A/d20D bilateral e defesa alta do defensor pode transformar acerto em falha total', () => {
    const lowDefenseRoll = runAttack({ d20A: 10, d20D: 5 });
    const highDefenseRoll = runAttack({ d20A: 10, d20D: 20 });

    expect(lowDefenseRoll.wildMonster.hp).toBeLessThan(100);
    expect(highDefenseRoll.wildMonster.hp).toBe(100);
  });

  it('usa floor(DEF/2) no dano base', () => {
    const { wildMonster } = runAttack({ d20A: 10, d20D: 5, wildMonster: { def: 10 } });
    // RC = (10 + 7) - (5 + ceil(10/2)) = 7 (Acerto Normal).
    // DanoBase = PWR(10) + ATK(7) + ModNível(0) - floor(10/2) = 12.
    expect(wildMonster.hp).toBe(88);
  });

  it('aplica ModNível no dano do Wild', () => {
    const sameLevel = runAttack({ d20A: 10, d20D: 5, playerMonster: { level: 1 }, wildMonster: { level: 1 } });
    const highLevel = runAttack({ d20A: 10, d20D: 5, playerMonster: { level: 15 }, wildMonster: { level: 1 } });

    expect(highLevel.wildMonster.hp).toBeLessThan(sameLevel.wildMonster.hp);
  });

  it('aplica 5 faixas de RC no Wild (forte > normal > reduzido > contato > falha)', () => {
    const forte = runAttack({ d20A: 10, d20D: 1 });
    const normal = runAttack({ d20A: 10, d20D: 6 });
    const reduzido = runAttack({ d20A: 10, d20D: 9 });
    const contato = runAttack({ d20A: 10, d20D: 15 });
    const falha = runAttack({ d20A: 10, d20D: 20 });

    const dmgForte = 100 - forte.wildMonster.hp;
    const dmgNormal = 100 - normal.wildMonster.hp;
    const dmgReduzido = 100 - reduzido.wildMonster.hp;
    const dmgContato = 100 - contato.wildMonster.hp;
    const dmgFalha = 100 - falha.wildMonster.hp;

    expect(dmgForte).toBeGreaterThan(dmgNormal);
    expect(dmgNormal).toBeGreaterThan(dmgReduzido);
    expect(dmgReduzido).toBeGreaterThan(dmgContato);
    expect(dmgContato).toBeGreaterThanOrEqual(dmgFalha);
    expect(dmgFalha).toBe(0);
  });

  it('nat20 no Wild não é auto-hit; em cenário extremo pode falhar', () => {
    const { wildMonster } = runAttack({
      d20A: 20,
      d20D: 20,
      playerMonster: { atk: 1, level: 1 },
      wildMonster: { def: 30, level: 1 },
    });

    expect(wildMonster.hp).toBe(100);
  });

  it('nat20 aplica +20% no dano final (além do +4 RC)', () => {
    const { wildMonster } = runAttack({ d20A: 20, d20D: 5, wildMonster: { def: 10 } });
    // RC = (20 + 4 + 7) - (5 + ceil(10/2)) = 21 (Acerto Forte).
    // DanoBase=12; faixa forte => floor(12*1.25)=15; crítico => round(15*1.20)=18.
    expect(wildMonster.hp).toBe(82);
  });

  it('preserva passivas de classe sem recalibrar (Guerreiro defensor reduz dano)', () => {
    const neutralDef = runAttack({ d20A: 10, d20D: 5, wildMonster: { class: 'Mago', def: 10 } });
    const warriorDef = runAttack({ d20A: 10, d20D: 5, wildMonster: { class: 'Guerreiro', def: 10 } });

    const neutralDamage = 100 - neutralDef.wildMonster.hp;
    const warriorDamage = 100 - warriorDef.wildMonster.hp;
    expect(warriorDamage).toBeLessThan(neutralDamage);
  });

  it('produz resultado equivalente ao Group em cenário comparável', () => {
    const d20A = 10;
    const d20D = 5;
    const atk = 7;
    const def = 10;
    const pwr = 10;

    const { wildMonster } = runAttack({
      d20A,
      d20D,
      playerMonster: { atk, level: 1, class: 'Mago' },
      wildMonster: { def, level: 1, class: 'Mago' },
    });

    const confrontation = resolveConfrontation({
      d20A,
      d20D,
      atkAtk: atk,
      atkDef: def,
      atkLvl: 1,
      defLvl: 1,
      classModAtk: 0,
      posMod: 0,
      buffOff: 0,
      buffDef: 0,
    });

    expect(confrontation.category).toBe(RC_CATEGORY.ACERTO_NORMAL);

    const groupDamage = computeGroupDamage({
      pwr,
      atk,
      lvlDiff: 0,
      defEnemy: def,
      damageMult: 1,
      critBonus: confrontation.critDmgBonus,
      category: confrontation.category,
      d20ANatural: confrontation.d20ANatural,
      d20DNatural: confrontation.d20DNatural,
    }).damage;

    expect(100 - wildMonster.hp).toBe(groupDamage);
  });
});
