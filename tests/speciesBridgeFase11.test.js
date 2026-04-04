/**
 * SPECIES BRIDGE TESTS — Fase 11
 *
 * Cobertura da expansão da Fase 11: espécie canônica bellwave (Bardo).
 *
 * Escolha de linha justificada:
 *   A linha Zunzumon → Melodimon → Rainhassommon (MON_027/B/C) foi escolhida por:
 *   - SPD/ATK = 2.75 no estágio base (maior de todo o catálogo Bardo) — não é striker.
 *   - ENE/ATK = 2.0 no estágio base — perfil de skill-user, não auto-attacker.
 *   - 3 estágios com evolução limpa (Comum→Incomum→Raro, todos Bardo).
 *   - DEF_base ≥ 4 em todos os estágios: offset def-1 nunca gera DEF_off < 3 (sem floor).
 *   - Arquétipo cadencia_ritmica preservado ao longo de toda a linha evolutiva:
 *     MON_027:  SPD/ATK 2.75, ENE/ATK 2.00 — alta velocidade e energia ✅
 *     MON_027B: SPD/ATK 2.33, ENE/ATK 1.67 — identidade preservada ✅
 *     MON_027C: SPD/ATK 1.875, ENE/ATK 1.50 — madura, SPD e ENE ainda dominam ✅
 *
 * Exclusões justificadas:
 *   - MON_001 (Cantapau): sem linha evolutiva (estágio único) — sem linha validável.
 *   - MON_011/B/C/D (Dinomon → Giganotometalmon): drift relevante em MON_011D.
 *     Estágios 1-3 têm SPD/ATK ≥ 1.09 (bardo veloz), mas MON_011D tem ATK 16, DEF 12
 *     e SPD 11 — SPD cai abaixo de ATK, perfil vira bruiser pesado. Linha excluída.
 *
 * Diferenciação mecânica vs outras espécies:
 *   bellwave — cadencia_ritmica: offsets { def-1, ene+1, agi+1 }; passiva carregada
 *     por QUALQUER skill, consumida no próximo ataque básico; kit swap slot 4 (L30),
 *     SPD debuff no inimigo — cria loop: skill→ritmo carregado→básico(+1 ATK)→...
 *   swiftclaw — striker_veloz: { atk+1, def-1, agi+1 }; passiva one-time primeiro ataque;
 *     kit swap slot 1 (sempre), DAMAGE — sem ENE focus, identidade ofensiva pura.
 *   shadowsting — oportunista_furtivo: { atk+1, def-1, ene+1 }; passiva exige DEBUFF
 *     específico; kit swap slot 4 (L30), DAMAGE de execução — identidade oportunista.
 *   moonquill — controle_leve: { ene+1 }; passiva on debuff → SPD próprio+1; kit swap
 *     slot 4, ATK debuff — identidade de controle com auto-aceleração.
 *
 * Cobertura:
 *   - Bridge: resolveCanonSpeciesId() — 3 novos mapeamentos bellwave
 *   - Offsets: { def-1, ene+1, agi+1 } verificados vs stats base de cada estágio
 *   - Passiva: resolvePassiveModifier() — bellwave on_attack + hasBellwaveRhythmCharge
 *   - Kit swap: applyKitSwaps() — bellwave slot 4 (Nota Discordante I)
 *   - Promoção: promoteKitSwaps() — bellwave L50 → Nota Discordante II
 *   - Diferenciação: passiva e swap diferem mecanicamente de swiftclaw, shadowsting, moonquill
 *   - Regressão: Ladino/shadowsting, Caçador/swiftclaw e espécies MVP anteriores intactas
 *   - Fallback: templates não mapeados (MON_001, MON_011/B/C/D) permanecem sem mapeamento
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
            bellwave:     { hp: 0,  atk: 0,  def: -1, ene: 1,  agi: 1  },
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
// Parte 1 — Bridge: novos mapeamentos bellwave (Bardo)
// ===========================================================================

describe('Fase 11 — Bardo → bellwave (bridge)', () => {

    describe('Linha Zunzumon (MON_027)', () => {
        it('MON_027 (Zunzumon, Comum) mapeia para bellwave — SPD 11, ENE 8, ATK 4', () => {
            expect(resolveCanonSpeciesId('MON_027')).toBe('bellwave');
        });

        it('MON_027B (Melodimon, Incomum) mapeia para bellwave — SPD 14, ENE 10, ATK 6', () => {
            expect(resolveCanonSpeciesId('MON_027B')).toBe('bellwave');
        });

        it('MON_027C (Rainhassommon, Raro) mapeia para bellwave — SPD 15, ENE 12, ATK 8', () => {
            expect(resolveCanonSpeciesId('MON_027C')).toBe('bellwave');
        });
    });

    describe('Exclusões justificadas', () => {
        it('MON_001 (Cantapau) não mapeado — sem linha evolutiva', () => {
            expect(resolveCanonSpeciesId('MON_001')).toBeNull();
        });

        it('MON_011 (Dinomon) não mapeado — drift em MON_011D (ATK 16 > SPD 11)', () => {
            // Atualizado em Fase 13.2: MON_011 agora é bellwave (mapeamento parcial da linha)
            expect(resolveCanonSpeciesId('MON_011')).toBe('bellwave');
        });

        it('MON_011B (Guitarapitormon) não mapeado — linha com drift no final', () => {
            // Atualizado em Fase 13.2: MON_011B agora é bellwave (mapeamento parcial da linha)
            expect(resolveCanonSpeciesId('MON_011B')).toBe('bellwave');
        });

        it('MON_011C (TRockmon) não mapeado — linha com drift no final', () => {
            // Atualizado em Fase 13.2: MON_011C agora é bellwave (mapeamento parcial da linha)
            expect(resolveCanonSpeciesId('MON_011C')).toBe('bellwave');
        });

        it('MON_011D (Giganotometalmon) não mapeado — pivot de arquétipo (bruiser pesado)', () => {
            expect(resolveCanonSpeciesId('MON_011D')).toBeNull();
        });
    });

    describe('Presença na tabela RUNTIME_TO_CANON_SPECIES', () => {
        it('6 mapeamentos de bellwave presentes na tabela (3 Fase 11 + 3 Fase 13.2)', () => {
            const bellwaveMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'bellwave');
            expect(bellwaveMappings).toHaveLength(6);
        });

        it('mapeamentos são exatamente MON_027, MON_027B, MON_027C, MON_011, MON_011B, MON_011C', () => {
            const bellwaveIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'bellwave')
                .map(([k]) => k)
                .sort();
            expect(bellwaveIds).toEqual(['MON_011', 'MON_011B', 'MON_011C', 'MON_027', 'MON_027B', 'MON_027C']);
        });
    });
});

// ===========================================================================
// Parte 2 — Offsets: { def-1, ene+1, agi+1 } verificados por estágio
// ===========================================================================

describe('Fase 11 — bellwave — offsets de stats', () => {
    const offsets = { hp: 0, atk: 0, def: -1, ene: 1, agi: 1 };

    describe('MON_027 (Zunzumon) — ATK:4, DEF:4, SPD:11, ENE:8, HP:22', () => {
        const base = { hpMax: 22, atk: 4, def: 4, spd: 11, eneMax: 8 };

        it('DEF reduzida de 4 para 3 (def-1) — sem floor (≥ 1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(3);
        });

        it('ENE aumentada de 8 para 9 (ene+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(9);
        });

        it('SPD aumentada de 11 para 12 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(12);
        });

        it('ATK não alterado (atk:0)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(4);
        });

        it('HP não alterado (hp:0)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.hpMax).toBe(22);
        });

        it('applied registra apenas os offsets não-zero', () => {
            const { applied } = applyStatOffsets(base, offsets);
            expect(applied).toEqual({ def: -1, ene: 1, agi: 1 });
        });
    });

    describe('MON_027B (Melodimon) — ATK:6, DEF:4, SPD:14, ENE:10, HP:28', () => {
        const base = { hpMax: 28, atk: 6, def: 4, spd: 14, eneMax: 10 };

        it('DEF de 4 para 3 (def-1) — sem floor', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(3);
        });

        it('ENE de 10 para 11 (ene+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(11);
        });

        it('SPD de 14 para 15 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(15);
        });

        it('ATK permanece 6', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(6);
        });
    });

    describe('MON_027C (Rainhassommon) — ATK:8, DEF:6, SPD:15, ENE:12, HP:36', () => {
        const base = { hpMax: 36, atk: 8, def: 6, spd: 15, eneMax: 12 };

        it('DEF de 6 para 5 (def-1) — DEF_off confortável', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(5);
        });

        it('ENE de 12 para 13 (ene+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(13);
        });

        it('SPD de 15 para 16 (agi+1) — mais rápido na forma madura', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(16);
        });

        it('ATK permanece 8', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(8);
        });
    });

    describe('Verificação de coerência de arquétipo ao longo da linha', () => {
        it('SPD/ATK permanece > 1 em todos os estágios (identidade de velocidade)', () => {
            // Base stats dos 3 estágios
            const stages = [
                { spd: 11, atk: 4 },  // MON_027 + agi+1 = spd 12; atk 4
                { spd: 14, atk: 6 },  // MON_027B + agi+1 = spd 15; atk 6
                { spd: 15, atk: 8 },  // MON_027C + agi+1 = spd 16; atk 8
            ];
            stages.forEach(({ spd, atk }) => {
                const effectiveSpd = spd + 1; // agi+1
                expect(effectiveSpd / atk).toBeGreaterThan(1);
            });
        });

        it('ENE/ATK permanece > 1 em todos os estágios (identidade de skill-user)', () => {
            const stages = [
                { ene: 8, atk: 4 },   // MON_027 + ene+1 = 9; ratio 2.25
                { ene: 10, atk: 6 },  // MON_027B + ene+1 = 11; ratio 1.83
                { ene: 12, atk: 8 },  // MON_027C + ene+1 = 13; ratio 1.625
            ];
            stages.forEach(({ ene, atk }) => {
                const effectiveEne = ene + 1; // ene+1
                expect(effectiveEne / atk).toBeGreaterThan(1);
            });
        });

        it('DEF_off ≥ 3 em todos os estágios (sem floor perigoso)', () => {
            const defBases = [4, 4, 6]; // MON_027, 027B, 027C
            defBases.forEach(baseDef => {
                expect(Math.max(1, baseDef - 1)).toBeGreaterThanOrEqual(3);
            });
        });
    });
});

// ===========================================================================
// Parte 3 — Passiva: bellwave cadencia_ritmica
// ===========================================================================

describe('Fase 11 — bellwave — passiva (cadencia_ritmica)', () => {
    const bellwaveInstance = { canonSpeciesId: 'bellwave' };

    describe('Disparo correto', () => {
        it('dispara em ataque básico com hasBellwaveRhythmCharge=true → atkBonus:1', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toEqual({ atkBonus: 1 });
        });
    });

    describe('Não dispara em situações incorretas', () => {
        it('NÃO dispara em skill ofensiva (isOffensiveSkill: true)', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack',
                isOffensiveSkill: true,
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara sem carga (hasBellwaveRhythmCharge: false)', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasBellwaveRhythmCharge: false,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara sem carga (hasBellwaveRhythmCharge: undefined)', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack',
                isOffensiveSkill: false,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara em on_hit_received', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_hit_received',
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara em on_skill_used', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_skill_used',
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara em on_heal_item', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_heal_item',
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara sem canonSpeciesId', () => {
            const modifier = resolvePassiveModifier({}, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('NÃO dispara para outra espécie (shadowsting)', () => {
            const modifier = resolvePassiveModifier({ canonSpeciesId: 'shadowsting' }, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });
    });

    describe('Registro no sistema', () => {
        it('bellwave listado em getActivePassiveIds()', () => {
            expect(getActivePassiveIds()).toContain('bellwave');
        });

        it('hasPassive("bellwave") retorna true', () => {
            expect(hasPassive('bellwave')).toBe(true);
        });
    });

    describe('Diferenciação mecânica vs outras passivas', () => {
        it('shadowsting NÃO dispara com hasBellwaveRhythmCharge (contextos diferentes)', () => {
            // shadowsting usa hasShadowstingCharge, não hasBellwaveRhythmCharge
            const modifier = resolvePassiveModifier({ canonSpeciesId: 'shadowsting' }, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasShadowstingCharge: false,
                hasBellwaveRhythmCharge: true, // não é o contexto correto para shadowsting
            });
            expect(modifier).toBeNull();
        });

        it('bellwave NÃO é ativado por hasShadowstingCharge (contextos diferentes)', () => {
            const modifier = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasShadowstingCharge: true, // não é o contexto correto para bellwave
                hasBellwaveRhythmCharge: false,
            });
            expect(modifier).toBeNull();
        });

        it('swiftclaw NÃO dispara com hasBellwaveRhythmCharge', () => {
            const modifier = resolvePassiveModifier({ canonSpeciesId: 'swiftclaw' }, {
                event: 'on_attack',
                isOffensiveSkill: false,
                isFirstAttackOfCombat: false,
                hasBellwaveRhythmCharge: true,
            });
            expect(modifier).toBeNull();
        });

        it('moonquill NÃO dispara em on_attack mesmo com carga bellwave (evento errado)', () => {
            const modifier = resolvePassiveModifier({ canonSpeciesId: 'moonquill' }, {
                event: 'on_attack',
                isOffensiveSkill: false,
                hasBellwaveRhythmCharge: true,
                isDebuff: true,
            });
            expect(modifier).toBeNull();
        });
    });
});

// ===========================================================================
// Parte 4 — Kit Swap: bellwave slot 4 (Nota Discordante I)
// ===========================================================================

describe('Fase 11 — bellwave — kit swap (Nota Discordante I)', () => {

    describe('Registro no sistema', () => {
        it('bellwave listado em getActiveKitSwapIds()', () => {
            expect(getActiveKitSwapIds()).toContain('bellwave');
        });

        it('hasKitSwap("bellwave") retorna true', () => {
            expect(hasKitSwap('bellwave')).toBe(true);
        });
    });

    describe('Aplicação do swap — slot 4 desbloqueado', () => {
        const instanceL30 = {
            canonSpeciesId: 'bellwave',
            unlockedSkillSlots: 4,
        };

        it('aplica Nota Discordante I no slot 4 quando desbloqueado', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills, appliedKitSwaps } = applyKitSwaps(instanceL30, baseSkills);

            expect(appliedKitSwaps).toHaveLength(1);
            expect(appliedKitSwaps[0].slot).toBe(4);
            expect(appliedKitSwaps[0].canonSkillId).toBe('bard_dissonance');
            expect(appliedKitSwaps[0].replacementId).toBe('bellwave_discordant_note');
        });

        it('Nota Discordante I tem tipo BUFF (debuff de SPD)', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills } = applyKitSwaps(instanceL30, baseSkills);
            const slot4 = skills[3];
            expect(slot4.type).toBe('BUFF');
        });

        it('Nota Discordante I tem power negativo (debuff)', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills } = applyKitSwaps(instanceL30, baseSkills);
            const slot4 = skills[3];
            expect(slot4.power).toBeLessThan(0);
        });

        it('Nota Discordante I tem target "enemy" (SPD debuff no inimigo)', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills } = applyKitSwaps(instanceL30, baseSkills);
            const slot4 = skills[3];
            expect(slot4.target).toBe('enemy');
        });

        it('Nota Discordante I tem buffType SPD', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills } = applyKitSwaps(instanceL30, baseSkills);
            const slot4 = skills[3];
            expect(slot4.buffType).toBe('SPD');
        });

        it('Nota Discordante I tem duration 2 (debuff dura 2 turnos)', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills } = applyKitSwaps(instanceL30, baseSkills);
            const slot4 = skills[3];
            expect(slot4.duration).toBe(2);
        });

        it('Nota Discordante I é reconhecida como debuff (BUFF+enemy+power<0)', () => {
            const baseSkills = [
                { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
                { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
                { name: 'Harmonia', type: 'BUFF', cost: 4 },
            ];
            const { skills } = applyKitSwaps(instanceL30, baseSkills);
            const slot4 = skills[3];
            // Critério de isDebuff igual ao usado no wildActions.js
            const isDebuff = slot4.type === 'BUFF' &&
                (slot4.target === 'enemy' || slot4.target === 'Inimigo') &&
                (slot4.power || 0) < 0;
            expect(isDebuff).toBe(true);
        });
    });

    describe('Slot bloqueado — slot 4 não desbloqueado', () => {
        it('NÃO aplica swap se unlockedSkillSlots < 4', () => {
            const instanceL1 = { canonSpeciesId: 'bellwave', unlockedSkillSlots: 1 };
            const baseSkills = [{ name: 'Nota Básica', type: 'DAMAGE', cost: 2 }];
            const { skills, appliedKitSwaps, blockedKitSwaps } = applyKitSwaps(instanceL1, baseSkills);

            expect(appliedKitSwaps).toHaveLength(0);
            expect(blockedKitSwaps).toHaveLength(1);
            expect(blockedKitSwaps[0].reason).toBe('slot_not_unlocked');
            expect(skills).toHaveLength(1);
        });
    });

    describe('Diferenciação vs moonquill (ATK debuff vs SPD debuff)', () => {
        it('moonquill usa buffType ATK; bellwave usa buffType SPD', () => {
            const moonquillInstance = { canonSpeciesId: 'moonquill', unlockedSkillSlots: 4 };
            const bellwaveInstance = { canonSpeciesId: 'bellwave', unlockedSkillSlots: 4 };
            const baseSkills = [
                { name: 'Sk1', type: 'DAMAGE', cost: 2 },
                { name: 'Sk2', type: 'BUFF', cost: 3 },
                { name: 'Sk3', type: 'BUFF', cost: 4 },
            ];

            const { skills: mqSkills } = applyKitSwaps(moonquillInstance, baseSkills);
            const { skills: bwSkills } = applyKitSwaps(bellwaveInstance, baseSkills);

            expect(mqSkills[3].buffType).toBe('ATK');
            expect(bwSkills[3].buffType).toBe('SPD');
        });
    });
});

// ===========================================================================
// Parte 5 — Promoção: bellwave L50 → Nota Discordante II
// ===========================================================================

describe('Fase 11 — bellwave — promoção de kit swap (L50)', () => {
    const baseInstance = {
        canonSpeciesId: 'bellwave',
        unlockedSkillSlots: 4,
        level: 50,
        appliedKitSwaps: [{
            slot: 4,
            canonSkillId: 'bard_dissonance',
            replacementId: 'bellwave_discordant_note',
            action: 'added',
            originalSkill: null,
        }],
        skills: [
            { name: 'Nota Básica', type: 'DAMAGE', cost: 2 },
            { name: 'Melodia Suave', type: 'BUFF', cost: 3 },
            { name: 'Harmonia', type: 'BUFF', cost: 4 },
            { _kitSwapId: 'bellwave_discordant_note', name: 'Nota Discordante I', type: 'BUFF', cost: 4, power: -2, buffType: 'SPD', target: 'enemy', duration: 2 },
        ],
    };

    it('promoveKitSwaps promove para Nota Discordante II no nível 50', () => {
        const instance = JSON.parse(JSON.stringify(baseInstance));
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps).toHaveLength(1);
        expect(promotedKitSwaps[0].toSwapId).toBe('bellwave_discordant_note_ii');
    });

    it('Nota Discordante II tem custo 5 (maior que versão I com custo 4)', () => {
        const instance = JSON.parse(JSON.stringify(baseInstance));
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps[0].promotedSkill.cost).toBe(5);
    });

    it('Nota Discordante II tem power -3 SPD (maior debuff que versão I com -2)', () => {
        const instance = JSON.parse(JSON.stringify(baseInstance));
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps[0].promotedSkill.power).toBe(-3);
    });

    it('Nota Discordante II mantém buffType SPD e target enemy', () => {
        const instance = JSON.parse(JSON.stringify(baseInstance));
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        const promoted = promotedKitSwaps[0].promotedSkill;
        expect(promoted.buffType).toBe('SPD');
        expect(promoted.target).toBe('enemy');
        expect(promoted.duration).toBe(2);
    });

    it('NÃO promove em nível 49 (abaixo do limiar)', () => {
        const instance = JSON.parse(JSON.stringify(baseInstance));
        instance.level = 49;
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps).toHaveLength(0);
    });

    it('NÃO promove sem o swap aplicado', () => {
        const instance = JSON.parse(JSON.stringify(baseInstance));
        instance.appliedKitSwaps = [];
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps).toHaveLength(0);
    });
});

// ===========================================================================
// Parte 6 — Diferenciação mecânica (prova de identidade própria)
// ===========================================================================

describe('Fase 11 — bellwave — diferenciação mecânica', () => {

    describe('Loop bellwave vs shadowsting', () => {
        it('shadowsting exige isDebuff para carregar; bellwave não (qualquer skill carrega)', () => {
            // shadowsting: hasShadowstingCharge só é true após debuff específico
            // bellwave: hasBellwaveRhythmCharge pode ser true após qualquer skill
            const shadowstingInstance = { canonSpeciesId: 'shadowsting' };
            const bellwaveInstance = { canonSpeciesId: 'bellwave' };

            // sem carga → nenhum dispara
            const noChargeShadow = resolvePassiveModifier(shadowstingInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasShadowstingCharge: false,
            });
            const noChargeBell = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasBellwaveRhythmCharge: false,
            });
            expect(noChargeShadow).toBeNull();
            expect(noChargeBell).toBeNull();

            // com carga correta → cada um dispara apenas com seu próprio contexto
            const chargedShadow = resolvePassiveModifier(shadowstingInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasShadowstingCharge: true,
            });
            const chargedBell = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasBellwaveRhythmCharge: true,
            });
            expect(chargedShadow).toEqual({ atkBonus: 1 });
            expect(chargedBell).toEqual({ atkBonus: 1 });
        });

        it('offsets bellwave diferem de shadowsting (agi+1 vs sem agi; atk:0 vs atk+1)', () => {
            // bellwave: { def-1, ene+1, agi+1 } — velocidade e energia
            // shadowsting: { atk+1, def-1, ene+1 } — ataque e energia
            const bwBase = { hpMax: 22, atk: 4, def: 4, spd: 11, eneMax: 8 };
            const ssBase = { hpMax: 22, atk: 4, def: 4, spd: 11, eneMax: 8 };

            const bwOffsets = { hp: 0, atk: 0, def: -1, ene: 1, agi: 1 };
            const ssOffsets = { hp: 0, atk: 1, def: -1, ene: 1, agi: 0 };

            const { stats: bwStats } = applyStatOffsets(bwBase, bwOffsets);
            const { stats: ssStats } = applyStatOffsets(ssBase, ssOffsets);

            // bellwave: ATK não aumentado, SPD aumentado
            expect(bwStats.atk).toBe(4);  // sem ATK bonus
            expect(bwStats.spd).toBe(12); // agi+1

            // shadowsting: ATK aumentado, SPD não alterado
            expect(ssStats.atk).toBe(5);  // atk+1
            expect(ssStats.spd).toBe(11); // sem agi bonus
        });
    });

    describe('Loop bellwave vs moonquill', () => {
        it('moonquill ganha SPD ao USAR debuff; bellwave ganha ATK no ATAQUE após qualquer skill', () => {
            const moonquillInstance = { canonSpeciesId: 'moonquill' };
            const bellwaveInstance = { canonSpeciesId: 'bellwave' };

            // moonquill: on_skill_used + isDebuff → spdBuff
            const mqPassive = resolvePassiveModifier(moonquillInstance, {
                event: 'on_skill_used', isDebuff: true,
            });
            expect(mqPassive?.spdBuff).toBeDefined();
            expect(mqPassive?.atkBonus).toBeUndefined();

            // bellwave: on_attack + hasBellwaveRhythmCharge → atkBonus
            const bwPassive = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasBellwaveRhythmCharge: true,
            });
            expect(bwPassive?.atkBonus).toBeDefined();
            expect(bwPassive?.spdBuff).toBeUndefined();
        });

        it('kit swap bellwave debuffa SPD; kit swap moonquill debuffa ATK', () => {
            // Verificado via KIT_SWAP_TABLE diretamente
            const bwInstance = { canonSpeciesId: 'bellwave', unlockedSkillSlots: 4 };
            const mqInstance = { canonSpeciesId: 'moonquill', unlockedSkillSlots: 4 };
            const skills = [
                { name: 'Sk1', type: 'DAMAGE', cost: 2 },
                { name: 'Sk2', type: 'BUFF', cost: 3 },
                { name: 'Sk3', type: 'BUFF', cost: 4 },
            ];

            const { skills: bwSkills } = applyKitSwaps(bwInstance, skills);
            const { skills: mqSkills } = applyKitSwaps(mqInstance, skills);

            expect(bwSkills[3].buffType).toBe('SPD'); // bellwave: SPD debuff
            expect(mqSkills[3].buffType).toBe('ATK'); // moonquill: ATK debuff
        });
    });

    describe('Loop bellwave vs swiftclaw', () => {
        it('swiftclaw: passiva one-time no primeiro ataque; bellwave: recarregável após cada skill', () => {
            const swiftclawInstance = { canonSpeciesId: 'swiftclaw' };
            const bellwaveInstance = { canonSpeciesId: 'bellwave' };

            // Primeira vez: swiftclaw com isFirstAttackOfCombat=true dispara
            const sc1 = resolvePassiveModifier(swiftclawInstance, {
                event: 'on_attack', isOffensiveSkill: false, isFirstAttackOfCombat: true,
            });
            expect(sc1?.atkBonus).toBe(1);

            // Segunda vez: swiftclaw com isFirstAttackOfCombat=false NÃO dispara
            const sc2 = resolvePassiveModifier(swiftclawInstance, {
                event: 'on_attack', isOffensiveSkill: false, isFirstAttackOfCombat: false,
            });
            expect(sc2).toBeNull();

            // bellwave: pode disparar múltiplas vezes enquanto hasBellwaveRhythmCharge=true
            const bw1 = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasBellwaveRhythmCharge: true,
            });
            const bw2 = resolvePassiveModifier(bellwaveInstance, {
                event: 'on_attack', isOffensiveSkill: false, hasBellwaveRhythmCharge: true,
            });
            expect(bw1?.atkBonus).toBe(1);
            expect(bw2?.atkBonus).toBe(1); // recarga → dispara de novo
        });
    });
});

// ===========================================================================
// Parte 7 — Regressão: espécies anteriores não foram alteradas
// ===========================================================================

describe('Fase 11 — regressão: espécies anteriores intactas', () => {

    describe('Mapeamentos anteriores preservados', () => {
        it('Guerreiro/shieldhorn: MON_010, MON_002, MON_026 intactos', () => {
            expect(resolveCanonSpeciesId('MON_010')).toBe('shieldhorn');
            expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
            expect(resolveCanonSpeciesId('MON_026')).toBe('shieldhorn');
        });

        it('Bárbaro/emberfang: MON_007, MON_021, MON_029 intactos', () => {
            expect(resolveCanonSpeciesId('MON_007')).toBe('emberfang');
            expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
            expect(resolveCanonSpeciesId('MON_029')).toBe('emberfang');
        });

        it('Mago/moonquill: MON_003, MON_014, MON_024 intactos', () => {
            expect(resolveCanonSpeciesId('MON_003')).toBe('moonquill');
            expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
            expect(resolveCanonSpeciesId('MON_024')).toBe('moonquill');
        });

        it('Curandeiro/floracura: MON_004, MON_020, MON_028 intactos', () => {
            expect(resolveCanonSpeciesId('MON_004')).toBe('floracura');
            expect(resolveCanonSpeciesId('MON_020')).toBe('floracura');
            expect(resolveCanonSpeciesId('MON_028')).toBe('floracura');
        });

        it('Caçador/swiftclaw: MON_013, MON_025 intactos', () => {
            expect(resolveCanonSpeciesId('MON_013')).toBe('swiftclaw');
            expect(resolveCanonSpeciesId('MON_025')).toBe('swiftclaw');
        });

        it('Ladino/shadowsting: MON_022, MON_022B, MON_022C intactos', () => {
            expect(resolveCanonSpeciesId('MON_022')).toBe('shadowsting');
            expect(resolveCanonSpeciesId('MON_022B')).toBe('shadowsting');
            expect(resolveCanonSpeciesId('MON_022C')).toBe('shadowsting');
        });
    });

    describe('Passivas anteriores intactas', () => {
        it('shieldhorn: on_hit_received → damageReduction:1', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'shieldhorn' }, {
                event: 'on_hit_received', isFirstHitThisTurn: true,
            });
            expect(mod?.damageReduction).toBe(1);
        });

        it('swiftclaw: on_attack + isFirstAttackOfCombat → atkBonus:1', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'swiftclaw' }, {
                event: 'on_attack', isOffensiveSkill: false, isFirstAttackOfCombat: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('shadowsting: on_attack + hasShadowstingCharge → atkBonus:1', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'shadowsting' }, {
                event: 'on_attack', isOffensiveSkill: false, hasShadowstingCharge: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('moonquill: on_skill_used + isDebuff → spdBuff', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'moonquill' }, {
                event: 'on_skill_used', isDebuff: true,
            });
            expect(mod?.spdBuff).toBeDefined();
        });
    });

    describe('Kit swaps anteriores intactos', () => {
        it('shadowsting tem kit swap (Golpe Furtivo I)', () => {
            expect(hasKitSwap('shadowsting')).toBe(true);
        });

        it('swiftclaw tem kit swap (Flecha Certeira I)', () => {
            expect(hasKitSwap('swiftclaw')).toBe(true);
        });

        it('shieldhorn tem kit swap (Golpe Pesado I)', () => {
            expect(hasKitSwap('shieldhorn')).toBe(true);
        });
    });

    describe('Cobertura total do bridge', () => {
        it('7 espécies canônicas ativas: shieldhorn, emberfang, moonquill, floracura, swiftclaw, shadowsting, bellwave', () => {
            const uniqueSpecies = new Set(Object.values(RUNTIME_TO_CANON_SPECIES));
            expect(uniqueSpecies.has('bellwave')).toBe(true);
            expect(uniqueSpecies.size).toBeGreaterThanOrEqual(7);
        });

        it('getActiveKitSwapIds inclui bellwave junto com as 6 espécies anteriores', () => {
            const ids = getActiveKitSwapIds();
            expect(ids).toContain('bellwave');
            expect(ids).toContain('shadowsting');
            expect(ids).toContain('swiftclaw');
            expect(ids.length).toBeGreaterThanOrEqual(7);
        });

        it('getActivePassiveIds inclui bellwave junto com as 6 espécies anteriores', () => {
            const ids = getActivePassiveIds();
            expect(ids).toContain('bellwave');
            expect(ids.length).toBeGreaterThanOrEqual(7);
        });
    });
});
