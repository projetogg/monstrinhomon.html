/**
 * SPECIES IDENTITY DISPLAY TESTS (Fase 15)
 *
 * Testes para o módulo de exibição de identidade canônica fora do combate.
 * Garante que espécie, passiva, kit_swap e promoção ficam visíveis e legíveis.
 *
 * Cobertura:
 *   - getSpeciesDisplayInfo(): retorno correto para cada espécie canônica
 *   - Fallback para monstrinhos sem espécie canônica
 *   - Detecção de kit_swap aplicado (base)
 *   - Detecção de kit_swap promovido (nível II)
 *   - Ausência de kit_swap (slot ainda não desbloqueado)
 *   - getDisplayedSpeciesIds(): lista todas as 8 espécies
 *   - getSpeciesDisplayTable(): retorna tabela completa
 *   - Robustez: inputs null/undefined não quebram a função
 */

import { describe, it, expect } from 'vitest';
import {
    getSpeciesDisplayInfo,
    getSpeciesDisplayTable,
    getDisplayedSpeciesIds,
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

// Kit swap aplicado (base) — simula appliedKitSwaps com 1 entrada
function withAppliedKitSwap(speciesId) {
    return {
        canonSpeciesId: speciesId,
        appliedKitSwaps: [
            { slot: 4, canonSkillId: `${speciesId}_skill`, replacementId: `${speciesId}_kit_i`, action: 'replace', originalSkill: null },
        ],
        promotedKitSwaps: [],
    };
}

// Kit swap promovido — simula appliedKitSwaps + promotedKitSwaps com 1 entrada cada
function withPromotedKitSwap(speciesId) {
    return {
        canonSpeciesId: speciesId,
        appliedKitSwaps: [
            { slot: 4, canonSkillId: `${speciesId}_skill`, replacementId: `${speciesId}_kit_i`, action: 'replace', originalSkill: null },
        ],
        promotedKitSwaps: [
            { slot: 4, fromSwapId: `${speciesId}_kit_i`, toSwapId: `${speciesId}_kit_ii`, promotedSkill: {} },
        ],
    };
}

// ── Testes de fallback ─────────────────────────────────────────────────────────

describe('getSpeciesDisplayInfo — fallback sem espécie (Fase 15)', () => {
    it('retorna hasSpecies=false para mon null', () => {
        const result = getSpeciesDisplayInfo(null);
        expect(result.hasSpecies).toBe(false);
        expect(result.speciesLabel).toBeNull();
        expect(result.archetype).toBeNull();
        expect(result.passiveName).toBeNull();
        expect(result.passiveDesc).toBeNull();
        expect(result.hasKitSwap).toBe(false);
        expect(result.kitSwapName).toBeNull();
        expect(result.isPromoted).toBe(false);
    });

    it('retorna hasSpecies=false para mon undefined', () => {
        const result = getSpeciesDisplayInfo(undefined);
        expect(result.hasSpecies).toBe(false);
    });

    it('retorna hasSpecies=false para mon sem canonSpeciesId', () => {
        const mon = makeMonster({ canonSpeciesId: null });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(false);
    });

    it('retorna hasSpecies=false para canonSpeciesId desconhecido', () => {
        const mon = makeMonster({ canonSpeciesId: 'especie_inexistente' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(false);
    });

    it('não lança exceção para objeto vazio', () => {
        expect(() => getSpeciesDisplayInfo({})).not.toThrow();
        const result = getSpeciesDisplayInfo({});
        expect(result.hasSpecies).toBe(false);
    });
});

// ── Testes por espécie ─────────────────────────────────────────────────────────

describe('getSpeciesDisplayInfo — shieldhorn (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'shieldhorn' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Shieldhorn');
        expect(result.archetype).toBe('Guerreiro resistente');
        expect(result.passiveName).toBe('Escudo Territorial');
        expect(result.passiveDesc).toContain('primeiro golpe');
    });

    it('kit_swap base: nome correto e não promovido', () => {
        const mon = makeMonster(withAppliedKitSwap('shieldhorn'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasKitSwap).toBe(true);
        expect(result.kitSwapName).toBe('Golpe Pesado I');
        expect(result.isPromoted).toBe(false);
    });

    it('kit_swap promovido: nome II e isPromoted=true', () => {
        const mon = makeMonster(withPromotedKitSwap('shieldhorn'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasKitSwap).toBe(true);
        expect(result.kitSwapName).toBe('Golpe Pesado II');
        expect(result.isPromoted).toBe(true);
    });

    it('sem kit_swap: hasKitSwap=false e kitSwapName=null', () => {
        const mon = makeMonster({ canonSpeciesId: 'shieldhorn', appliedKitSwaps: [], promotedKitSwaps: [] });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasKitSwap).toBe(false);
        expect(result.kitSwapName).toBeNull();
        expect(result.isPromoted).toBe(false);
    });
});

describe('getSpeciesDisplayInfo — emberfang (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'emberfang' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Emberfang');
        expect(result.archetype).toBe('Bárbaro explosivo');
        expect(result.passiveName).toBe('Fúria Crescente');
        expect(result.passiveDesc).toContain('habilidade ofensiva');
    });

    it('kit_swap base: Explosão Bruta I', () => {
        const mon = makeMonster(withAppliedKitSwap('emberfang'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Explosão Bruta I');
        expect(result.isPromoted).toBe(false);
    });

    it('kit_swap promovido: Explosão Bruta II', () => {
        const mon = makeMonster(withPromotedKitSwap('emberfang'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Explosão Bruta II');
        expect(result.isPromoted).toBe(true);
    });
});

describe('getSpeciesDisplayInfo — moonquill (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'moonquill' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Moonquill');
        expect(result.archetype).toBe('Mago controlador');
        expect(result.passiveName).toBe('Controle Arcano');
        expect(result.passiveDesc).toContain('velocidade');
    });

    it('kit_swap base: Véu Arcano I', () => {
        const mon = makeMonster(withAppliedKitSwap('moonquill'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Véu Arcano I');
    });

    it('kit_swap promovido: Véu Arcano II', () => {
        const mon = makeMonster(withPromotedKitSwap('moonquill'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Véu Arcano II');
        expect(result.isPromoted).toBe(true);
    });
});

describe('getSpeciesDisplayInfo — floracura (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'floracura' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Floracura');
        expect(result.archetype).toBe('Curandeiro eficiente');
        expect(result.passiveName).toBe('Cura Eficiente');
        expect(result.passiveDesc).toContain('primeira cura');
    });

    it('kit_swap base: Cura Eficiente I', () => {
        const mon = makeMonster(withAppliedKitSwap('floracura'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Cura Eficiente I');
    });

    it('kit_swap promovido: Cura Eficiente II', () => {
        const mon = makeMonster(withPromotedKitSwap('floracura'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Cura Eficiente II');
        expect(result.isPromoted).toBe(true);
    });
});

describe('getSpeciesDisplayInfo — swiftclaw (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'swiftclaw' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Swiftclaw');
        expect(result.archetype).toBe('Caçador veloz');
        expect(result.passiveName).toBe('Primeiro Ataque');
        expect(result.passiveDesc).toContain('primeiro golpe');
    });

    it('kit_swap base: Flecha Certeira I', () => {
        const mon = makeMonster(withAppliedKitSwap('swiftclaw'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Flecha Certeira I');
    });

    it('kit_swap promovido: Flecha Certeira II', () => {
        const mon = makeMonster(withPromotedKitSwap('swiftclaw'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Flecha Certeira II');
        expect(result.isPromoted).toBe(true);
    });
});

describe('getSpeciesDisplayInfo — shadowsting (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'shadowsting' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Shadowsting');
        expect(result.archetype).toBe('Ladino oportunista');
        expect(result.passiveName).toBe('Golpe Furtivo');
        expect(result.passiveDesc).toContain('debuff');
    });

    it('kit_swap base: Golpe Furtivo I', () => {
        const mon = makeMonster(withAppliedKitSwap('shadowsting'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Golpe Furtivo I');
    });

    it('kit_swap promovido: Golpe Furtivo II', () => {
        const mon = makeMonster(withPromotedKitSwap('shadowsting'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Golpe Furtivo II');
        expect(result.isPromoted).toBe(true);
    });
});

describe('getSpeciesDisplayInfo — bellwave (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'bellwave' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Bellwave');
        expect(result.archetype).toBe('Bardo rítmico');
        expect(result.passiveName).toBe('Cadência Rítmica');
        expect(result.passiveDesc).toContain('ritmo');
    });

    it('kit_swap base: Nota Discordante I', () => {
        const mon = makeMonster(withAppliedKitSwap('bellwave'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Nota Discordante I');
    });

    it('kit_swap promovido: Nota Discordante II', () => {
        const mon = makeMonster(withPromotedKitSwap('bellwave'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Nota Discordante II');
        expect(result.isPromoted).toBe(true);
    });
});

describe('getSpeciesDisplayInfo — wildpace (Fase 15)', () => {
    it('retorna dados corretos de display', () => {
        const mon = makeMonster({ canonSpeciesId: 'wildpace' });
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.speciesLabel).toBe('Wildpace');
        expect(result.archetype).toBe('Animalista adaptável');
        expect(result.passiveName).toBe('Instinto Selvagem');
        expect(result.passiveDesc).toContain('HP baixo');
    });

    it('kit_swap base: Instinto Protetor I', () => {
        const mon = makeMonster(withAppliedKitSwap('wildpace'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Instinto Protetor I');
    });

    it('kit_swap promovido: Instinto Protetor II', () => {
        const mon = makeMonster(withPromotedKitSwap('wildpace'));
        const result = getSpeciesDisplayInfo(mon);
        expect(result.kitSwapName).toBe('Instinto Protetor II');
        expect(result.isPromoted).toBe(true);
    });
});

// ── Testes de integridade da tabela ───────────────────────────────────────────

describe('getDisplayedSpeciesIds — cobertura de espécies (Fase 15)', () => {
    it('retorna os 8 IDs de espécie canônica', () => {
        const ids = getDisplayedSpeciesIds();
        expect(ids).toHaveLength(8);
        expect(ids).toContain('shieldhorn');
        expect(ids).toContain('emberfang');
        expect(ids).toContain('moonquill');
        expect(ids).toContain('floracura');
        expect(ids).toContain('swiftclaw');
        expect(ids).toContain('shadowsting');
        expect(ids).toContain('bellwave');
        expect(ids).toContain('wildpace');
    });
});

describe('getSpeciesDisplayTable — integridade de dados (Fase 15)', () => {
    const table = getSpeciesDisplayTable();

    it('todas as espécies têm campos obrigatórios preenchidos', () => {
        const requiredFields = ['label', 'archetype', 'passiveName', 'passiveDesc', 'kitSwapBaseName', 'kitSwapPromoName'];
        for (const [speciesId, entry] of Object.entries(table)) {
            for (const field of requiredFields) {
                expect(entry[field], `${speciesId}.${field} deve ser string não vazia`).toBeTruthy();
                expect(typeof entry[field]).toBe('string');
            }
        }
    });

    it('kitSwapPromoName sempre termina com "II"', () => {
        for (const [speciesId, entry] of Object.entries(table)) {
            expect(entry.kitSwapPromoName, `${speciesId}.kitSwapPromoName deve terminar com II`).toMatch(/II$/);
        }
    });

    it('kitSwapBaseName sempre termina com "I" mas não com "II"', () => {
        for (const [speciesId, entry] of Object.entries(table)) {
            expect(entry.kitSwapBaseName, `${speciesId}.kitSwapBaseName deve terminar com I e não com II`)
                .toMatch(/I$/);
            expect(entry.kitSwapBaseName, `${speciesId}.kitSwapBaseName não deve terminar com II`)
                .not.toMatch(/II$/);
        }
    });
});

// ── Testes de retrocompatibilidade ────────────────────────────────────────────

describe('getSpeciesDisplayInfo — retrocompatibilidade (Fase 15)', () => {
    it('funciona se appliedKitSwaps estiver ausente (campo legado)', () => {
        const mon = { canonSpeciesId: 'shieldhorn' }; // sem appliedKitSwaps
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.hasKitSwap).toBe(false);
        expect(result.kitSwapName).toBeNull();
    });

    it('funciona se promotedKitSwaps estiver ausente', () => {
        const mon = {
            canonSpeciesId: 'emberfang',
            appliedKitSwaps: [{ slot: 4 }],
            // sem promotedKitSwaps
        };
        const result = getSpeciesDisplayInfo(mon);
        expect(result.hasSpecies).toBe(true);
        expect(result.isPromoted).toBe(false);
        expect(result.kitSwapName).toBe('Explosão Bruta I');
    });

    it('promoção sem kit aplicado ainda indica isPromoted=true e usa nome II', () => {
        // Edge case: promotedKitSwaps existe mas appliedKitSwaps está vazio
        const mon = {
            canonSpeciesId: 'wildpace',
            appliedKitSwaps: [],
            promotedKitSwaps: [{ slot: 4 }],
        };
        const result = getSpeciesDisplayInfo(mon);
        expect(result.isPromoted).toBe(true);
        expect(result.kitSwapName).toBe('Instinto Protetor II');
        expect(result.hasKitSwap).toBe(true);
    });
});
