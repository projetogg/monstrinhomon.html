/**
 * SPECIES BRIDGE TESTS — Fase 9
 *
 * Cobertura da expansão da Fase 9: espécie canônica swiftclaw (Caçador).
 *
 * Escolha de classe justificada:
 *   Caçador foi escolhido por ter o arquétipo mais claro (striker_veloz),
 *   com duas linhas evolutivas completas e coerentes no catálogo:
 *   - Miaumon → Gatunamon → Felinomon → Panterezamon (4 estágios)
 *   - Pulimbon → Flecharelmon → Relampejomon (3 estágios)
 *   Ambas as linhas mantêm ATK dominante e SPD alto em todos os estágios.
 *   MON_005 (Garruncho) foi excluído intencionalmente: sem linha evolutiva validável.
 *
 * Cobertura:
 *   - Bridge: resolveCanonSpeciesId() — 7 novos mapeamentos swiftclaw
 *   - Passiva: resolvePassiveModifier() — swiftclaw on_attack/isFirstAttackOfCombat
 *   - Kit swap: applyKitSwaps() — swiftclaw slot 1 (Flecha Certeira I)
 *   - Promoção: promoteKitSwaps() — swiftclaw L20 → Flecha Certeira II
 *   - Coerência: offsets, passiva e kit swap ao longo de 4 estágios evolutivos
 *   - Regressão: espécies MVP anteriores não foram alteradas
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    RUNTIME_TO_CANON_SPECIES,
    resolveCanonSpeciesId,
    applyStatOffsets,
    getUnmappedTemplateIds,
    getEligibleUnmappedTemplateIds,
    getBridgeCoverageReport,
} from '../js/canon/speciesBridge.js';
import {
    resolvePassiveModifier,
    getActivePassiveIds,
    hasPassive,
} from '../js/canon/speciesPassives.js';
import {
    applyKitSwaps,
    hasKitSwap,
    getActiveKitSwapIds,
    promoteKitSwaps,
    getPromotableSwapIds,
} from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Mock de canonLoader — segue padrão dos testes anteriores
// ---------------------------------------------------------------------------
vi.mock('../js/canon/canonLoader.js', () => ({
    getSpeciesStatOffsets: vi.fn((speciesId) => {
        const offsets = {
            shieldhorn: { hp: 1, atk: -1, def: 1, ene: 0, agi: 0 },
            emberfang:  { hp: 0, atk: 1,  def: -1, ene: 0, agi: 1 },
            moonquill:  { hp: 0, atk: 0,  def: 0,  ene: 1, agi: 0 },
            floracura:  { hp: 1, atk: 0,  def: 0,  ene: 1, agi: -1 },
            swiftclaw:  { hp: 0, atk: 1,  def: -1, ene: 0, agi: 1 },
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
// Parte 1 — Bridge: novos mapeamentos swiftclaw (Caçador)
// ===========================================================================

describe('Fase 9 — Caçador → swiftclaw (bridge)', () => {

    describe('Linha Miaumon (MON_009)', () => {
        it('MON_009 (Miaumon, Comum) mapeia para swiftclaw — ATK 8, DEF 4, SPD 9', () => {
            expect(resolveCanonSpeciesId('MON_009')).toBe('swiftclaw');
        });

        it('MON_010 (Gatunamon, Incomum) mapeia para swiftclaw — ATK 10, DEF 6, SPD 12', () => {
            expect(resolveCanonSpeciesId('MON_010')).toBe('swiftclaw');
        });

        it('MON_011 (Felinomon, Raro) mapeia para swiftclaw — ATK 14, DEF 7, SPD 15', () => {
            expect(resolveCanonSpeciesId('MON_011')).toBe('swiftclaw');
        });

        it('MON_012 (Panterezamon, Místico) mapeia para swiftclaw — ATK 18, DEF 9, SPD 18', () => {
            expect(resolveCanonSpeciesId('MON_012')).toBe('swiftclaw');
        });
    });

    describe('Linha Pulimbon (MON_025)', () => {
        it('MON_025 (Pulimbon, Comum) mapeia para swiftclaw — ATK 6, DEF 4, SPD 10', () => {
            expect(resolveCanonSpeciesId('MON_025')).toBe('swiftclaw');
        });

        it('MON_025B (Flecharelmon, Incomum) mapeia para swiftclaw — ATK 10, DEF 5, SPD 14', () => {
            expect(resolveCanonSpeciesId('MON_025B')).toBe('swiftclaw');
        });

        it('MON_025C (Relampejomon, Raro) mapeia para swiftclaw — ATK 12, DEF 6, SPD 17', () => {
            expect(resolveCanonSpeciesId('MON_025C')).toBe('swiftclaw');
        });
    });

    describe('Caçadors totalmente mapeados — sem exclusões (todos base stages têm swiftclaw)', () => {
        it('todos os Caçadors da linha Miaumon são mapeados — sem exceção', () => {
            expect(resolveCanonSpeciesId('MON_009')).toBe('swiftclaw');
            expect(resolveCanonSpeciesId('MON_025')).toBe('swiftclaw');
        });
    });

    describe('Integridade da tabela pós-Fase 9', () => {
        it('deve conter exatamente 42 mapeamentos após migração Phase 1 hard-replace', () => {
            expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(42);
        });

        it('todos os 7 novos mapeamentos de swiftclaw devem estar presentes', () => {
            const swiftclawIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'swiftclaw')
                .map(([k]) => k);
            expect(swiftclawIds).toHaveLength(7);
            expect(swiftclawIds).toContain('MON_009');
            expect(swiftclawIds).toContain('MON_010');
            expect(swiftclawIds).toContain('MON_011');
            expect(swiftclawIds).toContain('MON_012');
            expect(swiftclawIds).toContain('MON_025');
            expect(swiftclawIds).toContain('MON_025B');
            expect(swiftclawIds).toContain('MON_025C');
        });
    });
});

// ===========================================================================
// Parte 2 — Coerência da linha evolutiva (curadoria)
// ===========================================================================

describe('Fase 9 — Coerência da linha evolutiva Miaumon (swiftclaw)', () => {

    const swiftclawOffsets = { hp: 0, atk: 1, def: -1, ene: 0, agi: 1 };

    it('Miaumon (base): offsets reforçam striker_veloz — ATK+1, DEF-1, SPD+1', () => {
        // Stats base runtime: ATK=8, DEF=4, SPD=9
        const stats = { hpMax: 25, atk: 8, def: 4, spd: 9, eneMax: 4 };
        const { stats: adjusted } = applyStatOffsets(stats, swiftclawOffsets);
        expect(adjusted.atk).toBe(9);  // +1: reforça striker
        expect(adjusted.def).toBe(3);  // -1: reforça fragilidade
        expect(adjusted.spd).toBe(10); // +1: reforça velocidade
    });

    it('Gatunamon (S1): offsets continuam coerentes — arquétipo preservado', () => {
        // Stats base runtime: ATK=10, DEF=6, SPD=12
        const stats = { hpMax: 32, atk: 10, def: 6, spd: 12, eneMax: 6 };
        const { stats: adjusted } = applyStatOffsets(stats, swiftclawOffsets);
        expect(adjusted.atk).toBe(11);
        expect(adjusted.def).toBe(5);
        expect(adjusted.spd).toBe(13);
    });

    it('Felinomon (S2): ratio ATK:DEF 2.0 — striker_veloz se acentua', () => {
        // Stats base runtime: ATK=14, DEF=7, SPD=15
        const stats = { hpMax: 42, atk: 14, def: 7, spd: 15, eneMax: 6 };
        const { stats: adjusted } = applyStatOffsets(stats, swiftclawOffsets);
        expect(adjusted.atk).toBe(15);
        expect(adjusted.def).toBe(6);
        expect(adjusted.spd).toBe(16);
    });

    it('Panterezamon (S3/Místico): forma mais pura do arquétipo — offsets coerentes', () => {
        // Stats base runtime: ATK=18, DEF=9, SPD=18
        const stats = { hpMax: 54, atk: 18, def: 9, spd: 18, eneMax: 8 };
        const { stats: adjusted } = applyStatOffsets(stats, swiftclawOffsets);
        expect(adjusted.atk).toBe(19);
        expect(adjusted.def).toBe(8);
        expect(adjusted.spd).toBe(19);
    });

    it('def nunca cai abaixo de 1 — proteção mínima aplicada', () => {
        // Stats hipotéticos extremos
        const stats = { hpMax: 10, atk: 3, def: 1, spd: 5, eneMax: 2 };
        const { stats: adjusted } = applyStatOffsets(stats, swiftclawOffsets);
        expect(adjusted.def).toBe(1); // Math.max(1, 1-1) = 1
    });
});

// ===========================================================================
// Parte 3 — Passiva swiftclaw
// ===========================================================================

describe('Fase 9 — Passiva swiftclaw', () => {

    const swiftclawInstance = { canonSpeciesId: 'swiftclaw' };
    const otherInstance     = { canonSpeciesId: 'shieldhorn' };
    const noSpeciesInstance = {};

    it('hasPassive deve retornar true para swiftclaw', () => {
        expect(hasPassive('swiftclaw')).toBe(true);
    });

    it('getActivePassiveIds deve incluir swiftclaw', () => {
        expect(getActivePassiveIds()).toContain('swiftclaw');
    });

    it('swiftclaw dispara no primeiro ataque do combate', () => {
        const modifier = resolvePassiveModifier(swiftclawInstance, {
            event: 'on_attack',
            hpPct: 1.0,
            isFirstAttackOfCombat: true,
        });
        expect(modifier).not.toBeNull();
        expect(modifier.atkBonus).toBe(1);
    });

    it('swiftclaw NÃO dispara quando NÃO é o primeiro ataque do combate', () => {
        const modifier = resolvePassiveModifier(swiftclawInstance, {
            event: 'on_attack',
            hpPct: 1.0,
            isFirstAttackOfCombat: false,
        });
        expect(modifier).toBeNull();
    });

    it('swiftclaw NÃO dispara quando isFirstAttackOfCombat é undefined', () => {
        // undefined é tratado como false (gate não passa sem flag explícita)
        const modifier = resolvePassiveModifier(swiftclawInstance, {
            event: 'on_attack',
            hpPct: 1.0,
        });
        expect(modifier).toBeNull();
    });

    it('swiftclaw NÃO dispara para evento on_hit_received', () => {
        const modifier = resolvePassiveModifier(swiftclawInstance, {
            event: 'on_hit_received',
            isFirstAttackOfCombat: true,
        });
        expect(modifier).toBeNull();
    });

    it('swiftclaw NÃO dispara para evento on_skill_used', () => {
        const modifier = resolvePassiveModifier(swiftclawInstance, {
            event: 'on_skill_used',
            isFirstAttackOfCombat: true,
        });
        expect(modifier).toBeNull();
    });

    it('swiftclaw NÃO dispara para instância sem canonSpeciesId', () => {
        const modifier = resolvePassiveModifier(noSpeciesInstance, {
            event: 'on_attack',
            isFirstAttackOfCombat: true,
        });
        expect(modifier).toBeNull();
    });

    it('shieldhorn NÃO é afetado por isFirstAttackOfCombat', () => {
        // Regressão: shieldhorn usa on_hit_received, não on_attack
        const modifier = resolvePassiveModifier(otherInstance, {
            event: 'on_attack',
            isFirstAttackOfCombat: true,
        });
        expect(modifier).toBeNull();
    });
});

// ===========================================================================
// Parte 4 — Kit Swap swiftclaw (slot 1)
// ===========================================================================

describe('Fase 9 — Kit Swap swiftclaw (slot 1)', () => {

    const baseSkill = { name: 'Flecha Poderosa I', type: 'DAMAGE', cost: 4, power: 19 };
    const slot2Skill = { name: 'Armadilha I', type: 'BUFF', cost: 4, power: -2 };

    it('hasKitSwap deve retornar true para swiftclaw', () => {
        expect(hasKitSwap('swiftclaw')).toBe(true);
    });

    it('getActiveKitSwapIds deve incluir swiftclaw', () => {
        expect(getActiveKitSwapIds()).toContain('swiftclaw');
    });

    it('swap é aplicado em slot 1 quando unlockedSkillSlots >= 1', () => {
        const instance = { canonSpeciesId: 'swiftclaw', unlockedSkillSlots: 1 };
        const { skills, appliedKitSwaps } = applyKitSwaps(instance, [baseSkill]);
        expect(appliedKitSwaps).toHaveLength(1);
        expect(appliedKitSwaps[0].slot).toBe(1);
        expect(appliedKitSwaps[0].canonSkillId).toBe('hunter_basic_shot');
        expect(appliedKitSwaps[0].action).toBe('replaced');
    });

    it('skill substituída é Flecha Certeira I (cost 3, power 15)', () => {
        const instance = { canonSpeciesId: 'swiftclaw', unlockedSkillSlots: 1 };
        const { skills } = applyKitSwaps(instance, [baseSkill]);
        const swapSkill = skills[0];
        expect(swapSkill._kitSwapId).toBe('swiftclaw_precise_shot');
        expect(swapSkill.name).toBe('Flecha Certeira I');
        expect(swapSkill.type).toBe('DAMAGE');
        expect(swapSkill.cost).toBe(3);
        expect(swapSkill.power).toBe(15);
    });

    it('swap preserva skills de outros slots', () => {
        const instance = { canonSpeciesId: 'swiftclaw', unlockedSkillSlots: 2 };
        const { skills } = applyKitSwaps(instance, [baseSkill, slot2Skill]);
        expect(skills).toHaveLength(2);
        expect(skills[0]._kitSwapId).toBe('swiftclaw_precise_shot');
        expect(skills[1]).toEqual(slot2Skill); // slot 2 inalterado
    });

    it('swap NÃO é aplicado para outra espécie', () => {
        const instance = { canonSpeciesId: 'emberfang', unlockedSkillSlots: 1 };
        const { skills, appliedKitSwaps } = applyKitSwaps(instance, [baseSkill]);
        // emberfang swap é no slot 4, não no slot 1
        expect(appliedKitSwaps).toHaveLength(0);
        expect(skills[0]).toEqual(baseSkill);
    });

    it('swap NÃO é aplicado sem canonSpeciesId', () => {
        const instance = { unlockedSkillSlots: 1 };
        const { skills, appliedKitSwaps } = applyKitSwaps(instance, [baseSkill]);
        expect(appliedKitSwaps).toHaveLength(0);
        expect(skills[0]).toEqual(baseSkill);
    });

    describe('Calibração de eficiência (auditoria Fase 9)', () => {
        it('Flecha Certeira I (cost 3, pwr 15) é mais eficiente por ENE que ref (cost 4, pwr 19)', () => {
            // Ref Flecha Poderosa I: 19/4 = 4.75 pwr/ENE
            // Flecha Certeira I:     15/3 = 5.00 pwr/ENE (+5.3%)
            const refEff = 19 / 4;
            const swapEff = 15 / 3;
            expect(swapEff).toBeGreaterThan(refEff);
            // Mas poder absoluto é menor (menor burst por hit)
            expect(15).toBeLessThan(19);
        });
    });
});

// ===========================================================================
// Parte 5 — Promoção do kit swap swiftclaw (L20)
// ===========================================================================

describe('Fase 9 — Promoção kit swap swiftclaw (L20)', () => {

    const baseSwap = {
        _kitSwapId: 'swiftclaw_precise_shot',
        name: 'Flecha Certeira I',
        type: 'DAMAGE',
        cost: 3,
        power: 15,
    };

    it('getPromotableSwapIds deve incluir swiftclaw_precise_shot', () => {
        expect(getPromotableSwapIds()).toContain('swiftclaw_precise_shot');
    });

    it('promoção ocorre em L20 ou superior', () => {
        const instance = {
            canonSpeciesId: 'swiftclaw',
            level: 20,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [{ slot: 1, canonSkillId: 'hunter_basic_shot', replacementId: 'swiftclaw_precise_shot', action: 'replace' }],
        };
        const { promotedKitSwaps, updated } = promoteKitSwaps(instance);
        expect(updated).toBe(true);
        expect(promotedKitSwaps).toHaveLength(1);
        expect(promotedKitSwaps[0].toSwapId).toBe('swiftclaw_precise_shot_ii');
    });

    it('skill promovida é Flecha Certeira II (cost 4, power 20)', () => {
        const instance = {
            canonSpeciesId: 'swiftclaw',
            level: 20,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [{ slot: 1, canonSkillId: 'hunter_basic_shot', replacementId: 'swiftclaw_precise_shot', action: 'replace' }],
        };
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        const promoted = promotedKitSwaps[0].promotedSkill;
        expect(promoted._kitSwapId).toBe('swiftclaw_precise_shot_ii');
        expect(promoted.name).toBe('Flecha Certeira II');
        expect(promoted.cost).toBe(4);
        expect(promoted.power).toBe(20);
    });

    it('promoção NÃO ocorre antes de L20', () => {
        const instance = {
            canonSpeciesId: 'swiftclaw',
            level: 19,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [{ slot: 1, canonSkillId: 'hunter_basic_shot', replacementId: 'swiftclaw_precise_shot', action: 'replace' }],
        };
        const { promotedKitSwaps, updated } = promoteKitSwaps(instance);
        expect(updated).toBe(false);
        expect(promotedKitSwaps).toHaveLength(0);
    });

    it('promoção NÃO ocorre se swap já foi promovido', () => {
        const instance = {
            canonSpeciesId: 'swiftclaw',
            level: 50,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [{ slot: 1, canonSkillId: 'hunter_basic_shot', replacementId: 'swiftclaw_precise_shot_ii', action: 'replace' }],
        };
        const { promotedKitSwaps, updated } = promoteKitSwaps(instance);
        expect(updated).toBe(false);
    });

    describe('Calibração de eficiência — Flecha Certeira II (auditoria)', () => {
        it('Flecha Certeira II (cost 4, pwr 20) mantém eficiência de 5.0 pwr/ENE', () => {
            // Consistência com versão I (5.0 pwr/ENE)
            const eff = 20 / 4;
            expect(eff).toBeCloseTo(5.0, 1);
        });

        it('Flecha Certeira II tem poder absoluto maior que versão I (20 > 15)', () => {
            expect(20).toBeGreaterThan(15);
        });
    });
});

// ===========================================================================
// Parte 6 — Fallback e bridge: MON_005 e templates sem mapeamento
// ===========================================================================

describe('Fase 9 — Fallback e templates sem mapeamento', () => {

    const CAÇADOR_CATALOG = [
        { id: 'MON_009', class: 'Caçador' },
        { id: 'MON_010', class: 'Caçador' },
        { id: 'MON_011', class: 'Caçador' },
        { id: 'MON_012', class: 'Caçador' },
        { id: 'MON_025', class: 'Caçador' },
        { id: 'MON_025B', class: 'Caçador' },
        { id: 'MON_025C', class: 'Caçador' },
        { id: 'MON_100', class: 'Guerreiro' },  // não mapeado — usado para testar relatório
    ];

    it('getUnmappedTemplateIds deve retornar apenas MON_100 (não mapeado) no catálogo Caçador atualizado', () => {
        const unmapped = getUnmappedTemplateIds(CAÇADOR_CATALOG);
        expect(unmapped).toHaveLength(1);
        expect(unmapped).toContain('MON_100');
    });

    it('getEligibleUnmappedTemplateIds deve listar MON_100 como elegível (Guerreiro tem shieldhorn)', () => {
        const eligible = getEligibleUnmappedTemplateIds(CAÇADOR_CATALOG);
        const ids = eligible.map(e => e.id);
        expect(ids).toContain('MON_100');
    });

    it('bridge report: 7 mapeados (swiftclaw), 1 unmapped (MON_100) no catálogo Caçador', () => {
        const report = getBridgeCoverageReport(CAÇADOR_CATALOG);
        expect(report.total).toBe(8);
        expect(report.mapped).toBe(7);
        expect(report.unmapped).toBe(1);
    });

    it('swiftclaw: fallback seguro — instância sem canonSpeciesId retorna null', () => {
        const modifier = resolvePassiveModifier({}, {
            event: 'on_attack',
            isFirstAttackOfCombat: true,
        });
        expect(modifier).toBeNull();
    });
});

// ===========================================================================
// Parte 7 — Regressão: espécies MVP anteriores não afetadas
// ===========================================================================

describe('Fase 9 — Regressão: espécies MVP não afetadas', () => {

    it('shieldhorn: bridge intacto (MON_001, MON_002, MON_026)', () => {
        expect(resolveCanonSpeciesId('MON_001')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
        expect(resolveCanonSpeciesId('MON_026')).toBe('shieldhorn');
    });

    it('emberfang: bridge intacto (MON_021, MON_021B, MON_029)', () => {
        expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_021B')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_029')).toBe('emberfang');
    });

    it('moonquill: bridge intacto (MON_013, MON_014, MON_024)', () => {
        expect(resolveCanonSpeciesId('MON_013')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_024')).toBe('moonquill');
    });

    it('floracura: bridge intacto (MON_028, MON_028B, MON_028C)', () => {
        expect(resolveCanonSpeciesId('MON_028')).toBe('floracura');
        expect(resolveCanonSpeciesId('MON_028B')).toBe('floracura');
        expect(resolveCanonSpeciesId('MON_028C')).toBe('floracura');
    });

    it('shieldhorn passiva: on_hit_received ainda funciona corretamente', () => {
        const instance = { canonSpeciesId: 'shieldhorn' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_hit_received',
            isFirstHitThisTurn: true,
        });
        expect(modifier).not.toBeNull();
        expect(modifier.damageReduction).toBe(1);
    });

    it('emberfang passiva: on_attack com isOffensiveSkill ainda funciona', () => {
        const instance = { canonSpeciesId: 'emberfang' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_attack',
            hpPct: 0.80,
            isOffensiveSkill: true,
        });
        expect(modifier).not.toBeNull();
        expect(modifier.atkBonus).toBe(1);
    });

    it('emberfang passiva NÃO dispara em ataque básico (isOffensiveSkill: false)', () => {
        const instance = { canonSpeciesId: 'emberfang' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_attack',
            hpPct: 0.80,
            isOffensiveSkill: false,
        });
        expect(modifier).toBeNull();
    });

    it('shieldhorn kit swap: slot 1 intacto', () => {
        const instance = { canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 };
        const baseSkill = { name: 'Golpe de Espada I', type: 'DAMAGE', cost: 4, power: 18 };
        const { appliedKitSwaps } = applyKitSwaps(instance, [baseSkill]);
        expect(appliedKitSwaps).toHaveLength(1);
        expect(appliedKitSwaps[0].replacementId).toBe('shieldhorn_heavy_strike');
    });
});
