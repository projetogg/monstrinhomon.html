/**
 * GROUP BATTLE LOOP TESTS
 * 
 * Testes para as funções de loop de batalha em grupo
 * Cobertura: startGroupBattle, beginPhase, advanceTurn
 */

import { describe, it, expect } from 'vitest';
import {
    startGroupBattle,
    beginPhase,
    advanceTurn,
    isActorTurn,
    getCurrentActor,
    getTurnInfo
} from '../js/combat/groupBattleLoop.js';

// Mock rollD20 determinístico para testes
const mockRollD20 = () => 10;
let rollCounter = 0;
const mockRollD20Incremental = () => {
    rollCounter++;
    return rollCounter;
};

describe('startGroupBattle - Criar Batalha', () => {
    const mockPlayersData = [
        {
            id: 'p1',
            name: 'Jogador 1',
            team: [{
                uid: 'm1',
                name: 'Monstrinho 1',
                hp: 50,
                hpMax: 50,
                spd: 10,
                atk: 5,
                def: 5,
                class: 'Guerreiro',
                level: 5
            }]
        },
        {
            id: 'p2',
            name: 'Jogador 2',
            team: [{
                uid: 'm2',
                name: 'Monstrinho 2',
                hp: 40,
                hpMax: 40,
                spd: 8,
                atk: 6,
                def: 4,
                class: 'Mago',
                level: 4
            }]
        },
        {
            id: 'p3',
            name: 'Jogador 3',
            team: [{
                uid: 'm3',
                name: 'Monstrinho 3',
                hp: 45,
                hpMax: 45,
                spd: 7,
                atk: 4,
                def: 6,
                class: 'Curandeiro',
                level: 3
            }]
        }
    ];

    it('deve criar batalha trainer válida com 2 jogadores', () => {
        const state = startGroupBattle({
            selectedPlayerIds: ['p1', 'p2'],
            kind: 'trainer',
            eligiblePlayerIds: ['p1', 'p2', 'p3'],
            playersData: mockPlayersData,
            options: { enemyLevel: 1 },
            rollD20Fn: mockRollD20
        });

        expect(state.id).toMatch(/^GB_/);
        expect(state.kind).toBe('trainer');
        expect(state.status).toBe('active');
        expect(state.roster.participants).toHaveLength(2);
        expect(state.roster.notJoined).toEqual(['p3']);
        expect(state.teams.players).toHaveLength(2);
        expect(state.teams.enemies.length).toBeGreaterThanOrEqual(2);
        expect(state.teams.enemies.length).toBeLessThanOrEqual(3);
        expect(state.turn.phase).toBe('players');
        expect(state.turn.order.length).toBeGreaterThan(0);
    });

    it('deve criar batalha boss com 3 jogadores', () => {
        const state = startGroupBattle({
            selectedPlayerIds: ['p1', 'p2', 'p3'],
            kind: 'boss',
            eligiblePlayerIds: ['p1', 'p2', 'p3'],
            playersData: mockPlayersData,
            options: { enemyLevel: 5 },
            rollD20Fn: mockRollD20
        });

        expect(state.kind).toBe('boss');
        expect(state.teams.players).toHaveLength(3);
        
        // Boss deve ter pelo menos 1 inimigo (o boss)
        expect(state.teams.enemies.length).toBeGreaterThanOrEqual(1);
        
        // Primeiro inimigo deve ser o boss
        const boss = state.teams.enemies.find(e => e.type === 'boss');
        expect(boss).toBeDefined();
        expect(boss.hp).toBeGreaterThan(50); // Boss escalado
    });

    it('deve preencher teams.players com monstros ativos', () => {
        const state = startGroupBattle({
            selectedPlayerIds: ['p1'],
            kind: 'trainer',
            eligiblePlayerIds: ['p1', 'p2'],
            playersData: mockPlayersData,
            options: { enemyLevel: 1 },
            rollD20Fn: mockRollD20
        });

        expect(state.teams.players[0].playerId).toBe('p1');
        expect(state.teams.players[0].activeMonster.name).toBe('Monstrinho 1');
        expect(state.teams.players[0].activeMonster.hp).toBe(50);
        expect(state.teams.players[0].activeMonster.spd).toBe(10);
    });

    it('deve lançar erro se nenhum jogador selecionado', () => {
        expect(() => {
            startGroupBattle({
                selectedPlayerIds: [],
                kind: 'trainer',
                eligiblePlayerIds: ['p1'],
                playersData: mockPlayersData,
                rollD20Fn: mockRollD20
            });
        }).toThrow('Pelo menos 1 jogador deve ser selecionado');
    });

    it('deve lançar erro se jogador selecionado não está em eligiblePlayerIds', () => {
        expect(() => {
            startGroupBattle({
                selectedPlayerIds: ['p1', 'p4'],
                kind: 'trainer',
                eligiblePlayerIds: ['p1', 'p2'],
                playersData: mockPlayersData,
                rollD20Fn: mockRollD20
            });
        }).toThrow('Jogador p4 não está em eligiblePlayerIds');
    });

    it('deve lançar erro se jogador não tem monstrinho ativo', () => {
        const playersWithoutMonster = [
            {
                id: 'p1',
                name: 'Jogador 1',
                team: []
            }
        ];

        expect(() => {
            startGroupBattle({
                selectedPlayerIds: ['p1'],
                kind: 'trainer',
                eligiblePlayerIds: ['p1'],
                playersData: playersWithoutMonster,
                rollD20Fn: mockRollD20
            });
        }).toThrow('não tem monstrinho ativo');
    });

    it('deve lançar erro se monstrinho está desmaiado', () => {
        const playersWithFainted = [
            {
                id: 'p1',
                name: 'Jogador 1',
                team: [{
                    uid: 'm1',
                    name: 'Monstrinho 1',
                    hp: 0, // Desmaiado
                    hpMax: 50,
                    spd: 10
                }]
            }
        ];

        expect(() => {
            startGroupBattle({
                selectedPlayerIds: ['p1'],
                kind: 'trainer',
                eligiblePlayerIds: ['p1'],
                playersData: playersWithFainted,
                rollD20Fn: mockRollD20
            });
        }).toThrow('está desmaiado');
    });

    it('deve gerar número correto de inimigos para 1-2 jogadores', () => {
        const state = startGroupBattle({
            selectedPlayerIds: ['p1'],
            kind: 'trainer',
            eligiblePlayerIds: ['p1', 'p2'],
            playersData: mockPlayersData,
            options: { enemyLevel: 1 },
            rollD20Fn: mockRollD20
        });

        // 1-2 jogadores → 2-3 inimigos
        expect(state.teams.enemies.length).toBeGreaterThanOrEqual(2);
        expect(state.teams.enemies.length).toBeLessThanOrEqual(3);
    });

    it('deve iniciar batalha na fase dos jogadores', () => {
        const state = startGroupBattle({
            selectedPlayerIds: ['p1', 'p2'],
            kind: 'trainer',
            eligiblePlayerIds: ['p1', 'p2'],
            playersData: mockPlayersData,
            options: { enemyLevel: 1 },
            rollD20Fn: mockRollD20
        });

        expect(state.turn.phase).toBe('players');
        expect(state.turn.visibleBanner).toBe('Vez dos Jogadores');
        expect(state.turn.round).toBe(1);
    });
});

describe('beginPhase - Iniciar Fase', () => {
    const mockState = {
        id: 'GB_test',
        kind: 'trainer',
        status: 'active',
        roster: {
            eligiblePlayerIds: ['p1', 'p2'],
            participants: [
                { playerId: 'p1', joinedAtRound: 1, isActive: true },
                { playerId: 'p2', joinedAtRound: 1, isActive: true }
            ],
            notJoined: [],
            escaped: [],
            reinforcementsQueue: []
        },
        teams: {
            players: [
                {
                    playerId: 'p1',
                    activeMonster: { hp: 50, hpMax: 50, spd: 10 }
                },
                {
                    playerId: 'p2',
                    activeMonster: { hp: 40, hpMax: 40, spd: 8 }
                }
            ],
            enemies: [
                { hp: 30, hpMax: 30, spd: 5, name: 'Inimigo 1' },
                { hp: 35, hpMax: 35, spd: 6, name: 'Inimigo 2' }
            ]
        },
        turn: {
            phase: 'players',
            order: [],
            index: 0,
            currentActorId: null,
            round: 1,
            visibleBanner: ''
        },
        rules: {
            allowLateJoin: true
        },
        log: []
    };

    it('deve iniciar fase dos jogadores corretamente', () => {
        const state = beginPhase(mockState, 'players', {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.phase).toBe('players');
        expect(state.turn.visibleBanner).toBe('Vez dos Jogadores');
        expect(state.turn.order.length).toBe(2);
        expect(state.turn.order[0].side).toBe('player');
        expect(state.turn.index).toBe(0);
        expect(state.turn.currentActorId).toBeDefined();
    });

    it('deve iniciar fase dos inimigos corretamente', () => {
        const state = beginPhase(mockState, 'enemies', {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.phase).toBe('enemies');
        expect(state.turn.visibleBanner).toBe('Vez dos Inimigos');
        expect(state.turn.order.length).toBe(2);
        expect(state.turn.order[0].side).toBe('enemy');
        expect(state.turn.index).toBe(0);
    });

    it('deve ordenar atores por SPD descendente', () => {
        const state = beginPhase(mockState, 'players', {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        // p1 tem SPD 10, p2 tem SPD 8
        expect(state.turn.order[0].id).toBe('p1');
        expect(state.turn.order[1].id).toBe('p2');
    });

    it('deve aplicar tiebreak para empates de SPD', () => {
        rollCounter = 0;
        
        const stateWithTie = {
            ...mockState,
            teams: {
                ...mockState.teams,
                players: [
                    {
                        playerId: 'p1',
                        activeMonster: { hp: 50, hpMax: 50, spd: 10 }
                    },
                    {
                        playerId: 'p2',
                        activeMonster: { hp: 40, hpMax: 40, spd: 10 } // Mesmo SPD
                    }
                ]
            }
        };

        const state = beginPhase(stateWithTie, 'players', {
            playersData: [],
            rollD20Fn: mockRollD20Incremental
        });

        // Ambos têm SPD 10, mas devem ter tiebreak aplicado
        expect(state.turn.order[0]._tiebreak).toBeGreaterThanOrEqual(1);
        expect(state.turn.order[1]._tiebreak).toBeGreaterThanOrEqual(1);
        expect(state.turn.order[0]._tiebreak).toBeGreaterThan(state.turn.order[1]._tiebreak);
    });

    it('deve ignorar jogadores com monstros mortos', () => {
        const stateWithDead = {
            ...mockState,
            teams: {
                ...mockState.teams,
                players: [
                    {
                        playerId: 'p1',
                        activeMonster: { hp: 50, hpMax: 50, spd: 10 }
                    },
                    {
                        playerId: 'p2',
                        activeMonster: { hp: 0, hpMax: 40, spd: 8 } // Morto
                    }
                ]
            }
        };

        const state = beginPhase(stateWithDead, 'players', {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.order.length).toBe(1);
        expect(state.turn.order[0].id).toBe('p1');
    });

    it('deve ignorar inimigos mortos', () => {
        const stateWithDeadEnemy = {
            ...mockState,
            teams: {
                ...mockState.teams,
                enemies: [
                    { hp: 30, hpMax: 30, spd: 5, name: 'Inimigo 1' },
                    { hp: 0, hpMax: 35, spd: 6, name: 'Inimigo 2' } // Morto
                ]
            }
        };

        const state = beginPhase(stateWithDeadEnemy, 'enemies', {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.order.length).toBe(1);
        expect(state.turn.order[0].id).toBe(0); // Índice do primeiro inimigo
    });

    it('deve lançar erro para fase inválida', () => {
        expect(() => {
            beginPhase(mockState, 'invalid', {
                playersData: [],
                rollD20Fn: mockRollD20
            });
        }).toThrow('phase deve ser "players" ou "enemies"');
    });

    it('deve adicionar log ao iniciar fase', () => {
        const state = beginPhase(mockState, 'players', {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.log.length).toBeGreaterThan(0);
        const lastLog = state.log[state.log.length - 1];
        expect(lastLog.type).toBe('TURN_PHASE');
        expect(lastLog.text).toContain('Vez dos Jogadores');
    });
});

describe('advanceTurn - Avançar Turno', () => {
    const createMockState = (phase, index, orderLength) => ({
        id: 'GB_test',
        kind: 'trainer',
        status: 'active',
        roster: {
            eligiblePlayerIds: ['p1', 'p2'],
            participants: [
                { playerId: 'p1', joinedAtRound: 1, isActive: true },
                { playerId: 'p2', joinedAtRound: 1, isActive: true }
            ],
            notJoined: [],
            escaped: [],
            reinforcementsQueue: []
        },
        teams: {
            players: [
                {
                    playerId: 'p1',
                    activeMonster: { hp: 50, hpMax: 50, spd: 10 }
                },
                {
                    playerId: 'p2',
                    activeMonster: { hp: 40, hpMax: 40, spd: 8 }
                }
            ],
            enemies: [
                { hp: 30, hpMax: 30, spd: 5, name: 'Inimigo 1' },
                { hp: 35, hpMax: 35, spd: 6, name: 'Inimigo 2' }
            ]
        },
        turn: {
            phase,
            order: Array.from({ length: orderLength }, (_, i) => ({
                side: phase,
                id: phase === 'players' ? `p${i + 1}` : i,
                name: phase === 'players' ? `Jogador ${i + 1}` : `Inimigo ${i + 1}`,
                spd: 10 - i
            })),
            index,
            currentActorId: phase === 'players' ? `p${index + 1}` : index,
            round: 1,
            visibleBanner: ''
        },
        rules: {
            allowLateJoin: false
        },
        log: []
    });

    it('deve avançar para próximo ator dentro da mesma fase', () => {
        const initialState = createMockState('players', 0, 2);
        
        const state = advanceTurn(initialState, {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.phase).toBe('players');
        expect(state.turn.index).toBe(1);
        expect(state.turn.currentActorId).toBe('p2');
    });

    it('deve mudar de fase players para enemies ao fim da ordem', () => {
        const initialState = createMockState('players', 1, 2); // Último jogador
        
        const state = advanceTurn(initialState, {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.phase).toBe('enemies');
        expect(state.turn.index).toBe(0);
        expect(state.turn.visibleBanner).toBe('Vez dos Inimigos');
    });

    it('deve incrementar rodada e voltar para players após enemies', () => {
        const initialState = createMockState('enemies', 1, 2); // Último inimigo
        
        const state = advanceTurn(initialState, {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.turn.phase).toBe('players');
        expect(state.turn.round).toBe(2);
        expect(state.turn.index).toBe(0);
        expect(state.turn.visibleBanner).toBe('Vez dos Jogadores');
    });

    it('não deve fazer nada se ordem está vazia', () => {
        const emptyState = createMockState('players', 0, 0);
        
        const state = advanceTurn(emptyState, {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state).toEqual(emptyState);
    });

    it('deve adicionar log ao avançar turno', () => {
        const initialState = createMockState('players', 0, 2);
        
        const state = advanceTurn(initialState, {
            playersData: [],
            rollD20Fn: mockRollD20
        });

        expect(state.log.length).toBeGreaterThan(0);
        const lastLog = state.log[state.log.length - 1];
        expect(lastLog.type).toBe('TURN_ADVANCE');
    });
});

describe('Funções Utilitárias', () => {
    const mockState = {
        turn: {
            phase: 'players',
            order: [
                { side: 'player', id: 'p1', name: 'Jogador 1', spd: 10 },
                { side: 'player', id: 'p2', name: 'Jogador 2', spd: 8 }
            ],
            index: 0,
            currentActorId: 'p1',
            round: 1,
            visibleBanner: 'Vez dos Jogadores'
        }
    };

    it('isActorTurn deve retornar true para ator atual', () => {
        expect(isActorTurn(mockState, 'p1')).toBe(true);
        expect(isActorTurn(mockState, 'p2')).toBe(false);
    });

    it('getCurrentActor deve retornar ator correto', () => {
        const actor = getCurrentActor(mockState);
        expect(actor.id).toBe('p1');
        expect(actor.side).toBe('player');
    });

    it('getCurrentActor deve retornar null se ordem vazia', () => {
        const emptyState = {
            turn: {
                order: [],
                index: 0
            }
        };
        
        expect(getCurrentActor(emptyState)).toBe(null);
    });

    it('getTurnInfo deve retornar informações completas', () => {
        const info = getTurnInfo(mockState);
        
        expect(info.phase).toBe('players');
        expect(info.round).toBe(1);
        expect(info.actorId).toBe('p1');
        expect(info.isPlayerPhase).toBe(true);
        expect(info.isEnemyPhase).toBe(false);
        expect(info.banner).toBe('Vez dos Jogadores');
        expect(info.actor).toBeDefined();
    });
});
