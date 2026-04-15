/**
 * GROUP MOVE POSITION TESTS (XVII-E)
 *
 * Testes para a ação executeGroupMove:
 * - Ciclo front→mid→back→front
 * - Consome o turno do jogador (sem consumir ENE)
 * - Registra log correto de posição
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeGroupMove } from '../js/combat/groupActions.js';
import {
    createGroupEncounter,
    getCurrentActor,
    isAlive,
    hasAlivePlayers,
    hasAliveEnemies,
    getClassAdvantageModifiers,
    checkHit,
    calcDamage,
    getBuffModifiers,
    pickEnemyTargetByDEF
} from '../js/combat/groupCore.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        uid: 'mi_test',
        name: 'Mon',
        class: 'Guerreiro',
        hp: 50, hpMax: 50,
        atk: 10, def: 8, spd: 5,
        ene: 10, eneMax: 10,
        level: 5, buffs: [],
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        uid: 'enemy_0',
        name: 'Inimigo',
        class: 'Bárbaro',
        hp: 40, hpMax: 40,
        atk: 8, def: 6, spd: 3,
        ene: 10, eneMax: 10,
        level: 3, buffs: [],
        ...overrides
    };
}

function makePlayer(mon, overrides = {}) {
    return {
        id: 'player_1', name: 'Ana', class: 'Guerreiro',
        team: [mon], activeIndex: 0,
        inventory: {},
        ...overrides
    };
}

function makeDeps({ mon, player, enemies, startPosition = 'front' }) {
    const enc = createGroupEncounter({
        participantIds: [player.id],
        type: 'group_trainer',
        enemies
    });
    enc.turnOrder = [{ side: 'player', id: player.id, name: player.name, spd: 5 }];
    enc.turnIndex = 0;
    enc.currentActor = enc.turnOrder[0];
    enc.positions = { [player.id]: startPosition };

    const state = { currentEncounter: enc, players: [player], config: { classAdvantages: {} } };
    const logs = [];

    return {
        enc,
        logs,
        deps: {
            state,
            core: {
                getCurrentActor,
                isAlive,
                hasAlivePlayers: (e, pl) => hasAlivePlayers(e, pl),
                hasAliveEnemies,
                getBuffModifiers,
                getClassAdvantageModifiers,
                checkHit: () => true,
                calcDamage,
                pickEnemyTargetByDEF
            },
            audio: { playSfx: vi.fn() },
            storage: { save: vi.fn() },
            ui: { render: vi.fn() },
            helpers: {
                log: (e, msg) => logs.push(msg),
                getPlayerById: id => id === player.id ? player : null,
                getActiveMonsterOfPlayer: p => p.team[p.activeIndex],
                getEnemyByIndex: (e, idx) => e.enemies[idx]
            }
        }
    };
}

// ── Testes ─────────────────────────────────────────────────────────────────

describe('executeGroupMove - ciclo de posição', () => {
    it('avança front → mid', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], startPosition: 'front' });

        const result = executeGroupMove(deps);

        expect(result).toBe(true);
        expect(enc.positions[player.id]).toBe('mid');
    });

    it('avança mid → back', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], startPosition: 'mid' });

        const result = executeGroupMove(deps);

        expect(result).toBe(true);
        expect(enc.positions[player.id]).toBe('back');
    });

    it('avança back → front (ciclo completo)', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], startPosition: 'back' });

        const result = executeGroupMove(deps);

        expect(result).toBe(true);
        expect(enc.positions[player.id]).toBe('front');
    });

    it('ciclo completo front→mid→back→front em 3 chamadas', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        for (const [start, expected] of [['front','mid'], ['mid','back'], ['back','front']]) {
            const { enc, deps } = makeDeps({ mon: { ...mon }, player: { ...player, team: [{ ...mon }] }, enemies: [{ ...enemy }], startPosition: start });
            executeGroupMove(deps);
            expect(enc.positions[player.id]).toBe(expected);
        }
    });

    it('não consome ENE ao mover', () => {
        const mon = makeMon({ ene: 8 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { deps } = makeDeps({ mon, player, enemies: [enemy], startPosition: 'front' });

        executeGroupMove(deps);

        expect(mon.ene).toBe(8);
    });

    it('consome o turno (chama advanceGroupTurn — storage.save e ui.render)', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { deps } = makeDeps({ mon, player, enemies: [enemy] });

        executeGroupMove(deps);

        expect(deps.storage.save).toHaveBeenCalled();
        expect(deps.ui.render).toHaveBeenCalled();
    });

    it('registra log com nova posição em português', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { logs, deps } = makeDeps({ mon, player, enemies: [enemy], startPosition: 'front' });

        executeGroupMove(deps);

        expect(logs.some(l => l.includes('Meio'))).toBe(true);
        expect(logs.some(l => l.includes(player.name))).toBe(true);
    });

    it('retorna false se encounter encerrado', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });
        enc.finished = true;

        expect(executeGroupMove(deps)).toBe(false);
    });

    it('retorna false se não é turno de jogador', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });
        enc.turnOrder[0] = { side: 'enemy', id: 'enemy_0', name: 'Inimigo', spd: 3 };
        enc.currentActor = enc.turnOrder[0];

        expect(executeGroupMove(deps)).toBe(false);
    });
});
