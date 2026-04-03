# Monstrinhomon — Plano de Implementação

## Fase 1 ✅
- Carregar `combat_rules.json`
- Carregar `classes.json`
- Carregar `skills.json`
- Implementar resolução básica 1v1
- Implementar wild e trainer 1v1
- Implementar 4 classes do MVP

## Fase 2 ✅
- Integrar `species.json`
- Integrar `evolution_lines.json`
- Aplicar offsets de espécie sobre chassis de classe
- Validar progressão até nível 30

## Fase 3 ✅ (species bridge + offsets)
- `speciesBridge.js` — mapeamento templateId → canonSpeciesId (12 mapeamentos)
- `canonLoader.js` — carrega 6 JSONs em paralelo
- `createMonsterInstanceFromTemplate()` aplica offsets canônicos
- Instâncias ganham `canonSpeciesId`, `canonAppliedOffsets`

## Fase 4 ✅ (passivas canônicas)
- `speciesPassives.js` — 4 passivas: shieldhorn, emberfang, moonquill, floracura
- Passivas integradas em `wildActions.js` em 4 pontos
- Tracking de estado (`shieldhornBlockedThisTurn`, `floracuraHealUsed`)

## Fase 5 ✅ (slot unlocks)
- `slotUnlocks.js` — `getUnlockedSlotsForLevel()` via `level_progression.json`
- `_resolveUnlockedSlots()` em `index.html` com fallback
- `levelUpMonster` atualiza `unlockedSkillSlots`

## Fase 6 ✅ (kit_swap — primeira camada)
- `kitSwap.js` — `KIT_SWAP_TABLE` para 4 espécies (slots 1 e 4)
- `applyKitSwaps(instance, skills)` aplicado em `createMonsterInstanceFromTemplate`
- Metadados: `appliedKitSwaps`, `blockedKitSwaps` nas instâncias
- Auditada e normalizada (Fase 6.1): `moonquill` custo 3→4

## Fase 7 ✅ (promoção de kit_swap — metadados)
- `KIT_SWAP_PROMOTION_TABLE` — 4 promoções I→II (shieldhorn L20, outros L50)
- `promoteKitSwaps(instance)` integrado em `levelUpMonster()`
- Metadados: `promotedKitSwaps`, `blockedKitSwapPromotions` nas instâncias
- **NOTA:** após Fase 7, a promoção existia apenas como metadado — não afetava o runtime

## Fase 7.1 ✅ (promoção efetiva no runtime)
- `getEffectiveSkills(instance, baseSkills)` em `kitSwap.js`
  - Aplica swap base (Fase 6) e promoção (Fase 7) na ordem correta
  - Fallback seguro para instâncias sem `canonSpeciesId`
- `getMonsterSkills(monster)` em `index.html` agora chama `getEffectiveSkills`
  - Kit efetivo usado em combate, UI e progressão
  - Fallback: sem `window.KitSwap` → comportamento legado preservado
- Regra de progressão consolidada:
  - Slot unlock: por nível (L1/5/15/30) via `level_progression.json`
  - Promoção de swap: por nível (L20/50) — mesma escala, marco mais alto
  - Divergência aceitável: evolução de criatura (por stage) usa clock distinto;
    promoção de swap usa level para manter independência da evolução automática

## Em aberto / próximas fases
- Integrar frente/meio/trás (planejado Fase 3 original)
- Integrar group battles (planejado Fase 3 original)
- Expandir bridge para novas espécies (pós Fase 7.1)
- Segunda camada de swap por espécie (pós consolidação)
- Boss fights e ajustes finos (Fase 4 original)