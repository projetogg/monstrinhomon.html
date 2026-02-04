/**
 * GROUP BATTLE STATE TESTS
 * 
 * Testes para a estrutura GroupBattleState (v1.0)
 * Cobertura: createGroupBattleState, addLogEntry, requestReinforcement,
 * playerFlees, applyReinforcementsIfAny, setTurnPhase, incrementRound,
 * endBattle, getActiveParticipants, getRewardEligiblePlayers, validateState
 */

import { describe, it, expect } from 'vitest';
import {
    createGroupBattleState,
    addLogEntry,
    requestReinforcement,
    playerFlees,
    applyReinforcementsIfAny,
    setTurnPhase,
    incrementRound,
    endBattle,
    getActiveParticipants,
    getRewardEligiblePlayers,
    validateState
} from '../js/combat/groupBattleState.js';

describe('createGroupBattleState - Criação de Estado', () => {
    it('deve criar estado válido para batalha trainer', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2", "p3"],
            initialParticipants: ["p1", "p2"],
            enemies: [
                { name: "Inimigo 1", hp: 50, hpMax: 50, spd: 5, atk: 5, def: 5, class: "Guerreiro" }
            ]
        });

        expect(state.id).toMatch(/^GB_/);
        expect(state.kind).toBe("trainer");
        expect(state.status).toBe("active");
        expect(state.roster.eligiblePlayerIds).toEqual(["p1", "p2", "p3"]);
        expect(state.roster.participants).toHaveLength(2);
        expect(state.roster.notJoined).toEqual(["p3"]);
        expect(state.teams.enemies).toHaveLength(1);
        expect(state.log).toHaveLength(1);
        expect(state.log[0].type).toBe("BATTLE_START");
    });

    it('deve criar estado válido para batalha boss', () => {
        const state = createGroupBattleState({
            kind: "boss",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1", "p2"],
            enemies: [
                { name: "Boss", hp: 100, hpMax: 100, spd: 10, atk: 10, def: 10, class: "Bárbaro", type: "boss" }
            ]
        });

        expect(state.kind).toBe("boss");
        expect(state.teams.enemies[0].type).toBe("boss");
    });

    it('deve aplicar regras padrão corretamente', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(state.rules.allowCapture).toBe(false);
        expect(state.rules.allowItems).toBe(true);
        expect(state.rules.allowFlee).toBe(true);
        expect(state.rules.fleeIsIndividual).toBe(true);
        expect(state.rules.allowLateJoin).toBe(true);
        expect(state.rules.oneActiveMonsterPerPlayer).toBe(true);
    });

    it('deve permitir sobrescrever regras padrão', () => {
        const state = createGroupBattleState({
            kind: "boss",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }],
            rules: {
                allowFlee: false,
                allowLateJoin: false
            }
        });

        expect(state.rules.allowFlee).toBe(false);
        expect(state.rules.allowLateJoin).toBe(false);
        // Outros valores devem manter o padrão
        expect(state.rules.allowItems).toBe(true);
    });

    it('deve inicializar participantes com metadata', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1", "p2"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(state.roster.participants[0]).toEqual({
            playerId: "p1",
            joinedAtRound: 1,
            isActive: true
        });
        expect(state.roster.participants[1]).toEqual({
            playerId: "p2",
            joinedAtRound: 1,
            isActive: true
        });
    });

    it('deve lançar erro se kind for inválido', () => {
        expect(() => {
            createGroupBattleState({
                kind: "invalid",
                eligiblePlayerIds: ["p1"],
                initialParticipants: ["p1"],
                enemies: []
            });
        }).toThrow("kind deve ser 'trainer' ou 'boss'");
    });

    it('deve lançar erro se eligiblePlayerIds estiver vazio', () => {
        expect(() => {
            createGroupBattleState({
                kind: "trainer",
                eligiblePlayerIds: [],
                initialParticipants: ["p1"],
                enemies: []
            });
        }).toThrow("eligiblePlayerIds deve ser array não vazio");
    });

    it('deve lançar erro se initialParticipants não estiver em eligiblePlayerIds', () => {
        expect(() => {
            createGroupBattleState({
                kind: "trainer",
                eligiblePlayerIds: ["p1", "p2"],
                initialParticipants: ["p1", "p3"],
                enemies: []
            });
        }).toThrow("Participante p3 não está em eligiblePlayerIds");
    });

    it('deve processar inimigos corretamente', () => {
        const state = createGroupBattleState({
            kind: "boss",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [
                { name: "Boss", hp: 100, hpMax: 100, spd: 10, type: "boss" },
                { name: "Minion", hp: 50, hpMax: 50, spd: 5 }
            ]
        });

        expect(state.teams.enemies).toHaveLength(2);
        expect(state.teams.enemies[0].enemyId).toBe("E1");
        expect(state.teams.enemies[0].type).toBe("boss");
        expect(state.teams.enemies[1].enemyId).toBe("E2");
        expect(state.teams.enemies[1].type).toBe("minion");
    });
});

describe('addLogEntry - Adicionar Log', () => {
    it('deve adicionar entrada ao log', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = addLogEntry(state, "ACTION", "Jogador atacou", { dmg: 10 });

        expect(newState.log).toHaveLength(2);
        expect(newState.log[1].type).toBe("ACTION");
        expect(newState.log[1].text).toBe("Jogador atacou");
        expect(newState.log[1].meta).toEqual({ dmg: 10 });
        expect(newState.log[1].t).toBeGreaterThan(0);
    });

    it('não deve modificar o estado original', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const originalLogLength = state.log.length;
        addLogEntry(state, "ACTION", "Test");

        expect(state.log.length).toBe(originalLogLength);
    });
});

describe('requestReinforcement - Solicitar Reforço', () => {
    it('deve adicionar jogador à fila de reforços', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2", "p3"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = requestReinforcement(state, "p2");

        expect(newState.roster.reinforcementsQueue).toHaveLength(1);
        expect(newState.roster.reinforcementsQueue[0]).toEqual({
            playerId: "p2",
            requestedAtRound: 1
        });
        expect(newState.roster.notJoined).not.toContain("p2");
        expect(newState.log[1].type).toBe("REINFORCEMENT_REQUEST");
    });

    it('deve lançar erro se jogador não estiver em notJoined', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(() => {
            requestReinforcement(state, "p1"); // p1 já está participando
        }).toThrow("não pode pedir reforço");
    });

    it('não deve duplicar reforço se já estiver na fila', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const state2 = requestReinforcement(state, "p2");
        const state3 = requestReinforcement(state2, "p2");

        expect(state3.roster.reinforcementsQueue).toHaveLength(1);
    });
});

describe('playerFlees - Jogador Foge', () => {
    it('deve marcar jogador como fugido', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1", "p2"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = playerFlees(state, "p1");

        expect(newState.roster.escaped).toHaveLength(1);
        expect(newState.roster.escaped[0]).toEqual({
            playerId: "p1",
            escapedAtRound: 1
        });
        
        const p1Participant = newState.roster.participants.find(p => p.playerId === "p1");
        expect(p1Participant.isActive).toBe(false);
        expect(newState.log[1].type).toBe("FLEE");
    });

    it('deve lançar erro se jogador não estiver ativo', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(() => {
            playerFlees(state, "p2"); // p2 não entrou na batalha
        }).toThrow("não pode fugir");
    });
});

describe('applyReinforcementsIfAny - Aplicar Reforços', () => {
    it('deve mover reforços da fila para participantes', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2", "p3"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const state2 = requestReinforcement(state, "p2");
        const state3 = requestReinforcement(state2, "p3");
        const state4 = applyReinforcementsIfAny(state3);

        expect(state4.roster.participants).toHaveLength(3);
        expect(state4.roster.reinforcementsQueue).toHaveLength(0);
        
        const p2Participant = state4.roster.participants.find(p => p.playerId === "p2");
        expect(p2Participant).toBeDefined();
        expect(p2Participant.joinedAtRound).toBe(1);
        expect(p2Participant.isActive).toBe(true);
    });

    it('não deve fazer nada se fila estiver vazia', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = applyReinforcementsIfAny(state);

        expect(newState.roster.participants).toHaveLength(1);
        expect(newState.log.length).toBe(1); // Sem novos logs
    });

    it('não deve aplicar reforços se allowLateJoin for false', () => {
        const state = createGroupBattleState({
            kind: "boss",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }],
            rules: { allowLateJoin: false }
        });

        const state2 = {
            ...state,
            roster: {
                ...state.roster,
                reinforcementsQueue: [{
                    playerId: "p2",
                    requestedAtRound: 1
                }]
            }
        };

        const state3 = applyReinforcementsIfAny(state2);

        expect(state3.roster.participants).toHaveLength(1);
        expect(state3.roster.reinforcementsQueue).toHaveLength(1);
    });
});

describe('setTurnPhase - Mudar Fase', () => {
    it('deve mudar fase para "players"', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = setTurnPhase(state, "players");

        expect(newState.turn.phase).toBe("players");
        expect(newState.turn.visibleBanner).toBe("Vez dos Jogadores");
        expect(newState.log[1].type).toBe("TURN_PHASE");
    });

    it('deve mudar fase para "enemies"', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = setTurnPhase(state, "enemies");

        expect(newState.turn.phase).toBe("enemies");
        expect(newState.turn.visibleBanner).toBe("Vez dos Inimigos");
    });

    it('deve lançar erro para fase inválida', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(() => {
            setTurnPhase(state, "invalid");
        }).toThrow("phase deve ser 'players' ou 'enemies'");
    });
});

describe('incrementRound - Incrementar Rodada', () => {
    it('deve incrementar contador de rodada', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(state.turn.round).toBe(1);

        const newState = incrementRound(state);

        expect(newState.turn.round).toBe(2);
        expect(newState.log[1].type).toBe("ROUND_START");
        expect(newState.log[1].text).toContain("Rodada 2");
    });
});

describe('endBattle - Finalizar Batalha', () => {
    it('deve finalizar batalha com vitória', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = endBattle(state, "victory");

        expect(newState.status).toBe("ended");
        expect(newState.log[1].type).toBe("BATTLE_END");
        expect(newState.log[1].text).toContain("Vitória");
        expect(newState.log[1].meta.result).toBe("victory");
    });

    it('deve finalizar batalha com derrota', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const newState = endBattle(state, "defeat");

        expect(newState.status).toBe("ended");
        expect(newState.log[1].text).toContain("Derrota");
        expect(newState.log[1].meta.result).toBe("defeat");
    });

    it('deve lançar erro para resultado inválido', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        expect(() => {
            endBattle(state, "draw");
        }).toThrow("result deve ser 'victory', 'defeat' ou 'retreat'");
    });
});

describe('getActiveParticipants - Participantes Ativos', () => {
    it('deve retornar todos participantes inicialmente', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1", "p2"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const active = getActiveParticipants(state);

        expect(active).toHaveLength(2);
    });

    it('deve excluir jogadores que fugiram', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1", "p2"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const state2 = playerFlees(state, "p1");
        const active = getActiveParticipants(state2);

        expect(active).toHaveLength(1);
        expect(active[0].playerId).toBe("p2");
    });
});

describe('getRewardEligiblePlayers - Elegíveis para Recompensa', () => {
    it('deve retornar IDs dos participantes ativos', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2", "p3"],
            initialParticipants: ["p1", "p2"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const eligible = getRewardEligiblePlayers(state);

        expect(eligible).toEqual(["p1", "p2"]);
    });

    it('não deve incluir jogadores que fugiram', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2"],
            initialParticipants: ["p1", "p2"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const state2 = playerFlees(state, "p1");
        const eligible = getRewardEligiblePlayers(state2);

        expect(eligible).toEqual(["p2"]);
    });

    it('deve incluir reforços que entraram', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1", "p2", "p3"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const state2 = requestReinforcement(state, "p2");
        const state3 = applyReinforcementsIfAny(state2);
        const eligible = getRewardEligiblePlayers(state3);

        expect(eligible).toEqual(["p1", "p2"]);
    });
});

describe('validateState - Validar Estado', () => {
    it('deve validar estado correto', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        const result = validateState(state);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('deve detectar id faltando', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        delete state.id;
        const result = validateState(state);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("id é obrigatório");
    });

    it('deve detectar kind inválido', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        state.kind = "invalid";
        const result = validateState(state);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("kind deve ser 'trainer' ou 'boss'");
    });

    it('deve detectar status inválido', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        state.status = "paused";
        const result = validateState(state);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("status deve ser 'active' ou 'ended'");
    });

    it('deve detectar roster faltando', () => {
        const state = createGroupBattleState({
            kind: "trainer",
            eligiblePlayerIds: ["p1"],
            initialParticipants: ["p1"],
            enemies: [{ name: "E1", hp: 50, hpMax: 50, spd: 5 }]
        });

        delete state.roster;
        const result = validateState(state);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain("roster é obrigatório");
    });

    it('deve detectar múltiplos erros', () => {
        const state = {
            kind: "invalid",
            status: "wrong",
            roster: null,
            teams: null,
            turn: null,
            log: null
        };

        const result = validateState(state);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(3);
    });
});
