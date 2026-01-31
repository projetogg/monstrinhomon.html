# PR3: Storage Audit Report

## Executive Summary
This document catalogs all `localStorage` usage in the Monstrinhomon codebase before refactoring.
**Total localStorage calls found: 32** (14 getItem, 14 setItem, 4 removeItem, 0 clear)

---

## 🔑 Storage Keys Inventory

### Main State Keys
| Key | Type | Purpose | Current Usage |
|-----|------|---------|---------------|
| `monstrinhomon_state` | JSON | Main game state (players, monsters, session, etc.) | Primary save/load mechanism |
| `monstrinhomon_corrupted_backup` | JSON | Backup of corrupted saves | Created when parse fails |

### Save Slot Keys
| Key | Type | Purpose | Current Usage |
|-----|------|---------|---------------|
| `mm_save_slot_1` | JSON | User save slot 1 | Manual save/load with envelope |
| `mm_save_slot_2` | JSON | User save slot 2 | Manual save/load with envelope |
| `mm_save_slot_3` | JSON | User save slot 3 | Manual save/load with envelope |
| `mm_last_slot` | String (number) | Last used save slot | Tracks which slot user was on |
| `mm_slots_migrated_v1` | String ("1") | Migration flag | Marks legacy save migration complete |

### Audio Preferences
| Key | Type | Purpose | Current Usage |
|-----|------|---------|---------------|
| `mm_audio_sfx` | String (number) | SFX volume (0.0-1.0) | Audio module preference |
| `mm_audio_music` | String (number) | Music volume (0.0-1.0) | Audio module preference |
| `mm_audio_muted` | String ("1" or "0") | Mute toggle | Audio module preference |

### Therapist Mode
| Key | Type | Purpose | Current Usage |
|-----|------|---------|---------------|
| `mm_therapist_mode` | String ("1" or "0") | Therapist mode enabled | Separate from GameState |

### Tutorial Preferences
| Key | Type | Purpose | Current Usage |
|-----|------|---------|---------------|
| `mm_pref_tutorial` | String ("always" \| "never" \| "ask") | Global tutorial preference | Fallback if no slot-specific pref |
| `mm_slot_pref_tutorial_${slotNum}` | String ("always" \| "never") | Per-slot tutorial preference | Slot-specific tutorial setting |

---

## 📍 localStorage Usage by Location

### 1. Audio Module (Lines 415-530)
**Purpose**: Manage audio preferences (SFX, music, mute)

#### getItem calls:
- Line 420: `localStorage.getItem("mm_audio_sfx")` - Load SFX volume on init
- Line 421: `localStorage.getItem("mm_audio_music")` - Load music volume on init
- Line 422: `localStorage.getItem("mm_audio_muted")` - Load mute state on init

#### setItem calls:
- Line 459: `localStorage.setItem("mm_audio_sfx", String(sfxVol))` - Save SFX volume
- Line 464: `localStorage.setItem("mm_audio_music", String(musVol))` - Save music volume
- Line 469: `localStorage.setItem("mm_audio_muted", muted ? "1" : "0")` - Save mute state

**Migration Note**: These preferences are independent of game state. Keep separate from main state.

---

### 2. Main Game Initialization (Lines 1240-1260)
**Purpose**: Load therapist mode flag on startup

#### getItem calls:
- Line 1250: `localStorage.getItem("mm_therapist_mode")` - Restore therapist mode if not in GameState

**Migration Note**: Therapist mode is stored both in GameState and localStorage for redundancy.

---

### 3. Main Save/Load Functions (Lines 1680-1840)
**Purpose**: Core persistence layer

#### saveGame() - Line 1683:
- Line 1686: `localStorage.setItem('monstrinhomon_state', data)` - Save entire GameState

#### loadGame() - Line 1703:
- Line 1705: `localStorage.getItem('monstrinhomon_state')` - Load entire GameState
- Line 1720: `localStorage.setItem('monstrinhomon_corrupted_backup', raw)` - Backup corrupted save
- Line 1721: `localStorage.removeItem('monstrinhomon_state')` - Remove corrupted save

**Migration Note**: This is the CORE save/load. Must be replaced with transactional save.

---

### 4. Therapist Mode Functions (Lines 1835-1855)
**Purpose**: Get/set therapist mode with fallback

#### mmIsTherapistMode() - Line 1835:
- Line 1841: `localStorage.getItem("mm_therapist_mode")` - Fallback if GameState unavailable

#### mmSetTherapistMode() - Line 1844:
- Line 1851: `localStorage.setItem("mm_therapist_mode", v ? "1" : "0")` - Persist mode change

**Migration Note**: Keep redundant storage for safety (therapist mode is critical).

---

### 5. Main Menu / Reset Functions (Lines 7290-7310)
**Purpose**: Clear game state when starting fresh

#### removeItem calls:
- Line 7299: `localStorage.removeItem('monstrinhomon_state')` - Clear state on "Start Fresh"

**Migration Note**: Should use StorageManager.remove() instead.

---

### 6. Save Slots Menu (Lines 7710-7780)
**Purpose**: Display save slots and handle deletion

#### getItem calls:
- Line 7721: `localStorage.getItem("mm_last_slot")` - Get last used slot for UI

#### removeItem calls:
- Line 7769: `localStorage.removeItem(MM_SAVE_KEY)` - Clear current state before load

**Migration Note**: Need to track last slot for UI highlighting.

---

### 7. Save Slot Export/Import (Lines 7950-8000)
**Purpose**: Export save to JSON file

#### setItem calls:
- Line 7980: `localStorage.setItem(key, JSON.stringify(envelope))` - Save exported data back

**Migration Note**: Export creates envelope with metadata. Import loads it.

---

### 8. Save Slot Core Functions (Lines 8040-8140)
**Purpose**: Load/save to specific slots

#### mmLoadSlot() - Line 8047:
- Line 8051: `localStorage.getItem(key)` - Load slot data
- Line 8064: `localStorage.setItem(key, JSON.stringify(saveObj))` - Save migration result

#### mmSaveToSlot() - Line 8107:
- Line 8114: `localStorage.setItem("mm_last_slot", String(slot))` - Remember last slot

#### mmDeleteSlot() - Line 8133:
- Line 8135: `localStorage.removeItem(MM_SAVE_KEYS[slot])` - Delete slot data

**Migration Note**: These need transactional save + auto-backup.

---

### 9. Legacy Migration (Lines 8230-8350)
**Purpose**: Migrate old saves to slot system

#### mmGetDefaultSlot() - Line 8235:
- Line 8237: `localStorage.getItem("mm_last_slot")` - Get last slot number

#### mmSetDefaultSlot() - Line 8297:
- Line 8299: `localStorage.setItem("mm_last_slot", String(slot))` - Set default slot

#### mmMigrateLegacySaveToSlot1() - Line 8306:
- Line 8308: `localStorage.getItem(MM_MIGRATED_FLAG)` - Check if migration done
- Line 8313: `localStorage.setItem(MM_MIGRATED_FLAG, "1")` - Mark migration complete (early return)
- Line 8319: `localStorage.getItem(key)` - Load legacy save
- Line 8344: `localStorage.setItem(MM_MIGRATED_FLAG, "1")` - Mark migration complete (after success)

**Migration Note**: Migration system already exists. Need to integrate with new StorageManager.

---

### 10. Tutorial Preferences (Lines 8585-8675)
**Purpose**: Remember user's tutorial choice per slot

#### mmGetSlotTutorialPref() - Line 8588:
- Line 8591: `localStorage.getItem(k)` - Get slot-specific tutorial pref

#### mmSetSlotTutorialPref() - Line 8596:
- Line 8599: `localStorage.setItem(k, pref)` - Save slot-specific tutorial pref

#### mmGetActiveSlot() - Line 8604:
- Line 8612: `localStorage.getItem("mm_last_slot")` - Fallback for active slot detection

#### mmPostGameStartFlow() - Line 8623:
- Line 8632: `localStorage.getItem("mm_pref_tutorial")` - Get global tutorial pref

#### mmPersistTutorialChoice() - Line 8664:
- Line 8674: `localStorage.setItem("mm_pref_tutorial", pref)` - Save global tutorial pref

**Migration Note**: Tutorial preferences are per-slot and global. Keep separate from main state.

---

## 🎯 Refactoring Strategy

### Phase 1: Create StorageManager (js/storage.js)
- Define all key constants in one place
- Implement safe JSON parse/stringify with logging
- Implement transactional save (write temp, verify, commit, cleanup)
- Implement migration framework
- Implement auto-backup for slots

### Phase 2: Replace Core Save/Load (index.html ~1680-1840)
- Replace saveGame() to use StorageManager.saveState()
- Replace loadGame() to use StorageManager.loadState()
- Keep migration logic, delegate to StorageManager

### Phase 3: Replace Audio Preferences (~415-530)
- Replace with StorageManager.getAudioPref() / setAudioPref()
- Keep separate from main state (audio is independent)

### Phase 4: Replace Slot Operations (~8000-8350)
- Replace slot load/save with StorageManager.loadSlot() / saveSlot()
- Implement auto-backup before save
- Keep migration intact

### Phase 5: Replace Tutorial Preferences (~8585-8675)
- Replace with StorageManager.getTutorialPref() / setTutorialPref()

### Phase 6: Replace Therapist Mode (~1835-1855, ~1250)
- Replace with StorageManager.getTherapistMode() / setTherapistMode()

### Phase 7: Final Cleanup
- Search for any remaining direct localStorage calls
- Verify all access goes through StorageManager
- Update error handling to use StorageManager logging

---

## ✅ Success Criteria

1. **Zero direct localStorage calls** in index.html (except in js/storage.js)
2. **All keys documented** in StorageManager.StorageKeys
3. **Transactional save** prevents corruption
4. **Migrations auto-save** when needed
5. **Auto-backup** before slot saves
6. **Console clean** (0 errors, 0 warnings)
7. **No behavior changes** (smoke test passes)

---

## 🧪 Smoke Test Checklist

- [ ] Open game → no console errors
- [ ] Create session → saves correctly
- [ ] Create player → saves correctly
- [ ] Start encounter → saves correctly
- [ ] Gain XP → saves correctly
- [ ] Reload page → state persists
- [ ] Save to Slot 1 → works
- [ ] Load from Slot 1 → works
- [ ] Save to Slot 2 → works
- [ ] Load from Slot 2 → works
- [ ] Delete Slot 2 → works
- [ ] Export save → creates file
- [ ] Import save → restores state
- [ ] Change audio settings → persists
- [ ] Toggle therapist mode → persists
- [ ] Tutorial preference → persists
- [ ] Clear all data → works

---

**Document Version**: 1.0  
**Created**: 2026-01-31  
**Author**: PR3 Refactoring Agent
