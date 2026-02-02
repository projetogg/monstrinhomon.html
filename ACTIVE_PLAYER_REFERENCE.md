# Referência: Player Ativo no GameState

## Resumo Rápido

O **player ativo** é rastreado através do sistema de turnos da sessão:

```javascript
// Acessar o player ativo atual:
const currentPlayer = getCurrentPlayer(); // Função helper (linhas 5853-5865)

// Ou manualmente:
const turnIndex = GameState.currentSession.currentTurnIndex;
const playerId = GameState.currentSession.turnOrder[turnIndex];
const player = GameState.players.find(p => p.id === playerId);
```

## Estrutura do GameState

### Sessão Ativa
```javascript
GameState.currentSession = {
    id: Number,
    name: String,
    turnOrder: [playerId1, playerId2, ...],  // Array de IDs dos jogadores
    currentTurnIndex: Number,                 // Índice do jogador atual (0-based)
    // ... outros campos
}
```

### Players
```javascript
GameState.players = [
    {
        id: String,
        name: String,
        class: String,
        team: [...],
        // ... outros campos
    }
]
```

## Como Usar

### 1. Obter Player Ativo (Recomendado)
```javascript
function getCurrentPlayer() {
    try {
        if (!GameState.currentSession) return null;
        
        const turnIndex = GameState.currentSession.currentTurnIndex || 0;
        const playerId = GameState.currentSession.turnOrder?.[turnIndex];
        
        return GameState.players?.find(p => p?.id === playerId) || null;
    } catch (error) {
        console.error('Failed to get current player:', error);
        return null;
    }
}
```

### 2. Para Encontros Individuais (Wild)
```javascript
// Em encontros individuais, o player é armazenado no encounter
const playerId = encounter.selectedPlayerId;
const player = GameState.players.find(p => p.id === playerId);
```

### 3. Avançar Turno
```javascript
function nextTurn() {
    if (!GameState.currentSession) return;
    
    const session = GameState.currentSession;
    session.currentTurnIndex = ((session.currentTurnIndex || 0) + 1) % (session.turnOrder?.length || 1);
    
    saveToLocalStorage();
    updateAllViews();
}
```

## Localizações no Código (index.html)

- **GameState definition**: linhas 685-750+
- **Session creation**: linhas 3043-3079
- **getCurrentPlayer()**: linhas 5853-5865
- **nextTurn()**: linhas 3081-3093
- **Encounter selectedPlayerId**: linha 3174

## Variáveis Chave

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `GameState.currentSession` | Object \| null | Sessão ativa atual |
| `session.turnOrder` | Array<String> | Lista de IDs dos jogadores em ordem de turno |
| `session.currentTurnIndex` | Number | Índice (0-based) do jogador atual no turnOrder |
| `encounter.selectedPlayerId` | String \| null | ID do jogador em encontros individuais |

## Para Adaptar PR15A

Use estas variáveis para acessar o player ativo:

```javascript
// Em contexto de sessão (batalhas em grupo, terapia, etc.)
const activePlayer = getCurrentPlayer();

// Em contexto de encontro individual (wild)
const playerId = GameState.currentEncounter?.selectedPlayerId;
const activePlayer = GameState.players.find(p => p.id === playerId);
```

## Notas Importantes

1. **Sempre verificar se há sessão ativa**: `if (!GameState.currentSession) return;`
2. **turnOrder é um array de IDs**, não de objetos de jogador
3. **currentTurnIndex** começa em 0 e vai até `turnOrder.length - 1`
4. **getCurrentPlayer()** já existe e é a forma recomendada de obter o player ativo
5. Para encontros individuais, use `encounter.selectedPlayerId`
6. Para encontros em grupo, use `encounter.participants` (array de IDs)
