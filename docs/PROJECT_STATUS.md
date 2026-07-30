# Monstrinhomon — Estado do Projeto

**Verificado em:** 2026-07-30  
**Branch oficial examinada:** `main`  
**Commit verificado:** `b14dceb5438911ce93741fa4b722895ab9ffa8eb`  
**Marco técnico:** PR #278 integrado  
**Escopo:** este arquivo descreve o repositório; não cria regras do jogo.

## Baseline atual

- Aplicação em JavaScript executada no navegador.
- Dados runtime em `data/`, conforme os loaders efetivamente usados.
- Testes Vitest, validadores de dados/assets e smoke tests definidos em `package.json`.
- GitHub como fonte técnica oficial.
- Google Drive como espaço de produto, discussão, playtest, observação e referência visual.
- Projeto ChatGPT como ponto de entrada, sem cópias técnicas independentes.
- Um único harness oficial de simulação do combate v2.2.
- Fórmula-base comparada com Wild e Group.
- Oito passivas de espécie revalidadas nos caminhos comparáveis.
- `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` implementadas.
- Baseline quantitativa de fórmula separada da matriz quantitativa das espécies.
- Matriz de espécies com 48 pares e 96.000 batalhas controladas.

## Implementado na `main`

| Domínio | Estado observado | Evidência principal |
|---|---|---|
| Trade | caminho runtime único | `js/combat/tradeSystem.js`, `js/ui/tradeUI.js`, PR #250 |
| Fórmula Group | confronto bilateral v2.2 | `js/combat/groupCombatFormula.js` |
| Fórmula Wild | base bilateral v2.2 | `js/combat/wildActions.js`, PR #255 |
| Harness de simulação | instrumento único e reproduzível | `js/combat/combatSimulationHarness.js`, PRs #260 e #262 |
| Paridade da fórmula-base | matriz determinística | `tests/combatHarnessRuntimeParityV22.test.js`, PR #263 |
| `atkBonus` de espécie | ATK antes da fórmula | PR #266 |
| Ordem de `shieldhorn` | resistência percentual antes da redução plana | PR #273 |
| Passivas nas skills Group | `ON_ATTACK` e `ON_SKILL_USED` | PR #274 |
| Paridade final das espécies | oito espécies nos caminhos comparáveis | PR #275 |
| Comparação de baselines | ferramenta e relatório reproduzíveis | PR #276 |
| Matriz quantitativa das espécies | 48 pares; artefato próprio | PR #278 |
| Card Layer | piloto do Guerreiro tecnicamente estabilizado | `js/cards/*`, PR #256 |
| Save/load | camadas complementares de persistência | `js/saveLayer.js`, `js/storage.js` |

## Evidência quantitativa atual

### Baseline de fórmula

```text
90 cenários comparados
90 cenários sem alteração
0 cenários quantitativamente alterados
90.000 combates por baseline
```

Essa baseline mede fórmula, RC, ações ofensivas, ENE e passivas de classe. Ela não substitui a matriz das espécies.

### Matriz das passivas de espécie

```text
8 espécies
3 níveis
2 perfis
48 pares
1.000 execuções por variante
96.000 batalhas
```

Principais sinais automatizados:

- `shieldhorn`: maior delta automatizado de vitória e mitigação;
- `wildpace`: efeito medido num cenário controlado já abaixo de 40% de HP;
- `floracura`: bônus de cura confirmado;
- passivas dependentes de skill: efeitos e estados observáveis nos perfis aplicáveis.

Esses resultados não autorizam buff ou nerf sem análise humana e playtest.

Fontes:

- `docs/reports/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.md`;
- `docs/reports/SPECIES_PASSIVE_QUANTITATIVE_MATRIX_2026-07.md`.

## Estado da informação

- `README.md`, `AI_ENTRYPOINT.md`, `PROJECT_STATUS.md`, `AUTHORITY_MAP.md`, `DECISION_LOG.md` e `ROADMAP.md` formam os pontos de entrada atuais.
- Anexos do Projeto ChatGPT não possuem autoridade técnica automática.
- Documentos históricos devem estar em `docs/archive/` ou `docs/legacy/`, ou possuir marcação explícita.
- `LEIA-ME.md`, `TODO_FUNCIONALIDADES.md` e `docs/ANALISE_PROJETO.md` foram classificados como cópias ativas perigosas na auditoria de julho de 2026.
- A migração ampla de planos e auditorias históricas está separada para PR posterior.

Fonte: `docs/INFORMATION_HYGIENE_AUDIT_2026-07.md`.

## Divergências e lacunas conhecidas

| ID | Tema | Estado |
|---|---|---|
| `EG-01` | semântica de skill que erra no Wild | lacuna de evidência isolada |
| `DIV-ENE-01` | regeneração de ENE | investigação independente pendente |
| `DIV-PASSIVE-01` | valores das passivas de classe | não recalibrar sem medição |
| `DIV-BOSS-01` | multiplicadores e comportamento de boss | investigação pendente |
| `DIV-CARDS-01` | Card Layer | QA de produto e encerramento do piloto pendentes |
| `DIV-NAMES-01` | nomes editoriais da Dex v3 | mapear antes de qualquer migração |
| `DOC-HYGIENE-02` | planos e auditorias históricas em caminhos ativos | migração para arquivo pendente |

## Decisões aprovadas e implementadas

- `DEC-SPECIES-ATK-01`: `atkBonus` modifica o ATK antes da fórmula.
- `DEC-SPECIES-DEF-01`: resistência percentual ocorre antes da redução plana de `shieldhorn`.

Fonte: `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.

## Decisões pendentes

- `DEC-COMBAT-A`: estratégia de calibração entre PWR e catálogo.
- `DEC-COMBAT-D`: destino do prêmio aleatório de UX no crítico.
- `DEC-AUTH-01`: formalização final da autoridade normativa e descritiva.
- `DEC-AUTH-02`: destino do antigo “Documento Mestre”.
- `DEC-DRIVE-01`: revisão dos nomes editoriais ainda pendentes.

## Fase atual recomendada

A fase permanece **Validação do Núcleo Jogável — Combate v2.2**.

Próximo portão:

```text
docs(playtest): registrar playtest mediado das passivas de espécie
```

Prioridades:

1. observar `shieldhorn` sem presumir nerf;
2. medir frequência natural de `wildpace` abaixo de 40% de HP;
3. verificar clareza das passivas condicionadas a skills;
4. registrar duração, escolhas, frustração e entendimento;
5. separar UX, bug e balanceamento.

## Validação técnica

```bash
npm test
npm run test:combat-simulation-v2-2
npm run test:combat-parity-v2-2
npm run test:species-passive-parity-v2-2
npm run test:species-passive-final-parity-v2-2
npm run test:species-passive-quantitative-v2-2
npm run test:combat-baseline-comparison-v2-2
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Execute `npm run test:wild-loop` quando as dependências do Playwright estiverem disponíveis.

## Gatilhos para revisão

Atualizar este arquivo quando ocorrer:

- conclusão de playtest padronizado;
- mudança relevante em código ou dados runtime;
- decisão sobre PWR, crítico, passivas, energia ou boss;
- aprovação ou migração de nomes;
- alteração dos comandos oficiais de teste;
- novo marco técnico que torne esta fotografia materialmente incorreta.
