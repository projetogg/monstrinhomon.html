# SP-02 técnico — Wildpace a partir de HP cheio

**Status:** ACTIVE  
**Domain:** técnica / playtest / análise quantitativa  
**Authority:** GitHub  
**VerifiedAgainst:** runtime `590660187266215251ed9b71ba36012efa07991f`; análise executada no PR #292  
**Supersedes:** nenhum

## Objetivo

Medir `wildpace` no cenário natural definido pelo protocolo: iniciar com HP cheio e observar com que frequência o jogador cruza estritamente abaixo de 40% de HP, se recebe nova oportunidade de ataque e qual o impacto técnico da passiva.

Este relatório não substitui playtest humano.

## Instrumentação experimental

O PR #292 ampliou temporariamente o harness quantitativo apenas para análise:

- HP inicial explícito;
- potência básica do inimigo explícita;
- nível do inimigo opcional;
- registro de cruzamento natural de `<40%`;
- registro de oportunidade de ataque após o cruzamento;
- turno médio do primeiro cruzamento.

O PR #292 foi encerrado **sem merge** após a coleta. O runtime e os valores das passivas não foram alterados.

Workflows no head final do PR #292:

- `Tests (Vitest)`: sucesso;
- `Combat v2.2 Baseline`: sucesso;
- Wild Loop E2E: sucesso.

## Cenário oficial SP-02

- jogador: Cervimon `MON_023`, Animalista, Nv10;
- adversário: Vitalex `MON_031`, Curandeiro, Nv10;
- HP inicial: 100%;
- matchup: sem vantagem direta;
- comparação pareada: sem passiva × com `wildpace`;
- 20.000 pares `basic`;
- 20.000 pares `mixed`;
- inimigo usa potência básica da própria classe;
- máximo: 30 turnos.

### Resultado

| Métrica | Basic | Mixed |
|---|---:|---:|
| Vitória sem passiva | 98,86% | 99,83% |
| Vitória com `wildpace` | 99,115% | 99,845% |
| Delta de vitória | **+0,255 p.p.** | **+0,015 p.p.** |
| Cruzamento natural de `<40%` | **29,625%** | **10,35%** |
| Oportunidade de ataque pós-limiar | 29,625% | 10,35% |
| Combates com ativação | 29,625% | 10,35% |
| Turno médio do primeiro cruzamento | 7,37 | 6,81 |
| Aplicações de +1 ATK por combate | 0,545 | 0,157 |
| Dano causado adicional médio | +0,214 | +0,058 |
| Delta médio de TTK | -0,030 turno | -0,005 turno |
| Delta médio de HP final | +0,178 | +0,031 |

## Fatos verificados

1. A matriz anterior, iniciada em 35% de HP, não representava a frequência natural da passiva.
2. Começando com HP cheio, `wildpace` ativa naturalmente em uma minoria das lutas no cenário oficial.
3. O perfil `mixed` cruza o limiar com muito menos frequência que o `basic`, coerente com encerrar o combate mais cedo.
4. Quando o limiar foi cruzado no cenário oficial, houve oportunidade posterior de ataque em todos os cruzamentos observados.
5. O delta de vitória no cenário oficial foi pequeno.
6. A passiva não prolongou a luta; o TTK teve redução mínima.

## Sensibilidade antes da evolução de Vitalex

Para não confundir progressão com o gatilho de `wildpace`, a leitura natural da forma base deve ficar nos níveis em que `MON_031` ainda é Vitalex.

| Inimigo | Perfil | Cruzou <40% | Delta vitória |
|---|---|---:|---:|
| Vitalex Nv9 | basic | 15,72% | +0,06 p.p. |
| Vitalex Nv9 | mixed | 4,30% | 0,00 p.p. |
| Vitalex Nv10 | basic | 29,52% | +0,38 p.p. |
| Vitalex Nv10 | mixed | 10,38% | +0,02 p.p. |
| Vitalex Nv11 | basic | 61,60% | +1,64 p.p. |
| Vitalex Nv11 | mixed | 27,54% | +0,26 p.p. |

A disponibilidade da passiva cresce rapidamente conforme a luta aperta, mas o ganho de vitória permanece modesto.

## Sensibilidade com progressão real do adversário

`Vitalex` evolui no Nv12. Por isso, Nv12–13 foram reexecutados com `Vitalion` (`MON_031B`).

### Vitalion Nv12

- cruzamento de `<40%`: ~100%;
- `basic`: 0,02% → 0,02% de vitória;
- `mixed`: 0,96% → 1,48%, delta **+0,52 p.p.**;
- dano adicional médio com passiva: ~+2,27;
- ativação: ~97% dos combates.

### Vitalion Nv13

- cruzamento de `<40%`: 100%;
- vitória: 0% com e sem passiva nos dois perfis;
- `wildpace` ainda adiciona dano quando ativa, mas não converte uma luta estruturalmente perdida.

## Stress test não canônico

O PR #292 também escalou o template base de Vitalex até Nv12–13. Como `MON_031` deveria evoluir no Nv12, esses números são apenas stress test e **não devem ser usados como progressão natural**.

Eles permanecem úteis apenas para demonstrar que, mantendo o mesmo chassis, a frequência do limiar cresce com pressão.

## Inferências

1. A identidade de comeback está presente: `wildpace` aparece mais quando o combate é difícil.
2. A passiva não funciona como “virada automática”. Mesmo quando o gatilho é quase garantido, o +1 ATK tem capacidade limitada de mudar o desfecho.
3. No cenário oficial, a passiva é relativamente rara, especialmente quando o jogador usa skills ofensivas e encerra a luta mais cedo.
4. O limiar tende a aparecer tarde no combate, em torno do 7º turno no cenário oficial.
5. Isso é coerente com “instinto de sobrevivência”: um bônus tardio e contextual, não uma fonte constante de poder.
6. A evolução do adversário cria um salto de dificuldade muito maior que o efeito de `wildpace`; esse salto pertence à progressão/evolução, não deve ser atribuído à passiva.

## Classificação

- `SP02-TECH-01` — **TECHNICAL_CONTROLLED**: frequência natural medida a partir de HP cheio.
- `SP02-TECH-02` — **BALANCE**: efeito pequeno/moderado e fortemente dependente da dificuldade e do perfil de ação.
- `SP02-TECH-03` — **EVIDENCE_GAP**: percepção, compreensão, justiça, diversão e estratégia espontânea não testadas.
- `SP02-TECH-04` — **BALANCE**: nenhuma evidência técnica atual justifica buff ou nerf do `+1 ATK`.
- `SP02-TECH-05` — **EVIDENCE_GAP**: a relação entre o salto de evolução do adversário e a curva geral de progressão deve ser avaliada fora da calibração de `wildpace`.

## Decisão permitida

Manter a regra atual congelada:

`HP < 40% + ataque → +1 ATK`.

O SP-02 técnico pode ser considerado concluído para a etapa pré-playtest.

## Próximo passo

Seguir para SP-03 / `floracura`, preservando a mesma separação entre:

- oportunidade real de trigger;
- ativação mecânica;
- impacto quantitativo;
- dimensões humanas ainda não testadas.

Nenhum PWR, ENE, passiva ou regra de evolução é alterado por este relatório.
