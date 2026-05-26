/**
 * TRADE SYSTEM TESTS (PR-C)
 *
 * Cobertura da API canônica de Trade.
 */

import { describe, it, expect } from 'vitest';
import {
    validateTrade,
    executeTrade,
    getTradeableMonsters,
    TRADE_ERROR,
} from '../js/combat/tradeSystem.js';

function makePlayer(id, cls, team = [], activeIndex = 0) {
    return { id, name: `Jogador ${id}`, class: cls, activeIndex, team };
}

function makeMon(id, cls, hp = 30) {
    return { id, instanceId: id, name: `Mon-${id}`, class: cls, hp, hpMax: 30, ownerId: null };
}

describe('validateTrade (canônico)', () => {
    it('rejeita troca com mesmo jogador', () => {
        const p = makePlayer('p1', 'Mago', [makeMon('m1', 'Mago'), makeMon('m2', 'Guerreiro')]);
        const result = validateTrade(p, p.team[0], p, p.team[1], []);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.SAME_PLAYER);
    });

    it('rejeita quando monstro não pertence ao jogador', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('m1', 'Mago'), makeMon('m2', 'Guerreiro')]);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('m3', 'Guerreiro'), makeMon('m4', 'Mago')]);
        const fake = makeMon('m999', 'Mago');

        const result = validateTrade(p1, fake, p2, p2.team[0], []);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });

    it('rejeita quando jogador ficaria sem time mínimo ao trocar do time', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('m1', 'Guerreiro')]);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('m2', 'Mago'), makeMon('m3', 'Guerreiro')]);

        const result = validateTrade(p1, p1.team[0], p2, p2.team[0], []);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.EMPTY_TEAM);
    });
});

describe('executeTrade (canônico)', () => {
    it('executa troca bilateral time×time com sucesso', () => {
        const a1 = makeMon('a1', 'Guerreiro');
        const a2 = makeMon('a2', 'Mago');
        const b1 = makeMon('b1', 'Mago');
        const b2 = makeMon('b2', 'Guerreiro');
        const p1 = makePlayer('p1', 'Mago', [a1, a2], 0);
        const p2 = makePlayer('p2', 'Guerreiro', [b1, b2], 0);

        const result = executeTrade(p1, a1, p2, b1, null, []);
        expect(result.success).toBe(true);
        expect(p1.team.some(m => m.id === 'b1')).toBe(true);
        expect(p2.team.some(m => m.id === 'a1')).toBe(true);
    });

    it('atualiza ownerId ao trocar', () => {
        const a1 = makeMon('a1', 'Guerreiro');
        const a2 = makeMon('a2', 'Mago');
        const b1 = makeMon('b1', 'Mago');
        const b2 = makeMon('b2', 'Guerreiro');
        a1.ownerId = 'p1';
        b1.ownerId = 'p2';

        const p1 = makePlayer('p1', 'Mago', [a1, a2]);
        const p2 = makePlayer('p2', 'Guerreiro', [b1, b2]);

        executeTrade(p1, a1, p2, b1, null, []);

        expect(p2.team.find(m => m.id === 'a1')?.ownerId).toBe('p2');
        expect(p1.team.find(m => m.id === 'b1')?.ownerId).toBe('p1');
    });

    it('ajusta activeIndex quando monstro ativo do time é trocado', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('a1', 'Guerreiro'), makeMon('a2', 'Mago')], 0);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('b1', 'Mago'), makeMon('b2', 'Guerreiro')], 0);

        executeTrade(p1, p1.team[0], p2, p2.team[0], null, []);
        expect(typeof p1.activeIndex).toBe('number');
        expect(p1.activeIndex).toBeGreaterThanOrEqual(0);
    });

    it('suporta troca envolvendo Box compartilhada', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('a1', 'Guerreiro'), makeMon('a2', 'Mago')]);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('b1', 'Mago'), makeMon('b2', 'Guerreiro')]);
        const sharedBox = [{ slotId: 'slot_p2_1', ownerPlayerId: 'p2', monster: makeMon('box1', 'Mago') }];

        const monBoxP2 = { ...sharedBox[0].monster, _boxSlotId: sharedBox[0].slotId };
        const result = executeTrade(p1, p1.team[0], p2, monBoxP2, null, sharedBox);

        expect(result.success).toBe(true);
        expect(p1.team.some(m => m.id === 'box1')).toBe(true);
        expect(p2.team.some(m => m.id === 'a1') || sharedBox.some(s => s.monster?.id === 'a1')).toBe(true);
    });
});

describe('getTradeableMonsters (canônico)', () => {
    it('retorna apenas monstrinhos fora da classe do jogador (time + box)', () => {
        const p = makePlayer('p1', 'Mago', [
            makeMon('m_mago', 'Mago'),
            makeMon('m_guerreiro', 'Guerreiro'),
        ]);
        const sharedBox = [
            { slotId: 'slot1', ownerPlayerId: 'p1', monster: makeMon('m_box_mago', 'Mago') },
            { slotId: 'slot2', ownerPlayerId: 'p1', monster: makeMon('m_box_ladino', 'Ladino') },
        ];

        const list = getTradeableMonsters(p, sharedBox);
        const ids = list.map(m => m.id);

        expect(ids).toContain('m_guerreiro');
        expect(ids).toContain('m_box_ladino');
        expect(ids).not.toContain('m_mago');
        expect(ids).not.toContain('m_box_mago');
    });
});
