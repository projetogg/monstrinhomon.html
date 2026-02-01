# 🤖 AI Summary - Monstrinhomon Project

> Este arquivo foi criado especificamente para facilitar o uso com ferramentas de IA como Replit, GitHub Copilot, ChatGPT, e outras.

## 📋 Resumo do Projeto

**Nome:** Monstrinhomon  
**Tipo:** Jogo terapêutico HTML/CSS/JavaScript  
**Propósito:** Jogo de RPG infantil estilo "monstros capturáveis" para uso terapêutico  
**Plataforma:** Web (HTML5, navegador)  
**Tecnologia:** Vanilla JavaScript, CSS, HTML (sem frameworks)

## 🎯 Conceito Principal

Jogo de RPG para crianças baseado em:
- **Classes** (não elementos): 7 classes principais + 1 neutra
- **Sistema de turnos** com dado físico d20
- **Captura determinística** de monstrinhos
- **Sistema terapêutico** com objetivos e medalhas
- **Batalhas em grupo** e progressão

## 🏗️ Estrutura do Projeto

```
monstrinhomon.html/
├── index.html              # Aplicação principal (ponto de entrada)
├── css/
│   └── main.css           # Estilos globais
├── js/
│   ├── storage.js         # Gerenciamento de estado e localStorage
│   ├── combat/            # Sistema de combate
│   └── progression/       # Sistema de XP e progressão
├── data/                  # Dados do jogo (CSV/JSON)
├── tests/                 # Testes automatizados
└── package.json           # Dependências e scripts NPM
```

## 🎮 Regras do Jogo (Essenciais)

### Classes
1. **Guerreiro** - Resistente, combate corpo a corpo
2. **Mago** - Dano mágico e controle
3. **Curandeiro** - Suporte e cura
4. **Bárbaro** - Alta força, risco/recompensa
5. **Ladino** - Velocidade, crítico, furtividade
6. **Bardo** - Alcance longo, buffs/debuffs
7. **Caçador** - Alcance longo, dano consistente
8. **Animalista** - Neutro (sem vantagens específicas)

### Ciclo de Vantagens
```
Guerreiro > Ladino > Mago > Bárbaro > Caçador > Bardo > Curandeiro > Guerreiro
Animalista: neutro
```

### Regra de Captura vs Batalha
- **CAPTURA**: Qualquer jogador pode capturar monstrinhos de QUALQUER classe
- **BATALHA**: Jogador só pode USAR em combate monstrinhos da MESMA classe
- **Objetivo**: Incentivar trocas entre jogadores

### Sistema de Combate
- **Acerto**: d20 + ATK ≥ DEF
- **Dano**: max(1, ATK + PODER - DEF)
- **CRIT 20**: Sempre acerta + bônus aleatório (poder dobrado, item, ou moedas)

### Sistema de Captura (Determinístico)
- Sem rolagem de dados
- Baseado em HP% do alvo + raridade + bônus de item
- Sempre consome 1 item de captura
- Threshold final = min(0.95, (Base + Item + Status) * multiplier)

## 💻 Comandos Principais

### Instalação e Setup
```bash
# Instalar dependências
npm install

# Executar testes
npm test

# Executar testes com watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

### Desenvolvimento
```bash
# Abrir o jogo no navegador
# Método 1: Abrir index.html diretamente
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# Método 2: Usar servidor local (recomendado)
python -m http.server 8000
# Depois acessar: http://localhost:8000

# Método 3: Usar Live Server (se instalado)
npx live-server
```

### Git
```bash
# Status atual
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "✨ descrição da mudança"

# Push
git push
```

## 🔧 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Armazenamento**: localStorage (browser)
- **Testes**: Vitest
- **Versionamento**: Git + GitHub
- **Deploy**: GitHub Pages (futuro)

## 📁 Arquivos Importantes

### Código Fonte
- `index.html` - Interface do jogo
- `css/main.css` - Estilos
- `js/storage.js` - Estado global e persistência

### Documentação
- `README.md` - Documentação geral
- `GAME_RULES.md` - Regras oficiais do jogo
- `LEIA-ME.md` - Guia de desenvolvimento
- `AGENTS.md` - Instruções para agentes (Copilot)

### Dados
- `MONSTROS.csv` - Catálogo de monstrinhos
- `CLASSES.csv` - Classes e atributos
- `HABILIDADES.csv` - Habilidades por classe
- `ITENS.csv` - Sistema de itens
- `CAPTURE_TABLE.csv` - Thresholds de captura

## 🤖 Como Usar com IA

### Para ChatGPT / Claude
```
1. Cole o conteúdo deste arquivo (AI_SUMMARY.md)
2. Depois pergunte: "Como implementar [feature X]?"
3. Use AI_COMMANDS.md para comandos específicos
```

### Para GitHub Copilot
```
1. O Copilot já lê automaticamente AGENTS.md
2. Este arquivo serve como referência adicional
3. Use comentários no código para guiar o Copilot
```

### Para Replit
```
1. Importe o repositório
2. Use o arquivo .replit para configuração
3. Execute: npm install
4. Abra index.html no navegador do Replit
```

## 🎯 Próximos Passos

### Fase Atual (Fase 2 - Completa)
- ✅ Sistema de batalha individual
- ✅ ENE + Habilidades por classe
- ✅ Sistema de captura determinística
- ✅ 8 classes funcionais
- ✅ Inventário básico

### Próxima Fase (Fase 3 - Em andamento)
- ⏳ Usar itens em batalha
- ⏳ Batalhas em grupo
- ⏳ Sistema XP/Level Up
- ⏳ Gestão de time
- ⏳ Gestão de inventário

## 📊 Estatísticas do Projeto

- **Linhas de código**: ~5000+
- **Funções**: 50+
- **Classes de personagem**: 8
- **Monstrinhos**: 15+ planejados
- **Itens**: 15+ tipos
- **Habilidades**: 20+ diferentes

## 🔑 Conceitos-Chave para IA

### Estado Global
```javascript
state = {
  therapist: boolean,
  ui: { tab, selectedPlayer, encounterMode, battleKind },
  config: { ... },
  data: {
    sessions: [],
    activeSessionId: string,
    players: [],
    playerClasses: [],
    catalog: [],
    instances: [],
    therapyObjectives: []
  }
}
```

### Funções Principais
- `load()` - Carrega estado do localStorage
- `save()` - Salva estado no localStorage
- `render()` - Atualiza UI
- `createInstance()` - Cria instância de Monstrinho
- `addXP()` - Adiciona XP e processa level up
- `computeDamage()` - Calcula dano de ataque
- `captureChance()` - Calcula chance de captura

### IDs Padrão
- Sessão: `sess_*`
- Jogador: `player_*`
- Instância de Monstrinho: `mi_*`
- Encontro: `enc_*`

## 🚨 Regras Importantes

1. **IDs são imutáveis** - Nunca renomear IDs de dados
2. **Sem frameworks** - Código vanilla JavaScript apenas
3. **PT-BR** - Comentários e mensagens em português
4. **Código simples** - Preferir legibilidade sobre complexidade
5. **Compatibilidade** - Manter compatibilidade com dados salvos

## 💡 Dicas para Desenvolvimento

### Ao implementar nova feature
1. Atualizar validação de dados
2. Atualizar fluxo de teste
3. Atualizar documentação
4. Testar no navegador
5. Verificar console para erros

### Ao fazer commit
```bash
# Usar prefixos:
✨ # Nova feature
🐛 # Bugfix
📝 # Documentação
♻️ # Refatoração
✅ # Testes
```

### Validação Mínima
1. Abrir index.html sem erros
2. Criar nova sessão
3. Criar jogadores
4. Primeiro combate
5. Captura funciona

## 📚 Referências Rápidas

### Multiplicadores de Raridade
```javascript
RARITY_PWR = {
  Comum: 1.00,
  Incomum: 1.08,
  Raro: 1.18,
  Místico: 1.32,
  Lendário: 1.50
}
```

### Captura Base (%)
```javascript
CAPTURE_BASE = {
  Comum: 60,
  Incomum: 45,
  Raro: 30,
  Místico: 18,
  Lendário: 10
}
```

### XP para próximo nível
```javascript
xp_needed = Math.round(40 + 6*L + 0.6*(L*L))
```

## 🎨 Convenções de Código

- Funções: camelCase (`createPlayer`)
- Constantes: UPPER_SNAKE_CASE (`MAX_LEVEL`)
- IDs: snake_case com prefixo (`player_123`, `mi_456`)
- Classes CSS: kebab-case (`monster-card`)

## 🔍 Debug

### Console do Navegador
```javascript
// Acessar estado global
state

// Forçar salvamento
save()

// Forçar re-render
render()
```

### Modo Terapeuta
- Habilitar no header
- Permite funcionalidades especiais para testes

---

**Versão**: 1.0.0  
**Última atualização**: 2026-02-01  
**Mantenha este arquivo atualizado** ao fazer mudanças significativas no projeto.
