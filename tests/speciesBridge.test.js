/**
 * SPECIES BRIDGE TESTS (Fase 3)
 *
 * Testes para js/canon/speciesBridge.js
 * Cobertura:
 *   - Tabela RUNTIME_TO_CANON_SPECIES
 *   - resolveCanonSpeciesId()
 *   - applyStatOffsets()
 *   - resolveAndApply() (com mock de getSpeciesStatOffsets via vi.mock)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    RUNTIME_TO_CANON_SPECIES,
    resolveCanonSpeciesId,
    applyStatOffsets,
    resolveAndApply,
    getUnmappedTemplateIds,
    getEligibleUnmappedTemplateIds,
    getBridgeCoverageReport,
} from '../js/canon/speciesBridge.js';

// ---------------------------------------------------------------------------
// Mock de canonLoader — deve ser declarado no escopo do módulo (antes dos describes)
// para ser corretamente hoistado pelo Vitest.
// ---------------------------------------------------------------------------
vi.mock('../js/canon/canonLoader.js', () => ({
    getSpeciesStatOffsets: vi.fn((speciesId) => {
        const offsets = {
            shieldhorn: { hp: 1, atk: -1, def: 1, ene: 0, agi: 0 },
            emberfang:  { hp: 0, atk: 1,  def: -1, ene: 0, agi: 1 },
            moonquill:  { hp: 0, atk: 0,  def: 0,  ene: 1, agi: 0 },
            floracura:  { hp: 1, atk: 0,  def: 0,  ene: 1, agi: -1 },
        };
        return offsets[speciesId] || null;
    }),
    // Mocks mínimos para evitar erros de import
    startCanonBoot:       vi.fn(),
    loadCanonData:        vi.fn(),
    getClassStats:        vi.fn(),
    getClassAdvantages:   vi.fn(),
    getMvpSkillsByClass:  vi.fn(),
    classIdFromPtbr:      vi.fn(),
    classPtbrFromId:      vi.fn(),
    getSpeciesData:       vi.fn(),
    getEvolutionLine:     vi.fn(),
    getLevelMilestones:   vi.fn(),
    getAllLevelMilestones: vi.fn(),
    getClassGrowthRule:   vi.fn(),
    applyCanonToConfig:   vi.fn(),
    _resetCanonCache:     vi.fn(),
}));

// ---------------------------------------------------------------------------
// Dados de offset usados nos testes (espelham species.json)
// ---------------------------------------------------------------------------

const OFFSETS = {
    shieldhorn: { hp: 1, atk: -1, def: 1, ene: 0, agi: 0 },
    emberfang:  { hp: 0, atk: 1,  def: -1, ene: 0, agi: 1 },
    moonquill:  { hp: 0, atk: 0,  def: 0,  ene: 1, agi: 0 },
    floracura:  { hp: 1, atk: 0,  def: 0,  ene: 1, agi: -1 },
};

// Stats base típicos para um monstrinho nível 1
const BASE_STATS = { hpMax: 30, atk: 7, def: 5, spd: 5, eneMax: 10 };

// ===========================================================================
// RUNTIME_TO_CANON_SPECIES — integridade da tabela
// ===========================================================================

describe('speciesBridge — tabela RUNTIME_TO_CANON_SPECIES', () => {

    it('deve conter os 5 mapeamentos definidos na Fase 3', () => {
        expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(5);
    });

    it('MON_010 mapeia para shieldhorn (Guerreiro tank)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_010']).toBe('shieldhorn');
    });

    it('MON_007 mapeia para emberfang (Bárbaro burst)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_007']).toBe('emberfang');
    });

    it('MON_021 mapeia para emberfang (Bárbaro burst compartilhado)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_021']).toBe('emberfang');
    });

    it('MON_003 mapeia para moonquill (Mago controle)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_003']).toBe('moonquill');
    });

    it('MON_004 mapeia para floracura (Curandeiro cura estável)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_004']).toBe('floracura');
    });

    it('todos os valores da tabela devem ser strings não-vazias', () => {
        for (const [k, v] of Object.entries(RUNTIME_TO_CANON_SPECIES)) {
            expect(typeof v, `valor inválido para ${k}`).toBe('string');
            expect(v.length, `valor vazio para ${k}`).toBeGreaterThan(0);
        }
    });
});

// ===========================================================================
// resolveCanonSpeciesId()
// ===========================================================================

describe('speciesBridge — resolveCanonSpeciesId()', () => {

    it('deve retornar o species_id correto para template mapeado', () => {
        expect(resolveCanonSpeciesId('MON_010')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_007')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_003')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_004')).toBe('floracura');
    });

    it('deve retornar null para template não mapeado', () => {
        expect(resolveCanonSpeciesId('MON_001')).toBeNull(); // Cantapau (Bardo)
        expect(resolveCanonSpeciesId('MON_002')).toBeNull(); // Pedrino (Guerreiro)
        expect(resolveCanonSpeciesId('MON_005')).toBeNull(); // Garruncho (Caçador)
        expect(resolveCanonSpeciesId('MON_999')).toBeNull(); // Não existe
    });

    it('deve retornar null para templateId null ou undefined', () => {
        expect(resolveCanonSpeciesId(null)).toBeNull();
        expect(resolveCanonSpeciesId(undefined)).toBeNull();
        expect(resolveCanonSpeciesId('')).toBeNull();
    });
});

// ===========================================================================
// applyStatOffsets()
// ===========================================================================

describe('speciesBridge — applyStatOffsets()', () => {

    it('deve retornar stats inalterados quando offsets são null', () => {
        const { stats, applied } = applyStatOffsets(BASE_STATS, null);
        expect(stats).toEqual(BASE_STATS);
        expect(applied).toBeNull();
    });

    it('deve aplicar offset hp+1 ao hpMax (shieldhorn)', () => {
        const offsets = OFFSETS.shieldhorn; // hp:1, atk:-1, def:1, ene:0, agi:0
        const { stats } = applyStatOffsets(BASE_STATS, offsets);
        expect(stats.hpMax).toBe(BASE_STATS.hpMax + 1); // 31
        expect(stats.atk).toBe(BASE_STATS.atk - 1);    // 6
        expect(stats.def).toBe(BASE_STATS.def + 1);     // 6
        expect(stats.spd).toBe(BASE_STATS.spd);         // inalterado (agi:0)
        expect(stats.eneMax).toBe(BASE_STATS.eneMax);   // inalterado (ene:0)
    });

    it('deve aplicar offset agi+1 ao spd (emberfang)', () => {
        const offsets = OFFSETS.emberfang; // hp:0, atk:1, def:-1, ene:0, agi:1
        const { stats } = applyStatOffsets(BASE_STATS, offsets);
        expect(stats.atk).toBe(BASE_STATS.atk + 1);   // 8
        expect(stats.def).toBe(BASE_STATS.def - 1);   // 4
        expect(stats.spd).toBe(BASE_STATS.spd + 1);   // 6  ← agi→spd
        expect(stats.hpMax).toBe(BASE_STATS.hpMax);   // inalterado
        expect(stats.eneMax).toBe(BASE_STATS.eneMax); // inalterado
    });

    it('deve aplicar offset ene+1 ao eneMax (moonquill)', () => {
        const offsets = OFFSETS.moonquill; // hp:0, atk:0, def:0, ene:1, agi:0
        const { stats } = applyStatOffsets(BASE_STATS, offsets);
        expect(stats.eneMax).toBe(BASE_STATS.eneMax + 1); // 11
        expect(stats.hpMax).toBe(BASE_STATS.hpMax);
        expect(stats.atk).toBe(BASE_STATS.atk);
    });

    it('deve aplicar offsets hp+1, ene+1, agi-1 (floracura)', () => {
        const offsets = OFFSETS.floracura; // hp:1, atk:0, def:0, ene:1, agi:-1
        const { stats } = applyStatOffsets(BASE_STATS, offsets);
        expect(stats.hpMax).toBe(BASE_STATS.hpMax + 1);    // 31
        expect(stats.eneMax).toBe(BASE_STATS.eneMax + 1);  // 11
        expect(stats.spd).toBe(BASE_STATS.spd - 1);        // 4
        expect(stats.atk).toBe(BASE_STATS.atk);            // inalterado
        expect(stats.def).toBe(BASE_STATS.def);             // inalterado
    });

    it('deve registrar apenas offsets com valor diferente de zero em applied', () => {
        const offsets = OFFSETS.shieldhorn; // hp:1, atk:-1, def:1, ene:0, agi:0
        const { applied } = applyStatOffsets(BASE_STATS, offsets);
        expect(applied).not.toBeNull();
        expect(applied.hp).toBe(1);
        expect(applied.atk).toBe(-1);
        expect(applied.def).toBe(1);
        expect(applied.ene).toBeUndefined();  // zero, não registrado
        expect(applied.agi).toBeUndefined();  // zero, não registrado
    });

    it('deve retornar applied: null quando todos os offsets são zero', () => {
        const zeroOffsets = { hp: 0, atk: 0, def: 0, ene: 0, agi: 0 };
        const { applied } = applyStatOffsets(BASE_STATS, zeroOffsets);
        expect(applied).toBeNull();
    });

    it('não deve permitir que stats caiam abaixo de 1', () => {
        const brutalOffsets = { hp: -999, atk: -999, def: -999, ene: -999, agi: -999 };
        const { stats } = applyStatOffsets(BASE_STATS, brutalOffsets);
        expect(stats.hpMax).toBe(1);
        expect(stats.atk).toBe(1);
        expect(stats.def).toBe(1);
        expect(stats.spd).toBe(1);
        expect(stats.eneMax).toBe(1);
    });

    it('não deve mutar o objeto stats original', () => {
        const original = { ...BASE_STATS };
        applyStatOffsets(BASE_STATS, OFFSETS.shieldhorn);
        expect(BASE_STATS).toEqual(original);
    });
});

// ===========================================================================
// resolveAndApply() — com mock de canonLoader
// ===========================================================================

describe('speciesBridge — resolveAndApply()', () => {

    it('deve retornar stats originais + null para template sem mapeamento', () => {
        const result = resolveAndApply('MON_001', BASE_STATS);
        expect(result.stats).toEqual(BASE_STATS);
        expect(result.canonSpeciesId).toBeNull();
        expect(result.canonAppliedOffsets).toBeNull();
    });

    it('deve retornar canonSpeciesId correto para MON_010 (shieldhorn)', () => {
        const result = resolveAndApply('MON_010', BASE_STATS);
        expect(result.canonSpeciesId).toBe('shieldhorn');
    });

    it('deve aplicar offsets de shieldhorn: hpMax+1, atk-1, def+1', () => {
        const result = resolveAndApply('MON_010', BASE_STATS);
        expect(result.stats.hpMax).toBe(BASE_STATS.hpMax + 1);
        expect(result.stats.atk).toBe(BASE_STATS.atk - 1);
        expect(result.stats.def).toBe(BASE_STATS.def + 1);
    });

    it('deve aplicar offsets de emberfang (MON_007): atk+1, def-1, spd+1', () => {
        const result = resolveAndApply('MON_007', BASE_STATS);
        expect(result.canonSpeciesId).toBe('emberfang');
        expect(result.stats.atk).toBe(BASE_STATS.atk + 1);
        expect(result.stats.def).toBe(BASE_STATS.def - 1);
        expect(result.stats.spd).toBe(BASE_STATS.spd + 1);
    });

    it('deve aplicar offsets de emberfang para MON_021 (mesmo arquétipo)', () => {
        const result = resolveAndApply('MON_021', BASE_STATS);
        expect(result.canonSpeciesId).toBe('emberfang');
        expect(result.stats.atk).toBe(BASE_STATS.atk + 1);
    });

    it('deve aplicar offsets de moonquill (MON_003): eneMax+1', () => {
        const result = resolveAndApply('MON_003', BASE_STATS);
        expect(result.canonSpeciesId).toBe('moonquill');
        expect(result.stats.eneMax).toBe(BASE_STATS.eneMax + 1);
    });

    it('deve aplicar offsets de floracura (MON_004): hpMax+1, eneMax+1, spd-1', () => {
        const result = resolveAndApply('MON_004', BASE_STATS);
        expect(result.canonSpeciesId).toBe('floracura');
        expect(result.stats.hpMax).toBe(BASE_STATS.hpMax + 1);
        expect(result.stats.eneMax).toBe(BASE_STATS.eneMax + 1);
        expect(result.stats.spd).toBe(BASE_STATS.spd - 1);
    });

    it('deve registrar canonAppliedOffsets com os deltas não-zero', () => {
        const result = resolveAndApply('MON_010', BASE_STATS);
        expect(result.canonAppliedOffsets).not.toBeNull();
        expect(result.canonAppliedOffsets.hp).toBe(1);
        expect(result.canonAppliedOffsets.atk).toBe(-1);
        expect(result.canonAppliedOffsets.def).toBe(1);
    });

    it('deve retornar canonAppliedOffsets: null quando não há mapeamento', () => {
        const result = resolveAndApply('MON_002', BASE_STATS);
        expect(result.canonAppliedOffsets).toBeNull();
    });

    it('não deve mutar stats originais', () => {
        const original = { ...BASE_STATS };
        resolveAndApply('MON_010', BASE_STATS);
        expect(BASE_STATS).toEqual(original);
    });
});

// ===========================================================================
// ===========================================================================
// DRIFT DETECTION — Fase 3.1
// ===========================================================================

// Catálogo mínimo de teste — cobre casos de base stage + evoluções + classes variadas
const SAMPLE_CATALOG = [
    { id: 'MON_001', class: 'Bardo' },
    { id: 'MON_002', class: 'Guerreiro' },
    { id: 'MON_002B', class: 'Guerreiro' },
    { id: 'MON_003', class: 'Mago' },          // mapeado → moonquill
    { id: 'MON_004', class: 'Curandeiro' },    // mapeado → floracura
    { id: 'MON_007', class: 'Bárbaro' },       // mapeado → emberfang
    { id: 'MON_010', class: 'Guerreiro' },     // mapeado → shieldhorn
    { id: 'MON_014', class: 'Mago' },          // não mapeado — elegível (Mago base)
    { id: 'MON_014B', class: 'Mago' },         // não mapeado — evolução (não elegível)
    { id: 'MON_005', class: 'Caçador' },       // não mapeado — classe sem species canônica
];

describe('speciesBridge — getUnmappedTemplateIds()', () => {

    it('deve retornar lista de templates sem mapeamento', () => {
        const unmapped = getUnmappedTemplateIds(SAMPLE_CATALOG);
        expect(unmapped).toContain('MON_001');
        expect(unmapped).toContain('MON_002');
        expect(unmapped).toContain('MON_002B');
        expect(unmapped).toContain('MON_014');
        expect(unmapped).toContain('MON_005');
    });

    it('NÃO deve incluir templates mapeados na lista de unmapped', () => {
        const unmapped = getUnmappedTemplateIds(SAMPLE_CATALOG);
        expect(unmapped).not.toContain('MON_003');
        expect(unmapped).not.toContain('MON_004');
        expect(unmapped).not.toContain('MON_007');
        expect(unmapped).not.toContain('MON_010');
    });

    it('deve retornar array vazio para catálogo vazio', () => {
        expect(getUnmappedTemplateIds([])).toEqual([]);
    });

    it('deve retornar array vazio para catálogo null/undefined', () => {
        expect(getUnmappedTemplateIds(null)).toEqual([]);
        expect(getUnmappedTemplateIds(undefined)).toEqual([]);
    });

    it('deve ignorar entradas inválidas no catálogo', () => {
        const messy = [null, undefined, { id: null }, { id: 'MON_005', class: 'Caçador' }];
        const unmapped = getUnmappedTemplateIds(messy);
        expect(unmapped).toContain('MON_005');
        expect(unmapped).toHaveLength(1);
    });
});

describe('speciesBridge — getEligibleUnmappedTemplateIds()', () => {

    it('deve retornar templates de base stage com classe com species canônica', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        // MON_002: Guerreiro base, não mapeado — elegível
        expect(eligibleIds).toContain('MON_002');
        // MON_014: Mago base, não mapeado — elegível
        expect(eligibleIds).toContain('MON_014');
    });

    it('NÃO deve incluir evoluções (sufixo de letra) como elegíveis', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).not.toContain('MON_002B');
        expect(eligibleIds).not.toContain('MON_014B');
    });

    it('NÃO deve incluir classes sem species canônica', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).not.toContain('MON_001'); // Bardo — sem species
        expect(eligibleIds).not.toContain('MON_005'); // Caçador — sem species
    });

    it('NÃO deve incluir templates já mapeados', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).not.toContain('MON_003'); // mapeado
        expect(eligibleIds).not.toContain('MON_010'); // mapeado
    });

    it('deve retornar objetos com id e class', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        for (const entry of eligible) {
            expect(entry).toHaveProperty('id');
            expect(entry).toHaveProperty('class');
        }
    });

    it('deve retornar array vazio para catálogo vazio', () => {
        expect(getEligibleUnmappedTemplateIds([])).toEqual([]);
    });
});

describe('speciesBridge — getBridgeCoverageReport()', () => {

    it('deve contar total, mapeados e não mapeados corretamente', () => {
        const report = getBridgeCoverageReport(SAMPLE_CATALOG);
        expect(report.total).toBe(10);
        expect(report.mapped).toBe(4);   // MON_003, MON_004, MON_007, MON_010
        expect(report.unmapped).toBe(6); // MON_001, MON_002, MON_002B, MON_014, MON_014B, MON_005
    });

    it('deve incluir eligibleUnmapped no relatório', () => {
        const report = getBridgeCoverageReport(SAMPLE_CATALOG);
        expect(Array.isArray(report.eligibleUnmapped)).toBe(true);
        expect(report.eligibleUnmapped.length).toBeGreaterThan(0);
    });

    it('deve retornar zeros para catálogo vazio', () => {
        const report = getBridgeCoverageReport([]);
        expect(report.total).toBe(0);
        expect(report.mapped).toBe(0);
        expect(report.unmapped).toBe(0);
        expect(report.eligibleUnmapped).toEqual([]);
    });

    it('deve retornar zeros para argumento null', () => {
        const report = getBridgeCoverageReport(null);
        expect(report.total).toBe(0);
    });
});
