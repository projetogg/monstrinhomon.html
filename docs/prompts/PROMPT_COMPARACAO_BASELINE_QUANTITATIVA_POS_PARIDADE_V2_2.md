# PROMPT OPERACIONAL — COMPARAÇÃO QUANTITATIVA DA BASELINE PÓS-PARIDADE V2.2

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Comparar quantitativamente a baseline do combate v2.2 anterior às correções de paridade das passivas de espécie com a baseline posterior à conclusão dos PRs #266, #273, #274 e #275.

A comparação deve responder:

1. as métricas atuais da baseline mudaram;
2. quantos cenários mudaram;
3. quais métricas mudaram;
4. se a baseline atual realmente mede o impacto das passivas de espécie;
5. qual deve ser o próximo portão técnico.

Este PR é exclusivamente analítico.

Não alterar runtime, fórmulas, valores, dados ou balanceamento.

---

## Baselines obrigatórias

### Antes

- PR de referência: `#264`;
- workflow: `Combat v2.2 Baseline`;
- run: `#15`;
- run ID: `30287695764`;
- head SHA: `e019262f1325d0c416beb76b89000473b4480822`;
- artifact ID: `8661485325`;
- artifact: `combat-v2-2-baseline-e019262f1325d0c416beb76b89000473b4480822`;
- digest: `sha256:b1416c0a89420f1f4e739a6c8aca73526b874c765fecb127e51bdd4a5bf09024`.

### Depois

- PR de referência: `#275`;
- workflow: `Combat v2.2 Baseline`;
- run: `#23`;
- run ID: `30414217954`;
- head SHA: `70670dd4f355515af695698a2d48582fc90b45fd`;
- artifact ID: `8709540034`;
- artifact: `combat-v2-2-baseline-70670dd4f355515af695698a2d48582fc90b45fd`;
- digest: `sha256:9244e3f53860ebc1cc96115a93067225d12277f871a4ce0303c8e79a37f16fd2`.

As duas baselines devem usar:

```text
seed = monstrinhomon-combat-v2.2-baseline-v1
runsPerScenario = 1000
scenarioCount = 90
```

Se seed, quantidade de execuções ou conjunto de IDs diferirem, classificar como não comparável.

---

## Fontes obrigatórias

- os dois artefatos JSON e Markdown;
- `scripts/simulate-combat-v2-2.mjs`;
- `js/combat/combatSimulationHarness.js`;
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`;
- `docs/PROJECT_STATUS.md`;
- `docs/ROADMAP.md`;
- PRs #264, #266, #273, #274 e #275.

---

## Método de comparação

### 1. Metadados

Comparar separadamente:

- `baselineSha`;
- `generatedAt`;
- `schemaVersion`;
- `seed`;
- `runsPerScenario`;
- `sources`;
- `limitations`;
- `conclusion`.

`baselineSha` e `generatedAt` são metadados esperados e não devem ser tratados como mudança quantitativa.

### 2. Cenários

Indexar resultados por `id`.

Para cada cenário, comparar integralmente:

- nível;
- classes;
- perfil de ação;
- estado de passivas;
- taxa de vitória;
- taxa de empate;
- TTK;
- HP final;
- dano;
- categorias de confronto;
- natural 1 e natural 20;
- ataques;
- ataques básicos;
- skills;
- gasto e regeneração de ENE.

Não comparar cenários pela posição no array.

### 3. Agregados

Calcular para cada baseline:

- quantidade de cenários;
- execuções totais;
- média das taxas de vitória dos cenários;
- média dos TTKs;
- média do dano por ação danosa;
- média do HP final do jogador;
- total de ataques;
- total de ataques básicos;
- total de skills;
- taxa ponderada de uso de skills;
- taxas ponderadas de natural 1 e natural 20;
- contagem e proporção de cada categoria de RC.

### 4. Diferença recursiva

Produzir uma comparação recursiva capaz de distinguir:

- diferença de metadados;
- diferença comparável de topo;
- cenário adicionado;
- cenário removido;
- cenário quantitativamente alterado.

---

## Verificação obrigatória de cobertura

Auditar o que `passivesEnabled` realmente significa no harness.

Confirmar se:

- o harness chama `fireCombatEvent()` ou `resolvePassiveModifier()` para passivas de espécie;
- o harness possui `canonSpeciesId`;
- `performAttack()` aplica apenas `DEFAULT_CLASS_PASSIVES`;
- o relatório gerado declara que passivas de espécie estão fora da cobertura.

Não interpretar `passivesEnabled: true` como prova de que passivas de espécie são simuladas.

---

## Entregas

Criar:

- `scripts/compare-combat-baselines-v2-2.mjs`;
- `tests/combatBaselineComparisonV22.test.js`;
- `docs/reports/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.md`;
- `docs/reports/data/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.json`;
- `docs/prompts/PROMPT_COMPARACAO_BASELINE_QUANTITATIVA_POS_PARIDADE_V2_2.md`.

Atualizar:

- `package.json`;
- `docs/PROJECT_STATUS.md`;
- `docs/ROADMAP.md`.

---

## Comando operacional

Adicionar:

```json
"compare:combat-baseline-v2-2": "node scripts/compare-combat-baselines-v2-2.mjs"
```

Uso esperado:

```bash
npm run compare:combat-baseline-v2-2 -- \
  --before caminho/baseline-anterior.json \
  --after caminho/baseline-posterior.json \
  --output artifacts/combat-v2-2-baseline-delta.json \
  --report artifacts/combat-v2-2-baseline-delta.md
```

---

## Testes obrigatórios

Cobrir:

1. baselines idênticas exceto SHA e data;
2. cenário com métrica alterada;
3. seeds incompatíveis;
4. agregação de ações e categorias;
5. geração do relatório Markdown.

Executar:

```bash
npm run test:combat-baseline-comparison-v2-2
npm test
npm run test:combat-simulation-v2-2
npm run test:combat-parity-v2-2
npm run test:species-passive-parity-v2-2
npm run test:species-passive-final-parity-v2-2
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
npm run test:wild-loop
```

---

## Interpretação obrigatória

### Caso as métricas mudem

Registrar:

- cenários afetados;
- magnitude;
- direção;
- relação plausível com cada correção;
- limites de causalidade.

Não ajustar valores neste PR.

### Caso as métricas não mudem

Verificar se isso ocorreu porque:

- as correções não atingem os cenários;
- o harness não inclui passivas de espécie;
- os dados usados pela simulação não mudaram;
- a seed reproduziu exatamente os mesmos caminhos.

Não declarar “as passivas não têm impacto” se elas não forem simuladas.

---

## Atualização de governança

`PROJECT_STATUS.md` e `ROADMAP.md` devem registrar:

- os três PRs corretivos integrados;
- a paridade final do PR #275;
- a estabilidade da baseline de fórmula/classe;
- a ausência de passivas de espécie na baseline quantitativa atual;
- a proibição de iniciar recalibração com base nesta comparação;
- o próximo PR único recomendado.

---

## Próximo PR permitido

Se a baseline não cobrir passivas de espécie, recomendar somente:

```text
test(combat): adicionar matriz quantitativa de passivas de espécie
```

Esse futuro PR deverá:

- manter a baseline atual como referência de fórmula e passivas de classe;
- criar uma matriz dedicada às oito espécies;
- instrumentar ativações, estados e efeito numérico;
- não alterar valores no mesmo PR.

---

## Fora de escopo

Não alterar:

- `js/combat/groupCombatFormula.js`;
- `js/combat/wildActions.js`;
- `js/combat/groupActions.js`;
- `js/canon/speciesPassives.js`;
- monstros;
- skills;
- matchups;
- PWR;
- crítico;
- ENE;
- passivas;
- bosses;
- Card Layer;
- balanceamento.

---

## Estrutura do PR

Título:

```text
docs(combat): comparar baseline quantitativa pós-paridade
```

O PR deve declarar:

- artefatos comparados;
- comparabilidade;
- número de cenários e execuções;
- resultado quantitativo;
- cobertura real do harness;
- classificação final;
- próximo portão técnico.

Não fazer merge sem autorização humana explícita.

---

## Classificação obrigatória

Finalizar com exatamente uma classificação:

```text
A. Delta quantitativo detectado e caracterizado
B. Nenhum delta no harness atual; passivas de espécie permanecem fora da cobertura
C. Baselines não comparáveis
```
