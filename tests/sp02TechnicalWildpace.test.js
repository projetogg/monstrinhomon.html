import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_BASIC_POWER,
  buildClassAdvantages,
} from '../js/combat/combatSimulationHarness.js';
import { simulateSpeciesPassiveScenarioPair } from '../js/combat/speciesPassiveQuantitativeHarness.js';

const ROOT = resolve(import.meta.dirname, '..');
const monstersJson = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
const skillsJson = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8'));
const matchupsJson = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

const monsters = monstersJson.monsters;
const skills = skillsJson.skills;
const playerTemplate = monsters.find(mon => mon.id === 'MON_023');
const enemyTemplate = monsters.find(mon => mon.id === 'MON_031');
const classAdvantages = buildClassAdvantages(matchupsJson);
const animalistDamageSkill = skills.find(skill =>
  skill.class === 'Animalista'
  && skill.type === 'DAMAGE'
  && Number(skill.stageIndex) === 0
);

function scenario(profile, enemyLevel = 10) {
  return {
    id: `sp02-natural-${profile}-enemyL${enemyLevel}`,
    speciesId: 'wildpace',
    className: 'Animalista',
    level: 10,
    enemyLevel,
    profile,
    playerTemplate,
    enemyTemplate,
    classAdvantages,
    initialHpRatio: 1,
    basicPower: DEFAULT_BASIC_POWER.Animalista,
    enemyBasicPower: DEFAULT_BASIC_POWER.Curandeiro,
    skillPower: Number(animalistDamageSkill?.power) || DEFAULT_BASIC_POWER.Animalista,
  };
}

function compact(result) {
  return {
    profile: result.profile,
    enemyLevel: result.id.match(/enemyL(\d+)/)?.[1] ?? null,
    runs: result.runs,
    baseWinRate: result.base.winRate,
    passiveWinRate: result.passive.winRate,
    deltaWinRate: result.delta.winRate,
    lossToWinRate: result.delta.win.positiveRate,
    baseTurnsMean: result.base.turns.mean,
    passiveTurnsMean: result.passive.turns.mean,
    deltaTurnsMean: result.delta.turns.mean,
    baseThresholdCrossingRate: result.base.observations.thresholdCrossingRate,
    passiveThresholdCrossingRate: result.passive.observations.thresholdCrossingRate,
    postThresholdAttackOpportunityRate: result.passive.observations.postThresholdAttackOpportunityRate,
    firstThresholdTurnMean: result.passive.observations.firstThresholdTurn.mean,
    activationRate: result.passive.combatsWithActivationRate,
    atkBonusApplicationsPerCombat: result.passive.effects.atkBonusApplications / result.runs,
    meanDamageDelta: result.delta.damageDealt.mean,
    meanPlayerHpFinalDelta: result.delta.playerHpFinal.mean,
  };
}

describe('SP-02 técnico — wildpace a partir de HP cheio', () => {
  it('mede o cenário oficial Cervimon Nv10 × Vitalex Nv10 com HP cheio', () => {
    const runs = 20000;
    const seed = 'sp02-natural-fullhp-main-590660';

    const basic = simulateSpeciesPassiveScenarioPair(
      scenario('basic', 10),
      { runs, seed, maxTurns: 30 },
    );
    const mixed = simulateSpeciesPassiveScenarioPair(
      scenario('mixed', 10),
      { runs, seed, maxTurns: 30 },
    );

    console.log('SP02_NATURAL_OFFICIAL', JSON.stringify({
      verifiedAgainst: '590660187266215251ed9b71ba36012efa07991f',
      player: 'MON_023',
      enemy: 'MON_031',
      playerLevel: 10,
      enemyLevel: 10,
      initialHpRatio: 1,
      basic: compact(basic),
      mixed: compact(mixed),
    }));

    expect(basic.base.observations.startedAtFullHpRate).toBe(1);
    expect(basic.passive.observations.startedAtFullHpRate).toBe(1);
    expect(mixed.base.observations.startedAtFullHpRate).toBe(1);
    expect(mixed.passive.observations.startedAtFullHpRate).toBe(1);
    expect(basic.base.observations.startedBelowThresholdRate).toBe(0);
    expect(mixed.base.observations.startedBelowThresholdRate).toBe(0);
  });

  it('mede sensibilidade natural do limiar em dificuldades próximas', () => {
    const runs = 5000;
    const seed = 'sp02-natural-sensitivity-590660';
    const rows = [];

    for (const enemyLevel of [9, 10, 11, 12, 13]) {
      for (const profile of ['basic', 'mixed']) {
        const result = simulateSpeciesPassiveScenarioPair(
          scenario(profile, enemyLevel),
          { runs, seed, maxTurns: 30 },
        );
        rows.push(compact(result));
      }
    }

    console.log('SP02_NATURAL_SENSITIVITY', JSON.stringify({
      verifiedAgainst: '590660187266215251ed9b71ba36012efa07991f',
      runsPerPair: runs,
      rows,
    }));

    expect(rows.every(row => Number.isFinite(row.baseThresholdCrossingRate))).toBe(true);
    expect(rows.every(row => Number.isFinite(row.postThresholdAttackOpportunityRate))).toBe(true);
  });
});
