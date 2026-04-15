/**
 * FASE XIX-A — Lendários nos Pools de Encontro
 *
 * Verifica que MON_101-108 estão presentes em speciesPoolsByRarity["Lendário"]
 * nas localizações de tier T5/T6 de data/locations.json.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LEGENDARIOS = ['MON_101', 'MON_102', 'MON_103', 'MON_104', 'MON_105', 'MON_106', 'MON_107', 'MON_108'];
const LOCS_WITH_LENDARIOS = ['LOC_003C', 'LOC_004B', 'LOC_005C', 'LOC_006B', 'LOC_007B', 'LOC_008', 'LOC_008B', 'LOC_009'];

let locs;

beforeAll(async () => {
    const raw = await readFile(resolve(__dirname, '../data/locations.json'), 'utf-8');
    const d = JSON.parse(raw);
    locs = d.locations;
});

describe('Fase XIX-A — Lendários nos pools de encontro', () => {
    describe('data/locations.json — pools Lendário não vazios em T5/T6', () => {
        it('deve ter pelo menos 8 localizações com pool Lendário preenchido', () => {
            const locsWithLend = locs.filter(loc => {
                const pool = loc.speciesPoolsByRarity?.['Lendário'] ?? [];
                return pool.length > 0;
            });
            expect(locsWithLend.length).toBeGreaterThanOrEqual(8);
        });

        it.each(LOCS_WITH_LENDARIOS)('%s deve ter pool Lendário com pelo menos 1 monstrinho', (locId) => {
            const loc = locs.find(l => l.id === locId);
            expect(loc, `Localização ${locId} não encontrada`).toBeDefined();
            const pool = loc.speciesPoolsByRarity?.['Lendário'] ?? [];
            expect(pool.length, `${locId} tem pool Lendário vazio`).toBeGreaterThan(0);
        });

        it('LOC_008B (T6 Zona de Campeões) deve conter todos os 8 lendários', () => {
            const loc = locs.find(l => l.id === 'LOC_008B');
            expect(loc).toBeDefined();
            const pool = loc.speciesPoolsByRarity?.['Lendário'] ?? [];
            for (const mId of LEGENDARIOS) {
                expect(pool, `${mId} deve estar no pool de LOC_008B`).toContain(mId);
            }
        });

        it('todos os 8 lendários devem aparecer em ao menos uma localização', () => {
            const allPooled = new Set();
            for (const loc of locs) {
                const pool = loc.speciesPoolsByRarity?.['Lendário'] ?? [];
                pool.forEach(id => allPooled.add(id));
            }
            for (const mId of LEGENDARIOS) {
                expect(allPooled, `${mId} não está em nenhuma localização`).toContain(mId);
            }
        });

        it('rarityWeights Lendário deve ser > 0 em LOC_008B', () => {
            const loc = locs.find(l => l.id === 'LOC_008B');
            const weight = loc.rarityWeights?.['Lendário'] ?? 0;
            expect(weight).toBeGreaterThan(0);
        });

        it('não deve ter lendários em localizações de tier T0-T2 (áreas iniciais)', () => {
            const earlyTiers = ['T0', 'T1', 'T2'];
            for (const loc of locs) {
                if (earlyTiers.includes(loc.tier)) {
                    const pool = loc.speciesPoolsByRarity?.['Lendário'] ?? [];
                    expect(pool.length, `${loc.id} (${loc.tier}) não deveria ter lendários`).toBe(0);
                }
            }
        });
    });

    describe('data/monsters.json — MON_101-108 existem como Lendários', () => {
        let monsters;

        beforeAll(async () => {
            const raw = await readFile(resolve(__dirname, '../data/monsters.json'), 'utf-8');
            const d = JSON.parse(raw);
            monsters = d.monsters ?? d;
        });

        it.each(LEGENDARIOS)('%s deve existir no catálogo de monstros', (mId) => {
            const m = monsters.find(m => m.id === mId);
            expect(m, `${mId} não encontrado em data/monsters.json`).toBeDefined();
        });

        it.each(LEGENDARIOS)('%s deve ter raridade Lendário', (mId) => {
            const m = monsters.find(m => m.id === mId);
            expect(m?.rarity).toBe('Lendário');
        });

        it('cada lendário deve ter uma classe diferente (cobertura de todas as 8 classes)', () => {
            const EXPECTED_CLASSES = new Set(['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista']);
            const classes = LEGENDARIOS.map(id => {
                const m = monsters.find(m => m.id === id);
                return m?.class;
            });
            const uniqueClasses = new Set(classes);
            expect(uniqueClasses.size).toBe(8);
            for (const cls of EXPECTED_CLASSES) {
                expect(uniqueClasses, `Classe '${cls}' não está representada nos lendários`).toContain(cls);
            }
        });
    });
});
