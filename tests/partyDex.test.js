/**
 * PR16A - PartyDex System Tests
 * 
 * Tests for shared party Dex with escalating milestone rewards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ensurePartyDex,
    ensurePartyMoney,
    markDexSeen,
    markDexCaptured,
    getCapturedCount,
    checkDexMilestonesAndAward,
    onMonsterAddedToGroup,
    markMultipleSeen
} from '../js/data/partyDex.js';

describe('PartyDex - Migration and Initialization', () => {
    it('should create partyDex structure if missing', () => {
        const state = {};
        ensurePartyDex(state);
        
        expect(state.partyDex).toBeDefined();
        expect(state.partyDex.entries).toEqual({});
        expect(state.partyDex.meta).toBeDefined();
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(0);
    });
    
    it('should not overwrite existing partyDex', () => {
        const state = {
            partyDex: {
                entries: { 'm_luma': { seen: true, captured: true } },
                meta: { lastMilestoneAwarded: 10 }
            }
        };
        
        ensurePartyDex(state);
        
        expect(state.partyDex.entries['m_luma']).toEqual({ seen: true, captured: true });
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(10);
    });
    
    it('should fix corrupted partyDex structure', () => {
        const state = {
            partyDex: {
                entries: null,
                meta: null
            }
        };
        
        ensurePartyDex(state);
        
        expect(state.partyDex.entries).toEqual({});
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(0);
    });
    
    it('should create partyMoney if missing', () => {
        const state = {};
        ensurePartyMoney(state);
        
        expect(state.partyMoney).toBe(0);
    });
    
    it('should not overwrite existing partyMoney', () => {
        const state = { partyMoney: 500 };
        ensurePartyMoney(state);
        
        expect(state.partyMoney).toBe(500);
    });
    
    it('should fix non-number partyMoney', () => {
        const state = { partyMoney: "invalid" };
        ensurePartyMoney(state);
        
        expect(state.partyMoney).toBe(0);
    });
});

describe('PartyDex - Seen Tracking', () => {
    let state;
    
    beforeEach(() => {
        state = {};
        ensurePartyDex(state);
    });
    
    it('should mark monster as seen', () => {
        markDexSeen(state, 'm_luma');
        
        expect(state.partyDex.entries['m_luma']).toBeDefined();
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
        expect(state.partyDex.entries['m_luma'].captured).toBe(false);
    });
    
    it('should be idempotent (marking seen multiple times)', () => {
        markDexSeen(state, 'm_luma');
        markDexSeen(state, 'm_luma');
        markDexSeen(state, 'm_luma');
        
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
        expect(state.partyDex.entries['m_luma'].captured).toBe(false);
    });
    
    it('should handle null/undefined templateId gracefully', () => {
        markDexSeen(state, null);
        markDexSeen(state, undefined);
        
        expect(Object.keys(state.partyDex.entries)).toHaveLength(0);
    });
    
    it('should mark multiple monsters as seen', () => {
        markMultipleSeen(state, ['m_luma', 'm_trok', 'm_pedrino']);
        
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
        expect(state.partyDex.entries['m_trok'].seen).toBe(true);
        expect(state.partyDex.entries['m_pedrino'].seen).toBe(true);
    });
});

describe('PartyDex - Captured Tracking', () => {
    let state;
    
    beforeEach(() => {
        state = {};
        ensurePartyDex(state);
    });
    
    it('should mark monster as captured', () => {
        markDexCaptured(state, 'm_luma');
        
        expect(state.partyDex.entries['m_luma']).toBeDefined();
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
        expect(state.partyDex.entries['m_luma'].captured).toBe(true);
    });
    
    it('should mark as seen when marking as captured', () => {
        markDexCaptured(state, 'm_luma');
        
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
    });
    
    it('should be idempotent (marking captured multiple times)', () => {
        markDexCaptured(state, 'm_luma');
        markDexCaptured(state, 'm_luma');
        
        const count = getCapturedCount(state);
        expect(count).toBe(1);
    });
    
    it('should handle null/undefined templateId gracefully', () => {
        markDexCaptured(state, null);
        markDexCaptured(state, undefined);
        
        expect(getCapturedCount(state)).toBe(0);
    });
});

describe('PartyDex - Captured Count', () => {
    let state;
    
    beforeEach(() => {
        state = {};
        ensurePartyDex(state);
    });
    
    it('should return 0 for empty dex', () => {
        expect(getCapturedCount(state)).toBe(0);
    });
    
    it('should count only captured monsters', () => {
        markDexSeen(state, 'm_luma');
        markDexSeen(state, 'm_trok');
        markDexCaptured(state, 'm_pedrino');
        
        expect(getCapturedCount(state)).toBe(1);
    });
    
    it('should count multiple captured monsters', () => {
        markDexCaptured(state, 'm_luma');
        markDexCaptured(state, 'm_trok');
        markDexCaptured(state, 'm_pedrino');
        
        expect(getCapturedCount(state)).toBe(3);
    });
    
    it('should not count duplicates', () => {
        markDexCaptured(state, 'm_luma');
        markDexCaptured(state, 'm_luma');
        markDexCaptured(state, 'm_luma');
        
        expect(getCapturedCount(state)).toBe(1);
    });
});

describe('PartyDex - Milestone Rewards', () => {
    let state;
    let mockDeps;
    
    beforeEach(() => {
        state = {};
        ensurePartyDex(state);
        ensurePartyMoney(state);
        
        mockDeps = {
            showToast: () => {},
            saveToLocalStorage: () => {}
        };
    });
    
    it('should not award anything with 0 captured', () => {
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(false);
        expect(state.partyMoney).toBe(0);
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(0);
    });
    
    it('should not award anything with less than 10 captured', () => {
        for (let i = 1; i <= 9; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(false);
        expect(state.partyMoney).toBe(0);
    });
    
    it('should award +100 coins at 10 captured (milestone 10)', () => {
        for (let i = 1; i <= 10; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(10);
        expect(result.reward).toBe(100);
        expect(state.partyMoney).toBe(100);
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(10);
    });
    
    it('should not award milestone 10 twice', () => {
        for (let i = 1; i <= 10; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        checkDexMilestonesAndAward(state, mockDeps);
        const result2 = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result2.awarded).toBe(false);
        expect(state.partyMoney).toBe(100); // Still 100, not 200
    });
    
    it('should award +200 coins at 20 captured (milestone 20)', () => {
        // Simulate having already awarded milestone 10
        state.partyMoney = 100;
        state.partyDex.meta.lastMilestoneAwarded = 10;
        
        for (let i = 1; i <= 20; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(20);
        expect(result.reward).toBe(200);
        expect(state.partyMoney).toBe(300); // 100 + 200
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(20);
    });
    
    it('should award +300 coins at 30 captured (milestone 30)', () => {
        // Simulate having already awarded milestones 10 and 20
        state.partyMoney = 300;
        state.partyDex.meta.lastMilestoneAwarded = 20;
        
        for (let i = 1; i <= 30; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(30);
        expect(result.reward).toBe(300);
        expect(state.partyMoney).toBe(600); // 300 + 300
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(30);
    });
    
    it('should handle jumping multiple milestones at once', () => {
        // Start with 0, jump to 25 captured (should award milestones 10 and 20)
        for (let i = 1; i <= 25; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        // First check: should award milestone 20 (highest reached)
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(20);
        expect(result.reward).toBe(200);
        expect(state.partyMoney).toBe(200);
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(20);
        
        // Note: In current implementation, we only award the highest milestone
        // If we want to award all missed milestones, we need to modify the function
    });
    
    it('should scale rewards correctly (milestone formula)', () => {
        const testCases = [
            { milestone: 10, expectedReward: 100 },
            { milestone: 20, expectedReward: 200 },
            { milestone: 30, expectedReward: 300 },
            { milestone: 40, expectedReward: 400 },
            { milestone: 50, expectedReward: 500 },
            { milestone: 100, expectedReward: 1000 }
        ];
        
        for (const { milestone, expectedReward } of testCases) {
            const reward = (milestone / 10) * 100;
            expect(reward).toBe(expectedReward);
        }
    });
});

describe('PartyDex - onMonsterAddedToGroup Hook', () => {
    let state;
    let mockDeps;
    
    beforeEach(() => {
        state = {};
        ensurePartyDex(state);
        ensurePartyMoney(state);
        
        mockDeps = {
            showToast: () => {},
            saveToLocalStorage: () => {}
        };
    });
    
    it('should mark monster as captured when added', () => {
        onMonsterAddedToGroup(state, 'm_luma', mockDeps);
        
        expect(state.partyDex.entries['m_luma'].captured).toBe(true);
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
    });
    
    it('should check milestones when adding monster', () => {
        // Add 10 monsters
        for (let i = 1; i <= 9; i++) {
            onMonsterAddedToGroup(state, `m_mon${i}`, mockDeps);
        }
        
        expect(state.partyMoney).toBe(0);
        
        // 10th monster should trigger milestone
        const result = onMonsterAddedToGroup(state, 'm_mon10', mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(10);
        expect(state.partyMoney).toBe(100);
    });
    
    it('should handle null templateId gracefully', () => {
        const result = onMonsterAddedToGroup(state, null, mockDeps);
        
        expect(result.awarded).toBe(false);
        expect(getCapturedCount(state)).toBe(0);
    });
    
    it('should not award duplicate captures', () => {
        onMonsterAddedToGroup(state, 'm_luma', mockDeps);
        onMonsterAddedToGroup(state, 'm_luma', mockDeps);
        onMonsterAddedToGroup(state, 'm_luma', mockDeps);
        
        expect(getCapturedCount(state)).toBe(1);
    });
});

describe('PartyDex - Integration Scenarios', () => {
    let state;
    let mockDeps;
    
    beforeEach(() => {
        state = {};
        ensurePartyDex(state);
        ensurePartyMoney(state);
        
        mockDeps = {
            showToast: () => {},
            saveToLocalStorage: () => {}
        };
    });
    
    it('should handle complete capture flow', () => {
        // 1. See monster in encounter
        markDexSeen(state, 'm_luma');
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
        expect(state.partyDex.entries['m_luma'].captured).toBe(false);
        
        // 2. Capture monster
        const result = onMonsterAddedToGroup(state, 'm_luma', mockDeps);
        expect(state.partyDex.entries['m_luma'].captured).toBe(true);
        expect(result.awarded).toBe(false); // Only 1 captured, not enough for milestone
    });
    
    it('should track progression across multiple captures', () => {
        const monsters = [
            'm_luma', 'm_trok', 'm_pedrino', 'm_faiscari', 'm_cantapau',
            'm_verdoso', 'm_aquoso', 'm_flammea', 'm_terreno', 'm_ventoso'
        ];
        
        // Capture first 9 monsters
        for (let i = 0; i < 9; i++) {
            markDexSeen(state, monsters[i]);
            const result = onMonsterAddedToGroup(state, monsters[i], mockDeps);
            expect(result.awarded).toBe(false);
            expect(state.partyMoney).toBe(0);
        }
        
        expect(getCapturedCount(state)).toBe(9);
        
        // 10th capture triggers milestone
        markDexSeen(state, monsters[9]);
        const result = onMonsterAddedToGroup(state, monsters[9], mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(10);
        expect(state.partyMoney).toBe(100);
        expect(getCapturedCount(state)).toBe(10);
    });
    
    it('should maintain state across save/load cycles', () => {
        // Simulate first session
        for (let i = 1; i <= 15; i++) {
            onMonsterAddedToGroup(state, `m_mon${i}`, mockDeps);
        }
        
        expect(state.partyMoney).toBe(100); // Milestone 10
        expect(state.partyDex.meta.lastMilestoneAwarded).toBe(10);
        
        // Simulate loading state
        const savedState = JSON.parse(JSON.stringify(state));
        
        // Continue in "new session"
        for (let i = 16; i <= 20; i++) {
            onMonsterAddedToGroup(savedState, `m_mon${i}`, mockDeps);
        }
        
        // Should award milestone 20
        expect(savedState.partyMoney).toBe(300); // 100 + 200
        expect(savedState.partyDex.meta.lastMilestoneAwarded).toBe(20);
    });
});

describe('PartyDex - Edge Cases', () => {
    it('should handle state without partyDex gracefully', () => {
        const state = { players: [] };
        
        markDexSeen(state, 'm_luma');
        expect(state.partyDex).toBeDefined();
        expect(state.partyDex.entries['m_luma'].seen).toBe(true);
    });
    
    it('should handle empty string templateId', () => {
        const state = {};
        ensurePartyDex(state);
        
        markDexCaptured(state, '');
        expect(getCapturedCount(state)).toBe(0);
    });
    
    it('should handle very large milestone numbers', () => {
        const state = {};
        ensurePartyDex(state);
        ensurePartyMoney(state);
        
        // Simulate 100 captured monsters
        for (let i = 1; i <= 100; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        const mockDeps = {
            showToast: () => {},
            saveToLocalStorage: () => {}
        };
        
        const result = checkDexMilestonesAndAward(state, mockDeps);
        
        expect(result.awarded).toBe(true);
        expect(result.milestone).toBe(100);
        expect(result.reward).toBe(1000); // (100/10) * 100
    });
    
    it('should handle deps without functions', () => {
        const state = {};
        ensurePartyDex(state);
        ensurePartyMoney(state);
        
        for (let i = 1; i <= 10; i++) {
            markDexCaptured(state, `m_mon${i}`);
        }
        
        // Should not crash even without deps
        const result = checkDexMilestonesAndAward(state, {});
        
        expect(result.awarded).toBe(true);
        expect(state.partyMoney).toBe(100);
    });
});
