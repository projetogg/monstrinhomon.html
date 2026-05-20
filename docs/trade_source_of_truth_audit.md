# Auditoria de Arquitetura — Trade (sistemas paralelos)

## Escopo desta issue

Diagnóstico objetivo dos dois módulos atuais:

- `js/combat/tradeSystem.js`
- `js/trade/tradeSystem.js`

Sem remoção de módulo e sem mudança de regra de troca.

## 1) Qual sistema é runtime ativo

Hoje, **os dois sistemas estão ativos em runtime** em fluxos diferentes:

1. **Fluxo principal da aba Trade (painel de troca com confirmação entre 2 lados)**  
   Usa `js/combat/tradeSystem.js` por meio de `js/ui/tradeUI.js`.
   - `js/ui/tradeUI.js` importa `../combat/tradeSystem.js`.
   - `index.html` chama `window.TradeUI.executeTrade(...)` no `tradeAccept()`.

2. **Fluxo legado de modal de troca unilateral (`openTradeModal/executeTradeFromModal`)**  
   Usa `js/trade/tradeSystem.js`.
   - `index.html` importa `./js/trade/tradeSystem.js` como `window.TradeSystem`.
   - `executeTradeFromModal()` chama `window.TradeSystem.proposeTradeAction(...)` e `window.TradeSystem.acceptTrade(...)`.

## 2) Qual sistema é coberto por testes

Há cobertura de ambos os módulos:

- **`js/combat/tradeSystem.js`**
  - `tests/tradeSystem.test.js`
  - `tests/tradeHardening.test.js`
  - `tests/phaseXviBugScan.test.js` (caso de bloqueio de troca inválida)

- **`js/trade/tradeSystem.js`**
  - `tests/tradeSystem.trade.test.js`
  - `tests/tradeUI.test.js` (testa fluxo da API do módulo `js/trade`)

## 3) Diferenças de API e regra

### API de `js/trade/tradeSystem.js` (FASE O)

- `validateTrade(fromPlayer, toPlayer, instanceId, context?)`
- `proposeTradeAction(fromPlayer, toPlayer, instanceId, context?)`
- `acceptTrade(trade, fromPlayer, toPlayer, context?)`

Características:
- troca unilateral (transferência de 1 monstrinho);
- valida monstro ativo em batalha e KO;
- não cobre fluxo de troca pareada A↔B nem integração de Box.

### API de `js/combat/tradeSystem.js` (FASE IX/XX)

- `validateTrade(playerA, monA, playerB, monB, sharedBox?)`
- `executeTrade(playerA, monA, playerB, monB, therapyLog?, sharedBox?)`
- `getTradeableMonsters(player, sharedBox?)`
- `getTradeSuggestions(playerA, playerB, sharedBox?)`

Características:
- troca bilateral (A↔B);
- inclui integração com Box compartilhada;
- integra sugestões de troca e registro terapêutico.

## 4) Fonte única de verdade definida

**Decisão arquitetural desta issue:**  
`js/combat/tradeSystem.js` é a **fonte canônica de verdade** para Trade.

Justificativa:
- é o módulo já usado pelo painel principal de troca (`TradeUI`);
- cobre cenário mais completo (troca bilateral + Box + sugestões);
- possui cobertura de testes de hardening para Box e cenários de borda.

`js/trade/tradeSystem.js` passa a ser **legado/compatibilidade temporária** para o modal antigo até migração completa.

## 5) Plano de migração incremental (sem remover módulo agora)

1. Criar um adapter de compatibilidade no fluxo do modal para chamar a lógica canônica (ou migrar modal para o mesmo fluxo da aba Trade).
2. Cobrir com testes de integração o fluxo do modal já apontando para a lógica canônica.
3. Garantir paridade funcional mínima:
   - erro de jogador inválido;
   - erro de instância inválida;
   - bloqueio em batalha/KO quando aplicável;
   - persistência (`saveGame`) e atualização de lista/UI após sucesso.
4. Só após paridade comprovada:
   - remover chamadas diretas de `window.TradeSystem` em `index.html`;
   - marcar `js/trade/tradeSystem.js` como removível/deprecated;
   - manter testes regressivos cobrindo o fluxo real.

## Testes mínimos que precisam existir antes de remoção do módulo legado

Antes de remover `js/trade/tradeSystem.js`, deve existir cobertura que valide no fluxo real:

- abertura de troca via UI;
- confirmação de troca com persistência;
- comportamento com monstros de time e da Box;
- mensagens de erro equivalentes para fluxos atualmente atendidos pelo modal legado.
