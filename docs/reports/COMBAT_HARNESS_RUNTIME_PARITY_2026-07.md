# Paridade do harness com Wild e Group — julho de 2026

## Status

Relatório de caracterização associado ao PR de paridade do combate v2.2.

Este documento não altera regras e não autoriza balanceamento.

## Baseline

- base inicial: `main` em `0e84c751070425f1d2dbee7a637156303d62c207`;
- harness oficial: `js/combat/combatSimulationHarness.js`;
- Wild: `js/combat/wildActions.js`;
- Group: `js/combat/groupActions.js`;
- fórmula compartilhada: `js/combat/groupCombatFormula.js`.

## Método

Os testes usam combatentes equivalentes, atributos explícitos, buffs vazios, posição frontal, ausência de passivas de espécie e dados determinísticos.

O harness recebe seeds conhecidas e os testes confirmam os dois primeiros resultados de d20 antes da comparação. O RC e a categoria exatos do ataque do jogador são capturados diretamente da chamada do harness a `resolveConfrontation()`; o contra-ataque inimigo não pode satisfazer essa verificação por engano.

## Matriz de caracterização

| ID | Comparação | Classificação |
|---|---|---|
| PAR-01 | ataque básico neutro | `PARITY` |
| PAR-02 | d20A natural 1 | `PARITY` |
| PAR-03 | d20A natural 20 | `PARITY` |
| PAR-04 | d20D natural 20 | `PARITY` |
| PAR-05 | vantagem de classe | `PARITY` |
| PAR-06 | desvantagem de classe | `PARITY` |
| PAR-07 | passiva ofensiva do Ladino | `PARITY` |
| PAR-08 | defesa passiva do Guerreiro | `PARITY` |
| PAR-09 | defesa passiva do Bárbaro | `PARITY` |
| PAR-10 | defesa passiva do Curandeiro | `PARITY` |
| DRIFT-01 | bônus de SPD no ataque básico | `DRIFT_WILD_GROUP` |
| DRIFT-02 | arredondamento de regeneração de ENE | `DRIFT_HARNESS_WILD` |

## Drifts caracterizados

### DRIFT-01 — SPD

O harness usa `getSpdBonus()` e o Wild usa `getSpdAdvantage()` como `buffOff` no confronto.

O ataque básico Group envia atualmente `buffOff: 0` para `resolveConfrontation()`.

O teste cria uma situação de fronteira em que o bônus de +1 muda o resultado de `acerto_reduzido` para `acerto_normal`. O objetivo é tornar a diferença reproduzível, não corrigi-la neste PR.

### DRIFT-02 — ENE

O harness calcula regeneração percentual com `Math.floor()`.

O Wild calcula regeneração percentual com `Math.ceil()`.

Com ENE máxima 20 e taxa de 14%, o harness oferece 2 pontos e o Wild oferece 3 pontos.

A ação Group recebe a regeneração por dependência. A origem concreta dessa dependência deve ser rastreada em etapa posterior antes de classificar sua paridade.

## Validação

A matriz determinística, a baseline, a suíte Vitest, o smoke Wild, as validações de dados e assets e o E2E Wild concluíram com sucesso no PR.

Os testes confirmaram paridade da fórmula-base nos dez cenários comparáveis e mantiveram os dois drifts como diferenças reproduzíveis, sem alterar runtime ou dados.

## Limites

Ainda não são comparados:

- passivas de espécie;
- skills ofensivas completas;
- cura e suporte;
- posição traseira;
- marcação;
- itens;
- alvo da IA;
- boss;
- ordem completa de turnos;
- política real de escolha de ações.

Wild e Group aplicam algumas passivas de espécie em ordens diferentes. Isso deve ser avaliado em um PR isolado para não confundir fórmula-base com orquestração.

## Conclusão

**A. Fórmula-base do harness fiel; drifts de orquestração permanecem isolados.**

Essa classificação autoriza a análise da baseline apenas para os componentes cobertos pela matriz. Ela não autoriza mudanças de balanceamento nem afirma paridade de skills, suporte, passivas de espécie, ENE completa, IA, boss ou ordem de turnos.
