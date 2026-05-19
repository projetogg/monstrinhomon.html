# Plano de Ação Pré-MVP 0.4

## 1. Resumo executivo

**Decisão atual: GO com ressalvas para preparar o MVP 0.4.**

O MVP 0.3 foi estabilizado no fluxo principal do Wild Loop e agora possui auditoria prática, smoke test positivo, cenários negativos e hardening de runtime para casos críticos de captura, classe e HP 0.

O projeto pode avançar para a **preparação documental e técnica do MVP 0.4 — Cartas Básicas e Interface de Decisão**, desde que o PR atual seja finalizado corretamente: sair de draft, ter workflow autorizado/concluído e ser mergeado sem regressões.

Esta decisão **não autoriza ainda implementar deckbuilding completo, batalha em grupo, boss ou cartas avançadas**. Autoriza apenas planejar e iniciar o escopo mínimo de cartas básicas depois do merge deste PR.

## 2. Estado atual do MVP 0.3

### Fatos verificados

- **Documentação MVP 0.3 concluída** — PR #200 mergeado.
- **Auditoria prática concluída** — Issue #201 fechada e PR #202 mergeado.
- **Smoke test positivo do Wild Loop concluído** — PR #203 mergeado com `tests/wildLoopSmoke.test.js`.
- **Cenários negativos mínimos adicionados** — testes negativos do Wild Loop foram incorporados e atualizados.
- **Hardening de runtime em `js/combat/wildActions.js`** — ações wild agora têm validações mais explícitas para classe, ator inválido/HP 0 e captura sem orb.
- **Captura sem orb indisponível foi endurecida** — não deve mais usar fallback permissivo `|| 1` para permitir captura sem item.
- **`allowCrossClassBattle` passou a ter cobertura dedicada** — exceção explícita para cenários de debug/mestre/teste, sem liberar cross-class por padrão.
- **Validações reportadas no PR atual:**
  - `npm test`: passou.
  - `npm run test:wild-loop`: passou.
  - `npm run validate-data`: passou, com warnings conhecidos de balanceamento/baseHp.
  - `npm run validate:monster-assets`: passou.
  - `parallel_validation`: executado com feedback aplicável tratado.

### Linha de base histórica anterior às correções deste PR

Antes das correções consolidadas neste PR, havia bloqueios reais:

- `npm test` falhando por divergência entre testes negativos e runtime endurecido;
- workflow recente falhando após merges de cenários negativos;
- captura sem orb ainda sujeita a fallback permissivo;
- ausência de teste dedicado para `allowCrossClassBattle`;
- divergência de contrato para HP 0/ator inválido.

Esses pontos motivaram este PR. Eles **não devem continuar sendo descritos como bloqueadores atuais** se as validações do PR permanecerem verdes.

### Inferência técnica

O MVP 0.3 está suficientemente protegido para servir de base ao MVP 0.4, desde que o merge preserve os resultados de teste e o branch principal permaneça verde.

### Recomendação

- Finalizar este PR como estabilização pré-MVP 0.4.
- Após merge, abrir o escopo formal do MVP 0.4 sem implementar cartas avançadas.
- Manter issues P3/P4 para melhorias futuras, como Playwright E2E e redução de warnings não bloqueantes.

## 3. Análise do PR/branch de estabilização pré-MVP 0.4

### Arquivos alterados

- `docs/mvp-0.4/PRE_MVP_0_4_ACTION_PLAN.md`
- `js/combat/wildActions.js`
- `tests/wildLoopNegative.test.js`
- `tests/wildLoopNegativeScenarios.test.js`
- `tests/wildLoopSmoke.test.js`

### Houve alteração de runtime?

**Sim.**

A alteração de runtime é intencional e limitada ao hardening do Wild Loop antes do MVP 0.4.

Mudanças principais:

- bloqueio de captura sem orb disponível;
- remoção do comportamento permissivo que tratava inventário `0` como se houvesse `1` orb;
- alinhamento do contrato de erro para ator inválido/HP 0;
- preservação da restrição de classe no pipeline wild;
- manutenção de escape controlado por `dependencies.allowCrossClassBattle === true`.

### A alteração é aceitável?

**Sim, com ressalva de revisão final.**

A alteração é aceitável porque fecha riscos P1 antes de cartas, não altera balanceamento, não muda fórmula de dano e não adiciona sistemas novos. Ela deve ser mergeada apenas se os testes completos e o workflow do PR permanecerem verdes/autorizados.

### Riscos resolvidos por este PR

- Captura sem orb não deve mais ser permitida.
- Inventário de orb não deve ficar negativo por fallback indevido.
- HP 0 não deve executar ação wild válida.
- Cross-class continua bloqueado por padrão.
- Cross-class pode ser permitido apenas por escape explícito controlado.
- Testes negativos deixam de documentar comportamento indesejado como aceitável.

### Cobertura consolidada

- starter errado / classe incompatível;
- exceção `allowCrossClassBattle`;
- captura falha consumindo orb e mantendo encounter ativo;
- captura sem orb indisponível;
- team cheio enviando captura para box;
- save corrompido com fallback seguro;
- HP 0 bloqueando ação;
- encounter inválido falhando sem crash;
- smoke test positivo do Wild Loop.

### Verificação dos pontos críticos obrigatórios

| Ponto | Status pós-PR | Evidência resumida |
|---|---|---|
| PR altera runtime? | **Sim, intencionalmente** | `js/combat/wildActions.js` endurecido |
| Mudança é pequena/justificada? | **Sim** | foco em captura, classe e HP 0 |
| Restrição de classe no pipeline wild | **Implementada** | bloqueio por padrão |
| Escape `allowCrossClassBattle === true` | **Implementado e testado** | teste dedicado adicionado |
| Ativo com HP 0 não age | **Coberto** | contrato de erro alinhado nos testes |
| Captura com orb indisponível protegida | **Coberta** | sem fallback permissivo |
| Inventário 0 tratado como 1 por fallback | **Resolvido** | captura sem orb bloqueada |
| Captura falha consome orb e mantém encounter | **Coberto** | teste negativo |
| Team cheio envia para box | **Coberto** | teste negativo |
| Save corrompido faz fallback seguro | **Coberto** | teste negativo/smoke |
| Encounter inválido falha seguro | **Coberto** | teste negativo/smoke |
| `npm run test:wild-loop` | **Reportado como verde** | validação do PR |
| `npm test` | **Reportado como verde** | validação do PR |
| `npm run validate-data` | **Passou com warnings conhecidos** | warnings de baseHp não bloqueantes |
| `npm run validate:monster-assets` | **Reportado como verde** | validação do PR |
| Risco de source of truth duplicado | **Reduzido** | testes alinhados ao contrato atual |
| Risco de teste documentar bug | **Reduzido** | fallback permissivo deixou de ser esperado |
| Bloqueador P0/P1 antes de cartas | **Nenhum conhecido após merge verde** | manter vigilância até workflow final |

## 4. Riscos antes do MVP 0.4

| Risco | Severidade | Estado atual | Recomendação |
|---|---|---|---|
| Workflow do PR ainda exigir ação manual | P2 | `action_required` pode bloquear evidência de CI | Autorizar/aguardar workflow antes do merge |
| Documento ficar desatualizado em relação ao código | P2 | Corrigido neste commit documental | Manter este arquivo sincronizado com o gate real |
| Warnings de `baseHp` no `validate-data` | P3 | Conhecido, não bloqueante | Abrir issue de balanceamento/dados depois do MVP 0.4 inicial |
| Recurso externo/fontes gerando ruído em ambiente headless | P3 | Não bloqueante | Abrir issue de fallback/localização de recurso externo |
| `SKILL_DEFS_FALLBACK`/timing de skills | P4 | Não bloqueante | Registrar melhoria futura antes de cartas avançadas |
| Playwright E2E ainda não cobre UI completa | P4 | Aceitável para agora | Planejar promoção para E2E quando a UI de cartas estabilizar |
| MVP 0.4 expandir escopo além de cartas básicas | P2 | Risco de produção | Congelar fora de escopo no plano do MVP 0.4 |

## 5. Issues recomendadas após merge

### Issue 1 — Criar escopo formal do MVP 0.4 — Cartas Básicas

- **Objetivo:** documentar o escopo mínimo de cartas antes de qualquer implementação.
- **Contexto:** o Wild Loop está protegido; a próxima evolução deve ser carta básica, não deckbuilding completo.
- **Arquivos prováveis:** `docs/mvp-0.4/README.md`, `docs/mvp-0.4/MVP_0_4_CARTAS_BASICAS.md`.
- **Critérios de aceite:**
  - definir 1 carta básica por classe;
  - definir mão inicial mínima;
  - definir ENE/custo visível;
  - definir fora de escopo;
  - definir testes obrigatórios;
  - não implementar runtime ainda.
- **Fora de escopo:** deckbuilding completo, boss, grupo, campanha.
- **Severidade:** P2 como controle de escopo.

### Issue 2 — Reduzir warnings não bloqueantes de recurso externo

- **Objetivo:** reduzir ruído no console/ambiente headless.
- **Contexto:** auditorias anteriores observaram falhas não críticas de recurso externo.
- **Arquivos prováveis:** `index.html`, CSS/fontes, docs de auditoria.
- **Critérios de aceite:**
  - documentar origem;
  - manter fallback local ou tolerância explícita;
  - não bloquear testes.
- **Fora de escopo:** refactor visual.
- **Severidade:** P3.

### Issue 3 — Revisar warning/fallback de skills antes de cartas avançadas

- **Objetivo:** entender o `SKILL_DEFS_FALLBACK` e evitar que ele atrapalhe cartas.
- **Contexto:** cartas dependerão mais de skills/habilidades; warnings de timing devem ser compreendidos antes de expansão.
- **Arquivos prováveis:** `js/data/skillsLoader.js`, `js/data/*`, inicialização em `index.html`.
- **Critérios de aceite:**
  - origem documentada;
  - decisão clara: corrigir agora, tolerar ou adiar;
  - sem mudança grande antes do MVP 0.4 básico.
- **Fora de escopo:** reescrever sistema de skills.
- **Severidade:** P4 agora, pode virar P2 antes de cartas avançadas.

### Issue 4 — Planejar Playwright E2E para Wild Loop + Cartas

- **Objetivo:** promover o smoke test de integração para E2E quando a UI estiver pronta.
- **Contexto:** Vitest/integration protege o núcleo, mas não substitui UI real.
- **Arquivos prováveis:** `e2e/*`, configuração Playwright, workflow dedicado.
- **Critérios de aceite:**
  - fluxo headless estável;
  - sem dependência de rede externa;
  - rodar em CI.
- **Fora de escopo:** implementar antes da UI mínima de cartas.
- **Severidade:** P4.

## 6. Critérios de pronto para iniciar MVP 0.4

- [x] PR de auditoria mergeado.
- [x] PR de smoke test mergeado.
- [x] Cenários negativos mínimos criados e alinhados.
- [x] Captura sem orb protegida.
- [x] Inventário 0 não é tratado como 1 orb disponível.
- [x] HP 0 não executa ação.
- [x] Restrição de classe coberta.
- [x] Exceção `allowCrossClassBattle` coberta.
- [x] Save corrompido com fallback seguro.
- [x] Captura falha e team cheio cobertos.
- [x] `npm test` reportado como verde no PR.
- [x] `npm run test:wild-loop` reportado como verde no PR.
- [x] `npm run validate-data` reportado como verde, com warnings conhecidos.
- [x] `npm run validate:monster-assets` reportado como verde.
- [ ] Workflow do PR autorizado/concluído no GitHub.
- [ ] PR #210 marcado como ready for review.
- [ ] PR #210 mergeado na `main`.
- [ ] Escopo formal do MVP 0.4 criado antes de implementar cartas.

## 7. Ordem recomendada de execução

1. Resolver/autorizar o workflow do PR #210.
2. Marcar o PR #210 como ready for review.
3. Fazer merge do PR #210 se o workflow permanecer verde.
4. Abrir issue documental do MVP 0.4 — Cartas Básicas e Interface de Decisão.
5. Criar documento de escopo do MVP 0.4 com fora de escopo rígido.
6. Definir modelo mínimo de carta antes de runtime.
7. Implementar a primeira carta básica por classe em PR pequeno.
8. Proteger cartas com testes antes de deckbuilding.
9. Só depois discutir grupo, boss, campanha e dashboards.

## 8. Decisão GO/NO-GO

**GO com ressalvas para preparação do MVP 0.4.**

### Justificativa técnica

O Wild Loop do MVP 0.3 possui proteção suficiente para permitir a próxima etapa de planejamento e escopo do MVP 0.4. O PR atual fecha os bloqueios que justificavam o NO-GO anterior: captura sem orb, contrato de HP 0, exceção cross-class e testes negativos desalinhados.

### Ressalvas

- Não iniciar implementação de cartas antes do merge deste PR.
- Não iniciar deckbuilding completo.
- Não iniciar grupo/boss/campanha.
- Não tratar warnings P3/P4 como bloqueadores, mas registrar issues para acompanhamento.
- Manter `npm test` e `npm run test:wild-loop` verdes em toda alteração do MVP 0.4.

### Condição para GO pleno

O estado passa de **GO com ressalvas** para **GO pleno para implementação inicial de cartas básicas** quando:

- PR #210 estiver mergeado na `main`;
- workflow do PR estiver autorizado/concluído;
- não houver P0/P1 aberto;
- documento de escopo do MVP 0.4 estiver criado e aprovado.
