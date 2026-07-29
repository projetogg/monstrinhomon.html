#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  aggregateSpeciesPassiveQuantitativeResults,
  buildSpeciesPassiveQuantitativeScenarios,
  renderSpeciesPassiveQuantitativeMarkdown,
  runSpeciesPassiveQuantitativeMatrix,
} from '../js/combat/speciesPassiveQuantitativeHarness.js';

function parseArgs(argv) {
  const result = {
    runs: 1000,
    seed: 'monstrinhomon-species-passives-v2.2-matrix-v1',
    output: 'artifacts/species-passive-v2-2-matrix.json',
    report: 'artifacts/species-passive-v2-2-matrix.md',
    baselineSha: process.env.GITHUB_SHA || 'local-uncommitted',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];
    if (key === '--runs') result.runs = Math.max(1, Number(value) || 1000);
    if (key === '--seed') result.seed = value || result.seed;
    if (key === '--output') result.output = value || result.output;
    if (key === '--report') result.report = value || result.report;
    if (key === '--baseline-sha') result.baselineSha = value || result.baselineSha;
    if (key.startsWith('--')) index += 1;
  }
  return result;
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(process.cwd(), path), 'utf8'));
}

async function ensureParent(path) {
  await mkdir(dirname(resolve(process.cwd(), path)), { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [monstersJson, skillsJson, matchupsJson] = await Promise.all([
    readJson('data/monsters.json'),
    readJson('data/skills.json'),
    readJson('design/canon/class_matchups.json'),
  ]);
  const scenarios = buildSpeciesPassiveQuantitativeScenarios({ monstersJson, skillsJson, matchupsJson });
  const results = runSpeciesPassiveQuantitativeMatrix(scenarios, {
    runs: args.runs,
    seed: args.seed,
    maxTurns: 30,
  });
  const aggregate = aggregateSpeciesPassiveQuantitativeResults(results);
  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baselineSha: args.baselineSha,
    seed: args.seed,
    runsPerPair: args.runs,
    scenarioPairs: results.length,
    battlesSimulated: results.length * args.runs * 2,
    coverage: {
      speciesPassives: true,
      species: Object.keys(aggregate),
      levels: [1, 10, 30],
      profiles: ['basic', 'mixed'],
      pairedVariants: ['without_passive', 'with_passive'],
      classPassivesHeldConstant: true,
    },
    sources: {
      passiveResolver: 'js/canon/speciesPassives.js',
      formula: 'js/combat/groupCombatFormula.js',
      baseHarness: 'js/combat/combatSimulationHarness.js',
      matrixHarness: 'js/combat/speciesPassiveQuantitativeHarness.js',
      monsters: 'data/monsters.json',
      skills: 'data/skills.json',
      classMatchups: 'design/canon/class_matchups.json',
    },
    conclusion: 'C. Medição automatizada concluída; decisão de balanceamento ainda depende de análise e playtest.',
    limitations: [
      'Ações roteirizadas; sem IA completa.',
      'Sem economia integral de ENE, múltiplos alvos ou bosses.',
      'Inimigo sem passiva de espécie.',
      'Moonquill usa fronteira controlada de SPD.',
      'Floracura usa um único item de cura controlado.',
      'Sem playtest humano.',
    ],
    aggregate,
    results,
  };
  const markdown = renderSpeciesPassiveQuantitativeMarkdown({
    baselineSha: args.baselineSha,
    seed: args.seed,
    runs: args.runs,
    results,
  });

  await ensureParent(args.output);
  await ensureParent(args.report);
  await writeFile(resolve(process.cwd(), args.output), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(resolve(process.cwd(), args.report), markdown, 'utf8');

  console.log(`Matriz de passivas concluída: ${results.length} pares × ${args.runs} execuções × 2 variantes.`);
  console.log(`JSON: ${args.output}`);
  console.log(`Relatório: ${args.report}`);
  console.log(payload.conclusion);
}

main().catch(error => {
  console.error('[simulate-species-passives-v2-2]', error);
  process.exitCode = 1;
});
