/**
 * MAP UNLOCK SYSTEM — FASE XIV
 *
 * Módulo puro para desbloqueio de nós do mapa-mundo.
 */

/**
 * Verifica se um nó pode ser desbloqueado pela regra atual.
 *
 * Regras suportadas:
 * - always
 * - complete_node
 *
 * @param {object} node
 * @param {Set<string>|Array<string>} completedNodes
 * @returns {boolean}
 */
export function checkUnlock(node, completedNodes) {
    if (!node) return false;
    const rule = node.unlockRule || null;

    if (node.unlockDefault === true) return true;
    if (!rule) return false;

    if (rule.type === 'always') return true;

    if (rule.type === 'complete_node') {
        const done = completedNodes instanceof Set
            ? completedNodes
            : new Set(Array.isArray(completedNodes) ? completedNodes : []);
        return done.has(rule.nodeId);
    }

    return false;
}

/**
 * Marca um nó como concluído/desbloqueado de forma idempotente.
 *
 * @param {string} nodeId
 * @param {object} state
 * @returns {boolean} true quando inseriu novo nodeId
 */
export function unlockNode(nodeId, state) {
    if (!nodeId || !state) return false;
    if (!state.data || typeof state.data !== 'object') state.data = {};
    if (!Array.isArray(state.data.completedNodes)) state.data.completedNodes = [];

    if (state.data.completedNodes.includes(nodeId)) return false;

    state.data.completedNodes.push(nodeId);
    if (typeof state.save === 'function') {
        state.save();
    }
    return true;
}

