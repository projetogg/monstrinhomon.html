# Monstrinhomon — Mapa de Autoridade

**Data:** 2026-07-30  
**Status:** ACTIVE — canônico para os domínios listados.  
**VerifiedAgainst:** `d73f81f401dded14587282c2c76aef424c69a408`  
**Relacionado:** `docs/AI_ENTRYPOINT.md`, `docs/PROJECT_STATUS.md`, `docs/DECISION_LOG.md`, `docs/ROADMAP.md`.

Este documento define quais fontes consultar quando comportamento implementado, regra pretendida, produto, proposta e legado entrarem em conflito.

## 1. Autoridade descritiva e normativa

### Estado implementado

Para responder **o que o jogo faz hoje**, vencem:

1. código e dados carregados na `main`;
2. testes do mesmo commit;
3. artefatos de CI relativos ao mesmo commit;
4. `docs/PROJECT_STATUS.md` como resumo datado.

### Regra pretendida

Para responder **o que o jogo deve fazer**, vencem:

1. decisões humanas `APPROVED` ou `IMPLEMENTED` em `docs/DECISION_LOG.md`;
2. documento canônico ou ADR vinculado;
3. especificações de design aprovadas do domínio.

Uma regra pretendida não deve ser descrita como implementada antes do merge correspondente. Uma divergência entre runtime e regra deve ser registrada, não resolvida silenciosamente.

`DEC-AUTH-01` permanece pendente para formalização mais ampla; esta distinção operacional não transforma anexos antigos ou propostas em autoridade.

## 2. Fronteira entre plataformas

| Plataforma | Autoridade |
|---|---|
| GitHub | código, dados runtime, testes, arquitetura técnica, decisões aprovadas e regras canônicas |
| Google Drive | visão do produto, decisões em discussão, playtests, observações terapêuticas, referências e demandas |
| Projeto ChatGPT | ponto de entrada, recuperação de histórico e trabalho temporário; não mantém cópias técnicas independentes |

Política do Projeto ChatGPT: `docs/CHATGPT_PROJECT_CONTEXT_POLICY.md`.

Uma conversa ou anexo pode preservar intenção do autor e evidência histórica. Para virar regra aprovada, essa intenção deve ser reconciliada e registrada no GitHub, como ocorreu em `DEC-CARDS-VISION-01`.

## 3. Autoridades por domínio

| Domínio | Autoridade | Status | Observações |
|---|---|---|---|
| Fórmula de combate, faixas e ModNível | `docs/PATCH_CANONICO_COMBATE_V2.2.md` + runtime compartilhado | canônico e implementado nos caminhos comparáveis | balanceamento continua dependente de evidência |
| Pipeline das passivas de espécie | `docs/DECISAO_PIPELINE_PASSIVAS_ESPECIE_2026-07.md` | `IMPLEMENTED` | PRs #266 e #273; revalidação #275 |
| Resolver das passivas de espécie | `js/canon/speciesPassives.js` | runtime | valores não devem ser recalibrados sem decisão |
| Skills runtime | `data/skills.json` via `js/data/skillsLoader.js` | runtime canônico | fonte mecânica atual; cards não duplicam valores |
| Lista efetiva para apresentação | `getMonsterSkills` e kit swap efetivo | runtime | preserva identidade canônica |
| Forma operacional para combate | `resolveMonsterSkills()` / `normalizeSkill()` | runtime | não é fonte visual independente |
| Catálogo de design de skills | `design/canon/skills.json` | referência de design | não vence runtime automaticamente |
| Slots por nível | `js/canon/slotUnlocks.js` + `design/canon/level_progression.json` | confirmado | upgrades intermediários não criam slot novo |
| Kit swaps | `js/canon/kitSwap.js` | runtime | `_kitSwapId` é diagnóstico/telemetria |
| Matchups de classe | `design/canon/class_matchups.json` consumido pelo runtime | canônico | Animalista possui matchups explícitos |
| Monstrinhos runtime | `data/monsters.json` e loaders atuais | runtime | nomes editoriais do Drive não migram automaticamente |
| Dex v3 | proposta editorial + `DEC-DRIVE-01` | produto/editorial | não governa automaticamente IDs, stats, classes, evolução ou runtime |
| Índice do catálogo v3 | `docs/catalog_v3/README.md` | classificação ativa | explica artefatos substituídos, propostas e tooling |
| Card Layer — Fase 1 | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` + `data/cards.json` | piloto canônico | fundação visual; não implementa deck nesta fase |
| Visão híbrida de cartas | `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md` + `DEC-CARDS-VISION-01` | `APPROVED` para produto | detalhes exatos pendentes |
| Roadmap atual | `docs/ROADMAP.md` | planejamento ativo | planos históricos não concorrem |
| Estado atual | `docs/PROJECT_STATUS.md` | resumo datado | deve indicar commit-base e marco verificáveis |
| Decisões | `docs/DECISION_LOG.md` | índice canônico | `APPROVED` e `IMPLEMENTED` são estados diferentes |

## 4. Dados, fixtures e artefatos paralelos

A extensão ou localização do arquivo não determina sua autoridade.

### JSON e módulos

- confirme loader, fallback, normalização e testes;
- dados carregados pelo runtime vencem artefatos editoriais ou históricos;
- módulos com cópias estáticas devem ser auditados quando também existe fonte tabular.

### CSVs da raiz

Os CSVs da raiz não são a fonte runtime principal. Alguns, porém, são lidos diretamente por testes ou funcionam como contratos paralelos, fixtures, insumos históricos ou referências documentais.

Antes de mover ou remover qualquer CSV:

1. buscar leituras no runtime;
2. buscar leituras em testes;
3. buscar scripts e geradores;
4. comparar valores com a fonte runtime;
5. verificar comentários que declaram origem;
6. identificar conteúdo exclusivo;
7. decidir entre fixture explícita, geração, consolidação, legado ou remoção.

`QUESTS.csv`, `DROPS.csv`, `LOCAIS.csv` e `ENCOUNTERS.csv` possuem consumidores de teste verificados na baseline examinada. Isso não os torna fonte runtime automática, mas impede classificá-los como inertes.

Pendência: `PT-003` em `docs/PENDENCIAS_TECNICAS.md`.

## 5. Fontes históricas, substituídas e propostas

| Fonte | Tratamento |
|---|---|
| `GAME_RULES.md` §3–§10 | legado revogado; não implementar |
| `docs/legacy/PLANO_DE_ACAO_2026-03.md` | planejamento histórico |
| `PROXIMOS_PASSOS.md` | redirecionamento; não contém plano próprio |
| `docs/archive/audits/` | auditorias datadas; evidência histórica |
| `docs/archive/` e `docs/legacy/` | histórico; fora da ordem de leitura atual |
| `docs/catalog_v3/PLANO_IMPLEMENTACAO_STATUS_OFICIAL_V3.md` | `SUPERSEDED`; não é roadmap nem fonte de stats |
| `docs/catalog_v3/monstrinhomon_relatorio_validacao.md` | `SUPERSEDED`; números históricos não governam runtime |
| `docs/catalog_v3/SOLUCAO_BLOQUEIOS_V3.md` | referência técnica; tooling não autoriza importação |
| anexos antigos do Projeto ChatGPT | sem autoridade automática; podem conter intenção a reconciliar |
| `Sistema_de_Cartas_Monstrinhomon_REVISADO.docx` | proposta de produto relevante; preservar até migração |
| versões anteriores ou duplicadas do sistema de cartas | histórico ou `SUPERSEDED`; remover do contexto ativo após preservação |

O nome `Documento Mestre` não concede autoridade. `DEC-AUTH-02` permanece pendente para decidir o destino formal das antigas cópias.

## 6. Sistema de cartas — duas camadas complementares

### Card Layer atual

A Card Layer da Fase 1 deve seguir:

1. skill efetiva retornada pelo runtime;
2. mecânica em `data/skills.json` e pipeline de combate;
3. forma operacional normalizada para execução;
4. dados visuais em `data/cards.json`;
5. placeholder visual sem alteração mecânica, quando permitido.

No piloto atual, a Card Layer não pode:

- chamar `applyKitSwaps` para decidir mecânica;
- alterar `data/skills.json`;
- duplicar power, custo, acurácia, alvo, duração ou efeito;
- decidir `stageIndex`;
- criar deck, mão, compra ou descarte dentro da Fase 1.

### Visão futura aprovada

A limitação anterior é de fase, não de produto.

A visão aprovada prevê futuramente:

- cartas como habilidades executáveis;
- deckbuilding leve;
- posicionamento tático simples;
- troca de Monstrinhomon alterando opções e estilo;
- garantia de ação legal com ENE baixa ou mão desfavorável;
- algumas ações ou cartas sem custo de ENE;
- uma única fonte mecânica para skills.

Permanecem pendentes deck, mão, compra, descarte, ação básica, quantidade de cartas gratuitas, grade, movimento, economia de ENE e primeiro protótipo.

Fonte: `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

## 7. Quando houver conflito

1. registrar arquivos e afirmações;
2. identificar se a pergunta é descritiva, normativa, de produto ou histórica;
3. verificar `docs/DECISION_LOG.md`;
4. comparar código, dados e testes;
5. recuperar conversas e documentos de produto quando a intenção estiver em dúvida;
6. classificar legado, proposta, editorial, fixture ou canônico;
7. solicitar decisão humana quando a regra permanecer aberta.

Não use uma limitação temporária de implementação para revogar silenciosamente uma visão de produto aprovada.

## 8. Higiene documental

Ações e classificações gerais:

- `docs/INFORMATION_HYGIENE_AUDIT_2026-07.md`;
- `docs/reports/HISTORICAL_DOCUMENT_ARCHIVE_2026-07.md`;
- `docs/reports/ACTIVE_AUTHORITY_HOTFIX_2026-07.md`.

Índices históricos:

- `docs/archive/README.md`;
- `docs/archive/audits/README.md`;
- `docs/legacy/README.md`.
