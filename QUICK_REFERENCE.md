# ⚡ Quick Reference - Monstrinhomon

> Guia de referência rápida para uso com ferramentas de IA

## 🚀 Início Rápido (5 minutos)

### Para Replit
```bash
# 1. Importar este repositório no Replit
# 2. O arquivo .replit já configura tudo automaticamente
# 3. Clicar em "Run" para iniciar o servidor
# 4. Acessar o jogo na aba "Webview"
```

### Para Local
```bash
# 1. Clonar repositório
git clone https://github.com/projetogg/monstrinhomon.html.git
cd monstrinhomon.html

# 2. Instalar dependências (opcional, só para testes)
npm install

# 3. Abrir o jogo
# Opção A: Direto no navegador
open index.html

# Opção B: Com servidor local (recomendado)
npm run dev
# Acessar: http://localhost:8000
```

## 📋 Comandos Essenciais

### Menu Interativo
```bash
npm run menu
# ou
./commands.sh
```

### Desenvolvimento
```bash
npm run dev        # Iniciar servidor local
npm test           # Executar testes
npm run validate   # Validar código antes de commit
```

### Git
```bash
git status         # Ver mudanças
git add .          # Adicionar tudo
git commit -m "mensagem"  # Fazer commit
git push           # Enviar para GitHub
```

## 🤖 Prompts para IA (Copy & Paste)

### 1. Entender o Projeto
```
Analise o projeto Monstrinhomon no arquivo AI_SUMMARY.md.
Resuma em 5 pontos principais.
```

### 2. Implementar Feature
```
No projeto Monstrinhomon (jogo terapêutico em HTML/JS):

Implementar: [NOME DA FEATURE]

Requisitos:
- Vanilla JavaScript (sem frameworks)
- Seguir regras em GAME_RULES.md
- Código em PT-BR para comentários
- Compatível com localStorage

Forneça código completo com explicação.
```

### 3. Debugar Erro
```
Erro no projeto Monstrinhomon:

[COLAR ERRO AQUI]

Contexto: [O QUE ESTAVA FAZENDO]

Como resolver?
```

### 4. Otimizar Código
```
Otimizar esta função do Monstrinhomon:

[COLAR CÓDIGO]

Manter funcionalidade + melhorar performance + adicionar validações.
```

### 5. Criar Testes
```
Criar testes Vitest para:

[COLAR FUNÇÃO]

Incluir casos normais + edge cases + validações de erro.
```

## 📁 Arquivos Principais

### Código
- `index.html` - Interface do jogo
- `css/main.css` - Estilos
- `js/storage.js` - Estado e localStorage

### Documentação para IA
- `AI_SUMMARY.md` ⭐ - Resumo completo (leia primeiro)
- `AI_COMMANDS.md` - Comandos detalhados
- `QUICK_REFERENCE.md` - Este arquivo

### Regras do Jogo
- `GAME_RULES.md` - Regras oficiais
- `AGENTS.md` - Instruções para Copilot

### Dados
- `MONSTROS.csv` - Catálogo de monstrinhos
- `CLASSES.csv` - Classes e atributos
- `ITENS.csv` - Sistema de itens

## 🎮 Regras do Jogo (Ultra Resumo)

### Sistema de Classes
```
8 classes: Guerreiro, Mago, Curandeiro, Bárbaro, 
          Ladino, Bardo, Caçador, Animalista

Vantagens: Guerreiro > Ladino > Mago > Bárbaro > 
          Caçador > Bardo > Curandeiro > Guerreiro
```

### Combate
```
Acerto: d20 + ATK ≥ DEF
Dano: max(1, ATK + PODER - DEF)
CRIT 20: Sempre acerta + bônus aleatório
```

### Captura
```
Sem dados (determinístico)
Baseado em: HP% alvo + raridade + item
Sempre consome 1 item
```

### Regra Importante
```
CAPTURA: Qualquer classe
BATALHA: Apenas mesma classe do jogador
→ Incentiva trocas entre jogadores
```

## 💻 Exemplos de Código

### Estrutura do Estado
```javascript
state = {
  data: {
    players: [],      // Lista de jogadores
    instances: [],    // Monstrinhos capturados
    sessions: [],     // Sessões de jogo
  }
}
```

### Salvar Estado
```javascript
// Salvar no localStorage
localStorage.setItem('mm_mvp_v1', JSON.stringify(state))

// Carregar do localStorage
state = JSON.parse(localStorage.getItem('mm_mvp_v1'))
```

### Criar Monstrinho
```javascript
const mi = createInstance({
  monsterId: 'm_luma',
  ownerId: 'player_123',
  level: 5
})
```

## 🔧 Troubleshooting Rápido

### Problema: Jogo não abre
```bash
# 1. Verificar console do navegador (F12)
# 2. Limpar localStorage:
localStorage.clear()
location.reload()
```

### Problema: Testes falham
```bash
npm clean
npm install
npm test
```

### Problema: Git erro
```bash
git status
git pull origin main
# Resolver conflitos
git push
```

## 📊 Estatísticas Rápidas

```bash
# Linhas de código
find . -name '*.js' -not -path '*/node_modules/*' | xargs wc -l

# Commits
git rev-list --count HEAD

# Tamanho index.html
ls -lh index.html
```

## 🎯 Workflows Comuns

### Adicionar Feature
```bash
1. git checkout -b feature/nome
2. # Fazer mudanças
3. npm test
4. git add .
5. git commit -m "✨ feature: descrição"
6. git push origin feature/nome
```

### Corrigir Bug
```bash
1. git checkout -b fix/bug
2. # Corrigir código
3. npm test
4. git add .
5. git commit -m "🐛 fix: descrição"
6. git push origin fix/bug
```

### Atualizar Docs
```bash
1. # Editar documentação
2. git add .
3. git commit -m "📝 docs: atualização"
4. git push
```

## 🌟 Dicas Especiais

### Para ChatGPT/Claude
1. Sempre mencione "projeto Monstrinhomon"
2. Referencie AI_SUMMARY.md
3. Seja específico no que precisa
4. Peça explicação linha por linha
5. Teste o código gerado

### Para GitHub Copilot
1. Use comentários descritivos
2. Copilot lê AGENTS.md automaticamente
3. Escreva função signature primeiro
4. Deixe Copilot completar

### Para Replit AI
1. Use o arquivo .replit incluído
2. Replit AI entende o contexto
3. Peça ajuda com "Explain" ou "Generate"

## 📞 Links Úteis

### Documentação
- AI_SUMMARY.md - Resumo completo
- AI_COMMANDS.md - Todos os comandos
- GAME_RULES.md - Regras oficiais

### Ferramentas
- GitHub: https://github.com/projetogg/monstrinhomon.html
- Vitest: https://vitest.dev
- MDN Web Docs: https://developer.mozilla.org

## 🎨 Convenções de Commit

```
✨ feature: Nova funcionalidade
🐛 fix: Correção de bug
📝 docs: Documentação
♻️ refactor: Refatoração
✅ test: Testes
⚡ perf: Performance
💄 style: Estilo/UI
🔧 chore: Manutenção
```

## ⚡ Atalhos de Teclado

### No Navegador
```
F12 - Console do desenvolvedor
Ctrl+Shift+I - DevTools
Ctrl+R - Reload
Ctrl+Shift+R - Hard reload
```

### No VS Code
```
Ctrl+P - Quick open
Ctrl+Shift+F - Find in files
Ctrl+` - Terminal
F5 - Debug
```

## 🔍 Debug Console

```javascript
// Acessar estado
console.log(state)

// Ver jogadores
console.table(state.data.players)

// Limpar localStorage
localStorage.clear()

// Salvar estado
save()

// Re-render
render()
```

## 📦 Estrutura de Pastas

```
monstrinhomon.html/
├── index.html          # ⭐ Jogo principal
├── css/               # Estilos
├── js/                # JavaScript
├── data/              # Dados CSV
├── tests/             # Testes
├── AI_SUMMARY.md      # ⭐ Para IA
├── AI_COMMANDS.md     # Comandos IA
├── QUICK_REFERENCE.md # Este arquivo
├── commands.sh        # Menu CLI
└── .replit           # Config Replit
```

## 🚨 Lembrete Importante

**Sempre**:
- ✅ Testar no navegador após mudanças
- ✅ Verificar console (F12) para erros
- ✅ Fazer commits pequenos e frequentes
- ✅ Atualizar documentação junto

**Nunca**:
- ❌ Commitar node_modules
- ❌ Fazer mudanças sem testar
- ❌ Renomear IDs de dados existentes
- ❌ Quebrar fluxo existente

---

**Arquivo**: QUICK_REFERENCE.md  
**Versão**: 1.0.0  
**Última Atualização**: 2026-02-01

**⚡ Use este arquivo para copiar e colar comandos rapidamente!**
