# Decisão B — Passivas de Classe

**Data:** 2026-05-29  
**Status:** Decisão canônica complementar  
**Escopo:** documentação de combate; sem alteração de runtime, dados, fórmula ou balanceamento neste PR.  
**Relacionado:**

- `docs/PATCH_CANONICO_COMBATE_V2.2.md`
- `docs/combat_formula_audit_2026-05.md`
- `docs/AUDIT_GENERAL_RISKS_2026-05.md`

---

## 1. Decisão

As passivas de classe serão **mantidas** como parte oficial do sistema Monstrinhomon.

Elas **não** serão transformadas em cartas neste momento.

Elas **não** serão removidas.

Elas passam a ser uma camada canônica complementar da fórmula v2.2, com impacto baixo, explícito, previsível, documentado e testável.

Esta decisão substitui o status anterior de “Decisão B pendente” registrado no Bloco 7 de `docs/PATCH_CANONICO_COMBATE_V2.2.md` e nas notas de `docs/combat_formula_audit_2026-05.md`.

---

## 2. Regra de balanceamento

As passivas devem reforçar a identidade da classe sem substituir:

- atributos;
- cartas;
- habilidades;
- posicionamento;
- vantagem/desvantagem de classe;
- `ModNível`;
- gestão de ENE;
- decisões táticas do jogador.

A passiva deve ser sentida ao longo do tempo, mas raramente decidir uma luta sozinha.

---

## 3. Diretriz de força

Como regra inicial:

- passivas percentuais devem começar em torno de **3% a 5%**;
- valores acima de **5%** exigem condição, limitação ou justificativa clara de balanceamento;
- bônus fixos devem ser pequenos e situacionais;
- passivas não devem criar dupla contagem com `ModClasse`, buffs, vantagem de classe, posicionamento ou cartas.

Exemplos de limites desejáveis:

| Classe | Diretriz de passiva fraca |
|---|---|
| Guerreiro | Redução pequena de dano recebido, inicialmente perto de 5% |
| Bárbaro | Bônus pequeno de dano sob condição de risco, por exemplo HP ≤ 50% |
| Ladino | Bônus pequeno em Acerto Forte, inicialmente perto de 5% |
| Curandeiro | Bônus pequeno em cura realizada, inicialmente perto de 5% |
| Mago | Bônus pequeno em habilidade ofensiva/mágica, inicialmente perto de 5% |
| Caçador | Bônus situacional de precisão/RC em posição favorável, preferencialmente +1 RC condicional |
| Bardo | Bônus pequeno em buff; não conceder +1 turno automático neste momento |
| Animalista | Bônus pequeno conforme forma/estado, sem acumular defesa e dano ao mesmo tempo |

Esta tabela é diretriz de design para PR futuro. Ela **não implementa** valores no runtime.

---

## 4. Relação com a fórmula v2.2

A fórmula v2.2 continua sendo a base do combate:

```text
RC = (d20A + ATK_atacante + BônusAção + ModNível + ModClasse + BuffOfensivo)
   − (d20D + ceil(DEF_defensor/2) + ModPosição + BuffDefensivo)
```

As passivas não substituem RC, DEF, PWR, ModNível ou faixas de acerto.

Quando forem implementadas/recalibradas, devem entrar como camada complementar pequena e testável, preferencialmente após o cálculo principal, ou como modificador situacional explicitamente documentado.

---

## 5. Implicação para o próximo PR de Wild Combat

O próximo PR de correção do Wild Combat deve:

1. alinhar Wild Combat à fórmula canônica v2.2;
2. preservar o conceito de passivas de classe;
3. recalibrar valores fortes atuais, como reduções de 10%–15% e bônus de 10%, para uma faixa mais fraca;
4. evitar bônus escondidos fortes;
5. aplicar passivas de forma consistente entre Wild e Group;
6. manter as passivas fora do sistema de cartas neste momento;
7. adicionar testes que comprovem a aplicação e os limites das passivas.

---

## 6. O que este PR não faz

Este PR não altera:

- `js/combat/wildCore.js`;
- `js/combat/wildActions.js`;
- `js/combat/groupCombatFormula.js`;
- `js/combat/groupActions.js`;
- `data/skills.json`;
- dados de monstros;
- cartas;
- ENE regen;
- boss;
- Trade;
- Evolution;
- save/load;
- balanceamento runtime.

---

## 7. Veredito

A decisão correta para o Monstrinhomon é manter passivas de classe por identidade de RPG, mas torná-las fracas, explícitas e recalibradas.

O erro anterior era deixá-las como camada extra-canônica pendente. A decisão agora é oficializar a existência das passivas e controlar sua força.
