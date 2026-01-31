/**
 * GROUP COMBAT CORE TESTS
 * 
 * Testes para funções puras do groupCore.js
 * Cobertura: calculateTurnOrder, chooseTargetByLowestHP, 
 * isAlive, hasAlivePlayers, hasAliveEnemies, getCurrentActor, clamp
 */

import { describe, it, expect } from 'vitest';
import {
  calculateTurnOrder,
  chooseTargetByLowestHP,
  isAlive,
  hasAlivePlayers,
  hasAliveEnemies,
  getCurrentActor,
  clamp
} from '../js/combat/groupCore.js';

describe('isAlive - Verificação de Vida', () => {
  it('deve retornar true quando HP > 0', () => {
    const entity = { hp: 50 };
    expect(isAlive(entity)).toBe(true);
  });

  it('deve retornar false quando HP = 0', () => {
    const entity = { hp: 0 };
    expect(isAlive(entity)).toBe(false);
  });

  it('deve retornar false quando HP < 0', () => {
    const entity = { hp: -10 };
    expect(isAlive(entity)).toBe(false);
  });

  it('deve retornar false quando HP é null', () => {
    const entity = { hp: null };
    expect(isAlive(entity)).toBe(false);
  });

  it('deve retornar false quando entity é null', () => {
    expect(isAlive(null)).toBe(false);
  });
});

describe('clamp - Limitação de Valores', () => {
  it('deve retornar n quando n está entre min e max', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('deve retornar min quando n < min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('deve retornar max quando n > max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('deve funcionar com números negativos', () => {
    expect(clamp(-10, -20, -5)).toBe(-10);
  });
});

describe('chooseTargetByLowestHP - Seleção de Alvo', () => {
  it('deve escolher alvo com menor HP%', () => {
    const targets = [
      { id: 'a', hp: 50, hpMax: 100 }, // 50%
      { id: 'b', hp: 30, hpMax: 100 }, // 30% <- menor
      { id: 'c', hp: 80, hpMax: 100 }  // 80%
    ];
    
    expect(chooseTargetByLowestHP(targets)).toBe('b');
  });

  it('deve escolher primeiro em caso de empate de HP%', () => {
    const targets = [
      { id: 'a', hp: 50, hpMax: 100 }, // 50%
      { id: 'b', hp: 25, hpMax: 50 },  // 50%
      { id: 'c', hp: 10, hpMax: 20 }   // 50%
    ];
    
    // Deve escolher o primeiro encontrado com menor HP%
    expect(chooseTargetByLowestHP(targets)).toBe('a');
  });

  it('deve retornar null quando array vazio', () => {
    expect(chooseTargetByLowestHP([])).toBe(null);
  });

  it('deve retornar null quando targets é null', () => {
    expect(chooseTargetByLowestHP(null)).toBe(null);
  });

  it('deve funcionar com um único alvo', () => {
    const targets = [{ id: 'solo', hp: 10, hpMax: 50 }];
    expect(chooseTargetByLowestHP(targets)).toBe('solo');
  });

  it('deve considerar HP=0 como 0%', () => {
    const targets = [
      { id: 'a', hp: 50, hpMax: 100 }, // 50%
      { id: 'b', hp: 0, hpMax: 100 }   // 0% <- menor
    ];
    
    expect(chooseTargetByLowestHP(targets)).toBe('b');
  });
});

describe('getCurrentActor - Ator Atual', () => {
  it('deve retornar ator correto baseado em turnIndex', () => {
    const enc = {
      turnIndex: 1,
      turnOrder: [
        { id: 'a', name: 'Player A' },
        { id: 'b', name: 'Player B' },
        { id: 'c', name: 'Player C' }
      ]
    };
    
    const actor = getCurrentActor(enc);
    expect(actor).toEqual({ id: 'b', name: 'Player B' });
  });

  it('deve retornar primeiro ator quando turnIndex = 0', () => {
    const enc = {
      turnIndex: 0,
      turnOrder: [
        { id: 'a', name: 'Player A' },
        { id: 'b', name: 'Player B' }
      ]
    };
    
    const actor = getCurrentActor(enc);
    expect(actor).toEqual({ id: 'a', name: 'Player A' });
  });

  it('deve retornar null quando turnOrder vazio', () => {
    const enc = {
      turnIndex: 0,
      turnOrder: []
    };
    
    expect(getCurrentActor(enc)).toBe(null);
  });

  it('deve retornar null quando enc é null', () => {
    expect(getCurrentActor(null)).toBe(null);
  });

  it('deve retornar null quando turnIndex está fora do range', () => {
    const enc = {
      turnIndex: 10,
      turnOrder: [
        { id: 'a', name: 'Player A' }
      ]
    };
    
    expect(getCurrentActor(enc)).toBe(null);
  });
});

describe('hasAlivePlayers - Detecção de Jogadores Vivos', () => {
  it('deve retornar true quando há jogador com monstrinho vivo', () => {
    const enc = {
      participants: ['p1', 'p2']
    };
    const playersData = [
      { id: 'p1', team: [{ hp: 50 }, { hp: 0 }] },
      { id: 'p2', team: [{ hp: 0 }] }
    ];
    
    expect(hasAlivePlayers(enc, playersData)).toBe(true);
  });

  it('deve retornar false quando todos monstrinhos estão mortos', () => {
    const enc = {
      participants: ['p1', 'p2']
    };
    const playersData = [
      { id: 'p1', team: [{ hp: 0 }, { hp: 0 }] },
      { id: 'p2', team: [{ hp: 0 }] }
    ];
    
    expect(hasAlivePlayers(enc, playersData)).toBe(false);
  });

  it('deve retornar false quando participants vazio', () => {
    const enc = {
      participants: []
    };
    const playersData = [
      { id: 'p1', team: [{ hp: 50 }] }
    ];
    
    expect(hasAlivePlayers(enc, playersData)).toBe(false);
  });

  it('deve retornar false quando playersData está vazio', () => {
    const enc = {
      participants: ['p1']
    };
    const playersData = [];
    
    expect(hasAlivePlayers(enc, playersData)).toBe(false);
  });
});

describe('hasAliveEnemies - Detecção de Inimigos Vivos', () => {
  it('deve retornar true quando há inimigo vivo', () => {
    const enc = {
      enemies: [
        { hp: 50 },
        { hp: 0 }
      ]
    };
    
    expect(hasAliveEnemies(enc)).toBe(true);
  });

  it('deve retornar false quando todos inimigos estão mortos', () => {
    const enc = {
      enemies: [
        { hp: 0 },
        { hp: 0 }
      ]
    };
    
    expect(hasAliveEnemies(enc)).toBe(false);
  });

  it('deve retornar false quando enemies vazio', () => {
    const enc = {
      enemies: []
    };
    
    expect(hasAliveEnemies(enc)).toBe(false);
  });
});

describe('calculateTurnOrder - Cálculo de Ordem de Turnos', () => {
  // Mock rollD20 function para testes determinísticos
  let rollCounter = 0;
  const mockRollD20 = () => {
    rollCounter++;
    return rollCounter; // Retorna valores crescentes para tiebreak
  };

  it('deve ordenar por SPD descendente', () => {
    rollCounter = 0;
    const enc = {
      participants: ['p1', 'p2'],
      enemies: [
        { name: 'Enemy1', hp: 50, spd: 5 }
      ]
    };
    const playersData = [
      { id: 'p1', name: 'Player1', team: [{ hp: 50, spd: 10 }] },
      { id: 'p2', name: 'Player2', team: [{ hp: 50, spd: 7 }] }
    ];
    
    const order = calculateTurnOrder(enc, playersData, mockRollD20);
    
    expect(order).toHaveLength(3);
    expect(order[0].spd).toBe(10); // Player1
    expect(order[1].spd).toBe(7);  // Player2
    expect(order[2].spd).toBe(5);  // Enemy1
  });

  it('deve aplicar tiebreak quando SPD é igual', () => {
    rollCounter = 0;
    const enc = {
      participants: ['p1', 'p2', 'p3'],
      enemies: []
    };
    const playersData = [
      { id: 'p1', name: 'Player1', team: [{ hp: 50, spd: 10 }] },
      { id: 'p2', name: 'Player2', team: [{ hp: 50, spd: 10 }] },
      { id: 'p3', name: 'Player3', team: [{ hp: 50, spd: 10 }] }
    ];
    
    const order = calculateTurnOrder(enc, playersData, mockRollD20);
    
    expect(order).toHaveLength(3);
    // Todos têm SPD 10, mas tiebreak define ordem
    expect(order[0]._tiebreak).toBeGreaterThanOrEqual(1);
    expect(order[1]._tiebreak).toBeGreaterThanOrEqual(1);
    expect(order[2]._tiebreak).toBeGreaterThanOrEqual(1);
  });

  it('deve ignorar jogadores sem team', () => {
    rollCounter = 0;
    const enc = {
      participants: ['p1', 'p2'],
      enemies: []
    };
    const playersData = [
      { id: 'p1', name: 'Player1', team: [{ hp: 50, spd: 10 }] },
      { id: 'p2', name: 'Player2' } // Sem team
    ];
    
    const order = calculateTurnOrder(enc, playersData, mockRollD20);
    
    expect(order).toHaveLength(1);
    expect(order[0].id).toBe('p1');
  });

  it('deve ignorar entidades com HP <= 0', () => {
    rollCounter = 0;
    const enc = {
      participants: ['p1', 'p2'],
      enemies: [
        { name: 'Enemy1', hp: 0, spd: 5 }
      ]
    };
    const playersData = [
      { id: 'p1', name: 'Player1', team: [{ hp: 50, spd: 10 }] },
      { id: 'p2', name: 'Player2', team: [{ hp: 0, spd: 7 }] }
    ];
    
    const order = calculateTurnOrder(enc, playersData, mockRollD20);
    
    expect(order).toHaveLength(1);
    expect(order[0].id).toBe('p1');
  });

  it('deve retornar array vazio quando nenhum ator vivo', () => {
    rollCounter = 0;
    const enc = {
      participants: [],
      enemies: []
    };
    const playersData = [];
    
    const order = calculateTurnOrder(enc, playersData, mockRollD20);
    
    expect(order).toEqual([]);
  });

  it('deve identificar corretamente side (player vs enemy)', () => {
    rollCounter = 0;
    const enc = {
      participants: ['p1'],
      enemies: [
        { name: 'Enemy1', hp: 50, spd: 10 }
      ]
    };
    const playersData = [
      { id: 'p1', name: 'Player1', team: [{ hp: 50, spd: 10 }] }
    ];
    
    const order = calculateTurnOrder(enc, playersData, mockRollD20);
    
    const playerActor = order.find(a => a.id === 'p1');
    const enemyActor = order.find(a => a.name === 'Enemy1');
    
    expect(playerActor.side).toBe('player');
    expect(enemyActor.side).toBe('enemy');
  });
});
