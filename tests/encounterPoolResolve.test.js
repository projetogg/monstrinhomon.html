/**
 * ENCOUNTER POOL RESOLVE TESTS (FASE I)
 *
 * Testa a função resolveEncounterFromPool adicionada a encounterPool.js.
 * Cobertura: seleção de espécie/nível a partir de locationsData por nó.
 */

import { describe, it, expect } from 'vitest';
import {
    resolveEncounterFromPool,
    getEncounterPoolForNode,
    hasEncounterPool
} from '../js/encounter/encounterPool.js';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const worldMapNodes = [
    {
        nodeId: 'LOC_001',
        type: 'exploration',
        encounterPool: ['ENC_001', 'ENC_002', 'ENC_003']
    },
    {
        nodeId: 'LOC_002',
        type: 'exploration',
        encounterPool: ['ENC_010', 'ENC_011']
    },
    {
        nodeId: 'CITY_001',
        type: 'city',
        encounterPool: []
    }
];

const locationsData = [
    {
        id: 'LOC_001',
        name: 'Campina Inicial',
        tier: 'T1',
        levelRange: [1, 4],
        rarityWeights: { Comum: 82, Incomum: 16, Raro: 2, Místico: 0, Lendário: 0 },
        speciesPoolsByRarity: {
            Comum: ['MON_001', 'MON_002', 'MON_004'],
            Incomum: ['MON_011B', 'MON_002B'],
            Raro: ['MON_023C'],
            Místico: [],
            Lendário: []
        }
    },
    {
        id: 'LOC_002',
        name: 'Floresta Sombria',
        tier: 'T2',
        levelRange: [5, 9],
        rarityWeights: { Comum: 70, Incomum: 25, Raro: 5, Místico: 0, Lendário: 0 },
        speciesPoolsByRarity: {
            Comum: ['MON_006', 'MON_007'],
            Incomum: ['MON_020B'],
            Raro: ['MON_021C'],
            Místico: [],
            Lendário: []
        }
    }
];

// RNG determinística para testes
const rngFirst  = () => 0.0;      // sempre sorteia primeiro item
const rngMiddle = () => 0.5;      // sorteia item do meio
const rngLast   = () => 0.9999;   // sorteia último item

// ─── resolveEncounterFromPool ────────────────────────────────────────────────

describe('resolveEncounterFromPool', () => {
    it('retorna null se nodeId for inválido', () => {
        expect(resolveEncounterFromPool(null, worldMapNodes, locationsData)).toBeNull();
        expect(resolveEncounterFromPool('',   worldMapNodes, locationsData)).toBeNull();
    });

    it('retorna null se worldMapNodes não for array', () => {
        expect(resolveEncounterFromPool('LOC_001', null, locationsData)).toBeNull();
    });

    it('retorna null se locationsData não for array', () => {
        expect(resolveEncounterFromPool('LOC_001', worldMapNodes, null)).toBeNull();
    });

    it('retorna null para nó sem encounterPool (vazio)', () => {
        expect(resolveEncounterFromPool('CITY_001', worldMapNodes, locationsData)).toBeNull();
    });

    it('retorna null para nó sem dados em locationsData', () => {
        expect(resolveEncounterFromPool('LOC_099', worldMapNodes, locationsData)).toBeNull();
    });

    it('retorna templateId e levelRange corretos para LOC_001', () => {
        const result = resolveEncounterFromPool('LOC_001', worldMapNodes, locationsData, rngFirst);
        expect(result).not.toBeNull();
        expect(result.templateId).toBeDefined();
        expect(typeof result.templateId).toBe('string');
        expect(result.levelMin).toBe(1);
        expect(result.levelMax).toBe(4);
    });

    it('templateId está na pool de espécies da localização (LOC_001)', () => {
        // Roda 20 vezes para cobrir diferentes raridades
        const allSpecies = [
            ...locationsData[0].speciesPoolsByRarity.Comum,
            ...locationsData[0].speciesPoolsByRarity.Incomum,
            ...locationsData[0].speciesPoolsByRarity.Raro
        ];
        for (let i = 0; i < 20; i++) {
            const rng = () => Math.random();
            const result = resolveEncounterFromPool('LOC_001', worldMapNodes, locationsData, rng);
            if (result) {
                expect(allSpecies).toContain(result.templateId);
            }
        }
    });

    it('com rng sempre 0 (Comum), retorna o primeiro da pool Comum', () => {
        // 0 * (82+16+2) = 0, entra em Comum. Pool Comum[0] = MON_001
        const result = resolveEncounterFromPool('LOC_001', worldMapNodes, locationsData, rngFirst);
        expect(result.templateId).toBe('MON_001');
    });

    it('retorna levelRange correto para LOC_002', () => {
        const result = resolveEncounterFromPool('LOC_002', worldMapNodes, locationsData, rngFirst);
        expect(result).not.toBeNull();
        expect(result.levelMin).toBe(5);
        expect(result.levelMax).toBe(9);
    });

    it('retorna null se todas as species pools estiverem vazias', () => {
        const noSpecies = [{
            id: 'LOC_999',
            levelRange: [1, 5],
            rarityWeights: { Comum: 100 },
            speciesPoolsByRarity: { Comum: [], Incomum: [], Raro: [] }
        }];
        const nodes = [{ nodeId: 'LOC_999', encounterPool: ['ENC_X'] }];
        const result = resolveEncounterFromPool('LOC_999', nodes, noSpecies, rngFirst);
        expect(result).toBeNull();
    });

    it('funciona com locationsData sem rarityWeights/speciesPoolsByRarity', () => {
        const incomplete = [{ id: 'LOC_001', levelRange: [1, 4] }]; // sem rarityWeights
        const result = resolveEncounterFromPool('LOC_001', worldMapNodes, incomplete, rngFirst);
        expect(result).toBeNull();
    });
});

// ─── Regressão: hasEncounterPool ainda funciona ───────────────────────────────

describe('hasEncounterPool (regressão pós FASE I)', () => {
    it('retorna true para nó com pool', () => {
        expect(hasEncounterPool('LOC_001', worldMapNodes)).toBe(true);
    });

    it('retorna false para cidade sem pool', () => {
        expect(hasEncounterPool('CITY_001', worldMapNodes)).toBe(false);
    });
});

// ─── Regressão: getEncounterPoolForNode ───────────────────────────────────────

describe('getEncounterPoolForNode (regressão pós FASE I)', () => {
    it('retorna pool de LOC_001', () => {
        expect(getEncounterPoolForNode('LOC_001', worldMapNodes)).toEqual(['ENC_001', 'ENC_002', 'ENC_003']);
    });

    it('retorna [] para cidade sem pool', () => {
        expect(getEncounterPoolForNode('CITY_001', worldMapNodes)).toEqual([]);
    });
});
