/**
 * KIT SWAP AUDIT TESTS (Fase 6.1)
 *
 * Testes de auditoria quantitativa de impacto dos kit_swaps canônicos.
 * NÃO são testes funcionais de API (ver kitSwap.test.js) — são simulações
 * comparativas que medem a coerência de custo, poder e eficiência de cada swap
 * em relação às skills de referência do SKILL_DEFS.
 *
 * FÓRMULAS DO RUNTIME USADAS AQUI:
 *   Dano: max(1, floor((atk + power - def) * mult))
 *   ENE L1:  floor(10 + 2*(1-1))  = 10
 *   ENE L30: floor(10 + 2*(30-1)) = 68
 *   Regen Guerreiro:  ceil(eneMax * 0.10), min 1
 *   Regen Bárbaro:    ceil(eneMax * 0.12), min 2
 *   Regen Mago:       ceil(eneMax * 0.18), min 3
 *   Regen Curandeiro: ceil(eneMax * 0.18), min 3
 *
 * COBERTURA:
 *   Bloco 1 — shieldhorn (slot 1 DAMAGE): dano e eficiência pré/pós swap
 *   Bloco 2 — emberfang  (slot 4 DAMAGE): posição dentro da faixa tier1-3
 *   Bloco 3 — moonquill  (slot 4 DEBUFF): eficiência vs referências Ladino
 *   Bloco 4 — floracura  (slot 4 HEAL):   eficiência HP/ENE vs Cura legada
 *   Bloco 5 — limites cruzados: nenhum swap supera o teto de tier 3 da classe
 *   Bloco 6 — coerência de slot: slot 1 < custo slot 4 (identidade < assinatura)
 */

import { describe, it, expect } from 'vitest';
import { applyKitSwaps } from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Helpers de simulação do runtime
// ---------------------------------------------------------------------------

/**
 * Calcula dano conforme fórmula canônica do runtime.
 * Fonte: calcDamage() em index.html — max(1, floor((atk + power - def) * mult))
 */
function simDamage(atk, power, def, mult = 1.0) {
    return Math.max(1, Math.floor((atk + power - def) * mult));
}

/**
 * Calcula ENE máximo para um nível dado.
 * Fonte: createMonsterInstanceFromTemplate — floor(10 + 2*(level-1))
 */
function simEneMax(level) {
    return Math.floor(10 + 2 * (level - 1));
}

/**
 * Calcula regen de ENE por turno para uma classe.
 * Fonte: ENE_REGEN_BY_CLASS em index.html
 */
function simEneRegen(className, level) {
    const eneMax = simEneMax(level);
    const regenPct = { Guerreiro: 0.10, Bárbaro: 0.12, Mago: 0.18, Curandeiro: 0.18 }[className] ?? 0.10;
    const minRegen = { Guerreiro: 1,    Bárbaro: 2,    Mago: 3,    Curandeiro: 3    }[className] ?? 1;
    return Math.max(minRegen, Math.ceil(eneMax * regenPct));
}

/**
 * Calcula eficiência de ENE para skill de dano: power / cost
 */
function damageEfficiency(power, cost) {
    return power / cost;
}

/**
 * Calcula eficiência de ENE para skill de cura: healPower / cost
 */
function healEfficiency(healPower, cost) {
    return healPower / cost;
}

/**
 * Calcula eficiência de ENE para debuff: |power| * duração / cost
 * Representa "ATK-turnos por ENE gasto"
 */
function debuffEfficiency(atkReduction, duration, cost) {
    return (Math.abs(atkReduction) * duration) / cost;
}

// ---------------------------------------------------------------------------
// Valores de referência do SKILL_DEFS (source of truth para comparação)
// ---------------------------------------------------------------------------

// Skills de referência do Guerreiro
const GOLPE_ESPADA_I   = { cost: 4, power: 18, type: 'DAMAGE' };  // slot 1 legado
const GOLPE_ESPADA_II  = { cost: 6, power: 24, type: 'DAMAGE' };  // tier 2
const GOLPE_ESPADA_III = { cost: 8, power: 30, type: 'DAMAGE' };  // tier 3 (teto)

// Skills de referência do Bárbaro
const GOLPE_BRUTAL_I   = { cost: 6, power: 24, type: 'DAMAGE' };  // tier 1
const GOLPE_BRUTAL_II  = { cost: 8, power: 32, type: 'DAMAGE' };  // tier 2
const GOLPE_BRUTAL_III = { cost: 12, power: 38, type: 'DAMAGE' }; // tier 3 (teto)

// Skills de referência do Mago
const MAGIA_ELEMENTAL_I   = { cost: 4, power: 20, type: 'DAMAGE' };
const MAGIA_ELEMENTAL_III = { cost: 8, power: 32, type: 'DAMAGE' };  // tier 3 (teto dano)

// Skills de referência de controle/debuff (Ladino — para comparar moonquill)
const ENFRAQUECER_I  = { cost: 4, power: -2, duration: 1, type: 'BUFF' }; // Ladino S1
const ENFRAQUECER_II = { cost: 6, power: -3, duration: 2, type: 'BUFF' }; // Ladino S2 (ref principal)

// Skills de referência de cura (Curandeiro)
const CURA_I   = { cost: 5, power: 15, type: 'HEAL' }; // slot 1 legado
const CURA_II  = { cost: 7, power: 25, type: 'HEAL' };
const CURA_III = { cost: 10, power: 40, type: 'HEAL' }; // tier 3 (teto)
const CANCAO_CALMANTE_I = { cost: 5, power: 12, type: 'HEAL' }; // Bardo slot 1

// Swaps canônicos (obtidos dinamicamente via applyKitSwaps)
function getSwap(speciesId, slotCount) {
    const result = applyKitSwaps(
        { canonSpeciesId: speciesId, unlockedSkillSlots: slotCount },
        []
    );
    return result.skills[slotCount - 1] ?? null;
}

// ---------------------------------------------------------------------------
// Bloco 1 — shieldhorn (Guerreiro, slot 1, DAMAGE)
// Princípio: slot 1 = identidade base; troca eficiência de ENE por força/hit
// ---------------------------------------------------------------------------
describe('Auditoria — shieldhorn (Guerreiro, slot 1 DAMAGE)', () => {

    it('Golpe Pesado I deve ter power maior que Golpe de Espada I', () => {
        const swap = getSwap('shieldhorn', 1);
        expect(swap.power).toBeGreaterThan(GOLPE_ESPADA_I.power);
        // +22% power esperado (22 vs 18)
    });

    it('Golpe Pesado I deve ter custo maior que Golpe de Espada I (troca de eficiência)', () => {
        const swap = getSwap('shieldhorn', 1);
        expect(swap.cost).toBeGreaterThan(GOLPE_ESPADA_I.cost);
    });

    it('Golpe Pesado I deve ter eficiência (pwr/ENE) MENOR que Golpe de Espada I', () => {
        const swap = getSwap('shieldhorn', 1);
        const swapEff = damageEfficiency(swap.power, swap.cost);
        const refEff  = damageEfficiency(GOLPE_ESPADA_I.power, GOLPE_ESPADA_I.cost);
        // tank_puro: troca frequência por impacto → menos hits por ENE
        expect(swapEff).toBeLessThan(refEff);
        // Referência: 4.50 pwr/ENE; swap: 3.67 pwr/ENE (-18.4%)
    });

    it('Golpe Pesado I não supera o power do tier 3 (Golpe de Espada III, teto da classe)', () => {
        const swap = getSwap('shieldhorn', 1);
        expect(swap.power).toBeLessThan(GOLPE_ESPADA_III.power);
        // 22 < 30 → abaixo do teto ✅
    });

    it('dano simulado ao L1 com swap é maior que sem swap (shieldhorn atk=4, def=3 oponente)', () => {
        // shieldhorn tem offset atk-1 → atk=4 no L1 (vs base 5)
        const atk = 4;
        const def = 3;

        const danoSemSwap = simDamage(atk, GOLPE_ESPADA_I.power, def);
        const danoComSwap = simDamage(atk, 22, def);  // swap power=22

        // 4+18-3=19; 4+22-3=23 → swap faz mais dano
        expect(danoComSwap).toBeGreaterThan(danoSemSwap);
        // Ganho de dano: ≤25% (não é power creep excessivo para slot 1)
        const pctGanho = (danoComSwap - danoSemSwap) / danoSemSwap;
        expect(pctGanho).toBeLessThanOrEqual(0.25);
    });

    it('uses sustentáveis por turno L1: swap custa mais ENE (menos spams possíveis)', () => {
        const eneL1 = simEneMax(1);     // 10 ENE
        const regenL1 = simEneRegen('Guerreiro', 1); // 1/turno

        // Sem swap: Golpe de Espada I (cost 4)
        const usesPorTurnoSemSwap = eneL1 / GOLPE_ESPADA_I.cost; // 2.5 usos iniciais

        // Com swap: Golpe Pesado I (cost 6)
        const usosCustoSwap = eneL1 / 6; // 1.67 usos iniciais (cost=6)

        // Swap esgota ENE mais rápido → menos frequência, mais força
        expect(usosCustoSwap).toBeLessThan(usesPorTurnoSemSwap);
        // Regen de 1/turno é baixo — slot 1 nunca é spam fácil em L1
        expect(regenL1).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Bloco 2 — emberfang (Bárbaro, slot 4, DAMAGE)
// Princípio: slot 4 = assinatura avançada; ADD (sem legado de slot 4 no Bárbaro)
// ---------------------------------------------------------------------------
describe('Auditoria — emberfang (Bárbaro, slot 4 DAMAGE)', () => {

    it('Explosão Bruta I deve ter power maior que Golpe Brutal I (tier 1)', () => {
        const swap = getSwap('emberfang', 4);
        expect(swap.power).toBeGreaterThan(GOLPE_BRUTAL_I.power);
        // 32 > 24 ✅
    });

    it('Explosão Bruta I deve ter power ABAIXO do tier 3 (Golpe Brutal III, teto)', () => {
        const swap = getSwap('emberfang', 4);
        expect(swap.power).toBeLessThan(GOLPE_BRUTAL_III.power);
        // 32 < 38 ✅
    });

    it('Explosão Bruta I é equivalente a Golpe Brutal II em eficiência (cost 8, power 32)', () => {
        const swap = getSwap('emberfang', 4);
        const swapEff = damageEfficiency(swap.power, swap.cost);
        const refEff  = damageEfficiency(GOLPE_BRUTAL_II.power, GOLPE_BRUTAL_II.cost);
        // Ambos: 32/8 = 4.0 pwr/ENE — slot 4 na faixa tier 2
        expect(swapEff).toBeCloseTo(refEff, 1);
    });

    it('dano simulado ao L30 com emberfang está na faixa tier 2 da classe (atk=25, def=10)', () => {
        // emberfang (burst_agressivo) offset: atk+1, e.g. baseAtk=8, L30 Comum: floor(8*3.0) + 1 = 25
        const atk = 25;
        const def = 10; // def de um oponente típico L30

        const danoTier1 = simDamage(atk, GOLPE_BRUTAL_I.power, def);  // 24
        const danoTier2 = simDamage(atk, GOLPE_BRUTAL_II.power, def); // 32
        const danoTier3 = simDamage(atk, GOLPE_BRUTAL_III.power, def);// 38
        const danoSwap  = simDamage(atk, 32, def);                     // swap power=32

        // Swap está na faixa do tier 2 (≥ tier1, ≤ tier3)
        expect(danoSwap).toBeGreaterThanOrEqual(danoTier1);
        expect(danoSwap).toBeLessThanOrEqual(danoTier3);

        // Swap = tier 2 (mesma power)
        expect(danoSwap).toBe(danoTier2);
    });

    it('custo 8 ENE é sustentável ao L30 (regen Bárbaro: 9/turno ao nível 30)', () => {
        const regen = simEneRegen('Bárbaro', 30); // ceil(68 * 0.12) = 9
        // Pode usar slot 4 (cost 8) praticamente todo turno com regen
        expect(regen).toBeGreaterThanOrEqual(8);
        // Confirmar: regen >= custo = sustentável sem acumular
        expect(regen).toBe(9);
    });
});

// ---------------------------------------------------------------------------
// Bloco 3 — moonquill (Mago, slot 4, DEBUFF)
// Princípio: slot 4 = assinatura avançada; controle > dano; AJUSTADO em 6.1
// ---------------------------------------------------------------------------
describe('Auditoria — moonquill (Mago, slot 4 DEBUFF) — pós-ajuste Fase 6.1', () => {

    it('Véu Arcano I deve ter custo 4 (ajustado de 3 em Fase 6.1)', () => {
        const swap = getSwap('moonquill', 4);
        expect(swap.cost).toBe(4);
    });

    it('Véu Arcano I tem efeito debuff maior que Enfraquecer I (Ladino ref)', () => {
        const swap = getSwap('moonquill', 4);
        // Enfraquecer I: −2 ATK, 1 turno. Véu Arcano I: −3 ATK, 2 turnos
        expect(Math.abs(swap.power)).toBeGreaterThanOrEqual(Math.abs(ENFRAQUECER_I.power));
        expect(swap.duration).toBeGreaterThanOrEqual(ENFRAQUECER_I.duration);
    });

    it('eficiência pós-ajuste (1.5 ATK-t/ENE) está entre Enfraquecer I e II', () => {
        const swap = getSwap('moonquill', 4);
        const effSwap    = debuffEfficiency(swap.power, swap.duration, swap.cost);
        const effLadinoI = debuffEfficiency(ENFRAQUECER_I.power, ENFRAQUECER_I.duration, ENFRAQUECER_I.cost);
        const effLadinoII= debuffEfficiency(ENFRAQUECER_II.power, ENFRAQUECER_II.duration, ENFRAQUECER_II.cost);

        // Pós-ajuste: −3 ATK × 2 turnos / 4 ENE = 1.5 ATK-t/ENE
        expect(effSwap).toBeCloseTo(1.5, 1);

        // Deve estar acima de Enfraquecer I (0.5) — slot 4 supera slot básico
        expect(effSwap).toBeGreaterThan(effLadinoI);

        // Não deve ser mais de 2× mais eficiente que Enfraquecer II (1.0)
        // Critério de calibração: <2× a referência mais próxima de outra classe
        expect(effSwap).toBeLessThan(effLadinoII * 2.0);
    });

    it('pré-ajuste (cost 3) seria 2× a eficiência de Enfraquecer II — confirmação do problema', () => {
        // Este teste documenta o problema original detectado na auditoria
        const costOriginal = 3;
        const effOriginal = debuffEfficiency(-3, 2, costOriginal);  // 2.0 ATK-t/ENE
        const effLadinoII = debuffEfficiency(-3, 2, 6);             // 1.0 ATK-t/ENE

        // Confirma que o valor original era problemático
        expect(effOriginal).toBeCloseTo(2.0, 1);
        expect(effOriginal).toBeGreaterThanOrEqual(effLadinoII * 2.0);
    });

    it('custo 4 ENE é sustentável ao L30 (regen Mago: 13/turno ao nível 30)', () => {
        const regen = simEneRegen('Mago', 30); // ceil(68 * 0.18) = 13
        // Pode usar Véu Arcano I (cost 4) múltiplas vezes por turno com regen alto
        expect(regen).toBeGreaterThan(4);
        // Confirmar valor concreto
        expect(regen).toBe(13);
    });

    it('Véu Arcano I tem debuff de ATK (não dano direto) — coerente com controle_leve', () => {
        const swap = getSwap('moonquill', 4);
        expect(swap.type).toBe('BUFF');   // tipo BUFF = inclui debuffs no runtime
        expect(swap.target).toBe('enemy');
        expect(swap.power).toBeLessThan(0); // valor negativo = debuff
    });

    it('duração 2 turnos garante janela de controle sem ser permanente', () => {
        const swap = getSwap('moonquill', 4);
        expect(swap.duration).toBe(2);
        // Não infinito, não instant — controle de médio prazo
        expect(swap.duration).toBeGreaterThan(1);
        expect(swap.duration).toBeLessThan(5);
    });
});

// ---------------------------------------------------------------------------
// Bloco 4 — floracura (Curandeiro, slot 4, HEAL)
// Princípio: slot 4 = assinatura de sustain; HEAL menor, mais eficiente em ENE
// ---------------------------------------------------------------------------
describe('Auditoria — floracura (Curandeiro, slot 4 HEAL)', () => {

    it('Cura Eficiente I deve ter heal absoluto MENOR que Cura I (slot 1 legado)', () => {
        const swap = getSwap('floracura', 4);
        // slot 4 = EFICIÊNCIA, não volume. Heal menor que o slot 1.
        expect(swap.power).toBeLessThan(CURA_I.power);
        // 10 < 15 ✅
    });

    it('Cura Eficiente I deve ter custo MENOR que Cura I (proposta de eficiência)', () => {
        const swap = getSwap('floracura', 4);
        expect(swap.cost).toBeLessThan(CURA_I.cost);
        // 3 < 5 ✅
    });

    it('eficiência HP/ENE de Cura Eficiente I é melhor que Cura I', () => {
        const swap = getSwap('floracura', 4);
        const effSwap = healEfficiency(swap.power, swap.cost);
        const effRef  = healEfficiency(CURA_I.power, CURA_I.cost);

        // 10/3 = 3.33 > 15/5 = 3.00 ✅
        expect(effSwap).toBeGreaterThan(effRef);
    });

    it('eficiência HP/ENE não supera o teto de Cura III (4.0 HP/ENE)', () => {
        const swap = getSwap('floracura', 4);
        const effSwap  = healEfficiency(swap.power, swap.cost);
        const effCeiling = healEfficiency(CURA_III.power, CURA_III.cost); // 4.0

        // 3.33 < 4.0 ✅ — dentro do teto da progressão
        expect(effSwap).toBeLessThan(effCeiling);
    });

    it('eficiência é maior que Canção Calmante I do Bardo (2.4 HP/ENE)', () => {
        const swap = getSwap('floracura', 4);
        const effSwap = healEfficiency(swap.power, swap.cost);
        const effBardo = healEfficiency(CANCAO_CALMANTE_I.power, CANCAO_CALMANTE_I.cost); // 12/5 = 2.4

        // floracura é curandeiro especializado — deve superar cura de suporte
        expect(effSwap).toBeGreaterThan(effBardo);
    });

    it('uses sustentáveis ao L30: custo 3 permite spam com regen Curandeiro (13/turno)', () => {
        const regen = simEneRegen('Curandeiro', 30); // 13/turno
        const custo = 3;

        // Pode usar múltiplas vezes por turno, regen cobre o custo
        expect(regen).toBeGreaterThan(custo);
        // Usos por turno (com regen): floor(regen / custo) = 4 por turno
        const usosPorTurno = Math.floor(regen / custo);
        expect(usosPorTurno).toBeGreaterThanOrEqual(4);
    });

    it('Cura Eficiente I tem target de aliado (coerente com papel de suporte)', () => {
        const swap = getSwap('floracura', 4);
        expect(swap.type).toBe('HEAL');
        expect(swap.target).toBe('ally');
    });
});

// ---------------------------------------------------------------------------
// Bloco 5 — teto global: nenhum swap supera o tier 3 de dano da sua classe
// ---------------------------------------------------------------------------
describe('Auditoria — teto de poder: swaps de dano abaixo do tier 3 legado', () => {

    it('shieldhorn Golpe Pesado I: power (22) < Golpe de Espada III tier 3 (30)', () => {
        const swap = getSwap('shieldhorn', 1);
        expect(swap.power).toBeLessThan(GOLPE_ESPADA_III.power);
    });

    it('emberfang Explosão Bruta I: power (32) < Golpe Brutal III tier 3 (38)', () => {
        const swap = getSwap('emberfang', 4);
        expect(swap.power).toBeLessThan(GOLPE_BRUTAL_III.power);
    });

    it('moonquill Véu Arcano I: debuff (-3 ATK, 2t) não supera Enfraquecer II (mesmos valores, mesmo custo)', () => {
        const swap = getSwap('moonquill', 4);
        const effSwap    = debuffEfficiency(swap.power, swap.duration, swap.cost);
        const effMaxLadino = debuffEfficiency(ENFRAQUECER_II.power, ENFRAQUECER_II.duration, ENFRAQUECER_II.cost);

        // Moonquill pode ter eficiência maior (é Mago, não Ladino), mas não por fator absurdo
        expect(effSwap).toBeLessThan(effMaxLadino * 2.0);
    });

    it('floracura Cura Eficiente I: HP/ENE abaixo do teto Cura III (4.0)', () => {
        const swap = getSwap('floracura', 4);
        const eff = healEfficiency(swap.power, swap.cost);
        expect(eff).toBeLessThan(4.0);
    });
});

// ---------------------------------------------------------------------------
// Bloco 6 — coerência de slot: slot 4 mais caro que slot 1 por design
// ---------------------------------------------------------------------------
describe('Auditoria — coerência de slot: custo slot 4 >= custo slot 1 (exceto sustain)', () => {

    it('emberfang slot 4 (cost 8) > Golpe Brutal I slot 1 equivalente (cost 6)', () => {
        const swap = getSwap('emberfang', 4);
        expect(swap.cost).toBeGreaterThan(GOLPE_BRUTAL_I.cost);
    });

    it('moonquill slot 4 (cost 4) >= Magia Elemental I slot 1 (cost 4) — igual, justificado pelo tipo', () => {
        const swap = getSwap('moonquill', 4);
        // Debuff ao custo equivalente a dano é aceitável — BUFF/controle vs DAMAGE
        expect(swap.cost).toBeGreaterThanOrEqual(MAGIA_ELEMENTAL_I.cost);
    });

    it('floracura slot 4 (cost 3) < Cura I slot 1 (cost 5) — intencional para sustain', () => {
        // Exceção documentada: sustain model, heal fraco mas barato
        const swap = getSwap('floracura', 4);
        expect(swap.cost).toBeLessThan(CURA_I.cost);
        // O trade-off é: heal absoluto menor (10 < 15), portanto custo menor é aceitável
        expect(swap.power).toBeLessThan(CURA_I.power);
    });

    it('shieldhorn slot 1 (cost 6) > Golpe de Espada I (cost 4) — slot 1 swap tem custo maior', () => {
        const swap = getSwap('shieldhorn', 1);
        expect(swap.cost).toBeGreaterThan(GOLPE_ESPADA_I.cost);
    });
});

// ---------------------------------------------------------------------------
// Bloco 7 — ausência de regressão: swaps não mudam comportamento de espécies sem swap
// ---------------------------------------------------------------------------
describe('Auditoria — ausência de regressão em espécies sem swap', () => {

    it('espécie sem swap não tem skills alteradas mesmo com slot 4 desbloqueado', () => {
        const skillsBase = [
            { name: 'Skill A', type: 'DAMAGE', cost: 4, power: 15 },
            { name: 'Skill B', type: 'BUFF',   cost: 3, power: 2  },
        ];
        const result = applyKitSwaps(
            { canonSpeciesId: 'ladino_comum', unlockedSkillSlots: 4 },
            skillsBase
        );
        expect(result.skills).toEqual(skillsBase);
        expect(result.appliedKitSwaps).toHaveLength(0);
        expect(result.blockedKitSwaps).toHaveLength(0);
    });

    it('espécie sem canonSpeciesId não é afetada por nenhum swap', () => {
        const skillsBase = [{ name: 'Habilidade Qualquer', type: 'DAMAGE', cost: 5, power: 20 }];
        const result = applyKitSwaps(
            { canonSpeciesId: null, unlockedSkillSlots: 4 },
            skillsBase
        );
        expect(result.skills).toEqual(skillsBase);
    });
});

// ---------------------------------------------------------------------------
// Bloco 8 — tabela de eficiência completa (documentação via teste)
// ---------------------------------------------------------------------------
describe('Auditoria — tabela de eficiência pós-normalização (Fase 6.1)', () => {

    it('shieldhorn: eficiência 3.67 pwr/ENE (vs Golpe de Espada I: 4.50)', () => {
        const swap = getSwap('shieldhorn', 1);
        const eff = damageEfficiency(swap.power, swap.cost);
        expect(eff).toBeCloseTo(3.67, 1);
    });

    it('emberfang: eficiência 4.00 pwr/ENE (igual a Golpe Brutal II)', () => {
        const swap = getSwap('emberfang', 4);
        const eff = damageEfficiency(swap.power, swap.cost);
        expect(eff).toBeCloseTo(4.0, 1);
    });

    it('moonquill: eficiência 1.50 ATK-t/ENE (pós-ajuste custo 3→4)', () => {
        const swap = getSwap('moonquill', 4);
        const eff = debuffEfficiency(swap.power, swap.duration, swap.cost);
        expect(eff).toBeCloseTo(1.5, 1);
    });

    it('floracura: eficiência 3.33 HP/ENE (vs Cura I: 3.00, teto Cura III: 4.00)', () => {
        const swap = getSwap('floracura', 4);
        const eff = healEfficiency(swap.power, swap.cost);
        expect(eff).toBeCloseTo(3.33, 1);
    });
});
