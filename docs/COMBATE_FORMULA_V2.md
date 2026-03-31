# Documento 1 — Fórmula de Combate Canônica v2

> **Status:** Canônico — Aprovado para implementação  
> **Versão:** 2.0  
> **Última atualização:** 2026-03-31

---

## 1. Princípio Central

O combate do Monstrinhomon resolve cada ação em quatro camadas:

```
Camada 1: Iniciativa — quem age primeiro
Camada 2: Resolução — ataque vs. defesa (d20 bilateral)
Camada 3: Dano — calculado a partir do resultado do confronto
Camada 4: Efeitos — buffs, debuffs, status, posicionamento
```

Nenhum dos dois lados é apenas passivo. Ambos rolam d20 em todo confronto.

---

## 2. Estrutura de Atributos de Combate

Cada Monstrinhomon em batalha possui:

| Atributo | Abreviação | Descrição |
|----------|-----------|-----------|
| Pontos de Vida | HP | Vida atual / máxima |
| Energia | ENE | Combustível para habilidades especiais |
| Ataque | ATK | Poder ofensivo base |
| Defesa | DEF | Resistência ao dano |
| Agilidade | AGI | Determina ordem de turno |
| Alcance | ALC | Linhas que pode atingir (ver Posicionamento v2) |
| Posição | POS | Frente / Meio / Trás |

---

## 3. Ordem de Turno

### 3.1 Iniciativa
```
Ordem = AGI + d6 (rolado no início do encontro)
Maior valor age primeiro.
```

Em caso de empate: Monstrinhomon do jogador age antes do inimigo.

### 3.2 Recalculação
- A ordem é recalculada a cada rodada apenas se um personagem mudar de posição ou receber debuff de AGI.
- Em combate selvagem (1 vs 1), a ordem alterna naturalmente por turno.

---

## 4. Resolução do Confronto (d20 Bilateral)

Quando um Monstrinhomon ataca:

### 4.1 Rolagem Bilateral
```
Rolagem de Ataque  = d20 + ATK_atacante + ajuste_de_nível + bônus_classe + buffs_ativos
Rolagem de Defesa  = d20 + DEF_defensor + bônus_posição + buffs_defensivos
```

### 4.2 Resultado de Confronto (RC)
```
RC = Rolagem de Ataque − Rolagem de Defesa
```

### 4.3 Faixas de RC

| RC | Categoria | Efeito |
|----|-----------|--------|
| RC ≤ −6 | **Falha Total** | Ataque não entra. Nenhum dano. |
| −5 ≤ RC ≤ −1 | **Raspão** | Dano mínimo (ver seção 6.2). |
| 0 ≤ RC ≤ 7 | **Acerto Normal** | Dano padrão calculado. |
| RC ≥ 8 | **Acerto Forte** | Dano aumentado (ver seção 6.3). |

### 4.4 Regra do Dado Natural
- **d20 natural = 20 (atacante):** Acerto automático. RC = +8 (Acerto Forte), independente da defesa.
- **d20 natural = 1 (atacante):** Falha automática. RC = −10. Nenhum dano.
- **d20 natural = 20 (defensor):** Defesa excepcional. RC reduzido em 10 adicionalmente (pode converter Acerto em Falha).
- **d20 natural = 1 (defensor):** Defesa falha. RC aumentado em +5 adicionalmente.

---

## 5. Ajuste de Nível

O nível importa de verdade. A diferença de nível gera um Ajuste de Poder (AP):

### 5.1 Cálculo do Ajuste
```
dif = nível_atacante − nível_defensor

AP = clamp(dif * 0.7, −10, +10)
```

> Esse valor é somado à **Rolagem de Ataque** antes de calcular RC.

### 5.2 Tabela Resumida

| Diferença de Nível | Ajuste de Poder (AP) |
|--------------------|----------------------|
| −15 ou menos | −10 |
| −10 | −7 |
| −5 | −3,5 |
| 0 | 0 |
| +5 | +3,5 |
| +10 | +7 |
| +15 ou mais | +10 |

### 5.3 Impacto Real

- Diferença pequena (1–3 níveis): efeito leve, sorte pode virar.
- Diferença moderada (4–7 níveis): efeito perceptível, mas reversível com dado alto.
- Diferença grande (8–12 níveis): improvável que o mais fraco cause dano relevante.
- Diferença extrema (13+ níveis): quase impossível, exceto crítico natural 20.

---

## 6. Cálculo de Dano

### 6.1 Fórmula Base
```
PODER = poder da habilidade usada (ou PODER_BÁSICO se ataque sem energia)

ratio    = ATK_atacante / (ATK_atacante + DEF_defensor)
danoBase = Math.floor(PODER × ratio × mult_classe × mult_nível)
```

**Onde:**
```
mult_classe  = 1.10 se vantagem de classe, 0.90 se desvantagem, 1.00 se neutro
mult_nível   = clamp( (nível_atacante / nível_defensor) ^ 0.5, 0.70, 1.40 )
```

### 6.2 Dano por Categoria de RC

| Categoria | Modificador de Dano |
|-----------|---------------------|
| Falha Total | 0 |
| Raspão | max(1, Math.floor(danoBase × 0.30)) |
| Acerto Normal | max(1, danoBase) |
| Acerto Forte | max(1, Math.floor(danoBase × 1.40)) |

### 6.3 Dano Mínimo Universal
- **Sempre 1** — mesmo em desvantagem extrema com raspão.
- Exceção: Falha Total → 0 dano.

### 6.4 Dano Ilusório (Alvo Muito Superior)
Quando `nível_defensor − nível_atacante ≥ 10`:
- Mesmo que RC seja "Acerto Normal", o dano máximo é limitado a `min(danoCalculado, 2)`.
- O combate ainda pode continuar; a criança sente que "quase não dói".

---

## 7. Poder Base por Tipo de Ação

| Tipo | Poder Base (PODER_BÁSICO) | Custo ENE |
|------|--------------------------|-----------|
| Ataque Básico (sem evolução) | 10–14 (por classe) | 0 |
| Habilidade Tier I | 16–20 | 3–5 |
| Habilidade Tier II | 22–28 | 5–8 |
| Habilidade Tier III | 30–38 | 8–12 |
| Assinatura de Classe | 24–36 (efeito especial) | 8–14 |

### 7.1 PODER_BÁSICO por Classe

| Classe | PODER_BÁSICO | Justificativa |
|--------|-------------|---------------|
| Guerreiro | 13 | Linha de frente consistente |
| Bárbaro | 14 | Maior dano bruto |
| Mago | 11 | Compensado por habilidades fortes |
| Curandeiro | 10 | Menor ataque; foco em suporte |
| Ladino | 12 | Rápido, preciso |
| Bardo | 11 | Modesto; buffa aliados |
| Caçador | 12 | Alcance longo, dano constante |
| Animalista | 12 | Versátil |

---

## 8. Vantagem de Classe no Acerto

O ciclo de vantagens é:
```
Guerreiro > Ladino > Mago > Bárbaro > Caçador > Bardo > Curandeiro > Guerreiro
Animalista: neutro contra todos
```

| Situação | Bônus/Penalidade no ATK (Rolagem de Ataque) | Mult. Dano |
|----------|---------------------------------------------|-----------|
| Vantagem | +2 | ×1.10 |
| Neutro | 0 | ×1.00 |
| Desvantagem | −2 | ×0.90 |

---

## 9. Modo de Dado

### 9.1 Automático
- Sistema rola d20 internamente via `Math.random()`.
- Sem interação da criança.

### 9.2 Manual
- Criança rola dado físico d20 e informa o valor ao sistema.
- O sistema aceita o valor e calcula.
- O terapeuta/mestre pode mediar.

> Ambos os modos valem para **Rolagem de Ataque** e **Rolagem de Defesa**.

---

## 10. Buffs e Debuffs no Cálculo

### 10.1 Buffs Ofensivos (somados à Rolagem de Ataque)
- Aumento de ATK: `+X ao ATK_atacante` (entra no ratio e no AP)
- Precisão Reforçada: `+X direto na Rolagem de Ataque`

### 10.2 Buffs Defensivos (somados à Rolagem de Defesa)
- Aumento de DEF: `+X ao DEF_defensor`
- Escudo/Proteção: `+X direto na Rolagem de Defesa`

### 10.3 Debuffs
- Redução de ATK/DEF: subtração no respectivo atributo antes do cálculo.
- Vulnerabilidade: converte mult_dano para `×1.20` (cumulativo com vantagem de classe).

### 10.4 Limites
- ATK nunca cai abaixo de 1.
- DEF nunca cai abaixo de 0.
- Nenhum buff pode fazer RC garantido sem rolagem (d20 sempre importa).

---

## 11. Fluxo Completo de um Turno de Ataque

```
1. Verificar ordem (AGI)
2. Atacante escolhe ação (básico / habilidade / item / fuga)
3. Se ação de dano:
   a. Verificar energia (se habilidade)
   b. Modo de dado: automático ou manual?
   c. Rolagem de Ataque = d20 + ATK + AP_nível + bônus_classe + buffs
   d. Rolagem de Defesa = d20 + DEF_defensor + bônus_posição + buffs_defesa
   e. RC = Rolagem de Ataque − Rolagem de Defesa
   f. Verificar naturais (20/1)
   g. Classificar RC → Falha / Raspão / Normal / Forte
   h. Calcular danoFinal
   i. Aplicar dano ilusório se diferença extrema
4. Atualizar HP, ENE, efeitos ativos
5. Verificar derrota / troca / captura
6. Passar turno
```

---

## 12. Resumo das Constantes

| Constante | Valor |
|-----------|-------|
| d20 natural crítico (ataque) | RC mínimo +8, acerto automático |
| d20 natural 1 (ataque) | Falha automática, RC −10 |
| d20 natural 20 (defesa) | RC −10 adicional |
| d20 natural 1 (defesa) | RC +5 adicional |
| Ajuste de Nível (por nível) | 0.7 por nível de diferença, clamp −10/+10 |
| Mult. nível (dano) | (atk_lv/def_lv)^0.5, clamp 0.70–1.40 |
| Dano mínimo universal | 1 (exceto Falha Total) |
| Dano ilusório (dif ≥ 10 lv) | máximo 2 mesmo em Acerto Normal |
| Raspão mult. | ×0.30 |
| Acerto Forte mult. | ×1.40 |
| Vantagem de classe ATK | +2 |
| Desvantagem de classe ATK | −2 |
| Vantagem de classe dano | ×1.10 |
| Desvantagem de classe dano | ×0.90 |
