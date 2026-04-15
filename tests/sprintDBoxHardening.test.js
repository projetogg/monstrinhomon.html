/**
 * SPRINT D — BOX HARDENING TESTS
 *
 * Testes de borda para o sistema de Box endurecido:
 *   D3: moveBoxToTeam valida restrição de classe
 *   D4: addToSharedBox rejeita quando box cheia (100 slots)
 *   Captura→party cheia→box automático
 *   Tentativa de colocar monstrinho de classe errada no time
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ─── Implementações inline (mirrored from index.html) ─────────────────────

function makeGameState() {
    return {
        players: [
            {
                id: 'player_1',
                name: 'Alice',
                class: 'Mago',
                team: [
                    { instanceId: 'mon_1', name: 'Faíscari', class: 'Mago', level: 5 }
                ],
                inventory: {}
            },
            {
                id: 'player_2',
                name: 'Bob',
                class: 'Guerreiro',
                team: [],
                inventory: {}
            }
        ],
        sharedBox: [],
        ui: { boxPageIndex: 0, activePlayerId: null, boxViewedPlayerId: null },
        config: { maxTeamSize: 3, masterMode: false }
    };
}

function makeAddToSharedBox(GameState) {
    return (ownerPlayerId, monster) => {
        if (!GameState.sharedBox) GameState.sharedBox = [];
        const BOX_MAX_TOTAL = 100;
        if (GameState.sharedBox.length >= BOX_MAX_TOTAL) {
            return { success: false, message: 'Box está cheia (100/100)' };
        }
        const slotId = 'BX_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
        GameState.sharedBox.push({ slotId, ownerPlayerId, monster });
        return { success: true, slotId };
    };
}

/**
 * Versão D3 do moveBoxToTeam — com validação de classe.
 */
function makeMoveBoxToTeam(GameState) {
    return (activePlayerId, slotId) => {
        const player = GameState.players.find(p => p.id === activePlayerId);
        if (!player) return { success: false, message: 'Jogador não encontrado' };

        const TEAM_MAX = GameState.config?.maxTeamSize || 6;
        if (player.team && player.team.length >= TEAM_MAX) {
            return { success: false, message: `Equipe cheia (${TEAM_MAX}/${TEAM_MAX})` };
        }

        const slotIndex = GameState.sharedBox.findIndex(s => s.slotId === slotId);
        if (slotIndex === -1) return { success: false, message: 'Slot não encontrado' };

        const slot = GameState.sharedBox[slotIndex];
        if (slot.ownerPlayerId !== activePlayerId) {
            return { success: false, message: 'Este monstrinho não é seu' };
        }

        // D3: validar restrição de classe (exceção: masterMode)
        const masterMode = GameState.config?.masterMode || false;
        if (!masterMode) {
            const monClass = slot.monster?.class || '';
            const playerClass = player?.class || '';
            if (monClass && playerClass && monClass !== playerClass) {
                return {
                    success: false,
                    message: `${slot.monster.name} é da classe ${monClass} — só pode batalhar com treinadores ${monClass}. Troque com outro jogador!`
                };
            }
        }

        if (!player.team) player.team = [];
        player.team.push(slot.monster);
        GameState.sharedBox.splice(slotIndex, 1);
        return { success: true, message: `${slot.monster.name} retirado da Box` };
    };
}

// ─── Testes ────────────────────────────────────────────────────────────────

describe('Sprint D — Box Hardening (D3, D4, fluxos de borda)', () => {
    let GameState;
    let addToSharedBox;
    let moveBoxToTeam;

    beforeEach(() => {
        GameState = makeGameState();
        addToSharedBox = makeAddToSharedBox(GameState);
        moveBoxToTeam = makeMoveBoxToTeam(GameState);
    });

    // ─── D3: Restrição de classe ─────────────────────────────────────────
    describe('D3 — moveBoxToTeam valida restrição de classe', () => {
        it('deve bloquear monstrinho de classe diferente do jogador', () => {
            // Alice (Mago) tenta colocar um Guerreiro no time
            const slotId = 'test_slot_1';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_1',
                monster: { instanceId: 'mon_g', name: 'Pedrino', class: 'Guerreiro', level: 3 }
            });

            const result = moveBoxToTeam('player_1', slotId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Guerreiro');
            expect(result.message).toContain('Troque com outro jogador');
        });

        it('deve permitir monstrinho da mesma classe do jogador', () => {
            const slotId = 'test_slot_2';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_1',
                monster: { instanceId: 'mon_m', name: 'Arcanumon', class: 'Mago', level: 5 }
            });

            const result = moveBoxToTeam('player_1', slotId);

            expect(result.success).toBe(true);
            expect(GameState.players[0].team.length).toBe(2);
        });

        it('deve ignorar restrição de classe no Modo Mestre', () => {
            GameState.config.masterMode = true;
            const slotId = 'test_slot_3';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_1',
                monster: { instanceId: 'mon_b', name: 'Titanormon', class: 'Bárbaro', level: 10 }
            });

            const result = moveBoxToTeam('player_1', slotId);

            expect(result.success).toBe(true);
        });

        it('deve permitir quando monstrinho não tem classe definida', () => {
            const slotId = 'test_slot_4';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_1',
                monster: { instanceId: 'mon_x', name: 'Sem Classe', class: '', level: 1 }
            });

            const result = moveBoxToTeam('player_1', slotId);
            // Monstrinho sem classe não deve bloquear (segurança defensiva)
            expect(result.success).toBe(true);
        });

        it('deve permitir quando jogador não tem classe definida', () => {
            GameState.players[0].class = '';
            const slotId = 'test_slot_5';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_1',
                monster: { instanceId: 'mon_r', name: 'Qualquer', class: 'Ladino', level: 2 }
            });

            const result = moveBoxToTeam('player_1', slotId);
            // Jogador sem classe não deve bloquear (segurança defensiva)
            expect(result.success).toBe(true);
        });
    });

    // ─── D4: Box cheia (100 slots) ───────────────────────────────────────
    describe('D4 — limite de 100 slots na Box', () => {
        it('deve rejeitar adição quando box já tem 100 monstrinhos', () => {
            // Preencher box até o limite
            for (let i = 0; i < 100; i++) {
                GameState.sharedBox.push({
                    slotId: `BX_${i}`,
                    ownerPlayerId: 'player_1',
                    monster: { instanceId: `mon_${i}`, name: `Monstrinho${i}`, class: 'Mago', level: 1 }
                });
            }

            const result = addToSharedBox('player_1', { name: 'Extra', class: 'Mago', level: 1 });

            expect(result.success).toBe(false);
            expect(result.message).toContain('100/100');
            expect(GameState.sharedBox.length).toBe(100);
        });

        it('deve aceitar o 100º monstrinho (último slot)', () => {
            // Preencher até 99
            for (let i = 0; i < 99; i++) {
                GameState.sharedBox.push({
                    slotId: `BX_${i}`,
                    ownerPlayerId: 'player_1',
                    monster: { instanceId: `mon_${i}`, name: `M${i}`, class: 'Mago', level: 1 }
                });
            }

            const result = addToSharedBox('player_1', { name: 'Centésimo', class: 'Mago', level: 1 });

            expect(result.success).toBe(true);
            expect(GameState.sharedBox.length).toBe(100);
        });
    });

    // ─── Captura → party cheia → Box automático ──────────────────────────
    describe('Fluxo: captura com party cheia redireciona para Box', () => {
        it('quando party está cheia, addToSharedBox deve receber o monstrinho capturado', () => {
            // Preencher team até o máximo (3)
            GameState.players[0].team = [
                { instanceId: 'm1', name: 'A', class: 'Mago', level: 1 },
                { instanceId: 'm2', name: 'B', class: 'Mago', level: 1 },
                { instanceId: 'm3', name: 'C', class: 'Mago', level: 1 }
            ];

            const TEAM_MAX = GameState.config.maxTeamSize;
            const player = GameState.players[0];
            const newMonster = { instanceId: 'captured', name: 'Novo', class: 'Mago', level: 1 };

            // Simular lógica de awardMonster: se party cheia → box
            let actualDest;
            if (player.team.length < TEAM_MAX) {
                player.team.push(newMonster);
                actualDest = 'party';
            } else {
                const boxResult = addToSharedBox(player.id, newMonster);
                actualDest = boxResult.success ? 'box' : 'error';
            }

            expect(actualDest).toBe('box');
            expect(GameState.sharedBox.length).toBe(1);
            expect(GameState.sharedBox[0].monster.name).toBe('Novo');
            // Time não deve ter sido alterado
            expect(player.team.length).toBe(3);
        });

        it('quando party tem espaço, monstrinho vai direto para o time', () => {
            const TEAM_MAX = GameState.config.maxTeamSize;
            const player = GameState.players[0]; // team tem 1 monstrinho
            const newMonster = { instanceId: 'captured2', name: 'Novo2', class: 'Mago', level: 1 };

            let actualDest;
            if (player.team.length < TEAM_MAX) {
                player.team.push(newMonster);
                actualDest = 'party';
            } else {
                addToSharedBox(player.id, newMonster);
                actualDest = 'box';
            }

            expect(actualDest).toBe('party');
            expect(player.team.length).toBe(2);
            expect(GameState.sharedBox.length).toBe(0);
        });
    });

    // ─── Tentativa de colocar monstro de classe errada no time ─────────
    describe('Tentativa cross-class em batalha', () => {
        it('jogador Guerreiro não pode colocar Mago no time (sem Modo Mestre)', () => {
            // Bob (Guerreiro) tenta pegar Mago de Alice
            const slotId = 'test_cross_1';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_2',
                monster: { instanceId: 'mago_cross', name: 'Arcanumon', class: 'Mago', level: 8 }
            });

            const result = moveBoxToTeam('player_2', slotId);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Mago');
        });

        it('com Modo Mestre, qualquer classe pode ser adicionada ao time', () => {
            GameState.config.masterMode = true;

            const slotId = 'test_cross_2';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_2',
                monster: { instanceId: 'mago_cross2', name: 'Arcanumon', class: 'Mago', level: 8 }
            });

            const result = moveBoxToTeam('player_2', slotId);
            expect(result.success).toBe(true);
        });

        it('equipe cheia deve ter prioridade sobre erro de classe', () => {
            // Bob (Guerreiro) tem o time cheio
            GameState.players[1].team = [
                { instanceId: 'g1', name: 'Ferrózi', class: 'Guerreiro', level: 1 },
                { instanceId: 'g2', name: 'Cavaç', class: 'Guerreiro', level: 1 },
                { instanceId: 'g3', name: 'Bárbaro', class: 'Guerreiro', level: 1 }
            ];

            const slotId = 'test_cross_3';
            GameState.sharedBox.push({
                slotId,
                ownerPlayerId: 'player_2',
                monster: { instanceId: 'mago_cross3', name: 'Arcanumon', class: 'Mago', level: 8 }
            });

            const result = moveBoxToTeam('player_2', slotId);
            // Equipe cheia deve bloquear antes de verificar classe
            expect(result.success).toBe(false);
            expect(result.message).toContain('cheia');
        });
    });
});
