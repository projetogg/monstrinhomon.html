# Monstrinhomon - Regras Oficiais do Jogo v1.0

Este documento define as regras oficiais e definitivas do jogo Monstrinhomon. Todas as implementações devem seguir estas regras rigorosamente.

---

## 1. CLASSES

O jogo possui **8 classes** de personagens e monstrinhos:

1. **Guerreiro** (CLS_WAR) - Resistente, combate corpo a corpo
2. **Mago** (CLS_MAG) - Dano mágico e controle
3. **Curandeiro** (CLS_HEA) - Suporte e cura
4. **Bárbaro** (CLS_BAR) - Alta força, risco/recompensa
5. **Ladino** (CLS_ROG) - Velocidade, crítico, furtividade
6. **Bardo** (CLS_BRD) - Alcance longo, buffs/debuffs
7. **Caçador** (CLS_HUN) - Alcance longo, dano consistente
8. **Animalista** (CLS_ANM) - Curto alcance, versátil

### Ciclo de Vantagens de Classe

```
Guerreiro > Ladino > Mago > Bárbaro > Caçador > Bardo > Curandeiro > Guerreiro
Animalista: neutro (sem vantagem ou desvantagem específica contra outras classes)
```

**Quando tem vantagem:**
- +2 bônus de ATK no cálculo de acerto
- +10% multiplicador de dano

**Quando tem desvantagem:**
- -2 penalidade de ATK no cálculo de acerto
- -10% multiplicador de dano

---

## 2. REGRA DE BATALHA POR CLASSE (Incentivo a Trocas)

### 2.1 Captura
✅ **TODOS os jogadores podem CAPTURAR monstrinhos de QUALQUER classe**

### 2.2 Uso em Batalha
⚠️ **Em BATALHA, o jogador SÓ PODE USAR monstrinhos da MESMA classe do jogador**

**Implementação:**
- Ao escolher/trocar monstrinho ativo, filtrar apenas monstros com `monster.class == player.class`
- Se o jogador não tiver nenhum monstrinho da sua classe disponível:
  - Mostrar aviso: "Você precisa de monstrinhos da classe [classe_do_jogador]. Troque com outros jogadores!"
  - Impedir iniciar batalha

**Objetivo:** Incentivar trocas entre jogadores para completar times específicos por classe.

---

## 3. SISTEMA DE COMBATE

### 3.1 Acerto
```javascript
d20 + ATK + class_advantage_bonus >= DEF
```

- **d20 = 20**: SEMPRE acerta + bônus CRIT (ver seção 3.4)
- **d20 = 1**: SEMPRE erra
- **class_advantage_bonus**: +2 se vantagem, -2 se desvantagem, 0 se neutro

### 3.2 Cálculo de Dano (Regra Oficial v1)

Após o acerto (hit), o dano usa a seguinte fórmula:

**Fórmula:**
```javascript
ratio = ATK / (ATK + DEF)
danoBase = Math.floor(POWER * ratio)
danoFinal = Math.max(1, danoBase)
```

**Onde POWER vem:**
- **Ataque Básico**: POWER_BASIC (por classe: 10-14)
- **Habilidade**: POWER_SKILL (definido pela habilidade I/II/III: 16-38)

**Modificadores:**
- **Vantagem de classe**: +10% dano (aplicar no danoBase)
- **Desvantagem de classe**: -10% dano (aplicar no danoBase)
- **CRIT 20** (bônus "Poder Duplo"): dobra o POWER antes do cálculo

**Regras adicionais:**
- Dano mínimo sempre 1
- O ratio limita o dano mesmo em níveis altos

### 3.3 Turnos
1. Jogador escolhe ação (Atacar, Habilidade, Item, Fugir)
2. Se atacar: jogador rola d20 físico e informa
3. Sistema calcula acerto e dano
4. Inimigo contra-ataca (se vivo e não atordoado)
5. Verifica vitória/derrota
6. Repete

### 3.4 CRIT 20 (Extraordinário)

Quando **d20 = 20**:
1. **SEMPRE acerta** (ignora DEF)
2. **Aplica 1 bônus aleatório:**
   - **(A) Poder Dobrado**: POWER x2 neste ataque (antes do cálculo de dano)
   - **(B) Item Pequeno**: Ganha 1 item aleatório (Petisco de Cura ou similar)
   - **(C) Dinheiro Extra**: Ganha 20-50 moedas extras

**Feedback visual:**
```
⭐ CRÍTICO 20! ⭐
💥 Poder dobrado! / 🎁 Ganhou item! / 💰 Ganhou 35 moedas!
```

---

## 4. SISTEMA DE ENERGIA (ENE) E HABILIDADES

### 4.1 Sistema de Energia
- Cada monstrinho tem **ENE_MAX** e **ENE_atual**
- **ENE_MAX** = 10 + (level - 1) * 2 (crescimento por nível)
- Começa com ENE cheio no início da batalha

### 4.2 Tipos de Ação
1. **Ataque Básico**: Não gasta ENE (POWER 10-14 por classe)
2. **Habilidade**: Gasta ENE (quantidade definida na habilidade)
3. **Item**: Não gasta ENE

### 4.3 Regeneração de ENE
**Por turno**, no início do turno do atacante:
```javascript
eneGain = Math.max(ene_regen_min, Math.ceil(eneMax * ene_regen_pct))
ene = Math.min(eneMax, ene + eneGain)
```

**Valores de regen por classe:**
- **Mago/Curandeiro**: 18% (min 3) - alta regeneração
- **Bardo/Caçador/Ladino**: 14% (min 2) - regeneração média
- **Animalista/Bárbaro**: 12% (min 2) - regeneração média-baixa
- **Guerreiro**: 10% (min 1) - regeneração baixa

### 4.4 Habilidades por Classe e Estágio

Habilidades são **automaticamente upgradadas** baseado no estágio (S0-S3):
- **S0** (Nível 1-9): Habilidades Tier I
- **S1** (Nível 10-24): Habilidades Tier II
- **S2** (Nível 25-44): Habilidades Tier II
- **S3** (Nível 45+): Habilidades Tier III

**Classes e suas habilidades:**

#### Guerreiro
- **Golpe de Espada I/II/III** (DAMAGE): 4/6/8 ENE, Power 18/24/30
- **Escudo I/II/III** (BUFF DEF self): 4/6/8 ENE, +2/+3/+4 DEF por 2-3 turnos
- **Provocar I/II** (TAUNT): 4/6 ENE (disponível a partir de S1)

#### Curandeiro
- **Cura I/II/III** (HEAL): 5/7/10 ENE, 15/25/40 HP
- **Bênção I/II/III** (BUFF): 4/6/8 ENE, +2/+3/+4 ATK ou DEF

#### Mago
- **Magia Elemental I/II/III** (DAMAGE): 4/6/8 ENE, Power 20/26/32
- **Explosão Elemental I/II/III** (DAMAGE alto): 6/8/12 ENE, Power 24/32/38
- **Nota**: Mago não possui ROOT neste MVP

#### Bárbaro
- **Fúria I/II/III** (BUFF self +ATK, -DEF): 4/6/8 ENE, +3/+4/+6 ATK, -1/-2/-2 DEF
- **Golpe Brutal I/II/III** (DAMAGE): 6/8/12 ENE, Power 24/32/38

#### Ladino
- **Ataque Preciso I/II/III** (DAMAGE): 4/6/8 ENE, Power 19/24/30
- **Enfraquecer I/II** (DEBUFF enemy): 4/6 ENE, -2/-3 ATK por 1-2 turnos

#### Bardo
- **Canção de Coragem I/II/III** (BUFF ATK): 4/6/8 ENE, +2/+3/+4 ATK
- **Canção Calmante I/II/III** (HEAL/BUFF): 5/6/8 ENE, 12 HP ou +2/+3 DEF

#### Caçador
- **Flecha Poderosa I/II/III** (DAMAGE): 4/6/8 ENE, Power 19/24/30
- **Armadilha I/II** (DEBUFF enemy SPD): 4/6 ENE, -2/-3 SPD por 1-2 turnos

#### Animalista
- **Investida Bestial I/II/III** (DAMAGE): 4/6/8 ENE, Power 19/24/30
- **Instinto Selvagem I/II/III** (BUFF self): 4/6/8 ENE, +2/+2/+3 DEF ou SPD

### 4.5 Uso de Habilidades
- Interface mostra 2-3 botões de habilidade por turno
- Botões desabilitados se ENE < custo
- Ao usar: consome ENE, aplica efeito, loga no combate

---

## 5. SISTEMA DE CAPTURA (Sem Dado)

### 4.1 Quando Pode Capturar
- ✅ **Somente em encontros INDIVIDUAIS** (Wild Monster)
- ❌ Não pode capturar em batalhas de grupo, treinador ou boss

### 4.2 Pré-requisitos
1. **HP do alvo > 0** (não pode capturar desmaiado)
2. **Jogador tem item de captura** no inventário (ex: "Orbe de Captura")

### 4.3 Mecânica de Captura

**Tentativa de captura:**

```javascript
1. Sempre CONSOME 1 item de captura (mesmo se falhar)
2. Calcula sucesso:
   - Base: HP_percent <= capture_threshold_by_rarity
   - Bônus: Se HP_percent <= 25%, adiciona +0.10 ao threshold
   - Item: Adiciona capture_threshold_bonus do item usado
3. Se SUCESSO:
   - Monstrinho é capturado
   - Vai para Team (se tem espaço) ou Box (se team cheio)
   - Encontro termina
4. Se FALHA:
   - Monstrinho selvagem realiza 1 ataque básico IMEDIATO
   - Combate continua normalmente
```

**Thresholds por Raridade (base):**
- Comum: 25%
- Incomum: 20%
- Raro: 15%
- Místico: 10%
- Lendário: 5%

**Bônus de ClasterOrb:**
- Comum: +0%
- Incomum: +10%
- Rara: +20%

**Exemplo:**
```
Monstrinho Raro com 20% HP, usando Orbe Reforçado (+10% bonus)
HP 20% <= 25% → bônus de +10%
Threshold final = 15% + 10% + 10% = 35%
20% <= 35% → SUCESSO!
```

### 4.4 Interface
```
HP: 12/50 (24%)
✅ HP baixo! Bônus de captura ativo!

[🎯 Capturar] (Orbe de Captura: 3)
```

---

## 5. ENERGIA (ENE) E HABILIDADES

### 5.1 Sistema de Energia
- Cada monstrinho tem **ENE_MAX** e **ENE_atual**
- **ENE_MAX** é calculado pela fórmula de classe
- Começa com ENE_MAX no início da batalha

### 5.2 Tipos de Ação
1. **Ataque Simples**: Não gasta ENE
2. **Habilidade**: Gasta ENE (quantidade definida na habilidade)
3. **Item**: Não gasta ENE

### 5.3 Regeneração de ENE
**Por turno**, o monstrinho regenera:
```javascript
regen = Math.max(
  classe.ene_regen_min,
  Math.floor(ENE_MAX * classe.ene_regen_pct)
)
```

**Valores por classe** (conforme CLASSES.csv):
- Mago: ene_regen_pct alto (regenera mais)
- Guerreiro: ene_regen_min alto (regenera constante)
- etc.

### 5.4 Habilidades
- Cada habilidade tem `ene_cost`
- Só pode usar se `ENE_atual >= ene_cost`
- Após uso: `ENE_atual -= ene_cost`
- Efeitos: dano aumentado, cura, buff, debuff, status, etc.

---

## 6. STATUS EFFECTS

### 6.1 Status Disponíveis
1. **STUN (Atordoado)**: Perde o próximo turno
2. **ROOT (Enraizado)**: Não pode fugir
3. **WEAKEN (Enfraquecido)**: -30% ATK temporário
4. **POISON (Envenenado)**: Perde 10% HP por turno
5. **REGEN (Regeneração)**: Ganha 5% HP por turno

### 6.2 Duração
- Status duram X turnos (definido na habilidade)
- Checado no INÍCIO de cada turno do afetado
- Se duração = 0, status é removido

### 6.3 Imunidades
- Boss: imune a STUN
- Alguns monstrinhos raros: imune a status específicos (definido em MONSTROS.csv)

---

## 7. PROGRESSÃO

### 7.1 XP e Level Up
**XP para próximo nível:**
```javascript
xp_needed = Math.round(40 + 6*L + 0.6*(L*L))
```

**Ao subir de nível:**
```javascript
hpMax_new = Math.floor(hpMax_old * 1.04 + 2)
hp_atual = Math.floor(hp_atual * (hpMax_new / hpMax_old))
atk = recalcular baseado em level e raridade
def = recalcular baseado em level e raridade
poder = Math.floor(atk * 0.5)
ene_max = recalcular baseado em level e classe
```

### 7.2 XP de Batalha
```javascript
xp_earned = (battleXpBase + level_enemy * 2) * rarity_multiplier
```

**Multiplicadores de raridade:**
- Comum: 1.00x
- Incomum: 1.05x
- Raro: 1.10x
- Místico: 1.15x
- Lendário: 1.25x

---

## 8. TIPOS DE ENCONTRO

### 8.1 Encontro Individual (Wild Monster)
- **Participantes**: 1 jogador selecionado
- **Objetivo**: Capturar ou derrotar
- **Captura**: Permitida
- **Recompensa**: XP + possível captura

### 8.2 Batalha em Grupo (Trainer)
- **Participantes**: Todos jogadores da party
- **Objetivo**: Derrotar
- **Captura**: NÃO permitida
- **Recompensa**: XP + Dinheiro + Itens

### 8.3 Batalha Boss
- **Participantes**: Todos jogadores da party
- **Objetivo**: Derrotar
- **Captura**: NÃO permitida (exceto bosses especiais de história)
- **Recompensa**: XP + Dinheiro + Itens raros

---

## 9. INVENTÁRIO

### 9.1 Itens por Tipo
- **Captura**: Orbe de Captura, Orbe Reforçado
- **Cura**: Petisco de Cura (25% HP), Poção Grande (50% HP)
- **Reviver**: Pena Reviva (revive com 40% HP)
- **Energia**: Cristal de Energia (restaura 50% ENE)
- **Tático**: Escudo (reduz dano próximo turno), Re-roll (permite rolar d20 novamente)

### 9.2 Stack
- Itens empilham até `stack_max` (definido em ITENS.csv)
- Exemplo: Orbe de Captura stack_max = 99

### 9.3 Uso
- **Em batalha**: somente itens de cura, energia e táticos
- **Fora de batalha**: todos exceto táticos

---

## 10. ECONOMIA

### 10.1 Moedas
- **Moeda normal**: Ganha em batalhas, vende itens
- **Moeda pós-vida (Afterlife)**: Ganha com medalhas terapêuticas

### 10.2 Compra/Venda
- Loja (a implementar): compra itens com preço fixo
- Venda: 50% do preço de compra

---

## 11. SISTEMA TERAPÊUTICO

### 11.1 Objetivos
- Terapeuta define objetivos com peso (1-3)
- Exemplos: "Esperou a vez", "Usou tom calmo", "Ajudou colega"

### 11.2 Medalhas
- **Bronze**: 5 pontos → 1 moeda afterlife
- **Prata**: 12 pontos → 3 moedas afterlife
- **Ouro**: 25 pontos → 7 moedas afterlife

### 11.3 Recompensas Adicionais
- Medalhas também concedem XP bônus para monstrinhos ativos

---

## REGRAS TÉCNICAS DE IMPLEMENTAÇÃO

### Estado do Jogo (GameState)
```javascript
{
  players: [],
  monsters: [],
  sessions: [],
  currentSession: null,
  currentEncounter: null,
  objectives: [],
  config: { ... }
}
```

### Player Object
```javascript
{
  id: string,
  name: string,
  class: string, // Uma das 8 classes
  money: number,
  afterlifeCurrency: number,
  team: [], // Array de monster instances (max 6)
  box: [], // Array de monster instances
  inventory: {} // { item_id: quantity }
}
```

### Monster Instance
```javascript
{
  id: string,
  ownerId: string,
  monsterId: string, // Referência ao MONSTROS.csv
  name: string,
  class: string,
  rarity: string,
  level: number,
  xp: number,
  hp: number,
  hpMax: number,
  atk: number,
  def: number,
  poder: number,
  ene: number, // Energia atual
  eneMax: number,
  status: 'healthy' | 'fainted',
  activeEffects: [] // Array de status effects ativos
}
```

---

## CHANGELOG

### v1.0 (2026-01-27)
- Definição inicial das regras oficiais
- 8 classes incluindo Animalista
- Regra de batalha por classe (captura any, uso self-only)
- Sistema de captura sem dado com consumo de item
- CRIT 20 com bônus aleatórios
- Sistema ENE e habilidades
- Status effects

---

**Última atualização**: 2026-01-27
**Versão**: 1.0.0
