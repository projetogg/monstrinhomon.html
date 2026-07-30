# PROMPT OPERACIONAL — AUDITORIA DE HIGIENE INFORMACIONAL

**Status:** ACTIVE  
**Domain:** governança de contexto  
**Authority:** GitHub  
**VerifiedAgainst:** `b14dceb5438911ce93741fa4b722895ab9ffa8eb`  
**Supersedes:** nenhum

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Auditar toda a informação usada por ChatGPT, Claude e pelo responsável humano no projeto Monstrinhomon para reduzir o risco de:

- usar regras antigas como se fossem atuais;
- criar fontes de verdade concorrentes;
- repetir tarefas já concluídas;
- implementar a partir de planos históricos;
- misturar proposta editorial, visão de produto e comportamento runtime;
- produzir retrabalho por documentação desatualizada.

A auditoria deve cobrir:

1. GitHub;
2. arquivos anexados ou mantidos no Projeto RPG do ChatGPT;
3. instruções do projeto no ChatGPT;
4. documentos do Google Drive citados pela governança;
5. documentos históricos, planos, auditorias e protótipos.

## Princípio de autoridade

- GitHub: código, dados runtime, testes, arquitetura técnica e regras canônicas aprovadas.
- Google Drive: visão do produto, decisões em discussão, playtests, observações terapêuticas, referências visuais e demandas.
- Projeto do ChatGPT: ponto de entrada e material de trabalho, nunca uma cópia técnica independente do GitHub.

## Ordem obrigatória de verificação

1. SHA atual da `main`.
2. PRs abertos relevantes.
3. `README.md`.
4. `docs/AI_ENTRYPOINT.md`.
5. `docs/PROJECT_STATUS.md`.
6. `docs/AUTHORITY_MAP.md`.
7. `docs/DECISION_LOG.md`.
8. `docs/ROADMAP.md`.
9. código, dados e testes do domínio.
10. documentos históricos apenas depois das fontes atuais.

## Classificações permitidas

### `KEEP_ACTIVE`

Documento atual, necessário e corretamente posicionado.

### `COMPLETE_NOW`

Documento vigente, mas incompleto ou desatualizado de forma material.

### `ARCHIVE`

Documento útil como evidência histórica, mas perigoso no conjunto ativo.

### `DELETE_ACTIVE_COPY`

Cópia redundante, quebrada ou suficientemente enganosa para não permanecer entre os pontos de entrada ativos. O histórico Git ou um arquivo histórico pode preservar a evidência.

### `SEPARATE_EXPERIMENT`

Material válido apenas como hipótese ou projeto paralelo, que não pode permanecer misturado ao contexto canônico.

### `HUMAN_DECISION`

A ação depende do autor porque pode alterar produto, nomenclatura ou regra.

## Auditoria do GitHub

Para cada documento:

- registrar caminho;
- registrar data ou marco retratado;
- verificar se se autodeclara fonte oficial;
- comparar afirmações com a `main`, testes e PRs recentes;
- verificar links quebrados;
- verificar referências de entrada;
- classificar;
- indicar ação segura;
- indicar risco de remoção;
- indicar rollback.

Tratar com atenção especial:

- `AGENTS.md`;
- `GAME_RULES.md`;
- `LEIA-ME.md`;
- `TODO_FUNCIONALIDADES.md`;
- `PROXIMOS_PASSOS.md`;
- `docs/ANALISE_PROJETO.md`;
- `docs/PLANO_DE_ACAO.md`;
- `docs/PENDENCIAS_TECNICAS.md`;
- auditorias datadas;
- arquivos em `docs/archive/` e `docs/legacy/`;
- documentos com “mestre”, “final”, “completo”, “roadmap”, “plano” ou “próximos passos” no nome.

## Auditoria do Projeto RPG no ChatGPT

Classificar arquivos que possam ser recuperados automaticamente como contexto.

Atenção especial para:

- documentos-mestre antigos;
- análises de estado do código;
- relatórios com contagem antiga de testes;
- cópias de regras técnicas;
- protótipos HTML isolados;
- versões duplicadas do sistema de cartas;
- prompts antigos que prescrevem features já concluídas.

Para cada arquivo, decidir:

- manter no projeto ativo;
- extrair conteúdo de produto para o Drive;
- mover para projeto separado;
- apagar a cópia ativa;
- manter apenas como histórico fora do contexto automático.

## Conteúdo mínimo das instruções do Projeto ChatGPT

As instruções devem:

- apontar para `docs/AI_ENTRYPOINT.md`;
- exigir consulta à `main` e aos PRs recentes;
- declarar GitHub como autoridade técnica;
- proibir assumir que anexos antigos estão atualizados;
- proibir copiar regras técnicas para a memória do projeto;
- indicar a fase atual sem duplicar detalhes voláteis;
- exigir separação entre fato, inferência, recomendação e decisão pendente.

## Segurança de remoção

Não apagar automaticamente quando:

- houver dependência ativa não verificada;
- o arquivo contiver decisão humana única ainda não migrada;
- a remoção quebrar links atuais;
- não existir cópia histórica ou histórico Git suficiente;
- o arquivo for necessário para auditoria, compliance ou rollback.

Antes de apagar no GitHub:

1. buscar referências ao caminho;
2. verificar se é carregado pelo runtime ou por scripts;
3. confirmar que o conteúdo está substituído;
4. registrar motivo no PR;
5. declarar rollback.

## Entregas

1. diagnóstico geral;
2. inventário GitHub por classificação;
3. inventário do Projeto ChatGPT por classificação;
4. informações que precisam ser preenchidas agora;
5. arquivos que devem ser apagados da área ativa;
6. arquivos que devem ser arquivados;
7. documentos que precisam ser atualizados;
8. política de contexto do Projeto ChatGPT;
9. sequência de PRs pequenos;
10. critérios de aceitação.

## Limites

Este trabalho não deve:

- alterar regras do jogo;
- alterar runtime;
- alterar dados;
- alterar valores de balanceamento;
- transformar propostas do Drive em decisões;
- apagar evidência histórica sem substituição;
- tratar o nome “Documento Mestre” como prova de autoridade.

## Primeiro PR permitido

O primeiro PR deve:

- criar o relatório de higiene informacional;
- corrigir pontos de entrada ativos manifestamente desatualizados;
- atualizar estados de decisões já implementadas;
- substituir redirecionamentos obsoletos;
- remover apenas arquivos ativos comprovadamente quebrados ou falsos;
- preservar a migração ampla de arquivos históricos para PR posterior.

## Classificação final

Finalizar com uma destas opções:

```text
A. Pontos de entrada corrigidos; limpeza histórica restante está isolada
B. Risco ativo permanece porque decisões ou dependências impedem a limpeza
C. Evidência insuficiente para classificar o acervo
```

Não fazer merge sem autorização humana explícita.
