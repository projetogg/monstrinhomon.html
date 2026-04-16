# Phase 1 Hard-Replace Catalog Migration — Audit Report

**Status:** READY_TO_APPLY ✅  
**Branch:** `migration/phase1-hard-replace-runtime`  
**Date:** 2026-01-25

---

## IDs Removed (Beta Monstros)

| Old ID | Name | Class | Reason |
|--------|------|-------|--------|
| MON_001 | Cantapau | Bardo | Beta — single stage, no evolutionary line |
| MON_002 | Pedrino | Guerreiro | Beta — replaced by Ferrozimon family |
| MON_002B | Pedronar | Guerreiro | Beta evolution — removed with parent |
| MON_002C | Pedragon | Guerreiro | Beta evolution — removed with parent |
| MON_003 | Faíscari | Mago | Beta — single stage |
| MON_004 | Ninfolha | Curandeiro | Beta — single stage |
| MON_005 | Garruncho | Caçador | Beta — single stage |
| MON_006 | Lobinho | Animalista | Beta — single stage |
| MON_007 | Trovão | Bárbaro | Beta — single stage |
| MON_008 | Sombrio | Ladino | Beta — single stage |
| MON_020 | Gotimon | Curandeiro | Displaced — MON_020 slot taken by Ursauramon |
| MON_020B | Lirialmon | Curandeiro | Displaced with family |
| MON_020C | Serafloramon | Curandeiro | Displaced with family |

---

## IDs Rebased (Old → New)

| Old ID | New ID | Name | Class | Rarity |
|--------|--------|------|-------|--------|
| MON_010 | MON_001 | Ferrozimon | Guerreiro | Comum |
| MON_010B | MON_002 | Cavalheiromon | Guerreiro | Incomum |
| MON_010C | MON_003 | Kinguespinhomon | Guerreiro | Raro |
| MON_010D | MON_004 | Arconouricomon | Guerreiro | Místico |
| MON_011 | MON_005 | Dinomon | Bardo | Comum |
| MON_011B | MON_006 | Guitarapitormon | Bardo | Incomum |
| MON_011C | MON_007 | TRockmon | Bardo | Raro |
| MON_011D | MON_008 | Giganotometalmon | Bardo | Místico |
| MON_013 | MON_009 | Miaumon | Caçador | Comum |
| MON_013B | MON_010 | Gatunamon | Caçador | Incomum |
| MON_013C | MON_011 | Felinomon | Caçador | Raro |
| MON_013D | MON_012 | Panterezamon | Caçador | Místico |
| MON_014 | MON_013 | Lagartomon | Mago | Comum |
| MON_014B | MON_014 | Salamandromon | Mago | Incomum |
| MON_014C | MON_015 | Dracoflamemon | Mago | Raro |
| MON_014D | MON_016 | Wizardragomon | Mago | Místico |
| MON_012 | MON_017 | Luvursomon | Animalista | Comum |
| MON_012B | MON_018 | Manoplamon | Animalista | Incomum |
| MON_012C | MON_019 | BestBearmon | Animalista | Raro |
| MON_012D | MON_020 | Ursauramon | Animalista | Místico |

---

## Semantic Remaps Applied in locations.json

All 137 ID occurrences remapped via single-pass regex (no double-substitution risk):

**Beta → canonical equivalents:**
- MON_001 (Cantapau/Bardo) → MON_005 (Dinomon/Bardo)
- MON_002B → MON_002, MON_002C → MON_003
- MON_002 (Pedrino/Guerreiro) → MON_001 (Ferrozimon/Guerreiro)
- MON_003 (Faíscari/Mago) → MON_013 (Lagartomon/Mago)
- MON_004 (Ninfolha/Curandeiro) → MON_028 (Nutrilo/Curandeiro)
- MON_005 (Garruncho/Caçador) → MON_009 (Miaumon/Caçador)
- MON_006 (Lobinho/Animalista) → MON_017 (Luvursomon/Animalista)
- MON_007 (Trovão/Bárbaro) → MON_021 (Tamborilhomon/Bárbaro)
- MON_008 (Sombrio/Ladino) → MON_022 (Corvimon/Ladino)

**Displaced Curandeiro family → Nutrilo family:**
- MON_020 → MON_028, MON_020B → MON_028B, MON_020C → MON_028C

**Family rebases (direct, same semantic role):**
- MON_010/B/C/D → MON_001/2/3/4
- MON_011/B/C/D → MON_005/6/7/8
- MON_012/B/C/D → MON_017/18/19/20
- MON_013/B/C/D → MON_009/10/11/12
- MON_014/B/C/D → MON_013/14/15/16

---

## Bridge Changes (speciesBridge.js)

| Category | Before | After |
|----------|--------|-------|
| Total mappings | 51 | 42 |
| shieldhorn (Guerreiro) | 10 | 7 (MON_001–004, MON_026/B/C) |
| emberfang (Bárbaro) | 7 | 6 (MON_021/B/C, MON_029/B/C) |
| moonquill (Mago) | 8 | 7 (MON_013–016, MON_024/B/C) |
| floracura (Curandeiro) | 7 | 3 (MON_028/B/C only) |
| swiftclaw (Caçador) | 7 | 7 (MON_009–012, MON_025/B/C) |
| shadowsting (Ladino) | 3 | 3 (unchanged) |
| bellwave (Bardo) | 6 | 6 (MON_005–007, MON_027/B/C) |
| wildpace (Animalista) | 3 | 3 (unchanged) |

**Excluded (by design):** MON_008 (drift bruiser), MON_017–020 (Animalista drift burst), MON_030/B/C (Ladino excluded), MON_100 (weak stats).

---

## Data Files Updated

- `data/monsters.json`: 72 → 59 templates
- `data/locations.json`: 137 ID substitutions
- `EVOLUCOES.csv`: 39 → 35 entries
- `ENCOUNTERS.csv`: updated 13+ invalid monster IDs
- `QUESTS.csv`: updated 4 objective monster IDs

## Test Files Updated

13 test files updated to reflect new ID mappings. All 4549 tests pass.

---

**Decision: READY_TO_APPLY** ✅
