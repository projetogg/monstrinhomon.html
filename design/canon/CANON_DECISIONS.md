# Monstrinhomon — Decisões Canônicas Registradas

## Objetivo
Este arquivo registra decisões canônicas que precisam ser tratadas como fonte oficial de verdade durante a transição entre o motor atual e a nova camada declarativa em `design/canon/`.

## Decisão 1 — Matchups oficiais de classe
A partir desta fase, a referência oficial de vantagens e desvantagens entre classes passa a ser:
- `design/canon/class_matchups.json`

Isso significa que, em caso de divergência entre:
- documentação antiga,
- tabelas hardcoded no runtime,
- anotações históricas do projeto,

a prioridade deve ser:
1. `class_matchups.json`
2. restante da camada `design/canon/`
3. runtime legado
4. documentação antiga não atualizada

## Observação importante
O ciclo atual de matchups no cânone pode divergir de documentos mais antigos do projeto. Essa divergência não deve ser tratada como bug acidental. Ela deve ser tratada como decisão explícita da nova camada canônica.

## Decisão 2 — Fonte de verdade da Fase 1
Na Fase 1, a camada canônica não substitui o motor inteiro. Ela entra primeiro como:
- leitura de dados,
- consulta de stats,
- consulta de matchups,
- consulta operacional de skills MVP.

A fórmula de combate atual continua em uso nesta etapa.

## Decisão 3 — Integração progressiva
A ordem de verdade durante a transição deve ser:
- dados canônicos para matchups e consulta estrutural
- motor atual para execução de combate
- adaptação futura por fases, sem substituição brusca

## Próxima consolidação esperada
Em fases posteriores, a documentação antiga que conflitar com este arquivo deve ser atualizada para refletir o cânone novo.
