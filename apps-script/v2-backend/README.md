# Monstrinhomon V2 — Backend Apps Script (Etapa 11)

**Status:** PROPOSAL / implementação estrutural em branch  
**Domain:** técnica  
**Authority:** GitHub quando mergeado  
**VerifiedAgainst:** base `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** nenhum

Esta pasta contém a fundação do backend operacional privado da V2. Ela **não substitui** `js/saveLayer.js`, `js/storage.js` ou `monstrinhomon_state`.

## Fronteira

```text
runtime atual -> SaveLayer/StorageManager -> localStorage

V2 operacional -> Apps Script Services -> Google Sheets privado
```

A sincronização entre os dois domínios exige adapter/contrato próprio e não faz parte da Etapa 11.

## Arquivos

- `appsscript.json`: manifesto mínimo.
- `SchemaRegistry.gs`: schema canônico versionado do backend.
- `Infrastructure.gs`: config, IDs, hashing, lock, gateway e repository genérico.
- `Services.gs`: auth, Players, Objectives, Sessions, Observations, Events, Operations e DTOs.
- `BackendAdmin.gs`: health check, integridade e seed DEV.
- `Bootstrap.gs`: bootstrap inicial privado para primeira configuração.

## Configuração necessária

O projeto Apps Script deve usar Script Properties:

- `V2_BACKEND_SPREADSHEET_ID`
- `V2_ENVIRONMENT` = `DEV` ou `PROD`
- `V2_RUNTIME_SOURCE_REF` = ref informativa da origem runtime

Não versionar IDs privados de planilha no repositório.

## Bootstrap

1. Crie/associe um projeto Apps Script a partir destes arquivos.
2. Execute manualmente `v2ConfigureAndBootstrap_(spreadsheetId, 'DEV')` no projeto DEV.
3. Repita em projeto/deployment PROD usando o Spreadsheet privado PROD.
4. O bootstrap cria headers ausentes sem destruir dados e adiciona o usuário ativo como `ADMIN` apenas se necessário.
5. Rode `v2HealthCheck()` e `v2IntegrityCheck()` antes de usar dados reais.

## Autenticação do MVP

Como o proprietário atual usa conta Google de consumidor (`gmail.com`), o MVP não deve depender de `Session.getActiveUser().getEmail()` em um Web App implantado para **executar como o desenvolvedor**, porque o e-mail do usuário pode ficar indisponível nesse contexto.

Direção adotada para o MVP:

- Web App executa como **usuário que acessa**;
- `Session.getActiveUser().getEmail()` identifica o usuário após autorização;
- `01_ACCESS` funciona como allowlist/role gate adicional;
- o backend continua privado;
- os usuários autorizados precisam das permissões Google necessárias para o Spreadsheet, pois a execução ocorre sob a identidade deles.

Documentação oficial:

- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/base/session

Uma arquitetura futura com execução como proprietário + autenticação própria pode remover a necessidade de compartilhar o backend com terapeutas, mas isso é uma decisão separada.

## Locking e concorrência

O backend usa `LockService.getScriptLock()` apenas em gravações críticas. Em Web Apps standalone, `getDocumentLock()` pode retornar `null`, portanto não é usado como lock principal.

Google Sheets não é tratado como banco ACID. A consistência depende de:

- write lock;
- IDs estáveis;
- `Version`/optimistic concurrency;
- idempotência por `Operations`;
- Event ledger append-only;
- reversal/correction em vez de overwrite histórico.

## Segurança

- `Adventure Mode` não é autenticação.
- DTO infantil não contém Objectives, Sessions, Observations ou notas.
- Não colocar dados identificáveis no GitHub.
- Não logar conteúdo terapêutico bruto sem necessidade.
- Não usar número da linha como identidade.
- Não editar Events ou ObjectiveVersions usados historicamente.

## Estado da Etapa 11

Esta fundação implementa schema, acesso, repositories e services básicos, mas **não implementa o motor terapêutico→lúdico**. A transformação `Observation -> Measurement -> Criterion -> Reward -> Event/State` pertence à Etapa 12.
