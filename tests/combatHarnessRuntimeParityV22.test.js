import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DEFAULT_BASIC_POWER,
  buildClassAdvantages,
  calculateEneRegen,
  createSeededRng,
  getClassModifiers,
  getSpdBonus,
  rollD20,
  simulateScenario,
} from '../js/combat/combatSimulationHarness.js';
import { executeWildAttack } from '../js/combat/wildActions.js';
import { executePlayerAttackGroup } from '../js/combat/groupActions.js';
import {
  createGroupEncounter,
  getBuffModifiers,
  getClassAdvantageModifiers,
  getCurrentActor,
  hasAliveEnemies,
  hasAlivePlayers,
  isAlive,
  pickEnemyTargetByDEF,
} from '../js/combat/groupCore.js';
import {
  RC_CATEGORY,
  computeGroupDamage,
  resolveConfrontation,
} from '../js/combat/groupCombatFormula.js';

const ROOT = resolve(import.meta.dirname, '..');
const matchupPayload = JSON.parse(
  readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'),
);
const CANON_CLASS_ADVANTAGES = buildClassAdvantages(matchupPayload);

const SEEDED_ROLLS = Object.freeze({
  normal: Object.freeze({ seed: 'parity-10-5-680', d20A: 10, d20D: 5 }),
  natural1: Object.freeze({ seed: 'parity-1-10-27', d20A: 1, d20D: 10 }),
  natural20: Object.freeze({ seed: 'parity-20-5-316', d20A: 20, d20D: 5 }),
  defender20: Object.freeze({ seed: 'parity-10-20-1124', d20A: 10, d20D: 20 }),
  highAttack: Object.freeze({ seed: 'parity-15-5-349', d20A: 15, d20D: 5 }),
});

function makeCombatant({
  id,
  name,
  className,
  atk = 7,
  def = 10,
  spd = 5,
  level = 1,
  hp = 500,
  ene = 0,
  eneMax = 20,
}) {
  return {
    id,
    uid: id,
    name,
    class: className,
    rarity: 'Comum',
    level,
    hp,
    hpMax: hp,
    atk,
    def,
    spd,
    ene,
    eneMax,
    buffs: [],
    _participated: false,
  };
}

function seededPair(seed) {
  const rng = createSeededRng(seed);
  return [rollD20(rng), rollD20(rng)];
}

function expectedFormula({ attacker, defender, power, classAdvantages, d20A, d20D, buffOff }) {
  const classMods = getClassModifiers(attacker.class, defender.class, classAdvantages);
  const confrontation = resolveConfrontation({
    d20A,
    d20D,
    atkAtk: attacker.atk,
    atkDef: defender.def,
    atkLvl: attacker.level,
    defLvl: defender.level,
    classModAtk: classMods.atkBonus,
    posMod: 0,
    buffOff,
    buffDef: 0,
  });
  const damage = computeGroupDamage({
    pwr: power,
    atk: attacker.atk,
    lvlDiff: attacker.level - defender.level,
    defEnemy: defender.def,
    damageMult: classMods.damageMult,
    critBonus: confrontation.critDmgBonus,
    category: confrontation.category,
    d20ANatural: confrontation.d20ANatural,
    d20DNatural: confrontation.d20DNatural,
  }).damage;
  return { confrontation, damage };
}

function runHarnessBasic({ seed, attacker, defender, classAdvantages }) {
  const scenario = {
    id: `parity-${seed}`,
    label: `parity-${seed}`,
    player: structuredClone(attacker),
    enemy: structuredClone(defender),
    playerActionProfile: 'basic',
    enemyActionProfile: 'basic',
    classAdvantages,
    initialEnergyRatio: 0,
    passivesEnabled: true,
  };
  const result = simulateScenario(scenario, { runs: 1, seed, maxTurns: 1 });
  return {
    result,
    damage: result.summary.damage.meanPerDamagingAction,
  };
}

function runWildBasic({ d20A, d20D, attacker, defender, classAdvantages, eneRegenData = {} }) {
  const playerMonster = structuredClone(attacker);
  const wildMonster = structuredClone(defender);
  const player = {
    id: 'player_1',
    name: 'Jogador',
    class: playerMonster.class,
    inventory: {},
    team: [playerMonster],
    activeIndex: 0,
  };
  const encounter = {
    id: 'wild_parity',
    type: 'wild',
    active: true,
    selectedPlayerId: player.id,
    wildMonster,
    log: [],
    rewardsGranted: false,
  };
  const counterRolls = [1, 20];
  let counterIndex = 0;
  const hpBefore = wildMonster.hp;
  const result = executeWildAttack({
    encounter,
    player,
    playerMonster,
    d20Roll: d20A,
    defenderRoll: d20D,
    dependencies: {
      classAdvantages,
      eneRegenData,
      getBasicPower: className => DEFAULT_BASIC_POWER[className] ?? 7,
      rollD20: () => counterRolls[counterIndex++] ?? 20,
      recordD20Roll: vi.fn(),
      tutorialOnAction: vi.fn(),
      handleVictoryRewards: vi.fn(),
      audio: { playSfx: vi.fn() },
      ui: {
        flashTarget: vi.fn(),
        showFloatingText: vi.fn(),
        updateDiceClash: vi.fn(),
      },
    },
  });
  return {
    result,
    encounter,
    playerMonster,
    wildMonster,
    damage: hpBefore - wildMonster.hp,
  };
}

function runGroupBasic({ d20A, d20D, attacker, defender, classAdvantages }) {
  const playerMonster = structuredClone(attacker);
  const enemy = structuredClone(defender);
  const player = {
    id: 'player_1',
    name: 'Jogador',
    class: playerMonster.class,
    team: [playerMonster],
    activeIndex: 0,
    inventory: {},
  };
  const encounter = createGroupEncounter({
    participantIds: [player.id],
    type: 'group_trainer',
    enemies: [enemy],
  });
  encounter.turnOrder = [{
    side: 'player',
    id: player.id,
    name: player.name,
    spd: playerMonster.spd,
  }];
  encounter.turnIndex = 0;
  encounter.currentActor = encounter.turnOrder[0];

  const rolls = [d20A, d20D];
  let rollIndex = 0;
  const hpBefore = enemy.hp;
  const state = {
    currentEncounter: encounter,
    players: [player],
    config: { classAdvantages },
  };
  const deps = {
    state,
    core: {
      getCurrentActor,
      isAlive,
      hasAlivePlayers: (enc, players) => hasAlivePlayers(enc, players),
      hasAliveEnemies,
      getBuffModifiers,
      getClassAdvantageModifiers,
      pickEnemyTargetByDEF,
    },
    audio: { playSfx: vi.fn() },
    storage: { save: vi.fn() },
    ui: {
      render: vi.fn(),
      showDamageFeedback: vi.fn(),
      showMissFeedback: vi.fn(),
      playAttackFeedback: vi.fn(),
    },
    helpers: {
      log: (enc, message) => enc.log.push(message),
      handleVictoryRewards: vi.fn(),
      getPlayerById: id => (id === player.id ? player : null),
      getActiveMonsterOfPlayer: currentPlayer => currentPlayer?.team?.[currentPlayer.activeIndex ?? 0],
      getEnemyByIndex: (enc, index) => enc?.enemies?.[index],
      firstAliveIndex: team => team.findIndex(monster => Number(monster?.hp) > 0),
      applyEneRegen: vi.fn(),
      updateBuffs: vi.fn(),
      rollD20: () => rolls[rollIndex++] ?? 10,
      recordD20Roll: vi.fn(),
      getBasicAttackPower: className => DEFAULT_BASIC_POWER[className] ?? 7,
      applyDamage: (target, damage) => {
        target.hp = Math.max(0, target.hp - damage);
      },
      openSwitchMonsterModal: vi.fn(),
      getItemDef: vi.fn(() => null),
      getSkillById: vi.fn(() => null),
      canUseSkillNow: vi.fn(() => true),
    },
  };

  const result = executePlayerAttackGroup(deps, 0);
  return {
    result,
    encounter,
    playerMonster,
    enemy,
    damage: hpBefore - enemy.hp,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Paridade determinística — harness, Wild e Group', () => {
  const parityCases = [
    {
      id: 'neutral_normal',
      rolls: SEEDED_ROLLS.normal,
      attackerClass: 'Mago',
      defenderClass: 'Mago',
      classAdvantages: {},
    },
    {
      id: 'natural_1',
      rolls: SEEDED_ROLLS.natural1,
      attackerClass: 'Mago',
      defenderClass: 'Mago',
      classAdvantages: {},
    },
    {
      id: 'natural_20',
      rolls: SEEDED_ROLLS.natural20,
      attackerClass: 'Mago',
      defenderClass: 'Mago',
      classAdvantages: {},
    },
    {
      id: 'defender_natural_20',
      rolls: SEEDED_ROLLS.defender20,
      attackerClass: 'Mago',
      defenderClass: 'Mago',
      classAdvantages: {},
    },
    {
      id: 'class_advantage',
      rolls: SEEDED_ROLLS.highAttack,
      attackerClass: 'Guerreiro',
      defenderClass: 'Ladino',
      classAdvantages: CANON_CLASS_ADVANTAGES,
    },
    {
      id: 'class_disadvantage',
      rolls: SEEDED_ROLLS.highAttack,
      attackerClass: 'Guerreiro',
      defenderClass: 'Mago',
      classAdvantages: CANON_CLASS_ADVANTAGES,
    },
    {
      id: 'ladino_attack_passive',
      rolls: SEEDED_ROLLS.highAttack,
      attackerClass: 'Ladino',
      defenderClass: 'Mago',
      classAdvantages: {},
    },
    ...['Guerreiro', 'Bárbaro', 'Curandeiro'].map(defenderClass => ({
      id: `defensive_passive_${defenderClass}`,
      rolls: SEEDED_ROLLS.highAttack,
      attackerClass: 'Mago',
      defenderClass,
      classAdvantages: {},
    })),
  ];

  for (const testCase of parityCases) {
    it(`${testCase.id}: produz o mesmo dano nos três caminhos`, () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const [seededD20A, seededD20D] = seededPair(testCase.rolls.seed);
      expect([seededD20A, seededD20D]).toEqual([
        testCase.rolls.d20A,
        testCase.rolls.d20D,
      ]);

      const attacker = makeCombatant({
        id: 'attacker',
        name: 'Atacante',
        className: testCase.attackerClass,
        atk: 7,
        def: 1000,
        spd: 5,
      });
      const defender = makeCombatant({
        id: 'defender',
        name: 'Defensor',
        className: testCase.defenderClass,
        atk: 1,
        def: 10,
        spd: 5,
      });
      const power = DEFAULT_BASIC_POWER[attacker.class] ?? 7;
      const expected = expectedFormula({
        attacker,
        defender,
        power,
        classAdvantages: testCase.classAdvantages,
        d20A: seededD20A,
        d20D: seededD20D,
        buffOff: 0,
      });

      const harness = runHarnessBasic({
        seed: testCase.rolls.seed,
        attacker,
        defender,
        classAdvantages: testCase.classAdvantages,
      });
      const wild = runWildBasic({
        d20A: seededD20A,
        d20D: seededD20D,
        attacker,
        defender,
        classAdvantages: testCase.classAdvantages,
      });
      const group = runGroupBasic({
        d20A: seededD20A,
        d20D: seededD20D,
        attacker,
        defender,
        classAdvantages: testCase.classAdvantages,
      });

      expect(harness.result.summary.confrontation[expected.confrontation.category]).toBeGreaterThan(0);
      expect(wild.encounter.log.join(' ')).toContain(`RC ${expected.confrontation.rc}`);
      expect(group.encounter.log.join(' ')).toContain(`RC${expected.confrontation.rc}`);
      expect(wild.damage).toBe(harness.damage);
      expect(group.damage).toBe(harness.damage);
    });
  }
});

describe('Diferenças caracterizadas — não corrigidas neste PR', () => {
  it('DRIFT_WILD_GROUP: SPD altera harness/Wild, mas não o ataque básico Group', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { seed, d20A, d20D } = SEEDED_ROLLS.normal;
    const attacker = makeCombatant({
      id: 'fast_attacker',
      name: 'Atacante rápido',
      className: 'Mago',
      atk: 3,
      def: 1000,
      spd: 8,
    });
    const defender = makeCombatant({
      id: 'slow_defender',
      name: 'Defensor lento',
      className: 'Mago',
      atk: 1,
      def: 10,
      spd: 5,
    });

    expect(seededPair(seed)).toEqual([d20A, d20D]);
    expect(getSpdBonus(attacker, defender)).toBe(1);

    const harness = runHarnessBasic({ seed, attacker, defender, classAdvantages: {} });
    const wild = runWildBasic({ d20A, d20D, attacker, defender, classAdvantages: {} });
    const group = runGroupBasic({ d20A, d20D, attacker, defender, classAdvantages: {} });

    const expectedWithSpd = expectedFormula({
      attacker,
      defender,
      power: DEFAULT_BASIC_POWER.Mago,
      classAdvantages: {},
      d20A,
      d20D,
      buffOff: 1,
    });
    const expectedWithoutSpd = expectedFormula({
      attacker,
      defender,
      power: DEFAULT_BASIC_POWER.Mago,
      classAdvantages: {},
      d20A,
      d20D,
      buffOff: 0,
    });

    expect(expectedWithSpd.confrontation.category).toBe(RC_CATEGORY.ACERTO_NORMAL);
    expect(expectedWithoutSpd.confrontation.category).toBe(RC_CATEGORY.ACERTO_REDUZIDO);
    expect(harness.damage).toBe(expectedWithSpd.damage);
    expect(wild.damage).toBe(expectedWithSpd.damage);
    expect(group.damage).toBe(expectedWithoutSpd.damage);
    expect(group.damage).not.toBe(harness.damage);
  });

  it('DRIFT_HARNESS_WILD: ENE fracionária usa floor no harness e ceil no Wild', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const attacker = makeCombatant({
      id: 'ene_attacker',
      name: 'Atacante',
      className: 'Mago',
      atk: 7,
      def: 1000,
      spd: 5,
      ene: 0,
      eneMax: 20,
    });
    const defender = makeCombatant({
      id: 'ene_defender',
      name: 'Defensor',
      className: 'Mago',
      atk: 1,
      def: 10,
      spd: 5,
    });
    const regenTable = { Mago: { pct: 0.14, min: 2 } };

    const harnessGain = calculateEneRegen('Mago', 20, regenTable);
    const wild = runWildBasic({
      d20A: 10,
      d20D: 5,
      attacker,
      defender,
      classAdvantages: {},
      eneRegenData: regenTable,
    });

    expect(harnessGain).toBe(2);
    expect(wild.playerMonster.ene).toBe(3);
  });
});
