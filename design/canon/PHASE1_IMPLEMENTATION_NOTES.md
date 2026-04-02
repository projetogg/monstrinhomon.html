# Monstrinhomon — Notas de Implementação da Fase 1

Este arquivo complementa `IMPLEMENTATION_PLAN.md` e detalha o primeiro acoplamento seguro entre a camada canônica e o motor atual.

## Objetivo da Fase 1
Integrar a fundação canônica de dados ao projeto atual sem substituir o motor de combate existente de forma brusca.

## Estratégia
- A camada `design/canon/` começa como fonte de verdade declarativa.
- O motor atual continua funcionando enquanto a nova camada é lida por módulos auxiliares.
- A integração ocorre por fases pequenas, com baixo risco de regressão.
- A fórmula canônica completa não substitui o sistema atual nesta etapa.

## Escopo da Fase 1
- Carregar `combat_rules.json`
- Carregar `classes.json`
- Carregar `skills.json`
- Criar `js/canon/canonLoader.js`
- Expor consultas seguras para classes, skills e regras básicas
- Validar o subconjunto do MVP:
  - classes: guerreiro, bárbaro, mago, curandeiro
  - modos: `wild` e `trainer_1v1`

## Escopo da Fase 2
- Integrar `species.json`
- Integrar `evolution_lines.json`
- Aplicar offsets de espécie sobre o chassis de classe
- Integrar `level_progression.json` aos marcos de desbloqueio de habilidades
- Validar progressão até nível 30

## Escopo da Fase 3
- Integrar frente / meio / trás
- Integrar regras de alcance
- Integrar guarda, marcação, exposição de retaguarda e alvo válido
- Acoplar gradualmente às batalhas em grupo já existentes

## Escopo da Fase 4
- Integrar boss fights
- Avaliar migração da fórmula binária atual para o modelo canônico com faixas
- Fazer ajustes finos de balanceamento
- Adicionar testes de regressão

## O que não fazer agora
- Não substituir todo o motor atual de combate de uma vez
- Não integrar todas as classes, espécies e linhas evolutivas no runtime de imediato
- Não acoplar a fórmula canônica completa sem validação incremental
