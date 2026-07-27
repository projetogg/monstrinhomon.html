# PROMPT OPERACIONAL — ORDEM DEFENSIVA DO `shieldhorn` NO WILD

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Implementar exclusivamente a decisão canônica:

```text
DEC-SPECIES-DEF-01
```

No ataque básico do modo Wild, a resistência percentual da classe defensora deve ser aplicada antes da redução plana de `shieldhorn`.

Esta etapa corrige apenas a ordem das duas camadas defensivas. Não altera valores, gatilhos, fórmulas compartilhadas ou balanceamento.

---

## Fontes obrigatórias

- `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`
- `js/combat/wildActions.js`
- `js/combat/groupActions.js`
- `js/combat/groupCombatFormula.js`
- `tests/speciesPassiveModeParityV22.test.js`
- `tests/combatHarnessRuntimeParityV22.test.js`

---

## Regra canônica

```text
dano calculado
→ modificadores ofensivos posteriores já existentes
→ resistência percentual da classe defensora
→ redução plana de shieldhorn
→ mínimo de 1
→ aplicação ao HP
```

A referência atual para esta ordem é o modo Group.

---

## Alteração obrigatória

No caminho:

```text
executeWildAttack()
```

Realizar somente a seguinte mudança:

1. preservar o cálculo de `baseDamage`;
2. preservar a passiva ofensiva de classe do atacante;
3. aplicar `defClassPassive.defenseBonus` antes de `shieldhorn`;
4. disparar `ON_HIT` de `shieldhorn` depois da resistência percentual;
5. aplicar `damageReduction` como redução plana;
6. preservar `Math.max(1, ...)` após cada camada existente;
7. preservar o log da passiva e o gatilho `isFirstHitThisTurn: true`;
8. preservar o dano mínimo em 1.

O código não deve modificar o contrato central de `shieldhorn` nem o valor `damageReduction = 1`.

---

## Testes obrigatórios

Atualizar:

```text
tests/speciesPassiveModeParityV22.test.js
```

### Proteção estrutural

O teste deve confirmar que, em Wild e Group:

```text
passiva defensiva de classe
→ passiva defensiva de espécie
```

A asserção deve falhar se `shieldhorn` voltar a ser aplicado antes da resistência de classe.

### Cenário de fronteira

Converter o cenário atual de drift para paridade.

Resultado esperado:

```text
Wild sem shieldhorn: 3
Wild com shieldhorn: 2
Group sem shieldhorn: 3
Group com shieldhorn: 2
```

O teste deve exigir igualdade entre os dois modos para o defensor Guerreiro com `shieldhorn`.

---

## Fora de escopo

Não alterar:

- `atkBonus` de espécie;
- ataque básico Group;
- skills Wild;
- skills Group;
- eventos de espécie nas skills Group;
- criação ou consumo de cargas de `shadowsting` e `bellwave`;
- `swiftclaw`, `wildpace`, `emberfang`, `moonquill` ou `floracura`;
- valor ou frequência de `shieldhorn`;
- definição de primeiro hit por turno;
- múltiplos hits;
- bosses;
- fórmula de confronto;
- fórmula de dano;
- PWR;
- crítico;
- ENE;
- dados JSON;
- IA;
- Card Layer;
- balanceamento.

---

## Validação obrigatória

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

O workflow `Combat v2.2 Baseline` deve continuar:

- executando o harness;
- executando as matrizes de paridade;
- gerando a baseline reproduzível;
- publicando os artefatos.

---

## Estrutura do PR

Título:

```text
fix(combat): alinhar ordem defensiva do shieldhorn no Wild
```

O diff final deve permanecer limitado a:

- runtime do ataque básico Wild;
- teste correspondente;
- este prompt operacional.

---

## Critérios de aceitação

O PR estará pronto quando:

- a resistência percentual da classe ocorrer antes de `shieldhorn` no Wild;
- o valor de `shieldhorn` continuar em 1;
- o gatilho continuar sendo o primeiro hit do turno no fluxo atual;
- Wild e Group produzirem 2 de dano no cenário equivalente com `shieldhorn`;
- o cenário sem a passiva continuar produzindo 3;
- o drift de skills Group continuar presente e isolado;
- `atkBonus` continuar em paridade;
- todos os checks estiverem verdes;
- nenhum valor ou fórmula compartilhada for alterado.

---

## Conclusão obrigatória

Finalizar com uma destas classificações:

```text
A. DEC-SPECIES-DEF-01 implementada no Wild; drift de skills permanece isolado
B. Implementação incompleta ou com regressão
C. Evidência insuficiente para confirmar paridade
```

Não fazer merge sem autorização humana explícita.
