/**
 * SKILLS LOADER TESTS (PR10A)
 * 
 * Testes para funções puras do skillsLoader.js
 * Cobertura: validateSkillSchema, normalizeSkillData, comportamento de fallback
 * 
 * Segue o mesmo padrão do dataLoader.test.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
    validateSkillSchema, 
    normalizeSkillData,
    loadSkills,
    getSkillsCacheStatus,
    clearSkillsCache
} from '../js/data/skillsLoader.js';

describe('validateSkillSchema - Validação de Schema', () => {
    
    it('deve retornar true para skill válida completa', () => {
        const skill = {
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
        };
        expect(validateSkillSchema(skill)).toBe(true);
    });
    
    it('deve retornar true para skill válida mínima (sem campos opcionais)', () => {
        const skill = {
            id: 'SK_TEST',
            name: 'Test Skill',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(true);
    });
    
    it('deve retornar false se falta campo obrigatório (id)', () => {
        const skill = {
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (name)', () => {
        const skill = {
            id: 'SK_001',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (class)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (category)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (power)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (accuracy)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (energy_cost)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se falta campo obrigatório (target)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se power não é número', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: '10',  // string
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve retornar false se accuracy não está entre 0 e 1', () => {
        const skill1 = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 1.5,  // maior que 1
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill1)).toBe(false);
        
        const skill2 = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: -0.1,  // menor que 0
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill2)).toBe(false);
    });
    
    it('deve retornar false se power é negativo', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: -5,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        expect(validateSkillSchema(skill)).toBe(false);
    });
    
    it('deve aceitar power 0 (para skills de cura/suporte)', () => {
        const skill = {
            id: 'SK_HEA_01',
            name: 'Cura',
            class: 'Curandeiro',
            category: 'Cura',
            power: 0,
            accuracy: 1,
            energy_cost: 4,
            target: 'Aliado'
        };
        expect(validateSkillSchema(skill)).toBe(true);
    });
    
    it('deve retornar false se skill é null ou undefined', () => {
        expect(validateSkillSchema(null)).toBe(false);
        expect(validateSkillSchema(undefined)).toBe(false);
    });
    
    it('deve retornar false se skill não é objeto', () => {
        expect(validateSkillSchema('string')).toBe(false);
        expect(validateSkillSchema(123)).toBe(false);
        expect(validateSkillSchema([])).toBe(false);
    });
});

describe('normalizeSkillData - Normalização de Dados', () => {
    
    it('deve preencher campos opcionais com defaults se faltarem', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        
        const normalized = normalizeSkillData(skill);
        
        expect(normalized.status).toBe('');
        expect(normalized.desc).toBe('');
    });
    
    it('NÃO deve modificar valores existentes', () => {
        const skill = {
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
        };
        
        const normalized = normalizeSkillData(skill);
        
        expect(normalized.id).toBe('SK_WAR_01');
        expect(normalized.name).toBe('Golpe de Escudo');
        expect(normalized.class).toBe('Guerreiro');
        expect(normalized.category).toBe('Controle');
        expect(normalized.power).toBe(6);
        expect(normalized.accuracy).toBe(0.9);
        expect(normalized.energy_cost).toBe(2);
        expect(normalized.target).toBe('Inimigo');
        expect(normalized.status).toBe('Atordoado');
        expect(normalized.desc).toBe('Ataque curto com chance de atordoar.');
    });
    
    it('deve converter strings numéricas para números', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: '10',
            accuracy: '0.85',
            energy_cost: '4',
            target: 'Inimigo'
        };
        
        const normalized = normalizeSkillData(skill);
        
        expect(typeof normalized.power).toBe('number');
        expect(normalized.power).toBe(10);
        expect(typeof normalized.accuracy).toBe('number');
        expect(normalized.accuracy).toBe(0.85);
        expect(typeof normalized.energy_cost).toBe('number');
        expect(normalized.energy_cost).toBe(4);
    });
    
    it('deve retornar novo objeto (não modificar original)', () => {
        const skill = {
            id: 'SK_001',
            name: 'Test',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 10,
            accuracy: 0.85,
            energy_cost: 4,
            target: 'Inimigo'
        };
        
        const normalized = normalizeSkillData(skill);
        
        // Modificar normalized não deve afetar original
        normalized.power = 999;
        expect(skill.power).toBe(10);
        
        // Deve ser objeto diferente
        expect(normalized).not.toBe(skill);
    });
    
    it('deve retornar null se receber null ou undefined', () => {
        expect(normalizeSkillData(null)).toBe(null);
        expect(normalizeSkillData(undefined)).toBe(null);
    });
    
    it('deve preservar status vazio se fornecido como string vazia', () => {
        const skill = {
            id: 'SK_WAR_02',
            name: 'Corte Pesado',
            class: 'Guerreiro',
            category: 'Ataque',
            power: 9,
            accuracy: 0.8,
            energy_cost: 3,
            target: 'Inimigo',
            status: '',
            desc: 'Dano alto, menos preciso.'
        };
        
        const normalized = normalizeSkillData(skill);
        
        expect(normalized.status).toBe('');
    });
});

describe('loadSkills - Carregamento e Cache', () => {
    
    beforeEach(() => {
        // Limpar cache antes de cada teste
        clearSkillsCache();
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
        
        const result = await loadSkills();
        
        expect(result).toBe(null);
        
        const status = getSkillsCacheStatus();
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
        
        const result = await loadSkills();
        
        expect(result).toBe(null);
        
        const status = getSkillsCacheStatus();
        expect(status.loaded).toBe(false);
        expect(status.error).toContain('missing skills array');
    });
    
    it('deve retornar Map quando JSON é válido', async () => {
        // Mock fetch para retornar JSON válido
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
                },
                {
                    id: 'SK_MAG_01',
                    name: 'Raio Místico',
                    class: 'Mago',
                    category: 'Ataque',
                    power: 10,
                    accuracy: 0.85,
                    energy_cost: 4,
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
        
        const result = await loadSkills();
        
        expect(result).toBeInstanceOf(Map);
        expect(result.size).toBe(2);
        expect(result.has('SK_WAR_01')).toBe(true);
        expect(result.has('SK_MAG_01')).toBe(true);
        
        const skill1 = result.get('SK_WAR_01');
        expect(skill1.name).toBe('Golpe de Escudo');
        expect(skill1.class).toBe('Guerreiro');
        
        const status = getSkillsCacheStatus();
        expect(status.loaded).toBe(true);
        expect(status.error).toBe(null);
        expect(status.cachedCount).toBe(2);
    });
    
    it('deve usar cache em segunda chamada (sem fetch repetido)', async () => {
        const mockData = {
            version: 1,
            skills: [
                {
                    id: 'SK_001',
                    name: 'Test',
                    class: 'Guerreiro',
                    category: 'Ataque',
                    power: 10,
                    accuracy: 0.85,
                    energy_cost: 4,
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
        
        // Primeira chamada
        const result1 = await loadSkills();
        expect(result1.size).toBe(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);
        
        // Segunda chamada (deve usar cache)
        const result2 = await loadSkills();
        expect(result2.size).toBe(1);
        expect(global.fetch).toHaveBeenCalledTimes(1);  // Não deve ter chamado fetch novamente
        
        // Deve ser a mesma instância do Map
        expect(result2).toBe(result1);
    });
    
    it('deve filtrar skills com schema inválido', async () => {
        const mockData = {
            version: 1,
            skills: [
                {
                    id: 'SK_001',
                    name: 'Valid',
                    class: 'Guerreiro',
                    category: 'Ataque',
                    power: 10,
                    accuracy: 0.85,
                    energy_cost: 4,
                    target: 'Inimigo'
                },
                {
                    id: 'SK_INVALID',
                    name: 'Invalid',
                    // falta class
                    category: 'Ataque',
                    power: 5,
                    accuracy: 0.8,
                    energy_cost: 3,
                    target: 'Inimigo'
                },
                {
                    id: 'SK_002',
                    name: 'Valid2',
                    class: 'Mago',
                    category: 'Ataque',
                    power: 12,
                    accuracy: 0.9,
                    energy_cost: 5,
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
        
        const result = await loadSkills();
        
        expect(result.size).toBe(2);  // Apenas os 2 válidos
        expect(result.has('SK_001')).toBe(true);
        expect(result.has('SK_002')).toBe(true);
        expect(result.has('SK_INVALID')).toBe(false);
    });
    
    it('deve normalizar skills ao carregar', async () => {
        const mockData = {
            version: 1,
            skills: [
                {
                    id: 'SK_001',
                    name: 'MinimalSkill',
                    class: 'Guerreiro',
                    category: 'Ataque',
                    power: 10,
                    accuracy: 0.85,
                    energy_cost: 4,
                    target: 'Inimigo'
                    // sem status/desc
                }
            ]
        };
        
        global.fetch = vi.fn(() => 
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockData)
            })
        );
        
        const result = await loadSkills();
        const skill = result.get('SK_001');
        
        // Deve ter defaults preenchidos
        expect(skill.status).toBe('');
        expect(skill.desc).toBe('');
    });
});

describe('getSkillsCacheStatus - Status do Cache', () => {
    
    beforeEach(() => {
        clearSkillsCache();
    });
    
    it('deve retornar status inicial quando cache vazio', () => {
        const status = getSkillsCacheStatus();
        
        expect(status.loaded).toBe(false);
        expect(status.error).toBe(null);
        expect(status.cachedCount).toBe(0);
    });
    
    it('deve retornar status após carregamento bem-sucedido', async () => {
        const mockData = {
            version: 1,
            skills: [
                { 
                    id: 'SK_001', 
                    name: 'Test', 
                    class: 'Guerreiro', 
                    category: 'Ataque',
                    power: 10,
                    accuracy: 0.85,
                    energy_cost: 4,
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
        const status = getSkillsCacheStatus();
        
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
        
        await loadSkills();
        const status = getSkillsCacheStatus();
        
        expect(status.loaded).toBe(false);
        expect(status.error).toBeTruthy();
        expect(status.cachedCount).toBe(0);
    });
});

describe('clearSkillsCache - Limpeza de Cache', () => {
    
    it('deve limpar cache após carregamento', async () => {
        const mockData = {
            version: 1,
            skills: [
                { 
                    id: 'SK_001', 
                    name: 'Test', 
                    class: 'Guerreiro', 
                    category: 'Ataque',
                    power: 10,
                    accuracy: 0.85,
                    energy_cost: 4,
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
        
        let status = getSkillsCacheStatus();
        expect(status.loaded).toBe(true);
        expect(status.cachedCount).toBe(1);
        
        clearSkillsCache();
        
        status = getSkillsCacheStatus();
        expect(status.loaded).toBe(false);
        expect(status.cachedCount).toBe(0);
        expect(status.error).toBe(null);
    });
});
