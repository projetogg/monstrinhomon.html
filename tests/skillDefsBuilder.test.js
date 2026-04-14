/**
 * SKILL DEFS BUILDER TESTS (FASE A)
 *
 * Testes para buildRuntimeSkillDefs() em skillsLoader.js
 */
import { describe, it, expect } from 'vitest';
import { buildRuntimeSkillDefs } from '../js/data/skillsLoader.js';

// Dados mínimos para testes do builder
const MINIMAL_SKILLS = [
    { id: 'ESCUDO_0', name: 'Escudo I', class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 0,
      type: 'BUFF', category: 'Suporte', power: 2, accuracy: 1, energy_cost: 4,
      target: 'Self', desc: 'Escudo.', buffType: 'DEF', duration: 2, tier: 1 },
    { id: 'ESCUDO_1', name: 'Escudo II', class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 1,
      type: 'BUFF', category: 'Suporte', power: 3, accuracy: 1, energy_cost: 6,
      target: 'Self', desc: 'Escudo forte.', buffType: 'DEF', duration: 2, tier: 2 },
    { id: 'ESCUDO_2', name: 'Escudo III', class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 2,
      type: 'BUFF', category: 'Suporte', power: 4, accuracy: 1, energy_cost: 8,
      target: 'Self', desc: 'Escudo poderoso.', buffType: 'DEF', duration: 3, tier: 3 },
    { id: 'PROVOCAR_1', name: 'Provocar I', class: 'Guerreiro', groupKey: 'Provocar', stageIndex: 1,
      type: 'TAUNT', category: 'Controle', power: 0, accuracy: 1, energy_cost: 4,
      target: 'Inimigo', desc: 'Provoca.', tier: 2 },
    { id: 'CURA_0', name: 'Cura I', class: 'Curandeiro', groupKey: 'Cura', stageIndex: 0,
      type: 'HEAL', category: 'Cura', power: 15, accuracy: 1, energy_cost: 5,
      target: 'Aliado', desc: 'Cura leve.', tier: 1 },
];

describe('buildRuntimeSkillDefs', () => {
    describe('estrutura básica', () => {
        it('deve retornar objeto vazio para array vazio', () => {
            const result = buildRuntimeSkillDefs([]);
            expect(result).toEqual({});
        });
        it('deve retornar objeto vazio para input null', () => {
            expect(buildRuntimeSkillDefs(null)).toEqual({});
        });
        it('deve retornar objeto vazio para input undefined', () => {
            expect(buildRuntimeSkillDefs(undefined)).toEqual({});
        });
        it('deve criar estrutura correta por classe e groupKey', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']).toBeDefined();
            expect(result['Guerreiro']['Escudo']).toBeDefined();
            expect(result['Curandeiro']).toBeDefined();
        });
    });

    describe('array de tiers por stage', () => {
        it('deve criar array de 3 elementos por grupo', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo']).toHaveLength(3);
        });
        it('deve colocar null quando stage não tem skill', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            // Provocar só tem stage 1 — stage 0 e 2 devem ser null
            expect(result['Guerreiro']['Provocar'][0]).toBeNull();
            expect(result['Guerreiro']['Provocar'][1]).not.toBeNull();
            expect(result['Guerreiro']['Provocar'][2]).toBeNull();
        });
        it('deve preencher stages corretos', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].name).toBe('Escudo I');
            expect(result['Guerreiro']['Escudo'][1].name).toBe('Escudo II');
            expect(result['Guerreiro']['Escudo'][2].name).toBe('Escudo III');
        });
    });

    describe('conversão de formato', () => {
        it('deve converter energy_cost para cost', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].cost).toBe(4);
        });
        it('deve converter target Inimigo para enemy', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Provocar'][1].target).toBe('enemy');
        });
        it('deve converter target Self para self', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].target).toBe('self');
        });
        it('deve converter target Aliado para ally', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Curandeiro']['Cura'][0].target).toBe('ally');
        });
        it('deve preservar buffType', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].buffType).toBe('DEF');
        });
        it('deve preservar duration', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].duration).toBe(2);
            expect(result['Guerreiro']['Escudo'][2].duration).toBe(3);
        });
        it('deve preservar type (BUFF/HEAL/DAMAGE/TAUNT)', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].type).toBe('BUFF');
            expect(result['Curandeiro']['Cura'][0].type).toBe('HEAL');
            expect(result['Guerreiro']['Provocar'][1].type).toBe('TAUNT');
        });
        it('deve calcular tier como stageIndex + 1', () => {
            const result = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            expect(result['Guerreiro']['Escudo'][0].tier).toBe(1);
            expect(result['Guerreiro']['Escudo'][1].tier).toBe(2);
            expect(result['Guerreiro']['Escudo'][2].tier).toBe(3);
        });
    });

    describe('debuff support (Fúria)', () => {
        it('deve preservar debuffType e debuffPower quando presentes', () => {
            const furiaSkills = [
                { id: 'FURIA_0', name: 'Fúria I', class: 'Bárbaro', groupKey: 'Fúria', stageIndex: 0,
                  type: 'BUFF', category: 'Suporte', power: 3, accuracy: 1, energy_cost: 4,
                  target: 'Self', desc: '', buffType: 'ATK', duration: 2,
                  debuffType: 'DEF', debuffPower: -1, tier: 1 }
            ];
            const result = buildRuntimeSkillDefs(furiaSkills);
            expect(result['Bárbaro']['Fúria'][0].debuffType).toBe('DEF');
            expect(result['Bárbaro']['Fúria'][0].debuffPower).toBe(-1);
        });
        it('deve aceitar power negativo (debuff skills)', () => {
            const debuffSkill = [
                { id: 'ENFRAQUECER_1', name: 'Enfraquecer I', class: 'Ladino', groupKey: 'Enfraquecer',
                  stageIndex: 1, type: 'BUFF', category: 'Suporte', power: -2, accuracy: 1,
                  energy_cost: 4, target: 'Inimigo', desc: 'Reduz ATK.', buffType: 'ATK', duration: 1, tier: 2 }
            ];
            const result = buildRuntimeSkillDefs(debuffSkill);
            expect(result['Ladino']['Enfraquecer'][1].power).toBe(-2);
        });
    });

    describe('Map input', () => {
        it('deve aceitar Map como input (do skillsCache)', () => {
            const map = new Map(MINIMAL_SKILLS.map(s => [s.id, s]));
            const result = buildRuntimeSkillDefs(map);
            expect(result['Guerreiro']).toBeDefined();
            expect(result['Guerreiro']['Escudo'][0].name).toBe('Escudo I');
        });
        it('deve produzir o mesmo resultado para Array e Map com os mesmos dados', () => {
            const map = new Map(MINIMAL_SKILLS.map(s => [s.id, s]));
            const fromArray = buildRuntimeSkillDefs(MINIMAL_SKILLS);
            const fromMap = buildRuntimeSkillDefs(map);
            expect(fromArray).toEqual(fromMap);
        });
    });

    describe('cobertura de classes do skills.json', () => {
        it('deve conter todas as 8 classes quando usando dados completos', async () => {
            const { readFile } = await import('fs/promises');
            const { fileURLToPath } = await import('url');
            const { dirname, join } = await import('path');
            const dir = dirname(fileURLToPath(import.meta.url));
            const raw = await readFile(join(dir, '../data/skills.json'), 'utf-8');
            const data = JSON.parse(raw);
            const result = buildRuntimeSkillDefs(data.skills);
            const expectedClasses = ['Guerreiro', 'Curandeiro', 'Mago', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];
            for (const cls of expectedClasses) {
                expect(result[cls], `classe ${cls} deve existir`).toBeDefined();
            }
        });
        it('deve ter 54 entradas no skills.json', async () => {
            const { readFile } = await import('fs/promises');
            const { fileURLToPath } = await import('url');
            const { dirname, join } = await import('path');
            const dir = dirname(fileURLToPath(import.meta.url));
            const raw = await readFile(join(dir, '../data/skills.json'), 'utf-8');
            const data = JSON.parse(raw);
            expect(data.skills).toHaveLength(54);
        });
    });
});
