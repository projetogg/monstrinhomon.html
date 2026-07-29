import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: encontrado ${count} vez(es), esperado 1`);
  }
  return source.replace(before, after);
}

const harnessPath = 'js/combat/speciesPassiveQuantitativeHarness.js';
const cliPath = 'scripts/simulate-species-passives-v2-2.mjs';
const testPath = 'tests/speciesPassiveQuantitativeMatrixV22.test.js';

let harness = readFileSync(harnessPath, 'utf8');
let cli = readFileSync(cliPath, 'utf8');
let tests = readFileSync(testPath, 'utf8');

harness = replaceOnce(
  harness,
  `    bellwaveRhythmCharged: false,\n    moonquillSpdTurns: 0,\n    floracuraHealUsed: false,`,
  `    bellwaveRhythmCharged: false,\n    moonquillSpdPower: 0,\n    moonquillSpdTurns: 0,\n    floracuraHealUsed: false,`,
  'estado de moonquill',
);

harness = replaceOnce(
  harness,
  `  if (modifier?.spdBuff) {\n    passiveState.moonquillSpdTurns = Math.max(\n      passiveState.moonquillSpdTurns,\n      Number(modifier.spdBuff.duration) || 0,\n    );`,
  `  if (modifier?.spdBuff) {\n    passiveState.moonquillSpdPower = Number(modifier.spdBuff.power) || 0;\n    passiveState.moonquillSpdTurns = Math.max(\n      passiveState.moonquillSpdTurns,\n      Number(modifier.spdBuff.duration) || 0,\n    );`,
  'power resolvido de moonquill',
);

harness = replaceOnce(
  harness,
  `      const activeSpdBuff = passiveState.moonquillSpdTurns > 0 ? 1 : 0;`,
  `      const activeSpdBuff = passiveState.moonquillSpdTurns > 0\n        ? passiveState.moonquillSpdPower\n        : 0;`,
  'uso do power de moonquill',
);

harness = replaceOnce(
  harness,
  `      if (passiveState.moonquillSpdTurns > 0 && !action.isDebuff) {\n        passiveState.moonquillSpdTurns -= 1;\n      }`,
  `      if (passiveState.moonquillSpdTurns > 0 && !action.isDebuff) {\n        passiveState.moonquillSpdTurns -= 1;\n        if (passiveState.moonquillSpdTurns === 0) {\n          passiveState.moonquillSpdPower = 0;\n        }\n      }`,
  'limpeza do power de moonquill',
);

harness = replaceOnce(
  harness,
  `    healing: summarizeValues(runs.map(run => run.healing)),\n    actions: summarizeValues(runs.map(run => run.actions)),\n    effects: effectTotals,\n    categories: categoryTotals,`,
  `    healing: summarizeValues(runs.map(run => run.healing)),\n    actions: summarizeValues(runs.map(run => run.actions)),\n    basicUses: runs.reduce((sum, run) => sum + (Number(run.basicUses) || 0), 0),\n    skillUses: runs.reduce((sum, run) => sum + (Number(run.skillUses) || 0), 0),\n    debuffUses: runs.reduce((sum, run) => sum + (Number(run.debuffUses) || 0), 0),\n    effects: effectTotals,\n    categories: categoryTotals,`,
  'contadores por variante',
);

harness = replaceOnce(
  harness,
  `      runsPerVariant: runs,`,
  `      totalRunsPerVariant: runs,`,
  'nome do total de execuções',
);

harness = replaceOnce(
  harness,
  `    '- **Conclusão:** **C. Medição automatizada concluída; decisão de balanceamento ainda depende de análise e playtest.**',`,
  `    '- **Conclusão:** **A. Matriz quantitativa criada e artefato publicado; análise humana permanece pendente.**',`,
  'classificação do Markdown',
);

cli = replaceOnce(
  cli,
  `    conclusion: 'C. Medição automatizada concluída; decisão de balanceamento ainda depende de análise e playtest.',`,
  `    conclusion: 'A. Matriz quantitativa criada e artefato publicado; análise humana permanece pendente.',`,
  'classificação do JSON',
);

tests = replaceOnce(
  tests,
  `    expect(basic.passive.effects.atkBonusApplications).toBe(0);\n    expect(mixed.passive.effects.atkBonusApplications).toBeGreaterThan(0);`,
  `    expect(basic.passive.effects.atkBonusApplications).toBe(0);\n    expect(basic.base.skillUses).toBe(0);\n    expect(basic.passive.skillUses).toBe(0);\n    expect(mixed.base.skillUses).toBeGreaterThan(0);\n    expect(mixed.passive.skillUses).toBeGreaterThan(0);\n    expect(mixed.base.basicUses).toBeGreaterThan(0);\n    expect(mixed.passive.basicUses).toBeGreaterThan(0);\n    expect(mixed.passive.effects.atkBonusApplications).toBeGreaterThan(0);`,
  'teste dos contadores de ação',
);

tests = replaceOnce(
  tests,
  `    expect(moonquill.passive.effects.spdBuffApplications).toBeGreaterThan(0);\n    expect(moonquill.passive.effects.spdBuffTurnsUsed).toBeGreaterThan(0);`,
  `    expect(moonquill.passive.effects.spdBuffApplications).toBeGreaterThan(0);\n    expect(moonquill.passive.effects.spdBuffTurnsUsed).toBeGreaterThan(0);\n    expect(moonquill.passive.debuffUses).toBe(moonquill.base.debuffUses);`,
  'teste de debuff do moonquill',
);

tests = replaceOnce(
  tests,
  `    expect(Object.keys(aggregate).sort()).toEqual([...SPECIES_QUANTITATIVE_IDS].sort());\n    expect(markdown).toContain('Matriz Quantitativa das Passivas de Espécie');\n    expect(markdown).toContain('decisão de balanceamento ainda depende de análise e playtest');\n    expect(markdown).toContain('abc123');`,
  `    expect(Object.keys(aggregate).sort()).toEqual([...SPECIES_QUANTITATIVE_IDS].sort());\n    expect(aggregate.shieldhorn.totalRunsPerVariant).toBe(20);\n    expect(markdown).toContain('Matriz Quantitativa das Passivas de Espécie');\n    expect(markdown).toContain('A. Matriz quantitativa criada e artefato publicado');\n    expect(markdown).toContain('análise humana permanece pendente');\n    expect(markdown).toContain('abc123');`,
  'teste de agregado e classificação',
);

writeFileSync(harnessPath, harness);
writeFileSync(cliPath, cli);
writeFileSync(testPath, tests);
console.log('Correções da revisão aplicadas com sucesso.');
