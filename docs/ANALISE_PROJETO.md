# 📊 Análise Completa do Projeto Monstrinhomon

**Data:** 2026-03-24
**Versão da Análise:** 1.0
**Escopo:** Status atual, comparação com Pokémon, lacunas e roadmap

---

## 📋 Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Status Atual do Projeto](#2-status-atual-do-projeto)
3. [Comparação de Mecânicas: Monstrinhomon vs Pokémon](#3-comparação-de-mecânicas-monstrinhomon-vs-pokémon)
4. [Análise de Código e Arquitetura](#4-análise-de-código-e-arquitetura)
5. [Lacunas Identificadas](#5-lacunas-identificadas)
6. [Sugestões Prioritárias](#6-sugestões-prioritárias)
7. [Roadmap de Progressão](#7-roadmap-de-progressão)
8. [Detalhamento Técnico das Sugestões](#8-detalhamento-técnico-das-sugestões)

---

## 1. Resumo Executivo

O Monstrinhomon é um RPG terapêutico infantil com mecânicas de captura de monstros e combate por turnos, voltado para crianças com TEA nível 1 e TDAH. O projeto está em estágio **intermediário de desenvolvimento**: possui uma base sólida de sistemas implementados (combate, captura, progressão, dados), mas ainda precisa de integração de fluxos, polimento de UI e implementação de sistemas complementares.

### Pontos Fortes
- ✅ Arquitetura modular e testável (25 módulos JS, 573 testes passando)
- ✅ Sistema de combate wild 1v1 completo com fórmulas bem definidas
- ✅ Sistema de captura determinístico original (sem dado)
- ✅ Progressão (XP, level-up, evolução) implementada e testada
- ✅ Dados do jogo bem estruturados (CSVs + JSONs)
- ✅ Sistema terapêutico com medalhas e objetivos
- ✅ Foco em uso terapêutico (diferencial único vs Pokémon)

### Pontos que Precisam de Atenção
- ⚠️ Batalhas em grupo parcialmente implementadas (state + loop ok, UI incompleta)
- ⚠️ Fluxo de jogo não conectado (menu → quest → batalha → recompensa)
- ⚠️ Dados de quests, drops e locais existem em CSV mas não estão integrados
- ⚠️ Apenas 10 monstros no catálogo (vs 8 classes disponíveis)
- ⚠️ Sem sprites, animações ou áudio

---

## 2. Status Atual do Projeto

### 2.1 Sistemas Implementados (✅ Completo)

| Sistema | Módulos | Testes | Status |
|---------|---------|--------|--------|
| **Combate Wild 1v1** | wildCore, wildActions, wildUI | 80+ testes | ✅ Completo |
| **Cálculo de Dano** | wildCore.calcDamage | 30+ testes | ✅ Completo |
| **Vantagens de Classe** | wildCore.getClassAdvantageModifiers | 20+ testes | ✅ Completo |
| **Captura Determinística** | captureSystem | 40+ testes | ✅ Completo |
| **XP e Level-up** | xpCore, xpActions | 50+ testes | ✅ Completo |
| **Evolução** | xpActions (checkEvolution) | 15+ testes | ✅ Completo |
| **Carregamento de Dados** | dataLoader, skillsLoader, itemsLoader | 50+ testes | ✅ Completo |
| **Sistema de Ovos** | eggHatcher, eggUI | 20+ testes | ✅ Completo |
| **Quebra de Itens** | itemBreakage | 15+ testes | ✅ Completo |
| **Caixa de Monstros** | boxSystem | 20+ testes | ✅ Completo |
| **Restrição de Classe** | classRestriction | 15+ testes | ✅ Completo |
| **Amizade (Friendship)** | Integrado no storage | Documentado | ✅ Completo |
| **Monstródex** | partyDex, partyDexUI | 20+ testes | ✅ Completo |
| **Persistência** | storage.js (localStorage) | Via integração | ✅ Completo |

### 2.2 Sistemas Parciais (⚠️ Em Progresso)

| Sistema | O Que Funciona | O Que Falta |
|---------|---------------|-------------|
| **Batalha em Grupo** | State management, loop básico, core functions | UI completa, integração com turnos de jogadores |
| **Action Panel** | Constraints de UI, seleção de alvo | Integração com loop de batalha completo |
| **Status Effects** | Framework definido (STUN, ROOT, etc.) | Integração completa em combate |
| **Habilidades em Batalha** | Dados de skills, custo de ENE | Interface de uso e aplicação de efeitos |

### 2.3 Sistemas Não Implementados (❌ Faltando)

| Sistema | Dados Existem? | Prioridade |
|---------|---------------|-----------|
| **Fluxo Menu → Quest → Batalha** | Parcial (QUESTS.csv) | 🔴 Alta |
| **Sistema de Quests** | ✅ QUESTS.csv (2 quests) | 🔴 Alta |
| **Sistema de Drops** | ✅ DROPS.csv | 🟡 Média |
| **Loja/Comércio** | ✅ ITENS.csv com preços | 🟡 Média |
| **Múltiplos Locais** | ✅ LOCAIS.csv (1 local) | 🟡 Média |
| **Tutorial Interativo** | ❌ | 🟡 Média |
| **Animação d20** | ❌ | 🟢 Baixa |
| **Sprites/Ícones** | ❌ | 🟢 Baixa |
| **Áudio** | ❌ | 🟢 Baixa |
| **Naturezas (Natures)** | ❌ | 🟢 Baixa |
| **Habilidades Passivas** | ❌ | 🟢 Baixa |

### 2.4 Métricas do Código

| Métrica | Valor |
|---------|-------|
| Arquivos JS | 25 |
| Linhas de código JS | ~5.300 |
| Arquivos de teste | 24 |
| Testes unitários | 573 (todos passando) |
| Linhas de teste | ~9.300 |
| Ratio teste/código | 1.75:1 (excelente) |
| Dependências runtime | 0 (vanilla JS) |
| Dependências dev | 1 (vitest) |
| Dados CSV | 20+ arquivos |
| Dados JSON | 3 arquivos |
| Documentação | 40+ arquivos MD |

---

## 3. Comparação de Mecânicas: Monstrinhomon vs Pokémon

### 3.1 Sistema de Tipos/Classes

| Aspecto | Pokémon | Monstrinhomon | Análise |
|---------|---------|---------------|---------|
| **Base** | 18 tipos elementais | 8 classes RPG | MM usa classes (Guerreiro, Mago, etc.) ao invés de elementos. Mais simples, adequado para crianças |
| **Vantagens** | Tabela tipo × tipo (dupla/tripla efetividade) | Ciclo de 7 classes (+1 neutra) | MM usa ciclo linear, mais fácil de memorizar |
| **Multiplicadores** | 0x, 0.25x, 0.5x, 1x, 2x, 4x | 0.9x, 1.0x, 1.1x | MM tem variação menor (±10%), mais equilibrado para crianças |
| **Bônus de acerto** | Não existe (tipo só afeta dano) | +2/-2 no d20 | MM adiciona vantagem no acerto além do dano (original) |
| **Dual-type** | Pokémon pode ter 2 tipos | Apenas 1 classe (dual-class planejada para evoluções) | Simplificação intencional |

**Sugestão:** O sistema de classes do MM é bem adaptado. Para evolução futura, considerar dual-class em estágio S3 (ex: Pedragon = Guerreiro+Mago) como já planejado no MONSTROS.csv.

### 3.2 Sistema de Combate

| Aspecto | Pokémon | Monstrinhomon | Análise |
|---------|---------|---------------|---------|
| **Turno** | Baseado em Speed (mais rápido age primeiro) | d20 físico + Speed | MM usa dado real rolado pela criança (diferencial terapêutico) |
| **Acerto** | Accuracy% (ex: 85% = 85 em 100) | d20 + ATK + bonus >= DEF | MM usa fórmula tipo D&D (d20), mais tátil e engajante |
| **Dano** | `((2*Level/5+2)*Power*A/D)/50+2)*STAB*Type*Critical*Random` | `floor(POWER * (ATK/(ATK+DEF))) * damageMult` | MM é mais simples, mas matematicamente sólido |
| **Crítico** | 1/24 base (6.25% no Gen IX) | d20 = 20 (5% base) | Valores similares, MM usa o d20 natural |
| **Miss** | Baseado em accuracy | d20 = 1 (sempre erra) | Pokémon não tem miss automático; MM tem (5%) |
| **STAB** | +50% se tipo do ataque = tipo do pokémon | Implícito (skills são da classe do monstro) | MM poderia adicionar bônus STAB para skills cross-class |
| **Fuga** | Sempre possível (trainer battles não) | d20 vs DC (12/16/18) | MM adiciona risco à fuga, mais interessante |

**Sugestão:** O sistema de combate do MM com d20 físico é um diferencial excelente para terapia (engajamento motor, contagem, espera de turno). O d20 precisa de animação visual para complementar o dado real.

### 3.3 Sistema de Captura

| Aspecto | Pokémon | Monstrinhomon | Análise |
|---------|---------|---------------|---------|
| **Mecânica** | Fórmula probabilística com shake checks | Determinístico (threshold por HP%) | MM é mais previsível — bom para crianças que precisam de clareza |
| **HP influência** | Menos HP = mais fácil | HP% <= Threshold = captura | Similar no conceito, MM é binário (sim/não) |
| **Status** | Sono/Paralisia dão bônus | Planejado (Status_bonus = 0 por enquanto) | Oportunidade futura |
| **Item de captura** | Pokéball, Great Ball, Ultra Ball, etc. | Orbe de Captura, Orbe Reforçado | MM tem menos variedade (2 itens vs 10+) |
| **Restrições** | Não captura Pokémon de treinadores | Não captura em batalha de grupo | Similar no conceito |
| **HP > 0** | Pode capturar com 1 HP | Requer HP > 0 (não captura desmaiado) | MM é mais restritivo mas faz sentido para pedagogia |

**Sugestão:** Adicionar 2-3 novos itens de captura com bônus diferentes (ex: Orbe Raro +20%, Orbe Mestre 95%) para dar mais opções estratégicas. Também considerar bônus de status (Atordoado = +5% threshold).

### 3.4 Progressão e Evolução

| Aspecto | Pokémon | Monstrinhomon | Análise |
|---------|---------|---------------|---------|
| **XP para nível** | Fórmula cúbica (6 growth rates) | `40 + 6*L + 0.6*L²` (quadrática) | MM tem curva mais suave, adequada para sessões curtas |
| **Evolução** | Nível, item, trade, amizade, etc. | Nível automático (trigger_level) | MM é mais simples, mas poderia ter mais triggers |
| **Linhas evolutivas** | 2-3 estágios, centenas de famílias | 2 linhas definidas (FAM_002: 3 estágios) | Precisa MUITO mais monstros e evoluções |
| **Stats growth** | EVs, IVs, Nature | growth_template por classe | MM é mais simples mas funcional |
| **Habilidades novas** | 1 nova a cada 3-5 níveis | Tier upgrade por stage (S0→S1→S2→S3) | MM agrupa skills por fase ao invés de nível individual |

**Sugestão:** Prioridade crítica: criar pelo menos 3-5 monstros por classe com linhas evolutivas completas. Sem variedade, o jogo perde rejogabilidade rapidamente.

### 3.5 Sistemas de Engajamento

| Aspecto | Pokémon | Monstrinhomon | Análise |
|---------|---------|---------------|---------|
| **Pokédex** | Catálogo visual de todos os monstros | ✅ Monstródex implementado | Funcional |
| **Amizade** | Happiness (0-255, evolução, moves) | ✅ Friendship (0-100, 5 níveis, bônus) | MM implementou com bônus terapêuticos |
| **Shiny** | 1/4096 variante visual rara | ✅ 1/100 brilhante (mais generoso) | Adaptado para crianças |
| **Achievements** | Badges dos ginásios | Sistema de medalhas Bronze/Prata/Ouro | MM usa medalhas terapêuticas (original) |
| **Trading** | Core feature (evolução por trade) | Planejado (incentivado pela restrição de classe) | A restrição "só usa sua classe" é genial para incentivar troca |
| **Naturezas** | 25 natures (+/-10% stat) | ❌ Não implementado | Adiciona personalização |
| **Habilidades passivas** | Abilities (1-3 por pokémon) | ❌ Não implementado | Adiciona profundidade |
| **Itens segurados** | Held items em batalha | ⚠️ Items de breakage implementados | MM tem sistema de breakage original |
| **Breeding** | Sistema de reprodução | ❌ Não implementado | Talvez "Fusão" no futuro |

### 3.6 Resumo Comparativo

```
SISTEMA DE COMBATE
  Pokémon:       ████████████████████░  (90%) - Complexo, profundo
  Monstrinhomon: ████████████░░░░░░░░░  (60%) - Base sólida, falta integração UI

CAPTURA
  Pokémon:       ██████████████████░░░  (85%) - Probabilístico, muitas opções
  Monstrinhomon: █████████████░░░░░░░░  (65%) - Determinístico, funcional mas poucos itens

PROGRESSÃO
  Pokémon:       ████████████████████░  (95%) - EVs, IVs, Natures, Move pools
  Monstrinhomon: ██████████████░░░░░░░  (70%) - XP/Level/Evolução ok, falta variedade

CONTEÚDO (MONSTROS)
  Pokémon:       ████████████████████░  (95%) - 1000+ pokémon
  Monstrinhomon: ███░░░░░░░░░░░░░░░░░  (15%) - 10 monstros (precisa urgente)

ENGAJAMENTO
  Pokémon:       ████████████████████░  (90%) - Pokédex, trade, contests, etc.
  Monstrinhomon: ████████░░░░░░░░░░░░░  (40%) - Monstródex, shiny, amizade ok

USO TERAPÊUTICO
  Pokémon:       ██░░░░░░░░░░░░░░░░░░░  (10%) - Não é foco
  Monstrinhomon: █████████████████░░░░  (80%) - Diferencial único e forte
```

---

## 4. Análise de Código e Arquitetura

### 4.1 Pontos Fortes da Arquitetura

1. **Funções puras testáveis**: `wildCore.js` e `xpCore.js` são completamente livres de side-effects, com injeção de dependência para config. Isso é excelente e deve ser mantido.

2. **Ratio de testes excelente**: 573 testes para ~5.300 linhas de código (1.75:1). Cobertura forte nos módulos core.

3. **Zero dependências runtime**: Todo o jogo roda com vanilla JS, sem frameworks. Isso mantém o projeto leve e fácil de distribuir como single HTML.

4. **Modularidade**: A separação em `combat/`, `data/`, `progression/`, `ui/` é limpa e facilita manutenção.

5. **Dados separados**: CSVs e JSONs em `/data` permitem ajuste de balanceamento sem tocar no código.

### 4.2 Pontos de Melhoria

1. **index.html monolítico**: Com 441KB, o arquivo principal contém muito código inline. Considerar migrar mais lógica para módulos JS separados.

2. **CSVs com fórmulas Excel**: `XP_TABLE.csv` e `MONSTROS.csv` contêm fórmulas VLOOKUP do Excel que não são parseáveis por JavaScript. Esses dados precisam ser "resolvidos" em valores concretos.

3. **Falta de sistema de eventos**: Não há um event bus ou pub/sub para comunicação entre módulos. Isso dificulta a integração de novos sistemas.

4. **Storage monolítico**: `storage.js` (19.8KB) centraliza toda a persistência, o que é bom para consistência mas pode crescer demais.

5. **Sem sistema de loading/routing**: Falta um gerenciador de telas/fluxo que conecte menu → quest → batalha → recompensa.

### 4.3 Comparação de Código com Pokémon

#### Fórmula de Dano

```javascript
// POKÉMON (Gen V+)
// damage = ((2*Level/5+2) * Power * A/D) / 50 + 2
//          * Targets * PB * Weather * Critical * random(0.85-1.00)
//          * STAB * Type1 * Type2 * Burn * other

// MONSTRINHOMON (wildCore.js)
// damage = floor(POWER * (ATK / (ATK + DEF))) * damageMult
// damageMult = classAdvantage (1.1/0.9/1.0)
// Mínimo: 1
```

A fórmula do MM é **significativamente mais simples** mas segue o mesmo princípio: poder do ataque escalado pela proporção ATK/DEF. A simplificação é intencional e adequada para o público-alvo.

**Diferença chave**: Pokémon usa Level na fórmula de dano diretamente; MM usa Level indiretamente (via stats que crescem com level). Isso cria curvas de dano diferentes, mas ambas são funcionais.

#### Fórmula de Captura

```javascript
// POKÉMON (Gen V+)
// a = ((3*maxHP - 2*curHP) * rate * bonusBall) / (3*maxHP) * bonusStatus
// shakeProb = 65536 / sqrt(sqrt(255/a))
// 4 shake checks, each must pass

// MONSTRINHOMON (captureSystem)
// hp_pct = hp / hpMax
// threshold = min(0.95, (base_by_rarity + item_bonus + status_bonus) * master_mult)
// captured = hp_pct <= threshold
```

MM usa sistema **determinístico** (sem dado) — mais previsível. Pokémon usa probabilidade com "shake checks" que criam tensão. Sugestão: manter o sistema determinístico mas adicionar feedback visual animado (barras de progresso, animação de captura) para criar tensão similar.

#### Fórmula de XP

```javascript
// POKÉMON (Gen V+)
// xp = (baseXP * level_wild * 1/S) * ((2*L+10)^2.5 / (L+level_wild+10)^2.5) + 1
// S = number of participating pokemon
// L = level of pokemon gaining XP
// Includes: Lucky Egg, Exp Share, Affection bonus, etc.

// MONSTRINHOMON (xpCore.js)
// xp = (battleXpBase + level*2) * rarityMult * (bossMult)
// xpNeeded = 40 + 6*L + 0.6*L²
```

MM tem fórmula mais simples mas funcional. A adição de `rarityMult` e `bossMult` dá variedade. A curva quadrática `40 + 6L + 0.6L²` é mais suave que a cúbica do Pokémon, o que é bom para sessões terapêuticas curtas.

---

## 5. Lacunas Identificadas

### 5.1 Lacunas Críticas (Bloqueiam Gameplay)

#### 🔴 L1: Falta de Fluxo Conectado
**Descrição**: Os sistemas existem isolados — não há um fluxo "menu → escolher quest → viajar → encontro → batalha → recompensa → próxima quest" funcional.
**Impacto**: Sem fluxo, o terapeuta precisa navegar manualmente entre abas, o que quebra a imersão.
**Referência Pokémon**: Pokémon tem um fluxo contínuo de cidade → rota → encontros → ginásio.

#### 🔴 L2: Catálogo de Monstros Insuficiente
**Descrição**: Apenas 10 monstros (8 iniciais + 2 evoluções de 1 família), mas 8 classes. Várias classes não têm monstros selvagens para capturar.
**Impacto**: Sem variedade, não há o que capturar, colecionar ou trocar.
**Referência Pokémon**: Pokémon Vermelho tinha 151 pokémon. Para MVP, recomenda-se mínimo 24 (3 por classe).

#### 🔴 L3: Batalha em Grupo Incompleta
**Descrição**: O state management e loop estão implementados, mas a UI e integração com ações de jogadores estão incompletas.
**Impacto**: Sem batalhas em grupo, o aspecto social/terapêutico (múltiplas crianças jogando juntas) está limitado.
**Referência Pokémon**: Pokémon tem batalhas duplas/triplas; MM precisa de batalha de party (1-6 jogadores).

### 5.2 Lacunas Importantes (Reduzem Engajamento)

#### 🟡 L4: Sistema de Quests Não Integrado
**Descrição**: QUESTS.csv tem 2 quests definidas, mas nenhum código as carrega ou executa.
**Impacto**: Sem quests, falta direção e objetivo para as sessões terapêuticas.

#### 🟡 L5: Sistema de Drops/Loot Não Integrado
**Descrição**: DROPS.csv existe com tabelas de drop, mas não está conectado ao fim de batalha.
**Impacto**: Sem drops, falta a recompensa material (itens) após batalhas.

#### 🟡 L6: Loja/Comércio Não Funcional
**Descrição**: Aba "Loja" existe na UI mas sem implementação.
**Impacto**: Sem loja, moedas são inúteis e itens não podem ser adquiridos.

#### 🟡 L7: Poucos Locais de Exploração
**Descrição**: LOCAIS.csv tem apenas 1 local (Campina Inicial).
**Impacto**: Sem exploração, falta a sensação de aventura e progressão geográfica.

### 5.3 Lacunas Menores (Polish & Engagement)

#### 🟢 L8: Sem Animações de Combate/Captura
**Descrição**: Ações de combate são instantâneas, sem animação visual.
**Sugestão**: Animações CSS simples (shake, flash, slide) para ataques; barra de progresso para captura.

#### 🟢 L9: Sem Tutorial Interativo
**Descrição**: Novas crianças não têm guia para aprender as mecânicas.
**Sugestão**: Tutorial com a quest QST_001 "O Ovo Perdido" já definida.

#### 🟢 L10: Naturezas/Personalidades Não Implementadas
**Descrição**: Pokémon tem 25 natures que afetam stats. MM poderia ter 5-8 versões simplificadas.
**Sugestão**: 5 naturezas (Corajoso, Ágil, Resiliente, Cauteloso, Equilibrado) com ±5% em stats.

---

## 6. Sugestões Prioritárias

### 6.1 Prioridade Imediata: Mais Monstros (L2)

O catálogo atual é o maior gargalo. Recomenda-se expandir para **mínimo 3 monstros por classe** (24 total), idealmente com linhas evolutivas.

**Proposta de expansão mínima:**

| Classe | Já Existe | Adicionar | Total |
|--------|-----------|-----------|-------|
| Guerreiro | Pedrino (3 formas) + Rato-de-Lama | +1 selvagem | 5 |
| Mago | Faíscari | +2 selvagens + 1 evolução | 4 |
| Curandeiro | Ninfolha | +2 selvagens + 1 evolução | 4 |
| Bárbaro | Trovão | +2 selvagens + 1 evolução | 4 |
| Ladino | Sombrio | +2 selvagens + 1 evolução | 4 |
| Bardo | Cantapau | +2 selvagens + 1 evolução | 4 |
| Caçador | Garruncho | +2 selvagens + 1 evolução | 4 |
| Animalista | Lobinho | +2 selvagens + 1 evolução | 4 |
| **Total** | **10** | **+23** | **33** |

### 6.2 Prioridade Alta: Conectar o Fluxo de Jogo (L1)

Criar um "Game Flow Manager" simples que conecte:

```
[Menu Principal]
    ↓
[Selecionar Quest Ativa]
    ↓
[Viajar para Local]
    ↓
[Encontro Aleatório ou Quest]
    ↓
[Batalha / Captura]
    ↓
[Recompensas (XP + Drops + Moedas)]
    ↓
[Voltar ao Mapa / Próxima Quest]
```

### 6.3 Prioridade Alta: Finalizar Batalha em Grupo (L3)

Completar a integração da UI de batalha em grupo com o loop e state já implementados. Componentes necessários:

1. Painel de seleção de ação por jogador
2. Indicador visual de turno atual
3. Animação de transição entre turnos
4. Distribuição de XP pós-batalha para todos

### 6.4 Prioridade Média: Integrar Quests e Drops (L4, L5)

1. Criar `questLoader.js` para carregar QUESTS.csv
2. Criar `dropSystem.js` para processar DROPS.csv
3. Conectar drops ao fim de batalha
4. Mostrar quest ativa na UI

### 6.5 Prioridade Média: Implementar Loja (L6)

1. Interface de compra/venda na aba Loja
2. Inventário do jogador visível
3. Preços dos ITENS.csv já definidos
4. Sistema de moedas (já rastreadas pelo estado)

### 6.6 Prioridade Baixa: Animações Simples (L8)

Adicionar animações CSS para:
- Ataque (shake do alvo)
- Dano (flash vermelho + número flutuante)
- Captura (barra de progresso animada)
- Level-up (glow dourado + confetti)
- Evolução (transição de sprite/emoji)

---

## 7. Roadmap de Progressão

### Fase 3A: Conteúdo Base (1-2 semanas)
**Foco**: Expandir o catálogo e dados do jogo

- [ ] Adicionar 15-20 novos monstros em `data/monsters.json`
- [ ] Criar linhas evolutivas para todos os starters (mínimo 2 formas cada)
- [ ] Adicionar 3-5 novos locais em LOCAIS.csv
- [ ] Expandir ENCOUNTERS.csv com encontros por local
- [ ] Adicionar 3-5 novas quests em QUESTS.csv
- [ ] Expandir skills.json (mínimo 3 skills por classe)
- [ ] Adicionar 3-5 novos itens em items.json

### Fase 3B: Fluxo de Jogo (2-3 semanas)
**Foco**: Conectar todos os sistemas em um gameplay loop

- [ ] Implementar Game Flow Manager (menu → quest → mapa → batalha → recompensa)
- [ ] Integrar questLoader.js
- [ ] Integrar dropSystem.js com fim de batalha
- [ ] Implementar navegação entre locais
- [ ] Completar UI de batalha em grupo
- [ ] Implementar loja básica (comprar/vender)

### Fase 4: Polish & UX (2-3 semanas)
**Foco**: Tornar o jogo visualmente agradável e intuitivo

- [ ] Tutorial interativo (quest "O Ovo Perdido")
- [ ] Animações CSS de combate (shake, flash, slide)
- [ ] Animação de captura (barra de progresso)
- [ ] Animação de level-up e evolução
- [ ] Feedback visual de vantagem de classe em batalha
- [ ] Indicador visual de turno em batalha de grupo
- [ ] Sonificação básica (opcional)

### Fase 5: Profundidade (3-4 semanas)
**Foco**: Adicionar camadas estratégicas ao jogo

- [ ] Sistema de Naturezas (5 personalidades: +5%/-5% em stats)
- [ ] Habilidades Passivas (1 por classe)
- [ ] Status Effects completos em combate (Atordoado, Enraizado, Envenenado, etc.)
- [ ] Sistema de troca entre jogadores
- [ ] Evolução por amizade (alternativa ao nível)
- [ ] Sistema de dificuldade (Fácil/Médio/Difícil)
- [ ] Encontros de Treinador com IA melhorada

### Fase 6: Terapia Avançada (2-3 semanas)
**Foco**: Potencializar o uso terapêutico

- [ ] Dashboard do terapeuta com gráficos de progresso
- [ ] Relatórios exportáveis (PDF/CSV)
- [ ] Objetivos terapêuticos customizáveis por sessão
- [ ] Histórico de sessões com análise
- [ ] Modo "pausa terapêutica" (pausa o jogo para intervenção)
- [ ] Sistema de recompensas terapêuticas integrado ao jogo

---

## 8. Detalhamento Técnico das Sugestões

### 8.1 Novos Monstros (Estrutura Sugerida)

Para cada classe, criar ao menos 3 monstros seguindo o padrão:

```json
{
  "id": "MON_XXX",
  "name": "NomeDoMonstro",
  "class": "Classe",
  "rarity": "Comum|Incomum|Raro",
  "stage": "S1",
  "baseHp": 25,
  "baseAtk": 6,
  "baseDef": 4,
  "baseSpd": 5,
  "baseEne": 7,
  "growthClass": "Classe",
  "evoFamily": "FAM_XXX",
  "isStarter": false,
  "description": "Descrição temática"
}
```

**Regras de balanceamento**:
- Comum: total de base stats entre 25-35
- Incomum: total entre 35-50
- Raro: total entre 50-65
- Stats devem refletir a classe (Guerreiro = alto HP/DEF, Mago = alto ATK/ENE, etc.)

### 8.2 Game Flow Manager (Pseudo-código)

```javascript
// js/gameFlow.js
export function startGameLoop(state) {
  switch (state.phase) {
    case 'menu':      return showMainMenu(state);
    case 'quest':     return showQuestSelection(state);
    case 'travel':    return showTravelScreen(state);
    case 'encounter': return startEncounter(state);
    case 'battle':    return runBattle(state);
    case 'reward':    return showRewards(state);
    case 'return':    return returnToMap(state);
  }
}
```

### 8.3 Quest Loader (Estrutura)

```javascript
// js/data/questLoader.js
export function loadQuests() {
  // Carrega QUESTS.csv
  // Retorna array de quests com:
  // - id, nome, descrição, local, prereqs
  // - rewards (xp, gold, item)
  // - next_quest (encadeamento)
}

export function getActiveQuest(playerId) {
  // Retorna quest ativa do jogador
}

export function completeQuest(playerId, questId) {
  // Marca quest como completa
  // Distribui recompensas
  // Ativa próxima quest
}
```

### 8.4 Drop System (Estrutura)

```javascript
// js/data/dropSystem.js
export function rollDrops(dropTableId) {
  // Carrega DROPS.csv
  // Para cada item na tabela:
  //   - Rola chance (Math.random() < chance)
  //   - Se sucesso, calcula qty entre min e max
  // Retorna array de { itemId, quantity }
}

export function applyDrops(playerId, drops) {
  // Adiciona itens ao inventário do jogador
  // Retorna log de itens ganhos
}
```

### 8.5 Naturezas Simplificadas (Proposta)

```javascript
// 5 naturezas para Monstrinhomon
const NATURES = {
  Corajoso:    { atk: 1.05, def: 0.95, label: '🗡️ Corajoso' },
  Ágil:        { spd: 1.05, hp:  0.95, label: '💨 Ágil' },
  Resiliente:  { def: 1.05, atk: 0.95, label: '🛡️ Resiliente' },
  Cauteloso:   { def: 1.05, spd: 0.95, label: '🧠 Cauteloso' },
  Equilibrado: { /* neutro */           label: '⚖️ Equilibrado' }
};
// Atribuído aleatoriamente na captura/criação
// Visível no card do monstrinho
```

---

## 📌 Conclusão

O Monstrinhomon está em um bom ponto de desenvolvimento com uma **base técnica sólida** (testes, modularidade, funções puras). O maior gap atual é **conteúdo** (monstros, quests, locais) e **integração de fluxo** (conectar os sistemas existentes em um gameplay loop). 

Comparado com Pokémon, o MM tem adaptações inteligentes para o contexto terapêutico (d20 físico, captura determinística, sistema de medalhas). As mecânicas core estão funcionais — agora é hora de **expandir conteúdo** e **conectar o fluxo** para criar uma experiência completa.

### Ações Imediatas Recomendadas
1. 🔴 **Expandir catálogo de monstros** (de 10 para 30+)
2. 🔴 **Implementar fluxo de jogo conectado** (menu → quest → batalha → recompensa)
3. 🔴 **Finalizar batalha em grupo** (completar UI)
4. 🟡 **Integrar quests e drops**
5. 🟡 **Implementar loja**
6. 🟢 **Adicionar animações e polish**

---

*Documento gerado com base na análise completa do código-fonte, dados, testes e documentação existente do projeto Monstrinhomon.*
