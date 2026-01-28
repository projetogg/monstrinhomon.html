# Feature 3.2 - Batalhas em Grupo MVP

## 📋 Plano Completo de Implementação

### Resposta à Pergunta Original

**"No seu código atual, o monstro ativo do jogador fica onde?"**

**Resposta:** `player.team[0]`

- Linha 1199: `const playerMonster = player?.team?.[0];`
- Linha 1696: `const playerMonster = player.team?.[0];`

O sistema sempre usa o **primeiro monstrinho do team** como ativo.

---

## 🎯 Objetivo do MVP

**Meta:** Permitir batalhas com **2+ jogadores vs 1 inimigo**

### Escopo Reduzido (MVP 1)
- Múltiplos jogadores (1-6)
- **1 inimigo apenas** (simplificação)
- Turnos por SPD
- Sem captura (apenas em wild)
- Reutilizar lógica existente

### Fora do Escopo (Futuro)
- Múltiplos inimigos (1-3)
- Escolha de alvo (auto-targeting)
- Troca de monstro mid-battle
- Fuga em grupo

---

## 📊 Estrutura Atual vs Nova

### Encounter Wild (1v1) - Atual
```javascript
{
    id: timestamp,
    type: 'wild',
    active: true,
    log: [],
    selectedPlayerId: 'player_id',
    wildMonster: { ... }
}
```

**Acesso:**
- Jogador: `GameState.players.find(p => p.id === encounter.selectedPlayerId)`
- Monstrinho jogador: `player.team[0]`
- Inimigo: `encounter.wildMonster`

### Encounter Group - Novo
```javascript
{
    id: timestamp,
    type: 'group_trainer',  // ou 'boss'
    active: true,
    log: [],
    
    // Novos campos
    participants: ['player_1', 'player_2'],  // array de playerIds
    enemies: [                                // array de monsters
        { ...monsterInstance, id: 'enemy_1' }
    ],
    turnOrder: [                              // ordem calculada por SPD
        { side: 'player', id: 'player_1', spd: 15, tiebreaker: 18 },
        { side: 'enemy', id: 'enemy_1', spd: 12, tiebreaker: 10 },
        { side: 'player', id: 'player_2', spd: 10, tiebreaker: 14 }
    ],
    turnIndex: 0,                             // índice atual em turnOrder
    currentActor: {                           // ator atual
        side: 'player',                       // 'player' ou 'enemy'
        id: 'player_1'                        // playerId ou enemyId
    }
}
```

**Acesso:**
- Jogadores: `encounter.participants.map(id => GameState.players.find(p => p.id === id))`
- Monstrinhos: `players.map(p => p.team[0])`
- Inimigos: `encounter.enemies`
- Ator atual: `getCurrentActor(encounter)`

---

## 🗂️ Fases de Implementação

### Fase 1: Estrutura Base ✅ (PR 3.2.1)

#### A. UI de Seleção
- [x] Detectar tipo 'trainer' ou 'boss'
- [x] Mostrar checkboxes de jogadores
- [x] Validar 1-6 selecionados
- [x] Botão "Iniciar Batalha em Grupo"

#### B. Função startGroupEncounter()
```javascript
function startGroupEncounter(selectedPlayerIds, enemyTemplate, enemyLevel) {
    // 1. Validar participantes
    // 2. Criar inimigo
    // 3. Criar encounter
    // 4. Salvar e renderizar
}
```

#### C. Estrutura de Dados
- [x] Campo `participants`
- [x] Campo `enemies` (com 1 inimigo)
- [x] Campo `turnOrder` (vazio por enquanto)
- [x] Campo `turnIndex` = 0
- [x] Campo `currentActor` = null

**Status:** COMPLETO ✅

---

### Fase 2: Sistema de Turnos (PR 3.2.2)

#### A. Calcular Ordem

```javascript
function calculateGroupTurnOrder(encounter) {
    const actors = [];
    
    // Adicionar jogadores
    encounter.participants.forEach(playerId => {
        const player = GameState.players.find(p => p.id === playerId);
        if (player && player.team[0] && player.team[0].hp > 0) {
            const monster = player.team[0];
            const spd = monster.spd || 10;
            const tiebreaker = Math.floor(Math.random() * 20) + 1;  // d20
            
            actors.push({
                side: 'player',
                id: playerId,
                spd: spd,
                tiebreaker: tiebreaker
            });
        }
    });
    
    // Adicionar inimigos
    encounter.enemies.forEach(enemy => {
        const spd = enemy.spd || 10;
        const tiebreaker = Math.floor(Math.random() * 20) + 1;
        
        actors.push({
            side: 'enemy',
            id: enemy.id,
            spd: spd,
            tiebreaker: tiebreaker
        });
    });
    
    // Ordenar: SPD desc, depois tiebreaker desc
    actors.sort((a, b) => {
        if (b.spd !== a.spd) return b.spd - a.spd;
        return b.tiebreaker - a.tiebreaker;
    });
    
    encounter.turnOrder = actors;
    encounter.turnIndex = 0;
    encounter.currentActor = actors[0];
    
    return actors;
}
```

#### B. Avançar Turno

```javascript
function advanceTurn(encounter) {
    if (!encounter.turnOrder || encounter.turnOrder.length === 0) {
        calculateGroupTurnOrder(encounter);
        return;
    }
    
    encounter.turnIndex++;
    
    // Se chegou ao fim, recomeça
    if (encounter.turnIndex >= encounter.turnOrder.length) {
        encounter.turnIndex = 0;
        // Novo round: atualizar buffs, ENE regen, etc
    }
    
    encounter.currentActor = encounter.turnOrder[encounter.turnIndex];
}
```

#### C. Obter Ator Atual

```javascript
function getCurrentActor(encounter) {
    if (!encounter.currentActor) return null;
    
    if (encounter.currentActor.side === 'player') {
        const player = GameState.players.find(p => p.id === encounter.currentActor.id);
        return {
            type: 'player',
            player: player,
            monster: player?.team?.[0]
        };
    } else {
        const enemy = encounter.enemies.find(e => e.id === encounter.currentActor.id);
        return {
            type: 'enemy',
            monster: enemy
        };
    }
}
```

**Status:** PENDENTE ⏳

---

### Fase 3: Batalha Completa (PR 3.2.3)

#### A. Renderização

```javascript
function renderGroupEncounter(panel, encounter) {
    const actor = getCurrentActor(encounter);
    
    let html = `
        <div class="encounter-panel">
            <h3>⚔️ Batalha em Grupo</h3>
            
            <!-- Seção de Participantes -->
            <div class="participants-section">
                <h4>👥 Participantes</h4>
                ${renderParticipants(encounter)}
            </div>
            
            <!-- Indicador de Turno -->
            <div class="turn-indicator">
                <strong>Turno Atual:</strong> 
                ${renderCurrentTurn(encounter, actor)}
            </div>
            
            <!-- Seção do Inimigo -->
            <div class="enemy-section">
                <h4>👹 Inimigo</h4>
                ${renderEnemies(encounter)}
            </div>
            
            <!-- Log de Combate -->
            <div class="combat-log">
                ${renderCombatLog(encounter)}
            </div>
            
            <!-- Ações (se for turno do jogador) -->
            ${actor && actor.type === 'player' ? renderPlayerActions(encounter, actor) : ''}
            
            <!-- Mensagem de Captura Desabilitada -->
            <div style="background: #ffebee; padding: 10px; border-radius: 5px; margin-top: 10px;">
                <strong>ℹ️ Capturas só em encontros individuais</strong>
            </div>
        </div>
    `;
    
    panel.innerHTML = html;
}
```

#### B. Ações do Jogador

```javascript
function groupAttack() {
    const encounter = GameState.currentEncounter;
    const actor = getCurrentActor(encounter);
    
    if (!actor || actor.type !== 'player') return;
    
    // Reutilizar lógica de attackWild
    // - Pegar dice roll
    // - Calcular hit
    // - Calcular damage
    // - Aplicar ao inimigo (primeiro com HP > 0)
    
    // Depois: advanceTurn()
}

function groupUseSkill(skillIndex) {
    const encounter = GameState.currentEncounter;
    const actor = getCurrentActor(encounter);
    
    if (!actor || actor.type !== 'player') return;
    
    // Reutilizar lógica de useSkill
    // - Validar ENE
    // - Aplicar efeito
    // - Consumir ENE
    
    // Depois: advanceTurn()
}

function groupUseItem(itemId) {
    const encounter = GameState.currentEncounter;
    const actor = getCurrentActor(encounter);
    
    if (!actor || actor.type !== 'player') return;
    
    // Reutilizar lógica de useItemInBattle
    // - Validar item
    // - Aplicar cura
    // - Consumir item
    
    // Depois: advanceTurn()
}

function groupPassTurn() {
    const encounter = GameState.currentEncounter;
    encounter.log.push(`⏭️ ${getCurrentActor(encounter).player.name} passou o turno`);
    advanceTurn(encounter);
    saveToLocalStorage();
    renderEncounter();
}
```

#### C. IA do Inimigo

```javascript
function processEnemyTurnGroup(encounter) {
    const actor = getCurrentActor(encounter);
    if (!actor || actor.type !== 'enemy') return;
    
    const enemy = actor.monster;
    
    // Escolher alvo (jogador com menor HP)
    let target = null;
    let minHp = Infinity;
    
    encounter.participants.forEach(playerId => {
        const player = GameState.players.find(p => p.id === playerId);
        const monster = player?.team?.[0];
        if (monster && monster.hp > 0 && monster.hp < minHp) {
            minHp = monster.hp;
            target = { player, monster };
        }
    });
    
    if (!target) {
        // Nenhum alvo válido -> derrota dos jogadores
        encounter.active = false;
        encounter.log.push('💀 Derrota! Todos os jogadores foram derrotados!');
        saveToLocalStorage();
        renderEncounter();
        return;
    }
    
    // ENE regen
    applyEneRegen(enemy, encounter);
    updateBuffs(enemy);
    
    // Decidir ação (50% skill / 50% ataque)
    const skills = getMonsterSkills(enemy);
    const canUseSkill = skills.length > 0 && (enemy.ene || 0) >= skills[0].cost;
    const shouldUseSkill = canUseSkill && Math.random() < 0.5;
    
    if (shouldUseSkill) {
        // Usar habilidade
        useSkill(enemy, skills[0], target.monster, encounter);
    } else {
        // Ataque básico
        const enemyRoll = Math.floor(Math.random() * 20) + 1;
        encounter.log.push(`🎲 ${enemy.name} rolls ${enemyRoll}`);
        
        // Calcular hit e damage (reutilizar lógica)
        // ...
    }
    
    // Verificar se alvo morreu
    if (target.monster.hp <= 0) {
        encounter.log.push(`💀 ${target.monster.name} foi derrotado!`);
    }
    
    // Avançar turno
    advanceTurn(encounter);
    
    saveToLocalStorage();
    renderEncounter();
}
```

#### D. Vitória e Derrota

```javascript
function checkGroupBattleEnd(encounter) {
    // Vitória: todos inimigos derrotados
    const allEnemiesDead = encounter.enemies.every(e => e.hp <= 0);
    if (allEnemiesDead) {
        encounter.active = false;
        encounter.log.push('🎉 VITÓRIA! Todos os inimigos foram derrotados!');
        // TODO: distribuir XP
        return 'victory';
    }
    
    // Derrota: todos jogadores derrotados
    const allPlayersDead = encounter.participants.every(playerId => {
        const player = GameState.players.find(p => p.id === playerId);
        const monster = player?.team?.[0];
        return !monster || monster.hp <= 0;
    });
    
    if (allPlayersDead) {
        encounter.active = false;
        encounter.log.push('💀 DERROTA! Todos os jogadores foram derrotados!');
        return 'defeat';
    }
    
    return null;  // Batalha continua
}
```

**Status:** PENDENTE ⏳

---

## 🎮 Fluxo de Jogo

### Iniciar Batalha

1. Jogador vai na tab Encounter
2. Seleciona tipo "Trainer Battle (Group)"
3. Marca checkboxes de 2+ jogadores
4. Seleciona nível do inimigo
5. Clica "Iniciar Batalha em Grupo"
6. Sistema cria encounter e calcula turnos
7. Renderiza tela de batalha

### Durante Batalha

```
LOOP:
    1. Renderizar estado atual
    2. Se turno do jogador:
        a. Mostrar botões (Atacar, Skill, Item, Passar)
        b. Aguardar ação do jogador
        c. Aplicar ação
        d. Avançar turno
    3. Se turno do inimigo:
        a. IA decide ação
        b. Escolhe alvo
        c. Aplica ação
        d. Avançar turno
    4. Verificar fim de batalha
    5. Se não acabou, goto LOOP
```

### Fim de Batalha

- **Vitória:** Mostrar mensagem, distribuir XP (futuro)
- **Derrota:** Mostrar mensagem, resetar encounter

---

## 🔧 Funções a Criar

### Core
- [x] `startGroupEncounter(playerIds, enemyTemplate, level)`
- [ ] `calculateGroupTurnOrder(encounter)`
- [ ] `getCurrentActor(encounter)`
- [ ] `advanceTurn(encounter)`

### Renderização
- [ ] `renderGroupEncounter(panel, encounter)`
- [ ] `renderParticipants(encounter)`
- [ ] `renderEnemies(encounter)`
- [ ] `renderCurrentTurn(encounter, actor)`
- [ ] `renderPlayerActions(encounter, actor)`

### Ações
- [ ] `groupAttack()`
- [ ] `groupUseSkill(skillIndex)`
- [ ] `groupUseItem(itemId)`
- [ ] `groupPassTurn()`

### IA
- [ ] `processEnemyTurnGroup(encounter)`
- [ ] `chooseEnemyTarget(encounter)` (menor HP)

### Fim de Jogo
- [ ] `checkGroupBattleEnd(encounter)`

---

## ✅ Critérios de Aceitação

### MVP 1 (2 jogadores vs 1 inimigo)

- [x] Iniciar batalha com 2+ jogadores ✅
- [ ] Ordem por SPD funcionando
- [ ] Cada jogador age no seu turno
- [ ] Inimigo age no seu turno
- [ ] Atacar/Skill/Item funcionam
- [ ] Captura desabilitada
- [ ] Vitória ao derrotar inimigo
- [ ] Derrota quando todos jogadores caem
- [ ] Persiste corretamente
- [ ] Não quebra wild 1v1 ✅

---

## 📝 Observações Importantes

### Reutilização de Código

**✅ Reutilizar:**
- `calcDamage()`
- `checkHit()`  
- `applyEneRegen()`
- `updateBuffs()`
- `getMonsterSkills()`
- `useSkill()` (adaptar target)
- Lógica de cura de item

**❌ Não modificar:**
- `attackWild()`
- `useSkillWild()`
- `useItemInBattle()`
- `renderWildEncounter()`

**✨ Criar novos:**
- `groupAttack()`
- `groupUseSkill()`
- `groupUseItem()`
- `renderGroupEncounter()`

### Simplificações do MVP

1. **1 inimigo apenas** (não 1-3)
2. **Auto-targeting** (menor HP)
3. **Sem troca mid-battle**
4. **Sem fuga em grupo**
5. **Sem escolha manual de alvo**

### Expansão Futura

Depois do MVP:
- Múltiplos inimigos (1-3)
- Escolha manual de alvo
- Troca de monstrinho mid-battle
- Fuga em grupo (todos concordam)
- Boss battles especiais

---

## 📅 Cronograma

| Fase | Descrição | Tempo | Status |
|------|-----------|-------|--------|
| 3.2.1 | Estrutura base + UI seleção | 2h | ✅ COMPLETO |
| 3.2.2 | Sistema de turnos | 2h | ⏳ PENDENTE |
| 3.2.3 | Batalha completa + IA | 3h | ⏳ PENDENTE |
| **TOTAL** | | **7h** | **14% completo** |

---

## 🎯 Próximo Passo Imediato

**Implementar Fase 2 (PR 3.2.2):**
1. Função `calculateGroupTurnOrder()`
2. Função `advanceTurn()`
3. Função `getCurrentActor()`
4. Renderização básica mostrando turnOrder

**Tempo estimado:** 2 horas

---

**Status:** Fase 1 completa, preparando Fase 2  
**Data:** 2026-01-27  
**Próxima ação:** Implementar sistema de turnos
