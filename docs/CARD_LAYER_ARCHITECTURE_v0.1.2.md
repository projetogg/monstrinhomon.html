# CARD_LAYER_ARCHITECTURE_v0.1.2

**Status:** Aprovado para implementação Fase 1  
**Versão:** 0.1.2  
**Data:** 2026-05-19  
**Substitui:** `CARD_LAYER_ARCHITECTURE_v0.1.1.md`  
**Convive com:** `docs/PATCH_CANONICO_COMBATE_V2.2.md`, `docs/AUTHORITY_MAP.md`, `docs/AUDIT_FASE_0_RESPOSTAS.md`, `docs/PENDENCIAS_TECNICAS.md`

---

## Changelog v0.1.1 → v0.1.2

1. **K-condicional definitiva:** confirmado por evidência que o runtime já resolve `kitSwap`. Card Layer opera em modo passivo absoluto.
2. **Slot 4 do Guerreiro:** confirmado que slot 4 base não existe em `data/skills.json`. Fase 1 oficialmente tem 3 Cards, não 4.
3. **Métrica UX Fase 1:** ajustada para identificação por ícone + layout, não por arte autoral.
4. **Pipeline runtime canonizado:** `getMonsterSkills → SKILL_DEFS → KitSwap.getEffectiveSkills → normalize`.
5. **Schema final:** `default_stageIndex + stages`, não `default_tier + tiers`.
6. **groupKey legível:** exemplo correto: `Golpe de Espada`, não `GOLPE_DE_ESPADA`.
7. **source_skill_id por entrada de stage**, não na raiz da Card.
8. **display_slot manual e opcional**, não derivado do runtime.
9. **3 módulos separados:** `cardResolver`, `cardLayer`, `cardRenderer`.
10. **Validação CI:** 12 regras explícitas + campos proibidos.

---

## Convenção

`[FATO]` `[INFERÊNCIA]` `[HIPÓTESE]` `[OPINIÃO DE DESIGN]` `[RISCO]` `[DECISÃO PENDENTE]`

---

# 1. Objetivo e escopo

## 1.1 O que a Card Layer faz

- Apresenta as habilidades existentes, vindas das skills runtime de `data/skills.json`, como cartas visuais.
- Adiciona texto infantil, ícone, categoria visual, arte e fallback à apresentação.
- Permite identificação rápida da habilidade pela criança via ícone + layout.

## 1.2 O que a Card Layer não faz

- Não altera mecânica de combate, fórmula, dano, custo, alcance, alvo ou efeito.
- Não substitui `data/skills.json` como fonte mecânica.
- Não chama `applyKitSwaps`; o runtime já resolve kitSwap antes.
- Não implementa deck, mão, ciclo, compra ou descarte.
- Não implementa Talent Cards na Fase 1.
- Não implementa Signature Cards mecânicas.
- Não decide ordem de skills, qual está ativa, ou progressão por nível.
- Não mostra placeholder de slot 4 em UI de produção.
- Não introduz arte autoral definitiva na Fase 1.

---

# 2. Mapa de autoridade

Ver `docs/AUTHORITY_MAP.md` para versão canônica. Resumo:

| Domínio | Autoridade |
|---|---|
| Fórmula de combate | `docs/PATCH_CANONICO_COMBATE_V2.2.md` |
| Mecânica runtime de skills | `data/skills.json` via `js/data/skillsLoader.js` |
| Pipeline de resolução de skills | `getMonsterSkills` em `index.html` |
| Quantidade de slots por nível | `js/canon/slotUnlocks.js` |
| Variações por espécie | `js/canon/kitSwap.js` |
| Card Layer visual | Este documento |
| CSVs raiz | Legado inerte |

Regra de conflito:

```text
runtime vence design; design vence legado; Card Layer nunca vence mecânica.
```

---

# 3. Tipologia

## 3.1 Skill canônica

Entidade em `data/skills.json`. Define mecânica pura. Intocada pela Card Layer.

Campos relevantes: `id`, `name`, `class`, `groupKey`, `stageIndex`, `tier`, `type`, `category`, `power`, `accuracy`, `energy_cost`, `target`, `desc`.

Exemplo confirmado:

```text
id: GOLPE_DE_ESPADA_0
class: Guerreiro
groupKey: Golpe de Espada
stageIndex: 0
tier: 1
```

## 3.2 Card skill-type — Fase 1

Entidade futura em `data/cards.json`. Representação visual de um par `class + groupKey`. Mapeia `stageIndex → conteúdo visual`. Não contém mecânica.

## 3.3 Signature Card — Fase 2

Entidade futura em `data/signature_cards.json`. Substitui visualmente Card padrão para espécie específica. Fase 2 é visual-only.

## 3.4 Talent Card — Fase 3 ou posterior

Entidade futura em `data/talent_cards.json`, equipável entre batalhas, se playtest justificar. Não faz parte da Fase 1.

---

# 4. Arquitetura modular

## 4.1 Pipeline integrado

```text
[Runtime existente — intocado]
getMonsterSkills(monster)
  → SKILL_DEFS[class][groupKey]
  → KitSwap.getEffectiveSkills()
  → normalize()
  → retorna [skill1, skill2, ...]

[Card Layer — nova]
cardResolver.resolveCardsForMonster(monster)
  → chama getMonsterSkills(monster)
  → para cada skill, chama cardLayer.findCardForSkill(skill)
  → retorna [{ card, stage, skill }]

cardLayer.findCardForSkill(skill)
  → lookup em cards.json por (skill.class, skill.groupKey)
  → seleciona stage por skill.stageIndex
  → retorna { card, stage } ou fallback

cardRenderer.renderCard(card, stage, runtimeContext)
  → renderiza DOM
  → consulta runtimeContext apenas para estado visual
```

## 4.2 `cardResolver.js` — adaptador fino

Responsabilidade: traduzir o output de `getMonsterSkills(monster)` em estrutura consumível pelo `cardRenderer`.

Faz:

- Chama `getMonsterSkills(monster)`.
- Para cada skill, delega a `cardLayer.findCardForSkill(skill)`.
- Empacota resultado.

Nunca faz:

- Chamar `applyKitSwaps`.
- Modificar skills.
- Decidir qual `stageIndex` está ativo.
- Calcular dano, custo, alvo ou efeito.

## 4.3 `cardLayer.js` — apresentação pura

Responsabilidade: dado uma skill resolvida, encontrar a Card visual correspondente.

Faz:

- Lookup em `cards.json` por `(class, groupKey)`.
- Seleção de stage por `skill.stageIndex`.
- Aplicação de fallback visual se mapeamento ausente.

Nunca faz:

- Chamar `applyKitSwaps`.
- Modificar skill.
- Decidir qual skill mostrar.

## 4.4 `cardRenderer.js` — render puro

Responsabilidade: transformar `{ card, stage, skill, runtimeContext }` em DOM.

Faz:

- Renderiza HTML/elementos.
- Aplica estado visual, como desabilitado por ENE insuficiente, usando `runtimeContext`.
- Mostra título, texto infantil, ícone, arte.

Nunca faz:

- Decidir skill.
- Executar combate.
- Consultar `cards.json` diretamente.

## 4.5 Feature flag

```json
{
  "cardLayer": {
    "enabled": false,
    "pilotClasses": ["Guerreiro"],
    "fallbackToSkillUI": true,
    "logUnmappedSkills": true,
    "devShowMissingSlots": false
  }
}
```

Defaults conservadores: tudo desligado em produção até validação.

## 4.6 Fallback

| Situação | Comportamento |
|---|---|
| skill com `class + groupKey` conhecido e `stageIndex` conhecido | Render normal |
| `stageIndex` fora do mapa da Card | Usa `default_stageIndex` + log warning |
| `class + groupKey` desconhecido | Placeholder genérico + log warning |
| skill com `_kitSwapId` sem Card mapeada | Placeholder genérico + log warning |
| `cardLayer.enabled = false` | UI antiga |
| Erro JS em módulo da Card Layer | try/catch → UI antiga + log error |
| `getMonsterSkills(monster)` retorna vazio | Mensagem “Nenhuma habilidade disponível” |

---

# 5. Schema de `cards.json`

## 5.1 Estrutura

```json
{
  "$schema": "schemas/card.schema.json",
  "version": "0.1.2",
  "cards": [
    {
      "id": "warrior_golpe_de_espada_card",
      "card_type": "skill",
      "class": "Guerreiro",
      "groupKey": "Golpe de Espada",
      "display_slot": 1,
      "category_visual": "ataque",
      "icon_key": "icon_sword",
      "fallback_art_ref": "assets/cards/_fallback/warrior_attack.svg",
      "tags": ["fisico", "corpo_a_corpo"],
      "default_stageIndex": 0,
      "stages": {
        "0": {
          "source_skill_id": "GOLPE_DE_ESPADA_0",
          "runtime_stageIndex": 0,
          "runtime_tier": 1,
          "title": "Golpe de Espada I",
          "text_child": "Ataque um inimigo pertinho.",
          "text_technical": "Mecânica em data/skills.json#GOLPE_DE_ESPADA_0.",
          "art_ref": "assets/cards/warrior_golpe_de_espada_0.svg"
        },
        "1": {
          "source_skill_id": "GOLPE_DE_ESPADA_1",
          "runtime_stageIndex": 1,
          "runtime_tier": 2,
          "title": "Golpe de Espada II",
          "text_child": "Ataque com mais força de perto.",
          "text_technical": "Mecânica em data/skills.json#GOLPE_DE_ESPADA_1.",
          "art_ref": "assets/cards/warrior_golpe_de_espada_1.svg"
        },
        "2": {
          "source_skill_id": "GOLPE_DE_ESPADA_2",
          "runtime_stageIndex": 2,
          "runtime_tier": 3,
          "title": "Golpe de Espada III",
          "text_child": "Faça um golpe poderoso de perto.",
          "text_technical": "Mecânica em data/skills.json#GOLPE_DE_ESPADA_2.",
          "art_ref": "assets/cards/warrior_golpe_de_espada_2.svg"
        }
      }
    }
  ]
}
```

## 5.2 Campos obrigatórios da Card

| Campo | Tipo | Notas |
|---|---|---|
| `id` | string | Padrão `<class>_<group>_card` |
| `card_type` | const `skill` | Fase 1 |
| `class` | string | Casa com `skill.class` |
| `groupKey` | string | Casa com `skill.groupKey` |
| `category_visual` | enum | `ataque/defesa/suporte/movimento/preparacao/utilidade/controle/cura` |
| `icon_key` | string | Identificador padronizado |
| `fallback_art_ref` | string | Caminho de placeholder |
| `default_stageIndex` | integer | Stage default |
| `stages` | object | Chaveado por string do `stageIndex` |

## 5.3 Campos por entrada de `stages[N]`

| Campo | Notas |
|---|---|
| `source_skill_id` | ID literal do runtime |
| `runtime_stageIndex` | 0-indexed, idêntico ao runtime |
| `runtime_tier` | 1-indexed, idêntico ao runtime |
| `title` | ≤ 30 chars |
| `text_child` | ≤ 140 chars |
| `text_technical` | “Mecânica em data/skills.json#<id>” |
| `art_ref` | Caminho de arte; placeholder OK |

## 5.4 Campos opcionais

| Campo | Notas |
|---|---|
| `display_slot` | Integer 1–4, ordenação UI |
| `tags` | string[] |
| `notes` | comentário interno |

## 5.5 Campos proibidos

O validador CI deve rejeitar:

- `power`, `pwr`, `damage`
- `energy_cost`, `cost`, `ene_cost`
- `accuracy`, `precision`, `hit_rate`
- `target`, `alvo`
- `duration`, `dur`
- `effect`, `effect_summary`, `status_effect`
- `range`, `alcance`

---

# 6. Regra K-condicional definitiva

[FATO] Runtime já chama `applyKitSwaps`/`getEffectiveSkills` antes da camada de apresentação.

Regras finais:

- **K1.** Card Layer opera em modo passivo absoluto. Runtime resolve kitSwap; Card Layer consome.
- **K2.** `cardLayer.findCardForSkill()` nunca chama `applyKitSwaps`.
- **K3.** `cardResolver.resolveCardsForMonster()` nunca chama `applyKitSwaps`; apenas chama `getMonsterSkills()`.
- **K4.** `_kitSwapId` pode ser lido para diagnóstico/telemetria, nunca para decisão de re-swap.
- **K5.** Skill sem `_kitSwapId` é legítima. Não tentar re-swap.

---

# 7. Integração com canônicos

## 7.1 Com `slotUnlocks.js`

`cardResolver` não precisa chamar `getUnlockedSlotsForLevel` diretamente. O array retornado por `getMonsterSkills(monster)` já deve conter apenas skills desbloqueadas para o nível atual.

## 7.2 Com `level_progression.json`

`cardResolver` não consulta diretamente. Runtime já interpretou upgrades e refletiu no `stageIndex` da skill retornada.

## 7.3 Com `kitSwap.js`

Card Layer não chama kitSwap. Pode ler `skill._kitSwapId` apenas para log/telemetria.

---

# 8. Validações CI — Fase 1

1. `cards.json` é JSON válido.
2. IDs únicos.
3. Cada `stages[N].source_skill_id` existe em `data/skills.json`.
4. `runtime_stageIndex` casa com `stageIndex` da skill referenciada.
5. `runtime_tier` casa com `tier` da skill referenciada.
6. `class` da Card casa com `class` das skills referenciadas.
7. `groupKey` da Card casa exatamente com `groupKey` das skills referenciadas.
8. `default_stageIndex` existe em `stages`.
9. `text_child` ≤ 140 caracteres.
10. `category_visual` está no enum permitido.
11. Card não contém campos proibidos.
12. `fallback_art_ref` definido.

---

# 9. Plano de fases

## 9.1 Fase 0 — Encerrada

Documentos:

- `docs/AUTHORITY_MAP.md`
- `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`
- `docs/AUDIT_FASE_0_RESPOSTAS.md`
- `docs/PENDENCIAS_TECNICAS.md`

## 9.2 Fase 1 — Piloto Guerreiro

Entregáveis:

- `data/cards.json` com 3 Cards do Guerreiro.
- `schemas/card.schema.json`.
- `js/cards/cardResolver.js`.
- `js/cards/cardLayer.js`.
- `js/cards/cardRenderer.js`.
- Feature flag.
- Validador CI.
- Testes unitários + regressão.
- UI piloto.

Cards confirmadas:

| id | groupKey | display_slot | category_visual |
|---|---|---:|---|
| `warrior_golpe_de_espada_card` | `Golpe de Espada` | 1 | `ataque` |
| `warrior_escudo_card` | `Escudo` | 2 | `defesa` |
| `warrior_provocar_card` | `Provocar` | 3 | `controle` |

Slot 4: não criar Card pública na Fase 1.

## 9.3 Fase 2 — Signature Cards visual-only

Só depois de Fase 1 estável por pelo menos 2 semanas.

## 9.4 Fase 3 — Expansão controlada

Expandir para 8 classes após validação da Fase 2.

## 9.5 Fora de escopo

- Deck, mão, ciclo, compra, descarte.
- Talent Cards.
- Signature Cards mecânicas.
- Modificação de combate, fórmula, atributos, posicionamento, ENE, vantagens, captura.
- Modificação de `data/skills.json`.

---

# 10. Decisões aprovadas

| Decisão | Status |
|---|---|
| Arquitetura D — Cartificação Incremental | Aprovada |
| Stages no mesmo registro de Card | Aprovada |
| Signature visual-only na Fase 2 | Aprovada |
| `HABILIDADES_POR_CLASSE_V2.md` mantido + aviso | Aprovada |
| `groupKey` legível | Aprovada |
| `default_stageIndex + stages` | Aprovada |
| `runtime_stageIndex + runtime_tier` coexistem | Aprovada |
| Card Layer não chama kitSwap | Aprovada |
| Slot 4 invisível em produção se ausente | Aprovada |
| Métrica UX Fase 1 por ícone + layout | Aprovada |
| 3 Cards no piloto Guerreiro | Aprovada |

---

# 11. Decisões pendentes

| Decisão | Quando |
|---|---|
| Quantos slots de Talento | Antes da Fase 3 |
| Texto duplo por idade (`text_simple`) | Antes da versão Pequenos |
| Slot 4 base por classe ou só via kitSwap | Antes da Fase 2 |
| Ordem implícita de groupKeys em `SKILL_DEFS` | Investigação não-bloqueante |
| Mover CSVs raiz para `legacy/` | Baixa prioridade |
| `AGENTS.md` e `PROXIMOS_PASSOS.md` | Correção documental da Fase 0 |
| `Provocar`: `controle` ou `suporte` | Testar em playtest |

---

# 12. Métricas de sucesso

## 12.1 Técnicas

| Métrica | Alvo |
|---|---|
| Testes de regressão de combate | 100% idênticos antes/depois, ou comparação equivalente se não houver seed determinístico |
| Validador CI | Verde em todos os builds |
| Bugs de combate causados pela Card Layer | 0 |
| Tempo de carregamento das 3 Cards | < 50 ms |
| Cobertura de testes `cardResolver/cardLayer` | ≥ 80% |
| Rollback via feature flag | < 1 min |

## 12.2 UX infantil

| Métrica | Alvo |
|---|---|
| Criança identifica categoria por ícone + layout sem ler texto | ≥ 70% |
| Erros de regra atribuíveis à Card Layer | 0 |
| Criança expressa preferência por uma Card | ≥ 1 favorita |
| Terapeuta usa Card como gancho de conversa | ≥ 1x por sessão |
| Diversidade de uso entre as 3 Cards | Nenhuma >70% nem <10% |

Reconhecimento por arte autoral fica para Fase 1b/Fase 2.

---

# 13. Rollback

## 13.1 Garantias

- `cardLayer.enabled = false` restaura UI antiga.
- `cardResolver.js`, `cardLayer.js`, `cardRenderer.js` e `cards.json` são arquivos novos.
- Branch dedicada: `feature/card-layer-fase-1`.

## 13.2 Procedimento

1. Setar `cardLayer.enabled = false`.
2. Verificar UI antiga.
3. Investigar causa.
4. Fix-forward ou recuo controlado.

---

# 14. O que não fazer

- Não escrever código antes deste documento estar commitado.
- Não criar Cards para outras classes na Fase 1.
- Não criar Signature Cards na Fase 1.
- Não criar Talent Cards na Fase 1.
- Não implementar deck/mão/ciclo/compra/descarte.
- Não tocar em `data/skills.json`.
- Não tocar em fórmula de combate, ENE, atributos, posicionamento, vantagens, captura.
- Não renderizar placeholder de slot 4 em produção.
- Não promover Card Layer como deck.
- Não chamar `applyKitSwaps` em nenhum módulo da Card Layer.
- Não duplicar campos mecânicos em `cards.json`.

---

# 15. Glossário

- **Skill:** entidade canônica em `data/skills.json`; define mecânica.
- **Card:** representação visual de uma skill; sem mecânica.
- **Signature Card:** carta ligada a Monstrinhomon específico; Fase 2 visual-only.
- **Talent Card:** carta equipável; Fase 3+, se justificado.
- **Slot:** posição desbloqueada por nível via `slotUnlocks.js`.
- **stageIndex:** índice 0-indexed da variação de skill dentro do `groupKey`.
- **tier:** metadado 1-indexed da skill; não usar como chave principal.
- **groupKey:** chave legível da skill, como `Golpe de Espada`.
- **kitSwap:** mecanismo de variação de skills por espécie.
- **_kitSwapId:** marcador de skill resolvida por swap.
- **Card Layer:** `cardResolver + cardLayer + cardRenderer`.

---

**Próxima revisão:** após Fase 1 piloto Guerreiro estável por pelo menos 2 semanas ou quando PT-001 for resolvido.
