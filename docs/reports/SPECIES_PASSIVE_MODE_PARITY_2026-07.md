# Paridade das passivas de espécie — Wild × Group

## Status

Relatório de caracterização do combate v2.2, baseado na `main` após o merge do PR #263.

Este documento não altera regras, não escolhe qual modo representa a intenção canônica e não autoriza balanceamento.

## Fontes

- `js/canon/speciesPassives.js`
- `js/combat/combatEvents.js`
- `js/combat/wildActions.js`
- `js/combat/groupActions.js`
- `js/combat/groupCore.js`
- `js/combat/groupCombatFormula.js`

## Método

A comparação separa três dimensões:

1. **contrato puro:** evento e modificador retornado por `fireCombatEvent()`;
2. **integração:** contexto e estado realmente produzidos pelo modo;
3. **efeito observável:** etapa em que o modificador entra no cálculo final.

Compartilhar o mesmo resolver não é considerado prova suficiente de paridade.

## Matriz

| Espécie | Contrato puro | Wild | Group | Classificação |
|---|---|---|---|---|
| `shieldhorn` | primeiro hit recebe `-1` de dano | espécie antes da resistência de classe | resistência de classe antes da espécie | `TRIGGER_PARITY_EFFECT_DRIFT` |
| `emberfang` | skill ofensiva, HP >70%, `+1 ATK` | evento disparado em `executeWildSkill` | skill não dispara evento de espécie | `DRIFT_WILD_GROUP` |
| `floracura` | primeira cura por item recebe `+3 HP` | integrado e consome estado | integrado e consome estado | `PARITY` |
| `swiftclaw` | primeiro ataque do combate recebe `+1 ATK` | básico e skill podem consumir abertura | básico suporta; skill não dispara evento | `DRIFT_WILD_GROUP` |
| `moonquill` | debuff concede `+1 SPD` por 1 turno | `ON_SKILL_USED` integrado | skill não dispara `ON_SKILL_USED` | `DRIFT_WILD_GROUP` |
| `shadowsting` | debuff prepara próximo básico com `+1 ATK` | debuff cria carga e básico consome | básico consome carga preexistente, mas skill não a cria | `DRIFT_WILD_GROUP` |
| `bellwave` | qualquer skill prepara próximo básico com `+1 ATK` | skill cria carga e básico consome | básico consome carga preexistente, mas skill não a cria | `DRIFT_WILD_GROUP` |
| `wildpace` | HP <40% concede `+1 ATK` | bônus altera ATK antes da fórmula | bônus soma 1 ao dano final | `TRIGGER_PARITY_EFFECT_DRIFT` |

## Achados

### SP-01 — Contrato comum íntegro

As oito espécies continuam registradas no resolver central e retornam seus modificadores canônicos nas condições esperadas.

### SP-02 — Group não despacha eventos de espécie no caminho de skill do jogador

O caminho `executePlayerSkillGroup()` não dispara `ON_ATTACK` nem `ON_SKILL_USED` para passivas de espécie.

Consequências observáveis:

- `emberfang` não recebe o bônus de skill ofensiva;
- `moonquill` não recebe SPD após debuff;
- `shadowsting` não cria carga após debuff;
- `bellwave` não cria carga após skill;
- `swiftclaw` não é aplicado nem consumido quando a primeira ação é uma skill.

### SP-03 — Bônus de ataque entra em etapas diferentes

No Wild, o `atkBonus` de espécie é somado ao ATK antes de `computeGroupDamage()`.

No Group, o resultado do dano é calculado primeiro e o `atkBonus` é somado diretamente ao dano final.

Em um `acerto_reduzido`, o `wildpace` pode ser absorvido pelo `floor()` do multiplicador no Wild, enquanto o Group sempre acrescenta 1 ponto depois do cálculo.

### SP-04 — Ordem defensiva diferente

No Wild:

1. calcula dano-base;
2. aplica `shieldhorn`;
3. aplica resistência defensiva da classe.

No Group:

1. calcula dano-base;
2. aplica resistência defensiva da classe;
3. aplica `shieldhorn`.

A ordem altera o resultado em cenários de fronteira por causa do arredondamento.

### SP-05 — Floracura é o caso de paridade end-to-end

Nos dois modos, o primeiro item de cura:

- dispara `ON_HEAL_ITEM`;
- adiciona até 3 HP;
- marca `floracuraHealUsed`;
- impede nova ativação no mesmo combate.

## Limites

Esta etapa não cobre integralmente:

- passivas em monstros inimigos controlados pela IA;
- troca de monstrinho;
- KO seguido de retorno;
- reset completo entre encontros;
- múltiplos hits na mesma rodada de Group;
- skills de área;
- passivas em boss;
- interação com Card Layer;
- decisão sobre qual ordem ou etapa é canônica.

## Próxima decisão

As divergências não devem ser corrigidas em bloco.

A sequência recomendada é:

1. decidir a etapa canônica de aplicação de `atkBonus` de espécie;
2. decidir a ordem canônica de mitigação de `shieldhorn` e resistência de classe;
3. criar um PR isolado para despachar eventos de espécie no caminho de skills Group;
4. somente depois revisar a baseline quantitativa.

## Classificação final

**A. Contrato compartilhado; drifts de integração isolados.**

A classificação confirma que o resolver comum está estável, mas impede interpretar Wild e Group como equivalentes para passivas de espécie até que as decisões acima sejam tomadas.
