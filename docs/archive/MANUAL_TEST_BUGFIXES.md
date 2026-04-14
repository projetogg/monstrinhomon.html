# Manual Test Guide - Bug Fixes

## Bug #1: Monsters Going to Box When Team is Full

### Test Steps:
1. Open the game at `http://localhost:8080`
2. Create a new session and player
3. Go to the Players tab and create a player (e.g., "Test Player", class "Mago")
4. Give the player some monsters to start with (use debug console if needed)
5. Capture 6 monsters through wild encounters (or award them via debug)
6. Try to capture a 7th monster
7. **Expected Result**: 
   - The 7th monster should appear in the Box tab, not disappear
   - Message should say: "foi enviado para a caixa de Test Player!"
   - Box tab should show 1 monster owned by the player
   - Team should still have exactly 6 monsters

### Verification:
- Go to the Box tab (📦 Box)
- Select the player from the dropdown
- The 7th captured monster should be visible in the box section
- You should be able to withdraw it to team (if you remove a monster from team first)

---

## Bug #2: Item Selection in Group Battles

### Test Steps:
1. Open the game at `http://localhost:8080`
2. Create a session with at least 2 players
3. Give one player some healing items (IT_HEAL_01) in their inventory
4. Start a group battle encounter (⚔️ Encounter → Group Battle)
5. During a player's turn, look at the available actions
6. **Expected Result**:
   - Should see "⚔️ Atacar" button
   - Should see "⏭️ Passar" button
   - **NEW**: Should see a "💚 Usar Item de Cura" section
   - The section should show:
     - Number of healing items available
     - Current HP of the monster
     - A button "💚 Usar Petisco de Cura"
   - Button should be enabled if:
     - Player has items (> 0)
     - Monster HP > 0
     - Monster HP < maxHP
   - Button should be disabled if any condition fails

### Verification:
- Click the "💚 Usar Petisco de Cura" button (if enabled)
- Monster should heal (HP increases)
- Item count should decrease by 1
- Turn should advance to next player/enemy
- Combat log should show: "💚 [Player] usou Petisco de Cura! (Restam: X)"

---

## Debug Console Commands (if needed)

Open browser console (F12) and use these commands:

```javascript
// Add healing items to a player
const player = GameState.players[0];
player.inventory = player.inventory || {};
player.inventory['IT_HEAL_01'] = 5;
saveToLocalStorage();

// Award a monster to test capture
const template = GameState.catalog.find(m => m.id === 'm_luma');
if (template) {
    awardMonster(player, template.id, 1, 'auto');
}

// Check team size
console.log('Team size:', GameState.players[0].team.length);

// Check box contents
console.log('Box contents:', GameState.sharedBox);

// Create a wild encounter
startWildEncounter('m_luma', 5);
```

---

## Expected Console Output

### For successful capture to box:
```
✅ SUCESSO! [Monster Name] foi capturado!
[Monster Name] foi enviado para a caixa de [Player Name]!
```

### For item use in group battle:
```
💚 [Player Name] usou Petisco de Cura! (Restam: 4)
✨ [Monster Name] recuperou 30 HP! (50/80)
```

---

## Known Limitations

1. The old `player.box` array is deprecated but still exists in the data structure for backward compatibility. New captures go to `GameState.sharedBox`.

2. Only healing items (IT_HEAL_01) are currently shown in the group battle UI. Other item types would need additional UI sections.

3. The Box tab requires the PR15A shared box system to be fully initialized. If you load an old save, you might need to manually move monsters from `player.box` to `GameState.sharedBox`.
