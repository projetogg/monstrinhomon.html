/**
 * PR16B - PartyDex UI Tests
 * 
 * Tests for pure functions in partyDexUI.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getDexProgress,
    getDexEntryStatus,
    sortDexTemplates
} from '../js/ui/partyDexUI.js';

describe('PartyDexUI - getDexProgress', () => {
    it('should return default values for empty state', () => {
        const state = {};
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(0);
        expect(result.nextMilestone).toBe(10);
        expect(result.remaining).toBe(10);
        expect(result.nextReward).toBe(100);
        expect(result.partyMoney).toBe(0);
        expect(result.lastAwarded).toBe(0);
        expect(result.progressPct).toBe(0);
    });
    
    it('should calculate progress with 0 captured', () => {
        const state = {
            partyDex: { entries: {}, meta: { lastMilestoneAwarded: 0 } },
            partyMoney: 0
        };
        
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(0);
        expect(result.nextMilestone).toBe(10);
        expect(result.remaining).toBe(10);
        expect(result.nextReward).toBe(100);
        expect(result.progressPct).toBe(0);
    });
    
    it('should calculate progress with 9 captured', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: true },
                    'm2': { seen: true, captured: true },
                    'm3': { seen: true, captured: true },
                    'm4': { seen: true, captured: true },
                    'm5': { seen: true, captured: true },
                    'm6': { seen: true, captured: true },
                    'm7': { seen: true, captured: true },
                    'm8': { seen: true, captured: true },
                    'm9': { seen: true, captured: true }
                },
                meta: { lastMilestoneAwarded: 0 }
            },
            partyMoney: 0
        };
        
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(9);
        expect(result.nextMilestone).toBe(10);
        expect(result.remaining).toBe(1);
        expect(result.nextReward).toBe(100);
        expect(result.progressPct).toBe(90); // 9/10 * 100
    });
    
    it('should calculate progress with 10 captured', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: true },
                    'm2': { seen: true, captured: true },
                    'm3': { seen: true, captured: true },
                    'm4': { seen: true, captured: true },
                    'm5': { seen: true, captured: true },
                    'm6': { seen: true, captured: true },
                    'm7': { seen: true, captured: true },
                    'm8': { seen: true, captured: true },
                    'm9': { seen: true, captured: true },
                    'm10': { seen: true, captured: true }
                },
                meta: { lastMilestoneAwarded: 10 }
            },
            partyMoney: 100
        };
        
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(10);
        expect(result.nextMilestone).toBe(20);
        expect(result.remaining).toBe(10);
        expect(result.nextReward).toBe(200);
        expect(result.progressPct).toBe(0); // 10%10=0, resets for next bracket
        expect(result.partyMoney).toBe(100);
        expect(result.lastAwarded).toBe(10);
    });
    
    it('should calculate progress with 19 captured', () => {
        const state = {
            partyDex: {
                entries: Object.fromEntries(
                    Array.from({ length: 19 }, (_, i) => [`m${i + 1}`, { seen: true, captured: true }])
                ),
                meta: { lastMilestoneAwarded: 10 }
            },
            partyMoney: 100
        };
        
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(19);
        expect(result.nextMilestone).toBe(20);
        expect(result.remaining).toBe(1);
        expect(result.nextReward).toBe(200);
        expect(result.progressPct).toBe(90); // 19%10=9, 9/10*100=90
    });
    
    it('should calculate progress with 20 captured', () => {
        const state = {
            partyDex: {
                entries: Object.fromEntries(
                    Array.from({ length: 20 }, (_, i) => [`m${i + 1}`, { seen: true, captured: true }])
                ),
                meta: { lastMilestoneAwarded: 20 }
            },
            partyMoney: 300
        };
        
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(20);
        expect(result.nextMilestone).toBe(30);
        expect(result.remaining).toBe(10);
        expect(result.nextReward).toBe(300);
        expect(result.progressPct).toBe(0); // 20%10=0
        expect(result.partyMoney).toBe(300);
    });
    
    it('should only count captured monsters, not just seen', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: true },
                    'm2': { seen: true, captured: true },
                    'm3': { seen: true, captured: false }, // seen but not captured
                    'm4': { seen: false, captured: false }  // neither
                },
                meta: { lastMilestoneAwarded: 0 }
            },
            partyMoney: 0
        };
        
        const result = getDexProgress(state);
        
        expect(result.capturedCount).toBe(2); // Only m1 and m2
    });
});

describe('PartyDexUI - getDexEntryStatus', () => {
    it('should return "unknown" for missing entry', () => {
        const state = {
            partyDex: { entries: {} }
        };
        
        expect(getDexEntryStatus(state, 'm1')).toBe('unknown');
    });
    
    it('should return "unknown" for empty state', () => {
        const state = {};
        
        expect(getDexEntryStatus(state, 'm1')).toBe('unknown');
    });
    
    it('should return "captured" when captured is true', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: true }
                }
            }
        };
        
        expect(getDexEntryStatus(state, 'm1')).toBe('captured');
    });
    
    it('should return "captured" even if seen is false (edge case)', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: false, captured: true }
                }
            }
        };
        
        expect(getDexEntryStatus(state, 'm1')).toBe('captured');
    });
    
    it('should return "seen" when seen is true and captured is false', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: false }
                }
            }
        };
        
        expect(getDexEntryStatus(state, 'm1')).toBe('seen');
    });
    
    it('should return "unknown" when both seen and captured are false', () => {
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: false, captured: false }
                }
            }
        };
        
        expect(getDexEntryStatus(state, 'm1')).toBe('unknown');
    });
});

describe('PartyDexUI - sortDexTemplates', () => {
    it('should return empty array for invalid input', () => {
        const state = { partyDex: { entries: {} } };
        
        expect(sortDexTemplates(null, state)).toEqual([]);
        expect(sortDexTemplates(undefined, state)).toEqual([]);
        expect(sortDexTemplates('not an array', state)).toEqual([]);
    });
    
    it('should sort captured before seen before unknown', () => {
        const templates = [
            { id: 'm1', name: 'Mon1' },
            { id: 'm2', name: 'Mon2' },
            { id: 'm3', name: 'Mon3' }
        ];
        
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: false },  // seen
                    'm2': { seen: true, captured: true },   // captured
                    'm3': { seen: false, captured: false }  // unknown
                }
            }
        };
        
        const sorted = sortDexTemplates(templates, state);
        
        expect(sorted[0].id).toBe('m2'); // captured first
        expect(sorted[1].id).toBe('m1'); // seen second
        expect(sorted[2].id).toBe('m3'); // unknown last
    });
    
    it('should sort by ID when status is the same', () => {
        const templates = [
            { id: 'm3', name: 'Mon3' },
            { id: 'm1', name: 'Mon1' },
            { id: 'm2', name: 'Mon2' }
        ];
        
        const state = {
            partyDex: {
                entries: {
                    'm1': { seen: true, captured: true },
                    'm2': { seen: true, captured: true },
                    'm3': { seen: true, captured: true }
                }
            }
        };
        
        const sorted = sortDexTemplates(templates, state);
        
        expect(sorted[0].id).toBe('m1');
        expect(sorted[1].id).toBe('m2');
        expect(sorted[2].id).toBe('m3');
    });
    
    it('should maintain stable sort with mixed statuses', () => {
        const templates = [
            { id: 'MON_005', name: 'E' },
            { id: 'MON_001', name: 'A' },
            { id: 'MON_003', name: 'C' },
            { id: 'MON_004', name: 'D' },
            { id: 'MON_002', name: 'B' }
        ];
        
        const state = {
            partyDex: {
                entries: {
                    'MON_001': { seen: true, captured: true },   // captured
                    'MON_002': { seen: true, captured: false },  // seen
                    'MON_003': { seen: true, captured: true },   // captured
                    // MON_004: unknown (no entry)
                    'MON_005': { seen: true, captured: false }   // seen
                }
            }
        };
        
        const sorted = sortDexTemplates(templates, state);
        
        // Captured: MON_001, MON_003 (sorted by ID)
        expect(sorted[0].id).toBe('MON_001');
        expect(sorted[1].id).toBe('MON_003');
        
        // Seen: MON_002, MON_005 (sorted by ID)
        expect(sorted[2].id).toBe('MON_002');
        expect(sorted[3].id).toBe('MON_005');
        
        // Unknown: MON_004
        expect(sorted[4].id).toBe('MON_004');
    });
    
    it('should not mutate the original array', () => {
        const templates = [
            { id: 'm2', name: 'Mon2' },
            { id: 'm1', name: 'Mon1' }
        ];
        
        const state = {
            partyDex: { entries: {} }
        };
        
        const sorted = sortDexTemplates(templates, state);
        
        // Original should be unchanged
        expect(templates[0].id).toBe('m2');
        expect(templates[1].id).toBe('m1');
        
        // Sorted should be different
        expect(sorted[0].id).toBe('m1');
        expect(sorted[1].id).toBe('m2');
    });
});
