import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  simulateSpeciesPassiveScenarioPair,
} from '../js/combat/speciesPassiveQuantitativeHarness.js';
import {
  buildClassAdvantages,
  DEFAULT_BASIC_POWER,
} from '../js/combat/combatSimulationHarness.js';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';

const ROOT = resolve(import.meta.dirname, '..');
const monsters = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8')).monsters;
const matchups = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

const SHADOW = monsters.find(mon => mon.id === 'MON_022C');
const VITALION = monsters.find(mon => mon.id === 'MON_031B');
const VITALEGION = monsters.find(mon => mon.id === 'MON_031C');
const CLASS_ADVANTAGES = buildClassAdvantages(matchups);

function scenario(profile = 'mixed', enemyTemplate = VITALION, label = 'official') {
  return {
    id: `sp06b-shadowsting-${label}-${profile}`,
    speciesId: 'shadowsting',
    className: 'Ladino',
    level: 30,
    profile,
    playerTemplate: SHADOW,
    enemyTemplate,
    classAdvantages: CLASS_ADVANTAGES,
    basicPower: DEFAULT_BASIC_POWER.Ladino ?? 7,
    skillPower: 0,
  };
}

describe('SP-06B técnico — shadowsting', () => {
  it('contrato puro exige carga e apenas básico a consome', () => {
    const mon = { canonSpeciesId: 'shadowsting' };
    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isOffensiveSkill: false,
      hasShadowstingCharge: false,
    })).toBeNull();

    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isOffensiveSkill: true,
      hasShadowstingCharge: true,
    })).toBeNull();

    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isOffensiveSkill: false,
      hasShadowstingCharge: true,
    })).toEqual({ atkBonus: 1 });
  });

  it('mede o loop oficial debuff → básico em 20.000 pares', () => {
    const result = simulateSpeciesPassiveScenarioPair(scenario('mixed'), {
      runs: 20000,
      maxTurns: 30,
      seed: 'sp06b-shadowsting-official-d53db6b',
    });

    console.log('SP06B_SHADOWSTING_OFFICIAL', JSON.stringify({
      verifiedAgainst: 'd53db6bcda76e016ec1c9474bdebdba5717d990a',
      player: { id: SHADOW.id, name: SHADOW.name, level: 30 },
      enemy: { id: VITALION.id, name: VITALION.name, level: 30 },
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
        passiveEffects: result.passive.effects,
        baseDebuffUses: result.base.debuffUses,
        passiveDebuffUses: result.passive.debuffUses,
        baseBasicUses: result.base.basicUses,
        passiveBasicUses: result.passive.basicUses,
      },
    }));

    expect(result.passive.effects.chargesCreated).toBeGreaterThan(0);
    expect(result.passive.effects.chargesConsumed).toBeGreaterThan(0);
    expect(result.passive.effects.chargesConsumed)
      .toBeLessThanOrEqual(result.passive.effects.chargesCreated);
  });

  it('mede sensibilidade contra Vitalegion Nv30 para reduzir saturação', () => {
    const result = simulateSpeciesPassiveScenarioPair(
      scenario('mixed', VITALEGION, 'sensitivity-vitalegion'),
      {
        runs: 20000,
        maxTurns: 30,
        seed: 'sp06b-shadowsting-vitalegion-d53db6b',
      },
    );

    console.log('SP06B_SHADOWSTING_SENSITIVITY_VITALEGION', JSON.stringify({
      verifiedAgainst: 'd53db6bcda76e016ec1c9474bdebdba5717d990a',
      player: { id: SHADOW.id, name: SHADOW.name, level: 30 },
      enemy: { id: VITALEGION.id, name: VITALEGION.name, level: 30 },
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
        passiveEffects: result.passive.effects,
      },
    }));

    expect(result.passive.effects.chargesCreated).toBeGreaterThan(0);
    expect(result.passive.effects.chargesConsumed).toBeGreaterThan(0);
  });

  it('perfil só básico não cria carga nem ativa shadowsting', () => {
    const result = simulateSpeciesPassiveScenarioPair(scenario('basic'), {
      runs: 5000,
      maxTurns: 30,
      seed: 'sp06b-shadowsting-basic-d53db6b',
    });

    console.log('SP06B_SHADOWSTING_BASIC_CONTROL', JSON.stringify({
      verifiedAgainst: 'd53db6bcda76e016ec1c9474bdebdba5717d990a',
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
});
