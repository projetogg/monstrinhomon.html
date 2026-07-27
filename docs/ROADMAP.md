# Monstrinhomon - Roadmap

**Status:** indice de planejamento.  
**Regra:** itens deste arquivo nao criam regras canonicas e nao comprovam implementacao.

## Agora

### Corrigir os drifts aprovados das passivas de especie

**Resultado esperado:** Wild e Group passam a executar o pipeline aprovado em `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md`, sem recalibrar valores e sem combinar dominios.

**Sequencia obrigatoria:**

1. `fix(combat): aplicar atkBonus de especie antes da formula no Group`;
2. `fix(combat): alinhar ordem defensiva do shieldhorn no Wild`;
3. `fix(combat): despachar passivas de especie nas skills Group`;
4. reexecutar a matriz de paridade das passivas;
5. revisar a baseline quantitativa somente depois da paridade.

**Limites:**

- um drift principal por PR;
- nenhum ajuste no valor das passivas;
- nenhuma alteracao simultanea de PWR, critico, ENE ou boss;
- converter testes de caracterizacao em testes de paridade apenas quando a correcao correspondente entrar.

### Validar o nucleo jogavel v2.2

**Resultado esperado:** obter evidencia quantitativa e de playtest suficiente para decidir calibracao de PWR, critico, passivas, energia e bosses sem alterar varios dominios ao mesmo tempo.

**Entregas:**

1. manter o harness e as matrizes de paridade reproduziveis;
2. corrigir os drifts de integracao ja decididos;
3. registrar simulacoes reproduziveis por classe, nivel e encontro;
4. usar `docs/PLAYTEST_TEMPLATE_V2_2.md` em playtest mediado;
5. separar bugs, balanceamento, UX e decisoes humanas;
6. recomendar somente um proximo PR.

**Criterios de saida:**

- TTK medio, mediana e distribuicao registrados;
- taxa de vitoria por cenario registrada;
- impacto de critico, vantagem, passivas e ENE medido;
- Wild e Group comparados em condicoes equivalentes;
- drifts de passivas aprovados corrigidos ou explicitamente excluidos da analise;
- boss avaliado separadamente;
- ao menos um playtest padronizado registrado;
- `DEC-COMBAT-A` e `DEC-COMBAT-D` possuem evidencia suficiente para decisao humana ou sao explicitamente mantidas como pendentes.

### Alimentar a camada de produto no Drive

**Resultado esperado:** a arquitetura de pastas deixa de ser apenas estrutural e passa a conter contexto operacional.

**Prioridade:**

1. Visao e Publico;
2. Experiencia Desejada;
3. Glossario de Produto;
4. modelo e registros de playtest;
5. principios de uso terapeutico sem dados identificaveis.

O Drive nao deve manter copias concorrentes das regras tecnicas do GitHub.

### Revisar nomes editoriais pendentes

**Resultado esperado:** os 34 nomes com `needs_verification` na Dex v3 recebem decisao humana por familia.

A aprovacao editorial de um nome nao autoriza migracao automatica para o runtime.

## Concluido recentemente

### Caracterizacao do combate v2.2

- PR #259 integrou o protocolo de validacao;
- PR #260 criou o harness inicial;
- PR #262 consolidou um unico harness oficial;
- PR #263 validou a formula-base contra Wild e Group;
- PR #264 caracterizou as oito passivas de especie;
- `DEC-SPECIES-ATK-01` e `DEC-SPECIES-DEF-01` definem os pipelines pretendidos, ainda nao implementados integralmente.

### Governanca compartilhada inicial

- README aponta para os documentos de governanca e para o Portal do Drive;
- estado do projeto e datado e associado a um marco verificavel;
- Portal do Drive aponta para o GitHub, sem copiar regras tecnicas;
- acervo antigo do Drive foi classificado;
- Dex v3 foi mantida como proposta editorial ativa;
- PRs #257 e #258 foram integrados.

### Migracao tecnica do combate Wild

- PR #255 integrado;
- Wild usa a base bilateral v2.2 compartilhada com o Group;
- a migracao tecnica nao equivale a validacao de balanceamento.

### Estabilizacao tecnica inicial da Card Layer

- PR #256 integrado;
- `buildRuntimeSkillDefs()` preserva identidade canonica;
- inferencia por nome removida;
- aliases de kit swap permanecem explicitos;
- QA de produto e decisao de encerramento do piloto continuam pendentes.

## Proximo

### Reconciliar autoridade documental

**Resultado esperado:** `AGENTS.md`, `AUTHORITY_MAP.md` e o Patch v2.2 deixam de apresentar hierarquias ambiguas.

**Dependencias:**

- aprovar `DEC-AUTH-01`;
- localizar/versionar o "Documento Mestre" em `DEC-AUTH-02`.

### Mapear divergencias de nomes

**Resultado esperado:** comparar os 44 nomes aprovados editorialmente na Dex v3 com os dados da `main` e produzir uma lista de divergencias.

**Limites:**

- nao alterar IDs junto com nomes sem decisao propria;
- nao migrar atributos, evolucoes ou classes no mesmo PR;
- cada migracao deve declarar compatibilidade de saves, referencias e assets.

### Tratar energia, boss e recalibracao de passivas separadamente

**Resultado esperado:** regeneracao de ENE, boss e valores das passivas recebem investigacoes e PRs pequenos independentes.

As correcoes de pipeline aprovadas nao equivalem a recalibracao dos valores.

### QA publicado da Card Layer

**Resultado esperado:** o piloto do Guerreiro e testado no ambiente publicado com registro de mapeamento, fallback, clareza e ausencia de duplicacao mecanica.

A expansao para outras classes depende desse QA e de criterio explicito para encerrar o piloto.

## Depois

- consolidar a arquitetura de Evolution;
- classificar e arquivar CSVs legados da raiz;
- decidir eventuais migracoes de nomes, uma familia por vez;
- expandir a Card Layer somente apos o piloto;
- melhorar metricas de playtest;
- reduzir gradualmente a concentracao de logica em `index.html`;
- aprofundar economia, narrativa e catalogo somente depois da estabilizacao do nucleo.

## Portoes de decisao

| Decisao | Responsavel | Estado | Bloqueia |
|---|---|---|---|
| etapa de `atkBonus` de especie | autor humano | APPROVED em `DEC-SPECIES-ATK-01`; implementacao pendente | paridade das passivas ofensivas |
| ordem de `shieldhorn` e resistencia de classe | autor humano | APPROVED em `DEC-SPECIES-DEF-01`; implementacao pendente | paridade das passivas defensivas |
| PWR e calibracao do catalogo | autor humano | pendente de validacao v2.2 | balanceamento final do combate |
| premio aleatorio do critico | autor humano | pendente de validacao v2.2 | comportamento final do critico |
| valores das passivas de classe | autor humano | decisao conceitual parcial; valores divergentes | calibracao das passivas |
| regeneracao de ENE | autor humano | divergencia aberta | economia de habilidades |
| comportamento de boss | autor humano | investigacao pendente | curva de encontros especiais |
| status do catalogo v3 do Drive | autor humano | parcial: proposta editorial ativa | migracao tecnica de nomes e IDs |
| 34 nomes editoriais restantes | autor humano | pendente | fechamento editorial da Dex v3 |
| modelo do slot 4 | autor humano | pendente | expansao da Card Layer |
| autoridade normativa/descritiva | autor humano | pendente | revisao global dos documentos |

## Nao usar como roadmap atual

- auditorias historicas;
- `docs/PLANO_DE_ACAO.md`;
- `PROXIMOS_PASSOS.md`;
- planilhas historicas do Drive;
- campos tecnicos da Dex v3 sem decisao aprovada e issue/PR correspondente.
