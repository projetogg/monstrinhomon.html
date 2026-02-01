/**
 * TEMPLATE INTEGRATION TESTS (PR9B)
 * 
 * Testes de integração entre DataLoader e getMonsterTemplate()
 * Verifica comportamento de fallback e lookup JSON vs hardcoded
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    loadMonsters,
    getMonstersMapSync,
    clearCache
} from '../js/data/dataLoader.js';

describe('getMonstersMapSync - Sync Getter', () => {
    
    beforeEach(() => {
        clearCache();
    });
    
    it('deve retornar null quando cache não está carregado', () => {
        const result = getMonstersMapSync();
        expect(result).toBe(null);
    });
    
    it('deve retornar Map quando cache está carregado', async () => {
        // Mock fetch
        const mockData = {
            version: 1,
            monsters: [
                {
                    id: 'MON_001',
                    name: 'Cantapau',
                    class: 'Bardo',
                    rarity: 'Comum',
                    baseHp: 28,
                    baseAtk: 6
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        await loadMonsters();
        
        const result = getMonstersMapSync();
        
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(1);
        expect(result.has('MON_001')).toBe(true);
    });
    
    it('deve retornar null se loadMonsters falhou', async () => {
        // Mock fetch com erro
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            })
        );
        
        await loadMonsters();
        
        const result = getMonstersMapSync();
        expect(result).toBe(null);
    });
    
    it('NÃO deve fazer fetch (apenas retorna cache)', () => {
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy;
        
        getMonstersMapSync();
        
        // Nenhum fetch deve ser chamado
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

describe('Integration: getMonsterTemplate + DataLoader', () => {
    
    // Simular função getMonsterTemplate do index.html
    const MOCK_HARDCODED_CATALOG = [
        { id: 'MON_001', name: 'Cantapau (Hardcoded)', class: 'Bardo', rarity: 'Comum', baseHp: 28 },
        { id: 'MON_004', name: 'Ninfolha (Hardcoded)', class: 'Curandeiro', rarity: 'Comum', baseHp: 30 },
        { id: 'MON_100', name: 'Rato-de-Lama (Hardcoded)', class: 'Guerreiro', rarity: 'Comum', baseHp: 20 }
    ];
    
    function mockGetMonsterTemplate(templateId) {
        if (!templateId) return null;
        
        // Tentar JSON primeiro
        const monstersMap = getMonstersMapSync();
        if (monstersMap && monstersMap.has(templateId)) {
            const template = monstersMap.get(templateId);
            return JSON.parse(JSON.stringify(template)); // deep clone
        }
        
        // Fallback: hardcoded
        return MOCK_HARDCODED_CATALOG.find(m => m.id === templateId) || null;
    }
    
    beforeEach(() => {
        clearCache();
    });
    
    describe('Quando JSON está carregado', () => {
        
        beforeEach(async () => {
            // Mock fetch com dados JSON
            const mockData = {
                version: 1,
                monsters: [
                    {
                        id: 'MON_001',
                        name: 'Cantapau (JSON)',
                        class: 'Bardo',
                        rarity: 'Comum',
                        baseHp: 28,
                        baseAtk: 6,
                        baseDef: 4,
                        baseSpd: 6,
                        baseEne: 8,
                        emoji: '🎵'
                    },
                    {
                        id: 'MON_002',
                        name: 'Pedrino (JSON)',
                        class: 'Guerreiro',
                        rarity: 'Comum',
                        baseHp: 32,
                        baseAtk: 7
                    }
                ]
            };
            
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockData)
                })
            );
            
            await loadMonsters();
        });
        
        it('deve retornar monster do JSON se existir', () => {
            const template = mockGetMonsterTemplate('MON_001');
            
            expect(template).not.toBe(null);
            expect(template.name).toBe('Cantapau (JSON)');
            expect(template.class).toBe('Bardo');
        });
        
        it('deve retornar monster do JSON (MON_002)', () => {
            const template = mockGetMonsterTemplate('MON_002');
            
            expect(template).not.toBe(null);
            expect(template.name).toBe('Pedrino (JSON)');
        });
        
        it('deve fazer fallback para hardcoded se monster não está no JSON', () => {
            const template = mockGetMonsterTemplate('MON_004');
            
            expect(template).not.toBe(null);
            expect(template.name).toBe('Ninfolha (Hardcoded)');
            expect(template.class).toBe('Curandeiro');
        });
        
        it('deve retornar null se não existe em nenhum dos dois', () => {
            const template = mockGetMonsterTemplate('MON_INEXISTENTE');
            
            expect(template).toBe(null);
        });
        
        it('deve retornar deep clone (não mutar cache)', () => {
            const template1 = mockGetMonsterTemplate('MON_001');
            const template2 = mockGetMonsterTemplate('MON_001');
            
            // Modificar template1 não deve afetar template2
            template1.baseHp = 999;
            
            expect(template2.baseHp).toBe(28);
            
            // Buscar novamente deve retornar valor original
            const template3 = mockGetMonsterTemplate('MON_001');
            expect(template3.baseHp).toBe(28);
        });
    });
    
    describe('Quando JSON NÃO está carregado (fallback)', () => {
        
        it('deve usar hardcoded se cache vazio', () => {
            // Cache vazio (não chamar loadMonsters)
            const template = mockGetMonsterTemplate('MON_001');
            
            expect(template).not.toBe(null);
            expect(template.name).toBe('Cantapau (Hardcoded)');
        });
        
        it('deve usar hardcoded se loadMonsters falhou', async () => {
            // Mock fetch com erro
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error'
                })
            );
            
            await loadMonsters();
            
            const template = mockGetMonsterTemplate('MON_001');
            
            expect(template).not.toBe(null);
            expect(template.name).toBe('Cantapau (Hardcoded)');
        });
    });
    
    describe('Edge cases', () => {
        
        it('deve retornar null se templateId é null', () => {
            const template = mockGetMonsterTemplate(null);
            expect(template).toBe(null);
        });
        
        it('deve retornar null se templateId é undefined', () => {
            const template = mockGetMonsterTemplate(undefined);
            expect(template).toBe(null);
        });
        
        it('deve retornar null se templateId é string vazia', () => {
            const template = mockGetMonsterTemplate('');
            expect(template).toBe(null);
        });
    });
    
    describe('Comportamento síncrono', () => {
        
        it('deve retornar imediatamente (não bloquear)', () => {
            const start = Date.now();
            const template = mockGetMonsterTemplate('MON_001');
            const elapsed = Date.now() - start;
            
            // Deve ser extremamente rápido (< 10ms)
            expect(elapsed).toBeLessThan(10);
        });
    });
});
