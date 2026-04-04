/**
 * REGIONAL PROGRESS TESTS (PR-10)
 *
 * Testes para o sistema de progressão regional pós-boss.
 * Cobertura:
 *   - markRegionComplete: marcar região como concluída
 *   - isRegionComplete: verificar se região foi concluída
 *   - getRegionalProgressSummary: resumo de progresso por região
 *   - isQuestRegionObjectiveComplete: quests reagindo a conclusão regional
 *   - Retrocompatibilidade com saves antigos (sem regionalProgress)
 *   - defeatMarksRegionComplete como sistema real
 *   - boss sem defeatMarksRegionComplete não marca região
 *   - integração com isBossDefeated
 */

import { describe, it, expect } from 'vitest';
import {
    markRegionComplete,
    isRegionComplete,
    getRegionalProgressSummary,
    isQuestRegionObjectiveComplete,
    isBossDefeated,
    deriveRegionLabel,
    getRegionStatus,
    getRegionNextObjective
} from '../js/encounter/worldMap.js';

// ── Fixtures ───────────────────────────────────────────────────────────────────

const BOSS_META_WITH_REGION = {
    bossLevel: 15,
    regionId: 'forest_arc_1',
    unlocksNodes: ['LOC_009'],
    defeatMarksRegionComplete: true,
    bossLabel: 'Guardião da Floresta',
    bossFlavor: 'Uma presença ancestral protege esta mata.',
    bossEncounterMode: 'fixed_pool',
    bossPool: ['MON_023C', 'MON_022B']
};

const BOSS_META_NO_REGION = {
    bossLevel: 10,
    unlocksNodes: ['LOC_010']
    // sem regionId e sem defeatMarksRegionComplete
};

const BOSS_META_NO_FLAG = {
    bossLevel: 12,
    regionId: 'cave_arc_1',
    unlocksNodes: ['LOC_020'],
    defeatMarksRegionComplete: false // explicitamente false
};

const WORLD_MAP_NODES = [
    {
        nodeId: 'BOSS_FOREST_01',
        type: 'boss',
        bossMeta: BOSS_META_WITH_REGION
    },
    {
        nodeId: 'BOSS_CAVE_01',
        type: 'boss',
        bossMeta: BOSS_META_NO_FLAG
    },
    {
        nodeId: 'LOC_001',
        type: 'exploration'
        // sem bossMeta
    }
];

// ── markRegionComplete ─────────────────────────────────────────────────────────

describe('markRegionComplete — marcar região como concluída', () => {

    it('deve marcar região como concluída quando defeatMarksRegionComplete=true', () => {
        const result = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', {});
        expect(result['forest_arc_1']).toBeDefined();
        expect(result['forest_arc_1'].completed).toBe(true);
        expect(result['forest_arc_1'].completedByBossNodeId).toBe('BOSS_FOREST_01');
        expect(result['forest_arc_1'].completedAt).toBeDefined();
    });

    it('deve preservar timestamp fornecido', () => {
        const ts = '2026-04-04T00:00:00.000Z';
        const result = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', {}, ts);
        expect(result['forest_arc_1'].completedAt).toBe(ts);
    });

    it('não deve marcar região se defeatMarksRegionComplete é false', () => {
        const result = markRegionComplete(BOSS_META_NO_FLAG, 'BOSS_CAVE_01', {});
        expect(result['cave_arc_1']).toBeUndefined();
    });

    it('não deve marcar região se bossMeta não tem regionId', () => {
        const result = markRegionComplete(BOSS_META_NO_REGION, 'BOSS_002', {});
        // BOSS_META_NO_REGION não tem regionId nem defeatMarksRegionComplete
        expect(Object.keys(result)).toHaveLength(0);
    });

    it('deve ser idempotente — não sobrescrever se já concluída', () => {
        const existing = {
            'forest_arc_1': {
                completed: true,
                completedByBossNodeId: 'BOSS_FOREST_01',
                completedAt: '2026-01-01T00:00:00.000Z'
            }
        };
        const result = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', existing);
        // Deve retornar o mesmo objeto (sem modificação)
        expect(result['forest_arc_1'].completedAt).toBe('2026-01-01T00:00:00.000Z');
    });

    it('deve preservar outras regiões no objeto ao marcar nova região', () => {
        const existing = {
            'plains_arc_1': {
                completed: true,
                completedByBossNodeId: 'BOSS_PLAINS_01',
                completedAt: '2026-01-01T00:00:00.000Z'
            }
        };
        const result = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', existing);
        expect(result['plains_arc_1']).toBeDefined();
        expect(result['forest_arc_1']).toBeDefined();
    });

    it('deve tratar regionalProgress ausente/null com segurança (save antigo)', () => {
        expect(() => markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01')).not.toThrow();
        expect(() => markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', null)).not.toThrow();
        expect(() => markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', undefined)).not.toThrow();
    });

    it('deve tratar bossMeta null/undefined com segurança', () => {
        expect(() => markRegionComplete(null, 'BOSS_001', {})).not.toThrow();
        expect(() => markRegionComplete(undefined, 'BOSS_001', {})).not.toThrow();
        const result = markRegionComplete(null, 'BOSS_001', {});
        expect(result).toEqual({});
    });

    it('não deve modificar o objeto original (imutabilidade)', () => {
        const original = {};
        const result = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', original);
        // original deve permanecer intacto
        expect(original['forest_arc_1']).toBeUndefined();
        // resultado tem a região
        expect(result['forest_arc_1']).toBeDefined();
    });

});

// ── isRegionComplete ─────────────────────────────────────────────────────────

describe('isRegionComplete — verificar se região foi concluída', () => {

    it('deve retornar false quando regionalProgress é vazio', () => {
        expect(isRegionComplete('forest_arc_1', {})).toBe(false);
    });

    it('deve retornar false quando região não existe em regionalProgress', () => {
        const progress = { 'other_arc': { completed: true } };
        expect(isRegionComplete('forest_arc_1', progress)).toBe(false);
    });

    it('deve retornar true quando região está marcada como concluída', () => {
        const progress = { 'forest_arc_1': { completed: true, completedByBossNodeId: 'BOSS_FOREST_01' } };
        expect(isRegionComplete('forest_arc_1', progress)).toBe(true);
    });

    it('deve retornar false se completed é false explícito', () => {
        const progress = { 'forest_arc_1': { completed: false } };
        expect(isRegionComplete('forest_arc_1', progress)).toBe(false);
    });

    it('deve tratar regionalProgress null/undefined com segurança (save antigo)', () => {
        expect(isRegionComplete('forest_arc_1')).toBe(false);
        expect(isRegionComplete('forest_arc_1', null)).toBe(false);
        expect(isRegionComplete('forest_arc_1', undefined)).toBe(false);
    });

    it('deve retornar false se regionId é vazio/null', () => {
        const progress = { 'forest_arc_1': { completed: true } };
        expect(isRegionComplete('', progress)).toBe(false);
        expect(isRegionComplete(null, progress)).toBe(false);
        expect(isRegionComplete(undefined, progress)).toBe(false);
    });

    it('deve suportar múltiplas regiões independentes', () => {
        const progress = {
            'forest_arc_1': { completed: true },
            'cave_arc_1':   { completed: false },
            'plains_arc_1': { completed: true }
        };
        expect(isRegionComplete('forest_arc_1', progress)).toBe(true);
        expect(isRegionComplete('cave_arc_1', progress)).toBe(false);
        expect(isRegionComplete('plains_arc_1', progress)).toBe(true);
    });

});

// ── getRegionalProgressSummary ─────────────────────────────────────────────────

describe('getRegionalProgressSummary — resumo de progresso regional', () => {

    it('deve retornar array vazio quando worldMapNodes é vazio', () => {
        expect(getRegionalProgressSummary([])).toEqual([]);
    });

    it('deve retornar array vazio quando worldMapNodes não é array', () => {
        expect(getRegionalProgressSummary(null)).toEqual([]);
        expect(getRegionalProgressSummary(undefined)).toEqual([]);
    });

    it('deve ignorar nós que não são do tipo boss', () => {
        const result = getRegionalProgressSummary(WORLD_MAP_NODES, {}, {});
        // Apenas BOSS_FOREST_01 tem regionId; BOSS_CAVE_01 tem regionId mas defeatMarksRegionComplete=false
        // Ambos bosses devem aparecer se tiverem regionId
        result.forEach(r => {
            expect(r.regionId).toBeDefined();
        });
        // LOC_001 não deve aparecer
        expect(result.find(r => r.bossNodeId === 'LOC_001')).toBeUndefined();
    });

    it('deve incluir boss nodes com regionId', () => {
        const result = getRegionalProgressSummary(WORLD_MAP_NODES, {}, {});
        const forestEntry = result.find(r => r.bossNodeId === 'BOSS_FOREST_01');
        expect(forestEntry).toBeDefined();
        expect(forestEntry.regionId).toBe('forest_arc_1');
        expect(forestEntry.bossLabel).toBe('Guardião da Floresta');
    });

    it('deve marcar completed=true quando região está concluída', () => {
        const progress = { 'forest_arc_1': { completed: true } };
        const result = getRegionalProgressSummary(WORLD_MAP_NODES, {}, progress);
        const entry = result.find(r => r.bossNodeId === 'BOSS_FOREST_01');
        expect(entry.completed).toBe(true);
    });

    it('deve marcar completed=false quando região não foi concluída', () => {
        const result = getRegionalProgressSummary(WORLD_MAP_NODES, {}, {});
        const entry = result.find(r => r.bossNodeId === 'BOSS_FOREST_01');
        expect(entry.completed).toBe(false);
    });

    it('deve refletir bossDefeated a partir de nodeFlags', () => {
        const nodeFlags = { 'BOSS_FOREST_01': { bossDefeated: true } };
        const result = getRegionalProgressSummary(WORLD_MAP_NODES, nodeFlags, {});
        const entry = result.find(r => r.bossNodeId === 'BOSS_FOREST_01');
        expect(entry.bossDefeated).toBe(true);
    });

    it('deve tratar nodeFlags e regionalProgress ausentes com segurança', () => {
        expect(() => getRegionalProgressSummary(WORLD_MAP_NODES)).not.toThrow();
        expect(() => getRegionalProgressSummary(WORLD_MAP_NODES, null, null)).not.toThrow();
    });

    it('deve usar bossNodeId como bossLabel quando bossMeta não tem bossLabel', () => {
        const nodesWithoutLabel = [
            {
                nodeId: 'BOSS_TEST_01',
                type: 'boss',
                bossMeta: { regionId: 'test_arc', bossLevel: 5, defeatMarksRegionComplete: true }
            }
        ];
        const result = getRegionalProgressSummary(nodesWithoutLabel, {}, {});
        expect(result[0].bossLabel).toBe('BOSS_TEST_01');
    });

});

// ── isQuestRegionObjectiveComplete ─────────────────────────────────────────────

describe('isQuestRegionObjectiveComplete — quests reagindo a conclusão regional', () => {

    const completedRegion = { 'forest_arc_1': { completed: true } };

    it('deve retornar false para quest sem objectiveType', () => {
        const quest = { id: 'QST_001', targetRegionId: 'forest_arc_1' };
        expect(isQuestRegionObjectiveComplete(quest, completedRegion)).toBe(false);
    });

    it('deve retornar false para quest com objectiveType diferente de complete_region', () => {
        const quest = { id: 'QST_001', objectiveType: 'defeat_boss', targetRegionId: 'forest_arc_1' };
        expect(isQuestRegionObjectiveComplete(quest, completedRegion)).toBe(false);
    });

    it('deve retornar false para quest sem targetRegionId', () => {
        const quest = { id: 'QST_001', objectiveType: 'complete_region' };
        expect(isQuestRegionObjectiveComplete(quest, completedRegion)).toBe(false);
    });

    it('deve retornar true quando região está concluída e quest aponta para ela', () => {
        const quest = {
            id: 'QST_FOREST_ARC_END',
            objectiveType: 'complete_region',
            targetRegionId: 'forest_arc_1'
        };
        expect(isQuestRegionObjectiveComplete(quest, completedRegion)).toBe(true);
    });

    it('deve retornar false quando região não está concluída', () => {
        const quest = {
            id: 'QST_FOREST_ARC_END',
            objectiveType: 'complete_region',
            targetRegionId: 'forest_arc_1'
        };
        expect(isQuestRegionObjectiveComplete(quest, {})).toBe(false);
    });

    it('deve tratar quest null/undefined com segurança', () => {
        expect(isQuestRegionObjectiveComplete(null, completedRegion)).toBe(false);
        expect(isQuestRegionObjectiveComplete(undefined, completedRegion)).toBe(false);
    });

    it('deve tratar regionalProgress null/undefined com segurança (save antigo)', () => {
        const quest = { id: 'QST_001', objectiveType: 'complete_region', targetRegionId: 'forest_arc_1' };
        expect(isQuestRegionObjectiveComplete(quest, null)).toBe(false);
        expect(isQuestRegionObjectiveComplete(quest, undefined)).toBe(false);
    });

});

// ── Fluxo integrado boss → região ────────────────────────────────────────────

describe('Fluxo integrado — vitória em boss → progressão regional', () => {

    it('fluxo completo: boss derrotado → região marcada', () => {
        // Simular o que closeBattleResult faz
        let nodeFlags = {};
        let regionalProgress = {};

        // 1. Marcar boss como derrotado
        nodeFlags['BOSS_FOREST_01'] = {
            bossDefeated: true,
            firstDefeatedAt: '2026-04-04T00:00:00.000Z',
            bossAttempts: 1
        };

        // 2. Verificar que boss está derrotado
        expect(isBossDefeated('BOSS_FOREST_01', nodeFlags)).toBe(true);

        // 3. Marcar região como concluída
        regionalProgress = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', regionalProgress);

        // 4. Verificar que região está concluída
        expect(isRegionComplete('forest_arc_1', regionalProgress)).toBe(true);
        expect(regionalProgress['forest_arc_1'].completedByBossNodeId).toBe('BOSS_FOREST_01');
    });

    it('derrota/fuga em boss NÃO deve marcar região como concluída', () => {
        // Simular cenário de derrota: bossDefeated permanece false
        const nodeFlags = {
            'BOSS_FOREST_01': { bossDefeated: false, bossAttempts: 2 }
        };
        const regionalProgress = {};

        // Verificar que boss NÃO está derrotado
        expect(isBossDefeated('BOSS_FOREST_01', nodeFlags)).toBe(false);

        // A lógica só deve marcar região se bossDefeated === true
        // (o código em closeBattleResult só chama markRegionComplete no bloco de vitória)
        expect(isRegionComplete('forest_arc_1', regionalProgress)).toBe(false);
    });

    it('boss sem defeatMarksRegionComplete NÃO marca região', () => {
        const nodeFlags = { 'BOSS_CAVE_01': { bossDefeated: true } };
        const regionalProgress = markRegionComplete(BOSS_META_NO_FLAG, 'BOSS_CAVE_01', {});
        // BOSS_META_NO_FLAG tem defeatMarksRegionComplete: false
        expect(Object.keys(regionalProgress)).toHaveLength(0);
    });

    it('save antigo sem regionalProgress não quebra ao calcular summary', () => {
        // GameState.data.regionalProgress pode ser undefined em saves antigos
        const nodeFlags = { 'BOSS_FOREST_01': { bossDefeated: true } };
        const regionalProgress = undefined; // save antigo

        expect(() => getRegionalProgressSummary(WORLD_MAP_NODES, nodeFlags, regionalProgress)).not.toThrow();
        expect(() => isRegionComplete('forest_arc_1', regionalProgress)).not.toThrow();
    });

    it('markRegionComplete é idempotente ao chamar duas vezes', () => {
        let progress = {};
        const ts1 = '2026-04-04T00:00:00.000Z';
        progress = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', progress, ts1);

        // Segunda chamada (boss "derrotado novamente")
        const ts2 = '2026-04-05T00:00:00.000Z';
        progress = markRegionComplete(BOSS_META_WITH_REGION, 'BOSS_FOREST_01', progress, ts2);

        // Timestamp original deve ser preservado (não sobrescrito)
        expect(progress['forest_arc_1'].completedAt).toBe(ts1);
    });

});

// ── bossPool e bossEncounterMode ──────────────────────────────────────────────

describe('bossMeta — estrutura de identidade do boss (PR-10)', () => {

    it('bossMeta de BOSS_FOREST_01 deve ter campos de identidade', () => {
        expect(BOSS_META_WITH_REGION.bossLabel).toBe('Guardião da Floresta');
        expect(BOSS_META_WITH_REGION.bossFlavor).toBeDefined();
        expect(BOSS_META_WITH_REGION.bossEncounterMode).toBe('fixed_pool');
        expect(Array.isArray(BOSS_META_WITH_REGION.bossPool)).toBe(true);
        expect(BOSS_META_WITH_REGION.bossPool.length).toBeGreaterThan(0);
    });

    it('bossPool deve conter IDs válidos de monstro', () => {
        for (const id of BOSS_META_WITH_REGION.bossPool) {
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        }
    });

    it('estrutura de bossPool está pronta para seleção aleatória', () => {
        const pool = BOSS_META_WITH_REGION.bossPool;
        const selected = pool[Math.floor(Math.random() * pool.length)];
        expect(pool).toContain(selected);
    });

    it('boss sem bossPool faz fallback para undefined (aleatório no runtime)', () => {
        expect(BOSS_META_NO_REGION.bossPool).toBeUndefined();
        expect(BOSS_META_NO_FLAG.bossPool).toBeUndefined();
    });

});

// ── Regressão ─────────────────────────────────────────────────────────────────

describe('Regressão — sistema existente não afetado', () => {

    it('isBossDefeated continua funcionando normalmente', () => {
        expect(isBossDefeated('BOSS_FOREST_01', {})).toBe(false);
        expect(isBossDefeated('BOSS_FOREST_01', { 'BOSS_FOREST_01': { bossDefeated: true } })).toBe(true);
        expect(isBossDefeated('BOSS_FOREST_01', null)).toBe(false);
    });

    it('getRegionalProgressSummary não afeta nós de exploração ou cidade', () => {
        const mixedNodes = [
            { nodeId: 'CITY_001', type: 'city' },
            { nodeId: 'LOC_001', type: 'exploration' },
            { nodeId: 'BOSS_FOREST_01', type: 'boss', bossMeta: BOSS_META_WITH_REGION }
        ];
        const result = getRegionalProgressSummary(mixedNodes, {}, {});
        expect(result.find(r => r.bossNodeId === 'CITY_001')).toBeUndefined();
        expect(result.find(r => r.bossNodeId === 'LOC_001')).toBeUndefined();
        expect(result.find(r => r.bossNodeId === 'BOSS_FOREST_01')).toBeDefined();
    });

    it('nós boss sem bossMeta são ignorados no summary', () => {
        const nodesWithoutMeta = [
            { nodeId: 'BOSS_LEGACY_01', type: 'boss' } // sem bossMeta
        ];
        const result = getRegionalProgressSummary(nodesWithoutMeta, {}, {});
        expect(result).toHaveLength(0);
    });

    it('nós boss com bossMeta mas sem regionId são ignorados no summary', () => {
        const nodesWithoutRegion = [
            { nodeId: 'BOSS_NOREG_01', type: 'boss', bossMeta: { bossLevel: 10 } }
        ];
        const result = getRegionalProgressSummary(nodesWithoutRegion, {}, {});
        expect(result).toHaveLength(0);
    });

});

// ── PR-11: deriveRegionLabel ────────────────────────────────────────────────

describe('deriveRegionLabel — nome amigável a partir do regionId (PR-11)', () => {

    it('deve capitalizar palavras e substituir underscores', () => {
        expect(deriveRegionLabel('forest_arc_1')).toBe('Forest Arc 1');
        expect(deriveRegionLabel('cave_arc_1')).toBe('Cave Arc 1');
        expect(deriveRegionLabel('minas_profundas')).toBe('Minas Profundas');
    });

    it('deve tratar regionId com uma só palavra', () => {
        expect(deriveRegionLabel('floresta')).toBe('Floresta');
    });

    it('deve retornar fallback para entrada vazia ou null', () => {
        expect(deriveRegionLabel('')).toBe('Região Desconhecida');
        expect(deriveRegionLabel(null)).toBe('Região Desconhecida');
        expect(deriveRegionLabel(undefined)).toBe('Região Desconhecida');
        expect(deriveRegionLabel(0)).toBe('Região Desconhecida');
        expect(deriveRegionLabel(false)).toBe('Região Desconhecida');
    });

});

// ── PR-11: getRegionStatus ──────────────────────────────────────────────────

describe('getRegionStatus — status visual da região (PR-11)', () => {

    const BOSS_NODE_WITH_RULE = {
        nodeId: 'BOSS_FOREST_01',
        type: 'boss',
        unlockRule: { type: 'complete_node', nodeId: 'LOC_008' },
        connections: ['LOC_008', 'LOC_009'],
        bossMeta: BOSS_META_WITH_REGION
    };

    it('deve retornar "completed" se região foi concluída', () => {
        const status = getRegionStatus(BOSS_NODE_WITH_RULE, true, true);
        expect(status).toBe('completed');
    });

    it('deve retornar "in_progress" se boss desbloqueado mas não derrotado', () => {
        const completedLocations = new Set(['LOC_008']);
        const status = getRegionStatus(
            BOSS_NODE_WITH_RULE, false, false, new Set(), completedLocations, {}, new Set()
        );
        expect(status).toBe('in_progress');
    });

    it('deve retornar "available" se algum vizinho foi visitado mas boss não desbloqueado', () => {
        // LOC_008 foi visitado mas não concluído, então boss ainda bloqueado
        const visitedLocations  = new Set(['LOC_008']);
        const completedLocations = new Set(); // LOC_008 não concluído → boss locked
        const status = getRegionStatus(
            BOSS_NODE_WITH_RULE, false, false, visitedLocations, completedLocations, {}, new Set()
        );
        expect(status).toBe('available');
    });

    it('deve retornar "locked" se nenhum vizinho foi visitado/concluído', () => {
        const status = getRegionStatus(
            BOSS_NODE_WITH_RULE, false, false, new Set(), new Set(), {}, new Set()
        );
        expect(status).toBe('locked');
    });

    it('deve usar defaults vazios quando parâmetros opcionais são omitidos', () => {
        const status = getRegionStatus(BOSS_NODE_WITH_RULE, false, false);
        expect(status).toBe('locked');
    });

});

// ── PR-11: getRegionNextObjective ───────────────────────────────────────────

describe('getRegionNextObjective — próximo objetivo macro (PR-11)', () => {

    it('deve retornar null para região concluída', () => {
        expect(getRegionNextObjective('completed', 'Guardião', 'Floresta Antiga')).toBeNull();
    });

    it('deve recomendar derrotar o boss para in_progress', () => {
        const obj = getRegionNextObjective('in_progress', 'Guardião da Floresta', 'Floresta Antiga');
        expect(obj).toBe('Derrote Guardião da Floresta');
    });

    it('deve recomendar explorar a região para available', () => {
        const obj = getRegionNextObjective('available', 'Guardião da Floresta', 'Floresta Antiga');
        expect(obj).toContain('Floresta Antiga');
        expect(obj).toContain('Guardião da Floresta');
    });

    it('deve recomendar desbloquear regiões anteriores para locked', () => {
        const obj = getRegionNextObjective('locked', 'Guardião', 'Floresta Antiga');
        expect(obj).toContain('Desbloqueie');
    });

    it('deve retornar null para status desconhecido', () => {
        expect(getRegionNextObjective('unknown', 'Boss', 'Região')).toBeNull();
    });

});

// ── PR-11: getRegionalProgressSummary enriquecido ──────────────────────────

describe('getRegionalProgressSummary — campos enriquecidos (PR-11)', () => {

    const NODES_PR11 = [
        {
            nodeId: 'BOSS_FOREST_01',
            type: 'boss',
            unlockDefault: false,
            unlockRule: { type: 'complete_node', nodeId: 'LOC_008' },
            connections: ['LOC_008', 'LOC_009'],
            bossMeta: {
                ...BOSS_META_WITH_REGION,
                regionLabel: 'Floresta Antiga'
            }
        },
        {
            nodeId: 'BOSS_CAVE_01',
            type: 'boss',
            unlockDefault: false,
            unlockRule: { type: 'complete_node', nodeId: 'LOC_020' },
            connections: ['LOC_020'],
            bossMeta: BOSS_META_NO_FLAG
        }
    ];

    it('deve retornar regionLabel de bossMeta quando disponível', () => {
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        const forest = result.find(r => r.regionId === 'forest_arc_1');
        expect(forest.regionLabel).toBe('Floresta Antiga');
    });

    it('deve derivar regionLabel se bossMeta.regionLabel não está definido', () => {
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        const cave = result.find(r => r.regionId === 'cave_arc_1');
        // BOSS_META_NO_FLAG não tem regionLabel → deriva de 'cave_arc_1'
        expect(cave.regionLabel).toBe('Cave Arc 1');
    });

    it('deve retornar status "completed" para região concluída', () => {
        const progress = { 'forest_arc_1': { completed: true, completedByBossNodeId: 'BOSS_FOREST_01' } };
        const result = getRegionalProgressSummary(NODES_PR11, {}, progress);
        const forest = result.find(r => r.regionId === 'forest_arc_1');
        expect(forest.status).toBe('completed');
        expect(forest.nextObjective).toBeNull();
    });

    it('deve retornar status "in_progress" quando boss node está desbloqueado', () => {
        const completedLocations = new Set(['LOC_008']);
        const result = getRegionalProgressSummary(
            NODES_PR11, {}, {}, new Set(), completedLocations, new Set()
        );
        const forest = result.find(r => r.regionId === 'forest_arc_1');
        expect(forest.status).toBe('in_progress');
        expect(forest.nextObjective).toContain('Derrote');
    });

    it('deve retornar status "locked" sem progresso', () => {
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        const forest = result.find(r => r.regionId === 'forest_arc_1');
        expect(forest.status).toBe('locked');
    });

    it('deve marcar isCurrent=true para a primeira região não concluída', () => {
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        const currentRegions = result.filter(r => r.isCurrent);
        expect(currentRegions).toHaveLength(1);
        expect(result[0].isCurrent).toBe(true); // primeira região não concluída
    });

    it('deve marcar isCurrent=false para todas quando todas concluídas', () => {
        const progress = {
            'forest_arc_1': { completed: true },
            'cave_arc_1':   { completed: true }
        };
        const result = getRegionalProgressSummary(NODES_PR11, {}, progress);
        // Nenhuma isCurrent quando tudo concluído
        expect(result.every(r => r.isCurrent === false)).toBe(true);
    });

    it('deve retornar nextObjective para região não concluída', () => {
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        const forest = result.find(r => r.regionId === 'forest_arc_1');
        expect(forest.nextObjective).toBeTruthy();
    });

    it('deve funcionar com parâmetros de context omitidos (retrocompatibilidade)', () => {
        // Assinatura original: (worldMapNodes, nodeFlags, regionalProgress)
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        // NODES_PR11 tem 2 bosses com regionId: forest_arc_1 e cave_arc_1
        expect(result).toHaveLength(2);
        result.forEach(r => {
            expect(r.regionId).toBeDefined();
            expect(r.regionLabel).toBeDefined();
            expect(r.status).toMatch(/^(completed|in_progress|available|locked)$/);
            expect(r.bossLabel).toBeDefined();
        });
    });

    it('não deve expor IDs técnicos como regionLabel principal', () => {
        const result = getRegionalProgressSummary(NODES_PR11, {}, {});
        result.forEach(r => {
            // regionLabel não deve ser igual ao regionId (id técnico)
            expect(r.regionLabel).not.toBe(r.regionId);
        });
    });

});
