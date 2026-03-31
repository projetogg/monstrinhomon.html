# Documento 5 — Atributos-Base por Classe v2

> **Status:** Canônico — Para testes práticos de balanceamento  
> **Versão:** 2.0  
> **Última atualização:** 2026-03-31

---

## 1. Propósito

Esta tabela define os **atributos-base canônicos** de cada classe de Monstrinhomon para fins de balanceamento e teste da fórmula de combate v2.

Os valores foram derivados dos dados reais de `data/monsters.json` (Nível 1) e ajustados para refletir os papéis canônicos de cada classe dentro da nova fórmula.

---

## 2. Atributos-Base no Nível 1

| Classe | HP | ATK | DEF | AGI | ENE | PWR Básico |
|--------|----|-----|-----|-----|-----|-----------|
| **Guerreiro** | 30 | 7 | 7 | 4 | 8 | 4 |
| **Bárbaro** | 33 | 8 | 4 | 4 | 8 | 5 |
| **Mago** | 26 | 8 | 3 | 7 | 12 | 4 |
| **Curandeiro** | 29 | 4 | 5 | 5 | 12 | 3 |
| **Ladino** | 25 | 7 | 4 | 9 | 10 | 4 |
| **Bardo** | 27 | 6 | 4 | 7 | 10 | 3 |
| **Caçador** | 27 | 7 | 3 | 9 | 10 | 4 |
| **Animalista** | 30 | 6 | 5 | 5 | 10 | 4 |

---

## 3. Papéis Canônicos e Perfil de Atributos

### 3.1 Guerreiro
**Função:** Linha de frente — absorver, proteger, sustentar.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| HP alto | AGI baixa (age por último) |
| DEF alta (melhor DEF_confronto e Mitigação) | Alcance curto (só Frente) |
| Assinatura de proteção de aliados | Burst ofensivo baixo |
| PWR consistente | Sem mobilidade |

**Na fórmula:**
- DEF 7 → DEF_confronto = 4, Mitigação = 3
- Recebe ~3 pontos a menos de dano por acerto
- Não é invulnerável — ATK alto ainda dói

### 3.2 Bárbaro
**Função:** Agressão máxima — dano bruto, risco alto.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| ATK mais alto da classe | DEF baixa (DEF_confronto = 2, Mitigação = 2) |
| PWR básico mais alto | HP moderado |
| Habilidades de dano explosivo | AGI baixa — age tarde |
| Auto-buff de ATK | Sem suporte ou cura |

**Na fórmula:**
- DanoBase básico: PWR 5 + ATK 8 − Mitigação 2 = **11** (vs DEF 4)
- Mas recebe dano pleno: qualquer acerto causa dano quase total

### 3.3 Mago
**Função:** Dano técnico e controle.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| ATK alto para suporte de dano | DEF mínima (1 de confronto, 1 de mitição) |
| ENE alto — usa mais habilidades | HP baixo |
| Habilidades de controle (debuff, root) | Precisa de proteção na linha de trás |
| Alcance longo | Depende de ENE para burst real |

**Na fórmula:**
- DEF 3 → DEF_confronto = 2, Mitigação = 1
- Recebe quase dano pleno — morre rápido se exposto

### 3.4 Curandeiro
**Função:** Sustentação, cura, suporte.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| ENE alto — cura frequente | ATK mais baixo da classe |
| DEF moderada | PWR básico mínimo |
| HP razoável | Ofensivamente fraco |
| Cura em área (assinatura) | Depende de aliados para combater |

**Na fórmula:**
- DanoBase básico: 3 + 4 − Mitigação = fraco, mas existe
- Foco em suporte; habilidades compensam o dano fraco

### 3.5 Ladino
**Função:** Velocidade, precisão, finalização.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| AGI mais alta — age antes de todos | HP mais baixo da classe |
| Assinatura de execução (×2 em alvo fraco) | DEF baixa — vulnerável |
| Mobilidade: troca de posição gratuita | Alcance médio |
| Ataque duplo (Slot 1 avançado) | Burst depende do HP do alvo |

**Na fórmula:**
- Age primeiro: pode eliminar antes do inimigo agir
- DEF 4 → recebe dano quase pleno

### 3.6 Bardo
**Função:** Buff, debuff, manipulação de ritmo.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| AGI moderada-alta | ATK e PWR modestos |
| Buffa todos os aliados (assinatura) | Dano individual baixo |
| Alcance longo | Depende de aliados para causar pressão |
| ENE moderada | HP baixo-médio |

**Na fórmula:**
- DanoBase básico: 3 + 6 − Mitigação = modesto
- Valor real está nos buffs: +ATK a aliados multiplica o dano deles

### 3.7 Caçador
**Função:** Pressão à distância, foco de alvo, consistência.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| AGI alta — age cedo | DEF mínima |
| Alcance longo — atinge qualquer linha | HP baixo-médio |
| Marcação: bônus contra alvo fixo | Sem mobilidade próxima |
| Dano consistente por faixa | Perde muito em combate corpo a corpo |

**Na fórmula:**
- DEF 3 → DEF_confronto = 2, Mitigação = 1
- Precisa ficar na linha de trás para sobreviver

### 3.8 Animalista
**Função:** Versatilidade, adaptação.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| HP moderado-alto | Alcance curto |
| DEF moderada | Sem especialização clara |
| Habilidade de postura (adaptável) | Burst menor que Bárbaro |
| Equilibrado em ATK/DEF | AGI média — não age primeiro |

**Na fórmula:**
- Generalista: não domina nenhuma área, mas não é fraco em nenhuma

---

## 4. Crescimento de Atributos por Nível

### 4.1 Fórmula Geral de Crescimento

```javascript
HP(lv)  = baseHp + (lv - 1) * hpPerLv
ATK(lv) = baseAtk + floor((lv - 1) * atkPerLv)
DEF(lv) = baseDef + floor((lv - 1) * defPerLv)
AGI(lv) = baseAgi + floor((lv - 1) * agiPerLv)
ENE(lv) = 10 + (lv - 1) * 2
```

### 4.2 Taxas de Crescimento por Classe (por nível)

| Classe | HP/lv | ATK/lv | DEF/lv | AGI/lv |
|--------|-------|--------|--------|--------|
| Guerreiro | 3.5 | 0.50 | 0.60 | 0.15 |
| Bárbaro | 3.5 | 0.65 | 0.30 | 0.15 |
| Mago | 2.5 | 0.55 | 0.25 | 0.20 |
| Curandeiro | 3.0 | 0.25 | 0.40 | 0.15 |
| Ladino | 2.5 | 0.50 | 0.25 | 0.35 |
| Bardo | 2.8 | 0.40 | 0.30 | 0.30 |
| Caçador | 2.5 | 0.50 | 0.20 | 0.35 |
| Animalista | 3.0 | 0.45 | 0.40 | 0.20 |

### 4.3 Atributos Projetados por Nível Chave

#### Nível 10

| Classe | HP | ATK | DEF | DEF_confronto | Mitigação | AGI |
|--------|----|-----|-----|--------------|-----------|-----|
| Guerreiro | 61 | 11 | 12 | 6 | 6 | 5 |
| Bárbaro | 64 | 14 | 6 | 3 | 3 | 5 |
| Mago | 48 | 13 | 5 | 3 | 2 | 9 |
| Curandeiro | 56 | 6 | 8 | 4 | 4 | 6 |
| Ladino | 47 | 11 | 6 | 3 | 3 | 12 |
| Bardo | 52 | 9 | 6 | 3 | 3 | 10 |
| Caçador | 47 | 11 | 4 | 2 | 2 | 12 |
| Animalista | 57 | 10 | 8 | 4 | 4 | 7 |

#### Nível 25

| Classe | HP | ATK | DEF | DEF_confronto | Mitigação | AGI |
|--------|----|-----|-----|--------------|-----------|-----|
| Guerreiro | 114 | 19 | 21 | 11 | 10 | 7 |
| Bárbaro | 117 | 24 | 10 | 5 | 5 | 7 |
| Mago | 88 | 21 | 9 | 5 | 4 | 12 |
| Curandeiro | 101 | 10 | 14 | 7 | 7 | 8 |
| Ladino | 87 | 19 | 10 | 5 | 5 | 17 |
| Bardo | 95 | 15 | 11 | 6 | 5 | 14 |
| Caçador | 87 | 19 | 7 | 4 | 3 | 17 |
| Animalista | 102 | 17 | 14 | 7 | 7 | 10 |

#### Nível 50

| Classe | HP | ATK | DEF | DEF_confronto | Mitigação | AGI |
|--------|----|-----|-----|--------------|-----------|-----|
| Guerreiro | 201 | 31 | 36 | 18 | 18 | 10 |
| Bárbaro | 204 | 40 | 18 | 9 | 9 | 11 |
| Mago | 151 | 35 | 15 | 8 | 7 | 17 |
| Curandeiro | 176 | 16 | 25 | 13 | 12 | 12 |
| Ladino | 151 | 31 | 16 | 8 | 8 | 26 |
| Bardo | 165 | 25 | 18 | 9 | 9 | 21 |
| Caçador | 151 | 31 | 12 | 6 | 6 | 26 |
| Animalista | 177 | 28 | 24 | 12 | 12 | 15 |

---

## 5. Teste de Balanceamento — Simulações de Confronto Lv10 ×  Lv10

Usando a fórmula canônica v2.1. Dado médio d20 = 10, sem buffs, sem ModClasse.

```
RC_médio = (10 + ATK_atacante) − (10 + DEF_confronto_defensor)
         = ATK_atacante − DEF_confronto_defensor

DanoBase_médio = PWR + ATK_atacante − Mitigação_defensor
```

### 5.1 Bárbaro (ATK 14) atacando Guerreiro (DEF 12 → conf=6, mit=6)

```
RC = 14 − 6 = +8 → Acerto Normal (borderline Acerto Forte)
DanoBase = 5 + 14 − 6 = 13
DanoFinal = 13 × 1.00 = 13
```

### 5.2 Guerreiro (ATK 11) atacando Bárbaro (DEF 6 → conf=3, mit=3)

```
RC = 11 − 3 = +8 → Acerto Normal (borderline Acerto Forte)
DanoBase = 4 + 11 − 3 = 12
DanoFinal = 12 × 1.00 = 12
```

**Conclusão:** Guerreiro e Bárbaro se machucam mutuamente, mas o Guerreiro (HP 61) aguenta mais que o Bárbaro (HP 64 — quase igual, mas DEF muito menor).

### 5.3 Mago (ATK 13) atacando Guerreiro (DEF 12 → conf=6, mit=6)

```
RC = 13 − 6 = +7 → Acerto Normal
DanoBase = 4 + 13 − 6 = 11
DanoFinal = 11 × 1.00 = 11
```

### 5.4 Guerreiro (ATK 11) atacando Mago (DEF 5 → conf=3, mit=2)

```
RC = 11 − 3 = +8 → Acerto Normal
DanoBase = 4 + 11 − 2 = 13
DanoFinal = 13 × 1.00 = 13
```

**Conclusão:** Guerreiro machuca Mago mais (13 vs 11) e aguenta mais (HP 61 vs 48). Consistente com papéis.

### 5.5 Ladino (ATK 11) com vantagem vs Mago (DEF 5 → conf=3, mit=2)

```
ModClasse = +2 (Ladino > Mago)
RC = (11 + 2) − 3 = +10 → Acerto Normal
DanoBase = 4 + 11 − 2 = 13
DanoFinal = 13 × 1.10 (vantagem) = 14
```

---

## 6. Análise de Sustentabilidade por Classe

Quantos **Acertos Normais** para derrotar cada classe (Lv10), considerando o atacante médio:

| Alvo (Lv10) | HP | DanoBase recebido típico | Acertos p/ derrotar |
|-------------|----|--------------------------|--------------------|
| Guerreiro | 61 | 8 (DEF alta mitiga bem) | ~8 |
| Bárbaro | 64 | 12 (DEF baixa) | ~5 |
| Mago | 48 | 12 (DEF mínima) | ~4 |
| Curandeiro | 56 | 9 (DEF mod.) | ~6 |
| Ladino | 47 | 11 (DEF baixa) | ~4 |
| Bardo | 52 | 10 (DEF mod.) | ~5 |
| Caçador | 47 | 12 (DEF mínima) | ~4 |
| Animalista | 57 | 9 (DEF mod.) | ~6 |

**Guerreiro** é o mais difícil de derrubar (8 acertos). Mas um Bárbaro causa 13 de DanoBase → apenas ~5 acertos. O Guerreiro resiste, não é invulnerável.

---

## 7. Comparativo DEF — Formato Antigo vs Novo

Para ilustrar por que a fórmula nova é mais saudável:

| DEF | DEF_confronto (nova) | Mitigação (nova) | Impacto total por acerto | (antigo: ratio DEF inteira) |
|-----|---------------------|-----------------|--------------------------|----------------------------|
| 4 | 2 | 2 | mitiga 2 no dano | ratio alto, mitiga ~40–60% do PODER |
| 8 | 4 | 4 | mitiga 4 no dano | dominante — quase bloqueia |
| 12 | 6 | 6 | mitiga 6 no dano | muito forte, mas não invulnerável |
| 16 | 8 | 8 | mitiga 8 no dano | tank sólido, ainda recebe dano |

**Fórmula antiga:** DEF 16 com ratio poderia reduzir dano em 60–70%, tornando um tank quase invencível em altas DEF.  
**Fórmula nova:** DEF 16 → mitiga 8 pontos. Com ATK 20 e PWR 8, DanoBase = 20. DanoFinal = 12. Tank resiste mas não é opressor.

---

## 8. Recomendações de Design

### 8.1 Para novos Monstrinhos
Use estes ranges como referência:

| Atributo | Mín. Lv1 | Máx. Lv1 | Obs. |
|----------|----------|----------|------|
| HP | 22 | 35 | Curandeiro/Ladino baixo, Guerreiro/Bárbaro alto |
| ATK | 3 | 9 | Curandeiro baixo, Bárbaro alto |
| DEF | 3 | 9 | Mago/Caçador baixo, Guerreiro alto |
| AGI | 3 | 11 | Guerreiro/Bárbaro baixo, Ladino/Caçador alto |
| ENE | 6 | 14 | Guerreiro baixo, Mago/Curandeiro alto |

### 8.2 Para balancear classe defensiva vs ofensiva
- **Tank (ex. Guerreiro):** DEF entre 6–9 Lv1, crescimento 0.50–0.65/lv. DEF_confronto e Mitigação crescem naturalmente.
- **Berserker (ex. Bárbaro):** ATK entre 8–10 Lv1, DEF entre 3–5. Alta pressão ofensiva, HP compensa a DEF fraca.
- **Suporte (ex. Curandeiro, Bardo):** ATK entre 3–6, ENE alto. Dano modesto, mas habilidades compensam.

### 8.3 Regra da coerência de papel
- Um Monstrinhomon com DEF ≥ 8 Lv1 NÃO deve ter ATK ≥ 8 também. O papel deve ser especializado.
- Um Monstrinhomon com AGI ≥ 9 NÃO deve ter DEF ≥ 7 e HP ≥ 30 juntos.

---

## 9. Fonte dos Dados

Os atributos-base foram derivados dos Monstrinhos nível 1 em `data/monsters.json`, agrupados por classe e calculados como médias arredondadas:

| Classe | Monstrinhos base usados |
|--------|------------------------|
| Guerreiro | MON_002 (Pedrino), MON_010 (Ferrozimon), MON_026 (Cascalhimon) |
| Bárbaro | MON_007 (Trovão), MON_021 (Tamborilhomon), MON_029 (Tigrumo) |
| Mago | MON_003 (Faíscari), MON_014 (Lagartomon), MON_024 (Coralimon) |
| Curandeiro | MON_004 (Ninfolha), MON_020 (Gotimon), MON_028 (Nutrilo) |
| Ladino | MON_008 (Sombrio), MON_022 (Corvimon), MON_030 (Furtilhon) |
| Bardo | MON_001 (Cantapau), MON_011 (Dinomon), MON_027 (Zunzumon) |
| Caçador | MON_005 (Garruncho), MON_013 (Miaumon), MON_025 (Pulimbon) |
| Animalista | MON_006 (Lobinho), MON_012 (Luvursomon), MON_023 (Cervimon) |
