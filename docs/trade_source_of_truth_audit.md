# Auditoria de Arquitetura — Trade (sistemas paralelos)

## Escopo desta issue

Diagnóstico objetivo dos dois módulos atuais:

- `js/combat/tradeSystem.js`
- `js/trade/tradeSystem.js`

Sem remoção de módulo e sem mudança de regra de troca.

## 1) Qual sistema é runtime ativo

Hoje, **o runtime ativo de Trade é o sistema canônico**:

1. **Fluxo principal da aba Trade (painel de troca com confirmação entre 2 lados)**  
   Usa `js/combat/tradeSystem.js` por meio de `js/ui/tradeUI.js`.
   - `js/ui/tradeUI.js` importa `../combat/tradeSystem.js`.
   - `index.html` chama `window.TradeUI.executeTrade(...)` no `tradeAccept()`.

2. **Fluxo legado de modal (`openTradeModal/executeTradeFromModal`) com compatibilidade temporária**  
   Mantém o ponto de entrada antigo, mas executa troca pelo caminho canônico.
   - `index.html` **não importa mais** `./js/trade/tradeSystem.js` nem expõe `window.TradeSystem`.
   - `executeTradeFromModal()` usa `window.TradeUI.executeTrade(...)` e `window.TradeUI.validateTrade(...)`.
   - O arquivo `js/trade/tradeSystem.js` permanece no repositório para cobertura regressiva, comparação arquitetural e remoção controlada no PR-C.

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

`js/trade/tradeSystem.js` permanece **legado/compatibilidade temporária** para o modal antigo, operando como adapter para o canônico no caminho bilateral do modal.

## 5) Histórico de migração incremental

1. ✅ Criado adapter de compatibilidade no fluxo do modal para chamar a lógica canônica quando há contraparte bilateral.
2. ✅ Cobertura de testes atualizada para garantir o caminho adapter → canônico.
3. ✅ Testes de persistência/save-load pós-trade adicionados (`tests/tradeSaveLoad.test.js`).
4. ✅ `js/trade/tradeSystem.js` formalmente marcado como `@deprecated` / adapter temporário.
   - Aviso `@deprecated` inserido no topo do arquivo.
   - Documentado que novas regras não devem entrar no módulo legado.
   - Documentado que trocas bilaterais com `targetInstanceId` são encaminhadas para o canônico.
5. ✅ Modal legado migrado no runtime para executar via `TradeUI` (PR-A), removendo chamada direta a `window.TradeSystem.proposeTradeAction/acceptTrade`.
6. ✅ `window.TradeSystem` removido do runtime no `index.html` (PR-B), mantendo o arquivo legado para testes e remoção futura controlada.

## 6) Status atual (pós-depreciação formal)

- `js/trade/tradeSystem.js` está marcado como `@deprecated` e adapter temporário.
- Nenhuma nova regra de Trade deve ser adicionada ao módulo legado.
- Qualquer fluxo novo deve usar `js/combat/tradeSystem.js` diretamente.
- `index.html` não importa mais `./js/trade/tradeSystem.js` e não expõe `window.TradeSystem`.
- A **remoção** do módulo legado é etapa futura separada (ver condições abaixo).

## 7) Condições mínimas para remoção futura do módulo legado

Antes de remover `js/trade/tradeSystem.js`, devem estar atendidas **todas** as condições:

1. `window.TradeSystem` deve permanecer ausente do runtime (verificar `index.html`).
2. `js/trade/tradeSystem.js` deve continuar existindo até a remoção controlada do PR-C.
3. Modal antigo (`openTradeModal` / `executeTradeFromModal`) precisa permanecer funcional via `TradeUI` até sua retirada/substituição.
4. Testes E2E/save-load verdes (incluindo `tests/tradeSaveLoad.test.js`).
5. Documentação atualizada (este arquivo + plano de remoção e docs correlatos).
6. CI verde em todas as suítes de Trade.

A remoção do legado **não deve acontecer** no mesmo PR da depreciação.

## Testes mínimos que precisam existir antes de remoção do módulo legado

Antes de remover `js/trade/tradeSystem.js`, deve existir cobertura que valide no fluxo real:

- abertura de troca via UI;
- confirmação de troca com persistência;
- comportamento com monstros de time e da Box;
- mensagens de erro equivalentes para fluxos atualmente atendidos pelo modal legado.

## Próximos passos

O mapeamento detalhado de todas as referências restantes ao legado e o plano completo de PRs para remoção segura estão em:

`docs/trade_legacy_removal_plan.md`

Esse documento classifica cada chamada, lista os riscos de remoção prematura, define pré-condições e propõe os PRs-A, B e C para a remoção incremental.
