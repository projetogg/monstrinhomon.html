# Auditoria Geral de Riscos — Monstrinhomon

**Data:** 2026-05-23  
**Versão:** 1.0.0  
**Escopo:** Diagnóstico conservador de erros, gargalos, duplicidades, concorrências e riscos futuros.  
**Regra de segurança:** Nenhuma remoção, refactor amplo ou alteração de regra realizada neste relatório.

---

## 1. Resumo Executivo

O projeto Monstrinhomon está em estado funcional sólido: **5547 testes passam** (Vitest), validação de dados OK (64 monstros, 65 skills, 26 itens, 29 nós do mapa) e assets visuais consistentes (23/23).

Os principais riscos identificados são:

1. **Trade: dois sistemas ativos em runtime com APIs incompatíveis** (bilateral vs unilateral).
2. **Evolução: dois módulos existentes com comportamento crítico diferente** (HP% vs cura total), mas apenas o canônico roda em runtime — protegido por teste.
3. **Drift documental: `PLANO_DE_ACAO.md` descreve 17 skills/5 classes quando na realidade existem 65 skills/8 classes**.
4. **Combate: fórmula runtime diverge do Patch Canônico v2.2** (faixas de dano, ModNível não implementados).
5. **CSVs raiz: 11 arquivos legados sem uso em runtime**, fonte de confusão.
6. **Validação de `encounter.active` ausente em handlers principais do Wild Combat** — ações podem ser processadas após fim de batalha.

Nenhum bug de perda de save, soft-lock ou recompensa duplicada grave foi confirmado. O sistema de save (SaveLayer + StorageManager) está devidamente unificado.

---

## 2. Matriz de Riscos

| # | Risco | Severidade | Domínio | Arquivo(s) | Status |
|---|---|---|---|---|---|
| R01 | Trade: dois sistemas ativos em runtime (bilateral vs unilateral) | 🔴 Crítico | Trade | `js/combat/tradeSystem.js`, `js/trade/tradeSystem.js`, `index.html` | Aberto |
| R02 | Fórmula de combate runtime diverge do Patch Canônico v2.2 | 🔴 Crítico | Combate | `js/combat/wildCore.js`, `docs/PATCH_CANONICO_COMBATE_V2.2.md` | Aberto — decisão arquitetural |
| R03 | Drift documental em `PLANO_DE_ACAO.md` (17 skills → 65 reais) | 🔴 Alto | Documentação | `docs/PLANO_DE_ACAO.md` | Aberto |
| R04 | Evolução: módulo legado com HP% vs cura total coexiste | 🟡 Alto | Evolução | `js/data/evolutionSystem.js`, `js/progression/evolutionSystem.js` | Mitigado por teste-guarda |
| R05 | `encounter.active` não verificado em handlers Wild Combat | 🟡 Alto | Combate | `js/combat/wildActions.js` | Aberto |
| R06 | Skills: SKILL_DEFS fallback coexiste com `data/skills.json` | 🟡 Médio | Skills | `index.html`, `js/data/skillsLoader.js`, `data/skills.json` | Migração em progresso |
| R07 | 11 CSVs raiz legados sem uso em runtime | 🟡 Médio | Dados | `*.csv` na raiz | Documentado (PT-003) |
| R08 | Slot 4 base não definido para classes | 🟡 Médio | Skills/Cards | `data/skills.json` | Documentado (PT-001) |
| R09 | 8 monstros com baseHp fora do range recomendado por raridade | 🔵 Baixo | Balanceamento | `data/monsters.json` | Avisos na validação |
| R10 | `index.html` contém ~200 linhas de lógica de grupo p/ refatorar | 🔵 Baixo | Arquitetura | `index.html` | Documentado (PR5A/B/C) |

---

## 3. Fontes de Verdade por Domínio

### 3.1 Combate

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco | Teste necessário |
|---|---|---|---|---|---|
| Fórmula de dano | `PATCH_CANONICO_COMBATE_V2.2.md` | `js/combat/wildCore.js`, `groupCombatFormula.js` | 🔴 Runtime não implementa 5 faixas de dano nem ModNível | Crítico | Teste comparativo fórmula vs spec |
| Hit check | Patch v2.2 (RC bilateral) | `wildCore.js` (unilateral d20 + ATK vs DEF) | 🟡 Simplificação vs spec | Médio | — |
| Mitigação DEF | `floor(DEF/2)` no patch | `def * defMult` no runtime | 🟡 Diferente | Médio | — |

### 3.2 Skills

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco | Teste necessário |
|---|---|---|---|---|---|
| Definições de skills | `data/skills.json` (v2.0.0, 65 skills) | `skillsLoader.js` → `buildRuntimeSkillDefs()` → `SKILL_DEFS` | ✅ Unificado (JSON → runtime) | Baixo | — |
| Fallback | `SKILL_DEFS_FALLBACK` inline | Ativado se JSON falhar | 🟡 Coexistência temporária | Médio | Teste de fallback |
| Docs | `PLANO_DE_ACAO.md` diz "17 skills, 5 classes" | 65 skills, 8 classes | 🔴 Drift grave | Alto | Atualizar doc |

### 3.3 Captura

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| Fórmula | `GAME_RULES.md` + `wildCore.js` | `calculateCaptureScore()` em `wildCore.js` | ✅ Alinhado | Baixo |
| Thresholds | `captureScoreThreshold` por raridade em config | Verificado em `groupActions.js` | ✅ Alinhado | Baixo |

### 3.4 Classes e Vantagens

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| 8 classes | `AGENTS.md`, `AUTHORITY_MAP.md` | `data/monsters.json`, `data/skills.json` | ✅ Alinhado | Baixo |
| Ciclo de vantagens | `GAME_RULES.md` (7 classes) | Runtime (inclui Animalista neutro) | ✅ Consistente | Baixo |

### 3.5 Cards / Card Layer

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| Arquitetura | `CARD_LAYER_ARCHITECTURE_v0.1.2.md` | `js/cards/` (4 módulos) | ✅ Alinhado | Baixo |
| Feature flags | `enabled: false` (Fase 1B) | `cardFeatureFlags.js` | ✅ Desabilitado | Baixo |
| Cards definidos | 3 cards Guerreiro (Fase 1) | `data/cards.json` (1 implementado) | 🟡 Incompleto | Baixo |

### 3.6 Monstros

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| Catálogo | `data/monsters.json` (64 monstros) | `loadMonsters()` via `dataLoader.js` | ✅ Alinhado | Baixo |
| Fallback | `data/monsters.bootstrap.json` | Usado se JSON principal falhar | ✅ Correto | Baixo |
| Inline catalog | — | ❌ Nenhum `MONSTER_CATALOG` inline encontrado | ✅ Sem duplicidade | Baixo |

### 3.7 Evolução

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| Evolução runtime | `js/data/evolutionSystem.js` | `window.EvolutionSystem.executeEvolution()` | ✅ Canônico | Baixo |
| Evolução legado | `js/progression/evolutionSystem.js` | ❌ NÃO importado no runtime | 🟡 Existe, não roda | Médio |
| HP pós-evolução | Canônico: preserva HP% | Legado: cura total | 🔴 Diferença crítica | Alto (se legado for conectado) |
| Design data | `design/canon/evolution_lines.json` | Referência, não carregado em runtime | ✅ OK | Baixo |

### 3.8 Trade

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| Trade canônico | `js/combat/tradeSystem.js` (bilateral) | Via `TradeUI.executeTrade()` | ✅ Painel principal | Baixo |
| Trade legado | `js/trade/tradeSystem.js` (unilateral) | Via `executeTradeFromModal()` no `index.html` | 🔴 Ambos ativos | Crítico |
| Box support | Canônico: sim | Legado: não | 🟡 Diferença funcional | Alto |

### 3.9 Save/Load

| Aspecto | Fonte declarada | Fonte runtime | Divergência | Risco |
|---|---|---|---|---|
| Chave canônica | `monstrinhomon_state` | `SaveLayer` + `StorageManager` | ✅ Unificado | Baixo |
| Transacionalidade | `StorageManager` com temp key | Implementado (write→verify→commit) | ✅ Seguro | Baixo |
| Slots manuais | Snapshots imutáveis (1-3) | Via `SaveLayer` | ✅ Correto | Baixo |

### 3.10 Demais Domínios

| Domínio | Status | Risco |
|---|---|---|
| Itens | `data/items.json` (26 itens), validado, sem duplicidade | ✅ Baixo |
| Quests | `js/data/questSystem.js` (hardcoded), `QUESTS.csv` legado | 🟡 Médio |
| Drops | `js/data/dropSystem.js` (hardcoded), `DROPS.csv` legado | 🟡 Médio |
| XP | `js/progression/xpActions.js`, `xpCore.js` | ✅ Baixo |
| Tutorial | `js/tutorial/tutorialSystem.js` | ✅ Baixo |
| Modo terapeuta | `js/therapy/` (medalProgress, therapyRewards) | ✅ Baixo |
| Batalha em grupo | `js/combat/group*.js` (6 módulos canônicos) | ✅ Baixo |
| UI | `js/ui/` (múltiplos módulos) | ✅ Baixo |
| Mapa/World | `data/worldMap.json` (29 nós, 3 bosses) | ✅ Baixo |

---

## 4. Funções/Sistemas Concorrentes

### 4.1 Trade — CRÍTICO

| Caso | Arquivos | Fonte canônica | Concorrente/legado | Risco | Remover agora? | Teste antes |
|---|---|---|---|---|---|---|
| Trade bilateral vs unilateral | `js/combat/tradeSystem.js` (canônico) | `js/combat/tradeSystem.js` | `js/trade/tradeSystem.js` | 🔴 Crítico — ambos ativos | ❌ Não — migrar modal primeiro | Teste de regressão trade modal → canônico |

**Evidência:** `index.html` chama `window.TradeSystem.proposeTradeAction()` (legado) no modal e `TradeUI.executeTrade()` (canônico) no painel. APIs incompatíveis: bilateral (A↔B) vs unilateral (A→B).

### 4.2 Evolução — MITIGADO

| Caso | Arquivos | Fonte canônica | Concorrente/legado | Risco | Remover agora? | Teste antes |
|---|---|---|---|---|---|---|
| HP% vs cura total | `js/data/evolutionSystem.js` (canônico) | `js/data/evolutionSystem.js` | `js/progression/evolutionSystem.js` | 🟡 Alto (se reconectado) | ❌ Não — teste-guarda ativo | `evolutionRuntimeAlignment.test.js` já cobre |

**Evidência:** `index.html` importa APENAS `js/data/evolutionSystem.js`. Teste `evolutionRuntimeAlignment.test.js` bloqueia import do legado. Legado mantido para diagnóstico e referência.

### 4.3 Skills — EM MIGRAÇÃO

| Caso | Arquivos | Fonte canônica | Concorrente/legado | Risco | Remover agora? | Teste antes |
|---|---|---|---|---|---|---|
| `SKILL_DEFS` inline vs `data/skills.json` | `data/skills.json` + `skillsLoader.js` (canônico) | `data/skills.json` | `SKILL_DEFS_FALLBACK` inline | 🟡 Médio | ❌ Não — fallback necessário | Teste de fallback sem JSON |

**Evidência:** `initSkillDefs()` constrói `SKILL_DEFS` a partir do JSON via `buildRuntimeSkillDefs()`. Fallback existe com warning explícito. JSON contém 65 skills cobrindo 8 classes.

### 4.4 Monster Catalog — RESOLVIDO

| Caso | Arquivos | Fonte canônica | Concorrente/legado | Risco | Remover agora? | Teste antes |
|---|---|---|---|---|---|---|
| Catálogo inline vs JSON | `data/monsters.json` (canônico) | `data/monsters.json` | Nenhum inline encontrado | ✅ Baixo | N/A | — |

### 4.5 SaveLayer vs StorageManager — RESOLVIDO

| Caso | Arquivos | Fonte canônica | Concorrente/legado | Risco | Remover agora? | Teste antes |
|---|---|---|---|---|---|---|
| Camada de save | `js/saveLayer.js` + `js/storage.js` | Ambos (complementares) | Nenhum — devidamente hierarquizados | ✅ Baixo | N/A | — |

### 4.6 CSVs raiz vs JSONs

| Caso | Arquivos | Fonte canônica | Concorrente/legado | Risco | Remover agora? | Teste antes |
|---|---|---|---|---|---|---|
| 11 CSVs na raiz | `*.csv` raiz | JSONs em `data/` | CSVs são legado inerte | 🟡 Médio (confusão) | ❌ Não — mover para `docs/legacy/` | Buscar referências em testes |

---

## 5. Arquivos Candidatos à Remoção

### Classificação Conservadora

| Arquivo | Classificação | Referências encontradas | Ação recomendada | Rollback |
|---|---|---|---|---|
| `js/trade/tradeSystem.js` | Fallback/compatibilidade | `index.html` (modal), testes | ❌ NÃO remover — migrar modal primeiro | N/A |
| `js/progression/evolutionSystem.js` | Deprecated (teste-only) | Testes legados | ❌ NÃO remover — valor diagnóstico | N/A |
| `CAPTURE_TABLE.csv` | Legado inerte | Testes apenas | Mover para `docs/legacy/` | `git mv` reverso |
| `CLASSES.csv` | Legado inerte | Testes apenas | Mover para `docs/legacy/` | `git mv` reverso |
| `CONFIG.csv` | Legado inerte | Nenhuma referência runtime | Mover para `docs/legacy/` | `git mv` reverso |
| `DROPS.csv` | Legado inerte | Comentários em `dropSystem.js` | Mover para `docs/legacy/` | `git mv` reverso |
| `ENCOUNTERS.csv` | Legado inerte | Testes apenas | Mover para `docs/legacy/` | `git mv` reverso |
| `EVOLUCOES.csv` | Legado inerte | Testes apenas | Mover para `docs/legacy/` | `git mv` reverso |
| `HABILIDADES.csv` | Legado inerte | Nenhuma referência runtime | Mover para `docs/legacy/` | `git mv` reverso |
| `ITENS.csv` | Legado inerte | Nenhuma referência runtime | Mover para `docs/legacy/` | `git mv` reverso |
| `LOCAIS.csv` | Legado inerte | Nenhuma referência runtime | Mover para `docs/legacy/` | `git mv` reverso |
| `QUESTS.csv` | Legado inerte | Comentários em `questSystem.js` | Mover para `docs/legacy/` | `git mv` reverso |
| `RULES.csv` | Legado inerte | Nenhuma referência runtime | Mover para `docs/legacy/` | `git mv` reverso |
| `docs/PLANO_DE_ACAO.md` | Documentação legado (drift) | Nenhuma | Atualizar ou marcar como legado | Versionamento |

**Critérios aplicados:** busca por import/export, referência em `index.html`, referência em testes, referência em docs, compatibilidade com save.

---

## 6. Bugs Prováveis ou Confirmados

### 6.1 Confirmados / Corrigidos

| Bug | Status | Evidência | Localização |
|---|---|---|---|
| `team[0]` hardcoded onde deveria usar `activeIndex` | ✅ **Corrigido** | Comentário "BUG FIX" em `xpActions.js` e `groupActions.js`; testes verificam | `js/progression/xpActions.js`, `js/combat/groupActions.js` |
| Recompensa duplicada | ✅ **Protegido** | Flag `rewardsGranted` em `groupCore.js`; testes verificam idempotência | `js/combat/groupCore.js`, `js/progression/xpActions.js` |

### 6.2 Prováveis / Em Investigação

| Bug | Severidade | Evidência | Localização | Ação |
|---|---|---|---|---|
| Ações aceitas após `encounter.active = false` no Wild Combat | 🟡 Alto | `executeWildAttack()`, `executeWildCaptureAction()`, `executeWildItemUse()` **não verificam** `encounter.active` antes de processar | `js/combat/wildActions.js` | Verificar se a UI bloqueia antes de chamar; se não, adicionar guard |
| Trade modal usa sistema legado (unilateral) enquanto painel usa canônico (bilateral) | 🔴 Crítico | `executeTradeFromModal()` chama `window.TradeSystem.proposeTradeAction()` (legado) | `index.html` | Migrar modal para usar `js/combat/tradeSystem.js` |

### 6.3 Não Encontrados (Verificados)

| Possível bug | Resultado |
|---|---|
| Monstro ativo incorreto (`activeIndex`) | ✅ Corrigido e testado |
| XP no monstro errado | ✅ Corrigido (usa `activeIndex`) |
| Boss usando regra de wild | ✅ `isBoss = true`, `noFlee = true` aplicados corretamente |
| Batalha encerrada aceitando ação (Group) | ✅ Verificação de `enc.finished` em `groupActions.js` |
| `Math.random` hardcoded em lógica testável | ✅ Injeção de dependência (`rollD20`, `rng`, `rngFn`) implementada |
| Captura em estado inválido | ✅ `captureScoreThreshold` validado por raridade |
| Save após captura/evolução | ✅ `SaveLayer` + `StorageManager` transacional |

---

## 7. Gargalos Arquiteturais

| # | Gargalo | Impacto | Severidade | Plano |
|---|---|---|---|---|
| G01 | `index.html` concentra ~200 linhas de lógica de grupo | Dificulta manutenção, aumenta risco de regressão | 🟡 Médio | Extrair para módulos (PR5A/B/C documentado) |
| G02 | Quests e Drops hardcoded em JS (não em JSON) | Dificulta edição de conteúdo sem alterar código | 🟡 Médio | Migrar para `data/*.json` em PR futuro |
| G03 | Trade tem dois pontos de entrada (painel + modal) | Risco de divergência de estado | 🔴 Crítico | Unificar em PR pequeno |
| G04 | Card Layer com apenas 1 de 3 cards implementado | Bloqueia piloto com Guerreiro | 🔵 Baixo | Implementar 2 cards restantes |
| G05 | `data/skills.json` tem 65 skills mas `PLANO_DE_ACAO.md` diz 17 | Induz agente/dev ao erro | 🔴 Alto | Atualizar doc |

---

## 8. Testes Faltantes

### 8.1 Testes Existentes (Confirmados Passando)

| Comando | Resultado |
|---|---|
| `npm test` (vitest run) | ✅ 159 arquivos, 5547 testes, todos passando |
| `npm run validate-data` | ✅ OK (8 avisos de balanceamento) |
| `npm run validate:monster-assets` | ✅ 23/23 assets, sem órfãos |

### 8.2 Testes Que Faltam

| Teste ausente | Domínio | Prioridade | Justificativa |
|---|---|---|---|
| Migração do modal de trade para sistema canônico | Trade | 🔴 Alta | Dois sistemas ativos com APIs incompatíveis |
| Verificação de `encounter.active` em `wildActions.js` | Wild Combat | 🟡 Alta | Handlers não verificam estado do encontro |
| Fluxo real de evolução por XP (E2E) | Evolução | 🟡 Alta | Testes unitários cobrem, mas E2E via XP+levelup falta |
| Save/load após evolução | Save | 🟡 Média | Cobertura parcial — necessário E2E completo |
| Save/load após trade | Save | 🟡 Média | Verificar persistência pós-trade bilateral |
| KO e seleção obrigatória de novo monstro (E2E) | Combate | 🟡 Média | Fluxo UX de swap pós-KO |
| Card Layer não alterando mecânica (contrato) | Cards | 🔵 Baixa | Feature desabilitada; contrato visual-only |
| Drift entre docs e runtime (lint documental) | Docs | 🟡 Média | `PLANO_DE_ACAO.md` desatualizado |
| Recompensa idempotente em grupo (E2E) | XP | 🔵 Baixa | Unitário cobre; E2E reforçaria |

---

## 9. Plano de PRs Pequenos

| PR | Escopo | Risco | Dependências |
|---|---|---|---|
| **PR-A1** | Atualizar `PLANO_DE_ACAO.md` com estado real (65 skills, 8 classes) | 🔵 Nenhum | Nenhuma |
| **PR-A2** | Migrar modal de trade para usar `js/combat/tradeSystem.js` | 🟡 Médio | Testes de regressão trade |
| **PR-A3** | Adicionar guard `encounter.active` em `wildActions.js` | 🟡 Médio | Testes wild combat |
| **PR-A4** | Mover CSVs raiz para `docs/legacy/` | 🔵 Baixo | Atualizar referências em testes |
| **PR-A5** | Adicionar testes E2E para evolução por XP + save/load | 🔵 Baixo | Nenhuma |
| **PR-A6** | Marcar `js/progression/evolutionSystem.js` como `@deprecated` no código | 🔵 Nenhum | Nenhuma |
| **PR-A7** | Implementar 2 cards restantes do Guerreiro (Fase 1) | 🔵 Baixo | Card Layer docs |

**Ordem recomendada:** PR-A1 → PR-A3 → PR-A2 → PR-A5 → PR-A4 → PR-A6 → PR-A7

---

## 10. Lista "Não Mexer Ainda"

| Item | Motivo | Quando revisar |
|---|---|---|
| Fórmula de combate (5 faixas, ModNível) | Decisão arquitetural pendente — runtime funcional atual não deve ser quebrado sem especificação completa | Quando houver PR dedicado + testes quantitativos |
| `js/progression/evolutionSystem.js` | Valor diagnóstico + testes legados ativos | Após consolidação do sistema de evolução |
| `js/trade/tradeSystem.js` | Modal em `index.html` depende dele | Após PR-A2 (migração do modal) |
| `SKILL_DEFS_FALLBACK` | Fallback necessário se JSON falhar | Quando fallback for substituído por offline cache |
| `design/canon/` | Referência de design, não runtime | Quando houver pipeline de design → runtime |
| `data/monsters.bootstrap.json` | Fallback/seed para inicialização | Manter como safety net |
| `progression.config.json` | Pode estar em uso por testes ou config | Verificar referências antes de mexer |

---

## 11. Conclusão Franca

O projeto está em um estado **funcional e bem testado** para um MVP terapêutico. A maioria dos riscos identificados em auditorias anteriores já foi mitigada:

- **Save/Load** está unificado e transacional.
- **Evolução** tem teste-guarda que impede reconexão do módulo legado.
- **Skills** migrou de 17→65 e de 5→8 classes (JSON canônico).
- **`activeIndex`** foi corrigido e verificado.
- **Recompensas** são idempotentes.

Os 3 riscos reais que exigem ação são:

1. **Trade com dois sistemas ativos** — o mais urgente. O modal legado pode causar divergência de estado.
2. **`encounter.active` não verificado nos handlers Wild** — risco de ação pós-fim de batalha.
3. **Drift documental do `PLANO_DE_ACAO.md`** — pode induzir agente ou desenvolvedor a refazer trabalho que já existe.

O sistema de combate diverge do Patch Canônico v2.2 nas faixas de dano e ModNível, mas isso é uma **decisão arquitetural pendente**, não um bug — o runtime funciona conforme implementado. Não deve ser alterado sem especificação completa e testes quantitativos.

**Recomendação:** Executar PRs A1→A3→A2 como prioridade imediata. Demais PRs podem seguir em cadência normal.

---

## Apêndice: Validação Executada

```
$ npm test
✓ 159 test files | 5547 tests passed | 0 failed

$ npm run validate-data
✅ 64 monstros | ✅ 26 itens | ✅ 65 skills | ✅ 29 nós mapa
⚠️  8 avisos de balanceamento (baseHp fora do range)

$ npm run validate:monster-assets
✅ 23/23 assets presentes | ✅ 0 órfãos
```

---

**Próximo passo:** Executar PR-A1 (atualização documental) como primeiro passo seguro e reversível.

---

## Histórico de Revisões

| Versão | Data | Autor | Descrição |
|---|---|---|---|
| 1.0.0 | 2026-05-23 | Copilot (auditoria automatizada) | Relatório inicial — 17 domínios, 10 riscos, 6 concorrências, 9 testes faltantes |
