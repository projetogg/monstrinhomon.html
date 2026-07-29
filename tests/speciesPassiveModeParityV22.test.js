import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  fireCombatEvent,
  ON_ATTACK,
  ON_HEAL_ITEM,
  ON_HIT,
  ON_SKILL_USED,
} from '../js/combat/combatEvents.js';
import { getActivePassiveIds } from '../js/canon/speciesPassives.js';
import {
  executeWildAttack,
  executeWildItemUse,
} from '../js/combat/wildActions.js';
import {
  executePlayerAttackGroup,
  executeUseItemGroup,
} from '../js/combat/groupActions.js';
import {
  getBuffModifiers,
  getClassAdvantageModifiers,
  getCurrentActor,
  hasAliveEnemies,
  hasAlivePlayers,
  isAlive,
} from '../js/combat/groupCore.js';

const ROOT = resolve(import.meta.dirname, '..');
const WILD_SOURCE = readFileSync(resolve(ROOT, 'js/combat/wildActions.js'), 'utf8');
const GROUP_SOURCE = readFileSync(resolve(ROOT, 'js/combat/groupActions.js'), 'utf8');

const EXPECTED_PASSIVE_IDS = Object.freeze([
  'shieldhorn',
  'emberfang',
  'floracura',
  'swiftclaw',
  'moonquill',
  'shadowsting',
  'bellwave',
  'wildpace',
]);

function segment(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);

  expect(start, `marcador inicial ausente: ${startMarker}`).toBeGreaterThanOrEqual(0);
  expect(end, `marcador final ausente: ${endMarker}`).toBeGreaterThan(start);

  return source.slice(start, end);
}

function rollSequence(values, fallback = 10) {
  let index = 0;
  return () => (index < values.length ? values[index++] : fallback);
}

function makeMonster(overrides = {}) {
  return {
    id: 'mon_1',
    uid: 'mon_1',
    name: 'Mon',
    class: 'Animalista',
    level: 1,
    hp: 100,
    hpMax: 100,
    atk: 5,
    def: 5,
    spd: 5,
    ene: 10,
    eneMax: 20,
    buffs: [],
    ...overrides,
  };
}

function makeEnemy(overrides = {}) {
  return {
    id: 'enemy_1',
    uid: 'enemy_1',
    name: 'Enemy',
    class: 'Mago',
    level: 1,
    hp: 100,
    hpMax: 100,
    atk: 1,
    def: 5,
    spd: 5,
    ene: 0,
    eneMax: 20,
    aggression: 50,
    buffs: [],
    ...overrides,
  };
}

function runWildBasic({ playerMonster, enemy, d20A, d20D, power = 7 }) {
  const player = {
    id: 'p1',
    name: 'Player',
    class: playerMonster.class,
    inventory: {},
    team: [playerMonster],
  };
  const encounter = {
    id: 'wild_parity',
    type: 'wild',
    active: true,
    selectedPlayerId: 'p1',
    wildMonster: enemy,
    log: [],
  };

  executeWildAttack({
    encounter,
    player,
    playerMonster,
    d20Roll: d20A,
    defenderRoll: d20D,
    dependencies: {
      eneRegenData: {},
      classAdvantages: {},
      getBasicPower: () => power,
      rollD20: rollSequence([1, 20], 20),
      recordD20Roll: () => {},
      tutorialOnAction: () => {},
      audio: { playSfx: () => {} },
      ui: {
        flashTarget: () => {},
        showFloatingText: () => {},
        updateDiceClash: () => {},
      },
    },
  });

  return { damage: 100 - enemy.hp, encounter };
}

function makeGroupDeps({ playerMonster, enemy, rolls, power = 7, inventory = {} }) {
  const player = {
    id: 'p1',
    name: 'Player',
    class: playerMonster.class,
    team: [playerMonster],
    activeIndex: 0,
    inventory: { ...inventory },
  };
  const encounter = {
    id: 'group_parity',
    type: 'group_trainer',
    active: true,
    finished: false,
    participants: ['p1'],
    enemies: [enemy],
    turnOrder: [{ side: 'player', id: 'p1', name: 'Player', spd: playerMonster.spd }],
    turnIndex: 0,
    log: [],
  };
  const state = {
    currentEncounter: encounter,
    players: [player],
    config: { classAdvantages: {} },
  };

  const deps = {
    state,
    core: {
      getCurrentActor,
      isAlive,
      hasAliveEnemies,
      hasAlivePlayers,
      getBuffModifiers,
      getClassAdvantageModifiers,
    },
    ui: {
      render: () => {},
      showDamageFeedback: () => {},
      showMissFeedback: () => {},
      playAttackFeedback: () => {},
    },
    audio: { playSfx: () => {} },
    storage: { save: () => {} },
    helpers: {
      log: (enc, message) => enc.log.push(message),
      getPlayerById: id => (id === player.id ? player : null),
      getActiveMonsterOfPlayer: targetPlayer => targetPlayer?.team?.[targetPlayer.activeIndex ?? 0],
      getEnemyByIndex: (enc, index) => enc.enemies?.[index],
      applyEneRegen: () => {},
      updateBuffs: () => {},
      rollD20: rollSequence(rolls, 10),
      recordD20Roll: () => {},
      getBasicAttackPower: () => power,
      applyDamage: (target, damage) => {
        target.hp = Math.max(0, target.hp - damage);
      },
      handleVictoryRewards: () => {},
      openSwitchMonsterModal: () => {},
      getItemDef: () => ({
        type: 'heal',
        name: 'Cura',
        emoji: '💚',
        heal_pct: 0.30,
        heal_min: 5,
      }),
    },
  };

  return { deps, encounter, player };
}

function runGroupBasic({ playerMonster, enemy, d20A, d20D, power = 7 }) {
  const { deps, encounter } = makeGroupDeps({
    playerMonster,
    enemy,
    rolls: [d20A, d20D],
    power,
  });

  executePlayerAttackGroup(deps, 0);

  return { damage: 100 - enemy.hp, encounter };
}

describe('Passivas de espécie v2.2 — contrato canônico compartilhado', () => {
  it('mantém exatamente as oito espécies ativas esperadas', () => {
    expect([...getActivePassiveIds()].sort()).toEqual([...EXPECTED_PASSIVE_IDS].sort());
  });

  it.each([
    ['shieldhorn', ON_HIT, { isFirstHitThisTurn: true }, { damageReduction: 1 }],
    ['emberfang', ON_ATTACK, { hpPct: 0.80, isOffensiveSkill: true }, { atkBonus: 1 }],
    ['floracura', ON_HEAL_ITEM, { isFirstHeal: true }, { healBonus: 3 }],
    ['swiftclaw', ON_ATTACK, { isFirstAttackOfCombat: true }, { atkBonus: 1 }],
    ['moonquill', ON_SKILL_USED, { isDebuff: true }, { spdBuff: { power: 1, duration: 1 } }],
    ['shadowsting', ON_ATTACK, { isOffensiveSkill: false, hasShadowstingCharge: true }, { atkBonus: 1 }],
    ['bellwave', ON_ATTACK, { isOffensiveSkill: false, hasBellwaveRhythmCharge: true }, { atkBonus: 1 }],
    ['wildpace', ON_ATTACK, { hpPct: 0.39, isOffensiveSkill: false }, { atkBonus: 1 }],
  ])('%s resolve o modificador canônico esperado', (speciesId, event, payload, expected) => {
    expect(fireCombatEvent({ canonSpeciesId: speciesId }, event, payload)).toEqual(expected);
  });

  it('preserva os limites estritos de HP de emberfang e wildpace', () => {
    expect(fireCombatEvent(
      { canonSpeciesId: 'emberfang' },
      ON_ATTACK,
      { hpPct: 0.70, isOffensiveSkill: true },
    )).toBeNull();

    expect(fireCombatEvent(
      { canonSpeciesId: 'wildpace' },
      ON_ATTACK,
      { hpPct: 0.40, isOffensiveSkill: false },
    )).toBeNull();
  });
});

describe('Passivas de espécie v2.2 — integração estrutural Wild e Group', () => {
  const wildBasic = segment(
    WILD_SOURCE,
    'export function executeWildAttack',
    'function applyEneRegen',
  );
  const wildSkill = segment(
    WILD_SOURCE,
    'export function executeWildSkill',
    'export function executeWildCaptureAction',
  );
  const wildItem = segment(
    WILD_SOURCE,
    'export function executeWildItemUse',
    'export function executeWildFlee',
  );
  const groupBasic = segment(
    GROUP_SOURCE,
    'export function executePlayerAttackGroup',
    'function findPlayerNeedingSwitch',
  );
  const groupSkill = segment(
    GROUP_SOURCE,
    'export function executePlayerSkillGroup',
    'export function executeUseItemGroup',
  );
  const groupItem = segment(
    GROUP_SOURCE,
    'export function executeUseItemGroup',
    'export function executeGroupUseItem',
  );

  it('ataques básicos dos dois modos enviam os mesmos gates de estado', () => {
    for (const source of [wildBasic, groupBasic]) {
      expect(source).toContain('isFirstAttackOfCombat');
      expect(source).toContain('hasShadowstingCharge');
      expect(source).toContain('hasBellwaveRhythmCharge');
      expect(source).toContain('isOffensiveSkill: false');
    }
  });

  it('Wild e Group despacham eventos de skill e preparam as mesmas cargas', () => {
    expect(wildSkill).toContain('fireCombatEvent(playerMonster, ON_ATTACK');
    expect(wildSkill).toContain('fireCombatEvent(playerMonster, ON_SKILL_USED');
    expect(wildSkill).toContain('shadowstingDebuffCharged = true');
    expect(wildSkill).toContain('bellwaveRhythmCharged = true');

    expect(groupSkill).toContain('resolvePlayerSpeciesSkillAttack');
    expect(groupSkill).toContain('dispatchPlayerSpeciesSkillUsed');
    expect(groupSkill).toContain('atk: effectiveAtkForSkill');
    expect(GROUP_SOURCE).toContain('fireCombatEvent(mon, ON_ATTACK');
    expect(GROUP_SOURCE).toContain('fireCombatEvent(mon, ON_SKILL_USED');
    expect(GROUP_SOURCE).toContain('shadowstingDebuffCharged = true');
    expect(GROUP_SOURCE).toContain('bellwaveRhythmCharged = true');
  });

  it('os dois modos integram floracura no uso de item e rastreiam a primeira cura', () => {
    for (const source of [wildItem, groupItem]) {
      expect(source).toContain('ON_HEAL_ITEM');
      expect(source).toContain('floracuraHealUsed');
      expect(source).toContain('isFirstHeal');
    }
  });

  it('aplica atkBonus ao ATK efetivo antes da fórmula nos dois modos', () => {
    expect(wildBasic).toContain(
      'effectiveAtkForDamage = Math.max(1, effectiveAtkForDamage + atkPassive.atkBonus)',
    );

    const groupBonusIndex = groupBasic.indexOf(
      'effectiveAtkForDamage + atkSpeciesPassive.atkBonus',
    );
    const groupDamageIndex = groupBasic.indexOf(
      'const { damage: baseDmg, isIlusory } = computeGroupDamage({',
    );

    expect(groupBonusIndex).toBeGreaterThanOrEqual(0);
    expect(groupDamageIndex).toBeGreaterThan(groupBonusIndex);
    expect(groupBasic).toContain('atk: effectiveAtkForDamage');
    expect(groupBasic).not.toContain(
      'dmg = Math.max(1, dmg + atkSpeciesPassive.atkBonus)',
    );
  });

  it('aplica resistência de classe antes de shieldhorn nos dois modos', () => {
    const wildClassIndex = wildBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');
    const wildSpeciesIndex = wildBasic.indexOf('const defPassive = fireCombatEvent');
    const groupClassIndex = groupBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');
    const groupSpeciesIndex = groupBasic.indexOf('const defSpeciesPassive = fireCombatEvent');

    expect(wildClassIndex).toBeGreaterThanOrEqual(0);
    expect(wildSpeciesIndex).toBeGreaterThan(wildClassIndex);
    expect(groupClassIndex).toBeGreaterThanOrEqual(0);
    expect(groupSpeciesIndex).toBeGreaterThan(groupClassIndex);
  });
});

describe('Passivas de espécie v2.2 — efeitos observáveis por modo', () => {
  it('PARITY: wildpace entra no ATK antes da fórmula nos dois modos', () => {
    const wildBase = runWildBasic({
      playerMonster: makeMonster({ hp: 30, canonSpeciesId: null }),
      enemy: makeEnemy(),
      d20A: 10,
      d20D: 10,
    });
    const wildPassive = runWildBasic({
      playerMonster: makeMonster({ hp: 30, canonSpeciesId: 'wildpace' }),
      enemy: makeEnemy(),
      d20A: 10,
      d20D: 10,
    });
    const groupBase = runGroupBasic({
      playerMonster: makeMonster({ hp: 30, canonSpeciesId: null }),
      enemy: makeEnemy(),
      d20A: 10,
      d20D: 10,
    });
    const groupPassive = runGroupBasic({
      playerMonster: makeMonster({ hp: 30, canonSpeciesId: 'wildpace' }),
      enemy: makeEnemy(),
      d20A: 10,
      d20D: 10,
    });

    expect(wildPassive.damage - wildBase.damage).toBe(0);
    expect(groupPassive.damage - groupBase.damage).toBe(0);
    expect(groupBase.damage).toBe(wildBase.damage);
    expect(groupPassive.damage).toBe(wildPassive.damage);
  });

  it('PARITY: shieldhorn reduz após a resistência de Guerreiro nos dois modos', () => {
    const attacker = () => makeMonster({
      class: 'Mago',
      atk: 1,
      hp: 100,
      canonSpeciesId: null,
    });
    const defender = canonSpeciesId => makeEnemy({
      class: 'Guerreiro',
      def: 8,
      canonSpeciesId,
    });

    const wildBase = runWildBasic({
      playerMonster: attacker(),
      enemy: defender(null),
      d20A: 17,
      d20D: 10,
    });
    const wildShield = runWildBasic({
      playerMonster: attacker(),
      enemy: defender('shieldhorn'),
      d20A: 17,
      d20D: 10,
    });
    const groupBase = runGroupBasic({
      playerMonster: attacker(),
      enemy: defender(null),
      d20A: 17,
      d20D: 10,
    });
    const groupShield = runGroupBasic({
      playerMonster: attacker(),
      enemy: defender('shieldhorn'),
      d20A: 17,
      d20D: 10,
    });

    expect(wildBase.damage).toBe(3);
    expect(wildShield.damage).toBe(2);
    expect(groupBase.damage).toBe(3);
    expect(groupShield.damage).toBe(2);
    expect(wildBase.damage).toBe(groupBase.damage);
    expect(wildShield.damage).toBe(groupShield.damage);
  });

  it('PARITY: floracura concede +3 HP e consome o estado de primeira cura nos dois modos', () => {
    const wildMon = makeMonster({
      class: 'Curandeiro',
      hp: 50,
      hpMax: 100,
      canonSpeciesId: 'floracura',
    });
    const wildEnemy = makeEnemy({ atk: 1, def: 5 });
    const wildEncounter = {
      id: 'wild_heal',
      type: 'wild',
      active: true,
      selectedPlayerId: 'p1',
      wildMonster: wildEnemy,
      log: [],
    };
    const wildPlayer = {
      id: 'p1',
      name: 'Player',
      class: 'Curandeiro',
      team: [wildMon],
      inventory: { HEAL: 1 },
    };

    executeWildItemUse({
      encounter: wildEncounter,
      player: wildPlayer,
      playerMonster: wildMon,
      itemId: 'HEAL',
      dependencies: {
        getItemDef: () => ({
          type: 'heal',
          name: 'Cura',
          emoji: '💚',
          heal_pct: 0.30,
          heal_min: 5,
        }),
        updateFriendship: () => {},
        tutorialOnAction: () => {},
        onHealVisualFeedback: () => {},
        eneRegenData: {},
        classAdvantages: {},
        getBasicPower: () => 7,
        rollD20: rollSequence([1, 20], 20),
        audio: { playSfx: () => {} },
      },
    });

    const groupMon = makeMonster({
      class: 'Curandeiro',
      hp: 50,
      hpMax: 100,
      canonSpeciesId: 'floracura',
    });
    const { deps: groupDeps, encounter: groupEncounter } = makeGroupDeps({
      playerMonster: groupMon,
      enemy: makeEnemy(),
      rolls: [10, 10],
      inventory: { HEAL: 1 },
    });

    executeUseItemGroup('HEAL', null, groupDeps);

    expect(wildMon.hp).toBe(83);
    expect(groupMon.hp).toBe(83);
    expect(wildEncounter.passiveState.floracuraHealUsed).toBe(true);
    expect(groupEncounter.passiveState.floracuraHealUsed).toBe(true);
  });
});
