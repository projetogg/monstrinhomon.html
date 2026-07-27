import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RC_CATEGORY,
  computeGroupDamage,
  resolveConfrontation,
} from '../../js/combat/groupCombatFormula.js';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT_DIR = resolve(MODULE_DIR, '../..');
export const DEFAULT_LEVELS = Object.freeze([1, 5, 10, 15, 30]);

/**
 * Snapshot descritivo do POWER básico usado no runtime/testes atuais.
 * O harness não trata estes valores como decisão de balanceamento.
 */
export const BASIC_ATTACK_POWER_SNAPSHOT = Object.freeze({
  Guerreiro: 7,
  Mago: 7,
  Curandeiro: 8,
  Bárbaro: 9,
  Ladino: 8,
  Bardo: 7,
  Caçador: 8,
  Animalista: 7,
});

/** Snapshot do efeito percentual das passivas de classe em wildActions.js. */
export const CLASS_PASSIVE_SNAPSHOT = Object.freeze({
  Guerreiro: Object.freeze({ defenseBonus: 0.15 }),
  Bárbaro: Object.freeze({ defenseBonus: 0.10 }),
  Curandeiro: Object.freeze({ defenseBonus: 0.10 }),
  Ladino: Object.freeze({ attackBonus: 0.10 }),
});

const RARITY_POWER = Object.freeze({
  Comum: 1,
  Incomum: 1.08,
  Raro: 1.18,
  Místico: 1.32,
  Lendário: 1.5,
});

const DEFAULT_PAIRS = Object.freeze([
  ['Guerreiro', 'Bárbaro'],
  ['Bárbaro', 'Guerreiro'],
  ['Mago', 'Guerreiro'],
  ['Guerreiro', 'Mago'],
  ['Ladino', 'Caçador'],
  ['Caçador', 'Mago'],
  ['Curandeiro', 'Bárbaro'],
  ['Bardo', 'Curandeiro'],
  ['Animalista', 'Bardo'],
]);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${label} deve ser inteiro positivo.`);
  }
}

export function createSeededRng(seed = 2202) {
  let state = Number(seed) >>> 0;
  return function seededRandom() {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollD20(rng) {
  return Math.floor(rng() * 20) + 1;
}

export function loadSimulationData(rootDir = DEFAULT_ROOT_DIR) {
  const monstersPayload = readJson(resolve(rootDir, 'data/monsters.json'));
  const skillsPayload = readJson(resolve(rootDir, 'data/skills.json'));
  const matchupPayload = readJson(resolve(rootDir, 'design/canon/class_matchups.json'));

  if (!Array.isArray(monstersPayload.monsters)) {
    throw new TypeError('data/monsters.json não contém monsters[].');
  }
  if (!Array.isArray(skillsPayload.skills)) {
    throw new TypeError('data/skills.json não contém skills[].');
  }
  if (!matchupPayload.classes_ptbr || typeof matchupPayload.classes_ptbr !== 'object') {
    throw new TypeError('class_matchups.json não contém classes_ptbr.');
  }

  const matchups = Object.fromEntries(
    Object.entries(matchupPayload.classes_ptbr).map(([className, value]) => [
      className,
      {
        strong: value.strong_against,
        weak: value.weak_against,
      },
    ]),
  );

  return {
    monsters: monstersPayload.monsters,
    skills: skillsPayload.skills,
    matchups,
    versions: {
      monsters: monstersPayload.version ?? null,
      skills: skillsPayload.version ?? null,
      matchups: matchupPayload.version ?? null,
    },
  };
}

export function selectClassRepresentatives(monsters) {
  const representatives = {};
  const sorted = [...monsters].sort((a, b) => String(a.id).localeCompare(String(b.id)));

  for (const monster of sorted) {
    if (!monster?.class || representatives[monster.class]) continue;
    if (monster.rarity !== 'Comum') continue;
    representatives[monster.class] = monster;
  }

  for (const className of Object.keys(BASIC_ATTACK_POWER_SNAPSHOT)) {
    if (!representatives[className]) {
      throw new Error(`Nenhum monstrinho Comum encontrado para a classe ${className}.`);
    }
  }

  return representatives;
}

export function selectOffensiveSkill(skills, className, stageIndex = 0) {
  const candidates = skills
    .filter((skill) => (
      skill.class === className
      && skill.type === 'DAMAGE'
      && Number(skill.stageIndex) === stageIndex
    ))
    .sort((a, b) => (
      Number(a.energy_cost ?? Infinity) - Number(b.energy_cost ?? Infinity)
      || Number(a.power ?? 0) - Number(b.power ?? 0)
      || String(a.id).localeCompare(String(b.id))
    ));

  return candidates[0] ?? null;
}

/**
 * Modelo de escala usado apenas pelo harness.
 * Mantém a fórmula já empregada nas auditorias históricas: +10% por nível.
 * HP não recebe multiplicador de raridade; ATK/DEF/SPD recebem.
 */
export function scaleCatalogMonster(template, level) {
  assertPositiveInteger(level, 'level');
  if (!template || typeof template !== 'object') {
    throw new TypeError('template de monstrinho inválido.');
  }

  const levelMultiplier = 1 + (level - 1) * 0.1;
  const rarityMultiplier = RARITY_POWER[template.rarity] ?? 1;

  return {
    id: template.id,
    name: template.name,
    class: template.class,
    rarity: template.rarity,
    level,
    hpMax: Math.max(1, Math.floor(Number(template.baseHp) * levelMultiplier)),
    atk: Math.max(1, Math.floor(Number(template.baseAtk) * levelMultiplier * rarityMultiplier)),
    def: Math.max(1, Math.floor(Number(template.baseDef) * levelMultiplier * rarityMultiplier)),
    spd: Math.max(1, Math.floor(Number(template.baseSpd ?? 1) * levelMultiplier * rarityMultiplier)),
    eneMax: Math.max(1, Math.floor(Number(template.baseEne ?? 1) * levelMultiplier)),
  };
}

export function getClassModifiers(attackerClass, defenderClass, matchups) {
  const relation = matchups?.[attackerClass];
  if (relation?.strong === defenderClass) {
    return { classModAtk: 2, damageMult: 1.10, relation: 'advantage' };
  }
  if (relation?.weak === defenderClass) {
    return { classModAtk: -2, damageMult: 0.90, relation: 'disadvantage' };
  }
  return { classModAtk: 0, damageMult: 1, relation: 'neutral' };
}

export function getSpdBonus(attacker, defender) {
  const difference = Number(attacker.spd) - Number(defender.spd);
  if (difference >= 3) return 1;
  if (difference <= -3) return -1;
  return 0;
}

export function applyClassPassiveSnapshot(damage, attackerClass, defenderClass, enabled) {
  if (!enabled || damage <= 0) return damage;

  let result = damage;
  const attackBonus = CLASS_PASSIVE_SNAPSHOT[attackerClass]?.attackBonus;
  const defenseBonus = CLASS_PASSIVE_SNAPSHOT[defenderClass]?.defenseBonus;

  if (attackBonus) result = Math.max(1, Math.round(result * (1 + attackBonus)));
  if (defenseBonus) result = Math.max(1, Math.round(result * (1 - defenseBonus)));
  return result;
}

function resolvePower(combatant, action, skills) {
  if (action === 'skill') {
    const skill = selectOffensiveSkill(skills, combatant.class, 0);
    if (skill) {
      return {
        kind: 'skill',
        id: skill.id,
        name: skill.name,
        power: Number(skill.power),
        energyCost: Number(skill.energy_cost ?? 0),
      };
    }
  }

  return {
    kind: 'basic',
    id: `basic_${combatant.class}`,
    name: 'Ataque básico',
    power: BASIC_ATTACK_POWER_SNAPSHOT[combatant.class] ?? 7,
    energyCost: 0,
  };
}

export function resolveSimulatedAttack({
  attacker,
  defender,
  action,
  skills,
  matchups,
  rng,
  passivesEnabled = true,
}) {
  const d20A = rollD20(rng);
  const d20D = rollD20(rng);
  const classModifiers = getClassModifiers(attacker.class, defender.class, matchups);
  const selectedAction = resolvePower(attacker, action, skills);
  const spdBonus = getSpdBonus(attacker, defender);

  const confrontation = resolveConfrontation({
    d20A,
    d20D,
    atkAtk: attacker.atk,
    atkDef: defender.def,
    atkLvl: attacker.level,
    defLvl: defender.level,
    classModAtk: classModifiers.classModAtk,
    posMod: 0,
    buffOff: spdBonus,
    buffDef: 0,
  });

  const damageResult = computeGroupDamage({
    pwr: selectedAction.power,
    atk: attacker.atk,
    lvlDiff: attacker.level - defender.level,
    defEnemy: defender.def,
    damageMult: classModifiers.damageMult,
    critBonus: confrontation.critDmgBonus,
    category: confrontation.category,
    d20ANatural: confrontation.d20ANatural,
    d20DNatural: confrontation.d20DNatural,
  });

  const damage = applyClassPassiveSnapshot(
    damageResult.damage,
    attacker.class,
    defender.class,
    passivesEnabled,
  );

  return {
    d20A,
    d20D,
    rc: confrontation.rc,
    category: confrontation.category,
    critical: confrontation.d20ANatural,
    defenderNatural20: confrontation.d20DNatural,
    damage,
    isIlusory: damageResult.isIlusory,
    classRelation: classModifiers.relation,
    action: selectedAction,
  };
}

function cloneCombatant(combatant, multipliers = {}) {
  const hpMultiplier = Number(multipliers.hp ?? 1);
  const atkMultiplier = Number(multipliers.atk ?? 1);
  const defMultiplier = Number(multipliers.def ?? 1);

  const clone = {
    ...combatant,
    hpMax: Math.max(1, Math.round(combatant.hpMax * hpMultiplier)),
    atk: Math.max(1, Math.round(combatant.atk * atkMultiplier)),
    def: Math.max(1, Math.round(combatant.def * defMultiplier)),
  };
  clone.hp = clone.hpMax;
  return clone;
}

export function simulateBattle({
  player,
  enemy,
  playerAction = 'basic',
  enemyAction = 'basic',
  skills,
  matchups,
  rng,
  passivesEnabled = true,
  enemyMultipliers = {},
  maxTurns = 60,
}) {
  const playerState = cloneCombatant(player);
  const enemyState = cloneCombatant(enemy, enemyMultipliers);
  const events = [];
  let turn = 0;

  while (playerState.hp > 0 && enemyState.hp > 0 && turn < maxTurns) {
    turn += 1;

    const playerAttack = resolveSimulatedAttack({
      attacker: playerState,
      defender: enemyState,
      action: playerAction,
      skills,
      matchups,
      rng,
      passivesEnabled,
    });
    enemyState.hp = Math.max(0, enemyState.hp - playerAttack.damage);
    events.push({ turn, side: 'player', ...playerAttack });

    if (enemyState.hp <= 0) break;

    const enemyAttack = resolveSimulatedAttack({
      attacker: enemyState,
      defender: playerState,
      action: enemyAction,
      skills,
      matchups,
      rng,
      passivesEnabled,
    });
    playerState.hp = Math.max(0, playerState.hp - enemyAttack.damage);
    events.push({ turn, side: 'enemy', ...enemyAttack });
  }

  return {
    winner: playerState.hp > 0 && enemyState.hp <= 0
      ? 'player'
      : enemyState.hp > 0 && playerState.hp <= 0
        ? 'enemy'
        : 'draw',
    turns: turn,
    playerHpFinal: playerState.hp,
    enemyHpFinal: enemyState.hp,
    playerHpMax: playerState.hpMax,
    enemyHpMax: enemyState.hpMax,
    events,
  };
}

function hashScenarioId(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedValues.length) - 1),
  );
  return sortedValues[index];
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarizeBattles(battles) {
  const turns = battles.map((battle) => battle.turns).sort((a, b) => a - b);
  const events = battles.flatMap((battle) => battle.events);
  const playerEvents = events.filter((event) => event.side === 'player');
  const categoryCounts = Object.fromEntries(
    Object.values(RC_CATEGORY).map((category) => [category, 0]),
  );

  for (const event of playerEvents) {
    categoryCounts[event.category] = (categoryCounts[event.category] ?? 0) + 1;
  }

  const wins = battles.filter((battle) => battle.winner === 'player').length;
  const losses = battles.filter((battle) => battle.winner === 'enemy').length;
  const draws = battles.length - wins - losses;

  return {
    iterations: battles.length,
    winRate: wins / battles.length,
    lossRate: losses / battles.length,
    drawRate: draws / battles.length,
    turns: {
      mean: average(turns),
      median: percentile(turns, 50),
      p10: percentile(turns, 10),
      p25: percentile(turns, 25),
      p75: percentile(turns, 75),
      p90: percentile(turns, 90),
      oneOrTwoTurnRate: turns.filter((value) => value <= 2).length / turns.length,
      overEightTurnRate: turns.filter((value) => value > 8).length / turns.length,
    },
    damage: {
      playerMeanPerAction: average(playerEvents.map((event) => event.damage)),
      playerMin: Math.min(...playerEvents.map((event) => event.damage)),
      playerMax: Math.max(...playerEvents.map((event) => event.damage)),
    },
    criticalRate: playerEvents.filter((event) => event.critical).length / playerEvents.length,
    categories: categoryCounts,
    playerHpFinalMean: average(battles.map((battle) => battle.playerHpFinal)),
    enemyHpFinalMean: average(battles.map((battle) => battle.enemyHpFinal)),
  };
}

export function buildDefaultScenarios({ levels = DEFAULT_LEVELS } = {}) {
  const scenarios = [];

  for (const level of levels) {
    for (const [playerClass, enemyClass] of DEFAULT_PAIRS) {
      scenarios.push({
        id: `${playerClass}_vs_${enemyClass}_lv${level}_basic`,
        label: `${playerClass} vs ${enemyClass} — nível ${level} — básico`,
        playerClass,
        enemyClass,
        level,
        playerAction: 'basic',
        enemyAction: 'basic',
        passivesEnabled: true,
      });
    }
  }

  for (const level of [1, 10, 30]) {
    for (const [playerClass, enemyClass] of DEFAULT_PAIRS) {
      scenarios.push({
        id: `${playerClass}_vs_${enemyClass}_lv${level}_skill`,
        label: `${playerClass} vs ${enemyClass} — nível ${level} — skill ofensiva`,
        playerClass,
        enemyClass,
        level,
        playerAction: 'skill',
        enemyAction: 'basic',
        passivesEnabled: true,
      });
    }
  }

  scenarios.push(
    {
      id: 'Guerreiro_vs_Ladino_lv10_passives_on',
      label: 'Guerreiro vs Ladino — nível 10 — passivas ativas',
      playerClass: 'Guerreiro',
      enemyClass: 'Ladino',
      level: 10,
      playerAction: 'basic',
      enemyAction: 'basic',
      passivesEnabled: true,
    },
    {
      id: 'Guerreiro_vs_Ladino_lv10_passives_off',
      label: 'Guerreiro vs Ladino — nível 10 — passivas desativadas',
      playerClass: 'Guerreiro',
      enemyClass: 'Ladino',
      level: 10,
      playerAction: 'basic',
      enemyAction: 'basic',
      passivesEnabled: false,
    },
    {
      id: 'Guerreiro_vs_Mago_lv10_common',
      label: 'Guerreiro vs Mago — nível 10 — inimigo comum',
      playerClass: 'Guerreiro',
      enemyClass: 'Mago',
      level: 10,
      playerAction: 'basic',
      enemyAction: 'basic',
      passivesEnabled: true,
    },
    {
      id: 'Guerreiro_vs_Mago_lv10_boss_proxy',
      label: 'Guerreiro vs Mago — nível 10 — proxy de boss',
      playerClass: 'Guerreiro',
      enemyClass: 'Mago',
      level: 10,
      playerAction: 'basic',
      enemyAction: 'basic',
      passivesEnabled: true,
      enemyMultipliers: { hp: 2, atk: 1.15, def: 1.15 },
      notes: 'Proxy de sensibilidade; não representa multiplicador canônico confirmado de boss.',
    },
  );

  return scenarios;
}

export function runScenario({
  scenario,
  representatives,
  skills,
  matchups,
  iterations,
  seed,
}) {
  assertPositiveInteger(iterations, 'iterations');
  const playerTemplate = representatives[scenario.playerClass];
  const enemyTemplate = representatives[scenario.enemyClass];
  if (!playerTemplate || !enemyTemplate) {
    throw new Error(`Cenário ${scenario.id} referencia classe sem representante.`);
  }

  const player = scaleCatalogMonster(playerTemplate, scenario.level);
  const enemy = scaleCatalogMonster(enemyTemplate, scenario.level);
  const rng = createSeededRng((Number(seed) + hashScenarioId(scenario.id)) >>> 0);
  const battles = [];

  for (let index = 0; index < iterations; index += 1) {
    battles.push(simulateBattle({
      player,
      enemy,
      playerAction: scenario.playerAction,
      enemyAction: scenario.enemyAction,
      skills,
      matchups,
      rng,
      passivesEnabled: scenario.passivesEnabled,
      enemyMultipliers: scenario.enemyMultipliers,
    }));
  }

  return {
    scenario,
    player: {
      id: player.id,
      name: player.name,
      class: player.class,
      level: player.level,
      hpMax: player.hpMax,
      atk: player.atk,
      def: player.def,
      spd: player.spd,
    },
    enemy: {
      id: enemy.id,
      name: enemy.name,
      class: enemy.class,
      level: enemy.level,
      hpMax: enemy.hpMax,
      atk: enemy.atk,
      def: enemy.def,
      spd: enemy.spd,
      multipliers: scenario.enemyMultipliers ?? null,
    },
    metrics: summarizeBattles(battles),
  };
}

export function runBaseline({
  rootDir = DEFAULT_ROOT_DIR,
  iterations = 1000,
  seed = 2202,
  scenarios = null,
  levels = DEFAULT_LEVELS,
} = {}) {
  assertPositiveInteger(iterations, 'iterations');
  const data = loadSimulationData(rootDir);
  const representatives = selectClassRepresentatives(data.monsters);
  const selectedScenarios = scenarios ?? buildDefaultScenarios({ levels });

  const results = selectedScenarios.map((scenario) => runScenario({
    scenario,
    representatives,
    skills: data.skills,
    matchups: data.matchups,
    iterations,
    seed,
  }));

  return {
    metadata: {
      generatedAt: process.env.SOURCE_DATE_EPOCH
        ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
        : new Date().toISOString(),
      seed,
      iterationsPerScenario: iterations,
      scenarioCount: selectedScenarios.length,
      levels,
      dataVersions: data.versions,
      formulaModule: 'js/combat/groupCombatFormula.js',
      dataSources: [
        'data/monsters.json',
        'data/skills.json',
        'design/canon/class_matchups.json',
      ],
      limitations: [
        'Jogador age primeiro; iniciativa completa do runtime não é simulada.',
        'ENE e política de escolha de habilidade ainda não integram o loop completo.',
        'Passivas percentuais usam snapshot descritivo de wildActions.js.',
        'Boss é proxy de sensibilidade, pois multiplicadores canônicos permanecem pendentes.',
        'Resultado quantitativo não substitui playtest mediado.',
      ],
      classification: 'C. Evidência ainda insuficiente para decidir',
    },
    representatives: Object.fromEntries(
      Object.entries(representatives).map(([className, monster]) => [className, {
        id: monster.id,
        name: monster.name,
        rarity: monster.rarity,
      }]),
    ),
    results,
  };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatNumber(value) {
  return Number(value).toFixed(2);
}

export function renderBaselineMarkdown(report) {
  const lines = [
    '# Baseline Quantitativa — Combate v2.2',
    '',
    `- Gerado em: ${report.metadata.generatedAt}`,
    `- Seed: \`${report.metadata.seed}\``,
    `- Iterações por cenário: ${report.metadata.iterationsPerScenario}`,
    `- Cenários: ${report.metadata.scenarioCount}`,
    `- Classificação automática permitida: **${report.metadata.classification}**`,
    '',
    '> Este relatório mede o comportamento do harness. Ele não aprova mudanças de balanceamento.',
    '',
    '## Resultados',
    '',
    '| Cenário | Vitória | Turnos médios | Mediana | P90 | 1–2 turnos | >8 turnos | Dano médio | Crítico |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];

  for (const result of report.results) {
    const metrics = result.metrics;
    lines.push(
      `| ${result.scenario.label} | ${formatPercent(metrics.winRate)} | ${formatNumber(metrics.turns.mean)} | ${metrics.turns.median} | ${metrics.turns.p90} | ${formatPercent(metrics.turns.oneOrTwoTurnRate)} | ${formatPercent(metrics.turns.overEightTurnRate)} | ${formatNumber(metrics.damage.playerMeanPerAction)} | ${formatPercent(metrics.criticalRate)} |`,
    );
  }

  lines.push(
    '',
    '## Limitações',
    '',
    ...report.metadata.limitations.map((item) => `- ${item}`),
    '',
    '## Próxima leitura humana',
    '',
    'Classificar cada achado como `BUG`, `DRIFT`, `BALANCE`, `UX`, `EVIDENCE_GAP` ou `DECISION` antes de abrir um PR de ajuste.',
    '',
  );

  return lines.join('\n');
}
