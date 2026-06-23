# Monstrinhomon - Roadmap

**Status:** indice de planejamento.  
**Regra:** itens deste arquivo nao criam regras canonicas e nao comprovam implementacao.

## Agora

### Estabelecer governanca compartilhada

**Resultado esperado:** ChatGPT, Claude e o responsavel humano usam os mesmos pontos de entrada e distinguem `main`, PR aberto, decisao e historico.

**Criterios de saida:**

- README aponta para os documentos de governanca;
- estado do projeto e datado e associado a um commit;
- mapa de autoridade separa comportamento implementado de regra pretendida;
- Portal do Drive aponta para o GitHub, sem copiar regras tecnicas.

### Revisar os drafts existentes

**Resultado esperado:** PRs #255 e #256 recebem revisao independente e decisao humana de merge, ajustes ou encerramento.

**Criterios de saida:**

- comportamento e testes revisados;
- conflitos com decisoes canonicas identificados;
- riscos e rollback registrados;
- decisao humana documentada.

## Proximo

### Reconciliar autoridade documental

**Resultado esperado:** `AGENTS.md`, `AUTHORITY_MAP.md` e o Patch v2.2 deixam de apresentar hierarquias ambiguas.

**Dependencias:**

- aprovar `DEC-AUTH-01`;
- localizar/versionar o "Documento Mestre" em `DEC-AUTH-02`.

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
- decidir o destino do catalogo v3 do Drive antes de qualquer migracao de IDs;
- expandir a Card Layer somente apos o piloto;
- melhorar metricas de playtest;
- reduzir gradualmente a concentracao de logica em `index.html`.

## Portoes de decisao

| Decisao | Responsavel | Bloqueia |
|---|---|---|
| PWR e calibracao do catalogo | autor humano | balanceamento final do combate |
| status do catalogo v3 do Drive | autor humano | migracao de IDs e nomes |
| premio aleatorio do critico | autor humano | comportamento final do critico |
| modelo do slot 4 | autor humano | expansao da Card Layer |
| autoridade normativa/descritiva | autor humano | revisao global dos documentos |

## Nao usar como roadmap atual

- auditorias historicas;
- `docs/PLANO_DE_ACAO.md`;
- `PROXIMOS_PASSOS.md`;
- planilhas do Drive sem decisao aprovada e issue/PR correspondente.
