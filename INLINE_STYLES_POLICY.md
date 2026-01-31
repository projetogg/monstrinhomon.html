# Inline Styles Policy - Monstrinhomon

## 📜 Regra de Ouro: Quando Usar Inline Styles

Este documento estabelece as **regras oficiais** para uso de inline styles no projeto Monstrinhomon após o Refactor PR1.

---

## ✅ PERMITIDO: Inline Styles Dinâmicos

Inline styles são **permitidos e encorajados** SOMENTE quando o valor é calculado em **runtime** (JavaScript):

### 1. Progress Bars / Percentuais
**Quando:** Valores que mudam baseado em estado do jogo (HP, XP, amizade)

```html
<!-- ✅ CORRETO -->
<div class="progress-fill hp" style="width: ${hpPercent}%"></div>
<div class="progress-fill xp" style="width: ${xpPct}%"></div>
<div class="friendship-fill" style="width: ${friendship}%"></div>
```

**Por quê:** O percentual muda constantemente durante o jogo.

---

### 2. Cores Condicionais
**Quando:** Cores determinadas por lógica de negócio

```html
<!-- ✅ CORRETO -->
<span style="color: ${hpPercent <= threshold ? '#2e7d32' : '#c62828'};">
  ${hpPercent}%
</span>

<div style="background: ${isVictory ? 'green' : 'red'};">
  Resultado
</div>
```

**Por quê:** A cor depende de condições runtime (HP baixo = vermelho, alto = verde).

---

### 3. Estados Condicionais (Active/Selected)
**Quando:** Styling aplicado baseado em estado ativo/selecionado

```html
<!-- ✅ CORRETO -->
<div style="border: ${isActive ? '3px solid blue' : '1px solid gray'};">
  Player
</div>

<div style="${isCurrent ? 'background: var(--success); color: white;' : ''}">
  Monster
</div>
```

**Por quê:** O estilo muda baseado em interação do usuário ou estado do jogo.

---

### 4. Posicionamento Calculado
**Quando:** Posições calculadas dinamicamente (floating text, tooltips)

```html
<!-- ✅ CORRETO -->
<div style="top: ${y}px; left: ${x}px; position: absolute;">
  Damage: -50
</div>
```

**Por quê:** A posição é calculada baseada em coordenadas do evento.

---

### 5. Display Toggle (Show/Hide Dinâmico)
**Quando:** Visibilidade controlada por JavaScript

```html
<!-- ✅ CORRETO -->
<div style="display: ${isOpen ? 'block' : 'none'};">
  Modal Content
</div>
```

**Por quê:** O estado aberto/fechado é gerenciado por JS.

---

## ❌ PROIBIDO: Inline Styles Estáticos

Inline styles são **proibidos** para valores estáticos que podem ser definidos em CSS:

### 1. Layout/Grid Estático
```html
<!-- ❌ ERRADO -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">

<!-- ✅ CORRETO -->
<div class="stats-grid-200">
```

**Migrar para:** Classe CSS `.stats-grid-200`

---

### 2. Tipografia Fixa
```html
<!-- ❌ ERRADO -->
<div style="font-size: 24px; font-weight: bold; color: #4CAF50;">
  ⚔️ 100
</div>

<!-- ✅ CORRETO -->
<div class="stat-value success">
  ⚔️ 100
</div>
```

**Migrar para:** Classes semânticas `.stat-value`, `.stat-value.success`

---

### 3. Espaçamento Fixo
```html
<!-- ❌ ERRADO -->
<div style="margin-top: 10px; padding: 15px;">

<!-- ✅ CORRETO -->
<div class="mt-10 p-15">
```

**Migrar para:** Classes utilitárias existentes

---

### 4. Cores da Paleta
```html
<!-- ❌ ERRADO -->
<div style="background: #2196F3;">

<!-- ✅ CORRETO -->
<div class="bg-info">
```

**Migrar para:** Classes de cor semânticas

---

## 📋 Inventário Atual (15 Inline Styles Dinâmicos)

### Progress Bars (9 instâncias)
| Localização | Propósito | Justificativa |
|-------------|-----------|---------------|
| Line 4521 | Group Battle XP | Runtime XP calculation |
| Line 4716 | Wild Battle XP | Runtime XP calculation |
| Line 4736 | Wild Battle HP | Runtime HP calculation |
| Line 6162 | Monstródex Seen % | Runtime progress + brand color |
| Line 6168 | Monstródex Captured % | Runtime progress + brand color |
| Line 6182 | Class Progress % | Runtime progress + brand color |
| Line 6339 | Player Monster HP | Runtime HP percentage |
| Line 6343 | Player Monster XP | Runtime XP percentage |
| Line 6350 | Friendship Level | Runtime friendship level |

### Conditional Colors (3 instâncias)
| Localização | Propósito | Justificativa |
|-------------|-----------|---------------|
| Line 4487 | Battle Team Color | Team-specific background (blue/red) |
| Line 4599 | Victory/Defeat Color | Win (green) vs Loss (red) |
| Line 4926 | Capture Threshold | Success (green) vs Failure (red) based on HP |

### Conditional Borders (2 instâncias)
| Localização | Propósito | Justificativa |
|-------------|-----------|---------------|
| Line 4516 | Active Player Border | Visual highlight for active player |
| Line 4541 | Active Enemy Border | Visual highlight for active enemy |

### Conditional States (1 instância)
| Localização | Propósito | Justificativa |
|-------------|-----------|---------------|
| Line 6385 | Current Monster Highlight | Background + text color for active monster |

---

## 🔍 Como Auditar

### Comando para Encontrar Inline Styles
```bash
grep -n 'style="' index.html
```

### Validação de Inline Styles
Para cada inline style encontrado, perguntar:

1. **Este valor vem de uma variável JavaScript?** (`${...}`)
   - ✅ SIM → Permitido
   - ❌ NÃO → Migrar para CSS

2. **Este valor muda durante a execução?**
   - ✅ SIM → Permitido
   - ❌ NÃO → Migrar para CSS

3. **Este valor depende de lógica condicional?**
   - ✅ SIM → Permitido
   - ❌ NÃO → Migrar para CSS

Se todas as respostas forem **NÃO**, o inline style deve ser migrado para uma classe CSS.

---

## 🎯 Processo de Review

### Para Revisor de PR
Ao revisar mudanças que introduzem inline styles:

1. ✅ **Aceitar** se:
   - Usa template literal (`${...}`)
   - Valor calculado em runtime
   - Documentado neste arquivo

2. ❌ **Rejeitar** se:
   - Valor hardcoded (ex: `"15px"`, `"#FF0000"`)
   - Pode ser classe CSS
   - Não documentado

3. 🔄 **Solicitar Mudança** se:
   - Pode usar CSS variable (`var(--color)`)
   - Pode ser classe utilitária
   - Comentário explicativo ausente

---

## 📚 Exemplos de Refactor

### Exemplo 1: Margin Fixo
```html
<!-- ANTES (❌) -->
<div style="margin-top: 10px;">

<!-- DEPOIS (✅) -->
<div class="mt-10">
```

### Exemplo 2: Grid Layout
```html
<!-- ANTES (❌) -->
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">

<!-- DEPOIS (✅) -->
<div class="stats-grid-200">
```

### Exemplo 3: Color Palette
```html
<!-- ANTES (❌) -->
<div style="color: #4CAF50; font-weight: bold;">

<!-- DEPOIS (✅) -->
<div class="color-success text-bold">
```

### Exemplo 4: Progress Bar (Dinâmico - OK)
```html
<!-- ANTES E DEPOIS (✅ - Mantém porque é dinâmico) -->
<div class="progress-fill hp" style="width: ${hpPercent}%">
  ${monster.hp} / ${monster.hpMax}
</div>
```

---

## 🚀 Próximos Passos

### PR2: Helper Functions para Inline Dinâmico
Criar helpers para padronizar inline styles dinâmicos:

```javascript
// Futura utility function
function applyProgressBar(element, percent, type = 'hp') {
  element.style.width = `${percent}%`;
  element.classList.add('progress-fill', type);
}

// Uso
applyProgressBar(hpBar, hpPercent, 'hp');
```

### PR3: CSS Custom Properties
Migrar cores inline para CSS variables:

```css
:root {
  --team-ally: #2196F3;
  --team-enemy: #f44336;
  --status-success: #4CAF50;
  --status-danger: #d63031;
}
```

```javascript
// Em vez de:
style="background: ${isAlly ? '#2196F3' : '#f44336'}"

// Usar:
style="background: var(${isAlly ? '--team-ally' : '--team-enemy'})"
```

---

## 📖 Referências

- [MDN: When to use inline styles](https://developer.mozilla.org/en-US/docs/Web/CSS/style)
- [CSS Guidelines: Specificity](https://cssguidelin.es/#specificity)
- [BEM Methodology](http://getbem.com/)

---

**Última atualização:** 2026-01-31  
**Versão:** 1.0.0  
**Autor:** Equipe Monstrinhomon
