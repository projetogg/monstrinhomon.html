# 💬 Prompts Prontos para ChatGPT - Monstrinhomon

Este documento contém prompts estruturados e prontos para usar com o ChatGPT para implementar cada feature do roadmap.

---

## 📋 Como Usar Este Documento

1. **Copie o prompt completo** da feature que quer implementar
2. **Cole no ChatGPT** (recomendado: GPT-4 ou superior)
3. **Inclua contexto adicional** se necessário (arquivos específicos, erros, etc.)
4. **Revise o código gerado** antes de aplicar
5. **Teste localmente** antes de commitar

---

## 🎯 FASE 3: Batalha e Progressão

### 3.1 Sistema de Uso de Itens em Batalha

```
# PROMPT: Implementar Uso de Itens em Batalha

Contexto:
- Jogo: Monstrinhomon (RPG terapêutico para crianças)
- Arquivo: index.html (single-page application)
- Sistema atual: Batalhas individuais funcionando com ataque/habilidades
- Inventário: Jogadores têm itens no formato player.inventory = { 'IT_HEAL_01': 3 }

Tarefa:
Implementar sistema de uso de itens de cura durante batalha.

Requisitos:
1. Adicionar botão "💚 Usar Item" na interface de batalha (renderWildEncounter)
2. Ao clicar, mostrar dropdown com itens curáveis disponíveis:
   - IT_HEAL_01: Petisco de Cura (cura 30% HP)
   - Mostrar quantidade disponível
   - Só listar itens com quantity > 0
3. Criar função useItemInBattle(itemId):
   - Validar que item existe no inventário
   - Aplicar cura ao monstrinho ativo do jogador
   - Cura = Math.floor(playerMonster.hpMax * 0.30)
   - playerMonster.hp = Math.min(playerMonster.hpMax, playerMonster.hp + heal)
   - Consumir item: player.inventory[itemId]--
   - Logar: "💚 [PlayerName] usou [ItemName]! [MonsterName] recuperou [X] HP!"
4. Após usar item, inimigo tem seu turno (mesma lógica de attackWild)
5. Validações:
   - Desabilitar botão se inventário vazio
   - Não permitir usar se HP já está em max
   - Não permitir se monstrinho desmaiado

Padrão de código:
- Seguir estilo de attackWild() e useSkillWild()
- Usar GameState.currentEncounter
- Usar saveToLocalStorage() após mudanças
- Usar renderEncounter() para atualizar UI

Por favor, forneça:
1. Código HTML para o botão e dropdown
2. Código JavaScript completo da função useItemInBattle()
3. Integração com a função renderWildEncounter()
```

---

### 3.2 Batalhas em Grupo (Trainer/Boss)

```
# PROMPT: Implementar Batalhas em Grupo

Contexto:
- Jogo: Monstrinhomon (RPG terapêutico)
- Arquivo: index.html
- Sistema atual: Batalhas individuais (1 jogador vs 1 selvagem) funcionando
- Objetivo: Permitir party completa (até 6 jogadores) batalhar juntos

Tarefa:
Implementar sistema de batalhas em grupo contra trainers/bosses.

Requisitos:
1. Novo tipo de encontro: 'trainer' e 'boss'
2. Interface de seleção de participantes:
   - Checkboxes para cada jogador da sessão
   - Validar que cada jogador tem monstrinho válido da sua classe
   - Mínimo 1 jogador, máximo 6
3. Sistema de turnos por SPD:
   - Calcular ordem: todos jogadores + todos inimigos
   - Ordenar por monster.spd (decrescente)
   - Indicador visual de quem é o turno atual
4. Múltiplos inimigos:
   - 1-3 monstros inimigos
   - Cada um com HP, ATK, DEF independentes
   - IA individual para cada inimigo
5. Ações por turno:
   - Botões: Atacar, Habilidade, Item, Passar Turno
   - Selecionar alvo (se múltiplos inimigos)
   - Após ação, próximo na ordem
6. Condições de vitória/derrota:
   - Vitória: todos inimigos derrotados
   - Derrota: todos jogadores com monstros desmaiados
7. Recompensas:
   - XP: distribuído para todos participantes ativos
   - Dinheiro: dividido igualmente
   - Items: vão para inventário da sessão (futuro)
8. Regras:
   - Sem captura em batalhas de grupo
   - Fuga mais difícil (DC +5)

Estrutura sugerida:
```javascript
GameState.currentEncounter = {
  type: 'trainer', // ou 'boss'
  participants: [playerId1, playerId2, ...],
  enemies: [enemy1, enemy2, ...],
  turnOrder: [{ type: 'player', id: playerId }, { type: 'enemy', id: enemyId }, ...],
  currentTurnIndex: 0,
  active: true,
  log: []
}
```

Por favor, forneça:
1. Interface de seleção de participantes
2. Função startGroupEncounter()
3. Função calculateTurnOrder()
4. Função processGroupTurn()
5. Atualização de renderEncounter() para mostrar múltiplos participantes
6. Sistema de seleção de alvo
```

---

### 3.3 Sistema de Progressão (XP e Level Up)

```
# PROMPT: Implementar Sistema de Progressão

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Dados: MONSTROS.csv tem growth rates por stat
- Fórmula XP: Math.round(40 + 6*L + 0.6*(L*L))
- Level up HP: hpMax = hpMax * 1.04 + 2

Tarefa:
Implementar sistema completo de XP, level up e evolução.

Requisitos:
1. Ganhar XP após vitória:
   ```javascript
   function calculateBattleXP(defeatedMonster) {
     const baseXP = 15;
     const levelMod = defeatedMonster.level * 2;
     const rarityMod = RARITY_XP[defeatedMonster.rarity] || 1.0;
     return Math.floor((baseXP + levelMod) * rarityMod);
   }
   ```
2. Distribuir XP:
   - Apenas para monstros que participaram da batalha
   - Chamar giveXP(monster, amount)
3. Função giveXP(monster, amount):
   ```javascript
   - monster.xp += amount
   - Enquanto xp >= xpNeeded:
     * Subir nível (monster.level++)
     * Subtrair XP usado (monster.xp -= xpNeeded)
     * Recalcular stats com growth rates
     * Aplicar fórmula HP: hpMax = Math.floor(hpMax * 1.04 + 2)
     * HP atual aumenta proporcionalmente
     * Logar: "✨ [MonsterName] subiu para nível [X]!"
     * Verificar evolução
     * Verificar aprendizado de skills (mudança de stage)
   ```
4. Recalcular stats:
   ```javascript
   function recalculateStats(monster) {
     const template = MONSTER_CATALOG.find(m => m.id === monster.monsterId);
     const rarityMult = RARITY_POWER[template.rarity] || 1.0;
     const levelMult = 1 + (monster.level - 1) * 0.1;
     
     monster.atk = Math.floor(template.baseAtk * levelMult * rarityMult);
     monster.def = Math.floor(template.baseDef * levelMult * rarityMult);
     monster.spd = Math.floor(template.baseSpd * levelMult * rarityMult);
     // HP já foi atualizado pela fórmula específica
   }
   ```
5. Verificar evolução:
   ```javascript
   function checkEvolution(monster) {
     const template = MONSTER_CATALOG.find(m => m.id === monster.monsterId);
     if (template.evolvesTo && monster.level >= template.evolvesAt) {
       // Evoluir para próxima forma
       // Mostrar notificação
       // Recalcular stats com novo template
     }
   }
   ```
6. Verificar mudança de stage:
   - S0: 1-9, S1: 10-24, S2: 25-44, S3: 45+
   - Se stage mudou, notificar aprendizado de skills
   - "🎓 [MonsterName] aprendeu [SkillName II]!"

Por favor, forneça:
1. Função calculateBattleXP()
2. Função giveXP() completa com todas as validações
3. Função recalculateStats()
4. Função checkEvolution()
5. Integração com attackWild() para dar XP após vitória
6. Notificações visuais de level up e evolução
```

---

### 3.4 Gestão de Time e Caixa

```
# PROMPT: Implementar Gestão de Time e Caixa

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Estado atual: player.team (array até 6) e player.box (array ilimitado)

Tarefa:
Criar interface completa para gerenciar time e caixa de monstrinhos.

Requisitos:
1. Nova aba "Time" no menu principal
2. Estrutura da interface:
   ```
   [Time Ativo (1-6)]
   - Card visual de cada monstrinho
   - HP atual/max, nível, XP
   - Botão "Detalhes"
   - Botão "Para Caixa" (se team.length > 1)
   
   [Caixa]
   - Grid de todos monstrinhos na caixa
   - Cards menores
   - Botão "Para Time" (se team.length < 6)
   ```
3. Função swapToTeam(monsterId):
   - Validar team.length < 6
   - Mover de box para team
   - Salvar estado
   - Atualizar UI
4. Função swapToBox(monsterId):
   - Validar team.length > 1
   - Mover de team para box
   - Salvar estado
   - Atualizar UI
5. Modal de detalhes:
   - Mostrar todos os stats (HP, ATK, DEF, SPD, ENE)
   - Mostrar XP atual e para próximo nível
   - Listar todas as habilidades com descrições
   - Mostrar buffs/debuffs ativos
   - Input para renomear (máx 12 caracteres)
   - Botão "Salvar" e "Fechar"
6. Sistema de renomear:
   ```javascript
   function renameMonster(monsterId, newNickname) {
     const monster = findMonsterById(monsterId);
     monster.nickname = newNickname.substring(0, 12);
     saveToLocalStorage();
     renderTeamManagement();
   }
   ```

Estilo visual:
- Cards: border-radius 10px, shadow suave
- HP bar: verde → amarelo → vermelho
- Ícone de classe visível
- Hover effects para interatividade

Por favor, forneça:
1. HTML completo da nova aba
2. CSS inline ou sugestões de estilo
3. Funções swapToTeam() e swapToBox()
4. Modal de detalhes com todos os stats
5. Sistema de renomear funcionando
```

---

## 🎯 FASE 4: Menu e Fluxo

### 4.1 Menu Principal e Fluxo de Novo Jogo

```
# PROMPT: Implementar Menu Principal

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Objetivo: Criar experiência completa do início ao fim

Tarefa:
Criar tela de intro, menu principal e fluxo de novo jogo.

Requisitos:
1. Tela de Intro:
   ```html
   <div id="introScreen" class="fullscreen-overlay">
     <h1 class="game-title">🎮 Monstrinhomon 🌟</h1>
     <p class="subtitle">Um RPG Terapêutico para Jovens Treinadores</p>
     <button onclick="showMainMenu()">✨ Iniciar ✨</button>
   </div>
   ```
2. Menu Principal:
   ```html
   <div id="mainMenu" class="fullscreen-overlay hidden">
     <h1>Menu Principal</h1>
     <button onclick="startNewGame()">🎮 Novo Jogo</button>
     <button onclick="continueGame()">📖 Continuar Aventura</button>
     <button onclick="showSettings()">⚙️ Configurações</button>
   </div>
   ```
3. Fluxo de Novo Jogo:
   - Tela 1: Selecionar número de jogadores (1-6)
     * Radio buttons ou slider
     * Botão "Próximo"
   - Tela 2: Selecionar dificuldade
     * Fácil / Médio / Difícil
     * Descrição de cada
     * Botão "Próximo"
   - Tela 3: Criar cada jogador
     * Loop para numPlayers
     * Input: nome do jogador
     * Dropdown: classe (8 opções)
     * Monstrinho inicial automático (mesma classe)
     * Botão "Próximo Jogador" / "Finalizar"
   - Tela 4: Iniciar Tutorial
     * Mensagem de boas-vindas
     * Botão "Começar Aventura!"
4. Função startNewGame():
   ```javascript
   - Mostrar tela de seleção de jogadores
   - Capturar numPlayers
   - Mostrar tela de dificuldade
   - Capturar difficulty
   - Loop para criar jogadores
   - Criar sessão inicial
   - Iniciar no tutorial
   ```
5. Sistema de navegação:
   - Controlar visibilidade com classes .hidden
   - Animações fade-in/fade-out (CSS transitions)
   - Botões "Voltar" onde apropriado

Estilo visual:
- Fullscreen overlays com z-index alto
- Background: gradiente ou imagem temática
- Botões grandes e legíveis (crianças)
- Fonte clara, tamanho 18px+
- Cores vibrantes e amigáveis

Por favor, forneça:
1. HTML de todas as telas
2. CSS para estilização
3. Funções JavaScript completas
4. Sistema de navegação entre telas
5. Validações de input
```

---

### 4.2 Tutorial Interativo

```
# PROMPT: Implementar Tutorial Interativo

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Público: Crianças 7-12 anos
- Objetivo: Ensinar mecânicas básicas de forma divertida

Tarefa:
Criar tutorial interativo em 3 etapas.

Requisitos:
1. Estrutura do Tutorial:
   ```javascript
   const TUTORIAL = {
     steps: [
       {
         id: 'battle_basics',
         title: 'Aprendendo a Batalhar',
         encounter: { ... }, // Encontro fácil
         instructions: [
           "Role o dado d20 e informe o número!",
           "Agora escolha 'Atacar' para derrotar o inimigo!",
           "Ótimo! Continue atacando até vencer!"
         ],
         requiredActions: ['attack', 'attack'],
         completionMessage: "🎉 Você dominou o básico de batalha!"
       },
       {
         id: 'skills',
         title: 'Usando Habilidades',
         encounter: { ... },
         instructions: [
           "Habilidades são mais fortes, mas gastam ENE!",
           "Clique no botão de habilidade para usar!",
           "ENE regenera a cada turno, fique de olho!"
         ],
         requiredActions: ['useSkill'],
         completionMessage: "✨ Você aprendeu a usar habilidades!"
       },
       {
         id: 'capture',
         title: 'Capturando Monstrinhos',
         encounter: { ... },
         instructions: [
           "Para capturar, primeiro abaixe o HP do monstrinho!",
           "Quando o HP estiver baixo, aparecerá ✅!",
           "Escolha uma ClasterOrb e tente capturar!",
           "Parabéns! Agora ele é seu!"
         ],
         requiredActions: ['attack', 'attack', 'capture'],
         completionMessage: "🎯 Você capturou seu primeiro monstrinho!"
       }
     ]
   }
   ```
2. Sistema de Controle:
   ```javascript
   GameState.tutorial = {
     active: true,
     currentStep: 0,
     actionsCompleted: []
   }
   ```
3. Função processTutorialAction(action):
   - Verificar se action é requerida no step atual
   - Adicionar a actionsCompleted
   - Se todas ações completas, avançar step
   - Mostrar mensagem de conclusão
   - Desabilitar outras ações (forçar tutorial)
4. Interface:
   - Caixa de diálogo no topo com instruções
   - Seta apontando para botão correto
   - Desabilitar ações não requeridas
   - Animação de congratulações ao completar
5. Encontros do Tutorial:
   - Inimigos fracos (nível 1-2)
   - HP baixo para capturas rápidas
   - Sem risco de derrota (HP jogador alto)

Por favor, forneça:
1. Estrutura completa TUTORIAL
2. Funções de controle do tutorial
3. Interface com caixa de diálogo
4. Integração com sistema de batalha
5. Condições de conclusão
```

---

### 4.3 Sistema de Save/Load Completo

```
# PROMPT: Implementar Sistema de Save/Load

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Storage: localStorage
- Objetivo: Múltiplos slots e auto-save

Tarefa:
Criar sistema robusto de salvamento e carregamento.

Requisitos:
1. Estrutura de slots:
   ```javascript
   const SAVE_KEYS = {
     slot1: 'mm_save_slot_1',
     slot2: 'mm_save_slot_2',
     slot3: 'mm_save_slot_3',
     autosave: 'mm_autosave'
   }
   ```
2. Função saveTo Slot(slotNumber):
   ```javascript
   - Validar slotNumber (1-3)
   - Criar objeto de save:
     {
       version: '1.0',
       timestamp: Date.now(),
       sessionName: GameState.currentSession.name,
       players: GameState.players,
       sessions: GameState.sessions,
       // ... todo o estado necessário
     }
   - localStorage.setItem(SAVE_KEYS[`slot${slotNumber}`], JSON.stringify(saveData))
   - Mostrar toast: "💾 Jogo salvo no Slot X!"
   ```
3. Função loadFromSlot(slotNumber):
   ```javascript
   - Ler de localStorage
   - Parse JSON
   - Validar integridade (version, campos obrigatórios)
   - Restaurar GameState
   - saveToLocalStorage() para atualizar
   - renderAllViews()
   - Mostrar toast: "📂 Jogo carregado do Slot X!"
   ```
4. Auto-save:
   ```javascript
   - Salvar automaticamente a cada:
     * Vitória em batalha
     * Captura bem-sucedida
     * Mudança de time
     * Level up
     * A cada 2 minutos (setInterval)
   - Salvar em slot especial 'autosave'
   - Mostrar indicador: "💾 Salvando..." (fade out 1s)
   ```
5. Interface de Load:
   ```html
   <div id="loadGameScreen">
     <h2>Continuar Aventura</h2>
     <div class="save-slots">
       <div class="save-slot" onclick="loadFromSlot(1)">
         <h3>Slot 1</h3>
         <p>Sessão: [Nome]</p>
         <p>Jogadores: [N]</p>
         <p>Salvo em: [Data/Hora]</p>
         <button>Carregar</button>
         <button onclick="deleteSlot(1)">Deletar</button>
       </div>
       <!-- Slots 2 e 3 -->
     </div>
     <button onclick="showMainMenu()">Voltar</button>
   </div>
   ```
6. Exportar/Importar:
   - Botão "Exportar Save" → download JSON
   - Botão "Importar Save" → file input + parse

Por favor, forneça:
1. Funções saveToSlot() e loadFromSlot()
2. Sistema de auto-save
3. Interface de seleção de slots
4. Funções de exportar/importar
5. Validações de integridade
```

---

## 🎯 FASE 5: Dificuldade e Balanceamento

### 5.1 Sistema de Três Dificuldades

```
# PROMPT: Implementar Níveis de Dificuldade

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Objetivo: 3 níveis de dificuldade ajustáveis

Tarefa:
Implementar multiplicadores de dificuldade que afetam todo o jogo.

Requisitos:
1. Configuração de dificuldades:
   ```javascript
   const DIFFICULTY_SETTINGS = {
     easy: {
       name: 'Fácil',
       description: 'Ideal para iniciantes. Inimigos mais fracos e capturas mais fáceis.',
       enemyHpMult: 0.80,
       enemyAtkMult: 0.90,
       enemyDefMult: 0.90,
       xpRewardMult: 1.50,
       captureThresholdBonus: 0.15, // +15%
       fleeDCModifier: -2
     },
     medium: {
       name: 'Médio',
       description: 'Balanceado e desafiador. Recomendado para a maioria.',
       enemyHpMult: 1.00,
       enemyAtkMult: 1.00,
       enemyDefMult: 1.00,
       xpRewardMult: 1.00,
       captureThresholdBonus: 0.00,
       fleeDCModifier: 0
     },
     hard: {
       name: 'Difícil',
       description: 'Para veteranos. Inimigos muito fortes e capturas difíceis.',
       enemyHpMult: 1.30,
       enemyAtkMult: 1.20,
       enemyDefMult: 1.20,
       xpRewardMult: 0.75,
       captureThresholdBonus: -0.10, // -10%
       fleeDCModifier: 3
     }
   }
   ```
2. Aplicar multiplicadores ao criar inimigos:
   ```javascript
   function createWildMonster(template, level, difficulty) {
     const settings = DIFFICULTY_SETTINGS[difficulty];
     
     // HP
     monster.hpMax = Math.floor(baseHp * settings.enemyHpMult);
     monster.hp = monster.hpMax;
     
     // Stats
     monster.atk = Math.floor(baseAtk * settings.enemyAtkMult);
     monster.def = Math.floor(baseDef * settings.enemyDefMult);
     
     return monster;
   }
   ```
3. Aplicar no XP:
   ```javascript
   function calculateBattleXP(defeatedMonster, difficulty) {
     const baseXP = ...;
     const settings = DIFFICULTY_SETTINGS[difficulty];
     return Math.floor(baseXP * settings.xpRewardMult);
   }
   ```
4. Aplicar na captura:
   ```javascript
   function getCaptureThreshold(rarity, difficulty) {
     const baseThreshold = CAPTURE_BASE[rarity];
     const settings = DIFFICULTY_SETTINGS[difficulty];
     return baseThreshold + settings.captureThresholdBonus;
   }
   ```
5. Interface de seleção:
   - No fluxo de novo jogo
   - 3 cards grandes com descrições
   - Destacar "Médio" como recomendado
6. Permitir mudança em configurações:
   - Menu do Mestre
   - Aviso: "Mudar dificuldade afetará próximos encontros"

Por favor, forneça:
1. Objeto DIFFICULTY_SETTINGS completo
2. Integração com createWildMonster()
3. Integração com calculateBattleXP()
4. Integração com sistema de captura
5. Interface de seleção de dificuldade
6. Opção de mudar no menu de configurações
```

---

## 🎯 FASE 6: Status Effects

### 6.1 Sistema de Status Effects

```
# PROMPT: Implementar Status Effects Completos

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Objetivo: Adicionar profundidade tática

Tarefa:
Implementar 5 status effects principais.

Requisitos:
1. Estrutura de status:
   ```javascript
   monster.statusEffects = [
     {
       type: 'STUN',
       duration: 2,
       appliedBy: 'skillName'
     },
     {
       type: 'POISON',
       duration: 3,
       power: 5 // 5% HP por turno
     }
   ]
   ```
2. Tipos de status:
   ```javascript
   const STATUS_EFFECTS = {
     STUN: {
       name: 'Atordoado',
       icon: '⭐',
       effect: 'Perde o turno',
       onTurnStart: (monster) => {
         // Pular turno
         return { skipTurn: true };
       }
     },
     ROOT: {
       name: 'Enraizado',
       icon: '🌱',
       effect: 'Não pode fugir',
       onFlee: (monster) => {
         return { canFlee: false };
       }
     },
     WEAKEN: {
       name: 'Enfraquecido',
       icon: '💔',
       effect: '-25% ATK',
       modifyStats: (monster) => {
         return { atkMult: 0.75 };
       }
     },
     POISON: {
       name: 'Envenenado',
       icon: '🟢',
       effect: '5% HP por turno',
       onTurnStart: (monster) => {
         const damage = Math.floor(monster.hpMax * 0.05);
         monster.hp = Math.max(0, monster.hp - damage);
         return { damage: damage };
       }
     },
     SHIELD: {
       name: 'Escudo',
       icon: '🛡️',
       effect: '-30% dano recebido',
       modifyDamage: (damage) => {
         return Math.floor(damage * 0.70);
       }
     }
   }
   ```
3. Função applyStatus(monster, statusType, duration, power):
   ```javascript
   - Verificar se já tem este status (substituir ou empilhar?)
   - Adicionar a monster.statusEffects
   - Logar: "💫 [MonsterName] ficou [StatusName]!"
   - Mostrar ícone na UI
   ```
4. Função processStatusEffects(monster):
   ```javascript
   - Chamado no início do turno do monster
   - Para cada status em statusEffects:
     * Aplicar efeito (dano, skip turn, etc.)
     * Reduzir duration--
     * Se duration === 0, remover
     * Logar efeitos
   ```
5. Modificar sistema de dano:
   - Antes de aplicar dano, verificar SHIELD
   - Aplicar redução se status ativo
6. Modificar sistema de fuga:
   - Verificar ROOT antes de permitir fuga
7. Interface visual:
   - Ícones pequenos sob HP bar
   - Tooltip ao passar mouse
   - Animação ao aplicar/remover

Por favor, forneça:
1. Objeto STATUS_EFFECTS completo
2. Função applyStatus()
3. Função processStatusEffects()
4. Integração com sistema de combate
5. Interface visual com ícones
6. Tooltips informativos
```

---

## 🎯 FASE 7: Polimento

### 7.1 Animação de Dado d20

```
# PROMPT: Implementar Animação de Dado d20

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Objetivo: Criar expectativa visual para rolagens

Tarefa:
Criar animação de dado d20 rolando.

Opções de Implementação:
1. Animação CSS pura (mais simples)
2. Canvas 2D (médio)
3. Three.js 3D (mais complexo)

Recomendação: Começar com CSS pura

Requisitos:
1. HTML/CSS do dado:
   ```html
   <div id="diceContainer" class="hidden">
     <div class="dice">
       <div class="face">?</div>
     </div>
   </div>
   ```
   ```css
   .dice {
     width: 100px;
     height: 100px;
     border-radius: 15px;
     background: #fff;
     box-shadow: 0 10px 30px rgba(0,0,0,0.3);
     animation: rollDice 1.5s ease-in-out;
   }
   @keyframes rollDice {
     0% { transform: rotate(0deg) scale(1); }
     50% { transform: rotate(360deg) scale(1.3); }
     100% { transform: rotate(720deg) scale(1); }
   }
   ```
2. Função rollD20Animated():
   ```javascript
   - Mostrar #diceContainer
   - Animar dado girando
   - Mostrar números aleatórios rapidamente (1-20)
   - Após 1.5s, revelar número final
   - Som de dado rolando (opcional)
   - Som especial para 1 e 20
   ```
3. Integração com batalha:
   - Substituir input manual
   - Botão "🎲 Rolar Dado"
   - Desabilitar ações durante animação
   - Revelar resultado com destaque
4. Animações especiais:
   - d20 = 20: Dourado, brilho, explosão de partículas
   - d20 = 1: Vermelho, shake, nuvem negra
5. Modo debug:
   - Checkbox "Input Manual" para desenvolvedores
   - Permite inserir número específico

Por favor, forneça:
1. HTML e CSS completo do dado
2. Função rollD20Animated()
3. Integração com attackWild() e outras ações
4. Animações especiais para 1 e 20
5. Opção de modo debug
```

---

### 7.2 Sprites e Elementos Visuais

```
# PROMPT: Integrar Sprites Visuais

Contexto:
- Jogo: Monstrinhomon
- Arquivo: index.html
- Objetivo: Substituir emojis por sprites

Tarefa:
Preparar sistema para usar sprites de monstrinhos.

Requisitos:
1. Estrutura de assets:
   ```
   /assets/
     /monsters/
       mon_001.png (Pedrino)
       mon_002a.png (Ninfolha)
       mon_002b.png (Folhosa)
       ...
     /items/
       it_heal_01.png (Petisco)
       it_cap_comum.png (ClasterOrb Comum)
       ...
     /classes/
       cls_war.png (Guerreiro)
       cls_mag.png (Mago)
       ...
   ```
2. Carregar sprites:
   ```javascript
   function getMonsterSprite(monsterId) {
     return `./assets/monsters/${monsterId}.png`;
   }
   ```
3. Fallback para emoji:
   ```javascript
   <img 
     src="${getMonsterSprite(monster.monsterId)}" 
     onerror="this.style.display='none'; this.nextSibling.style.display='inline'"
     style="width: 64px; height: 64px;"
   >
   <span style="display:none; font-size:48px;">${monster.emoji}</span>
   ```
4. Barra de HP visual:
   ```html
   <div class="hp-bar-container">
     <div class="hp-bar" style="width: ${hpPercent}%; background: ${hpColor}">
       <span>${hp}/${hpMax}</span>
     </div>
   </div>
   ```
   ```css
   .hp-bar-container {
     width: 100%;
     height: 20px;
     background: #ddd;
     border-radius: 10px;
     overflow: hidden;
   }
   .hp-bar {
     height: 100%;
     transition: width 0.5s, background 0.5s;
     text-align: center;
     color: white;
     font-weight: bold;
   }
   ```
5. Animações de dano:
   ```javascript
   function showDamageNumber(amount, target) {
     const damageDiv = document.createElement('div');
     damageDiv.className = 'damage-number';
     damageDiv.textContent = `-${amount}`;
     target.appendChild(damageDiv);
     setTimeout(() => damageDiv.remove(), 1000);
   }
   ```
   ```css
   .damage-number {
     position: absolute;
     color: #f44336;
     font-size: 24px;
     font-weight: bold;
     animation: floatUp 1s ease-out;
     pointer-events: none;
   }
   @keyframes floatUp {
     0% { opacity: 1; transform: translateY(0); }
     100% { opacity: 0; transform: translateY(-50px); }
   }
   ```

Por favor, forneça:
1. Sistema de carregamento de sprites
2. Fallback para emojis
3. Barra de HP visual animada
4. Sistema de números flutuantes
5. Shake ao receber dano
6. Instruções para criar/encontrar sprites
```

---

## 📝 Notas Finais

### Dicas para Usar com ChatGPT

1. **Seja específico:** Quanto mais contexto, melhor o resultado
2. **Teste incrementalmente:** Implemente 1 feature por vez
3. **Revise o código:** ChatGPT pode ter bugs, sempre teste
4. **Adapte:** Use os prompts como base, não como absoluto
5. **Itere:** Se não ficou bom, peça melhorias específicas

### Ordem Recomendada

1. **Foco MVP primeiro:** Fases 3 e 4 são críticas
2. **Polimento depois:** Fase 7 é opcional mas impactante
3. **Teste com público:** Crianças reais devem testar cedo

### Recursos Adicionais

- [MDN Web Docs](https://developer.mozilla.org/) - Referência JavaScript/CSS
- [Itch.io](https://itch.io/game-assets/free) - Sprites gratuitos
- [Freesound](https://freesound.org/) - Efeitos sonoros gratuitos
- [Incompetech](https://incompetech.com/music/) - Música gratuita

---

**Boa sorte com a implementação! 🎮✨**
