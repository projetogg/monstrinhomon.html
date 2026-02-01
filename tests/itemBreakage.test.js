/**
 * ITEM BREAKAGE TESTS - PR11B
 * 
 * Testa o sistema anti-frustração de quebra de itens
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock do itemsLoader
const mockItems = {
    'IT_ATK_COMUM': {
        id: 'IT_ATK_COMUM',
        name: 'Amuleto de Força',
        type: 'held',
        tier: 'comum',
        stats: { atk: 2, def: 0 },
        break: { enabled: true, chance: 0.15 }
    },
    'IT_ATK_LENDARIO': {
        id: 'IT_ATK_LENDARIO',
        name: 'Lâmina Eterna',
        type: 'held',
        tier: 'lendario',
        stats: { atk: 12, def: 0 },
        break: { enabled: false, chance: 0 }
    },
    'IT_DEF_RARO': {
        id: 'IT_DEF_RARO',
        name: 'Couraça de Titã',
        type: 'held',
        tier: 'raro',
        stats: { atk: 0, def: 6 },
        break: { enabled: true, chance: 0.05 }
    }
};

// Mock itemsLoader module
vi.mock('../js/data/itemsLoader.js', () => ({
    getItemById: (id) => mockItems[id] || null
}));

import {
    initializeBattleParticipation,
    markAsParticipated,
    hasParticipated,
    handleHeldItemBreak,
    processBattleItemBreakage,
    getHeldItemBonuses
} from '../js/combat/itemBreakage.js';

describe('Item Breakage - Participation Tracking', () => {
    it('deve inicializar participatedThisBattle = false', () => {
        const monsters = [
            { name: 'Luma', hp: 50 },
            { name: 'Trok', hp: 40 }
        ];

        initializeBattleParticipation(monsters);

        expect(monsters[0].participatedThisBattle).toBe(false);
        expect(monsters[1].participatedThisBattle).toBe(false);
    });

    it('deve marcar monstro como participante', () => {
        const monster = { name: 'Luma', hp: 50, participatedThisBattle: false };

        markAsParticipated(monster);

        expect(monster.participatedThisBattle).toBe(true);
    });

    it('hasParticipated deve retornar true se participou', () => {
        const monster = { name: 'Luma', participatedThisBattle: true };
        expect(hasParticipated(monster)).toBe(true);
    });

    it('hasParticipated deve retornar false se não participou', () => {
        const monster = { name: 'Luma', participatedThisBattle: false };
        expect(hasParticipated(monster)).toBe(false);
    });

    it('hasParticipated deve retornar false se flag não existe', () => {
        const monster = { name: 'Luma' };
        expect(hasParticipated(monster)).toBe(false);
    });
});

describe('Item Breakage - handleHeldItemBreak', () => {
    it('NÃO deve quebrar se monstro não participou', () => {
        const monster = {
            name: 'Luma',
            heldItemId: 'IT_ATK_COMUM',
            participatedThisBattle: false
        };

        const result = handleHeldItemBreak(monster);

        expect(result.broke).toBe(false);
        expect(monster.heldItemId).toBe('IT_ATK_COMUM'); // Item ainda equipado
    });

    it('NÃO deve quebrar se não tem item equipado', () => {
        const monster = {
            name: 'Luma',
            heldItemId: null,
            participatedThisBattle: true
        };

        const result = handleHeldItemBreak(monster);

        expect(result.broke).toBe(false);
    });

    it('NÃO deve quebrar item lendário mesmo se participou', () => {
        const monster = {
            name: 'Luma',
            heldItemId: 'IT_ATK_LENDARIO',
            participatedThisBattle: true
        };

        const result = handleHeldItemBreak(monster);

        expect(result.broke).toBe(false);
        expect(monster.heldItemId).toBe('IT_ATK_LENDARIO');
    });

    it('DEVE quebrar item comum se participou e roll < chance', () => {
        // Mock Math.random para garantir quebra (0.1 < 0.15)
        const originalRandom = Math.random;
        Math.random = () => 0.1;

        const monster = {
            name: 'Luma',
            heldItemId: 'IT_ATK_COMUM',
            participatedThisBattle: true
        };

        const logs = [];
        const result = handleHeldItemBreak(monster, {
            log: (msg) => logs.push(msg)
        });

        expect(result.broke).toBe(true);
        expect(result.itemName).toBe('Amuleto de Força');
        expect(monster.heldItemId).toBe(null); // Item removido
        expect(logs.length).toBe(1);
        expect(logs[0]).toContain('quebrou');

        Math.random = originalRandom;
    });

    it('NÃO deve quebrar se roll >= chance', () => {
        // Mock Math.random para não quebrar (0.2 >= 0.15)
        const originalRandom = Math.random;
        Math.random = () => 0.2;

        const monster = {
            name: 'Luma',
            heldItemId: 'IT_ATK_COMUM',
            participatedThisBattle: true
        };

        const result = handleHeldItemBreak(monster);

        expect(result.broke).toBe(false);
        expect(monster.heldItemId).toBe('IT_ATK_COMUM');

        Math.random = originalRandom;
    });
});

describe('Item Breakage - processBattleItemBreakage', () => {
    it('deve processar múltiplos monstros', () => {
        const originalRandom = Math.random;
        Math.random = () => 0.01; // Garante quebra

        const monsters = [
            {
                name: 'Luma',
                heldItemId: 'IT_ATK_COMUM',
                participatedThisBattle: true
            },
            {
                name: 'Trok',
                heldItemId: 'IT_DEF_RARO',
                participatedThisBattle: true
            },
            {
                name: 'Kryss',
                heldItemId: 'IT_ATK_COMUM',
                participatedThisBattle: false // Não participou
            }
        ];

        const results = processBattleItemBreakage(monsters);

        expect(results.length).toBe(2); // Apenas os 2 primeiros
        expect(monsters[0].heldItemId).toBe(null); // Quebrou
        expect(monsters[1].heldItemId).toBe(null); // Quebrou
        expect(monsters[2].heldItemId).toBe('IT_ATK_COMUM'); // Não quebrou (não participou)

        Math.random = originalRandom;
    });

    it('deve retornar array vazio se nenhum item quebrar', () => {
        const monsters = [
            {
                name: 'Luma',
                heldItemId: 'IT_ATK_LENDARIO', // Lendário não quebra
                participatedThisBattle: true
            }
        ];

        const results = processBattleItemBreakage(monsters);

        expect(results.length).toBe(0);
    });
});

describe('Item Breakage - getHeldItemBonuses', () => {
    it('deve retornar bônus corretos do item equipado', () => {
        const monster = { heldItemId: 'IT_ATK_COMUM' };
        const bonuses = getHeldItemBonuses(monster);

        expect(bonuses.atk).toBe(2);
        expect(bonuses.def).toBe(0);
    });

    it('deve retornar zeros se não tem item equipado', () => {
        const monster = { heldItemId: null };
        const bonuses = getHeldItemBonuses(monster);

        expect(bonuses.atk).toBe(0);
        expect(bonuses.def).toBe(0);
    });

    it('deve retornar zeros se item não existe', () => {
        const monster = { heldItemId: 'ITEM_INVALIDO' };
        const bonuses = getHeldItemBonuses(monster);

        expect(bonuses.atk).toBe(0);
        expect(bonuses.def).toBe(0);
    });

    it('deve retornar bônus de item balanceado', () => {
        // Add balanced item to mock
        mockItems['IT_BALANCED'] = {
            id: 'IT_BALANCED',
            name: 'Cristal Equilibrado',
            stats: { atk: 3, def: 3 },
            break: { enabled: true, chance: 0.10 }
        };

        const monster = { heldItemId: 'IT_BALANCED' };
        const bonuses = getHeldItemBonuses(monster);

        expect(bonuses.atk).toBe(3);
        expect(bonuses.def).toBe(3);
    });
});

describe('Item Breakage - Edge Cases', () => {
    it('deve lidar com monster null gracefully', () => {
        expect(() => initializeBattleParticipation(null)).not.toThrow();
        expect(() => markAsParticipated(null)).not.toThrow();
        expect(hasParticipated(null)).toBe(false);
        expect(handleHeldItemBreak(null).broke).toBe(false);
    });

    it('deve lidar com array vazio', () => {
        const results = processBattleItemBreakage([]);
        expect(results).toEqual([]);
    });

    it('deve lidar com monsters sem objeto', () => {
        const monsters = [null, undefined, 'string'];
        expect(() => initializeBattleParticipation(monsters)).not.toThrow();
        const results = processBattleItemBreakage(monsters);
        expect(results).toEqual([]);
    });
});
