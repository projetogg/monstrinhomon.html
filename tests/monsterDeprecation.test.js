import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    isMonsterAvailableForNewContent,
    isMonsterIdAvailableForNewContent,
    clearCache,
    loadMonsters
} from '../js/data/dataLoader.js';
import { getCapturedCount } from '../js/data/partyDex.js';
import { getDexProgress } from '../js/ui/partyDexUI.js';

function readJson(relativePath) {
    return JSON.parse(readFileSync(join(process.cwd(), relativePath), 'utf-8'));
}

describe('Descontinuação de templates de monstro', () => {
    const monsters = readJson('data/monsters.json').monsters;
    const locations = readJson('data/locations.json').locations;
    const encounterTemplates = readJson('data/encounterTemplates.json').templates;
    const legacyTemplate = monsters.find(monster => monster.id === 'MON_100');

    afterEach(() => {
        clearCache();
        vi.unstubAllGlobals();
    });

    it('preserva MON_100 no catálogo para compatibilidade de saves', () => {
        expect(legacyTemplate).toBeDefined();
        expect(legacyTemplate.name).toBe('Rato-de-Lama');
        expect(legacyTemplate.deprecated).toBe(true);
    });

    it('classifica MON_100 como indisponível para conteúdo novo', () => {
        expect(isMonsterAvailableForNewContent(legacyTemplate)).toBe(false);
        expect(isMonsterAvailableForNewContent(monsters.find(monster => monster.id === 'MON_001'))).toBe(true);

        const monstersMap = new Map(monsters.map(monster => [monster.id, monster]));
        expect(isMonsterIdAvailableForNewContent('MON_100', monstersMap)).toBe(false);
        expect(isMonsterIdAvailableForNewContent('MON_001', monstersMap)).toBe(true);
        expect(isMonsterIdAvailableForNewContent('MON_UNKNOWN', monstersMap)).toBe(false);

        const callbackResult = ['MON_001'].filter(isMonsterIdAvailableForNewContent);
        expect(callbackResult).toEqual([]);
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
        expect(indexSource).toContain('isMonsterIdAvailableForNewContent');
    });

    it('ignora MON_100 nos contadores reais após carregar o catálogo', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ version: 1, monsters })
        }));
        await loadMonsters();

        const state = {
            partyDex: {
                entries: {
                    'MON_001': { seen: true, captured: true },
                    'MON_100': { seen: true, captured: true }
                },
                meta: { lastMilestoneAwarded: 0 }
            },
            partyMoney: 0
        };

        expect(getCapturedCount(state)).toBe(1);
        expect(getDexProgress(state).capturedCount).toBe(1);
        expect(state.partyDex.entries['MON_100'].captured).toBe(true);
    });

    it('falha fechado enquanto o catálogo ainda não foi carregado', () => {
        clearCache();

        expect(isMonsterIdAvailableForNewContent('MON_001')).toBe(false);
        expect(isMonsterIdAvailableForNewContent('MON_100')).toBe(false);
    });
});
