# PR4 - Audit do Combate Wild 1v1

## Resumo Executivo

Este documento analisa o sistema de combate wild 1v1 (attackWild) para identificar quais funções devem ser extraídas para módulos em `/js/combat`.

**Escopo:** Somente combate wild 1v1 (attackWild + helpers diretos).  
**NÃO inclui:** Batalhas em grupo, sistema de XP geral, CSS/UI geral.

---

## 1. Função Principal

### `attackWild()` (linhas 5921-6195)

**Localização:** `index.html` linha 5921  
**Tamanho:** ~274 linhas  
**Responsabilidades:**
- Validar jogador e monstrinho
- Processar entrada do dado (d20)
- Executar ataque do jogador
- Processar contra-ataque do inimigo
- Gerenciar estados (HP, ENE, buffs)
- Atualizar UI e persistir estado

**Fluxo:**
1. Validação (encontro, jogador, monstrinho, classe)
2. Captura do d20 roll do input
3. ENE regen + atualização de buffs
4. Processamento de crítico (d20=20) ou falha crítica (d20=1)
5. **FASE 1:** Ataque do jogador
   - Verificar acerto (checkHit)
   - Calcular dano (calcDamage)
   - Aplicar dano ao inimigo
   - Verificar vitória
6. **FASE 2:** Contra-ataque do inimigo (se vivo)
   - IA decide: habilidade (50% chance se tiver ENE) ou ataque básico
   - Verificar acerto
   - Calcular dano
   - Aplicar dano ao jogador
   - Verificar derrota

---

## 2. Funções Helper Diretas

### 2.1 Funções PURAS (Zero Side Effects)

Essas funções podem ser extraídas para `wildCore.js` sem modificações:

| Função | Linhas | Parâmetros | Retorno | Descrição |
|--------|--------|------------|---------|-----------|
| **checkHit** | 6338-6360 | (d20Roll, attacker, defender) | boolean | Verifica se ataque acerta |
| **calcDamage** | 6385-6402 | ({atk, def, power, damageMult}) | number | Calcula dano com nova fórmula |
| **getBuffModifiers** | 2890-2908 | (monster) | {atk, def, spd} | Retorna modificadores de buffs ativos |
| **calculateDamage** | 6419-6450 | (attacker, defender) | number | Wrapper que calcula dano básico |

**Características comuns:**
- ✅ Sem acesso ao DOM
- ✅ Sem modificação de GameState
- ✅ Sem side effects (audio, localStorage, logs)
- ✅ Determinísticas (mesmos inputs = mesma saída)
- ✅ Testáveis isoladamente

**Dependências externas (leitura apenas):**
- `GameState.config.classAdvantages` (checkHit, calcDamage, calculateDamage)
- `MM_TABLES.getBasicAttackPower()` (calculateDamage)

---

### 2.2 Funções IMPURAS (Com Side Effects)

Essas funções modificam estado ou produzem efeitos colaterais:

| Função | Linhas | Side Effects | Tipo |
|--------|--------|--------------|------|
| **applyEneRegen** | 2761-2776 | Modifica `monster.ene`, adiciona log | State mutation |
| **updateBuffs** | 2876-2887 | Remove buffs expirados de `monster.buffs` | State mutation |
| **recordD20Roll** | ? | Adiciona a `encounter.rollHistory` | State mutation |
| **updateFriendship** | ? | Modifica `monster.friendship`, chama save | State mutation + I/O |
| **updateMultipleFriendshipEvents** | ? | Modifica friendship para múltiplos eventos | State mutation + I/O |
| **updateStats** | ? | Incrementa `GameState.stats` | State mutation |
| **handleVictoryRewards** | ? | Distribui XP/itens/dinheiro ao player | State mutation + cálculos |
| **tutorialOnAction** | ? | Atualiza progresso do tutorial | State mutation |
| **saveToLocalStorage** | ? | Persiste GameState no navegador | I/O (localStorage) |
| **renderEncounter** | ? | Atualiza DOM (#encounterPanel) | DOM manipulation |
| **flashTarget** | ? | Aplica animação CSS | DOM manipulation |
| **showFloatingText** | ? | Exibe texto flutuante (dano/crit) | DOM manipulation |
| **Audio.playSfx** | ? | Toca efeitos sonoros | Audio I/O |

---

## 3. Dependências de GameState

### Leitura

```javascript
GameState.currentEncounter          // Dados do encontro ativo
GameState.players                   // Lista de jogadores
GameState.config.classAdvantages    // Tabela de vantagens de classe
```

### Modificação

```javascript
// Via attackWild() diretamente:
encounter.log[]                     // Adiciona mensagens de combate
encounter.wildMonster.hp            // Aplica dano ao inimigo
encounter.wildMonster.ene           // Consome ENE de habilidades
encounter.active                    // Finaliza encontro
GameState.currentEncounter          // Limpa encontro ao terminar

// Via helpers:
player.inventory                    // handleVictoryRewards, crit d20=20
player.money                        // handleVictoryRewards, crit d20=20
player.xp                           // handleVictoryRewards
playerMonster.hp                    // Aplica dano recebido
playerMonster.ene                   // applyEneRegen
playerMonster.buffs                 // updateBuffs
playerMonster.friendship            // updateFriendship
playerMonster.status                // "fainted" ao morrer
GameState.stats                     // updateStats (battlesWon/Lost)
```

---

## 4. Dependências de UI/DOM

### Leitura (Input)

```javascript
document.getElementById('diceRoll').value    // Captura roll do jogador
```

### Modificação (Output)

```javascript
document.getElementById('diceRoll').value = ''          // Limpa input após uso
renderEncounter()                                       // 8+ chamadas por ataque
flashTarget('wildPlayerBox' | 'wildEnemyBox', tipo)    // Animações de hit/miss
showFloatingText(target, texto, tipo)                  // Dano flutuante
```

**Timing:** Delays de 50ms (`setTimeout(..., 50)`) para sincronizar animações.

---

## 5. Dependências de Audio

```javascript
Audio.playSfx("crit")   // d20=20
Audio.playSfx("hit")    // Acerto normal
Audio.playSfx("miss")   // Erro
Audio.playSfx("win")    // Vitória (com idempotência via encounter._winSfxPlayed)
```

---

## 6. Dependências de Persistência

```javascript
saveToLocalStorage()    // Chamado 8+ vezes durante um único attackWild()
```

**Problema identificado:** Múltiplas gravações no localStorage por turno pode causar performance issues.

**Solução sugerida:** Consolidar em 1 save no final do turno.

---

## 7. Classificação por Categoria

### CORE (Lógica de Negócio - Pure)
Funções 100% puras, testáveis isoladamente:

```
✅ checkHit(d20Roll, attacker, defender)
✅ calcDamage({atk, def, power, damageMult})
✅ getBuffModifiers(monster)
✅ calculateDamage(attacker, defender)
```

**Destino:** `js/combat/wildCore.js`

---

### ACTIONS (Execução de Ações - Impure)
Funções que modificam state mas não mexem em DOM:

```
⚙️ applyEneRegen(monster, encounter)
⚙️ updateBuffs(monster)
⚙️ recordD20Roll(encounter, name, roll, type)
⚙️ processPlayerAttack(encounter, player, monster, d20Roll)  // NOVA - extrai lógica
⚙️ processEnemyCounterattack(encounter, wildMonster, playerMonster)  // NOVA - extrai lógica
⚙️ processCritical(encounter, player, roll)  // NOVA - d20=20 logic
```

**Destino:** `js/combat/wildActions.js`

---

### UI (Renderização e Feedback)
Funções que manipulam DOM/Audio:

```
🎨 renderEncounter()
🎨 flashTarget(target, type)
🎨 showFloatingText(target, text, kind)
🎨 clearDiceInput()  // NOVA - extrai DOM manipulation
🎨 getCombatInputRoll()  // NOVA - lê diceRoll input
🔊 Audio.playSfx(sfx)
```

**Destino:** `js/combat/wildUI.js`

---

### REWARDS (Pós-Combate)
Funções de recompensa/XP (não são escopo do PR4):

```
🏆 handleVictoryRewards(encounter)
🏆 updateFriendship(monster, event)
🏆 updateMultipleFriendshipEvents(monster, events)
🏆 updateStats(stat, delta)
🏆 tutorialOnAction(action)
```

**Decisão:** Manter como estão (não refatorar no PR4).  
**Motivo:** São chamadas de fora do combate também, refatorar em PR separado.

---

## 8. Estratégia de Extração

### Passo 1: Criar Estrutura de Módulos

```
js/
  combat/
    wildCore.js        # Funções puras
    wildActions.js     # Ações de combate (state mutations)
    wildUI.js          # Renderização e feedback visual
    index.js           # API pública
```

---

### Passo 2: wildCore.js (100% Pure)

```javascript
// js/combat/wildCore.js

/**
 * FUNÇÕES PURAS DO COMBATE WILD 1v1
 * Todas as funções aqui são 100% determinísticas e testáveis
 * ZERO side effects (sem DOM, sem state mutation, sem I/O)
 */

export function checkHit(d20Roll, attacker, defender, classAdvantages) {
    // Dependency injection: recebe classAdvantages por parâmetro
    // Não acessa GameState internamente
}

export function calcDamage({ atk, def, power, damageMult = 1.0 }) {
    // Já é pura, apenas copiar
}

export function getBuffModifiers(monster) {
    // Já é pura, apenas copiar
}

export function calculateDamage(attacker, defender, basicPowerTable, classAdvantages) {
    // Dependency injection: recebe MM_TABLES.getBasicAttackPower e classAdvantages
}

export function getClassAdvantageModifiers(attackerClass, defenderClass, classAdvantages) {
    // NOVA - extrai lógica repetida de vantagem de classe
    // Retorna: { atkBonus: number, damageMult: number }
}

export function applyDamageToHP(currentHP, damage) {
    // NOVA - pura, apenas Math.max(0, hp - damage)
}
```

**Características:**
- Todas recebem dados por parâmetro (dependency injection)
- Não acessam GameState/MM_TABLES diretamente
- Não modificam objetos (imutáveis)
- Testáveis via Vitest/Jest

---

### Passo 3: wildActions.js (State Mutations)

```javascript
// js/combat/wildActions.js
import * as WildCore from './wildCore.js';

/**
 * AÇÕES DE COMBATE
 * Funções que modificam state, mas não mexem em DOM
 * Recebem dependências por parâmetro
 */

export function executeWildAttack({ encounter, player, playerMonster, d20Roll, dependencies }) {
    // dependencies = { state, audio, storage, ui, rewards }
    
    // Validações
    if (!encounter?.wildMonster) return { success: false, reason: 'no_encounter' };
    
    // ENE regen
    applyEneRegen(playerMonster, encounter);
    
    // Buffs
    updateBuffs(playerMonster);
    
    // Processar crítico/falha
    const critResult = processCritical(d20Roll, player, encounter);
    
    // FASE 1: Ataque do jogador
    const playerPhase = processPlayerAttack({
        d20Roll,
        playerMonster,
        wildMonster: encounter.wildMonster,
        encounter,
        critResult,
        classAdvantages: dependencies.state.config.classAdvantages,
        basicPowerTable: dependencies.basicPowerTable
    });
    
    // Vitória?
    if (encounter.wildMonster.hp <= 0) {
        return handleVictory(encounter, player, playerMonster, dependencies);
    }
    
    // FASE 2: Contra-ataque do inimigo
    if (encounter.wildMonster.hp > 0) {
        const enemyPhase = processEnemyCounterattack({
            wildMonster: encounter.wildMonster,
            playerMonster,
            encounter,
            dependencies
        });
        
        // Derrota?
        if (playerMonster.hp <= 0) {
            return handleDefeat(encounter, player, playerMonster, dependencies);
        }
    }
    
    return { success: true, encounter };
}

function processCritical(d20Roll, player, encounter) {
    // Extrai lógica de d20=20 (linhas 5970-5991)
    // Retorna: { isCrit20, isFail1, critBonus, logEntries }
}

function processPlayerAttack({ d20Roll, playerMonster, wildMonster, encounter, critResult, classAdvantages, basicPowerTable }) {
    // Extrai lógica de ataque do jogador (linhas 5993-6076)
    // Retorna: { hit, damage, logEntries }
}

function processEnemyCounterattack({ wildMonster, playerMonster, encounter, dependencies }) {
    // Extrai lógica de contra-ataque (linhas 6091-6187)
    // Decide: skill ou basic attack
    // Retorna: { hit, damage, logEntries }
}

function handleVictory(encounter, player, playerMonster, dependencies) {
    // Chama dependencies.rewards.handleVictoryRewards()
    // Chama dependencies.audio.playSfx("win")
    // Retorna: { success: true, result: 'victory' }
}

function handleDefeat(encounter, player, playerMonster, dependencies) {
    // Marca playerMonster.status = 'fainted'
    // Chama dependencies.rewards.updateStats('battlesLost')
    // Retorna: { success: true, result: 'defeat' }
}
```

**Characteristics:**
- Recebe dependências explícitas (não acessa globais)
- Pode modificar state (monster.hp, encounter.log, etc.)
- NÃO chama DOM/renderEncounter diretamente
- Retorna objetos com resultado + logs para UI processar

---

### Passo 4: wildUI.js (Visual Feedback)

```javascript
// js/combat/wildUI.js

/**
 * UI E FEEDBACK VISUAL DO COMBATE WILD
 * Funções que manipulam DOM, animações e áudio
 */

export function getCombatInputRoll() {
    const diceInput = document.getElementById('diceRoll');
    const roll = parseInt(diceInput?.value || '0');
    return roll >= 1 && roll <= 20 ? roll : null;
}

export function clearCombatInput() {
    const diceInput = document.getElementById('diceRoll');
    if (diceInput) diceInput.value = '';
}

export function playAttackFeedback(d20Roll, hit, isCrit, audio) {
    if (isCrit) {
        audio.playSfx("crit");
    } else if (!hit) {
        audio.playSfx("miss");
    } else {
        audio.playSfx("hit");
    }
}

export function showDamageFeedback(target, damage, isCrit) {
    // target: 'wildPlayerBox' | 'wildEnemyBox'
    setTimeout(() => {
        showFloatingText(target, `-${damage}`, isCrit ? 'crit' : 'damage');
        flashTarget(target, isCrit ? 'crit' : 'hit');
    }, 50);
}

export function showMissFeedback(target) {
    setTimeout(() => flashTarget(target, 'fail'), 50);
}

export function showVictoryUI(encounter, audio) {
    if (!encounter._winSfxPlayed) {
        audio.playSfx("win");
        encounter._winSfxPlayed = true;
    }
}
```

---

### Passo 5: index.js (API Pública)

```javascript
// js/combat/index.js

import * as WildCore from './wildCore.js';
import * as WildActions from './wildActions.js';
import * as WildUI from './wildUI.js';

export const Combat = {
    Core: WildCore,
    Actions: WildActions,
    UI: WildUI
};

export default Combat;
```

---

### Passo 6: index.html (Compatibilidade Wrapper)

```javascript
// index.html (dentro de <script>)

// Importar módulos
import Combat from './js/combat/index.js';

// Wrapper de compatibilidade - mantém API pública
function attackWild() {
    try {
        // 1. Capturar input do usuário
        const d20Roll = Combat.UI.getCombatInputRoll();
        if (!d20Roll) {
            alert('Please enter a valid roll between 1 and 20');
            return;
        }
        Combat.UI.clearCombatInput();
        
        // 2. Preparar dependências
        const encounter = GameState.currentEncounter;
        const player = GameState.players.find(p => p.id === encounter.selectedPlayerId);
        const playerMonster = player.team?.[0];
        
        // Validações (mesmas do original)
        if (!encounter?.wildMonster) return;
        if (!player) {
            alert('No player selected for this encounter');
            return;
        }
        if (!playerMonster) {
            alert('Player has no monsters in team');
            return;
        }
        if (playerMonster.class !== player.class) {
            alert(`⚠️ Você só pode usar monstrinhos da classe ${player.class} em batalha!`);
            return;
        }
        
        // 3. Executar combate
        const dependencies = {
            state: GameState,
            audio: Audio,
            storage: { save: saveToLocalStorage },
            ui: { render: renderEncounter },
            rewards: {
                handleVictoryRewards,
                updateFriendship,
                updateMultipleFriendshipEvents,
                updateStats
            },
            basicPowerTable: MM_TABLES.getBasicAttackPower.bind(MM_TABLES)
        };
        
        const result = Combat.Actions.executeWildAttack({
            encounter,
            player,
            playerMonster,
            d20Roll,
            dependencies
        });
        
        // 4. Processar resultado
        if (!result.success) {
            console.error('Attack failed:', result.reason);
            return;
        }
        
        // 5. Atualizar UI (1 vez só ao final)
        saveToLocalStorage();
        renderEncounter();
        
    } catch (error) {
        showError('Attack failed', error.stack);
    }
}

// Manter outras funções como estão (useSkillWild, captureWild, etc.)
```

---

## 9. Benefícios da Refatoração

### ✅ Testabilidade
- `wildCore.js` pode ter 100% de cobertura via Vitest
- Testes unitários para checkHit, calcDamage, etc.

### ✅ Manutenibilidade
- Lógica de combate separada de UI
- Easier to add new features (new attack types, etc.)

### ✅ Reutilização
- `wildCore.js` pode ser usado por group/boss combat
- Padrão para futuros PRs (PR5: group combat)

### ✅ Performance
- Reduzir saves no localStorage (de 8+ para 1 por turno)
- Batch DOM updates

### ✅ Debugging
- Logs estruturados via return values
- Easier to trace bugs

---

## 10. Riscos e Mitigações

### Risco 1: Quebrar comportamento existente
**Mitigação:** Manter wrapper `attackWild()` que chama nova API  
**Validação:** Smoke test manual antes do merge

### Risco 2: Dependency injection complexa demais
**Mitigação:** Usar objeto `dependencies` simples  
**Exemplo:** `{ state, audio, storage, ui, rewards }`

### Risco 3: Performance regression
**Mitigação:** Medir antes/depois (localStorage writes, render calls)  
**Meta:** Reduzir de 8+ saves para 1 save por turno

### Risco 4: Módulos não carregarem no navegador
**Mitigação:** Usar `type="module"` em `<script>`  
**Validação:** Testar em Chrome/Firefox/Safari

---

## 11. Fora de Escopo (PR4)

Estas funcionalidades **NÃO** serão refatoradas no PR4:

- ❌ Batalhas em grupo (atacar múltiplos alvos)
- ❌ Batalhas de boss
- ❌ Sistema de XP/Level up
- ❌ Sistema de captura
- ❌ Sistema de recompensas (handleVictoryRewards)
- ❌ Sistema de amizade
- ❌ Sistema de tutorial
- ❌ Storage/persistência geral
- ❌ Renderização geral (renderEncounter interna)
- ❌ CSS ou layout

**Motivo:** PR4 foca APENAS em wild 1v1 combat. Outras features serão tratadas em PRs futuros.

---

## 12. Próximos Passos (Ordem de Implementação)

1. ✅ **AUDIT** (este documento)
2. ⏳ Criar `js/combat/wildCore.js` com funções puras
3. ⏳ Criar `js/combat/wildActions.js` com ações de combate
4. ⏳ Criar `js/combat/wildUI.js` com feedback visual
5. ⏳ Criar `js/combat/index.js` com API pública
6. ⏳ Atualizar `index.html` com wrapper de compatibilidade
7. ⏳ Adicionar `type="module"` ao `<script>` principal
8. ⏳ Smoke test manual (checklist completo)
9. ⏳ Validar console (sem erros)
10. ⏳ Validar persistência (reload preserva estado)

---

## 13. Checklist de Validação

Antes de marcar PR4 como completo:

- [ ] Jogo abre sem erros de console
- [ ] Criar sessão funciona
- [ ] Criar jogador funciona
- [ ] Iniciar encontro wild funciona
- [ ] Input de d20 aceita valores 1-20
- [ ] d20=1 sempre erra (falha crítica)
- [ ] d20=20 sempre acerta (crítico com bônus aleatório)
- [ ] d20=2-19 usa checkHit normal
- [ ] Dano calculado corretamente (nova fórmula)
- [ ] Vantagem de classe (+2 ATK, +10% dano)
- [ ] Desvantagem de classe (-2 ATK, -10% dano)
- [ ] HP do inimigo reduz corretamente
- [ ] Vitória: XP distribuído, encontro finalizado
- [ ] Derrota: monstrinho marcado como "fainted"
- [ ] Contra-ataque inimigo funciona (skill ou basic)
- [ ] Animações visuais funcionam (flash, floating text)
- [ ] Sons tocam corretamente (hit/miss/crit/win)
- [ ] LocalStorage persiste estado
- [ ] Reload recupera estado corretamente
- [ ] Console sem warnings
- [ ] Console sem erros

---

## 14. Métricas de Sucesso

| Métrica | Antes | Depois | Meta |
|---------|-------|--------|------|
| Linhas em attackWild() | 274 | <100 | Reduzir >60% |
| Saves por turno | 8+ | 1 | Reduzir 87.5% |
| Render calls por turno | 8+ | 1 | Reduzir 87.5% |
| Funções puras testáveis | 0 | 4+ | 100% cobertura |
| Código duplicado | Alta | Baixa | Zero duplicação |

---

**Documento gerado em:** 2026-01-31  
**Versão:** 1.0  
**Status:** ✅ COMPLETO
