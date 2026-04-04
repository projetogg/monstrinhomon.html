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
    // Locais de exploração excluem locais de serviço (cidade, hub, etc.) e boss nodes
    const explorationLocs = data.locations.filter(l =>
        !l.specialRules?.includes('city_only') &&
        !l.specialRules?.includes('boss_only')
    );

    it('deve ter estrutura JSON válida com version e array "locations"', () => {
        expect(data).toBeDefined();
        expect(data.version).toBeDefined();
        expect(Array.isArray(data.locations)).toBe(true);
    });

    it('deve ter pelo menos 8 locais definidos (inclui sub-áreas progressivas)', () => {
        expect(data.locations.length).toBeGreaterThanOrEqual(8);
    });

    it('todos os locais devem ter campos obrigatórios', () => {
        const required = ['id', 'name', 'description', 'biome', 'levelRange', 'speciesPoolsByRarity'];
        for (const loc of explorationLocs) {
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

    it('locais de exploração devem ter IDs no padrão LOC_XXX', () => {
        for (const loc of explorationLocs) {
            expect(
                loc.id.startsWith('LOC_'),
                `ID "${loc.id}" não segue padrão LOC_`
            ).toBe(true);
        }
    });

    it('levelRange deve ser array com [min, max] (locais de exploração)', () => {
        for (const loc of explorationLocs) {
            expect(Array.isArray(loc.levelRange), `${loc.id} levelRange deve ser array`).toBe(true);
            expect(loc.levelRange.length, `${loc.id} levelRange deve ter 2 elementos`).toBe(2);
            expect(loc.levelRange[0], `${loc.id} nível mínimo deve ser positivo`).toBeGreaterThan(0);
            expect(
                loc.levelRange[1],
                `${loc.id} nível máximo deve ser >= mínimo`
            ).toBeGreaterThanOrEqual(loc.levelRange[0]);
        }
    });

    it('speciesPoolsByRarity.Comum não deve estar vazio (locais de exploração)', () => {
        for (const loc of explorationLocs) {
            expect(
                (loc.speciesPoolsByRarity?.Comum || []).length,
                `${loc.id} pool Comum está vazio`
            ).toBeGreaterThan(0);
        }
    });

    it('speciesPoolsByRarity deve ter arrays para todas as raridades (locais de exploração)', () => {
        const raridades = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];
        for (const loc of explorationLocs) {
            for (const r of raridades) {
                expect(
                    Array.isArray(loc.speciesPoolsByRarity[r]),
                    `${loc.id} speciesPoolsByRarity.${r} deve ser array`
                ).toBe(true);
            }
        }
    });

    it('rarityWeights devem existir e somar ~100 (locais de exploração)', () => {
        for (const loc of explorationLocs) {
            expect(loc.rarityWeights, `${loc.id} falta rarityWeights`).toBeDefined();
            const total = Object.values(loc.rarityWeights).reduce((s, v) => s + v, 0);
            expect(total, `${loc.id} rarityWeights deve somar 100`).toBeCloseTo(100, 0);
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

    /** Retorna todos os IDs de monstros de todos os pools de uma localização */
    function allPoolIds(loc) {
        const pools = loc.speciesPoolsByRarity ?? {};
        return Object.values(pools).flat();
    }

    it('todos os IDs em speciesPoolsByRarity devem existir no catálogo', () => {
        for (const loc of locData.locations) {
            for (const mId of allPoolIds(loc)) {
                expect(
                    monsterIds.has(mId),
                    `${loc.id}.speciesPoolsByRarity: "${mId}" não existe no catálogo`
                ).toBe(true);
            }
        }
    });

    it('não deve haver IDs duplicados dentro dos pools de uma mesma localização', () => {
        for (const loc of locData.locations) {
            const ids = allPoolIds(loc);
            const unique = new Set(ids);
            expect(
                unique.size,
                `${loc.id} tem IDs duplicados nos pools`
            ).toBe(ids.length);
        }
    });
});

describe('data/locations.json - Coerência de Progressão', () => {

    const locData = loadLocationsJson();
    const monData = loadMonstersJson();
    const monsterMap = new Map(monData.monsters.map(m => [m.id, m]));
    // Apenas locais de exploração (excluindo cidades/serviços e boss nodes)
    const explorationLocs = locData.locations.filter(l =>
        !l.specialRules?.includes('city_only') &&
        !l.specialRules?.includes('boss_only')
    );

    /** Retorna todos os IDs de monstros de todos os pools de uma localização */
    function allPoolIds(loc) {
        const pools = loc.speciesPoolsByRarity ?? {};
        return Object.values(pools).flat();
    }

    it('LOC_001 (tutorial) só deve ter monstros de estágio 0 (formas base) no pool Comum', () => {
        const tutorial = locData.locations.find(l => l.id === 'LOC_001');
        const comumPool = tutorial?.speciesPoolsByRarity?.Comum ?? [];
        for (const mId of comumPool) {
            expect(
                getStageFromId(mId),
                `LOC_001.Comum tem "${mId}" (estágio ${getStageFromId(mId)}) — esperado apenas estágio 0`
            ).toBe(0);
        }
    });

    it('LOC_001 (tutorial) pool Comum só deve ter monstros de raridade Comum', () => {
        const tutorial = locData.locations.find(l => l.id === 'LOC_001');
        const comumPool = tutorial?.speciesPoolsByRarity?.Comum ?? [];
        for (const mId of comumPool) {
            const monster = monsterMap.get(mId);
            expect(
                monster.rarity,
                `LOC_001.Comum tem "${mId}" com raridade "${monster.rarity}" — esperado apenas Comum`
            ).toBe('Comum');
        }
    });

    it('locais iniciais (nível máx ≤ 10) não devem ter monstros Raros+ no pool Comum', () => {
        const earlyLocs = explorationLocs.filter(l => l.levelRange[1] <= 10);
        for (const loc of earlyLocs) {
            for (const mId of (loc.speciesPoolsByRarity?.Comum ?? [])) {
                const monster = monsterMap.get(mId);
                const rarityIdx = RARITY_ORDER.indexOf(monster.rarity);
                expect(
                    rarityIdx,
                    `${loc.id}.Comum: "${mId}" é ${monster.rarity} — locais iniciais não devem ter Raro+ no pool Comum`
                ).toBeLessThan(RARITY_ORDER.indexOf('Raro'));
            }
        }
    });

    it('locais iniciais (nível máx ≤ 10) não devem ter monstros de estágio 2+ no pool Comum', () => {
        const earlyLocs = explorationLocs.filter(l => l.levelRange[1] <= 10);
        for (const loc of earlyLocs) {
            for (const mId of (loc.speciesPoolsByRarity?.Comum ?? [])) {
                expect(
                    getStageFromId(mId),
                    `${loc.id}.Comum: "${mId}" é estágio ${getStageFromId(mId)} — locais iniciais devem ter apenas estágio 0-1 no pool Comum`
                ).toBeLessThan(2);
            }
        }
    });

    it('locais avançados (nível mín ≥ 15) devem ter pelo menos 1 monstro Incomum ou melhor em todos os pools', () => {
        const advancedLocs = explorationLocs.filter(l => l.levelRange[0] >= 15);
        for (const loc of advancedLocs) {
            const allIds = allPoolIds(loc);
            const hasIncomumPlus = allIds.some(mId => {
                const monster = monsterMap.get(mId);
                return RARITY_ORDER.indexOf(monster.rarity) >= RARITY_ORDER.indexOf('Incomum');
            });
            expect(
                hasIncomumPlus,
                `${loc.id} (lv ${loc.levelRange[0]}+) deveria ter pelo menos 1 Incomum+`
            ).toBe(true);
        }
    });

    it('locais avançados (nível mín ≥ 20) devem ter pelo menos 1 monstro Raro ou melhor em todos os pools', () => {
        const veryAdvancedLocs = explorationLocs.filter(l => l.levelRange[0] >= 20);
        for (const loc of veryAdvancedLocs) {
            const allIds = allPoolIds(loc);
            const hasRaroPlus = allIds.some(mId => {
                const monster = monsterMap.get(mId);
                return RARITY_ORDER.indexOf(monster.rarity) >= RARITY_ORDER.indexOf('Raro');
            });
            expect(
                hasRaroPlus,
                `${loc.id} (lv ${loc.levelRange[0]}+) deveria ter pelo menos 1 Raro+`
            ).toBe(true);
        }
    });

    it('monstros de estágio D (forma final) não devem aparecer em locais iniciais (nível máx ≤ 15)', () => {
        const nonLateGameLocs = explorationLocs.filter(l => l.levelRange[1] <= 15);
        for (const loc of nonLateGameLocs) {
            for (const mId of allPoolIds(loc)) {
                expect(
                    getStageFromId(mId),
                    `${loc.id} tem "${mId}" (estágio D — forma final) — não permitido em locais de nível máx ≤ 15`
                ).toBeLessThan(3);
            }
        }
    });

    it('tier deve ser string válida (T0-T6)', () => {
        const validTiers = new Set(['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6']);
        for (const loc of explorationLocs) {
            if (loc.tier) {
                expect(
                    validTiers.has(loc.tier),
                    `${loc.id} tem tier inválido "${loc.tier}"`
                ).toBe(true);
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

    it('cada local_id presente no ENCOUNTERS.csv deve ter pelo menos 2 encontros', () => {
        // Verifica apenas os locais que aparecem no CSV (o CSV legado cobre as 8 áreas base originais;
        // o novo sistema expandiu para 20 áreas progressivas com sub-áreas)
        const byLocal = {};
        for (const enc of encounters) {
            byLocal[enc.local_id] = (byLocal[enc.local_id] || 0) + 1;
        }
        for (const [locId, count] of Object.entries(byLocal)) {
            expect(
                count,
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

    it('todos os monstros do ENCOUNTERS.csv de LOC_001 devem estar nos pools de LOC_001', () => {
        const tutorial = locData.locations.find(l => l.id === 'LOC_001');
        const tutorialPools = tutorial?.speciesPoolsByRarity ?? {};
        const tutorialPool = new Set(Object.values(tutorialPools).flat());
        const tutorialEncs = encounters.filter(e => e.local_id === 'LOC_001');

        for (const enc of tutorialEncs) {
            for (const field of ['monster_id_1', 'monster_id_2', 'monster_id_3']) {
                const mId = enc[field];
                if (!mId) continue;
                expect(
                    tutorialPool.has(mId),
                    `LOC_001: "${mId}" no ENCOUNTERS.csv mas não em speciesPoolsByRarity`
                ).toBe(true);
            }
        }
    });
});
