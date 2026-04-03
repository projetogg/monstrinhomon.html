/**
 * KIT SWAP PROMOTION TESTS (Fase 7)
 *
 * Testes para promoteKitSwaps() em js/canon/kitSwap.js
 *
 * Cobertura:
 *  - Promoção válida para cada um dos 4 swaps existentes
 *  - Bloqueio por nível insuficiente
 *  - Bloqueio por slot não desbloqueado
 *  - Fallback sem canonSpeciesId
 *  - Fallback sem appliedKitSwaps
 *  - Metadados de observabilidade (promotedKitSwaps, blockedKitSwapPromotions, updated)
 *  - Idempotência: swap já promovido não é promovido novamente
 *  - Ausência de regressão no kit legado (applyKitSwaps)
 *  - getPromotableSwapIds: lista de IDs promovíveis
 *  - KIT_SWAP_PROMOTION_TABLE: valores calibrados dentro das faixas auditadas
 */

import { describe, it, expect } from 'vitest';
import {
    applyKitSwaps,
    promoteKitSwaps,
    getPromotableSwapIds,
    KIT_SWAP_PROMOTION_TABLE,
} from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Helpers de instância
// ---------------------------------------------------------------------------

/**
 * Cria uma instância mínima com appliedKitSwaps simulando o resultado da Fase 6.
 */
function makeInstanceWithSwap({ canonSpeciesId, swapId, slot, unlockedSkillSlots, level, existingPromotedKitSwaps }) {
    return {
        canonSpeciesId,
        unlockedSkillSlots: unlockedSkillSlots ?? 4,
        level: level ?? 1,
        appliedKitSwaps: swapId
            ? [{ slot: slot ?? 1, canonSkillId: 'any', replacementId: swapId, action: 'replaced', originalSkill: null }]
            : [],
        promotedKitSwaps: existingPromotedKitSwaps ?? undefined,
    };
}

// ---------------------------------------------------------------------------
// Bloco 1 — promoteKitSwaps: fallbacks seguros
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — fallbacks seguros', () => {

    it('deve retornar updated=false e arrays vazios sem canonSpeciesId', () => {
        const result = promoteKitSwaps({ canonSpeciesId: null, appliedKitSwaps: [], level: 50, unlockedSkillSlots: 4 });
        expect(result.updated).toBe(false);
        expect(result.promotedKitSwaps).toEqual([]);
        expect(result.blockedKitSwapPromotions).toEqual([]);
    });

    it('deve retornar updated=false sem appliedKitSwaps', () => {
        const result = promoteKitSwaps({ canonSpeciesId: 'shieldhorn', appliedKitSwaps: [], level: 50, unlockedSkillSlots: 4 });
        expect(result.updated).toBe(false);
        expect(result.promotedKitSwaps).toEqual([]);
    });

    it('deve retornar updated=false sem campo appliedKitSwaps (undefined)', () => {
        const result = promoteKitSwaps({ canonSpeciesId: 'shieldhorn', level: 50, unlockedSkillSlots: 4 });
        expect(result.updated).toBe(false);
    });

    it('deve retornar updated=false para instance null/undefined', () => {
        expect(promoteKitSwaps(null).updated).toBe(false);
        expect(promoteKitSwaps(undefined).updated).toBe(false);
    });

    it('deve ignorar swap sem replacementId no appliedKitSwaps', () => {
        const instance = {
            canonSpeciesId: 'shieldhorn',
            appliedKitSwaps: [{ slot: 1, canonSkillId: 'any', action: 'replaced' }], // sem replacementId
            level: 99,
            unlockedSkillSlots: 4,
        };
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
    });

    it('deve ignorar swap sem promoção definida (espécie sem tabela)', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'algum_swap_sem_promocao',
            level: 99,
            unlockedSkillSlots: 4,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.promotedKitSwaps).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Bloco 2 — promoteKitSwaps: shieldhorn (slot 1, minLevel 20)
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — shieldhorn (slot 1, L20)', () => {

    it('deve promover shieldhorn_heavy_strike ao atingir L20', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 1,
            level: 20,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(true);
        expect(result.promotedKitSwaps).toHaveLength(1);
        expect(result.promotedKitSwaps[0].fromSwapId).toBe('shieldhorn_heavy_strike');
        expect(result.promotedKitSwaps[0].toSwapId).toBe('shieldhorn_heavy_strike_ii');
        expect(result.promotedKitSwaps[0].slot).toBe(1);
    });

    it('deve conter a skill promovida com campos corretos', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 1,
            level: 20,
        });
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        const p = promotedKitSwaps[0];
        expect(p.promotedSkill._kitSwapId).toBe('shieldhorn_heavy_strike_ii');
        expect(p.promotedSkill.name).toBe('Golpe Pesado II');
        expect(p.promotedSkill.type).toBe('DAMAGE');
        expect(p.promotedSkill.cost).toBe(8);
        expect(p.promotedSkill.power).toBe(30);
    });

    it('deve bloquear shieldhorn quando nível < 20', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 1,
            level: 19,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.promotedKitSwaps).toHaveLength(0);
        expect(result.blockedKitSwapPromotions).toHaveLength(1);
        expect(result.blockedKitSwapPromotions[0].reason).toBe('level_not_reached');
        expect(result.blockedKitSwapPromotions[0].swapId).toBe('shieldhorn_heavy_strike');
        expect(result.blockedKitSwapPromotions[0].minLevel).toBe(20);
        expect(result.blockedKitSwapPromotions[0].currentLevel).toBe(19);
    });

    it('deve bloquear shieldhorn quando slot 1 não desbloqueado', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 0, // Slot 1 exige >= 1
            level: 50,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.blockedKitSwapPromotions[0].reason).toBe('slot_not_unlocked');
    });

    it('deve promover com level exatamente no limiar (L20)', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 1,
            level: 20,
        });
        expect(promoteKitSwaps(instance).updated).toBe(true);
    });

    it('deve promover com level acima do limiar (L99)', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 1,
            level: 99,
        });
        expect(promoteKitSwaps(instance).updated).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Bloco 3 — promoteKitSwaps: emberfang (slot 4, minLevel 50)
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — emberfang (slot 4, L50)', () => {

    it('deve promover emberfang_brutal_burst ao atingir L50', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'emberfang',
            swapId: 'emberfang_brutal_burst',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 50,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(true);
        expect(result.promotedKitSwaps[0].toSwapId).toBe('emberfang_brutal_burst_ii');
    });

    it('deve conter skill promovida com campos corretos', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'emberfang',
            swapId: 'emberfang_brutal_burst',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 50,
        });
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        const p = promotedKitSwaps[0];
        expect(p.promotedSkill.name).toBe('Explosão Bruta II');
        expect(p.promotedSkill.type).toBe('DAMAGE');
        expect(p.promotedSkill.cost).toBe(10);
        expect(p.promotedSkill.power).toBe(38);
    });

    it('deve bloquear emberfang quando nível < 50', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'emberfang',
            swapId: 'emberfang_brutal_burst',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 49,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.blockedKitSwapPromotions[0].reason).toBe('level_not_reached');
    });

    it('deve bloquear emberfang quando slot 4 não desbloqueado', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'emberfang',
            swapId: 'emberfang_brutal_burst',
            slot: 4,
            unlockedSkillSlots: 3, // slot 4 exige >= 4
            level: 60,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.blockedKitSwapPromotions[0].reason).toBe('slot_not_unlocked');
        expect(result.blockedKitSwapPromotions[0].targetSlot).toBe(4);
        expect(result.blockedKitSwapPromotions[0].currentSlots).toBe(3);
    });
});

// ---------------------------------------------------------------------------
// Bloco 4 — promoteKitSwaps: moonquill (slot 4, minLevel 50)
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — moonquill (slot 4, L50)', () => {

    it('deve promover moonquill_arcane_veil ao atingir L50', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'moonquill',
            swapId: 'moonquill_arcane_veil',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 50,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(true);
        expect(result.promotedKitSwaps[0].toSwapId).toBe('moonquill_arcane_veil_ii');
    });

    it('deve conter skill promovida com campos corretos', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'moonquill',
            swapId: 'moonquill_arcane_veil',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 50,
        });
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        const p = promotedKitSwaps[0];
        expect(p.promotedSkill.name).toBe('Véu Arcano II');
        expect(p.promotedSkill.type).toBe('BUFF');
        expect(p.promotedSkill.cost).toBe(5);
        expect(p.promotedSkill.power).toBe(-4);
        expect(p.promotedSkill.target).toBe('enemy');
        expect(p.promotedSkill.duration).toBe(2);
    });

    it('deve bloquear moonquill quando nível < 50', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'moonquill',
            swapId: 'moonquill_arcane_veil',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 30,
        });
        expect(promoteKitSwaps(instance).updated).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Bloco 5 — promoteKitSwaps: floracura (slot 4, minLevel 50)
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — floracura (slot 4, L50)', () => {

    it('deve promover floracura_efficient_heal ao atingir L50', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'floracura',
            swapId: 'floracura_efficient_heal',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 50,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(true);
        expect(result.promotedKitSwaps[0].toSwapId).toBe('floracura_efficient_heal_ii');
    });

    it('deve conter skill promovida com campos corretos', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'floracura',
            swapId: 'floracura_efficient_heal',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 50,
        });
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        const p = promotedKitSwaps[0];
        expect(p.promotedSkill.name).toBe('Cura Eficiente II');
        expect(p.promotedSkill.type).toBe('HEAL');
        expect(p.promotedSkill.cost).toBe(4);
        expect(p.promotedSkill.power).toBe(14);
        expect(p.promotedSkill.target).toBe('ally');
    });

    it('deve bloquear floracura quando nível < 50', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'floracura',
            swapId: 'floracura_efficient_heal',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 49,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.blockedKitSwapPromotions[0].promotedSwapId).toBe('floracura_efficient_heal_ii');
    });
});

// ---------------------------------------------------------------------------
// Bloco 6 — Idempotência: swap já promovido não é promovido de novo
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — idempotência', () => {

    it('não deve re-promover shieldhorn que já está em promotedKitSwaps', () => {
        const instance = {
            canonSpeciesId: 'shieldhorn',
            level: 50,
            unlockedSkillSlots: 4,
            appliedKitSwaps: [
                { slot: 1, canonSkillId: 'warrior_basic_strike', replacementId: 'shieldhorn_heavy_strike', action: 'replaced', originalSkill: 'Golpe de Espada I' },
            ],
            // Já tem registro de promoção anterior
            promotedKitSwaps: [
                { fromSwapId: 'shieldhorn_heavy_strike', toSwapId: 'shieldhorn_heavy_strike_ii', slot: 1, level: 20 },
            ],
        };
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.promotedKitSwaps).toHaveLength(0);
    });

    it('não deve re-promover emberfang que já está em promotedKitSwaps', () => {
        const instance = {
            canonSpeciesId: 'emberfang',
            level: 80,
            unlockedSkillSlots: 4,
            appliedKitSwaps: [
                { slot: 4, canonSkillId: 'barbarian_berserk', replacementId: 'emberfang_brutal_burst', action: 'added', originalSkill: null },
            ],
            promotedKitSwaps: [
                { fromSwapId: 'emberfang_brutal_burst', toSwapId: 'emberfang_brutal_burst_ii', slot: 4, level: 50 },
            ],
        };
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Bloco 7 — Metadados de observabilidade
// ---------------------------------------------------------------------------
describe('promoteKitSwaps — metadados de observabilidade', () => {

    it('deve incluir level atual no registro de promoção', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'shieldhorn_heavy_strike',
            slot: 1,
            unlockedSkillSlots: 1,
            level: 35,
        });
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps[0].level).toBe(35);
    });

    it('deve incluir canonSkillId no registro de promoção', () => {
        const instance = {
            canonSpeciesId: 'shieldhorn',
            level: 50,
            unlockedSkillSlots: 4,
            appliedKitSwaps: [
                { slot: 1, canonSkillId: 'warrior_basic_strike', replacementId: 'shieldhorn_heavy_strike', action: 'replaced', originalSkill: 'Golpe de Espada I' },
            ],
        };
        const { promotedKitSwaps } = promoteKitSwaps(instance);
        expect(promotedKitSwaps[0].canonSkillId).toBe('warrior_basic_strike');
    });

    it('deve retornar blockedKitSwapPromotions populado quando há bloqueio por nível', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'floracura',
            swapId: 'floracura_efficient_heal',
            slot: 4,
            unlockedSkillSlots: 4,
            level: 30,
        });
        const { blockedKitSwapPromotions } = promoteKitSwaps(instance);
        expect(blockedKitSwapPromotions).toHaveLength(1);
        const b = blockedKitSwapPromotions[0];
        expect(b.swapId).toBe('floracura_efficient_heal');
        expect(b.reason).toBe('level_not_reached');
        expect(b.currentLevel).toBe(30);
        expect(b.minLevel).toBe(50);
        expect(b.promotedSwapId).toBe('floracura_efficient_heal_ii');
    });

    it('deve retornar blockedKitSwapPromotions populado quando há bloqueio por slot', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'moonquill',
            swapId: 'moonquill_arcane_veil',
            slot: 4,
            unlockedSkillSlots: 3,
            level: 60,
        });
        const { blockedKitSwapPromotions } = promoteKitSwaps(instance);
        expect(blockedKitSwapPromotions[0].reason).toBe('slot_not_unlocked');
        expect(blockedKitSwapPromotions[0].targetSlot).toBe(4);
    });

    it('deve retornar updated=false e arrays vazios quando swap não tem promoção', () => {
        const instance = makeInstanceWithSwap({
            canonSpeciesId: 'shieldhorn',
            swapId: 'algum_id_sem_promocao_definida',
            slot: 1,
            unlockedSkillSlots: 4,
            level: 99,
        });
        const result = promoteKitSwaps(instance);
        expect(result.updated).toBe(false);
        expect(result.promotedKitSwaps).toHaveLength(0);
        expect(result.blockedKitSwapPromotions).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Bloco 8 — Ausência de regressão: applyKitSwaps (Fase 6) inalterado
// ---------------------------------------------------------------------------
describe('applyKitSwaps (Fase 6) — ausência de regressão', () => {

    const HABILIDADES_GUERREIRO = [
        { name: 'Golpe de Espada I', type: 'DAMAGE', cost: 4, power: 18 },
        { name: 'Escudo I',          type: 'BUFF',   cost: 4, power: 2  },
    ];

    it('deve aplicar swap de shieldhorn e preservar slot 2', () => {
        const result = applyKitSwaps(
            { canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 },
            HABILIDADES_GUERREIRO
        );
        expect(result.skills[0].name).toBe('Golpe Pesado I');
        expect(result.skills[1].name).toBe('Escudo I');
        expect(result.appliedKitSwaps[0].replacementId).toBe('shieldhorn_heavy_strike');
    });

    it('deve retornar kit legado quando espécie sem swap', () => {
        const result = applyKitSwaps(
            { canonSpeciesId: 'unknown_species', unlockedSkillSlots: 4 },
            HABILIDADES_GUERREIRO
        );
        expect(result.skills[0].name).toBe('Golpe de Espada I');
        expect(result.appliedKitSwaps).toHaveLength(0);
    });

    it('deve retornar kit legado quando sem canonSpeciesId', () => {
        const result = applyKitSwaps(
            { canonSpeciesId: null, unlockedSkillSlots: 4 },
            HABILIDADES_GUERREIRO
        );
        expect(result.skills).toHaveLength(2);
        expect(result.appliedKitSwaps).toHaveLength(0);
    });

    it('deve bloquear swap quando slot insuficiente (emberfang slot 4, slots=3)', () => {
        const result = applyKitSwaps(
            { canonSpeciesId: 'emberfang', unlockedSkillSlots: 3 },
            [{ name: 'Fúria I', type: 'BUFF', cost: 4, power: 3 }]
        );
        expect(result.blockedKitSwaps).toHaveLength(1);
        expect(result.appliedKitSwaps).toHaveLength(0);
    });
});

// ---------------------------------------------------------------------------
// Bloco 9 — getPromotableSwapIds: cobertura de espécies
// ---------------------------------------------------------------------------
describe('getPromotableSwapIds', () => {

    it('deve retornar os 4 IDs promovíveis da Fase 7', () => {
        const ids = getPromotableSwapIds();
        expect(ids).toContain('shieldhorn_heavy_strike');
        expect(ids).toContain('emberfang_brutal_burst');
        expect(ids).toContain('moonquill_arcane_veil');
        expect(ids).toContain('floracura_efficient_heal');
    });

    it('deve retornar exatamente 5 entradas (Fase 9: +swiftclaw_precise_shot)', () => {
        expect(getPromotableSwapIds()).toHaveLength(5);
    });
});

// ---------------------------------------------------------------------------
// Bloco 10 — KIT_SWAP_PROMOTION_TABLE: calibração auditada
// ---------------------------------------------------------------------------
describe('KIT_SWAP_PROMOTION_TABLE — calibração de eficiência', () => {

    it('shieldhorn II: eficiência pwr/ENE deve ser maior que versão I e menor que tier 2 WAR', () => {
        // Versão I: cost 6, pwr 22 → 3.67
        // Versão II: cost 8, pwr 30 → 3.75
        // Tier 2 WAR referência: 4.00
        const { promoted } = KIT_SWAP_PROMOTION_TABLE['shieldhorn_heavy_strike'];
        const effII = promoted.power / promoted.cost; // 3.75
        const effI = 22 / 6; // 3.67
        const effTier2Ref = 4.00;
        expect(effII).toBeGreaterThan(effI);
        expect(effII).toBeLessThan(effTier2Ref);
    });

    it('emberfang II: eficiência pwr/ENE deve estar entre tier 2 e tier 3 BAR', () => {
        // Tier 2 BAR: 4.00  |  Tier 3 BAR: 3.17
        // Versão II: cost 10, pwr 38 → 3.80
        const { promoted } = KIT_SWAP_PROMOTION_TABLE['emberfang_brutal_burst'];
        const effII = promoted.power / promoted.cost;
        expect(effII).toBeLessThan(4.00); // abaixo do tier 2
        expect(effII).toBeGreaterThan(3.17); // acima da eficiência do tier 3
    });

    it('moonquill II: eficiência ATK-t/ENE deve ser modesta melhoria sobre versão I', () => {
        // Versão I: cost 4, −3 ATK, 2t → 1.50 ATK-t/ENE
        // Versão II: cost 5, −4 ATK, 2t → 1.60 ATK-t/ENE (+6.7%)
        const { promoted } = KIT_SWAP_PROMOTION_TABLE['moonquill_arcane_veil'];
        const effII = (Math.abs(promoted.power) * promoted.duration) / promoted.cost;
        const effI = (3 * 2) / 4; // 1.50
        expect(effII).toBeGreaterThan(effI);
        expect(effII).toBeLessThan(2.5); // não deve exceder 2.5 ATK-t/ENE
    });

    it('floracura II: eficiência HP/ENE deve ser melhoria sobre versão I e abaixo do teto (4.0)', () => {
        // Versão I: cost 3, pwr 10 → 3.33 HP/ENE
        // Versão II: cost 4, pwr 14 → 3.50 HP/ENE
        // Teto (Cura III): 4.00
        const { promoted } = KIT_SWAP_PROMOTION_TABLE['floracura_efficient_heal'];
        const effII = promoted.power / promoted.cost; // 3.50
        const effI = 10 / 3; // 3.33
        expect(effII).toBeGreaterThan(effI);
        expect(effII).toBeLessThan(4.0); // abaixo do teto
    });

    it('todas as skills promovidas devem ter _kitSwapId único e distinto da versão I', () => {
        const ids = new Set();
        for (const [fromId, def] of Object.entries(KIT_SWAP_PROMOTION_TABLE)) {
            const promotedId = def.promoted._kitSwapId;
            expect(promotedId).toBeDefined();
            expect(promotedId).not.toBe(fromId); // ID diferente da versão I
            ids.add(promotedId);
        }
        // Todos os IDs de versão II devem ser únicos entre si
        expect(ids.size).toBe(Object.keys(KIT_SWAP_PROMOTION_TABLE).length);
    });
});

// ---------------------------------------------------------------------------
// Bloco 11 — Integração: applyKitSwaps + promoteKitSwaps em sequência
// ---------------------------------------------------------------------------
describe('integração: applyKitSwaps → promoteKitSwaps', () => {

    it('deve promover swap que foi aplicado por applyKitSwaps', () => {
        const baseSkills = [
            { name: 'Golpe de Espada I', type: 'DAMAGE', cost: 4, power: 18 },
            { name: 'Escudo I', type: 'BUFF', cost: 4, power: 2 },
        ];
        const kitResult = applyKitSwaps(
            { canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 },
            baseSkills
        );
        // Simula instância com Fase 6 aplicada
        const instance = {
            canonSpeciesId: 'shieldhorn',
            level: 25,
            unlockedSkillSlots: 1,
            appliedKitSwaps: kitResult.appliedKitSwaps,
            blockedKitSwaps: kitResult.blockedKitSwaps,
        };
        const promoResult = promoteKitSwaps(instance);
        expect(promoResult.updated).toBe(true);
        expect(promoResult.promotedKitSwaps[0].fromSwapId).toBe('shieldhorn_heavy_strike');
        expect(promoResult.promotedKitSwaps[0].toSwapId).toBe('shieldhorn_heavy_strike_ii');
    });

    it('deve bloquear promoção quando o swap da Fase 6 ainda está bloqueado por slot', () => {
        // emberfang ainda com 3 slots (slot 4 não desbloqueado)
        const kitResult = applyKitSwaps(
            { canonSpeciesId: 'emberfang', unlockedSkillSlots: 3 },
            [{ name: 'Fúria I', type: 'BUFF', cost: 4, power: 3 }]
        );
        // Fase 6 não aplicou swap (bloqueado) → appliedKitSwaps vazio
        expect(kitResult.appliedKitSwaps).toHaveLength(0);

        const instance = {
            canonSpeciesId: 'emberfang',
            level: 60,
            unlockedSkillSlots: 3,
            appliedKitSwaps: kitResult.appliedKitSwaps,
        };
        const promoResult = promoteKitSwaps(instance);
        // Sem swap aplicado → sem promoção possível
        expect(promoResult.updated).toBe(false);
    });
});
