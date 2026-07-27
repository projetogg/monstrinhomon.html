import { computeGroupDamage, RC_CATEGORY, resolveConfrontation } from './groupCombatFormula.js';

export const RARITY_POWER = Object.freeze({
  Comum: 1,
  Incomum: 1.08,
  Raro: 1.18,
  'Místico': 1.32,
  Lendário: 1.5,
});

export const DEFAULT_BASIC_POWER = Object.freeze({
  Guerreiro: 7,
  Mago: 7,
  Curandeiro: 8,
  'Bárbaro': 9,
  Ladino: 8,
  Bardo: 7,
  'Caçador': 8,
  Animalista: 7,
});

export const DEFAULT_ENE_REGEN = Object.freeze({
  Mago: { pct: 0.14, min: 2 },
  Curandeiro: { pct: 0.14, min: 2 },
  Bardo: { pct: 0.12, min: 2 },
  'Caçador': { pct: 0.12, min: 2 },
  Ladino: { pct: 0.12, min: 2 },
  Animalista: { pct: 0.1, min: 1 },
  'Bárbaro': { pct: 0.1, min: 1 },
  Guerreiro: { pct: 0.1, min: 1 },
});

export const DEFAULT_CLASS_PASSIVES = Object.freeze({
  Guerreiro: { defenseBonus: 0.15 },
  'Bárbaro': { defenseBonus: 0.1 },
  Curandeiro: { defenseBonus: 0.1 },
  Ladino: { attackBonus: 0.1 },
});

const RC_KEYS = Object.freeze(Object.values(RC_CATEGORY));

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededRng(seed = 'monstrinhomon-v2.2') {
  let state = hashSeed(seed) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function rollD20(rng) {
  return Math.floor(rng() * 20) + 1;
}

export function buildClassAdvantages(matchupsJson) {
  const table = matchupsJson?.classes_ptbr ?? {};
  return Object.fromEntries(Object.entries(table).map(([className, row]) => [
    className,
    { strong: row?.strong_against ?? null, weak: row?.weak_against ?? null },
  ]));
}

export function getClassModifiers(attackerClass, defenderClass, classAdvantages) {
  const matchup = classAdvantages?.[attackerClass];
  if (matchup?.strong === defenderClass) return { atkBonus: 2, damageMult: 1.1, relation: 'strong' };
  if (matchup?.weak === defenderClass) return { atkBonus: -2, damageMult: 0.9, relation: 'weak' };
  return { atkBonus: 0, damageMult: 1, relation: 'neutral' };
}

export function getSpdBonus(attacker, defender) {
  const diff = Number(attacker?.spd ?? 1) - Number(defender?.spd ?? 1);
  if (diff >= 3) return 1;
  if (diff <= -3) return -1;
  return 0;
}

export function scaleMonsterTemplate(template, level = 1) {
  if (!template) throw new TypeError('template de monstrinho obrigatório');
  const safeLevel = Math.max(1, Math.floor(Number(level) || 1));
  const levelMult = 1 + (safeLevel - 1) * 0.1;
  const rarityMult = RARITY_POWER[template.rarity] ?? 1;
  const hpMax = Math.max(1, Math.floor(Number(template.baseHp ?? 1) * levelMult));
  return {
    id: template.id,
    name: template.name,
    class: template.class,
    rarity: template.rarity,
    level: safeLevel,
    hp: hpMax,
    hpMax,
    atk: Math.max(1, Math.floor(Number(template.baseAtk ?? 5) * levelMult * rarityMult)),
    def: Math.max(1, Math.floor(Number(template.baseDef ?? 3) * levelMult * rarityMult)),
    spd: Math.max(1, Math.floor(Number(template.baseSpd ?? 5) * levelMult * rarityMult)),
    eneMax: safeLevel === 1
      ? Math.max(0, Number(template.baseEne ?? 0))
      : Math.floor(10 + 2 * (safeLevel - 1)),
  };
}

export function selectBaseTemplates(monstersJson) {
  const monsters = Array.isArray(monstersJson?.monsters) ? monstersJson.monsters : [];
  const selected = new Map();
  for (const monster of [...monsters].sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    if (monster?.rarity !== 'Comum' || !monster?.class || selected.has(monster.class)) continue;
    selected.set(monster.class, monster);
  }
  return Object.fromEntries(selected);
}

export function selectTierOneDamageSkills(skillsJson) {
  const skills = Array.isArray(skillsJson?.skills) ? skillsJson.skills : [];
  const selected = new Map();
  for (const skill of skills) {
    if (skill?.type !== 'DAMAGE' || Number(skill?.stageIndex) !== 0 || !skill?.class) continue;
    if (!selected.has(skill.class)) selected.set(skill.class, skill);
  }
  return Object.fromEntries(selected);
}

export function calculateEneRegen(className, eneMax, table = DEFAULT_ENE_REGEN) {
  const config = table[className] ?? { pct: 0.1, min: 1 };
  return Math.max(config.min, Math.floor(Math.max(0, eneMax) * config.pct));
}

export function applyEneRegen(currentEnergy, eneMax, regenAmount) {
  const current = Math.max(0, Number(currentEnergy) || 0);
  const maximum = Math.max(0, Number(eneMax) || 0);
  const offered = Math.max(0, Number(regenAmount) || 0);
  const energy = Math.min(maximum, current + offered);
  return { energy, gained: Math.max(0, energy - current) };
}

function applyClassPassives(damage, attackerClass, defenderClass, passives) {
  let result = damage;
  const attackBonus = passives?.[attackerClass]?.attackBonus;
  if (attackBonus) result = Math.max(1, Math.round(result * (1 + attackBonus)));
  const defenseBonus = passives?.[defenderClass]?.defenseBonus;
  if (defenseBonus) result = Math.max(1, Math.round(result * (1 - defenseBonus)));
  return result;
}

function chooseAction(actor, actionProfile, skill, energy) {
  if (actionProfile === 'skill' && skill) return { kind: 'skill', power: skill.power, cost: skill.energy_cost };
  if (actionProfile === 'mixed' && skill && energy >= Number(skill.energy_cost ?? 0)) {
    return { kind: 'skill', power: skill.power, cost: skill.energy_cost };
  }
  return { kind: 'basic', power: DEFAULT_BASIC_POWER[actor.class] ?? 7, cost: 0 };
}

function emptyCounters() {
  return {
    categories: Object.fromEntries(RC_KEYS.map(key => [key, 0])),
    natural1: 0,
    natural20: 0,
    attacks: 0,
    damagingActions: 0,
    totalDamage: 0,
    minDamage: Number.POSITIVE_INFINITY,
    maxDamage: 0,
    skillUses: 0,
    basicUses: 0,
    eneSpent: 0,
    eneRegenerated: 0,
  };
}

function performAttack({ attacker, defender, rng, classAdvantages, power, counters, passivesEnabled }) {
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
  const result = computeGroupDamage({
    pwr: Number(power) || 0,
    atk: attacker.atk,
    lvlDiff: attacker.level - defender.level,
    defEnemy: defender.def,
    damageMult: classMods.damageMult,
    critBonus: confrontation.critDmgBonus,
    category: confrontation.category,
    d20ANatural: confrontation.d20ANatural,
    d20DNatural: confrontation.d20DNatural,
  });
  let damage = result.damage;
  if (passivesEnabled && damage > 0) {
    damage = applyClassPassives(damage, attacker.class, defender.class, DEFAULT_CLASS_PASSIVES);
  }

  counters.categories[confrontation.category] += 1;
  counters.natural1 += d20A === 1 ? 1 : 0;
  counters.natural20 += d20A === 20 ? 1 : 0;
  counters.attacks += 1;
  if (damage > 0) {
    counters.damagingActions += 1;
    counters.totalDamage += damage;
    counters.minDamage = Math.min(counters.minDamage, damage);
    counters.maxDamage = Math.max(counters.maxDamage, damage);
  }
  defender.hp = Math.max(0, defender.hp - damage);
  return { damage, confrontation };
}

function percentile(sortedValues, probability) {
  if (sortedValues.length === 0) return 0;
  const index = (sortedValues.length - 1) * probability;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function summarizeBattleRuns(runs, counters, maxTurns) {
  const turns = runs.map(run => run.turns).sort((a, b) => a - b);
  const playerWins = runs.filter(run => run.winner === 'player').length;
  const draws = runs.filter(run => run.winner === 'draw').length;
  const hpFinal = runs.map(run => run.playerHpFinal);
  const total = Math.max(1, runs.length);
  return {
    runs: runs.length,
    winRate: round(playerWins / total),
    drawRate: round(draws / total),
    ttk: {
      mean: round(turns.reduce((sum, value) => sum + value, 0) / total),
      median: round(percentile(turns, 0.5)),
      p10: round(percentile(turns, 0.1)),
      p25: round(percentile(turns, 0.25)),
      p75: round(percentile(turns, 0.75)),
      p90: round(percentile(turns, 0.9)),
      oneOrTwoTurnRate: round(turns.filter(value => value <= 2).length / total),
      overLimitRate: round(turns.filter(value => value >= maxTurns).length / total),
    },
    playerHpFinalMean: round(hpFinal.reduce((sum, value) => sum + value, 0) / total),
    damage: {
      meanPerDamagingAction: counters.damagingActions > 0
        ? round(counters.totalDamage / counters.damagingActions)
        : 0,
      min: Number.isFinite(counters.minDamage) ? counters.minDamage : 0,
      max: counters.maxDamage,
    },
    confrontation: {
      ...counters.categories,
      natural1Rate: round(counters.natural1 / Math.max(1, counters.attacks)),
      natural20Rate: round(counters.natural20 / Math.max(1, counters.attacks)),
    },
    actions: {
      attacks: counters.attacks,
      basicUses: counters.basicUses,
      skillUses: counters.skillUses,
      skillUseRate: round(counters.skillUses / Math.max(1, counters.basicUses + counters.skillUses)),
      eneSpent: counters.eneSpent,
      eneRegenerated: counters.eneRegenerated,
    },
  };
}

export function simulateScenario(scenario, options = {}) {
  const runsCount = Math.max(1, Math.floor(Number(options.runs ?? 1000)));
  const maxTurns = Math.max(1, Math.floor(Number(options.maxTurns ?? 50)));
  const rng = createSeededRng(options.seed ?? scenario.id ?? 'scenario');
  const counters = emptyCounters();
  const runs = [];

  for (let index = 0; index < runsCount; index += 1) {
    const player = { ...scenario.player, hp: scenario.player.hpMax };
    const enemy = { ...scenario.enemy, hp: scenario.enemy.hpMax };
    let playerEne = Math.floor(player.eneMax * Number(scenario.initialEnergyRatio ?? 0));
    let enemyEne = Math.floor(enemy.eneMax * Number(scenario.initialEnergyRatio ?? 0));
    let turns = 0;

    while (player.hp > 0 && enemy.hp > 0 && turns < maxTurns) {
      turns += 1;
      const playerRegen = applyEneRegen(
        playerEne,
        player.eneMax,
        calculateEneRegen(player.class, player.eneMax),
      );
      playerEne = playerRegen.energy;
      counters.eneRegenerated += playerRegen.gained;
      const playerAction = chooseAction(player, scenario.playerActionProfile ?? 'basic', scenario.playerSkill, playerEne);
      playerEne -= Number(playerAction.cost ?? 0);
      counters.eneSpent += Number(playerAction.cost ?? 0);
      counters[playerAction.kind === 'skill' ? 'skillUses' : 'basicUses'] += 1;
      performAttack({
        attacker: player,
        defender: enemy,
        rng,
        classAdvantages: scenario.classAdvantages,
        power: playerAction.power,
        counters,
        passivesEnabled: scenario.passivesEnabled !== false,
      });
      if (enemy.hp <= 0) break;

      const enemyRegen = applyEneRegen(
        enemyEne,
        enemy.eneMax,
        calculateEneRegen(enemy.class, enemy.eneMax),
      );
      enemyEne = enemyRegen.energy;
      counters.eneRegenerated += enemyRegen.gained;
      const enemyAction = chooseAction(enemy, scenario.enemyActionProfile ?? 'basic', scenario.enemySkill, enemyEne);
      enemyEne -= Number(enemyAction.cost ?? 0);
      counters.eneSpent += Number(enemyAction.cost ?? 0);
      counters[enemyAction.kind === 'skill' ? 'skillUses' : 'basicUses'] += 1;
      performAttack({
        attacker: enemy,
        defender: player,
        rng,
        classAdvantages: scenario.classAdvantages,
        power: enemyAction.power,
        counters,
        passivesEnabled: scenario.passivesEnabled !== false,
      });
    }

    runs.push({
      winner: player.hp > 0 && enemy.hp <= 0 ? 'player' : enemy.hp > 0 && player.hp <= 0 ? 'enemy' : 'draw',
      turns,
      playerHpFinal: player.hp,
      enemyHpFinal: enemy.hp,
    });
  }

  return {
    id: scenario.id,
    label: scenario.label,
    level: scenario.player.level,
    playerClass: scenario.player.class,
    enemyClass: scenario.enemy.class,
    playerActionProfile: scenario.playerActionProfile ?? 'basic',
    enemyActionProfile: scenario.enemyActionProfile ?? 'basic',
    passivesEnabled: scenario.passivesEnabled !== false,
    summary: summarizeBattleRuns(runs, counters, maxTurns),
  };
}

export function buildBaselineScenarios({ monstersJson, skillsJson, matchupsJson, levels = [1, 5, 10, 15, 30] }) {
  const templates = selectBaseTemplates(monstersJson);
  const skills = selectTierOneDamageSkills(skillsJson);
  const classAdvantages = buildClassAdvantages(matchupsJson);
  const pairs = [
    ['Guerreiro', 'Bárbaro'],
    ['Bárbaro', 'Guerreiro'],
    ['Mago', 'Guerreiro'],
    ['Guerreiro', 'Mago'],
    ['Ladino', 'Caçador'],
    ['Caçador', 'Mago'],
    ['Curandeiro', 'Bárbaro'],
    ['Bardo', 'Curandeiro'],
    ['Animalista', 'Bardo'],
  ];
  const scenarios = [];
  for (const level of levels) {
    for (const [playerClass, enemyClass] of pairs) {
      if (!templates[playerClass] || !templates[enemyClass]) continue;
      for (const profile of ['basic', 'mixed']) {
        scenarios.push({
          id: `${playerClass}-${enemyClass}-L${level}-${profile}`,
          label: `${playerClass} x ${enemyClass} — nível ${level} — ${profile}`,
          player: scaleMonsterTemplate(templates[playerClass], level),
          enemy: scaleMonsterTemplate(templates[enemyClass], level),
          playerSkill: skills[playerClass] ?? null,
          enemySkill: skills[enemyClass] ?? null,
          playerActionProfile: profile,
          enemyActionProfile: profile,
          classAdvantages,
          initialEnergyRatio: 0,
          passivesEnabled: true,
        });
      }
    }
  }
  return scenarios;
}

export function runScenarioMatrix(scenarios, options = {}) {
  const seed = options.seed ?? 'monstrinhomon-combat-v2.2';
  return scenarios.map(scenario => simulateScenario(scenario, {
    ...options,
    seed: `${seed}:${scenario.id}`,
  }));
}

export function renderMarkdownReport({ baselineSha = 'unknown', seed, runs, results }) {
  const lines = [
    '# Baseline Quantitativo — Combate v2.2',
    '',
    `- **SHA:** \`${baselineSha}\``,
    `- **Seed:** \`${seed}\``,
    `- **Execuções por cenário:** ${runs}`,
    `- **Cenários:** ${results.length}`,
    '- **Conclusão:** **C. Evidência ainda insuficiente para decidir**',
    '',
    '> Esta é a primeira medição automatizada. Não inclui playtest, passivas de espécie, cura, alvo de IA ou equivalência completa Wild/Group.',
    '',
    '## Resultados',
    '',
    '| Cenário | Perfil | Vitória | TTK médio | P90 | 1–2 turnos | Dano médio | Skills |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
  ];
  for (const result of results) {
    const summary = result.summary;
    lines.push(`| ${result.label} | ${result.playerActionProfile} | ${(summary.winRate * 100).toFixed(1)}% | ${summary.ttk.mean} | ${summary.ttk.p90} | ${(summary.ttk.oneOrTwoTurnRate * 100).toFixed(1)}% | ${summary.damage.meanPerDamagingAction} | ${(summary.actions.skillUseRate * 100).toFixed(1)}% |`);
  }
  lines.push('', '## Limitações', '', '- crescimento de atributos em níveis 5–30 usa perfil explícito do harness e deve ser comparado ao runtime;', '- a ordem é jogador primeiro em todos os turnos;', '- o modelo de ação usa ataque básico ou primeira skill ofensiva de estágio 0;', '- os dados não autorizam ajuste de balanceamento.', '');
  return `${lines.join('\n')}\n`;
}
