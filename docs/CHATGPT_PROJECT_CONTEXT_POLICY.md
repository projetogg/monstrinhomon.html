# Política de Contexto — Projeto RPG no ChatGPT

**Status:** ACTIVE  
**Domain:** governança de contexto  
**Authority:** GitHub para técnica; Google Drive para produto e discussão  
**VerifiedAgainst:** `b14dceb5438911ce93741fa4b722895ab9ffa8eb` e `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`  
**Supersedes:** orientações que tratavam a proposta híbrida de cartas como experimento externo

## Texto recomendado para as instruções do Projeto ChatGPT

```text
Este projeto acompanha o desenvolvimento do Monstrinhomon.

Fonte técnica oficial:
https://github.com/projetogg/monstrinhomon.html

Antes de responder sobre estado, código, dados, regras, arquitetura ou próximos passos:
1. consulte docs/AI_ENTRYPOINT.md;
2. verifique docs/PROJECT_STATUS.md;
3. verifique docs/AUTHORITY_MAP.md, docs/DECISION_LOG.md e docs/ROADMAP.md;
4. examine a main, os testes e os PRs recentes do domínio.

GitHub é a fonte oficial de código, dados runtime, testes, arquitetura técnica e regras canônicas aprovadas.
Google Drive é o espaço de visão do produto, decisões em discussão, playtests, observações terapêuticas, referências visuais e demandas.

Arquivos anexados ao Projeto ChatGPT podem ser históricos, propostas, protótipos ou cópias antigas. Nunca trate um arquivo como atual apenas porque contém palavras como “mestre”, “final”, “completo”, “v3”, “roadmap” ou “fonte única”. Compare suas afirmações com a main e com os documentos de governança.

Conversas e documentos de produto podem preservar decisões e intenções do autor que ainda não foram migradas para o GitHub. Quando houver conflito, não descarte automaticamente o material nem o trate como regra implementada: reconcilie a intenção, separe princípios aprovados de detalhes pendentes e registre a decisão no GitHub.

A visão de produto do sistema de cartas combina RPG tático simples, posicionamento, cartas como habilidades e deckbuilding leve. A Card Layer visual-only é uma etapa incremental, não a visão final. Consulte docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md.

Não mantenha cópias independentes de fórmulas, valores, listas de skills, nomes runtime, estado de implementação ou roadmap técnico nas instruções ou na memória do projeto. Use links para o GitHub.

A fase atual é validação por playtest mediado das passivas de espécie. Isso não autoriza alterar valores sem evidência e decisão humana.

Separe sempre:
- fatos verificados;
- inferências;
- recomendações;
- decisões que dependem do autor.

Não transforme propostas do Drive, anexos antigos ou sugestões de IA em regras canônicas automaticamente.
```

## Arquivos permitidos no projeto ativo

O Projeto ChatGPT pode conter:

- esta política ou uma versão curta dela;
- links para GitHub e Portal do Drive;
- documentos de produto ainda em elaboração, quando estiverem claramente classificados e não se apresentarem como runtime;
- registros temporários da tarefa atual;
- a versão revisada de uma proposta que ainda contenha decisões únicas não migradas.

## Arquivos que não devem permanecer no contexto automático

- cópias de regras técnicas do GitHub;
- documentos-mestre antigos;
- relatórios de estado do código datados;
- prompts de implementação de fases concluídas;
- protótipos HTML independentes;
- versões duplicadas ou substituídas;
- documentos de produto sem classificação que misturem intenção, números propostos e estado técnico;
- documentos com dados clínicos identificáveis.

## Tratamento específico dos documentos de cartas

- `CARD LAYER ARCHITECTURE v0_1_1.pdf`: remover; versão técnica substituída pela v0.1.2.
- `Sistema_de_Cartas_Monstrinhomon.docx`: arquivar como rascunho substituído depois de confirmar que não contém decisão única ausente na versão revisada.
- `Sistema_de_Cartas_Monstrinhomon_REVISADO.docx`: preservar como proposta de produto até migração para Drive/GitHub.
- versões `v1` duplicadas: remover após confirmar a preservação da versão revisada.

A versão revisada não é autoridade sobre runtime nem aprova automaticamente deck de 12, mão de 3, compra, descarte, grade ou valores de ENE. Ela preserva a visão híbrida e hipóteses que precisam de decisão própria.

## Rotina mensal de higiene

1. revisar arquivos recentes do Projeto ChatGPT;
2. remover duplicatas e versões substituídas;
3. confirmar que a fase atual aponta para `docs/ROADMAP.md`;
4. confirmar que nenhum anexo se autodeclara fonte técnica;
5. migrar decisões de produto únicas para Drive/GitHub antes de apagar a última cópia;
6. distinguir proposta integrada ao produto de experimento realmente independente;
7. arquivar registros concluídos fora do contexto automático.
