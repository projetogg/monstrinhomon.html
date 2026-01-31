# PR5A - Audit do Combate em Grupo/Boss

## Resumo Executivo

Este documento analisa o sistema de combate em grupo/boss para identificar quais funções devem ser extraídas para módulos em `/js/combat`.

**Escopo:** Somente combate em grupo e boss (startGroupEncounter, groupAttack, processEnemyTurnGroup, etc).  
**NÃO inclui:** Combate wild 1v1 (já modularizado no PR4), sistema de XP geral, CSS/UI geral.

**Comparação com PR4:**  
- PR4 modularizou wild 1v1 (attackWild → wildCore.js, wildActions.js, wildUI.js)
- PR5A prepara infraestrutura para grupo/boss SEM mover código (apenas stubs e audit)

---

## 1. Funções Principais do Combate em Grupo

### 1.1 Inicialização

#### `startGroupEncounter(selectedPlayerIds, encounterType, enemyLevel)` (linhas 3133-3204)

**Localização:** `index.html` linha 3133  
**Tamanho:** ~71 linhas  
**Responsabilidades:**
- Validar jogadores participantes
- Auto-selecionar starter para cada jogador
- Resetar buffs dos monstrinhos
- Criar instâncias de inimigos (factory pattern)
- Criar objeto encounter de grupo/boss
- Calcular ordem de turnos
- Atualizar GameState.currentEncounter
- Persistir e renderizar

**Classificação:** IMPURA (State mutation + UI + Storage)

**Dependências:**
- `GameState.players` (leitura e escrita)
- `MONSTER_CATALOG` (leitura)
- `createMonsterInstanceFromTemplate()` (factory)
- `autoSelectStarter()` (helper)
- `resetBattleBuffs()` (helper)
- `calculateGroupTurnOrder()` (helper)
- `initializeEncounterToast()` (helper)
- `getCurrentActor()` (helper)
- `saveToLocalStorage()` (storage)
- `renderEncounter()` (UI)

---

#### `calculateGroupTurnOrder(enc)` (linhas 3206-3270)

**Localização:** `index.html` linha 3206  
**Tamanho:** ~64 linhas  
**Responsabilidades:**
- Adicionar jogadores participantes à ordem de turnos
- Adicionar inimigos à ordem de turnos
- Ordenar por SPD descendente
- Resolver empates com d20 (tiebreak)
- Retornar array de atores ordenados

**Classificação:** SEMI-PURA (lógica determinística + d20 random)

**Dependências:**
- `GameState.players` (leitura)
- `rollD20()` (helper - random)
- Nenhuma modificação de state
- Retorna novo array (imutável)

**Nota:** Pode ser PURA se rollD20 for injetado como dependência.

---

### 1.2 Gerenciamento de Turnos

#### `getCurrentActor(enc)` (linhas 3272-3276)

**Localização:** `index.html` linha 3272  
**Tamanho:** 4 linhas  
**Responsabilidades:**
- Retornar ator atual baseado em turnIndex
- Validação de bounds

**Classificação:** PURA (leitura de dados)

---

#### `advanceTurn(enc)` (linhas 3295-3371)

**Localização:** `index.html` linha 3295  
**Tamanho:** ~76 linhas  
**Responsabilidades:**
- Verificar condições de vitória/derrota
- Finalizar encounter se aplicável
- Distribuir recompensas (idempotente)
- Avançar turnIndex para próximo ator válido (vivo)
- Atualizar currentActor
- Auto-trigger turno do inimigo
- Tocar sons de vitória/derrota

**Classificação:** IMPURA (State mutation + Audio + Rewards)

**Dependências:**
- `_hasAlivePlayers()` (helper)
- `_hasAliveEnemies()` (helper)
- `Audio.playSfx()` (audio)
- `handleVictoryRewards()` (rewards)
- `getCurrentActor()` (helper)
- `processEnemyTurnGroup()` (recursão/trigger)
- Modifica `enc` (finished, result, active, log, turnIndex, currentActor, _winSfxPlayed, _loseSfxPlayed)

---

#### `_hasAlivePlayers(enc)` (linhas 3278-3286)

**Localização:** `index.html` linha 3278  
**Tamanho:** 8 linhas  
**Responsabilidades:**
- Verificar se algum jogador participante tem monstrinho vivo

**Classificação:** PURA (leitura de dados)

**Dependências:**
- `GameState.players` (leitura)
- `firstAliveIndex()` (helper)

---

#### `_hasAliveEnemies(enc)` (linhas 3288-3293)

**Localização:** `index.html` linha 3288  
**Tamanho:** 5 linhas  
**Responsabilidades:**
- Verificar se algum inimigo tem HP > 0

**Classificação:** PURA (leitura de dados)

---

#### `groupPassTurn()` (linhas 3373-3389)

**Localização:** `index.html` linha 3373  
**Tamanho:** 16 linhas  
**Responsabilidades:**
- Jogador passa o turno sem ação
- Adicionar log
- Avançar turno
- Persistir e renderizar

**Classificação:** IMPURA (State mutation + UI + Storage)

**Dependências:**
- `GameState.currentEncounter` (leitura)
- `getCurrentActor()` (helper)
- `advanceTurn()` (helper)
- `saveToLocalStorage()` (storage)
- `renderEncounter()` (UI)

---

### 1.3 Ações de Combate - Jogador

#### `groupAttack()` (linhas 3589-3723)

**Localização:** `index.html` linha 3589  
**Tamanho:** ~134 linhas  
**Responsabilidades:**
- Validar turno do jogador
- Verificar classe do monstrinho (regra: só mesma classe do jogador)
- Aplicar ENE regen + atualizar buffs
- Escolher alvo (primeiro inimigo vivo)
- Rolar d20 (auto)
- Processar acerto/erro (checkHit)
- Calcular dano (calcDamage) com vantagem de classe
- Aplicar dano ao inimigo
- Registrar d20 roll
- Tocar sons (crit/hit/miss)
- Feedback visual (floatingText + flash)
- Avançar turno
- Persistir e renderizar

**Classificação:** IMPURA (State mutation + UI + Audio + Storage)

**Dependências:**
- `_getGroupEncounter()` (helper)
- `getCurrentActor()` (helper)
- `_getPlayerById()` (helper)
- `_getActiveMonsterOfPlayer()` (helper)
- `_isAlive()` (helper)
- `applyEneRegen()` (shared - wild)
- `updateBuffs()` (shared - wild)
- `_getEnemyByIndex()` (helper)
- `rollD20()` (shared - wild)
- `checkHit()` (CORE - wildCore.js)
- `recordD20Roll()` (shared - wild)
- `Audio.playSfx()` (audio)
- `MM_TABLES.getBasicAttackPower()` (tables)
- `getBuffModifiers()` (shared - wild)
- `GameState.config.classAdvantages` (config)
- `calcDamage()` (CORE - wildCore.js)
- `applyDamage()` (shared helper)
- `saveToLocalStorage()` (storage)
- `renderEncounter()` (UI)
- `showFloatingText()` (UI)
- `flashTarget()` (UI)
- `advanceTurn()` (helper)

**Nota:** Muita similaridade com attackWild do PR4. Pode reutilizar CORE functions.

---

#### `groupUseSkill(skillIndex)` (linhas 3951-3977)

**Localização:** `index.html` linha 3951  
**Tamanho:** 26 linhas  
**Responsabilidades:**
- Validar turno do jogador
- Escolher alvo (primeiro inimigo vivo)
- Placeholder: "Feature 3.3 será integrada"
- Avançar turno

**Classificação:** IMPURA (State mutation + UI + Storage)

**Nota:** STUB atual. Sistema de skills não implementado ainda.

---

#### `groupUseItem(itemId)` (linhas 3979-4045)

**Localização:** `index.html` linha 3979  
**Tamanho:** ~66 linhas  
**Responsabilidades:**
- Validar turno do jogador
- Verificar se item existe no inventário
- Aplicar cura (30% HP ou 30 HP, o que for maior)
- Consumir item do inventário
- Adicionar log
- Tocar som de cura
- Avançar turno
- Persistir e renderizar

**Classificação:** IMPURA (State mutation + UI + Audio + Storage)

**Dependências:**
- Similar a `groupAttack` mas sem combate

---

### 1.4 Ações de Combate - Inimigo

#### `processEnemyTurnGroup(enc)` (linhas 3727-3872)

**Localização:** `index.html` linha 3727  
**Tamanho:** ~145 linhas  
**Responsabilidades:**
- Validar turno do inimigo
- Aplicar ENE regen + atualizar buffs
- Escolher alvo jogador (menor HP%)
- Rolar d20 (auto)
- Processar acerto/erro (checkHit)
- Calcular dano (calcDamage) com vantagem de classe
- Aplicar dano ao jogador
- Verificar se jogador foi derrotado (HP <= 0)
- Se jogador tem outros monstrinhos vivos, abrir modal de troca
- Registrar d20 roll
- Tocar sons (crit/hit/miss)
- Feedback visual (floatingText + flash)
- Avançar turno
- Persistir e renderizar

**Classificação:** IMPURA (State mutation + UI + Audio + Storage)

**Dependências:**
- Similar a `groupAttack` mas perspectiva do inimigo
- `_chooseTargetPlayerId()` (helper - IA básica)
- `firstAliveIndex()` (helper - troca de monstrinho)

**Nota:** IA básica atual: sempre ataca jogador com menor HP%. Pode evoluir para considerar skills.

---

#### `_chooseTargetPlayerId(enc)` (linhas 3571-3585)

**Localização:** `index.html` linha 3571  
**Tamanho:** 14 linhas  
**Responsabilidades:**
- IA: escolher jogador alvo com menor HP%
- Retornar playerId ou null

**Classificação:** PURA (lógica de decisão)

**Dependências:**
- `_getPlayerById()` (helper)
- `_getActiveMonsterOfPlayer()` (helper)
- `_isAlive()` (helper)

---

### 1.5 Recompensas

#### `handleVictoryRewards(enc)` (linhas 5056-5109)

**Localização:** `index.html` linha 5056  
**Tamanho:** ~53 linhas  
**Responsabilidades:**
- Idempotência via `rewardsGranted` flag
- Rastrear vitória (stats)
- Calcular XP baseado em inimigo derrotado
- Distribuir XP (diferente para grupo vs 1v1)
- Rastrear XP total ganho (stats)

**Classificação:** IMPURA (State mutation)

**Dependências:**
- `updateStats()` (stats tracking)
- `calculateBattleXP()` (XP calculation)
- `giveXP()` (XP distribution)
- Modifica `enc.rewardsGranted`, `enc.rewards`

**Nota:** Função compartilhada entre wild 1v1 e grupo. Não será refatorada em PR5A.

---

#### `distributeGroupXP(enc)` (linhas 5019-5033)

**Localização:** `index.html` linha 5019  
**Tamanho:** 14 linhas  
**Responsabilidades:**
- Distribuir XP para todos participantes vivos de grupo

**Classificação:** IMPURA (State mutation)

**Nota:** Wrapper sobre `giveXP()`. Não será refatorada em PR5A.

---

### 1.6 Renderização

#### `renderGroupEncounter(panel, encounter)` (linhas 5111-5289)

**Localização:** `index.html` linha 5111  
**Tamanho:** ~178 linhas  
**Responsabilidades:**
- Renderizar UI completa do encontro de grupo
- Exibir participantes (jogadores) com HP/XP bars
- Exibir inimigos com HP/stats
- Exibir indicador de turno atual
- Exibir último d20 roll
- Exibir ações disponíveis (Atacar, Passar, Skills, Itens)
- Exibir resultado final (vitória/derrota) com recompensas
- Botão de encerrar encounter

**Classificação:** PURA UI (gera HTML string)

**Dependências:**
- `getCurrentActor()` (helper)
- `renderTutorialBanner()` (helper)
- `ensureXpFields()` (helper)
- `calcXpNeeded()` (helper)
- `getSkillsArray()` (skills)
- `getSkillById()` (skills)
- `formatSkillButtonLabel()` (skills)
- `canUseSkillNow()` (skills)

**Nota:** Função de renderização pura (sem side effects). Retorna HTML.

---

## 2. Funções Helper (Compartilhadas)

### 2.1 Funções PURAS (Compartilhadas com Wild)

Essas funções JÁ EXISTEM em `wildCore.js` e podem ser reutilizadas:

| Função | Localização Atual | Módulo PR4 | Reutilizável? |
|--------|-------------------|------------|---------------|
| **checkHit(d20, attacker, defender, classAdv)** | index.html (6338-6360) | wildCore.js | ✅ SIM |
| **calcDamage({atk, def, power, damageMult})** | index.html (6385-6402) | wildCore.js | ✅ SIM |
| **getBuffModifiers(monster)** | index.html (2895-2908) | wildCore.js | ✅ SIM |

**Estratégia:** Importar de `wildCore.js` no grupo/boss (via `import { checkHit, calcDamage, getBuffModifiers } from './wildCore.js'`).

---

### 2.2 Funções IMPURAS (Compartilhadas com Wild)

| Função | Localização | Reutilizável? | Destino |
|--------|-------------|---------------|---------|
| **applyEneRegen(monster, encounter)** | index.html (2766-2776) | ✅ SIM | wildActions.js (PR4) |
| **updateBuffs(monster)** | index.html (2881-2887) | ✅ SIM | wildActions.js (PR4) |
| **recordD20Roll(enc, name, roll, type)** | index.html | ✅ SIM | wildActions.js (PR4) |
| **applyDamage(target, dmg)** | index.html (3428-3442) | ✅ SIM | Criar em `sharedHelpers.js`? |
| **resetBattleBuffs(mon)** | index.html (3449-3453) | ✅ SIM | Criar em `sharedHelpers.js`? |
| **rollD20()** | index.html (3129) | ✅ SIM | Criar em `sharedHelpers.js`? |

**Estratégia:** 
- Criar `/js/combat/sharedHelpers.js` para funções usadas tanto por wild quanto por grupo
- OU importar de `wildActions.js` (se fizer sentido)

---

### 2.3 Funções Específicas de Grupo

| Função | Linhas | Classificação | Descrição |
|--------|--------|---------------|-----------|
| **_getGroupEncounter()** | 3393-3395 | PURA | Retorna GameState.currentEncounter |
| **_getPlayerById(playerId)** | 3397-3399 | PURA | Busca jogador por ID |
| **_getActiveMonsterOfPlayer(player)** | 3401-3411 | SEMI-PURA | Retorna monstrinho ativo do jogador |
| **_getEnemyByIndex(enc, idx)** | 3413-3415 | PURA | Retorna inimigo por índice |
| **_isAlive(entity)** | 3464-3466 | PURA | Verifica se HP > 0 |
| **_log(enc, msg)** | 3468-3471 | IMPURA | Adiciona mensagem ao log do encounter |
| **_clamp(n, min, max)** | 3417-3419 | PURA | Math.max(min, Math.min(max, n)) |
| **_calcDamage(power, atk, def)** | 3455-3462 | PURA | Fórmula antiga de dano (duplicada?) |

**Nota:** `_calcDamage` parece duplicado de `calcDamage` do wildCore.js. Verificar se pode ser removido.

---

## 3. Dependências de GameState

### Leitura

```javascript
GameState.currentEncounter          // Dados do encontro ativo
GameState.players                   // Lista de jogadores (busca, validação)
GameState.config.classAdvantages    // Tabela de vantagens de classe
```

### Modificação

```javascript
// Via startGroupEncounter():
GameState.currentEncounter          // Cria novo encounter

// Via groupAttack() / processEnemyTurnGroup():
encounter.log[]                     // Adiciona mensagens
encounter.turnIndex                 // Avança turnos
encounter.currentActor              // Atualiza ator atual
encounter.enemies[].hp              // Aplica dano
encounter.enemies[].ene             // Consome ENE de skills
playerMonster.hp                    // Aplica dano recebido
playerMonster.ene                   // applyEneRegen
playerMonster.buffs                 // updateBuffs
player.inventory                    // Consome itens (groupUseItem)

// Via advanceTurn():
encounter.finished                  // Finaliza encounter
encounter.result                    // 'victory' ou 'defeat'
encounter.active                    // false ao terminar
encounter._winSfxPlayed             // Idempotência de som
encounter._loseSfxPlayed            // Idempotência de som

// Via handleVictoryRewards():
encounter.rewardsGranted            // Idempotência de XP
encounter.rewards.xp                // XP calculado
playerMonster.xp                    // Distribui XP
playerMonster.level                 // Level up
GameState.stats                     // battlesWon, totalXpGained
```

---

## 4. Dependências de UI/DOM

### Leitura (Input)

Nenhuma leitura direta de DOM em funções de grupo (diferente do wild que lê `diceRoll` input).

**Motivo:** Grupo usa `rollD20()` automático (sem input do jogador).

---

### Modificação (Output)

```javascript
renderEncounter()                                       // 10+ chamadas por turno
flashTarget('grpP_${playerId}' | 'grpE_${enemyIndex}', tipo)  // Animações de hit/miss
showFloatingText(target, texto, tipo)                  // Dano flutuante
```

**Timing:** Delays de 50ms (`setTimeout(..., 50)`) para sincronizar animações.

---

## 5. Dependências de Audio

```javascript
Audio.playSfx("crit")   // d20=20 (jogador ou inimigo)
Audio.playSfx("hit")    // Acerto normal
Audio.playSfx("miss")   // Erro
Audio.playSfx("heal")   // groupUseItem
Audio.playSfx("win")    // Vitória (com idempotência via encounter._winSfxPlayed)
Audio.playSfx("lose")   // Derrota (com idempotência via encounter._loseSfxPlayed)
```

---

## 6. Dependências de Persistência

```javascript
saveToLocalStorage()    // Chamado 3-5 vezes durante um único turno de grupo
```

**Problema identificado:** Múltiplas gravações no localStorage por turno pode causar performance issues (similar ao wild).

**Solução sugerida (PR futuro):** Consolidar em 1 save no final do turno.

---

## 7. Classificação por Categoria

### CORE (Lógica de Negócio - Pure)

Funções 100% puras, testáveis isoladamente:

```
✅ getCurrentActor(enc)
✅ _hasAlivePlayers(enc)                 # Se GameState.players for passado por param
✅ _hasAliveEnemies(enc)
✅ _isAlive(entity)
✅ _clamp(n, min, max)
✅ _chooseTargetPlayerId(enc)            # Se helpers forem passados por param
```

**Reutilizar de wildCore.js:**
```
✅ checkHit(d20Roll, attacker, defender, classAdvantages)
✅ calcDamage({atk, def, power, damageMult})
✅ getBuffModifiers(monster)
```

**Destino:** `js/combat/groupCore.js` (funções novas) + reutilizar `wildCore.js`

---

### ACTIONS (Execução de Ações - Impure)

Funções que modificam state mas não mexem em DOM:

```
⚙️ startGroupEncounter(selectedPlayerIds, encounterType, enemyLevel)
⚙️ calculateGroupTurnOrder(enc)          # SEMI-PURA (usa rollD20)
⚙️ advanceTurn(enc)
⚙️ groupPassTurn()
⚙️ processPlayerAttackGroup(...)         # NOVA - extrai lógica de groupAttack
⚙️ processEnemyTurnGroupLogic(...)       # NOVA - extrai lógica de processEnemyTurnGroup
⚙️ groupUseItemLogic(...)                # NOVA - extrai lógica de groupUseItem
⚙️ groupUseSkillLogic(...)               # NOVA - placeholder
```

**Reutilizar de wildActions.js (PR4):**
```
⚙️ applyEneRegen(monster, encounter)
⚙️ updateBuffs(monster)
⚙️ recordD20Roll(encounter, name, roll, type)
```

**Destino:** `js/combat/groupActions.js`

---

### UI (Renderização e Feedback)

Funções que manipulam DOM/Audio:

```
🎨 renderGroupEncounter(panel, encounter)
🎨 flashTarget(target, type)                # Já existe (reutilizar)
🎨 showFloatingText(target, text, kind)     # Já existe (reutilizar)
🔊 Audio.playSfx(sfx)                       # Já existe (reutilizar)
```

**Destino:** `js/combat/groupUI.js`

---

### REWARDS (Pós-Combate)

Funções de recompensa/XP (NÃO são escopo do PR5A):

```
🏆 handleVictoryRewards(encounter)          # Compartilhado wild + grupo
🏆 distributeGroupXP(enc)                   # Específico de grupo
🏆 calculateBattleXP(defeated, type)        # Compartilhado
🏆 giveXP(mon, xp, log)                     # Compartilhado
🏆 updateStats(stat, delta)                 # Compartilhado
```

**Decisão:** Manter como estão (não refatorar no PR5A).  
**Motivo:** Sistema de XP/rewards é compartilhado. Refatorar em PR separado (PR6?).

---

## 8. Boss vs Group: Diferenças

### Pergunta: Boss precisa de módulo separado (`bossActions.js`)?

**Análise:**

| Aspecto | Group | Boss |
|---------|-------|------|
| **Encounter Type** | 'group_trainer' | 'boss' |
| **Número de Inimigos** | 1 (atual), pode expandir | 1 (geralmente) |
| **Lógica de Ataque** | Mesma | Mesma |
| **IA** | _chooseTargetPlayerId (menor HP%) | Mesma (pode evoluir) |
| **Recompensas** | XP padrão | XP pode ter multiplicador (futuro) |
| **UI** | renderGroupEncounter | Mesma (pode ter tema diferente) |

**Conclusão:** Boss é **variação simples** de grupo.

**Decisão:** **NÃO** criar `bossActions.js` separado no PR5A.  
- Boss reutiliza mesmas funções de grupo.
- Diferenças são apenas em `encounterType` e futuramente em multiplicadores de XP/recompensas.
- Se boss evoluir muito (ex.: múltiplas fases, mecânicas especiais), criar módulo em PR futuro.

---

## 9. Estratégia de Extração (PR5A - STUBS APENAS)

### Passo 1: Criar Estrutura de Módulos (Stubs)

```
js/
  combat/
    wildCore.js         # JÁ EXISTE (PR4)
    wildActions.js      # JÁ EXISTE (PR4)
    wildUI.js           # JÁ EXISTE (PR4)
    groupCore.js        # NOVO - stubs
    groupActions.js     # NOVO - stubs
    groupUI.js          # NOVO - stubs
    index.js            # ATUALIZAR - exports
```

**PR5A NÃO MOVE LÓGICA.** Apenas cria arquivos vazios/stub.

---

### Passo 2: groupCore.js (STUB)

```javascript
// js/combat/groupCore.js

/**
 * GROUP COMBAT CORE - Funções Puras
 * 
 * STUB para PR5A - não contém lógica real ainda
 * Implementação real será feita em PR posterior
 */

// Reutiliza funções de wildCore.js
export { checkHit, calcDamage, getBuffModifiers } from './wildCore.js';

/**
 * STUB: Retorna ator atual do encounter
 */
export function getCurrentActor(enc) {
    // Implementação real: index.html linha 3272
    throw new Error('getCurrentActor - STUB not implemented yet');
}

/**
 * STUB: Verifica se há jogadores vivos
 */
export function hasAlivePlayers(enc, players) {
    // Implementação real: index.html linha 3278
    throw new Error('hasAlivePlayers - STUB not implemented yet');
}

/**
 * STUB: Verifica se há inimigos vivos
 */
export function hasAliveEnemies(enc) {
    // Implementação real: index.html linha 3288
    throw new Error('hasAliveEnemies - STUB not implemented yet');
}

/**
 * STUB: IA - escolhe jogador alvo com menor HP%
 */
export function chooseTargetPlayerId(enc, players, helpers) {
    // Implementação real: index.html linha 3571
    throw new Error('chooseTargetPlayerId - STUB not implemented yet');
}

/**
 * STUB: Calcula ordem de turnos
 */
export function calculateTurnOrder(enc, players, rollD20Fn) {
    // Implementação real: index.html linha 3206
    throw new Error('calculateTurnOrder - STUB not implemented yet');
}
```

---

### Passo 3: groupActions.js (STUB)

```javascript
// js/combat/groupActions.js

/**
 * GROUP COMBAT ACTIONS - Ações de Combate
 * 
 * STUB para PR5A - não contém lógica real ainda
 * Implementação real será feita em PR posterior
 */

// Reutiliza funções de wildActions.js
export { applyEneRegen, updateBuffs, recordD20Roll } from './wildActions.js';

/**
 * STUB: Inicializa encounter de grupo
 */
export function initializeGroupEncounter(options) {
    // Implementação real: index.html linha 3133
    throw new Error('initializeGroupEncounter - STUB not implemented yet');
}

/**
 * STUB: Executa ataque do jogador em grupo
 */
export function executePlayerAttackGroup(options) {
    // Implementação real: index.html linha 3589 (groupAttack)
    throw new Error('executePlayerAttackGroup - STUB not implemented yet');
}

/**
 * STUB: Processa turno do inimigo em grupo
 */
export function executeEnemyTurnGroup(options) {
    // Implementação real: index.html linha 3727 (processEnemyTurnGroup)
    throw new Error('executeEnemyTurnGroup - STUB not implemented yet');
}

/**
 * STUB: Executa uso de item em grupo
 */
export function executeGroupUseItem(options) {
    // Implementação real: index.html linha 3979 (groupUseItem)
    throw new Error('executeGroupUseItem - STUB not implemented yet');
}

/**
 * STUB: Avança para próximo turno
 */
export function advanceGroupTurn(enc, dependencies) {
    // Implementação real: index.html linha 3295 (advanceTurn)
    throw new Error('advanceGroupTurn - STUB not implemented yet');
}

/**
 * STUB: Passa turno sem ação
 */
export function passTurn(dependencies) {
    // Implementação real: index.html linha 3373 (groupPassTurn)
    throw new Error('passTurn - STUB not implemented yet');
}
```

---

### Passo 4: groupUI.js (STUB)

```javascript
// js/combat/groupUI.js

/**
 * GROUP COMBAT UI - Renderização e Feedback
 * 
 * STUB para PR5A - não contém lógica real ainda
 * Implementação real será feita em PR posterior
 */

/**
 * STUB: Renderiza UI do encounter de grupo
 */
export function renderGroupEncounterPanel(panel, encounter, helpers) {
    // Implementação real: index.html linha 5111
    throw new Error('renderGroupEncounterPanel - STUB not implemented yet');
}

/**
 * STUB: Feedback visual de dano em grupo
 */
export function showGroupDamageFeedback(target, damage, isCrit, helpers) {
    // Reutiliza showFloatingText + flashTarget
    throw new Error('showGroupDamageFeedback - STUB not implemented yet');
}

/**
 * STUB: Feedback visual de erro em grupo
 */
export function showGroupMissFeedback(target, helpers) {
    // Reutiliza flashTarget
    throw new Error('showGroupMissFeedback - STUB not implemented yet');
}
```

---

### Passo 5: index.js (Atualizar Exports)

```javascript
// js/combat/index.js

import * as WildCore from './wildCore.js';
import * as WildActions from './wildActions.js';
import * as WildUI from './wildUI.js';
import * as GroupCore from './groupCore.js';
import * as GroupActions from './groupActions.js';
import * as GroupUI from './groupUI.js';

export const Combat = {
    Wild: {
        Core: WildCore,
        Actions: WildActions,
        UI: WildUI
    },
    Group: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI
    },
    // Boss reutiliza Group (não precisa de módulo separado)
    Boss: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI
    }
};

export default Combat;
```

---

### Passo 6: index.html (Wrappers de Compatibilidade)

```javascript
// index.html (dentro de <script>)

// ===== WRAPPER 1: groupAttack =====
// Mantém API pública, mas AINDA CHAMA código antigo
// PR5A NÃO MOVE LÓGICA - apenas prepara infraestrutura

function groupAttack() {
    // STUB: Futuramente chamar Combat.Group.Actions.executePlayerAttackGroup()
    // Por enquanto, mantém implementação atual inline
    
    try {
        const enc = _getGroupEncounter();
        if (!enc || enc.finished) return;

        const actor = getCurrentActor(enc);
        if (!actor || actor.side !== 'player') return;
        
        // ... RESTO DO CÓDIGO ATUAL (linhas 3589-3723) ...
        
    } catch (error) {
        showError('Failed to attack', error.stack);
    }
}

// ===== WRAPPER 2: processEnemyTurnGroup =====
// Mantém API pública, mas AINDA CHAMA código antigo

function processEnemyTurnGroup(enc) {
    // STUB: Futuramente chamar Combat.Group.Actions.executeEnemyTurnGroup()
    // Por enquanto, mantém implementação atual inline
    
    try {
        if (!enc || enc.finished) return;

        const actor = getCurrentActor(enc);
        if (!actor || actor.side !== 'enemy') return;
        
        // ... RESTO DO CÓDIGO ATUAL (linhas 3727-3872) ...
        
    } catch (error) {
        showError('Failed to process enemy turn', error.stack);
    }
}

// ===== WRAPPER 3: startGroupEncounter =====
// Mantém API pública, mas AINDA CHAMA código antigo

function startGroupEncounter(selectedPlayerIds, encounterType, enemyLevel) {
    // STUB: Futuramente chamar Combat.Group.Actions.initializeGroupEncounter()
    // Por enquanto, mantém implementação atual inline
    
    try {
        // ... CÓDIGO ATUAL (linhas 3133-3204) ...
    } catch (error) {
        showError('Failed to start group encounter', error.stack);
    }
}

// Outras funções (groupPassTurn, groupUseItem, etc.) mantêm implementação atual
```

**Nota:** Wrappers NÃO mudam comportamento. Apenas documentam onde estará a lógica futura.

---

## 10. Benefícios da Refatoração (PR Futuro, NÃO PR5A)

**PR5A apenas prepara a estrutura. Benefícios virão em PRs posteriores.**

### ✅ Testabilidade (Futuro)
- `groupCore.js` pode ter 100% de cobertura via Vitest
- Testes unitários para getCurrentActor, hasAlivePlayers, etc.

### ✅ Manutenibilidade (Futuro)
- Lógica de combate separada de UI
- Easier to add new features (boss phases, multi-target skills, etc.)

### ✅ Reutilização (Futuro)
- `groupCore.js` pode ser reutilizado em PvP (Feature 3.4)?
- `wildCore.js` já é reutilizado em grupo

### ✅ Performance (Futuro)
- Reduzir saves no localStorage (de 3-5 para 1 por turno)
- Batch DOM updates

### ✅ Debugging (Futuro)
- Logs estruturados via return values
- Easier to trace bugs

---

## 11. Riscos e Mitigações

### Risco 1: Quebrar comportamento existente
**Mitigação:** PR5A NÃO MOVE LÓGICA. Apenas cria stubs.  
**Validação:** Smoke test: batalha em grupo deve funcionar exatamente igual.

### Risco 2: Stubs não usados causarem warnings
**Mitigação:** Stubs não são importados no index.html ainda.  
**Validação:** Console deve estar limpo.

### Risco 3: Imports causarem erros no navegador
**Mitigação:** Testar se `type="module"` funciona corretamente (já funciona desde PR4).  
**Validação:** Abrir jogo no navegador e verificar console.

---

## 12. Fora de Escopo (PR5A)

Estas funcionalidades **NÃO** serão refatoradas no PR5A:

- ❌ Mover lógica de combate para módulos (será em PR posterior)
- ❌ Implementar boss mechanics especiais
- ❌ Sistema de XP/Level up (compartilhado, refatorar separadamente)
- ❌ Sistema de captura
- ❌ Sistema de recompensas
- ❌ Sistema de skills (groupUseSkill é stub)
- ❌ Storage/persistência geral
- ❌ CSS ou layout

**Motivo:** PR5A foca APENAS em audit + scaffolding. Refatoração real será em PR5B (ou PR6).

---

## 13. Próximos Passos (Ordem de Implementação)

### PR5A (Este PR)
1. ✅ **AUDIT** (este documento)
2. ⏳ Criar `js/combat/groupCore.js` com stubs
3. ⏳ Criar `js/combat/groupActions.js` com stubs
4. ⏳ Criar `js/combat/groupUI.js` com stubs
5. ⏳ Atualizar `js/combat/index.js` com exports
6. ⏳ Adicionar comentários no `index.html` indicando wrappers futuros
7. ⏳ Smoke test manual (checklist completo)
8. ⏳ Validar console (sem erros)
9. ⏳ Criar `PR5A_SUMMARY.md`

### PR5B (Futuro - NÃO é escopo de PR5A)
1. Mover lógica de `groupAttack` para `groupActions.js`
2. Mover lógica de `processEnemyTurnGroup` para `groupActions.js`
3. Mover lógica de renderização para `groupUI.js`
4. Atualizar wrappers para chamar módulos
5. Validar comportamento idêntico
6. Remover código duplicado

---

## 14. Checklist de Validação (PR5A)

Antes de marcar PR5A como completo:

**Estrutura:**
- [ ] `js/combat/groupCore.js` existe com stubs
- [ ] `js/combat/groupActions.js` existe com stubs
- [ ] `js/combat/groupUI.js` existe com stubs
- [ ] `js/combat/index.js` exporta Combat.Group.* e Combat.Boss.*
- [ ] Nenhum `bossActions.js` criado (boss reutiliza group)

**Comportamento:**
- [ ] Jogo abre sem erros de console
- [ ] Criar sessão funciona
- [ ] Criar jogador funciona
- [ ] Iniciar encontro de grupo funciona (botão "Batalha em Grupo")
- [ ] Turno de jogador funciona (Atacar, Passar)
- [ ] Turno de inimigo funciona (auto-trigger)
- [ ] Dano calculado corretamente (vantagem de classe)
- [ ] HP reduz corretamente
- [ ] Vitória: XP distribuído, encontro finalizado
- [ ] Derrota: marcada corretamente
- [ ] Animações visuais funcionam (flash, floating text)
- [ ] Sons tocam corretamente (hit/miss/crit/win/lose)
- [ ] LocalStorage persiste estado
- [ ] Reload recupera estado corretamente
- [ ] Console sem warnings
- [ ] Console sem erros

**Documentação:**
- [ ] `PR5A_COMBAT_GROUP_AUDIT.md` completo
- [ ] `PR5A_SUMMARY.md` criado

---

## 15. Métricas de Sucesso (PR5A)

| Métrica | Antes PR5A | Depois PR5A | Meta |
|---------|------------|-------------|------|
| Módulos de grupo | 0 | 3 (stubs) | Estrutura criada |
| Linhas de código movidas | 0 | 0 | Zero (apenas stubs) |
| Comportamento mudado | 0 | 0 | Zero mudanças |
| Console errors | 0 | 0 | Nenhum erro novo |
| Arquitetura preparada | Não | Sim | 100% pronto para PR5B |

**Objetivo:** PR5A prepara infraestrutura SEM RISCO. Próximo PR (PR5B) move lógica incrementalmente.

---

**Documento gerado em:** 2026-01-31  
**Versão:** 1.0  
**Status:** ✅ COMPLETO
