#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const METADATA_FIELDS = new Set(['generatedAt', 'baselineSha', 'conclusion', 'limitations']);
const STRUCTURAL_FIELDS = new Set(['schemaVersion', 'seed', 'runsPerScenario']);
const RC_KEYS = [
  'falha_total',
  'contato_neutralizado',
  'acerto_reduzido',
  'acerto_normal',
  'acerto_forte',
];

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + (Number(value) || 0), 0) / values.length;
}

function deepDiff(before, after, path = '') {
  if (Object.is(before, after)) return [];
  if (typeof before !== typeof after || before === null || after === null) {
    return [{ path: path || '/', before, after }];
  }
  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after)) {
      return [{ path: path || '/', before, after }];
    }
    const differences = [];
    if (before.length !== after.length) {
      differences.push({ path: `${path || ''}/length`, before: before.length, after: after.length });
    }
    const length = Math.min(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      differences.push(...deepDiff(before[index], after[index], `${path}/${index}`));
    }
    return differences;
  }
  if (typeof before === 'object') {
    const differences = [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of [...keys].sort()) {
      if (!(key in before) || !(key in after)) {
        differences.push({ path: `${path}/${key}`, before: before[key], after: after[key] });
      } else {
        differences.push(...deepDiff(before[key], after[key], `${path}/${key}`));
      }
    }
    return differences;
  }
  return [{ path: path || '/', before, after }];
}

function indexResults(results = []) {
  const map = new Map();
  for (const result of results) {
    if (!result?.id) throw new Error('Cada cenário precisa de um id.');
    if (map.has(result.id)) throw new Error(`Cenário duplicado: ${result.id}`);
    map.set(result.id, result);
  }
  return map;
}

export function aggregateBaseline(payload) {
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const summaries = results.map(result => result.summary || {});
  const totalAttacks = summaries.reduce((sum, summary) => sum + (Number(summary.actions?.attacks) || 0), 0);
  const totalBasicUses = summaries.reduce((sum, summary) => sum + (Number(summary.actions?.basicUses) || 0), 0);
  const totalSkillUses = summaries.reduce((sum, summary) => sum + (Number(summary.actions?.skillUses) || 0), 0);
  const totalActions = totalBasicUses + totalSkillUses;

  const rcCounts = Object.fromEntries(RC_KEYS.map(key => [
    key,
    summaries.reduce((sum, summary) => sum + (Number(summary.confrontation?.[key]) || 0), 0),
  ]));
  const rcShares = Object.fromEntries(RC_KEYS.map(key => [
    key,
    totalAttacks > 0 ? round(rcCounts[key] / totalAttacks) : 0,
  ]));

  const weightedRate = key => {
    if (totalAttacks === 0) return 0;
    const numerator = summaries.reduce((sum, summary) => (
      sum +
      (Number(summary.confrontation?.[key]) || 0) *
      (Number(summary.actions?.attacks) || 0)
    ), 0);
    return round(numerator / totalAttacks);
  };

  return {
    scenarioCount: results.length,
    runsPerScenario: Number(payload?.runsPerScenario) || 0,
    totalRuns: results.length * (Number(payload?.runsPerScenario) || 0),
    scenarioMeanWinRate: round(mean(summaries.map(summary => summary.winRate))),
    scenarioMeanTtk: round(mean(summaries.map(summary => summary.ttk?.mean))),
    scenarioMeanDamagePerDamagingAction: round(mean(
      summaries.map(summary => summary.damage?.meanPerDamagingAction),
    )),
    scenarioMeanPlayerHpFinal: round(mean(summaries.map(summary => summary.playerHpFinalMean))),
    totalAttacks,
    totalBasicUses,
    totalSkillUses,
    weightedSkillUseRate: totalActions > 0 ? round(totalSkillUses / totalActions) : 0,
    weightedNatural1Rate: weightedRate('natural1Rate'),
    weightedNatural20Rate: weightedRate('natural20Rate'),
    rcCounts,
    rcShares,
  };
}

function numericDelta(before, after) {
  if (typeof before === 'number' && typeof after === 'number') return round(after - before);
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return Object.fromEntries([...keys].sort().map(key => [
      key,
      numericDelta(before[key], after[key]),
    ]));
  }
  return null;
}

export function compareBaselines(before, after) {
  const beforeResults = indexResults(before?.results);
  const afterResults = indexResults(after?.results);
  const beforeIds = new Set(beforeResults.keys());
  const afterIds = new Set(afterResults.keys());

  const missingAfter = [...beforeIds].filter(id => !afterIds.has(id)).sort();
  const addedAfter = [...afterIds].filter(id => !beforeIds.has(id)).sort();
  const commonIds = [...beforeIds].filter(id => afterIds.has(id)).sort();
  const scenarioDifferences = [];

  for (const id of commonIds) {
    const differences = deepDiff(beforeResults.get(id), afterResults.get(id), `/results/${id}`);
    if (differences.length) scenarioDifferences.push({ id, differences });
  }

  const metadataDifferences = deepDiff(
    Object.fromEntries(Object.entries(before || {}).filter(([key]) => METADATA_FIELDS.has(key))),
    Object.fromEntries(Object.entries(after || {}).filter(([key]) => METADATA_FIELDS.has(key))),
  );
  const structuralDifferences = deepDiff(
    Object.fromEntries(Object.entries(before || {}).filter(([key]) => STRUCTURAL_FIELDS.has(key))),
    Object.fromEntries(Object.entries(after || {}).filter(([key]) => STRUCTURAL_FIELDS.has(key))),
  );
  const sourceDifferences = deepDiff(before?.sources || {}, after?.sources || {});

  const beforeAggregate = aggregateBaseline(before);
  const afterAggregate = aggregateBaseline(after);
  const comparable =
    structuralDifferences.length === 0 &&
    missingAfter.length === 0 &&
    addedAfter.length === 0;

  let classification = 'NOT_COMPARABLE';
  if (comparable && scenarioDifferences.length === 0) {
    classification = 'NO_QUANTITATIVE_DELTA_IN_CURRENT_HARNESS';
  } else if (comparable) {
    classification = 'QUANTITATIVE_DELTA_DETECTED';
  }

  return {
    schemaVersion: 1,
    classification,
    comparable,
    before: {
      baselineSha: before?.baselineSha ?? null,
      generatedAt: before?.generatedAt ?? null,
      seed: before?.seed ?? null,
      runsPerScenario: Number(before?.runsPerScenario) || 0,
    },
    after: {
      baselineSha: after?.baselineSha ?? null,
      generatedAt: after?.generatedAt ?? null,
      seed: after?.seed ?? null,
      runsPerScenario: Number(after?.runsPerScenario) || 0,
    },
    coverage: (() => {
      const sourceLimitation = (after?.limitations || []).find(item =>
        String(item).includes('Sem passivas de espécie')) || null;
      return {
        currentHarnessIncludesSpeciesPassives: sourceLimitation ? false : null,
        currentHarnessIncludesClassPassives: (after?.results || []).some(
          result => result?.passivesEnabled === true,
        ),
        sourceLimitation,
      };
    })(),
    scenarioComparison: {
      beforeCount: beforeResults.size,
      afterCount: afterResults.size,
      commonCount: commonIds.length,
      unchangedCount: commonIds.length - scenarioDifferences.length,
      changedCount: scenarioDifferences.length,
      missingAfter,
      addedAfter,
      scenarioDifferences,
    },
    metadataDifferences,
    structuralDifferences,
    sourceDifferences,
    aggregate: {
      before: beforeAggregate,
      after: afterAggregate,
      delta: numericDelta(beforeAggregate, afterAggregate),
    },
  };
}

function pct(value) {
  return `${(Number(value || 0) * 100).toFixed(4)}%`;
}

export function renderMarkdown(comparison) {
  const before = comparison.aggregate.before;
  const after = comparison.aggregate.after;
  const delta = comparison.aggregate.delta;
  const lines = [
    '# Comparação de Baselines — Combate v2.2',
    '',
    `- **Classificação:** \`${comparison.classification}\``,
    `- **Antes:** \`${comparison.before.baselineSha}\``,
    `- **Depois:** \`${comparison.after.baselineSha}\``,
    `- **Seed:** \`${comparison.before.seed}\``,
    `- **Execuções por cenário:** ${comparison.before.runsPerScenario}`,
    '',
    '## Resultado',
    '',
    `- Cenários comparados: ${comparison.scenarioComparison.commonCount}`,
    `- Cenários sem alteração: ${comparison.scenarioComparison.unchangedCount}`,
    `- Cenários alterados: ${comparison.scenarioComparison.changedCount}`,
    `- Diferenças estruturais: ${comparison.structuralDifferences.length}`,
    `- Diferenças de fontes: ${comparison.sourceDifferences.length}`,
    `- Diferenças de metadados: ${comparison.metadataDifferences.length}`,
    '',
    '| Métrica | Antes | Depois | Delta |',
    '|---|---:|---:|---:|',
    `| Cenários | ${before.scenarioCount} | ${after.scenarioCount} | ${delta.scenarioCount} |`,
    `| Execuções totais | ${before.totalRuns} | ${after.totalRuns} | ${delta.totalRuns} |`,
    `| Vitória média por cenário | ${pct(before.scenarioMeanWinRate)} | ${pct(after.scenarioMeanWinRate)} | ${pct(delta.scenarioMeanWinRate)} |`,
    `| TTK médio entre cenários | ${before.scenarioMeanTtk} | ${after.scenarioMeanTtk} | ${delta.scenarioMeanTtk} |`,
    `| Dano médio por ação danosa | ${before.scenarioMeanDamagePerDamagingAction} | ${after.scenarioMeanDamagePerDamagingAction} | ${delta.scenarioMeanDamagePerDamagingAction} |`,
    `| HP final médio do jogador | ${before.scenarioMeanPlayerHpFinal} | ${after.scenarioMeanPlayerHpFinal} | ${delta.scenarioMeanPlayerHpFinal} |`,
    `| Uso ponderado de skills | ${pct(before.weightedSkillUseRate)} | ${pct(after.weightedSkillUseRate)} | ${pct(delta.weightedSkillUseRate)} |`,
    `| Natural 1 ponderado | ${pct(before.weightedNatural1Rate)} | ${pct(after.weightedNatural1Rate)} | ${pct(delta.weightedNatural1Rate)} |`,
    `| Natural 20 ponderado | ${pct(before.weightedNatural20Rate)} | ${pct(after.weightedNatural20Rate)} | ${pct(delta.weightedNatural20Rate)} |`,
    '',
    '## Cobertura',
    '',
    `- Passivas de espécie incluídas: ${
      comparison.coverage.currentHarnessIncludesSpeciesPassives === true
        ? 'sim'
        : comparison.coverage.currentHarnessIncludesSpeciesPassives === false
          ? 'não'
          : 'não determinado'
    }`,
    `- Passivas de classe incluídas: ${comparison.coverage.currentHarnessIncludesClassPassives ? 'sim' : 'não'}`,
    `- Limitação declarada: ${comparison.coverage.sourceLimitation || 'não encontrada'}`,
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    args[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

async function ensureParent(path) {
  await mkdir(dirname(resolve(path)), { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.before || !args.after) {
    throw new Error('Uso: --before <baseline.json> --after <baseline.json> [--output delta.json] [--report delta.md]');
  }
  const [before, after] = await Promise.all([
    readFile(resolve(args.before), 'utf8').then(JSON.parse),
    readFile(resolve(args.after), 'utf8').then(JSON.parse),
  ]);
  const comparison = compareBaselines(before, after);
  const output = args.output || 'artifacts/combat-v2-2-baseline-delta.json';
  const report = args.report || 'artifacts/combat-v2-2-baseline-delta.md';
  await Promise.all([ensureParent(output), ensureParent(report)]);
  await Promise.all([
    writeFile(resolve(output), `${JSON.stringify(comparison, null, 2)}\n`, 'utf8'),
    writeFile(resolve(report), renderMarkdown(comparison), 'utf8'),
  ]);
  console.log(`Comparação concluída: ${comparison.classification}`);
  console.log(`JSON: ${output}`);
  console.log(`Relatório: ${report}`);
}

const isCli = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (isCli) {
  main().catch(error => {
    console.error('[compare-combat-baselines-v2-2]', error);
    process.exitCode = 1;
  });
}
