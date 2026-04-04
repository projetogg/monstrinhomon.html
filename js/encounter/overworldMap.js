/**
 * OVERWORLD MAP — Renderização visual do mapa nodal do Monstrinhomon
 *
 * Módulo puro de renderização (sem side effects, sem acesso direto ao DOM).
 * O SVG gerado usa onclick globais (window.owSelectNode) definidos em index.html.
 *
 * Arquitetura:
 *   NODE_POSITIONS  — coordenadas (x, y) de cada nó no SVG
 *   BIOME_FILL      — cor de fundo por bioma
 *   BIOME_EMOJI     — emoji por bioma
 *   getNodeVisualState(node, progressState) → estado visual do nó
 *   buildMapSVG(enrichedNodes) → string HTML do SVG completo
 */

// ── Posições dos nós no SVG (viewBox "0 0 880 510") ───────────────────────────
export const NODE_POSITIONS = {
    'CITY_001':           { x: 85,  y: 270 },
    'LOC_001':            { x: 195, y: 400 },
    'LOC_001B':           { x: 300, y: 320 },
    'LOC_002':            { x: 400, y: 240 },
    'LOC_002B':           { x: 495, y: 185 },
    'LOC_002C':           { x: 590, y: 148 },
    'LOC_003':            { x: 340, y: 420 },
    'LOC_003B':           { x: 420, y: 465 },
    'LOC_003C':           { x: 515, y: 445 },
    'LOC_004':            { x: 565, y: 245 },
    'LOC_004B':           { x: 648, y: 298 },
    'LOC_005':            { x: 455, y: 148 },
    'LOC_005B':           { x: 540, y: 92 },
    'LOC_005C':           { x: 620, y: 65 },
    'BOSS_CAVES_OPT_01':  { x: 705, y: 65 },
    'LOC_010':            { x: 790, y: 65 },
    'LOC_006':            { x: 608, y: 452 },
    'LOC_006B':           { x: 695, y: 420 },
    'LOC_007':            { x: 668, y: 185 },
    'LOC_007B':           { x: 748, y: 237 },
    'LOC_008':            { x: 768, y: 358 },
    'LOC_008B':           { x: 848, y: 310 },
    'BOSS_FOREST_01':     { x: 840, y: 420 },
    'LOC_009':            { x: 840, y: 480 },
    'BOSS_RUINS_SIDE_01': { x: 492, y: 495 },
    'LOC_011':            { x: 572, y: 495 },
};

// ── Cor de preenchimento base por bioma ───────────────────────────────────────
const BIOME_FILL = {
    campos:    '#3d6b28',
    floresta:  '#1a5c1a',
    minas:     '#6b4f30',
    ruinas:    '#5a3e28',
    costa:     '#1a5c8a',
    vulcanico: '#a03018',
    noturno:   '#28185a',
    arena:     '#7a5c10',
    cidade:    '#2a4a8a',
};

// ── Emojis por bioma ──────────────────────────────────────────────────────────
export const BIOME_EMOJI = {
    campos:    '🌾',
    floresta:  '🌲',
    minas:     '⛏️',
    ruinas:    '🏛️',
    costa:     '🌊',
    vulcanico: '🌋',
    noturno:   '🌑',
    arena:     '⚔️',
    cidade:    '🏙️',
};

// Raio base do nó
const NODE_R = 28;

// Hierarquia visual dos labels: opacidade e tamanho por estado
const LABEL_STYLES = {
    current:         { opacity: '1',    fontSize: '10' },
    boss:            { opacity: '0.92', fontSize: '9'  },
    'boss-defeated': { opacity: '0.75', fontSize: '9'  },
    available:       { opacity: '0.55', fontSize: '8'  },
    visited:         { opacity: '0.30', fontSize: '7'  },
    locked:          { opacity: '0.15', fontSize: '7'  },
};

// ── Dimensões do SVG ──────────────────────────────────────────────────────────
export const SVG_WIDTH  = 880;
export const SVG_HEIGHT = 530; // +20px de margem inferior para não cortar nós próximos à borda

/**
 * Retorna o estado visual de um nó.
 *
 * O campo `_unlocked` deve estar pré-computado no nó (via WorldMap.isNodeUnlocked).
 *
 * @param {Object} node         - Nó enriquecido com _unlocked e tipo
 * @param {Object} progressState
 * @param {Set}    progressState.visitedLocations
 * @param {Set}    progressState.completedLocations
 * @param {Object} progressState.nodeFlags
 * @param {string|null} progressState.currentNodeId
 * @returns {'current'|'visited'|'available'|'locked'|'boss'|'boss-defeated'}
 */
export function getNodeVisualState(node, { visitedLocations, completedLocations, nodeFlags, currentNodeId }) {
    if (!node._unlocked) return 'locked';

    const vid = node.nodeId;
    if (vid === currentNodeId) return 'current';

    if (node.type === 'boss') {
        return (nodeFlags[vid]?.bossDefeated === true) ? 'boss-defeated' : 'boss';
    }

    if (completedLocations.has(vid) || visitedLocations.has(vid)) return 'visited';
    return 'available';
}

/**
 * Gera o SVG completo do mapa-mundo.
 *
 * Cada nó recebe _unlocked e _state pré-computados externamente.
 *
 * @param {Array<Object>} enrichedNodes - Nós enriquecidos com _unlocked, _state e dados de loc
 * @returns {string} HTML do elemento <svg>
 */
export function buildMapSVG(enrichedNodes) {
    const nodeMap = new Map(enrichedNodes.map(n => [n.nodeId, n]));

    // ── 1. Arestas únicas ──────────────────────────────────────────────────────
    const drawnEdges = new Set();
    const edges = [];

    for (const node of enrichedNodes) {
        const pA = NODE_POSITIONS[node.nodeId];
        if (!pA) continue;

        for (const connId of (node.connections ?? [])) {
            const edgeKey = [node.nodeId, connId].sort().join('|');
            if (drawnEdges.has(edgeKey)) continue;
            drawnEdges.add(edgeKey);

            const pB = NODE_POSITIONS[connId];
            if (!pB) continue;

            const connNode    = nodeMap.get(connId);
            const bothVisible = node._unlocked || connNode?._unlocked;
            edges.push({ x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y, active: bothVisible });
        }
    }

    // ── 2. SVG das arestas ────────────────────────────────────────────────────
    const linesHtml = edges.map(e => `
        <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}"
              class="ow-edge${e.active ? ' ow-edge--active' : ''}"/>`
    ).join('');

    // ── 3. SVG dos nós ────────────────────────────────────────────────────────
    const nodesHtml = enrichedNodes.map(node => {
        const pos = NODE_POSITIONS[node.nodeId];
        if (!pos) return '';

        const state    = node._state;
        const locked   = state === 'locked';
        const isBoss   = node.type === 'boss';
        const biome    = node.biome ?? 'campos';
        const fill     = locked ? '#222' : (BIOME_FILL[biome] ?? '#444');
        const emoji    = locked ? '❓' : (isBoss ? '👑' : (BIOME_EMOJI[biome] ?? '🗺️'));
        const label    = locked ? '' : (node.name ?? node.nodeId); // nós bloqueados: sem label visível, aria-label fallback aplicado abaixo
        const shortLbl = label.length > 12 ? label.slice(0, 11) + '…' : label;
        const clickable = !locked;

        // Cor do anel de boss por tipo de região
        const bossMeta   = node.bossMeta ?? {};
        const regionType = bossMeta.regionType ?? 'main';
        const bossRingColor = regionType === 'optional' ? '#a060ff'
                            : regionType === 'side'     ? '#ff9020'
                            : '#ffdd44';

        // Borda do círculo por estado
        let strokeColor = 'none';
        let strokeWidth = 0;
        if      (state === 'current')       { strokeColor = '#20ddcc'; strokeWidth = 3.5; }
        else if (state === 'boss')          { strokeColor = bossRingColor; strokeWidth = 3; }
        else if (state === 'boss-defeated') { strokeColor = '#40cc60'; strokeWidth = 2.5; }
        else if (state === 'available')     { strokeColor = 'rgba(255,255,255,0.28)'; strokeWidth = 1.5; }
        else if (state === 'visited')       { strokeColor = 'rgba(255,255,255,0.15)'; strokeWidth = 1; }

        // Marcador de party para o nó atual
        const partyMarker = (state === 'current')
            ? `<text x="${pos.x}" y="${pos.y - NODE_R - 7}" text-anchor="middle"
                     font-size="13" class="ow-party-marker">📍</text>`
            : '';

        // Anel externo pulsante para boss não derrotado
        const bossRing = (isBoss && !locked && state === 'boss')
            ? `<circle cx="${pos.x}" cy="${pos.y}" r="${NODE_R + 6}"
                       fill="none" stroke="${bossRingColor}"
                       stroke-width="1.2" stroke-dasharray="4 4"
                       opacity="0.55" class="ow-boss-ring"/>`
            : '';

        // Badge de boss derrotado
        const defeatedBadge = (state === 'boss-defeated')
            ? `<text x="${pos.x + NODE_R - 4}" y="${pos.y - NODE_R + 4}"
                     text-anchor="middle" font-size="11">⚔️</text>`
            : '';

        const stateClass = `ow-node--${state}`;
        const onclick    = clickable ? `onclick="owSelectNode('${node.nodeId}')"` : '';

        // Hierarquia visual dos labels: atual e boss se destacam; visitados e bloqueados ficam discretos
        const { opacity: labelOpacity, fontSize: labelSize } = LABEL_STYLES[state] ?? LABEL_STYLES.locked;

        return `
        <g class="ow-node ${stateClass}" data-node="${node.nodeId}"
           style="cursor:${clickable ? 'pointer' : 'default'}" ${onclick}
           role="${clickable ? 'button' : 'img'}" aria-label="${label || 'Local bloqueado'}">
            ${bossRing}
            <circle cx="${pos.x}" cy="${pos.y}" r="${NODE_R}"
                    fill="${fill}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
                    class="ow-node__circle"/>
            <text x="${pos.x}" y="${pos.y - 4}" text-anchor="middle"
                  font-size="15" class="ow-node__emoji">${emoji}</text>
            <text x="${pos.x}" y="${pos.y + 13}" text-anchor="middle"
                  font-size="${labelSize}" class="ow-node__label"
                  fill="${locked ? '#444' : '#ddd'}" opacity="${labelOpacity}">${shortLbl}</text>
            ${defeatedBadge}
            ${partyMarker}
        </g>`;
    }).join('');

    // Estilos inline no SVG (para garantir funcionamento sem CSS externo)
    const svgStyles = `
        .ow-edge { stroke: rgba(255,255,255,0.08); stroke-width: 1; }
        .ow-edge--active { stroke: rgba(255,255,255,0.22); stroke-width: 1.8; }
        .ow-node__circle { transition: filter 0.18s; }
        .ow-node--available:hover .ow-node__circle,
        .ow-node--visited:hover .ow-node__circle,
        .ow-node--boss:hover .ow-node__circle,
        .ow-node--boss-defeated:hover .ow-node__circle,
        .ow-node--current:hover .ow-node__circle { filter: brightness(1.30); }
        .ow-node--current .ow-node__circle {
            animation: owCurrentPulse 3s ease-in-out infinite;
        }
        .ow-boss-ring { animation: owBossRing 2.5s ease-in-out infinite; }
        .ow-party-marker { animation: owBounce 2s ease-in-out infinite; }
        @keyframes owCurrentPulse {
            0%,100% { stroke-width: 3.5; stroke-opacity: 1; }
            50%      { stroke-width: 6;   stroke-opacity: 0.5; }
        }
        @keyframes owBossRing {
            0%,100% { opacity: 0.35; }
            50%      { opacity: 0.75; }
        }
        @keyframes owBounce {
            0%,100% { transform: translateY(0); }
            50%      { transform: translateY(-3px); }
        }
    `;

    return `<svg viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}"
                 xmlns="http://www.w3.org/2000/svg"
                 class="ow-svg" id="overworldSVG"
                 preserveAspectRatio="xMidYMid meet">
        <defs><style>${svgStyles}</style></defs>
        <g class="ow-edges">${linesHtml}</g>
        <g class="ow-nodes">${nodesHtml}</g>
    </svg>`;
}
