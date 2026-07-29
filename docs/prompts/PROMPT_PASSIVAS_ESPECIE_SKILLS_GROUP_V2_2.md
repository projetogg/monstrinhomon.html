# PROMPT OPERACIONAL — PASSIVAS DE ESPÉCIE NAS SKILLS GROUP V2.2

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Implementar o terceiro PR da sequência aprovada para as passivas de espécie:

```text
fix(combat): despachar passivas de espécie nas skills Group
```

O caminho `executePlayerSkillGroup()` deve passar a despachar os eventos canônicos de espécie que já são utilizados pelo Wild:

- `ON_ATTACK` ao utilizar uma skill;
- `ON_SKILL_USED` após o consumo da ação.

A alteração deve habilitar corretamente:

- `emberfang`;
- `swiftclaw`;
- `moonquill`;
- `shadowsting`;
- `bellwave`.

O despacho genérico de `ON_ATTACK` também deve continuar respeitando qualquer outra passiva já definida pelo contrato comum, sem criar exceções por ID.

Este PR não altera valores, fórmulas ou balanceamento.

---

## Contexto confirmado

A matriz de paridade registrou que `executePlayerSkillGroup()` não despachava eventos de espécie.

Consequências atuais:

- `emberfang` não recebe `+1 ATK` em skill ofensiva com HP acima de 70%;
- `swiftclaw` não aplica nem consome a abertura quando a primeira ação é uma skill;
- `moonquill` não recebe `+1 SPD` após utilizar debuff;
- `shadowsting` não cria a carga após debuff;
- `bellwave` não cria a carga após utilizar qualquer skill.

O ataque básico Group já sabe consumir:

- `swiftclawFirstStrikeDone`;
- `shadowstingDebuffCharged`;
- `bellwaveRhythmCharged`.

Portanto, este PR deve completar apenas a etapa de produção desses eventos e estados no caminho de skill.

---

## Fontes obrigatórias

Ler antes de alterar:

- `js/canon/speciesPassives.js`;
- `js/combat/combatEvents.js`;
- `js/combat/skillResolver.js`;
- `js/combat/wildActions.js`;
- `js/combat/groupActions.js`;
- `tests/speciesPassiveModeParityV22.test.js`;
- `tests/groupSkillExecution.test.js`;
- `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md`;
- `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.

Não utilizar documentos históricos para substituir o runtime atual.

---

## Regra 1 — `ON_ATTACK` em skills Group

Para toda skill válida, após confirmação de que existe ator, monstro, skill, ENE e alvo necessário, despachar:

```javascript
fireCombatEvent(mon, ON_ATTACK, {
    hpPct,
    isOffensiveSkill,
    isFirstAttackOfCombat,
    hasShadowstingCharge: false,
    hasBellwaveRhythmCharge: false,
});
```

### Estado

Utilizar:

```text
encounter.passiveState.swiftclawFirstStrikeDone
```

A abertura deve ser consumida quando o resolver retornar `atkBonus` para a skill.

### Aplicação do bônus

Quando a skill for ofensiva, o `atkBonus` deve modificar o ATK efetivo usado por `core.calcDamage()`:

```text
ATK base
→ buffs
→ atkBonus de espécie
→ core.calcDamage()
→ passivas de classe
→ mitigação
→ cap de dano
```

Não somar o bônus diretamente ao dano final.

### RC e acurácia

A skill Group utiliza o sistema de acurácia próprio já existente.

Este PR não deve:

- substituir esse sistema por RC bilateral;
- alterar crítico;
- alterar `accuracy`;
- alterar o dano-base da skill.

### Skill que erra

Se uma skill válida consumir ENE e errar, ela ainda foi utilizada.

Assim:

- `ON_ATTACK` pode consumir a abertura de `swiftclaw`;
- `ON_SKILL_USED` deve ser despachado;
- `bellwave` deve preparar sua carga;
- nenhum dano deve ser aplicado.

---

## Regra 2 — `ON_SKILL_USED`

Após uma skill válida ser utilizada, despachar:

```javascript
fireCombatEvent(mon, ON_SKILL_USED, {
    hpPct,
    skillType: skill.type,
    isDebuff,
});
```

Definir debuff com a mesma semântica usada no Wild:

```text
type === BUFF
AND target === enemy ou Inimigo
AND power < 0
```

O evento deve ocorrer:

- depois do consumo de ENE;
- em skill ofensiva acertando;
- em skill ofensiva errando;
- em skill não ofensiva aceita pelo pipeline;
- apenas uma vez por ação.

Não disparar em:

- skill inexistente;
- ENE insuficiente;
- ator inválido;
- monstro derrotado;
- alvo ofensivo inexistente.

---

## Regra 3 — `moonquill`

Quando `ON_SKILL_USED` retornar:

```javascript
{ spdBuff: { power: 1, duration: 1 } }
```

aplicar ao monstro:

```javascript
applyBuff(mon, {
    type: 'spd',
    power: 1,
    duration: 1,
    source: 'moonquill_passive',
});
```

Preservar os valores retornados pelo resolver.

Registrar log legível da ativação.

---

## Regra 4 — `shadowsting`

Quando uma skill classificada como debuff for utilizada por `shadowsting`, marcar:

```text
enc.passiveState.shadowstingDebuffCharged = true
```

A carga deve continuar sendo consumida somente pelo caminho já existente de ataque básico.

Não implementar neste PR:

- kit swap de execução no Group;
- bônus em skill ofensiva;
- consumo da carga pela própria skill.

---

## Regra 5 — `bellwave`

Quando qualquer skill válida for utilizada por `bellwave`, marcar:

```text
enc.passiveState.bellwaveRhythmCharged = true
```

A carga deve continuar sendo consumida somente pelo ataque básico já existente.

Não alterar o valor do bônus.

---

## Regra 6 — `emberfang`

Em skill ofensiva com HP estritamente acima de 70%, o resolver deve conceder `+1 ATK`.

Aplicar esse bônus ao ATK usado por `core.calcDamage()`.

Preservar o limite estrito:

```text
HP = 70% → não ativa
HP > 70% → ativa
```

---

## Regra 7 — `swiftclaw`

A primeira skill aceita pelo pipeline pode consumir a abertura de primeiro ataque, seguindo a integração Wild já caracterizada.

Após ativação:

```text
enc.passiveState.swiftclawFirstStrikeDone = true
```

Uma segunda skill ou ataque básico no mesmo combate não deve receber novamente o bônus.

---

## Estrutura recomendada

Criar helpers locais puros ou de efeito restrito em `groupActions.js`, por exemplo:

```text
resolvePlayerSpeciesSkillAttack(...)
dispatchPlayerSpeciesSkillUsed(...)
```

Responsabilidades:

### `resolvePlayerSpeciesSkillAttack`

- construir contexto de `ON_ATTACK`;
- retornar modificador;
- registrar log;
- consumir estado de `swiftclaw` quando ativado.

### `dispatchPlayerSpeciesSkillUsed`

- calcular `isDebuff`;
- disparar `ON_SKILL_USED`;
- aplicar buff de `moonquill`;
- criar carga de `shadowsting`;
- criar carga de `bellwave`.

Não criar um segundo resolver de passivas.

Não duplicar handlers por espécie.

---

## Testes obrigatórios

### `tests/speciesPassiveModeParityV22.test.js`

Converter o teste estrutural que preserva o drift para exigir que Wild e Group contenham:

- `ON_ATTACK` no caminho de skill;
- `ON_SKILL_USED` no caminho de skill;
- criação de `shadowstingDebuffCharged`;
- criação de `bellwaveRhythmCharged`.

A matriz não deve mais afirmar que Group não despacha eventos.

### `tests/groupSkillExecution.test.js`

Adicionar testes comportamentais para:

1. `emberfang` aumenta o dano da skill ofensiva em cenário determinístico;
2. `emberfang` não ativa exatamente em 70% de HP;
3. `swiftclaw` aplica o bônus na primeira skill;
4. `swiftclaw` registra `swiftclawFirstStrikeDone`;
5. abertura já consumida não concede novo bônus;
6. `moonquill` recebe buff de SPD após debuff;
7. `shadowsting` cria `shadowstingDebuffCharged`;
8. `bellwave` cria `bellwaveRhythmCharged` após skill;
9. skill ofensiva que erra ainda dispara `ON_SKILL_USED` e carrega `bellwave`;
10. ENE insuficiente não cria estados nem buffs;
11. `atkBonus` entra no ATK de `core.calcDamage()`, não no dano final.

Atualizar helpers de teste apenas quando necessário para reconhecer:

```text
skill.cost
skill.energy_cost
```

---

## Fora de escopo

Não alterar:

- ataque básico Wild;
- ataque básico Group;
- skills Wild;
- IA inimiga Group;
- passivas de espécie de inimigos controlados pela IA;
- `shieldhorn`;
- `floracura`;
- valores das passivas;
- limiares de HP;
- fórmula de skill Group;
- fórmula de dano básico;
- RC;
- crítico;
- ENE máxima ou regeneração;
- skills JSON;
- Card Layer;
- bosses;
- skills em área;
- seleção pendente de aliado além do comportamento atual;
- balanceamento.

Não implementar kit swap do `shadowsting` no Group neste PR.

---

## Arquivos esperados no diff final

```text
js/combat/groupActions.js
tests/speciesPassiveModeParityV22.test.js
tests/groupSkillExecution.test.js
docs/prompts/PROMPT_PASSIVAS_ESPECIE_SKILLS_GROUP_V2_2.md
```

Nenhum workflow temporário deve permanecer no diff final.

---

## Validação obrigatória

Executar:

```bash
npm run test:species-passive-parity-v2-2
npx vitest run tests/groupSkillExecution.test.js
npm run test:combat-parity-v2-2
npm run test:combat-simulation-v2-2
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
npm run test:wild-loop
```

O workflow `Combat v2.2 Baseline` deve continuar:

- testando o harness;
- testando Wild × Group;
- testando passivas de espécie;
- gerando baseline reproduzível;
- publicando artefatos.

---

## Título do PR

```text
fix(combat): despachar passivas de espécie nas skills Group
```

---

## Critérios de aceitação

O PR estará pronto quando:

- Group disparar `ON_ATTACK` no caminho de skill;
- Group disparar `ON_SKILL_USED` exatamente uma vez por skill válida;
- `emberfang` modificar o ATK antes de `core.calcDamage()`;
- `swiftclaw` aplicar e consumir a abertura;
- `moonquill` receber seu buff de SPD;
- `shadowsting` criar sua carga após debuff;
- `bellwave` criar sua carga após qualquer skill;
- skill que erra ainda produzir o evento de uso;
- ação inválida não produzir estados;
- nenhuma fórmula ou valor ser alterado;
- todos os testes e workflows permanecerem verdes;
- nenhuma automação temporária permanecer no branch.

---

## Conclusão obrigatória

Finalizar com uma destas classificações:

```text
A. Eventos de skill Group alinhados; matriz de passivas pronta para revalidação final
B. Integração parcial ou com regressão
C. Evidência insuficiente para concluir a integração
```

Não fazer merge sem autorização humana explícita.
