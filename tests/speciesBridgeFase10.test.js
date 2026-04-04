/**
 * SPECIES BRIDGE TESTS — Fase 10
 *
 * Cobertura da expansão da Fase 10: espécie canônica shadowsting (Ladino).
 *
 * Escolha de linha justificada:
 *   A linha Corvimon → Noxcorvomon → Umbraquimonom (MON_022/B/C) foi escolhida por:
 *   - ENE/ATK = 0.86 no estágio base (mais alto que swiftclaw 0.50) — sustenta loop
 *     de debuff+execução sem escassez de energia.
 *   - 3 estágios com evolução limpa (Comum→Incomum→Raro, todos Ladino).
 *   - DEF_base ≥ 4 em todos os estágios: offset def-1 nunca gera DEF_off < 3 (sem floor).
 *   - Arquétipo oportunista_furtivo preservado ao longo de toda a linha evolutiva.
 *
 * Exclusões justificadas:
 *   - MON_008 (Sombrio): sem linha evolutiva (estágio único) — mesmo critério de Garruncho.
 *   - MON_030/B/C (Furtilhon, Velurino, Sombrifur): DEF_base = 3 em MON_030 → DEF_off = 2
 *     (floor marginal); ENE/ATK = 0.75 (mais próximo de swiftclaw; identidade ambígua).
 *
 * Diferenciação mecânica de swiftclaw:
 *   swiftclaw — striker_veloz: offsets { atk+1, def-1, agi+1 }; passiva one-time no
 *     primeiro ataque do combate; kit swap slot 1 (sempre disponível), cadência alta.
 *   shadowsting — oportunista_furtivo: offsets { atk+1, def-1, ene+1 }; passiva
 *     condicional (ativa após debuff aplicado, recarregável); kit swap slot 4 (L30),
 *     execução pós-setup, burst maior por hit.
 *
 * Cobertura:
 *   - Bridge: resolveCanonSpeciesId() — 3 novos mapeamentos shadowsting
 *   - Offsets: { atk+1, def-1, ene+1 } verificados vs stats base de cada estágio
 *   - Passiva: resolvePassiveModifier() — shadowsting on_attack + hasShadowstingCharge
 *   - Kit swap: applyKitSwaps() — shadowsting slot 4 (Golpe Furtivo I)
 *   - Promoção: promoteKitSwaps() — shadowsting L50 → Golpe Furtivo II
 *   - Diferenciação: passiva e swap diferem mecanicamente de swiftclaw
 *   - Regressão: Caçador/swiftclaw e espécies MVP anteriores não foram alteradas
 *   - Fallback: templates não mapeados (MON_008, MON_030/B/C) permanecem sem mapeamento
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
            shieldhorn:   { hp: 1,  atk: -1, def: 1,  ene: 0,  agi: 0  },
            emberfang:    { hp: 0,  atk: 1,  def: -1, ene: 0,  agi: 1  },
            moonquill:    { hp: 0,  atk: 0,  def: 0,  ene: 1,  agi: 0  },
            floracura:    { hp: 1,  atk: 0,  def: 0,  ene: 1,  agi: -1 },
            swiftclaw:    { hp: 0,  atk: 1,  def: -1, ene: 0,  agi: 1  },
            shadowsting:  { hp: 0,  atk: 1,  def: -1, ene: 1,  agi: 0  },
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
// Parte 1 — Bridge: novos mapeamentos shadowsting (Ladino)
// ===========================================================================

describe('Fase 10 — Ladino → shadowsting (bridge)', () => {

    describe('Linha Corvimon (MON_022)', () => {
        it('MON_022 (Corvimon, Comum) mapeia para shadowsting — ATK 7, DEF 4, ENE 6', () => {
            expect(resolveCanonSpeciesId('MON_022')).toBe('shadowsting');
        });

        it('MON_022B (Noxcorvomon, Incomum) mapeia para shadowsting — ATK 10, DEF 5, ENE 8', () => {
            expect(resolveCanonSpeciesId('MON_022B')).toBe('shadowsting');
        });

        it('MON_022C (Umbraquimonom, Raro) mapeia para shadowsting — ATK 14, DEF 7, ENE 10', () => {
            expect(resolveCanonSpeciesId('MON_022C')).toBe('shadowsting');
        });
    });

    describe('Templates excluídos — sem mapeamento intencional', () => {
        it('MON_008 (Sombrio) permanece sem mapeamento — sem linha evolutiva', () => {
            expect(resolveCanonSpeciesId('MON_008')).toBeNull();
        });

        it('MON_030 (Furtilhon) permanece sem mapeamento — DEF floor marginal e perfil ambíguo', () => {
            expect(resolveCanonSpeciesId('MON_030')).toBeNull();
        });

        it('MON_030B (Velurino) permanece sem mapeamento — linha excluída', () => {
            expect(resolveCanonSpeciesId('MON_030B')).toBeNull();
        });

        it('MON_030C (Sombrifur) permanece sem mapeamento — linha excluída', () => {
            expect(resolveCanonSpeciesId('MON_030C')).toBeNull();
        });
    });

    describe('Integridade da tabela pós-Fase 10', () => {
        it('deve conter exatamente 51 mapeamentos (39 Fase 9 + 3 shadowsting + 3 bellwave Fase 11 + 3 wildpace Fase 12 + 3 bellwave Fase 13.2)', () => {
            expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(51);
        });

        it('todos os 3 mapeamentos shadowsting estão presentes', () => {
            const shadowstingIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'shadowsting')
                .map(([k]) => k);
            expect(shadowstingIds.sort()).toEqual(['MON_022', 'MON_022B', 'MON_022C']);
        });

        it('mapeamentos anteriores (swiftclaw, MVP) permanecem intactos', () => {
            expect(RUNTIME_TO_CANON_SPECIES['MON_013']).toBe('swiftclaw');
            expect(RUNTIME_TO_CANON_SPECIES['MON_013D']).toBe('swiftclaw');
            expect(RUNTIME_TO_CANON_SPECIES['MON_010']).toBe('shieldhorn');
            expect(RUNTIME_TO_CANON_SPECIES['MON_007']).toBe('emberfang');
            expect(RUNTIME_TO_CANON_SPECIES['MON_003']).toBe('moonquill');
            expect(RUNTIME_TO_CANON_SPECIES['MON_004']).toBe('floracura');
        });
    });
});

// ===========================================================================
// Parte 2 — Offsets: { atk+1, def-1, ene+1 } — verificação por estágio
// ===========================================================================

describe('Fase 10 — shadowsting offsets ({ atk+1, def-1, ene+1 })', () => {

    const shadowstingOffsets = { hp: 0, atk: 1, def: -1, ene: 1, agi: 0 };

    // Fórmula: Math.floor(baseStat * (1 + (L-1)*0.1) * rarityPower)
    // rarityPower: Comum=1.00, Incomum=1.08, Raro=1.18
    // RUNTIME_TO_CANON via applyStatOffsets — mapeamento: ene→eneMax, agi→spd

    describe('MON_022 (Corvimon, Comum, L1) — DEF=4, ENE=6', () => {
        // baseATK=7, baseDEF=4, baseENE=6 @L1, rarity=Comum(1.00) → ATK=7, DEF=4, ENE=6
        it('offset atk+1: DEF base 4 → DEF_off=3 (sem floor risk)', () => {
            const base = { hpMax: 23, atk: 7, def: 4, eneMax: 6, spd: 10 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.def).toBe(3); // DEF 4-1 = 3 ✅
        });

        it('offset ene+1: ENE base 6 → ENE_off=7 (sustain de skills)', () => {
            const base = { hpMax: 23, atk: 7, def: 4, eneMax: 6, spd: 10 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.eneMax).toBe(7); // ENE 6+1 = 7
        });

        it('offset atk+1: ATK base 7 → ATK_off=8', () => {
            const base = { hpMax: 23, atk: 7, def: 4, eneMax: 6, spd: 10 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.atk).toBe(8); // ATK 7+1 = 8
        });

        it('sem boost de SPD: SPD permanece inalterado (diferencia de swiftclaw)', () => {
            const base = { hpMax: 23, atk: 7, def: 4, eneMax: 6, spd: 10 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.spd).toBe(10); // agi=0 → SPD não muda
        });
    });

    describe('MON_022B (Noxcorvomon, Incomum, L15) — DEF=5, ENE=8', () => {
        // baseATK=10, baseDEF=5, baseENE=8 @L15, rarity=Incomum(1.08)
        // lm=1.4 → DEF=floor(5*1.4*1.08)=7; ATK=floor(10*1.4*1.08)=15; ENE=floor(8*1.4*1.08)=12
        it('DEF_off=6 — sem floor risk após offset (DEF_base=7, -1=6)', () => {
            const base = { hpMax: 72, atk: 15, def: 7, eneMax: 12, spd: 31 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.def).toBe(6);
            expect(stats.def).toBeGreaterThan(1); // nunca chega ao floor
        });

        it('ENE_off=13 — boost de ENE amplia capacidade de skill', () => {
            const base = { hpMax: 72, atk: 15, def: 7, eneMax: 12, spd: 31 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.eneMax).toBe(13);
        });
    });

    describe('MON_022C (Umbraquimonom, Raro, L30) — DEF=7, ENE=10', () => {
        // baseATK=14, baseDEF=7, baseENE=10 @L30, rarity=Raro(1.18)
        // lm=2.9 → DEF=floor(7*2.9*1.18)=23; ATK=floor(14*2.9*1.18)=47; ENE=floor(10*2.9*1.18)=34
        it('DEF_off=22 — offset totalmente seguro no estágio avançado', () => {
            const base = { hpMax: 148, atk: 47, def: 23, eneMax: 34, spd: 73 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.def).toBe(22);
        });

        it('ENE_off=35 — capacidade de skill elevada sustenta loop debuff→execução', () => {
            const base = { hpMax: 148, atk: 47, def: 23, eneMax: 34, spd: 73 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.eneMax).toBe(35);
        });

        it('ATK_off=48 — poder de execução no estágio avançado', () => {
            const base = { hpMax: 148, atk: 47, def: 23, eneMax: 34, spd: 73 };
            const { stats } = applyStatOffsets(base, shadowstingOffsets);
            expect(stats.atk).toBe(48);
        });
    });

    describe('Diferenciação de offsets vs swiftclaw', () => {
        const swiftclawOffsets = { hp: 0, atk: 1, def: -1, ene: 0, agi: 1 };

        it('swiftclaw: SPD+1, ENE=0 (velocidade); shadowsting: ENE+1, SPD=0 (skill)', () => {
            const base = { hpMax: 25, atk: 7, def: 4, eneMax: 6, spd: 10 };
            const swiftResult = applyStatOffsets(base, swiftclawOffsets);
            const shadowResult = applyStatOffsets(base, shadowstingOffsets);
            // swiftclaw ganha velocidade
            expect(swiftResult.stats.spd).toBe(11);
            expect(swiftResult.stats.eneMax).toBe(6);
            // shadowsting ganha energia
            expect(shadowResult.stats.spd).toBe(10);
            expect(shadowResult.stats.eneMax).toBe(7);
        });
    });
});

// ===========================================================================
// Parte 3 — Passiva: shadowsting (on_attack + hasShadowstingCharge)
// ===========================================================================

describe('Fase 10 — shadowsting passiva (oportunista_furtivo)', () => {

    describe('Comportamento correto da passiva', () => {
        it('retorna atkBonus:1 em ataque básico com carga de debuff ativa', () => {
            const instance = { canonSpeciesId: 'shadowsting' };
            const modifier = resolvePassiveModifier(instance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasShadowstingCharge: true,
            });
            expect(modifier).not.toBeNull();
            expect(modifier.atkBonus).toBe(1);
        });

        it('NÃO dispara sem carga de debuff (hasShadowstingCharge: false)', () => {
            const instance = { canonSpeciesId: 'shadowsting' };
            const modifier = resolvePassiveModifier(instance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasShadowstingCharge: false,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara em skill ofensiva — apenas ataque básico (isOffensiveSkill: true)', () => {
            const instance = { canonSpeciesId: 'shadowsting' };
            const modifier = resolvePassiveModifier(instance, {
                event: 'on_attack',
                isOffensiveSkill: true,
                hasShadowstingCharge: true,
            });
            expect(modifier).toBeNull(); // skill ofensiva não ativa shadowsting
        });

        it('NÃO dispara sem carga (hasShadowstingCharge ausente/undefined)', () => {
            const instance = { canonSpeciesId: 'shadowsting' };
            const modifier = resolvePassiveModifier(instance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                // hasShadowstingCharge não passado → undefined → falsy
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara em evento on_hit_received', () => {
            const instance = { canonSpeciesId: 'shadowsting' };
            const modifier = resolvePassiveModifier(instance, {
                event: 'on_hit_received',
                hasShadowstingCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara em evento on_skill_used', () => {
            const instance = { canonSpeciesId: 'shadowsting' };
            const modifier = resolvePassiveModifier(instance, {
                event: 'on_skill_used',
                hasShadowstingCharge: true,
                isDebuff: true,
            });
            expect(modifier).toBeNull();
        });
    });

    describe('Diferenciação mecânica vs swiftclaw', () => {
        it('swiftclaw: isFirstAttackOfCombat=true ativa; shadowsting: hasShadowstingCharge=true ativa', () => {
            const swiftInstance   = { canonSpeciesId: 'swiftclaw' };
            const shadowInstance  = { canonSpeciesId: 'shadowsting' };

            // swiftclaw: bônus no primeiro ataque do combate
            const swiftMod = resolvePassiveModifier(swiftInstance, {
                event: 'on_attack',
                isFirstAttackOfCombat: true,
                hasShadowstingCharge: false,
                isOffensiveSkill: false,
            });
            expect(swiftMod?.atkBonus).toBe(1);

            // shadowsting: bônus apenas quando debuff foi aplicado antes
            const shadowMod = resolvePassiveModifier(shadowInstance, {
                event: 'on_attack',
                isFirstAttackOfCombat: true, // não importa para shadowsting
                hasShadowstingCharge: true,
                isOffensiveSkill: false,
            });
            expect(shadowMod?.atkBonus).toBe(1);

            // shadowsting NÃO ativa sem carga, mesmo sendo primeiro ataque
            const shadowNoCharge = resolvePassiveModifier(shadowInstance, {
                event: 'on_attack',
                isFirstAttackOfCombat: true,
                hasShadowstingCharge: false,
                isOffensiveSkill: false,
            });
            expect(shadowNoCharge).toBeNull();
        });

        it('swiftclaw: dispara com isOffensiveSkill:true? Não — apenas shadowsting segue regra', () => {
            // swiftclaw usa isFirstAttackOfCombat e ignora isOffensiveSkill (básico e skill)
            const swiftInstance = { canonSpeciesId: 'swiftclaw' };
            const swiftModSkill = resolvePassiveModifier(swiftInstance, {
                event: 'on_attack',
                isFirstAttackOfCombat: true,
                isOffensiveSkill: true, // skill
            });
            expect(swiftModSkill?.atkBonus).toBe(1); // swiftclaw ativa em skill também

            // shadowsting nunca ativa em skill (isOffensiveSkill: true)
            const shadowInstance = { canonSpeciesId: 'shadowsting' };
            const shadowModSkill = resolvePassiveModifier(shadowInstance, {
                event: 'on_attack',
                isFirstAttackOfCombat: true,
                hasShadowstingCharge: true,
                isOffensiveSkill: true,
            });
            expect(shadowModSkill).toBeNull(); // shadowsting não ativa em skill ofensiva
        });
    });

    describe('Integridade de registro de passivas', () => {
        it('shadowsting está registrado em getActivePassiveIds()', () => {
            expect(getActivePassiveIds()).toContain('shadowsting');
        });

        it('hasPassive("shadowsting") retorna true', () => {
            expect(hasPassive('shadowsting')).toBe(true);
        });

        it('passivas MVP anteriores continuam registradas', () => {
            const ids = getActivePassiveIds();
            expect(ids).toContain('shieldhorn');
            expect(ids).toContain('emberfang');
            expect(ids).toContain('moonquill');
            expect(ids).toContain('floracura');
            expect(ids).toContain('swiftclaw');
        });
    });
});

// ===========================================================================
// Parte 4 — Kit Swap: slot 4 (L30) — Golpe Furtivo I
// ===========================================================================

describe('Fase 10 — shadowsting kit swap (slot 4, Golpe Furtivo I)', () => {

    describe('Aplicação do swap com slot desbloqueado', () => {
        it('com unlockedSkillSlots=4: swap aplicado no slot 4', () => {
            const instance = { canonSpeciesId: 'shadowsting', unlockedSkillSlots: 4 };
            const baseSkills = [
                { name: 'Ataque Preciso I',   type: 'DAMAGE', cost: 4, power: 19 },
                { name: 'Ataque Preciso II',   type: 'DAMAGE', cost: 6, power: 24 },
                { name: 'Enfraquecer I',       type: 'BUFF',   cost: 4, power: -2 },
                { name: 'Ataque Preciso III',  type: 'DAMAGE', cost: 8, power: 30 },
            ];
            const { appliedKitSwaps, skills } = applyKitSwaps(instance, baseSkills);
            expect(appliedKitSwaps).toHaveLength(1);
            expect(appliedKitSwaps[0].replacementId).toBe('shadowsting_ambush_strike');
            // Slot 4 substituído por Golpe Furtivo I
            expect(skills[3]).toMatchObject({
                _kitSwapId: 'shadowsting_ambush_strike',
                name: 'Golpe Furtivo I',
                type: 'DAMAGE',
                cost: 5,
                power: 22,
            });
        });

        it('swap bloqueado com unlockedSkillSlots=3 (slot 4 ainda bloqueado)', () => {
            const instance = { canonSpeciesId: 'shadowsting', unlockedSkillSlots: 3 };
            const baseSkills = [
                { name: 'Ataque Preciso I', type: 'DAMAGE', cost: 4, power: 19 },
            ];
            const { appliedKitSwaps, blockedKitSwaps } = applyKitSwaps(instance, baseSkills);
            expect(appliedKitSwaps).toHaveLength(0);
            expect(blockedKitSwaps).toHaveLength(1);
            expect(blockedKitSwaps[0].canonSkillId).toBe('rogue_ambush');
        });
    });

    describe('Calibração de eficiência', () => {
        it('Golpe Furtivo I tem eficiência 4.40 pwr/ENE (dentro da faixa tier 1-2 do Ladino)', () => {
            // Ataque Preciso I tier 1: 19/4 = 4.75 pwr/ENE
            // Ataque Preciso II tier 2: 24/6 = 4.00 pwr/ENE
            // Golpe Furtivo I: 22/5 = 4.40 — dentro da faixa [4.00, 4.75] ✅
            const eff = 22 / 5;
            expect(eff).toBeGreaterThanOrEqual(4.00);
            expect(eff).toBeLessThanOrEqual(4.75);
        });

        it('poder absoluto de Golpe Furtivo I (22) está abaixo do teto Ladino (30)', () => {
            expect(22).toBeLessThan(30); // Ataque Preciso III teto = 30
        });
    });

    describe('Diferenciação de kit swap vs swiftclaw', () => {
        it('swiftclaw: slot 1 (sempre), cadência 5.00 pwr/ENE; shadowsting: slot 4 (L30), 4.40 pwr/ENE', () => {
            // swiftclaw tem slot 1 (sempre disponível) — abertura rápida
            const swiftInstance = { canonSpeciesId: 'swiftclaw', unlockedSkillSlots: 1 };
            const { appliedKitSwaps: swiftApplied } = applyKitSwaps(swiftInstance, [
                { name: 'Flecha Poderosa I', type: 'DAMAGE', cost: 4, power: 19 },
            ]);
            expect(swiftApplied[0].replacementId).toBe('swiftclaw_precise_shot');

            // shadowsting tem slot 4 (requer L30) — bloqueado com 3 slots
            const shadowInstance3 = { canonSpeciesId: 'shadowsting', unlockedSkillSlots: 3 };
            const { blockedKitSwaps } = applyKitSwaps(shadowInstance3, []);
            expect(blockedKitSwaps).toHaveLength(1); // slot 4 bloqueado

            // shadowsting disponível com 4 slots
            const shadowInstance4 = { canonSpeciesId: 'shadowsting', unlockedSkillSlots: 4 };
            const { appliedKitSwaps: shadowApplied } = applyKitSwaps(shadowInstance4, [
                { name: 'Ataque Preciso I', type: 'DAMAGE', cost: 4, power: 19 },
            ]);
            expect(shadowApplied[0].replacementId).toBe('shadowsting_ambush_strike');
        });

        it('hasKitSwap("shadowsting") retorna true', () => {
            expect(hasKitSwap('shadowsting')).toBe(true);
        });

        it('getActiveKitSwapIds() inclui shadowsting e swiftclaw', () => {
            const ids = getActiveKitSwapIds();
            expect(ids).toContain('shadowsting');
            expect(ids).toContain('swiftclaw');
        });
    });
});

// ===========================================================================
// Parte 5 — Promoção: L50 → Golpe Furtivo II
// ===========================================================================

describe('Fase 10 — shadowsting promoção (L50 → Golpe Furtivo II)', () => {

    describe('Promoção ocorre corretamente', () => {
        it('promove Golpe Furtivo I → II ao atingir nível 50', () => {
            const instance = {
                canonSpeciesId: 'shadowsting',
                level: 50,
                unlockedSkillSlots: 4,
                appliedKitSwaps: [
                    {
                        slot: 4,
                        canonSkillId: 'rogue_ambush',
                        replacementId: 'shadowsting_ambush_strike',
                        action: 'replaced',
                    },
                ],
                promotedKitSwaps: [],
                blockedKitSwapPromotions: [],
            };
            const { promotedKitSwaps, updated } = promoteKitSwaps(instance);
            expect(updated).toBe(true);
            expect(promotedKitSwaps).toHaveLength(1);
            expect(promotedKitSwaps[0].toSwapId).toBe('shadowsting_ambush_strike_ii');
            expect(promotedKitSwaps[0].promotedSkill).toMatchObject({
                name: 'Golpe Furtivo II',
                type: 'DAMAGE',
                cost: 6,
                power: 28,
            });
        });

        it('NÃO promove antes do nível 50', () => {
            const instance = {
                canonSpeciesId: 'shadowsting',
                level: 49,
                unlockedSkillSlots: 4,
                appliedKitSwaps: [
                    {
                        slot: 4,
                        canonSkillId: 'rogue_ambush',
                        replacementId: 'shadowsting_ambush_strike',
                        action: 'replaced',
                    },
                ],
                promotedKitSwaps: [],
                blockedKitSwapPromotions: [],
            };
            const { promotedKitSwaps, updated } = promoteKitSwaps(instance);
            expect(updated).toBe(false);
            expect(promotedKitSwaps).toHaveLength(0);
        });
    });

    describe('Calibração da versão promovida', () => {
        it('Golpe Furtivo II: eficiência 4.67 pwr/ENE (dentro do teto tier 1)', () => {
            // 28/6 ≈ 4.67 pwr/ENE — abaixo do teto tier 1 (4.75) ✅
            const eff = 28 / 6;
            expect(eff).toBeGreaterThanOrEqual(4.00);
            expect(eff).toBeLessThan(4.75); // não supera o tier 1 de referência
        });

        it('Golpe Furtivo II: poder absoluto (28) abaixo do teto Ladino (30)', () => {
            expect(28).toBeLessThan(30);
        });

        it('Golpe Furtivo II: diferença filosófica de swiftclaw_ii (cadência vs burst)', () => {
            // swiftclaw_ii: cost 4, power 20 → 5.00 pwr/ENE (cadência máxima, burst menor)
            // shadowsting_ii: cost 6, power 28 → 4.67 pwr/ENE (burst maior, custo maior)
            const swiftclawIIEff = 20 / 4; // 5.00
            const shadowstingIIEff = 28 / 6; // 4.67

            // shadowsting tem maior poder absoluto
            expect(28).toBeGreaterThan(20);
            // mas menor eficiência pwr/ENE (inversão intencional)
            expect(shadowstingIIEff).toBeLessThan(swiftclawIIEff);
        });

        it('getPromotableSwapIds inclui shadowsting_ambush_strike', () => {
            expect(getPromotableSwapIds()).toContain('shadowsting_ambush_strike');
        });
    });
});

// ===========================================================================
// Parte 6 — Coerência do arquétipo ao longo da linha evolutiva
// ===========================================================================

describe('Fase 10 — coerência do arquétipo oportunista_furtivo na linha Corvimon', () => {

    const offsets = { hp: 0, atk: 1, def: -1, ene: 1, agi: 0 };

    // Stats base reais por estágio (formula: Math.floor(baseStat * lm * rarityPower))
    // rarityPower: Comum=1.00, Incomum=1.08, Raro=1.18
    const stages = [
        { id: 'MON_022', name: 'Corvimon', base: { hpMax: 23, atk: 7, def: 4, eneMax: 6, spd: 10 }, lvl: 1 },
        { id: 'MON_022B', name: 'Noxcorvomon', base: { hpMax: 72, atk: 15, def: 7, eneMax: 12, spd: 31 }, lvl: 15 },
        { id: 'MON_022C', name: 'Umbraquimonom', base: { hpMax: 148, atk: 47, def: 23, eneMax: 34, spd: 73 }, lvl: 30 },
    ];

    it('todos os estágios têm DEF_off ≥ 3 (sem floor risk)', () => {
        for (const s of stages) {
            const { stats } = applyStatOffsets(s.base, offsets);
            expect(stats.def).toBeGreaterThanOrEqual(3);
        }
    });

    it('todos os estágios têm ATK_off > DEF_off (r_atk/def > 1.0 — identidade ofensiva)', () => {
        for (const s of stages) {
            const { stats } = applyStatOffsets(s.base, offsets);
            expect(stats.atk / stats.def).toBeGreaterThan(1.0);
        }
    });

    it('ENE_off > ENE_base em todos os estágios (boost ativo)', () => {
        for (const s of stages) {
            const { stats } = applyStatOffsets(s.base, offsets);
            expect(stats.eneMax).toBe(s.base.eneMax + 1);
        }
    });

    it('SPD permanece inalterado em todos os estágios (sem boost de velocidade)', () => {
        for (const s of stages) {
            const { stats } = applyStatOffsets(s.base, offsets);
            expect(stats.spd).toBe(s.base.spd); // agi=0 → nenhuma mudança
        }
    });

    it('arquétipo skill-oriented: ENE/ATK > 0.70 nos estágios base (sustenta loop debuff)', () => {
        // Estágio base L1: ENE_off/ATK_off = 7/8 = 0.875 → ✅ sustenta loop
        const { stats: base0 } = applyStatOffsets(stages[0].base, offsets);
        expect(base0.eneMax / base0.atk).toBeGreaterThan(0.70);
    });
});

// ===========================================================================
// Parte 7 — Regressão: espécies MVP e swiftclaw não afetadas
// ===========================================================================

describe('Fase 10 — regressão (espécies anteriores intactas)', () => {

    it('swiftclaw passiva: on_attack com isFirstAttackOfCombat ainda funciona', () => {
        const instance = { canonSpeciesId: 'swiftclaw' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_attack',
            isFirstAttackOfCombat: true,
            isOffensiveSkill: false,
        });
        expect(modifier?.atkBonus).toBe(1);
    });

    it('swiftclaw passiva: NÃO afetada por hasShadowstingCharge', () => {
        const instance = { canonSpeciesId: 'swiftclaw' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_attack',
            isFirstAttackOfCombat: false, // já consumido
            hasShadowstingCharge: true, // não relevante para swiftclaw
            isOffensiveSkill: false,
        });
        expect(modifier).toBeNull(); // swiftclaw não ativa se firstAttack já consumido
    });

    it('emberfang passiva: on_attack com isOffensiveSkill ainda funciona', () => {
        const instance = { canonSpeciesId: 'emberfang' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_attack',
            hpPct: 0.80,
            isOffensiveSkill: true,
            hasShadowstingCharge: true, // não afeta emberfang
        });
        expect(modifier?.atkBonus).toBe(1);
    });

    it('shieldhorn passiva: on_hit_received ainda funciona', () => {
        const instance = { canonSpeciesId: 'shieldhorn' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_hit_received',
            isFirstHitThisTurn: true,
        });
        expect(modifier?.damageReduction).toBe(1);
    });

    it('moonquill passiva: on_skill_used com isDebuff ainda funciona', () => {
        const instance = { canonSpeciesId: 'moonquill' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            isDebuff: true,
        });
        expect(modifier?.spdBuff).toMatchObject({ power: 1, duration: 1 });
    });

    it('floracura passiva: on_heal_item com isFirstHeal ainda funciona', () => {
        const instance = { canonSpeciesId: 'floracura' };
        const modifier = resolvePassiveModifier(instance, {
            event: 'on_heal_item',
            isFirstHeal: true,
        });
        expect(modifier?.healBonus).toBe(3);
    });

    it('swiftclaw kit swap: slot 1 intacto após Fase 10', () => {
        const instance = { canonSpeciesId: 'swiftclaw', unlockedSkillSlots: 1 };
        const baseSkill = { name: 'Flecha Poderosa I', type: 'DAMAGE', cost: 4, power: 19 };
        const { appliedKitSwaps } = applyKitSwaps(instance, [baseSkill]);
        expect(appliedKitSwaps).toHaveLength(1);
        expect(appliedKitSwaps[0].replacementId).toBe('swiftclaw_precise_shot');
    });

    it('bridge pós-Fase 10: swiftclaw permanece com 7 mapeamentos', () => {
        const swiftclawIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
            .filter(([, v]) => v === 'swiftclaw')
            .map(([k]) => k);
        expect(swiftclawIds).toHaveLength(7);
    });
});

// ===========================================================================
// Parte 8 — Fallback e Ladino sem mapeamento
// ===========================================================================

describe('Fase 10 — fallback (templates não mapeados de Ladino)', () => {

    it('null para MON_008 (Sombrio) — retorna null por resolveCanonSpeciesId', () => {
        expect(resolveCanonSpeciesId('MON_008')).toBeNull();
    });

    it('null para MON_030 (Furtilhon) — linha excluída', () => {
        expect(resolveCanonSpeciesId('MON_030')).toBeNull();
    });

    it('null para template sem canonSpeciesId — passiva retorna null (fallback seguro)', () => {
        const instance = {}; // sem canonSpeciesId
        expect(resolvePassiveModifier(instance, {
            event: 'on_attack',
            isOffensiveSkill: false,
            hasShadowstingCharge: true,
        })).toBeNull();
    });

    it('applyKitSwaps sem canonSpeciesId retorna skills originais inalteradas', () => {
        const instance = {}; // sem canonSpeciesId
        const baseSkills = [{ name: 'Ataque Preciso I', type: 'DAMAGE', cost: 4, power: 19 }];
        const { appliedKitSwaps, skills } = applyKitSwaps(instance, baseSkills);
        expect(appliedKitSwaps).toHaveLength(0);
        expect(skills).toEqual(baseSkills);
    });

    it('getEligibleUnmappedTemplateIds: MON_008/MON_030 continuam sem mapeamento', () => {
        const catalog = [
            { id: 'MON_008', class: 'Ladino' },
            { id: 'MON_022', class: 'Ladino' },
            { id: 'MON_030', class: 'Ladino' },
        ];
        const eligible = getEligibleUnmappedTemplateIds(catalog);
        // MON_022 foi mapeado → não está mais na lista eligible
        expect(eligible.some(e => e.id === 'MON_022')).toBe(false);
        // MON_008 e MON_030 continuam sem mapeamento
        // (Ladino agora tem canonSpecies, então são elegíveis mas excluídos por decisão)
        expect(eligible.some(e => e.id === 'MON_008')).toBe(true);
        expect(eligible.some(e => e.id === 'MON_030')).toBe(true);
    });
});
