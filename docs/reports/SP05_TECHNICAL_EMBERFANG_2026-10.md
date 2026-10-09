# SP-05 técnico — `emberfang` (Fúria Crescente)

**Status:** ACTIVE — relatório técnico controlado e datado; não cria nem modifica regras.  
**Domain:** playtest técnico / combate v2.2 / passivas de espécie.  
**Authority:** GitHub — evidência técnica vinculada à baseline; não é decisão normativa.  
**VerifiedAgainst:** `main` `cde906a27c33989efc1c6b606cde6740c79a1708`; bancada `43bac58a1b93f94353b3b0229e4c25cb45bf2d1d` (PR #313), CI [#37850820186](https://github.com/projetogg/monstrinhomon.html/actions/runs/37850820186).  
**Supersedes:** nenhum.  
**Evidência:** `TECHNICAL_CONTROLLED`, **não** playtest humano.

## Pergunta

No cenário natural Tamborilhomon Nv10 × Furtilhon Nv10, quantas vezes a passiva `emberfang` encontra uma habilidade ofensiva de dano enquanto o HP permanece estritamente acima de 70%, e qual o impacto no resultado? Como ENE, ordem de ação e saturação podem alterar a conclusão?

## Autoridades e fonte de dados

- Regra e resolvedor: `js/canon/speciesPassives.js`; pipeline de ATK: `DEC-SPECIES-ATK-01`.
- Cenário: `docs/SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md`.
- Dados: `data/monsters.json`, `data/skills.json`, `design/canon/class_matchups.json`; funções de fórmula em `js/combat/groupCombatFormula.js`.
- Harness oficial de espécie: `js/combat/speciesPassiveQuantitativeHarness.js`.
- Rodadas anteriores e limitações: `docs/PROJECT_STATUS.md`, `docs/ROADMAP.md`.
- Bancada experimental: `tests/sp05TechnicalEmberfang.test.js` no PR #313; **não mergear teste experimental em produção**.

## Contrato funcional verificado

`resolvePassiveModifier` retorna `atkBonus: 1` no evento `on_attack` com `isOffensiveSkill: true` e `hpPct > 0.70`.

Testes de fronteira aprovados:
- HP 100% e HP 70,0001%: elegível;
- HP 70% exatos e HP 69,9999%: não elegível;
- ataque básico, BUFF e evento incorreto: não elegível.

As skills runtime associadas ao cenário são `GOLPE_BRUTAL_0` (`DAMAGE`, custo 6 ENE, PWR 18) e `FURIA_0` (`BUFF`, custo 4 ENE). Identificar a skill não significa demonstrar seu uso espontâneo nem o pacote completo de Fúria.

O Tamborilhomon e Furtilhon são formas naturalmente válidas no Nv10. O harness controlado escalou Tamborilhomon até 96 HP máximos, ATK 15, DEF 11, SPD 7 e ENE máxima 28; esses valores são **saída da escala do harness**, não uma nova tabela normativa.

## Experimento 1 — cenário oficial no harness existente

Pares determinísticos com a mesma seed para variantes sem/com passiva, `maxTurns=30`, 20.000 pares por perfil.

| Métrica | Basic sem/com | Mixed sem | Mixed com | Diferença |
|---|---:|---:|---:|---:|
| Vitória | 97,445% / 97,445% | 99,290% | 99,320% | +0,030 p.p. |
| Turnos médios | 3,84745 / 3,84745 | 3,36535 | 3,30490 | -0,06045 |
| Ativação em combates | 0% | — | 95,01% | — |
| Aplicações de +ATK | 0 | — | 22.858 | — |
| Delta médio de dano total | 0 | — | — | +0,13885 |
| Delta médio de HP final | 0 | — | — | +1,09445 |

**Interpretação:** o cenário oficial está saturado em taxa de vitória, principalmente no perfil mixed. Basic é o controle negativo correto. O mixed do harness força a alternância de ataque e habilidade, **sem custo/limite de ENE**; 95,01% não é frequência real do jogo.

## Experimento 2 — disponibilidade de ENE e ordem da ação (sensibilidade, não paridade runtime)

Modelo instrumental próprio, usando as funções puras canônicas de rolagem, confronto, dano, classe e ENE, com as limitações:
- 1x1; inimigo ataca apenas com básico;
- sem Fúria, itens, kits completos, AI, mudança de posição nem iniciativa dinâmica;
- jogador primeiro ou inimigo primeiro são hipóteses **explicitamente separadas**;
- energia inicial 0% ou 100% são condições de teste, não uma afirmação sobre o início real de combate;
- regra de escolha técnica: usar Golpe Brutal I quando houver ENE suficiente; caso contrário usar básico;
- cada condição com 20.000 pares determinísticos sem/com passiva.

| Condição instrumental | Regeneração | Ativação em combates | Vitória sem → com | Turnos médios sem → com |
|---|---|---:|---|---|
| Jogador primeiro; ENE 0% | `floor` do harness | 29,610% | 99,040% → 99,050% | 3,52940 → 3,51360 |
| Jogador primeiro; ENE 100% | `floor` do harness | 99,740% | 99,730% → 99,755% | 2,95320 → 2,66445 |
| Inimigo primeiro; ENE 0% | `floor` do harness | 5,335% | 95,350% → 95,350% | 3,53180 → 3,52925 |
| Inimigo primeiro; ENE 100% | `floor` do harness | 95,430% | 98,670% → 98,800% | 2,94475 → 2,84670 |
| Inimigo primeiro; ENE 0% | `ceil` ilustrando caminho Wild | 29,115% | 97,080% → 97,095% | 3,45355 → 3,43355 |

As condições **não formam uma comparação causal pura entre si**: mudam seed e ao menos um fator estrutural da política. A comparação causal de passiva ocorre **dentro** de cada linha, sempre com a mesma seed e política.

Observações:
- No modelo inimigo primeiro + ENE 0% + `floor`, apenas 1.134 oportunidades elegíveis foram contabilizadas em 20.000 combates, com 1.067 aplicações após confirmação do hit.
- No mesmo modelo com `ceil`, ocorreram 6.242 oportunidades e 5.867 aplicações.
- Sob ENE cheia, há mais oportunidades de skill quando HP ainda está alto, mas a ordem inimigo primeiro reduz a ativação frente ao jogador primeiro.
- A diferença de arredondamento `floor` no harness vs `ceil` em `wildActions.js` evidencia a necessidade de tratar `DIV-ENE-01` antes de usar a frequência modelada como representativa do runtime.
- O teste **não** reproduz o início exato da ENE, a ordem de iniciativa real do Group ou o pacote completo da habilidade Fúria.

## Experimento 3 — sensibilidade natural menos saturada

Uma varredura exploratória de adversários Comuns naturalmente válidos no Nv10 usou 600 pares por candidato. O melhor candidato por proximidade de 50% de vitória-base foi Ferrozimon (`MON_001`, Guerreiro), reavaliado em **20.000 pares novos** do perfil mixed sem ENE.

| Métrica | Sem | Com | Delta |
|---|---:|---:|---:|
| Vitória | 54,105% | 55,700% | +1,595 p.p. |
| Turnos médios | 7,15170 | 7,09715 | -0,05455 |
| Dano total médio (delta pareado) | — | — | +0,59330 |
| HP final médio (delta pareado) | — | — | +0,81155 |
| Ativação em combates | — | 93,25% | — |

A escolha após varredura constitui sensibilidade exploratória, não validação externa pré-registrada. Não foram estimados intervalos de confiança nem repetidas seeds independentes; diferenças pequenas (principalmente +0,030 p.p. no oficial) não devem ser tratadas como significância estatística estabelecida. A classe do Ferrozimon traz características diferentes de Furtilhon; não comparar seus win rates como se só a passiva tivesse mudado.

## Validação automatizada

- PR de bancada: [#313](https://github.com/projetogg/monstrinhomon.html/pull/313), **fechado sem merge** após coleta, sem alterações runtime/canônicas.
- Commit da bancada: `43bac58a1b93f94353b3b0229e4c25cb45bf2d1d`.
- GitHub Actions [#37850820186](https://github.com/projetogg/monstrinhomon.html/actions/runs/37850820186): **176 arquivos / 5.781 testes unitários aprovados**, incluindo SP-05; **7 testes Wild Loop (Vitest) aprovados**; validações de dados/assets aprovadas.
- Playwright E2E: **aprovado**, job `wild-loop-e2e` na execução [#37850820186](https://github.com/projetogg/monstrinhomon.html/actions/runs/37850820186).

Os logs contém saídas rotuladas `SP05_CONTRACT`, `SP05_OFFICIAL_BASIC`, `SP05_OFFICIAL_MIXED_UNLIMITED_ENE`, `SP05_ENERGY_*`, `SP05_ENEMY_FIRST_*`, `SP05_CANDIDATE_SCAN` e `SP05_SENSITIVITY_MIXED_UNLIMITED_ENE`.

## Classificação

- `SP05-TECH-01` — **FACT:** gatilho `>70%` e apenas `DAMAGE` conferido no resolver; fronteiras testadas.
- `SP05-TECH-02` — **BALANCE:** impacto pequeno no cenário oficial saturado; efeito de vitória mais visível em sensibilidade contra Ferrozimon, sem sinal suficiente para alterar o valor.
- `SP05-TECH-03` — **METHODOLOGY:** harness de espécie mistura habilidades ilimitadas por ENE e jogador primeiro; não oferece frequência natural representativa.
- `SP05-TECH-04` — **DRIFT / INVESTIGATION:** arredondamento de ENE no Wild diverge do harness; permanece `DIV-ENE-01`, fora do escopo de correção SP-05.
- `SP05-TECH-05` — **EVIDENCE_GAP:** sem validação completa do kit Fúria, iniciativa real, offsets de espécie, IA nem HP/ENE reais de sessão.
- `SP05-TECH-06` — **EVIDENCE_GAP HUMAN:** sem percepção, compreensão, diversão, justiça e estratégia infantil.
- `SP05-TECH-07` — **DECISION:** nenhuma nova decisão numérica autorizada ou exigida nesta coleta.

## Interpretação e recomendação

**SP-05 técnico: CONCLUÍDO COM CAVEATS DE REPRESENTATIVIDADE.**

O resolvedor e o efeito básico foram comprovados, o cenário oficial foi caracterizado e uma sensibilidade menos saturada demonstrou impacto pequeno, mas mensurável. A ativação da passiva é muito sensível às condições de ENE e ordem de turno. Portanto:

1. **Manter `+1 ATK` sem recalibração nesta fase.**
2. Não divulgar a ativação de 95,01% como probabilidade real; ela pertence ao harness sem ENE.
3. Preservar `DIV-ENE-01` e `DIV-INIT-01` como análises separadas, sem corrigir silenciosamente neste relatório.
4. Não iniciar playtest humano antes de uma build adequada, conforme `DEC-PLAYTEST-PRE-01`.
5. Após aprovação documental deste relatório, **consolidar a bateria SP-01…SP-06C** e listar os bloqueios humanos e técnicos.
6. Antes do playtest com skills de controle, corrigir o issue #309 em PR próprio; implementar a decisão aprovada de `swiftclaw` (#312) em outro PR.

A classificação de conclusão técnica não representa maturidade total do combate, calibração definitiva ou aprovação de percepção infantil.
