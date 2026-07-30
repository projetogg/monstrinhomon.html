# Monstrinhomon — Entrada para IAs

**Status:** ACTIVE — guia operacional. Este arquivo não cria regras do jogo.  
**Atualizado:** 2026-07-30

Use esta entrada antes de propor ou alterar código, dados, regras ou documentação.

## Ordem mínima de leitura

1. `README.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/AUTHORITY_MAP.md`
4. `docs/DECISION_LOG.md`
5. `docs/ROADMAP.md`
6. código, dados e testes do domínio afetado
7. PRs abertos e mergeados recentemente que sejam relevantes

`AGENTS.md` contém instruções operacionais adicionais do repositório.

## Duas perguntas diferentes

### O que o jogo faz hoje?

Use a `main`, os dados realmente carregados e os testes relativos ao mesmo commit. O runtime possui autoridade descritiva sobre o comportamento implementado.

### O que o jogo deve fazer?

Use documentos canônicos aprovados e decisões humanas registradas em `docs/DECISION_LOG.md`. Uma regra pretendida não deve ser descrita como implementada antes do merge correspondente.

Quando comportamento e regra pretendida divergirem, registre a divergência. Não resolva silenciosamente durante outro PR.

## Google Drive

O Drive é destinado a:

- visão do produto;
- decisões ainda em discussão;
- playtests;
- observações terapêuticas sem dados identificáveis;
- referências visuais;
- demandas brutas;
- revisões entre IAs.

O Drive não é fonte oficial de código, dados runtime, testes ou regras técnicas canônicas. Documentos antigos podem ser históricos ou propostas, mesmo quando usam palavras como `final`, `completo`, `v3` ou `base mestra`.

Não copie uma regra técnica do GitHub para o Drive como uma segunda versão mantida manualmente. Use links para o arquivo, PR ou commit correspondente.

## Projeto RPG no ChatGPT

O Projeto ChatGPT é um ponto de entrada, fonte de histórico conversacional e ambiente de trabalho. Ele não é uma fonte técnica autônoma.

- Anexos podem ser históricos, propostas, protótipos ou cópias antigas.
- Não trate `Documento Mestre`, `final`, `completo`, `v3`, `roadmap` ou `fonte única` como prova de vigência.
- Compare afirmações técnicas com a `main` e os documentos desta ordem de leitura.
- Não mantenha fórmulas, valores, listas de skills, estado de implementação ou roadmap técnico copiados nas instruções do projeto.
- Conversas e documentos de produto podem preservar intenção do autor; quando essa intenção divergir da governança atual, reconcilie e registre a decisão no GitHub antes de implementar.
- Não classifique automaticamente uma proposta como projeto separado apenas porque ainda não foi implementada.

A visão híbrida do sistema de cartas está registrada em `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

Política completa: `docs/CHATGPT_PROJECT_CONTEXT_POLICY.md`.

## Classificação obrigatória de documentos

Todo documento novo deve declarar, quando aplicável:

```text
Status: ACTIVE | PROPOSAL | HISTORICAL | SUPERSEDED
Domain: produto | técnica | playtest | terapêutica | visual | demanda
Authority: GitHub | Drive | nenhuma
VerifiedAgainst: commit/PR/data ou “não aplicável”
Supersedes: caminho anterior ou “nenhum”
```

Arquivos em `docs/archive/` ou `docs/legacy/` são evidência histórica e não entram na ordem de leitura atual.

## Pull requests

- PR aberto ou draft é proposta, não baseline oficial.
- Registre branch e commit-base antes de analisar.
- Mudança de regra exige decisão humana aprovada.
- PR documental não pode afirmar que alterou runtime.
- Mantenha escopo pequeno, testes declarados e rollback claro.

## Quando fontes entrarem em conflito

1. identifique as afirmações conflitantes e seus arquivos;
2. examine runtime, dados carregados e testes;
3. classifique o conflito como descritivo, normativo, de produto, editorial ou histórico;
4. consulte `docs/DECISION_LOG.md`;
5. recupere conversas e documentos de produto quando a intenção do autor estiver em dúvida;
6. apresente evidência ao responsável humano se a regra continuar aberta;
7. não resolva a regra silenciosamente durante a implementação.

## Checklist antes de editar

- [ ] SHA da `main` registrado
- [ ] PRs abertos relevantes examinados
- [ ] código, dados e testes do domínio lidos
- [ ] anexos do ChatGPT e fontes do Drive classificados
- [ ] visão de produto separada do estado implementado
- [ ] fatos separados de inferências
- [ ] decisões humanas pendentes identificadas
- [ ] escopo, validação e rollback definidos

## Checklist depois do merge

- [ ] `PROJECT_STATUS.md` atualizado, se o estado material mudou
- [ ] `DECISION_LOG.md` atualizado, se uma decisão mudou de status
- [ ] `ROADMAP.md` atualizado, se um resultado foi concluído ou repriorizado
- [ ] demanda no Drive aponta para o PR ou commit mergeado
- [ ] nenhuma cópia concorrente de regra técnica foi criada no Drive ou no Projeto ChatGPT
