# 🗺️ Roadmap de Próximos Passos - Monstrinhomon

**Versão:** 2.0  
**Data:** 2026-01-27  
**Status Atual:** Batalhas Individuais MVP Completo

---

## 📊 Estado Atual da Implementação

### ✅ O Que Está Pronto e Funcionando

#### Sistema de Batalha Individual (MVP Completo)
- ✅ **Sistema ENE**: Regeneração automática por classe (10-18% por turno)
- ✅ **Habilidades por Classe**: 8 classes × 2-3 skills com upgrade automático (I/II/III)
- ✅ **Nova Fórmula de Dano**: `ratio = ATK/(ATK+DEF); dano = POWER × ratio`
- ✅ **Sistema de Captura**: ClasterOrbs (Comum/Incomum/Rara) com threshold determinístico
- ✅ **Regra de Classe**: Pode capturar qualquer classe, mas só usa em batalha sua própria classe
- ✅ **CRIT 20**: 3 bônus aleatórios (poder dobrado, item, dinheiro)
- ✅ **Buffs Temporários**: ATK/DEF/SPD com duração em turnos
- ✅ **IA do Inimigo**: 50% usa habilidade, 50% ataque básico

#### Infraestrutura Base
- ✅ Sistema de jogadores e sessões
- ✅ Inventário básico (ClasterOrbs + itens de cura)
- ✅ Sistema de persistência (localStorage)
- ✅ Interface funcional com abas
- ✅ Documentação completa (GAME_RULES.md)

---

## 🎯 FASE 3: Completar Sistema de Batalha e Progressão

**Objetivo:** Tornar o jogo completamente jogável do início ao fim com progressão funcional.  
**Prazo Estimado:** 2-3 semanas  
**Dependências:** Fase 2 completa ✅

### 3.1 Sistema de Uso de Itens em Batalha (Alta Prioridade)
**Por que primeiro:** Essencial para sobrevivência em batalhas longas

- [ ] **Usar Petiscos de Cura em batalha**
  - [ ] Botão "Usar Item" na interface de batalha
  - [ ] Dropdown para selecionar item
  - [ ] Aplicar cura ao monstrinho do jogador
  - [ ] Consumir item do inventário
  - [ ] Logar ação no combate
  - [ ] Inimigo tem turno após uso de item

- [ ] **Reviver monstrinhos desmaiados**
  - [ ] Item "Essência Vital" (já existe em ITENS.csv)
  - [ ] Usar fora de batalha
  - [ ] Restaurar 50% HP

**Entregáveis:**
```
- Botão "💚 Usar Item" na interface de batalha
- Dropdown com itens disponíveis
- Sistema de revive fora de batalha
```

### 3.2 Batalhas em Grupo (Trainer/Boss) (Alta Prioridade)
**Por que:** Permite uso completo da party de 6 jogadores

- [ ] **Seleção de participantes**
  - [ ] Interface para selecionar quais jogadores participam
  - [ ] Validar que todos têm monstros disponíveis da sua classe
  - [ ] Ordem de turnos por SPD (Speed)

- [ ] **Sistema de turnos em grupo**
  - [ ] Cada jogador joga na sua vez
  - [ ] Inimigos múltiplos (1-3 bosses/trainers)
  - [ ] Indicador visual de quem é o turno atual
  - [ ] Opção de "passar turno"

- [ ] **Recompensas de grupo**
  - [ ] XP distribuído para todos os participantes
  - [ ] Dinheiro distribuído igualmente
  - [ ] Items dropados vão para inventário compartilhado da sessão

- [ ] **Sem captura em grupo**
  - [ ] Desabilitar botão de captura
  - [ ] Mostrar mensagem: "Capturas só em encontros individuais"

**Entregáveis:**
```
- Interface de seleção de participantes
- Sistema de turnos em ordem por SPD
- Distribuição de recompensas funcionando
```

### 3.3 Sistema de Progressão (XP e Level Up) (Crítico)
**Por que:** Sem progressão, não há motivação para continuar jogando

- [ ] **Ganhar XP após vitórias**
  - [ ] Calcular XP base: `15 + (nível_inimigo × 2) × rarityMult`
  - [ ] Usar RARITY_XP para multiplicadores
  - [ ] Aplicar bônus de medalhas (se implementado)
  - [ ] Distribuir XP aos monstros que participaram

- [ ] **Level Up automático**
  - [ ] Detectar quando `xp >= xpNeeded`
  - [ ] Subir nível (`level++`)
  - [ ] Recalcular todos os stats usando growth rates
  - [ ] Atualizar HP máximo: `hpMax = hpMax × 1.04 + 2`
  - [ ] HP atual aumenta proporcionalmente
  - [ ] Animação/notificação visual

- [ ] **Verificar evolução**
  - [ ] Ao atingir nível de evolução (ex: nv 16)
  - [ ] Mostrar tela de evolução
  - [ ] Transformar em forma evoluída (MON_002B, MON_002C)
  - [ ] Recalcular stats com novo template
  - [ ] Opção de cancelar evolução (segurar B)

- [ ] **Aprender novas habilidades**
  - [ ] Ao subir stage (S0→S1→S2→S3)
  - [ ] Notificar: "Pedrino aprendeu Golpe de Espada II!"
  - [ ] Habilidades antigas são substituídas

**Entregáveis:**
```
- Sistema de XP funcionando
- Level up com stats recalculados
- Evoluções automáticas nos níveis corretos
- Notificações de aprendizado de skills
```

### 3.4 Gestão de Time e Caixa (Média Prioridade)
**Por que:** Necessário quando jogadores têm múltiplos monstros

- [ ] **Interface de Time**
  - [ ] Ver todos os monstros no time ativo (1-6)
  - [ ] Ver todos os monstros na caixa
  - [ ] Trocar monstros entre time e caixa
  - [ ] Reordenar time (drag & drop ou setas)

- [ ] **Stats detalhados**
  - [ ] Modal/tela expandida ao clicar em monstrinho
  - [ ] Mostrar: HP, ATK, DEF, SPD, ENE
  - [ ] Mostrar: XP atual, XP para próximo nível
  - [ ] Mostrar: Todas as habilidades com descrições
  - [ ] Mostrar: Status effects ativos

- [ ] **Renomear monstrinhos**
  - [ ] Input para apelido customizado
  - [ ] Máximo 12 caracteres
  - [ ] Salvar no monsterInstance

**Entregáveis:**
```
- Aba "Time" com lista visual de todos monstros
- Sistema de troca time ↔ caixa
- Modal de stats detalhados
- Sistema de renomear
```

### 3.5 Gestão de Inventário (Média Prioridade)
**Por que:** Jogadores precisam ver e usar seus itens

- [ ] **Interface de Inventário**
  - [ ] Lista de todos os itens do jogador
  - [ ] Quantidade de cada item
  - [ ] Categoria: Captura, Cura, Tático
  - [ ] Descrição ao passar mouse

- [ ] **Usar itens fora de batalha**
  - [ ] Selecionar item
  - [ ] Selecionar monstrinho alvo
  - [ ] Aplicar efeito
  - [ ] Consumir item

- [ ] **Comprar itens (futuro)**
  - [ ] Loja simples com 4-5 itens
  - [ ] Usar dinheiro do jogador
  - [ ] Adicionar ao inventário

**Entregáveis:**
```
- Aba "Inventário" com todos os itens
- Sistema de usar item fora de batalha
- (Opcional) Loja simples
```

---

## 🎯 FASE 4: Menu Principal e Fluxo do Jogo

**Objetivo:** Criar experiência completa desde o início até o fim  
**Prazo Estimado:** 1-2 semanas  
**Dependências:** Fase 3 completa

### 4.1 Menu Principal e Fluxo Inicial (Alta Prioridade)

- [ ] **Tela de Intro**
  - [ ] Logo do jogo
  - [ ] Botão "Iniciar"
  - [ ] Animação simples de fade-in

- [ ] **Menu Principal**
  - [ ] 3 opções grandes:
    1. 🎮 Novo Jogo
    2. 📖 Continuar Aventura
    3. ⚙️ Configurações
  - [ ] Background temático

- [ ] **Fluxo de Novo Jogo**
  1. Selecionar número de jogadores (1-6)
  2. Selecionar dificuldade (Fácil/Médio/Difícil)
  3. Criar cada jogador:
     - Nome
     - Classe
     - Monstrinho inicial automático
  4. Iniciar pelo tutorial

- [ ] **Continuar Aventura**
  - [ ] Listar slots de save disponíveis
  - [ ] Mostrar: nome da sessão, data, progresso
  - [ ] Carregar save selecionado

**Entregáveis:**
```
- Tela de intro funcional
- Menu principal com 3 opções
- Fluxo completo de novo jogo
- Sistema de continuar aventura
```

### 4.2 Tutorial Interativo (Média Prioridade)

- [ ] **Tutorial de Batalha**
  - [ ] Encontro tutorial contra monstrinho fraco
  - [ ] Explicar: rolagem d20, acerto, dano
  - [ ] Forçar uso de ataque básico
  - [ ] Forçar uso de 1 habilidade
  - [ ] Forçar usar 1 item de cura

- [ ] **Tutorial de Captura**
  - [ ] Encontro tutorial para captura
  - [ ] Explicar: baixar HP, escolher orbe
  - [ ] Forçar captura bem-sucedida (HP baixo + orbe rara)
  - [ ] Comemoração: "Você capturou [nome]!"

- [ ] **Tutorial de Classes**
  - [ ] Explicar: só pode usar sua classe em batalha
  - [ ] Explicar: pode capturar qualquer classe
  - [ ] Incentivar trocas entre jogadores

**Entregáveis:**
```
- 3 encontros de tutorial sequenciais
- Diálogos explicativos
- Progressão forçada (não pode pular)
```

### 4.3 Sistema de Save/Load Completo (Alta Prioridade)

- [ ] **Auto-save**
  - [ ] Salvar automaticamente a cada ação importante:
    - Após vitória em batalha
    - Após captura
    - Ao trocar monstros
    - A cada 2 minutos de jogo
  - [ ] Indicador visual: "Salvando..."

- [ ] **Múltiplos slots**
  - [ ] 3 slots de save independentes
  - [ ] Cada slot: JSON completo no localStorage
  - [ ] Chave: `mm_save_slot_1`, `mm_save_slot_2`, `mm_save_slot_3`

- [ ] **Exportar/Importar**
  - [ ] Botão "Exportar Save" → download JSON
  - [ ] Botão "Importar Save" → upload JSON
  - [ ] Validação de integridade

**Entregáveis:**
```
- Auto-save funcionando
- 3 slots de save independentes
- Exportar/importar save em JSON
```

---

## 🎯 FASE 5: Sistema de Dificuldade e Balanceamento

**Objetivo:** Ajustar balanceamento e adicionar opções de dificuldade  
**Prazo Estimado:** 1 semana  
**Dependências:** Fase 4 completa

### 5.1 Três Níveis de Dificuldade

- [ ] **Fácil**
  - [ ] Inimigos: -20% HP, -10% ATK/DEF
  - [ ] XP: +50% de recompensa
  - [ ] Captura: +15% threshold
  - [ ] Fuga: DC reduzido em 2

- [ ] **Médio** (Padrão)
  - [ ] Stats balanceados conforme dados base

- [ ] **Difícil**
  - [ ] Inimigos: +30% HP, +20% ATK/DEF
  - [ ] XP: -25% de recompensa
  - [ ] Captura: -10% threshold
  - [ ] Fuga: DC aumentado em 3

### 5.2 Ajustes de Balanceamento (Baseado em Playtesting)

- [ ] **Testar progressão**
  - [ ] Do nível 1 ao 20: deve levar ~2-3 horas
  - [ ] Do nível 20 ao 50: deve levar ~5-6 horas
  - [ ] Ajustar curva de XP se necessário

- [ ] **Testar dificuldade de capturas**
  - [ ] Comuns: ~60-80% de sucesso em HP baixo
  - [ ] Raros: ~30-40% de sucesso em HP baixo
  - [ ] Lendários: ~10-15% de sucesso em HP baixo

- [ ] **Ajustar custos de ENE**
  - [ ] Verificar se mana regen está adequado
  - [ ] Ajustar custos se habilidades são spam ou raramente usadas

**Entregáveis:**
```
- Seletor de dificuldade no novo jogo
- Multiplicadores funcionando
- Relatório de balanceamento
```

---

## 🎯 FASE 6: Status Effects Completos

**Objetivo:** Adicionar profundidade tática às batalhas  
**Prazo Estimado:** 1-2 semanas  
**Dependências:** Fase 3 completa

### 6.1 Status Effects Básicos

- [ ] **STUN (Atordoado)**
  - [ ] Aplicado por habilidades específicas
  - [ ] Duração: 1-2 turnos
  - [ ] Efeito: perde o turno
  - [ ] Indicador visual: ⭐

- [ ] **ROOT (Enraizado)**
  - [ ] Aplicado por habilidades de controle
  - [ ] Duração: 1-2 turnos
  - [ ] Efeito: não pode fugir
  - [ ] Indicador visual: 🌱

- [ ] **WEAKEN (Enfraquecido)**
  - [ ] Aplicado por debuffs
  - [ ] Duração: 2-3 turnos
  - [ ] Efeito: -25% ATK
  - [ ] Indicador visual: 💔

- [ ] **POISON (Envenenado)**
  - [ ] Dano por turno: 5% HP max
  - [ ] Duração: 3 turnos
  - [ ] Indicador visual: 🟢

- [ ] **SHIELD (Escudo)**
  - [ ] Reduz dano recebido: 30%
  - [ ] Duração: 2 turnos
  - [ ] Indicador visual: 🛡️

### 6.2 Gestão de Status

- [ ] **Sistema de aplicação**
  - [ ] Habilidades definem: tipo, duração, poder
  - [ ] Verificar resistência (futuro)
  - [ ] Empilhamento: só 1 de cada tipo

- [ ] **Sistema de remoção**
  - [ ] Auto-expiração por turnos
  - [ ] Itens de cura podem remover (futuro)
  - [ ] Alguns status podem ser imunes

- [ ] **Interface visual**
  - [ ] Ícones pequenos sob o HP bar
  - [ ] Tooltip ao passar mouse
  - [ ] Animação ao aplicar/remover

**Entregáveis:**
```
- 5 status effects funcionais
- Sistema de gestão de status
- Indicadores visuais
```

---

## 🎯 FASE 7: Polimento e Recursos Avançados

**Objetivo:** Melhorar experiência e adicionar features opcionais  
**Prazo Estimado:** 2-3 semanas  
**Dependências:** Fases 3-6 completas

### 7.1 Animação de Dado d20 (Baixa Prioridade, Alto Impacto)

- [ ] **Animação 3D ou 2D**
  - [ ] Dado girando por 1-2 segundos
  - [ ] Som de dado rolando (opcional)
  - [ ] Revelar número final com destaque
  - [ ] Críticos (20) e falhas (1) com animação especial

- [ ] **Integração**
  - [ ] Substituir input manual do d20
  - [ ] Botão "Rolar d20" automático
  - [ ] Manter opção de input manual (modo debug)

**Entregáveis:**
```
- Animação de dado funcional
- Sons de rolagem (opcional)
- Animações especiais para 1 e 20
```

### 7.2 Elementos Visuais

- [ ] **Sprites de Monstrinhos**
  - [ ] Criar/buscar 6 sprites iniciais (64x64 ou 128x128)
  - [ ] Formato: PNG com fundo transparente
  - [ ] Substituir emojis por sprites

- [ ] **Sprites de Itens**
  - [ ] 8 itens principais com ícones
  - [ ] 32x32 ou 64x64
  - [ ] ClasterOrbs com cores distintas

- [ ] **Barras de HP visuais**
  - [ ] Barra colorida (verde → amarelo → vermelho)
  - [ ] Animação ao perder/ganhar HP
  - [ ] Números de dano flutuando

- [ ] **Animações de batalha**
  - [ ] Shake ao receber dano
  - [ ] Flash ao atacar
  - [ ] Partículas de habilidades (simples)

**Entregáveis:**
```
- 6 sprites de monstrinhos
- 8 sprites de itens
- Barras de HP animadas
- Efeitos visuais básicos
```

### 7.3 Som e Música (Opcional)

- [ ] **Música de fundo**
  - [ ] Menu principal: música calma
  - [ ] Batalha: música épica
  - [ ] Vitória: fanfarra curta
  - [ ] Formatos: MP3 ou OGG

- [ ] **Efeitos sonoros**
  - [ ] Ataque: whoosh
  - [ ] Acerto: thud
  - [ ] Miss: swish
  - [ ] Captura: success jingle
  - [ ] Level up: fanfarra

- [ ] **Controles**
  - [ ] Slider de volume (0-100%)
  - [ ] Mute/unmute
  - [ ] Salvar preferências

**Entregáveis:**
```
- 3 músicas de fundo
- 6 efeitos sonoros
- Controles de volume funcionando
```

### 7.4 Quests e Drops

- [ ] **Sistema de Quests**
  - [ ] Implementar QUESTS.csv
  - [ ] Interface de quest log
  - [ ] Rastreamento de progresso
  - [ ] Recompensas ao completar

- [ ] **Sistema de Drops**
  - [ ] Implementar DROPS.csv
  - [ ] Monstros dropam itens ao morrer
  - [ ] Percentual por raridade
  - [ ] Notificação: "Você encontrou [item]!"

**Entregáveis:**
```
- Sistema de quests funcionando
- Sistema de drops por raridade
- Integração com inventário
```

### 7.5 Modo Terapeuta Completo

- [ ] **Interface específica**
  - [ ] Aba "Terapia" com login
  - [ ] Dashboard com métricas
  - [ ] Notas por jogador

- [ ] **Ferramentas**
  - [ ] Adicionar objetivos terapêuticos
  - [ ] Marcar conquistas por sessão
  - [ ] Sistema de medalhas (Bronze/Prata/Ouro)

- [ ] **Relatórios**
  - [ ] Exportar progresso em PDF
  - [ ] Gráficos de evolução

**Entregáveis:**
```
- Aba Terapia funcional
- Sistema de objetivos e medalhas
- Relatórios exportáveis
```

---

## 📅 Cronograma Sugerido

### Mês 1 (Semanas 1-4)
- **Semana 1-2:** Fase 3.1-3.2 (Itens em batalha + Batalhas em grupo)
- **Semana 3:** Fase 3.3 (Progressão XP/Level Up)
- **Semana 4:** Fase 3.4-3.5 (Gestão Time + Inventário)

### Mês 2 (Semanas 5-8)
- **Semana 5-6:** Fase 4.1-4.2 (Menu Principal + Tutorial)
- **Semana 7:** Fase 4.3 (Save/Load Completo)
- **Semana 8:** Fase 5 (Dificuldades + Balanceamento)

### Mês 3 (Semanas 9-12)
- **Semana 9-10:** Fase 6 (Status Effects)
- **Semana 11-12:** Fase 7 (Polimento: Animações, Sprites, Sons)

### Mês 4+ (Opcional)
- Quests e Drops
- Modo Terapeuta Completo
- Mais monstrinhos e locais
- Multiplayer local (futuro)

---

## 🔧 Ferramentas e Recursos Recomendados

### Para Desenvolvimento
- **Editor:** VS Code com Live Server
- **Debug:** Chrome DevTools
- **Versionamento:** Git + GitHub
- **AI Assistant:** ChatGPT para implementação de features

### Para Assets
- **Sprites:** Piskel, Aseprite, ou buscar em itch.io (assets gratuitos)
- **Sons:** Freesound.org, Zapsplat
- **Música:** Incompetech, OpenGameArt

### Para Teste
- **Playtesters:** 2-3 crianças (7-12 anos)
- **Feedback:** Formulário simples
- **Métricas:** Tempo de jogo, dificuldade percebida

---

## 📋 Checklist de Pronto para Lançar

### Mínimo Viável (MVP Completo)
- [ ] Tutorial completo funcional
- [ ] Batalhas individuais e em grupo
- [ ] Sistema de progressão (XP/Level/Evolução)
- [ ] Captura funcionando
- [ ] Gestão de time e inventário
- [ ] Save/Load funcionando
- [ ] 3 níveis de dificuldade
- [ ] Menu principal e fluxo completo
- [ ] Sem bugs críticos

### Desejável para Lançamento
- [ ] Sprites visuais para monstrinhos
- [ ] Barras de HP animadas
- [ ] Animação de dado d20
- [ ] Pelo menos 1 música de fundo
- [ ] 5 efeitos sonoros
- [ ] 3-5 quests implementadas
- [ ] Sistema de drops funcionando

### Excelente para Lançamento
- [ ] Modo Terapeuta completo
- [ ] 10+ monstrinhos disponíveis
- [ ] Status effects completos
- [ ] Tutorial interativo polido
- [ ] Todos os sprites e sons
- [ ] Multiplayer local (opcional)

---

## 🎯 Próximo Passo Imediato (AGORA)

### Recomendação: Começar pela Fase 3.1

**Tarefa:** Implementar "Usar Itens em Batalha"

**Por que:**
1. É a feature mais simples da Fase 3
2. Essencial para testar batalhas longas
3. Já temos inventário básico implementado
4. Prepara terreno para gestão de inventário completa

**O que fazer:**
```
1. Adicionar botão "💚 Usar Item" na interface de batalha
2. Criar dropdown com itens disponíveis (Petiscos de Cura)
3. Implementar lógica de cura ao monstrinho ativo
4. Consumir item do inventário
5. Logar ação no combate
6. Inimigo tem turno após uso de item
```

**Prompt para ChatGPT:**
```
Implementar sistema de uso de itens em batalha no Monstrinhomon:

1. Adicionar botão "Usar Item" na interface de batalha (index.html)
2. Criar dropdown com itens curáveis disponíveis no inventário do jogador
3. Ao usar:
   - Aplicar cura ao monstrinho do jogador (ex: Petisco cura 30% HP)
   - Consumir 1 unidade do item
   - Logar: "João usou Petisco de Cura! Pedrino recuperou X HP!"
   - Inimigo tem seu turno normal
4. Validações:
   - Só mostrar itens com quantidade > 0
   - Desabilitar se inventário vazio
   - Não pode usar se monstrinho já está em HP máximo

Seguir padrão do código existente (attackWild, useSkillWild).
```

---

## 📞 Contato e Suporte

**Dúvidas sobre este roadmap?**
- Consulte GAME_RULES.md para mecânicas
- Consulte TODO_FUNCIONALIDADES.md para lista detalhada
- Use GitHub Issues para discussões técnicas

**Boa sorte no desenvolvimento! 🎮✨**
