# SP-06B técnico — shadowsting

**Status:** ACTIVE  
**Domain:** playtest técnico / passivas de espécie  
**Authority:** GitHub  
**VerifiedAgainst:** `d53db6bcda76e016ec1c9474bdebdba5717d990a`; análise executada no PR #304  
**Supersedes:** nenhum  
**Classificação de evidência:** `TECHNICAL_CONTROLLED`

## Objetivo

Verificar a cadeia mecânica de `shadowsting` antes do playtest humano:

`debuff válido → carga criada → próximo ataque básico recebe +1 ATK → carga consumida`.

Esta rodada não mede percepção, compreensão, diversão, frustração, justiça nem estratégia espontânea de crianças.

## Contrato verificado

O resolver canônico confirma:

- sem carga, o ataque básico não recebe bônus;
- skill ofensiva não consome a carga;
- somente ataque básico com carga recebe `+1 ATK`;
- após o consumo, a carga é removida pelo caller.

O perfil `basic`, sem debuff prévio, funcionou como controle negativo: nenhuma carga criada, nenhuma carga consumida e nenhum delta.

## Limite metodológico

O harness quantitativo usa a sequência técnica `debuff → básico` para isolar a passiva.

Ele **não** modela integralmente o efeito estatístico do próprio debuff aplicado ao adversário. Portanto:

- mede corretamente criação/consumo da carga e o `+1 ATK` no básico;
- não estima o pacote completo da estratégia real de Ladino com debuff;
- não representa escolha espontânea de sequência por uma criança.

## Drift do cenário do protocolo

O protocolo histórico SP-06B sugere:

- Umbraquimonom `MON_022C`, Nv30;
- Vitalion `MON_031B`, Nv30.

Porém `MON_031B` evolui para `MON_031C` no Nv25. Logo, **Vitalion Nv30 não é uma configuração de progressão natural**.

Classificação: `DRIFT` de configuração do protocolo.

A configuração histórica foi preservada como referência de comparação, mas não deve ser tratada como cenário natural em coleta futura.

## Bancada experimental

PR #304:

- branch de análise apenas;
- nenhuma alteração de runtime;
- mesmas seeds entre variante sem/com passiva;
- CI final com Vitest, validações, Wild Loop e Playwright verde;
- PR fechado sem merge após a coleta.

## Cenário histórico do protocolo — Umbraquimonom × Vitalion Nv30

20.000 pares:

| Métrica | Sem passiva | Com `shadowsting` | Delta |
|---|---:|---:|---:|
| Vitória | 99,955% | 99,955% | 0 p.p. |
| Turnos médios | 8,10545 | 8,10545 | 0 |
| Dano total | — | — | **+3,847 médio** |
| HP final jogador | — | — | 0 |

Efeitos:

- cargas criadas: 81.058;
- cargas consumidas: 76.940;
- aplicações de `+1 ATK`: 76.940.

O cenário está saturado em vitória e não serve para inferir magnitude de balanceamento.

## Progressão válida — Umbraquimonom × Vitalegion Nv30

20.000 pares:

- vitória: 1,73% → 1,73%;
- delta de vitória: 0 p.p.;
- dano adicional médio: +3,29725;
- cargas criadas: 82.396;
- cargas consumidas: 65.945.

A forma evoluída correta deixa o confronto no extremo oposto: difícil demais para sensibilidade de vitória.

## Scan de candidatos naturais Nv30

Foi executado um scan exploratório de formas válidas no Nv30, sem lendários/deprecated e evitando matchups diretos de vantagem/desvantagem do Ladino.

O melhor candidato encontrado para reduzir saturação foi:

- Auravelo `MON_028C`, Curandeiro, Raro;
- taxa de vitória-base no scan de 1.000 pares: ~29,2%.

## Sensibilidade principal — Umbraquimonom × Auravelo Nv30

20.000 pares:

| Métrica | Sem passiva | Com `shadowsting` | Delta |
|---|---:|---:|---:|
| Vitória | 29,67% | 29,67% | **0 p.p.** |
| Turnos médios | 9,21565 | 9,21565 | **0** |
| Dano causado | — | — | **+4,1638 médio** |
| HP final jogador | — | — | **0** |

Distribuição do dano adicional:

- mediana: +4;
- p10: +3;
- p90: +5;
- mínimo: +1;
- máximo: +5;
- aumento positivo em 100% dos pares.

Estado de carga:

- cargas criadas: 96.636;
- cargas consumidas: 83.276;
- aplicações de `+1 ATK`: 83.276;
- aproximadamente 86,2% das cargas criadas foram consumidas antes do fim do combate.

## Controle sem setup

Perfil `basic`, 5.000 pares:

- cargas criadas: 0;
- cargas consumidas: 0;
- aplicações de +1 ATK: 0;
- delta de vitória: 0;
- delta de dano: 0.

Isso confirma que a passiva não vaza para ataques básicos sem o setup exigido.

## Fatos verificados

1. A cadeia `debuff → carga → básico +1 ATK → consumo` funciona.
2. Skill ofensiva não consome a carga.
3. Sem debuff, não existe ativação.
4. O bônus adiciona dano mensurável e consistente quando consumido.
5. No melhor cenário competitivo natural encontrado, o bônus adicionou ~4,16 de dano por combate, mas não mudou vitória ou TTK.
6. O cenário histórico Vitalion Nv30 é progressivamente inválido e saturado.
7. Vitalegion Nv30 é progressivamente válido, porém excessivamente difícil para sensibilidade.
8. Nenhum valor, PWR ou ENE foi alterado.

## Inferências

- `shadowsting` possui identidade mecânica clara de setup → execução.
- O `+1 ATK` atual é funcional, porém os breakpoints da fórmula fizeram o dano adicional não se converter em TTK ou vitória nos cenários examinados.
- Ausência de delta em vitória não equivale a passiva inútil: ela aumentou dano em todos os pares contra Auravelo.
- O valor estratégico completo pode ser maior quando o efeito real do debuff e escolhas de ação são modelados conjuntamente.
- A relevância percebida da sequência continua sendo uma pergunta humana, não técnica.

## Classificação

- `SP06B-TECH-01` — **TECHNICAL_CONTROLLED**: cadeia funcional confirmada.
- `SP06B-TECH-02` — **DRIFT**: Vitalion Nv30 no protocolo não é progressão natural.
- `SP06B-TECH-03` — **BALANCE**: dano adicional existe, mas não houve delta de vitória/TTK nas condições testadas.
- `SP06B-TECH-04` — **EVIDENCE_GAP**: pacote completo debuff + carga + decisões humanas não medido por este harness.
- `SP06B-TECH-05` — **EVIDENCE_GAP**: percepção/compreensão/uso espontâneo não testados.

## Recomendação

Manter a regra atual congelada:

`debuff válido → próximo básico recebe +1 ATK`.

Não há evidência suficiente para buff ou nerf.

Para futuro playtest humano, substituir a configuração inválida de Vitalion Nv30 por um adversário de progressão válida e registrar explicitamente o matchup usado.

## Resultado

**SP-06B técnico: CONCLUÍDO COM CAVEAT.**

A cadeia funcional foi demonstrada e a passiva gera ganho quantitativo de dano. O protocolo histórico contém um drift de progressão, e os cenários examinados não justificam alteração numérica.

Próxima prioridade: **SP-06C — `bellwave`**.
