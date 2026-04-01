# Documento 1 — Fórmula de Combate Canônica v2

> **Status:** Canônico — Aprovado para implementação  
> **Versão:** 2.1 (revisão de balanceamento — DEF parcial)  
> **Última atualização:** 2026-03-31

---

## Princípio de Balanceamento

Ataque, Defesa, Nível e Sorte não entram com o mesmo peso em todas as etapas.

| Elemento | Confronto | Dano |
|----------|-----------|------|
| d20 | **Forte** | Fraco (via faixa) |
| ATK | Médio | **Forte** |
| DEF | Médio — meia escala | Médio — meia escala |
| Nível | Discreto (±5 max) | Discreto |
| PWR da ação | — | **Forte** |

Isso separa funções:
- o **d20** decide a qualidade do contato;
- o **ATK** pressiona confronto e dano;
- a **DEF** influencia confronto e mitigação, mas em meia escala (não esmaga o dano);
- o **nível** corrige hierarquia sem matar a sorte;
- o **PWR** da ação define o peso ofensivo real.

---

## 1. Estrutura de Atributos de Combate

Cada Monstrinhomon em batalha possui:

| Atributo | Abreviação | Descrição |
|----------|-----------|-----------|
| Pontos de Vida | HP | Vida atual / máxima |
| Energia | ENE | Combustível para habilidades especiais |
| Ataque | ATK | Poder ofensivo base |
| Defesa | DEF | Resistência defensiva |
| Agilidade | AGI | Determina ordem de turno |
| Poder da Ação | PWR | Potência base da ação usada |
| Nível | LVL | Hierarquia de progressão |
| Alcance | ALC | Linhas que pode atingir (ver Posicionamento v2) |
| Posição | POS | Frente / Meio / Trás |

---

## 2. Os Dois Papéis da Defesa

A **DEF** participa em dois momentos diferentes — com pesos diferentes:

### Papel 1 — DEF de Confronto
Representa bloquear, esquivar, amortecer a entrada do golpe.

```
DEF_confronto = ceil(DEF / 2)
```

Exemplos: DEF 4 → 2 | DEF 6 → 3 | DEF 8 → 4 | DEF 10 → 5

### Papel 2 — Mitigação de Dano
Representa reduzir o impacto após o golpe já ter entrado.

```
Mitigação = floor(DEF / 2)
```

Exemplos: DEF 4 → 2 | DEF 6 → 3 | DEF 8 → 4 | DEF 10 → 5

> **Regra de segurança:** 1 ponto de DEF não pode valer mais do que 1 ponto de ATK no efeito total médio. A divisão por 2 em cada etapa garante isso.

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

## 4. Etapa A — Validar Ação

Antes de resolver o confronto, verificar:

1. **Alcance** — alvo está dentro do alcance da ação e posição?
2. **Posição** — Monstrinhomon está em posição válida para a ação?
3. **Energia** — ENE atual ≥ custo da habilidade (se aplicável)?
4. **Alvo válido** — alvo não está desmaiado ou imune?

Se qualquer validação falhar, a ação não acontece.

---

## 5. Etapa B — Resolver o Confronto (d20 Bilateral)

### 5.1 Fórmula do Confronto

```
ResultadoConfronto (RC) =
  (d20A + ATK + BônusAção + ModNível + ModClasse + BuffOfensivo)
  −
  (d20D + DEF_confronto + ModPosição + BuffDefensivo)
```

Onde `DEF_confronto = ceil(DEF_defensor / 2)`.

### 5.2 Modificador de Nível (ModNível)

Baseado na **diferença líquida** entre atacante e defensor.  
Aplicado uma vez, como saldo líquido na fórmula:

| Diferença de Nível (ataque − defesa) | ModNível |
|--------------------------------------|---------|
| ≤ −20 | −5 |
| −15 a −19 | −4 |
| −10 a −14 | −3 |
| −6 a −9 | −2 |
| −3 a −5 | −1 |
| −2 a +2 | 0 |
| +3 a +5 | +1 |
| +6 a +9 | +2 |
| +10 a +14 | +3 |
| +15 a +19 | +4 |
| ≥ +20 | +5 |

> O bônus máximo de nível é **±5**. Isso preserva o impacto do d20.

### 5.3 Faixas do Resultado de Confronto

| RC | Categoria | Efeito no Dano |
|----|-----------|----------------|
| ≤ −8 | **Falha Total** | 0 |
| −7 a −3 | **Contato Neutralizado** | 0 ou 1 (ver seção 7) |
| −2 a +3 | **Acerto Reduzido** | 60% do DanoBase (mín. 1) |
| +4 a +10 | **Acerto Normal** | 100% do DanoBase |
| ≥ +11 | **Acerto Forte** | 125% do DanoBase |

### 5.4 Regras dos Dados Naturais

| Evento | Efeito no RC |
|--------|-------------|
| Atacante tira **20 natural** | +4 no RC; +20% no dano final |
| Atacante tira **1 natural** | −6 no RC (pode causar Falha Total) |
| Defensor tira **20 natural** | +5 no confronto defensivo (subtrai 5 do RC) |
| Defensor tira **1 natural** | −4 no confronto defensivo (soma 4 ao RC) |

> Não há "acerto automático" ou "falha automática" absoluta — os dados naturais ajustam muito o RC, mas os atributos ainda importam.

---

## 6. Etapa C — Calcular o Dano

### 6.1 Fórmula do Dano Base

```
DanoBase = PWR + ATK_atacante + ModNívelDano − Mitigação
```

Onde:
- `PWR` = poder da ação usada (ver seção 9)
- `Mitigação = floor(DEF_defensor / 2)`
- `ModNívelDano` = ModNível da tabela acima (mesmo valor do confronto)

**DanoBase mínimo antes do multiplicador:** 1 (se houve acerto válido).

### 6.2 Multiplicador por Faixa

| Categoria | Multiplicador | Observação |
|-----------|--------------|-----------|
| Falha Total | ×0 | Sem dano |
| Contato Neutralizado | ×0 | Com possibilidade de 1 fixo |
| Acerto Reduzido | ×0.60 | Mínimo 1 |
| Acerto Normal | ×1.00 | — |
| Acerto Forte | ×1.25 | — |

```
DanoFinal = max(minDano, floor(DanoBase × multiplicador_faixa))
```

- Se Falha Total ou Contato Neutralizado → `DanoFinal = 0` (ou 1, ver seção 7)
- Se qualquer Acerto → `DanoFinal = max(1, DanoBase × mult)`

### 6.3 Bônus de Crítico no Dano

Quando o atacante tirou **20 natural**: `DanoFinal × 1.20` (após o multiplicador de faixa).

---

## 7. Regras Especiais de Nível

### 7.1 Contato Neutralizado — Dano 0 ou 1

"Contato Neutralizado" normalmente resulta em 0 dano.  
Porém, se o atacante **não** estiver 10 ou mais níveis abaixo do defensor:
- O dano pode ser 1 (representa um toque simbólico).

### 7.2 Dano Ilusório (Atacante Muito Inferior)

Se `LVL_defensor − LVL_atacante ≥ 10` e o resultado for **Contato Neutralizado** ou **Acerto Reduzido**:

```
DanoFinal = 1
```

O fraco pode encaixar um golpe por sorte, mas não fere seriamente um muito superior.

### 7.3 Superioridade Real (Atacante Muito Superior)

Se `LVL_atacante − LVL_defensor ≥ 10`:
- Um resultado de **Contato Neutralizado** sobe para **Acerto Reduzido** automaticamente.
- Exceção: se o atacante tirou **1 natural** ou o defensor tirou **20 natural**, a regra não se aplica.

Isso impede que monstros muito fortes sejam frustrados por pequenas oscilações do dado.

---

## 8. Balanceamento de Classe no Confronto e no Dano

### 8.1 Ciclo de Vantagens
```
Guerreiro > Ladino > Mago > Bárbaro > Caçador > Bardo > Curandeiro > Guerreiro
Animalista: neutro contra todos
```

### 8.2 Efeito da Vantagem/Desvantagem

| Situação | ModClasse (Confronto) | Mult. Dano |
|----------|-----------------------|-----------|
| Vantagem | +2 | ×1.10 |
| Neutro | 0 | ×1.00 |
| Desvantagem | −2 | ×0.90 |

---

## 9. Poder Base por Tipo de Ação (PWR)

| Tipo | PWR típico | Custo ENE |
|------|-----------|-----------|
| Ataque Básico (Slot 1) | 2–4 | 0 |
| Habilidade Inicial (Slot 2) | 4–6 | 2 |
| Habilidade Tática (Slot 3) | 0–6 | 3 |
| Assinatura de Classe (Slot 4) | 5–8 (+ efeito especial) | 4 |

> **Nota sobre PWR:** Na nova fórmula, o dano já soma ATK diretamente (`DanoBase = PWR + ATK − Mitigação`). Por isso os valores de PWR são intencionalmente baixos (2–8) — o ATK não entra como "ratio", entra como soma direta. Habilidades de suporte, buff e controle podem ter PWR 0 e ainda assim serem fortíssimas.

### 9.1 PWR do Ataque Básico por Classe

| Classe | PWR Básico | ATK Lv1 | DanoBase esperado Lv1 (vs DEF 4 → mit=2) |
|--------|-----------|---------|-------------------------------------------|
| Guerreiro | 3 | 5 | 3+5−2 = **6** |
| Bárbaro | 4 | 8 | 4+8−2 = **10** |
| Mago | 3 | 7 | 3+7−2 = **8** |
| Curandeiro | 2 | 4 | 2+4−2 = **4** |
| Ladino | 3 | 7 | 3+7−1 = **9** *(vs DEF 2 → mit=1)* |
| Bardo | 2 | 4 | 2+4−2 = **4** |
| Caçador | 3 | 6 | 3+6−2 = **7** |
| Animalista | 3 | 6 | 3+6−2 = **7** |

---

## 10. Modo de Dado

### 10.1 Automático
- Sistema rola d20 internamente via `Math.random()`.
- Sem interação da criança.

### 10.2 Manual
- Criança rola dado físico d20 e informa o valor ao sistema.
- O sistema aceita o valor e calcula normalmente.
- O terapeuta/mestre pode mediar.

> Ambos os modos valem para a **Rolagem de Ataque** e a **Rolagem de Defesa**.

---

## 11. Buffs e Debuffs no Cálculo

### 11.1 Buffs Ofensivos
Entram como `BuffOfensivo` na fórmula do Confronto:
- Aumento de ATK: somado ao ATK antes de entrar na fórmula (afeta confronto e dano).
- Precisão Reforçada: somado diretamente ao confronto (só afeta RC, não dano).

### 11.2 Buffs Defensivos
Entram como `BuffDefensivo` na fórmula do Confronto:
- Aumento de DEF: somado ao DEF antes de calcular DEF_confronto e Mitigação.
- Escudo/Proteção: somado diretamente ao confronto (só afeta RC, não dano).

### 11.3 Debuffs
- Redução de ATK/DEF: subtração antes do cálculo.
- Vulnerabilidade: `DanoFinal × 1.20` (cumulativo com vantagem de classe).

### 11.4 Limites
- ATK nunca cai abaixo de 1.
- DEF nunca cai abaixo de 0 (DEF_confronto e Mitigação mínimos = 0).
- Nenhum buff pode garantir RC fixo — o d20 sempre importa.

---

## 12. Regras de Habilidades Defensivas

Toda habilidade do tipo "proteger aliado" deve ter custo real para evitar que classes defensivas sejam boas em tudo ao mesmo tempo:

- **Custo de energia obrigatório.**
- **Duração de 1 turno** (não persiste automaticamente).
- **Exige posição Frente** para redirecionar dano de aliados na mesma linha.
- **Penalidade de ação:** ao usar Proteção Total, o Guerreiro não pode usar habilidades ofensivas no turno seguinte.

---

## 13. Fluxo Completo de um Turno de Ataque

```
Etapa A — Validar ação
  1. Alcance válido?
  2. Posição válida?
  3. ENE suficiente?
  4. Alvo válido?

Etapa B — Resolver Confronto
  5. Atacante escolhe modo de dado (automático / manual)
  6. d20A → Rolagem de Ataque = d20A + ATK + BônusAção + ModNível + ModClasse + BuffOfensivo
  7. d20D → Rolagem de Defesa = d20D + DEF_confronto + ModPosição + BuffDefensivo
  8. RC = Rolagem de Ataque − Rolagem de Defesa
  9. Aplicar dado natural (20/1 de cada lado)
 10. Classificar RC → Falha Total / Contato Neutralizado / Acerto Reduzido / Normal / Forte
 11. Aplicar regra de Superioridade Real se aplicável

Etapa C — Calcular Dano
 12. DanoBase = PWR + ATK + ModNívelDano − Mitigação
 13. DanoFinal = DanoBase × multiplicador_faixa
 14. Aplicar crítico (+20% se d20A=20)
 15. Aplicar Dano Ilusório se aplicável
 16. Garantir mínimo 1 se houve Acerto

Etapa D — Resolver Efeitos
 17. Atualizar HP, ENE, buffs/debuffs ativos
 18. Verificar derrota / troca / captura / posição
 19. Passar turno
```

---

## 14. Exemplo Prático — Guerreiro vs Bárbaro (mesmo nível)

**Guerreiro (defensor):** ATK 7, DEF 10, LVL 20  
**Bárbaro (atacante):** ATK 8, DEF 4, LVL 20, PWR 5 (ataque básico)

**Confronto:**
```
DEF_confronto Guerreiro = ceil(10/2) = 5
ModNível = 0 (mesmo nível)
d20A = 12, d20D = 9

RC = (12 + 8 + 0 + 0 + 0) − (9 + 5 + 0 + 0)
RC = 20 − 14 = +6 → Acerto Normal
```

**Dano:**
```
Mitigação Guerreiro = floor(10/2) = 5
DanoBase = 5 (PWR) + 8 (ATK) + 0 − 5 = 8
DanoFinal = 8 × 1.00 = 8
```

**Guerreiro (atacante) vs Bárbaro (defensor):**
```
DEF_confronto Bárbaro = ceil(4/2) = 2
d20A = 10, d20D = 8

RC = (10 + 7 + 0) − (8 + 2 + 0) = 17 − 10 = +7 → Acerto Normal

Mitigação Bárbaro = floor(4/2) = 2
DanoBase = 4 (PWR) + 7 (ATK) − 2 = 9
DanoFinal = 9
```

**Resultado:** O Guerreiro resiste mais (mít. 5 vs 2), mas o Bárbaro ainda causa dano real. Nenhum dos dois é invulnerável.

---

## 15. Resumo das Constantes

| Constante | Valor |
|-----------|-------|
| DEF no confronto | `ceil(DEF / 2)` |
| Mitigação no dano | `floor(DEF / 2)` |
| ModNível máximo | ±5 (por tabela discreta) |
| Ataque natural 20 | +4 RC, +20% dano final |
| Ataque natural 1 | −6 RC |
| Defesa natural 20 | −5 RC (favorece defensor) |
| Defesa natural 1 | +4 RC (prejudica defensor) |
| Falha Total (RC) | ≤ −8 → 0 dano |
| Contato Neutralizado (RC) | −7 a −3 → 0 ou 1 dano |
| Acerto Reduzido (RC) | −2 a +3 → ×0.60 (mín 1) |
| Acerto Normal (RC) | +4 a +10 → ×1.00 |
| Acerto Forte (RC) | ≥ +11 → ×1.25 |
| Dano ilusório (atac. ≥10 lv abaixo) | DanoFinal = 1 em Contato Neut. ou Acerto Red. |
| Superioridade (atac. ≥10 lv acima) | Contato Neut. → Acerto Red. (exceto nat. 1/20) |
| Dano mínimo universal (acerto válido) | 1 |
| Vantagem de classe (confronto) | +2 |
| Desvantagem de classe (confronto) | −2 |
| Vantagem de classe (dano) | ×1.10 |
| Desvantagem de classe (dano) | ×0.90 |
