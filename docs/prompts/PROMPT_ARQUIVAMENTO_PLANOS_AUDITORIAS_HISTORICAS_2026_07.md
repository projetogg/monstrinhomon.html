# PROMPT OPERACIONAL — ARQUIVAMENTO DE PLANOS E AUDITORIAS HISTÓRICAS

**Status:** ACTIVE  
**Domain:** técnica  
**Authority:** GitHub  
**VerifiedAgainst:** `8615f27f369b13d36dece301ae1c1d4381c8bc8f`  
**Supersedes:** nenhum

## Repositório

`projetogg/monstrinhomon.html`

## Objetivo

Retirar planos e auditorias datadas dos caminhos ativos da documentação sem apagar evidência histórica, quebrar referências ou alterar runtime, dados, regras ou roadmap de produto.

A migração deve preservar o conteúdo original, criar índices históricos e substituir os caminhos antigos por redirecionamentos mínimos.

## Fontes obrigatórias

Antes de editar, consultar:

1. `docs/AI_ENTRYPOINT.md`;
2. `docs/PROJECT_STATUS.md`;
3. `docs/AUTHORITY_MAP.md`;
4. `docs/DECISION_LOG.md`;
5. `docs/ROADMAP.md`;
6. `docs/INFORMATION_HYGIENE_AUDIT_2026-07.md`;
7. referências existentes aos arquivos que serão movidos;
8. PRs abertos e merges recentes.

## Escopo permitido

Arquivar:

```text
docs/PLANO_DE_ACAO.md
→ docs/legacy/PLANO_DE_ACAO_2026-03.md

docs/AUDIT_REPORT.md
→ docs/archive/audits/AUDIT_REPORT_2026-04.md

docs/AUDIT_REPORT_2026-05.md
→ docs/archive/audits/AUDIT_REPORT_2026-05.md

docs/AUDIT_GENERAL_RISKS_2026-05.md
→ docs/archive/audits/AUDIT_GENERAL_RISKS_2026-05.md
```

Criar:

```text
docs/archive/README.md
docs/archive/audits/README.md
docs/legacy/README.md
docs/reports/HISTORICAL_DOCUMENT_ARCHIVE_2026-07.md
```

Atualizar somente os pontos de entrada que ficariam materialmente incorretos após a migração.

## Regras de preservação

1. O conteúdo histórico deve ser preservado integralmente no novo caminho.
2. O arquivo histórico não deve ser reescrito para parecer atual.
3. O caminho antigo deve virar um redirecionamento curto com status `SUPERSEDED`.
4. O redirecionamento deve apontar para o novo caminho e para os pontos de entrada atuais.
5. Links históricos não precisam ser reinterpretados como decisões vigentes.
6. O histórico Git continua sendo o rollback definitivo.

## Classificação

Os índices devem usar:

```text
Status: ACTIVE
Domain: técnica
Authority: GitHub
VerifiedAgainst: commit ou PR
Supersedes: nenhum
```

Os documentos arquivados são `HISTORICAL`, mesmo quando o conteúdo original não possui cabeçalho padronizado.

Os redirecionamentos nos caminhos antigos devem usar:

```text
Status: SUPERSEDED
Domain: técnica
Authority: GitHub
VerifiedAgainst: commit ou PR
Supersedes: conteúdo anterior deste caminho
```

## Auditoria de referências

Para cada origem:

1. buscar referências pelo caminho completo e pelo nome do arquivo;
2. classificar cada referência como ativa, histórica ou apenas descritiva;
3. atualizar referências ativas quando necessário;
4. manter compatibilidade por redirecionamento quando houver dúvida;
5. registrar qualquer referência que não possa ser atualizada com segurança.

## Atualização do estado

`docs/PROJECT_STATUS.md` deve:

- registrar o commit pós-PR #279 como base verificada;
- registrar a migração histórica;
- encerrar `DOC-HYGIENE-02` somente após o merge;
- manter o playtest mediado das passivas como próximo portão;
- não iniciar deck, mão ou tabuleiro.

`docs/AUTHORITY_MAP.md` deve:

- apontar o plano histórico para `docs/legacy/`;
- apontar auditorias datadas para `docs/archive/audits/`;
- manter `docs/archive/` e `docs/legacy/` fora da ordem de leitura atual.

## Fora de escopo

Não:

- alterar código;
- alterar dados runtime;
- alterar fórmulas ou balanceamento;
- decidir regras de cartas, deck, ENE ou tabuleiro;
- remover `GAME_RULES.md`;
- mover relatórios quantitativos recentes;
- mover documentos canônicos;
- classificar CSVs raiz neste PR;
- apagar definitivamente evidência histórica.

## Validação

Executar:

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando o ambiente permitir:

```bash
npm run test:wild-loop
```

Também verificar:

- os quatro destinos existem;
- os quatro caminhos antigos são redirecionamentos;
- índices históricos existem;
- pontos de entrada não chamam os arquivos movidos de estado atual;
- nenhuma referência ativa fica quebrada;
- o diff não contém runtime ou dados.

## Estrutura do PR

Título:

```text
docs(governance): arquivar planos e auditorias históricas
```

O PR deve declarar:

- base verificada;
- tabela origem → destino;
- referências revisadas;
- validação;
- riscos;
- rollback.

Não fazer merge sem autorização humana explícita.

## Classificação final

Finalizar com:

```text
A. Conteúdo histórico arquivado; caminhos ativos seguros e referências preservadas
B. Migração parcial; existem referências que exigem decisão humana
C. Evidência insuficiente para mover um ou mais documentos
```
