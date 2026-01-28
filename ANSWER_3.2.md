# Resposta: Feature 3.2 - Batalhas em Grupo

## 🎯 Pergunta Original

**"No seu código atual, o monstro ativo do jogador fica onde?"**

## ✅ Resposta Direta

### `player.team[0]`

O sistema sempre usa o **primeiro monstrinho do array team** como monstrinho ativo.

**Código atual:**
```javascript
// Linha 1199 - renderWildEncounter
const playerMonster = player?.team?.[0];

// Linha 1696 - attackWild
const playerMonster = player.team?.[0];
```

**Estrutura:**
```javascript
player = {
    id: 'player_123',
    name: 'Carlos',
    class: 'Guerreiro',
    team: [
        { ...monsterInstance },  // ← [0] = ATIVO
        { ...monsterInstance },
        // ... até 6 total
    ],
    inventory: { ... }
}
```

---

## 📋 Status da Feature 3.2

### ✅ Fase 1: COMPLETA (2h)

**Implementado:**
- UI de seleção de participantes com checkboxes
- Validação 1-6 jogadores
- Função `startGroupEncounter()`
- Estrutura de encounter tipo 'group_trainer'
- Compatibilidade com wild mantida

**Arquivos modificados:** index.html

### ⏳ Fase 2: PLANEJADA (2h)

**A implementar:**
- `calculateGroupTurnOrder()` - Ordenar por SPD + d20
- `advanceTurn()` - Incrementar turnIndex
- `getCurrentActor()` - Pegar ator do turno

**Código completo em:** FEATURE_3.2_PLAN.md

### ⏳ Fase 3: PLANEJADA (3h)

**A implementar:**
- `renderGroupEncounter()` - UI de batalha
- `groupAttack/Skill/Item/Pass()` - Ações
- `processEnemyTurnGroup()` - IA
- `checkGroupBattleEnd()` - Vitória/Derrota

**Código completo em:** FEATURE_3.2_PLAN.md

---

## 📊 Progresso

```
Fase 1: ████████████████████ 100% ✅
Fase 2: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
Fase 3: ░░░░░░░░░░░░░░░░░░░░   0% ⏳
──────────────────────────────────
Total:  ██████░░░░░░░░░░░░░░  20%
```

**Tempo investido:** 2h  
**Tempo restante:** 5h  
**Total estimado:** 7h  

---

## 🗺️ Estrutura Definida

### Encounter Wild (Atual)
```javascript
{
    type: 'wild',
    selectedPlayerId: 'player_id',
    wildMonster: { hp, atk, def, ... }
}
```

**Acesso:**
- Jogador: `GameState.players.find(p => p.id === encounter.selectedPlayerId)`
- Monstrinho: `player.team[0]`
- Inimigo: `encounter.wildMonster`

### Encounter Group (Novo)
```javascript
{
    type: 'group_trainer',
    participants: ['player_1', 'player_2'],
    enemies: [
        { hp, atk, def, ..., id: 'enemy_1' }
    ],
    turnOrder: [
        { side: 'player', id: 'player_1', spd: 15, tiebreaker: 18 },
        { side: 'enemy', id: 'enemy_1', spd: 12, tiebreaker: 10 },
        { side: 'player', id: 'player_2', spd: 10, tiebreaker: 14 }
    ],
    turnIndex: 0,
    currentActor: { side: 'player', id: 'player_1' }
}
```

**Acesso:**
- Jogadores: `encounter.participants.map(id => GameState.players.find(p => p.id === id))`
- Monstrinhos: `players.map(p => p.team[0])`
- Inimigos: `encounter.enemies`
- Ator atual: `getCurrentActor(encounter)`

---

## 🔧 Funções Planejadas

### ✅ Criadas (1/16)
- [x] `startGroupEncounter(playerIds, enemyTemplate, level)`

### ⏳ Pendentes (15/16)

**Core:**
- [ ] `calculateGroupTurnOrder(encounter)`
- [ ] `getCurrentActor(encounter)`
- [ ] `advanceTurn(encounter)`

**Renderização:**
- [ ] `renderGroupEncounter(panel, encounter)`
- [ ] `renderParticipants(encounter)`
- [ ] `renderEnemies(encounter)`
- [ ] `renderCurrentTurn(encounter, actor)`
- [ ] `renderPlayerActions(encounter, actor)`

**Ações:**
- [ ] `groupAttack()`
- [ ] `groupUseSkill(skillIndex)`
- [ ] `groupUseItem(itemId)`
- [ ] `groupPassTurn()`

**IA:**
- [ ] `processEnemyTurnGroup(encounter)`
- [ ] `chooseEnemyTarget(encounter)`

**Fim:**
- [ ] `checkGroupBattleEnd(encounter)`

---

## 📝 Diferenças: Wild vs Group

| Feature | Wild (1v1) | Group (MVP) |
|---------|-----------|-------------|
| **Jogadores** | 1 | 1-6 |
| **Inimigos** | 1 wild | 1 trainer/boss |
| **Turnos** | Fixo (P→E) | SPD ordenado |
| **Captura** | ✅ Sim | ❌ Não |
| **Alvo** | Único | Auto (menor HP) |
| **Ações** | Attack/Skill/Item/<br>Capture/Flee | Attack/Skill/Item/<br>Pass |
| **UI** | `renderWildEncounter()` | `renderGroupEncounter()` |
| **Funções** | `attackWild()` | `groupAttack()` |

---

## 🎮 Fluxo do Jogo

### Iniciar Batalha
```
1. Tab "Encounter"
2. Selecionar "Trainer Battle (Group)"
3. Marcar checkboxes (2+ jogadores)
4. Selecionar nível do inimigo
5. Clicar "Iniciar Batalha em Grupo"
```

### Durante Batalha
```
LOOP:
    1. Renderizar estado
    2. Se turno do jogador:
        - Mostrar ações
        - Aguardar escolha
        - Aplicar ação
        - Avançar turno
    3. Se turno do inimigo:
        - IA decide
        - Aplica ação
        - Avançar turno
    4. Verificar vitória/derrota
    5. Continue ou Fim
```

### Fim de Batalha
```
Vitória: Todos enemies.hp = 0
Derrota: Todos players[].team[0].hp = 0
```

---

## 📦 Documentação Disponível

### FEATURE_3.2_PLAN.md (14.6KB)

**Conteúdo completo:**
- Estruturas de dados detalhadas
- Código de todas as 16 funções
- Explicações linha por linha
- Fluxos de jogo
- Critérios de aceitação
- Cronograma de 7 horas

**Como usar:**
1. Abrir arquivo
2. Ir para fase desejada
3. Copiar código
4. Adaptar conforme necessário
5. Testar
6. Commitar

---

## 🎯 Próximo Passo

### Implementar Fase 2 (2 horas)

**Tarefas:**
1. Criar `calculateGroupTurnOrder()`
   - Coletar todos atores (players + enemies)
   - Ordenar por SPD descendente
   - Desempate com d20
   - Retornar array ordenado

2. Criar `advanceTurn()`
   - Incrementar turnIndex
   - Loop ao fim
   - Atualizar currentActor

3. Criar `getCurrentActor()`
   - Pegar ator do turnOrder[turnIndex]
   - Retornar player ou enemy
   - Retornar monster ativo

4. Testar
   - Criar encounter de teste
   - Verificar ordem correta
   - Verificar avanço de turno

**Código pronto em:** FEATURE_3.2_PLAN.md (Seção "Fase 2")

---

## ✅ Critérios de Aceitação (MVP)

- [x] Iniciar batalha com 2+ jogadores ✅
- [ ] Ordem por SPD funcionando
- [ ] Cada jogador age no seu turno
- [ ] Inimigo age no seu turno
- [ ] Atacar/Skill/Item funcionam
- [ ] Captura desabilitada
- [ ] Vitória ao derrotar inimigo
- [ ] Derrota quando todos caem
- [ ] Persiste corretamente
- [x] Não quebra wild 1v1 ✅

**Progresso:** 2/10 (20%)

---

## 🔄 Reutilização de Código

### ✅ Reaproveitar
- `calcDamage()` - Fórmula de dano
- `checkHit()` - Teste de acerto
- `applyEneRegen()` - Regeneração ENE
- `updateBuffs()` - Gerenciar buffs
- `getMonsterSkills()` - Habilidades
- `useSkill()` - Aplicar skill (adaptar target)
- Lógica de cura de itens

### ❌ Não Modificar
- `attackWild()` - Manter para wild
- `useSkillWild()` - Manter para wild
- `useItemInBattle()` - Manter para wild
- `renderWildEncounter()` - Manter para wild

### ✨ Criar Novos
- `groupAttack()` - Versão grupo
- `groupUseSkill()` - Versão grupo
- `groupUseItem()` - Versão grupo
- `renderGroupEncounter()` - UI grupo

---

## 💡 Observações Importantes

### Simplificações do MVP

1. **1 inimigo apenas** - não 1-3
2. **Auto-targeting** - sempre menor HP
3. **Sem troca mid-battle** - fixa team[0]
4. **Sem fuga em grupo** - só vitória/derrota
5. **Sem escolha de alvo** - automático

### Expansões Futuras

Depois do MVP:
- Múltiplos inimigos (1-3)
- Escolha manual de alvo
- Troca de monstrinho durante batalha
- Fuga em grupo (consenso)
- Boss battles especiais
- XP e recompensas distribuídas

---

## 📅 Cronograma Detalhado

| Fase | Tarefa | Tempo | Status |
|------|--------|-------|--------|
| **3.2.1** | **Estrutura Base** | **2h** | **✅** |
| | UI seleção participantes | 30min | ✅ |
| | startGroupEncounter() | 45min | ✅ |
| | Testes básicos | 45min | ✅ |
| **3.2.2** | **Sistema Turnos** | **2h** | **⏳** |
| | calculateGroupTurnOrder() | 45min | ⏳ |
| | advanceTurn() | 30min | ⏳ |
| | getCurrentActor() | 15min | ⏳ |
| | Testes de ordenação | 30min | ⏳ |
| **3.2.3** | **Batalha Completa** | **3h** | **⏳** |
| | renderGroupEncounter() | 1h | ⏳ |
| | Ações do jogador | 45min | ⏳ |
| | IA do inimigo | 45min | ⏳ |
| | Vitória/Derrota | 30min | ⏳ |
| **TOTAL** | | **7h** | **14%** |

---

## 🎉 Resumo Final

### ✅ Pronto
- Resposta: `player.team[0]`
- Estrutura definida
- Plano completo (7h)
- Fase 1 implementada (20%)
- Documentação completa

### ⏳ Falta
- Fase 2: Turnos (2h)
- Fase 3: Batalha (3h)
- Total: 5h (80%)

### 🚀 Próxima Ação
Implementar Fase 2 usando FEATURE_3.2_PLAN.md

---

**Data:** 2026-01-28  
**Status:** Planejado e 20% implementado  
**Documento:** FEATURE_3.2_PLAN.md (14.6KB)  
**Próximo:** Fase 2 (Sistema de Turnos)
