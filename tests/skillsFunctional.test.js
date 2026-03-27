/**
 * SKILLS FUNCTIONAL TESTS
 *
 * Testes funcionais para o sistema unificado de skills.
 * Valida:
 *  - data/skills.json cobre todas as 8 classes
 *  - Skills tiered do SKILL_DEFS estão representadas no JSON
 *  - IDs legados preservados (SK_WAR_01, GOLPE_ESPADA_I, etc.)
 *  - Carregamento funcional via skillsLoader
 *  - Integridade do schema para todas as 62 skills
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    loadSkills,
    getSkillsMapSync,
    clearSkillsCache,
    validateSkillSchema,
    normalizeSkillData
} from '../js/data/skillsLoader.js';

// --- Helpers ---

function loadSkillsJsonRaw() {
    const raw = readFileSync(join(process.cwd(), 'data/skills.json'), 'utf-8');
    return JSON.parse(raw);
}

const ALL_CLASSES = [
    'Guerreiro', 'Curandeiro', 'Mago', 'Bárbaro',
    'Ladino', 'Bardo', 'Caçador', 'Animalista'
];

// --- Testes ---

describe('Skills JSON — Cobertura de Classes', () => {

    const data = loadSkillsJsonRaw();
    const skills = data.skills;

    it('deve ter versão 2 (expansão unificada)', () => {
        expect(data.version).toBe(2);
    });

    it('deve ter pelo menos 50 skills no catálogo', () => {
        expect(skills.length).toBeGreaterThanOrEqual(50);
    });

    it('não deve ter IDs duplicados', () => {
        const ids = skills.map(s => s.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('todas as 8 classes devem ter skills', () => {
        const classesPresent = new Set(skills.map(s => s.class));
        for (const cls of ALL_CLASSES) {
            expect(
                classesPresent.has(cls),
                `Classe "${cls}" deveria ter skills no JSON`
            ).toBe(true);
        }
    });

    it('cada classe deve ter pelo menos 5 skills', () => {
        const counts = {};
        for (const s of skills) {
            counts[s.class] = (counts[s.class] || 0) + 1;
        }
        for (const cls of ALL_CLASSES) {
            expect(
                counts[cls] || 0,
                `Classe "${cls}" deveria ter ≥ 5 skills`
            ).toBeGreaterThanOrEqual(5);
        }
    });

    it('todas as skills devem ter os campos obrigatórios', () => {
        const required = ['id', 'name', 'class', 'category', 'power', 'accuracy', 'energy_cost', 'target'];
        for (const skill of skills) {
            for (const field of required) {
                expect(
                    skill[field] !== undefined && skill[field] !== null,
                    `${skill.id} falta campo "${field}"`
                ).toBe(true);
            }
        }
    });

    it('todas as skills devem passar validateSkillSchema', () => {
        for (const skill of skills) {
            expect(
                validateSkillSchema(skill),
                `${skill.id} falhou validação de schema`
            ).toBe(true);
        }
    });

    it('accuracy deve estar entre 0 e 1 para todas', () => {
        for (const skill of skills) {
            expect(skill.accuracy).toBeGreaterThanOrEqual(0);
            expect(skill.accuracy).toBeLessThanOrEqual(1);
        }
    });

    it('energy_cost deve ser ≥ 0 para todas', () => {
        for (const skill of skills) {
            expect(
                skill.energy_cost,
                `${skill.id} energy_cost inválido`
            ).toBeGreaterThanOrEqual(0);
        }
    });
});

describe('Skills JSON — IDs Legados Preservados', () => {

    const data = loadSkillsJsonRaw();
    const skillMap = new Map(data.skills.map(s => [s.id, s]));

    const legacyIds = [
        'SK_WAR_01', 'SK_WAR_02',
        'SK_MAG_01', 'SK_MAG_02',
        'SK_HEA_01', 'SK_HEA_02',
        'SK_HUN_01',
        'SK_BRD_01',
        'GOLPE_ESPADA_I', 'GOLPE_ESPADA_II', 'GOLPE_ESPADA_III',
        'ESCUDO_I', 'ESCUDO_II', 'ESCUDO_III',
        'BOLA_FOGO_I', 'BOLA_FOGO_II', 'BOLA_FOGO_III'
    ];

    it('todos os IDs legados devem estar preservados', () => {
        for (const id of legacyIds) {
            expect(
                skillMap.has(id),
                `ID legado "${id}" deveria existir no JSON`
            ).toBe(true);
        }
    });

    it('IDs legados devem manter classe original', () => {
        expect(skillMap.get('SK_WAR_01').class).toBe('Guerreiro');
        expect(skillMap.get('SK_MAG_01').class).toBe('Mago');
        expect(skillMap.get('SK_HEA_01').class).toBe('Curandeiro');
        expect(skillMap.get('SK_HUN_01').class).toBe('Caçador');
        expect(skillMap.get('SK_BRD_01').class).toBe('Bardo');
    });
});

describe('Skills JSON — Skills SKILL_DEFS Representadas', () => {

    const data = loadSkillsJsonRaw();
    const skillMap = new Map(data.skills.map(s => [s.id, s]));

    // SKILL_DEFS tiered skills que devem estar no JSON
    const skillDefsEntries = [
        // Guerreiro
        { id: 'GOLPE_DE_ESPADA_I', name: 'Golpe de Espada I', class: 'Guerreiro' },
        { id: 'GOLPE_DE_ESPADA_II', name: 'Golpe de Espada II', class: 'Guerreiro' },
        { id: 'GOLPE_DE_ESPADA_III', name: 'Golpe de Espada III', class: 'Guerreiro' },
        { id: 'PROVOCAR_I', name: 'Provocar I', class: 'Guerreiro' },
        { id: 'PROVOCAR_II', name: 'Provocar II', class: 'Guerreiro' },
        // Curandeiro
        { id: 'CURA_I', name: 'Cura I', class: 'Curandeiro' },
        { id: 'CURA_III', name: 'Cura III', class: 'Curandeiro' },
        { id: 'BENCAO_I', name: 'Bênção I', class: 'Curandeiro' },
        // Mago
        { id: 'MAGIA_ELEMENTAL_I', name: 'Magia Elemental I', class: 'Mago' },
        { id: 'EXPLOSAO_ELEMENTAL_III', name: 'Explosão Elemental III', class: 'Mago' },
        // Bárbaro
        { id: 'FURIA_I', name: 'Fúria I', class: 'Bárbaro' },
        { id: 'GOLPE_BRUTAL_I', name: 'Golpe Brutal I', class: 'Bárbaro' },
        // Ladino
        { id: 'ATAQUE_PRECISO_I', name: 'Ataque Preciso I', class: 'Ladino' },
        { id: 'ENFRAQUECER_I', name: 'Enfraquecer I', class: 'Ladino' },
        // Bardo
        { id: 'CANCAO_DE_CORAGEM_I', name: 'Canção de Coragem I', class: 'Bardo' },
        { id: 'CANCAO_CALMANTE_I', name: 'Canção Calmante I', class: 'Bardo' },
        // Caçador
        { id: 'FLECHA_PODEROSA_I', name: 'Flecha Poderosa I', class: 'Caçador' },
        { id: 'ARMADILHA_I', name: 'Armadilha I', class: 'Caçador' },
        // Animalista
        { id: 'INVESTIDA_BESTIAL_I', name: 'Investida Bestial I', class: 'Animalista' },
        { id: 'INSTINTO_SELVAGEM_I', name: 'Instinto Selvagem I', class: 'Animalista' },
    ];

    for (const entry of skillDefsEntries) {
        it(`deve ter ${entry.id} (${entry.class})`, () => {
            expect(skillMap.has(entry.id), `${entry.id} não encontrado`).toBe(true);
            const skill = skillMap.get(entry.id);
            expect(skill.class).toBe(entry.class);
        });
    }
});

describe('Skills JSON — Carregamento via SkillsLoader', () => {

    const rawData = loadSkillsJsonRaw();

    beforeEach(() => {
        clearSkillsCache();
    });

    it('loadSkills deve carregar todas as skills do JSON', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(rawData)
            })
        );

        const map = await loadSkills();

        expect(map).toBeInstanceOf(Map);
        expect(map.size).toBe(rawData.skills.length);
    });

    it('getSkillsMapSync deve retornar Map após carregamento', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(rawData)
            })
        );

        await loadSkills();
        const map = getSkillsMapSync();

        expect(map).toBeInstanceOf(Map);
        expect(map.size).toBe(rawData.skills.length);
    });

    it('skills de classes novas (Bárbaro, Ladino, Animalista) devem ser encontráveis por ID', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(rawData)
            })
        );

        await loadSkills();
        const map = getSkillsMapSync();

        // Bárbaro
        expect(map.has('FURIA_I')).toBe(true);
        expect(map.get('FURIA_I').class).toBe('Bárbaro');

        // Ladino
        expect(map.has('ATAQUE_PRECISO_I')).toBe(true);
        expect(map.get('ATAQUE_PRECISO_I').class).toBe('Ladino');

        // Animalista
        expect(map.has('INVESTIDA_BESTIAL_I')).toBe(true);
        expect(map.get('INVESTIDA_BESTIAL_I').class).toBe('Animalista');
    });

    it('normalizeSkillData deve preservar tier e status', () => {
        const skill = rawData.skills.find(s => s.id === 'FURIA_I');
        const normalized = normalizeSkillData(skill);

        expect(normalized.tier).toBe(1);
        expect(normalized.class).toBe('Bárbaro');
        expect(normalized.energy_cost).toBe(4);
    });
});

describe('Skills JSON — Distribuição por Categoria', () => {

    const data = loadSkillsJsonRaw();
    const skills = data.skills;

    it('deve ter skills de Ataque', () => {
        const ataque = skills.filter(s => s.category === 'Ataque');
        expect(ataque.length).toBeGreaterThan(10);
    });

    it('deve ter skills de Suporte', () => {
        const suporte = skills.filter(s => s.category === 'Suporte');
        expect(suporte.length).toBeGreaterThan(5);
    });

    it('deve ter skills de Cura', () => {
        const cura = skills.filter(s => s.category === 'Cura');
        expect(cura.length).toBeGreaterThan(2);
    });

    it('deve ter skills de Controle', () => {
        const controle = skills.filter(s => s.category === 'Controle');
        expect(controle.length).toBeGreaterThan(1);
    });
});
