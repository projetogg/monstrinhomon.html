import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import { simulateSpeciesPassiveScenarioPair } from '../js/combat/speciesPassiveQuantitativeHarness.js';
import {
  DEFAULT_BASIC_POWER, DEFAULT_CLASS_PASSIVES, applyEneRegen,
  buildClassAdvantages, calculateEneRegen, createSeededRng,
  getClassModifiers, getSpdBonus, rollD20, scaleMonsterTemplate,
} from '../js/combat/combatSimulationHarness.js';
import { RC_CATEGORY, computeGroupDamage, resolveConfrontation } from '../js/combat/groupCombatFormula.js';

// Bancada TEMPORÁRIA. Não alterar runtime/cânone; PR de análise sem merge.
const ROOT = resolve(import.meta.dirname, '..');
const catalog = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8')).monsters;
const skills = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8')).skills;
const matchups = buildClassAdvantages(JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8')));
const PLAYER = catalog.find(mon => mon.id === 'MON_021');
const ENEMY = catalog.find(mon => mon.id === 'MON_030');
const BRUTAL = skills.find(skill => skill.id === 'GOLPE_BRUTAL_0');
const FURY = skills.find(skill => skill.id === 'FURIA_0');
const SHA = 'cde906a27c33989efc1c6b606cde6740c79a1708';

function scenario(profile, opponent = ENEMY, label = 'official') {
  return {
    id: 'sp05-emberfang-' + label + '-' + profile,
    speciesId: 'emberfang', className: 'Bárbaro', level: 10, profile,
    playerTemplate: PLAYER, enemyTemplate: opponent, classAdvantages: matchups,
    basicPower: DEFAULT_BASIC_POWER['Bárbaro'], skillPower: BRUTAL.power,
  };
}

function naturalAtLevel(mon, level) {
  if (!mon || mon.deprecated || mon.id === 'MON_100') return false;
  const prior = catalog.find(candidate => candidate.evolvesTo === mon.id);
  const minLevel = prior ? Number(prior.evolvesAt) || 1 : 1;
  return minLevel <= level && level < (Number(mon.evolvesAt) || Infinity);
}

const avg = numbers => numbers.reduce((sum, n) => sum + n, 0) / (numbers.length || 1);
const round = (v, places = 5) => Number(Number(v).toFixed(places));
function stats(rows) {
  const sorted = [...rows].sort((a,b) => a - b);
  const quantile = q => {
    if (!sorted.length) return null;
    const idx = q * (sorted.length - 1);
    const lower = Math.floor(idx), upper = Math.ceil(idx);
    return round(sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower));
  };
  return { mean: round(avg(rows)), median: quantile(.5), p10: quantile(.1), p90: quantile(.9) };
}
function summarize(result) {
  return {
    baseWinRate: result.base.winRate,
    passiveWinRate: result.passive.winRate,
    deltaWinRate: result.delta.winRate,
    baseTurns: result.base.turns,
    passiveTurns: result.passive.turns,
    deltaTurns: result.delta.turns,
    deltaDamage: result.delta.damageDealt,
    deltaHpFinal: result.delta.playerHpFinal,
    applications: result.passive.effects.atkBonusApplications,
    combatsWithActivation: result.passive.combatsWithActivationRate,
    skills: result.passive.skillUses,
    basics: result.passive.basicUses,
  };
}

// Sensibilidade de ENE separada: reutiliza funções puras canônicas, mas NÃO
// substitui engine completo: jogador age primeiro, inimigo usa apenas básico,
// sem IA/itens/kit swap; Fúria não é simulada nesta política.
function makeCombatant(template) {
  const scaled = scaleMonsterTemplate(template, 10);
  const hpMax = Math.max(12, Math.round(scaled.hpMax * 1.6));
  return { ...scaled, hpMax, hp: hpMax };
}
function oneBattle({ enabled, seed, initialEnergyRatio }) {
  const rng = createSeededRng(seed);
  const player = makeCombatant(PLAYER), enemy = makeCombatant(ENEMY);
  let ene = Math.floor(player.eneMax * initialEnergyRatio);
  let turns = 0, opportunities = 0, eligibleTurns = 0, attempts = 0;
  let applications = 0, extraDmg = 0, skillsAbove70 = 0, skillsBelowOrAt70 = 0;
  let eneSpent = 0, eneGained = 0, damageDealt = 0, basicUses = 0, skillUses = 0;

  function strike(attacker, defender, power, offensiveSkill = false) {
    const d20A = rollD20(rng), d20D = rollD20(rng);
    const classMods = getClassModifiers(attacker.class, defender.class, matchups);
    const confrontation = resolveConfrontation({
      d20A, d20D, atkAtk: attacker.atk, atkDef: defender.def,
      atkLvl: attacker.level, defLvl: defender.level,
      classModAtk: classMods.atkBonus,
      buffOff: getSpdBonus(attacker, defender),
    });
    if (d20A === 1 || confrontation.category === RC_CATEGORY.FALHA_TOTAL) return 0;

    const eligible = offensiveSkill && attacker === player && player.hp / player.hpMax > .70;
    const modifier = enabled && eligible ? resolvePassiveModifier(
      { ...attacker, canonSpeciesId: 'emberfang' },
      { event: 'on_attack', hpPct: attacker.hp / attacker.hpMax, isOffensiveSkill: true },
    ) : null;
    const atkBonus = modifier?.atkBonus ?? 0;
    const raw = atk => computeGroupDamage({
      pwr: power, atk, lvlDiff: attacker.level - defender.level, defEnemy: defender.def,
      damageMult: classMods.damageMult, critBonus: confrontation.critDmgBonus,
      category: confrontation.category, d20ANatural: confrontation.d20ANatural,
      d20DNatural: confrontation.d20DNatural,
    }).damage;
    const passives = dmg => {
      let result = dmg;
      const attack = DEFAULT_CLASS_PASSIVES?.[attacker.class]?.attackBonus;
      const defense = DEFAULT_CLASS_PASSIVES?.[defender.class]?.defenseBonus;
      if (attack && result > 0) result = Math.max(1, Math.round(result * (1 + attack)));
      if (defense && result > 0) result = Math.max(1, Math.round(result * (1 - defense)));
      return result;
    };
    const damage = passives(raw(attacker.atk + atkBonus));
    if (atkBonus > 0) {
      applications += 1;
      extraDmg += damage - passives(raw(attacker.atk));
    }
    defender.hp = Math.max(0, defender.hp - damage);
    return damage;
  }

  while (player.hp > 0 && enemy.hp > 0 && turns < 30) {
    turns += 1;
    const regen = applyEneRegen(ene, player.eneMax, calculateEneRegen(player.class, player.eneMax));
    ene = regen.energy; eneGained += regen.gained;

    const hpEligible = player.hp / player.hpMax > .70;
    const skillAffordable = ene >= BRUTAL.energy_cost;
    if (hpEligible) eligibleTurns += 1;
    if (hpEligible && skillAffordable) opportunities += 1;

    if (skillAffordable) {
      skillUses += 1; attempts += 1; ene -= BRUTAL.energy_cost; eneSpent += BRUTAL.energy_cost;
      if (hpEligible) skillsAbove70 += 1; else skillsBelowOrAt70 += 1;
      damageDealt += strike(player, enemy, BRUTAL.power, true);
    } else {
      basicUses += 1;
      damageDealt += strike(player, enemy, DEFAULT_BASIC_POWER['Bárbaro']);
    }
    if (enemy.hp <= 0) break;
    strike(enemy, player, DEFAULT_BASIC_POWER.Ladino);
  }
  return {
    winner: enemy.hp <= 0 && player.hp > 0 ? 'player' : player.hp <= 0 && enemy.hp > 0 ? 'enemy' : 'draw',
    turns, playerHpFinal: player.hp, damageDealt,
    opportunities, eligibleTurns, attempts, applications, extraDmg,
    skillsAbove70, skillsBelowOrAt70, eneSpent, eneGained, basicUses, skillUses,
  };
}
function energyPair(runs, initialEnergyRatio, seed) {
  const base = [], passive = [];
  for(let i = 0; i < runs; i++) {
    const runSeed = seed + ':run-' + i;
    base.push(oneBattle({enabled:false, seed:runSeed, initialEnergyRatio}));
    passive.push(oneBattle({enabled:true, seed:runSeed, initialEnergyRatio}));
  }
  const total = key => passive.reduce((n,row)=>n+row[key],0);
  return {
    runs, initialEnergyRatio,
    baseWinRate: round(base.filter(row=>row.winner==='player').length/runs),
    passiveWinRate: round(passive.filter(row=>row.winner==='player').length/runs),
    baseTTK: stats(base.map(row=>row.turns)),
    passiveTTK: stats(passive.map(row=>row.turns)),
    pairedTurns: stats(passive.map((row,i)=>row.turns - base[i].turns)),
    pairedDamage: stats(passive.map((row,i)=>row.damageDealt - base[i].damageDealt)),
    pairedHpFinal: stats(passive.map((row,i)=>row.playerHpFinal - base[i].playerHpFinal)),
    activationRate: round(passive.filter(row=>row.applications>0).length/runs),
    opportunityRate: round(passive.filter(row=>row.opportunities>0).length/runs),
    eligibleTurns: total('eligibleTurns'),
    opportunityTurns: total('opportunities'),
    skillAttempts: total('attempts'),
    skillsAbove70: total('skillsAbove70'),
    skillsBelowOrAt70: total('skillsBelowOrAt70'),
    appliedBonuses: total('applications'),
    directExtraDamage: total('extraDmg'),
    totalEneSpent: total('eneSpent'),
    totalEneRegen: total('eneGained'),
  };
}

describe('SP-05 técnico controlado — emberfang', () => {
  it('valida contrato puro e limiar estrito', () => {
    const mon = { canonSpeciesId: 'emberfang' };
    const invoke = (hpPct, isOffensiveSkill, event='on_attack') =>
      resolvePassiveModifier(mon, {event, hpPct, isOffensiveSkill});
    expect(invoke(1, true)).toEqual({atkBonus:1});
    expect(invoke(.700001, true)).toEqual({atkBonus:1});
    expect(invoke(.70, true)).toBeNull();
    expect(invoke(.699999, true)).toBeNull();
    expect(invoke(1, false)).toBeNull();
    expect(invoke(1, true, 'on_skill_used')).toBeNull();
    expect(invoke(undefined, true)).toBeNull();
    expect(BRUTAL.type).toBe('DAMAGE');
    expect(FURY.type).toBe('BUFF');
    expect(naturalAtLevel(PLAYER,10)).toBe(true);
    expect(naturalAtLevel(ENEMY,10)).toBe(true);
    console.log('SP05_CONTRACT',JSON.stringify({
      SHA, player:{id:PLAYER.id, name:PLAYER.name, level:10},
      enemy:{id:ENEMY.id, name:ENEMY.name, level:10},
      skill:{id:BRUTAL.id, power:BRUTAL.power, eneCost:BRUTAL.energy_cost},
      fury:{id:FURY.id, type:FURY.type, eneCost:FURY.energy_cost},
      scaledPlayer:makeCombatant(PLAYER),
      engine:'controlled, not full runtime parity',
    }));
  });

  it('mede cenário oficial perfil basic, sem possibilidade de ativação', () => {
    const result=simulateSpeciesPassiveScenarioPair(scenario('basic'), {
      runs:20000, maxTurns:30, seed:'sp05-official-basic-cde906a2',
    });
    console.log('SP05_OFFICIAL_BASIC',JSON.stringify({SHA, ...summarize(result)}));
    expect(result.passive.effects.atkBonusApplications).toBe(0);
    expect(result.delta.winRate).toBe(0);
  });

  it('mede cenário oficial mixed no harness histórico sem ENE', () => {
    const result=simulateSpeciesPassiveScenarioPair(scenario('mixed'), {
      runs:20000, maxTurns:30, seed:'sp05-official-mixed-cde906a2',
    });
    console.log('SP05_OFFICIAL_MIXED_UNLIMITED_ENE',JSON.stringify({SHA, ...summarize(result)}));
    expect(result.passive.skillUses).toBeGreaterThan(0);
  });

  it('mede sensibilidade de ENE inicial zero e cheio, com oportunidade natural', () => {
    const zero=energyPair(20000,0,'sp05-energy-zero-cde906a2');
    const full=energyPair(20000,1,'sp05-energy-full-cde906a2');
    console.log('SP05_ENERGY_ZERO',JSON.stringify({SHA,...zero}));
    console.log('SP05_ENERGY_FULL',JSON.stringify({SHA,...full}));
    expect(zero.eligibleTurns).toBeGreaterThan(0);
    expect(full.opportunityTurns).toBeGreaterThan(0);
    expect(zero.appliedBonuses).toBeLessThanOrEqual(zero.skillsAbove70);
    expect(full.appliedBonuses).toBeLessThanOrEqual(full.skillsAbove70);
  });

  it('rastreia sensibilidade natural de adversários nível 10 sem usar estágios impossíveis', () => {
    const opponents=catalog.filter(mon=>mon.id!==PLAYER.id && naturalAtLevel(mon,10) && mon.rarity==='Comum');
    const rows=opponents.map(enemy=>{
      const r=simulateSpeciesPassiveScenarioPair(scenario('mixed',enemy,'scan-'+enemy.id),{
        runs:600,maxTurns:30,seed:'sp05-scan-'+enemy.id,
      });
      return {id:enemy.id,name:enemy.name,className:enemy.class,
        baseWinRate:r.base.winRate, passiveWinRate:r.passive.winRate,
        deltaWinRate:r.delta.winRate, damageDelta:r.delta.damageDealt.mean};
    }).sort((a,b)=>Math.abs(a.baseWinRate-.5)-Math.abs(b.baseWinRate-.5));
    console.log('SP05_CANDIDATE_SCAN',JSON.stringify({SHA,top:rows.slice(0,10)}));
    expect(rows.length).toBeGreaterThan(0);
    const chosen=rows.find(row=>row.baseWinRate>.05 && row.baseWinRate<.95);
    if (!chosen) {console.log('SP05_SENSITIVITY_GAP',JSON.stringify({reason:'no non-saturated common natural level10 candidate'}));return;}
    const enemy=catalog.find(mon=>mon.id===chosen.id);
    const r=simulateSpeciesPassiveScenarioPair(scenario('mixed',enemy,'sensitivity-'+chosen.id),{
      runs:20000,maxTurns:30,seed:'sp05-sensitivity-'+chosen.id+'-cde906a2',
    });
    console.log('SP05_SENSITIVITY_MIXED_UNLIMITED_ENE',JSON.stringify({SHA,opponent:chosen.id,...summarize(r)}));
  });
});
