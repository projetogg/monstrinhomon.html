import { describe, it, expect } from 'vitest';

import { buildWildSkillGridHtml } from '../js/cards/cardWildPilot.js';
import { renderCardGrid } from '../js/cards/cardRenderer.js';

const FLAGS_ON = Object.freeze({
  enabled: true,
  pilotClasses: ['Guerreiro'],
  fallbackToSkillUI: true,
  logUnmappedSkills: true,
  devShowMissingSlots: false,
});

function makeWarrior() {
  return { id: 'mi_ferrozimon', name: 'Ferrozimon', class: 'Guerreiro', hp: 30, ene: 10 };
}

describe('Card Layer QA diagnostics and temporary layout', () => {
  it('shows a QA diagnostic when catalog is unavailable and Card Layer pilot is enabled', () => {
    const result = buildWildSkillGridHtml(makeWarrior(), {
      flags: FLAGS_ON,
      catalog: null,
      resolveMonsterSkills: () => [
        { name: 'Golpe Pesado I', _kitSwapId: 'shieldhorn_heavy_strike', cost: 6, type: 'DAMAGE', target: 'enemy' },
      ],
      canUseSkillNow: () => true,
      tutorialAllows: true,
      logger: { warn: () => {} },
    });

    expect(result.mode).toBe('legacy');
    expect(result.reason).toBe('catalog_unavailable');
    expect(result.html).toContain('card-layer-qa-diagnostic');
    expect(result.html).toContain('catalog_unavailable');
    expect(result.html).toContain('Golpe Pesado I');
  });

  it('shows unmapped skill details in the QA diagnostic before falling back to legacy UI', () => {
    const result = buildWildSkillGridHtml(makeWarrior(), {
      flags: FLAGS_ON,
      catalog: { cards: [{ id: 'dummy' }] },
      resolveMonsterSkills: () => [{ name: 'Skill Sem Card', cost: 1 }],
      getMonsterSkills: () => [{ name: 'Skill Sem Card', cost: 1 }],
      resolveCardsForMonster: () => [
        { mapped: false, reason: 'missing_class_or_groupKey', skill: { name: 'Skill Sem Card' } },
      ],
      renderCardGrid: () => '',
      canUseSkillNow: () => true,
      tutorialAllows: true,
      logger: { warn: () => {} },
    });

    expect(result.mode).toBe('legacy');
    expect(result.reason).toBe('unmapped_skills_fallback');
    expect(result.html).toContain('card-layer-qa-diagnostic');
    expect(result.html).toContain('Skill Sem Card: missing_class_or_groupKey');
  });

  it('renders temporary Card Layer battle card layout without runtime handlers', () => {
    const html = renderCardGrid([
      {
        skillIndex: 0,
        mapped: true,
        cardAliasApplied: true,
        skill: { name: 'Golpe Pesado I', cost: 6, type: 'DAMAGE', target: 'enemy' },
        card: { id: 'warrior_golpe_de_espada_card', category_visual: 'ataque', icon_key: 'icon_sword' },
        stage: { title: 'Golpe de Espada I', text_child: 'Ataque um inimigo de perto.' },
      },
    ], {
      monster: makeWarrior(),
      canUseSkillNow: () => true,
      tutorialAllows: true,
    });

    expect(html).toContain('data-card-layer-qa-style');
    expect(html).toContain('skill-grid--card-layer');
    expect(html).toContain('card-layer-skill__meta');
    expect(html).toContain('Golpe Pesado I');
    expect(html).toContain('kit swap');
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('useSkillWild');
  });
});
