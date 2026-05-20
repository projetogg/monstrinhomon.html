# Monstrinhomon — Pendências Técnicas

**Data:** 2026-05-19  
**Status:** Registro vivo de pendências técnicas identificadas no fechamento da Fase 0 da Card Layer.

---

## PT-001 — Slot 4 base de classes

**Origem:** Auditoria Fase 0 Card Layer (2026-05-19)  
**Status:** Aberto  
**Prioridade:** Média  
**Bloqueia Fase 1?** Não.

### Descrição

`data/skills.json` não contém skill base de slot 4 para o Guerreiro. A evidência da auditoria indica que o slot 4 aparece como skill exclusiva via `kitSwap` em espécies específicas, não como skill canônica base da classe.

### Decisão necessária

- **Opção A:** implementar slot 4 base por classe em runtime futuro.
- **Opção B:** manter slot 4 como exclusivo de `kitSwap` por espécie.

### Impacto

A Card Layer não cria Card pública de slot 4 até que esta decisão seja tomada. Em produção, slot 4 ausente não deve renderizar placeholder visível para crianças.

---

## PT-002 — Mapeamento `groupKey → slot`

**Origem:** Auditoria Fase 0 Card Layer (2026-05-19)  
**Status:** Aberto  
**Prioridade:** Baixa/Média  
**Bloqueia Fase 1?** Não.

### Descrição

Não há mapeamento canônico no runtime entre `groupKey` e slot. O runtime organiza skills por `class → groupKey → stageIndex`, enquanto `slotUnlocks.js` informa apenas a quantidade de slots desbloqueados.

### Decisão atual

A Card Layer usará `display_slot` manual em cada Card como metadado de ordenação visual.

### Investigação futura

Verificar se há ordem implícita confiável em `SKILL_DEFS[class]` ou se deve existir arquivo explícito de ordenação visual.

---

## PT-003 — CSVs raiz como legado inerte

**Origem:** Auditoria Fase 0 Card Layer (2026-05-19)  
**Status:** Aberto  
**Prioridade:** Baixa  
**Bloqueia Fase 1?** Não.

### Descrição

CSVs como `HABILIDADES.csv`, `MONSTROS.csv` e equivalentes aparecem como referência histórica/documental, mas não são carregados pelo runtime de combate/skills.

### Decisão atual

Tratar CSVs raiz como legado inerte, salvo evidência contrária em PR futuro.

### Ação futura

Considerar mover CSVs para `docs/legacy/` ou `legacy/` para reduzir confusão de novos desenvolvedores.

---

## PT-004 — Drift documental: `AGENTS.md` e `PROXIMOS_PASSOS.md`

**Origem:** Auditoria Fase 0 Card Layer (2026-05-19)  
**Status:** Em correção  
**Prioridade:** Média  
**Bloqueia Fase 1?** Não, desde que os avisos de legado estejam commitados.

### Descrição

`AGENTS.md` e `PROXIMOS_PASSOS.md` descrevem estado pré-v2.x em alguns trechos: 7 classes, fórmula antiga e sistema I/II/III. Isso conflita com documentos canônicos recentes.

### Ações aprovadas

- Adicionar aviso no topo de `AGENTS.md` apontando para `GAME_RULES.md` e `docs/PATCH_CANONICO_COMBATE_V2.2.md`.
- Corrigir lista de classes para incluir Animalista.
- Marcar `PROXIMOS_PASSOS.md` como legado e preservar cópia em `docs/legacy/PROXIMOS_PASSOS_2026-01.md`.

---

## PT-005 — Categoria visual de `Provocar`

**Origem:** Planejamento da Fase 1 Card Layer  
**Status:** Aberto  
**Prioridade:** Baixa  
**Bloqueia Fase 1?** Não.

### Descrição

`Provocar` pode ser classificado visualmente como `controle` ou `suporte`. `controle` é mecanicamente mais fiel; `suporte` pode ser mais intuitivo para crianças.

### Decisão atual

Começar com `category_visual: "controle"` e observar em playtest infantil. Se houver confusão, reclassificar como `suporte`.
