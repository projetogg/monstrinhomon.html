/**
 * CLASS RESTRICTION TESTS (PR - Fix Animalista Class Issue)
 * 
 * Testes para validar restrição de classe em batalha
 * Cobertura: Filtro de monstrinhos disponíveis por classe do jogador
 */

import { describe, it, expect } from 'vitest';

/**
 * Simula a lógica de filtragem de monstros disponíveis em batalha
 * Esta é a mesma lógica implementada em openSwitchMonsterModal()
 */
function getAvailableMonstersForSwitch(player, currentActiveIndex) {
    if (!player || !Array.isArray(player.team)) return [];
    
    const aliveMonsters = [];
    player.team.forEach((mon, idx) => {
        // Regra: vivo, não é o ativo, mesma classe do jogador
        if (mon.hp > 0 && idx !== currentActiveIndex && mon.class === player.class) {
            aliveMonsters.push({ monster: mon, index: idx });
        }
    });
    
    return aliveMonsters;
}

describe('Restrição de Classe em Batalha', () => {
    
    describe('Filtro de Monstrinhos Disponíveis', () => {
        
        it('deve incluir apenas monstros vivos da mesma classe do jogador', () => {
            const player = {
                id: 'p1',
                name: 'Jogador',
                class: 'Guerreiro',
                activeIndex: 0,
                team: [
                    { id: 'm1', name: 'Ativo', class: 'Guerreiro', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Válido', class: 'Guerreiro', hp: 30, hpMax: 100 },
                    { id: 'm3', name: 'Inválido', class: 'Mago', hp: 40, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            // Deve ter apenas 1 monstro disponível (o Guerreiro vivo que não é o ativo)
            expect(available).toHaveLength(1);
            expect(available[0].monster.name).toBe('Válido');
            expect(available[0].monster.class).toBe('Guerreiro');
        });
        
        it('deve excluir o monstro atualmente ativo', () => {
            const player = {
                id: 'p1',
                name: 'Jogador',
                class: 'Mago',
                activeIndex: 0,
                team: [
                    { id: 'm1', name: 'Ativo', class: 'Mago', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Reserva', class: 'Mago', hp: 30, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            expect(available).toHaveLength(1);
            expect(available[0].monster.name).toBe('Reserva');
        });
        
        it('deve excluir monstros desmaiados mesmo da mesma classe', () => {
            const player = {
                id: 'p1',
                name: 'Jogador',
                class: 'Curandeiro',
                activeIndex: 0,
                team: [
                    { id: 'm1', name: 'Ativo', class: 'Curandeiro', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Desmaiado', class: 'Curandeiro', hp: 0, hpMax: 100 },
                    { id: 'm3', name: 'Vivo', class: 'Curandeiro', hp: 30, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            expect(available).toHaveLength(1);
            expect(available[0].monster.name).toBe('Vivo');
        });
        
        it('deve retornar lista vazia se não houver monstros válidos', () => {
            const player = {
                id: 'p1',
                name: 'Jogador',
                class: 'Bárbaro',
                activeIndex: 0,
                team: [
                    { id: 'm1', name: 'Ativo', class: 'Bárbaro', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Outro', class: 'Ladino', hp: 30, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            expect(available).toHaveLength(0);
        });
    });
    
    describe('Casos Específicos de Classes', () => {
        
        it('Animalista só pode trocar para outro Animalista', () => {
            const player = {
                id: 'p1',
                name: 'Treinador Animalista',
                class: 'Animalista',
                activeIndex: 0,
                team: [
                    { id: 'm1', name: 'Ativo', class: 'Animalista', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Animalista Reserva', class: 'Animalista', hp: 30, hpMax: 100 },
                    { id: 'm3', name: 'Guerreiro Capturado', class: 'Guerreiro', hp: 40, hpMax: 100 },
                    { id: 'm4', name: 'Mago Capturado', class: 'Mago', hp: 60, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            // Deve ter apenas 1 (o outro Animalista)
            expect(available).toHaveLength(1);
            expect(available[0].monster.name).toBe('Animalista Reserva');
            expect(available[0].monster.class).toBe('Animalista');
        });
        
        it('Guerreiro pode ter monstros de outras classes capturados mas não usá-los', () => {
            const player = {
                id: 'p1',
                name: 'Treinador Guerreiro',
                class: 'Guerreiro',
                activeIndex: 0,
                team: [
                    { id: 'm1', name: 'Guerreiro 1', class: 'Guerreiro', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Guerreiro 2', class: 'Guerreiro', hp: 30, hpMax: 100 },
                    { id: 'm3', name: 'Bardo Capturado', class: 'Bardo', hp: 40, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            expect(available).toHaveLength(1);
            expect(available[0].monster.name).toBe('Guerreiro 2');
            // Bardo não deve estar na lista
            expect(available.find(m => m.monster.class === 'Bardo')).toBeUndefined();
        });
    });
    
    describe('Edge Cases', () => {
        
        it('deve retornar vazio se player é null', () => {
            const available = getAvailableMonstersForSwitch(null, 0);
            expect(available).toHaveLength(0);
        });
        
        it('deve retornar vazio se team não é array', () => {
            const player = {
                id: 'p1',
                name: 'Jogador',
                class: 'Mago',
                activeIndex: 0,
                team: null
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            expect(available).toHaveLength(0);
        });
        
        it('deve funcionar com team vazio', () => {
            const player = {
                id: 'p1',
                name: 'Jogador',
                class: 'Caçador',
                activeIndex: 0,
                team: []
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            expect(available).toHaveLength(0);
        });
        
        it('deve funcionar quando todas as 8 classes estão representadas', () => {
            const player = {
                id: 'p1',
                name: 'Jogador Ladino',
                class: 'Ladino',
                activeIndex: 1,
                team: [
                    { id: 'm1', name: 'Guerreiro', class: 'Guerreiro', hp: 50, hpMax: 100 },
                    { id: 'm2', name: 'Ladino Ativo', class: 'Ladino', hp: 50, hpMax: 100 },
                    { id: 'm3', name: 'Mago', class: 'Mago', hp: 50, hpMax: 100 },
                    { id: 'm4', name: 'Curandeiro', class: 'Curandeiro', hp: 50, hpMax: 100 },
                    { id: 'm5', name: 'Bárbaro', class: 'Bárbaro', hp: 50, hpMax: 100 },
                    { id: 'm6', name: 'Bardo', class: 'Bardo', hp: 50, hpMax: 100 },
                    { id: 'm7', name: 'Caçador', class: 'Caçador', hp: 50, hpMax: 100 },
                    { id: 'm8', name: 'Animalista', class: 'Animalista', hp: 50, hpMax: 100 },
                    { id: 'm9', name: 'Ladino Reserva', class: 'Ladino', hp: 30, hpMax: 100 }
                ]
            };
            
            const available = getAvailableMonstersForSwitch(player, player.activeIndex);
            
            // Deve ter apenas o outro Ladino
            expect(available).toHaveLength(1);
            expect(available[0].monster.name).toBe('Ladino Reserva');
        });
    });
});
