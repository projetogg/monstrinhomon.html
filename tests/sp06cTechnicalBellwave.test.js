import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import {
  simulateSpeciesPassiveScenarioPair,
} from '../js/combat/speciesPassiveQuantitativeHarness.js';
import {
  buildClassAdvantages,
  DEFAULT_BASIC_POWER,
  selectTierOneDamageSkills,
} from '../js/combat/combatSimulationHarness.js';

const ROOT = resolve(import.meta.dirname, '..');
const monstersJson = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
const skillsJson = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8'));
const matchupsJson = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

const monsters = monstersJson.monsters;
const skills = selectTierOneDamageSkills(skillsJson);
const classAdvantages = buildClassAdvantages(matchupsJson);

const RAINHA = monsters.find(mon => mon.id === 'MON_027C');
const SOMBRIFUR = monsters.find(mon => mon.id === 'MON_030C');

function scenario(profile = 'mixed', enemyTemplate = SOMBRIFUR, label = 'official') {
  return {
    id: `sp06c-bellwave-${label}-${profile}`,
    speciesId: 'bellwave',
    className: 'Bardo',
    level: 30,
    profile,
    playerTemplate: RAINHA,
    enemyTemplate,
    classAdvantages,
    basicPower: DEFAULT_BASIC_POWER.Bardo ?? 7,
    skillPower: Number(skills.Bardo?.power) || 12,
  };
}

function minNaturalLevel(monster) {
  const predecessor = monsters.find(mon => mon.evolvesTo === monster.id);
  return predecessor ? Number(predecessor.evolvesAt) || 1 : 1;
}

function validAtLevel(monster, level) {
  if (!monster || monster.deprecated || monster.id === 'MON_100') return false;
  const minLevel = minNaturalLevel(monster);
  const maxExclusive = Number(monster.evolvesAt) || Number.POSITIVE_INFINITY;
  return minLevel <= level && level < maxExclusive;
}

function modelCadence(pattern, cycles = 100) {
  let charged = false;
  let skillUses = 0;
  let freshCharges = 0;
  let refreshes = 0;
  let basicsWithCharge = 0;

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    for (const action of pattern) {
      if (action === 'skill') {
        skillUses += 1;
        if (charged) refreshes += 1;
        else freshCharges += 1;
        charged = true;
      } else if (action === 'basic' && charged) {
        basicsWithCharge += 1;
        charged = false;
      }
    }
  }

  return {
    skillUses,
    freshCharges,
    refreshes,
    basicsWithCharge,
    consumptionPerSkill: skillUses > 0 ? basicsWithCharge / skillUses : 0,
    chargedAtEnd: charged,
  };
}

describe('SP-06C técnico — bellwave', () => {
  it('contrato puro: carga só beneficia ataque básico', () => {
    const mon = { canonSpeciesId: 'bellwave' };

    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isOffensiveSkill: false,
      hasBellwaveRhythmCharge: false,
    })).toBeNull();

    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isOffensiveSkill: true,
      hasBellwaveRhythmCharge: true,
    })).toBeNull();

    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isOffensiveSkill: false,
      hasBellwaveRhythmCharge: true,
    })).toEqual({ atkBonus: 1 });
  });

  it('caracteriza o estado binário: skills consecutivas renovam, não acumulam', () => {
    const alternating = modelCadence(['skill', 'basic'], 100);
    const skillHeavy = modelCadence(['skill', 'skill', 'basic'], 100);

    console.log('SP06C_BELLWAVE_CADENCE_MODEL', JSON.stringify({
      verifiedAgainst: 'f4495f8e489633b36634ae58a0a5fcd17bbb9257',
      alternating,
      skillHeavy,
    }));

    expect(alternating.refreshes).toBe(0);
    expect(alternating.consumptionPerSkill).toBe(1);
    expect(skillHeavy.refreshes).toBe(100);
    expect(skillHeavy.consumptionPerSkill).toBe(0.5);
  });

  it('mede o cenário oficial Rainhassommon Nv30 × Sombrifur Nv30', () => {
    const result = simulateSpeciesPassiveScenarioPair(scenario('mixed'), {
      runs: 20000,
      maxTurns: 30,
      seed: 'sp06c-bellwave-official-f4495f8e',
    });

    console.log('SP06C_BELLWAVE_OFFICIAL', JSON.stringify({
      verifiedAgainst: 'f4495f8e489633b36634ae58a0a5fcd17bbb9257',
      player: { id: RAINHA.id, name: RAINHA.name, level: 30 },
      enemy: { id: SOMBRIFUR.id, name: SOMBRIFUR.name, level: 30 },
      skillReference: skills.Bardo,
      result: {
        runs: result.runs,
        baseWinRate: result.base.winRate,
        passiveWinRate: result.passive.winRate,
        deltaWinRate: result.delta.winRate,
        baseTurns: result.base.turns,
        passiveTurns: result.passive.turns,
        deltaTurns: result.delta.turns,
        deltaDamageDealt: result.delta.damageDealt,
        deltaPlayerHpFinal: result.delta.playerHpFinal,
        baseSkillUses: result.base.skillUses,
        passiveSkillUses: result.passive.skillUses,
        baseBasicUses: result.base.basicUses,
        passiveBasicUses: result.passive.basicUses,
        passiveEffects: result.passive.effects,
      },
    }));

    expect(result.passive.effects.chargesCreated).toBeGreaterThan(0);
    expect(result.passive.effects.chargesConsumed).toBeGreaterThan(0);
    expect(result.passive.effects.chargesConsumed)
      .toBeLessThanOrEqual(result.passive.effects.chargesCreated);
  });

  it('perfil apenas básico não cria carga nem ativa bellwave', () => {
    const result = simulateSpeciesPassiveScenarioPair(scenario('basic'), {
      runs: 5000,
      maxTurns: 30,
      seed: 'sp06c-bellwave-basic-f4495f8e',
    });

    console.log('SP06C_BELLWAVE_BASIC_CONTROL', JSON.stringify({
      verifiedAgainst: 'f4495f8e489633b36634ae58a0a5fcd17bbb9257',
      result: {
        runs: result.runs,
        deltaWinRate: result.delta.winRate,
        deltaDamageDealt: result.delta.damageDealt,
        passiveEffects: result.passive.effects,
      },
    }));

    expect(result.passive.effects.chargesCreated).toBe(0);
    expect(result.passive.effects.chargesConsumed).toBe(0);
    expect(result.passive.effects.atkBonusApplications).toBe(0);
    expect(result.delta.winRate).toBe(0);
  });

  it('mapeia candidatos naturais Nv30 neutros para cenário de sensibilidade', () => {
    const candidates = monsters
      .filter(mon => mon.id !== RAINHA.id)
      .filter(mon => mon.rarity !== 'Lendário')
      .filter(mon => validAtLevel(mon, 30))
      .filter(mon => !['Curandeiro', 'Animalista'].includes(mon.class));

    const rows = candidates.map(enemyTemplate => {
      const result = simulateSpeciesPassiveScenarioPair(
        scenario('mixed', enemyTemplate, `candidate-${enemyTemplate.id}`),
        {
          runs: 1000,
          maxTurns: 30,
          seed: `sp06c-bellwave-candidate-${enemyTemplate.id}-f4495f8e`,
        },
      );
      return {
        id: enemyTemplate.id,
        name: enemyTemplate.name,
        className: enemyTemplate.class,
        rarity: enemyTemplate.rarity,
        minNaturalLevel: minNaturalLevel(enemyTemplate),
        evolvesAt: enemyTemplate.evolvesAt ?? null,
        baseWinRate: result.base.winRate,
        passiveWinRate: result.passive.winRate,
        deltaWinRate: result.delta.winRate,
        deltaDamageMean: result.delta.damageDealt.mean,
      };
    }).sort((a, b) => Math.abs(a.baseWinRate - 0.5) - Math.abs(b.baseWinRate - 0.5));

    console.log('SP06C_BELLWAVE_CANDIDATE_SCAN', JSON.stringify({
      verifiedAgainst: 'f4495f8e489633b36634ae58a0a5fcd17bbb9257',
      top: rows.slice(0, 12),
    }));

    expect(rows.length).toBeGreaterThan(0);
  });
});
