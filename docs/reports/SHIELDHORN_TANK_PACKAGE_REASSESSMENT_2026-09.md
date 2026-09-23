# Shieldhorn / tank_puro — reavaliação pós-PR #288

**Status:** ACTIVE  
**Domain:** técnica / análise de balanceamento / playtest  
**Authority:** GitHub  
**VerifiedAgainst:** `ab76fcb4e2dc91e5bcf3da812130ccbe983219b4`  
**Supersedes:** nenhum

## Objetivo

Reavaliar o sinal automatizado de `shieldhorn` depois da correção do gate de linha de frente, sem alterar valores durante o portão de playtest.

A intenção de produto reafirmada pelo autor é que o arquétipo `tank_puro`:

- expresse resistência e proteção de linha de frente;
- tenha pressão ofensiva inferior a perfis de burst;
- não transforme defesa isoladamente em condição dominante de vitória;
- não produza combates estagnados em que o tank apenas sobrevive sem avançar o combate.

## FATOS VERIFICADOS

### 1. Drift de posição corrigido

O PR #288 foi integrado em `ab76fcb4`.

Depois do merge:

- `shieldhorn` exige linha de frente em combate Group;
- Wild declara explicitamente o combatente ativo como linha de frente;
- `damageReduction: 1` e o gate de primeiro hit por turno não mudaram;
- workflows `Tests (Vitest)` e `Combat v2.2 Baseline` concluíram com sucesso no head do PR.

### 2. A matriz quantitativa de espécies mede a passiva de forma isolada

`js/combat/speciesPassiveQuantitativeHarness.js`:

- usa pares `sem passiva × com passiva`;
- seleciona o mesmo template base da classe para jogador e inimigo;
- multiplica o HP escalado por `1.6`;
- não aplica os offsets de espécie via `speciesBridge`;
- não aplica kit swap;
- não modela a economia integral de ENE;
- usa ações roteirizadas.

O relatório de julho registrou para `shieldhorn`:

- ativação: `99,88%`;
- delta de vitória: `+10,15 p.p.`;
- dano evitado médio: `5,726833`.

Esse número caracteriza o efeito da mitigação plana no cenário controlado. Ele não equivale ao desempenho completo do Ferrozimon ou de todo o arquétipo `tank_puro` no runtime.

### 3. O pacote runtime do tank contém mais componentes que a passiva

Para `shieldhorn`, o runtime também aplica:

- offset de espécie: `HP +1`, `ATK -1`, `DEF +1`;
- kit swap base: `Golpe Pesado I`, custo 6, PWR 22;
- promoção: `Golpe Pesado II`, custo 8, PWR 30.

A fonte runtime atual de skills, `data/skills.json`, contém para Guerreiro:

- `Golpe de Espada I`: PWR 14, custo 4;
- `Golpe de Espada II`: PWR 20, custo 6;
- `Golpe de Espada III`: PWR 28, custo 8.

### 4. As referências de calibração do kit swap estão desatualizadas

`js/canon/kitSwap.js` e testes de auditoria ainda descrevem/comparam:

- Guerreiro I como PWR 18;
- Guerreiro II como PWR 24 ou referência de eficiência antiga;
- Guerreiro III como PWR 30;
- em alguns testes de promoção, referência tier 2 com PWR 32.

Esses valores não correspondem a `data/skills.json` atual.

Isso é um **DRIFT de calibração/documentação/teste**, não uma autorização automática para mudar PWR. O próprio projeto mantém `DEC-COMBAT-A` como decisão humana pendente para PWR e catálogo.

## ANÁLISE EXPLORATÓRIA

Foi feita uma simulação exploratória fora do harness oficial, usando valores atuais do catálogo, offsets de `shieldhorn`, economia simplificada de ENE e PWRs do kit swap.

Ela serve para orientar a próxima investigação; não substitui o harness oficial, CI nem playtest.

### Mitigação plana em contextos diferentes

Em cenários com golpes médios/altos, o ganho de vitória associado ao `-1` ficou pequeno:

- cenário L10 intermediário: aproximadamente `+4,3` a `+4,8 p.p.`;
- cenário L20 intermediário: aproximadamente `+0,2 p.p.`;
- cenários L30 examinados: alteração de vitória próxima de zero, apesar de dano efetivamente evitado.

Em um cenário deliberadamente favorável à mitigação plana — muitos golpes pequenos — o efeito foi maior:

- aproximadamente `+6` a `+10 p.p.` em confrontos próximos da faixa competitiva;
- dano evitado acumulado em torno de 5–6 HP por combate nos cenários centrais.

### Política defensiva com Escudo

Também foi testada uma política simples que prioriza `Escudo I` sempre que o buff não está ativo.

Nos cenários examinados:

- a política defensiva alongou o combate em cerca de 2–3 turnos;
- não produziu empates no limite de 40 turnos;
- reduziu fortemente a taxa de vitória porque o Guerreiro abriu mão de ações ofensivas.

Portanto, nesta exploração não apareceu o padrão "não morre, não mata e vence por desgaste".

### PWR do Golpe Pesado

A comparação ofensiva indica que o PWR 22 atual do `Golpe Pesado I` é substancialmente superior ao PWR 14 da skill de Guerreiro que hoje ocupa o mesmo estágio na fonte runtime.

Em uma amostra de alvos atuais, a diferença de dano esperado do tank foi aproximadamente:

- PWR 18: +21% versus skill padrão de Guerreiro;
- PWR 20: +31%;
- PWR 21: +36%;
- PWR 22: +41%.

Essa comparação não decide qual valor é correto. Ela mostra apenas que a justificativa histórica "+22% versus PWR 18" não descreve mais o catálogo runtime atual.

## INFERÊNCIAS

1. O sinal `+10,15 p.p.` da matriz isolada continua relevante para observação, mas não é evidência suficiente de que `damageReduction: 1` esteja excessivo no pacote real.
2. O risco de excesso atual pode estar distribuído entre passiva, offsets, skill exclusiva, passiva de classe do Guerreiro, matchups e duração do combate.
3. Recalibrar `shieldhorn` antes de reconciliar o kit ofensivo pode corrigir o componente errado.
4. A ausência de estagnação na exploração reduz a urgência de nerfar a defesa antes do playtest humano.

## CLASSIFICAÇÃO

| ID | Tipo | Achado | Estado |
|---|---|---|---|
| `SH-TANK-01` | DRIFT | `shieldhorn` ignorava posição no Group | **CORRIGIDO no PR #288** |
| `SH-TANK-02` | DRIFT | auditoria do Golpe Pesado usa PWRs de referência antigos | **ABERTO** |
| `SH-TANK-03` | EVIDENCE_GAP | não existe harness oficial que simule o pacote completo do tank com offsets + kit swap + ENE + posição | **ABERTO** |
| `SH-TANK-04` | EVIDENCE_GAP | ainda não há coleta humana válida de SP-01 pós-correção | **ABERTO** |
| `SH-TANK-05` | DECISION | eventual alteração de PWR depende de `DEC-COMBAT-A` | **AUTOR** |
| `SH-TANK-06` | BALANCE | necessidade de nerf em `damageReduction: 1` | **NÃO ESTABELECIDA** |

## RECOMENDAÇÃO

Durante o portão atual:

1. manter `damageReduction: 1`;
2. executar SP-01 já sobre o baseline `ab76fcb4`;
3. registrar percepção, compreensão, hits, reduções, duração, escolhas e justiça;
4. não usar a matriz isolada como estimativa direta de win rate do Ferrozimon;
5. tratar a recalibração do `Golpe Pesado` dentro de `DEC-COMBAT-A`, separadamente da coleta da passiva.

Após a coleta de SP-01:

- cruzar a evidência humana com a matriz isolada;
- decidir se é necessário um harness adicional do pacote completo;
- somente então discutir alteração numérica de passiva ou PWR.

Nenhum buff ou nerf é autorizado por este relatório.
