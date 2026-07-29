# Matriz quantitativa das passivas de espécie — Combate v2.2

## Status

Relatório do artefato gerado pelo PR #278. A matriz mede pares determinísticos `sem passiva × com passiva` e permanece separada da baseline de fórmula e passivas de classe.

Este documento não altera valores, runtime, fórmulas ou balanceamento.

## Proveniência

- workflow: `Combat v2.2 Baseline`, run `#34` (`30476416752`);
- head SHA: `32c995526fe5b805d19b24c1ebddbfe69c15b822`;
- artifact ID: `8733789411`;
- digest: `sha256:119cec1a42e16f75920f31db163734bf2f07345f5de34d461fbdfe65444ed674`;
- seed: `monstrinhomon-species-passives-v2.2-matrix-v1`;
- geração: `2026-07-29T17:41:02.178Z`.

## Cobertura

- 8 espécies;
- níveis `1`, `10` e `30`;
- perfis `basic` e `mixed`;
- 48 pares;
- 1000 execuções por variante em cada par;
- 96.000 batalhas simuladas.

## Resultado agregado — todos os perfis

| Passiva | Ativação | Δ vitória | Δ dano total | Dano evitado | Cura extra | Δ TTK | Δ HP final |
|---|---:|---:|---:|---:|---:|---:|---:|
| `shieldhorn` | 99.88% | 10.15 p.p. | 2.614333 | 5.726833 | 0.000000 | 0.294333 | 5.159833 |
| `emberfang` | 47.67% | 0.25 p.p. | -0.075500 | 0.553667 | 0.000000 | -0.031833 | 0.527833 |
| `floracura` | 100.00% | 0.47 p.p. | 3.160000 | -2.892833 | 3.000000 | 0.593167 | 0.027000 |
| `swiftclaw` | 100.00% | 1.05 p.p. | 0.692500 | 0.563500 | 0.000000 | -0.028500 | 0.483333 |
| `moonquill` | 50.00% | 0.13 p.p. | 0.638833 | 0.030000 | 0.000000 | -0.002500 | 0.020333 |
| `shadowsting` | 50.00% | 1.05 p.p. | 0.845000 | 0.225833 | 0.000000 | -0.007167 | 0.121333 |
| `bellwave` | 50.00% | 1.08 p.p. | 0.623000 | 0.640833 | 0.000000 | -0.047167 | 0.575833 |
| `wildpace` | 99.68% | 1.05 p.p. | 3.486833 | 0.137833 | 0.000000 | -0.006667 | 0.072333 |

Os agregados acima incluem perfis em que algumas passivas são intencionalmente inertes. Por isso, a taxa de 50% de `moonquill`, `shadowsting` e `bellwave`, por exemplo, representa três cenários `basic` sem setup e três cenários `mixed` com setup, não uma chance aleatória de 50%.

## Resultado nos perfis mecanicamente relevantes

| Passiva | Perfis | Ativação | Δ vitória | Δ dano total | Dano evitado | Cura extra |
|---|---|---:|---:|---:|---:|---:|
| `shieldhorn` | `basic`, `mixed` | 99.88% | 10.15 p.p. | 2.614333 | 5.726833 | 0.000000 |
| `emberfang` | `mixed` | 95.33% | 0.50 p.p. | -0.151000 | 1.107333 | 0.000000 |
| `floracura` | `basic`, `mixed` | 100.00% | 0.47 p.p. | 3.160000 | -2.892833 | 3.000000 |
| `swiftclaw` | `basic`, `mixed` | 100.00% | 1.05 p.p. | 0.692500 | 0.563500 | 0.000000 |
| `moonquill` | `mixed` | 100.00% | 0.27 p.p. | 1.277667 | 0.060000 | 0.000000 |
| `shadowsting` | `mixed` | 100.00% | 2.10 p.p. | 1.690000 | 0.451667 | 0.000000 |
| `bellwave` | `mixed` | 100.00% | 2.17 p.p. | 1.246000 | 1.281667 | 0.000000 |
| `wildpace` | `basic`, `mixed` | 99.68% | 1.05 p.p. | 3.486833 | 0.137833 | 0.000000 |

## Leitura dos sinais

### `shieldhorn`

- foi a passiva com maior sinal de resultado automatizado: `+10,15 p.p.` de vitória no agregado;
- evitou, em média, `5,726833` de dano por combate;
- a ativação de `99,88%` é esperada porque o cenário é um duelo controlado e a redução pode ocorrer em cada golpe recebido;
- o resultado é um sinal prioritário para playtest, não autorização de nerf.

### `wildpace`

- começou intencionalmente com HP abaixo de 40%, portanto a ativação próxima de 100% é uma condição experimental controlada;
- apresentou o maior delta de dano total (`+3,486833`), mas apenas `+1,05 p.p.` de vitória;
- o experimento mede a passiva quando já ativa, não sua frequência natural no jogo completo.

### `floracura`

- concedeu exatamente `+3` de cura por combate, como definido pelo contrato;
- prolongou o combate em `+0,593167` turno em média;
- o aumento de dano total e o valor negativo de “dano evitado” decorrem do combate mais longo, não de uma penalidade defensiva da passiva.

### Passivas condicionadas a skill ou setup

- `emberfang` ficou inerte no perfil `basic` e ativou em `95,33%` dos combates `mixed`;
- `moonquill`, `shadowsting` e `bellwave` ficaram inertes em `basic` e ativaram em 100% dos combates `mixed`;
- `shadowsting` criou `7.041` cargas e consumiu `5.418`; `bellwave` criou `9.906` e consumiu `7.418`;
- cargas não consumidas representam combates encerrados antes do ataque básico seguinte.

### `swiftclaw`

- ativou exatamente uma vez em cada combate dos dois perfis;
- produziu `+1,05 p.p.` de vitória e `+0,6925` de dano total médio no agregado.

## Cuidados de interpretação

- `Δ dano total` mede o total do combate, não dano por golpe. Uma vitória mais rápida pode reduzir o total registrado mesmo quando cada golpe beneficiado é mais forte;
- `dano evitado` é calculado pela diferença de dano total recebido. Combates prolongados por cura podem produzir valor negativo;
- vitórias já próximas da saturação em níveis altos podem apresentar delta zero mesmo com benefício mecânico observável;
- as classes são mantidas constantes dentro de cada par, mas cada espécie usa a classe definida no cenário da matriz;
- o inimigo não possui passiva de espécie.

## Limitações

- Ações roteirizadas; sem IA completa.
- Sem economia integral de ENE, múltiplos alvos ou bosses.
- Inimigo sem passiva de espécie.
- Moonquill usa fronteira controlada de SPD.
- Floracura usa um único item de cura controlado.
- Sem playtest humano.

## Decisão permitida

A matriz fecha a lacuna de medição automatizada das oito espécies, mas não determina sozinha se alguma passiva deve ser fortalecida ou enfraquecida.

O próximo portão deve combinar:

1. análise humana dos sinais, com prioridade para `shieldhorn`;
2. playtest mediado e padronizado;
3. avaliação separada da frequência natural das condições de HP e uso de skills;
4. eventual PR de balanceamento limitado a uma única passiva, somente após decisão humana.

## Classificação final

**A. Matriz quantitativa criada e artefato publicado; análise humana permanece pendente.**
