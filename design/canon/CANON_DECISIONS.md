# Monstrinhomon — Decisões Canônicas

Este arquivo registra decisões de design da camada canônica que afetam o comportamento do runtime.

---

## Decisão 1 — classAdvantages: cânone como source of truth

**Data:** 2026-04-01  
**Status:** Aplicado a partir da Fase 1

### Contexto
O motor legado definiu `GameState.config.classAdvantages` com um ciclo de 7 classes em `GAME_RULES.md`.  
O arquivo `design/canon/class_matchups.json` define um ciclo de 8 classes (incluindo Animalista) com matchups distintos.

### Divergências documentadas

| Classe | Legado (hardcoded) | Canônico (adotado) |
|--------|-------------------|-------------------|
| Guerreiro | fraco contra Curandeiro | fraco contra **Mago** |
| Mago | forte contra Bárbaro | forte contra **Guerreiro** |
| Ladino | forte contra Mago | forte contra **Caçador** |
| Animalista | neutro (sem matchup) | forte contra Bardo, fraco contra Bárbaro |

### Decisão
O arquivo `class_matchups.json` é adotado como source of truth para vantagens de classe.  
O motor recebe a tabela canônica via `applyCanonToConfig()` durante o boot.  
Se o carregamento falhar, a tabela hardcoded é mantida como fallback.

### Impacto em saves existentes
Saves com estado de combate em andamento **não** são afetados (o estado de combate não persiste entre sessões).  
Saves com composição de time e posse de Monstrinhos não são afetados.

---

## Decisão 2 — Subconjunto MVP Fase 1: 4 classes

**Data:** 2026-04-01  
**Status:** Ativo

### Classes no subconjunto MVP Fase 1
- Guerreiro
- Bárbaro
- Mago
- Curandeiro

### Justificativa
Essas são as 4 classes com maior volume de uso nos playtest iniciais.  
Bardo, Ladino, Caçador e Animalista serão incorporados em fases posteriores à medida que os dados de balanceamento forem validados.

---

## Decisão 3 — Mapeamento PT-BR ↔ ID canônico

**Data:** 2026-04-01  
**Status:** Estável

O motor usa nomes em PT-BR (ex: `'Guerreiro'`). O cânone usa IDs em inglês (ex: `'warrior'`).  
O mapeamento é mantido explicitamente em `canonLoader.js` e é bidirecional.  
**Regra:** nunca usar IDs canônicos diretamente no motor — sempre converter via `classIdFromPtbr()` / `classPtbrFromId()`.
