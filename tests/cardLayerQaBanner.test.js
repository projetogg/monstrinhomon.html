/**
 * CARD LAYER URL QA BANNER TESTS
 *
 * Testes para o banner de QA independente da Card Layer.
 * Cobertura: shouldShowUrlQaBanner, buildCardLayerUrlQaBanner
 * Inclui cobertura explícita dos gatilhos por query param (cardLayerPilot=1/true).
 */

import { describe, it, expect } from 'vitest';
import {
    shouldShowUrlQaBanner,
    buildCardLayerUrlQaBanner,
} from '../js/cards/cardLayerQaBanner.js';

const BASE_FLAGS = Object.freeze({
    enabled: false,
    pilotClasses: ['Guerreiro'],
    fallbackToSkillUI: true,
    logUnmappedSkills: true,
});

function makeWarrior() {
    return { id: 'mi_ferrozimon', name: 'Ferrozimon', class: 'Guerreiro', hp: 30, ene: 10 };
}

function makeSkills() {
    return [
        { name: 'Golpe Pesado I', _kitSwapId: 'shieldhorn_heavy_strike', cost: 6, type: 'DAMAGE', target: 'enemy' },
        { name: 'Escudo I', cost: 4, type: 'BUFF', target: 'self' },
        { name: 'Provocar I', cost: 4, type: 'TAUNT', target: 'enemy' },
    ];
}

describe('Card Layer URL QA Banner', () => {

    describe('shouldShowUrlQaBanner', () => {
        it('retorna false sem cardLayerPilot na URL', () => {
            expect(shouldShowUrlQaBanner('')).toBe(false);
            expect(shouldShowUrlQaBanner('?v=123')).toBe(false);
            expect(shouldShowUrlQaBanner('?cardLayerPilot=0')).toBe(false);
            expect(shouldShowUrlQaBanner('?cardLayerPilot=false')).toBe(false);
        });

        it('retorna true com ?cardLayerPilot=1', () => {
            expect(shouldShowUrlQaBanner('?cardLayerPilot=1')).toBe(true);
        });

        it('retorna true com ?cardLayerPilot=true', () => {
            expect(shouldShowUrlQaBanner('?cardLayerPilot=true')).toBe(true);
        });
    });

    describe('buildCardLayerUrlQaBanner', () => {
        it('1. Sem cardLayerPilot, o banner não aparece', () => {
            const html = buildCardLayerUrlQaBanner({ search: '' });
            expect(html).toBe('');
        });

        it('2. Com ?cardLayerPilot=1, o banner aparece', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).toContain('card-layer-url-qa-banner');
            expect(html).toContain('Card Layer URL QA');
        });

        it('3. Com ?cardLayerPilot=true, o banner aparece', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=true',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).toContain('card-layer-url-qa-banner');
        });

        it('4. O banner mostra search', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1&v=qa-test',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'unmapped_skills_fallback' },
            });
            expect(html).toContain('?cardLayerPilot=1&amp;v=qa-test');
        });

        it('5. O banner mostra flagEnabled', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'catalog_unavailable' },
            });
            expect(html).toContain('flagEnabled: true');
        });

        it('6. O banner mostra catalogLoaded', () => {
            const htmlWithCatalog = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                catalog: { cards: [{ id: 'c1' }] },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'card-layer', reason: null },
            });
            expect(htmlWithCatalog).toContain('catalogLoaded: true');

            const htmlNoCatalog = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                catalog: null,
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'catalog_unavailable' },
            });
            expect(htmlNoCatalog).toContain('catalogLoaded: false');
        });

        it('7. O banner mostra skillsUi.mode', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'card-layer', reason: null },
            });
            expect(html).toContain('skillsUi.mode: card-layer');
        });

        it('8. O banner mostra skillsUi.reason', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'unmapped_skills_fallback' },
            });
            expect(html).toContain('skillsUi.reason: unmapped_skills_fallback');
        });

        it('9. O banner mostra nomes das skills efetivas', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).toContain('Golpe Pesado I');
            expect(html).toContain('Escudo I');
            expect(html).toContain('Provocar I');
        });

        it('10. O banner mostra _kitSwapId quando existir', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).toContain('shieldhorn_heavy_strike');
        });

        it('11. O banner não contém onclick', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).not.toContain('onclick');
        });

        it('12. O banner não chama runtime de combate', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'card-layer', reason: null },
            });
            expect(html).not.toContain('useSkillWild');
            expect(html).not.toContain('executeWildAttack');
            expect(html).not.toContain('executeBasicCardAction');
        });

        it('mostra baseFlagEnabled corretamente', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: { ...BASE_FLAGS, enabled: false },
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).toContain('baseFlagEnabled: false');
            expect(html).toContain('flagEnabled: true');
        });

        it('mostra effectiveClass do monstrinho', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'legacy', reason: 'pilot_disabled' },
            });
            expect(html).toContain('effectiveClass: Guerreiro');
        });

        it('mostra "indisponível" quando dados estão ausentes', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: {},
                effectiveFlags: {},
                catalog: null,
                playerMonster: null,
                skills: [],
                skillsUi: {},
            });
            expect(html).toContain('card-layer-url-qa-banner');
            expect(html).toContain('indisponível');
            expect(html).not.toContain('undefined');
            expect(html).not.toContain('null');
        });

        it('mostra cardsResolved como "sim" quando mode é card-layer', () => {
            const html = buildCardLayerUrlQaBanner({
                search: '?cardLayerPilot=1',
                baseFlags: BASE_FLAGS,
                effectiveFlags: { ...BASE_FLAGS, enabled: true },
                catalog: { cards: [{ id: 'c1' }] },
                playerMonster: makeWarrior(),
                skills: makeSkills(),
                skillsUi: { mode: 'card-layer', reason: null },
            });
            expect(html).toContain('cardsResolved: sim');
        });
    });
});
