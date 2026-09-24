import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildClassAdvantages } from '../js/combat/combatSimulationHarness.js';
import { simulateSpeciesPassiveScenarioPair } from '../js/combat/speciesPassiveQuantitativeHarness.js';

const ROOT = resolve(import.meta.dirname, '..');
const monstersJson = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
const matchupsJson = JSON.parse(readFileSync(resolve(ROOT, 'design/canon/class_matchups.json'), 'utf8'));

const monsters = monstersJson.monsters;
const playerTemplate = monsters.find(mon => mon.id === 'MON_001');
const enemyTemplate = monsters.find(mon => mon.id === 'MON_031');
const classAdvantages = buildClassAdvantages(matchupsJson);

function scenario(profile) {
  return {
    id: `sp01-technical-${profile}`,
    speciesId: 'shieldhorn',
    className: 'Guerreiro',
    level: 10,
    profile,
    playerTemplate,
    enemyTemplate,
    classAdvantages,
    basicPower: 7,
    // Usa o Golpe Pesado I efetivo do tank_puro apenas como potência da ação skill
    // no perfil mixed; o harness continua sendo passiva-isolada e não pacote completo.
    skillPower: 22,
  };
}

describe('SP-01 técnico — shieldhorn pós-PR #288', () => {
  it('mede MON_001 x MON_031 no harness oficial com frontline explícito', () => {
    const runs = 20000;
    const seed = 'sp01-technical-ab76-frontline-v1';

    const basic = simulateSpeciesPassiveScenarioPair(
      scenario('basic'),
      { runs, seed, maxTurns: 30 },
    );
    const mixed = simulateSpeciesPassiveScenarioPair(
      scenario('mixed'),
      { runs, seed, maxTurns: 30 },
    );

    const compact = result => ({
      profile: result.profile,
      runs: result.runs,
      baseWinRate: result.base.winRate,
      passiveWinRate: result.passive.winRate,
      deltaWinRate: result.delta.winRate,
      baseTurnsMean: result.base.turns.mean,
      passiveTurnsMean: result.passive.turns.mean,
      deltaTurnsMean: result.delta.turns.mean,
      activationRate: result.passive.combatsWithActivationRate,
      damageReductionApplications: result.passive.effects.damageReductionApplications,
      damageReducedTotal: result.passive.effects.damageReduced,
      meanDamagePrevented: result.delta.damagePrevented.mean,
      meanPlayerHpFinalDelta: result.delta.playerHpFinal.mean,
    });

    console.log('SP01_TECHNICAL_RESULT', JSON.stringify({
      verifiedAgainst: 'ab76fcb4e2dc91e5bcf3da812130ccbe983219b4',
      player: 'MON_001',
      enemy: 'MON_031',
      level: 10,
      frontline: true,
      note: 'harness oficial passiva-isolada; não inclui offsets/kit/ENE integrais',
      basic: compact(basic),
      mixed: compact(mixed),
    }));

    expect(basic.passive.effects.damageReductionApplications).toBeGreaterThan(0);
    expect(mixed.passive.effects.damageReductionApplications).toBeGreaterThan(0);
    expect(basic.delta.damagePrevented.mean).toBeGreaterThanOrEqual(0);
    expect(mixed.delta.damagePrevented.mean).toBeGreaterThanOrEqual(0);
  });
});
