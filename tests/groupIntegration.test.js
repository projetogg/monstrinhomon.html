/**
 * GROUP INTEGRATION TESTS (PR-cleanup-group-combat-integration)
 *
 * Testes para a camada de integração de combate em grupo (groupIntegration.js).
 *
 * Cobertura:
 *  1.  buildGroupCombatDeps — estrutura correta
 *  2.  buildGroupCombatDeps — props do deps.ui corretas
 *  3.  buildGroupCombatDeps — props do deps.storage corretas
 *  4.  buildGroupCombatDeps — deps.helpers passado integralmente
 *  5.  buildGroupCombatDeps — deps.helpers.showToast é injetado
 *  6.  buildGroupRewardsDeps — estrutura correta
 *  7.  buildGroupRewardsDeps — deps.helpers = rewardHelpers
 *  8.  buildGroupRewardsDeps — deps.state = state
 *  9.  buildGroupUIRenderDeps — estrutura correta
 * 10.  buildGroupUIRenderDeps — helpers inclui showBattleEndModal, isInTargetMode, getTargetActionType
 * 11.  buildGroupUIRenderDeps — uiHelpers são mesclados em helpers
 * 12.  buildGroupCombatDeps — app.state é passado como deps.state
 * 13.  buildGroupCombatDeps — app.core é passado como deps.core
 * 14.  buildGroupCombatDeps — app.audio é passado como deps.audio
 * 15.  buildGroupUIRenderDeps — app.core é passado como deps.core
 * 16.  Sem lógica de combate nas factories (apenas mapeamento de props)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    buildGroupCombatDeps,
    buildGroupRewardsDeps,
    buildGroupUIRenderDeps
} from '../js/combat/groupIntegration.js';

// ──────────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────────

function makeState() {
    return {
        currentEncounter: null,
        players: [],
        config: {}
    };
}

function makeCore() {
    return {
        getCurrentActor: vi.fn(),
        isAlive: vi.fn(),
        hasAlivePlayers: vi.fn(),
        hasAliveEnemies: vi.fn()
    };
}

function makeAudio() {
    return { playSfx: vi.fn() };
}

function makeUiFns() {
    return {
        showDamageFeedback: vi.fn(),
        showMissFeedback: vi.fn(),
        playAttackFeedback: vi.fn()
    };
}

function makeHelpers() {
    return {
        getPlayerById: vi.fn(),
        getActiveMonsterOfPlayer: vi.fn(),
        getEnemyByIndex: vi.fn(),
        log: vi.fn(),
        applyEneRegen: vi.fn(),
        updateBuffs: vi.fn(),
        rollD20: vi.fn(),
        recordD20Roll: vi.fn(),
        getBasicAttackPower: vi.fn(),
        applyDamage: vi.fn(),
        chooseTargetPlayerId: vi.fn(),
        firstAliveIndex: vi.fn(),
        openSwitchMonsterModal: vi.fn(),
        handleVictoryRewards: vi.fn(),
        getSkillById: vi.fn(),
        getSkillsArray: vi.fn(),
        canUseSkillNow: vi.fn(),
        getItemDef: vi.fn(),
        showToast: vi.fn()
    };
}

function makeRewardHelpers() {
    return {
        awardMoney: vi.fn(),
        getDropTableForEncounter: vi.fn(),
        generateDrops: vi.fn(),
        addDropsToInventory: vi.fn(),
        formatDropsLog: vi.fn(),
        handlePostEncounterFlow: vi.fn(),
        createQuestDeps: vi.fn()
    };
}

function makeUiHelpers() {
    return {
        renderTutorialBanner: vi.fn(),
        ensureXpFields: vi.fn(),
        calcXpNeeded: vi.fn(),
        getSkillsArray: vi.fn(),
        getSkillById: vi.fn(),
        formatSkillButtonLabel: vi.fn(),
        canUseSkillNow: vi.fn(),
        saveToLocalStorage: vi.fn(),
        maybeToastFromLog: vi.fn(),
        maybeSfxFromLog: vi.fn(),
        formatEquippedItemDisplay: vi.fn(),
        getItemDef: vi.fn()
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// buildGroupCombatDeps
// ──────────────────────────────────────────────────────────────────────────────

describe('buildGroupCombatDeps', () => {
    function makeApp() {
        return {
            state: makeState(),
            core: makeCore(),
            audio: makeAudio(),
            render: vi.fn(),
            save: vi.fn(),
            uiFns: makeUiFns(),
            helpers: makeHelpers()
        };
    }

    it('deve retornar objeto com todas as chaves esperadas por groupActions.js', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);

        expect(deps).toHaveProperty('state');
        expect(deps).toHaveProperty('core');
        expect(deps).toHaveProperty('ui');
        expect(deps).toHaveProperty('audio');
        expect(deps).toHaveProperty('storage');
        expect(deps).toHaveProperty('helpers');
    });

    it('deve mapear app.state para deps.state', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.state).toBe(app.state);
    });

    it('deve mapear app.core para deps.core', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.core).toBe(app.core);
    });

    it('deve mapear app.audio para deps.audio', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.audio).toBe(app.audio);
    });

    it('deve mapear app.render para deps.ui.render', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.ui.render).toBe(app.render);
    });

    it('deve mapear funções de UI de feedback corretamente', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.ui.showDamageFeedback).toBe(app.uiFns.showDamageFeedback);
        expect(deps.ui.showMissFeedback).toBe(app.uiFns.showMissFeedback);
        expect(deps.ui.playAttackFeedback).toBe(app.uiFns.playAttackFeedback);
    });

    it('deve criar deps.storage com deps.storage.save = app.save', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.storage.save).toBe(app.save);
    });

    it('deve passar helpers integralmente como deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.helpers).toBe(app.helpers);
    });

    it('deve incluir showToast nos helpers quando fornecido', () => {
        const app = makeApp();
        const deps = buildGroupCombatDeps(app);
        expect(deps.helpers.showToast).toBe(app.helpers.showToast);
    });

    it('não deve lançar exceção com app válido', () => {
        const app = makeApp();
        expect(() => buildGroupCombatDeps(app)).not.toThrow();
    });

    it('não deve executar lógica de combate (é apenas mapeamento de props)', () => {
        const app = makeApp();
        buildGroupCombatDeps(app);
        // Nenhum helper deve ter sido chamado — factory é pura
        expect(app.helpers.rollD20).not.toHaveBeenCalled();
        expect(app.helpers.applyDamage).not.toHaveBeenCalled();
        expect(app.helpers.getPlayerById).not.toHaveBeenCalled();
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// buildGroupRewardsDeps
// ──────────────────────────────────────────────────────────────────────────────

describe('buildGroupRewardsDeps', () => {
    function makeApp() {
        return {
            state: makeState(),
            rewardHelpers: makeRewardHelpers()
        };
    }

    it('deve retornar objeto com state e helpers esperados por groupRewards.js', () => {
        const app = makeApp();
        const deps = buildGroupRewardsDeps(app);

        expect(deps).toHaveProperty('state');
        expect(deps).toHaveProperty('helpers');
    });

    it('deve mapear app.state para deps.state', () => {
        const app = makeApp();
        const deps = buildGroupRewardsDeps(app);
        expect(deps.state).toBe(app.state);
    });

    it('deve mapear app.rewardHelpers para deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupRewardsDeps(app);
        expect(deps.helpers).toBe(app.rewardHelpers);
    });

    it('deve incluir todas as funções de recompensa em deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupRewardsDeps(app);

        expect(deps.helpers.awardMoney).toBe(app.rewardHelpers.awardMoney);
        expect(deps.helpers.getDropTableForEncounter).toBe(app.rewardHelpers.getDropTableForEncounter);
        expect(deps.helpers.generateDrops).toBe(app.rewardHelpers.generateDrops);
        expect(deps.helpers.addDropsToInventory).toBe(app.rewardHelpers.addDropsToInventory);
        expect(deps.helpers.formatDropsLog).toBe(app.rewardHelpers.formatDropsLog);
        expect(deps.helpers.handlePostEncounterFlow).toBe(app.rewardHelpers.handlePostEncounterFlow);
        expect(deps.helpers.createQuestDeps).toBe(app.rewardHelpers.createQuestDeps);
    });

    it('não deve lançar exceção com app válido', () => {
        const app = makeApp();
        expect(() => buildGroupRewardsDeps(app)).not.toThrow();
    });

    it('não deve executar lógica de recompensa (é apenas mapeamento de props)', () => {
        const app = makeApp();
        buildGroupRewardsDeps(app);
        expect(app.rewardHelpers.awardMoney).not.toHaveBeenCalled();
        expect(app.rewardHelpers.generateDrops).not.toHaveBeenCalled();
    });

    it('deve funcionar corretamente para trainer solo (estrutura)', () => {
        const player = { id: 'p1', name: 'Jogador 1', money: 0, team: [] };
        const app = {
            state: { players: [player] },
            rewardHelpers: makeRewardHelpers()
        };
        const deps = buildGroupRewardsDeps(app);
        expect(deps.state.players).toContain(player);
    });

    it('deve funcionar corretamente para boss com grupo (estrutura)', () => {
        const players = [
            { id: 'p1', name: 'P1', money: 0 },
            { id: 'p2', name: 'P2', money: 0 }
        ];
        const app = {
            state: { players },
            rewardHelpers: makeRewardHelpers()
        };
        const deps = buildGroupRewardsDeps(app);
        expect(deps.state.players).toHaveLength(2);
        expect(deps.helpers.awardMoney).toBe(app.rewardHelpers.awardMoney);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// buildGroupUIRenderDeps
// ──────────────────────────────────────────────────────────────────────────────

describe('buildGroupUIRenderDeps', () => {
    function makeApp() {
        return {
            state: makeState(),
            core: makeCore(),
            showBattleEnd: vi.fn(),
            isInTargetMode: vi.fn(() => false),
            getTargetActionType: vi.fn(() => null),
            uiHelpers: makeUiHelpers()
        };
    }

    it('deve retornar objeto com state, core e helpers esperados por groupUI.js', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);

        expect(deps).toHaveProperty('state');
        expect(deps).toHaveProperty('core');
        expect(deps).toHaveProperty('helpers');
    });

    it('deve mapear app.state para deps.state', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);
        expect(deps.state).toBe(app.state);
    });

    it('deve mapear app.core para deps.core', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);
        expect(deps.core).toBe(app.core);
    });

    it('deve incluir showBattleEndModal em deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);
        expect(deps.helpers.showBattleEndModal).toBe(app.showBattleEnd);
    });

    it('deve incluir isInTargetMode em deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);
        expect(deps.helpers.isInTargetMode).toBe(app.isInTargetMode);
    });

    it('deve incluir getTargetActionType em deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);
        expect(deps.helpers.getTargetActionType).toBe(app.getTargetActionType);
    });

    it('deve mesclar uiHelpers em deps.helpers', () => {
        const app = makeApp();
        const deps = buildGroupUIRenderDeps(app);

        expect(deps.helpers.renderTutorialBanner).toBe(app.uiHelpers.renderTutorialBanner);
        expect(deps.helpers.ensureXpFields).toBe(app.uiHelpers.ensureXpFields);
        expect(deps.helpers.getSkillsArray).toBe(app.uiHelpers.getSkillsArray);
        expect(deps.helpers.getSkillById).toBe(app.uiHelpers.getSkillById);
        expect(deps.helpers.maybeToastFromLog).toBe(app.uiHelpers.maybeToastFromLog);
        expect(deps.helpers.maybeSfxFromLog).toBe(app.uiHelpers.maybeSfxFromLog);
        expect(deps.helpers.getItemDef).toBe(app.uiHelpers.getItemDef);
    });

    it('showBattleEndModal deve ter precedência sobre uiHelpers.showBattleEndModal se houver conflito', () => {
        // Verifica que a factory não sobrescreve showBattleEndModal com o de uiHelpers
        const app = makeApp();
        // Se uiHelpers tivesse showBattleEndModal, o spread deve ser sobrescrito depois
        app.uiHelpers.showBattleEndModal = vi.fn(); // simulação de conflito
        const deps = buildGroupUIRenderDeps(app);
        // buildGroupUIRenderDeps mescla uiHelpers PRIMEIRO, depois adiciona showBattleEndModal
        // então app.showBattleEnd deve ser o valor final
        expect(deps.helpers.showBattleEndModal).toBe(app.showBattleEnd);
    });

    it('não deve lançar exceção com app válido', () => {
        const app = makeApp();
        expect(() => buildGroupUIRenderDeps(app)).not.toThrow();
    });

    it('não deve executar lógica de UI (é apenas mapeamento de props)', () => {
        const app = makeApp();
        buildGroupUIRenderDeps(app);
        expect(app.uiHelpers.renderTutorialBanner).not.toHaveBeenCalled();
        expect(app.uiHelpers.maybeToastFromLog).not.toHaveBeenCalled();
        expect(app.isInTargetMode).not.toHaveBeenCalled();
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// Regressão de integração: deps são compatíveis com os módulos de combate
// ──────────────────────────────────────────────────────────────────────────────

describe('regressão — deps compatíveis com módulos de combate', () => {
    it('buildGroupCombatDeps produz deps aceitos por executePlayerAttackGroup (sem lançar)', async () => {
        // Importa a função real para verificar que a assinatura bate
        const { executePlayerAttackGroup } = await import('../js/combat/groupActions.js');

        const app = {
            state: { currentEncounter: null, players: [], config: {} },
            core: makeCore(),
            audio: makeAudio(),
            render: vi.fn(),
            save: vi.fn(),
            uiFns: makeUiFns(),
            helpers: makeHelpers()
        };
        const deps = buildGroupCombatDeps(app);

        // currentEncounter=null → deve retornar false sem lançar
        const result = executePlayerAttackGroup(deps);
        expect(result).toBe(false);
    });

    it('buildGroupRewardsDeps produz deps aceitos por processGroupVictoryRewards (vitória trainer)', async () => {
        const { processGroupVictoryRewards } = await import('../js/combat/groupRewards.js');

        const player = { id: 'p1', name: 'Jogador', money: 0 };
        const enc = {
            type: 'group_trainer',
            result: 'victory',
            participants: ['p1'],
            enemies: [{ hp: 0 }],
            log: [],
            moneyGranted: false,
            dropsGranted: false,
            questsProcessed: false
        };

        const rewardHelpers = makeRewardHelpers();
        rewardHelpers.getDropTableForEncounter.mockReturnValue(null);
        rewardHelpers.handlePostEncounterFlow.mockReturnValue({ log: [] });

        const app = {
            state: { players: [player] },
            rewardHelpers
        };
        const deps = buildGroupRewardsDeps(app);

        // Não deve lançar; deve retornar { participants: [...] }
        const result = processGroupVictoryRewards(enc, deps);
        expect(result).toHaveProperty('participants');
        expect(result.participants).toHaveLength(1);
        expect(result.participants[0].playerName).toBe('Jogador');
    });

    it('buildGroupRewardsDeps produz deps aceitos por processGroupVictoryRewards (vitória boss)', async () => {
        const { processGroupVictoryRewards, COMBAT_REWARDS } = await import('../js/combat/groupRewards.js');

        const players = [
            { id: 'p1', name: 'P1', money: 0 },
            { id: 'p2', name: 'P2', money: 0 }
        ];
        const enc = {
            type: 'boss',
            result: 'victory',
            participants: ['p1', 'p2'],
            enemies: [{ hp: 0 }],
            log: [],
            moneyGranted: false,
            dropsGranted: false,
            questsProcessed: false
        };

        const rewardHelpers = makeRewardHelpers();
        rewardHelpers.getDropTableForEncounter.mockReturnValue(null);
        rewardHelpers.handlePostEncounterFlow.mockReturnValue({ log: [] });

        const app = {
            state: { players },
            rewardHelpers
        };
        const deps = buildGroupRewardsDeps(app);

        const { participants } = processGroupVictoryRewards(enc, deps);
        expect(participants).toHaveLength(2);
        // Boss: money = COMBAT_REWARDS.boss.money
        expect(participants[0].money).toBe(COMBAT_REWARDS.boss.money);
        expect(participants[1].money).toBe(COMBAT_REWARDS.boss.money);
    });

    it('buildGroupRewardsDeps produz deps corretos para derrota (sem recompensas)', async () => {
        const { processGroupVictoryRewards } = await import('../js/combat/groupRewards.js');

        const player = { id: 'p1', name: 'P1', money: 0 };
        const enc = {
            type: 'group_trainer',
            result: 'defeat',
            participants: ['p1'],
            enemies: [{ hp: 30 }],
            log: []
        };

        const app = {
            state: { players: [player] },
            rewardHelpers: makeRewardHelpers()
        };
        const deps = buildGroupRewardsDeps(app);

        const { participants } = processGroupVictoryRewards(enc, deps);
        // Derrota: sem recompensas
        expect(participants).toHaveLength(0);
        expect(app.rewardHelpers.awardMoney).not.toHaveBeenCalled();
    });
});
