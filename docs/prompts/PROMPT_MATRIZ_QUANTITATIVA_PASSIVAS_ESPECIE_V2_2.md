# PROMPT OPERACIONAL — MATRIZ QUANTITATIVA DAS PASSIVAS DE ESPÉCIE V2.2

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Criar uma matriz quantitativa reproduzível e separada da baseline atual para medir o impacto das oito passivas de espécie.

A matriz deve comparar pares determinísticos:

```text
sem passiva × com passiva
```

Ela deve medir:

- frequência de ativação;
- dano adicional;
- dano evitado;
- cura adicional;
- buffs aplicados;
- cargas criadas e consumidas;
- TTK;
- vitória;
- sobrevivência.

Este PR não altera valores, fórmulas, runtime ou balanceamento.

---

## Fontes obrigatórias

- `js/canon/speciesPassives.js`;
- `js/combat/groupCombatFormula.js`;
- `js/combat/combatSimulationHarness.js`;
- `tests/speciesPassiveFinalParityV22.test.js`;
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`;
- `docs/reports/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.md`;
- `docs/ROADMAP.md`;
- `docs/PROJECT_STATUS.md`.

---

## Regra de isolamento

A baseline atual de fórmula e passivas de classe deve permanecer intacta.

Criar um micro-harness próprio:

```text
js/combat/speciesPassiveQuantitativeHarness.js
```

Esse harness deve reutilizar:

- `resolvePassiveModifier()`;
- `resolveConfrontation()`;
- `computeGroupDamage()`;
- RNG e escalonamento do harness atual;
- templates atuais de monstrinhos;
- matchups atuais.

Não duplicar o resolver central de passivas.

---

## Matriz mínima

Cobrir:

```text
8 espécies × 3 níveis × 2 perfis = 48 pares
```

Níveis:

- `1`;
- `10`;
- `30`.

Perfis:

- `basic`;
- `mixed`.

Cada par deve executar a variante sem passiva e a variante com passiva com a mesma seed por combate.

Na configuração padrão:

```text
48 pares × 1000 execuções × 2 variantes = 96.000 batalhas
```

---

## Espécies

### `shieldhorn`

- classe: Guerreiro;
- papel: defensor;
- medir ativações, aplicações e dano evitado;
- aplicar a redução plana depois da resistência de classe;
- preservar mínimo de dano em `1`.

### `emberfang`

- classe: Bárbaro;
- medir `+1 ATK` apenas em skill ofensiva;
- respeitar HP estritamente acima de 70%;
- perfil básico deve permanecer inerte;
- perfil misto deve produzir ativações.

### `floracura`

- classe: Curandeiro;
- usar um item de cura controlado por combate;
- medir bônus oferecido e cura efetivamente recebida;
- preservar o limite de HP máximo;
- consumir apenas a primeira cura.

### `swiftclaw`

- classe: Caçador;
- medir o primeiro ataque confirmado;
- consumir a abertura uma única vez;
- registrar bônus e impacto no resultado.

### `moonquill`

- classe: Mago;
- usar ciclo controlado `debuff → ataque`;
- aplicar `+1 SPD` por um turno;
- usar cenário de fronteira de SPD para tornar o efeito observável;
- medir aplicações e turnos efetivamente usados.

### `shadowsting`

- classe: Ladino;
- usar ciclo `debuff → básico`;
- medir cargas criadas e consumidas;
- aplicar `+1 ATK` apenas no ataque básico carregado.

### `bellwave`

- classe: Bardo;
- usar ciclo `skill → básico`;
- medir cargas criadas e consumidas;
- aplicar `+1 ATK` apenas no básico carregado.

### `wildpace`

- classe: Animalista;
- iniciar o cenário controlado abaixo de 40% de HP;
- medir `+1 ATK` em ataques válidos;
- manter o limite estrito de HP.

---

## Perfis de ação

### `basic`

O jogador utiliza somente ataque básico.

O perfil deve demonstrar quais passivas são naturalmente inertes sem skill ou setup.

### `mixed`

O jogador alterna:

```text
skill/setup → ataque básico
```

Para `moonquill` e `shadowsting`, a skill deve ser um debuff controlado.

Para as demais espécies, usar skill ofensiva controlada quando aplicável.

O inimigo utiliza ataque básico para manter o cenário interpretável.

---

## Métricas por variante

Registrar:

- taxa de vitória;
- taxa de empate;
- TTK;
- HP final;
- dano causado;
- dano recebido;
- cura;
- ações;
- ataques básicos;
- skills;
- debuffs;
- categorias de RC;
- combates com ativação;
- total de gatilhos;
- efeitos diretos;
- aplicações e soma de `atkBonus`;
- aplicações e soma de redução de dano;
- aplicações e soma de bônus de cura;
- buffs de SPD aplicados;
- turnos de buff utilizados;
- cargas criadas;
- cargas consumidas.

---

## Deltas pareados

Calcular, por combate:

- dano causado com passiva menos dano causado sem passiva;
- dano recebido sem passiva menos dano recebido com passiva;
- cura com passiva menos cura sem passiva;
- TTK com passiva menos TTK sem passiva;
- HP final com passiva menos HP final sem passiva;
- resultado de vitória com passiva menos resultado sem passiva.

Para cada delta registrar:

- média;
- mediana;
- P10;
- P90;
- mínimo;
- máximo;
- proporção positiva;
- proporção zero;
- proporção negativa.

---

## Ferramentas obrigatórias

Criar:

```text
js/combat/speciesPassiveQuantitativeHarness.js
scripts/simulate-species-passives-v2-2.mjs
tests/speciesPassiveQuantitativeMatrixV22.test.js
```

Adicionar ao `package.json`:

```text
test:species-passive-quantitative-v2-2
simulate:species-passives-v2-2
```

---

## Artefato

Produzir separadamente:

```text
artifacts/species-passive-v2-2-matrix.json
artifacts/species-passive-v2-2-matrix.md
```

O JSON deve conter:

- schema;
- SHA;
- seed;
- execuções;
- cobertura;
- fontes;
- limitações;
- agregado por espécie;
- resultados dos 48 pares.

O Markdown deve apresentar uma tabela agregada das oito espécies.

---

## Integração no CI

Preservar o job atual da baseline.

Adicionar um segundo job ao workflow `Combat v2.2 Baseline`:

```text
species-passive-matrix
```

Esse job deve:

1. executar o teste da matriz;
2. gerar JSON e Markdown;
3. publicar um artefato próprio;
4. não misturar os arquivos com a baseline tradicional.

---

## Testes obrigatórios

Verificar:

1. construção dos 48 pares;
2. reprodutibilidade pela seed;
3. `emberfang` inerte em `basic` e ativo em `mixed`;
4. mitigação positiva de `shieldhorn`;
5. cura adicional de `floracura`;
6. buff aplicado e utilizado por `moonquill`;
7. cargas criadas e consumidas por `shadowsting`;
8. cargas criadas e consumidas por `bellwave`;
9. ativação de `wildpace` abaixo de 40%;
10. agregado das oito espécies;
11. relatório não autorizando balanceamento.

---

## Fora de escopo

Não alterar:

- `speciesPassives.js`;
- `wildActions.js`;
- `groupActions.js`;
- `groupCombatFormula.js`;
- `combatSimulationHarness.js`;
- valores das passivas;
- PWR;
- crítico;
- ENE;
- monstros;
- skills;
- matchups;
- bosses;
- IA;
- Card Layer;
- balanceamento.

---

## Limitações obrigatórias

Registrar que a matriz:

- usa ações roteirizadas;
- não simula IA completa;
- não simula economia integral de ENE;
- não cobre múltiplos alvos;
- não cobre bosses;
- usa inimigo sem passiva de espécie;
- não substitui playtest humano.

---

## Validação

Executar:

```bash
npm run test:species-passive-quantitative-v2-2
npm run simulate:species-passives-v2-2 -- --runs 1000
npm run test:combat-simulation-v2-2
npm run test:combat-parity-v2-2
npm run test:species-passive-parity-v2-2
npm run test:species-passive-final-parity-v2-2
npm run test:combat-baseline-comparison-v2-2
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
npm run test:wild-loop
```

---

## Estrutura do PR

Título:

```text
test(combat): adicionar matriz quantitativa de passivas de espécie
```

O PR deve permanecer sem mudanças de runtime ou valores.

Não fazer merge sem autorização humana explícita.

---

## Classificação final

Finalizar com uma destas opções:

```text
A. Matriz quantitativa criada e artefato publicado; análise humana permanece pendente
B. Matriz parcial ou com espécie sem medição válida
C. Evidência insuficiente para publicar a matriz
```
