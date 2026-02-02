# Status: Conflitos Pendentes

## Situação Atual
A branch `copilot/analyze-missing-functions` tem conflitos de merge com `main` que precisam ser resolvidos.

## Base do Problema
A branch foi criada a partir do commit `098fc6d` (antes do PR#56 ser mesclado em main).
Enquanto isso, o PR#56 (PR15A - Box System) foi mesclado em main no commit `04ce503`.

Agora existem conflitos entre as mudanças em ambas as branches.

## Arquivos com Conflitos

### 1. `css/main.css`
**Conflito:** Ambas as branches adicionam estilos CSS no final do arquivo
- **main (PR15A)**: Adiciona estilos do Box (PC) System (~90 linhas)
- **Esta branch**: Adiciona estilos do Inventory Display (~40 linhas)

**Resolução:** Manter AMBOS os conjuntos de estilos em sequência.

### 2. `index.html`
**Conflitos múltiplos:**

#### a) Botão da Box (linha ~29)
- **main**: Adiciona botão "📦 Box"  
- **Esta branch**: Não tem o botão
- **Resolução:** Adicionar o botão

#### b) Tab da Box (linha ~222)
- **main**: Adiciona toda a seção `<div id="tabBox">` (~35 linhas)
- **Esta branch**: Não tem a seção
- **Resolução:** Adicionar toda a seção

#### c) GameState.sharedBox e GameState.ui (linha ~737)
- **main**: Adiciona propriedades `sharedBox: []` e `ui: {...}`
- **Esta branch**: Não tem essas propriedades
- **Resolução:** Adicionar as propriedades

#### d) Funções de inicialização (linhas ~1785, ~1830, ~1844)
- **main**: Adiciona validação/normalização para sharedBox e ui
- **Esta branch**: Não tem essa validação
- **Resolução:** Adicionar toda a validação

#### e) Funções da Box (linhas ~5935-6278, ~6377-6380)
- **main**: Adiciona ~350 linhas de funções para Box System
- **Esta branch**: Não tem essas funções
- **Resolução:** Adicionar todas as funções

#### f) Event listeners e exports (linhas ~7357, ~7440, ~8013, ~8636)
- **main**: Adiciona event listeners e exports globais para funções da Box
- **Esta branch**: Não tem esses exports
- **Resolução:** Adicionar os exports

## Estratégia de Resolução

Como esta branch apenas adiciona funcionalidades (Therapist Mode e Inventory Display) e o PR15A também apenas adiciona funcionalidades (Box System), a resolução é simples:

**MANTER TUDO DE AMBOS OS LADOS**

1. **CSS**: Colocar estilos do Box primeiro, depois estilos do Inventory
2. **HTML**: Adicionar botão e tab da Box onde o main os coloca
3. **JavaScript**: Adicionar todas as propriedades, funções e exports do Box System

## Alterações Desta Branch (Preservar!)

### Therapist Mode Fix
```javascript
// Expor para o escopo global para handlers HTML inline
window.toggleTherapistMode = toggleTherapistMode;
```

### Player Initial Items & Money
```javascript
const player = {
    id: playerId,
    name: p.name,
    class: p.class,
    money: 100,                    // ← ADICIONAR
    afterlifeCurrency: 0,          // ← ADICIONAR
    team: [],
    box: [],
    inventory: {
        'CLASTERORB_COMUM': 5,     // ← CORRIGIR IDs
        'CLASTERORB_INCOMUM': 2,
        'CLASTERORB_RARA': 1,
        'IT_HEAL_01': 3
    }
};
```

### Inventory Display Function
```javascript
function renderPlayerInventorySimple(player) {
    // ... código completo da função ...
}
```

### Inventory Display UI
```html
<h4>📦 Inventory:</h4>
<div class="inventory-section">
    ${renderPlayerInventorySimple(player)}
</div>
```

## Próximo Passo

A resolução manual de todos esses conflitos requer:

1. Fazer rebase da branch em `04ce503` (main atual)
2. Para cada arquivo com conflito:
   - No CSS: Colocar ambos os blocos de estilos
   - No HTML: Adicionar todo código do Box System + manter mudanças desta branch
3. Continuar o rebase
4. Force push o resultado

**Importante**: Esta branch tem valor e deve ser preservada. Apenas precisa ser atualizada para incluir também as mudanças do PR15A (Box System).

---
**Status**: Aguardando resolução manual de conflitos
**Data**: 2026-02-02
