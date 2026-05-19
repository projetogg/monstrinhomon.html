# 🔍 Relatório de Auditoria Técnica — Monstrinhomon

**Data**: 2026-05-19
**Baseline de testes**: 5477 passando (152 arquivos)
**Modo**: Somente auditoria — nenhum arquivo foi alterado ou removido.

---

## 📊 1. Resumo Executivo

| Categoria | Quantidade | Status |
|-----------|-----------|--------|
| Arquivos JS (runtime) | 72 | Todos em uso ou testados |
| Arquivos de teste | 152 | Todos ativos |
| CSVs raiz | 16 | 7 usados em testes, 9 são artefatos de planilha |
| JSONs em `/data` | 8 | Todos em uso |
| JSONs em `/design/canon` | 9 JSON + 6 MD | JSONs carregados pelo canonLoader; MDs são docs |
| Docs raiz | 6 MDs | Alguns ativos como referência técnica |
| Docs arquivados | 43 arquivos | Histórico de desenvolvimento |
| Assets monster | 23 PNGs | Todos válidos |

---

## 📁 2. Mapeamento da Estrutura

### Arquivos de Código (Runtime)

- `index.html` — ponto de entrada, importa todos os módulos JS via `<script type="module">`
- `js/storage.js`, `js/saveLayer.js` — carregados como `<script>` clássico (não modular)
- `js/data/index.js` — barrel que exporta o módulo Data para `index.html`
- `js/combat/index.js` — barrel para o módulo Combat
- `js/progression/index.js` — barrel para Progression
- `js/encounter/index.js` — barrel para Encounter *(não importado diretamente em `index.html` — `encounterEngine` e `encounterPool` são importados individualmente)*

### Arquivos de Dados (Source of truth)

- `/data/*.json` — 8 arquivos; todos usados em runtime ou testes
- Raiz `*.csv` — 7 usados em testes de integridade; 9 são artefatos de planilha

### Documentação

- `/design/canon/` — JSONs canônicos carregados por `canonLoader.js` + MDs de decisão
- `/docs/` — mix de docs ativos e histórico de desenvolvimento
- `/docs/archive/` — 43 arquivos puramente históricos (PRs antigos)

---

## 🗂️ 3. Tabela de Candidatos

### A. REMOÇÃO SEGURA

| Arquivo | Evidências de não-uso | Risco | Recomendação |
|---------|----------------------|-------|--------------|
| `XP_TABLE.csv` | Contém fórmulas VLOOKUP brutas de planilha Excel; 0 referências em código; lógica de XP implementada em `js/progression/xpCore.js` | ⬛ Baixo | Remover |
| `_DV.csv` | Contém "Domain Values" de planilha; 0 refs em código; valores cobertos pelos JSONs canônicos | ⬛ Baixo | Remover |
| `MASTER_CONTROLS.csv` | Artefato de planilha (contém fórmulas VLOOKUP); 0 refs em código; controles cobertos por `index.html` e `/data/` | ⬛ Baixo | Remover |
| `TEST_SCENARIO.csv` | 1 linha de cenário de teste manual; 0 refs em código; coberto pela suíte de testes (152 arquivos) | ⬛ Baixo | Remover |
| `README.csv` | README da planilha original; 0 refs em código; informação presente em `README.md` | ⬛ Baixo | Remover |
| `docs/migration_phase1_id_remap.json` | Status `"draft-not-live"`; 0 refs em código/testes | ⬛ Baixo | Remover |
| `docs/migration_phase1_runtime_candidate.json` | 0 refs em código/testes | ⬛ Baixo | Remover |
| `docs/migration_phase1_runtime_candidate_reconciled.json` | 0 refs em código/testes | ⬛ Baixo | Remover |
| `.merge-status` | Contém apenas `# Merge completed`; não é lido por nenhum script | ⬛ Baixo | Remover |
| `docs/archive/` (43 arquivos) | Histórico de PRs 11–16, summaries de implementação, análises passadas; 0 refs em código | ⬛ Baixo | Remover (ver nota) |

> **Nota sobre `docs/archive/`**: São 43 arquivos de histórico de desenvolvimento (summaries de PR, status reports, manuais de teste, análises). Nenhum é importado em código. O `git log` preserva tudo. Conforme a regra do projeto de nunca fazer remoção massiva, recomenda-se um sub-PR separado apenas para os arquivos de archive.

---

### B. REMOÇÃO PROVÁVEL, MAS EXIGE REVISÃO HUMANA

| Arquivo | Evidências | Risco | Recomendação |
|---------|-----------|-------|--------------|
| `CONFIG.csv` | Artefato de planilha; 0 refs em código; mas contém configurações de `master_xp_multiplier`, `capture_base_rate` etc. que podem ser referência para decisões de design | 🟡 Médio | Revisar: manter como doc ou mover para `docs/archive/` |
| `RULES.csv` | 0 refs em código; contém regras de jogo que estão repetidas em `GAME_RULES.md`; ligeira redundância com documentação canônica | 🟡 Médio | Revisar: verificar se `GAME_RULES.md` cobre tudo |
| `CAPTURE_TABLE.csv` | 0 refs em código; valores referenciados por `RULES.csv`; lógica implementada em `js/data/captureSystem.js` | 🟡 Médio | Revisar: redundante com código, mas útil como doc rápido |
| `scripts/build-catalog-v3-runtime-patch.mjs` | Não está no `package.json` como script npm; apenas referenciado por ele mesmo; parece script utilitário de migração já executado | 🟡 Médio | Revisar: confirmar se migração foi aplicada |
| `docs/migration_phase1_activation_audit.md` | Análise de auditoria de ativação; 0 refs em código; provavelmente concluída | 🟡 Médio | Revisar: mover para archive se concluída |
| `docs/phase1_encounter_orphans_audit.md` | 0 refs em código | 🟡 Médio | Revisar: mover para archive se concluída |
| `docs/phase1_hard_replace_audit.md` | 0 refs em código | 🟡 Médio | Revisar: mover para archive se concluída |
| `js/combat/tradeSystem.js` + `js/trade/tradeSystem.js` | **Dois sistemas de troca paralelos**: `js/combat/tradeSystem.js` é importado por `tradeUI.js` e testado; `js/trade/tradeSystem.js` é importado por `index.html` — APIs **diferentes** (ver seção de Riscos) | 🔴 Alto | Não remover sem consolidação deliberada |
| `js/data/evolutionSystem.js` + `js/progression/evolutionSystem.js` | **Dois sistemas de evolução paralelos**: `data/evolutionSystem.js` usado em `index.html` (exporta `executeEvolution`); `progression/evolutionSystem.js` usado nos testes — APIs **diferentes** | 🔴 Alto | Não remover sem consolidação deliberada |

---

### C. NÃO REMOVER

| Arquivo | Motivo |
|---------|--------|
| `DROPS.csv` | Usado em `tests/dropsIntegrity.test.js` (source of truth de drops) |
| `ENCOUNTERS.csv` | Usado em `tests/dropsIntegrity.test.js` e `tests/encountersIntegrity.test.js` |
| `EVOLUCOES.csv` | Usado em `tests/catalogIntegrity.test.js` |
| `QUESTS.csv` | Usado em `tests/questsIntegrity.test.js` |
| `LOCAIS.csv` | Usado em `tests/encountersIntegrity.test.js` |
| `CLASSES.csv` | Referenciado em docs; contém dados canônicos de classes |
| `HABILIDADES.csv` | Dados de habilidades; referenciado em docs |
| `ITENS.csv` | Dados de itens; referenciado em docs |
| `GAME_RULES.md` | Documento canônico das regras do jogo |
| `data/*.json` (todos) | Source of truth do runtime |
| `design/canon/*.json` (6 carregados pelo canonLoader) | Carregados por `canonLoader.js` em runtime |
| `design/canon/*.md` | Decisões de design canônicas |
| `js/storage.js`, `js/saveLayer.js` | Carregados como script clássico; críticos para persistência |
| `js/data/evolutionSystem.js` | Importado em `index.html` com `executeEvolution` |
| `js/progression/evolutionSystem.js` | Importado nos testes |
| `js/combat/tradeSystem.js` | Importado em `tradeUI.js` e testado |
| `js/trade/tradeSystem.js` | Importado em `index.html` |
| `js/data/eggUI.js` | Exportado pelo barrel `js/data/index.js`, que é importado em `index.html` |
| `docs/COMBATE_FORMULA_V2.md` | Referenciado em `groupCombatFormula.js` como fonte das fórmulas |
| `docs/PATCH_CANONICO_COMBATE_V2.2.md` | Referenciado em código de combate, fuga e evolução |
| `data/monsters.bootstrap.json` | Usado em `tests/evolutionIntegration.test.js` |
| `progression.config.json` | Contém configuração de progressão; manter até confirmar se é lido em runtime |
| `.nojekyll` | Necessário para GitHub Pages não processar como Jekyll |
| `AGENTS.md` | Instruções para agentes Copilot |
| Todo `tests/` | 152 testes, todos ativos e passando |
| `assets/monsters/*.png` (23 arquivos) | Usados por `monsterVisual.js` em runtime |

---

### D. MANTER, MAS MARCAR COMO DEPRECATED

| Arquivo | Razão |
|---------|-------|
| `design/canon/skills.json` | Skills canônicas em formato diferente de `data/skills.json`; mencionado em `kitSwap.js` mas **não carregado** por `canonLoader.js`; pode criar confusão |
| `design/canon/combat_rules.json` | Não carregado por `canonLoader.js`; pode ser referência de design mas não está em uso |
| `design/canon/mvp_plan.json` | Não carregado por `canonLoader.js`; planejamento histórico |
| `docs/ANALISE_PROJETO.md` | Análise de comparação com Pokémon; útil como referência estratégica mas não é doc canônico ativo |
| `docs/PLANO_DE_ACAO.md` | Plano de ação histórico; pode estar desatualizado |

---

## ⚠️ 4. Riscos Identificados

### RISCO CRÍTICO: Dois sistemas de Trade em paralelo

- **`js/combat/tradeSystem.js`** — API: `validateTrade(playerA, monA, playerB, monB, sharedBox)` + `executeTrade(...)` + `getTradeableMonsters(...)` + `getTradeSuggestions(...)`. Importado por **`tradeUI.js`** e por **4 arquivos de teste**.
- **`js/trade/tradeSystem.js`** — API: `validateTrade(fromPlayer, toPlayer, instanceId, context)` + `proposeTradeAction(...)` + `acceptTrade(...)`. Importado apenas por **`index.html`**.
- **Impacto**: A UI de troca (`tradeUI.js`) e o jogo principal (`index.html`) usam sistemas **incompatíveis**. Isso é um risco funcional real — se `tradeUI.js` é renderizado dentro de `index.html`, pode haver divergência comportamental.

### RISCO MODERADO: Dois sistemas de Evolução em paralelo

- **`js/data/evolutionSystem.js`** — exporta `executeEvolution`, `checkEvolution`. Importado em `index.html`.
- **`js/progression/evolutionSystem.js`** — exporta `checkEvolution`, `applyEvolution`, `getEvolutionTarget`. Importado apenas em **testes**.
- **Impacto**: Os testes testam um módulo diferente do que está no runtime. Isso pode causar falsos positivos nos testes.

### RISCO BAIXO: `scripts/build-catalog-v3-runtime-patch.mjs` não registrado

- O script existe e importa de `catalogV3RuntimeResolution.js`, mas não está no `package.json` como comando npm. Parece ser um script de migração one-shot provavelmente já executado.

---

## 🧪 5. Buscas Realizadas

```bash
# Referências de cada arquivo candidato em código
grep -r "<arquivo>" --include="*.js" --include="*.html" --include="*.mjs" --include="*.json" .

# Referências em docs
grep -r "<arquivo>" --include="*.md" --include="*.csv" .

# Imports no index.html
grep -n 'import\|src=' index.html

# Baseline de testes
npx vitest run  # → 5477 testes, 152 arquivos, 100% pass
```

---

## 📋 6. Plano de PR Seguro

### PR 1 — Documentação desta auditoria ✅ (este arquivo)

- Criar `docs/AUDIT_REPORT_2026-05.md` com este relatório
- Sem deletar, mover ou alterar qualquer arquivo existente

### PR 2 — Remoção segura de artefatos de planilha (sem impacto em testes)

Candidatos confirmados para remoção:

| Arquivo | Motivo |
|---------|--------|
| `XP_TABLE.csv` | Fórmulas Excel brutas, 0 refs em código |
| `_DV.csv` | Domain values de planilha, 0 refs em código |
| `MASTER_CONTROLS.csv` | Fórmulas Excel, 0 refs em código |
| `TEST_SCENARIO.csv` | 1 linha, supersedido por 5477 testes automatizados |
| `README.csv` | README da planilha, 0 refs em código |
| `.merge-status` | 1 linha de status, sem funcionalidade |
| `docs/migration_phase1_id_remap.json` | Status `draft-not-live`, 0 refs |
| `docs/migration_phase1_runtime_candidate.json` | 0 refs em código/testes |
| `docs/migration_phase1_runtime_candidate_reconciled.json` | 0 refs em código/testes |

**Pré-condição**: Rodar `npm test` antes e depois — não pode quebrar nada.

### PR 3 — Remoção de `docs/archive/` após aprovação humana

- 43 arquivos de histórico de PRs e summaries antigos
- Nenhum referenciado em código
- **Exige aprovação explícita** pois são 43 arquivos de uma vez

### PR 4 — Investigação e consolidação dos sistemas duplicados

- Investigar e resolver `js/combat/tradeSystem.js` vs `js/trade/tradeSystem.js`
- Investigar e resolver `js/data/evolutionSystem.js` vs `js/progression/evolutionSystem.js`
- Exige revisão cuidadosa para não quebrar runtime nem testes

### PR 5 — Limpeza final

- Marcar `design/canon/skills.json`, `design/canon/combat_rules.json`, `design/canon/mvp_plan.json` como deprecated ou remover se confirmado
- Mover `docs/migration_phase1_activation_audit.md`, `docs/phase1_*` para archive
- Revisar `scripts/build-catalog-v3-runtime-patch.mjs`

---

## ❓ 7. Perguntas que Exigem Decisão Humana

1. **Os dois sistemas de Trade (`js/combat/` vs `js/trade/`) são intencionalmente diferentes?** Qual é canônico? `tradeUI.js` usa `combat/tradeSystem.js` mas `index.html` usa `trade/tradeSystem.js` — isso funciona corretamente no jogo atual?

2. **Os dois sistemas de Evolução são intencionalmente diferentes?** `js/data/evolutionSystem.js` (usado em runtime) vs `js/progression/evolutionSystem.js` (usado nos testes) — os testes estão efetivamente testando o runtime?

3. **`scripts/build-catalog-v3-runtime-patch.mjs` já foi executado?** A migração v3 está completa? O script pode ser removido ou ainda é necessário?

4. **`progression.config.json` é lido em runtime?** A busca no código não encontrou referências diretas ao arquivo, mas os valores nele contidos (`maxLevel: 100`, `stageConfig`) aparecem hardcoded no código. Esse arquivo é fonte de verdade ou um artefato de design?

5. **Os CSVs raiz sem uso em código (`CAPTURE_TABLE.csv`, `RULES.csv`, `CONFIG.csv`, `CLASSES.csv`) devem ser mantidos como documentação de design ou podem ser movidos para `docs/archive/`?** Eles contêm regras do jogo em formato tabular que facilitam leitura humana, mas seus dados já estão em JSONs e no código.

6. **`docs/archive/` pode ser apagado integralmente?** São 43 arquivos de histórico de PRs 11–16. Nenhum é importado em código. O git preserva tudo no histórico. Confirmar se a equipe deseja manter o archive no filesystem.

7. **`design/canon/skills.json` vs `data/skills.json`: qual é o authoritative?** O arquivo canônico em `design/canon/` tem formato diferente e não é carregado pelo `canonLoader`. É uma versão antiga ou futura?

---

## 📦 8. Assets: Gap de Imagens

**Observação (não é remoção):** Existem 40 IDs de monstros em `data/monsters.json` sem imagem em `assets/monsters/` (MON_021 em diante, exceto MON_028–030). O sistema usa fallback de silhouette para esses casos — isso é comportamento esperado, verificado em `tests/monsterAssets.test.js`. Não há imagens órfãs (todo PNG existente corresponde a um ID no JSON).

---

*Próximo passo recomendado: PR 2 — remoção dos artefatos de planilha de risco baixo listados na seção 6.*
