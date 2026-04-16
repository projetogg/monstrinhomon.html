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

    describe('Linha Ferrozimon (MON_001)', () => {
        it('MON_002 (Cavalheiromon) mapeia para shieldhorn — DEF 12 dominante', () => {
            expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
        });

        it('MON_003 (Kinguespinhomon) mapeia para shieldhorn — DEF 16 dominante', () => {
            expect(resolveCanonSpeciesId('MON_003')).toBe('shieldhorn');
        });

        it('MON_004 (Arconouricomon) mapeia para shieldhorn — DEF não fica atrás de ATK', () => {
            expect(resolveCanonSpeciesId('MON_004')).toBe('shieldhorn');
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

    describe('Linha Lagartomon (MON_013)', () => {
        it('MON_014 (Salamandromon) mapeia para moonquill — ENE 11 dominante', () => {
            expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
        });

        it('MON_015 (Dracoflamemon) mapeia para moonquill — ENE 14 dominante', () => {
            expect(resolveCanonSpeciesId('MON_015')).toBe('moonquill');
        });

        it('MON_016 (Wizardragomon) mapeia para moonquill — ENE 18, forma mais pura do arquétipo', () => {
            expect(resolveCanonSpeciesId('MON_016')).toBe('moonquill');
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

    describe('Bardo — mapeamento parcial (linha Dinomon)', () => {
        it('MON_005 (Dinomon) mapeia para bellwave — SPD/ATK 1.50, ENE/ATK 1.17', () => {
            expect(resolveCanonSpeciesId('MON_005')).toBe('bellwave');
        });
        it('MON_006 (Guitarapitormon) mapeia para bellwave — SPD e ENE superam ATK', () => {
            expect(resolveCanonSpeciesId('MON_006')).toBe('bellwave');
        });
        it('MON_007 (TRockmon) mapeia para bellwave — arquétipo ainda sustentado', () => {
            expect(resolveCanonSpeciesId('MON_007')).toBe('bellwave');
        });
        it('MON_008 (Giganotometalmon) permanece sem mapeamento — drift bruiser (ATK > SPD)', () => {
            expect(resolveCanonSpeciesId('MON_008')).toBeNull();
        });
        it('MON_027 (Zunzumon) mapeado para bellwave na Fase 11 — não permanece sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_027')).toBe('bellwave');
        });
    });

    describe('Caçador — espécie canônica swiftclaw (Fase 9)', () => {
        it('MON_009 (Miaumon) mapeia para swiftclaw — ATK 8, DEF 4, SPD 9', () => {
            expect(resolveCanonSpeciesId('MON_009')).toBe('swiftclaw');
        });
        it('MON_025 (Pulimbon) mapeia para swiftclaw — ATK 6, DEF 4, SPD 10', () => {
            expect(resolveCanonSpeciesId('MON_025')).toBe('swiftclaw');
        });
    });

    describe('Ladino — espécie canônica shadowsting desde Fase 10', () => {
        it('MON_022 (Corvimon) agora mapeado para shadowsting (Fase 10)', () => {
            expect(resolveCanonSpeciesId('MON_022')).toBe('shadowsting');
        });
        it('MON_030 (Furtilhon) permanece sem mapeamento — DEF floor marginal / perfil ambíguo', () => {
            expect(resolveCanonSpeciesId('MON_030')).toBeNull();
        });
    });

    describe('Animalista — sem espécie canônica (exceto wildpace — Fase 12)', () => {
        it('MON_017 (Luvursomon) permanece sem mapeamento — drift burst/ATK, risco de colisão', () => {
            expect(resolveCanonSpeciesId('MON_017')).toBeNull();
        });
        it('MON_023 (Cervimon) agora mapeado para wildpace (Fase 12)', () => {
            expect(resolveCanonSpeciesId('MON_023')).toBe('wildpace');
        });
    });

    it('MON_100 (Rato-de-Lama) permanece sem mapeamento — stats fracos, sem perfil tank', () => {
        expect(resolveCanonSpeciesId('MON_100')).toBeNull();
    });
});

// ===========================================================================
// Cobertura do bridge pós-Fase 8 — catálogo completo simulado
// ===========================================================================

// Catálogo completo do runtime pós-Phase 1 (51 templates)
const FULL_CATALOG = [
    // Phase 1 — Guerreiro (Ferrozimon line)
    { id: 'MON_001',  class: 'Guerreiro' },
    { id: 'MON_002',  class: 'Guerreiro' },
    { id: 'MON_003',  class: 'Guerreiro' },
    { id: 'MON_004',  class: 'Guerreiro' },
    // Phase 1 — Bardo (Dinomon line)
    { id: 'MON_005',  class: 'Bardo' },
    { id: 'MON_006',  class: 'Bardo' },
    { id: 'MON_007',  class: 'Bardo' },
    { id: 'MON_008',  class: 'Bardo' },
    // Phase 1 — Caçador (Miaumon line)
    { id: 'MON_009',  class: 'Caçador' },
    { id: 'MON_010',  class: 'Caçador' },
    { id: 'MON_011',  class: 'Caçador' },
    { id: 'MON_012',  class: 'Caçador' },
    // Phase 1 — Mago (Lagartomon line)
    { id: 'MON_013',  class: 'Mago' },
    { id: 'MON_014',  class: 'Mago' },
    { id: 'MON_015',  class: 'Mago' },
    { id: 'MON_016',  class: 'Mago' },
    // Phase 1 — Animalista (Luvursomon line)
    { id: 'MON_017',  class: 'Animalista' },
    { id: 'MON_018',  class: 'Animalista' },
    { id: 'MON_019',  class: 'Animalista' },
    { id: 'MON_020',  class: 'Animalista' },
    // MON_021-030 canonical families
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

    it('catálogo completo deve ter 51 templates', () => {
        expect(FULL_CATALOG).toHaveLength(51);
    });

    it('deve reportar 42 templates mapeados após Phase 1 (7 Guerreiro + 6 Bárbaro + 7 Mago + 3 Curandeiro + 7 Caçador + 3 Ladino + 6 Bardo + 3 Animalista)', () => {
        const report = getBridgeCoverageReport(FULL_CATALOG);
        expect(report.mapped).toBe(42);
    });

    it('deve reportar 9 templates não mapeados (MON_008, MON_017-020, MON_030/B/C, MON_100)', () => {
        const report = getBridgeCoverageReport(FULL_CATALOG);
        expect(report.unmapped).toBe(9);
    });

    it('deve reportar total correto de 51', () => {
        const report = getBridgeCoverageReport(FULL_CATALOG);
        expect(report.total).toBe(51);
    });

    it('todos os 42 mapeamentos da tabela devem resolver para valor válido no catálogo completo', () => {
        const mappedIds = new Set(Object.keys(RUNTIME_TO_CANON_SPECIES));
        const catalogIds = new Set(FULL_CATALOG.map(t => t.id));
        for (const id of mappedIds) {
            expect(catalogIds.has(id), `${id} na tabela mas não no catálogo`).toBe(true);
        }
    });

    it('getEligibleUnmappedTemplateIds deve retornar MON_008, MON_017, MON_018, MON_019, MON_020, MON_030, MON_100 no catálogo completo', () => {
        // Elegíveis = base templates não mapeados com classe que tem canonical species:
        //   MON_008 (Bardo, drift bruiser — excluído intencionalmente)
        //   MON_017 (Animalista, drift burst/ATK — excluído intencionalmente)
        //   MON_018 (Animalista, idem)
        //   MON_019 (Animalista, idem)
        //   MON_020 (Animalista, idem)
        //   MON_030 (Ladino, perfil ambíguo / DEF floor — excluído intencionalmente)
        //   MON_100 (Guerreiro, sem perfil tank claro — excluído intencionalmente)
        const eligible = getEligibleUnmappedTemplateIds(FULL_CATALOG);
        const eligibleIds = eligible.map(e => e.id);
        expect(eligibleIds).toHaveLength(7);
        expect(eligibleIds).toContain('MON_008');
        expect(eligibleIds).toContain('MON_017');
        expect(eligibleIds).toContain('MON_018');
        expect(eligibleIds).toContain('MON_019');
        expect(eligibleIds).toContain('MON_020');
        expect(eligibleIds).toContain('MON_030');
        expect(eligibleIds).toContain('MON_100');
        expect(eligibleIds).not.toContain('MON_005'); // agora mapeado como bellwave
        expect(eligibleIds).not.toContain('MON_009'); // agora mapeado como swiftclaw
    });

    it('unmapped do catálogo completo não deve conter nenhum template MVP de base ou evolução', () => {
        const unmapped = getUnmappedTemplateIds(FULL_CATALOG);
        const expectedMapped = [
            // Guerreiro — linha Ferrozimon
            'MON_001', 'MON_002', 'MON_003', 'MON_004',
            'MON_026', 'MON_026B', 'MON_026C',
            // Bárbaro
            'MON_021', 'MON_021B', 'MON_021C',
            'MON_029', 'MON_029B', 'MON_029C',
            // Mago — linha Lagartomon
            'MON_013', 'MON_014', 'MON_015', 'MON_016',
            'MON_024', 'MON_024B', 'MON_024C',
            // Curandeiro — linha Nutrilo
            'MON_028', 'MON_028B', 'MON_028C',
            // Caçador — linha Miaumon e Pulimbon
            'MON_009', 'MON_010', 'MON_011', 'MON_012',
            'MON_025', 'MON_025B', 'MON_025C',
            // Ladino
            'MON_022', 'MON_022B', 'MON_022C',
            // Bardo — linha Dinomon e Zunzumon
            'MON_005', 'MON_006', 'MON_007',
            'MON_027', 'MON_027B', 'MON_027C',
            // Animalista — linha Cervimon
            'MON_023', 'MON_023B', 'MON_023C',
        ];
        for (const id of expectedMapped) {
            expect(unmapped, `${id} deveria estar mapeado`).not.toContain(id);
        }
    });

    it('unmapped do catálogo completo deve conter apenas exclusões explícitas', () => {
        const unmapped = getUnmappedTemplateIds(FULL_CATALOG);
        const expectedUnmapped = [
            // Bardo — Giganotometalmon excluído por drift bruiser
            'MON_008',
            // Animalista — linha Luvursomon excluída por drift burst/ATK
            'MON_017', 'MON_018', 'MON_019', 'MON_020',
            // Ladino — linha Furtilhon excluída por DEF floor / perfil ambíguo
            'MON_030', 'MON_030B', 'MON_030C',
            // Guerreiro sem perfil tank
            'MON_100',
        ];
        expect(unmapped).toHaveLength(9);
        for (const id of expectedUnmapped) {
            expect(unmapped, `${id} deveria estar unmapped`).toContain(id);
        }
    });
});

// ===========================================================================
// Regressão — mapeamentos base da Fase 3.2 permanecem intactos
// ===========================================================================

describe('Fase 8 — regressão: mapeamentos base da Fase 3.2 (atualizados para Phase 1)', () => {

    it('todos os mapeamentos base canônicos permanecem corretos após Phase 1', () => {
        // Guerreiro
        expect(resolveCanonSpeciesId('MON_001')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_026')).toBe('shieldhorn');
        // Bárbaro
        expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_029')).toBe('emberfang');
        // Mago
        expect(resolveCanonSpeciesId('MON_013')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_024')).toBe('moonquill');
        // Curandeiro
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

    it('evoluções recebem mesmos offsets do arquétipo — shieldhorn em MON_004 (Arconouricomon)', () => {
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

describe('Fase 8 — integridade da tabela RUNTIME_TO_CANON_SPECIES (pós-Phase 1)', () => {

    it('deve conter exatamente 42 mapeamentos (7 Guerreiro + 6 Bárbaro + 7 Mago + 3 Curandeiro + 7 Caçador + 3 Ladino + 6 Bardo + 3 Animalista)', () => {
        expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(42);
    });

    it('todos os valores devem ser strings não-vazias', () => {
        for (const [k, v] of Object.entries(RUNTIME_TO_CANON_SPECIES)) {
            expect(typeof v, `valor inválido para ${k}`).toBe('string');
            expect(v.length, `valor vazio para ${k}`).toBeGreaterThan(0);
        }
    });

    it('todos os valores devem ser species_ids válidos', () => {
        const validSpecies = new Set(['shieldhorn', 'emberfang', 'moonquill', 'floracura', 'swiftclaw', 'shadowsting', 'bellwave', 'wildpace']);
        for (const [k, v] of Object.entries(RUNTIME_TO_CANON_SPECIES)) {
            expect(validSpecies.has(v), `species inválida "${v}" para ${k}`).toBe(true);
        }
    });

    it('deve ter 7 mapeamentos de Guerreiro (shieldhorn) após Phase 1', () => {
        const guerreiroMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'shieldhorn');
        // MON_001, MON_002, MON_003, MON_004, MON_026, MON_026B, MON_026C = 7
        expect(guerreiroMappings).toHaveLength(7);
    });

    it('deve ter 6 mapeamentos de Bárbaro (emberfang) após Phase 1', () => {
        const barbaroMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'emberfang');
        // MON_021, MON_021B, MON_021C, MON_029, MON_029B, MON_029C = 6
        expect(barbaroMappings).toHaveLength(6);
    });

    it('deve ter 7 mapeamentos de Mago (moonquill) após Phase 1', () => {
        const magoMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'moonquill');
        // MON_013, MON_014, MON_015, MON_016, MON_024, MON_024B, MON_024C = 7
        expect(magoMappings).toHaveLength(7);
    });

    it('deve ter 3 mapeamentos de Curandeiro (floracura) após Phase 1', () => {
        const curandeiroMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'floracura');
        // MON_028, MON_028B, MON_028C = 3
        expect(curandeiroMappings).toHaveLength(3);
    });

    it('deve ter 7 mapeamentos de Caçador (swiftclaw) após Phase 1', () => {
        const swiftclawMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'swiftclaw');
        // MON_009, MON_010, MON_011, MON_012, MON_025, MON_025B, MON_025C = 7
        expect(swiftclawMappings).toHaveLength(7);
    });

    it('deve ter 6 mapeamentos de Bardo (bellwave) após Phase 1', () => {
        const bellwaveMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'bellwave');
        // MON_005, MON_006, MON_007, MON_027, MON_027B, MON_027C = 6
        expect(bellwaveMappings).toHaveLength(6);
    });
});
