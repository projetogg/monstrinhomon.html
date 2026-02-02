# GroupBattleState v1.0 - Documentação Completa

## Visão Geral

O **GroupBattleState** é um objeto de estado imutável que representa uma batalha em grupo no Monstrinhomon. Este módulo fornece uma estrutura completa e bem definida para gerenciar batalhas com múltiplos jogadores contra múltiplos inimigos.

## Características

- ✅ **Imutabilidade**: Todas as funções retornam novos estados, nunca modificam o estado existente
- ✅ **Puro**: Funções sem side effects, facilitando testes e debug
- ✅ **Validação**: Validação completa de inputs com mensagens de erro claras
- ✅ **Log completo**: Sistema de log para UI e análise clínica
- ✅ **Flexível**: Suporta entrada tardia, fuga individual, boss battles, etc

## Estrutura do Estado

```javascript
{
  // 1. Identidade e tipo
  id: "GB_20260202_001",              // ID único
  kind: "trainer" | "boss",           // Tipo da batalha
  status: "active" | "ended",         // Status atual

  // 2. Roster (quem entra, quem sai, quem pode entrar depois)
  roster: {
    eligiblePlayerIds: ["p1","p2"],   // Todos que podem participar
    participants: [                    // Quem entrou na batalha
      { 
        playerId: "p1", 
        joinedAtRound: 1, 
        isActive: true 
      }
    ],
    notJoined: ["p3"],                // Quem ficou fora
    escaped: [                         // Quem fugiu
      { 
        playerId: "p2", 
        escapedAtRound: 2 
      }
    ],
    reinforcementsQueue: [            // Aguardando entrada
      { 
        playerId: "p3", 
        requestedAtRound: 2 
      }
    ]
  },

  // 3. Teams (quem luta de fato)
  teams: {
    players: [                        // Monstros ativos por jogador
      {
        playerId: "p1",
        activeMonster: {
          uid: "M_0001",
          catalogId: "MON_002",
          name: "Fagulhinho",
          hp: 18,
          hpMax: 22,
          spd: 6,
          cls: "Mago",
          status: []
        }
      }
    ],
    enemies: [                        // Inimigos ativos
      {
        enemyId: "E1",
        type: "trainer" | "boss" | "minion",
        name: "Capanga da Névoa",
        hp: 25,
        hpMax: 25,
        spd: 4,
        cls: "Guerreiro",
        ai: "basic",
        status: []
      }
    ]
  },

  // 4. Turnos (fase + ordem + ator atual)
  turn: {
    phase: "players" | "enemies",     // Fase atual
    order: ["P1","P2","E1"],          // Ordem de turnos
    index: 0,                         // Ponteiro do turno atual
    currentActorId: "P1",             // ID do ator atual
    round: 1,                         // Contador de rodadas
    visibleBanner: "Vez dos Jogadores" // Texto para UI
  },

  // 5. Regras desta batalha
  rules: {
    allowCapture: false,              // Captura permitida?
    allowItems: true,                 // Uso de itens permitido?
    allowFlee: true,                  // Fuga permitida?
    fleeIsIndividual: true,           // Fuga é individual?
    allowLateJoin: true,              // Entrada tardia permitida?
    oneActiveMonsterPerPlayer: true   // Um monstro ativo por jogador?
  },

  // 6. Recompensas
  rewards: {
    xp: { 
      base: 120,                      // XP base total
      perParticipant: 60              // XP por participante
    },
    money: { 
      base: 200,                      // Dinheiro base
      split: "equal"                  // Como dividir: "equal" ou "proportional"
    },
    items: [                          // Drops ou recompensas fixas
      { itemId: "IT_POTION", qty: 1 }
    ]
  },

  // 7. Log (UI + modo terapeuta)
  log: [
    { 
      t: 1700000000,                  // Timestamp
      type: "BATTLE_START",           // Tipo do evento
      text: "Batalha iniciada",       // Texto descritivo
      meta: { kind: "trainer" }       // Metadata adicional
    }
  ]
}
```

## API

### Criação de Estado

#### `createGroupBattleState(params)`

Cria um novo GroupBattleState.

**Parâmetros:**
```javascript
{
  kind: "trainer" | "boss",           // Obrigatório
  eligiblePlayerIds: ["p1", "p2"],    // Obrigatório, não vazio
  initialParticipants: ["p1"],        // Obrigatório, não vazio
  enemies: [                          // Array de inimigos
    { 
      name: "Inimigo 1", 
      hp: 50, 
      hpMax: 50, 
      spd: 5, 
      class: "Guerreiro" 
    }
  ],
  rules: { /* opcionais */ },         // Sobrescreve defaults
  rewards: { /* opcionais */ }        // Sobrescreve defaults
}
```

**Retorno:** Novo GroupBattleState

**Exemplo:**
```javascript
import { createGroupBattleState } from './js/combat/groupBattleState.js';

const state = createGroupBattleState({
  kind: "trainer",
  eligiblePlayerIds: ["p1", "p2", "p3"],
  initialParticipants: ["p1", "p2"],
  enemies: [
    { name: "Bandido", hp: 40, hpMax: 40, spd: 6, class: "Ladino" }
  ]
});
```

### Gerenciamento de Roster

#### `requestReinforcement(state, playerId)`

Adiciona jogador à fila de reforços.

**Validações:**
- Jogador deve estar em `notJoined`
- Não duplica se já estiver na fila

**Retorno:** Novo estado com reforço na fila

**Exemplo:**
```javascript
const newState = requestReinforcement(state, "p3");
// p3 agora está em reinforcementsQueue
```

#### `applyReinforcementsIfAny(state)`

Processa fila de reforços, movendo jogadores para `participants`.

**Regras:**
- Só aplica se `rules.allowLateJoin === true`
- Processa todos os reforços na fila
- Adiciona log de entrada para cada reforço

**Retorno:** Novo estado com reforços aplicados

**Exemplo:**
```javascript
// No início da fase dos jogadores
const newState = applyReinforcementsIfAny(state);
```

#### `playerFlees(state, playerId)`

Marca jogador como fugido.

**Validações:**
- Jogador deve estar ativo em `participants`

**Efeitos:**
- `isActive` vira `false`
- Jogador adicionado a `escaped`

**Retorno:** Novo estado com jogador fugido

**Exemplo:**
```javascript
const newState = playerFlees(state, "p2");
// p2 agora está em escaped e isActive = false
```

### Gerenciamento de Turnos

#### `setTurnPhase(state, phase)`

Muda fase do turno.

**Parâmetros:**
- `phase`: "players" ou "enemies"

**Efeitos:**
- Atualiza `turn.phase`
- Atualiza `turn.visibleBanner`
- Adiciona log

**Exemplo:**
```javascript
const newState = setTurnPhase(state, "enemies");
// Banner: "Vez dos Inimigos"
```

#### `incrementRound(state)`

Incrementa contador de rodada.

**Efeitos:**
- `turn.round++`
- Adiciona log de nova rodada

**Exemplo:**
```javascript
const newState = incrementRound(state);
// round: 1 -> 2
```

### Finalização

#### `endBattle(state, result)`

Finaliza batalha.

**Parâmetros:**
- `result`: "victory" ou "defeat"

**Efeitos:**
- `status` vira "ended"
- Adiciona log de fim

**Exemplo:**
```javascript
const newState = endBattle(state, "victory");
// status: "ended", log com vitória
```

### Utilitários

#### `addLogEntry(state, type, text, meta)`

Adiciona entrada ao log.

**Parâmetros:**
- `type`: Tipo do evento (ex: "ACTION", "FLEE")
- `text`: Descrição legível
- `meta`: Objeto com dados adicionais (opcional)

**Exemplo:**
```javascript
const newState = addLogEntry(
  state, 
  "ACTION", 
  "P1 atacou E1 causando 10 de dano",
  { playerId: "p1", targetId: "E1", damage: 10 }
);
```

#### `getActiveParticipants(state)`

Retorna participantes ativos (não fugiram).

**Retorno:** Array de objetos participante

```javascript
const active = getActiveParticipants(state);
// [{ playerId: "p1", joinedAtRound: 1, isActive: true }]
```

#### `getRewardEligiblePlayers(state)`

Retorna IDs dos jogadores elegíveis para recompensas.

**Regra:** Participou e não fugiu

**Retorno:** Array de strings (IDs)

```javascript
const eligible = getRewardEligiblePlayers(state);
// ["p1", "p2"]
```

#### `validateState(state)`

Valida se o estado está consistente.

**Retorno:** `{ valid: boolean, errors: string[] }`

```javascript
const result = validateState(state);
if (!result.valid) {
  console.error("Estado inválido:", result.errors);
}
```

## Fluxo de Uso Típico

```javascript
import { 
  createGroupBattleState,
  requestReinforcement,
  applyReinforcementsIfAny,
  setTurnPhase,
  incrementRound,
  playerFlees,
  endBattle
} from './js/combat/groupBattleState.js';

// 1. Criar batalha
let state = createGroupBattleState({
  kind: "trainer",
  eligiblePlayerIds: ["p1", "p2", "p3"],
  initialParticipants: ["p1", "p2"],
  enemies: [
    { name: "Bandido 1", hp: 40, hpMax: 40, spd: 5 },
    { name: "Bandido 2", hp: 40, hpMax: 40, spd: 5 }
  ]
});

// 2. Durante a batalha, p3 pede para entrar
state = requestReinforcement(state, "p3");

// 3. No início da fase dos jogadores, aplicar reforços
state = setTurnPhase(state, "players");
state = applyReinforcementsIfAny(state);

// 4. P2 decide fugir
state = playerFlees(state, "p2");

// 5. Processar turnos...
// (lógica de combate aqui)

// 6. Finalizar batalha
state = endBattle(state, "victory");

// 7. Distribuir recompensas
const eligiblePlayers = getRewardEligiblePlayers(state);
// ["p1", "p3"] - p2 não recebe porque fugiu
```

## Tipos de Log

| Tipo | Descrição | Meta esperada |
|------|-----------|---------------|
| `BATTLE_START` | Início da batalha | `{ kind, participantCount }` |
| `TURN_PHASE` | Mudança de fase | `{ phase, round }` |
| `ROUND_START` | Nova rodada | `{ round }` |
| `ACTION` | Ação de combate | `{ playerId, targetId, damage, ... }` |
| `FLEE` | Jogador fugiu | `{ playerId, round }` |
| `REINFORCEMENT_REQUEST` | Pedido de reforço | `{ playerId, round }` |
| `REINFORCEMENT_JOIN` | Reforço entrou | `{ playerId, round }` |
| `BATTLE_END` | Fim da batalha | `{ result }` |

## Regras Padrão

```javascript
{
  allowCapture: false,              // Batalhas em grupo = sem captura
  allowItems: true,
  allowFlee: true,
  fleeIsIndividual: true,           // Cada um foge sozinho
  allowLateJoin: true,              // Reforço possível
  oneActiveMonsterPerPlayer: true
}
```

## Validações

O módulo valida:

✅ `kind` deve ser "trainer" ou "boss"  
✅ `eligiblePlayerIds` não vazio  
✅ `initialParticipants` não vazio  
✅ `initialParticipants` devem estar em `eligiblePlayerIds`  
✅ Jogador deve estar em `notJoined` para pedir reforço  
✅ Jogador deve estar ativo para fugir  
✅ `phase` deve ser "players" ou "enemies"  
✅ `result` deve ser "victory" ou "defeat"

## Testes

O módulo possui cobertura completa de testes em `tests/groupBattleState.test.js`:

- ✅ 37 testes passando
- ✅ Cobertura de todos os casos de uso
- ✅ Cobertura de edge cases
- ✅ Validações de erro

Execute os testes:
```bash
npm test -- groupBattleState
```

## Integração com Sistema Existente

O GroupBattleState está integrado ao módulo Combat:

```javascript
import { Combat } from './js/combat/index.js';

// Acessar funções
const state = Combat.Group.BattleState.createGroupBattleState({...});

// Ou importar diretamente
import { createGroupBattleState } from './js/combat/groupBattleState.js';
```

## Próximos Passos (PASSO 3)

Com a estrutura definida, o próximo passo é implementar as funções de transição:

1. `startGroupBattle(selectedPlayerIds, kind)` - Inicia batalha
2. `beginPhase("players"|"enemies")` - Inicia fase
3. `performAction(actorId, actionType, targetId?)` - Executa ação
4. `handleFlee(playerId)` - Processa fuga
5. `checkEndConditions()` - Verifica fim de batalha
6. `endBattleAndDistributeRewards()` - Finaliza e distribui recompensas

## Changelog

### v1.0 (2026-02-02)
- ✅ Estrutura completa implementada
- ✅ 37 testes passando
- ✅ Documentação completa
- ✅ Validação robusta
- ✅ Integração com módulo Combat

---

**Autor:** GitHub Copilot Agent  
**Data:** 2026-02-02  
**Status:** ✅ Completo e testado
