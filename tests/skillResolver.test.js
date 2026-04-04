/**
 * SKILL RESOLVER TESTS (PR-Unificação-Skills)
 *
 * Testes para js/combat/skillResolver.js
 *
 * Cobre:
 *   - normalizeSkill: conversão de SKILL_DEFS, KitSwap e SKILLS_CATALOG
 *   - resolveFromRawArray: normalização de arrays
 *   - canUseSkill: verificação de ENE
 *   - isOffensiveSkill: verificação de alvo
 *
 * DECISÃO ARQUITETURAL:
 *   SKILL_DEFS é o sistema canônico de runtime.
 *   normalizeSkill é a função que transforma qualquer formato para o formato operacional único.
 */

import { describe, it, expect } from 'vitest';
import { normalizeSkill, resolveFromRawArray, canUseSkill, isOffensiveSkill } from '../js/combat/skillResolver.js';

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

/** Skill no formato SKILL_DEFS (canônico runtime) */
function makeSkillDefs(overrides = {}) {
    return {
        name: 'Golpe de Espada I',
        type: 'DAMAGE',
        cost: 4,
        target: 'enemy',
        power: 18,
        desc: 'Ataque com espada.',
        ...overrides
    };
}

/** Skill no formato KitSwap (igual ao SKILL_DEFS + _kitSwapId) */
function makeKitSwapSkill(overrides = {}) {
    return {
        name: 'Golpe Furtivo I',
        type: 'DAMAGE',
        cost: 5,
        target: 'enemy',
        power: 22,
        desc: 'Golpe canônico da espécie.',
        _kitSwapId: 'shadowsting_ambush_strike',
        ...overrides
    };
}

/** Skill no formato SKILLS_CATALOG (futuro/migração) */
function makeSkillCatalog(overrides = {}) {
    return {
        id: 'SK_WAR_01',
        name: 'Corte Pesado',
        class: 'Guerreiro',
        category: 'Ataque',
        power: 9,
        accuracy: 0.8,
        energy_cost: 3,
        target: 'Inimigo',
        status: '',
        desc: 'Dano alto, menos preciso.',
        ...overrides
    };
}

function makeMon(overrides = {}) {
    return { hp: 50, hpMax: 50, ene: 20, eneMax: 20, ...overrides };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção 1: normalizeSkill — formato SKILL_DEFS (canônico)
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeSkill — formato SKILL_DEFS (canônico)', () => {
    it('deve preservar todos os campos obrigatórios de SKILL_DEFS', () => {
        const raw = makeSkillDefs();
        const s = normalizeSkill(raw);

        expect(s.name).toBe('Golpe de Espada I');
        expect(s.type).toBe('DAMAGE');
        expect(s.cost).toBe(4);
        expect(s.target).toBe('enemy');
        expect(s.power).toBe(18);
        expect(s.desc).toBe('Ataque com espada.');
    });

    it('deve identificar _source como skill_defs', () => {
        const s = normalizeSkill(makeSkillDefs());
        expect(s._source).toBe('skill_defs');
    });

    it('deve preservar _raw como referência ao objeto original', () => {
        const raw = makeSkillDefs();
        const s = normalizeSkill(raw);
        expect(s._raw).toBe(raw);
    });

    it('deve normalizar skill HEAL (target self)', () => {
        const raw = makeSkillDefs({ name: 'Cura I', type: 'HEAL', target: 'self', power: 15 });
        const s = normalizeSkill(raw);

        expect(s.type).toBe('HEAL');
        expect(s.target).toBe('self');
        expect(s._source).toBe('skill_defs');
    });

    it('deve normalizar skill BUFF (target ally)', () => {
        const raw = makeSkillDefs({ name: 'Proteção I', type: 'BUFF', target: 'ally', cost: 3 });
        const s = normalizeSkill(raw);

        expect(s.type).toBe('BUFF');
        expect(s.target).toBe('ally');
    });

    it('deve preservar campos opcionais de BUFF (buffType, duration, debuffType, debuffPower)', () => {
        const raw = makeSkillDefs({
            type: 'BUFF', target: 'self',
            buffType: 'ATK', duration: 2,
            debuffType: 'DEF', debuffPower: -2
        });
        const s = normalizeSkill(raw);

        expect(s.buffType).toBe('ATK');
        expect(s.duration).toBe(2);
        expect(s.debuffType).toBe('DEF');
        expect(s.debuffPower).toBe(-2);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 2: normalizeSkill — formato KitSwap
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeSkill — formato KitSwap', () => {
    it('deve identificar _source como kit_swap', () => {
        const s = normalizeSkill(makeKitSwapSkill());
        expect(s._source).toBe('kit_swap');
    });

    it('deve preservar _kitSwapId para telemetria (Fase 14)', () => {
        const s = normalizeSkill(makeKitSwapSkill());
        expect(s._kitSwapId).toBe('shadowsting_ambush_strike');
    });

    it('deve normalizar campos corretamente (KitSwap = formato SKILL_DEFS)', () => {
        const raw = makeKitSwapSkill({ cost: 5, target: 'enemy', power: 22 });
        const s = normalizeSkill(raw);

        expect(s.cost).toBe(5);
        expect(s.target).toBe('enemy');
        expect(s.power).toBe(22);
    });

    it('deve identificar KitSwap II (_kitSwapId terminando em _ii)', () => {
        const raw = makeKitSwapSkill({ _kitSwapId: 'shadowsting_ambush_strike_ii' });
        const s = normalizeSkill(raw);
        expect(s._kitSwapId).toBe('shadowsting_ambush_strike_ii');
        expect(s._source).toBe('kit_swap');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 3: normalizeSkill — formato SKILLS_CATALOG (migração futura)
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeSkill — formato SKILLS_CATALOG (migração futura)', () => {
    it('deve converter energy_cost para cost', () => {
        const raw = makeSkillCatalog({ energy_cost: 3 });
        const s = normalizeSkill(raw);
        expect(s.cost).toBe(3);
    });

    it('deve converter category Ataque para type DAMAGE', () => {
        const raw = makeSkillCatalog({ category: 'Ataque' });
        const s = normalizeSkill(raw);
        expect(s.type).toBe('DAMAGE');
    });

    it('deve converter category Controle para type DAMAGE', () => {
        const raw = makeSkillCatalog({ category: 'Controle' });
        const s = normalizeSkill(raw);
        expect(s.type).toBe('DAMAGE');
    });

    it('deve converter category Cura para type HEAL', () => {
        const raw = makeSkillCatalog({ category: 'Cura', target: 'Aliado' });
        const s = normalizeSkill(raw);
        expect(s.type).toBe('HEAL');
    });

    it('deve converter category Suporte para type BUFF', () => {
        const raw = makeSkillCatalog({ category: 'Suporte', target: 'Self' });
        const s = normalizeSkill(raw);
        expect(s.type).toBe('BUFF');
    });

    it('deve converter target Inimigo para enemy', () => {
        const raw = makeSkillCatalog({ target: 'Inimigo' });
        const s = normalizeSkill(raw);
        expect(s.target).toBe('enemy');
    });

    it('deve converter target Aliado para ally', () => {
        const raw = makeSkillCatalog({ category: 'Cura', target: 'Aliado' });
        const s = normalizeSkill(raw);
        expect(s.target).toBe('ally');
    });

    it('deve converter target Self para self', () => {
        const raw = makeSkillCatalog({ category: 'Suporte', target: 'Self' });
        const s = normalizeSkill(raw);
        expect(s.target).toBe('self');
    });

    it('deve converter target Área para enemy (dano em área = ofensivo)', () => {
        const raw = makeSkillCatalog({ category: 'Controle', target: 'Área' });
        const s = normalizeSkill(raw);
        expect(s.target).toBe('enemy');
    });

    it('deve identificar _source como skills_catalog', () => {
        const raw = makeSkillCatalog(); // tem energy_cost, sem cost
        const s = normalizeSkill(raw);
        expect(s._source).toBe('skills_catalog');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 4: normalizeSkill — valores padrão e edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeSkill — valores padrão e edge cases', () => {
    it('deve retornar null para input null', () => {
        expect(normalizeSkill(null)).toBeNull();
    });

    it('deve retornar null para input não-objeto', () => {
        expect(normalizeSkill('string')).toBeNull();
        expect(normalizeSkill(42)).toBeNull();
        expect(normalizeSkill(undefined)).toBeNull();
    });

    it('deve usar Habilidade como nome padrão quando não fornecido', () => {
        const s = normalizeSkill({ type: 'DAMAGE', cost: 3, target: 'enemy', power: 5 });
        expect(s.name).toBe('Habilidade');
    });

    it('deve usar DAMAGE como tipo padrão quando não fornecido', () => {
        const s = normalizeSkill({ name: 'Teste', cost: 3, target: 'enemy', power: 5 });
        expect(s.type).toBe('DAMAGE');
    });

    it('deve usar enemy como alvo padrão quando não fornecido', () => {
        const s = normalizeSkill({ name: 'Teste', type: 'DAMAGE', cost: 3, power: 5 });
        expect(s.target).toBe('enemy');
    });

    it('deve usar 0 como cost padrão quando não fornecido', () => {
        const s = normalizeSkill({ name: 'Teste', type: 'HEAL', target: 'self', power: 10 });
        expect(s.cost).toBe(0);
    });

    it('deve usar 0 como power padrão quando não fornecido', () => {
        const s = normalizeSkill({ name: 'Teste', type: 'BUFF', target: 'self', cost: 2 });
        expect(s.power).toBe(0);
    });

    it('NÃO deve incluir buffType quando não existe no raw', () => {
        const s = normalizeSkill(makeSkillDefs());
        expect(s.buffType).toBeUndefined();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 5: resolveFromRawArray
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveFromRawArray', () => {
    it('deve normalizar todos os elementos de um array SKILL_DEFS', () => {
        const raw = [
            makeSkillDefs({ name: 'Skill A', cost: 2 }),
            makeSkillDefs({ name: 'Skill B', type: 'HEAL', target: 'self', cost: 3 }),
        ];
        const result = resolveFromRawArray(raw);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Skill A');
        expect(result[1].name).toBe('Skill B');
        expect(result[1].type).toBe('HEAL');
    });

    it('deve filtrar elementos nulos ou inválidos', () => {
        const raw = [makeSkillDefs(), null, undefined, makeSkillDefs({ name: 'Válida' })];
        const result = resolveFromRawArray(raw);

        expect(result).toHaveLength(2);
        expect(result[1].name).toBe('Válida');
    });

    it('deve retornar [] para array vazio', () => {
        expect(resolveFromRawArray([])).toEqual([]);
    });

    it('deve retornar [] para input não-array', () => {
        expect(resolveFromRawArray(null)).toEqual([]);
        expect(resolveFromRawArray(undefined)).toEqual([]);
        expect(resolveFromRawArray('string')).toEqual([]);
    });

    it('deve normalizar mix de SKILL_DEFS e SKILLS_CATALOG', () => {
        const raw = [
            makeSkillDefs({ name: 'DEFS skill', cost: 4 }),
            makeSkillCatalog({ name: 'Catalog skill', energy_cost: 3, category: 'Cura', target: 'Aliado' }),
        ];
        const result = resolveFromRawArray(raw);

        expect(result[0].cost).toBe(4);
        expect(result[0].type).toBe('DAMAGE');
        expect(result[1].cost).toBe(3);
        expect(result[1].type).toBe('HEAL');
        expect(result[1].target).toBe('ally');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 6: canUseSkill
// ─────────────────────────────────────────────────────────────────────────────

describe('canUseSkill', () => {
    it('deve retornar true quando ENE >= cost', () => {
        const skill = normalizeSkill(makeSkillDefs({ cost: 4 }));
        const mon = makeMon({ ene: 10 });
        expect(canUseSkill(skill, mon)).toBe(true);
    });

    it('deve retornar true quando ENE == cost (exato)', () => {
        const skill = normalizeSkill(makeSkillDefs({ cost: 5 }));
        const mon = makeMon({ ene: 5 });
        expect(canUseSkill(skill, mon)).toBe(true);
    });

    it('deve retornar false quando ENE < cost', () => {
        const skill = normalizeSkill(makeSkillDefs({ cost: 5 }));
        const mon = makeMon({ ene: 3 });
        expect(canUseSkill(skill, mon)).toBe(false);
    });

    it('deve retornar true para skill gratuita (cost 0)', () => {
        const skill = normalizeSkill(makeSkillDefs({ cost: 0 }));
        const mon = makeMon({ ene: 0 });
        expect(canUseSkill(skill, mon)).toBe(true);
    });

    it('deve retornar false para null skill', () => {
        expect(canUseSkill(null, makeMon())).toBe(false);
    });

    it('deve retornar false para null mon', () => {
        expect(canUseSkill(normalizeSkill(makeSkillDefs()), null)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 7: isOffensiveSkill
// ─────────────────────────────────────────────────────────────────────────────

describe('isOffensiveSkill', () => {
    it('deve retornar true para target enemy (SKILL_DEFS)', () => {
        const skill = normalizeSkill(makeSkillDefs({ target: 'enemy' }));
        expect(isOffensiveSkill(skill)).toBe(true);
    });

    it('deve retornar true para target area', () => {
        const skill = { target: 'area', type: 'DAMAGE', cost: 3, power: 5 };
        expect(isOffensiveSkill(skill)).toBe(true);
    });

    it('deve retornar false para target self', () => {
        const skill = normalizeSkill(makeSkillDefs({ type: 'HEAL', target: 'self' }));
        expect(isOffensiveSkill(skill)).toBe(false);
    });

    it('deve retornar false para target ally', () => {
        const skill = normalizeSkill(makeSkillDefs({ type: 'BUFF', target: 'ally' }));
        expect(isOffensiveSkill(skill)).toBe(false);
    });

    it('deve retornar false para null', () => {
        expect(isOffensiveSkill(null)).toBe(false);
    });

    it('deve refletir normalização: Inimigo→enemy é ofensivo', () => {
        const skill = normalizeSkill(makeSkillCatalog({ target: 'Inimigo' }));
        expect(isOffensiveSkill(skill)).toBe(true);
    });

    it('deve refletir normalização: Área→enemy é ofensivo', () => {
        const skill = normalizeSkill(makeSkillCatalog({ category: 'Controle', target: 'Área' }));
        expect(isOffensiveSkill(skill)).toBe(true);
    });

    it('deve refletir normalização: Aliado→ally não é ofensivo', () => {
        const skill = normalizeSkill(makeSkillCatalog({ category: 'Cura', target: 'Aliado' }));
        expect(isOffensiveSkill(skill)).toBe(false);
    });

    it('deve refletir normalização: Self→self não é ofensivo', () => {
        const skill = normalizeSkill(makeSkillCatalog({ category: 'Suporte', target: 'Self' }));
        expect(isOffensiveSkill(skill)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 8: Integração — pipeline completo (normalizeSkill → canUseSkill → isOffensiveSkill)
// ─────────────────────────────────────────────────────────────────────────────

describe('Integração — pipeline completo', () => {
    it('SKILL_DEFS ofensiva: normalizar → verificar ENE → verificar ofensividade', () => {
        const raw = makeSkillDefs({ cost: 4, type: 'DAMAGE', target: 'enemy', power: 18 });
        const skill = normalizeSkill(raw);
        const monSuficiente = makeMon({ ene: 10 });
        const monInsuficiente = makeMon({ ene: 2 });

        expect(skill.cost).toBe(4);
        expect(canUseSkill(skill, monSuficiente)).toBe(true);
        expect(canUseSkill(skill, monInsuficiente)).toBe(false);
        expect(isOffensiveSkill(skill)).toBe(true);
    });

    it('SKILL_DEFS defensiva: normalizar → verificar ENE → verificar não-ofensividade', () => {
        const raw = makeSkillDefs({ cost: 3, type: 'HEAL', target: 'self', power: 20 });
        const skill = normalizeSkill(raw);
        const mon = makeMon({ ene: 10 });

        expect(canUseSkill(skill, mon)).toBe(true);
        expect(isOffensiveSkill(skill)).toBe(false);
    });

    it('SKILLS_CATALOG: normalizar → campos corretos → pipeline funciona', () => {
        const raw = makeSkillCatalog({ energy_cost: 5, category: 'Ataque', target: 'Inimigo', power: 9 });
        const skill = normalizeSkill(raw);
        const monSuficiente = makeMon({ ene: 8 });
        const monInsuficiente = makeMon({ ene: 3 });

        expect(skill.cost).toBe(5);
        expect(skill.type).toBe('DAMAGE');
        expect(skill.target).toBe('enemy');
        expect(canUseSkill(skill, monSuficiente)).toBe(true);
        expect(canUseSkill(skill, monInsuficiente)).toBe(false);
        expect(isOffensiveSkill(skill)).toBe(true);
    });

    it('resolveFromRawArray → todas as skills passam pelo pipeline corretamente', () => {
        const raws = [
            makeSkillDefs({ name: 'Ataque', cost: 4, type: 'DAMAGE', target: 'enemy' }),
            makeSkillDefs({ name: 'Cura', cost: 3, type: 'HEAL', target: 'self' }),
            makeSkillDefs({ name: 'Buff', cost: 2, type: 'BUFF', target: 'self' }),
        ];
        const mon = makeMon({ ene: 10 });
        const skills = resolveFromRawArray(raws);

        expect(skills).toHaveLength(3);
        expect(skills.filter(s => canUseSkill(s, mon))).toHaveLength(3);
        expect(skills.filter(s => isOffensiveSkill(s))).toHaveLength(1); // só Ataque
        expect(skills.filter(s => !isOffensiveSkill(s))).toHaveLength(2); // Cura + Buff
    });
});
