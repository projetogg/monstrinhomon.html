/**
 * GROUP TURN ORDER TESTS (PR-04)
 *
 * Testes para o loop de grupo robusto: turnOrder + KO confiável.
 * Cobertura:
 *   - removeKOedFromTurnOrder: remove inimigos KO'd, remove jogadores sem substituto,
 *     mantém jogadores com ativo vivo, mantém jogadores com substituto disponível,
 *     ajusta turnIndex corretamente
 *   - calculateTurnOrder: só inclui entidades vivas, ordena por SPD
 *   - KO flow: depois de KO, entidade removida do turnOrder
 */

import { describe, it, expect } from 'vitest';
import {
    removeKOedFromTurnOrder,
    calculateTurnOrder,
    isAlive,
    getEligibleSubstitutes,
} from '../js/combat/groupCore.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        id: overrides.id ?? 'm1',
        name: overrides.name ?? 'Mon',
        class: overrides.class ?? 'Guerreiro',
        hp: overrides.hp ?? 30,
        hpMax: overrides.hpMax ?? 40,
        spd: overrides.spd ?? 5,
        atk: 5, def: 3,
        ...overrides,
    };
}

function makePlayer(id, overrides = {}) {
    return {
        id,
        name: `Jogador ${id}`,
        class: overrides.class ?? 'Guerreiro',
        activeIndex: overrides.activeIndex ?? 0,
        team: overrides.team ?? [makeMon({ id: `${id}_m1` })],
        ...overrides,
    };
}

function makeEnemy(id, overrides = {}) {
    return {
        id,
        name: `Inimigo ${id}`,
        class: overrides.class ?? 'Bárbaro',
        hp: overrides.hp ?? 30,
        hpMax: 40,
        spd: overrides.spd ?? 3,
        atk: 5, def: 3,
        ...overrides,
    };
}

function makeTurnOrderEntry(id, side, spd = 5) {
    return { id, side, name: side === 'player' ? `J${id}` : `E${id}`, spd };
}

function makeEnc(turnOrder, turnIndex = 0, enemies = []) {
    return {
        id: 'enc1',
        type: 'group',
        turnOrder,
        turnIndex,
        enemies,
        participants: turnOrder.filter(a => a.side === 'player').map(a => a.id),
    };
}

// ─── removeKOedFromTurnOrder ──────────────────────────────────────────────────

describe('removeKOedFromTurnOrder', () => {
    describe('inimigos KO\'d', () => {
        it('remove inimigo com HP=0 do turnOrder', () => {
            const enemies = [makeEnemy(0, { hp: 0 })];
            const turnOrder = [makeTurnOrderEntry('p1', 'player'), makeTurnOrderEntry(0, 'enemy')];
            const enc = makeEnc(turnOrder, 0, enemies);

            const removed = removeKOedFromTurnOrder(enc, [makePlayer('p1')]);

            expect(removed).toBe(1);
            expect(enc.turnOrder).toHaveLength(1);
            expect(enc.turnOrder[0].side).toBe('player');
        });

        it('mantém inimigo vivo no turnOrder', () => {
            const enemies = [makeEnemy(0, { hp: 20 })];
            const turnOrder = [makeTurnOrderEntry('p1', 'player'), makeTurnOrderEntry(0, 'enemy')];
            const enc = makeEnc(turnOrder, 0, enemies);

            const removed = removeKOedFromTurnOrder(enc, [makePlayer('p1')]);

            expect(removed).toBe(0);
            expect(enc.turnOrder).toHaveLength(2);
        });

        it('remove múltiplos inimigos KO\'d', () => {
            const enemies = [makeEnemy(0, { hp: 0 }), makeEnemy(1, { hp: 0 }), makeEnemy(2, { hp: 15 })];
            const turnOrder = [
                makeTurnOrderEntry(0, 'enemy'),
                makeTurnOrderEntry(1, 'enemy'),
                makeTurnOrderEntry(2, 'enemy'),
            ];
            const enc = makeEnc(turnOrder, 0, enemies);

            const removed = removeKOedFromTurnOrder(enc, []);

            expect(removed).toBe(2);
            expect(enc.turnOrder).toHaveLength(1);
            expect(enc.turnOrder[0].id).toBe(2);
        });
    });

    describe('jogadores KO\'d', () => {
        it('remove jogador cujo ativo KO\'d e sem substituto', () => {
            const p1 = makePlayer('p1', {
                team: [makeMon({ id: 'm1', hp: 0 })],
                activeIndex: 0,
            });
            const turnOrder = [makeTurnOrderEntry('p1', 'player')];
            const enc = makeEnc(turnOrder, 0, []);

            const removed = removeKOedFromTurnOrder(enc, [p1]);

            expect(removed).toBe(1);
            expect(enc.turnOrder).toHaveLength(0);
            // participants também deve ser atualizado
            expect(enc.participants).not.toContain('p1');
        });

        it('mantém jogador cujo ativo KO\'d mas tem substituto elegível', () => {
            const p1 = makePlayer('p1', {
                class: 'Guerreiro',
                team: [
                    makeMon({ id: 'm1', hp: 0, class: 'Guerreiro' }),     // KO'd ativo
                    makeMon({ id: 'm2', hp: 25, class: 'Guerreiro' }),    // substituto vivo
                ],
                activeIndex: 0,
            });
            const turnOrder = [makeTurnOrderEntry('p1', 'player')];
            const enc = makeEnc(turnOrder, 0, []);

            const removed = removeKOedFromTurnOrder(enc, [p1]);

            // Mantém porque tem substituto — modal de troca será aberto
            expect(removed).toBe(0);
            expect(enc.turnOrder).toHaveLength(1);
        });

        it('mantém jogador cujo ativo está vivo', () => {
            const p1 = makePlayer('p1', {
                team: [makeMon({ id: 'm1', hp: 25 })],
                activeIndex: 0,
            });
            const turnOrder = [makeTurnOrderEntry('p1', 'player')];
            const enc = makeEnc(turnOrder, 0, []);

            const removed = removeKOedFromTurnOrder(enc, [p1]);

            expect(removed).toBe(0);
            expect(enc.turnOrder).toHaveLength(1);
        });
    });

    describe('ajuste de turnIndex', () => {
        it('turnIndex é ajustado após remoção para não ultrapassar array', () => {
            const enemies = [makeEnemy(0, { hp: 0 }), makeEnemy(1, { hp: 30 })];
            const turnOrder = [
                makeTurnOrderEntry(0, 'enemy'),  // KO
                makeTurnOrderEntry(1, 'enemy'),  // vivo
            ];
            const enc = makeEnc(turnOrder, 1, enemies); // turnIndex=1 (segundo inimigo)

            removeKOedFromTurnOrder(enc, []);

            // Após remover índice 0, o array tem 1 elemento. turnIndex=1 % 1 = 0
            expect(enc.turnIndex).toBe(0);
            expect(enc.turnOrder).toHaveLength(1);
        });

        it('turnIndex 0 não se altera se nada foi removido', () => {
            const enemies = [makeEnemy(0, { hp: 20 })];
            const turnOrder = [makeTurnOrderEntry(0, 'enemy')];
            const enc = makeEnc(turnOrder, 0, enemies);

            removeKOedFromTurnOrder(enc, []);

            expect(enc.turnIndex).toBe(0);
        });

        it('turnIndex resetado para 0 se turnOrder fica vazio', () => {
            const enemies = [makeEnemy(0, { hp: 0 })];
            const turnOrder = [makeTurnOrderEntry(0, 'enemy')];
            const enc = makeEnc(turnOrder, 0, enemies);

            removeKOedFromTurnOrder(enc, []);

            expect(enc.turnOrder).toHaveLength(0);
            expect(enc.turnIndex).toBe(0);
        });
    });

    describe('cenário misto (jogadores + inimigos)', () => {
        it('remove somente entidades KO\'d, mantém vivos', () => {
            const p1 = makePlayer('p1', { team: [makeMon({ hp: 20 })] });
            const p2 = makePlayer('p2', { team: [makeMon({ hp: 0 })] }); // KO sem sub
            const enemies = [makeEnemy(0, { hp: 0 }), makeEnemy(1, { hp: 15 })];

            const turnOrder = [
                makeTurnOrderEntry('p1', 'player'),
                makeTurnOrderEntry('p2', 'player'),
                makeTurnOrderEntry(0, 'enemy'),
                makeTurnOrderEntry(1, 'enemy'),
            ];
            const enc = makeEnc(turnOrder, 0, enemies);

            const removed = removeKOedFromTurnOrder(enc, [p1, p2]);

            expect(removed).toBe(2); // p2 KO'd + inimigo 0 KO'd
            expect(enc.turnOrder).toHaveLength(2);
            const ids = enc.turnOrder.map(a => `${a.side}:${a.id}`);
            expect(ids).toContain('player:p1');
            expect(ids).toContain('enemy:1');
            // p2 removido de participants
            expect(enc.participants).not.toContain('p2');
            expect(enc.participants).toContain('p1');
        });
    });

    describe('guards', () => {
        it('retorna 0 sem encounter', () => {
            expect(removeKOedFromTurnOrder(null, [])).toBe(0);
        });

        it('retorna 0 se turnOrder não é array', () => {
            expect(removeKOedFromTurnOrder({ turnOrder: null }, [])).toBe(0);
        });
    });
});

// ─── calculateTurnOrder — integração com PR-04 ───────────────────────────────

describe('calculateTurnOrder (PR-04 integration)', () => {
    it('só inclui jogadores com monstro ativo vivo', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 8, hp: 30 })] });
        const p2 = makePlayer('p2', { team: [makeMon({ spd: 6, hp: 0 })] }); // KO no início
        const enc = {
            id: 'e1', type: 'group',
            participants: ['p1', 'p2'],
            enemies: [],
            turnOrder: [],
        };

        const order = calculateTurnOrder(enc, [p1, p2], () => 10);

        const playerIds = order.filter(a => a.side === 'player').map(a => a.id);
        expect(playerIds).toContain('p1');
        expect(playerIds).not.toContain('p2');
    });

    it('ordena por SPD descendente', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 3 })] });
        const enc = {
            id: 'e1', type: 'group',
            participants: ['p1'],
            enemies: [makeEnemy(0, { spd: 8, hp: 30 })],
            turnOrder: [],
        };

        const order = calculateTurnOrder(enc, [p1], () => 10);

        // Enemy (spd=8) deve ser primeiro, player (spd=3) segundo
        expect(order[0].side).toBe('enemy');
        expect(order[0].spd).toBe(8);
        expect(order[1].side).toBe('player');
    });

    it('só inclui inimigos vivos', () => {
        const enc = {
            id: 'e1', type: 'group',
            participants: [],
            enemies: [makeEnemy(0, { hp: 20 }), makeEnemy(1, { hp: 0 })],
            turnOrder: [],
        };

        const order = calculateTurnOrder(enc, [], () => 10);

        expect(order).toHaveLength(1);
        expect(order[0].id).toBe(0);
    });
});

// ─── isAlive ─────────────────────────────────────────────────────────────────

describe('isAlive', () => {
    it('hp > 0 → true', () => expect(isAlive({ hp: 1 })).toBe(true));
    it('hp = 0 → false', () => expect(isAlive({ hp: 0 })).toBe(false));
    it('hp negativo → false', () => expect(isAlive({ hp: -5 })).toBe(false));
    it('entity null → false', () => expect(isAlive(null)).toBe(false));
    it('entity undefined → false', () => expect(isAlive(undefined)).toBe(false));
    it('hp não-numérico → false', () => expect(isAlive({ hp: 'abc' })).toBe(false));
});
