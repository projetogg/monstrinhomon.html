# 🎯 Próximos Passos - Monstrinhomon

**Versão:** 2.0  
**Data:** 2026-01-31  
**Status Atual:** Fase 1 Pokemon + Sistema de Amizade COMPLETOS

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

### 🔥 AGORA - Começar Imediatamente (1-2 semanas)

#### **Prioridade #1: Batalhas em Grupo (Trainer/Boss)**

**Por que isso primeiro:**
- Permite usar a party completa (1-6 jogadores)
- Sistema mais social e terapêutico
- Já temos toda a infraestrutura de party
- Batalhas individuais já funcionam (base pronta)

**O que implementar:**
```
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
**Arquivos:** `index.html` (principalmente função de grupo)
**Complexidade:** ⭐⭐⭐ Média-Alta

---

#### **Prioridade #2: Sistema de Progressão (XP e Level Up)**

**Por que isso em seguida:**
- SEM progressão, não há motivação para jogar
- Temos tabela XP e evolução prontas (EVOLUCOES.csv)
- Sistema de stats já calcula por nível
- Critical para gameplay loop completo

**O que implementar:**
```
☐ Ganhar XP após vitórias (fórmula já existe)
☐ Level up automático quando xp >= xpNeeded
☐ Recalcular stats ao subir nível
☐ HP aumenta proporcionalmente
☐ Verificar evolução (MON_002 → MON_002B → MON_002C)
☐ Animação/notificação de level up
☐ Aprender novas habilidades ao mudar stage (S0→S1→S2→S3)
```

**Estimativa:** 3-4 dias de trabalho
**Arquivos:** `index.html` (addXP, levelUp, checkEvolution)
**Complexidade:** ⭐⭐ Média

---

### 📅 CURTO PRAZO - Próximas 2-4 semanas

#### **Prioridade #3: Usar Itens em Batalha**

**O que implementar:**
```
☐ Botão "💚 Usar Item" durante batalha
☐ Dropdown com itens disponíveis
☐ Aplicar cura ao monstrinho ativo
☐ Consumir item do inventário
☐ Inimigo tem turno após uso
☐ Validações (não usar se HP cheio)
```

**Estimativa:** 2 dias
**Complexidade:** ⭐ Baixa

---

#### **Prioridade #4: Gestão de Time e Caixa**

**O que implementar:**
```
☐ Interface para ver time completo (1-6 monstros)
☐ Interface para ver caixa (todos os outros)
☐ Trocar monstros entre time ↔ caixa
☐ Reordenar time (drag & drop ou setas)
☐ Modal de stats detalhados ao clicar
☐ Renomear monstrinhos (apelido customizado)
```

**Estimativa:** 4-5 dias
**Complexidade:** ⭐⭐ Média

---

#### **Prioridade #5: Menu Principal e Fluxo Inicial**

**O que implementar:**
```
☐ Tela de intro com logo
☐ Menu principal: Novo Jogo / Continuar / Configurações
☐ Fluxo de Novo Jogo:
   - Selecionar número de jogadores
   - Selecionar dificuldade
   - Criar cada jogador (nome + classe)
   - Monstrinho inicial automático
☐ Sistema de múltiplos slots de save (3 slots)
☐ Auto-save frequente
☐ Exportar/importar save (JSON)
```

**Estimativa:** 5-6 dias
**Complexidade:** ⭐⭐⭐ Média-Alta

---

### 📆 MÉDIO PRAZO - 1-2 meses

#### **Prioridade #6: Tutorial Interativo**

```
☐ Tutorial de Batalha (encontro guiado)
☐ Tutorial de Captura (HP baixo + orbe)
☐ Tutorial de Classes (regra: só usa sua classe)
☐ Diálogos explicativos
☐ Progressão forçada (não pode pular)
```

**Estimativa:** 1 semana
**Complexidade:** ⭐⭐ Média

---

#### **Prioridade #7: Três Níveis de Dificuldade**

```
☐ Fácil: Inimigos -20% stats, +50% XP, +15% captura
☐ Médio: Balanceado (padrão atual)
☐ Difícil: Inimigos +30% stats, -25% XP, -10% captura
☐ Seletor no novo jogo
☐ Ajuste em tempo real (modo mestre)
```

**Estimativa:** 3-4 dias
**Complexidade:** ⭐ Baixa

---

#### **Prioridade #8: Status Effects Completos**

```
☐ STUN (Atordoado): perde turno
☐ ROOT (Enraizado): não pode fugir
☐ WEAKEN (Enfraquecido): -25% ATK
☐ POISON (Envenenado): 5% HP/turno
☐ SHIELD (Escudo): -30% dano
☐ Indicadores visuais (ícones)
☐ Sistema de expiração por turnos
```

**Estimativa:** 1 semana
**Complexidade:** ⭐⭐ Média

---

### 📅 LONGO PRAZO - 2-3 meses+

#### **Polimento Visual**
- Animação de dado d20
- Sprites de monstrinhos (ao invés de emojis)
- Barras de HP animadas
- Efeitos visuais de batalha

#### **Som e Música**
- 3 músicas de fundo
- 6 efeitos sonoros
- Controles de volume

#### **Features Avançadas**
- Sistema de Quests (QUESTS.csv)
- Sistema de Drops (DROPS.csv)
- Modo Terapeuta completo
- Mais monstrinhos e locais

---

## 🔥 O QUE COMEÇAR AGORA MESMO

### Recomendação: **Batalhas em Grupo**

**Por que:**
1. ✅ Maior impacto terapêutico (todos jogam juntos)
2. ✅ Base técnica já existe (party system)
3. ✅ Diferencial do jogo (vs Pokémon individual)
4. ✅ Prepara terreno para boss battles

### Prompt Pronto para ChatGPT:

```
📋 TAREFA: Implementar Batalhas em Grupo no Monstrinhomon

CONTEXTO:
- Já temos batalhas individuais funcionando (startWildEncounter)
- Já temos party com 1-6 jogadores (GameState.currentSession)
- Cada jogador tem time de monstrinhos

OBJETIVO:
Criar sistema de batalha em grupo onde TODOS os jogadores da party participam contra 1-3 inimigos.

IMPLEMENTAR:

1. INTERFACE DE SELEÇÃO
   - Na aba "Encounter", adicionar seção "Batalha em Grupo"
   - Checkboxes para selecionar participantes (1-6 jogadores)
   - Botão "Iniciar Batalha em Grupo"
   - Validar: todos selecionados têm monstros vivos da sua classe

2. CRIAR ENCONTRO DE GRUPO
   Função: startGroupEncounter(selectedPlayerIds, encounterType)
   - encounterType: 'trainer' ou 'boss'
   - Gerar 1-3 inimigos (nível baseado em dificuldade)
   - Criar estrutura:
     {
       type: 'group_trainer' ou 'boss',
       participants: [playerId1, playerId2, ...],
       enemies: [enemy1, enemy2, ...],
       turnOrder: [],
       turnIndex: 0,
       currentActor: null
     }

3. SISTEMA DE TURNOS
   - Calcular ordem por SPD (speed) de todos (jogadores + inimigos)
   - turnOrder = [...jogadores, ...inimigos].sort((a,b) => b.spd - a.spd)
   - Indicador visual: "Turno de [nome]" destacado
   - Cada ator joga na sua vez
   - Após turno, avançar turnIndex

4. AÇÕES POR TURNO
   - Jogador humano: escolhe ataque/habilidade/item
   - Inimigo: IA simples (50% skill, 50% básico)
   - Aplicar dano normalmente
   - Checar se alvo morreu (remove da batalha)
   - Próximo turno

5. CONDIÇÕES DE VITÓRIA/DERROTA
   - Vitória: Todos inimigos derrotados
   - Derrota: Todos jogadores sem monstros vivos
   - Distribuir recompensas:
     * XP: para TODOS participantes (mesmo valor)
     * Dinheiro: dividido igualmente
     * Items: vão para inventário da sessão

6. REGRAS ESPECIAIS
   - ❌ SEM captura em batalhas de grupo
   - ✅ Pode usar itens normalmente
   - ✅ Pode fugir (todos fogem juntos, DC mais alto)

7. UI/UX
   - Mostrar HP de todos participantes
   - Mostrar HP de todos inimigos
   - Log de combate scrollável
   - Botões desabilitados quando não é seu turno

ARQUIVOS:
- index.html (funções startGroupEncounter, renderGroupBattle)
- css/main.css (estilos para interface de grupo)

REFERÊNCIAS:
- Batalha individual já funciona (ver startWildEncounter)
- Party system em GameState.currentSession
- Estrutura de monstros em player.team

ENTREGAS:
1. Interface de seleção funcional
2. Batalhas em grupo jogáveis
3. Sistema de turnos por SPD
4. Distribuição de recompensas
5. Sem bugs críticos
```

---

## 💡 Outras Opções de Próximo Passo

### Opção B: Se preferir algo mais simples

**Começar com Progressão XP/Level Up:**

```
📋 TAREFA: Implementar Sistema de Progressão (XP e Level Up)

IMPLEMENTAR:

1. GANHAR XP APÓS VITÓRIA
   Em endWildBattle() quando vitória:
   - Calcular: baseXP = 15 + (enemy.level * 2)
   - Multiplicar por rarityXP[enemy.rarity]
   - Aplicar bônus de amizade (já existe)
   - Adicionar XP ao monstrinho do jogador

2. LEVEL UP AUTOMÁTICO
   Função: checkLevelUp(monster)
   - Se monster.xp >= monster.xpNeeded:
     * monster.level++
     * Recalcular stats com growth rates
     * monster.hpMax = Math.floor(hpMax * 1.04 + 2)
     * HP atual aumenta proporcionalmente
     * monster.xpNeeded = calculateXPNeeded(novo level)
     * Notificar: "⭐ Pedrino subiu para nível 2!"

3. VERIFICAR EVOLUÇÃO
   Função: checkEvolution(monster)
   - Verificar se atingiu nível de evolução
   - Exemplo: MON_002 nv 16 → MON_002B
   - Transformar template
   - Recalcular todos os stats
   - Notificar: "✨ Pedrino evoluiu para Pedronar!"

4. UPGRADE DE HABILIDADES
   - Ao mudar stage (S0→S1 no nv 10):
     * Skills I → Skills II
     * Notificar: "📚 Aprendeu Golpe de Espada II!"

ARQUIVOS:
- index.html (addXP, checkLevelUp, checkEvolution)
- EVOLUCOES.csv (já tem dados)

ENTREGAS:
1. XP ganha após batalhas
2. Level up funcional
3. Evoluções automáticas
4. Notificações visuais
```

---

### Opção C: Se preferir UX primeiro

**Começar com Menu Principal:**

```
📋 TAREFA: Implementar Menu Principal e Fluxo Inicial

IMPLEMENTAR:

1. TELA DE INTRO
   - Logo grande "Monstrinhomon"
   - Botão "Iniciar" centralizado
   - Animação fade-in

2. MENU PRINCIPAL
   3 botões grandes:
   - 🎮 Novo Jogo → fluxo de criação
   - 📖 Continuar → listar saves
   - ⚙️ Configurações → opções

3. FLUXO NOVO JOGO
   Wizard com 4 steps:
   Step 1: Quantos jogadores? (1-6)
   Step 2: Dificuldade? (Fácil/Médio/Difícil)
   Step 3: Criar cada jogador
           - Nome (input text)
           - Classe (select)
           - Monstrinho inicial auto
   Step 4: Começar!

4. MÚLTIPLOS SLOTS DE SAVE
   - 3 slots independentes
   - localStorage: mm_save_slot_1, mm_save_slot_2, mm_save_slot_3
   - Mostrar: nome sessão, data, progresso
   - Botões: Carregar / Deletar / Exportar

5. AUTO-SAVE
   - Salvar a cada ação importante
   - Indicador: "💾 Salvando..."
   - Salvar a cada 2 minutos

ARQUIVOS:
- index.html (menu, wizard, save slots)
- css/main.css (estilos de menu)

ENTREGAS:
1. Fluxo completo de novo jogo
2. 3 slots de save funcionais
3. Menu principal polido
4. Auto-save ativo
```

---

## 📚 Documentação de Referência

### Para Consultar Durante Implementação

1. **GAME_RULES.md** - Regras oficiais do jogo
2. **POKEMON_ANALYSIS.md** - Análise de mecânicas Pokemon
3. **FRIENDSHIP_SYSTEM.md** - Sistema de amizade (já implementado)
4. **TODO_FUNCIONALIDADES.md** - Lista completa de pendências
5. **ROADMAP_NEXT_STEPS.md** - Roadmap detalhado

### Dados Prontos para Usar (CSV)

- ✅ **MONSTROS.csv** - 11 monstrinhos
- ✅ **CLASSES.csv** - 8 classes com growth
- ✅ **HABILIDADES.csv** - 8+ habilidades
- ✅ **ITENS.csv** - 8 itens funcionais
- ✅ **EVOLUCOES.csv** - 3 evoluções
- ⏳ **QUESTS.csv** - Não implementado ainda
- ⏳ **DROPS.csv** - Não implementado ainda

---

## ✅ Checklist Pré-Merge

Antes de fazer merge desta PR para main, verificar:

- [x] Todos os commits foram feitos
- [x] Documentação está atualizada
- [x] Sistema de amizade funciona corretamente
- [x] Fase 1 Pokemon está completa
- [x] Sem bugs críticos conhecidos
- [x] README está atualizado
- [ ] Este documento (PROXIMOS_PASSOS.md) foi criado
- [ ] Decidiu qual próximo passo seguir
- [ ] Prompt está pronto para usar

---

## 🎯 Minha Recomendação Final

**Começar com: Batalhas em Grupo**

**Justificativa:**
1. ✅ **Maior impacto:** Permite gameplay cooperativo (1-6 jogadores)
2. ✅ **Já temos base:** Party system está pronto
3. ✅ **Terapêutico:** Incentiva trabalho em equipe
4. ✅ **Gameplay loop:** Completa experiência social
5. ✅ **Diferencial:** Pokemon não tem batalhas cooperativas assim

**Sequência sugerida após:**
1. Batalhas em Grupo (1-2 semanas)
2. Sistema de Progressão XP/Level (3-4 dias)
3. Menu Principal (1 semana)
4. Tutorial (1 semana)
5. Polimento visual...

---

## 📞 Dúvidas?

Se tiver dúvidas sobre qualquer próximo passo:
- Consulte a documentação listada acima
- Use os prompts prontos fornecidos
- Comece pelo que fizer mais sentido para você
- Teste frequentemente durante implementação

**Boa sorte no desenvolvimento! 🎮✨**

---

**Última atualização:** 2026-01-31  
**Versão:** 2.0  
**Autor:** Análise técnica pré-merge
