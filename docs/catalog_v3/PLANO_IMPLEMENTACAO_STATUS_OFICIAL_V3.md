# Plano de implementação do catálogo v3 — documento substituído

**Status:** SUPERSEDED  
**Domain:** catálogo editorial e migração histórica  
**Authority:** nenhuma para runtime atual  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`, `DEC-DRIVE-01` e `docs/AUTHORITY_MAP.md`  
**Supersedes:** conteúdo anterior deste caminho

O plano anterior declarava artefatos da Dex v3 como fonte oficial de stats e propunha uma sequência de importação. Essa interpretação não representa a governança atual.

A Dex v3 permanece uma proposta editorial ativa. Ela não altera automaticamente runtime, IDs, atributos, classes, raridades, evolução, sprites ou saves.

Consulte:

- `docs/catalog_v3/README.md`;
- `docs/AUTHORITY_MAP.md`;
- `docs/DECISION_LOG.md`;
- `docs/PROJECT_STATUS.md`;
- `data/monsters.json` e loaders atuais para o estado implementado.

Qualquer migração exige decisão humana registrada, PR específico, compatibilidade, testes e rollback.

## Preservação

O corpo histórico anterior permanece recuperável no commit:

`d73f81f401dded14587282c2c76aef424c69a408`

Este caminho não deve voltar a ser usado como roadmap atual ou fonte de stats.
