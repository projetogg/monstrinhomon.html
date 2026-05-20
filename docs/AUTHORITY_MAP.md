# Monstrinhomon — Mapa de Autoridade

**Data:** 2026-05-19  
**Status:** Canônico para a Fase 0 da Card Layer.  
**Relacionado:** `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`, `docs/AUDIT_FASE_0_RESPOSTAS.md`, `docs/PENDENCIAS_TECNICAS.md`.

Este documento define quais arquivos vencem em caso de conflito entre runtime, design, documentos antigos e legado.

---

## 1. Regra geral de conflito

```text
Runtime vence design.
Design vence legado.
Card Layer nunca vence mecânica.
```

A Card Layer é uma camada visual/organizacional. Ela não decide dano, custo, alvo, fórmula, progressão, energia, captura, vantagem de classe ou qualquer efeito mecânico.

---

## 2. Autoridades por domínio

| Domínio | Autoridade | Status | Observações |
|---|---|---|---|
| Fórmula de combate, faixas, ModNível | `docs/PATCH_CANONICO_COMBATE_V2.2.md` | Autoridade máxima | Não alterar pela Card Layer. |
| Mecânica runtime de skills | `data/skills.json` via `js/data/skillsLoader.js` | Confirmado | Fonte canônica de skills usadas em combate. |
| Pipeline runtime de skills | `getMonsterSkills` em `index.html` linhas 4475–4575 | Confirmado | Fluxo: `SKILL_DEFS` → `KitSwap.getEffectiveSkills` → `normalize`. |
| Catálogo de design de skills | `design/canon/skills.json` | Referência de design | Não é fonte mecânica direta da UI de combate. |
| Quantidade de slots por nível | `js/canon/slotUnlocks.js` + `design/canon/level_progression.json` | Confirmado | `getUnlockedSlotsForLevel(level)` retorna número de slots. |
| Upgrades intermediários | `design/canon/level_progression.json` | Confirmado | Lv 10 e Lv 22 atualizam estágios, não liberam slot novo. |
| Variações por espécie | `js/canon/kitSwap.js` | Confirmado | Aplicado em criação de instância, `getMonsterSkills`, level-up e retroativo. |
| Marcador de skill swapada | Campo `_kitSwapId` | Confirmado | Usar só para diagnóstico/telemetria, não para reaplicar kitSwap. |
| Card Layer visual | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` | Canônico para Fase 1 | Camada visual acima do runtime. |
| CSVs raiz | Legado inerte | Confirmado | Referência histórica; não carregados no runtime de combate/skills. |
| `GAME_RULES.md` §3–§10 | Legado revogado | Já marcado no arquivo | Não usar como fonte atual quando houver doc canônico mais recente. |
| `AGENTS.md` | Suplementar | Precisa atualização | Deve apontar para docs v2 atuais. |
| `PROXIMOS_PASSOS.md` | Pré-v2.x | Legado | Substituído por aviso e cópia em `docs/legacy/`. |

---

## 3. Autoridade específica da Card Layer

A Card Layer deve usar o seguinte fluxo de autoridade:

1. **Skill executada em combate:** objeto retornado pelo runtime (`getMonsterSkills`).
2. **Mecânica da skill:** `data/skills.json`.
3. **Representação visual da skill:** `data/cards.json` futuro, conforme `CARD_LAYER_ARCHITECTURE_v0.1.2.md`.
4. **Fallback visual:** placeholder da Card Layer, sem alteração mecânica.

---

## 4. O que a Card Layer não pode fazer

- Não chamar `applyKitSwaps`.
- Não alterar `data/skills.json`.
- Não duplicar `power`, `energy_cost`, `accuracy`, `target`, `duration`, `range`, `effect` ou campos equivalentes.
- Não decidir qual `stageIndex` está ativo.
- Não criar deck, mão, compra, descarte ou ciclo.
- Não renderizar placeholder de slot 4 em produção.

---

## 5. Pendências associadas

Ver `docs/PENDENCIAS_TECNICAS.md`:

- PT-001 — Slot 4 base de classes.
- PT-002 — Mapeamento `groupKey → slot`.
- PT-003 — CSVs raiz como legado inerte.
- PT-004 — Drift documental em `AGENTS.md` e `PROXIMOS_PASSOS.md`.
