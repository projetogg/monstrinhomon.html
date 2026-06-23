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
| `DEC-COMBAT-A` | - | PENDING | PWR e catalogo | escolher estrategia de calibracao | Patch v2.2, Decisao A | bloqueado |
| `DEC-COMBAT-D` | - | PENDING | critico | manter, remover ou formalizar premio aleatorio de UX | Patch v2.2, Decisao D | Wild diverge do modelo pretendido |
| `DEC-FIELDS-01` | 2026-04-07 | PARTIAL | SPD/AGI | manter `spd` como campo tecnico ate eventual migracao aprovada | Patch v2.2 | `spd` ativo no runtime |
| `DEC-CARDS-01` | 2026-05-19 | PARTIAL | Card Layer | piloto visual sem duplicar mecanica | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` | piloto existe; estabilidade pendente |
| `DEC-TRADE-01` | 2026-05-26 | IMPLEMENTED | Trade | manter um unico caminho runtime de Trade | PR #250 e testes arquiteturais | mergeado na `main` |
| `DEC-AUTH-01` | - | PENDING | governanca | separar autoridade normativa de autoridade descritiva | auditoria de governanca 2026-06-22 | nao adotada |
| `DEC-AUTH-02` | - | PENDING | governanca | identificar e versionar o "Documento Mestre" citado pelo Patch | auditoria de governanca 2026-06-22 | nao adotada |
| `DEC-DRIVE-01` | 2026-06-23 | PARTIAL | catalogo editorial | manter a Dex v3 como proposta editorial ativa; classificar o restante do acervo do Drive | [documento de decisao no Drive](https://docs.google.com/document/d/1N4msx5Wa_IazEwj5k9fYcOD9JwZBJJ86iFkfptifpDA/edit) | Drive organizado; 44 nomes marcados `canonical`, 34 ainda em `needs_verification`; nenhuma mudanca runtime autorizada |

## Limites da DEC-DRIVE-01

- `canonical` na Dex v3 significa aprovacao editorial do nome, nao implementacao tecnica.
- A Dex v3 nao possui autoridade sobre codigo, IDs runtime, atributos, classes, raridades, evolucao, dual class, sprites ou estado de importacao.
- Uma divergencia de nome em relacao a `main` exige decisao registrada, migracao em PR proprio e testes adequados.
- Os 34 nomes em `needs_verification` continuam abertos e devem ser revisados por familia.

## Regra de interpretacao

- `APPROVED` nao significa implementado.
- `PARTIAL` exige leitura da coluna de implementacao.
- PR aberto nunca muda sozinho o estado para `IMPLEMENTED`.
- Exemplos ou recomendacoes presentes em auditorias nao sao decisoes humanas.

## Como registrar uma nova decisao

1. Criar documento de discussao no Drive enquanto as opcoes estiverem abertas.
2. Registrar contexto, evidencias, alternativas, impactos e recomendacao.
3. Obter aprovacao explicita do responsavel humano.
4. Atualizar esta tabela em PR.
5. Vincular documento canonico ou ADR no GitHub.
6. Marcar `IMPLEMENTED` somente depois do merge do codigo ou dado correspondente.
