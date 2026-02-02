/**
 * GROUP BATTLE STATE (v1.0) - Estrutura Completa
 * 
 * A batalha em grupo é um "objeto de estado" que guarda tudo que está 
 * acontecendo naquela luta.
 * 
 * Este módulo fornece a estrutura de dados e funções factory para criar
 * e manipular estados de batalha em grupo.
 * 
 * REGRAS:
 * - IDs são imutáveis uma vez criados
 * - Estado é imutável - funções retornam novos estados
 * - Todas as transições de estado devem ser explícitas
 * - Log é append-only (nunca remove entradas)
 */

/**
 * Cria um novo GroupBattleState
 * 
 * @param {Object} params - Parâmetros de inicialização
 * @param {string} params.kind - Tipo da batalha: "trainer" ou "boss"
 * @param {Array<string>} params.eligiblePlayerIds - IDs de todos jogadores que podem participar
 * @param {Array<string>} params.initialParticipants - IDs dos jogadores que entram inicialmente
 * @param {Array<Object>} params.enemies - Array de inimigos
 * @param {Object} params.rules - Regras opcionais (usa defaults se não fornecido)
 * @param {Object} params.rewards - Recompensas opcionais (usa defaults se não fornecido)
 * @returns {Object} Novo GroupBattleState
 */
export function createGroupBattleState(params) {
    const {
        kind,
        eligiblePlayerIds = [],
        initialParticipants = [],
        enemies = [],
        rules = {},
        rewards = {}
    } = params;

    // Validação
    if (!kind || (kind !== "trainer" && kind !== "boss")) {
        throw new Error("kind deve ser 'trainer' ou 'boss'");
    }

    if (!Array.isArray(eligiblePlayerIds) || eligiblePlayerIds.length === 0) {
        throw new Error("eligiblePlayerIds deve ser array não vazio");
    }

    if (!Array.isArray(initialParticipants) || initialParticipants.length === 0) {
        throw new Error("initialParticipants deve ser array não vazio");
    }

    // Validar que initialParticipants são elegíveis
    for (const pid of initialParticipants) {
        if (!eligiblePlayerIds.includes(pid)) {
            throw new Error(`Participante ${pid} não está em eligiblePlayerIds`);
        }
    }

    // Gerar ID único baseado em timestamp
    const id = `GB_${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}_${Math.random().toString(36).slice(2, 5)}`;

    // Regras padrão
    const defaultRules = {
        allowCapture: false,          // batalhas em grupo = sem captura
        allowItems: true,
        allowFlee: true,
        fleeIsIndividual: true,       // cada um foge sozinho
        allowLateJoin: true,          // reforço possível
        oneActiveMonsterPerPlayer: true
    };

    // Recompensas padrão
    const defaultRewards = {
        xp: { base: 0, perParticipant: 0 },
        money: { base: 0, split: "equal" },
        items: []
    };

    // Criar participantes iniciais com metadata
    const participants = initialParticipants.map(pid => ({
        playerId: pid,
        joinedAtRound: 1,
        isActive: true
    }));

    // Calcular quem não entrou
    const notJoined = eligiblePlayerIds.filter(pid => !initialParticipants.includes(pid));

    return {
        // 1. Identidade e tipo
        id,
        kind,
        status: "active",

        // 2. Roster (quem entra, quem sai, quem pode entrar depois)
        roster: {
            eligiblePlayerIds: [...eligiblePlayerIds],
            participants,
            notJoined: [...notJoined],
            escaped: [],
            reinforcementsQueue: []
        },

        // 3. Teams (quem luta de fato)
        teams: {
            players: [],    // Será preenchido ao associar monstros ativos
            enemies: enemies.map((enemy, idx) => ({
                enemyId: `E${idx + 1}`,
                type: enemy.type || (kind === "boss" && idx === 0 ? "boss" : "minion"),
                name: enemy.name || enemy.nome || `Inimigo ${idx + 1}`,
                hp: enemy.hp || enemy.hpMax || 50,
                hpMax: enemy.hpMax || 50,
                spd: enemy.spd || 5,
                atk: enemy.atk || 5,
                def: enemy.def || 5,
                cls: enemy.class || enemy.cls || "Guerreiro",
                ai: enemy.ai || "basic",
                status: []
            }))
        },

        // 4. Turnos (fase + ordem + ator atual)
        turn: {
            phase: "players",           // "players" ou "enemies"
            order: [],                  // Será calculado ao iniciar batalha
            index: 0,
            currentActorId: null,
            round: 1,
            visibleBanner: "Iniciando batalha..."
        },

        // 5. Regras desta batalha
        rules: { ...defaultRules, ...rules },

        // 6. Recompensas
        rewards: {
            xp: { ...defaultRewards.xp, ...(rewards.xp || {}) },
            money: { ...defaultRewards.money, ...(rewards.money || {}) },
            items: rewards.items || []
        },

        // 7. Log para UI e para modo terapeuta
        log: [
            {
                t: Date.now(),
                type: "BATTLE_START",
                text: `Batalha em grupo iniciada (${kind})`,
                meta: { kind, participantCount: initialParticipants.length }
            }
        ]
    };
}

/**
 * Adiciona entrada ao log
 * 
 * @param {Object} state - GroupBattleState
 * @param {string} type - Tipo do evento (ex: "TURN_START", "ACTION", "FLEE")
 * @param {string} text - Texto descritivo
 * @param {Object} meta - Metadata adicional (opcional)
 * @returns {Object} Novo estado com log atualizado
 */
export function addLogEntry(state, type, text, meta = {}) {
    return {
        ...state,
        log: [
            ...state.log,
            {
                t: Date.now(),
                type,
                text,
                meta
            }
        ]
    };
}

/**
 * Adiciona jogador à fila de reforços
 * 
 * @param {Object} state - GroupBattleState
 * @param {string} playerId - ID do jogador
 * @returns {Object} Novo estado com reforço na fila
 */
export function requestReinforcement(state, playerId) {
    // Verificar se já está na fila
    const alreadyQueued = state.roster.reinforcementsQueue.some(r => r.playerId === playerId);
    if (alreadyQueued) {
        return state; // Já está na fila, não fazer nada
    }

    // Validar que jogador está em notJoined
    if (!state.roster.notJoined.includes(playerId)) {
        throw new Error(`Jogador ${playerId} não pode pedir reforço (não está em notJoined)`);
    }

    const newState = {
        ...state,
        roster: {
            ...state.roster,
            reinforcementsQueue: [
                ...state.roster.reinforcementsQueue,
                {
                    playerId,
                    requestedAtRound: state.turn.round
                }
            ],
            notJoined: state.roster.notJoined.filter(pid => pid !== playerId)
        }
    };

    return addLogEntry(
        newState,
        "REINFORCEMENT_REQUEST",
        `Jogador ${playerId} solicitou entrar na batalha`,
        { playerId, round: state.turn.round }
    );
}

/**
 * Processa fuga de um jogador
 * 
 * @param {Object} state - GroupBattleState
 * @param {string} playerId - ID do jogador que foge
 * @returns {Object} Novo estado com jogador marcado como fugido
 */
export function playerFlees(state, playerId) {
    // Verificar se jogador está participando
    const participant = state.roster.participants.find(p => p.playerId === playerId && p.isActive);
    if (!participant) {
        throw new Error(`Jogador ${playerId} não pode fugir (não está ativo na batalha)`);
    }

    const newState = {
        ...state,
        roster: {
            ...state.roster,
            participants: state.roster.participants.map(p =>
                p.playerId === playerId
                    ? { ...p, isActive: false }
                    : p
            ),
            escaped: [
                ...state.roster.escaped,
                {
                    playerId,
                    escapedAtRound: state.turn.round
                }
            ]
        }
    };

    return addLogEntry(
        newState,
        "FLEE",
        `Jogador ${playerId} fugiu da batalha`,
        { playerId, round: state.turn.round }
    );
}

/**
 * Aplica reforços da fila (deve ser chamado no início da fase dos jogadores)
 * 
 * @param {Object} state - GroupBattleState
 * @returns {Object} Novo estado com reforços aplicados
 */
export function applyReinforcementsIfAny(state) {
    if (!state.rules.allowLateJoin || state.roster.reinforcementsQueue.length === 0) {
        return state; // Sem reforços para aplicar
    }

    const currentRound = state.turn.round;
    let newState = { ...state };

    // Processar todos os reforços na fila
    for (const reinforcement of state.roster.reinforcementsQueue) {
        newState = {
            ...newState,
            roster: {
                ...newState.roster,
                participants: [
                    ...newState.roster.participants,
                    {
                        playerId: reinforcement.playerId,
                        joinedAtRound: currentRound,
                        isActive: true
                    }
                ],
                reinforcementsQueue: newState.roster.reinforcementsQueue.filter(
                    r => r.playerId !== reinforcement.playerId
                )
            }
        };

        newState = addLogEntry(
            newState,
            "REINFORCEMENT_JOIN",
            `Jogador ${reinforcement.playerId} entrou na batalha como reforço`,
            { playerId: reinforcement.playerId, round: currentRound }
        );
    }

    return newState;
}

/**
 * Atualiza fase do turno
 * 
 * @param {Object} state - GroupBattleState
 * @param {string} phase - Nova fase ("players" ou "enemies")
 * @returns {Object} Novo estado com fase atualizada
 */
export function setTurnPhase(state, phase) {
    if (phase !== "players" && phase !== "enemies") {
        throw new Error("phase deve ser 'players' ou 'enemies'");
    }

    const banner = phase === "players" ? "Vez dos Jogadores" : "Vez dos Inimigos";

    const newState = {
        ...state,
        turn: {
            ...state.turn,
            phase,
            visibleBanner: banner
        }
    };

    return addLogEntry(
        newState,
        "TURN_PHASE",
        banner,
        { phase, round: state.turn.round }
    );
}

/**
 * Incrementa rodada
 * 
 * @param {Object} state - GroupBattleState
 * @returns {Object} Novo estado com rodada incrementada
 */
export function incrementRound(state) {
    const newRound = state.turn.round + 1;

    const newState = {
        ...state,
        turn: {
            ...state.turn,
            round: newRound
        }
    };

    return addLogEntry(
        newState,
        "ROUND_START",
        `Rodada ${newRound} iniciada`,
        { round: newRound }
    );
}

/**
 * Finaliza batalha
 * 
 * @param {Object} state - GroupBattleState
 * @param {string} result - Resultado: "victory" ou "defeat"
 * @returns {Object} Novo estado finalizado
 */
export function endBattle(state, result) {
    if (result !== "victory" && result !== "defeat") {
        throw new Error("result deve ser 'victory' ou 'defeat'");
    }

    const text = result === "victory"
        ? "🏁 Vitória! Todos os inimigos foram derrotados."
        : "💀 Derrota... Todos os participantes foram derrotados.";

    const newState = {
        ...state,
        status: "ended"
    };

    return addLogEntry(
        newState,
        "BATTLE_END",
        text,
        { result }
    );
}

/**
 * Calcula participantes ativos (não fugiram)
 * 
 * @param {Object} state - GroupBattleState
 * @returns {Array<Object>} Array de participantes ativos
 */
export function getActiveParticipants(state) {
    return state.roster.participants.filter(p => p.isActive);
}

/**
 * Calcula jogadores que podem receber recompensas
 * (participaram e não fugiram)
 * 
 * @param {Object} state - GroupBattleState
 * @returns {Array<string>} Array de IDs de jogadores
 */
export function getRewardEligiblePlayers(state) {
    return getActiveParticipants(state).map(p => p.playerId);
}

/**
 * Valida se o estado está consistente
 * 
 * @param {Object} state - GroupBattleState
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateState(state) {
    const errors = [];

    // Validar campos obrigatórios
    if (!state.id) errors.push("id é obrigatório");
    if (!state.kind || (state.kind !== "trainer" && state.kind !== "boss")) {
        errors.push("kind deve ser 'trainer' ou 'boss'");
    }
    if (!state.status || (state.status !== "active" && state.status !== "ended")) {
        errors.push("status deve ser 'active' ou 'ended'");
    }

    // Validar roster
    if (!state.roster) {
        errors.push("roster é obrigatório");
    } else {
        if (!Array.isArray(state.roster.eligiblePlayerIds)) {
            errors.push("roster.eligiblePlayerIds deve ser array");
        }
        if (!Array.isArray(state.roster.participants)) {
            errors.push("roster.participants deve ser array");
        }
        if (!Array.isArray(state.roster.notJoined)) {
            errors.push("roster.notJoined deve ser array");
        }
        if (!Array.isArray(state.roster.escaped)) {
            errors.push("roster.escaped deve ser array");
        }
        if (!Array.isArray(state.roster.reinforcementsQueue)) {
            errors.push("roster.reinforcementsQueue deve ser array");
        }
    }

    // Validar teams
    if (!state.teams) {
        errors.push("teams é obrigatório");
    } else {
        if (!Array.isArray(state.teams.players)) {
            errors.push("teams.players deve ser array");
        }
        if (!Array.isArray(state.teams.enemies)) {
            errors.push("teams.enemies deve ser array");
        }
    }

    // Validar turn
    if (!state.turn) {
        errors.push("turn é obrigatório");
    } else {
        if (state.turn.phase !== "players" && state.turn.phase !== "enemies") {
            errors.push("turn.phase deve ser 'players' ou 'enemies'");
        }
        if (!Array.isArray(state.turn.order)) {
            errors.push("turn.order deve ser array");
        }
        if (typeof state.turn.index !== "number") {
            errors.push("turn.index deve ser número");
        }
        if (typeof state.turn.round !== "number" || state.turn.round < 1) {
            errors.push("turn.round deve ser número >= 1");
        }
    }

    // Validar log
    if (!Array.isArray(state.log)) {
        errors.push("log deve ser array");
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
