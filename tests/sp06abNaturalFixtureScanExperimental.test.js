import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scaleMonsterTemplate, buildClassAdvantages } from '../js/combat/combatSimulationHarness.js';
import { simulateSpeciesPassiveScenarioPair } from '../js/combat/speciesPassiveQuantitativeHarness.js';

const ROOT = resolve(import.meta.dirname, '..');
const monsters = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8')).monsters;
const matchups = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));
const byId = new Map(monsters.map(m => [m.id, m]));
const classAdvantages = buildClassAdvantages(matchups);

function naturalAt(id, level = 30) {
  const monster = byId.get(id);
  const predecessor = monsters.find(m => m.evolvesTo === id);
  return !!monster && !monster.deprecated && monster.rarity !== 'Lendário' &&
    (!predecessor || Number(predecessor.evolvesAt) <= level) &&
    (!monster.evolvesAt || Number(monster.evolvesAt) > level);
}
const scenarios = [
  { focus: 'SP-06A', species: 'moonquill', player: 'MON_015',
    enemies: ['MON_031B', 'MON_031C', 'MON_028C', 'MON_032B', 'MON_024C', 'MON_030C', 'MON_027C'] },
  { focus: 'SP-06B', species: 'shadowsting', player: 'MON_022C',
    enemies: ['MON_031B', 'MON_031C', 'MON_028C', 'MON_032B', 'MON_024C', 'MON_030C', 'MON_027C'] },
];

describe('Exploratório: audit natural fixtures SP-06A/SP-06B (não merge)', () => {
  it('detecta nível inválido e gera quadro comparativo reproduzível', () => {
    expect(naturalAt('MON_031B', 30)).toBe(false);
    for (const id of ['MON_031C', 'MON_028C', 'MON_032B']) {
      expect(naturalAt(id, 30), id).toBe(true);
    }
    const rows = [];
    for (const item of scenarios) {
      const player = byId.get(item.player);
      for (const id of item.enemies) {
        const enemy = byId.get(id);
        const scenario = {
          id: item.focus + ':' + item.player + ':' + id,
          speciesId: item.species,
          className: player.class,
          playerTemplate: player,
          enemyTemplate: enemy,
          level: 30,
          profile: 'mixed',
          classAdvantages,
          basicPower: item.focus === 'SP-06A' ? 7 : 8,
          skillPower: item.focus === 'SP-06A' ? 11 : 12,
        };
        const result = simulateSpeciesPassiveScenarioPair(scenario, {
          runs: 1200, maxTurns: 30, seed: 'sp06-natural-fixtures-oct09',
        });
        const p = scaleMonsterTemplate(player, 30);
        const e = scaleMonsterTemplate(enemy, 30);
        rows.push({
          focus: item.focus, player: player.id, enemy: id, enemyName: enemy.name,
          natural: naturalAt(id, 30),
          playerSpd: p.spd, enemySpd: e.spd,
          enemyHp: e.hpMax, enemyAtk: e.atk, enemyDef: e.def,
          baseWinPct: Number((100 * result.base.winRate).toFixed(2)),
          passiveWinPct: Number((100 * result.passive.winRate).toFixed(2)),
          baseMeanTurns: result.base.turns.mean,
          passiveMeanTurns: result.passive.turns.mean,
          spdBuffApplications: result.passive.effects.spdBuffApplications,
          chargesConsumed: result.passive.effects.chargesConsumed,
          deltaMeanDamage: result.delta.damageDealt.mean,
        });
      }
    }
    console.log('SP06AB_AUDIT_RESULTS_JSON=' + JSON.stringify(rows));
    expect(rows).toHaveLength(14);
    expect(rows.every(r => r.playerSpd > 0 && r.enemySpd > 0)).toBe(true);
  });
});