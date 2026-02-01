# PR8A - Extrair calculateBattleXP para xpCore (puro) + testes

## 🎯 Objetivo
Extrair o cálculo de XP de batalha para um módulo puro e testável, sem alterar o comportamento do jogo.

## 📁 Arquivos Criados/Modificados

### Criados
- `js/progression/xpCore.js` - Módulo puro com calculateBattleXP
- `js/progression/index.js` - Export do módulo Progression
- `tests/xpCore.test.js` - 25 testes cobrindo todos os casos de uso

### Modificados
- `index.html` - Adicionado import e wrapper para compatibilidade

## 🔧 Mudanças Técnicas

### xpCore.js (100% puro)
- **Função**: `calculateBattleXP(defeatedEnemy, encounterType, config)`
- **Sem dependências**: DOM, GameState global, storage
- **Inputs**: objeto enemy, tipo de encontro, config
- **Output**: número (XP calculado, mínimo 1)
- **Lógica**: idêntica à original (sem mudanças)

### index.html (wrapper)
- Mantém assinatura original: `calculateBattleXP(defeatedEnemy, encounterType)`
- Injeta `GameState.config` internamente
- Chama `Progression.Core.calculateBattleXP()`
- 100% compatível com todas as chamadas existentes

## ✅ Testes (25 novos)

### Cobertura
1. **Cálculo Base** (4 testes)
   - Níveis: 1, 5, 10, 50
   
2. **Multiplicadores de Raridade** (5 testes)
   - Comum, Incomum, Raro, Místico, Lendário
   - Raridade desconhecida (fallback)

3. **Boss Bonus** (4 testes)
   - Multiplicador 1.5x
   - Case-insensitive
   - Combinação raridade + boss
   - Não aplica para wild/group

4. **Fallbacks e Edge Cases** (9 testes)
   - Campo "raridade" vs "rarity"
   - Nível ausente/0/negativo (mínimo 1)
   - Config vazia/customizada
   - Valores muito baixos (mínimo 1 XP)
   - Enemy null/undefined

5. **Consistência** (2 testes)
   - Mesmos inputs → mesmo output
   - 100% determinístico (sem aleatoriedade)

6. **Níveis Altos** (2 testes)
   - Nível 100 comum
   - Nível 100 boss lendário

## 🔬 Smoke Test

### Pré-condições
- npm install
- npm test (67 testes passando)

### Procedimento
1. Abrir index.html no navegador
2. Criar nova sessão + jogador
3. Iniciar encontro wild
4. Vencer batalha
5. Observar XP recebido no log

### Validação
- ✅ XP calculado igual ao anterior
- ✅ Console limpo (sem erros)
- ✅ npm test passa (67 → 92 testes)

## 📊 Resultados dos Testes

```bash
npm test
```

```
 ✓ tests/wildCore.test.js  (34 tests)
 ✓ tests/xpCore.test.js    (25 tests) ← NOVOS
 ✓ tests/groupCore.test.js (33 tests)

 Test Files  3 passed (3)
      Tests  92 passed (92)
```

## ⚠️ Risco

**Muito Baixo**
- Função pura sem efeitos colaterais
- Wrapper mantém compatibilidade 100%
- Nenhuma chamada existente foi modificada
- Testes garantem comportamento idêntico

## 🔄 Compatibilidade

### Antes (index.html)
```javascript
function calculateBattleXP(defeatedEnemy, encounterType) {
    const base = GameState.config?.battleXpBase || 15;
    // ... lógica original
    return Math.max(1, xp);
}
```

### Depois (index.html - wrapper)
```javascript
function calculateBattleXP(defeatedEnemy, encounterType) {
    return Progression.Core.calculateBattleXP(
        defeatedEnemy, 
        encounterType, 
        GameState.config
    );
}
```

### Core Puro (xpCore.js)
```javascript
export function calculateBattleXP(defeatedEnemy, encounterType = null, config = {}) {
    // ... mesma lógica, sem dependências globais
}
```

## 📈 Benefícios

1. **Testabilidade**: 25 testes unitários cobrindo todos os casos
2. **Pureza**: Sem efeitos colaterais, fácil raciocinar
3. **Reutilização**: Pode ser usado em outros contextos
4. **Manutenibilidade**: Código isolado, fácil modificar
5. **Documentação**: Testes servem como especificação viva

## 🚀 Próximos Passos (PR8B)

Com calculateBattleXP agora testado e estável, podemos extrair com segurança:
- `giveXP()` - orquestração de XP
- `levelUpMonster()` - processamento de level up
- `handleVictoryRewards()` - distribuição de recompensas

---

**Status**: ✅ COMPLETO
**Testes**: ✅ 92/92 passando
**Comportamento**: ✅ Idêntico ao anterior
