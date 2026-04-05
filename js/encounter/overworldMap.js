/**
 * OVERWORLD MAP — Renderização visual do mapa nodal do Monstrinhomon
 *
 * Módulo puro de renderização (sem side effects, sem acesso direto ao DOM).
 * O SVG gerado usa onclick globais (window.owSelectNode) definidos em index.html.
 *
 * Arquitetura:
 *   NODE_POSITIONS  — coordenadas (x, y) de cada nó no espaço-mundo (WORLD_W × WORLD_H)
 *   BIOME_FILL      — cor de fundo por bioma
 *   BIOME_EMOJI     — emoji por bioma
 *   getNodeVisualState(node, progressState) → estado visual do nó
 *   buildMapSVG(enrichedNodes, viewBoxX) → string HTML do SVG completo
 *
 * MODELO DE VIEWPORT PROGRESSIVO:
 *   O mundo (WORLD_W × WORLD_H) é maior que a janela visível (VIEWPORT_W × VIEWPORT_H).
 *   A câmera centra no nó atual via atributo viewBox do SVG.
 *   Viajar entre nós anima o viewBox suavemente — o jogador sente deslocamento no mundo.
 *   Regiões avançadas ficam literalmente fora da tela até o jogador avançar.
 */

// ── Dimensões do mundo e da viewport ──────────────────────────────────────────
// Mundo: 1760 × 530 (dobro da viewport em largura)
// Viewport: 880 × 530 (janela visível a qualquer momento = metade do mundo)
// O SVG usa viewBox="${viewBoxX} 0 ${VIEWPORT_W} ${WORLD_H}" para controlar a câmera.
export const WORLD_W    = 1760; // largura total do espaço-mundo em coordenadas SVG
export const WORLD_H    = 530;  // altura total do espaço-mundo
export const VIEWPORT_W = 880;  // largura da janela visível (metade do mundo)
export const VIEWPORT_H = 530;  // altura da janela visível

// Aliases de compatibilidade (caso algum código externo use SVG_WIDTH/SVG_HEIGHT)
export const SVG_WIDTH  = WORLD_W;
export const SVG_HEIGHT = WORLD_H;

// ── Posições dos nós no espaço-mundo (1760 × 530) ─────────────────────────────
// Com VIEWPORT_W=880, o jogador vê metade do mapa de cada vez.
// NODE_R=36 — há espaço suficiente para nós maiores.
//
// FILOSOFIA DE ENQUADRAMENTO POR CLUSTERS/MICROCENAS:
//   O mapa é tratado como sequência de microcenas jogáveis, não coleção de nós.
//   Cada cluster corresponde a um frame narrativo que mostra:
//     - o nó atual ou selecionado
//     - o caminho de chegada (contexto)
//     - os próximos destinos relevantes
//     - respiro visual
//
// CLUSTER 1 — opening (viewBoxX=0, visível x: 0–880):
//   CITY_001 âncora no terço esquerdo. LOC_001 é o gateway imediato.
//   Fork superior (LOC_001B) e inferior (LOC_003) divergem visivelmente.
//   LOC_002 e BOSS_RUINS_SIDE_01 fecham o quadro dentro da safe zone (x ≤ 705).
//
// CLUSTER 2 — early_fork (viewBoxX=300, visível x: 300–1180):
//   Transição pós-hub. LOC_011, LOC_002B, LOC_003C e LOC_005 são centrais.
//   LOC_002 e LOC_003B aparecem à esquerda como contexto de onde se veio.
//
// CLUSTER 3 — mid_exploration (viewBoxX=480, visível x: 480–1360):
//   Rotas divergem: LOC_005B (montanha), LOC_006 (costa), LOC_004 (centro).
//   LOC_002C fecha o trecho à direita dentro da safe zone.
//
// CLUSTER 4 — upper_route (viewBoxX=660, visível x: 660–1540):
//   Rota avançada: LOC_005C, LOC_006B, LOC_004B, LOC_007 são centrais.
//   BOSS_CAVES_OPT_01 aparece na borda direita — posição dramática intencional.
//
// CLUSTER 5 — final_area (viewBoxX=880, visível x: 880–1760):
//   Convergência final: todas as rotas se encontram. LOC_007B, LOC_008,
//   LOC_008B, LOC_009, LOC_010 e os bosses finais compõem o desfecho.
export const NODE_POSITIONS = {
    // ── CLUSTER 1: OPENING (viewBoxX=0, x: 0–880) ──────────────────────────────
    'CITY_001':           { x: 110,  y: 265 }, // hub inicial — âncora no terço esquerdo
    'LOC_001':            { x: 312,  y: 190 }, // gateway — fork começa a divergir
    'LOC_001B':           { x: 505,  y: 108 }, // rota superior — ascensão clara
    'LOC_002':            { x: 678,  y: 182 }, // rota superior — dentro da safe zone (≤705)
    'LOC_003':            { x: 348,  y: 412 }, // fork inferior — bifurcação visível
    'LOC_003B':           { x: 555,  y: 460 }, // rota inferior — avança mas respira
    // Boss lateral — isca no canto inferior-direito, dentro da safe zone
    'BOSS_RUINS_SIDE_01': { x: 698,  y: 486 },

    // ── CLUSTER 2: EARLY_FORK (viewBoxX=300, x: 300–1180) ───────────────────────
    'LOC_011':            { x: 968,  y: 490 }, // logo após boss lateral — revela no pan
    // Rota superior — continua alto no frame
    'LOC_002B':           { x: 985,  y: 142 },
    // Rota inferior (ruínas/costa) — transição suave desde LOC_003B
    'LOC_003C':           { x: 882,  y: 420 },
    // Rota montanha — extremo superior, zona "elite", começa a aparecer
    'LOC_005':            { x: 940,  y: 44  },

    // ── CLUSTER 3: MID_EXPLORATION (viewBoxX=480, x: 480–1360) ─────────────────
    'LOC_002C':           { x: 1180, y: 85  },
    'LOC_005B':           { x: 1105, y: 34  },
    'LOC_006':            { x: 1065, y: 455 },
    // Rota central — junção das rotas principais
    'LOC_004':            { x: 1145, y: 268 },

    // ── CLUSTER 4: UPPER_ROUTE (viewBoxX=660, x: 660–1540) ─────────────────────
    'LOC_005C':           { x: 1262, y: 34  },
    'BOSS_CAVES_OPT_01':  { x: 1440, y: 44  }, // boss opcional — borda dramática intencional
    'LOC_010':            { x: 1634, y: 44  },
    'LOC_006B':           { x: 1268, y: 435 },
    'LOC_004B':           { x: 1328, y: 318 },
    // Rota superior-direita (de LOC_002C → LOC_007)
    'LOC_007':            { x: 1355, y: 165 },

    // ── CLUSTER 5: FINAL_AREA (viewBoxX=880, x: 880–1760) ───────────────────────
    'LOC_007B':           { x: 1515, y: 238 },
    // Convergência final — boss e recompensa
    'LOC_008':            { x: 1592, y: 348 },
    'LOC_008B':           { x: 1680,  y: 292 },
    'BOSS_FOREST_01':     { x: 1650,  y: 432 },
    'LOC_009':            { x: 1660, y: 498 },
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

// Raio base do nó — maior (36) porque o mundo tem o dobro da separação horizontal
const NODE_R = 36;

// Hierarquia visual dos labels: opacidade e tamanho por estado
// available: alta opacidade — jogador precisa ler para onde pode ir
// visited: baixa opacidade — info secundária, caminho já percorrido
const LABEL_STYLES = {
    current:         { opacity: '1',    fontSize: '11' },
    boss:            { opacity: '0.92', fontSize: '10' },
    'boss-defeated': { opacity: '0.75', fontSize: '10' },
    available:       { opacity: '0.72', fontSize: '9'  },
    visited:         { opacity: '0.28', fontSize: '8'  },
    locked:          { opacity: '0.15', fontSize: '8'  },
};

// ── Dimensões do SVG — removidas daqui (agora em WORLD_W/VIEWPORT_W acima) ──────

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
 * O parâmetro viewBoxX controla qual porção do mundo é visível (viewport progressiva).
 *
 * @param {Array<Object>} enrichedNodes - Nós enriquecidos com _unlocked, _state e dados de loc
 * @param {number} [viewBoxX=0] - Coordenada x inicial da viewport (0 = início do mundo)
 * @returns {string} HTML do elemento <svg>
 */
export function buildMapSVG(enrichedNodes, viewBoxX = 0) {
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
        // available: borda mais visível — sinaliza "você pode ir aqui"
        // visited: borda discreta — informação secundária de progresso passado
        let strokeColor = 'none';
        let strokeWidth = 0;
        if      (state === 'current')       { strokeColor = '#20ddcc'; strokeWidth = 3.5; }
        else if (state === 'boss')          { strokeColor = bossRingColor; strokeWidth = 3; }
        else if (state === 'boss-defeated') { strokeColor = '#40cc60'; strokeWidth = 2.5; }
        else if (state === 'available')     { strokeColor = 'rgba(255,255,255,0.52)'; strokeWidth = 2; }
        else if (state === 'visited')       { strokeColor = 'rgba(255,255,255,0.14)'; strokeWidth = 1; }

        // Fill-opacity: nós visitados ficam semi-opacos (tonalidade apagada = "já passei aqui")
        // Nós disponíveis têm cor cheia = "posso ir aqui"
        const fillOpacity = state === 'visited' ? '0.42' : '1';

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
                    fill="${fill}" fill-opacity="${fillOpacity}" stroke="${strokeColor}" stroke-width="${strokeWidth}"
                    class="ow-node__circle"/>
            <text x="${pos.x}" y="${pos.y - 5}" text-anchor="middle"
                  font-size="16" class="ow-node__emoji">${emoji}</text>
            <text x="${pos.x}" y="${pos.y + 15}" text-anchor="middle"
                  font-size="${labelSize}" class="ow-node__label"
                  fill="${locked ? '#444' : '#ddd'}" opacity="${labelOpacity}">${shortLbl}</text>
            ${defeatedBadge}
            ${partyMarker}
        </g>`;
    }).join('');

    // Estilos inline no SVG (para garantir funcionamento sem CSS externo)
    const svgStyles = `
        .ow-edge { stroke: rgba(255,255,255,0.07); stroke-width: 1; }
        .ow-edge--active { stroke: rgba(255,255,255,0.30); stroke-width: 2.2; }
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

    return `<svg viewBox="${viewBoxX} 0 ${VIEWPORT_W} ${WORLD_H}"
                 xmlns="http://www.w3.org/2000/svg"
                 class="ow-svg" id="overworldSVG"
                 preserveAspectRatio="xMidYMid meet">
        <defs><style>${svgStyles}</style></defs>
        <g class="ow-edges">${linesHtml}</g>
        <g class="ow-nodes">${nodesHtml}</g>
    </svg>`;
}
