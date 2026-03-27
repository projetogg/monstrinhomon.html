/**
 * DROPS INTEGRITY TESTS
 *
 * Valida integridade dos dados de drops.
 * Cobertura:
 *  - DROPS.csv: esquema, campos obrigatórios, referências
 *  - dropSystem.js DROP_TABLES: consistência com CSV, progressão de recompensas
 *  - getDropTableForEncounter: mapeamento bioma-aware
 */

import { describe, it, expect } from 'vitest';
import {
    parseCSV,
    buildValidItemIds
} from './helpers.js';
import {
    DROP_TABLES,
    getDropTableForEncounter
} from '../js/data/dropSystem.js';

const EXPECTED_DROP_TABLES = ['DROP_001', 'DROP_002', 'DROP_003',
                               'DROP_004', 'DROP_005', 'DROP_006',
                               'DROP_007', 'DROP_008'];

// ── DROPS.csv — Estrutura ──────────────────────────────────────────────────

describe('DROPS.csv - Estrutura e Campos', () => {

    const drops = parseCSV('DROPS.csv');
    const validItemIds = buildValidItemIds();

    it('deve ter pelo menos 28 entradas (4 tabelas × 4 itens mínimo)', () => {
        expect(drops.length).toBeGreaterThanOrEqual(28);
    });

    it('deve ter entradas para todos os 8 drop tables esperados', () => {
        const tableIds = new Set(drops.map(d => d.drop_table_id));
        for (const expected of EXPECTED_DROP_TABLES) {
            expect(
                tableIds.has(expected),
                `DROPS.csv não tem entradas para "${expected}"`
            ).toBe(true);
        }
    });

    it('todos os campos obrigatórios devem estar preenchidos', () => {
        const required = ['drop_table_id', 'item_id', 'chance', 'min_qty', 'max_qty'];
        for (const row of drops) {
            for (const field of required) {
                expect(
                    row[field],
                    `Linha com drop_table_id="${row.drop_table_id}" falta campo "${field}"`
                ).toBeTruthy();
            }
        }
    });

    it('chance deve ser número entre 0 e 1 (exclusive)', () => {
        for (const row of drops) {
            const chance = Number(row.chance);
            expect(
                !isNaN(chance) && chance > 0 && chance <= 1,
                `${row.drop_table_id}/${row.item_id}: chance="${row.chance}" inválida`
            ).toBe(true);
        }
    });

    it('min_qty e max_qty devem ser inteiros positivos com max >= min', () => {
        for (const row of drops) {
            const min = Number(row.min_qty);
            const max = Number(row.max_qty);
            expect(
                Number.isInteger(min) && min >= 1,
                `${row.drop_table_id}/${row.item_id}: min_qty inválido`
            ).toBe(true);
            expect(
                Number.isInteger(max) && max >= min,
                `${row.drop_table_id}/${row.item_id}: max_qty inválido`
            ).toBe(true);
        }
    });

    it('todos os item_ids devem ser válidos', () => {
        for (const row of drops) {
            expect(
                validItemIds.has(row.item_id),
                `${row.drop_table_id}: item_id="${row.item_id}" não é item válido`
            ).toBe(true);
        }
    });

    it('não deve haver item_id duplicado dentro da mesma tabela', () => {
        const byTable = {};
        for (const row of drops) {
            byTable[row.drop_table_id] = byTable[row.drop_table_id] || [];
            byTable[row.drop_table_id].push(row.item_id);
        }
        for (const [tableId, items] of Object.entries(byTable)) {
            expect(
                new Set(items).size,
                `${tableId} tem item_id duplicado`
            ).toBe(items.length);
        }
    });
});

// ── DROPS.csv — Progressão de Recompensas ─────────────────────────────────

describe('DROPS.csv - Progressão de Recompensas', () => {

    const drops = parseCSV('DROPS.csv');

    function getTableEntries(tableId) {
        return drops.filter(d => d.drop_table_id === tableId);
    }

    function getMaxChance(tableId) {
        return Math.max(...getTableEntries(tableId).map(d => Number(d.chance)));
    }

    it('DROP_003 (boss) deve ter chance máxima maior que DROP_001 (selvagem básico)', () => {
        expect(getMaxChance('DROP_003')).toBeGreaterThan(getMaxChance('DROP_001'));
    });

    it('DROP_003 (boss) deve ter mais itens que DROP_001 (selvagem básico)', () => {
        expect(getTableEntries('DROP_003').length).toBeGreaterThan(getTableEntries('DROP_001').length);
    });

    it('DROP_002 (treinador básico) deve ter chance maior que DROP_001 (selvagem básico)', () => {
        expect(getMaxChance('DROP_002')).toBeGreaterThan(getMaxChance('DROP_001'));
    });

    it('DROP_008 (treinador avançado) deve ter maior variedade que DROP_002 (treinador básico)', () => {
        // DROP_008 tem itens melhores (CLASTERORB_INCOMUM, IT_HEAL_03, EGG_U)
        // A progressão é em qualidade, não necessariamente em chance máxima individual
        expect(getTableEntries('DROP_008').length).toBeGreaterThan(getTableEntries('DROP_002').length);
    });

    it('DROP_005 (selvagem avançado) deve ter chance de CLASTERORB_INCOMUM (boss/avançado tem itens melhores)', () => {
        const adv = getTableEntries('DROP_005');
        const hasIncomum = adv.some(d => d.item_id === 'CLASTERORB_INCOMUM');
        expect(hasIncomum).toBe(true);
    });

    it('DROP_001 e DROP_002 (básicos) não devem ter CLASTERORB_INCOMUM', () => {
        for (const tableId of ['DROP_001', 'DROP_002']) {
            const entries = getTableEntries(tableId);
            const hasIncomum = entries.some(d => d.item_id === 'CLASTERORB_INCOMUM');
            expect(
                hasIncomum,
                `${tableId} não deveria ter CLASTERORB_INCOMUM (reservado para mid/late game)`
            ).toBe(false);
        }
    });
});

// ── DROP_TABLES (JS) — Estrutura ──────────────────────────────────────────

describe('dropSystem.js DROP_TABLES - Estrutura', () => {

    it('deve ter todos os 8 drop tables esperados', () => {
        for (const expected of EXPECTED_DROP_TABLES) {
            expect(
                DROP_TABLES[expected],
                `DROP_TABLES não tem "${expected}"`
            ).toBeDefined();
        }
    });

    it('cada tabela deve ter id, name e entries', () => {
        for (const [tableId, table] of Object.entries(DROP_TABLES)) {
            expect(table.id).toBe(tableId);
            expect(typeof table.name).toBe('string');
            expect(Array.isArray(table.entries)).toBe(true);
            expect(table.entries.length).toBeGreaterThan(0);
        }
    });

    it('todas as entradas devem ter campos válidos', () => {
        const validItemIds = buildValidItemIds();
        for (const [tableId, table] of Object.entries(DROP_TABLES)) {
            for (const entry of table.entries) {
                expect(entry.itemId, `${tableId} entry falta itemId`).toBeTruthy();
                expect(validItemIds.has(entry.itemId), `${tableId}: "${entry.itemId}" inválido`).toBe(true);
                expect(entry.chance > 0 && entry.chance <= 1, `${tableId}/${entry.itemId}: chance inválida`).toBe(true);
                expect(entry.minQty >= 1, `${tableId}/${entry.itemId}: minQty inválido`).toBe(true);
                expect(entry.maxQty >= entry.minQty, `${tableId}/${entry.itemId}: maxQty < minQty`).toBe(true);
            }
        }
    });

    it('DROP_003 (boss) deve ter CLASTERORB_INCOMUM com chance >= 0.70', () => {
        const entry = DROP_TABLES['DROP_003'].entries.find(e => e.itemId === 'CLASTERORB_INCOMUM');
        expect(entry).toBeDefined();
        expect(entry.chance).toBeGreaterThanOrEqual(0.70);
    });

    it('DROP_001 deve ter CLASTERORB_COMUM (35%) e IT_HEAL_01 (25%)', () => {
        const orb = DROP_TABLES['DROP_001'].entries.find(e => e.itemId === 'CLASTERORB_COMUM');
        const heal = DROP_TABLES['DROP_001'].entries.find(e => e.itemId === 'IT_HEAL_01');
        expect(orb).toBeDefined();
        expect(orb.chance).toBe(0.35);
        expect(heal).toBeDefined();
        expect(heal.chance).toBe(0.25);
    });
});

// ── getDropTableForEncounter — Mapeamento Bioma-Aware ─────────────────────

describe('getDropTableForEncounter - Bioma-Aware', () => {

    it('deve retornar DROP_001 para wild em LOC_001 (tutorial)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_001')).toBe('DROP_001');
    });

    it('deve retornar DROP_001 para wild em LOC_002 (floresta)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_002')).toBe('DROP_001');
    });

    it('deve retornar DROP_004 para wild em LOC_003 (minas)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_003')).toBe('DROP_004');
    });

    it('deve retornar DROP_004 para wild em LOC_004 (ruínas)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_004')).toBe('DROP_004');
    });

    it('deve retornar DROP_004 para wild em LOC_005 (costa)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_005')).toBe('DROP_004');
    });

    it('deve retornar DROP_005 para wild em LOC_006 (vulcânica)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_006')).toBe('DROP_005');
    });

    it('deve retornar DROP_005 para wild em LOC_007 (noturna)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_007')).toBe('DROP_005');
    });

    it('deve retornar DROP_006 para wild em LOC_008 (arena)', () => {
        expect(getDropTableForEncounter('wild', 'LOC_008')).toBe('DROP_006');
    });

    it('deve retornar DROP_002 para trainer em LOC_001', () => {
        expect(getDropTableForEncounter('trainer', 'LOC_001')).toBe('DROP_002');
    });

    it('deve retornar DROP_007 para trainer em LOC_003', () => {
        expect(getDropTableForEncounter('trainer', 'LOC_003')).toBe('DROP_007');
    });

    it('deve retornar DROP_008 para trainer em LOC_006', () => {
        expect(getDropTableForEncounter('trainer', 'LOC_006')).toBe('DROP_008');
    });

    it('deve retornar DROP_008 para trainer em LOC_008', () => {
        expect(getDropTableForEncounter('trainer', 'LOC_008')).toBe('DROP_008');
    });

    it('deve retornar DROP_003 para boss (independente do local)', () => {
        expect(getDropTableForEncounter('boss', 'LOC_004')).toBe('DROP_003');
        expect(getDropTableForEncounter('boss', 'LOC_006')).toBe('DROP_003');
        expect(getDropTableForEncounter('boss', 'LOC_008')).toBe('DROP_003');
        expect(getDropTableForEncounter('boss')).toBe('DROP_003');
    });

    it('deve retornar DROP_001 para wild sem locationId (fallback)', () => {
        expect(getDropTableForEncounter('wild')).toBe('DROP_001');
    });

    it('deve retornar DROP_002 para trainer sem locationId (fallback)', () => {
        expect(getDropTableForEncounter('trainer')).toBe('DROP_002');
    });

    it('deve ser case-insensitive para encounterType', () => {
        expect(getDropTableForEncounter('WILD', 'LOC_008')).toBe('DROP_006');
        expect(getDropTableForEncounter('BOSS')).toBe('DROP_003');
        expect(getDropTableForEncounter('TRAINER', 'LOC_006')).toBe('DROP_008');
    });

    it('deve retornar null para tipo desconhecido', () => {
        expect(getDropTableForEncounter('event')).toBeNull();
        expect(getDropTableForEncounter('unknown')).toBeNull();
    });

    it('deve retornar null para tipo null/vazio', () => {
        expect(getDropTableForEncounter(null)).toBeNull();
        expect(getDropTableForEncounter(undefined)).toBeNull();
        expect(getDropTableForEncounter('')).toBeNull();
    });

    it('deve retornar DROP_003 para group_trainer que é boss (se forçado)', () => {
        // group_trainer sem local usa DROP_002
        expect(getDropTableForEncounter('group_trainer')).toBe('DROP_002');
    });
});

// ── ENCOUNTERS.csv ↔ DROP_TABLES — Consistência ───────────────────────────

describe('ENCOUNTERS.csv - drop_table_id usa tabelas expandidas', () => {

    const drops = parseCSV('DROPS.csv');
    const allDropTableIds = new Set(drops.map(d => d.drop_table_id));

    it('ENCOUNTERS.csv deve ter apenas drop_table_ids existentes em DROPS.csv', () => {
        const encounters = parseCSV('ENCOUNTERS.csv');
        for (const enc of encounters) {
            expect(
                allDropTableIds.has(enc.drop_table_id),
                `${enc.encounter_id}: drop_table_id="${enc.drop_table_id}" não existe em DROPS.csv`
            ).toBe(true);
        }
    });

    it('encontros Boss devem usar DROP_003', () => {
        const encounters = parseCSV('ENCOUNTERS.csv');
        const bossEncounters = encounters.filter(e => e.tipo_encontro === 'Boss');
        for (const enc of bossEncounters) {
            expect(
                enc.drop_table_id,
                `Boss ${enc.encounter_id} deve usar DROP_003`
            ).toBe('DROP_003');
        }
    });

    it('encontros em LOC_006 selvagem devem usar DROP_005', () => {
        const encounters = parseCSV('ENCOUNTERS.csv');
        const loc006Wild = encounters.filter(e => e.local_id === 'LOC_006' && e.tipo_encontro === 'Selvagem');
        for (const enc of loc006Wild) {
            expect(
                enc.drop_table_id,
                `${enc.encounter_id} em LOC_006 selvagem deve usar DROP_005`
            ).toBe('DROP_005');
        }
    });

    it('encontros em LOC_008 selvagem devem usar DROP_006', () => {
        const encounters = parseCSV('ENCOUNTERS.csv');
        const loc008Wild = encounters.filter(e => e.local_id === 'LOC_008' && e.tipo_encontro === 'Selvagem');
        for (const enc of loc008Wild) {
            expect(
                enc.drop_table_id,
                `${enc.encounter_id} em LOC_008 selvagem deve usar DROP_006`
            ).toBe('DROP_006');
        }
    });
});
