/**
 * TEAM READINESS TELEMETRY TESTS (Fase 17)
 *
 * Testes para getTeamReadinessIndicator() — telemetria leve de prontidão
 * canônica na visão geral da equipe.
 *
 * Cobertura:
 *   - Monstrinho 'complete': kit_swap promovido
 *   - Monstrinho 'near_unlock': dentro de 5 níveis do desbloqueio
 *   - Monstrinho 'near_promo': dentro de 5 níveis da promoção
 *   - Fallback sem espécie canônica (null silencioso)
 *   - Fallback sem marco próximo (longe do threshold)
 *   - Fallback kit_swap no Nv. 1 (sem marco de desbloqueio)
 *   - Casos de borda: exatamente no limiar
 *   - Todas as espécies que têm kitSwapUnlockLevel > 1
 *   - Constante NEAR_MILESTONE_THRESHOLD exportada corretamente
 */

import { describe, it, expect } from 'vitest';
import {
    getTeamReadinessIndicator,
    NEAR_MILESTONE_THRESHOLD,
} from '../js/canon/speciesDisplay.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeMonster(overrides = {}) {
    return {
        name: 'Monstrinho',
        level: 1,
        hp: 50,
        hpMax: 50,
        canonSpeciesId: null,
        appliedKitSwaps: [],
        promotedKitSwaps: [],
        ...overrides,
    };
}

/**
 * Cria monstrinho com kit_swap aplicado (não promovido).
 */
function withKitSwap(speciesId, level) {
    return makeMonster({
        canonSpeciesId: speciesId,
        level,
        appliedKitSwaps: [{ slot: 4, canonSkillId: 'x', replacementId: 'x_i', action: 'replace', originalSkill: null }],
        promotedKitSwaps: [],
    });
}

/**
 * Cria monstrinho com kit_swap promovido.
 */
function withPromotion(speciesId, level) {
    return makeMonster({
        canonSpeciesId: speciesId,
        level,
        appliedKitSwaps: [{ slot: 4, canonSkillId: 'x', replacementId: 'x_i', action: 'replace', originalSkill: null }],
        promotedKitSwaps: [{ slot: 4, fromSwapId: 'x_i', toSwapId: 'x_ii', promotedSkill: {} }],
    });
}

// ── Constante exportada ────────────────────────────────────────────────────────

describe('NEAR_MILESTONE_THRESHOLD', () => {
    it('deve ser 5', () => {
        expect(NEAR_MILESTONE_THRESHOLD).toBe(5);
    });
});

// ── Estado: complete ───────────────────────────────────────────────────────────

describe('getTeamReadinessIndicator — estado "complete"', () => {
    it('retorna complete quando kit_swap está promovido (emberfang lv50)', () => {
        const mon = withPromotion('emberfang', 50);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'complete' });
    });

    it('retorna complete quando kit_swap está promovido (shieldhorn lv20)', () => {
        const mon = withPromotion('shieldhorn', 20);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'complete' });
    });

    it('retorna complete para todas as espécies com promoção aplicada', () => {
        const species = ['emberfang', 'moonquill', 'floracura', 'shadowsting', 'bellwave', 'wildpace'];
        species.forEach(id => {
            const mon = withPromotion(id, 60);
            expect(getTeamReadinessIndicator(mon)).toEqual(
                { state: 'complete' },
                `Esperado 'complete' para ${id}`
            );
        });
    });

    it('retorna complete mesmo em nível alto (lv99)', () => {
        const mon = withPromotion('emberfang', 99);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'complete' });
    });
});

// ── Estado: near_unlock ────────────────────────────────────────────────────────

describe('getTeamReadinessIndicator — estado "near_unlock"', () => {
    it('retorna near_unlock exatamente no limiar inferior (unlockLevel - 5)', () => {
        // emberfang: kitSwapUnlockLevel = 30; dentro do limiar: lv 25..29
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 25, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });

    it('retorna near_unlock um nível antes do desbloqueio (lv29)', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 29, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });

    it('NÃO retorna near_unlock quando está além do limiar (lv24)', () => {
        // lv 24 < (30 - 5) = 25, portanto fora do limiar
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 24, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna near_unlock para moonquill (unlockLevel=30, lv26)', () => {
        const mon = makeMonster({ canonSpeciesId: 'moonquill', level: 26, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });

    it('retorna near_unlock para floracura (unlockLevel=30, lv27)', () => {
        const mon = makeMonster({ canonSpeciesId: 'floracura', level: 27, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });

    it('retorna near_unlock para shadowsting (unlockLevel=30, lv28)', () => {
        const mon = makeMonster({ canonSpeciesId: 'shadowsting', level: 28, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });

    it('retorna near_unlock para bellwave (unlockLevel=30, lv25)', () => {
        const mon = makeMonster({ canonSpeciesId: 'bellwave', level: 25, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });

    it('retorna near_unlock para wildpace (unlockLevel=30, lv29)', () => {
        const mon = makeMonster({ canonSpeciesId: 'wildpace', level: 29, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_unlock', targetLevel: 30 });
    });
});

// ── Estado: near_promo ────────────────────────────────────────────────────────

describe('getTeamReadinessIndicator — estado "near_promo"', () => {
    it('retorna near_promo exatamente no limiar inferior (promoLevel - 5)', () => {
        // emberfang: kitSwapPromoLevel = 50; within threshold: lv 45..49
        const mon = withKitSwap('emberfang', 45);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_promo', targetLevel: 50 });
    });

    it('retorna near_promo um nível antes da promoção (lv49)', () => {
        const mon = withKitSwap('emberfang', 49);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_promo', targetLevel: 50 });
    });

    it('NÃO retorna near_promo quando está além do limiar (lv44)', () => {
        // lv 44 < (50 - 5) = 45, portanto fora do limiar
        const mon = withKitSwap('emberfang', 44);
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna near_promo para shieldhorn (promoLevel=20, lv15)', () => {
        // shieldhorn: kitSwapPromoLevel = 20; threshold: lv 15..19
        const mon = withKitSwap('shieldhorn', 15);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_promo', targetLevel: 20 });
    });

    it('retorna near_promo para shieldhorn (promoLevel=20, lv19)', () => {
        const mon = withKitSwap('shieldhorn', 19);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_promo', targetLevel: 20 });
    });

    it('NÃO retorna near_promo para shieldhorn quando além do limiar (lv14)', () => {
        const mon = withKitSwap('shieldhorn', 14);
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna near_promo para moonquill (promoLevel=50, lv47)', () => {
        const mon = withKitSwap('moonquill', 47);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_promo', targetLevel: 50 });
    });

    it('retorna near_promo para swiftclaw (promoLevel=20, lv16)', () => {
        const mon = withKitSwap('swiftclaw', 16);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'near_promo', targetLevel: 20 });
    });
});

// ── Fallbacks silenciosos ─────────────────────────────────────────────────────

describe('getTeamReadinessIndicator — fallback silencioso (null)', () => {
    it('retorna null para monstrinho sem espécie canônica', () => {
        const mon = makeMonster({ canonSpeciesId: null });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para monstrinho com canonSpeciesId undefined', () => {
        const mon = makeMonster();
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para monstrinho com espécie desconhecida', () => {
        const mon = makeMonster({ canonSpeciesId: 'especie_inexistente' });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para input null', () => {
        expect(getTeamReadinessIndicator(null)).toBeNull();
    });

    it('retorna null para input undefined', () => {
        expect(getTeamReadinessIndicator(undefined)).toBeNull();
    });

    it('retorna null para shieldhorn lv1 SEM kit_swap (unlockLevel=1 → sem marco de unlock)', () => {
        // shieldhorn tem kitSwapUnlockLevel=1: nunca gera near_unlock
        const mon = makeMonster({ canonSpeciesId: 'shieldhorn', level: 1, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para swiftclaw lv1 SEM kit_swap (unlockLevel=1 → sem marco de unlock)', () => {
        const mon = makeMonster({ canonSpeciesId: 'swiftclaw', level: 1, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para emberfang lv1 (longe do desbloqueio no Nv.30)', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 1, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para emberfang lv10 COM kit_swap (longe da promoção no Nv.50)', () => {
        const mon = withKitSwap('emberfang', 10);
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para shieldhorn COM kit_swap lv1 (longe da promoção no Nv.20)', () => {
        const mon = withKitSwap('shieldhorn', 1);
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna null para emberfang lv24 sem kit_swap (fora do limiar de 5 para unlock)', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 24, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });
});

// ── Casos de borda ─────────────────────────────────────────────────────────────

describe('getTeamReadinessIndicator — casos de borda', () => {
    it('NÃO retorna near_unlock quando level === unlockLevel (já deveria ter o kit)', () => {
        // lv 30 não é < 30, portanto não retorna near_unlock
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 30, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('NÃO retorna near_promo quando level === promoLevel (já deveria estar promovido)', () => {
        const mon = withKitSwap('emberfang', 50);
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });

    it('retorna near_unlock para level exatamente em unlockLevel - 1 (lv29)', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 29, appliedKitSwaps: [], promotedKitSwaps: [] });
        const result = getTeamReadinessIndicator(mon);
        expect(result?.state).toBe('near_unlock');
    });

    it('retorna near_promo para level exatamente em promoLevel - 1 (lv49)', () => {
        const mon = withKitSwap('emberfang', 49);
        const result = getTeamReadinessIndicator(mon);
        expect(result?.state).toBe('near_promo');
    });

    it('near_promo tem prioridade sobre near_unlock quando tem kit_swap', () => {
        // Com kit_swap, não verifica unlock — verifica promoção
        const mon = withKitSwap('emberfang', 45);
        const result = getTeamReadinessIndicator(mon);
        expect(result?.state).toBe('near_promo');
        expect(result?.state).not.toBe('near_unlock');
    });

    it('complete tem prioridade sobre near_promo quando promovido', () => {
        // Promovido, mesmo em nível que normalmente geraria near_promo
        const mon = withPromotion('emberfang', 49);
        expect(getTeamReadinessIndicator(mon)).toEqual({ state: 'complete' });
    });

    it('targetLevel é o número correto para near_unlock', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 27, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)?.targetLevel).toBe(30);
    });

    it('targetLevel é o número correto para near_promo', () => {
        const mon = withKitSwap('emberfang', 47);
        expect(getTeamReadinessIndicator(mon)?.targetLevel).toBe(50);
    });

    it('funciona corretamente com level como string numérica', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: '28', appliedKitSwaps: [], promotedKitSwaps: [] });
        const result = getTeamReadinessIndicator(mon);
        expect(result?.state).toBe('near_unlock');
        expect(result?.targetLevel).toBe(30);
    });

    it('usa level mínimo 1 para input inválido (level=0)', () => {
        // level=0 → coerced para 1, longe de threshold
        const mon = makeMonster({ canonSpeciesId: 'emberfang', level: 0, appliedKitSwaps: [], promotedKitSwaps: [] });
        expect(getTeamReadinessIndicator(mon)).toBeNull();
    });
});
