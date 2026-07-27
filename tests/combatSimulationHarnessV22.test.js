import { describe, expect, it } from 'vitest';

import {
  buildDefaultScenarios,
  createSeededRng,
  getClassModifiers,
  loadSimulationData,
  renderBaselineMarkdown,
  runBaseline,
  runScenario,
  scaleCatalogMonster,
  selectClassRepresentatives,
  selectOffensiveSkill,
} from '../scripts/combat-v2-2/simulator.mjs';
import { parseArgs } from '../scripts/combat-v2-2/run-baseline.mjs';

describe('Harness de simulação do combate v2.2', () => {
  it('usa RNG determinística e reproduz a mesma sequência', () => {
    const first = createSeededRng(2202);
    const second = createSeededRng(2202);

    const firstSequence = Array.from({ length: 20 }, () => first());
    const secondSequence = Array.from({ length: 20 }, () => second());

    expect(firstSequence).toEqual(secondSequence);
    expect(new Set(firstSequence).size).toBeGreaterThan(1);
  });

  it('carrega as três fontes reais e encontra representante Comum para as oito classes', () => {
    const data = loadSimulationData();
    const representatives = selectClassRepresentatives(data.monsters);

    expect(Object.keys(representatives).sort()).toEqual([
      'Animalista',
      'Bardo',
      'Bárbaro',
      'Caçador',
      'Curandeiro',
      'Guerreiro',
      'Ladino',
      'Mago',
    ].sort());
    expect(data.skills.length).toBeGreaterThan(0);
    expect(data.matchups.Guerreiro).toEqual({ strong: 'Ladino', weak: 'Mago' });
  });

  it('seleciona skill ofensiva canônica sem duplicar catálogo no harness', () => {
    const data = loadSimulationData();
    const skill = selectOffensiveSkill(data.skills, 'Guerreiro', 0);

    expect(skill).toMatchObject({
      id: 'GOLPE_DE_ESPADA_0',
      class: 'Guerreiro',
      type: 'DAMAGE',
      stageIndex: 0,
      power: 14,
      energy_cost: 4,
    });
  });

  it('escala um template sem modificar o objeto do catálogo', () => {
    const data = loadSimulationData();
    const template = data.monsters.find((monster) => monster.id === 'MON_001');
    const snapshot = structuredClone(template);
    const scaled = scaleCatalogMonster(template, 10);

    expect(template).toEqual(snapshot);
    expect(scaled.level).toBe(10);
    expect(scaled.hpMax).toBeGreaterThan(template.baseHp);
    expect(scaled.atk).toBeGreaterThan(template.baseAtk);
  });

  it('aplica vantagem, desvantagem e neutralidade a partir de class_matchups.json', () => {
    const data = loadSimulationData();

    expect(getClassModifiers('Guerreiro', 'Ladino', data.matchups)).toMatchObject({
      classModAtk: 2,
      damageMult: 1.1,
      relation: 'advantage',
    });
    expect(getClassModifiers('Guerreiro', 'Mago', data.matchups)).toMatchObject({
      classModAtk: -2,
      damageMult: 0.9,
      relation: 'disadvantage',
    });
    expect(getClassModifiers('Guerreiro', 'Bardo', data.matchups)).toMatchObject({
      classModAtk: 0,
      damageMult: 1,
      relation: 'neutral',
    });
  });

  it('produz métricas idênticas para o mesmo cenário e seed', () => {
    const data = loadSimulationData();
    const representatives = selectClassRepresentatives(data.monsters);
    const scenario = {
      id: 'deterministic_test',
      label: 'Teste determinístico',
      playerClass: 'Guerreiro',
      enemyClass: 'Mago',
      level: 5,
      playerAction: 'basic',
      enemyAction: 'basic',
      passivesEnabled: true,
    };

    const input = {
      scenario,
      representatives,
      skills: data.skills,
      matchups: data.matchups,
      iterations: 30,
      seed: 9876,
    };

    const first = runScenario(input);
    const second = runScenario(input);

    expect(first.metrics).toEqual(second.metrics);
    expect(first.metrics.iterations).toBe(30);
    expect(first.metrics.turns.mean).toBeGreaterThan(0);
    expect(first.metrics.winRate).toBeGreaterThanOrEqual(0);
    expect(first.metrics.winRate).toBeLessThanOrEqual(1);
  });

  it('mantém comparações de passiva e boss como cenários isolados', () => {
    const scenarios = buildDefaultScenarios({ levels: [1] });
    const ids = scenarios.map((scenario) => scenario.id);

    expect(ids).toContain('Guerreiro_vs_Ladino_lv10_passives_on');
    expect(ids).toContain('Guerreiro_vs_Ladino_lv10_passives_off');
    expect(ids).toContain('Guerreiro_vs_Mago_lv10_common');
    expect(ids).toContain('Guerreiro_vs_Mago_lv10_boss_proxy');
  });

  it('gera baseline reduzida e não transforma resultado numérico em aprovação automática', () => {
    const scenarios = [{
      id: 'baseline_test',
      label: 'Baseline reduzida',
      playerClass: 'Guerreiro',
      enemyClass: 'Ladino',
      level: 1,
      playerAction: 'basic',
      enemyAction: 'basic',
      passivesEnabled: true,
    }];
    const report = runBaseline({ iterations: 10, seed: 2202, scenarios, levels: [1] });
    const markdown = renderBaselineMarkdown(report);

    expect(report.metadata.classification).toBe('C. Evidência ainda insuficiente para decidir');
    expect(report.results).toHaveLength(1);
    expect(markdown).toContain('# Baseline Quantitativa — Combate v2.2');
    expect(markdown).toContain('não aprova mudanças de balanceamento');
  });

  it('valida argumentos da CLI', () => {
    expect(parseArgs([
      '--iterations', '50',
      '--seed', '123',
      '--levels', '1,5,10',
      '--json', 'artifacts/result.json',
    ])).toMatchObject({
      iterations: 50,
      seed: 123,
      levels: [1, 5, 10],
    });

    expect(() => parseArgs(['--iterations', '0'])).toThrow(/inteiro positivo/);
    expect(() => parseArgs(['--unknown'])).toThrow(/Argumento desconhecido/);
  });
});
