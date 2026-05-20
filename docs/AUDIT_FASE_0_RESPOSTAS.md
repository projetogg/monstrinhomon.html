# Card Layer — Fechamento da Fase 0

**Data:** 2026-05-19  
**Status:** Análise final da Fase 0. Bloqueantes resolvidos com evidência.  
**Anexo:** `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`.

Convenção: `[FATO]` `[INFERÊNCIA]` `[HIPÓTESE]` `[RISCO]` `[RECOMENDAÇÃO]` `[DECISÃO PENDENTE]`

---

# 1. Veredito pós-grep

[RECOMENDAÇÃO] **Fase 0 pode encerrar.** As decisões bloqueantes D-A, D-B, D-C, D-G e D-H têm agora status resolvido ou parcial com caminho claro.

[RECOMENDAÇÃO] **Fase 1 pode começar após commit dos documentos finais**:

- `docs/AUTHORITY_MAP.md`
- `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`
- `docs/AUDIT_FASE_0_RESPOSTAS.md`
- `docs/PENDENCIAS_TECNICAS.md`

[FATO] Os outputs confirmam três pontos centrais:

1. Runtime já entrega skills **efetivas para exibição** via `KitSwap.getEffectiveSkills` dentro de `getMonsterSkills`. A normalização operacional de combate ocorre depois, em `resolveMonsterSkills()`/`normalizeSkill`. A Card Layer opera em modo passivo e consome a lista efetiva preservando `groupKey`/`stageIndex`.
2. Slot 4 base do Guerreiro não existe em `data/skills.json`. Fase 1 confirma 3 Cards, não 4.
3. CSVs são referência histórica em comentários, não loader ativo de combate/skills.

[OPINIÃO DE DESIGN] A descoberta mais importante é que o `cardResolver` não precisa ser um resolvedor mecânico; ele deve ser adaptador fino sobre o runtime atual de skills efetivas para apresentação.

---

# 2. Tabela de evidências por comando

| Comando | Arquivos / linhas | Fato extraído | Decisão impactada |
|---|---|---|---|
| 1 — kitSwap | `js/canon/kitSwap.js` 6–89 | kitSwap é módulo mecânico ativo com funções públicas. | D-C |
| 1 — kitSwap | `index.html` 4501–4506 | `getMonsterSkills` chama `KitSwap.getEffectiveSkills`. | D-C, K-condicional |
| 1 — kitSwap | `index.html` 3949–3965 | `createInstance` aplica `KitSwap.applyKitSwaps`. | D-C |
| 1 — kitSwap | `index.html` 4566–4575 | Marcador `_kitSwapId` confirmado. | D-C |
| 2 — skills runtime | `js/data/skillsLoader.js` 240–261 | `buildSkillDefs()` monta `SKILL_DEFS = { [class]: { [groupKey]: [stage0, ...] } }`. | D-H, schema |
| 2 — skills runtime | `index.html` 1931–1937 | `SKILL_DEFS` global + `SKILL_DEFS_FALLBACK`. | fallback |
| 2 — skills runtime | `index.html` 2325–2333 | Comentário confirma: `SKILL_DEFS` é runtime canônico; `SKILLS_CATALOG` é referência. | D-H, AUTHORITY_MAP |
| 2 — skills runtime | `index.html` 4520–4536 | Pipeline de exibição: `getMonsterSkills → SKILL_DEFS → KitSwap.getEffectiveSkills`; normalização de combate fica em `resolveMonsterSkills()`/`normalizeSkill`. | arquitetura |
| 2 — skills runtime | `index.html` 4565 | `_source = skill_defs` ou `kit_swap`. | diagnóstico |
| 3 — slot 4 | `data/skills.json` | `(sem matches)` para assinatura/slot 4. | D-A |
| 4 — CSV legado | `dropSystem.js`, `encounterPool.js`, `questSystem.js`, `index.html` | CSVs aparecem como origem histórica/documental. | D-G |
| 5 — progressão | `js/data/skillsLoader.js` 257–261 | `groupKey` e `stageIndex` são canônicos. | D-H, schema |
| 5 — progressão | `slotUnlocks.js`, `xpActions.js`, `index.html`, testes | Slot unlocks são bem definidos; não há mapeamento `groupKey → slot`. | D-B |

---

# 3. Decisões bloqueantes

## D-A — Existe slot 4/assinatura do Guerreiro no runtime?

**Status:** [RESOLVIDA — NEGATIVA]

**Evidência:** grep em `data/skills.json` para `signature|assinat|slot.*4|slot_4|assinatura` retornou `(sem matches)`.

**Conclusão:** Guerreiro tem 3 skills base em runtime: `Golpe de Espada`, `Escudo`, `Provocar`. Slot 4 mecânico só aparece via kitSwap de espécies específicas.

**Impacto:** Fase 1 cria 3 Cards. Não criar Card pública nem placeholder de slot 4 em produção.

---

## D-B — Existe mapeamento explícito `groupKey → slot`?

**Status:** [PARCIAL]

**Evidência:** `skillsLoader.js` organiza por `class → groupKey → stageIndex`; `slotUnlocks.js` retorna quantidade de slots, não mapeamento.

**Conclusão:** Não há mapeamento canônico no runtime.

**Impacto:** Card Layer usa `display_slot` manual, apenas como metadado de UI. Não é mecânica.

---

## D-C — Runtime/UI já chama `applyKitSwaps`?

**Status:** [RESOLVIDA — POSITIVA]

**Evidência:** `getMonsterSkills` chama `KitSwap.getEffectiveSkills`; `createInstance` aplica `KitSwap.applyKitSwaps`; `_kitSwapId` confirmado.

**Conclusão:** Runtime já canaliza skills por kitSwap antes da Card Layer.

**Impacto:** `cardResolver` opera em modo passivo absoluto. Card Layer nunca chama `applyKitSwaps`.

---

## D-G — Algum CSV legado ainda é carregado no runtime?

**Status:** [RESOLVIDA — NEGATIVA]

**Evidência:** referências a CSV aparecem como comentários/origem histórica. `index.html` declara que catálogo baseado em `HABILIDADES.csv` não é usado diretamente no combate.

**Conclusão:** CSVs são legado inerte para o escopo da Card Layer.

**Impacto:** Card Layer mira `data/skills.json` sem ambiguidade.

---

## D-H — Como a UI/runtime resolve a skill ativa por nível/stageIndex?

**Status:** [RESOLVIDA — POSITIVA]

**Evidência:** Pipeline de apresentação: `getMonsterSkills → SKILL_DEFS → KitSwap.getEffectiveSkills`. A normalização operacional para combate ocorre em `resolveMonsterSkills()`/`normalizeSkill`, não dentro de `getMonsterSkills`.

**Conclusão:** Runtime já entrega uma lista efetiva de skills para o monstro/nível atual, preservando `groupKey` e `stageIndex` para uso visual. A forma normalizada de combate é responsabilidade de outro ponto do runtime.

**Impacto:** Card Layer não decide stage ativo; usa `skill.stageIndex` da lista efetiva retornada por `getMonsterSkills` e não consome a forma normalizada de combate como fonte principal de Card.

---

# 4. Arquitetura final recomendada

```text
[runtime atual — fonte para Card Layer]
getMonsterSkills(monster)
  → SKILL_DEFS[class][groupKey]
  → KitSwap.getEffectiveSkills(instance, skills)
  → retorna skills efetivas para apresentação, preservando groupKey/stageIndex

[runtime atual — execução de combate]
resolveMonsterSkills(...)
  → normalizeSkill(...)
  → retorna forma operacional normalizada para cálculo/execução de combate

[Card Layer]
cardResolver.resolveCardsForMonster(monster)
  → chama getMonsterSkills(monster)
  → chama cardLayer.findCardForSkill(skill)
  → retorna { card, stage, skill }

cardLayer.findCardForSkill(skill)
  → lookup por class + groupKey
  → stage por skill.stageIndex

cardRenderer.renderCard(card, stage, runtimeContext)
  → render visual puro
```

## Regra K definitiva

- K1. Card Layer opera em modo passivo absoluto.
- K2. `cardLayer.findCardForSkill()` nunca chama `applyKitSwaps`.
- K3. `cardResolver.resolveCardsForMonster()` nunca chama `applyKitSwaps`.
- K4. `_kitSwapId` pode ser usado para diagnóstico/telemetria.
- K5. Skill sem `_kitSwapId` é legítima; não tentar re-swap.

---

# 5. Piloto Guerreiro

| id | groupKey | display_slot | category_visual | Status |
|---|---|---:|---|---|
| `warrior_golpe_de_espada_card` | `Golpe de Espada` | 1 | `ataque` | Confirmada |
| `warrior_escudo_card` | `Escudo` | 2 | `defesa` | Confirmada |
| `warrior_provocar_card` | `Provocar` | 3 | `controle` | Confirmada |
| — | slot 4 | — | — | Não criar |

## Slot 4

- Não criar entrada em `cards.json`.
- Não mostrar placeholder em produção.
- Registrar PT-001 em `docs/PENDENCIAS_TECNICAS.md`.
- Placeholder só em dev/test com `cardLayer.devShowMissingSlots: true`.

---

# 6. Schema final recomendado

Ver `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`.

Pontos obrigatórios:

- `groupKey` legível real.
- `default_stageIndex`, não `default_tier`.
- `stages`, não `tiers`.
- `runtime_stageIndex` e `runtime_tier` coexistem.
- `runtime_tier` é metadado, não chave principal.
- Cards não contêm campos mecânicos.

---

# 7. Documentos a produzir

- `docs/AUTHORITY_MAP.md`
- `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`
- `docs/AUDIT_FASE_0_RESPOSTAS.md`
- `docs/PENDENCIAS_TECNICAS.md`

---

# 8. Riscos remanescentes

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---:|---|
| `Provocar` como `controle` confunde criança | Baixo | Média | Testar em playtest; mudar para `suporte` se necessário. |
| `groupKey` digitado errado | Médio | Alta sem CI | Validação CI exige match exato. |
| Skill futura sem Card | Médio | Alta | CI + log de unmapped skills. |
| Card Layer inicializa antes de `SKILL_DEFS` | Alto | Média | Usar fallback runtime e aguardar estado pronto. |
| Slot 4 placeholder vaza em produção | Alto | Baixa | `devShowMissingSlots: false` por padrão + teste E2E. |
| Card Layer obsoleta após nova skill | Médio | Alta | PR template exige atualização conjunta. |

---

# 9. Próximo passo exato

1. Commitar os 4 documentos da Fase 0.
2. Atualizar `AGENTS.md` com aviso e 8 classes.
3. Marcar `PROXIMOS_PASSOS.md` como legado e preservar cópia em `docs/legacy/`.
4. Abrir branch `feature/card-layer-fase-1`.
5. Implementar apenas os 3 Cards do Guerreiro com feature flag desligada por padrão.

---

# 10. Checagem final

- groupKey legível usado.
- `stageIndex` separado de `tier`.
- Slot 4 tratado como pendente.
- `cards.json` sem mecânica duplicada.
- D-A, D-B, D-C, D-G, D-H resolvidas.
- Sem deck/mão/ciclo.
- Próximo passo verificável definido.

**Fim da análise. Fase 0 pode encerrar.**
