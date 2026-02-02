# Exemplos Práticos: Uso do Campo DEF

Este documento contém exemplos práticos de como acessar e usar o campo DEF em diferentes contextos do jogo Monstrinhomon.

---

## 1. Dados do Catálogo

### 1.1 Template de Monstrinho (monsters.json)

```json
{
  "id": "MON_002",
  "name": "Pedrino",
  "class": "Guerreiro",
  "rarity": "Comum",
  "baseHp": 32,
  "baseAtk": 7,
  "baseDef": 6,      ← Defesa base no nível 1
  "baseSpd": 5,
  "baseEne": 6,
  "emoji": "⚔️"
}
```

**Note:** No template, usamos `baseDef` para definir a defesa inicial.

### 1.2 Item Equipável (items.json)

```json
{
  "id": "IT_DEF_COMUM",
  "name": "Escudo Leve",
  "type": "held",
  "stats": {
    "atk": 0,
    "def": 2          ← Bônus de defesa quando equipado
  },
  "break": {
    "enabled": true,
    "chance": 0.15
  }
}
```

**Note:** Itens usam `stats.def` (sub-objeto), não `def` direto.

---

## 2. Instâncias de Monstrinhos

### 2.1 Criação de Instância (Choque de Ovo)

```javascript
// Arquivo: js/data/eggHatcher.js, linha ~78
function createMonsterInstance(template, level = 1) {
    const instance = {
        id: `mi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        monsterId: template.id,
        name: template.name,
        class: template.class,
        rarity: template.rarity,
        emoji: template.emoji || '❓',
        level: level,
        xp: 0,
        hp: template.baseHp || 30,
        hpMax: template.baseHp || 30,
        atk: template.baseAtk || 5,
        def: template.baseDef || 3,    // ← baseDef → def
        spd: template.baseSpd || 5,
        ene: template.baseEne || 6,
        eneMax: template.baseEne || 6,
        heldItemId: null,
        buffs: []
    };
    
    return instance;
}
```

**Transformação:**
- `template.baseDef` (template do catálogo)
- → `instance.def` (instância do Monstrinho)

### 2.2 Exemplo de Instância Real

```javascript
// Monstrinho no time do jogador
const playerMonster = {
    id: "mi_1738482742163_abc123def",
    monsterId: "MON_002",
    name: "Pedrino",
    class: "Guerreiro",
    rarity: "Comum",
    emoji: "⚔️",
    level: 5,
    xp: 120,
    hp: 38,
    hpMax: 38,
    atk: 9,
    def: 7,        // ← Acesso direto: playerMonster.def
    spd: 6,
    ene: 6,
    eneMax: 6,
    heldItemId: "IT_DEF_COMUM",  // Equipando Escudo Leve
    buffs: [
        {
            type: "def",
            power: 2,
            duration: 2
        }
    ]
};

// ✅ Acessar DEF
console.log(playerMonster.def);  // 7

// ✅ DEF total com item e buffs
// 7 (base) + 2 (item) + 2 (buff) = 11
```

---

## 3. Combate Selvagem (Wild Encounter)

### 3.1 Estrutura do Encontro

```javascript
const encounter = {
    id: "enc_wild_1234",
    type: "wild",
    selectedPlayerId: "player_abc123",
    wildMonster: {
        id: "temp_wild_001",
        monsterId: "MON_100",
        name: "Rato-de-Lama",
        class: "Guerreiro",
        rarity: "Comum",
        level: 3,
        hp: 18,
        hpMax: 20,
        atk: 6,
        def: 4,       // ← Acesso: encounter.wildMonster.def
        spd: 5,
        ene: 4,
        eneMax: 4,
        buffs: []
    },
    log: [],
    status: "ongoing"
};
```

### 3.2 Uso em Combate

```javascript
// Arquivo: js/combat/wildActions.js, linha ~84
export function doWildAttack(encounter, player, playerMonster, dependencies) {
    // ...código anterior...
    
    // Calcular defesa efetiva do inimigo
    const defMods = WildCore.getBuffModifiers(encounter.wildMonster);
    const effectiveDef = Math.max(1, 
        encounter.wildMonster.def + defMods.def  // ← Acesso direto
    );
    
    // Calcular dano
    const damage = WildCore.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,      // ← DEF efetiva
        power: POWER_BASIC,
        classAdvMult: classAdv.damageMult
    });
    
    // Aplicar dano
    encounter.wildMonster.hp -= damage;
    
    // ...resto do código...
}
```

**Fluxo:**
1. `encounter.wildMonster.def` → DEF base (4)
2. `defMods.def` → Buffs temporários (+0)
3. `effectiveDef` → DEF total (4)

---

## 4. Combate em Grupo

### 4.1 Estrutura de Inimigo

```javascript
const groupEncounter = {
    id: "enc_group_5678",
    type: "group",
    participants: ["player_1", "player_2", "player_3"],
    enemies: [
        {
            id: "enemy_boss_001",
            monsterId: "MON_007",
            name: "Trovão",
            class: "Bárbaro",
            rarity: "Raro",
            level: 8,
            hp: 45,
            hpMax: 50,
            atk: 12,
            def: 8,     // ← Acesso: enemies[0].def
            spd: 7,
            buffs: [],
            isBoss: true
        }
    ],
    turnOrder: [...],
    log: []
};
```

### 4.2 Cálculo de Dano ao Inimigo

```javascript
// Arquivo: js/combat/groupActions.js, linha ~130
export function doGroupAttack(groupEnc, playerId, targetEnemyId, dependencies) {
    const enemy = groupEnc.enemies.find(e => e.id === targetEnemyId);
    
    // ...código anterior...
    
    // Defesa efetiva do inimigo
    const defMods = GroupCore.getBuffModifiers(enemy);
    const effectiveDef = Math.max(1, 
        (Number(enemy.def) || 0) + defMods.def  // ← Acesso direto
    );
    
    // ...resto do código...
}
```

---

## 5. Itens Equipáveis

### 5.1 Ler Bônus de Item

```javascript
// Arquivo: js/combat/itemBreakage.js, linha ~170
export function calculateItemBonuses(monsterId, state, getItemById) {
    const monster = state.instances.find(m => m.id === monsterId);
    if (!monster?.heldItemId) {
        return { atk: 0, def: 0 };
    }
    
    const itemDef = getItemById(monster.heldItemId);
    if (!itemDef) {
        return { atk: 0, def: 0 };
    }
    
    return {
        atk: Number(itemDef.stats.atk) || 0,
        def: Number(itemDef.stats.def) || 0   // ← stats.def para itens
    };
}
```

### 5.2 Mostrar Bônus na UI

```javascript
// Arquivo: js/combat/itemUIHelpers.js, linha ~26
export function formatItemBonusesText(itemDef) {
    const bonuses = [];
    
    if (itemDef.stats.atk > 0) {
        bonuses.push(`+${itemDef.stats.atk} ATK`);
    }
    if (itemDef.stats.def > 0) {
        bonuses.push(`+${itemDef.stats.def} DEF`);  // ← stats.def
    }
    
    return bonuses.join(', ');
}

// Exemplo de uso:
const item = getItemById('IT_DEF_COMUM');
console.log(formatItemBonusesText(item));  // "+2 DEF"
```

---

## 6. Verificação de Acerto

### 6.1 Fórmula Completa

```javascript
// Arquivo: js/combat/wildCore.js, linha ~23
export function checkHit(d20Roll, attacker, defender, classAdvantages) {
    const atkMod = attacker.atk || 5;
    const defValue = defender.def || 3;    // ← DEF do defensor
    
    // Vantagem de classe
    let atkBonus = 0;
    if (classAdvantages && attacker.class && defender.class) {
        const classAdv = classAdvantages[attacker.class];
        if (classAdv?.strong === defender.class) {
            atkBonus = 2;   // +2 ATK
        } else if (classAdv?.weak === defender.class) {
            atkBonus = -2;  // -2 ATK
        }
    }
    
    // REGRA: d20 + ATK + bônus >= DEF
    const totalAtk = d20Roll + atkMod + atkBonus;
    return totalAtk >= defValue;
}
```

### 6.2 Exemplo de Combate

```javascript
// Cenário: Pedrino (Guerreiro, ATK=9) vs Rato-de-Lama (Guerreiro, DEF=4)
const attacker = {
    name: "Pedrino",
    class: "Guerreiro",
    atk: 9
};

const defender = {
    name: "Rato-de-Lama",
    class: "Guerreiro",
    def: 4        // ← DEF usado na verificação
};

const d20Roll = 8;  // Jogador rolou 8

// Verificar acerto
const hit = checkHit(d20Roll, attacker, defender, classAdvantages);
// Cálculo: 8 + 9 + 0 = 17 >= 4 → true (acertou!)

console.log(`d20=${d20Roll}, ATK=${attacker.atk}, DEF=${defender.def}`);
console.log(`Total: ${d20Roll + attacker.atk} >= ${defender.def} → ${hit ? 'HIT!' : 'MISS!'}`);
// Output: "Total: 17 >= 4 → HIT!"
```

---

## 7. Level Up e Crescimento

### 7.1 Recalcular Stats ao Subir de Nível

```javascript
// Exemplo de crescimento linear simples
function recalculateStatsAfterLevelUp(monster) {
    const template = getMonsterTemplate(monster.monsterId);
    
    // Fórmula exemplo (pode variar por classe)
    monster.atk = (template.baseAtk || 5) + (monster.level - 1) * 2;
    monster.def = (template.baseDef || 3) + (monster.level - 1) * 1.5;  // ← DEF cresce
    monster.spd = (template.baseSpd || 5) + (monster.level - 1) * 1;
    
    // Arredondar
    monster.def = Math.round(monster.def);
    
    console.log(`Level ${monster.level}: DEF agora é ${monster.def}`);
}

// Exemplo:
const pedrino = { monsterId: "MON_002", level: 1, def: 6 };
pedrino.level = 5;
recalculateStatsAfterLevelUp(pedrino);
console.log(pedrino.def);  // ~12 (6 base + 4*1.5)
```

### 7.2 Teste de Level Up

```javascript
// Arquivo: tests/xpActions.test.js, linha ~179
it('deve recalcular stats ao subir de nível', () => {
    const monster = {
        id: 'mi_test',
        level: 10,
        def: 12
    };
    
    // Simular recalculação
    monster.def = 12 + monster.level * 2;  // ← Modificação direta
    
    expect(monster.def).toBe(32);  // 12 + 10*2
});
```

---

## 8. Buffs Temporários

### 8.1 Adicionar Buff de Defesa

```javascript
// Habilidade que dá buff de defesa
function useDefensiveStance(monster) {
    monster.buffs.push({
        type: 'def',       // ← Tipo do buff
        power: 3,          // +3 DEF
        duration: 3,       // Dura 3 turnos
        source: 'skill'
    });
    
    console.log(`${monster.name} está em posição defensiva! (+3 DEF por 3 turnos)`);
}

// Exemplo:
const monster = {
    name: "Pedrino",
    def: 7,
    buffs: []
};

useDefensiveStance(monster);
// monster.buffs = [{ type: 'def', power: 3, duration: 3, source: 'skill' }]
```

### 8.2 Calcular DEF Total com Buffs

```javascript
// Arquivo: js/combat/wildCore.js, linha ~100
export function getBuffModifiers(monster) {
    const mods = { atk: 0, def: 0, spd: 0 };
    
    if (!monster?.buffs || monster.buffs.length === 0) {
        return mods;
    }
    
    for (const buff of monster.buffs) {
        const type = buff.type?.toLowerCase();
        const power = Number(buff.power) || 0;
        
        if (type === 'atk') mods.atk += power;
        else if (type === 'def') mods.def += power;  // ← Somar buff de DEF
        else if (type === 'spd') mods.spd += power;
    }
    
    return mods;
}

// Usar:
const monster = {
    def: 7,
    buffs: [
        { type: 'def', power: 3, duration: 3 },
        { type: 'def', power: 2, duration: 1 }
    ]
};

const mods = getBuffModifiers(monster);
console.log(`DEF base: ${monster.def}`);           // 7
console.log(`Buff total: +${mods.def}`);           // +5
console.log(`DEF efetiva: ${monster.def + mods.def}`);  // 12
```

---

## 9. Validação e Tratamento de Erros

### 9.1 Valor Mínimo de DEF

```javascript
// SEMPRE garantir DEF >= 1
function getEffectiveDefense(monster) {
    const baseDef = monster.def || 3;  // Fallback: 3
    const buffMods = getBuffModifiers(monster);
    const itemBonus = getItemDefBonus(monster);
    
    const total = baseDef + buffMods.def + itemBonus;
    
    // Defesa mínima é 1
    return Math.max(1, total);
}
```

### 9.2 Validação de Tipo

```javascript
function validateMonsterStats(monster) {
    const errors = [];
    
    // Verificar se DEF existe
    if (typeof monster.def === 'undefined') {
        errors.push('DEF is missing');
        monster.def = 3;  // Fix automático
    }
    
    // Verificar se DEF é número
    if (typeof monster.def !== 'number') {
        errors.push(`DEF must be number, got ${typeof monster.def}`);
        monster.def = Number(monster.def) || 3;  // Tentar converter
    }
    
    // Verificar se DEF é positivo
    if (monster.def < 1) {
        errors.push(`DEF must be >= 1, got ${monster.def}`);
        monster.def = 1;  // Fix
    }
    
    return errors;
}
```

---

## 10. UI e Display

### 10.1 Mostrar Stats na UI

```javascript
// Exibir stats do Monstrinho
function renderMonsterStats(monster) {
    const html = `
        <div class="monster-stats">
            <div class="stat-row">
                <span class="stat-label">HP:</span>
                <span class="stat-value">${monster.hp}/${monster.hpMax}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">ATK:</span>
                <span class="stat-value">${monster.atk}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">DEF:</span>
                <span class="stat-value">${monster.def}</span>  ← Mostrar DEF
            </div>
            <div class="stat-row">
                <span class="stat-label">SPD:</span>
                <span class="stat-value">${monster.spd}</span>
            </div>
        </div>
    `;
    
    return html;
}
```

### 10.2 Mostrar DEF com Buffs (Color Coding)

```javascript
// Arquivo: js/combat/groupUI.js, linha ~127
function renderEnemyStats(enemy) {
    const mods = getBuffModifiers(enemy);
    const effectiveDef = enemy.def + mods.def;
    
    let defDisplay = enemy.def;
    if (mods.def > 0) {
        defDisplay = `<span style="color: green">${effectiveDef}</span> (+${mods.def})`;
    } else if (mods.def < 0) {
        defDisplay = `<span style="color: red">${effectiveDef}</span> (${mods.def})`;
    }
    
    return `ATK: ${enemy.atk} | DEF: ${defDisplay} | SPD: ${enemy.spd}`;
}

// Exemplo:
// Normal:    "ATK: 12 | DEF: 8 | SPD: 7"
// Com buff:  "ATK: 12 | DEF: 11 (+3) | SPD: 7"
// Com debuff: "ATK: 12 | DEF: 5 (-3) | SPD: 7"
```

---

## 11. Testes

### 11.1 Testar Acesso ao DEF

```javascript
import { describe, it, expect } from 'vitest';

describe('DEF field access', () => {
    it('deve acessar DEF diretamente do monster', () => {
        const monster = {
            id: 'mi_test',
            name: 'Test Monster',
            def: 5
        };
        
        expect(monster.def).toBe(5);  // ✅
    });
    
    it('item deve ter stats.def', () => {
        const item = {
            id: 'item_test',
            type: 'held',
            stats: {
                atk: 2,
                def: 3
            }
        };
        
        expect(item.stats.def).toBe(3);  // ✅
    });
    
    it('deve calcular DEF efetiva com buffs', () => {
        const monster = {
            def: 7,
            buffs: [
                { type: 'def', power: 2, duration: 3 }
            ]
        };
        
        const mods = getBuffModifiers(monster);
        const effectiveDef = monster.def + mods.def;
        
        expect(effectiveDef).toBe(9);  // 7 + 2
    });
});
```

---

## 12. Resumo Visual

```
📦 ESTRUTURA DE DADOS - CAMPO DEF

┌─────────────────────────────────────────┐
│ MONSTRINHOS (Monster Instance)          │
├─────────────────────────────────────────┤
│ ✅ monster.def                           │
│ - Acesso direto no nível raiz           │
│ - Valor numérico (ex: 3, 7, 12)         │
│ - Cresce com nível/evolução              │
│ - Base para cálculos de combate          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ITENS (Held Items)                      │
├─────────────────────────────────────────┤
│ ✅ item.stats.def                        │
│ - Em sub-objeto "stats"                  │
│ - Valor numérico fixo (ex: 0, 2, 4)     │
│ - Bônus ao equipar                       │
│ - Somado ao DEF base do monster          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ JOGADORES (Players)                     │
├─────────────────────────────────────────┤
│ ❌ player.def (NÃO EXISTE)               │
│ - Jogadores não têm stats de combate    │
│ - Apenas seus Monstrinhos combatem       │
│ - Use: player.team[0].def               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ DEF EFETIVA (Em Combate)                │
├─────────────────────────────────────────┤
│ effectiveDef = monster.def               │
│              + itemBonus                 │
│              + buffModifiers.def         │
│              (mínimo: 1)                 │
└─────────────────────────────────────────┘
```

---

**Última atualização:** 2026-02-02  
**Referência completa:** `DEF_FIELD_REFERENCE.md`
