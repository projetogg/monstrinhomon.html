# PR11B: Sistema de Quebra de Itens Anti-Frustração

## Visão Geral

Sistema de quebra de itens equipados que ELIMINA punições invisíveis através de um sistema justo baseado em participação real em batalha.

## 🎯 Objetivo

Criar um sistema onde:
- ✅ Itens só quebram se o monstro **realmente participou** da batalha
- ✅ Nenhuma quebra invisível (monstro no banco não perde item)
- ✅ Feedback claro quando quebra ocorre
- ✅ Progressão natural: comum → raro → lendário (indestrutível)

## 📋 Regras Oficiais

### 1. Quebra Baseada em Participação

**REGRA CHAVE**: Item só quebra se o monstro participou da batalha.

**Participação é definida como:**
- Entrou em campo como ativo em algum turno
- Executou qualquer ação (ataque, skill, passar turno)
- Causou dano OU recebeu dano

Se **nenhuma dessas condições** foi atendida → `participatedThisBattle = false` → **NUNCA quebra**

### 2. Momento da Quebra

Quebra é processada **EXATAMENTE UMA VEZ** no final da batalha:
- ✅ Vitória
- ✅ Derrota
- ✅ Fuga válida

**NUNCA quebra:**
- ❌ Por turno
- ❌ Por hit
- ❌ Por skill
- ❌ No meio da batalha

### 3. Tiers de Itens e Chances de Quebra

| Tier | Chance de Quebra | Break Enabled |
|------|------------------|---------------|
| **Comum** | 15% | ✅ true |
| **Incomum** | 10% | ✅ true |
| **Raro** | 5% | ✅ true |
| **Místico** | 0% | ❌ false |
| **Lendário** | 0% | ❌ false |

### 4. Flag Temporária

```javascript
monster.participatedThisBattle = true | false
```

**IMPORTANTE:**
- ❌ **NÃO salvar** em localStorage/JSON
- ❌ **NÃO persistir** entre sessões
- ✅ Apenas runtime (estado de combate)
- ✅ Resetar automaticamente ao iniciar cada batalha

## 🔧 Implementação

### Estrutura de Dados

#### items.json

```json
{
  "items": [
    {
      "id": "IT_ATK_COMUM",
      "name": "Amuleto de Força",
      "description": "Aumenta o ATK do Monstrinho.",
      "type": "held",
      "tier": "comum",
      "stats": {
        "atk": 2,
        "def": 0
      },
      "break": {
        "enabled": true,
        "chance": 0.15
      }
    }
  ]
}
```

#### Monster Instance (runtime)

```javascript
{
  // ... campos existentes ...
  heldItemId: "IT_ATK_COMUM",           // ID do item equipado (opcional)
  participatedThisBattle: false         // Flag temporária (NÃO salvar)
}
```

### Fluxo de Batalha

#### 1. Inicialização

**Wild 1v1:**
```javascript
import { initializeWildBattleParticipation } from './js/combat/itemBreakage.js';

// No início do encounter
initializeWildBattleParticipation(playerMonster, wildMonster);
```

**Group/Boss:**
```javascript
import { initializeGroupBattleParticipation } from './js/combat/itemBreakage.js';

// No início do encounter
const playerMonsters = []; // Coletar todos os monstros ativos
const enemies = []; // Inimigos
initializeGroupBattleParticipation(playerMonsters, enemies);
```

#### 2. Durante a Batalha

**Marcar participação:**
```javascript
import { markAsParticipated } from './js/combat/itemBreakage.js';

// Quando monstro entra em campo
markAsParticipated(monster);

// Quando monstro ataca
markAsParticipated(attacker);

// Quando monstro recebe dano
markAsParticipated(defender);

// Quando monstro causa dano
markAsParticipated(attacker);
```

#### 3. Fim da Batalha

**Processar quebra:**
```javascript
import { processBattleItemBreakage } from './js/combat/itemBreakage.js';

// Victory ou Defeat
const breakResults = processBattleItemBreakage([playerMonster], {
    log: (msg) => encounter.log.push(msg)
});

// breakResults = [
//   { monsterName: "Luma", itemName: "Amuleto de Força" }
// ]
```

### Lógica de Quebra (Pseudocódigo)

```javascript
function handleHeldItemBreak(monster, itemDef) {
  // 1. Item existe?
  if (!monster.heldItemId) return { broke: false };
  
  // 2. Participou da batalha? (REGRA CHAVE)
  if (!monster.participatedThisBattle) return { broke: false };
  
  // 3. Buscar definição do item
  const itemDef = getItemById(monster.heldItemId);
  if (!itemDef) return { broke: false };
  
  // 4. Item pode quebrar?
  if (!itemDef.break.enabled) return { broke: false };
  
  // 5. Rolar quebra
  const roll = Math.random();
  if (roll < itemDef.break.chance) {
    // QUEBROU!
    monster.heldItemId = null; // Remover (NÃO volta ao inventário)
    return { broke: true, itemName: itemDef.name };
  }
  
  return { broke: false };
}
```

## 📦 Itens Disponíveis (13 total)

### Comuns (chance quebra: 15%)
- `IT_ATK_COMUM`: Amuleto de Força (+2 ATK)
- `IT_DEF_COMUM`: Escudo Leve (+2 DEF)

### Incomuns (chance quebra: 10%)
- `IT_ATK_INCOMUM`: Colar de Poder (+4 ATK)
- `IT_DEF_INCOMUM`: Armadura Reforçada (+4 DEF)
- `IT_BALANCED_INCOMUM`: Cristal Equilibrado (+2 ATK, +2 DEF)

### Raros (chance quebra: 5%)
- `IT_ATK_RARO`: Garra do Dragão (+6 ATK)
- `IT_DEF_RARO`: Couraça de Titã (+6 DEF)
- `IT_BALANCED_RARO`: Emblema do Guerreiro (+3 ATK, +3 DEF)

### Místicos (nunca quebram)
- `IT_ATK_MISTICO`: Orbe de Destruição (+8 ATK)
- `IT_DEF_MISTICO`: Égide Mística (+8 DEF)

### Lendários (nunca quebram)
- `IT_ATK_LENDARIO`: Lâmina Eterna (+12 ATK)
- `IT_DEF_LENDARIO`: Escudo do Infinito (+12 DEF)
- `IT_BALANCED_LENDARIO`: Coração do Campeão (+6 ATK, +6 DEF)

## 🧪 Testes

### Cobertura

✅ **19 testes de item breakage** + 242 testes totais

```javascript
// Teste 1: Não quebra se não participou
✅ item não quebra se monstro não participou da batalha

// Teste 2: Quebra se participou (baseado em chance)
✅ item pode quebrar se monstro participou (roll < chance)

// Teste 3: Nunca quebra item lendário
✅ item lendário nunca quebra (break.enabled = false)

// Teste 4: Item removido quando quebra
✅ item quebrado é removido do slot (não volta ao inventário)

// Teste 5: Múltiplos monstros
✅ processa corretamente múltiplos monstros (alguns participaram, outros não)
```

### Exemplo de Teste

```javascript
it('NÃO deve quebrar se monstro não participou', () => {
    const monster = {
        name: 'Luma',
        heldItemId: 'IT_ATK_COMUM',
        participatedThisBattle: false  // NÃO participou
    };

    const result = handleHeldItemBreak(monster);

    expect(result.broke).toBe(false);
    expect(monster.heldItemId).toBe('IT_ATK_COMUM'); // Item ainda equipado
});
```

## 🎨 Design Rationale

### Por que esse sistema é excelente?

1. **Elimina Frustração Invisível**
   - Jogador nunca perde item "misteriosamente"
   - Se monstro não entrou em campo = garantido sem quebra

2. **Ensina pelo Feedback**
   - Quebra só acontece se viu o monstro lutar
   - Log claro: "💔 Amuleto de Força quebrou após a batalha!"

3. **Incentiva Rotação de Monstrinhos**
   - Não dá pra "esconder" monstro equipado
   - Entra em campo = assume risco

4. **Progressão Natural**
   - Comum (15%): barato, descartável, estratégico
   - Raro (5%): requer cuidado, alto valor
   - Lendário (0%): investimento seguro, recompensa final

5. **Compatibilidade Total**
   - ✅ Inventário continua `{ itemId: quantidade }`
   - ✅ Nenhum save antigo quebra
   - ✅ Nenhum item quebra "no banco"
   - ✅ Comportamento previsível e justo

## 🚀 Próximos Passos

### Completar PR11B

- [ ] **UI de Equipamento**
  - [ ] Interface para equipar/desequipar itens
  - [ ] Dropdown de seleção de itens
  - [ ] Visualização de stats com/sem item

- [ ] **Combat UI**
  - [ ] Mostrar item equipado na tela de batalha
  - [ ] Indicador visual de bônus de stats
  - [ ] Animação quando item quebra

- [ ] **Integration no index.html**
  - [ ] Chamar `initializeWildBattleParticipation()` ao iniciar wild battle
  - [ ] Chamar `initializeGroupBattleParticipation()` ao iniciar group battle
  - [ ] Carregar `items.json` no boot

- [ ] **Tutorial**
  - [ ] Explicar sistema de equipamento
  - [ ] Avisar sobre quebra de itens
  - [ ] Destacar que lendários não quebram

## 📚 API Reference

### itemsLoader.js

```javascript
// Carregar items.json
await loadItems()

// Buscar item por ID
const item = getItemById('IT_ATK_COMUM')

// Obter todos os itens
const allItems = getAllItems()

// Filtrar por tier
const legendarios = getItemsByTier('lendario')

// Verificar se pode quebrar
const canBreak = canItemBreak('IT_ATK_COMUM') // true

// Chance de quebra
const chance = getItemBreakChance('IT_ATK_COMUM') // 0.15

// Bônus de stats
const stats = getItemStats('IT_ATK_COMUM') // { atk: 2, def: 0 }
```

### itemBreakage.js

```javascript
// Inicializar participação
initializeBattleParticipation([mon1, mon2, ...])

// Marcar participação
markAsParticipated(monster)

// Verificar participação
const participated = hasParticipated(monster)

// Processar quebra individual
const result = handleHeldItemBreak(monster, { log, notify })

// Processar quebra múltipla
const results = processBattleItemBreakage([mon1, mon2], { log })

// Obter bônus de item equipado
const bonuses = getHeldItemBonuses(monster) // { atk: 2, def: 0 }
```

### wildActions.js / groupActions.js

```javascript
// Wild 1v1
initializeWildBattleParticipation(playerMonster, wildMonster)

// Group/Boss
initializeGroupBattleParticipation(playerMonsters, enemies)
```

## 🔒 Garantias de Segurança

1. ✅ **Sem quebra fantasma**: Flag de participação impede quebra invisível
2. ✅ **Sem perda de dados**: Item quebrado apenas remove `heldItemId`, não afeta inventário
3. ✅ **Sem quebra duplicada**: Processado UMA VEZ no final da batalha
4. ✅ **Sem estado persistente inválido**: Flag temporária não é salva
5. ✅ **Sem race conditions**: Processamento síncrono ao fim da batalha

## 📊 Balanceamento

### Valor Esperado de Vida do Item

Assumindo batalhas consecutivas:

- **Comum (15% quebra)**: ~6.67 batalhas até quebrar
- **Incomum (10% quebra)**: ~10 batalhas até quebrar
- **Raro (5% quebra)**: ~20 batalhas até quebrar
- **Místico/Lendário**: infinitas batalhas (nunca quebra)

### Economia do Sistema

1. **Itens comuns**: consumíveis estratégicos (custo baixo, reposição fácil)
2. **Itens raros**: investimento médio (dura ~20 batalhas, boost significativo)
3. **Itens lendários**: investimento final (caro, permanente, melhor boost)

---

**Versão**: 1.0.0  
**Data**: 2026-02-01  
**Status**: ✅ Core Implementado (UI pendente)
