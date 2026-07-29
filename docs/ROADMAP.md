# Monstrinhomon - Roadmap

**Status:** índice de planejamento.  
**Regra:** itens deste arquivo não criam regras canônicas e não comprovam implementação.

## Agora

### Adicionar uma matriz quantitativa dedicada às passivas de espécie

**Resultado esperado:** medir o impacto real das oito passivas sem alterar a baseline atual de fórmula e passivas de classe.

**Próximo PR único:**

```text
test(combat): adicionar matriz quantitativa de passivas de espécie
```

**Entregas mínimas:**

1. manter `simulate:combat-v2-2` como referência da fórmula-base;
2. criar uma matriz separada de espécies;
3. usar pares determinísticos com e sem passiva;
4. medir frequência de ativação;
5. medir delta de dano, mitigação, cura e estados;
6. cobrir as oito espécies;
7. separar Wild e Group quando houver contrato não comparável;
8. publicar JSON e Markdown próprios;
9. não alterar valores no mesmo PR.

**Métricas mínimas:**

- ativações por combate;
- porcentagem de combates com ativação;
- dano adicional médio e distribuição;
- dano mitigado;
- cura adicional;
- duração dos buffs;
- cargas criadas e consumidas;
- TTK;
- vitória e sobrevivência;
- interação com classe, nível e perfil de ação.

**Limites:**

- não substituir a baseline atual;
- não misturar expansão do harness com balanceamento;
- não alterar PWR, crítico, ENE, bosses ou dados;
- preservar seeds e cenários pareados;
- qualquer drift novo deve ser caracterizado antes de ser corrigido.

### Validar o núcleo jogável v2.2

**Resultado esperado:** obter evidência quantitativa e de playtest suficiente para decidir calibração de PWR, crítico, passivas, energia e bosses sem alterar vários domínios ao mesmo tempo.

**Estado atual:**

- fórmula-base automatizada e reproduzível;
- paridade da fórmula entre harness, Wild e Group;
- oito passivas de espécie em paridade nos caminhos comparáveis;
- baseline de fórmula e passivas de classe estável antes/depois das correções;
- impacto quantitativo das passivas de espécie ainda não medido;
- playtest padronizado ainda pendente.

**Entregas restantes:**

1. matriz quantitativa das passivas de espécie;
2. análise dos resultados dessa matriz;
3. playtest mediado com `docs/PLAYTEST_TEMPLATE_V2_2.md`;
4. investigação independente de ENE;
5. investigação independente de boss;
6. decisão humana sobre PWR e crítico.

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
4. modelo e registros de playtest;
5. princípios de uso terapêutico sem dados identificáveis.

O Drive não deve manter cópias concorrentes das regras técnicas do GitHub.

### Revisar nomes editoriais pendentes

**Resultado esperado:** os 34 nomes com `needs_verification` na Dex v3 recebem decisão humana por família.

A aprovação editorial de um nome não autoriza migração automática para o runtime.

## Concluído recentemente

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
- QA de produto e decisão de encerramento do piloto continuam pendentes.

## Próximo

### Executar playtest mediado após a matriz de espécies

**Dependência:** a matriz quantitativa de passivas de espécie deve estar concluída.

**Resultado esperado:** confrontar resultados automatizados com clareza, duração, frustração, escolha de ações e observação terapêutica.

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

## Depois

- consolidar a arquitetura de Evolution;
- classificar e arquivar CSVs legados da raiz;
- decidir eventuais migrações de nomes, uma família por vez;
- expandir a Card Layer somente após o piloto;
- melhorar métricas de playtest;
- reduzir gradualmente a concentração de lógica em `index.html`;
- aprofundar economia, narrativa e catálogo somente depois da estabilização do núcleo.

## Portões de decisão

| Decisão | Responsável | Estado | Bloqueia |
|---|---|---|---|
| etapa de `atkBonus` de espécie | autor humano | APPROVED e implementada | concluído |
| ordem de `shieldhorn` e resistência | autor humano | APPROVED e implementada | concluído |
| paridade das oito espécies | evidência técnica + autor humano | comprovada nos caminhos comparáveis | matriz quantitativa |
| impacto quantitativo das espécies | evidência técnica | não medido pelo harness atual | recalibração das espécies |
| PWR e calibração do catálogo | autor humano | pendente de validação v2.2 | balanceamento final |
| prêmio aleatório do crítico | autor humano | pendente de validação v2.2 | comportamento final do crítico |
| valores das passivas de classe | autor humano | decisão conceitual parcial | calibração das passivas |
| regeneração de ENE | autor humano | divergência aberta | economia de habilidades |
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
- campos técnicos da Dex v3 sem decisão aprovada e issue/PR correspondente.
