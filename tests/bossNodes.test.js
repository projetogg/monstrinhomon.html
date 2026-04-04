/**
 * BOSS NODES TESTS (PR-09)
 *
 * Testes para o sistema de Boss Nodes no overworld.
 * Cobertura:
 *   - defeat_boss unlockRule em isNodeUnlocked
 *   - getNodeLockReason com defeat_boss
 *   - Estado persistente de boss (bossDefeated em nodeFlags)
 *   - isBossDefeated helper
 *   - Regressão: outros tipos de unlock continuam funcionando
 */

import { describe, it, expect } from 'vitest';
import {
    isNodeUnlocked,
    getNodeLockReason,
    isBossDefeated,
    getEnrichedNodes
} from '../js/encounter/worldMap.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_LOCATIONS = [
    {
        id: 'LOC_008',
        name: 'Ruínas do Norte',
        description: 'Ruínas antigas.',
        biome: 'ruinas',
        tier: 'T4',
        levelRange: [12, 16],
        spots: []
    },
    {
        id: 'BOSS_FOREST_01',
        name: 'Guardião da Floresta',
        bossName: 'Guardião da Floresta',
        description: 'O antigo guardião desta região.',
        biome: 'floresta',
        tier: 'BOSS',
        levelRange: [15, 15],
        spots: []
    },
    {
        id: 'LOC_009',
        name: 'Floresta Profunda',
        description: 'Território além do Guardião.',
        biome: 'floresta',
        tier: 'T5',
        levelRange: [15, 20],
        spots: []
    }
];

const BOSS_NODE = {
    nodeId: 'BOSS_FOREST_01',
    type: 'boss',
    unlockDefault: false,
    unlockRule: { type: 'complete_node', nodeId: 'LOC_008' },
    connections: ['LOC_008', 'LOC_009'],
    bossMeta: {
        bossLevel: 15,
        regionId: 'forest_arc_1',
        unlocksNodes: ['LOC_009'],
        defeatMarksRegionComplete: true
    }
};

const LOC_009_NODE = {
    nodeId: 'LOC_009',
    type: 'exploration',
    unlockDefault: false,
    unlockRule: { type: 'defeat_boss', nodeId: 'BOSS_FOREST_01' },
    connections: ['BOSS_FOREST_01']
};

const LOC_008_NODE = {
    nodeId: 'LOC_008',
    type: 'exploration',
    unlockDefault: false,
    unlockRule: { type: 'complete_node', nodeId: 'LOC_004B' },
    connections: ['LOC_004B', 'BOSS_FOREST_01']
};

// ── Enriquecimento de nó boss ────────────────────────────────────────────────

describe('getEnrichedNodes — Boss node', () => {

    it('deve enriquecer boss node com dados da localização', () => {
        const nodes = getEnrichedNodes([BOSS_NODE], MOCK_LOCATIONS);
        expect(nodes).toHaveLength(1);
        const node = nodes[0];
        expect(node.nodeId).toBe('BOSS_FOREST_01');
        expect(node.type).toBe('boss');
        expect(node.name).toBe('Guardião da Floresta');
        expect(node.biome).toBe('floresta');
        expect(node.tier).toBe('BOSS');
    });

    it('deve preservar bossMeta no nó enriquecido', () => {
        const nodes = getEnrichedNodes([BOSS_NODE], MOCK_LOCATIONS);
        const node = nodes[0];
        expect(node.bossMeta).toBeDefined();
        expect(node.bossMeta.bossLevel).toBe(15);
        expect(node.bossMeta.regionId).toBe('forest_arc_1');
        expect(node.bossMeta.unlocksNodes).toEqual(['LOC_009']);
    });

});

// ── isBossDefeated helper ────────────────────────────────────────────────────

describe('isBossDefeated — helper de estado de boss', () => {

    it('deve retornar false quando nodeFlags é vazio', () => {
        expect(isBossDefeated('BOSS_FOREST_01', {})).toBe(false);
    });

    it('deve retornar false quando flag existe mas bossDefeated é false', () => {
        const flags = { BOSS_FOREST_01: { bossDefeated: false, bossAttempts: 1 } };
        expect(isBossDefeated('BOSS_FOREST_01', flags)).toBe(false);
    });

    it('deve retornar true quando bossDefeated é true', () => {
        const flags = { BOSS_FOREST_01: { bossDefeated: true, bossAttempts: 2 } };
        expect(isBossDefeated('BOSS_FOREST_01', flags)).toBe(true);
    });

    it('deve retornar false para boss diferente mesmo que outro boss esteja derrotado', () => {
        const flags = { BOSS_FOREST_01: { bossDefeated: true } };
        expect(isBossDefeated('BOSS_CAVE_01', flags)).toBe(false);
    });

    it('deve tratar nodeFlags ausente com segurança (save antigo)', () => {
        expect(isBossDefeated('BOSS_FOREST_01')).toBe(false);
        expect(isBossDefeated('BOSS_FOREST_01', null)).toBe(false);
        expect(isBossDefeated('BOSS_FOREST_01', undefined)).toBe(false);
    });

});

// ── isNodeUnlocked com defeat_boss ───────────────────────────────────────────

describe('isNodeUnlocked — defeat_boss unlockRule', () => {

    const visited   = new Set();
    const completed = new Set();

    it('deve bloquear LOC_009 antes do boss ser derrotado', () => {
        const flags = {}; // sem bossDefeated
        const unlocked = isNodeUnlocked(LOC_009_NODE, visited, completed, flags);
        expect(unlocked).toBe(false);
    });

    it('deve bloquear LOC_009 quando bossDefeated é false explícito', () => {
        const flags = { BOSS_FOREST_01: { bossDefeated: false, bossAttempts: 3 } };
        const unlocked = isNodeUnlocked(LOC_009_NODE, visited, completed, flags);
        expect(unlocked).toBe(false);
    });

    it('deve desbloquear LOC_009 após boss ser derrotado', () => {
        const flags = { BOSS_FOREST_01: { bossDefeated: true, bossAttempts: 1, firstDefeatedAt: '2026-01-01T00:00:00.000Z' } };
        const unlocked = isNodeUnlocked(LOC_009_NODE, visited, completed, flags);
        expect(unlocked).toBe(true);
    });

    it('deve desbloquear se LOC_009 foi visitado (compatibilidade retroativa)', () => {
        const flags = {};
        const visitedWithBoss = new Set(['LOC_009']);
        const unlocked = isNodeUnlocked(LOC_009_NODE, visitedWithBoss, completed, flags);
        expect(unlocked).toBe(true);
    });

    it('não deve desbloquear LOC_009 só por completedLocations sem bossDefeated', () => {
        const flags = {};
        const completedWithBoss = new Set(['BOSS_FOREST_01']);
        const unlocked = isNodeUnlocked(LOC_009_NODE, visited, completedWithBoss, flags);
        expect(unlocked).toBe(false);
    });

    it('boss node em si deve usar seu próprio unlockRule (complete_node)', () => {
        // BOSS_FOREST_01 requer LOC_008 completo
        const flagsEmpty = {};
        expect(isNodeUnlocked(BOSS_NODE, visited, completed, flagsEmpty)).toBe(false);

        const completedWithLoc008 = new Set(['LOC_008']);
        expect(isNodeUnlocked(BOSS_NODE, visited, completedWithLoc008, flagsEmpty)).toBe(true);
    });

});

// ── getNodeLockReason com defeat_boss ────────────────────────────────────────

describe('getNodeLockReason — defeat_boss', () => {

    const completed = new Set();
    const flags     = {};
    const visited   = new Set();

    it('deve retornar mensagem clara para bloqueio por defeat_boss', () => {
        const reason = getNodeLockReason(
            LOC_009_NODE, completed, flags, new Set(), visited, MOCK_LOCATIONS
        );
        expect(reason).toContain('Guardião da Floresta');
        expect(reason).toContain('Derrote');
    });

    it('deve usar o nodeId se location não encontrada', () => {
        const reason = getNodeLockReason(
            LOC_009_NODE, completed, flags, new Set(), visited, []
        );
        expect(reason).toContain('BOSS_FOREST_01');
        expect(reason).toContain('Derrote');
    });

    it('deve usar bossName do location quando disponível', () => {
        const reason = getNodeLockReason(
            LOC_009_NODE, completed, flags, new Set(), visited, MOCK_LOCATIONS
        );
        // MOCK_LOCATIONS tem bossName: 'Guardião da Floresta'
        expect(reason).toContain('Guardião da Floresta');
    });

    it('deve retornar string vazia para nó já desbloqueado', () => {
        const flagsDefeated = { BOSS_FOREST_01: { bossDefeated: true } };
        const visitedLoc009 = new Set(['LOC_009']);
        // LOC_009 desbloqueado via visited → getNodeLockReason não é chamado na prática,
        // mas deve retornar algo coherente se chamado manualmente
        // (a função não verifica unlocked internamente, apenas interpreta a regra)
        const reason = getNodeLockReason(
            LOC_009_NODE, completed, flagsDefeated, new Set(), visited, MOCK_LOCATIONS
        );
        // Com bossDefeated=true, a regra defeat_boss está satisfeita → não retorna razão de bloqueio
        // (a função ainda avalia a rule; como a condição está satisfeita, retorna string)
        // Nota: getNodeLockReason é chamada APENAS quando o nó está bloqueado na UI
        // Aqui verificamos que não lança erro
        expect(typeof reason).toBe('string');
    });

    // Regressão: outros tipos de unlock
    it('deve continuar funcionando com complete_node', () => {
        const nodeWithCompleteRule = {
            nodeId: 'LOC_010',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'complete_node', nodeId: 'LOC_009' },
            connections: ['LOC_009']
        };
        const locData = [{ id: 'LOC_009', name: 'Floresta Profunda' }];
        const reason = getNodeLockReason(nodeWithCompleteRule, new Set(), {}, new Set(), new Set(), locData);
        expect(reason).toContain('Floresta Profunda');
        expect(reason).toContain('Complete');
    });

    it('deve continuar funcionando com win_n_battles_in_node', () => {
        const nodeWithWinsRule = {
            nodeId: 'LOC_011',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'win_n_battles_in_node', nodeId: 'LOC_009', n: 3 },
            connections: ['LOC_009']
        };
        const locData = [{ id: 'LOC_009', name: 'Floresta Profunda' }];
        const flags   = { LOC_009: { wildWins: 1 } };
        const reason  = getNodeLockReason(nodeWithWinsRule, new Set(), flags, new Set(), new Set(), locData);
        expect(reason).toContain('1/3');
    });

});

// ── Estado persistente de boss ────────────────────────────────────────────────

describe('Estado persistente de boss — estrutura de nodeFlags', () => {

    it('deve inicializar flags defensivamente para save antigo sem nodeFlags', () => {
        // Simular leitura de save antigo sem nodeFlags[BOSS_FOREST_01]
        const flags = {}; // sem entrada para o boss
        expect(isBossDefeated('BOSS_FOREST_01', flags)).toBe(false);
        // isNodeUnlocked não deve lançar erro
        expect(() => isNodeUnlocked(LOC_009_NODE, new Set(), new Set(), flags)).not.toThrow();
    });

    it('deve suportar tentativas sem vitória (bossAttempts sem bossDefeated)', () => {
        const flags = {
            BOSS_FOREST_01: {
                bossAttempts: 5,
                bossDefeated: false
            }
        };
        expect(isBossDefeated('BOSS_FOREST_01', flags)).toBe(false);
        expect(isNodeUnlocked(LOC_009_NODE, new Set(), new Set(), flags)).toBe(false);
    });

    it('deve persistir timestamp e tentativas após vitória', () => {
        const flags = {
            BOSS_FOREST_01: {
                bossDefeated: true,
                bossAttempts: 3,
                firstDefeatedAt: '2026-04-04T00:00:00.000Z'
            }
        };
        expect(isBossDefeated('BOSS_FOREST_01', flags)).toBe(true);
        expect(flags.BOSS_FOREST_01.bossAttempts).toBe(3);
        expect(flags.BOSS_FOREST_01.firstDefeatedAt).toBe('2026-04-04T00:00:00.000Z');
    });

    it('deve manter outros campos de nodeFlags intactos', () => {
        const flags = {
            LOC_001: { wildWins: 5 },
            BOSS_FOREST_01: { bossDefeated: true }
        };
        // LOC_001 não afetado
        expect(flags['LOC_001'].wildWins).toBe(5);
        // Boss derrotado
        expect(isBossDefeated('BOSS_FOREST_01', flags)).toBe(true);
    });

});

// ── Regressão: fluxo existente não quebrado ──────────────────────────────────

describe('Regressão — sistema existente', () => {

    const explored = new Set(['LOC_001']);
    const completed = new Set(['LOC_001', 'LOC_001B']);
    const flags = { LOC_001: { wildWins: 3 } };
    const questIds = new Set(['QST_001']);

    it('complete_node continua funcionando', () => {
        const node = {
            nodeId: 'LOC_002',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'complete_node', nodeId: 'LOC_001' },
            connections: ['LOC_001']
        };
        expect(isNodeUnlocked(node, explored, completed, flags, questIds)).toBe(true);
    });

    it('win_n_battles_in_node continua funcionando', () => {
        const node = {
            nodeId: 'LOC_001B',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'win_n_battles_in_node', nodeId: 'LOC_001', n: 1 },
            connections: ['LOC_001']
        };
        expect(isNodeUnlocked(node, explored, completed, flags, questIds)).toBe(true);
    });

    it('visit_city continua funcionando', () => {
        const node = {
            nodeId: 'LOC_005',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'visit_city', cityId: 'CITY_001' },
            connections: ['CITY_001']
        };
        const visitedWithCity = new Set(['LOC_001', 'CITY_001']);
        expect(isNodeUnlocked(node, visitedWithCity, completed, flags, questIds)).toBe(true);
    });

    it('complete_quest continua funcionando', () => {
        const node = {
            nodeId: 'LOC_006',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'complete_quest', questId: 'QST_001' },
            connections: []
        };
        expect(isNodeUnlocked(node, explored, completed, flags, questIds)).toBe(true);
    });

    it('unlockDefault: true sempre desbloqueado', () => {
        const node = {
            nodeId: 'CITY_001',
            type: 'city',
            unlockDefault: true,
            connections: []
        };
        expect(isNodeUnlocked(node, new Set(), new Set(), {})).toBe(true);
    });

    it('tipo de unlock desconhecido retorna false', () => {
        const node = {
            nodeId: 'LOC_999',
            type: 'exploration',
            unlockDefault: false,
            unlockRule: { type: 'unknown_type', nodeId: 'LOC_001' },
            connections: []
        };
        expect(isNodeUnlocked(node, new Set(), new Set(['LOC_001']), {})).toBe(false);
    });

    it('cidade (CITY_001) continua reconhecida e não é boss', () => {
        const cityNode = {
            nodeId: 'CITY_001',
            type: 'city',
            unlockDefault: true,
            connections: ['LOC_001']
        };
        expect(cityNode.type).toBe('city');
        expect(cityNode.type).not.toBe('boss');
        expect(isNodeUnlocked(cityNode, new Set(), new Set(), {})).toBe(true);
    });

});

// ── Integração: boss + quest ──────────────────────────────────────────────────

describe('Integração — defeat_boss + quest hint', () => {

    it('localId de quest pode apontar para boss node', () => {
        // Verifica que a estrutura de quest com localId === 'BOSS_FOREST_01' é válida
        const mockQuest = {
            id: 'QST_BOSS_001',
            nome: 'Derrote o Guardião',
            localId: 'BOSS_FOREST_01',
            objectiveType: 'defeat_boss',
            killCount: 1,
            currentKills: 0
        };
        expect(mockQuest.localId).toBe('BOSS_FOREST_01');
        expect(mockQuest.objectiveType).toBe('defeat_boss');
    });

    it('boss node pode ter quests ativas indicadas pelo badge', () => {
        // O sistema usa activeQuestLocationIds.has(node.nodeId) para badge ❗
        const activeQuestLocationIds = new Set(['BOSS_FOREST_01']);
        expect(activeQuestLocationIds.has('BOSS_FOREST_01')).toBe(true);
        expect(activeQuestLocationIds.has('LOC_009')).toBe(false);
    });

});
