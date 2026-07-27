# Monstrinhomon - Estado do Projeto

**Verificado em:** 2026-07-27  
**Branch oficial examinada:** `main`  
**Marco tecnico:** PR #264 mergeado em `35e4e3d31879354695965d650554d27bac67b273`  
**Escopo:** este arquivo descreve o repositorio; nao cria regras do jogo.

## Baseline atual

- Aplicacao em JavaScript executada no navegador.
- Dados runtime em `data/`, conforme os loaders efetivamente usados.
- Testes Vitest, validadores de dados/assets e smoke tests definidos em `package.json`.
- GitHub como fonte tecnica oficial.
- Google Drive como espaco de produto, discussao, playtest, observacao e referencia visual.
- Um unico harness oficial de simulacao do combate v2.2.
- Formula-base do harness comparada com Wild e Group.
- Passivas de especie caracterizadas entre Wild e Group no PR #264.
- Nenhum pull request aberto relevante no momento desta verificacao inicial.

## Implementado na main

| Dominio | Estado observado | Evidencia principal |
|---|---|---|
| Trade | caminho runtime unico | `js/combat/tradeSystem.js`, `js/ui/tradeUI.js`, PR #250 |
| Formula Group | confronto bilateral v2.2 | `js/combat/groupCombatFormula.js` |
| Formula Wild | migrada para confronto bilateral v2.2 | `js/combat/wildActions.js`, PR #255 |
| Harness de simulacao | instrumento unico, reproduzivel e integrado ao CI | `js/combat/combatSimulationHarness.js`, PRs #260 e #262 |
| Paridade da formula-base | matriz deterministica integrada | `tests/combatHarnessRuntimeParityV22.test.js`, PR #263 |
| Caracterizacao das passivas de especie | contrato comum e drifts de integracao documentados | `tests/speciesPassiveModeParityV22.test.js`, PR #264 |
| Passivas de classe | conceito e valores atuais presentes | `wildActions.js`, runtime Group e Decisao B |
| Catalogo de Cards | 3 Cards visuais do Guerreiro | `data/cards.json` |
| Card Layer | piloto do Guerreiro com identidade efetiva preservada | `js/cards/*`, `js/data/skillsLoader.js`, PR #256 |
| Save/load | camadas complementares de persistencia | `js/saveLayer.js`, `js/storage.js` e testes |

## Estado do Drive

- `00 - Portal do Projeto` aponta para as fontes oficiais do GitHub.
- A Dex v3 foi preservada como proposta editorial ativa em `02 - Decisoes em Discussao/Em elaboracao`.
- O catalogo visual e o acervo de imagens foram classificados em `06 - Referencias Visuais`.
- Bases antigas foram movidas para `99 - Arquivo Historico`.
- A especificacao que tratava a planilha como fonte do runtime foi marcada como substituida.
- A Dex v3 registra 44 nomes como `canonical` e 34 como `needs_verification`.
- As areas de Visao do Produto, Playtests e Uso Terapeutico ainda precisam ser alimentadas com conteudo operacional.

A marcacao editorial nao altera o runtime. Nomes divergentes da `main` exigem decisao e PR tecnico especifico.

## Divergencias conhecidas

| ID | Regra pretendida | Comportamento da main | Estado |
|---|---|---|---|
| `DIV-COMBAT-01` | Wild e Group compartilharem a formula v2.2 | ambos usam a base bilateral v2.2 | resolvida tecnicamente; balanceamento ainda nao validado |
| `DIV-SP-ATK-01` | `atkBonus` de especie entrar no ATK antes da formula | Wild segue a decisao; Group soma ao dano final | decisao aprovada; correcao Group pendente |
| `DIV-SP-DEF-01` | resistencia percentual ocorrer antes de `shieldhorn` | Group segue a decisao; Wild aplica `shieldhorn` antes | decisao aprovada; correcao Wild pendente |
| `DIV-SP-SKILL-01` | skills Group dispararem eventos de passiva de especie | `executePlayerSkillGroup()` nao dispara `ON_ATTACK`/`ON_SKILL_USED` | aberto; PR isolado posterior |
| `DIV-ENE-01` | tabela canonica de regeneracao | 7 de 8 classes divergiam na ultima auditoria | aberto |
| `DIV-PASSIVE-01` | impacto inicialmente fraco, em torno de 3% a 5% | runtime ainda possui valores de 10% a 15% | aberto |
| `DIV-BOSS-01` | multiplicadores canonicos de boss | implementacao nao foi confirmada integralmente | investigar |
| `DIV-CARDS-01` | skills efetivas do Guerreiro mapearem de forma confiavel | identidade preservada no loader e aliases explicitos de kit swap | resolvida tecnicamente no PR #256; QA de produto pendente |
| `DIV-NAMES-01` | 44 nomes aprovados editorialmente na Dex v3 | a `main` pode usar nomes diferentes | mapear divergencias antes de qualquer migracao |

## Pull requests recentes relevantes

Pull requests mergeados passam a integrar o baseline oficial.

| PR | Tema | Estado em 2026-07-27 | Impacto |
|---|---|---|---|
| #255 | migracao da formula Wild para v2.2 | mergeado | combate Wild e testes |
| #256 | identidade visual das skills do Guerreiro | mergeado | Card Resolver, loader e testes |
| #259 | protocolo de validacao do nucleo v2.2 | mergeado | documentacao e governanca da validacao |
| #260 | harness inicial de simulacao | mergeado | simulacao quantitativa |
| #262 | consolidacao do harness oficial | mergeado | remove caminho concorrente |
| #263 | paridade do harness com Wild e Group | mergeado | matriz da formula-base |
| #264 | passivas de especie Wild versus Group | mergeado | contrato comum e drifts caracterizados |

## Decisoes aprovadas ainda nao implementadas

- `DEC-SPECIES-ATK-01`: `atkBonus` de especie modifica o ATK antes da formula; Group precisa de correcao.
- `DEC-SPECIES-DEF-01`: resistencia percentual ocorre antes da reducao plana de `shieldhorn`; Wild precisa de correcao.

Fonte: `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.

## Decisoes pendentes

- `DEC-COMBAT-A`: estrategia de calibracao entre PWR e catalogo.
- `DEC-COMBAT-D`: destino do premio aleatorio de UX no critico.
- `DEC-AUTH-01`: separar formalmente autoridade normativa e descritiva.
- `DEC-AUTH-02`: identificar e versionar o "Documento Mestre" citado pelo Patch v2.2.
- `DEC-DRIVE-01`: revisar os 34 nomes editoriais ainda em `needs_verification`.

## Fase atual recomendada

A fase permanece **Validacao do Nucleo Jogavel - Combate v2.2**.

O proximo PR tecnico deve ser unico e limitado a:

```text
fix(combat): aplicar atkBonus de especie antes da formula no Group
```

Depois dele:

1. alinhar a ordem defensiva de `shieldhorn` no Wild;
2. despachar eventos de especie nas skills Group;
3. executar novamente a paridade;
4. revisar a baseline quantitativa;
5. realizar playtest mediado.

Protocolos: `docs/VALIDACAO_NUCLEO_JOGAVEL_V2_2.md` e `docs/PLAYTEST_TEMPLATE_V2_2.md`.

## Validacao tecnica

Os numeros de testes registrados em auditorias e PRs sao snapshots, nao invariantes permanentes. Antes de uma alteracao tecnica, execute:

```bash
npm test
npm run test:combat-simulation-v2-2
npm run test:combat-parity-v2-2
npm run test:species-passive-parity-v2-2
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Execute `npm run test:wild-loop` quando as dependencias do Playwright estiverem disponiveis.

## Gatilhos para revisao

Atualizar este arquivo quando ocorrer:

- implementacao de `DEC-SPECIES-ATK-01` ou `DEC-SPECIES-DEF-01`;
- correcao das skills Group para passivas de especie;
- conclusao da validacao quantitativa do combate v2.2;
- mudanca relevante em codigo ou dados runtime;
- decisao sobre PWR, critico, valores das passivas, energia ou boss;
- aprovacao dos nomes editoriais pendentes;
- PR de migracao de nomes para o runtime;
- alteracao dos comandos oficiais de teste;
- novo marco tecnico que torne esta fotografia materialmente incorreta.
