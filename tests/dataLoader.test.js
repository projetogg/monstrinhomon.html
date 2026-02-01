/**
 * DATA LOADER TESTS (PR9A)
 * 
 * Testes para funções puras do dataLoader.js
 * Cobertura: validateMonsterSchema, normalizeMonsterData, comportamento de fallback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    validateMonsterSchema, 
    normalizeMonsterData,
    loadMonsters,
    getCacheStatus,
    clearCache
} from '../js/data/dataLoader.js';

describe('validateMonsterSchema - Validação de Schema', () => {
    
    it('deve retornar true para monster válido completo', () => {
        const monster = {
            id: 'MON_001',
            name: 'Cantapau',
            class: 'Bardo',
            rarity: 'Comum',
            baseHp: 28,
            baseAtk: 6,
            baseDef: 4
        };
        expect(validateMonsterSchema(monster)).toBe(true);
    });
    
    it('deve retornar true para monster válido mínimo (sem stats opcionais)', () => {
        const monster = {
            id: 'MON_TEST',
            name: 'Test Monster',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 20
        };
        expect(validateMonsterSchema(monster)).toBe(true);
    });
    
    it('deve retornar false se falta campo obrigatório (id)', () => {
        const monster = {
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 20
        };
        expect(validateMonsterSchema(monster)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (name)', () => {
        const monster = {
            id: 'MON_001',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 20
        };
        expect(validateMonsterSchema(monster)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (class)', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            rarity: 'Comum',
            baseHp: 20
        };
        expect(validateMonsterSchema(monster)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (rarity)', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            baseHp: 20
        };
        expect(validateMonsterSchema(monster)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (baseHp)', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum'
        };
        expect(validateMonsterSchema(monster)).toBe(false);
    });
    
    it('deve retornar false se baseHp não é número', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: '20'  // string
        };
        expect(validateMonsterSchema(monster)).toBe(false);
    });
    
    it('deve retornar false se baseHp é zero ou negativo', () => {
        const monster1 = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 0
        };
        expect(validateMonsterSchema(monster1)).toBe(false);
        
        const monster2 = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: -5
        };
        expect(validateMonsterSchema(monster2)).toBe(false);
    });
    
    it('deve retornar false se monster é null ou undefined', () => {
        expect(validateMonsterSchema(null)).toBe(false);
        expect(validateMonsterSchema(undefined)).toBe(false);
    });
    
    it('deve retornar false se monster não é objeto', () => {
        expect(validateMonsterSchema('string')).toBe(false);
        expect(validateMonsterSchema(123)).toBe(false);
        expect(validateMonsterSchema([])).toBe(false);
    });
});

describe('normalizeMonsterData - Normalização de Dados', () => {
    
    it('deve preencher stats opcionais com defaults se faltarem', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 20
        };
        
        const normalized = normalizeMonsterData(monster);
        
        expect(normalized.baseAtk).toBe(5);
        expect(normalized.baseDef).toBe(3);
        expect(normalized.baseSpd).toBe(5);
        expect(normalized.baseEne).toBe(6);
        expect(normalized.emoji).toBe('❓');
    });
    
    it('NÃO deve modificar valores existentes', () => {
        const monster = {
            id: 'MON_001',
            name: 'Cantapau',
            class: 'Bardo',
            rarity: 'Comum',
            baseHp: 28,
            baseAtk: 6,
            baseDef: 4,
            baseSpd: 6,
            baseEne: 8,
            emoji: '🎵'
        };
        
        const normalized = normalizeMonsterData(monster);
        
        expect(normalized.baseHp).toBe(28);
        expect(normalized.baseAtk).toBe(6);
        expect(normalized.baseDef).toBe(4);
        expect(normalized.baseSpd).toBe(6);
        expect(normalized.baseEne).toBe(8);
        expect(normalized.emoji).toBe('🎵');
    });
    
    it('deve preservar campos de evolução se existirem', () => {
        const monster = {
            id: 'MON_002',
            name: 'Pedrino',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 32,
            evolvesTo: 'MON_002B',
            evolvesAt: 12
        };
        
        const normalized = normalizeMonsterData(monster);
        
        expect(normalized.evolvesTo).toBe('MON_002B');
        expect(normalized.evolvesAt).toBe(12);
    });
    
    it('NÃO deve adicionar campos de evolução se não existirem', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 20
        };
        
        const normalized = normalizeMonsterData(monster);
        
        expect(normalized.evolvesTo).toBeUndefined();
        expect(normalized.evolvesAt).toBeUndefined();
    });
    
    it('deve converter strings numéricas para números', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: '20',
            baseAtk: '7',
            baseDef: '5'
        };
        
        const normalized = normalizeMonsterData(monster);
        
        expect(typeof normalized.baseHp).toBe('number');
        expect(normalized.baseHp).toBe(20);
        expect(typeof normalized.baseAtk).toBe('number');
        expect(normalized.baseAtk).toBe(7);
    });
    
    it('deve retornar novo objeto (não modificar original)', () => {
        const monster = {
            id: 'MON_001',
            name: 'Test',
            class: 'Guerreiro',
            rarity: 'Comum',
            baseHp: 20
        };
        
        const normalized = normalizeMonsterData(monster);
        
        // Modificar normalized não deve afetar original
        normalized.baseHp = 999;
        expect(monster.baseHp).toBe(20);
        
        // Deve ser objeto diferente
        expect(normalized).not.toBe(monster);
    });
    
    it('deve retornar null se receber null ou undefined', () => {
        expect(normalizeMonsterData(null)).toBe(null);
        expect(normalizeMonsterData(undefined)).toBe(null);
    });
});

describe('loadMonsters - Carregamento e Cache', () => {
    
    beforeEach(() => {
        // Limpar cache antes de cada teste
        clearCache();
    });
    
    it('deve retornar null quando fetch falha (404)', async () => {
        // Mock fetch para simular 404
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            })
        );
        
        const result = await loadMonsters();
        
        expect(result).toBe(null);
        
        const status = getCacheStatus();
        expect(status.loaded).toBe(false);
        expect(status.error).toBeTruthy();
    });
    
    it('deve retornar null quando JSON é inválido', async () => {
        // Mock fetch para retornar JSON inválido
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ invalid: 'structure' })
            })
        );
        
        const result = await loadMonsters();
        
        expect(result).toBe(null);
        
        const status = getCacheStatus();
        expect(status.loaded).toBe(false);
        expect(status.error).toContain('missing monsters array');
    });
    
    it('deve retornar Map quando JSON é válido', async () => {
        // Mock fetch para retornar JSON válido
        const mockData = {
            version: 1,
            monsters: [
                {
                    id: 'MON_001',
                    name: 'Cantapau',
                    class: 'Bardo',
                    rarity: 'Comum',
                    baseHp: 28
                },
                {
                    id: 'MON_002',
                    name: 'Pedrino',
                    class: 'Guerreiro',
                    rarity: 'Comum',
                    baseHp: 32
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        const result = await loadMonsters();
        
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(2);
        expect(result.has('MON_001')).toBe(true);
        expect(result.has('MON_002')).toBe(true);
        
        const mon1 = result.get('MON_001');
        expect(mon1.name).toBe('Cantapau');
        expect(mon1.class).toBe('Bardo');
        
        const status = getCacheStatus();
        expect(status.loaded).toBe(true);
        expect(status.error).toBe(null);
        expect(status.cachedCount).toBe(2);
    });
    
    it('deve usar cache em segunda chamada (sem fetch repetido)', async () => {
        const mockData = {
            version: 1,
            monsters: [
                {
                    id: 'MON_001',
                    name: 'Test',
                    class: 'Guerreiro',
                    rarity: 'Comum',
                    baseHp: 20
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        // Primeira chamada
        const result1 = await loadMonsters();
        expect(result1.size).toBe(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        
        // Segunda chamada (deve usar cache)
        const result2 = await loadMonsters();
        expect(result2.size).toBe(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);  // Não deve ter chamado fetch novamente
        
        // Deve ser a mesma instância do Map
        expect(result2).toBe(result1);
    });
    
    it('deve filtrar monsters com schema inválido', async () => {
        const mockData = {
            version: 1,
            monsters: [
                {
                    id: 'MON_001',
                    name: 'Valid',
                    class: 'Guerreiro',
                    rarity: 'Comum',
                    baseHp: 20
                },
                {
                    id: 'MON_INVALID',
                    name: 'Invalid',
                    // falta class
                    rarity: 'Comum',
                    baseHp: 10
                },
                {
                    id: 'MON_002',
                    name: 'Valid2',
                    class: 'Mago',
                    rarity: 'Comum',
                    baseHp: 25
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        const result = await loadMonsters();
        
        expect(result.size).toBe(2);  // Apenas os 2 válidos
        expect(result.has('MON_001')).toBe(true);
        expect(result.has('MON_002')).toBe(true);
        expect(result.has('MON_INVALID')).toBe(false);
    });
    
    it('deve normalizar monsters ao carregar', async () => {
        const mockData = {
            version: 1,
            monsters: [
                {
                    id: 'MON_001',
                    name: 'MinimalMonster',
                    class: 'Guerreiro',
                    rarity: 'Comum',
                    baseHp: 20
                    // sem outros stats
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        const result = await loadMonsters();
        const monster = result.get('MON_001');
        
        // Deve ter defaults preenchidos
        expect(monster.baseAtk).toBe(5);
        expect(monster.baseDef).toBe(3);
        expect(monster.baseSpd).toBe(5);
        expect(monster.baseEne).toBe(6);
        expect(monster.emoji).toBe('❓');
    });
});

describe('getCacheStatus - Status do Cache', () => {
    
    beforeEach(() => {
        clearCache();
    });
    
    it('deve retornar status inicial quando cache vazio', () => {
        const status = getCacheStatus();
        
        expect(status.loaded).toBe(false);
        expect(status.error).toBe(null);
        expect(status.cachedCount).toBe(0);
    });
    
    it('deve retornar status após carregamento bem-sucedido', async () => {
        const mockData = {
            version: 1,
            monsters: [
                { id: 'MON_001', name: 'Test', class: 'Guerreiro', rarity: 'Comum', baseHp: 20 }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        await loadMonsters();
        const status = getCacheStatus();
        
        expect(status.loaded).toBe(true);
        expect(status.error).toBe(null);
        expect(status.cachedCount).toBe(1);
        expect(status.timestamp).toBeTruthy();
    });
    
    it('deve retornar status após erro de carregamento', async () => {
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Server Error'
            })
        );
        
        await loadMonsters();
        const status = getCacheStatus();
        
        expect(status.loaded).toBe(false);
        expect(status.error).toBeTruthy();
        expect(status.cachedCount).toBe(0);
    });
});

describe('clearCache - Limpeza de Cache', () => {
    
    it('deve limpar cache após carregamento', async () => {
        const mockData = {
            version: 1,
            monsters: [
                { id: 'MON_001', name: 'Test', class: 'Guerreiro', rarity: 'Comum', baseHp: 20 }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        await loadMonsters();
        
        let status = getCacheStatus();
        expect(status.loaded).toBe(true);
        expect(status.cachedCount).toBe(1);
        
        clearCache();
        
        status = getCacheStatus();
        expect(status.loaded).toBe(false);
        expect(status.cachedCount).toBe(0);
        expect(status.error).toBe(null);
    });
});
