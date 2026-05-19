# Prompt sugerido — Implementação MVP 0.4 (Cartas Básicas)

## Objetivo

Implementar **somente** o MVP 0.4 de cartas básicas no Wild Loop, com segurança e baixo risco de regressão.

## Regras mandatórias

1. Não expandir escopo além de 1 carta básica por classe.
2. Manter ataque básico/fallback sempre funcional.
3. Exibir custo de ENE na UI de cartas.
4. Bloquear carta com ENE insuficiente e explicar o motivo em PT-BR infantil.
5. Reusar ações existentes sempre que possível.
6. Se criar nova action mínima, manter isolada e coberta por teste.
7. Não quebrar save, captura, starter, classe, XP, continue.

## Entregáveis esperados no PR de implementação

1. UI de mão simples de cartas no combate wild.
2. Mapa de 8 cartas básicas (1 por classe).
3. Execução segura de carta → ação.
4. Bloqueio por ENE insuficiente.
5. Testes unitários + integração mínimos das cartas.
6. Atualização da documentação do MVP 0.4.

## Cartas-base (referência)

Usar como baseline os IDs definidos em `MVP_0_4_CARTAS_BASICAS.md`.

## Checklist técnico do PR

- [ ] sem alteração indevida de fórmula oficial de dano/captura;
- [ ] sem alteração estrutural de persistência;
- [ ] sem regressão em `npm test`;
- [ ] suíte wild loop relevante verde;
- [ ] cenário sem ENE coberto em teste;
- [ ] fallback ataque básico coberto em teste.

## Fora de escopo explícito

- Deckbuilder, coleção avançada, crafting, loja de cartas.
- PvP por cartas, boss cards, group cards complexas.
- Rebalanceamento macro do sistema de combate.

## Definição de sucesso

A implementação será considerada bem-sucedida quando:
- a criança conseguir visualizar cartas e custos,
- jogar carta válida com feedback claro,
- receber bloqueio claro ao faltar ENE,
- e completar o Wild Loop sem regressões.
