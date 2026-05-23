import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  findCardForSkill,
  setCardCatalogForTests,
  clearCardCatalogCache,
} from '../js/cards/cardLayer.js';
import { resolveCardsForMonster } from '../js/cards/cardResolver.js';
import { renderCardGrid, buildCardViewModel } from '../js/cards/cardRenderer.js';
import { CARD_LAYER_FEATURE_FLAGS } from '../js/cards/cardFeatureFlags.js';

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

  // ── Feature Flags ──────────────────────────────────────────────────────────

  it('CARD_LAYER_FEATURE_FLAGS tem enabled: false por padrão', () => {
    expect(CARD_LAYER_FEATURE_FLAGS.enabled).toBe(false);
    expect(Array.isArray(CARD_LAYER_FEATURE_FLAGS.pilotClasses)).toBe(true);
    expect(CARD_LAYER_FEATURE_FLAGS.pilotClasses).toContain('Guerreiro');
    expect(CARD_LAYER_FEATURE_FLAGS.fallbackToSkillUI).toBe(true);
    expect(CARD_LAYER_FEATURE_FLAGS.logUnmappedSkills).toBe(true);
    expect(CARD_LAYER_FEATURE_FLAGS.devShowMissingSlots).toBe(false);
  });

  // ── cardLayer ──────────────────────────────────────────────────────────────

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

  // ── cardResolver ───────────────────────────────────────────────────────────

  it('resolveCardsForMonster usa getMonsterSkills por injeção e não chama runtime', () => {
    let calledWith = null;
    const entries = resolveCardsForMonster(
      { id: 'mi_test', class: 'Guerreiro' },
      {
        getMonsterSkills: (mon) => {
          calledWith = mon;
          return [
            { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I' },
            { class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 2, name: 'Escudo III' },
            { class: 'Mago', groupKey: 'Inexistente', stageIndex: 0, name: 'Sem Card' },
          ];
        },
      }
    );

    expect(calledWith?.id).toBe('mi_test');
    expect(entries).toHaveLength(3);
    expect(entries[0].skillIndex).toBe(0);
    expect(entries[0].mapped).toBe(true);
    expect(entries[1].skillIndex).toBe(1);
    expect(entries[1].stage?.source_skill_id).toBe('ESCUDO_2');
    expect(entries[2].mapped).toBe(false);
    expect(entries[2].reason).toBe('unmapped_class_group');
  });

  it('resolveCardsForMonster retorna [] quando getMonsterSkills não é injetado', () => {
    const entries = resolveCardsForMonster({ id: 'mi_test' }, {});
    expect(entries).toEqual([]);
  });

  // ── cardRenderer — visual-only puro ───────────────────────────────────────

  it('renderCardGrid NÃO contém onclick nem useSkillWild (visual-only puro)', () => {
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
    expect(html).toContain('Golpe de Espada I');
    expect(html).toContain('Escudo I');
    // Garantia de visual-only: sem handler executável
    expect(html).not.toContain('onclick');
    expect(html).not.toContain('useSkillWild');
  });

  it('renderCardGrid emite data-skill-index para wiring futuro (Fase 1C)', () => {
    const entries = resolveCardsForMonster(
      { id: 'mi_warrior' },
      {
        getMonsterSkills: () => ([
          { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 1, target: 'enemy', type: 'DAMAGE' },
        ]),
      }
    ).filter(entry => entry.mapped);

    const html = renderCardGrid(entries, { monster: { hp: 20, ene: 10 } });

    expect(html).toContain('data-skill-index="0"');
    expect(html).toContain('data-card-id="warrior_golpe_de_espada_card"');
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

  it('buildCardViewModel retorna view model puro sem HTML (sem onclick)', () => {
    const entries = resolveCardsForMonster(
      { id: 'mi_warrior' },
      {
        getMonsterSkills: () => ([
          { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 2, target: 'enemy', type: 'DAMAGE' },
        ]),
      }
    ).filter(entry => entry.mapped);

    const vm = buildCardViewModel(entries[0], { monster: { hp: 20, ene: 5 }, tutorialAllows: true, canUseSkillNow: () => true });

    expect(typeof vm).toBe('object');
    expect(vm.skillIndex).toBe(0);
    expect(vm.cardId).toBe('warrior_golpe_de_espada_card');
    expect(vm.disabled).toBe(false);
    expect(vm.stageTitle).toBeTruthy();
    // view model não é HTML — sem markup
    expect(typeof vm.stageTitle).toBe('string');
    expect(vm.stageTitle).not.toContain('<');
  });
});
