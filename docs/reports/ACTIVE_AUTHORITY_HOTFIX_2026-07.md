# Relatório — Correção de Fontes Ativas e Instruções de IA

**Status:** ACTIVE  
**Domain:** governança técnica  
**Authority:** GitHub  
**Data:** 2026-07-30  
**Base verificada:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Branch:** `docs/active-authority-hotfix-281`  
**PR:** #281

## 1. Objetivo

Corrigir fontes ativas capazes de orientar agentes com fórmulas, valores, IDs, quantidade de classes, estado ou autoridades obsoletas.

A execução não altera runtime, JSON, CSV, testes, regras ou balanceamento.

## 2. Preflight

- `main` verificada em `d73f81f401dded14587282c2c76aef424c69a408`;
- marco: merge do PR #280;
- nenhum PR aberto encontrado antes da criação da branch;
- pontos de entrada, instruções de agentes, guias de dados e documentos do catálogo v3 revisados;
- fase atual confirmada: playtest mediado das passivas de espécie.

## 3. Problemas confirmados

| ID | Fonte | Problema | Risco |
|---|---|---|---|
| `AA-01` | `.github/copilot-instructions.md` | mantinha fórmulas, valores, sete classes, IDs fictícios e arquitetura antiga | agente implementar regra revogada |
| `AA-02` | `.github/agents/default.md` | duplicava a mesma especificação antiga | duas fontes concorrentes |
| `AA-03` | `.github/instructions/data.instructions.md` | inventava schemas e padrões de ID; tratava CSVs genericamente | alteração de dados incompatível |
| `AA-04` | `data/README.md` | dizia que dados estruturados eram migração futura e citava sete classes | contribuição guiada por estado falso |
| `AA-05` | `AGENTS.md` | chamava CSVs da raiz de legado inerte | remoção quebrar testes e contratos |
| `AA-06` | `PROJECT_STATUS.md` | ainda apontava para PR #279 e SHA anterior | baseline temporal incorreta |
| `AA-07` | política do Projeto ChatGPT | `VerifiedAgainst` anterior aos PRs #279/#280 | contexto desatualizado |
| `AA-08` | plano e relatório do catálogo v3 | declaravam Dex/planilhas como fonte oficial de stats e IDs | migração ou rebalanceamento indevido |

## 4. Alterações executadas

### Wrappers de agentes

- `.github/copilot-instructions.md` reduzido a ponto de entrada;
- `.github/agents/default.md` reduzido a ponto de entrada;
- fórmulas, thresholds, constantes, classes e IDs copiados removidos;
- ordem de leitura e limites preservados.

### Processo de dados

- `.github/instructions/data.instructions.md` reescrito como processo baseado em autoridade, loader, schema, testes, saves e rollback;
- criado `.github/instructions/root-csv.instructions.md` com `applyTo: "*.csv"` para cobrir CSVs da raiz;
- `data/README.md` atualizado para o diretório estruturado atual;
- CSVs passaram a ser classificados individualmente;
- `AGENTS.md`, `AUTHORITY_MAP.md` e `PENDENCIAS_TECNICAS.md` alinhados.

### Estado e contexto

- `docs/PROJECT_STATUS.md` atualizado para a base pós-PR #280;
- `docs/CHATGPT_PROJECT_CONTEXT_POLICY.md` atualizado para a mesma baseline;
- visão híbrida de cartas e fase atual preservadas;
- a regra de que Animalista possui matchups explícitos e não deve ser presumido neutro foi mantida de forma inequívoca.

### Catálogo v3

- criado `docs/catalog_v3/README.md`;
- plano de implementação antigo classificado `SUPERSEDED`;
- relatório de consolidação antigo classificado `SUPERSEDED`;
- solução de bloqueios classificada `ACTIVE_REFERENCE`;
- arquivos realmente versionados separados de saídas apenas potencialmente geradas;
- corpos anteriores preservados no histórico do commit-base;
- nenhuma importação ou alteração de catálogo executada.

### Processo reproduzível

- prompt versionado em `docs/prompts/PROMPT_CORRECAO_FONTES_ATIVAS_INSTRUCOES_IA_2026_07.md`;
- prompt atualizado para incorporar as correções encontradas durante a revisão.

## 5. Conteúdo histórico preservado

Os corpos substituídos dos documentos do catálogo v3 permanecem recuperáveis no commit:

`d73f81f401dded14587282c2c76aef424c69a408`

A working tree ativa mantém redirecionamentos e classificação, não as afirmações concorrentes.

## 6. Fora de escopo respeitado

Não foram alterados:

- código JavaScript;
- JSON ou CSV;
- testes;
- fórmula de combate;
- PWR, ENE, crítico, passivas ou boss;
- matchups;
- IDs ou saves;
- deck, mão ou tabuleiro;
- Drive;
- arquivos do Projeto ChatGPT.

## 7. Validação documental

Critérios revisados na branch:

- wrappers não contêm fórmulas ou tabelas de balanceamento;
- instruções não afirmam sete classes;
- exemplos fictícios de IDs foram removidos das instruções atualizadas;
- CSVs não são chamados genericamente de inertes;
- CSVs da raiz recebem instrução própria por `applyTo: "*.csv"`;
- Dex v3 não é fonte runtime automática;
- o índice v3 não apresenta saídas inexistentes como arquivos versionados;
- Animalista não pode ser interpretado como neutro;
- `monsters.bootstrap.json` não é descrito como fallback de produção;
- próximo portão continua sendo o playtest das passivas;
- diff limitado a documentação e instruções.

## 8. Validação técnica

Uma execução completa do CI do PR #281 concluiu com sucesso antes das últimas correções documentais:

```text
npm test: PASS
npm run test:wild-loop:vitest: PASS
npm run validate-data: PASS
npm run validate:monster-assets: PASS
npm run test:wild-loop: PASS
```

O CI do head definitivo deve repetir a validação antes do merge.

## 9. Revisão

As observações válidas foram incorporadas:

1. `monsters.bootstrap.json` deixou de ser descrito como fallback de produção e passou a fixture/artefato auxiliar;
2. a redação explícita de Animalista não neutro foi restaurada no mapa de autoridade;
3. foi criada instrução própria para CSVs da raiz;
4. saídas JSON não versionadas deixaram de ser listadas como arquivos existentes;
5. o placeholder do número do PR foi substituído por `#281`.

As threads correspondentes devem estar resolvidas antes da conclusão final.

## 10. Riscos restantes

1. CSVs continuam em contratos paralelos; PT-003 exige PR próprio.
2. Portal e estrutura do Drive continuam desatualizados.
3. Anexos antigos permanecem no Projeto ChatGPT até migração manual.
4. Outros planos de migração podem precisar de classificação individual.
5. `DEC-AUTH-01` e `DEC-AUTH-02` permanecem pendentes.

## 11. Rollback

- reverter os commits da branch ou o futuro merge;
- recuperar corpos substituídos pelo commit-base;
- nenhum rollback de runtime ou dados é necessário.

## 12. Próximo passo recomendado

Após integração desta Onda 0:

1. atualizar o Portal do Drive;
2. consolidar as duas raízes `Monstrinhomon`;
3. mover documentos para a árvore operacional;
4. comparar integralmente as duas planilhas duplicadas;
5. preencher Visão, Decisões e Playtests;
6. tratar CSVs em PR técnico separado.

## 13. Classificação final

`A. Fontes ativas convergem para a governança atual; runtime e dados não foram alterados.`
