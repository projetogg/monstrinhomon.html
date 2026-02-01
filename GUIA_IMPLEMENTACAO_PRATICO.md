# 🛠️ Guia Prático de Implementação - Melhorias Monstrinhomon

**Data:** 2026-01-29  
**Objetivo:** Passo-a-passo prático para implementar as melhorias recomendadas

---

## 📋 Checklist de Implementação

### Fase 1: Setup e Organização (Semana 1)

#### ✅ Dia 1: Configurar Build System
```bash
# 1. Instalar Node.js (se ainda não tiver)
# Download de https://nodejs.org

# 2. Inicializar projeto
cd /caminho/para/monstrinhomon
npm init -y

# 3. Instalar Vite
npm install --save-dev vite

# 4. Criar script de build no package.json
```

**Editar `package.json`:**
```json
{
  "name": "monstrinhomon",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

**Testar:**
```bash
npm run dev
# Abrir http://localhost:5173
```

---

#### ✅ Dia 2: Extrair CSS

**1. Criar estrutura de pastas:**
```bash
mkdir -p css
```

**2. Criar `css/main.css`:**
- Copiar todo conteúdo da tag `<style>` de `index.html`
- Colar em `css/main.css`

**3. Editar `index.html`:**
```html
<!-- Remover tag <style>...</style> -->

<!-- Adicionar no <head>: -->
<link rel="stylesheet" href="/css/main.css">
```

**4. Testar:**
```bash
npm run dev
# Verificar se estilos continuam funcionando
```

---

#### ✅ Dia 3: Criar .gitignore

**Criar `.gitignore`:**
```
# Dependencies
node_modules/

# Build outputs
dist/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Environment
.env
.env.local
```

**Commitar:**
```bash
git add .gitignore package.json package-lock.json css/
git commit -m "🔧 Setup: Vite build system + CSS extraction"
```

---

#### ✅ Dia 4: Migrar Dados para JSON

**1. Criar pasta data:**
```bash
mkdir -p data
```

**2. Criar `data/monsters.json`:**
```json
[
  {
    "id": "m_pedrino",
    "name": "Pedrino",
    "class": "Guerreiro",
    "rarity": "Comum",
    "baseHp": 25,
    "baseAtk": 8,
    "baseDef": 6,
    "baseSPD": 5,
    "growth": {
      "hp": 1.04,
      "atk": 0.8,
      "def": 0.6,
      "spd": 0.4
    },
    "emoji": "🪨"
  }
]
```

**3. Criar `js/data/loader.js`:**
```javascript
export async function loadGameData() {
    const [monsters, skills, items] = await Promise.all([
        fetch('/data/monsters.json').then(r => r.json()),
        fetch('/data/skills.json').then(r => r.json()),
        fetch('/data/items.json').then(r => r.json())
    ]);
    
    return { monsters, skills, items };
}
```

**4. Atualizar index.html:**
```javascript
import { loadGameData } from './js/data/loader.js';

// No init():
const gameData = await loadGameData();
window.MONSTER_CATALOG = gameData.monsters;
window.SKILL_DEFS = gameData.skills;
// ...
```

---

#### ✅ Dia 5: Configurar CI/CD

**Criar `.github/workflows/deploy.yml`:**
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Configurar GitHub Pages:**
1. Ir em Settings → Pages
2. Source: Deploy from a branch
3. Branch: `gh-pages` / `root`

---

### Fase 2: Modularização JavaScript (Semana 2-3)

#### ✅ Passo 1: Criar Estrutura de Módulos

```bash
mkdir -p js/{core,systems,ui,data}
```

**Estrutura final:**
```
js/
├── core/
│   ├── game-state.js      # Estado global
│   ├── storage.js         # Save/load
│   └── config.js          # Constantes
├── systems/
│   ├── battle.js          # Combate
│   ├── capture.js         # Captura
│   ├── progression.js     # XP/level
│   └── skills.js          # Habilidades
├── ui/
│   ├── encounter.js       # UI de encontro
│   ├── players.js         # UI de jogadores
│   └── tabs.js            # Sistema de abas
├── data/
│   └── loader.js          # Carregamento de dados
└── main.js                # Entry point
```

---

#### ✅ Passo 2: Extrair game-state.js

**Criar `js/core/game-state.js`:**
```javascript
export const GameState = {
    players: [],
    monsters: [],
    sessions: [],
    encounters: [],
    activeSessionId: null,
    catalog: [],
    config: {}
};

export function getActiveSession() {
    return GameState.sessions.find(s => s.id === GameState.activeSessionId);
}

export function getPlayer(id) {
    return GameState.players.find(p => p.id === id);
}

export function getMonster(id) {
    return GameState.monsters.find(m => m.id === id);
}
```

---

#### ✅ Passo 3: Extrair battle.js

**Criar `js/systems/battle.js`:**
```javascript
import { GameState } from '../core/game-state.js';

export function checkHit(d20, attacker, defender) {
    const attackRoll = d20 + (attacker.atk || 0);
    const defense = defender.def || 0;
    return attackRoll >= defense;
}

export function calcDamage({ atk, def, power, damageMult = 1.0 }) {
    const ratio = atk / (atk + def);
    const baseDamage = Math.floor(power * ratio);
    return Math.max(1, Math.floor(baseDamage * damageMult));
}

export function applyDamage(target, amount) {
    target.hp = Math.max(0, target.hp - amount);
    return target.hp === 0;
}

export function getClassAdvantage(attackerClass, defenderClass) {
    const advantages = {
        Guerreiro: 'Ladino',
        Ladino: 'Mago',
        Mago: 'Bárbaro',
        Bárbaro: 'Caçador',
        Caçador: 'Bardo',
        Bardo: 'Curandeiro',
        Curandeiro: 'Guerreiro'
    };
    
    if (advantages[attackerClass] === defenderClass) {
        return 1.10; // +10% dano
    }
    if (advantages[defenderClass] === attackerClass) {
        return 0.90; // -10% dano
    }
    return 1.0; // Neutro
}
```

---

#### ✅ Passo 4: Extrair progression.js

**Criar `js/systems/progression.js`:**
```javascript
import { GameState } from '../core/game-state.js';

export function calcXpNeeded(level) {
    return Math.round(40 + 6 * level + 0.6 * level * level);
}

export function giveXP(monster, amount, log = []) {
    monster.xp = (monster.xp || 0) + amount;
    log.push(`${monster.name} ganhou ${amount} XP!`);
    
    while (monster.xp >= calcXpNeeded(monster.level)) {
        levelUp(monster, log);
    }
}

export function levelUp(monster, log = []) {
    if (monster.level >= 100) return;
    
    monster.level++;
    monster.xp = 0;
    
    // Recalcular stats
    const growthRate = 1.04;
    monster.hpMax = Math.round(monster.hpMax * growthRate + 2);
    monster.hp = Math.round(monster.hp * growthRate + 2);
    monster.atk = Math.round(monster.atk * 1.03);
    monster.def = Math.round(monster.def * 1.03);
    
    log.push(`🎉 ${monster.name} subiu para nível ${monster.level}!`);
    
    // Verificar evolução
    checkEvolution(monster, log);
}

export function checkEvolution(monster, log = []) {
    const evolutionLevels = {
        S0: 16,  // S0 → S1
        S1: 32,  // S1 → S2
        S2: 50   // S2 → S3
    };
    
    const currentStage = monster.stage || 'S0';
    const evolveLevel = evolutionLevels[currentStage];
    
    if (monster.level >= evolveLevel) {
        evolve(monster, log);
    }
}

function evolve(monster, log = []) {
    const stageMap = { S0: 'S1', S1: 'S2', S2: 'S3' };
    const newStage = stageMap[monster.stage];
    
    if (!newStage) return;
    
    const oldName = monster.name;
    monster.stage = newStage;
    monster.name = `${oldName} ${newStage}`;
    
    // Boost stats
    monster.hpMax = Math.round(monster.hpMax * 1.15);
    monster.hp = monster.hpMax;
    monster.atk = Math.round(monster.atk * 1.15);
    monster.def = Math.round(monster.def * 1.15);
    
    log.push(`✨ ${oldName} evoluiu para ${monster.name}!`);
}
```

---

### Fase 3: Testes Automatizados (Semana 3)

#### ✅ Setup Vitest

```bash
npm install --save-dev vitest
```

**Atualizar `package.json`:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

---

#### ✅ Criar Primeiro Teste

**Criar `tests/systems/battle.test.js`:**
```javascript
import { describe, it, expect } from 'vitest';
import { calcDamage, checkHit, getClassAdvantage } from '../../js/systems/battle.js';

describe('Sistema de Batalha', () => {
    describe('Cálculo de Dano', () => {
        it('calcula dano corretamente com stats balanceados', () => {
            const damage = calcDamage({
                atk: 10,
                def: 10,
                power: 20,
                damageMult: 1.0
            });
            expect(damage).toBe(10); // 20 * (10/20) = 10
        });
        
        it('dano mínimo é sempre 1', () => {
            const damage = calcDamage({
                atk: 1,
                def: 100,
                power: 1,
                damageMult: 1.0
            });
            expect(damage).toBe(1);
        });
        
        it('aplica multiplicador de dano corretamente', () => {
            const damage = calcDamage({
                atk: 10,
                def: 10,
                power: 20,
                damageMult: 1.5
            });
            expect(damage).toBe(15); // 10 * 1.5
        });
    });
    
    describe('Verificação de Acerto', () => {
        it('acerta quando d20 + ATK >= DEF', () => {
            expect(checkHit(15, { atk: 5 }, { def: 18 })).toBe(true);
            expect(checkHit(15, { atk: 5 }, { def: 21 })).toBe(false);
        });
    });
    
    describe('Vantagens de Classe', () => {
        it('Guerreiro tem vantagem sobre Ladino', () => {
            expect(getClassAdvantage('Guerreiro', 'Ladino')).toBe(1.10);
        });
        
        it('Ladino tem desvantagem contra Guerreiro', () => {
            expect(getClassAdvantage('Ladino', 'Guerreiro')).toBe(0.90);
        });
        
        it('Mesma classe é neutro', () => {
            expect(getClassAdvantage('Mago', 'Mago')).toBe(1.0);
        });
    });
});
```

**Rodar testes:**
```bash
npm test
```

---

#### ✅ Teste de Progressão

**Criar `tests/systems/progression.test.js`:**
```javascript
import { describe, it, expect } from 'vitest';
import { calcXpNeeded, giveXP, levelUp } from '../../js/systems/progression.js';

describe('Sistema de Progressão', () => {
    it('calcula XP necessário por nível corretamente', () => {
        expect(calcXpNeeded(1)).toBe(46);    // 40 + 6 + 0.6
        expect(calcXpNeeded(5)).toBe(85);    // 40 + 30 + 15
        expect(calcXpNeeded(10)).toBe(160);  // 40 + 60 + 60
    });
    
    it('nível aumenta quando XP >= XP necessário', () => {
        const monster = {
            id: 'test',
            name: 'Test',
            level: 1,
            xp: 0,
            hp: 20,
            hpMax: 20,
            atk: 10,
            def: 8
        };
        
        const log = [];
        giveXP(monster, 100, log);
        
        expect(monster.level).toBeGreaterThan(1);
        expect(log.length).toBeGreaterThan(0);
    });
    
    it('level up aumenta stats', () => {
        const monster = {
            id: 'test',
            name: 'Test',
            level: 5,
            hp: 30,
            hpMax: 30,
            atk: 15,
            def: 12
        };
        
        const oldHp = monster.hpMax;
        const oldAtk = monster.atk;
        
        levelUp(monster, []);
        
        expect(monster.level).toBe(6);
        expect(monster.hpMax).toBeGreaterThan(oldHp);
        expect(monster.atk).toBeGreaterThan(oldAtk);
    });
});
```

---

### Fase 4: Ferramentas para Terapeutas (Semana 4)

#### ✅ Editor de Dados

**Criar `editor.html`:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Editor de Dados - Monstrinhomon</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
        }
        h1 { color: #667eea; margin-bottom: 30px; }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 2px solid #ddd;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            background: #f5f5f5;
            border: none;
            border-radius: 8px 8px 0 0;
        }
        .tab.active {
            background: #667eea;
            color: white;
        }
        .form-group {
            margin: 15px 0;
        }
        label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 16px;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px 5px;
        }
        button:hover { background: #5568d3; }
        .monster-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .monster-card {
            border: 2px solid #ddd;
            border-radius: 10px;
            padding: 15px;
            background: #f9f9f9;
        }
        .monster-card h3 {
            color: #667eea;
            margin-bottom: 10px;
        }
        .monster-card .emoji {
            font-size: 48px;
            text-align: center;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Editor de Dados - Monstrinhomon</h1>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('monsters')">Monstros</button>
            <button class="tab" onclick="showTab('skills')">Habilidades</button>
            <button class="tab" onclick="showTab('items')">Itens</button>
        </div>
        
        <!-- Aba de Monstros -->
        <div id="monsters-tab" class="tab-content">
            <h2>Adicionar Monstro</h2>
            <form id="monsterForm">
                <div class="form-group">
                    <label>ID:</label>
                    <input name="id" placeholder="m_nome" required>
                </div>
                <div class="form-group">
                    <label>Nome:</label>
                    <input name="name" placeholder="Nome do Monstro" required>
                </div>
                <div class="form-group">
                    <label>Classe:</label>
                    <select name="class" required>
                        <option>Guerreiro</option>
                        <option>Mago</option>
                        <option>Curandeiro</option>
                        <option>Bárbaro</option>
                        <option>Ladino</option>
                        <option>Bardo</option>
                        <option>Caçador</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Raridade:</label>
                    <select name="rarity" required>
                        <option>Comum</option>
                        <option>Incomum</option>
                        <option>Raro</option>
                        <option>Místico</option>
                        <option>Lendário</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>HP Base:</label>
                    <input name="baseHp" type="number" value="25" required>
                </div>
                <div class="form-group">
                    <label>ATK Base:</label>
                    <input name="baseAtk" type="number" value="8" required>
                </div>
                <div class="form-group">
                    <label>DEF Base:</label>
                    <input name="baseDef" type="number" value="6" required>
                </div>
                <div class="form-group">
                    <label>Emoji:</label>
                    <input name="emoji" placeholder="🪨" required>
                </div>
                <button type="submit">Adicionar Monstro</button>
            </form>
            
            <h2 style="margin-top: 40px;">Monstros Cadastrados</h2>
            <div id="monsterList" class="monster-list"></div>
            
            <button onclick="exportData()">📥 Exportar JSON</button>
            <button onclick="importData()">📤 Importar JSON</button>
        </div>
    </div>
    
    <script>
        let monsters = [];
        
        // Carregar dados existentes
        async function loadData() {
            try {
                const response = await fetch('/data/monsters.json');
                monsters = await response.json();
                renderMonsters();
            } catch (e) {
                console.log('Nenhum dado existente');
            }
        }
        
        // Adicionar monstro
        document.getElementById('monsterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const monster = Object.fromEntries(formData);
            
            // Converter números
            monster.baseHp = parseInt(monster.baseHp);
            monster.baseAtk = parseInt(monster.baseAtk);
            monster.baseDef = parseInt(monster.baseDef);
            
            monsters.push(monster);
            renderMonsters();
            e.target.reset();
        });
        
        // Renderizar lista
        function renderMonsters() {
            const list = document.getElementById('monsterList');
            list.innerHTML = monsters.map(m => `
                <div class="monster-card">
                    <h3>${m.name}</h3>
                    <div class="emoji">${m.emoji}</div>
                    <p><strong>Classe:</strong> ${m.class}</p>
                    <p><strong>Raridade:</strong> ${m.rarity}</p>
                    <p><strong>HP:</strong> ${m.baseHp} | <strong>ATK:</strong> ${m.baseAtk} | <strong>DEF:</strong> ${m.baseDef}</p>
                    <button onclick="deleteMonster('${m.id}')">🗑️ Remover</button>
                </div>
            `).join('');
        }
        
        // Exportar
        function exportData() {
            const json = JSON.stringify(monsters, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'monsters.json';
            a.click();
        }
        
        // Importar
        function importData() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                const text = await file.text();
                monsters = JSON.parse(text);
                renderMonsters();
            };
            input.click();
        }
        
        function deleteMonster(id) {
            if (confirm('Remover este monstro?')) {
                monsters = monsters.filter(m => m.id !== id);
                renderMonsters();
            }
        }
        
        // Tabs
        function showTab(tab) {
            // TODO: implementar outras abas
        }
        
        loadData();
    </script>
</body>
</html>
```

---

### Fase 5: PWA (Semana 5)

#### ✅ Adicionar Manifest

**Criar `manifest.json`:**
```json
{
  "name": "Monstrinhomon - Jogo Terapêutico",
  "short_name": "Monstrinhomon",
  "description": "RPG terapêutico para crianças com TEA e TDAH",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "orientation": "landscape",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**Adicionar no `<head>` do index.html:**
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#667eea">
<link rel="apple-touch-icon" href="/icon-192.png">
```

---

#### ✅ Service Worker Básico

**Criar `sw.js`:**
```javascript
const CACHE_NAME = 'monstrinhomon-v1';
const urlsToCache = [
  '/',
  '/css/main.css',
  '/js/main.js',
  '/data/monsters.json',
  '/data/skills.json',
  '/data/items.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Registrar no index.html:**
```html
<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW registrado'))
        .catch((err) => console.error('SW erro:', err));
}
</script>
```

---

## ✅ Checklist Final

### Semana 1: Setup
- [ ] Instalar Node.js e npm
- [ ] Configurar Vite
- [ ] Extrair CSS para arquivo separado
- [ ] Criar .gitignore
- [ ] Migrar dados hardcoded para JSON
- [ ] Configurar GitHub Actions (CI/CD)

### Semana 2-3: Modularização
- [ ] Criar estrutura de pastas (js/core, js/systems, js/ui)
- [ ] Extrair game-state.js
- [ ] Extrair battle.js
- [ ] Extrair progression.js
- [ ] Extrair capture.js
- [ ] Atualizar imports no index.html

### Semana 3: Testes
- [ ] Instalar Vitest
- [ ] Criar testes para battle.js
- [ ] Criar testes para progression.js
- [ ] Criar testes para capture.js
- [ ] Atingir 80%+ cobertura

### Semana 4: Ferramentas
- [ ] Criar editor.html (CRUD de dados)
- [ ] Criar relatorios.html (painel terapeuta)
- [ ] Testar em iPad real

### Semana 5: PWA
- [ ] Criar manifest.json
- [ ] Adicionar ícones (192x192, 512x512)
- [ ] Implementar service worker
- [ ] Testar instalação no iPad

---

## 🎯 Resultado Esperado

**Antes:**
```
projeto/
├── index.html (6.471 linhas)
└── dados hardcoded no código
```

**Depois:**
```
projeto/
├── index.html (< 200 linhas)
├── package.json
├── manifest.json
├── sw.js
├── css/
│   └── main.css
├── js/
│   ├── core/ (3 arquivos)
│   ├── systems/ (4 arquivos)
│   ├── ui/ (3 arquivos)
│   └── main.js
├── data/
│   ├── monsters.json
│   ├── skills.json
│   └── items.json
├── tests/
│   └── systems/ (3 arquivos de teste)
├── editor.html
└── relatorios.html
```

**Métricas:**
- ✅ Código organizado em 15+ módulos
- ✅ 80%+ cobertura de testes
- ✅ Build otimizado < 200KB
- ✅ PWA instalável no iPad
- ✅ Ferramentas para terapeutas

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor local
npm test                 # Rodar testes
npm run build            # Build para produção

# Git
git add .
git commit -m "feat: descrição"
git push

# Deploy manual (se CI/CD não estiver configurado)
npm run build
# Copiar conteúdo de /dist para branch gh-pages
```

---

## 🆘 Troubleshooting

### Problema: "Cannot find module"
**Solução:** Verificar imports e paths relativos

### Problema: Build falha
**Solução:** Limpar cache: `rm -rf node_modules && npm install`

### Problema: Styles não carregam
**Solução:** Verificar path do CSS no HTML

### Problema: Service Worker não funciona
**Solução:** Testar em produção (não funciona em localhost sem HTTPS)

---

**Pronto para começar! 🚀**

Qualquer dúvida, consultar a documentação oficial do [Vite](https://vitejs.dev) ou [Vitest](https://vitest.dev).
