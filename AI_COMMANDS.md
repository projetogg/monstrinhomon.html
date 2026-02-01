# 🤖 AI Commands Reference

> Guia de comandos e prompts para usar com ferramentas de IA (ChatGPT, Claude, Copilot, Replit AI, etc)

## 🎯 Como Usar Este Arquivo

Este arquivo contém:
1. **Comandos CLI** prontos para copiar e executar
2. **Prompts de IA** otimizados para diferentes tarefas
3. **Scripts úteis** para desenvolvimento
4. **Instruções passo-a-passo** para tarefas comuns

## 📋 Índice Rápido

- [Setup Inicial](#setup-inicial)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Deploy](#deploy)
- [Prompts para IA](#prompts-para-ia)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Setup Inicial

### Clonar Repositório
```bash
# HTTPS
git clone https://github.com/projetogg/monstrinhomon.html.git
cd monstrinhomon.html

# SSH
git clone git@github.com:projetogg/monstrinhomon.html.git
cd monstrinhomon.html
```

### Instalar Dependências
```bash
# Instalar NPM packages
npm install

# Verificar instalação
npm list --depth=0
```

### Verificar Estrutura
```bash
# Listar estrutura do projeto
tree -L 2 -I 'node_modules'

# Ou sem tree:
find . -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*'
```

---

## 💻 Desenvolvimento

### Abrir o Jogo

#### Opção 1: Direto no Navegador
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows (Git Bash)
start index.html

# Windows (PowerShell)
Invoke-Item index.html
```

#### Opção 2: Servidor Local (Recomendado)
```bash
# Python 3
python3 -m http.server 8000
# Acessar: http://localhost:8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (se instalado globalmente)
npx http-server -p 8000

# Live Server (se instalado)
npx live-server
```

#### Opção 3: VS Code Live Server
```
1. Instalar extensão "Live Server" no VS Code
2. Clicar com botão direito em index.html
3. Selecionar "Open with Live Server"
```

### Visualizar Logs
```bash
# Seguir logs do jogo (no console do navegador)
# Pressionar F12 no navegador
# Ir para aba Console
```

### Editar Código
```bash
# VS Code
code .

# Sublime Text
subl .

# Vim
vim index.html

# Nano
nano index.html
```

---

## 🧪 Testes

### Executar Testes
```bash
# Rodar todos os testes uma vez
npm test

# Rodar testes em modo watch (auto-reload)
npm run test:watch

# Rodar testes com cobertura
npm run test:coverage

# Rodar teste específico
npm test -- test/specific-test.test.js
```

### Verificar Cobertura
```bash
# Gerar relatório de cobertura HTML
npm run test:coverage

# Abrir relatório
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

---

## 🌐 Deploy

### Deploy no GitHub Pages
```bash
# 1. Fazer push do código
git add .
git commit -m "🚀 Preparar para deploy"
git push origin main

# 2. GitHub Pages (manual):
# - Ir em Settings > Pages
# - Source: main branch
# - Folder: / (root)
# - Save
```

### Deploy no Replit
```bash
# 1. Importar repositório no Replit
# 2. Configurar .replit (já incluído)
# 3. Clicar em Run
```

### Deploy Local para Testes
```bash
# Criar build (se necessário no futuro)
# Por enquanto, o jogo funciona diretamente com index.html
```

---

## 🤖 Prompts para IA

### 1. Entender o Projeto

**Prompt Inicial:**
```
Analise o arquivo AI_SUMMARY.md do projeto Monstrinhomon.
Resuma em tópicos:
1. O que é o projeto
2. Tecnologias usadas
3. Estrutura de arquivos
4. Regras principais do jogo
5. Como executar localmente
```

### 2. Implementar Nova Feature

**Template de Prompt:**
```
Contexto: Projeto Monstrinhomon (jogo terapêutico em HTML/JS)

Objetivo: Implementar [NOME DA FEATURE]

Requisitos:
- Seguir regras em GAME_RULES.md
- Usar vanilla JavaScript (sem frameworks)
- Manter compatibilidade com localStorage
- Código em PT-BR para comentários
- Estilo consistente com código existente

Detalhes da feature:
[DESCREVER FEATURE]

Por favor, forneça:
1. Código JavaScript completo
2. HTML necessário
3. CSS se aplicável
4. Explicação do código
```

**Exemplo Prático:**
```
Contexto: Projeto Monstrinhomon

Objetivo: Adicionar botão para usar poção de cura em batalha

Requisitos:
- Item "Poção de Cura" já existe em ITENS.csv
- Deve curar 25% do HP máximo
- Só pode usar se jogador tiver o item
- Consome 1 unidade do item
- Mostrar feedback visual

Por favor, forneça o código completo.
```

### 3. Debugar Erro

**Template de Prompt:**
```
Estou com um erro no projeto Monstrinhomon.

Erro:
```
[COPIAR ERRO DO CONSOLE]
```

Contexto:
- O que estava fazendo: [DESCREVER]
- Código relacionado: [COLAR TRECHO]
- Navegador: [CHROME/FIREFOX/SAFARI]

Como resolver?
```

### 4. Refatorar Código

**Prompt:**
```
No projeto Monstrinhomon, tenho esta função:

[COLAR FUNÇÃO]

Pode refatorá-la para:
1. Melhorar legibilidade
2. Seguir boas práticas
3. Adicionar validação de erros
4. Manter compatibilidade com código existente
5. Comentários em PT-BR
```

### 5. Adicionar Validação

**Prompt:**
```
Preciso adicionar validação na função [NOME] do Monstrinhomon.

Código atual:
[COLAR CÓDIGO]

Validações necessárias:
1. [VALIDAÇÃO 1]
2. [VALIDAÇÃO 2]
3. [VALIDAÇÃO 3]

Retornar código com validações + mensagens de erro em PT-BR.
```

### 6. Criar Teste

**Prompt:**
```
Criar testes para a função [NOME] do Monstrinhomon usando Vitest.

Código da função:
[COLAR FUNÇÃO]

Casos de teste necessários:
1. [CASO 1]
2. [CASO 2]
3. [CASO 3]
4. Edge cases

Fornecer código de teste completo.
```

### 7. Otimizar Performance

**Prompt:**
```
Esta função do Monstrinhomon está lenta:

[COLAR CÓDIGO]

Como otimizar mantendo:
- Funcionalidade idêntica
- Compatibilidade com localStorage
- Legibilidade do código
```

### 8. Adicionar Feature CSS

**Prompt:**
```
Criar estilo CSS para [COMPONENTE] no Monstrinhomon.

Requisitos:
- Seguir paleta de cores do jogo
- Responsivo para iPad
- Botões mínimo 44x44px (touch-friendly)
- Usar gradientes coloridos
- Emoji icons

Componente:
[DESCREVER]
```

---

## 🔧 Scripts Úteis

### Backup do Projeto
```bash
#!/bin/bash
# backup.sh - Criar backup do projeto

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
BACKUP_FILE="monstrinhomon_backup_$DATE.tar.gz"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/$BACKUP_FILE \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='coverage' \
  .

echo "✅ Backup criado: $BACKUP_DIR/$BACKUP_FILE"
```

### Validar Código
```bash
#!/bin/bash
# validate.sh - Validar código antes de commit

echo "🔍 Validando código..."

# Verificar se index.html existe
if [ ! -f "index.html" ]; then
    echo "❌ Erro: index.html não encontrado"
    exit 1
fi

# Verificar sintaxe JS (se JSHint instalado)
if command -v jshint &> /dev/null; then
    jshint js/**/*.js
fi

# Rodar testes
npm test

echo "✅ Validação completa!"
```

### Limpar Projeto
```bash
#!/bin/bash
# clean.sh - Limpar arquivos temporários

echo "🧹 Limpando projeto..."

rm -rf node_modules
rm -rf coverage
rm -rf .nyc_output
rm -f npm-debug.log*

echo "✅ Projeto limpo!"
echo "Execute 'npm install' para reinstalar dependências"
```

### Iniciar Desenvolvimento
```bash
#!/bin/bash
# dev.sh - Iniciar ambiente de desenvolvimento

echo "🚀 Iniciando ambiente de desenvolvimento..."

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# Abrir VS Code
code .

# Iniciar servidor local
echo "🌐 Iniciando servidor em http://localhost:8000"
python3 -m http.server 8000
```

---

## 🐛 Troubleshooting

### Problema: Jogo não abre

**Solução 1: Verificar Console**
```
1. Abrir index.html no navegador
2. Pressionar F12
3. Ir para aba Console
4. Copiar erros e usar prompt de debug (seção Prompts para IA)
```

**Solução 2: Limpar Cache**
```javascript
// No console do navegador:
localStorage.clear()
location.reload()
```

**Solução 3: Verificar Arquivos**
```bash
# Verificar se todos arquivos existem
ls -la index.html
ls -la css/main.css
ls -la js/storage.js
```

### Problema: Testes Falhando

**Diagnóstico:**
```bash
# Ver detalhes do erro
npm test -- --reporter=verbose

# Rodar teste específico
npm test -- path/to/test.test.js
```

**Solução:**
```bash
# Reinstalar dependências
rm -rf node_modules
npm install

# Limpar cache
npm cache clean --force
```

### Problema: localStorage não funciona

**Verificação:**
```javascript
// No console do navegador:
typeof(Storage)  // Deve retornar "function"

// Testar salvar
localStorage.setItem('test', 'value')
localStorage.getItem('test')  // Deve retornar "value"
```

**Solução:**
```
1. Verificar se navegador suporta localStorage
2. Verificar se não está em modo privado/anônimo
3. Limpar localStorage: localStorage.clear()
```

### Problema: Git Push Falha

**Verificar Status:**
```bash
git status
git remote -v
```

**Solução:**
```bash
# Verificar credenciais
git config --list | grep user

# Forçar push (cuidado!)
git push --force-with-lease origin main

# Ou pull primeiro
git pull origin main
git push origin main
```

---

## 📚 Comandos Git Avançados

### Commits Semânticos
```bash
# Nova feature
git commit -m "✨ adicionar sistema de itens em batalha"

# Bugfix
git commit -m "🐛 corrigir cálculo de dano em CRIT 20"

# Documentação
git commit -m "📝 atualizar GAME_RULES.md com novas regras"

# Refatoração
git commit -m "♻️ refatorar função de captura"

# Testes
git commit -m "✅ adicionar testes para sistema de XP"

# Performance
git commit -m "⚡ otimizar renderização de monstrinhos"

# Style
git commit -m "💄 melhorar UI de batalha"
```

### Branches
```bash
# Criar nova branch para feature
git checkout -b feature/nome-da-feature

# Listar branches
git branch -a

# Mudar de branch
git checkout main

# Merge branch
git checkout main
git merge feature/nome-da-feature

# Deletar branch
git branch -d feature/nome-da-feature
```

### Desfazer Mudanças
```bash
# Desfazer último commit (manter mudanças)
git reset --soft HEAD~1

# Desfazer último commit (descartar mudanças)
git reset --hard HEAD~1

# Desfazer mudanças em arquivo específico
git checkout -- arquivo.js

# Desfazer mudanças staged
git reset HEAD arquivo.js
```

---

## 🎯 Workflows Comuns

### Workflow 1: Adicionar Nova Feature

```bash
# 1. Criar branch
git checkout -b feature/nova-feature

# 2. Fazer mudanças no código
# (editar arquivos)

# 3. Testar
npm test

# 4. Verificar mudanças
git status
git diff

# 5. Commit
git add .
git commit -m "✨ adicionar nova feature"

# 6. Push
git push origin feature/nova-feature

# 7. Criar Pull Request no GitHub
```

### Workflow 2: Corrigir Bug

```bash
# 1. Criar branch
git checkout -b fix/nome-do-bug

# 2. Reproduzir bug
# 3. Corrigir código
# 4. Testar correção

npm test

# 5. Commit
git add .
git commit -m "🐛 corrigir [descrição do bug]"

# 6. Push
git push origin fix/nome-do-bug
```

### Workflow 3: Atualizar Documentação

```bash
# 1. Editar documentação
# (AI_SUMMARY.md, GAME_RULES.md, etc)

# 2. Commit
git add .
git commit -m "📝 atualizar documentação"

# 3. Push
git push origin main
```

---

## 🔍 Comandos de Inspeção

### Verificar Estado do Jogo
```javascript
// No console do navegador (F12):

// Ver estado completo
console.log(state)

// Ver jogadores
console.log(state.data.players)

// Ver monstrinhos
console.log(state.data.instances)

// Ver sessão ativa
console.log(state.data.sessions.find(s => s.id === state.data.activeSessionId))
```

### Debugging Avançado
```javascript
// Habilitar logs detalhados (adicionar no início do JS)
window.DEBUG = true;

// Criar breakpoint programático
debugger;

// Log formatado
console.table(state.data.players)
console.group('Combate')
console.log('Atacante:', attacker)
console.log('Defensor:', defender)
console.groupEnd()
```

---

## 📊 Estatísticas e Métricas

### Contar Linhas de Código
```bash
# Total de linhas
find . -name '*.js' -o -name '*.html' -o -name '*.css' | xargs wc -l

# Apenas JavaScript
find . -name '*.js' | xargs wc -l

# Excluindo node_modules
find . -name '*.js' -not -path '*/node_modules/*' | xargs wc -l
```

### Ver Tamanho de Arquivos
```bash
# Tamanho do index.html
ls -lh index.html

# Top 10 maiores arquivos
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -exec ls -lh {} \; | sort -k5 -hr | head -10
```

---

## 💡 Dicas Finais

### Para IA (ChatGPT/Claude/Copilot)

1. **Sempre forneça contexto**: Mencione que é o projeto Monstrinhomon
2. **Referencie AI_SUMMARY.md**: "Seguindo as regras em AI_SUMMARY.md..."
3. **Seja específico**: Quanto mais detalhes, melhor o resultado
4. **Peça explicação**: "Explique o código linha por linha"
5. **Valide sempre**: Teste o código gerado antes de commitar

### Para Desenvolvimento

1. **Teste no navegador**: Sempre abra index.html após mudanças
2. **Use console**: F12 é seu melhor amigo
3. **Commits pequenos**: Melhor fazer vários commits pequenos
4. **Documente**: Atualize documentação junto com código
5. **Backup regular**: Use script de backup antes de mudanças grandes

### Para Colaboração

1. **Pull Requests**: Sempre use PRs para features
2. **Code Review**: Peça para IA revisar seu código
3. **Issues**: Documente bugs e features no GitHub Issues
4. **Comunicação**: Use comentários claros no código

---

**Arquivo**: AI_COMMANDS.md  
**Versão**: 1.0.0  
**Última Atualização**: 2026-02-01

**💡 Dica**: Marque este arquivo como favorito para acesso rápido!
