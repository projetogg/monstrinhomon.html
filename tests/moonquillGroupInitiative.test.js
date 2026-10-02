import { describe, expect, it, vi } from 'vitest';
import * as GroupCore from '../js/combat/groupCore.js';
import { advanceGroupTurn } from '../js/combat/groupActions.js';

function makeMon({ spd = 5, buffs = [] } = {}) {
  return {
    id: 'mon1',
    name: 'Mon',
    class: 'Mago',
    hp: 40,
    hpMax: 40,
    atk: 8,
    def: 6,
    spd,
    ene: 10,
    eneMax: 10,
    buffs,
  };
}

function makePlayer(mon) {
  return {
    id: 'p1',
    name: 'Player',
    class: 'Mago',
    activeIndex: 0,
    team: [mon],
  };
}

function makeEnemy({ spd = 6 } = {}) {
  return {
    id: 0,
    name: 'Enemy',
    class: 'Curandeiro',
    hp: 40,
    hpMax: 40,
    atk: 6,
    def: 6,
    spd,
    buffs: [],
  };
}

describe('Group initiative consome SPD efetivo', () => {
  it('calculateTurnOrder usa buff de SPD ativo', () => {
    const mon = makeMon({
      spd: 5,
      buffs: [{ type: 'spd', power: 2, duration: 1, source: 'moonquill_passive' }],
    });
    const player = makePlayer(mon);
    const enemy = makeEnemy({ spd: 6 });
    const enc = { participants: ['p1'], enemies: [enemy] };

    const order = GroupCore.calculateTurnOrder(enc, [player], () => 10);

    expect(order[0]).toMatchObject({ side: 'player', id: 'p1', spd: 7 });
    expect(order[1]).toMatchObject({ side: 'enemy', id: 0, spd: 6 });
  });

  it('advanceGroupTurn recalcula a ordem na virada da rodada quando SPD mudou', () => {
    const mon = makeMon({
      spd: 5,
      buffs: [{ type: 'spd', power: 2, duration: 1, source: 'moonquill_passive' }],
    });
    const player = makePlayer(mon);
    const enemy = makeEnemy({ spd: 6 });
    const enc = {
      id: 'initiative-recalc',
      type: 'group_trainer',
      active: true,
      finished: false,
      participants: ['p1'],
      enemies: [enemy],
      // Ordem anterior à aplicação do buff: inimigo era mais rápido.
      turnOrder: [
        { side: 'player', id: 'p1', name: 'Player', spd: 5 },
        { side: 'enemy', id: 0, name: 'Enemy', spd: 6 },
      ],
      turnIndex: 1,
      currentActor: { side: 'enemy', id: 0, name: 'Enemy', spd: 6 },
      log: [],
      _roundNumber: 1,
      _turnOrderNeedsRecalc: true,
    };

    const deps = {
      state: { players: [player], config: {}, currentEncounter: enc },
      core: GroupCore,
      audio: { playSfx: vi.fn() },
      helpers: {
        rollD20: () => 10,
        log: (e, msg) => e.log.push(msg),
        handleVictoryRewards: vi.fn(),
        openSwitchMonsterModal: vi.fn(),
      },
    };

    advanceGroupTurn(enc, deps);

    expect(enc._turnOrderNeedsRecalc).toBe(false);
    expect(enc._roundNumber).toBe(2);
    expect(enc.turnOrder[0]).toMatchObject({ side: 'player', id: 'p1', spd: 7 });
    expect(enc.turnIndex).toBe(0);
    expect(enc.currentActor).toMatchObject({ side: 'player', id: 'p1' });
  });
});
