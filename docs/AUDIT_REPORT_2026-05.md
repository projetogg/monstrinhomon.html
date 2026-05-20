# 🔎 Relatório de Auditoria Técnica — Arquivos Obsoletos/Desatualizados (2026-05)

**Data**: 2026-05-20  
**Escopo**: auditoria documental (sem remoções/movimentações neste PR)  
**Objetivo**: registrar classificação de arquivos candidatos a remoção e riscos arquiteturais identificados.

---

## ✅ Regras de Classificação (para este relatório)

- **Remoção segura**: candidato a remoção em PR separado, com gates de CI e validação manual mínima.
- **Revisão humana**: exige decisão de autoridade (produto/design/governança) antes de mexer.
- **Não remover**: referência confirmada em runtime *ou* ativo para governança/compatibilidade.
- **Deprecated/Referência**: não é fonte de verdade do runtime atual; manter por histórico/consulta até plano de limpeza.

---

## 📌 Correções de classificação (decisões já aprovadas)

### 1) `design/canon/` (misto: runtime + referência/deprecated)

**Parte carregada pelo runtime via `js/canon/canonLoader.js` → Não remover**
- `design/canon/classes.json`
- `design/canon/class_matchups.json`
- `design/canon/skills_mvp_phase1.json`
- `design/canon/species.json`
- `design/canon/evolution_lines.json`
- `design/canon/level_progression.json`

**Demais arquivos em `design/canon/` → Deprecated/Referência (até revisão)**
- Motivo: coexistem documentos/artefatos de design que não são consumidos pelo runtime atual, mas podem ser usados como referência de decisões e de migração.
- Regra: qualquer remoção deve ocorrer *após* validação de dependências internas de documentação e confirmação de que não são “source of truth” operacional.

### 2) `docs/archive/` → Revisão humana (não classificar como remoção segura)

- Motivo: risco de governança documental (histórico de decisões, rastreabilidade e auditoria).  
- Diretriz: tratar como acervo; qualquer limpeza precisa de curadoria explícita (critérios + “o que substitui o quê”).

### 3) `progression.config.json` → Revisão humana / Manter até decisão de autoridade

- Motivo: **não há referência direta confirmada em runtime** no estado atual do repositório.  
- Risco: remoção sem decisão pode descartar uma configuração “pretendida” (ou gerar perda de contexto de design).
- Ação requerida: decisão formal (manter/migrar para `data/`/deletar) antes de qualquer mudança.

---

## 🧾 Inventário por categoria (auditável)

### Remoção segura (candidatos)

- Nenhum candidato **confirmado** nesta auditoria sem revisão adicional.

> Observação: candidatos “seguros” **ainda exigem PR separado** com gates + smoke mínimo.

### Revisão humana

- `docs/archive/` (governança documental)
- `progression.config.json` (sem referência confirmada em runtime; depende de autoridade)

### Não remover

- `design/canon/` (subconjunto carregado pelo `canonLoader`, listado acima)

### Deprecated/Referência

- `design/canon/` (demais arquivos não carregados hoje; manter como referência até plano de limpeza)

---

## ⚠️ Riscos arquiteturais (alto impacto)

### Risco 1 — Sistemas paralelos de Trade (importante)

- Sintoma: coexistem implementações em caminhos distintos.
  - `js/trade/tradeSystem.js`
  - `js/combat/tradeSystem.js` (consumido por `js/ui/tradeUI.js`)
- Risco: divergência de regras, bugs “fantasma” (corrige em um módulo, mas runtime usa outro), e testes cobrindo apenas uma via.
- Mitigação sugerida: escolher **um** módulo como fonte de verdade e criar camada de compatibilidade (se necessário) antes de remover o outro.

### Risco 2 — Sistemas paralelos de Evolution (RISCO ALTO)

- Sintoma: múltiplas implementações de evolução + dados canônicos paralelos.
  - `js/data/evolutionSystem.js`
  - `js/progression/evolutionSystem.js`
  - `design/canon/evolution_lines.json` (linha evolutiva canônica)
- Risco: múltiplas fontes de verdade (regra/dados) com chance alta de inconsistência funcional e de progressão, especialmente em saves antigos.
- Mitigação sugerida (pré-requisito): definir autoridade (runtime atual vs canon) e criar “plano de unificação” com testes de regressão e migração de save.

---

## 🧩 Plano seguro de PRs (sem quebrar runtime)

### PR 1 — (este PR) Relatório documental

- Adiciona este relatório em `docs/AUDIT_REPORT_2026-05.md`.
- Não altera runtime, testes, dados nem `package.json`.

### PR 2 — Remoções seguras (somente itens marcados “Remoção segura”)

**Gates obrigatórios para merge (exigidos):**
- `npm test`
- `npm run test:wild-loop`
- `npm run test:wild-loop:vitest`
- `npm run validate-data`
- `npm run validate:monster-assets`

**Escopo permitido:**
- remover apenas arquivos classificados como “Remoção segura”
- sem refactors de lógica (apenas remoção + ajustes mínimos de imports, se existirem)

### PR 3 — Governança de `docs/archive/` (curadoria)

- Definir política: o que fica em archive, o que sobe para docs, e como indexar/buscar.
- Resultado esperado: critérios claros e checklist para futuras limpezas.

### PR 4 — Decisão sobre `progression.config.json`

- Decisão por autoridade (manter/migrar/deletar).
- Se migrar: definir local final e garantir compatibilidade documental (e eventual loader futuro).

### PR 5 — Unificação Trade/Evolution (alto risco)

- Somente após PRs 2–4 e com plano de migração/testes.
- Objetivo: eliminar duplicidade e deixar **uma** fonte de verdade por sistema.

---

## Critérios de aceite (para este relatório)

- Relatório separa: remoção segura, revisão humana, não remover, deprecated.
- `design/canon/`, `docs/archive/` e `progression.config.json` classificados conforme decisões já aprovadas.
- Duplicidade de Evolution marcada como **risco alto**.
- PR 2 lista explicitamente os gates obrigatórios.
