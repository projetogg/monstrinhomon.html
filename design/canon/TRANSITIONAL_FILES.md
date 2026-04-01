# Monstrinhomon — Arquivos Transitórios da Fase 1

## Objetivo
Este arquivo existe para deixar explícito quais arquivos da camada canônica são transitórios, parciais ou auxiliares durante a integração inicial.

## Arquivo transitório principal
### `design/canon/skills_mvp_phase1.json`
Este arquivo deve ser tratado como:
- arquivo de ponte da Fase 1;
- subconjunto operacional do MVP;
- apoio temporário para integração inicial;
- não como substituto final de `skills.json`.

## Motivo
O projeto ainda possui:
- um schema de skills em runtime já existente;
- uma camada canônica nova em evolução;
- e diferenças entre modelagem canônica e modelagem operacional do runtime.

`skills_mvp_phase1.json` existe para permitir integração inicial segura das 4 classes MVP sem forçar migração total de habilidades nesta etapa.

## Regra de uso
Durante a Fase 1:
- use `skills_mvp_phase1.json` apenas para o subconjunto MVP;
- não trate esse arquivo como lista completa de habilidades do jogo;
- não replique manualmente todo o runtime para dentro dele;
- não congele o design futuro em torno desse arquivo.

## Destino esperado
Em fases posteriores, a tendência é uma destas:
1. consolidação do conteúdo relevante dentro de `skills.json`, ou
2. substituição por uma camada canônica de habilidades mais completa e alinhada ao runtime final.

Até lá, este arquivo deve ser entendido como transitório e operacional.
