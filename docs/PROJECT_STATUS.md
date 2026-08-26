# Monstrinhomon — Estado do Projeto

**Verificado em:** 2026-08-26
**Branch oficial examinada:** `main`
**Commit-base verificado:** `6d59d876b1459b4ebd54d4838b1fffdfd83ad7cc`
**Marco técnico:** PR #283 integrado; `MON_100` descontinuado com compatibilidade de saves
**Escopo:** fotografia datada do estado implementado e das decisões registradas. Visão futura não equivale a runtime.

## Baseline atual

- Aplicação JavaScript executada no navegador.
- Dados runtime estruturados em `data/`, conforme loaders efetivamente usados.
- Testes Vitest, validadores de dados/assets e smoke tests definidos em `package.json`.
- GitHub como fonte técnica oficial.
- Google Drive como espaço de produto, discussão, playtest, observação e referência visual.
- Projeto ChatGPT como ponto de entrada e histórico, sem cópias técnicas independentes.
- Um único harness oficial de simulação do combate v2.2.
- Fórmula-base comparada com Wild e Group.
- Oito passivas de espécie revalidadas nos caminhos comparáveis.
- `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` implementadas.
- Baseline quantitativa de fórmula separada da matriz quantitativa das espécies.
- Matriz de espécies com 48 pares e 96.000 batalhas controladas.
- `MON_100` excluído de conteúdo novo, mantendo lookup e saves existentes.
- Visão híbrida de cartas registrada separadamente do runtime atual.
- Planos e auditorias datadas preservados em `docs/legacy/` e `docs/archive/`, fora da ordem de leitura atual.
- Instruções operacionais de agentes devem apontar para a governança, e não copiar fórmulas, valores ou IDs.

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
| Passivas nas skills Group | eventos de ataque e uso de skill | PR #274 |
| Paridade final das espécies | oito espécies nos caminhos comparáveis | PR #275 |
| Comparação de baselines | ferramenta e relatório reproduzíveis | PR #276 |
| Matriz quantitativa das espécies | 48 pares e artefato próprio | PR #278 |
| Catálogo ativo | `MON_100` descontinuado para conteúdo novo, com compatibilidade preservada | PR #283 |
| Governança e visão híbrida | contexto higienizado e `DEC-CARDS-VISION-01` registrada | PR #279 |
| Arquivamento documental | planos e auditorias históricas classificados e redirecionados | PR #280 |
| Card Layer | piloto visual do Guerreiro tecnicamente estabilizado | `js/cards/*`, `data/cards.json`, PR #256 |
| Deck, mão e tabuleiro | não implementados | visão aprovada; especificação e protótipo pendentes |
| Save/load | camadas complementares de persistência | `js/saveLayer.js`, `js/storage.js` |

## Visão de produto do sistema de cartas

A direção aprovada combina:

- RPG tático simples;
- posicionamento acessível;
- cartas como habilidades executáveis;
- deckbuilding leve;
- garantia de ação legal quando ENE ou mão limitarem opções;
- possibilidade de ações ou cartas sem custo de ENE;
- troca de Monstrinhomon alterando opções e estilo de cartas;
- uma única fonte mecânica para skills.

Fontes:

- `DEC-CARDS-VISION-01`;
- `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

A Card Layer visual-only é uma fundação incremental. Permanecem pendentes deck, mão, compra, descarte, ação básica, economia futura de ENE, grade, movimento e primeiro protótipo híbrido.

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

Sinais principais:

- `shieldhorn`: maior delta automatizado de vitória e mitigação;
- `wildpace`: efeito medido em cenário controlado iniciado abaixo de 40% de HP;
- `floracura`: bônus de cura confirmado;
- passivas dependentes de skill: efeitos observáveis nos perfis aplicáveis.

Esses resultados não autorizam buff ou nerf sem playtest e decisão humana.

Fontes:

- `docs/reports/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.md`;
- `docs/reports/SPECIES_PASSIVE_QUANTITATIVE_MATRIX_2026-07.md`.

## Estado da informação e autoridade

- `README.md`, `docs/AI_ENTRYPOINT.md`, este arquivo, `docs/AUTHORITY_MAP.md`, `docs/DECISION_LOG.md` e `docs/ROADMAP.md` são os pontos de entrada atuais.
- `AGENTS.md` é o guia operacional; wrappers em `.github/` não devem manter regras próprias.
- Anexos do Projeto ChatGPT não possuem autoridade técnica automática.
- Conversas e documentos de produto podem preservar intenção; decisões reconciliadas devem ser registradas no GitHub.
- Documentos históricos ficam em `docs/archive/`, `docs/legacy/` ou em redirecionamentos classificados.
- A Dex v3 permanece proposta editorial; não governa automaticamente runtime, IDs, atributos, classes ou evolução.
- CSVs da raiz não são a fonte runtime principal, mas alguns são lidos por testes ou funcionam como contratos paralelos. A auditoria deve ser individual.

Fontes:

- `docs/AUTHORITY_MAP.md`;
- `docs/INFORMATION_HYGIENE_AUDIT_2026-07.md`;
- `docs/reports/HISTORICAL_DOCUMENT_ARCHIVE_2026-07.md`;
- `docs/reports/ACTIVE_AUTHORITY_HOTFIX_2026-07.md`.

## Divergências e lacunas conhecidas

| ID | Tema | Estado |
|---|---|---|
| `EG-01` | semântica de skill que erra no Wild | lacuna de evidência isolada |
| `DIV-ENE-01` | regeneração de ENE | investigação independente pendente |
| `DIV-PASSIVE-01` | valores das passivas de classe | não recalibrar sem medição |
| `DIV-BOSS-01` | multiplicadores e comportamento de boss | investigação pendente |
| `DIV-CARDS-01` | Card Layer visual | QA de produto e encerramento do piloto pendentes |
| `GAP-CARDS-HYBRID-01` | regras exatas do deckbuilding tático | visão aprovada; especificação e protótipo pendentes |
| `DIV-NAMES-01` | nomes editoriais da Dex v3 | mapear antes de qualquer migração |
| `DOC-HYGIENE-02` | planos e auditorias históricas em caminhos ativos | resolvida pelo PR #280 |
| `DOC-HYGIENE-03` | CSVs raiz e outros planos concluídos | auditorias independentes pendentes |
| `DOC-HYGIENE-04` | instruções ativas com regras e autoridades antigas | corrigida pela Onda 0 de autoridade ativa |
| `DRIVE-HYGIENE-01` | duas raízes e Portal desatualizado | execução separada pendente |
| `CHATGPT-HYGIENE-01` | anexos antigos no contexto ativo | migração e limpeza manual pendentes |

## Decisões

### Implementadas

- `DEC-SPECIES-ATK-01`: `atkBonus` modifica o ATK antes da fórmula.
- `DEC-SPECIES-DEF-01`: resistência percentual ocorre antes da redução plana de `shieldhorn`.
- `DEC-CATALOG-MON-100-01`: `MON_100` não participa de conteúdo novo, mas permanece resolvível em saves existentes.

### Aprovadas e não implementadas integralmente

- `DEC-CARDS-VISION-01`: RPG tático simples, deckbuilding leve, posicionamento, cartas como habilidades e garantia contra turno morto.

### Pendentes

- `DEC-COMBAT-A`: estratégia de calibração entre PWR e catálogo;
- `DEC-COMBAT-D`: destino do prêmio aleatório de UX no crítico;
- regras exatas de deck, mão, compra, descarte, ações sem ENE e tabuleiro;
- `DEC-AUTH-01`: formalização final da autoridade normativa e descritiva;
- `DEC-AUTH-02`: destino do antigo Documento Mestre;
- revisão dos nomes editoriais ainda pendentes em `DEC-DRIVE-01`.

## Fase atual

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

Higiene documental não autoriza iniciar deck, tabuleiro ou recalibração durante este portão.

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
- decisão sobre deck, mão, ações sem ENE ou tabuleiro;
- aprovação ou migração de nomes;
- alteração dos comandos oficiais de teste;
- nova etapa de higiene documental;
- novo marco técnico que torne esta fotografia materialmente incorreta.
