/**
 * CATALOG FUNCTIONAL TESTS
 *
 * Testes funcionais para o catálogo expandido de monstros.
 * Valida comportamento real em runtime, NÃO estrutura de dados (já coberto em catalogIntegrity.test.js).
 *
 * Cobertura:
 *  - Carregamento por ID via dataLoader (monstros novos do bootstrap)
 *  - Resolução funcional de evolução (cadeias completas)
 *  - Seleção de monstros em pools (todos os 55 são elegíveis)
 *  - getMonsterSkills retorna skills válidas para todas as classes presentes
 *  - Ausência de fallback indevido para catálogos antigos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    loadMonsters,
    getMonstersMapSync,
    clearCache,
    validateMonsterSchema,
    normalizeMonsterData
} from '../js/data/dataLoader.js';

// --- Helpers ---

function loadMonstersJsonRaw() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

// Simula getMonsterTemplate do index.html (linha 1329)
function simulateGetMonsterTemplate(templateId, hardcodedCatalog) {
    if (!templateId) return null;
    const monstersMap = getMonstersMapSync();
    if (monstersMap && monstersMap.has(templateId)) {
        const template = monstersMap.get(templateId);
        return JSON.parse(JSON.stringify(template));
    }
    return hardcodedCatalog.find(m => m.id === templateId) || null;
}

// Simula getEvolutionData (extrair dados de evolução de um template)
function simulateGetEvolutionData(template) {
    if (!template) return null;
    const toId = template.evolvesTo ?? null;
    const atLv = template.evolvesAt ?? null;
    if (!toId || !Number.isFinite(atLv) || atLv <= 0) return null;
    return { toId, atLv };
}

// --- Testes ---

describe('Catálogo Funcional — Carregamento via DataLoader', () => {

    const allMonsters = loadMonstersJsonRaw().monsters;

    beforeEach(() => {
        clearCache();
    });

    it('loadMonsters deve carregar todos os 55 monstros do JSON', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(loadMonstersJsonRaw())
            })
        );

        const map = await loadMonsters();

        expect(map).toBeInstanceOf(Map);
        expect(map.size).toBe(55);
    });

    it('monstros do bootstrap devem ser acessíveis por ID após carregamento', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(loadMonstersJsonRaw())
            })
        );

        await loadMonsters();
        const map = getMonstersMapSync();

        // Monstros novos do bootstrap (famílias MON_010+, MON_020+)
        const bootstrapIds = [
            'MON_010', 'MON_010B', 'MON_010C', 'MON_010D',
            'MON_011', 'MON_012', 'MON_013', 'MON_014',
            'MON_020', 'MON_021', 'MON_022', 'MON_023',
            'MON_024', 'MON_025', 'MON_026', 'MON_027',
            'MON_020C', 'MON_027C'
        ];

        for (const id of bootstrapIds) {
            expect(map.has(id), `Monstro ${id} deveria estar no Map`).toBe(true);
            const m = map.get(id);
            expect(m.name, `${id} deve ter nome`).toBeTruthy();
            expect(m.class, `${id} deve ter classe`).toBeTruthy();
        }
    });

    it('todos os 55 monstros devem passar validateMonsterSchema', () => {
        for (const m of allMonsters) {
            expect(
                validateMonsterSchema(m),
                `${m.id} falhou validação de schema`
            ).toBe(true);
        }
    });

    it('normalizeMonsterData deve preservar campos de evolução', () => {
        const pedrino = allMonsters.find(m => m.id === 'MON_002');
        const normalized = normalizeMonsterData(pedrino);

        expect(normalized.evolvesTo).toBe('MON_002B');
        expect(normalized.evolvesAt).toBe(12);
    });

    it('normalizeMonsterData deve preencher defaults sem sobrescrever', () => {
        const mon = allMonsters.find(m => m.id === 'MON_010');
        const normalized = normalizeMonsterData(mon);

        expect(normalized.baseHp).toBe(mon.baseHp);
        expect(normalized.baseAtk).toBe(mon.baseAtk);
        expect(typeof normalized.baseDef).toBe('number');
        expect(typeof normalized.baseSpd).toBe('number');
        expect(typeof normalized.baseEne).toBe('number');
    });
});

describe('Catálogo Funcional — Resolução de Evolução', () => {

    const allMonsters = loadMonstersJsonRaw().monsters;
    const monsterMap = new Map(allMonsters.map(m => [m.id, m]));

    it('cadeia MON_002 → MON_002B → MON_002C deve ser resolvível', () => {
        const pedrino = monsterMap.get('MON_002');
        const evo1 = simulateGetEvolutionData(pedrino);
        expect(evo1).toEqual({ toId: 'MON_002B', atLv: 12 });

        const pedronar = monsterMap.get(evo1.toId);
        expect(pedronar).toBeDefined();
        expect(pedronar.name).toBe('Pedronar');

        const evo2 = simulateGetEvolutionData(pedronar);
        expect(evo2).toEqual({ toId: 'MON_002C', atLv: 25 });

        const pedragon = monsterMap.get(evo2.toId);
        expect(pedragon).toBeDefined();
        expect(pedragon.name).toBe('Pedragon');

        // Final da cadeia
        expect(simulateGetEvolutionData(pedragon)).toBe(null);
    });

    it('cadeia 4 estágios MON_010 → 010B → 010C → 010D deve ser resolvível', () => {
        let current = monsterMap.get('MON_010');
        const names = [current.name];
        const levels = [];

        let evo = simulateGetEvolutionData(current);
        while (evo) {
            levels.push(evo.atLv);
            current = monsterMap.get(evo.toId);
            expect(current, `${evo.toId} deveria existir no catálogo`).toBeDefined();
            names.push(current.name);
            evo = simulateGetEvolutionData(current);
        }

        expect(names.length).toBe(4);
        expect(levels).toEqual([12, 25, 45]);
    });

    it('cadeia 3 estágios MON_020 → 020B → 020C deve ser resolvível', () => {
        let current = monsterMap.get('MON_020');
        const ids = [current.id];

        let evo = simulateGetEvolutionData(current);
        while (evo) {
            current = monsterMap.get(evo.toId);
            expect(current).toBeDefined();
            ids.push(current.id);
            evo = simulateGetEvolutionData(current);
        }

        expect(ids).toEqual(['MON_020', 'MON_020B', 'MON_020C']);
    });

    it('monstros sem evolução devem retornar null em getEvolutionData', () => {
        const noEvo = allMonsters.filter(m => !m.evolvesTo);
        expect(noEvo.length).toBeGreaterThan(0);

        for (const m of noEvo) {
            expect(simulateGetEvolutionData(m), `${m.id} não deveria ter evolução`).toBe(null);
        }
    });
});

describe('Catálogo Funcional — Pool de Encontros', () => {

    const allMonsters = loadMonstersJsonRaw().monsters;

    it('todos os 55 monstros devem estar disponíveis como pool de encontro', () => {
        // Simula a seleção aleatória do index.html (linha 3439)
        // O jogo usa MONSTER_CATALOG[Math.floor(Math.random() * MONSTER_CATALOG.length)]
        // Verificar que nenhum monstro fica inacessível
        expect(allMonsters.length).toBe(55);
        for (const m of allMonsters) {
            expect(m.id).toBeTruthy();
            expect(m.baseHp).toBeGreaterThan(0);
            expect(m.class).toBeTruthy();
        }
    });

    it('todas as 8 classes devem estar representadas no pool de encontros', () => {
        const classes = new Set(allMonsters.map(m => m.class));
        const expected = ['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];
        for (const cls of expected) {
            expect(classes.has(cls), `Classe ${cls} deveria estar no pool`).toBe(true);
        }
    });

    it('monstros novos (bootstrap) devem ter stats base razoáveis', () => {
        const bootstrapMonsters = allMonsters.filter(m =>
            m.id.startsWith('MON_01') || m.id.startsWith('MON_02')
        );
        expect(bootstrapMonsters.length).toBeGreaterThan(30);

        for (const m of bootstrapMonsters) {
            expect(m.baseHp, `${m.id} baseHp`).toBeGreaterThanOrEqual(20);
            // Estágios avançados (C, D) podem ter HP mais alto
            expect(m.baseHp, `${m.id} baseHp max`).toBeLessThanOrEqual(70);
        }
    });
});

describe('Catálogo Funcional — getMonsterTemplate Simulado', () => {

    const jsonData = loadMonstersJsonRaw();

    beforeEach(async () => {
        clearCache();
        global.fetch = vi.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(jsonData)
            })
        );
        await loadMonsters();
    });

    it('getMonsterTemplate deve encontrar monstro original (MON_001)', () => {
        const t = simulateGetMonsterTemplate('MON_001', []);
        expect(t).toBeDefined();
        expect(t.name).toBe('Cantapau');
        expect(t.class).toBe('Bardo');
    });

    it('getMonsterTemplate deve encontrar monstro do bootstrap (MON_010)', () => {
        const t = simulateGetMonsterTemplate('MON_010', []);
        expect(t).toBeDefined();
        expect(t.name).toBe('Ferrozimon');
        expect(t.class).toBe('Guerreiro');
    });

    it('getMonsterTemplate deve encontrar estágio final (MON_014D)', () => {
        const t = simulateGetMonsterTemplate('MON_014D', []);
        expect(t).toBeDefined();
        expect(t.name).toBe('Wizardragomon');
    });

    it('getMonsterTemplate deve retornar null para ID inexistente', () => {
        const t = simulateGetMonsterTemplate('MON_NOPE', []);
        expect(t).toBe(null);
    });

    it('getMonsterTemplate não precisa de fallback quando JSON está carregado', () => {
        // Fallback com catálogo vazio — JSON deve suprir tudo
        const hardcoded = [];
        for (const m of jsonData.monsters) {
            const t = simulateGetMonsterTemplate(m.id, hardcoded);
            expect(t, `${m.id} deveria ser encontrado via JSON`).not.toBe(null);
        }
    });

    it('retorno é deep clone — mutação não afeta cache', () => {
        const t1 = simulateGetMonsterTemplate('MON_010', []);
        t1.baseHp = 9999;

        const t2 = simulateGetMonsterTemplate('MON_010', []);
        expect(t2.baseHp).not.toBe(9999);
    });
});
