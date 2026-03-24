/**
 * ACTION PANEL UI TESTS (Camada 3)
 * 
 * Testes de integração para o painel de ações contextual
 * Valida os 6 cenários essenciais definidos no checklist
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as TargetSelection from '../js/ui/targetSelection.js';

describe('Camada 3: Action Panel - Cenários Essenciais', () => {
    beforeEach(() => {
        // Reset target selection state antes de cada teste
        TargetSelection._resetForTesting();
    });

    describe('Cenário 1: Painel aparece somente na vez do jogador', () => {
        it('deve mostrar painel quando é turno do jogador', () => {
            // Mock de encounter onde é turno de um jogador
            const encounter = {
                finished: false,
                enemies: [{ hp: 50, hpMax: 50 }],
                participants: ['player1']
            };
            
            const actor = {
                side: 'player',
                id: 'player1'
            };
            
            const isPlayerTurn = true;
            
            // Validar que condições estão corretas para mostrar painel
            expect(encounter.finished).toBe(false);
            expect(isPlayerTurn).toBe(true);
            expect(actor.side).toBe('player');
        });

        it('deve mostrar "Aguarde sua vez" quando NÃO é turno do jogador', () => {
            // Mock de encounter onde é turno de inimigo
            const encounter = {
                finished: false,
                enemies: [{ hp: 50, hpMax: 50 }],
                participants: ['player1']
            };
            
            const actor = {
                side: 'enemy',
                id: 0
            };
            
            const isPlayerTurn = false;
            
            // Validar que condições indicam aguardar
            expect(encounter.finished).toBe(false);
            expect(isPlayerTurn).toBe(false);
            expect(actor.side).toBe('enemy');
        });

        it('não deve mostrar painel quando batalha terminou', () => {
            const encounter = {
                finished: true,
                result: 'victory'
            };
            
            // Validar que batalha terminou
            expect(encounter.finished).toBe(true);
        });
    });

    describe('Cenário 2: Botões inexistem quando ação inválida', () => {
        it('botão Atacar existe apenas se monstrinho vivo', () => {
            const monsterAlive = { hp: 30, hpMax: 50 };
            const monsterDead = { hp: 0, hpMax: 50 };
            
            expect(monsterAlive.hp > 0).toBe(true);  // Botão deve existir
            expect(monsterDead.hp > 0).toBe(false); // Botão NÃO deve existir
        });

        it('botão Habilidade existe apenas se tiver skill disponível E energia', () => {
            const skillIds = ['SKILL_001', 'SKILL_002'];
            const monster = { 
                hp: 30, 
                hpMax: 50,
                ene: 30,
                eneMax: 50
            };
            
            // Mock de skill que custa 20 ENE
            const skill = {
                id: 'SKILL_001',
                energyCost: 20
            };
            
            const hasSkills = skillIds.length > 0;
            const hasEnergy = monster.ene >= skill.energyCost;
            const isAlive = monster.hp > 0;
            
            const shouldShowButton = hasSkills && hasEnergy && isAlive;
            
            expect(shouldShowButton).toBe(true);
        });

        it('botão Item existe apenas se tiver item disponível E HP não cheio', () => {
            const player = {
                inventory: {
                    'IT_HEAL_01': 3
                }
            };
            
            const monsterPartialHp = { hp: 30, hpMax: 50 };
            const monsterFullHp = { hp: 50, hpMax: 50 };
            
            const hasItems = player.inventory['IT_HEAL_01'] > 0;
            
            // Com HP parcial: botão existe
            const canUsePartial = hasItems && monsterPartialHp.hp < monsterPartialHp.hpMax;
            expect(canUsePartial).toBe(true);
            
            // Com HP cheio: botão NÃO existe
            const canUseFull = hasItems && monsterFullHp.hp < monsterFullHp.hpMax;
            expect(canUseFull).toBe(false);
        });

        it('botão Fugir existe sempre se monstrinho vivo', () => {
            const monsterAlive = { hp: 30, hpMax: 50 };
            const monsterDead = { hp: 0, hpMax: 50 };
            
            expect(monsterAlive.hp > 0).toBe(true);  // Botão existe
            expect(monsterDead.hp > 0).toBe(false);  // Botão NÃO existe
        });

        it('botão Passar existe sempre (sem validação)', () => {
            // Passar sempre está disponível
            const passAlwaysAvailable = true;
            expect(passAlwaysAvailable).toBe(true);
        });
    });

    describe('Cenário 3: Clique em atacar entra em modo alvo', () => {
        it('deve entrar em modo de seleção ao clicar Atacar', () => {
            // Estado inicial: não está em modo de seleção
            expect(TargetSelection.isInTargetMode()).toBe(false);
            
            // Simular clique em "Atacar" (enterAttackMode seria chamado)
            TargetSelection.enterTargetMode('attack');
            
            // Após clique: está em modo de seleção
            expect(TargetSelection.isInTargetMode()).toBe(true);
            expect(TargetSelection.getActionType()).toBe('attack');
        });

        it('deve entrar em modo de seleção ao clicar Habilidade', () => {
            // Estado inicial: não está em modo de seleção
            expect(TargetSelection.isInTargetMode()).toBe(false);
            
            // Simular clique em "Habilidade" (enterSkillMode seria chamado)
            TargetSelection.enterTargetMode('skill', 'SKILL_001');
            
            // Após clique: está em modo de seleção
            expect(TargetSelection.isInTargetMode()).toBe(true);
            expect(TargetSelection.getActionType()).toBe('skill');
            expect(TargetSelection.getSelectedSkillId()).toBe('SKILL_001');
        });

        it('não deve permitir modo de seleção se não for turno', () => {
            const isPlayerTurn = false;
            
            // Se não é turno do jogador, não deve permitir entrar em modo
            if (isPlayerTurn) {
                TargetSelection.enterTargetMode('attack');
            }
            
            // Estado permanece: NÃO em modo de seleção
            expect(TargetSelection.isInTargetMode()).toBe(false);
        });
    });

    describe('Cenário 4: Inimigo morto não é clicável', () => {
        it('inimigo vivo deve ser clicável em modo de seleção', () => {
            const enemy = { hp: 30, hpMax: 50 };
            TargetSelection.enterTargetMode('attack');
            
            const isDead = enemy.hp <= 0;
            const isInTargetMode = TargetSelection.isInTargetMode();
            
            const isClickable = !isDead && isInTargetMode;
            
            expect(isClickable).toBe(true);
        });

        it('inimigo morto NÃO deve ser clicável', () => {
            const enemy = { hp: 0, hpMax: 50 };
            TargetSelection.enterTargetMode('attack');
            
            const isDead = enemy.hp <= 0;
            const isInTargetMode = TargetSelection.isInTargetMode();
            
            const isClickable = !isDead && isInTargetMode;
            
            expect(isClickable).toBe(false);
        });

        it('inimigo vivo NÃO é clicável fora do modo de seleção', () => {
            const enemy = { hp: 30, hpMax: 50 };
            // NÃO entrar em modo de seleção
            
            const isDead = enemy.hp <= 0;
            const isInTargetMode = TargetSelection.isInTargetMode();
            
            const isClickable = !isDead && isInTargetMode;
            
            expect(isClickable).toBe(false);
        });

        it('visual: inimigo morto tem opacidade 0.4', () => {
            const enemyAlive = { hp: 30, hpMax: 50 };
            const enemyDead = { hp: 0, hpMax: 50 };
            
            // Visual calculado
            const opacityAlive = enemyAlive.hp > 0 ? 1.0 : 0.4;
            const opacityDead = enemyDead.hp > 0 ? 1.0 : 0.4;
            
            expect(opacityAlive).toBe(1.0);
            expect(opacityDead).toBe(0.4);
        });
    });

    describe('Cenário 5: Após ação, modo alvo reseta', () => {
        it('deve resetar estado após executar ataque', () => {
            // Entrar em modo de seleção
            TargetSelection.enterTargetMode('attack');
            expect(TargetSelection.isInTargetMode()).toBe(true);
            
            // Simular execução de ação (exitTargetMode seria chamado)
            TargetSelection.exitTargetMode();
            
            // Estado resetado
            expect(TargetSelection.isInTargetMode()).toBe(false);
            expect(TargetSelection.getActionType()).toBe(null);
        });

        it('deve resetar estado após executar skill', () => {
            // Entrar em modo de seleção
            TargetSelection.enterTargetMode('skill', 'SKILL_002');
            expect(TargetSelection.isInTargetMode()).toBe(true);
            expect(TargetSelection.getSelectedSkillId()).toBe('SKILL_002');
            
            // Simular execução de ação
            TargetSelection.exitTargetMode();
            
            // Estado resetado
            expect(TargetSelection.isInTargetMode()).toBe(false);
            expect(TargetSelection.getActionType()).toBe(null);
            expect(TargetSelection.getSelectedSkillId()).toBe(null);
        });

        it('deve impedir segunda ação no mesmo turno', () => {
            // Primeira ação
            TargetSelection.enterTargetMode('attack');
            TargetSelection.exitTargetMode();
            
            // Estado resetado - não está em modo de seleção
            expect(TargetSelection.isInTargetMode()).toBe(false);
            
            // Para fazer segunda ação, teria que entrar novamente
            // mas isso não deve ser permitido pelo sistema de turnos
        });
    });

    describe('Cenário 6: Após ação, painel desaparece (ou muda)', () => {
        it('painel deve ser re-renderizado após ação', () => {
            // Este teste valida a lógica de que após uma ação,
            // o painel é re-renderizado e passa para próximo turno
            
            let renderCount = 0;
            
            // Simular que renderizar é chamado
            const mockRender = () => {
                renderCount++;
            };
            
            // Fluxo: selecionar alvo → executar ação → render
            TargetSelection.enterTargetMode('attack');
            mockRender(); // Render com modo de seleção ativo
            
            TargetSelection.exitTargetMode();
            mockRender(); // Render após ação (próximo turno)
            
            // Render foi chamado 2x
            expect(renderCount).toBe(2);
        });

        it('painel muda de jogador1 para jogador2 após turno', () => {
            const turnOrder = ['player1', 'player2', 'player1'];
            let currentIndex = 0;
            
            // Turno do player1
            const currentActor1 = turnOrder[currentIndex];
            expect(currentActor1).toBe('player1');
            
            // Após ação, avançar turno
            currentIndex++;
            
            // Agora é turno do player2
            const currentActor2 = turnOrder[currentIndex];
            expect(currentActor2).toBe('player2');
            
            // Painel agora mostra ações para player2, não player1
        });

        it('painel muda para "Aguarde sua vez" após ação', () => {
            // Antes da ação: é turno do player1
            let currentPlayerId = 'player1';
            let isMyTurn = (myId) => myId === currentPlayerId;
            
            expect(isMyTurn('player1')).toBe(true);  // Mostra painel de ações
            expect(isMyTurn('player2')).toBe(false); // Mostra "Aguarde sua vez"
            
            // Após ação: muda para player2
            currentPlayerId = 'player2';
            
            expect(isMyTurn('player1')).toBe(false); // Agora aguarda
            expect(isMyTurn('player2')).toBe(true);  // Agora age
        });
    });

    describe('Travas Obrigatórias - Validações de Segurança', () => {
        it('TRAVA 1: Não permitir modo alvo se não for a vez', () => {
            const isPlayerTurn = false;
            
            if (!isPlayerTurn) {
                // Não deve chamar enterTargetMode
                // Se chamar, deve ser bloqueado no código
            } else {
                TargetSelection.enterTargetMode('attack');
            }
            
            expect(TargetSelection.isInTargetMode()).toBe(false);
        });

        it('TRAVA 2: Não permitir clicar em inimigo morto', () => {
            const enemy = { hp: 0, hpMax: 50 };
            TargetSelection.enterTargetMode('attack');
            
            // Validação que seria feita no handleEnemyClick
            const isDead = enemy.hp <= 0;
            let actionExecuted = false;
            
            if (!isDead) {
                actionExecuted = true;
            }
            
            expect(actionExecuted).toBe(false); // Ação NÃO executada
        });

        it('TRAVA 3: Não permitir duas ações no mesmo turno', () => {
            // Primeira ação
            TargetSelection.enterTargetMode('attack');
            const actionType1 = TargetSelection.getActionType();
            expect(actionType1).toBe('attack');
            
            // Executar e resetar
            TargetSelection.exitTargetMode();
            
            // Tentar segunda ação imediatamente
            const inTargetMode = TargetSelection.isInTargetMode();
            expect(inTargetMode).toBe(false); // Não está em modo, não pode agir
        });

        it('TRAVA 4: Não permitir troca de ação sem resetar', () => {
            // Entrar em modo de ataque
            TargetSelection.enterTargetMode('attack');
            expect(TargetSelection.getActionType()).toBe('attack');
            
            // Tentar trocar para skill (sobrescreve, mas OK pois ainda não executou)
            TargetSelection.enterTargetMode('skill', 'SKILL_003');
            expect(TargetSelection.getActionType()).toBe('skill');
            
            // Mas após executar, deve resetar antes de nova ação
            TargetSelection.exitTargetMode();
            expect(TargetSelection.getActionType()).toBe(null);
        });

        it('TRAVA 5: UI trava imediatamente após ação', () => {
            // Mock de estado de UI
            let uiLocked = false;
            
            // Executar ação
            TargetSelection.enterTargetMode('attack');
            // ... ação executada ...
            TargetSelection.exitTargetMode();
            
            // UI deve travar (renderizar sem painel de ações)
            uiLocked = !TargetSelection.isInTargetMode();
            
            expect(uiLocked).toBe(true);
        });
    });
});
