# Monstrinhomon — Estado do Projeto

**Verificado em:** 2026-09-25

**Branch oficial examinada:** `main`

**Commit-base verificado:** `194be88b4257a8e50cf4ef456534a6722ea38fd9`

**Marco técnico:** SP-01, SP-02 e SP-03 técnicos concluídos; PR #296 alinhou o feedback total de cura de `floracura` sem alterar balanceamento

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
- SP-01 técnico de `shieldhorn` executado no cenário Ferrozimon × Vitalex com 20.000 pares `basic` e 20.000 `mixed`.
- SP-02 técnico de `wildpace` executado a partir de HP cheio: 20.000 pares por perfil no cenário oficial e sensibilidade adicional.
- SP-03 técnico de `floracura` executado com HP cheio, Petisco real, custo de ação do item e sensibilidade de timing/dificuldade.
- Playtest humano das passivas adiado até a build estar apresentável às crianças; simulação dirigida é a etapa operacional imediata.
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
| Gate posicional de `shieldhorn` | mitigação apenas na linha de frente no Group; Wild mantém combatente ativo como frente | PR #288 |
| Feedback total de `floracura` | Wild e Group reportam cura-base + bônus efetivamente aplicado | PR #296 |
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

- `shieldhorn`: maior delta automatizado de vitória e mitigação na matriz isolada da passiva;
- a matriz de espécies não modela o pacote completo de espécie: não aplica offsets via `speciesBridge`, kit swap ou economia integral de ENE;
- `wildpace`: efeito medido em cenário controlado iniciado abaixo de 40% de HP;
- `floracura`: bônus de cura confirmado;
- passivas dependentes de skill: efeitos observáveis nos perfis aplicáveis.

Esses resultados não autorizam buff ou nerf automaticamente.

SP-01 técnico pós-PR #288:
- `basic`: 100% → 100% de vitória; TTK inalterado; +3,40795 HP final médio;
- `mixed`: 100% → 100%; TTK inalterado; +2,15635 HP final médio;
- o cenário confirma resistência mecânica, mas está saturado para calibração por win rate;
- dimensões humanas permanecem não testadas.

Fonte adicional:
- `docs/reports/SP01_TECHNICAL_SHIELDHORN_2026-09.md`;
- `docs/reports/SP02_TECHNICAL_WILDPACE_2026-09.md`;
- `docs/reports/SP03_TECHNICAL_FLORACURA_2026-09.md`.

SP-02 técnico:
- cenário oficial `basic`: cruzamento natural de `<40%` em 29,625%; delta de vitória +0,255 p.p.;
- cenário oficial `mixed`: cruzamento natural em 10,35%; delta de vitória +0,015 p.p.;
- a disponibilidade cresce com a dificuldade, mas o +1 ATK não produz virada automática;
- com Vitalion Nv12–13, o gatilho ocorre quase sempre, porém confrontos estruturalmente perdidos continuam majoritariamente perdidos.

SP-03 técnico:
- Nutrilo Nv10 × Furtilhon Nv10, política técnica de item em `<=50%`: 7,125% → 8,455% de vitória, delta +1,33 p.p.;
- o Petisco cura mínimo 30 HP contra 54 HP máximos do Nutrilo, então uso precoce frequentemente satura o HP e desperdiça o bônus;
- em política `<=40%`, o +3 completo coube em 100% dos usos observados; em `<=70%`, 92,22% dos usos tiveram bônus zero;
- esperar até `<=30%` reduziu a frequência de uso do item para 89,9%;
- nenhuma alteração do +3 HP é justificada pela evidência atual;
- PR #296 corrigiu apenas o feedback total de cura.

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
| `DIV-KITSWAP-PWR-01` | calibração do Golpe Pesado de `shieldhorn` | referências de PWR em comentários/testes não correspondem a `data/skills.json`; depende de `DEC-COMBAT-A` |
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

- `DEC-PLAYTEST-PRE-01`: adiar coleta humana enquanto a build não estiver apresentável e usar simulação dirigida como etapa pré-playtest.
- `DEC-CARDS-VISION-01`: RPG tático simples, deckbuilding leve, posicionamento, cartas como habilidades e garantia contra turno morto.

### Pendentes

- `DEC-COMBAT-A`: estratégia de calibração entre PWR e catálogo;
- `DEC-COMBAT-D`: destino do prêmio aleatório de UX no crítico;
- regras exatas de deck, mão, compra, descarte, ações sem ENE e tabuleiro;
- `DEC-AUTH-01`: formalização final da autoridade normativa e descritiva;
- `DEC-AUTH-02`: destino do antigo Documento Mestre;
- revisão dos nomes editoriais ainda pendentes em `DEC-DRIVE-01`.

## Fase atual

A fase permanece **Validação do Núcleo Jogável — Combate v2.2**, com etapa operacional imediata de **validação pré-playtest por simulação dirigida das passivas de espécie**.

Motivo: o autor determinou que a build ainda não está pronta para apresentação às crianças. Simular manualmente a sessão sem participantes não produziria evidência humana.

Prioridades imediatas:

1. SP-01 técnico de `shieldhorn`: **concluído**, sem sinal para alterar `damageReduction: 1`;
2. SP-02 técnico de `wildpace`: **concluído**, sem sinal para alterar o `+1 ATK`;
3. SP-03 técnico de `floracura`: **concluído**, sem sinal para alterar o `+3 HP`;
4. SP-06A / `moonquill`: medir setup de debuff → buff de SPD → efeito utilizável;
5. depois `shadowsting` e `bellwave`: medir criação e consumo de carga em cenários não saturados;
6. manter PWR, crítico, ENE e boss em investigações separadas;
7. separar sempre `TECHNICAL_CONTROLLED` de evidência humana.

O playtest mediado humano permanece como portão futuro e deve ser retomado quando a build estiver apresentável. Percepção, compreensão, frustração, diversão, justiça e estratégia espontânea não podem ser preenchidas por simulação.

Fontes:
- `docs/DECISAO_PROCESSO_PREPLAYTEST_SIMULACAO_2026-09.md`;
- `docs/reports/SP01_TECHNICAL_SHIELDHORN_2026-09.md`;
- `docs/reports/SHIELDHORN_TANK_PACKAGE_REASSESSMENT_2026-09.md`;
- `docs/reports/SP03_TECHNICAL_FLORACURA_2026-09.md`.

Nenhum valor de passiva, PWR ou ENE é alterado nesta etapa.

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
