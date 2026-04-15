/**
 * MAP UNLOCK SYSTEM — FASE XIV / XVII-A
 *
 * Módulo puro para desbloqueio de nós do mapa-mundo.
 */

/**
 * Verifica se um nó pode ser desbloqueado pela regra atual.
 *
 * Regras suportadas:
 * - always
 * - complete_node
 * - win_n_battles_in_node  (FASE XVII-A)
 * - defeat_boss            (FASE XVII-A)
 *
 * @param {object}                    node
 * @param {Set<string>|Array<string>} completedNodes
 * @param {object}                    [nodeFlags={}] - Flags por nó { [nodeId]: { wildWins, bossDefeated } }
 * @returns {boolean}
 */
export function checkUnlock(node, completedNodes, nodeFlags = {}) {
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

    if (rule.type === 'win_n_battles_in_node') {
        const wins = (nodeFlags?.[rule.nodeId]?.wildWins) ?? 0;
        return wins >= (rule.n ?? 1);
    }

    if (rule.type === 'defeat_boss') {
        return nodeFlags?.[rule.nodeId]?.bossDefeated === true;
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

