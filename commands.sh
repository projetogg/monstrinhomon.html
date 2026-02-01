#!/bin/bash

# 🎮 Monstrinhomon - Script de Comandos
# Este script contém todos os comandos úteis para desenvolvimento

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir menu
show_menu() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   🎮 Monstrinhomon - Comandos CLI    ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}Setup & Instalação:${NC}"
    echo "  1) Instalar dependências"
    echo "  2) Verificar instalação"
    echo ""
    echo -e "${GREEN}Desenvolvimento:${NC}"
    echo "  3) Abrir jogo no navegador"
    echo "  4) Iniciar servidor local (porta 8000)"
    echo "  5) Abrir VS Code"
    echo ""
    echo -e "${GREEN}Testes:${NC}"
    echo "  6) Executar todos os testes"
    echo "  7) Executar testes em modo watch"
    echo "  8) Gerar relatório de cobertura"
    echo ""
    echo -e "${GREEN}Git:${NC}"
    echo "  9) Status do repositório"
    echo " 10) Fazer commit rápido"
    echo " 11) Push para GitHub"
    echo " 12) Pull do GitHub"
    echo ""
    echo -e "${GREEN}Manutenção:${NC}"
    echo " 13) Backup do projeto"
    echo " 14) Limpar projeto (node_modules, cache)"
    echo " 15) Validar código"
    echo " 16) Ver estatísticas do projeto"
    echo ""
    echo -e "${GREEN}Utilidades:${NC}"
    echo " 17) Abrir documentação"
    echo " 18) Listar estrutura do projeto"
    echo " 19) Buscar no código"
    echo ""
    echo " 0) Sair"
    echo ""
    echo -n "Escolha uma opção: "
}

# 1. Instalar dependências
install_deps() {
    echo -e "${BLUE}📦 Instalando dependências...${NC}"
    npm install
    echo -e "${GREEN}✅ Dependências instaladas!${NC}"
    read -p "Pressione Enter para continuar..."
}

# 2. Verificar instalação
check_install() {
    echo -e "${BLUE}🔍 Verificando instalação...${NC}"
    echo ""
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}✅ node_modules encontrado${NC}"
    else
        echo -e "${RED}❌ node_modules não encontrado${NC}"
    fi
    
    if [ -f "package.json" ]; then
        echo -e "${GREEN}✅ package.json encontrado${NC}"
    else
        echo -e "${RED}❌ package.json não encontrado${NC}"
    fi
    
    if [ -f "index.html" ]; then
        echo -e "${GREEN}✅ index.html encontrado${NC}"
    else
        echo -e "${RED}❌ index.html não encontrado${NC}"
    fi
    
    echo ""
    npm list --depth=0
    
    read -p "Pressione Enter para continuar..."
}

# 3. Abrir jogo no navegador
open_game() {
    echo -e "${BLUE}🌐 Abrindo jogo no navegador...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open index.html
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        start index.html
    else
        echo -e "${YELLOW}⚠️  Sistema não detectado. Abra index.html manualmente.${NC}"
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 4. Iniciar servidor local
start_server() {
    echo -e "${BLUE}🚀 Iniciando servidor local na porta 8000...${NC}"
    echo -e "${GREEN}Acesse: http://localhost:8000${NC}"
    echo -e "${YELLOW}Pressione Ctrl+C para parar o servidor${NC}"
    echo ""
    
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        python -m SimpleHTTPServer 8000
    else
        echo -e "${RED}❌ Python não encontrado. Instale Python 3.${NC}"
        read -p "Pressione Enter para continuar..."
    fi
}

# 5. Abrir VS Code
open_vscode() {
    echo -e "${BLUE}💻 Abrindo VS Code...${NC}"
    
    if command -v code &> /dev/null; then
        code .
        echo -e "${GREEN}✅ VS Code aberto!${NC}"
    else
        echo -e "${RED}❌ VS Code não encontrado. Instale o VS Code.${NC}"
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 6. Executar testes
run_tests() {
    echo -e "${BLUE}🧪 Executando testes...${NC}"
    npm test
    read -p "Pressione Enter para continuar..."
}

# 7. Testes em modo watch
run_tests_watch() {
    echo -e "${BLUE}👀 Executando testes em modo watch...${NC}"
    echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
    npm run test:watch
}

# 8. Gerar cobertura
run_coverage() {
    echo -e "${BLUE}📊 Gerando relatório de cobertura...${NC}"
    npm run test:coverage
    
    echo -e "${GREEN}✅ Relatório gerado em coverage/index.html${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        open coverage/index.html
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open coverage/index.html
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 9. Git status
git_status() {
    echo -e "${BLUE}📊 Status do Git:${NC}"
    echo ""
    git status
    echo ""
    read -p "Pressione Enter para continuar..."
}

# 10. Commit rápido
git_commit() {
    echo -e "${BLUE}💾 Fazer commit${NC}"
    echo ""
    
    git status
    echo ""
    
    read -p "Adicionar todos os arquivos? (s/n): " add_all
    if [[ $add_all == "s" ]]; then
        git add .
        echo -e "${GREEN}✅ Arquivos adicionados${NC}"
    fi
    
    echo ""
    read -p "Mensagem do commit: " commit_msg
    
    if [ -z "$commit_msg" ]; then
        echo -e "${RED}❌ Mensagem vazia. Commit cancelado.${NC}"
    else
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Commit realizado!${NC}"
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 11. Git push
git_push() {
    echo -e "${BLUE}⬆️  Push para GitHub${NC}"
    echo ""
    
    git push
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Push realizado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao fazer push${NC}"
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 12. Git pull
git_pull() {
    echo -e "${BLUE}⬇️  Pull do GitHub${NC}"
    echo ""
    
    git pull
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Pull realizado com sucesso!${NC}"
    else
        echo -e "${RED}❌ Erro ao fazer pull${NC}"
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 13. Backup
backup_project() {
    echo -e "${BLUE}💾 Criando backup do projeto...${NC}"
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="backups"
    BACKUP_FILE="monstrinhomon_backup_$DATE.tar.gz"
    
    mkdir -p $BACKUP_DIR
    
    tar -czf $BACKUP_DIR/$BACKUP_FILE \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='coverage' \
        --exclude='backups' \
        .
    
    echo -e "${GREEN}✅ Backup criado: $BACKUP_DIR/$BACKUP_FILE${NC}"
    
    read -p "Pressione Enter para continuar..."
}

# 14. Limpar projeto
clean_project() {
    echo -e "${YELLOW}⚠️  Isso vai remover node_modules e arquivos temporários${NC}"
    read -p "Continuar? (s/n): " confirm
    
    if [[ $confirm == "s" ]]; then
        echo -e "${BLUE}🧹 Limpando projeto...${NC}"
        
        rm -rf node_modules
        rm -rf coverage
        rm -rf .nyc_output
        rm -f npm-debug.log*
        
        echo -e "${GREEN}✅ Projeto limpo!${NC}"
        echo -e "${YELLOW}Execute 'npm install' para reinstalar dependências${NC}"
    else
        echo -e "${YELLOW}Operação cancelada${NC}"
    fi
    
    read -p "Pressione Enter para continuar..."
}

# 15. Validar código
validate_code() {
    echo -e "${BLUE}🔍 Validando código...${NC}"
    echo ""
    
    # Verificar arquivos principais
    if [ ! -f "index.html" ]; then
        echo -e "${RED}❌ index.html não encontrado${NC}"
    else
        echo -e "${GREEN}✅ index.html encontrado${NC}"
    fi
    
    if [ ! -d "js" ]; then
        echo -e "${RED}❌ Diretório js/ não encontrado${NC}"
    else
        echo -e "${GREEN}✅ Diretório js/ encontrado${NC}"
    fi
    
    if [ ! -d "css" ]; then
        echo -e "${RED}❌ Diretório css/ não encontrado${NC}"
    else
        echo -e "${GREEN}✅ Diretório css/ encontrado${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}Executando testes...${NC}"
    npm test
    
    read -p "Pressione Enter para continuar..."
}

# 16. Estatísticas
show_stats() {
    echo -e "${BLUE}📊 Estatísticas do Projeto${NC}"
    echo ""
    
    echo -e "${YELLOW}Linhas de código JavaScript:${NC}"
    find . -name '*.js' -not -path '*/node_modules/*' -not -path '*/coverage/*' | xargs wc -l | tail -1
    
    echo -e "${YELLOW}Linhas de código HTML:${NC}"
    find . -name '*.html' -not -path '*/node_modules/*' -not -path '*/coverage/*' | xargs wc -l | tail -1
    
    echo -e "${YELLOW}Linhas de código CSS:${NC}"
    find . -name '*.css' -not -path '*/node_modules/*' -not -path '*/coverage/*' | xargs wc -l | tail -1
    
    echo ""
    echo -e "${YELLOW}Tamanho do index.html:${NC}"
    ls -lh index.html | awk '{print $5}'
    
    echo ""
    echo -e "${YELLOW}Número de commits:${NC}"
    git rev-list --count HEAD 2>/dev/null || echo "N/A"
    
    echo ""
    read -p "Pressione Enter para continuar..."
}

# 17. Abrir documentação
open_docs() {
    echo -e "${BLUE}📚 Documentação Disponível:${NC}"
    echo ""
    echo "1. AI_SUMMARY.md - Resumo para IA"
    echo "2. AI_COMMANDS.md - Comandos e prompts"
    echo "3. GAME_RULES.md - Regras do jogo"
    echo "4. README.md - Documentação geral"
    echo "5. LEIA-ME.md - Guia de desenvolvimento"
    echo ""
    read -p "Qual documento abrir? (1-5): " doc_choice
    
    case $doc_choice in
        1) cat AI_SUMMARY.md | less ;;
        2) cat AI_COMMANDS.md | less ;;
        3) cat GAME_RULES.md | less ;;
        4) cat README.md | less ;;
        5) cat LEIA-ME.md | less ;;
        *) echo -e "${RED}Opção inválida${NC}" ;;
    esac
}

# 18. Listar estrutura
list_structure() {
    echo -e "${BLUE}📁 Estrutura do Projeto:${NC}"
    echo ""
    
    if command -v tree &> /dev/null; then
        tree -L 2 -I 'node_modules|coverage|.git'
    else
        find . -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/coverage/*'
    fi
    
    echo ""
    read -p "Pressione Enter para continuar..."
}

# 19. Buscar no código
search_code() {
    echo -e "${BLUE}🔍 Buscar no Código${NC}"
    echo ""
    read -p "Termo de busca: " search_term
    
    if [ -z "$search_term" ]; then
        echo -e "${RED}Termo vazio${NC}"
    else
        echo ""
        grep -r "$search_term" . --exclude-dir={node_modules,coverage,.git} --color=auto
    fi
    
    echo ""
    read -p "Pressione Enter para continuar..."
}

# Loop principal
while true; do
    show_menu
    read choice
    
    case $choice in
        1) install_deps ;;
        2) check_install ;;
        3) open_game ;;
        4) start_server ;;
        5) open_vscode ;;
        6) run_tests ;;
        7) run_tests_watch ;;
        8) run_coverage ;;
        9) git_status ;;
        10) git_commit ;;
        11) git_push ;;
        12) git_pull ;;
        13) backup_project ;;
        14) clean_project ;;
        15) validate_code ;;
        16) show_stats ;;
        17) open_docs ;;
        18) list_structure ;;
        19) search_code ;;
        0) 
            echo -e "${GREEN}👋 Até logo!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opção inválida!${NC}"
            sleep 1
            ;;
    esac
done
