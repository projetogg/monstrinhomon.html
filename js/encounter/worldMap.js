/**
 * WORLD MAP ENGINE — Lógica pura de navegação por nós
 *
 * Funções puras (zero side effects, zero DOM) para:
 * - Listar nós do mapa mundial
 * - Checar desbloqueios
 * - Obter spots de uma localização
 * - Construir modificadores de spot para o encounterEngine
 *
 * O mapa de nós define o grafo de navegação do mundo.
 * Cada nó aponta para uma localização em locations.json.
 *
 * ── Tipos de unlockRule ──────────────────────────────────────────────────
 *
 * { type: 'complete_node',          nodeId: 'LOC_001' }
 *   → Requer que o nó nodeId esteja em completedLocations
 *
 * { type: 'win_n_battles_in_node',  nodeId: 'LOC_001', n: 3 }
 *   → Requer n vitórias em wild no nó nodeId (tracked em nodeFlags.wildWins)
 *
 * { type: 'visit_city',             cityId: 'CITY_001' }
 *   → Requer que a cidade cityId esteja em visitedLocations
 *
 * { type: 'complete_quest',         questId: 'QST_001', playerId?: string }
 *   → Requer que a quest esteja em completedQuestIds de algum jogador
 *     (verificado externamente; isNodeUnlocked recebe completedQuestIds como Set)
 */

// ── Emojis por bioma ────────────────────────────────────────────────────────

export const BIOME_EMOJI = {
    campos:    '🌾',
    floresta:  '🌲',
    minas:     '⛏️',
    ruinas:    '🏛️',
    costa:     '🌊',
    vulcanico: '🌋',
    noturno:   '🌑',
    arena:     '⚔️',
    cidade:    '🏙️'
};

// Cores de fundo por bioma (para uso em CSS)
export const BIOME_COLOR = {
    campos:    '#a8d5a2',
    floresta:  '#3d7a3d',
    minas:     '#7a6a5a',
    ruinas:    '#8a7a6a',
    costa:     '#4a90c4',
    vulcanico: '#c44a3a',
    noturno:   '#2a2a4a',
    arena:     '#9a6a2a',
    cidade:    '#7a8fc4'
};

// ── API principal ────────────────────────────────────────────────────────────

/**
 * Retorna a lista de nós do mapa, enriquecidos com dados da localização.
 *
 * @param {Array<Object>} worldMapNodes - Array de nós do worldMap.json
 * @param {Array<Object>} locationsData - Array de localizações do locations.json
 * @returns {Array<Object>} Nós enriquecidos com dados de localização
 */
export function getEnrichedNodes(worldMapNodes, locationsData) {
    if (!Array.isArray(worldMapNodes) || !Array.isArray(locationsData)) return [];

    const locMap = new Map(locationsData.map(l => [l.id, l]));

    return worldMapNodes.map(node => {
        const loc = locMap.get(node.nodeId);
        if (!loc) return null;
        return {
            ...node,
            name: loc.name,
            description: loc.description,
            biome: loc.biome,
            tier: loc.tier,
            levelRange: loc.levelRange,
            spots: loc.spots ?? [],
            biomeEmoji: BIOME_EMOJI[loc.biome] ?? '🗺️',
            biomeColor: BIOME_COLOR[loc.biome] ?? '#888'
        };
    }).filter(Boolean);
}

/**
 * Verifica se um nó está desbloqueado com base no progresso do jogo.
 *
 * Prioridade de avaliação:
 * 1. unlockDefault: true → sempre desbloqueado
 * 2. nodeId em visitedLocations → pode revisitar
 * 3. unlockRule explícita → avaliada com contexto de progresso
 * 4. Fallback legado: algum vizinho em completedLocations (sem regra explícita)
 *
 * @param {Object}      node               - Nó enriquecido
 * @param {Set<string>} visitedLocations   - IDs visitados (para revisita)
 * @param {Set<string>} completedLocations - IDs concluídos (progressão)
 * @param {Object}      [nodeFlags={}]     - Flags por nó { [nodeId]: { wildWins } }
 * @param {Set<string>} [completedQuestIds=new Set()] - Quest IDs concluídas (todos os jogadores)
 * @returns {boolean}
 */
export function isNodeUnlocked(
    node,
    visitedLocations   = new Set(),
    completedLocations = new Set(),
    nodeFlags          = {},
    completedQuestIds  = new Set()
) {
    if (!node) return false;
    if (node.unlockDefault) return true;
    if (visitedLocations.has(node.nodeId)) return true;

    // Avaliar unlockRule explícita
    const rule = node.unlockRule;
    if (rule) {
        return _evaluateUnlockRule(rule, completedLocations, nodeFlags, completedQuestIds, visitedLocations);
    }

    // Fallback legado: vizinho concluído desbloqueia
    const connections = node.connections ?? [];
    return connections.some(connId => completedLocations.has(connId));
}

/**
 * Avalia uma unlockRule e retorna true se a condição for satisfeita.
 * @private
 */
function _evaluateUnlockRule(rule, completedLocations, nodeFlags, completedQuestIds, visitedLocations) {
    if (!rule || !rule.type) return false;

    switch (rule.type) {
        case 'complete_node':
            return completedLocations.has(rule.nodeId);

        case 'win_n_battles_in_node': {
            const wins = nodeFlags[rule.nodeId]?.wildWins ?? 0;
            return wins >= (rule.n ?? 1);
        }

        case 'visit_city':
            return visitedLocations.has(rule.cityId);

        case 'complete_quest':
            return completedQuestIds.has(rule.questId);

        default:
            return false;
    }
}

/**
 * Retorna uma string descrevendo o motivo pelo qual o nó está bloqueado.
 * Útil para exibir na UI ("Complete X para desbloquear").
 *
 * @param {Object}      node
 * @param {Set<string>} completedLocations
 * @param {Object}      nodeFlags
 * @param {Set<string>} completedQuestIds
 * @param {Set<string>} visitedLocations
 * @param {Array<Object>} [locationsData=[]]
 * @returns {string}
 */
export function getNodeLockReason(
    node,
    completedLocations = new Set(),
    nodeFlags          = {},
    completedQuestIds  = new Set(),
    visitedLocations   = new Set(),
    locationsData      = []
) {
    if (!node) return '';

    const rule = node.unlockRule;
    if (!rule) {
        // Fallback legado: encontrar vizinho que precisa ser concluído
        const connections = node.connections ?? [];
        const needed = connections.find(c => !completedLocations.has(c));
        if (needed) {
            const loc = locationsData.find(l => l.id === needed);
            return `Complete "${loc?.name ?? needed}" para desbloquear`;
        }
        return 'Bloqueado';
    }

    switch (rule.type) {
        case 'complete_node': {
            const loc = locationsData.find(l => l.id === rule.nodeId);
            return `Complete "${loc?.name ?? rule.nodeId}" para desbloquear`;
        }
        case 'win_n_battles_in_node': {
            const wins = nodeFlags[rule.nodeId]?.wildWins ?? 0;
            const loc  = locationsData.find(l => l.id === rule.nodeId);
            return `Vença ${rule.n ?? 1} batalha(s) em "${loc?.name ?? rule.nodeId}" (${wins}/${rule.n ?? 1})`;
        }
        case 'visit_city': {
            const loc = locationsData.find(l => l.id === rule.cityId);
            return `Visite "${loc?.name ?? rule.cityId}" primeiro`;
        }
        case 'complete_quest':
            return `Conclua a missão ${rule.questId} para desbloquear`;
        default:
            return 'Bloqueado';
    }
}

/**
 * Retorna os spots de uma localização pelo ID.
 *
 * @param {string} locationId - ID da localização
 * @param {Array<Object>} locationsData - Array de localizações
 * @returns {Array<Object>} Spots da localização
 */
export function getSpotsForLocation(locationId, locationsData) {
    if (!locationId || !Array.isArray(locationsData)) return [];
    const loc = locationsData.find(l => l.id === locationId);
    return loc?.spots ?? [];
}

/**
 * Encontra um spot pelo ID em todas as localizações.
 *
 * @param {string} spotId - ID do spot (ex: 'LOC_001_A')
 * @param {Array<Object>} locationsData - Array de localizações
 * @returns {Object|null} O spot, ou null se não encontrado
 */
export function findSpot(spotId, locationsData) {
    if (!spotId || !Array.isArray(locationsData)) return null;
    for (const loc of locationsData) {
        const spot = (loc.spots ?? []).find(s => s.id === spotId);
        if (spot) return spot;
    }
    return null;
}

/**
 * Extrai o locationId de um spotId (convenção: 'LOC_001_A' → 'LOC_001').
 *
 * Convenção de nomenclatura de spots:
 *   `LOC_<id>_<letra>` onde `<letra>` é uma única letra maiúscula (A–Z).
 * Se a convenção mudar para suportar mais de 26 spots por local,
 * atualize este regex e o padrão de ID em locations.json.
 *
 * @param {string} spotId - ID do spot
 * @returns {string|null}
 */
export function locationIdFromSpotId(spotId) {
    if (!spotId) return null;
    // Formato: LOC_XXX_Y ou LOC_XXXB_Y
    const match = spotId.match(/^(LOC_\w+)_[A-Z]$/);
    return match ? match[1] : null;
}

/**
 * Retorna os modificadores de raridade de um spot, no formato esperado
 * pelo encounterEngine.applyModifiers().
 *
 * @param {Object|null} spot - Dados do spot
 * @returns {Array<{rarity: string, delta: number}>}
 */
export function buildSpotModifiers(spot) {
    if (!spot || !Array.isArray(spot.rarityModifiers)) return [];
    return spot.rarityModifiers.filter(
        m => m && typeof m.rarity === 'string' && typeof m.delta === 'number'
    );
}

// ── Perfis formais de spot ───────────────────────────────────────────────────

/**
 * Perfis canônicos de spot.
 * Cada perfil define deltas de modificadores de encontro além dos rarityModifiers.
 *
 * trainerChanceDelta : ajuste no peso de Treinador em encounterTypeWeights
 * itemBonusDelta     : ajuste no peso de Item em encounterTypeWeights
 * eventBonusDelta    : ajuste no peso de Evento em encounterTypeWeights
 * levelDelta         : deslocamento inteiro aplicado ao nível sorteado (pode ser negativo)
 *
 * Diferenças semânticas chave:
 *   combat   vs trainer  → combat = perigo bruto (nível maior, sem treinador específico);
 *                          trainer = encontro tático estruturado (treinadores altos, nível estável)
 *   resource vs event    → resource = farm previsível e seguro (muito item, nível menor);
 *                          event = imprevisibilidade narrativa (boost de Evento, variação)
 *   rare                 → custo real: perde acesso a item e treinador em troca de raridade
 */
export const SPOT_PROFILE_DEFAULTS = {
    capture:  { label: 'Captura',   icon: '🎯', trainerChanceDelta: -5,  itemBonusDelta: +3,  eventBonusDelta:  0,  levelDelta:  0 },
    combat:   { label: 'Combate',   icon: '⚔️', trainerChanceDelta: -3,  itemBonusDelta: -5,  eventBonusDelta:  0,  levelDelta: +2 },
    rare:     { label: 'Raridade',  icon: '✨', trainerChanceDelta: -5,  itemBonusDelta: -5,  eventBonusDelta:  0,  levelDelta:  0 },
    resource: { label: 'Recurso',   icon: '💎', trainerChanceDelta: -5,  itemBonusDelta: +10, eventBonusDelta:  0,  levelDelta: -1 },
    event:    { label: 'Evento',    icon: '🎭', trainerChanceDelta: +3,  itemBonusDelta: +2,  eventBonusDelta: +8,  levelDelta:  0 },
    trainer:  { label: 'Treinador', icon: '🧑‍🏫', trainerChanceDelta: +18, itemBonusDelta: -5,  eventBonusDelta:  0,  levelDelta:  0 },
    service:  { label: 'Serviço',   icon: '🏪', trainerChanceDelta:  0,  itemBonusDelta:  0,  eventBonusDelta:  0,  levelDelta:  0 }
};

/**
 * Fallback para spots sem profileKey definido — garante compatibilidade retroativa
 * com spots legados que ainda não foram migrados para o sistema de profileKey.
 * Retorna modificadores neutros (sem impacto no encontro).
 * @private
 */
const SPOT_PROFILE_FALLBACK = { label: 'Exploração', icon: '🗺️', trainerChanceDelta: 0, itemBonusDelta: 0, eventBonusDelta: 0, levelDelta: 0 };

/**
 * Retorna o contexto completo de modificadores de um spot para uso pelo encounterEngine.
 *
 * Combina:
 * 1. rarityModifiers do spot (para applyModifiers)
 * 2. Defaults do profileKey (trainerChanceDelta, itemBonusDelta, levelDelta)
 * 3. encounterModifiers do spot (override individual, se existir)
 *
 * O campo `encounterModifiers` no JSON pode sobrescrever qualquer campo do perfil padrão:
 * {
 *   "trainerChanceDelta": 12,
 *   "itemBonusDelta": -5,
 *   "levelDelta": 2
 * }
 *
 * @param {Object|null} spot - Dados do spot (de locations.json)
 * @returns {{
 *   profileKey: string,
 *   label: string,
 *   icon: string,
 *   rarityMods: Array<{rarity: string, delta: number}>,
 *   trainerChanceDelta: number,
 *   itemBonusDelta: number,
 *   eventBonusDelta: number,
 *   levelDelta: number
 * }}
 */
export function getSpotEncounterContext(spot) {
    if (!spot) {
        return {
            profileKey: 'fallback',
            label: SPOT_PROFILE_FALLBACK.label,
            icon:  SPOT_PROFILE_FALLBACK.icon,
            rarityMods: [],
            trainerChanceDelta: 0,
            itemBonusDelta: 0,
            eventBonusDelta: 0,
            levelDelta: 0
        };
    }

    const profileKey = spot.profileKey ?? 'fallback';
    const profileDefaults = SPOT_PROFILE_DEFAULTS[profileKey] ?? SPOT_PROFILE_FALLBACK;

    // Overrides individuais do spot (campo encounterModifiers no JSON)
    const overrides = (spot.encounterModifiers && typeof spot.encounterModifiers === 'object')
        ? spot.encounterModifiers
        : {};

    const rarityMods = buildSpotModifiers(spot);

    return {
        profileKey,
        label: profileDefaults.label,
        icon:  profileDefaults.icon,
        rarityMods,
        trainerChanceDelta: overrides.trainerChanceDelta ?? profileDefaults.trainerChanceDelta ?? 0,
        itemBonusDelta:     overrides.itemBonusDelta     ?? profileDefaults.itemBonusDelta     ?? 0,
        eventBonusDelta:    overrides.eventBonusDelta    ?? profileDefaults.eventBonusDelta    ?? 0,
        levelDelta:         overrides.levelDelta         ?? profileDefaults.levelDelta         ?? 0
    };
}
