# Monstrinhomon — Matriz Mestra de Balanceamento do Combate

> **Status:** Canônico — Aprovado para implementação  
> **Versão:** 1.0  
> **Última atualização:** 2026-04-01

Este documento integra em um único lugar:
- papel real de cada classe;
- onde ela é forte e onde paga preço;
- o que pode quebrar o sistema;
- contrapesos obrigatórios;
- fórmula canônica consolidada;
- regras de design que não podem ser violadas.

---

## 1. Regra Central de Equilíbrio

Toda classe precisa obedecer esta lógica:

**força clara + fraqueza clara + função clara + contrajogo claro**

Se uma classe tem força clara, sem fraqueza real, sem custo de execução e sem contrajogo, ela quebra o sistema.

---

## 2. Matriz de Papéis por Classe

| Classe | Papel principal | Força central | Fraqueza central | Estilo de jogo | Risco de quebrar |
|--------|----------------|---------------|-----------------|----------------|-----------------|
| Guerreiro | Tank / proteção | Resistência, linha de frente, defesa de aliado | Baixa AGI, curto alcance, burst baixo | Segurar pressão e proteger | Virar parede excessiva |
| Bárbaro | Burst / pressão | Dano alto, agressão direta | Defesa mediana, pouca sustentação | Bater forte e rápido | Burst exagerado |
| Mago | Ofensivo técnico / controle | Dano de habilidade, controle, área | Fragilidade | Dano com utilidade | Dano + controle excessivos |
| Curandeiro | Sustentação | Cura, sobrevivência do grupo | Baixa pressão ofensiva | Manter o time vivo | Cura coletiva excessiva |
| Bardo | Buff / debuff | Ritmo de combate, amplificação do grupo | Fragilidade, baixo dano direto | Melhorar o time e atrapalhar o inimigo | Buff global forte demais |
| Ladino | Execução / mobilidade | AGI alta, finalização, oportunidade | HP/DEF baixos | Entrar, bater, reposicionar | Dano alto demais sem condição |
| Caçador | Pressão à distância | Consistência, alvo marcado, alcance | Pouca resistência quando pressionado | Controle de distância | Dano seguro demais sem custo |
| Animalista | Versatilidade | Adaptação situacional | Falta de pico extremo | Responder à situação | Virar "classe melhorada de todas" |

---

## 3. Matriz de Atributos-Base (Nível 1)

| Classe | HP | ATK | DEF | ENE | AGI | Alcance | Leitura |
|--------|---:|----:|----:|----:|----:|---------|---------|
| Guerreiro | 24 | 5 | 8 | 4 | 3 | Curto | Resiste muito, bate razoável |
| Bárbaro | 22 | 8 | 4 | 3 | 4 | Curto | Dano alto, defesa menor |
| Mago | 18 | 7 | 3 | 7 | 4 | Médio | Ofensivo técnico frágil |
| Curandeiro | 19 | 4 | 3 | 8 | 3 | Médio | Suporte forte, dano baixo |
| Bardo | 18 | 4 | 3 | 7 | 5 | Longo | Utilidade coletiva |
| Ladino | 17 | 7 | 2 | 5 | 8 | Curto/Médio | Muito rápido, muito frágil |
| Caçador | 19 | 6 | 3 | 5 | 6 | Longo | Pressão segura |
| Animalista | 21 | 6 | 5 | 5 | 5 | Curto/Médio | Equilibrado e versátil |

---

## 4. Matriz de Habilidades por Função

### Guerreiro

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Golpe Firme | Pressão básica | Dano constante |
| 2 | Corte Pesado | Dano superior | Dano |
| 3 | Postura Defensiva | Sustentação própria | Defesa |
| 4 | Proteger Aliado | Assinatura | Proteção tática |

### Bárbaro

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Pancada Selvagem | Agressão base | Dano |
| 2 | Golpe Brutal | Pressão forte | Dano |
| 3 | Fúria | Auto-buff | Amplificação |
| 4 | Berserk | Assinatura | Burst |

### Mago

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Rajada Arcana | Pressão básica | Dano |
| 2 | Explosão Etérea | Dano técnico | Dano |
| 3 | Prisão de Energia | Trava inimigo | Controle |
| 4 | Tempestade Arcana | Assinatura | Dano + área |

### Curandeiro

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Toque Vital | Ofensiva mínima | Dano leve |
| 2 | Cura Simples | Sustentação alvo único | Cura |
| 3 | Benção Suave | Proteção adicional | Buff |
| 4 | Cura em Área | Assinatura | Cura coletiva |

### Bardo

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Nota Cortante | Pressão mínima | Dano leve |
| 2 | Canção de Coragem | Buff de grupo/aliado | Buff |
| 3 | Eco Desafinador | Enfraquecimento inimigo | Debuff |
| 4 | Concerto de Guerra | Assinatura | Buff/debuff coletivo |

### Ladino

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Corte Rápido | Pressão ágil | Dano |
| 2 | Golpe Sorrateiro | Dano condicional | Execução |
| 3 | Passo Sombrio | Reposicionamento | Mobilidade |
| 4 | Execução | Assinatura | Finalização |

### Caçador

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Disparo Preciso | Ataque estável | Dano |
| 2 | Tiro Reforçado | Pressão superior | Dano |
| 3 | Marcar Alvo | Preparo tático | Setup |
| 4 | Tiro do Predador | Assinatura | Dano focado |

### Animalista

| Slot | Habilidade | Função real | Tipo de valor |
|------|-----------|-------------|---------------|
| 1 | Ataque Instintivo | Ofensiva versátil | Dano |
| 2 | Postura Selvagem | Ajuste de perfil | Adaptação |
| 3 | Chamado da Natureza | Utilidade situacional | Suporte/utilidade |
| 4 | Forma Bestial | Assinatura | Transformação |

---

## 5. Matriz de Custos e Pressão de Energia

| Classe | Dependência de energia | Risco se ficar sem energia | Comentário |
|--------|----------------------|---------------------------|------------|
| Guerreiro | Baixa | Continua funcional | Ideal para linha de frente |
| Bárbaro | Baixa/média | Ainda bate bem | Energia serve para picos |
| Mago | Média/alta | Perde parte da técnica | Básico ainda precisa funcionar |
| Curandeiro | Alta | Perde principal função | Básico útil e custo controlado |
| Bardo | Alta | Perde muito valor tático | Buffs não podem custar demais |
| Ladino | Média | Ainda pode jogar no básico | Energia melhora oportunidade |
| Caçador | Média | Continua consistente | Boa autonomia |
| Animalista | Média | Ainda responde bem | Versatilidade ajuda |

---

## 6. Matriz de Risco de Overpower e Contrapesos

### Guerreiro

**Pode quebrar se:**
- proteção for barata demais;
- DEF for forte demais no confronto e no dano;
- tiver HP alto demais e dano aceitável demais.

**Contrapeso obrigatório:**
- AGI baixa;
- alcance curto;
- dano apenas mediano;
- proteção com custo e condição.

---

### Bárbaro

**Pode quebrar se:**
- burst não tiver risco;
- dano base alto demais se somar com buffs.

**Contrapeso obrigatório:**
- DEF inferior ao Guerreiro;
- pouca energia;
- risco ao usar pico ofensivo.

---

### Mago

**Pode quebrar se:**
- controlar e causar dano alto demais ao mesmo tempo;
- área for fácil demais de usar.

**Contrapeso obrigatório:**
- baixa resistência;
- custo energético relevante;
- controle com duração curta.

---

### Curandeiro

**Pode quebrar se:**
- cura em área for grande demais;
- conseguir curar muito e ainda pressionar dano.

**Contrapeso obrigatório:**
- dano baixo;
- defesa baixa;
- cura coletiva moderada.

---

### Bardo

**Pode quebrar se:**
- buff/debuff coletivo durar muito;
- amplificar demais todo o grupo.

**Contrapeso obrigatório:**
- baixo dano direto;
- fragilidade;
- duração curta dos efeitos (máx. 2–3 turnos).

---

### Ladino

**Pode quebrar se:**
- execução funcionar sem condição;
- mobilidade for gratuita demais.

**Contrapeso obrigatório:**
- fragilidade real;
- dano máximo dependente de setup.

---

### Caçador

**Pode quebrar se:**
- dano à distância for muito seguro sem contrapartida;
- marcação amplificar demais.

**Contrapeso obrigatório:**
- fragilidade ao ser alcançado;
- assinatura dependente de marca.

---

### Animalista

**Pode quebrar se:**
- adaptação o fizer tank, DPS e suporte ao mesmo tempo;
- transformação for "modo superior universal".

**Contrapeso obrigatório:**
- bônus situacionais;
- versatilidade acima de pico;
- sem liderança absoluta em nenhum eixo.

---

## 7. Counters Naturais por Classe

| Classe | Quem naturalmente pressiona essa classe | Por quê |
|--------|----------------------------------------|---------|
| Guerreiro | Mago, Bardo, Caçador | Controle, debuff, pressão segura à distância |
| Bárbaro | Guerreiro, Curandeiro, Bardo | Contenção, sustentação do alvo, enfraquecimento |
| Mago | Ladino, Caçador, Bárbaro | Foco rápido e pressão antes do controle |
| Curandeiro | Ladino, Caçador, Mago | Punem alvo frágil e suporte exposto |
| Bardo | Ladino, Caçador | Removem peça de suporte frágil |
| Ladino | Guerreiro, Bárbaro, controle do Mago | Punem erro de entrada |
| Caçador | Ladino, Bárbaro, mobilidade do Animalista | Pressão curta sobre a retaguarda |
| Animalista | Depende da postura escolhida | Classe de resposta, não de domínio fixo |

---

## 8. Fórmula Canônica Consolidada

### Etapa 1 — Confronto

```
ResultadoConfronto = (d20A + ATK + BônusAção + ModNível + ModClasse + ModBuff)
                   − (d20D + teto(DEF/2) + ModPosição + ModBuff)
```

### Etapa 2 — Faixas de Resultado

| Resultado | Faixa |
|----------:|-------|
| ≤ −8 | Falha total |
| −7 a −3 | Contato neutralizado |
| −2 a +3 | Acerto reduzido |
| +4 a +10 | Acerto normal |
| +11 ou mais | Acerto forte |

### Etapa 3 — Dano base

```
DanoBase = PWR + ATK + ModNívelDano − piso(DEF/2)
```

### Etapa 4 — Multiplicador por faixa

| Faixa | Multiplicador de dano |
|-------|----------------------|
| Falha total | 0 |
| Contato neutralizado | 0 ou 1 |
| Acerto reduzido | ×0.60 |
| Acerto normal | ×1.00 |
| Acerto forte | ×1.25 |

### Etapa 5 — Regras especiais

| Condição | Efeito |
|----------|--------|
| 20 natural no ataque | +4 confronto, +20% dano |
| 1 natural no ataque | −6 confronto |
| 20 natural na defesa | +5 confronto defensivo |
| 1 natural na defesa | −4 confronto defensivo |
| Atacante 10+ níveis abaixo e acerto fraco/reduzido | Dano ilusório = 1 |
| Atacante 10+ níveis acima | Contato neutralizado pode subir para acerto reduzido, salvo sorte extrema |

---

## 9. Regras Canônicas Obrigatórias de Design

### Regra 1 — DEF dividida
DEF nunca entra inteira no confronto e inteira no dano.  
No confronto: `teto(DEF/2)` · No dano: `piso(DEF/2)` como mitigação.

### Regra 2 — Assinatura ≠ só dano
Assinatura de classe não pode ser apenas "golpe com mais dano".  
Deve definir um papel tático único: interceptação, área, controle, transformação, suporte coletivo.

### Regra 3 — Toda força tem contrapartida
Toda força precisa de contrapartida operacional:  
custo · posição · setup · condição de alvo · duração curta · risco.

### Regra 4 — Suporte coletivo com duração curta
Suporte coletivo precisa ter duração curta (2–3 turnos) e custo real.  
Buff/debuff em área de longa duração quebra o jogo.

### Regra 5 — Dano máximo condicional
Dano máximo deve preferir condição/setup em vez de ser automático.  
Dano alto universal é desequilíbrio garantido.

### Regra 6 — Básico sempre relevante
Ataque básico (Slot 1, ENE 0) sempre precisa ser útil.  
Nenhuma classe pode parecer "morta" sem energia.

### Regra 7 — Versatilidade ≠ superioridade
Versatilidade não pode virar superioridade universal.  
Animalista adapta, não domina.

---

## 10. O que essa Matriz Produz no Jogo

| Classe | Comportamento esperado |
|--------|----------------------|
| Guerreiro | Segura frente e salva aliado, mas não mata mais que o Bárbaro |
| Bárbaro | Pune forte, mas não sustenta como o Guerreiro |
| Mago | Controla e machuca, mas desmorona se pressionado |
| Curandeiro | Sustenta o time, mas não domina o ritmo sozinho |
| Bardo | Amplia o grupo, mas é alvo prioritário |
| Ladino | Entra para finalizar, não para tankar |
| Caçador | Pressiona de longe, mas sofre se for alcançado |
| Animalista | Responde ao cenário, sem ser o melhor em tudo |

---

## 11. Planilha Operacional de Balanceamento (Referência)

Formato de linha para uso em planilha externa ou revisão futura:

| Classe | HP | ATK | DEF | ENE | AGI | Slot | Habilidade | PWR | ENE cost | Função | Condição | Risco | Observação |
|--------|---:|----:|----:|----:|----:|------|-----------|----:|---------:|--------|----------|-------|------------|
| Guerreiro | 24 | 5 | 8 | 4 | 3 | 1 | Golpe Firme | 3 | 0 | Dano | — | baixo | básico estável |
| Guerreiro | 24 | 5 | 8 | 4 | 3 | 2 | Corte Pesado | 5 | 2 | Dano | — | baixo | pressão simples |
| Guerreiro | 24 | 5 | 8 | 4 | 3 | 3 | Postura Defensiva | 0 | 3 | Defesa | próprio | baixo | verificar custo |
| Guerreiro | 24 | 5 | 8 | 4 | 3 | 4 | Proteger Aliado | 0 | 4 | Proteção | aliado próximo | médio | custo deve ser real |
| Bárbaro | 22 | 8 | 4 | 3 | 4 | 1 | Pancada Selvagem | 4 | 0 | Dano | — | baixo | básico agressivo |
| Bárbaro | 22 | 8 | 4 | 3 | 4 | 2 | Golpe Brutal | 6 | 2 | Dano | — | médio | monitorar soma com Fúria |
| Bárbaro | 22 | 8 | 4 | 3 | 4 | 3 | Fúria | 0 | 3 | Buff | próprio | médio | risco se DEF não cair |
| Bárbaro | 22 | 8 | 4 | 3 | 4 | 4 | Berserk | 7 | 4 | Burst | — | alto | exige contrapartida obrigatória |
| Mago | 18 | 7 | 3 | 7 | 4 | 1 | Rajada Arcana | 3 | 0 | Dano | — | baixo | básico ok |
| Mago | 18 | 7 | 3 | 7 | 4 | 2 | Explosão Etérea | 5 | 2 | Dano | — | médio | monitorar combo com controle |
| Mago | 18 | 7 | 3 | 7 | 4 | 3 | Prisão de Energia | 1 | 3 | Controle | — | alto | duração máx. 2 turnos |
| Mago | 18 | 7 | 3 | 7 | 4 | 4 | Tempestade Arcana | 6 | 4 | Dano+Área | — | alto | área exige limitação clara |
| Curandeiro | 19 | 4 | 3 | 8 | 3 | 1 | Toque Vital | 2 | 0 | Dano | — | baixo | básico mínimo |
| Curandeiro | 19 | 4 | 3 | 8 | 3 | 2 | Cura Simples | 4 | 2 | Cura | aliado | baixo | valor de cura a calibrar |
| Curandeiro | 19 | 4 | 3 | 8 | 3 | 3 | Benção Suave | 0 | 3 | Buff | aliado | baixo | verificar stack com cura |
| Curandeiro | 19 | 4 | 3 | 8 | 3 | 4 | Cura em Área | 5 | 4 | Cura coletiva | grupo | alto | quantidade de HP a limitar |
| Bardo | 18 | 4 | 3 | 7 | 5 | 1 | Nota Cortante | 2 | 0 | Dano | — | baixo | básico à distância |
| Bardo | 18 | 4 | 3 | 7 | 5 | 2 | Canção de Coragem | 0 | 2 | Buff | aliados | médio | duração máx. 2 turnos |
| Bardo | 18 | 4 | 3 | 7 | 5 | 3 | Eco Desafinador | 1 | 3 | Debuff | inimigo | médio | duração máx. 2 turnos |
| Bardo | 18 | 4 | 3 | 7 | 5 | 4 | Concerto de Guerra | 0 | 4 | Buff+Debuff | grupo | alto | efeito coletivo — duração curta obrigatória |
| Ladino | 17 | 7 | 2 | 5 | 8 | 1 | Corte Rápido | 3 | 0 | Dano | — | baixo | AGI garante iniciativa |
| Ladino | 17 | 7 | 2 | 5 | 8 | 2 | Golpe Sorrateiro | 5 | 2 | Dano cond. | alvo vulnerável | médio | condição deve ser verificada |
| Ladino | 17 | 7 | 2 | 5 | 8 | 3 | Passo Sombrio | 0 | 3 | Mobilidade | próprio | baixo | reposicionamento gratuito ok |
| Ladino | 17 | 7 | 2 | 5 | 8 | 4 | Execução | 7 | 4 | Finalização | HP baixo do alvo | alto | condição obrigatória |
| Caçador | 19 | 6 | 3 | 5 | 6 | 1 | Disparo Preciso | 3 | 0 | Dano | — | baixo | alcance garante segurança |
| Caçador | 19 | 6 | 3 | 5 | 6 | 2 | Tiro Reforçado | 5 | 2 | Dano | — | médio | monitorar combo com marcação |
| Caçador | 19 | 6 | 3 | 5 | 6 | 3 | Marcar Alvo | 0 | 3 | Setup | inimigo | médio | amplificação moderada |
| Caçador | 19 | 6 | 3 | 5 | 6 | 4 | Tiro do Predador | 6 | 4 | Dano focado | alvo marcado | alto | obrigatório depender de Marcar |
| Animalista | 21 | 6 | 5 | 5 | 5 | 1 | Ataque Instintivo | 3 | 0 | Dano | — | baixo | versátil sem pico |
| Animalista | 21 | 6 | 5 | 5 | 5 | 2 | Postura Selvagem | 0 | 2 | Adaptação | próprio | médio | bônus não deve dominar todos os eixos |
| Animalista | 21 | 6 | 5 | 5 | 5 | 3 | Chamado da Natureza | 2 | 3 | Utilidade | — | baixo | situacional por definição |
| Animalista | 21 | 6 | 5 | 5 | 5 | 4 | Forma Bestial | 5 | 4 | Transformação | próprio | alto | não pode ser modo deus |
