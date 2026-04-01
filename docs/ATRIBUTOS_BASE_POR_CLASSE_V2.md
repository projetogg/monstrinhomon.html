# Documento 5 — Atributos-Base por Classe v2

> **Status:** Canônico — Para testes práticos de balanceamento  
> **Versão:** 2.1  
> **Última atualização:** 2026-04-01

---

## 1. Princípio de Balanceamento

Os atributos não devem ser "iguais com skins diferentes". Mas também não podem ser tão extremos que uma classe vire resposta universal.

### Os eixos centrais

| Eixo | O que representa |
|------|-----------------|
| **HP** | Sobrevivência bruta |
| **ATK** | Pressão ofensiva |
| **DEF** | Resistência técnica |
| **ENE** | Uso de habilidades |
| **AGI** | Ordem de turno, responsividade |
| **Alcance** | Onde consegue atuar |
| **Função** | Papel tático principal |

### Regra geral de equilíbrio

> **Nenhuma classe deve liderar em mais de 2 eixos fortes ao mesmo tempo.**

### Escala-base

| Atributo | Mín. Lv1 | Máx. Lv1 |
|----------|----------|----------|
| HP | 16 | 26 |
| ATK | 3 | 8 |
| DEF | 2 | 8 |
| ENE | 3 | 8 |
| AGI | 2 | 8 |

Isso mantém identidade sem explodir cedo demais.

---

## 2. Tabela-Base por Classe (Nível 1 Canônico)

| Classe | HP | ATK | DEF | ENE | AGI | Alcance | Papel |
|--------|----|-----|-----|-----|-----|---------|-------|
| **Guerreiro** | 24 | 5 | 8 | 4 | 3 | Curto | Tank / proteção |
| **Bárbaro** | 22 | 8 | 4 | 3 | 4 | Curto | Burst / pressão |
| **Mago** | 18 | 7 | 3 | 7 | 4 | Médio | Ofensivo técnico |
| **Curandeiro** | 19 | 4 | 3 | 8 | 3 | Médio | Cura / suporte |
| **Bardo** | 18 | 4 | 3 | 7 | 5 | Longo | Buff / debuff |
| **Ladino** | 17 | 7 | 2 | 5 | 8 | Curto/Médio | Velocidade / execução |
| **Caçador** | 19 | 6 | 3 | 5 | 6 | Longo | Pressão à distância |
| **Animalista** | 21 | 6 | 5 | 5 | 5 | Curto/Médio | Versátil |

> **PWR Básico** (poder do ataque sem ENE): Guerreiro 4 · Bárbaro 5 · Mago 4 · Curandeiro 3 · Bardo 3 · Ladino 4 · Caçador 4 · Animalista 4

---

## 3. Perfis Canônicos por Classe

### 3.1 Guerreiro

**Função:** Linha de frente — proteção, sustentação de pressão.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| HP mais alto das classes físicas | AGI mínima — age depois de todos |
| DEF máxima da escala (8) | Alcance curto apenas |
| Resistência técnica superior | Burst ofensivo mais baixo |
| Habilidade de proteger aliados | Sofre muito contra kite e alcance longo |

**Leitura:** aguenta bem, causa dano razoável mas não excelente, pouca velocidade, pouca energia, muito funcional na linha de frente.

**Na fórmula (DEF 8 → Lv1):**
```
DEF_confronto = ceil(8/2) = 4
Mitigação     = floor(8/2) = 4
```
Alto, mas não absurdo. O Bárbaro (ATK 8 + PWR 5) causa: `5 + 8 - 4 = 9` de DanoBase. O Guerreiro aguenta — não é invulnerável.

---

### 3.2 Bárbaro

**Função:** Agressão pesada, pressão e burst.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| ATK máximo da escala (8) | DEF baixa — não tanka como Guerreiro |
| PWR básico mais alto (5) | ENE mínima — poucas habilidades |
| HP ainda bom para um ofensivo | Cai rápido sob foco sustentado |
| Habilidades de dano explosivo | Sem suporte ou utilidade |

**Leitura:** bate muito, aguenta mais que classes frágeis, mas depende de encaixar pressão. Pouca energia limita o jogo longo.

**Na fórmula (DEF 4 → Lv1):**
```
DEF_confronto = ceil(4/2) = 2
Mitigação     = floor(4/2) = 2
```
DanoBase recebido (de atacante médio ATK 6, PWR 4): `4 + 6 - 2 = 8`. Recebe dano quase pleno — depende de eliminar antes.

---

### 3.3 Mago

**Função:** Dano técnico, controle, efeito ofensivo.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| ATK alto para suporte de dano | DEF mínima — frágil em confronto |
| ENE alta — usa habilidades com frequência | HP mais baixo das classes ofensivas |
| Alcance médio — atua da retaguarda | Precisa de proteção na linha de trás |
| Habilidades de controle (debuff, root) | Burst real depende de ENE disponível |

**Leitura:** ofensivo forte, boa reserva de energia, mas frágil. Linha de frente é fatal para ele.

**Na fórmula (DEF 3 → Lv1):**
```
DEF_confronto = ceil(3/2) = 2
Mitigação     = floor(3/2) = 1
```
Recebe quase dano pleno em qualquer acerto.

---

### 3.4 Curandeiro

**Função:** Sustentação, recuperação, suporte.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| ENE máxima da escala (8) — cura frequente | ATK mais baixo do sistema |
| HP razoável para um suporte | DEF fraca — não resiste diretamente |
| Cura em área (assinatura de classe) | Fraquíssima pressão ofensiva |
| Muito valor em combate longo | Se isolado, sofre muito |

**Leitura:** dano baixo, muita energia, não é resistente. Forte em utilidade e sustentação — inútil se forçado a combater sozinho.

**Na fórmula:** DanoBase básico (Lv1): `3 + 4 - 1 = 6`. Fraco, mas existe. O valor real está nas habilidades.

---

### 3.5 Bardo

**Função:** Buff, debuff, ritmo e suporte coletivo.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| AGI moderada — age antes dos lentos | ATK e PWR modestos — dano individual baixo |
| ENE alta — usa habilidades de suporte | DEF fraca — frágil como Mago |
| Alcance longo — atua com segurança | Depende do time para converter valor |
| Mexe no fluxo do combate (buffs/debuffs) | Se o time estiver fraco, ele também fraqueja |

**Leitura:** não é um grande causador de dano. Atua bem de trás. Responsivo. Valor real está na manipulação do fluxo.

---

### 3.6 Ladino

**Função:** Velocidade, oportunidade, execução.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| AGI máxima da escala (8) — age primeiro | HP mais baixo do sistema |
| ATK alto para um velocista | DEF mínima (2) — qualquer acerto dói muito |
| Assinatura de execução (bônus vs alvo fraco) | Erro de posicionamento é fatal |
| Mobilidade: troca de posição gratuita | Não aguenta pressão frontal sustentada |

**Leitura:** muito rápido, ofensivo, mas sem sustentação. Excelente em janelas de oportunidade, péssimo em desgaste.

**Na fórmula (DEF 2 → Lv1):**
```
DEF_confronto = ceil(2/2) = 1
Mitigação     = floor(2/2) = 1
```
Recebe dano bruto. Um único Acerto Forte dói muito.

---

### 3.7 Caçador

**Função:** Consistência ofensiva à distância, marcação, foco.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| AGI alta — age cedo, antes de classes lentas | DEF mínima — não sobrevive na linha de frente |
| Alcance longo — atinge qualquer linha | HP modesto |
| Marcação: bônus contra alvo fixo | Perde conforto se alcançado diretamente |
| Dano consistente sem depender de habilidades | Depende de posição para funcionar |

**Leitura:** forte à distância, consistente, boa agilidade. Fraco se exposto no corpo a corpo.

---

### 3.8 Animalista

**Função:** Adaptação, versatilidade, resposta situacional.

| Ponto Forte | Ponto Fraco |
|-------------|-------------|
| HP acima da média das classes versáteis | Não lidera esmagadoramente em nenhum eixo |
| DEF moderada — mais resistente que ofensivos puros | Não domina um eixo extremo |
| Balanceado em ATK/DEF/AGI | Depende mais de boa pilotagem |
| Habilidade de postura (adaptável ao contexto) | Alcance limitado |

**Leitura:** classe coringa. Não domina nada, mas não é fraco em nada. Mais sensível ao design de habilidades.

---

## 4. Crescimento por Nível

### 4.1 Prioridades de Crescimento por Classe

A cada nível, cada classe cresce preferencialmente em seus atributos prioritários. Sem crescimento igual para todos.

| Classe | Prioridade (da mais alta à mais baixa) |
|--------|----------------------------------------|
| Guerreiro | HP → DEF → ATK → ENE → AGI |
| Bárbaro | ATK → HP → AGI → DEF → ENE |
| Mago | ENE → ATK → AGI → HP → DEF |
| Curandeiro | ENE → HP → habilidade → DEF → ATK |
| Bardo | ENE → AGI → habilidade → HP → ATK |
| Ladino | AGI → ATK → ENE → HP → DEF |
| Caçador | AGI → ATK → ENE → HP → DEF |
| Animalista | ATK/DEF/AGI equilíbrio → ENE → HP |

### 4.2 Taxas de Crescimento por Nível

| Classe | HP/lv | ATK/lv | DEF/lv | AGI/lv | ENE/lv |
|--------|-------|--------|--------|--------|--------|
| Guerreiro | 3.20 | 0.40 | 0.55 | 0.15 | 0.30 |
| Bárbaro | 3.00 | 0.65 | 0.25 | 0.20 | 0.15 |
| Mago | 2.20 | 0.55 | 0.15 | 0.25 | 0.65 |
| Curandeiro | 2.80 | 0.20 | 0.25 | 0.10 | 0.70 |
| Bardo | 2.50 | 0.25 | 0.15 | 0.30 | 0.65 |
| Ladino | 2.30 | 0.50 | 0.10 | 0.40 | 0.45 |
| Caçador | 2.50 | 0.50 | 0.15 | 0.35 | 0.45 |
| Animalista | 2.80 | 0.40 | 0.35 | 0.25 | 0.40 |

> ENE/lv é a taxa de crescimento de energia máxima por nível (universal mínimo de 0.15).

### 4.3 Fórmulas de Crescimento

```javascript
HP(lv)  = baseHp  + (lv - 1) * hpPerLv           // arredondado
ATK(lv) = baseAtk + floor((lv - 1) * atkPerLv)
DEF(lv) = baseDef + floor((lv - 1) * defPerLv)
AGI(lv) = baseAgi + floor((lv - 1) * agiPerLv)
ENE(lv) = baseEne + floor((lv - 1) * enePerLv)
```

### 4.4 Projeções de Atributos — Nível 10

| Classe | HP | ATK | DEF | DEF_conf | Mitig. | AGI | ENE |
|--------|----|-----|-----|----------|--------|-----|-----|
| Guerreiro | **53** | 8 | **12** | **6** | **6** | 4 | 6 |
| Bárbaro | 49 | **13** | 6 | 3 | 3 | 5 | 4 |
| Mago | 38 | 11 | 4 | 2 | 2 | 6 | 12 |
| Curandeiro | 44 | 5 | 5 | 3 | 2 | 3 | 13 |
| Bardo | 41 | 6 | 4 | 2 | 2 | **7** | 12 |
| Ladino | 38 | 11 | 2 | 1 | 1 | **11** | 9 |
| Caçador | 42 | 10 | 4 | 2 | 2 | 9 | 9 |
| Animalista | 46 | 9 | 8 | 4 | 4 | 7 | 8 |

### 4.5 Projeções de Atributos — Nível 25

| Classe | HP | ATK | DEF | DEF_conf | Mitig. | AGI | ENE |
|--------|----|-----|-----|----------|--------|-----|-----|
| Guerreiro | **101** | 14 | **21** | **11** | **10** | 6 | 11 |
| Bárbaro | 94 | **23** | 10 | 5 | 5 | 8 | 6 |
| Mago | 71 | 20 | 6 | 3 | 3 | 10 | 22 |
| Curandeiro | 86 | 8 | 9 | 5 | 4 | 5 | 24 |
| Bardo | 78 | 10 | 6 | 3 | 3 | 12 | 22 |
| Ladino | 72 | 19 | 4 | 2 | 2 | **17** | 18 |
| Caçador | 79 | 18 | 6 | 3 | 3 | 14 | 18 |
| Animalista | 88 | 15 | 13 | 7 | 6 | 11 | 14 |

### 4.6 Projeções de Atributos — Nível 50

| Classe | HP | ATK | DEF | DEF_conf | Mitig. | AGI | ENE |
|--------|----|-----|-----|----------|--------|-----|-----|
| Guerreiro | **181** | 24 | **34** | **17** | **17** | 10 | 18 |
| Bárbaro | 169 | **39** | 16 | 8 | 8 | 13 | 10 |
| Mago | 126 | 33 | 10 | 5 | 5 | 16 | 38 |
| Curandeiro | 156 | 13 | 15 | 8 | 7 | 7 | 42 |
| Bardo | 141 | 16 | 10 | 5 | 5 | 19 | 38 |
| Ladino | 130 | 31 | 6 | 3 | 3 | **27** | 31 |
| Caçador | 142 | 30 | 10 | 5 | 5 | 23 | 31 |
| Animalista | 158 | 25 | 22 | 11 | 11 | 17 | 25 |

---

## 5. Regras de Teto Relativo por Classe

Para evitar deriva de design, cada classe tem limites conceituais:

| Classe | Pode ser | NÃO pode ser |
|--------|----------|-------------|
| Guerreiro | Top 1 DEF · Top 2 HP | Top 2 AGI · Top 2 burst |
| Bárbaro | Top 1 ATK | Top 1 DEF · Top 1 ENE |
| Mago | Top 2 ATK · Top 1 ENE | Top 3 HP · Top 3 DEF |
| Curandeiro | Top 1 ENE | Top 3 dano bruto · Top 3 DEF |
| Bardo | Top 1 ENE (compartilha com Curandeiro) | Top 3 HP · Top 3 ATK |
| Ladino | Top 1 AGI | Top 4 HP/DEF |
| Caçador | Top 2 AGI · Top 2 ATK | Top 3 HP · Top 3 DEF |
| Animalista | Equilibrado — sem pico | Liderar qualquer eixo individualmente |

---

## 6. Como a Tabela Conversa com a Fórmula v2.1

A fórmula canônica (ver `docs/COMBATE_FORMULA_V2.md`) funciona melhor com esta lógica:

### Confronto
```
ResultadoConfronto = (d20A + ATK + bônus) − (d20D + ceil(DEF/2) + bônus)
```

### Dano
```
DanoBase = PWR + ATK + ModNível − floor(DEF/2)
```

Esta combinação faz sentido com a tabela porque:
- Classes com **DEF alta** (Guerreiro) resistem de verdade — sem anular o jogo
- Classes com **ATK alto** (Bárbaro, Mago) realmente pressionam
- **AGI alta** importa por ordem e responsividade, não por dano bruto
- **ENE alta** sustenta uso tático, não sobrevivência

---

## 7. Regras Extras de Proteção do Balanceamento

### Regra A — Proteção custa ação valiosa

A habilidade de proteger aliados não pode ser "sempre boa sem custo real":
- Custo de ENE obrigatório
- Duração de 1 turno (não persiste automaticamente)
- Exige posição Frente para redirecionar dano
- Penalidade: ao usar Proteção Total, o Guerreiro não usa habilidades ofensivas no turno seguinte

### Regra B — ATK do tank não escala como ofensivos puros

O ataque básico do Guerreiro pode ser sólido, mas o do Bárbaro e do Caçador precisam escalar melhor no late game.

| Classe | ATK/lv |
|--------|--------|
| Guerreiro | 0.40 |
| Bárbaro | **0.65** |
| Caçador | **0.50** |
| Mago | **0.55** |

No Lv50: Guerreiro ATK 24 · Bárbaro ATK 39 · Mago ATK 33. O gap é real e necessário.

### Regra C — Ferramentas anti-tank precisam existir

Sem debuffs de defesa e efeitos de posição, o sistema fica enviesado para o Guerreiro. São necessários:
- Habilidades de **redução de DEF** (Mago, Ladino)
- Efeitos de **posição que forçam reposicionamento** (Ladino, Caçador)
- **Dano de perfuração** que ignora parte da mitigação (Bárbaro assinatura)

---

## 8. Simulações de Balanceamento (Lv10)

Usando a fórmula canônica v2.1. Dado médio d20 = 10, sem buffs, sem ModClasse, mesmo nível.

```
RC_médio      = ATK_atacante − DEF_conf_defensor
DanoBase_médio = PWR + ATK_atacante − Mitigação_defensor
```

### 8.1 Bárbaro (ATK 13) atacando Guerreiro (DEF 12 → conf=6, mit=6)

```
RC = 13 − 6 = +7 → Acerto Normal (limite superior)
DanoBase = 5 + 13 − 6 = 12
DanoFinal = 12 × 1.00 = 12
```
Com HP 53, o Guerreiro aguenta **~4–5 acertos**. Resistente, não invulnerável.

### 8.2 Guerreiro (ATK 8) atacando Bárbaro (DEF 6 → conf=3, mit=3)

```
RC = 8 − 3 = +5 → Acerto Normal
DanoBase = 4 + 8 − 3 = 9
DanoFinal = 9 × 1.00 = 9
```
Com HP 49, o Bárbaro aguenta **~5 acertos**. Mas o Bárbaro causa 12 vs o Guerreiro que causa 9 — pressão ofensiva superior do Bárbaro fica clara.

### 8.3 Mago (ATK 11) atacando Guerreiro (DEF 12 → conf=6, mit=6)

```
RC = 11 − 6 = +5 → Acerto Normal
DanoBase = 4 + 11 − 6 = 9
DanoFinal = 9 × 1.00 = 9
```

### 8.4 Guerreiro (ATK 8) atacando Mago (DEF 4 → conf=2, mit=2)

```
RC = 8 − 2 = +6 → Acerto Normal
DanoBase = 4 + 8 − 2 = 10
DanoFinal = 10 × 1.00 = 10
```
Guerreiro causa 10 vs Mago que causa 9 no Guerreiro. Com HP 53 vs 38, o Mago cai muito mais rápido — consistente com os papéis.

### 8.5 Ladino (ATK 11, AGI 11) com vantagem vs Mago (DEF 4 → conf=2, mit=2)

```
ModClasse = +2 (Ladino > Mago)
RC = (11 + 2) − 2 = +11 → Acerto Forte!
DanoBase = 4 + 11 − 2 = 13
DanoFinal = 13 × 1.25 × 1.10 (vantagem) ≈ 17
```
Ladino age primeiro (AGI 11 vs 6) e causa 17 de dano. Com HP 38, o Mago perdeu ~45% do HP em um turno. Janela de oportunidade real.

---

## 9. Análise de Sustentabilidade (Lv10)

Quantos **Acertos Normais** médios para derrotar cada classe, considerando atacante médio do mesmo nível:

| Alvo (Lv10) | HP | DanoBase médio recebido | Acertos p/ derrotar |
|-------------|----|-----------------------|---------------------|
| **Guerreiro** | **53** | ~8–9 (DEF alta mitiga) | **~6–7** |
| Bárbaro | 49 | ~12–13 (DEF baixa) | ~4 |
| Mago | 38 | ~12 (DEF mínima) | ~3 |
| Curandeiro | 44 | ~10 (DEF mod.) | ~4–5 |
| Bardo | 41 | ~11 (DEF baixa) | ~4 |
| Ladino | 38 | ~12 (DEF mínima) | ~3 |
| Caçador | 42 | ~11 (DEF baixa) | ~4 |
| Animalista | 46 | ~9 (DEF mod.) | ~5 |

**Guerreiro** é o mais difícil de derrubar (6–7 acertos) — sem ser invulnerável.  
**Ladino e Mago** caem rápido (3 acertos) — mas compensam com iniciativa (Ladino) ou ENE e controle (Mago).

---

## 10. Comparativo DEF — Fórmula Antiga vs Nova

| DEF Lv1 | DEF_conf (nova) | Mitig. (nova) | Fórmula antiga (ratio) |
|---------|----------------|--------------|------------------------|
| 2 (Ladino) | 1 | 1 | ratio ~25–35% do PODER |
| 3 (Mago/Curand.) | 2 | 1 | ratio ~30–40% do PODER |
| 5 (Animalista) | 3 | 2 | ratio ~40–50% do PODER |
| 8 (Guerreiro) | 4 | 4 | dominante — ~55–65% do PODER |

**Fórmula antiga:** Guerreiro DEF 8 poderia anular 55–65% do dano pela fórmula ratio. No Lv50 com DEF 34, ficava opressor.  
**Fórmula nova:** Guerreiro DEF 8 → mitiga 4 pontos fixos. Dano de `5 + 8 - 4 = 9`. Resistente, não invulnerável. No Lv50 com DEF 34 → mitiga 17 pontos, mas ATK do Bárbaro chega a 39. DanoBase = `5 + 39 - 17 = 27`. O tank resiste, o Bárbaro pressiona.

---

## 11. Regras de Design para Novos Monstrinhos

### 11.1 Ranges de referência Lv1

| Atributo | Mín. | Máx. | Observação |
|----------|------|------|-----------|
| HP | 16 | 26 | Ladino baixo, Guerreiro alto |
| ATK | 3 | 8 | Curandeiro baixo, Bárbaro alto |
| DEF | 2 | 8 | Ladino mínima, Guerreiro máxima |
| AGI | 2 | 8 | Guerreiro/Curandeiro baixo, Ladino máxima |
| ENE | 3 | 8 | Bárbaro mínima, Curandeiro máxima |

### 11.2 Regra de coerência de papel

- Um Monstrinhomon com DEF ≥ 7 **não** deve ter ATK ≥ 7 também.
- Um Monstrinhomon com AGI ≥ 7 **não** deve ter DEF ≥ 6 e HP ≥ 22 juntos.
- Um Monstrinhomon com ENE ≥ 7 **não** deve ter ATK ≥ 7 ou DEF ≥ 6.

Papel deve ser especializado — **nenhuma classe lidera em mais de 2 eixos fortes ao mesmo tempo**.
