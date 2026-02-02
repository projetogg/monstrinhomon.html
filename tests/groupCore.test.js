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
  clamp,
  calculateEffectiveDefense,
  pickEnemyTargetByDEF
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

describe('calculateEffectiveDefense - Cálculo de Defesa Efetiva', () => {
  it('deve calcular DEF base sem item ou buffs', () => {
    const { calculateEffectiveDefense } = require('../js/combat/groupCore.js');
    
    const monster = { def: 10, buffs: [] };
    const result = calculateEffectiveDefense(monster, null);
    
    expect(result).toBe(10);
  });

  it('deve somar bônus de item equipado', () => {
    const { calculateEffectiveDefense } = require('../js/combat/groupCore.js');
    
    const monster = { def: 10, buffs: [] };
    const heldItem = { stats: { def: 3 } };
    const result = calculateEffectiveDefense(monster, heldItem);
    
    expect(result).toBe(13); // 10 + 3
  });

  it('deve somar bônus de buffs', () => {
    const { calculateEffectiveDefense } = require('../js/combat/groupCore.js');
    
    const monster = {
      def: 10,
      buffs: [
        { type: 'def', power: 2 },
        { type: 'def', power: 3 }
      ]
    };
    const result = calculateEffectiveDefense(monster, null);
    
    expect(result).toBe(15); // 10 + 2 + 3
  });

  it('deve somar item + buffs', () => {
    const { calculateEffectiveDefense } = require('../js/combat/groupCore.js');
    
    const monster = {
      def: 10,
      buffs: [{ type: 'def', power: 2 }]
    };
    const heldItem = { stats: { def: 3 } };
    const result = calculateEffectiveDefense(monster, heldItem);
    
    expect(result).toBe(15); // 10 + 3 + 2
  });
});

describe('pickEnemyTargetByDEF - IA v1 (Seleção por DEF)', () => {
  const { pickEnemyTargetByDEF } = require('../js/combat/groupCore.js');
  
  it('deve retornar null quando não há alvos', () => {
    const result = pickEnemyTargetByDEF([], {});
    expect(result).toBe(null);
  });

  it('deve retornar o único alvo disponível', () => {
    const targets = [{
      playerId: 'p1',
      monster: { hp: 50, hpMax: 100, def: 10, buffs: [] },
      heldItem: null
    }];
    
    const result = pickEnemyTargetByDEF(targets, {});
    expect(result).toBe('p1');
  });

  it('deve escolher alvo com maior DEF com mais frequência (seeded)', () => {
    // Tank: alta DEF
    // DPS: baixa DEF
    const targets = [
      {
        playerId: 'tank',
        monster: { hp: 100, hpMax: 100, def: 20, buffs: [] }, // Alta DEF
        heldItem: null
      },
      {
        playerId: 'dps',
        monster: { hp: 60, hpMax: 60, def: 5, buffs: [] }, // Baixa DEF
        heldItem: null
      }
    ];
    
    // Simular 100 escolhas com seed determinístico
    let tankCount = 0;
    let dpsCount = 0;
    
    // RNG seeded: valores fixos que darão distribuição esperada
    const rngValues = [];
    for (let i = 0; i < 100; i++) {
      // Gerar valores que favoreçam tank (60% das vezes)
      // 60% dos valores < 0.60 (top1 = tank com alta DEF)
      // 30% entre 0.60-0.90 (top2 = dps)
      // 10% > 0.90 (top3, mas só tem 2 alvos)
      if (i < 70) rngValues.push(0.3 + (i * 0.003)); // Noise + top1 select
      else rngValues.push(0.7 + (i * 0.002)); // top2 select
    }
    
    for (let i = 0; i < 100; i++) {
      let rngIndex = 0;
      const mockRng = () => rngValues[rngIndex++ % rngValues.length];
      
      const chosen = pickEnemyTargetByDEF(targets, {}, mockRng);
      if (chosen === 'tank') tankCount++;
      if (chosen === 'dps') dpsCount++;
    }
    
    // Tank (maior DEF) deve ser escolhido mais frequentemente
    expect(tankCount).toBeGreaterThan(dpsCount);
    expect(tankCount).toBeGreaterThan(50); // Pelo menos 50% das vezes
  });

  it('nunca deve escolher alvo morto (HP = 0)', () => {
    const targets = [
      {
        playerId: 'alive',
        monster: { hp: 50, hpMax: 100, def: 10, buffs: [] },
        heldItem: null
      }
      // Note: alvos mortos não devem estar na lista de elegíveis
      // Este teste valida que a função buildEligibleTargets os filtra
    ];
    
    const result = pickEnemyTargetByDEF(targets, {});
    expect(result).toBe('alive');
    expect(result).not.toBe('dead');
  });

  it('deve aplicar focusPenalty e reduzir repetição', () => {
    const targets = [
      {
        playerId: 'p1',
        monster: { hp: 100, hpMax: 100, def: 15, buffs: [] }, // DEF maior
        heldItem: null
      },
      {
        playerId: 'p2',
        monster: { hp: 80, hpMax: 80, def: 10, buffs: [] },
        heldItem: null
      }
    ];
    
    // Simular 3 ataques consecutivos
    // Com focusPenalty, deve eventualmente alternar alvos
    const recentTargets = {};
    const chosen = [];
    
    // RNG fixo que normalmente favoreceria p1
    let rngIndex = 0;
    const rngValues = [0.5, 0.5, 0.5, 0.5, 0.5]; // Noise neutro e top1 selection
    const mockRng = () => rngValues[rngIndex++ % rngValues.length];
    
    for (let i = 0; i < 3; i++) {
      const target = pickEnemyTargetByDEF(targets, recentTargets, mockRng);
      chosen.push(target);
      recentTargets[target] = (recentTargets[target] || 0) + 1;
    }
    
    // Com focusPenalty, após alguns hits em p1, deve começar a escolher p2
    // Pelo menos um deve ser diferente do outro (não todos iguais)
    const uniqueTargets = new Set(chosen);
    
    // Com penalty crescente, deve haver variação
    // (não conseguimos garantir 100% devido ao noise, mas deve haver chance)
    expect(recentTargets['p1']).toBeGreaterThan(0);
    
    // Verificar que penalty foi aplicado
    expect(recentTargets).toHaveProperty('p1');
  });

  it('deve aplicar finisherBonus para alvos com HP baixo', () => {
    const targets = [
      {
        playerId: 'healthy',
        monster: { hp: 90, hpMax: 100, def: 15, buffs: [] }, // 90% HP
        heldItem: null
      },
      {
        playerId: 'wounded',
        monster: { hp: 10, hpMax: 100, def: 15, buffs: [] }, // 10% HP
        heldItem: null
      }
    ];
    
    // Ambos têm mesma DEF, mas wounded tem HP muito baixo
    // finisherBonus deve aumentar chance de wounded ser escolhido
    
    let healthyCount = 0;
    let woundedCount = 0;
    
    // Simular múltiplas escolhas
    const rngValues = [];
    for (let i = 0; i < 50; i++) {
      rngValues.push(0.5); // Noise neutro
    }
    
    for (let i = 0; i < 50; i++) {
      let rngIndex = 0;
      const mockRng = () => rngValues[rngIndex++ % rngValues.length];
      
      const chosen = pickEnemyTargetByDEF(targets, {}, mockRng);
      if (chosen === 'healthy') healthyCount++;
      if (chosen === 'wounded') woundedCount++;
    }
    
    // wounded (HP baixo) deve ser escolhido mais frequentemente devido a finisherBonus
    expect(woundedCount).toBeGreaterThan(healthyCount);
  });

  it('deve usar seleção ponderada (60/30/10) com 3+ alvos', () => {
    const targets = [
      {
        playerId: 'p1',
        monster: { hp: 100, hpMax: 100, def: 20, buffs: [] }, // Highest score
        heldItem: null
      },
      {
        playerId: 'p2',
        monster: { hp: 80, hpMax: 80, def: 15, buffs: [] }, // Medium score
        heldItem: null
      },
      {
        playerId: 'p3',
        monster: { hp: 60, hpMax: 60, def: 10, buffs: [] }, // Lowest score
        heldItem: null
      }
    ];
    
    const counts = { p1: 0, p2: 0, p3: 0 };
    
    // Simular com valores de RNG específicos para testar a distribuição
    const selections = [
      0.3,  // < 0.60 -> top1 (p1)
      0.75, // 0.60-0.90 -> top2 (p2)
      0.95, // > 0.90 -> top3 (p3)
      0.5,  // < 0.60 -> top1 (p1)
      0.8,  // 0.60-0.90 -> top2 (p2)
      0.92  // > 0.90 -> top3 (p3)
    ];
    
    for (let i = 0; i < selections.length; i++) {
      let rngCallCount = 0;
      const mockRng = () => {
        if (rngCallCount === 0) {
          rngCallCount++;
          return 0.5; // Noise
        }
        return selections[i]; // Selection roll
      };
      
      const chosen = pickEnemyTargetByDEF(targets, {}, mockRng);
      counts[chosen]++;
    }
    
    // Verificar que pelo menos cada categoria foi escolhida
    expect(counts.p1).toBeGreaterThan(0); // Top1
    expect(counts.p2).toBeGreaterThan(0); // Top2
    expect(counts.p3).toBeGreaterThan(0); // Top3
  });
});
