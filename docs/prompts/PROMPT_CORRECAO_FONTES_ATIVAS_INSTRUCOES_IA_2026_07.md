# Prompt Operacional — Correção de Fontes Ativas e Instruções de IA

**Status:** ACTIVE  
**Domain:** governança técnica  
**Authority:** GitHub  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** versões anteriores do prompt de Onda 0 que tratavam CSVs ou catálogo v3 de forma genérica

## 1. Missão

Executar a Onda 0 da auditoria integrada do Monstrinhomon: corrigir somente arquivos ativos que possam orientar humanos ou IAs com estado, fórmulas, IDs, valores, hierarquias ou autoridades obsoletas.

O resultado deve fazer todas as instruções operacionais convergirem para a governança atual sem alterar runtime, dados, regras, balanceamento ou fase de produto.

## 2. Princípios obrigatórios

1. GitHub `main`, dados efetivamente carregados e testes do mesmo commit descrevem o estado implementado.
2. Decisões `APPROVED` ou `IMPLEMENTED` e documentos canônicos vinculados descrevem a regra pretendida.
3. Google Drive organiza produto, discussão, playtests e referências; não substitui runtime.
4. Projeto ChatGPT preserva contexto e intenção, mas não é fonte técnica autônoma.
5. Uma limitação de fase não revoga silenciosamente uma visão de produto aprovada.
6. Arquivo antigo não se torna vigente por conter `oficial`, `mestre`, `final`, `v3` ou `canônico` no título.
7. Não copiar fórmulas, thresholds, listas de skills, matchups, números de balanceamento ou roadmap técnico para instruções de agentes.
8. CSVs da raiz não devem ser classificados em bloco: alguns são fixtures ou contratos de teste, outros são históricos ou legados.
9. Conteúdo editorial da Dex v3 não altera automaticamente IDs, atributos, classes, evolução ou runtime.
10. Toda mudança deve ser pequena, reversível e rastreável.

## 3. Preflight obrigatório

Antes de editar:

1. confirmar o SHA atual da `main`;
2. listar PRs abertos;
3. ler, nesta ordem:
   - `README.md`;
   - `docs/AI_ENTRYPOINT.md`;
   - `docs/PROJECT_STATUS.md`;
   - `docs/AUTHORITY_MAP.md`;
   - `docs/DECISION_LOG.md`;
   - `docs/ROADMAP.md`;
   - `docs/PENDENCIAS_TECNICAS.md`;
4. verificar `AGENTS.md` e todas as instruções em `.github/`;
5. verificar os loaders, dados e testes citados pelas instruções;
6. examinar `DEC-DRIVE-01` e os documentos de `docs/catalog_v3/`;
7. registrar base, data, PRs abertos e limitações.

Interromper se a `main` mudar materialmente durante a execução.

## 4. Matriz de evidência antes da edição

Para cada arquivo candidato, registrar:

| Campo | Conteúdo |
|---|---|
| caminho | arquivo ativo |
| função | instrução, estado, índice, relatório ou proposta |
| afirmação problemática | trecho materialmente incorreto |
| fonte que contradiz | runtime, dados, testes ou decisão |
| risco | como pode causar retrabalho |
| ação | atualizar, reduzir a wrapper ou classificar |
| preservação | como manter histórico |
| fora de escopo | o que não será alterado |

Não editar apenas por idade ou nome.

## 5. Escopo autorizado

### 5.1 Estado e política

Atualizar:

- `docs/PROJECT_STATUS.md` para a `main` verificada;
- `docs/CHATGPT_PROJECT_CONTEXT_POLICY.md` para a baseline verificada.

Não transformar PR aberto em estado implementado.

### 5.2 Instruções de agentes

Reduzir a wrappers operacionais:

- `.github/copilot-instructions.md`;
- `.github/agents/default.md`.

As wrappers devem:

- apontar para `AGENTS.md` e `docs/AI_ENTRYPOINT.md`;
- exigir leitura de `PROJECT_STATUS`, `AUTHORITY_MAP`, `DECISION_LOG` e `ROADMAP`;
- exigir inspeção de código, dados carregados e testes do domínio;
- proibir cópias locais de regras voláteis;
- exigir PR pequeno, validação, compatibilidade e rollback;
- preservar o playtest mediado das passivas como fase atual.

Não repetir fórmulas, matchups, classes, IDs, thresholds ou constantes.

### 5.3 Instruções de dados

Reescrever `.github/instructions/data.instructions.md` como guia de processo.

Antes de editar dados, exigir:

1. identificar a autoridade do domínio;
2. identificar loader e fallback;
3. identificar schema e validação;
4. identificar testes e scripts consumidores;
5. verificar compatibilidade com saves e referências;
6. separar mudança editorial, técnica e de balanceamento;
7. declarar rollback.

Declarar explicitamente:

> Os CSVs da raiz não são a fonte runtime principal. Alguns são consumidos por testes, auditorias ou módulos como contratos paralelos ou históricos. Nenhum CSV deve ser movido ou removido sem auditoria individual de runtime, testes, scripts e referências.

### 5.4 Diretório `data/`

Reescrever `data/README.md` para descrever:

- finalidade atual;
- fontes carregadas por domínio;
- loaders e fallbacks;
- validação;
- compatibilidade de IDs e saves;
- diferença entre runtime, design, fixture e legado.

Não inventar schema nem padrões de ID.

### 5.5 `AGENTS.md`

Corrigir somente a classificação genérica dos CSVs, salvo nova evidência material.

### 5.6 Catálogo v3

Criar um índice de autoridade em `docs/catalog_v3/README.md`.

Classificar:

- `PLANO_IMPLEMENTACAO_STATUS_OFICIAL_V3.md`: `SUPERSEDED`;
- `monstrinhomon_relatorio_validacao.md`: `SUPERSEDED`;
- `SOLUCAO_BLOQUEIOS_V3.md`: referência técnica, sem autoridade automática sobre runtime;
- CSV/JSON/patches gerados: proposta ou artefato de migração, conforme uso atual.

Os dois documentos `SUPERSEDED` devem virar redirecionamentos curtos. O corpo anterior permanece recuperável no commit-base e no histórico Git.

Não importar, recalibrar ou renomear dados.

## 6. Fora de escopo

Não:

- alterar JavaScript runtime;
- alterar JSON ou CSV;
- alterar testes;
- alterar fórmula, PWR, ENE, crítico, passivas ou boss;
- implementar deck, mão ou tabuleiro;
- migrar nomes da Dex;
- mover ou apagar CSVs;
- reorganizar o Drive;
- remover anexos do Projeto ChatGPT;
- encerrar decisões humanas pendentes;
- fazer merge automático.

## 7. Critérios de aceitação documental

A execução passa somente se:

1. nenhuma instrução ativa mantiver fórmula de combate copiada;
2. nenhuma instrução ativa mantiver thresholds ou tabelas de balanceamento;
3. nenhuma instrução ativa inventar padrões de IDs;
4. nenhuma instrução ativa afirmar sete classes;
5. `PROJECT_STATUS.md` registrar a base verificada;
6. a política do Projeto ChatGPT registrar a base verificada;
7. CSVs forem descritos por função, não como bloco inerte;
8. a Dex v3 não for descrita como fonte runtime automática;
9. os documentos conflitantes do catálogo estiverem `SUPERSEDED`;
10. a visão híbrida de cartas permanecer preservada;
11. o playtest das passivas permanecer como próximo portão;
12. o diff não tocar runtime, dados ou testes.

## 8. Buscas de controle

Revisar ocorrências ativas de:

- fórmula unilateral antiga de acerto;
- dano simplificado antigo;
- exemplos fictícios de IDs;
- afirmações de sete classes;
- `fonte oficial de stats` para a Dex v3;
- `hardcoded no index.html` como estado atual;
- `CSVs raiz são legado inerte`.

Classificar cada ocorrência restante como ativa, histórica, fixture, teste ou comentário. Não editar automaticamente `docs/archive/` ou `docs/legacy/`.

## 9. Validação

Executar ou acompanhar no CI:

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando disponível:

```bash
npm run test:wild-loop
```

Como a mudança é documental, uma falha deve ser investigada antes de concluir que é não relacionada.

## 10. Entregas

Criar:

- `docs/reports/ACTIVE_AUTHORITY_HOTFIX_2026-07.md`;
- `docs/catalog_v3/README.md`;
- este prompt versionado.

O relatório deve separar:

- fatos verificados;
- alterações executadas;
- conteúdo histórico preservado;
- riscos restantes;
- próximos PRs;
- decisões dependentes do autor.

## 11. Estrutura do PR

Título:

```text
docs(governance): corrigir fontes ativas e instruções de agentes
```

O PR deve declarar:

- base verificada;
- ausência de PRs concorrentes ou conflitos encontrados;
- lista de arquivos;
- ausência de mudanças em runtime, dados e regras;
- validação;
- riscos;
- rollback;
- próximo passo separado.

## 12. Portão final

Ao concluir:

1. revisar o diff completo;
2. abrir o PR fora de draft;
3. acompanhar CI e revisão;
4. corrigir somente observações dentro do escopo;
5. parar.

Não fazer merge sem autorização humana explícita.

## 13. Classificação final

Usar uma opção:

```text
A. Fontes ativas convergem para a governança atual; runtime e dados não foram alterados
B. Correção parcial; permanecem fontes ativas que exigem PR separado
C. Conflito de autoridade exige decisão humana antes de editar
D. Impacto potencial em runtime, dados ou testes interrompeu a execução
```
