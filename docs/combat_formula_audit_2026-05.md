# Auditoria da Fórmula de Combate — Patch v2.2 vs Runtime

**Data:** 2026-05-26  
**PR:** `test(combat): auditar fórmula runtime contra Patch v2.2`  
**Status:** Diagnóstico histórico + atualização de status (2026-06)  
**Auditor:** Agente técnico (Copilot)

---

## Nota de status (2026-06)

- **Wild Combat (fórmula base): corrigido neste PR** para o modelo canônico v2.2 no runtime de execução (`wildActions.js`), com:
  - RC bilateral (`d20A`/`d20D`);
  - `ceil(DEF/2)` no confronto;
  - `floor(DEF/2)` no dano;
  - `ModNível`;
  - 5 faixas de RC;
  - crítico v2.2 (`nat20` = +4 RC e +20% dano final, sem auto-hit).
- **Passivas de classe:** preservadas sem recalibração neste PR.
- **Pendências mantidas fora de escopo:** ENE regen, boss e recalibração das passivas (PR dedicado posterior).

---

## 1. Resumo executivo

| Pergunta | Resposta |
|---|---|
| Runtime alinhado ao Patch v2.2? | **Parcialmente.** Group Combat está alinhado. Wild Combat **não está**. |
| Divergência é real, documental ou incerta? | **Real** para Wild Combat. **Documental** para passivas de classe e boss. |
| Há risco crítico? | **Sim.** Wild Combat usa fórmula diferente do canônico v2.2 — diverge em acerto, dano, crítico e ModNível. |
| O que deve ser corrigido primeiro? | Wild Combat: migrar para fórmula bilateral de RC + 5 faixas + `floor(DEF/2)`, preservando as passivas de classe como camada canônica fraca/recalibrada (Decisão B resolvida). |

### Situação geral

- **Group Combat** (`groupCombatFormula.js` + `groupActions.js`): implementa a fórmula bilateral canônica do Patch v2.2 — RC de 5 faixas, `ModNível`, `ceil(DEF/2)` no hit, `floor(DEF/2)` na mitigação. **Alinhado.**
- **Wild Combat** (`wildCore.js` + `wildActions.js`): usa fórmula unilateral antiga — `d20 + ATK >= DEF`, dano `ATK + PWR - DEF`, crítico como auto-acerto + `PWR × 1.5`, sem ModNível, sem 5 faixas. **Não alinhado.**
- **ENE regen**: código usa valores antigos (14% Mago/Curandeiro) vs canônico v2.2 (18%). Ambos os modos afetados.
- **Boss**: multiplicadores `HP×2.5, ATK×1.5, DEF×1.5` canônicos não foram confirmados como implementados no runtime.
- **Passivas de classe**: Guerreiro −15% / Bárbaro −10% / Curandeiro −10% / Ladino +10% presentes em código (Wild e Group). A Decisão B foi resolvida: elas serão mantidas como camada canônica complementar, mas os valores atuais ainda exigem PR próprio de recalibração. Diretriz inicial: passivas percentuais devem começar em torno de 3% a 5%, com valores acima de 5% apenas sob condição/limitação forte.

---

## 2. Fontes analisadas

| Fonte | Tipo | Papel | Status |
|---|---|---|---|
| `docs/PATCH_CANONICO_COMBATE_V2.2.md` | Documentação | Autoridade máxima — fórmula canônica | Lido ✅ |
| `docs/AUDIT_GENERAL_RISKS_2026-05.md` | Diagnóstico | Inventário de riscos ativos | Lido ✅ |
| `docs/AUTHORITY_MAP.md` | Governança | Hierarquia de autoridade | Lido ✅ |
| `js/combat/wildCore.js` | Runtime | Funções puras Wild — hit check, dano, fuga, captura | Auditado ✅ |
| `js/combat/wildActions.js` | Runtime | Execução Wild Combat — turn completo, passivas | Auditado ✅ |
| `js/combat/groupCombatFormula.js` | Runtime | Fórmula canônica Group Combat | Auditado ✅ |
| `js/combat/groupActions.js` | Runtime | Execução Group Combat — attack, enemy turn | Auditado ✅ |
| `js/combat/groupCore.js` | Runtime | Helpers Group — turnOrder, isAlive, getBuffModifiers | Referenciado |
| `js/combat/bossSystem.js` | Runtime | Boss fases, AoE | Não auditado em detalhe |
| `tests/wildCore.test.js` | Teste | Cobertura: checkHit, calcDamage, getClassAdvantageModifiers | Verificado ✅ |
| `tests/groupCombatFormula.test.js` | Teste | Cobertura: getModNivel, classifyRC, resolveConfrontation, computeGroupDamage | Verificado ✅ |
| `tests/combatAudit.test.js` | Teste | Cobertura: fórmula de dano, hit/miss, TTK early game | Verificado ✅ |
| `tests/combatQuantitativeAudit.test.js` | Teste | Cobertura: simulações quantitativas Wild (old formula) | Verificado ✅ |
| `tests/basicCardAction.test.js` | Teste | Cobertura: executeBasicCardAction (delega para Wild) | Verificado ✅ |

---

## 3. Fórmula canônica documentada

### 3.1 Confronto e acerto (Patch v2.2 BLOCO 1)

**Fato documentado:**
```
RC = (d20A + ATK_atacante + BônusAção + ModNível + ModClasse + BuffOfensivo)
   − (d20D + ceil(DEF_defensor/2) + ModPosição + BuffDefensivo)
```

- 5 faixas:
  - RC ≤ −8 → Falha Total (×0)
  - −7 a −3 → Contato Neutralizado (×0, exceto regras especiais de nível)
  - −2 a +3 → Acerto Reduzido (×0.60, mín 1)
  - +4 a +10 → Acerto Normal (×1.00)
  - ≥ +11 → Acerto Forte (×1.25)

**Fato documentado — dados naturais:**
- d20A=20 → +4 RC adicional + +20% dano final (não é auto-acerto)
- d20A=1 → −6 RC (não é auto-miss obrigatório nos docs, mas RC cai muito)
- d20D=20 → +5 confronto defensivo (subtrai 5 do RC)
- d20D=1 → −4 confronto defensivo (soma 4 ao RC)

### 3.2 Fórmula de dano (Patch v2.2 BLOCO 1)

**Fato documentado:**
```
DanoBase = PWR_ação + ATK_atacante + ModNívelDano − floor(DEF_defensor/2)
DanoFinal = max(minDano, floor(DanoBase × mult_faixa))
```

### 3.3 ModNível (Patch v2.2 BLOCO 1 + COMBATE_FORMULA_V2.md §5.2)

Tabela discreta ±5 baseada na diferença `atkLvl − defLvl`:

| Diferença | ModNível |
|---|---|
| ≤ −20 | −5 |
| −15 a −19 | −4 |
| −10 a −14 | −3 |
| −6 a −9 | −2 |
| −3 a −5 | −1 |
| −2 a +2 | 0 |
| +3 a +5 | +1 |
| +6 a +9 | +2 |
| +10 a +14 | +3 |
| +15 a +19 | +4 |
| ≥ +20 | +5 |

### 3.4 Regras especiais de nível

**Fato documentado:**
- Superioridade real (atacante ≥10 níveis acima): Contato Neut. → Acerto Red., exceto nat. 1/20
- Dano ilusório (atacante ≥10 níveis abaixo): DanoFinal = 1 em Contato Neut. ou Acerto Red.
- Contato Neutralizado sem dano ilusório: DanoFinal = 0 (ou 1 conforme contexto — §1.3 ambíguo)

### 3.5 Crítico — ponto ambíguo (Patch v2.2 BLOCO 2)

**Decisão pendente do autor (🟡 DECISÃO NÃO-BLOQUEANTE D):**
> Nat 20 = +4 RC + +20% dano final. O sistema de bônus aleatório (item/moeda/poder×2) está marcado como "feature de UX opcional".

**Ponto ambíguo:** o Patch v2.2 congela nat 20 como `+4 RC + +20% dano` mas deixa em aberto se o bônus aleatório de UX é mantido. O código Wild usa `power × 1.5` (não é `+4 RC`). O código Group usa `+4 RC + +20% dano` (alinhado ao canônico).

### 3.6 ENE regen (Patch v2.2 BLOCO 4)

**Fato documentado (RESOLVIDO ✅):**

| Classe | pct | min |
|---|---|---|
| Mago | 0.18 | 3 |
| Curandeiro | 0.18 | 3 |
| Bardo | 0.14 | 2 |
| Caçador | 0.14 | 2 |
| Ladino | 0.14 | 2 |
| Animalista | 0.12 | 2 |
| Bárbaro | 0.12 | 2 |
| Guerreiro | 0.10 | 1 |

### 3.7 Boss (Patch v2.2 BLOCO 8)

**Fato documentado (RESOLVIDO ✅):**
```
HP_boss  = HP_padrão × 2.5
ATK_boss = ATK_padrão × 1.5
DEF_boss = DEF_padrão × 1.5
Imune a: STUN, ROOT
NÃO imune a: debuff de SPD
Fase 2 (HP ≤ 50%): ATK adicional +20%
```

### 3.8 Interpretações e pontos ambíguos

- **Contato Neutralizado sem regra de nível especial**: o Patch v2.2 §1.3 é ambíguo sobre o resultado padrão ser 0 ou 1 — a `groupCombatFormula.js` interpreta como: se atacante não está ≥10 lv abaixo, retorna 1 (minor contact).
- **Passivas de classe**: a Decisão B foi resolvida no Patch v2.2 — elas permanecem como regra canônica complementar, com exigência de passivas fracas, explícitas, previsíveis, documentadas e testáveis. A faixa inicial recomendada para percentuais é de 3% a 5%.
- **PWR básico e calibração do catálogo**: DECISÃO BLOQUEANTE A do Patch v2.2 — ainda não resolvida.

---

## 4. Fórmula real no runtime

| Sistema | Arquivo | Função | Fórmula/Regra observada | Usa Patch v2.2? | Risco |
|---|---|---|---|---|---|
| Wild — Hit Check | `wildCore.js` | `checkHit` | `d20 + ATK + classBonus(±2) + spdBonus(±1) >= DEF` (unilateral) | ❌ | Crítico |
| Wild — Hit Check bilateral | `wildCore.js` | `checkHitDiceClash` | `(d20A + ATK + spdBonus) >= (d20D + DEF)` (parcialmente bilateral, sem ModNível nem ceil(DEF/2)) | ❌ | Crítico |
| Wild — Hit exec | `wildActions.js` | `executeWildAttack` | Usa `checkHitDiceClash`; d20=1 auto-miss, d20=20 auto-hit | ❌ (d20=20 auto-hit, não +4 RC) | Alto |
| Wild — Dano | `wildCore.js` | `calcDamage` | `max(1, floor((ATK + PWR - DEF * defMult) * damageMult))` | ❌ (sem ModNível, sem `floor(DEF/2)`) | Crítico |
| Wild — Crítico | `wildActions.js` | `processCritical` / `executeWildAttack` | d20=20 → `power × 1.5` + auto-hit | ❌ (+20% dano, não +4 RC; e auto-hit, não apenas +4 RC) | Alto |
| Wild — ModNível | ausente | — | Não implementado | ❌ | Alto |
| Wild — SPD bônus | `wildCore.js` | `getSpdAdvantage` | ±1 se diff ≥ 3 (SPD_ADVANTAGE_THRESHOLD) | Extra-canônico (Fase 11.2) | Baixo |
| Group — RC | `groupCombatFormula.js` | `resolveConfrontation` | RC bilateral com `ceil(DEF/2)`, `ModNível`, `ModClasse`, `posMod` | ✅ | — |
| Group — Dano | `groupCombatFormula.js` | `computeGroupDamage` | `max(1, PWR+ATK+ModNível−floor(DEF/2)) × mult_faixa × damageMult` | ✅ | — |
| Group — 5 faixas | `groupCombatFormula.js` | `classifyRC` / `RC_MULTIPLIER` | Tabela completa: Falha/Contato/Reduzido/Normal/Forte | ✅ | — |
| Group — Crítico | `groupCombatFormula.js` | `resolveConfrontation` | d20A=20 → +4 RC + `critDmgBonus=0.20` | ✅ | — |
| Group — ModNível | `groupCombatFormula.js` | `getModNivel` | Tabela discreta ±5 | ✅ | — |
| Group — Posição | `groupActions.js` | `getTargetPosMod` | `posMod` 0/1/2 conforme posição defensiva | ✅ | — |
| ENE Regen — Wild | `wildActions.js` | `applyEneRegen` | Usa `eneRegenData` injetado de fora (valores em `combatQuantitativeAudit.test.js`: 14% Mago) | ❌ (14% vs 18% canônico) | Médio |
| ENE Regen — Group | `groupActions.js` | `helpers.applyEneRegen` | Delegado para `index.html` via `helpers` | Incerto (depende do valor em index.html) | Médio |
| Boss — HP × 2.5 | `groupActions.js` | não confirmado | Boss recebe `calibrateEnemyHP` (múltiplos inimigos), mas não HP×2.5 por ser boss | ❌ | Alto |
| Boss — Fase 2 | `bossSystem.js` | `checkBossPhaseTransition` | Verificado como existente | A verificar | — |
| Passivas de classe | `wildActions.js` / `groupActions.js` | `CLASS_COMBAT_PASSIVES` | Guerreiro−15%, Bárbaro−10%, Curandeiro−10%, Ladino+10% (Wild e Group) | Não documentado no v2.2 | Médio |
| Card — ataque básico | `wildCardActions.js` | `executeBasicCardAction` | Delega para `executeWildAttack` — usa fórmula Wild | ❌ (herda fórmula Wild) | Médio |
| Skill — execução Wild | `wildActions.js` | `executeWildSkill` / lógica inline | Usa `calcDamage` de wildCore — fórmula Wild | ❌ | Alto |

---

## 5. Divergências encontradas

| ID | Severidade | Área | Patch v2.2 diz | Runtime faz | Impacto | Confiança |
|---|---|---|---|---|---|---|
| DIV-01 | 🔴 Crítico | Wild — Hit Check | RC bilateral: `(d20A+ATK+ModNível+…) − (d20D+ceil(DEF/2)+…)` | `checkHitDiceClash`: `(d20A+ATK+spdBonus) >= (d20D+DEF)` — sem ModNível, sem ceil(DEF/2) | Altera resultado de acerto em todo Wild Combat | Alta |
| DIV-02 | 🔴 Crítico | Wild — Dano | `PWR + ATK + ModNível − floor(DEF/2)` × mult_faixa | `ATK + PWR - DEF` × damageMult — sem ModNível, sem `floor(DEF/2)`, sem 5 faixas | Altera dano final em todo Wild Combat; mais explosivo e menos sensível a nível | Alta |
| DIV-03 | 🔴 Crítico | Wild — ModNível | Tabela discreta ±5 deve ser aplicada em RC e dano | Não existe nenhuma tabela de ModNível em Wild Combat | Nível não influencia resultado Wild — combates de nível 1 vs nível 10 parecem iguais | Alta |
| DIV-04 | 🟠 Alto | Wild — Crítico | Nat 20 = +4 RC + +20% dano final (não auto-acerto) | d20=20 → auto-hit + `power × 1.5` (não é +4 RC; extra multiplicador de poder, não de dano final) | Crítico Wild é mecânica diferente do canônico — mais binário e explosivo | Alta |
| DIV-05 | 🟠 Alto | Wild — DEF mitigation | `floor(DEF/2)` na fórmula de dano | DEF integral subtraída diretamente (`ATK + PWR - DEF`) | DEF em Wild tem o dobro do peso que deveria ter no canônico | Alta |
| DIV-06 | 🟠 Alto | Wild — 5 faixas RC | 5 faixas: Falha/Contato/Reduzido/Normal/Forte com multiplicadores | Hit/miss binário (mais crítico) | Wild não tem multiplicadores de faixa — Acerto Forte (×1.25) não existe em Wild | Alta |
| DIV-07 | 🟡 Médio | ENE Regen | Mago/Curandeiro: 18%, min 3; Bardo/Caçador/Ladino: 14%, min 2; Animalista/Bárbaro: 12%, min 2 | Código (visto em `combatQuantitativeAudit.test.js`): Mago/Curandeiro: 14%, min 2; Bardo/Caçador/Ladino: 12%, min 2; Animalista/Bárbaro: 10%, min 1 | Skills mais lentas para todos — Mago e Curandeiro mais afetados | Alta (confirmado em docs) |
| DIV-08 | 🟡 Médio | Boss — HP×2.5/ATK×1.5/DEF×1.5 | Boss mínimo: HP×2.5, ATK×1.5, DEF×1.5 vs inimigo padrão do nível | `calibrateEnemyHP` aplica reduções para múltiplos inimigos, mas não multiplicadores de boss | Boss pode não ter stats canônicos | Média (bossSystem.js não foi auditado em detalhe) |
| DIV-09 | 🟡 Médio | Passivas de classe | Decisão B resolvida: passivas serão mantidas como camada canônica fraca/recalibrada | Runtime ainda usa valores antigos (Guerreiro−15%, Bárbaro−10%, Curandeiro−10%, Ladino+10%) em Wild e Group | Sem recalibração própria, os valores atuais podem gerar double-counting com ModClasse e impacto excessivo | Alta (recalibrar em PR próprio) |
| DIV-10 | 🔵 Baixo | Wild — d20=1 vs Patch | Patch v2.2: d20A=1 → −6 RC (o resultado pode ainda ser acerto em RC favorável) | Wild: d20=1 → sempre erra (auto-miss) | Divergência de regra: no canônico, d20=1 é penalidade severa de RC, não auto-miss | Média |
| DIV-11 | 🔵 Baixo | Wild — SPD bônus extra | Patch v2.2 não menciona bônus ±1 de SPD relativo no hit check | `getSpdAdvantage` → ±1 no `checkHit`/`checkHitDiceClash` (Fase 11.2) | Mecânica extra-canônica adicionada após o Patch v2.2 — não é divergência problemática, mas não tem autoridade canônica | Média |
| DIV-12 | 🔵 Baixo | Group vs Wild — consistência | Mesmo confronto deveria produzir resultados comparáveis entre modos | Wild usa fórmula v1; Group usa fórmula v2.2 — combates idênticos produzem resultados muito diferentes | Jogadores percebem experiências diferentes em Wild vs Group | Alta |

---

## 6. Testes de caracterização adicionados

Arquivo criado: `tests/combatFormulaAudit.test.js`

| Suite | O que caracteriza |
|---|---|
| `Wild calcDamage — caracterização` | Congela: base = ATK+PWR-DEF (sem ModNível, DEF integral), damageMult 1.0/1.10/0.90, mín 1 |
| `Wild checkHit — caracterização` | Congela: unilateral d20+ATK+classBonus>=DEF, spdBonus ±1, sem ceil(DEF/2) |
| `Wild checkHitDiceClash — caracterização` | Congela: bilateral parcial (d20A+ATK) vs (d20D+DEF), sem ModNível, sem ceil(DEF/2) |
| `Wild critico d20=20 — caracterização` | Congela: d20=20 → resolveD20Hit retorna isCrit=true, hit=true (auto-acerto) |
| `Wild d20=1 auto-miss — caracterização` | Congela: d20=1 → resolveD20Hit retorna isFail=true, hit=false (auto-miss) |
| `Group resolveConfrontation — RC canônico` | Congela: RC bilateral completo com ceil(DEF/2), ModNível, ModClasse, posMod |
| `Group computeGroupDamage — 5 faixas` | Congela: multiplicadores ×0/×0.60/×1.00/×1.25 por faixa; piso floor(DEF/2) |
| `Group crítico d20=20 — +4 RC + 20% dano` | Congela: nat 20 em Group = +4 RC + 0.20 critDmgBonus, NÃO auto-acerto |
| `Wild vs Group — mesmo cenário, resultados divergem` | Prova documentalmente a divergência DIV-01 a DIV-06 |
| `ENE regen — valores atuais vs canônico v2.2` | Congela os valores atuais (abaixo do canônico) como evidência de DIV-07 |

---

## 7. Próximos PRs recomendados

### PR imediato recomendado — Preparação para correção Wild
**Antes de qualquer PR de correção de fórmula**, o autor ainda deve responder à Decisão Bloqueante A do Patch v2.2:
- **Decisão A**: recalibrar catálogo para v2.1 ou manter atual + ajustar PWR?
- **Decisão B**: resolvida — passivas de classe serão mantidas como camada canônica fraca/recalibrada.

### PR de correção — Wild Combat (após decisão A)
**Escopo:** migrar Wild Combat para fórmula bilateral canônica sem remover o conceito de passivas.
- Implementar `resolveConfrontation` em Wild (ou reutilizar `groupCombatFormula.js`)
- Migrar `calcDamage` Wild para `PWR + ATK + ModNível − floor(DEF/2)` × mult_faixa
- Ajustar crítico: d20=20 → +4 RC + 20% dano (não auto-hit + power×1.5)
- Ajustar d20=1: penalidade de RC (não auto-miss)
- Preservar o conceito de passivas
- Recalibrar valores para impacto baixo, preferencialmente na faixa inicial de 3% a 5%
- Evitar bônus escondidos fortes
- Aplicar passivas de forma consistente entre Wild e Group
- Não transformar passivas em cartas neste momento
- Não remover passivas
- Não tratar os valores atuais do runtime como definitivos sem PR próprio de recalibração
- **RISCO**: alterar Wild sem Group pode aumentar divergência DIV-12 temporariamente

### PR de alinhamento Wild vs Group
**Escopo:** garantir que Wild e Group produzam resultados comparáveis no mesmo cenário.
- Depois de migrar Wild para fórmula bilateral
- Validar com testes de comparação cruzada

### PR de ENE regen
**Escopo:** atualizar `ENE_REGEN_BY_CLASS` para valores canônicos do Patch v2.2.
- Mago/Curandeiro: 14% → 18%, min 2 → min 3
- Bardo/Caçador/Ladino: 12% → 14%, min 2 (sem mudança de min)
- Animalista/Bárbaro: 10% → 12%, min 1 → min 2 (exceto Bárbaro que mantém)
- **RISCO BAIXO**: impacta ritmo de skill mas não a fórmula de dano/acerto

### PR de boss stats
**Escopo:** garantir que inimigos boss recebam multiplicadores canônicos (HP×2.5, ATK×1.5, DEF×1.5) na inicialização do encontro.
- Auditar `bossSystem.js` para confirmar estado atual
- Adicionar/corrigir multiplicadores se ausentes

### PR de atualização documental
**Escopo:** após correções de fórmula, atualizar `PATCH_CANONICO_COMBATE_V2.2.md` com status "implementado" para itens que eram apenas documentados.

### PR de simulação/balanceamento
**Escopo:** após migração de Wild para v2.2, rodar simulações para verificar se TTK (Time to Kill) e win rates continuam aceitáveis com os atributos atuais do catálogo (que não são os v2.1 canônicos).

---

## 8. Lista "não corrigir ainda"

Este PR diagnóstico **não alterou**:

- `js/combat/wildCore.js` — fórmula de dano e hit check mantidos como estavam
- `js/combat/wildActions.js` — execução Wild mantida como estava
- `js/combat/groupActions.js` — fórmula Group mantida (já alinhada)
- `js/combat/groupCombatFormula.js` — fórmula canônica Group mantida
- `js/combat/bossSystem.js` — não alterado (auditoria pendente)
- Qualquer dado JSON (`data/skills.json`, `data/monsters.json`, etc.)
- ENE regen em `index.html` — divergência documentada, não corrigida
- Passivas de classe — mantidas; valores atuais ainda não são definitivos sem PR próprio de recalibração
- PWR básico — aguarda Decisão A do Patch v2.2

---

## 9. Conclusão franca

| Área | Tipo do problema |
|---|---|
| Wild Combat — fórmula de dano e hit check | **Bug real de runtime**: código implementa fórmula v1 enquanto o Patch v2.2 mandatou migração para v2.2. A migração não foi feita. |
| Group Combat — fórmula | **Correto**: Group Combat já implementa a fórmula canônica v2.2 via `groupCombatFormula.js`. |
| ENE regen | **Divergência real documentada**: Patch v2.2 BLOCO 4 identificou os valores errados e prescreveu correção — código não foi atualizado. |
| Crítico Wild (power×1.5 vs +4 RC+20%) | **Divergência real + decisão de design pendente**: o modelo de crítico Wild diverge do canônico, mas há uma decisão de UX (bônus aleatório) ainda não resolvida pelo autor. |
| Boss multipliers | **Ausência de teste + incerteza**: não foi possível confirmar se HP×2.5/ATK×1.5/DEF×1.5 estão implementados. Auditoria de `bossSystem.js` é necessária. |
| Passivas de classe | **Divergência documental resolvida + recalibração pendente**: as passivas agora têm autoridade canônica, mas os valores atuais do runtime não devem ser tratados como definitivos sem PR próprio de recalibração. |
| d20=1 auto-miss vs −6 RC | **Divergência menor/intencional**: Wild simplifica como auto-miss. O canônico é penalidade de RC. Pode ser aceito como simplificação para o contexto do jogo. |
| SPD bônus ±1 extra-canônico | **Feature extra não documentada**: adicionada na Fase 11.2 após o Patch v2.2. Não é bug, mas não tem autoridade canônica. |

**Conclusão principal:** O principal problema é que a migração do Wild Combat para a fórmula bilateral canônica (Patch v2.2) nunca foi realizada. O Group Combat foi migrado com sucesso. A recomendação é: (1) o autor decide a Questão A do Patch v2.2; (2) o próximo PR Wild preserve o conceito de passivas, mas recalibre seus valores para impacto baixo; (3) ENE regen seja corrigido; (4) a comparação Wild vs Group seja validada com testes.

---

*Auditoria concluída em 2026-05-26. Sem alteração de fórmula neste PR.*
