# 🔍 Relatório de Auditoria de Bugs — Monstrinhomon

**Data**: 2026-04-14  
**Versão do projeto**: 1.0.0  
**Testes na baseline**: 4013 passando (103 arquivos)

---

## 📊 Resumo Executivo

| Frente | Status | Erros Críticos | Avisos |
|--------|--------|---------------|--------|
| FRENTE 1 — index.html | ✅ Analisado | 0 | 2 TODOs ativos |
| FRENTE 2 — Módulos de Combate | ✅ Analisado | 0 | 1 nota arquitetural |
| FRENTE 3 — Integridade dos Dados | ✅ Script criado | 0 | 8 (HP fora de range) |
| FRENTE 4 — Cobertura de Testes | ✅ Testes adicionados | 0 | — |
| FRENTE 5 — Qualidade | ✅ Concluído | 0 | 4 vuln. dev-only |

**Resultado**: Nenhum bug crítico encontrado. 35 testes adicionados. Pipeline 100% verde.

---

## FRENTE 1 — Auditoria de `index.html`

### TODOs Ativos (2)

| Linha | Severidade | Descrição |
|-------|-----------|-----------|
| 3339 | 🟡 Médio | `TODO (Commit 8): Substituir createMonsterInstance() por createMonsterInstanceFromTemplate()` — Refatoração pendente. A versão antiga ainda funciona corretamente; a nova é preferível para alinhamento com o canon. |
| 4351 | 🟢 Baixo | `TODO PR5B: Mover initializeGroupEncounter() para Combat.Group.Actions` — Debt técnico de organização. Sem impacto em funcionalidade. |

### Dados Consistentes ✅

- **`ENE_REGEN_BY_CLASS`** (linha 1331) e **`MM_TABLES.ENERGY_REGEN`** (linha 1583) estão em sincronia com os valores canônicos v2.2:
  - Mago/Curandeiro: `{pct: 0.18, min: 3}` ✅
  - Bardo/Caçador/Ladino: `{pct: 0.14, min: 2}` ✅  
  - Animalista/Bárbaro: `{pct: 0.12, min: 2}` ✅
  - Guerreiro: `{pct: 0.10, min: 1}` ✅

### Guards de Null/Undefined ✅

Não foram encontrados padrões `player.team[0]` sem verificação de `activeIndex`. O código usa `activeIndex` corretamente para acessar o monstro ativo.

---

## FRENTE 2 — Módulos de Combate

### `wildActions.js` — Skills de Inimigos

**Nota arquitetural** (não é bug): O campo `wildMonster.skill` na rota de módulo (`wildActions.js`) é populado somente quando o encounter passa `wildMonster.skill` explicitamente na criação. No pipeline canônico (via `index.html`), o inimigo só usa habilidades pelo caminho interno. Isso é comportamento esperado, documentado em `combatAuditFull.test.js`.

### `groupActions.js` — KO Handling ✅

`removeKOedFromTurnOrder` é corretamente:
- Exportada de `groupCore.js`
- Chamada pelo código consumidor no ponto de detecção de KO (não automaticamente em `advanceGroupTurn`, por design)
- Coberta por 15 testes em `groupTurnOrder.test.js`

### `bossSystem.js` — Fase Única ✅

`checkBossPhaseTransition` tem proteção `_phase2Done` corretamente implementada (linha 80: `if (boss._phase2Done) return`). Fase 2 dispara exatamente uma vez por batalha.

### Passivas de Classe ✅

`CLASS_COMBAT_PASSIVES` está aplicado tanto em `wildActions.js` quanto em `groupActions.js`. Guerreiro (-15% dmg), Bárbaro (-10%), Curandeiro (-10%), Ladino (+10% + first strike -1 DEF).

### Módulos DEPRECATED

Os seguintes módulos são protótipos arquiteturais **nunca conectados ao pipeline real**:
- `js/combat/groupBattleLoop.js` — marcado `@deprecated` no cabeçalho
- `js/combat/groupBattleState.js` — marcado `@deprecated` no cabeçalho

Pipeline real: `groupCore.js` + `groupActions.js` + `groupUI.js`.

---

## FRENTE 3 — Integridade dos Dados

### Script Criado

`scripts/validate-data.mjs` + `npm run validate-data`

### Resultado da Validação

```
📦 monsters.json
  ✅ 64 monstros carregados
  ✅ Nenhum ID duplicado
  ⚠️  8 monstros com baseHp fora do range recomendado (ver detalhes abaixo)
  ✅ Todas as classes têm ao menos um monstro

🎒 items.json
  ✅ 25 itens carregados
  ✅ Nenhum ID duplicado

⚔️  skills.json
  ✅ 62 skills carregadas
  ✅ Nenhum ID duplicado
  ✅ Todas as classes têm ao menos uma skill

🗺️  worldMap.json
  ✅ 26 nós no mapa
  ✅ Nenhum nodeId duplicado
  ✅ 3 bosses com bossLevel
  ✅ Todas as referências de monstros em encounterPool são válidas
```

### Avisos de HP Base (não são bugs, são notas de balanceamento)

| Monstro | Raridade | baseHp | Range Recomendado |
|---------|---------|--------|------------------|
| MON_013D | Místico | 54 | [55-75] |
| MON_014C | Raro | 39 | [40-60] |
| MON_014D | Místico | 48 | [55-75] |
| MON_022C | Raro | 37 | [40-60] |
| MON_025C | Raro | 38 | [40-60] |
| MON_027B | Incomum | 28 | [30-45] |
| MON_027C | Raro | 36 | [40-60] |
| MON_029B | Incomum | 46 | [30-45] |

Esses valores podem ser ajustes intencionais de balanceamento. Revisar com o designer de jogo.

### Divergência CSV vs JSON

O `MONSTROS.csv` (9 linhas) é um legado da fase inicial. O `data/monsters.json` (64 monstros) é a fonte canônica atual. Não há inconsistência — são dois sistemas em momentos diferentes do desenvolvimento.

---

## FRENTE 4 — Cobertura de Testes

### Testes Adicionados

**`tests/battleInitialization.test.js`** (12 testes)
- `initializeGroupBattleParticipation` — 8 casos, incluindo inimigos, arrays vazios, null, entre-batalhas
- `initializeWildBattleParticipation` — 4 casos

**`tests/itemsLoaderFunctional.test.js`** (23 testes)
- `validateItem` — 15 casos: held, heal, capture, egg, edge cases
- `getAllItems`, `getItemsByTier`, `getItemsByCategory`, `getAllEggs` — comportamento com cache vazio
- `canItemBreak`, `getItemBreakChance`, `getItemStats` — item inexistente

### Funções ainda sem testes diretos (nível baixo de risco)

| Módulo | Funções | Observação |
|--------|---------|-----------|
| `combat/groupBattleLoop.js` | todas | DEPRECATED — não usar |
| `combat/groupBattleState.js` | todas | DEPRECATED — não usar |
| `combat/groupUI.js` | `renderGroupEncounterPanel`, etc. | UI — requer DOM |
| `encounter/overworldMap.js` | `buildMapSVG`, etc. | UI/SVG — requer DOM |
| `ui/battleEndModal.js` | todas | UI — requer DOM |
| `ui/eggHatchModal.js` | todas | UI — requer DOM |
| `ui/partyDexUI.js` | `renderPartyDex` | UI — requer DOM |

Funções de UI que requerem DOM são adequadamente testadas via Playwright (integração) se necessário.

---

## FRENTE 5 — Qualidade e Manutenibilidade

### Vulnerabilidades de Dependências

| Vulnerabilidade | Severidade | Pacote | Impacto |
|----------------|-----------|--------|---------|
| GHSA-67mh-4wv8-2f99 | Moderate | esbuild | Dev-only |
| GHSA-67mh-4wv8-2f99 | Moderate | vite | Dev-only |
| GHSA-67mh-4wv8-2f99 | Moderate | vite-node | Dev-only |
| GHSA-67mh-4wv8-2f99 | Moderate | vitest | Dev-only |

A vulnerabilidade do `rollup` (high) foi corrigida via `npm audit fix`. As 4 restantes (`esbuild`/`vite`) só podem ser corrigidas com `--force` (upgrade para vitest v4 — breaking change). Impacto: **apenas ambiente de desenvolvimento** (servidor de teste), não afeta o jogo em produção.

**Recomendação**: Atualizar para vitest v4 em uma sessão dedicada após verificar breaking changes.

### Limpeza da Raiz

Movidos para `docs/archive/`: 40 arquivos MD de summaries de PRs anteriores.

MDs mantidos na raiz (6 arquivos essenciais):
- `README.md` — documentação principal
- `LEIA-ME.md` — readme em português
- `GAME_RULES.md` — regras canônicas do jogo
- `AGENTS.md` — instruções para agentes
- `TODO_FUNCIONALIDADES.md` — backlog ativo
- `PROXIMOS_PASSOS.md` — roadmap ativo

---

## Conclusão

O projeto está em estado saudável. **Nenhum bug crítico encontrado**. Os principais riscos identificados são:

1. **Dois sistemas de skills coexistentes** — `data/skills.json` e `SKILL_DEFS` em `index.html`. Todos os 8 classes agora têm skills nos dois sistemas, mas a unificação em `skills.json` como fonte única ainda não foi feita (documentada como AÇÃO 1 em `docs/PLANO_DE_ACAO.md`).
2. **`index.html` monolítico** — 13.8k linhas com lógica de negócio misturada com UI. Migração gradual para módulos JS já está em andamento (ver `js/combat/`, `js/data/`, etc.).
3. **Módulos DEPRECATED** ainda no repositório — `groupBattleLoop.js` e `groupBattleState.js` podem ser removidos em refatoração futura.

**Testes após auditoria**: 4048 passando (4013 baseline + 35 novos), 105 arquivos.
