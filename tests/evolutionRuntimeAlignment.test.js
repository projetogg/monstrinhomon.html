/**
 * EVOLUTION RUNTIME ALIGNMENT TESTS
 *
 * Diagnóstico arquitetural para evitar falso positivo entre módulos de evolução.
 * Cobertura:
 * - módulo ativo em runtime (index.html)
 * - cobertura de testes por módulo
 * - diferenças de regra entre data/progression
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { executeEvolution } from '../js/data/evolutionSystem.js';
import { applyEvolution } from '../js/progression/evolutionSystem.js';

function readIndexHtmlContent() {
    return readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
}

function readXpActionsContent() {
    return readFileSync(resolve(process.cwd(), 'js/progression/xpActions.js'), 'utf8');
}

function getTestFileNames() {
    const testsDir = resolve(process.cwd(), 'tests');
    return readdirSync(testsDir).filter(name => name.endsWith('.test.js'));
}

describe('Evolução — alinhamento entre runtime e testes', () => {
    it('runtime importa o módulo js/data/evolutionSystem.js e delega executeEvolution', () => {
        const indexHtml = readIndexHtmlContent();

        expect(indexHtml).toMatch(/import\s+\*\s+as\s+EvolutionSystem\s+from\s+['"]\.\/js\/data\/evolutionSystem\.js['"]/);
        expect(indexHtml).not.toContain("./js/progression/evolutionSystem.js");
        expect(indexHtml).toMatch(/window\.EvolutionSystem\.executeEvolution\s*\(\s*mon\s*,\s*nextTemplate/);
    });

    it('fluxo de level up em runtime injeta maybeEvolveAfterLevelUp nas ações de XP', () => {
        const indexHtml = readIndexHtmlContent();
        const xpActions = readXpActionsContent();

        expect(indexHtml).toMatch(/maybeEvolveAfterLevelUp\s*:\s*maybeEvolveAfterLevelUp/);
        expect(xpActions).toContain('deps.helpers.maybeEvolveAfterLevelUp(mon, log, hpPctBeforeLevelUp);');
    });

    it('suíte cobre os dois módulos (data como runtime e progression como legado)', () => {
        const files = getTestFileNames();
        const filesImportingData = [];
        const filesImportingProgression = [];

        for (const file of files) {
            const content = readFileSync(resolve(process.cwd(), 'tests', file), 'utf8');
            if (content.includes("../js/data/evolutionSystem.js")) {
                filesImportingData.push(file);
            }
            if (content.includes("../js/progression/evolutionSystem.js")) {
                filesImportingProgression.push(file);
            }
        }

        expect(filesImportingData.length).toBeGreaterThan(0);
        expect(filesImportingProgression.length).toBeGreaterThan(0);
    });

    it('deve documentar diferenças entre módulos data e progression', () => {
        const sharedBaseMonster = {
            name: 'BaseMon',
            class: 'Guerreiro',
            rarity: 'Comum',
            level: 10,
            hp: 20,
            hpMax: 40,
            atk: 10,
            def: 8,
            spd: 6,
            ene: 5,
            eneMax: 7,
            evolvesTo: 'm_testevo',
            evolvesAt: 10,
            buffs: [{ type: 'atk', power: 1 }],
        };
        const baseMonsterData = {
            // data/evolutionSystem.js trabalha com identificação por monsterId/templateId.
            ...sharedBaseMonster,
            monsterId: 'm_testbase',
        };
        const baseMonsterProgression = {
            // progression/evolutionSystem.js foi escrito para fixtures com id de instância.
            ...sharedBaseMonster,
            id: 'mi_test',
        };
        const baseTemplate = {
            id: 'm_testevo',
            name: 'EvoMon',
            class: 'Guerreiro',
            rarity: 'Incomum',
            baseHp: 60,
            evolvesTo: null,
            evolvesAt: null,
        };
        const templateData = {
            ...baseTemplate,
        };
        const templateProgression = {
            ...baseTemplate,
            // progression exige bases explícitas para validar boost de stats.
            baseAtk: 12,
            baseDef: 9,
            baseSpd: 7,
            baseEne: 8,
        };
        
        expect(() => executeEvolution(baseMonsterData, templateData)).not.toThrow();
        expect(() => applyEvolution(baseMonsterProgression, templateProgression)).not.toThrow();

        // 20/40 = 50% antes da evolução; o módulo data deve preservar este HP%.
        expect(baseMonsterData.hp / baseMonsterData.hpMax).toBeCloseTo(0.5, 1);
        expect(baseMonsterProgression.hp).toBe(baseMonsterProgression.hpMax);

        expect(baseMonsterData.atk).toBe(10);
        expect(baseMonsterProgression.atk).toBeGreaterThan(10);

        expect(baseMonsterData.buffs).toEqual([{ type: 'atk', power: 1 }]);
        expect(baseMonsterProgression.buffs).toEqual([]);
    });

    it('regra canônica atual: index recalcula stats fora do módulo de dados após executeEvolution', () => {
        const indexHtml = readIndexHtmlContent();

        expect(indexHtml).toContain('window.EvolutionSystem.executeEvolution(mon, nextTemplate');
        expect(indexHtml).toContain('recalculateStatsFromTemplate(mon);');
    });
});
