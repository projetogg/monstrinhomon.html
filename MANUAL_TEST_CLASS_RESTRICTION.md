# Manual Testing Guide - Class Restriction Fix

## Overview
This document provides step-by-step instructions to manually test the fix for the class restriction issue where players could use monsters from different classes in battle.

## Test Scenarios

### Scenario 1: Player with Only Correct Class Monsters (Happy Path)
**Setup:**
1. Create a player with class "Guerreiro"
2. Add 3 Guerreiro monsters to their team
3. Start a group battle

**Test Steps:**
1. Let the active monster take damage and faint
2. Verify the switch modal opens
3. Verify it shows only the 2 remaining alive Guerreiro monsters
4. Select one and verify battle continues

**Expected Result:** ✅ Player can switch to any available Guerreiro monster

---

### Scenario 2: Player with Mixed Classes (Main Issue Test)
**Setup:**
1. Create a player with class "Mago"
2. Add to team:
   - 1 Mago (active)
   - 1 Mago (reserve)
   - 1 Guerreiro (captured from trade)
   - 1 Curandeiro (captured from trade)
3. Start a group battle

**Test Steps:**
1. Let the active Mago faint
2. Verify the switch modal opens
3. **CRITICAL:** Verify it shows ONLY the reserve Mago
4. Verify Guerreiro and Curandeiro are NOT shown
5. Select the reserve Mago and verify battle continues

**Expected Result:** ✅ Player can only see and switch to the same class (Mago)

---

### Scenario 3: Animalista with Mixed Classes (Special Case)
**Setup:**
1. Create a player with class "Animalista"
2. Add to team:
   - 2 Animalista monsters
   - 1 Guerreiro (captured)
   - 1 Mago (captured)
   - 1 Bardo (captured)
3. Start a group battle

**Test Steps:**
1. Let active Animalista faint
2. Verify the switch modal opens
3. **CRITICAL:** Verify it shows ONLY the other Animalista
4. Verify Guerreiro, Mago, and Bardo are NOT shown
5. Select the Animalista and verify battle continues

**Expected Result:** ✅ Animalista can only use Animalista monsters in battle (even though they can capture any class)

---

### Scenario 4: Player with No Valid Replacements
**Setup:**
1. Create a player with class "Bárbaro"
2. Add to team:
   - 1 Bárbaro (active)
   - 1 Guerreiro (captured)
   - 1 Mago (captured)
3. Start a group battle

**Test Steps:**
1. Let the active Bárbaro faint
2. Verify an alert appears with message:
   ```
   ⚠️ Sem monstrinhos vivos da sua classe (Bárbaro) para substituir!
   
   REGRA: Em batalha, você só pode usar monstrinhos da classe Bárbaro.
   Troque com outros jogadores para completar seu time!
   ```
3. Verify battle continues (player is eliminated)

**Expected Result:** ✅ Player sees helpful error message and is eliminated from battle

---

### Scenario 5: All Monsters Fainted
**Setup:**
1. Create a player with class "Ladino"
2. Add 2 Ladino monsters to team
3. Start a group battle

**Test Steps:**
1. Let both Ladino monsters faint (one after the other)
2. After first faints, switch to second
3. After second faints, verify alert appears
4. Verify player is eliminated from battle

**Expected Result:** ✅ Player is eliminated when no alive monsters remain

---

### Scenario 6: Capture Still Works for All Classes
**Setup:**
1. Create a player with class "Mago"
2. Start a WILD encounter with a Guerreiro monster
3. Reduce monster HP to low

**Test Steps:**
1. Use a capture item
2. Verify capture succeeds (if HP is low enough)
3. Verify the Guerreiro is added to player's team/box

**Expected Result:** ✅ Player can capture ANY class monster (rule: capture any, battle only same class)

---

## Code Locations

**Fixed Code:**
- `index.html` line 3758-3777: `openSwitchMonsterModal()` function
- Added filter: `mon.class === player.class` on line 3765

**Tests:**
- `tests/classRestriction.test.js`: 10 unit tests covering all scenarios

**Related Code:**
- `js/combat/groupActions.js` line 56-59: Validation that happens during attack (defense-in-depth)
- `js/combat/groupActions.js` line 288-303: Where `openSwitchMonsterModal` is called

---

## Classes to Test

Test with at least these classes:
1. ✅ Guerreiro (Warrior)
2. ✅ Mago (Mage)
3. ✅ Animalista (Animalist) - special case
4. ✅ Bárbaro (Barbarian)
5. ✅ Ladino (Rogue)

---

## Notes

- The fix is at the UI level (modal filtering), which is correct
- Additional validation exists in `groupActions.js` as defense-in-depth
- Wild battles (1v1) are not affected (no switching)
- Capture mechanics are not affected (tested in Scenario 6)

---

**Last Updated:** 2026-02-02
**Issue:** Fix Animalista class restriction
**PR:** copilot/fix-animalista-class-issue
