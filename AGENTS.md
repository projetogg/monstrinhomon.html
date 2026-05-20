# Monstrinhomon — Agent Instructions

> **Aviso canônico — 2026-05-19**  
> Este arquivo é um guia operacional para agentes e colaboradores. Em caso de conflito, a autoridade atual está em:
>
> 1. `docs/PATCH_CANONICO_COMBATE_V2.2.md` — fórmula e regras de combate.
> 2. `GAME_RULES.md` — regras gerais, observando seções marcadas como legado revogado.
> 3. `docs/AUTHORITY_MAP.md` — mapa de autoridade entre runtime, design e legado.
> 4. `data/skills.json` — fonte runtime canônica das skills.
> 5. `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` — arquitetura da Card Layer visual.
>
> CSVs na raiz, quando existirem, devem ser tratados como legado/histórico salvo evidência explícita de carregamento em runtime.

---

## Visão geral

Este repositório contém o jogo **Monstrinhomon**, um RPG infantil/terapêutico de monstros capturáveis, classes, turnos, evolução e progressão.

O jogo **não usa tipos elementais** como fogo/água. A identidade principal usa **classes**.

---

## Classes atuais

Classes vigentes do projeto:

1. Mago
2. Curandeiro
3. Guerreiro
4. Bárbaro
5. Ladino
6. Bardo
7. Caçador
8. Animalista

Observação: Animalista é tratado como classe neutra no ciclo de vantagens, salvo regra canônica mais específica.

---

## Regra de autoridade

Em caso de conflito:

```text
runtime vence design;
design vence legado;
Card Layer nunca vence mecânica.
```

### Fontes principais

| Domínio | Fonte |
|---|---|
| Fórmula de combate | `docs/PATCH_CANONICO_COMBATE_V2.2.md` |
| Regras gerais | `GAME_RULES.md` |
| Skills runtime | `data/skills.json` via `js/data/skillsLoader.js` |
| Pipeline de skills | `getMonsterSkills` em `index.html` |
| Progressão de slots | `js/canon/slotUnlocks.js` + `design/canon/level_progression.json` |
| Kit swaps | `js/canon/kitSwap.js` |
| Monstrinhos runtime | `data/monsters.json` |
| Card Layer visual | `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md` |

---

## Regras de captura e batalha

- **Captura:** jogadores podem capturar Monstrinhomons de qualquer classe, conforme regras atuais do runtime.
- **Batalha:** uso de Monstrinhomons deve respeitar a classe do jogador, salvo exceções de Mestre/Debug ou regra canônica mais recente.
- **Batalhas em grupo, captura, fuga e vantagem de classe:** consultar `GAME_RULES.md` e documentação canônica associada.

---

## Card Layer — restrições especiais

A Card Layer é uma camada visual/organizacional acima das skills runtime.

Durante a Fase 1:

- Não implementar deck, mão, ciclo, compra ou descarte.
- Não implementar Talent Cards.
- Não implementar Signature Cards mecânicas.
- Não alterar `data/skills.json`.
- Não alterar fórmula de combate, energia, atributos, posicionamento, vantagens ou captura.
- Não chamar `applyKitSwaps` dentro da Card Layer.
- Não duplicar campos mecânicos em `data/cards.json`.
- Não renderizar placeholder de slot 4 em produção.

A Fase 1 deve começar somente com os 3 Cards confirmados do Guerreiro:

- `Golpe de Espada`
- `Escudo`
- `Provocar`

---

## Dados do jogo

### Fontes atuais

- `data/monsters.json` — monstrinhos runtime.
- `data/skills.json` — skills runtime canônicas.
- `data/items.json` e demais arquivos em `data/` — dados consumidos pelo jogo.
- `design/canon/*` — camada de design/cânone, nem sempre fonte direta de runtime.

### IDs

- IDs devem ser estáveis.
- Não renomear IDs sem migração explícita.
- Se uma mudança quebrar compatibilidade com saves antigos, documentar a migração.

---

## Padrões de código

- Preferir JavaScript simples, legível e com poucas dependências.
- Comentários e mensagens em PT-BR.
- Funções com responsabilidade clara.
- Evitar duplicação.
- Evitar soluções “inteligentes” demais quando uma solução simples é suficiente.
- Não adicionar framework pesado sem justificativa.

---

## Ao implementar algo novo

Sempre verificar se precisa atualizar:

1. Dados e validação.
2. Documentação relevante.
3. Testes unitários/regressão.
4. Fluxo mínimo de jogo.
5. UI/UX, se houver mudança visual.

Mudanças em combate, progressão, captura, skills ou Card Layer exigem atenção especial ao `docs/AUTHORITY_MAP.md`.

---

## Validação mínima

Não quebrar o fluxo mínimo:

1. Iniciar jogo.
2. Criar/carregar sessão.
3. Criar jogador.
4. Entrar em combate.
5. Executar ação de combate.
6. Encerrar combate.
7. Receber recompensa/captura quando aplicável.

Também verificar:

- Console do navegador sem erros críticos.
- Testes automatizados existentes.
- Compatibilidade com `localStorage` e saves existentes.

---

## Segurança e limites

- Nunca inserir chaves, tokens, senhas ou segredos no repo.
- Não executar ações destrutivas sem documentação e aprovação no PR.
- Não remover arquivos de dados/documentação sem verificar dependências.
- Preferir PRs pequenos e reversíveis.

---

## Sistema terapêutico

O jogo tem uso terapêutico com crianças. Toda alteração visual ou de regra deve considerar:

- Clareza para criança.
- Baixa carga cognitiva.
- Evitar promessas visuais falsas.
- Utilidade para mediação terapêutica.
- Facilidade de rollback em sessão.

---

## Convenções Git

### Commits

- Mensagens em português.
- Commits atômicos e descritivos.
- Prefixos sugeridos:
  - ✨ nova feature
  - 🐛 correção
  - 📝 documentação
  - ♻️ refatoração
  - ✅ testes

### Pull Requests

PRs devem incluir:

- Resumo claro.
- Arquivos alterados.
- Como testar.
- Riscos e rollback.
- Screenshots se houver mudança visual.

---

## Debugging

- Usar modo terapeuta/debug quando aplicável.
- Verificar `state`, `save()` e `render()` se expostos no console.
- Remover logs de debug antes do merge, salvo logs intencionais de diagnóstico.

---

## Referências rápidas

### Classes disponíveis

1. Mago
2. Curandeiro
3. Guerreiro
4. Bárbaro
5. Ladino
6. Bardo
7. Caçador
8. Animalista

### Raridades

1. Comum
2. Incomum
3. Raro
4. Místico
5. Lendário

---

**Última atualização:** 2026-05-19  
**Versão:** 2.0.0 — alinhada ao canon v2 e à Fase 0 da Card Layer
