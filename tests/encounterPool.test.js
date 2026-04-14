/**
 * ENCOUNTER POOL TESTS (FASE C)
 */
import { describe, it, expect } from 'vitest';
import {
    getEncounterPoolForNode,
    getEncountersByType,
    pickRandomEncounterId,
    hasEncounterPool,
    ENCOUNTER_TYPES
} from '../js/encounter/encounterPool.js';

// Test data
const MOCK_NODES = [
    { nodeId: 'LOC_001', type: 'exploration', encounterPool: ['ENC_001', 'ENC_002', 'ENC_003'] },
    { nodeId: 'LOC_002', type: 'exploration', encounterPool: ['ENC_005', 'ENC_006'] },
    { nodeId: 'CITY_001', type: 'city', encounterPool: [] },
    { nodeId: 'BOSS_001', type: 'boss', encounterPool: [] },
    { nodeId: 'LOC_OLD', type: 'exploration' }  // sem encounterPool (legado)
];

const MOCK_ENCOUNTERS = {
    'ENC_001': { tipo_encontro: 'Selvagem', local_id: 'LOC_001' },
    'ENC_002': { tipo_encontro: 'Treinador', local_id: 'LOC_001' },
    'ENC_003': { tipo_encontro: 'Selvagem', local_id: 'LOC_001' },
    'ENC_005': { tipo_encontro: 'Selvagem', local_id: 'LOC_002' },
    'ENC_006': { tipo_encontro: 'Treinador', local_id: 'LOC_002' },
};

describe('encounterPool', () => {
    describe('getEncounterPoolForNode', () => {
        it('deve retornar array de IDs para nó com pool', () => {
            const pool = getEncounterPoolForNode('LOC_001', MOCK_NODES);
            expect(pool).toEqual(['ENC_001', 'ENC_002', 'ENC_003']);
        });
        it('deve retornar array vazio para nó sem encounters (cidade)', () => {
            expect(getEncounterPoolForNode('CITY_001', MOCK_NODES)).toEqual([]);
        });
        it('deve retornar array vazio para nó sem encounterPool field (legado)', () => {
            expect(getEncounterPoolForNode('LOC_OLD', MOCK_NODES)).toEqual([]);
        });
        it('deve retornar array vazio para nodeId inválido', () => {
            expect(getEncounterPoolForNode('NONEXISTENT', MOCK_NODES)).toEqual([]);
        });
        it('deve retornar array vazio para parâmetros nulos', () => {
            expect(getEncounterPoolForNode(null, MOCK_NODES)).toEqual([]);
            expect(getEncounterPoolForNode('LOC_001', null)).toEqual([]);
        });
    });

    describe('getEncountersByType', () => {
        it('deve filtrar apenas selvagens', () => {
            const result = getEncountersByType('LOC_001', MOCK_NODES, MOCK_ENCOUNTERS, ENCOUNTER_TYPES.WILD);
            expect(result).toEqual(['ENC_001', 'ENC_003']);
        });
        it('deve filtrar apenas treinadores', () => {
            const result = getEncountersByType('LOC_001', MOCK_NODES, MOCK_ENCOUNTERS, ENCOUNTER_TYPES.TRAINER);
            expect(result).toEqual(['ENC_002']);
        });
        it('deve retornar pool completo se encountersData for null', () => {
            const result = getEncountersByType('LOC_001', MOCK_NODES, null, ENCOUNTER_TYPES.WILD);
            expect(result).toEqual(['ENC_001', 'ENC_002', 'ENC_003']);
        });
        it('deve funcionar com Map como encountersData', () => {
            const map = new Map(Object.entries(MOCK_ENCOUNTERS));
            const result = getEncountersByType('LOC_001', MOCK_NODES, map, ENCOUNTER_TYPES.WILD);
            expect(result).toEqual(['ENC_001', 'ENC_003']);
        });
    });

    describe('pickRandomEncounterId', () => {
        it('deve retornar um ID do pool', () => {
            const id = pickRandomEncounterId('LOC_001', MOCK_NODES);
            expect(['ENC_001', 'ENC_002', 'ENC_003']).toContain(id);
        });
        it('deve retornar null para pool vazio', () => {
            expect(pickRandomEncounterId('CITY_001', MOCK_NODES)).toBeNull();
        });
        it('deve excluir IDs especificados', () => {
            // Excluir todos exceto ENC_003
            const id = pickRandomEncounterId('LOC_001', MOCK_NODES, ['ENC_001', 'ENC_002']);
            expect(id).toBe('ENC_003');
        });
        it('deve retornar null quando todos excluídos', () => {
            const id = pickRandomEncounterId('LOC_001', MOCK_NODES, ['ENC_001', 'ENC_002', 'ENC_003']);
            expect(id).toBeNull();
        });
    });

    describe('hasEncounterPool', () => {
        it('deve retornar true para nó com encounters', () => {
            expect(hasEncounterPool('LOC_001', MOCK_NODES)).toBe(true);
        });
        it('deve retornar false para cidade sem encounters', () => {
            expect(hasEncounterPool('CITY_001', MOCK_NODES)).toBe(false);
        });
        it('deve retornar false para nó sem encounterPool field', () => {
            expect(hasEncounterPool('LOC_OLD', MOCK_NODES)).toBe(false);
        });
    });

    describe('ENCOUNTER_TYPES', () => {
        it('deve ter os tipos corretos', () => {
            expect(ENCOUNTER_TYPES.WILD).toBe('Selvagem');
            expect(ENCOUNTER_TYPES.TRAINER).toBe('Treinador');
            expect(ENCOUNTER_TYPES.BOSS).toBe('Boss');
        });
    });
});
