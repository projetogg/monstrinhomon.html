import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { clearCardCatalogCache, setCardCatalogForTests } from '../js/cards/cardLayer.js';
import { resolveCardSkillIdentity, resolveCardsForMonster } from '../js/cards/cardResolver.js';

const ROOT = resolve(import.meta.dirname, '..');
const cardsData = JSON.parse(readFileSync(resolve(ROOT, 'data/cards.json'), 'utf8'));

function makeHeavyStrike() {
  return {
    _kitSwapId: 'shieldhorn_heavy_strike',
    name: 'Golpe Pesado I',
    type: 'DAMAGE',
    cost: 6,
  };
}

describe('Card Layer — Warrior kit swap visual alias', () => {
  beforeEach(() => {
    clearCardCatalogCache();
    setCardCatalogForTests(cardsData);
  });

  it('maps shieldhorn_heavy_strike to the base Warrior visual identity', () => {
    const skill = makeHeavyStrike();
    const identity = resolveCardSkillIdentity(skill);

    expect(identity).not.toBe(skill);
    expect(identity.class).toBe('Guerreiro');
    expect(identity.groupKey).toBe('Golpe de Espada');
    expect(identity.stageIndex).toBe(0);
    expect(identity._cardLayerAlias).toBe(true);
    expect(identity._cardLayerAliasSource).toBe('shieldhorn_heavy_strike');
    expect(skill.class).toBeUndefined();
    expect(skill.groupKey).toBeUndefined();
  });

  it('resolves Golpe Pesado I to warrior_golpe_de_espada_card and preserves the effective skill', () => {
    const heavyStrike = makeHeavyStrike();
    const entries = resolveCardsForMonster({ id: 'mi_ferrozimon', class: 'Guerreiro' }, {
      getMonsterSkills: () => [heavyStrike],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].mapped).toBe(true);
    expect(entries[0].card.id).toBe('warrior_golpe_de_espada_card');
    expect(entries[0].stage.source_skill_id).toBe('GOLPE_DE_ESPADA_0');
    expect(entries[0].skill).toBe(heavyStrike);
    expect(entries[0].lookupSkill).not.toBe(heavyStrike);
    expect(entries[0].cardAliasApplied).toBe(true);
  });

  it('keeps unknown kit swaps unmapped for safe legacy fallback', () => {
    const entries = resolveCardsForMonster({ id: 'mi_unknown', class: 'Guerreiro' }, {
      getMonsterSkills: () => [{ _kitSwapId: 'unknown_swap', name: 'Troca Sem Card' }],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0].mapped).toBe(false);
    expect(entries[0].reason).toBe('missing_class_or_groupKey');
    expect(entries[0].cardAliasApplied).toBe(false);
  });
});
