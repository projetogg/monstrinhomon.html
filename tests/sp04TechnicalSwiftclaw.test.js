import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import { executeWildAttack, executeWildSkill } from '../js/combat/wildActions.js';
import {
  simulateSpeciesPassiveScenarioPair,
} from '../js/combat/speciesPassiveQuantitativeHarness.js';
import {
  DEFAULT_BASIC_POWER,
  DEFAULT_CLASS_PASSIVES,
  buildClassAdvantages,
  createSeededRng,
  getClassModifiers,
  getSpdBonus,
  rollD20,
  scaleMonsterTemplate,
  selectTierOneDamageSkills,
} from '../js/combat/combatSimulationHarness.js';
import {
  computeGroupDamage,
  resolveConfrontation,
  RC_CATEGORY,
} from '../js/combat/groupCombatFormula.js';

const ROOT = resolve(import.meta.dirname, '..');
const monstersJson = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
const skillsJson = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8'));
const matchupsJson = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

const monsters = monstersJson.monsters;
const tierOneDamageSkills = selectTierOneDamageSkills(skillsJson);
const classAdvantages = buildClassAdvantages(matchupsJson);

const MIAUMON = monsters.find(mon => mon.id === 'MON_009');
const AQUASOL = monsters.find(mon => mon.id === 'MON_032');
const LUVURSO = monsters.find(mon => mon.id === 'MON_017');

function officialScenario(profile = 'basic', enemyTemplate = AQUASOL, label = 'official') {
  return {
    id: `sp04-swiftclaw-${label}-${profile}`,
    speciesId: 'swiftclaw',
    className: 'Caçador',
    level: 10,
    profile,
    playerTemplate: MIAUMON,
    enemyTemplate,
    classAdvantages,
    basicPower: DEFAULT_BASIC_POWER['Caçador'] ?? 8,
    skillPower: Number(tierOneDamageSkills['Caçador']?.power) || 15,
  };
}

function minNaturalLevel(monster) {
  const predecessor = monsters.find(mon => mon.evolvesTo === monster.id);
  return predecessor ? Number(predecessor.evolvesAt) || 1 : 1;
}

function validAtLevel(monster, level) {
  if (!monster || monster.deprecated || monster.id === 'MON_100') return false;
  const minLevel = minNaturalLevel(monster);
  const maxExclusive = Number(monster.evolvesAt) || Number.POSITIVE_INFINITY;
  return minLevel <= level && level < maxExclusive;
}

function makeRuntimeSwift(overrides = {}) {
  return {
    id: 'mi_swift',
    name: 'Miaumon',
    class: 'Caçador',
    canonSpeciesId: 'swiftclaw',
    hp: 60,
    hpMax: 60,
    atk: 10,
    def: 5,
    spd: 12,
    poder: 8,
    ene: 12,
    eneMax: 20,
    buffs: [],
    level: 10,
    ...overrides,
  };
}

function makeRuntimeWild(overrides = {}) {
  return {
    id: 'wild_aquasol',
    name: 'Aquasol',
    class: 'Curandeiro',
    hp: 100,
    hpMax: 100,
    atk: 5,
    def: 8,
    spd: 6,
    poder: 7,
    ene: 10,
    eneMax: 20,
    buffs: [],
    aggression: 100,
    level: 10,
    ...overrides,
  };
}

function makeRuntimePlayer(overrides = {}) {
  return {
    id: 'p1',
    name: 'Jogador',
    class: 'Caçador',
    inventory: {},
    ...overrides,
  };
}

function makeRuntimeEncounter(wild, overrides = {}) {
  return {
    id: 'enc_sp04',
    type: 'wild',
    active: true,
    wildMonster: wild,
    selectedPlayerId: 'p1',
    log: [],
    rewardsGranted: false,
    ...overrides,
  };
}

function makeRuntimeDeps(skills = [], useSkill = vi.fn(() => true), overrides = {}) {
  return {
    eneRegenData: {},
    classAdvantages: {},
    getBasicPower: className => DEFAULT_BASIC_POWER[className] ?? 8,
    rollD20: () => 1,
    getMonsterSkills: () => skills,
    useSkill,
    handleVictoryRewards: vi.fn(),
    tutorialOnAction: vi.fn(),
    markAsParticipated: vi.fn(),
    updateFriendship: vi.fn(),
    updateMultipleFriendshipEvents: vi.fn(),
    updateStats: vi.fn(),
    showToast: vi.fn(),
    audio: { playSfx: vi.fn() },
    ui: { flashTarget: vi.fn(), showFloatingText: vi.fn() },
    ...overrides,
  };
}

const ARMADILHA = {
  id: 'ARMADILHA_0',
  name: 'Armadilha I',
  type: 'BUFF',
  target: 'enemy',
  power: -2,
  buffType: 'SPD',
  duration: 1,
  cost: 3,
};

function applyClassPassives(damage, attackerClass, defenderClass) {
  let result = damage;
  const attackBonus = DEFAULT_CLASS_PASSIVES?.[attackerClass]?.attackBonus;
  if (attackBonus && result > 0) result = Math.max(1, Math.round(result * (1 + attackBonus)));
  const defenseBonus = DEFAULT_CLASS_PASSIVES?.[defenderClass]?.defenseBonus;
  if (defenseBonus && result > 0) result = Math.max(1, Math.round(result * (1 - defenseBonus)));
  return result;
}

function makeModelCombatant(template, level) {
  const scaled = scaleMonsterTemplate(template, level);
  const hpMax = Math.max(12, Math.round(scaled.hpMax * 1.6));
  return { ...scaled, hpMax, hp: hpMax };
}

function modelAttack({ attacker, defender, power, rng, openingState, passiveEnabled, semantic }) {
  const openingWasAvailable = passiveEnabled && !openingState.consumed;
  if (openingWasAvailable && semantic === 'first_action') openingState.consumed = true;

  const d20A = rollD20(rng);
  const d20D = rollD20(rng);
  const classMods = getClassModifiers(attacker.class, defender.class, classAdvantages);
  const confrontation = resolveConfrontation({
    d20A,
    d20D,
    atkAtk: attacker.atk,
    atkDef: defender.def,
    atkLvl: attacker.level,
    defLvl: defender.level,
    classModAtk: classMods.atkBonus,
    buffOff: getSpdBonus(attacker, defender),
  });

  const hit = d20A !== 1 && confrontation.category !== RC_CATEGORY.FALHA_TOTAL;
  if (!hit) return { damage: 0, hit: false, bonusApplied: false };

  let atkBonus = 0;
  if (openingWasAvailable) {
    if (semantic === 'first_hit') openingState.consumed = true;
    const mod = resolvePassiveModifier(
      { canonSpeciesId: 'swiftclaw' },
      { event: 'on_attack', isFirstAttackOfCombat: true },
    );
    atkBonus = Number(mod?.atkBonus) || 0;
  }

  const result = computeGroupDamage({
    pwr: Number(power) || 0,
    atk: attacker.atk + atkBonus,
    lvlDiff: attacker.level - defender.level,
    defEnemy: defender.def,
    damageMult: classMods.damageMult,
    critBonus: confrontation.critDmgBonus,
    category: confrontation.category,
    d20ANatural: confrontation.d20ANatural,
    d20DNatural: confrontation.d20DNatural,
  });
  const damage = applyClassPassives(result.damage, attacker.class, defender.class);
  defender.hp = Math.max(0, defender.hp - damage);
  return { damage, hit: true, bonusApplied: atkBonus > 0 };
}

function modelBattle({ profile, passiveEnabled, semantic, seed, enemyTemplate = AQUASOL, maxTurns = 30 }) {
  const player = makeModelCombatant(MIAUMON, 10);
  const enemy = makeModelCombatant(enemyTemplate, 10);
  const rng = createSeededRng(seed);
  const openingState = { consumed: false };
  let turns = 0;
  let damageDealt = 0;
  let bonusApplications = 0;
  let firstActionHit = null;

  while (player.hp > 0 && enemy.hp > 0 && turns < maxTurns) {
    turns += 1;
    const isSkill = profile === 'mixed' && turns % 2 === 1;
    const result = modelAttack({
      attacker: player,
      defender: enemy,
      power: isSkill ? Number(tierOneDamageSkills['Caçador']?.power) || 15 : DEFAULT_BASIC_POWER['Caçador'],
      rng,
      openingState,
      passiveEnabled,
      semantic,
    });
    if (turns === 1) firstActionHit = result.hit;
    damageDealt += result.damage;
    bonusApplications += result.bonusApplied ? 1 : 0;
    if (enemy.hp <= 0) break;

    const enemyResult = modelAttack({
      attacker: enemy,
      defender: player,
      power: DEFAULT_BASIC_POWER[enemy.class] ?? 8,
      rng,
      openingState: { consumed: true },
      passiveEnabled: false,
      semantic,
    });
    if (enemyResult.damage > 0) {
      // damage already applied by modelAttack
    }
  }

  return {
    winner: player.hp > 0 && enemy.hp <= 0 ? 'player' : enemy.hp > 0 && player.hp <= 0 ? 'enemy' : 'draw',
    turns,
    damageDealt,
    playerHpFinal: player.hp,
    bonusApplications,
    firstActionHit,
  };
}

function summarizeModel({ profile, semantic, runs = 20000, enemyTemplate = AQUASOL, seed = 'sp04-model' }) {
  const baseRuns = [];
  const passiveRuns = [];
  for (let i = 0; i < runs; i += 1) {
    const runSeed = `${seed}:${enemyTemplate.id}:${profile}:run-${i}`;
    baseRuns.push(modelBattle({ profile, passiveEnabled: false, semantic, seed: runSeed, enemyTemplate }));
    passiveRuns.push(modelBattle({ profile, passiveEnabled: true, semantic, seed: runSeed, enemyTemplate }));
  }
  const mean = values => values.reduce((s, v) => s + v, 0) / values.length;
  const win = rows => rows.filter(r => r.winner === 'player').length / rows.length;
  const firstMissRate = baseRuns.filter(r => r.firstActionHit === false).length / baseRuns.length;
  return {
    runs,
    profile,
    semantic,
    baseWinRate: win(baseRuns),
    passiveWinRate: win(passiveRuns),
    deltaWinRate: win(passiveRuns) - win(baseRuns),
    baseTurnsMean: mean(baseRuns.map(r => r.turns)),
    passiveTurnsMean: mean(passiveRuns.map(r => r.turns)),
    deltaTurnsMean: mean(passiveRuns.map((r, i) => r.turns - baseRuns[i].turns)),
    deltaDamageMean: mean(passiveRuns.map((r, i) => r.damageDealt - baseRuns[i].damageDealt)),
    deltaHpFinalMean: mean(passiveRuns.map((r, i) => r.playerHpFinal - baseRuns[i].playerHpFinal)),
    activationRate: passiveRuns.filter(r => r.bonusApplications > 0).length / runs,
    firstActionMissRate: firstMissRate,
  };
}

describe('SP-04 técnico — swiftclaw', () => {
  it('contrato puro: +1 ATK apenas quando a abertura está marcada como primeiro ataque', () => {
    const mon = { canonSpeciesId: 'swiftclaw' };
    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isFirstAttackOfCombat: true,
    })).toEqual({ atkBonus: 1 });
    expect(resolvePassiveModifier(mon, {
      event: 'on_attack',
      isFirstAttackOfCombat: false,
    })).toBeNull();
  });

  it('caracteriza Wild atual: Armadilha I consome a abertura mesmo sem causar dano', () => {
    const mon = makeRuntimeSwift();
    const wild = makeRuntimeWild();
    const enc = makeRuntimeEncounter(wild);
    let atkBuffDuringSkill = null;
    const deps = makeRuntimeDeps([ARMADILHA], vi.fn((attacker) => {
      atkBuffDuringSkill = (attacker.buffs || []).find(b => b.source === 'emberfang_passive') || null;
      return true;
    }));

    executeWildSkill({
      encounter: enc,
      player: makeRuntimePlayer(),
      playerMonster: mon,
      skillIndex: 0,
      dependencies: deps,
    });

    console.log('SP04_SWIFTCLAW_WILD_TRAP_OPENER', JSON.stringify({
      verifiedAgainst: '7a44b5ec47b7cc6f47126a33b5ea0ace89d50070',
      swiftclawFirstStrikeDone: enc.passiveState?.swiftclawFirstStrikeDone ?? false,
      atkBuffDuringSkill,
      passiveLogs: enc.log.filter(line => line.includes('Passiva')),
    }));

    expect(enc.passiveState?.swiftclawFirstStrikeDone).toBe(true);
    expect(atkBuffDuringSkill?.power).toBe(1);
  });

  it('caracteriza Wild atual: básico que erra não consome a abertura', () => {
    const mon = makeRuntimeSwift();
    const wild = makeRuntimeWild();
    const enc = makeRuntimeEncounter(wild);
    const deps = makeRuntimeDeps([], vi.fn(() => true), {
      rollD20: () => 20,
    });

    executeWildAttack({
      encounter: enc,
      player: makeRuntimePlayer(),
      playerMonster: mon,
      d20Roll: 1,
      dependencies: deps,
    });

    console.log('SP04_SWIFTCLAW_WILD_BASIC_MISS', JSON.stringify({
      verifiedAgainst: '7a44b5ec47b7cc6f47126a33b5ea0ace89d50070',
      swiftclawFirstStrikeDone: enc.passiveState?.swiftclawFirstStrikeDone ?? false,
      passiveLogs: enc.log.filter(line => line.includes('Passiva')),
    }));

    expect(enc.passiveState?.swiftclawFirstStrikeDone).not.toBe(true);
  });

  it('mede cenário oficial no harness existente — básico e mixed', () => {
    const basic = simulateSpeciesPassiveScenarioPair(officialScenario('basic'), {
      runs: 20000,
      maxTurns: 30,
      seed: 'sp04-swiftclaw-official-basic-7a44b5ec',
    });
    const mixed = simulateSpeciesPassiveScenarioPair(officialScenario('mixed'), {
      runs: 20000,
      maxTurns: 30,
      seed: 'sp04-swiftclaw-official-mixed-7a44b5ec',
    });

    console.log('SP04_SWIFTCLAW_OFFICIAL_EXISTING_HARNESS', JSON.stringify({
      verifiedAgainst: '7a44b5ec47b7cc6f47126a33b5ea0ace89d50070',
      player: { id: MIAUMON.id, name: MIAUMON.name, level: 10 },
      enemy: { id: AQUASOL.id, name: AQUASOL.name, level: 10 },
      basic: {
        baseWinRate: basic.base.winRate,
        passiveWinRate: basic.passive.winRate,
        deltaWinRate: basic.delta.winRate,
        deltaDamage: basic.delta.damageDealt,
        deltaTurns: basic.delta.turns,
        deltaHpFinal: basic.delta.playerHpFinal,
        effects: basic.passive.effects,
      },
      mixed: {
        baseWinRate: mixed.base.winRate,
        passiveWinRate: mixed.passive.winRate,
        deltaWinRate: mixed.delta.winRate,
        deltaDamage: mixed.delta.damageDealt,
        deltaTurns: mixed.delta.turns,
        deltaHpFinal: mixed.delta.playerHpFinal,
        effects: mixed.passive.effects,
      },
    }));

    expect(basic.passive.effects.atkBonusApplications).toBeGreaterThan(0);
    expect(mixed.passive.effects.atkBonusApplications).toBeGreaterThan(0);
  });

  it('compara primeira ação versus primeiro acerto no cenário oficial', () => {
    const rows = [];
    for (const profile of ['basic', 'mixed']) {
      rows.push(summarizeModel({
        profile,
        semantic: 'first_hit',
        seed: `sp04-first-hit-${profile}-7a44b5ec`,
      }));
      rows.push(summarizeModel({
        profile,
        semantic: 'first_action',
        seed: `sp04-first-action-${profile}-7a44b5ec`,
      }));
    }

    console.log('SP04_SWIFTCLAW_SEMANTIC_COMPARISON', JSON.stringify({
      verifiedAgainst: '7a44b5ec47b7cc6f47126a33b5ea0ace89d50070',
      rows,
    }));

    for (const row of rows.filter(r => r.semantic === 'first_action')) {
      expect(row.activationRate).toBeLessThan(1);
      expect(row.firstActionMissRate).toBeGreaterThan(0);
    }
  });

  it('mede sensibilidade final Miaumon Nv10 × Luvursomon Nv10', () => {
    expect(validAtLevel(LUVURSO, 10)).toBe(true);

    const existingBasic = simulateSpeciesPassiveScenarioPair(
      officialScenario('basic', LUVURSO, 'sensitivity-luvurso'),
      {
        runs: 20000,
        maxTurns: 30,
        seed: 'sp04-swiftclaw-luvurso-existing-7a44b5ec',
      },
    );

    const firstActionBasic = summarizeModel({
      profile: 'basic',
      semantic: 'first_action',
      runs: 20000,
      enemyTemplate: LUVURSO,
      seed: 'sp04-swiftclaw-luvurso-first-action-7a44b5ec',
    });

    console.log('SP04_SWIFTCLAW_SENSITIVITY_LUVURSO', JSON.stringify({
      verifiedAgainst: '7a44b5ec47b7cc6f47126a33b5ea0ace89d50070',
      player: { id: MIAUMON.id, name: MIAUMON.name, level: 10 },
      enemy: { id: LUVURSO.id, name: LUVURSO.name, level: 10 },
      existingHarnessFirstHit: {
        runs: existingBasic.runs,
        baseWinRate: existingBasic.base.winRate,
        passiveWinRate: existingBasic.passive.winRate,
        deltaWinRate: existingBasic.delta.winRate,
        deltaDamage: existingBasic.delta.damageDealt,
        deltaTurns: existingBasic.delta.turns,
        deltaHpFinal: existingBasic.delta.playerHpFinal,
        effects: existingBasic.passive.effects,
      },
      firstActionModel: firstActionBasic,
    }));

    expect(existingBasic.passive.effects.atkBonusApplications).toBe(20000);
    expect(firstActionBasic.activationRate).toBeLessThan(1);
  });

  it('faz scan Nv10 natural para detectar saturação do cenário oficial', () => {
    const candidates = monsters
      .filter(mon => mon.id !== MIAUMON.id)
      .filter(mon => mon.rarity !== 'Lendário')
      .filter(mon => validAtLevel(mon, 10))
      .filter(mon => !['Mago', 'Ladino'].includes(mon.class));

    const rows = candidates.map(enemyTemplate => {
      const result = simulateSpeciesPassiveScenarioPair(
        officialScenario('basic', enemyTemplate, `candidate-${enemyTemplate.id}`),
        {
          runs: 1000,
          maxTurns: 30,
          seed: `sp04-swiftclaw-candidate-${enemyTemplate.id}-7a44b5ec`,
        },
      );
      return {
        id: enemyTemplate.id,
        name: enemyTemplate.name,
        className: enemyTemplate.class,
        rarity: enemyTemplate.rarity,
        minNaturalLevel: minNaturalLevel(enemyTemplate),
        evolvesAt: enemyTemplate.evolvesAt ?? null,
        baseWinRate: result.base.winRate,
        passiveWinRate: result.passive.winRate,
        deltaWinRate: result.delta.winRate,
        deltaDamageMean: result.delta.damageDealt.mean,
      };
    }).sort((a, b) => Math.abs(a.baseWinRate - 0.5) - Math.abs(b.baseWinRate - 0.5));

    console.log('SP04_SWIFTCLAW_CANDIDATE_SCAN', JSON.stringify({
      verifiedAgainst: '7a44b5ec47b7cc6f47126a33b5ea0ace89d50070',
      top: rows.slice(0, 15),
    }));

    expect(rows.length).toBeGreaterThan(0);
  });
});
