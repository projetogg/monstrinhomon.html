/**
 * Card Layer — Testes de identidade visual das skills efetivas
 *
 * Cobre o bug reportado no PR #251:
 * - shieldhorn_heavy_strike_ii sem alias → missing_class_or_groupKey
 * - Escudo I sem class/groupKey → missing_class_or_groupKey
 *
 * Garante que a resolução de identidade visual é segura:
 * a skill efetiva original nunca é mutada.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { clearCardCatalogCache, setCardCatalogForTests } from '../js/cards/cardLayer.js';
import { resolveCardSkillIdentity, resolveCardsForMonster } from '../js/cards/cardResolver.js';
import { buildWildSkillGridHtml } from '../js/cards/cardWildPilot.js';
import { renderCardGrid } from '../js/cards/cardRenderer.js';

const ROOT = resolve(import.meta.dirname, '..');
const cardsData = JSON.parse(readFileSync(resolve(ROOT, 'data/cards.json'), 'utf8'));

const DEFAULT_FLAGS = {
  enabled: true,
  pilotClasses: ['Guerreiro'],
  fallbackToSkillUI: true,
  logUnmappedSkills: true,
};

describe('Card Layer — resolução de identidade visual de skills efetivas', () => {
  beforeEach(() => {
    clearCardCatalogCache();
    setCardCatalogForTests(cardsData);
  });

  // ── Teste 1: shieldhorn_heavy_strike continua mapeando corretamente ──────────
  it('shieldhorn_heavy_strike ainda mapeia para Guerreiro + Golpe de Espada + stageIndex 0', () => {
    const skill = { _kitSwapId: 'shieldhorn_heavy_strike', name: 'Golpe Pesado I', type: 'DAMAGE', cost: 6 };
    const identity = resolveCardSkillIdentity(skill);

    expect(identity.class).toBe('Guerreiro');
    expect(identity.groupKey).toBe('Golpe de Espada');
    expect(identity.stageIndex).toBe(0);
    expect(identity._cardLayerAlias).toBe(true);
    expect(identity._cardLayerAliasSource).toBe('shieldhorn_heavy_strike');
  });

  // ── Teste 2: shieldhorn_heavy_strike_ii mapeia para stageIndex 1 ─────────────
  it('shieldhorn_heavy_strike_ii mapeia para Guerreiro + Golpe de Espada + stageIndex 1', () => {
    const skill = { _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', type: 'DAMAGE', cost: 7 };
    const identity = resolveCardSkillIdentity(skill);

    expect(identity.class).toBe('Guerreiro');
    expect(identity.groupKey).toBe('Golpe de Espada');
    expect(identity.stageIndex).toBe(1);
    expect(identity._cardLayerAlias).toBe(true);
    expect(identity._cardLayerAliasSource).toBe('shieldhorn_heavy_strike_ii');
  });

  // ── Teste 3: Golpe Pesado II com _kitSwapId resolve para o card correto ──────
  it('Golpe Pesado II com _kitSwapId: shieldhorn_heavy_strike_ii resolve para warrior_golpe_de_espada_card / GOLPE_DE_ESPADA_1', () => {
    const skill = { _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', type: 'DAMAGE', cost: 7 };
    const entries = resolveCardsForMonster(
      { id: 'mi_cavalheiromon', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].mapped).toBe(true);
    expect(entries[0].card.id).toBe('warrior_golpe_de_espada_card');
    expect(entries[0].stage.source_skill_id).toBe('GOLPE_DE_ESPADA_1');
    expect(entries[0].cardAliasApplied).toBe(true);
  });

  // ── Teste 4: Escudo I sem class e sem groupKey resolve pelo nome ──────────────
  it('Escudo I sem class e sem groupKey resolve para Guerreiro + Escudo + stageIndex 0', () => {
    const skill = { name: 'Escudo I', type: 'BUFF', cost: 4, target: 'self' };
    const identity = resolveCardSkillIdentity(skill);

    expect(identity.class).toBe('Guerreiro');
    expect(identity.groupKey).toBe('Escudo');
    expect(identity.stageIndex).toBe(0);
    expect(identity._visualIdentityInferred).toBe(true);
    expect(identity._visualIdentityReason).toBe('warrior_skill_name_alias');
  });

  it('Escudo I sem class/groupKey resolve para warrior_escudo_card / ESCUDO_0', () => {
    const skill = { name: 'Escudo I', type: 'BUFF', cost: 4, target: 'self' };
    const entries = resolveCardsForMonster(
      { id: 'mi_cavalheiromon', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries).toHaveLength(1);
    expect(entries[0].mapped).toBe(true);
    expect(entries[0].card.id).toBe('warrior_escudo_card');
    expect(entries[0].stage.source_skill_id).toBe('ESCUDO_0');
  });

  // ── Teste 5: a skill efetiva original não é mutada ────────────────────────────
  it('a skill efetiva original não é mutada pelo resolveCardSkillIdentity (kit swap)', () => {
    const original = Object.freeze({ _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', cost: 7 });
    const resolved = resolveCardSkillIdentity(original);

    expect(resolved).not.toBe(original);
    expect(original.class).toBeUndefined();
    expect(original.groupKey).toBeUndefined();
    expect(original.stageIndex).toBeUndefined();
  });

  it('a skill efetiva original não é mutada pelo resolveCardSkillIdentity (inferência por nome)', () => {
    const original = Object.freeze({ name: 'Escudo I', type: 'BUFF', cost: 4 });
    const resolved = resolveCardSkillIdentity(original);

    expect(resolved).not.toBe(original);
    expect(original.class).toBeUndefined();
    expect(original.groupKey).toBeUndefined();
    expect(original.stageIndex).toBeUndefined();
  });

  // ── Teste 6: entry.skill preserva a skill original ────────────────────────────
  it('entry.skill preserva a skill original (kit swap)', () => {
    const skill = { _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', cost: 7 };
    const entries = resolveCardsForMonster(
      { id: 'mi_cavalheiromon', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries[0].skill).toBe(skill);
  });

  it('entry.skill preserva a skill original (inferência por nome)', () => {
    const skill = { name: 'Escudo I', type: 'BUFF', cost: 4 };
    const entries = resolveCardsForMonster(
      { id: 'mi_cavalheiromon', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries[0].skill).toBe(skill);
  });

  // ── Teste 7: entry.lookupSkill contém a identidade visual enriquecida ─────────
  it('entry.lookupSkill contém identidade visual enriquecida (kit swap)', () => {
    const skill = { _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', cost: 7 };
    const entries = resolveCardsForMonster(
      { id: 'mi_cavalheiromon', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries[0].lookupSkill).not.toBe(skill);
    expect(entries[0].lookupSkill.class).toBe('Guerreiro');
    expect(entries[0].lookupSkill.groupKey).toBe('Golpe de Espada');
    expect(entries[0].lookupSkill.stageIndex).toBe(1);
  });

  it('entry.lookupSkill contém identidade visual enriquecida (inferência por nome)', () => {
    const skill = { name: 'Escudo I', type: 'BUFF', cost: 4 };
    const entries = resolveCardsForMonster(
      { id: 'mi_cavalheiromon', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries[0].lookupSkill).not.toBe(skill);
    expect(entries[0].lookupSkill.class).toBe('Guerreiro');
    expect(entries[0].lookupSkill.groupKey).toBe('Escudo');
    expect(entries[0].lookupSkill.stageIndex).toBe(0);
  });

  // ── Teste 8: skill desconhecida sem class/groupKey ainda cai no fallback seguro
  it('skill desconhecida sem class/groupKey e sem mapeamento de nome retorna missing_class_or_groupKey', () => {
    const skill = { name: 'Habilidade Desconhecida', type: 'DAMAGE', cost: 5 };
    const entries = resolveCardsForMonster(
      { id: 'mi_unknown', class: 'Guerreiro' },
      { getMonsterSkills: () => [skill] }
    );

    expect(entries[0].mapped).toBe(false);
    expect(entries[0].reason).toBe('missing_class_or_groupKey');
    expect(entries[0].skill).toBe(skill);
  });

  // ── Teste 9: Guerreiro com Golpe Pesado II + Escudo I produz skillsUi.mode: card-layer ──
  it('Guerreiro com Golpe Pesado II (kitSwap) + Escudo I (sem class) produz mode: card-layer', () => {
    const golpePesadoII = { _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', type: 'DAMAGE', cost: 7, target: 'enemy' };
    const escudoI      = { name: 'Escudo I', type: 'BUFF', cost: 4, target: 'self' };

    const result = buildWildSkillGridHtml(
      { id: 'mi_cavalheiromon', class: 'Guerreiro', hp: 35, ene: 12 },
      {
        flags: DEFAULT_FLAGS,
        catalog: cardsData,
        resolveMonsterSkills: () => [golpePesadoII, escudoI],
        getMonsterSkills: () => [golpePesadoII, escudoI],
        resolveCardsForMonster,
        renderCardGrid,
        canUseSkillNow: () => true,
        tutorialAllows: true,
        logger: { warn: () => {} },
      }
    );

    expect(result.mode).toBe('card-layer');
    expect(result.html).toContain('skill-grid--card-layer');
  });

  // ── Teste 10: HTML da Card Layer não contém onclick nem useSkillWild ──────────
  it('HTML da Card Layer não contém onclick nem useSkillWild para Cavalheiromon', () => {
    const golpePesadoII = { _kitSwapId: 'shieldhorn_heavy_strike_ii', name: 'Golpe Pesado II', type: 'DAMAGE', cost: 7, target: 'enemy' };
    const escudoI      = { name: 'Escudo I', type: 'BUFF', cost: 4, target: 'self' };

    const result = buildWildSkillGridHtml(
      { id: 'mi_cavalheiromon', class: 'Guerreiro', hp: 35, ene: 12 },
      {
        flags: DEFAULT_FLAGS,
        catalog: cardsData,
        resolveMonsterSkills: () => [golpePesadoII, escudoI],
        getMonsterSkills: () => [golpePesadoII, escudoI],
        resolveCardsForMonster,
        renderCardGrid,
        canUseSkillNow: () => true,
        tutorialAllows: true,
        logger: { warn: () => {} },
      }
    );

    expect(result.mode).toBe('card-layer');
    expect(result.html).not.toContain('onclick');
    expect(result.html).not.toContain('useSkillWild');
  });
});
