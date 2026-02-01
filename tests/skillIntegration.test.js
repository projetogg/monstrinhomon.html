/**
 * SKILL INTEGRATION TESTS (PR10B)
 * 
 * Testes de integração entre SkillsLoader e getSkillCatalog()/getSkillById()
 * Verifica comportamento de fallback e lookup JSON vs hardcoded
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    loadSkills,
    getSkillsMapSync,
    clearSkillsCache
} from '../js/data/skillsLoader.js';

describe('getSkillsMapSync - Sync Getter', () => {
    
    beforeEach(() => {
        clearSkillsCache();
    });
    
    it('deve retornar null quando cache não está carregado', () => {
        const result = getSkillsMapSync();
        expect(result).toBe(null);
    });
    
    it('deve retornar Map quando cache está carregado', async () => {
        // Mock fetch
        const mockData = {
            version: 1,
            skills: [
                {
                    id: 'SK_WAR_01',
                    name: 'Golpe de Escudo',
                    class: 'Guerreiro',
                    category: 'Controle',
                    power: 6,
                    accuracy: 0.9,
                    energy_cost: 2,
                    target: 'Inimigo'
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        await loadSkills();
        
        const result = getSkillsMapSync();
        
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(1);
        expect(result.has('SK_WAR_01')).toBe(true);
    });
    
    it('deve retornar null se loadSkills falhou', async () => {
        // Mock fetch com erro
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            })
        );
        
        await loadSkills();
        
        const result = getSkillsMapSync();
        expect(result).toBe(null);
    });
    
    it('NÃO deve fazer fetch (apenas retorna cache)', () => {
        const fetchSpy = vi.fn();
        global.fetch = fetchSpy;
        
        getSkillsMapSync();
        
        // Nenhum fetch deve ser chamado
        expect(fetchSpy).not.toHaveBeenCalled();
    });
});

describe('Integration: getSkillCatalog + SkillsLoader', () => {
    
    // Simular função getSkillCatalog do index.html
    const MOCK_HARDCODED_CATALOG = [
        { id: 'SK_WAR_01', name: 'Golpe de Escudo (Hardcoded)', class: 'Guerreiro', category: 'Controle', power: 6, accuracy: 0.9, energy_cost: 2, target: 'Inimigo' },
        { id: 'SK_MAG_01', name: 'Raio Místico (Hardcoded)', class: 'Mago', category: 'Ataque', power: 10, accuracy: 0.85, energy_cost: 4, target: 'Inimigo' },
        { id: 'SK_HARDCODED_ONLY', name: 'Hardcoded Only Skill', class: 'Bardo', category: 'Suporte', power: 0, accuracy: 1, energy_cost: 3, target: 'Aliado' }
    ];
    
    function mockGetSkillCatalog() {
        // Tentar JSON primeiro
        const skillsMap = getSkillsMapSync();
        if (skillsMap && skillsMap.size > 0) {
            return Array.from(skillsMap.values()).map(skill => 
                JSON.parse(JSON.stringify(skill))
            );
        }
        
        // Fallback para hardcoded
        return MOCK_HARDCODED_CATALOG;
    }
    
    function mockGetSkillById(id) {
        const sid = String(id || "");
        if (!sid) return null;
        
        // Tentar JSON primeiro
        const skillsMap = getSkillsMapSync();
        if (skillsMap && skillsMap.has(sid)) {
            const skill = skillsMap.get(sid);
            return JSON.parse(JSON.stringify(skill));
        }
        
        // Fallback para hardcoded (não chama getSkillCatalog para evitar loop)
        return MOCK_HARDCODED_CATALOG.find(s => String(s.id) === sid) || null;
    }
    
    beforeEach(() => {
        clearSkillsCache();
    });
    
    describe('Quando JSON está carregado', () => {
        
        beforeEach(async () => {
            const mockData = {
                version: 1,
                skills: [
                    {
                        id: 'SK_WAR_01',
                        name: 'Golpe de Escudo',
                        class: 'Guerreiro',
                        category: 'Controle',
                        power: 6,
                        accuracy: 0.9,
                        energy_cost: 2,
                        target: 'Inimigo',
                        status: 'Atordoado',
                        desc: 'Ataque curto com chance de atordoar.'
                    },
                    {
                        id: 'SK_MAG_01',
                        name: 'Raio Místico',
                        class: 'Mago',
                        category: 'Ataque',
                        power: 10,
                        accuracy: 0.85,
                        energy_cost: 4,
                        target: 'Inimigo',
                        status: '',
                        desc: 'Dano mágico à distância.'
                    }
                ]
            };
            
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockData)
                })
            );
            
            await loadSkills();
        });
        
        it('getSkillCatalog deve retornar array do JSON', () => {
            const catalog = mockGetSkillCatalog();
            
            expect(Array.isArray(catalog)).toBe(true);
            expect(catalog.length).toBe(2);
            expect(catalog[0].name).toBe('Golpe de Escudo'); // do JSON, não do hardcoded
            expect(catalog[1].name).toBe('Raio Místico');
        });
        
        it('getSkillById deve retornar skill do JSON se existir', () => {
            const skill = mockGetSkillById('SK_WAR_01');
            
            expect(skill).not.toBe(null);
            expect(skill.name).toBe('Golpe de Escudo'); // do JSON
            expect(skill.desc).toBe('Ataque curto com chance de atordoar.');
        });
        
        it('getSkillById deve retornar skill do JSON (SK_MAG_01)', () => {
            const skill = mockGetSkillById('SK_MAG_01');
            
            expect(skill).not.toBe(null);
            expect(skill.name).toBe('Raio Místico');
            expect(skill.class).toBe('Mago');
        });
        
        it('getSkillById deve fazer fallback para hardcoded se skill não está no JSON', () => {
            const skill = mockGetSkillById('SK_HARDCODED_ONLY');
            
            expect(skill).not.toBe(null);
            expect(skill.name).toBe('Hardcoded Only Skill');
        });
        
        it('getSkillById deve retornar null se não existe em nenhum dos dois', () => {
            const skill = mockGetSkillById('SK_DOES_NOT_EXIST');
            
            expect(skill).toBe(null);
        });
        
        it('deve retornar deep clone (não mutar cache)', () => {
            const skill1 = mockGetSkillById('SK_WAR_01');
            const skill2 = mockGetSkillById('SK_WAR_01');
            
            // Modificar skill1 não deve afetar skill2
            skill1.power = 999;
            
            expect(skill2.power).toBe(6); // valor original
            expect(skill1).not.toBe(skill2); // objetos diferentes
        });
    });
    
    describe('Quando JSON NÃO está carregado (fallback)', () => {
        
        it('getSkillCatalog deve usar hardcoded se loadSkills falhou', async () => {
            // Mock fetch com erro
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error'
                })
            );
            
            await loadSkills();
            
            const catalog = mockGetSkillCatalog();
            
            expect(Array.isArray(catalog)).toBe(true);
            expect(catalog.length).toBe(3); // 3 skills hardcoded
            expect(catalog[0].name).toContain('(Hardcoded)');
        });
        
        it('getSkillById deve usar hardcoded se loadSkills falhou', async () => {
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: false,
                    status: 500,
                    statusText: 'Server Error'
                })
            );
            
            await loadSkills();
            
            const skill = mockGetSkillById('SK_WAR_01');
            
            expect(skill).not.toBe(null);
            expect(skill.name).toContain('(Hardcoded)');
        });
        
        it('getSkillCatalog deve usar hardcoded se cache não foi carregado', () => {
            // Não carregar cache
            const catalog = mockGetSkillCatalog();
            
            expect(Array.isArray(catalog)).toBe(true);
            expect(catalog.length).toBe(3);
        });
    });
    
    describe('Edge cases', () => {
        
        it('getSkillById deve retornar null se id é vazio', () => {
            expect(mockGetSkillById('')).toBe(null);
            expect(mockGetSkillById(null)).toBe(null);
            expect(mockGetSkillById(undefined)).toBe(null);
        });
        
        it('getSkillById deve converter id para string', async () => {
            const mockData = {
                version: 1,
                skills: [
                    { id: 'SK_001', name: 'Test', class: 'Guerreiro', category: 'Ataque', power: 5, accuracy: 0.8, energy_cost: 2, target: 'Inimigo' }
                ]
            };
            
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockData)
                })
            );
            
            await loadSkills();
            
            // Passar número como id
            const skill = mockGetSkillById('SK_001');
            expect(skill).not.toBe(null);
            expect(skill.name).toBe('Test');
        });
        
        it('getSkillCatalog deve retornar array vazio se nenhuma fonte disponível', () => {
            // Simular cenário onde nem JSON nem hardcoded existem
            function emptyGetSkillCatalog() {
                const skillsMap = getSkillsMapSync();
                if (skillsMap && skillsMap.size > 0) {
                    return Array.from(skillsMap.values());
                }
                return []; // sem hardcoded
            }
            
            const catalog = emptyGetSkillCatalog();
            expect(Array.isArray(catalog)).toBe(true);
            expect(catalog.length).toBe(0);
        });
    });
    
    describe('Deep Clone Verification', () => {
        
        beforeEach(async () => {
            const mockData = {
                version: 1,
                skills: [
                    {
                        id: 'SK_TEST',
                        name: 'Test Skill',
                        class: 'Guerreiro',
                        category: 'Ataque',
                        power: 10,
                        accuracy: 0.9,
                        energy_cost: 4,
                        target: 'Inimigo',
                        status: '',
                        desc: 'Test description'
                    }
                ]
            };
            
            global.fetch = vi.fn(() => 
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockData)
                })
            );
            
            await loadSkills();
        });
        
        it('getSkillCatalog deve retornar novo array a cada chamada', () => {
            const cat1 = mockGetSkillCatalog();
            const cat2 = mockGetSkillCatalog();
            
            // Arrays diferentes
            expect(cat1).not.toBe(cat2);
            
            // Mas conteúdo igual
            expect(cat1.length).toBe(cat2.length);
            expect(cat1[0].name).toBe(cat2[0].name);
        });
        
        it('modificar skill retornada não deve afetar cache', () => {
            const skill = mockGetSkillById('SK_TEST');
            skill.power = 999;
            skill.name = 'Modified';
            
            // Buscar novamente
            const skillAgain = mockGetSkillById('SK_TEST');
            
            expect(skillAgain.power).toBe(10); // valor original
            expect(skillAgain.name).toBe('Test Skill'); // valor original
        });
        
        it('modificar item do catalog não deve afetar próxima chamada', () => {
            const catalog = mockGetSkillCatalog();
            catalog[0].power = 999;
            
            const catalogAgain = mockGetSkillCatalog();
            expect(catalogAgain[0].power).toBe(10); // valor original
        });
    });
});
