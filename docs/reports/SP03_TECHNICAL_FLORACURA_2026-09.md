# SP-03 técnico — Floracura com oportunidade natural de cura

**Status:** ACTIVE  
**Domain:** técnica / playtest / análise quantitativa  
**Authority:** GitHub  
**VerifiedAgainst:** `03a67aa1fb54698feea1f9959988dcd536c50ac8`; análise executada no PR #295  
**Supersedes:** nenhum

## Objetivo

Medir `floracura` no cenário SP-03 a partir de HP cheio, usando o Petisco de Cura runtime e separando:

`oportunidade de cura → uso técnico do item → ativação → espaço real para o bônus → impacto no combate`.

Este relatório não substitui playtest humano e não atribui a nenhuma política simulada o comportamento de uma criança.

## Configuração

- jogador: Nutrilo `MON_028`, Curandeiro, Nv10;
- adversário: Furtilhon `MON_030`, Ladino, Nv10;
- matchup de classe: neutro;
- HP inicial: 100%;
- Petisco: `IT_HEAL_01`;
- cura runtime do item: 30% do HP máximo, mínimo 30 HP;
- `floracura`: primeiro item de cura pode adicionar até +3 HP;
- offset canônico de espécie aplicado igualmente às variantes sem/com passiva;
- HP máximo do Nutrilo no experimento: 54;
- item consome a ação do turno e o inimigo age depois, como no runtime;
- comparação pareada com seeds idênticas.

O PR #295 foi bancada experimental e foi fechado sem merge após coleta e CI verde.

## Limite metodológico

A política técnica usa ataque básico quando não usa item.

Ela **não modela preferência humana** entre:

- ataque;
- `Cura I`;
- Petisco.

Logo, responde ao impacto mecânico do bônus quando o item é escolhido, não à frequência espontânea com que uma criança escolheria o item em vez de `Cura I`.

## Resultado principal — política de item em <=50% HP

20.000 pares:

| Métrica | Sem passiva | Com `floracura` | Delta |
|---|---:|---:|---:|
| Vitória | 7,125% | 8,455% | **+1,33 p.p.** |
| Turnos médios | — | — | **+0,168** |
| HP final médio | — | — | **+0,202** |

Disponibilidade e cura:

- oportunidade de sofrer dano: 100%;
- uso técnico do item: 99,835%;
- HP médio antes do item: 13,69 / 54;
- cura-base média por uso: 29,90 HP;
- usos com algum espaço para o bônus: **87,52%**;
- usos com +3 completo: **86,75%**;
- usos em que o bônus virou 0 por cap de HP: **12,48%**;
- bônus médio por uso: **+2,61 HP**;
- cura total média por uso com a passiva: **32,51 HP**;
- todos os usos observados sobreviveram ao contra-ataque imediatamente posterior.

## Sensibilidade ao timing do item

5.000 pares por política, Furtilhon Nv10:

| Limiar técnico | Uso do item | +3 completo entre usos | Bônus médio/uso | Delta vitória |
|---|---:|---:|---:|---:|
| <=70% HP | 100% | 7,56% | +0,229 HP | +0,06 p.p. |
| <=50% HP | 99,8% | 86,79% | +2,610 HP | +1,46 p.p. |
| <=40% HP | 98,26% | **100%** | **+3,000 HP** | +1,46 p.p. |
| <=30% HP | 89,9% | **100%** | **+3,000 HP** | +1,30 p.p. |

### Leitura

O timing domina a eficiência da passiva.

- uso cedo: o Petisco sozinho frequentemente chega ao HP máximo; o bônus não cabe;
- uso intermediário: a maior parte do +3 cabe;
- uso em <=40%: o +3 cabe integralmente nos usos observados;
- uso ainda mais tardio não aumenta o bônus, mas reduz a frequência de uso antes do fim do combate.

## Sensibilidade à dificuldade

Política técnica em <=40% HP, 5.000 pares por adversário:

| Furtilhon | Vitória sem | Vitória com | Delta |
|---|---:|---:|---:|
| Nv8 | 27,26% | 31,02% | **+3,76 p.p.** |
| Nv9 | 13,02% | 15,96% | **+2,94 p.p.** |
| Nv10 | 6,94% | 8,36% | **+1,42 p.p.** |

O cenário oficial Nv10 é severo sob esta política simplificada e não deve ser tratado isoladamente como matchup equilibrado.

## Feedback runtime

### Wild

Foi confirmado no pipeline real:

- HP 20/54;
- cura-base do Petisco: +30;
- `floracura`: +3;
- HP final: 53/54.

Porém:

- `result.actualHeal` retornou **30**;
- `onHealVisualFeedback` recebeu **30**;
- o +3 apareceu em linha separada do log da passiva.

Assim, o estado mecânico final está correto, mas o feedback visual principal não comunica a cura total de 33 HP.

### Group

O Group também registra o bônus da passiva em linha própria e registra a cura-base separadamente no log.

Isso não altera o HP correto, mas fragmenta a leitura do total curado.

## FATOS VERIFICADOS

1. `floracura` aplica corretamente até +3 HP na primeira cura por item.
2. O bônus nunca ultrapassa HP máximo.
3. O Petisco runtime é muito grande em relação ao HP do Nutrilo Nv10: mínimo 30 para 54 HP máximos.
4. Por isso, usar o item cedo pode consumir a primeira ativação sem produzir bônus real.
5. Quando usado em <=40% HP, o +3 completo apareceu em 100% dos usos observados.
6. O impacto em vitória foi pequeno/moderado nos cenários medidos e não configura virada automática.
7. O feedback Wild principal exclui o bônus do número mostrado/retornado, apesar de o log separado registrar +3.

## INFERÊNCIAS

1. A identidade “cura eficiente” depende mais do timing do item do que de poder bruto.
2. O `+3` pode recompensar esperar uma oportunidade de cura real sem produzir sustain permanente.
3. O mínimo de 30 HP do Petisco é um fator maior que a passiva no early/mid level e deve permanecer separado de qualquer eventual decisão sobre `floracura`.
4. O feedback fragmentado pode dificultar a percepção humana da passiva, especialmente porque a diferença é pequena.
5. O cenário técnico não permite concluir se crianças escolherão Petisco em vez de `Cura I`.

## CLASSIFICAÇÃO

- `SP03-TECH-01` — **TECHNICAL_CONTROLLED**: gatilho e benefício medidos a partir de HP cheio.
- `SP03-TECH-02` — **BALANCE**: impacto pequeno/moderado; nenhum buff/nerf justificado.
- `SP03-TECH-03` — **EVIDENCE_GAP**: escolha espontânea `Cura I` × Petisco não testada.
- `SP03-TECH-04` — **EVIDENCE_GAP**: cenário Nv10 simplificado é severo e não estima sozinho balanceamento global.
- `SP03-UX-01` — **UX**: feedback principal Wild comunica cura-base, não cura total incluindo `floracura`.
- `SP03-UX-02` — **UX**: Group fragmenta cura-base e bônus em linhas distintas; revisar antes do playtest humano.

## Recomendação

Manter congelado:

`primeiro item de cura do combate → até +3 HP`.

Não alterar o Petisco, a passiva ou a Cura I neste passo.

Antes do playtest humano, revisar a apresentação do feedback para que o bônus seja perceptível sem criar números contraditórios.

## Próximo passo técnico

Executar SP-04 / `swiftclaw`:

- primeira ação ofensiva livre;
- básico × skill quando aplicável;
- frequência de ativação;
- dano adicional;
- breakpoints de TTK/resultado;
- sem induzir uma política como se fosse comportamento humano.

Depois seguir SP-05 / `emberfang` e só então SP-06A/B/C das passivas avançadas de setup.
