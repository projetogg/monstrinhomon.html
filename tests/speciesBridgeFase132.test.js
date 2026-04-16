/**
 * SPECIES BRIDGE TESTS — Fase 13.2
 *
 * Cobertura da expansão da Fase 13.2: ampliação de bridge das espécies novas
 * (shadowsting, bellwave, wildpace) com base em auditoria criteriosa do catálogo.
 *
 * RESULTADO DA AUDITORIA:
 *
 *   shadowsting (Ladino/oportunista_furtivo): 0 novos mapeamentos.
 *     Candidatos analisados e mantidos excluídos:
 *     - MON_008 (Sombrio): estágio único, sem linha evolutiva — excluído.
 *     - MON_030/B/C: ATK/DEF após offsets {atk+1,def-1} extremo (4.5→3.0→2.67);
 *       DEF_off=2 no base stage; ENE/ATK mais baixo que MON_022 line. Excluído.
 *
 *   bellwave (Bardo/cadencia_ritmica): +3 novos mapeamentos (MON_011/B/C).
 *     Linha Dinomon → Guitarapitormon → TRockmon: todos com SPD/ATK ≥ 1.18 e
 *     ENE/ATK ≥ 1.0 após offsets {def-1,ene+1,agi+1}. DEF_off ≥ 4 em todos.
 *     MON_011D (Giganotometalmon) excluído: SPD/ATK=0.75 < 1.0 — drift irreversível.
 *     Mapeamento parcial seguro pela garantia de que canonSpeciesId é estático.
 *
 *   wildpace (Animalista/equilíbrio_adaptativo): 0 novos mapeamentos.
 *     Candidatos analisados e mantidos excluídos:
 *     - MON_006 (Lobinho): estágio único, sem linha evolutiva — excluído.
 *     - MON_012/B/C/D: ATK:DEF drift começa em S1 (1.25) e cresce até D (1.29);
 *       ENE_off=4 no base stage (muito apertado). Excluído.
 *
 * COBERTURA PÓS-FASE 13.2:
 *   shadowsting: 3 templates (MON_022/B/C) — inalterado.
 *   bellwave: 6 templates (MON_027/B/C + MON_011/B/C) — dobrou.
 *   wildpace: 3 templates (MON_023/B/C) — inalterado.
 *   Total bridge: 48 → 51 mapeamentos.
 *
 * Cobertura deste arquivo:
 *   - Novos mapeamentos: MON_011/B/C → bellwave (Parte 1)
 *   - Exclusão de MON_011D: mapeamento parcial da linha (Parte 2)
 *   - Confirmação de exclusões shadowsting (Parte 3)
 *   - Confirmação de exclusões wildpace (Parte 4)
 *   - Offsets verificados para os novos templates (Parte 5)
 *   - Regressão: espécies antigas e novas existentes intactas (Parte 6)
 *   - Cobertura total: 51 mapeamentos (Parte 7)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    RUNTIME_TO_CANON_SPECIES,
    resolveCanonSpeciesId,
    applyStatOffsets,
} from '../js/canon/speciesBridge.js';
import {
    resolvePassiveModifier,
} from '../js/canon/speciesPassives.js';
import {
    applyKitSwaps,
    hasKitSwap,
} from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Mock de canonLoader — segue padrão dos testes anteriores
// ---------------------------------------------------------------------------
vi.mock('../js/canon/canonLoader.js', () => ({
    getSpeciesStatOffsets: vi.fn((speciesId) => {
        const offsets = {
            shieldhorn:   { hp: 1,  atk: -1, def: 1,  ene: 0,  agi: 0  },
            emberfang:    { hp: 0,  atk: 1,  def: -1, ene: 0,  agi: 1  },
            moonquill:    { hp: 0,  atk: 0,  def: 0,  ene: 1,  agi: 0  },
            floracura:    { hp: 1,  atk: 0,  def: 0,  ene: 1,  agi: -1 },
            swiftclaw:    { hp: 0,  atk: 1,  def: -1, ene: 0,  agi: 1  },
            shadowsting:  { hp: 0,  atk: 1,  def: -1, ene: 1,  agi: 0  },
            bellwave:     { hp: 0,  atk: 0,  def: -1, ene: 1,  agi: 1  },
            wildpace:     { hp: 1,  atk: 0,  def: 0,  ene: -1, agi: 1  },
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
// Parte 1 — Novos mapeamentos bellwave: MON_011/B/C
// ===========================================================================

describe('Fase 13.2 — bellwave — novos mapeamentos da linha Dinomon', () => {

    describe('Mapeamentos diretos', () => {
        it('MON_005 (Dinomon, Comum) mapeia para bellwave — SPD/ATK 1.50, ENE/ATK 1.17 após offsets', () => {
            expect(resolveCanonSpeciesId('MON_005')).toBe('bellwave');
        });

        it('MON_006 (Guitarapitormon, Incomum) mapeia para bellwave — SPD/ATK 1.38, ENE/ATK 1.12 após offsets', () => {
            expect(resolveCanonSpeciesId('MON_006')).toBe('bellwave');
        });

        it('MON_007 (TRockmon, Raro) mapeia para bellwave — SPD/ATK 1.18, ENE/ATK 1.00 após offsets', () => {
            expect(resolveCanonSpeciesId('MON_007')).toBe('bellwave');
        });
    });

    describe('Contagem na tabela', () => {
        it('bellwave tem agora 6 mapeamentos (3 Fase 11 + 3 Fase 13.2)', () => {
            const bellwaveIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'bellwave')
                .map(([k]) => k);
            expect(bellwaveIds).toHaveLength(6);
        });

        it('os 6 mapeamentos bellwave são exatamente MON_005/006/007 e MON_027/B/C', () => {
            const bellwaveIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'bellwave')
                .map(([k]) => k)
                .sort();
            expect(bellwaveIds).toEqual([
                'MON_005', 'MON_006', 'MON_007',
                'MON_027', 'MON_027B', 'MON_027C',
            ]);
        });

        it('tabela total: 42 mapeamentos após migração Phase 1 hard-replace', () => {
            expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(42);
        });
    });

});

// ===========================================================================
// Parte 2 — Exclusão de MON_011D: mapeamento parcial justificado
// ===========================================================================

describe('Fase 13.2 — bellwave — MON_011D explicitamente excluído', () => {

    it('MON_011D (Giganotometalmon, Místico) não mapeado — SPD/ATK=0.75 após offsets', () => {
        expect(resolveCanonSpeciesId('MON_011D')).toBeNull();
    });

    it('MON_011D tem ATK=16 > SPD=11 em stats base — drift de arquétipo confirmado', () => {
        // Base stats: atk=16, def=12, spd=11, ene=12
        // Após offsets bellwave {def-1, ene+1, agi+1}: atk=16, def=11, spd=12, ene=13
        const base = { hpMax: 60, atk: 16, def: 12, spd: 11, eneMax: 12 };
        const bellwaveOffsets = { hp: 0, atk: 0, def: -1, ene: 1, agi: 1 };
        const { stats } = applyStatOffsets(base, bellwaveOffsets);
        // SPD/ATK = 12/16 = 0.75 — abaixo de 1.0: falha o critério de cadencia_ritmica
        expect(stats.spd / stats.atk).toBeLessThan(1.0);
    });

    it('MON_011C tem SPD/ATK ≥ 1.0 após offsets — critério cumprido (aceito)', () => {
        // Base: atk=11, def=9, spd=12, ene=10 → após {def-1,ene+1,agi+1}: spd=13, ene=11
        const base = { hpMax: 46, atk: 11, def: 9, spd: 12, eneMax: 10 };
        const bellwaveOffsets = { hp: 0, atk: 0, def: -1, ene: 1, agi: 1 };
        const { stats } = applyStatOffsets(base, bellwaveOffsets);
        // SPD/ATK = 13/11 ≈ 1.18 ≥ 1.0 ✓
        expect(stats.spd / stats.atk).toBeGreaterThanOrEqual(1.0);
    });

    it('fronteira de drift clara: MON_011C aceito (SPD/ATK=1.18), MON_011D excluído (SPD/ATK=0.75)', () => {
        const bellwaveOffsets = { hp: 0, atk: 0, def: -1, ene: 1, agi: 1 };

        // MON_011C: SPD 12+1=13, ATK 11 → 13/11 = 1.18
        const { stats: statsC } = applyStatOffsets({ hpMax: 46, atk: 11, def: 9, spd: 12, eneMax: 10 }, bellwaveOffsets);
        expect(statsC.spd / statsC.atk).toBeGreaterThanOrEqual(1.0);

        // MON_011D: SPD 11+1=12, ATK 16 → 12/16 = 0.75
        const { stats: statsD } = applyStatOffsets({ hpMax: 60, atk: 16, def: 12, spd: 11, eneMax: 12 }, bellwaveOffsets);
        expect(statsD.spd / statsD.atk).toBeLessThan(1.0);
    });

});

// ===========================================================================
// Parte 3 — Exclusões shadowsting confirmadas pela auditoria Fase 13.2
// ===========================================================================

describe('Fase 13.2 — shadowsting — exclusões confirmadas (sem novos mapeamentos)', () => {

    it('MON_008 (Sombrio) continua sem mapeamento — estágio único', () => {
        expect(resolveCanonSpeciesId('MON_008')).toBeNull();
    });

    it('MON_030 (Furtilhon) continua sem mapeamento — DEF_off=2, ATK/DEF=4.5 após offsets', () => {
        // Base: atk=8, def=3 → após {atk+1,def-1}: atk=9, def=2 → ATK/DEF=4.5 (extremo)
        expect(resolveCanonSpeciesId('MON_030')).toBeNull();
    });

    it('MON_030B (Velurino) continua sem mapeamento — linha com base excluída', () => {
        expect(resolveCanonSpeciesId('MON_030B')).toBeNull();
    });

    it('MON_030C (Sombrifur) continua sem mapeamento — linha com base excluída', () => {
        expect(resolveCanonSpeciesId('MON_030C')).toBeNull();
    });

    it('shadowsting: ATK/DEF de MON_030 após offsets é 4.5 — critério de exclusão confirmado', () => {
        // Base stats: atk=8, def=3 + offsets shadowsting {atk+1, def-1}
        const base = { hpMax: 24, atk: 8, def: 3, spd: 10, eneMax: 6 };
        const shadowstingOffsets = { hp: 0, atk: 1, def: -1, ene: 1, agi: 0 };
        const { stats } = applyStatOffsets(base, shadowstingOffsets);
        // ATK=9, DEF=2 → ATK/DEF=4.5 — muito acima do perfil oportunista_furtivo
        expect(stats.atk / stats.def).toBeCloseTo(4.5, 1);
        expect(stats.def).toBe(2); // DEF floor marginal
    });

    it('shadowsting continua com exatamente 3 mapeamentos (apenas MON_022 line)', () => {
        const shadowstingIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'shadowsting')
            .map(([k]) => k)
            .sort();
        expect(shadowstingIds).toEqual(['MON_022', 'MON_022B', 'MON_022C']);
    });

});

// ===========================================================================
// Parte 4 — Exclusões wildpace confirmadas pela auditoria Fase 13.2
// ===========================================================================

describe('Fase 13.2 — wildpace — exclusões confirmadas (sem novos mapeamentos)', () => {

    it('MON_008 (Giganotometalmon) continua sem mapeamento — drift bruiser excluído', () => {
        expect(resolveCanonSpeciesId('MON_008')).toBeNull();
    });

    it('MON_017 (Luvursomon) continua sem mapeamento — linha Animalista excluída', () => {
        // MON_012 foi rebased para MON_017 na migração Phase 1
        expect(resolveCanonSpeciesId('MON_017')).toBeNull();
    });

    it('MON_012B (Manoplamon) continua sem mapeamento — ATK:DEF=1.25 (drift desde S1)', () => {
        expect(resolveCanonSpeciesId('MON_012B')).toBeNull();
    });

    it('MON_012C (BestBearmon) continua sem mapeamento — ATK:DEF=1.17 (drift crescente)', () => {
        expect(resolveCanonSpeciesId('MON_012C')).toBeNull();
    });

    it('MON_012D (Ursauramon) continua sem mapeamento — ATK:DEF=1.29 (drift no pico)', () => {
        expect(resolveCanonSpeciesId('MON_012D')).toBeNull();
    });

    it('wildpace: MON_012B tem ATK:DEF=1.25 — drift desde S1 confirma exclusão da linha', () => {
        // Base stats: atk=10, def=8 → ATK:DEF=1.25 (wildpace exige ATK:DEF ≈ 1.0)
        const base = { hpMax: 41, atk: 10, def: 8, spd: 6, eneMax: 6 };
        const wildpaceOffsets = { hp: 1, atk: 0, def: 0, ene: -1, agi: 1 };
        const { stats } = applyStatOffsets(base, wildpaceOffsets);
        // ATK:DEF=1.25 mesmo após offsets (offsets não mudam ATK/DEF para wildpace)
        expect(stats.atk / stats.def).toBeCloseTo(1.25, 2);
    });

    it('wildpace continua com exatamente 3 mapeamentos (apenas MON_023 line)', () => {
        const wildpaceIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'wildpace')
            .map(([k]) => k)
            .sort();
        expect(wildpaceIds).toEqual(['MON_023', 'MON_023B', 'MON_023C']);
    });

});

// ===========================================================================
// Parte 5 — Offsets verificados para os novos templates MON_011/B/C
// ===========================================================================

describe('Fase 13.2 — bellwave offsets — linha Dinomon', () => {
    // bellwave offsets canônicos: { def-1, ene+1, agi+1 } = { hp:0, atk:0, def:-1, ene:1, agi:1 }
    const offsets = { hp: 0, atk: 0, def: -1, ene: 1, agi: 1 };

    describe('MON_005 (Dinomon) — ATK:6, DEF:5, SPD:8, ENE:6, HP:27', () => {
        const base = { hpMax: 27, atk: 6, def: 5, spd: 8, eneMax: 6 };

        it('DEF reduzida de 5 para 4 (def-1) — DEF_off=4, sem floor', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(4);
        });

        it('ENE aumentada de 6 para 7 (ene+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(7);
        });

        it('SPD aumentada de 8 para 9 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(9);
        });

        it('SPD/ATK = 9/6 = 1.50 após offsets — cadencia_ritmica preservada', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd / stats.atk).toBeCloseTo(1.50, 2);
        });

        it('ENE/ATK = 7/6 = 1.17 após offsets — ENE superior ao ATK', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax / stats.atk).toBeGreaterThan(1.0);
        });

        it('HP não é alterado (hp offset = 0)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.hpMax).toBe(27);
        });

        it('ATK não é alterado (atk offset = 0)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(6);
        });
    });

    describe('MON_006 (Guitarapitormon) — ATK:8, DEF:6, SPD:10, ENE:8, HP:35', () => {
        const base = { hpMax: 35, atk: 8, def: 6, spd: 10, eneMax: 8 };

        it('DEF reduzida de 6 para 5 (def-1) — DEF_off=5', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(5);
        });

        it('ENE aumentada de 8 para 9 (ene+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(9);
        });

        it('SPD aumentada de 10 para 11 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(11);
        });

        it('SPD/ATK = 11/8 = 1.375 após offsets — cadencia_ritmica preservada', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd / stats.atk).toBeGreaterThanOrEqual(1.0);
        });

        it('ENE/ATK = 9/8 = 1.125 após offsets — ENE ainda supera ATK', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax / stats.atk).toBeGreaterThanOrEqual(1.0);
        });
    });

    describe('MON_007 (TRockmon) — ATK:11, DEF:9, SPD:12, ENE:10, HP:46', () => {
        const base = { hpMax: 46, atk: 11, def: 9, spd: 12, eneMax: 10 };

        it('DEF reduzida de 9 para 8 (def-1) — DEF_off=8 (robusto)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(8);
        });

        it('ENE aumentada de 10 para 11 (ene+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(11);
        });

        it('SPD aumentada de 12 para 13 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(13);
        });

        it('SPD/ATK = 13/11 ≈ 1.18 após offsets — borderline acima de 1.0 (aceito)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd / stats.atk).toBeGreaterThanOrEqual(1.0);
        });

        it('ENE/ATK = 11/11 = 1.00 após offsets — limiar mínimo cumprido', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax / stats.atk).toBeGreaterThanOrEqual(1.0);
        });
    });

});

// ===========================================================================
// Parte 6 — Passiva e kit swap funcionam nos novos mapeamentos
// ===========================================================================

describe('Fase 13.2 — bellwave passiva e kit swap — novos templates', () => {

    it('bellwave passiva: instância com canonSpeciesId=bellwave responde a on_attack', () => {
        const instance = { canonSpeciesId: 'bellwave' };
        // Sem carga: null
        const noMod = resolvePassiveModifier(instance, {
            event: 'on_attack',
            isOffensiveSkill: false,
            hasBellwaveRhythmCharge: false,
        });
        expect(noMod).toBeNull();

        // Com carga: atkBonus:1
        const withMod = resolvePassiveModifier(instance, {
            event: 'on_attack',
            isOffensiveSkill: false,
            hasBellwaveRhythmCharge: true,
        });
        expect(withMod).not.toBeNull();
        expect(withMod.atkBonus).toBe(1);
    });

    it('bellwave kit swap: instância MON_011 (bellwave, slot 4 desbloqueado) recebe Nota Discordante I', () => {
        const instance = {
            templateId: 'MON_005',
            canonSpeciesId: 'bellwave',
            level: 30,
            unlockedSkillSlots: 4, // slot 4 necessário para bellwave
        };
        const baseSkills = [
            { id: 'NOTA_CRISTALIZADA', name: 'Nota Cristalizada', type: 'DAMAGE', cost: 3, power: 10 },
        ];
        const { appliedKitSwaps } = applyKitSwaps(instance, baseSkills);
        expect(appliedKitSwaps).toHaveLength(1);
        expect(appliedKitSwaps[0].replacementId).toBe('bellwave_discordant_note');
    });

    it('bellwave kit swap: instância MON_011B (bellwave, slots insuficientes) não recebe kit swap', () => {
        const instance = {
            templateId: 'MON_006',
            canonSpeciesId: 'bellwave',
            level: 20,
            unlockedSkillSlots: 3, // menos que 4 → slot bloqueado
        };
        const { appliedKitSwaps } = applyKitSwaps(instance, []);
        expect(appliedKitSwaps).toHaveLength(0);
    });

    it('hasKitSwap retorna true para speciesId bellwave', () => {
        expect(hasKitSwap('bellwave')).toBe(true);
    });

});

// ===========================================================================
// Parte 7 — Regressão: mapeamentos anteriores intactos
// ===========================================================================

describe('Fase 13.2 — regressão — mapeamentos anteriores não afetados', () => {

    describe('Linha MON_027 (bellwave Fase 11) permanece intacta', () => {
        it('MON_027 → bellwave', () => { expect(resolveCanonSpeciesId('MON_027')).toBe('bellwave'); });
        it('MON_027B → bellwave', () => { expect(resolveCanonSpeciesId('MON_027B')).toBe('bellwave'); });
        it('MON_027C → bellwave', () => { expect(resolveCanonSpeciesId('MON_027C')).toBe('bellwave'); });
    });

    describe('Linha MON_022 (shadowsting Fase 10) permanece intacta', () => {
        it('MON_022 → shadowsting', () => { expect(resolveCanonSpeciesId('MON_022')).toBe('shadowsting'); });
        it('MON_022B → shadowsting', () => { expect(resolveCanonSpeciesId('MON_022B')).toBe('shadowsting'); });
        it('MON_022C → shadowsting', () => { expect(resolveCanonSpeciesId('MON_022C')).toBe('shadowsting'); });
    });

    describe('Linha MON_023 (wildpace Fase 12) permanece intacta', () => {
        it('MON_023 → wildpace', () => { expect(resolveCanonSpeciesId('MON_023')).toBe('wildpace'); });
        it('MON_023B → wildpace', () => { expect(resolveCanonSpeciesId('MON_023B')).toBe('wildpace'); });
        it('MON_023C → wildpace', () => { expect(resolveCanonSpeciesId('MON_023C')).toBe('wildpace'); });
    });

    describe('Espécies MVP (shieldhorn, emberfang, moonquill, floracura, swiftclaw) intactas', () => {
        it('MON_001 → shieldhorn', () => { expect(resolveCanonSpeciesId('MON_001')).toBe('shieldhorn'); });
        it('MON_021 → emberfang', () => { expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang'); });
        it('MON_013 → moonquill', () => { expect(resolveCanonSpeciesId('MON_013')).toBe('moonquill'); });
        it('MON_028 → floracura', () => { expect(resolveCanonSpeciesId('MON_028')).toBe('floracura'); });
        it('MON_009 → swiftclaw', () => { expect(resolveCanonSpeciesId('MON_009')).toBe('swiftclaw'); });
    });

    describe('Templates sem mapeamento continuam com null', () => {
        it('MON_008 (Giganotometalmon) → null', () => { expect(resolveCanonSpeciesId('MON_008')).toBeNull(); });
        it('MON_017 (Luvursomon) → null', () => { expect(resolveCanonSpeciesId('MON_017')).toBeNull(); });
        it('MON_008 (Sombrio) → null', () => { expect(resolveCanonSpeciesId('MON_008')).toBeNull(); });
        it('MON_011D (Giganotometalmon) → null (drift, parcialmente excluído)', () => {
            expect(resolveCanonSpeciesId('MON_011D')).toBeNull();
        });
        it('MON_008 (Giganotometalmon) → null', () => { expect(resolveCanonSpeciesId('MON_008')).toBeNull(); });
        it('null input → null', () => { expect(resolveCanonSpeciesId(null)).toBeNull(); });
        it('undefined input → null', () => { expect(resolveCanonSpeciesId(undefined)).toBeNull(); });
    });

    describe('Cobertura total do bridge pós-Fase 13.2', () => {
        it('42 mapeamentos totais após migração Phase 1 hard-replace', () => {
            expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(42);
        });

        it('8 espécies canônicas ativas no bridge', () => {
            const uniqueSpecies = new Set(Object.values(RUNTIME_TO_CANON_SPECIES));
            expect(uniqueSpecies.size).toBe(8);
        });

        it('todas as 8 espécies canônicas presentes', () => {
            const species = new Set(Object.values(RUNTIME_TO_CANON_SPECIES));
            ['shieldhorn', 'emberfang', 'moonquill', 'floracura', 'swiftclaw',
             'shadowsting', 'bellwave', 'wildpace'].forEach(s => {
                expect(species.has(s)).toBe(true);
            });
        });
    });

});
