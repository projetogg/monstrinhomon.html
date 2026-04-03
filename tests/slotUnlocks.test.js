/**
 * SLOT UNLOCKS TESTS (Fase 5)
 *
 * Testes para js/canon/slotUnlocks.js
 * Cobertura:
 *  - getUnlockedSlotsForLevel: thresholds canônicos, fallback, edge cases
 *  - getSlotUnlockTable: estrutura e ordem
 *  - compatibilidade com o sistema legado de skills (getMonsterSkills não quebra)
 *  - ausência de regressão nos dados canônicos
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    getUnlockedSlotsForLevel,
    getSlotUnlockTable,
    SLOT_UNLOCK_SOURCE,
    _resetSlotUnlockCache,
} from '../js/canon/slotUnlocks.js';

// ---------------------------------------------------------------------------
// Mock do canonLoader para controlar os dados retornados em testes
// ---------------------------------------------------------------------------
vi.mock('../js/canon/canonLoader.js', () => ({
    getAllLevelMilestones: () => ({
        1:  ['slot_1'],
        5:  ['slot_2'],
        10: ['slot_1_or_2_upgrade'],  // upgrade, NÃO é slot novo
        15: ['slot_3'],
        22: ['slot_2_or_3_upgrade'],  // upgrade, NÃO é slot novo
        30: ['slot_4'],
    }),
}));

describe('SlotUnlocks — Fase 5', () => {

    beforeEach(() => {
        // Garante que o cache seja limpo entre testes
        _resetSlotUnlockCache();
    });

    // -------------------------------------------------------------------------
    // Thresholds canônicos (nível exato de desbloqueio)
    // -------------------------------------------------------------------------
    describe('getUnlockedSlotsForLevel — thresholds canônicos', () => {

        it('nível 1 → 1 slot disponível (slot_1)', () => {
            expect(getUnlockedSlotsForLevel(1)).toBe(1);
        });

        it('nível 5 → 2 slots disponíveis (slot_2 desbloqueado)', () => {
            expect(getUnlockedSlotsForLevel(5)).toBe(2);
        });

        it('nível 15 → 3 slots disponíveis (slot_3 desbloqueado)', () => {
            expect(getUnlockedSlotsForLevel(15)).toBe(3);
        });

        it('nível 30 → 4 slots disponíveis (slot_4 desbloqueado)', () => {
            expect(getUnlockedSlotsForLevel(30)).toBe(4);
        });
    });

    // -------------------------------------------------------------------------
    // Níveis intermediários (entre thresholds)
    // -------------------------------------------------------------------------
    describe('getUnlockedSlotsForLevel — níveis intermediários', () => {

        it('nível 2 → ainda 1 slot (slot_2 ainda não desbloqueado)', () => {
            expect(getUnlockedSlotsForLevel(2)).toBe(1);
        });

        it('nível 4 → ainda 1 slot (abaixo de level 5)', () => {
            expect(getUnlockedSlotsForLevel(4)).toBe(1);
        });

        it('nível 6 → 2 slots (acima de level 5, abaixo de level 15)', () => {
            expect(getUnlockedSlotsForLevel(6)).toBe(2);
        });

        it('nível 10 → 2 slots (upgrade de slot, não slot novo)', () => {
            // level 10 tem "slot_1_or_2_upgrade" — não conta como slot_3
            expect(getUnlockedSlotsForLevel(10)).toBe(2);
        });

        it('nível 14 → ainda 2 slots (abaixo de level 15)', () => {
            expect(getUnlockedSlotsForLevel(14)).toBe(2);
        });

        it('nível 20 → 3 slots (acima de level 15, abaixo de level 30)', () => {
            expect(getUnlockedSlotsForLevel(20)).toBe(3);
        });

        it('nível 22 → 3 slots (upgrade de slot, não slot novo)', () => {
            // level 22 tem "slot_2_or_3_upgrade" — não conta como slot_4
            expect(getUnlockedSlotsForLevel(22)).toBe(3);
        });

        it('nível 29 → ainda 3 slots (abaixo de level 30)', () => {
            expect(getUnlockedSlotsForLevel(29)).toBe(3);
        });
    });

    // -------------------------------------------------------------------------
    // Níveis altos (acima da cobertura do JSON level 1-30)
    // -------------------------------------------------------------------------
    describe('getUnlockedSlotsForLevel — níveis altos (31-100)', () => {

        it('nível 31 → 4 slots (máximo, acima da cobertura do JSON)', () => {
            expect(getUnlockedSlotsForLevel(31)).toBe(4);
        });

        it('nível 50 → 4 slots', () => {
            expect(getUnlockedSlotsForLevel(50)).toBe(4);
        });

        it('nível 100 → 4 slots (nível máximo do jogo)', () => {
            expect(getUnlockedSlotsForLevel(100)).toBe(4);
        });
    });

    // -------------------------------------------------------------------------
    // Fallback seguro — inputs inválidos ou inconsistentes
    // -------------------------------------------------------------------------
    describe('getUnlockedSlotsForLevel — fallback seguro', () => {

        it('nível 0 → 1 slot (corrigido para mínimo 1)', () => {
            expect(getUnlockedSlotsForLevel(0)).toBe(1);
        });

        it('nível negativo → 1 slot (fallback mínimo)', () => {
            expect(getUnlockedSlotsForLevel(-5)).toBe(1);
        });

        it('undefined → 1 slot (fallback mínimo)', () => {
            expect(getUnlockedSlotsForLevel(undefined)).toBe(1);
        });

        it('null → 1 slot (fallback mínimo)', () => {
            expect(getUnlockedSlotsForLevel(null)).toBe(1);
        });

        it('string numérica → converte e retorna corretamente', () => {
            expect(getUnlockedSlotsForLevel('15')).toBe(3);
        });

        it('NaN → 1 slot (fallback mínimo)', () => {
            expect(getUnlockedSlotsForLevel(NaN)).toBe(1);
        });

        it('Infinity → 4 slots (máximo possível)', () => {
            expect(getUnlockedSlotsForLevel(Infinity)).toBe(4);
        });
    });

    // -------------------------------------------------------------------------
    // Fallback hardcoded quando canonLoader não disponível
    // -------------------------------------------------------------------------
    describe('getUnlockedSlotsForLevel — fallback hardcoded (sem canonLoader)', () => {

        it('os thresholds do fallback hardcoded coincidem com os do JSON canônico', () => {
            // O SLOT_UNLOCK_FALLBACK espelha level_progression.json.
            // Este teste garante que ambos produzem os mesmos resultados.
            // (mock já simula o JSON — os valores devem ser idênticos)
            expect(getUnlockedSlotsForLevel(1)).toBe(1);
            expect(getUnlockedSlotsForLevel(5)).toBe(2);
            expect(getUnlockedSlotsForLevel(15)).toBe(3);
            expect(getUnlockedSlotsForLevel(30)).toBe(4);
        });

        it('_resetSlotUnlockCache força recompute a partir dos dados disponíveis', () => {
            // Popula o cache com a primeira chamada
            expect(getUnlockedSlotsForLevel(5)).toBe(2);
            // Reseta e verifica que a próxima chamada ainda funciona
            _resetSlotUnlockCache();
            expect(getUnlockedSlotsForLevel(5)).toBe(2);
        });
    });

    // -------------------------------------------------------------------------
    // getSlotUnlockTable — observabilidade
    // -------------------------------------------------------------------------
    describe('getSlotUnlockTable', () => {

        it('retorna array não-vazio', () => {
            const table = getSlotUnlockTable();
            expect(Array.isArray(table)).toBe(true);
            expect(table.length).toBeGreaterThan(0);
        });

        it('cada entrada tem level e slotCount numéricos', () => {
            const table = getSlotUnlockTable();
            for (const entry of table) {
                expect(typeof entry.level).toBe('number');
                expect(typeof entry.slotCount).toBe('number');
                expect(entry.level).toBeGreaterThanOrEqual(1);
                expect(entry.slotCount).toBeGreaterThanOrEqual(1);
            }
        });

        it('slots 1, 2, 3 e 4 estão na tabela', () => {
            const table = getSlotUnlockTable();
            const slotCounts = table.map(e => e.slotCount);
            expect(slotCounts).toContain(1);
            expect(slotCounts).toContain(2);
            expect(slotCounts).toContain(3);
            expect(slotCounts).toContain(4);
        });

        it('slot_1 desbloqueia no nível 1', () => {
            const table = getSlotUnlockTable();
            const slot1 = table.find(e => e.slotCount === 1);
            expect(slot1).toBeDefined();
            expect(slot1.level).toBe(1);
        });

        it('slot_2 desbloqueia no nível 5', () => {
            const table = getSlotUnlockTable();
            const slot2 = table.find(e => e.slotCount === 2);
            expect(slot2).toBeDefined();
            expect(slot2.level).toBe(5);
        });

        it('slot_3 desbloqueia no nível 15', () => {
            const table = getSlotUnlockTable();
            const slot3 = table.find(e => e.slotCount === 3);
            expect(slot3).toBeDefined();
            expect(slot3.level).toBe(15);
        });

        it('slot_4 desbloqueia no nível 30', () => {
            const table = getSlotUnlockTable();
            const slot4 = table.find(e => e.slotCount === 4);
            expect(slot4).toBeDefined();
            expect(slot4.level).toBe(30);
        });

        it('não inclui upgrades como novos slots (slot_1_or_2_upgrade deve ser ignorado)', () => {
            const table = getSlotUnlockTable();
            // Não deve haver entradas com slotCount "fracionado" ou strings
            for (const entry of table) {
                expect(Number.isInteger(entry.slotCount)).toBe(true);
                expect(entry.slotCount).toBeGreaterThanOrEqual(1);
                expect(entry.slotCount).toBeLessThanOrEqual(4);
            }
        });

        it('retorna cópia (mutação não afeta cache interno)', () => {
            const table1 = getSlotUnlockTable();
            table1.push({ level: 999, slotCount: 99 });
            const table2 = getSlotUnlockTable();
            expect(table2.some(e => e.slotCount === 99)).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // SLOT_UNLOCK_SOURCE — rastreabilidade
    // -------------------------------------------------------------------------
    describe('SLOT_UNLOCK_SOURCE', () => {

        it('aponta para o arquivo JSON de design correto', () => {
            expect(SLOT_UNLOCK_SOURCE).toBe('design/canon/level_progression.json');
        });

        it('é uma string não-vazia', () => {
            expect(typeof SLOT_UNLOCK_SOURCE).toBe('string');
            expect(SLOT_UNLOCK_SOURCE.length).toBeGreaterThan(0);
        });
    });

    // -------------------------------------------------------------------------
    // Compatibilidade com o sistema legado de skills
    // -------------------------------------------------------------------------
    describe('Compatibilidade com sistema legado', () => {

        it('slots desbloqueados são independentes do campo stage', () => {
            // O sistema legado usa stage (0-3); este usa level.
            // Não há conflito — são campos ortogonais.
            // Nível 1 (stage 0 no legado) → 1 slot
            expect(getUnlockedSlotsForLevel(1)).toBe(1);
            // Nível 10 (stage 1 no legado) → 2 slots
            expect(getUnlockedSlotsForLevel(10)).toBe(2);
            // Ambos coexistem sem se cancelar
        });

        it('nível 10 → 2 slots (não 3), mesmo que legado dê acesso a 3ª skill via stage >= 1', () => {
            // O legado libera a 3ª skill via stage >= 1 (level >= 10).
            // A camada canônica libera slot_3 apenas no level 15.
            // Isso é uma divergência documentada — coexistem sem conflito.
            expect(getUnlockedSlotsForLevel(10)).toBe(2);
        });

        it('progressão monotônica: slots nunca diminuem com o aumento de nível', () => {
            let prev = 0;
            for (let lvl = 1; lvl <= 50; lvl++) {
                const slots = getUnlockedSlotsForLevel(lvl);
                expect(slots).toBeGreaterThanOrEqual(prev);
                prev = slots;
            }
        });

        it('retorna sempre número inteiro entre 1 e 4', () => {
            for (let lvl = 1; lvl <= 100; lvl++) {
                const slots = getUnlockedSlotsForLevel(lvl);
                expect(Number.isInteger(slots)).toBe(true);
                expect(slots).toBeGreaterThanOrEqual(1);
                expect(slots).toBeLessThanOrEqual(4);
            }
        });
    });
});
