#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import {
  DEFAULT_LEVELS,
  renderBaselineMarkdown,
  runBaseline,
} from './simulator.mjs';

function parseInteger(value, label) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new TypeError(`${label} deve ser inteiro positivo.`);
  }
  return parsed;
}

function parseLevels(value) {
  const levels = String(value)
    .split(',')
    .map((item) => parseInteger(item.trim(), 'level'));
  return [...new Set(levels)];
}

export function parseArgs(argv) {
  const options = {
    iterations: 1000,
    seed: 2202,
    levels: [...DEFAULT_LEVELS],
    jsonPath: null,
    markdownPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const next = argv[index + 1];

    if (argument === '--iterations') {
      options.iterations = parseInteger(next, 'iterations');
      index += 1;
    } else if (argument === '--seed') {
      options.seed = parseInteger(next, 'seed');
      index += 1;
    } else if (argument === '--levels') {
      options.levels = parseLevels(next);
      index += 1;
    } else if (argument === '--json') {
      options.jsonPath = resolve(next);
      index += 1;
    } else if (argument === '--markdown') {
      options.markdownPath = resolve(next);
      index += 1;
    } else if (argument === '--help' || argument === '-h') {
      options.help = true;
    } else {
      throw new Error(`Argumento desconhecido: ${argument}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Uso:
  npm run simulate:combat-v2-2 -- [opções]

Opções:
  --iterations N      Iterações por cenário (padrão: 1000)
  --seed N            Seed determinística (padrão: 2202)
  --levels LISTA      Níveis separados por vírgula (padrão: 1,5,10,15,30; cenários extras usam níveis fixos 1/10/30 e 10)
  --json CAMINHO      Salva relatório completo em JSON
  --markdown CAMINHO  Salva resumo em Markdown
  -h, --help          Mostra esta ajuda

Exemplo:
  npm run simulate:combat-v2-2 -- \\
    --iterations 1000 \\
    --seed 2202 \\
    --json artifacts/combat-v2-2/baseline.json \\
    --markdown artifacts/combat-v2-2/baseline.md
`);
}

function writeOutput(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return null;
  }

  const report = runBaseline({
    iterations: options.iterations,
    seed: options.seed,
    levels: options.levels,
  });
  const markdown = renderBaselineMarkdown(report);

  if (options.jsonPath) {
    writeOutput(options.jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  }
  if (options.markdownPath) {
    writeOutput(options.markdownPath, `${markdown}\n`);
  }

  if (!options.jsonPath && !options.markdownPath) {
    console.log(markdown);
  } else {
    console.log(JSON.stringify({
      seed: report.metadata.seed,
      iterationsPerScenario: report.metadata.iterationsPerScenario,
      scenarioCount: report.metadata.scenarioCount,
      jsonPath: options.jsonPath,
      markdownPath: options.markdownPath,
      classification: report.metadata.classification,
    }, null, 2));
  }

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error(`[combat-v2-2] ${error.message}`);
    process.exitCode = 1;
  }
}
