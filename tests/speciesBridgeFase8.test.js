/**
 * SPECIES BRIDGE TESTS — Fase 8
 *
 * Cobertura da expansão controlada do speciesBridge para estágios evoluídos
 * das 4 classes MVP canônicas (Guerreiro, Bárbaro, Mago, Curandeiro).
 *
 * Funções testadas:
 *   - resolveCanonSpeciesId() — novos mapeamentos de evolução
 *   - RUNTIME_TO_CANON_SPECIES — integridade pós-expansão
 *   - getUnmappedTemplateIds() — templates corretos permanecem fora
 *   - getEligibleUnmappedTemplateIds() — base stages MVP já cobertas
 *   - getBridgeCoverageReport() — ganho real de cobertura
 *   - applyStatOffsets() — sem regressão nos offsets existentes
 *
 * Cobertura: 20 novos mapeamentos (evoluções das linhas base mapeadas na Fase 3.2)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    RUNTIME_TO_CANON_SPECIES,
    resolveCanonSpeciesId,
    applyStatOffsets,
    getUnmappedTemplateIds,
    getEligibleUnmappedTemplateIds,
    getBridgeCoverageReport,
} from '../js/canon/speciesBridge.js';

// ---------------------------------------------------------------------------
// Mock de canonLoader
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

// ===========================================================================
// Novos mapeamentos — Guerreiro (shieldhorn)
// ===========================================================================

describe('Fase 8 — Guerreiro → shieldhorn (evoluções)', () => {

    describe('Linha Pedrino (MON_002)', () => {
        it('MON_002B (Pedronar) mapeia para shieldhorn — ATK 10, DEF 8', () => {
            expect(resolveCanonSpeciesId('MON_002B')).toBe('shieldhorn');
        });

        it('MON_002C (Pedragon) mapeia para shieldhorn — ATK 14, DEF 11', () => {
            expect(resolveCanonSpeciesId('MON_002C')).toBe('shieldhorn');
        });
    });

    describe('Linha Ferrozimon (MON_010)', () => {
        it('MON_010B (Cavalheiromon) mapeia para shieldhorn — DEF 12 dominante', () => {
            expect(resolveCanonSpeciesId('MON_010B')).toBe('shieldhorn');
        });

        it('MON_010C (Kinguespinhomon) mapeia para shieldhorn — DEF 16 dominante', () => {
            expect(resolveCanonSpeciesId('MON_010C')).toBe('shieldhorn');
        });

        it('MON_010D (Arconouricomon) mapeia para shieldhorn — DEF não fica atrás de ATK', () => {
            expect(resolveCanonSpeciesId('MON_010D')).toBe('shieldhorn');
        });
    });

    describe('Linha Cascalhimon (MON_026)', () => {
        it('MON_026B (Muralhimon) mapeia para shieldhorn — ATK 9, DEF 12', () => {
            expect(resolveCanonSpeciesId('MON_026B')).toBe('shieldhorn');
        });

        it('MON_026C (Bastiaomon) mapeia para shieldhorn — ATK 11, DEF 16', () => {
            expect(resolveCanonSpeciesId('MON_026C')).toBe('shieldhorn');
        });
    });
});

// ===========================================================================
// Novos mapeamentos — Bárbaro (emberfang)
// ===========================================================================

describe('Fase 8 — Bárbaro → emberfang (evoluções)', () => {

    describe('Linha Tamborilhomon (MON_021)', () => {
        it('MON_021B (Rufamon) mapeia para emberfang — ATK 11, burst preservado', () => {
            expect(resolveCanonSpeciesId('MON_021B')).toBe('emberfang');
        });

        it('MON_021C (Trovatambormon) mapeia para emberfang — ATK 14', () => {
            expect(resolveCanonSpeciesId('MON_021C')).toBe('emberfang');
        });
    });

    describe('Linha Tigrumo (MON_029)', () => {
        it('MON_029B (Rugigron) mapeia para emberfang — ATK 13, DEF 6, burst inequívoco', () => {
            expect(resolveCanonSpeciesId('MON_029B')).toBe('emberfang');
        });

        it('MON_029C (Bestigrar) mapeia para emberfang — ATK 17, fragilidade intencional', () => {
            expect(resolveCanonSpeciesId('MON_029C')).toBe('emberfang');
        });
    });
});

// ===========================================================================
// Novos mapeamentos — Mago (moonquill)
// ===========================================================================

describe('Fase 8 — Mago → moonquill (evoluções)', () => {

    describe('Linha Lagartomon (MON_014)', () => {
        it('MON_014B (Salamandromon) mapeia para moonquill — ENE 11 dominante', () => {
            expect(resolveCanonSpeciesId('MON_014B')).toBe('moonquill');
        });

        it('MON_014C (Dracoflamemon) mapeia para moonquill — ENE 14 dominante', () => {
            expect(resolveCanonSpeciesId('MON_014C')).toBe('moonquill');
        });

        it('MON_014D (Wizardragomon) mapeia para moonquill — ENE 18, forma mais pura do arquétipo', () => {
            expect(resolveCanonSpeciesId('MON_014D')).toBe('moonquill');
        });
    });

    describe('Linha Coralimon (MON_024)', () => {
        it('MON_024B (Recifalmon) mapeia para moonquill — ENE 12 dominante', () => {
            expect(resolveCanonSpeciesId('MON_024B')).toBe('moonquill');
        });

        it('MON_024C (Abissalquimon) mapeia para moonquill — ENE 15, controle_leve inequívoco', () => {
            expect(resolveCanonSpeciesId('MON_024C')).toBe('moonquill');
        });
    });
});

// ===========================================================================
// Novos mapeamentos — Curandeiro (floracura)
// ===========================================================================

describe('Fase 8 — Curandeiro → floracura (evoluções)', () => {

    describe('Linha Gotimon (MON_020)', () => {
        it('MON_020B (Lirialmon) mapeia para floracura — ENE 12 alto, healer estável', () => {
            expect(resolveCanonSpeciesId('MON_020B')).toBe('floracura');
        });

        it('MON_020C (Serafloramon) mapeia para floracura — ENE 16 dominante, suporte defensivo', () => {
            expect(resolveCanonSpeciesId('MON_020C')).toBe('floracura');
        });
    });

    describe('Linha Nutrilo (MON_028)', () => {
        it('MON_028B (Silvelio) mapeia para floracura — ATK 5 mínimo, ENE 14 alto', () => {
            expect(resolveCanonSpeciesId('MON_028B')).toBe('floracura');
        });

        it('MON_028C (Auravelo) mapeia para floracura — ENE 17, healer defensivo inequívoco', () => {
            expect(resolveCanonSpeciesId('MON_028C')).toBe('floracura');
        });
    });
});

// ===========================================================================
// Templates que permanecem sem mapeamento — decisões corretas
// ===========================================================================

describe('Fase 8 — templates sem mapeamento (decisão de design)', () => {

    describe('Bardo — sem espécie canônica', () => {
        it('MON_001 (Cantapau) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_001')).toBeNull();
        });
        it('MON_011 (Dinomon) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_011')).toBeNull();
        });
        it('MON_011B (Guitarapitormon) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_011B')).toBeNull();
        });
        it('MON_027 (Zunzumon) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_027')).toBeNull();
        });
    });

    describe('Caçador — espécie canônica swiftclaw (Fase 9)', () => {
        it('MON_005 (Garruncho) permanece sem mapeamento — sem linha evolutiva', () => {
            expect(resolveCanonSpeciesId('MON_005')).toBeNull();
        });
        it('MON_013 (Miaumon) mapeia para swiftclaw — ATK 8, DEF 4, SPD 9', () => {
            expect(resolveCanonSpeciesId('MON_013')).toBe('swiftclaw');
        });
        it('MON_025 (Pulimbon) mapeia para swiftclaw — ATK 6, DEF 4, SPD 10', () => {
            expect(resolveCanonSpeciesId('MON_025')).toBe('swiftclaw');
        });
    });

    describe('Ladino — espécie canônica shadowsting desde Fase 10', () => {
        it('MON_022 (Corvimon) agora mapeado para shadowsting (Fase 10)', () => {
            expect(resolveCanonSpeciesId('MON_022')).toBe('shadowsting');
        });
        it('MON_008 (Sombrio) permanece sem mapeamento — sem linha evolutiva', () => {
            expect(resolveCanonSpeciesId('MON_008')).toBeNull();
        });
        it('MON_030 (Furtilhon) permanece sem mapeamento — DEF floor marginal / perfil ambíguo', () => {
            expect(resolveCanonSpeciesId('MON_030')).toBeNull();
        });
    });

    describe('Animalista — sem espécie canônica', () => {
        it('MON_006 (Lobinho) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_006')).toBeNull();
        });
        it('MON_012 (Luvursomon) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_012')).toBeNull();
        });
        it('MON_023 (Cervimon) permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_023')).toBeNull();
        });
    });

    it('MON_100 (Rato-de-Lama) permanece sem mapeamento — stats fracos, sem perfil tank', () => {
        expect(resolveCanonSpeciesId('MON_100')).toBeNull();
    });
});

// ===========================================================================
// Cobertura do bridge pós-Fase 8 — catálogo completo simulado
// ===========================================================================

// Catálogo completo do runtime (64 templates)
const FULL_CATALOG = [
    { id: 'MON_001',  class: 'Bardo' },
    { id: 'MON_002',  class: 'Guerreiro' },
    { id: 'MON_002B', class: 'Guerreiro' },
    { id: 'MON_002C', class: 'Guerreiro' },
    { id: 'MON_003',  class: 'Mago' },
    { id: 'MON_004',  class: 'Curandeiro' },
    { id: 'MON_005',  class: 'Caçador' },
    { id: 'MON_006',  class: 'Animalista' },
    { id: 'MON_007',  class: 'Bárbaro' },
    { id: 'MON_008',  class: 'Ladino' },
    { id: 'MON_010',  class: 'Guerreiro' },
    { id: 'MON_010B', class: 'Guerreiro' },
    { id: 'MON_010C', class: 'Guerreiro' },
    { id: 'MON_010D', class: 'Guerreiro' },
    { id: 'MON_011',  class: 'Bardo' },
    { id: 'MON_011B', class: 'Bardo' },
    { id: 'MON_011C', class: 'Bardo' },
    { id: 'MON_011D', class: 'Bardo' },
    { id: 'MON_012',  class: 'Animalista' },
    { id: 'MON_012B', class: 'Animalista' },
    { id: 'MON_012C', class: 'Animalista' },
    { id: 'MON_012D', class: 'Animalista' },
    { id: 'MON_013',  class: 'Caçador' },
    { id: 'MON_013B', class: 'Caçador' },
    { id: 'MON_013C', class: 'Caçador' },
    { id: 'MON_013D', class: 'Caçador' },
    { id: 'MON_014',  class: 'Mago' },
    { id: 'MON_014B', class: 'Mago' },
    { id: 'MON_014C', class: 'Mago' },
    { id: 'MON_014D', class: 'Mago' },
    { id: 'MON_020',  class: 'Curandeiro' },
    { id: 'MON_020B', class: 'Curandeiro' },
    { id: 'MON_020C', class: 'Curandeiro' },
    { id: 'MON_021',  class: 'Bárbaro' },
    { id: 'MON_021B', class: 'Bárbaro' },
    { id: 'MON_021C', class: 'Bárbaro' },
    { id: 'MON_022',  class: 'Ladino' },
    { id: 'MON_022B', class: 'Ladino' },
    { id: 'MON_022C', class: 'Ladino' },
    { id: 'MON_023',  class: 'Animalista' },
    { id: 'MON_023B', class: 'Animalista' },
    { id: 'MON_023C', class: 'Animalista' },
    { id: 'MON_024',  class: 'Mago' },
    { id: 'MON_024B', class: 'Mago' },
    { id: 'MON_024C', class: 'Mago' },
    { id: 'MON_025',  class: 'Caçador' },
    { id: 'MON_025B', class: 'Caçador' },
    { id: 'MON_025C', class: 'Caçador' },
    { id: 'MON_026',  class: 'Guerreiro' },
    { id: 'MON_026B', class: 'Guerreiro' },
    { id: 'MON_026C', class: 'Guerreiro' },
    { id: 'MON_027',  class: 'Bardo' },
    { id: 'MON_027B', class: 'Bardo' },
    { id: 'MON_027C', class: 'Bardo' },
    { id: 'MON_028',  class: 'Curandeiro' },
    { id: 'MON_028B', class: 'Curandeiro' },
    { id: 'MON_028C', class: 'Curandeiro' },
    { id: 'MON_029',  class: 'Bárbaro' },
    { id: 'MON_029B', class: 'Bárbaro' },
    { id: 'MON_029C', class: 'Bárbaro' },
    { id: 'MON_030',  class: 'Ladino' },
    { id: 'MON_030B', class: 'Ladino' },
    { id: 'MON_030C', class: 'Ladino' },
    { id: 'MON_100',  class: 'Guerreiro' },
];

describe('Fase 8 — cobertura do bridge com catálogo completo', () => {

    it('catálogo completo deve ter 64 templates', () => {
        expect(FULL_CATALOG).toHaveLength(64);
    });

    it('deve reportar 42 templates mapeados após Fase 10 (32 Fase 8 + 7 Caçador + 3 Ladino)', () => {
        const report = getBridgeCoverageReport(FULL_CATALOG);
        expect(report.mapped).toBe(42);
    });

    it('deve reportar 22 templates não mapeados (Bardo, Ladino parcial, Animalista, MON_005, MON_100)', () => {
        const report = getBridgeCoverageReport(FULL_CATALOG);
        expect(report.unmapped).toBe(22);
    });

    it('deve reportar total correto de 64', () => {
        const report = getBridgeCoverageReport(FULL_CATALOG);
        expect(report.total).toBe(64);
    });

    it('todos os 42 mapeamentos da tabela devem resolver para valor válido no catálogo completo', () => {
        const mappedIds = new Set(Object.keys(RUNTIME_TO_CANON_SPECIES));
        const catalogIds = new Set(FULL_CATALOG.map(t => t.id));
        for (const id of mappedIds) {
            expect(catalogIds.has(id), `${id} na tabela mas não no catálogo`).toBe(true);
        }
    });

    it('getEligibleUnmappedTemplateIds deve retornar MON_005, MON_100, MON_008, MON_030 no catálogo completo', () => {
        // Após Fase 10: Caçador tem swiftclaw, Ladino tem shadowsting.
        // Elegíveis = base templates não mapeados com classe que tem canonical species:
        //   MON_005 (Caçador, sem linha evolutiva — não mapeado intencionalmente)
        //   MON_100 (Guerreiro, sem perfil tank claro — não mapeado intencionalmente)
        //   MON_008 (Ladino, sem linha evolutiva — não mapeado intencionalmente)
        //   MON_030 (Ladino, perfil ambíguo / DEF floor — não mapeado intencionalmente)
        const eligible = getEligibleUnmappedTemplateIds(FULL_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).toHaveLength(4);
        expect(eligibleIds).toContain('MON_005');
        expect(eligibleIds).toContain('MON_100');
        expect(eligibleIds).toContain('MON_008');
        expect(eligibleIds).toContain('MON_030');
    });

    it('unmapped do catálogo completo não deve conter nenhum template MVP de base ou evolução', () => {
        const unmapped = getUnmappedTemplateIds(FULL_CATALOG);
        // Todos estes devem estar mapeados após Fase 9
        const expectedMapped = [
            'MON_002', 'MON_002B', 'MON_002C',
            'MON_010', 'MON_010B', 'MON_010C', 'MON_010D',
            'MON_026', 'MON_026B', 'MON_026C',
            'MON_007',
            'MON_021', 'MON_021B', 'MON_021C',
            'MON_029', 'MON_029B', 'MON_029C',
            'MON_003',
            'MON_014', 'MON_014B', 'MON_014C', 'MON_014D',
            'MON_024', 'MON_024B', 'MON_024C',
            'MON_004',
            'MON_020', 'MON_020B', 'MON_020C',
            'MON_028', 'MON_028B', 'MON_028C',
            // Caçador — Fase 9
            'MON_013', 'MON_013B', 'MON_013C', 'MON_013D',
            'MON_025', 'MON_025B', 'MON_025C',
        ];
        for (const id of expectedMapped) {
            expect(unmapped, `${id} deveria estar mapeado`).not.toContain(id);
        }
    });

    it('unmapped do catálogo completo deve conter apenas classes sem species e exclusões explícitas', () => {
        const unmapped = getUnmappedTemplateIds(FULL_CATALOG);
        const expectedUnmapped = [
            // Bardo
            'MON_001', 'MON_011', 'MON_011B', 'MON_011C', 'MON_011D',
            'MON_027', 'MON_027B', 'MON_027C',
            // Caçador — apenas MON_005 (sem linha evolutiva); linhas Miaumon e Pulimbon mapeadas
            'MON_005',
            // Ladino — linha Corvimon mapeada na Fase 10; Sombrio e Furtilhon excluídos
            'MON_008',
            'MON_030', 'MON_030B', 'MON_030C',
            // Animalista
            'MON_006', 'MON_012', 'MON_012B', 'MON_012C', 'MON_012D',
            'MON_023', 'MON_023B', 'MON_023C',
            // Guerreiro sem perfil
            'MON_100',
        ];
        expect(unmapped).toHaveLength(22);
        for (const id of expectedUnmapped) {
            expect(unmapped, `${id} deveria estar unmapped`).toContain(id);
        }
    });
});

// ===========================================================================
// Regressão — mapeamentos base da Fase 3.2 permanecem intactos
// ===========================================================================

describe('Fase 8 — regressão: mapeamentos base da Fase 3.2', () => {

    it('todos os 12 mapeamentos originais da Fase 3.2 permanecem corretos', () => {
        // Guerreiro
        expect(resolveCanonSpeciesId('MON_010')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_026')).toBe('shieldhorn');
        // Bárbaro
        expect(resolveCanonSpeciesId('MON_007')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_029')).toBe('emberfang');
        // Mago
        expect(resolveCanonSpeciesId('MON_003')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_024')).toBe('moonquill');
        // Curandeiro
        expect(resolveCanonSpeciesId('MON_004')).toBe('floracura');
        expect(resolveCanonSpeciesId('MON_020')).toBe('floracura');
        expect(resolveCanonSpeciesId('MON_028')).toBe('floracura');
    });
});

// ===========================================================================
// Regressão — offsets dos estágios base continuam corretos
// ===========================================================================

describe('Fase 8 — regressão: applyStatOffsets sem alteração nos offsets canônicos', () => {

    const BASE_STATS = { hpMax: 30, atk: 7, def: 5, spd: 5, eneMax: 10 };

    it('shieldhorn: hp+1, atk-1, def+1 continuam aplicados corretamente', () => {
        const { stats } = applyStatOffsets(BASE_STATS, { hp: 1, atk: -1, def: 1, ene: 0, agi: 0 });
        expect(stats.hpMax).toBe(31);
        expect(stats.atk).toBe(6);
        expect(stats.def).toBe(6);
        expect(stats.spd).toBe(5);
        expect(stats.eneMax).toBe(10);
    });

    it('emberfang: atk+1, def-1, agi+1 continuam aplicados corretamente', () => {
        const { stats } = applyStatOffsets(BASE_STATS, { hp: 0, atk: 1, def: -1, ene: 0, agi: 1 });
        expect(stats.atk).toBe(8);
        expect(stats.def).toBe(4);
        expect(stats.spd).toBe(6);
    });

    it('moonquill: ene+1 continua aplicado corretamente', () => {
        const { stats } = applyStatOffsets(BASE_STATS, { hp: 0, atk: 0, def: 0, ene: 1, agi: 0 });
        expect(stats.eneMax).toBe(11);
        expect(stats.atk).toBe(7);
    });

    it('floracura: hp+1, ene+1, agi-1 continuam aplicados corretamente', () => {
        const { stats } = applyStatOffsets(BASE_STATS, { hp: 1, atk: 0, def: 0, ene: 1, agi: -1 });
        expect(stats.hpMax).toBe(31);
        expect(stats.eneMax).toBe(11);
        expect(stats.spd).toBe(4);
    });

    it('evoluções recebem mesmos offsets do arquétipo — shieldhorn em MON_010D', () => {
        // Arconouricomon tem stats altos: ATK 17, DEF 17
        const highStats = { hpMax: 63, atk: 17, def: 17, spd: 8, eneMax: 9 };
        const { stats } = applyStatOffsets(highStats, { hp: 1, atk: -1, def: 1, ene: 0, agi: 0 });
        // Mesmo arquétipo, offset proporcional pequeno em stats altos
        expect(stats.hpMax).toBe(64);
        expect(stats.atk).toBe(16);
        expect(stats.def).toBe(18);
    });

    it('evoluções recebem mesmos offsets do arquétipo — emberfang em MON_029C', () => {
        // Bestigrar: ATK 17, DEF 9
        const highStats = { hpMax: 60, atk: 17, def: 9, spd: 7, eneMax: 7 };
        const { stats } = applyStatOffsets(highStats, { hp: 0, atk: 1, def: -1, ene: 0, agi: 1 });
        expect(stats.atk).toBe(18);
        expect(stats.def).toBe(8);
        expect(stats.spd).toBe(8);
    });
});

// ===========================================================================
// Integridade da tabela pós-Fase 8
// ===========================================================================

describe('Fase 8 — integridade da tabela RUNTIME_TO_CANON_SPECIES', () => {

    it('deve conter exatamente 42 mapeamentos (32 Fase 8 + 7 Caçador Fase 9 + 3 Ladino Fase 10)', () => {
        expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(42);
    });

    it('todos os valores devem ser strings não-vazias', () => {
        for (const [k, v] of Object.entries(RUNTIME_TO_CANON_SPECIES)) {
            expect(typeof v, `valor inválido para ${k}`).toBe('string');
            expect(v.length, `valor vazio para ${k}`).toBeGreaterThan(0);
        }
    });

    it('todos os valores devem ser species_ids válidos', () => {
        const validSpecies = new Set(['shieldhorn', 'emberfang', 'moonquill', 'floracura', 'swiftclaw', 'shadowsting']);
        for (const [k, v] of Object.entries(RUNTIME_TO_CANON_SPECIES)) {
            expect(validSpecies.has(v), `species inválida "${v}" para ${k}`).toBe(true);
        }
    });

    it('deve ter 10 mapeamentos de Guerreiro (shieldhorn) após Fase 8', () => {
        const guerreiroMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'shieldhorn');
        // MON_002, MON_002B, MON_002C, MON_010, MON_010B, MON_010C, MON_010D, MON_026, MON_026B, MON_026C = 10
        expect(guerreiroMappings).toHaveLength(10);
    });

    it('deve ter 7 mapeamentos de Bárbaro (emberfang) após Fase 8', () => {
        const barbaroMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'emberfang');
        // MON_007, MON_021, MON_021B, MON_021C, MON_029, MON_029B, MON_029C = 7
        expect(barbaroMappings).toHaveLength(7);
    });

    it('deve ter 8 mapeamentos de Mago (moonquill) após Fase 8', () => {
        const magoMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'moonquill');
        // MON_003, MON_014, MON_014B, MON_014C, MON_014D, MON_024, MON_024B, MON_024C = 8
        expect(magoMappings).toHaveLength(8);
    });

    it('deve ter 7 mapeamentos de Curandeiro (floracura) após Fase 8', () => {
        const curandeiroMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'floracura');
        // MON_004, MON_020, MON_020B, MON_020C, MON_028, MON_028B, MON_028C = 7
        expect(curandeiroMappings).toHaveLength(7);
    });
});
