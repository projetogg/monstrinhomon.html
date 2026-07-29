# Monstrinhomon - Estado do Projeto

**Verificado em:** 2026-07-29  
**Branch oficial examinada:** `main`  
**Marco técnico de origem:** PR #275 mergeado em `a41a0f79df8c6f2914e822ddc46969c9c36a2336`  
**Escopo:** este arquivo descreve o repositório; não cria regras do jogo.

## Baseline atual

- Aplicação em JavaScript executada no navegador.
- Dados runtime em `data/`, conforme os loaders efetivamente usados.
- Testes Vitest, validadores de dados/assets e smoke tests definidos em `package.json`.
- GitHub como fonte técnica oficial.
- Google Drive como espaço de produto, discussão, playtest, observação e referência visual.
- Um único harness oficial de simulação do combate v2.2.
- Fórmula-base do harness comparada com Wild e Group.
- Oito passivas de espécie revalidadas nos caminhos comparáveis.
- As decisões `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` estão implementadas.
- A baseline quantitativa atual cobre fórmula, RC, ações ofensivas, ENE e passivas de classe.
- A baseline quantitativa atual **não cobre passivas de espécie**.

## Implementado na main

| Domínio | Estado observado | Evidência principal |
|---|---|---|
| Trade | caminho runtime único | `js/combat/tradeSystem.js`, `js/ui/tradeUI.js`, PR #250 |
| Fórmula Group | confronto bilateral v2.2 | `js/combat/groupCombatFormula.js` |
| Fórmula Wild | migrada para confronto bilateral v2.2 | `js/combat/wildActions.js`, PR #255 |
| Harness de simulação | instrumento único, reproduzível e integrado ao CI | `js/combat/combatSimulationHarness.js`, PRs #260 e #262 |
| Paridade da fórmula-base | matriz determinística integrada | `tests/combatHarnessRuntimeParityV22.test.js`, PR #263 |
| `atkBonus` de espécie | entra no ATK antes da fórmula nos caminhos comparáveis | PR #266 |
| Ordem defensiva de `shieldhorn` | resistência percentual antes da redução plana | PR #273 |
| Passivas em skills Group | `ON_ATTACK` e `ON_SKILL_USED` integrados | PR #274 |
| Paridade final das espécies | oito espécies em paridade nos caminhos comparáveis | `tests/speciesPassiveFinalParityV22.test.js`, PR #275 |
| Comparação de baselines | ferramenta reproduzível e relatório pós-paridade | `scripts/compare-combat-baselines-v2-2.mjs` e relatório de julho de 2026 |
| Passivas de classe | conceito e valores atuais presentes | harness, Wild e Group |
| Catálogo de Cards | 3 Cards visuais do Guerreiro | `data/cards.json` |
| Card Layer | piloto do Guerreiro com identidade efetiva preservada | `js/cards/*`, `js/data/skillsLoader.js`, PR #256 |
| Save/load | camadas complementares de persistência | `js/saveLayer.js`, `js/storage.js` e testes |

## Resultado quantitativo mais recente

Foram comparados os artefatos:

- run #15, SHA `e019262f1325d0c416beb76b89000473b4480822`;
- run #23, SHA `70670dd4f355515af695698a2d48582fc90b45fd`.

As duas execuções usam a mesma seed, 90 cenários e 1000 execuções por cenário.

Resultado:

```text
90 cenários comparados
90 cenários sem alteração
0 cenários quantitativamente alterados
90.000 combates por baseline
```

As únicas diferenças são `baselineSha` e `generatedAt`.

Interpretação obrigatória:

- a baseline de fórmula e passivas de classe permaneceu estável;
- o delta zero não mede o impacto das passivas de espécie;
- o harness não chama o resolver de passivas de espécie;
- `passivesEnabled` no harness refere-se às passivas de classe;
- não existe evidência quantitativa para buff, nerf ou recalibração das espécies.

Fonte:

`docs/reports/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.md`.

## Estado do Drive

- `00 - Portal do Projeto` aponta para as fontes oficiais do GitHub.
- A Dex v3 permanece como proposta editorial ativa em `02 - Decisões em Discussão/Em elaboração`.
- O catálogo visual e o acervo de imagens estão classificados em `06 - Referências Visuais`.
- Bases antigas foram movidas para `99 - Arquivo Histórico`.
- A especificação que tratava a planilha como fonte do runtime foi marcada como substituída.
- A Dex v3 registra 44 nomes como `canonical` e 34 como `needs_verification`.
- Visão do Produto, Playtests e Uso Terapêutico ainda precisam de conteúdo operacional.

A marcação editorial não altera o runtime. Nomes divergentes da `main` exigem decisão e PR técnico específico.

## Divergências e lacunas conhecidas

| ID | Tema | Comportamento da main | Estado |
|---|---|---|---|
| `DIV-COMBAT-01` | Wild e Group compartilharem a fórmula v2.2 | ambos usam a base bilateral v2.2 | resolvida tecnicamente; balanceamento ainda não validado |
| `DIV-SP-ATK-01` | `atkBonus` antes da fórmula | implementado nos caminhos comparáveis | resolvida no PR #266 |
| `DIV-SP-DEF-01` | resistência percentual antes de `shieldhorn` | implementado nos caminhos comparáveis | resolvida no PR #273 |
| `DIV-SP-SKILL-01` | skills Group dispararem eventos de espécie | implementado | resolvida no PR #274 |
| `GAP-SP-QUANT-01` | impacto quantitativo das passivas de espécie | harness atual não simula espécies | aberto; próximo portão técnico |
| `EG-01` | semântica de skill que erra no Wild | runtime Wild não expõe erro localmente como Group | lacuna de evidência isolada |
| `DIV-ENE-01` | tabela canônica de regeneração | divergência histórica ainda precisa de investigação própria | aberto |
| `DIV-PASSIVE-01` | valores das passivas de classe | runtime possui valores de 10% a 15% | aberto; não recalibrar sem medição |
| `DIV-BOSS-01` | multiplicadores canônicos de boss | implementação não confirmada integralmente | investigar |
| `DIV-CARDS-01` | identidade efetiva das skills do Guerreiro | preservada pelo loader e aliases de kit swap | resolvida tecnicamente; QA de produto pendente |
| `DIV-NAMES-01` | nomes editoriais da Dex v3 | `main` pode usar nomes diferentes | mapear antes de qualquer migração |

## Pull requests recentes relevantes

| PR | Tema | Estado | Impacto |
|---|---|---|---|
| #255 | migração da fórmula Wild para v2.2 | mergeado | combate Wild |
| #256 | identidade visual das skills do Guerreiro | mergeado | Card Resolver e loader |
| #259 | protocolo de validação do núcleo v2.2 | mergeado | governança |
| #260 | harness inicial de simulação | mergeado | simulação quantitativa |
| #262 | consolidação do harness oficial | mergeado | remove caminho concorrente |
| #263 | paridade do harness com Wild e Group | mergeado | fórmula-base |
| #264 | caracterização das passivas de espécie | mergeado | drifts identificados |
| #266 | `atkBonus` pré-fórmula no Group | mergeado | pipeline ofensivo |
| #273 | ordem defensiva de `shieldhorn` no Wild | mergeado | pipeline defensivo |
| #274 | passivas de espécie nas skills Group | mergeado | integração de eventos |
| #275 | revalidação final das espécies | mergeado | matriz final de paridade |

## Decisões aprovadas e implementadas

- `DEC-SPECIES-ATK-01`: `atkBonus` modifica o ATK antes da fórmula.
- `DEC-SPECIES-DEF-01`: resistência percentual ocorre antes da redução plana de `shieldhorn`.

Fonte: `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`.

## Decisões pendentes

- `DEC-COMBAT-A`: estratégia de calibração entre PWR e catálogo.
- `DEC-COMBAT-D`: destino do prêmio aleatório de UX no crítico.
- `DEC-AUTH-01`: separar formalmente autoridade normativa e descritiva.
- `DEC-AUTH-02`: identificar e versionar o "Documento Mestre" citado pelo Patch v2.2.
- `DEC-DRIVE-01`: revisar os 34 nomes editoriais ainda em `needs_verification`.

## Fase atual recomendada

A fase permanece **Validação do Núcleo Jogável — Combate v2.2**.

O próximo PR técnico deve ser único e limitado a:

```text
test(combat): adicionar matriz quantitativa de passivas de espécie
```

Objetivo desse PR:

1. preservar a baseline atual como referência de fórmula e passivas de classe;
2. criar cenários pareados com e sem cada espécie;
3. medir frequência de ativação e impacto numérico;
4. publicar artefato próprio;
5. não alterar valores.

Depois dele:

1. revisar os resultados quantitativos das espécies;
2. realizar playtest mediado;
3. separar bugs, UX e balanceamento;
4. decidir se existe evidência para recalibração.

Protocolos: `docs/VALIDACAO_NUCLEO_JOGAVEL_V2_2.md` e `docs/PLAYTEST_TEMPLATE_V2_2.md`.

## Validação técnica

Antes de uma alteração técnica, execute:

```bash
npm test
npm run test:combat-simulation-v2-2
npm run test:combat-parity-v2-2
npm run test:species-passive-parity-v2-2
npm run test:species-passive-final-parity-v2-2
npm run test:combat-baseline-comparison-v2-2
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Execute `npm run test:wild-loop` quando as dependências do Playwright estiverem disponíveis.

## Gatilhos para revisão

Atualizar este arquivo quando ocorrer:

- criação da matriz quantitativa de passivas de espécie;
- conclusão de playtest padronizado;
- mudança relevante em código ou dados runtime;
- decisão sobre PWR, crítico, passivas, energia ou boss;
- aprovação dos nomes editoriais pendentes;
- PR de migração de nomes;
- alteração dos comandos oficiais de teste;
- novo marco técnico que torne esta fotografia materialmente incorreta.
