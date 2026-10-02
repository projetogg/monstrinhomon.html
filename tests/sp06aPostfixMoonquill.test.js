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
import { getEffectiveSpd } from '../js/combat/wildCore.js';
import { updateBuffs } from '../js/combat/wildActions.js';

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

function attackOutcome(attacker, defender, d20A, d20D) {
  const classMods = getClassModifiers(attacker.class, defender.class, CLASS_ADVANTAGES);
  const confrontation = resolveConfrontation({
    d20A,
    d20D,
    atkAtk: attacker.atk,
    atkDef: defender.def,
    atkLvl: attacker.level,
    defLvl: defender.level,
    classModAtk: classMods.atkBonus,
    buffOff: getSpdBonus(
      { ...attacker, spd: getEffectiveSpd(attacker) },
      { ...defender, spd: getEffectiveSpd(defender) },
    ),
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

function pairedAttackSensitivity({ player, enemy, runs = 20000, seed }) {
  const rng = createSeededRng(seed);
  let categoryChanged = 0;
  let hitChanged = 0;
  let damageChanged = 0;
  let damageDelta = 0;

  for (let i = 0; i < runs; i += 1) {
    const d20A = rollD20(rng);
    const d20D = rollD20(rng);

    player.buffs = [];
    const base = attackOutcome(player, enemy, d20A, d20D);

    player.buffs = [{
      type: 'spd',
      power: 1,
      duration: 1,
      source: 'moonquill_passive',
      deferFirstTick: true,
    }];
    updateBuffs(player);
    const buffed = attackOutcome(player, enemy, d20A, d20D);

    if (base.category !== buffed.category) categoryChanged += 1;
    if ((base.damage > 0) !== (buffed.damage > 0)) hitChanged += 1;
    if (base.damage !== buffed.damage) damageChanged += 1;
    damageDelta += buffed.damage - base.damage;
  }

  return {
    runs,
    baseSpdBonus: (() => {
      player.buffs = [];
      return getSpdBonus(player, enemy);
    })(),
    buffedSpdBonus: (() => {
      player.buffs = [{ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' }];
      return getSpdBonus(
        { ...player, spd: getEffectiveSpd(player) },
        { ...enemy, spd: getEffectiveSpd(enemy) },
      );
    })(),
    categoryChangeRate: categoryChanged / runs,
    hitChangeRate: hitChanged / runs,
    damageChangeRate: damageChanged / runs,
    meanDamageDelta: damageDelta / runs,
  };
}

function initiativeSensitivity({ playerBaseSpd, enemySpd, runs = 20000, seed }) {
  const rng = createSeededRng(seed);
  let beforePlayerFirst = 0;
  let afterPlayerFirst = 0;

  for (let i = 0; i < runs; i += 1) {
    const player = {
      id: 'pmon', name: 'PlayerMon', class: 'Mago', hp: 50, hpMax: 50,
      spd: playerBaseSpd, buffs: [],
    };
    const enemy = {
      id: 0, name: 'Enemy', class: 'Curandeiro', hp: 50, hpMax: 50,
      spd: enemySpd, buffs: [],
    };
    const enc = { participants: ['p1'], enemies: [enemy] };
    const players = [{ id: 'p1', name: 'Player', activeIndex: 0, team: [player] }];

    const rollBefore = () => rollD20(rng);
    const before = calculateTurnOrder(enc, players, rollBefore);
    if (before[0]?.side === 'player') beforePlayerFirst += 1;

    player.buffs = [{
      type: 'spd', power: 1, duration: 1,
      source: 'moonquill_passive', deferFirstTick: true,
    }];
    updateBuffs(player);
    const rollAfter = () => rollD20(rng);
    const after = calculateTurnOrder(enc, players, rollAfter);
    if (after[0]?.side === 'player') afterPlayerFirst += 1;
  }

  return {
    runs,
    playerBaseSpd,
    enemySpd,
    beforePlayerFirstRate: beforePlayerFirst / runs,
    afterPlayerFirstRate: afterPlayerFirst / runs,
    deltaPlayerFirstRate: (afterPlayerFirst - beforePlayerFirst) / runs,
  };
}

describe('SP-06A técnico pós-fix — moonquill', () => {
  it('confirma que o buff sobrevive ao primeiro tick e é consumível na próxima ação', () => {
    const player = makeDraco();
    const modifier = resolvePassiveModifier(player, {
      event: 'on_skill_used',
      hpPct: 1,
      skillType: 'BUFF',
      isDebuff: true,
    });

    player.buffs.push({
      type: 'spd',
      power: modifier.spdBuff.power,
      duration: modifier.spdBuff.duration,
      source: 'moonquill_passive',
      deferFirstTick: true,
    });

    const beforeTick = getEffectiveSpd(player);
    updateBuffs(player);
    const duringNextAction = getEffectiveSpd(player);
    updateBuffs(player);
    const afterWindow = getEffectiveSpd(player);

    console.log('SP06A_POSTFIX_LIFETIME', JSON.stringify({
      verifiedAgainst: 'b78bc8878e0bb7f644657644861e66ec1ce911d1',
      baseSpd: player.spd,
      beforeTick,
      duringNextAction,
      afterWindow,
    }));

    expect(duringNextAction).toBe(player.spd + 1);
    expect(afterWindow).toBe(player.spd);
  });

  it('reme­de o cenário oficial Dracoflamemon Nv30 × Vitalion Nv30', () => {
    const player = makeDraco();
    const enemy = makeVitalion();

    const result = pairedAttackSensitivity({
      player,
      enemy,
      runs: 20000,
      seed: 'sp06a-postfix-official-b78bc',
    });

    console.log('SP06A_POSTFIX_OFFICIAL', JSON.stringify({
      verifiedAgainst: 'b78bc8878e0bb7f644657644861e66ec1ce911d1',
      player: { id: player.id, name: player.name, level: player.level, spd: player.spd },
      enemy: { id: enemy.id, name: enemy.name, level: enemy.level, spd: enemy.spd },
      result,
    }));

    expect(result.baseSpdBonus).toBe(1);
    expect(result.buffedSpdBonus).toBe(1);
    expect(result.categoryChangeRate).toBe(0);
  });

  it('mede breakpoint ofensivo diff 2 → 3 após a correção de duração', () => {
    const player = makeDraco();
    const enemy = { ...makeVitalion(), spd: player.spd - 2 };

    const result = pairedAttackSensitivity({
      player,
      enemy,
      runs: 20000,
      seed: 'sp06a-postfix-breakpoint-b78bc',
    });

    console.log('SP06A_POSTFIX_ATTACK_BREAKPOINT', JSON.stringify({
      verifiedAgainst: 'b78bc8878e0bb7f644657644861e66ec1ce911d1',
      playerSpd: player.spd,
      enemySpd: enemy.spd,
      result,
    }));

    expect(result.baseSpdBonus).toBe(0);
    expect(result.buffedSpdBonus).toBe(1);
    expect(result.categoryChangeRate).toBeGreaterThan(0);
  });

  it('mede breakpoint de iniciativa Group em que +1 SPD empata 41 × 42', () => {
    const result = initiativeSensitivity({
      playerBaseSpd: 41,
      enemySpd: 42,
      runs: 20000,
      seed: 'sp06a-postfix-initiative-b78bc',
    });

    console.log('SP06A_POSTFIX_INITIATIVE_BREAKPOINT', JSON.stringify({
      verifiedAgainst: 'b78bc8878e0bb7f644657644861e66ec1ce911d1',
      result,
      note: 'mede o runtime atual; não substitui a reconciliação futura com iniciativa canônica SPD+d6',
    }));

    expect(result.beforePlayerFirstRate).toBe(0);
    expect(result.afterPlayerFirstRate).toBeGreaterThan(0);
  });
});
