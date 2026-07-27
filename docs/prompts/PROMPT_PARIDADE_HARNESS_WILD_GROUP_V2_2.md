# Prompt operacional — Paridade do harness com Wild e Group v2.2

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Demonstrar, por testes determinísticos, quais partes do harness oficial de simulação reproduzem os loops reais de combate Wild e Group quando recebem entradas equivalentes.

Esta etapa é de caracterização. Não corrigir divergências encontradas e não alterar balanceamento.

## Instrumento oficial

Usar somente:

- `js/combat/combatSimulationHarness.js`;
- `scripts/simulate-combat-v2-2.mjs`;
- `tests/combatSimulationHarnessV22.test.js`;
- `.github/workflows/combat-v2-2-baseline.yml`.

Não criar outro simulador ou outra CLI.

## Fontes runtime obrigatórias

- `js/combat/wildActions.js`;
- `js/combat/groupActions.js`;
- `js/combat/groupCore.js`;
- `js/combat/groupCombatFormula.js`;
- `design/canon/class_matchups.json`.

## Método

Para cada cenário comparável, usar:

- mesmos combatentes;
- mesmos níveis;
- mesmos atributos;
- mesmo PWR de ataque básico;
- mesmas classes;
- mesma tabela de matchup;
- mesmos `d20A` e `d20D`;
- buffs vazios;
- posição frontal neutra;
- ausência de passiva de espécie;
- mesma configuração de passivas de classe.

O RNG do harness deve ser seedado. O teste deve confirmar que a seed produz os valores de dado declarados antes de comparar resultados.

## Comparações obrigatórias

1. ataque básico neutro;
2. `d20A = 1`;
3. `d20A = 20`;
4. `d20D = 20`;
5. vantagem de classe;
6. desvantagem de classe;
7. passiva ofensiva do Ladino;
8. passiva defensiva do Guerreiro;
9. passiva defensiva do Bárbaro;
10. passiva defensiva do Curandeiro.

Comparar:

- RC;
- categoria do RC;
- dano final;
- HP restante do defensor.

## Diferenças a caracterizar

Não transformar diferenças conhecidas em igualdade artificial.

### SPD

O harness e o Wild usam bônus de SPD no confronto. O ataque básico Group atualmente envia `buffOff: 0`.

Criar um cenário de fronteira em que `+1` de SPD altere a categoria de RC e registrar como:

`DRIFT_WILD_GROUP`

### ENE

O harness calcula regeneração percentual com `floor`, enquanto o Wild usa `ceil`.

Criar um cenário com valor fracionário e registrar como:

`DRIFT_HARNESS_WILD`

A regeneração de Group é delegada por dependência. Caso a fonte concreta não seja exercida no teste de ação, registrar como lacuna de evidência em vez de inferir paridade.

## Classificação

Cada resultado deve receber uma destas categorias:

- `PARITY`: os três caminhos produzem o mesmo resultado;
- `DRIFT_HARNESS_WILD`;
- `DRIFT_HARNESS_GROUP`;
- `DRIFT_WILD_GROUP`;
- `EXPECTED_DIFFERENCE`;
- `EVIDENCE_GAP`.

## Limites

Não alterar:

- fórmula de confronto;
- fórmula de dano;
- PWR;
- atributos;
- crítico;
- passivas;
- ENE;
- bosses;
- skills;
- dados JSON;
- Card Layer;
- nomes ou IDs;
- runtime Wild ou Group.

Não incluir passivas de espécie nesta primeira matriz, pois Wild e Group as aplicam em ordens distintas. Essa comparação deve ficar para um PR posterior e isolado.

## Arquivos esperados

- `tests/combatHarnessRuntimeParityV22.test.js`;
- comando `test:combat-parity-v2-2` em `package.json`;
- atualização do workflow da baseline para executar o teste de paridade;
- este prompt operacional.

## Validação

Executar:

```bash
npm run test:combat-parity-v2-2
npm run test:combat-simulation-v2-2
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
npm run test:wild-loop
```

O workflow `Combat v2.2 Baseline` deve executar o teste de paridade antes de gerar os artefatos.

## Critérios de aceitação

- cenários equivalentes passam com o mesmo dano nos três caminhos;
- RC do Wild e Group é conferido pelos logs runtime;
- as seeds declaradas reproduzem os dados esperados;
- os drifts de SPD e ENE são caracterizados sem correção;
- nenhuma regra ou dado runtime é modificado;
- a baseline continua sendo gerada;
- a suíte geral permanece verde.

## Saída

Finalizar com uma destas classificações:

- **A. Fórmula-base do harness fiel; drifts de orquestração permanecem isolados**;
- **B. Harness precisa de correção antes da análise da baseline**;
- **C. Evidência insuficiente para concluir a paridade**.

Não fazer merge sem autorização humana explícita.
