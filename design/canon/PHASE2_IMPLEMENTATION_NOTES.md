# Monstrinhomon — Notas de Implementação da Fase 2

Este arquivo documenta a integração da Fase 2 da camada canônica:  
`species.json`, `evolution_lines.json` e `level_progression.json`.

---

## O que foi integrado

### Part A — species.json

Integrado como **camada consultiva**. Novas funções em `canonLoader.js`:

| Função | O que faz |
|--------|-----------|
| `getSpeciesData(id \| name_pt)` | Retorna dados completos de uma espécie (offsets, passiva, kit_swap, arquétipo) |
| `getSpeciesStatOffsets(id \| name_pt)` | Retorna apenas `base_stat_offsets` da espécie |

**Indexação interna:** `_indexSpecies()` — por `id` e por `name_pt`.

#### Espécies disponíveis na Fase 2
| ID canônico | Nome PT-BR | Classe | Raridade |
|-------------|-----------|--------|---------|
| `shieldhorn` | Escudicorno | warrior | comum |
| `emberfang` | Presabrasa | barbarian | incomum |
| `moonquill` | Plumalua | mage | comum |
| `floracura` | Floracura | healer | comum |

---

### Part B — evolution_lines.json

Integrado como **camada consultiva**. Nova função em `canonLoader.js`:

| Função | O que faz |
|--------|-----------|
| `getEvolutionLine(lineId \| speciesId \| classId)` | Retorna linha evolutiva completa (estágios, nível de evolução, identidade de progressão) |

**Indexação interna:** `_indexEvolutionLines()` — por `line_id`, por `species_id` de qualquer estágio, e por `class_id`.

#### Linhas evolutivas disponíveis na Fase 2
| Line ID | Classe | Estágio 1 → 2 → 3 | Nível de evolução |
|---------|--------|-------------------|------------------|
| `shieldhorn_line` | warrior | Escudicorno → Basticorno → Aegishorn | 1 → 12 → 25 |
| `emberfang_line` | barbarian | Presabrasa → Furiagume → Infernomord | 1 → 12 → 25 |

---

### Part C — level_progression.json

Integrado como **camada consultiva de marcos**. Novas funções em `canonLoader.js`:

| Função | O que faz |
|--------|-----------|
| `getLevelMilestones(level)` | Retorna array de unlocks para um nível específico |
| `getAllLevelMilestones()` | Retorna todos os marcos indexados por nível |
| `getClassGrowthRule(classIdOrPtbr)` | Retorna regra textual de crescimento de stats para uma classe |

**Indexação interna:** `_indexLevelProgression()`.

#### Marcos de desbloqueio (níveis 1-30)
| Nível | Unlock |
|-------|--------|
| 1 | slot_1 |
| 5 | slot_2 |
| 10 | slot_1_or_2_upgrade |
| 15 | slot_3 |
| 22 | slot_2_or_3_upgrade |
| 30 | slot_4 |

---

## O que é consultivo (não aplica ao runtime ainda)

- **Offsets de espécie**: `getSpeciesStatOffsets()` está disponível, mas o motor atual **não aplica** esses offsets ao calcular stats em batalha. A aplicação real está reservada para Fase 3+.
- **Linhas evolutivas**: `getEvolutionLine()` pode ser consultado por UI e debug, mas a lógica de evolução do jogo não foi alterada.
- **Marcos de progressão**: `getLevelMilestones()` é consultivo; o sistema de XP atual não foi modificado.
- **Passivas e kit_swap**: campos acessíveis via `getSpeciesData()`, mas não implementados no motor de combate.

---

## Divergências documentadas

### 1 — Mapeamento runtime → espécie canônica
O catálogo runtime usa IDs como `m_luma`, `m_trok`. O cânone usa `moonquill`, `shieldhorn`.  
**Não existe mapeamento automático.** Cabe ao runtime criar uma ponte explícita quando necessário.

### 2 — Cobertura de espécies
`species.json` tem 4 espécies. `evolution_lines.json` tem apenas 2 linhas evolutivas (shieldhorn e emberfang).  
`moonquill` e `floracura` não têm linha evolutiva no cânone atual — isso é esperado e documentado.

### 3 — Cobertura de progressão
`level_progression.json` cobre apenas níveis 1-30. O runtime suporta nível 100.  
`getLevelMilestones(50)` retorna `[]` — comportamento correto e documentado.

### 4 — Regras de crescimento parciais
`class_growth_rules` no JSON atual define apenas 4 classes (warrior, barbarian, mage, healer).  
Bardo, Ladino, Caçador e Animalista retornam `null` via `getClassGrowthRule()`.

---

## Carregamento

Os 3 novos arquivos são carregados em paralelo junto com os 3 da Fase 1:

```
_loadCanonDataInternal()
  └─ Promise.all([
       classes.json,
       class_matchups.json,
       skills_mvp_phase1.json,
       species.json,          ← Fase 2
       evolution_lines.json,  ← Fase 2
       level_progression.json ← Fase 2
     ])
```

O fallback seguro se mantém: se qualquer fetch falhar, `applyCanonToConfig()` captura o erro e mantém a config legada.

---

## Testes

- 29 novos testes adicionados ao `tests/canonLoader.test.js`
- Cobertura: `getSpeciesData`, `getSpeciesStatOffsets`, `getEvolutionLine`, `getLevelMilestones`, `getAllLevelMilestones`, `getClassGrowthRule`
- Todos os 1995 testes passam (zero regressão)

---

## O que fica para fases posteriores

- **Fase 3**: aplicar offsets de espécie no cálculo real de stats
- **Fase 3**: implementar passivas de espécie no motor de combate
- **Fase 3**: integrar kit_swap ao sistema de habilidades
- **Fase 3**: criar bridge explícita entre IDs runtime e IDs canônicos
- **Fase 4**: integrar progressão de marcos ao sistema de XP e desbloqueio de habilidades
- **Fase 4**: expandir `evolution_lines.json` com todas as linhas evolutivas

---

## Próximo passo técnico recomendado (Fase 3)

1. Criar `js/canon/speciesBridge.js` que mapeia ID runtime → ID canônico
2. Usar `getSpeciesStatOffsets()` em `createInstance()` para aplicar offsets no HP e stats
3. Expor passiva da espécie na UI de detalhes do Monstrinho
4. Documentar quais instâncias runtime têm correspondência canônica e quais não têm

---

**Última atualização:** 2026-04-01  
**Versão:** Fase 2  
**Responsável:** canonLoader.js
