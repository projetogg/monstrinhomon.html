# Monstrinhomon — Pendências Técnicas

**Status:** ACTIVE — registro de pendências técnicas não representadas integralmente no roadmap.  
**Atualizado:** 2026-07-30  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`

Este arquivo não substitui `docs/ROADMAP.md` e não cria regras canônicas.

## PT-001 — Slot 4 base de classes

**Status:** Aberto  
**Prioridade:** Média  
**Bloqueia o piloto atual da Card Layer?** Não.

`data/skills.json` não define de forma fechada um slot 4 base para todas as classes. A Card Layer não deve inventar uma habilidade pública de slot 4.

Decisão necessária:

- implementar slot 4 base por classe; ou
- manter slot 4 dependente de assinatura/kit swap.

## PT-002 — Mapeamento `groupKey → slot`

**Status:** Aberto  
**Prioridade:** Baixa/Média.

O runtime organiza skills por `class`, `groupKey` e `stageIndex`, enquanto o desbloqueio informa quantidade de slots. A ordenação visual continua dependente de metadado explícito.

Investigar somente quando a expansão da Card Layer for aprovada.

## PT-003 — Consolidação dos CSVs da raiz

**Status:** Aberto  
**Prioridade:** Média para governança e contratos de teste.

Os CSVs da raiz não são a fonte runtime principal, mas não formam um bloco homogêneo.

Evidência verificada na baseline:

- `QUESTS.csv` é lido pela suíte de integridade e possui representação paralela em `js/data/questSystem.js`;
- `DROPS.csv` é lido pela suíte de integridade e possui representação paralela em `js/data/dropSystem.js`;
- `LOCAIS.csv` e `ENCOUNTERS.csv` são lidos por testes de integridade;
- outros CSVs contêm fórmulas, valores, IDs ou catálogos históricos que podem divergir do runtime.

Ação correta:

1. inventariar cada CSV;
2. buscar runtime, testes, scripts, comentários e documentação;
3. comparar conteúdo com a fonte efetiva;
4. classificar como runtime, fixture, contrato paralelo, gerado, histórico, legado inerte ou desconhecido;
5. escolher fonte única ou geração quando houver duplicidade;
6. mover ou remover somente em PR próprio com testes atualizados.

Não misturar essa consolidação com balanceamento ou alteração de dados runtime.

## PT-004 — Drift em `AGENTS.md` e `PROXIMOS_PASSOS.md`

**Status:** Resolvido em documentação na auditoria de julho de 2026.

- `AGENTS.md` usa a ordem de leitura atual e não presume Animalista neutro;
- `PROXIMOS_PASSOS.md` é redirecionamento mínimo;
- o conteúdo histórico permanece em `docs/legacy/PROXIMOS_PASSOS_2026-01.md`.

## PT-005 — Categoria visual de `Provocar`

**Status:** Aberto para playtest  
**Prioridade:** Baixa.

A categoria visual atual é `controle`. Reclassificar como `suporte` somente se o playtest infantil demonstrar confusão consistente.

## PT-006 — Semântica de skill que erra no Wild

**Status:** Lacuna de evidência  
**Prioridade:** Baixa/Média.

O Group expõe localmente erro de acurácia; o caminho Wild recebe resultado mais agregado. Não alterar o runtime sem investigação isolada.

## PT-007 — Regeneração de ENE

**Status:** Aberto  
**Prioridade:** Média.

Existe divergência histórica sobre tabela e arredondamento de regeneração. Exige auditoria própria, cenários quantitativos e decisão humana.

## PT-008 — Boss

**Status:** Investigação pendente  
**Prioridade:** Média.

Multiplicadores, fases, cura e curva de boss não estão integralmente validados contra a experiência desejada.

## PT-009 — QA de produto da Card Layer

**Status:** Aberto  
**Prioridade:** Média.

A identidade técnica do piloto do Guerreiro está estabilizada. Ainda faltam teste no ambiente publicado, clareza infantil e critério de encerramento do piloto.

## PT-010 — Higiene do acervo documental

**Status:** Parcial  
**Prioridade:** Média para governança.

Concluído:

- correção dos pontos de entrada iniciais;
- remoção de arquivos manifestamente falsos no PR #279;
- política do Projeto ChatGPT;
- reconciliação da visão híbrida de cartas;
- migração de planos e auditorias datadas no PR #280;
- índices de `docs/archive/`, `docs/archive/audits/` e `docs/legacy/`;
- redirecionamentos para caminhos históricos;
- correção das instruções ativas de agentes e dados;
- classificação dos documentos conflitantes do catálogo v3.

Pendente:

- executar PT-003 em PR próprio;
- classificar outros planos concluídos individualmente;
- atualizar e consolidar o Google Drive;
- migrar conteúdo útil e executar limpeza manual do Projeto ChatGPT.

Fontes:

- `docs/INFORMATION_HYGIENE_AUDIT_2026-07.md`;
- `docs/reports/HISTORICAL_DOCUMENT_ARCHIVE_2026-07.md`;
- `docs/reports/ACTIVE_AUTHORITY_HOTFIX_2026-07.md`.
