# Auditoria de Arquitetura — Trade (fonte única)

## Escopo

Consolidação final da arquitetura de Trade após remoção do legado no PR-C.

## 1) Sistema runtime ativo

Hoje, o runtime de Trade é **único e canônico**:

- `js/combat/tradeSystem.js` (mecânica de troca)
- `js/ui/tradeUI.js` (camada de UI canônica)

`index.html` usa `window.TradeUI` para o fluxo ativo de troca.

## 2) Legado removido

Arquivo removido no PR-C:

- `js/trade/tradeSystem.js`

Também permanece removido do runtime (PR-B):

- `import * as TradeSystem from './js/trade/tradeSystem.js'`
- `window.TradeSystem = TradeSystem`

Conclusão: não há mais sistema legado ativo de Trade.

## 3) Cobertura de testes no estado final

Cobertura principal alinhada ao canônico:

- `tests/tradeArchitecture.test.js`
- `tests/tradeSystem.trade.test.js`
- `tests/tradeUI.test.js`
- `tests/tradeSaveLoad.test.js`
- `tests/tradeSystem.test.js`
- `tests/tradeHardening.test.js`

Não há import ativo de `../js/trade/tradeSystem.js` nos testes de Trade migrados.

## 4) Fonte única de verdade

Decisão vigente:

- `js/combat/tradeSystem.js` é a única fonte de verdade para regras e execução de Trade.
- `js/ui/tradeUI.js` é a interface canônica de integração com UI.

## 5) Registro histórico (migração)

- PR-A: modal legado passou a executar via `TradeUI`.
- PR-B: `window.TradeSystem` removido do runtime.
- PR-C: módulo legado `js/trade/tradeSystem.js` removido e testes/documentação migrados.

## 6) Nota sobre adapter temporário

Menções anteriores ao adapter legado devem ser tratadas como **histórico encerrado**.
O adapter não existe mais no runtime nem no repositório.
