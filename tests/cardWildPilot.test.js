import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { setCardCatalogForTests, clearCardCatalogCache } from '../js/cards/cardLayer.js';
import { resolveCardsForMonster } from '../js/cards/cardResolver.js';
import { renderCardGrid } from '../js/cards/cardRenderer.js';
import { buildWildSkillGridHtml, wireCardLayerSkillButtons } from '../js/cards/cardWildPilot.js';

const ROOT = resolve(import.meta.dirname, '..');
const cardsData = JSON.parse(readFileSync(resolve(ROOT, 'data/cards.json'), 'utf8'));

function makeWarriorMonster() {
  return { id: 'mi_warrior', class: 'Guerreiro', hp: 30, ene: 10 };
}

function makeWarriorRawSkills() {
  return [
    { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 4, target: 'enemy', type: 'DAMAGE', desc: 'Ataque.' },
    { class: 'Guerreiro', groupKey: 'Escudo', stageIndex: 0, name: 'Escudo I', cost: 4, target: 'self', type: 'BUFF', desc: 'Defesa.' },
    { class: 'Guerreiro', groupKey: 'Provocar', stageIndex: 0, name: 'Provocar I', cost: 4, target: 'enemy', type: 'TAUNT', desc: 'Controle.' },
  ];
}

describe('Card Layer Fase 1C — piloto visual no Wild Loop', () => {
  beforeEach(() => {
    clearCardCatalogCache();
    setCardCatalogForTests(cardsData);
  });

  it('flag desligada mantém UI legada funcionalmente equivalente', () => {
    const result = buildWildSkillGridHtml(makeWarriorMonster(), {
      flags: { enabled: false, pilotClasses: ['Guerreiro'], fallbackToSkillUI: true, logUnmappedSkills: true },
      catalog: cardsData,
      resolveMonsterSkills: () => ([
        { name: 'Golpe de Espada I', cost: 4, target: 'enemy', type: 'DAMAGE', desc: 'Ataque' },
      ]),
      getMonsterSkills: () => makeWarriorRawSkills(),
      resolveCardsForMonster,
      renderCardGrid,
      canUseSkillNow: () => true,
      tutorialAllows: true,
      logger: { warn: () => {} },
    });

    expect(result.mode).toBe('legacy');
    expect(result.html).toContain('<div class="skill-grid">');
    expect(result.html).toContain('onclick="useSkillWild(0)"');
  });

  it('flag ligada + Guerreiro + mapeamento completo renderiza Card Layer', () => {
    const rawSkills = makeWarriorRawSkills();
    const result = buildWildSkillGridHtml(makeWarriorMonster(), {
      flags: { enabled: true, pilotClasses: ['Guerreiro'], fallbackToSkillUI: true, logUnmappedSkills: true },
      catalog: cardsData,
      resolveMonsterSkills: () => rawSkills,
      getMonsterSkills: () => rawSkills,
      resolveCardsForMonster,
      renderCardGrid,
      canUseSkillNow: () => true,
      tutorialAllows: true,
      logger: { warn: () => {} },
    });

    expect(result.mode).toBe('card-layer');
    expect(result.html).toContain('skill-grid--card-layer');
    expect(result.html).toContain('data-skill-index="0"');
    expect(result.html).toContain('data-skill-index="1"');
    expect(result.html).toContain('data-skill-index="2"');
    expect(result.html).not.toContain('onclick');
    expect(result.html).not.toContain('useSkillWild');
  });

  it('classe não piloto permanece em UI legada', () => {
    const result = buildWildSkillGridHtml({ id: 'mi_mage', class: 'Mago', hp: 20, ene: 9 }, {
      flags: { enabled: true, pilotClasses: ['Guerreiro'], fallbackToSkillUI: true, logUnmappedSkills: true },
      catalog: cardsData,
      resolveMonsterSkills: () => ([
        { name: 'Magia Elemental I', cost: 4, target: 'enemy', type: 'DAMAGE', desc: 'Magia' },
      ]),
      getMonsterSkills: () => ([
        { class: 'Mago', groupKey: 'Magia Elemental', stageIndex: 0, name: 'Magia Elemental I', cost: 4, target: 'enemy', type: 'DAMAGE', desc: 'Magia' },
      ]),
      resolveCardsForMonster,
      renderCardGrid,
      canUseSkillNow: () => true,
      tutorialAllows: true,
      logger: { warn: () => {} },
    });

    expect(result.mode).toBe('legacy');
    expect(result.html).toContain('onclick="useSkillWild(0)"');
  });

  it('mapeamento parcial cai para UI legada quando fallbackToSkillUI=true', () => {
    const rawSkills = [
      { class: 'Guerreiro', groupKey: 'Golpe de Espada', stageIndex: 0, name: 'Golpe de Espada I', cost: 4, target: 'enemy', type: 'DAMAGE', desc: 'Ataque.' },
      { class: 'Guerreiro', groupKey: 'Habilidade Sem Card', stageIndex: 0, name: 'Sem Card', cost: 3, target: 'enemy', type: 'DAMAGE', desc: 'Sem mapeamento.' },
    ];

    const result = buildWildSkillGridHtml(makeWarriorMonster(), {
      flags: { enabled: true, pilotClasses: ['Guerreiro'], fallbackToSkillUI: true, logUnmappedSkills: true },
      catalog: cardsData,
      resolveMonsterSkills: () => rawSkills,
      getMonsterSkills: () => rawSkills,
      resolveCardsForMonster,
      renderCardGrid,
      canUseSkillNow: () => true,
      tutorialAllows: true,
      logger: { warn: () => {} },
    });

    expect(result.mode).toBe('legacy');
    expect(result.reason).toBe('unmapped_skills_fallback');
    expect(result.html).toContain('onclick="useSkillWild(0)"');
    expect(result.html).toContain('onclick="useSkillWild(1)"');
  });

  it('wiring do card chama callback com o índice original (useSkillWild index)', () => {
    const listeners = {};
    const fakeButton = {
      dataset: { skillIndex: '2' },
      addEventListener: (eventName, handler) => {
        listeners[eventName] = handler;
      },
    };
    const root = {
      querySelectorAll: () => [fakeButton],
    };
    const calls = [];

    const wiredCount = wireCardLayerSkillButtons(root, (skillIndex) => calls.push(skillIndex));
    expect(wiredCount).toBe(1);
    expect(fakeButton.dataset.cardLayerBound).toBe('true');
    expect(typeof listeners.click).toBe('function');
    listeners.click();
    expect(calls).toEqual([2]);

    const wiredAgain = wireCardLayerSkillButtons(root, (skillIndex) => calls.push(skillIndex));
    expect(wiredAgain).toBe(0);
    listeners.click();
    expect(calls).toEqual([2, 2]);
  });
});
