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
