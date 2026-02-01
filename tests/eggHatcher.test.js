/**
 * EGG HATCHER TESTS (PR14A)
 * 
 * Testa o sistema de choque de ovos baseado em raridade
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chooseRandom, getMonstersByRarity, hatchEgg, isValidEgg, getEggInfo } from '../js/data/eggHatcher.js';
import { getMonstersMapSync } from '../js/data/dataLoader.js';
import { getItemById } from '../js/data/itemsLoader.js';

// Mock dos módulos de dados
vi.mock('../js/data/dataLoader.js', () => ({
    getMonstersMapSync: vi.fn()
}));

vi.mock('../js/data/itemsLoader.js', () => ({
    getItemById: vi.fn()
}));

describe('PR14A: chooseRandom - Pure random selection function', () => {
    
    it('should return null for empty array', () => {
        expect(chooseRandom([])).toBe(null);
    });
    
    it('should return null for non-array input', () => {
        expect(chooseRandom(null)).toBe(null);
        expect(chooseRandom(undefined)).toBe(null);
        expect(chooseRandom('not an array')).toBe(null);
    });
    
    it('should return the only element for single-element array', () => {
        const list = ['only one'];
        expect(chooseRandom(list)).toBe('only one');
    });
    
    it('should use custom rng function', () => {
        const list = ['a', 'b', 'c'];
        
        // Mock rng to always return 0 (first element)
        const rng1 = () => 0;
        expect(chooseRandom(list, rng1)).toBe('a');
        
        // Mock rng to return 0.5 (middle element)
        const rng2 = () => 0.5;
        expect(chooseRandom(list, rng2)).toBe('b');
        
        // Mock rng to return 0.99 (last element)
        const rng3 = () => 0.99;
        expect(chooseRandom(list, rng3)).toBe('c');
    });
    
    it('should handle arrays of objects', () => {
        const list = [
            { id: 'MON_001', name: 'Monster A' },
            { id: 'MON_002', name: 'Monster B' }
        ];
        
        const rng = () => 0;
        const result = chooseRandom(list, rng);
        
        expect(result).toEqual({ id: 'MON_001', name: 'Monster A' });
    });
});

describe('PR14A: getMonstersByRarity - Filter monsters by rarity', () => {
    
    beforeEach(() => {
        // Reset mocks antes de cada teste
        vi.clearAllMocks();
    });
    
    it('should return empty array if cache not loaded', () => {
        getMonstersMapSync.mockReturnValue(null);
        
        const result = getMonstersByRarity('Comum');
        expect(result).toEqual([]);
    });
    
    it('should return empty array if cache is empty', () => {
        getMonstersMapSync.mockReturnValue(new Map());
        
        const result = getMonstersByRarity('Comum');
        expect(result).toEqual([]);
    });
    
    it('should filter monsters by exact rarity match', () => {
        const mockMap = new Map([
            ['MON_001', { id: 'MON_001', name: 'Comum 1', rarity: 'Comum' }],
            ['MON_002', { id: 'MON_002', name: 'Incomum 1', rarity: 'Incomum' }],
            ['MON_003', { id: 'MON_003', name: 'Comum 2', rarity: 'Comum' }],
            ['MON_004', { id: 'MON_004', name: 'Raro 1', rarity: 'Raro' }]
        ]);
        
        getMonstersMapSync.mockReturnValue(mockMap);
        
        const comum = getMonstersByRarity('Comum');
        expect(comum).toHaveLength(2);
        expect(comum[0].name).toBe('Comum 1');
        expect(comum[1].name).toBe('Comum 2');
        
        const incomum = getMonstersByRarity('Incomum');
        expect(incomum).toHaveLength(1);
        expect(incomum[0].name).toBe('Incomum 1');
        
        const raro = getMonstersByRarity('Raro');
        expect(raro).toHaveLength(1);
        expect(raro[0].name).toBe('Raro 1');
    });
    
    it('should return empty array for rarity with no monsters', () => {
        const mockMap = new Map([
            ['MON_001', { id: 'MON_001', name: 'Comum 1', rarity: 'Comum' }]
        ]);
        
        getMonstersMapSync.mockReturnValue(mockMap);
        
        const lendario = getMonstersByRarity('Lendário');
        expect(lendario).toEqual([]);
    });
    
    it('should be case-sensitive for rarity matching', () => {
        const mockMap = new Map([
            ['MON_001', { id: 'MON_001', name: 'Test', rarity: 'Comum' }]
        ]);
        
        getMonstersMapSync.mockReturnValue(mockMap);
        
        // Exact match should work
        expect(getMonstersByRarity('Comum')).toHaveLength(1);
        
        // Different case should not match
        expect(getMonstersByRarity('comum')).toHaveLength(0);
        expect(getMonstersByRarity('COMUM')).toHaveLength(0);
    });
});

describe('PR14A: hatchEgg - Main hatching logic', () => {
    
    let mockState;
    
    beforeEach(() => {
        vi.clearAllMocks();
        
        // Estado mock básico
        mockState = {
            players: [
                {
                    id: 'player1',
                    name: 'Test Player',
                    class: 'Guerreiro',
                    team: [],
                    box: [],
                    inventory: {
                        'EGG_C': 3
                    }
                }
            ]
        };
        
        // Mock de item de ovo comum
        getItemById.mockImplementation((id) => {
            if (id === 'EGG_C') {
                return {
                    id: 'EGG_C',
                    name: 'Ovo Comum',
                    category: 'egg',
                    effects: [
                        {
                            type: 'hatch_egg',
                            mode: 'by_rarity',
                            rarity: 'Comum'
                        }
                    ]
                };
            }
            return null;
        });
        
        // Mock de monstros comuns
        const mockMap = new Map([
            ['MON_001', {
                id: 'MON_001',
                name: 'Monster A',
                class: 'Guerreiro',
                rarity: 'Comum',
                baseHp: 30,
                baseAtk: 5,
                baseDef: 3,
                baseSpd: 5,
                baseEne: 6,
                emoji: '⚔️'
            }],
            ['MON_002', {
                id: 'MON_002',
                name: 'Monster B',
                class: 'Mago',
                rarity: 'Comum',
                baseHp: 28,
                baseAtk: 6,
                baseDef: 2,
                baseSpd: 6,
                baseEne: 8,
                emoji: '🔮'
            }]
        ]);
        
        getMonstersMapSync.mockReturnValue(mockMap);
    });
    
    it('should successfully hatch egg and add monster to team', () => {
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(true);
        expect(result.message).toContain('Nasceu:');
        expect(result.monster).toBeDefined();
        expect(result.monster.rarity).toBe('Comum');
        expect(result.monster.level).toBe(1);
        expect(result.monster.xp).toBe(0);
        
        // Verificar que foi adicionado ao time
        const player = mockState.players[0];
        expect(player.team).toHaveLength(1);
        expect(player.team[0]).toBe(result.monster);
        
        // Verificar que ovo foi decrementado
        expect(player.inventory['EGG_C']).toBe(2);
    });
    
    it('should remove egg from inventory when quantity reaches 0', () => {
        mockState.players[0].inventory['EGG_C'] = 1;
        
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(true);
        expect(mockState.players[0].inventory['EGG_C']).toBeUndefined();
    });
    
    it('should fail if player has no eggs', () => {
        mockState.players[0].inventory = {};
        
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('não tem');
    });
    
    it('should fail if player not found', () => {
        const result = hatchEgg(mockState, 'nonexistent', 'EGG_C');
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('não encontrado');
    });
    
    it('should fail if item is not an egg', () => {
        getItemById.mockReturnValue({
            id: 'NOT_EGG',
            name: 'Not an egg',
            category: 'other'
        });
        
        mockState.players[0].inventory['NOT_EGG'] = 1;
        
        const result = hatchEgg(mockState, 'player1', 'NOT_EGG');
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('não é um ovo');
    });
    
    it('should fail if no monsters of that rarity exist', () => {
        getMonstersMapSync.mockReturnValue(new Map());
        
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('disponível ainda');
        
        // Verificar que ovo NÃO foi consumido
        expect(mockState.players[0].inventory['EGG_C']).toBe(3);
    });
    
    it('should add to box when team is full (6 monsters)', () => {
        // Encher o time
        for (let i = 0; i < 6; i++) {
            mockState.players[0].team.push({
                id: `mon_${i}`,
                name: `Monster ${i}`,
                level: 5
            });
        }
        
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(true);
        expect(result.message).toContain('box');
        
        // Time continua com 6
        expect(mockState.players[0].team).toHaveLength(6);
        
        // Box tem 1 novo
        expect(mockState.players[0].box).toHaveLength(1);
    });
    
    it('should fail when total monsters exceeds limit', () => {
        // Criar 100 monstros (limite)
        for (let i = 0; i < 6; i++) {
            mockState.players[0].team.push({ id: `t${i}`, name: `T${i}` });
        }
        for (let i = 0; i < 94; i++) {
            mockState.players[0].box.push({ id: `b${i}`, name: `B${i}` });
        }
        
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(false);
        expect(result.message).toContain('limite máximo');
        
        // Ovo não foi consumido
        expect(mockState.players[0].inventory['EGG_C']).toBe(3);
    });
    
    it('should create monster with correct initial stats', () => {
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(true);
        
        const monster = result.monster;
        expect(monster.id).toMatch(/^mi_/);
        expect(monster.monsterId).toBeDefined();
        expect(monster.level).toBe(1);
        expect(monster.xp).toBe(0);
        expect(monster.hp).toBeGreaterThan(0);
        expect(monster.hpMax).toBeGreaterThan(0);
        expect(monster.hp).toBe(monster.hpMax);
        expect(monster.heldItemId).toBe(null);
        expect(monster.buffs).toEqual([]);
    });
    
    it('should handle missing player structures gracefully', () => {
        // Player sem inventory/team/box
        mockState.players[0] = {
            id: 'player1',
            name: 'Test'
            // Missing: inventory, team, box
        };
        
        // Adicionar inventory com ovo
        mockState.players[0].inventory = { 'EGG_C': 1 };
        
        const result = hatchEgg(mockState, 'player1', 'EGG_C');
        
        expect(result.success).toBe(true);
        
        // Verificar que estruturas foram criadas
        expect(Array.isArray(mockState.players[0].team)).toBe(true);
        expect(Array.isArray(mockState.players[0].box)).toBe(true);
    });
});

describe('PR14A: isValidEgg - Egg validation', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should return true for valid egg', () => {
        getItemById.mockReturnValue({
            id: 'EGG_C',
            category: 'egg',
            effects: [
                { type: 'hatch_egg', rarity: 'Comum' }
            ]
        });
        
        expect(isValidEgg('EGG_C')).toBe(true);
    });
    
    it('should return false if item not found', () => {
        getItemById.mockReturnValue(null);
        
        expect(isValidEgg('UNKNOWN')).toBe(false);
    });
    
    it('should return false if not egg category', () => {
        getItemById.mockReturnValue({
            id: 'OTHER',
            category: 'held'
        });
        
        expect(isValidEgg('OTHER')).toBe(false);
    });
    
    it('should return false if missing hatch effect', () => {
        getItemById.mockReturnValue({
            id: 'BAD_EGG',
            category: 'egg',
            effects: []
        });
        
        expect(isValidEgg('BAD_EGG')).toBe(false);
    });
});

describe('PR14A: getEggInfo - Get egg metadata', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should return egg info for valid egg', () => {
        getItemById.mockReturnValue({
            id: 'EGG_C',
            name: 'Ovo Comum',
            category: 'egg',
            description: 'Choca 1 Monstrinhomon Comum.',
            price: { buy: 120, sell: 59 },
            effects: [
                { type: 'hatch_egg', rarity: 'Comum' }
            ]
        });
        
        const info = getEggInfo('EGG_C');
        
        expect(info).toEqual({
            id: 'EGG_C',
            name: 'Ovo Comum',
            rarity: 'Comum',
            description: 'Choca 1 Monstrinhomon Comum.',
            price: { buy: 120, sell: 59 }
        });
    });
    
    it('should return null for non-egg', () => {
        getItemById.mockReturnValue({
            id: 'OTHER',
            category: 'held'
        });
        
        expect(getEggInfo('OTHER')).toBe(null);
    });
    
    it('should return null if item not found', () => {
        getItemById.mockReturnValue(null);
        
        expect(getEggInfo('UNKNOWN')).toBe(null);
    });
});

describe('PR14A: Integration - Multiple rarities', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
    });
    
    it('should only hatch monsters of matching rarity', () => {
        // Mock diferentes raridades de ovos
        getItemById.mockImplementation((id) => {
            const eggs = {
                'EGG_C': { category: 'egg', effects: [{ type: 'hatch_egg', rarity: 'Comum' }] },
                'EGG_U': { category: 'egg', effects: [{ type: 'hatch_egg', rarity: 'Incomum' }] },
                'EGG_R': { category: 'egg', effects: [{ type: 'hatch_egg', rarity: 'Raro' }] }
            };
            return eggs[id] || null;
        });
        
        // Mock monstros de diferentes raridades
        const mockMap = new Map([
            ['MON_C1', { id: 'MON_C1', name: 'Common A', rarity: 'Comum', baseHp: 30 }],
            ['MON_C2', { id: 'MON_C2', name: 'Common B', rarity: 'Comum', baseHp: 32 }],
            ['MON_U1', { id: 'MON_U1', name: 'Uncommon A', rarity: 'Incomum', baseHp: 35 }],
            ['MON_R1', { id: 'MON_R1', name: 'Rare A', rarity: 'Raro', baseHp: 40 }]
        ]);
        
        getMonstersMapSync.mockReturnValue(mockMap);
        
        const state = {
            players: [{
                id: 'p1',
                team: [],
                box: [],
                inventory: { 'EGG_C': 1, 'EGG_U': 1, 'EGG_R': 1 }
            }]
        };
        
        // Chocar ovo comum
        const r1 = hatchEgg(state, 'p1', 'EGG_C');
        expect(r1.success).toBe(true);
        expect(r1.monster.rarity).toBe('Comum');
        
        // Chocar ovo incomum
        const r2 = hatchEgg(state, 'p1', 'EGG_U');
        expect(r2.success).toBe(true);
        expect(r2.monster.rarity).toBe('Incomum');
        
        // Chocar ovo raro
        const r3 = hatchEgg(state, 'p1', 'EGG_R');
        expect(r3.success).toBe(true);
        expect(r3.monster.rarity).toBe('Raro');
        
        // Verificar que tem 3 monstros no time
        expect(state.players[0].team).toHaveLength(3);
        
        // Verificar que cada um tem a raridade correta
        expect(state.players[0].team[0].rarity).toBe('Comum');
        expect(state.players[0].team[1].rarity).toBe('Incomum');
        expect(state.players[0].team[2].rarity).toBe('Raro');
    });
});
