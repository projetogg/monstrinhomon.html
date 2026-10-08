# SP-04 técnico — swiftclaw

**Status:** ACTIVE  
**Domain:** playtest técnico / passivas de espécie  
**Authority:** GitHub  
**VerifiedAgainst:** `7a44b5ec47b7cc6f47126a33b5ea0ace89d50070`; análise executada no PR #308  
**Supersedes:** nenhum  
**Classificação de evidência:** `TECHNICAL_CONTROLLED`

## Objetivo

Verificar o SP-04 de `swiftclaw` antes do playtest humano, separando:

1. funcionamento do bônus único de abertura;
2. impacto quantitativo do `+1 ATK`;
3. saturação do cenário oficial;
4. semântica de consumo da abertura;
5. possíveis bugs do cenário que prejudiquem futura coleta humana.

Esta rodada não mede percepção, compreensão, diversão, frustração, justiça ou estratégia espontânea de crianças.

## Contrato canônico e cenário do protocolo

A passiva canônica retorna `+1 ATK` quando recebe:

`event: on_attack` + `isFirstAttackOfCombat: true`.

Textos de produto/técnica usam formulações próximas, mas não idênticas:

- espécie: “No primeiro ataque do combate”;
- rótulo: “Primeiro Ataque”;
- protocolo SP-04: “primeira ação ofensiva”.

Cenário oficial:

- Miaumon `MON_009`, Caçador, Nv10;
- Aquasol `MON_032`, Curandeiro, Nv10;
- HP cheio;
- matchup de classe neutro;
- Flecha Certeira I e Armadilha I disponíveis conforme protocolo.

Miaumon e Aquasol são formas naturalmente válidas no Nv10.

## Bancada experimental

PR #308:

- branch apenas de análise;
- nenhuma alteração de runtime ou dados;
- pares determinísticos sem/com passiva;
- 20.000 pares `basic`;
- 20.000 pares `mixed`;
- modelo auxiliar comparando `first_hit` e `first_action`;
- scan de adversários naturais Nv10;
- sensibilidade final contra Luvursomon Nv10;
- reprodução direta de Armadilha I no Wild e Group;
- CI final com Vitest, validações, Wild Loop e Playwright verde;
- PR fechado sem merge.

## Funcionamento puro

O resolver de `swiftclaw`:

- retorna `{ atkBonus: 1 }` quando o caller marca `isFirstAttackOfCombat: true`;
- retorna `null` depois que a abertura é considerada consumida;
- não define sozinho quando uma tentativa, erro, skill de controle ou acerto deve consumir a abertura.

Essa decisão operacional está distribuída nos callers.

## Divergência de semântica encontrada

### Ataque básico que erra

Wild e Group resolvem o acerto antes de chamar a passiva do ataque básico.

Reprodução Wild:

- primeiro básico erra;
- `swiftclawFirstStrikeDone` permanece falso;
- nenhum log da passiva;
- portanto o bônus fica disponível para uma ação posterior.

### Skill ofensiva

Nos caminhos de skill, `swiftclaw` é resolvido antes da conclusão da ação.

Consequência:

- uma skill ofensiva pode marcar a abertura como consumida antes do resultado final;
- isso não é equivalente à semântica do ataque básico que erra.

### Harness quantitativo histórico

O harness de espécies só chama o resolvedor do bônus depois de confirmar um acerto.

Consequência:

- a matriz histórica mede, para `swiftclaw`, uma semântica próxima de **primeiro acerto bem-sucedido**;
- por isso a ativação histórica foi 100%;
- esse número não representa necessariamente a semântica “primeira ação ofensiva” do protocolo.

Classificação: `DRIFT`.

## Armadilha I no Wild

Armadilha I é:

- `type: BUFF`;
- `target: enemy`;
- `power: -2`;
- `buffType: SPD`.

No Wild atual, abrir o combate com Armadilha I:

- aplica temporariamente o `+1 ATK` de `swiftclaw`;
- marca `swiftclawFirstStrikeDone = true`;
- o bônus de ATK não produz benefício de dano, pois a ação é de controle;
- o log descreve a ação como “skill ofensiva”.

Fato: a abertura é consumida e o bônus é desperdiçado nessa sequência.

Se isso é desejado ou não é uma decisão de regra, não de balanceamento.

## BUG separado — Armadilha I no Group

A reprodução direta no Group confirmou comportamento incompatível com a definição da skill:

- HP do alvo: 100 → 99;
- buffs do alvo após a ação: nenhum;
- log: Armadilha I causou 1 de dano;
- `swiftclawFirstStrikeDone = true`.

Causa observada:

- `isOffensiveSkill()` classifica qualquer skill com `target: enemy` como ofensiva;
- `executePlayerSkillGroup()` usa essa classificação também para selecionar o pipeline de DAMAGE;
- uma skill de controle direcionada ao inimigo acaba no caminho de dano.

Classificação: `BUG`.

Plano de correção registrado no issue **#309 — `bug(group): skills BUFF contra inimigo entram no caminho de dano`**.

Esse bug deve ser corrigido em PR próprio e não autoriza alterar `swiftclaw`.

## Cenário oficial — Miaumon Nv10 × Aquasol Nv10

### Perfil basic — 20.000 pares, harness existente

| Métrica | Sem passiva | Com `swiftclaw` | Delta |
|---|---:|---:|---:|
| Vitória | 99,765% | 99,780% | **+0,015 p.p.** |
| Turnos | — | — | **-0,06195 médio** |
| Dano total | — | — | **+0,058 médio** |
| HP final | — | — | **+0,35155 médio** |

A passiva foi aplicada 20.000 vezes.

### Perfil mixed — 20.000 pares, harness existente

| Métrica | Sem passiva | Com `swiftclaw` | Delta |
|---|---:|---:|---:|
| Vitória | 99,975% | 99,975% | **0 p.p.** |
| Turnos | — | — | **-0,02345 médio** |
| Dano total | — | — | **+0,10775 médio** |
| HP final | — | — | **+0,12625 médio** |

A passiva foi aplicada 20.000 vezes.

Conclusão factual: o cenário oficial está fortemente saturado e não é adequado para decidir força por taxa de vitória.

Valores negativos ocasionais de delta de dano total no pareamento decorrem de lutas encerradas mais cedo; não significam que o golpe beneficiado tenha causado menos dano.

## Comparação controlada de semântica

Foi usado um modelo auxiliar apenas para isolar a diferença entre:

- `first_hit`: preserva a abertura até o primeiro acerto;
- `first_action`: a primeira tentativa ofensiva consome a abertura; se ela erra, o bônus não é reaproveitado.

Os dois modelos foram analisados separadamente. As taxas-base entre linhas não devem ser comparadas entre si porque usam seeds independentes.

### Basic

`first_hit`:
- ativação: 100%;
- primeiro ataque errou em 6,83% das execuções-base;
- delta de vitória: +0,020 p.p.;
- delta de turnos: -0,057;
- delta de dano: +0,12465.

`first_action`:
- ativação: 93,595%;
- primeiro ataque errou em 6,405%;
- delta de vitória: +0,010 p.p.;
- delta de turnos: -0,05155;
- delta de dano: +0,15275.

### Mixed

`first_hit`:
- ativação: 100%;
- primeiro ataque errou em 6,755%;
- delta de vitória: +0,005 p.p.

`first_action`:
- ativação: 93,71%;
- primeiro ataque errou em 6,29%;
- delta de vitória: 0 p.p.

Leitura segura: a escolha semântica afeta principalmente a **disponibilidade** do bônus. Sob “primeira ação”, aproximadamente 6% das lutas podem perder a passiva num erro inicial.

## Busca de cenário não saturado

O scan de formas naturalmente válidas no Nv10 encontrou como cenário mais próximo de equilíbrio:

- Miaumon `MON_009`, Caçador Nv10;
- Luvursomon `MON_017`, Animalista Nv10;
- matchup neutro;
- Luvursomon evolui apenas no Nv12, portanto é válido no Nv10.

No scan de 1.000 pares com o harness histórico:

- 67,1% → 67,8%;
- delta de vitória: +0,7 p.p.

## Sensibilidade final — Miaumon Nv10 × Luvursomon Nv10

### Harness existente / semântica de primeiro acerto — 20.000 pares

| Métrica | Sem passiva | Com `swiftclaw` | Delta |
|---|---:|---:|---:|
| Vitória | 68,210% | 69,060% | **+0,850 p.p.** |
| Turnos | — | — | **-0,02715 médio** |
| Dano total | — | — | **+0,54625 médio** |
| HP final | — | — | **+0,3965 médio** |

Ativação: 100%.

### Modelo `first_action` — 20.000 pares

- vitória: 75,750% → 76,405%;
- delta: **+0,655 p.p.**;
- ativação: **93,62%**;
- erro da primeira ação: **6,38%**;
- delta de turnos: **-0,03005**;
- delta de dano: **+0,4394**;
- delta de HP final: **+0,40635**.

A taxa-base desse modelo não deve ser comparada diretamente aos 68,210% do harness existente; o objetivo é comparar cada variante sem/com passiva dentro do mesmo modelo.

## Drift de referência de PWR

Comentários e fixtures históricas de `swiftclaw` usam Flecha Poderosa I com PWR 19 como referência de calibração.

O `data/skills.json` verificado na baseline atual contém Flecha Poderosa I com PWR 15.

A Flecha Certeira I do kit swap também usa PWR 15.

Classificação: `DRIFT` documental/de calibração.

Não recalibrar no SP-04. O tema pertence à investigação de PWR/`DEC-COMBAT-A`.

## Fatos verificados

1. O resolver de `swiftclaw` concede `+1 ATK` quando recebe a flag de primeiro ataque.
2. O bônus é único enquanto o caller gerencia o estado como consumido.
3. O cenário oficial Miaumon × Aquasol é saturado em vitória.
4. Em cenário natural menos saturado, o efeito em vitória é pequeno, mas mensurável.
5. O harness histórico preserva a abertura até o primeiro acerto.
6. Básico que erra no runtime preserva a abertura.
7. Skills podem consumir a abertura antes do desfecho da ação.
8. Armadilha I consome a abertura no Wild sem aproveitar o bônus de ATK.
9. No Group, Armadilha I atualmente causa dano em vez de aplicar o debuff; issue #309 registra o bug.
10. Referências históricas de PWR da Flecha Poderosa I divergem do catálogo runtime atual.
11. Nenhum valor, PWR ou ENE foi alterado nesta rodada.

## Inferências

- O `+1 ATK` de abertura não apresenta sinal de excesso nos cenários medidos.
- O valor mecânico é pequeno e coerente com uma passiva de abertura simples.
- A principal incerteza de `swiftclaw` é **quando a oportunidade única deve ser perdida**, não o tamanho do bônus.
- A semântica atual pode gerar experiência confusa: um erro de básico preserva a passiva, enquanto uma skill pode consumi-la; uma Armadilha pode desperdiçá-la.
- A matriz histórica provavelmente superestima a disponibilidade da passiva se a intenção final for “primeira ação ofensiva”, porque nela a ativação fica em 100%.

## Classificação

- `SP04-TECH-01` — **TECHNICAL_CONTROLLED**: bônus único de +1 ATK confirmado.
- `SP04-TECH-02` — **BALANCE**: impacto pequeno; nenhuma evidência para buff/nerf.
- `SP04-TECH-03` — **DRIFT**: runtime e harness não usam uma única semântica para consumo da abertura.
- `SP04-TECH-04` — **BUG**: BUFF/debuff contra inimigo entra no pipeline de dano do Group; issue #309.
- `SP04-TECH-05` — **DRIFT**: referência histórica de PWR 19 diverge de `data/skills.json` PWR 15.
- `SP04-TECH-06` — **DECISION**: definir exatamente o que consome “Primeiro Ataque”.
- `SP04-TECH-07` — **EVIDENCE_GAP**: percepção, compreensão e escolha espontânea permanecem humanas.

## Decisão dependente do autor

Antes do playtest humano de SP-04, é necessário escolher a semântica de consumo.

Opções tecnicamente coerentes:

### A — primeira ação ofensiva tentada

- a primeira tentativa de básico ou skill de dano consome a abertura;
- erro também consome;
- skills puramente de controle não consomem.

Vantagem: corresponde melhor à expressão “primeira ação ofensiva” e é previsível.

### B — primeiro ataque que acerta

- erros não consomem;
- o bônus fica guardado até um ataque causar acerto.

Vantagem: evita “perder” uma passiva única por azar; aproxima-se do harness histórico.

### C — primeira ação contra o inimigo, inclusive controle

- Armadilha/debuff também consome;
- o bônus de ATK pode ser desperdiçado numa ação sem dano.

Vantagem: é próxima de parte do comportamento atual, mas é a menos alinhada ao nome “Primeiro Ataque” e cria maior risco de confusão.

A escolha não deve ser feita dentro de um fix técnico do issue #309.

## Recomendação

1. manter `+1 ATK` congelado;
2. não usar os números históricos de ativação de 100% sem o caveat de `first_hit`;
3. corrigir o bug #309 em PR próprio;
4. recomendar **A — primeira ação ofensiva tentada, excluindo controle puro** como semântica mais consistente com o protocolo e com o nome da passiva, mas registrar decisão humana antes de implementar;
5. não tocar em PWR nesta etapa.

## Resultado

**SP-04 técnico: CONCLUÍDO COM CAVEATS.**

O valor `+1 ATK` não apresenta sinal para alteração. O domínio numérico está suficientemente caracterizado para avançar.

Permanecem:
- correção técnica do bug Group #309;
- decisão humana sobre a semântica de consumo da abertura;
- evidência humana futura.

Próxima passiva da bateria técnica: **SP-05 — `emberfang`**.
