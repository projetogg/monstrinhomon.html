/**
 * TRADE UI TESTS (FASE P)
 *
 * Testa a lógica de filtragem de destinatários, validação de estado
 * e mensagens de erro do fluxo de Trade UI.
 * Cobertura: validateTrade, proposeTradeAction, acceptTrade (fluxo UI)
 */

import { describe, it, expect } from 'vitest';
import {
    validateTrade,
    proposeTradeAction,
    acceptTrade,
    TRADE_ERROR,
} from '../js/trade/tradeSystem.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePlayer(id, cls = 'Mago', team = [], activeIndex = 0) {
    return { id, name: `Jogador ${id}`, class: cls, activeIndex, team };
}

function makeMon(instanceId, cls = 'Mago', hp = 30) {
    return { instanceId, id: instanceId, name: `Mon-${instanceId}`, class: cls, hp, hpMax: 30 };
}

// ─── Filtragem de destinatários válidos ───────────────────────────────────────

describe('Trade UI — filtragem de destinatários', () => {
    it('lista todos os jogadores exceto o cedente como destinatários válidos', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const p3 = makePlayer('p3');
        const players = [p1, p2, p3];

        const recipients = players.filter(p => p && p.id !== p1.id);
        expect(recipients).toHaveLength(2);
        expect(recipients.map(p => p.id)).toContain('p2');
        expect(recipients.map(p => p.id)).toContain('p3');
        expect(recipients.map(p => p.id)).not.toContain('p1');
    });

    it('retorna array vazio quando há apenas um jogador', () => {
        const p1 = makePlayer('p1');
        const recipients = [p1].filter(p => p && p.id !== p1.id);
        expect(recipients).toHaveLength(0);
    });
});

// ─── Validação de troca — monstro ativo ───────────────────────────────────────

describe('Trade UI — monstro ativo em batalha', () => {
    it('rejeita troca do monstro ativo quando inBattle=true', () => {
        const mon = makeMon('m1');
        const from = makePlayer('p1', 'Mago', [mon], 0); // activeIndex=0 = m1
        const to   = makePlayer('p2', 'Guerreiro');

        const result = validateTrade(from, to, 'm1', { inBattle: true });
        expect(result.valid).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.MONSTER_IN_BATTLE);
    });

    it('permite troca do monstro ativo quando fora de batalha', () => {
        const mon = makeMon('m1');
        const from = makePlayer('p1', 'Mago', [mon], 0);
        const to   = makePlayer('p2', 'Guerreiro');

        const result = validateTrade(from, to, 'm1', { inBattle: false });
        expect(result.valid).toBe(true);
    });
});

// ─── Validação de troca — monstro KO ──────────────────────────────────────────

describe('Trade UI — monstro KO (hp=0)', () => {
    it('rejeita troca de monstro com 0 HP', () => {
        const mon = makeMon('m1', 'Mago', 0);
        const from = makePlayer('p1', 'Mago', [mon]);
        const to   = makePlayer('p2', 'Guerreiro');

        const result = validateTrade(from, to, 'm1');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.MONSTER_KO);
    });

    it('aceita troca de monstro com HP positivo', () => {
        const mon = makeMon('m1', 'Mago', 1);
        const from = makePlayer('p1', 'Mago', [mon]);
        const to   = makePlayer('p2', 'Guerreiro');

        const result = validateTrade(from, to, 'm1');
        expect(result.valid).toBe(true);
    });
});

// ─── Validação de troca — mesmo jogador ───────────────────────────────────────

describe('Trade UI — mesmo jogador', () => {
    it('rejeita troca quando cedente e receptor têm o mesmo ID', () => {
        const mon = makeMon('m1');
        const p = makePlayer('p1', 'Mago', [mon]);

        const result = validateTrade(p, p, 'm1');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.SAME_PLAYER);
    });
});

// ─── Validação de troca — monstro não encontrado ──────────────────────────────

describe('Trade UI — monstro não encontrado', () => {
    it('rejeita troca quando instanceId não está no time do cedente', () => {
        const from = makePlayer('p1', 'Mago', [makeMon('m1')]);
        const to   = makePlayer('p2', 'Guerreiro');

        const result = validateTrade(from, to, 'mx_inexistente');
        expect(result.valid).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });
});

// ─── proposeTradeAction — fluxo de proposta ───────────────────────────────────

describe('Trade UI — proposta de troca', () => {
    it('cria proposta com metadados corretos', () => {
        const mon = makeMon('m1', 'Mago', 30);
        mon.nickname = 'Flama';
        const from = makePlayer('p1', 'Mago', [mon]);
        const to   = makePlayer('p2', 'Guerreiro');

        const result = proposeTradeAction(from, to, 'm1');
        expect(result.ok).toBe(true);
        expect(result.trade.fromPlayerId).toBe('p1');
        expect(result.trade.toPlayerId).toBe('p2');
        expect(result.trade.instanceId).toBe('m1');
        expect(result.trade.monsterName).toBe('Flama');
    });

    it('proposta falha quando monstro é KO', () => {
        const mon = makeMon('m1', 'Mago', 0);
        const from = makePlayer('p1', 'Mago', [mon]);
        const to   = makePlayer('p2', 'Guerreiro');

        const result = proposeTradeAction(from, to, 'm1');
        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR.MONSTER_KO);
    });
});

// ─── acceptTrade — fluxo de aceitação ────────────────────────────────────────

describe('Trade UI — aceitação de troca', () => {
    it('move monstro do time do cedente para o receptor', () => {
        const mon  = makeMon('m1');
        const from = makePlayer('p1', 'Mago', [mon, makeMon('m2')]);
        const to   = makePlayer('p2', 'Guerreiro', []);

        const proposal = proposeTradeAction(from, to, 'm1');
        expect(proposal.ok).toBe(true);

        const result = acceptTrade(proposal.trade, from, to);
        expect(result.ok).toBe(true);
        expect(result.monsterName).toBe('Mon-m1');
        expect(from.team.some(m => m.instanceId === 'm1')).toBe(false);
        expect(to.team.some(m => m.instanceId === 'm1')).toBe(true);
    });

    it('receptor recebe monstro mesmo com time vazio', () => {
        const mon  = makeMon('m1');
        const from = makePlayer('p1', 'Mago', [mon]);
        const to   = makePlayer('p2', 'Guerreiro', []);

        const proposal = proposeTradeAction(from, to, 'm1');
        acceptTrade(proposal.trade, from, to);

        expect(to.team).toHaveLength(1);
        expect(to.team[0].instanceId).toBe('m1');
    });

    it('ajusta activeIndex do cedente quando necessário', () => {
        const mon0 = makeMon('m0');
        const mon1 = makeMon('m1');
        const from = makePlayer('p1', 'Mago', [mon0, mon1], 1); // ativo = m1
        const to   = makePlayer('p2', 'Guerreiro', []);

        // trocar m1 (ativo) fora de batalha
        const proposal = proposeTradeAction(from, to, 'm1', { inBattle: false });
        expect(proposal.ok).toBe(true);

        acceptTrade(proposal.trade, from, to);

        // activeIndex deve voltar para 0 (único membro restante)
        expect(from.activeIndex).toBe(0);
    });
});

// ─── Mapeamento de erros para mensagens de UI ─────────────────────────────────

describe('Trade UI — mapeamento de mensagens de erro', () => {
    const ERROR_MESSAGES = {
        [TRADE_ERROR.MONSTER_NOT_FOUND]:  'Monstrinho não encontrado',
        [TRADE_ERROR.MONSTER_IN_BATTLE]:  'Não é possível trocar monstro em batalha',
        [TRADE_ERROR.MONSTER_KO]:         'Não é possível trocar monstro desmaiado',
        [TRADE_ERROR.SAME_PLAYER]:        'Não pode trocar consigo mesmo',
        [TRADE_ERROR.INVALID_PLAYER]:     'Jogador inválido',
        [TRADE_ERROR.INVALID_INSTANCE]:   'Instância inválida',
    };

    it('todos os códigos de erro têm mensagem mapeada', () => {
        Object.values(TRADE_ERROR).forEach(code => {
            expect(ERROR_MESSAGES[code]).toBeDefined();
            expect(typeof ERROR_MESSAGES[code]).toBe('string');
        });
    });

    it('mensagens são strings não-vazias', () => {
        Object.values(ERROR_MESSAGES).forEach(msg => {
            expect(msg.length).toBeGreaterThan(0);
        });
    });
});
