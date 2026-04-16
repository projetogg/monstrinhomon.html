# Migration Boundary — Save v1 → v2

**Arquivo autoritativo:** `js/data/catalogMigration.js`  
**Ponto de entrada:** `applyCatalogMigration(state)` + `postMigrationCanonicalRebuild(state, factoryFn)`  
**Gatilho:** `migrateSaveIfNeeded(saveObj)` em `index.html` (verificação de `saveVersion`)

---

## O que aconteceu com o catálogo

O rebase da Fase 1 reaproveitou IDs numéricos para novas famílias:

| ID antigo (legado) | Família legada       | Classe legada | ID novo (canônico) | Família nova        | Classe nova |
|--------------------|----------------------|---------------|--------------------|---------------------|-------------|
| MON_010 … MON_010D | Ferrozimon           | Guerreiro     | MON_001 … MON_004  | Ferrozimon          | Guerreiro   |
| MON_011 … MON_011D | Dinomon              | Bardo         | MON_005 … MON_008  | Dinomon             | Bardo       |
| MON_013 … MON_013D | Miaumon              | Caçador       | MON_009 … MON_012  | Miaumon             | Caçador     |
| MON_014 … MON_014D | Lagartomon           | Mago          | MON_013 … MON_016  | Lagartomon          | Mago        |
| MON_012 … MON_012D | Luvursomon           | Animalista    | MON_017 … MON_020  | Luvursomon          | Animalista  |

Saves com esses IDs antigos precisam ser migrados para apontar para os IDs canônicos corretos.

---

## Fluxo de migração (duas fases)

### Phase 1 — Síncrona (`migrateSaveIfNeeded`, saveVersion 1 → 2)

Executada em `migrateSaveIfNeeded()` durante o load, **antes** do catálogo JSON ser carregado.

1. **Fingerprint guard** — bloqueia migração de instâncias cujo `class`/`rarity` já corresponde ao catálogo novo (proteção contra double-migration por sobreposição de IDs).
2. **templateId remap** — substitui ID legado pelo ID canônico via `CATALOG_REBASE_MAP`.
3. **Chain reconciliation** — avança pelo chain evolutivo até o estágio correto para o nível atual.
4. **`rebuildDerivedFields`** — reconstrói todos os campos derivados (identidade + stats) a partir dos dados embutidos em `MIGRATION_CATALOG`:
   - `name`, `class`, `rarity`, `emoji`, `evolvesTo`, `evolvesAt`, `stage`
   - `hpMax`, `atk`, `def`, `spd`, `eneMax`, `poder`, `xpNeeded`, `unlockedSkillSlots`
5. **HP por percentual** — preserva a saúde relativa (não o valor bruto).
6. **Marcadores de rastreabilidade** — `_pendingCanonicalRebuild: true`, `_migratedFromLegacy: true`, `_legacyTemplateId`.

### Phase 2 — Assíncrona (`loadMonsters().then()`)

Executada após `data/monsters.json` ser carregado, usando a factory real do jogo.

1. Para cada instância marcada com `_pendingCanonicalRebuild: true`:
   - Chama `createMonsterInstanceFromTemplate(templateId, level)`.
   - Aplica SpeciesBridge, KitSwap, skills e qualquer transformação canônica.
   - Reidrata apenas progresso legítimo (ver abaixo).
   - Limpa `_pendingCanonicalRebuild`.
2. **Autosave imediato** — se `rebuilt > 0`, `saveGame()` é chamado automaticamente para eliminar a janela de inconsistência residual.

---

## Campos: preservados vs reconstruídos

| Campo              | Phase 1       | Phase 2         | Justificativa                                  |
|--------------------|---------------|-----------------|------------------------------------------------|
| `templateId`       | reconstruído  | mantido         | ID canônico determinado na Phase 1             |
| `name`             | reconstruído  | reconstruído    | Sempre vem do template                         |
| `class`            | reconstruído  | reconstruído    | Sempre vem do template                         |
| `rarity`           | reconstruído  | reconstruído    | Sempre vem do template                         |
| `emoji`            | reconstruído  | reconstruído    | Sempre vem do template                         |
| `evolvesTo/At`     | reconstruído  | reconstruído    | Sempre vem do template                         |
| `stage`            | reconstruído  | reconstruído    | Posição 0-based na chain evolutiva             |
| `hpMax/atk/def/spd/eneMax/poder` | reconstruído | reconstruído | Stats calculados do template + nível |
| `xpNeeded`         | reconstruído  | reconstruído    | Função pura do nível: `round(40+6L+0.6L²)`    |
| `unlockedSkillSlots` | reconstruído | reconstruído  | Função do nível: ≥30→4, ≥15→3, ≥5→2, else 1  |
| `canonSpeciesId`   | atualizado*   | reconstruído    | Vem da factory (SpeciesBridge)                 |
| `appliedKitSwaps`  | —             | reconstruído    | Vem da factory                                 |
| `level`            | **preservado**| **preservado**  | Progresso do jogador                           |
| `xp`               | **preservado**| **preservado**  | Progresso do jogador                           |
| `hp`               | por percentual| por percentual  | Saúde relativa preservada                      |
| `ene`              | clampado      | clampado        | Não pode superar novo eneMax                   |
| `friendship`       | —             | **preservado**  | Vínculo do jogador com o monstro               |
| `status`           | —             | **preservado**  | Estado de batalha persistente                  |
| `isShiny`          | —             | **preservado**  | Característica rara permanente                 |
| `equippedItem`     | —             | **preservado**  | Item equipado                                  |
| `id/instanceId/ownerId/createdAt` | — | **preservado** | Identidade estável da instância   |

\* Phase 1 atualiza `canonSpeciesId` apenas se o campo já existia no save.

---

## Idempotência

A migração é segura para ser chamada múltiplas vezes:

- **saveVersion ≥ 2** → `migrateSaveIfNeeded` retorna imediatamente (sem Phase 1).
- **IDs canônicos atuais** não estão em `CATALOG_REBASE_MAP` → fingerprint guard os ignora.
- **`_pendingCanonicalRebuild` ausente** → Phase 2 ignora a instância.
- **Dex rebuild** → operação idempotente (upsert de entradas já existentes).

---

## Garantias pós-migração

Após migração completa (Phase 1 + Phase 2):

- Um monstro de um save antigo **continua na linha conceitual correta** (Guerreiro→Ferrozimon, Caçador→Miaumon, etc.).
- Evolução ocorre nos **thresholds corretos da linha correta** (12, 25, 45).
- O **time do jogador não contém monstros de classe errada** por erro estrutural de migração.
- A **Dex reflete a posse real** já reconciliada (IDs legados removidos, IDs canônicos adicionados).
- A instância final **bate com a pipeline canônica** (`createMonsterInstanceFromTemplate`).

---

## IDs rebaseados não devem ser tratados como legado após canonicalização

Após a migração ser aplicada (saveVersion ≥ 2), os IDs `MON_009`–`MON_020` são IDs **canônicos** do catálogo atual.
Eles **não devem ser tratados como legados**. O fingerprint guard já protege contra double-migration: uma instância
com `class=Caçador/rarity=Incomum` em `MON_010` (Gatunamon) não será remapeada para `MON_001` (Ferrozimon/Guerreiro).

---

**Última atualização:** 2026-04-16  
**Módulo:** `js/data/catalogMigration.js`  
**Versão de save alvo:** v1 → v2
