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
 *
 * { type: 'defeat_boss',            nodeId: 'BOSS_FOREST_01' }
 *   → Requer que o boss node nodeId tenha sido derrotado
 *     (verificado via nodeFlags[nodeId].bossDefeated === true)
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

        case 'defeat_boss':
            return nodeFlags[rule.nodeId]?.bossDefeated === true;

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
        case 'defeat_boss': {
            // Tentar pegar o nome do boss via locationsData, senão usar o nodeId
            const bossLoc = locationsData.find(l => l.id === rule.nodeId);
            const bossName = bossLoc?.bossName ?? bossLoc?.name ?? rule.nodeId;
            return `Derrote "${bossName}" para avançar`;
        }
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

/**
 * Verifica se um boss node foi derrotado.
 * Helper exportado para uso na UI.
 *
 * @param {string} bossNodeId
 * @param {Object} nodeFlags
 * @returns {boolean}
 */
export function isBossDefeated(bossNodeId, nodeFlags = {}) {
    if (!nodeFlags) return false;
    return nodeFlags[bossNodeId]?.bossDefeated === true;
}

// ── Tipos de Região (PR-12) ──────────────────────────────────────────────────

/**
 * Tipos válidos de região. Usado em bossMeta.regionType.
 *   main      → Parte da rota principal da campanha (obrigatório para avançar)
 *   optional  → Conteúdo paralelo/opcional (incentivado mas não bloqueante)
 *   side      → Rota lateral (preparado para uso futuro)
 *   postgame  → Conteúdo pós-campanha (preparado para uso futuro)
 */
export const REGION_TYPES = {
    MAIN:     'main',
    OPTIONAL: 'optional',
    SIDE:     'side',
    POSTGAME: 'postgame'
};

/**
 * Retorna o tipo de uma região a partir dos metadados do boss.
 * Garante fallback seguro para 'main' caso regionType não esteja definido,
 * mantendo compatibilidade com saves/dados antigos.
 *
 * @param {Object|null} bossMeta - bossMeta do nó boss (de worldMap.json)
 * @returns {'main'|'optional'|'side'|'postgame'}
 */
export function getRegionType(bossMeta) {
    if (!bossMeta) return REGION_TYPES.MAIN;
    const t = bossMeta.regionType;
    if (t === 'optional' || t === 'side' || t === 'postgame') return t;
    return REGION_TYPES.MAIN; // fallback seguro: assume rota principal
}

// ── Progressão Regional (PR-10 / PR-11) ─────────────────────────────────────

/**
 * Verifica se uma região/arco foi concluída.
 *
 * @param {string} regionId - ID da região (ex: 'forest_arc_1')
 * @param {Object} [regionalProgress={}] - Progresso regional do GameState
 * @returns {boolean}
 */
export function isRegionComplete(regionId, regionalProgress = {}) {
    if (!regionId || !regionalProgress) return false;
    return regionalProgress[regionId]?.completed === true;
}

// Fallback para nome de região desconhecida
const REGION_LABEL_FALLBACK = 'Região Desconhecida';

/**
 * Deriva um nome amigável a partir de um regionId técnico.
 * Usado como fallback quando bossMeta.regionLabel não está definido.
 *
 * Ex: 'forest_arc_1' → 'Forest Arc 1'
 *
 * @param {string} regionId
 * @returns {string}
 */
export function deriveRegionLabel(regionId) {
    if (!regionId) return REGION_LABEL_FALLBACK;
    return regionId
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

/**
 * Calcula o estado visual de uma região a partir do contexto de progresso.
 *
 * Estados possíveis:
 *   'completed'      → região foi concluída (boss derrotado + defeatMarksRegionComplete)
 *   'boss_available' → boss node acessível e não derrotado ainda (era 'in_progress')
 *   'active'         → progresso concreto na região (algum predecessor concluído), mas boss ainda bloqueado
 *   'available'      → algum nó vizinho do boss foi visitado mas não concluído, boss ainda bloqueado
 *   'locked'         → região não acessível
 *
 * @param {Object}      bossNode          - Nó boss do worldMap
 * @param {boolean}     completed         - Se a região já foi concluída
 * @param {boolean}     bossDefeated      - Mantido por retrocompatibilidade da assinatura pública;
 *                                        a lógica usa `completed` (derivado de regionalProgress)
 *                                        em vez de `bossDefeated` diretamente, pois um boss pode
 *                                        ser derrotado sem marcar a região como concluída.
 * @param {Set<string>} visitedLocations  - Locais visitados
 * @param {Set<string>} completedLocations - Locais concluídos
 * @param {Object}      nodeFlags         - Flags por nó
 * @param {Set<string>} completedQuestIds - Quest IDs concluídas
 * @returns {'completed'|'boss_available'|'active'|'available'|'locked'}
 */
export function getRegionStatus(
    bossNode,
    completed,
    bossDefeated,
    visitedLocations   = new Set(),
    completedLocations = new Set(),
    nodeFlags          = {},
    completedQuestIds  = new Set()
) {
    if (completed) return 'completed';

    // Verificar se o nó do boss está desbloqueado
    const bossUnlocked = isNodeUnlocked(
        bossNode,
        visitedLocations,
        completedLocations,
        nodeFlags,
        completedQuestIds
    );

    if (bossUnlocked) return 'boss_available';

    // Verificar se algum predecessor foi concluído (progresso concreto na região)
    const connections = bossNode.connections ?? [];
    const hasCompletedPredecessor = connections.some(connId => completedLocations.has(connId));
    if (hasCompletedPredecessor) return 'active';

    // Verificar se algum predecessor foi visitado (progresso leve)
    const hasVisitedPredecessor = connections.some(connId => visitedLocations.has(connId));
    return hasVisitedPredecessor ? 'available' : 'locked';
}

/**
 * Deriva o próximo objetivo macro para uma região com base em seu estado.
 *
 * @param {'completed'|'boss_available'|'active'|'available'|'locked'} status
 * @param {string} bossLabel - Nome amigável do boss
 * @param {string} regionLabel - Nome amigável da região
 * @returns {string|null} Texto do próximo objetivo, ou null se concluída
 */
export function getRegionNextObjective(status, bossLabel, regionLabel) {
    switch (status) {
        case 'completed':      return null;
        case 'boss_available': return `Derrote ${bossLabel}`;
        case 'active':         return `Continue explorando ${regionLabel} em direção ao ${bossLabel}`;
        case 'available':      return `Explore ${regionLabel}`;
        case 'locked':         return `Desbloqueie regiões anteriores para avançar`;
        default:               return null;
    }
}

/**
 * Calcula o estado de progresso de uma região ao derrotar um boss.
 * Retorna o objeto de progresso regional atualizado (imutável — não modifica o original).
 *
 * Chamado quando `bossMeta.defeatMarksRegionComplete === true`.
 *
 * @param {Object} bossMeta          - Metadados do boss node (de worldMap.json)
 * @param {string} bossNodeId        - ID do boss node que foi derrotado
 * @param {Object} [regionalProgress={}] - Estado atual de progresso regional
 * @param {string} [timestamp]       - ISO timestamp; usa Date.now() se omitido
 * @returns {Object} Novo objeto regionalProgress com a região marcada como concluída
 */
export function markRegionComplete(bossMeta, bossNodeId, regionalProgress = {}, timestamp) {
    if (!bossMeta || !bossMeta.defeatMarksRegionComplete || !bossMeta.regionId) {
        return regionalProgress ?? {};
    }

    const safeProgress = regionalProgress ?? {};
    const regionId = bossMeta.regionId;
    const ts       = timestamp ?? new Date().toISOString();

    // Não sobrescrever se já concluída anteriormente (idempotente)
    if (safeProgress[regionId]?.completed) return safeProgress;

    return {
        ...safeProgress,
        [regionId]: {
            completed:            true,
            completedByBossNodeId: bossNodeId,
            completedAt:           ts
        }
    };
}

// Bases de prioridade por tipo de região (maior = mais prioritário no painel)
const PRIORITY_BASE_MAIN     = 1000;
const PRIORITY_BASE_OPTIONAL = 500;
const PRIORITY_BASE_SIDE     = 200;
const PRIORITY_BASE_POSTGAME = 50;
const PRIORITY_QUEST_BONUS   = 300; // bônus máximo quando há quest ativa na região

/**
 * Escalas de quest bonus por tipo de região.
 * Quests em side/postgame inflam menos a prioridade para não roubarem o foco da campanha principal.
 */
const QUEST_BONUS_SCALE = {
    main:     1.0,
    optional: 1.0,
    side:     0.5,   // quest side não deve subir demais
    postgame: 0.25   // quest postgame quase não influencia prioridade
};

/**
 * Calcula o score de prioridade de uma região para ordenação e seleção de "atual".
 *
 * Critérios (maior = mais prioritário):
 *   - Tipo main vale mais que optional > side > postgame
 *   - Estados mais avançados valem mais (boss_available > active > available > locked)
 *   - Regiões com quest ativa ganham bônus, escalado pelo tipo (side/postgame recebem menos)
 *
 * @param {'main'|'optional'|'side'|'postgame'} regionType
 * @param {'completed'|'boss_available'|'active'|'available'|'locked'} status
 * @param {boolean} hasActiveQuest - Se há quest ativa nessa região
 * @returns {number}
 */
function _computePriorityScore(regionType, status, hasActiveQuest) {
    const typeBase =
        regionType === 'main'     ? PRIORITY_BASE_MAIN     :
        regionType === 'optional' ? PRIORITY_BASE_OPTIONAL :
        regionType === 'side'     ? PRIORITY_BASE_SIDE     :
        regionType === 'postgame' ? PRIORITY_BASE_POSTGAME : PRIORITY_BASE_SIDE;
    const statusBonus = {
        boss_available: 400,
        active:         300,
        available:      200,
        locked:         -200, // locked não deve superar regiões acessíveis de outro tipo
        completed:      -2000 // regiões concluídas ficam no final
    }[status] ?? 0;
    const scale = QUEST_BONUS_SCALE[regionType] ?? 0.5;
    const questBonus = hasActiveQuest ? Math.round(PRIORITY_QUEST_BONUS * scale) : 0;
    return typeBase + statusBonus + questBonus;
}

/**
 * Retorna um resumo do progresso regional a partir dos nós do mapa e nodeFlags.
 * Útil para render de painel de progresso de campanha (PR-11/PR-12/PR-14).
 *
 * Cada entrada retornada inclui:
 *   regionId                 - ID técnico interno da região
 *   regionLabel              - Nome amigável exibido na UI
 *   regionType               - 'main' | 'optional' | 'side' | 'postgame'
 *   regionFlavor             - Texto de sabor/contexto da região (se definido no bossMeta)
 *   isMainPath               - true se regionType === 'main'
 *   isOptional               - true se regionType === 'optional' (apenas optional, não side)
 *   isSide                   - true se regionType === 'side'
 *   isPostgame               - true se regionType === 'postgame'
 *   isMainFocus              - true para a primeira região main não concluída (foco principal)
 *   isSecondaryFocus         - true para a primeira região optional/side acessível não concluída
 *   bossNodeId               - ID do nó boss que fecha a região
 *   bossLabel                - Nome amigável do boss
 *   completed                - Se a região foi concluída
 *   bossDefeated             - Se o boss foi derrotado
 *   status                   - 'completed'|'boss_available'|'active'|'available'|'locked'
 *   isCurrent                - true para a região mais relevante no momento (retrocompat)
 *   nextObjective            - Texto do próximo objetivo, ou null se concluída
 *   priorityScore            - Score numérico para ordenação (maior = mais prioritário)
 *   hasActiveQuest           - true se há quest ativa nessa região (baseado em activeQuestLocalIds)
 *   questPriority            - 'main'|'secondary'|'side'|null — importância da quest ativa
 *
 * @param {Array<Object>} worldMapNodes          - Nós do worldMap.json
 * @param {Object}        [nodeFlags={}]         - Estado de flags por nó
 * @param {Object}        [regionalProgress={}]  - Progresso regional persistido
 * @param {Set<string>}   [visitedLocations=new Set()]    - Locais visitados (para status)
 * @param {Set<string>}   [completedLocations=new Set()]  - Locais concluídos (para status)
 * @param {Set<string>}   [completedQuestIds=new Set()]   - Quest IDs concluídas (para unlock)
 * @param {Set<string>}   [activeQuestLocalIds=new Set()] - LocalIds de quests ativas (para priorização)
 * @returns {Array<Object>} Ordenado por priorityScore descendente
 */
export function getRegionalProgressSummary(
    worldMapNodes,
    nodeFlags          = {},
    regionalProgress   = {},
    visitedLocations   = new Set(),
    completedLocations = new Set(),
    completedQuestIds  = new Set(),
    activeQuestLocalIds = new Set()
) {
    if (!Array.isArray(worldMapNodes)) return [];
    const safeFlags    = nodeFlags    ?? {};
    const safeProgress = regionalProgress ?? {};
    const safeVisited  = visitedLocations  instanceof Set ? visitedLocations  : new Set();
    const safeCompleted= completedLocations instanceof Set ? completedLocations : new Set();
    const safeQuests   = completedQuestIds  instanceof Set ? completedQuestIds  : new Set();
    const safeActiveQL = activeQuestLocalIds instanceof Set ? activeQuestLocalIds : new Set();

    const result = [];
    for (const node of worldMapNodes) {
        if (node.type !== 'boss') continue;
        const meta = node.bossMeta;
        if (!meta?.regionId) continue;

        const completed    = isRegionComplete(meta.regionId, safeProgress);
        const bossDefeated = safeFlags[node.nodeId]?.bossDefeated === true;
        const regionLabel  = meta.regionLabel ?? deriveRegionLabel(meta.regionId);
        const bossLabel    = meta.bossLabel ?? node.nodeId;
        const regionFlavor = meta.regionFlavor ?? null;
        const regionType   = getRegionType(meta);
        const isMainPath   = regionType === REGION_TYPES.MAIN;
        const isOptional   = regionType === REGION_TYPES.OPTIONAL;
        const isSide       = regionType === REGION_TYPES.SIDE;
        const isPostgame   = regionType === REGION_TYPES.POSTGAME;

        // Verificar se há quest ativa em algum nó conectado ao boss
        const connections = node.connections ?? [];
        const hasActiveQuest = connections.some(connId => safeActiveQL.has(connId));

        // Prioridade da quest ativa, derivada pelo tipo de região
        const questPriority = hasActiveQuest
            ? (regionType === 'main' ? 'main' : regionType === 'optional' ? 'secondary' : 'side')
            : null;

        const status = getRegionStatus(
            node,
            completed,
            bossDefeated,
            safeVisited,
            safeCompleted,
            safeFlags,
            safeQuests
        );

        const nextObjective = getRegionNextObjective(status, bossLabel, regionLabel);
        const priorityScore = _computePriorityScore(regionType, status, hasActiveQuest);

        result.push({
            regionId:      meta.regionId,
            regionLabel,
            regionType,
            regionFlavor,
            isMainPath,
            isOptional,
            isSide,
            isPostgame,
            bossNodeId:    node.nodeId,
            bossLabel,
            completed,
            bossDefeated,
            status,
            nextObjective,
            priorityScore,
            hasActiveQuest,
            questPriority
        });
    }

    // Ordenar por priorityScore descendente (maior prioridade primeiro)
    result.sort((a, b) => b.priorityScore - a.priorityScore);

    // Marcar "atual" como região não concluída de maior prioridade (retrocompat)
    const currentIdx = result.findIndex(r => r.status !== 'completed');

    // Marcar foco principal (primeira main não concluída) e foco secundário (primeira optional/side acessível)
    const mainFocusIdx      = result.findIndex(r => r.isMainPath && r.status !== 'completed');
    const secondaryFocusIdx = result.findIndex(
        r => (r.isOptional || r.isSide) && r.status !== 'completed' && r.status !== 'locked'
    );

    return result.map((r, i) => ({
        ...r,
        isCurrent:       i === currentIdx,
        isMainFocus:     i === mainFocusIdx && mainFocusIdx !== -1,
        isSecondaryFocus: i === secondaryFocusIdx && secondaryFocusIdx !== -1
    }));
}

/**
 * Deriva o próximo objetivo principal, as oportunidades opcionais e as oportunidades side
 * disponíveis a partir do summary de progresso regional.
 *
 * Separação semântica clara:
 *   nextMainObjective     → texto do próximo passo na rota principal (ou null)
 *   optionalOpportunities → array de textos de regiões optional acessíveis (não side)
 *   sideOpportunities     → array de textos de regiões side acessíveis (conteúdo lateral)
 *
 * Lógica de seleção do objetivo principal (em ordem de prioridade):
 *   1. Boss de região main disponível (status boss_available)
 *   2. Região main com quest ativa (status active ou available)
 *   3. Região main ativa/em progresso (status active)
 *   4. Região main disponível (status available)
 *   5. Fallback: qualquer região main não concluída (status não completed)
 *
 * @param {Array<Object>} summary - Resultado de getRegionalProgressSummary()
 * @returns {{ nextMainObjective: string|null, optionalOpportunities: string[], sideOpportunities: string[] }}
 */
export function deriveMainObjective(summary) {
    if (!Array.isArray(summary)) return { nextMainObjective: null, optionalOpportunities: [], sideOpportunities: [] };

    const mainRegions = summary.filter(r => r.isMainPath && r.status !== 'completed');

    // Seleção robusta do objetivo principal: boss > quest ativa > active > available > qualquer
    let nextMain =
        mainRegions.find(r => r.status === 'boss_available') ??
        mainRegions.find(r => r.hasActiveQuest && (r.status === 'active' || r.status === 'available')) ??
        mainRegions.find(r => r.status === 'active') ??
        mainRegions.find(r => r.status === 'available') ??
        mainRegions[0] ?? null;

    const nextMainObjective = nextMain?.nextObjective ?? null;

    // Oportunidades opcionais: apenas regiões 'optional' acessíveis (não side, não completed, não locked)
    // Ordenadas: boss disponível > quest ativa > já iniciada > recém desbloqueada
    const optionalOpportunities = summary
        .filter(r => r.isOptional && r.status !== 'completed' && r.status !== 'locked')
        .map(r => r.nextObjective)
        .filter(Boolean);

    // Oportunidades side: regiões 'side' acessíveis (não completed, não locked)
    const sideOpportunities = summary
        .filter(r => r.isSide && r.status !== 'completed' && r.status !== 'locked')
        .map(r => r.nextObjective)
        .filter(Boolean);

    return { nextMainObjective, optionalOpportunities, sideOpportunities };
}

/**
 * Verifica se uma quest deve ser considerada concluída com base na conclusão regional.
 * Suporte a objectiveType: 'complete_region' com targetRegionId.
 *
 * @param {Object} quest              - Quest com objectiveType e targetRegionId
 * @param {Object} [regionalProgress={}]
 * @returns {boolean}
 */
export function isQuestRegionObjectiveComplete(quest, regionalProgress = {}) {
    if (!quest || quest.objectiveType !== 'complete_region') return false;
    if (!quest.targetRegionId) return false;
    return isRegionComplete(quest.targetRegionId, regionalProgress ?? {});
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
