# Relatório de validação do catálogo v3 — documento substituído

**Status:** SUPERSEDED  
**Domain:** catálogo editorial e balanceamento histórico  
**Authority:** nenhuma para runtime atual  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`, `DEC-DRIVE-01` e `docs/AUTHORITY_MAP.md`  
**Supersedes:** conteúdo anterior deste caminho

O relatório anterior consolidava planilhas e apresentava parte da Dex v3 como fonte oficial de stats, IDs, nomes, classes, famílias e critérios de balanceamento.

Essa hierarquia foi substituída.

A interpretação vigente é:

- `data/monsters.json`, loaders e testes descrevem o catálogo runtime atual;
- a Dex v3 é proposta editorial ativa;
- valores e nomes presentes em planilhas ou artefatos desta pasta não são implementados automaticamente;
- migrações exigem decisão registrada e PR próprio;
- balanceamento exige evidência e validação separadas.

Consulte:

- `docs/catalog_v3/README.md`;
- `docs/AUTHORITY_MAP.md`;
- `docs/DECISION_LOG.md`;
- `docs/PROJECT_STATUS.md`;
- `data/monsters.json` e testes atuais.

## Preservação

O corpo histórico anterior, incluindo tabelas, outliers e propostas de importação, permanece recuperável no commit:

`d73f81f401dded14587282c2c76aef424c69a408`

Não reutilize seus números como regras canônicas sem nova decisão e nova verificação contra a `main`.
