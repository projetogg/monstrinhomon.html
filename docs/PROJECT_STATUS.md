# Monstrinhomon - Estado do Projeto

**Verificado em:** 2026-06-22  
**Branch oficial examinada:** `main`  
**Commit-base:** `8b27a3a5702bf114dcb1a337bd9029c53579ac5f`  
**Escopo:** este arquivo descreve o repositorio; nao cria regras do jogo.

## Baseline atual

- Aplicacao em JavaScript executada no navegador.
- Dados runtime em `data/`, conforme os loaders efetivamente usados.
- Testes Vitest, validadores de dados/assets e smoke tests definidos em `package.json`.
- GitHub como fonte tecnica oficial.
- Google Drive como espaco de produto, discussao, playtest, observacao e referencia visual.

## Implementado na main

| Dominio | Estado observado | Evidencia principal |
|---|---|---|
| Trade | caminho runtime unico | `js/combat/tradeSystem.js`, `js/ui/tradeUI.js`, PR #250 |
| Formula Group | confronto bilateral v2.2 | `js/combat/groupCombatFormula.js` |
| Formula Wild | formula anterior ainda ativa | `js/combat/wildActions.js`, testes de caracterizacao |
| Passivas de classe | conceito e valores atuais presentes | `wildActions.js`, runtime Group e Decisao B |
| Catalogo de Cards | 3 Cards visuais do Guerreiro | `data/cards.json` |
| Card Layer | piloto atras de feature flag/query param | `js/cards/*` |
| Save/load | camadas complementares de persistencia | `js/saveLayer.js`, `js/storage.js` e testes |

## Divergencias conhecidas

| ID | Regra pretendida | Comportamento da main | Estado |
|---|---|---|---|
| DIV-COMBAT-01 | Wild seguir formula v2.2 | Wild ainda usa caminho anterior | aberto; PR #255 em draft |
| DIV-ENE-01 | tabela canonica de regeneracao | 7 de 8 classes divergiam na ultima auditoria | aberto |
| DIV-PASSIVE-01 | impacto inicialmente fraco, em torno de 3% a 5% | runtime ainda possui valores de 10% a 15% | aberto |
| DIV-BOSS-01 | multiplicadores canonicos de boss | implementacao nao foi confirmada integralmente | investigar |
| DIV-CARDS-01 | skills efetivas do Guerreiro mapearem de forma confiavel | lacunas de identidade permanecem na main | PR #256 em draft |

## Pull requests abertos relevantes

Pull requests abaixo nao integram o baseline oficial.

| PR | Tema | Estado em 2026-06-22 | Possivel impacto |
|---|---|---|---|
| #255 | migracao da formula Wild para v2.2 | aberto, draft | combate e testes |
| #256 | identidade visual das skills do Guerreiro | aberto, draft | Card Resolver e testes |

## Decisoes pendentes

- `DEC-COMBAT-A`: estrategia de calibracao entre PWR e catalogo.
- `DEC-COMBAT-D`: destino do premio aleatorio de UX no critico.
- `DEC-AUTH-01`: separar formalmente autoridade normativa e descritiva.
- `DEC-AUTH-02`: identificar e versionar o "Documento Mestre" citado pelo Patch v2.2.
- `DEC-DRIVE-01`: definir se alguma planilha v3 do Drive permanece como proposta ativa.

## Validacao

Os numeros de testes registrados em auditorias e PRs sao snapshots, nao invariantes permanentes. Antes de uma alteracao tecnica, execute:

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Execute `npm run test:wild-loop` quando as dependencias do Playwright estiverem disponiveis.

## Limites desta fotografia

A suite nao foi executada novamente durante a auditoria documental que originou este arquivo. O checkout por terminal nao estava disponivel; foram usados a `main`, os arquivos acessiveis e o historico do GitHub.

## Gatilhos para revisao

Atualizar este arquivo quando ocorrer:

- merge ou fechamento dos PRs #255 ou #256;
- mudanca relevante em codigo ou dados runtime;
- aprovacao de uma decisao listada;
- alteracao dos comandos oficiais de teste;
- novo marco tecnico que torne esta fotografia materialmente incorreta.
