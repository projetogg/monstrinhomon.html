# Plano de Remoção Segura do Legado de Trade

**Data:** 2026-05-25  
**Autoria:** diagnóstico automatizado — mapeamento conservador pós-depreciação.  
**Relacionado:**
- `docs/trade_source_of_truth_audit.md` — fonte de verdade definida
- `docs/AUDIT_GENERAL_RISKS_2026-05.md` — risco R01 (Trade: dois sistemas ativos)
- `docs/architecture/TRADE_MIGRATION_PLAN_2026-05.md` — plano de migração incremental
- `tests/tradeArchitecture.test.js` — guardrail arquitetural
- `tests/tradeSaveLoad.test.js` — cobertura de persistência

---

## 1. Status atual

### Fonte canônica

`js/combat/tradeSystem.js` é a **fonte canônica de verdade** para Trade.

- Usado pelo painel principal de trocas via `js/ui/tradeUI.js`.
- `index.html` chama `window.TradeUI.executeTrade(...)` no fluxo `tradeAccept()`.
- API bilateral: `validateTrade`, `executeTrade`, `getTradeableMonsters`, `getTradeSuggestions`.
- Suporta Box compartilhada, sugestões de troca e registro terapêutico.

### Legado/adapter

`js/trade/tradeSystem.js` está marcado como **`@deprecated` / adapter temporário**.

- Importado em `index.html` como `window.TradeSystem` para compatibilidade do modal antigo.
- O modal legado (`openTradeModal` / `executeTradeFromModal`) ainda chama:
  - `window.TradeSystem.proposeTradeAction(...)`
  - `window.TradeSystem.acceptTrade(...)`
- Quando `targetInstanceId` está presente no contexto, o adapter delega para `js/combat/tradeSystem.js`.
- Nenhuma nova regra de Trade deve ser adicionada ao módulo legado.

### Estado da migração

| Etapa | Status |
|---|---|
| Adapter de compatibilidade criado | ✅ |
| `js/trade/tradeSystem.js` marcado como `@deprecated` | ✅ |
| Testes de arquitetura guardam o estado atual | ✅ |
| Testes de save/load pós-trade adicionados | ✅ |
| Modal migrado para caminho canônico | ✅ (PR-A: `executeTradeFromModal` usa `window.TradeUI.executeTrade`) |
| `window.TradeSystem` removido | ❌ (pendente) |
| `js/trade/tradeSystem.js` removido | ❌ (pendente) |

> **Regra:** a remoção do legado não deve acontecer sem cumprir todas as pré-condições da Seção 5.

> **Atualização PR-A:** o modal legado deixou de chamar diretamente `window.TradeSystem.proposeTradeAction(...)` e `window.TradeSystem.acceptTrade(...)` no runtime do `index.html`.

---

## 2. Referências encontradas

Varredura completa dos símbolos: `window.TradeSystem`, `openTradeModal`, `executeTradeFromModal`, `updateTradeRecipientMonsterOptions`, `js/trade/tradeSystem.js`, `proposeTradeAction`, `acceptTrade`, `targetInstanceId`, `TradeUI`, `executeTrade`, `validateTrade`.

### 2.1 Referências ao módulo legado (`js/trade/tradeSystem.js`)

| Referência | Arquivo | Linha (aprox.) | Tipo de uso | Status | Ação futura |
|---|---|---|---|---|---|
| `import * as TradeSystem from './js/trade/tradeSystem.js'` | `index.html` | 1010 | import | Compatibilidade temporária | Remover após PR-A |
| `window.TradeSystem = TradeSystem` | `index.html` | 1025 | global window | Compatibilidade temporária | Remover após PR-B |
| `if (!window.TradeSystem)` | `index.html` | 13390 | fallback/guard | Compatibilidade temporária | Remover em PR-A |
| `window.TradeSystem.proposeTradeAction(...)` | `index.html` | 13506 | runtime | Candidato à migração | Migrar em PR-A |
| `window.TradeSystem.acceptTrade(...)` | `index.html` | 13521 | runtime | Candidato à migração | Migrar em PR-A |
| `validateTrade` (export) | `js/trade/tradeSystem.js` | 88 | export legado | Adapter | Não remover até PR-C |
| `proposeTradeAction` (export) | `js/trade/tradeSystem.js` | 136 | export legado | Adapter | Não remover até PR-C |
| `acceptTrade` (export) | `js/trade/tradeSystem.js` | 169 | export legado | Adapter | Não remover até PR-C |
| `from '../js/trade/tradeSystem.js'` | `tests/tradeArchitecture.test.js` | 23 | teste de guarda | Guardrail arquitetural | Não remover |
| `from '../js/trade/tradeSystem.js'` | `tests/tradeSystem.trade.test.js` | 14 | teste de regressão | Cobertura legada | Não remover até PR-C |
| `from '../js/trade/tradeSystem.js'` | `tests/tradeUI.test.js` | 15 | teste de regressão | Cobertura legada | Não remover até PR-C |
| `from '../js/trade/tradeSystem.js'` | `tests/tradeSaveLoad.test.js` | 28 | teste de persistência | Cobertura adapter | Não remover até PR-C |
| `js/trade/tradeSystem.js` | `docs/trade_source_of_truth_audit.md` | múltiplas | documentação | Auditoria | Atualizar em PR-C |
| `js/trade/tradeSystem.js` | `docs/AUDIT_GENERAL_RISKS_2026-05.md` | múltiplas | documentação | Diagnóstico | Atualizar em PR-C |
| `js/trade/tradeSystem.js` | `docs/architecture/TRADE_MIGRATION_PLAN_2026-05.md` | múltiplas | documentação | Plano | Atualizar em PR-C |

### 2.2 Referências ao modal legado

| Referência | Arquivo | Linha (aprox.) | Tipo de uso | Status | Ação futura |
|---|---|---|---|---|---|
| `function openTradeModal(...)` | `index.html` | 13388 | runtime (definição) | Candidato à migração | Migrar em PR-A |
| `window.openTradeModal = openTradeModal` | `index.html` | 13544 | global window | Candidato à migração | Remover em PR-A após migração |
| `onclick="executeTradeFromModal(...)"` | `index.html` | 13451 | runtime (HTML inline) | Candidato à migração | Atualizar em PR-A |
| `function executeTradeFromModal(...)` | `index.html` | 13476 | runtime (definição) | Candidato à migração | Migrar em PR-A |
| `window.executeTradeFromModal = executeTradeFromModal` | `index.html` | 13545 | global window | Candidato à migração | Remover em PR-A após migração |
| `function updateTradeRecipientMonsterOptions()` | `index.html` | 13360 | runtime (definição) | Candidato à migração | Migrar em PR-A |
| `window.updateTradeRecipientMonsterOptions = ...` | `index.html` | 13546 | global window | Candidato à migração | Remover em PR-A após migração |
| `openTrade: 'openTradeModal'` | `index.html` | 13159 | runtime (actionNames) | Candidato à migração | Migrar em PR-A |
| `openTrade: 'openTradeModal'` | `index.html` | 13206 | runtime (actionNames) | Candidato à migração | Migrar em PR-A |
| `actionNames.openTrade \|\| 'openTradeModal'` | `js/ui/playerPanelUI.js` | 102 | runtime (fallback) | Candidato à migração | Manter fallback até PR-A |
| `window.TradeSystem.proposeTradeAction(...)` em tests | `tests/tradeArchitecture.test.js` | 32 | teste de guarda | Guardrail | Não remover |
| `window.TradeSystem.acceptTrade(...)` em tests | `tests/tradeArchitecture.test.js` | 33 | teste de guarda | Guardrail | Não remover |
| `targetInstanceId: toInstanceId` | `index.html` | 13501 | runtime (adapter key) | Candidato à migração | Migrar com PR-A |

### 2.3 Referências ao sistema canônico (`js/combat/tradeSystem.js`)

| Referência | Arquivo | Linha (aprox.) | Tipo de uso | Status |
|---|---|---|---|---|
| `import ... from '../combat/tradeSystem.js'` | `js/ui/tradeUI.js` | 8 | import canônico | Manter |
| `export { executeTrade, validateTrade, ... }` | `js/ui/tradeUI.js` | 237 | re-export canônico | Manter |
| `window.TradeUI = TradeUI` | `index.html` | 1026 | global window | Manter |
| `window.TradeUI.executeTrade(...)` | `index.html` | 10189 | runtime canônico | Manter |
| `window.TradeUI?.renderTradePanel` | `index.html` | 10080 | runtime canônico | Manter |
| `window.TradeUI?.getTradeableMonsters` | `index.html` | 13345 | runtime (fallback interno) | Manter |
| `validateTrade`, `executeTrade` | `js/combat/tradeSystem.js` | múltiplas | export canônico | Manter |
| `getTradeableMonsters`, `getTradeSuggestions` | `js/combat/tradeSystem.js` | múltiplas | export canônico | Manter |
| `from '../js/combat/tradeSystem.js'` | `tests/tradeSystem.test.js` | múltiplas | teste canônico | Manter |
| `from '../js/combat/tradeSystem.js'` | `tests/tradeHardening.test.js` | múltiplas | teste canônico | Manter |
| `from '../js/combat/tradeSystem.js'` | `tests/phaseXviBugScan.test.js` | 4 | teste canônico | Manter |
| `from '../js/combat/tradeSystem.js'` | `tests/tradeSaveLoad.test.js` | múltiplas | teste canônico | Manter |
| `from '../combat/tradeSystem.js'` (via TradeUI) | `tests/tradeArchitecture.test.js` | 38–41 | guardrail canônico | Manter |

### 2.4 Referências no adapter (`js/trade/tradeSystem.js` importando canônico)

| Referência | Linha (aprox.) | Tipo de uso | Status |
|---|---|---|---|
| `import { validateTrade as validateCanonicalTrade, ... } from '../combat/tradeSystem.js'` | 29–32 | adapter → canônico | Manter até PR-C |
| `validateCanonicalTrade(...)` | 196 | delegação canônica | Manter até PR-C |
| `executeCanonicalTrade(...)` | 201 | delegação canônica | Manter até PR-C |
| `trade.targetInstanceId` | 174 | chave bilateral do adapter | Manter até PR-C |

---

## 3. Classificação das chamadas restantes

| Chamada | Pode remover agora? | Por quê | Risco | PR recomendado |
|---|---|---|---|---|
| `import * as TradeSystem from './js/trade/tradeSystem.js'` em `index.html` | ❌ Não | Toda a cadeia do modal depende desta importação | 🔴 Quebra modal imediatamente | PR-A (após migração do modal) |
| `window.TradeSystem = TradeSystem` | ❌ Não | `openTradeModal` e `executeTradeFromModal` dependem em runtime | 🔴 Quebra modal imediatamente | PR-B |
| `window.TradeSystem.proposeTradeAction(...)` | ❌ Não | Ponto central do fluxo legado ainda ativo | 🔴 Quebra modal imediatamente | PR-A |
| `window.TradeSystem.acceptTrade(...)` | ❌ Não | Efetivação da troca pelo modal | 🔴 Quebra modal imediatamente | PR-A |
| `openTradeModal` (função) | ❌ Não | Botão 🔄 no painel do jogador aponta para ela | 🔴 Quebra interação do usuário | PR-A |
| `executeTradeFromModal` (função) | ❌ Não | Chamada inline do HTML no botão de confirmação | 🔴 Quebra interação do usuário | PR-A |
| `updateTradeRecipientMonsterOptions` (função) | ❌ Não | Usado no modal para popular select de monstrinhos | 🔴 Quebra UX do modal | PR-A |
| `actionNames.openTrade: 'openTradeModal'` em `index.html` | ❌ Não | `playerPanelUI.js` recebe este nome para gerar botão | 🔴 Quebra botão de troca no painel | PR-A |
| `actionNames.openTrade || 'openTradeModal'` em `playerPanelUI.js` | ❌ Não | Fallback para geração do botão no painel de time | 🟡 Quebra botão se sem alternativa | PR-A |
| `targetInstanceId` no contexto do `executeTradeFromModal` | ❌ Não | Chave que aciona caminho bilateral do adapter | 🔴 Sem ela, trocas bilaterais regridem para unilateral | PR-A |
| `js/trade/tradeSystem.js` (arquivo) | ❌ Não | Todas as dependências acima dependem dele | 🔴 Remove todo o modal | PR-C (última etapa) |
| `proposeTradeAction` export | ❌ Não | Chamado em runtime por `executeTradeFromModal` | 🔴 | PR-C |
| `acceptTrade` export | ❌ Não | Chamado em runtime por `executeTradeFromModal` | 🔴 | PR-C |
| `validateTrade` export (legado) | ❌ Não | Usado pelos testes de regressão do módulo legado | 🟡 Quebra testes | PR-C |
| `from '../js/trade/tradeSystem.js'` em testes | ❌ Não | Cobertura de regressão ativa; remover perde rastreabilidade | 🟡 Perde cobertura | PR-C |
| `validateCanonicalTrade` / `executeCanonicalTrade` no adapter | ❌ Não | São a ponte do adapter para o canônico | 🟡 Adapter deixa de funcionar | PR-C |

---

## 4. Riscos de remover agora

1. **Quebrar o modal antigo:** `openTradeModal` e `executeTradeFromModal` são os únicos pontos de entrada do fluxo legado de troca para o usuário a partir do painel de time. Remover sem migrar deixa o botão 🔄 sem ação.

2. **Quebrar scripts globais em `index.html`:** `window.TradeSystem`, `window.openTradeModal`, `window.executeTradeFromModal` e `window.updateTradeRecipientMonsterOptions` são expostos globalmente. Qualquer script inline ou callback de event listener que os chame quebraria silenciosamente.

3. **Quebrar testes arquiteturais:** `tests/tradeArchitecture.test.js` verifica explicitamente que `index.html` contém `window.TradeSystem.proposeTradeAction(` e `window.TradeSystem.acceptTrade(`. Remover o runtime quebraria esses testes antes de atualizá-los.

4. **Quebrar compatibilidade de fluxo:** o adapter em `js/trade/tradeSystem.js` é a única ponte que garante que trocas bilaterais (com `targetInstanceId`) do modal antigo resultem no comportamento canônico correto. Sem ele, qualquer fluxo residual que ainda use o modal regridia para transferência unilateral.

5. **Perder cobertura de regressão:** `tests/tradeSystem.trade.test.js` e `tests/tradeUI.test.js` cobrem o contrato da API legada. Sem eles, mudanças silenciosas no comportamento esperado poderiam passar despercebidas.

6. **Deixar `window.TradeSystem` indefinido:** qualquer código externo, script de diagnóstico ou ferramenta que leia `window.TradeSystem` em runtime encontraria `undefined` e poderia lançar erros não tratados.

7. **Remover adapter antes de migrar a UI:** o modal HTML está hardcoded com `onclick="executeTradeFromModal(...)"`. Remover o adapter antes de atualizar o HTML deixaria o botão sem destino.

---

## 5. Pré-condições para remoção futura

A remoção de `js/trade/tradeSystem.js` e dos símbolos dependentes **só poderá acontecer quando todas as condições abaixo estiverem atendidas:**

1. Nenhuma chamada runtime depender de `window.TradeSystem` (verificar `index.html` e qualquer script inline).
2. `openTradeModal` e `executeTradeFromModal` forem migrados para `TradeUI` ou chamada canônica direta em `js/combat/tradeSystem.js`.
3. O HTML do modal tiver sido atualizado para não mais usar `onclick="executeTradeFromModal(...)"`.
4. `updateTradeRecipientMonsterOptions` for migrado para usar `window.TradeUI.getTradeableMonsters` como fonte primária sem fallback legado.
5. `playerPanelUI.js` usar um nome de ação canônico para o botão 🔄 (sem fallback para `'openTradeModal'`).
6. Todos os testes de Trade passarem após cada etapa de migração, incluindo `tests/tradeSaveLoad.test.js`.
7. `tests/tradeArchitecture.test.js` for atualizado para verificar a arquitetura pós-migração (sem referências ao modal legado).
8. `tests/tradeSystem.trade.test.js` e `tests/tradeUI.test.js` forem migrados para cobrir o fluxo canônico equivalente.
9. Documentação atualizada: `docs/trade_source_of_truth_audit.md`, `docs/AUDIT_GENERAL_RISKS_2026-05.md`, este arquivo.
10. CI completo estar verde (`npm test` + `npm run validate-data`).
11. Existir possibilidade de rollback simples (PR isolado, reversível).

---

## 6. Plano de PRs futuros

### PR-A — Migrar chamadas runtime do modal para caminho canônico

**Escopo:**
- Reescrever `openTradeModal` e `executeTradeFromModal` em `index.html` para usar diretamente `window.TradeUI.executeTrade(...)` (ou equivalente canônico).
- Eliminar a dependência de `window.TradeSystem.proposeTradeAction` e `window.TradeSystem.acceptTrade` dentro desses dois fluxos.
- Atualizar `updateTradeRecipientMonsterOptions` para usar `window.TradeUI.getTradeableMonsters` sem fallback legado.
- Atualizar `actionNames.openTrade` e fallback em `playerPanelUI.js` para usar nome canônico (ou manter `'openTradeModal'` se a função for apenas reescrita, não renomeada).
- Garantir manutenção de `saveGame()`, refresh de listas e mensagens equivalentes para o usuário.
- Adicionar testes de integração cobrindo o fluxo migrado.

**Critério de aceitação:**
- Modal funciona sem chamar `window.TradeSystem`.
- Testes de regressão passam.
- Comportamento do usuário equivalente ao anterior.

**Pré-requisito:** CI verde; teste arquitetural e de save/load verdes antes de começar.

---

### PR-B — Remover `window.TradeSystem`

**Escopo:**
- Remover `import * as TradeSystem from './js/trade/tradeSystem.js'` de `index.html`.
- Remover `window.TradeSystem = TradeSystem` de `index.html`.
- Atualizar `tests/tradeArchitecture.test.js` para não mais verificar a presença de `window.TradeSystem.proposeTradeAction(` e `window.TradeSystem.acceptTrade(`.

**Critério de aceitação:**
- Nenhum fluxo runtime referencia `window.TradeSystem`.
- Testes arquiteturais passam com nova asserção.
- CI verde.

**Pré-requisito:** PR-A concluído e CI verde.

---

### PR-C — Remover `js/trade/tradeSystem.js`

**Escopo:**
- Apagar `js/trade/tradeSystem.js`.
- Remover ou migrar `tests/tradeSystem.trade.test.js` e `tests/tradeUI.test.js` para cobrir o fluxo canônico equivalente.
- Atualizar documentação: `docs/trade_source_of_truth_audit.md`, `docs/AUDIT_GENERAL_RISKS_2026-05.md`, este arquivo.
- Verificar se há importação do legado em qualquer arquivo restante e removê-la.

**Critério de aceitação:**
- `js/trade/tradeSystem.js` não existe mais.
- Nenhum teste falha.
- Cobertura equivalente mantida para o fluxo canônico.
- Documentação atualizada e consistente.
- CI verde.

**Pré-requisito:** PR-B concluído, CI verde, pelo menos um ciclo estável sem o arquivo em produção.

---

## 7. Testes obrigatórios antes da remoção

Os seguintes testes **devem estar verdes** antes de iniciar qualquer PR de remoção:

| Teste | Finalidade | Obrigatório antes de |
|---|---|---|
| `npm test` (suíte completa) | Garante ausência de regressão | Todos os PRs |
| `tests/tradeArchitecture.test.js` | Garante invariantes arquiteturais do estado atual | PR-A, PR-B, PR-C |
| `tests/tradeSystem.test.js` | Cobre API canônica (`validateTrade`, `executeTrade`) | Todos os PRs |
| `tests/tradeHardening.test.js` | Cobre cenários de borda com Box | Todos os PRs |
| `tests/tradeSaveLoad.test.js` | Cobre persistência e round-trip de save/load | Todos os PRs |
| `tests/tradeSystem.trade.test.js` | Cobre API legada (adapter) | PR-A, PR-B |
| `tests/tradeUI.test.js` | Cobre fluxo UI via API legada | PR-A, PR-B |
| `tests/phaseXviBugScan.test.js` | Cobre bloqueio de troca inválida | Todos os PRs |
| `npm run validate-data` | Valida integridade dos dados JSON | Todos os PRs |

Se existirem testes de UI/modal automatizados (E2E via Playwright), devem ser adicionados e executados antes do PR-A.

---

## 8. Lista "não remover ainda"

Os itens a seguir **não devem ser removidos** neste PR nem em nenhum PR futuro sem antes cumprir as pré-condições da Seção 5:

| Item | Justificativa |
|---|---|
| `js/trade/tradeSystem.js` | Adapter ativo; modal runtime depende dele |
| `window.TradeSystem` | Guard em `openTradeModal` e chamadas em `executeTradeFromModal` dependem |
| `openTradeModal` | Botão 🔄 no painel de time aponta para esta função |
| `executeTradeFromModal` | Botão de confirmação no HTML do modal chama esta função via `onclick` |
| `updateTradeRecipientMonsterOptions` | Atualiza o `<select>` de monstrinhos do destinatário no modal |
| `proposeTradeAction` (export do legado) | Chamado em runtime por `executeTradeFromModal` |
| `acceptTrade` (export do legado) | Chamado em runtime por `executeTradeFromModal` |
| `tests/tradeSystem.trade.test.js` | Regressão do contrato legado; remover perde rastreabilidade |
| `tests/tradeUI.test.js` | Regressão do fluxo UI via API legada |
| `tests/tradeSaveLoad.test.js` | Cobertura de persistência do adapter bilateral |
| `tests/tradeArchitecture.test.js` | Guardrail que impede remoção prematura |
| `docs/trade_source_of_truth_audit.md` | Auditoria de referência; não remover, apenas atualizar |
| `docs/AUDIT_GENERAL_RISKS_2026-05.md` | Diagnóstico geral de riscos; não remover, apenas atualizar |

---

## Notas de rollback

Este PR é estritamente documental. Não altera comportamento de runtime.  
Rollback: reverter o PR. Sem impacto em saves, estado do jogo ou fluxo de Trade.

Se em um PR futuro (PR-A, PR-B ou PR-C) algo quebrar, o rollback é o revert do respectivo PR. Como cada PR é pequeno e atômico, o rollback não afeta os demais.

---

**Última atualização:** 2026-05-25  
**Versão:** 1.0.0 — mapeamento inicial pós-depreciação do legado
