---
description: "Processo seguro para manipulação de dados do Monstrinhomon"
applyTo: "data/**/*"
---

# Instruções de Dados — Monstrinhomon

**Status:** ACTIVE  
**Domain:** dados e compatibilidade  
**Authority:** GitHub  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Supersedes:** exemplos de schema, IDs, faixas e constantes mantidos anteriormente neste arquivo

Este arquivo define processo para itens em `data/`. Ele não é fonte autônoma de schemas, valores, fórmulas, IDs, classes ou balanceamento.

Para CSVs localizados na raiz do repositório, aplica-se também:

`/.github/instructions/root-csv.instructions.md`

## 1. Ordem de verificação

Antes de editar qualquer dado:

1. leia `AGENTS.md` e `docs/AI_ENTRYPOINT.md`;
2. identifique a autoridade do domínio em `docs/AUTHORITY_MAP.md`;
3. verifique `docs/DECISION_LOG.md` e `docs/PROJECT_STATUS.md`;
4. identifique o loader realmente usado;
5. identifique tratamento de falha, normalização e consumidores;
6. identifique schema, validador e testes;
7. verifique referências cruzadas e compatibilidade com saves;
8. diferencie mudança editorial, manutenção técnica e balanceamento;
9. declare rollback antes de alterar IDs, estrutura ou relações.

## 2. Como determinar a fonte efetiva

Um arquivo não é canônico apenas porque está em `data/`, tem nome `oficial` ou usa JSON.

Para cada domínio, confirme:

- qual arquivo é carregado;
- qual loader o consome;
- como falhas de carregamento são tratadas;
- quais testes validam o contrato;
- se existe forma operacional normalizada;
- se existe decisão humana vinculada.

Exemplos de fontes atualmente identificadas no mapa de autoridade incluem `data/monsters.json`, `data/skills.json`, `data/cards.json` e dados canônicos de design explicitamente consumidos. Consulte o arquivo e o loader atuais; não reproduza schemas aqui.

## 3. IDs e compatibilidade

- Trate IDs existentes como estáveis.
- Não renomeie, recicle ou remapeie IDs dentro de outro escopo.
- Mudanças que afetem saves exigem migração, teste de compatibilidade e rollback próprios.
- Não invente padrões de ID a partir de exemplos antigos.
- Não use nomes editoriais do Drive como IDs runtime.
- Não migre a Dex v3 automaticamente.

## 4. CSVs da raiz

Os CSVs da raiz não são a fonte runtime principal. Alguns, porém, são consumidos por testes, auditorias ou módulos como contratos paralelos ou históricos.

A instrução com `applyTo: "*.csv"` está em `.github/instructions/root-csv.instructions.md`, garantindo que edições nesses arquivos recebam orientação própria.

Antes de mover, editar ou remover qualquer CSV, verifique individualmente:

1. imports e leituras no runtime;
2. leituras em testes;
3. scripts e geradores;
4. comentários que o declaram como origem;
5. documentação ativa;
6. conteúdo exclusivo;
7. divergência em relação à fonte runtime;
8. necessidade de fixture explícita.

Classifique cada CSV como uma destas categorias:

- `RUNTIME_SOURCE`;
- `TEST_FIXTURE`;
- `PARALLEL_CONTRACT`;
- `GENERATED_ARTIFACT`;
- `HISTORICAL`;
- `LEGACY_INERT`;
- `UNKNOWN`.

Não use uma classificação global para todos.

## 5. Mudanças de balanceamento

Alterar números não é manutenção neutra.

Mudanças em HP, ATK, DEF, SPD/AGI, ENE, PWR, custos, chances, thresholds, raridade, progressão, drops, captura ou recompensas exigem:

- evidência;
- decisão humana quando aplicável;
- escopo isolado;
- baseline antes/depois;
- testes do domínio;
- atualização do registro de decisão ou estado.

Não use planilhas editoriais ou relatórios históricos como autorização.

## 6. Checklist por alteração

- [ ] autoridade confirmada;
- [ ] loader confirmado;
- [ ] schema real lido diretamente;
- [ ] tratamento de falha identificado;
- [ ] consumidores e referências buscados;
- [ ] saves avaliados;
- [ ] mudança editorial separada de runtime;
- [ ] balanceamento fora do escopo ou explicitamente autorizado;
- [ ] validação e testes definidos;
- [ ] risco e rollback registrados.

## 7. Validação mínima

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando houver efeito no fluxo publicado e o ambiente permitir:

```bash
npm run test:wild-loop
```

Execute testes adicionais indicados em `docs/PROJECT_STATUS.md` para o domínio alterado.

## 8. Documentação

Após uma mudança significativa:

- atualize `docs/PROJECT_STATUS.md` quando a fotografia do estado mudar;
- atualize `docs/DECISION_LOG.md` somente quando houver decisão humana;
- atualize `docs/AUTHORITY_MAP.md` quando a fonte efetiva mudar;
- atualize `data/README.md` quando loader, tratamento de falha ou organização do diretório mudar;
- não copie valores voláteis para arquivos de instrução.
