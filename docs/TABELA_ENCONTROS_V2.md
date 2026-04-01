# Documento 4 — Tabela de Encontros e Exploração v2

> **Status:** Canônico — Aprovado para implementação  
> **Versão:** 2.0  
> **Última atualização:** 2026-03-31

---

## 1. Princípio Central

A exploração existe para dar **agência individual** a cada jogador antes do combate.  
Cada membro do grupo escolhe um ponto de busca dentro da área. O resultado é revelado antes ou durante o combate.

O loop é:
```
Grupo chega a uma área →
Cada jogador escolhe um ponto de busca →
Resultados são revelados →
Combate, captura ou evento acontece →
Recompensas distribuídas
```

---

## 2. Tipos de Área de Exploração

| Tipo de Área | Exemplos | Tom |
|--------------|----------|-----|
| Floresta | Floresta dos Susurros, Bosque Verde | Tranquilo, misterioso |
| Caverna | Caverna do Eco, Gruta Sombria | Tenso, claustrofóbico |
| Campo | Planícies Douradas, Campo do Vento | Aberto, rápido |
| Ruína | Ruínas Antigas, Templo Esquecido | Perigoso, recompensador |
| Água | Lago Cristalino, Pântano Turvo | Variado |
| Montanha | Pico Gelado, Serra do Trovão | Difícil, épico |
| Cidade/Vilarejo | Vilarejo Pacato, Mercado Movimentado | Social, comercial |

---

## 3. Pontos de Busca por Área

Cada área tem entre **4 e 6 pontos de busca** disponíveis para o grupo.

### 3.1 Nomenclatura dos Pontos

Os pontos devem ter nomes temáticos e visuais para a criança:

**Floresta (exemplo):**
- 🌿 Matinho Superior Esquerdo
- 🌿 Matinho Superior Direito
- 🪨 Pedras no Centro
- 🌊 Beira do Lago
- 🍄 Grupo de Cogumelos
- 🕳️ Buraco Escuro

**Caverna (exemplo):**
- 💎 Cristal Brilhante
- 🌑 Corredor Escuro
- 💧 Poça D'água
- 🪨 Parede Rachada
- 🕯️ Tocha Apagada

### 3.2 Escolha por Jogador

- Cada jogador escolhe 1 ponto de busca por rodada de exploração.
- Dois jogadores podem escolher o mesmo ponto (resultados independentes, mas podem ser compartilhados).
- Cada ponto tem sua própria tabela de resultados.

---

## 4. Tabela de Resultados por Ponto

Cada ponto gera um resultado ao ser explorado. O resultado depende do **tipo de ponto** e do **dado d6** (ou resultado automático).

### 4.1 Estrutura de Probabilidade Base

| Resultado | Peso (d6) | Observação |
|-----------|-----------|-----------|
| Nada | 1 | Ponto inerte; sem consequência |
| Item Comum | 2 | Item consumível de baixo valor |
| Encontro Selvagem | 3–4 | Combate/captura com monstrinho selvagem |
| Pista / Evento | 5 | Gatilha narrativa, armadilha leve ou cena |
| Encontro Raro | 6 | Monstrinho raro, item especial, mini-boss |

> O peso pode ser ajustado por área. Cavernas têm mais chance de encontro; vilas têm mais itens.

### 4.2 Tabela Ajustada por Tipo de Área

| Tipo | Nada | Item | Selvagem | Evento | Raro |
|------|------|------|----------|--------|------|
| Campo | 15% | 20% | 40% | 15% | 10% |
| Floresta | 10% | 15% | 45% | 15% | 15% |
| Caverna | 5% | 10% | 40% | 20% | 25% |
| Ruína | 5% | 15% | 30% | 25% | 25% |
| Montanha | 10% | 10% | 35% | 20% | 25% |
| Água | 15% | 20% | 40% | 15% | 10% |
| Cidade | 10% | 40% | 5% | 35% | 10% |

---

## 5. Encontros Selvagens

### 5.1 Definição

Um encontro selvagem é um combate **individual** entre 1 jogador e 1 Monstrinhomon selvagem.

- Captura é permitida.
- Fuga é permitida (com chance baseada em raridade).
- O restante do grupo observa; não intervém.

### 5.2 Escalonamento do Nível do Inimigo

```
nivel_inimigo = nivel_max_do_time + deslocamento_dificuldade + variacao_aleatoria

deslocamento_dificuldade:
  Fácil:   −1
  Médio:    0
  Difícil: +2

variacao_aleatoria: −1, 0, ou +1 (aleatório)
nivel_inimigo = max(1, nivel_inimigo)
```

### 5.3 Raridade do Selvagem por Tipo de Ponto

| Tipo de Ponto | Comum | Incomum | Raro | Místico | Lendário |
|---------------|-------|---------|------|---------|----------|
| Normal | 55% | 30% | 12% | 2% | 1% |
| Especial (brilhante) | 20% | 35% | 30% | 12% | 3% |
| Raro (marcado) | 5% | 20% | 40% | 30% | 5% |
| Boss (único) | — | — | 20% | 50% | 30% |

### 5.4 Captura

A captura segue as regras canônicas de `COMBATE_FORMULA_V2.md` (seção correspondente) e as regras de captura determinística.

```
Threshold_final = min(0.95, (base_raridade + bonus_item + bonus_status) × multiplicador_captura)

base_raridade:
  Comum:   0.60  (60%)
  Incomum: 0.45
  Raro:    0.30
  Místico: 0.18
  Lendário: 0.10

Captura bem-sucedida se HP% ≤ Threshold_final
```

---

## 6. Batalha contra Treinador

### 6.1 Definição

Uma batalha de treinador é um confronto de **grupo completo** contra um NPC com equipe estruturada.

- Todos os jogadores participam.
- Captura não permitida.
- Fuga permitida, mas pode ter penalidades narrativas.
- Recompensa superior a encontros selvagens.

### 6.2 Estrutura do Treinador Inimigo

| Nível do Treinador | N.º de Monstrinhos | Posicionamento |
|--------------------|-------------------|----------------|
| Iniciante | 1–2 | Todos na Frente |
| Intermediário | 2–3 | Frente + Meio |
| Avançado | 3–4 | Frente + Meio + Trás |
| Elite | 4–6 | Linha completa + substituição |

### 6.3 Recompensas de Treinador

```
Dinheiro = 50 + (nivel_médio_inimigos × 10) × (1 + dificuldade × 0.2)
XP = (battleXpBase + nivel_inimigo × 2) × multiplicador_raridade
Drops = tabela por dificuldade (ver seção 8)
```

---

## 7. Batalha Boss

### 7.1 Definição

Um Boss é um confronto especial: 1 Monstrinhomon único e poderoso (ou grupo coordenado) contra o grupo inteiro.

- Fuga proibida.
- Captura não permitida (exceto eventos especiais de campanha).
- Recompensas excepcionais.

### 7.2 Atributos Especiais do Boss

| Modificador | Valor |
|-------------|-------|
| HP | ×2.5 do padrão do nível |
| ATK | ×1.5 |
| DEF | ×1.5 |
| Imunidade a STUN | Sim |
| Imunidade a ROOT | Sim |
| Imunidade a debuff de AGI | Não |
| Habilidades únicas | Sim (definidas individualmente) |

### 7.3 Fases de Boss

Bosses de alta raridade podem ter **2 fases**:

| HP | Fase | Comportamento |
|----|------|--------------|
| 100% – 51% | Fase 1 | Padrão ofensivo |
| 50% – 0% | Fase 2 | Habilidade especial desbloqueada; ATK +20%; aggro muda |

### 7.4 Recompensas de Boss

```
Dinheiro = 200 + (nivel_boss × 20)
XP = (battleXpBase + nivel_boss × 2) × 1.5 × multiplicador_raridade
Drops = garantia de 1 item Raro + chance de Místico (20%) + chance de Lendário (5%)
```

---

## 8. Tabela de Drops por Tipo de Encontro

### 8.1 Itens Possíveis

| Tier | Exemplos | Tipo |
|------|----------|------|
| Comum | Petisco de Cura, Orbe Básico | Consumível |
| Incomum | Poção Grande, Orbe Reforçado | Consumível |
| Raro | Cristal de Energia, Pena Reviva | Consumível |
| Místico | Orbe Lendário, Escudo Arcano | Tático |
| Lendário | Fênix Reviva, Poção Máxima | Consumível especial |

### 8.2 Chance de Drop por Encontro

| Tipo de Encontro | Drop Garantido | Chance Extra |
|-----------------|----------------|-------------|
| Selvagem (derrota) | Nenhum | 30% de 1 item Comum |
| Selvagem (captura) | Nenhum | 15% de 1 item Comum |
| Treinador (vitória) | 1 item Comum | 20% Incomum |
| Treinador Elite (vitória) | 1 item Incomum | 25% Raro |
| Boss (vitória) | 1 item Raro | 20% Místico, 5% Lendário |

---

## 9. Eventos e Pistas

### 9.1 Tipos de Eventos

| Tipo | Descrição | Impacto |
|------|-----------|---------|
| Armadilha Leve | Buraco, rede, espinhos | Perde turno ou pequeno dano |
| Pista de Campanha | Mapa, inscrição, rastro | Avança narrativa |
| NPC Amigável | Mercador, ermitão, criança | Pode oferecer item ou informação |
| Clima Especial | Tempestade, neblina, chuva | Modifica temporariamente atributos |
| Aparição Espectral | Monstrinhomon fantasma | Encontro especial não-capturável |
| Armadilha Inimiga | Treinador emboscado | Batalha obrigatória sem pré-combate |

### 9.2 Eventos Terapêuticos

Durante eventos de exploração, o terapeuta pode inserir **momentos terapêuticos**:
- "Seu monstrinho encontrou um amigo triste. O que você faz?"
- "Existe um caminho mais difícil e um mais fácil. Qual você escolhe?"

Esses momentos são opcionais e registrados no sistema de objetivos terapêuticos.

---

## 10. Encontro Coletivo vs. Individual

### 10.1 Individual

- 1 jogador enfrenta o encontro.
- Restante do grupo aguarda ou explora outros pontos.
- Captura possível.
- XP somente para o jogador envolvido.

### 10.2 Coletivo (Gatilho de Grupo)

Alguns pontos de busca podem gerar um **encontro coletivo** que afeta todo o grupo:
- Boss inesperado.
- Armadilha de grupo.
- Batalha de treinador desencadeada por escolha de 1 jogador.

Quando coletivo:
- Todos os jogadores entram no combate.
- XP dividido igualmente.
- Decisões táticas são compartilhadas.

### 10.3 Encontro Simultâneo (Avançado)

Em explorações avançadas, 2 jogadores que escolheram o mesmo ponto podem encarar o mesmo Monstrinhomon selvagem em **batalha colaborativa** (2 atacantes vs 1 inimigo mais forte):
- Nível do inimigo é escalado: +3 níveis.
- Captura é decidida em conjunto.
- XP dividido igualmente.

---

## 11. Fuga de Encontro Selvagem

### 11.1 Fórmula de Fuga

```
chance_fuga = fuga_base_raridade + bonus_item_fuga
fuga bem-sucedida se d100 ≤ chance_fuga × 100

fuga_base_raridade:
  Comum:   10%
  Incomum: 12%
  Raro:    15%
  Místico: 18%
  Lendário: 25%
```

> Nota: quanto mais raro o Monstrinhomon, mais fácil ele foge quando não está sendo capturado.

### 11.2 Tentativa de Fuga pelo Jogador

```
DC_fuga (dificuldade para o jogador fugir):
  Normal:      12
  Intimidating: 16
  Elite:        18

Fuga do jogador: d20 + AGI ≥ DC_fuga
```

- Inimigos tipo Boss: fuga proibida para o jogador.
- Em batalhas de grupo (trainer): fuga permite 1 Monstrinhomon sair; não encerra o combate.

---

## 12. Resumo das Constantes

| Constante | Valor |
|-----------|-------|
| Pontos de busca por área | 4–6 |
| Peso "Nada" base | 10–15% |
| Peso "Encontro Selvagem" base | 35–45% |
| Peso "Encontro Raro" base | 10–25% (por área) |
| Boss: HP | ×2.5 padrão |
| Boss: ATK e DEF | ×1.5 padrão |
| Chance boss fase 2 | HP ≤ 50% |
| DC fuga jogador (normal) | 12 |
| DC fuga jogador (elite) | 18 |
| Drop mínimo (treinador) | 1 item Comum |
| Drop mínimo (boss) | 1 item Raro |
