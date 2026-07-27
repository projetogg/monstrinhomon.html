# Prompt operacional — Simulação reproduzível do combate v2.2

Use este prompt para implementar, revisar ou repetir a baseline quantitativa do núcleo jogável.

---

Você trabalhará no repositório `projetogg/monstrinhomon.html`.

## Objetivo

Executar uma medição reproduzível do combate v2.2 sem alterar fórmula, atributos, PWR, crítico, passivas, ENE, bosses, habilidades, Card Layer, nomes ou IDs.

A entrega deve medir o comportamento atual e terminar com exatamente uma classificação:

- **A. Núcleo pronto para calibração**
- **B. Núcleo precisa de correções de bugs antes da calibração**
- **C. Evidência ainda insuficiente para decidir**

Testes verdes não autorizam, sozinhos, a classificação A.

## Autoridade e fontes

Leia antes de editar:

1. `README.md`
2. `AGENTS.md`
3. `docs/AI_ENTRYPOINT.md`
4. `docs/PROJECT_STATUS.md`
5. `docs/DECISION_LOG.md`
6. `docs/VALIDACAO_NUCLEO_JOGAVEL_V2_2.md`
7. `docs/PATCH_CANONICO_COMBATE_V2.2.md`
8. `js/combat/groupCombatFormula.js`
9. `js/combat/wildActions.js`
10. `js/combat/groupActions.js`
11. `data/monsters.json`
12. `data/skills.json`
13. `design/canon/class_matchups.json`

Use a `main` para descrever o runtime atual. Trate auditorias quantitativas antigas apenas como histórico; não reutilize suas conclusões sem repetir a medição com a fórmula v2.2.

## Registro inicial obrigatório

Registre:

- SHA da `main`;
- branch e SHA do trabalho;
- seed;
- execuções por cenário;
- versão dos dados;
- arquivos-fonte utilizados;
- limitações conhecidas;
- comandos executados.

## Implementação

Crie ou revise um harness que:

- importe `resolveConfrontation()` e `computeGroupDamage()` de `groupCombatFormula.js`;
- use RNG determinístico com seed textual;
- leia templates de `data/monsters.json`;
- leia habilidades de `data/skills.json`;
- leia matchups de `design/canon/class_matchups.json`;
- não copie a fórmula de dano para o simulador;
- não use `Math.random()` diretamente;
- não modifique objetos de origem;
- registre cenários, entradas, seed e métricas em JSON;
- produza relatório Markdown;
- permita repetir a mesma execução com resultado idêntico.

## Matriz mínima

Executar, nos níveis 1, 5, 10, 15 e 30:

1. Guerreiro × Bárbaro;
2. Bárbaro × Guerreiro;
3. Mago × Guerreiro;
4. Guerreiro × Mago;
5. Ladino × Caçador;
6. Caçador × Mago;
7. Curandeiro × Bárbaro;
8. Bardo × Curandeiro;
9. Animalista × Bardo.

Para cada confronto, comparar:

- ataque básico;
- política mista: usar a primeira skill ofensiva de estágio 0 quando houver ENE suficiente.

Use como referência inicial 1.000 execuções por cenário.

## Métricas obrigatórias

### Ritmo

- TTK médio;
- mediana;
- P10, P25, P75 e P90;
- taxa de 1–2 turnos;
- taxa de limite máximo.

### Resultado

- taxa de vitória;
- HP final médio;
- dano médio, mínimo e máximo.

### Confronto

- falha total;
- contato neutralizado;
- acerto reduzido;
- acerto normal;
- acerto forte;
- frequência de 1 e 20 naturais.

### Recursos e ações

- ataques básicos;
- skills usadas;
- taxa de uso de skill;
- ENE gasta;
- ENE regenerada.

## Limites da primeira baseline

Quando não estiverem modelados, declarar explicitamente como lacuna:

- playtest humano;
- cura;
- itens;
- passivas de espécie;
- escolha de alvo da IA;
- boss completo;
- equivalência integral Wild/Group;
- kit swaps;
- ordem dinâmica de turno;
- crescimento de stats exatamente igual ao runtime.

Não preencher essas lacunas com suposições silenciosas.

## Testes mínimos

Comprovar:

- mesma seed → mesma sequência;
- mesma seed e cenário → mesmo relatório;
- seed diferente pode alterar resultados;
- dados são carregados dos JSONs atuais;
- matriz possui os cinco níveis;
- os nove confrontos existem;
- métricas permanecem em intervalos válidos;
- soma das categorias de RC coincide com ataques registrados;
- objetos de entrada não sofrem mutação;
- relatório não declara A sem evidência de playtest e cobertura completa.

Execute:

```bash
npm test
npm run test:combat-simulation-v2-2
npm run simulate:combat-v2-2 -- --runs 1000 --seed <SHA>
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando disponível:

```bash
npm run test:wild-loop
```

## Entrega final

Apresente:

1. baseline e fontes;
2. tabela de cenários;
3. fatos verificados;
4. limitações;
5. hipóteses aceitas, rejeitadas ou inconclusivas;
6. bugs separados de balanceamento;
7. decisões humanas necessárias;
8. somente um próximo PR técnico recomendado;
9. classificação A, B ou C.

Não alterar balanceamento dentro deste trabalho.
