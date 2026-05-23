# Auditoria Geral de Riscos — Monstrinhomon

**Data:** 2026-05-23  
**Escopo:** auditoria diagnóstica completa da base de código, sem alteração de código, dados ou comportamento.  
**Modo:** documentação técnica, classificação de riscos, fontes de verdade, concorrências, bugs prováveis/confirmados, testes faltantes e plano de PRs.  
**Arquivo:** `docs/AUDIT_GENERAL_RISKS_2026-05.md`

---

## 0. Resumo executivo

Esta auditoria consolida riscos encontrados na base atual do Monstrinhomon e organiza um plano seguro de correção. O objetivo não é refatorar imediatamente, nem apagar arquivos, mas impedir que o projeto avance com sistemas concorrentes, documentação desatualizada, fontes de verdade ambíguas e bugs latentes em fluxos centrais.

O projeto está em uma fase tecnicamente melhor do que versões anteriores: há testes numerosos, CI configurado, documentação canônica, arquivos de autoridade e camadas já separadas para dados, combate, progressão, trade, cards e UI. Mesmo assim, existem riscos importantes porque partes antigas e novas ainda coexistem.

### Principais achados

| Risco | Gravidade | Detalhe |
|---|---:|---|
| Sistema duplo de comércio | 🔴 Crítico | `js/combat/tradeSystem.js` e `js/trade/tradeSystem.js` coexistem com APIs incompatíveis e ainda aparecem em fluxos diferentes. |
| Divergência da fórmula de combate | 🔴 Crítico | O runtime precisa ser checado contra `docs/PATCH_CANONICO_COMBATE_V2.2.md`; há indício de não implementação completa de dano de alcance 5 e `ModNível`. |
| Drift documental ativo | 🔴 Crítico documental | `docs/PLANO_DE_ACAO.md` descreve estado antigo das skills, enquanto `data/skills.json` já declara ser fonte canônica runtime. |
| Evolution duplicado | 🟠 Alto | Há `js/data/evolutionSystem.js`, `js/progression/evolutionSystem.js` e `design/canon/evolution_lines.json` com contratos diferentes. Mitigado por teste de guarda, mas não encerrado. |
| Card Layer vs mecânica | 🟠 Alto | Card Layer deve continuar visual-only; qualquer duplicação de campos mecânicos criaria nova fonte de verdade. |
| Save/load após trade/evolução | 🟠 Alto | Fluxos complexos podem persistir estado divergente se trade/evolução não forem cobertos por testes E2E. |
| CSVs e artefatos legados | 🟡 Médio | CSVs e arquivos de migração podem confundir agentes e desenvolvedores se não forem movidos/rotulados. |
| `index.html` monolítico | 🟡 Médio | Ainda concentra UI, orquestração e parte do fluxo runtime; aumenta risco de regressões. |
| Testes de fluxo real incompletos | 🟡 Médio | Muitas funções estão testadas, mas alguns fluxos integrados ainda precisam de E2E. |
| Arquivos de documentação histórica | 🟢 Baixo/Médio | `docs/archive/**` deve ser preservado por governança, mas precisa de sinalização clara para não ser fonte atual. |

### Resultado de testes informado para este ciclo

- Testes informados como aprovados: **5547/5547**.
- Este relatório é documental. Ele **não altera código, dados, fórmulas, balanceamento, saves ou comportamento runtime**.

> Observação de governança: este documento registra o resultado informado no ciclo de auditoria/PR. A evidência final deve ser a execução do CI no Pull Request correspondente.

---

## 1. Fase 1 — Mapa diagnóstico do projeto

### 1.1 Classificação de áreas principais

| Área | Arquivos principais | Função provável | Status | Risco |
|---|---|---|---|---|
| Entrada principal | `index.html` | UI, orquestração, boot, chamadas globais, integração de módulos | Runtime ativo | Médio/Alto: arquivo grande e sensível |
| Combate wild | `js/combat/wildCore.js`, `js/combat/wildActions.js` | Cálculo e ações de combate 1v1 | Runtime ativo | Alto se divergir do patch canônico |
| Combate em grupo | `js/combat/groupCore.js`, `js/combat/groupActions.js`, `js/combat/groupUI.js` | Turnos, ações e UI de batalha em grupo | Runtime ativo | Médio/Alto |
| Trade canônico | `js/combat/tradeSystem.js` | Troca bilateral, box, sugestões, log terapêutico | Runtime canônico provável | Crítico por coexistência com sistema legado |
| Trade legado | `js/trade/tradeSystem.js` | Troca unilateral/modal legado | Compatibilidade temporária | Crítico enquanto chamado em runtime |
| Evolução runtime | `js/data/evolutionSystem.js` | Evolução usada pelo runtime atual | Runtime provável | Alto |
| Evolução legado | `js/progression/evolutionSystem.js` | Evolução testável/legada com regra diferente | Legado/diagnóstico | Alto se usado por engano |
| Dados de monstros | `data/monsters.json` | Catálogo runtime de monstros | Fonte runtime | Médio se houver catálogo inline concorrente |
| Dados de skills | `data/skills.json` | Fonte canônica runtime de skills | Fonte runtime declarada | Alto se docs antigas induzirem uso de `SKILL_DEFS` |
| Card Layer | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`, `data/cards.json` se existir, módulos card | Representação visual/organizacional de skills | Visual-only | Alto se tentar alterar mecânica |
| Save/storage | `js/storage.js`, `js/saveLayer.js` | Persistência, migração, localStorage, snapshots | Runtime ativo | Alto para compatibilidade de saves |
| Itens/loja | `data/items.json`, `js/shopSystem.js`, loaders relacionados | Itens, loja, compra, efeitos | Runtime ativo | Médio |
| Quests/missões | arquivos `data/` e módulos de quest | Progressão narrativa e objetivos | Runtime/documental | Médio |
| Docs canônicos | `AGENTS.md`, `docs/AUTHORITY_MAP.md`, `docs/PATCH_CANONICO_COMBATE_V2.2.md` | Autoridade de projeto | Fonte de governança | Alto se contraditos |
| Docs legados | `docs/archive/**`, partes antigas de `PROXIMOS_PASSOS.md`, CSVs | Histórico e rastreabilidade | Legado | Baixo/Médio |
| Testes | `tests/**`, `e2e/**` | Regressão, contratos, smoke/E2E | Ativo | Médio se não cobrir fluxo real |
| CI | `.github/workflows/tests.yml` | Gates automáticos | Ativo | Médio se não for obrigatório em PR |

### 1.2 Regra de autoridade vigente

A auditoria respeita a regra operacional já definida no projeto:

```text
runtime vence design;
design vence legado;
Card Layer nunca vence mecânica.
```

Interpretação prática:

1. Um documento antigo não pode rebaixar uma implementação runtime já consolidada.
2. Um módulo legado não deve ser removido sem prova de não uso.
3. A Card Layer não pode definir dano, custo, alvo, fórmula, energia, captura ou progressão.
4. Arquivos de design/cânone podem orientar runtime, mas precisam de adaptadores claros.
5. CSVs raiz devem ser tratados como legado/histórico salvo evidência explícita de carregamento runtime.

---

## 2. Fase 2 — Fonte da verdade por domínio

| # | Domínio | Fonte da verdade atual/provável | Concorrentes/legado | Risco | Ação recomendada |
|---:|---|---|---|---|---|
| 1 | Combate | `docs/PATCH_CANONICO_COMBATE_V2.2.md` + módulos runtime de combate | regras antigas em docs e funções inline | 🔴 Crítico | Criar teste de alinhamento fórmula/runtime. |
| 2 | Skills/Habilidades | `data/skills.json` via loader/runtime | `SKILL_DEFS` antigo, `docs/PLANO_DE_ACAO.md` antigo | 🔴 Crítico documental | Atualizar docs antigas e impedir instruções que recriem `SKILL_DEFS`. |
| 3 | Captura | runtime em `index.html`/módulos de encontro e regras de captura | docs antigas | 🟡 Médio | Mapear função canônica e cobrir falha/sucesso/save. |
| 4 | Classes | `AGENTS.md`, `docs/AUTHORITY_MAP.md`, dados runtime | listas antigas com 7 classes | 🟠 Alto | Manter 8 classes e proteger Animalista. |
| 5 | Cartas/Card Layer | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` | tentativas de duplicar mecânica em cards | 🟠 Alto | Teste garantindo visual-only. |
| 6 | Monstros | `data/monsters.json` | `MONSTER_CATALOG` inline/fallback, CSVs | 🟡 Médio | Confirmar fallback legítimo e documentar. |
| 7 | Evolução | `js/data/evolutionSystem.js` + orquestração runtime; dados em `design/canon/evolution_lines.json` | `js/progression/evolutionSystem.js` | 🟠 Alto | Manter teste de guarda e consolidar em PR próprio. |
| 8 | Trade/Comércio | `js/combat/tradeSystem.js` | `js/trade/tradeSystem.js` | 🔴 Crítico | Migrar modal legado para adapter canônico. |
| 9 | Save/load | `js/storage.js`, `js/saveLayer.js` | chamadas diretas a localStorage/estado antigo | 🟠 Alto | Testes pós-trade, pós-evolução, pós-captura. |
| 10 | Itens | `data/items.json` + loaders/sistema de loja | dados antigos/CSV se existirem | 🟡 Médio | Validar itens equipados/quebra/efeitos. |
| 11 | Missões/Quests | dados runtime em `data/` e UI de missões | docs antigas de expansão CSV | 🟡 Médio | Mapear fonte runtime e remover orientação CSV antiga. |
| 12 | Drops | dados runtime de drops | CSVs antigos | 🟢 Baixo/Médio | Manter como legado até prova. |
| 13 | XP | `js/progression/xpCore.js`, `js/progression/xpActions.js` | tabelas CSV/antigas | 🟡 Médio | Testar XP→level→evolução real. |
| 14 | Tutorial | módulos/fluxos de UI e docs de tutorial | instruções antigas | 🟢 Baixo | Smoke test de fluxo inicial. |
| 15 | Terapia/Mestre | modo terapeuta/debug, logs, painel mestre | logs antigos/debug soltos | 🟡 Médio | Garantir que não quebra sessão infantil. |
| 16 | Grupo/Batalha em grupo | `groupCore`, `groupActions`, `groupUI` | `groupBattleLoop`, `groupBattleState` deprecated | 🟡 Médio | Manter deprecated até teste de não uso. |
| 17 | UI | `index.html`, `css/**`, módulos `js/ui/**` | UI inline legada | 🟡 Médio | Refatorar só com testes/smoke visual. |

---

## 3. Fase 3 — Matriz de riscos

| ID | Gravidade | Área | Problema | Evidência/indício | Impacto | Confiança | Ação recomendada |
|---|---|---|---|---|---|---:|---|
| R-001 | 🔴 Crítico | Trade | Dois sistemas ativos com APIs incompatíveis | `js/combat/tradeSystem.js` bilateral vs `js/trade/tradeSystem.js` unilateral | comportamento divergente, bugs de save/box, difícil auditoria | Alta | Migrar modal para fonte canônica; manter adapter temporário. |
| R-002 | 🔴 Crítico | Combate | Runtime pode divergir do Patch v2.2 | indício de ausência de dano alcance 5 e `ModNível` completo | balanceamento errado, boss/TTK incorretos | Média/Alta | Criar teste de alinhamento fórmula e revisar implementação. |
| R-003 | 🔴 Crítico documental | Documentação | `PLANO_DE_ACAO.md` descreve estado antigo de skills | documento fala em 17 skills/5 classes; `data/skills.json` declara versão canônica | agentes podem recriar sistema antigo e quebrar arquitetura | Alta | Atualizar ou marcar como legado/redirecionamento. |
| R-004 | 🟠 Alto | Evolution | Dois módulos de evolução com contratos diferentes | `js/data/evolutionSystem.js` vs `js/progression/evolutionSystem.js` | HP, stats, buffs e identidade podem divergir | Alta | Consolidar apenas após testes E2E. |
| R-005 | 🟠 Alto | Save/load | Fluxos complexos sem E2E suficiente | trade/evolução/box/captura alteram estado persistente | save corrompido ou estado impossível | Média | Criar testes pós-trade e pós-evolução. |
| R-006 | 🟠 Alto | Card Layer | Risco de duplicar mecânica em cards | arquitetura exige visual-only | cards podem virar nova fonte de verdade | Média | Teste guardrail: cards não definem dano/custo/alvo runtime. |
| R-007 | 🟡 Médio | Arquitetura | `index.html` ainda concentra fluxo sensível | boot, UI, chamadas globais, integração | regressões em refactors grandes | Alta | PRs pequenos e extração gradual. |
| R-008 | 🟡 Médio | Grupo | Módulos deprecated ainda existem | `groupBattleLoop.js`, `groupBattleState.js` aparecem como deprecated em auditoria anterior | confusão e import acidental | Média | Anotar deprecated e testar ausência de uso antes de remover. |
| R-009 | 🟡 Médio | Dados legados | CSVs e artefatos históricos no repo | CSVs raiz e migrações antigas | confusão sobre fonte de dados | Alta | Mover para legacy/archive após decisão. |
| R-010 | 🟢 Baixo/Médio | Docs históricas | `docs/archive/**` pode parecer fonte atual | muitos relatórios antigos | leitura errada por agentes | Alta | Adicionar README de archive e aviso de não autoridade. |

---

## 4. Fase 4 — Casos de concorrência analisados

### 4.1 Trade — 🔴 concorrência crítica ativa

| Aspecto | Sistema canônico provável | Sistema legado/concorrente |
|---|---|---|
| Arquivo | `js/combat/tradeSystem.js` | `js/trade/tradeSystem.js` |
| Modelo | bilateral A↔B | unilateral/transferência |
| Integração | painel principal de troca, box, sugestões, log | modal legado |
| Risco | alto/crítico | alto/crítico |

Diagnóstico: os dois sistemas não são intercambiáveis. Um aceita trade bilateral com box; o outro opera transferência unilateral. Enquanto os dois forem chamados em runtime, o comportamento do usuário pode depender do caminho de UI.

Ação segura:

1. Criar adapter para o modal legado usando o sistema canônico.
2. Cobrir mensagens de erro e persistência.
3. Remover chamada direta a `window.TradeSystem` somente depois.
4. Só então classificar `js/trade/tradeSystem.js` como removível.

### 4.2 Evolution — 🟡 concorrência mitigada, mas não encerrada

| Aspecto | Runtime atual/provável | Legado/diagnóstico |
|---|---|---|
| Arquivo | `js/data/evolutionSystem.js` | `js/progression/evolutionSystem.js` |
| HP após evolução | preserva percentual | cura totalmente |
| Stats | recálculo/template externo | aplica +10% fixo |
| Buffs | preserva/depende do fluxo | limpa |
| Risco | alto | alto se usado por engano |

Diagnóstico: há teste de guarda e documentação específica, mas o risco não está encerrado porque a consolidação ainda não aconteceu.

Ação segura:

1. Manter teste de alinhamento runtime.
2. Criar E2E XP→evolução→save→reload.
3. Decidir explicitamente HP% vs cura total e stats por template vs +10%.
4. Só então unificar/remover legado.

### 4.3 Skills — 🟡 migração em andamento / drift documental

| Aspecto | Estado atual | Risco |
|---|---|---|
| `data/skills.json` | declara ser fonte canônica runtime | deve ser preservado |
| `SKILL_DEFS` | mencionado historicamente e possivelmente ainda usado/fallback | risco de ressuscitar regra antiga |
| `docs/PLANO_DE_ACAO.md` | descreve estado antigo: 17 skills/5 classes | drift documental alto |

Diagnóstico: a migração parece avançada, mas a documentação antiga pode induzir agentes a fazerem o caminho errado.

Ação segura:

1. Atualizar `docs/PLANO_DE_ACAO.md` com aviso de legado.
2. Criar teste de drift: docs não podem declarar 17 skills/5 classes como estado atual.
3. Garantir que a Card Layer usa skills efetivas sem redefinir mecânica.

### 4.4 Catalog — ✅ risco reduzido/resolvido com fallback

| Aspecto | Fonte atual | Legado/fallback |
|---|---|---|
| Monstros runtime | `data/monsters.json` | `MONSTER_CATALOG` inline/fallback se existir |
| Risco | médio se fallback virar fonte primária | baixo se documentado |

Diagnóstico: fallback não é necessariamente erro. Em um jogo para GitHub Pages/iPad, fallback pode ser proteção legítima. O problema é falta de clareza.

Ação segura: documentar fallback como compatibilidade e garantir teste que runtime prioriza JSON quando disponível.

### 4.5 Save/Storage — ✅ parcialmente resolvido, ainda requer E2E

| Aspecto | Fonte atual | Risco |
|---|---|---|
| Storage | `js/storage.js`, `js/saveLayer.js` | estado divergente após fluxos complexos |
| Chamadas antigas | localStorage direto se ainda houver | risco médio |

Diagnóstico: a arquitetura de storage já foi melhorada, mas os maiores riscos não são funções isoladas; são fluxos integrados após trade/evolução/captura/box.

Ação segura: testes pós-evento com save/reload.

### 4.6 CSVs e migrações antigas — ✅ legado, não runtime

| Arquivo/tipo | Status | Ação |
|---|---|---|
| CSVs raiz | legado/histórico salvo prova de runtime | mover para legacy em PR separado |
| JSONs de migração antigos | artefatos de transição | remover só com allowlist e CI |
| `docs/archive/**` | histórico/governança | não remover automaticamente |

Diagnóstico: não são bug runtime, mas são risco para agentes e novos colaboradores.

Ação segura: mover/rotular sem mudar comportamento.

---

## 5. Fase 5 — Análise de bugs

### 5.1 Bugs prováveis em aberto

| ID | Área | Bug provável | Evidência/indício | Impacto | Próximo teste |
|---|---|---|---|---|---|
| B-001 | Wild encounter | Proteção ausente ou insuficiente para `encounter.active` em `wildActions.js` | risco de ação após encontro encerrado | ação duplicada, recompensa indevida, estado inválido | teste: ação depois de fim do encontro deve falhar sem side effect |
| B-002 | Trade modal | Modal de negociação ainda pode usar sistema legado | coexistência `js/trade/tradeSystem.js` | comportamento diferente do painel canônico | teste: modal chama adapter canônico e persiste igual ao painel |

### 5.2 Bugs confirmados e corrigidos anteriormente

| ID | Bug | Status | Observação |
|---|---|---|---|
| BC-001 | uso incorreto de `activeIndex` / `team[0]` | corrigido/guardado | manter teste regressivo; não reabrir sem evidência nova |
| BC-002 | idempotência de recompensa | corrigido/guardado | manter teste de recompensa única por batalha |

### 5.3 Verificações limpas nesta auditoria

| # | Área verificada | Resultado |
|---:|---|---|
| 1 | Presença de CI com `npm test` | limpo: workflow contém gate unitário |
| 2 | Gate `validate-data` | limpo: workflow contém validação de dados |
| 3 | Gate `validate:monster-assets` | limpo: workflow contém validação de assets |
| 4 | Smoke wild loop Vitest | limpo: workflow contém `test:wild-loop:vitest` |
| 5 | E2E wild loop Playwright | limpo: workflow contém job dedicado |
| 6 | Regra de autoridade documentada | limpo: existe mapa de autoridade recente |
| 7 | Card Layer visual-only documentada | limpo como regra; ainda precisa teste guardrail |

---

## 6. Fase 6 — Arquivos classificados para remoção, migração ou sinalização

Critério conservador: **nenhum arquivo deve ser apagado neste relatório**. A classificação abaixo define candidatos para PRs futuros, sempre com busca de referência, CI antes/depois e rollback.

| # | Arquivo | Classificação | Pode remover agora? | Motivo | Ação segura |
|---:|---|---|---|---|---|
| 1 | `XP_TABLE.csv` | candidato à remoção/migração | Não | provável legado de XP | mover/remover em PR allowlist |
| 2 | `_DV.csv` | candidato à remoção/migração | Não | artefato legado | confirmar não uso |
| 3 | `MASTER_CONTROLS.csv` | candidato à remoção/migração | Não | controle antigo | confirmar não uso |
| 4 | `TEST_SCENARIO.csv` | candidato à remoção/migração | Não | cenário legado/manual | mover para docs/legacy se útil |
| 5 | `README.csv` | candidato à remoção/migração | Não | legado documental | substituir por README de legacy |
| 6 | `.merge-status` | candidato à remoção | Não | artefato operacional | remover só com PR pequeno |
| 7 | `docs/migration_phase1_id_remap.json` | candidato à remoção | Não | artefato de migração antiga | validar ausência de referência |
| 8 | `docs/migration_phase1_runtime_candidate.json` | candidato à remoção | Não | artefato de migração antiga | validar ausência de referência |
| 9 | `docs/migration_phase1_runtime_candidate_reconciled.json` | candidato à remoção | Não | artefato de migração antiga | validar ausência de referência |
| 10 | `progression.config.json` | revisão humana | Não | válido, mas autoridade incerta | decidir autoridade antes |
| 11 | `HABILIDADES.csv` | legado/migração | Não | fonte antiga de skills | mover para legacy se existir na árvore atual |
| 12 | `MONSTROS.csv` | legado/migração | Não | fonte antiga de monstros | mover para legacy se existir na árvore atual |
| 13 | `EVOLUCOES.csv` | legado/migração | Não | fonte antiga de evolução | mover para legacy se existir na árvore atual |

### Critérios obrigatórios antes de remover qualquer item

1. Buscar import/export.
2. Buscar referência em `index.html`.
3. Buscar referência em testes.
4. Buscar referência em docs canônicos.
5. Verificar se é usado por GitHub Pages, script tag, window global ou ferramenta externa.
6. Rodar CI completo antes e depois.
7. Garantir rollback simples.
8. Não misturar remoção com refactor funcional.

---

## 7. Testes ausentes identificados

| # | Teste faltante | Área | Por que importa | Prioridade |
|---:|---|---|---|---|
| 1 | Modal de trade usando fonte canônica | Trade | remove concorrência crítica | 🔴 Crítica |
| 2 | Save/load após trade | Trade/Save | evita perda ou duplicação de monstro | 🔴 Crítica |
| 3 | `encounter.active` bloqueando ação pós-fim | Wild combat | evita side effect após batalha encerrada | 🔴 Crítica |
| 4 | E2E XP→evolução→save→reload | Evolution/Save | valida fluxo real, não só função pura | 🟠 Alta |
| 5 | Comparação fórmula runtime vs Patch v2.2 | Combate | impede drift de dano/ModNível | 🔴 Crítica |
| 6 | Card Layer não altera mecânica | Cards/Skills | garante visual-only | 🟠 Alta |
| 7 | KO exige troca ou encerra sem soft-lock | Combate | evita travamento em sessão | 🟠 Alta |
| 8 | Recompensa idempotente em grupo | Grupo/Recompensa | impede duplicação em fluxo coletivo | 🟡 Média |
| 9 | Drift documental de skills/classes | Docs/Governança | impede agentes de seguir plano antigo | 🟡 Média |

---

## 8. Plano de ação em 7 PRs

### PR 1 — Correção de documentação e autoridade

Objetivo: eliminar drift documental perigoso.

Arquivos prováveis:

- `docs/PLANO_DE_ACAO.md`
- `docs/AUTHORITY_MAP.md`, se necessário
- `AGENTS.md`, se necessário

Escopo:

- marcar trechos antigos como legado;
- corrigir menção a “17 skills / 5 classes”;
- apontar `data/skills.json` como fonte runtime atual;
- reforçar que Card Layer não altera mecânica.

Risco: baixo.  
Tipo: documentação.  
Rollback: reverter PR.

### PR 2 — Guardrails contra vulnerabilidades e regressões de CI

Objetivo: garantir que qualquer PR rode gates completos.

Escopo:

- confirmar `npm test`;
- confirmar `npm run test:wild-loop`;
- confirmar `npm run test:wild-loop:vitest`;
- confirmar `npm run validate-data`;
- confirmar `npm run validate:monster-assets`;
- avaliar Dependabot/audit sem forçar upgrade quebrável.

Risco: baixo/médio.  
Tipo: CI/documentação/teste.

### PR 3 — Migração do modal de trade

Objetivo: remover concorrência crítica sem apagar módulo legado ainda.

Escopo:

- criar adapter do modal para chamar `js/combat/tradeSystem.js`;
- manter API antiga temporariamente se necessário;
- adicionar testes de paridade.

Risco: alto.  
Tipo: funcional, pequeno e testado.

### PR 4 — Testes E2E de fluxos sensíveis

Objetivo: cobrir fluxos reais que funções unitárias não provam.

Fluxos:

- trade→save→reload;
- XP→level→evolução→save→reload;
- wild encounter encerrado bloqueia ação;
- KO exige troca/encerra sem soft-lock.

Risco: médio.  
Tipo: testes.

### PR 5 — Limpeza conservadora de CSVs/artefatos

Objetivo: reduzir confusão de fontes antigas sem risco runtime.

Escopo:

- mover CSVs e artefatos para `docs/legacy/` ou remover por allowlist;
- criar README de legado;
- CI completo antes/depois.

Risco: médio se remover; baixo se apenas mover e documentar.

### PR 6 — Anotações de depreciação e adapters temporários

Objetivo: impedir uso acidental de sistemas antigos.

Escopo:

- anotar `js/trade/tradeSystem.js` como compatibilidade temporária após migração;
- anotar `js/progression/evolutionSystem.js` como legado/diagnóstico;
- anotar módulos deprecated de group battle.

Risco: baixo/médio.

### PR 7 — Preenchimento/estabilização da camada de Cards

Objetivo: continuar Card Layer sem quebrar runtime.

Escopo:

- preencher cards apenas como representação visual;
- não duplicar `power`, `energy_cost`, `accuracy`, `target`, `duration`, `range`, `effect`;
- teste garantindo que cards não alteram combate.

Risco: médio.

---

## 9. Lista “não mexer ainda”

Não alterar/remover nesta fase:

1. `js/data/evolutionSystem.js`.
2. `js/progression/evolutionSystem.js`.
3. `js/combat/tradeSystem.js`.
4. `js/trade/tradeSystem.js`.
5. `data/skills.json`.
6. `data/monsters.json`.
7. `js/storage.js`.
8. `js/saveLayer.js`.
9. `groupBattleLoop.js` e `groupBattleState.js`, se ainda existirem, antes de prova de não uso.
10. `docs/archive/**`, por valor histórico/governança.
11. Arquivos de design/cânone em `design/canon/**` sem decisão explícita de autoridade.

Motivo: todos podem ser fallback, compatibilidade, governança, fonte de dados, ou material necessário para comparação durante migração.

---

## 10. Conclusão franca

O projeto não está em estado caótico; pelo contrário, já possui um nível incomum de testes, documentação e preocupação com segurança arquitetural. O risco principal agora não é ausência total de estrutura. O risco principal é **coexistência de estruturas antigas e novas**.

A prioridade não deve ser “limpar arquivos” nem “refatorar tudo”. Isso seria tecnicamente perigoso. A prioridade correta é:

1. corrigir documentação que induz erro;
2. eliminar concorrência crítica do trade;
3. provar alinhamento da fórmula de combate com o patch canônico;
4. cobrir save/load após fluxos sensíveis;
5. só depois mover/remover legado.

### Veredito

- **Estado geral:** razoavelmente saudável, mas com riscos críticos de governança e sistemas paralelos.
- **Maior risco técnico:** Trade duplo ativo.
- **Maior risco de regra:** possível divergência entre runtime de combate e Patch v2.2.
- **Maior risco documental:** `PLANO_DE_ACAO.md` desatualizado em relação a skills/classes.
- **Primeira ação mais segura:** PR documental corrigindo autoridade e drift.
- **Ação mais perigosa agora:** apagar arquivos “antigos” ou fundir sistemas sem testes E2E.

---

## 11. Checklist final desta auditoria

- [x] Matriz de risco com 10 itens.
- [x] Fonte da verdade para 17 domínios.
- [x] 6 casos de concorrência analisados.
- [x] 2 bugs prováveis documentados.
- [x] 2 bugs confirmados/corrigidos preservados como regressão.
- [x] 7 áreas verificadas como limpas.
- [x] 13 arquivos classificados para remoção/migração/sinalização.
- [x] 9 testes ausentes identificados.
- [x] Plano de ação em 7 PRs.
- [x] Nenhuma alteração de código, dados ou comportamento runtime.
