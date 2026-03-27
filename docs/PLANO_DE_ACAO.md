# 🎯 PLANO DE AÇÃO — MONSTRINHOMON

> **Objetivo**: Este documento é um prompt estruturado para guiar uma IA (ou desenvolvedor)
> na implementação das próximas funcionalidades do Monstrinhomon.
> Cada seção contém: contexto, estrutura exata, regras, exemplos e critérios de aceitação.

---

## 📋 ÍNDICE

1. [AÇÃO 1 — Expandir skills.json (habilidades para TODAS as 8 classes)](#ação-1--expandir-skillsjson)
2. [AÇÃO 2 — Expandir EVOLUCOES.csv para starters originais](#ação-2--expandir-evolucoescsv-para-starters-originais)
3. [AÇÃO 3 — Expandir ENCOUNTERS.csv + LOCAIS.csv](#ação-3--expandir-encounterscsv--locaiscsv)
4. [AÇÃO 4 — Expandir QUESTS.csv (cadeia de 8-10 quests)](#ação-4--expandir-questscsv)
5. [AÇÃO 5 — Expandir DROPS.csv](#ação-5--expandir-dropscsv)
6. [AÇÃO 6 — Integrar Quest Loader no jogo](#ação-6--integrar-quest-loader)
7. [AÇÃO 7 — Implementar Loja básica](#ação-7--implementar-loja-básica)
8. [AÇÃO 8 — Fluxo de Jogo (Game Flow Manager)](#ação-8--fluxo-de-jogo)

---

## AÇÃO 1 — Expandir skills.json

### Problema
O arquivo `data/skills.json` tem **apenas 17 skills** cobrindo **5 classes** (Guerreiro: 8, Mago: 5, Curandeiro: 2, Caçador: 1, Bardo: 1). Faltam completamente skills para **Bárbaro**, **Ladino** e **Animalista** no JSON. Além disso, as classes que já têm skills no JSON possuem dados incompletos — o sistema real de skills do jogo usa o `SKILL_DEFS` no `index.html` que já cobre todas as 8 classes com sistema de tiers.

### Contexto: Dois Sistemas Coexistentes

O jogo tem **dois sistemas de skills** que precisam ser unificados:

#### Sistema 1: `data/skills.json` (estático, carregado por skillsLoader.js)
```json
{
  "id": "SK_WAR_01",
  "name": "Golpe de Escudo",
  "class": "Guerreiro",
  "category": "Controle",     // Ataque | Controle | Cura | Suporte
  "power": 6,
  "accuracy": 0.9,
  "energy_cost": 2,
  "target": "Inimigo",        // Inimigo | Aliado | Área | Self
  "status": "Atordoado",      // Status effect aplicado (opcional)
  "desc": "Ataque curto com chance de atordoar."
}
```

#### Sistema 2: `SKILL_DEFS` no index.html (dinâmico, tiered, usado pelo combate)
```javascript
SKILL_DEFS['Guerreiro'] = {
    'Golpe de Espada': [
        // tier 0 (stage 0) — forma base
        { tier: 1, name: 'Golpe de Espada I', type: 'DAMAGE', cost: 4, power: 18, desc: '...' },
        // tier 1 (stage 1) — primeira evolução
        { tier: 2, name: 'Golpe de Espada II', type: 'DAMAGE', cost: 6, power: 24, desc: '...' },
        // tier 2 (stage 2) — segunda evolução
        { tier: 3, name: 'Golpe de Espada III', type: 'DAMAGE', cost: 8, power: 30, desc: '...' }
    ],
    'Escudo': [ ... ],     // skill 2 (sempre disponível)
    'Provocar': [          // skill 3 (desbloqueada no stage >= 1)
        null,              // S0 não tem
        { tier: 2, ... },  // S1 desbloqueia
        { tier: 3, ... }   // S2 evolui
    ]
};
```

### Como o Jogo Atribui Skills a Monstros

Função `getMonsterSkills(monster)` no index.html:
- Busca `SKILL_DEFS[monster.class]`
- Pega as **2 primeiras skill lines** (sempre disponíveis em qualquer stage)
- Se `monster.stage >= 1`, pega a **3ª skill line** (desbloqueada na 1ª evolução)
- Retorna o skill do `tier = stage` de cada line
- **Resultado**: Monstro base (stage 0) tem 2 skills; evoluído (stage 1+) tem 3 skills

### O Que Fazer

Expandir `data/skills.json` para incluir TODAS as skills de TODAS as classes, seguindo a estrutura detalhada abaixo. O skills.json deve ser a **fonte canônica** de todas as skills. Depois, o SKILL_DEFS deve referenciar ou ser gerado a partir do JSON.

### Estrutura Esperada por Classe

Cada classe deve ter **3 skill lines** com **3 tiers** cada, seguindo a identidade da classe:

#### Regras de Design de Skills

| Princípio | Regra |
|-----------|-------|
| **Variedade de papéis** | Cada classe deve ter: 1 skill de dano, 1 de utilidade/buff/debuff, 1 especial (unlock na evo) |
| **Escalamento por tier** | Tier 1: poder base. Tier 2: ~30% mais forte. Tier 3: ~60% mais forte que tier 1 |
| **Custo ENE escalonado** | Tier 1: 4-5 ENE. Tier 2: 6-7 ENE. Tier 3: 8-12 ENE |
| **Accuracy** | Dano direto: 0.85-0.90. Buffs/heals: 1.00. Debuffs: 0.80-0.90 |
| **Identidade de classe** | Skills devem refletir o tema da classe (ver tabela abaixo) |
| **Público infantil** | Nomes divertidos, sem violência extrema. Usar verbos como "empurrar", "proteger", "animar" |

#### Identidade Tática de Cada Classe

| Classe | Papel | Identidade | Recurso ENE | Tipo Skill 1 | Tipo Skill 2 | Tipo Skill 3 (evo) |
|--------|-------|------------|-------------|--------------|--------------|---------------------|
| **Guerreiro** | Tank/DPS | Resistente, corpo a corpo | Baixo regen (10%) | DAMAGE (Espada) | BUFF-DEF (Escudo) | TAUNT (Provocar) |
| **Mago** | DPS Ranged | Dano alto, frágil | Alto regen (25%) | DAMAGE (Magia forte) | DAMAGE (AoE/controle) | DEBUFF ou DAMAGE especial |
| **Curandeiro** | Suporte | Cura e proteção | Alto regen (20%) | HEAL (Cura direta) | BUFF-ATK/DEF (Bênção) | HEAL+CLEANSE ou BUFF-AREA |
| **Bárbaro** | DPS Melee | Alto risco/recompensa | Baixo regen (10%) | BUFF-ATK c/ debuff DEF (Fúria) | DAMAGE (Golpe devastador) | DAMAGE+SELF-DAMAGE ou AoE |
| **Ladino** | DPS Rápido | Precisão, velocidade | Médio regen (15%) | DAMAGE (Ataque preciso) | DEBUFF-ATK (Enfraquecer) | DAMAGE+BONUS (Golpe Furtivo) |
| **Bardo** | Suporte/Buff | Músicas, inspiração | Médio-Alto regen (18%) | BUFF-ATK (Canção) | HEAL+BUFF-DEF (Calmante) | DEBUFF-AREA ou BUFF-AREA |
| **Caçador** | DPS Ranged | Tiros precisos, armadilhas | Médio regen (12%) | DAMAGE (Flecha) | DEBUFF-SPD (Armadilha) | DAMAGE+PIERCING ou MARK |
| **Animalista** | Versatil | Instinto animal, natura | Médio regen (15%) | DAMAGE (Investida) | BUFF-DEF/SPD (Instinto) | DAMAGE+HEAL (Simbiose) |

### Formato Exato do skills.json Expandido

```json
{
  "version": 2,
  "lastUpdated": "2026-03-26",
  "skills": [
    // ========== GUERREIRO (já existem mas reformatar com tier system) ==========
    // Skill Line 1: Golpe de Espada (DAMAGE)
    {
      "id": "SK_WAR_SWORD_T1",
      "lineId": "WAR_SWORD",
      "name": "Golpe de Espada I",
      "class": "Guerreiro",
      "category": "Ataque",
      "tier": 1,
      "unlockStage": 0,
      "type": "DAMAGE",
      "power": 18,
      "accuracy": 0.85,
      "energy_cost": 4,
      "target": "Inimigo",
      "status": "",
      "desc": "Um golpe decidido com a espada."
    },
    {
      "id": "SK_WAR_SWORD_T2",
      "lineId": "WAR_SWORD",
      "name": "Golpe de Espada II",
      "class": "Guerreiro",
      "category": "Ataque",
      "tier": 2,
      "unlockStage": 1,
      "type": "DAMAGE",
      "power": 24,
      "accuracy": 0.85,
      "energy_cost": 6,
      "target": "Inimigo",
      "status": "",
      "desc": "Um golpe forte e confiante com a espada."
    },
    {
      "id": "SK_WAR_SWORD_T3",
      "lineId": "WAR_SWORD",
      "name": "Golpe de Espada III",
      "class": "Guerreiro",
      "category": "Ataque",
      "tier": 3,
      "unlockStage": 2,
      "type": "DAMAGE",
      "power": 30,
      "accuracy": 0.85,
      "energy_cost": 8,
      "target": "Inimigo",
      "status": "",
      "desc": "Um golpe devastador que demonstra maestria com a espada."
    }
    // ... (continuar para TODAS as classes)
  ]
}
```

### Campos Novos Explicados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `lineId` | string | Agrupa tiers da mesma skill line (ex: "WAR_SWORD") |
| `tier` | number (1-3) | Nível de poder da skill dentro da line |
| `unlockStage` | number (0-2) | Stage mínimo do monstro para usar esta skill. 0=base, 1=1ª evo, 2=2ª evo |
| `type` | string | Tipo mecânico: DAMAGE, HEAL, BUFF, DEBUFF, TAUNT |
| `buffType` | string (opcional) | Stat afetado: ATK, DEF, SPD |
| `buffPower` | number (opcional) | Valor do buff/debuff (+2, -3, etc) |
| `duration` | number (opcional) | Turnos de duração do efeito |
| `debuffType` | string (opcional) | Para skills com efeito duplo (ex: Fúria do Bárbaro) |
| `debuffPower` | number (opcional) | Valor do debuff secundário |

### Tabela Completa de Skills a Gerar

A IA deve gerar TODAS estas skills, com nomes criativos adequados ao público infantil:

#### GUERREIRO (CLS_WAR) — "O Protetor"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Espada | DAMAGE | pow=18, cost=4 | pow=24, cost=6 | pow=30, cost=8 |
| 2 - Escudo | BUFF DEF self | +2 DEF 2 turnos, cost=4 | +3 DEF 2 turnos, cost=6 | +4 DEF 3 turnos, cost=8 |
| 3 - Provocar | TAUNT | *(indisponível stage 0)* | cost=4 | cost=6 |

#### MAGO (CLS_MAG) — "O Estudioso"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Magia | DAMAGE | pow=20, cost=4 | pow=26, cost=6 | pow=32, cost=8 |
| 2 - Explosão | DAMAGE (high cost) | pow=24, cost=6 | pow=32, cost=8 | pow=38, cost=12 |
| 3 - Barreira Arcana | BUFF DEF ally | *(indisponível)* | +3 DEF 2t, cost=5 | +4 DEF 3t, cost=7 |

#### CURANDEIRO (CLS_HEA) — "O Gentil"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Cura | HEAL ally | heal=15, cost=5 | heal=25, cost=7 | heal=40, cost=10 |
| 2 - Bênção | BUFF ATK ally | +2 ATK 2t, cost=4 | +3 ATK 2t, cost=6 | +4 DEF 3t, cost=8 |
| 3 - Purificação | HEAL+CLEANSE | *(indisponível)* | heal=15 + remove 1 debuff, cost=6 | heal=25 + remove all debuffs, cost=9 |

#### BÁRBARO (CLS_BAR) — "O Furioso"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Fúria | BUFF ATK self + debuff DEF self | +3 ATK/-1 DEF 2t, cost=4 | +4 ATK/-2 DEF 2t, cost=6 | +6 ATK/-2 DEF 3t, cost=8 |
| 2 - Golpe Brutal | DAMAGE (alto) | pow=24, cost=6 | pow=32, cost=8 | pow=38, cost=12 |
| 3 - Grito de Guerra | BUFF ATK area (todos aliados) | *(indisponível)* | +2 ATK todos, 1t, cost=6 | +3 ATK todos, 2t, cost=9 |

#### LADINO (CLS_ROG) — "O Esperto"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Ataque Preciso | DAMAGE (média, alta acc) | pow=19, acc=0.95, cost=4 | pow=24, acc=0.95, cost=6 | pow=30, acc=0.95, cost=8 |
| 2 - Enfraquecer | DEBUFF ATK enemy | *(indisponível stage 0)* | -2 ATK 1t, cost=4 | -3 ATK 2t, cost=6 |
| 3 - Golpe Furtivo | DAMAGE (bonus se alvo debuffed) | *(indisponível)* | pow=20 (+8 se debuff), cost=5 | pow=26 (+12 se debuff), cost=7 |

> **Nota sobre o Ladino**: A skill 2 (Enfraquecer) desbloqueia no stage 0 com tier null (indisponível), e a skill 3 no stage 1. Isso faz sentido narrativamente: o Ladino começa com ataque básico, ganha debuff na 1ª evo, e combo (debuff→golpe furtivo) na 2ª evo.

**ALTERAÇÃO IMPORTANTE para o Ladino**: Para ser jogável no stage 0, a skill 2 deve estar disponível desde o início:
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Ataque Preciso | DAMAGE | pow=19, acc=0.95, cost=4 | pow=24, acc=0.95, cost=6 | pow=30, acc=0.95, cost=8 |
| 2 - Sombra Evasiva | BUFF SPD self | +2 SPD 2t, cost=3 | +3 SPD 2t, cost=5 | +4 SPD 3t, cost=7 |
| 3 - Golpe Furtivo | DAMAGE+bonus | *(indisponível)* | pow=22, cost=5 | pow=30, cost=8 |

#### BARDO (CLS_BRD) — "O Inspirador"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Canção de Coragem | BUFF ATK ally | +2 ATK 2t, cost=4 | +3 ATK 2t, cost=6 | +4 ATK 3t, cost=8 |
| 2 - Canção Calmante | HEAL ally (leve) | heal=12, cost=5 | heal=18, cost=6 | heal=25, cost=8 |
| 3 - Melodia Hipnótica | DEBUFF SPD area | *(indisponível)* | -2 SPD enemies 1t, cost=5 | -3 SPD enemies 2t, cost=7 |

#### CAÇADOR (CLS_HUN) — "O Rastreador"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Flecha Poderosa | DAMAGE | pow=19, cost=4 | pow=24, cost=6 | pow=30, cost=8 |
| 2 - Armadilha | DEBUFF SPD enemy | -2 SPD 1t, cost=3 | -2 SPD 2t, cost=4 | -3 SPD 2t, cost=6 |
| 3 - Tiro Certeiro | DAMAGE (alta acc, bonus) | *(indisponível)* | pow=20, acc=0.95, cost=5 | pow=28, acc=0.95, cost=7 |

> **Nota sobre o Caçador**: A skill 2 (Armadilha) deve estar disponível desde stage 0 (tier 1 com null no SKILL_DEFS original deve ser corrigido para ter tier 1). O Caçador precisa de utilidade desde o início.

**ALTERAÇÃO**: Armadilha disponível desde stage 0:
| 2 - Armadilha | DEBUFF SPD enemy | -2 SPD 1t, cost=3 | -3 SPD 1t, cost=5 | -3 SPD 2t, cost=7 |

#### ANIMALISTA (CLS_ANM) — "O Selvagem"
| Line | Tipo | Tier 1 (Stage 0) | Tier 2 (Stage 1) | Tier 3 (Stage 2) |
|------|------|-------------------|-------------------|-------------------|
| 1 - Investida Bestial | DAMAGE | pow=19, cost=4 | pow=24, cost=6 | pow=30, cost=8 |
| 2 - Instinto Selvagem | BUFF DEF self | +2 DEF 2t, cost=4 | +2 SPD 2t, cost=6 | +3 DEF+SPD 3t, cost=8 |
| 3 - Simbiose Natural | DAMAGE+HEAL self | *(indisponível)* | pow=15, self-heal=8, cost=6 | pow=20, self-heal=12, cost=8 |

### Tabela Resumo de IDs

| Classe | Skill Line 1 | Skill Line 2 | Skill Line 3 |
|--------|--------------|--------------|--------------|
| Guerreiro | SK_WAR_SWORD_T1/T2/T3 | SK_WAR_SHIELD_T1/T2/T3 | SK_WAR_TAUNT_T2/T3 |
| Mago | SK_MAG_SPELL_T1/T2/T3 | SK_MAG_BLAST_T1/T2/T3 | SK_MAG_BARRIER_T2/T3 |
| Curandeiro | SK_HEA_CURE_T1/T2/T3 | SK_HEA_BLESS_T1/T2/T3 | SK_HEA_PURIFY_T2/T3 |
| Bárbaro | SK_BAR_FURY_T1/T2/T3 | SK_BAR_SMASH_T1/T2/T3 | SK_BAR_WARCRY_T2/T3 |
| Ladino | SK_ROG_PRECISE_T1/T2/T3 | SK_ROG_SHADOW_T1/T2/T3 | SK_ROG_STEALTH_T2/T3 |
| Bardo | SK_BRD_COURAGE_T1/T2/T3 | SK_BRD_CALM_T1/T2/T3 | SK_BRD_HYPNO_T2/T3 |
| Caçador | SK_HUN_ARROW_T1/T2/T3 | SK_HUN_TRAP_T1/T2/T3 | SK_HUN_SNIPE_T2/T3 |
| Animalista | SK_ANM_CHARGE_T1/T2/T3 | SK_ANM_INSTINCT_T1/T2/T3 | SK_ANM_SYMBIOSIS_T2/T3 |

**Total: 8 classes × 3 lines × 3 tiers = 72 skills** (menos ~8 slots null = **~64 skills**)

### Compatibilidade com Skills Existentes

As skills existentes com IDs antigos (`SK_WAR_01`, `SK_MAG_01`, etc.) devem ser **mantidas** no JSON com campo `deprecated: true` e um campo `replacedBy: "SK_WAR_SWORD_T1"` para migração gradual.

### Critérios de Aceitação

- [ ] `data/skills.json` contém todas as ~64 skills para 8 classes
- [ ] Cada skill tem todos os campos obrigatórios: id, lineId, name, class, category, tier, unlockStage, type, power, accuracy, energy_cost, target, desc
- [ ] Skills deprecated mantidas com flag
- [ ] `SKILL_DEFS` no index.html atualizado para ler do JSON ou sincronizado manualmente
- [ ] Testes existentes continuam passando (`npx vitest run`)
- [ ] Nomes de skills são criativos, divertidos e adequados para público infantil (6-12 anos)

### Nomes Sugeridos (A IA Deve Expandir com Criatividade)

A IA pode escolher nomes mais criativos, mas aqui estão sugestões por classe:

- **Guerreiro**: "Corte Reluzente", "Muralha Inabalável", "Desafio do Herói"
- **Mago**: "Faísca Arcana", "Tempestade de Estrelas", "Véu Protetor"
- **Curandeiro**: "Toque Gentil", "Luz Revigorante", "Aura Purificadora"
- **Bárbaro**: "Rugido Feroz", "Marretada Trovejante", "Grito de Tempestade"
- **Ladino**: "Passo Fantasma", "Lâmina Silenciosa", "Golpe da Sombra"
- **Bardo**: "Hino da Bravura", "Cantiga Serena", "Requiem Paralisante"
- **Caçador**: "Flecha Certeira", "Rede Pegajosa", "Tiro Perfurante"
- **Animalista**: "Investida Selvagem", "Sentido Animal", "Laço da Natureza"

---

## AÇÃO 2 — Expandir EVOLUCOES.csv para Starters Originais

### Problema

Os 8 starters originais (MON_001 a MON_008) **não têm cadeia evolutiva** — apenas MON_002 (Pedrino) evolui. Os 44 novos monstros do bootstrap (MON_010-MON_027C) JÁ têm evoluções definidas no `EVOLUCOES.csv` (33 entradas: EVO_003 a EVO_033) e no `monsters.json` com campos `evolvesTo`/`evolvesAt`.

Os starters originais precisam de evoluções também, senão ficam fracos comparados aos bootstrap.

### Starters que Precisam de Evolução

| Starter | Classe | Evolução Sugerida |
|---------|--------|-------------------|
| MON_001 Cantapau | Bardo | MON_001 → MON_001B (L15) → MON_001C (L30) |
| MON_003 Faíscari | Mago | MON_003 → MON_003B (L15) → MON_003C (L30) |
| MON_004 Ninfolha | Curandeiro | MON_004 → MON_004B (L15) → MON_004C (L30) |
| MON_005 Garruncho | Caçador | MON_005 → MON_005B (L15) → MON_005C (L30) |
| MON_006 Lobinho | Animalista | MON_006 → MON_006B (L15) → MON_006C (L30) |
| MON_007 Trovão | Bárbaro | MON_007 → MON_007B (L15) → MON_007C (L30) |
| MON_008 Sombrio | Ladino | MON_008 → MON_008B (L15) → MON_008C (L30) |

> MON_002 Pedrino já tem cadeia (L12, L25).

### Template de Evolução para Novos Monstros

Para cada starter, criar **2 novas formas** seguindo a escalada de stats dos bootstrap:

#### Fórmula de Stats por Estágio

| Campo | S1 (base/Comum) | S2 (evo1/Incomum) | S3 (evo2/Raro) |
|-------|-----------------|---------------------|-------------------|
| baseHp | valor original | ×1.30 | ×1.65 |
| baseAtk | valor original | ×1.40 | ×1.85 |
| baseDef | valor original | ×1.35 | ×1.70 |
| baseSpd | valor original | ×1.15 | ×1.40 |
| baseEne | valor original | ×1.20 | ×1.50 |
| rarity | Comum | Incomum | Raro |

#### Exemplo: Cantapau (MON_001, Bardo)

**MON_001** (base): HP=28, ATK=6, DEF=4, SPD=6, ENE=8
**MON_001B** (evo1, L15): HP=36, ATK=8, DEF=5, SPD=7, ENE=10, rarity=Incomum
**MON_001C** (evo2, L30): HP=46, ATK=11, DEF=7, SPD=8, ENE=12, rarity=Raro

### Estrutura do CSV a Adicionar

```csv
EVO_034,MON_001,MON_001B,15,True,Cantapau → [NomeEvo1].
EVO_035,MON_001B,MON_001C,30,True,[NomeEvo1] → [NomeEvo2].
EVO_036,MON_003,MON_003B,15,True,Faíscari → [NomeEvo1].
EVO_037,MON_003B,MON_003C,30,True,[NomeEvo1] → [NomeEvo2].
EVO_038,MON_004,MON_004B,15,True,Ninfolha → [NomeEvo1].
EVO_039,MON_004B,MON_004C,30,True,[NomeEvo1] → [NomeEvo2].
EVO_040,MON_005,MON_005B,15,True,Garruncho → [NomeEvo1].
EVO_041,MON_005B,MON_005C,30,True,[NomeEvo1] → [NomeEvo2].
EVO_042,MON_006,MON_006B,15,True,Lobinho → [NomeEvo1].
EVO_043,MON_006B,MON_006C,30,True,[NomeEvo1] → [NomeEvo2].
EVO_044,MON_007,MON_007B,15,True,Trovão → [NomeEvo1].
EVO_045,MON_007B,MON_007C,30,True,[NomeEvo1] → [NomeEvo2].
EVO_046,MON_008,MON_008B,15,True,Sombrio → [NomeEvo1].
EVO_047,MON_008B,MON_008C,30,True,[NomeEvo1] → [NomeEvo2].
```

### Atualizar monsters.json e MONSTER_CATALOG

Para cada nova forma, adicionar no `data/monsters.json` E no `MONSTER_CATALOG` do `index.html`:

```json
{
  "id": "MON_001B",
  "name": "Cantaforte",         // Nome criativo da evolução
  "class": "Bardo",
  "rarity": "Incomum",
  "baseHp": 36,
  "baseAtk": 8,
  "baseDef": 5,
  "baseSpd": 7,
  "baseEne": 10,
  "emoji": "🎵",
  "evolvesTo": "MON_001C",
  "evolvesAt": 30
}
```

E adicionar `evolvesTo`/`evolvesAt` nos starters originais que ainda não têm.

### Regras de Nomenclatura para Evoluções

| Classe | Tema de Nomes | Exemplos |
|--------|--------------|----------|
| Bardo | Música/som crescendo | Cantapau → Cantaforte → Sinfonário |
| Mago | Magia/misticismo crescendo | Faíscari → Centelhari → Relampajari |
| Curandeiro | Natureza/cura crescendo | Ninfolha → Floraninha → Bosquemãe |
| Caçador | Predador/agilidade crescendo | Garruncho → Garranchão → Predagarra |
| Animalista | Animal selvagem crescendo | Lobinho → Lobatão → Alfalobo |
| Bárbaro | Força/tempestade crescendo | Trovão → Tempestrovão → Tormentauro |
| Ladino | Sombra/furtividade crescendo | Sombrio → Penumbral → Eclipsombra |

### Critérios de Aceitação

- [ ] 14 novos monstros adicionados (7 starters × 2 evoluções cada)
- [ ] `data/monsters.json` atualizado (55 + 14 = 69 monstros)
- [ ] `MONSTER_CATALOG` no index.html sincronizado (69 entradas)
- [ ] `EVOLUCOES.csv` com 14 novas linhas (EVO_034 a EVO_047)
- [ ] Starters originais têm `evolvesTo`/`evolvesAt` adicionados
- [ ] Stats seguem a fórmula de escalamento (×1.30/×1.65 etc.)
- [ ] Nomes criativos e adequados ao público infantil
- [ ] Testes existentes continuam passando

---

## AÇÃO 3 — Expandir ENCOUNTERS.csv + LOCAIS.csv

### Problema Atual

O jogo tem **1 local** (Campina Inicial) e **2 encounters** (1 selvagem, 1 treinador). Com 69 monstros, precisamos de múltiplos locais com encontros variados.

### Novos Locais a Criar

| local_id | nome | descricao | nivel_recomendado | bioma |
|----------|------|-----------|-------------------|-------|
| LOC_001 | Campina Inicial | Área segura para aprender captura e batalha. | 1-5 | Campo aberto |
| LOC_002 | Floresta Murmurante | Árvores antigas e monstros esquivos. | 5-10 | Floresta |
| LOC_003 | Caverna Cristalina | Cavernas brilhantes com monstros resilientes. | 10-18 | Caverna |
| LOC_004 | Lago Espelhado | Águas calmas com monstros astutos. | 15-25 | Água/Lago |
| LOC_005 | Pico Tempestuoso | Montanha ventosa com monstros ferozes. | 25-35 | Montanha |
| LOC_006 | Ruínas Ancestrais | Construções antigas com monstros raros. | 35-50 | Ruínas |

### Mapeamento de Monstros por Local

Cada local deve ter monstros de classes diferentes que façam sentido temático:

| Local | Monstros Selvagens (por ID) | Nível Min-Max |
|-------|---------------------------|---------------|
| LOC_001 | MON_100 (Rato-de-Lama), MON_001 (Cantapau), MON_006 (Lobinho) | 1-5 |
| LOC_002 | MON_023 (Cervimon), MON_022 (Corvimon), MON_027 (Zunzumon), MON_012 (Luvursomon) | 5-12 |
| LOC_003 | MON_010 (Ferrozimon), MON_026 (Cascalhimon), MON_021 (Tamborilhomon), MON_014 (Lagartomon) | 10-20 |
| LOC_004 | MON_020 (Gotimon), MON_024 (Coralimon), MON_013 (Miaumon), MON_025 (Pulimbon) | 15-25 |
| LOC_005 | MON_011 (Dinomon), MON_007 (Trovão), MON_003 (Faíscari), MON_008 (Sombrio) | 25-35 |
| LOC_006 | Formas evoluídas: MON_010C, MON_014C, MON_012C, MON_022C | 35-50 |

### Formato dos Encounters

```csv
encounter_id,tipo_encontro,local_id,periodo,min_level,max_level,monster_id_1,monster_id_2,monster_id_3,recomp_xp,recomp_gold,drop_table_id,notes
ENC_003,Selvagem,LOC_002,Qualquer,5,8,MON_023,,,40,30,DROP_001,Cervo da floresta.
ENC_004,Selvagem,LOC_002,Qualquer,6,10,MON_022,,,45,35,DROP_001,Corvo furtivo.
ENC_005,Treinador,LOC_002,Qualquer,7,12,MON_023,MON_027,,80,60,DROP_002,Treinador da floresta.
ENC_006,Selvagem,LOC_003,Qualquer,10,15,MON_010,,,55,40,DROP_001,Sentinela de ferro.
ENC_007,Selvagem,LOC_003,Qualquer,12,18,MON_026,,,60,45,DROP_001,Pedra viva.
ENC_008,Treinador,LOC_003,Qualquer,12,18,MON_010,MON_021,,100,80,DROP_002,Guardião da caverna.
ENC_009,Boss,LOC_003,Qualquer,15,20,MON_010B,MON_021B,MON_026B,200,150,DROP_003,Chefe da caverna!
```

### Regras para Encontros

1. **Selvagens**: 1 monstro, XP = 30 + (level × 5), Gold = 20 + (level × 3)
2. **Treinadores**: 2 monstros, XP = 60 + (level × 8), Gold = 40 + (level × 5)
3. **Bosses**: 2-3 monstros evoluídos, XP = 150 + (level × 10), Gold = 100 + (level × 8)
4. Drop tables: DROP_001 (selvagem), DROP_002 (treinador), DROP_003 (boss - criar)

### Critérios de Aceitação

- [ ] LOCAIS.csv com 6 locais
- [ ] ENCOUNTERS.csv com ~20-25 encounters variados
- [ ] Cada local tem 3-4 encounters (mix selvagem/treinador/boss)
- [ ] Níveis são progressivos e coerentes com os monstros
- [ ] Formato CSV mantém compatibilidade existente

---

## AÇÃO 4 — Expandir QUESTS.csv

### Problema

Só existem 2 quests (tutorial). Precisamos de uma cadeia narrativa que guie o jogador por todos os locais.

### Cadeia de Quests Proposta

| quest_id | nome | descricao | local_id | pre_req | reward_xp | reward_gold | reward_item_id | next_quest_id |
|----------|------|-----------|----------|---------|-----------|-------------|----------------|---------------|
| QST_001 | O Ovo Perdido | Encontre o Ovo Perdido na Campina Inicial e vença o Treinador Novato. | LOC_001 | - | 80 | 60 | IT_CAP_02 | QST_002 |
| QST_002 | Primeira Captura | Capture 1 monstrinho selvagem na Campina Inicial. | LOC_001 | QST_001 | 60 | 40 | IT_HEAL_01 | QST_003 |
| QST_003 | Mistério na Floresta | Investigue sons estranhos na Floresta Murmurante. | LOC_002 | QST_002 | 120 | 80 | EGG_C | QST_004 |
| QST_004 | O Guardião Verde | Derrote o treinador que protege a Floresta. | LOC_002 | QST_003 | 150 | 100 | IT_BALANCED_INCOMUM | QST_005 |
| QST_005 | Brilho nas Profundezas | Explore a Caverna Cristalina. | LOC_003 | QST_004 | 180 | 120 | EGG_U | QST_006 |
| QST_006 | O Chefe da Caverna | Derrote o Boss da Caverna Cristalina. | LOC_003 | QST_005 | 250 | 180 | IT_ATK_INCOMUM | QST_007 |
| QST_007 | Reflexos no Lago | Descubra o segredo do Lago Espelhado. | LOC_004 | QST_006 | 300 | 200 | EGG_R | QST_008 |
| QST_008 | Tempestade se Aproxima | Prepare-se para a subida ao Pico Tempestuoso. | LOC_005 | QST_007 | 400 | 280 | IT_ATK_RARO | QST_009 |
| QST_009 | Ruínas do Passado | Explore as Ruínas Ancestrais. | LOC_006 | QST_008 | 500 | 350 | EGG_M | QST_010 |
| QST_010 | O Desafio Final | Derrote o Mestre das Ruínas e prove seu valor! | LOC_006 | QST_009 | 800 | 500 | IT_BALANCED_LENDARIO | - |

### Tipos de Objetivos de Quest

Cada quest deve ter um `objective_type` para o código saber quando ela está completa:

| objective_type | Descrição | Campos extras |
|---------------|-----------|---------------|
| `defeat_trainer` | Derrotar treinador específico | `target_encounter_id` |
| `capture_monster` | Capturar X monstros | `capture_count`, `capture_class` (opcional) |
| `explore_location` | Completar X encontros em um local | `encounter_count` |
| `defeat_boss` | Derrotar boss específico | `target_encounter_id` |

### Formato CSV Expandido

```csv
quest_id,nome,descricao,local_id,pre_req,objective_type,objective_param,reward_xp,reward_gold,reward_item_id,next_quest_id,notes
QST_001,O Ovo Perdido,...,LOC_001,,defeat_trainer,ENC_002,80,60,IT_CAP_02,QST_002,Tutorial
QST_002,Primeira Captura,...,LOC_001,QST_001,capture_monster,1,60,40,IT_HEAL_01,QST_003,Tutorial
```

### Critérios de Aceitação

- [ ] QUESTS.csv com 10 quests encadeadas
- [ ] Cada quest tem objective_type definido
- [ ] Recompensas são progressivas e balanceadas
- [ ] Quests cobrem todos os 6 locais
- [ ] Narrativa é coerente e divertida para crianças

---

## AÇÃO 5 — Expandir DROPS.csv

### Problema

Só existem 2 drop tables. Com bosses e locais avançados, precisamos de mais.

### Drop Tables a Criar

| drop_table_id | Contexto | Itens |
|--------------|----------|-------|
| DROP_001 | Selvagem (early) | 35% Orbe Comum, 25% Petisco Cura |
| DROP_002 | Treinador (early) | 50% Orbe Comum, 40% Petisco Cura |
| DROP_003 | Boss | 80% Orbe Incomum, 60% Petisco Cura ×2, 30% Ovo Comum |
| DROP_004 | Selvagem (mid) | 35% Orbe Comum, 30% Petisco Cura, 10% Orbe Incomum |
| DROP_005 | Treinador (mid) | 50% Orbe Incomum, 40% Petisco Cura ×2, 15% Item Held Comum |
| DROP_006 | Boss (mid) | 80% Orbe Incomum, 50% Petisco ×3, 25% Ovo Incomum |
| DROP_007 | Selvagem (late) | 40% Orbe Incomum, 30% Petisco, 15% Orbe Raro |
| DROP_008 | Boss (late) | 90% Orbe Raro, 60% Petisco ×3, 30% Ovo Raro, 10% Item Held Raro |

### Formato CSV

```csv
drop_table_id,item_id,chance,min_qty,max_qty,notes
DROP_003,CLASTERORB_INCOMUM,0.80,1,1,Boss drop orbe incomum.
DROP_003,IT_HEAL_01,0.60,1,2,Boss drop cura.
DROP_003,EGG_C,0.30,1,1,Boss drop ovo comum.
```

### Critérios de Aceitação

- [ ] DROPS.csv com 8 drop tables
- [ ] Cada encounter no ENCOUNTERS.csv referencia uma drop table válida
- [ ] Item IDs referenciam itens existentes no items.json
- [ ] Chances são balanceadas (não muito generoso nem muito punitivo)

---

## AÇÃO 6 — Integrar Quest Loader

### Problema

QUESTS.csv existe mas o jogo não lê, não exibe e não rastreia progresso de quests.

### O Que Criar

#### Arquivo: `js/data/questLoader.js`

```javascript
/**
 * QUEST LOADER MODULE
 * Carrega quests do QUESTS.csv e gerencia progresso.
 */

// Carregar quests do CSV
export function loadQuests(csvText) {
    // Parse CSV → array de objetos quest
    // Campos: quest_id, nome, descricao, local_id, pre_req, 
    //         objective_type, objective_param,
    //         reward_xp, reward_gold, reward_item_id, next_quest_id
    // Retorna Map<quest_id, questObject>
}

// Obter quest ativa do jogador
export function getActiveQuest(playerData, questMap) {
    // Busca a quest que o jogador deve fazer agora
    // Verifica pre_req satisfeito
    // Retorna objeto quest ou null
}

// Verificar se quest foi completada
export function checkQuestCompletion(quest, playerData) {
    // Com base em objective_type:
    // - defeat_trainer: verifica se encounter_id foi vencido
    // - capture_monster: verifica count de capturas no local
    // - explore_location: verifica encounters completados
    // - defeat_boss: verifica se boss foi derrotado
    // Retorna boolean
}

// Conceder recompensas da quest
export function grantQuestRewards(quest, playerData) {
    // Adiciona XP, gold, item ao jogador
    // Marca quest como completa
    // Ativa next_quest se houver
}
```

#### Integração no index.html

- Exibir quest ativa na UI (banner no topo ou seção dedicada)
- Após cada vitória, chamar `checkQuestCompletion()`
- Se completou, mostrar modal de recompensa
- Salvar progresso no `localStorage`

### Critérios de Aceitação

- [ ] `js/data/questLoader.js` criado com funções exportadas
- [ ] Testes em `tests/questLoader.test.js` com mínimo 15 test cases
- [ ] Quest ativa exibida na UI
- [ ] Progresso de quest salvo no localStorage
- [ ] Recompensas concedidas automaticamente

---

## AÇÃO 7 — Implementar Loja Básica

### Problema

Moedas (gold) acumulam mas não têm uso. A aba Loja existe no HTML mas está vazia.

### O Que Implementar

#### Itens Compráveis (do items.json existente)

| Item | Preço (buy) | Categoria |
|------|-------------|-----------|
| IT_ATK_COMUM (Amuleto de Força) | 50 gold | Held Item |
| IT_DEF_COMUM (Escudo Leve) | 50 gold | Held Item |
| IT_ATK_INCOMUM (Colar de Poder) | 120 gold | Held Item |
| IT_DEF_INCOMUM (Armadura Reforçada) | 120 gold | Held Item |
| IT_BALANCED_INCOMUM (Cristal Equilibrado) | 150 gold | Held Item |
| EGG_C (Ovo Comum) | 120 gold | Ovo |
| EGG_U (Ovo Incomum) | 300 gold | Ovo |
| CLASTERORB_COMUM | 30 gold | Captura |
| CLASTERORB_INCOMUM | 80 gold | Captura |
| IT_HEAL_01 (Petisco de Cura) | 20 gold | Consumível |

#### Itens Vendáveis

Qualquer item no inventário pode ser vendido por **40% do preço de compra** (arredondado para baixo).

#### UI da Loja

```
┌─ LOJA ──────────────────────────────────────┐
│ 💰 Ouro: 340                                │
│                                              │
│ 📦 COMPRAR          📤 VENDER               │
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │ ⚪ ClasterOrb Comum      30 💰 [+]  │    │
│ │ 🔵 ClasterOrb Incomum    80 💰 [+]  │    │
│ │ 🍖 Petisco de Cura       20 💰 [+]  │    │
│ │ 💪 Amuleto de Força      50 💰 [+]  │    │
│ │ 🛡️ Escudo Leve           50 💰 [+]  │    │
│ │ 🥚 Ovo Comum            120 💰 [+]  │    │
│ └──────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

#### Arquivo: `js/ui/shopUI.js`

```javascript
/**
 * SHOP UI MODULE
 * Interface de compra e venda de itens.
 */

export function renderShop(playerData, itemsCatalog) {
    // Renderiza lista de itens compráveis
    // Mostra gold do jogador
    // Botões de comprar (validando gold suficiente)
}

export function buyItem(itemId, playerData, itemsCatalog) {
    // Verifica gold >= preço
    // Deduz gold
    // Adiciona item ao inventário
    // Retorna { success, message }
}

export function sellItem(itemId, playerData, itemsCatalog) {
    // Verifica item no inventário
    // Remove item
    // Adiciona 40% do preço em gold
    // Retorna { success, message }
}
```

### Critérios de Aceitação

- [ ] Aba Loja funcional com lista de itens
- [ ] Compra deduz gold e adiciona item
- [ ] Venda remove item e adiciona 40% gold
- [ ] Validação de gold insuficiente
- [ ] Persistência via localStorage
- [ ] Testes em `tests/shopUI.test.js`

---

## AÇÃO 8 — Fluxo de Jogo (Game Flow Manager)

### Problema

O jogo funciona em abas isoladas. Não há fluxo conectado de menu → quest → encontro → batalha → recompensa → próxima quest.

### Diagrama de Fluxo Desejado

```
                    ┌──────────────┐
                    │  MENU PRINCIPAL │
                    │  Novo Jogo    │
                    │  Continuar    │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  SETUP       │
                    │  Nome Sessão │
                    │  Jogadores   │
                    │  Classes     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  MAPA/HUB    │◄──────────────────┐
                    │  Quest Ativa │                    │
                    │  Local Atual │                    │
                    │  [Explorar]  │                    │
                    │  [Loja]      │                    │
                    │  [Time]      │                    │
                    └──────┬───────┘                    │
                           │ [Explorar]                 │
                    ┌──────▼───────┐                    │
                    │  ENCONTRO    │                    │
                    │  Selvagem ou │                    │
                    │  Treinador?  │                    │
                    └──────┬───────┘                    │
                           │                            │
                    ┌──────▼───────┐                    │
                    │  BATALHA     │                    │
                    │  (já impl.) │                    │
                    └──────┬───────┘                    │
                           │                            │
                    ┌──────▼───────┐                    │
                    │  RECOMPENSA  │                    │
                    │  XP + Drops  │                    │
                    │  + Quest?    │────────────────────┘
                    │  [Capturar?] │
                    └──────────────┘
```

### Fases do Game Flow

| Fase | Estado | Descrição |
|------|--------|-----------|
| `MENU` | Nenhuma sessão | Tela de menu principal |
| `SETUP` | Criando sessão | Wizard de setup (nome, jogadores, classes) |
| `HUB` | Sessão ativa | Tela central com mapa, quest, loja, time |
| `EXPLORING` | No local | Gerando encontros aleatórios no local |
| `ENCOUNTER` | Encontro gerado | Decisão: lutar, fugir, ou capturar |
| `BATTLE` | Em combate | Sistema de combate (já implementado) |
| `REWARDS` | Pós-combate | XP, drops, quest check, captura |
| `QUEST_COMPLETE` | Quest concluída | Modal de quest completa + recompensa |

### Arquivo: `js/ui/gameFlow.js`

```javascript
/**
 * GAME FLOW MANAGER
 * Controla o fluxo de fases do jogo.
 */

const PHASES = ['MENU', 'SETUP', 'HUB', 'EXPLORING', 'ENCOUNTER', 'BATTLE', 'REWARDS', 'QUEST_COMPLETE'];

export function createGameFlow() {
    return {
        phase: 'MENU',
        previousPhase: null,
        sessionData: null,
        currentLocation: null,
        currentEncounter: null,
        activeQuest: null
    };
}

export function transitionTo(flow, newPhase, data = {}) {
    // Valida transição permitida
    // Salva fase anterior
    // Atualiza dados relevantes
    // Retorna novo estado de flow
}

export function getAllowedTransitions(currentPhase) {
    // Define transições válidas
    const transitions = {
        'MENU': ['SETUP', 'HUB'],           // Novo jogo ou Continuar
        'SETUP': ['HUB'],                    // Setup completo
        'HUB': ['EXPLORING', 'MENU'],       // Explorar ou Sair
        'EXPLORING': ['ENCOUNTER', 'HUB'],   // Encontro ou Voltar
        'ENCOUNTER': ['BATTLE', 'HUB'],      // Lutar ou Fugir
        'BATTLE': ['REWARDS'],               // Vitória/Derrota
        'REWARDS': ['HUB', 'QUEST_COMPLETE'], // Volta ao hub ou Quest
        'QUEST_COMPLETE': ['HUB']             // Volta ao hub
    };
    return transitions[currentPhase] || [];
}

export function renderPhase(flow) {
    // Renderiza UI baseado na fase atual
    // Mostra/oculta tabs conforme fase
}
```

### Critérios de Aceitação

- [ ] Game Flow Manager controla transições de fase
- [ ] Menu principal com "Novo Jogo" e "Continuar"
- [ ] Hub central mostra quest ativa, local atual, gold
- [ ] Explorar gera encontros do local atual
- [ ] Após batalha, volta automaticamente ao hub (ou quest complete)
- [ ] Navegação por fases sem quebrar funcionalidade existente
- [ ] Testes em `tests/gameFlow.test.js`

---

## 📊 PRIORIDADE E DEPENDÊNCIAS

```
AÇÃO 1 (Skills)       ──────► pode ser feita independente
AÇÃO 2 (Evoluções)    ──────► pode ser feita independente
AÇÃO 3 (Locais)       ──────► pode ser feita independente
AÇÃO 4 (Quests)       ──────► depende de AÇÃO 3 (locais)
AÇÃO 5 (Drops)        ──────► depende de AÇÃO 3 (encounters)
AÇÃO 6 (Quest Loader) ──────► depende de AÇÃO 4 (quests CSV)
AÇÃO 7 (Loja)         ──────► pode ser feita independente
AÇÃO 8 (Game Flow)    ──────► depende de AÇÃO 6 + 7

Ordem recomendada:
Fase A (paralelo): AÇÃO 1 + AÇÃO 2 + AÇÃO 3 + AÇÃO 7
Fase B (paralelo): AÇÃO 4 + AÇÃO 5
Fase C (sequencial): AÇÃO 6
Fase D (sequencial): AÇÃO 8
```

---

## 🔧 REGRAS TÉCNICAS GLOBAIS

### Ao Modificar Dados

1. **Nunca renomear IDs** — criar novos se necessário
2. **Manter data/monsters.json e MONSTER_CATALOG em sincronia**
3. **Manter EVOLUCOES.csv e campos evolvesTo/evolvesAt em sincronia**
4. **Rodar `npx vitest run` após cada mudança** — todos os 573+ testes devem passar
5. **IDs são case-sensitive e imutáveis**

### Ao Criar Código Novo

1. **JS simples** — sem frameworks, sem TypeScript
2. **Exportar funções** com `export function` (ES modules)
3. **Criar testes** em `tests/[modulo].test.js` usando Vitest
4. **Comentários em PT-BR**
5. **Nomes de variáveis em inglês** (convenção do projeto)

### Padrão de Testes

```javascript
import { describe, it, expect } from 'vitest';
import { funcao } from '../js/path/to/module.js';

describe('NomeDoModulo', () => {
    const defaultConfig = { /* ... */ };
    
    it('deve fazer X quando Y', () => {
        const result = funcao(input);
        expect(result).toBe(expected);
    });
});
```

### Persistência

- Dados do jogo: `localStorage` chave `mm_mvp_v1`
- Formato: JSON com deep merge para compatibilidade
- Ao adicionar novos campos ao state, usar valores default para saves antigos

---

## 📝 CHECKLIST FINAL

Ao completar todas as ações, verificar:

- [ ] `npx vitest run` — todos os testes passam
- [ ] Abrir `index.html` no navegador — sem erros no console
- [ ] Criar nova sessão — funciona
- [ ] Criar jogadores — funciona
- [ ] Iniciar combate — skills funcionam para TODAS as 8 classes
- [ ] Monstros evoluem nos níveis corretos
- [ ] Locais diferentes têm encontros diferentes
- [ ] Quest chain funciona do início ao fim
- [ ] Loja permite comprar e vender
- [ ] Fluxo de jogo conecta todas as funcionalidades

---

**Última atualização**: 2026-03-26
**Versão**: 1.0.0
