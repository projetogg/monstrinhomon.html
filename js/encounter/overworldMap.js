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
    'LOC_006B':           { x: 1268, y: 435 },
    'LOC_004B':           { x: 1328, y: 318 },
    // Rota superior-direita (de LOC_002C → LOC_007)
    'LOC_007':            { x: 1355, y: 165 },

    // ── CLUSTER 5: FINAL_AREA (viewBoxX=880, x: 880–1760) ───────────────────────
    // Nós espalhados para evitar sobreposição visual — safe boundary x≤1590 com
    // OW_SAFE_RIGHT=160 e maxVBX=880 (1600 é o limite absoluto, usamos 1590 com folga).
    // Verificação: distância entre nós conectados ≥ 2×NODE_R=72px.
    'LOC_010':            { x: 1520, y: 36  }, // após boss opcional — topo, claramente à frente de BOSS_CAVES
    'LOC_007B':           { x: 1510, y: 238 }, // rota superior → junção final
    'LOC_008B':           { x: 1572, y: 285 }, // bônus — borda direita drama
    'LOC_008':            { x: 1510, y: 352 }, // hub final — confluência das rotas
    'BOSS_FOREST_01':     { x: 1545, y: 435 }, // boss principal — descida dramática
    'LOC_009':            { x: 1585, y: 492 }, // recompensa final — canto inferior direito
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
// visited: opacidade média — o caminho percorrido ainda é legível como narrativa
const LABEL_STYLES = {
    current:         { opacity: '1',    fontSize: '11' },
    boss:            { opacity: '0.92', fontSize: '10' },
    'boss-defeated': { opacity: '0.75', fontSize: '10' },
    available:       { opacity: '0.75', fontSize: '10' },
    visited:         { opacity: '0.42', fontSize: '9'  },
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
    // Mapa de estados para computar arestas percorridas
    const nodeStateMap = new Map(enrichedNodes.map(n => [n.nodeId, n._state]));
    const traveledStates = new Set(['visited', 'current', 'boss-defeated']);

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
            // Aresta percorrida: ambos os nós foram visitados/atual
            const traveled    = traveledStates.has(nodeStateMap.get(node.nodeId)) &&
                                traveledStates.has(nodeStateMap.get(connId));
            edges.push({ x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y, active: bothVisible, traveled });
        }
    }

    // ── 2. SVG das arestas — normais primeiro, percorridas por cima ───────────
    const normalEdges   = edges.filter(e => !e.traveled);
    const traveledEdges = edges.filter(e => e.traveled);

    const linesHtml = [
        ...normalEdges.map(e => `
        <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}"
              class="ow-edge${e.active ? ' ow-edge--active' : ''}"/>`),
        ...traveledEdges.map(e => `
        <line x1="${e.x1}" y1="${e.y1}" x2="${e.x2}" y2="${e.y2}"
              class="ow-edge ow-edge--traveled"/>`),
    ].join('');

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

        // Fill-opacity: nós visitados ficam levemente apagados (já esteve aqui),
        // mas ainda legíveis como parte da narrativa de jornada
        const fillOpacity = state === 'visited' ? '0.55' : '1';

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
        .ow-edge--active { stroke: rgba(255,255,255,0.42); stroke-width: 2.5; }
        .ow-edge--traveled {
            stroke: rgba(32,221,204,0.32);
            stroke-width: 2.5;
        }
        .ow-node__circle { transition: filter 0.18s; }
        .ow-node--available .ow-node__circle {
            filter: drop-shadow(0 0 5px rgba(255,255,255,0.18));
        }
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

    // ── Fundo de terreno — zonas de bioma e gradiente de progressão ─────────────
    // Camadas de cor muito suaves que diferenciam regiões do mundo sem competir com os nós.
    // Gradiente horizontal: abertura fria (azul-acinzentado) → exploração escura → final quente.
    // Bandas verticais: cume (y=0) mais frio, costa (y=530) mais azul.
    const gradientDefs = `
        <linearGradient id="owBgWorldGrad" x1="0" y1="0" x2="1" y2="0"
                        gradientUnits="objectBoundingBox">
            <stop offset="0%"   stop-color="#0d1525"/>
            <stop offset="30%"  stop-color="#080f14"/>
            <stop offset="70%"  stop-color="#090c18"/>
            <stop offset="100%" stop-color="#0e0910"/>
        </linearGradient>
        <linearGradient id="owBgTerrainGrad" x1="0" y1="0" x2="0" y2="1"
                        gradientUnits="objectBoundingBox">
            <stop offset="0%"   stop-color="#1a1020" stop-opacity="0.45"/>
            <stop offset="30%"  stop-color="#080f14" stop-opacity="0"/>
            <stop offset="70%"  stop-color="#0a0e18" stop-opacity="0"/>
            <stop offset="100%" stop-color="#0a1828" stop-opacity="0.50"/>
        </linearGradient>
    `;
    const terrainBg = `
        <!-- Base: gradiente horizontal de progressão -->
        <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}"
              fill="url(#owBgWorldGrad)"/>
        <!-- Banda de altitude: cume (topo escuro-quente) e costa (fundo azul-fundo) -->
        <rect x="0" y="0" width="${WORLD_W}" height="${WORLD_H}"
              fill="url(#owBgTerrainGrad)"/>
        <!-- Zona de cidade/campos (esquerda — abertura) -->
        <rect x="0" y="60" width="440" height="410"
              fill="#1e3a6a" opacity="0.05"/>
        <!-- Zona de montanha (topo — rota elite) -->
        <rect x="840" y="0" width="720" height="160"
              fill="#4a3520" opacity="0.07"/>
        <!-- Zona de costa (fundo — rota costa) -->
        <rect x="840" y="380" width="720" height="150"
              fill="#0a2855" opacity="0.08"/>
        <!-- Zona final: floresta/boss (direita) -->
        <rect x="1380" y="90" width="380" height="350"
              fill="#0e3010" opacity="0.09"/>
    `;

    return `<svg viewBox="${viewBoxX} 0 ${VIEWPORT_W} ${WORLD_H}"
                 xmlns="http://www.w3.org/2000/svg"
                 class="ow-svg" id="overworldSVG"
                 preserveAspectRatio="xMidYMid meet">
        <defs><style>${svgStyles}</style>${gradientDefs}</defs>
        ${terrainBg}
        <g class="ow-edges">${linesHtml}</g>
        <g class="ow-nodes">${nodesHtml}</g>
    </svg>`;
}
