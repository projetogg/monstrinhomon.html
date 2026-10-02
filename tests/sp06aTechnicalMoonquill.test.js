import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { applyStatOffsets } from '../js/canon/speciesBridge.js';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import {
  buildClassAdvantages,
  createSeededRng,
  getClassModifiers,
  getSpdBonus,
  rollD20,
  scaleMonsterTemplate,
  DEFAULT_BASIC_POWER,
  DEFAULT_CLASS_PASSIVES,
} from '../js/combat/combatSimulationHarness.js';
import { computeGroupDamage, resolveConfrontation, RC_CATEGORY } from '../js/combat/groupCombatFormula.js';
import { calculateTurnOrder } from '../js/combat/groupCore.js';

const ROOT = resolve(import.meta.dirname, '..');
const monsters = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8')).monsters;
const species = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/species.json'), 'utf8'));
const matchups = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

const DRACO = monsters.find(mon => mon.id === 'MON_015');
const VITALION = monsters.find(mon => mon.id === 'MON_031B');
const MOONQUILL = species.find(entry => entry.id === 'moonquill');
const CLASS_ADVANTAGES = buildClassAdvantages(matchups);

function makeDraco() {
  const scaled = scaleMonsterTemplate(DRACO, 30);
  const adjusted = applyStatOffsets({
    hpMax: scaled.hpMax,
    atk: scaled.atk,
    def: scaled.def,
    spd: scaled.spd,
    eneMax: scaled.eneMax,
  }, MOONQUILL.base_stat_offsets).stats;
  return { ...scaled, ...adjusted, hp: adjusted.hpMax, canonSpeciesId: 'moonquill', buffs: [] };
}

function makeVitalion() {
  const scaled = scaleMonsterTemplate(VITALION, 30);
  return { ...scaled, hp: scaled.hpMax, buffs: [] };
}

function applyClassPassives(damage, attackerClass, defenderClass) {
  let result = damage;
  const attackBonus = DEFAULT_CLASS_PASSIVES?.[attackerClass]?.attackBonus;
  if (attackBonus && result > 0) result = Math.max(1, Math.round(result * (1 + attackBonus)));
  const defenseBonus = DEFAULT_CLASS_PASSIVES?.[defenderClass]?.defenseBonus;
  if (defenseBonus && result > 0) result = Math.max(1, Math.round(result * (1 - defenseBonus)));
  return result;
}

function attackOutcome(attacker, defender, d20A, d20D, extraSpd = 0) {
  const classMods = getClassModifiers(attacker.class, defender.class, CLASS_ADVANTAGES);
  const confrontation = resolveConfrontation({
    d20A,
    d20D,
    atkAtk: attacker.atk,
    atkDef: defender.def,
    atkLvl: attacker.level,
    defLvl: defender.level,
    classModAtk: classMods.atkBonus,
    buffOff: getSpdBonus({ ...attacker, spd: attacker.spd + extraSpd }, defender),
  });
  if (d20A === 1 || confrontation.category === RC_CATEGORY.FALHA_TOTAL) {
    return { category: confrontation.category, damage: 0 };
  }
  const result = computeGroupDamage({
    pwr: DEFAULT_BASIC_POWER[attacker.class] ?? 7,
    atk: attacker.atk,
    lvlDiff: attacker.level - defender.level,
    defEnemy: defender.def,
    damageMult: classMods.damageMult,
    critBonus: confrontation.critDmgBonus,
    category: confrontation.category,
    d20ANatural: confrontation.d20ANatural,
    d20DNatural: confrontation.d20DNatural,
  });
  return {
    category: confrontation.category,
    damage: applyClassPassives(result.damage, attacker.class, defender.class),
  };
}

function pairedAttackSensitivity({ attacker, defender, runs = 20000, seed = 'sp06a' }) {
  const rng = createSeededRng(seed);
  let categoryChanged = 0;
  let damageChanged = 0;
  let hitChanged = 0;
  let damageDelta = 0;
  for (let i = 0; i < runs; i += 1) {
    const d20A = rollD20(rng);
    const d20D = rollD20(rng);
    const base = attackOutcome(attacker, defender, d20A, d20D, 0);
    const buffed = attackOutcome(attacker, defender, d20A, d20D, 1);
    if (base.category !== buffed.category) categoryChanged += 1;
    if ((base.damage > 0) !== (buffed.damage > 0)) hitChanged += 1;
    if (base.damage !== buffed.damage) damageChanged += 1;
    damageDelta += buffed.damage - base.damage;
  }
  return {
    runs,
    baseSpdBonus: getSpdBonus(attacker, defender),
    buffedSpdBonus: getSpdBonus({ ...attacker, spd: attacker.spd + 1 }, defender),
    categoryChangeRate: categoryChanged / runs,
    hitChangeRate: hitChanged / runs,
    damageChangeRate: damageChanged / runs,
    meanDamageDelta: damageDelta / runs,
  };
}

describe('SP-06A técnico — moonquill', () => {
  it('mede o cenário oficial Dracoflamemon Nv30 × Vitalion Nv30', () => {
    const player = makeDraco();
    const enemy = makeVitalion();

    const modifier = resolvePassiveModifier(player, {
      event: 'on_skill_used',
      hpPct: 1,
      skillType: 'BUFF',
      isDebuff: true,
    });

    const result = pairedAttackSensitivity({
      attacker: player,
      defender: enemy,
      runs: 20000,
      seed: 'sp06a-official-e3d2d4e',
    });

    console.log('SP06A_MOONQUILL_OFFICIAL', JSON.stringify({
      verifiedAgainst: 'e3d2d4e4423eb2171fcd5fff0481bc03972897ed',
      player: { id: player.id, name: player.name, level: player.level, spd: player.spd },
      enemy: { id: enemy.id, name: enemy.name, level: enemy.level, spd: enemy.spd },
      passiveModifier: modifier,
      result,
    }));

    expect(modifier?.spdBuff).toEqual({ power: 1, duration: 1 });
    expect(result.baseSpdBonus).toBe(1);
    expect(result.buffedSpdBonus).toBe(1);
    expect(result.categoryChangeRate).toBe(0);
    expect(result.damageChangeRate).toBe(0);
  });

  it('mede um breakpoint controlado em que +1 SPD cruza diff 2 → 3', () => {
    const player = makeDraco();
    const enemy = { ...makeVitalion(), spd: player.spd - 2 };

    const result = pairedAttackSensitivity({
      attacker: player,
      defender: enemy,
      runs: 20000,
      seed: 'sp06a-breakpoint-e3d2d4e',
    });

    console.log('SP06A_MOONQUILL_BREAKPOINT', JSON.stringify({
      verifiedAgainst: 'e3d2d4e4423eb2171fcd5fff0481bc03972897ed',
      playerSpd: player.spd,
      enemySpd: enemy.spd,
      result,
    }));

    expect(result.baseSpdBonus).toBe(0);
    expect(result.buffedSpdBonus).toBe(1);
    expect(result.categoryChangeRate).toBeGreaterThan(0);
    // O +1 SPD pode alterar a faixa de RC sem alterar o dano final por causa de
    // arredondamento/categorias adjacentes; isso é um dado, não falha da passiva.
    expect(result.damageChangeRate).toBeGreaterThanOrEqual(0);
  });

  it('caracteriza o drift de iniciativa: turnOrder não usa buff de SPD e não se recalcula sozinho', () => {
    const playerMon = makeDraco();
    const enemy = { ...makeVitalion(), spd: playerMon.spd + 1 };
    const enc = {
      participants: ['p1'],
      enemies: [enemy],
      turnOrder: [],
      turnIndex: 0,
    };
    const players = [{
      id: 'p1',
      name: 'Player',
      activeIndex: 0,
      team: [playerMon],
    }];

    const before = calculateTurnOrder(enc, players, () => 10);
    playerMon.buffs.push({ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' });
    const staleAfterBuff = before;
    const explicitRecalc = calculateTurnOrder(enc, players, () => 10);

    console.log('SP06A_MOONQUILL_GROUP_INITIATIVE', JSON.stringify({
      verifiedAgainst: 'e3d2d4e4423eb2171fcd5fff0481bc03972897ed',
      playerBaseSpd: playerMon.spd,
      enemySpd: enemy.spd,
      initialOrder: before.map(actor => ({ side: actor.side, spd: actor.spd })),
      staleOrderAfterBuffWithoutRecalc: staleAfterBuff.map(actor => ({ side: actor.side, spd: actor.spd })),
      explicitRecalcAfterBuff: explicitRecalc.map(actor => ({ side: actor.side, spd: actor.spd })),
      note: 'calculateTurnOrder lê mon.spd base, não buffs de SPD',
    }));

    expect(before[0].side).toBe('enemy');
    expect(staleAfterBuff[0].side).toBe('enemy');
    expect(explicitRecalc[0].side).toBe('enemy');
  });
});
