# 🐉 Monstrinhomon - MVP Assistido

App web terapêutico para iPad, desenvolvido para uso em terapia infantil. Combina mecânicas de Pokémon com elementos de RPG.

## 🎮 Características

### Sistema de Jogo
- **Captura de Monstrinhos**: Sistema baseado em d20 com modificadores de nível, raridade e itens
- **Batalhas por Turno**: Combate d20 vs d20 com dano fortemente afetado pela diferença de nível
- **Tipos e Vantagens**: 6 tipos diferentes com sistema de vantagem/desvantagem
- **Boss Battles**: Batalhas especiais sem possibilidade de fuga
- **IA Inimiga**: Inimigos que usam itens estrategicamente

### Gerenciamento
- **Time**: Até 6 monstrinhos ativos
- **Box**: Armazenamento ilimitado
- **Itens**: Pokébolas e poções para uso estratégico
- **Trocas**: Sistema de troca entre jogadores via código

### Painel Terapêutico
- **Objetivos**: Lista editável de metas terapêuticas
- **Medalhas**: Sistema de conquistas
- **XP Completivo**: Progressão com níveis

## 🎯 Dados do Jogo

### Monstrinhos Disponíveis
- **Comuns**: Flamix (🔥), Aquarix (💧), Verdinho (🌿), Rochoso (🪨), Normalito (⭐)
- **Incomuns**: Trovix (⚡)
- **Raros**: Infernix (🌋), Oceanus (🌊), Florestus (🌳)
- **Épicos**: Raijin (⚡), Titanus (🗿)
- **Lendários**: Dragoon (🐉)

### Tipos
- Fogo (forte contra Planta / fraco contra Água e Pedra)
- Água (forte contra Fogo e Pedra / fraco contra Planta e Elétrico)
- Planta (forte contra Água e Pedra / fraco contra Fogo)
- Elétrico (forte contra Água / fraco contra Pedra)
- Pedra (forte contra Fogo e Elétrico / fraco contra Água e Planta)
- Normal (sem vantagens ou desvantagens)

## 💾 Tecnologias

- **HTML5**: Estrutura da aplicação
- **CSS3**: Design responsivo para iPad
- **JavaScript Puro**: Lógica do jogo (sem dependências)
- **localStorage**: Persistência de dados

## 🚀 Como Usar

1. Acesse via GitHub Pages ou servidor local
2. O jogo salva automaticamente o progresso
3. Use em iPad para melhor experiência (otimizado para touch)

## 📱 Compatibilidade

- ✅ iPad (Safari)
- ✅ Tablets Android
- ✅ Desktop (Chrome, Firefox, Safari, Edge)

## 🎨 Funcionalidades Terapêuticas

O painel terapêutico permite:
- Definir objetivos personalizados
- Marcar conclusão de metas
- Ganhar XP ao completar objetivos
- Colecionar medalhas por conquistas
- Acompanhar progresso visual

## 🔄 Sistema de Trocas

1. Selecione um monstrinho para trocar
2. Clique em "Exportar Selecionado" para gerar código
3. Compartilhe o código com outro jogador
4. O outro jogador cola o código e clica em "Importar"

## 🎲 Mecânicas de Batalha

### Ataque
- Atacante rola d20 + nível
- Defensor rola d20 + nível
- Se ataque > defesa, causa dano
- Dano base = ATK do atacante
- Modificador de nível: ±15% por diferença de nível
- Modificador de tipo: 150% (super efetivo) ou 75% (não efetivo)
- Variação aleatória: 80-100% do dano final

### Captura
- Jogador rola d20 + nível - (raridade × 5)
- Monstrinho rola d20 + nível
- Captura bem-sucedida se score do jogador > score do monstrinho

## 📄 Licença

Projeto educacional para fins terapêuticos.
