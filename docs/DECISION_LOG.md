# Monstrinhomon — Registro de Decisões

**Status:** ACTIVE  
**Atualizado:** 2026-08-26

Este arquivo é um índice. Regras detalhadas permanecem no documento canônico ou ADR vinculado.

## Estados

- `PENDING`: exige decisão humana.
- `APPROVED`: decisão humana registrada, ainda sem implementação completa.
- `IMPLEMENTED`: aprovada e presente na `main`.
- `PARTIAL`: apenas parte da decisão está na `main` ou parte do escopo permanece aberta.
- `SUPERSEDED`: substituída por outra decisão.
- `REJECTED`: explicitamente não adotada.

## Decisões

| ID | Data | Estado | Domínio | Resumo | Fonte | Implementação |
|---|---|---|---|---|---|---|
| `DEC-COMBAT-B` | 2026-05-29 | PARTIAL | passivas de classe | manter passivas fracas, explícitas e fora das cartas por enquanto | `docs/DECISAO_B_PASSIVAS_CLASSE_2026-05.md` | conceito ativo; valores ainda não recalibrados |
| `DEC-COMBAT-A` | — | PENDING | PWR e catálogo | escolher estratégia de calibração | Patch v2.2, Decisão A | aguarda evidência de playtest e decisão humana |
| `DEC-COMBAT-D` | — | PENDING | crítico | manter, remover ou formalizar prêmio aleatório de UX | Patch v2.2, Decisão D | aguarda validação específica do crítico |
| `DEC-SPECIES-ATK-01` | 2026-07-27 | IMPLEMENTED | passivas de espécie | `atkBonus` modifica o ATK efetivo antes da fórmula | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Wild e Group alinhados; PR #266 |
| `DEC-SPECIES-DEF-01` | 2026-07-27 | IMPLEMENTED | passivas de espécie | redução percentual de classe ocorre antes da redução plana de `shieldhorn` | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Wild e Group alinhados; PR #273 |
| `DEC-FIELDS-01` | 2026-04-07 | PARTIAL | SPD/AGI | manter `spd` como campo técnico até eventual migração aprovada | Patch v2.2 | `spd` ativo no runtime |
| `DEC-CARDS-01` | 2026-05-19 | PARTIAL | Card Layer | piloto visual sem duplicar mecânica | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` | identidade técnica estabilizada; QA de produto pendente |
| `DEC-CARDS-VISION-01` | 2026-07-30 | APPROVED | visão do sistema de cartas | combinar RPG tático simples, posicionamento, cartas como habilidades e deckbuilding leve; garantir ação possível sem depender de ENE ou mão perfeita | `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md` | Card Layer visual implementada parcialmente; deck, mão, tabuleiro e economia exata permanecem pendentes |
| `DEC-TRADE-01` | 2026-05-26 | IMPLEMENTED | Trade | manter um único caminho runtime de Trade | PR #250 e testes arquiteturais | mergeado na `main` |
| `DEC-AUTH-01` | — | PENDING | governança | formalizar separação entre autoridade normativa e descritiva | auditoria de governança 2026-06-22 | prática operacional existe; decisão formal ainda aberta |
| `DEC-AUTH-02` | — | PENDING | governança | definir destino do antigo “Documento Mestre” | auditoria de governança 2026-06-22 | cópias antigas não possuem autoridade automática |
| `DEC-DRIVE-01` | 2026-06-23 | PARTIAL | catálogo editorial | manter Dex v3 como proposta editorial ativa e classificar o restante do acervo | [documento de decisão no Drive](https://docs.google.com/document/d/1N4msx5Wa_IazEwj5k9fYcOD9JwZBJJ86iFkfptifpDA/edit) | Drive organizado; nomes pendentes; nenhuma migração runtime automática |
| `DEC-CATALOG-MON-100-01` | 2026-08-25 | IMPLEMENTED | catálogo/runtime | descontinuar `MON_100` para conteúdo novo, preservando lookup e saves existentes | `docs/DECISAO_DESCONTINUACAO_MON_100_2026-08.md` | PR #283 integrado à `main` em `6d59d876` |

## Estado das passivas de espécie

As decisões `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` foram:

1. caracterizadas no PR #264;
2. aprovadas documentalmente;
3. implementadas nos PRs #266 e #273;
4. revalidadas no PR #275;
5. medidas quantitativamente no PR #278.

A implementação dessas decisões não altera automaticamente valores, gatilhos ou balanceamento das passivas.

## Estado da visão híbrida de cartas

`DEC-CARDS-01` e `DEC-CARDS-VISION-01` respondem a perguntas diferentes:

- `DEC-CARDS-01` define o escopo técnico do piloto atual: Card Layer visual sem deck, mão, compra ou descarte nesta fase;
- `DEC-CARDS-VISION-01` define a direção de produto: a fundação visual deverá futuramente integrar um RPG tático simples com deckbuilding leve e posicionamento.

A ausência de deck no piloto não significa rejeição do deck no produto.

Estão aprovados como princípios:

- cartas funcionam como habilidades;
- deckbuilding deve ser leve;
- posicionamento deve permanecer acessível;
- deve existir ao menos uma ação legal quando ENE ou mão limitarem as opções;
- a fonte mecânica de skills deve permanecer única;
- implementação deve ocorrer em fases.

Permanecem pendentes:

- tamanho do deck e da mão;
- compra e descarte;
- ação básica fora do deck ou carta permanente;
- quantidade de cartas sem ENE;
- grade, movimento e ocupação;
- economia exata de ENE;
- primeiro conjunto jogável.

## Marcos técnicos sem nova decisão de regra

- PR #255: fórmula bilateral v2.2 integrada no Wild.
- PR #256: identidade efetiva das skills do Guerreiro preservada na Card Layer.
- PR #274: eventos de passivas de espécie integrados nas skills Group.
- PR #275: matriz final de paridade das espécies.
- PR #276: comparação quantitativa pós-paridade.
- PR #278: matriz quantitativa dedicada às oito passivas de espécie.

Esses merges não decidem PWR, prêmio do crítico, regeneração de ENE, valores das passivas, boss ou regras exatas da fase híbrida de cartas.

## Limites da `DEC-DRIVE-01`

- `canonical` na Dex v3 significa aprovação editorial do nome, não implementação técnica.
- A Dex v3 não possui autoridade sobre código, IDs runtime, atributos, classes, raridades, evolução, sprites ou estado de importação.
- Divergência de nome exige decisão registrada, migração em PR próprio e testes.

## Regra de interpretação

- `APPROVED` não significa implementado.
- `PARTIAL` exige leitura da coluna de implementação.
- PR aberto nunca muda sozinho o estado para `IMPLEMENTED`.
- Merge técnico não encerra automaticamente validação de produto ou balanceamento.
- Auditorias, anexos do ChatGPT e propostas do Drive não são decisões humanas por si mesmos.
- Uma reafirmação explícita do autor pode aprovar uma direção de produto sem aprovar todos os números presentes nos documentos de apoio.

## Como registrar uma nova decisão

1. discutir no Drive enquanto as opções estiverem abertas;
2. registrar contexto, evidências, alternativas e impactos;
3. obter aprovação explícita do responsável humano;
4. atualizar esta tabela em PR;
5. vincular documento canônico ou ADR no GitHub;
6. marcar `IMPLEMENTED` somente depois do merge correspondente.
