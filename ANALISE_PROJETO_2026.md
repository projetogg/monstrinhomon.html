# 📊 Análise Completa do Projeto Monstrinhomon
**Data:** 2026-02-02  
**Versão:** 1.0  
**Autor:** Análise Técnica Copilot

---

## 🎯 Resumo Executivo

**Monstrinhomon** é um jogo terapêutico RPG para crianças com TEA nível 1 e TDAH, usado em contexto clínico por terapeutas via iPad/web.

### Estado Atual
- ✅ **379 testes passando** (100% cobertura core)
- ✅ **Arquitetura modular** bem estruturada
- ✅ **Documentação técnica completa**
- ✅ **Sistema de batalha individual funcional**
- ✅ **Sistema terapêutico implementado**

### Prioridade Recomendada
🔥 **BATALHAS EM GRUPO** → Sistema cooperativo para 1-6 jogadores

---

## 📁 Estrutura do Projeto

```
monstrinhomon.html/
├── index.html              # App principal (SPA)
├── css/main.css            # Estilos
├── js/
│   ├── storage.js          # Persistência localStorage
│   ├── data/               # Carregamento de dados
│   │   ├── dataLoader.js   # Loader de JSON/CSV
│   │   ├── partyDex.js     # Monstródex
│   │   ├── eggHatcher.js   # Sistema de ovos
│   │   └── skillsLoader.js # Carregador de habilidades
│   ├── combat/             # Sistema de batalha
│   │   ├── wildCore.js     # Batalha individual
│   │   ├── wildUI.js       # UI batalha individual
│   │   ├── groupCore.js    # Batalha em grupo
│   │   ├── groupUI.js      # UI batalha em grupo
│   │   └── itemBreakage.js # Sistema de quebra de itens
│   ├── progression/        # XP e progressão
│   │   ├── xpCore.js       # Cálculos de XP
│   │   └── xpActions.js    # Ações de progressão
│   └── ui/                 # Componentes UI
│       ├── partyDexUI.js   # Interface Monstródex
│       └── eggHatchModal.js # Modal de chocagem
├── data/                   # Dados do jogo (CSV/JSON)
│   ├── monsters.json       # Catálogo de monstros
│   ├── items.json          # Itens do jogo
│   ├── skills.json         # Habilidades
│   └── *.csv               # Dados legados
├── tests/                  # Testes (Vitest)
│   ├── dataLoader.test.js
│   ├── xpCore.test.js
│   ├── wildCore.test.js
│   └── ... (15 arquivos de teste)
└── docs/                   # Documentação
    ├── GAME_RULES.md       # Regras oficiais
    ├── TODO_FUNCIONALIDADES.md
    └── PROXIMOS_PASSOS.md
```

---

## ✅ Funcionalidades Implementadas

### Core Game Mechanics
- ✅ **8 Classes** (Guerreiro, Mago, Curandeiro, Bárbaro, Ladino, Bardo, Caçador, Animalista)
- ✅ **Sistema de vantagens de classe** (ciclo de vantagens)
- ✅ **Combate baseado em d20** (acerto e dano)
- ✅ **Sistema de captura determinístico** (sem rolagem de dado)
- ✅ **XP e progressão de níveis** (1-100)
- ✅ **Habilidades por classe** (I/II/III tiers)
- ✅ **Sistema de energia (ENE)** com regeneração
- ✅ **Raridades** (Comum, Incomum, Raro, Místico, Lendário)
- ✅ **Monstrinhos Shiny** (1% chance, cosmético)

### Therapeutic Features
- ✅ **Sistema de objetivos terapêuticos** (peso 1-3)
- ✅ **Medalhas** (Bronze/Prata/Ouro)
- ✅ **Pontos de Medalha (PM)** automáticos
- ✅ **Moeda pós-vida (afterlife)** para recompensas
- ✅ **Rastreamento de sessão** detalhado

### Data & Progression
- ✅ **Monstródex** (tracking de vistos/capturados)
- ✅ **Livro de Conquistas** (8 estatísticas)
- ✅ **Sistema de amizade** (0-100 pontos, 5 níveis)
- ✅ **Win streaks** automáticos
- ✅ **Progress bars** por classe

### Technical
- ✅ **localStorage** com auto-save
- ✅ **Export/Import** de saves (JSON)
- ✅ **Error handling** global
- ✅ **Defensive coding** (null-safe)
- ✅ **Modular architecture**
- ✅ **379 unit tests** (Vitest)

---

## ❌ Funcionalidades Pendentes (Por Prioridade)

### 🔥 PRIORIDADE MÁXIMA

#### 1. Batalhas em Grupo (Trainer/Boss)
**Por quê:** Maior impacto terapêutico, gameplay cooperativo  
**Complexidade:** Alta (⭐⭐⭐)  
**Tempo estimado:** 1-2 semanas  

**O que implementar:**
- [ ] Interface de seleção de participantes (checkboxes)
- [ ] Sistema de turnos ordenado por SPD
- [ ] Múltiplos inimigos (1-3)
- [ ] Indicador visual de "turno atual"
- [ ] Distribuição de XP para todos participantes
- [ ] Distribuição de recompensas (dinheiro, itens)
- [ ] Desabilitar captura em grupo
- [ ] Fuga cooperativa (DC mais alto)

**Arquivos afetados:**
- `js/combat/groupCore.js` (lógica)
- `js/combat/groupUI.js` (interface)
- `index.html` (integração)

**Testes necessários:**
- Seleção de participantes válidos
- Ordem de turnos por SPD
- Múltiplos inimigos funcionando
- Distribuição correta de XP/recompensas
- Fuga cooperativa

---

#### 2. Sistema de Progressão Completo
**Por quê:** Motivação essencial para gameplay loop  
**Complexidade:** Média (⭐⭐)  
**Tempo estimado:** 3-4 dias  

**O que implementar:**
- [ ] Ganhar XP após vitórias (fórmula já existe)
- [ ] Level up automático quando xp >= xpNeeded
- [ ] Recalcular stats ao subir nível
- [ ] HP aumenta proporcionalmente
- [ ] Verificar evolução (MON_002 → MON_002B → MON_002C)
- [ ] Animação/notificação de level up
- [ ] Aprender novas habilidades ao mudar stage (S0→S1→S2→S3)

**Arquivos afetados:**
- `js/progression/xpActions.js`
- `js/progression/xpCore.js`
- `data/EVOLUCOES.csv`

**Testes necessários:**
- XP ganha corretamente
- Level up funcional
- Evoluções automáticas
- Stats recalculados
- HP proporcional mantido

---

### 📅 CURTO PRAZO (2-4 semanas)

#### 3. Usar Itens em Batalha
**Complexidade:** Baixa (⭐)  
**Tempo:** 2 dias  

**O que implementar:**
- [ ] Botão "💚 Usar Item" durante batalha
- [ ] Dropdown com itens disponíveis
- [ ] Aplicar cura ao monstrinho ativo
- [ ] Consumir item do inventário
- [ ] Inimigo tem turno após uso
- [ ] Validações (não usar se HP cheio)

---

#### 4. Gestão de Time e Caixa
**Complexidade:** Média (⭐⭐)  
**Tempo:** 4-5 dias  

**O que implementar:**
- [ ] Interface para ver time completo (1-6 monstros)
- [ ] Interface para ver caixa (todos os outros)
- [ ] Trocar monstros entre time ↔ caixa
- [ ] Reordenar time (drag & drop ou setas)
- [ ] Modal de stats detalhados ao clicar
- [ ] Renomear monstrinhos (apelido customizado)

---

#### 5. Menu Principal e Fluxo Inicial
**Complexidade:** Média-Alta (⭐⭐⭐)  
**Tempo:** 5-6 dias  

**O que implementar:**
- [ ] Tela de intro com logo
- [ ] Menu principal: Novo Jogo / Continuar / Configurações
- [ ] Fluxo de Novo Jogo (wizard 4 steps):
  - Quantos jogadores? (1-6)
  - Dificuldade? (Fácil/Médio/Difícil)
  - Criar cada jogador (nome + classe)
  - Monstrinho inicial automático
- [ ] Sistema de múltiplos slots de save (3 slots)
- [ ] Auto-save frequente
- [ ] Exportar/importar save (JSON)

---

### 📆 MÉDIO PRAZO (1-2 meses)

#### 6. Tutorial Interativo
**Complexidade:** Média (⭐⭐)  
**Tempo:** 1 semana  

- [ ] Tutorial de Batalha (encontro guiado)
- [ ] Tutorial de Captura (HP baixo + orbe)
- [ ] Tutorial de Classes (regra: só usa sua classe)
- [ ] Diálogos explicativos
- [ ] Progressão forçada (não pode pular)

---

#### 7. Três Níveis de Dificuldade
**Complexidade:** Baixa (⭐)  
**Tempo:** 3-4 dias  

- [ ] Fácil: Inimigos -20% stats, +50% XP, +15% captura
- [ ] Médio: Balanceado (padrão atual)
- [ ] Difícil: Inimigos +30% stats, -25% XP, -10% captura
- [ ] Seletor no novo jogo
- [ ] Ajuste em tempo real (modo mestre)

---

#### 8. Status Effects Completos
**Complexidade:** Média (⭐⭐)  
**Tempo:** 1 semana  

- [ ] STUN (Atordoado): perde turno
- [ ] ROOT (Enraizado): não pode fugir
- [ ] WEAKEN (Enfraquecido): -25% ATK
- [ ] POISON (Envenenado): 5% HP/turno
- [ ] SHIELD (Escudo): -30% dano
- [ ] Indicadores visuais (ícones)
- [ ] Sistema de expiração por turnos

---

### 📅 LONGO PRAZO (2-3 meses+)

#### 9. Polimento Visual
- [ ] Animação de dado d20
- [ ] Sprites de monstrinhos (ao invés de emojis)
- [ ] Barras de HP animadas
- [ ] Efeitos visuais de batalha
- [ ] Transições suaves

#### 10. Som e Música
- [ ] 3 músicas de fundo
- [ ] 6 efeitos sonoros (ataque, captura, etc)
- [ ] Controles de volume
- [ ] Mute toggle

#### 11. Features Avançadas
- [ ] Sistema de Quests (QUESTS.csv)
- [ ] Sistema de Drops (DROPS.csv)
- [ ] Modo Terapeuta expandido
- [ ] Mais monstrinhos (expandir de 11 para 50+)
- [ ] Mais locais (além de Campina Inicial)

---

## 🎯 Recomendação Estratégica

### COMEÇAR COM: Batalhas em Grupo

#### ✅ Por que esta é a melhor escolha:

1. **Impacto Terapêutico Máximo**
   - Permite gameplay cooperativo (1-6 jogadores)
   - Incentiva trabalho em equipe
   - Social e inclusivo
   - Diferencial do jogo vs Pokémon tradicional

2. **Base Técnica Pronta**
   - Party system já existe (GameState.currentSession)
   - Batalhas individuais funcionando (reusar lógica)
   - Sistema de turnos já implementado

3. **Prepara Terreno**
   - Abre caminho para boss battles
   - Permite eventos narrativos cooperativos
   - Base para quests em grupo

4. **Gameplay Loop Completo**
   - Individual: captura e treino
   - Grupo: desafios cooperativos
   - Ciclo de motivação contínuo

#### 🚀 Sequência Sugerida (Próximos 3 Meses)

```
Semana 1-2:  Batalhas em Grupo ⭐⭐⭐
Semana 2:    Sistema de Progressão XP/Level ⭐⭐
Semana 3:    Uso de Itens + Gestão de Time ⭐⭐
Semana 4:    Menu Principal ⭐⭐⭐
Semana 5-6:  Tutorial Interativo ⭐⭐
Semana 7:    Dificuldades + Status Effects ⭐⭐
Semana 8+:   Polimento Visual e Som ⭐
```

---

## 📊 Análise Técnica Detalhada

### Arquitetura
✅ **Pontos Fortes:**
- Código bem modularizado
- Separação de concerns clara (data/combat/progression/ui)
- Naming conventions consistentes
- Uso de ES6 modules
- Defensive coding (null-safe)

⚠️ **Pontos de Atenção:**
- `index.html` é grande (poderia ser quebrado)
- Algumas funções globais (considerar namespace)
- Considerar framework leve para reatividade (Alpine.js?)

### Testes
✅ **Cobertura Excelente:**
- 379 testes passando (100%)
- Testes bem organizados por módulo
- Uso correto de mocks e fixtures
- Naming descritivo em PT-BR

✅ **Boas Práticas:**
- Arrange-Act-Assert pattern
- Testes independentes
- Edge cases cobertos
- Performance adequada (1.72s total)

### Documentação
✅ **Muito Completa:**
- `GAME_RULES.md` - Regras oficiais detalhadas
- `TODO_FUNCIONALIDADES.md` - Lista completa de pendências
- `PROXIMOS_PASSOS.md` - Roadmap atualizado
- `.github/copilot-instructions.md` - Instruções para IA
- `README.md` - Guia de uso

✅ **Bem Mantida:**
- Documentos atualizados recentemente
- Versioning claro
- Changelogs presentes

### Dados
✅ **Estrutura Sólida:**
- CSVs para dados legados
- JSON para novos dados (melhor tipagem)
- IDs imutáveis (boa prática!)
- Validação de dados implementada

✅ **Consistência:**
- Naming conventions claros
- Campos obrigatórios definidos
- Referências válidas

---

## 💡 Sugestões de Melhoria

### Imediatas (Implementar já)
1. ✅ **CI/CD com GitHub Actions**
   - Rodar testes automaticamente em PRs
   - Validar build antes de merge
   - Deploy automático para GitHub Pages

2. ✅ **Script de build/deploy**
   - Minificar CSS/JS
   - Otimizar assets
   - Deploy com um comando

3. ✅ **Code splitting**
   - Quebrar `index.html` em componentes menores
   - Lazy loading de módulos pesados
   - Reduzir tamanho inicial

### Médio Prazo
1. **Framework leve de reatividade**
   - Alpine.js ou Petite Vue
   - Reduzir código boilerplate
   - Melhorar DX (developer experience)

2. **PWA (Progressive Web App)**
   - Service worker para offline
   - Install prompt para iPad
   - Cache inteligente de assets

3. **Analytics terapêuticos**
   - Tracking anonimizado de uso
   - Métricas de engajamento
   - Insights para terapeutas

### Longo Prazo
1. **Backend opcional**
   - Salvar progresso na nuvem
   - Sincronização multi-device
   - Backup automático

2. **Multiplayer real**
   - WebRTC ou WebSockets
   - Batalhas online
   - Trading entre jogadores reais

3. **Dashboard para terapeutas**
   - Visualizar múltiplas sessões
   - Comparar progresso
   - Gerar relatórios automáticos

---

## 🔍 Análise de Riscos

### Riscos Técnicos
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| localStorage atingir limite | Média | Alto | Implementar compressão + limpeza automática |
| Performance em devices antigos | Baixa | Médio | Testes em iPad antigos, otimizar renders |
| Breaking changes em dados | Baixa | Alto | Versioning de saves + migration scripts |

### Riscos de Produto
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Feature creep (muitas features) | Alta | Médio | Manter foco no core terapêutico |
| Complexidade para terapeutas | Média | Alto | Tutorial + documentação clara |
| Perda de progresso (bugs) | Baixa | Alto | Auto-save frequente + export fácil |

---

## 📝 Checklist de Implementação

### Para qualquer nova feature:

#### Antes de começar
- [ ] Ler documentação relevante (GAME_RULES.md, etc)
- [ ] Verificar se não quebra funcionalidade existente
- [ ] Planejar testes que serão necessários
- [ ] Criar branch específica

#### Durante implementação
- [ ] Seguir padrões de código existentes
- [ ] Adicionar comentários para lógica complexa
- [ ] Fazer commits atômicos e descritivos
- [ ] Rodar testes frequentemente

#### Antes de merge
- [ ] Todos os testes passando
- [ ] Código lintado e formatado
- [ ] Documentação atualizada (se necessário)
- [ ] PR description clara
- [ ] Screenshots de mudanças visuais

---

## 🎯 Prompt Pronto para Batalhas em Grupo

```markdown
📋 TAREFA: Implementar Batalhas em Grupo no Monstrinhomon

CONTEXTO:
- Já temos batalhas individuais funcionando (startWildEncounter)
- Já temos party com 1-6 jogadores (GameState.currentSession)
- Cada jogador tem time de monstrinhos

OBJETIVO:
Criar sistema de batalha em grupo onde TODOS os jogadores da party 
participam contra 1-3 inimigos.

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
- js/combat/groupCore.js (funções startGroupEncounter, renderGroupBattle)
- js/combat/groupUI.js (interface e eventos)
- index.html (integração)

TESTES:
- tests/groupCore.test.js (lógica de batalha)
- tests/groupUI.test.js (se aplicável)

REFERÊNCIAS:
- Batalha individual já funciona (ver wildCore.js)
- Party system em GameState.currentSession
- Estrutura de monstros em player.team

ENTREGAS:
1. Interface de seleção funcional
2. Batalhas em grupo jogáveis
3. Sistema de turnos por SPD
4. Distribuição de recompensas
5. Testes passando
6. Sem bugs críticos
```

---

## 📞 Recursos e Contatos

### Documentação Essencial
- [GAME_RULES.md](./GAME_RULES.md) - Regras oficiais
- [TODO_FUNCIONALIDADES.md](./TODO_FUNCIONALIDADES.md) - Features pendentes
- [PROXIMOS_PASSOS.md](./PROXIMOS_PASSOS.md) - Roadmap detalhado
- [README.md](./README.md) - Guia de uso

### Dados do Jogo
- `data/monsters.json` - Catálogo de monstros
- `data/items.json` - Itens
- `data/skills.json` - Habilidades
- `data/*.csv` - Dados legados (MONSTROS, CLASSES, etc)

### Para Desenvolvedores
- Testes: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`

---

## ✅ Conclusão e Próximos Passos

### Estado do Projeto: ✅ SAUDÁVEL
- Código bem estruturado
- Testes completos
- Documentação excelente
- Funcionalidades core implementadas

### Prioridade #1: 🔥 BATALHAS EM GRUPO
- Maior impacto terapêutico
- Base técnica pronta
- Gameplay cooperativo

### Sequência Recomendada:
1. ✅ Batalhas em Grupo (1-2 semanas)
2. ✅ Sistema de Progressão (3-4 dias)
3. ✅ Menu Principal (1 semana)
4. ✅ Tutorial (1 semana)
5. ✅ Polimento contínuo...

### Decisão Necessária:
🎯 **Confirmar prioridade e começar implementação de Batalhas em Grupo**

---

**Última atualização:** 2026-02-02  
**Próxima revisão:** Após implementação da prioridade #1  
**Versão do documento:** 1.0
