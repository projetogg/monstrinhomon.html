# Backlog Priorizado — MVP 0.3

## Regra de uso

Usar uma issue por vez:

```text
1 issue → 1 branch → 1 PR → testes → merge → próxima issue
```

Não enviar todas as issues de uma vez para IA implementar em massa.

---

## P0 — Bloqueadores do MVP

### Issue 01 — Auditar fluxo atual do Wild Loop sem alterar comportamento

**Objetivo:** mapear o estado real do fluxo atual.

Fluxo auditado:

```text
novo jogo → starter → wild battle → ataque/captura → recompensa → save
```

**Tarefas:**

```text
[ ] abrir o jogo localmente
[ ] criar novo jogador
[ ] escolher classe
[ ] verificar starter
[ ] iniciar wild battle
[ ] atacar
[ ] tentar capturar
[ ] derrotar inimigo
[ ] salvar
[ ] recarregar
[ ] continuar
[ ] registrar erros no console
```

**Critério de aceite:** relatório curto indicando o que funciona, o que falha, arquivo provável, severidade e próximo fix recomendado.

---

### Issue 02 — Garantir starter correto por classe

**Objetivo:** garantir que cada classe receba o starter correto.

**Fonte de verdade:** `js/data/starters.js`

**Critério de aceite:**

```text
[ ] Guerreiro recebe Ferrozimon
[ ] Bardo recebe Dinomon
[ ] Caçador recebe Miaumon
[ ] Mago recebe Lagartomon
[ ] Animalista recebe Luvursomon
[ ] Curandeiro recebe Nutrilo
[ ] Bárbaro recebe Tigrumo
[ ] Ladino recebe Furtilhon
```

**Testes esperados:** teste unitário de starter por classe e teste de integração criando jogador.

---

### Issue 03 — Garantir que Wild Battle inicia sem erro

**Objetivo:** wild battle deve iniciar com jogador ativo e inimigo válido.

**Critério de aceite:**

```text
[ ] player ativo válido
[ ] monstro ativo válido
[ ] inimigo válido
[ ] HP visível
[ ] ações aparecem
[ ] console sem erro crítico
```

**Arquivos prováveis:**

```text
js/combat/wildActions.js
js/combat/wildUI.js
index.html
data/monsters.json
```

---

### Issue 04 — Corrigir/garantir anti-soft-lock após KO

**Objetivo:** se o Monstrinhomon ativo chegar a 0 HP, o jogo não pode travar.

**Critério de aceite:**

```text
[ ] se houver substituto, abrir troca
[ ] se não houver substituto, encerrar participação/derrota
[ ] não permitir ação com monstro desmaiado
[ ] UI explica o que aconteceu
[ ] teste cobre cenário
```

**Severidade:** P0 — bloqueador.

---

### Issue 05 — Garantir captura wild com team/box

**Objetivo:** captura bem-sucedida deve adicionar o Monstrinhomon ao team ou box.

**Critério de aceite:**

```text
[ ] captura só aparece em wild
[ ] consome orb
[ ] sucesso adiciona ao team se houver espaço
[ ] sucesso adiciona ao box se team cheio
[ ] falha não adiciona
[ ] falha continua combate
[ ] save preserva captura
```

**Testes esperados:** captura sucesso com team incompleto, captura sucesso com team cheio, captura falha, captura sem orb e captura em boss/grupo bloqueada.

---

### Issue 06 — Garantir save/continue após progresso

**Objetivo:** progresso do MVP deve persistir após recarregar.

**Critério de aceite:**

```text
[ ] starter persiste
[ ] captura persiste
[ ] XP persiste
[ ] team/box persistem
[ ] inventário persiste
[ ] continue lê auto-save
[ ] slot manual não substitui sessão atual indevidamente
```

**Arquivos prováveis:**

```text
js/storage.js
js/saveLayer.js
index.html
tests/savePersistence.test.js
```

---

## P1 — Estabilização de gameplay

### Issue 07 — Validar d20 automático/manual no Wild Battle

**Objetivo:** garantir que o modo de dado não quebre o combate.

**Critério de aceite:**

```text
[ ] automático gera ataque e defesa válidos
[ ] manual aceita valores 1–20
[ ] manual rejeita valores inválidos
[ ] UI mostra resultado
[ ] log é compreensível
```

---

### Issue 08 — Garantir recompensa e XP após vitória wild

**Objetivo:** derrotar wild deve conceder recompensa correta.

**Critério de aceite:**

```text
[ ] XP calculado
[ ] XP aplicado ao monstro ativo
[ ] level up se aplicável
[ ] save após recompensa
[ ] log/feedback claro
```

---

### Issue 09 — Criar teste de ciclo completo Wild Loop

**Objetivo:** criar um teste de integração cobrindo o fluxo principal.

Fluxo:

```text
novo jogador → starter → wild → ataque → captura ou vitória → recompensa → save → load
```

**Critério de aceite:** teste passa em `npm test`.

---

### Issue 10 — Melhorar feedback mínimo de captura

**Objetivo:** a criança/terapeuta deve entender por que captura falhou ou deu certo.

**Critério de aceite:**

```text
[ ] mostra HP%
[ ] mostra se condição está boa ou não
[ ] sucesso tem feedback
[ ] falha tem feedback
[ ] falha sugere próxima ação
```

---

## P2 — Cartas simples

### Issue 11 — Definir modelo mínimo de carta básica

**Objetivo:** criar estrutura mínima para cartas básicas.

**Escopo:** uma carta básica por classe, inicialmente podendo funcionar como ataque básico estilizado.

**Critério de aceite:**

```text
[ ] carta tem id
[ ] nome
[ ] classe
[ ] custo
[ ] efeito
[ ] texto infantil
[ ] ação runtime associada
```

---

### Issue 12 — Exibir mão mínima de 3 cartas em wild

**Objetivo:** testar carta como interface visual de decisão.

**Critério de aceite:**

```text
[ ] mão aparece
[ ] carta clicável
[ ] carta básica executa ação
[ ] carta sem ENE explica bloqueio
[ ] sem quebrar ataque básico legado
```

Se isso atrasar o MVP 0.3, adiar para MVP 0.4.

---

## P3 — UX e playtest

### Issue 13 — Checklist de QA manual no navegador/iPad

**Objetivo:** criar checklist de QA manual para cada build.

---

### Issue 14 — Playtest curto com terapeuta

**Objetivo:** testar se o fluxo MVP é compreensível em uso mediado.

Registrar:

- onde a criança/terapeuta se perde;
- tempo até primeira ação;
- entendimento de HP;
- entendimento de captura;
- frustração;
- bugs;
- ajustes necessários.

---

## Não abrir agora

Evitar por enquanto:

```text
[ ] implementar todos os decks
[ ] criar sistema completo de boss
[ ] criar campanha completa
[ ] criar todos os mapas
[ ] criar dashboard terapêutico
[ ] refatorar todo index.html
[ ] trocar toda fórmula de combate sem testes
[ ] criar multiplayer
[ ] adicionar dezenas de monstros
```
