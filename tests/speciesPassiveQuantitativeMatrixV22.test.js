import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  SPECIES_QUANTITATIVE_IDS,
  aggregateSpeciesPassiveQuantitativeResults,
  buildSpeciesPassiveQuantitativeScenarios,
  renderSpeciesPassiveQuantitativeMarkdown,
  runSpeciesPassiveQuantitativeMatrix,
  simulateSpeciesPassiveScenarioPair,
} from '../js/combat/speciesPassiveQuantitativeHarness.js';

const ROOT = resolve(import.meta.dirname, '..');
const monstersJson = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
const skillsJson = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8'));
const matchupsJson = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

function buildScenarios(options = {}) {
  return buildSpeciesPassiveQuantitativeScenarios({
    monstersJson,
    skillsJson,
    matchupsJson,
    ...options,
  });
}

describe('Matriz quantitativa das passivas de espécie v2.2', () => {
  it('constrói 48 pares para oito espécies, três níveis e dois perfis', () => {
    const scenarios = buildScenarios();
    expect(scenarios).toHaveLength(48);
    expect(new Set(scenarios.map(row => row.speciesId))).toEqual(new Set(SPECIES_QUANTITATIVE_IDS));
    expect(new Set(scenarios.map(row => row.level))).toEqual(new Set([1, 10, 30]));
    expect(new Set(scenarios.map(row => row.profile))).toEqual(new Set(['basic', 'mixed']));
  });

  it('repete exatamente um par com a mesma seed', () => {
    const scenario = buildScenarios({ levels: [1], profiles: ['mixed'] })
      .find(row => row.speciesId === 'emberfang');
    const first = simulateSpeciesPassiveScenarioPair(scenario, { runs: 40, seed: 'pair-seed' });
    const second = simulateSpeciesPassiveScenarioPair(scenario, { runs: 40, seed: 'pair-seed' });
    expect(second).toEqual(first);
  });

  it('mantém o perfil basic inerte para emberfang e ativo no mixed', () => {
    const rows = buildScenarios({ levels: [1] }).filter(row => row.speciesId === 'emberfang');
    const results = runSpeciesPassiveQuantitativeMatrix(rows, { runs: 80, seed: 'emberfang-profile' });
    const basic = results.find(row => row.profile === 'basic');
    const mixed = results.find(row => row.profile === 'mixed');
    expect(basic.passive.effects.atkBonusApplications).toBe(0);
    expect(mixed.passive.effects.atkBonusApplications).toBeGreaterThan(0);
  });

  it('mede mitigação positiva de shieldhorn', () => {
    const scenario = buildScenarios({ levels: [10], profiles: ['basic'] })
      .find(row => row.speciesId === 'shieldhorn');
    const result = simulateSpeciesPassiveScenarioPair(scenario, { runs: 100, seed: 'shieldhorn-matrix' });
    expect(result.passive.effects.damageReductionApplications).toBeGreaterThan(0);
    expect(result.passive.effects.damageReduced).toBeGreaterThan(0);
    expect(result.delta.damagePrevented.mean).toBeGreaterThanOrEqual(0);
  });

  it('mede cura adicional de floracura', () => {
    const scenario = buildScenarios({ levels: [1], profiles: ['basic'] })
      .find(row => row.speciesId === 'floracura');
    const result = simulateSpeciesPassiveScenarioPair(scenario, { runs: 30, seed: 'floracura-matrix' });
    expect(result.passive.effects.healBonusApplications).toBe(30);
    expect(result.passive.effects.healBonusTotal).toBe(90);
    expect(result.delta.healing.mean).toBeGreaterThan(0);
  });

  it('mede buff de moonquill e produção/consumo das cargas', () => {
    const rows = buildScenarios({ levels: [10], profiles: ['mixed'] });
    const results = runSpeciesPassiveQuantitativeMatrix(
      rows.filter(row => ['moonquill', 'shadowsting', 'bellwave'].includes(row.speciesId)),
      { runs: 60, seed: 'state-matrix' },
    );
    const moonquill = results.find(row => row.speciesId === 'moonquill');
    const shadowsting = results.find(row => row.speciesId === 'shadowsting');
    const bellwave = results.find(row => row.speciesId === 'bellwave');
    expect(moonquill.passive.effects.spdBuffApplications).toBeGreaterThan(0);
    expect(moonquill.passive.effects.spdBuffTurnsUsed).toBeGreaterThan(0);
    expect(shadowsting.passive.effects.chargesCreated).toBeGreaterThan(0);
    expect(shadowsting.passive.effects.chargesConsumed).toBeGreaterThan(0);
    expect(bellwave.passive.effects.chargesCreated).toBeGreaterThan(0);
    expect(bellwave.passive.effects.chargesConsumed).toBeGreaterThan(0);
  });

  it('ativa wildpace no HP inicial controlado abaixo de 40%', () => {
    const scenario = buildScenarios({ levels: [1], profiles: ['basic'] })
      .find(row => row.speciesId === 'wildpace');
    const result = simulateSpeciesPassiveScenarioPair(scenario, { runs: 40, seed: 'wildpace-matrix' });
    expect(result.passive.effects.atkBonusApplications).toBeGreaterThan(0);
    expect(result.passive.combatsWithActivationRate).toBe(1);
  });

  it('agrega as oito espécies e produz relatório sem autorizar balanceamento', () => {
    const scenarios = buildScenarios({ levels: [1], profiles: ['mixed'] });
    const results = runSpeciesPassiveQuantitativeMatrix(scenarios, { runs: 20, seed: 'aggregate-matrix' });
    const aggregate = aggregateSpeciesPassiveQuantitativeResults(results);
    const markdown = renderSpeciesPassiveQuantitativeMarkdown({
      baselineSha: 'abc123',
      seed: 'aggregate-matrix',
      runs: 20,
      results,
    });
    expect(Object.keys(aggregate).sort()).toEqual([...SPECIES_QUANTITATIVE_IDS].sort());
    expect(markdown).toContain('Matriz Quantitativa das Passivas de Espécie');
    expect(markdown).toContain('decisão de balanceamento ainda depende de análise e playtest');
    expect(markdown).toContain('abc123');
  });
});
