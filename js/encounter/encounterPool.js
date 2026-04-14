/**
 * ENCOUNTER POOL MODULE
 *
 * Fornece acesso ao pool de encontros de cada nó do mapa.
 * Consome worldMap.json via encounterPool[] e ENCOUNTERS.csv (via Data module quando disponível).
 *
 * Funções:
 *   getEncounterPoolForNode(nodeId, worldMapNodes) → string[]
 *   getWildEncountersForNode(nodeId, worldMapNodes) → string[]
 *   getTrainerEncountersForNode(nodeId, worldMapNodes) → string[]
 *   pickRandomEncounterId(nodeId, worldMapNodes, encounterType?) → string|null
 */

const ENCOUNTER_TYPES = {
    WILD: 'Selvagem',
    TRAINER: 'Treinador',
    BOSS: 'Boss'
};

export { ENCOUNTER_TYPES };

/**
 * Retorna o encounterPool de um nó do mapa (array de IDs de encontro).
 * @param {string} nodeId - ID do nó (ex: 'LOC_001')
 * @param {Object[]} worldMapNodes - Array de nós de worldMap.json
 * @returns {string[]} Array de encounter IDs (pode ser vazio)
 */
export function getEncounterPoolForNode(nodeId, worldMapNodes) {
    if (!nodeId || !Array.isArray(worldMapNodes)) return [];
    const node = worldMapNodes.find(n => n.nodeId === nodeId);
    if (!node) return [];
    return Array.isArray(node.encounterPool) ? node.encounterPool : [];
}

/**
 * Retorna os encounter IDs de um nó filtrando por tipo.
 * Requer os dados de encounters para filtrar por tipo.
 * @param {string} nodeId
 * @param {Object[]} worldMapNodes
 * @param {Object} encountersData - Map ou objeto { [encId]: { tipo_encontro, ... } }
 * @param {string} type - 'Selvagem' | 'Treinador' | 'Boss'
 * @returns {string[]}
 */
export function getEncountersByType(nodeId, worldMapNodes, encountersData, type) {
    const pool = getEncounterPoolForNode(nodeId, worldMapNodes);
    if (!pool.length || !encountersData) return pool;

    return pool.filter(encId => {
        const enc = encountersData instanceof Map
            ? encountersData.get(encId)
            : encountersData[encId];
        if (!enc) return false;
        return enc.tipo_encontro === type || enc.tipo === type;
    });
}

/**
 * Escolhe aleatoriamente um encounter ID do pool de um nó.
 * @param {string} nodeId
 * @param {Object[]} worldMapNodes
 * @param {string[]} [excludeIds] - IDs a excluir (ex: boss já derrotado)
 * @returns {string|null} Encounter ID ou null se pool vazio
 */
export function pickRandomEncounterId(nodeId, worldMapNodes, excludeIds = []) {
    const pool = getEncounterPoolForNode(nodeId, worldMapNodes);
    const available = pool.filter(id => !excludeIds.includes(id));
    if (!available.length) return null;
    const idx = Math.floor(Math.random() * available.length);
    return available[idx];
}

/**
 * Verifica se um nó tem pool de encontros configurado.
 * @param {string} nodeId
 * @param {Object[]} worldMapNodes
 * @returns {boolean}
 */
export function hasEncounterPool(nodeId, worldMapNodes) {
    return getEncounterPoolForNode(nodeId, worldMapNodes).length > 0;
}

// ─── FASE I: Resolução de encontro a partir do pool ───────────────────────────

/**
 * Seleciona uma raridade com base em pesos (objeto { Comum: 82, Incomum: 16, ... }).
 * Função interna usada por resolveEncounterFromPool.
 *
 * @param {Object} weights - { [raridade]: number }
 * @param {Function} rng   - Gerador de número aleatório [0,1)
 * @returns {string|null}  - Raridade selecionada ou null
 */
function _pickRarityFromWeights(weights, rng) {
    const entries = Object.entries(weights).filter(([, w]) => (w ?? 0) > 0);
    if (!entries.length) return null;

    const total = entries.reduce((s, [, w]) => s + w, 0);
    if (total <= 0) return null;

    let roll = rng() * total;
    for (const [rarity, w] of entries) {
        roll -= w;
        if (roll < 0) return rarity;
    }
    return entries[entries.length - 1][0];
}

/**
 * Resolve um encontro wild a partir do pool de um nó usando os dados de locations.json.
 *
 * Algoritmo:
 *  1. Verifica que o nó tem encounterPool não-vazio (guarda-chuva para fallback)
 *  2. Busca os dados da localização em locationsData (rarityWeights + speciesPoolsByRarity)
 *  3. Sorteia raridade pelos pesos da área
 *  4. Sorteia espécie do pool da raridade
 *  5. Retorna { templateId, levelMin, levelMax }
 *
 * @param {string}   nodeId        - ID do nó (ex: 'LOC_001')
 * @param {Object[]} worldMapNodes - Array de nós de worldMap.json
 * @param {Object[]} locationsData - Array de locais de locations.json
 * @param {Function} [rng]         - Gerador de número aleatório (default: Math.random)
 * @returns {{ templateId: string, levelMin: number, levelMax: number } | null}
 */
export function resolveEncounterFromPool(nodeId, worldMapNodes, locationsData, rng = Math.random) {
    if (!nodeId || !Array.isArray(worldMapNodes) || !Array.isArray(locationsData)) return null;

    // Verificar que o nó tem pool definido
    const pool = getEncounterPoolForNode(nodeId, worldMapNodes);
    if (!pool.length) return null;

    // Buscar dados da localização
    const location = locationsData.find(l => l.id === nodeId);
    if (!location) return null;

    const rarityWeights = location.rarityWeights;
    const speciesPools  = location.speciesPoolsByRarity;
    const levelRange    = location.levelRange || [1, 5];

    if (!rarityWeights || !speciesPools) return null;

    // Sortear raridade
    const rarity = _pickRarityFromWeights(rarityWeights, rng);
    if (!rarity) return null;

    // Sortear espécie dentro da raridade
    const speciesPool = speciesPools[rarity];
    if (!Array.isArray(speciesPool) || speciesPool.length === 0) {
        // Fallback: tentar raridade comum se a selecionada estiver vazia
        const commonPool = speciesPools['Comum'];
        if (!Array.isArray(commonPool) || commonPool.length === 0) return null;
        const templateId = commonPool[Math.floor(rng() * commonPool.length)];
        return { templateId, levelMin: levelRange[0] ?? 1, levelMax: levelRange[1] ?? 5 };
    }

    const templateId = speciesPool[Math.floor(rng() * speciesPool.length)];
    return {
        templateId,
        levelMin: levelRange[0] ?? 1,
        levelMax: levelRange[1] ?? 5
    };
}
