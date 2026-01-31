/**
 * StorageManager - Centralized localStorage persistence layer for Monstrinhomon
 * 
 * PR3: All localStorage access must go through this module.
 * 
 * Features:
 * - Transactional saves (write temp, verify, commit, cleanup)
 * - Auto-migration with auto-save when needed
 * - Auto-backup before slot saves
 * - Safe JSON parsing with error recovery
 * - Centralized error logging
 * 
 * STRICT RULES:
 * - NO catch blocks without logging
 * - ALL errors must be logged with context
 * - Fallback to safe defaults on error
 * - Never throw errors to caller (return null/false instead)
 */

const StorageManager = (() => {
    'use strict';

    // ===== Storage Keys Registry =====
    const StorageKeys = {
        // Main State
        STATE: 'monstrinhomon_state',
        STATE_CORRUPTED_BACKUP: 'monstrinhomon_corrupted_backup',
        
        // Save Slots
        SLOT_1: 'mm_save_slot_1',
        SLOT_2: 'mm_save_slot_2',
        SLOT_3: 'mm_save_slot_3',
        LAST_SLOT: 'mm_last_slot',
        SLOTS_MIGRATED: 'mm_slots_migrated_v1',
        
        // Audio Preferences
        AUDIO_SFX: 'mm_audio_sfx',
        AUDIO_MUSIC: 'mm_audio_music',
        AUDIO_MUTED: 'mm_audio_muted',
        
        // Therapist Mode
        THERAPIST_MODE: 'mm_therapist_mode',
        
        // Tutorial Preferences
        TUTORIAL_PREF_GLOBAL: 'mm_pref_tutorial',
        // Note: slot-specific tutorial prefs use pattern: mm_slot_pref_tutorial_${slotNum}
    };

    // ===== Legacy Keys (for migration) =====
    const LegacyKeys = [
        'monstrinhomon_state',
        'mm_save',
        'GameState',
        'mm_state'
    ];

    // ===== Helper: Safe clamp for numbers =====
    function clamp01(v) {
        return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
    }

    // ===== Core: Safe JSON Parse =====
    /**
     * Safely parse JSON with error handling
     * @param {string} raw - Raw JSON string
     * @param {*} fallback - Fallback value if parse fails
     * @returns {*} Parsed object or fallback
     */
    function safeJSONParse(raw, fallback = null) {
        if (raw === null || raw === undefined) {
            return fallback;
        }
        try {
            return JSON.parse(raw);
        } catch (err) {
            console.error('[StorageManager] JSON parse failed:', err.message);
            console.error('[StorageManager] Raw data (first 200 chars):', raw.substring(0, 200));
            return fallback;
        }
    }

    // ===== Core: Safe JSON Stringify =====
    /**
     * Safely stringify object to JSON
     * @param {*} obj - Object to stringify
     * @returns {string|null} JSON string or null on error
     */
    function safeJSONStringify(obj) {
        try {
            return JSON.stringify(obj);
        } catch (err) {
            console.error('[StorageManager] JSON stringify failed:', err.message);
            console.error('[StorageManager] Object type:', typeof obj);
            return null;
        }
    }

    // ===== Core: Check if key exists =====
    /**
     * Check if a key exists in localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if key exists
     */
    function exists(key) {
        try {
            return localStorage.getItem(key) !== null;
        } catch (err) {
            console.error('[StorageManager] Failed to check existence of key:', key, err);
            return false;
        }
    }

    // ===== Core: Load JSON =====
    /**
     * Load and parse JSON from localStorage
     * @param {string} key - Storage key
     * @param {*} fallback - Fallback value if not found or invalid
     * @returns {*} Parsed object or fallback
     */
    function loadJSON(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) {
                return fallback;
            }
            return safeJSONParse(raw, fallback);
        } catch (err) {
            console.error('[StorageManager] Failed to load key:', key, err);
            return fallback;
        }
    }

    // ===== Core: Save JSON (Simple) =====
    /**
     * Save object to localStorage as JSON
     * @param {string} key - Storage key
     * @param {*} value - Value to save
     * @returns {boolean} True if successful
     */
    function saveJSON(key, value) {
        try {
            const json = safeJSONStringify(value);
            if (json === null) {
                console.error('[StorageManager] Cannot save null JSON for key:', key);
                return false;
            }
            localStorage.setItem(key, json);
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save key:', key, err);
            return false;
        }
    }

    // ===== Core: Remove Key =====
    /**
     * Remove a key from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if successful
     */
    function remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to remove key:', key, err);
            return false;
        }
    }

    // ===== Core: Transactional Save =====
    /**
     * Save JSON with transaction safety:
     * 1. Stringify data
     * 2. Write to temp key (key + '__tmp')
     * 3. Read back and verify parse
     * 4. Commit: write to real key
     * 5. Cleanup: remove temp key
     * 
     * @param {string} key - Storage key
     * @param {*} value - Value to save
     * @returns {boolean} True if successful
     */
    function saveJSONTransactional(key, value) {
        const tempKey = key + '__tmp';
        
        try {
            // Step 1: Stringify
            const json = safeJSONStringify(value);
            if (json === null) {
                console.error('[StorageManager] Transactional save failed: stringify error for key:', key);
                return false;
            }

            // Step 2: Write to temp key
            try {
                localStorage.setItem(tempKey, json);
            } catch (writeErr) {
                console.error('[StorageManager] Transactional save failed: cannot write temp key:', tempKey, writeErr);
                return false;
            }

            // Step 3: Read back and verify
            const verify = localStorage.getItem(tempKey);
            if (verify !== json) {
                console.error('[StorageManager] Transactional save failed: verification mismatch for key:', key);
                localStorage.removeItem(tempKey);
                return false;
            }

            // Extra verification: try to parse what we wrote
            const parsed = safeJSONParse(verify, null);
            if (parsed === null && value !== null) {
                console.error('[StorageManager] Transactional save failed: cannot re-parse temp data for key:', key);
                localStorage.removeItem(tempKey);
                return false;
            }

            // Step 4: Commit - write to real key
            localStorage.setItem(key, json);

            // Step 5: Cleanup - remove temp key
            localStorage.removeItem(tempKey);

            console.log('[StorageManager] Transactional save successful for key:', key);
            return true;

        } catch (err) {
            console.error('[StorageManager] Transactional save failed with exception for key:', key, err);
            // Cleanup on error
            try {
                localStorage.removeItem(tempKey);
            } catch (cleanupErr) {
                console.error('[StorageManager] Failed to cleanup temp key:', tempKey, cleanupErr);
            }
            return false;
        }
    }

    // ===== High-Level: Load Main State =====
    /**
     * Load main game state with migration
     * @returns {{ state: object|null, loaded: boolean, migrated: boolean, notes: string[] }}
     */
    function loadState() {
        const notes = [];
        
        try {
            const raw = localStorage.getItem(StorageKeys.STATE);
            
            // No save found
            if (raw === null) {
                notes.push('No save found. Starting new game.');
                console.log('[StorageManager]', notes[0]);
                return { state: null, loaded: false, migrated: false, notes };
            }

            // Parse JSON
            const parsed = safeJSONParse(raw, null);
            if (parsed === null) {
                // Corrupted save: backup but DON'T auto-delete (user may want to recover)
                notes.push('Corrupted save detected. Creating backup. Data preserved.');
                console.error('[StorageManager]', notes[0]);
                console.error('[StorageManager] Corrupted data preserved at key:', StorageKeys.STATE);
                console.error('[StorageManager] User can manually clear if needed.');
                
                try {
                    localStorage.setItem(StorageKeys.STATE_CORRUPTED_BACKUP, raw);
                    notes.push('Backup created at: ' + StorageKeys.STATE_CORRUPTED_BACKUP);
                } catch (backupErr) {
                    console.error('[StorageManager] Failed to backup corrupted save:', backupErr);
                    notes.push('Backup failed: ' + backupErr.message);
                }
                
                return { state: null, loaded: false, migrated: false, notes };
            }

            // Basic validation
            if (!parsed || typeof parsed !== 'object') {
                notes.push('Invalid save format (not an object). Resetting.');
                console.warn('[StorageManager]', notes[0]);
                return { state: null, loaded: false, migrated: false, notes };
            }

            // State loaded successfully
            notes.push('State loaded successfully.');
            return { state: parsed, loaded: true, migrated: false, notes };

        } catch (err) {
            console.error('[StorageManager] Failed to load state:', err);
            notes.push('Exception during load: ' + err.message);
            return { state: null, loaded: false, migrated: false, notes };
        }
    }

    // ===== High-Level: Save Main State =====
    /**
     * Save main game state (uses transactional save)
     * @param {object} state - Game state object
     * @returns {boolean} True if successful
     */
    function saveState(state) {
        return saveJSONTransactional(StorageKeys.STATE, state);
    }

    // ===== High-Level: Load Save Slot =====
    /**
     * Load a save slot with envelope structure
     * @param {number} slot - Slot number (1, 2, or 3)
     * @returns {{ data: object|null, loaded: boolean, notes: string[] }}
     */
    function loadSlot(slot) {
        const notes = [];
        const key = StorageKeys[`SLOT_${slot}`];
        
        if (!key) {
            notes.push(`Invalid slot number: ${slot}`);
            console.error('[StorageManager]', notes[0]);
            return { data: null, loaded: false, notes };
        }

        try {
            const raw = localStorage.getItem(key);
            
            if (raw === null) {
                notes.push(`Slot ${slot} is empty.`);
                return { data: null, loaded: false, notes };
            }

            const parsed = safeJSONParse(raw, null);
            if (parsed === null) {
                notes.push(`Slot ${slot} data is corrupted.`);
                console.error('[StorageManager]', notes[0]);
                return { data: null, loaded: false, notes };
            }

            notes.push(`Slot ${slot} loaded successfully.`);
            return { data: parsed, loaded: true, notes };

        } catch (err) {
            console.error('[StorageManager] Failed to load slot:', slot, err);
            notes.push(`Exception loading slot ${slot}: ${err.message}`);
            return { data: null, loaded: false, notes };
        }
    }

    // ===== High-Level: Save to Slot (with auto-backup) =====
    /**
     * Save to a slot with auto-backup
     * @param {number} slot - Slot number (1, 2, or 3)
     * @param {object} data - Data to save (envelope with metadata)
     * @returns {boolean} True if successful
     */
    function saveSlot(slot, data) {
        const key = StorageKeys[`SLOT_${slot}`];
        
        if (!key) {
            console.error('[StorageManager] Invalid slot number:', slot);
            return false;
        }

        try {
            // Auto-backup: save current slot to backup key (if exists)
            const backupKey = key + '__bak';
            const existing = localStorage.getItem(key);
            if (existing !== null) {
                try {
                    localStorage.setItem(backupKey, existing);
                    console.log('[StorageManager] Auto-backup created for slot', slot, 'at:', backupKey);
                } catch (backupErr) {
                    console.warn('[StorageManager] Failed to create auto-backup for slot', slot, backupErr);
                    // Continue with save anyway
                }
            }

            // Save with transactional safety
            const success = saveJSONTransactional(key, data);
            
            if (success) {
                console.log('[StorageManager] Slot', slot, 'saved successfully.');
            }
            
            return success;

        } catch (err) {
            console.error('[StorageManager] Failed to save slot:', slot, err);
            return false;
        }
    }

    // ===== High-Level: Delete Slot =====
    /**
     * Delete a save slot
     * @param {number} slot - Slot number (1, 2, or 3)
     * @returns {boolean} True if successful
     */
    function deleteSlot(slot) {
        const key = StorageKeys[`SLOT_${slot}`];
        
        if (!key) {
            console.error('[StorageManager] Invalid slot number:', slot);
            return false;
        }

        return remove(key);
    }

    // ===== Preferences: Audio =====
    function getAudioSfxVolume() {
        const val = localStorage.getItem(StorageKeys.AUDIO_SFX);
        return clamp01(Number(val ?? 0.7));
    }

    function getAudioMusicVolume() {
        const val = localStorage.getItem(StorageKeys.AUDIO_MUSIC);
        return clamp01(Number(val ?? 0.4));
    }

    function getAudioMuted() {
        const val = localStorage.getItem(StorageKeys.AUDIO_MUTED);
        return val === "1";
    }

    function setAudioSfxVolume(volume) {
        try {
            const v = clamp01(volume);
            localStorage.setItem(StorageKeys.AUDIO_SFX, String(v));
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save SFX volume:', err);
            return false;
        }
    }

    function setAudioMusicVolume(volume) {
        try {
            const v = clamp01(volume);
            localStorage.setItem(StorageKeys.AUDIO_MUSIC, String(v));
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save music volume:', err);
            return false;
        }
    }

    function setAudioMuted(muted) {
        try {
            localStorage.setItem(StorageKeys.AUDIO_MUTED, muted ? "1" : "0");
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save mute state:', err);
            return false;
        }
    }

    // ===== Preferences: Therapist Mode =====
    function getTherapistMode() {
        const val = localStorage.getItem(StorageKeys.THERAPIST_MODE);
        return val === "1";
    }

    function setTherapistMode(enabled) {
        try {
            localStorage.setItem(StorageKeys.THERAPIST_MODE, enabled ? "1" : "0");
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save therapist mode:', err);
            return false;
        }
    }

    // ===== Preferences: Last Slot =====
    function getLastSlot() {
        try {
            const val = localStorage.getItem(StorageKeys.LAST_SLOT);
            if (val === null) return null;
            const n = Number(val);
            return (n >= 1 && n <= 3) ? n : null;
        } catch (err) {
            console.error('[StorageManager] Failed to get last slot:', err);
            return null;
        }
    }

    function setLastSlot(slot) {
        try {
            if (slot < 1 || slot > 3) {
                console.error('[StorageManager] Invalid slot number for setLastSlot:', slot);
                return false;
            }
            localStorage.setItem(StorageKeys.LAST_SLOT, String(slot));
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save last slot:', err);
            return false;
        }
    }

    // ===== Migration: Check if slots migrated =====
    function isSlotsMigrated() {
        const val = localStorage.getItem(StorageKeys.SLOTS_MIGRATED);
        return val === "1";
    }

    function markSlotsMigrated() {
        try {
            localStorage.setItem(StorageKeys.SLOTS_MIGRATED, "1");
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to mark slots as migrated:', err);
            return false;
        }
    }

    // ===== Tutorial Preferences =====
    function getTutorialPrefGlobal() {
        try {
            const val = localStorage.getItem(StorageKeys.TUTORIAL_PREF_GLOBAL);
            return val || "ask";
        } catch (err) {
            console.error('[StorageManager] Failed to get global tutorial pref:', err);
            return "ask";
        }
    }

    function setTutorialPrefGlobal(pref) {
        try {
            localStorage.setItem(StorageKeys.TUTORIAL_PREF_GLOBAL, pref);
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save global tutorial pref:', err);
            return false;
        }
    }

    function getTutorialPrefSlot(slotNum) {
        try {
            const key = `mm_slot_pref_tutorial_${slotNum}`;
            const val = localStorage.getItem(key);
            return val || null;
        } catch (err) {
            console.error('[StorageManager] Failed to get slot tutorial pref:', err);
            return null;
        }
    }

    function setTutorialPrefSlot(slotNum, pref) {
        try {
            const key = `mm_slot_pref_tutorial_${slotNum}`;
            localStorage.setItem(key, pref);
            return true;
        } catch (err) {
            console.error('[StorageManager] Failed to save slot tutorial pref:', err);
            return false;
        }
    }

    // ===== Public API =====
    return {
        // Keys registry
        StorageKeys,
        LegacyKeys,
        
        // Core low-level
        exists,
        loadJSON,
        saveJSON,
        saveJSONTransactional,
        remove,
        
        // High-level: Main State
        loadState,
        saveState,
        
        // High-level: Save Slots
        loadSlot,
        saveSlot,
        deleteSlot,
        getLastSlot,
        setLastSlot,
        
        // Migration
        isSlotsMigrated,
        markSlotsMigrated,
        
        // Preferences: Audio
        getAudioSfxVolume,
        getAudioMusicVolume,
        getAudioMuted,
        setAudioSfxVolume,
        setAudioMusicVolume,
        setAudioMuted,
        
        // Preferences: Therapist Mode
        getTherapistMode,
        setTherapistMode,
        
        // Preferences: Tutorial
        getTutorialPrefGlobal,
        setTutorialPrefGlobal,
        getTutorialPrefSlot,
        setTutorialPrefSlot,
    };
})();

// Make globally available
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}
