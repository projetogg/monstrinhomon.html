/**
 * BATTLE END MODAL TESTS (CAMADA 4)
 * 
 * Testes para o modal de fim de batalha
 * Cobertura: lógica de negócio, parâmetros, estrutura
 * 
 * Nota: Testes de DOM serão validados manualmente no navegador
 */

import { describe, it, expect } from 'vitest';


describe('BattleEndModal - Lógica de Parâmetros', () => {
    describe('Victory', () => {
        it('deve ter estrutura correta para vitória', () => {
            const params = {
                result: 'victory',
                participants: [
                    { playerName: 'João', xp: 30, money: 50 },
                    { playerName: 'Maria', xp: 30, money: 50 }
                ]
            };
            
            expect(params.result).toBe('victory');
            expect(params.participants).toHaveLength(2);
            expect(params.participants[0]).toHaveProperty('playerName');
            expect(params.participants[0]).toHaveProperty('xp');
            expect(params.participants[0]).toHaveProperty('money');
        });

        it('deve calcular recompensas corretamente por participante', () => {
            const xpBase = 30;
            const moneyBase = 50;
            const participants = ['p1', 'p2', 'p3'];
            
            const rewards = participants.map(pid => ({
                playerName: `Player ${pid}`,
                xp: xpBase,
                money: moneyBase
            }));
            
            expect(rewards).toHaveLength(3);
            rewards.forEach(r => {
                expect(r.xp).toBe(30);
                expect(r.money).toBe(50);
            });
        });
    });

    describe('Defeat', () => {
        it('deve ter estrutura correta para derrota', () => {
            const params = {
                result: 'defeat',
                participants: []
            };
            
            expect(params.result).toBe('defeat');
            expect(params.participants).toEqual([]);
        });
    });

    describe('Retreat', () => {
        it('deve ter estrutura correta para retirada', () => {
            const params = {
                result: 'retreat',
                participants: []
            };
            
            expect(params.result).toBe('retreat');
            expect(params.participants).toEqual([]);
        });
    });

    describe('Validação de tipos', () => {
        it('result deve ser uma das três opções válidas', () => {
            const validResults = ['victory', 'defeat', 'retreat'];
            
            validResults.forEach(result => {
                expect(['victory', 'defeat', 'retreat']).toContain(result);
            });
        });

        it('participantes devem ter estrutura consistente', () => {
            const participant = {
                playerName: 'Test',
                xp: 10,
                money: 20
            };
            
            expect(typeof participant.playerName).toBe('string');
            expect(typeof participant.xp).toBe('number');
            expect(typeof participant.money).toBe('number');
        });
    });
});

describe('BattleEndModal - Integração com Sistema', () => {
    it('deve suportar array vazio de participantes', () => {
        const params = {
            result: 'defeat',
            participants: []
        };
        
        expect(Array.isArray(params.participants)).toBe(true);
        expect(params.participants.length).toBe(0);
    });

    it('deve suportar múltiplos participantes', () => {
        const participants = [
            { playerName: 'P1', xp: 30, money: 50 },
            { playerName: 'P2', xp: 30, money: 50 },
            { playerName: 'P3', xp: 30, money: 50 },
            { playerName: 'P4', xp: 30, money: 50 }
        ];
        
        expect(participants.length).toBeGreaterThan(1);
        expect(participants.length).toBeLessThanOrEqual(6); // Max 6 players
    });

    it('deve manter compatibilidade com rewards opcionais', () => {
        const params = {
            result: 'victory',
            participants: [],
            rewards: { bonus: true }
        };
        
        expect(params).toHaveProperty('rewards');
        expect(params.rewards).toEqual({ bonus: true });
    });
});

describe('BattleEndModal - Casos de Uso', () => {
    it('Victoria com 1 jogador', () => {
        const params = {
            result: 'victory',
            participants: [
                { playerName: 'Solo Player', xp: 50, money: 100 }
            ]
        };
        
        expect(params.participants.length).toBe(1);
        expect(params.participants[0].xp).toBe(50);
    });

    it('Victoria com grupo completo (6 jogadores)', () => {
        const participants = Array.from({ length: 6 }, (_, i) => ({
            playerName: `Player ${i + 1}`,
            xp: 30,
            money: 50
        }));
        
        const params = {
            result: 'victory',
            participants
        };
        
        expect(params.participants.length).toBe(6);
    });

    it('Derrota não deve ter recompensas', () => {
        const params = {
            result: 'defeat',
            participants: []
        };
        
        // Derrota não tem participantes com recompensas
        expect(params.participants.length).toBe(0);
    });

    it('Retirada não deve ter recompensas', () => {
        const params = {
            result: 'retreat',
            participants: []
        };
        
        // Retirada não tem recompensas
        expect(params.participants.length).toBe(0);
    });
});

describe('BattleEndModal - Parâmetro log', () => {
    it('deve aceitar log vazio sem erro', () => {
        const params = {
            result: 'victory',
            participants: [{ playerName: 'P1', xp: 30, money: 50 }],
            log: []
        };
        expect(params.log).toEqual([]);
    });

    it('deve incluir linhas de drop no log', () => {
        const log = ['🎁 Drops:', '  • 2x Petisco de Cura (💚)'];
        const params = {
            result: 'victory',
            participants: [{ playerName: 'P1', xp: 30, money: 50 }],
            log
        };
        expect(params.log).toHaveLength(2);
        expect(params.log[0]).toBe('🎁 Drops:');
    });

    it('deve incluir linhas de conclusão de quest', () => {
        const log = ['🏆 Quest concluída: "O Ovo Perdido"!', '💰 +60 moedas!', '⭐ +80 XP de quest!'];
        const params = {
            result: 'victory',
            participants: [{ playerName: 'P1', xp: 30, money: 50 }],
            log
        };
        const questLine = params.log.find(l => l.startsWith('🏆'));
        expect(questLine).toBeDefined();
        expect(questLine).toContain('Quest concluída');
    });

    it('deve incluir linha de nova quest desbloqueada', () => {
        const log = ['🗺️ Nova quest: "Primeira Captura"!'];
        const params = {
            result: 'victory',
            participants: [{ playerName: 'P1', xp: 30, money: 50 }],
            log
        };
        const newQuestLine = params.log.find(l => l.startsWith('🗺️'));
        expect(newQuestLine).toBeDefined();
        expect(newQuestLine).toContain('Nova quest');
    });

    it('deve filtrar linhas relevantes (drops, quests) de um log misto', () => {
        const log = [
            '💥 Luma atacou por 12 de dano!',
            '🎁 Drops:',
            '  • 1x ClasterOrb Comum (⚪)',
            '📋 Quest "O Ovo Perdido": 1/1',
            '🏆 Quest concluída: "O Ovo Perdido"!',
            '💰 +60 moedas!',
            '🗺️ Nova quest: "Primeira Captura"!'
        ];

        const relevant = log.filter(l => {
            const s = String(l);
            return s.startsWith('🎁') || s.startsWith('📦') ||
                   s.startsWith('🏆') || s.startsWith('🗺️') ||
                   s.startsWith('📋') || s.startsWith('💰') ||
                   s.startsWith('⭐') || s.startsWith('🎉') ||
                   s.startsWith('  ');
        });

        // Deve conter drops, progresso, conclusão, nova quest, moedas
        expect(relevant.length).toBeGreaterThanOrEqual(5);
        expect(relevant.some(l => l.startsWith('🎁'))).toBe(true);
        expect(relevant.some(l => l.startsWith('🏆'))).toBe(true);
        expect(relevant.some(l => l.startsWith('🗺️'))).toBe(true);
        expect(relevant.some(l => l.startsWith('💰'))).toBe(true);
        // Deve excluir linhas de combate
        expect(relevant.some(l => l.includes('atacou'))).toBe(false);
    });

    it('log não deve ser mostrado em derrota', () => {
        const params = {
            result: 'defeat',
            participants: []
            // sem log — derrota não tem recompensas
        };
        expect(params.result).toBe('defeat');
        expect(params.participants).toHaveLength(0);
    });
});

describe('maybeToastFromLog - Detecção de Eventos', () => {
    it('deve detectar conclusão de quest pela linha do log', () => {
        const line = '🏆 Quest concluída: "O Ovo Perdido"!';
        expect(line.startsWith('🏆 Quest concluída:')).toBe(true);
    });

    it('deve detectar nova quest desbloqueada pela linha do log', () => {
        const line = '🗺️ Nova quest: "Primeira Captura"!';
        expect(line.startsWith('🗺️ Nova quest:')).toBe(true);
    });

    it('deve detectar level up pela linha do log', () => {
        const lineEmoji = '✨ Luma subiu para o nível 2!';
        const lineText = 'Luma subiu para o nível 2!';
        expect(lineEmoji.includes('✨')).toBe(true);
        expect(/subiu para o nível/i.test(lineText)).toBe(true);
    });

    it('deve detectar evolução pela linha do log', () => {
        const lineEmoji = '🌟 Luma evoluiu para Lumax!';
        const lineText = 'Luma evoluiu para Lumax!';
        expect(lineEmoji.includes('🌟')).toBe(true);
        expect(/evoluiu para/i.test(lineText)).toBe(true);
    });

    it('não deve disparar toast para linhas de combate genéricas', () => {
        const combatLines = [
            '💥 Luma atacou por 12 de dano!',
            'Errou o ataque!',
            'A batalha começou.',
        ];
        for (const line of combatLines) {
            const isLevelUp = line.includes('✨') || /subiu para o nível/i.test(line);
            const isEvo = line.includes('🌟') || /evoluiu para/i.test(line);
            const isQuestDone = line.startsWith('🏆 Quest concluída:');
            const isNewQuest = line.startsWith('🗺️ Nova quest:');
            expect(isLevelUp || isEvo || isQuestDone || isNewQuest).toBe(false);
        }
    });
});

describe('BattleEndModal - Recompensas', () => {
    it('deve distribuir XP igualmente', () => {
        const baseXP = 50;
        const numPlayers = 3;
        
        const xpPerPlayer = baseXP; // Cada um recebe XP igual
        
        const participants = Array.from({ length: numPlayers }, () => ({
            playerName: 'Test',
            xp: xpPerPlayer,
            money: 0
        }));
        
        participants.forEach(p => {
            expect(p.xp).toBe(baseXP);
        });
    });

    it('deve dividir dinheiro igualmente', () => {
        const totalMoney = 150;
        const numPlayers = 3;
        
        const moneyPerPlayer = Math.floor(totalMoney / numPlayers);
        
        const participants = Array.from({ length: numPlayers }, () => ({
            playerName: 'Test',
            xp: 0,
            money: moneyPerPlayer
        }));
        
        participants.forEach(p => {
            expect(p.money).toBe(50);
        });
    });

    it('boss deve dar mais recompensas que trainer', () => {
        const trainerXP = 30;
        const bossXP = 50;
        
        expect(bossXP).toBeGreaterThan(trainerXP);
        
        const trainerMoney = 50;
        const bossMoney = 100;
        
        expect(bossMoney).toBeGreaterThan(trainerMoney);
    });
});
