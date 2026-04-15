import { describe, it, expect } from 'vitest';
import { filterReachableTargets } from '../js/combat/positionSystem.js';
import { bossPhase2HealAlly } from '../js/combat/bossSystem.js';
import { executeTrade } from '../js/combat/tradeSystem.js';
import { applyEvolution } from '../js/progression/evolutionSystem.js';

describe('Bug Scan - Fases VII–XI', () => {
    it('filterReachableTargets mantém fallback com posições ausentes', () => {
        const targets = [{ id: 't1', hp: 10 }, { id: 't2', hp: 0, position: 'front' }];
        const reachable = filterReachableTargets(targets, 'Mago', undefined);
        expect(reachable.map(t => t.id)).toEqual(['t1']);
    });

    it('bossPhase2HealAlly com allies vazio não cura ninguém', () => {
        const result = bossPhase2HealAlly({ name: 'Boss' }, [], { helpers: {} }, {});
        expect(result.healed).toBe(false);
    });

    it('executeTrade bloqueia troca quando jogador tem apenas 1 monstrinho', () => {
        const playerA = { id: 'p1', name: 'A', class: 'Mago', team: [{ id: 'm1', class: 'Mago', hp: 10 }], activeIndex: 0 };
        const playerB = { id: 'p2', name: 'B', class: 'Guerreiro', team: [{ id: 'm2', class: 'Guerreiro', hp: 10 }, { id: 'm3', class: 'Guerreiro', hp: 10 }], activeIndex: 0 };
        const result = executeTrade(playerA, playerA.team[0], playerB, playerB.team[0], []);
        expect(result.success).toBe(false);
    });

    it('applyEvolution é idempotente quando chamado 2 vezes na forma final', () => {
        const mon = {
            id: 'mi_final',
            name: 'Final',
            class: 'Guerreiro',
            rarity: 'Raro',
            level: 30,
            hp: 100,
            hpMax: 100,
            atk: 20,
            def: 20,
            spd: 10,
            ene: 10,
            eneMax: 10,
            evolvesTo: null,
            evolvesAt: null,
            buffs: [{ type: 'atk', power: 1 }],
        };
        const finalTemplate = {
            id: 'final_mon',
            name: 'Final',
            class: 'Guerreiro',
            rarity: 'Raro',
            baseHp: 90,
            baseAtk: 18,
            baseDef: 18,
            baseSpd: 9,
            baseEne: 9,
            evolvesTo: null,
            evolvesAt: null,
        };
        applyEvolution(mon, finalTemplate);
        const snapshot = JSON.stringify(mon);
        applyEvolution(mon, finalTemplate);
        expect(JSON.stringify(mon)).toBe(snapshot);
    });
});

