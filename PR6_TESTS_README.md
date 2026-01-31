# PR6 - Testes com Vitest para Funções Puras do Core

## 📋 Visão Geral

Este PR adiciona testes automatizados mínimos para as funções puras dos módulos de combate do Monstrinhomon. O objetivo é garantir que as mecânicas de combate funcionem corretamente através de testes isolados e determinísticos.

## 🎯 Escopo

### Funções Testadas

#### wildCore.js (Combate 1v1)
- ✅ `checkHit()` - Verificação de acerto com d20 + ATK vs DEF
- ✅ `calcDamage()` - Cálculo de dano com fórmula ATK/(ATK+DEF)
- ✅ `getClassAdvantageModifiers()` - Modificadores de vantagem de classe
- ✅ `getBuffModifiers()` - Cálculo de modificadores de buffs
- ✅ `checkCriticalRoll()` - Detecção de d20=1 e d20=20
- ✅ `applyDamageToHP()` - Aplicação de dano ao HP
- ✅ `calculateDamage()` - Wrapper completo de cálculo de dano

#### groupCore.js (Combate em Grupo/Boss)
- ✅ `isAlive()` - Verificação de entidade viva
- ✅ `clamp()` - Limitação de valores entre min/max
- ✅ `chooseTargetByLowestHP()` - Seleção de alvo por menor HP%
- ✅ `getCurrentActor()` - Obter ator atual baseado em turnIndex
- ✅ `hasAlivePlayers()` - Detecção de jogadores vivos
- ✅ `hasAliveEnemies()` - Detecção de inimigos vivos
- ✅ `calculateTurnOrder()` - Cálculo de ordem de turnos por SPD

## 📊 Cobertura de Testes

### wildCore.test.js
**Total: 17 testes**

- `checkHit()`: 8 testes
  - Acerto/erro básico
  - Vantagem de classe (+2 ATK)
  - Desvantagem de classe (-2 ATK)
  - Casos edge (d20=1, d20=20, null)

- `calcDamage()`: 6 testes
  - Cálculo básico
  - Multiplicadores de vantagem (+10%)
  - Multiplicadores de desvantagem (-10%)
  - Dano mínimo (sempre 1)
  - DEF muito alta
  - ATK muito alto

- `getClassAdvantageModifiers()`: 5 testes
  - Vantagem, desvantagem, neutro
  - Casos edge (null, classe inexistente)

- `getBuffModifiers()`: 5 testes
  - Buffs múltiplos
  - Soma de buffs do mesmo tipo
  - Case-insensitive
  - Casos edge (null, vazio)

- `checkCriticalRoll()`: 3 testes
  - d20=20 (crítico)
  - d20=1 (falha crítica)
  - d20 normal

- `applyDamageToHP()`: 4 testes
  - Redução normal
  - Overkill (dano > HP)
  - Dano zero
  - HP nunca negativo

- `calculateDamage()`: 3 testes
  - Vantagem de classe
  - Buffs de ATK
  - Dano mínimo

### groupCore.test.js
**Total: 15 testes**

- `isAlive()`: 5 testes
  - HP positivo, zero, negativo, null
  - Entity null

- `clamp()`: 4 testes
  - Valor dentro do range
  - Valor menor que min
  - Valor maior que max
  - Números negativos

- `chooseTargetByLowestHP()`: 6 testes
  - Seleção por menor HP%
  - Empate (escolhe primeiro)
  - Array vazio, null
  - Alvo único
  - HP=0

- `getCurrentActor()`: 5 testes
  - Índice válido
  - Índice 0
  - TurnOrder vazio
  - Enc null
  - Índice fora do range

- `hasAlivePlayers()`: 4 testes
  - Jogador vivo
  - Todos mortos
  - Participants vazio
  - PlayersData vazio

- `hasAliveEnemies()`: 3 testes
  - Inimigo vivo
  - Todos mortos
  - Enemies vazio

- `calculateTurnOrder()`: 6 testes
  - Ordenação por SPD
  - Tiebreak quando SPD igual
  - Ignora jogadores sem team
  - Ignora HP <= 0
  - Array vazio quando nenhum vivo
  - Identificação de side (player/enemy)

**Total Geral: 32 testes**

## 🚀 Como Rodar os Testes

### Pré-requisitos

- Node.js 18+ instalado
- npm 9+ instalado

### Instalação

```bash
# Instalar dependências (apenas vitest)
npm install
```

### Executar Testes

```bash
# Rodar todos os testes uma vez
npm test

# Rodar em modo watch (re-executa ao salvar)
npm run test:watch

# Rodar com cobertura de código
npm run test:coverage
```

### Saída Esperada

```
✓ tests/wildCore.test.js (17)
  ✓ checkHit - Verificação de Acerto (8)
  ✓ calcDamage - Cálculo de Dano (6)
  ✓ getClassAdvantageModifiers - Modificadores de Classe (5)
  ✓ getBuffModifiers - Modificadores de Buffs (5)
  ✓ checkCriticalRoll - Verificação de Crítico (3)
  ✓ applyDamageToHP - Aplicação de Dano ao HP (4)
  ✓ calculateDamage - Wrapper Completo (3)

✓ tests/groupCore.test.js (15)
  ✓ isAlive - Verificação de Vida (5)
  ✓ clamp - Limitação de Valores (4)
  ✓ chooseTargetByLowestHP - Seleção de Alvo (6)
  ✓ getCurrentActor - Ator Atual (5)
  ✓ hasAlivePlayers - Detecção de Jogadores Vivos (4)
  ✓ hasAliveEnemies - Detecção de Inimigos Vivos (3)
  ✓ calculateTurnOrder - Cálculo de Ordem de Turnos (6)

Test Files  2 passed (2)
     Tests  32 passed (32)
```

## 📁 Estrutura de Arquivos

```
monstrinhomon.html/
├── package.json              # Scripts npm e devDependency do vitest
├── vitest.config.js          # Configuração do Vitest
├── .gitignore               # Ignora node_modules/ e coverage/
├── tests/
│   ├── wildCore.test.js     # 17 testes para combate 1v1
│   └── groupCore.test.js    # 15 testes para combate em grupo
├── js/
│   └── combat/
│       ├── wildCore.js      # Funções puras de combate 1v1
│       └── groupCore.js     # Funções puras de combate em grupo
└── PR6_TESTS_README.md      # Este arquivo
```

## 🔧 Configuração do Vitest

O arquivo `vitest.config.js` está configurado para:

- **Globals**: Habilita `describe`, `it`, `expect` sem imports
- **Environment**: Node.js (sem DOM)
- **Include**: Apenas arquivos em `tests/**/*.test.js`

## ✅ Vantagens dos Testes

1. **Confiança**: Garante que mudanças futuras não quebrem mecânicas existentes
2. **Documentação**: Os testes servem como exemplos de uso das funções
3. **Refatoração Segura**: Permite refatorar com garantia de comportamento
4. **Debugging**: Facilita encontrar bugs isolados em funções específicas
5. **Regressão**: Evita que bugs corrigidos voltem a aparecer

## 🎮 Compatibilidade com GitHub Pages

**Importante**: Os testes são opcionais e executam apenas em ambiente de desenvolvimento local.

- ✅ O jogo continua funcionando em GitHub Pages sem Node.js
- ✅ Os arquivos de teste não afetam o deploy
- ✅ `node_modules/` está no `.gitignore` e não é commitado
- ✅ O HTML continua standalone sem dependências

## 📝 Regras dos Testes

### Funções Puras
Todos os testes cobrem **funções puras**:
- ✅ Entrada → Saída (determinístico)
- ✅ Sem side effects (DOM, storage, network)
- ✅ Sem mutação de estado
- ✅ Dependency injection (rollD20, GameState, etc.)

### Não Testado (Fora do Escopo)
- ❌ UI (wildUI.js, groupUI.js)
- ❌ Actions (wildActions.js, groupActions.js)
- ❌ Storage (localStorage)
- ❌ Gameplay flow completo (integração)

## 🔍 Casos de Teste Importantes

### Vantagem de Classe
```javascript
// Guerreiro > Ladino
// Bônus: +2 ATK, +10% dano
const mods = getClassAdvantageModifiers('Guerreiro', 'Ladino', classAdvantages);
expect(mods.atkBonus).toBe(2);
expect(mods.damageMult).toBe(1.10);
```

### Dano Mínimo
```javascript
// DEF muito alta sempre resulta em dano 1
const damage = calcDamage({ atk: 5, def: 100, power: 10 });
expect(damage).toBe(1);
```

### Tiebreak em Turnos
```javascript
// SPD iguais resolvidos por d20
const order = calculateTurnOrder(enc, players, mockRollD20);
expect(order[0]._tiebreak).toBeGreaterThan(0);
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'vitest'"
```bash
npm install
```

### Erro: "Cannot find module '../js/combat/wildCore.js'"
Certifique-se de estar na raiz do projeto ao executar `npm test`.

### Testes falhando
1. Verifique se o código em `wildCore.js` e `groupCore.js` está atualizado
2. Confirme que as funções estão exportadas corretamente (`export function ...`)
3. Revise a lógica esperada nos comentários dos testes

## 📈 Próximos Passos (Fora deste PR)

- [ ] Adicionar testes de integração (UI + Actions)
- [ ] Aumentar cobertura para 100% das funções puras
- [ ] Adicionar testes de performance
- [ ] CI/CD com GitHub Actions para rodar testes automaticamente
- [ ] Testes E2E com Playwright/Cypress

## 📄 Licença

Parte do projeto Monstrinhomon - Therapeutic Game MVP

---

**Versão**: 1.0.0  
**Data**: 2026-01-31  
**Autor**: PR6 - Vitest Setup
