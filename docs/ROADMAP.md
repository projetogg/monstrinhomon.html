# Monstrinhomon - Roadmap

**Status:** indice de planejamento.  
**Regra:** itens deste arquivo nao criam regras canonicas e nao comprovam implementacao.

## Agora

### Concluir governanca compartilhada

**Resultado esperado:** ChatGPT, Claude e o responsavel humano usam os mesmos pontos de entrada e distinguem `main`, PR aberto, decisao e historico.

**Concluido:**

- README aponta para os documentos de governanca;
- estado do projeto e datado e associado a um marco verificavel;
- Portal do Drive aponta para o GitHub, sem copiar regras tecnicas;
- acervo antigo do Drive foi classificado;
- Dex v3 foi mantida como proposta editorial ativa.

**Pendente:**

- mapa de autoridade separar formalmente comportamento implementado de regra pretendida;
- identificar e versionar o "Documento Mestre" citado pelo Patch v2.2.

### Revisar os drafts existentes

**Resultado esperado:** PRs #255 e #256 recebem revisao independente e decisao humana de merge, ajustes ou encerramento.

**Ordem recomendada:**

1. revisar PR #256, menor e mais isolado;
2. revisar PR #255, com impacto amplo em combate.

**Criterios de saida:**

- comportamento e testes revisados;
- conflitos com decisoes canonicas identificados;
- riscos e rollback registrados;
- decisao humana documentada.

### Revisar nomes editoriais pendentes

**Resultado esperado:** os 34 nomes com `needs_verification` na Dex v3 recebem decisao humana por familia.

A aprovacao editorial de um nome nao autoriza migracao automatica para o runtime.

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

### Consolidar consistencia de combate

**Resultado esperado:** Wild e Group possuem uma relacao de formula aprovada, implementada e quantitativamente testada.

**Dependencias:**

- decisao sobre PWR e calibracao do catalogo;
- revisao do PR #255;
- testes quantitativos apos qualquer migracao.

### Tratar energia, boss e passivas separadamente

**Resultado esperado:** regeneracao de ENE, boss e recalibracao de passivas recebem investigacoes e PRs pequenos independentes.

Nao combinar esses dominios em um unico PR amplo de balanceamento.

### Estabilizar o piloto da Card Layer

**Resultado esperado:** o Guerreiro mapeia skills efetivas sem alterar mecanica de combate.

**Dependencias:**

- revisao do PR #256;
- QA no ambiente publicado;
- criterio explicito para encerrar o piloto.

## Depois

- consolidar a arquitetura de Evolution;
- classificar e arquivar CSVs legados da raiz;
- decidir eventuais migracoes de nomes, uma familia por vez;
- expandir a Card Layer somente apos o piloto;
- melhorar metricas de playtest;
- reduzir gradualmente a concentracao de logica em `index.html`.

## Portoes de decisao

| Decisao | Responsavel | Estado | Bloqueia |
|---|---|---|---|
| PWR e calibracao do catalogo | autor humano | pendente | balanceamento final do combate |
| status do catalogo v3 do Drive | autor humano | parcial: proposta editorial ativa | migracao tecnica de nomes e IDs |
| 34 nomes editoriais restantes | autor humano | pendente | fechamento editorial da Dex v3 |
| premio aleatorio do critico | autor humano | pendente | comportamento final do critico |
| modelo do slot 4 | autor humano | pendente | expansao da Card Layer |
| autoridade normativa/descritiva | autor humano | pendente | revisao global dos documentos |

## Nao usar como roadmap atual

- auditorias historicas;
- `docs/PLANO_DE_ACAO.md`;
- `PROXIMOS_PASSOS.md`;
- planilhas historicas do Drive;
- campos tecnicos da Dex v3 sem decisao aprovada e issue/PR correspondente.
