import { describe, it, expect } from 'vitest';
import {
  aggregateBaseline,
  compareBaselines,
  renderMarkdown,
} from '../scripts/compare-combat-baselines-v2-2.mjs';

function makeSummary(overrides = {}) {
  return {
    runs: 1000,
    winRate: 0.6,
    drawRate: 0,
    ttk: {
      mean: 4,
      median: 4,
      p10: 3,
      p25: 3,
      p75: 5,
      p90: 6,
      oneOrTwoTurnRate: 0.1,
      overLimitRate: 0,
    },
    playerHpFinalMean: 20,
    damage: {
      meanPerDamagingAction: 10,
      min: 1,
      max: 20,
    },
    confrontation: {
      falha_total: 10,
      contato_neutralizado: 20,
      acerto_reduzido: 30,
      acerto_normal: 25,
      acerto_forte: 15,
      natural1Rate: 0.05,
      natural20Rate: 0.05,
    },
    actions: {
      attacks: 100,
      basicUses: 80,
      skillUses: 20,
      skillUseRate: 0.2,
      eneSpent: 50,
      eneRegenerated: 100,
    },
    ...overrides,
  };
}

function makeBaseline({
  sha = 'before',
  generatedAt = '2026-07-27T00:00:00.000Z',
  seed = 'fixed-seed',
  winRate = 0.6,
} = {}) {
  return {
    schemaVersion: 1,
    generatedAt,
    baselineSha: sha,
    seed,
    runsPerScenario: 1000,
    sources: {
      formula: 'js/combat/groupCombatFormula.js',
      monsters: 'data/monsters.json',
      skills: 'data/skills.json',
      classMatchups: 'design/canon/class_matchups.json',
    },
    conclusion: 'C. Evidência ainda insuficiente para decidir',
    limitations: [
      'Sem passivas de espécie, cura, itens, alvo de IA ou equivalência completa Wild/Group.',
    ],
    results: [{
      id: 'scenario-1',
      label: 'Scenario 1',
      level: 1,
      playerClass: 'Guerreiro',
      enemyClass: 'Bárbaro',
      playerActionProfile: 'mixed',
      enemyActionProfile: 'mixed',
      passivesEnabled: true,
      summary: makeSummary({ winRate }),
    }],
  };
}

describe('comparação de baselines do combate v2.2', () => {
  it('ignora apenas SHA e data ao classificar resultados idênticos', () => {
    const before = makeBaseline();
    const after = makeBaseline({
      sha: 'after',
      generatedAt: '2026-07-29T00:00:00.000Z',
    });

    const comparison = compareBaselines(before, after);

    expect(comparison.comparable).toBe(true);
    expect(comparison.classification).toBe('NO_QUANTITATIVE_DELTA_IN_CURRENT_HARNESS');
    expect(comparison.scenarioComparison.changedCount).toBe(0);
    expect(comparison.scenarioComparison.unchangedCount).toBe(1);
    expect(comparison.metadataDifferences).toHaveLength(2);
    expect(comparison.aggregate.delta.scenarioMeanWinRate).toBe(0);
  });

  it('detecta alteração quantitativa em um cenário comparável', () => {
    const before = makeBaseline({ winRate: 0.6 });
    const after = makeBaseline({ sha: 'after', winRate: 0.7 });

    const comparison = compareBaselines(before, after);

    expect(comparison.comparable).toBe(true);
    expect(comparison.classification).toBe('QUANTITATIVE_DELTA_DETECTED');
    expect(comparison.scenarioComparison.changedCount).toBe(1);
    expect(comparison.aggregate.delta.scenarioMeanWinRate).toBe(0.1);
  });

  it('mantém comparabilidade quando muda apenas a conclusão descritiva', () => {
    const before = makeBaseline();
    const after = {
      ...makeBaseline({ sha: 'after' }),
      conclusion: 'B. Nova leitura descritiva',
    };

    const comparison = compareBaselines(before, after);

    expect(comparison.comparable).toBe(true);
    expect(comparison.classification).toBe('NO_QUANTITATIVE_DELTA_IN_CURRENT_HARNESS');
    expect(comparison.metadataDifferences.some(
      difference => difference.path === '/conclusion',
    )).toBe(true);
  });

  it('ignora alteração apenas no rótulo visual do cenário', () => {
    const before = makeBaseline();
    const after = makeBaseline({ sha: 'after' });
    after.results[0].label = 'Cenário traduzido';

    const comparison = compareBaselines(before, after);

    expect(comparison.comparable).toBe(true);
    expect(comparison.classification).toBe('NO_QUANTITATIVE_DELTA_IN_CURRENT_HARNESS');
    expect(comparison.scenarioComparison.changedCount).toBe(0);
    expect(comparison.scenarioComparison.scenarioMetadataDifferences).toEqual([{
      id: 'scenario-1',
      path: '/results/scenario-1/label',
      before: 'Scenario 1',
      after: 'Cenário traduzido',
    }]);
  });

  it('não compara baselines com seeds diferentes', () => {
    const before = makeBaseline({ seed: 'seed-a' });
    const after = makeBaseline({ sha: 'after', seed: 'seed-b' });

    const comparison = compareBaselines(before, after);

    expect(comparison.comparable).toBe(false);
    expect(comparison.classification).toBe('NOT_COMPARABLE');
    expect(comparison.structuralDifferences.some(
      difference => difference.path === '/seed',
    )).toBe(true);
  });

  it('agrega ações, categorias e taxas ponderadas', () => {
    const aggregate = aggregateBaseline(makeBaseline());

    expect(aggregate.scenarioCount).toBe(1);
    expect(aggregate.totalRuns).toBe(1000);
    expect(aggregate.totalAttacks).toBe(100);
    expect(aggregate.totalBasicUses).toBe(80);
    expect(aggregate.totalSkillUses).toBe(20);
    expect(aggregate.weightedSkillUseRate).toBe(0.2);
    expect(aggregate.rcShares.acerto_reduzido).toBe(0.3);
  });

  it('renderiza relatório Markdown com classificação e cobertura', () => {
    const comparison = compareBaselines(
      makeBaseline(),
      makeBaseline({ sha: 'after' }),
    );
    const markdown = renderMarkdown(comparison);

    expect(markdown).toContain('NO_QUANTITATIVE_DELTA_IN_CURRENT_HARNESS');
    expect(markdown).toContain('Passivas de espécie incluídas: não');
    expect(markdown).toContain('| Cenários | 1 | 1 | 0 |');
  });
});
