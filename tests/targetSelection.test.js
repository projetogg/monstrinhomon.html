/**
 * TARGET SELECTION UI STATE TESTS (Camada 3)
 * 
 * Testes para o módulo de gerenciamento de estado de seleção de alvo
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    enterTargetMode,
    exitTargetMode,
    isInTargetMode,
    getActionType,
    getSelectedSkillId,
    getState,
    _resetForTesting
} from '../js/ui/targetSelection.js';

describe('Target Selection UI State', () => {
    beforeEach(() => {
        // Reset state antes de cada teste
        _resetForTesting();
    });

    describe('Estado inicial', () => {
        it('deve começar sem seleção ativa', () => {
            expect(isInTargetMode()).toBe(false);
            expect(getActionType()).toBe(null);
            expect(getSelectedSkillId()).toBe(null);
        });
    });

    describe('enterTargetMode - Attack', () => {
        it('deve entrar em modo de ataque', () => {
            enterTargetMode("attack");
            
            expect(isInTargetMode()).toBe(true);
            expect(getActionType()).toBe("attack");
            expect(getSelectedSkillId()).toBe(null);
        });

        it('deve sobrescrever estado anterior', () => {
            enterTargetMode("attack");
            enterTargetMode("attack");
            
            expect(isInTargetMode()).toBe(true);
            expect(getActionType()).toBe("attack");
        });
    });

    describe('enterTargetMode - Skill', () => {
        it('deve entrar em modo de skill com skillId', () => {
            enterTargetMode("skill", "SKILL_001");
            
            expect(isInTargetMode()).toBe(true);
            expect(getActionType()).toBe("skill");
            expect(getSelectedSkillId()).toBe("SKILL_001");
        });

        it('deve lançar erro se skillId não fornecido', () => {
            expect(() => enterTargetMode("skill")).toThrow("skillId é obrigatório");
        });

        it('deve aceitar skillId null explicitamente e lançar erro', () => {
            expect(() => enterTargetMode("skill", null)).toThrow("skillId é obrigatório");
        });
    });

    describe('enterTargetMode - Validações', () => {
        it('deve lançar erro para actionType inválido', () => {
            expect(() => enterTargetMode("invalid")).toThrow("actionType deve ser");
        });

        it('deve lançar erro para actionType vazio', () => {
            expect(() => enterTargetMode("")).toThrow("actionType deve ser");
        });

        it('deve lançar erro para actionType null', () => {
            expect(() => enterTargetMode(null)).toThrow("actionType deve ser");
        });
    });

    describe('exitTargetMode', () => {
        it('deve sair do modo de seleção (attack)', () => {
            enterTargetMode("attack");
            exitTargetMode();
            
            expect(isInTargetMode()).toBe(false);
            expect(getActionType()).toBe(null);
            expect(getSelectedSkillId()).toBe(null);
        });

        it('deve sair do modo de seleção (skill)', () => {
            enterTargetMode("skill", "SKILL_002");
            exitTargetMode();
            
            expect(isInTargetMode()).toBe(false);
            expect(getActionType()).toBe(null);
            expect(getSelectedSkillId()).toBe(null);
        });

        it('deve ser idempotente (pode chamar múltiplas vezes)', () => {
            enterTargetMode("attack");
            exitTargetMode();
            exitTargetMode();
            exitTargetMode();
            
            expect(isInTargetMode()).toBe(false);
        });
    });

    describe('getState', () => {
        it('deve retornar clone do estado (attack)', () => {
            enterTargetMode("attack");
            const state = getState();
            
            expect(state).toEqual({
                selectingTarget: true,
                actionType: "attack",
                selectedSkillId: null
            });
        });

        it('deve retornar clone do estado (skill)', () => {
            enterTargetMode("skill", "SKILL_003");
            const state = getState();
            
            expect(state).toEqual({
                selectingTarget: true,
                actionType: "skill",
                selectedSkillId: "SKILL_003"
            });
        });

        it('deve retornar clone (não referência)', () => {
            enterTargetMode("attack");
            const state1 = getState();
            const state2 = getState();
            
            expect(state1).not.toBe(state2); // Diferentes objetos
            expect(state1).toEqual(state2);  // Mas mesmo conteúdo
        });
    });

    describe('Fluxo completo', () => {
        it('deve suportar ciclo completo: enter → exit → enter', () => {
            // Primeiro ciclo
            enterTargetMode("attack");
            expect(isInTargetMode()).toBe(true);
            
            exitTargetMode();
            expect(isInTargetMode()).toBe(false);
            
            // Segundo ciclo
            enterTargetMode("skill", "SKILL_004");
            expect(isInTargetMode()).toBe(true);
            expect(getSelectedSkillId()).toBe("SKILL_004");
            
            exitTargetMode();
            expect(isInTargetMode()).toBe(false);
        });

        it('deve suportar troca de actionType sem exit explícito', () => {
            enterTargetMode("attack");
            expect(getActionType()).toBe("attack");
            expect(getSelectedSkillId()).toBe(null);
            
            // Trocar para skill (sobrescreve)
            enterTargetMode("skill", "SKILL_005");
            expect(getActionType()).toBe("skill");
            expect(getSelectedSkillId()).toBe("SKILL_005");
        });
    });
});
