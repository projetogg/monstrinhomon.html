import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveCanonSpeciesId } from '../js/canon/speciesBridge.js';

const root = resolve(import.meta.dirname, '..');
const monsters = JSON.parse(readFileSync(resolve(root, 'data/monsters.json'), 'utf8')).monsters;
const protocol = readFileSync(
  resolve(root, 'docs/SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md'), 'utf8',
);
const monstersById = new Map(monsters.map(mon => [mon.id, mon]));

function isNaturalFormAtLevel(id, level) {
  const mon = monstersById.get(id);
  const prior = monsters.find(prev => prev.evolvesTo === id);
  return !!mon && !mon.deprecated &&
    (!prior || Number(prior.evolvesAt) <= level) &&
    (!mon.evolvesAt || Number(mon.evolvesAt) > level);
}

function scenarioRow(id) {
  const line = protocol.split('\n').find(entry => entry.startsWith('| `' + id + '` |'));
  expect(line, 'Linha do protocolo ausente: ' + id).toBeTruthy();
  return line;
}

describe('SP-06A/B — candidatos naturais de configuração do protocolo', () => {
  it('evita Vitalion nivel 30 como oponente nos dois cenários ativos', () => {
    expect(isNaturalFormAtLevel('MON_031B', 30)).toBe(false);
    for (const scenario of ['SP-06A', 'SP-06B']) {
      expect(scenarioRow(scenario)).not.toContain('MON_031B');
      expect(scenarioRow(scenario)).toContain('NÃO HOMOLOGADO');
    }
  });

  it('Aquasolion é forma válida nível 30 e mantém a classe Curandeiro no SP-06A', () => {
    const row = scenarioRow('SP-06A');
    expect(isNaturalFormAtLevel('MON_032B', 30)).toBe(true);
    expect(monstersById.get('MON_032B').class).toBe('Curandeiro');
    expect(row).toContain('MON_032B');
    expect(resolveCanonSpeciesId('MON_032B')).toBeNull();
  });

  it('Auravelo é forma válida nível 30, mas carrega floracura no bridge', () => {
    const row = scenarioRow('SP-06B');
    expect(isNaturalFormAtLevel('MON_028C', 30)).toBe(true);
    expect(monstersById.get('MON_028C').class).toBe('Curandeiro');
    expect(row).toContain('MON_028C');
    expect(resolveCanonSpeciesId('MON_028C')).toBe('floracura');
  });

  it('protege alternativa simples SP-06B e exige liberação humana', () => {
    expect(scenarioRow('SP-06B')).toContain('MON_032B');
    expect(protocol).toContain('autor deve aprovar objetivo e oponente');
    expect(protocol).toContain('Vitalegion Nv30 (SPD 41 × 41)');
    expect(protocol).toContain('DEC-PLAYTEST-PRE-01');
  });
});