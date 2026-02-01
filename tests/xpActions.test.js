/**
 * XP ACTIONS TESTS (PR8B)
 * 
 * Testes para funções de orquestração de progressão do xpActions.js
 * Cobertura: giveXP, levelUpMonster, handleVictoryRewards
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { giveXP, levelUpMonster, handleVictoryRewards } from '../js/progression/xpActions.js';

describe('giveXP - Dar XP e processar level ups', () => {
    
    let mockDeps;
    let mockMonster;
    let mockLog;
    
    beforeEach(() => {
        mockLog = [];
        
        mockMonster = {
            id: 'mi_test',
            name: 'Luma',
            level: 5,
            xp: 0,
            xpNeeded: 70, // calcXpNeeded(5) = 70
            hp: 50,
            hpMax: 50,
            friendship: 50
        };
        
        mockDeps = {
            state: {
                currentEncounter: { log: [] }
            },
            constants: {
                DEFAULT_FRIENDSHIP: 50
            },
            helpers: {
                ensureMonsterProgressFields: (mon) => {
                    mon.level = mon.level || 1;
                    mon.xp = mon.xp || 0;
                    mon.xpNeeded = mon.xpNeeded || 47;
                },
                getFriendshipBonuses: (friendship) => ({
                    xpMultiplier: 1.0,
                    critChance: 0,
                    statBonus: 0,
                    surviveChance: 0
                }),
                formatFriendshipBonusPercent: (mult) => Math.round((mult - 1) * 100),
                calcXpNeeded: (level) => Math.round(40 + 6 * level + 0.6 * (level * level)),
                recalculateStatsFromTemplate: (mon) => {},
                updateFriendship: (mon, event) => {},
                maybeEvolveAfterLevelUp: (mon, log, hpPct) => {},
                maybeUpgradeSkillsModelB: (mon, log) => {}
            }
        };
    });

    it('deve adicionar XP ao monstro', () => {
        giveXP(mockDeps, mockMonster, 30, mockLog);
        expect(mockMonster.xp).toBe(30);
    });

    it('deve logar XP recebido', () => {
        giveXP(mockDeps, mockMonster, 30, mockLog);
        expect(mockLog).toHaveLength(1);
        expect(mockLog[0]).toContain('Luma');
        expect(mockLog[0]).toContain('+30 XP');
    });

    it('deve aplicar multiplicador de amizade ao XP', () => {
        mockDeps.helpers.getFriendshipBonuses = () => ({
            xpMultiplier: 1.10,
            critChance: 0,
            statBonus: 0,
            surviveChance: 0
        });
        
        // Dar XP pequeno para evitar level up
        mockMonster.xpNeeded = 200; // Aumentar threshold para evitar level up
        giveXP(mockDeps, mockMonster, 100, mockLog);
        expect(mockMonster.xp).toBe(110); // 100 * 1.10 = 110
        expect(mockLog[0]).toContain('Bônus Amizade');
    });

    it('deve processar level up quando XP suficiente', () => {
        let levelUpCalled = false;
        mockDeps.helpers.calcXpNeeded = (level) => {
            levelUpCalled = true;
            return Math.round(40 + 6 * level + 0.6 * (level * level));
        };
        
        mockMonster.xp = 0;
        mockMonster.xpNeeded = 50;
        
        giveXP(mockDeps, mockMonster, 60, mockLog);
        
        // Deve ter subido de nível
        expect(mockMonster.level).toBe(6);
        expect(levelUpCalled).toBe(true);
    });

    it('deve processar múltiplos level ups', () => {
        mockMonster.xp = 0;
        mockMonster.xpNeeded = 50;
        
        // Mock para permitir múltiplos level ups
        let levelUpCount = 0;
        const originalCalcXpNeeded = mockDeps.helpers.calcXpNeeded;
        mockDeps.helpers.calcXpNeeded = (level) => {
            levelUpCount++;
            return originalCalcXpNeeded(level);
        };
        
        giveXP(mockDeps, mockMonster, 200, mockLog); // XP suficiente para vários níveis
        
        expect(levelUpCount).toBeGreaterThan(1);
        expect(mockMonster.level).toBeGreaterThan(5);
    });

    it('não deve fazer nada se monstro for null', () => {
        giveXP(mockDeps, null, 50, mockLog);
        expect(mockLog).toHaveLength(0);
    });

    it('não deve fazer nada se amount for 0', () => {
        giveXP(mockDeps, mockMonster, 0, mockLog);
        expect(mockMonster.xp).toBe(0);
        expect(mockLog).toHaveLength(0);
    });

    it('não deve fazer nada se amount for negativo', () => {
        giveXP(mockDeps, mockMonster, -50, mockLog);
        expect(mockMonster.xp).toBe(0);
        expect(mockLog).toHaveLength(0);
    });

    it('deve usar log do encounter se logArr não fornecido', () => {
        mockDeps.state.currentEncounter.log = [];
        giveXP(mockDeps, mockMonster, 30, null);
        expect(mockDeps.state.currentEncounter.log).toHaveLength(1);
    });
});

describe('levelUpMonster - Processar level up', () => {
    
    let mockDeps;
    let mockMonster;
    let mockLog;
    
    beforeEach(() => {
        mockLog = [];
        
        mockMonster = {
            id: 'mi_test',
            name: 'Trok',
            level: 10,
            xp: 0,
            xpNeeded: 100,
            hp: 80,
            hpMax: 100,
            ene: 20,
            eneMax: 28
        };
        
        mockDeps = {
            state: {
                currentEncounter: { log: [] }
            },
            helpers: {
                ensureMonsterProgressFields: (mon) => {
                    mon.level = mon.level || 1;
                    mon.xp = mon.xp || 0;
                },
                calcXpNeeded: (level) => Math.round(40 + 6 * level + 0.6 * (level * level)),
                recalculateStatsFromTemplate: (mon) => {
                    mon.atk = 15 + mon.level * 2;
                    mon.def = 12 + mon.level * 2;
                },
                updateFriendship: (mon, event) => {},
                maybeEvolveAfterLevelUp: (mon, log, hpPct) => {},
                maybeUpgradeSkillsModelB: (mon, log) => {}
            }
        };
    });

    it('deve incrementar nível', () => {
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(mockMonster.level).toBe(11);
    });

    it('deve aumentar HP máximo (fórmula 1.04 + 2)', () => {
        const hpMaxBefore = mockMonster.hpMax;
        levelUpMonster(mockDeps, mockMonster, mockLog);
        const expectedHpMax = Math.floor(hpMaxBefore * 1.04 + 2);
        expect(mockMonster.hpMax).toBe(expectedHpMax);
    });

    it('deve curar completamente ao subir de nível', () => {
        mockMonster.hp = 50; // HP parcial
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(mockMonster.hp).toBe(mockMonster.hpMax);
    });

    it('deve atualizar ENE máximo baseado no nível', () => {
        levelUpMonster(mockDeps, mockMonster, mockLog);
        const expectedEneMax = Math.floor(10 + 2 * (11 - 1)); // 10 + 2*10 = 30
        expect(mockMonster.eneMax).toBe(expectedEneMax);
    });

    it('deve restaurar ENE ao subir de nível', () => {
        mockMonster.ene = 10; // ENE parcial
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(mockMonster.ene).toBe(mockMonster.eneMax);
    });

    it('deve recalcular stats do template', () => {
        let recalculateCalled = false;
        mockDeps.helpers.recalculateStatsFromTemplate = (mon) => {
            recalculateCalled = true;
        };
        
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(recalculateCalled).toBe(true);
    });

    it('deve atualizar XP necessário para próximo nível', () => {
        levelUpMonster(mockDeps, mockMonster, mockLog);
        const expected = Math.round(40 + 6 * 11 + 0.6 * (11 * 11));
        expect(mockMonster.xpNeeded).toBe(expected);
    });

    it('deve logar level up', () => {
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(mockLog).toHaveLength(1);
        expect(mockLog[0]).toContain('Trok');
        expect(mockLog[0]).toContain('nível 11');
    });

    it('deve chamar updateFriendship com evento levelUp', () => {
        let friendshipEvent = null;
        mockDeps.helpers.updateFriendship = (mon, event) => {
            friendshipEvent = event;
        };
        
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(friendshipEvent).toBe('levelUp');
    });

    it('deve verificar evolução após level up', () => {
        let evolutionChecked = false;
        mockDeps.helpers.maybeEvolveAfterLevelUp = (mon, log, hpPct) => {
            evolutionChecked = true;
            expect(hpPct).toBeGreaterThan(0);
            expect(hpPct).toBeLessThanOrEqual(1);
        };
        
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(evolutionChecked).toBe(true);
    });

    it('deve verificar upgrade de skills', () => {
        let skillsChecked = false;
        mockDeps.helpers.maybeUpgradeSkillsModelB = (mon, log) => {
            skillsChecked = true;
        };
        
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(skillsChecked).toBe(true);
    });

    it('não deve fazer nada se monstro for null', () => {
        const logLengthBefore = mockLog.length;
        levelUpMonster(mockDeps, null, mockLog);
        expect(mockLog.length).toBe(logLengthBefore);
    });

    it('deve preservar HP% ao calcular evolução', () => {
        mockMonster.hp = 50; // 50% HP
        mockMonster.hpMax = 100;
        
        let preservedHpPct = 0;
        mockDeps.helpers.maybeEvolveAfterLevelUp = (mon, log, hpPct) => {
            preservedHpPct = hpPct;
        };
        
        levelUpMonster(mockDeps, mockMonster, mockLog);
        expect(preservedHpPct).toBeCloseTo(0.5, 2); // ~50%
    });
});

describe('handleVictoryRewards - Distribuir recompensas', () => {
    
    let mockDeps;
    let mockEncounter;
    
    beforeEach(() => {
        mockEncounter = {
            type: 'wild',
            log: [],
            wildMonster: {
                name: 'Selvagem',
                level: 8,
                rarity: 'Comum'
            }
        };
        
        const mockPlayer = {
            id: 'player1',
            name: 'Jogador 1',
            team: [{
                id: 'mi_active',
                name: 'Ativo',
                level: 5,
                xp: 0,
                xpNeeded: 70,
                hp: 50,
                hpMax: 50,
                friendship: 50
            }]
        };
        
        mockDeps = {
            state: {
                players: [mockPlayer],
                currentEncounter: mockEncounter
            },
            constants: {
                DEFAULT_FRIENDSHIP: 50
            },
            helpers: {
                updateStats: (stat, value) => {},
                calculateBattleXP: (enemy, type) => 30,
                ensureMonsterProgressFields: (mon) => {},
                getFriendshipBonuses: () => ({ xpMultiplier: 1.0 }),
                formatFriendshipBonusPercent: (m) => 0,
                calcXpNeeded: (l) => 70,
                recalculateStatsFromTemplate: (m) => {},
                updateFriendship: (m, e) => {},
                maybeEvolveAfterLevelUp: (m, l, h) => {},
                maybeUpgradeSkillsModelB: (m, l) => {}
            }
        };
    });

    it('deve calcular e distribuir XP', () => {
        handleVictoryRewards(mockDeps, mockEncounter);
        
        expect(mockEncounter.rewards).toBeDefined();
        expect(mockEncounter.rewards.xp).toBe(30);
        expect(mockEncounter.log.some(msg => msg.includes('30 XP'))).toBe(true);
    });

    it('deve marcar recompensas como concedidas', () => {
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockEncounter.rewardsGranted).toBe(true);
    });

    it('não deve conceder recompensas duas vezes', () => {
        handleVictoryRewards(mockDeps, mockEncounter);
        const logLength = mockEncounter.log.length;
        
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockEncounter.log.length).toBe(logLength); // Não adicionou mais logs
    });

    it('deve rastrear vitória nas estatísticas', () => {
        let battlesWon = 0;
        mockDeps.helpers.updateStats = (stat, value) => {
            if (stat === 'battlesWon') battlesWon += value;
        };
        
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(battlesWon).toBe(1);
    });

    it('deve rastrear XP total ganho', () => {
        let totalXp = 0;
        mockDeps.helpers.updateStats = (stat, value) => {
            if (stat === 'totalXpGained') totalXp += value;
        };
        
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(totalXp).toBe(30);
    });

    it('deve dar XP ao monstro vivo em batalha 1v1', () => {
        const monster = mockDeps.state.players[0].team[0];
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(monster.xp).toBe(30);
    });

    it('não deve dar XP a monstro morto', () => {
        mockDeps.state.players[0].team[0].hp = 0; // Monstro morto
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockDeps.state.players[0].team[0].xp).toBe(0);
    });

    it('deve distribuir XP para todos participantes vivos em batalha de grupo', () => {
        // Configurar batalha de grupo
        mockEncounter.type = 'group';
        mockEncounter.participants = ['player1', 'player2'];
        mockEncounter.enemies = [{ name: 'Boss', level: 10, rarity: 'Raro' }];
        delete mockEncounter.wildMonster;
        
        // Adicionar segundo jogador
        mockDeps.state.players.push({
            id: 'player2',
            name: 'Jogador 2',
            team: [{
                id: 'mi_active2',
                name: 'Ativo2',
                level: 6,
                xp: 0,
                xpNeeded: 80,
                hp: 60,
                hpMax: 60
            }]
        });
        
        handleVictoryRewards(mockDeps, mockEncounter);
        
        // Ambos devem ter recebido XP
        expect(mockDeps.state.players[0].team[0].xp).toBe(30);
        expect(mockDeps.state.players[1].team[0].xp).toBe(30);
    });

    it('deve usar primeiro inimigo se enemies array existe', () => {
        mockEncounter.enemies = [
            { name: 'Primeiro', level: 10, rarity: 'Raro' }
        ];
        
        let enemyUsed = null;
        mockDeps.helpers.calculateBattleXP = (enemy, type) => {
            enemyUsed = enemy;
            return 40;
        };
        
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(enemyUsed.name).toBe('Primeiro');
    });

    it('deve aplicar boss bonus se tipo for boss', () => {
        mockEncounter.type = 'boss';
        
        let typeReceived = null;
        mockDeps.helpers.calculateBattleXP = (enemy, type) => {
            typeReceived = type;
            return 50;
        };
        
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(typeReceived).toBe('boss');
        expect(mockEncounter.rewards.xp).toBe(50);
    });

    it('não deve fazer nada se encounter for null', () => {
        const result = handleVictoryRewards(mockDeps, null);
        expect(result).toBeUndefined();
    });

    it('deve logar erro se inimigo não identificado', () => {
        mockEncounter.wildMonster = null;
        mockEncounter.enemies = null;
        
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockEncounter.log.some(msg => msg.includes('identificar inimigo'))).toBe(true);
    });

    it('deve usar selectedPlayerId se fornecido', () => {
        mockEncounter.selectedPlayerId = 'player1';
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockDeps.state.players[0].team[0].xp).toBe(30);
    });

    it('deve usar currentPlayerId como fallback', () => {
        mockEncounter.currentPlayerId = 'player1';
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockDeps.state.players[0].team[0].xp).toBe(30);
    });

    it('deve usar primeiro jogador se nenhum player especificado', () => {
        // Nenhum selectedPlayerId ou currentPlayerId
        handleVictoryRewards(mockDeps, mockEncounter);
        expect(mockDeps.state.players[0].team[0].xp).toBe(30);
    });
});
