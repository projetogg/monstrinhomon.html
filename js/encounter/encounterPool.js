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
