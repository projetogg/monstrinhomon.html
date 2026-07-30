# Monstrinhomon — Mapa de Autoridade

**Data:** 2026-07-30  
**Status:** ACTIVE — canônico para os domínios listados.  
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
| Matchups de classe | `design/canon/class_matchups.json` consumido pelo runtime | canônico | Animalista possui matchups explícitos; não é neutro por padrão |
| Monstrinhos runtime | `data/monsters.json` e loaders atuais | runtime | nomes editoriais do Drive não migram automaticamente |
| Card Layer — Fase 1 | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` + `data/cards.json` | piloto canônico | fundação visual; não implementa deck nesta fase |
| Visão híbrida de cartas | `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md` + `DEC-CARDS-VISION-01` | `APPROVED` para produto | RPG tático simples, posicionamento, cartas como habilidades e deckbuilding leve; detalhes exatos pendentes |
| Roadmap atual | `docs/ROADMAP.md` | planejamento ativo | planos históricos não concorrem |
| Estado atual | `docs/PROJECT_STATUS.md` | resumo datado | deve sempre indicar commit/marco |
| Decisões | `docs/DECISION_LOG.md` | índice canônico | `APPROVED` e `IMPLEMENTED` são estados diferentes |

## 4. Fontes históricas e propostas

| Fonte | Tratamento |
|---|---|
| `GAME_RULES.md` §3–§10 | legado revogado; não implementar |
| `docs/PLANO_DE_ACAO.md` | planejamento histórico; migração para `docs/legacy/` pendente |
| `PROXIMOS_PASSOS.md` | redirecionamento; não contém plano próprio |
| auditorias datadas | evidência histórica; consultar status atual antes de usar |
| CSVs raiz inertes | legado; não são carregados sem evidência explícita |
| `docs/archive/` e `docs/legacy/` | histórico; fora da ordem de leitura atual |
| anexos antigos do Projeto ChatGPT | sem autoridade automática; podem conter intenção única a ser reconciliada |
| `Sistema_de_Cartas_Monstrinhomon_REVISADO.docx` | proposta de produto relevante | preservar até migração; não usar seus números como runtime |
| versões anteriores ou duplicadas do sistema de cartas | histórico ou `SUPERSEDED` | remover do contexto ativo depois de preservar decisões únicas |

O nome `Documento Mestre` não concede autoridade. `DEC-AUTH-02` permanece pendente para decidir o destino formal das antigas cópias.

## 5. Sistema de cartas — duas camadas complementares

### 5.1 Card Layer atual

A Card Layer da Fase 1 deve seguir:

1. skill efetiva retornada pelo runtime;
2. mecânica em `data/skills.json` e pipeline de combate;
3. forma operacional normalizada para execução;
4. dados visuais em `data/cards.json`;
5. placeholder visual sem alteração mecânica, quando permitido.

No piloto atual, a Card Layer não pode:

- chamar `applyKitSwaps` para decidir mecânica;
- alterar `data/skills.json`;
- duplicar `power`, custo, acurácia, alvo, duração ou efeito;
- decidir `stageIndex`;
- criar deck, mão, compra ou descarte dentro do escopo da Fase 1.

### 5.2 Visão futura aprovada

A limitação anterior é de fase, não de produto.

A visão aprovada prevê futuramente:

- cartas como habilidades executáveis;
- deckbuilding leve;
- posicionamento tático simples;
- troca de Monstrinhomon alterando opções e estilo de cartas;
- garantia de ação legal mesmo com ENE baixa ou mão desfavorável;
- algumas ações ou cartas sem custo de ENE;
- uma única fonte mecânica para skills.

Permanecem pendentes:

- deck e mão exatos;
- compra e descarte;
- ação básica fora do deck ou carta permanente;
- quantidade de cartas gratuitas;
- grade e movimento;
- economia futura de ENE;
- primeiro protótipo jogável.

Fonte: `docs/CARD_SYSTEM_VISION_RECONCILIATION_2026-07.md`.

## 6. Quando houver conflito

1. registrar arquivos e afirmações;
2. identificar se a pergunta é descritiva, normativa, de produto ou histórica;
3. verificar `DECISION_LOG.md`;
4. comparar código, dados e testes;
5. recuperar conversas e documentos de produto quando a intenção do autor estiver em dúvida;
6. classificar legado, proposta, editorial ou canônico;
7. solicitar decisão humana quando a regra permanecer aberta.

Não usar uma limitação temporária de implementação para revogar silenciosamente uma visão de produto aprovada.

## 7. Higiene documental

Ações e classificações atuais estão em:

`docs/INFORMATION_HYGIENE_AUDIT_2026-07.md`.
