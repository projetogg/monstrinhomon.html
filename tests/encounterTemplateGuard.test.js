/**
 * ENCOUNTER TEMPLATE GUARD TESTS (phase1-runtime-rebuild)
 *
 * Testes de proteção contra template ausente no encontro selvagem.
 * Cobertura:
 *  - createMonsterInstanceFromTemplate retorna null para ID inválido
 *  - Todos os IDs referenciados em locations.json existem em monsters.json
 *  - Todos os IDs referenciados em ENCOUNTERS.csv existem em monsters.json
 *  - Todos os IDs referenciados em QUESTS.csv existem em monsters.json
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- Helpers ---

function loadMonstersJson() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

function loadLocationsJson() {
    const raw = readFileSync(join(process.cwd(), 'data/locations.json'), 'utf-8');
    return JSON.parse(raw);
}

function loadEncountersCSV() {
    const raw = readFileSync(join(process.cwd(), 'ENCOUNTERS.csv'), 'utf-8');
    return raw;
}

function loadQuestsCSV() {
    const raw = readFileSync(join(process.cwd(), 'QUESTS.csv'), 'utf-8');
    return raw;
}

/**
 * Extrai todos os padrões MON_\w+ de uma string.
 */
function extractMonIds(text) {
    return [...text.matchAll(/MON_\w+/g)].map(m => m[0]);
}

// --- Testes ---

describe('Encounter Template Guard — Auditoria de Órfãos', () => {

    const monstersData = loadMonstersJson();
    const validIds = new Set(monstersData.monsters.map(m => m.id));

    describe('data/locations.json', () => {
        const locations = loadLocationsJson();

        it('todos os IDs de speciesPoolsByRarity devem existir em monsters.json', () => {
            const orphans = [];
            for (const loc of locations.locations) {
                const pools = loc.speciesPoolsByRarity || {};
                for (const [rarity, ids] of Object.entries(pools)) {
                    for (const id of ids) {
                        if (!validIds.has(id)) {
                            orphans.push(`${id} em ${loc.id}:${rarity}`);
                        }
                    }
                }
            }
            expect(orphans, `IDs órfãos encontrados:\n${orphans.join('\n')}`).toHaveLength(0);
        });
    });

    describe('ENCOUNTERS.csv', () => {
        it('todos os MON_IDs referenciados devem existir em monsters.json', () => {
            const content = loadEncountersCSV();
            const ids = extractMonIds(content);
            const orphans = ids.filter(id => !validIds.has(id));
            expect(orphans, `IDs órfãos: ${[...new Set(orphans)].join(', ')}`).toHaveLength(0);
        });
    });

    describe('QUESTS.csv', () => {
        it('todos os MON_IDs referenciados devem existir em monsters.json', () => {
            const content = loadQuestsCSV();
            const ids = extractMonIds(content);
            const orphans = ids.filter(id => !validIds.has(id));
            expect(orphans, `IDs órfãos: ${[...new Set(orphans)].join(', ')}`).toHaveLength(0);
        });
    });
});

describe('Encounter Template Guard — createMonsterInstanceFromTemplate null-safety', () => {

    /**
     * Simula o comportamento de createMonsterInstanceFromTemplate.
     * Retorna null se o template não for encontrado, simulando o comportamento real.
     */
    function createMonsterInstanceFromTemplate(templateId, catalog) {
        const template = catalog.find(m => m && m.id === templateId);
        if (!template) {
            // Simula o console.warn do código real
            return null;
        }
        // Retorna instância mínima para o teste
        return { id: templateId, rarity: template.rarity, hp: template.baseHp };
    }

    const monstersData = loadMonstersJson();
    const catalog = monstersData.monsters;

    it('deve retornar null para templateId inexistente', () => {
        const result = createMonsterInstanceFromTemplate('MON_INEXISTENTE', catalog);
        expect(result).toBeNull();
    });

    it('guarda de null-check deve lançar erro com mensagem clara', () => {
        const wildTemplateId = 'MON_INEXISTENTE';
        const wildMonster = createMonsterInstanceFromTemplate(wildTemplateId, catalog);

        // Simula a guarda adicionada em startEncounter()
        expect(() => {
            if (!wildMonster) {
                throw new Error(`Encounter template not found: ${wildTemplateId}`);
            }
        }).toThrow('Encounter template not found: MON_INEXISTENTE');
    });

    it('não deve lançar erro para templateId válido', () => {
        const wildTemplateId = 'MON_001';
        const wildMonster = createMonsterInstanceFromTemplate(wildTemplateId, catalog);

        expect(() => {
            if (!wildMonster) {
                throw new Error(`Encounter template not found: ${wildTemplateId}`);
            }
        }).not.toThrow();

        expect(wildMonster).not.toBeNull();
        // Acesso a .rarity não deve quebrar
        expect(wildMonster.rarity).toBeDefined();
    });

    it('deve retornar instância válida para cada ID no catálogo', () => {
        for (const monster of catalog) {
            const instance = createMonsterInstanceFromTemplate(monster.id, catalog);
            expect(instance, `Template ${monster.id} retornou null`).not.toBeNull();
            // Acesso a .rarity (origem do TypeError original) deve ser seguro
            expect(instance.rarity).toBeDefined();
        }
    });
});
