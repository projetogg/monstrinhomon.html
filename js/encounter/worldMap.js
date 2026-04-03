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
    arena:     '⚔️'
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
    arena:     '#9a6a2a'
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
 * Regra simplificada para o estado atual do projeto:
 * - Se `unlockDefault: true`, sempre desbloqueado
 * - Se o nodeId foi visitado (está em `visitedLocations`), desbloqueado
 * - Se um nó vizinho já foi visitado, desbloqueado
 *
 * @param {Object} node - Nó enriquecido
 * @param {Set<string>} visitedLocations - Set de IDs de localizações visitadas
 * @returns {boolean}
 */
export function isNodeUnlocked(node, visitedLocations = new Set()) {
    if (!node) return false;
    if (node.unlockDefault) return true;
    if (visitedLocations.has(node.nodeId)) return true;

    // Desbloqueado se algum nó conectado já foi visitado
    const connections = node.connections ?? [];
    return connections.some(connId => visitedLocations.has(connId));
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
