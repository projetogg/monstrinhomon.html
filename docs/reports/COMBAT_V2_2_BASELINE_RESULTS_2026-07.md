# Resultados da Baseline Quantitativa — Combate v2.2

**Data da execução:** 2026-07-27  
**Status:** primeira medição automatizada; não autoriza rebalanceamento  
**Classificação:** **C. Evidência ainda insuficiente para decidir**

## 1. Identificação da execução

| Campo | Valor |
|---|---|
| Workflow | `Combat v2.2 Baseline` |
| Run ID | `30269130923` |
| SHA do instrumento medido | `83e442b460d0ac156bb4a9946c66be53187396b8` |
| Seed comparável | `monstrinhomon-combat-v2.2-baseline-v1` |
| Execuções por cenário | 1.000 |
| Cenários | 90 |
| Batalhas simuladas | 90.000 |
| Artefato | `combat-v2-2-baseline-83e442b460d0ac156bb4a9946c66be53187396b8` |
| Artifact ID | `8654041977` |
| Digest | `sha256:98758ea5ee09367760757c8b38b7a9b54d48c1c4539fe52b909c6f21d92266a5` |
| Resultado do job | sucesso |

O artefato contém:

- `combat-v2-2-baseline.json` — resultados estruturados dos 90 cenários;
- `combat-v2-2-baseline.md` — tabela completa da execução.

A seed é estável para permitir comparação entre execuções. O SHA é registrado separadamente para identificar exatamente qual versão do instrumento produziu os dados.

## 2. Fontes utilizadas

A baseline utilizou diretamente:

- `js/combat/groupCombatFormula.js` para `resolveConfrontation()` e `computeGroupDamage()`;
- `data/monsters.json` para templates e atributos base;
- `data/skills.json` para a primeira skill ofensiva de estágio 0 de cada classe;
- `design/canon/class_matchups.json` para vantagens e desvantagens;
- constantes de ataque básico, regeneração de ENE e passivas de classe explicitadas no harness como snapshot do runtime observado.

Auditorias quantitativas antigas não foram usadas como fonte de resultado, pois representam fórmulas, catálogos ou constantes de outros momentos do projeto.

## 3. Correção realizada durante a validação

A primeira execução revelou um defeito no instrumento: a métrica somava a regeneração nominal de ENE mesmo quando a barra já estava cheia.

A versão registrada neste relatório:

- limita a regeneração à capacidade restante da barra;
- contabiliza somente ENE efetivamente recuperada;
- possui testes para barra vazia, parcialmente cheia e cheia;
- utiliza seed estável, separada do SHA medido.

A correção afetou a métrica de ENE, não a resolução de dano, o vencedor ou o TTK das batalhas.

## 4. Matriz executada

Foram combinados:

- nove confrontos de classes;
- níveis 1, 5, 10, 15 e 30;
- perfil `basic`, usando somente ataque básico;
- perfil `mixed`, usando a primeira skill ofensiva de estágio 0 quando havia ENE suficiente.

Confrontos:

1. Guerreiro × Bárbaro;
2. Bárbaro × Guerreiro;
3. Mago × Guerreiro;
4. Guerreiro × Mago;
5. Ladino × Caçador;
6. Caçador × Mago;
7. Curandeiro × Bárbaro;
8. Bardo × Curandeiro;
9. Animalista × Bardo.

## 5. Resumo agregado

### 5.1 Por nível

| Nível | Cenários | Vitória média do lado jogador | TTK médio | Taxa de 1–2 turnos | Uso médio de skill |
|---:|---:|---:|---:|---:|---:|
| 1 | 18 | 67,46% | 3,394 | 27,7% | 9,9% |
| 5 | 18 | 67,48% | 3,856 | 20,3% | 10,9% |
| 10 | 18 | 67,24% | 3,779 | 18,8% | 19,5% |
| 15 | 18 | 68,76% | 3,886 | 16,6% | 33,8% |
| 30 | 18 | 69,50% | 3,859 | 10,8% | 44,8% |

Esses agregados não representam equilíbrio global entre classes. Cada classe aparece apenas nos confrontos definidos pelo protocolo, e o lado denominado “jogador” sempre age primeiro.

### 5.2 Por perfil de ação

| Perfil | Cenários | Vitória média | TTK médio | Taxa de 1–2 turnos | Uso de skill |
|---|---:|---:|---:|---:|---:|
| `basic` | 45 | 67,42% | 4,041 | 14,5% | 0,0% |
| `mixed` | 45 | 68,75% | 3,468 | 23,2% | 47,5% |

Na média desta matriz, o perfil `mixed` reduziu o TTK e aumentou a frequência de batalhas curtas. Isso é um sinal mensurável, mas não prova que as skills estejam fortes demais: os dois lados usam a mesma política, e o modelo ainda não representa cura, suporte, escolha tática nem papéis completos de classe.

## 6. Sinais relevantes observados

### 6.1 Confrontos extremamente unilaterais

| Cenário | Perfil | Vitória | TTK médio | 1–2 turnos |
|---|---:|---:|---:|---:|
| Curandeiro × Bárbaro — nível 10 | basic | 0,0% | 3,185 | 6,4% |
| Curandeiro × Bárbaro — nível 15 | mixed | 0,0% | 3,093 | 6,9% |
| Curandeiro × Bárbaro — nível 30 | mixed | 0,0% | 2,920 | 8,9% |
| Mago × Guerreiro — nível 30 | basic | 0,0% | 4,080 | 0,0% |
| Caçador × Mago — nível 30 | mixed | 100,0% | 2,033 | 96,7% |
| Bardo × Curandeiro — nível 10 | mixed | 100,0% | 4,116 | 0,0% |
| Bardo × Curandeiro — nível 30 | basic | 100,0% | 5,331 | 0,0% |
| Guerreiro × Mago — nível 30 | mixed | 100,0% | 3,192 | 0,0% |

Esses extremos exigem investigação, mas não devem ser convertidos diretamente em alterações de atributos.

Motivos:

- o Curandeiro não possui skill ofensiva de estágio 0 e o harness ainda não executa cura;
- Bardo e outras classes de suporte são representados apenas por ataque ou primeira skill ofensiva;
- o jogador age primeiro em todas as batalhas;
- a matriz não é todos-contra-todos;
- os níveis 5–30 usam um perfil explícito de crescimento ainda não comprovado como idêntico ao runtime;
- as passivas de espécie não estão representadas.

### 6.2 Ritmo potencialmente explosivo

Os maiores sinais de explosividade foram:

- Caçador × Mago — nível 30 — `mixed`: 96,7% das batalhas em 1–2 turnos;
- Ladino × Caçador — nível 15 — `mixed`: concentração próxima de 90% em 1–2 turnos;
- Caçador × Mago — nível 1 — `mixed`: 86,7% em 1–2 turnos;
- Ladino × Caçador — nível 1 — `mixed`: 89,9% em 1–2 turnos.

Isso torna **H1 — combate inicial normalmente terminar entre 2 e 4 turnos** inconclusiva. Alguns confrontos estão no intervalo, mas outros concentram encerramentos em apenas 1–2 turnos.

### 6.3 Efeito variável do perfil `mixed`

Maiores aumentos de vitória ao trocar `basic` por `mixed`:

- Mago × Guerreiro — nível 1: 23,8% → 52,7%;
- Mago × Guerreiro — nível 5: 18,1% → 44,8%;
- Bárbaro × Guerreiro — nível 30: 29,0% → 49,8%.

Maiores reduções:

- Guerreiro × Mago — nível 5: 93,5% → 75,9%;
- Guerreiro × Mago — nível 1: 88,4% → 74,9%;
- Guerreiro × Bárbaro — nível 30: 94,0% → 83,0%.

Como ambos os lados seguem a mesma política `mixed`, essas diferenças podem refletir maior benefício para o oponente, disponibilidade de ENE, ordem de ação ou interação entre atributos. Não são evidência isolada de bug.

## 7. Hipóteses do protocolo

| Hipótese | Estado após esta baseline | Justificativa |
|---|---|---|
| H1 — combate inicial em 2–4 turnos | inconclusiva | média inicial dentro da faixa, mas vários confrontos têm explosividade elevada |
| H2 — nenhuma classe vence excessivamente por atributos | inconclusiva com sinal de risco | existem extremos, mas a matriz e os papéis não são comparáveis globalmente |
| H3 — vantagem perceptível sem determinar vitória | inconclusiva | há resultados unilaterais e falta cenário neutro controlado de uma variável |
| H4 — skills superam básico quando adequadas | parcialmente sustentada | `mixed` reduz TTK médio, mas pode reduzir a vitória do lado jogador |
| H5 — crítico relevante sem execuções automáticas | não avaliada integralmente | frequência foi registrada, mas falta comparação isolada com crítico desativado |
| H6 — passivas não distorcem excessivamente | não avaliada integralmente | falta comparação ativa × desativada na matriz publicada |
| H7 — Guerreiro resiste sem perder relevância | sinal favorável, inconclusivo | bons resultados em alguns pares, mas efeito de primeiro ator e matchup permanece |
| H8 — Bárbaro pressiona sem explosão excessiva | inconclusiva | resultados variam fortemente conforme o adversário e o perfil |
| H9 — Ladino e Caçador são distintos | não avaliada adequadamente | foram medidos em pares diferentes e sem kit/papel completo |
| H10 — Curandeiro e Bardo têm valor em grupo | não avaliada | baseline é 1×1 e não executa cura/suporte completo |
| H11 — ENE permite skills sem eliminar gestão | parcialmente sustentada | uso cresce com nível e a contagem respeita o cap; falta política tática e comparação isolada |
| H12 — bosses duram sem excesso | não avaliada | boss completo não está modelado |
| H13 — Wild e Group equivalentes onde deveriam | não avaliada | harness importa a fórmula compartilhada, mas não compara os dois loops reais |

## 8. Classificação dos achados

### `EVIDENCE_GAP`

- ausência de playtest;
- crescimento de atributos de níveis 5–30 ainda não confrontado com instâncias reais;
- ausência de cura, suporte, itens, bosses, passivas de espécie e kit swaps;
- ausência de ordem de turno real;
- ausência de comparação direta entre loops Wild e Group;
- métricas de ataques e ENE ainda estão agregadas entre os dois lados.

### `BALANCE` — sinais, não decisões

- alguns pares possuem taxa de vitória próxima de 0% ou 100%;
- alguns cenários `mixed` concentram mais de 90% das batalhas em 1–2 turnos;
- o impacto do perfil `mixed` varia muito entre confrontos.

### `BUG`

Nenhum bug do runtime foi comprovado por esta rodada. O único defeito encontrado estava no contador de ENE do instrumento e foi corrigido antes desta execução registrada.

### `DECISION`

Nenhuma decisão de balanceamento deve ser tomada antes de validar a fidelidade do harness ao runtime e executar pelo menos um playtest padronizado.

## 9. Limitações metodológicas

1. **Primeiro ator fixo:** o lado jogador sempre age antes.
2. **Progressão aproximada:** o harness usa multiplicador explícito para atributos nos níveis 5–30.
3. **Ações simplificadas:** somente ataque básico e primeira skill ofensiva de estágio 0.
4. **Suporte incompleto:** cura, buffs, debuffs, provocação e papéis de grupo não são representados integralmente.
5. **Métricas agregadas:** dano, RC e ENE combinam ações de jogador e inimigo.
6. **Matchups específicos:** médias por classe não são comparações todos-contra-todos.
7. **Sem interação humana:** não há dados de compreensão, frustração, duração percebida ou intervenção do mediador.

## 10. Conclusão

**C. Evidência ainda insuficiente para decidir**

A baseline cumpriu sua função inicial:

- criou uma execução reproduzível;
- utilizou a fórmula bilateral v2.2 real;
- produziu 90.000 batalhas estruturadas;
- revelou cenários que merecem investigação;
- corrigiu e testou a métrica de ENE;
- não modificou o balanceamento.

Ela ainda não sustenta a classificação A porque a fidelidade completa ao runtime não foi demonstrada e os papéis de suporte não foram modelados. Também não sustenta B porque nenhum bug bloqueador do jogo foi comprovado.

## 11. Único próximo PR técnico recomendado

**Título sugerido:**

`test(combat): validar paridade do harness com os loops Wild e Group`

**Objetivo:** transformar as principais limitações da primeira baseline em testes de paridade, sem alterar balanceamento.

**Escopo recomendado:**

- comparar uma amostra de confrontos do harness com fixtures executadas pelos loops reais Wild e Group;
- usar a mesma sequência de dados d20 e os mesmos combatentes;
- extrair ou reutilizar a derivação real de atributos por nível;
- separar métricas do jogador e do inimigo;
- representar a ordem real de turno;
- incluir pelo menos um cenário de cura/suporte;
- falhar explicitamente quando harness e runtime produzirem dano, RC ou custo de ENE divergentes.

**Critério de saída:** somente depois da paridade demonstrada, repetir a baseline e combinar seus dados com um playtest registrado em `docs/PLAYTEST_TEMPLATE_V2_2.md`.
