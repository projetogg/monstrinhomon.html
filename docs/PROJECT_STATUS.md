# Monstrinhomon - Estado do Projeto

**Verificado em:** 2026-07-27  
**Branch oficial examinada:** `main`  
**Marco tecnico:** PR #256 mergeado em `e9e003a43d695ab83fbd913dc96af24735c73ae7`  
**Escopo:** este arquivo descreve o repositorio; nao cria regras do jogo.

## Baseline atual

- Aplicacao em JavaScript executada no navegador.
- Dados runtime em `data/`, conforme os loaders efetivamente usados.
- Testes Vitest, validadores de dados/assets e smoke tests definidos em `package.json`.
- GitHub como fonte tecnica oficial.
- Google Drive como espaco de produto, discussao, playtest, observacao e referencia visual.
- Portal do Drive e estrutura documental inicial criados e classificados.
- Nenhum pull request aberto relevante no momento desta verificacao.

## Implementado na main

| Dominio | Estado observado | Evidencia principal |
|---|---|---|
| Trade | caminho runtime unico | `js/combat/tradeSystem.js`, `js/ui/tradeUI.js`, PR #250 |
| Formula Group | confronto bilateral v2.2 | `js/combat/groupCombatFormula.js` |
| Formula Wild | migrada para confronto bilateral v2.2 | `js/combat/wildActions.js`, PR #255 |
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
| DIV-COMBAT-01 | Wild e Group compartilharem a formula v2.2 | ambos usam a base bilateral v2.2 | resolvida tecnicamente; balanceamento ainda nao validado |
| DIV-ENE-01 | tabela canonica de regeneracao | 7 de 8 classes divergiam na ultima auditoria | aberto |
| DIV-PASSIVE-01 | impacto inicialmente fraco, em torno de 3% a 5% | runtime ainda possui valores de 10% a 15% | aberto |
| DIV-BOSS-01 | multiplicadores canonicos de boss | implementacao nao foi confirmada integralmente | investigar |
| DIV-CARDS-01 | skills efetivas do Guerreiro mapearem de forma confiavel | identidade preservada no loader e aliases explicitos de kit swap | resolvida tecnicamente no PR #256; QA de produto pendente |
| DIV-NAMES-01 | 44 nomes aprovados editorialmente na Dex v3 | a `main` pode usar nomes diferentes | mapear divergencias antes de qualquer migracao |

## Pull requests recentes relevantes

Pull requests mergeados passam a integrar o baseline oficial.

| PR | Tema | Estado em 2026-07-27 | Impacto |
|---|---|---|---|
| #255 | migracao da formula Wild para v2.2 | mergeado | combate Wild e testes |
| #256 | identidade visual das skills do Guerreiro | mergeado | Card Resolver, loader e testes |
| #257 | governanca e entrypoint | mergeado | documentacao |
| #258 | decisao parcial da Dex v3 | mergeado | governanca editorial |

## Decisoes pendentes

- `DEC-COMBAT-A`: estrategia de calibracao entre PWR e catalogo.
- `DEC-COMBAT-D`: destino do premio aleatorio de UX no critico.
- `DEC-AUTH-01`: separar formalmente autoridade normativa e descritiva.
- `DEC-AUTH-02`: identificar e versionar o "Documento Mestre" citado pelo Patch v2.2.
- `DEC-DRIVE-01`: revisar os 34 nomes editoriais ainda em `needs_verification`.

## Fase atual recomendada

A proxima fase e **Validacao do Nucleo Jogavel - Combate v2.2**.

O objetivo e medir, sem alterar balanceamento nesta etapa:

- TTK;
- dano medio e variancia;
- impacto do critico;
- impacto das passivas;
- energia;
- vantagem de classe;
- bosses;
- equivalencia Wild versus Group;
- clareza da experiencia em playtest mediado.

Protocolos: `docs/VALIDACAO_NUCLEO_JOGAVEL_V2_2.md` e `docs/PLAYTEST_TEMPLATE_V2_2.md`.

## Validacao tecnica

Os numeros de testes registrados em auditorias e PRs sao snapshots, nao invariantes permanentes. Antes de uma alteracao tecnica, execute:

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Execute `npm run test:wild-loop` quando as dependencias do Playwright estiverem disponiveis.

O workflow `Tests (Vitest)` do head revisado do PR #256 foi concluido com sucesso antes do merge. Esta atualizacao documental nao reexecuta localmente toda a suite.

## Gatilhos para revisao

Atualizar este arquivo quando ocorrer:

- conclusao da validacao quantitativa do combate v2.2;
- mudanca relevante em codigo ou dados runtime;
- decisao sobre PWR, critico, passivas, energia ou boss;
- aprovacao dos nomes editoriais pendentes;
- PR de migracao de nomes para o runtime;
- alteracao dos comandos oficiais de teste;
- novo marco tecnico que torne esta fotografia materialmente incorreta.
