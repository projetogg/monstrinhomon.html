# SP-06C técnico — bellwave

**Status:** ACTIVE  
**Domain:** playtest técnico / passivas de espécie  
**Authority:** GitHub  
**VerifiedAgainst:** `f4495f8e489633b36634ae58a0a5fcd17bbb9257`; análise executada no PR #306  
**Supersedes:** nenhum  
**Classificação de evidência:** `TECHNICAL_CONTROLLED`

## Objetivo

Verificar a cadeia mecânica de `bellwave` antes do playtest humano:

`skill válida usada → ritmo carregado → próximo ataque básico recebe +1 ATK → carga consumida`.

Esta rodada não mede percepção, compreensão, diversão, frustração, justiça nem descoberta espontânea da alternância por crianças.

## Contrato verificado

O resolver canônico confirma:

- sem carga, ataque básico não recebe bônus;
- skill ofensiva não consome a carga;
- ataque básico com carga recebe `+1 ATK`;
- o caller consome a carga após aplicação;
- o estado é booleano: skills consecutivas renovam uma única carga, não acumulam cargas.

No Group, teste já existente confirma que uma skill ofensiva válida que erra ainda despacha `ON_SKILL_USED` e carrega `bellwave`. ENE insuficiente não cria carga.

## Configuração do protocolo

O cenário SP-06C é progressivamente válido:

- Rainhassommon `MON_027C`, Bardo, Nv30;
- Sombrifur `MON_030C`, Ladino, Nv30;
- ambas as formas existem naturalmente nesse nível;
- Bardo × Ladino é matchup neutro.

## Caveat de nomenclatura e kit

Há duas habilidades chamadas **Nota Discordante I** no material runtime:

1. `data/skills.json`: skill Bardo de DAMAGE, PWR 12, custo 5;
2. kit swap de `bellwave`: `bellwave_discordant_note`, BUFF/debuff de SPD -2 por 2 turnos, custo 4.

O harness quantitativo usado nesta rodada seleciona a skill Bardo tier-1 de DAMAGE. Isso isola corretamente a passiva — qualquer skill válida carrega o ritmo — mas **não mede o pacote completo do kit swap de assinatura**.

Classificação: `EVIDENCE_GAP` para a interação integral entre passiva, debuff de SPD e iniciativa.

## Drift de redação do protocolo

O texto observacional chama o gatilho de “qualquer skill bem-sucedida”.

A regra canônica é “após usar qualquer habilidade”, e o runtime Group carrega o ritmo mesmo quando uma skill ofensiva válida erra.

Para evitar ambiguidade futura, o protocolo deve usar:

> qualquer skill válida usada carrega o ritmo; uma ação inválida, como ENE insuficiente, não carrega.

Isso é alinhamento documental, não mudança de regra.

## Bancada experimental

PR #306:

- branch apenas de análise;
- nenhuma alteração de runtime;
- mesmas seeds entre variante sem/com passiva;
- cenário oficial, controle sem setup, modelo estrutural de cadência e scans de sensibilidade;
- CI final com Vitest, validações, Wild Loop e Playwright verde;
- PR fechado sem merge.

## Modelo estrutural de cadência

100 ciclos `skill → básico`:

- skills usadas: 100;
- cargas novas: 100;
- renovações: 0;
- básicos com carga: 100;
- consumo por skill: 100%.

100 ciclos `skill → skill → básico`:

- skills usadas: 200;
- cargas novas: 100;
- renovações: 100;
- básicos com carga: 100;
- consumo por skill: 50%.

Conclusão factual: a passiva recompensa alternância. Usar outra skill enquanto a carga está ativa apenas renova o estado binário; não cria uma segunda carga.

## Cenário oficial — Rainhassommon Nv30 × Sombrifur Nv30

20.000 pares:

| Métrica | Sem passiva | Com `bellwave` | Delta |
|---|---:|---:|---:|
| Vitória | 0% | 0% | 0 p.p. |
| Turnos médios | 3,15535 | 3,15535 | 0 |
| Dano causado | — | — | **+1,96555 médio** |
| HP final jogador | — | — | 0 |

Distribuição do dano adicional:

- mediana: +2;
- p10: +1;
- p90: +3;
- mínimo: 0;
- máximo: +6;
- aumento positivo em 93,35% dos pares.

Estado de carga:

- cargas criadas: 40.279;
- cargas consumidas: 21.673;
- taxa carga criada → consumida: ~53,81%.

O cenário oficial é fortemente saturado contra Rainhassommon e não serve para decidir força numérica por vitória.

## Controle sem setup

Perfil apenas básico, 5.000 pares:

- cargas criadas: 0;
- cargas consumidas: 0;
- aplicações de +1 ATK: 0;
- delta de vitória: 0;
- delta de dano: 0.

A passiva não vaza para básicos sem skill anterior.

## Busca de cenário menos saturado

Com Rainhassommon Nv30, o melhor adversário natural neutro encontrado ainda produziu apenas ~1,3% de vitória-base.

Em vez de editar stats ou níveis, foi usada a segunda linha já oficialmente mapeada para `bellwave`:

- TRockmon `MON_007`, Bardo, Raro;
- Nv30 é natural, pois a evolução seguinte ocorre apenas no Nv45.

O scan apontou Umbraquimonom `MON_022C` Nv30 como matchup útil:

- vitória-base no scan de 1.000 pares: ~71,2%.

## Sensibilidade principal — TRockmon Nv30 × Umbraquimonom Nv30

20.000 pares:

| Métrica | Sem passiva | Com `bellwave` | Delta |
|---|---:|---:|---:|
| Vitória | 70,385% | 70,390% | **+0,005 p.p.** |
| Turnos médios | 4,87065 | 4,87065 | **0** |
| Dano causado | — | — | **+1,9375 médio** |
| HP final jogador | — | — | **+0,0032 médio** |

Distribuição do dano adicional:

- mediana: +2;
- p10: +2;
- p90: +2;
- mínimo: 0;
- máximo: +3;
- aumento positivo em 99,77% dos pares.

Estado de carga:

- cargas criadas: 56.632;
- cargas consumidas: 38.750;
- taxa carga criada → consumida: ~68,42%.

O delta de vitória equivale a uma única virada líquida em 20.000 pares e não constitui evidência de impacto material em vitória.

## Limitações da medição

O harness desta rodada isola a passiva e não reproduz o pacote completo da espécie:

- não aplica integralmente offsets de espécie ao cenário pareado;
- não usa a Nota Discordante do kit swap como ação do perfil mixed;
- não mede integralmente ENE e decisão de seleção entre todas as skills;
- não mede iniciativa modificada pelo debuff de SPD do kit swap;
- não mede comportamento humano.

Essas limitações são adequadas para confirmar o efeito isolado, mas impedem concluir o valor estratégico total do arquétipo `cadencia_ritmica`.

## Fatos verificados

1. `bellwave` cria uma carga após qualquer skill válida usada.
2. Skill ofensiva que erra ainda pode criar carga; ação inválida não cria.
3. A carga só beneficia ataque básico.
4. Skills consecutivas renovam uma carga binária; não acumulam.
5. Perfil sem skill não ativa a passiva.
6. O +1 ATK acrescenta dano de forma consistente quando consumido.
7. No cenário menos saturado testado, houve +1,9375 de dano médio, 0 mudança de TTK e apenas +0,005 p.p. de vitória.
8. Nenhum valor, PWR ou ENE foi alterado.

## Inferências

- A identidade de `bellwave` como cadência `skill → básico` está tecnicamente presente.
- O estado binário cria um custo de oportunidade real para skills consecutivas: a segunda skill renova, mas não acumula benefício.
- O +1 ATK isolado tem efeito de dano consistente, porém impacto muito pequeno em resultados finais nos cenários medidos.
- O valor estratégico completo pode depender mais do conjunto passiva + ENE + debuff de SPD + iniciativa do que do +1 ATK isolado.

## Classificação

- `SP06C-TECH-01` — **TECHNICAL_CONTROLLED**: cadeia funcional confirmada.
- `SP06C-TECH-02` — **DRIFT**: redação “skill bem-sucedida” é mais restritiva/ambígua que contrato/runtime.
- `SP06C-TECH-03` — **EVIDENCE_GAP**: harness não mede o kit swap de Nota Discordante + iniciativa como pacote.
- `SP06C-TECH-04` — **BALANCE**: dano adicional consistente, sem impacto material de TTK/vitória nas condições testadas.
- `SP06C-TECH-05` — **EVIDENCE_GAP**: percepção, compreensão e alternância espontânea permanecem humanas.

## Recomendação

Manter congelada a regra atual:

`qualquer skill válida usada → próximo básico recebe +1 ATK`.

Não há evidência suficiente para buff ou nerf.

Antes do playtest humano, alinhar a redação do protocolo e identificar explicitamente a Nota Discordante do kit swap para evitar seleção da skill homônima legada.

## Resultado

**SP-06C técnico: CONCLUÍDO COM CAVEAT.**

A cadeia funcional e a identidade de cadência foram demonstradas. O cenário oficial está saturado, e uma segunda linha válida mostrou ganho de dano consistente sem efeito material de TTK ou vitória.

Passivas ainda sem rodada técnica dedicada nesta etapa: **SP-04 `swiftclaw`** e **SP-05 `emberfang`**.

Próxima prioridade recomendada: **SP-04 — `swiftclaw`**.
