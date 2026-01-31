# PR5B - GroupCore Test Plan

## Objetivo

Validar que as funções puras extraídas para `groupCore.js` funcionam corretamente e mantêm o comportamento original do combate em grupo.

---

## Casos de Teste Manuais

### Teste 1: Ordem de Turnos (SPD)

**Objetivo:** Verificar que a ordem de turnos é calculada corretamente baseada em SPD

**Setup:**
- Criar sessão com 2 jogadores
- Jogador 1: Monstrinho com SPD = 15
- Jogador 2: Monstrinho com SPD = 10
- Iniciar batalha em grupo (nível do inimigo: 5, SPD ~8)

**Passos:**
1. Abrir console do navegador
2. Iniciar batalha em grupo
3. Observar a ordem de turnos exibida no log

**Resultado Esperado:**
- Ordem de turnos: Jogador 1 (SPD 15) → Jogador 2 (SPD 10) → Inimigo (SPD ~8)
- Log mostra: "⏺️ Turno: [Nome Jogador 1]" primeiro
- Console sem erros

**Status:** [ ]

---

### Teste 2: Desempate de SPD com d20

**Objetivo:** Verificar que empates de SPD são resolvidos com rolagem de d20

**Setup:**
- Criar sessão com 2 jogadores
- Ambos jogadores com monstrinhos de SPD = 12
- Iniciar batalha em grupo (nível do inimigo: 5)

**Passos:**
1. Abrir console do navegador
2. Iniciar batalha em grupo
3. Observar a ordem de turnos e valores de desempate no log

**Resultado Esperado:**
- Ordem de turnos mostra desempate via d20
- Log mostra: "d20: [valor]" para jogadores empatados
- Ordem final determinada pelos valores de d20 (maior primeiro)
- Console sem erros

**Status:** [ ]

---

### Teste 3: Verificação de Jogadores Vivos

**Objetivo:** Verificar que `hasAlivePlayers` detecta corretamente jogadores vivos/mortos

**Setup:**
- Criar sessão com 2 jogadores
- Iniciar batalha em grupo
- Jogador 1 com monstrinho vivo (HP > 0)
- Jogador 2 com monstrinho vivo (HP > 0)

**Passos:**
1. Durante a batalha, reduzir HP de um dos jogadores a 0
2. Observar se o jogo continua
3. Reduzir HP do segundo jogador a 0
4. Observar se o jogo detecta derrota

**Resultado Esperado:**
- Com 1 jogador vivo: batalha continua
- Com 0 jogadores vivos: mensagem "💀 Derrota... Todos os participantes foram derrotados."
- Console sem erros

**Status:** [ ]

---

### Teste 4: Verificação de Inimigos Vivos

**Objetivo:** Verificar que `hasAliveEnemies` detecta corretamente inimigos vivos/mortos

**Setup:**
- Criar sessão com 2 jogadores
- Iniciar batalha em grupo
- 1 inimigo com HP > 0

**Passos:**
1. Durante a batalha, atacar o inimigo até HP = 0
2. Observar se o jogo detecta vitória

**Resultado Esperado:**
- Quando inimigo HP = 0: mensagem "🏁 Vitória! Todos os inimigos foram derrotados."
- Som de vitória toca
- XP distribuído para jogadores vivos
- Console sem erros

**Status:** [ ]

---

### Teste 5: Hit/Miss com checkHit (reutilização de wildCore)

**Objetivo:** Verificar que a função `checkHit` reutilizada de wildCore funciona corretamente

**Setup:**
- Criar sessão com 1 jogador
- Iniciar batalha em grupo
- Monstrinho com ATK = 10, inimigo com DEF = 8

**Passos:**
1. Durante a batalha, clicar "Atacar" várias vezes
2. Observar rolls e resultados (acerto/erro)
3. Verificar no console os valores de d20

**Resultado Esperado:**
- d20 + ATK >= DEF → Acerto (ex: d20=1, total=11 >= 8, acerta)
- d20 + ATK < DEF → Erro (raro neste caso)
- d20=1 sempre erra (falha crítica)
- d20=20 sempre acerta (crítico)
- Console mostra logs dos rolls
- Console sem erros

**Status:** [ ]

---

### Teste 6: Cálculo de Dano com calcDamage (reutilização de wildCore)

**Objetivo:** Verificar que a função `calcDamage` reutilizada de wildCore calcula dano corretamente

**Setup:**
- Criar sessão com 1 jogador
- Iniciar batalha em grupo
- Monstrinho: ATK=10, classe Guerreiro
- Inimigo: DEF=5, classe Ladino (Guerreiro > Ladino = vantagem)
- POWER básico de Guerreiro = 15

**Passos:**
1. Durante a batalha, clicar "Atacar" e acertar
2. Observar o dano causado
3. Calcular manualmente: ratio = 10/(10+5) = 0.666, baseD = floor(15*0.666) = 9, finalD = floor(9*1.10) = 9
4. Verificar se dano mostrado corresponde

**Resultado Esperado:**
- Dano calculado com vantagem de classe (+10%)
- Dano mínimo sempre 1
- Mensagem de log mostra dano correto
- HP do inimigo reduz corretamente
- Console sem erros

**Status:** [ ]

---

## Critérios de Sucesso

- [ ] Todos os 6 testes passam
- [ ] Console do navegador limpo (sem erros ou warnings)
- [ ] Comportamento idêntico ao anterior (antes do PR5B)
- [ ] Funções em `groupCore.js` são 100% puras (sem acessar DOM, GameState global, storage)
- [ ] Reutilização correta de `wildCore.js` (checkHit, calcDamage, getBuffModifiers)

---

## Smoke Test Rápido

Para validação rápida após mudanças:

1. Abrir jogo no navegador
2. Criar sessão com 2-3 jogadores
3. Iniciar batalha em grupo
4. Jogar 2 rodadas completas
5. Verificar:
   - [x] Ordem de turnos correta
   - [x] Ataques acertam/erram corretamente
   - [x] Dano calculado corretamente
   - [x] Vitória/derrota detectada corretamente
   - [x] Console limpo

---

## Notas de Implementação

### Funções Extraídas

1. `getCurrentActor(enc)` - PURA ✅
2. `isAlive(entity)` - PURA ✅
3. `clamp(n, min, max)` - PURA ✅
4. `hasAliveEnemies(enc)` - PURA ✅
5. `hasAlivePlayers(enc, playersData)` - PURA ✅ (recebe playersData)
6. `calculateTurnOrder(enc, playersData, rollD20Fn)` - PURA ✅ (recebe rollD20Fn)
7. `chooseTargetByLowestHP(targets)` - PURA ✅ (recebe targets preparados)

### Reutilizadas de wildCore.js

1. `checkHit(d20Roll, attacker, defender, classAdvantages)` ✅
2. `calcDamage({atk, def, power, damageMult})` ✅
3. `getBuffModifiers(monster)` ✅
4. `getClassAdvantageModifiers(attackerClass, defenderClass, classAdvantages)` ✅

---

**Versão:** 1.0  
**Data:** 2026-01-31  
**Status:** Pronto para teste
