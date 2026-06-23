# Monstrinhomon

Monstrinhomon e um RPG terapeutico para navegador sobre monstrinhos colecionaveis, classes, combate, evolucao, progressao e jogo colaborativo.

## Entradas do projeto

Antes de usar planos ou auditorias antigas como contexto atual, consulte:

- [Entrada para IAs e colaboradores](docs/AI_ENTRYPOINT.md)
- [Estado atual do projeto](docs/PROJECT_STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Mapa de autoridade](docs/AUTHORITY_MAP.md)
- [Registro de decisoes](docs/DECISION_LOG.md)

## Fontes oficiais

O GitHub e a fonte oficial de codigo, dados consumidos pelo runtime, testes, arquitetura tecnica e regras canonicas aprovadas.

O Google Drive e o espaco de trabalho para visao do produto, decisoes em discussao, playtests, observacoes terapeuticas, referencias visuais, demandas e revisoes entre IAs. Documentos do Drive devem apontar para as fontes tecnicas do GitHub, sem manter copias independentes dessas regras.

## Estrutura tecnica

- aplicacao em JavaScript executada no navegador;
- dados de runtime em `data/`;
- modulos em `js/`;
- testes Vitest em `tests/`;
- smoke test com Playwright em `e2e/`;
- documentacao canonica, arquitetural e historica em `docs/`.

## Validacao

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando o ambiente possuir as dependencias de navegador:

```bash
npm run test:wild-loop
```

## Atencao

Pull requests abertos, inclusive drafts, nao fazem parte do estado oficial da `main`. Verifique `docs/PROJECT_STATUS.md` antes de interpretar documentos chamados "plano", "auditoria" ou "proximos passos" como vigentes.

Como o jogo e usado com criancas, alteracoes devem priorizar clareza, baixa carga cognitiva, feedback visual fiel, utilidade para mediacao terapeutica e rollback simples durante sessoes.
