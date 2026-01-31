# 🗺️ Roadmap Atualizado Pós-PR4 (Modo Segurança Máxima)

**Data:** 2026-01-31  
**Status:** Refatoração em Andamento (50% completo)  
**Próxima Fase:** PR5 (Combat Grupo)

---

## 📊 Onde Estamos Agora

### ✅ PRs Completados (Semanas 1-4)

#### PR1 - CSS Externalizado
```
✅ Removidos estilos inline estáticos
✅ Criado css/main.css
✅ Desacoplamento HTML/CSS
✅ Risco: ZERO (só movimentação)
```

#### PR3 - Persistência Centralizada
```
✅ StorageManager transacional (js/storage.js)
✅ Sistema de backup automático
✅ Zero acesso direto ao localStorage
✅ Bug BC-03 RESOLVIDO (corrupção de saves)
✅ Risco: BAIXO (bem testado)
```

#### PR4 - Combat Wild Modularizado
```
✅ js/combat/wildCore.js (lógica pura, testável)
✅ js/combat/wildActions.js (orquestração)
✅ js/combat/wildUI.js (interface)
✅ Dependency Injection implementada
✅ Bug BC-06 RESOLVIDO (combat core monolítico)
✅ Risco: MÉDIO (controlado com DI)
```

### 📈 Progresso Atual
```
Semanas completadas: 4 de 8 (50%)
Bugs críticos resolvidos: 3 de 17 (17.6%)
Módulos criados: 5 arquivos
Score: 5.7 → 6.5 (+14%)
Risco: Alto → Médio
ROI realizado: ~120% (de 340% projetado)
```

### 🎯 Gargalos Quebrados
```
✅ Persistência: StorageManager robusto
✅ Combat Wild: Core puro + testável
✅ CSS: Desacoplado do HTML

Ainda no Monólito (70%):
⏸️ Combat Grupo/Boss
⏸️ XP/Progressão
⏸️ UI/State central
⏸️ Dados (CSVs)
```

---

## 🎯 PR5: Combat Grupo/Boss Modularizado

### Estratégia: 3 Sub-PRs Sequenciais (Segurança Máxima)

#### PR5A - Audit + Scaffolding (Semana 5, Parte 1)
**Objetivo:** Preparar terreno SEM mover lógica  
**Risco:** ~0% (só criação de arquivos)

**Entregas:**
```javascript
// js/combat/groupCore.js
export const GroupCore = {
  // Stubs vazios
  calculateTurnOrder() { return []; },
  selectTarget() { return null; },
  // ... mais stubs
};

// js/combat/groupActions.js
export const GroupActions = {
  // Wrappers que ainda chamam código antigo
  startGroupBattle() {
    return window.startGroupBattle_OLD();
  },
  // ... mais wrappers
};

// js/combat/groupUI.js
export const GroupUI = {
  // Stubs de UI
  renderGroupBattle() {},
  updateGroupStatus() {},
};
```

**Documentação:**
- `PR5A_COMBAT_GROUP_AUDIT.md` - Inventário de todas as funções do combate em grupo
- `PR5A_SUMMARY.md` - Resumo do PR

**Critério de Merge:**
- ✅ Jogo roda exatamente igual
- ✅ Wrappers existem mas não fazem nada
- ✅ Inventário completo documentado
- ✅ Zero regressões

---

#### PR5B - GroupCore Puro (Semana 5, Parte 2)
**Objetivo:** Extrair lógica pura, reusar wildCore  
**Risco:** Baixo (lógica isolada)

**Princípio DRY Obrigatório:**
```javascript
// RUIM: Duplicar código do wild
function calcDamageGroup(atk, def, power) {
  return Math.max(1, atk + power - def); // DUPLICAÇÃO!
}

// BOM: Reusar wildCore
import { WildCore } from './wildCore.js';

export const GroupCore = {
  calculateTurnOrder(fighters) {
    // Lógica específica de grupo
    const sorted = fighters.sort((a, b) => {
      const spdA = a.spd || 10;
      const spdB = b.spd || 10;
      if (spdB !== spdA) return spdB - spdA;
      return Math.random() - 0.5; // Desempate
    });
    return sorted;
  },

  selectTarget(enemies, targetIndex) {
    // Lógica de targeting
    if (!enemies || enemies.length === 0) return null;
    const idx = targetIndex ?? 0;
    return enemies[idx] || enemies[0];
  },

  // Reusar wildCore para hit/dano
  checkHit(attacker, defender, d20) {
    return WildCore.checkHit(attacker, defender, d20);
  },

  calcDamage(attacker, defender, power) {
    return WildCore.calcDamage(attacker, defender, power);
  },

  getBuffModifiers(buffs) {
    return WildCore.getBuffModifiers(buffs);
  }
};
```

**Extrair do Monólito:**
- Ordem de turno (puro: sort por SPD)
- Seleção de alvo (puro: index → alvo)
- Buffs/modifiers (reusar wildCore)
- Hit/Dano (reusar wildCore)

**Critério de Merge:**
- ✅ Resultado idêntico nas batalhas em grupo
- ✅ GroupCore é puro (sem DOM, sem state global)
- ✅ Máximo reuso de wildCore (DRY)
- ✅ Testes possíveis (próximo PR6)

---

#### PR5C - GroupActions + GroupUI (Semana 6)
**Objetivo:** Mover orquestração e UI  
**Risco:** Médio (controlado)

**GroupActions (Orquestração):**
```javascript
import { GroupCore } from './groupCore.js';
import { GroupUI } from './groupUI.js';

export const GroupActions = {
  startGroupBattle(encounter) {
    // Orquestração: Core + UI
    const turnOrder = GroupCore.calculateTurnOrder(encounter.fighters);
    GroupUI.renderGroupBattle(encounter, turnOrder);
    return { turnOrder, encounter };
  },

  processPlayerTurn(player, action, target) {
    // 1. Core (puro)
    const d20 = rollD20(); // do global ou DI
    const hit = GroupCore.checkHit(player, target, d20);
    
    // 2. UI
    GroupUI.logAction(player, action, target);
    
    if (hit) {
      const damage = GroupCore.calcDamage(player, target, action.power);
      target.hp -= damage;
      GroupUI.updateHP(target);
      GroupUI.logDamage(damage);
    } else {
      GroupUI.logMiss();
    }
    
    // 3. Verificar fim
    if (this.checkBattleEnd()) {
      GroupUI.showVictory();
    }
  },

  processEnemyTurn(enemy, players) {
    // IA: escolher ação
    const action = this.chooseEnemyAction(enemy);
    const target = GroupCore.selectTarget(players);
    
    // Executar (reusar lógica de player)
    this.processEnemyAction(enemy, action, target);
  }
};
```

**GroupUI (Interface):**
```javascript
export const GroupUI = {
  renderGroupBattle(encounter, turnOrder) {
    const container = document.getElementById('groupBattleContainer');
    // Render HTML
  },

  updateHP(fighter) {
    const el = document.getElementById(`hp-${fighter.id}`);
    if (el) el.textContent = `${fighter.hp}/${fighter.hpMax}`;
  },

  logAction(actor, action, target) {
    const log = document.getElementById('battleLog');
    log.innerHTML += `<div>${actor.name} usa ${action.name} em ${target.name}!</div>`;
  },

  logDamage(damage) {
    const log = document.getElementById('battleLog');
    log.innerHTML += `<div class="damage">Dano: ${damage}</div>`;
  }
};
```

**Boss como Config:**
```javascript
// Boss é só um inimigo com stats diferentes
const bossBattle = {
  type: 'boss',
  enemies: [
    { ...normalEnemy, isBoss: true, healThreshold: 0.3, healChance: 0.85 }
  ]
};

// Na IA, verificar isBoss:
chooseEnemyAction(enemy) {
  if (enemy.isBoss && enemy.hp/enemy.hpMax < enemy.healThreshold) {
    if (Math.random() < enemy.healChance) {
      return healAction;
    }
  }
  // Lógica normal
}
```

**Regras Críticas:**
1. `groupAttack()` e `processEnemyTurnGroup()` continuam existindo como **wrappers**
2. `GroupUI.js` é o **único** que toca DOM
3. Boss vira "config" se possível (senão, módulo mínimo)

**Critério de Merge:**
- ✅ 3 rodadas completas em grupo sem erro
- ✅ Vitória/XP/recompensa idênticos
- ✅ Reload preserva estado
- ✅ Boss funciona igual

---

## 🧪 PR6: Vitest Mínimo (Semana 7, Parte 1)

### Por Que Agora?

**Antes:** "Testes depois" fazia sentido quando nada era puro  
**Agora:** Temos cores puros + StorageManager → momento ideal!

### Objetivo: Cinto de Segurança

**Meta:** 10-20 testes só para cores puros  
**ROI:** Alto (previne regressão em PR7/PR8)

### Setup

```bash
npm install --save-dev vitest
```

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Testes Essenciais

```javascript
// tests/combat/wildCore.test.js
import { describe, it, expect } from 'vitest';
import { WildCore } from '../../js/combat/wildCore.js';

describe('WildCore.checkHit', () => {
  it('acerta quando d20 + ATK >= DEF', () => {
    const attacker = { atk: 10 };
    const defender = { def: 15 };
    const d20 = 10; // 10 + 10 = 20 >= 15
    expect(WildCore.checkHit(attacker, defender, d20)).toBe(true);
  });

  it('erra quando d20 + ATK < DEF', () => {
    const attacker = { atk: 10 };
    const defender = { def: 25 };
    const d20 = 5; // 5 + 10 = 15 < 25
    expect(WildCore.checkHit(attacker, defender, d20)).toBe(false);
  });

  it('sempre acerta com d20 = 20', () => {
    const attacker = { atk: 1 };
    const defender = { def: 999 };
    expect(WildCore.checkHit(attacker, defender, 20)).toBe(true);
  });
});

describe('WildCore.calcDamage', () => {
  it('calcula dano: max(1, ATK + POWER - DEF)', () => {
    const attacker = { atk: 10 };
    const defender = { def: 5 };
    const power = 20;
    // 10 + 20 - 5 = 25
    expect(WildCore.calcDamage(attacker, defender, power)).toBe(25);
  });

  it('dano mínimo é 1', () => {
    const attacker = { atk: 1 };
    const defender = { def: 999 };
    const power = 10;
    expect(WildCore.calcDamage(attacker, defender, power)).toBe(1);
  });
});

describe('WildCore.getBuffModifiers', () => {
  it('retorna modifiers vazios se sem buffs', () => {
    const mods = WildCore.getBuffModifiers([]);
    expect(mods.atk).toBe(0);
    expect(mods.def).toBe(0);
  });

  it('soma buffs de ATK', () => {
    const buffs = [
      { type: 'atk', value: 5 },
      { type: 'atk', value: 3 }
    ];
    const mods = WildCore.getBuffModifiers(buffs);
    expect(mods.atk).toBe(8);
  });
});
```

```javascript
// tests/combat/groupCore.test.js
import { describe, it, expect } from 'vitest';
import { GroupCore } from '../../js/combat/groupCore.js';

describe('GroupCore.calculateTurnOrder', () => {
  it('ordena por SPD decrescente', () => {
    const fighters = [
      { id: 1, spd: 10 },
      { id: 2, spd: 20 },
      { id: 3, spd: 15 }
    ];
    const order = GroupCore.calculateTurnOrder(fighters);
    expect(order[0].id).toBe(2); // SPD 20
    expect(order[1].id).toBe(3); // SPD 15
    expect(order[2].id).toBe(1); // SPD 10
  });
});
```

```javascript
// tests/storage/storageManager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageManager } from '../../js/storage.js';

describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('salva e carrega dados', () => {
    StorageManager.save('test', { foo: 'bar' });
    const data = StorageManager.load('test');
    expect(data.foo).toBe('bar');
  });

  it('cria backup automático', () => {
    StorageManager.save('test', { foo: 'bar' });
    const backup = StorageManager.loadBackup('test');
    expect(backup).toBeDefined();
  });
});
```

### Critério de Merge

- ✅ 10-20 testes passando
- ✅ Cores puros cobertos
- ✅ CI roda testes (GitHub Actions)

---

## 🚀 PR7-8: Fase Final (Semanas 7-8)

### PR7: XP/Progressão Modularizado
```
js/progression/
  - xpCore.js (cálculos puros)
  - levelUp.js (orquestração)
  - evolution.js (evolução)
```

### PR8: UI/State Final
```
js/ui/
  - stateManager.js (state central)
  - uiHelpers.js (helpers)
  - tabManager.js (abas)
```

---

## 📊 Roadmap Visual

```
Semana 1:  ✅ PR1 (CSS)
Semana 2:  ✅ PR3 (Storage)
Semana 3:  ✅ (continuação)
Semana 4:  ✅ PR4 (Combat Wild)
           ──────────────────── 50% COMPLETO
Semana 5:  ⏸️ PR5A (Audit Grupo) + PR5B (GroupCore)
Semana 6:  ⏸️ PR5C (GroupActions/UI)
Semana 7:  ⏸️ PR6 (Vitest) + PR7 (XP início)
Semana 8:  ⏸️ PR7 (XP fim) + PR8 (UI/State)
           ──────────────────── 100% COMPLETO
```

---

## 🎯 Princípios de Segurança Máxima

### 1. Sub-PRs Pequenos
- Cada PR tem critério claro de merge
- Rollback fácil se necessário

### 2. Wrappers Mantidos
- Funções antigas viram wrappers
- Zero quebra de compatibilidade

### 3. DRY Obrigatório
- Reusar wildCore ao máximo
- Não duplicar lógica

### 4. Testes Antes de Mexer em XP
- PR6 cria cinto de segurança
- XP é muito crítico para refatorar sem testes

### 5. Boss = Config Quando Possível
- Menos código = menos risco
- Boss é só inimigo com stats diferentes

---

## ✅ Checklist Completo

### Já Feito ✅
- [x] PR1: CSS externalizado
- [x] PR3: Storage robusto
- [x] PR4: Combat Wild modular

### Próximo (Semana 5) ⏸️
- [ ] PR5A: Audit + scaffolding grupo
- [ ] PR5B: GroupCore puro

### Futuro (Semanas 6-8) ⏸️
- [ ] PR5C: GroupActions + GroupUI
- [ ] PR6: Vitest mínimo (10-20 testes)
- [ ] PR7: XP/Progressão modularizado
- [ ] PR8: UI/State final

---

**Última Atualização:** 2026-01-31  
**Status:** Roadmap atualizado pós-PR4  
**Próxima Ação:** Iniciar PR5A (Audit Combat Grupo)
