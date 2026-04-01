# Documento 3 — Regras de Posicionamento v2

> **Status:** Canônico — Aprovado para implementação  
> **Versão:** 2.0  
> **Última atualização:** 2026-03-31

---

## 1. Princípio Central

Posicionamento define **alcance, risco e proteção**.  
Ele só entra em vigor em **batalhas de grupo** (trainer, boss, grupo de monstros).  
Em encontros selvagens (1v1), não há grade — o posicionamento é implícito.

---

## 2. Grade de Posicionamento

### 2.1 Estrutura de Linhas

```
LADO DO INIMIGO          LADO DO JOGADOR
┌───────────┐            ┌───────────┐
│  INIMIGO  │            │   TRÁS    │
│  (FRENTE) │            │ (Suporte) │
├───────────┤            ├───────────┤
│  INIMIGO  │   ←→ →    │   MEIO    │
│  (MEIO)   │            │ (Versátil)│
├───────────┤            ├───────────┤
│  INIMIGO  │            │  FRENTE   │
│  (TRÁS)   │            │ (Linha 1) │
└───────────┘            └───────────┘
```

- **Frente:** Primeira linha, alta exposição.
- **Meio:** Zona intermediária, versatilidade.
- **Trás:** Última linha, menor exposição direta.

### 2.2 Ocupação Máxima por Linha

| Linha | Máx. Aliados | Máx. Inimigos |
|-------|-------------|---------------|
| Frente | 2 | 2 |
| Meio | 2 | 2 |
| Trás | 2 | 2 |

> Se uma linha ficar vazia (aliados desmaiados / fugiram), a linha de trás avança automaticamente.

---

## 3. Alcance por Classe

Alcance determina quais linhas inimigas um Monstrinhomon pode atingir a partir de cada posição.

### 3.1 Definições de Alcance

| Tipo de Alcance | Descrição |
|-----------------|-----------|
| **Curto** | Atinge apenas inimigos na Frente |
| **Médio** | Atinge Frente e Meio |
| **Longo** | Atinge Frente, Meio e Trás |

### 3.2 Alcance Base por Classe

| Classe | Alcance Base | Obs. |
|--------|-------------|------|
| Guerreiro | Curto | Especialista em linha de frente |
| Bárbaro | Curto | Máximo impacto corpo a corpo |
| Mago | Longo | Magia atravessa linhas |
| Curandeiro | Médio | Curas alcançam frente e meio |
| Bardo | Longo | Som e magia atingem qualquer linha |
| Ladino | Médio | Mobilidade compensa; pode mover |
| Caçador | Longo | Arqueiro; alcance total |
| Animalista | Curto | Adaptável, mas corpo a corpo |

### 3.3 Efeito da Posição do Atacante no Alcance

| Posição Atacante | Acréscimo de Alcance |
|------------------|---------------------|
| Frente | Sem mudança |
| Meio | +1 linha de alcance (ex.: Curto → Médio) |
| Trás | −1 linha de alcance (ex.: Médio → Curto) |

> Exemplo: Guerreiro (Curto) posicionado no Meio pode atingir a Frente e o Meio inimigo.

### 3.4 Alcance de Cura

Habilidades de cura seguem alcance próprio:
- Curandeiro: pode curar qualquer aliado em qualquer linha.
- Bardo: pode bufar qualquer aliado em qualquer linha.
- Outras classes: cura/buff limitado à própria linha ou adjacente.

---

## 4. Impacto do Posicionamento no Combate

### 4.1 Bônus de Defesa por Linha

Personagens mais ao fundo têm menor exposição e podem receber bônus de defesa:

| Linha | Bônus Defensivo na Rolagem de Defesa |
|-------|--------------------------------------|
| Frente | 0 |
| Meio | +1 |
| Trás | +2 |

> Esse bônus só se aplica se a linha à frente ainda tiver pelo menos 1 aliado vivo.  
> Se a frente estiver vazia, o bônus não se aplica — o Monstrinhomon está exposto.

### 4.2 Exposição a Ataques

| Linha | Exposição | Observação |
|-------|-----------|-----------|
| Frente | Alta | Alvos prioritários da IA inimiga |
| Meio | Média | Atacado se frente estiver fraca ou por alcance longo |
| Trás | Baixa | Protegida pela frente; pode ser atacada por inimigos com alcance longo |

---

## 5. Regras de Alvo e Aggro

### 5.1 Prioridade de Alvo (IA Inimiga)

A IA inimiga escolhe alvos com base na seguinte lógica:

1. **Linha mais à frente** que esteja acessível (dentro do alcance do inimigo).
2. Dentro dessa linha, priorizar o aliado com **menor HP atual**.
3. 20% de chance de atacar aleatoriamente dentro da linha acessível (imprevisibilidade).
4. Se um aliado tiver efeito **TAUNT ativo**, o inimigo DEVE atacá-lo.

### 5.2 TAUNT (Provocar)

Habilidades de provocação forçam a IA a mudar o alvo:
- Enquanto TAUNT estiver ativo, o inimigo só pode atacar o provocador.
- Se o provocador desmaiar ou sair da linha, o TAUNT é cancelado.
- TAUNT não afeta inimigos boss com imunidade a controle.

### 5.3 Marcação (Caçador)

Marcação não muda aggro, mas afeta o atacante:
- Quando o Caçador marca um alvo, **seus próprios ataques** ganham bônus.
- Outros aliados não são afetados pela marcação.

---

## 6. Troca de Posição

### 6.1 Custo de Troca

| Tipo de Troca | Custo de Ação |
|---------------|--------------|
| Troca dentro da mesma linha (reordenar) | Gratuita (no pré-turno) |
| Mover 1 linha (ex.: Frente → Meio) | Consome o turno inteiro |
| Mover 2 linhas (ex.: Trás → Frente) | Não permitido diretamente; deve ser feito em 2 turnos |

### 6.2 Exceções

- **Ladino (Slot 3 — Sombra Rápida):** Move sem custo de turno.
- **Animalista (Slot 4 — Postura Adaptada):** Move livremente enquanto em postura ativa.

### 6.3 Avanço Automático de Linha

Se uma linha ficar completamente vazia:
- A linha de trás avança automaticamente para preencher o vácuo.
- Isso não consome turno dos personagens afetados.
- Os bônus de defesa são recalculados após o avanço.

---

## 7. Troca de Monstrinhomon

### 7.1 Troca Estratégica (jogador escolhe)

- Consome o turno inteiro do slot sendo substituído.
- O Monstrinhomon substituto entra na mesma posição do anterior.
- ENE do substituto começa em 100%.
- Buffs/debuffs do anterior não são transferidos.

### 7.2 Troca por Derrota (HP = 0)

- Quando um Monstrinhomon chega a 0 HP, desmaia.
- O jogador escolhe o próximo Monstrinhomon para enviar.
- A escolha não consome turno adicional.
- Se não houver Monstrinhos disponíveis, o jogador é eliminado do combate de grupo.

### 7.3 Regra de Classe em Batalha de Grupo

- Só podem participar de batalhas Monstrinhos da mesma classe do jogador.
- Exceção: modo Master/Debug liberado pelo terapeuta.

---

## 8. Formações Recomendadas por Composição

### 8.1 Formação Padrão (Equipe Mista)

```
[TRÁS]   Curandeiro / Bardo / Mago / Caçador
[MEIO]   Ladino / Animalista / Mago
[FRENTE] Guerreiro / Bárbaro
```

### 8.2 Formação Agressiva

```
[TRÁS]   Mago / Bardo
[MEIO]   Ladino / Bárbaro
[FRENTE] Guerreiro / Bárbaro
```

### 8.3 Formação Defensiva

```
[TRÁS]   Curandeiro / Bardo
[MEIO]   Curandeiro / Animalista
[FRENTE] Guerreiro / Guerreiro
```

> Formações são sugestões, não restrições. O terapeuta/mestre pode incentivar posicionamentos táticos.

---

## 9. Representação Visual (UI)

### 9.1 Painel de Batalha de Grupo

```
┌─────────────────────────────────────────┐
│         INIMIGOS                        │
│  [Frente: 🐲 Dragão Lv10]              │
│  [Meio:   🦊 Ladino Lv8]               │
│  [Trás:   🧙 Mago Lv9]                │
├─────────────────────────────────────────┤
│         ALIADOS                         │
│  [Frente: ⚔️ Pedrino  HP:28/32]        │
│  [Meio:   🎵 Cantapau HP:24/28]        │
│  [Trás:   💚 Ninfolha HP:30/30]        │
└─────────────────────────────────────────┘
```

### 9.2 Indicadores Visuais

- Linha vazia: exibe `(vazio)` em cinza.
- Monstrinhomon desmaiado: exibe com ícone 💀.
- TAUNT ativo: exibe 🎯 ao lado do provocador.
- Marcação (Caçador): exibe 🎯 ao lado do alvo.
- Bônus de defesa de posição: exibe escudinho 🛡️ (Meio) ou 🛡️🛡️ (Trás).

---

## 10. Posicionamento em Encontro Selvagem

Em encontros selvagens (1v1), o posicionamento é simplificado:
- Não existe grade de linhas.
- Alcance e posição são irrelevantes — ambos sempre se alcançam.
- As regras de posicionamento completas só se aplicam em combate de grupo.

---

## 11. Resumo das Constantes

| Constante | Valor |
|-----------|-------|
| Máx. aliados por linha | 2 |
| Bônus de defesa (Meio) | +1 na Rolagem de Defesa |
| Bônus de defesa (Trás) | +2 na Rolagem de Defesa |
| Chance de ataque aleatório da IA | 20% |
| Custo de mover 1 linha | 1 turno inteiro |
| Troca estratégica | 1 turno inteiro |
| Troca por derrota | sem custo de turno |
