# DOCUMENTO MESTRE — Monstrinhomon
> **Versão:** 1.0 · **Atualizado:** 2026-04-03
> Fonte única de verdade para regras, mecânicas e arquitetura do jogo.

---

## SUMÁRIO

1. [Visão Geral](#1-visão-geral)
2. [Glossário](#2-glossário)
3. [Sistema de Classes](#3-sistema-de-classes)
4. [Sistema de Combate](#4-sistema-de-combate)
5. [Sistema de Captura](#5-sistema-de-captura)
6. [Passivas de Espécie (Canon Layer)](#6-passivas-de-espécie-canon-layer)
7. [Progressão, XP e Level Up](#7-progressão-xp-e-level-up)
8. [Sistema de Terapia e Medalhas](#8-sistema-de-terapia-e-medalhas)
9. [Arquitetura Técnica](#9-arquitetura-técnica)

---

## 1. Visão Geral

**Monstrinhomon** é um RPG de monstros capturáveis, com batalhas em turnos, desenvolvido para uso em contexto terapêutico com crianças. O design privilegia:

- **Mecânica de troca social** — captura livre entre classes, uso em batalha restrito à própria classe, incentivando crianças a colaborarem e trocarem monstrinhos.
- **Participação física** — o d20 é um dado físico que a criança rola, mantendo engajamento fora da tela.
- **Controle do terapeuta** — sistema de objetivos terapêuticos que converte comportamentos positivos em recompensas de jogo.

### 1.1 Fluxo Mínimo Obrigatório

```
Iniciar sessão → Criar jogadores → Gerar encontro → Primeiro combate → Recompensa + Captura
```

Nenhuma mudança pode quebrar esse fluxo sem aprovação explícita.

### 1.2 Tipos de Encontro

| Tipo | Participantes | Captura? | Recompensa |
|------|--------------|----------|-----------|
| **Individual (Wild)** | 1 jogador | ✅ Sim | XP + possível captura |
| **Em Grupo (Trainer)** | Party inteira | ❌ Não | XP + Dinheiro + Itens |
| **Boss** | Party inteira | ❌ Não* | XP + Dinheiro + Itens raros |

*Exceção: bosses especiais de história podem ser capturáveis.

---

## 2. Glossário

| Sigla / Termo | Significado |
|--------------|-------------|
| **MI** | Monster Instance — instância viva de um Monstrinho pertencente a um jogador |
| **HP** | Health Points — pontos de vida (atual / máximo) |
| **ATK** | Attack — poder ofensivo base |
| **DEF** | Defense — resistência defensiva |
| **ENE** | Energia — combustível para habilidades especiais |
| **AGI** | Agilidade — determina ordem de turno |
| **PWR** | Power — potência base da ação usada |
| **XP** | Experience Points — pontos de experiência |
| **LVL** | Level — nível de progressão (1–100) |
| **d20** | Dado de 20 faces físico, rolado pela criança |
| **RC** | Resultado de Confronto — saldo do d20 bilateral |
| **DC** | Difficulty Class — dificuldade de ação (fuga, etc.) |
| **PM** | Pontos de Medalha — moeda terapêutica interna |
| **MI** | Monster Instance (ver acima) |
| **Afterlife** | Moeda pós-vida, concedida por medalhas terapêuticas |
| **S0/S1/S2/S3** | Estágio evolutivo do Monstrinho (Lv 1-9 / 10-24 / 25-44 / 45+) |
| **CLS_WAR** | ID canônico da classe Guerreiro |
| **source of truth** | Arquivo/módulo considerado autoritativo para uma regra |

---

## 3. Sistema de Classes

### 3.1 As 8 Classes

| Classe | ID canônico | ID PT-BR | Perfil |
|--------|-------------|---------|--------|
| Guerreiro | `warrior` / `CLS_WAR` | `Guerreiro` | Tank, resistente, corpo a corpo |
| Mago | `mage` / `CLS_MAG` | `Mago` | Dano mágico e controle |
| Curandeiro | `healer` / `CLS_HEA` | `Curandeiro` | Suporte e cura |
| Bárbaro | `barbarian` / `CLS_BAR` | `Bárbaro` | Alta força, risco/recompensa |
| Ladino | `rogue` / `CLS_ROG` | `Ladino` | Velocidade, crítico, furtividade |
| Bardo | `bard` / `CLS_BRD` | `Bardo` | Alcance longo, buffs/debuffs |
| Caçador | `hunter` / `CLS_HUN` | `Caçador` | Alcance longo, dano consistente |
| Animalista | `animalist` / `CLS_ANM` | `Animalista` | Curto alcance, versátil |

> **Regra de conversão:** o motor usa nomes PT-BR. IDs canônicos em inglês são usados apenas dentro de `js/canon/`. Nunca misturar nos dois sentidos sem converter via `classIdFromPtbr()` / `classPtbrFromId()`.

### 3.2 Ciclo de Vantagens (Canônico — source of truth: `design/canon/class_matchups.json`)

```
Guerreiro → forte contra Ladino    → fraco contra Mago
Mago      → forte contra Guerreiro → fraco contra Caçador
Ladino    → forte contra Caçador   → fraco contra Guerreiro
Caçador   → forte contra Mago      → fraco contra Ladino
Bárbaro   → forte contra Curandeiro → fraco contra Guerreiro
Curandeiro→ forte contra Bárbaro   → fraco contra Bardo
Bardo     → forte contra Curandeiro → fraco contra Animalista
Animalista→ forte contra Bardo     → fraco contra Bárbaro
```

> ⚠️ Este ciclo **difere** do ciclo legado em `GAME_RULES.md v1`. O arquivo `class_matchups.json` é o source of truth desde a Canon Fase 1.

**Efeito da vantagem no combate:**
- +2 no RC (Resultado de Confronto) do confronto
- +10% no dano final

**Efeito da desvantagem:**
- −2 no RC
- −10% no dano final

**Animalista:** neutro no sistema legado; tem matchups explícitos no cânone (forte contra Bardo, fraco contra Bárbaro).

### 3.3 Regra de Batalha por Classe

| Ação | Regra |
|------|-------|
| **Captura** | ✅ Qualquer jogador pode capturar monstrinhos de **qualquer classe** |
| **Uso em batalha** | ⚠️ Jogador só pode usar monstrinhos da **mesma classe** do jogador |
| **Exceção Mestre** | 🔓 Modo Mestre/Debug pode liberar cross-class em batalha |

**Objetivo:** incentivar trocas entre jogadores para montar times de sua classe.

**Implementação:**
```javascript
// Filtrar monstrinhos elegíveis para batalha
const elegíveis = player.team.filter(m => m.class === player.class);
if (elegíveis.length === 0) {
    // Mostrar aviso: "Troque com outros jogadores!"
    // Bloquear início de batalha
}
```

### 3.4 Crescimento de Stats por Classe

| Classe | Prioridade de crescimento |
|--------|--------------------------|
| Guerreiro | HP/DEF (primário), ATK moderado, AGI baixa |
| Bárbaro | ATK (primário), HP bom, DEF moderada/baixa |
| Mago | ENE/ATK (primário), baixa sustentação |
| Curandeiro | ENE (primário), HP moderado, ATK baixo |
| Bardo | ENE/AGI (primário), baixa pressão direta |
| Ladino | AGI/ATK (primário), DEF baixa |
| Caçador | AGI/ATK (primário), setup à distância |
| Animalista | Crescimento equilibrado com adaptação |

---

## 4. Sistema de Combate

> Sistema canônico v2.1 — source of truth: `docs/COMBATE_FORMULA_V2.md`

### 4.1 Atributos de Combate

| Atributo | Abrev. | Papel |
|----------|--------|-------|
| Pontos de Vida | HP | Vida atual / máxima |
| Energia | ENE | Combustível para habilidades |
| Ataque | ATK | Poder ofensivo base |
| Defesa | DEF | Resistência (2 papéis — ver 4.2) |
| Agilidade | AGI | Determina ordem de turno |
| Poder da Ação | PWR | Potência base da ação usada |
| Nível | LVL | Hierarquia de progressão |

### 4.2 Os Dois Papéis da DEF

```
DEF_confronto = ceil(DEF / 2)   ← usado no confronto (hit/miss)
Mitigação     = floor(DEF / 2)  ← reduz o dano após o golpe entrar
```

Exemplos: DEF 4 → confronto 2 / mitigação 2 | DEF 6 → 3/3 | DEF 8 → 4/4

> **Regra de segurança:** 1 ponto de DEF não pode valer mais do que 1 ponto de ATK no efeito total médio. A divisão por 2 em cada etapa garante isso.

### 4.3 Ordem de Turno

```
Iniciativa = AGI + d6 (rolado no início do encontro)
Maior valor age primeiro.
Empate: Monstrinho do jogador age antes do inimigo.
```

### 4.4 Fórmula do Confronto (d20 Bilateral)

```
RC = (d20_ataque + ATK + BônusAção + ModNível + ModClasse + BuffOfensivo)
   − (d20_defesa + DEF_confronto + ModPosição + BuffDefensivo)
```

**Modificador de Nível (ModNível)** — tabela discreta, máximo ±5:

| Diferença de nível (atacante − defensor) | ModNível |
|------------------------------------------|---------|
| +16 ou mais | +5 |
| +11 a +15 | +4 |
| +6 a +10 | +3 |
| +1 a +5 | +1 |
| 0 | 0 |
| −1 a −5 | −1 |
| −6 a −10 | −3 |
| −11 a −15 | −4 |
| −16 ou menos | −5 |

### 4.5 Faixas do Resultado de Confronto

| RC | Categoria | Multiplicador de Dano |
|----|-----------|----------------------|
| ≤ −8 | **Falha Total** | ×0 (sem dano) |
| −7 a −3 | **Contato Neutralizado** | ×0 (ou 1 fixo*) |
| −2 a +3 | **Acerto Reduzido** | ×0.60 (mín. 1) |
| +4 a +10 | **Acerto Normal** | ×1.00 |
| ≥ +11 | **Acerto Forte** | ×1.25 |

*Contato Neutralizado pode causar 1 de dano fixo em casos de superioridade de nível.

### 4.6 Dados Naturais

| Evento | Efeito no RC |
|--------|-------------|
| Atacante tira **20 natural** | +4 ao RC; +20% no dano final |
| Atacante tira **1 natural** | −6 ao RC |
| Defensor tira **20 natural** | +5 defensivo (subtrai 5 do RC) |
| Defensor tira **1 natural** | −4 defensivo (soma 4 ao RC) |

> Não há acerto automático ou falha absoluta — os dados naturais ajustam muito o RC, mas os atributos ainda importam.

### 4.7 Cálculo de Dano

```
DanoBase = PWR + ATK − Mitigação
DanoFinal = max(1, floor(DanoBase × mult_faixa))
```

Se d20_atacante = 20 natural: `DanoFinal × 1.20` (após multiplicador de faixa).

**Fontes de PWR:**
- Ataque básico: `POWER_BASIC` (por classe: aprox. 2–3 no sistema v2)
- Habilidade slot 1–3: 4–8 por slot
- Assinatura (slot 4): 9+

### 4.8 Sistema de Energia (ENE)

- **ENE_MAX** de base: 10 + (level − 1) × 2
- Começa cheio no início da batalha
- Ataque básico: **não** gasta ENE
- Habilidade: gasta ENE conforme custo do slot
- Itens: **não** gastam ENE

**Regeneração por turno:**
```javascript
eneGain = Math.max(ene_regen_min, Math.ceil(eneMax * ene_regen_pct))
ene = Math.min(eneMax, ene + eneGain)
```

| Classe | % Regen | Mín |
|--------|---------|-----|
| Mago / Curandeiro | 18% | 3 |
| Bardo / Caçador / Ladino | 14% | 2 |
| Animalista / Bárbaro | 12% | 2 |
| Guerreiro | 10% | 1 |

### 4.9 Desbloqueio de Slots de Habilidade

| Nível | Unlock |
|-------|--------|
| 1 | Slot 1 (básico) |
| 5 | Slot 2 |
| 10 | Upgrade slot 1 ou 2 |
| 15 | Slot 3 |
| 22 | Upgrade slot 2 ou 3 |
| 30 | Slot 4 (assinatura) |

### 4.10 Turnos — Sequência

```
1. Jogador escolhe ação (Atacar / Habilidade / Item / Fugir)
2. Se atacar: criança rola o d20 físico e informa o valor
3. Sistema calcula RC, faixa e dano
4. Inimigo contra-ataca (se vivo e não atordoado)
5. Verificar vitória/derrota
6. Repetir
```

### 4.11 Fuga

| Tipo de inimigo | DC |
|-----------------|-----|
| Normal | 12 |
| Intimidante | 16 |
| Elite / Boss | 18 |

---

## 5. Sistema de Captura

### 5.1 Pré-requisitos

1. Encontro **individual** (wild) — captura nunca é permitida em grupo ou boss
2. HP do alvo **> 0** (não pode capturar desmaiado)
3. Jogador possui **item de captura** no inventário

### 5.2 Mecânica — Captura Determinística (sem rolagem)

A captura é determinada por comparação, não por sorte:

```
Captura bem-sucedida se:  HP_percentual <= Threshold_final
```

**Fórmula do Threshold_final:**
```
Threshold_final = min(0.95,
  (Base_raridade + Item_bonus + Status_bonus) × capture_multiplier
)
```

> `Status_bonus` = 0 por padrão. Se houver status de debuff futuramente, criar tabela explícita.

### 5.3 Thresholds Base por Raridade

| Raridade | Threshold_base (%) | Capture_multiplier |
|----------|-------------------|--------------------|
| Comum | 60% | — |
| Incomum | 45% | — |
| Raro | 30% | — |
| Místico | 18% | — |
| Lendário | 10% | — |

### 5.4 Bônus de Itens de Captura

| Item | Bonus |
|------|-------|
| Orbe Básico | +0% |
| Orbe Incomum | +10% |
| Orbe Raro | +20% |

### 5.5 Dual-Track de Captura

A captura possui **dois trilhos paralelos**:

| Trilho | Mecânica | Resolução |
|--------|----------|-----------|
| **Físico (HP)** | Reduzir HP do alvo abaixo do threshold | Determinístico por HP% |
| **Comportamental (Agressão)** | Reduzir agressão do alvo a 0 com orbes | Comportamental — criança usa itens |

O tutorial (Passo 3: `tut_capture`) explica ambos os trilhos. `tutorialOnAction("capture")` é chamado quando `behaviorallyResolved` (agressão chega a 0).

### 5.6 Fluxo de Tentativa

```
1. Consome 1 item de captura (sempre, mesmo se falhar)
2. Calcula HP_percentual do alvo
3. HP_percentual <= Threshold_final?
   → SUCESSO: Monstrinho capturado
       → Se team com espaço: vai para team
       → Se team cheio: vai para box
       → Encontro termina
   → FALHA: Inimigo realiza 1 ataque básico imediato
       → Combate continua normalmente
```

---

## 6. Passivas de Espécie (Canon Layer)

> Source of truth: `js/canon/speciesPassives.js` + `design/canon/species.json`
> Status atual: Canon Fases 4.0–4.3 implementadas. Fase 5 (kit_swap, slot unlocks avançados) planejada.

### 6.1 Visão Geral

Passivas de espécie são modificadores automáticos aplicados a Monstrinhos de espécies canônicas específicas. Elas são resolvidas via `resolvePassiveModifier(instance, context)`.

O bridge entre IDs do runtime (`MON_XXX`) e espécies canônicas (`shieldhorn`, etc.) está em `js/canon/speciesBridge.js` → `RUNTIME_TO_CANON_SPECIES`.

### 6.2 Espécies com Passiva

#### `shieldhorn` — Escudicorno (Guerreiro)

| Campo | Valor |
|-------|-------|
| **Gatilho** | `on_hit_received` |
| **Restrição** | `isFirstHitThisTurn = true` (apenas o primeiro ataque por turno) |
| **Efeito** | `damageReduction: 1` — reduz 1 ponto de dano recebido |
| **Reset** | `passiveState.shieldhornBlockedThisTurn` reiniciado em `processEnemyCounterattack` |
| **Offsets de stats** | HP +1, ATK −1, DEF +1 |

```
Quando está na frente, recebe +1 de mitigação no primeiro ataque sofrido por turno.
```

#### `emberfang` — Presabrasa (Bárbaro)

| Campo | Valor |
|-------|-------|
| **Gatilho** | `on_attack` (apenas habilidades ofensivas) |
| **Restrição** | `isOffensiveSkill = true` (skill.type = DAMAGE); **não** dispara em ataque básico |
| **Condição** | HP atual > 70% do HP máximo |
| **Efeito** | `atkBonus: 1` — +1 ATK neste confronto |
| **Implementação** | buff temporário aplicado em `executeWildSkill`, removido após `useSkill` |
| **Offsets de stats** | ATK +1, DEF −1, AGI +1 |

```
Ao usar habilidade ofensiva, recebe +1 no confronto se estiver com HP acima de 70%.
```

#### `floracura` — Floracura (Curandeiro)

| Campo | Valor |
|-------|-------|
| **Gatilho** | `on_heal_item` |
| **Restrição** | `isFirstHeal = true` (apenas a primeira cura por combate) |
| **Efeito** | `healBonus: 3` — +3 HP na primeira cura com item |
| **Estado** | `encounter.passiveState.floracuraHealUsed` gerenciado lazily em `wildActions.js` |
| **Assimetria** | Wild sem path de item (não dispara no lado inimigo) |
| **Offsets de stats** | HP +1, ENE +1, AGI −1 |

```
A primeira cura com item de cada combate recebe +3 HP de bônus.
```

#### `moonquill` — Plumalua (Mago)

| Campo | Valor |
|-------|-------|
| **Gatilho** | `on_skill_used` |
| **Restrição** | `isDebuff = true` (habilidade do tipo debuff) |
| **Efeito** | `spdBuff: 1` — +1 AGI por 1 turno |
| **Integração wild** | Resolvido em `processEnemySkillAttack` antes do `if(enemyHit)` |
| **Offsets de stats** | ENE +1 |

```
Se aplicar debuff, ganha +1 AGI até o próximo turno.
```

### 6.3 Mapeamento Runtime → Espécie Canônica

| Template Runtime | Espécie Canônica | Justificativa |
|-----------------|-----------------|---------------|
| `MON_010` | `shieldhorn` | Ferrozimon: DEF 9 vs ATK 7 — perfil tank |
| `MON_002`, `MON_026` | `shieldhorn` | Guerreiro, mesmo arquétipo |
| `MON_007` | `emberfang` | Trovão: ATK 8, DEF 4 — burst agressivo |
| `MON_021` | `emberfang` | Tamborilhomon: mesmo arquétipo burst |
| `MON_029` | `emberfang` | Bárbaro, mesmo arquétipo |
| `MON_003` | `moonquill` | Faíscari: Mago Comum, ENE alto |
| `MON_014`, `MON_024` | `moonquill` | Mago, mesmo arquétipo controle |
| `MON_004` | `floracura` | Ninfolha: Curandeiro Comum, suporte |
| `MON_020`, `MON_028` | `floracura` | Curandeiro, mesmo arquétipo |

Templates sem mapeamento funcionam normalmente (sem offsets canônicos). `MON_100` não mapeado (sem perfil de tank definido).

---

## 7. Progressão, XP e Level Up

### 7.1 XP para Próximo Nível

```javascript
xpNeeded(L) = Math.round(40 + 6*L + 0.6*(L*L))
```

| Nível | XP necessário |
|-------|--------------|
| 1 | 47 |
| 5 | 85 |
| 10 | 160 |
| 20 | 400 |
| 30 | 754 |
| 50 | 1.790 |
| 100 | 6.640 |

### 7.2 XP de Batalha

```javascript
xpEarned = Math.floor((battleXpBase + level_enemy × 2) × rarityMult)
// battleXpBase = 15 (padrão de config)
```

**Multiplicadores de raridade (RARITY_XP):**

| Raridade | Multiplicador |
|----------|--------------|
| Comum | 1.00× |
| Incomum | 1.05× |
| Raro | 1.10× |
| Místico | 1.15× |
| Lendário | 1.25× |

**Bônus de Boss:** `xp × 1.5` se `encounterType === 'boss'`.

**Bônus de Amizade:** multiplicador adicional baseado na amizade (ver sistema de amizade).

### 7.3 Level Up

```javascript
hpMax_novo = Math.floor(hpMax_antigo × 1.04 + 2)
hp_atual   = hpMax_novo  // cura completa ao subir de nível
eneMax     = 10 + (level - 1) × 2
ene        = eneMax       // ENE restaurado
// ATK, DEF, AGI recalculados via recalculateStatsFromTemplate(mon)
xpNeeded   = calcXpNeeded(level)
```

- Pode subir múltiplos níveis de uma vez (loop while xp >= xpNeeded)
- Limite máximo: **nível 100**
- Verificar evolução após level up

### 7.4 Multiplicador de Nível para Dano Canônico (ModNível)

| Diferença (atacante − defensor) | ModNível |
|---------------------------------|---------|
| ≥ +16 | +5 |
| +11 a +15 | +4 |
| +6 a +10 | +3 |
| +1 a +5 | +1 |
| 0 | 0 |
| −1 a −5 | −1 |
| −6 a −10 | −3 |
| −11 a −15 | −4 |
| ≤ −16 | −5 |

### 7.5 Multiplicadores de Poder por Raridade (RARITY_PWR)

| Raridade | Multiplicador |
|----------|--------------|
| Comum | 1.00× |
| Incomum | 1.08× |
| Raro | 1.18× |
| Místico | 1.32× |
| Lendário | 1.50× |

### 7.6 Linhas Evolutivas Canônicas

| Linha | Classe | Estágio 1 → 2 → 3 | Level |
|-------|--------|-------------------|-------|
| `shieldhorn_line` | Guerreiro | Escudicorno → Basticorno → Aegishorn | 1 → 12 → 25 |
| `emberfang_line` | Bárbaro | Presabrasa → Furiagume → Infernomord | 1 → 12 → 25 |

*(moonquill e floracura sem linha evolutiva canônica ainda — documentado como divergência)*

---

## 8. Sistema de Terapia e Medalhas

### 8.1 Objetivos Terapêuticos

O terapeuta define objetivos com tipo e peso:

| Campo | Valores | Descrição |
|-------|---------|-----------|
| `type` | `BINARY` ou contínuo | BINARY = 0 ou 1; contínuo = valor numérico |
| `weight` (w) | 1–3 | Determina pontos de medalha (PM) por cumprimento |

**Exemplos de objetivos:**
- "Esperou a vez" (BINARY, w=1)
- "Usou tom calmo" (BINARY, w=2)
- "Elogiou colega" (BINARY, w=1)
- "Controle de impulso" (contínuo, w=3)

### 8.2 Pontos de Medalha (PM)

```
PM ganhos = valor × weight
```

### 8.3 Medalhas

| Medalha | Threshold | Moeda Afterlife | XP bônus |
|---------|-----------|----------------|---------|
| 🥉 Bronze | 5 PM | 1 moeda | — |
| 🥈 Prata | 12 PM | 3 moedas | — |
| 🥇 Ouro | 25 PM | 7 moedas | XP adicional para Monstrinhos ativos |

### 8.4 Moeda Pós-Vida (Afterlife)

- Concedida apenas por medalhas terapêuticas
- Não pode ser ganha em batalha ou comprada
- Usada em recompensas especiais decididas pelo terapeuta

### 8.5 Modo Terapeuta

O terapeuta pode habilitar o "Modo Terapeuta" no header da interface. Isso libera:
- Painel de objetivos terapêuticos
- Controle de medalhas e pontos
- Funcionalidades de debug/mestre (liberar cross-class, etc.)

---

## 9. Arquitetura Técnica

### 9.1 Estrutura de Pastas

```
monstrinhomon.html/
├── index.html              ← ponto de entrada, UI principal, thin wrappers
├── js/
│   ├── canon/
│   │   ├── canonLoader.js  ← carrega 6 JSONs canônicos em paralelo
│   │   └── speciesBridge.js← mapeia templateId runtime → espécie canônica
│   ├── combat/
│   │   ├── wildCore.js     ← lógica pura wild 1v1 (resolveD20Hit)
│   │   ├── wildActions.js  ← pipeline modular wild (executeWild*)
│   │   ├── wildUI.js       ← renderização wild
│   │   ├── groupCore.js    ← createGroupEncounter e funções puras de grupo
│   │   ├── groupActions.js ← loop de batalha grupo (advanceGroupTurn, flee)
│   │   ├── groupUI.js      ← UI de grupo (enterAttackMode, enterSkillMode)
│   │   ├── groupRewards.js ← processGroupVictoryRewards (idempotente)
│   │   ├── groupIntegration.js ← factories de deps (buildGroupCombatDeps, etc.)
│   │   ├── itemBreakage.js ← sistema de desgaste de itens
│   │   └── index.js        ← API pública do módulo Combat
│   ├── progression/
│   │   ├── xpCore.js       ← funções puras de XP (calculateBattleXP)
│   │   └── xpActions.js    ← orquestração com DI (giveXP, levelUpMonster)
│   ├── data/
│   │   ├── dataLoader.js   ← carrega dados do jogo
│   │   ├── skillsLoader.js ← carrega habilidades
│   │   └── questSystem.js  ← sistema de quests
│   ├── storage.js          ← StorageManager (localStorage transacional)
│   └── saveLayer.js        ← save/load de estado do jogo
├── data/
│   ├── monsters.json       ← catálogo de Monstrinhos (50 criaturas)
│   └── progression.config.json
├── design/canon/           ← documentos canônicos de design
│   ├── species.json        ← espécies com passivas e offsets
│   ├── class_matchups.json ← ciclo de vantagens (source of truth)
│   ├── evolution_lines.json
│   ├── level_progression.json ← marcos de desbloqueio de slots
│   └── skills_mvp_phase1.json
├── docs/
│   ├── COMBATE_FORMULA_V2.md
│   ├── HABILIDADES_POR_CLASSE_V2.md
│   ├── POSICIONAMENTO_V2.md
│   ├── TABELA_ENCONTROS_V2.md
│   └── ATRIBUTOS_BASE_POR_CLASSE_V2.md
└── tests/                  ← 62 arquivos, 2039 testes (npx vitest run)
```

### 9.2 Estado Global

```javascript
GameState = {
    players: [],              // Array de objetos Player
    currentEncounter: null,   // Encontro ativo (wild ou group)
    config: {                 // Configuração carregada (pode vir do cânone)
        classAdvantages: {},  // Tabela de vantagens (da class_matchups.json)
        rarityXP: {},
        rarityPWR: {},
        battleXpBase: 15,
        // ...
    }
}
```

### 9.3 Estrutura de Dados Principais

**Player:**
```javascript
{
    id: 'player_*',
    name: string,
    class: string,            // Ex: 'Guerreiro' (sempre PT-BR no runtime)
    money: number,
    afterlifeCurrency: number,
    team: [],                 // Monster instances ativas (máx 6)
    box: [],                  // Monster instances na reserva
    inventory: {}             // { item_id: quantity }
}
```

**Monster Instance (MI):**
```javascript
{
    id: 'mi_*',
    ownerId: string,
    templateId: string,       // Ex: 'MON_010' — referência imutável ao template
    name: string,
    class: string,
    rarity: string,
    level: number,            // 1–100
    xp: number,
    xpNeeded: number,
    hp: number,
    hpMax: number,
    atk: number,
    def: number,
    ene: number,
    eneMax: number,
    agi: number,
    canonSpeciesId: string,   // Ex: 'shieldhorn' (se mapeado, senão undefined)
    canonAppliedOffsets: {},  // Offsets aplicados na criação
    unlockedSkillSlots: number, // 1–4 (baseado no level)
    friendship: number,       // Sistema de amizade
    status: 'healthy' | 'fainted'
}
```

### 9.4 APIs Principais

| API | Localização | O que faz |
|-----|-------------|-----------|
| `executeWildAttack()` | `wildActions.js` | Pipeline canônico de ataque wild |
| `executeWildCapture()` | `wildActions.js` | Pipeline canônico de captura |
| `executeWildSkill()` | `wildActions.js` | Pipeline canônico de habilidade wild |
| `executeWildItemUse()` | `wildActions.js` | Pipeline canônico de item wild |
| `executeWildEnemyFullTurn()` | `wildActions.js` | Turno completo do inimigo wild |
| `resolveD20Hit()` | `wildCore.js` | Resolve acerto/falta com d20 |
| `advanceGroupTurn()` | `groupActions.js` | Avança turno em batalha de grupo |
| `processGroupVictoryRewards()` | `groupRewards.js` | Recompensas de vitória (idempotente) |
| `buildGroupCombatDeps()` | `groupIntegration.js` | Factory de deps de combate de grupo |
| `resolvePassiveModifier()` | `speciesPassives.js` | Resolve passiva de espécie |
| `createMonsterInstanceFromTemplate()` | `index.html` | Factory canônica de instâncias |
| `giveXP()` | `xpActions.js` | Dá XP e processa level ups |
| `calculateBattleXP()` | `xpCore.js` | Calcula XP puro (função pura) |
| `getSpeciesData()` | `canonLoader.js` | Dados de espécie canônica |
| `getEvolutionLine()` | `canonLoader.js` | Linha evolutiva canônica |
| `getLevelMilestones()` | `canonLoader.js` | Unlocks de habilidade por nível |
| `resolveAndApply()` | `speciesBridge.js` | Aplica offsets de espécie na instância |
| `getBridgeCoverageReport()` | `speciesBridge.js` | Relatório de cobertura de mapeamento |

### 9.5 Persistência

```javascript
// Chaves de localStorage
StorageKeys = {
    STATE: 'monstrinhomon_state',
    SLOT_1: 'mm_save_slot_1',
    SLOT_2: 'mm_save_slot_2',
    SLOT_3: 'mm_save_slot_3',
    LAST_SLOT: 'mm_last_slot'
}
```

Save transacional: escreve em chave temporária → verifica → confirma → limpa.

### 9.6 IDs Imutáveis

> ⚠️ **NUNCA renomear IDs existentes.** Saves de jogadores referenciam IDs diretamente.

| Namespace | Padrão | Exemplo |
|-----------|--------|---------|
| Sessão | `sess_*` | `sess_20260401` |
| Jogador | `player_*` | `player_abc123` |
| Monster Instance | `mi_*` | `mi_xyz789` |
| Encontro | `enc_*` | `enc_001` |
| Template de Monstrinho | `MON_XXX` | `MON_010` |
| Item | `item_*` ou `ITM_XXX` | `item_pokeball` |
| Habilidade | `SKL_XXX` | `SKL_001` |

Se precisar mudar algo: criar novo ID, manter o antigo com `deprecated: true`.

### 9.7 Pipelines Deprecados

| Módulo | Status | Por quê |
|--------|--------|---------|
| `groupBattleState.js` | ⚠️ DEPRECATED | Ghost pipeline, nunca conectado à UI real |
| `groupBattleLoop.js` | ⚠️ DEPRECATED | Mesmo motivo; mantido por compatibilidade |
| `createMonsterInstance()` (index.html) | ⚠️ DEPRECATED | Substituído por `createMonsterInstanceFromTemplate()` |

O pipeline canônico de grupo é: `groupCore.js` → `groupActions.js` → `groupUI.js` usando `GameState.currentEncounter`.

### 9.8 Próximos Passos Planejados

| Fase | O que é | Status |
|------|---------|--------|
| Canon Fase 5 | `kit_swap` — substituição de habilidades por espécie | Planejado |
| Canon Fase 5 | Slot unlocks avançados (acima do nível 30) | Planejado |
| Canon Fase 6 | Expansão de `evolution_lines.json` (moonquill, floracura) | Planejado |
| Sistema | Posicionamento em grupo (frente/meio/trás) | Especificado em `docs/POSICIONAMENTO_V2.md` |
| Sistema | Tabela de exploração com pontos por jogador | Especificado em `docs/TABELA_ENCONTROS_V2.md` |
| UI | Aba Terapia completa | Pendente |

---

---

## 10. Kit de Habilidades por Classe (4 Slots)

> Source of truth: `docs/HABILIDADES_POR_CLASSE_V2.md` v2.1

### 10.1 Estrutura dos 4 Slots

| Slot | Tipo | ENE | Descrição |
|------|------|-----|-----------|
| 1 | Ataque Básico (evoluível) | **0** | Ação permanente, sempre disponível |
| 2 | Habilidade Inicial | Sim | Primeiro poder especial |
| 3 | Habilidade Tática | Sim | Poder secundário (dano, controle, suporte) |
| 4 | Assinatura de Classe | Sim | Ação exclusiva que define o papel da classe |

**Escala de PWR:**

| Faixa | Significado |
|-------|-------------|
| 2–3 | Básico leve |
| 4 | Básico forte ou habilidade leve |
| 5–6 | Habilidade média |
| 7–8 | Habilidade forte |
| 9+ | Assinatura — exige condição, custo ou limitação |

### 10.2 Habilidades por Classe

#### Guerreiro — Tank / proteção

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Golpe Firme | 1 | 0 | 3 | Curto | Ofensiva básica | → Investida de Guarda |
| 2 | Corte Pesado | 5 | 2 | 5 | Curto | Ofensiva | → Golpe Demolidor |
| 3 | Postura Defensiva | 15 | 3 | 0 | Próprio | Defesa | → Muralha de Ferro |
| 4 | Proteger Aliado | 30 | 4 | 0 | Curto/aliado | **Assinatura** | → Guarda Heroica |

#### Bárbaro — Burst / pressão

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Pancada Selvagem | 1 | 0 | 4 | Curto | Ofensiva básica | → Fúria Cortante |
| 2 | Golpe Brutal | 5 | 2 | 6 | Curto | Ofensiva | → Destruidor de Ossos |
| 3 | Fúria | 15 | 3 | 0 | Próprio | Buff (+ATK, -DEF) | → Frenesi de Batalha |
| 4 | Berserk | 30 | 4 | 7 | Curto | **Assinatura** | → Ira Colossal |

#### Mago — Ofensivo técnico / controle

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Rajada Arcana | 1 | 0 | 3 | Médio | Ofensiva básica | → Seta Mística |
| 2 | Explosão Etérea | 5 | 2 | 5 | Médio | Ofensiva | → Onda Arcana |
| 3 | Prisão de Energia | 15 | 3 | 1 | Médio | Controle (-AGI) | → Selo Arcano |
| 4 | Tempestade Arcana | 30 | 4 | 6 | Médio/Área | **Assinatura** | → Cataclismo Etéreo |

#### Curandeiro — Sustentação / suporte

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Toque Vital | 1 | 0 | 2 | Médio | Ofensiva básica | → Luz Restauradora |
| 2 | Cura Simples | 5 | 2 | 4 | Médio/aliado | Cura | → Cura Restauradora |
| 3 | Benção Suave | 15 | 3 | 0 | Médio/aliado | Buff (escudo/regen) | → Aura Protetora |
| 4 | Cura em Área | 30 | 4 | 5 | Grupo | **Assinatura** | → Grande Onda Vital |

#### Bardo — Buff / debuff / ritmo

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Nota Cortante | 1 | 0 | 2 | Longo | Ofensiva básica | → Melodia Penetrante |
| 2 | Canção de Coragem | 5 | 2 | 0 | Grupo/aliado | Buff (+ATK/confronto) | → Hino Inspirador |
| 3 | Eco Desafinador | 15 | 3 | 1 | Longo | Debuff (-ATK/-AGI) | → Balada da Ruína |
| 4 | Concerto de Guerra | 30 | 4 | 0 | Grupo/Área | **Assinatura** | → Sinfonia Suprema |

#### Ladino — Velocidade / execução

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Corte Rápido | 1 | 0 | 3 | Curto/Médio | Ofensiva básica | → Lâmina Veloz |
| 2 | Golpe Sorrateiro | 5 | 2 | 5 | Curto | Ofensiva condicional | → Assalto Sombrio |
| 3 | Passo Sombrio | 15 | 3 | 0 | Próprio | Mobilidade | → Dança das Sombras |
| 4 | Execução | 30 | 4 | 7 | Curto | **Assinatura** | → Golpe Fatal |

#### Caçador — Pressão à distância / marcação

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Disparo Preciso | 1 | 0 | 3 | Longo | Ofensiva básica | → Flecha Certeira |
| 2 | Tiro Reforçado | 5 | 2 | 5 | Longo | Ofensiva | → Flecha Perfurante |
| 3 | Marcar Alvo | 15 | 3 | 0 | Longo | Tática (penalidade DEF) | → Caçada Implacável |
| 4 | Tiro do Predador | 30 | 4 | 6 | Longo | **Assinatura** | → Sentença do Caçador |

#### Animalista — Versatilidade / adaptação

| Slot | Habilidade | Lv | ENE | PWR | Alcance | Tipo | Evolução |
|------|-----------|--:|---:|---:|---------|------|----------|
| 1 | Mordida Selvagem | 1 | 0 | 3 | Curto | Ofensiva básica | → Presa Bestial |
| 2 | Investida Animal | 5 | 2 | 5 | Curto | Ofensiva | → Carga Furiosa |
| 3 | Instinto Aguçado | 15 | 3 | 0 | Próprio | Buff adaptável | → Sentidos Primitivos |
| 4 | Forma Bestial | 30 | 4 | 5 | Curto/Médio | **Assinatura** | → Transformação Primordial |

### 10.3 Regras Fixas de Design de Habilidades

| Regra | Descrição |
|-------|-----------|
| **A** | Slot 1 (básico) deve ser sempre útil, sem ENE |
| **B** | Assinatura (slot 4) não pode ser só dano — precisa de efeito situacional ou limitação |
| **C** | Toda habilidade forte tem limitação obrigatória (condição, custo, duração) |
| **D** | Suporte coletivo (buff/cura de área) é limitado a Curandeiro e Bardo |
| **E** | Condicional > universal — habilidade boa em sempre = problema de balanceamento |

---

## 11. Atributos Base por Classe (Nível 1 Canônico)

> Source of truth: `docs/ATRIBUTOS_BASE_POR_CLASSE_V2.md` v2.1

### 11.1 Tabela-Base

| Classe | HP | ATK | DEF | ENE | AGI | Alcance | PWR Básico | Papel |
|--------|----|-----|-----|-----|-----|---------|------------|-------|
| **Guerreiro** | 24 | 5 | 8 | 4 | 3 | Curto | 4 | Tank / proteção |
| **Bárbaro** | 22 | 8 | 4 | 3 | 4 | Curto | 5 | Burst / pressão |
| **Mago** | 18 | 7 | 3 | 7 | 4 | Médio | 4 | Ofensivo técnico |
| **Curandeiro** | 19 | 4 | 3 | 8 | 3 | Médio | 3 | Cura / suporte |
| **Bardo** | 18 | 4 | 3 | 7 | 5 | Longo | 3 | Buff / debuff |
| **Ladino** | 17 | 7 | 2 | 5 | 8 | Curto/Médio | 4 | Velocidade / execução |
| **Caçador** | 19 | 6 | 3 | 5 | 6 | Longo | 4 | Pressão à distância |
| **Animalista** | 21 | 6 | 5 | 5 | 5 | Curto/Médio | 4 | Versátil |

### 11.2 Regra: Nenhuma classe lidera em mais de 2 eixos fortes

| Classe | Líderes | Não pode liderar |
|--------|---------|-----------------|
| Guerreiro | DEF, HP | ATK, AGI |
| Bárbaro | ATK, PWR | DEF, ENE |
| Mago | ATK, ENE | HP, DEF |
| Curandeiro | ENE, cura | ATK, DEF |
| Bardo | ENE, AGI | HP, dano direto |
| Ladino | AGI, ATK | HP, DEF |
| Caçador | AGI, alcance | DEF, HP |
| Animalista | Equilíbrio | Nenhum pico extremo |

### 11.3 DEF na Fórmula (Lv1 — referência rápida)

| Classe | DEF | DEF_confronto | Mitigação |
|--------|-----|--------------|-----------|
| Guerreiro | 8 | 4 | 4 |
| Bárbaro | 4 | 2 | 2 |
| Mago | 3 | 2 | 1 |
| Curandeiro | 3 | 2 | 1 |
| Bardo | 3 | 2 | 1 |
| Ladino | 2 | 1 | 1 |
| Caçador | 3 | 2 | 1 |
| Animalista | 5 | 3 | 2 |

### 11.4 Simulação de Combate Lv1

**DanoBase básico = PWR_básico + ATK_atacante − Mitigação_defensor**

| Atacante → Defensor | DanoBase (sem dados) |
|--------------------|--------------------|
| Bárbaro → Guerreiro | 5 + 8 − 4 = **9** |
| Guerreiro → Bárbaro | 4 + 5 − 2 = **7** |
| Mago → Guerreiro | 4 + 7 − 4 = **7** |
| Guerreiro → Mago | 4 + 5 − 1 = **8** |
| Ladino → Mago | 4 + 7 − 1 = **10** |
| Bárbaro → Ladino | 5 + 8 − 1 = **12** |

> Com 24 HP, Guerreiro aguenta ~3 acertos do Bárbaro. Com 17 HP, Ladino aguenta ~2 acertos.

---

## 12. Sistema de Itens

### 12.1 Itens Equipáveis (Held Items)

Itens que o Monstrinho segura — conferem bônus passivos de stats.

| ID | Nome | Tier | ATK+ | DEF+ | Chance de quebra |
|----|------|------|-----:|-----:|-----------------|
| `IT_ATK_COMUM` | Amuleto de Força | Comum | +2 | 0 | 15% |
| `IT_DEF_COMUM` | Escudo Leve | Comum | 0 | +2 | 15% |
| `IT_ATK_INCOMUM` | Colar de Poder | Incomum | +4 | 0 | 10% |
| `IT_DEF_INCOMUM` | Armadura Reforçada | Incomum | 0 | +4 | 10% |
| `IT_ATK_RARO` | Garra do Dragão | Raro | +6+ | 0 | variável |
| `IT_DEF_RARO` | Escudo Arcano | Raro | 0 | +6+ | variável |

**Preço de venda** = `floor(buy × 0.50)` (metade do preço de compra).

### 12.2 Itens Consumíveis (Batalha e Menu)

| Tipo | Exemplos | Efeito | Usável em batalha? |
|------|---------|--------|-------------------|
| Captura | Orbe Básico, Orbe Reforçado | Tenta capturar | ✅ Sim |
| Cura | Petisco de Cura, Poção Grande | Restaura HP (25% / 50%) | ✅ Sim |
| Energia | Cristal de Energia | Restaura 50% ENE | ✅ Sim |
| Reviver | Pena Reviva | Revive com 40% HP | ❌ Fora de batalha |
| Tático | Escudo, Re-roll | Reduz dano / permite rolar d20 novamente | ✅ Sim |

**Regra:** itens de reviver e alguns táticos só funcionam fora de batalha.

### 12.3 Ovos (Eggs)

| ID | Nome | Raridade | Modo |
|----|------|---------|------|
| `EGG_C` | Ovo Comum | Comum | `by_rarity` |
| `EGG_I` | Ovo Incomum | Incomum | `by_rarity` |
| `EGG_R` | Ovo Raro | Raro | `by_rarity` |

- Ovos são usados via menu (não em batalha).
- Eclodem via `hatchEggFromInventory()` → `createMonsterInstanceFromTemplate()` (ponte canônica).

### 12.4 Sistema de Desgaste de Itens (ItemBreakage)

Held items têm chance de quebrar após a batalha:
- Quebra calculada por `Combat.ItemBreakage.markAsParticipated()` após uso em combate.
- Chance de quebra varia por tier (15% comum → menor em raros).
- Item quebrado é removido automaticamente do Monstrinho.

---

## 13. Sistema de Amizade (Friendship)

### 13.1 Escala

| Valor | Nível | Ícone | Bônus XP |
|-------|-------|-------|---------|
| 0–24 | 1 (Estranhos) | 💔 | Nenhum |
| 25–49 | 2 (Conhecidos) | 🤍 | Nenhum |
| 50–74 | 3 (Amigos) | 💙 | Nenhum |
| 75–99 | 4 (Grandes Amigos) | 💛 | +5% XP |
| 100 | 5 (Melhores Amigos) | ❤️ | +10% XP |

**Padrão inicial:** 50 (Amigos — neutro).

### 13.2 Eventos que Alteram Amizade

| Evento | Mudança |
|--------|---------|
| Ganhar batalha | +2 |
| Perder batalha | −5 |
| Usar item de cura no Monstrinho | +5 |
| Subir de nível | +3 |
| Monstrinho desmaiar | −3 |

### 13.3 Impacto no Jogo

```javascript
getFriendshipBonuses(friendship):
  Nível 4 (75+): xpMultiplier = 1.05  // +5% XP em batalha
  Nível 5 (100): xpMultiplier = 1.10  // +10% XP em batalha
```

Bônus aplicado em `giveXP()` via `Math.round(baseXpGain × xpMultiplier)`.

---

## 14. Sistema de Posicionamento em Grupo

> Source of truth: `docs/POSICIONAMENTO_V2.md`
> Aplicável apenas em batalhas de grupo (trainer, boss). Não se aplica a encontros wild 1v1.

### 14.1 Grade de Posicionamento

```
LADO DO INIMIGO          LADO DO JOGADOR
┌────────────┐           ┌────────────┐
│  Inimigo   │           │   TRÁS     │ ← Suporte / Bônus def. +2
│  (Frente)  │           │            │
├────────────┤           ├────────────┤
│  Inimigo   │  ←→ →    │   MEIO     │ ← Versátil / Bônus def. +1
│  (Meio)    │           │            │
├────────────┤           ├────────────┤
│  Inimigo   │           │  FRENTE    │ ← Linha 1 / Sem bônus def.
│  (Trás)    │           │            │
└────────────┘           └────────────┘
  Máx. 2/linha             Máx. 2/linha
```

### 14.2 Alcance por Classe

| Classe | Alcance Base | Linhas atingidas |
|--------|-------------|-----------------|
| Guerreiro | Curto | Apenas Frente inimiga |
| Bárbaro | Curto | Apenas Frente inimiga |
| Mago | Longo | Frente, Meio e Trás |
| Curandeiro | Médio | Frente e Meio (cura: qualquer linha) |
| Bardo | Longo | Qualquer linha (buff: qualquer aliado) |
| Ladino | Médio | Frente e Meio |
| Caçador | Longo | Qualquer linha |
| Animalista | Curto | Apenas Frente |

**Modificador de posição do atacante:**
- Posição Meio: +1 linha de alcance (Curto → Médio)
- Posição Trás: −1 linha de alcance (Médio → Curto)

### 14.3 Bônus Defensivo por Linha

| Linha | Bônus no RC de defesa |
|-------|----------------------|
| Frente | +0 |
| Meio | +1 |
| Trás | +2 |

> Bônus só se aplica se a linha à frente tiver pelo menos 1 aliado vivo.

### 14.4 Prioridade de Alvo (IA Inimiga)

1. Linha mais à frente acessível pelo alcance do inimigo
2. Dentro da linha: alvo com **menor HP atual**
3. 20% de chance de atacar aleatoriamente na linha
4. Se TAUNT ativo: **deve** atacar o provocador

### 14.5 Fuga e Troca de Posição

- Troca de posição custa ação do turno
- Fuga de batalha em grupo: libera 1 Monstrinho; não encerra o combate
- Fuga proibida em batalha Boss

---

## 15. Tabela de Encontros e Exploração

> Source of truth: `docs/TABELA_ENCONTROS_V2.md`

### 15.1 Loop de Exploração

```
Grupo chega à área →
Cada jogador escolhe 1 ponto de busca (4–6 disponíveis) →
Resultado revelado (d6 ou automático) →
Combate / captura / evento →
Recompensas distribuídas
```

### 15.2 Pesos por Tipo de Área

| Tipo | Nada | Item | Selvagem | Evento | Raro |
|------|------|------|----------|--------|------|
| Campo | 15% | 20% | 40% | 15% | 10% |
| Floresta | 10% | 15% | 45% | 15% | 15% |
| Caverna | 5% | 10% | 40% | 20% | 25% |
| Ruína | 5% | 15% | 30% | 25% | 25% |
| Montanha | 10% | 10% | 35% | 20% | 25% |
| Água | 15% | 20% | 40% | 15% | 10% |
| Cidade | 10% | 40% | 5% | 35% | 10% |

### 15.3 Atributos Especiais de Boss

| Modificador | Valor |
|-------------|-------|
| HP | ×2.5 do padrão do nível |
| ATK | ×1.5 |
| DEF | ×1.5 |
| Imunidade a STUN/ROOT | ✅ Sim |
| Fuga do jogador | ❌ Proibida |
| Fases | 2 (HP ≤ 50% = Fase 2, +20% ATK) |

### 15.4 Recompensas por Tipo de Encontro

| Encontro | Drop Garantido | Extra |
|----------|----------------|-------|
| Selvagem (derrota) | Nenhum | 30% de 1 item Comum |
| Selvagem (captura) | Nenhum | 15% de 1 item Comum |
| Treinador (vitória) | 1 item Comum | 20% Incomum |
| Treinador Elite (vitória) | 1 item Incomum | 25% Raro |
| Boss (vitória) | 1 item Raro | 20% Místico, 5% Lendário |

### 15.5 Fuga de Encontro Selvagem

```javascript
// Fuga do monstrinho selvagem (abandona o combate)
chance_fuga = fuga_base_raridade + bonus_item_fuga

FLEE_BASE = {
    Comum: 10%, Incomum: 12%, Raro: 15%, Místico: 18%, Lendário: 25%
}

// Fuga do jogador
d20 + AGI >= DC_fuga
  DC Normal:      12
  DC Intimidating: 16
  DC Elite:        18
```

---

## 16. Exemplo Prático — Turno Completo de Combate

**Situação:** Guerreiro (Lv10) ataca Bárbaro (Lv10) com ataque básico. Mesmo nível, sem buffs.

**Atributos:**
- Guerreiro (atacante): ATK 8, DEF 12, LVL 10, PWR básico 4
- Bárbaro (defensor): ATK 13, DEF 6, LVL 10, HP 49

**Passo 1 — Validar ação:** alcance OK (ambos Frente), ENE OK (básico grátis).

**Passo 2 — Confronto:**
```
DEF_confronto Bárbaro = ceil(6/2) = 3
ModNível = 0 (mesmo nível)
ModClasse = 0 (neutro neste exemplo)

Guerreiro rola d20A = 12 (físico)
Bárbaro rola d20D = 8

RC = (12 + 8 + 4 + 0 + 0 + 0) − (8 + 3 + 0 + 0)
   = 24 − 11 = +13  → Acerto Forte (mult ×1.25)
```

**Passo 3 — Dano:**
```
Mitigação Bárbaro = floor(6/2) = 3
DanoBase = 4 (PWR) + 8 (ATK) + 0 − 3 = 9
DanoFinal = max(1, floor(9 × 1.25)) = 11
```

**Passo 4 — Aplicar:** Bárbaro perde 11 HP. HP: 49 → 38.

**Passo 5 — Verificar:** Bárbaro ainda vivo. Turno passa para o Bárbaro.

---

## 17. Constantes Completas do Sistema

### 17.1 Captura Base (%)

```javascript
CAPTURE_BASE = {
    Comum: 60, Incomum: 45, Raro: 30, Místico: 18, Lendário: 10
}
```

### 17.2 Fuga Base (%)

```javascript
FLEE_BASE = {
    Comum: 10, Incomum: 12, Raro: 15, Místico: 18, Lendário: 25
}
```

### 17.3 Multiplicadores de Raridade

```javascript
RARITY_PWR = { Comum: 1.00, Incomum: 1.08, Raro: 1.18, Místico: 1.32, Lendário: 1.50 }
RARITY_XP  = { Comum: 1.00, Incomum: 1.05, Raro: 1.10, Místico: 1.15, Lendário: 1.25 }
```

### 17.4 XP por Nível (Tabela)

| Nível | XP necessário |
|-------|--------------|
| 1 | 47 |
| 5 | 85 |
| 10 | 160 |
| 15 | 265 |
| 20 | 400 |
| 25 | 565 |
| 30 | 754 |
| 40 | 1.216 |
| 50 | 1.790 |
| 75 | 3.793 |
| 100 | 6.640 |

### 17.5 Faixas RC (Combate v2)

| RC | Categoria | Mult. Dano |
|----|-----------|-----------|
| ≤ −8 | Falha Total | ×0 |
| −7 a −3 | Contato Neutralizado | ×0 (ou 1 fixo*) |
| −2 a +3 | Acerto Reduzido | ×0.60 (mín. 1) |
| +4 a +10 | Acerto Normal | ×1.00 |
| ≥ +11 | Acerto Forte | ×1.25 |

### 17.6 Dados Naturais

| Evento | Efeito |
|--------|--------|
| Ataque 20 natural | +4 RC; +20% dano final |
| Ataque 1 natural | −6 RC |
| Defesa 20 natural | +5 defensivo (−5 do RC) |
| Defesa 1 natural | −4 defensivo (+4 ao RC) |

### 17.7 Modificador de Nível (ModNível — tabela discreta)

| Δnível (atac − def) | ModNível |
|---------------------|---------|
| ≥ +16 | +5 |
| +11 a +15 | +4 |
| +6 a +10 | +3 |
| +1 a +5 | +1 |
| 0 | 0 |
| −1 a −5 | −1 |
| −6 a −10 | −3 |
| −11 a −15 | −4 |
| ≤ −16 | −5 |

### 17.8 Constantes de Combate

| Constante | Valor |
|-----------|-------|
| `battleXpBase` | 15 |
| `levelExpo` | 1.5 (multiplicador de nível legado) |
| `enemyHealThreshold` | 30% HP |
| `enemyHealChance` | 60% |
| `bossHealChance` | 85% |
| DC fuga normal | 12 |
| DC fuga intimidating | 16 |
| DC fuga elite | 18 |
| HP level-up scaling | `hpMax × 1.04 + 2` |
| ENE level-up scaling | `10 + (level − 1) × 2` |
| Amizade padrão | 50 |
| Amizade ganho (+batalha) | +2 |
| Amizade ganho (+cure item) | +5 |
| Amizade ganho (+levelup) | +3 |
| Amizade perda (−batalha) | −5 |
| Amizade perda (−faint) | −3 |
| Vantagem classe (RC) | +2 |
| Desvantagem classe (RC) | −2 |
| Vantagem classe (dano) | ×1.10 |
| Desvantagem classe (dano) | ×0.90 |

### 17.9 Chaves de localStorage

| Chave | Conteúdo |
|-------|---------|
| `monstrinhomon_state` | Estado principal do jogo |
| `monstrinhomon_corrupted_backup` | Backup automático de estado corrompido |
| `mm_save_slot_1` | Save slot 1 |
| `mm_save_slot_2` | Save slot 2 |
| `mm_save_slot_3` | Save slot 3 |
| `mm_last_slot` | Último slot usado |
| `mm_audio_sfx` | Preferência de SFX |
| `mm_audio_music` | Preferência de música |
| `mm_audio_muted` | Estado de mute |

---

## 18. Canon Layer — Detalhe Completo

### 18.1 Decisões Canônicas Registradas

> Source of truth: `design/canon/CANON_DECISIONS.md`

#### Decisão 1 — Matchups: canônico como source of truth (Fase 1)

O motor legado (`GAME_RULES.md`) definiu ciclo de 7 classes. O arquivo `class_matchups.json` define ciclo de **8 classes** (inclui Animalista) com divergências documentadas:

| Classe | Legado hardcoded | **Canônico (adotado)** |
|--------|-----------------|----------------------|
| Guerreiro | fraco contra Curandeiro | fraco contra **Mago** |
| Mago | forte contra Bárbaro | forte contra **Guerreiro** |
| Ladino | forte contra Mago | forte contra **Caçador** |
| Animalista | neutro (sem matchup) | forte contra **Bardo**, fraco contra **Bárbaro** |

**Regra de fallback:** se `class_matchups.json` falhar no carregamento, a tabela hardcoded legada é mantida. O estado de combate não persiste entre sessões → saves existentes não são afetados.

#### Decisão 2 — Subconjunto MVP Fase 1: 4 classes

Classes no MVP Fase 1: **Guerreiro, Bárbaro, Mago, Curandeiro**.  
Bardo, Ladino, Caçador e Animalista serão incorporados em fases posteriores.

#### Decisão 3 — Mapeamento PT-BR ↔ ID Canônico

| PT-BR | ID canônico |
|-------|------------|
| Guerreiro | warrior |
| Bárbaro | barbarian |
| Mago | mage |
| Curandeiro | healer |
| Bardo | bard |
| Ladino | rogue |
| Caçador | hunter |
| Animalista | animalist |

**Regra:** nunca usar IDs canônicos diretamente no motor — sempre converter via `classIdFromPtbr()` / `classPtbrFromId()` (ambos em `canonLoader.js`).

### 18.2 Matchups Canônicos Completos (class_matchups.json)

| Classe | Forte contra | Fraco contra |
|--------|-------------|-------------|
| Guerreiro | Ladino | Mago |
| Bárbaro | Curandeiro | Guerreiro |
| Mago | Guerreiro | Caçador |
| Curandeiro | Bárbaro | Bardo |
| Bardo | Curandeiro | Animalista |
| Ladino | Caçador | Guerreiro |
| Caçador | Mago | Ladino |
| Animalista | Bardo | Bárbaro |

**Ciclo de 8 completo:**
```
Guerreiro → Ladino → Caçador → Mago → Guerreiro
Bárbaro → Curandeiro → Bárbaro (loop curto)
Bardo → Curandeiro ← Bárbaro
Animalista → Bardo ← Ladino → Caçador
```

### 18.3 Espécies Canônicas (design/canon/species.json)

| ID canônico | Nome PT-BR | Classe | Raridade | Arquétipo |
|------------|-----------|--------|---------|----------|
| `shieldhorn` | Escudicorno | Guerreiro | Comum | tank_puro |
| `emberfang` | Presabrasa | Bárbaro | Incomum | burst_agressivo |
| `moonquill` | Plumalua | Mago | Comum | controle_leve |
| `floracura` | Floracura | Curandeiro | Comum | cura_estavel |

**Offsets de stats aplicados na criação de instância:**

| Espécie | HP | ATK | DEF | ENE | AGI |
|---------|:--:|:---:|:---:|:---:|:---:|
| shieldhorn | +1 | −1 | +1 | 0 | 0 |
| emberfang | 0 | +1 | −1 | 0 | +1 |
| moonquill | 0 | 0 | 0 | +1 | 0 |
| floracura | +1 | 0 | 0 | +1 | −1 |

### 18.4 Passivas de Espécie (speciesPassives.js — Fase 4.x)

| Espécie | Passiva | Gatilho | Guarda |
|---------|---------|---------|--------|
| shieldhorn | `damageReduction: 1` | `on_hit_received` | `isFirstHitThisTurn` — apenas 1.º ataque do turno |
| emberfang | `atkBonus: 1` | `on_attack` | `isOffensiveSkill: true` (skill.type=DAMAGE) + `hpPct > 0.70` |
| moonquill | `spdBuff: 1t` | `on_skill_used` | `isDebuff: true` — apenas se a skill aplicou debuff |
| floracura | `healBonus: 3` | `on_heal_item` | `isFirstHeal` — apenas primeira cura por combate |

**API:** `resolvePassiveModifier(instance, context)` em `speciesPassives.js`.
- `context` contém: `event`, `isFirstHitThisTurn`, `isOffensiveSkill`, `isDebuff`, `isFirstHeal`
- `passiveState` no objeto encounter rastreia: `shieldhornBlockedThisTurn`, `floracuraHealUsed`

### 18.5 Mapeamento Runtime → Canônico (speciesBridge.js)

| Template Runtime | Espécie Canônica | Classe |
|-----------------|-----------------|--------|
| MON_002, MON_026 | shieldhorn | Guerreiro |
| MON_010 | shieldhorn | Guerreiro |
| MON_007, MON_021, MON_029 | emberfang | Bárbaro |
| MON_003, MON_014, MON_024 | moonquill | Mago |
| MON_004, MON_020, MON_028 | floracura | Curandeiro |
| MON_100 | *(sem mapeamento — sem perfil tank)* | — |

**Total: 12 mapeamentos ativos.** Templates sem mapeamento funcionam normalmente (sem offsets).

### 18.6 Linhas Evolutivas Canônicas

| Linha | Estágio 1 | Lv | Estágio 2 | Lv | Estágio 3 |
|-------|----------|:--:|----------|:--:|----------|
| shieldhorn_line | Escudicorno | 12 | Basticorno | 25 | Aegishorn |
| emberfang_line | Presabrasa | 12 | Furiagume | 25 | Infernomord |

**Regra de progressão:** cada evolução reforça o arquétipo — nunca muda o papel central.

### 18.7 Progressão de Slots por Nível (slotUnlocks.js — Fase 5)

| Nível | Evento |
|------:|--------|
| 1 | Slot 1 ativo (ataque básico) |
| 5 | Slot 2 desbloqueado |
| 10 | Upgrade do slot 1 ou 2 |
| 15 | Slot 3 desbloqueado |
| 22 | Upgrade do slot 2 ou 3 |
| 30 | Slot 4 desbloqueado (Assinatura) |

**API:** `getUnlockedSlotsForLevel(level)` → retorna 1, 2, 3 ou 4.
- `_resolveUnlockedSlots()` em `index.html` centraliza o fallback.
- `levelUpMonster()` em `xpActions.js` atualiza `unlockedSkillSlots` na instância.

### 18.8 Regras de Crescimento de Stats por Classe

> `design/canon/level_progression.json → class_growth_rules`

| Classe (ID) | Prioridade de crescimento |
|------------|--------------------------|
| warrior | HP/DEF → ATK moderado → AGI baixa |
| barbarian | ATK → HP bom → DEF moderada/baixa |
| mage | ENE/ATK → baixa sustentação |
| healer | ENE → HP moderado → ATK baixo |
| bard | ENE/AGI → baixa pressão direta |
| rogue | AGI/ATK → DEF baixa |
| hunter | AGI/ATK → setup à distância |
| animalist | Crescimento equilibrado com adaptação |

### 18.9 Restrições de Design por Classe (design_constraints)

| Classe | Restrições obrigatórias |
|--------|------------------------|
| Guerreiro | Não pode superar ofensivos em burst · Proteção exige custo · AGI baixa é fraqueza estrutural |
| Bárbaro | Burst exige risco ou contrapartida · Não pode sustentar como Guerreiro |
| Mago | Controle de duração curta · Fragilidade obrigatória |
| Curandeiro | Cura coletiva exige alto custo de ENE · Pressão ofensiva baixa |
| Bardo | Buff coletivo de duração curta · Dano direto baixo |
| Ladino | Dano máximo sempre condicionado · Fragilidade real |
| Caçador | Maior dano depende de marcação/setup · Vulnerável quando pressionado |
| Animalista | Versatilidade sem supremacia universal · Transformação não vira "modo deus" |

---

## 19. Sistema de Quests

> Source of truth: `js/data/questSystem.js`, `js/gameFlow.js`

### 19.1 Estrutura de Dados de Quest

```javascript
{
    id:               'QST_001',      // ID único imutável
    nome:             'O Ovo Perdido', // Nome exibido ao jogador
    descricao:        'string',        // Descrição do objetivo
    localId:          'LOC_001',       // Local (ver tabela de locais)
    preReq:           null,            // Quest pré-requisito (ou null)
    tipoObjetivo:     'derrotar_treinador', // Ver tipos abaixo
    objetivoMonsterId: null,           // Monstro alvo (para captura/boss)
    objetivoQtd:      1,               // Quantidade necessária
    rewardXp:         80,              // XP de recompensa
    rewardGold:       60,              // Ouro de recompensa
    rewardItemId:     'CLASTERORB_COMUM', // Item (ou null)
    nextQuestId:      'QST_002'        // Próxima quest na cadeia
}
```

**Tipos de Objetivo:**

| Tipo | Quando completa |
|------|----------------|
| `derrotar_wild` | N monstros selvagens derrotados em batalha |
| `capturar` | N monstros capturados |
| `derrotar_treinador` | 1 treinador derrotado |
| `derrotar_boss` | 1 boss derrotado |

### 19.2 Cadeia Completa de 16 Quests

| ID | Nome | Local | Tipo | Qtd | XP | Ouro | Próxima |
|----|------|-------|------|----:|---:|-----:|---------|
| QST_001 | O Ovo Perdido | LOC_001 | derrotar_treinador | 1 | 80 | 60 | QST_002 |
| QST_002 | Primeira Captura | LOC_001 | capturar | 1 | 80 | 50 | QST_003 |
| QST_003 | Rastros na Floresta | LOC_002 | derrotar_wild | 3 | 120 | 70 | QST_004 |
| QST_004 | O Cervo da Floresta | LOC_002 | capturar | 1 | 150 | 80 | QST_005 |
| QST_005 | Mineradores Endurecidos | LOC_003 | derrotar_treinador | 1 | 200 | 100 | QST_006 |
| QST_006 | Pedra e Metal | LOC_003 | capturar | 1 | 180 | 90 | QST_007 |
| QST_007 | Guardiões das Ruínas | LOC_004 | derrotar_treinador | 1 | 280 | 140 | QST_008 |
| QST_008 | O Espectro Ancestral | LOC_004 | derrotar_boss | 1 | 400 | 200 | QST_011 |
| QST_009 | Tesouro das Águas | LOC_005 | capturar | 1 | 220 | 110 | QST_010 |
| QST_010 | O Abismo Cristalino | LOC_005 | derrotar_boss | 1 | 350 | 175 | QST_015* |
| QST_011 | Calor do Inferno | LOC_006 | derrotar_wild | 3 | 350 | 175 | QST_012 |
| QST_012 | O Rei das Chamas | LOC_006 | derrotar_boss | 1 | 600 | 300 | QST_015 |
| QST_013 | Sombras da Noite | LOC_007 | capturar | 1 | 300 | 150 | QST_014 |
| QST_014 | Caçada nas Trevas | LOC_007 | derrotar_treinador | 1 | 380 | 190 | QST_015* |
| QST_015 | Desafio da Arena | LOC_008 | derrotar_treinador | 1 | 500 | 250 | QST_016 |
| QST_016 | O Grande Campeão | LOC_008 | derrotar_boss | 1 | 800 | 400 | null |

> *Rotas opcionais (LOC_005, LOC_007): podem ser ignoradas — a cadeia principal continua em LOC_006 e LOC_008.

### 19.3 Mapa de Locais

| ID | Nome | Tipo | Quests |
|----|------|------|--------|
| LOC_001 | Campina Inicial | Tutorial | QST_001–002 |
| LOC_002 | Floresta dos Susurros | Floresta | QST_003–004 |
| LOC_003 | Minas do Eco | Caverna/Minas | QST_005–006 |
| LOC_004 | Ruínas Ancestrais | Ruína | QST_007–008 |
| LOC_005 | Costa Cristalina | Água | QST_009–010 (opcional) |
| LOC_006 | Zona Vulcânica | Montanha/Vulcão | QST_011–012 |
| LOC_007 | Floresta Noturna | Floresta | QST_013–014 (opcional) |
| LOC_008 | Grande Arena | Arena | QST_015–016 |

### 19.4 APIs de Quest (gameFlow.js)

| Função | O que faz |
|--------|-----------|
| `ensureQuestState(player)` | Inicializa `player.questState` (idempotente) |
| `activateQuest(player, questId)` | Ativa quest se disponível e não concluída |
| `autoActivateFirstQuest(player)` | Ativa QST_001 se jogador sem quests |
| `processQuestProgress(player, enc, capturedId, log)` | Processa progresso após encontro |
| `completeQuest(player, questId, deps, log)` | Conclui quest e distribui recompensas |
| `handlePostEncounterFlow(player, enc, capturedId, deps)` | Orquestra todo o fluxo pós-encontro |
| `getActiveQuestsSummary(player)` | Retorna resumo de quests ativas |
| `hasCompletedQuest(player, questId)` | Verifica se quest foi concluída |

### 19.5 Estado de Quest no Jogador

```javascript
player.questState = {
    activeQuestIds:    ['QST_003'],     // quests em andamento
    completedQuestIds: ['QST_001', 'QST_002'], // quests concluídas
    progress: {
        'QST_003': { count: 1 }         // progresso atual (precisa de 3)
    }
}
```

---

## 20. Sistema de Combate em Grupo

> Source of truth: `js/combat/groupActions.js`, `js/combat/groupRewards.js`, `js/combat/groupUI.js`, `js/combat/groupIntegration.js`

### 20.1 Shape do GroupBattleState

```javascript
{
    id: "GB_20260202_001",          // ID único
    kind: "trainer" | "boss",       // Tipo de batalha
    status: "active" | "ended",     // Status atual

    roster: {
        eligiblePlayerIds: ["p1","p2"],  // Podem participar
        participants: [{ playerId, joinedAtRound, isActive }],
        notJoined: ["p3"],
        escaped: [{ playerId, escapedAtRound }],
        reinforcementsQueue: [{ playerId, requestedAtRound }]
    },

    teams: {
        players: [{                    // Monstros ativos por jogador
            playerId: "p1",
            activeMonster: { uid, catalogId, name, hp, hpMax, spd, cls, status }
        }],
        enemies: [{                    // Inimigos ativos
            enemyId: "E1",
            type: "trainer" | "boss" | "minion",
            name, hp, hpMax, spd, cls, ai, status
        }]
    },

    turn: {
        phase: "players" | "enemies", // Fase atual
        order: ["P1","P2","E1"],       // Ordem de turnos
        index: 0,                      // Ponteiro atual
        currentActorId: "P1",
        round: 1,
        visibleBanner: "Vez dos Jogadores"
    },

    rules: {
        allowCapture: false,           // Treinador/boss: sem captura
        allowItems: true,
        allowFlee: true,
        fleeIsIndividual: true,        // Fuga é individual, não encerra combate
        allowLateJoin: true,
        oneActiveMonsterPerPlayer: true
    }
}
```

### 20.2 Módulos de Combate em Grupo

| Módulo | Localização | Responsabilidade |
|--------|-------------|-----------------|
| `groupActions.js` | `js/combat/` | `advanceGroupTurn`, `executeGroupFlee`, ações por turno |
| `groupRewards.js` | `js/combat/` | `processGroupVictoryRewards` (idempotente, com flags de concessão) |
| `groupUI.js` | `js/combat/` | `enterAttackMode`, `enterSkillMode`, `handleEnemyClick`, `cancelTargetMode` |
| `groupIntegration.js` | `js/combat/` | `buildGroupCombatDeps`, `buildGroupRewardsDeps`, `buildGroupUIRenderDeps` |

### 20.3 Processamento de Recompensas em Grupo

`processGroupVictoryRewards(enc, deps)` é a função canônica e idempotente:
- `enc.moneyGranted = true` → ouro não é concedido novamente
- `enc.dropsGranted = true` → drops não são concedidos novamente
- `enc.questsProcessed = true` → progresso de quest não é processado novamente

### 20.4 Regras de Fuga em Grupo

- `fleeIsIndividual: true` → apenas o jogador que fugiu sai da batalha
- Batalha continua com jogadores restantes
- Boss: fuga proibida (`allowFlee: false`)
- Treinador: fuga permitida

---

## 21. Camada de Save / Persistência

> Source of truth: `js/storage.js` (StorageManager), `js/saveLayer.js` (SaveLayer)

### 21.1 Arquitetura de Dois Níveis

```
monstrinhomon_state  ←── fonte de verdade (auto-save contínuo)
        ↑
    SaveLayer.saveActiveGame()
        ↑
  mm_save_slot_N  ←── snapshots manuais (cópias pontuais)
```

**Regra de ouro:** `monstrinhomon_state` é a única fonte de verdade da sessão ativa. Slots são snapshots — não são sessões vivas em paralelo.

### 21.2 Fluxos Corretos

| Operação | Comportamento |
|----------|--------------|
| **Continue** | Lê `monstrinhomon_state` (auto-save). Nunca lê slot diretamente |
| **Load Slot** | Restaura snapshot do slot → grava em `monstrinhomon_state` → atualiza associação de slot |
| **Save Manual** | Grava `monstrinhomon_state` + cria snapshot no slot ativo |
| **Troca de slot** | Apenas atualiza metadado operacional. Não altera auto-save |

### 21.3 API do SaveLayer

| Função | O que faz |
|--------|-----------|
| `SaveLayer.getActiveSlot()` | Slot manual associado (metadado) ou null |
| `SaveLayer.setActiveSlot(slot)` | Define slot manual associado |
| `SaveLayer.saveActiveGame(gameState, buildEnv)` | Auto-save + snapshot no slot associado |
| `SaveLayer.loadActiveGame()` | Carrega do auto-save (fonte de verdade) |
| `SaveLayer.syncMainStateAndSlot(gameState, bEnv)` | Força snapshot do slot a espelhar auto-save |

### 21.4 API do StorageManager

| Função | O que faz |
|--------|-----------|
| `saveState(data)` | Grava `monstrinhomon_state` (transacional: temp → verify → commit) |
| `loadState()` | Carrega `monstrinhomon_state` com auto-migração |
| `saveSlot(slot, data)` | Grava snapshot com auto-backup |
| `loadSlot(slot)` | Carrega snapshot do slot |
| `getLastSlot()` | Retorna último slot usado |
| `setLastSlot(slot)` | Define último slot usado |

### 21.5 Características do StorageManager

- **Save transacional:** escrita em chave temp → verificação → commit → limpeza
- **Auto-migração:** com auto-save quando migrações são necessárias
- **Auto-backup:** antes de salvar slots (`monstrinhomon_corrupted_backup`)
- **Parsing seguro:** JSON.parse com fallback e log de erros
- **Sem exceções ao caller:** retorna null/false em vez de throw

---

## 22. GameFlow — Loop Jogável Completo

> Source of truth: `js/gameFlow.js`

### 22.1 Loop Principal

```
Grupo chega à área (localId) →
  Exploração: cada jogador escolhe ponto de busca →
    Resultado revelado (encontro/item/evento) →
      Se encontro wild:
        executeWild* pipeline → vitória/fuga/derrota
        handleVictory → XP + amizade + drops
        handlePostEncounterFlow → quest progress → completeQuest se chegou
      Se treinador/boss:
        GroupBattleState criado →
        advanceGroupTurn loop →
        processGroupVictoryRewards →
        handlePostEncounterFlow
```

### 22.2 Estado de Quest no Encontro (enc)

```javascript
enc = {
    type: 'wild' | 'group_trainer' | 'boss',
    localId: 'LOC_001',           // para drops e quests
    result: 'victory' | 'flee' | 'defeat',
    capturedMonsterId: 'MON_003', // ou null
    wildMonster: { ... },         // instância do wild (ou null)
    enemies: [ { ... } ]          // inimigos em grupo (ou [])
}
```

### 22.3 Processamento Pós-Encontro

```
handlePostEncounterFlow(player, enc, capturedId, deps)
  ├── processQuestProgress(player, enc, capturedId, log)
  │     └── para cada quest ativa:
  │           verificar se enc.type + enc.localId correspondem ao objetivo
  │           se sim: qs.progress[questId].count++
  │           se count >= objetivoQtd: completeQuest(...)
  └── completeQuest(player, questId, deps, log)
        ├── distribuir rewardXp + rewardGold + rewardItemId
        ├── mover questId para completedQuestIds
        └── ativar nextQuestId se disponível
```

---

## 23. APIs Canônicas de Combate Wild

> Source of truth: `js/combat/wildCore.js`, `js/combat/wildActions.js`

### 23.1 wildCore.js — Funções Puras

Todas as funções são 100% determinísticas, sem side effects, testáveis sem DOM.

| Função | Assinatura | O que faz |
|--------|-----------|-----------|
| `checkHit` | `(d20Roll, attacker, defender, classAdvantages)` | Verifica se ataque acerta (d20+ATK+classMod ≥ DEF) |
| `calcDamage` | `({atk, def, power, damageMult})` | `max(1, floor((atk+power-def)×mult))` |
| `getBuffModifiers` | `(monster)` | Soma buffs ativos → `{atk, def, spd}` |
| `resolveD20Hit` | `(d20Roll, attacker, defender, deps)` | Wrapper com buffs e vantagem de classe |

### 23.2 wildActions.js — Pipelines de Combate Wild

| Função exportada | Contexto de uso | O que faz |
|-----------------|----------------|-----------|
| `initializeWildBattleParticipation(playerMon, wildMon)` | Início de batalha | Marca participação para ItemBreakage |
| `executeWildAttack({encounter, player, playerMonster, d20Roll, deps})` | Turno do jogador | Ataque básico + crítico + contra-ataque inimigo |
| `executeWildSkill({encounter, player, playerMonster, skillIndex, deps})` | Turno do jogador | Habilidade + custo ENE + contra-ataque inimigo |
| `executeWildCaptureAction({encounter, player, playerMonster, deps})` | Turno do jogador | Tenta captura determinística |
| `executeWildItemUse({encounter, player, playerMonster, itemId, deps})` | Turno do jogador | Usa item de inventário em batalha |
| `executeWildCapture({encounter, player, playerMonster, orbInfo, deps})` | Ação de captura | Pipeline completo: threshold → captura/falha → contra-ataque |
| `executeWildEnemyFullTurn({encounter, wildMonster, playerMonster, deps})` | Turno inimigo | ENE regen + seleção de skill/básico + d20 + dano |

### 23.3 Fluxo Interno de executeWildAttack

```
1. Verificar tutorial (tutorialAllows)
2. Processar crítico (d20 === 20: +20% dano)
3. resolveD20Hit → hit ou miss?
4. Se hit: calcDamage + aplicar passiva shieldhorn/emberfang
5. Se wild derrotado: handleVictory → XP + amizade + drops
6. Se não derrotado: processEnemyCounterattack
   ├── applyEneRegen
   ├── updateBuffs
   ├── IA: skill se ENE suficiente + critério
   └── d20 inimigo + dano ao jogador
```

### 23.4 Contra-ataque Inimigo (processEnemyCounterattack)

```
applyEneRegen(wildMonster)      → +20% ENE por turno
updateBuffs(wildMonster)        → decrementar duração de buffs
IA skill check:
  se ENE suficiente + rand() < 0.4 (ou boss: 0.65):
    processEnemySkillAttack()  → aplicar passiva moonquill antes de hit
  senão:
    processEnemyBasicAttack()
```

> Nota: captura fracassada usa `processEnemyCounterattack` **sem** ENE regen — design intencional.

---

## 24. Sistema de Economia e Loja

> Source of truth: `js/shopSystem.js`

### 24.1 APIs da Loja

| Função | O que faz |
|--------|-----------|
| `getSellPrice(itemDef)` | `sell` explícito se existir; senão `floor(buy × 0.50)` |
| `canBuy(player, itemDef, qty)` | Verifica `player.gold >= buy × qty` |
| `executeBuy(player, itemDef, qty)` | Subtrai ouro, adiciona ao inventário |
| `canSell(player, itemDef, qty)` | Verifica quantidade no inventário + item vendável |
| `executeSell(player, itemDef, qty)` | Adiciona ouro, remove do inventário |
| `getSellableInventory(player, allItems)` | Lista itens do inventário que podem ser vendidos |

### 24.2 Regras de Preço

```javascript
getSellPrice(itemDef):
  se itemDef.price.sell existe → usa sell
  senão → floor(itemDef.price.buy × 0.50)  // 50% do preço de compra
```

**Itens não vendáveis:** `sell === null` ou ausente sem `price.buy`.

---

## 25. Suíte de Testes

> Comando: `npx vitest run` | `npx vitest run --coverage`
> Total atual: **2.228 testes passando em 67 arquivos** (após Canon Fase 5)

### 25.1 Cobertura por Subsistema

| Subsistema | Arquivo(s) de teste | Testes approx. |
|-----------|-------------------|---------------|
| Canon Loader (Fases 1–2) | `tests/canonLoader.test.js` | ~40 |
| Species Bridge (Fase 3.x) | `tests/speciesBridge.test.js` | ~50 |
| Species Passives (Fase 4.x) | `tests/speciesPassives*.test.js` | ~120 |
| Slot Unlocks (Fase 5) | `tests/slotUnlocks.test.js` | ~30 |
| XP e Level-up | `tests/xpCore.test.js`, `tests/xpActions.test.js` | ~90 |
| Combate Wild | `tests/wildCombatAudit.test.js`, `tests/wildPlayerActions.test.js` | ~100 |
| Captura Wild | `tests/wildCaptureFlow.test.js` | ~50 |
| Primeiro Combate | `tests/firstCombatAudit.test.js` | ~50 |
| Combate em Grupo | `tests/groupIntegration.test.js`, `tests/groupBattleEnd.test.js`, `tests/groupFinalUnification.test.js` | ~120 |
| Data Loaders | `tests/dataLoader.test.js`, `tests/skillsLoader.test.js`, `tests/itemsLoader.test.js` | ~80 |
| Shop System | `tests/shopSystem.test.js` | ~40 |
| Save / Storage | `tests/storage.test.js`, `tests/saveLayer.test.js` | ~60 |
| Game Flow / Quests | `tests/gameFlow.test.js`, `tests/questSystem.test.js` | ~80 |
| Canon (wildCore) | `tests/wildCore.test.js` | ~60 |

### 25.2 Padrões de Teste Obrigatórios

```javascript
import { describe, it, expect } from 'vitest';
import { funcaoTestada } from '../js/path/to/module.js';

describe('NomeDoMódulo', () => {
    // Arrange / Act / Assert
    it('deve calcular XP corretamente para inimigo nível 1 comum', () => {
        // (15 + 1×2) × 1.0 = 17
        expect(calcBattleXP({level: 1, rarity: 'Comum'}, null, cfg)).toBe(17);
    });
});
```

**Regras:**
1. Testes independentes entre si (sem dependência de ordem)
2. Funções puras com Dependency Injection → nenhum teste acessa `window` ou `document`
3. Comentar cálculos esperados (ex: `// (15 + 1*2) * 1.0 = 17`)
4. Não remover testes existentes — criar novos se comportamento mudar

---

## 26. Catálogo Completo de Monstrinhos (64 entradas)

> Source of truth: `data/monsters.json`

### 26.1 Monstrinhos Iniciais / Comuns (Starters e Comuns de campo)

| ID | Nome | Classe | Raridade | HP Base |
|----|------|--------|---------|--------:|
| MON_001 | Cantapau | Bardo | Comum | 28 |
| MON_002 | Pedrino | Guerreiro | Comum | 32 |
| MON_003 | Faíscari | Mago | Comum | 26 |
| MON_004 | Ninfolha | Curandeiro | Comum | 30 |
| MON_005 | Garruncho | Caçador | Comum | 29 |
| MON_006 | Lobinho | Animalista | Comum | 31 |
| MON_007 | Trovão | Bárbaro | Comum | 33 |
| MON_008 | Sombrio | Ladino | Comum | 27 |
| MON_100 | Rato-de-Lama | Guerreiro | Comum | 20 |

### 26.2 Linhas Evolutivas Completas

| Linha | Estágio 1 (Comum) | HP | → Estágio 2 (Incomum) | HP | → Estágio 3 (Raro) | HP | → Estágio 4 (Místico) | HP |
|-------|-----------------|---:|---------------------|---:|-------------------|---:|---------------------|---:|
| **Guerreiro** | MON_002 Pedrino | 32 | MON_002B Pedronar | 42 | MON_002C Pedragon | 56 | — | — |
| **Guerreiro** | MON_010 Ferrozimon | 29 | MON_010B Cavalheiromon | 39 | MON_010C Kinguespinhomon | 50 | MON_010D Arconouricomon | 63 |
| **Guerreiro** | MON_026 Cascalhimon | 30 | MON_026B Muralhimon | 41 | MON_026C Bastiaomon | 54 | — | — |
| **Bárbaro** | MON_007 Trovão | — | — | — | — | — | — | — |
| **Bárbaro** | MON_021 Tamborilhomon | 32 | MON_021B Rufamon | 43 | MON_021C Trovatambormon | 56 | — | — |
| **Bárbaro** | MON_029 Tigrumo | 34 | MON_029B Rugigron | 46 | MON_029C Bestigrar | 60 | — | — |
| **Mago** | MON_003 Faíscari | 26 | — | — | — | — | — | — |
| **Mago** | MON_014 Lagartomon | 24 | MON_014B Salamandromon | 30 | MON_014C Dracoflamemon | 39 | MON_014D Wizardragomon | 48 |
| **Mago** | MON_024 Coralimon | 24 | MON_024B Recifalmon | 32 | MON_024C Abissalquimon | 41 | — | — |
| **Curandeiro** | MON_004 Ninfolha | 30 | — | — | — | — | — | — |
| **Curandeiro** | MON_020 Gotimon | 26 | MON_020B Lirialmon | 33 | MON_020C Serafloramon | 43 | — | — |
| **Curandeiro** | MON_028 Nutrilo | 28 | MON_028B Silvelio | 37 | MON_028C Auravelo | 48 | — | — |
| **Bardo** | MON_001 Cantapau | 28 | — | — | — | — | — | — |
| **Bardo** | MON_011 Dinomon | 27 | MON_011B Guitarapitormon | 35 | MON_011C TRockmon | 46 | MON_011D Giganotometalmon | 60 |
| **Bardo** | MON_027 Zunzumon | 22 | MON_027B Melodimon | 28 | MON_027C Rainhassommon | 36 | — | — |
| **Ladino** | MON_008 Sombrio | 27 | — | — | — | — | — | — |
| **Ladino** | MON_022 Corvimon | 23 | MON_022B Noxcorvomon | 30 | MON_022C Umbraquimonom | 37 | — | — |
| **Ladino** | MON_030 Furtilhon | 24 | MON_030B Velurino | 31 | MON_030C Sombrifur | 40 | — | — |
| **Caçador** | MON_005 Garruncho | 29 | — | — | — | — | — | — |
| **Caçador** | MON_013 Miaumon | 25 | MON_013B Gatunamon | 32 | MON_013C Felinomon | 42 | MON_013D Panterezamon | 54 |
| **Caçador** | MON_025 Pulimbon | 24 | MON_025B Flecharelmon | 30 | MON_025C Relampejomon | 38 | — | — |
| **Animalista** | MON_006 Lobinho | 31 | — | — | — | — | — | — |
| **Animalista** | MON_012 Luvursomon | 31 | MON_012B Manoplamon | 41 | MON_012C BestBearmon | 54 | MON_012D Ursauramon | 68 |
| **Animalista** | MON_023 Cervimon | 28 | MON_023B Galhantemon | 36 | MON_023C Bosquidalmon | 46 | — | — |

**Regra de evolução:** raridade sobe a cada estágio (Comum → Incomum → Raro → Místico).

---

## 27. Catálogo de Itens Completo

> Source of truth: `data/items.json`

### 27.1 Itens Equipáveis (Held Items)

| ID | Nome | Tier | ATK | DEF | Quebra (chance) | Compra |
|----|------|------|----:|----:|:--------------:|------:|
| IT_ATK_COMUM | Amuleto de Força | Comum | +2 | 0 | 15% | 50 |
| IT_DEF_COMUM | Escudo Leve | Comum | 0 | +2 | 15% | 50 |
| IT_ATK_INCOMUM | Colar de Poder | Incomum | +4 | 0 | 10% | 120 |
| IT_DEF_INCOMUM | Armadura Reforçada | Incomum | 0 | +4 | 10% | 120 |
| IT_BALANCED_INCOMUM | Cristal Equilibrado | Incomum | +2 | +2 | 10% | — |
| IT_ATK_RARO | Garra do Dragão | Raro | +6 | 0 | 5% | — |
| IT_DEF_RARO | Couraça de Titã | Raro | 0 | +6 | 5% | — |
| IT_BALANCED_RARO | Emblema do Guerreiro | Raro | +3 | +3 | 5% | — |
| IT_ATK_MISTICO | Orbe de Destruição | Místico | +8 | 0 | **indestrutível** | — |
| IT_DEF_MISTICO | Égide Mística | Místico | 0 | +8 | **indestrutível** | — |
| IT_ATK_LENDARIO | Lâmina Eterna | Lendário | +12 | 0 | **indestrutível** | — |
| IT_DEF_LENDARIO | Escudo do Infinito | Lendário | 0 | +12 | **indestrutível** | — |
| IT_BALANCED_LENDARIO | Coração do Campeão | Lendário | +6 | +6 | **indestrutível** | — |

**Regras de quebra:**
- Item quebra apenas se o monstro **participou** da batalha (`participatedThisBattle = true`)
- Quebra ocorre no **final** da batalha (vitória/derrota/fuga)
- Itens Místicos e Lendários: `break.enabled = false` → nunca quebram
- Item que quebra é **removido permanentemente** (não volta ao inventário)

### 27.2 Itens de Cura

| ID | Nome | Cura (%) | Cura mínima (HP) | Compra | Venda |
|----|------|--------:|----------------:|------:|------:|
| IT_HEAL_01 | Petisco de Cura | 30% | 30 HP | 20 | 5 |
| IT_HEAL_02 | Ração Revigorante | 55% | 60 HP | 50 | 15 |
| IT_HEAL_03 | Elixir Máximo | 100% | 999 HP | 200 | 60 |

**Fórmula:** `HP curado = max(heal_min, hpMax × heal_pct)`

### 27.3 Itens de Captura (ClasterOrbs)

| ID | Nome | Bônus de Captura | Compra | Venda | Obs |
|----|------|----------------:|------:|------:|-----|
| CLASTERORB_COMUM | ClasterOrb Comum | +0 pp | 30 | 10 | Base sem bônus |
| CLASTERORB_INCOMUM | ClasterOrb Incomum | +10 pp | 80 | 25 | |
| CLASTERORB_RARA | ClasterOrb Rara | +20 pp | 150 | 50 | |
| IT_CAP_02 | Orbe Reforçado | +10 pp | 80 | 25 | **Deprecated** → usar CLASTERORB_INCOMUM |

**Como funciona o `capture_bonus_pp`:** percentual adicional somado ao threshold base da raridade. Ex: Comum base 60% + +10 pp = threshold 70%.

### 27.4 Ovos

| ID | Nome | Raridade garantida | Compra | Venda |
|----|------|--------------------|------:|------:|
| EGG_C | Ovo Comum | Comum | 120 | 59 |
| EGG_U | Ovo Incomum | Incomum | 300 | 149 |
| EGG_R | Ovo Raro | Raro | 750 | 374 |
| EGG_M | Ovo Místico | Místico | 1500 | 749 |
| EGG_L | Ovo Lendário | Lendário | 3000 | 1499 |

**Mecânica:** `hatch_egg` com `mode: "by_rarity"` → `hatchEggFromInventory()` em `index.html` usa `createMonsterInstanceFromTemplate()` (pipeline canônico com speciesBridge).

---

## 28. Mapa de Locais e Encounter Pools

> Source of truth: `data/locations.json`

| ID | Nome | Bioma | Nível Rec. | Pool de Encontros | Pool Raro |
|----|------|-------|:----------:|-------------------|-----------|
| LOC_001 | Campina Inicial | campos | 1–4 | MON_100, MON_002, MON_001, MON_004 | — |
| LOC_002 | Floresta Verde | floresta | 3–10 | MON_006, MON_023, MON_004, MON_020, MON_005, MON_001 | MON_023B, MON_020B |
| LOC_003 | Minas e Cavernas | minas | 6–15 | MON_010, MON_026, MON_002, MON_100 | MON_010B, MON_026B, MON_002B |
| LOC_004 | Ruínas Antigas | ruinas | 10–20 | MON_022, MON_008, MON_003, MON_011 | — |
| LOC_005 | Costa e Lagos | agua | 8–18 | MON_024, MON_020, MON_025, MON_004 | — |
| LOC_006 | Zona Vulcânica | vulcao | 15–28 | MON_014, MON_007, MON_021, MON_014B, MON_021B | — |
| LOC_007 | Floresta Noturna | floresta_noturna | 12–25 | MON_022, MON_008, MON_013, MON_022B, MON_013B | — |
| LOC_008 | Arena dos Conflitos | arena | 20–35 | MON_012B, MON_021B, MON_010B, MON_026B, MON_025B, MON_027B | — |

**Notas:**
- LOC_001 e LOC_002 mapeiam para QST_001–004 (caminho principal)
- LOC_005 (Costa) e LOC_007 (Floresta Noturna) são rotas opcionais
- LOC_008 (Arena) usa Incomuns no pool principal — local de alta dificuldade

---

## 29. Matriz de Balanceamento — Habilidades por Classe

> Source of truth: `docs/MATRIZ_MESTRA_BALANCEAMENTO.md`

### 29.1 Habilidades por Slot (todas as classes)

| Classe | Slot 1 (básico, ENE=0) | Slot 2 (ENE=2) | Slot 3 (ENE=3) | Slot 4 — Assinatura (ENE=4) |
|--------|----------------------|----------------|----------------|---------------------------|
| Guerreiro | Golpe Firme (PWR 3) | Corte Pesado (PWR 5) | Postura Defensiva (Defesa) | Proteger Aliado |
| Bárbaro | Pancada Selvagem (PWR 4) | Golpe Brutal (PWR 6) | Fúria (auto-buff) | **Berserk** (PWR 7, risco alto) |
| Mago | Rajada Arcana (PWR 3) | Explosão Etérea (PWR 5) | Prisão de Energia (controle, máx 2t) | **Tempestade Arcana** (PWR 6, área) |
| Curandeiro | Toque Vital (PWR 2) | Cura Simples (cura aliado) | Benção Suave (buff aliado) | **Cura em Área** (PWR 5, coletiva) |
| Bardo | Nota Cortante (PWR 2) | Canção de Coragem (buff aliados) | Eco Desafinador (debuff, máx 2t) | **Concerto de Guerra** (buff+debuff coletivo) |
| Ladino | Corte Rápido (PWR 3) | Golpe Sorrateiro (dano condicional) | Passo Sombrio (mobilidade) | **Execução** (PWR 7, requer HP baixo do alvo) |
| Caçador | Disparo Preciso (PWR 3) | Tiro Reforçado (PWR 5) | Marcar Alvo (setup) | **Tiro do Predador** (PWR 6, requer marcação) |
| Animalista | Ataque Instintivo (PWR 3) | Postura Selvagem (adaptação) | Chamado da Natureza (utilidade) | **Forma Bestial** (PWR 5, transformação) |

### 29.2 Regras Canônicas de Design de Habilidades

| # | Regra | Resumo |
|---|-------|--------|
| 1 | DEF dividida | Confronto usa `teto(DEF/2)`; Dano usa `piso(DEF/2)` como mitigação |
| 2 | Assinatura ≠ só dano | Assinatura define papel tático único (não apenas "mais dano") |
| 3 | Toda força tem contrapartida | Custo / posição / setup / condição de alvo / duração / risco |
| 4 | Suporte coletivo curto | Buff/debuff em área: máximo 2–3 turnos + custo real de ENE |
| 5 | Dano máximo condicional | Dano alto exige setup ou condição — nunca automático |
| 6 | Básico sempre relevante | Slot 1 (ENE=0) deve ser útil — nenhuma classe morta sem energia |
| 7 | Versatilidade ≠ superioridade | Animalista adapta, não domina todos os eixos |

### 29.3 Faixas de RC (Resultado do Confronto) — Sistema d20 Bilateral

> Fórmula completa: `RC = d20_atk + ATK + ceil(ATK/2) + mod_classe - d20_def - ceil(DEF/2)`

| RC | Nome da Faixa | Mult. Dano |
|---:|--------------|:----------:|
| ≤ −8 | Falha total | 0 |
| −7 a −3 | Contato neutralizado | 0 ou 1 HP |
| −2 a +3 | Acerto reduzido | ×0.60 |
| +4 a +10 | Acerto normal | ×1.00 |
| +11 ou mais | Acerto forte | ×1.25 |

**Casos especiais:**

| Situação | Modificador |
|----------|------------|
| 20 natural (ataque) | +4 confronto, +20% dano |
| 1 natural (ataque) | −6 confronto |
| 20 natural (defesa) | +5 confronto defensivo |
| 1 natural (defesa) | −4 confronto defensivo |
| Atacante 10+ níveis abaixo + acerto fraco | Dano ilusório = 1 HP |

---

## 30. Sistema de XP e Progressão

> Source of truth: `js/progression/xpCore.js`, `js/progression/xpActions.js`

### 30.1 Fórmula de XP de Batalha (xpCore.js)

```
xpBase = battleXpBase (padrão: 15)
xp = floor((xpBase + level × 2) × rarityMult)
Se boss: xp = floor(xp × 1.5)
```

**Multiplicadores de raridade (RARITY_XP):**

| Raridade | Multiplicador |
|----------|:-------------:|
| Comum | 1.00 |
| Incomum | 1.05 |
| Raro | 1.10 |
| Místico | 1.15 |
| Lendário | 1.25 |

**Exemplos:**
- Inimigo Lv1 Comum: `(15 + 1×2) × 1.0 = 17 XP`
- Inimigo Lv5 Raro: `(15 + 5×2) × 1.10 = 27.5 → 27 XP`
- Boss Lv10 Místico: `(15 + 10×2) × 1.15 × 1.5 = 60.375 → 60 XP`

### 30.2 Pipeline de giveXP (xpActions.js)

```
giveXP(deps, mon, amount, log)
  1. ensureMonsterProgressFields(mon)
  2. getFriendshipBonuses(mon.friendship) → xpMultiplier
  3. xpGain = round(amount × xpMultiplier)
  4. mon.xp += xpGain
  5. LOOP enquanto mon.xp >= mon.xpNeeded:
       mon.xp -= mon.xpNeeded
       levelUpMonster(deps, mon, log)
```

**Bônus de amizade em XP:**

| Amizade | Multiplicador |
|--------:|:-------------:|
| 0–24 | ×0.95 |
| 25–49 | ×1.00 |
| 50–74 | ×1.05 |
| 75–99 | ×1.10 |
| 100 | ×1.15 |

### 30.3 Pipeline de Level Up (xpActions.js)

```
levelUpMonster(deps, mon, log)
  1. hpPctBeforeLevelUp = hp / hpMax (para preservar em evolução)
  2. mon.level++
  3. mon.hpMax = floor(hpMax × 1.04 + 2)
  4. mon.hp = mon.hpMax  (cura completa ao subir)
  5. mon.eneMax = 10 + 2 × (level - 1)
  6. mon.ene = mon.eneMax
  7. recalculateStatsFromTemplate(mon)
  8. mon.xpNeeded = round(40 + 6×level + 0.6×level²)
  9. updateFriendship(mon, 'levelUp') → +3 amizade
 10. maybeEvolveAfterLevelUp(mon, log, hpPctBeforeLevelUp)
 11. maybeUpgradeSkillsModelB(mon, log)
```

### 30.4 XP Necessário por Nível (tabela resumida)

| Lv | XP Necessário | Lv | XP Necessário | Lv | XP Necessário |
|---:|--------------:|---:|--------------:|---:|--------------:|
| 1 | 47 | 11 | 193 | 21 | 513 |
| 2 | 55 | 12 | 219 | 25 | 697 |
| 3 | 65 | 13 | 247 | 30 | 1,012 |
| 5 | 91 | 15 | 310 | 40 | 1,882 |
| 8 | 148 | 18 | 407 | 50 | 3,052 |
| 10 | 170 | 20 | 460 | 100 | 10,640 |

*Fórmula: `round(40 + 6×L + 0.6×L²)`*

### 30.5 Distribuição de XP em Grupo

```
Se enc.type inclui "group" ou "boss":
  Para cada pid em enc.participants:
    player = players.find(pid)
    mon = player.team[activeIndex]  // BUG FIX: activeIndex, não sempre team[0]
    Se mon vivo: giveXP(deps, mon, xp)
Senão (1v1):
  player = enc.selectedPlayerId ou players[0]
  mon = player.team[activeIndex]
  giveXP(deps, mon, xp)
```

---

## 31. Canon Fase 6 — Kit Swap (kitSwap.js)

> Source of truth: `js/canon/kitSwap.js` | Memória: Fase 6

### 31.1 Conceito

Kit Swap permite que espécies canônicas **substituam uma habilidade** de seu kit padrão de classe por uma habilidade assinatura mais adequada ao arquétipo da espécie.

### 31.2 Configuração por Espécie

| Espécie | Slot modificado | Habilidade substituída | Conceito da nova habilidade |
|---------|:--------------:|------------------------|----------------------------|
| shieldhorn | Slot 1 | warrior_basic_strike | Básico mais pesado e menos veloz |
| emberfang | Slot 4 | barbarian_berserk | Explosão de 1 turno ainda mais agressiva |
| moonquill | Slot 4 | mage_arcane_storm | Assinatura com menos dano e mais controle |
| floracura | Slot 4 | healer_group_heal | Cura em área mais fraca, porém mais eficiente |

### 31.3 API de kitSwap.js

```javascript
applyKitSwaps(instance, skills)
  // Aplica kit_swap canônico à instância
  // Respeita unlockedSkillSlots: slot 4 só aplica se level >= 30
  // instance.appliedKitSwaps = ['shieldhorn_slot1'] // swaps aplicados
  // instance.blockedKitSwaps = ['emberfang_slot4']  // swaps bloqueados por nível
```

- `window.KitSwap` exposto globalmente
- Chamado na etapa 5d de `createMonsterInstanceFromTemplate()` em `index.html`
- **2.268 testes passando** em 68 arquivos após integração

---

## 32. Arquitetura de Módulos JavaScript

> Mapa completo de `/js/` e suas responsabilidades

### 32.1 Camada Canon (`js/canon/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `canonLoader.js` | Carrega 6 JSONs em paralelo; expõe APIs de consulta (getSpeciesData, getEvolutionLine, getLevelMilestones, getClassGrowthRule, etc.) |
| `speciesBridge.js` | Mapeia templateIds runtime → espécies canônicas; aplica offsets de stats; detecção de drift; `createMonsterInstanceFromTemplate()` |
| `speciesPassives.js` | `resolvePassiveModifier(instance, context)` — 4 passivas: shieldhorn, emberfang, moonquill, floracura |
| `slotUnlocks.js` | `getUnlockedSlotsForLevel(level)` → 1/2/3/4 slots |
| `kitSwap.js` | `applyKitSwaps(instance, skills)` — substitui habilidades por assinaturas de espécie |
| `index.js` | Re-exports do subsistema canon |

### 32.2 Camada Combate (`js/combat/`)

| Arquivo | Status | Responsabilidade |
|---------|:------:|-----------------|
| `wildCore.js` | ✅ Canônico | Funções puras: `checkHit`, `calcDamage`, `getBuffModifiers`, `resolveD20Hit` |
| `wildActions.js` | ✅ Canônico | Pipelines de batalha wild: `executeWildAttack`, `executeWildSkill`, `executeWildCapture`, etc. |
| `groupCore.js` | ✅ Canônico | Funções puras de grupo: `getCurrentActor`, `hasAlivePlayers`, `createGroupEncounter`, `calculateTurnOrder` |
| `groupActions.js` | ✅ Canônico | `advanceGroupTurn`, `executeGroupFlee`; injeção de deps |
| `groupUI.js` | ✅ Canônico | `enterAttackMode`, `enterSkillMode`, `handleEnemyClick`, `cancelTargetMode` |
| `groupRewards.js` | ✅ Canônico | `processGroupVictoryRewards` (idempotente com flags) |
| `groupIntegration.js` | ✅ Canônico | `buildGroupCombatDeps`, `buildGroupRewardsDeps`, `buildGroupUIRenderDeps` |
| `itemBreakage.js` | ✅ Canônico | Quebra de itens: `handleHeldItemBreak`, `processBattleItemBreakage`, `getHeldItemBonuses` |
| `groupBattleState.js` | ⚠️ Protótipo | Shape do GroupBattleState (referência arquitetural) |
| `groupBattleLoop.js` | ❌ Deprecated | Protótipo de loop imutável — NÃO conectado à UI real |
| `index.js` | — | Re-exports centralizados (`Combat.Wild`, `Combat.Group`, `Combat.ItemBreakage`) |

### 32.3 Camada Progressão (`js/progression/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `xpCore.js` | `calculateBattleXP(enemy, type, config)` — função pura |
| `xpActions.js` | `giveXP`, `levelUpMonster`, `handleVictoryRewards`, `recalculateStatsFromTemplate` — com DI |

### 32.4 Camada de Dados (`js/data/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `dataLoader.js` | Carrega `monsters.json`, `locations.json`; indexa por ID |
| `skillsLoader.js` | Carrega `skills.json`; indexa por classe e ID |
| `itemsLoader.js` | Carrega `items.json`; `getItemById(id)` |
| `questSystem.js` | `QUESTS_DATA` estático (16 quests); `getQuest`, `isQuestAvailable`, `getNextQuest` |

### 32.5 Outros Módulos Raiz (`js/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `storage.js` | `StorageManager` — localStorage transacional com fallbacks |
| `saveLayer.js` | `SaveLayer` — abstração de save/load com arquitetura auto-save + slots |
| `gameFlow.js` | Loop jogável: ativação/progressão/conclusão de quests pós-encontro |
| `shopSystem.js` | `executeBuy`, `executeSell`, `getSellPrice`, `getSellableInventory` |

### 32.6 Módulos de UI (`js/ui/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `battleEndModal.js` | Modal de fim de batalha |
| `eggHatchModal.js` | Modal de chocamento de ovo |
| `friendlyBattleLog.js` | Log de batalha amigável (texto para criança) |
| `partyDexUI.js` | UI do Monstródex |
| `targetSelection.js` | Seleção de alvo em combate em grupo |

### 32.7 Pipeline de Boot (index.html)

```
1. carregarDados() — dataLoader + skillsLoader + itemsLoader
2. applyCanonToConfig() — carrega class_matchups.json via canonLoader
3. Inicializar GameState com config canônica
4. Criar jogadores com createMonsterInstanceFromTemplate():
   a. createBaseInstance(templateId)
   b. speciesBridge.resolveAndApply(instance)   → offsets de stats
   c. slotUnlocks.getUnlockedSlotsForLevel()    → unlockedSkillSlots
   d. kitSwap.applyKitSwaps(instance, skills)   → kit_swap de espécie
5. _resolveUnlockedSlots(instance)              → fallback de slots
6. Renderizar UI inicial
```

---

## 33. Glossário Técnico Expandido

| Termo | Definição |
|-------|-----------|
| `enc` | Objeto de encontro (battle state do encontro atual) |
| `deps` | Objeto de dependências injetadas (DI pattern) |
| `MI` | Monster Instance — instância única de um Monstrinho |
| `templateId` | ID do template de Monstrinho no catálogo (ex: `MON_010`) |
| `uid` | ID único de instância de Monstrinho (ex: `mi_001`) |
| `canonSpeciesId` | Espécie canônica resolvida (ex: `shieldhorn`) |
| `canonAppliedOffsets` | Offsets de stats aplicados pela speciesBridge |
| `unlockedSkillSlots` | Número de slots de habilidade desbloqueados (1–4) |
| `_slotUnlockSource` | Fonte do unlock: `'canon'` ou `'fallback'` |
| `appliedKitSwaps` | Array de swaps aplicados (ex: `['shieldhorn_slot1']`) |
| `blockedKitSwaps` | Array de swaps bloqueados por nível insuficiente |
| `passiveState` | Estado de passivas no encounter (`shieldhornBlockedThisTurn`, `floracuraHealUsed`) |
| `participatedThisBattle` | Flag temporária de ItemBreakage (não persiste em save) |
| `heldItemId` | ID do item equipado no Monstrinho |
| `activeIndex` | Índice do Monstrinho ativo no `player.team[]` |
| `questState` | Objeto em `player` com `activeQuestIds`, `completedQuestIds`, `progress` |
| `rewardsGranted` | Flag idempotente de recompensas de vitória |
| `moneyGranted` | Flag idempotente de concessão de ouro em batalha de grupo |
| `dropsGranted` | Flag idempotente de concessão de drops em batalha de grupo |
| `questsProcessed` | Flag idempotente de processamento de quests em batalha de grupo |

---

## 34. Dependências Externas e Padrões de DI

### 34.1 Objeto `deps` Padrão (Combate Wild)

```javascript
deps = {
    state: GameState,                    // Estado global
    constants: {
        battleXpBase: 15,
        rarityXP: { Comum: 1.0, ... },
        DEFAULT_FRIENDSHIP: 50,
        // ... outras constantes
    },
    helpers: {
        ensureMonsterProgressFields,
        getFriendshipBonuses,
        updateFriendship,
        calcXpNeeded,
        calculateBattleXP,
        recalculateStatsFromTemplate,
        maybeEvolveAfterLevelUp,
        maybeUpgradeSkillsModelB,
        updateStats,
        formatFriendshipBonusPercent,
        getSkillsArray,
    },
    audio: { play, sfx },
    ui: { showToast, render },
    save: SaveLayer,
    rollD20: () => Math.floor(Math.random() * 20) + 1,
}
```

### 34.2 Objeto `deps` de Grupo (groupIntegration.js)

| Factory | Deps incluídas |
|---------|---------------|
| `buildGroupCombatDeps(enc, ...args)` | state, players, rollD20, helpers.getSkillsArray, showToast |
| `buildGroupRewardsDeps(enc, ...args)` | state, players, xpActions, questSystem |
| `buildGroupUIRenderDeps(enc, ...args)` | renderFn, showToast, audio |

### 34.3 Regra de Dependency Injection

> Todas as funções puras recebem deps como parâmetro. **Nenhuma função pura acessa `window.GameState` diretamente.** `index.html` monta os `deps` e passa para os módulos.

---

## Referências Cruzadas

| Documento | Conteúdo |
|-----------|----------|
| `GAME_RULES.md` | Regras v1 e v2 do jogo (changelog completo) |
| `docs/COMBATE_FORMULA_V2.md` | Fórmula canônica de combate (d20 bilateral) |
| `docs/HABILIDADES_POR_CLASSE_V2.md` | Kit de habilidades por classe |
| `docs/ATRIBUTOS_BASE_POR_CLASSE_V2.md` | Atributos base Lv1 por classe |
| `docs/POSICIONAMENTO_V2.md` | Sistema de posicionamento em grupo |
| `docs/TABELA_ENCONTROS_V2.md` | Tabela de encontros e exploração |
| `design/canon/CANON_DECISIONS.md` | Registro de decisões de design canônicas |
| `design/canon/PHASE2_IMPLEMENTATION_NOTES.md` | Notas técnicas da Fase 2 do canon layer |
| `TODO_FUNCIONALIDADES.md` | Lista de funcionalidades pendentes |

---

*Documento gerado a partir do código real do repositório em 2026-04-03.*
*Próxima revisão obrigatória após Canon Fase 5 (kit_swap).*
