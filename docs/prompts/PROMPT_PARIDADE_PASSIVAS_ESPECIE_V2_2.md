# PROMPT OPERACIONAL — PARIDADE DAS PASSIVAS DE ESPÉCIE V2.2

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Caracterizar, com testes determinísticos, como as oito passivas canônicas de espécie são disparadas, aplicadas e consumidas nos modos Wild e Group.

Esta etapa não corrige divergências, não escolhe qual modo está correto e não altera balanceamento.

## Princípios

1. Medir antes de corrigir.
2. Separar paridade de gatilho, paridade de estado e paridade do efeito final.
3. Não tratar o uso do mesmo `fireCombatEvent()` como prova suficiente de equivalência.
4. Preservar diferenças observadas como testes de caracterização.
5. Não modificar runtime, dados, PWR, atributos, crítico, ENE, skills ou matchups.
6. Não fazer merge sem autorização humana explícita.

## Fontes obrigatórias

- `js/canon/speciesPassives.js`
- `js/combat/combatEvents.js`
- `js/combat/wildActions.js`
- `js/combat/groupActions.js`
- `js/combat/groupCore.js`
- `js/combat/groupCombatFormula.js`
- testes existentes de passivas e bridges
- relatório de paridade do harness com Wild e Group

## Espécies obrigatórias

- `shieldhorn`
- `emberfang`
- `floracura`
- `swiftclaw`
- `moonquill`
- `shadowsting`
- `bellwave`
- `wildpace`

## Dimensões de comparação

Para cada passiva, registrar:

- evento canônico;
- payload necessário;
- condição de ativação;
- modificador retornado;
- ponto do pipeline em que o evento é disparado;
- ponto do pipeline em que o modificador é aplicado;
- estado criado;
- estado consumido;
- estado resetado;
- suporte no ataque básico;
- suporte em skills;
- suporte em itens;
- comportamento em Wild;
- comportamento em Group;
- classificação.

## Classificações permitidas

- `PARITY`
- `TRIGGER_PARITY_EFFECT_DRIFT`
- `DRIFT_WILD_GROUP`
- `EXPECTED_DIFFERENCE`
- `EVIDENCE_GAP`

## Matriz mínima

### Contrato puro

Confirmar que as oito passivas continuam ativas e que cada uma retorna o modificador esperado nas condições canônicas.

### Ataques básicos

Confirmar os gates compartilhados:

- `isFirstAttackOfCombat`;
- `hasShadowstingCharge`;
- `hasBellwaveRhythmCharge`;
- `isOffensiveSkill: false`;
- `hpPct`.

Não presumir equivalência do efeito. Comparar se `atkBonus` altera ATK antes da fórmula ou dano depois da fórmula.

### Skills

Comparar se Wild e Group disparam:

- `ON_ATTACK` para skill ofensiva;
- `ON_SKILL_USED`;
- carga de `shadowsting` após debuff;
- carga de `bellwave` após qualquer skill;
- consumo de abertura do `swiftclaw` quando a primeira ação é uma skill.

### Cura por item

Comparar:

- `ON_HEAL_ITEM`;
- `isFirstHeal`;
- bônus de `floracura`;
- consumo de `floracuraHealUsed`.

### Mitigação

Comparar a ordem entre:

- `shieldhorn.damageReduction`;
- resistência defensiva da classe Guerreiro.

Construir um cenário de fronteira no qual a ordem de arredondamento produza resultado observável.

### Bônus de ataque

Construir um cenário de `acerto_reduzido` no qual:

- Wild aplique `atkBonus` antes do multiplicador da faixa;
- Group aplique `+1` depois do dano calculado.

Usar `wildpace` com HP abaixo de 40% para tornar a diferença reproduzível.

## Testes obrigatórios

Criar `tests/speciesPassiveModeParityV22.test.js` cobrindo:

1. catálogo exato das oito passivas;
2. modificadores puros;
3. limites estritos de HP;
4. presença dos gates nos ataques básicos;
5. ausência ou presença dos eventos de skill por modo;
6. integração de `floracura` por item;
7. estágio de aplicação de `atkBonus`;
8. ordem de `shieldhorn` e resistência de classe;
9. cenário observável de drift do `wildpace`;
10. cenário observável de drift do `shieldhorn`;
11. cenário observável de paridade do `floracura`.

## Integração no CI

Adicionar:

```bash
npm run test:species-passive-parity-v2-2
```

Executar esse comando no workflow `Combat v2.2 Baseline` antes da geração da baseline.

## Limites

Não alterar:

- `speciesPassives.js`;
- `combatEvents.js`;
- `wildActions.js`;
- `groupActions.js`;
- fórmula de dano;
- fórmula de confronto;
- dados canônicos;
- passivas de classe;
- valores das passivas de espécie.

O PR deve apenas caracterizar o estado atual.

## Entrega

Criar:

- `tests/speciesPassiveModeParityV22.test.js`;
- `docs/prompts/PROMPT_PARIDADE_PASSIVAS_ESPECIE_V2_2.md`;
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`.

Atualizar:

- `package.json`;
- `.github/workflows/combat-v2-2-baseline.yml`.

## Conclusão obrigatória

Finalizar com uma destas classificações:

- **A. Contrato compartilhado; drifts de integração isolados**
- **B. Evidência indica bug no contrato comum antes da comparação de modos**
- **C. Evidência insuficiente para caracterizar as passivas**

A classificação não autoriza correção automática nem balanceamento.
