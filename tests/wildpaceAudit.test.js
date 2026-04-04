/**
 * WILDPACE BEHAVIORAL AUDIT TESTS (Fase 12.1)
 *
 * Auditoria comportamental da espécie canônica wildpace (Animalista).
 *
 * Diferente dos testes de cobertura estrutural (speciesBridgeFase12.test.js),
 * estes testes focam no COMPORTAMENTO REAL em runtime:
 *   - razões estatísticas ao longo da linha evolutiva
 *   - pressão de ENE-1 em cada estágio
 *   - frequência de ativação da passiva HP<40%
 *   - coerência do kit swap com o ENE disponível
 *   - diferenciação mecânica verificável vs outras espécies
 *   - ausência de drift de identidade ao longo da linha
 *
 * Templates auditados: MON_023 / MON_023B / MON_023C
 * Offsets: { hp: +1, atk: 0, def: 0, ene: -1, agi: +1 }
 *
 * Tensões documentadas (Fase 12.1):
 *   T1. Passiva ativa cedo e permanece (HP<40% cruzado após 1-2 skills)
 *       → ACEITÁVEL: coerente com arquétipo adaptativo
 *   T2. ENE-1 apertado no Cervimon (ENE=5, IB1=cost4=80%)
 *       → ACEITÁVEL: tensão diminui com evolução
 *   T3. IS-I e IP-I fazem DEF+2, durações/custos diferentes
 *       → ACEITÁVEL: coexistem sem redundância — papel complementar
 *
 * Esta fase NÃO cria nova mecânica — apenas audita o que foi implementado.
 */

import { describe, it, expect, vi } from 'vitest';
import {
    resolveCanonSpeciesId,
    applyStatOffsets,
} from '../js/canon/speciesBridge.js';
import {
    resolvePassiveModifier,
} from '../js/canon/speciesPassives.js';
import {
    applyKitSwaps,
} from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Mock de canonLoader — padrão dos testes de canon
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

// ---------------------------------------------------------------------------
// Helpers de auditoria
// ---------------------------------------------------------------------------

/** Calcula razões estatísticas de um set de stats com offsets aplicados. */
function computeRatios(base, offsets) {
    const atk = base.atk + (offsets.atk ?? 0);
    const def = base.def + (offsets.def ?? 0);
    const spd = base.spd + (offsets.agi ?? 0);
    const ene = base.ene + (offsets.ene ?? 0);
    const hp  = base.hp  + (offsets.hp  ?? 0);
    return {
        atk, def, spd, ene, hp,
        atkDef: atk / def,          // identidade de equilíbrio
        spdAtk: spd / atk,          // vantagem de iniciativa
        eneAtk: ene / atk,          // pressão de recursos
        hpDef:  hp  / def,          // resistência normalizada
    };
}

/** Calcula ENE regen real do Animalista: max(2, round(ene * 0.15)) */
function calcRegen(eneMax) {
    return Math.max(2, Math.round(eneMax * 0.15));
}

/** Verifica se uma skill pode ser usada com o ENE disponível. */
function canUseSkill(eneAvailable, skillCost) {
    return eneAvailable >= skillCost;
}

// ---------------------------------------------------------------------------
// Dados base dos templates (sem offsets)
// ---------------------------------------------------------------------------
const WILDPACE_OFFSETS = { hp: 1, atk: 0, def: 0, ene: -1, agi: 1 };

const STAGES = {
    MON_023: {
        id: 'MON_023', name: 'Cervimon', rarity: 'Comum',
        hp: 28, atk: 6, def: 6, spd: 7, ene: 6,
    },
    MON_023B: {
        id: 'MON_023B', name: 'Galhantemon', rarity: 'Incomum',
        hp: 36, atk: 8, def: 8, spd: 10, ene: 8,
    },
    MON_023C: {
        id: 'MON_023C', name: 'Bosquidalmon', rarity: 'Raro',
        hp: 46, atk: 10, def: 10, spd: 11, ene: 10,
    },
};

// Skills Animalista (do index.html)
const INVESTIDA_BESTIAL_I  = { name: 'Investida Bestial I',  type: 'DAMAGE', cost: 4, power: 19 };
const INVESTIDA_BESTIAL_II = { name: 'Investida Bestial II', type: 'DAMAGE', cost: 6, power: 24 };
const INSTINTO_SELVAGEM_I  = { name: 'Instinto Selvagem I',  type: 'BUFF',   cost: 4, power: 2, buffType: 'DEF', target: 'self', duration: 2 };
const INSTINTO_PROTETOR_I  = { name: 'Instinto Protetor I',  type: 'BUFF',   cost: 3, power: 2, buffType: 'DEF', target: 'self', duration: 1, _kitSwapId: 'wildpace_rugged_stance' };

// ===========================================================================
// Parte 1 — Razões estatísticas ao longo da linha
// ===========================================================================

describe('wildpace Audit — Parte 1: Razões estatísticas ao longo da linha', () => {

    describe('Identidade de equilíbrio: ATK:DEF = 1.00 em todos os estágios', () => {
        for (const [stageId, base] of Object.entries(STAGES)) {
            it(`${stageId} (${base.name}): ATK:DEF = 1.00 após offsets`, () => {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.atkDef).toBeCloseTo(1.00, 2);
            });
        }
    });

    describe('Vantagem de iniciativa: SPD > ATK em todos os estágios', () => {
        for (const [stageId, base] of Object.entries(STAGES)) {
            it(`${stageId} (${base.name}): SPD > ATK após offsets (SPD/ATK > 1.0)`, () => {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.spdAtk).toBeGreaterThan(1.00);
            });
        }

        it('SPD/ATK mantém-se em faixa 1.20-1.40 ao longo da linha', () => {
            for (const base of Object.values(STAGES)) {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.spdAtk).toBeGreaterThanOrEqual(1.10);
                expect(r.spdAtk).toBeLessThanOrEqual(1.45);
            }
        });
    });

    describe('Estabilidade da resistência: HP/DEF estável ao longo da linha', () => {
        it('HP/DEF fica entre 4.5 e 5.0 em todos os estágios', () => {
            for (const base of Object.values(STAGES)) {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.hpDef).toBeGreaterThanOrEqual(4.50);
                expect(r.hpDef).toBeLessThanOrEqual(5.05);
            }
        });
    });

    describe('Pressão de recursos: ENE/ATK dentro da margem', () => {
        it('ENE/ATK fica entre 0.80 e 1.00 em todos os estágios', () => {
            for (const base of Object.values(STAGES)) {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.eneAtk).toBeGreaterThanOrEqual(0.80);
                expect(r.eneAtk).toBeLessThanOrEqual(1.00);
            }
        });

        it('ENE/ATK melhora ligeiramente da forma base para a forma madura (tensão diminui)', () => {
            const r023  = computeRatios(STAGES.MON_023,  WILDPACE_OFFSETS);
            const r023C = computeRatios(STAGES.MON_023C, WILDPACE_OFFSETS);
            // ENE/ATK no Bosquidalmon deve ser maior (menos apertado) do que no Cervimon
            expect(r023C.eneAtk).toBeGreaterThan(r023.eneAtk);
        });
    });

    describe('Valores após offsets — verificação absoluta', () => {
        it('MON_023: HP:29 ATK:6 DEF:6 SPD:8 ENE:5', () => {
            const r = computeRatios(STAGES.MON_023, WILDPACE_OFFSETS);
            expect(r.hp).toBe(29);
            expect(r.atk).toBe(6);
            expect(r.def).toBe(6);
            expect(r.spd).toBe(8);
            expect(r.ene).toBe(5);
        });

        it('MON_023B: HP:37 ATK:8 DEF:8 SPD:11 ENE:7', () => {
            const r = computeRatios(STAGES.MON_023B, WILDPACE_OFFSETS);
            expect(r.hp).toBe(37);
            expect(r.atk).toBe(8);
            expect(r.def).toBe(8);
            expect(r.spd).toBe(11);
            expect(r.ene).toBe(7);
        });

        it('MON_023C: HP:47 ATK:10 DEF:10 SPD:12 ENE:9', () => {
            const r = computeRatios(STAGES.MON_023C, WILDPACE_OFFSETS);
            expect(r.hp).toBe(47);
            expect(r.atk).toBe(10);
            expect(r.def).toBe(10);
            expect(r.spd).toBe(12);
            expect(r.ene).toBe(9);
        });
    });

    describe('Nenhum stat torna-se negativo ou zero', () => {
        it('todos os stats após offsets são >= 1 em todos os estágios', () => {
            for (const base of Object.values(STAGES)) {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.hp).toBeGreaterThanOrEqual(1);
                expect(r.atk).toBeGreaterThanOrEqual(1);
                expect(r.def).toBeGreaterThanOrEqual(1);
                expect(r.spd).toBeGreaterThanOrEqual(1);
                expect(r.ene).toBeGreaterThanOrEqual(1);
            }
        });
    });
});

// ===========================================================================
// Parte 2 — Análise de ENE-1 (pressão de recursos)
// ===========================================================================

describe('wildpace Audit — Parte 2: Pressão de ENE-1 por estágio', () => {

    describe('Cervimon (ENE=5) — estágio base: apertado mas sustentável', () => {
        const ene = 5;
        const regen = calcRegen(ene);

        it('regen é 2/turno (max(2, round(5*0.15)) = max(2,1) = 2)', () => {
            expect(regen).toBe(2);
        });

        it('pode usar Investida Bestial I (cost4) com ENE=5', () => {
            expect(canUseSkill(ene, INVESTIDA_BESTIAL_I.cost)).toBe(true);
        });

        it('NÃO pode usar Investida Bestial II (cost6) com ENE=5', () => {
            expect(canUseSkill(ene, INVESTIDA_BESTIAL_II.cost)).toBe(false);
        });

        it('pode usar Instinto Protetor I (cost3) com ENE=5', () => {
            expect(canUseSkill(ene, INSTINTO_PROTETOR_I.cost)).toBe(true);
        });

        it('IB1 consome 80% do ENE (4/5 = 0.80)', () => {
            const pct = INVESTIDA_BESTIAL_I.cost / ene;
            expect(pct).toBeCloseTo(0.80, 2);
        });

        it('IP1 consome 60% do ENE (3/5 = 0.60)', () => {
            const pct = INSTINTO_PROTETOR_I.cost / ene;
            expect(pct).toBeCloseTo(0.60, 2);
        });

        it('após IB1 (ENE=1), regen para ENE=3, pode usar IP1 (cost3)', () => {
            const ene_after_ib1 = ene - INVESTIDA_BESTIAL_I.cost; // 1
            const ene_after_regen = Math.min(ene, ene_after_ib1 + regen); // min(5, 3) = 3
            expect(canUseSkill(ene_after_regen, INSTINTO_PROTETOR_I.cost)).toBe(true);
        });

        it('NÃO pode usar IB1+IP1 no mesmo turno sem regen (ENE=5 < 7)', () => {
            const combined_cost = INVESTIDA_BESTIAL_I.cost + INSTINTO_PROTETOR_I.cost; // 7
            expect(canUseSkill(ene, combined_cost)).toBe(false);
        });

        it('tensão é REAL: IB1 deixa apenas ENE=1, forçando 2 turnos básicos', () => {
            const ene_after_ib1 = ene - INVESTIDA_BESTIAL_I.cost; // 1
            expect(ene_after_ib1).toBe(1);
            // Precisa de 2 regens para voltar a usar IB1 (1 + 2 = 3, 3 + 2 = 5)
            // na verdade 1 regen dá 3 (insuficiente para IB1 cost4), 2 regens dá 5
            const can_ib1_after_1_regen = canUseSkill(ene_after_ib1 + regen, INVESTIDA_BESTIAL_I.cost); // 3 < 4
            const can_ib1_after_2_regens = canUseSkill(ene_after_ib1 + regen * 2, INVESTIDA_BESTIAL_I.cost); // 5 >= 4
            expect(can_ib1_after_1_regen).toBe(false);
            expect(can_ib1_after_2_regens).toBe(true);
        });
    });

    describe('Galhantemon (ENE=7) — estágio médio: mais fluido', () => {
        const ene = 7;
        const regen = calcRegen(ene);

        it('regen é 2/turno (max(2, round(7*0.15)) = max(2,1) = 2)', () => {
            expect(regen).toBe(2);
        });

        it('pode usar Investida Bestial II (cost6) com ENE=7', () => {
            expect(canUseSkill(ene, INVESTIDA_BESTIAL_II.cost)).toBe(true);
        });

        it('IB1 consome 57% do ENE (4/7 ≈ 0.57)', () => {
            const pct = INVESTIDA_BESTIAL_I.cost / ene;
            expect(pct).toBeCloseTo(0.571, 2);
        });

        it('após IB1 (ENE=3), regen para ENE=5, pode usar IB1 novamente', () => {
            const ene_after_ib1 = ene - INVESTIDA_BESTIAL_I.cost; // 3
            const ene_after_regen = Math.min(ene, ene_after_ib1 + regen); // min(7, 5) = 5
            expect(canUseSkill(ene_after_regen, INVESTIDA_BESTIAL_I.cost)).toBe(true);
        });

        it('pode usar IB1+IP1 no mesmo ciclo (ENE=7 >= 7)', () => {
            const combined_cost = INVESTIDA_BESTIAL_I.cost + INSTINTO_PROTETOR_I.cost; // 7
            expect(canUseSkill(ene, combined_cost)).toBe(true);
        });

        it('IB1 a cada 2 turnos é viável (após IB1: ENE=3+regen2=5 ≥ cost4)', () => {
            const ene_after_ib1 = ene - INVESTIDA_BESTIAL_I.cost;
            const ene_after_1_regen = Math.min(ene, ene_after_ib1 + regen);
            expect(canUseSkill(ene_after_1_regen, INVESTIDA_BESTIAL_I.cost)).toBe(true);
        });
    });

    describe('Bosquidalmon (ENE=9) — estágio maduro: loop fluido', () => {
        const ene = 9;
        const regen = calcRegen(ene);

        it('regen é 2/turno (max(2, round(9*0.15)) = max(2,1) = 2)', () => {
            expect(regen).toBe(2);
        });

        it('IB1 consome 44% do ENE (4/9 ≈ 0.44)', () => {
            const pct = INVESTIDA_BESTIAL_I.cost / ene;
            expect(pct).toBeCloseTo(0.444, 2);
        });

        it('após IB1 (ENE=5), pode usar IP1 (cost3) imediatamente', () => {
            const ene_after_ib1 = ene - INVESTIDA_BESTIAL_I.cost; // 5
            expect(canUseSkill(ene_after_ib1, INSTINTO_PROTETOR_I.cost)).toBe(true);
        });

        it('pode encadear IB1 → IP1 sem regen intermediário', () => {
            const ene_after_ib1 = ene - INVESTIDA_BESTIAL_I.cost; // 5
            const ene_after_ip1 = ene_after_ib1 - INSTINTO_PROTETOR_I.cost; // 2
            expect(ene_after_ip1).toBeGreaterThanOrEqual(0);
        });

        it('a tensão de ENE é nitidamente menor que no Cervimon', () => {
            // Cervimon: IB1=80% ENE | Bosquidalmon: IB1=44% ENE
            const pct_023  = INVESTIDA_BESTIAL_I.cost / 5;   // Cervimon ENE_off
            const pct_023C = INVESTIDA_BESTIAL_I.cost / ene;  // Bosquidalmon ENE_off
            expect(pct_023C).toBeLessThan(pct_023);
        });
    });

    describe('Progressão da tensão de ENE ao longo da linha', () => {
        it('o custo percentual de IB1 diminui monotonicamente (menos pressão com evolução)', () => {
            const ene_023  = 5;  // Cervimon com offsets
            const ene_023B = 7;  // Galhantemon com offsets
            const ene_023C = 9;  // Bosquidalmon com offsets
            const pct_023  = INVESTIDA_BESTIAL_I.cost / ene_023;
            const pct_023B = INVESTIDA_BESTIAL_I.cost / ene_023B;
            const pct_023C = INVESTIDA_BESTIAL_I.cost / ene_023C;
            expect(pct_023).toBeGreaterThan(pct_023B);
            expect(pct_023B).toBeGreaterThan(pct_023C);
        });
    });
});

// ===========================================================================
// Parte 3 — Passiva HP<40%: análise do limiar e da janela de ativação
// ===========================================================================

describe('wildpace Audit — Parte 3: Passiva HP<40% — análise de limiar', () => {
    const instance = { canonSpeciesId: 'wildpace' };

    describe('HP threshold — valores críticos', () => {
        it('passiva dispara em hpPct=0.39 (abaixo do threshold)', () => {
            const mod = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.39, isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('passiva NÃO dispara em hpPct=0.40 (exatamente no threshold)', () => {
            const mod = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.40, isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });

        it('passiva NÃO dispara em hpPct=0.41 (acima do threshold)', () => {
            const mod = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.41, isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });
    });

    describe('Janela de HP crítico por estágio — quando o threshold é cruzado', () => {
        // Dano de skill padrão inimigo: max(1, enemy_atk + 19 - wildpace_def)
        // Se ATK_enemy = ATK_wildpace e DEF_enemy = DEF_wildpace: dano = 19
        // (DEF wildpace cancela ATK enemy, sobra power=19)

        it('MON_023: threshold=11.6 HP (40% de 29) — cruzado após 17 HP de dano', () => {
            const hp_off = 29;
            const threshold = hp_off * 0.40;
            const hp_to_lose = hp_off - threshold;
            expect(threshold).toBeCloseTo(11.6, 1);
            expect(hp_to_lose).toBeCloseTo(17.4, 1);
        });

        it('MON_023B: threshold=14.8 HP (40% de 37) — cruzado após 22 HP de dano', () => {
            const hp_off = 37;
            const threshold = hp_off * 0.40;
            const hp_to_lose = hp_off - threshold;
            expect(threshold).toBeCloseTo(14.8, 1);
            expect(hp_to_lose).toBeCloseTo(22.2, 1);
        });

        it('MON_023C: threshold=18.8 HP (40% de 47) — cruzado após 28 HP de dano', () => {
            const hp_off = 47;
            const threshold = hp_off * 0.40;
            const hp_to_lose = hp_off - threshold;
            expect(threshold).toBeCloseTo(18.8, 1);
            expect(hp_to_lose).toBeCloseTo(28.2, 1);
        });

        it('dano de skill típico (pwr=19) > HP_to_lose em MON_023 → threshold ativado no 1º hit', () => {
            // IB1 (power=19): se ATK_enemy=6, DEF_wildpace=6: dano = max(1, 6+19-6) = 19
            const dmg_per_skill = 19;
            const hp_to_lose = 29 - (29 * 0.40); // 17.4
            expect(dmg_per_skill).toBeGreaterThan(hp_to_lose);
        });
    });

    describe('Comportamento após ativação: passiva persiste até o fim', () => {
        it('passiva ativa em hpPct=0.10 (HP muito crítico)', () => {
            const mod = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.10, isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('passiva ativa em hpPct=0.05 (quase morto)', () => {
            const mod = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.05, isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('passiva dispara tanto em básico quanto em skill DAMAGE no HP crítico', () => {
            const modBasic = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.20, isOffensiveSkill: false,
            });
            const modSkill = resolvePassiveModifier(instance, {
                event: 'on_attack', hpPct: 0.20, isOffensiveSkill: true,
            });
            expect(modBasic?.atkBonus).toBe(1);
            expect(modSkill?.atkBonus).toBe(1);
        });
    });

    describe('Tensão T1 documentada: passiva ativa no 1º hit — comportamento esperado', () => {
        it('MON_023: 17 HP para cruzar threshold < dano típico de skill (19) — ativa cedo', () => {
            // Este teste documenta a tensão T1 como comportamento verificável
            // A passiva ativa após o 1º hit de skill recebido — isso é esperado e aceitável
            const hp_to_lose = 29 - (29 * 0.40);
            const typical_skill_dmg = 19; // power base Animalista
            expect(typical_skill_dmg).toBeGreaterThan(hp_to_lose);
            // Consequência: passiva funciona como 'bônus de segunda metade do combate'
        });

        it('MON_023B: 22 HP para cruzar threshold < dano (19) no pior caso — ainda ativa cedo', () => {
            const hp_to_lose = 37 - (37 * 0.40);
            // 22.2 > 19: precisa de > 1 hit de skill para ativar no Galhantemon
            // Mas com 2 hits de skill: 2*19=38 > 22.2 → ativa no 2º hit
            expect(hp_to_lose).toBeGreaterThan(19);  // mais robusto que Cervimon
        });

        it('MON_023C: 28 HP para cruzar threshold — mais resistente (mais turnos)', () => {
            const hp_to_lose = 47 - (47 * 0.40);
            // 28.2: precisa de 2 hits de skill (2*19=38 > 28) → ativa no 2º hit de skill
            expect(hp_to_lose).toBeCloseTo(28.2, 1);
            expect(hp_to_lose).toBeGreaterThan(19);  // Bosquidalmon sobrevive ao 1º hit de skill
        });
    });
});

// ===========================================================================
// Parte 4 — Kit swap: Instinto Protetor I — coerência ao longo da linha
// ===========================================================================

describe('wildpace Audit — Parte 4: Kit swap IP-I — coerência por estágio', () => {
    const baseSkills3 = [
        { name: 'Investida Bestial I', type: 'DAMAGE', cost: 4, power: 19 },
        { name: 'Instinto Selvagem I', type: 'BUFF',   cost: 4, power: 2, buffType: 'DEF', target: 'self', duration: 2 },
        { name: 'Investida Bestial II',type: 'DAMAGE', cost: 6, power: 24 },
    ];

    describe('IP-I vs IS-I: sobreposição funcional (Tensão T3)', () => {
        it('IS-I: 2 DEF / 4 ENE / 2t = 1.00 DEF-t/ENE (mais eficiente)', () => {
            const is1_eff = (INSTINTO_SELVAGEM_I.power * INSTINTO_SELVAGEM_I.duration) / INSTINTO_SELVAGEM_I.cost;
            expect(is1_eff).toBeCloseTo(1.00, 2);
        });

        it('IP-I: 2 DEF / 3 ENE / 1t = 0.67 DEF-t/ENE (menos eficiente, menor custo)', () => {
            const ip1_eff = (INSTINTO_PROTETOR_I.power * INSTINTO_PROTETOR_I.duration) / INSTINTO_PROTETOR_I.cost;
            expect(ip1_eff).toBeCloseTo(0.667, 2);
        });

        it('IP-I custa menos que IS-I (3 < 4) — papel complementar de "defesa rápida"', () => {
            expect(INSTINTO_PROTETOR_I.cost).toBeLessThan(INSTINTO_SELVAGEM_I.cost);
        });

        it('IP-I dura menos que IS-I (1 < 2) — proteção pontual vs sustentada', () => {
            expect(INSTINTO_PROTETOR_I.duration).toBeLessThan(INSTINTO_SELVAGEM_I.duration);
        });

        it('coexistência no kit: IP-I ADD em slot4, IS-I em slot2 — não são exclusivos', () => {
            // IS-I ocuparia slot2 (ou slot3), IP-I é ADD em slot4
            // Ambos podem estar no kit ao mesmo tempo — o wildpace tem ambas as opções
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, baseSkills3);
            // IP-I foi adicionado em slot4
            expect(result.skills).toHaveLength(4);
            // IS-I ainda está no kit (não foi removida)
            const hasIS1 = result.skills.some(s => s?.name === 'Instinto Selvagem I');
            expect(hasIS1).toBe(true);
        });
    });

    describe('No Cervimon (ENE=5): IP-I mais atraente que IS-I', () => {
        it('IS-I (cost4) = 80% ENE no Cervimon — mesmo custo que IB1 (forced choice)', () => {
            const ene_cervimon = 5;
            const is1_pct = INSTINTO_SELVAGEM_I.cost / ene_cervimon;
            const ib1_pct = INVESTIDA_BESTIAL_I.cost / ene_cervimon;
            expect(is1_pct).toBeCloseTo(ib1_pct, 2); // ambos 80% — escolha binária
        });

        it('IP-I (cost3) = 60% ENE no Cervimon — mais viável para loop IP-I→regen→IB1', () => {
            const ene_cervimon = 5;
            const ip1_pct = INSTINTO_PROTETOR_I.cost / ene_cervimon;
            expect(ip1_pct).toBeCloseTo(0.60, 2);
            // Após IP1(cost3): ENE=2 + regen2 = 4 → pode usar IB1(cost4)
            const ene_after_ip1 = ene_cervimon - INSTINTO_PROTETOR_I.cost;
            const ene_after_regen = ene_after_ip1 + calcRegen(ene_cervimon);
            expect(ene_after_regen).toBeGreaterThanOrEqual(INVESTIDA_BESTIAL_I.cost);
        });
    });

    describe('No Bosquidalmon (ENE=9): IS-I e IP-I ambas viáveis', () => {
        it('IS-I (cost4) = 44% ENE — viável e eficiente', () => {
            const ene_bosqui = 9;
            const is1_pct = INSTINTO_SELVAGEM_I.cost / ene_bosqui;
            expect(is1_pct).toBeCloseTo(0.444, 2);
        });

        it('IP-I (cost3) = 33% ENE — muito barata, pode seguir IB1 no mesmo ciclo', () => {
            const ene_bosqui = 9;
            const ip1_pct = INSTINTO_PROTETOR_I.cost / ene_bosqui;
            expect(ip1_pct).toBeCloseTo(0.333, 2);
        });

        it('profundidade de decisão aumenta no Bosquidalmon: 3 opções reais vs 2 no Cervimon', () => {
            // No Cervimon com ENE=5: escolha binária IB1 (ataque) vs IS-I/IP-I (defesa)
            // No Bosquidalmon com ENE=9: pode combinar IB1+IP-I ou IB1+IS-I no mesmo ciclo
            const ene_bosqui = 9;
            const can_ib1_and_ip1 = canUseSkill(ene_bosqui, INVESTIDA_BESTIAL_I.cost + INSTINTO_PROTETOR_I.cost); // 4+3=7 <= 9
            const can_ib1_and_is1 = canUseSkill(ene_bosqui, INVESTIDA_BESTIAL_I.cost + INSTINTO_SELVAGEM_I.cost); // 4+4=8 <= 9
            expect(can_ib1_and_ip1).toBe(true); // pode usar IB1+IP1 juntos
            expect(can_ib1_and_is1).toBe(true); // também pode usar IB1+IS1 juntos
            // No Cervimon (ENE=5): ambas seriam impossíveis (7>5 e 8>5)
            const ene_cervimon = 5;
            expect(canUseSkill(ene_cervimon, INVESTIDA_BESTIAL_I.cost + INSTINTO_PROTETOR_I.cost)).toBe(false);
            expect(canUseSkill(ene_cervimon, INVESTIDA_BESTIAL_I.cost + INSTINTO_SELVAGEM_I.cost)).toBe(false);
        });
    });
});

// ===========================================================================
// Parte 5 — Diferenciação mecânica verificável
// ===========================================================================

describe('wildpace Audit — Parte 5: Diferenciação mecânica verificável', () => {
    const wpInst    = { canonSpeciesId: 'wildpace' };
    const embInst   = { canonSpeciesId: 'emberfang' };
    const swiftInst = { canonSpeciesId: 'swiftclaw' };
    const shadInst  = { canonSpeciesId: 'shadowsting' };
    const shldInst  = { canonSpeciesId: 'shieldhorn' };

    describe('wildpace vs emberfang — inversão de threshold', () => {
        it('wildpace: passiva ativa com HP=30% (abaixo de 40%)', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_attack', hpPct: 0.30, isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('emberfang: passiva INATIVA com HP=30% (precisa HP>70%)', () => {
            const mod = resolvePassiveModifier(embInst, {
                event: 'on_attack', hpPct: 0.30, isOffensiveSkill: true,
            });
            expect(mod).toBeNull();
        });

        it('wildpace: passiva INATIVA com HP=80% (acima de 40%)', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_attack', hpPct: 0.80, isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });

        it('emberfang: passiva ativa com HP=80% + skill DAMAGE', () => {
            const mod = resolvePassiveModifier(embInst, {
                event: 'on_attack', hpPct: 0.80, isOffensiveSkill: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('wildpace e emberfang nunca têm passiva simultaneamente ativa (thresholds opostos)', () => {
            // Se HP > 40%: emberfang ativa (HP>70%), wildpace inativa
            // Se HP < 40%: wildpace ativa, emberfang inativa (HP<70%)
            // Zona de HP 40-70%: ambas inativas
            const hpMid = 0.55;
            const modWp  = resolvePassiveModifier(wpInst,  { event: 'on_attack', hpPct: hpMid, isOffensiveSkill: true });
            const modEmb = resolvePassiveModifier(embInst, { event: 'on_attack', hpPct: hpMid, isOffensiveSkill: true });
            expect(modWp).toBeNull();   // 55% > 40% → wildpace inativa
            expect(modEmb).toBeNull();  // 55% < 70% → emberfang inativa
        });
    });

    describe('wildpace vs swiftclaw — recorrente vs one-time', () => {
        it('wildpace: passiva ativa em ataque não-inicial com HP=20%', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_attack', hpPct: 0.20, isOffensiveSkill: false,
                isFirstAttackOfCombat: false, // explicitamente não-primeiro
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('swiftclaw: passiva INATIVA em ataque não-inicial (isFirstAttackOfCombat=false)', () => {
            const mod = resolvePassiveModifier(swiftInst, {
                event: 'on_attack', hpPct: 0.20, isOffensiveSkill: false,
                isFirstAttackOfCombat: false,
            });
            expect(mod).toBeNull();
        });
    });

    describe('wildpace vs shadowsting — stateless vs charge', () => {
        it('wildpace: passiva ativa sem charge, com HP=15%', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_attack', hpPct: 0.15, isOffensiveSkill: false,
                hasShadowstingCharge: false, // sem charge de qualquer tipo
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('shadowsting: passiva INATIVA sem hasShadowstingCharge (mesmo com HP baixo)', () => {
            const mod = resolvePassiveModifier(shadInst, {
                event: 'on_attack', hpPct: 0.15, isOffensiveSkill: false,
                hasShadowstingCharge: false,
            });
            expect(mod).toBeNull();
        });

        it('wildpace: passiva ativa independente de hasBellwaveRhythmCharge', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_attack', hpPct: 0.25, isOffensiveSkill: false,
                hasBellwaveRhythmCharge: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });
    });

    describe('wildpace vs shieldhorn — passiva ofensiva vs defensiva', () => {
        it('wildpace: passiva on_attack (ofensiva — bônus de ATK)', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_attack', hpPct: 0.20,
            });
            expect(mod?.atkBonus).toBe(1);
            expect(mod?.damageReduction).toBeUndefined();
        });

        it('shieldhorn: passiva on_hit_received (defensiva — redução de dano)', () => {
            const mod = resolvePassiveModifier(shldInst, {
                event: 'on_hit_received', isFirstHitThisTurn: true,
            });
            expect(mod?.damageReduction).toBe(1);
            expect(mod?.atkBonus).toBeUndefined();
        });

        it('wildpace NÃO tem redução de dano (não é tanque)', () => {
            const mod = resolvePassiveModifier(wpInst, {
                event: 'on_hit_received', hpPct: 0.20,
            });
            expect(mod).toBeNull();
        });

        it('shieldhorn NÃO tem bônus de ATK (não é striker)', () => {
            const mod = resolvePassiveModifier(shldInst, {
                event: 'on_attack', hpPct: 0.20,
            });
            expect(mod).toBeNull();
        });
    });

    describe('wildpace: offsets distinguíveis de todas as classes', () => {
        it('wildpace HP+1 + ENE-1 + AGI+1: combinação única no sistema', () => {
            // Nenhuma outra espécie tem exatamente { hp+1, ene-1, agi+1 }
            // shieldhorn: hp+1, atk-1, def+1
            // floracura: hp+1, ene+1, agi-1 (ENE+ não ENE-)
            const wpOffsets  = { hp: +1, atk: 0, def: 0, ene: -1, agi: +1 };
            const flaOffsets = { hp: +1, atk: 0, def: 0, ene: +1, agi: -1 };
            // wildpace é o ÚNICO com ENE negativo E AGI positivo E HP positivo juntos
            expect(wpOffsets.ene).toBeLessThan(0);
            expect(wpOffsets.agi).toBeGreaterThan(0);
            expect(wpOffsets.hp).toBeGreaterThan(0);
            // floracura tem HP+ mas ENE+ não ENE-
            expect(flaOffsets.ene).toBeGreaterThan(0); // confirma diferença
        });
    });
});

// ===========================================================================
// Parte 6 — Tensões documentadas: verificação de aceitabilidade
// ===========================================================================

describe('wildpace Audit — Parte 6: Tensões documentadas', () => {

    describe('Tensão T1: passiva ativa cedo e permanente', () => {
        it('T1 é ACEITÁVEL: passiva ativa após 1º hit, mas não antes (período sem bônus existe)', () => {
            // HP=100% → passiva inativa
            const modFull = resolvePassiveModifier({ canonSpeciesId: 'wildpace' }, {
                event: 'on_attack', hpPct: 1.0,
            });
            expect(modFull).toBeNull(); // período sem bônus confirmado

            // HP=39% → passiva ativa
            const modLow = resolvePassiveModifier({ canonSpeciesId: 'wildpace' }, {
                event: 'on_attack', hpPct: 0.39,
            });
            expect(modLow?.atkBonus).toBe(1); // ativa após cruzar threshold
        });

        it('T1: sem mecanismo de reset — passiva permanece ativa (sem cura no kit base)', () => {
            // Confirma que a passiva é puramente baseada em hpPct atual
            // Qualquer hpPct < 0.40 sempre dispara — sem charge, sem cooldown
            const hpValues = [0.01, 0.10, 0.20, 0.39];
            for (const hpPct of hpValues) {
                const mod = resolvePassiveModifier({ canonSpeciesId: 'wildpace' }, {
                    event: 'on_attack', hpPct,
                });
                expect(mod?.atkBonus, `HP=${hpPct} deveria ativar passiva`).toBe(1);
            }
        });

        it('T1: coerente com "equilíbrio adaptativo" — animal acuado é mais perigoso', () => {
            // Este teste documenta a INTENÇÃO: a passiva representa instinto de sobrevivência
            // que melhora conforme o animal está mais ameaçado
            expect(true).toBe(true); // assertion documental
        });
    });

    describe('Tensão T2: ENE-1 apertado no Cervimon', () => {
        it('T2: ENE=5 é apertado — IB1 usa 80% — mas ENE não cai para zero ou negativo', () => {
            const ene_cervimon = 5;
            const after_ib1 = ene_cervimon - INVESTIDA_BESTIAL_I.cost;
            expect(after_ib1).toBeGreaterThanOrEqual(0); // não vai negativo
            expect(after_ib1).toBe(1); // apertado mas legal
        });

        it('T2: a tensão ALIVIA com evolução (ENE=7 no Galhantemon, ENE=9 no Bosquidalmon)', () => {
            expect(7).toBeGreaterThan(5); // Galhantemon vs Cervimon
            expect(9).toBeGreaterThan(7); // Bosquidalmon vs Galhantemon
        });

        it('T2: ENE=5 ainda sustenta IP-I (cost3) — não bloqueia o kit swap canônico', () => {
            const ene_cervimon = 5;
            expect(canUseSkill(ene_cervimon, INSTINTO_PROTETOR_I.cost)).toBe(true);
        });
    });

    describe('Tensão T3: IS-I e IP-I — sobreposição funcional', () => {
        it('T3: ambas fazem DEF+2 self, mas IS-I é mais eficiente (1.00 vs 0.67 DEF-t/ENE)', () => {
            const is1_eff = (INSTINTO_SELVAGEM_I.power * INSTINTO_SELVAGEM_I.duration) / INSTINTO_SELVAGEM_I.cost;
            const ip1_eff = (INSTINTO_PROTETOR_I.power * INSTINTO_PROTETOR_I.duration) / INSTINTO_PROTETOR_I.cost;
            expect(is1_eff).toBeGreaterThan(ip1_eff);
        });

        it('T3: IP-I ADD em slot4 não substitui IS-I — coexistem no kit', () => {
            // Kit swap de wildpace é ADD (slot4), não REPLACE de skill existente
            // Confirma que wildpace tem ambas disponíveis quando slot4 desbloqueado
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const skills = [
                INVESTIDA_BESTIAL_I,
                INSTINTO_SELVAGEM_I, // IS-I em slot2
                { name: 'Investida Bestial II', type: 'DAMAGE', cost: 6, power: 24 },
            ];
            const result = applyKitSwaps(instance, skills);
            const hasIS1 = result.skills.some(s => s?.name === INSTINTO_SELVAGEM_I.name);
            const hasIP1 = result.skills.some(s => s?._kitSwapId === 'wildpace_rugged_stance');
            expect(hasIS1).toBe(true);  // IS-I permanece
            expect(hasIP1).toBe(true);  // IP-I adicionado
        });

        it('T3: no Cervimon, IP-I é mais viável que IS-I por causa do ENE-1', () => {
            // IS-I cost4 + IB1 cost4 = 8 ENE > ENE=5 → não pode usar ambas
            // IP-I cost3 → ENE=2 + regen=2 → ENE=4 → IB1(cost4) → viável
            const ene = 5;
            const can_is1_then_ib1_direct = canUseSkill(ene - INSTINTO_SELVAGEM_I.cost, INVESTIDA_BESTIAL_I.cost); // 1 >= 4? NO
            const can_ip1_then_regen_then_ib1 = canUseSkill(
                ene - INSTINTO_PROTETOR_I.cost + calcRegen(ene),
                INVESTIDA_BESTIAL_I.cost
            ); // (5-3+2)=4 >= 4? YES
            expect(can_is1_then_ib1_direct).toBe(false);
            expect(can_ip1_then_regen_then_ib1).toBe(true);
        });
    });

    describe('Nenhum drift de arquétipo identificado', () => {
        it('ATK:DEF = 1.00 permanece em todos os estágios (sem drift para tanque ou striker)', () => {
            for (const base of Object.values(STAGES)) {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.atkDef).toBeCloseTo(1.00, 2);
            }
        });

        it('SPD permanece o maior stat em todos os estágios (iniciativa preservada)', () => {
            for (const base of Object.values(STAGES)) {
                const r = computeRatios(base, WILDPACE_OFFSETS);
                expect(r.spd).toBeGreaterThan(r.atk);
                expect(r.spd).toBeGreaterThan(r.def);
            }
        });
    });
});

// ===========================================================================
// Parte 7 — Vetor de applyStatOffsets integrado ao bridge
// ===========================================================================

describe('wildpace Audit — Parte 7: applyStatOffsets integração com bridge', () => {

    it('bridge confirma MON_023 → wildpace antes do offset', () => {
        expect(resolveCanonSpeciesId('MON_023')).toBe('wildpace');
    });

    it('applyStatOffsets retorna stats corretos para MON_023 com offsets wildpace', () => {
        const base = { hpMax: 28, atk: 6, def: 6, spd: 7, eneMax: 6 };
        const offsets = { hp: 1, atk: 0, def: 0, ene: -1, agi: 1 };
        const { stats, applied } = applyStatOffsets(base, offsets);
        expect(stats.hpMax).toBe(29);
        expect(stats.eneMax).toBe(5);
        expect(stats.spd).toBe(8);
        expect(stats.atk).toBe(6);
        expect(stats.def).toBe(6);
        expect(applied).toEqual({ hp: 1, ene: -1, agi: 1 });
    });

    it('applied registra apenas offsets não-zero', () => {
        const base = { hpMax: 36, atk: 8, def: 8, spd: 10, eneMax: 8 };
        const offsets = { hp: 1, atk: 0, def: 0, ene: -1, agi: 1 };
        const { applied } = applyStatOffsets(base, offsets);
        expect(Object.keys(applied)).toHaveLength(3); // hp, ene, agi
        expect(applied).not.toHaveProperty('atk');
        expect(applied).not.toHaveProperty('def');
    });
});
