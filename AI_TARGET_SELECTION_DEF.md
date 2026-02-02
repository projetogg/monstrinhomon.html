# IA por DEF - Sistema de Seleção de Alvos v1

## Visão Geral

Sistema de IA para batalhas em grupo que escolhe alvos baseado em múltiplos fatores, com ênfase em DEF (defesa) para criar comportamento de "aggro" natural, onde tanks atraem mais atenção.

## Contrato de Defesa Efetiva

```javascript
effectiveDef = monster.def + (heldItem?.stats?.def ?? 0) + (buffMods?.def ?? 0)
```

### Aplicável em:
- ✅ Wild battles (1v1)
- ✅ Group battles (múltiplos jogadores)
- ✅ Boss battles
- ✅ Futuro PvP (se implementado)

### Regras:
- ❌ IA **nunca** olha `player.def` (não existe)
- ✅ IA **sempre** olha `monster.def` (nível raiz do objeto)

---

## Fórmula de Score

Para cada alvo elegível, o score é calculado como:

```javascript
score = aggroDEF + posBonus + finisherBonus + noise - focusPenalty
```

### Componentes

#### A) aggroDEF (núcleo da decisão)

Normaliza DEF no intervalo [0, 24]:

```javascript
defMin = min(allTargets.def)
defMax = max(allTargets.def)
defRange = max(1, defMax - defMin)

defNorm = (def - defMin) / defRange
aggroDEF = defNorm * 24
```

**Comportamento:**
- ✅ Tank (alta DEF) naturalmente puxa mais ataques
- ✅ Não cria "imã absoluto" (outros fatores também importam)
- ✅ Escala bem com progressão de níveis

**Variações futuras:**
- Boss inteligente: peso 30
- Inimigo burro: peso 16

#### B) posBonus (neutro por enquanto)

```javascript
posBonus = 8  // Valor fixo para todos
```

**Futuro:**
- Posição no grid
- Distância do atacante
- Frontline vs backline

#### C) finisherBonus (finalizar sem sempre matar o frágil)

```javascript
hpPct = hp / hpMax
finisherBonus = clamp((1 - hpPct) * 16, 0, 16)
```

**Comportamento:**
- ✅ Ajuda a finalizar alvos machucados
- ✅ Não vira "mata-curandeiro" automático
- ✅ HP% 0 → +16 pontos
- ✅ HP% 100 → +0 pontos

#### D) noise (aleatoriedade saudável)

```javascript
noise = random(-6, +6)
```

**Comportamento:**
- ✅ Quebra previsibilidade
- ✅ Não quebra lógica (range controlado)
- ✅ Dois combates nunca são idênticos

#### E) focusPenalty (espalhar dano)

```javascript
focusPenalty = recentTargets[targetId] * 8
```

**Comportamento:**
- ✅ Impede foco infinito no mesmo alvo
- ✅ Mantém pressão no tank (mas não exclusiva)
- ✅ Penalty cresce a cada hit: 0 → 8 → 16 → 24...

**Tracking:**
```javascript
// Após ataque bem-sucedido
enc.recentTargets[targetPid] = (enc.recentTargets[targetPid] || 0) + 1
```

**Decaimento:**
- Por enquanto: acumulativo durante o encounter
- Futuro: decair por rodada ou fase

---

## Seleção de Alvo

### ❌ NÃO: Escolha Determinística

```javascript
// ERRADO - comportamento robótico
return targets.sort((a,b) => b.score - a.score)[0];
```

### ✅ SIM: Seleção Ponderada

```javascript
// Ordenar por score desc
scored.sort((a, b) => b.score - a.score);

// Escolher ponderado: top 3
const roll = random();

if (roll < 0.60) return scored[0];      // 60% top1
else if (roll < 0.90) return scored[1]; // 30% top2
else return scored[2];                   // 10% top3
```

**Comportamento:**
- ✅ Escolha parece "humana"
- ✅ Não é robótico/previsível
- ✅ Respeita lógica (mais score = mais chance)
- ✅ Permite surpresas táticas

---

## Alvos Elegíveis

### Critérios de Elegibilidade

1. ✅ Está em `participants` do encounter
2. ✅ Não fugiu (futuro: verificar flag `hasFled`)
3. ✅ `activeMonster.hp > 0`

```javascript
function buildEligibleTargets(enc, deps) {
    const targets = [];
    
    for (const playerId of enc.participants) {
        const player = getPlayerById(playerId);
        const monster = getActiveMonsterOfPlayer(player);
        
        if (!monster || !isAlive(monster)) continue;
        
        const heldItem = getItemById(monster.heldItemId);
        
        targets.push({
            playerId: playerId,
            monster: monster,
            heldItem: heldItem
        });
    }
    
    return targets;
}
```

### ❌ Nunca Elegíveis

- Jogadores que fugiram
- Monstrinhos com HP ≤ 0
- Monstrinhos não ativos
- Não-participantes do encounter

---

## Comportamento Emergente

O sistema produz comportamentos táticos naturais sem regras explícitas:

### 🛡️ Tank Puxa Mais

```
Guerreiro (DEF 20) vs DPS (DEF 5)

aggroDEF(tank) = 24  (normalizado máximo)
aggroDEF(dps)  = 0   (normalizado mínimo)

→ Tank tem +24 pontos de base
→ Puxa ~70% dos ataques (com noise e outros fatores)
```

### 💉 Curandeiro Não Fica Imune

```
Curandeiro (DEF 7, HP 100%)
Guerreiro (DEF 20, HP 50%)

aggroDEF(guerreiro) = 24
aggroDEF(curandeiro) = 8
finisherBonus(guerreiro) = 8  (50% HP)

Score(guerreiro) = 24 + 8 + 8 + noise - penalty = ~40
Score(curandeiro) = 8 + 8 + 0 + noise - penalty = ~16

→ Guerreiro mais provável, mas curandeiro ainda pode ser alvo
→ Se guerreiro já foi alvo 3x: penalty = 24, scores se aproximam
```

### ⚔️ Finalização Tática

```
Alvo fraco (DEF 10, HP 10%)
Alvo forte (DEF 15, HP 90%)

finisherBonus(fraco) = 14.4  (90% perdido)
finisherBonus(forte) = 1.6   (10% perdido)

→ +12.8 pontos a favor do alvo fraco
→ Incentiva finalização, mas não garante
```

### 🔁 Anti-Repetição

```
Turno 1: Ataca P1 → recentTargets[P1] = 1
Turno 2: Ataca P1 → recentTargets[P1] = 2 → penalty = 16
Turno 3: Ataca P1 → recentTargets[P1] = 3 → penalty = 24

→ Penalty cresce, outros alvos ficam mais atrativos
→ Espalha dano naturalmente
```

### 🎲 Imprevisibilidade

```
Mesma situação, 3 combates diferentes:

Combate A: noise = +5 → Tank recebe ataque
Combate B: noise = -5 → DPS recebe ataque
Combate C: noise = +2 + roll(0.65) → Top2 escolhido

→ Comportamento variado, nunca robótico
```

---

## Implementação

### Função Principal

```javascript
/**
 * IA v1 - Escolhe alvo baseado em DEF (aggro)
 * 
 * @param {array} targets - Alvos elegíveis: [{ id, playerId, monster, heldItem }]
 * @param {object} recentTargets - Mapa de hits recentes: { playerId: hitCount }
 * @param {function} rngFn - Função random (0-1) para testes determinísticos
 * @returns {string|null} playerId do alvo escolhido ou null
 */
export function pickEnemyTargetByDEF(targets, recentTargets = {}, rngFn = Math.random)
```

### Integração

```javascript
// Em executeEnemyTurnGroup()

// 1. Inicializar recentTargets
if (!enc.recentTargets) {
    enc.recentTargets = {};
}

// 2. Construir alvos elegíveis
const eligibleTargets = buildEligibleTargets(enc, deps);

// 3. Escolher alvo
const targetPid = GroupCore.pickEnemyTargetByDEF(
    eligibleTargets, 
    enc.recentTargets
);

// 4. Atualizar tracking após hit
enc.recentTargets[targetPid] = (enc.recentTargets[targetPid] || 0) + 1;
```

---

## Testes

### Cobertura

```
✅ 10 testes específicos da IA
✅ 4 testes de calculateEffectiveDefense
✅ 400 testes totais passando
```

### Testes-Chave

#### 1. Alvo com DEF maior é escolhido mais frequentemente

```javascript
it('deve escolher alvo com maior DEF com mais frequência (seeded)', () => {
    const targets = [
        { playerId: 'tank', monster: { def: 20, hp: 100, hpMax: 100 } },
        { playerId: 'dps', monster: { def: 5, hp: 60, hpMax: 60 } }
    ];
    
    // Simular 100 escolhas
    // Tank (maior DEF) deve ser escolhido > 50% das vezes
});
```

#### 2. Morto nunca é escolhido

```javascript
it('nunca deve escolher alvo morto (HP = 0)', () => {
    // Alvos mortos não devem estar em eligibleTargets
    // buildEligibleTargets() os filtra
});
```

#### 3. focusPenalty reduz repetição

```javascript
it('deve aplicar focusPenalty e reduzir repetição', () => {
    // Após múltiplos hits no mesmo alvo
    // Penalty cresce: 8 → 16 → 24
    // Outros alvos ficam mais atrativos
});
```

#### 4. finisherBonus para HP baixo

```javascript
it('deve aplicar finisherBonus para alvos com HP baixo', () => {
    const targets = [
        { playerId: 'healthy', monster: { def: 15, hp: 90, hpMax: 100 } },
        { playerId: 'wounded', monster: { def: 15, hp: 10, hpMax: 100 } }
    ];
    
    // wounded deve ser escolhido mais frequentemente
});
```

---

## Próximos Passos

### ✅ Completo (Passo 4.4)

- [x] Implementar `pickEnemyTargetByDEF`
- [x] Integrar em `resolveEnemyTurn`
- [x] 4 testes essenciais + extras
- [x] 400/400 testes passando

### 🎯 Próximo (Passo 4.5)

- [ ] `performAction` completo (skill, item, flee)
- [ ] `endBattleAndDistributeRewards`
- [ ] Sistema pronto para sessão clínica real

---

## Referências

### Arquivos Modificados

- `js/combat/groupCore.js` - Funções puras da IA
- `js/combat/groupActions.js` - Integração e tracking
- `tests/groupCore.test.js` - Testes abrangentes

### Funções Principais

- `pickEnemyTargetByDEF()` - Lógica principal da IA
- `calculateEffectiveDefense()` - Cálculo de DEF efetiva
- `buildEligibleTargets()` - Filtra alvos elegíveis
- `executeEnemyTurnGroup()` - Integração no turno do inimigo

---

**Data:** 2026-02-02  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e testado  
**Próximo:** Passo 4.5 - performAction completo
