# PROXIMOS_PASSOS — legado 2026-01

> **Documento legado preservado em 2026-05-19.**  
> Este documento descreve um estado pré-v2.x do projeto e não deve ser usado como fonte canônica atual.  
> Para autoridade atual, consultar:
>
> - `GAME_RULES.md`
> - `docs/PATCH_CANONICO_COMBATE_V2.2.md`
> - `docs/AUTHORITY_MAP.md`
> - `docs/CARD_LAYER_ARCHITECTURE_v0.1.2.md`

---

# 🎯 Próximos Passos - Monstrinhomon

**Versão:** 2.0  
**Data:** 2026-01-31  
**Status original:** Fase 1 Pokemon + Sistema de Amizade COMPLETOS  
**Status atual:** LEGADO / referência histórica.

---

## 📊 Estado Atual da Implementação

### ✅ O Que Está 100% Funcional

#### **Fase 1 - Melhorias Pokemon (COMPLETO)**
1. ✅ **Indicador Visual de Vantagem de Classe**
   - Feedback visual durante batalhas
   - Mensagens claras (Super efetivo!, Pouco efetivo...)
   - CSS com animações

2. ✅ **Monstródex (Catálogo de Progresso)**
   - Tracking de monstrinhos vistos vs capturados
   - Progress bars por classe
   - Interface visual na aba Home

3. ✅ **Livro de Conquistas (Estatísticas)**
   - 8 estatísticas rastreadas
   - Win streaks automáticos
   - Cards visuais coloridos

4. ✅ **Monstrinhos Shiny**
   - 1% de chance em encontros
   - Badge dourado com animação
   - Puramente cosmético

#### **Sistema de Amizade (COMPLETO)**
5. ✅ **Friendship System (0-100 pontos)**
   - 5 níveis de amizade (🖤🤍💛💚❤️)
   - Eventos que aumentam/diminuem amizade
   - Bônus progressivos (+XP, +crítico, +stats)
   - Interface visual integrada
   - Documentação completa (FRIENDSHIP_SYSTEM.md)

#### **Sistema Base (Já Existente)**
- ✅ Batalhas individuais funcionais
- ✅ Sistema de classes com vantagens
- ✅ Combate baseado em d20
- ✅ Sistema de captura determinístico
- ✅ Habilidades por classe (I/II/III)
- ✅ Sistema de energia (ENE)
- ✅ XP e progressão de níveis
- ✅ Inventário básico
- ✅ Sistema terapêutico com medalhas
- ✅ Persistência em localStorage

---

## 🎯 Recomendações Priorizadas

> Conteúdo abaixo preservado para histórico. Pode estar desatualizado em relação ao canon v2.

### 🔥 AGORA - Começar Imediatamente (1-2 semanas)

#### **Prioridade #1: Batalhas em Grupo (Trainer/Boss)**

**Por que isso primeiro:**
- Permite usar a party completa (1-6 jogadores)
- Sistema mais social e terapêutico
- Já temos toda a infraestrutura de party
- Batalhas individuais já funcionam (base pronta)

**O que implementar:**

```text
✅ Pré-requisitos: Party system já existe
☐ Seleção de participantes (checkboxes)
☐ Sistema de turnos ordenado por SPD
☐ Múltiplos inimigos (1-3)
☐ Indicador visual de "quem é o turno atual"
☐ Distribuição de XP para todos
☐ Recompensas de grupo (dinheiro, itens)
☐ Desabilitar captura em grupo
```

**Estimativa:** 5-7 dias de trabalho  
**Arquivos:** `index.html`  
**Complexidade:** Média-Alta

---

#### **Prioridade #2: Sistema de Progressão (XP e Level Up)**

**Por que isso em seguida:**
- SEM progressão, não há motivação para jogar
- Temos tabela XP e evolução prontas no contexto original deste documento
- Sistema de stats já calcula por nível
- Critical para gameplay loop completo

**O que implementar:**

```text
☐ Ganhar XP após vitórias
☐ Level up automático quando xp >= xpNeeded
☐ Recalcular stats ao subir nível
☐ HP aumenta proporcionalmente
☐ Verificar evolução
☐ Animação/notificação de level up
☐ Aprender novas habilidades ao mudar stage
```

---

## 💡 Outras opções preservadas do documento original

- Usar itens em batalha.
- Gestão de time e caixa.
- Menu principal e fluxo inicial.
- Tutorial interativo.
- Três níveis de dificuldade.
- Status effects completos.
- Polimento visual.
- Som e música.
- Features avançadas.

---

## 📚 Documentação de referência original

> Pode estar parcial ou obsoleta. Consultar `docs/AUTHORITY_MAP.md` antes de usar qualquer item como fonte atual.

1. `GAME_RULES.md`
2. `POKEMON_ANALYSIS.md`
3. `FRIENDSHIP_SYSTEM.md`
4. `TODO_FUNCIONALIDADES.md`
5. `ROADMAP_NEXT_STEPS.md`

---

## Nota de preservação

Este arquivo foi movido para `docs/legacy/` para reduzir drift documental. A versão ativa de próximos passos deve ser definida por issues/PRs atuais e documentos canônicos recentes.
