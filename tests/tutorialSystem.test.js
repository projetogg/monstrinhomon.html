/**
 * TUTORIAL SYSTEM TESTS (FASE Y)
 *
 * Testa as funções puras do módulo tutorialSystem.js.
 * Cobertura: ensureTutorialState, getTutorialStep, tutorialAllows,
 *            advanceTutorial, buildTutorialEnemyData
 */

import { describe, it, expect } from 'vitest';
import {
    DEFAULT_TUTORIAL_STATE,
    ensureTutorialState,
    getTutorialStep,
    tutorialAllows,
    advanceTutorial,
    buildTutorialEnemyData,
} from '../js/tutorial/tutorialSystem.js';

// ─── Dados de apoio ───────────────────────────────────────────────────────────

const STEPS = [
    {
        id: 'tut_attack',
        title: 'Ataque',
        required: { attack: 2 },
        lock: { attack: true, skill: false, capture: false },
    },
    {
        id: 'tut_skill',
        title: 'Habilidades',
        required: { skill: 1 },
        lock: { attack: true, skill: true, capture: false },
    },
    {
        id: 'tut_capture',
        title: 'Captura',
        required: { capture: 1 },
        lock: { attack: true, skill: true, capture: true },
    },
];

const activeTut = (stepIndex = 0, done = {}) => ({ active: true, stepIndex, done });

// ─── DEFAULT_TUTORIAL_STATE ───────────────────────────────────────────────────

describe('DEFAULT_TUTORIAL_STATE', () => {
    it('tem active false por padrão', () => {
        expect(DEFAULT_TUTORIAL_STATE.active).toBe(false);
    });

    it('tem stepIndex 0 por padrão', () => {
        expect(DEFAULT_TUTORIAL_STATE.stepIndex).toBe(0);
    });

    it('tem done como objeto vazio', () => {
        expect(DEFAULT_TUTORIAL_STATE.done).toEqual({});
    });
});

// ─── ensureTutorialState ──────────────────────────────────────────────────────

describe('ensureTutorialState', () => {
    it('retorna estado padrão para null', () => {
        const s = ensureTutorialState(null);
        expect(s.active).toBe(false);
        expect(s.stepIndex).toBe(0);
        expect(s.done).toEqual({});
    });

    it('retorna estado padrão para undefined', () => {
        const s = ensureTutorialState(undefined);
        expect(s.active).toBe(false);
    });

    it('retorna estado padrão para não-objeto', () => {
        expect(ensureTutorialState('invalid').active).toBe(false);
        expect(ensureTutorialState(42).active).toBe(false);
    });

    it('preserva estado válido', () => {
        const input = { active: true, stepIndex: 1, done: { attack: 2 } };
        const s = ensureTutorialState(input);
        expect(s.active).toBe(true);
        expect(s.stepIndex).toBe(1);
        expect(s.done).toEqual({ attack: 2 });
    });

    it('adiciona done quando ausente', () => {
        const s = ensureTutorialState({ active: true, stepIndex: 0 });
        expect(s.done).toEqual({});
    });

    it('não muta o objeto de entrada', () => {
        const input = { active: true, stepIndex: 0 };
        ensureTutorialState(input);
        expect('done' in input).toBe(false); // original não foi mutado
    });
});

// ─── getTutorialStep ──────────────────────────────────────────────────────────

describe('getTutorialStep', () => {
    it('retorna null quando tutorial inativo', () => {
        const tut = { active: false, stepIndex: 0, done: {} };
        expect(getTutorialStep(tut, STEPS)).toBeNull();
    });

    it('retorna null quando steps não é array', () => {
        expect(getTutorialStep(activeTut(), null)).toBeNull();
        expect(getTutorialStep(activeTut(), undefined)).toBeNull();
    });

    it('retorna o step correto pelo índice', () => {
        expect(getTutorialStep(activeTut(0), STEPS)).toBe(STEPS[0]);
        expect(getTutorialStep(activeTut(1), STEPS)).toBe(STEPS[1]);
        expect(getTutorialStep(activeTut(2), STEPS)).toBe(STEPS[2]);
    });

    it('retorna null para índice fora do array', () => {
        expect(getTutorialStep(activeTut(99), STEPS)).toBeNull();
    });
});

// ─── tutorialAllows ───────────────────────────────────────────────────────────

describe('tutorialAllows', () => {
    it('permite tudo quando tutorial está inativo', () => {
        const tut = { active: false, stepIndex: 0, done: {} };
        expect(tutorialAllows(tut, STEPS, 'attack')).toBe(true);
        expect(tutorialAllows(tut, STEPS, 'capture')).toBe(true);
    });

    it('bloqueia skill no step de ataque', () => {
        // Step 0 lock: { attack:true, skill:false, capture:false }
        expect(tutorialAllows(activeTut(0), STEPS, 'skill')).toBe(false);
    });

    it('permite attack no step de ataque', () => {
        expect(tutorialAllows(activeTut(0), STEPS, 'attack')).toBe(true);
    });

    it('permite ação não definida no lock', () => {
        // 'pass' não está no lock do step 0
        expect(tutorialAllows(activeTut(0), STEPS, 'pass')).toBe(true);
    });

    it('permite skill no step de skill', () => {
        expect(tutorialAllows(activeTut(1), STEPS, 'skill')).toBe(true);
    });

    it('bloqueia capture no step de skill', () => {
        expect(tutorialAllows(activeTut(1), STEPS, 'capture')).toBe(false);
    });
});

// ─── advanceTutorial ──────────────────────────────────────────────────────────

describe('advanceTutorial', () => {
    it('não muda nada quando tutorial está inativo', () => {
        const tut = { active: false, stepIndex: 0, done: {} };
        const r = advanceTutorial(tut, STEPS, 'attack');
        expect(r.changed).toBe(false);
    });

    it('registra ação sem completar o step', () => {
        const tut = activeTut(0, {});
        // Step 0 requer attack: 2 — mandamos só 1
        const r = advanceTutorial(tut, STEPS, 'attack');
        expect(r.changed).toBe(true);
        expect(r.completed).toBe(false);
        expect(r.tutState.done.attack).toBe(1);
    });

    it('completa o step ao atingir requisito', () => {
        const tut = activeTut(0, { attack: 1 }); // falta 1
        const r = advanceTutorial(tut, STEPS, 'attack');
        expect(r.changed).toBe(true);
        expect(r.completed).toBe(true);
        expect(r.finished).toBe(false);
    });

    it('avança para o próximo step ao completar', () => {
        const tut = activeTut(0, { attack: 1 });
        const r = advanceTutorial(tut, STEPS, 'attack');
        expect(r.nextStepIndex).toBe(1);
        expect(r.tutState.stepIndex).toBe(1);
        expect(r.tutState.done).toEqual({}); // done reseta
    });

    it('marca finished ao completar o último step', () => {
        const tut = activeTut(2, { capture: 0 }); // step 2 é o último
        const r = advanceTutorial(tut, STEPS, 'capture');
        expect(r.completed).toBe(true);
        expect(r.finished).toBe(true);
        expect(r.tutState.active).toBe(false);
    });

    it('não muta o objeto de estado de entrada', () => {
        const tut = activeTut(0, { attack: 1 });
        const originalDone = { ...tut.done };
        advanceTutorial(tut, STEPS, 'attack');
        expect(tut.done).toEqual(originalDone); // não foi mutado
    });

    it('contadores são acumulativos em chamadas sucessivas', () => {
        let state = activeTut(0, {});
        state = advanceTutorial(state, STEPS, 'attack').tutState;
        expect(state.done.attack).toBe(1);
        // Segunda chamada deve completar
        const r = advanceTutorial(state, STEPS, 'attack');
        expect(r.completed).toBe(true);
    });
});

// ─── buildTutorialEnemyData ───────────────────────────────────────────────────

describe('buildTutorialEnemyData', () => {
    it('retorna objeto com campos necessários', () => {
        const e = buildTutorialEnemyData(1);
        expect(e).toHaveProperty('name', 'Treinomon');
        expect(e).toHaveProperty('level');
        expect(e).toHaveProperty('hpMax');
        expect(e).toHaveProperty('hp');
        expect(e).toHaveProperty('atk');
        expect(e).toHaveProperty('def');
        expect(e).toHaveProperty('spd');
        expect(e).toHaveProperty('ene');
        expect(e).toHaveProperty('eneMax');
        expect(e).toHaveProperty('class', 'Guerreiro');
        expect(e).toHaveProperty('rarity', 'Comum');
        expect(e).toHaveProperty('emoji', '🐾');
        expect(e).toHaveProperty('poder');
    });

    it('hp e hpMax iguais ao criar', () => {
        const e = buildTutorialEnemyData(3);
        expect(e.hp).toBe(e.hpMax);
    });

    it('escala com o nível', () => {
        const e1 = buildTutorialEnemyData(1);
        const e5 = buildTutorialEnemyData(5);
        expect(e5.hpMax).toBeGreaterThan(e1.hpMax);
        expect(e5.atk).toBeGreaterThan(e1.atk);
    });

    it('formula do HP: 25 + level*5', () => {
        expect(buildTutorialEnemyData(1).hpMax).toBe(30);
        expect(buildTutorialEnemyData(3).hpMax).toBe(40);
        expect(buildTutorialEnemyData(10).hpMax).toBe(75);
    });

    it('nível mínimo é 1 para inputs inválidos', () => {
        const e = buildTutorialEnemyData(0);
        expect(e.level).toBe(1);
    });

    it('aceita nível alto sem erro', () => {
        const e = buildTutorialEnemyData(100);
        expect(e.level).toBe(100);
        expect(e.hpMax).toBe(525);
    });
});
