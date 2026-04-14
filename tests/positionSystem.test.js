/**
 * POSITION SYSTEM TESTS
 *
 * Testa: canReach, getDefensiveBonus, lineHasAlive, filterReachableTargets,
 *        assignDefaultPositions, suggestPosition
 */
import { describe, it, expect } from 'vitest';
import {
    POSITION,
    RANGE_BY_CLASS,
    POSITION_DEF_BONUS,
    suggestPosition,
    canReach,
    getDefensiveBonus,
    lineHasAlive,
    assignDefaultPositions,
    filterReachableTargets,
} from '../js/combat/positionSystem.js';

describe('positionSystem - suggestPosition', () => {
    it('deve sugerir frente para Guerreiro', () => {
        expect(suggestPosition('Guerreiro')).toBe(POSITION.FRONT);
    });
    it('deve sugerir frente para Bárbaro', () => {
        expect(suggestPosition('Bárbaro')).toBe(POSITION.FRONT);
    });
    it('deve sugerir trás para Mago', () => {
        expect(suggestPosition('Mago')).toBe(POSITION.BACK);
    });
    it('deve sugerir trás para Curandeiro', () => {
        expect(suggestPosition('Curandeiro')).toBe(POSITION.BACK);
    });
    it('deve sugerir meio para Ladino', () => {
        expect(suggestPosition('Ladino')).toBe(POSITION.MID);
    });
    it('deve sugerir meio para Animalista', () => {
        expect(suggestPosition('Animalista')).toBe(POSITION.MID);
    });
});

describe('positionSystem - canReach', () => {
    it('alcance 1 (curto): só pode atingir frente', () => {
        expect(canReach(1, 'front', 'front')).toBe(true);
        expect(canReach(1, 'front', 'mid')).toBe(false);
        expect(canReach(1, 'front', 'back')).toBe(false);
    });
    it('alcance 2 (médio): pode atingir frente e meio', () => {
        expect(canReach(2, 'front', 'front')).toBe(true);
        expect(canReach(2, 'front', 'mid')).toBe(true);
        expect(canReach(2, 'front', 'back')).toBe(false);
    });
    it('alcance 3 (longo): pode atingir qualquer posição', () => {
        expect(canReach(3, 'back', 'front')).toBe(true);
        expect(canReach(3, 'back', 'mid')).toBe(true);
        expect(canReach(3, 'back', 'back')).toBe(true);
    });
});

describe('positionSystem - getDefensiveBonus', () => {
    it('frente sempre tem bônus 0', () => {
        expect(getDefensiveBonus('front', true)).toBe(0);
        expect(getDefensiveBonus('front', false)).toBe(0);
    });
    it('meio tem bônus 1 se linha da frente tem aliado', () => {
        expect(getDefensiveBonus('mid', true)).toBe(1);
    });
    it('meio tem bônus 0 se linha da frente está vazia', () => {
        expect(getDefensiveBonus('mid', false)).toBe(0);
    });
    it('trás tem bônus 2 se linha da frente tem aliado', () => {
        expect(getDefensiveBonus('back', true)).toBe(2);
    });
    it('trás tem bônus 0 se linha da frente está vazia', () => {
        expect(getDefensiveBonus('back', false)).toBe(0);
    });
});

describe('positionSystem - lineHasAlive', () => {
    const combatants = [
        { id: 'p1', side: 'player', position: 'front', hp: 10 },
        { id: 'p2', side: 'player', position: 'back',  hp: 0  },
        { id: 'e1', side: 'enemy',  position: 'front', hp: 5  },
    ];

    it('deve encontrar aliado vivo na frente do lado player', () => {
        expect(lineHasAlive(combatants, 'front', 'player')).toBe(true);
    });
    it('deve retornar false se não há aliado vivo na posição', () => {
        expect(lineHasAlive(combatants, 'back', 'player')).toBe(false);
    });
    it('deve funcionar para o lado inimigo', () => {
        expect(lineHasAlive(combatants, 'front', 'enemy')).toBe(true);
    });
    it('deve retornar false para array vazio', () => {
        expect(lineHasAlive([], 'front', 'player')).toBe(false);
    });
});

describe('positionSystem - assignDefaultPositions', () => {
    it('deve atribuir posições baseadas na classe', () => {
        const posMap = assignDefaultPositions(
            ['p1', 'p2', 'p3'],
            { p1: { class: 'Guerreiro' }, p2: { class: 'Mago' }, p3: { class: 'Ladino' } }
        );
        expect(posMap.p1).toBe(POSITION.FRONT);
        expect(posMap.p2).toBe(POSITION.BACK);
        expect(posMap.p3).toBe(POSITION.MID);
    });
    it('deve usar frente como padrão se classe desconhecida', () => {
        const posMap = assignDefaultPositions(['p1'], {});
        expect(posMap.p1).toBe(POSITION.FRONT);
    });
});

describe('positionSystem - filterReachableTargets', () => {
    const targets = [
        { id: 'e1', position: 'front', hp: 10 },
        { id: 'e2', position: 'mid',   hp: 8  },
        { id: 'e3', position: 'back',  hp: 5  },
        { id: 'e4', position: 'front', hp: 0  }, // morto
    ];

    it('Guerreiro (alcance 1) só atinge frente', () => {
        const result = filterReachableTargets(targets, 'Guerreiro', 'front');
        expect(result.map(t => t.id)).toEqual(['e1']);
    });
    it('Ladino (alcance 2) atinge frente e meio', () => {
        const result = filterReachableTargets(targets, 'Ladino', 'mid');
        expect(result.map(t => t.id)).toContain('e1');
        expect(result.map(t => t.id)).toContain('e2');
        expect(result.map(t => t.id)).not.toContain('e3');
    });
    it('Mago (alcance 3) atinge tudo (vivo)', () => {
        const result = filterReachableTargets(targets, 'Mago', 'back');
        expect(result.map(t => t.id)).toContain('e1');
        expect(result.map(t => t.id)).toContain('e2');
        expect(result.map(t => t.id)).toContain('e3');
        expect(result.map(t => t.id)).not.toContain('e4'); // morto
    });
});
