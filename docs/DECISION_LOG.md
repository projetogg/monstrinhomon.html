# Monstrinhomon — Registro de Decisões

**Status:** ACTIVE  
**Atualizado:** 2026-07-30

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
| `DEC-TRADE-01` | 2026-05-26 | IMPLEMENTED | Trade | manter um único caminho runtime de Trade | PR #250 e testes arquiteturais | mergeado na `main` |
| `DEC-AUTH-01` | — | PENDING | governança | formalizar separação entre autoridade normativa e descritiva | auditoria de governança 2026-06-22 | prática operacional existe; decisão formal ainda aberta |
| `DEC-AUTH-02` | — | PENDING | governança | definir destino do antigo “Documento Mestre” | auditoria de governança 2026-06-22 | cópias antigas não possuem autoridade automática |
| `DEC-DRIVE-01` | 2026-06-23 | PARTIAL | catálogo editorial | manter Dex v3 como proposta editorial ativa e classificar o restante do acervo | documento de decisão no Drive | Drive organizado; nomes pendentes; nenhuma migração runtime automática |

## Estado das passivas de espécie

As decisões `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` foram:

1. caracterizadas no PR #264;
2. aprovadas documentalmente;
3. implementadas nos PRs #266 e #273;
4. revalidadas no PR #275;
5. medidas quantitativamente no PR #278.

A implementação dessas decisões não altera automaticamente valores, gatilhos ou balanceamento das passivas.

## Marcos técnicos sem nova decisão de regra

- PR #255: fórmula bilateral v2.2 integrada no Wild.
- PR #256: identidade efetiva das skills do Guerreiro preservada na Card Layer.
- PR #274: eventos de passivas de espécie integrados nas skills Group.
- PR #275: matriz final de paridade das espécies.
- PR #276: comparação quantitativa pós-paridade.
- PR #278: matriz quantitativa dedicada às oito passivas de espécie.

Esses merges não decidem PWR, prêmio do crítico, regeneração de ENE, valores das passivas, boss ou encerramento de QA de produto.

## Limites da `DEC-DRIVE-01`

- `canonical` na Dex v3 significa aprovação editorial do nome, não implementação técnica.
- A Dex v3 não possui autoridade sobre código, IDs runtime, atributos, classes, raridades, evolução, sprites ou estado de importação.
- Divergência de nome exige decisão registrada, migração em PR próprio e testes.

## Regra de interpretação

- `APPROVED` não significa implementado.
- `PARTIAL` exige leitura da coluna de implementação.
- PR aberto nunca muda sozinho o estado para `IMPLEMENTED`.
- Merge técnico não encerra automaticamente validação de produto ou balanceamento.
- Auditorias, anexos do ChatGPT e propostas do Drive não são decisões humanas.

## Como registrar uma nova decisão

1. discutir no Drive enquanto as opções estiverem abertas;
2. registrar contexto, evidências, alternativas e impactos;
3. obter aprovação explícita do responsável humano;
4. atualizar esta tabela em PR;
5. vincular documento canônico ou ADR no GitHub;
6. marcar `IMPLEMENTED` somente depois do merge correspondente.
