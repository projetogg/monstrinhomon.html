/**
 * SPECIES PROGRESSION TELEMETRY TESTS (Fase 16)
 *
 * Testes para a telemetria leve de progressão da identidade canônica.
 * Garante que o campo `nextMilestone` de getSpeciesDisplayInfo() comunica
 * corretamente o próximo marco da espécie ao jogador.
 *
 * Cobertura:
 *   - Kit swap ainda bloqueado (slot 4, nível < 30) → mostra "desbloqueia no Nv. 30"
 *   - Kit swap de slot 1 (sempre disponível) sem kit_swap aplicado → sem marco de desbloqueio
 *   - Kit swap aplicado mas não promovido (nível < promoLevel) → mostra "Promoção no Nv. X"
 *   - Kit swap promovido → nextMilestone null (sem próximo marco)
 *   - Sem espécie canônica → nextMilestone null (fallback limpo)
 *   - Nível exatamente no threshold → comportamento de borda correto
 *   - Todas as 8 espécies com progressão consistente
 */

import { describe, it, expect } from 'vitest';
import { getSpeciesDisplayInfo } from '../js/canon/speciesDisplay.js';

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

function withKitSwap(speciesId, level = 1) {
    return makeMonster({
        canonSpeciesId: speciesId,
        level,
        appliedKitSwaps: [{ slot: 4, canonSkillId: `${speciesId}_skill`, replacementId: `${speciesId}_kit_i`, action: 'replace', originalSkill: null }],
        promotedKitSwaps: [],
    });
}

function withPromotion(speciesId, level = 50) {
    return makeMonster({
        canonSpeciesId: speciesId,
        level,
        appliedKitSwaps: [{ slot: 4, canonSkillId: `${speciesId}_skill`, replacementId: `${speciesId}_kit_i`, action: 'replace', originalSkill: null }],
        promotedKitSwaps: [{ slot: 4, fromSwapId: `${speciesId}_kit_i`, toSwapId: `${speciesId}_kit_ii`, promotedSkill: {} }],
    });
}

function noKitSwap(speciesId, level = 1) {
    return makeMonster({ canonSpeciesId: speciesId, level, appliedKitSwaps: [], promotedKitSwaps: [] });
}

// ── Espécies com slot 4 (desbloqueado no Nv. 30) ──────────────────────────────

const SLOT4_SPECIES = ['emberfang', 'moonquill', 'floracura', 'shadowsting', 'bellwave', 'wildpace'];

describe('Fase 16 — telemetria de progressão: espécies com slot 4 (unlock Nv. 30)', () => {

    SLOT4_SPECIES.forEach(species => {
        describe(`${species}`, () => {
            it('sem kit_swap, nível 1 → nextMilestone indica desbloqueio no Nv. 30', () => {
                const mon = noKitSwap(species, 1);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBe('Habilidade especial desbloqueia no Nv. 30');
            });

            it('sem kit_swap, nível 29 → nextMilestone ainda indica desbloqueio', () => {
                const mon = noKitSwap(species, 29);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBe('Habilidade especial desbloqueia no Nv. 30');
            });

            it('sem kit_swap, nível exato 30 → sem marco de desbloqueio (já disponível)', () => {
                const mon = noKitSwap(species, 30);
                const info = getSpeciesDisplayInfo(mon);
                // Slot desbloqueado, kit_swap não aplicado ainda — sem marco de desbloqueio
                expect(info.nextMilestone).toBeNull();
            });

            it('kit_swap aplicado, nível 30 → nextMilestone indica promoção no Nv. 50', () => {
                const mon = withKitSwap(species, 30);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBe('Promoção no Nv. 50');
            });

            it('kit_swap aplicado, nível 49 → nextMilestone ainda indica promoção no Nv. 50', () => {
                const mon = withKitSwap(species, 49);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBe('Promoção no Nv. 50');
            });

            it('kit_swap aplicado, nível exato 50 → nextMilestone null (promoção disponível)', () => {
                const mon = withKitSwap(species, 50);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBeNull();
            });

            it('kit_swap promovido → nextMilestone null (sem próximo marco)', () => {
                const mon = withPromotion(species, 50);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.isPromoted).toBe(true);
                expect(info.nextMilestone).toBeNull();
            });
        });
    });
});

// ── Espécies com slot 1 (desbloqueado no Nv. 1) ───────────────────────────────

describe('Fase 16 — espécies com slot 1 (shieldhorn, swiftclaw)', () => {

    ['shieldhorn', 'swiftclaw'].forEach(species => {
        describe(`${species}`, () => {
            it('sem kit_swap, nível 1 → sem marco de desbloqueio (slot 1 já disponível)', () => {
                const mon = noKitSwap(species, 1);
                const info = getSpeciesDisplayInfo(mon);
                // Slot 1 está sempre desbloqueado (unlockLevel=1), sem marco a mostrar
                expect(info.nextMilestone).toBeNull();
            });

            it('kit_swap aplicado, nível 1 → nextMilestone indica promoção no Nv. 20', () => {
                const mon = withKitSwap(species, 1);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBe('Promoção no Nv. 20');
            });

            it('kit_swap aplicado, nível 19 → nextMilestone ainda indica promoção no Nv. 20', () => {
                const mon = withKitSwap(species, 19);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBe('Promoção no Nv. 20');
            });

            it('kit_swap aplicado, nível exato 20 → nextMilestone null', () => {
                const mon = withKitSwap(species, 20);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.nextMilestone).toBeNull();
            });

            it('kit_swap promovido → nextMilestone null', () => {
                const mon = withPromotion(species, 20);
                const info = getSpeciesDisplayInfo(mon);
                expect(info.isPromoted).toBe(true);
                expect(info.nextMilestone).toBeNull();
            });
        });
    });
});

// ── Fallbacks ─────────────────────────────────────────────────────────────────

describe('Fase 16 — fallback sem espécie canônica', () => {
    it('mon null → nextMilestone null', () => {
        const info = getSpeciesDisplayInfo(null);
        expect(info.hasSpecies).toBe(false);
        expect(info.nextMilestone).toBeNull();
    });

    it('mon undefined → nextMilestone null', () => {
        const info = getSpeciesDisplayInfo(undefined);
        expect(info.hasSpecies).toBe(false);
        expect(info.nextMilestone).toBeNull();
    });

    it('mon sem canonSpeciesId → nextMilestone null', () => {
        const info = getSpeciesDisplayInfo(makeMonster({ canonSpeciesId: null }));
        expect(info.hasSpecies).toBe(false);
        expect(info.nextMilestone).toBeNull();
    });

    it('canonSpeciesId desconhecido → nextMilestone null', () => {
        const info = getSpeciesDisplayInfo(makeMonster({ canonSpeciesId: 'especie_inexistente' }));
        expect(info.hasSpecies).toBe(false);
        expect(info.nextMilestone).toBeNull();
    });
});

// ── Regressão: campos existentes de Fase 15 preservados ───────────────────────

describe('Fase 16 — regressão Fase 15: campos existentes não afetados', () => {
    it('emberfang com kit_swap aplicado ainda retorna todos os campos Fase 15', () => {
        const mon = withKitSwap('emberfang', 35);
        const info = getSpeciesDisplayInfo(mon);
        expect(info.hasSpecies).toBe(true);
        expect(info.speciesLabel).toBe('Emberfang');
        expect(info.archetype).toBe('Bárbaro explosivo');
        expect(info.passiveName).toBe('Fúria Crescente');
        expect(info.passiveDesc).toBeTruthy();
        expect(info.hasKitSwap).toBe(true);
        expect(info.kitSwapName).toBe('Explosão Bruta I');
        expect(info.isPromoted).toBe(false);
    });

    it('shieldhorn promovido ainda retorna todos os campos Fase 15', () => {
        const mon = withPromotion('shieldhorn', 25);
        const info = getSpeciesDisplayInfo(mon);
        expect(info.hasSpecies).toBe(true);
        expect(info.speciesLabel).toBe('Shieldhorn');
        expect(info.isPromoted).toBe(true);
        expect(info.kitSwapName).toBe('Golpe Pesado II');
    });

    it('getSpeciesDisplayInfo sem espécie ainda retorna todos os campos Fase 15 em false/null', () => {
        const info = getSpeciesDisplayInfo(null);
        expect(info.hasSpecies).toBe(false);
        expect(info.speciesLabel).toBeNull();
        expect(info.archetype).toBeNull();
        expect(info.passiveName).toBeNull();
        expect(info.passiveDesc).toBeNull();
        expect(info.hasKitSwap).toBe(false);
        expect(info.kitSwapName).toBeNull();
        expect(info.isPromoted).toBe(false);
        expect(info.nextMilestone).toBeNull();
    });
});
