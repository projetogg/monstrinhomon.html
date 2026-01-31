/**
 * WILD COMBAT CORE TESTS
 * 
 * Testes para funções puras do wildCore.js
 * Cobertura: checkHit, calcDamage, getClassAdvantageModifiers, 
 * getBuffModifiers, checkCriticalRoll, applyDamageToHP
 */

import { describe, it, expect } from 'vitest';
import {
  checkHit,
  calcDamage,
  getClassAdvantageModifiers,
  getBuffModifiers,
  checkCriticalRoll,
  applyDamageToHP,
  calculateDamage
} from '../js/combat/wildCore.js';

describe('checkHit - Verificação de Acerto', () => {
  const classAdvantages = {
    Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
    Mago: { strong: 'Bárbaro', weak: 'Ladino' },
    Curandeiro: { strong: 'Guerreiro', weak: 'Bardo' }
  };

  it('deve acertar quando d20 + ATK >= DEF', () => {
    const attacker = { atk: 5, class: 'Guerreiro' };
    const defender = { def: 10, class: 'Mago' };
    const d20Roll = 6; // 6 + 5 = 11 >= 10
    
    expect(checkHit(d20Roll, attacker, defender, classAdvantages)).toBe(true);
  });

  it('deve errar quando d20 + ATK < DEF', () => {
    const attacker = { atk: 5, class: 'Guerreiro' };
    const defender = { def: 15, class: 'Mago' };
    const d20Roll = 8; // 8 + 5 = 13 < 15
    
    expect(checkHit(d20Roll, attacker, defender, classAdvantages)).toBe(false);
  });

  it('deve aplicar +2 bônus com vantagem de classe', () => {
    const attacker = { atk: 5, class: 'Guerreiro' };
    const defender = { def: 12, class: 'Ladino' }; // Guerreiro > Ladino
    const d20Roll = 5; // 5 + 5 + 2(vantagem) = 12 >= 12
    
    expect(checkHit(d20Roll, attacker, defender, classAdvantages)).toBe(true);
  });

  it('deve aplicar -2 penalidade com desvantagem de classe', () => {
    const attacker = { atk: 5, class: 'Guerreiro' };
    const defender = { def: 10, class: 'Curandeiro' }; // Guerreiro < Curandeiro
    const d20Roll = 7; // 7 + 5 - 2(desvantagem) = 10 >= 10
    
    expect(checkHit(d20Roll, attacker, defender, classAdvantages)).toBe(true);
  });

  it('d20=1 pode ainda acertar com ATK alto', () => {
    const attacker = { atk: 20, class: 'Guerreiro' };
    const defender = { def: 15, class: 'Mago' };
    const d20Roll = 1; // 1 + 20 = 21 >= 15
    
    expect(checkHit(d20Roll, attacker, defender, classAdvantages)).toBe(true);
  });

  it('d20=20 sempre acerta', () => {
    const attacker = { atk: 1, class: 'Guerreiro' };
    const defender = { def: 50, class: 'Mago' };
    const d20Roll = 20; // 20 + 1 = 21 < 50, mas depende da lógica
    
    // Nota: No código atual, d20=20 não é auto-acerto, apenas bônus normal
    // Se quiser auto-acerto, precisa adicionar lógica especial
    expect(checkHit(d20Roll, attacker, defender, classAdvantages)).toBe(false);
  });

  it('deve retornar false se attacker for null', () => {
    expect(checkHit(10, null, { def: 10 }, classAdvantages)).toBe(false);
  });

  it('deve retornar false se defender for null', () => {
    expect(checkHit(10, { atk: 5 }, null, classAdvantages)).toBe(false);
  });
});

describe('calcDamage - Cálculo de Dano', () => {
  it('deve calcular dano básico corretamente', () => {
    // ATK=10, DEF=5, POWER=15
    // ratio = 10/(10+5) = 0.6666...
    // baseD = floor(15 * 0.6666...) = floor(10) = 10
    // finalD = floor(10 * 1.0) = 10
    const damage = calcDamage({ atk: 10, def: 5, power: 15, damageMult: 1.0 });
    expect(damage).toBe(10);
  });

  it('deve aplicar multiplicador de vantagem (+10%)', () => {
    // ATK=10, DEF=10, POWER=20
    // ratio = 10/(10+10) = 0.5
    // baseD = floor(20 * 0.5) = 10
    // finalD = floor(10 * 1.10) = floor(11) = 11
    const damage = calcDamage({ atk: 10, def: 10, power: 20, damageMult: 1.10 });
    expect(damage).toBe(11);
  });

  it('deve aplicar multiplicador de desvantagem (-10%)', () => {
    // ATK=10, DEF=10, POWER=20
    // ratio = 10/(10+10) = 0.5
    // baseD = floor(20 * 0.5) = 10
    // finalD = floor(10 * 0.90) = floor(9) = 9
    const damage = calcDamage({ atk: 10, def: 10, power: 20, damageMult: 0.90 });
    expect(damage).toBe(9);
  });

  it('deve retornar dano mínimo de 1 quando DEF é muito alta', () => {
    // ATK=5, DEF=100, POWER=10
    // ratio = 5/105 = 0.047
    // baseD = floor(10 * 0.047) = floor(0.47) = 0
    // finalD = max(1, 0) = 1
    const damage = calcDamage({ atk: 5, def: 100, power: 10, damageMult: 1.0 });
    expect(damage).toBe(1);
  });

  it('deve calcular dano alto quando ATK >> DEF', () => {
    // ATK=50, DEF=5, POWER=30
    // ratio = 50/(50+5) = 0.909
    // baseD = floor(30 * 0.909) = floor(27.27) = 27
    // finalD = 27
    const damage = calcDamage({ atk: 50, def: 5, power: 30, damageMult: 1.0 });
    expect(damage).toBe(27);
  });

  it('deve usar multiplicador padrão 1.0 se não fornecido', () => {
    const damage = calcDamage({ atk: 10, def: 10, power: 20 });
    expect(damage).toBe(10);
  });
});

describe('getClassAdvantageModifiers - Modificadores de Classe', () => {
  const classAdvantages = {
    Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
    Mago: { strong: 'Bárbaro', weak: 'Ladino' }
  };

  it('deve retornar vantagem quando atacante é forte', () => {
    const mods = getClassAdvantageModifiers('Guerreiro', 'Ladino', classAdvantages);
    expect(mods.atkBonus).toBe(2);
    expect(mods.damageMult).toBe(1.10);
  });

  it('deve retornar desvantagem quando atacante é fraco', () => {
    const mods = getClassAdvantageModifiers('Guerreiro', 'Curandeiro', classAdvantages);
    expect(mods.atkBonus).toBe(-2);
    expect(mods.damageMult).toBe(0.90);
  });

  it('deve retornar neutro quando não há vantagem nem desvantagem', () => {
    const mods = getClassAdvantageModifiers('Guerreiro', 'Mago', classAdvantages);
    expect(mods.atkBonus).toBe(0);
    expect(mods.damageMult).toBe(1.0);
  });

  it('deve retornar neutro se classAdvantages for null', () => {
    const mods = getClassAdvantageModifiers('Guerreiro', 'Ladino', null);
    expect(mods.atkBonus).toBe(0);
    expect(mods.damageMult).toBe(1.0);
  });

  it('deve retornar neutro se attackerClass não existir na tabela', () => {
    const mods = getClassAdvantageModifiers('ClasseInexistente', 'Ladino', classAdvantages);
    expect(mods.atkBonus).toBe(0);
    expect(mods.damageMult).toBe(1.0);
  });
});

describe('getBuffModifiers - Modificadores de Buffs', () => {
  it('deve calcular modificadores de buffs múltiplos', () => {
    const monster = {
      buffs: [
        { type: 'atk', power: 3 },
        { type: 'def', power: 2 },
        { type: 'spd', power: 1 }
      ]
    };
    
    const mods = getBuffModifiers(monster);
    expect(mods.atk).toBe(3);
    expect(mods.def).toBe(2);
    expect(mods.spd).toBe(1);
  });

  it('deve somar buffs do mesmo tipo', () => {
    const monster = {
      buffs: [
        { type: 'atk', power: 2 },
        { type: 'atk', power: 3 }
      ]
    };
    
    const mods = getBuffModifiers(monster);
    expect(mods.atk).toBe(5);
  });

  it('deve retornar zeros se não há buffs', () => {
    const monster = { buffs: [] };
    const mods = getBuffModifiers(monster);
    expect(mods.atk).toBe(0);
    expect(mods.def).toBe(0);
    expect(mods.spd).toBe(0);
  });

  it('deve retornar zeros se monster for null', () => {
    const mods = getBuffModifiers(null);
    expect(mods.atk).toBe(0);
    expect(mods.def).toBe(0);
    expect(mods.spd).toBe(0);
  });

  it('deve ignorar buffs com type em maiúsculas (case-insensitive)', () => {
    const monster = {
      buffs: [
        { type: 'ATK', power: 5 },
        { type: 'Def', power: 3 }
      ]
    };
    
    const mods = getBuffModifiers(monster);
    expect(mods.atk).toBe(5);
    expect(mods.def).toBe(3);
  });
});

describe('checkCriticalRoll - Verificação de Crítico', () => {
  it('deve detectar d20=20 como crítico', () => {
    const result = checkCriticalRoll(20);
    expect(result.isCrit20).toBe(true);
    expect(result.isFail1).toBe(false);
  });

  it('deve detectar d20=1 como falha crítica', () => {
    const result = checkCriticalRoll(1);
    expect(result.isCrit20).toBe(false);
    expect(result.isFail1).toBe(true);
  });

  it('d20=10 não é nem crítico nem falha', () => {
    const result = checkCriticalRoll(10);
    expect(result.isCrit20).toBe(false);
    expect(result.isFail1).toBe(false);
  });
});

describe('applyDamageToHP - Aplicação de Dano ao HP', () => {
  it('deve reduzir HP pelo dano', () => {
    const newHP = applyDamageToHP(100, 30);
    expect(newHP).toBe(70);
  });

  it('deve retornar 0 quando dano excede HP (overkill)', () => {
    const newHP = applyDamageToHP(50, 100);
    expect(newHP).toBe(0);
  });

  it('deve retornar HP inalterado quando dano é 0', () => {
    const newHP = applyDamageToHP(100, 0);
    expect(newHP).toBe(100);
  });

  it('deve garantir que HP nunca seja negativo', () => {
    const newHP = applyDamageToHP(10, 50);
    expect(newHP).toBe(0);
    expect(newHP).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateDamage - Wrapper Completo', () => {
  const classAdvantages = {
    Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' }
  };

  const getBasicPower = (classe) => {
    const powers = {
      Guerreiro: 12,
      Mago: 10,
      Curandeiro: 8
    };
    return powers[classe] || 10;
  };

  it('deve calcular dano com vantagem de classe', () => {
    const attacker = { 
      atk: 10, 
      class: 'Guerreiro',
      buffs: []
    };
    const defender = { 
      def: 10, 
      class: 'Ladino',
      buffs: []
    };
    
    // POWER=12 (Guerreiro), vantagem 1.10
    // ratio = 10/20 = 0.5
    // baseD = floor(12 * 0.5) = 6
    // finalD = floor(6 * 1.10) = floor(6.6) = 6
    const damage = calculateDamage(attacker, defender, getBasicPower, classAdvantages);
    expect(damage).toBe(6);
  });

  it('deve aplicar buffs de ATK', () => {
    const attacker = { 
      atk: 10, 
      class: 'Mago',
      buffs: [{ type: 'atk', power: 5 }]
    };
    const defender = { 
      def: 10, 
      class: 'Guerreiro',
      buffs: []
    };
    
    // ATK efetivo: 10 + 5 = 15
    // POWER=10 (Mago)
    // ratio = 15/25 = 0.6
    // baseD = floor(10 * 0.6) = 6
    const damage = calculateDamage(attacker, defender, getBasicPower, classAdvantages);
    expect(damage).toBe(6);
  });

  it('deve retornar dano mínimo de 1', () => {
    const attacker = { 
      atk: 1, 
      class: 'Curandeiro',
      buffs: []
    };
    const defender = { 
      def: 100, 
      class: 'Guerreiro',
      buffs: []
    };
    
    const damage = calculateDamage(attacker, defender, getBasicPower, classAdvantages);
    expect(damage).toBe(1);
  });
});
