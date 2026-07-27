import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applyEneRegen,
  buildBaselineScenarios,
  buildClassAdvantages,
  createSeededRng,
  renderMarkdownReport,
  runScenarioMatrix,
  scaleMonsterTemplate,
  selectBaseTemplates,
  selectTierOneDamageSkills,
  simulateScenario,
} from '../js/combat/combatSimulationHarness.js';

const ROOT = resolve(import.meta.dirname, '..');
const monstersJson = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
const skillsJson = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8'));
const matchupsJson = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

describe('Combat Simulation Harness v2.2', () => {
  it('produz a mesma sequência para a mesma seed', () => {
    const first = createSeededRng('seed-fixa');
    const second = createSeededRng('seed-fixa');
    expect(Array.from({ length: 20 }, () => first())).toEqual(
      Array.from({ length: 20 }, () => second()),
    );
  });

  it('converte a tabela canônica de matchups sem inferir nomes', () => {
    const advantages = buildClassAdvantages(matchupsJson);
    expect(advantages.Guerreiro).toEqual({ strong: 'Ladino', weak: 'Mago' });
    expect(advantages.Animalista).toEqual({ strong: 'Bardo', weak: 'Bárbaro' });
  });

  it('lê os templates comuns e as skills ofensivas diretamente dos dados atuais', () => {
    const templates = selectBaseTemplates(monstersJson);
    const skills = selectTierOneDamageSkills(skillsJson);
    expect(Object.keys(templates).sort()).toEqual([
      'Animalista', 'Bardo', 'Bárbaro', 'Caçador',
      'Curandeiro', 'Guerreiro', 'Ladino', 'Mago',
    ].sort());
    expect(skills.Guerreiro.id).toBe('GOLPE_DE_ESPADA_0');
    expect(skills.Guerreiro.power).toBe(14);
    expect(skills.Curandeiro).toBeUndefined();
  });

  it('escala um template sem modificar o objeto de origem', () => {
    const template = selectBaseTemplates(monstersJson).Guerreiro;
    const snapshot = structuredClone(template);
    const level10 = scaleMonsterTemplate(template, 10);
    expect(level10.level).toBe(10);
    expect(level10.hpMax).toBeGreaterThan(template.baseHp);
    expect(level10.atk).toBeGreaterThan(template.baseAtk);
    expect(template).toEqual(snapshot);
  });

  it('limita a regeneração à capacidade restante da barra de ENE', () => {
    expect(applyEneRegen(0, 4, 2)).toEqual({ energy: 2, gained: 2 });
    expect(applyEneRegen(3, 4, 2)).toEqual({ energy: 4, gained: 1 });
    expect(applyEneRegen(4, 4, 2)).toEqual({ energy: 4, gained: 0 });
  });

  it('constrói a matriz mínima em níveis 1, 5, 10, 15 e 30', () => {
    const scenarios = buildBaselineScenarios({ monstersJson, skillsJson, matchupsJson });
    expect(scenarios.length).toBe(90);
    expect(new Set(scenarios.map(row => row.level ?? row.player.level))).toEqual(new Set([1, 5, 10, 15, 30]));
    expect(scenarios.some(row => row.playerActionProfile === 'basic')).toBe(true);
    expect(scenarios.some(row => row.playerActionProfile === 'mixed')).toBe(true);
  });

  it('repete exatamente o resultado para cenário e seed idênticos', () => {
    const scenario = buildBaselineScenarios({
      monstersJson,
      skillsJson,
      matchupsJson,
      levels: [1],
    })[0];
    const first = simulateScenario(scenario, { runs: 50, seed: 'reproducivel' });
    const second = simulateScenario(scenario, { runs: 50, seed: 'reproducivel' });
    expect(second).toEqual(first);
  });

  it('não contabiliza ENE nominal acima do máximo em perfil básico', () => {
    const scenario = buildBaselineScenarios({
      monstersJson,
      skillsJson,
      matchupsJson,
      levels: [1],
    }).find(row => row.playerActionProfile === 'basic');
    const runs = 20;
    const result = simulateScenario(scenario, { runs, seed: 'ene-cap' });
    const maximumPossibleGain = runs * (scenario.player.eneMax + scenario.enemy.eneMax);
    expect(result.summary.actions.eneRegenerated).toBeLessThanOrEqual(maximumPossibleGain);
  });

  it('produz métricas válidas e contagens de confronto coerentes', () => {
    const scenario = buildBaselineScenarios({
      monstersJson,
      skillsJson,
      matchupsJson,
      levels: [1],
    })[1];
    const result = simulateScenario(scenario, { runs: 60, seed: 'metricas' });
    const summary = result.summary;
    expect(summary.winRate).toBeGreaterThanOrEqual(0);
    expect(summary.winRate).toBeLessThanOrEqual(1);
    expect(summary.ttk.mean).toBeGreaterThan(0);
    expect(summary.ttk.p90).toBeGreaterThanOrEqual(summary.ttk.median);
    expect(summary.damage.min).toBeGreaterThanOrEqual(0);
    const categorized = Object.values(summary.confrontation)
      .slice(0, 5)
      .reduce((sum, value) => sum + value, 0);
    expect(categorized).toBe(summary.actions.attacks);
  });

  it('executa matriz curta com seeds derivadas por cenário', () => {
    const scenarios = buildBaselineScenarios({
      monstersJson,
      skillsJson,
      matchupsJson,
      levels: [1],
    }).slice(0, 4);
    const first = runScenarioMatrix(scenarios, { runs: 20, seed: 'matrix' });
    const second = runScenarioMatrix(scenarios, { runs: 20, seed: 'matrix' });
    expect(second).toEqual(first);
    expect(first).toHaveLength(4);
  });

  it('relatório não declara o núcleo pronto antes do playtest', () => {
    const scenarios = buildBaselineScenarios({
      monstersJson,
      skillsJson,
      matchupsJson,
      levels: [1],
    }).slice(0, 2);
    const results = runScenarioMatrix(scenarios, { runs: 10, seed: 'report' });
    const markdown = renderMarkdownReport({
      baselineSha: 'abc123',
      seed: 'report',
      runs: 10,
      results,
    });
    expect(markdown).toContain('C. Evidência ainda insuficiente para decidir');
    expect(markdown).not.toContain('A. Núcleo pronto para calibração');
    expect(markdown).toContain('abc123');
  });

  it('mantém um único entrypoint oficial para a baseline v2.2', () => {
    const packageJson = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
    const workflow = readFileSync(resolve(ROOT, '.github/workflows/combat-v2-2-baseline.yml'), 'utf8');
    const officialCli = readFileSync(resolve(ROOT, 'scripts/simulate-combat-v2-2.mjs'), 'utf8');

    expect(packageJson.scripts['simulate:combat-v2-2']).toBe('node scripts/simulate-combat-v2-2.mjs');
    expect(packageJson.scripts['test:combat-simulation-v2-2']).toBe('vitest run tests/combatSimulationHarnessV22.test.js');
    expect(officialCli).toContain("../js/combat/combatSimulationHarness.js");
    expect(workflow).toContain('scripts/simulate-combat-v2-2.mjs');
    expect(workflow).toContain('js/combat/combatSimulationHarness.js');
    expect(workflow).not.toContain('scripts/combat-v2-2/');

    expect(existsSync(resolve(ROOT, 'scripts/simulate-combat-v2-2.mjs'))).toBe(true);
    expect(existsSync(resolve(ROOT, 'scripts/combat-v2-2/simulator.mjs'))).toBe(false);
    expect(existsSync(resolve(ROOT, 'scripts/combat-v2-2/run-baseline.mjs'))).toBe(false);
  });
});
