---
description: "Auditoria obrigatória para CSVs da raiz do Monstrinhomon"
applyTo: "*.csv"
---

# CSVs da raiz — Instruções obrigatórias

**Status:** ACTIVE  
**Domain:** dados, fixtures e legado  
**Authority:** GitHub  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`

Os CSVs da raiz não são a fonte runtime principal e não formam um bloco homogêneo.

Alguns são lidos por testes ou funcionam como contratos paralelos. Outros são artefatos históricos, propostas ou legado inerte. A classificação deve ser individual.

## Antes de editar, mover ou remover

1. leia `AGENTS.md` e `docs/AI_ENTRYPOINT.md`;
2. consulte `docs/AUTHORITY_MAP.md` e `docs/PENDENCIAS_TECNICAS.md`;
3. busque leituras no runtime;
4. busque leituras em testes;
5. busque scripts, geradores e comentários de origem;
6. compare o conteúdo com a fonte runtime efetiva;
7. verifique referências documentais e conteúdo exclusivo;
8. avalie compatibilidade de saves e IDs;
9. classifique o arquivo;
10. declare validação e rollback.

## Classificações permitidas

- `RUNTIME_SOURCE`;
- `TEST_FIXTURE`;
- `PARALLEL_CONTRACT`;
- `GENERATED_ARTIFACT`;
- `HISTORICAL`;
- `LEGACY_INERT`;
- `UNKNOWN`.

Não mova ou apague arquivos `TEST_FIXTURE`, `PARALLEL_CONTRACT` ou `UNKNOWN` sem atualizar consumidores e testes.

## Limites

Não:

- transformar CSV antigo em fonte canônica por conveniência;
- copiar valores do CSV para runtime sem decisão;
- alterar balanceamento dentro de uma limpeza documental;
- migrar dados da Dex v3 automaticamente;
- remover vários CSVs em lote sem matriz de dependências;
- fazer merge automático.

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

A consolidação dos CSVs deve ocorrer em PR próprio, conforme `PT-003`.
