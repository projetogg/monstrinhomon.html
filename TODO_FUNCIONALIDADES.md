# Lista de Funcionalidades Faltando - Monstrinhomon

## ✅ Já Implementado

### Sistema de Dados
- [x] Integração completa dos CSVs (MONSTROS, CLASSES, ITENS, HABILIDADES, CONFIG, etc.)
- [x] 6 monstrinhos com stats completos
- [x] 8 classes com crescimento por nível
- [x] 8 habilidades
- [x] 8 itens
- [x] Sistema de evolução (com placeholders)

### Sistema de Party/Grupo
- [x] Criação de party (1-6 jogadores)
- [x] Cada jogador com nome, classe e monstrinho inicial
- [x] Todos membros da party visíveis na sessão
- [x] Mestre controla todos os jogadores

### UI Básico
- [x] Aba Sessão (gerenciar party)
- [x] Aba Jogadores (ver membros da party)
- [x] Aba Encontro (gerar encontros - EM DESENVOLVIMENTO)
- [x] Aba Relatório (catálogo de monstrinhos)

---

## ❌ Ainda Faltando Implementar

### 1. Sistema de Batalha Completo
- [ ] **Mecânica de turnos** (ordem de ação por velocidade/SPD)
- [ ] **Sistema de ataques** com rolagem de d20
  - [ ] Rolagem de acerto (d20 + modificadores)
  - [ ] Cálculo de dano (baseado em ATK vs DEF)
  - [ ] Aplicar dano e reduzir HP
- [ ] **Uso de habilidades** durante batalha
  - [ ] Gastar energia (ENE)
  - [ ] Aplicar efeitos de status (Atordoado, Enraizado, etc.)
- [ ] **Sistema de cura** (usar itens de cura durante batalha)
- [ ] **Fuga** da batalha (rolagem de d20 vs DC)
- [ ] **Vitória/Derrota**
  - [ ] Distribuir XP ao vencer
  - [ ] Sistema de morte/pós-vida

### 2. Sistema de Captura Funcional
- [ ] **Interface de captura** durante encontro individual
  - [ ] Mostrar HP atual do monstrinho selvagem
  - [ ] Botão "Tentar Capturar" (só aparece se HP > 0)
  - [ ] Desabilitar captura se HP <= 0
- [ ] **Mecânica de captura**
  - [ ] Verificar se HP > 0 (regra obrigatória)
  - [ ] Aplicar threshold baseado em raridade
  - [ ] Usar item de captura do inventário
  - [ ] Adicionar monstrinho capturado ao time/caixa do jogador
- [ ] **Feedback visual** de sucesso/falha

### 3. Animação de Dado d20
- [ ] **Animação visual** de d20 girando
- [ ] Mostrar o dado "rolando" antes de revelar resultado
- [ ] Criar expectativa para as crianças
- [ ] Aplicar em:
  - [ ] Rolagens de ataque
  - [ ] Rolagens de captura (se adicionar)
  - [ ] Rolagens de fuga

### 4. Menu Principal/Fluxo do Jogo
- [ ] **Tela de Intro** do jogo
- [ ] **Botão "Iniciar"**
- [ ] **Menu Principal** com 3 opções:
  - [ ] Novo Jogo
  - [ ] Continuar Aventura
  - [ ] Configurações (menu do mestre)
- [ ] **Fluxo de Novo Jogo:**
  1. Selecionar número de jogadores (1-6)
  2. Selecionar dificuldade (Fácil, Médio, Difícil)
  3. Criar jogadores da party
  4. Iniciar pelo tutorial
- [ ] **Continuar Aventura**: Retornar ao último ponto salvo

### 5. Sistema de Tutorial
- [ ] **Tutorial interativo** para ensinar:
  - [ ] Como funcionam as batalhas
  - [ ] Como capturar monstrinhos
  - [ ] Como usar itens
  - [ ] Sistema de classes
- [ ] **Localização tutorial** (Campina Inicial já existe nos dados)

### 6. Sistema de Progressão
- [ ] **Ganhar XP** após batalhas
- [ ] **Subir de nível** (level up)
  - [ ] Recalcular stats com growth rate
  - [ ] Verificar evolução automática
  - [ ] Aprender novas habilidades
- [ ] **Sistema de evolução completo**
  - [ ] Implementar monstrinhos MON_002B e MON_002C
  - [ ] Animação/notificação de evolução
  - [ ] Opção de cancelar evolução?

### 7. Gestão de Inventário
- [ ] **Ver inventário completo** de cada jogador
- [ ] **Usar itens** fora de batalha
  - [ ] Curar monstrinhos
  - [ ] Reviver monstrinhos mortos (pós-vida)
- [ ] **Comprar/ganhar itens**
- [ ] **Sistema de dinheiro** funcional

### 8. Gestão de Time
- [ ] **Trocar monstrinhos** entre time ativo e caixa
- [ ] **Ver stats detalhados** de cada monstrinho
  - [ ] HP atual/máximo
  - [ ] XP atual e para próximo nível
  - [ ] Todas as habilidades
- [ ] **Renomear monstrinhos** (apelido)

### 9. Sistema de Dificuldade
- [ ] **Fácil**: 
  - [ ] Inimigos mais fracos
  - [ ] Mais XP
  - [ ] Captura mais fácil
- [ ] **Médio**: Balanceado
- [ ] **Difícil**:
  - [ ] Inimigos mais fortes
  - [ ] Menos XP
  - [ ] Captura mais difícil

### 10. Tipos de Encontro Completos
- [ ] **Encontro de Captura Individual**
  - [ ] Selecionar 1 jogador da party
  - [ ] Apenas esse jogador participa
  - [ ] Pode capturar (se HP > 0)
- [ ] **Encontro Boss/Treinador em Grupo**
  - [ ] Party inteira participa
  - [ ] Turnos para todos os jogadores
  - [ ] Sem opção de captura
  - [ ] Recompensas maiores (XP, dinheiro)

### 11. Aba Terapia (Modo Terapeuta)
- [ ] Interface específica para terapeuta
- [ ] Ferramentas de acompanhamento
- [ ] Notas sobre progresso das crianças
- [ ] Objetivos terapêuticos

### 12. Aba Ajustes/Configurações
- [ ] **Menu do Mestre** com opções:
  - [ ] Editar multiplicadores (XP, stats, captura)
  - [ ] Ativar/desativar modo terapeuta
  - [ ] Ajustar dificuldade em tempo real
  - [ ] Editar jogadores/party
  - [ ] Adicionar itens/monstrinhos manualmente (modo debug)

### 13. Sistema de Salvamento
- [ ] **Auto-save** frequente
- [ ] **Múltiplos slots de save**
- [ ] **Continuar do último ponto**
- [ ] Exportar/importar save (JSON)

### 14. Elementos Visuais
- [ ] **Sprites/ícones** para monstrinhos
- [ ] **Sprites/ícones** para itens
- [ ] **Sprites/ícones** para classes
- [ ] **Animações de batalha** simples
- [ ] **Barras de HP** visuais
- [ ] **Indicadores de status** visuais

### 15. Som e Música (Opcional)
- [ ] Música de fundo
- [ ] Efeitos sonoros (ataques, captura, etc.)
- [ ] Controle de volume

### 16. Sistema de Quests (Dos CSVs)
- [ ] Implementar dados de QUESTS.csv
- [ ] Sistema de missões
- [ ] Rastreamento de progresso
- [ ] Recompensas por quest

### 17. Sistema de Drops (Dos CSVs)
- [ ] Implementar DROPS.csv
- [ ] Monstrinhos derrotados dropam itens
- [ ] Percentual de drop por raridade

### 18. Outros Locais
- [ ] Implementar mais locais além de "Campina Inicial"
- [ ] Sistema de viagem entre locais
- [ ] Encontros específicos por local

### 19. Sistema de Medalhas/Conquistas
- [ ] Medalhas Bronze/Prata/Ouro (já tem dados em CONFIG)
- [ ] Sistema de XP caps por medalha
- [ ] Interface para ver conquistas

---

## 🎯 Prioridade Sugerida (Para ChatGPT)

### Fase 2 (EM ANDAMENTO)
1. ✅ Encontros individuais vs grupo
2. ⏳ Regra HP > 0 para captura
3. ⏳ Interface de captura funcional

### Fase 3 (Próxima)
1. Sistema de batalha básico (turnos, ataques, dano)
2. Animação de dado d20
3. Sistema de captura completo

### Fase 4
1. Sistema de progressão (XP, level up)
2. Gestão de inventário e time
3. Menu principal e fluxo do jogo

### Fase 5
1. Tutorial
2. Dificuldades
3. Sistema de save completo

### Fase 6 (Polimento)
1. Elementos visuais
2. Sons (opcional)
3. Quests e drops
4. Aba Terapia completa

---

## 📋 Notas Importantes

### Dados Já no Código (Prontos para Usar)
- `SKILLS` - 8 habilidades completas
- `ITEMS` - 8 itens com efeitos
- `CLASS_GROWTH` - Crescimento por classe
- `CAPTURE_THRESHOLD` - Thresholds de captura por raridade
- `EVOLUTIONS` - 2 evoluções (com placeholders)
- `LOCATIONS` - 1 local tutorial
- `ENCOUNTERS` - 2 templates de encontro

### Mecânicas Já Codificadas (Mas Não Usadas)
- `calculateMonsterStats()` - Calcula stats por nível
- `canCapture()` - Verifica se pode capturar (threshold)
- `checkEvolution()` - Verifica e executa evolução
- `xpForLevel()` - Calcula XP necessário para nível

### CSV Files Não Implementados Ainda
- `QUESTS.csv`
- `DROPS.csv`
- `RULES.csv`
- `TEST_SCENARIO.csv`
- `MASTER_CONTROLS.csv`

---

## 💡 Sugestões para o ChatGPT

Use esta lista para:
1. **Priorizar** o que implementar primeiro
2. **Detalhar** cada mecânica faltante
3. **Criar especificações** técnicas
4. **Gerar código** para cada funcionalidade
5. **Testar** cada feature antes de integrar

**Estrutura dos dados já está pronta**, falta principalmente:
- Lógica de batalha
- Interface de captura
- Animações visuais
- Fluxo de menus
