# Plano de Implementação — Catálogo Oficial de Status v3

## Objetivo

Congelar os artefatos oficiais do catálogo v3 sem quebrar o runtime atual, preparar a migração incremental e manter rastreabilidade entre a base consolidada e a futura ativação no jogo.

## Artefatos desta fase

- `docs/catalog_v3/monstrinhomon_status_oficial.csv`
- `docs/catalog_v3/monstrinhomon_status_oficial.json`
- `docs/catalog_v3/monstrinhomon_relatorio_validacao.md`
- `docs/catalog_v3/PLANO_IMPLEMENTACAO_STATUS_OFICIAL_V3.md`

## Decisão desta fase

Nesta fase, os arquivos acima passam a ser a fonte oficial de stats do catálogo v3.

Isso **não** significa substituir imediatamente o runtime ativo. A ativação no jogo continua bloqueada até resolver os conflitos estruturais abaixo.

## Bloqueios críticos antes de importar no runtime

1. Conflito de namespace em `MON_021–030`.
2. Duplicidade de nome em `Arcanumon` (`MON_024` vs `MON_102`).
3. `MONSTROS.csv` legado ainda presente e potencialmente enganoso.
4. Família bloqueada `MON_029–032` ainda sem arte aprovada.

## Sequência recomendada

### Fase 1 — Congelar e referenciar
- Usar o CSV/JSON oficial como referência única de stats v3.
- Não alterar `data/monsters.json` ainda.
- Não ativar import automático ainda.

### Fase 2 — Resolver bloqueios de engenharia
- Criar tabela `runtime_id -> dex_v3_id` para `MON_021–030`.
- Renomear `MON_102` no runtime para eliminar colisão com `MON_024`.
- Mover `MONSTROS.csv` para arquivo morto (`archive/` ou `docs/archive/`).

### Fase 3 — Importação segura
- Importar lote seguro: `MON_001–028` e `MON_033–078`, excluindo `MON_029–032`.
- Mapear `agi` do CSV/JSON para `baseSpd` no runtime.
- Manter flags como `runtimeEnabled=false` e `blockReason=no_art` para a família bloqueada, quando aplicável.

### Fase 4 — Validação pós-import
- Verificar que todo Mago mantém `ENE > ATK`.
- Verificar que Bárbaro Místico mantém `HP < Guerreiro Místico`.
- Verificar que Ladino mantém `AGI > Caçador` por raridade comparável.
- Rodar testes de integridade e catálogo.

### Fase 5 — Ativação progressiva
- Desbloquear `MON_029–032` apenas após arte aprovada e teste de combate.
- Reavaliar outliers de combate antes de ativação total (`Titanmon`, `Feralmon`, `Arcanumon`, `Panterezamon`, `Arcanodracomon`).

## Escopo explicitamente fora desta fase

- Substituir imediatamente o runtime ativo.
- Rebalancear combate em produção.
- Liberar família bloqueada sem arte.
- Misturar o catálogo v3 com os IDs legados sem remapeamento.

## Critério de aceitação desta fase

- Os artefatos oficiais estão versionados no repositório.
- O plano de migração incremental está documentado.
- O runtime atual não foi quebrado por ativação prematura.
- A próxima etapa técnica ficou objetiva e executável.
