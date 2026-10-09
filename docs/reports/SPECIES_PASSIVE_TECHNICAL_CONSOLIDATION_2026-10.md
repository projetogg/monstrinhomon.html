# Consolidação técnica das oito passivas de espécie — pré-playtest v2.2

**Status:** ACTIVE — síntese técnica documental, sem criação de regras.  
**Domain:** técnica / playtest / governança de evidências.  
**Authority:** GitHub — síntese derivada de fontes vinculadas; runtime, dados e decisões canônicas continuam superiores.  
**VerifiedAgainst:** \`main\` \`e830206575299cac2b910698b035c0fdc1832b86\`, verificada em 2026-10-09; relatórios individuais listados abaixo.  
**Supersedes:** nenhum; não substitui relatórios individuais nem protocolo de coleta.  
**Classificação:** \`TECHNICAL_CONTROLLED\`, **não** evidência de crianças.

## 1. Resultado e alcance

**Resultado: OITO RODADAS TÉCNICAS EXECUTADAS, CONSOLIDADAS COM RESSALVAS.**

- SP-01 \`shieldhorn\`, SP-02 \`wildpace\`, SP-03 \`floracura\`, SP-04 \`swiftclaw\`, SP-05 \`emberfang\`, SP-06A \`moonquill\`, SP-06B \`shadowsting\`, SP-06C \`bellwave\`.
- Paridade funcional nos caminhos comparáveis, baseline quantitativa e análises dirigidas fornecem evidência de **funcionamento e impacto nos modelos efetivamente executados**; não demonstram experiência humana nem equivalência do jogo completo.
- Nenhuma rodada encontrou base suficiente para modificar automaticamente o valor numérico da passiva.
- **SP-04 tem decisão de design já aprovada, mas não implementada:** \`DEC-SP04-OPENING-01\`, opção B; issue #312. Não submeter novamente a opção A/B/C ao autor.
- Existem divergências técnicas e de configuração que impedem tratar a bateria como portão de playtest humano já liberado.
- \`DEC-PLAYTEST-PRE-01\` mantém o playtest mediado **adiado até uma build apresentável**, sem cancelá-lo.

A classificação “técnico concluído” significa que a pergunta delimitada da rodada foi respondida **com as limitações registradas**; não significa “balanceamento aprovado”, “sem bugs” ou “pronto para crianças”.

## 2. Rastreabilidade por passiva

| Rodada / espécie | Evidência mecânica verificada | Principal limite ou ressalva | Tratamento atual |
|---|---|---|---|
| **SP-01 \`shieldhorn\`** (Guerreiro) | Redução do primeiro hit na frente efetiva; preserva HP nos perfis estudados | Vitória oficial saturada; pacote completo do tank e PWR não inferíveis a partir da mitigação isolada | **Manter** valor atual; observar UX e combate prolongado no playtest |
| **SP-02 \`wildpace\`** (Animalista) | Limiar natural de HP baixo medido começando cheio, com ataque posterior e ganho de dano | Trigger tardio e dependente da dificuldade; stress de Vitalex Nv12–13 é **não canônico** e não deve ser naturalizado | **Manter**; coletar observação humana da janela de sobrevivência |
| **SP-03 \`floracura\`** (Curandeiro) | Primeiro item de cura; benefício real depende de espaço até HP máximo e do momento de uso; feedback corrigido no PR #296 | Não foi validada a escolha espontânea item × skill \`Cura I\` em economia integral de ENE | **Manter**; observar feedback, escolhas e timing |
| **SP-04 \`swiftclaw\`** (Caçador) | Bônus único identificado; sensibilidade natural encontrou impacto pequeno | Wild/Group/harness divergiam quanto ao consumo da abertura; \`Armadilha I\` falha no Group | **IMPLEMENTAR decisão B aprovada** em #312, separada de correção #309; não rediscutir valor |
| **SP-05 \`emberfang\`** (Bárbaro) | Gatilho de skill de dano com HP estritamente >70% validado em fronteiras; dano adicional observável | Cenário oficial saturado e harness mixed sem custo de ENE; acesso à janela muda com ENE/ordem; modelo de sensibilidade não é runtime integral | **Manter**; não usar 95,01% de ativação como taxa natural |
| **SP-06A \`moonquill\`** (Mago) | Cadeia debuff → SPD e efeito em breakpoints após PRs #300/#301 | Cenário oficial saturado; fórmula de iniciativa Group ainda diverge de \`SPD + d6\`; **oponente Vitalion Nv30 não é estágio natural** | **Manter**; avaliar iniciativa separadamente e corrigir fixture antes do playtest |
| **SP-06B \`shadowsting\`** (Ladino) | Debuff válido cria carga; próximo básico usa e consome +ATK; dano extra mensurável | Cenário histórico Vitalion Nv30 inválido; harness não modela pacote total debuff + escolha; Group controle pode ser afetado pelo bug #309 | **Manter**; corrigir fixture e validar modo de controle |
| **SP-06C \`bellwave\`** (Bardo) | Skill válida cria/renova carga binária; próximo básico a consome; dano extra mensurável | Cenário oficial pouco informativo sobre vitória; não mede plenamente kit swap Nota Discordante + ENE + iniciativa | **Manter**; validar pacote de kit e observar cadência espontânea |

**Fontes de cada linha:** respectivamente:
- [SP-01](SP01_TECHNICAL_SHIELDHORN_2026-09.md);
- [SP-02](SP02_TECHNICAL_WILDPACE_2026-09.md);
- [SP-03](SP03_TECHNICAL_FLORACURA_2026-09.md);
- [SP-04](SP04_TECHNICAL_SWIFTCLAW_2026-10.md);
- [SP-05](SP05_TECHNICAL_EMBERFANG_2026-10.md);
- [SP-06A](SP06A_TECHNICAL_MOONQUILL_2026-10.md);
- [SP-06B](SP06B_TECHNICAL_SHADOWSTING_2026-10.md);
- [SP-06C](SP06C_TECHNICAL_BELLWAVE_2026-10.md).

### Contexto quantitativo sem equivalência indevida

- A matriz histórica reúne **48 pares / 96.000 batalhas**, com oito espécies, três níveis e dois perfis. Ela **não** inclui todos os offsets de espécie, kit swap, economia integral de ENE, iniciativa/IA de jogo ou escolhas humanas. Fonte: [matriz](SPECIES_PASSIVE_QUANTITATIVE_MATRIX_2026-07.md).
- Exemplos de perguntas efetivamente respondidas: SP-02 atravessou naturalmente o limiar em **29,625%** (\`basic\`) e **10,35%** (\`mixed\`) no cenário oficial; SP-03 encontrou impacto dependente do timing; SP-06A demonstrou mudança de iniciativa em breakpoint; SP-06B/SP-06C produziram dano mesmo sem alteração material de vitória/TTK nos confrontos relatados.
- SP-05 no \`mixed\` histórico obteve **95,01%** de combates com ativação, mas **sem custo de ENE**. Em sensibilidades instrumentais de ENE/ordem, a ativação variou amplamente. Nenhum desses valores é taxa de ativação espontânea de crianças no jogo completo.
- SP-04: o relatório técnico pré-decisão discute as alternativas A/B/C e pode recomendar A. **Essa recomendação histórica foi superada normativamente** pela decisão humana posterior B em \`docs/DEC_SP04_SWIFTCLAW_FIRST_HIT_2026-10.md\`; não reclassificar a decisão como pendente.
- Evitar comparações diretas de taxas de vitória entre cenários com adversários diferentes, níveis/evoluções impossíveis, seeds/políticas diferentes ou saturação próxima de 0%/100%. Não afirmar significância estatística quando intervalos de confiança/repetição independente não foram medidos.

## 3. Novo achado da consolidação — dois cenários com progressão inválida

**Verificação documental + dados runtime da \`main\`, 2026-10-09:**

O protocolo [\`SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md\`](../SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md) aponta \`Vitalion / MON_031B\` no **nível 30** para:

1. **SP-06A / \`moonquill\`**: Dracoflamemon Nv30 × Vitalion Nv30 — **novo drift constatado nesta consolidação**, a ser identificado como \`DIV-SP06A-PROGRESSION-01\`.
2. **SP-06B / \`shadowsting\`**: Umbraquimonom Nv30 × Vitalion Nv30 — drift **já documentado** como \`DIV-SP06B-PROGRESSION-01\`.

Em \`data/monsters.json\`, \`MON_031B\` evolui em \`evolvesAt: 25\` para \`MON_031C\` (Vitalegion), logo Vitalion Nv30 não é estágio naturalmente compatível com a evolução descrita no catálogo. Dracoflamemon e Umbraquimonom usados como jogadores no Nv30 são compatíveis com suas linhas verificadas.

**Impacto:** os testes de mecânica realizados não são anulados retrospectivamente; contudo, simulações que forçam Vitalion Nv30 não constituem validação da progressão natural, e o protocolo **não pode ser aplicado literalmente** como configuração natural SP-06A/B em sessão com crianças.

**Tratamento proposto, não implementado:** abrir correção documental/configuração em escopo próprio, selecionar oponente válido para Nv30, recalcular diferenças de classe/atributos e revalidar dificuldade e disponibilidade de gatilho. \`MON_031C\` é um **candidato evolutivamente válido**, não substituto automaticamente aprovado; pode alterar substancialmente a dificuldade. Não alterar \`data/monsters.json\` para preservar um fixture inválido.

## 4. Pendências priorizadas por natureza, risco e pré-requisitos

| Prioridade / tipo | ID ou fonte | Estado comprovado | Ação delimitada | Dependência para coleta humana |
|---|---|---|---|---|
| **P0 — BUG** | [Issue #309](https://github.com/projetogg/monstrinhomon.html/issues/309) / \`BUG-GROUP-DEBUFF-01\` | **Aberto**, bug confirmado: Group trata BUFF contra inimigo como dano, exemplificado por Armadilha I; debuff não aplicado | Corrigir classificação/execução e testar acerto/erro, buffs, carga e paridade **em PR técnico isolado** | Bloqueia cenários Group que dependam de habilidades de controle afetadas |
| **P0 — IMPLEMENTAÇÃO APROVADA** | [Issue #312](https://github.com/projetogg/monstrinhomon.html/issues/312) / \`DEC-SP04-OPENING-01\` | **Aberto**, regra B aprovada e não implementada | Alinhar primeiro acerto de básico/skill DAMAGE em Wild/Group/harness, sem consumir com erro/controle; regressões; **PR próprio** | Bloqueia observação humana fiel de \`swiftclaw\` |
| **P0 — FIXTURE/CONFIGURAÇÃO** | \`DIV-SP06A-PROGRESSION-01\` e \`DIV-SP06B-PROGRESSION-01\` | Vitalion Nv30 incompatível com evolução natural | Corrigir ambos os roteiros e revalidar o desafio após escolha de oponente natural | Bloqueia execução **literal** das sessões SP-06A e SP-06B como cenários naturais |
| **P1 — DRIFT DE COMBATE** | \`DIV-INIT-01\` | Group ordena de forma diferente da iniciativa \`SPD + d6\` descrita no cânone; SP-06A mede **runtime atual** | Investigar e corrigir em escopo de iniciativa, com teste de consequências e compatibilidade | Necessário reconciliar antes de atribuir conclusões de iniciativa canônica a SP-06A |
| **P1 — INVESTIGAÇÃO INDEPENDENTE** | \`DIV-ENE-01\` | Regeneração diverge entre caminhos/modelos; SP-05 evidencia sensibilidade da janela à ENE | Auditoria própria de ENE e ritmo de combate, sem mudar valores durante medição | Importante para interpretar gatilhos dependentes de skills; não é bug da passiva \`emberfang\` por si só |
| **P1 — COBERTURA / KIT** | \`GAP-SP06C-KIT-01\` e lacunas SP-05/SP-06B | Harness não mede integralmente kit swap, buffs, ENE, iniciativa e IA conjunta | Testes focados de interação onde tecnicamente necessários; manter rótulo de gap se não executados | Não extrapolar impacto isolado da passiva para o pacote estratégico inteiro |
| **P2 — BALANCEAMENTO SEPARADO** | \`DEC-COMBAT-A\`, \`DEC-COMBAT-D\`, \`DIV-KITSWAP-PWR-01\`, \`DIV-SP04-PWR-REF-01\`, \`DIV-BOSS-01\` | Valores antigos de PWR em referências; crítico, boss e PWR têm domínios próprios | Planejar investigações independentes e levar opções ao autor **com evidência suficiente** | Não reabrir como parte da consolidação das passivas |
| **P0 — PROCESSO / UX** | \`DEC-PLAYTEST-PRE-01\` e [protocolo](../SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md) | Build ainda não foi aprovada para reinício da coleta humana; não há registros humanos equivalentes às rodadas técnicas | Preparar build apresentável, QA de sessão, instruções, feedback, logs e critérios de interrupção | Portão **global** para iniciar coleta mediada |

**Ordem técnica recomendada:** (a) revisar e integrar esta síntese; (b) corrigir #309; (c) aplicar decisão #312; (d) corrigir fixtures SP-06A/B; (e) verificar iniciativa/ENE e kits em escopos independentes; (f) QA da build e validação da retomada de playtest com o autor. #309 e #312 têm PRs distintos, mesmo quando o segundo depende da correção do controle no Group. A prioridade P0 é **urgência para preparar coleta humana**, não autorização para executar mudanças de regra sem aprovação.

## 5. Fatos, inferências, recomendações e decisões humanas

### FATOS VERIFICADOS

- Oito rodadas técnicas documentadas e integradas; resultados com caveats individuais.
- Não há resultado humano padronizado que permita afirmar compreensão, justiça, diversão, frustração ou estratégia espontânea.
- \`DEC-SP04-OPENING-01\` aprova a opção B e o issue #312 ainda está aberto.
- #309 permanece BUG confirmado e aberto; a sua correção não é uma nova decisão de balanceamento.
- SP-06A e SP-06B possuem fixture natural inválido no nível 30; o segundo já era conhecido, o primeiro é novo.
- O \`main\` na data da análise não inclui implementação de #309 nem #312.

### INFERÊNCIAS (não equivalem a fatos humanos)

- Algumas passivas exercem impacto mecânico mais pela **oportunidade de ativação, timing e feedback** do que pela mudança direta na taxa de vitória.
- Cenários saturados tornam difícil inferir se um valor é forte ou fraco.
- O conjunto de interações com ENE, iniciativa e kit pode ser mais importante que deltas isolados em certas espécies.

### RECOMENDAÇÕES TÉCNICAS — SEM DECISÃO NOVA

1. **Preservar todos os valores numéricos das passivas** até haver evidência adicional pertinente.
2. Corrigir #309 e implementar #312 de forma isolada; não confundir bug, regra aprovada e oportunidade de buff/nerf.
3. Não usar Vitalion Nv30 em SP-06A/B como progressão natural.
4. Não exigir oito cenários na mesma criança/sessão; seguir protocolo de sessões curtas, registro anônimo, ajuda não indutiva e interrupção por bem-estar.
5. Registrar em separado as próximas observações humanas: percepção, compreensão, escolha, feedback, frustração e ritmo.
6. Antes de alterar qualquer valor, apresentar evidências, opções e consequências para aprovação do autor.

### DECISÕES DO AUTOR — ESTADO

| Questão | Estado | Autor precisa responder agora? |
|---|---|---|
| Adiar playtest e executar simulações dirigidas (\`DEC-PLAYTEST-PRE-01\`) | **APPROVED** | **Não**; manter processo |
| Primeiro hit elegível de \`swiftclaw\` (\`DEC-SP04-OPENING-01\`) | **APPROVED, not IMPLEMENTED** | **Não**; implementar conforme decisão |
| Valores de \`shieldhorn\`, \`wildpace\`, \`floracura\`, \`swiftclaw\`, \`emberfang\`, \`moonquill\`, \`shadowsting\`, \`bellwave\` | Nenhuma mudança autorizada pela coleta técnica | **Não agora**; reavaliar depois da coleta adequada |
| Novo oponente natural de SP-06A/B | Configuração técnica insuficiente; nova opção requer validação comparativa | Apenas se a escolha impactar a intenção do cenário; não pressupor aprovação silenciosa |
| Alterar PWR, crítico, ENE ou boss (\`DEC-COMBAT-A\`, \`DEC-COMBAT-D\` etc.) | Investigações/decisões separadas | **Não nesta etapa** |
| Liberação da build e reinício de playtest infantil | Condicionado à qualidade real da build e ao processo aprovado | **Sim, quando houver evidência de QA e proposta de liberação** |

**Nenhuma decisão nova de design é exigida para registrar o fechamento técnico consolidado.** A decisão humana futura é sobre **autorizar a fase de coleta**, após preparação e demonstração da build; não sobre refazer as rodadas quantitativas.

## 6. Portão para retomar playtest humano — checklist de evidências

O portão **não está declarado aberto** por este documento. Antes de recomendar sessão mediada:

- [ ] Registrar SHA \`main\`, versão publicada, estado de CI e modalidade de jogo efetivamente usada; comprovar build apresentável com QA adequado às crianças.
- [ ] Confirmar que skills de controle no Group não produzem dano indevido (#309) nos cenários utilizados.
- [ ] Confirmar regra B de \`swiftclaw\` implementada em Wild, Group e harness (#312) e feedback coerente.
- [ ] Corrigir ou substituir SP-06A/SP-06B com formas evolutivas válidas, revisar matchup, gatilho e viabilidade do cenário.
- [ ] Para SP-06A e dados sobre ordem de turno, explicitar se o runtime adotou a iniciativa canônica ou se o drift ainda invalida comparações; não confundir com calibração da passiva.
- [ ] Para gatilhos dependentes de ENE/kit, garantir skill realmente desbloqueada, custo e política observáveis; não usar o harness isolado para inferir escolha humana.
- [ ] Confirmar formulário \`PLAYTEST_TEMPLATE_V2_2.md\` e ficha rápida \`SPECIES_PASSIVE_SESSION_RECORD_V2_2.md\`, sem dados identificáveis.
- [ ] Definir sessão com 1–3 combates conforme tolerância, uma passiva prioritária, ajuda neutra e critérios de pausa/encerramento.
- [ ] Separar coleta natural da confirmação controlada, e registrar \`VALIDA\`, \`VALIDA_COM_RESSALVAS\` ou \`INVALIDA\`.
- [ ] Solicitar ao autor decisão de liberação após evidência da build, **sem presumir consentimento de crianças ou famílias**.

## 7. Próxima unidade de trabalho

**Primeiro trabalho executável de código:** issue [#309](https://github.com/projetogg/monstrinhomon.html/issues/309), fix de \`BUFF\` contra inimigo no Group, com paridade, regressões e PR independente.

**Segundo:** issue [#312](https://github.com/projetogg/monstrinhomon.html/issues/312), implementar \`DEC-SP04-OPENING-01\` sem alterar números.

**Trabalho documental/configuração paralelo:** preparar proposta de correção de SP-06A e SP-06B no protocolo, testando candidatos válidos antes de substituir \`MON_031B\` no nível 30.

**Não executar nesta consolidação:** mudanças de \`speciesPassives.js\`, \`data/skills.json\`, evolução, atributos, PWR, ENE, boss, Card Layer, deck, mão ou tabuleiro.

## 8. Fontes e limites de autoridade

- Leitura obrigatória: \`README.md\`, \`docs/AI_ENTRYPOINT.md\`, \`docs/PROJECT_STATUS.md\`, \`docs/AUTHORITY_MAP.md\`, \`docs/DECISION_LOG.md\`, \`docs/ROADMAP.md\`, \`AGENTS.md\`.
- Implementação: \`js/canon/speciesPassives.js\`, \`js/canon/speciesBridge.js\`, \`js/combat/*\`, \`data/monsters.json\`, \`data/skills.json\`.
- Relatórios SP-01 a SP-06C citados individualmente na seção 2; [protocolo](../SPECIES_PASSIVE_MEDIATED_PLAYTEST_PROTOCOL_V2_2.md); [decisão de processo](../DECISAO_PROCESSO_PREPLAYTEST_SIMULACAO_2026-09.md); [decisão B](../DEC_SP04_SWIFTCLAW_FIRST_HIT_2026-10.md).
- Relatórios de bancada não se tornam automaticamente referência normativa. Conclusão documental **não** representa novo experimento, execução dos testes das passivas novamente, aprovação humana ou implantação de correções.
- Rollback deste documento: reverter exclusivamente o PR documental de consolidação; não afeta saves, runtime ou balanceamento.
