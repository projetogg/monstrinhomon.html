# Monstrinhomon — Agent Instructions

> **Status:** ACTIVE — guia operacional para agentes e colaboradores.  
> **Atualizado:** 2026-07-30

Este arquivo não é fonte autônoma de regras. Antes de editar, siga a ordem de leitura definida em `docs/AI_ENTRYPOINT.md`.

## Ordem de leitura

1. `README.md`
2. `docs/AI_ENTRYPOINT.md`
3. `docs/PROJECT_STATUS.md`
4. `docs/AUTHORITY_MAP.md`
5. `docs/DECISION_LOG.md`
6. `docs/ROADMAP.md`
7. código, dados e testes do domínio
8. PRs recentes relevantes

## Regra de autoridade

- Para **o que existe hoje**, use a `main`, dados carregados e testes do mesmo commit.
- Para **o que deve existir**, use decisões humanas e documentos canônicos vinculados.
- Runtime divergente de regra pretendida deve ser registrado; não corrigir silenciosamente dentro de outro escopo.
- Card Layer nunca redefine mecânica.
- Uma limitação de fase não deve ser interpretada como rejeição permanente da visão de produto.
- Drive e Projeto ChatGPT não mantêm cópias técnicas concorrentes.

Mapa completo: `docs/AUTHORITY_MAP.md`.

## Visão geral

Monstrinhomon é um RPG infantil/terapêutico de monstrinhos capturáveis, classes, turnos, evolução, progressão e jogo colaborativo.

A identidade usa oito classes:

1. Mago
2. Curandeiro
3. Guerreiro
4. Bárbaro
5. Ladino
6. Bardo
7. Caçador
8. Animalista

A matriz de vantagens deve ser lida em `design/canon/class_matchups.json`. Animalista possui matchups explícitos e não deve ser presumido neutro.

## Fontes técnicas principais

| Domínio | Fonte |
|---|---|
| Fórmula de combate | `docs/PATCH_CANONICO_COMBATE_V2.2.md` + runtime compartilhado |
| Estado atual | `docs/PROJECT_STATUS.md` |
| Decisões | `docs/DECISION_LOG.md` |
| Roadmap | `docs/ROADMAP.md` |
| Matchups | `design/canon/class_matchups.json` |
| Skills runtime | `data/skills.json` via `js/data/skillsLoader.js` |
| Monstrinhos runtime | `data/monsters.json` |
| Progressão de slots | `js/canon/slotUnlocks.js` + `design/canon/level_progression.json` |
| Kit swaps | `js/canon/kitSwap.js` |
| Passivas de espécie | `js/canon/speciesPassives.js` |
| Card Layer da Fase 1 | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` |
| Visão híbrida de cartas | `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md` |
| Política do Projeto ChatGPT | `docs/CHATGPT_PROJECT_CONTEXT_POLICY.md` |

## Documentos antigos

- `GAME_RULES.md` contém seções explicitamente revogadas.
- `docs/PLANO_DE_ACAO.md` é histórico.
- `PROXIMOS_PASSOS.md` é apenas redirecionamento.
- arquivos em `docs/archive/` e `docs/legacy/` não são contexto atual;
- anexos antigos do Projeto ChatGPT não possuem autoridade automática;
- palavras como `mestre`, `final`, `completo`, `v3` ou `fonte única` não provam vigência.

## Card Layer — limites do piloto atual

As restrições abaixo valem para o piloto visual atual. Elas não revogam `DEC-CARDS-VISION-01`, que prevê futuramente RPG tático simples, deckbuilding leve, posicionamento e cartas como habilidades.

- Não implementar deck, mão, compra, descarte ou ciclo neste piloto.
- Não implementar Talent Cards neste piloto.
- Não alterar `data/skills.json` para atender visual.
- Não alterar fórmula, ENE, atributos, matchups, captura ou posicionamento neste escopo.
- Não duplicar campos mecânicos em `data/cards.json`.
- Não chamar `applyKitSwaps` dentro da Card Layer para decidir mecânica.

Deck, mão, ações sem ENE e tabuleiro exigem especificação e PR próprios depois do portão atual.

## Dados e IDs

- IDs existentes são estáveis.
- Não renomear IDs sem migração explícita.
- Mudanças que afetem saves devem declarar compatibilidade e rollback.
- Os CSVs da raiz não são a fonte runtime principal. Alguns, porém, são consumidos diretamente por testes, auditorias ou módulos como fixtures, contratos paralelos ou referências históricas. Antes de mover ou remover qualquer CSV, audite individualmente runtime, testes, scripts, comentários e referências.

## Padrões de código

- JavaScript simples e legível.
- Comentários e mensagens em PT-BR.
- Responsabilidade clara por função.
- Evitar duplicação e soluções excessivamente complexas.
- Não adicionar framework pesado sem justificativa.

## Ao implementar

Sempre verificar:

1. autoridade do domínio;
2. dados e validação;
3. testes unitários e regressão;
4. fluxo mínimo de jogo;
5. compatibilidade com saves;
6. UI/UX quando houver efeito visual;
7. documentação de estado, decisão ou roadmap;
8. rollback.

## Validação mínima

```bash
npm test
npm run validate-data
npm run validate:monster-assets
npm run test:wild-loop:vitest
```

Para combate v2.2, execute também os comandos específicos listados em `docs/PROJECT_STATUS.md`.

Quando o ambiente permitir:

```bash
npm run test:wild-loop
```

## Segurança

- Nunca inserir segredos no repositório.
- Não executar remoção sem verificar referências e dependências.
- Preferir PRs pequenos e reversíveis.
- PR deve declarar resumo, arquivos, validação, riscos e rollback.
- PR aberto não altera o estado oficial da `main`.

## Uso terapêutico

Toda mudança deve considerar:

- clareza para crianças;
- baixa carga cognitiva;
- feedback visual fiel;
- utilidade para mediação;
- facilidade de rollback durante sessão;
- ausência de dados identificáveis em documentação e playtests.
