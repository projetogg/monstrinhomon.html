/**
 * PR16A - PartyDex System
 * 
 * Shared Dex for the entire party/group with escalating milestone rewards.
 * 
 * Features:
 * - Seen: marked at the start of any encounter (wild/group/boss)
 * - Captured: marked when a monster enters the party (team or sharedBox)
 * - Milestones: Every 10 unique captured monsters, award escalating coins to the party
 *   - 10 captured → +100 coins
 *   - 20 captured → +200 coins
 *   - 30 captured → +300 coins
 *   - etc.
 * 
 * RULES:
 * - All functions are idempotent and defensive
 * - Only unique templateIds count
 * - Milestone rewards are paid only once per milestone
 * - Rewards go to GameState.partyMoney
 */

/**
 * Ensure partyDex exists in GameState with proper structure
 * @param {Object} state - GameState object
 */
export function ensurePartyDex(state) {
    if (!state.partyDex) {
        state.partyDex = {
            entries: {},
            meta: {
                lastMilestoneAwarded: 0
            }
        };
    }
    
    // Ensure entries object exists
    if (!state.partyDex.entries || typeof state.partyDex.entries !== 'object') {
        state.partyDex.entries = {};
    }
    
    // Ensure meta object exists
    if (!state.partyDex.meta || typeof state.partyDex.meta !== 'object') {
        state.partyDex.meta = {
            lastMilestoneAwarded: 0
        };
    }
    
    // Ensure lastMilestoneAwarded is a number
    if (typeof state.partyDex.meta.lastMilestoneAwarded !== 'number') {
        state.partyDex.meta.lastMilestoneAwarded = 0;
    }
}

/**
 * Ensure partyMoney exists in GameState
 * @param {Object} state - GameState object
 */
export function ensurePartyMoney(state) {
    if (typeof state.partyMoney !== 'number') {
        state.partyMoney = 0;
    }
}

/**
 * Mark a monster as seen in the PartyDex (idempotent)
 * @param {Object} state - GameState object
 * @param {string} monsterTemplateId - Template ID of the monster
 */
export function markDexSeen(state, monsterTemplateId) {
    if (!monsterTemplateId) return;
    
    ensurePartyDex(state);
    
    // Get or create entry
    if (!state.partyDex.entries[monsterTemplateId]) {
        state.partyDex.entries[monsterTemplateId] = {
            seen: false,
            captured: false
        };
    }
    
    // Mark as seen (idempotent)
    state.partyDex.entries[monsterTemplateId].seen = true;
}

/**
 * Mark a monster as captured in the PartyDex
 * This also marks it as seen
 * @param {Object} state - GameState object
 * @param {string} monsterTemplateId - Template ID of the monster
 */
export function markDexCaptured(state, monsterTemplateId) {
    if (!monsterTemplateId) return;
    
    ensurePartyDex(state);
    
    // Get or create entry
    if (!state.partyDex.entries[monsterTemplateId]) {
        state.partyDex.entries[monsterTemplateId] = {
            seen: false,
            captured: false
        };
    }
    
    // Mark as both seen and captured
    state.partyDex.entries[monsterTemplateId].seen = true;
    state.partyDex.entries[monsterTemplateId].captured = true;
}

/**
 * Get the count of unique captured monsters
 * @param {Object} state - GameState object
 * @returns {number} Count of unique captured monsters
 */
export function getCapturedCount(state) {
    ensurePartyDex(state);
    
    let count = 0;
    for (const templateId in state.partyDex.entries) {
        if (state.partyDex.entries[templateId]?.captured === true) {
            count++;
        }
    }
    
    return count;
}

/**
 * Check for milestone achievements and award rewards
 * Milestones are at every 10 captured (10, 20, 30, etc.)
 * Rewards scale: milestone/10 * 100 (so 10→+100, 20→+200, 30→+300)
 * 
 * @param {Object} state - GameState object
 * @param {Object} deps - Dependencies object with { showToast?, saveToLocalStorage? }
 * @returns {Object} { awarded: boolean, milestone?: number, reward?: number }
 */
export function checkDexMilestonesAndAward(state, deps = {}) {
    ensurePartyDex(state);
    ensurePartyMoney(state);
    
    const capturedCount = getCapturedCount(state);
    const milestone = Math.floor(capturedCount / 10) * 10;
    
    // Check if we've reached a new milestone
    if (milestone > 0 && milestone > state.partyDex.meta.lastMilestoneAwarded) {
        // Calculate reward: (milestone / 10) * 100
        const reward = (milestone / 10) * 100;
        
        // Award coins to party
        state.partyMoney += reward;
        
        // Update last milestone awarded
        state.partyDex.meta.lastMilestoneAwarded = milestone;
        
        // Notify
        const message = `🎉 Dex do grupo: ${milestone} capturados! +${reward} moedas para o grupo! 💰`;
        console.log('[PartyDex]', message);
        
        if (deps.showToast) {
            deps.showToast(message, 'success');
        }
        
        // Save state
        if (deps.saveToLocalStorage) {
            deps.saveToLocalStorage();
        }
        
        return { awarded: true, milestone, reward };
    }
    
    return { awarded: false };
}

/**
 * Hook to be called whenever a monster is added to the group
 * (either to team or to sharedBox)
 * 
 * This marks the monster as captured and checks for milestone rewards
 * 
 * @param {Object} state - GameState object
 * @param {string} monsterTemplateId - Template ID of the monster
 * @param {Object} deps - Dependencies object with { showToast?, saveToLocalStorage? }
 * @returns {Object} Result from checkDexMilestonesAndAward
 */
export function onMonsterAddedToGroup(state, monsterTemplateId, deps = {}) {
    if (!monsterTemplateId) {
        console.warn('[PartyDex] onMonsterAddedToGroup called with no templateId');
        return { awarded: false };
    }
    
    // Mark as captured (which also marks as seen)
    markDexCaptured(state, monsterTemplateId);
    
    // Check and award milestones
    return checkDexMilestonesAndAward(state, deps);
}

/**
 * Mark multiple monsters as seen (for encounter setup)
 * @param {Object} state - GameState object
 * @param {Array<string>} templateIds - Array of template IDs
 */
export function markMultipleSeen(state, templateIds) {
    if (!Array.isArray(templateIds)) return;
    
    for (const templateId of templateIds) {
        markDexSeen(state, templateId);
    }
}

// Make globally available for index.html
if (typeof window !== 'undefined') {
    window.PartyDex = {
        ensurePartyDex,
        ensurePartyMoney,
        markDexSeen,
        markDexCaptured,
        getCapturedCount,
        checkDexMilestonesAndAward,
        onMonsterAddedToGroup,
        markMultipleSeen
    };
}
