# Catálogo v3 — referência de bloqueios e ponte técnica

**Status:** ACTIVE_REFERENCE  
**Domain:** migração técnica potencial  
**Authority:** GitHub somente para os artefatos técnicos verificados; nenhuma autoridade automática sobre runtime ou produto  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`, `DEC-DRIVE-01` e `docs/AUTHORITY_MAP.md`  
**Supersedes:** interpretação anterior de que a existência da ponte autorizava ativação do catálogo v3

## Função deste documento

Este documento registra riscos e ferramentas criadas para evitar uma importação destrutiva do catálogo v3.

Ele não aprova:

- hard replace de `data/monsters.json`;
- migração automática de nomes;
- mudança de IDs ou saves;
- importação de atributos;
- ativação de famílias;
- recalibração de balanceamento.

## Riscos historicamente identificados

- colisões entre IDs da proposta e IDs runtime;
- duplicidade de nomes;
- necessidade de remapeamento explícito;
- famílias sem arte ou validação;
- diferença entre `agi` editorial e `baseSpd` runtime;
- risco de tratar artefatos gerados como catálogo ativo.

## Artefatos relacionados

A `main` contém ferramentas e artefatos relacionados ao catálogo v3, incluindo script de geração e camada de resolução. A presença desses arquivos demonstra tooling, não autorização de migração.

Antes de usar qualquer artefato:

1. confirme que ele ainda existe e é reproduzível;
2. compare entrada e saída com a `main` atual;
3. verifique testes e compatibilidade de saves;
4. obtenha decisão humana registrada;
5. use PR isolado;
6. declare rollback.

## Autoridade vigente

- Runtime atual: `data/monsters.json`, loaders e testes.
- Proposta editorial: Dex v3 e `DEC-DRIVE-01`.
- Regras de conflito: `docs/AUTHORITY_MAP.md`.
- Decisões: `docs/DECISION_LOG.md`.
- Classificação desta pasta: `docs/catalog_v3/README.md`.

## Preservação histórica

A descrição técnica detalhada anterior permanece recuperável no commit:

`d73f81f401dded14587282c2c76aef424c69a408`

A retomada dessa proposta exige nova auditoria contra a `main`, não simples continuidade do plano antigo.
