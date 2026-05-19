# Backlog MVP 0.4 — Cartas Básicas

## Prioridade P0 (bloqueante para iniciar implementação)

1. Fechar contrato de dados mínimo da carta (campos obrigatórios).
2. Definir UX de mão simples (layout, custo ENE, estado desabilitado).
3. Definir matriz classe → carta básica (1:1) com IDs estáveis.
4. Definir mensagens de erro infantil para ENE insuficiente.

## Prioridade P1 (entrega central do MVP 0.4)

1. Renderizar mão simples na batalha wild.
2. Permitir clique em carta válida e executar ação correspondente.
3. Decrementar ENE no uso de carta.
4. Bloquear clique sem ENE, com feedback textual.
5. Garantir fallback de ataque básico sempre disponível.
6. Registrar log amigável da ação da carta.

## Prioridade P2 (qualidade e proteção)

1. Testes unitários de validação de carta (campos/custo/classe).
2. Testes de integração de uso de carta por classe correta.
3. Teste negativo de ENE insuficiente.
4. Teste de não regressão do Wild Loop mínimo.
5. Checklist de compatibilidade com save/continue.

## Priorização por corte de escopo

Se houver risco de atraso, manter apenas:
- 1 carta por classe;
- custo ENE + bloqueio por ENE;
- execução de ação simples;
- fallback ataque básico;
- testes mínimos de regressão.

## Dependências técnicas

- Runtime do Wild Loop estabilizado (MVP 0.3/PR #210).
- Energia já existente e validada por testes.
- Logs/UI de combate capazes de exibir feedback textual.

## Débitos conscientemente adiados

- Deckbuilder completo.
- Inventário/coleta de cartas.
- Raridade de cartas e progressão própria.
- IA inimiga baseada em cartas.
- Balanceamento avançado por simulação massiva.
