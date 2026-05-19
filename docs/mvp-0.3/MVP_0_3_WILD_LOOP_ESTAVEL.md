# MVP 0.3 — Wild Loop Estável

## Objetivo

Criar uma versão mínima e estável do Monstrinhomon centrada no encontro selvagem individual.

O jogador deve conseguir completar o fluxo:

```text
Criar/selecionar jogador
→ escolher classe
→ receber starter correto
→ iniciar encontro selvagem
→ atacar usando d20 automático/manual
→ tentar capturar ou derrotar
→ receber recompensa
→ salvar
→ sair
→ continuar depois
```

## Escopo obrigatório

### 1. Criação/seleção de jogador

O sistema deve permitir:

- criar jogador;
- escolher nome;
- escolher classe;
- associar starter correto;
- salvar estado inicial.

Critério mínimo:

```text
Cada classe recebe o starter correto conforme js/data/starters.js.
```

### 2. Starter

O starter deve:

- aparecer no time;
- ter classe correta;
- ter HP/atributos válidos;
- ter imagem ou fallback;
- ser usado em combate.

### 3. Encontro wild

O encontro selvagem deve:

- iniciar sem erro;
- escolher inimigo válido;
- mostrar HP do jogador e do inimigo;
- permitir ação;
- terminar por captura, derrota do inimigo, fuga ou derrota do jogador.

### 4. Ataque básico

O ataque básico deve:

- estar sempre disponível;
- não gastar ENE;
- calcular acerto/dano;
- atualizar HP;
- registrar log simples;
- não travar se dado manual estiver vazio quando modo automático estiver ativo.

### 5. D20 automático/manual

| Modo | Critério |
|---|---|
| Automático | sistema rola ataque e defesa |
| Manual | usuário informa ataque/defesa ou rola fisicamente |
| Validação | entradas inválidas não quebram o jogo |

### 6. Captura

Captura deve:

- só estar disponível em wild;
- consumir item/orb;
- verificar condição de captura;
- adicionar ao team se houver espaço;
- adicionar ao box se team estiver cheio;
- encerrar encontro se sucesso;
- continuar encontro se falha;
- salvar resultado.

### 7. Vitória e recompensa

Ao derrotar inimigo:

- encontro termina;
- XP/recompensa aplica;
- estado atualiza;
- save funciona.

### 8. KO do ativo

Se o monstrinho ativo chega a 0 HP:

- abrir troca automática, se houver substituto;
- ou encerrar participação/derrota de forma clara;
- nunca deixar o jogador preso sem ação.

Este é um bloqueador crítico.

### 9. Save/continue

O jogo deve:

- salvar depois de progresso relevante;
- continuar sessão pelo auto-save;
- preservar jogador, classe, starter, time, box, inventário e progresso.

## Fora de escopo

Não implementar agora:

- deckbuilding completo;
- todas as cartas por classe;
- batalha em grupo avançada;
- boss com fase 2;
- campanha completa;
- sistema terapêutico completo;
- dashboards;
- economia complexa;
- todos os PNGs finais;
- multiplayer;
- refactor total do projeto;
- balanceamento final 1–100.

## Escopo opcional

Pode entrar apenas se não atrasar o MVP:

- 1 carta básica visual por classe;
- botão de carta funcionando como ataque básico estilizado;
- feedback visual melhorado de captura;
- export manual de save;
- teste Playwright simples de abertura do jogo.

## Critérios de pronto

```text
[ ] novo jogador pode ser criado
[ ] classe pode ser escolhida
[ ] starter correto entra no time
[ ] wild battle inicia
[ ] ataque básico funciona
[ ] d20 automático funciona
[ ] d20 manual não quebra
[ ] HP atualiza corretamente
[ ] captura funciona
[ ] team/box atualizam
[ ] derrota do wild dá recompensa
[ ] KO não gera soft-lock
[ ] save funciona
[ ] continue funciona
[ ] testes automatizados passam
[ ] validação de dados passa
[ ] não há erro crítico no console
```

## Critérios de falha

O MVP 0.3 falha se:

- o jogo não inicia;
- starter vem errado;
- wild battle trava;
- HP não atualiza;
- captura não altera team/box;
- save perde progresso;
- continue não carrega;
- KO deixa jogador sem ação;
- dado manual quebra cálculo;
- testes falham;
- há divergência crítica entre docs e runtime sem registro.

## Testes obrigatórios

### Unitários

```text
[ ] starter por classe
[ ] cálculo de ataque
[ ] dado manual/automático
[ ] captura sucesso
[ ] captura falha
[ ] XP ganho
[ ] save/load
```

### Integração

```text
[ ] novo jogo → starter → wild → ataque → vitória → XP → save
[ ] novo jogo → starter → wild → captura → team/box → save
[ ] wild → KO ativo → troca/derrota sem soft-lock
```

### Manual

```text
[ ] abrir no navegador
[ ] jogar 1 encontro completo
[ ] recarregar página
[ ] continuar
[ ] verificar estado
```

## Ordem recomendada de implementação

```text
1. Auditar fluxo atual sem alterar código
2. Corrigir starter/classe se necessário
3. Garantir wild battle estável
4. Garantir KO/troca/derrota sem soft-lock
5. Garantir captura team/box
6. Garantir recompensa XP
7. Garantir save/continue
8. Adicionar 1 carta básica visual se seguro
9. Criar teste de ciclo completo
10. Playtest curto
```

## Regra de implementação

```text
Nenhum sistema novo deve ser adicionado se quebrar o fluxo wild.
```
