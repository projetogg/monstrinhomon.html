# Referência: Campo DEF (Defense) no Monstrinhomon

## Resumo Executivo

O campo **DEF (Defense)** está localizado **diretamente** no objeto da instância do Monstrinho.

```javascript
// ✅ CORRETO - DEF está no nível raiz do objeto
monster.def

// ❌ INCORRETO - NÃO está em sub-objeto stats
monster.stats.def  // ⛔ Não existe para monstros

// ⚠️ EXCEÇÃO - Itens têm stats.def
item.stats.def     // ✓ Apenas para itens equipáveis
```

---

## 1. Estrutura de Dados: Monstrinhos

### 1.1 Instância de Monstrinho (Monster Instance)

Quando um Monstrinho é criado, seja por captura, choque de ovo ou início de jogo, ele possui a seguinte estrutura:

```javascript
const monsterInstance = {
    id: 'mi_1234567890_abc123',      // ID único da instância
    monsterId: 'm_luma',              // ID do template no catálogo
    name: 'Luma',                     // Nome do Monstrinho
    class: 'Mago',                    // Classe (Guerreiro, Mago, etc.)
    rarity: 'Comum',                  // Raridade
    emoji: '✨',                       // Emoji representativo
    level: 1,                         // Nível atual
    xp: 0,                            // XP acumulado
    hp: 26,                           // HP atual
    hpMax: 26,                        // HP máximo
    
    // ⭐ STATS DE COMBATE (nível raiz)
    atk: 5,                           // ✅ Ataque
    def: 3,                           // ✅ Defesa
    spd: 5,                           // ✅ Velocidade
    ene: 6,                           // ✅ Energia atual
    eneMax: 6,                        // ✅ Energia máxima
    
    // Equipamento e buffs
    heldItemId: null,                 // ID do item equipado (ou null)
    buffs: []                         // Array de buffs temporários
};
```

**Localização no código:**
- **Criação**: `js/data/eggHatcher.js`, linha 91
- **Referência**: Função `createMonsterInstance(template, level)`

### 1.2 Acesso ao DEF

```javascript
// Em combate selvagem (wild)
const wildMonster = encounter.wildMonster;
const defValue = wildMonster.def;  // ✅ Acesso direto

// Em combate em grupo
const enemy = groupEncounter.enemies[0];
const enemyDef = enemy.def;  // ✅ Acesso direto

// No time do jogador
const playerMonster = player.team[0];
const monsterDef = playerMonster.def;  // ✅ Acesso direto
```

**Exemplos do código:**
- `js/combat/wildCore.js`, linha 28: `const defValue = defender.def || 3;`
- `js/combat/wildActions.js`, linha 85: `encounter.wildMonster.def`
- `js/combat/groupActions.js`, linha 130: `enemy.def`

---

## 2. Estrutura de Dados: Jogadores

### 2.1 Objeto do Jogador

Jogadores **NÃO possuem** campo `def` diretamente. Eles não participam diretamente do combate - seus Monstrinhos sim.

```javascript
const player = {
    id: 'player_abc123',
    name: 'João',
    class: 'Guerreiro',              // Classe do jogador
    team: [],                        // Array de Monstrinhos
    box: [],                         // Monstrinhos na box
    inventory: {},                   // Itens do inventário
    currency: 0,                     // Moeda do jogo
    
    // ⚠️ Jogadores NÃO têm stats de combate
    // def: undefined  ❌
    // atk: undefined  ❌
    // spd: undefined  ❌
};
```

**Importante:**
- Jogadores não combatem diretamente
- Apenas seus Monstrinhos têm stats de combate (atk, def, spd)
- A classe do jogador determina quais Monstrinhos podem usar em batalha

---

## 3. Estrutura de Dados: Itens

### 3.1 Itens Equipáveis (Held Items)

Itens que podem ser equipados em Monstrinhos possuem **`stats`** como sub-objeto:

```javascript
const heldItem = {
    id: 'item_power_band',
    name: 'Faixa de Poder',
    type: 'held',
    
    // ⭐ STATS em sub-objeto (diferente de monstros!)
    stats: {
        atk: 3,                      // ✅ Bônus de ataque
        def: 2                       // ✅ Bônus de defesa
    },
    
    breakRules: {
        canBreak: true,
        breakChance: 0.20,
        maxUses: null
    },
    
    cost: 150,
    sellValue: 75
};
```

**Acesso ao DEF de itens:**
```javascript
// ✅ Correto para itens
const itemDef = item.stats.def;

// Validação
if (item.stats?.def > 0) {
    console.log(`+${item.stats.def} DEF`);
}
```

**Exemplos do código:**
- `js/data/itemsLoader.js`, linha 129: `if (typeof item.stats.def !== 'number')`
- `js/combat/itemUIHelpers.js`, linha 26: `if (itemDef.stats.def > 0)`
- `js/combat/groupUI.js`, linha 84: `if (itemDef.stats?.def > 0)`

---

## 4. Diferenças Críticas

### 4.1 Monstros vs Itens

| Aspecto | Monstros | Itens |
|---------|----------|-------|
| **Estrutura** | `monster.def` | `item.stats.def` |
| **Nível** | Raiz do objeto | Sub-objeto `stats` |
| **Tipo** | Valor direto | Bônus ao equipar |
| **Mutável** | Sim (level up) | Não (valor fixo) |

### 4.2 Por que são diferentes?

**Monstros:**
- DEF é um atributo **intrínseco** do Monstrinho
- Cresce com nível e evoluções
- É o valor **base** usado em cálculos

**Itens:**
- DEF é um **bônus** ao equipar
- Valor **fixo** definido no catálogo de itens
- É **somado** ao DEF base do Monstrinho

---

## 5. Uso em Combate

### 5.1 Cálculo de Defesa Efetiva

Ao calcular dano, a defesa efetiva considera:

```javascript
// 1. DEF base do Monstrinho
const baseDef = monster.def;

// 2. Bônus de item equipado (se houver)
let itemDefBonus = 0;
if (monster.heldItemId) {
    const item = getItemById(monster.heldItemId);
    if (item?.stats?.def) {
        itemDefBonus = item.stats.def;
    }
}

// 3. Buffs temporários (de habilidades)
const buffMods = getBuffModifiers(monster);
const buffDefBonus = buffMods.def;

// 4. Defesa Efetiva
const effectiveDef = Math.max(1, baseDef + itemDefBonus + buffDefBonus);
```

**Exemplo real:**
- `js/combat/wildActions.js`, linhas 84-85:
  ```javascript
  const defMods = WildCore.getBuffModifiers(encounter.wildMonster);
  const effectiveDef = Math.max(1, encounter.wildMonster.def + defMods.def);
  ```

### 5.2 Fórmula de Acerto

```javascript
// REGRA: d20 + ATK + bônus_classe >= DEF
const totalAtk = d20Roll + attacker.atk + classAdvantageBonus;
const hit = totalAtk >= defender.def;
```

**Localização:**
- `js/combat/wildCore.js`, função `checkHit()`, linha 23

---

## 6. Valores Padrão

### 6.1 Monstrinhos Iniciais

Quando um Monstrinho é criado:

```javascript
atk: template.baseAtk || 5,    // Padrão: 5
def: template.baseDef || 3,    // Padrão: 3
spd: template.baseSpd || 5,    // Padrão: 5
```

**Fonte:** `js/data/eggHatcher.js`, linhas 90-92

### 6.2 Validação de Segurança

Se o valor não existir (por bug ou dados corrompidos):

```javascript
// Sempre garantir valor mínimo
const defValue = defender.def || 3;  // Fallback para 3
```

**Fonte:** `js/combat/wildCore.js`, linhas 28 e 140

---

## 7. Exemplos de Uso

### 7.1 Ler DEF de um Monstrinho

```javascript
// Monstrinho no time do jogador
const player = getCurrentPlayer();
const activeMonster = player.team[0];
console.log(`DEF: ${activeMonster.def}`);  // ✅

// Monstrinho selvagem em combate
const wildMon = encounter.wildMonster;
console.log(`DEF do inimigo: ${wildMon.def}`);  // ✅

// Inimigo em batalha em grupo
const enemy = groupEncounter.enemies[0];
console.log(`DEF: ${enemy.def}`);  // ✅
```

### 7.2 Modificar DEF (com cuidado!)

```javascript
// Aplicar buff de defesa
monster.buffs.push({
    type: 'def',
    power: 2,        // +2 DEF
    duration: 3      // Por 3 turnos
});

// Level up (recalcular stats)
monster.def = 12 + monster.level * 2;  // Fórmula de crescimento
```

### 7.3 Bônus de Item

```javascript
// Equipar item
monster.heldItemId = 'item_power_band';

// Calcular bônus total
function getTotalDef(monster) {
    let total = monster.def;
    
    if (monster.heldItemId) {
        const item = getItemById(monster.heldItemId);
        if (item?.stats?.def) {
            total += item.stats.def;
        }
    }
    
    return total;
}
```

---

## 8. Testes e Validação

### 8.1 Testes Existentes

Os testes confirmam a estrutura `monster.def`:

**`tests/wildCore.test.js`:**
```javascript
const attacker = { atk: 5, class: 'Guerreiro' };
const defender = { def: 10, class: 'Mago' };  // ✅ def direto
```

**`tests/xpActions.test.js`:**
```javascript
mon.def = 12 + mon.level * 2;  // ✅ Modificação direta
```

### 8.2 Como Testar

```javascript
import { describe, it, expect } from 'vitest';

describe('DEF field access', () => {
    it('deve acessar DEF diretamente do monstro', () => {
        const monster = {
            id: 'mi_test',
            name: 'Test Mon',
            level: 1,
            def: 3
        };
        
        expect(monster.def).toBe(3);  // ✅
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
});
```

---

## 9. Migração e Compatibilidade

### 9.1 Se Dados Antigos Existirem

Se algum save antigo usar `monster.stats.def`, corrigir na carga:

```javascript
function migrateMonsterData(monster) {
    // Migrar stats.def para raiz (se existir)
    if (monster.stats?.def !== undefined && monster.def === undefined) {
        monster.def = monster.stats.def;
        console.warn('Migrated monster.stats.def to monster.def');
    }
    
    // Sempre garantir def existe
    if (typeof monster.def !== 'number') {
        monster.def = 3;  // Valor padrão
    }
    
    return monster;
}
```

### 9.2 Validação de Integridade

```javascript
function validateMonsterInstance(monster) {
    const errors = [];
    
    if (typeof monster.def !== 'number') {
        errors.push('DEF must be a number');
    }
    
    if (monster.def < 1) {
        errors.push('DEF must be at least 1');
    }
    
    return errors;
}
```

---

## 10. Referência Rápida

### 10.1 Cheat Sheet

```javascript
// ✅ MONSTROS (nível raiz)
monster.def
encounter.wildMonster.def
player.team[0].def
enemy.def

// ✅ ITENS (sub-objeto stats)
item.stats.def
heldItem.stats.def

// ❌ INCORRETO
monster.stats.def    // ⛔ NÃO existe
player.def           // ⛔ Jogadores não têm DEF
item.def             // ⛔ Itens não têm DEF direto
```

### 10.2 Arquivos Chave

| Arquivo | Linha(s) | Descrição |
|---------|----------|-----------|
| `js/data/eggHatcher.js` | 91 | Criação de instância (def base) |
| `js/combat/wildCore.js` | 28, 140 | Acesso ao DEF em combate |
| `js/combat/wildActions.js` | 85, 270 | Cálculo de defesa efetiva |
| `js/combat/groupActions.js` | 130, 257 | DEF em batalhas em grupo |
| `js/data/itemsLoader.js` | 129, 219 | DEF de itens (stats.def) |
| `tests/wildCore.test.js` | 29 | Testes confirmando estrutura |

---

## 11. FAQ

**Q: Por que monstros não têm `stats.def`?**  
A: Por design de simplicidade. Stats (atk, def, spd, ene) são propriedades diretas do Monstrinho. Apenas itens usam `stats` como sub-objeto.

**Q: Posso adicionar `monster.stats.def` no futuro?**  
A: Não recomendado. Quebraria compatibilidade com saves existentes e todo o código atual. Se precisar refatorar, fazer migração cuidadosa.

**Q: E `activeMonster.def`?**  
A: Se `activeMonster` é uma instância de Monstrinho, então `activeMonster.def` funciona normalmente. É apenas uma variável de referência.

**Q: Como sei se um objeto é Monstrinho ou Item?**  
A: Verifique o campo `type` ou `monsterId`:
```javascript
if (obj.monsterId) {
    // É um Monstrinho
    return obj.def;
} else if (obj.type === 'held') {
    // É um item
    return obj.stats.def;
}
```

---

## 12. Changelog

| Data | Mudança |
|------|---------|
| 2026-02-02 | Criação inicial da documentação |

---

**Última atualização:** 2026-02-02  
**Versão:** 1.0.0  
**Autor:** Sistema de Documentação Monstrinhomon
