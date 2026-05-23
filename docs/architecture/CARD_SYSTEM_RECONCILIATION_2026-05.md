# Card System Reconciliation — 2026-05

## Objetivo

Registrar a fronteira entre o spike funcional do MVP 0.4 (`basicCards`) e a trilha canônica da Card Layer (Fase 1 visual-only), evitando dois sistemas paralelos sem responsabilidade clara.

## 1) Papel do `basicCards` no MVP 0.4

- `basicCards` foi criado como spike funcional para validar clique real de carta no Wild Loop.
- `CARD_GUERREIRO_GOLPE_FIRME` segue como único caminho executável dessa trilha.
- Essa trilha foi útil para provar viabilidade de UX/fluxo, sem substituir a fonte canônica de skills.

## 2) Papel da Card Layer Fase 1

- A Card Layer Fase 1 é a trilha canônica visual para representar skills existentes.
- `data/cards.json` descreve apenas apresentação (texto infantil, ícone, arte, categoria visual, slot de exibição).
- A mecânica continua em `data/skills.json` (runtime vence design).

## 3) Fronteira de autoridade

- `data/skills.json`: autoridade mecânica (dano, custo, alvo, precisão, efeitos, progressão).
- `data/cards.json`: autoridade visual (sem mecânica).
- Card Layer não altera combate, captura, save, XP ou pipeline de execução do Wild Loop.

## 4) Regra de evolução imediata

- Não expandir `basicCards` para novas classes enquanto não houver decisão arquitetural explícita.
- Não remover `basicCards` nem o spike de `Golpe Firme` nesta etapa.
- Fase 1A entrega contrato visual validado; integração de UI fica para fase posterior com feature flag desligada por padrão.

## 5) Próximo passo recomendado

Após merge da Fase 1A:

1. Implementar `cardLayer/cardResolver/cardRenderer` em modo visual-only.
2. Manter feature flag desligada por padrão.
3. Pilotar apenas Guerreiro antes de qualquer expansão para outras classes.
