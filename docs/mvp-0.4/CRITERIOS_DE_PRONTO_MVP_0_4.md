# Critérios de Pronto — MVP 0.4 (Cartas Básicas)

## 1) Definition of Ready (DoR) para começar codar

- [ ] Escopo congelado: apenas cartas básicas + interface de decisão.
- [ ] Matriz de 8 cartas (1 por classe) aprovada.
- [ ] Contrato de dados das cartas aprovado.
- [ ] Mensagens UX infantis aprovadas (inclui ENE insuficiente).
- [ ] Plano de testes mínimos aprovado.
- [ ] Lista de arquivos-alvo do PR de implementação definida.
- [ ] Confirmação explícita: sem mudanças em save layer estrutural.

## 2) Definition of Done (DoD) para concluir MVP 0.4

- [ ] Mão simples renderizada em batalha wild.
- [ ] 8 cartas básicas acessíveis (uma por classe).
- [ ] Uso de carta consome ENE corretamente.
- [ ] Carta bloqueada sem ENE com mensagem clara.
- [ ] Ataque básico/fallback preservado e funcional.
- [ ] Wild Loop mínimo permanece estável fim a fim.
- [ ] Save/continue sem regressão funcional.
- [ ] Testes mínimos automatizados adicionados e verdes.

## 3) Gate de testes obrigatórios

### Unidade
- [ ] validação do contrato da carta (id, classe, custo, action).
- [ ] regra de bloqueio por ENE insuficiente.
- [ ] consumo correto de ENE ao usar carta.

### Integração
- [ ] fluxo wild com uso de carta de ataque.
- [ ] fluxo wild com carta de suporte/cura.
- [ ] fluxo com fallback para ataque básico.
- [ ] não regressão de captura, recompensa e continue.

### Não regressão (mínimo)
- [ ] suíte Wild Loop smoke/negative continua verde.
- [ ] testes de restrição de classe continuam verdes.
- [ ] testes de energia existentes continuam verdes.

## 4) Critérios de NO-GO

- Qualquer regressão no fluxo mínimo do Wild Loop.
- Possibilidade de usar carta sem ENE.
- Quebra de starter/classe/captura/save/continue.
- Expansão de escopo para deckbuilding/crafting/PvP.
- Introdução de efeitos sem cobertura mínima de testes.
