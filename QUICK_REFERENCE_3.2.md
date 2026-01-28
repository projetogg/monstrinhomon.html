# Quick Reference - Feature 3.2 Function Headers

## 📋 Cabeçalhos Exatos (Copy-Paste Ready)

### ✅ Implementadas (10)

```javascript
function rollD20()
function startGroupEncounter(selectedPlayerIds, encounterType, enemyLevel)
function calculateGroupTurnOrder(enc)
function getCurrentActor(enc)
function advanceTurn(enc)
function _hasAlivePlayers(enc)
function _hasAliveEnemies(enc)
function groupPassTurn()
function renderGroupEncounter(panel, encounter)
function updateGroupParticipantsList()
```

### ❌ NÃO Existem (criar Fase 3)

```javascript
function processEnemyTurnGroup(enc)  // ⚠️ APENAS PLACEHOLDER em advanceTurn() linhas 1396-1407
function groupAttack()
function groupUseSkill(skillIndex)
function groupUseItem(itemId)
```

---

## 🎯 Nomes Importantes

### Parâmetro para Encounter
```javascript
enc  // Use "enc" (não "encounter")
```

### Monstrinho Ativo
```javascript
player.team[0]  // SEMPRE o primeiro
```

### Sides
```javascript
'player'  // Jogador
'enemy'   // Inimigo
```

---

## 📍 Placeholder do Inimigo

**Localização:** index.html linhas 1396-1407 (dentro de `advanceTurn()`)

**Substituir por:**
```javascript
if (actorNow && actorNow.side === "enemy" && !enc.finished) {
    processEnemyTurnGroup(enc);
}
```

---

## 🔧 Estruturas

### Encounter
```javascript
{
    type: 'group_trainer',
    participants: ['player_id'],
    enemies: [{ id, name, hp, hpMax, spd, atk, def }],
    turnOrder: [{ side, id, name, spd, _tiebreak }],
    turnIndex: 0,
    currentActor: { side, id, name, spd }
}
```

### Actor
```javascript
{
    side: 'player' | 'enemy',
    id: string | number,
    name: string,
    spd: number,
    _tiebreak: number | null
}
```

---

**Arquivo completo:** FUNCTION_HEADERS_3.2.md (5.8KB)
