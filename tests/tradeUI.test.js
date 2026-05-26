/**
 * TRADE UI TESTS (PR-C)
 *
 * Cobertura da UI canônica de Trade.
 */

import { describe, it, expect } from 'vitest';
import {
    renderTradePanel,
    validateTrade,
    executeTrade,
    getTradeableMonsters,
    getTradeSuggestions,
} from '../js/ui/tradeUI.js';
import { TRADE_ERROR } from '../js/combat/tradeSystem.js';

function makePlayer(id, cls = 'Mago', team = [], activeIndex = 0) {
    return { id, name: `Jogador ${id}`, class: cls, activeIndex, team };
}

function makeMon(id, cls = 'Mago', hp = 30) {
    return { id, instanceId: id, name: `Mon-${id}`, class: cls, hp, hpMax: 30, ownerId: null };
}

describe('TradeUI — exports canônicos', () => {
    it('reexporta funções canônicas de Trade', () => {
        expect(typeof validateTrade).toBe('function');
        expect(typeof executeTrade).toBe('function');
        expect(typeof getTradeableMonsters).toBe('function');
        expect(typeof getTradeSuggestions).toBe('function');
    });
});

describe('TradeUI — renderTradePanel', () => {
    it('mostra aviso quando há menos de 2 jogadores', () => {
        const state = { players: [makePlayer('p1')], sharedBox: [] };
        const html = renderTradePanel(state, {});
        expect(html).toContain('É necessário pelo menos 2 jogadores para trocar Monstrinhos');
    });

    it('renderiza painel com dois lados e botão de ação', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('m1', 'Guerreiro'), makeMon('m2', 'Mago')]);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('m3', 'Mago'), makeMon('m4', 'Guerreiro')]);
        const state = { players: [p1, p2], sharedBox: [] };

        const html = renderTradePanel(state, { playerAId: 'p1', playerBId: 'p2' });

        expect(html).toContain('Troca de Monstrinhos');
        expect(html).toContain('window.tradeConfirm');
        expect(html).toContain('window.tradeSelectMon');
    });

    it('renderiza blocos de Box quando houver monstrinhos elegíveis na Box', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('m1', 'Guerreiro'), makeMon('m2', 'Mago')]);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('m3', 'Mago'), makeMon('m4', 'Guerreiro')]);
        const sharedBox = [
            { slotId: 'slot1', ownerPlayerId: 'p1', monster: makeMon('m_box_1', 'Ladino') },
            { slotId: 'slot2', ownerPlayerId: 'p2', monster: makeMon('m_box_2', 'Mago') },
        ];

        const html = renderTradePanel({ players: [p1, p2], sharedBox }, { playerAId: 'p1', playerBId: 'p2' });
        expect(html).toContain('📦 Box');
    });
});

describe('TradeUI — validação/execução canônica', () => {
    it('validateTrade retorna erro de mesmo jogador', () => {
        const p = makePlayer('p1', 'Mago', [makeMon('m1', 'Guerreiro'), makeMon('m2', 'Mago')]);
        const result = validateTrade(p, p.team[0], p, p.team[1], []);

        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.SAME_PLAYER);
    });

    it('executeTrade realiza troca bilateral e retorna sucesso', () => {
        const p1 = makePlayer('p1', 'Mago', [makeMon('m1', 'Guerreiro'), makeMon('m2', 'Mago')]);
        const p2 = makePlayer('p2', 'Guerreiro', [makeMon('m3', 'Mago'), makeMon('m4', 'Guerreiro')]);

        const result = executeTrade(p1, p1.team[0], p2, p2.team[0], [], []);

        expect(result.success).toBe(true);
        expect(p1.team.some(m => m.id === 'm3')).toBe(true);
        expect(p2.team.some(m => m.id === 'm1')).toBe(true);
    });
});
