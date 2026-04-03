/**
 * WORLD MAP TESTS
 *
 * Testes para o sistema de navegação por nós (mapa do mundo).
 * Cobertura: getEnrichedNodes, isNodeUnlocked, getSpotsForLocation,
 *            findSpot, locationIdFromSpotId, buildSpotModifiers
 */

import { describe, it, expect } from 'vitest';
import {
    BIOME_EMOJI,
    getEnrichedNodes,
    isNodeUnlocked,
    getSpotsForLocation,
    findSpot,
    locationIdFromSpotId,
    buildSpotModifiers
} from '../js/encounter/worldMap.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_WORLD_NODES = [
    { nodeId: 'LOC_001', type: 'exploration', unlockDefault: true,  connections: ['LOC_001B', 'LOC_002'] },
    { nodeId: 'LOC_001B', type: 'exploration', unlockDefault: false, connections: ['LOC_001', 'LOC_002'] },
    { nodeId: 'LOC_002',  type: 'exploration', unlockDefault: false, connections: ['LOC_001B'] }
];

const MOCK_LOCATIONS = [
    {
        id: 'LOC_001',
        name: 'Campina Inicial',
        description: 'Área tutorial.',
        biome: 'campos',
        tier: 'T1',
        levelRange: [1, 4],
        spots: [
            { id: 'LOC_001_A', name: 'Mato Baixo', icon: '🌱', profile: 'Mais capturas', description: 'Gramado.', rarityModifiers: [{ rarity: 'Comum', delta: 8 }] },
            { id: 'LOC_001_B', name: 'Pedra Grande', icon: '🪨', profile: 'Mais combate', description: 'Pedras.', rarityModifiers: [{ rarity: 'Incomum', delta: 4 }] },
            { id: 'LOC_001_C', name: 'Riacho', icon: '🏞️', profile: 'Mais raridade', description: 'Água.', rarityModifiers: [{ rarity: 'Raro', delta: 6 }] }
        ]
    },
    {
        id: 'LOC_001B',
        name: 'Campina de Transição',
        description: 'Área intermediária.',
        biome: 'campos',
        tier: 'T2',
        levelRange: [3, 6],
        spots: [
            { id: 'LOC_001B_A', name: 'Grama Alta', icon: '🌾', profile: 'Mais capturas', description: 'Alta.', rarityModifiers: [] }
        ]
    },
    {
        id: 'LOC_002',
        name: 'Floresta Verde',
        description: 'Floresta.',
        biome: 'floresta',
        tier: 'T2',
        levelRange: [3, 8],
        spots: []
    }
];

// ── getEnrichedNodes ──────────────────────────────────────────────────────────

describe('getEnrichedNodes — Enriquecimento de nós com dados de localização', () => {

    it('deve retornar nós enriquecidos com nome, biome, tier e spots', () => {
        const nodes = getEnrichedNodes(MOCK_WORLD_NODES, MOCK_LOCATIONS);
        expect(nodes).toHaveLength(3);

        const node = nodes.find(n => n.nodeId === 'LOC_001');
        expect(node.name).toBe('Campina Inicial');
        expect(node.biome).toBe('campos');
        expect(node.tier).toBe('T1');
        expect(node.levelRange).toEqual([1, 4]);
        expect(node.spots).toHaveLength(3);
    });

    it('deve adicionar emoji do bioma', () => {
        const nodes = getEnrichedNodes(MOCK_WORLD_NODES, MOCK_LOCATIONS);
        const camposNode = nodes.find(n => n.biome === 'campos');
        expect(camposNode.biomeEmoji).toBe(BIOME_EMOJI['campos']);
    });

    it('deve adicionar emoji padrão para bioma desconhecido', () => {
        const nodesWithUnknownBiome = [{ nodeId: 'LOC_999', type: 'exploration', unlockDefault: true, connections: [] }];
        const locsWithUnknown = [{ id: 'LOC_999', name: 'X', description: '', biome: 'desconhecido', tier: 'T0', levelRange: [1,1], spots: [] }];
        const nodes = getEnrichedNodes(nodesWithUnknownBiome, locsWithUnknown);
        expect(nodes[0].biomeEmoji).toBe('🗺️');
    });

    it('deve filtrar nós cujo locationId não existe nas locations', () => {
        const nodesWithMissing = [...MOCK_WORLD_NODES, { nodeId: 'LOC_999', unlockDefault: true, connections: [] }];
        const nodes = getEnrichedNodes(nodesWithMissing, MOCK_LOCATIONS);
        expect(nodes).toHaveLength(3); // LOC_999 filtrado
        expect(nodes.some(n => n.nodeId === 'LOC_999')).toBe(false);
    });

    it('deve retornar array vazio para inputs inválidos', () => {
        expect(getEnrichedNodes(null, MOCK_LOCATIONS)).toEqual([]);
        expect(getEnrichedNodes(MOCK_WORLD_NODES, null)).toEqual([]);
        expect(getEnrichedNodes([], [])).toEqual([]);
    });

    it('deve preservar connections do worldMap', () => {
        const nodes = getEnrichedNodes(MOCK_WORLD_NODES, MOCK_LOCATIONS);
        const node001 = nodes.find(n => n.nodeId === 'LOC_001');
        expect(node001.connections).toContain('LOC_001B');
        expect(node001.connections).toContain('LOC_002');
    });
});

// ── isNodeUnlocked ────────────────────────────────────────────────────────────

describe('isNodeUnlocked — Verificação de desbloqueio de nó', () => {

    const enrichedNodes = [
        { nodeId: 'LOC_001',  unlockDefault: true,  connections: ['LOC_001B'] },
        { nodeId: 'LOC_001B', unlockDefault: false, connections: ['LOC_001', 'LOC_002'] },
        { nodeId: 'LOC_002',  unlockDefault: false, connections: ['LOC_001B'] }
    ];

    it('deve retornar true para nó com unlockDefault=true', () => {
        expect(isNodeUnlocked(enrichedNodes[0])).toBe(true);
    });

    it('deve retornar true se o próprio nó foi visitado', () => {
        expect(isNodeUnlocked(enrichedNodes[1], new Set(['LOC_001B']))).toBe(true);
    });

    it('deve retornar true se um nó vizinho foi CONCLUÍDO', () => {
        // LOC_001B está conectado a LOC_001. Se LOC_001 foi completado, LOC_001B é desbloqueado
        const visited = new Set();
        const completed = new Set(['LOC_001']);
        expect(isNodeUnlocked(enrichedNodes[1], visited, completed)).toBe(true);
    });

    it('deve retornar false se vizinho foi apenas VISITADO (não concluído)', () => {
        // Visitar LOC_001 não desbloqueia LOC_001B — precisa ser concluído
        const visited = new Set(['LOC_001']);
        const completed = new Set();
        expect(isNodeUnlocked(enrichedNodes[1], visited, completed)).toBe(false);
    });

    it('deve retornar false se nó bloqueado e nenhum vizinho visitado ou concluído', () => {
        expect(isNodeUnlocked(enrichedNodes[2], new Set())).toBe(false);
    });

    it('deve retornar false para nó nulo', () => {
        expect(isNodeUnlocked(null)).toBe(false);
    });

    it('deve retornar false com sets vazios para nó sem unlockDefault', () => {
        expect(isNodeUnlocked(enrichedNodes[1])).toBe(false);
    });

    it('LOC_002 desbloqueado quando LOC_001B completado', () => {
        const visited = new Set();
        const completed = new Set(['LOC_001B']);
        expect(isNodeUnlocked(enrichedNodes[2], visited, completed)).toBe(true);
    });

    it('LOC_002 ainda bloqueado quando LOC_001B apenas visitado (não concluído)', () => {
        const visited = new Set(['LOC_001B']);
        const completed = new Set();
        expect(isNodeUnlocked(enrichedNodes[2], visited, completed)).toBe(false);
    });

    it('LOC_002 ainda bloqueado quando apenas LOC_001 completado (não é vizinho direto)', () => {
        // LOC_002 só conecta a LOC_001B; LOC_001 não é vizinho direto
        const visited = new Set();
        const completed = new Set(['LOC_001']);
        expect(isNodeUnlocked(enrichedNodes[2], visited, completed)).toBe(false);
    });
});

// ── getSpotsForLocation ───────────────────────────────────────────────────────

describe('getSpotsForLocation — Obtenção de spots por localização', () => {

    it('deve retornar os 3 spots de LOC_001', () => {
        const spots = getSpotsForLocation('LOC_001', MOCK_LOCATIONS);
        expect(spots).toHaveLength(3);
        expect(spots[0].id).toBe('LOC_001_A');
        expect(spots[1].id).toBe('LOC_001_B');
        expect(spots[2].id).toBe('LOC_001_C');
    });

    it('deve retornar array vazio para localização sem spots', () => {
        const spots = getSpotsForLocation('LOC_002', MOCK_LOCATIONS);
        expect(spots).toEqual([]);
    });

    it('deve retornar array vazio para locationId nulo', () => {
        expect(getSpotsForLocation(null, MOCK_LOCATIONS)).toEqual([]);
    });

    it('deve retornar array vazio para locationsData nulo', () => {
        expect(getSpotsForLocation('LOC_001', null)).toEqual([]);
    });

    it('deve retornar array vazio para locationId inexistente', () => {
        expect(getSpotsForLocation('LOC_999', MOCK_LOCATIONS)).toEqual([]);
    });
});

// ── findSpot ──────────────────────────────────────────────────────────────────

describe('findSpot — Busca de spot por ID', () => {

    it('deve encontrar spot pelo ID', () => {
        const spot = findSpot('LOC_001_B', MOCK_LOCATIONS);
        expect(spot).not.toBeNull();
        expect(spot.name).toBe('Pedra Grande');
        expect(spot.profile).toBe('Mais combate');
    });

    it('deve retornar null para spotId inexistente', () => {
        expect(findSpot('LOC_999_Z', MOCK_LOCATIONS)).toBeNull();
    });

    it('deve retornar null para spotId nulo', () => {
        expect(findSpot(null, MOCK_LOCATIONS)).toBeNull();
    });

    it('deve retornar null para locationsData nulo', () => {
        expect(findSpot('LOC_001_A', null)).toBeNull();
    });
});

// ── locationIdFromSpotId ──────────────────────────────────────────────────────

describe('locationIdFromSpotId — Extração de locationId do spotId', () => {

    it('deve extrair LOC_001 de LOC_001_A', () => {
        expect(locationIdFromSpotId('LOC_001_A')).toBe('LOC_001');
    });

    it('deve extrair LOC_001B de LOC_001B_A', () => {
        expect(locationIdFromSpotId('LOC_001B_A')).toBe('LOC_001B');
    });

    it('deve extrair LOC_008B de LOC_008B_C', () => {
        expect(locationIdFromSpotId('LOC_008B_C')).toBe('LOC_008B');
    });

    it('deve retornar null para spotId nulo', () => {
        expect(locationIdFromSpotId(null)).toBeNull();
    });

    it('deve retornar null para formato inválido', () => {
        expect(locationIdFromSpotId('INVALIDO')).toBeNull();
        expect(locationIdFromSpotId('')).toBeNull();
    });
});

// ── buildSpotModifiers ────────────────────────────────────────────────────────

describe('buildSpotModifiers — Construção de modificadores de spot', () => {

    it('deve retornar os modificadores do spot', () => {
        const spot = { rarityModifiers: [{ rarity: 'Comum', delta: 8 }, { rarity: 'Incomum', delta: -4 }] };
        const mods = buildSpotModifiers(spot);
        expect(mods).toHaveLength(2);
        expect(mods[0]).toEqual({ rarity: 'Comum', delta: 8 });
    });

    it('deve retornar array vazio para spot sem rarityModifiers', () => {
        expect(buildSpotModifiers({ rarityModifiers: [] })).toEqual([]);
    });

    it('deve retornar array vazio para spot nulo', () => {
        expect(buildSpotModifiers(null)).toEqual([]);
    });

    it('deve filtrar modificadores inválidos', () => {
        const spot = {
            rarityModifiers: [
                { rarity: 'Raro', delta: 5 },
                null,
                { rarity: 'Comum' },    // sem delta
                { delta: 3 },            // sem rarity
                { rarity: 'Místico', delta: 2 }
            ]
        };
        const mods = buildSpotModifiers(spot);
        expect(mods).toHaveLength(2);
        expect(mods[0].rarity).toBe('Raro');
        expect(mods[1].rarity).toBe('Místico');
    });
});

// ── Integração com encounterEngine ────────────────────────────────────────────

describe('Integração worldMap ↔ encounterEngine', () => {

    it('modificadores de spot devem ser usados pelo encounterEngine', async () => {
        const { applyModifiers } = await import('../js/encounter/encounterEngine.js');

        const baseWeights = { Comum: 82, Incomum: 16, Raro: 2, Místico: 0, Lendário: 0 };
        const spot = MOCK_LOCATIONS[0].spots[2]; // LOC_001_C: +6 Raro, -6 Comum
        const mods = buildSpotModifiers(spot);

        const adjusted = applyModifiers(baseWeights, mods);

        // Raro deve ter aumentado
        expect(adjusted.Raro).toBeGreaterThan(baseWeights.Raro);
        // Comum deve ter diminuído
        expect(adjusted.Comum).toBeLessThan(baseWeights.Comum);
    });

    it('nó LOC_001 desbloqueado por padrão deve ter spots acessíveis', () => {
        const enriched = getEnrichedNodes(MOCK_WORLD_NODES, MOCK_LOCATIONS);
        const node001 = enriched.find(n => n.nodeId === 'LOC_001');
        expect(isNodeUnlocked(node001)).toBe(true);
        expect(node001.spots.length).toBeGreaterThan(0);
    });
});

// ── FASE 3: completedLocations — desbloqueio por conclusão ────────────────────

describe('isNodeUnlocked — Desbloqueio por conclusão (FASE 3)', () => {

    const nodes = [
        { nodeId: 'HUB',    unlockDefault: true,  connections: ['A'] },
        { nodeId: 'A',      unlockDefault: false, connections: ['HUB', 'B'] },
        { nodeId: 'B',      unlockDefault: false, connections: ['A', 'C'] },
        { nodeId: 'C',      unlockDefault: false, connections: ['B'] }
    ];

    it('HUB é sempre desbloqueado (unlockDefault)', () => {
        expect(isNodeUnlocked(nodes[0])).toBe(true);
    });

    it('A desbloqueia quando HUB é completado', () => {
        expect(isNodeUnlocked(nodes[1], new Set(), new Set(['HUB']))).toBe(true);
    });

    it('A NÃO desbloqueia quando HUB foi apenas visitado', () => {
        expect(isNodeUnlocked(nodes[1], new Set(['HUB']), new Set())).toBe(false);
    });

    it('B desbloqueia quando A é completado', () => {
        expect(isNodeUnlocked(nodes[2], new Set(), new Set(['A']))).toBe(true);
    });

    it('B NÃO desbloqueia quando HUB é completado (não é vizinho direto)', () => {
        expect(isNodeUnlocked(nodes[2], new Set(), new Set(['HUB']))).toBe(false);
    });

    it('C NÃO desbloqueia quando apenas A é completado (não vizinho)', () => {
        expect(isNodeUnlocked(nodes[3], new Set(), new Set(['A']))).toBe(false);
    });

    it('C desbloqueia quando B é completado', () => {
        expect(isNodeUnlocked(nodes[3], new Set(), new Set(['B']))).toBe(true);
    });

    it('nó visitado (em visitedLocations) sempre pode ser re-acessado', () => {
        // B foi visitado antes (está em visitedLocations) → pode revisitar mesmo sem completar vizinho
        expect(isNodeUnlocked(nodes[2], new Set(['B']), new Set())).toBe(true);
    });
});

// ── FASE 4: Cidade — BIOME_EMOJI e BIOME_COLOR ───────────────────────────────

describe('BIOME_EMOJI / BIOME_COLOR — Suporte a bioma cidade (FASE 4)', () => {

    it('BIOME_EMOJI deve ter entrada para "cidade"', () => {
        expect(BIOME_EMOJI['cidade']).toBeDefined();
        expect(typeof BIOME_EMOJI['cidade']).toBe('string');
    });

    it('getEnrichedNodes deve incluir type do nó na saída', () => {
        const nodes = [
            { nodeId: 'LOC_001', type: 'exploration', unlockDefault: true, connections: [] },
        ];
        const locs = [
            { id: 'LOC_001', name: 'Local', description: '', biome: 'campos', tier: 'T1',
              levelRange: [1,3], spots: [] }
        ];
        const enriched = getEnrichedNodes(nodes, locs);
        expect(enriched[0].type).toBe('exploration');
    });

    it('getEnrichedNodes para nó de cidade inclui type city', () => {
        const nodes = [
            { nodeId: 'CITY_001', type: 'city', unlockDefault: true, connections: [] },
        ];
        const locs = [
            { id: 'CITY_001', name: 'Aldeia', description: '', biome: 'cidade', tier: 'S',
              levelRange: null, spots: [
                  { id: 'CITY_001_SHOP', name: 'Loja', icon: '🛒', profile: 'Comprar',
                    description: '', type: 'service', serviceAction: 'shop', rarityModifiers: [] }
              ] }
        ];
        const enriched = getEnrichedNodes(nodes, locs);
        expect(enriched[0].type).toBe('city');
        expect(enriched[0].spots[0].type).toBe('service');
        expect(enriched[0].spots[0].serviceAction).toBe('shop');
    });
});
