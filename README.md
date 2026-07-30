# Monstrinhomon

Monstrinhomon é um RPG terapêutico para navegador sobre monstrinhos colecionáveis, classes, combate, evolução, progressão e jogo colaborativo.

## Entradas do projeto

Antes de usar planos, anexos ou auditorias antigas como contexto atual, consulte:

- [Entrada para IAs e colaboradores](docs/AI_ENTRYPOINT.md)
- [Estado atual do projeto](docs/PROJECT_STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Mapa de autoridade](docs/AUTHORITY_MAP.md)
- [Registro de decisões](docs/DECISION_LOG.md)
- [Política de contexto do Projeto ChatGPT](docs/CHATGPT_PROJECT_CONTEXT_POLICY.md)
- [Auditoria de higiene informacional](docs/INFORMATION_HYGIENE_AUDIT_2026-07.md)
- [Portal do Projeto no Google Drive](https://docs.google.com/document/d/1FrUHQEqemHX0eDXFq27ZNfKnzzmaag5MBc-ScWc-V5A/edit)

## Fontes oficiais

O GitHub é a fonte oficial de código, dados consumidos pelo runtime, testes, arquitetura técnica e regras canônicas aprovadas.

O Google Drive é o espaço de trabalho para visão do produto, decisões em discussão, playtests, observações terapêuticas, referências visuais, demandas e revisões entre IAs. Documentos do Drive devem apontar para as fontes técnicas do GitHub, sem manter cópias independentes dessas regras.

O Projeto ChatGPT é um ambiente de trabalho e ponto de entrada. Anexos antigos, documentos-mestre, protótipos e prompts não possuem autoridade automática.

## Estrutura técnica

- aplicação em JavaScript executada no navegador;
- dados de runtime em `data/`;
- módulos em `js/`;
- testes Vitest em `tests/`;
- smoke test com Playwright em `e2e/`;
- documentação canônica, arquitetural e histórica em `docs/`.

## Validação

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando o ambiente possuir as dependências de navegador:

```bash
npm run test:wild-loop
```

## Atenção

Pull requests abertos, inclusive drafts, não fazem parte do estado oficial da `main`. Verifique `docs/PROJECT_STATUS.md` antes de interpretar documentos chamados `plano`, `auditoria`, `documento mestre` ou `próximos passos` como vigentes.

Como o jogo é usado com crianças, alterações devem priorizar clareza, baixa carga cognitiva, feedback visual fiel, utilidade para mediação terapêutica e rollback simples durante sessões.
