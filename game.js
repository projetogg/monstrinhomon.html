// Monstrinhomon - Game Logic
class MonstrinhonGame {
    constructor() {
        this.currentScreen = 'main-menu';
        this.player = {
            team: [],
            box: [],
            items: {
                pokebola: 5,
                superbola: 2,
                pocao: 3,
                superPocao: 1
            },
            therapeuticData: {
                objectives: [],
                medals: [],
                xp: 0,
                maxXp: 100
            }
        };
        this.battle = null;
        this.selectedMonster = null;
        this.init();
    }

    init() {
        this.loadGame();
        this.renderTherapeuticPanel();
        this.renderTeam();
        this.renderBox();
        
        // Dar um monstrinho inicial se o jogador não tiver nenhum
        if (this.player.team.length === 0 && this.player.box.length === 0) {
            this.giveStarterMonster();
        }
    }

    // Sistema de dados
    getMonsterData() {
        return {
            templates: [
                { id: 1, name: 'Flamix', type: 'fogo', icon: '🔥', baseHp: 45, baseAtk: 52, rarity: 'comum' },
                { id: 2, name: 'Aquarix', type: 'agua', icon: '💧', baseHp: 44, baseAtk: 48, rarity: 'comum' },
                { id: 3, name: 'Verdinho', type: 'planta', icon: '🌿', baseHp: 45, baseAtk: 49, rarity: 'comum' },
                { id: 4, name: 'Trovix', type: 'eletrico', icon: '⚡', baseHp: 35, baseAtk: 55, rarity: 'incomum' },
                { id: 5, name: 'Rochoso', type: 'pedra', icon: '🪨', baseHp: 50, baseAtk: 45, rarity: 'comum' },
                { id: 6, name: 'Normalito', type: 'normal', icon: '⭐', baseHp: 40, baseAtk: 45, rarity: 'comum' },
                { id: 7, name: 'Infernix', type: 'fogo', icon: '🌋', baseHp: 58, baseAtk: 64, rarity: 'raro' },
                { id: 8, name: 'Oceanus', type: 'agua', icon: '🌊', baseHp: 60, baseAtk: 62, rarity: 'raro' },
                { id: 9, name: 'Florestus', type: 'planta', icon: '🌳', baseHp: 65, baseAtk: 60, rarity: 'raro' },
                { id: 10, name: 'Raijin', type: 'eletrico', icon: '⚡', baseHp: 50, baseAtk: 70, rarity: 'epico' },
                { id: 11, name: 'Titanus', type: 'pedra', icon: '🗿', baseHp: 80, baseAtk: 70, rarity: 'epico' },
                { id: 12, name: 'Dragoon', type: 'normal', icon: '🐉', baseHp: 91, baseAtk: 90, rarity: 'lendario' }
            ]
        };
    }

    getTypeEffectiveness() {
        return {
            fogo: { strong: ['planta'], weak: ['agua', 'pedra'] },
            agua: { strong: ['fogo', 'pedra'], weak: ['planta', 'eletrico'] },
            planta: { strong: ['agua', 'pedra'], weak: ['fogo'] },
            eletrico: { strong: ['agua'], weak: ['pedra'] },
            pedra: { strong: ['fogo', 'eletrico'], weak: ['agua', 'planta'] },
            normal: { strong: [], weak: [] }
        };
    }

    getRarityModifier(rarity) {
        const modifiers = {
            comum: 1.0,
            incomum: 1.2,
            raro: 1.5,
            epico: 2.0,
            lendario: 3.0
        };
        return modifiers[rarity] || 1.0;
    }

    // Criação de monstrinhos
    createMonster(templateId, level = 1) {
        const template = this.getMonsterData().templates.find(t => t.id === templateId);
        if (!template) return null;

        const rarityMod = this.getRarityModifier(template.rarity);
        const maxHp = Math.floor(template.baseHp * (1 + level * 0.1) * rarityMod);
        
        return {
            id: Date.now() + Math.random(),
            templateId: template.id,
            name: template.name,
            type: template.type,
            icon: template.icon,
            level: level,
            rarity: template.rarity,
            hp: maxHp,
            maxHp: maxHp,
            attack: Math.floor(template.baseAtk * (1 + level * 0.1) * rarityMod)
        };
    }

    giveStarterMonster() {
        const starters = [1, 2, 3]; // Flamix, Aquarix, Verdinho
        const randomStarter = starters[Math.floor(Math.random() * starters.length)];
        const starter = this.createMonster(randomStarter, 5);
        this.player.team.push(starter);
        this.saveGame();
        this.renderTeam();
        this.addLog('Você recebeu seu primeiro monstrinho: ' + starter.name + '! 🎉');
    }

    // Sistema de d20
    rollD20() {
        return Math.floor(Math.random() * 20) + 1;
    }

    // Navegação
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;

        if (screenId === 'therapeutic-panel') {
            this.renderTherapeuticPanel();
        } else if (screenId === 'team-screen') {
            this.renderTeam();
        } else if (screenId === 'box-screen') {
            this.renderBox();
        } else if (screenId === 'trade-screen') {
            this.renderTradeScreen();
        }
    }

    // Painel Terapêutico
    addObjective() {
        const objective = {
            id: Date.now(),
            text: 'Novo objetivo',
            completed: false
        };
        this.player.therapeuticData.objectives.push(objective);
        this.saveGame();
        this.renderTherapeuticPanel();
    }

    toggleObjective(id) {
        const obj = this.player.therapeuticData.objectives.find(o => o.id === id);
        if (obj) {
            obj.completed = !obj.completed;
            if (obj.completed) {
                this.addXP(10);
            } else {
                this.addXP(-10);
            }
            this.saveGame();
            this.renderTherapeuticPanel();
        }
    }

    updateObjectiveText(id, text) {
        const obj = this.player.therapeuticData.objectives.find(o => o.id === id);
        if (obj) {
            obj.text = text;
            this.saveGame();
        }
    }

    deleteObjective(id) {
        this.player.therapeuticData.objectives = this.player.therapeuticData.objectives.filter(o => o.id !== id);
        this.saveGame();
        this.renderTherapeuticPanel();
    }

    addXP(amount) {
        this.player.therapeuticData.xp += amount;
        if (this.player.therapeuticData.xp < 0) this.player.therapeuticData.xp = 0;
        
        // Level up
        while (this.player.therapeuticData.xp >= this.player.therapeuticData.maxXp) {
            this.player.therapeuticData.xp -= this.player.therapeuticData.maxXp;
            this.player.therapeuticData.maxXp = Math.floor(this.player.therapeuticData.maxXp * 1.5);
            this.addMedal('⬆️', 'Level Up!');
        }
        
        this.saveGame();
        this.renderTherapeuticPanel();
    }

    addMedal(icon, name) {
        this.player.therapeuticData.medals.push({
            id: Date.now(),
            icon: icon,
            name: name,
            date: new Date().toLocaleDateString()
        });
        this.saveGame();
    }

    renderTherapeuticPanel() {
        // Objetivos
        const objectivesList = document.getElementById('objectives-list');
        if (objectivesList) {
            objectivesList.innerHTML = this.player.therapeuticData.objectives.map(obj => `
                <div class="objective-item">
                    <input type="checkbox" ${obj.completed ? 'checked' : ''} 
                           onchange="game.toggleObjective(${obj.id})">
                    <input type="text" value="${obj.text}" 
                           onchange="game.updateObjectiveText(${obj.id}, this.value)">
                    <button onclick="game.deleteObjective(${obj.id})">🗑️</button>
                </div>
            `).join('');
        }

        // Medalhas
        const medalsDisplay = document.getElementById('medals-display');
        if (medalsDisplay) {
            if (this.player.therapeuticData.medals.length === 0) {
                medalsDisplay.innerHTML = '<div class="empty-state">Nenhuma medalha ainda</div>';
            } else {
                medalsDisplay.innerHTML = this.player.therapeuticData.medals.map(medal => `
                    <div class="medal-item">
                        <div class="medal-icon">${medal.icon}</div>
                        <div class="medal-name">${medal.name}</div>
                    </div>
                `).join('');
            }
        }

        // XP
        const xpFill = document.getElementById('xp-fill');
        const xpText = document.getElementById('xp-text');
        if (xpFill && xpText) {
            const percentage = (this.player.therapeuticData.xp / this.player.therapeuticData.maxXp) * 100;
            xpFill.style.width = percentage + '%';
            xpText.textContent = `${this.player.therapeuticData.xp} / ${this.player.therapeuticData.maxXp} XP`;
        }
    }

    // Renderização do Time
    renderTeam() {
        const teamDisplay = document.getElementById('team-display');
        if (!teamDisplay) return;

        if (this.player.team.length === 0) {
            teamDisplay.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>Seu time está vazio</p></div>';
            return;
        }

        teamDisplay.innerHTML = this.player.team.map((monster, idx) => `
            <div class="monster-card rarity-${monster.rarity}">
                <div class="monster-icon">${monster.icon}</div>
                <div class="monster-name">${monster.name}</div>
                <div class="monster-level">Nível ${monster.level}</div>
                <div class="monster-type type-${monster.type}">${monster.type}</div>
                <div class="monster-hp">HP: ${monster.hp}/${monster.maxHp}</div>
                <div class="monster-hp">ATK: ${monster.attack}</div>
            </div>
        `).join('');
    }

    // Renderização do Box
    renderBox() {
        const boxDisplay = document.getElementById('box-display');
        if (!boxDisplay) return;

        if (this.player.box.length === 0) {
            boxDisplay.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📦</div><p>Seu box está vazio</p></div>';
            return;
        }

        boxDisplay.innerHTML = this.player.box.map(monster => `
            <div class="monster-card rarity-${monster.rarity}">
                <div class="monster-icon">${monster.icon}</div>
                <div class="monster-name">${monster.name}</div>
                <div class="monster-level">Nível ${monster.level}</div>
                <div class="monster-type type-${monster.type}">${monster.type}</div>
                <div class="monster-hp">HP: ${monster.hp}/${monster.maxHp}</div>
                <div class="monster-hp">ATK: ${monster.attack}</div>
            </div>
        `).join('');
    }

    // Sistema de Encontro
    encounter(type) {
        if (this.player.team.length === 0) {
            alert('Você precisa de pelo menos um monstrinho no seu time!');
            return;
        }

        let enemyLevel, enemyTemplateId, isBoss;
        const templates = this.getMonsterData().templates;

        if (type === 'boss') {
            isBoss = true;
            // Boss é sempre mais forte
            const avgTeamLevel = this.player.team.reduce((sum, m) => sum + m.level, 0) / this.player.team.length;
            enemyLevel = Math.floor(avgTeamLevel * 1.5) + 5;
            // Boss é sempre raro ou melhor
            const bossTemplates = templates.filter(t => ['raro', 'epico', 'lendario'].includes(t.rarity));
            enemyTemplateId = bossTemplates[Math.floor(Math.random() * bossTemplates.length)].id;
        } else {
            isBoss = false;
            const playerLevel = this.player.team[0].level;
            enemyLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 5) - 2);
            enemyTemplateId = templates[Math.floor(Math.random() * templates.length)].id;
        }

        const enemy = this.createMonster(enemyTemplateId, enemyLevel);
        this.startBattle(enemy, isBoss);
    }

    // Sistema de Batalha
    startBattle(enemy, isBoss = false) {
        this.battle = {
            enemy: enemy,
            playerMonster: this.player.team[0],
            isBoss: isBoss,
            turn: 'player',
            log: []
        };

        // Curar o monstrinho do jogador antes da batalha
        this.battle.playerMonster.hp = this.battle.playerMonster.maxHp;

        this.showScreen('battle-screen');
        this.updateBattleDisplay();
        this.addBattleLog(`Um ${enemy.name} selvagem apareceu! (Nível ${enemy.level})`);
        
        if (isBoss) {
            document.getElementById('flee-btn').style.display = 'none';
            this.addBattleLog('⚠️ É um BOSS! Você não pode fugir!');
        } else {
            document.getElementById('flee-btn').style.display = 'block';
        }
    }

    updateBattleDisplay() {
        if (!this.battle) return;

        // Inimigo
        document.getElementById('enemy-name').textContent = `${this.battle.enemy.icon} ${this.battle.enemy.name}`;
        document.getElementById('enemy-stats').textContent = `Nível ${this.battle.enemy.level} | ATK ${this.battle.enemy.attack}`;
        this.updateHPBar('enemy', this.battle.enemy.hp, this.battle.enemy.maxHp);

        // Jogador
        document.getElementById('player-monster-name').textContent = `${this.battle.playerMonster.icon} ${this.battle.playerMonster.name}`;
        document.getElementById('player-stats').textContent = `Nível ${this.battle.playerMonster.level} | ATK ${this.battle.playerMonster.attack}`;
        this.updateHPBar('player', this.battle.playerMonster.hp, this.battle.playerMonster.maxHp);
    }

    updateHPBar(who, hp, maxHp) {
        const fill = document.getElementById(`${who}-hp-fill`);
        const text = document.getElementById(`${who}-hp-text`);
        
        const percentage = Math.max(0, (hp / maxHp) * 100);
        fill.style.width = percentage + '%';
        text.textContent = `HP: ${Math.max(0, hp)}/${maxHp}`;

        fill.classList.remove('low', 'critical');
        if (percentage < 50) fill.classList.add('low');
        if (percentage < 25) fill.classList.add('critical');
    }

    addBattleLog(message) {
        const log = document.getElementById('battle-log');
        if (log) {
            const p = document.createElement('p');
            p.textContent = message;
            log.appendChild(p);
            log.scrollTop = log.scrollHeight;
        }
    }

    battleAction(action) {
        if (!this.battle || this.battle.turn !== 'player') return;

        switch(action) {
            case 'attack':
                this.executeAttack('player');
                break;
            case 'item':
                this.showItemModal();
                break;
            case 'switch':
                this.showSwitchModal();
                break;
            case 'flee':
                if (!this.battle.isBoss) {
                    this.addBattleLog('Você fugiu da batalha!');
                    setTimeout(() => this.showScreen('explore-screen'), 1500);
                } else {
                    this.addBattleLog('Você não pode fugir de um Boss!');
                }
                break;
        }
    }

    executeAttack(attacker) {
        const isPlayer = attacker === 'player';
        const attackerMonster = isPlayer ? this.battle.playerMonster : this.battle.enemy;
        const defenderMonster = isPlayer ? this.battle.enemy : this.battle.playerMonster;
        const defenderName = isPlayer ? 'player' : 'enemy';

        // Rolar d20 para acerto
        const rollAttack = this.rollD20();
        const rollDefense = this.rollD20();

        this.addBattleLog(`${attackerMonster.name} ataca! (d20: ${rollAttack})`);
        this.addBattleLog(`${defenderMonster.name} defende! (d20: ${rollDefense})`);

        if (rollAttack <= rollDefense) {
            this.addBattleLog('❌ Ataque falhou!');
            if (isPlayer) {
                this.battle.turn = 'enemy';
                setTimeout(() => this.enemyTurn(), 1500);
            } else {
                this.battle.turn = 'player';
            }
            return;
        }

        // Calcular dano
        let damage = attackerMonster.attack;
        
        // Modificador de nível (diferença de nível afeta fortemente)
        const levelDiff = attackerMonster.level - defenderMonster.level;
        damage = Math.floor(damage * (1 + levelDiff * 0.15));

        // Vantagem/desvantagem de tipo
        const effectiveness = this.getTypeEffectiveness();
        const attackerType = effectiveness[attackerMonster.type];
        if (attackerType.strong.includes(defenderMonster.type)) {
            damage = Math.floor(damage * 1.5);
            this.addBattleLog('💥 Super efetivo!');
        } else if (attackerType.weak.includes(defenderMonster.type)) {
            damage = Math.floor(damage * 0.75);
            this.addBattleLog('🛡️ Não muito efetivo...');
        }

        // Variação aleatória (80% - 100%)
        damage = Math.floor(damage * (0.8 + Math.random() * 0.2));
        damage = Math.max(1, damage);

        defenderMonster.hp -= damage;
        this.addBattleLog(`✅ ${damage} de dano!`);

        this.updateBattleDisplay();

        // Verificar vitória/derrota
        if (defenderMonster.hp <= 0) {
            this.handleBattleEnd(isPlayer);
            return;
        }

        // Próximo turno
        if (isPlayer) {
            this.battle.turn = 'enemy';
            setTimeout(() => this.enemyTurn(), 1500);
        } else {
            this.battle.turn = 'player';
        }
    }

    enemyTurn() {
        if (!this.battle || this.battle.turn !== 'enemy') return;

        this.addBattleLog('--- Turno do inimigo ---');

        // IA simples: 80% ataque, 20% usar item se HP baixo
        const useItem = this.battle.enemy.hp < this.battle.enemy.maxHp * 0.3 && Math.random() < 0.2;

        if (useItem) {
            const healAmount = Math.floor(this.battle.enemy.maxHp * 0.3);
            this.battle.enemy.hp = Math.min(this.battle.enemy.maxHp, this.battle.enemy.hp + healAmount);
            this.addBattleLog(`${this.battle.enemy.name} usou uma poção! (+${healAmount} HP)`);
            this.updateBattleDisplay();
            setTimeout(() => {
                this.battle.turn = 'player';
            }, 1500);
        } else {
            this.executeAttack('enemy');
        }
    }

    handleBattleEnd(playerWon) {
        if (playerWon) {
            this.addBattleLog('🎉 Vitória! Você derrotou ' + this.battle.enemy.name + '!');
            
            // XP e recompensas
            const xpGain = Math.floor(this.battle.enemy.level * 5 * this.getRarityModifier(this.battle.enemy.rarity));
            this.addXP(xpGain);
            this.addBattleLog(`+${xpGain} XP conquistado!`);

            // Subir nível do monstrinho
            this.battle.playerMonster.level += 1;
            this.battle.playerMonster.maxHp = Math.floor(this.battle.playerMonster.maxHp * 1.1);
            this.battle.playerMonster.hp = this.battle.playerMonster.maxHp;
            this.battle.playerMonster.attack = Math.floor(this.battle.playerMonster.attack * 1.1);
            this.addBattleLog(`${this.battle.playerMonster.name} subiu para o nível ${this.battle.playerMonster.level}!`);

            if (this.battle.isBoss) {
                this.addMedal('👑', 'Derrotou um Boss!');
            }

            this.saveGame();

            // Oferecer captura
            setTimeout(() => {
                this.offerCapture(this.battle.enemy);
            }, 2000);
        } else {
            this.addBattleLog('💔 Seu monstrinho foi derrotado!');
            this.battle.playerMonster.hp = Math.floor(this.battle.playerMonster.maxHp * 0.5);
            this.saveGame();
            setTimeout(() => {
                this.showScreen('main-menu');
            }, 2000);
        }
    }

    offerCapture(enemy) {
        this.battle.captureTarget = enemy;
        const captureInfo = document.getElementById('capture-info');
        captureInfo.innerHTML = `
            <div class="monster-icon" style="font-size: 80px;">${enemy.icon}</div>
            <h3>${enemy.name}</h3>
            <p>Nível ${enemy.level} | ${enemy.type}</p>
            <p>Raridade: ${enemy.rarity}</p>
            <p style="margin-top: 20px;">Pokébolas: ${this.player.items.pokebola}</p>
        `;
        this.showScreen('capture-screen');
    }

    attemptCapture() {
        if (this.player.items.pokebola <= 0) {
            alert('Você não tem pokébolas!');
            return;
        }

        this.player.items.pokebola--;
        const enemy = this.battle.captureTarget;

        // Sistema de captura: d20 + nível do jogador + modificador de raridade + item
        const playerRoll = this.rollD20();
        const playerLevel = this.battle.playerMonster.level;
        const enemyRoll = this.rollD20();
        const enemyLevel = enemy.level;
        const rarityPenalty = this.getRarityModifier(enemy.rarity) * 5;

        const captureScore = playerRoll + playerLevel - rarityPenalty;
        const escapeScore = enemyRoll + enemyLevel;

        let message = `Tentativa de captura!\n`;
        message += `Seu d20: ${playerRoll} + Nível ${playerLevel} - Raridade ${rarityPenalty.toFixed(0)} = ${captureScore.toFixed(0)}\n`;
        message += `${enemy.name} d20: ${enemyRoll} + Nível ${enemyLevel} = ${escapeScore}\n\n`;

        if (captureScore > escapeScore) {
            message += `✅ Captura bem-sucedida! ${enemy.name} foi capturado!`;
            
            // Adicionar ao time ou box
            if (this.player.team.length < 6) {
                this.player.team.push(enemy);
            } else {
                this.player.box.push(enemy);
                message += `\n(Enviado para o Box)`;
            }

            this.addMedal('⚡', 'Capturou ' + enemy.name);
            this.addXP(20);
            this.saveGame();

            alert(message);
            this.showScreen('main-menu');
        } else {
            message += `❌ ${enemy.name} escapou!`;
            alert(message);
            if (this.player.items.pokebola > 0) {
                // Pode tentar novamente
            } else {
                this.showScreen('main-menu');
            }
        }
    }

    // Itens
    showItemModal() {
        const modal = document.getElementById('item-modal');
        const itemList = document.getElementById('item-list');
        
        itemList.innerHTML = Object.entries(this.player.items)
            .filter(([key, qty]) => qty > 0)
            .map(([key, qty]) => {
                let name = key;
                if (key === 'pokebola') name = 'Pokébola';
                if (key === 'superbola') name = 'Super Bola';
                if (key === 'pocao') name = 'Poção';
                if (key === 'superPocao') name = 'Super Poção';
                
                return `<button class="item-button" onclick="game.useItem('${key}')">${name} (${qty})</button>`;
            }).join('');

        modal.classList.add('active');
    }

    useItem(itemKey) {
        if (this.player.items[itemKey] <= 0) return;

        this.player.items[itemKey]--;
        this.closeModal();

        if (itemKey === 'pocao') {
            const heal = Math.floor(this.battle.playerMonster.maxHp * 0.3);
            this.battle.playerMonster.hp = Math.min(this.battle.playerMonster.maxHp, this.battle.playerMonster.hp + heal);
            this.addBattleLog(`Você usou uma Poção! (+${heal} HP)`);
        } else if (itemKey === 'superPocao') {
            const heal = Math.floor(this.battle.playerMonster.maxHp * 0.5);
            this.battle.playerMonster.hp = Math.min(this.battle.playerMonster.maxHp, this.battle.playerMonster.hp + heal);
            this.addBattleLog(`Você usou uma Super Poção! (+${heal} HP)`);
        }

        this.updateBattleDisplay();
        this.saveGame();

        this.battle.turn = 'enemy';
        setTimeout(() => this.enemyTurn(), 1500);
    }

    showSwitchModal() {
        const modal = document.getElementById('switch-modal');
        const switchList = document.getElementById('switch-list');
        
        switchList.innerHTML = this.player.team
            .filter(m => m.id !== this.battle.playerMonster.id && m.hp > 0)
            .map(m => `
                <button class="switch-button" onclick="game.switchMonster(${m.id})">
                    ${m.icon} ${m.name} - Nível ${m.level} - HP: ${m.hp}/${m.maxHp}
                </button>
            `).join('');

        if (switchList.innerHTML === '') {
            switchList.innerHTML = '<p>Nenhum monstrinho disponível para troca</p>';
        }

        modal.classList.add('active');
    }

    switchMonster(monsterId) {
        const newMonster = this.player.team.find(m => m.id === monsterId);
        if (!newMonster) return;

        this.battle.playerMonster = newMonster;
        this.addBattleLog(`Você trocou para ${newMonster.name}!`);
        this.closeModal();
        this.updateBattleDisplay();

        this.battle.turn = 'enemy';
        setTimeout(() => this.enemyTurn(), 1500);
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    }

    // Sistema de Troca
    renderTradeScreen() {
        const yourMonsters = document.getElementById('trade-your-monsters');
        const allMonsters = [...this.player.team, ...this.player.box];

        if (allMonsters.length === 0) {
            yourMonsters.innerHTML = '<div class="empty-state">Nenhum monstrinho para trocar</div>';
            return;
        }

        yourMonsters.innerHTML = allMonsters.map(monster => `
            <div class="monster-card rarity-${monster.rarity} ${this.selectedMonster === monster.id ? 'selected' : ''}" 
                 onclick="game.selectMonsterForTrade(${monster.id})">
                <div class="monster-icon">${monster.icon}</div>
                <div class="monster-name">${monster.name}</div>
                <div class="monster-level">Nível ${monster.level}</div>
                <div class="monster-type type-${monster.type}">${monster.type}</div>
            </div>
        `).join('');
    }

    selectMonsterForTrade(monsterId) {
        this.selectedMonster = monsterId;
        this.renderTradeScreen();
    }

    exportSelected() {
        if (!this.selectedMonster) {
            alert('Selecione um monstrinho primeiro!');
            return;
        }

        const allMonsters = [...this.player.team, ...this.player.box];
        const monster = allMonsters.find(m => m.id === this.selectedMonster);
        
        if (!monster) return;

        const tradeCode = btoa(JSON.stringify(monster));
        const output = document.getElementById('trade-code-output');
        output.textContent = tradeCode;
        output.style.display = 'block';
        
        alert('Código de troca copiado! Compartilhe com outro jogador.');
    }

    importTrade() {
        const input = document.getElementById('trade-code-input');
        const code = input.value.trim();
        
        if (!code) {
            alert('Cole um código de troca primeiro!');
            return;
        }

        try {
            const monster = JSON.parse(atob(code));
            
            // Adicionar ao box
            this.player.box.push(monster);
            this.saveGame();
            
            alert(`Você recebeu ${monster.name}! (Enviado para o Box)`);
            input.value = '';
            this.addXP(15);
            this.addMedal('🔄', 'Fez uma troca!');
        } catch (e) {
            alert('Código de troca inválido!');
        }
    }

    // Persistência
    saveGame() {
        localStorage.setItem('monstrinhomon_save', JSON.stringify(this.player));
    }

    loadGame() {
        const saved = localStorage.getItem('monstrinhomon_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.player = {
                    ...this.player,
                    ...data
                };
            } catch (e) {
                console.error('Erro ao carregar save:', e);
            }
        }
    }

    addLog(message) {
        console.log(message);
    }
}

// Inicializar o jogo
const game = new MonstrinhonGame();
