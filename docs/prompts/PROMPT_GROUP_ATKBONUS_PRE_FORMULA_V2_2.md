# PROMPT OPERACIONAL — `atkBonus` DE ESPÉCIE ANTES DA FÓRMULA NO GROUP

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Implementar exclusivamente a decisão `DEC-SPECIES-ATK-01` no ataque básico do modo Group.

O `atkBonus` retornado por uma passiva de espécie deve modificar o ATK efetivo utilizado por `computeGroupDamage()` antes do cálculo do dano. Ele não deve ser somado diretamente ao dano final.

Esta etapa não altera valores, gatilhos ou balanceamento.

## Fontes obrigatórias

- `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`
- `js/combat/groupActions.js`
- `js/combat/wildActions.js`
- `js/combat/groupCombatFormula.js`
- `tests/speciesPassiveModeParityV22.test.js`
- `tests/combatHarnessRuntimeParityV22.test.js`

## Regra canônica

```text
ATK base
→ buffs ofensivos
→ atkBonus de espécie
→ fórmula de dano
→ multiplicador da categoria de RC
→ mitigação defensiva
→ dano final
```

## Alteração obrigatória

No caminho `executePlayerAttackGroup()`:

1. manter `resolveConfrontation()` usando o mesmo `effectiveAtk` atual;
2. manter o disparo de `ON_ATTACK` apenas após a confirmação de acerto;
3. criar `effectiveAtkForDamage` a partir de `effectiveAtk`;
4. somar `atkSpeciesPassive.atkBonus` em `effectiveAtkForDamage`;
5. passar `effectiveAtkForDamage` ao campo `atk` de `computeGroupDamage()`;
6. remover a soma posterior do bônus ao dano final;
7. preservar logs e consumo dos estados já existentes.

A correção não deve fazer o bônus modificar retroativamente a categoria de RC. Este PR implementa somente a etapa aprovada para a fórmula de dano.

## Passivas abrangidas

O pipeline deve continuar atendendo:

- `swiftclaw`;
- `shadowsting` quando a carga já existir;
- `bellwave` quando a carga já existir;
- `wildpace`.

A criação de cargas por skills Group permanece fora do escopo.

## Testes obrigatórios

Atualizar `tests/speciesPassiveModeParityV22.test.js` para:

- exigir que o bônus seja aplicado antes de `computeGroupDamage()`;
- exigir `atk: effectiveAtkForDamage` no Group;
- impedir a reintrodução de soma direta ao dano final;
- converter o cenário observável de `wildpace` de drift para paridade;
- manter o drift defensivo de `shieldhorn` inalterado;
- manter o drift das skills Group inalterado.

## Fora de escopo

Não alterar:

- ordem defensiva de `shieldhorn`;
- `executePlayerSkillGroup()`;
- eventos `ON_ATTACK` e `ON_SKILL_USED` em skills Group;
- valores ou limiares das passivas;
- fórmula de dano compartilhada;
- fórmula de confronto;
- PWR, atributos, crítico ou ENE;
- dados JSON;
- IA, bosses ou Card Layer.

## Validação

Executar:

```bash
npm run test:species-passive-parity-v2-2
npm run test:combat-parity-v2-2
npm run test:combat-simulation-v2-2
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
npm run test:wild-loop
```

O workflow `Combat v2.2 Baseline` deve continuar verde e publicar os artefatos normalmente.

## Estrutura do PR

Título:

```text
fix(combat): aplicar atkBonus de espécie antes da fórmula no Group
```

O diff deve permanecer limitado ao runtime Group, ao teste de paridade correspondente e a este prompt operacional.

## Critérios de aceitação

- Group não soma mais `atkBonus` diretamente ao dano final;
- `computeGroupDamage()` recebe o ATK efetivo já modificado;
- o cenário de fronteira de `wildpace` produz o mesmo dano em Wild e Group;
- nenhum outro drift é corrigido por acidente;
- todas as validações permanecem verdes;
- nenhuma decisão de balanceamento é tomada.

## Conclusão obrigatória

Finalizar com uma das classificações:

- **A. `DEC-SPECIES-ATK-01` implementada no Group; próximo drift permanece isolado**
- **B. Implementação incompleta ou com regressão**
- **C. Evidência insuficiente para confirmar paridade**

Não fazer merge sem autorização humana explícita.
