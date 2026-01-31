# 🎮 Análise de Mecânicas Pokémon para Monstrinhomon

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Mecânicas Pokémon Analisadas](#mecânicas-pokémon-analisadas)
3. [Melhorias Recomendadas](#melhorias-recomendadas)
4. [Priorização de Implementação](#priorização-de-implementação)
5. [Detalhamento Técnico](#detalhamento-técnico)

---

## 🎯 Visão Geral

Este documento analisa mecânicas clássicas dos jogos Pokémon e identifica oportunidades de melhoria para o jogo Monstrinhomon, mantendo o foco terapêutico e a simplicidade do sistema atual.

### Estado Atual do Monstrinhomon
✅ **Já Implementado:**
- Sistema de classes com ciclo de vantagens
- Combate baseado em d20 físico
- Sistema de captura determinístico
- XP e progressão de níveis
- Habilidades por classe com tiers (I/II/III)
- Sistema de energia (ENE)
- Status effects básicos
- Sistema terapêutico com medalhas
- Inventário de itens

❌ **Não Implementado:**
- Naturezas (personality traits)
- Habilidades passivas
- Itens segurados em batalha
- Sistema de amizade
- Variantes visuais (shiny)
- Breeding/reprodução
- Move tutors
- Estatísticas de batalha

---

## 🔍 Mecânicas Pokémon Analisadas

### 1. **Naturezas (Natures)**
**O que é:** Trait de personalidade que modifica crescimento de stats (+10% em um stat, -10% em outro)

**Exemplos:**
- **Adamant**: +ATK, -ATK especial (inexistente em Monstrinhomon)
- **Jolly**: +SPD, -ATK especial
- **Modest**: +ATK especial, -ATK
- **Timid**: +SPD, -ATK

**Adaptação para Monstrinhomon:**
- 5 naturezas principais: Corajoso (+ATK, -DEF), Ágil (+SPD, -HP), Resiliente (+DEF, -ATK), Cauteloso (+DEF, -SPD), Equilibrado (neutro)
- Atribuído aleatoriamente na captura/criação
- Visual: emoji + nome da natureza no card do monstrinho
- Impacto terapêutico: crianças aprendem sobre personalidades diferentes

### 2. **Habilidades Passivas (Abilities)**
**O que é:** Efeito especial único que está sempre ativo

**Exemplos Pokémon:**
- Intimidate: reduz ATK do oponente ao entrar
- Levitate: imune a ataques terrestres
- Flame Body: queima contato físico
- Speed Boost: aumenta velocidade a cada turno

**Adaptação para Monstrinhomon:**
- 1-2 habilidades passivas por classe
- Ativação automática em condições específicas
- Exemplos:
  - **Guerreiro - Fortaleza**: +1 DEF a cada 2 turnos em batalha
  - **Mago - Sabedoria Arcana**: +1 ENE regenerado por turno
  - **Curandeiro - Aura Curativa**: aliados recuperam +5% HP por turno
  - **Bárbaro - Fúria Crescente**: +1 ATK quando HP < 50%
  - **Ladino - Esquiva**: 15% chance de evitar completamente um ataque
  - **Bardo - Inspiração**: +5% XP para todo time após vitória
  - **Caçador - Mira Precisa**: +1 em rolagens de ataque
  - **Animalista - Instinto Animal**: +2 SPD quando HP > 75%

### 3. **Itens Segurados (Held Items)**
**O que é:** Item equipado que dá bônus em batalha

**Exemplos Pokémon:**
- Leftovers: recupera HP gradualmente
- Choice Band: +50% ATK mas trava em uma habilidade
- Focus Sash: sobrevive com 1 HP se estava full HP

**Adaptação para Monstrinhomon:**
- Slot de "item equipado" por monstrinho
- 10-15 itens diferentes
- Exemplos:
  - **Amuleto da Sorte**: +5% taxa de captura quando este monstrinho luta
  - **Colar de Energia**: +2 ENE regenerado por turno
  - **Escudo de Madeira**: -10% dano recebido
  - **Adaga Rápida**: +1 SPD em combate
  - **Anel Vital**: +10% HP máximo
  - **Pedra do Foco**: habilidades custam -1 ENE (mínimo 1)

### 4. **Sistema de Amizade/Felicidade (Friendship)**
**O que é:** Stat oculto que aumenta com uso, vitórias, itens

**Benefícios Pokémon:**
- Alguns pokémon evoluem por amizade alta
- Aumenta taxa de crítico
- Pokémon pode resistir a KO por amor ao treinador

**Adaptação para Monstrinhomon:**
- **Coração de Amizade** (0-100 pontos)
- Aumenta com: vitórias (+2), uso de itens de cura (+5), permanecer no time (+1/batalha)
- Diminui com: derrota (-5), ficar muito tempo no box (-1/sessão)
- Benefícios:
  - Amizade 25+: +5% XP ganho
  - Amizade 50+: 5% chance de crítico automático (d20=20)
  - Amizade 75+: +1 em todas as stats em batalha
  - Amizade 100: Efeito visual especial (❤️) + 10% chance de sobreviver com 1 HP

### 5. **Shiny/Variantes Raras**
**O que é:** Versão alternativa extremamente rara (1/4096) com cor diferente

**Adaptação para Monstrinhomon:**
- **Monstrinhos Brilhantes** ✨
- Taxa: 1/100 em capturas selvagens (mais generoso que Pokémon)
- Diferença: emoji especial (⭐) + badge dourado no card
- Sem diferença em stats (puramente estético/colecionável)
- Crianças adoram raridades - incentiva engajamento

### 6. **Move Tutors / Aprendizado Especial**
**O que é:** NPCs que ensinam moves únicos por custo

**Adaptação para Monstrinhomon:**
- **Mestre de Habilidades** (recurso do terapeuta)
- Permite ensinar 1 habilidade de outra classe (cross-class)
- Custo: moedas afterlife (integração com sistema terapêutico)
- Limitação: 1 habilidade extra por monstrinho
- Exemplo: Guerreiro aprende "Cura I" de Curandeiro

### 7. **Breeding/Reprodução**
**O que é:** Sistema de criar novos pokémon combinando pais

**Adaptação para Monstrinhomon (SIMPLIFICADO):**
- **Fusão de Monstrinhos** (não reprodução literal - mais apropriado)
- Combinar 2 monstrinhos **da mesma família evolutiva** para criar versão melhorada
- Resultado: novo monstrinho nível 1 com:
  - Stats base +10%
  - Herda 1 habilidade extra de um dos pais
  - Marca especial "Fusionado" 🔀
- Custo: ambos os pais são consumidos no processo
- Limitação terapêutica: requer discussão e decisão em grupo

### 8. **Pokédex / Catálogo de Progresso**
**O que é:** Registro de todos pokémon vistos/capturados

**Adaptação para Monstrinhomon:**
- **Monstródex** 📖
- Interface visual mostrando:
  - Total de espécies: visto / capturado / total
  - Por classe: progresso de cada classe
  - Por raridade: quantos raros/lendários tem
- Silhuetas de monstrinhos não capturados
- Incentivo: medalhas por % de conclusão (25%, 50%, 75%, 100%)
- Aspecto terapêutico: senso de conquista e organização

### 9. **Contador de Estatísticas**
**O que é:** Registro de conquistas e marcos

**Adaptação para Monstrinhomon:**
- **Livro de Conquistas** 🏆
- Trackeia:
  - Total de batalhas vencidas/perdidas
  - Total de capturas bem-sucedidas/falhadas
  - Maior combo de vitórias
  - Monstrinho mais usado
  - Monstrinho que mais derrotou inimigos
  - Total de XP ganho
  - Total de moedas ganhas/gastas
- Visual: cards com números grandes e emojis
- Terapêutico: reconhecimento de progresso, memória episódica

### 10. **Indicador Visual de Vantagem de Classe**
**O que é:** Feedback visual de type effectiveness

**Adaptação para Monstrinhomon:**
- Durante seleção de ataque, mostrar:
  - ✅ "Super efetivo!" (verde) quando tem vantagem
  - ⚠️ "Pouco efetivo..." (vermelho) quando tem desvantagem
  - ➡️ "Efetividade normal" (cinza) quando neutro
- Tooltip explicando o ciclo de vantagens
- Educacional: crianças aprendem o sistema de classes visualmente

---

## 🎯 Melhorias Recomendadas

### Prioridade ALTA (Rápida implementação, alto impacto)

#### 1. Indicador Visual de Vantagem de Classe ⭐⭐⭐
**Esforço:** Baixo (1-2h)  
**Impacto:** Alto (melhora UX significativamente)  
**Implementação:**
```javascript
function getClassAdvantage(attackerClass, defenderClass) {
  const advantages = {
    'Guerreiro': 'Ladino',
    'Ladino': 'Mago',
    'Mago': 'Bárbaro',
    'Bárbaro': 'Caçador',
    'Caçador': 'Bardo',
    'Bardo': 'Curandeiro',
    'Curandeiro': 'Guerreiro'
  };
  
  if (advantages[attackerClass] === defenderClass) {
    return { multiplier: 1.1, bonus: 2, text: '✅ Super efetivo!', class: 'advantage' };
  } else if (advantages[defenderClass] === attackerClass) {
    return { multiplier: 0.9, bonus: -2, text: '⚠️ Pouco efetivo...', class: 'disadvantage' };
  }
  return { multiplier: 1.0, bonus: 0, text: '➡️ Efetividade normal', class: 'neutral' };
}
```

#### 2. Monstródex (Catálogo de Progresso) ⭐⭐⭐
**Esforço:** Médio (2-3h)  
**Impacto:** Alto (engajamento, senso de conquista)  
**Implementação:**
- Nova aba "📖 Monstródex"
- Track: `seen[]` e `captured[]` no GameState
- Visual: grid com cards de monstrinhos
- Progress bars por classe e raridade

#### 3. Livro de Conquistas (Estatísticas) ⭐⭐⭐
**Esforço:** Baixo (1-2h)  
**Impacto:** Médio-Alto (gamificação, reconhecimento)  
**Implementação:**
- Adicionar `stats{}` ao GameState
- Incrementar contadores em eventos-chave
- Nova seção na aba Report
- Visual: cards grandes com números e emojis

### Prioridade MÉDIA (Bom custo-benefício)

#### 4. Habilidades Passivas ⭐⭐
**Esforço:** Médio (3-4h)  
**Impacto:** Alto (profundidade estratégica)  
**Implementação:**
- Adicionar campo `passiveAbility` em catalog
- Sistema de triggers (onBattleStart, onTurnStart, onHit, etc)
- 1-2 habilidades por classe
- Feedback visual quando ativa

#### 5. Sistema de Amizade ⭐⭐
**Esforço:** Médio (2-3h)  
**Impacto:** Médio (conexão emocional, aspecto terapêutico)  
**Implementação:**
- Campo `friendship` (0-100) em monster instances
- Atualizar em eventos (vitória, cura, tempo no time)
- Visual: ícone de coração com níveis
- Bônus graduais em stats/XP

#### 6. Monstrinhos Shiny ⭐⭐
**Esforço:** Baixo (1h)  
**Impacto:** Médio (engajamento, colecionismo)  
**Implementação:**
- Campo `isShiny: boolean` em instances
- 1% chance na captura
- Badge visual ⭐ dourado
- Sem impacto em stats (puramente cosmético)

### Prioridade BAIXA (Maior esforço, pode esperar)

#### 7. Naturezas (Natures) ⭐
**Esforço:** Médio (2-3h)  
**Impacto:** Médio (personalização, profundidade)  
**Implementação:**
- 5 naturezas com modificadores de stats
- Atribuído aleatoriamente na captura
- Visual no card do monstrinho
- Aplicar na progressão de stats

#### 8. Itens Segurados ⭐
**Esforço:** Alto (4-5h)  
**Impacto:** Médio (estratégia, customização)  
**Implementação:**
- Slot `heldItem` em instances
- 10-15 itens com efeitos em batalha
- Sistema de equipar/desequipar
- Aplicar efeitos durante combate

#### 9. Move Tutor ⭐
**Esforço:** Médio-Alto (3-4h)  
**Impacto:** Baixo-Médio (customização avançada)  
**Implementação:**
- Interface para ensinar habilidade extra
- Custo em moedas afterlife
- Limitação: 1 habilidade extra por monstrinho
- Validação de compatibilidade

#### 10. Sistema de Fusão (simplificado de Breeding) ⭐
**Esforço:** Alto (5-6h)  
**Impacto:** Médio (endgame content, decisões em grupo)  
**Implementação:**
- Interface de fusão (seleciona 2 monstrinhos)
- Validação: mesma família evolutiva
- Criar novo com stats +10%
- Consumir os pais

---

## 📊 Priorização de Implementação

### Fase 1: Quick Wins (1-2 dias)
1. ✅ Indicador Visual de Vantagem de Classe
2. ✅ Monstródex (Catálogo)
3. ✅ Livro de Conquistas
4. ✅ Monstrinhos Shiny

**Justificativa:** Alto impacto, baixo esforço, melhoram UX imediatamente

### Fase 2: Profundidade Estratégica (3-5 dias)
5. ✅ Habilidades Passivas
6. ✅ Sistema de Amizade
7. ⏳ Naturezas

**Justificativa:** Adicionam camadas de estratégia sem complicar demais

### Fase 3: Customização Avançada (1-2 semanas)
8. ⏳ Itens Segurados
9. ⏳ Move Tutor
10. ⏳ Sistema de Fusão

**Justificativa:** Conteúdo endgame, requer mais planejamento

---

## 🔧 Detalhamento Técnico

### Estrutura de Dados Atualizada

```javascript
// Monster Instance (atualizado)
{
  id: string,
  ownerId: string,
  monsterId: string,
  name: string,
  class: string,
  rarity: string,
  level: number,
  xp: number,
  hp: number,
  hpMax: number,
  atk: number,
  def: number,
  spd: number,
  ene: number,
  eneMax: number,
  
  // NOVOS CAMPOS
  nature: string,              // Natureza (ex: 'Corajoso', 'Ágil', 'Equilibrado')
  passiveAbility: string,      // Habilidade passiva (ex: 'Fortaleza', 'Esquiva')
  heldItem: string | null,     // Item equipado (ex: 'Amuleto da Sorte')
  friendship: number,          // 0-100
  isShiny: boolean,            // true = variante rara
  isFused: boolean,            // true = resultado de fusão
  extraSkill: string | null,   // Habilidade extra de move tutor
  
  // Existente
  status: 'healthy' | 'fainted',
  activeEffects: [],
  buffs: []
}

// GameState (adições)
{
  // ... campos existentes
  
  // NOVOS CAMPOS
  monstrodex: {
    seen: [],      // IDs de monstrinhos vistos
    captured: []   // IDs de monstrinhos capturados
  },
  
  stats: {
    battlesWon: 0,
    battlesLost: 0,
    captureAttempts: 0,
    capturesSuccessful: 0,
    totalXpGained: 0,
    totalMoneyEarned: 0,
    totalMoneySpent: 0,
    highestWinStreak: 0,
    currentWinStreak: 0,
    mostUsedMonster: null,
    topKOMonster: null
  }
}
```

### Novos Arquivos de Dados CSV

#### NATURES.csv
```csv
nature_id,name,stat_boosted,stat_reduced,emoji
NAT_001,Corajoso,atk,def,⚔️
NAT_002,Ágil,spd,hp,💨
NAT_003,Resiliente,def,atk,🛡️
NAT_004,Cauteloso,def,spd,🐢
NAT_005,Equilibrado,,,⚖️
```

#### PASSIVE_ABILITIES.csv
```csv
ability_id,name,class,trigger,effect,description
PA_WAR_01,Fortaleza,Guerreiro,onTurnStart,+1 DEF a cada 2 turnos,Defesa aumenta gradualmente em batalha
PA_MAG_01,Sabedoria Arcana,Mago,onTurnStart,+1 ENE regenerado,Regenera energia mais rapidamente
PA_HEA_01,Aura Curativa,Curandeiro,onTurnStart,+5% HP para aliados,Cura aliados passivamente
PA_BAR_01,Fúria Crescente,Bárbaro,onHpBelow50,+1 ATK,Fica mais forte quando ferido
PA_ROG_01,Esquiva,Ladino,onDefend,15% evitar ataque,Chance de esquivar completamente
PA_BRD_01,Inspiração,Bardo,onBattleWin,+5% XP time,Time ganha XP extra
PA_HUN_01,Mira Precisa,Caçador,onAttack,+1 em rolagens,Ataques mais precisos
PA_ANM_01,Instinto Animal,Animalista,onHpAbove75,+2 SPD,Mais rápido quando saudável
```

#### HELD_ITEMS.csv
```csv
item_id,name,type,effect,description
HI_001,Amuleto da Sorte,Captura,+5% capture rate,Aumenta chance de captura
HI_002,Colar de Energia,ENE,+2 ENE regen/turn,Regenera energia extra
HI_003,Escudo de Madeira,DEF,-10% damage taken,Reduz dano recebido
HI_004,Adaga Rápida,SPD,+1 SPD,Aumenta velocidade
HI_005,Anel Vital,HP,+10% HP max,Aumenta HP máximo
HI_006,Pedra do Foco,ENE,-1 skill cost (min 1),Habilidades custam menos
```

### Funções JavaScript Principais

```javascript
// Natureza
function applyNatureModifiers(baseStats, nature) {
  const mods = NATURE_MODIFIERS[nature] || { boost: null, reduce: null };
  const stats = { ...baseStats };
  
  if (mods.boost) stats[mods.boost] *= 1.10;
  if (mods.reduce) stats[mods.reduce] *= 0.90;
  
  return stats;
}

// Habilidade Passiva
function triggerPassiveAbility(monster, trigger, context) {
  const ability = PASSIVE_ABILITIES[monster.passiveAbility];
  if (!ability || ability.trigger !== trigger) return;
  
  // Aplicar efeito baseado no tipo
  switch(ability.effect) {
    case 'buff_stat':
      applyBuff(monster, ability.stat, ability.amount, ability.duration);
      break;
    case 'regen_boost':
      monster.eneRegenBonus = (monster.eneRegenBonus || 0) + ability.amount;
      break;
    // ... outros efeitos
  }
  
  logMessage(`✨ ${ability.name} ativou!`);
}

// Amizade
function updateFriendship(monster, event) {
  const changes = {
    'battle_win': 2,
    'use_item': 5,
    'stay_in_team': 1,
    'battle_loss': -5,
    'time_in_box': -1
  };
  
  monster.friendship = Math.max(0, Math.min(100, 
    monster.friendship + (changes[event] || 0)
  ));
  
  // Desbloquear benefícios por tiers
  if (monster.friendship >= 100) {
    monster.friendshipBonuses = { xp: 1.10, stats: 1, reviveChance: 0.10 };
  } else if (monster.friendship >= 75) {
    monster.friendshipBonuses = { xp: 1.10, stats: 1 };
  } else if (monster.friendship >= 50) {
    monster.friendshipBonuses = { xp: 1.10, critChance: 0.05 };
  } else if (monster.friendship >= 25) {
    monster.friendshipBonuses = { xp: 1.05 };
  }
}

// Shiny
function generateShinyChance() {
  return Math.random() < 0.01; // 1% chance
}

// Monstródex
function updateMonstrodex(action, monsterId) {
  if (action === 'see' && !GameState.monstrodex.seen.includes(monsterId)) {
    GameState.monstrodex.seen.push(monsterId);
  }
  if (action === 'capture' && !GameState.monstrodex.captured.includes(monsterId)) {
    GameState.monstrodex.captured.push(monsterId);
  }
  saveGame();
}

// Estatísticas
function updateStats(stat, value = 1) {
  GameState.stats[stat] = (GameState.stats[stat] || 0) + value;
  
  // Atualizar streak
  if (stat === 'battlesWon') {
    GameState.stats.currentWinStreak++;
    if (GameState.stats.currentWinStreak > GameState.stats.highestWinStreak) {
      GameState.stats.highestWinStreak = GameState.stats.currentWinStreak;
    }
  } else if (stat === 'battlesLost') {
    GameState.stats.currentWinStreak = 0;
  }
  
  saveGame();
}
```

---

## 🎨 Mockups de Interface

### Indicador de Vantagem
```
┌─────────────────────────────────┐
│ ⚔️ Escolha seu Ataque           │
├─────────────────────────────────┤
│ [Ataque Básico]                 │
│ ✅ Super efetivo! (+2 ATK, +10% DMG)
│                                 │
│ [Golpe de Espada II]  (6 ENE)  │
│ ✅ Super efetivo! (+2 ATK, +10% DMG)
└─────────────────────────────────┘
```

### Card de Monstrinho (com novos campos)
```
┌──────────────────────────────────┐
│ ⭐ Pedrino                       │
│ Guerreiro • Lv 15 • Shiny ✨    │
├──────────────────────────────────┤
│ HP: ████████░░ 80/100           │
│ ❤️ Amizade: ████░ 75/100        │
│                                  │
│ 🎭 Natureza: Corajoso ⚔️         │
│ ✨ Habilidade: Fortaleza         │
│ 🎁 Item: Escudo de Madeira       │
├──────────────────────────────────┤
│ ATK: 45 • DEF: 38 • SPD: 28     │
└──────────────────────────────────┘
```

### Monstródex
```
┌──────────────────────────────────────┐
│ 📖 MONSTRÓDEX                        │
│ Capturados: 12/50 (24%)              │
│ Vistos: 28/50 (56%)                  │
├──────────────────────────────────────┤
│ Por Classe:                          │
│ ⚔️ Guerreiro:  ████░░░  4/6         │
│ 🔮 Mago:       ███░░░░  3/6         │
│ 💚 Curandeiro: ██░░░░░  2/6         │
│ ...                                  │
├──────────────────────────────────────┤
│ [MON_001] Cantapau       ✅         │
│ [MON_002] Pedrino ⭐     ✅         │
│ [MON_003] Faíscari       ✅         │
│ [MON_004] ????           👁️         │
└──────────────────────────────────────┘
```

### Livro de Conquistas
```
┌──────────────────────────────────────┐
│ 🏆 LIVRO DE CONQUISTAS               │
├──────────────────────────────────────┤
│ ⚔️ Batalhas                          │
│   Vitórias: 45  |  Derrotas: 12     │
│   Maior Sequência: 8 vitórias 🔥    │
│                                      │
│ 🎯 Capturas                          │
│   Bem-sucedidas: 28  |  Falhas: 15  │
│   Taxa de Sucesso: 65%               │
│                                      │
│ 📊 Estatísticas Gerais               │
│   Total XP Ganho: 15,420            │
│   Total Moedas: 2,450 💰            │
│   Monstrinho MVP: Pedrino ⭐        │
└──────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

### Fase 1: Quick Wins
- [ ] Criar constantes de vantagem de classe
- [ ] Implementar função `getClassAdvantage()`
- [ ] Adicionar indicador visual em UI de combate
- [ ] Criar estrutura `monstrodex` no GameState
- [ ] Implementar tracking de seen/captured
- [ ] Criar interface de Monstródex
- [ ] Adicionar campo `stats` ao GameState
- [ ] Implementar função `updateStats()`
- [ ] Criar seção de estatísticas na aba Report
- [ ] Adicionar campo `isShiny` em monster instances
- [ ] Implementar geração shiny (1% chance)
- [ ] Adicionar badge visual ⭐ para shiny

### Fase 2: Profundidade
- [ ] Criar PASSIVE_ABILITIES.csv
- [ ] Adicionar campo `passiveAbility` ao catalog
- [ ] Implementar sistema de triggers
- [ ] Integrar habilidades passivas em combate
- [ ] Adicionar campo `friendship` a instances
- [ ] Implementar função `updateFriendship()`
- [ ] Criar visual de amizade (coração)
- [ ] Aplicar bônus por tier de amizade
- [ ] Criar NATURES.csv
- [ ] Adicionar campo `nature` a instances
- [ ] Implementar atribuição aleatória
- [ ] Aplicar modificadores de stats

### Fase 3: Avançado
- [ ] Criar HELD_ITEMS.csv
- [ ] Adicionar slot `heldItem` a instances
- [ ] Implementar sistema de equipar/desequipar
- [ ] Integrar efeitos em combate
- [ ] Criar interface de Move Tutor
- [ ] Implementar lógica de ensinar habilidade extra
- [ ] Validar compatibilidade de classes
- [ ] Integrar custo em afterlife currency
- [ ] Criar interface de Fusão
- [ ] Implementar validação (mesma família)
- [ ] Criar lógica de fusão (stats +10%)
- [ ] Adicionar marca visual de fusionado 🔀

---

## 📚 Referências

### Pesquisa Realizada
- [The Best Pokemon Mechanics - Gamepur](https://www.gamepur.com/features/best-pokemon-mechanics)
- [Best Generational Mechanics Across The Pokemon Series - TheGamer](https://www.thegamer.com/best-generational-features-across-the-pokemon-games/)
- [What Did Each Pokémon Game Do Best? - CBR](https://www.cbr.com/every-pokemon-game-best-feature/)
- [Generation 8 Breeding Guide - Smogon University](https://www.smogon.com/ingame/guides/gen8_breeding)
- [Pokémon Natures Guide - InfoPoke](https://infopoke.net/guides/natures)

### Documentos do Projeto
- [GAME_RULES.md](./GAME_RULES.md) - Regras oficiais
- [README.md](./README.md) - Documentação principal
- [CLASSES.csv](./CLASSES.csv) - Dados das classes
- [MONSTROS.csv](./MONSTROS.csv) - Catálogo de monstrinhos
- [HABILIDADES.csv](./HABILIDADES.csv) - Skills disponíveis

---

## 🎯 Conclusão

Este documento apresenta **10 melhorias inspiradas em Pokémon**, priorizadas por:
1. **Impacto no engajamento** (diversão, motivação)
2. **Esforço de implementação** (tempo, complexidade)
3. **Compatibilidade com objetivo terapêutico** (aspectos educacionais/emocionais)

**Recomendação:** Começar com **Fase 1** (Quick Wins) para obter feedback rápido, depois avaliar interesse em **Fase 2** (profundidade estratégica) baseado no uso terapêutico real.

**Data:** 2026-01-30  
**Versão:** 1.0  
**Autor:** Análise baseada em pesquisa de mecânicas Pokémon
