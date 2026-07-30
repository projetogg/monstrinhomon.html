# Relatório de Auditoria Técnica — 2026-05

**Data:** 2026-05-20  
**Escopo:** classificação de arquivos obsoletos/desatualizados e plano seguro de execução em PRs (apenas documental).

---

## 1) Correções de classificação aplicadas

1. `/design/canon` foi reclassificado como **misto**:
   - parte **ativa em runtime** (carregada por `js/canon/canonLoader.js`);
   - parte **referencial/deprecated** (mantida para histórico e governança técnica).
2. `docs/archive/` saiu de “remoção segura” para **revisão humana** (risco de governança documental).
3. `progression.config.json` foi para **revisão humana / manter até decisão de autoridade** (sem referência direta confirmada em runtime).
4. A duplicidade de **Evolution** foi elevada para **risco alto**.

---

## 2) Classificação consolidada

## 2.1 Remoção segura

**Candidatos para PR separado (baixo risco, com allowlist estrita e gates completos):**

- `XP_TABLE.csv`
- `_DV.csv`
- `MASTER_CONTROLS.csv`
- `TEST_SCENARIO.csv`
- `README.csv`
- `.merge-status`
- `docs/migration_phase1_id_remap.json`
- `docs/migration_phase1_runtime_candidate.json`
- `docs/migration_phase1_runtime_candidate_reconciled.json`

**Observação:** estes itens **não devem ser removidos automaticamente** no mesmo PR documental. A remoção deve ocorrer em PR separado, pequeno, com validação antes e depois.

---

## 2.2 Revisão humana (manter até decisão)

- `docs/archive/**`  
  Motivo: risco de perda de trilha histórica e governança documental.
- `/progression.config.json`  
  Motivo: arquivo válido, porém sem consumo direto confirmado em runtime.
- `/design/canon/**` (subconjunto não carregado por `canonLoader`)  
  Motivo: material de referência e transição arquitetural; precisa decisão explícita antes de remoção.

---

## 2.3 Não remover (ativo em runtime)

Arquivos do cânone carregados pelo `canonLoader`:

- `design/canon/classes.json`
- `design/canon/class_matchups.json`
- `design/canon/skills_mvp_phase1.json`
- `design/canon/species.json`
- `design/canon/evolution_lines.json`
- `design/canon/level_progression.json`

Também não remover:

- `js/canon/canonLoader.js` (carregamento canônico)

---

## 2.4 Deprecated / referência (não remover automaticamente)

Itens mantidos como referência técnica/histórica, mas não classificados como núcleo runtime:

- `design/canon/CANON_DECISIONS.md`
- `design/canon/PHASE1_IMPLEMENTATION_NOTES.md`
- `design/canon/PHASE2_IMPLEMENTATION_NOTES.md`
- `design/canon/BOOT_INTEGRATION_NOTES.md`
- `design/canon/IMPLEMENTATION_PLAN.md`
- `design/canon/DATA_SCHEMA.md`
- `design/canon/combat_rules.json`
- `design/canon/mvp_plan.json`
- `design/canon/skills.json`

---

## 3) Riscos arquiteturais prioritários

### Risco Alto A — Sistemas paralelos de Evolution

Há múltiplas implementações/fontes coexistindo (ex.: fluxo inline em `index.html`, módulos `js/data/evolutionSystem.js` e `js/progression/evolutionSystem.js`, além da camada canônica em `design/canon/evolution_lines.json` via `canonLoader`).

**Impacto:** divergência de regra, manutenção cara e risco de inconsistência entre evolução exibida e evolução aplicada.

### Risco Alto B — Sistemas paralelos de Trade

Há dois sistemas de trade em paralelo (`js/trade/tradeSystem.js` e `js/combat/tradeSystem.js`) com regras e contratos distintos.

**Impacto:** comportamento não determinístico por caminho de chamada, aumento de regressões e dificuldade de auditoria funcional.

---

## 4) Plano seguro em PRs

### PR 1 — Congelamento de classificação (documental)

- Consolidar labels de inventário: remoção segura, revisão humana, não remover e deprecated.
- Não remover/mover arquivos.

### PR 2 — Guardrails de validação obrigatórios

Este PR deve exigir os seguintes gates:

- `npm test`
- `npm run test:wild-loop`
- `npm run test:wild-loop:vitest`
- `npm run validate-data`
- `npm run validate:monster-assets`

### PR 3 — Decisão de autoridade sobre revisão humana

- Deliberação explícita para `docs/archive/**` e `progression.config.json`.
- Só permitir remoções após ata de decisão e checklist de rastreabilidade.

### PR 4 — Consolidação arquitetural (trade/evolution)

- Definir fonte única por domínio (Trade e Evolution).
- Manter adaptadores temporários apenas com prazo de remoção definido.

---

## 5) Conclusão

Este ciclo **não autoriza remoção automática**. O relatório consolida as correções de classificação e formaliza os dois riscos arquiteturais críticos (Trade e Evolution), com plano de PRs seguro e verificável.
