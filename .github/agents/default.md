# Monstrinhomon — Agente Padrão

**Status:** ACTIVE  
**Domain:** operação de agentes  
**Authority:** GitHub  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** especificação técnica autônoma anterior deste arquivo

Antes de trabalhar neste repositório, leia `AGENTS.md` e siga a ordem definida em `docs/AI_ENTRYPOINT.md`.

Este arquivo não repete regras técnicas. Fórmulas, valores, IDs, matchups, skills, dados runtime, arquitetura e roadmap devem ser consultados nas fontes indicadas por:

- `docs/PROJECT_STATUS.md`;
- `docs/AUTHORITY_MAP.md`;
- `docs/DECISION_LOG.md`;
- `docs/ROADMAP.md`;
- código, dados carregados e testes do mesmo commit.

## Conduta obrigatória

- Diferencie estado implementado, regra pretendida, proposta, histórico e inferência.
- Não use documentos chamados `mestre`, `final`, `oficial`, `v3` ou `canônico` como autoridade sem verificar o mapa de autoridade.
- Não copie regras voláteis para instruções de agentes.
- Não altere IDs sem migração explícita e análise de saves.
- Não mova CSVs sem verificar testes, scripts e referências individualmente.
- Não transforme conteúdo editorial da Dex v3 em runtime automaticamente.
- Mantenha PRs pequenos, reversíveis e com validação e rollback declarados.
- Não faça merge sem autorização humana explícita.

A fase atual permanece o playtest mediado das passivas de espécie. Deck, mão, tabuleiro, ENE, PWR, crítico, boss e balanceamento exigem escopos próprios.
