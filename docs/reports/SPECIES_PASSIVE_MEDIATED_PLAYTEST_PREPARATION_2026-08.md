# Preparação do playtest mediado das passivas de espécie — 2026-08

**Status:** ACTIVE — relatório documental de preparação; o playtest real continua pendente.

**Domain:** playtest

**Authority:** GitHub para baseline técnica e artefatos; este relatório não altera regra.

**VerifiedAgainst:** `f8468e36cc90f03613eb2bcd1ab32f80130014d9`

**Supersedes:** nenhum

## 1. Objetivo

Preparar uma coleta humana padronizada e executável para as oito passivas de espécie, sem modificar runtime, dados mecânicos, fórmulas, valores ou balanceamento.

## 2. Baseline verificada

### Fatos verificados

- `origin/main`: `f8468e36cc90f03613eb2bcd1ab32f80130014d9`;
- versão declarada em `package.json`: `1.0.0`;
- nenhum PR aberto no momento da verificação;
- PRs recentes relevantes: #283, descontinuação compatível de `MON_100`, e #284, registro documental da implementação;
- CI `Tests (Vitest)` da baseline: run `33087752300`, sucesso;
- Pages da baseline: run `33087750326`, sucesso no mesmo SHA;
- `index.html` publicado e local apresentaram o mesmo SHA-256: `4933fb7d9214eb83dc34aabb802e21742948427c578a39fdd1c2d517b687c642`;
- `package.json` remoto no SHA e local apresentaram o mesmo SHA-256: `584ef4f6693bbc9a9ab468bf572d0748a8fff1372a823ac2cb7e43cae808f597`;
- não houve mudança de runtime entre a fotografia `6d59d876` do `PROJECT_STATUS.md` e a baseline: o commit posterior #284 é documental;
- o roadmap e o estado do projeto mantêm o playtest mediado das passivas como portão atual.

### Playtest baseline

| Campo | Resultado |
|---|---|
| SHA | `f8468e36cc90f03613eb2bcd1ab32f80130014d9` |
| Versão publicada | pacote `1.0.0`; GitHub Pages em `https://projetogg.github.io/monstrinhomon.html/` |
| Runtime relevante | combate v2.2 e oito passivas resolvidas por `js/canon/speciesPassives.js` |
| Testes relevantes | CI verde na baseline; validação local registrada na seção 7 |
| Observações | publicação parte de `main`; não existe tag de release separada para este congelamento |
| Build apta para playtest | **SIM** |

## 3. Diagnóstico da preparação

### Fatos verificados

- o template existente é completo, mas sua tabela por turno é pesada para preenchimento simultâneo ao jogo;
- as oito passivas têm gatilhos diferentes: defesa, HP alto, item de cura, primeira abertura, debuff, cargas após skill e HP baixo;
- `shieldhorn` apresentou o maior delta automatizado de vitória (`+10,15 p.p.`), sem autorizar nerf;
- a matriz iniciou `wildpace` abaixo do limiar; ela não mede frequência natural;
- `emberfang`, `moonquill`, `shadowsting` e `bellwave` exigem skill ou setup para produzir efeito no perfil relevante;
- `swiftclaw` consome o benefício na primeira ação de ataque;
- não foi identificado um launcher canônico de cenários de playtest na interface publicada.

### Inferências

- tentar cobrir oito passivas em uma única sessão aumentaria carga e indução;
- anotar só eventos essenciais durante o combate e completar métricas pelo log reduz interferência sem remover o conteúdo do template;
- o portão precisa acumular cobertura entre sessões, com rotações de cenários;
- configurações que não puderem ser reproduzidas pela interface/save disponível devem gerar `EVIDENCE_GAP`, não edição improvisada de runtime ou save durante a coleta.

### Recomendações

- executar 1 a 3 combates por sessão, com uma passiva prioritária;
- começar `wildpace` com HP cheio e registrar numerador/denominador de ocorrência natural;
- usar bloco controlado somente depois do natural e identificá-lo separadamente;
- confirmar previamente a disponibilidade dos monstros, estágios evolutivos, níveis, skills, itens e adversários no save de playtest;
- manter o registro completo no template vigente e usar a ficha rápida apenas como apoio ao vivo.

### Decisões dependentes do autor

- suficiência final da amostra para encerrar o portão;
- tratamento de qualquer sinal de balanceamento depois da coleta;
- priorização entre intervenção de UX, nova coleta ou mudança mecânica;
- aceitação de cenários alternativos quando o save publicado não permitir a configuração sugerida.

## 4. Artefatos produzidos

1. `docs/SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md`
   - fluxo antes/durante/depois;
   - hipóteses das oito passivas;
   - matriz mínima de cenários;
   - conduta do mediador;
   - classificação de achados;
   - árvore pós-playtest;
   - critérios de saída;
   - checklists e consolidação.
2. `docs/SPECIES_PASSIVE_SESSION_RECORD_V2_2.md`
   - ficha curta para anotação simultânea ao jogo;
   - contadores específicos por tipo de gatilho;
   - checklist de transcrição para o template completo.
3. este relatório de preparação.

O `docs/PLAYTEST_TEMPLATE_V2_2.md` foi deliberadamente preservado como modelo completo e não foi substituído.

## 5. Cenários preparados

- `SP-01`: `shieldhorn`, mitigação e percepção;
- `SP-02`: `wildpace`, frequência natural abaixo de 40%;
- `SP-03`: `floracura`, escolha real de item e prolongamento;
- `SP-04`: `swiftclaw`, primeira ação ofensiva;
- `SP-05`: `emberfang`, skill ofensiva acima de 70%;
- `SP-06A`: `moonquill`, debuff e velocidade;
- `SP-06B`: `shadowsting`, debuff e consumo da carga no básico;
- `SP-06C`: `bellwave`, skill e consumo da carga no básico.

Os cenários usam monstros runtime com mapeamento explícito de espécie. Os oponentes sugeridos não possuem mapeamento de espécie no bridge verificado e evitam matchups diretos nas combinações propostas.

## 6. Escopo preservado

### Arquivos deliberadamente não alterados

- `docs/PLAYTEST_TEMPLATE_V2_2.md`;
- `docs/PROJECT_STATUS.md`, porque a preparação ainda não conclui playtest nem muda o estado oficial;
- `docs/DECISION_LOG.md` e `docs/ROADMAP.md`, porque nenhuma decisão ou marco foi concluído;
- todo arquivo em `js/`, `data/`, `design/`, `tests/` e `e2e/`;
- fórmulas, passivas, catálogo, matchups, Card Layer, backend e arquitetura.

Nenhuma passiva foi fortalecida ou enfraquecida.

## 7. Validação

| Validação | Resultado |
|---|---|
| `git diff --check` | passou após substituir quebras Markdown baseadas em espaços finais |
| diff restrito a documentação | passou; somente os três arquivos listados na seção 4 |
| verificação de IDs, bridge e matchups dos cenários | passou para 8 configurações; jogadores mapeados, oponentes sem passiva e matchups neutros |
| `npm test` | passou; 174 arquivos e 5.761 testes |
| `npm run test:combat-simulation-v2-2` | passou; 12 testes |
| `npm run test:combat-parity-v2-2` | passou; 12 testes |
| `npm run test:species-passive-parity-v2-2` | passou; 18 testes |
| `npm run test:species-passive-final-parity-v2-2` | passou; 9 testes |
| `npm run test:species-passive-quantitative-v2-2` | passou; 8 testes |
| `npm run test:combat-baseline-comparison-v2-2` | passou; 7 testes |
| `npm run validate-data` | passou; 8 avisos de faixa recomendada já existentes, sem erro |
| `npm run validate:monster-assets` | passou sem erro ou aviso |
| `npm run test:wild-loop:vitest` | passou; 7 testes |
| `npm run test:wild-loop` | passou no Playwright; a primeira tentativa foi bloqueada pelo sandbox ao abrir `127.0.0.1`, e a repetição autorizada concluiu o smoke |

### Comandos de governança e baseline

| Comando | Resultado relevante |
|---|---|
| `git fetch --prune origin` | `origin/main` atualizado e confirmado em `f8468e36` |
| `gh pr list --state open` | nenhum PR aberto |
| `gh pr list --state merged` | PRs #283 e #284 confirmados como merges recentes relevantes |
| `gh run list --branch main` | CI e Pages verdes no SHA baseline |
| `gh api repos/projetogg/monstrinhomon.html/pages` | Pages `built`, público, origem `main`/raiz |
| `sha256sum` + `curl` para `index.html` e `package.json` | conteúdo local, publicado e remoto no SHA correspondentes |

Comandos de leitura e busca foram usados para examinar governança, template, matriz, runtime, dados e testes; não produziram alteração de estado.

## 8. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| o save não contém a configuração sugerida | pré-check; registrar alternativa e ressalva; não editar durante coleta natural |
| mediador induz o gatilho | perguntas neutras; bloco controlado separado |
| ficha rápida omite métrica | transcrição obrigatória para o template completo a partir do log |
| um combate é interpretado como balanceamento | critérios exigem repetição, matriz e decisão humana |
| dado clínico identificável entra no repositório | usar código anônimo e apenas observação funcional |
| publicação muda entre sessões | registrar SHA/URL em toda sessão e reconfirmar baseline |

## 9. Rollback

O trabalho é apenas documental. Rollback consiste em reverter o commit deste pacote ou remover os três novos arquivos. Não existe migração de dados, mudança de save ou alteração de runtime a desfazer.
