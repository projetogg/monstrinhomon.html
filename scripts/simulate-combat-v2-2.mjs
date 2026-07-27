#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  buildBaselineScenarios,
  renderMarkdownReport,
  runScenarioMatrix,
} from '../js/combat/combatSimulationHarness.js';

function parseArgs(argv) {
  const result = {
    runs: 1000,
    seed: 'monstrinhomon-combat-v2.2',
    output: 'artifacts/combat-v2-2-baseline.json',
    report: 'artifacts/combat-v2-2-baseline.md',
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

  const scenarios = buildBaselineScenarios({ monstersJson, skillsJson, matchupsJson });
  if (scenarios.length === 0) {
    throw new Error('Nenhum cenário foi construído a partir dos dados atuais.');
  }

  const results = runScenarioMatrix(scenarios, {
    runs: args.runs,
    seed: args.seed,
    maxTurns: 50,
  });
  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    baselineSha: args.baselineSha,
    seed: args.seed,
    runsPerScenario: args.runs,
    sources: {
      formula: 'js/combat/groupCombatFormula.js',
      monsters: 'data/monsters.json',
      skills: 'data/skills.json',
      classMatchups: 'design/canon/class_matchups.json',
    },
    conclusion: 'C. Evidência ainda insuficiente para decidir',
    limitations: [
      'Sem playtest humano.',
      'Sem passivas de espécie, cura, itens, alvo de IA ou equivalência completa Wild/Group.',
      'Níveis 5–30 usam o perfil explícito de crescimento do harness e exigem comparação com o runtime.',
      'Jogador atua primeiro em todos os turnos.',
    ],
    results,
  };

  const markdown = renderMarkdownReport({
    baselineSha: args.baselineSha,
    seed: args.seed,
    runs: args.runs,
    results,
  });

  await ensureParent(args.output);
  await ensureParent(args.report);
  await writeFile(resolve(process.cwd(), args.output), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await writeFile(resolve(process.cwd(), args.report), markdown, 'utf8');

  console.log(`Baseline v2.2 concluída: ${results.length} cenários × ${args.runs} execuções.`);
  console.log(`JSON: ${args.output}`);
  console.log(`Relatório: ${args.report}`);
  console.log(payload.conclusion);
}

main().catch(error => {
  console.error('[simulate-combat-v2-2]', error);
  process.exitCode = 1;
});
