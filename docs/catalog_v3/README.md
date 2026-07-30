# Catálogo v3 — Índice de Autoridade

**Status:** ACTIVE  
**Domain:** catálogo editorial e migração técnica  
**Authority:** GitHub para estado técnico; Drive para proposta editorial  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`, `DEC-DRIVE-01` e `docs/AUTHORITY_MAP.md`  
**Supersedes:** interpretações que tratavam os artefatos desta pasta como fonte automática do runtime

## Regra principal

A Dex v3 é uma proposta editorial ativa. Ela organiza nomes, famílias, referências visuais, expansão e lacunas de arte.

Ela não altera automaticamente:

- IDs runtime;
- nomes já carregados;
- atributos;
- classes;
- raridades;
- evolução;
- sprites;
- flags de ativação;
- saves;
- balanceamento.

Para responder o que o jogo faz hoje, use `data/monsters.json`, loaders, testes e a `main` do mesmo commit.

Para migrar qualquer conteúdo da Dex v3, são necessários decisão registrada, PR específico, compatibilidade, validação e rollback.

## Arquivos atualmente versionados e classificados

| Arquivo | Classificação | Tratamento |
|---|---|---|
| `PLANO_IMPLEMENTACAO_STATUS_OFICIAL_V3.md` | `SUPERSEDED` | plano histórico; não é roadmap atual nem fonte de stats |
| `monstrinhomon_relatorio_validacao.md` | `SUPERSEDED` | relatório histórico de consolidação; números não governam runtime |
| `SOLUCAO_BLOQUEIOS_V3.md` | `ACTIVE_REFERENCE` | documenta riscos e tooling; não autoriza importação automática |
| `monstrinhomon_status_oficial.csv` | `PROPOSAL_ARTIFACT` | dados de proposta/migração; não carregados automaticamente |
| scripts de geração relacionados | `TOOLING` | só alteram runtime quando executados em fluxo aprovado e o resultado é integrado |

## Saídas potenciais de geração

O script relacionado ao catálogo pode produzir artefatos derivados, incluindo representações JSON e patches de migração. Esses nomes aparecem em documentos históricos, mas não devem ser presumidos como arquivos atualmente versionados.

Antes de citar ou usar uma saída gerada:

1. confirme que o arquivo existe na branch examinada;
2. confirme qual script o gerou;
3. registre entrada, comando e commit;
4. compare a saída com `data/monsters.json` e testes atuais;
5. não trate a geração como autorização de importação.

## Fontes vigentes

- Estado implementado: `data/monsters.json` e loaders atuais.
- Autoridade geral: `docs/AUTHORITY_MAP.md`.
- Decisões: `docs/DECISION_LOG.md`.
- Estado: `docs/PROJECT_STATUS.md`.
- Decisão editorial: `DEC-DRIVE-01` no Google Drive.

## Nomes editoriais

A marcação editorial `canonical` na Dex significa aprovação editorial do nome dentro da proposta. Ela não significa que o nome já foi migrado para a `main`.

Quando houver divergência:

1. registrar o nome editorial e o nome runtime;
2. avaliar IDs, saves, assets, referências e evolução;
3. obter decisão humana;
4. criar PR próprio;
5. validar compatibilidade e rollback;
6. atualizar `docs/DECISION_LOG.md` e `docs/PROJECT_STATUS.md` somente após merge.

## Preservação histórica

Os corpos anteriores dos documentos `SUPERSEDED` permanecem no histórico Git do commit-base:

`d73f81f401dded14587282c2c76aef424c69a408`

Não restaurar esses corpos em caminhos ativos sem nova auditoria de autoridade.
