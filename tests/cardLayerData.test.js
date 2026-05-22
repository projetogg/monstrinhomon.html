import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const cardsData = JSON.parse(readFileSync(resolve(ROOT, 'data/cards.json'), 'utf8'));
const skillsData = JSON.parse(readFileSync(resolve(ROOT, 'data/skills.json'), 'utf8'));

const EXPECTED_GROUP_KEYS = ['Golpe de Espada', 'Escudo', 'Provocar'];
const EXPECTED_CARD_IDS = [
  'warrior_golpe_de_espada_card',
  'warrior_escudo_card',
  'warrior_provocar_card',
];

const ALLOWED_VISUAL_CATEGORIES = [
  'ataque',
  'defesa',
  'suporte',
  'movimento',
  'preparacao',
  'utilidade',
  'controle',
  'cura',
];

const FORBIDDEN_FIELDS = [
  'power',
  'pwr',
  'damage',
  'energy_cost',
  'cost',
  'ene_cost',
  'accuracy',
  'precision',
  'hit_rate',
  'target',
  'alvo',
  'duration',
  'effect',
  'effect_summary',
  'status_effect',
  'range',
  'alcance',
];

function listForbiddenFields(obj, prefix = '') {
  const found = [];
  if (!obj || typeof obj !== 'object') return found;

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (FORBIDDEN_FIELDS.includes(key)) {
      found.push(currentPath);
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      found.push(...listForbiddenFields(value, currentPath));
    }
  }

  return found;
}

describe('Card Layer Fase 1A — contrato de dados canônico do Guerreiro', () => {
  it('cards.json é JSON válido e contém version', () => {
    expect(cardsData).toBeTruthy();
    expect(typeof cardsData.version).toBe('string');
    expect(cardsData.version).toBe('0.1.2');
    expect(Array.isArray(cardsData.cards)).toBe(true);
  });

  it('contém exatamente 3 cards, IDs únicos e os IDs esperados', () => {
    expect(cardsData.cards).toHaveLength(3);

    const ids = cardsData.cards.map(card => card.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual([...EXPECTED_CARD_IDS].sort());
  });

  it('todos os cards são da classe Guerreiro e groupKeys canônicas', () => {
    for (const card of cardsData.cards) {
      expect(card.class).toBe('Guerreiro');
      expect(EXPECTED_GROUP_KEYS.includes(card.groupKey)).toBe(true);
    }
  });

  it('slots são somente 1, 2 ou 3 e não existe slot 4', () => {
    const slots = cardsData.cards.map(card => card.display_slot).sort((a, b) => a - b);
    expect(slots).toEqual([1, 2, 3]);
    expect(slots.includes(4)).toBe(false);
  });

  it('category_visual pertence ao enum permitido e fallback/art_ref existem', () => {
    for (const card of cardsData.cards) {
      expect(ALLOWED_VISUAL_CATEGORIES.includes(card.category_visual)).toBe(true);
      expect(typeof card.fallback_art_ref).toBe('string');
      expect(card.fallback_art_ref.length).toBeGreaterThan(0);

      for (const stage of Object.values(card.stages)) {
        expect(typeof stage.art_ref).toBe('string');
        expect(stage.art_ref.length).toBeGreaterThan(0);
      }
    }
  });

  it('default_stageIndex existe dentro de stages e há stages 0,1,2 para cada card', () => {
    for (const card of cardsData.cards) {
      const stageKeys = Object.keys(card.stages);
      expect(stageKeys.sort()).toEqual(['0', '1', '2']);
      expect(card.stages[String(card.default_stageIndex)]).toBeTruthy();
    }
  });

  it('cada source_skill_id existe em data/skills.json e bate class/groupKey/stageIndex/tier', () => {
    const skillsById = new Map(skillsData.skills.map(skill => [skill.id, skill]));

    for (const card of cardsData.cards) {
      for (const stage of Object.values(card.stages)) {
        const skill = skillsById.get(stage.source_skill_id);

        expect(skill, `Skill ausente: ${stage.source_skill_id}`).toBeTruthy();
        expect(skill.class).toBe(card.class);
        expect(skill.groupKey).toBe(card.groupKey);
        expect(skill.stageIndex).toBe(stage.runtime_stageIndex);
        expect(skill.tier).toBe(stage.runtime_tier);
      }
    }
  });

  it('text_child respeita limite infantil (<= 140) e text_technical aponta para skill real', () => {
    for (const card of cardsData.cards) {
      for (const stage of Object.values(card.stages)) {
        expect(stage.text_child.length).toBeLessThanOrEqual(140);
        expect(stage.text_technical).toBe(`Mecânica em data/skills.json#${stage.source_skill_id}.`);
      }
    }
  });

  it('não existe card de outra classe e nenhum campo mecânico proibido em card/stage', () => {
    const forbiddenPaths = listForbiddenFields(cardsData);
    expect(forbiddenPaths).toEqual([]);

    const classes = new Set(cardsData.cards.map(card => card.class));
    expect(Array.from(classes)).toEqual(['Guerreiro']);
  });
});
