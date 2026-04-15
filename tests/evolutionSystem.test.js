/**
 * EVOLUTION SYSTEM TESTS — FASE VIII
 *
 * Cobertura: checkEvolution, applyEvolution, getEvolutionTarget
 * Casos: evolução válida, nível insuficiente, sem evolução, nível exato, borda
 */

import { describe, it, expect } from 'vitest';
import {
    checkEvolution,
    applyEvolution,
    getEvolutionTarget,
    EVOLUTION_STAT_BOOST,
} from '../js/progression/evolutionSystem.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeMon = (overrides = {}) => ({
    id: 'mi_001',
    name: 'Pedrino',
    class: 'Guerreiro',
    rarity: 'Comum',
    level: 1,
    xp: 0,
    xpNeeded: 46,
    hp: 32, hpMax: 32,
    atk: 7, def: 6, spd: 5, eneMax: 6, ene: 6,
    evolvesTo: 'MON_002B',
    evolvesAt: 12,
    buffs: [],
    ...overrides,
});

const newTemplate = {
    id: 'MON_002B',
    name: 'Pedronar',
    class: 'Guerreiro',
    rarity: 'Incomum',
    emoji: '⚔️',
    baseHp: 42, baseAtk: 10, baseDef: 8, baseSpd: 6, baseEne: 6,
    evolvesTo: 'MON_002C',
    evolvesAt: 25,
};

const catalog = [
    { id: 'MON_002',  name: 'Pedrino',  evolvesTo: 'MON_002B', evolvesAt: 12 },
    { id: 'MON_002B', name: 'Pedronar', evolvesTo: 'MON_002C', evolvesAt: 25, baseHp: 42, baseAtk: 10, baseDef: 8, baseSpd: 6, baseEne: 6 },
    { id: 'MON_002C', name: 'PedraoMax', evolvesTo: null, evolvesAt: null, baseHp: 60, baseAtk: 14, baseDef: 12, baseSpd: 8, baseEne: 8 },
];

// ─── checkEvolution ───────────────────────────────────────────────────────────

describe('checkEvolution', () => {
    it('deve retornar canEvolve=true quando nível >= evolvesAt', () => {
        const mon = makeMon({ level: 12 });
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(true);
        expect(result.targetId).toBe('MON_002B');
    });

    it('deve retornar canEvolve=true no nível exato de evolução', () => {
        const mon = makeMon({ level: 12 });
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(true);
    });

    it('deve retornar canEvolve=false quando nível < evolvesAt', () => {
        const mon = makeMon({ level: 11 });
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(false);
    });

    it('deve retornar canEvolve=false quando evolvesTo é null', () => {
        const mon = makeMon({ evolvesTo: null, level: 50 });
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(false);
        expect(result.targetId).toBeNull();
    });

    it('deve retornar canEvolve=false quando evolvesTo é undefined', () => {
        const mon = makeMon({ level: 50 });
        delete mon.evolvesTo;
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(false);
    });

    it('deve retornar canEvolve=false para monster null', () => {
        const result = checkEvolution(null);
        expect(result.canEvolve).toBe(false);
    });

    it('deve retornar o targetId mesmo quando nível insuficiente', () => {
        const mon = makeMon({ level: 5 });
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(false);
        expect(result.targetId).toBe('MON_002B');
    });

    it('deve evoluir acima do nível mínimo (nível > evolvesAt)', () => {
        const mon = makeMon({ level: 20 });
        const result = checkEvolution(mon);
        expect(result.canEvolve).toBe(true);
    });
});

// ─── getEvolutionTarget ───────────────────────────────────────────────────────

describe('getEvolutionTarget', () => {
    it('deve retornar o template correto pelo ID', () => {
        const result = getEvolutionTarget('MON_002B', catalog);
        expect(result).not.toBeNull();
        expect(result.name).toBe('Pedronar');
    });

    it('deve retornar null para ID inexistente', () => {
        const result = getEvolutionTarget('MON_999', catalog);
        expect(result).toBeNull();
    });

    it('deve retornar null para targetId null', () => {
        const result = getEvolutionTarget(null, catalog);
        expect(result).toBeNull();
    });

    it('deve retornar null para catalog vazio', () => {
        const result = getEvolutionTarget('MON_002B', []);
        expect(result).toBeNull();
    });

    it('deve retornar null para catalog null', () => {
        const result = getEvolutionTarget('MON_002B', null);
        expect(result).toBeNull();
    });
});

// ─── applyEvolution ───────────────────────────────────────────────────────────

describe('applyEvolution', () => {
    it('deve atualizar nome e rarity do monstro', () => {
        const mon = makeMon({ level: 12 });
        applyEvolution(mon, newTemplate);
        expect(mon.name).toBe('Pedronar');
        expect(mon.rarity).toBe('Incomum');
    });

    it('deve aplicar boost de +10% nos stats base do novo template', () => {
        const mon = makeMon({ level: 12 });
        applyEvolution(mon, newTemplate);
        // hpMax = round(42 * 1.10) = 46
        expect(mon.hpMax).toBe(Math.round(42 * (1 + EVOLUTION_STAT_BOOST)));
        // atk = round(10 * 1.10) = 11
        expect(mon.atk).toBe(Math.round(10 * (1 + EVOLUTION_STAT_BOOST)));
    });

    it('deve curar completamente o HP ao evoluir', () => {
        const mon = makeMon({ level: 12, hp: 5 });
        applyEvolution(mon, newTemplate);
        expect(mon.hp).toBe(mon.hpMax);
    });

    it('deve restaurar ENE completamente ao evoluir', () => {
        const mon = makeMon({ level: 12, ene: 0 });
        applyEvolution(mon, newTemplate);
        expect(mon.ene).toBe(mon.eneMax);
    });

    it('deve limpar buffs ao evoluir', () => {
        const mon = makeMon({ level: 12, buffs: [{ type: 'atk', power: 2, duration: 3 }] });
        applyEvolution(mon, newTemplate);
        expect(mon.buffs).toEqual([]);
    });

    it('deve herdar a cadeia de evolução do novo template', () => {
        const mon = makeMon({ level: 12 });
        applyEvolution(mon, newTemplate);
        expect(mon.evolvesTo).toBe('MON_002C');
        expect(mon.evolvesAt).toBe(25);
    });

    it('deve registrar log ao evoluir', () => {
        const mon = makeMon({ level: 12 });
        const log = [];
        applyEvolution(mon, newTemplate, log);
        expect(log.length).toBe(1);
        expect(log[0]).toContain('evoluiu para Pedronar');
    });

    it('deve manter level, xp, id originais', () => {
        const mon = makeMon({ level: 12, xp: 50, id: 'mi_abc' });
        applyEvolution(mon, newTemplate);
        expect(mon.level).toBe(12);
        expect(mon.xp).toBe(50);
        expect(mon.id).toBe('mi_abc');
    });

    it('deve usar nome de nickname no log se disponível', () => {
        const mon = makeMon({ level: 12, nickname: 'Pedão' });
        const log = [];
        applyEvolution(mon, newTemplate, log);
        expect(log[0]).toContain('Pedão');
    });

    it('deve atualizar canonSpeciesId para o ID do novo template', () => {
        const mon = makeMon({ level: 12 });
        applyEvolution(mon, newTemplate);
        expect(mon.canonSpeciesId).toBe('MON_002B');
    });

    it('deve não quebrar quando newTemplate não tem evolvesTo (fim da cadeia)', () => {
        const endTemplate = { ...newTemplate, evolvesTo: null, evolvesAt: null };
        const mon = makeMon({ level: 12 });
        applyEvolution(mon, endTemplate);
        expect(mon.evolvesTo).toBeNull();
        expect(mon.evolvesAt).toBeNull();
    });

    it('deve não fazer nada se monster for null', () => {
        expect(() => applyEvolution(null, newTemplate)).not.toThrow();
    });

    it('deve não fazer nada se newTemplate for null', () => {
        const mon = makeMon({ level: 12 });
        expect(() => applyEvolution(mon, null)).not.toThrow();
        // Mon deve permanecer inalterado
        expect(mon.name).toBe('Pedrino');
    });
});

// ─── Integração: checkEvolution + applyEvolution ──────────────────────────────

describe('Integração: checkEvolution + applyEvolution + getEvolutionTarget', () => {
    it('deve completar o fluxo completo de evolução', () => {
        const mon = makeMon({ level: 12 });
        const { canEvolve, targetId } = checkEvolution(mon);
        expect(canEvolve).toBe(true);

        const template = getEvolutionTarget(targetId, catalog);
        expect(template).not.toBeNull();

        const log = [];
        applyEvolution(mon, template, log);

        expect(mon.name).toBe('Pedronar');
        expect(mon.level).toBe(12); // nível mantido
        expect(log[0]).toContain('evoluiu para Pedronar');
    });

    it('deve suportar cadeia de 3 estágios sem erros', () => {
        // Simula evolução de S2 para S3
        const mon = {
            id: 'mi_003', name: 'Pedronar', level: 25, xp: 0, xpNeeded: 100,
            hp: 46, hpMax: 46, atk: 11, def: 9, spd: 7, eneMax: 7, ene: 7,
            evolvesTo: 'MON_002C', evolvesAt: 25, buffs: [],
        };
        const { canEvolve, targetId } = checkEvolution(mon);
        expect(canEvolve).toBe(true);
        const template = getEvolutionTarget(targetId, catalog);
        expect(template).not.toBeNull();
        applyEvolution(mon, template);
        expect(mon.name).toBe('PedraoMax');
        expect(mon.evolvesTo).toBeNull(); // fim da cadeia
    });
});
