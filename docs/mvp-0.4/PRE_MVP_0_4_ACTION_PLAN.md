# Plano de Ação Pré-MVP 0.4

## 1. Resumo executivo

**Decisão atual: NO-GO para iniciar MVP 0.4.**

O MVP 0.3 está funcional no fluxo principal e com documentação/auditoria sólidas, porém existem bloqueios objetivos antes de cartas: `npm test` falhando no branch atual, workflow de testes recente falhando em `main` após merges de cenários negativos, comportamento permissivo de captura sem orb (`|| 1`) e desalinhamento entre testes legados e runtime hardenizado.

## 2. Estado atual do MVP 0.3

### Fatos verificados

- **Documentação MVP 0.3 concluída** (PR #200, mergeado).
- **Auditoria prática concluída** (Issue #201 fechada + PR #202 mergeado).
- **Smoke test positivo do Wild Loop concluído** (PR #203 mergeado, `tests/wildLoopSmoke.test.js`).
- **Cenários negativos adicionados** (PR #208 e PR #209 mergeados).
- **Hardening de runtime introduzido** em `js/combat/wildActions.js` via PR #209 (validação de ator/classe).
- **Validações locais executadas nesta análise**:
  - `npm run test:wild-loop`: **passou** (com erros de recurso externo no console do E2E).
  - `npm test`: **falhou** (3 testes).
  - `npm run validate-data`: **passou** (8 warnings já conhecidos de faixa de `baseHp`).
  - `npm run validate:monster-assets`: **passou sem warnings**.
- **Workflow `.github/workflows/tests.yml` (npm test) com falhas recentes em `main`**:
  - run `26059146093` (merge PR #209): failure
  - run `26059125254` (merge PR #208): failure

### Inferência técnica

- O fluxo mínimo do jogo existe e roda, mas a baseline de qualidade para avançar milestone ainda não está estável porque a suíte principal e CI estão quebradas por inconsistências entre testes/expectativas.

### Recomendação

- Fechar os bloqueadores de teste e regras de robustez de captura antes de iniciar qualquer escopo de cartas.

### PRs recentes — decisão operacional

- **PR #200:** manter como base documental (ok).
- **PR #202:** manter como referência de auditoria (ok).
- **PR #203:** manter como proteção de smoke positivo (ok).
- **PR #207:** já mergeado; mudança de guarda de ator foi absorvida.
- **PR #208 e #209:** já mergeados, porém com efeito colateral de instabilidade em suíte/CI; **não repetir merges similares sem reconciliação**.
- **Ação recomendada:** abrir PR de estabilização (testes + contrato de erro + orb indisponível) antes de qualquer PR de cartas.

## 3. Análise do PR/branch de cenários negativos

### Arquivos alterados (PR #209)

- `js/combat/wildActions.js` (**runtime**)
- `tests/wildLoopNegativeScenarios.test.js` (novo)
- `tests/wildPlayerActions.test.js`
- `tests/firstCombatAudit.test.js`
- `tests/canonIdentityUX.test.js`
- `tests/shadowstingLoop.test.js`
- `tests/speciesPassives.test.js`
- `tests/speciesPassives41.test.js`

### Houve alteração de runtime?

**Sim.**

- Adição de `validateWildPlayerActor(...)` em `wildActions.js`.
- Aplicação da validação em `executeWildAttack`, `executeWildSkill`, `executeWildCaptureAction`, `executeWildItemUse`, `executeWildCapture`.
- Introdução explícita de escape controlado: `dependencies.allowCrossClassBattle === true`.

### A alteração é aceitável?

- **Parcialmente aceitável.** O hardening é coerente com regra canônica (classe em batalha + bloqueio de ator inválido/HP 0), mas a integração ficou inconsistente com testes legados e com motivo de erro esperado em parte da suíte (`invalid_actor` vs `player_monster_fainted`).

### Riscos observados

- Duplicidade de suíte negativa (`wildLoopNegative.test.js` e `wildLoopNegativeScenarios.test.js`) com expectativas conflitantes.
- Teste legado documentando comportamento indesejado (`fallback || 1` para orb indisponível).
- Escape `allowCrossClassBattle` existe no runtime, porém sem teste dedicado.

### Cobertura já presente

- starter errado bloqueado (novo teste)
- captura falha consome orb e mantém encounter ativo
- team cheio envia para box
- save corrompido cai em fallback seguro
- encounter inválido falha com segurança
- HP 0 bloqueia ação (com divergência de reason entre testes)

### Cobertura faltante

- teste dedicado para `allowCrossClassBattle === true`
- teste que garanta bloqueio explícito quando orb indisponível/zero (sem fallback permissivo)
- consolidação de uma única suíte negativa canônica

### Verificação dos pontos críticos obrigatórios

| Ponto | Status | Evidência resumida |
|---|---|---|
| PR negativo altera runtime? | **Sim** | `js/combat/wildActions.js` alterado no PR #209 |
| Hardening em `wildActions.js` é pequeno/justificado? | **Parcialmente** | mudança focada em validação de ator/classe, mas com regressões de suíte |
| Restrição de classe no pipeline wild | **Implementada** | `validateWildPlayerActor` bloqueia `class_mismatch` |
| Escape `allowCrossClassBattle === true` | **Implementado** | flag presente no runtime |
| Escape está testado? | **Não** | sem teste dedicado encontrado |
| Ativo com HP 0 não age | **Sim** | retorna falha (`invalid_actor`) em `executeWildAttack` |
| Captura com orb indisponível protegida | **Não** | consumo usa fallback permissivo (`|| 1`) |
| Inventário 0 orb tratado como 1 por fallback | **Sim (risco)** | comportamento explícito em runtime e teste legado |
| Captura falha consome orb e mantém encounter | **Sim** | coberto em smoke/negativo |
| Team cheio envia para box | **Sim** | coberto em smoke/negativo |
| Save corrompido faz fallback seguro | **Sim** | `storage.js` + testes de smoke/negativo |
| Encounter inválido falha seguro | **Sim** | testes smoke/negativo |
| `npm run test:wild-loop` | **Passou** | execução local desta análise |
| `npm test` | **Falhou** | 3 falhas em testes negativos |
| `npm run validate-data` | **Passou com warnings** | 8 warnings de `baseHp` |
| `npm run validate:monster-assets` | **Passou** | sem warnings |
| Warnings conhecidos pré-MVP 0.4 | **Sim** | recurso externo + `SKILL_DEFS_FALLBACK` |
| Risco de source of truth duplicado | **Sim** | duas suítes negativas conflitantes |
| Risco de teste documentar bug | **Sim** | teste legado aceita fallback indevido de orb |
| Bloqueador P0/P1 antes de cartas | **Sim (P1)** | CI/testes falhando + proteção de orb incompleta |

## 4. Riscos antes do MVP 0.4

| Risco | Severidade | Evidência | Recomendação |
|---|---|---|---|
| `npm test` falhando no branch atual | P1 | Falhas em `tests/wildLoopNegative.test.js` e `tests/wildLoopNegativeScenarios.test.js` | Corrigir/alinhar expectativas e estabilizar suíte antes de MVP 0.4 |
| Workflow de testes falhando em `main` após PRs negativos | P1 | Runs `26059146093` e `26059125254` (workflow `Tests (Vitest)`) | Abrir issue de estabilização CI e corrigir imediatamente |
| Captura sem orb pode ser tratada como disponível (`(x || 1) - 1`) | P1 | `js/combat/wildActions.js` linha de consumo de orb com fallback `|| 1` | Hardening para bloquear captura sem item disponível + teste |
| Duplicidade de source of truth em testes negativos | P2 | `tests/wildLoopNegative.test.js` e `tests/wildLoopNegativeScenarios.test.js` coexistem com regras conflitantes | Escolher suíte canônica e remover/ajustar a redundante |
| Teste documentando bug/comportamento não desejado | P2 | `wildLoopNegative.test.js` valida fallback de orb inexistente como "ok" | Reescrever cenário para refletir regra correta de inventário |
| Escape cross-class sem teste | P2 | `allowCrossClassBattle` presente em runtime e sem cobertura | Criar teste explícito de opt-in debug/mestre |
| Divergência de reason para HP 0 (`invalid_actor` x `player_monster_fainted`) | P3 | Falha de asserção em teste negativo novo | Padronizar contrato de retorno e atualizar testes/docs |
| Warning de recurso externo no smoke E2E | P3 | `npm run test:wild-loop` exibiu `Failed to load resource` | Abrir issue de robustez de recurso externo/fallback |
| Warning de fallback de skills já auditado | P4 | `AUDITORIA_PRACTICA_ISSUE_201.md` aponta `SKILL_DEFS_FALLBACK` | Registrar melhoria futura de init/timing sem bloquear MVP 0.4 |

## 5. Issues obrigatórias antes do MVP 0.4

### Issue 1 — Bloquear captura com orb indisponível
- **Objetivo:** impedir tentativa de captura sem orb no inventário.
- **Contexto:** runtime usa fallback permissivo com `|| 1`.
- **Arquivos prováveis:** `js/combat/wildActions.js`, `tests/wildLoopNegativeScenarios.test.js`.
- **Critérios de aceite:**
  - captura sem orb retorna erro válido (sem consumo negativo/permissivo);
  - encounter mantém estado consistente;
  - cobertura de teste positiva/negativa.
- **Fora de escopo:** balanceamento de captura.
- **Severidade:** **P1**.

### Issue 2 — Testar exceção `allowCrossClassBattle`
- **Objetivo:** validar escape controlado para modo debug/mestre.
- **Contexto:** flag existe no runtime e não está coberta.
- **Arquivos prováveis:** `tests/wildLoopNegativeScenarios.test.js` (ou suíte canônica equivalente), `tests/wildPlayerActions.test.js`.
- **Critérios de aceite:**
  - sem flag: bloqueia classe errada;
  - com `allowCrossClassBattle === true`: permite ação.
- **Fora de escopo:** liberar cross-class por padrão.
- **Severidade:** **P2**.

### Issue 3 — Confirmar bloqueio de ação com HP 0 e contrato de reason
- **Objetivo:** consolidar comportamento canônico para ator desmaiado.
- **Contexto:** runtime bloqueia, mas testes divergem no `reason`.
- **Arquivos prováveis:** `js/combat/wildActions.js`, `tests/wildLoopNegative*.test.js`.
- **Critérios de aceite:**
  - HP 0 não executa ação em nenhuma rota wild;
  - `reason` documentado e único.
- **Fora de escopo:** UX completa de troca automática.
- **Severidade:** **P1**.

### Issue 4 — Documentar hardening de `wildActions.js` (PR #209)
- **Objetivo:** registrar mudança de regra técnica e contrato de erros.
- **Contexto:** runtime mudou além de testes.
- **Arquivos prováveis:** `docs/mvp-0.3/*` e/ou `docs/AUDIT_REPORT.md`.
- **Critérios de aceite:**
  - documento descreve validações de ator/classe e escape debug;
  - vínculo com testes canônicos.
- **Fora de escopo:** refactor do combate.
- **Severidade:** **P3**.

### Issue 5 — Manter smoke test positivo do Wild Loop
- **Objetivo:** garantir proteção contínua do caminho feliz.
- **Contexto:** smoke já existe e precisa permanecer verde.
- **Arquivos prováveis:** `tests/wildLoopSmoke.test.js`, `e2e/wildLoopSmoke.e2e.mjs`.
- **Critérios de aceite:** `npm run test:wild-loop` e/ou equivalente definido continuam passando.
- **Fora de escopo:** deckbuilding/cartas.
- **Severidade:** **P1**.

### Issue 6 — Manter cenários negativos mínimos sem duplicidade
- **Objetivo:** consolidar suíte negativa mínima sem conflito.
- **Contexto:** existem duas suítes negativas com expectativas incompatíveis.
- **Arquivos prováveis:** `tests/wildLoopNegative.test.js`, `tests/wildLoopNegativeScenarios.test.js`.
- **Critérios de aceite:**
  - uma fonte de verdade para negativos;
  - `npm test` verde.
- **Fora de escopo:** aumento grande de cobertura fora do wild loop mínimo.
- **Severidade:** **P1**.

### Issue 7 — Registrar warnings não bloqueantes (recurso externo + fallback skills)
- **Objetivo:** rastrear ruídos de execução para melhoria incremental.
- **Contexto:** warnings observados em auditoria e smoke E2E.
- **Arquivos prováveis:** `index.html`, `js/data/skillsLoader.js`, docs de auditoria.
- **Critérios de aceite:** issues abertas com reprodução, impacto e proposta.
- **Fora de escopo:** remoção total de logs diagnósticos.
- **Severidade:** **P3/P4**.

### Issue 8 — Issue futura para Playwright E2E do Wild Loop completo
- **Objetivo:** cobertura ponta-a-ponta robusta da UI real.
- **Contexto:** smoke atual é misto (Vitest + script E2E dedicado).
- **Arquivos prováveis:** `e2e/*`, workflow dedicado.
- **Critérios de aceite:** cenário headless estável no CI.
- **Fora de escopo:** ampliar para campanha/boss.
- **Severidade:** **P4**.

### Issue 9 — Issue futura de escopo MVP 0.4 (cartas básicas)
- **Objetivo:** abrir o escopo de cartas só após gate técnico prévio.
- **Contexto:** próxima milestone já definida em docs do MVP 0.3.
- **Arquivos prováveis:** `docs/mvp-0.4/*`, backlog de produto.
- **Critérios de aceite:** escopo mínimo, fora de escopo e critérios de pronto documentados.
- **Fora de escopo:** implementação de runtime nesta issue.
- **Severidade:** **P4**.

## 6. Critérios de pronto para iniciar MVP 0.4

- [x] PR de smoke test mergeado.
- [x] PR de auditoria mergeado.
- [ ] PR de cenários negativos mergeado ou justificado.
- [ ] `npm test` passa.
- [x] `npm run test:wild-loop` passa.
- [x] `npm run validate-data` passa.
- [x] `npm run validate:monster-assets` passa.
- [ ] Sem P0/P1 aberto.
- [ ] Orb indisponível protegida.
- [x] HP 0 não executa ação.
- [x] Restrição de classe testada.
- [ ] Exceção `allowCrossClassBattle` testada, se existir.
- [x] Save corrompido com fallback seguro.
- [x] Captura falha e team cheio cobertos.
- [x] Plano do MVP 0.4 documentado.

## 7. Ordem recomendada de execução

1. **Estabilizar CI imediatamente**: alinhar testes negativos com runtime atual (sem alterar regra canônica indevidamente).
2. **Resolver orb indisponível (P1)** com hardening + teste dedicado.
3. **Padronizar contrato de erro para HP 0** (`reason`) e atualizar testes/documentação.
4. **Adicionar teste de `allowCrossClassBattle`** (sem abrir loophole em produção).
5. **Consolidar suíte negativa única** (evitar source of truth duplicada).
6. **Rodar validação completa e garantir verde**:
   - `npm run test:wild-loop`
   - `npm test`
   - `npm run validate-data`
   - `npm run validate:monster-assets`
7. **Abrir/atualizar issues P3/P4** (warnings de recurso externo, fallback skills, E2E futuro).
8. **Concluir documento de escopo técnico do MVP 0.4** (sem implementação de cartas).
9. **Somente então iniciar implementação de Cartas Básicas**.

## 8. Decisão GO/NO-GO

**NO-GO (neste momento).**

### Justificativa técnica

- Gate básico de qualidade não foi atingido: `npm test` e workflow principal de testes estão falhando.
- Há risco funcional real no pipeline de captura (orb indisponível com fallback permissivo).
- Há inconsistência de contratos de erro e duplicidade de suites negativas, aumentando risco de regressão silenciosa.

### Condição para reclassificar para GO com ressalvas

- `npm test` verde em branch e CI (`main`),
- hardening de orb indisponível validado por teste,
- escape `allowCrossClassBattle` coberto,
- suíte negativa consolidada sem conflitos.
