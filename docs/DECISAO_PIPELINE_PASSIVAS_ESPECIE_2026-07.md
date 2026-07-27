# Decisão canônica — Pipeline das passivas de espécie

**Data:** 2026-07-27  
**Status:** APPROVED  
**Domínio:** Combate / Passivas de espécie  
**Evidência principal:** `docs/reports/SPECIES_PASSIVE_MODE_PARITY_2026-07.md` e `tests/speciesPassiveModeParityV22.test.js`

## Contexto

O PR #264 caracterizou diferenças reproduzíveis entre Wild e Group sem alterar o runtime. O contrato central das oito passivas de espécie permaneceu íntegro, mas dois pontos do pipeline produzem resultados diferentes:

1. `atkBonus` de espécie entra antes da fórmula no Wild e depois do dano calculado no Group;
2. a resistência percentual de classe e a redução plana de `shieldhorn` são aplicadas em ordens diferentes.

Este documento registra as decisões humanas necessárias para orientar PRs corretivos separados. Ele não altera valores, condições de ativação ou balanceamento.

---

## DEC-SPECIES-ATK-01 — Aplicação do `atkBonus` de espécie

**Status:** APPROVED  
**Referência atual:** Wild  
**Correção futura:** Group

### Evidência

No Wild, o modificador é somado ao ATK efetivo antes de `computeGroupDamage()`. No Group, o dano é calculado primeiro e o valor é somado ao dano final. Em cenários de `acerto_reduzido`, os dois caminhos podem produzir resultados diferentes por causa do arredondamento.

### Decisão

O `atkBonus` de espécie modifica o atributo ofensivo utilizado pela fórmula antes do cálculo do dano.

### Pipeline canônico

```text
ATK base
→ modificadores de buffs
→ atkBonus de espécie
→ fórmula de dano
→ multiplicador da categoria de RC
→ mitigação defensiva
→ dano final
```

### Justificativa

- O campo representa bônus de ATK, não bônus de dano final.
- O modificador deve participar da relação entre ATK e DEF.
- O efeito deve respeitar a categoria de RC.
- O bônus não garante automaticamente um ponto adicional de dano.
- Arredondamentos podem absorver o ganho, como ocorre com outros modificadores de atributo.

### Consequências

- O caminho Wild é a referência para esta etapa específica.
- O Group deverá aplicar o bônus no ATK efetivo antes da fórmula.
- O Group não deverá somar `atkSpeciesPassive.atkBonus` diretamente ao dano já calculado.
- O teste de drift de `wildpace` deverá ser convertido em teste de paridade após a correção.

### Fora de escopo

- valor numérico do bônus;
- limiares de HP;
- frequência de ativação;
- mudança do campo para `damageBonus`;
- recalibração das espécies.

### Critério para reabertura

A decisão pode ser reavaliada apenas com mudança formal da semântica do campo, nova arquitetura de atributos ou evidência de playtest e balanceamento que justifique outra regra.

---

## DEC-SPECIES-DEF-01 — Ordem da mitigação de `shieldhorn`

**Status:** APPROVED  
**Referência atual:** Group  
**Correção futura:** Wild

### Evidência

No Wild, `shieldhorn` reduz o dano antes da resistência percentual da classe. No Group, a resistência percentual é aplicada primeiro e a redução plana ocorre depois. Em valores de fronteira, a ordem altera o dano final por causa do arredondamento.

### Decisão

Reduções percentuais de classe são aplicadas antes das reduções planas de espécie.

### Pipeline canônico

```text
dano calculado
→ resistência percentual da classe
→ redução plana de shieldhorn
→ mínimo de 1
→ aplicação ao HP
```

### Justificativa

- A resistência de classe modifica proporcionalmente o dano recebido.
- `shieldhorn` representa redução plana e observável.
- Aplicar a redução plana por último preserva a clareza do feedback.
- A redução não deve desaparecer por arredondamento percentual posterior.
- O mínimo de dano continua sendo 1 quando houver acerto válido.

### Consequências

- O caminho Group é a referência para esta ordem específica.
- O Wild deverá mover a aplicação de `shieldhorn` para depois da resistência defensiva da classe.
- O cenário de fronteira deverá exigir o mesmo dano nos dois modos após a correção.

### Fora de escopo

- valor da redução;
- número de ativações;
- primeiro hit por turno versus rodada;
- múltiplos hits;
- bosses;
- itens defensivos;
- novas camadas de mitigação.

### Critério para reabertura

A decisão pode ser reavaliada apenas se o sistema de mitigação for redesenhado, se o mínimo de dano mudar ou se playtests mostrarem que a ordem prejudica clareza ou funcionamento esperado.

---

## Sequência técnica autorizada

As decisões acima autorizam os seguintes PRs separados, nesta ordem:

1. `fix(combat): aplicar atkBonus de espécie antes da fórmula no Group`;
2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild`;
3. `fix(combat): despachar passivas de espécie nas skills Group`.

Cada PR deve alterar apenas um domínio, manter valores atuais e converter os respectivos testes de drift em testes de paridade.

## Limites desta decisão

- nenhuma linha de runtime é alterada neste documento;
- nenhum valor de passiva é recalibrado;
- skills Group continuam divergentes até PR próprio;
- os drifts documentados permanecem reais até as correções técnicas;
- esta aprovação não declara o combate balanceado.
