/**
 * GROUP BATTLE LOOP (v1.0) - Funções de Transição de Estado
 * 
 * PASSO 3: Loop de batalha em grupo usando GroupBattleState
 * PASSO 4.5: Ações completas + Encerramento da batalha
 * 
 * Este módulo implementa as funções que fazem a batalha "acontecer":
 * - Criar batalha
 * - Iniciar fases (players/enemies)
 * - Avançar turnos
 * - Executar ações (attack, skill, item, flee, pass)
 * - Verificar fim de batalha
 * - Distribuir recompensas
 * 
 * REGRAS:
 * - Todas as funções são puras (recebem state, retornam novo state)
 * - Sem side effects (sem DOM, sem I/O)
 * - Dependency injection para testabilidade
 * - performAction é o ponto único de mutação do combate
 */

import * as GroupBattleState from './groupBattleState.js';
import { calculateTurnOrder, isAlive, checkHit, calcDamage } from './groupCore.js';

/**
 * Cria uma nova batalha em grupo
 * 
 * @param {Object} params - Parâmetros da batalha
 * @param {Array<string>} params.selectedPlayerIds - IDs dos jogadores que entram
 * @param {string} params.kind - Tipo: "trainer" ou "boss"
 * @param {Array<string>} params.eligiblePlayerIds - Todos os jogadores da sessão
 * @param {Array<Object>} params.playersData - Dados completos dos jogadores
 * @param {Object} params.options - Opções adicionais (enemyLevel, rules, etc)
 * @param {Function} params.rollD20Fn - Função para rolar d20 (dependency injection)
 * @returns {Object} Novo GroupBattleState pronto para batalha
 * 
 * VALIDAÇÕES:
 * - selectedPlayerIds ⊆ eligiblePlayerIds
 * - Pelo menos 1 jogador selecionado
 * - Cada jogador tem monstrinho ativo válido e vivo
 * 
 * GERAÇÃO DE INIMIGOS (baseado no número de jogadores):
 * - 1-2 jogadores → 2-3 inimigos
 * - 3-4 jogadores → 2-6 inimigos
 * - 5-6 jogadores → 5-6 inimigos
 * - Boss: único OU boss+minions
 */
export function startGroupBattle(params) {
    const {
        selectedPlayerIds,
        kind,
        eligiblePlayerIds,
        playersData,
        options = {},
        rollD20Fn = () => Math.floor(Math.random() * 20) + 1
    } = params;

    // 1. Validar seleção
    if (!Array.isArray(selectedPlayerIds) || selectedPlayerIds.length === 0) {
        throw new Error('Pelo menos 1 jogador deve ser selecionado');
    }

    if (!Array.isArray(eligiblePlayerIds) || eligiblePlayerIds.length === 0) {
        throw new Error('eligiblePlayerIds deve ser array não vazio');
    }

    // Verificar que selectedPlayerIds são elegíveis
    for (const pid of selectedPlayerIds) {
        if (!eligiblePlayerIds.includes(pid)) {
            throw new Error(`Jogador ${pid} não está em eligiblePlayerIds`);
        }
    }

    // Validar que cada jogador tem monstrinho ativo válido
    for (const pid of selectedPlayerIds) {
        const player = playersData.find(p => p.id === pid);
        if (!player) {
            throw new Error(`Jogador ${pid} não encontrado em playersData`);
        }

        const activeMonster = player.team?.[0];
        if (!activeMonster) {
            throw new Error(`Jogador ${pid} não tem monstrinho ativo`);
        }

        if (!isAlive(activeMonster)) {
            throw new Error(`Monstrinho de ${pid} está desmaiado`);
        }
    }

    // 2. Gerar inimigos conforme regras
    const numPlayers = selectedPlayerIds.length;
    const enemies = generateEnemies(numPlayers, kind, options);

    // 3. Criar GroupBattleState
    let state = GroupBattleState.createGroupBattleState({
        kind,
        eligiblePlayerIds,
        initialParticipants: selectedPlayerIds,
        enemies,
        rules: options.rules || {},
        rewards: options.rewards || {}
    });

    // 4. Preencher teams.players com monstros ativos
    const playersTeam = [];
    for (const pid of selectedPlayerIds) {
        const player = playersData.find(p => p.id === pid);
        const monster = player.team[0];
        
        playersTeam.push({
            playerId: pid,
            activeMonster: {
                uid: monster.uid || monster.id,
                catalogId: monster.catalogId || monster.monsterID,
                name: monster.name || monster.nome,
                nickname: monster.nickname,
                hp: Number(monster.hp) || 0,
                hpMax: Number(monster.hpMax) || 1,
                spd: Number(monster.spd) || 0,
                atk: Number(monster.atk) || 0,
                def: Number(monster.def) || 0,
                cls: monster.class || monster.cls || "Guerreiro",
                level: monster.level || 1,
                status: monster.status || []
            }
        });
    }

    state = {
        ...state,
        teams: {
            ...state.teams,
            players: playersTeam
        }
    };

    // 5. Iniciar fase dos jogadores imediatamente
    state = beginPhase(state, "players", { playersData, rollD20Fn });

    return state;
}

/**
 * Gera inimigos baseado no número de jogadores e tipo de batalha
 * 
 * @param {number} numPlayers - Número de jogadores
 * @param {string} kind - "trainer" ou "boss"
 * @param {Object} options - Opções (enemyLevel, etc)
 * @returns {Array<Object>} Array de inimigos
 */
function generateEnemies(numPlayers, kind, options = {}) {
    const enemyLevel = options.enemyLevel || 1;
    const enemies = [];

    if (kind === "boss") {
        // Boss: único ou boss + minions
        const bossHp = Math.floor(50 * (1 + enemyLevel * 0.5));
        
        enemies.push({
            name: `Boss Nv${enemyLevel}`,
            hp: bossHp,
            hpMax: bossHp,
            spd: 5 + Math.floor(enemyLevel * 0.5),
            atk: 5 + Math.floor(enemyLevel * 0.3),
            def: 5 + Math.floor(enemyLevel * 0.3),
            class: "Bárbaro",
            type: "boss"
        });

        // Se tiver 3+ jogadores, adicionar 1-2 minions
        if (numPlayers >= 3) {
            const numMinions = numPlayers >= 5 ? 2 : 1;
            for (let i = 0; i < numMinions; i++) {
                const minionHp = Math.floor(30 * (1 + enemyLevel * 0.3));
                enemies.push({
                    name: `Capanga ${i + 1}`,
                    hp: minionHp,
                    hpMax: minionHp,
                    spd: 4 + Math.floor(enemyLevel * 0.3),
                    atk: 4 + Math.floor(enemyLevel * 0.2),
                    def: 3 + Math.floor(enemyLevel * 0.2),
                    class: "Guerreiro",
                    type: "minion"
                });
            }
        }
    } else {
        // Trainer: múltiplos inimigos baseado no número de jogadores
        let numEnemies;
        if (numPlayers <= 2) {
            numEnemies = 2 + Math.floor(Math.random() * 2); // 2-3
        } else if (numPlayers <= 4) {
            numEnemies = 2 + Math.floor(Math.random() * 5); // 2-6
        } else {
            numEnemies = 5 + Math.floor(Math.random() * 2); // 5-6
        }

        const classes = ["Guerreiro", "Mago", "Ladino", "Curandeiro"];
        
        for (let i = 0; i < numEnemies; i++) {
            const baseHp = 30 + Math.floor(Math.random() * 20);
            const scaledHp = Math.floor(baseHp * (1 + enemyLevel * 0.4));
            
            enemies.push({
                name: `Inimigo ${i + 1}`,
                hp: scaledHp,
                hpMax: scaledHp,
                spd: 3 + Math.floor(Math.random() * 5) + Math.floor(enemyLevel * 0.3),
                atk: 3 + Math.floor(Math.random() * 3) + Math.floor(enemyLevel * 0.2),
                def: 3 + Math.floor(Math.random() * 3) + Math.floor(enemyLevel * 0.2),
                class: classes[i % classes.length],
                type: "trainer"
            });
        }
    }

    return enemies;
}

/**
 * Inicia uma fase do combate (players ou enemies)
 * 
 * @param {Object} state - GroupBattleState atual
 * @param {string} phase - "players" ou "enemies"
 * @param {Object} deps - Dependências (playersData, rollD20Fn)
 * @returns {Object} Novo state com fase iniciada
 * 
 * REGRAS:
 * - phase="players": aplica reforços, monta ordem de jogadores ativos
 * - phase="enemies": monta ordem de inimigos vivos
 * - Calcula turn.order baseado em SPD
 * - Define currentActorId como primeiro da ordem
 */
export function beginPhase(state, phase, deps = {}) {
    const { playersData = [], rollD20Fn = () => Math.floor(Math.random() * 20) + 1 } = deps;

    if (phase !== "players" && phase !== "enemies") {
        throw new Error('phase deve ser "players" ou "enemies"');
    }

    let newState = state;

    // Se fase dos jogadores, aplicar reforços primeiro
    if (phase === "players" && state.rules.allowLateJoin) {
        newState = GroupBattleState.applyReinforcementsIfAny(newState);
    }

    // Montar ordem de atuação
    let order = [];

    if (phase === "players") {
        // Ordem dos jogadores participantes ativos
        const activeParticipants = GroupBattleState.getActiveParticipants(newState);
        
        for (const participant of activeParticipants) {
            const playerTeam = newState.teams.players.find(pt => pt.playerId === participant.playerId);
            if (!playerTeam || !playerTeam.activeMonster) continue;
            
            const monster = playerTeam.activeMonster;
            if (!isAlive(monster)) continue;
            
            order.push({
                side: "player",
                id: participant.playerId,
                name: participant.playerId, // Nome será preenchido pela UI
                spd: Number(monster.spd) || 0,
                _tiebreak: null
            });
        }
    } else {
        // Ordem dos inimigos vivos
        for (let i = 0; i < newState.teams.enemies.length; i++) {
            const enemy = newState.teams.enemies[i];
            if (!isAlive(enemy)) continue;
            
            order.push({
                side: "enemy",
                id: i,
                name: enemy.name || `Inimigo ${i + 1}`,
                spd: Number(enemy.spd) || 0,
                _tiebreak: null
            });
        }
    }

    // Ordenar por SPD descendente
    order.sort((a, b) => (b.spd - a.spd));

    // Aplicar tiebreak para empates de SPD
    let blockStart = 0;
    while (blockStart < order.length) {
        let blockEnd = blockStart + 1;
        while (blockEnd < order.length && order[blockEnd].spd === order[blockStart].spd) {
            blockEnd++;
        }
        
        // Se houver empate, rolar d20 para desempate
        if (blockEnd - blockStart > 1) {
            for (let index = blockStart; index < blockEnd; index++) {
                order[index]._tiebreak = rollD20Fn();
            }
            const sortedBlock = order.slice(blockStart, blockEnd).sort((a, b) => (b._tiebreak - a._tiebreak));
            for (let index = 0; index < sortedBlock.length; index++) {
                order[blockStart + index] = sortedBlock[index];
            }
        }
        
        blockStart = blockEnd;
    }

    // Atualizar state com nova fase e ordem
    const banner = phase === "players" ? "Vez dos Jogadores" : "Vez dos Inimigos";
    const currentActorId = order.length > 0 ? order[0].id : null;

    newState = {
        ...newState,
        turn: {
            ...newState.turn,
            phase,
            order,
            index: 0,
            currentActorId,
            visibleBanner: banner
        }
    };

    // Adicionar log
    newState = GroupBattleState.addLogEntry(
        newState,
        "TURN_PHASE",
        banner,
        { phase, round: newState.turn.round, orderLength: order.length }
    );

    return newState;
}

/**
 * Avança para o próximo turno
 * 
 * @param {Object} state - GroupBattleState atual
 * @param {Object} deps - Dependências (playersData, rollD20Fn)
 * @returns {Object} Novo state com turno avançado
 * 
 * REGRAS:
 * - Incrementa turn.index
 * - Se chegou ao fim da order:
 *   - phase="players" → beginPhase("enemies")
 *   - phase="enemies" → incrementRound + beginPhase("players")
 * - Senão: atualiza currentActorId
 */
export function advanceTurn(state, deps = {}) {
    const { playersData = [], rollD20Fn = () => Math.floor(Math.random() * 20) + 1 } = deps;

    let newState = state;
    const currentIndex = state.turn.index;
    const orderLength = state.turn.order.length;

    // Se não há ordem ou está vazia, não faz nada
    if (orderLength === 0) {
        return newState;
    }

    // Incrementar índice
    const nextIndex = currentIndex + 1;

    // Verificar se chegou ao fim da ordem
    if (nextIndex >= orderLength) {
        // Fim da fase atual
        if (state.turn.phase === "players") {
            // Mudar para fase dos inimigos
            newState = beginPhase(newState, "enemies", deps);
        } else {
            // Mudar para fase dos jogadores e incrementar rodada
            newState = GroupBattleState.incrementRound(newState);
            newState = beginPhase(newState, "players", deps);
        }
    } else {
        // Ainda há atores na ordem atual
        const nextActor = state.turn.order[nextIndex];
        
        newState = {
            ...newState,
            turn: {
                ...newState.turn,
                index: nextIndex,
                currentActorId: nextActor.id
            }
        };

        // Log de mudança de turno
        newState = GroupBattleState.addLogEntry(
            newState,
            "TURN_ADVANCE",
            `Turno: ${nextActor.name || nextActor.id}`,
            { 
                actorId: nextActor.id, 
                side: nextActor.side,
                index: nextIndex 
            }
        );
    }

    return newState;
}

/**
 * Verifica se é o turno do ator especificado
 * 
 * @param {Object} state - GroupBattleState
 * @param {string|number} actorId - ID do ator (playerId ou enemy index)
 * @returns {boolean} true se é o turno deste ator
 */
export function isActorTurn(state, actorId) {
    return state.turn.currentActorId === actorId;
}

/**
 * Obtém o ator atual
 * 
 * @param {Object} state - GroupBattleState
 * @returns {Object|null} Ator atual ou null
 */
export function getCurrentActor(state) {
    if (!state.turn.order || state.turn.order.length === 0) {
        return null;
    }

    const index = state.turn.index;
    return state.turn.order[index] || null;
}

/**
 * Obtém informações sobre o turno atual
 * 
 * @param {Object} state - GroupBattleState
 * @returns {Object} Informações do turno { phase, round, actor, isPlayerPhase, isEnemyPhase }
 */
export function getTurnInfo(state) {
    const actor = getCurrentActor(state);
    
    return {
        phase: state.turn.phase,
        round: state.turn.round,
        actor,
        actorId: state.turn.currentActorId,
        isPlayerPhase: state.turn.phase === "players",
        isEnemyPhase: state.turn.phase === "enemies",
        banner: state.turn.visibleBanner
    };
}

/**
 * PASSO 4.5 - Verifica condições de fim de batalha
 * 
 * @param {Object} state - GroupBattleState
 * @returns {{ ended: boolean, result?: string }} Resultado da verificação
 * 
 * REGRAS:
 * - Vitória: todos os inimigos mortos
 * - Derrota: nenhum participante com monstro ativo vivo
 * - Retreat: todos fugiram
 */
export function checkEndConditions(state) {
    // Verificar vitória: todos inimigos mortos
    const hasAliveEnemies = state.teams.enemies.some(enemy => isAlive(enemy));
    
    if (!hasAliveEnemies) {
        return { ended: true, result: "victory" };
    }
    
    // Verificar derrota/retreat: nenhum participante ativo com monstro vivo
    const activeParticipants = GroupBattleState.getActiveParticipants(state);
    
    if (activeParticipants.length === 0) {
        // Todos fugiram
        return { ended: true, result: "retreat" };
    }
    
    // Verificar se algum participante ativo tem monstro vivo
    let hasAlivePlayers = false;
    for (const participant of activeParticipants) {
        const playerTeam = state.teams.players.find(pt => pt.playerId === participant.playerId);
        if (playerTeam && playerTeam.activeMonster && isAlive(playerTeam.activeMonster)) {
            hasAlivePlayers = true;
            break;
        }
    }
    
    if (!hasAlivePlayers) {
        return { ended: true, result: "defeat" };
    }
    
    // Batalha continua
    return { ended: false };
}

/**
 * PASSO 4.5 - Distribui recompensas ao fim da batalha
 * 
 * @param {Object} state - GroupBattleState
 * @param {Array} playersData - Dados completos dos jogadores
 * @returns {Object} Novo state com recompensas distribuídas
 * 
 * REGRAS:
 * - Apenas participantes elegíveis recebem (não fugiram)
 * - XP igual para todos
 * - Dinheiro dividido igualmente
 * - Boss dá recompensas maiores
 */
export function endBattleAndDistributeRewards(state, playersData) {
    // Obter participantes elegíveis (não fugiram)
    const eligiblePlayerIds = GroupBattleState.getRewardEligiblePlayers(state);
    
    if (eligiblePlayerIds.length === 0) {
        // Ninguém elegível
        return GroupBattleState.addLogEntry(
            state,
            "REWARDS",
            "Nenhum participante elegível para recompensas",
            {}
        );
    }
    
    // Calcular recompensas base
    const isBoss = state.kind === "boss";
    const baseXP = isBoss ? 50 : 30;
    const baseMoney = isBoss ? 100 : 50;
    
    // XP por participante (igual para todos)
    const xpPerPlayer = baseXP;
    
    // Dinheiro por participante (divisão igual)
    const moneyPerPlayer = Math.floor(baseMoney / eligiblePlayerIds.length);
    
    let newState = state;
    
    // Distribuir recompensas
    for (const playerId of eligiblePlayerIds) {
        const player = playersData.find(p => p.id === playerId);
        if (!player) continue;
        
        // Adicionar XP ao monstro ativo
        const activeMonster = player.team?.[0];
        if (activeMonster && isAlive(activeMonster)) {
            // XP será aplicado externamente, apenas logar aqui
            newState = GroupBattleState.addLogEntry(
                newState,
                "XP_REWARD",
                `${player.name || playerId} ganhou ${xpPerPlayer} XP`,
                { playerId, xp: xpPerPlayer }
            );
        }
        
        // Adicionar dinheiro
        newState = GroupBattleState.addLogEntry(
            newState,
            "MONEY_REWARD",
            `${player.name || playerId} ganhou ${moneyPerPlayer} moedas`,
            { playerId, money: moneyPerPlayer }
        );
    }
    
    // Log final consolidado
    newState = GroupBattleState.addLogEntry(
        newState,
        "BATTLE_END",
        `Recompensas distribuídas: ${xpPerPlayer} XP e ${moneyPerPlayer} moedas por jogador`,
        {
            xpPerPlayer,
            moneyPerPlayer,
            eligibleCount: eligiblePlayerIds.length,
            isBoss
        }
    );
    
    return newState;
}

/**
 * PASSO 4.5 - Executa uma ação de combate (ponto único de mutação)
 * 
 * @param {Object} state - GroupBattleState
 * @param {Object} action - Ação a executar
 * @param {Object} deps - Dependências (playersData, rollD20Fn, etc)
 * @returns {Object} Novo state após ação
 * 
 * TIPOS DE AÇÃO:
 * - { type: "attack", actorId, targetId, side: "player"|"enemy" }
 * - { type: "skill", actorId, targetId, skillId }
 * - { type: "item", actorId, itemId, targetId? }
 * - { type: "flee", actorId }
 * - { type: "pass", actorId }
 */
export function performAction(state, action, deps = {}) {
    const { playersData = [], rollD20Fn = () => Math.floor(Math.random() * 20) + 1 } = deps;
    
    let newState = state;
    
    // Validar que é o turno do ator
    const currentActor = getCurrentActor(state);
    if (!currentActor || currentActor.id !== action.actorId) {
        throw new Error(`Não é o turno de ${action.actorId}`);
    }
    
    // Processar ação baseado no tipo
    switch (action.type) {
        case "attack":
            newState = performAttack(newState, action, deps);
            break;
            
        case "skill":
            newState = performSkill(newState, action, deps);
            break;
            
        case "item":
            newState = performItem(newState, action, deps);
            break;
            
        case "flee":
            newState = performFlee(newState, action, deps);
            break;
            
        case "pass":
            newState = performPass(newState, action, deps);
            break;
            
        default:
            throw new Error(`Tipo de ação desconhecido: ${action.type}`);
    }
    
    // Verificar condições de fim
    const endCheck = checkEndConditions(newState);
    
    if (endCheck.ended) {
        // Finalizar batalha
        newState = GroupBattleState.endBattle(newState, endCheck.result);
        
        // Distribuir recompensas se vitória
        if (endCheck.result === "victory") {
            newState = endBattleAndDistributeRewards(newState, playersData);
        }
        
        return newState;
    }
    
    // Se não acabou, avançar turno
    newState = advanceTurn(newState, deps);
    
    return newState;
}

/**
 * Executa ataque
 */
function performAttack(state, action, deps) {
    const { playersData = [], rollD20Fn = () => Math.floor(Math.random() * 20) + 1 } = deps;
    
    const currentActor = getCurrentActor(state);
    let attacker, defender, attackerName, defenderName;
    
    // Determinar atacante e defensor
    if (currentActor.side === "player") {
        const player = playersData.find(p => p.id === action.actorId);
        const playerTeam = state.teams.players.find(pt => pt.playerId === action.actorId);
        attacker = playerTeam?.activeMonster;
        attackerName = player?.name || action.actorId;
        
        defender = state.teams.enemies[action.targetId];
        defenderName = defender?.name || `Inimigo ${action.targetId}`;
    } else {
        attacker = state.teams.enemies[action.actorId];
        attackerName = attacker?.name || `Inimigo ${action.actorId}`;
        
        const player = playersData.find(p => p.id === action.targetId);
        const playerTeam = state.teams.players.find(pt => pt.playerId === action.targetId);
        defender = playerTeam?.activeMonster;
        defenderName = player?.name || action.targetId;
    }
    
    if (!attacker || !defender) {
        throw new Error("Atacante ou defensor inválido");
    }
    
    // Rolar d20
    const d20 = rollD20Fn();
    const alwaysMiss = (d20 === 1);
    const isCrit = (d20 === 20);
    
    // Verificar acerto usando checkHit do groupCore
    const hit = !alwaysMiss && (isCrit || checkHit(d20, attacker, defender));
    
    let newState = state;
    
    // Log do d20
    newState = GroupBattleState.addLogEntry(
        newState,
        "D20_ROLL",
        `${attackerName} rolou ${d20}`,
        { actorId: action.actorId, roll: d20, isCrit, alwaysMiss }
    );
    
    if (!hit) {
        newState = GroupBattleState.addLogEntry(
            newState,
            "ATTACK_MISS",
            `${attackerName} errou o ataque em ${defenderName}`,
            { actorId: action.actorId, targetId: action.targetId }
        );
        return newState;
    }
    
    // Calcular dano usando calcDamage do groupCore
    const basicPower = 10; // Poder básico de ataque
    let power = isCrit ? basicPower * 2 : basicPower;
    
    // Aplicar multiplicador se for skill
    if (action.powerMultiplier) {
        power = Math.floor(power * action.powerMultiplier);
    }
    
    const atk = Number(attacker.atk) || 0;
    const def = Number(defender.def) || 0;
    
    const damage = calcDamage({
        atk,
        def,
        power,
        damageMult: 1.0 // Sem modificador de classe por enquanto
    });
    
    // Aplicar dano
    const newHp = Math.max(0, (Number(defender.hp) || 0) - damage);
    
    // Atualizar HP do defensor
    if (currentActor.side === "player") {
        // Jogador atacou inimigo
        newState = {
            ...newState,
            teams: {
                ...newState.teams,
                enemies: newState.teams.enemies.map((e, idx) =>
                    idx === action.targetId ? { ...e, hp: newHp } : e
                )
            }
        };
    } else {
        // Inimigo atacou jogador
        newState = {
            ...newState,
            teams: {
                ...newState.teams,
                players: newState.teams.players.map(pt =>
                    pt.playerId === action.targetId
                        ? { ...pt, activeMonster: { ...pt.activeMonster, hp: newHp } }
                        : pt
                )
            }
        };
    }
    
    // Log do ataque
    newState = GroupBattleState.addLogEntry(
        newState,
        "ATTACK_HIT",
        `${attackerName} acertou ${defenderName} causando ${damage} de dano${isCrit ? ' (CRÍTICO!)' : ''}`,
        { actorId: action.actorId, targetId: action.targetId, damage, isCrit, newHp }
    );
    
    // Verificar se matou
    if (newHp <= 0) {
        newState = GroupBattleState.addLogEntry(
            newState,
            "DEFEAT",
            `${defenderName} foi derrotado!`,
            { targetId: action.targetId }
        );
    }
    
    return newState;
}

/**
 * Executa habilidade (v1 simples)
 */
function performSkill(state, action, deps) {
    // V1: skill = ataque com dano aumentado
    const modifiedAction = {
        ...action,
        type: "attack",
        powerMultiplier: 1.5 // Skill causa 50% mais dano
    };
    
    let newState = performAttack(state, modifiedAction, deps);
    
    // Log adicional para skill
    newState = GroupBattleState.addLogEntry(
        newState,
        "SKILL_USED",
        `Habilidade usada!`,
        { actorId: action.actorId, skillId: action.skillId }
    );
    
    return newState;
}

/**
 * Executa uso de item (v1 apenas defensivos)
 */
function performItem(state, action, deps) {
    const { playersData = [] } = deps;
    
    const currentActor = getCurrentActor(state);
    let newState = state;
    
    // V1: apenas cura
    // Assumindo que itemId é algo como "potion" que cura 30% HP
    const healAmount = 30; // Valor fixo por enquanto
    
    if (currentActor.side === "player") {
        const playerTeam = state.teams.players.find(pt => pt.playerId === action.actorId);
        const monster = playerTeam?.activeMonster;
        
        if (monster) {
            const currentHp = Number(monster.hp) || 0;
            const maxHp = Number(monster.hpMax) || 1;
            const newHp = Math.min(maxHp, currentHp + healAmount);
            
            newState = {
                ...newState,
                teams: {
                    ...newState.teams,
                    players: newState.teams.players.map(pt =>
                        pt.playerId === action.actorId
                            ? { ...pt, activeMonster: { ...pt.activeMonster, hp: newHp } }
                            : pt
                    )
                }
            };
            
            const player = playersData.find(p => p.id === action.actorId);
            const playerName = player?.name || action.actorId;
            
            newState = GroupBattleState.addLogEntry(
                newState,
                "ITEM_USED",
                `${playerName} usou item e recuperou ${newHp - currentHp} HP`,
                { actorId: action.actorId, itemId: action.itemId, healing: newHp - currentHp }
            );
        }
    }
    
    return newState;
}

/**
 * Executa fuga individual
 */
function performFlee(state, action, deps) {
    const { playersData = [] } = deps;
    
    // Marcar jogador como fugido
    let newState = GroupBattleState.playerFlees(state, action.actorId);
    
    const player = playersData.find(p => p.id === action.actorId);
    const playerName = player?.name || action.actorId;
    
    // Log já adicionado por playerFlees, mas adicionar visual
    newState = GroupBattleState.addLogEntry(
        newState,
        "FLEE_ACTION",
        `🏃 ${playerName} fugiu da batalha e não receberá recompensas!`,
        { actorId: action.actorId }
    );
    
    return newState;
}

/**
 * Passa o turno
 */
function performPass(state, action, deps) {
    const { playersData = [] } = deps;
    
    const player = playersData.find(p => p.id === action.actorId);
    const playerName = player?.name || action.actorId;
    
    return GroupBattleState.addLogEntry(
        state,
        "PASS",
        `${playerName} passou o turno`,
        { actorId: action.actorId }
    );
}
