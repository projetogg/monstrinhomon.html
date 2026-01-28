# Cabeçalhos Exatos das Funções - Feature 3.2

## ✅ Funções Implementadas (Fases 1+2)

### Core Functions (4)

```javascript
function rollD20()
// Linha: 1211
// Retorna: Number (1-20)

function startGroupEncounter(selectedPlayerIds, encounterType, enemyLevel)
// Linha: 1215
// Parâmetros:
//   - selectedPlayerIds: Array de strings (player IDs)
//   - encounterType: String ('group_trainer' ou 'boss')
//   - enemyLevel: Number (1-20)

function calculateGroupTurnOrder(enc)
// Linha: 1257
// Parâmetros:
//   - enc: Objeto encounter
// Retorna: Array de actors ordenados por SPD

function getCurrentActor(enc)
// Linha: 1323
// Parâmetros:
//   - enc: Objeto encounter
// Retorna: Object actor ou null
```

### Turn Management (1)

```javascript
function advanceTurn(enc)
// Linha: 1345
// Parâmetros:
//   - enc: Objeto encounter
// Descrição: Avança turno, pula mortos, detecta vitória/derrota
// Nota: Contém placeholder do inimigo (linhas 1396-1407)
```

### Helper Functions (2)

```javascript
function _hasAlivePlayers(enc)
// Linha: 1329
// Parâmetros:
//   - enc: Objeto encounter
// Retorna: Boolean

function _hasAliveEnemies(enc)
// Linha: 1338
// Parâmetros:
//   - enc: Objeto encounter
// Retorna: Boolean
```

### Action Functions (1)

```javascript
function groupPassTurn()
// Linha: 1414
// Parâmetros: Nenhum
// Descrição: Passa o turno do jogador atual
```

### Rendering Functions (2)

```javascript
function renderGroupEncounter(panel, encounter)
// Linha: 1432
// Parâmetros:
//   - panel: Elemento DOM
//   - encounter: Objeto encounter
// Descrição: Renderiza a UI completa da batalha em grupo

function updateGroupParticipantsList()
// Linha: 2670
// Parâmetros: Nenhum
// Descrição: Atualiza checkboxes de participantes
```

---

## ❌ Funções NÃO Implementadas (Fase 3)

### Enemy AI (Placeholder)

```javascript
// ESTA FUNÇÃO NÃO EXISTE - CRIAR NA FASE 3
function processEnemyTurnGroup(enc)
// Parâmetros:
//   - enc: Objeto encounter
// Descrição: IA completa do inimigo (escolhe alvo, ataca/skill)
// 
// NOTA: Atualmente há um placeholder em advanceTurn() (linhas 1396-1407)
// que apenas loga mensagem e passa turno automaticamente após 1s.
```

### Player Actions (Pendente)

```javascript
// ESTAS FUNÇÕES NÃO EXISTEM - CRIAR NA FASE 3
function groupAttack()
function groupUseSkill(skillIndex)
function groupUseItem(itemId)
```

---

## 📍 Localização no Código (index.html)

| Função | Linha | Status |
|--------|-------|--------|
| rollD20 | 1211 | ✅ Implementado |
| startGroupEncounter | 1215 | ✅ Implementado |
| calculateGroupTurnOrder | 1257 | ✅ Implementado |
| getCurrentActor | 1323 | ✅ Implementado |
| _hasAlivePlayers | 1329 | ✅ Implementado |
| _hasAliveEnemies | 1338 | ✅ Implementado |
| advanceTurn | 1345 | ✅ Implementado (com placeholder) |
| groupPassTurn | 1414 | ✅ Implementado |
| renderGroupEncounter | 1432 | ✅ Implementado |
| updateGroupParticipantsList | 2670 | ✅ Implementado |
| processEnemyTurnGroup | - | ❌ NÃO EXISTE |
| groupAttack | - | ❌ NÃO EXISTE |
| groupUseSkill | - | ❌ NÃO EXISTE |
| groupUseItem | - | ❌ NÃO EXISTE |

---

## 🔧 Estruturas de Dados

### Encounter Object
```javascript
{
    type: 'group_trainer',  // ou 'boss'
    participants: ['player_id_1', 'player_id_2'],
    enemies: [{ id, name, hp, hpMax, spd, atk, def, ... }],
    turnOrder: [
        { side: 'player', id: 'player_id', name: 'Nome', spd: 15, _tiebreak: 18 },
        { side: 'enemy', id: 0, name: 'Inimigo', spd: 12, _tiebreak: null }
    ],
    turnIndex: 0,
    currentActor: { side, id, name, spd, _tiebreak },
    finished: false,
    result: null,  // 'victory' ou 'defeat'
    log: []
}
```

### Actor Object
```javascript
{
    side: 'player' | 'enemy',
    id: string | number,  // player ID ou enemy index
    name: string,
    spd: number,
    _tiebreak: number | null  // d20 para desempate
}
```

### Monstrinho Ativo
```javascript
// Para jogador
const player = GameState.players.find(p => p.id === playerId);
const monster = player.team[0];  // SEMPRE o primeiro

// Para inimigo
const enemy = encounter.enemies[actorId];  // actorId é índice
```

---

## 📝 Placeholder do Inimigo (advanceTurn linhas 1396-1407)

```javascript
// Auto-trigger turno do inimigo (placeholder)
const actorNow = getCurrentActor(enc);
if (actorNow && actorNow.side === "enemy" && !enc.finished) {
    enc.log = enc.log || [];
    enc.log.push(`⏺️ Turno: ${actorNow.name} (Inimigo)`);
    enc.log.push("ℹ️ (Placeholder) IA do inimigo será implementada na Fase 3");
    // Passar turno automaticamente para não travar
    setTimeout(() => {
        advanceTurn(enc);
        saveToLocalStorage();
        renderEncounter();
    }, 1000);
}
```

**Este código deve ser substituído por:**
```javascript
if (actorNow && actorNow.side === "enemy" && !enc.finished) {
    processEnemyTurnGroup(enc);
}
```

---

## 🎯 Como Usar Este Documento

### Para Criar Prompts Exatos

**✅ CORRETO:**
```
Implementar função processEnemyTurnGroup(enc) que:
1. Usa getCurrentActor(enc) para pegar inimigo atual
2. Escolhe alvo (jogador com menor HP)
3. Reutiliza lógica de attackWild()
4. Chama advanceTurn(enc) ao final
```

**❌ INCORRETO (suposições):**
```
Implementar função enemyTurn() que...
Implementar função processEnemy() que...
Implementar função doEnemyAction(encounter, actor) que...
```

### Checklist de Validação

Ao criar prompts para Fase 3, verificar:
- [ ] Nome da função está nesta lista?
- [ ] Parâmetros estão corretos?
- [ ] Não assume funções que não existem?
- [ ] Usa `player.team[0]` para monstrinho ativo?
- [ ] Usa `encounter` (não `enc` às vezes, `encounter` outras)?

---

**Total:** 10 funções implementadas, 4 pendentes  
**Arquivo:** index.html  
**Status:** Fases 1+2 completas (60%)  
**Próximo:** Fase 3 (criar 4 funções pendentes)
