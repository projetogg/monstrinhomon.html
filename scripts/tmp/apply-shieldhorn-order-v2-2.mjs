import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function read(path) {
  return readFileSync(path, 'utf8');
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, 'utf8');
}

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`Trecho ausente: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`Trecho duplicado inesperadamente: ${label}`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function lineStart(source, index) {
  const previousBreak = source.lastIndexOf('\n', index);
  return previousBreak < 0 ? 0 : previousBreak + 1;
}

function reorderShieldhornInSection(source, { sectionStart, sectionEnd, afterMarker, label }) {
  const sectionStartIndex = source.indexOf(sectionStart);
  if (sectionStartIndex < 0) throw new Error(`Início de seção ausente: ${label}`);
  const sectionEndIndex = source.indexOf(sectionEnd, sectionStartIndex + sectionStart.length);
  if (sectionEndIndex < 0) throw new Error(`Fim de seção ausente: ${label}`);

  const section = source.slice(sectionStartIndex, sectionEndIndex);
  const shieldMarkerIndex = section.indexOf('// Passiva canônica — defensor');
  const classMarkerIndex = section.indexOf('// F1: Passiva de classe do atacante', shieldMarkerIndex);
  const afterMarkerIndex = section.indexOf(afterMarker, classMarkerIndex);

  if (shieldMarkerIndex < 0 || classMarkerIndex < 0 || afterMarkerIndex < 0) {
    throw new Error(`Pipeline incompleto em: ${label}`);
  }

  const shieldStart = lineStart(section, shieldMarkerIndex);
  const classesStart = lineStart(section, classMarkerIndex);
  const afterStart = lineStart(section, afterMarkerIndex);

  const before = section.slice(0, shieldStart);
  const shieldBlock = section.slice(shieldStart, classesStart).trimEnd();
  const classBlocks = section.slice(classesStart, afterStart).trimEnd();
  const after = section.slice(afterStart);

  const reordered = `${before}${classBlocks}\n\n${shieldBlock}\n\n${after}`;
  if (reordered === section) throw new Error(`Nenhuma mudança produzida em: ${label}`);

  return source.slice(0, sectionStartIndex) + reordered + source.slice(sectionEndIndex);
}

// Runtime: aplica primeiro bônus ofensivo, depois resistência percentual da classe
// e somente então a redução plana de shieldhorn.
const wildPath = 'js/combat/wildActions.js';
let wild = read(wildPath);
wild = reorderShieldhornInSection(wild, {
  sectionStart: 'export function executeWildAttack',
  sectionEnd: 'function applyEneRegen',
  afterMarker: '// F2: Ladino — debuff',
  label: 'ataque básico do jogador contra selvagem',
});
wild = reorderShieldhornInSection(wild, {
  sectionStart: 'function processEnemySkillAttack',
  sectionEnd: 'function processEnemyBasicAttack',
  afterMarker: 'playerMonster.hp =',
  label: 'skill ofensiva do selvagem',
});
wild = reorderShieldhornInSection(wild, {
  sectionStart: 'function processEnemyBasicAttack',
  sectionEnd: 'function handleVictory',
  afterMarker: 'playerMonster.hp =',
  label: 'ataque básico do selvagem',
});
write(wildPath, wild);

// Teste de paridade: cobre os três pipelines Wild e o pipeline Group.
const parityPath = 'tests/speciesPassiveModeParityV22.test.js';
let parity = read(parityPath);
parity = replaceOnce(
  parity,
  `  const wildItem = segment(\n    WILD_SOURCE,\n    'export function executeWildItemUse',\n    'export function executeWildFlee',\n  );\n`,
  `  const wildItem = segment(\n    WILD_SOURCE,\n    'export function executeWildItemUse',\n    'export function executeWildFlee',\n  );\n  const wildEnemySkill = segment(\n    WILD_SOURCE,\n    'function processEnemySkillAttack',\n    'function processEnemyBasicAttack',\n  );\n  const wildEnemyBasic = segment(\n    WILD_SOURCE,\n    'function processEnemyBasicAttack',\n    'function handleVictory',\n  );\n`,
  'segmentos estruturais dos ataques inimigos Wild',
);
parity = replaceOnce(
  parity,
  `  it('caracteriza a ordem divergente entre shieldhorn e passiva defensiva de classe', () => {\n    const wildSpeciesIndex = wildBasic.indexOf('const defPassive = fireCombatEvent');\n    const wildClassIndex = wildBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');\n    const groupClassIndex = groupBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');\n    const groupSpeciesIndex = groupBasic.indexOf('const defSpeciesPassive = fireCombatEvent');\n\n    expect(wildSpeciesIndex).toBeGreaterThanOrEqual(0);\n    expect(wildClassIndex).toBeGreaterThan(wildSpeciesIndex);\n    expect(groupClassIndex).toBeGreaterThanOrEqual(0);\n    expect(groupSpeciesIndex).toBeGreaterThan(groupClassIndex);\n  });\n`,
  `  it('aplica resistência de classe antes de shieldhorn nos dois modos', () => {\n    const wildCases = [\n      [wildBasic, 'const defClassPassive = CLASS_COMBAT_PASSIVES'],\n      [wildEnemySkill, 'const wildSkillDefPassive = CLASS_COMBAT_PASSIVES'],\n      [wildEnemyBasic, 'const playerDefClassPassive = CLASS_COMBAT_PASSIVES'],\n    ];\n\n    for (const [source, classMarker] of wildCases) {\n      const classIndex = source.indexOf(classMarker);\n      const speciesIndex = source.indexOf('const defPassive = fireCombatEvent');\n      expect(classIndex).toBeGreaterThanOrEqual(0);\n      expect(speciesIndex).toBeGreaterThan(classIndex);\n    }\n\n    const groupClassIndex = groupBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');\n    const groupSpeciesIndex = groupBasic.indexOf('const defSpeciesPassive = fireCombatEvent');\n    expect(groupClassIndex).toBeGreaterThanOrEqual(0);\n    expect(groupSpeciesIndex).toBeGreaterThan(groupClassIndex);\n  });\n`,
  'teste estrutural da ordem defensiva',
);
parity = replaceOnce(
  parity,
  `  it('DRIFT: a ordem de shieldhorn e resistência de Guerreiro muda o dano em cenário de fronteira', () => {`,
  `  it('PARITY: shieldhorn reduz após a resistência de Guerreiro nos dois modos', () => {`,
  'título do cenário observável de shieldhorn',
);
parity = replaceOnce(
  parity,
  `    expect(wildBase.damage).toBe(3);\n    expect(wildShield.damage).toBe(3);\n    expect(groupBase.damage).toBe(3);\n    expect(groupShield.damage).toBe(2);`,
  `    expect(wildBase.damage).toBe(3);\n    expect(wildShield.damage).toBe(2);\n    expect(groupBase.damage).toBe(3);\n    expect(groupShield.damage).toBe(2);\n    expect(wildShield.damage).toBe(groupShield.damage);`,
  'expectativas de paridade observável do shieldhorn',
);
write(parityPath, parity);

// Documento operacional reutilizável do PR.
write('docs/prompts/PROMPT_SHIELDHORN_ORDEM_DEFENSIVA_WILD_V2_2.md', `# Prompt operacional — Ordem defensiva de shieldhorn no Wild v2.2\n\n## Objetivo\n\nImplementar exclusivamente \`DEC-SPECIES-DEF-01\`: no modo Wild, a resistência percentual da classe defensora deve ser aplicada antes da redução plana de \`shieldhorn\`.\n\n## Escopo obrigatório\n\n- corrigir ataque básico do jogador contra selvagem;\n- corrigir skill ofensiva do selvagem contra jogador;\n- corrigir ataque básico do selvagem contra jogador;\n- preservar valores, gatilhos, consumo por turno e mínimo de 1 dano;\n- converter o teste de drift em teste de paridade;\n- atualizar documentação de estado e decisão.\n\n## Fora de escopo\n\n- recalibrar passivas;\n- alterar PWR, crítico, ENE, boss, itens ou Card Layer;\n- mudar o significado de primeiro hit;\n- corrigir eventos de espécie em skills Group;\n- alterar IDs ou dados.\n\n## Pipeline canônico\n\n\`\`\`text\ndano calculado\n→ bônus ofensivo aplicável\n→ resistência percentual da classe defensora\n→ redução plana de shieldhorn\n→ mínimo de 1\n→ aplicação ao HP\n\`\`\`\n\n## Validação\n\n\`\`\`bash\nnpm run test:species-passive-parity-v2-2\nnpm run test:combat-parity-v2-2\nnpm run test:combat-simulation-v2-2\nnpm test\nnpm run validate-data\nnpm run validate:monster-assets\nnpm run test:wild-loop:vitest\n\`\`\`\n\n## Critério de saída\n\nWild e Group devem produzir 2 de dano no cenário de fronteira Guerreiro + shieldhorn, contra 3 sem a passiva, e os três caminhos defensivos Wild devem manter a ordem estrutural aprovada.\n`);

// Estado do projeto.
const statusPath = 'docs/PROJECT_STATUS.md';
let status = read(statusPath);
status = replaceOnce(status,
  '**Marco tecnico:** PR #264 mergeado em `35e4e3d31879354695965d650554d27bac67b273`',
  '**Marco tecnico:** PR #266 mergeado em `7a1d95194137cf72b95d45cd4dba303be6dc707f`; ordem defensiva de `shieldhorn` alinhada neste PR',
  'marco técnico do status',
);
status = replaceOnce(status,
  '- Passivas de especie caracterizadas entre Wild e Group no PR #264.',
  '- Passivas de especie caracterizadas entre Wild e Group no PR #264.\n- `atkBonus` de espécie alinhado no Group pelo PR #266.\n- Ordem defensiva de `shieldhorn` alinhada no Wild por este PR.',
  'baseline de passivas do status',
);
status = replaceOnce(status,
  '| `DIV-SP-ATK-01` | `atkBonus` de especie entrar no ATK antes da formula | Wild segue a decisao; Group soma ao dano final | decisao aprovada; correcao Group pendente |',
  '| `DIV-SP-ATK-01` | `atkBonus` de especie entrar no ATK antes da formula | Wild e Group seguem a decisao | resolvida tecnicamente no PR #266 |',
  'divergência atkBonus',
);
status = replaceOnce(status,
  '| `DIV-SP-DEF-01` | resistencia percentual ocorrer antes de `shieldhorn` | Group segue a decisao; Wild aplica `shieldhorn` antes | decisao aprovada; correcao Wild pendente |',
  '| `DIV-SP-DEF-01` | resistencia percentual ocorrer antes de `shieldhorn` | Wild e Group seguem a decisao | resolvida tecnicamente neste PR |',
  'divergência shieldhorn',
);
status = replaceOnce(status,
  '## Decisoes aprovadas ainda nao implementadas\n\n- `DEC-SPECIES-ATK-01`: `atkBonus` de especie modifica o ATK antes da formula; Group precisa de correcao.\n- `DEC-SPECIES-DEF-01`: resistencia percentual ocorre antes da reducao plana de `shieldhorn`; Wild precisa de correcao.\n\nFonte: `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.',
  '## Decisoes de pipeline implementadas\n\n- `DEC-SPECIES-ATK-01`: implementada no Wild e no Group; PR #266 concluiu o alinhamento.\n- `DEC-SPECIES-DEF-01`: implementada no Group e no Wild; este PR conclui o alinhamento.\n\nFonte: `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.',
  'estado das decisões implementadas',
);
status = replaceOnce(status,
  'O proximo PR tecnico deve ser unico e limitado a:\n\n```text\nfix(combat): aplicar atkBonus de especie antes da formula no Group\n```\n\nDepois dele:\n\n1. alinhar a ordem defensiva de `shieldhorn` no Wild;\n2. despachar eventos de especie nas skills Group;\n3. executar novamente a paridade;\n4. revisar a baseline quantitativa;\n5. realizar playtest mediado.',
  'O proximo PR tecnico deve ser unico e limitado a:\n\n```text\nfix(combat): despachar passivas de especie nas skills Group\n```\n\nDepois dele:\n\n1. executar novamente a matriz completa de paridade;\n2. revisar a baseline quantitativa;\n3. realizar playtest mediado;\n4. separar eventuais achados de balanceamento das correcoes de integração.',
  'próxima fase técnica',
);
write(statusPath, status);

// Registro de decisões.
const decisionLogPath = 'docs/DECISION_LOG.md';
let decisionLog = read(decisionLogPath);
decisionLog = replaceOnce(decisionLog,
  '| `DEC-SPECIES-ATK-01` | 2026-07-27 | APPROVED | passivas de especie | `atkBonus` modifica o ATK efetivo antes da formula de dano | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Wild e referencia atual; correcao do Group pendente |',
  '| `DEC-SPECIES-ATK-01` | 2026-07-27 | IMPLEMENTED | passivas de especie | `atkBonus` modifica o ATK efetivo antes da formula de dano | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Wild e Group alinhados; PR #266 |',
  'DEC-SPECIES-ATK-01',
);
decisionLog = replaceOnce(decisionLog,
  '| `DEC-SPECIES-DEF-01` | 2026-07-27 | APPROVED | passivas de especie | reducao percentual de classe ocorre antes da reducao plana de `shieldhorn` | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Group e referencia atual; correcao do Wild pendente |',
  '| `DEC-SPECIES-DEF-01` | 2026-07-27 | IMPLEMENTED | passivas de especie | reducao percentual de classe ocorre antes da reducao plana de `shieldhorn` | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Group e Wild alinhados; este PR |',
  'DEC-SPECIES-DEF-01',
);
decisionLog = replaceOnce(decisionLog,
  'Elas nao alteram valores, gatilhos, skills, balanceamento ou runtime por si mesmas. O estado permanece `APPROVED` ate os PRs tecnicos correspondentes serem integrados.',
  'Elas não alteram valores, gatilhos, skills ou balanceamento. Após o PR #266 e este PR, os dois pontos de pipeline estão implementados no Wild e no Group; o despacho de eventos nas skills Group permanece uma divergência separada.',
  'síntese do estado das decisões',
);
write(decisionLogPath, decisionLog);

// Documento canônico das decisões.
const decisionPath = 'docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md';
let decision = read(decisionPath);
decision = replaceOnce(decision, '**Status:** APPROVED', '**Status:** IMPLEMENTED', 'status global da decisão');
decision = replaceOnce(decision, '**Status:** APPROVED  \n**Referência atual:** Wild  \n**Correção futura:** Group', '**Status:** IMPLEMENTED  \n**Referência inicial:** Wild  \n**Implementação:** Wild e Group alinhados pelo PR #266', 'status DEC-SPECIES-ATK-01');
decision = replaceOnce(decision, '**Status:** APPROVED  \n**Referência atual:** Group  \n**Correção futura:** Wild', '**Status:** IMPLEMENTED  \n**Referência inicial:** Group  \n**Implementação:** Group e Wild alinhados por este PR', 'status DEC-SPECIES-DEF-01');
decision = replaceOnce(decision,
  '- O caminho Group é a referência para esta ordem específica.\n- O Wild deverá mover a aplicação de `shieldhorn` para depois da resistência defensiva da classe.\n- O cenário de fronteira deverá exigir o mesmo dano nos dois modos após a correção.',
  '- O caminho Group foi a referência inicial para esta ordem específica.\n- O Wild aplica `shieldhorn` depois da resistência defensiva da classe nos três caminhos ofensivos cobertos.\n- O cenário de fronteira exige o mesmo dano nos dois modos.',
  'consequências DEC-SPECIES-DEF-01',
);
decision = replaceOnce(decision,
  '1. `fix(combat): aplicar atkBonus de espécie antes da formula no Group`;\n2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild`;\n3. `fix(combat): despachar passivas de espécie nas skills Group`.',
  '1. `fix(combat): aplicar atkBonus de espécie antes da formula no Group` — concluído no PR #266;\n2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild` — concluído neste PR;\n3. `fix(combat): despachar passivas de espécie nas skills Group` — próximo PR isolado.',
  'sequência técnica da decisão',
);
decision = replaceOnce(decision,
  '- skills Group continuam divergentes até PR próprio;\n- os drifts documentados permanecem reais até as correções técnicas;',
  '- skills Group continuam divergentes até PR próprio;\n- os drifts de `atkBonus` e ordem defensiva foram corrigidos; o drift de eventos de skill permanece;',
  'limites atualizados da decisão',
);
write(decisionPath, decision);

// Roadmap.
const roadmapPath = 'docs/ROADMAP.md';
let roadmap = read(roadmapPath);
roadmap = replaceOnce(roadmap,
  '1. `fix(combat): aplicar atkBonus de especie antes da formula no Group`;\n2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild`;\n3. `fix(combat): despachar passivas de especie nas skills Group`;\n4. reexecutar a matriz de paridade das passivas;\n5. revisar a baseline quantitativa somente depois da paridade.',
  '1. `fix(combat): aplicar atkBonus de especie antes da formula no Group` — concluído no PR #266;\n2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild` — concluído neste PR;\n3. `fix(combat): despachar passivas de especie nas skills Group` — próximo;\n4. reexecutar a matriz de paridade das passivas;\n5. revisar a baseline quantitativa somente depois da paridade.',
  'sequência atual do roadmap',
);
roadmap = replaceOnce(roadmap,
  '- `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` definem os pipelines pretendidos, ainda nao implementados integralmente.',
  '- `DEC-SPECIES-ATK-01` foi implementada no PR #266;\n- `DEC-SPECIES-DEF-01` foi implementada neste PR;\n- o drift restante das passivas de espécie está nas skills Group.',
  'concluído recentemente no roadmap',
);
roadmap = replaceOnce(roadmap,
  '| etapa de `atkBonus` de especie | autor humano | APPROVED em `DEC-SPECIES-ATK-01`; implementacao pendente | paridade das passivas ofensivas |',
  '| etapa de `atkBonus` de especie | autor humano | IMPLEMENTED no PR #266 | paridade das passivas ofensivas por skill ainda depende do próximo PR |',
  'portão atkBonus',
);
roadmap = replaceOnce(roadmap,
  '| ordem de `shieldhorn` e resistencia de classe | autor humano | APPROVED em `DEC-SPECIES-DEF-01`; implementacao pendente | paridade das passivas defensivas |',
  '| ordem de `shieldhorn` e resistencia de classe | autor humano | IMPLEMENTED neste PR | não bloqueia mais a paridade defensiva base |',
  'portão shieldhorn',
);
write(roadmapPath, roadmap);

// Relatório de paridade.
const reportPath = 'docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md';
let report = read(reportPath);
report = replaceOnce(report,
  'Relatório de caracterização do combate v2.2, baseado na `main` após o merge do PR #264.\n\nAs decisões de pipeline foram aprovadas em `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`. Os drifts continuam presentes no runtime até os PRs corretivos correspondentes.',
  'Relatório de paridade do combate v2.2, atualizado após o PR #266 e a correção da ordem defensiva de `shieldhorn` neste PR.\n\nAs decisões de pipeline estão implementadas para `atkBonus` e mitigação defensiva. O drift restante está no despacho de eventos de espécie nas skills Group.',
  'status do relatório',
);
report = replaceOnce(report,
  '| `shieldhorn` | primeiro hit recebe `-1` de dano | espécie antes da resistência de classe | resistência de classe antes da espécie | `TRIGGER_PARITY_EFFECT_DRIFT` |',
  '| `shieldhorn` | primeiro hit recebe `-1` de dano | resistência de classe antes da espécie | resistência de classe antes da espécie | `PARITY` |',
  'matriz shieldhorn',
);
report = replaceOnce(report,
  '| `wildpace` | HP <40% concede `+1 ATK` | bônus altera ATK antes da fórmula | bônus soma 1 ao dano final | `TRIGGER_PARITY_EFFECT_DRIFT` |',
  '| `wildpace` | HP <40% concede `+1 ATK` | bônus altera ATK antes da fórmula | bônus altera ATK antes da fórmula | `PARITY` |',
  'matriz wildpace',
);
report = replaceOnce(report,
  '### SP-03 — Bônus de ataque entra em etapas diferentes\n\nNo Wild, o `atkBonus` de espécie é somado ao ATK antes de `computeGroupDamage()`.\n\nNo Group, o resultado do dano é calculado primeiro e o `atkBonus` é somado diretamente ao dano final.\n\nEm um `acerto_reduzido`, o `wildpace` pode ser absorvido pelo `floor()` do multiplicador no Wild, enquanto o Group sempre acrescenta 1 ponto depois do cálculo.',
  '### SP-03 — Bônus de ataque alinhado\n\nWild e Group somam o `atkBonus` de espécie ao ATK efetivo antes de `computeGroupDamage()`. Em um `acerto_reduzido`, o bônus pode ser absorvido pelo arredondamento nos dois modos, preservando a mesma semântica de atributo.',
  'achado SP-03',
);
report = replaceOnce(report,
  '### SP-04 — Ordem defensiva diferente\n\nNo Wild:\n\n1. calcula dano-base;\n2. aplica `shieldhorn`;\n3. aplica resistência defensiva da classe.\n\nNo Group:\n\n1. calcula dano-base;\n2. aplica resistência defensiva da classe;\n3. aplica `shieldhorn`.\n\nA ordem altera o resultado em cenários de fronteira por causa do arredondamento.',
  '### SP-04 — Ordem defensiva alinhada\n\nWild e Group executam o mesmo pipeline:\n\n1. calcula dano-base e bônus ofensivos aplicáveis;\n2. aplica resistência defensiva percentual da classe;\n3. aplica a redução plana de `shieldhorn`;\n4. preserva mínimo de 1 dano.\n\nO cenário de fronteira Guerreiro + `shieldhorn` produz 2 de dano nos dois modos, contra 3 sem a passiva.',
  'achado SP-04',
);
report = replaceOnce(report,
  'Para esta decisão específica, o Wild é a referência atual e o Group permanece divergente até correção própria.',
  'A decisão está implementada no Wild e no Group; o PR #266 concluiu o alinhamento.',
  'estado DEC-SPECIES-ATK-01 no relatório',
);
report = replaceOnce(report,
  'Para esta decisão específica, o Group é a referência atual e o Wild permanece divergente até correção própria.',
  'A decisão está implementada no Group e no Wild; este PR conclui o alinhamento.',
  'estado DEC-SPECIES-DEF-01 no relatório',
);
report = replaceOnce(report,
  '- o despacho de eventos de espécie nas skills Group;\n- o estágio incorreto de `atkBonus` no Group;\n- a ordem defensiva divergente no Wild.',
  '- o despacho de eventos de espécie nas skills Group;\n- a validação de balanceamento;\n- interações ainda não cobertas com múltiplos hits, boss e skills de área.',
  'limites restantes do relatório',
);
report = replaceOnce(report,
  '1. `fix(combat): aplicar atkBonus de espécie antes da fórmula no Group`;\n2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild`;\n3. `fix(combat): despachar passivas de espécie nas skills Group`;\n4. executar novamente a matriz de paridade;\n5. somente depois revisar a baseline quantitativa.',
  '1. `fix(combat): aplicar atkBonus de espécie antes da fórmula no Group` — concluído no PR #266;\n2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild` — concluído neste PR;\n3. `fix(combat): despachar passivas de espécie nas skills Group` — próximo;\n4. executar novamente a matriz de paridade;\n5. somente depois revisar a baseline quantitativa.',
  'sequência do relatório',
);
report = replaceOnce(report,
  '**A. Decisões canônicas registradas; correções técnicas podem começar.**\n\nA classificação confirma que o contrato comum continua estável e que os pipelines desejados estão definidos. Wild e Group ainda não devem ser tratados como equivalentes para passivas de espécie até a integração dos PRs corretivos.',
  '**A. Pipelines canônicos de atributo e mitigação alinhados; integração de skills Group ainda pendente.**\n\nO contrato comum permanece estável. Wild e Group já são equivalentes para `atkBonus`, `shieldhorn` e `floracura`; ainda não são equivalentes para passivas que dependem do uso de skills no Group.',
  'classificação final do relatório',
);
write(reportPath, report);

console.log('Correção de shieldhorn v2.2 aplicada com sucesso.');
