/**
 * TRADE SYSTEM TESTS (FASE O)
 *
 * Testa as funções puras do módulo tradeSystem.js.
 * Cobertura: validateTrade, proposeTradeAction, acceptTrade
 */

import { describe, it, expect } from 'vitest';
import {
    validateTrade,
    proposeTradeAction,
    acceptTrade,
    TRADE_ERROR,
} from '../js/trade/tradeSystem.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePlayer(id, cls, team = []) {
    return { id, name: `Jogador ${id}`, class: cls, activeIndex: 0, team };
}

function makeMon(instanceId, cls, hp = 30) {
    return { instanceId, id: instanceId, name: `Mon-${instanceId}`, class: cls, hp, hpMax: 30 };
}

// ─── validateTrade ────────────────────────────────────────────────────────────

describe('validateTrade — jogadores inválidos', () => {
    it('retorna erro se fromPlayer for null', () => {
        const to = makePlayer('p2', 'Mago');
        expect(validateTrade(null, to, 'mi_001')).toEqual({ valid: false, error: TRADE_ERROR.INVALID_PLAYER });
    });

    it('retorna erro se toPlayer for null', () => {
        const from = makePlayer('p1', 'Guerreiro', [makeMon('mi_001', 'Guerreiro')]);
        expect(validateTrade(from, null, 'mi_001')).toEqual({ valid: false, error: TRADE_ERROR.INVALID_PLAYER });
    });

    it('retorna erro se fromPlayer === toPlayer', () => {
        const p = makePlayer('p1', 'Guerreiro', [makeMon('mi_001', 'Guerreiro')]);
        expect(validateTrade(p, p, 'mi_001')).toEqual({ valid: false, error: TRADE_ERROR.SAME_PLAYER });
    });
});

describe('validateTrade — instanceId inválido', () => {
    it('retorna erro se instanceId for null', () => {
        const from = makePlayer('p1', 'Guerreiro', [makeMon('mi_001', 'Guerreiro')]);
        const to   = makePlayer('p2', 'Mago');
        expect(validateTrade(from, to, null)).toEqual({ valid: false, error: TRADE_ERROR.INVALID_INSTANCE });
    });

    it('retorna erro se instanceId não existir na equipe', () => {
        const from = makePlayer('p1', 'Guerreiro', [makeMon('mi_001', 'Guerreiro')]);
        const to   = makePlayer('p2', 'Mago');
        expect(validateTrade(from, to, 'mi_999')).toEqual({ valid: false, error: TRADE_ERROR.MONSTER_NOT_FOUND });
    });
});

describe('validateTrade — monstro em batalha / KO', () => {
    it('retorna erro se monstro for o ativo durante batalha', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        from.activeIndex = 0;
        const to = makePlayer('p2', 'Mago');
        expect(validateTrade(from, to, 'mi_001', { inBattle: true })).toEqual({
            valid: false, error: TRADE_ERROR.MONSTER_IN_BATTLE
        });
    });

    it('permite troca de monstro não-ativo durante batalha', () => {
        const mon1 = makeMon('mi_001', 'Guerreiro');
        const mon2 = makeMon('mi_002', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon1, mon2]);
        from.activeIndex = 0; // mon1 é o ativo
        const to = makePlayer('p2', 'Mago');
        expect(validateTrade(from, to, 'mi_002', { inBattle: true }).valid).toBe(true);
    });

    it('retorna erro se monstro estiver KO (hp <= 0)', () => {
        const mon  = makeMon('mi_001', 'Guerreiro', 0);
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');
        expect(validateTrade(from, to, 'mi_001')).toEqual({ valid: false, error: TRADE_ERROR.MONSTER_KO });
    });
});

describe('validateTrade — troca válida', () => {
    it('retorna valid:true para troca entre classes diferentes', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');
        expect(validateTrade(from, to, 'mi_001')).toEqual({ valid: true, error: null });
    });

    it('retorna valid:true para troca entre mesma classe', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Guerreiro');
        expect(validateTrade(from, to, 'mi_001')).toEqual({ valid: true, error: null });
    });
});

// ─── proposeTradeAction ───────────────────────────────────────────────────────

describe('proposeTradeAction', () => {
    it('retorna ok:false se troca for inválida', () => {
        const from = makePlayer('p1', 'Guerreiro', []);
        const to   = makePlayer('p2', 'Mago');
        const result = proposeTradeAction(from, to, 'mi_001');
        expect(result.ok).toBe(false);
        expect(result.trade).toBeNull();
        expect(result.error).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });

    it('retorna proposta com fromPlayerId, toPlayerId, instanceId', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');
        const result = proposeTradeAction(from, to, 'mi_001');
        expect(result.ok).toBe(true);
        expect(result.error).toBeNull();
        expect(result.trade.fromPlayerId).toBe('p1');
        expect(result.trade.toPlayerId).toBe('p2');
        expect(result.trade.instanceId).toBe('mi_001');
    });

    it('inclui monsterName na proposta', () => {
        const mon  = { ...makeMon('mi_001', 'Guerreiro'), name: 'Pedrino' };
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');
        const { trade } = proposeTradeAction(from, to, 'mi_001');
        expect(trade.monsterName).toBe('Pedrino');
    });

    it('usa nickname no monsterName se existir', () => {
        const mon  = { ...makeMon('mi_001', 'Guerreiro'), name: 'Pedrino', nickname: 'Pedro' };
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');
        const { trade } = proposeTradeAction(from, to, 'mi_001');
        expect(trade.monsterName).toBe('Pedro');
    });
});

// ─── acceptTrade ─────────────────────────────────────────────────────────────

describe('acceptTrade — transferência de monstro', () => {
    it('move monstro da equipe do cedente para a do receptor', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago', []);

        const { trade } = proposeTradeAction(from, to, 'mi_001');
        const result = acceptTrade(trade, from, to);

        expect(result.ok).toBe(true);
        expect(from.team).toHaveLength(0);
        expect(to.team).toHaveLength(1);
        expect(to.team[0].instanceId).toBe('mi_001');
    });

    it('retorna monsterName correto', () => {
        const mon  = { ...makeMon('mi_001', 'Guerreiro'), name: 'Pedrino' };
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');

        const { trade } = proposeTradeAction(from, to, 'mi_001');
        const result = acceptTrade(trade, from, to);

        expect(result.monsterName).toBe('Pedrino');
    });

    it('ajusta activeIndex do cedente se necessário', () => {
        const mon1 = makeMon('mi_001', 'Guerreiro');
        const mon2 = makeMon('mi_002', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon1, mon2]);
        from.activeIndex = 1; // aponta para mon2
        const to = makePlayer('p2', 'Mago');

        const { trade } = proposeTradeAction(from, to, 'mi_002');
        acceptTrade(trade, from, to);

        // team agora tem só mon1; activeIndex deve ajustar para 0
        expect(from.team).toHaveLength(1);
        expect(from.activeIndex).toBe(0);
    });

    it('cria team no receptor se não existir', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = { id: 'p2', name: 'Jogador 2', class: 'Mago' }; // sem team

        const { trade } = proposeTradeAction(from, to, 'mi_001');
        acceptTrade(trade, from, to);

        expect(Array.isArray(to.team)).toBe(true);
        expect(to.team).toHaveLength(1);
    });

    it('retorna erro se monstro tiver sido removido antes de aceitar', () => {
        const mon  = makeMon('mi_001', 'Guerreiro');
        const from = makePlayer('p1', 'Guerreiro', [mon]);
        const to   = makePlayer('p2', 'Mago');

        const { trade } = proposeTradeAction(from, to, 'mi_001');
        from.team = []; // monstro sumiu antes do accept

        const result = acceptTrade(trade, from, to);
        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });

    it('retorna erro se parâmetros forem null', () => {
        const result = acceptTrade(null, null, null);
        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.INVALID_PLAYER);
    });
});

describe('acceptTrade — adapter legado para bilateral canônico', () => {
    it('executa troca bilateral quando targetInstanceId é informado', () => {
        const fromMon1 = makeMon('mi_001', 'Guerreiro', 30);
        const fromMon2 = makeMon('mi_002', 'Mago', 30);
        const toMon1 = makeMon('mi_101', 'Mago', 30);
        const toMon2 = makeMon('mi_102', 'Guerreiro', 30);
        const from = makePlayer('p1', 'Mago', [fromMon1, fromMon2]);
        const to = makePlayer('p2', 'Guerreiro', [toMon1, toMon2]);

        const proposal = proposeTradeAction(from, to, 'mi_001', { targetInstanceId: 'mi_101' });
        expect(proposal.ok).toBe(true);

        const result = acceptTrade(proposal.trade, from, to, { sharedBox: [] });
        expect(result.ok).toBe(true);
        expect(from.team.some(m => m.id === 'mi_101')).toBe(true);
        expect(to.team.some(m => m.id === 'mi_001')).toBe(true);
    });

    it('bloqueia adapter bilateral quando alvo não existe', () => {
        const fromMon1 = makeMon('mi_001', 'Guerreiro', 30);
        const fromMon2 = makeMon('mi_002', 'Mago', 30);
        const toMon1 = makeMon('mi_101', 'Mago', 30);
        const toMon2 = makeMon('mi_102', 'Guerreiro', 30);
        const from = makePlayer('p1', 'Mago', [fromMon1, fromMon2]);
        const to = makePlayer('p2', 'Guerreiro', [toMon1, toMon2]);

        const proposal = proposeTradeAction(from, to, 'mi_001', { targetInstanceId: 'mi_inexistente' });
        const result = acceptTrade(proposal.trade, from, to, { sharedBox: [] });

        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });

    it('bloqueia adapter bilateral quando um dos monstrinhos está KO', () => {
        const fromMon1 = makeMon('mi_001', 'Guerreiro', 0);
        const fromMon2 = makeMon('mi_002', 'Mago', 30);
        const toMon1 = makeMon('mi_101', 'Mago', 30);
        const toMon2 = makeMon('mi_102', 'Guerreiro', 30);
        const from = makePlayer('p1', 'Mago', [fromMon1, fromMon2]);
        const to = makePlayer('p2', 'Guerreiro', [toMon1, toMon2]);

        const proposal = proposeTradeAction(from, to, 'mi_001', { targetInstanceId: 'mi_101' });
        expect(proposal.ok).toBe(false);
        expect(proposal.error).toBe(TRADE_ERROR.MONSTER_KO);
    });

    it('executa troca bilateral com monstrinho da box via adapter', () => {
        const fromMon1 = makeMon('mi_001', 'Guerreiro', 30);
        const fromMon2 = makeMon('mi_002', 'Mago', 30);
        const toTeamMon = makeMon('mi_101', 'Mago', 30);
        const toTeamMon2 = makeMon('mi_102', 'Guerreiro', 30);
        const from = makePlayer('p1', 'Mago', [fromMon1, fromMon2]);
        const to = makePlayer('p2', 'Guerreiro', [toTeamMon, toTeamMon2]);
        const sharedBox = [
            { slotId: 'slot_p2', ownerPlayerId: 'p2', monster: makeMon('mi_box', 'Mago', 30) },
        ];

        const proposal = proposeTradeAction(from, to, 'mi_001', { targetInstanceId: 'mi_box' });
        expect(proposal.ok).toBe(true);

        const result = acceptTrade(proposal.trade, from, to, { sharedBox });
        expect(result.ok).toBe(true);
        expect(from.team.some(m => m.id === 'mi_box')).toBe(true);
        expect(to.team.some(m => m.id === 'mi_001')).toBe(true);
    });
});
