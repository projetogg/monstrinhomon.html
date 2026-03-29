/**
 * CATALOG INTEGRITY TESTS
 *
 * Validação da integridade do catálogo expandido de monstros (64 monstros).
 * Cobertura:
 *  - Todos os monstros carregáveis com schema válido
 *  - Cadeias de evolução completas e sem referências quebradas
 *  - EVOLUCOES.csv alinhado com evolvesTo/evolvesAt no monsters.json
 *  - Sem IDs duplicados
 *  - Sem referências circulares de evolução
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- Helpers para carregar dados reais do repositório ---

function loadMonstersJson() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

function loadEvolucoesCSV() {
    const raw = readFileSync(join(process.cwd(), 'EVOLUCOES.csv'), 'utf-8');
    const lines = raw.trim().split('\n');
    const header = lines[0].split(',');
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const cols = line.split(',');
        const obj = {};
        header.forEach((h, i) => obj[h.trim()] = (cols[i] || '').trim());
        return obj;
    });
}

// --- Constantes de validação ---

const VALID_CLASSES = [
    'Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro',
    'Ladino', 'Bardo', 'Caçador', 'Animalista'
];

const VALID_RARITIES = [
    'Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'
];

// --- Testes ---

describe('Catálogo de Monstros - Integridade Geral', () => {

    const data = loadMonstersJson();
    const monsters = data.monsters;
    const monsterMap = new Map(monsters.map(m => [m.id, m]));

    it('deve ter estrutura JSON válida com array "monsters"', () => {
        expect(data).toBeDefined();
        expect(data.version).toBeDefined();
        expect(Array.isArray(data.monsters)).toBe(true);
    });

    it('deve conter 64 monstros no catálogo', () => {
        expect(monsters.length).toBe(64);
    });

    it('não deve ter IDs duplicados', () => {
        const ids = monsters.map(m => m.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('todos os monstros devem ter campos obrigatórios', () => {
        const required = ['id', 'name', 'class', 'rarity', 'baseHp'];
        for (const monster of monsters) {
            for (const field of required) {
                expect(monster[field], `${monster.id} falta campo "${field}"`).toBeDefined();
            }
        }
    });

    it('todos os monstros devem ter classe válida', () => {
        for (const monster of monsters) {
            expect(
                VALID_CLASSES.includes(monster.class),
                `${monster.id} tem classe inválida: "${monster.class}"`
            ).toBe(true);
        }
    });

    it('todos os monstros devem ter raridade válida', () => {
        for (const monster of monsters) {
            expect(
                VALID_RARITIES.includes(monster.rarity),
                `${monster.id} tem raridade inválida: "${monster.rarity}"`
            ).toBe(true);
        }
    });

    it('baseHp deve ser número positivo para todos', () => {
        for (const monster of monsters) {
            expect(typeof monster.baseHp).toBe('number');
            expect(monster.baseHp, `${monster.id} baseHp inválido`).toBeGreaterThan(0);
        }
    });

    it('IDs devem seguir o padrão MON_XXX', () => {
        for (const monster of monsters) {
            expect(
                monster.id.startsWith('MON_'),
                `ID "${monster.id}" não segue padrão MON_`
            ).toBe(true);
        }
    });
});

describe('Cadeias de Evolução - Integridade', () => {

    const data = loadMonstersJson();
    const monsters = data.monsters;
    const monsterMap = new Map(monsters.map(m => [m.id, m]));

    const monstersWithEvolution = monsters.filter(m => m.evolvesTo);

    it('deve ter pelo menos 30 monstros com evolução definida', () => {
        // 33 cadeias de evolução no CSV
        expect(monstersWithEvolution.length).toBeGreaterThanOrEqual(30);
    });

    it('evolvesTo deve apontar para IDs existentes no catálogo', () => {
        for (const monster of monstersWithEvolution) {
            expect(
                monsterMap.has(monster.evolvesTo),
                `${monster.id} evolui para "${monster.evolvesTo}" que não existe no catálogo`
            ).toBe(true);
        }
    });

    it('evolvesAt deve ser número positivo quando evolvesTo está presente', () => {
        for (const monster of monstersWithEvolution) {
            expect(
                typeof monster.evolvesAt,
                `${monster.id} evolvesAt deveria ser número`
            ).toBe('number');
            expect(
                monster.evolvesAt,
                `${monster.id} evolvesAt deve ser positivo`
            ).toBeGreaterThan(0);
        }
    });

    it('não deve haver referências circulares de evolução', () => {
        for (const start of monstersWithEvolution) {
            const visited = new Set();
            let current = start;
            while (current && current.evolvesTo) {
                if (visited.has(current.id)) {
                    // Referência circular detectada
                    expect.fail(
                        `Referência circular detectada: ${[...visited].join(' → ')} → ${current.id}`
                    );
                }
                visited.add(current.id);
                current = monsterMap.get(current.evolvesTo);
            }
        }
    });

    it('nível de evolução deve ser crescente dentro de cada cadeia', () => {
        // Encontrar monstros que são início de cadeia (ninguém evolui para eles)
        const evolvedTargets = new Set(monstersWithEvolution.map(m => m.evolvesTo));
        const chainStarts = monstersWithEvolution.filter(m => !evolvedTargets.has(m.id));

        for (const start of chainStarts) {
            let current = start;
            let prevLevel = 0;
            while (current && current.evolvesTo) {
                expect(
                    current.evolvesAt,
                    `${current.id} evolvesAt (${current.evolvesAt}) deve ser > ${prevLevel}`
                ).toBeGreaterThan(prevLevel);
                prevLevel = current.evolvesAt;
                current = monsterMap.get(current.evolvesTo);
            }
        }
    });

    it('evolução final de cada cadeia não deve ter evolvesTo', () => {
        for (const start of monstersWithEvolution) {
            let current = start;
            const visited = new Set();
            while (current && current.evolvesTo && !visited.has(current.id)) {
                visited.add(current.id);
                current = monsterMap.get(current.evolvesTo);
            }
            // O último monstro da cadeia não deve ter evolvesTo
            if (current) {
                expect(
                    current.evolvesTo,
                    `Final da cadeia ${current.id} não deveria ter evolvesTo`
                ).toBeFalsy();
            }
        }
    });
});

describe('EVOLUCOES.csv ↔ monsters.json - Sincronia', () => {

    const data = loadMonstersJson();
    const monsters = data.monsters;
    const monsterMap = new Map(monsters.map(m => [m.id, m]));
    const csvEntries = loadEvolucoesCSV();

    it('EVOLUCOES.csv deve ter exatamente 39 entradas', () => {
        expect(csvEntries.length).toBe(39);
    });

    it('cada entrada do CSV deve corresponder a evolvesTo/evolvesAt no JSON', () => {
        for (const entry of csvEntries) {
            const from = monsterMap.get(entry.from_monster_id);
            expect(from, `${entry.from_monster_id} não encontrado no catálogo`).toBeDefined();
            expect(
                from.evolvesTo,
                `${entry.from_monster_id} deveria ter evolvesTo=${entry.to_monster_id}`
            ).toBe(entry.to_monster_id);
            expect(
                from.evolvesAt,
                `${entry.from_monster_id} deveria ter evolvesAt=${entry.trigger_level}`
            ).toBe(Number(entry.trigger_level));
        }
    });

    it('cada evolvesTo no JSON deve ter entrada correspondente no CSV', () => {
        const csvPairs = new Set(csvEntries.map(e => `${e.from_monster_id}->${e.to_monster_id}`));

        const monstersWithEvolution = monsters.filter(m => m.evolvesTo);
        for (const monster of monstersWithEvolution) {
            const pair = `${monster.id}->${monster.evolvesTo}`;
            expect(
                csvPairs.has(pair),
                `${pair} está no JSON mas não no EVOLUCOES.csv`
            ).toBe(true);
        }
    });

    it('IDs from/to do CSV devem existir no catálogo de monstros', () => {
        for (const entry of csvEntries) {
            expect(
                monsterMap.has(entry.from_monster_id),
                `CSV from_id "${entry.from_monster_id}" não existe no catálogo`
            ).toBe(true);
            expect(
                monsterMap.has(entry.to_monster_id),
                `CSV to_id "${entry.to_monster_id}" não existe no catálogo`
            ).toBe(true);
        }
    });

    it('trigger_level do CSV deve ser número positivo', () => {
        for (const entry of csvEntries) {
            const level = Number(entry.trigger_level);
            expect(isNaN(level), `${entry.evo_id} trigger_level inválido`).toBe(false);
            expect(level, `${entry.evo_id} trigger_level deve ser positivo`).toBeGreaterThan(0);
        }
    });

    it('IDs de evolução no CSV devem ser únicos', () => {
        const evoIds = csvEntries.map(e => e.evo_id);
        const uniqueIds = new Set(evoIds);
        expect(uniqueIds.size).toBe(evoIds.length);
    });
});

describe('Distribuição de Classes e Raridades', () => {

    const data = loadMonstersJson();
    const monsters = data.monsters;

    it('todas as 8 classes devem estar representadas', () => {
        const classesPresent = new Set(monsters.map(m => m.class));
        for (const cls of VALID_CLASSES) {
            expect(
                classesPresent.has(cls),
                `Classe "${cls}" não tem nenhum monstro no catálogo`
            ).toBe(true);
        }
    });

    it('deve ter pelo menos 3 raridades diferentes', () => {
        const raritiesPresent = new Set(monsters.map(m => m.rarity));
        expect(raritiesPresent.size).toBeGreaterThanOrEqual(3);
    });

    it('raridade Comum deve ser a mais frequente', () => {
        const rarityCount = {};
        for (const m of monsters) {
            rarityCount[m.rarity] = (rarityCount[m.rarity] || 0) + 1;
        }
        const maxRarity = Object.entries(rarityCount)
            .sort((a, b) => b[1] - a[1])[0][0];
        expect(maxRarity).toBe('Comum');
    });
});
