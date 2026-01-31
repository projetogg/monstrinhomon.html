# 💖 Sistema de Amizade - Monstrinhomon

## 📋 Visão Geral

O Sistema de Amizade foi implementado inspirado nos jogos Pokémon, criando uma conexão emocional entre jogadores e seus monstrinhos.

---

## 🎯 Como Funciona

### Mecânica Básica

Cada monstrinho possui um **nível de amizade** que varia de **0 a 100 pontos**.

- 🆕 Novos monstrinhos começam com **50 pontos** (neutro)
- ⬆️ Amizade aumenta com cuidados e vitórias
- ⬇️ Amizade diminui com derrotas e negligência

---

## 📊 Tabela de Níveis

| Nível | Pontos | Ícone | Nome | Bônus |
|-------|--------|-------|------|-------|
| **1** | 0-24 | 🖤 | Distante | Nenhum |
| **2** | 25-49 | 🤍 | Neutro | +5% XP |
| **3** | 50-74 | 💛 | Amigável | +5% XP, +5% crítico |
| **4** | 75-99 | 💚 | Muito Feliz | +10% XP, +5% crítico, +1 stats |
| **5** | 100 | ❤️ | Melhor Amigo | +10% XP, +5% crítico, +1 stats |

---

## 📈 Como Aumentar Amizade

### Ações Positivas

| Ação | Ganho | Quando Acontece |
|------|-------|-----------------|
| 🏆 Vencer batalha | +2 | Após vitória |
| 💚 Usar item de cura | +5 | Ao curar monstrinho |
| ⭐ Subir de nível | +3 | Ao ganhar level up |
| 👥 Ficar no time | +1 | Por sessão ativa |

### Mensagens Especiais

Quando seu monstrinho atinge marcos importantes:

- **50 pontos (💛):** "está se aproximando de você!"
- **75 pontos (💚):** "está muito feliz!"
- **100 pontos (❤️):** "atingiu amizade máxima!"

---

## 📉 Como Diminui Amizade

### Ações Negativas

| Ação | Perda | Quando Acontece |
|------|-------|-----------------|
| 💀 Perder batalha | -5 | Após derrota |
| 😵 Monstrinho desmaia | -3 | Quando HP = 0 |
| 📦 Ficar no box | -1 | Por sessão inativa |

---

## 🎁 Benefícios da Amizade

### Nível 2 (25-49 pontos) 🤍
- **+5% XP**: Monstrinhos aprendem mais rápido

### Nível 3 (50-74 pontos) 💛
- **+5% XP**: Continua aprendendo mais rápido
- **+5% Crítico**: Chance de acerto crítico automático

### Nível 4 (75-99 pontos) 💚
- **+10% XP**: Aprende ainda mais rápido
- **+5% Crítico**: Mantém chance crítica
- **+1 Stats**: Bônus em ATK, DEF e SPD durante batalha

### Nível 5 (100 pontos) ❤️
- **+10% XP**: Máximo de experiência
- **+5% Crítico**: Mantém chance crítica
- **+1 Stats**: Mantém bônus de stats
- **Efeito Especial**: Visual único (coração vermelho pulsante)

---

## 🎮 Como Ver a Amizade

### No Card do Monstrinho

Ao visualizar seus monstrinhos (aba Players), você verá:

```
⚔️ Pedrino
Comum
Lv 1
32/32 HP
0/100 XP
💛 50/100  ← Indicador de Amizade
▓▓▓▓▓░░░░░ ← Barra visual
```

### Tooltip Informativo

Ao passar o mouse/tocar no indicador:

```
Nível de Amizade: 3/5
Bônus XP: +5%
Chance Crítico: +5%
```

---

## 💡 Dicas para Terapeutas

### Como Usar no Contexto Terapêutico

1. **Ensinar Cuidado:**
   - "Veja como seu monstrinho fica feliz quando você cuida dele!"
   - Reforça comportamento de cuidado e atenção

2. **Lidar com Frustração:**
   - "Perdemos a batalha, mas podemos recuperar a amizade vencendo a próxima!"
   - Ensina resiliência e recuperação emocional

3. **Recompensa por Esforço:**
   - "Olha quantos pontos você ganhou! Seu monstrinho está mais feliz!"
   - Reforço positivo imediato

4. **Consequências Naturais:**
   - "Quando não cuidamos bem, a amizade diminui. O que podemos fazer?"
   - Ensina causa e efeito de forma segura

### Objetivos Terapêuticos Alcançados

✅ **Vínculo Emocional:** Criança se conecta com personagem
✅ **Responsabilidade:** Aprende a cuidar e manter felicidade
✅ **Causa e Efeito:** Entende que ações têm consequências
✅ **Gestão Emocional:** Lida com perda (derrota) e recuperação
✅ **Reforço Positivo:** Recebe feedback imediato por bom comportamento
✅ **Planejamento:** Pensa em manter monstrinhos no time ativo

---

## 🔧 Detalhes Técnicos

### Valores de Configuração

```javascript
friendshipConfig: {
  battleWin: 2,      // Ganho por vitória
  battleLoss: -5,    // Perda por derrota
  useHealItem: 5,    // Ganho por cura
  levelUp: 3,        // Ganho por level up
  faint: -3,         // Perda ao desmaiar
  stayInTeam: 1,     // Ganho por sessão ativa
  timeInBox: -1      // Perda por sessão inativa
}
```

### Cálculo de Bônus

```javascript
// Exemplo: Monstrinho com 80 pontos (Nível 4)
friendship = 80
level = getFriendshipLevel(80) // Retorna 4
bonuses = {
  xpMultiplier: 1.10,  // +10%
  critChance: 0.05,    // 5%
  statBonus: 1         // +1 em stats
}
```

### Aplicação de XP

```javascript
// XP base da batalha: 20
baseXP = 20

// Com amizade 80 (nível 4, +10%)
bonusMultiplier = 1.10
finalXP = Math.round(20 * 1.10) // = 22 XP
```

---

## 📝 Exemplos Práticos

### Cenário 1: Monstrinho Novo

```
Dia 1:
- Monstrinho capturado: 50 pontos 💛
- Vence 2 batalhas: 50 + 4 = 54 pontos 💛
- Usa item de cura: 54 + 5 = 59 pontos 💛

Status: Amigável, ganhando +5% XP e +5% crítico
```

### Cenário 2: Construindo Amizade

```
Após várias sessões:
- Pontos atuais: 68 💛
- Vence batalha: 68 + 2 = 70 💛
- Sobe de nível: 70 + 3 = 73 💛
- Vence outra: 73 + 2 = 75 💚 ← Subiu para Nível 4!

Mensagem: "💚 Pedrino está muito feliz!"
Novos bônus: +10% XP, +5% crítico, +1 stats
```

### Cenário 3: Recuperação de Derrota

```
Situação:
- Pontos atuais: 85 💚
- Perde batalha: 85 - 5 = 80 💚
- Monstrinho desmaia: 80 - 3 = 77 💚

Recuperação:
- Usa item de cura: 77 + 5 = 82 💚
- Vence 2 batalhas: 82 + 4 = 86 💚

Mensagem terapêutica: "Viu? Conseguimos recuperar! 💪"
```

---

## 🎯 Perguntas Frequentes

### 1. O que acontece se a amizade chegar a 0?

Nada de grave! O monstrinho fica no nível 1 (🖤) sem bônus, mas pode recuperar amizade normalmente.

### 2. Posso perder um monstrinho por baixa amizade?

**NÃO!** A amizade apenas afeta bônus, nunca remove o monstrinho.

### 3. Monstrinhos no box perdem amizade?

Sim, lentamente (-1 por sessão). Incentiva manter monstrinhos ativos.

### 4. O que significa "chance crítico +5%"?

5% de chance de acerto automático (como se rolasse 20 no dado).

### 5. O bônus de stats é permanente?

Não, apenas durante batalhas. Fora de batalha, stats voltam ao normal.

### 6. Posso ver a amizade de todos os monstrinhos?

Sim! Vá na aba "Players" e expanda o card de cada monstrinho.

---

## 📚 Recursos Adicionais

### Para Aprender Mais

- **POKEMON_ANALYSIS.md** - Análise completa do sistema
- **GAME_RULES.md** - Regras oficiais do jogo
- **RESUMO_MELHORIAS_POKEMON.md** - Resumo de todas as melhorias

### Suporte

Se tiver dúvidas ou problemas:
1. Verifique o console do navegador (F12)
2. Veja mensagens de log do sistema
3. Consulte a documentação técnica

---

## ✨ Conclusão

O Sistema de Amizade transforma a experiência do jogo, criando conexões emocionais significativas e incentivando comportamentos positivos de cuidado e responsabilidade.

**Aproveite essa nova mecânica e veja seus jogadores se conectarem ainda mais com seus monstrinhos!** 💖

---

**Versão:** 1.0  
**Data:** 2026-01-31  
**Status:** ✅ Implementado e Testado
