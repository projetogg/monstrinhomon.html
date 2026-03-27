/**
 * ENCOUNTERS INTEGRITY TESTS (PR - Expansão de Encounters e Locais)
 *
 * Validação da integridade dos dados de encontros e locais.
 * Cobertura:
 *  - data/locations.json: esquema, pools, referências
 *  - LOCAIS.csv: presença e campos obrigatórios
 *  - ENCOUNTERS.csv: IDs de monstros existentes, sem referências quebradas
 *  - Coerência de progressão: raridade/estágio por nível recomendado
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- Helpers ---

function loadLocationsJson() {
    const raw = readFileSync(join(process.cwd(), 'data/locations.json'), 'utf-8');
    return JSON.parse(raw);
}

function loadMonstersJson() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

function parseCSV(filename) {
    const raw = readFileSync(join(process.cwd(), filename), 'utf-8');
    const lines = raw.trim().split('\n');
    const header = lines[0].split(',');
    // Parser simples: separa por vírgula respeitando aspas duplas
    function splitLine(line) {
        const cols = [];
        let current = '';
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; }
            else if (ch === ',' && !inQuotes) { cols.push(current); current = ''; }
            else { current += ch; }
        }
        cols.push(current);
        return cols;
    }
    return lines.slice(1).filter(l => l.trim()).map(line => {
        const cols = splitLine(line);
        const obj = {};
        header.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
        return obj;
    });
}

// Inferir estágio pelo sufixo do ID: sem sufixo=0, B=1, C=2, D=3
function getStageFromId(monsterId) {
    if (monsterId.endsWith('D')) return 3;
    if (monsterId.endsWith('C')) return 2;
    if (monsterId.endsWith('B')) return 1;
    return 0;
}

// Raridades ordenadas por poder
const RARITY_ORDER = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];

// Locais iniciais (nível 1-4): não devem ter estágios B/C/D ou raridades altas
const EARLY_LOCATION_IDS = ['LOC_001'];

// Locais de nível médio (5-18): podem ter estágio 0 e 1 (Comum e Incomum)
// Locais avançados (15+): podem ter estágio 0, 1 e 2 (até Raro)
// Locais finais (20+): podem ter estágio 0-3, raridades até Místico

// --- Testes ---

describe('data/locations.json - Estrutura e Esquema', () => {

    const data = loadLocationsJson();

    it('deve ter estrutura JSON válida com version e array "locations"', () => {
        expect(data).toBeDefined();
        expect(data.version).toBeDefined();
        expect(Array.isArray(data.locations)).toBe(true);
    });

    it('deve ter 8 locais definidos', () => {
        expect(data.locations.length).toBe(8);
    });

    it('todos os locais devem ter campos obrigatórios', () => {
        const required = ['id', 'name', 'description', 'biome', 'recommendedLevel', 'encounterPool'];
        for (const loc of data.locations) {
            for (const field of required) {
                expect(loc[field], `${loc.id} falta campo "${field}"`).toBeDefined();
            }
        }
    });

    it('todos os locais devem ter IDs únicos', () => {
        const ids = data.locations.map(l => l.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('todos os locais devem ter IDs no padrão LOC_XXX', () => {
        for (const loc of data.locations) {
            expect(
                loc.id.startsWith('LOC_'),
                `ID "${loc.id}" não segue padrão LOC_`
            ).toBe(true);
        }
    });

    it('recommendedLevel deve ser array com [min, max]', () => {
        for (const loc of data.locations) {
            expect(Array.isArray(loc.recommendedLevel), `${loc.id} recommendedLevel deve ser array`).toBe(true);
            expect(loc.recommendedLevel.length, `${loc.id} recommendedLevel deve ter 2 elementos`).toBe(2);
            expect(loc.recommendedLevel[0], `${loc.id} nível mínimo deve ser positivo`).toBeGreaterThan(0);
            expect(
                loc.recommendedLevel[1],
                `${loc.id} nível máximo deve ser >= mínimo`
            ).toBeGreaterThanOrEqual(loc.recommendedLevel[0]);
        }
    });

    it('encounterPool não deve estar vazio', () => {
        for (const loc of data.locations) {
            expect(
                loc.encounterPool.length,
                `${loc.id} encounterPool está vazio`
            ).toBeGreaterThan(0);
        }
    });

    it('rarePool deve ser array (pode ser vazio)', () => {
        for (const loc of data.locations) {
            expect(
                Array.isArray(loc.rarePool),
                `${loc.id} rarePool deve ser array`
            ).toBe(true);
        }
    });

    it('biomas devem ser strings não vazias', () => {
        for (const loc of data.locations) {
            expect(typeof loc.biome).toBe('string');
            expect(loc.biome.length).toBeGreaterThan(0);
        }
    });
});

describe('data/locations.json - Referências de Monstros', () => {

    const locData = loadLocationsJson();
    const monData = loadMonstersJson();
    const monsterIds = new Set(monData.monsters.map(m => m.id));

    it('todos os IDs em encounterPool devem existir no catálogo', () => {
        for (const loc of locData.locations) {
            for (const mId of loc.encounterPool) {
                expect(
                    monsterIds.has(mId),
                    `${loc.id}.encounterPool: "${mId}" não existe no catálogo`
                ).toBe(true);
            }
        }
    });

    it('todos os IDs em rarePool devem existir no catálogo', () => {
        for (const loc of locData.locations) {
            for (const mId of loc.rarePool) {
                expect(
                    monsterIds.has(mId),
                    `${loc.id}.rarePool: "${mId}" não existe no catálogo`
                ).toBe(true);
            }
        }
    });

    it('não deve haver IDs duplicados dentro do mesmo pool', () => {
        for (const loc of locData.locations) {
            const combined = [...loc.encounterPool, ...loc.rarePool];
            const unique = new Set(combined);
            expect(
                unique.size,
                `${loc.id} tem IDs duplicados nos pools`
            ).toBe(combined.length);
        }
    });
});

describe('data/locations.json - Coerência de Progressão', () => {

    const locData = loadLocationsJson();
    const monData = loadMonstersJson();
    const monsterMap = new Map(monData.monsters.map(m => [m.id, m]));

    it('LOC_001 (tutorial) só deve ter monstros de estágio 0 (formas base)', () => {
        const tutorial = locData.locations.find(l => l.id === 'LOC_001');
        const allPool = [...tutorial.encounterPool, ...tutorial.rarePool];
        for (const mId of allPool) {
            expect(
                getStageFromId(mId),
                `LOC_001 tem "${mId}" (estágio ${getStageFromId(mId)}) — esperado apenas estágio 0`
            ).toBe(0);
        }
    });

    it('LOC_001 (tutorial) só deve ter monstros Comuns', () => {
        const tutorial = locData.locations.find(l => l.id === 'LOC_001');
        const allPool = [...tutorial.encounterPool, ...tutorial.rarePool];
        for (const mId of allPool) {
            const monster = monsterMap.get(mId);
            expect(
                monster.rarity,
                `LOC_001 tem "${mId}" com raridade "${monster.rarity}" — esperado apenas Comum`
            ).toBe('Comum');
        }
    });

    it('locais iniciais (nível máx ≤ 10) não devem ter monstros Raros+ no encounterPool', () => {
        const earlyLocs = locData.locations.filter(l => l.recommendedLevel[1] <= 10);
        for (const loc of earlyLocs) {
            for (const mId of loc.encounterPool) {
                const monster = monsterMap.get(mId);
                const rarityIdx = RARITY_ORDER.indexOf(monster.rarity);
                expect(
                    rarityIdx,
                    `${loc.id}.encounterPool: "${mId}" é ${monster.rarity} — locais iniciais não devem ter Raro+`
                ).toBeLessThan(RARITY_ORDER.indexOf('Raro'));
            }
        }
    });

    it('locais iniciais (nível máx ≤ 10) não devem ter monstros de estágio 2+ no encounterPool', () => {
        const earlyLocs = locData.locations.filter(l => l.recommendedLevel[1] <= 10);
        for (const loc of earlyLocs) {
            for (const mId of loc.encounterPool) {
                expect(
                    getStageFromId(mId),
                    `${loc.id}.encounterPool: "${mId}" é estágio ${getStageFromId(mId)} — locais iniciais devem ter apenas estágio 0-1`
                ).toBeLessThan(2);
            }
        }
    });

    it('locais avançados (nível mín ≥ 15) devem ter pelo menos 1 monstro Incomum ou melhor', () => {
        const advancedLocs = locData.locations.filter(l => l.recommendedLevel[0] >= 15);
        for (const loc of advancedLocs) {
            const allPool = [...loc.encounterPool, ...loc.rarePool];
            const hasIncomumPlus = allPool.some(mId => {
                const monster = monsterMap.get(mId);
                return RARITY_ORDER.indexOf(monster.rarity) >= RARITY_ORDER.indexOf('Incomum');
            });
            expect(
                hasIncomumPlus,
                `${loc.id} (lv ${loc.recommendedLevel[0]}+) deveria ter pelo menos 1 Incomum+`
            ).toBe(true);
        }
    });

    it('locais avançados (nível mín ≥ 20) devem ter pelo menos 1 monstro Raro ou melhor', () => {
        const veryAdvancedLocs = locData.locations.filter(l => l.recommendedLevel[0] >= 20);
        for (const loc of veryAdvancedLocs) {
            const allPool = [...loc.encounterPool, ...loc.rarePool];
            const hasRaroPlus = allPool.some(mId => {
                const monster = monsterMap.get(mId);
                return RARITY_ORDER.indexOf(monster.rarity) >= RARITY_ORDER.indexOf('Raro');
            });
            expect(
                hasRaroPlus,
                `${loc.id} (lv ${loc.recommendedLevel[0]}+) deveria ter pelo menos 1 Raro+`
            ).toBe(true);
        }
    });

    it('monstros de estágio D (forma final) não devem aparecer em locais iniciais (nível máx ≤ 15)', () => {
        const nonLateGameLocs = locData.locations.filter(l => l.recommendedLevel[1] <= 15);
        for (const loc of nonLateGameLocs) {
            const allPool = [...loc.encounterPool, ...loc.rarePool];
            for (const mId of allPool) {
                expect(
                    getStageFromId(mId),
                    `${loc.id} tem "${mId}" (estágio D — forma final) — não permitido em locais de nível máx ≤ 15`
                ).toBeLessThan(3);
            }
        }
    });
});

describe('LOCAIS.csv - Integridade', () => {

    const locais = parseCSV('LOCAIS.csv');
    const locData = loadLocationsJson();
    const jsonLocIds = new Set(locData.locations.map(l => l.id));

    it('deve ter 8 locais', () => {
        expect(locais.length).toBe(8);
    });

    it('todos os locais do CSV devem ter campos obrigatórios', () => {
        const required = ['local_id', 'nome', 'descricao', 'nivel_recomendado'];
        for (const loc of locais) {
            for (const field of required) {
                expect(loc[field], `Linha com local_id="${loc.local_id}" falta campo "${field}"`).toBeTruthy();
            }
        }
    });

    it('IDs do CSV não devem estar duplicados', () => {
        const ids = locais.map(l => l.local_id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('todos os IDs do CSV devem existir em locations.json', () => {
        for (const loc of locais) {
            expect(
                jsonLocIds.has(loc.local_id),
                `LOCAIS.csv "${loc.local_id}" não encontrado em locations.json`
            ).toBe(true);
        }
    });

    it('LOC_001 deve existir (tutorial obrigatório)', () => {
        const tutorial = locais.find(l => l.local_id === 'LOC_001');
        expect(tutorial).toBeDefined();
        expect(tutorial.nome).toBe('Campina Inicial');
    });
});

describe('ENCOUNTERS.csv - Integridade', () => {

    const encounters = parseCSV('ENCOUNTERS.csv');
    const monData = loadMonstersJson();
    const monsterIds = new Set(monData.monsters.map(m => m.id));
    const locData = loadLocationsJson();
    const validLocIds = new Set(locData.locations.map(l => l.id));
    const validDropTables = new Set(['DROP_001', 'DROP_002', 'DROP_003',
                                       'DROP_004', 'DROP_005', 'DROP_006',
                                       'DROP_007', 'DROP_008']);
    const validTypes = new Set(['Selvagem', 'Treinador', 'Boss']);

    it('deve ter pelo menos 20 encontros', () => {
        expect(encounters.length).toBeGreaterThanOrEqual(20);
    });

    it('IDs de encontros não devem estar duplicados', () => {
        const ids = encounters.map(e => e.encounter_id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('todos os encontros devem ter campos obrigatórios', () => {
        const required = ['encounter_id', 'tipo_encontro', 'local_id', 'min_level', 'max_level', 'monster_id_1'];
        for (const enc of encounters) {
            for (const field of required) {
                expect(enc[field], `${enc.encounter_id} falta campo "${field}"`).toBeTruthy();
            }
        }
    });

    it('monster_id_1 deve referenciar monstro existente no catálogo', () => {
        for (const enc of encounters) {
            expect(
                monsterIds.has(enc.monster_id_1),
                `${enc.encounter_id}: monster_id_1="${enc.monster_id_1}" não existe no catálogo`
            ).toBe(true);
        }
    });

    it('monster_id_2 deve referenciar monstro existente (quando preenchido)', () => {
        for (const enc of encounters) {
            if (enc.monster_id_2) {
                expect(
                    monsterIds.has(enc.monster_id_2),
                    `${enc.encounter_id}: monster_id_2="${enc.monster_id_2}" não existe no catálogo`
                ).toBe(true);
            }
        }
    });

    it('monster_id_3 deve referenciar monstro existente (quando preenchido)', () => {
        for (const enc of encounters) {
            if (enc.monster_id_3) {
                expect(
                    monsterIds.has(enc.monster_id_3),
                    `${enc.encounter_id}: monster_id_3="${enc.monster_id_3}" não existe no catálogo`
                ).toBe(true);
            }
        }
    });

    it('local_id deve referenciar local existente', () => {
        for (const enc of encounters) {
            expect(
                validLocIds.has(enc.local_id),
                `${enc.encounter_id}: local_id="${enc.local_id}" não existe em locations.json`
            ).toBe(true);
        }
    });

    it('tipo_encontro deve ser válido', () => {
        for (const enc of encounters) {
            expect(
                validTypes.has(enc.tipo_encontro),
                `${enc.encounter_id}: tipo="${enc.tipo_encontro}" inválido`
            ).toBe(true);
        }
    });

    it('min_level e max_level devem ser números positivos', () => {
        for (const enc of encounters) {
            const min = Number(enc.min_level);
            const max = Number(enc.max_level);
            expect(isNaN(min), `${enc.encounter_id} min_level inválido`).toBe(false);
            expect(isNaN(max), `${enc.encounter_id} max_level inválido`).toBe(false);
            expect(min, `${enc.encounter_id} min_level deve ser positivo`).toBeGreaterThan(0);
            expect(max, `${enc.encounter_id} max_level deve ser >= min_level`).toBeGreaterThanOrEqual(min);
        }
    });

    it('drop_table_id deve ser válido (DROP_001 ou DROP_002)', () => {
        for (const enc of encounters) {
            expect(
                validDropTables.has(enc.drop_table_id),
                `${enc.encounter_id}: drop_table_id="${enc.drop_table_id}" inválido`
            ).toBe(true);
        }
    });

    it('cada local deve ter pelo menos 2 encontros', () => {
        const byLocal = {};
        for (const enc of encounters) {
            byLocal[enc.local_id] = (byLocal[enc.local_id] || 0) + 1;
        }
        for (const locId of validLocIds) {
            expect(
                byLocal[locId] || 0,
                `${locId} deve ter pelo menos 2 encontros`
            ).toBeGreaterThanOrEqual(2);
        }
    });

    it('LOC_001 (tutorial) não deve ter monstros de estágio C ou D', () => {
        const tutorialEncs = encounters.filter(e => e.local_id === 'LOC_001');
        for (const enc of tutorialEncs) {
            for (const field of ['monster_id_1', 'monster_id_2', 'monster_id_3']) {
                const mId = enc[field];
                if (!mId) continue;
                expect(
                    getStageFromId(mId),
                    `LOC_001 encontro "${enc.encounter_id}" tem "${mId}" estágio ${getStageFromId(mId)}`
                ).toBeLessThan(2);
            }
        }
    });

    it('deve existir pelo menos 1 encontro Boss no catálogo de encounters', () => {
        const bossEncounters = encounters.filter(e => e.tipo_encontro === 'Boss');
        expect(bossEncounters.length).toBeGreaterThanOrEqual(1);
    });
});

describe('ENCOUNTERS.csv ↔ data/locations.json - Consistência Cruzada', () => {

    const encounters = parseCSV('ENCOUNTERS.csv');
    const locData = loadLocationsJson();

    it('pools de LOC_001 em locations.json devem cobrir monstros do ENCOUNTERS.csv para LOC_001', () => {
        const tutorial = locData.locations.find(l => l.id === 'LOC_001');
        const tutorialPool = new Set([...tutorial.encounterPool, ...tutorial.rarePool]);
        const tutorialEncs = encounters.filter(e => e.local_id === 'LOC_001');

        for (const enc of tutorialEncs) {
            for (const field of ['monster_id_1', 'monster_id_2', 'monster_id_3']) {
                const mId = enc[field];
                if (!mId) continue;
                expect(
                    tutorialPool.has(mId),
                    `LOC_001: "${mId}" no ENCOUNTERS.csv mas não em locations.json encounterPool ou rarePool`
                ).toBe(true);
            }
        }
    });
});
