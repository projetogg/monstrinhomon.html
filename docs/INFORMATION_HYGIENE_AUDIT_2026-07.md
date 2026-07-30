# Auditoria de Higiene Informacional — Monstrinhomon

**Data:** 2026-07-30  
**Main examinada:** `b14dceb5438911ce93741fa4b722895ab9ffa8eb`  
**Escopo:** GitHub, Projeto RPG do ChatGPT e fronteira com Google Drive.  
**Natureza:** diagnóstico documental; não altera regras, runtime, dados ou balanceamento.

## 1. Diagnóstico executivo

A governança atual já define corretamente o GitHub como fonte técnica e o Drive como espaço de produto. O principal risco não está mais na ausência de uma arquitetura documental, mas na permanência de documentos antigos em locais ativos e na atualização incompleta dos próprios pontos de entrada.

Foram confirmados quatro tipos de risco:

1. **pontos de entrada ativos desatualizados** — `PROJECT_STATUS.md`, `DECISION_LOG.md`, `AUTHORITY_MAP.md`, `AGENTS.md`, `PROXIMOS_PASSOS.md` e `PENDENCIAS_TECNICAS.md` ainda descrevem marcos anteriores ao merge do PR #278 ou decisões já implementadas como pendentes;
2. **documentos ativos materialmente falsos** — `LEIA-ME.md`, `TODO_FUNCIONALIDADES.md` e `docs/ANALISE_PROJETO.md` descrevem fases, contagens de testes, fórmulas e sistemas que não representam a `main`;
3. **documentos históricos posicionados entre documentos ativos** — `docs/PLANO_DE_ACAO.md` e auditorias datadas ainda podem aparecer em busca sem que o leitor perceba imediatamente que são históricos;
4. **arquivos do Projeto ChatGPT que competem com o GitHub** — documentos-mestre, análises antigas, protótipos HTML e versões duplicadas do sistema de cartas podem ser recuperados automaticamente e tratados como contexto atual.

## 2. Regra operacional resultante

```text
GitHub descreve e governa a técnica.
Drive organiza produto, discussão e playtest.
Projeto ChatGPT aponta para essas fontes; não mantém cópias técnicas independentes.
```

Um arquivo antigo não volta a ser vigente porque contém palavras como `mestre`, `final`, `completo`, `v3`, `roadmap` ou `fonte única`.

## 3. GitHub — manter ativo

| Arquivo | Classificação | Motivo |
|---|---|---|
| `README.md` | `KEEP_ACTIVE` | ponto de entrada correto e conciso |
| `docs/AI_ENTRYPOINT.md` | `COMPLETE_NOW` | estrutura correta; precisa incluir política explícita para Projeto ChatGPT e anexos antigos |
| `docs/PROJECT_STATUS.md` | `COMPLETE_NOW` | ainda registra PR #278 como “em validação” |
| `docs/ROADMAP.md` | `KEEP_ACTIVE` | próximo portão está correto: playtest mediado |
| `docs/AUTHORITY_MAP.md` | `COMPLETE_NOW` | contém notas de implementação e hierarquia que ficaram antigas |
| `docs/DECISION_LOG.md` | `COMPLETE_NOW` | `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` já estão implementadas |
| `AGENTS.md` | `COMPLETE_NOW` | ordem de autoridade antiga e afirmação incorreta de Animalista neutro |
| `docs/PENDENCIAS_TECNICAS.md` | `COMPLETE_NOW` | PT-004 ainda aparece “em correção” e o registro está centrado na Card Layer de maio |
| `GAME_RULES.md` | `KEEP_ACTIVE_WITH_WARNING` | possui conteúdo geral ainda consultado, mas grande bloco legado revogado; não deve ser apagado sem separação prévia |
| `docs/PATCH_CANONICO_COMBATE_V2.2.md` | `KEEP_ACTIVE` | autoridade normativa de combate |
| `docs/reports/*` recentes | `KEEP_ACTIVE` | evidência datada e rastreável, desde que não sejam tratados como status atual |

## 4. GitHub — remover da área ativa neste PR

### `LEIA-ME.md`

**Classificação:** `DELETE_ACTIVE_COPY`

Motivos:

- aponta para `RESPOSTA_DIRETA.md`, que não existe;
- descreve um fluxo antigo baseado em Feature 3.1;
- concorre diretamente com `README.md` e `docs/AI_ENTRYPOINT.md`;
- orienta o leitor a usar prompts e roadmaps antigos.

Rollback: recuperar pelo histórico Git.

### `TODO_FUNCIONALIDADES.md`

**Classificação:** `DELETE_ACTIVE_COPY`

Motivos:

- afirma que batalha, captura, XP, save, tutorial, quests e outros sistemas ainda não existem;
- descreve integração de CSVs como estado atual;
- usa fases e prioridades anteriores à arquitetura vigente;
- pode induzir uma IA a reimplementar sistemas já presentes.

Rollback: recuperar pelo histórico Git.

### `docs/ANALISE_PROJETO.md`

**Classificação:** `DELETE_ACTIVE_COPY`

Motivos:

- fotografia de 2026-03-24 com 573 testes e 25 módulos;
- usa fórmula de dano antiga;
- descreve 10 monstros e vários sistemas como ausentes;
- apresenta sugestões como se fossem roadmap atual;
- não possui referência ativa verificada.

Rollback: recuperar pelo histórico Git ou criar cópia histórica posterior se houver demanda.

## 5. GitHub — arquivar em PR posterior

| Origem | Destino recomendado | Ação |
|---|---|---|
| `docs/PLANO_DE_ACAO.md` | `docs/legacy/PLANO_DE_ACAO_2026-03.md` | mover; manter aviso histórico |
| `docs/AUDIT_GENERAL_RISKS_2026-05.md` | permanecer ou mover para `docs/archive/audits/` | retirar de qualquer posição de “auditoria mais recente” |
| `docs/AUDIT_REPORT.md` | `docs/archive/audits/` | classificar data e escopo |
| `docs/AUDIT_REPORT_2026-05.md` | `docs/archive/audits/` | classificar data e escopo |
| auditorias de migração concluídas | `docs/archive/migrations/` | manter como evidência, não como plano |
| planos de implementação concluídos | `docs/archive/plans/` | mover somente após checar referências |
| CSVs raiz inertes | `legacy/data-csv/` ou remoção em PR próprio | confirmar lista e ausência de carregamento antes de mover |

Não executar a migração ampla junto com a correção dos pontos de entrada. Ela exige busca de referências por arquivo e rollback individual.

## 6. Projeto RPG do ChatGPT — apagar da área ativa

Os seguintes arquivos foram encontrados na biblioteca do projeto e apresentam risco de recuperação automática como contexto atual.

### Apagar ou remover do projeto ativo

| Arquivo | Ação | Motivo |
|---|---|---|
| `DOCUMENTO_MESTRE.md` | apagar da área ativa | autodeclara-se “fonte única de verdade” e mistura regras, arquitetura e estado de abril |
| `ANALISE_PROJETO.md` | apagar da área ativa | fotografia de março com 573 testes, fórmula e sistemas antigos |
| `Análise de bugs críticos.txt` | apagar da área ativa | diagnóstico anterior às matrizes quantitativas e correções posteriores |
| `MONSTRINHOMON_JOGO_COMPLETO.html` | remover ou mover para projeto separado | protótipo isolado pode ser confundido com o runtime do GitHub |
| `Sistema_de_Cartas_Monstrinhomon_v1.md` | apagar duplicata | versão duplicada do experimento de cartas |
| `Sistema_de_Cartas_Monstrinhomon_v1.docx` | apagar duplicata | mesma razão |

### Separar como experimento

| Arquivo | Ação | Motivo |
|---|---|---|
| `Sistema_de_Cartas_Monstrinhomon.docx` | mover para projeto/pasta “Experimento de deck — não canônico” | descreve mão, deck e energia próprios, enquanto a Card Layer atual é visual e não implementa deck |

### Extrair valor antes de arquivar

| Arquivo | Ação | Conteúdo aproveitável |
|---|---|---|
| `Documento_Mestre_Monstrinhomon_v3_onboarding.docx` | extrair para o Drive e depois remover do projeto ativo | visão do produto, público, experiência desejada, propósito terapêutico e perguntas estratégicas |

O onboarding não deve permanecer como fonte técnica. Suas seções sobre runtime, roadmap, fórmulas, catálogo e testes envelhecem rapidamente.

## 7. Projeto RPG do ChatGPT — informações que precisam ser preenchidas agora

As instruções do projeto devem conter somente contexto estável e ponte para fontes atuais:

1. nome e propósito curto do projeto;
2. link do repositório;
3. obrigação de ler `docs/AI_ENTRYPOINT.md`;
4. GitHub como autoridade técnica;
5. Drive como produto, decisão em discussão, playtest e referência;
6. proibição de confiar em anexos antigos sem comparar com a `main`;
7. fase atual: playtest mediado das passivas de espécie;
8. obrigação de separar fato, inferência, recomendação e decisão humana;
9. proibição de transformar proposta em regra;
10. proibição de manter regras técnicas copiadas na memória do projeto.

Conteúdo exato recomendado: `docs/CHATGPT_PROJECT_CONTEXT_POLICY.md`.

## 8. Google Drive — conteúdo a completar

A camada de produto ainda precisa ser alimentada com:

1. **Visão e público prioritário** — produto mediado terapêutico, jogo infantil híbrido ou produto digital amplo;
2. **Experiência desejada** — o que a criança deve entender, sentir e decidir;
3. **Glossário de produto** — sem fórmulas ou cópias de regras técnicas;
4. **Decisões em discussão** — uma página por decisão aberta;
5. **Playtests** — protocolo, formulário e registros sem dados identificáveis;
6. **Uso terapêutico** — objetivos, limites, registro e ética de aplicação;
7. **Referências visuais** — com status `referência`, não `regra`;
8. **Demandas** — cada demanda deve apontar para issue/PR quando virar trabalho técnico;
9. **Catálogo editorial** — manter nomes aprovados e pendentes separados do runtime;
10. **Índice de arquivos históricos** — explicar por que não são vigentes.

## 9. Protocolo para novos arquivos

Todo novo documento deve declarar no topo:

```text
Status: ACTIVE | PROPOSAL | HISTORICAL | SUPERSEDED
Domain: produto | técnica | playtest | terapêutica | visual | demanda
Authority: GitHub | Drive | nenhuma
VerifiedAgainst: commit/PR/data ou “não aplicável”
Supersedes: caminho anterior ou “nenhum”
```

Documentos sem esses campos não devem entrar na ordem de leitura das IAs.

## 10. Sequência de limpeza

### PR 1 — pontos de entrada e falsos ativos

- criar esta auditoria;
- versionar o prompt;
- criar política do Projeto ChatGPT;
- atualizar documentos vivos;
- remover `LEIA-ME.md`, `TODO_FUNCIONALIDADES.md` e `docs/ANALISE_PROJETO.md`;
- não mover o acervo histórico amplo.

### PR 2 — migração de históricos

- criar índices para `docs/archive/` e `docs/legacy/`;
- mover `PLANO_DE_ACAO.md`;
- classificar auditorias e planos concluídos;
- corrigir links internos.

### Ação manual — Projeto ChatGPT e Drive

- remover os arquivos listados da área ativa do projeto;
- mover experimento de cartas para projeto separado;
- extrair visão de produto do onboarding para o Drive;
- substituir as instruções do projeto pelo texto oficial.

## 11. Critérios de aceitação

- nenhum ponto de entrada ativo descreve PR #278 como pendente;
- decisões implementadas aparecem como `IMPLEMENTED`;
- `AGENTS.md` não descreve Animalista como neutro;
- `PROXIMOS_PASSOS.md` não contém uma próxima etapa própria;
- arquivos removidos não possuem dependência ativa;
- arquivos históricos não são chamados de estado atual;
- Projeto ChatGPT não contém documento técnico que se autodeclare fonte única;
- experimento de deck não aparece misturado à Card Layer canônica;
- o próximo trabalho continua sendo playtest, não reimplementação de sistemas antigos.

## 12. Classificação

**A. Pontos de entrada corrigidos; limpeza histórica restante está isolada.**
