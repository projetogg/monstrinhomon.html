/**
 * PR15A - Box (PC) System Tests
 * Tests for shared box functionality with proper active player handling
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('Box System - PR15A', () => {
    let GameState;
    let getActivePlayerForBox;
    let ensureBoxUIState;
    let addToSharedBox;
    let moveTeamToBox;
    let moveBoxToTeam;
    let getCurrentPlayer;

    beforeEach(() => {
        // Mock GameState
        GameState = {
            players: [
                {
                    id: 'player_1',
                    name: 'Alice',
                    class: 'Mago',
                    team: [
                        { instanceId: 'mon_1', name: 'Faíscari', class: 'Mago', level: 5, hp: 30, hpMax: 30 },
                        { instanceId: 'mon_2', name: 'Cantapau', class: 'Bardo', level: 3, hp: 28, hpMax: 28 }
                    ],
                    inventory: {}
                },
                {
                    id: 'player_2',
                    name: 'Bob',
                    class: 'Guerreiro',
                    team: [
                        { instanceId: 'mon_3', name: 'Pedrino', class: 'Guerreiro', level: 4, hp: 32, hpMax: 32 }
                    ],
                    inventory: {}
                }
            ],
            sharedBox: [],
            ui: {},
            currentSession: null,
            config: {
                maxTeamSize: 6
            }
        };

        // Mock getCurrentPlayer function
        getCurrentPlayer = () => {
            if (!GameState.currentSession) return null;
            const turnIndex = GameState.currentSession.currentTurnIndex || 0;
            const playerId = GameState.currentSession.turnOrder?.[turnIndex];
            return GameState.players?.find(p => p?.id === playerId) || null;
        };

        // Implementation of getActivePlayerForBox
        getActivePlayerForBox = () => {
            try {
                const p = getCurrentPlayer();
                if (p && p.id) return p;
            } catch {}

            const uiId = GameState.ui?.activePlayerId;
            if (uiId) {
                const p = GameState.players.find(x => x.id === uiId);
                if (p) return p;
            }

            return GameState.players[0] || null;
        };

        // Implementation of ensureBoxUIState
        ensureBoxUIState = () => {
            if (!GameState.ui) GameState.ui = {};

            const fallbackId = GameState.players?.[0]?.id || null;

            if (!GameState.ui.activePlayerId ||
                !GameState.players.some(p => p.id === GameState.ui.activePlayerId)) {
                GameState.ui.activePlayerId = fallbackId;
            }

            if (!GameState.ui.boxViewedPlayerId ||
                !GameState.players.some(p => p.id === GameState.ui.boxViewedPlayerId)) {
                GameState.ui.boxViewedPlayerId = GameState.ui.activePlayerId;
            }

            if (typeof GameState.ui.boxPageIndex !== 'number') {
                GameState.ui.boxPageIndex = 0;
            }

            if (!Array.isArray(GameState.sharedBox)) {
                GameState.sharedBox = [];
            }
        };

        // Implementation of addToSharedBox
        addToSharedBox = (ownerPlayerId, monster) => {
            if (!GameState.sharedBox) GameState.sharedBox = [];
            
            const BOX_MAX_TOTAL = 100;
            if (GameState.sharedBox.length >= BOX_MAX_TOTAL) {
                return { success: false, message: 'Box está cheia (100/100)' };
            }

            const slotId = 'BX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId,
                monster
            });

            return { success: true, slotId };
        };

        // Implementation of moveTeamToBox
        moveTeamToBox = (activePlayerId, teamIndex) => {
            const player = GameState.players.find(p => p.id === activePlayerId);
            if (!player) {
                return { success: false, message: 'Jogador não encontrado' };
            }

            if (!player.team || teamIndex < 0 || teamIndex >= player.team.length) {
                return { success: false, message: 'Índice de equipe inválido' };
            }

            const monster = player.team[teamIndex];
            if (!monster) {
                return { success: false, message: 'Monstrinho não encontrado' };
            }

            const result = addToSharedBox(activePlayerId, monster);
            if (!result.success) {
                return result;
            }

            // Remove from team
            player.team.splice(teamIndex, 1);

            return { success: true, message: `${monster.name} enviado para Box` };
        };

        // Implementation of moveBoxToTeam
        moveBoxToTeam = (activePlayerId, slotId) => {
            const player = GameState.players.find(p => p.id === activePlayerId);
            if (!player) {
                return { success: false, message: 'Jogador não encontrado' };
            }

            const TEAM_MAX = GameState.config?.maxTeamSize || 6;
            if (player.team && player.team.length >= TEAM_MAX) {
                return { success: false, message: `Equipe cheia (${TEAM_MAX}/${TEAM_MAX})` };
            }

            const slotIndex = GameState.sharedBox.findIndex(slot => slot.slotId === slotId);
            if (slotIndex === -1) {
                return { success: false, message: 'Slot não encontrado' };
            }

            const slot = GameState.sharedBox[slotIndex];
            if (slot.ownerPlayerId !== activePlayerId) {
                return { success: false, message: 'Este monstrinho não é seu' };
            }

            // Add to team
            if (!player.team) player.team = [];
            player.team.push(slot.monster);

            // Remove from box
            GameState.sharedBox.splice(slotIndex, 1);

            return { success: true, message: `${slot.monster.name} retirado da Box` };
        };
    });

    describe('getActivePlayerForBox()', () => {
        it('should return player from getCurrentPlayer() when session exists', () => {
            GameState.currentSession = {
                turnOrder: ['player_2', 'player_1'],
                currentTurnIndex: 0
            };

            const active = getActivePlayerForBox();
            expect(active).toBeDefined();
            expect(active.id).toBe('player_2');
        });

        it('should fallback to ui.activePlayerId when no session', () => {
            GameState.ui = { activePlayerId: 'player_1' };
            
            const active = getActivePlayerForBox();
            expect(active).toBeDefined();
            expect(active.id).toBe('player_1');
        });

        it('should fallback to players[0] when no session and no ui', () => {
            const active = getActivePlayerForBox();
            expect(active).toBeDefined();
            expect(active.id).toBe('player_1');
        });

        it('should handle empty players array', () => {
            GameState.players = [];
            const active = getActivePlayerForBox();
            expect(active).toBeNull();
        });
    });

    describe('ensureBoxUIState()', () => {
        it('should initialize ui state when missing', () => {
            ensureBoxUIState();
            
            expect(GameState.ui).toBeDefined();
            expect(GameState.ui.activePlayerId).toBe('player_1');
            expect(GameState.ui.boxViewedPlayerId).toBe('player_1');
            expect(GameState.ui.boxPageIndex).toBe(0);
            expect(Array.isArray(GameState.sharedBox)).toBe(true);
        });

        it('should preserve valid ui state', () => {
            GameState.ui = {
                activePlayerId: 'player_2',
                boxViewedPlayerId: 'player_1',
                boxPageIndex: 1
            };
            GameState.sharedBox = [{ slotId: 'test' }];

            ensureBoxUIState();
            
            expect(GameState.ui.activePlayerId).toBe('player_2');
            expect(GameState.ui.boxViewedPlayerId).toBe('player_1');
            expect(GameState.ui.boxPageIndex).toBe(1);
            expect(GameState.sharedBox.length).toBe(1);
        });

        it('should fix invalid activePlayerId', () => {
            GameState.ui = { activePlayerId: 'invalid_id' };
            
            ensureBoxUIState();
            
            expect(GameState.ui.activePlayerId).toBe('player_1');
        });
    });

    describe('addToSharedBox()', () => {
        beforeEach(() => {
            ensureBoxUIState();
        });

        it('should add monster to shared box', () => {
            const monster = { instanceId: 'mon_4', name: 'Test', level: 1 };
            const result = addToSharedBox('player_1', monster);

            expect(result.success).toBe(true);
            expect(result.slotId).toBeDefined();
            expect(GameState.sharedBox.length).toBe(1);
            expect(GameState.sharedBox[0].ownerPlayerId).toBe('player_1');
            expect(GameState.sharedBox[0].monster).toEqual(monster);
        });

        it('should reject when box is full', () => {
            // Fill box to 100
            for (let i = 0; i < 100; i++) {
                GameState.sharedBox.push({
                    slotId: `slot_${i}`,
                    ownerPlayerId: 'player_1',
                    monster: { instanceId: `mon_${i}` }
                });
            }

            const monster = { instanceId: 'mon_new', name: 'New' };
            const result = addToSharedBox('player_1', monster);

            expect(result.success).toBe(false);
            expect(result.message).toContain('cheia');
        });
    });

    describe('moveTeamToBox()', () => {
        beforeEach(() => {
            ensureBoxUIState();
        });

        it('should move monster from team to box', () => {
            const player = GameState.players[0];
            const initialTeamSize = player.team.length;
            const monster = player.team[0];

            const result = moveTeamToBox('player_1', 0);

            expect(result.success).toBe(true);
            expect(player.team.length).toBe(initialTeamSize - 1);
            expect(GameState.sharedBox.length).toBe(1);
            expect(GameState.sharedBox[0].monster.instanceId).toBe(monster.instanceId);
        });

        it('should reject invalid player', () => {
            const result = moveTeamToBox('invalid_id', 0);
            expect(result.success).toBe(false);
        });

        it('should reject invalid team index', () => {
            const result = moveTeamToBox('player_1', 999);
            expect(result.success).toBe(false);
        });
    });

    describe('moveBoxToTeam()', () => {
        beforeEach(() => {
            ensureBoxUIState();
            // Add a monster to box
            const monster = GameState.players[0].team[0];
            moveTeamToBox('player_1', 0);
        });

        it('should move monster from box to team', () => {
            const player = GameState.players[0];
            const initialTeamSize = player.team.length;
            const slotId = GameState.sharedBox[0].slotId;

            const result = moveBoxToTeam('player_1', slotId);

            expect(result.success).toBe(true);
            expect(player.team.length).toBe(initialTeamSize + 1);
            expect(GameState.sharedBox.length).toBe(0);
        });

        it('should reject when team is full', () => {
            const player = GameState.players[0];
            // Fill team to max
            while (player.team.length < 6) {
                player.team.push({ instanceId: `filler_${player.team.length}`, name: 'Filler' });
            }

            const slotId = GameState.sharedBox[0].slotId;
            const result = moveBoxToTeam('player_1', slotId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('cheia');
        });

        it('should reject monster owned by other player', () => {
            const slotId = GameState.sharedBox[0].slotId;
            const result = moveBoxToTeam('player_2', slotId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('não é seu');
        });

        it('should reject invalid slot', () => {
            const result = moveBoxToTeam('player_1', 'invalid_slot');
            expect(result.success).toBe(false);
        });
    });

    describe('Permission System', () => {
        beforeEach(() => {
            ensureBoxUIState();
            // Player 1 sends a monster to box
            moveTeamToBox('player_1', 0);
            // Player 2 sends a monster to box
            moveTeamToBox('player_2', 0);
        });

        it('should allow viewing other players pages', () => {
            const player1Slots = GameState.sharedBox.filter(s => s.ownerPlayerId === 'player_1');
            const player2Slots = GameState.sharedBox.filter(s => s.ownerPlayerId === 'player_2');

            expect(player1Slots.length).toBe(1);
            expect(player2Slots.length).toBe(1);
        });

        it('should prevent taking monsters from other players', () => {
            const player2Slot = GameState.sharedBox.find(s => s.ownerPlayerId === 'player_2');
            const result = moveBoxToTeam('player_1', player2Slot.slotId);

            expect(result.success).toBe(false);
        });

        it('should allow each player to manage only their own monsters', () => {
            const player1Slot = GameState.sharedBox.find(s => s.ownerPlayerId === 'player_1');
            const player2Slot = GameState.sharedBox.find(s => s.ownerPlayerId === 'player_2');

            const result1 = moveBoxToTeam('player_1', player1Slot.slotId);
            const result2 = moveBoxToTeam('player_2', player2Slot.slotId);

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(GameState.sharedBox.length).toBe(0);
        });
    });
});
