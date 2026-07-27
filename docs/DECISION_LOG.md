# Monstrinhomon - Registro de Decisoes

Este arquivo e um indice. Regras detalhadas permanecem no documento canonico ou ADR vinculado.

## Estados

- `PENDING`: exige decisao humana.
- `APPROVED`: decisao humana registrada, ainda sem implementacao completa.
- `IMPLEMENTED`: aprovada e presente na `main`.
- `PARTIAL`: apenas parte da decisao esta na `main` ou parte do escopo permanece aberta.
- `SUPERSEDED`: substituida por outra decisao.
- `REJECTED`: explicitamente nao adotada.

## Decisoes

| ID | Data | Estado | Dominio | Resumo | Fonte | Implementacao |
|---|---|---|---|---|---|---|
| `DEC-COMBAT-B` | 2026-05-29 | PARTIAL | passivas de classe | manter passivas fracas, explicitas e fora das cartas por enquanto | `docs/DECISAO_B_PASSIVAS_CLASSE_2026-05.md` | conceito ativo; valores ainda nao recalibrados |
| `DEC-COMBAT-A` | - | PENDING | PWR e catalogo | escolher estrategia de calibracao | Patch v2.2, Decisao A | aguarda validacao quantitativa do nucleo v2.2 |
| `DEC-COMBAT-D` | - | PENDING | critico | manter, remover ou formalizar premio aleatorio de UX | Patch v2.2, Decisao D | aguarda validacao quantitativa do critico |
| `DEC-SPECIES-ATK-01` | 2026-07-27 | APPROVED | passivas de especie | `atkBonus` modifica o ATK efetivo antes da formula de dano | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Wild e referencia atual; correcao do Group pendente |
| `DEC-SPECIES-DEF-01` | 2026-07-27 | APPROVED | passivas de especie | reducao percentual de classe ocorre antes da reducao plana de `shieldhorn` | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | Group e referencia atual; correcao do Wild pendente |
| `DEC-FIELDS-01` | 2026-04-07 | PARTIAL | SPD/AGI | manter `spd` como campo tecnico ate eventual migracao aprovada | Patch v2.2 | `spd` ativo no runtime |
| `DEC-CARDS-01` | 2026-05-19 | PARTIAL | Card Layer | piloto visual sem duplicar mecanica | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` | identidade tecnica estabilizada no PR #256; QA publicado e encerramento do piloto pendentes |
| `DEC-TRADE-01` | 2026-05-26 | IMPLEMENTED | Trade | manter um unico caminho runtime de Trade | PR #250 e testes arquiteturais | mergeado na `main` |
| `DEC-AUTH-01` | - | PENDING | governanca | separar autoridade normativa de autoridade descritiva | auditoria de governanca 2026-06-22 | nao adotada |
| `DEC-AUTH-02` | - | PENDING | governanca | identificar e versionar o "Documento Mestre" citado pelo Patch | auditoria de governanca 2026-06-22 | nao adotada |
| `DEC-DRIVE-01` | 2026-06-23 | PARTIAL | catalogo editorial | manter a Dex v3 como proposta editorial ativa; classificar o restante do acervo do Drive | [documento de decisao no Drive](https://docs.google.com/document/d/1N4msx5Wa_IazEwj5k9fYcOD9JwZBJJ86iFkfptifpDA/edit) | Drive organizado; 44 nomes marcados `canonical`, 34 ainda em `needs_verification`; nenhuma mudanca runtime autorizada |

## Decisoes do pipeline das passivas de especie

As decisoes `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` foram registradas apos a caracterizacao mergeada no PR #264.

Elas definem apenas:

- a etapa do pipeline em que `atkBonus` de especie deve entrar;
- a ordem entre resistencia percentual de classe e reducao plana de `shieldhorn`.

Elas nao alteram valores, gatilhos, skills, balanceamento ou runtime por si mesmas. O estado permanece `APPROVED` ate os PRs tecnicos correspondentes serem integrados.

## Marco tecnico sem nova decisao de regra

Em 2026-07-27, o PR #256 foi integrado em `e9e003a43d695ab83fbd913dc96af24735c73ae7`.

Esse merge:

- preserva `id`, `class`, `groupKey` e `stageIndex` no runtime de skills;
- remove inferencia visual baseada em nome;
- mantem aliases explicitos para kit swaps;
- nao altera dano, custo, alvo ou efeito mecanico das habilidades;
- nao encerra sozinho o piloto de produto da Card Layer.

O PR #255 ja havia integrado a formula bilateral v2.2 no Wild. A integracao tecnica nao decide calibracao de PWR, premio do critico, valores das passivas, regeneracao de ENE ou balanceamento de bosses.

## Limites da DEC-DRIVE-01

- `canonical` na Dex v3 significa aprovacao editorial do nome, nao implementacao tecnica.
- A Dex v3 nao possui autoridade sobre codigo, IDs runtime, atributos, classes, raridades, evolucao, dual class, sprites ou estado de importacao.
- Uma divergencia de nome em relacao a `main` exige decisao registrada, migracao em PR proprio e testes adequados.
- Os 34 nomes em `needs_verification` continuam abertos e devem ser revisados por familia.

## Regra de interpretacao

- `APPROVED` nao significa implementado.
- `PARTIAL` exige leitura da coluna de implementacao.
- PR aberto nunca muda sozinho o estado para `IMPLEMENTED`.
- Merge tecnico nao encerra automaticamente validacao de produto ou balanceamento.
- Exemplos ou recomendacoes presentes em auditorias nao sao decisoes humanas.

## Como registrar uma nova decisao

1. Criar documento de discussao no Drive enquanto as opcoes estiverem abertas.
2. Registrar contexto, evidencias, alternativas, impactos e recomendacao.
3. Obter aprovacao explicita do responsavel humano.
4. Atualizar esta tabela em PR.
5. Vincular documento canonico ou ADR no GitHub.
6. Marcar `IMPLEMENTED` somente depois do merge do codigo ou dado correspondente.
