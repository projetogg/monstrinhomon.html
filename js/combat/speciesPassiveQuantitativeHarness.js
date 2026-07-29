import { resolvePassiveModifier } from '../canon/speciesPassives.js';
import { computeGroupDamage, resolveConfrontation, RC_CATEGORY } from './groupCombatFormula.js';
import {
  DEFAULT_BASIC_POWER,
  DEFAULT_CLASS_PASSIVES,
  buildClassAdvantages,
  createSeededRng,
  getClassModifiers,
  getSpdBonus,
  rollD20,
  scaleMonsterTemplate,
  selectBaseTemplates,
  selectTierOneDamageSkills,
} from './combatSimulationHarness.js';

export const SPECIES_QUANTITATIVE_CONFIG = Object.freeze({
  shieldhorn: Object.freeze({ className: 'Guerreiro', mechanic: 'mitigation' }),
  emberfang: Object.freeze({ className: 'Bárbaro', mechanic: 'offensive_skill' }),
  floracura: Object.freeze({ className: 'Curandeiro', mechanic: 'heal_item' }),
  swiftclaw: Object.freeze({ className: 'Caçador', mechanic: 'first_attack' }),
  moonquill: Object.freeze({ className: 'Mago', mechanic: 'debuff_speed' }),
  shadowsting: Object.freeze({ className: 'Ladino', mechanic: 'debuff_charge' }),
  bellwave: Object.freeze({ className: 'Bardo', mechanic: 'skill_charge' }),
  wildpace: Object.freeze({ className: 'Animalista', mechanic: 'low_hp_attack' }),
});

export const SPECIES_QUANTITATIVE_IDS = Object.freeze(Object.keys(SPECIES_QUANTITATIVE_CONFIG));
export const SPECIES_QUANTITATIVE_LEVELS = Object.freeze([1, 10, 30]);
export const SPECIES_QUANTITATIVE_PROFILES = Object.freeze(['basic', 'mixed']);

const HEAL_ITEM_BASE = 8;
const RC_KEYS = Object.freeze(Object.values(RC_CATEGORY));

function round(value, digits = 6) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function percentile(sortedValues, probability) {
  if (!sortedValues.length) return 0;
  const index = (sortedValues.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function summarizeValues(values) {
  const safe = values.map(value => Number(value) || 0).sort((a, b) => a - b);
  if (!safe.length) {
    return { mean: 0, median: 0, p10: 0, p90: 0, min: 0, max: 0, positiveRate: 0, zeroRate: 0, negativeRate: 0 };
  }
  const total = safe.length;
  return {
    mean: round(safe.reduce((sum, value) => sum + value, 0) / total),
    median: round(percentile(safe, 0.5)),
    p10: round(percentile(safe, 0.1)),
    p90: round(percentile(safe, 0.9)),
    min: safe[0],
    max: safe[safe.length - 1],
    positiveRate: round(safe.filter(value => value > 0).length / total),
    zeroRate: round(safe.filter(value => value === 0).length / total),
    negativeRate: round(safe.filter(value => value < 0).length / total),
  };
}

function makeEffectCounters() {
  return {
    triggers: 0,
    directEffects: 0,
    atkBonusApplications: 0,
    atkBonusTotal: 0,
    damageReductionApplications: 0,
    damageReduced: 0,
    healBonusApplications: 0,
    healBonusTotal: 0,
    spdBuffApplications: 0,
    spdBuffTurnsUsed: 0,
    chargesCreated: 0,
    chargesConsumed: 0,
  };
}

function addEffectCounters(target, source) {
  for (const key of Object.keys(target)) target[key] += Number(source[key]) || 0;
}

function makeBattleCounters() {
  return {
    damageDealt: 0,
    damageTaken: 0,
    healing: 0,
    actions: 0,
    basicUses: 0,
    skillUses: 0,
    debuffUses: 0,
    categories: Object.fromEntries(RC_KEYS.map(key => [key, 0])),
    effects: makeEffectCounters(),
  };
}

function applyClassPassives(damage, attackerClass, defenderClass) {
  let result = damage;
  const attackBonus = DEFAULT_CLASS_PASSIVES?.[attackerClass]?.attackBonus;
  if (attackBonus && result > 0) result = Math.max(1, Math.round(result * (1 + attackBonus)));
  const defenseBonus = DEFAULT_CLASS_PASSIVES?.[defenderClass]?.defenseBonus;
  if (defenseBonus && result > 0) result = Math.max(1, Math.round(result * (1 - defenseBonus)));
  return result;
}

function makeCombatant(template, level, { speciesId = null, hpRatio = 1, spdOffset = 0 } = {}) {
  const scaled = scaleMonsterTemplate(template, level);
  const hpMax = Math.max(12, Math.round(scaled.hpMax * 1.6));
  return {
    ...scaled,
    hpMax,
    hp: Math.max(1, Math.floor(hpMax * hpRatio)),
    spd: Math.max(1, scaled.spd + spdOffset),
    canonSpeciesId: speciesId,
  };
}

function getInitialHpRatio(speciesId) {
  if (speciesId === 'wildpace') return 0.35;
  if (speciesId === 'floracura') return 0.1;
  return 1;
}

function buildAction({ speciesId, profile, turn, basicPower, skillPower }) {
  if (profile === 'basic' || turn % 2 === 0) {
    return {
      kind: 'basic',
      power: basicPower,
      isSkill: false,
      isOffensiveSkill: false,
      isDebuff: false,
    };
  }
  if (speciesId === 'moonquill' || speciesId === 'shadowsting') {
    return {
      kind: 'debuff',
      power: 0,
      isSkill: true,
      isOffensiveSkill: false,
      isDebuff: true,
    };
  }
  return {
    kind: 'skill',
    power: skillPower,
    isSkill: true,
    isOffensiveSkill: true,
    isDebuff: false,
  };
}

function createPassiveState() {
  return {
    swiftclawFirstStrikeDone: false,
    shadowstingDebuffCharged: false,
    bellwaveRhythmCharged: false,
    moonquillSpdTurns: 0,
    floracuraHealUsed: false,
  };
}

function applyFloracuraItem({ player, passiveEnabled, passiveState, counters }) {
  if (passiveState.floracuraHealUsed || player.hp <= 0 || player.hp / player.hpMax > 0.5) return;
  const missingHp = Math.max(0, player.hpMax - player.hp);
  if (missingHp <= 0) return;

  let bonus = 0;
  if (passiveEnabled) {
    const modifier = resolvePassiveModifier(player, {
      event: 'on_heal_item',
      hpPct: player.hp / player.hpMax,
      isFirstHeal: true,
    });
    if (modifier?.healBonus) {
      bonus = modifier.healBonus;
      counters.effects.triggers += 1;
      counters.effects.directEffects += 1;
      counters.effects.healBonusApplications += 1;
      counters.effects.healBonusTotal += bonus;
    }
  }

  const healed = Math.min(missingHp, HEAL_ITEM_BASE + bonus);
  player.hp += healed;
  counters.healing += healed;
  passiveState.floracuraHealUsed = true;
}

function resolveAttackModifier({ player, action, passiveEnabled, passiveState, counters }) {
  if (!passiveEnabled) return 0;
  const modifier = resolvePassiveModifier(player, {
    event: 'on_attack',
    hpPct: player.hp / player.hpMax,
    isOffensiveSkill: action.isOffensiveSkill,
    isFirstAttackOfCombat: !passiveState.swiftclawFirstStrikeDone,
    hasShadowstingCharge: passiveState.shadowstingDebuffCharged,
    hasBellwaveRhythmCharge: passiveState.bellwaveRhythmCharged,
  });
  if (!modifier?.atkBonus) return 0;

  counters.effects.triggers += 1;
  counters.effects.directEffects += 1;
  counters.effects.atkBonusApplications += 1;
  counters.effects.atkBonusTotal += modifier.atkBonus;

  if (player.canonSpeciesId === 'swiftclaw') passiveState.swiftclawFirstStrikeDone = true;
  if (player.canonSpeciesId === 'shadowsting' && passiveState.shadowstingDebuffCharged) {
    passiveState.shadowstingDebuffCharged = false;
    counters.effects.chargesConsumed += 1;
  }
  if (player.canonSpeciesId === 'bellwave' && passiveState.bellwaveRhythmCharged) {
    passiveState.bellwaveRhythmCharged = false;
    counters.effects.chargesConsumed += 1;
  }
  return modifier.atkBonus;
}

function dispatchSkillUsed({ player, action, passiveEnabled, passiveState, counters }) {
  if (!passiveEnabled || !action.isSkill) return;

  const modifier = resolvePassiveModifier(player, {
    event: 'on_skill_used',
    hpPct: player.hp / player.hpMax,
    skillType: action.isOffensiveSkill ? 'DAMAGE' : 'BUFF',
    isDebuff: action.isDebuff,
  });
  if (modifier?.spdBuff) {
    passiveState.moonquillSpdTurns = Math.max(
      passiveState.moonquillSpdTurns,
      Number(modifier.spdBuff.duration) || 0,
    );
    counters.effects.triggers += 1;
    counters.effects.directEffects += 1;
    counters.effects.spdBuffApplications += 1;
  }

  if (player.canonSpeciesId === 'shadowsting' && action.isDebuff) {
    passiveState.shadowstingDebuffCharged = true;
    counters.effects.triggers += 1;
    counters.effects.chargesCreated += 1;
  }
  if (player.canonSpeciesId === 'bellwave') {
    passiveState.bellwaveRhythmCharged = true;
    counters.effects.triggers += 1;
    counters.effects.chargesCreated += 1;
  }
}

function performAttack({
  attacker,
  defender,
  power,
  rng,
  classAdvantages,
  counters,
  resolveAtkBonus = null,
  spdBonus = 0,
  defenderSpeciesPassive = false,
}) {
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
    buffOff: getSpdBonus({ ...attacker, spd: attacker.spd + spdBonus }, defender),
  });
  counters.categories[confrontation.category] += 1;

  const confirmedHit = d20A !== 1 && confrontation.category !== RC_CATEGORY.FALHA_TOTAL;
  if (!confirmedHit) return 0;

  const atkBonus = typeof resolveAtkBonus === 'function' ? (Number(resolveAtkBonus()) || 0) : 0;
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
  let damage = applyClassPassives(result.damage, attacker.class, defender.class);

  if (defenderSpeciesPassive && damage > 0) {
    const modifier = resolvePassiveModifier(defender, {
      event: 'on_hit_received',
      hpPct: defender.hp / defender.hpMax,
      isFirstHitThisTurn: true,
    });
    if (modifier?.damageReduction) {
      const reduced = Math.max(1, damage - modifier.damageReduction);
      const prevented = Math.max(0, damage - reduced);
      if (prevented > 0) {
        damage = reduced;
        counters.effects.triggers += 1;
        counters.effects.directEffects += 1;
        counters.effects.damageReductionApplications += 1;
        counters.effects.damageReduced += prevented;
      }
    }
  }

  defender.hp = Math.max(0, defender.hp - damage);
  return damage;
}

function simulateBattle(scenario, { passiveEnabled, seed, maxTurns }) {
  const config = SPECIES_QUANTITATIVE_CONFIG[scenario.speciesId];
  const player = makeCombatant(scenario.playerTemplate, scenario.level, {
    speciesId: passiveEnabled ? scenario.speciesId : null,
    hpRatio: getInitialHpRatio(scenario.speciesId),
  });
  const enemy = makeCombatant(scenario.enemyTemplate, scenario.level, {
    spdOffset: scenario.speciesId === 'moonquill' ? 3 : 0,
  });
  const rng = createSeededRng(seed);
  const counters = makeBattleCounters();
  const passiveState = createPassiveState();
  let turn = 0;

  while (player.hp > 0 && enemy.hp > 0 && turn < maxTurns) {
    turn += 1;
    if (config.mechanic === 'heal_item') {
      applyFloracuraItem({ player, passiveEnabled, passiveState, counters });
    }

    const action = buildAction({
      speciesId: scenario.speciesId,
      profile: scenario.profile,
      turn,
      basicPower: scenario.basicPower,
      skillPower: scenario.skillPower,
    });
    counters.actions += 1;
    counters[action.kind === 'basic' ? 'basicUses' : 'skillUses'] += 1;
    if (action.isDebuff) counters.debuffUses += 1;

    if (action.isDebuff) {
      dispatchSkillUsed({ player, action, passiveEnabled, passiveState, counters });
    } else {
      const activeSpdBuff = passiveState.moonquillSpdTurns > 0 ? 1 : 0;
      if (activeSpdBuff) counters.effects.spdBuffTurnsUsed += 1;
      const damage = performAttack({
        attacker: player,
        defender: enemy,
        power: action.power,
        rng,
        classAdvantages: scenario.classAdvantages,
        counters,
        resolveAtkBonus: () => resolveAttackModifier({ player, action, passiveEnabled, passiveState, counters }),
        spdBonus: activeSpdBuff,
      });
      counters.damageDealt += damage;
      dispatchSkillUsed({ player, action, passiveEnabled, passiveState, counters });
      if (passiveState.moonquillSpdTurns > 0 && !action.isDebuff) {
        passiveState.moonquillSpdTurns -= 1;
      }
    }

    if (enemy.hp <= 0) break;

    const enemyDamage = performAttack({
      attacker: enemy,
      defender: player,
      power: scenario.basicPower,
      rng,
      classAdvantages: scenario.classAdvantages,
      counters,
      defenderSpeciesPassive: passiveEnabled && scenario.speciesId === 'shieldhorn',
    });
    counters.damageTaken += enemyDamage;
  }

  return {
    winner: player.hp > 0 && enemy.hp <= 0 ? 'player' : enemy.hp > 0 && player.hp <= 0 ? 'enemy' : 'draw',
    turns: turn,
    playerHpFinal: player.hp,
    enemyHpFinal: enemy.hp,
    damageDealt: counters.damageDealt,
    damageTaken: counters.damageTaken,
    healing: counters.healing,
    actions: counters.actions,
    basicUses: counters.basicUses,
    skillUses: counters.skillUses,
    debuffUses: counters.debuffUses,
    categories: counters.categories,
    effects: counters.effects,
  };
}

function summarizeVariant(runs) {
  const total = Math.max(1, runs.length);
  const effectTotals = makeEffectCounters();
  const categoryTotals = Object.fromEntries(RC_KEYS.map(key => [key, 0]));
  for (const run of runs) {
    addEffectCounters(effectTotals, run.effects);
    for (const key of RC_KEYS) categoryTotals[key] += Number(run.categories[key]) || 0;
  }
  return {
    runs: runs.length,
    winRate: round(runs.filter(run => run.winner === 'player').length / total),
    drawRate: round(runs.filter(run => run.winner === 'draw').length / total),
    combatsWithActivationRate: round(runs.filter(run => run.effects.triggers > 0).length / total),
    turns: summarizeValues(runs.map(run => run.turns)),
    playerHpFinal: summarizeValues(runs.map(run => run.playerHpFinal)),
    enemyHpFinal: summarizeValues(runs.map(run => run.enemyHpFinal)),
    damageDealt: summarizeValues(runs.map(run => run.damageDealt)),
    damageTaken: summarizeValues(runs.map(run => run.damageTaken)),
    healing: summarizeValues(runs.map(run => run.healing)),
    actions: summarizeValues(runs.map(run => run.actions)),
    effects: effectTotals,
    categories: categoryTotals,
  };
}

export function simulateSpeciesPassiveScenarioPair(scenario, options = {}) {
  const runsCount = Math.max(1, Math.floor(Number(options.runs ?? 1000)));
  const maxTurns = Math.max(1, Math.floor(Number(options.maxTurns ?? 30)));
  const seed = options.seed ?? scenario.id;
  const baseRuns = [];
  const passiveRuns = [];

  for (let index = 0; index < runsCount; index += 1) {
    const runSeed = `${seed}:${scenario.id}:run-${index}`;
    baseRuns.push(simulateBattle(scenario, { passiveEnabled: false, seed: runSeed, maxTurns }));
    passiveRuns.push(simulateBattle(scenario, { passiveEnabled: true, seed: runSeed, maxTurns }));
  }

  const paired = {
    damageDealt: passiveRuns.map((run, index) => run.damageDealt - baseRuns[index].damageDealt),
    damagePrevented: passiveRuns.map((run, index) => baseRuns[index].damageTaken - run.damageTaken),
    healing: passiveRuns.map((run, index) => run.healing - baseRuns[index].healing),
    turns: passiveRuns.map((run, index) => run.turns - baseRuns[index].turns),
    playerHpFinal: passiveRuns.map((run, index) => run.playerHpFinal - baseRuns[index].playerHpFinal),
    win: passiveRuns.map((run, index) => Number(run.winner === 'player') - Number(baseRuns[index].winner === 'player')),
  };

  return {
    id: scenario.id,
    speciesId: scenario.speciesId,
    className: scenario.className,
    level: scenario.level,
    profile: scenario.profile,
    mechanic: SPECIES_QUANTITATIVE_CONFIG[scenario.speciesId].mechanic,
    runs: runsCount,
    base: summarizeVariant(baseRuns),
    passive: summarizeVariant(passiveRuns),
    delta: {
      winRate: round(
        passiveRuns.filter(run => run.winner === 'player').length / runsCount
        - baseRuns.filter(run => run.winner === 'player').length / runsCount,
      ),
      damageDealt: summarizeValues(paired.damageDealt),
      damagePrevented: summarizeValues(paired.damagePrevented),
      healing: summarizeValues(paired.healing),
      turns: summarizeValues(paired.turns),
      playerHpFinal: summarizeValues(paired.playerHpFinal),
      win: summarizeValues(paired.win),
    },
  };
}

export function buildSpeciesPassiveQuantitativeScenarios({
  monstersJson,
  skillsJson,
  matchupsJson,
  levels = SPECIES_QUANTITATIVE_LEVELS,
  profiles = SPECIES_QUANTITATIVE_PROFILES,
}) {
  const templates = selectBaseTemplates(monstersJson);
  const skills = selectTierOneDamageSkills(skillsJson);
  const classAdvantages = buildClassAdvantages(matchupsJson);
  const scenarios = [];

  for (const speciesId of SPECIES_QUANTITATIVE_IDS) {
    const config = SPECIES_QUANTITATIVE_CONFIG[speciesId];
    const template = templates[config.className];
    if (!template) throw new Error(`Template comum ausente para ${config.className}.`);
    for (const level of levels) {
      for (const profile of profiles) {
        const selectedSkill = skills[config.className];
        scenarios.push({
          id: `${speciesId}-L${level}-${profile}`,
          speciesId,
          className: config.className,
          level,
          profile,
          playerTemplate: template,
          enemyTemplate: template,
          classAdvantages,
          basicPower: DEFAULT_BASIC_POWER[config.className] ?? 7,
          skillPower: Number(selectedSkill?.power) || (DEFAULT_BASIC_POWER[config.className] ?? 7) + 4,
        });
      }
    }
  }
  return scenarios;
}

export function runSpeciesPassiveQuantitativeMatrix(scenarios, options = {}) {
  const seed = options.seed ?? 'monstrinhomon-species-passives-v2.2';
  return scenarios.map(scenario => simulateSpeciesPassiveScenarioPair(scenario, {
    ...options,
    seed,
  }));
}

export function aggregateSpeciesPassiveQuantitativeResults(results) {
  const bySpecies = {};
  for (const speciesId of SPECIES_QUANTITATIVE_IDS) {
    const rows = results.filter(result => result.speciesId === speciesId);
    const runs = rows.reduce((sum, row) => sum + row.runs, 0);
    const weighted = selector => rows.reduce((sum, row) => sum + selector(row) * row.runs, 0) / Math.max(1, runs);
    const effects = makeEffectCounters();
    for (const row of rows) addEffectCounters(effects, row.passive.effects);
    bySpecies[speciesId] = {
      className: SPECIES_QUANTITATIVE_CONFIG[speciesId].className,
      mechanic: SPECIES_QUANTITATIVE_CONFIG[speciesId].mechanic,
      scenarioPairs: rows.length,
      runsPerVariant: runs,
      activationRate: round(weighted(row => row.passive.combatsWithActivationRate)),
      winRateDelta: round(weighted(row => row.delta.winRate)),
      meanDamageDealtDelta: round(weighted(row => row.delta.damageDealt.mean)),
      meanDamagePrevented: round(weighted(row => row.delta.damagePrevented.mean)),
      meanHealingDelta: round(weighted(row => row.delta.healing.mean)),
      meanTurnsDelta: round(weighted(row => row.delta.turns.mean)),
      meanPlayerHpFinalDelta: round(weighted(row => row.delta.playerHpFinal.mean)),
      effects,
    };
  }
  return bySpecies;
}

export function renderSpeciesPassiveQuantitativeMarkdown({ baselineSha = 'unknown', seed, runs, results }) {
  const aggregate = aggregateSpeciesPassiveQuantitativeResults(results);
  const lines = [
    '# Matriz Quantitativa das Passivas de Espécie — Combate v2.2',
    '',
    `- **SHA:** \`${baselineSha}\``,
    `- **Seed:** \`${seed}\``,
    `- **Execuções por par:** ${runs}`,
    `- **Pares:** ${results.length}`,
    `- **Batalhas simuladas:** ${results.length * runs * 2}`,
    '- **Conclusão:** **C. Medição automatizada concluída; decisão de balanceamento ainda depende de análise e playtest.**',
    '',
    '> Esta matriz é separada da baseline de fórmula. Ela usa pares com e sem passiva e roteiros controlados; não substitui playtest nem simula toda a IA/ENE do runtime.',
    '',
    '## Resultado agregado por espécie',
    '',
    '| Espécie | Classe | Ativação | Δ vitória | Δ dano causado | Dano evitado | Cura extra | Δ TTK | Δ HP final |',
    '|---|---|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const speciesId of SPECIES_QUANTITATIVE_IDS) {
    const row = aggregate[speciesId];
    lines.push(`| \`${speciesId}\` | ${row.className} | ${(row.activationRate * 100).toFixed(2)}% | ${(row.winRateDelta * 100).toFixed(2)} p.p. | ${row.meanDamageDealtDelta} | ${row.meanDamagePrevented} | ${row.meanHealingDelta} | ${row.meanTurnsDelta} | ${row.meanPlayerHpFinalDelta} |`);
  }
  lines.push(
    '',
    '## Cobertura',
    '',
    '- oito passivas de espécie;',
    '- níveis 1, 10 e 30;',
    '- perfis `basic` e `mixed`;',
    '- pares determinísticos com e sem passiva;',
    '- dano, mitigação, cura, buffs, cargas, TTK, vitória e sobrevivência;',
    '',
    '## Limitações',
    '',
    '- ações são roteirizadas; não há IA completa;',
    '- ENE, itens gerais, múltiplos alvos e bosses não são simulados;',
    '- o inimigo não possui passiva de espécie;',
    '- `moonquill` usa um cenário controlado de fronteira de SPD para tornar o buff observável;',
    '- `floracura` usa um único item de cura controlado;',
    '- resultados não autorizam alteração de valores sem análise separada e playtest mediado;',
    '',
  );
  return `${lines.join('\n')}\n`;
}
