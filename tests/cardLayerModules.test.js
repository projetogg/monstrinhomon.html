import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  findCardForSkill,
  setCardCatalogForTests,
  clearCardCatalogCache,
} from '../js/cards/cardLayer.js';
import { resolveCardsForMonster } from '../js/cards/cardResolver.js';
import { renderCardGrid } from '../js/cards/cardRenderer.js';

const ROOT = resolve(import.meta.dirname, '..');
const cardsData = JSON.parse(readFileSync(resolve(ROOT, 'data/cards.json'), 'utf8'));

function getSkillButtonTag(html, skillIndex) {
  const match = String(html || '').match(new RegExp(`<button[^>]*data-skill-index="${skillIndex}"[^>]*>`));
  return match ? match[0] : '';
}

describe('Card Layer Fase 1B — módulos visuais puros', () => {
  beforeEach(() => {
    clearCardCatalogCache();
    setCardCatalogForTests(cardsData);
  });

  it('findCardForSkill resolve card/stage por class + groupKey + stageIndex', () => {
    const result = findCardForSkill({
      class: 'Guerreiro',
      groupKey: 'Escudo',
      stageIndex: 1,
    });

    expect(result.card?.id).toBe('warrior_escudo_card');
    expect(result.stage?.source_skill_id).toBe('ESCUDO_1');
    expect(result.usedDefaultStage).toBe(false);
  });

  it('findCardForSkill aplica fallback para default_stageIndex quando stage não existe', () => {
    const result = findCardForSkill({
      class: 'Guerreiro',
      groupKey: 'Provocar',
      stageIndex: 999,
    });

    expect(result.card?.id).toBe('warrior_provocar_card');
    expect(result.stage?.source_skill_id).toBe('PROVOCAR_0');
    expect(result.usedDefaultStage).toBe(true);
    expect(result.reason).toBe('missing_stage_fallback_to_default');
  });

  it('resolveCardsForMonster preserva skillIndex e status de mapeamento', () => {
    const entries = resolveCardsForMonster(
      { id: 'mi_test' },
      {
        getMonsterSkills: () => ([
          { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I' },
          { class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 2, name: 'Escudo III' },
          { class: 'Mago', groupKey: 'Inexistente', stageIndex: 0, name: 'Sem Card' },
        ]),
      }
    );

    expect(entries).toHaveLength(3);
    expect(entries[0].skillIndex).toBe(0);
    expect(entries[0].mapped).toBe(true);
    expect(entries[1].skillIndex).toBe(1);
    expect(entries[1].stage?.source_skill_id).toBe('ESCUDO_2');
    expect(entries[2].mapped).toBe(false);
    expect(entries[2].reason).toBe('unmapped_class_group');
  });

  it('renderCardGrid gera botões visuais sem tocar mecânica', () => {
    const entries = resolveCardsForMonster(
      { id: 'mi_warrior' },
      {
        getMonsterSkills: () => ([
          { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 2, target: 'enemy', type: 'DAMAGE' },
          { class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 0, name: 'Escudo I', cost: 3, target: 'self', type: 'BUFF' },
        ]),
      }
    ).filter(entry => entry.mapped);

    const html = renderCardGrid(entries, {
      monster: { hp: 20, ene: 2 },
      tutorialAllows: true,
      canUseSkillNow: (skill) => Number(skill.cost || 0) <= 2,
    });

    expect(html).toContain('skill-grid--card-layer');
    expect(html).toContain('onclick="useSkillWild(0)"');
    expect(html).toContain('Golpe de Espada I');
    expect(html).toContain('Escudo I');
    const firstSkillBtn = getSkillButtonTag(html, 0);
    const secondSkillBtn = getSkillButtonTag(html, 1);
    expect(firstSkillBtn).toContain('onclick="useSkillWild(0)"');
    expect(firstSkillBtn.includes('disabled')).toBe(false);
    expect(secondSkillBtn.includes('disabled')).toBe(true);
  });

  it('renderCardGrid desabilita botões quando tutorial está bloqueado', () => {
    const entries = resolveCardsForMonster(
      { id: 'mi_warrior' },
      {
        getMonsterSkills: () => ([
          { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 1, target: 'enemy', type: 'DAMAGE' },
        ]),
      }
    ).filter(entry => entry.mapped);

    const html = renderCardGrid(entries, {
      monster: { hp: 20, ene: 10 },
      tutorialAllows: false,
      canUseSkillNow: () => true,
    });

    const firstSkillBtn = getSkillButtonTag(html, 0);
    expect(firstSkillBtn.includes('disabled')).toBe(true);
    expect(html).toContain('Tutorial: ainda não liberado');
  });

  it('renderCardGrid respeita canUseSkillNow false para todas as skills', () => {
    const entries = resolveCardsForMonster(
      { id: 'mi_warrior' },
      {
        getMonsterSkills: () => ([
          { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 1, target: 'enemy', type: 'DAMAGE' },
          { class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 0, name: 'Escudo I', cost: 1, target: 'self', type: 'BUFF' },
        ]),
      }
    ).filter(entry => entry.mapped);

    const html = renderCardGrid(entries, {
      monster: { hp: 20, ene: 10 },
      tutorialAllows: true,
      canUseSkillNow: () => false,
    });

    const firstSkillBtn = getSkillButtonTag(html, 0);
    const secondSkillBtn = getSkillButtonTag(html, 1);
    expect(firstSkillBtn.includes('disabled')).toBe(true);
    expect(secondSkillBtn.includes('disabled')).toBe(true);
  });
});
