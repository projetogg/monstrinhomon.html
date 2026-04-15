# Migração Fase 1 — Runtime Rebuild

## Objetivo
Preparar a substituição controlada do bloco beta inicial por um bloco mais canônico, sem quebrar o runtime atual.

## Decisão
A troca direta de `data/monsters.json` **não deve ser ativada ainda**.

### Motivos
1. `data/locations.json` ainda referencia muitos IDs antigos (`MON_001`, `MON_002B`, `MON_010B`, `MON_020B`, `MON_030C` etc.), então uma troca cega muda ecologia, progressão e raridade das áreas.
2. `js/canon/speciesBridge.js` ainda contém mapeamentos explícitos para famílias antigas em IDs altos (`MON_010`, `MON_021`, `MON_029`, `MON_014`, `MON_020`, etc.).
3. Os testes ainda assumem o catálogo antigo, incluindo nomes e IDs como `MON_001 = Cantapau`.
4. O candidato de Fase 1 desloca famílias reais para IDs novos, mas o restante do catálogo ainda não foi reconciliado; portanto, ligar esse bloco sem remapeamento completo geraria colisões semânticas.

## O que este commit adiciona
- `docs/migration_phase1_runtime_candidate.json`
- `docs/migration_phase1_id_remap.json`

Esses arquivos servem como fonte de verdade intermediária para a migração.

## Próximo passo seguro
1. Aplicar remapeamento semântico em `data/locations.json`.
2. Atualizar `js/canon/speciesBridge.js` para os novos IDs de fase 1.
3. Ajustar testes que validam nomes, contagens e linhas evolutivas.
4. Só então substituir o bloco vivo do runtime.

## Regra operacional
Enquanto a migração não for concluída:
- o catálogo vivo continua sendo `data/monsters.json`
- o candidato de rebuild continua sendo apenas artefato de migração
- remapeamento deve ser feito por equivalência de função/classe/estágio, nunca por troca cega de número
