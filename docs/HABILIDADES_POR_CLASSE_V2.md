# Documento 2 — Kit de Habilidades por Classe v2

> **Status:** Canônico — Aprovado para implementação  
> **Versão:** 2.0  
> **Última atualização:** 2026-03-31

---

## 1. Princípio Geral

Cada Monstrinhomon possui **4 slots de habilidade** desbloqueados por progressão de nível.  
O conjunto final representa a identidade completa da sua classe.

### 1.1 Estrutura dos 4 Slots

| Slot | Tipo | Energia | Descrição |
|------|------|---------|-----------|
| 1 | Ataque Básico (evoluído) | **0** | Ação permanente, sempre disponível |
| 2 | Habilidade Inicial | Sim | Primeiro poder especial desbloqueado |
| 3 | Habilidade Tática | Sim | Poder secundário (dano, controle, mobilidade ou suporte) |
| 4 | Assinatura de Classe | Sim | Ação exclusiva que define o papel da classe |

### 1.2 Progressão de Desbloqueio (padrão)

| Faixa de Nível | Evento |
|----------------|--------|
| Nível 1 | Slot 1 ativo (ataque básico) |
| Nível 5 | Slot 2 desbloqueado (Habilidade Inicial Tier I) |
| Nível 10 | Slot 1 evolui (ataque básico Tier II) |
| Nível 15 | Slot 3 desbloqueado (Habilidade Tática Tier I) |
| Nível 20 | Slot 2 evolui para Tier II |
| Nível 30 | Slot 4 desbloqueado (Assinatura de Classe Tier I) |
| Nível 40 | Slot 3 evolui para Tier II |
| Nível 50 | Slot 1 evolui para Tier III (forma final) |
| Nível 60 | Slot 4 evolui para Tier II (assinatura aprimorada) |

> Nota: esses valores podem ser ajustados por Monstrinhomon individual. A tabela acima é o padrão da classe.

---

## 2. Guerreiro

**Função canônica:** Proteger, sustentar linha de frente, absorver pressão, punir alvo próximo.

### Slots

#### Slot 1 — Pancada de Escudo (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 13 | 0 | — |
| II | 10 | 16 | 0 | Chance 20% de reduzir DEF inimigo em 1 por 1 turno |
| III | 50 | 19 | 0 | Sempre reduz DEF inimigo em 1 por 1 turno |

#### Slot 2 — Golpe de Espada
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 20 | 4 | Dano direto, alcance curto |
| II | 20 | 28 | 6 | Dano direto + 30% chance de atordoar 1 turno |

#### Slot 3 — Provocar
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 0 | 4 | Força inimigo a atacar o Guerreiro no próximo turno |
| II | 40 | 0 | 5 | Força 2 inimigos a atacarem o Guerreiro no próximo turno |

#### Slot 4 — Proteção Total *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 0 | 8 | No próximo turno, **50% do dano** dirigido a um aliado é redirecionado ao Guerreiro |
| II | 60 | 0 | 10 | No próximo turno, **100% do dano** dirigido a um aliado é redirecionado ao Guerreiro; Guerreiro recebe +3 DEF temporária |

---

## 3. Bárbaro

**Função canônica:** Agressão bruta, pressão constante, risco alto/recompensa alta.

### Slots

#### Slot 1 — Porrada Bruta (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 14 | 0 | — |
| II | 10 | 17 | 0 | +1 ATK temporário a si mesmo por 1 turno se acertar |
| III | 50 | 20 | 0 | +2 ATK temporário + perde 1 DEF por turno (fúria passiva) |

#### Slot 2 — Golpe Brutal
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 26 | 6 | Alto dano bruto |
| II | 20 | 34 | 8 | Alto dano + ignora 2 pontos de DEF do alvo |

#### Slot 3 — Grito de Fúria
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 0 | 4 | +3 ATK por 2 turnos, −1 DEF por 2 turnos (auto-buff) |
| II | 40 | 0 | 5 | +5 ATK por 3 turnos, −2 DEF por 3 turnos |

#### Slot 4 — Sobrecarga *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 30 | 12 | Dobra o ATK para este ataque; Bárbaro não pode usar habilidades no próximo turno |
| II | 60 | 38 | 14 | Dobra ATK + ignora DEF completamente; 2 turnos sem habilidades depois |

---

## 4. Mago

**Função canônica:** Dano técnico, controle, efeitos especiais.

### Slots

#### Slot 1 — Faísca Arcana (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 11 | 0 | — |
| II | 10 | 14 | 0 | 20% chance de reduzir ATK inimigo em 1 por 1 turno |
| III | 50 | 17 | 0 | Sempre reduz ATK inimigo em 1 por 1 turno |

#### Slot 2 — Magia Elemental
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 22 | 4 | Dano mágico padrão |
| II | 20 | 30 | 6 | Dano mágico + 25% chance de enraizar (ROOT) por 1 turno |

#### Slot 3 — Onda de Choque
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 18 | 5 | Dano + reduz AGI do alvo em 2 por 2 turnos |
| II | 40 | 24 | 7 | Dano + reduz AGI em 3 + −1 ATK por 2 turnos |

#### Slot 4 — Explosão Arcana *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 36 | 12 | Burst de alto dano em 1 alvo; ignora bônus de posição defensiva |
| II | 60 | 44 | 14 | Burst em 1 alvo ou dano reduzido (×0.6) em todos os inimigos (escolher) |

---

## 5. Curandeiro

**Função canônica:** Sustentação, cura, suporte de grupo.

### Slots

#### Slot 1 — Toque Sagrado (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 10 | 0 | — |
| II | 10 | 12 | 0 | Cura o Curandeiro em 2 HP ao acertar |
| III | 50 | 14 | 0 | Cura o Curandeiro em 4 HP ao acertar |

#### Slot 2 — Cura Simples
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 0 | 5 | Cura aliado: 15 HP fixos |
| II | 20 | 0 | 7 | Cura aliado: 30 HP fixos |

#### Slot 3 — Bênção
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 0 | 4 | +2 DEF a um aliado por 2 turnos |
| II | 40 | 0 | 5 | +3 DEF + +1 ATK a um aliado por 3 turnos |

#### Slot 4 — Cura em Área *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 0 | 10 | Cura **todos os aliados** em 12 HP |
| II | 60 | 0 | 12 | Cura todos em 20 HP + remove 1 debuff de cada aliado |

---

## 6. Bardo

**Função canônica:** Buff, debuff, manipulação de ritmo de combate.

### Slots

#### Slot 1 — Nota Afiada (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 11 | 0 | Ataque sonoro à distância |
| II | 10 | 14 | 0 | Reduz moral inimiga: −1 ATK por 1 turno (25% chance) |
| III | 50 | 17 | 0 | Sempre aplica −1 ATK ao alvo por 1 turno |

#### Slot 2 — Canção de Coragem
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 0 | 4 | +2 ATK a um aliado por 2 turnos |
| II | 20 | 0 | 5 | +3 ATK a um aliado por 3 turnos |

#### Slot 3 — Melodia Perturbadora
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 12 | 4 | Dano sonoro leve + reduz DEF inimigo em 2 por 2 turnos |
| II | 40 | 16 | 5 | Dano + −3 DEF + −1 AGI por 2 turnos |

#### Slot 4 — Sinfonia de Campo *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 0 | 10 | +2 ATK **a todos os aliados** e −2 ATK **a todos os inimigos** por 2 turnos |
| II | 60 | 0 | 12 | +3 ATK a aliados, −3 ATK a inimigos, +1 AGI a aliados por 3 turnos |

---

## 7. Ladino

**Função canônica:** Velocidade, precisão, finalização, infiltração tática.

### Slots

#### Slot 1 — Golpe Rápido (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 12 | 0 | Alta AGI; vai antes na maioria dos encontros |
| II | 10 | 15 | 0 | 20% chance de atacar duas vezes no mesmo turno |
| III | 50 | 18 | 0 | 35% chance de atacar duas vezes; o 2º ataque é sempre Acerto Normal mínimo |

#### Slot 2 — Golpe Certeiro
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 20 | 4 | +4 à Rolagem de Ataque neste turno |
| II | 20 | 26 | 5 | +6 à Rolagem de Ataque + ignora buffs defensivos do alvo |

#### Slot 3 — Sombra Rápida
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 0 | 4 | Move o Ladino para qualquer posição gratuitamente; próximo ataque tem +2 ATK |
| II | 40 | 0 | 5 | Move + invisibilidade por 1 turno (inimigos não podem mirar o Ladino) |

#### Slot 4 — Execução *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 28 | 10 | Se o alvo estiver com HP ≤ 30%, o dano é multiplicado por ×2 |
| II | 60 | 34 | 12 | Se HP ≤ 40%, dano ×2.5; se HP ≤ 20%, dano ×3 |

---

## 8. Caçador

**Função canônica:** Pressão à distância, foco de alvo, consistência de dano.

### Slots

#### Slot 1 — Flechada Básica (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 12 | 0 | Alcance longo |
| II | 10 | 15 | 0 | Marca o alvo: próximo ataque ao mesmo alvo tem +2 |
| III | 50 | 18 | 0 | Marca automática; 3 atacar o mesmo alvo concede Acerto Forte garantido |

#### Slot 2 — Flecha Reforçada
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 22 | 4 | Dano à distância aumentado |
| II | 20 | 30 | 6 | Dano + penetra 2 pontos de DEF |

#### Slot 3 — Armadilha
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 0 | 4 | Reduz AGI do alvo em 3 por 2 turnos (alvo age por último) |
| II | 40 | 0 | 5 | Reduz AGI em 4 + −1 DEF por 2 turnos |

#### Slot 4 — Alvo Fixado *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 0 | 8 | Fixa o Caçador em 1 alvo: todos os ataques do Caçador neste turno e no próximo têm +4 ATK e ×1.20 dano contra esse alvo específico |
| II | 60 | 0 | 10 | +6 ATK e ×1.35 dano; se o alvo tentar fugir ou trocar de posição, sofre dano automático (Tier II da Flecha Reforçada) |

---

## 9. Animalista

**Função canônica:** Versatilidade, adaptação, oscilação tática baseada em postura.

### Slots

#### Slot 1 — Investida Bestial (Ataque Básico)
| Tier | Nível | Poder | ENE | Efeito extra |
|------|-------|-------|-----|--------------|
| I | 1 | 12 | 0 | Curto alcance, robusto |
| II | 10 | 15 | 0 | +1 DEF ao Animalista por 1 turno se acertar |
| III | 50 | 18 | 0 | +2 DEF permanente durante o turno em que acertar |

#### Slot 2 — Instinto Selvagem
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 5 | 0 | 4 | +2 ATK ou +2 DEF (escolha do jogador) por 2 turnos |
| II | 20 | 0 | 5 | +3 ATK ou +3 DEF ou +2 AGI por 3 turnos |

#### Slot 3 — Garra Venenosa
| Tier | Nível | Poder | ENE | Efeito |
|------|-------|-------|-----|--------|
| I | 15 | 16 | 5 | Dano + 30% chance de envenenar (POISON: −10% HP/turno por 2 turnos) |
| II | 40 | 22 | 6 | Dano + 50% envenenamento por 3 turnos |

#### Slot 4 — Postura Adaptada *(Assinatura)*
| Tier | Nível | Poder | ENE | Efeito exclusivo |
|------|-------|-------|-----|-----------------|
| I | 30 | 0 | 8 | Alterna entre **Postura Fera** (+4 ATK, −2 DEF) ou **Postura Escudo** (+4 DEF, −2 ATK) por 3 turnos. Pode alterar posição livremente enquanto em postura. |
| II | 60 | 0 | 10 | Adiciona **Postura Sombra** (invisível 1 turno, próximo ataque Acerto Forte garantido). Cooldown 4 turnos entre mudanças. |

---

## 10. Regras Gerais de Energia e Habilidades

### 10.1 Ataque Básico
- Slot 1 **nunca gasta ENE**, independente do tier.
- Sempre disponível mesmo com ENE = 0.
- É a base de sustentação de qualquer classe.

### 10.2 Regeneração de ENE por Turno
Ao início do turno do Monstrinhomon:
```
eneGain = max(ene_regen_min, ceil(eneMax × ene_regen_pct))
ene = min(eneMax, ene + eneGain)
```

| Classe | ene_regen_pct | ene_regen_min |
|--------|--------------|--------------|
| Mago | 18% | 3 |
| Curandeiro | 18% | 3 |
| Bardo | 14% | 2 |
| Caçador | 14% | 2 |
| Ladino | 14% | 2 |
| Animalista | 12% | 2 |
| Bárbaro | 12% | 2 |
| Guerreiro | 10% | 1 |

### 10.3 Regra de Sustentabilidade
- Nenhuma classe pode depender totalmente de ENE para ser útil.
- Mesmo com ENE = 0, o Slot 1 garante participação ofensiva.
- Posição e papel de classe ainda importam com ENE zerada.

### 10.4 Bloqueio de Habilidade
- Botão da habilidade fica desabilitado se `ene_atual < ene_custo`.
- Interface exibe o custo de ENE claramente em cada botão.

---

## 11. Evoluções de Habilidade

Habilidades evoluem automaticamente com o nível do Monstrinhomon.  
Não é necessário ação do jogador — acontece automaticamente no Level Up.

Exemplo:
- Nivel 4: Slot 2 = Golpe de Espada I
- Nivel 20+: Slot 2 = Golpe de Espada II (atualiza automaticamente)

O log de level up indica: `"🗡️ Golpe de Espada evoluiu para Tier II!"`
