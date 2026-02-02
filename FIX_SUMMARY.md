# Correção Implementada: Restrição de Classe em Batalha

## Problema Original

```
Jogador: Classe Animalista
Team:
  1. Monstrinho A (Animalista) - ATIVO ❤️
  2. Monstrinho B (Animalista) 
  3. Monstrinho C (Guerreiro) - capturado
  4. Monstrinho D (Mago) - capturado

Durante batalha:
  Monstrinho A desmaia → Modal de troca abre
  
  ❌ ANTES: Modal mostrava todos os 3 monstros vivos (B, C, D)
  ✅ DEPOIS: Modal mostra apenas o Monstrinho B (Animalista)
```

## Solução

### Mudança no Código

**Arquivo:** `index.html` (linha 3765)

```javascript
// ANTES (bugado):
player.team.forEach((mon, idx) => {
    if (_isAlive(mon) && idx !== player.activeIndex) {
        aliveMonsters.push({ monster: mon, index: idx });
    }
});

// DEPOIS (correto):
player.team.forEach((mon, idx) => {
    if (_isAlive(mon) && idx !== player.activeIndex && mon.class === player.class) {
        aliveMonsters.push({ monster: mon, index: idx });
    }
});
```

**Diferença:** Adicionado `&& mon.class === player.class` para filtrar apenas monstros da mesma classe.

### Mensagem de Erro Melhorada

```javascript
// ANTES:
alert('Sem monstrinhos vivos para substituir!');

// DEPOIS:
alert(`⚠️ Sem monstrinhos vivos da sua classe (${player.class}) para substituir!

REGRA: Em batalha, você só pode usar monstrinhos da classe ${player.class}.
Troque com outros jogadores para completar seu time!`);
```

## Regras do Jogo (GAME_RULES.md)

### ✅ Captura
- **TODOS** os jogadores podem capturar monstrinhos de **QUALQUER** classe
- Animalista pode capturar Guerreiro, Mago, etc.

### ⚠️ Batalha
- Em batalha, o jogador **SÓ PODE USAR** monstrinhos da **MESMA CLASSE**
- Animalista só pode usar Animalista
- Guerreiro só pode usar Guerreiro
- etc.

### 🎯 Objetivo
Incentivar **trocas entre jogadores** para completar times específicos por classe.

## Exemplos de Comportamento

### Exemplo 1: Animalista (Caso Principal)
```
Jogador: Animalista
Team:
  - Animalista A (ativo, HP: 10/50)
  - Animalista B (HP: 40/50) ✅ Disponível
  - Guerreiro C (HP: 50/50) ❌ Não disponível
  - Mago D (HP: 45/50) ❌ Não disponível

Modal mostra: Apenas Animalista B
```

### Exemplo 2: Guerreiro com Time Misto
```
Jogador: Guerreiro
Team:
  - Guerreiro A (ativo, desmaiado)
  - Guerreiro B (HP: 30/50) ✅ Disponível
  - Guerreiro C (HP: 20/50) ✅ Disponível
  - Bardo D (HP: 50/50) ❌ Não disponível

Modal mostra: Guerreiro B e Guerreiro C
```

### Exemplo 3: Sem Substitutos Válidos
```
Jogador: Mago
Team:
  - Mago A (ativo, desmaiado)
  - Guerreiro B (HP: 50/50) ❌ Classe diferente
  - Curandeiro C (HP: 45/50) ❌ Classe diferente

Modal NÃO abre
Alerta: "⚠️ Sem monstrinhos vivos da sua classe (Mago) para substituir!"
Jogador é eliminado da batalha
```

## Cobertura de Testes

### Testes Unitários (tests/classRestriction.test.js)
- ✅ Filtro básico por classe
- ✅ Exclusão do monstro ativo
- ✅ Exclusão de monstros desmaiados
- ✅ Lista vazia quando sem válidos
- ✅ Animalista com classes mistas
- ✅ Guerreiro com classes mistas
- ✅ Edge cases (null, arrays vazios)
- ✅ Todas as 8 classes

**Resultado:** 10/10 testes passando

### Testes de Regressão
- ✅ 389/389 testes existentes continuam passando
- ✅ Nenhuma funcionalidade quebrada

## Validação de Segurança

### CodeQL Scan
```
✅ 0 alertas de segurança
✅ 0 vulnerabilidades críticas
✅ 0 vulnerabilidades altas
✅ 0 vulnerabilidades médias
```

### Code Review
```
✅ Nenhum comentário de revisão
✅ Código segue padrões do projeto
✅ Mudanças mínimas e cirúrgicas
```

## Defesa em Profundidade

A validação ocorre em **duas camadas**:

1. **UI (Modal)** - `index.html:3765`
   - Filtra monstros na exibição
   - Previne seleção inválida

2. **Backend (Ataque)** - `groupActions.js:56-59`
   - Valida classe ao executar ataque
   - Defesa adicional caso modal seja bypassado

## Impacto

### ✅ O que Mudou
- Jogadores não podem mais usar monstros de classes diferentes em batalha
- Mensagem de erro mais clara e educativa
- Regra do jogo agora é respeitada corretamente

### ✅ O que NÃO Mudou
- Sistema de captura (ainda pode capturar qualquer classe)
- Batalhas selvagens (1v1, não afetadas)
- Mecânicas de dano e acerto
- Sistema de XP e progressão

## Classes do Jogo

1. **Guerreiro** (CLS_WAR)
2. **Mago** (CLS_MAG)
3. **Curandeiro** (CLS_HEA)
4. **Bárbaro** (CLS_BAR)
5. **Ladino** (CLS_ROG)
6. **Bardo** (CLS_BRD)
7. **Caçador** (CLS_HUN)
8. **Animalista** (CLS_ANM) ⭐ Classe especial

## Arquivos Modificados

```
index.html                           (+3 -2)   Filtro de classe
tests/classRestriction.test.js      (+215)    Testes unitários
MANUAL_TEST_CLASS_RESTRICTION.md    (+158)    Guia de teste
```

**Total:** 3 arquivos, 374 linhas adicionadas

---

**Issue:** Fix Animalista class restriction
**PR:** copilot/fix-animalista-class-issue
**Status:** ✅ Completo - Pronto para merge
**Data:** 2026-02-02
