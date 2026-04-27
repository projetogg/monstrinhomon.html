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

    it('deve ter versão 2.0.0 (FASE A — skills canônicas unificadas)', () => {
        expect(data.version).toBe('2.0.0');
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

describe('Skills JSON — IDs Canônicos FASE A', () => {

    const data = loadSkillsJsonRaw();
    const skillMap = new Map(data.skills.map(s => [s.id, s]));

    // IDs canônicos FASE A (formato GROUPKEY_STAGE: _0, _1, _2)
    const canonicalIds = [
        'GOLPE_DE_ESPADA_0', 'GOLPE_DE_ESPADA_1', 'GOLPE_DE_ESPADA_2',
        'ESCUDO_0', 'ESCUDO_1', 'ESCUDO_2',
        'PROVOCAR_1', 'PROVOCAR_2',
        'CURA_0', 'CURA_1', 'CURA_2',
        'BENCAO_0', 'BENCAO_1', 'BENCAO_2',
        'MAGIA_ELEMENTAL_0', 'MAGIA_ELEMENTAL_1', 'MAGIA_ELEMENTAL_2',
        'EXPLOSAO_ELEMENTAL_0', 'EXPLOSAO_ELEMENTAL_1', 'EXPLOSAO_ELEMENTAL_2',
        'ESCUDO_ARCANO_0', 'ESCUDO_ARCANO_1', 'ESCUDO_ARCANO_2',
        'FURIA_0', 'FURIA_1', 'FURIA_2',
        'GOLPE_BRUTAL_0', 'GOLPE_BRUTAL_1', 'GOLPE_BRUTAL_2',
        'ATAQUE_PRECISO_0', 'ATAQUE_PRECISO_1', 'ATAQUE_PRECISO_2',
        'ENFRAQUECER_1', 'ENFRAQUECER_2',
        'CANCAO_CORAGEM_0', 'CANCAO_CORAGEM_1', 'CANCAO_CORAGEM_2',
        'CANCAO_CALMANTE_0', 'CANCAO_CALMANTE_1', 'CANCAO_CALMANTE_2',
        'NOTA_DISCORDANTE_0', 'NOTA_DISCORDANTE_1', 'NOTA_DISCORDANTE_2',
        'FLECHA_PODEROSA_0', 'FLECHA_PODEROSA_1', 'FLECHA_PODEROSA_2',
        'ARMADILHA_1', 'ARMADILHA_2',
        'INVESTIDA_BESTIAL_0', 'INVESTIDA_BESTIAL_1', 'INVESTIDA_BESTIAL_2',
        'INSTINTO_SELVAGEM_0', 'INSTINTO_SELVAGEM_1', 'INSTINTO_SELVAGEM_2',
    ];

    it('todos os IDs canônicos FASE A devem existir', () => {
        for (const id of canonicalIds) {
            expect(
                skillMap.has(id),
                `ID canônico "${id}" deveria existir no JSON`
            ).toBe(true);
        }
    });

    it('IDs canônicos devem manter classe correta', () => {
        expect(skillMap.get('ESCUDO_0').class).toBe('Guerreiro');
        expect(skillMap.get('MAGIA_ELEMENTAL_0').class).toBe('Mago');
        expect(skillMap.get('CURA_0').class).toBe('Curandeiro');
        expect(skillMap.get('FLECHA_PODEROSA_0').class).toBe('Caçador');
        expect(skillMap.get('CANCAO_CORAGEM_0').class).toBe('Bardo');
    });
});

describe('Skills JSON — Skills SKILL_DEFS Representadas', () => {

    const data = loadSkillsJsonRaw();
    const skillMap = new Map(data.skills.map(s => [s.id, s]));

    // SKILL_DEFS tiered skills que devem estar no JSON (FASE A — sufixo _stageIndex)
    const skillDefsEntries = [
        // Guerreiro
        { id: 'GOLPE_DE_ESPADA_0', name: 'Golpe de Espada I', class: 'Guerreiro' },
        { id: 'GOLPE_DE_ESPADA_1', name: 'Golpe de Espada II', class: 'Guerreiro' },
        { id: 'GOLPE_DE_ESPADA_2', name: 'Golpe de Espada III', class: 'Guerreiro' },
        { id: 'PROVOCAR_1', name: 'Provocar I', class: 'Guerreiro' },
        { id: 'PROVOCAR_2', name: 'Provocar II', class: 'Guerreiro' },
        // Curandeiro
        { id: 'CURA_0', name: 'Cura I', class: 'Curandeiro' },
        { id: 'CURA_2', name: 'Cura III', class: 'Curandeiro' },
        { id: 'BENCAO_0', name: 'Bênção I', class: 'Curandeiro' },
        // Mago
        { id: 'MAGIA_ELEMENTAL_0', name: 'Magia Elemental I', class: 'Mago' },
        { id: 'EXPLOSAO_ELEMENTAL_2', name: 'Explosão Elemental III', class: 'Mago' },
        // Bárbaro
        { id: 'FURIA_0', name: 'Fúria I', class: 'Bárbaro' },
        { id: 'GOLPE_BRUTAL_0', name: 'Golpe Brutal I', class: 'Bárbaro' },
        // Ladino
        { id: 'ATAQUE_PRECISO_0', name: 'Ataque Preciso I', class: 'Ladino' },
        { id: 'ENFRAQUECER_1', name: 'Enfraquecer I', class: 'Ladino' },
        // Bardo
        { id: 'CANCAO_CORAGEM_0', name: 'Canção de Coragem I', class: 'Bardo' },
        { id: 'CANCAO_CALMANTE_0', name: 'Canção Calmante I', class: 'Bardo' },
        // Caçador
        { id: 'FLECHA_PODEROSA_0', name: 'Flecha Poderosa I', class: 'Caçador' },
        { id: 'ARMADILHA_1', name: 'Armadilha I', class: 'Caçador' },
        // Animalista
        { id: 'INVESTIDA_BESTIAL_0', name: 'Investida Bestial I', class: 'Animalista' },
        { id: 'INSTINTO_SELVAGEM_0', name: 'Instinto Selvagem I', class: 'Animalista' },
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
        expect(map.has('FURIA_0')).toBe(true);
        expect(map.get('FURIA_0').class).toBe('Bárbaro');

        // Ladino
        expect(map.has('ATAQUE_PRECISO_0')).toBe(true);
        expect(map.get('ATAQUE_PRECISO_0').class).toBe('Ladino');

        // Animalista
        expect(map.has('INVESTIDA_BESTIAL_0')).toBe(true);
        expect(map.get('INVESTIDA_BESTIAL_0').class).toBe('Animalista');
    });

    it('normalizeSkillData deve preservar tier e status', () => {
        const skill = rawData.skills.find(s => s.id === 'FURIA_0');
        const normalized = normalizeSkillData(skill);

        expect(normalized.tier).toBe(1);
        expect(normalized.class).toBe('Bárbaro');
        expect(normalized.energy_cost).toBe(4);
    });
});

describe('Skills JSON — Alinhamento com SKILL_DEFS (FASE A)', () => {

    const data = loadSkillsJsonRaw();
    const skillMap = new Map(data.skills.map(s => [s.id, s]));

    it('ESCUDO_0/1/2 energy_cost devem alinhar com SKILL_DEFS (4/6/8)', () => {
        expect(skillMap.get('ESCUDO_0').energy_cost).toBe(4);
        expect(skillMap.get('ESCUDO_1').energy_cost).toBe(6);
        expect(skillMap.get('ESCUDO_2').energy_cost).toBe(8);
    });

    it('skills canônicas de Guerreiro devem ter power alinhado com SKILL_DEFS', () => {
        // SKILL_DEFS: Golpe de Espada stages 0/1/2 → power 14/20/28
        expect(skillMap.get('GOLPE_DE_ESPADA_0').power).toBe(14);
        expect(skillMap.get('GOLPE_DE_ESPADA_1').power).toBe(20);
        expect(skillMap.get('GOLPE_DE_ESPADA_2').power).toBe(28);
    });

    it('skills canônicas de Mago devem ter power alinhado com SKILL_DEFS', () => {
        // SKILL_DEFS: Magia Elemental stages 0/1/2 → power 15/20/28
        expect(skillMap.get('MAGIA_ELEMENTAL_0').power).toBe(15);
        expect(skillMap.get('MAGIA_ELEMENTAL_1').power).toBe(20);
        expect(skillMap.get('MAGIA_ELEMENTAL_2').power).toBe(28);
        // SKILL_DEFS: Explosão Elemental stages 0/1/2 → power 18/26/34
        expect(skillMap.get('EXPLOSAO_ELEMENTAL_0').power).toBe(18);
        expect(skillMap.get('EXPLOSAO_ELEMENTAL_1').power).toBe(26);
        expect(skillMap.get('EXPLOSAO_ELEMENTAL_2').power).toBe(34);
    });

    it('skills canônicas de Bárbaro devem ter power alinhado com SKILL_DEFS', () => {
        // SKILL_DEFS: Golpe Brutal stages 0/1/2 → power 18/26/34
        expect(skillMap.get('GOLPE_BRUTAL_0').power).toBe(18);
        expect(skillMap.get('GOLPE_BRUTAL_1').power).toBe(26);
        expect(skillMap.get('GOLPE_BRUTAL_2').power).toBe(34);
    });

    it('FURIA_0/1/2 devem ter debuffType e debuffPower (Fúria tem self-debuff)', () => {
        expect(skillMap.get('FURIA_0').debuffType).toBe('DEF');
        expect(skillMap.get('FURIA_0').debuffPower).toBe(-1);
        expect(skillMap.get('FURIA_1').debuffPower).toBe(-2);
        expect(skillMap.get('FURIA_2').debuffPower).toBe(-2);
    });

    it('ENFRAQUECER_1/2 devem ter power negativo (debuff)', () => {
        expect(skillMap.get('ENFRAQUECER_1').power).toBe(-2);
        expect(skillMap.get('ENFRAQUECER_2').power).toBe(-3);
    });

    it('ARMADILHA_1/2 devem ter power negativo (debuff SPD)', () => {
        expect(skillMap.get('ARMADILHA_1').power).toBe(-2);
        expect(skillMap.get('ARMADILHA_2').power).toBe(-3);
    });

    it('skills devem ter campos FASE A (groupKey e stageIndex)', () => {
        expect(skillMap.get('ESCUDO_0').groupKey).toBe('Escudo');
        expect(skillMap.get('ESCUDO_0').stageIndex).toBe(0);
        expect(skillMap.get('ESCUDO_1').stageIndex).toBe(1);
        expect(skillMap.get('ESCUDO_2').stageIndex).toBe(2);
        expect(skillMap.get('PROVOCAR_1').stageIndex).toBe(1);
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

// ──────────────────────────────────────────────────────────────────────────────
// Testes para as novas skills adicionadas na AÇÃO 1 (11 novas skills)
// ──────────────────────────────────────────────────────────────────────────────

describe('Skills JSON — Novas Skills AÇÃO 1', () => {
    const data = loadSkillsJsonRaw();
    const skillMap = new Map(data.skills.map(s => [s.id, s]));

    // Guerreiro: PROVOCAR_0
    it('PROVOCAR_0 deve existir e ter stage 0 com TAUNT', () => {
        expect(skillMap.has('PROVOCAR_0')).toBe(true);
        const s = skillMap.get('PROVOCAR_0');
        expect(s.class).toBe('Guerreiro');
        expect(s.stageIndex).toBe(0);
        expect(s.type).toBe('TAUNT');
        expect(s.tier).toBe(1);
    });

    // Ladino: Sombra Evasiva (3 stages)
    it('SOMBRA_EVASIVA_0/1/2 devem existir com BUFF SPD', () => {
        for (const stage of [0, 1, 2]) {
            const id = `SOMBRA_EVASIVA_${stage}`;
            expect(skillMap.has(id), `${id} deve existir`).toBe(true);
            const s = skillMap.get(id);
            expect(s.class).toBe('Ladino');
            expect(s.stageIndex).toBe(stage);
            expect(s.type).toBe('BUFF');
            expect(s.buffType).toBe('SPD');
        }
    });

    // Caçador: ARMADILHA_0
    it('ARMADILHA_0 deve existir e ter stage 0', () => {
        expect(skillMap.has('ARMADILHA_0')).toBe(true);
        const s = skillMap.get('ARMADILHA_0');
        expect(s.class).toBe('Caçador');
        expect(s.stageIndex).toBe(0);
        expect(s.power).toBe(-2);
        expect(s.tier).toBe(1);
    });

    // Curandeiro: Purificação (stage 1 e 2)
    it('PURIFICACAO_1/2 devem existir com HEAL e cleanse', () => {
        for (const stage of [1, 2]) {
            const id = `PURIFICACAO_${stage}`;
            expect(skillMap.has(id), `${id} deve existir`).toBe(true);
            const s = skillMap.get(id);
            expect(s.class).toBe('Curandeiro');
            expect(s.stageIndex).toBe(stage);
            expect(s.type).toBe('HEAL');
            expect(s.cleanse).toBeGreaterThan(0);
        }
    });

    // Bárbaro: Grito de Guerra (stage 1 e 2)
    it('GRITO_DE_GUERRA_1/2 devem existir com BUFF ATK para área', () => {
        for (const stage of [1, 2]) {
            const id = `GRITO_DE_GUERRA_${stage}`;
            expect(skillMap.has(id), `${id} deve existir`).toBe(true);
            const s = skillMap.get(id);
            expect(s.class).toBe('Bárbaro');
            expect(s.stageIndex).toBe(stage);
            expect(s.type).toBe('BUFF');
            expect(s.target).toBe('Todos_Aliados');
        }
    });

    // Animalista: Simbiose Natural (stage 1 e 2)
    it('SIMBIOSE_NATURAL_1/2 devem existir com DAMAGE e selfHeal', () => {
        for (const stage of [1, 2]) {
            const id = `SIMBIOSE_NATURAL_${stage}`;
            expect(skillMap.has(id), `${id} deve existir`).toBe(true);
            const s = skillMap.get(id);
            expect(s.class).toBe('Animalista');
            expect(s.stageIndex).toBe(stage);
            expect(s.type).toBe('DAMAGE');
            expect(s.selfHeal).toBeGreaterThan(0);
        }
    });

    // Total de skills por classe — AÇÃO 1 completa
    it('cada classe deve ter exatamente o número correto de skills', () => {
        const expected = {
            'Guerreiro':  9,  // 3 grupos × 3 stages
            'Mago':       9,  // 3 grupos × 3 stages
            'Bardo':      9,  // 3 grupos × 3 stages
            'Curandeiro': 8,  // grupo 3 não tem stage 0 (2+3+3)
            'Bárbaro':    8,  // grupo 3 não tem stage 0 (3+3+2)
            'Ladino':     8,  // grupo 3 não tem stage 0 (3+3+2)
            'Caçador':    6,  // 2 grupos × 3 stages (ARMADILHA disponível desde stage 0; 3ª linha não implementada nesta fase)
            'Animalista': 8,  // grupo 3 não tem stage 0 (3+3+2)
        };
        const classCounts = {};
        for (const s of data.skills) {
            classCounts[s.class] = (classCounts[s.class] || 0) + 1;
        }
        for (const [cls, count] of Object.entries(expected)) {
            expect(classCounts[cls], `${cls} deve ter ${count} skills`).toBe(count);
        }
    });
});
