# Monstrinhomon - Roadmap

**Status:** índice de planejamento.  
**Regra:** itens deste arquivo não criam regras canônicas e não comprovam implementação.

## Agora

### Validar passivas por simulação dirigida pré-playtest

**Resultado esperado:** reduzir as lacunas mecânicas enquanto a build ainda não está pronta para apresentação às crianças, sem fabricar evidência humana.

**Estado:**

- `DEC-PLAYTEST-PRE-01` aprovada;
- SP-01 técnico de `shieldhorn` concluído;
- SP-02 técnico de `wildpace` concluído a partir de HP cheio;
- SP-03 técnico de `floracura` concluído com Petisco runtime e sensibilidade de timing;
- `shieldhorn` no SP-01 preservou HP, mas não alterou vitória nem TTK;
- `wildpace` no cenário oficial ativou naturalmente em ~30% (`basic`) e ~10% (`mixed`), com pequeno impacto em vitória;
- `floracura` mostrou impacto dependente do timing: uso cedo frequentemente desperdiça o +3; uso em <=40% aproveita o bônus completo;
- `damageReduction: 1` permanece congelado;
- playtest humano está adiado, não cancelado.

**Prioridades:**

1. executar SP-04 `swiftclaw` com primeira ação ofensiva livre e medir básico × skill, dano e breakpoints;
2. executar SP-05 `emberfang` com janela natural de HP >70% e skill ofensiva;
3. executar SP-06A/B/C (`moonquill`, `shadowsting`, `bellwave`) com setup válido e consumo observável;
4. ampliar cenários somente quando a métrica atual estiver saturada;
5. distinguir cenário de demonstração de cenário de sensibilidade;
6. não alterar valores no mesmo passo da coleta;
7. manter PWR, crítico, ENE e boss separados.

**Limites:**

- `TECHNICAL_CONTROLLED` não é evidência humana;
- não inferir percepção, compreensão, justiça, diversão ou frustração;
- nenhuma simulação isolada autoriza buff/nerf;
- não iniciar deck, mão ou tabuleiro durante este portão.

Fonte: `docs/DECISAO_PROCESSO_PREPLAYTEST_SIMULACAO_2026-09.md`.

### Validar o núcleo jogável v2.2

**Resultado esperado:** obter evidência quantitativa e de playtest suficiente para decidir calibração de PWR, crítico, passivas, energia e bosses sem alterar vários domínios ao mesmo tempo.

**Estado atual:**

- fórmula-base automatizada e reproduzível;
- paridade da fórmula entre harness, Wild e Group;
- oito passivas de espécie em paridade nos caminhos comparáveis;
- baseline de fórmula e passivas de classe estável antes/depois das correções;
- impacto quantitativo das oito passivas medido em matriz dedicada;
- `shieldhorn` é o principal sinal automatizado para observação;
- PR #288 corrigiu o gate de linha de frente sem alterar `damageReduction: 1`;
- reavaliação pós-correção separou o sinal da matriz isolada do pacote completo do tank e identificou drift de calibração no Golpe Pesado;
- SP-01 técnico concluído no harness oficial;
- SP-02 técnico concluído com HP cheio e sensibilidade de dificuldade/progressão;
- SP-03 técnico concluído com Petisco runtime, timing de cura e feedback avaliados;
- playtest padronizado humano adiado até a build estar apresentável.

**Entregas restantes:**

1. concluir a bateria técnica pré-playtest das passivas;
2. retomar playtest mediado com `docs/PLAYTEST_TEMPLATE_V2_2.md` quando a build estiver apresentável;
3. decisão humana sobre os sinais da matriz;
4. investigação independente de ENE;
5. investigação independente de boss;
6. decisão humana sobre PWR e crítico;
7. reconciliar a calibração do Golpe Pesado com `data/skills.json` dentro de `DEC-COMBAT-A`, sem misturar essa decisão com a coleta de `shieldhorn`.

**Critérios de saída:**

- TTK médio, mediana e distribuição registrados;
- taxa de vitória por cenário registrada;
- impacto de crítico, vantagem, passivas e ENE medido;
- Wild e Group comparados em condições equivalentes;
- frequência e efeito das oito espécies medidos;
- boss avaliado separadamente;
- ao menos um playtest padronizado registrado;
- `DEC-COMBAT-A` e `DEC-COMBAT-D` possuem evidência suficiente ou permanecem explicitamente pendentes.

### Alimentar a camada de produto no Drive

**Resultado esperado:** a arquitetura de pastas deixa de ser apenas estrutural e passa a conter contexto operacional.

**Prioridade:**

1. Visão e Público;
2. Experiência Desejada;
3. Glossário de Produto;
4. visão híbrida de cartas, separando princípios aprovados de números pendentes;
5. modelo e registros de playtest;
6. princípios de uso terapêutico sem dados identificáveis.

O Drive não deve manter cópias concorrentes das regras técnicas do GitHub.

### Preservar a visão híbrida sem expandir escopo agora

**Resultado esperado:** nenhuma IA volta a interpretar a Card Layer visual-only como visão final do sistema de cartas.

A direção aprovada está em:

- `DEC-CARDS-VISION-01`;
- `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

A fase atual não implementa deck, mão ou tabuleiro. A visão futura permanece registrada para uma etapa posterior.

### Revisar nomes editoriais pendentes

**Resultado esperado:** os 34 nomes com `needs_verification` na Dex v3 recebem decisão humana por família.

A aprovação editorial de um nome não autoriza migração automática para o runtime.

## Concluído recentemente

### SP-03 técnico de `floracura`

- HP inicial cheio;
- Petisco runtime de 30% / mínimo 30;
- política <=50%: delta de vitória +1,33 p.p.; bônus médio +2,61 HP por uso;
- uso <=70% frequentemente não deixa espaço para o +3;
- uso <=40% aproveitou +3 completo em todos os usos observados;
- feedback Wild principal comunica a cura-base e deixa o bônus em log separado;
- PR #295 foi usado apenas como bancada experimental e fechado sem merge;
- nenhum valor foi alterado.

Fonte: `docs/reports/SP03_TECHNICAL_FLORACURA_2026-09.md`.


### SP-02 técnico de `wildpace`

- cenário oficial iniciou em 100% de HP;
- `basic`: 29,625% cruzaram `<40%`; delta de vitória +0,255 p.p.;
- `mixed`: 10,35% cruzaram `<40%`; delta +0,015 p.p.;
- a frequência cresce com pressão, mas o bônus não transforma lutas estruturalmente perdidas em viradas automáticas;
- PR #292 foi usado apenas como bancada experimental e fechado sem merge;
- nenhum valor foi alterado.

Fonte: `docs/reports/SP02_TECHNICAL_WILDPACE_2026-09.md`.


### Correção do gate posicional de `shieldhorn`

- PR #288 integrado;
- `shieldhorn` só mitiga na linha de frente no Group;
- Wild preserva o combatente ativo como linha de frente;
- `damageReduction: 1` não foi alterado;
- reavaliação subsequente identificou drift entre as referências históricas de PWR do Golpe Pesado e `data/skills.json`;
- nenhum nerf/buff foi autorizado.

Fonte: `docs/reports/SHIELDHORN_TANK_PACKAGE_REASSESSMENT_2026-09.md`.

### Descontinuação compatível de `MON_100`

- PR #283 integrado à `main`;
- novas aparições, ofertas e contagens do catálogo ativo excluem `MON_100`;
- lookup, instâncias e registros de saves existentes permanecem compatíveis;
- testes, validadores, Playwright e GitHub Pages permaneceram verdes;
- o tratamento não altera balanceamento e libera o congelamento da build do playtest.

Fonte: `docs/DECISAO_DESCONTINUACAO_MON_100_2026-08.md`.

### Reconciliação da visão de cartas

- histórico de conversas e documentos de produto revisado;
- visão híbrida confirmada pelo autor;
- Card Layer visual-only classificada como etapa incremental;
- `DEC-CARDS-VISION-01` registrada;
- princípios aprovados separados de números e fluxos pendentes;
- versão revisada do sistema de cartas preservada como proposta de produto;
- implementação de deck, mão e tabuleiro continua fora do escopo atual.

Fonte: `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

### Matriz quantitativa das passivas de espécie

- 48 pares determinísticos com e sem passiva;
- níveis 1, 10 e 30;
- perfis `basic` e `mixed`;
- 96.000 batalhas na configuração padrão;
- artefato JSON/Markdown próprio;
- `shieldhorn` apresentou o maior sinal automatizado de vitória;
- nenhum valor foi alterado;
- análise humana e playtest permanecem obrigatórios.

Fonte: `docs/reports/SPECIES_PASSIVE_QUANTITATIVE_MATRIX_2026-07.md`.

### Paridade e pipelines das passivas de espécie

- PR #264 caracterizou os drifts;
- `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` definiram os pipelines;
- PR #266 alinhou `atkBonus` no Group;
- PR #273 alinhou `shieldhorn` no Wild;
- PR #274 integrou eventos de espécie nas skills Group;
- PR #275 revalidou as oito espécies nos caminhos comparáveis;
- a lacuna `EG-01` sobre skill que erra permaneceu isolada.

### Comparação quantitativa pós-paridade

Foram comparadas:

- run #15, anterior às correções;
- run #23, posterior à revalidação final.

Resultado:

```text
90 cenários comparados
90 cenários idênticos
0 deltas quantitativos
90.000 combates por baseline
```

A interpretação correta é:

- a baseline de fórmula e passivas de classe permaneceu estável;
- a baseline atual não simula passivas de espécie;
- não existe base quantitativa para recalibrar valores;
- o próximo passo é ampliar a cobertura do harness.

Fonte:

`docs/reports/COMBAT_BASELINE_DELTA_POST_PARITY_2026-07.md`.

### Caracterização do combate v2.2

- PR #259 integrou o protocolo de validação;
- PR #260 criou o harness inicial;
- PR #262 consolidou um único harness oficial;
- PR #263 validou a fórmula-base contra Wild e Group;
- PR #264 caracterizou as oito passivas de espécie.

### Governança compartilhada inicial

- README aponta para os documentos de governança e para o Portal do Drive;
- estado do projeto é datado e associado a marco verificável;
- Portal do Drive aponta para o GitHub, sem copiar regras técnicas;
- acervo antigo do Drive foi classificado;
- Dex v3 foi mantida como proposta editorial ativa;
- PRs #257 e #258 foram integrados.

### Migração técnica do combate Wild

- PR #255 integrado;
- Wild usa a base bilateral v2.2 compartilhada com o Group;
- a migração técnica não equivale à validação de balanceamento.

### Estabilização técnica inicial da Card Layer

- PR #256 integrado;
- `buildRuntimeSkillDefs()` preserva identidade canônica;
- inferência por nome removida;
- aliases de kit swap permanecem explícitos;
- QA de produto e decisão de encerramento do piloto continuam pendentes;
- a estabilização visual é fundação para a visão híbrida, não substituição dela.

## Próximo

### Retomar playtest mediado das passivas

**Dependências:** a build deve estar apresentável às crianças e a etapa técnica pré-playtest deve estar suficientemente consolidada.

**Resultado esperado:** confrontar resultados automatizados com clareza, duração, frustração, escolha de ações e observação terapêutica. Simulação não substitui esta etapa.

### Reconciliar autoridade documental

**Resultado esperado:** `AGENTS.md`, `AUTHORITY_MAP.md` e o Patch v2.2 deixam de apresentar hierarquias ambíguas.

**Dependências:**

- aprovar `DEC-AUTH-01`;
- localizar/versionar o "Documento Mestre" em `DEC-AUTH-02`.

### Mapear divergências de nomes

**Resultado esperado:** comparar os 44 nomes aprovados editorialmente na Dex v3 com os dados da `main` e produzir lista de divergências.

**Limites:**

- não alterar IDs junto com nomes sem decisão própria;
- não migrar atributos, evoluções ou classes no mesmo PR;
- cada migração deve declarar compatibilidade de saves, referências e assets.

### Tratar energia, boss e recalibração separadamente

**Resultado esperado:** regeneração de ENE, boss e valores das passivas recebem investigações e PRs pequenos independentes.

As correções de pipeline e a estabilidade da baseline-base não equivalem à recalibração dos valores.

### QA publicado da Card Layer

**Resultado esperado:** o piloto do Guerreiro é testado no ambiente publicado com registro de mapeamento, fallback, clareza e ausência de duplicação mecânica.

A expansão para outras classes depende desse QA e de critério explícito para encerrar o piloto.

### Especificar o MVP híbrido de cartas

**Dependências:**

- núcleo jogável suficientemente estabilizado;
- QA do piloto visual encerrado;
- visão híbrida preservada em `DEC-CARDS-VISION-01`;
- decisão humana de iniciar a nova fase.

**Resultado esperado:** transformar a visão em um protótipo mínimo testável, sem implementar tudo ao mesmo tempo.

Questões que precisam de decisão própria:

1. garantia contra turno morto;
2. ação básica fora do deck ou carta permanente;
3. quais cartas podem custar zero ENE;
4. deck e mão mínimos;
5. compra e descarte;
6. relação entre deck e Monstrinhomon ativo;
7. posicionamento mínimo;
8. primeiro conjunto de classes e cartas;
9. integração com combate em grupo;
10. métricas de playtest infantil.

## Depois

- consolidar a arquitetura de Evolution;
- classificar e arquivar CSVs legados da raiz;
- decidir eventuais migrações de nomes, uma família por vez;
- expandir a Card Layer visual somente após o piloto;
- prototipar deck/mão sem tabuleiro completo;
- prototipar posicionamento mínimo sem ampliar o catálogo;
- integrar deck e posicionamento somente depois de cada camada funcionar isoladamente;
- melhorar métricas de playtest;
- reduzir gradualmente a concentração de lógica em `index.html`;
- aprofundar economia, narrativa e catálogo somente depois da estabilização do núcleo.

## Portões de decisão

| Decisão | Responsável | Estado | Bloqueia |
|---|---|---|---|
| etapa de `atkBonus` de espécie | autor humano | APPROVED e implementada | concluído |
| ordem de `shieldhorn` e resistência | autor humano | APPROVED e implementada | concluído |
| paridade das oito espécies | evidência técnica + autor humano | comprovada nos caminhos comparáveis | matriz quantitativa |
| impacto quantitativo das espécies | evidência técnica | medido em matriz controlada; playtest pendente | decisão humana sobre valores |
| visão híbrida de cartas | autor humano | APPROVED | especificação futura do MVP híbrido |
| regras de deck, mão e descarte | autor humano + playtest | PENDING | implementação do deckbuilding |
| garantia contra turno morto | autor humano + playtest | princípio aprovado; forma pendente | economia de ações e ENE |
| tabuleiro e posicionamento mínimo | autor humano + playtest | PENDING | integração tática futura |
| PWR e calibração do catálogo | autor humano | pendente de validação v2.2 | balanceamento final |
| prêmio aleatório do crítico | autor humano | pendente de validação v2.2 | comportamento final do crítico |
| valores das passivas de classe | autor humano | decisão conceitual parcial | calibração das passivas |
| regeneração de ENE | autor humano | divergência aberta | economia de habilidades atual e futura |
| comportamento de boss | autor humano | investigação pendente | curva de encontros especiais |
| status do catálogo v3 do Drive | autor humano | proposta editorial ativa | migração de nomes e IDs |
| 34 nomes editoriais restantes | autor humano | pendente | fechamento editorial da Dex v3 |
| modelo do slot 4 | autor humano | pendente | expansão da Card Layer |
| autoridade normativa/descritiva | autor humano | pendente | revisão global dos documentos |

## Não usar como roadmap atual

- auditorias históricas;
- `docs/PLANO_DE_ACAO.md`;
- `PROXIMOS_PASSOS.md`;
- planilhas históricas do Drive;
- campos técnicos da Dex v3 sem decisão aprovada e issue/PR correspondente;
- números de deck, mão, ENE ou grade presentes em propostas antigas sem decisão registrada.
