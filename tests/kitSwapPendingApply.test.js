/**
 * KIT SWAP PENDING APPLICATION TESTS (Fase 18)
 *
 * Testes para o fluxo de aplicação de kit_swap pendente quando o slot de
 * habilidade é desbloqueado após a criação do monstrinho.
 *
 * Cobertura:
 *   applyPendingKitSwaps() (js/canon/kitSwap.js):
 *     - Aplicação bem-sucedida quando slot agora desbloqueado
 *     - Guardas: sem espécie, kit já aplicado, sem swap definido, slot ainda bloqueado
 *     - Estrutura correta do appliedKitSwap retornado
 *     - Ação 'applied_on_level_up' para distinguir de aplicação na criação
 *     - Não re-aplica se appliedKitSwaps já tem entradas
 *     - Funciona para todas as espécies com kitSwapUnlockLevel > 1
 *
 *   isReadyForKitSwap() (js/canon/speciesDisplay.js):
 *     - Retorna true quando nível >= unlockLevel e kit não aplicado
 *     - Retorna false para espécies com unlockLevel = 1 (shieldhorn, swiftclaw)
 *     - Retorna false quando nível ainda abaixo do unlock
 *     - Retorna false quando kit já aplicado
 *     - Retorna false quando promovido (sem espécie ou sem kit)
 *     - Retorna false para null/undefined
 *     - Coexistência: não conflita com near_unlock/near_promo (são funções diferentes)
 */

import { describe, it, expect } from 'vitest';
import { applyPendingKitSwaps } from '../js/canon/kitSwap.js';
import { isReadyForKitSwap } from '../js/canon/speciesDisplay.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeInstance(overrides = {}) {
    return {
        canonSpeciesId: null,
        level: 1,
        unlockedSkillSlots: 1,
        appliedKitSwaps: [],
        promotedKitSwaps: [],
        blockedKitSwaps: [],
        ...overrides,
    };
}

/** Cria instância com slot 4 desbloqueado mas kit ainda não aplicado */
function readyForSlot4(speciesId, level = 30) {
    return makeInstance({
        canonSpeciesId: speciesId,
        level,
        unlockedSkillSlots: 4, // slot 4 desbloqueado (lv30+)
        appliedKitSwaps: [],
        promotedKitSwaps: [],
    });
}

/** Cria instância com kit_swap já aplicado */
function withAppliedKitSwap(speciesId, level = 30) {
    return makeInstance({
        canonSpeciesId: speciesId,
        level,
        unlockedSkillSlots: 4,
        appliedKitSwaps: [{
            slot: 4,
            canonSkillId: 'some_skill',
            replacementId: `${speciesId}_kit_i`,
            action: 'applied_on_level_up',
            originalSkill: null,
        }],
        promotedKitSwaps: [],
    });
}

/** Cria instância com kit_swap promovido */
function withPromotion(speciesId, level = 50) {
    return makeInstance({
        canonSpeciesId: speciesId,
        level,
        unlockedSkillSlots: 4,
        appliedKitSwaps: [{ slot: 4, canonSkillId: 'x', replacementId: 'x_i', action: 'replaced', originalSkill: null }],
        promotedKitSwaps: [{ fromSwapId: 'x_i', toSwapId: 'x_ii', slot: 4, promotedSkill: {} }],
    });
}

// ── applyPendingKitSwaps — casos de sucesso ────────────────────────────────────

describe('applyPendingKitSwaps — aplicação bem-sucedida', () => {
    it('aplica emberfang quando slot 4 recém-desbloqueado', () => {
        const instance = readyForSlot4('emberfang', 30);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps).toHaveLength(1);
        expect(result.appliedKitSwaps[0].slot).toBe(4);
        expect(result.appliedKitSwaps[0].replacementId).toBe('emberfang_brutal_burst');
        expect(result.appliedKitSwaps[0].action).toBe('applied_on_level_up');
        expect(result.appliedKitSwaps[0].originalSkill).toBeNull();
    });

    it('aplica moonquill quando slot 4 desbloqueado', () => {
        const instance = readyForSlot4('moonquill', 30);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('moonquill_arcane_veil');
    });

    it('aplica floracura quando slot 4 desbloqueado', () => {
        const instance = readyForSlot4('floracura', 30);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('floracura_efficient_heal');
    });

    it('aplica shadowsting quando slot 4 desbloqueado', () => {
        const instance = readyForSlot4('shadowsting', 30);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('shadowsting_ambush_strike');
    });

    it('aplica bellwave quando slot 4 desbloqueado', () => {
        const instance = readyForSlot4('bellwave', 30);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('bellwave_discordant_note');
    });

    it('aplica wildpace quando slot 4 desbloqueado', () => {
        const instance = readyForSlot4('wildpace', 30);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('wildpace_rugged_stance');
    });

    it('estrutura do appliedKitSwap tem todos os campos obrigatórios', () => {
        const instance = readyForSlot4('emberfang', 30);
        const result = applyPendingKitSwaps(instance);
        const entry = result.appliedKitSwaps[0];

        expect(entry).toHaveProperty('slot');
        expect(entry).toHaveProperty('canonSkillId');
        expect(entry).toHaveProperty('replacementId');
        expect(entry).toHaveProperty('action');
        expect(entry).toHaveProperty('originalSkill');
        expect(typeof entry.slot).toBe('number');
        expect(typeof entry.canonSkillId).toBe('string');
        expect(typeof entry.replacementId).toBe('string');
        expect(entry.action).toBe('applied_on_level_up');
    });

    it('funciona em nível acima do mínimo (lv45)', () => {
        const instance = readyForSlot4('emberfang', 45);
        const result = applyPendingKitSwaps(instance);

        expect(result.updated).toBe(true);
    });

    it('funciona em nível exatamente no desbloqueio (lv30 para slot 4)', () => {
        const instance = makeInstance({
            canonSpeciesId: 'emberfang',
            level: 30,
            unlockedSkillSlots: 4,
            appliedKitSwaps: [],
            promotedKitSwaps: [],
        });
        expect(applyPendingKitSwaps(instance).updated).toBe(true);
    });

    it('não modifica a instância recebida (função pura)', () => {
        const instance = readyForSlot4('emberfang', 30);
        const originalApplied = [...instance.appliedKitSwaps];
        applyPendingKitSwaps(instance);
        expect(instance.appliedKitSwaps).toEqual(originalApplied);
    });
});

// ── applyPendingKitSwaps — guardas / fallbacks ─────────────────────────────────

describe('applyPendingKitSwaps — guardas e fallbacks', () => {
    it('retorna updated=false para instância sem canonSpeciesId', () => {
        const instance = makeInstance({ canonSpeciesId: null });
        expect(applyPendingKitSwaps(instance)).toEqual({ appliedKitSwaps: [], updated: false });
    });

    it('retorna updated=false para input null', () => {
        expect(applyPendingKitSwaps(null)).toEqual({ appliedKitSwaps: [], updated: false });
    });

    it('retorna updated=false para input undefined', () => {
        expect(applyPendingKitSwaps(undefined)).toEqual({ appliedKitSwaps: [], updated: false });
    });

    it('retorna updated=false para espécie desconhecida', () => {
        const instance = makeInstance({ canonSpeciesId: 'especie_inexistente', unlockedSkillSlots: 4 });
        expect(applyPendingKitSwaps(instance)).toEqual({ appliedKitSwaps: [], updated: false });
    });

    it('retorna updated=false quando kit já está aplicado', () => {
        const instance = withAppliedKitSwap('emberfang', 30);
        expect(applyPendingKitSwaps(instance).updated).toBe(false);
    });

    it('retorna updated=false quando slot 4 ainda não desbloqueado (slots=3)', () => {
        const instance = makeInstance({
            canonSpeciesId: 'emberfang',
            level: 28,
            unlockedSkillSlots: 3, // ainda não tem slot 4
            appliedKitSwaps: [],
        });
        expect(applyPendingKitSwaps(instance).updated).toBe(false);
    });

    it('retorna updated=false quando slot 4 não desbloqueado (slots=1, default)', () => {
        const instance = makeInstance({
            canonSpeciesId: 'emberfang',
            level: 1,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [],
        });
        expect(applyPendingKitSwaps(instance).updated).toBe(false);
    });

    it('não re-aplica se appliedKitSwaps tem entradas (mesmo que irrelevantes)', () => {
        const instance = makeInstance({
            canonSpeciesId: 'emberfang',
            level: 30,
            unlockedSkillSlots: 4,
            appliedKitSwaps: [{ slot: 99, canonSkillId: 'dummy', replacementId: 'dummy_x', action: 'x', originalSkill: null }],
        });
        expect(applyPendingKitSwaps(instance).updated).toBe(false);
    });
});

// ── applyPendingKitSwaps — espécies com slot 1 (shieldhorn / swiftclaw) ────────

describe('applyPendingKitSwaps — espécies com slot 1 (nunca pendentes)', () => {
    it('aplica shieldhorn em slot 1 mesmo com slots=1 (sempre desbloqueado)', () => {
        // shieldhorn usa targetSlot=1, sempre desbloqueado
        const instance = makeInstance({
            canonSpeciesId: 'shieldhorn',
            level: 1,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [],
        });
        const result = applyPendingKitSwaps(instance);
        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('shieldhorn_heavy_strike');
    });

    it('aplica swiftclaw em slot 1 mesmo com slots=1 (sempre desbloqueado)', () => {
        const instance = makeInstance({
            canonSpeciesId: 'swiftclaw',
            level: 1,
            unlockedSkillSlots: 1,
            appliedKitSwaps: [],
        });
        const result = applyPendingKitSwaps(instance);
        expect(result.updated).toBe(true);
        expect(result.appliedKitSwaps[0].replacementId).toBe('swiftclaw_precise_shot');
    });
});

// ── isReadyForKitSwap — retorna true ──────────────────────────────────────────

describe('isReadyForKitSwap — retorna true', () => {
    it('retorna true para emberfang lv30 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 30, unlockedSkillSlots: 4 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true para emberfang lv35 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 35, unlockedSkillSlots: 4 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true para moonquill lv30 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'moonquill', level: 30 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true para floracura lv30 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'floracura', level: 30 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true para shadowsting lv45 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'shadowsting', level: 45 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true para bellwave lv30 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'bellwave', level: 30 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true para wildpace lv99 sem kit', () => {
        const mon = makeInstance({ canonSpeciesId: 'wildpace', level: 99 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });

    it('retorna true exatamente no nível de desbloqueio (lv30)', () => {
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 30 });
        expect(isReadyForKitSwap(mon)).toBe(true);
    });
});

// ── isReadyForKitSwap — retorna false ─────────────────────────────────────────

describe('isReadyForKitSwap — retorna false', () => {
    it('retorna false para shieldhorn (unlockLevel=1 → nunca "pendente")', () => {
        const mon = makeInstance({ canonSpeciesId: 'shieldhorn', level: 1 });
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false para swiftclaw (unlockLevel=1 → nunca "pendente")', () => {
        const mon = makeInstance({ canonSpeciesId: 'swiftclaw', level: 1 });
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false para emberfang lv29 (abaixo do unlock)', () => {
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 29 });
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false para emberfang lv1', () => {
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 1 });
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false quando kit já aplicado', () => {
        const mon = withAppliedKitSwap('emberfang', 30);
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false quando promovido (identidade completa)', () => {
        const mon = withPromotion('emberfang', 50);
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false sem espécie canônica', () => {
        const mon = makeInstance({ canonSpeciesId: null, level: 30 });
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false para espécie desconhecida', () => {
        const mon = makeInstance({ canonSpeciesId: 'especie_estranha', level: 99 });
        expect(isReadyForKitSwap(mon)).toBe(false);
    });

    it('retorna false para null', () => {
        expect(isReadyForKitSwap(null)).toBe(false);
    });

    it('retorna false para undefined', () => {
        expect(isReadyForKitSwap(undefined)).toBe(false);
    });
});

// ── coexistência com Fase 17 (getTeamReadinessIndicator) ──────────────────────

describe('isReadyForKitSwap — coexistência com Fase 17', () => {
    it('monster "ready" não gera near_unlock (está além do limiar de 5 níveis)', async () => {
        const { getTeamReadinessIndicator } = await import('../js/canon/speciesDisplay.js');
        // lv30: exact unlock level — not within "near" range (near_unlock is for lv25-29)
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 30 });
        const readiness = getTeamReadinessIndicator(mon);
        const isReady = isReadyForKitSwap(mon);

        expect(isReady).toBe(true);
        // near_unlock não aparece (nível 30 >= unlockLevel, fora do limiar de "em breve")
        expect(readiness).toBeNull();
    });

    it('monster "near_unlock" não é "ready" (ainda não atingiu o unlock)', async () => {
        const { getTeamReadinessIndicator } = await import('../js/canon/speciesDisplay.js');
        const mon = makeInstance({ canonSpeciesId: 'emberfang', level: 27 });

        expect(getTeamReadinessIndicator(mon)?.state).toBe('near_unlock');
        expect(isReadyForKitSwap(mon)).toBe(false); // ainda não atingiu lv30
    });

    it('monster "complete" não é "ready" (já promovido)', async () => {
        const { getTeamReadinessIndicator } = await import('../js/canon/speciesDisplay.js');
        const mon = withPromotion('emberfang', 55);

        expect(getTeamReadinessIndicator(mon)?.state).toBe('complete');
        expect(isReadyForKitSwap(mon)).toBe(false);
    });
});

// ── transição de estado ────────────────────────────────────────────────────────

describe('transição de estado: bloqueado → pronto → aplicado', () => {
    it('depois de applyPendingKitSwaps, isReadyForKitSwap retorna false', () => {
        const instance = readyForSlot4('emberfang', 30);
        expect(isReadyForKitSwap(instance)).toBe(true);

        // Simular aplicação (mutação que o wrapper faria)
        const result = applyPendingKitSwaps(instance);
        expect(result.updated).toBe(true);
        instance.appliedKitSwaps = [...(instance.appliedKitSwaps || []), ...result.appliedKitSwaps];

        expect(isReadyForKitSwap(instance)).toBe(false);
    });

    it('depois de applyPendingKitSwaps, applyPendingKitSwaps não re-aplica', () => {
        const instance = readyForSlot4('emberfang', 30);
        const firstResult = applyPendingKitSwaps(instance);
        instance.appliedKitSwaps = [...(instance.appliedKitSwaps || []), ...firstResult.appliedKitSwaps];

        const secondResult = applyPendingKitSwaps(instance);
        expect(secondResult.updated).toBe(false);
    });

    it('appliedKitSwap recém-criado é elegível para promoção futura', async () => {
        const { promoteKitSwaps } = await import('../js/canon/kitSwap.js');
        const instance = readyForSlot4('shieldhorn', 1);
        instance.unlockedSkillSlots = 1; // shieldhorn usa slot 1

        const applyResult = applyPendingKitSwaps(instance);
        instance.appliedKitSwaps = [...applyResult.appliedKitSwaps];

        // No nível 1, a promoção (lv20) ainda não é elegível
        const promoResult = promoteKitSwaps(instance);
        expect(promoResult.updated).toBe(false);
        expect(promoResult.blockedKitSwapPromotions[0].reason).toBe('level_not_reached');

        // Simular level up para lv20
        instance.level = 20;
        const promoResult2 = promoteKitSwaps(instance);
        expect(promoResult2.updated).toBe(true);
        expect(promoResult2.promotedKitSwaps[0].toSwapId).toBe('shieldhorn_heavy_strike_ii');
    });
});
