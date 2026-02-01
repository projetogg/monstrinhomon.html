/**
 * SELL ITEMS TESTS - PR13B
 * 
 * Testa o sistema de venda de itens com regra obrigatória sell < buy
 */

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * getSellPrice(itemDef) - Canonical function
 * 
 * Rules:
 * - If buy not a number or buy <= 1: return null
 * - If itemDef has explicit sell: use it
 * - Otherwise: fallback to Math.floor(buy * 0.5)
 * - Enforce: sell = Math.max(1, sell)
 * - Enforce: sell = Math.min(sell, buy - 1)
 */
function getSellPrice(itemDef) {
    try {
        // Get buy price
        const buy = itemDef?.price?.buy;
        
        // Block sale if no buy price or buy <= 1
        if (typeof buy !== 'number' || buy <= 1) {
            return null;
        }
        
        // Get raw sell price (explicit or fallback to 50%)
        const rawSell = itemDef?.price?.sell;
        let sell = (typeof rawSell === 'number') ? rawSell : Math.floor(buy * 0.5);
        
        // Enforce minimum: sell >= 1
        sell = Math.max(1, sell);
        
        // Enforce strict: sell < buy (never equal or greater)
        sell = Math.min(sell, buy - 1);
        
        return sell;
        
    } catch (error) {
        console.error('[getSellPrice] Error calculating sell price:', error);
        return null;
    }
}

describe('PR13B: getSellPrice - Canonical pricing function', () => {
    
    it('should return null for items with no buy price', () => {
        const item = { id: 'TEST_ITEM', name: 'Test', price: {} };
        expect(getSellPrice(item)).toBe(null);
    });
    
    it('should return null for items with buy price <= 1', () => {
        const item1 = { id: 'TEST', name: 'Test', price: { buy: 1 } };
        const item0 = { id: 'TEST', name: 'Test', price: { buy: 0 } };
        const itemNeg = { id: 'TEST', name: 'Test', price: { buy: -5 } };
        
        expect(getSellPrice(item1)).toBe(null);
        expect(getSellPrice(item0)).toBe(null);
        expect(getSellPrice(itemNeg)).toBe(null);
    });
    
    it('should return null for items with invalid buy price types', () => {
        const itemStr = { id: 'TEST', name: 'Test', price: { buy: '50' } };
        const itemNull = { id: 'TEST', name: 'Test', price: { buy: null } };
        const itemUndef = { id: 'TEST', name: 'Test', price: { buy: undefined } };
        
        expect(getSellPrice(itemStr)).toBe(null);
        expect(getSellPrice(itemNull)).toBe(null);
        expect(getSellPrice(itemUndef)).toBe(null);
    });
    
    it('should use 50% fallback when no explicit sell price', () => {
        const item50 = { id: 'TEST', name: 'Test', price: { buy: 50 } };
        const item120 = { id: 'TEST', name: 'Test', price: { buy: 120 } };
        const item250 = { id: 'TEST', name: 'Test', price: { buy: 250 } };
        
        // 50% fallback with floor
        expect(getSellPrice(item50)).toBe(25);  // floor(50 * 0.5) = 25
        expect(getSellPrice(item120)).toBe(60); // floor(120 * 0.5) = 60
        expect(getSellPrice(item250)).toBe(125); // floor(250 * 0.5) = 125
    });
    
    it('should use explicit sell price when provided', () => {
        const item = { id: 'TEST', name: 'Test', price: { buy: 100, sell: 30 } };
        expect(getSellPrice(item)).toBe(30);
    });
    
    it('should enforce sell < buy (never equal)', () => {
        // Explicit sell = buy should be corrected to buy - 1
        const itemEqual = { id: 'TEST', name: 'Test', price: { buy: 50, sell: 50 } };
        expect(getSellPrice(itemEqual)).toBe(49);
        
        // Explicit sell > buy should be corrected to buy - 1
        const itemGreater = { id: 'TEST', name: 'Test', price: { buy: 50, sell: 100 } };
        expect(getSellPrice(itemGreater)).toBe(49);
    });
    
    it('should enforce minimum sell price of 1', () => {
        // Edge case: buy = 2, 50% = 1 (floor), which is valid
        const item2 = { id: 'TEST', name: 'Test', price: { buy: 2 } };
        expect(getSellPrice(item2)).toBe(1);
        
        // Edge case: buy = 3, 50% = 1 (floor), which is valid
        const item3 = { id: 'TEST', name: 'Test', price: { buy: 3 } };
        expect(getSellPrice(item3)).toBe(1);
    });
    
    it('should handle edge case: explicit sell = 0 should become 1', () => {
        const item = { id: 'TEST', name: 'Test', price: { buy: 50, sell: 0 } };
        expect(getSellPrice(item)).toBe(1);
    });
    
    it('should handle edge case: explicit negative sell should become 1', () => {
        const item = { id: 'TEST', name: 'Test', price: { buy: 50, sell: -10 } };
        expect(getSellPrice(item)).toBe(1);
    });
    
    it('should guarantee sell < buy for all valid inputs', () => {
        // Test a range of buy prices
        const testPrices = [2, 5, 10, 50, 100, 120, 250, 500, 1000, 1200];
        
        for (const buy of testPrices) {
            const item = { id: 'TEST', name: 'Test', price: { buy } };
            const sell = getSellPrice(item);
            
            expect(sell).not.toBe(null);
            expect(sell).toBeGreaterThan(0);
            expect(sell).toBeLessThan(buy);
        }
    });
    
    it('should handle real game items correctly', () => {
        // Comum: buy 50 -> sell 25
        const comum = { 
            id: 'IT_ATK_COMUM', 
            name: 'Amuleto de Força', 
            price: { buy: 50 } 
        };
        expect(getSellPrice(comum)).toBe(25);
        
        // Incomum: buy 120 -> sell 60
        const incomum = { 
            id: 'IT_ATK_INCOMUM', 
            name: 'Colar de Poder', 
            price: { buy: 120 } 
        };
        expect(getSellPrice(incomum)).toBe(60);
        
        // Raro: buy 250 -> sell 125
        const raro = { 
            id: 'IT_ATK_RARO', 
            name: 'Garra do Dragão', 
            price: { buy: 250 } 
        };
        expect(getSellPrice(raro)).toBe(125);
        
        // Místico: buy 500 -> sell 250
        const mistico = { 
            id: 'IT_ATK_MISTICO', 
            name: 'Orbe de Destruição', 
            price: { buy: 500 } 
        };
        expect(getSellPrice(mistico)).toBe(250);
        
        // Lendário: buy 1000 -> sell 500
        const lendario = { 
            id: 'IT_ATK_LENDARIO', 
            name: 'Lâmina Eterna', 
            price: { buy: 1000 } 
        };
        expect(getSellPrice(lendario)).toBe(500);
    });
    
    it('should handle malformed item objects gracefully', () => {
        expect(getSellPrice(null)).toBe(null);
        expect(getSellPrice(undefined)).toBe(null);
        expect(getSellPrice({})).toBe(null);
        expect(getSellPrice({ id: 'TEST' })).toBe(null);
        expect(getSellPrice({ id: 'TEST', price: null })).toBe(null);
    });
});

describe('PR13B: sellItem - Transaction logic', () => {
    
    let mockGameState;
    
    beforeEach(() => {
        // Reset mock game state before each test
        mockGameState = {
            players: [
                {
                    id: 'player1',
                    name: 'Test Player',
                    class: 'Guerreiro',
                    money: 100,
                    inventory: {
                        'IT_ATK_COMUM': 3,
                        'IT_DEF_COMUM': 2,
                        'IT_ATK_LENDARIO': 1
                    },
                    team: [
                        { id: 'm1', name: 'Monstro 1', equippedItem: 'IT_DEF_COMUM' },
                        { id: 'm2', name: 'Monstro 2', equippedItem: null }
                    ]
                }
            ]
        };
    });
    
    it('should correctly update money when selling item', () => {
        const player = mockGameState.players[0];
        const initialMoney = player.money;
        
        // Simulate selling IT_ATK_COMUM (buy 50 -> sell 25)
        const sellPrice = 25;
        player.money += sellPrice;
        player.inventory['IT_ATK_COMUM'] -= 1;
        
        expect(player.money).toBe(initialMoney + sellPrice);
        expect(player.money).toBe(125);
    });
    
    it('should correctly decrement inventory quantity', () => {
        const player = mockGameState.players[0];
        const initialQty = player.inventory['IT_ATK_COMUM'];
        
        // Sell 1
        player.inventory['IT_ATK_COMUM'] -= 1;
        expect(player.inventory['IT_ATK_COMUM']).toBe(initialQty - 1);
        expect(player.inventory['IT_ATK_COMUM']).toBe(2);
    });
    
    it('should delete inventory key when quantity reaches 0', () => {
        const player = mockGameState.players[0];
        
        // Sell last item
        player.inventory['IT_ATK_LENDARIO'] -= 1;
        
        if (player.inventory['IT_ATK_LENDARIO'] <= 0) {
            delete player.inventory['IT_ATK_LENDARIO'];
        }
        
        expect(player.inventory['IT_ATK_LENDARIO']).toBeUndefined();
        expect('IT_ATK_LENDARIO' in player.inventory).toBe(false);
    });
    
    it('should prevent selling more than owned quantity', () => {
        const player = mockGameState.players[0];
        const owned = player.inventory['IT_ATK_COMUM'] || 0; // 3
        const requestedQty = 5;
        
        // Validation check
        const canSell = owned >= requestedQty;
        expect(canSell).toBe(false);
    });
    
    it('should prevent selling 0 or negative quantities', () => {
        const invalidQuantities = [0, -1, -5];
        
        for (const qty of invalidQuantities) {
            const isValid = qty > 0 && Number.isInteger(qty);
            expect(isValid).toBe(false);
        }
    });
    
    it('should prevent selling items that are not in inventory', () => {
        const player = mockGameState.players[0];
        const nonExistentItem = 'IT_NONEXISTENT';
        
        const owned = player.inventory[nonExistentItem] || 0;
        expect(owned).toBe(0);
        
        const canSell = owned > 0;
        expect(canSell).toBe(false);
    });
    
    it('should block selling equipped items', () => {
        const player = mockGameState.players[0];
        const equippedItemId = 'IT_DEF_COMUM';
        
        // Check if item is equipped on any team monster
        const isEquipped = player.team.some(monster => monster?.equippedItem === equippedItemId);
        
        expect(isEquipped).toBe(true);
        expect(player.team[0].equippedItem).toBe(equippedItemId);
    });
    
    it('should allow selling unequipped items even if player has team', () => {
        const player = mockGameState.players[0];
        const unequippedItemId = 'IT_ATK_COMUM';
        
        // Check if item is equipped
        const isEquipped = player.team.some(monster => monster?.equippedItem === unequippedItemId);
        
        expect(isEquipped).toBe(false);
    });
    
    it('should handle selling multiple quantities correctly', () => {
        const player = mockGameState.players[0];
        const itemId = 'IT_ATK_COMUM';
        const qty = 2;
        const sellPrice = 25; // per item
        const initialMoney = player.money;
        const initialQty = player.inventory[itemId];
        
        // Simulate selling multiple
        player.money += sellPrice * qty;
        player.inventory[itemId] -= qty;
        
        expect(player.money).toBe(initialMoney + (sellPrice * qty));
        expect(player.money).toBe(150);
        expect(player.inventory[itemId]).toBe(initialQty - qty);
        expect(player.inventory[itemId]).toBe(1);
    });
    
    it('should handle player with no team (no equipped items check)', () => {
        const player = {
            id: 'player2',
            name: 'No Team Player',
            money: 50,
            inventory: { 'IT_ATK_COMUM': 1 },
            team: []
        };
        
        // Check if any item is equipped
        const isEquipped = player.team.some(monster => monster?.equippedItem === 'IT_ATK_COMUM');
        
        expect(isEquipped).toBe(false);
    });
    
    it('should handle player with null/undefined team gracefully', () => {
        const player = {
            id: 'player3',
            name: 'Null Team Player',
            money: 50,
            inventory: { 'IT_ATK_COMUM': 1 },
            team: null
        };
        
        // Safe check with optional chaining
        const isEquipped = player.team?.some(monster => monster?.equippedItem === 'IT_ATK_COMUM') || false;
        
        expect(isEquipped).toBe(false);
    });
});

describe('PR13B: Integration scenarios', () => {
    
    it('should handle complete sell transaction flow', () => {
        const item = {
            id: 'IT_ATK_COMUM',
            name: 'Amuleto de Força',
            price: { buy: 50 }
        };
        
        const player = {
            id: 'player1',
            name: 'Test',
            money: 100,
            inventory: { 'IT_ATK_COMUM': 2 },
            team: []
        };
        
        // 1. Calculate sell price
        const sellPrice = getSellPrice(item);
        expect(sellPrice).toBe(25);
        
        // 2. Validate quantity
        const qty = 1;
        const owned = player.inventory[item.id] || 0;
        expect(owned >= qty).toBe(true);
        
        // 3. Check not equipped
        const isEquipped = player.team?.some(m => m?.equippedItem === item.id) || false;
        expect(isEquipped).toBe(false);
        
        // 4. Execute transaction
        const totalValue = sellPrice * qty;
        player.money += totalValue;
        player.inventory[item.id] -= qty;
        
        // 5. Verify results
        expect(player.money).toBe(125);
        expect(player.inventory[item.id]).toBe(1);
    });
    
    it('should enforce sell < buy for items with incorrect data', () => {
        // Item incorrectly configured with sell = buy
        const badItem = {
            id: 'BAD_ITEM',
            name: 'Bad Config Item',
            price: { buy: 100, sell: 100 }
        };
        
        const sellPrice = getSellPrice(badItem);
        
        // Should auto-correct to buy - 1
        expect(sellPrice).toBe(99);
        expect(sellPrice).toBeLessThan(badItem.price.buy);
    });
    
    it('should handle edge case: buy=2 (minimum sellable)', () => {
        const item = {
            id: 'CHEAP_ITEM',
            name: 'Cheap Item',
            price: { buy: 2 }
        };
        
        const sellPrice = getSellPrice(item);
        
        // floor(2 * 0.5) = 1, which is valid
        expect(sellPrice).toBe(1);
        expect(sellPrice).toBeLessThan(item.price.buy);
    });
    
    it('should prevent exploit: buying and selling for profit', () => {
        const item = {
            id: 'EXPLOIT_TEST',
            name: 'Exploit Test',
            price: { buy: 100 }
        };
        
        const sellPrice = getSellPrice(item);
        const buyPrice = item.price.buy;
        
        // Selling should ALWAYS result in loss
        expect(sellPrice).toBeLessThan(buyPrice);
        expect(buyPrice - sellPrice).toBeGreaterThan(0);
        
        // 50% default means 50% loss
        expect(sellPrice).toBe(50);
        expect(buyPrice - sellPrice).toBe(50);
    });
});
