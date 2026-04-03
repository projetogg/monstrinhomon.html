/**
 * KIT SWAP TESTS (Fase 6)
 *
 * Testes para js/canon/kitSwap.js
 * Cobertura:
 *  - applyKitSwaps: espécie com swap válido (replace e add)
 *  - applyKitSwaps: espécie sem swap definido → fallback
 *  - applyKitSwaps: slot bloqueado → blockedKitSwaps
 *  - applyKitSwaps: instância sem canonSpeciesId → fallback
 *  - applyKitSwaps: skills vazias → add seguro
 *  - metadados de observabilidade (appliedKitSwaps, blockedKitSwaps)
 *  - hasKitSwap: verificação de espécies com/sem swap
 *  - getActiveKitSwapIds: lista de espécies com swap implementado
 *  - KIT_SWAP_SOURCE: rastreabilidade
 *  - ausência de regressão no kit legado
 *  - integridade dos campos de replacement skill
 */

import { describe, it, expect } from 'vitest';
import {
    applyKitSwaps,
    hasKitSwap,
    getActiveKitSwapIds,
    KIT_SWAP_SOURCE,
} from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Helpers para construir instâncias de teste
// ---------------------------------------------------------------------------

/**
 * Cria uma instância mínima válida para testes.
 * @param {object} overrides - Campos a sobrescrever.
 */
function makeInstance(overrides = {}) {
    return {
        canonSpeciesId: null,
        unlockedSkillSlots: 1,
        ...overrides,
    };
}

/**
 * Skills legadas típicas de um Guerreiro nível 1 (2 skills base).
 */
const HABILIDADES_BASE_GUERREIRO = [
    { name: 'Golpe de Espada I', type: 'DAMAGE', cost: 4, power: 18 },
    { name: 'Escudo I',          type: 'BUFF',   cost: 4, power: 2  },
];

/**
 * Skills legadas típicas de um Bárbaro nível 1 (2 skills base, sem slot 4).
 */
const HABILIDADES_BASE_BARBARO = [
    { name: 'Fúria I',        type: 'BUFF',   cost: 4, power: 3  },
    { name: 'Golpe Brutal I', type: 'DAMAGE', cost: 6, power: 24 },
];

/**
 * Skills legadas típicas de um Mago nível 1 (2 skills base, sem slot 4).
 */
const HABILIDADES_BASE_MAGO = [
    { name: 'Magia Elemental I',  type: 'DAMAGE', cost: 4, power: 20 },
    { name: 'Explosão Elemental I', type: 'DAMAGE', cost: 6, power: 24 },
];

/**
 * Skills legadas típicas de um Curandeiro nível 1 (2 skills base, sem slot 4).
 */
const HABILIDADES_BASE_CURANDEIRO = [
    { name: 'Cura I',    type: 'HEAL', cost: 5, power: 15 },
    { name: 'Bênção I',  type: 'BUFF', cost: 4, power: 2  },
];

// ---------------------------------------------------------------------------
// Testes: applyKitSwaps — shieldhorn (slot 1, sempre desbloqueado)
// ---------------------------------------------------------------------------
describe('applyKitSwaps — shieldhorn (Guerreiro, slot 1)', () => {

    it('deve substituir slot 1 com Golpe Pesado quando slot desbloqueado', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        // Slot 1 (índice 0) deve ser a skill de swap
        expect(result.skills[0].name).toBe('Golpe Pesado I');
        expect(result.skills[0].type).toBe('DAMAGE');
        expect(result.skills[0].cost).toBe(6);
        expect(result.skills[0].power).toBe(22);
        expect(result.skills[0]._kitSwapId).toBe('shieldhorn_heavy_strike');
    });

    it('deve preservar o slot 2 inalterado após substituição do slot 1', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        // Slot 2 (índice 1) não deve ser alterado
        expect(result.skills[1].name).toBe('Escudo I');
        expect(result.skills.length).toBe(2);
    });

    it('deve registrar swap como "replaced" em appliedKitSwaps', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        expect(result.appliedKitSwaps).toHaveLength(1);
        const swap = result.appliedKitSwaps[0];
        expect(swap.slot).toBe(1);
        expect(swap.canonSkillId).toBe('warrior_basic_strike');
        expect(swap.replacementId).toBe('shieldhorn_heavy_strike');
        expect(swap.action).toBe('replaced');
        expect(swap.originalSkill).toBe('Golpe de Espada I'); // nome da skill original
    });

    it('deve retornar blockedKitSwaps vazio quando swap aplicado', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        expect(result.blockedKitSwaps).toHaveLength(0);
    });

    it('deve funcionar mesmo com múltiplos slots desbloqueados (slot 1 ainda é substituído)', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        expect(result.skills[0].name).toBe('Golpe Pesado I');
    });

    it('deve não mutar o array de skills original', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const originalSkills = HABILIDADES_BASE_GUERREIRO.slice();
        applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        // Array original não deve ser modificado
        expect(HABILIDADES_BASE_GUERREIRO[0].name).toBe(originalSkills[0].name);
    });
});

// ---------------------------------------------------------------------------
// Testes: applyKitSwaps — emberfang (slot 4, requer nível 30)
// ---------------------------------------------------------------------------
describe('applyKitSwaps — emberfang (Bárbaro, slot 4)', () => {

    it('deve bloquear swap quando unlockedSkillSlots < 4 (nível baixo)', () => {
        const instance = makeInstance({ canonSpeciesId: 'emberfang', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_BARBARO);

        // Skills inalteradas
        expect(result.skills).toEqual(HABILIDADES_BASE_BARBARO);
        expect(result.appliedKitSwaps).toHaveLength(0);
    });

    it('deve registrar blockedKitSwaps quando slot 4 não desbloqueado', () => {
        const instance = makeInstance({ canonSpeciesId: 'emberfang', unlockedSkillSlots: 3 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_BARBARO);

        expect(result.blockedKitSwaps).toHaveLength(1);
        const blocked = result.blockedKitSwaps[0];
        expect(blocked.slot).toBe(4);
        expect(blocked.canonSkillId).toBe('barbarian_berserk');
        expect(blocked.reason).toBe('slot_not_unlocked');
        expect(blocked.requiredSlots).toBe(4);
        expect(blocked.currentSlots).toBe(3);
    });

    it('deve adicionar Explosão Bruta no slot 4 quando desbloqueado (nível 30)', () => {
        const instance = makeInstance({ canonSpeciesId: 'emberfang', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_BARBARO);

        // Skills originais preservadas nos primeiros slots
        expect(result.skills[0].name).toBe('Fúria I');
        expect(result.skills[1].name).toBe('Golpe Brutal I');

        // Slot 4 (índice 3) adicionado com a skill canônica
        expect(result.skills[3].name).toBe('Explosão Bruta I');
        expect(result.skills[3].type).toBe('DAMAGE');
        expect(result.skills[3].cost).toBe(8);
        expect(result.skills[3].power).toBe(32);
        expect(result.skills[3]._kitSwapId).toBe('emberfang_brutal_burst');
    });

    it('deve registrar swap como "added" quando slot não existia no array', () => {
        const instance = makeInstance({ canonSpeciesId: 'emberfang', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_BARBARO);

        expect(result.appliedKitSwaps).toHaveLength(1);
        const swap = result.appliedKitSwaps[0];
        expect(swap.slot).toBe(4);
        expect(swap.action).toBe('added');
        expect(swap.originalSkill).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Testes: applyKitSwaps — moonquill (slot 4, requer nível 30)
// ---------------------------------------------------------------------------
describe('applyKitSwaps — moonquill (Mago, slot 4)', () => {

    it('deve bloquear swap quando slot 4 não desbloqueado', () => {
        const instance = makeInstance({ canonSpeciesId: 'moonquill', unlockedSkillSlots: 2 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_MAGO);

        expect(result.skills).toEqual(HABILIDADES_BASE_MAGO);
        expect(result.blockedKitSwaps).toHaveLength(1);
        expect(result.blockedKitSwaps[0].canonSkillId).toBe('mage_arcane_storm');
    });

    it('deve adicionar Véu Arcano no slot 4 quando desbloqueado', () => {
        const instance = makeInstance({ canonSpeciesId: 'moonquill', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_MAGO);

        expect(result.skills[3].name).toBe('Véu Arcano I');
        expect(result.skills[3].type).toBe('BUFF');
        expect(result.skills[3].cost).toBe(4);
        expect(result.skills[3].target).toBe('enemy');
        expect(result.skills[3].duration).toBe(2);
        expect(result.skills[3]._kitSwapId).toBe('moonquill_arcane_veil');
    });

    it('deve preservar skills base de Mago nos primeiros slots', () => {
        const instance = makeInstance({ canonSpeciesId: 'moonquill', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_MAGO);

        expect(result.skills[0].name).toBe('Magia Elemental I');
        expect(result.skills[1].name).toBe('Explosão Elemental I');
    });
});

// ---------------------------------------------------------------------------
// Testes: applyKitSwaps — floracura (slot 4, requer nível 30)
// ---------------------------------------------------------------------------
describe('applyKitSwaps — floracura (Curandeiro, slot 4)', () => {

    it('deve bloquear swap quando slot 4 não desbloqueado', () => {
        const instance = makeInstance({ canonSpeciesId: 'floracura', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_CURANDEIRO);

        expect(result.skills).toEqual(HABILIDADES_BASE_CURANDEIRO);
        expect(result.blockedKitSwaps[0].canonSkillId).toBe('healer_group_heal');
    });

    it('deve adicionar Cura Eficiente no slot 4 quando desbloqueado', () => {
        const instance = makeInstance({ canonSpeciesId: 'floracura', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_CURANDEIRO);

        expect(result.skills[3].name).toBe('Cura Eficiente I');
        expect(result.skills[3].type).toBe('HEAL');
        expect(result.skills[3].cost).toBe(3);
        expect(result.skills[3].power).toBe(10);
        expect(result.skills[3].target).toBe('ally');
        expect(result.skills[3]._kitSwapId).toBe('floracura_efficient_heal');
    });

    it('deve preservar skills base de Curandeiro nos primeiros slots', () => {
        const instance = makeInstance({ canonSpeciesId: 'floracura', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_CURANDEIRO);

        expect(result.skills[0].name).toBe('Cura I');
        expect(result.skills[1].name).toBe('Bênção I');
    });
});

// ---------------------------------------------------------------------------
// Testes: fallback — sem espécie canônica
// ---------------------------------------------------------------------------
describe('applyKitSwaps — fallback sem canonSpeciesId', () => {

    it('deve retornar kit legado inalterado quando canonSpeciesId é null', () => {
        const instance = makeInstance({ canonSpeciesId: null, unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        expect(result.skills).toEqual(HABILIDADES_BASE_GUERREIRO);
        expect(result.appliedKitSwaps).toHaveLength(0);
        expect(result.blockedKitSwaps).toHaveLength(0);
    });

    it('deve retornar kit legado inalterado quando instance é null', () => {
        const result = applyKitSwaps(null, HABILIDADES_BASE_GUERREIRO);

        expect(result.skills).toEqual(HABILIDADES_BASE_GUERREIRO);
        expect(result.appliedKitSwaps).toHaveLength(0);
        expect(result.blockedKitSwaps).toHaveLength(0);
    });

    it('deve retornar kit legado inalterado quando espécie não tem swap definido', () => {
        // Espécie canônica válida mas sem entrada no KIT_SWAP_TABLE
        const instance = makeInstance({ canonSpeciesId: 'especie_desconhecida', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        expect(result.skills).toEqual(HABILIDADES_BASE_GUERREIRO);
        expect(result.appliedKitSwaps).toHaveLength(0);
        expect(result.blockedKitSwaps).toHaveLength(0);
    });

    it('deve retornar array vazio de skills quando input é array vazio e sem espécie', () => {
        const instance = makeInstance({ canonSpeciesId: null });
        const result = applyKitSwaps(instance, []);

        expect(result.skills).toEqual([]);
    });

    it('deve retornar array vazio de skills quando skills é undefined e sem espécie', () => {
        const instance = makeInstance({ canonSpeciesId: null });
        const result = applyKitSwaps(instance, undefined);

        expect(result.skills).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// Testes: fallback — skills vazias com espécie válida
// ---------------------------------------------------------------------------
describe('applyKitSwaps — skills vazias com espécie válida', () => {

    it('shieldhorn com array vazio deve adicionar skill no slot 1 (índice 0)', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result = applyKitSwaps(instance, []);

        expect(result.skills).toHaveLength(1);
        expect(result.skills[0].name).toBe('Golpe Pesado I');
        expect(result.appliedKitSwaps[0].action).toBe('added');
    });

    it('emberfang com array vazio e slot 4 desbloqueado deve adicionar skill corretamente', () => {
        const instance = makeInstance({ canonSpeciesId: 'emberfang', unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, []);

        // Slot 4 = índice 3 → deve haver 4 elementos (3 null + 1 skill)
        expect(result.skills).toHaveLength(4);
        expect(result.skills[3].name).toBe('Explosão Bruta I');
    });
});

// ---------------------------------------------------------------------------
// Testes: imutabilidade dos objetos de substituição
// ---------------------------------------------------------------------------
describe('applyKitSwaps — imutabilidade dos replacements', () => {

    it('modificar skill retornada não deve afetar chamadas futuras', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result1 = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        // Modificar a skill retornada
        result1.skills[0].power = 999;

        // Segunda chamada deve retornar skill original (não mutada)
        const result2 = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);
        expect(result2.skills[0].power).toBe(22);
    });
});

// ---------------------------------------------------------------------------
// Testes: hasKitSwap
// ---------------------------------------------------------------------------
describe('hasKitSwap', () => {

    it('deve retornar true para shieldhorn', () => {
        expect(hasKitSwap('shieldhorn')).toBe(true);
    });

    it('deve retornar true para emberfang', () => {
        expect(hasKitSwap('emberfang')).toBe(true);
    });

    it('deve retornar true para moonquill', () => {
        expect(hasKitSwap('moonquill')).toBe(true);
    });

    it('deve retornar true para floracura', () => {
        expect(hasKitSwap('floracura')).toBe(true);
    });

    it('deve retornar false para espécie sem swap definido', () => {
        expect(hasKitSwap('especie_inexistente')).toBe(false);
    });

    it('deve retornar false para null', () => {
        expect(hasKitSwap(null)).toBe(false);
    });

    it('deve retornar false para undefined', () => {
        expect(hasKitSwap(undefined)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Testes: getActiveKitSwapIds
// ---------------------------------------------------------------------------
describe('getActiveKitSwapIds', () => {

    it('deve retornar exatamente 6 espécies (Fase 10: +shadowsting)', () => {
        const ids = getActiveKitSwapIds();
        expect(ids).toHaveLength(6);
    });

    it('deve incluir as 4 espécies MVP', () => {
        const ids = getActiveKitSwapIds();
        expect(ids).toContain('shieldhorn');
        expect(ids).toContain('emberfang');
        expect(ids).toContain('moonquill');
        expect(ids).toContain('floracura');
    });
});

// ---------------------------------------------------------------------------
// Testes: KIT_SWAP_SOURCE
// ---------------------------------------------------------------------------
describe('KIT_SWAP_SOURCE', () => {

    it('deve apontar para species.json de design', () => {
        expect(KIT_SWAP_SOURCE).toBe('design/canon/species.json');
    });
});

// ---------------------------------------------------------------------------
// Testes: integridade dos campos das replacement skills
// ---------------------------------------------------------------------------
describe('integridade dos campos de replacement', () => {

    it('shieldhorn — Golpe Pesado I deve ter todos os campos obrigatórios', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const { skills } = applyKitSwaps(instance, []);
        const skill = skills[0];

        expect(skill).toBeDefined();
        expect(typeof skill.name).toBe('string');
        expect(typeof skill.type).toBe('string');
        expect(typeof skill.cost).toBe('number');
        expect(typeof skill.power).toBe('number');
        expect(typeof skill._kitSwapId).toBe('string');
        expect(skill.cost).toBeGreaterThan(0);
        expect(skill.power).toBeGreaterThan(0);
    });

    it('moonquill — Véu Arcano I deve ter campos de debuff válidos', () => {
        const instance = makeInstance({ canonSpeciesId: 'moonquill', unlockedSkillSlots: 4 });
        const { skills } = applyKitSwaps(instance, HABILIDADES_BASE_MAGO);
        const skill = skills[3];

        expect(skill.type).toBe('BUFF');
        expect(skill.power).toBeLessThan(0);          // debuff = power negativo
        expect(skill.buffType).toBe('ATK');
        expect(skill.target).toBe('enemy');
        expect(skill.duration).toBeGreaterThan(0);
    });

    it('floracura — Cura Eficiente I deve ter target de aliado', () => {
        const instance = makeInstance({ canonSpeciesId: 'floracura', unlockedSkillSlots: 4 });
        const { skills } = applyKitSwaps(instance, HABILIDADES_BASE_CURANDEIRO);
        const skill = skills[3];

        expect(skill.type).toBe('HEAL');
        expect(skill.target).toBe('ally');
        expect(skill.cost).toBeLessThan(5); // custo reduzido = eficiente
    });
});

// ---------------------------------------------------------------------------
// Testes: ausência de regressão no kit legado
// ---------------------------------------------------------------------------
describe('ausência de regressão no kit legado', () => {

    it('monstros sem canonSpeciesId não têm seus kits alterados', () => {
        const skillsComuns = [
            { name: 'Ataque Qualquer', type: 'DAMAGE', cost: 3, power: 10 },
            { name: 'Defesa Qualquer', type: 'BUFF',   cost: 3, power: 2  },
        ];
        const instance = makeInstance({ canonSpeciesId: null, unlockedSkillSlots: 4 });
        const result = applyKitSwaps(instance, skillsComuns);

        expect(result.skills[0].name).toBe('Ataque Qualquer');
        expect(result.skills[1].name).toBe('Defesa Qualquer');
        expect(result.appliedKitSwaps).toHaveLength(0);
    });

    it('múltiplas chamadas com mesma instância produzem o mesmo resultado (idempotência)', () => {
        const instance = makeInstance({ canonSpeciesId: 'shieldhorn', unlockedSkillSlots: 1 });
        const result1 = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);
        const result2 = applyKitSwaps(instance, HABILIDADES_BASE_GUERREIRO);

        expect(result1.skills[0].name).toBe(result2.skills[0].name);
        expect(result1.skills[0].power).toBe(result2.skills[0].power);
    });

    it('unlockedSkillSlots ausente usa fallback de 1 slot', () => {
        // Instância sem unlockedSkillSlots definido
        const instance = { canonSpeciesId: 'emberfang' }; // sem unlockedSkillSlots
        const result = applyKitSwaps(instance, HABILIDADES_BASE_BARBARO);

        // Slot 4 bloqueado por fallback de 1 slot
        expect(result.blockedKitSwaps).toHaveLength(1);
        expect(result.blockedKitSwaps[0].currentSlots).toBe(1);
    });
});
