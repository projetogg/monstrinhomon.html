# PR8B - Extrair giveXP/levelUp/rewards para xpActions com DI + wrappers

## 🎯 Objetivo
Modularizar a orquestração de progressão (XP/level/rewards) com Dependency Injection e wrappers, preservando compatibilidade total.

## 📁 Arquivos Criados/Modificados

### Criados
- `js/progression/xpActions.js` - Módulo de orquestração com DI
- `tests/xpActions.test.js` - 37 testes cobrindo todos os casos de uso

### Modificados
- `js/progression/index.js` - Adicionado export de Actions
- `index.html` - Adicionado `createProgressionDeps()` factory e wrappers

## 🔧 Mudanças Técnicas

### xpActions.js (Orquestração com DI)
**Funções exportadas**:
- `giveXP(deps, mon, amount, logArr)` - Aplica XP e processa level ups
- `levelUpMonster(deps, mon, logArr)` - Processa level up completo
- `handleVictoryRewards(deps, enc)` - Distribui recompensas de vitória
- `recalculateStatsFromTemplate(deps, mon)` - Recalcula stats (delegate)

**Dependências injetadas**:
```javascript
deps = {
    state: GameState,
    constants: { DEFAULT_FRIENDSHIP },
    helpers: {
        // Progression
        ensureMonsterProgressFields,
        calcXpNeeded,
        recalculateStatsFromTemplate,
        // Friendship
        getFriendshipBonuses,
        formatFriendshipBonusPercent,
        updateFriendship,
        // Evolution & Skills
        maybeEvolveAfterLevelUp,
        maybeUpgradeSkillsModelB,
        // Stats & XP
        updateStats,
        calculateBattleXP
    }
}
```

### index.html (Factory + Wrappers)

**Factory de Dependências**:
```javascript
function createProgressionDeps() {
    return {
        state: GameState,
        constants: { DEFAULT_FRIENDSHIP },
        helpers: { /* todas as funções necessárias */ }
    };
}
```

**Wrappers (mantém assinatura original)**:
```javascript
function giveXP(mon, amount, logArr) {
    return Progression.Actions.giveXP(createProgressionDeps(), mon, amount, logArr);
}

function levelUpMonster(mon, logArr) {
    return Progression.Actions.levelUpMonster(createProgressionDeps(), mon, logArr);
}

function handleVictoryRewards(enc) {
    return Progression.Actions.handleVictoryRewards(createProgressionDeps(), enc);
}
```

## ✅ Testes (37 novos)

### Cobertura

#### giveXP (11 testes)
1. Adicionar XP ao monstro
2. Logar XP recebido
3. Aplicar multiplicador de amizade
4. Processar level up quando XP suficiente
5. Processar múltiplos level ups
6. Nulo se monstro null
7. Nulo se amount = 0
8. Nulo se amount negativo
9. Usar log do encounter se não fornecido
10. Consistência
11. Edge cases

#### levelUpMonster (14 testes)
1. Incrementar nível
2. Aumentar HP máximo (fórmula 1.04 + 2)
3. Curar completamente ao subir de nível
4. Atualizar ENE máximo baseado no nível
5. Restaurar ENE ao subir de nível
6. Recalcular stats do template
7. Atualizar XP necessário para próximo nível
8. Logar level up
9. Chamar updateFriendship com evento 'levelUp'
10. Verificar evolução após level up
11. Verificar upgrade de skills
12. Nulo se monstro null
13. Preservar HP% ao calcular evolução
14. Edge cases

#### handleVictoryRewards (12 testes)
1. Calcular e distribuir XP
2. Marcar recompensas como concedidas
3. Não conceder recompensas duas vezes (idempotente)
4. Rastrear vitória nas estatísticas
5. Rastrear XP total ganho
6. Dar XP ao monstro vivo em batalha 1v1
7. Não dar XP a monstro morto
8. Distribuir XP para todos participantes vivos em grupo
9. Usar primeiro inimigo se enemies array existe
10. Aplicar boss bonus se tipo for boss
11. Usar selectedPlayerId/currentPlayerId/fallback
12. Edge cases

## 📊 Resultados dos Testes

```bash
npm test
```

```
 ✓ tests/wildCore.test.js   (34 tests)
 ✓ tests/groupCore.test.js  (33 tests)
 ✓ tests/xpCore.test.js     (25 tests)
 ✓ tests/xpActions.test.js  (37 tests) ← NOVOS

 Test Files  4 passed (4)
      Tests  129 passed (129)
```

## ⚠️ Risco

**Médio (Controlado)**
- Orquestração complexa (XP, level, rewards, friendship, evolution, skills)
- Mas: 100% testada com mocks
- Wrappers mantém compatibilidade total
- Todas as chamadas existentes inalteradas

**Mitigação**:
- 37 testes com mocks para isolar comportamento
- Factory de deps centraliza configuração
- Smoke test completo (level up + rewards + persistência)
- CI deve passar sem alterações

## 🔄 Compatibilidade

### Antes (index.html - monolítico)
```javascript
function giveXP(mon, amount, logArr) {
    // ... 35 linhas de lógica inline
    // acessa GameState, DEFAULT_FRIENDSHIP, getFriendshipBonuses, etc
}

function levelUpMonster(mon, logArr) {
    // ... 50 linhas de lógica inline
    // acessa GameState, calcXpNeeded, recalculateStatsFromTemplate, etc
}

function handleVictoryRewards(enc) {
    // ... 55 linhas de lógica inline
    // acessa GameState, updateStats, calculateBattleXP, etc
}
```

### Depois (index.html - wrappers)
```javascript
function giveXP(mon, amount, logArr) {
    return Progression.Actions.giveXP(createProgressionDeps(), mon, amount, logArr);
}

function levelUpMonster(mon, logArr) {
    return Progression.Actions.levelUpMonster(createProgressionDeps(), mon, logArr);
}

function handleVictoryRewards(enc) {
    return Progression.Actions.handleVictoryRewards(createProgressionDeps(), enc);
}
```

### Actions Modulares (xpActions.js)
```javascript
export function giveXP(deps, mon, amount, logArr) {
    // Mesma lógica, mas deps injetadas
}

export function levelUpMonster(deps, mon, logArr) {
    // Mesma lógica, mas deps injetadas
}

export function handleVictoryRewards(deps, enc) {
    // Mesma lógica, mas deps injetadas
}
```

## 📈 Benefícios

1. **Testabilidade**: 37 testes unitários com mocks simples
2. **Isolamento**: Lógica separada de dependências globais
3. **Reutilização**: Funções podem ser usadas em outros contextos
4. **Manutenibilidade**: Código modular, fácil entender e modificar
5. **Injeção de Dependências**: Facilita testes e substituição de implementações
6. **Documentação**: Testes servem como especificação viva

## 🧪 Smoke Test

### Pré-condições
- npm install
- npm test (129 testes passando)
- Abrir index.html em navegador

### Procedimento
1. **Criar nova sessão + jogador**
2. **Vencer 1 wild** → verificar XP recebido
3. **Vencer repetidamente** → forçar level up
4. **Observar**:
   - ✨ Level up log
   - HP restaurado
   - Stats recalculados
   - XP para próximo nível atualizado
   - Amizade aumentou
5. **Reload página** → verificar persistência
6. **Console** → sem erros

### Validação
- ✅ XP aplicado corretamente
- ✅ Level up funciona
- ✅ Stats recalculados
- ✅ Rewards distribuídas
- ✅ Persistência ok
- ✅ Console limpo
- ✅ npm test passa (129/129)

## 🔗 Integração com PR8A

**PR8A** criou `xpCore.js` (puro) com `calculateBattleXP()`.

**PR8B** usa `calculateBattleXP()` via deps:
```javascript
deps.helpers.calculateBattleXP = calculateBattleXP; // wrapper de PR8A
```

Toda a cadeia agora é modular e testada:
1. `calculateBattleXP` (puro, 25 testes)
2. `giveXP/levelUp/rewards` (orquestração, 37 testes)
3. Wrappers (compatibilidade)

## 🚀 Próximos Passos

Com progressão modularizada e 100% testada:
- Refatorar combate (wildCore + groupCore já modulares)
- Refatorar captura
- Refatorar evolução
- Refatorar skills
- Refatorar UI (gradual)

---

**Status**: ✅ COMPLETO
**Testes**: ✅ 129/129 passando
**Comportamento**: ✅ Idêntico ao anterior
**Risco**: ⚠️ Médio (controlado com testes)
