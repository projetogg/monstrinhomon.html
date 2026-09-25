import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { applyStatOffsets } from '../js/canon/speciesBridge.js';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import { computeGroupDamage, resolveConfrontation, RC_CATEGORY } from '../js/combat/groupCombatFormula.js';
import {
  DEFAULT_BASIC_POWER,
  DEFAULT_CLASS_PASSIVES,
  buildClassAdvantages,
  createSeededRng,
  getClassModifiers,
  getSpdBonus,
  rollD20,
  scaleMonsterTemplate,
} from '../js/combat/combatSimulationHarness.js';
import { executeWildItemUse } from '../js/combat/wildActions.js';

const ROOT = resolve(import.meta.dirname, '..');
const monsters = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8')).monsters;
const items = JSON.parse(readFileSync(resolve(ROOT, 'data/items.json'), 'utf8')).items;
const matchups = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));
const species = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/species.json'), 'utf8'));

const NUTRILO = monsters.find(mon => mon.id === 'MON_028');
const FURTILHON = monsters.find(mon => mon.id === 'MON_030');
const PETISCO = items.find(item => item.id === 'IT_HEAL_01');
const FLORACURA = species.find(entry => entry.id === 'floracura');
const CLASS_ADVANTAGES = buildClassAdvantages(matchups);

function applyClassPassives(damage, attackerClass, defenderClass) {
  let result = damage;
  const attackBonus = DEFAULT_CLASS_PASSIVES?.[attackerClass]?.attackBonus;
  if (attackBonus && result > 0) result = Math.max(1, Math.round(result * (1 + attackBonus)));
  const defenseBonus = DEFAULT_CLASS_PASSIVES?.[defenderClass]?.defenseBonus;
  if (defenseBonus && result > 0) result = Math.max(1, Math.round(result * (1 - defenseBonus)));
  return result;
}

function makePlayer(passiveEnabled) {
  const scaled = scaleMonsterTemplate(NUTRILO, 10);
  const adjusted = applyStatOffsets({
    hpMax: scaled.hpMax,
    atk: scaled.atk,
    def: scaled.def,
    spd: scaled.spd,
    eneMax: scaled.eneMax,
  }, FLORACURA.base_stat_offsets).stats;
  return {
    ...scaled,
    ...adjusted,
    hp: adjusted.hpMax,
    canonSpeciesId: passiveEnabled ? 'floracura' : null,
  };
}

function makeEnemy(level = 10) {
  return scaleMonsterTemplate(FURTILHON, level);
}

function attack(attacker, defender, rng) {
  const d20A = rollD20(rng);
  const d20D = rollD20(rng);
  const classMods = getClassModifiers(attacker.class, defender.class, CLASS_ADVANTAGES);
  const confrontation = resolveConfrontation({
    d20A,
    d20D,
    atkAtk: attacker.atk,
    atkDef: defender.def,
    atkLvl: attacker.level,
    defLvl: defender.level,
    classModAtk: classMods.atkBonus,
    buffOff: getSpdBonus(attacker, defender),
  });
  if (d20A === 1 || confrontation.category === RC_CATEGORY.FALHA_TOTAL) return 0;

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
  const damage = applyClassPassives(result.damage, attacker.class, defender.class);
  defender.hp = Math.max(0, defender.hp - damage);
  return damage;
}

function simulateBattle({ passiveEnabled, seed, itemThreshold = 0.5, enemyLevel = 10, maxTurns = 30 }) {
  const player = makePlayer(passiveEnabled);
  const enemy = makeEnemy(enemyLevel);
  const rng = createSeededRng(seed);
  const healAmount = Math.max(
    Number(PETISCO.heal_min) || 0,
    Math.floor(player.hpMax * (Number(PETISCO.heal_pct) || 0)),
  );

  let turn = 0;
  let itemUsed = false;
  let injuryOpportunity = false;
  let anyBonusRoomOpportunity = false;
  let fullBonusRoomOpportunity = false;
  let policyOpportunity = false;
  let itemUseTurn = null;
  let hpBeforeItem = null;
  let baseHeal = 0;
  let passiveTriggered = false;
  let passiveBonus = 0;
  let survivedCounterAfterItem = null;

  while (player.hp > 0 && enemy.hp > 0 && turn < maxTurns) {
    turn += 1;

    if (!itemUsed && player.hp > 0 && player.hp < player.hpMax) {
      injuryOpportunity = true;
      const missing = player.hpMax - player.hp;
      if (missing > healAmount) anyBonusRoomOpportunity = true;
      if (missing >= healAmount + 3) fullBonusRoomOpportunity = true;
    }

    const canUseItem = !itemUsed
      && player.hp > 0
      && player.hp < player.hpMax
      && player.hp / player.hpMax <= itemThreshold;

    let usedItemThisTurn = false;
    if (canUseItem) {
      policyOpportunity = true;
      itemUsed = true;
      usedItemThisTurn = true;
      itemUseTurn = turn;
      hpBeforeItem = player.hp;

      const missing = player.hpMax - player.hp;
      baseHeal = Math.min(missing, healAmount);
      player.hp += baseHeal;

      if (passiveEnabled) {
        const modifier = resolvePassiveModifier(player, {
          event: 'on_heal_item',
          hpPct: hpBeforeItem / player.hpMax,
          isFirstHeal: true,
        });
        if (modifier?.healBonus) {
          passiveTriggered = true;
          passiveBonus = Math.min(Number(modifier.healBonus) || 0, player.hpMax - player.hp);
          player.hp += passiveBonus;
        }
      }
    } else {
      attack(player, enemy, rng);
    }

    if (enemy.hp <= 0) break;

    attack(enemy, player, rng);
    if (usedItemThisTurn) survivedCounterAfterItem = player.hp > 0;
  }

  return {
    winner: player.hp > 0 && enemy.hp <= 0 ? 'player' : enemy.hp > 0 && player.hp <= 0 ? 'enemy' : 'draw',
    turns: turn,
    playerHpFinal: player.hp,
    enemyHpFinal: enemy.hp,
    playerHpMax: player.hpMax,
    healAmount,
    itemUsed,
    injuryOpportunity,
    anyBonusRoomOpportunity,
    fullBonusRoomOpportunity,
    policyOpportunity,
    itemUseTurn,
    hpBeforeItem,
    baseHeal,
    passiveTriggered,
    passiveBonus,
    totalHeal: baseHeal + passiveBonus,
    survivedCounterAfterItem,
  };
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarize(runs) {
  const itemRuns = runs.filter(run => run.itemUsed);
  const bonusRuns = itemRuns.filter(run => run.passiveBonus > 0);
  const fullBonusRuns = itemRuns.filter(run => run.passiveBonus === 3);
  const counterObserved = itemRuns.filter(run => run.survivedCounterAfterItem !== null);
  return {
    runs: runs.length,
    winRate: runs.filter(run => run.winner === 'player').length / runs.length,
    drawRate: runs.filter(run => run.winner === 'draw').length / runs.length,
    turnsMean: mean(runs.map(run => run.turns)),
    playerHpFinalMean: mean(runs.map(run => run.playerHpFinal)),
    injuryOpportunityRate: runs.filter(run => run.injuryOpportunity).length / runs.length,
    anyBonusRoomOpportunityRate: runs.filter(run => run.anyBonusRoomOpportunity).length / runs.length,
    fullBonusRoomOpportunityRate: runs.filter(run => run.fullBonusRoomOpportunity).length / runs.length,
    itemUseRate: itemRuns.length / runs.length,
    itemUseTurnMean: mean(itemRuns.map(run => run.itemUseTurn)),
    hpBeforeItemMean: mean(itemRuns.map(run => run.hpBeforeItem)),
    baseHealMeanPerUse: mean(itemRuns.map(run => run.baseHeal)),
    passiveTriggerRate: runs.filter(run => run.passiveTriggered).length / runs.length,
    positiveBonusRateAmongUses: itemRuns.length ? bonusRuns.length / itemRuns.length : 0,
    fullBonusRateAmongUses: itemRuns.length ? fullBonusRuns.length / itemRuns.length : 0,
    zeroBonusRateAmongUses: itemRuns.length ? itemRuns.filter(run => run.passiveBonus === 0).length / itemRuns.length : 0,
    passiveBonusMeanPerUse: mean(itemRuns.map(run => run.passiveBonus)),
    totalHealMeanPerUse: mean(itemRuns.map(run => run.totalHeal)),
    survivedCounterAfterItemRate: counterObserved.length
      ? counterObserved.filter(run => run.survivedCounterAfterItem).length / counterObserved.length
      : 0,
  };
}

function simulatePair({ runs, seed, itemThreshold, enemyLevel = 10 }) {
  const baseRuns = [];
  const passiveRuns = [];
  for (let index = 0; index < runs; index += 1) {
    const runSeed = `${seed}:threshold-${itemThreshold}:enemy-${enemyLevel}:run-${index}`;
    baseRuns.push(simulateBattle({ passiveEnabled: false, seed: runSeed, itemThreshold, enemyLevel }));
    passiveRuns.push(simulateBattle({ passiveEnabled: true, seed: runSeed, itemThreshold, enemyLevel }));
  }
  const base = summarize(baseRuns);
  const passive = summarize(passiveRuns);
  const lossToWin = passiveRuns.reduce((count, run, index) => (
    run.winner === 'player' && baseRuns[index].winner !== 'player' ? count + 1 : count
  ), 0) / runs;
  const winToLoss = passiveRuns.reduce((count, run, index) => (
    run.winner !== 'player' && baseRuns[index].winner === 'player' ? count + 1 : count
  ), 0) / runs;

  return {
    threshold: itemThreshold,
    enemyLevel,
    playerHpMax: passiveRuns[0]?.playerHpMax ?? null,
    itemHealAmount: passiveRuns[0]?.healAmount ?? null,
    base,
    passive,
    delta: {
      winRate: passive.winRate - base.winRate,
      turnsMean: passive.turnsMean - base.turnsMean,
      playerHpFinalMean: passive.playerHpFinalMean - base.playerHpFinalMean,
      lossToWinRate: lossToWin,
      winToLossRate: winToLoss,
    },
  };
}

function compact(result) {
  return {
    threshold: result.threshold,
    enemyLevel: result.enemyLevel,
    playerHpMax: result.playerHpMax,
    itemHealAmount: result.itemHealAmount,
    baseWinRate: result.base.winRate,
    passiveWinRate: result.passive.winRate,
    deltaWinRate: result.delta.winRate,
    lossToWinRate: result.delta.lossToWinRate,
    turnsDelta: result.delta.turnsMean,
    playerHpFinalDelta: result.delta.playerHpFinalMean,
    injuryOpportunityRate: result.passive.injuryOpportunityRate,
    anyBonusRoomOpportunityRate: result.passive.anyBonusRoomOpportunityRate,
    fullBonusRoomOpportunityRate: result.passive.fullBonusRoomOpportunityRate,
    itemUseRate: result.passive.itemUseRate,
    itemUseTurnMean: result.passive.itemUseTurnMean,
    hpBeforeItemMean: result.passive.hpBeforeItemMean,
    baseHealMeanPerUse: result.passive.baseHealMeanPerUse,
    positiveBonusRateAmongUses: result.passive.positiveBonusRateAmongUses,
    fullBonusRateAmongUses: result.passive.fullBonusRateAmongUses,
    zeroBonusRateAmongUses: result.passive.zeroBonusRateAmongUses,
    passiveBonusMeanPerUse: result.passive.passiveBonusMeanPerUse,
    totalHealMeanPerUse: result.passive.totalHealMeanPerUse,
    survivedCounterAfterItemRate: result.passive.survivedCounterAfterItemRate,
  };
}

describe('SP-03 técnico — floracura com oportunidade natural de item', () => {
  it('mede o cenário oficial com política intermediária de item em <=50% HP', () => {
    const result = simulatePair({
      runs: 20000,
      seed: 'sp03-floracura-official-03a67',
      itemThreshold: 0.50,
      enemyLevel: 10,
    });

    console.log('SP03_FLORACURA_OFFICIAL', JSON.stringify({
      verifiedAgainst: '03a67aa1fb54698feea1f9959988dcd536c50ac8',
      player: 'MON_028',
      enemy: 'MON_030',
      level: 10,
      item: 'IT_HEAL_01',
      result: compact(result),
    }));

    expect(result.playerHpMax).toBeGreaterThan(0);
    expect(result.itemHealAmount).toBe(30);
    expect(result.passive.injuryOpportunityRate).toBeGreaterThan(0);
    expect(result.passive.itemUseRate).toBeGreaterThan(0);
  });

  it('compara políticas técnicas de uso cedo/intermediário/eficiente/tardio', () => {
    const rows = [0.70, 0.50, 0.40, 0.30].map(itemThreshold => compact(simulatePair({
      runs: 5000,
      seed: 'sp03-floracura-policy-03a67',
      itemThreshold,
      enemyLevel: 10,
    })));

    console.log('SP03_FLORACURA_POLICY_SENSITIVITY', JSON.stringify({
      verifiedAgainst: '03a67aa1fb54698feea1f9959988dcd536c50ac8',
      runsPerPair: 5000,
      rows,
    }));

    expect(rows).toHaveLength(4);
    expect(rows.every(row => row.itemUseRate >= 0 && row.itemUseRate <= 1)).toBe(true);
  });

  it('mede sensibilidade de dificuldade do cenário com política eficiente em <=40% HP', () => {
    const rows = [8, 9, 10].map(enemyLevel => compact(simulatePair({
      runs: 5000,
      seed: 'sp03-floracura-difficulty-03a67',
      itemThreshold: 0.40,
      enemyLevel,
    })));

    console.log('SP03_FLORACURA_DIFFICULTY_SENSITIVITY', JSON.stringify({
      verifiedAgainst: '03a67aa1fb54698feea1f9959988dcd536c50ac8',
      runsPerPair: 5000,
      rows,
    }));

    expect(rows).toHaveLength(3);
  });

  it('confirma que o feedback Wild actualHeal não inclui o bônus da passiva', () => {
    const playerMonster = {
      id: 'MON_028',
      name: 'Nutrilo',
      class: 'Curandeiro',
      canonSpeciesId: 'floracura',
      hp: 20,
      hpMax: 54,
      atk: 5,
      def: 9,
      spd: 8,
      ene: 10,
      eneMax: 29,
      buffs: [],
    };
    const wildMonster = {
      id: 'MON_030',
      name: 'Furtilhon',
      class: 'Ladino',
      hp: 40,
      hpMax: 40,
      atk: 8,
      def: 3,
      spd: 10,
      ene: 0,
      eneMax: 10,
      buffs: [],
    };
    const encounter = {
      id: 'sp03-feedback',
      type: 'wild',
      active: true,
      wildMonster,
      selectedPlayerId: 'p1',
      log: [],
    };
    const player = {
      id: 'p1',
      name: 'Jogador',
      class: 'Curandeiro',
      inventory: { IT_HEAL_01: 1 },
      team: [playerMonster],
    };
    let rollIndex = 0;
    const rolls = [1, 20];
    const onHealVisualFeedback = vi.fn();
    const result = executeWildItemUse({
      encounter,
      player,
      playerMonster,
      itemId: 'IT_HEAL_01',
      dependencies: {
        getItemDef: () => PETISCO,
        eneRegenData: {},
        classAdvantages: CLASS_ADVANTAGES,
        getBasicPower: cls => DEFAULT_BASIC_POWER[cls] ?? 7,
        rollD20: () => rolls[(rollIndex++) % rolls.length],
        updateFriendship: vi.fn(),
        tutorialOnAction: vi.fn(),
        onHealVisualFeedback,
        audio: { playSfx: vi.fn() },
      },
    });

    console.log('SP03_FLORACURA_FEEDBACK', JSON.stringify({
      hpBefore: 20,
      hpAfter: playerMonster.hp,
      resultActualHeal: result.actualHeal,
      visualHeal: onHealVisualFeedback.mock.calls[0]?.[0] ?? null,
      passiveLog: encounter.log.find(line => line.includes('Passiva')) ?? null,
    }));

    expect(playerMonster.hp).toBe(53);
    expect(result.actualHeal).toBe(30);
    expect(onHealVisualFeedback).toHaveBeenCalledWith(30);
    expect(encounter.log.some(line => line.includes('+3 HP'))).toBe(true);
  });
});
