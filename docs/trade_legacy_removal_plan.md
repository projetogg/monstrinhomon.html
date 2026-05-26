# Plano de Remoção Segura do Legado de Trade

**Data:** 2026-05-26  
**Autoria:** execução controlada PR-C (remoção do legado).  
**Relacionado:**
- `docs/trade_source_of_truth_audit.md`
- `docs/AUDIT_GENERAL_RISKS_2026-05.md`
- `tests/tradeArchitecture.test.js`
- `tests/tradeSaveLoad.test.js`

---

## 1. Status final da trilha A→B→C

| Etapa | Status |
|---|---|
| PR-A — modal legado executando via `TradeUI` | ✅ |
| PR-B — remoção de `window.TradeSystem` do runtime | ✅ |
| PR-C — remoção de `js/trade/tradeSystem.js` | ✅ |

Resultado final:
- `index.html` não importa `./js/trade/tradeSystem.js`.
- `index.html` não expõe `window.TradeSystem`.
- `js/trade/tradeSystem.js` foi removido.
- O runtime de Trade permanece canônico via `js/combat/tradeSystem.js` + `js/ui/tradeUI.js`.

---

## 2. Verificações concluídas no PR-C

1. Ausência de uso runtime legado confirmada para:
   - `window.TradeSystem`
   - import de `./js/trade/tradeSystem.js`
2. Remoção física do arquivo legado:
   - `js/trade/tradeSystem.js`
3. Migração de testes que importavam legado:
   - `tests/tradeArchitecture.test.js`
   - `tests/tradeSystem.trade.test.js`
   - `tests/tradeUI.test.js`
   - `tests/tradeSaveLoad.test.js`
4. Persistência pós-trade mantida com cobertura ativa em `tests/tradeSaveLoad.test.js`.

---

## 3. Fonte canônica única (pós-remoção)

A fonte única de Trade é:
- `js/combat/tradeSystem.js`

Camada de UI canônica:
- `js/ui/tradeUI.js`

Não há mais dependência de:
- `js/trade/tradeSystem.js`
- `window.TradeSystem`
- imports de `../js/trade/tradeSystem.js` nos testes de Trade ativos

---

## 4. Guardrails atuais

- `tests/tradeArchitecture.test.js` valida estado final sem legado.
- `tests/tradeSystem.trade.test.js` cobre API canônica de troca.
- `tests/tradeUI.test.js` cobre integração da UI canônica.
- `tests/tradeSaveLoad.test.js` mantém cobertura de persistência pós-trade.

---

## 5. Risco residual e rollback

Risco residual principal: regressão funcional de trade em fluxo modal antigo.

Mitigação aplicada:
- Cobertura automatizada atualizada para caminho canônico.
- Sem alteração de regra mecânica de Trade neste PR.

Rollback:
- Reverter PR-C restaura o arquivo legado e os testes anteriores do branch base.

---

## 6. Lista “não remover ainda” (pós PR-C)

Itens ainda ativos e necessários:
- `openTradeModal` (compatibilidade de fluxo no `index.html`)
- `executeTradeFromModal` (compatibilidade de fluxo no `index.html`)
- `updateTradeRecipientMonsterOptions` (suporte do modal legado)
- `docs/trade_source_of_truth_audit.md` (auditoria viva)
- `docs/AUDIT_GENERAL_RISKS_2026-05.md` (histórico + atualização de status)

> Observação: os 3 itens de modal acima não são permanentes; representam a próxima trilha de simplificação de UI legado em PR próprio, fora do escopo do PR-C, a ser rastreada em issue/plano dedicado.

---

**Última atualização:** 2026-05-26  
**Versão:** 1.2.0 — PR-C concluído, legado removido
