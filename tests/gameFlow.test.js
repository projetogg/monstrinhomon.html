/**
 * GAME FLOW TESTS
 *
 * Testes funcionais do módulo js/gameFlow.js.
 * Cobertura:
 *  - ensureQuestState / autoActivateFirstQuest
 *  - activateQuest (pré-requisito, idempotência)
 *  - processQuestProgress (todos os tipos de objetivo)
 *  - completeQuest (recompensas via DI, cadeia automática)
 *  - handlePostEncounterFlow (orquestrador completo)
 *  - getActiveQuestsSummary / hasCompletedQuest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    ensureQuestState,
    activateQuest,
    autoActivateFirstQuest,
    processQuestProgress,
    completeQuest,
    handlePostEncounterFlow,
    getActiveQuestsSummary,
    hasCompletedQuest
} from '../js/gameFlow.js';

// ═══════════════════════════════════════════════════
// Factories
// ═══════════════════════════════════════════════════

function makePlayer(overrides = {}) {
    return {
        id: 'player_test',
        name: 'Teste',
        class: 'Guerreiro',
        money: 0,
        inventory: {},
        team: [{ id: 'mi_001', hp: 30, hpMax: 30, templateId: 'MON_002' }],
        ...overrides
    };
}

function makeWildEnc(overrides = {}) {
    return {
        type: 'wild',
        localId: 'LOC_001',
        result: 'victory',
        wildMonster: { templateId: 'MON_100', hp: 5, hpMax: 20 },
        ...overrides
    };
}

function makeTrainerEnc(overrides = {}) {
    return {
        type: 'group_trainer',
        localId: 'LOC_003',
        result: 'victory',
        enemies: [{ templateId: 'MON_010' }],
        ...overrides
    };
}

function makeBossEnc(templateId, localId = 'LOC_004', overrides = {}) {
    return {
        type: 'boss',
        localId,
        result: 'victory',
        enemies: [{ templateId }],
        ...overrides
    };
}

/** Deps de DI mínimos para testes */
function makeDeps() {
    const log = [];
    return {
        addItemToInventory(player, itemId, qty) {
            player.inventory = player.inventory || {};
            player.inventory[itemId] = (player.inventory[itemId] || 0) + (qty || 1);
        },
        addMoneyToPlayer(player, amount) {
            player.money = (player.money || 0) + amount;
        },
        addQuestXP(player, xp) {
            player._questXpGained = (player._questXpGained || 0) + xp;
        },
        log
    };
}

// ═══════════════════════════════════════════════════
// ensureQuestState
// ═══════════════════════════════════════════════════

describe('ensureQuestState', () => {

    it('deve inicializar questState se inexistente', () => {
        const p = makePlayer();
        ensureQuestState(p);
        expect(p.questState).toBeDefined();
        expect(Array.isArray(p.questState.activeQuestIds)).toBe(true);
        expect(Array.isArray(p.questState.completedQuestIds)).toBe(true);
        expect(typeof p.questState.progress).toBe('object');
    });

    it('deve ser idempotente (não sobrescrever estado existente)', () => {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.activeQuestIds.push('QST_001');
        ensureQuestState(p); // segunda chamada
        expect(p.questState.activeQuestIds).toContain('QST_001');
    });

    it('deve lidar com player null sem lançar erro', () => {
        expect(() => ensureQuestState(null)).not.toThrow();
    });
});

// ═══════════════════════════════════════════════════
// activateQuest
// ═══════════════════════════════════════════════════

describe('activateQuest', () => {

    it('deve ativar QST_001 (sem pré-requisito)', () => {
        const p = makePlayer();
        const result = activateQuest(p, 'QST_001');
        expect(result).toBe(true);
        expect(p.questState.activeQuestIds).toContain('QST_001');
    });

    it('não deve ativar quest com pré-requisito não cumprido', () => {
        const p = makePlayer();
        const result = activateQuest(p, 'QST_002'); // requer QST_001
        expect(result).toBe(false);
        expect(p.questState.activeQuestIds).not.toContain('QST_002');
    });

    it('deve ativar quest com pré-requisito cumprido', () => {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001');
        const result = activateQuest(p, 'QST_002');
        expect(result).toBe(true);
        expect(p.questState.activeQuestIds).toContain('QST_002');
    });

    it('deve ser idempotente (não duplicar ativa)', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        activateQuest(p, 'QST_001');
        expect(p.questState.activeQuestIds.filter(id => id === 'QST_001').length).toBe(1);
    });

    it('não deve ativar quest já concluída', () => {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001');
        const result = activateQuest(p, 'QST_001');
        expect(result).toBe(false);
        expect(p.questState.activeQuestIds).not.toContain('QST_001');
    });

    it('deve retornar false para questId inexistente', () => {
        const p = makePlayer();
        expect(activateQuest(p, 'QST_999')).toBe(false);
    });

    it('deve inicializar progresso ao ativar', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        expect(p.questState.progress['QST_001']).toBeDefined();
        expect(p.questState.progress['QST_001'].count).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// autoActivateFirstQuest
// ═══════════════════════════════════════════════════

describe('autoActivateFirstQuest', () => {

    it('deve ativar QST_001 para jogador novo', () => {
        const p = makePlayer();
        const result = autoActivateFirstQuest(p);
        expect(result).toBe(true);
        expect(p.questState.activeQuestIds).toContain('QST_001');
    });

    it('não deve ativar se jogador já tem quests ativas', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        const result = autoActivateFirstQuest(p);
        expect(result).toBe(false);
        expect(p.questState.activeQuestIds.filter(id => id === 'QST_001').length).toBe(1);
    });

    it('não deve ativar se jogador já tem quests concluídas', () => {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001');
        const result = autoActivateFirstQuest(p);
        expect(result).toBe(false);
    });
});

// ═══════════════════════════════════════════════════
// processQuestProgress — tipo: derrotar_wild
// ═══════════════════════════════════════════════════

describe('processQuestProgress - derrotar_wild (QST_003)', () => {

    // QST_003: derrotar 3 monstros selvagens na LOC_002
    function setupPlayer() {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001', 'QST_002');
        activateQuest(p, 'QST_003');
        return p;
    }

    it('deve contar derrota de wild no local correto', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_002' });
        const completed = processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_003'].count).toBe(1);
        expect(completed).not.toContain('QST_003'); // precisa de 3
    });

    it('deve completar após 3 derrotas', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_002' });
        processQuestProgress(p, enc, null);
        processQuestProgress(p, enc, null);
        const completed = processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_003'].count).toBe(3);
        expect(completed).toContain('QST_003');
    });

    it('não deve contar derrota em local errado', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_001' }); // local errado
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_003'].count).toBe(0);
    });

    it('não deve contar treinador como wild', () => {
        const p = setupPlayer();
        const enc = makeTrainerEnc({ localId: 'LOC_002' });
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_003'].count).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// processQuestProgress — tipo: derrotar_treinador
// ═══════════════════════════════════════════════════

describe('processQuestProgress - derrotar_treinador (QST_005)', () => {

    // QST_005: derrotar 1 treinador nas Minas (LOC_003), pré-req: QST_004
    function setupPlayer() {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001', 'QST_002', 'QST_003', 'QST_004');
        activateQuest(p, 'QST_005');
        return p;
    }

    it('deve contar derrota de treinador no local correto', () => {
        const p = setupPlayer();
        const enc = makeTrainerEnc({ localId: 'LOC_003' });
        const completed = processQuestProgress(p, enc, null);
        expect(completed).toContain('QST_005');
        expect(p.questState.progress['QST_005'].count).toBe(1);
    });

    it('não deve contar wild como treinador', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_003' });
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_005'].count).toBe(0);
    });

    it('não deve contar treinador em local errado', () => {
        const p = setupPlayer();
        const enc = makeTrainerEnc({ localId: 'LOC_001' });
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_005'].count).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// processQuestProgress — tipo: capturar (específico)
// ═══════════════════════════════════════════════════

describe('processQuestProgress - capturar (QST_004)', () => {

    // QST_004: capturar MON_023 na LOC_002, pré-req: QST_003
    function setupPlayer() {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001', 'QST_002', 'QST_003');
        activateQuest(p, 'QST_004');
        return p;
    }

    it('deve contar captura do monstro correto', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_002' });
        const completed = processQuestProgress(p, enc, 'MON_023');
        expect(completed).toContain('QST_004');
        expect(p.questState.progress['QST_004'].count).toBe(1);
    });

    it('não deve contar captura de monstro errado', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_002' });
        processQuestProgress(p, enc, 'MON_001'); // monstro errado
        expect(p.questState.progress['QST_004'].count).toBe(0);
    });

    it('não deve contar captura em local errado', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_001' }); // local errado
        processQuestProgress(p, enc, 'MON_023');
        expect(p.questState.progress['QST_004'].count).toBe(0);
    });

    it('não deve contar quando capturedMonsterId é null', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_002' });
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_004'].count).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// processQuestProgress — tipo: capturar (genérico QST_002)
// ═══════════════════════════════════════════════════

describe('processQuestProgress - capturar genérico (QST_002)', () => {

    // QST_002: capturar qualquer monstro em LOC_001
    function setupPlayer() {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001');
        activateQuest(p, 'QST_002');
        return p;
    }

    it('deve contar qualquer captura em LOC_001', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_001' });
        const completed = processQuestProgress(p, enc, 'MON_100');
        expect(completed).toContain('QST_002');
    });

    it('não deve contar captura sem capturedMonsterId', () => {
        const p = setupPlayer();
        const enc = makeWildEnc({ localId: 'LOC_001' });
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_002'].count).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// processQuestProgress — tipo: derrotar_boss (QST_008)
// ═══════════════════════════════════════════════════

describe('processQuestProgress - derrotar_boss (QST_008)', () => {

    // QST_008: derrotar MON_011C (TRockmon) na LOC_004
    function setupPlayer() {
        const p = makePlayer();
        ensureQuestState(p);
        p.questState.completedQuestIds.push('QST_001','QST_002','QST_003','QST_004','QST_005','QST_006','QST_007');
        activateQuest(p, 'QST_008');
        return p;
    }

    it('deve contar derrota do boss correto', () => {
        const p = setupPlayer();
        const enc = makeBossEnc('MON_011C', 'LOC_004');
        const completed = processQuestProgress(p, enc, null);
        expect(completed).toContain('QST_008');
    });

    it('não deve contar boss errado', () => {
        const p = setupPlayer();
        const enc = makeBossEnc('MON_012C', 'LOC_004'); // boss errado
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_008'].count).toBe(0);
    });

    it('não deve contar treinador como boss', () => {
        const p = setupPlayer();
        const enc = makeTrainerEnc({ localId: 'LOC_004' });
        processQuestProgress(p, enc, null);
        expect(p.questState.progress['QST_008'].count).toBe(0);
    });
});

// ═══════════════════════════════════════════════════
// completeQuest
// ═══════════════════════════════════════════════════

describe('completeQuest - recompensas e cadeia', () => {

    it('deve mover quest de ativa para concluída', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        completeQuest(p, 'QST_001', makeDeps());
        expect(p.questState.completedQuestIds).toContain('QST_001');
        expect(p.questState.activeQuestIds).not.toContain('QST_001');
    });

    it('deve aplicar recompensa em moeda', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        const deps = makeDeps();
        completeQuest(p, 'QST_001', deps);
        // QST_001 reward_gold=60
        expect(p.money).toBe(60);
    });

    it('deve aplicar recompensa em item', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        completeQuest(p, 'QST_001', makeDeps());
        // QST_001 reward_item_id = IT_CAP_02
        expect(p.inventory['IT_CAP_02']).toBe(1);
    });

    it('deve aplicar XP de quest via deps', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        completeQuest(p, 'QST_001', makeDeps());
        // QST_001 reward_xp=80
        expect(p._questXpGained).toBe(80);
    });

    it('deve ativar próxima quest da cadeia (QST_002 após QST_001)', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        completeQuest(p, 'QST_001', makeDeps());
        expect(p.questState.activeQuestIds).toContain('QST_002');
    });

    it('deve retornar false para quest não ativa', () => {
        const p = makePlayer();
        const result = completeQuest(p, 'QST_001', makeDeps());
        expect(result).toBe(false);
    });

    it('deve retornar false para questId inexistente', () => {
        const p = makePlayer();
        const result = completeQuest(p, 'QST_999', makeDeps());
        expect(result).toBe(false);
    });

    it('deve funcionar sem deps (sem recompensas)', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        expect(() => completeQuest(p, 'QST_001', null)).not.toThrow();
        expect(p.questState.completedQuestIds).toContain('QST_001');
    });
});

// ═══════════════════════════════════════════════════
// handlePostEncounterFlow — orquestrador completo
// ═══════════════════════════════════════════════════

describe('handlePostEncounterFlow - loop completo', () => {

    it('deve ativar QST_001 automaticamente para jogador novo', () => {
        const p = makePlayer();
        const enc = makeWildEnc({ localId: 'LOC_001' });
        handlePostEncounterFlow(p, enc, null, makeDeps());
        expect(p.questState.activeQuestIds).toContain('QST_001');
    });

    it('deve completar QST_001 (derrotar_treinador em LOC_001) e ativar QST_002', () => {
        const p = makePlayer();
        const enc = { type: 'group_trainer', localId: 'LOC_001', result: 'victory',
                      enemies: [{ templateId: 'MON_002' }] };
        handlePostEncounterFlow(p, enc, null, makeDeps());
        expect(p.questState.completedQuestIds).toContain('QST_001');
        expect(p.questState.activeQuestIds).toContain('QST_002');
    });

    it('deve completar QST_002 após captura em LOC_001 e ativar QST_003', () => {
        const p = makePlayer();
        // Primeiro: completar QST_001
        const enc1 = { type: 'group_trainer', localId: 'LOC_001', result: 'victory',
                       enemies: [{ templateId: 'MON_002' }] };
        handlePostEncounterFlow(p, enc1, null, makeDeps());

        // Segundo: capturar em LOC_001
        const enc2 = makeWildEnc({ localId: 'LOC_001' });
        handlePostEncounterFlow(p, enc2, 'MON_100', makeDeps());

        expect(p.questState.completedQuestIds).toContain('QST_002');
        expect(p.questState.activeQuestIds).toContain('QST_003');
    });

    it('deve retornar log, completed e activated', () => {
        const p = makePlayer();
        const enc = { type: 'group_trainer', localId: 'LOC_001', result: 'victory',
                      enemies: [{ templateId: 'MON_002' }] };
        const result = handlePostEncounterFlow(p, enc, null, makeDeps());
        expect(Array.isArray(result.log)).toBe(true);
        expect(Array.isArray(result.completed)).toBe(true);
        expect(Array.isArray(result.activated)).toBe(true);
    });

    it('deve incluir mensagem de conclusão no log', () => {
        const p = makePlayer();
        const enc = { type: 'group_trainer', localId: 'LOC_001', result: 'victory',
                      enemies: [{ templateId: 'MON_002' }] };
        const result = handlePostEncounterFlow(p, enc, null, makeDeps());
        const hasCompletion = result.log.some(l => l.includes('QST_001') || l.includes('Quest concluída'));
        expect(hasCompletion).toBe(true);
    });

    it('deve retornar resultado vazio para encontro sem jogador', () => {
        const result = handlePostEncounterFlow(null, makeWildEnc(), null, makeDeps());
        expect(result.completed).toEqual([]);
        expect(result.log).toEqual([]);
    });

    it('deve retornar resultado vazio para encontro null', () => {
        const p = makePlayer();
        const result = handlePostEncounterFlow(p, null, null, makeDeps());
        expect(result.completed).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════
// getActiveQuestsSummary / hasCompletedQuest
// ═══════════════════════════════════════════════════

describe('getActiveQuestsSummary', () => {

    it('deve retornar lista de quests ativas com progresso', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        const summary = getActiveQuestsSummary(p);
        expect(summary.length).toBe(1);
        expect(summary[0].quest.id).toBe('QST_001');
        expect(summary[0].progress).toBe(0);
        expect(summary[0].needed).toBeGreaterThanOrEqual(1);
    });

    it('deve retornar array vazio para jogador sem quests', () => {
        const p = makePlayer();
        expect(getActiveQuestsSummary(p)).toEqual([]);
    });

    it('deve retornar array vazio para jogador null', () => {
        expect(getActiveQuestsSummary(null)).toEqual([]);
    });
});

describe('hasCompletedQuest', () => {

    it('deve retornar true para quest concluída', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        completeQuest(p, 'QST_001', makeDeps());
        expect(hasCompletedQuest(p, 'QST_001')).toBe(true);
    });

    it('deve retornar false para quest ativa (não concluída)', () => {
        const p = makePlayer();
        activateQuest(p, 'QST_001');
        expect(hasCompletedQuest(p, 'QST_001')).toBe(false);
    });

    it('deve retornar false para player null', () => {
        expect(hasCompletedQuest(null, 'QST_001')).toBe(false);
    });
});

// ═══════════════════════════════════════════════════
// Progressão da cadeia principal completa
// ═══════════════════════════════════════════════════

describe('Cadeia principal - progressão de QST_001 até QST_008', () => {

    it('deve percorrer a cadeia até QST_008 (boss das ruínas)', () => {
        const p = makePlayer();
        const deps = makeDeps();

        // QST_001: derrotar treinador em LOC_001
        handlePostEncounterFlow(p, { type: 'group_trainer', localId: 'LOC_001', enemies: [{ templateId: 'MON_002' }] }, null, deps);
        expect(hasCompletedQuest(p, 'QST_001')).toBe(true);

        // QST_002: capturar qualquer em LOC_001
        handlePostEncounterFlow(p, makeWildEnc({ localId: 'LOC_001' }), 'MON_100', deps);
        expect(hasCompletedQuest(p, 'QST_002')).toBe(true);

        // QST_003: derrotar 3 wilds na LOC_002
        const loc2Wild = makeWildEnc({ localId: 'LOC_002' });
        handlePostEncounterFlow(p, loc2Wild, null, deps);
        handlePostEncounterFlow(p, makeWildEnc({ localId: 'LOC_002' }), null, deps);
        handlePostEncounterFlow(p, makeWildEnc({ localId: 'LOC_002' }), null, deps);
        expect(hasCompletedQuest(p, 'QST_003')).toBe(true);

        // QST_004: capturar MON_023 em LOC_002
        handlePostEncounterFlow(p, makeWildEnc({ localId: 'LOC_002' }), 'MON_023', deps);
        expect(hasCompletedQuest(p, 'QST_004')).toBe(true);

        // QST_005: derrotar treinador em LOC_003
        handlePostEncounterFlow(p, makeTrainerEnc({ localId: 'LOC_003' }), null, deps);
        expect(hasCompletedQuest(p, 'QST_005')).toBe(true);

        // QST_006: capturar MON_010 em LOC_003
        handlePostEncounterFlow(p, makeWildEnc({ localId: 'LOC_003' }), 'MON_010', deps);
        expect(hasCompletedQuest(p, 'QST_006')).toBe(true);

        // QST_007: derrotar treinador em LOC_004
        handlePostEncounterFlow(p, makeTrainerEnc({ localId: 'LOC_004' }), null, deps);
        expect(hasCompletedQuest(p, 'QST_007')).toBe(true);

        // QST_008: derrotar boss MON_011C em LOC_004
        handlePostEncounterFlow(p, makeBossEnc('MON_011C', 'LOC_004'), null, deps);
        expect(hasCompletedQuest(p, 'QST_008')).toBe(true);

        // Após QST_008 → QST_011 deve estar ativa
        expect(p.questState.activeQuestIds).toContain('QST_011');
    });
});
