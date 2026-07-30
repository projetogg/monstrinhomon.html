# Monstrinhomon — Instruções do Copilot

**Status:** ACTIVE  
**Domain:** operação de agentes  
**Authority:** GitHub  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** especificação técnica autônoma anterior deste arquivo

Este arquivo é apenas um ponto de entrada. Ele não é fonte autônoma de regras, fórmulas, valores, IDs, matchups, arquitetura ou roadmap.

## Ordem obrigatória de leitura

1. `AGENTS.md`;
2. `docs/AI_ENTRYPOINT.md`;
3. `docs/PROJECT_STATUS.md`;
4. `docs/AUTHORITY_MAP.md`;
5. `docs/DECISION_LOG.md`;
6. `docs/ROADMAP.md`;
7. código, dados efetivamente carregados e testes do domínio;
8. PRs recentes relevantes.

## Regras operacionais

- Para descrever o que existe hoje, use a `main`, os dados carregados e os testes do mesmo commit.
- Para descrever o que deve existir, use decisões humanas registradas e documentos canônicos vinculados.
- Não copie para este arquivo fórmulas, thresholds, constantes, listas de skills, classes, nomes runtime ou estado de implementação.
- Não transforme proposta do Drive, anexo do ChatGPT ou documento histórico em regra implementada.
- Não interprete uma limitação temporária de fase como abandono de uma visão de produto aprovada.
- Antes de editar dados, identifique loader, schema, validação, testes, compatibilidade de saves e autoridade do domínio.
- CSVs da raiz exigem auditoria individual: alguns são fixtures ou contratos de teste, outros são históricos ou legados.
- Prefira PRs pequenos, isolados e reversíveis.
- Declare validação, riscos e rollback.
- Não faça merge automático.

## Fase atual

O próximo portão é o playtest mediado das passivas de espécie. Isso não autoriza alterar valores, iniciar deck/mão/tabuleiro ou misturar balanceamento com higiene documental.

## Validação mínima

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
