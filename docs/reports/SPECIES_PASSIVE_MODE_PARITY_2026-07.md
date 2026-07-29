# Paridade final das passivas de espécie — Wild × Group

## Status

Relatório de revalidação do combate v2.2, baseado na `main` após o merge dos PRs #266, #273 e #274.

As duas decisões de pipeline estão implementadas nos caminhos comparáveis:

- `DEC-SPECIES-ATK-01`: `atkBonus` entra no ATK antes da fórmula;
- `DEC-SPECIES-DEF-01`: resistência percentual ocorre antes da redução plana de espécie.

O despacho das passivas de espécie nas skills Group também está integrado.

Este documento substitui a fotografia pós-PR #264. Não altera valores, gatilhos ou balanceamento.

## Fontes

- `js/canon/speciesPassives.js`
- `js/combat/combatEvents.js`
- `js/combat/wildActions.js`
- `js/combat/groupActions.js`
- `js/combat/groupCore.js`
- `js/combat/groupCombatFormula.js`
- `tests/speciesPassiveModeParityV22.test.js`
- `tests/speciesPassiveFinalParityV22.test.js`
- `tests/groupSkillExecution.test.js`
- `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`

## Método

A comparação separa cinco dimensões:

1. **contrato puro:** evento, condição e modificador retornado;
2. **integração:** ponto em que o evento é despachado;
3. **estado:** criação, consumo e bloqueio de nova ativação;
4. **pipeline:** etapa em que o modificador entra no cálculo;
5. **efeito observável:** resultado produzido pelos pipelines reais.

Compartilhar o mesmo resolver não é considerado prova suficiente de paridade.

## Classificações

- `PARITY`: condição, estado e efeito equivalentes no caminho comparado;
- `EXPECTED_DIFFERENCE`: funcionalidade adicional fora do contrato comparado;
- `DRIFT_WILD_GROUP`: divergência no mesmo contrato comparável;
- `EVIDENCE_GAP`: o runtime não expõe informação suficiente para concluir equivalência.

## Matriz final

| Espécie | Contrato comparado | Wild | Group | Classificação |
|---|---|---|---|---|
| `shieldhorn` | primeiro hit recebe `-1` após resistência percentual | resistência antes da redução plana | resistência antes da redução plana | `PARITY` |
| `emberfang` | skill ofensiva bem-sucedida, HP >70%, `+1 ATK` | bônus antes da fórmula | bônus antes da fórmula | `PARITY` |
| `floracura` | primeiro item de cura recebe até `+3 HP` | integrado e consome estado | integrado e consome estado | `PARITY` |
| `swiftclaw` | primeira ação de ataque recebe `+1 ATK` | skill e básico consomem abertura | skill e básico consomem abertura | `PARITY` |
| `moonquill` | debuff bem-sucedido concede `+1 SPD` por 1 turno | buff canônico aplicado | buff canônico aplicado | `PARITY` |
| `shadowsting` | debuff bem-sucedido prepara próximo básico | cria carga; básico consome | cria carga; básico consome | `PARITY` |
| `bellwave` | skill válida bem-sucedida prepara próximo básico | cria carga; básico consome | cria carga; básico consome | `PARITY` |
| `wildpace` | HP <40% concede `+1 ATK` antes da fórmula | básico e skill usam ATK efetivo | básico e skill usam ATK efetivo | `PARITY` |

## Evidência comportamental

### SP-FINAL-01 — Pipeline ofensivo alinhado

Os dois modos aplicam `atkBonus` ao ATK efetivo antes do cálculo de dano.

A revalidação executa diretamente `executeWildSkill()` e `executePlayerSkillGroup()` e confirma:

- `emberfang`: delta de `+1 ATK` nos dois modos;
- limite de HP exatamente em 70% sem ativação;
- `swiftclaw`: mesmo bônus e mesmo consumo de `swiftclawFirstStrikeDone`;
- `wildpace`: mesmo `+1 ATK` abaixo de 40% de HP.

### SP-FINAL-02 — Estados de skill alinhados

Após uma skill válida e bem-sucedida:

- `moonquill` recebe `{ type: 'spd', power: 1, duration: 1 }`;
- `shadowsting` marca `shadowstingDebuffCharged = true`;
- `bellwave` marca `bellwaveRhythmCharged = true`.

O ataque básico continua responsável por consumir as cargas de `shadowsting` e `bellwave`.

### SP-FINAL-03 — Ações inválidas não produzem estado

Com ENE insuficiente, os dois modos interrompem a ação antes do despacho das passivas e não criam `passiveState`.

### SP-FINAL-04 — Shieldhorn e Floracura permanecem equivalentes

Os testes anteriores continuam exigindo:

- resistência percentual antes de `shieldhorn` nos dois modos;
- dano de fronteira 3 sem passiva e 2 com passiva;
- primeira cura por item resultando em 83 HP a partir de 50/100 com cura-base de 30.

## Lacuna de evidência

### EG-01 — Skill que erra

O Group resolve a acurácia dentro de `executePlayerSkillGroup()` e possui um ramo explícito de erro que ainda despacha `ON_SKILL_USED`.

O Wild delega a execução para `dependencies.useSkill()` e recebe apenas um booleano `success`. Em `executeWildSkill()`, `success = false` é tratado como ação inválida antes de `ON_SKILL_USED`.

Consequência:

- existe evidência de paridade para skills válidas e bem-sucedidas;
- não existe evidência suficiente para afirmar que uma skill Wild que erra deve produzir exatamente o mesmo evento do Group;
- esta lacuna não autoriza correção neste PR.

Classificação específica: `EVIDENCE_GAP`.

## Diferença adicional fora da matriz

O Wild possui um kit swap de execução furtiva para `shadowsting`, capaz de consumir a carga em uma skill específica.

A passiva canônica comparada nesta matriz é a produção da carga após debuff e seu consumo pelo próximo ataque básico. O kit swap é uma funcionalidade adicional e não invalida a paridade desse contrato.

Classificação: `EXPECTED_DIFFERENCE` fora do núcleo da matriz.

## Limites

Esta revalidação não cobre integralmente:

- passivas em inimigos controlados pela IA Group;
- troca de monstrinho;
- KO seguido de retorno;
- reset entre encontros consecutivos;
- múltiplos hits na mesma rodada;
- skills de área com múltiplos alvos;
- passivas em boss;
- Card Layer;
- recalibração dos valores.

## Próximo portão técnico

A sequência corretiva das passivas está encerrada nos caminhos comparáveis.

O próximo passo é revisar a baseline quantitativa do combate v2.2, usando seed fixa e comparando a nova distribuição com a baseline anterior.

A revisão quantitativa deve observar, no mínimo:

- dano médio;
- duração dos combates;
- distribuição das categorias de RC;
- críticos e falhas totais;
- sobrevivência;
- impacto das classes;
- frequência e efeito das passivas.

A lacuna `EG-01` deve permanecer registrada e só deve gerar um PR próprio caso seja necessário formalizar a semântica de erro de skill entre os modos.

## Classificação final

**A. Paridade comprovada nos caminhos comparáveis; lacunas restantes isoladas.**
