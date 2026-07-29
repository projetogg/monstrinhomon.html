# PROMPT OPERACIONAL — REVALIDAÇÃO FINAL DAS PASSIVAS DE ESPÉCIE V2.2

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Revalidar a matriz completa das oito passivas de espécie entre Wild e Group após a integração dos PRs corretivos #266, #273 e #274.

Este PR deve produzir evidência atualizada sobre:

- contrato puro;
- despacho dos eventos;
- gerenciamento de estado;
- etapa de aplicação do modificador;
- efeito observável;
- diferenças intencionais;
- lacunas de evidência restantes.

Não alterar runtime, fórmulas, dados, valores ou balanceamento.

## Estado de referência

A análise deve partir da `main` posterior ao merge do PR #274.

Os três ajustes já integrados são:

1. `atkBonus` de espécie antes da fórmula no ataque básico Group;
2. resistência percentual antes de `shieldhorn` no Wild;
3. `ON_ATTACK` e `ON_SKILL_USED` no caminho de skills Group.

O relatório antigo foi produzido após o PR #264 e não pode continuar sendo tratado como fotografia atual.

## Fontes obrigatórias

- `js/canon/speciesPassives.js`;
- `js/combat/combatEvents.js`;
- `js/combat/wildActions.js`;
- `js/combat/groupActions.js`;
- `js/combat/groupCombatFormula.js`;
- `tests/speciesPassiveModeParityV22.test.js`;
- `tests/groupSkillExecution.test.js`;
- testes Wild relacionados às passivas;
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`;
- `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.

## Espécies obrigatórias

A matriz final deve cobrir exatamente:

- `shieldhorn`;
- `emberfang`;
- `floracura`;
- `swiftclaw`;
- `moonquill`;
- `shadowsting`;
- `bellwave`;
- `wildpace`.

## Dimensões de comparação

Para cada espécie, registrar:

1. evento canônico;
2. condição de ativação;
3. modificador retornado;
4. integração no Wild;
5. integração no Group;
6. estado criado ou consumido;
7. etapa do pipeline;
8. resultado observável;
9. classificação;
10. limite da evidência.

## Classificações permitidas

### `PARITY`

O caminho comparado apresenta condição, estado e efeito equivalente.

### `EXPECTED_DIFFERENCE`

A diferença pertence a uma funcionalidade adicional, explicitamente fora do contrato comparado.

### `DRIFT_WILD_GROUP`

Os dois modos executam de forma diferente o mesmo contrato comparável.

### `EVIDENCE_GAP`

A arquitetura atual não expõe informação suficiente para afirmar equivalência.

Não converter uma lacuna em paridade por inferência.

## Teste comparativo obrigatório

Criar:

`tests/speciesPassiveFinalParityV22.test.js`

O teste deve executar os pipelines reais `executeWildSkill()` e `executePlayerSkillGroup()` com adapters determinísticos.

Cobrir:

- `emberfang`: mesmo `+1 ATK` em skill ofensiva com HP acima de 70%;
- `emberfang`: nenhuma ativação exatamente em 70%;
- `swiftclaw`: mesmo bônus na primeira skill e mesmo estado consumido;
- `moonquill`: mesmo buff de SPD após debuff bem-sucedido;
- `shadowsting`: mesma carga após debuff bem-sucedido;
- `bellwave`: mesma carga após skill válida bem-sucedida;
- `wildpace`: mesmo `+1 ATK` em skill quando HP está abaixo de 40%;
- ENE insuficiente: nenhum modo cria estado de passiva.

Os testes devem comparar efeitos, não apenas presença textual de `fireCombatEvent()`.

## Lacuna obrigatória de acurácia

Registrar explicitamente que:

- Group resolve acurácia dentro de `executePlayerSkillGroup()` e possui ramo explícito de erro;
- Wild delega a execução para `dependencies.useSkill()` e recebe apenas `success`;
- o contrato atual de `executeWildSkill()` não distingue de forma local erro de acurácia e ação inválida.

Portanto, a equivalência de `ON_SKILL_USED` em uma skill Wild que erra deve permanecer `EVIDENCE_GAP`, salvo existência de prova adicional no runtime.

Não alterar o runtime para resolver essa lacuna neste PR.

## Relatório

Atualizar:

`docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`

O relatório deve:

- substituir a fotografia pós-PR #264 pela fotografia pós-PR #274;
- remover drifts já corrigidos;
- apresentar a matriz final;
- separar paridade comprovada de lacuna de evidência;
- registrar que o kit swap de execução do `shadowsting` no Wild é funcionalidade adicional e não invalida a paridade da carga canônica para o próximo ataque básico;
- indicar o próximo portão técnico.

## Integração no CI

Adicionar ao `package.json`:

`test:species-passive-final-parity-v2-2`

Executar o novo teste no workflow `Combat v2.2 Baseline` após a matriz estrutural existente e antes da geração da baseline.

Adicionar o novo arquivo aos gatilhos de paths do workflow.

## Fora de escopo

Não alterar:

- `js/canon/speciesPassives.js`;
- `js/combat/combatEvents.js`;
- `js/combat/wildActions.js`;
- `js/combat/groupActions.js`;
- fórmulas;
- valores;
- limiares;
- skills;
- dados JSON;
- IA;
- bosses;
- Card Layer;
- balanceamento.

Caso seja encontrado um drift novo, caracterizá-lo e propor PR separado.

## Validação obrigatória

Executar:

```bash
npm run test:species-passive-parity-v2-2
npm run test:species-passive-final-parity-v2-2
npx vitest run tests/groupSkillExecution.test.js
npm run test:combat-parity-v2-2
npm run test:combat-simulation-v2-2
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
npm run test:wild-loop
```

O workflow deve continuar gerando e publicando a baseline reproduzível.

## PR

Título:

`test(combat): revalidar matriz final de passivas Wild × Group`

O diff final deve ficar limitado a:

- prompt;
- novo teste comparativo;
- relatório atualizado;
- script de package;
- workflow da baseline.

Não fazer merge sem autorização humana explícita.

## Conclusão obrigatória

Finalizar com uma destas classificações:

- `A. Paridade comprovada nos caminhos comparáveis; lacunas restantes isoladas`;
- `B. Novo drift comparável encontrado e caracterizado`;
- `C. Evidência insuficiente para fechar a matriz final`.
