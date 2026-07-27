# Validacao do Nucleo Jogavel - Combate v2.2

**Status:** protocolo de validacao.  
**Autoridade:** este documento organiza medicao; nao altera regras, formula, atributos ou balanceamento.  
**Baseline inicial:** `main` apos PRs #255 e #256.

## 1. Objetivo

Avaliar quantitativamente e por playtest o combate v2.2 antes de propor ajustes em PWR, critico, passivas, ENE, bosses ou atributos.

A pergunta central nao e apenas se os testes automatizados passam. A pergunta e se o nucleo produz combates:

- compreensiveis;
- consistentes;
- taticamente relevantes;
- adequados ao publico infantil mediado;
- suficientemente curtos para manter engajamento;
- suficientemente longos para permitir decisao.

## 2. Limites

Durante a coleta, nao alterar:

- formula de confronto ou dano;
- PWR;
- HP, ATK, DEF ou SPD/AGI;
- critico;
- passivas;
- regeneracao de ENE;
- multiplicadores de boss;
- catalogo de habilidades;
- Card Layer;
- nomes ou IDs.

Bug que impeça a coleta deve ser registrado separadamente. Nao combinar correcao e balanceamento no mesmo PR.

## 3. Baseline obrigatorio

Antes de cada rodada, registrar:

- SHA da `main`;
- versao publicada, quando aplicavel;
- comandos de teste executados;
- estado dos dados usados;
- seed ou fonte de RNG;
- data e responsavel;
- limitacoes do ambiente.

Comandos oficiais:

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Quando disponivel:

```bash
npm run test:wild-loop
```

## 4. Hipoteses

| ID | Hipotese |
|---|---|
| H1 | Combate inicial normalmente termina entre 2 e 4 turnos. |
| H2 | Nenhuma classe vence de forma excessiva apenas por atributos base. |
| H3 | Vantagem de classe e perceptivel, mas nao determina automaticamente a vitoria. |
| H4 | Skills superam ataque basico quando usadas na situacao adequada. |
| H5 | Critico e relevante sem transformar a maioria das lutas em execucao automatica. |
| H6 | Passivas atuais nao distorcem excessivamente o resultado. |
| H7 | Guerreiro resiste mais sem perder relevancia ofensiva. |
| H8 | Barbaro pressiona mais sem eliminar o adversario rapido demais. |
| H9 | Ladino e Cacador permanecem mecanicamente distintos. |
| H10 | Curandeiro e Bardo possuem valor real em grupo. |
| H11 | Regeneracao de ENE permite skills sem eliminar gestao de recurso. |
| H12 | Bosses duram mais sem produzir combates excessivamente longos. |
| H13 | Wild e Group usam logica equivalente onde a regra deveria ser comum. |

## 5. Cenarios minimos

Executar cenarios com:

1. Guerreiro x Barbaro;
2. Barbaro x Guerreiro;
3. Mago x Guerreiro;
4. Guerreiro x Mago;
5. Ladino x Cacador;
6. Cacador x Mago;
7. Curandeiro x Barbaro;
8. Bardo x Curandeiro;
9. Animalista x Bardo;
10. confrontos neutros;
11. vantagem de classe;
12. desvantagem de classe;
13. ataque basico;
14. skill ofensiva;
15. skill de suporte;
16. skill de cura;
17. 20 natural;
18. 1 natural;
19. boss;
20. item de cura;
21. passiva de classe;
22. passiva de especie;
23. kit swap;
24. niveis 1, 5, 10, 15 e 30.

## 6. Volume e reproducibilidade

Para cenarios estocasticos, usar como referencia inicial:

```text
1.000 simulacoes por cenario principal
```

Um volume menor e aceitavel apenas com justificativa tecnica. Registrar:

- seed;
- quantidade de execucoes;
- funcao RNG;
- configuracao dos combatentes;
- versao dos dados;
- criterios de exclusao.

Uma luta isolada nunca deve ser apresentada como prova de balanceamento.

## 7. Metricas obrigatorias

### Ritmo

- TTK medio;
- mediana;
- percentis 10, 25, 75 e 90;
- frequencia de combates encerrados em 1 ou 2 turnos;
- frequencia de combates acima do limite definido para o cenario.

### Resultado

- taxa de vitoria;
- HP final medio;
- dano medio por acao;
- dano minimo e maximo;
- variancia do dano;
- uso medio de cura.

### Confronto

- falha total;
- contato neutralizado;
- acerto reduzido;
- acerto normal;
- acerto forte;
- 1 e 20 naturais;
- impacto medio do critico.

### Sistemas

- impacto da vantagem e desvantagem;
- impacto das passivas;
- ENE gasto e regenerado;
- frequencia de uso de skills;
- valor de ataque basico versus skill;
- boss versus inimigo comum;
- Wild versus Group equivalente;
- distribuicao de alvo da IA, quando aplicavel.

## 8. Comparacoes isoladas

Cada comparacao deve mudar apenas uma variavel principal:

- ataque basico x habilidade ofensiva;
- vantagem x neutro;
- neutro x desvantagem;
- passiva ativa x desativada;
- critico atual x sem premio adicional;
- comum x boss;
- Wild x Group;
- kit padrao x kit swap.

Nao alterar a `main` para produzir a comparacao. Use funcoes puras, dependencia injetada ou harness de simulacao.

## 9. Classificacao de achados

Cada achado deve receber uma categoria:

- `BUG`: comportamento contrario ao contrato implementado;
- `DRIFT`: runtime diferente da regra pretendida;
- `BALANCE`: resultado numericamente indesejado sem defeito de execucao;
- `UX`: resultado correto, mas dificil de compreender ou operar;
- `EVIDENCE_GAP`: dados insuficientes;
- `DECISION`: exige escolha humana entre alternativas validas.

## 10. Entrega

O relatorio deve conter:

1. resumo executivo;
2. baseline e comandos executados;
3. fatos verificados;
4. limitacoes;
5. tabelas por cenario;
6. comparacoes;
7. hipoteses aceitas, rejeitadas ou inconclusivas;
8. bugs separados de balanceamento;
9. resultado do playtest;
10. decisoes humanas necessarias;
11. apenas um proximo PR recomendado.

## 11. Criterio de conclusao

Finalizar com exatamente uma classificacao:

- **A. Nucleo pronto para calibracao**
- **B. Nucleo precisa de correcoes de bugs antes da calibracao**
- **C. Evidencia ainda insuficiente para decidir**

A conclusao deve citar os dados que a sustentam. Testes verdes, isoladamente, nao autorizam a classificacao A.

## 12. Instrumento oficial da baseline

A baseline v2.2 possui um unico caminho operacional oficial:

- **nucleo do harness:** `js/combat/combatSimulationHarness.js`;
- **CLI:** `scripts/simulate-combat-v2-2.mjs`;
- **testes:** `tests/combatSimulationHarnessV22.test.js`;
- **workflow:** `.github/workflows/combat-v2-2-baseline.yml`;
- **comandos npm:** `test:combat-simulation-v2-2` e `simulate:combat-v2-2`.

O harness integrado pelo PR #260 e a fonte operacional para novas medicoes. Arquivos paralelos em `scripts/combat-v2-2/` foram removidos por duplicarem carregamento de dados, construcao de cenarios, politica de acoes e geracao de relatorio sem serem consumidos pelo `package.json` ou pelo workflow oficial.

Nao criar uma segunda CLI ou um segundo nucleo de simulacao. Novas capacidades devem ser adicionadas ao harness oficial ou a modulos puros importados por ele.

O proximo portao tecnico, apos esta consolidacao, e demonstrar a paridade do harness com os loops reais de Wild e Group antes de interpretar resultados como evidencia de balanceamento.
