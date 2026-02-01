/**
 * TESTS: Item UI Helpers - PR12B
 */

import { describe, it, expect } from 'vitest';
import { 
    formatItemBonusLabel, 
    formatBreakChanceLabel, 
    formatEquippedItemInfo,
    formatBreakNotification
} from '../js/combat/itemUIHelpers.js';

describe('Item UI Helpers - PR12B', () => {
    describe('formatItemBonusLabel', () => {
        it('should format item with ATK bonus', () => {
            const item = {
                name: 'Amuleto de Força',
                stats: { atk: 2, def: 0 }
            };
            expect(formatItemBonusLabel(item)).toBe('Amuleto de Força (+2 ATK)');
        });
        
        it('should format item with DEF bonus', () => {
            const item = {
                name: 'Escudo Leve',
                stats: { atk: 0, def: 2 }
            };
            expect(formatItemBonusLabel(item)).toBe('Escudo Leve (+2 DEF)');
        });
        
        it('should format item with both bonuses', () => {
            const item = {
                name: 'Cristal Equilibrado',
                stats: { atk: 2, def: 2 }
            };
            expect(formatItemBonusLabel(item)).toBe('Cristal Equilibrado (+2 ATK, +2 DEF)');
        });
        
        it('should handle null item', () => {
            expect(formatItemBonusLabel(null)).toBe('');
        });
    });
    
    describe('formatBreakChanceLabel', () => {
        it('should format break chance for breakable item', () => {
            const item = {
                break: { enabled: true, chance: 0.15 }
            };
            expect(formatBreakChanceLabel(item)).toBe('Quebra: 15%');
        });
        
        it('should return empty string for unbreakable item', () => {
            const item = {
                break: { enabled: false, chance: 0 }
            };
            expect(formatBreakChanceLabel(item)).toBe('');
        });
        
        it('should handle null item', () => {
            expect(formatBreakChanceLabel(null)).toBe('');
        });
    });
    
    describe('formatBreakNotification', () => {
        it('should format break notification message', () => {
            expect(formatBreakNotification('Amuleto de Força')).toBe('💥 Amuleto de Força quebrou!');
        });
    });
});
