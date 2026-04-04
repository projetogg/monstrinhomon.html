/**
 * SPECIES BRIDGE TESTS (Fase 3 / Fase 3.2 / Fase 8 / Fase 9)
 *
 * Testes para js/canon/speciesBridge.js
 * Cobertura:
 *   - Tabela RUNTIME_TO_CANON_SPECIES (39 mapeamentos após Fase 9)
 *   - resolveCanonSpeciesId()
 *   - applyStatOffsets()
 *   - resolveAndApply() (com mock de getSpeciesStatOffsets via vi.mock)
 *   - getUnmappedTemplateIds() / getEligibleUnmappedTemplateIds() / getBridgeCoverageReport()
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

    it('deve conter os 51 mapeamentos definidos na Fase 13.2 (12 bases + 20 evoluções MVP + 7 Caçador + 3 Ladino + 6 Bardo + 3 Animalista)', () => {
        // Valor 51 fixo e intencional: documenta o estado do bridge após Fase 13.2.
        // Atualizar junto com cada novo mapeamento adicionado à tabela.
        expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(51);
    });

    it('MON_010 mapeia para shieldhorn (Guerreiro tank — DEF 9)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_010']).toBe('shieldhorn');
    });

    it('MON_002 mapeia para shieldhorn (Guerreiro equilibrado — offsets inclinam para tank)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_002']).toBe('shieldhorn');
    });

    it('MON_026 mapeia para shieldhorn (Guerreiro DEF 8 / SPD 3 — perfil tank claro)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_026']).toBe('shieldhorn');
    });

    it('MON_007 mapeia para emberfang (Bárbaro burst)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_007']).toBe('emberfang');
    });

    it('MON_021 mapeia para emberfang (Bárbaro burst compartilhado)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_021']).toBe('emberfang');
    });

    it('MON_029 mapeia para emberfang (Bárbaro ATK 9 — burst inequívoco)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_029']).toBe('emberfang');
    });

    it('MON_003 mapeia para moonquill (Mago controle — ENE 10)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_003']).toBe('moonquill');
    });

    it('MON_014 mapeia para moonquill (Mago controle_leve — ENE 8)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_014']).toBe('moonquill');
    });

    it('MON_024 mapeia para moonquill (Mago defensivo/controle — ATK 5 / DEF 6 / ENE 8)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_024']).toBe('moonquill');
    });

    it('MON_004 mapeia para floracura (Curandeiro cura estável — ENE 12)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_004']).toBe('floracura');
    });

    it('MON_020 mapeia para floracura (Curandeiro cura estável — ENE 9)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_020']).toBe('floracura');
    });

    it('MON_028 mapeia para floracura (Curandeiro suporte puro — ATK 3 / ENE 11)', () => {
        expect(RUNTIME_TO_CANON_SPECIES['MON_028']).toBe('floracura');
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

    it('deve retornar o species_id correto para todos os templates mapeados', () => {
        // Guerreiro → shieldhorn
        expect(resolveCanonSpeciesId('MON_010')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_026')).toBe('shieldhorn');
        // Bárbaro → emberfang
        expect(resolveCanonSpeciesId('MON_007')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_029')).toBe('emberfang');
        // Mago → moonquill
        expect(resolveCanonSpeciesId('MON_003')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_024')).toBe('moonquill');
        // Curandeiro → floracura
        expect(resolveCanonSpeciesId('MON_004')).toBe('floracura');
        expect(resolveCanonSpeciesId('MON_020')).toBe('floracura');
        expect(resolveCanonSpeciesId('MON_028')).toBe('floracura');
    });

    it('deve retornar null para template não mapeado', () => {
        expect(resolveCanonSpeciesId('MON_001')).toBeNull(); // Cantapau (Bardo)
        expect(resolveCanonSpeciesId('MON_005')).toBeNull(); // Garruncho (Caçador)
        expect(resolveCanonSpeciesId('MON_100')).toBeNull(); // Rato-de-Lama (sem perfil tank)
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
        const result = resolveAndApply('MON_100', BASE_STATS); // Rato-de-Lama — sem mapeamento
        expect(result.canonAppliedOffsets).toBeNull();
    });

    // ── Novos mapeamentos Fase 3.2 ─────────────────────────────────────────

    it('deve aplicar offsets de shieldhorn para MON_002 (Pedrino — Guerreiro equilibrado)', () => {
        const result = resolveAndApply('MON_002', BASE_STATS);
        expect(result.canonSpeciesId).toBe('shieldhorn');
        expect(result.stats.hpMax).toBe(BASE_STATS.hpMax + 1);
        expect(result.stats.atk).toBe(BASE_STATS.atk - 1);
        expect(result.stats.def).toBe(BASE_STATS.def + 1);
    });

    it('deve aplicar offsets de shieldhorn para MON_026 (Cascalhimon — Guerreiro tank)', () => {
        const result = resolveAndApply('MON_026', BASE_STATS);
        expect(result.canonSpeciesId).toBe('shieldhorn');
        expect(result.stats.def).toBe(BASE_STATS.def + 1);
    });

    it('deve aplicar offsets de emberfang para MON_029 (Tigrumo — Bárbaro burst)', () => {
        const result = resolveAndApply('MON_029', BASE_STATS);
        expect(result.canonSpeciesId).toBe('emberfang');
        expect(result.stats.atk).toBe(BASE_STATS.atk + 1);
        expect(result.stats.def).toBe(BASE_STATS.def - 1);
        expect(result.stats.spd).toBe(BASE_STATS.spd + 1);
    });

    it('deve aplicar offsets de moonquill para MON_014 (Lagartomon — Mago controle_leve)', () => {
        const result = resolveAndApply('MON_014', BASE_STATS);
        expect(result.canonSpeciesId).toBe('moonquill');
        expect(result.stats.eneMax).toBe(BASE_STATS.eneMax + 1);
        expect(result.stats.atk).toBe(BASE_STATS.atk); // inalterado
    });

    it('deve aplicar offsets de moonquill para MON_024 (Coralimon — Mago defensivo)', () => {
        const result = resolveAndApply('MON_024', BASE_STATS);
        expect(result.canonSpeciesId).toBe('moonquill');
        expect(result.stats.eneMax).toBe(BASE_STATS.eneMax + 1);
    });

    it('deve aplicar offsets de floracura para MON_020 (Gotimon — healer estável)', () => {
        const result = resolveAndApply('MON_020', BASE_STATS);
        expect(result.canonSpeciesId).toBe('floracura');
        expect(result.stats.hpMax).toBe(BASE_STATS.hpMax + 1);
        expect(result.stats.eneMax).toBe(BASE_STATS.eneMax + 1);
        expect(result.stats.spd).toBe(BASE_STATS.spd - 1);
    });

    it('deve aplicar offsets de floracura para MON_028 (Nutrilo — suporte puro)', () => {
        const result = resolveAndApply('MON_028', BASE_STATS);
        expect(result.canonSpeciesId).toBe('floracura');
        expect(result.stats.hpMax).toBe(BASE_STATS.hpMax + 1);
        expect(result.stats.eneMax).toBe(BASE_STATS.eneMax + 1);
        expect(result.stats.spd).toBe(BASE_STATS.spd - 1);
    });

    it('não deve mutar stats originais', () => {
        const original = { ...BASE_STATS };
        resolveAndApply('MON_010', BASE_STATS);
        expect(BASE_STATS).toEqual(original);
    });
});

// ===========================================================================
// DRIFT DETECTION — Fase 3.1 / atualizado na Fase 3.2
// ===========================================================================

// Catálogo mínimo de teste — cobre base stages + evoluções + classes variadas
// Atualizado na Fase 8: MON_002B e MON_014B agora mapeados; substituídos por
// MON_011B (Bardo evolução) e MON_030B (Ladino evolução) — sem mapeamento.
// Atualizado na Fase 9: Caçador agora tem species (swiftclaw). MON_005 (Garruncho)
// passa a ser elegível pelo getEligibleUnmappedTemplateIds mas não foi mapeado
// intencionalmente (sem linha evolutiva validável).
// Atualizado na Fase 11: Bardo agora tem species (bellwave). MON_027/B/C mapeados.
// Atualizado na Fase 13.2: MON_011/B/C mapeados como bellwave. MON_011D continua excluído.
// MON_001 permanece não mapeado (sem linha evolutiva validável).
// SAMPLE_CATALOG usa MON_030B (linha Furtilhon — não mapeada) para representar Ladino
// não mapeado (substituiu MON_022B que foi mapeado na Fase 10).
const SAMPLE_CATALOG = [
    { id: 'MON_001', class: 'Bardo' },          // não mapeado — sem linha evolutiva (Fase 11)
    { id: 'MON_002', class: 'Guerreiro' },       // mapeado → shieldhorn (Fase 3.2)
    { id: 'MON_011D', class: 'Bardo' },          // não mapeado — drift irreversível em estágio final (excluído Fase 13.2)
    { id: 'MON_003', class: 'Mago' },            // mapeado → moonquill
    { id: 'MON_004', class: 'Curandeiro' },      // mapeado → floracura
    { id: 'MON_007', class: 'Bárbaro' },         // mapeado → emberfang
    { id: 'MON_010', class: 'Guerreiro' },       // mapeado → shieldhorn
    { id: 'MON_014', class: 'Mago' },            // mapeado → moonquill (Fase 3.2)
    { id: 'MON_030B', class: 'Ladino' },         // não mapeado — linha excluída (DEF floor / perfil ambíguo)
    { id: 'MON_005', class: 'Caçador' },         // não mapeado — sem linha evolutiva (Fase 9)
    { id: 'MON_100', class: 'Guerreiro' },       // não mapeado — sem perfil tank claro
];

describe('speciesBridge — getUnmappedTemplateIds()', () => {

    it('deve retornar lista de templates sem mapeamento', () => {
        const unmapped = getUnmappedTemplateIds(SAMPLE_CATALOG);
        expect(unmapped).toContain('MON_001');
        expect(unmapped).toContain('MON_011D');
        expect(unmapped).toContain('MON_030B');
        expect(unmapped).toContain('MON_005');
        expect(unmapped).toContain('MON_100');
    });

    it('NÃO deve incluir templates mapeados na lista de unmapped', () => {
        const unmapped = getUnmappedTemplateIds(SAMPLE_CATALOG);
        expect(unmapped).not.toContain('MON_002'); // mapeado na Fase 3.2
        expect(unmapped).not.toContain('MON_003');
        expect(unmapped).not.toContain('MON_004');
        expect(unmapped).not.toContain('MON_007');
        expect(unmapped).not.toContain('MON_010');
        expect(unmapped).not.toContain('MON_014'); // mapeado na Fase 3.2
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

    it('deve retornar templates de base stage com classe com species canônica e sem mapeamento', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        // MON_100: Guerreiro base, não mapeado — elegível (mas sem arquétipo forte)
        expect(eligibleIds).toContain('MON_100');
    });

    it('NÃO deve incluir templates já mapeados na Fase 3.2', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).not.toContain('MON_002'); // mapeado Fase 3.2
        expect(eligibleIds).not.toContain('MON_014'); // mapeado Fase 3.2
    });

    it('NÃO deve incluir evoluções sem species canônica como elegíveis', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).not.toContain('MON_011B');  // Bardo evolução (sufixo B) — não elegível por regex
        expect(eligibleIds).not.toContain('MON_030B');  // Ladino evolução (sufixo B) — não elegível
    });

    it('NÃO deve incluir classes sem species canônica (mas inclui classes com species que ficaram sem mapeamento)', () => {
        const eligible = getEligibleUnmappedTemplateIds(SAMPLE_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        // MON_001 (Bardo base) agora É elegível — Bardo tem species (bellwave, Fase 11),
        // mas MON_001 não foi mapeado (sem linha evolutiva validável).
        // Isso é esperado: getEligibleUnmappedTemplateIds sinaliza candidatos para avaliação.
        expect(eligibleIds).toContain('MON_001'); // Bardo base — elegível mas excluído por decisão de design
        expect(eligibleIds).not.toContain('MON_011B'); // Bardo evolução (sufixo B) — não elegível por regex
        // MON_005 (Caçador) é ELEGÍVEL (Caçador tem swiftclaw desde Fase 9)
        // mas não foi mapeado por decisão de design (sem linha evolutiva validável).
        expect(eligibleIds).not.toContain('MON_030B'); // Ladino evolução (sufixo B) — não elegível por regex
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

    it('deve contar total, mapeados e não mapeados corretamente (Fase 8)', () => {
        const report = getBridgeCoverageReport(SAMPLE_CATALOG);
        // SAMPLE_CATALOG: 11 entradas
        // Mapeados: MON_002, MON_003, MON_004, MON_007, MON_010, MON_014 = 6
        // Não mapeados: MON_001, MON_011D, MON_030B, MON_005, MON_100 = 5
        expect(report.total).toBe(11);
        expect(report.mapped).toBe(6);
        expect(report.unmapped).toBe(5);
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
