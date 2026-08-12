# Monstrinhomon V2 — Backend privado — Etapa 11

**Status:** PROPOSAL  
**Domain:** técnica  
**Authority:** GitHub após merge  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** nenhum

## 1. Escopo

A Etapa 11 cria a fundação técnica do Sistema de Personagens V2 em Google Sheets privado + Apps Script Services. Ela não substitui o save browser-side atual e não implementa o motor terapêutico→lúdico da Etapa 12.

```text
Runtime atual                           V2 operacional
GameState                               Player/Objective/Session/...
   ↓                                          ↓
SaveLayer                               Apps Script Services
   ↓                                          ↓
StorageManager                          Google Sheets privado
   ↓
localStorage
```

## 2. Baseline

- `main` observada no início: `d73f81f401dded14587282c2c76aef424c69a408`.
- `PROJECT_STATUS.md` ainda está datado no commit anterior e o PR #281 de governança está aberto.
- A fase oficial continua sendo validação/playtest do combate v2.2.
- Trabalho da Etapa 11 está isolado em `feat/v2-backend-stage11`.

## 3. Backends privados

Foram criados dois Spreadsheets privados distintos:

- Backend DEV;
- Backend PROD.

Os IDs/URLs privados não são versionados no repositório. O projeto Apps Script recebe o ID por Script Properties.

## 4. Sheets físicas

| Sheet | Responsabilidade |
|---|---|
| `00_SYSTEM` | versão e metadados do backend |
| `01_ACCESS` | allowlist e roles |
| `02_PLAYERS` | identidade operacional do Player |
| `03_ATTRIBUTE_DEFINITIONS` | atributos lúdicos universais |
| `04_PLAYER_ATTRIBUTES` | estado atual por Player+Attribute |
| `05_MONSTER_INSTANCES` | instâncias persistentes/organização V2 |
| `06_INVENTORY_HOLDINGS` | quantidade livre por Player+Item |
| `07_OBJECTIVES` | identidade durável de objetivos |
| `08_OBJECTIVE_VERSIONS` | regra histórica imutável |
| `09_SESSIONS` | sessões, conclusão e reabertura |
| `10_OBSERVATIONS` | observações revisionadas |
| `11_EVENTS` | ledger append-only |
| `12_OPERATIONS` | idempotência/operações |
| `13_RUNTIME_CACHE` | cache reconstruível do GitHub |
| `14_SCHEMA_MIGRATIONS` | histórico de schema |

O `SchemaRegistry.gs` é a definição técnica versionada. A planilha é uma instância desse schema.

## 5. Chaves

- IDs não dependem de linha, nome ou posição.
- Prefixos são apenas legibilidade; UUID é a identidade.
- Chaves lógicas críticas:
  - PlayerAttribute: `PlayerID + AttributeID`;
  - InventoryHolding: `PlayerID + ItemID`;
  - ObjectiveVersion: `ObjectiveID + RevisionNumber`;
  - Observation revision: `ObservationChainID + RevisionNumber`;
  - Operation: `IdempotencyKey`.

## 6. Ownership de dados

| Dado | V2 | Runtime | Cache/adapter |
|---|---:|---:|---:|
| DisplayName | ✓ |  |  |
| atributos lúdicos | ✓ |  |  |
| Objectives/Sessions/Observations | ✓ |  |  |
| Events/Operations | ✓ |  |  |
| posição Team/Box V2 | ✓ | integração pendente | ✓ |
| Monster Level/XP |  | ✓/integração pendente | ✓ |
| HP/ENE/buffs/status |  | ✓ |  |
| species/item definitions |  | ✓ | cache reconstruível |
| Inventory quantity V2 | ✓ | integração pendente | ✓ |
| skills/passivas |  | ✓ | cache/referência apenas |

Level/XP não foram promovidos a colunas autoritativas da V2 nesta etapa.

## 7. Autenticação

A conta proprietária atual é de consumidor (`gmail.com`). Pela documentação do Apps Script, `Session.getActiveUser().getEmail()` pode retornar vazio em Web Apps que executam como o desenvolvedor. A direção técnica do MVP é:

1. Web App executa como usuário que acessa;
2. usuário autoriza o Apps Script;
3. `Session.getActiveUser().getEmail()` identifica o usuário;
4. `01_ACCESS` valida `ACTIVE` + role;
5. backend privado também deve ser compartilhado apenas com usuários autorizados que precisem executar os serviços sob a própria identidade.

`Adventure Mode` nunca é usado como autenticação.

## 8. Permissions

| Ação | Adventure projection | Therapist | Admin |
|---|---:|---:|---:|
| ler Ficha infantil | ✓ via sessão profissional | ✓ | ✓ |
| ler Registro |  | ✓ | ✓ |
| abrir/concluir/reabrir Session |  | ✓ | ✓ |
| criar Observation |  | ✓ | ✓ |
| criar Objective/Version |  | ✓ | ✓ |
| criar Player |  |  | ✓ (provisório) |
| arquivar Player |  |  | ✓ |
| health check |  | ✓ | ✓ |
| integrity/seed |  |  | ✓ |

A permissão de criação de Player por ADMIN é uma escolha conservadora da fundação e pode ser revista como decisão de produto antes de produção.

## 9. Mutabilidade

| Entidade | Update normal | Append-only/imutável |
|---|---:|---:|
| Player | ✓ com Version |  |
| PlayerAttributeState | ✓ |  |
| MonsterInstance | ✓ |  |
| InventoryHolding | ✓ |  |
| Objective | ✓/archive |  |
| ObjectiveVersion |  | ✓ |
| Session | ✓ com Version |  |
| Observation revision |  | ✓ |
| Event |  | ✓ |
| Operation | lifecycle controlado | histórico preservado |
| SchemaMigration |  | ✓ |

## 10. Sessão e reabertura

A decisão do autor de permitir reabertura foi preservada:

```text
COMPLETED -> reopen(reason) -> OPEN
```

- motivo obrigatório;
- `ReopenCount` e último reopen ficam no estado materializado;
- um Event `SESSION_REOPENED` preserva cada reabertura no histórico;
- Observations existentes não são sobrescritas; correções criam nova revisão.

## 11. Observations

A Etapa 11 valida apenas a estrutura do payload. Tipos MVP:

- `OPPORTUNITY_RATIO`;
- `COUNT`;
- `DURATION`;
- `LATENCY`;
- `BINARY`.

A Etapa 11 **não calcula recompensa**.

## 12. Concorrência

Google Sheets não é tratado como banco ACID.

A fundação usa:

- `LockService.getScriptLock()` em writes críticos;
- `Version` + `expectedVersion` para entidades mutáveis;
- `CONFLICT` em edição concorrente;
- `Operations` para idempotência;
- Events/revisions para compensação em vez de overwrite histórico.

## 13. Cache runtime

`RuntimeReferenceService` pode reconstruir um domínio a partir de um JSON array no GitHub público, gravando:

- `SourcePath`;
- `SourceRef`;
- hash do payload;
- payload JSON;
- timestamp.

O cache nunca vence a fonte runtime.

## 14. Logging e privacidade

- código e fixtures do GitHub não recebem dados reais;
- logs devem preferir IDs em vez de DisplayName;
- DTO infantil não envia Objectives, Sessions, Observations, Criterion ou ShortNote;
- Script Properties guardam IDs/configuração de ambiente fora do GitHub.

## 15. Validação implementada

- schema/header check;
- health check;
- integridade lógica;
- duplicate logical keys;
- quantidade negativa;
- múltiplas Sessions OPEN;
- referências órfãs principais;
- cross-player Observation;
- FeaturedMonster inválido;
- reversal inválido;
- teste Vitest do Schema Registry;
- compilação sintática de todos os `.gs` no teste Node.

## 16. Smoke DEV

`v2RunDevelopmentSmokeTest_()` cria somente dados sintéticos e valida:

1. Player;
2. Objective;
3. ObjectiveVersion;
4. Session;
5. Observation;
6. conclusão;
7. reabertura;
8. nova conclusão;
9. archive do Player;
10. health + integrity.

Ele recusa execução em PROD.

## 17. Divergências preservadas

Não resolvidas na Etapa 11:

- Box runtime (`sharedBox` x `player.box`);
- aliases de MonsterInstance;
- ownership final de Level/XP;
- divergência de `revive`;
- sistema terapêutico antigo de PM/medalhas;
- integração runtime ↔ V2.

## 18. Riscos

1. Executar Web App como usuário exige permissões Google adequadas no backend.
2. Sheets não oferece transação relacional; lock/idempotência precisam de testes de carga real.
3. `01_ACCESS` é uma segunda gate, não substitui compartilhamento/permissão Google.
4. Apps Script tem quotas e limite por execução; chamadas devem continuar em batch.
5. O backend ainda não possui projeto/deployment Apps Script criado automaticamente por esta execução.

## 19. Rollback

- nenhuma mudança foi feita em `main`;
- branch pode ser abandonada/revertida sem alterar runtime;
- DEV/PROD privados ainda não contêm dados infantis;
- planilhas podem ser descartadas se o schema mudar antes do piloto;
- `monstrinhomon_state` não foi tocado.

## 20. Critério de saída

A Etapa 11 só deve virar `IMPLEMENTED` depois de:

- projeto Apps Script real criado e configurado;
- source da branch publicado no projeto;
- Script Properties configuradas sem expor IDs no GitHub;
- Web App DEV implantado com identidade correta;
- health/integrity passando no Apps Script real;
- smoke DEV executado;
- testes da branch passando;
- revisão de segurança concluída;
- decisão/canonização V2 registrada no GitHub;
- PR aprovado e mergeado.

Até lá, o estado correto é **implementação estrutural em branch + backends privados provisionados**, não `IMPLEMENTED` na `main`.
