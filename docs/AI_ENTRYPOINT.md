# Monstrinhomon - Entrada para IAs

**Status:** guia operacional. Este arquivo nao cria regras do jogo.

Use esta entrada antes de propor ou alterar codigo, dados, regras ou documentacao.

## Ordem minima de leitura

1. `README.md`
2. `docs/PROJECT_STATUS.md`
3. `docs/AUTHORITY_MAP.md`
4. `docs/DECISION_LOG.md`
5. `docs/ROADMAP.md`
6. codigo, dados e testes do dominio afetado
7. PRs abertos e mergeados recentemente que sejam relevantes

`AGENTS.md` contem instrucoes operacionais adicionais do repositorio.

## Duas perguntas diferentes

### O que o jogo faz hoje?

Use a `main`, os dados realmente carregados e os testes relativos ao mesmo commit. O runtime possui autoridade descritiva sobre o comportamento implementado.

### O que o jogo deve fazer?

Use documentos canonicos aprovados e decisoes humanas registradas em `docs/DECISION_LOG.md`. Uma regra pretendida nao deve ser descrita como implementada antes do merge correspondente.

A relacao definitiva entre essas duas autoridades ainda precisa ser reconciliada em `docs/AUTHORITY_MAP.md`. Ate essa revisao, explicite sempre se a afirmacao descreve runtime ou regra pretendida.

## Google Drive

O Drive e destinado a:

- visao do produto;
- decisoes ainda em discussao;
- playtests;
- observacoes terapeuticas;
- referencias visuais;
- demandas brutas;
- revisoes entre IAs.

O Drive nao e fonte oficial de codigo, dados runtime, testes ou regras tecnicas canonicas. Planilhas e documentos antigos podem ser historicos ou propostas, mesmo quando usam palavras como "final", "completo", "v3" ou "base mestra".

Nao copie uma regra tecnica do GitHub para o Drive como uma segunda versao mantida manualmente. Use links para o arquivo, PR ou commit correspondente.

## Pull requests

- PR aberto ou draft e proposta, nao baseline oficial.
- Registre a branch e o commit-base antes de analisar.
- Mudanca de regra exige decisao humana aprovada.
- PR documental nao pode afirmar que alterou runtime.
- Mantenha escopo pequeno, testes declarados e rollback claro.

## Quando fontes entrarem em conflito

1. identifique as afirmacoes conflitantes e seus arquivos;
2. examine runtime, dados carregados e testes;
3. classifique o conflito como descritivo, normativo ou historico;
4. consulte `docs/DECISION_LOG.md`;
5. apresente a evidencia ao responsavel humano se a regra continuar aberta;
6. nao resolva a regra silenciosamente durante a implementacao.

## Checklist antes de editar

- [ ] SHA da `main` registrado
- [ ] PRs abertos relevantes examinados
- [ ] codigo, dados e testes do dominio lidos
- [ ] fontes do Drive classificadas como proposta, observacao, referencia ou historico
- [ ] fatos separados de inferencias
- [ ] decisoes humanas pendentes identificadas
- [ ] escopo, validacao e rollback definidos

## Checklist depois do merge

- [ ] `PROJECT_STATUS.md` atualizado, se o estado material mudou
- [ ] `DECISION_LOG.md` atualizado, se uma decisao mudou de status
- [ ] `ROADMAP.md` atualizado, se um resultado foi concluido ou repriorizado
- [ ] demanda no Drive aponta para o PR ou commit mergeado
- [ ] nenhuma copia concorrente de regra tecnica foi criada no Drive
