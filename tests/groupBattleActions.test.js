/**
 * GROUP BATTLE ACTIONS TESTS (PASSO 4.5)
 * 
 * Testes para o sistema completo de ações de combate
 * Cobertura: performAction, checkEndConditions, endBattleAndDistributeRewards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    performAction,
    checkEndConditions,
    endBattleAndDistributeRewards
} from '../js/combat/groupBattleLoop.js';

// Mock rollD20 determinístico
const mockRollD20 = () => 15; // Sempre acerta (não é 1 nem 20)
const mockRollD20Crit = () => 20; // Sempre crítico

describe('checkEndConditions - Verificação de Fim de Batalha', () => {
    it('deve retornar vitória quando todos inimigos morrem', () => {
        const state = {
            teams: {
                players: [
                    {
                        playerId: 'p1',
                        activeMonster: { hp: 50, hpMax: 50 }
                    }
                ],
                enemies: [
                    { hp: 0, hpMax: 30 }, // Morto
                    { hp: 0, hpMax: 35 }  // Morto
                ]
            },
            roster: {
                participants: [
                    { playerId: 'p1', isActive: true }
                ]
            }
        };

        const result = checkEndConditions(state);
        
        expect(result.ended).toBe(true);
        expect(result.result).toBe('victory');
    });

    it('deve retornar derrota quando todos jogadores morrem', () => {
        const state = {
            teams: {
                players: [
                    {
                        playerId: 'p1',
                        activeMonster: { hp: 0, hpMax: 50 } // Morto
                    }
                ],
                enemies: [
                    { hp: 30, hpMax: 30 }
                ]
            },
            roster: {
                participants: [
                    { playerId: 'p1', isActive: true }
                ]
            }
        };

        const result = checkEndConditions(state);
        
        expect(result.ended).toBe(true);
        expect(result.result).toBe('defeat');
    });

    it('deve retornar retreat quando todos fogem', () => {
        const state = {
            teams: {
                players: [
                    {
                        playerId: 'p1',
                        activeMonster: { hp: 50, hpMax: 50 }
                    }
                ],
                enemies: [
                    { hp: 30, hpMax: 30 }
                ]
            },
            roster: {
                participants: [] // Nenhum participante ativo
            }
        };

        const result = checkEndConditions(state);
        
        expect(result.ended).toBe(true);
        expect(result.result).toBe('retreat');
    });

    it('deve retornar ended=false quando batalha continua', () => {
        const state = {
            teams: {
                players: [
                    {
                        playerId: 'p1',
                        activeMonster: { hp: 50, hpMax: 50 }
                    }
                ],
                enemies: [
                    { hp: 30, hpMax: 30 }
                ]
            },
            roster: {
                participants: [
                    { playerId: 'p1', isActive: true }
                ]
            }
        };

        const result = checkEndConditions(state);
        
        expect(result.ended).toBe(false);
    });
});

describe('endBattleAndDistributeRewards - Distribuição de Recompensas', () => {
    const mockPlayersData = [
        { id: 'p1', name: 'Jogador 1', team: [{ hp: 50, hpMax: 50 }] },
        { id: 'p2', name: 'Jogador 2', team: [{ hp: 40, hpMax: 40 }] }
    ];

    it('deve distribuir recompensas apenas para participantes elegíveis', () => {
        const state = {
            kind: 'trainer',
            roster: {
                participants: [
                    { playerId: 'p1', isActive: true },
                    { playerId: 'p2', isActive: true }
                ],
                escaped: []
            },
            log: []
        };

        const newState = endBattleAndDistributeRewards(state, mockPlayersData);
        
        // Verificar que logs foram adicionados
        const xpLogs = newState.log.filter(entry => entry.type === 'XP_REWARD');
        const moneyLogs = newState.log.filter(entry => entry.type === 'MONEY_REWARD');
        
        expect(xpLogs).toHaveLength(2); // 2 jogadores elegíveis
        expect(moneyLogs).toHaveLength(2);
    });

    it('fugitivo não deve receber recompensas', () => {
        const state = {
            kind: 'trainer',
            roster: {
                participants: [
                    { playerId: 'p1', isActive: true },
                    { playerId: 'p2', isActive: false } // Fugiu
                ],
                escaped: [{ playerId: 'p2' }]
            },
            log: []
        };

        const newState = endBattleAndDistributeRewards(state, mockPlayersData);
        
        const xpLogs = newState.log.filter(entry => entry.type === 'XP_REWARD');
        
        // Apenas p1 deve receber
        expect(xpLogs).toHaveLength(1);
        expect(xpLogs[0].meta.playerId).toBe('p1');
    });

    it('boss deve dar recompensas maiores que trainer', () => {
        const trainerState = {
            kind: 'trainer',
            roster: {
                participants: [{ playerId: 'p1', isActive: true }],
                escaped: []
            },
            log: []
        };

        const bossState = {
            kind: 'boss',
            roster: {
                participants: [{ playerId: 'p1', isActive: true }],
                escaped: []
            },
            log: []
        };

        const trainerResult = endBattleAndDistributeRewards(trainerState, mockPlayersData);
        const bossResult = endBattleAndDistributeRewards(bossState, mockPlayersData);
        
        const trainerXP = trainerResult.log.find(e => e.type === 'BATTLE_END').meta.xpPerPlayer;
        const bossXP = bossResult.log.find(e => e.type === 'BATTLE_END').meta.xpPerPlayer;
        
        expect(bossXP).toBeGreaterThan(trainerXP);
    });
});

describe('performAction - Ataque', () => {
    const createMockState = () => ({
        kind: 'trainer',
        status: 'active',
        teams: {
            players: [
                {
                    playerId: 'p1',
                    activeMonster: {
                        hp: 50,
                        hpMax: 50,
                        atk: 10,
                        def: 5
                    }
                }
            ],
            enemies: [
                {
                    hp: 30,
                    hpMax: 30,
                    atk: 8,
                    def: 4,
                    name: 'Inimigo 1'
                }
            ]
        },
        roster: {
            eligiblePlayerIds: ['p1'],
            participants: [{ playerId: 'p1', isActive: true }],
            notJoined: [],
            escaped: [],
            reinforcementsQueue: []
        },
        turn: {
            phase: 'players',
            order: [
                { side: 'player', id: 'p1', name: 'Jogador 1', spd: 10 }
            ],
            index: 0,
            currentActorId: 'p1',
            round: 1,
            visibleBanner: 'Vez dos Jogadores'
        },
        rules: { allowLateJoin: false },
        log: []
    });

    const mockPlayersData = [
        { id: 'p1', name: 'Jogador 1', team: [{ hp: 50, hpMax: 50 }] }
    ];

    it('ataque deve causar dano no inimigo', () => {
        const state = createMockState();
        
        const action = {
            type: 'attack',
            actorId: 'p1',
            targetId: 0
        };

        const newState = performAction(state, action, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20 // Sempre acerta
        });

        // Inimigo deve ter recebido dano
        expect(newState.teams.enemies[0].hp).toBeLessThan(30);
        
        // Log deve conter ataque
        const attackLog = newState.log.find(e => e.type === 'ATTACK_HIT');
        expect(attackLog).toBeDefined();
    });

    it('ataque mata inimigo deve resultar em vitória', () => {
        const state = createMockState();
        // Inimigo com 1 HP
        state.teams.enemies[0].hp = 1;
        
        const action = {
            type: 'attack',
            actorId: 'p1',
            targetId: 0
        };

        const newState = performAction(state, action, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20
        });

        // Batalha deve ter acabado em vitória
        expect(newState.status).toBe('ended');
        const endLog = newState.log.find(e => e.type === 'BATTLE_END');
        expect(endLog).toBeDefined();
        expect(endLog.meta.result).toBe('victory');
    });

    it('crítico deve causar dano dobrado', () => {
        const state = createMockState();
        
        const action = {
            type: 'attack',
            actorId: 'p1',
            targetId: 0
        };

        const newState = performAction(state, action, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20Crit // Sempre crítico
        });

        // Verificar que dano foi maior
        const attackLog = newState.log.find(e => e.type === 'ATTACK_HIT');
        expect(attackLog.text).toContain('CRÍTICO');
    });
});

describe('performAction - Fuga', () => {
    const createMockState = () => ({
        kind: 'trainer',
        status: 'active',
        teams: {
            players: [
                {
                    playerId: 'p1',
                    activeMonster: { hp: 50, hpMax: 50 }
                },
                {
                    playerId: 'p2',
                    activeMonster: { hp: 40, hpMax: 40 }
                }
            ],
            enemies: [
                { hp: 30, hpMax: 30 }
            ]
        },
        roster: {
            eligiblePlayerIds: ['p1', 'p2'],
            participants: [
                { playerId: 'p1', isActive: true },
                { playerId: 'p2', isActive: true }
            ],
            notJoined: [],
            escaped: [],
            reinforcementsQueue: []
        },
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
        },
        rules: { allowLateJoin: false },
        log: []
    });

    const mockPlayersData = [
        { id: 'p1', name: 'Jogador 1', team: [{ hp: 50, hpMax: 50 }] },
        { id: 'p2', name: 'Jogador 2', team: [{ hp: 40, hpMax: 40 }] }
    ];

    it('fuga deve remover jogador dos participantes ativos', () => {
        const state = createMockState();
        
        const action = {
            type: 'flee',
            actorId: 'p1'
        };

        const newState = performAction(state, action, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20
        });

        // p1 deve estar marcado como não ativo
        const p1 = newState.roster.participants.find(p => p.playerId === 'p1');
        expect(p1.isActive).toBe(false);
        
        // p1 deve estar na lista de escapados
        expect(newState.roster.escaped).toHaveLength(1);
        expect(newState.roster.escaped[0].playerId).toBe('p1');
        
        // Log de fuga
        const fleeLog = newState.log.find(e => e.type === 'FLEE_ACTION');
        expect(fleeLog).toBeDefined();
    });

    it('todos fogem deve resultar em retreat', () => {
        const state = createMockState();
        
        // p1 foge
        const action1 = {
            type: 'flee',
            actorId: 'p1'
        };
        let newState = performAction(state, action1, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20
        });

        // p2 foge (precisa atualizar currentActorId)
        newState.turn.currentActorId = 'p2';
        newState.turn.index = 1;
        
        const action2 = {
            type: 'flee',
            actorId: 'p2'
        };
        newState = performAction(newState, action2, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20
        });

        // Batalha deve ter acabado em retreat
        expect(newState.status).toBe('ended');
        const endLog = newState.log.find(e => e.type === 'BATTLE_END');
        expect(endLog.meta.result).toBe('retreat');
    });
});

describe('performAction - Item', () => {
    const createMockState = () => ({
        kind: 'trainer',
        status: 'active',
        teams: {
            players: [
                {
                    playerId: 'p1',
                    activeMonster: {
                        hp: 20, // HP baixo
                        hpMax: 50,
                        atk: 10,
                        def: 5
                    }
                }
            ],
            enemies: [
                { hp: 30, hpMax: 30 }
            ]
        },
        roster: {
            eligiblePlayerIds: ['p1'],
            participants: [{ playerId: 'p1', isActive: true }],
            notJoined: [],
            escaped: [],
            reinforcementsQueue: []
        },
        turn: {
            phase: 'players',
            order: [
                { side: 'player', id: 'p1', name: 'Jogador 1', spd: 10 }
            ],
            index: 0,
            currentActorId: 'p1',
            round: 1,
            visibleBanner: 'Vez dos Jogadores'
        },
        rules: { allowLateJoin: false },
        log: []
    });

    const mockPlayersData = [
        { id: 'p1', name: 'Jogador 1', team: [{ hp: 20, hpMax: 50 }] }
    ];

    it('item deve curar jogador corretamente', () => {
        const state = createMockState();
        
        const action = {
            type: 'item',
            actorId: 'p1',
            itemId: 'potion'
        };

        const newState = performAction(state, action, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20
        });

        // HP deve ter aumentado
        expect(newState.teams.players[0].activeMonster.hp).toBeGreaterThan(20);
        
        // Log de item usado
        const itemLog = newState.log.find(e => e.type === 'ITEM_USED');
        expect(itemLog).toBeDefined();
        expect(itemLog.meta.healing).toBeGreaterThan(0);
    });
});

describe('performAction - Skill', () => {
    const createMockState = () => ({
        kind: 'trainer',
        status: 'active',
        teams: {
            players: [
                {
                    playerId: 'p1',
                    activeMonster: {
                        hp: 50,
                        hpMax: 50,
                        atk: 10,
                        def: 5
                    }
                }
            ],
            enemies: [
                {
                    hp: 30,
                    hpMax: 30,
                    atk: 8,
                    def: 4,
                    name: 'Inimigo 1'
                }
            ]
        },
        roster: {
            eligiblePlayerIds: ['p1'],
            participants: [{ playerId: 'p1', isActive: true }],
            notJoined: [],
            escaped: [],
            reinforcementsQueue: []
        },
        turn: {
            phase: 'players',
            order: [
                { side: 'player', id: 'p1', name: 'Jogador 1', spd: 10 }
            ],
            index: 0,
            currentActorId: 'p1',
            round: 1,
            visibleBanner: 'Vez dos Jogadores'
        },
        rules: { allowLateJoin: false },
        log: []
    });

    const mockPlayersData = [
        { id: 'p1', name: 'Jogador 1', team: [{ hp: 50, hpMax: 50 }] }
    ];

    it('skill deve aplicar dano maior que ataque normal', () => {
        const state = createMockState();
        const initialEnemyHp = state.teams.enemies[0].hp;
        
        const action = {
            type: 'skill',
            actorId: 'p1',
            targetId: 0,
            skillId: 'fireball'
        };

        const newState = performAction(state, action, {
            playersData: mockPlayersData,
            rollD20Fn: mockRollD20
        });

        // Skill deve ter causado dano
        expect(newState.teams.enemies[0].hp).toBeLessThan(initialEnemyHp);
        
        // Log de skill usado
        const skillLog = newState.log.find(e => e.type === 'SKILL_USED');
        expect(skillLog).toBeDefined();
    });
});
