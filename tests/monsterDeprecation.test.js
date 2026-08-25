import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { isMonsterAvailableForNewContent } from '../js/data/dataLoader.js';

function readJson(relativePath) {
    return JSON.parse(readFileSync(join(process.cwd(), relativePath), 'utf-8'));
}

describe('Descontinuação de templates de monstro', () => {
    const monsters = readJson('data/monsters.json').monsters;
    const locations = readJson('data/locations.json').locations;
    const encounterTemplates = readJson('data/encounterTemplates.json').templates;
    const legacyTemplate = monsters.find(monster => monster.id === 'MON_100');

    it('preserva MON_100 no catálogo para compatibilidade de saves', () => {
        expect(legacyTemplate).toBeDefined();
        expect(legacyTemplate.name).toBe('Rato-de-Lama');
        expect(legacyTemplate.deprecated).toBe(true);
    });

    it('classifica MON_100 como indisponível para conteúdo novo', () => {
        expect(isMonsterAvailableForNewContent(legacyTemplate)).toBe(false);
        expect(isMonsterAvailableForNewContent(monsters.find(monster => monster.id === 'MON_001'))).toBe(true);
    });

    it('remove MON_100 de todos os pools e templates de encontro', () => {
        const locationPoolIds = locations.flatMap(location =>
            Object.values(location.speciesPoolsByRarity || {}).flat()
        );
        const templateMonsterIds = encounterTemplates.flatMap(template => template.monsters || []);
        const encounterCsv = readFileSync(join(process.cwd(), 'ENCOUNTERS.csv'), 'utf-8');

        expect(locationPoolIds).not.toContain('MON_100');
        expect(templateMonsterIds).not.toContain('MON_100');
        expect(encounterCsv).not.toContain('MON_100');
    });

    it('aplica o filtro canônico nas listagens e seleções do cliente', () => {
        const indexSource = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');
        const filterUsages = indexSource.match(/isMonsterAvailableForNewContent/g) || [];

        expect(filterUsages.length).toBeGreaterThanOrEqual(3);
    });
});
