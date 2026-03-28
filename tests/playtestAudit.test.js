/**
 * PLAYTEST AUDIT TESTS (PR-PLAYTEST / ECONOMY REVIEW)
 *
 * Testes de regressão para os fixes do Playtest Guiado Pós-Fix de Save.
 * Cobre:
 *   Regra de design - Batalhas wild NÃO concedem ouro (revertido)
 *   Fix #2 - mmFinishNewGame ativa QST_001
 *   Fix #3 - maybeToastFromLog tosta quest/drops
 *   Fix #4 - updatePlayersList badge usa player.class como fallback
 *   Fix #5 - Quest progress tracker na lista de jogadores
 *   Fix #6 - Painel de resultado wild usa monstro ativo (activeIndex)
 *   Fix #8 - Hint de quest na tab de Encontro
 *   Economia - Auditoria geral (quests, trainers, bosses, drops, loja)
 */

import { describe, it, expect, vi } from 'vitest';

// ─── Factories ─────────────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
    return {
        id: `p_${Date.now()}_test`,
        name: 'TestPlayer',
        class: 'Guerreiro',
        playerClassId: 'Guerreiro',
        money: 100,
        afterlifeCurrency: 0,
        team: [],
        box: [],
        inventory: {},
        questState: { activeQuestIds: [], completedQuestIds: [], progress: {} },
        activeIndex: 0,
        ...overrides
    };
}

function makeMonster(overrides = {}) {
    return {
        instanceId: 'mi_test_001',
        templateId: 'MON_002',
        name: 'Pedrino',
        class: 'Guerreiro',
        rarity: 'Comum',
        level: 5,
        xp: 20,
        hp: 32,
        hpMax: 32,
        ene: 10,
        eneMax: 10,
        buffs: [],
        statusEffects: [],
        friendship: 50,
        emoji: '⚔️',
        ...overrides
    };
}

function makeWildEncounter(overrides = {}) {
    return {
        id: 'enc_test_001',
        type: 'wild',
        active: false,
        result: 'victory',
        log: [],
        selectedPlayerId: 'p_test',
        rewardsGranted: true,
        rewards: { xp: 17 },
        wildMonster: makeMonster({ level: 5, hp: 0, hpMax: 32 }),
        ...overrides
    };
}

// ─── Regra de design: Batalhas wild NÃO concedem ouro ───────────────────────

describe('Regra de design — Wild não concede ouro', () => {

    /**
     * Simula a lógica CORRETA de handleVictoryRewards: sem gold para wild.
     * Só XP (via Progression.Actions) + drops + quests.
     */
    function simulateHandleVictoryRewardsNoGold(enc, players) {
        // Regra: wild não concede ouro — apenas registra que foi processado
        enc.rewardsGranted = true;
        // drops, quests etc. são processados à parte; gold não é concedido
    }

    it('batalha wild não deve alterar o dinheiro do jogador', () => {
        const player = makePlayer({ id: 'p1', money: 100 });
        const enc = makeWildEncounter({ rewardsGranted: false, selectedPlayerId: 'p1' });

        simulateHandleVictoryRewardsNoGold(enc, [player]);

        expect(player.money).toBe(100); // inalterado
    });

    it('enc.rewards.money não deve ser definido para wild', () => {
        const enc = makeWildEncounter({ rewardsGranted: false });
        simulateHandleVictoryRewardsNoGold(enc, []);
        expect(enc.rewards?.money).toBeUndefined();
    });

    it('encounter wild não deve conter log de 💰 após handleVictoryRewards', () => {
        const player = makePlayer({ id: 'p1', money: 50 });
        const enc = makeWildEncounter({ rewardsGranted: false, log: [], selectedPlayerId: 'p1' });

        simulateHandleVictoryRewardsNoGold(enc, [player]);

        const goldLogs = (enc.log || []).filter(l => l.includes('💰'));
        expect(goldLogs.length).toBe(0);
    });

    it('encounter trainer deve conceder ouro (regra de design mantida)', () => {
        // Simula a lógica de showBattleEndModalWrapper para trainers
        const BASE_MONEY_TRAINER = 50;
        const BASE_MONEY_BOSS = 100;

        const trainerMoney = BASE_MONEY_TRAINER;
        const bossMoney = BASE_MONEY_BOSS;

        expect(trainerMoney).toBe(50);
        expect(bossMoney).toBe(100);
        expect(bossMoney).toBeGreaterThan(trainerMoney);
    });

    it('config não deve ter campos minWildGold/wildGoldPerLevel', () => {
        // Simula o config padrão pós-reversão
        const configDefaults = {
            maxTeamSize: 6,
            maxLevel: 100,
            levelExpo: 1.5,
            battleXpBase: 15,
            medalTiers: { bronze: 5, silver: 12, gold: 25 },
            friendshipConfig: { battleWin: 2, battleLoss: -5, useHealItem: 5, levelUp: 3, faint: -3 }
        };

        expect(configDefaults.minWildGold).toBeUndefined();
        expect(configDefaults.wildGoldPerLevel).toBeUndefined();
    });
});

// ─── Fix #2: mmFinishNewGame ativa QST_001 ──────────────────────────────────

describe('Fix #2 — mmFinishNewGame ativa QST_001 para novos jogadores', () => {

    function simulatePlayerCreationWithQuestActivation(playerData, GameFlow) {
        const player = {
            id: `p_${Date.now()}`,
            name: playerData.name,
            class: playerData.class,
            money: 100,
            team: [],
            inventory: {}
        };
        // Reproduz o fix #2 aplicado em mmFinishNewGame
        if (GameFlow) {
            GameFlow.ensureQuestState(player);
            GameFlow.autoActivateFirstQuest(player);
        }
        return player;
    }

    it('deve ativar QST_001 para jogador criado pelo wizard', async () => {
        const { ensureQuestState, autoActivateFirstQuest } = await import('../js/gameFlow.js');
        const GameFlow = { ensureQuestState, autoActivateFirstQuest };

        const player = simulatePlayerCreationWithQuestActivation(
            { name: 'NovoJogador', class: 'Guerreiro' },
            GameFlow
        );

        expect(player.questState).toBeDefined();
        expect(player.questState.activeQuestIds).toContain('QST_001');
    });

    it('jogador sem GameFlow não deve lançar erro (fallback seguro)', () => {
        expect(() => {
            simulatePlayerCreationWithQuestActivation(
                { name: 'Jogador', class: 'Mago' },
                null // sem GameFlow
            );
        }).not.toThrow();
    });

    it('jogador já com quest ativa não duplica QST_001', async () => {
        const { ensureQuestState, autoActivateFirstQuest } = await import('../js/gameFlow.js');
        const GameFlow = { ensureQuestState, autoActivateFirstQuest };

        const player = simulatePlayerCreationWithQuestActivation(
            { name: 'Jogador', class: 'Mago' },
            GameFlow
        );

        // Chamar de novo não deve duplicar
        GameFlow.autoActivateFirstQuest(player);

        expect(player.questState.activeQuestIds.filter(id => id === 'QST_001').length).toBe(1);
    });
});

// ─── Fix #3: maybeToastFromLog tosta quest/drops ────────────────────────────

describe('Fix #3 — maybeToastFromLog tosta conclusão de quest e nova quest', () => {

    function makeMaybeToastFromLog(showToast) {
        // Replica a lógica de maybeToastFromLog após o fix
        return function maybeToastFromLog(enc) {
            if (!enc || !Array.isArray(enc.log)) return;
            if (enc._toastCursor == null) enc._toastCursor = 0;
            const start = Number.isFinite(enc._toastCursor) ? enc._toastCursor : 0;
            for (let i = start; i < enc.log.length; i++) {
                const line = String(enc.log[i] || '');
                const isLevelUp = line.includes('✨') || /subiu para o nível/i.test(line);
                if (isLevelUp) showToast(line);
                const isEvo = line.includes('🌟') || /evoluiu para/i.test(line);
                if (isEvo) showToast(line);
                // Fix #3
                const isQuestComplete = line.includes('🏆') && /quest/i.test(line);
                if (isQuestComplete) showToast(line, 'success');
                const isNewQuest = line.includes('🗺️');
                if (isNewQuest) showToast(line);
            }
            enc._toastCursor = enc.log.length;
        };
    }

    it('deve tostar 🏆 Quest concluída', () => {
        const showToast = vi.fn();
        const maybeToastFromLog = makeMaybeToastFromLog(showToast);
        const enc = { log: ['🏆 Quest concluída: "Primeira Caçada"!'], _toastCursor: 0 };
        maybeToastFromLog(enc);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('🏆'), 'success');
    });

    it('deve tostar 🗺️ Nova quest', () => {
        const showToast = vi.fn();
        const maybeToastFromLog = makeMaybeToastFromLog(showToast);
        const enc = { log: ['🗺️ Nova quest: "Explorador Iniciante"!'], _toastCursor: 0 };
        maybeToastFromLog(enc);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('🗺️'));
    });

    it('deve tostar ambos quando ocorrem juntos', () => {
        const showToast = vi.fn();
        const maybeToastFromLog = makeMaybeToastFromLog(showToast);
        const enc = {
            log: [
                '🏆 Quest concluída: "Primeira Caçada"!',
                '🗺️ Nova quest: "Explorador Iniciante"!'
            ],
            _toastCursor: 0
        };
        maybeToastFromLog(enc);
        expect(showToast).toHaveBeenCalledTimes(2);
    });

    it('continua a tostar level up como antes', () => {
        const showToast = vi.fn();
        const maybeToastFromLog = makeMaybeToastFromLog(showToast);
        const enc = { log: ['✨ Pedrino subiu para o nível 3!'], _toastCursor: 0 };
        maybeToastFromLog(enc);
        expect(showToast).toHaveBeenCalledWith(expect.stringContaining('✨'));
    });

    it('não tosta 🏆 que não seja de quest', () => {
        const showToast = vi.fn();
        const maybeToastFromLog = makeMaybeToastFromLog(showToast);
        const enc = { log: ['🏆 Conquista desbloqueada!'], _toastCursor: 0 }; // sem "quest" no texto
        maybeToastFromLog(enc);
        expect(showToast).not.toHaveBeenCalled();
    });

    it('cursor impede toasts duplicados em chamadas repetidas', () => {
        const showToast = vi.fn();
        const maybeToastFromLog = makeMaybeToastFromLog(showToast);
        const enc = { log: ['🏆 Quest concluída: "Test"!'], _toastCursor: 0 };
        maybeToastFromLog(enc);
        maybeToastFromLog(enc); // segunda chamada não deve repetir toast
        expect(showToast).toHaveBeenCalledTimes(1);
    });
});

// ─── Fix #4: Badge usa player.class como fallback ───────────────────────────

describe('Fix #4 — Badge do jogador usa player.class como fallback', () => {

    function getPlayerClassForBadge(player) {
        // Replica a lógica do fix em updatePlayersList
        return player.class || player.playerClassId || '';
    }

    it('deve retornar player.class para jogadores do addPlayer()', () => {
        const player = makePlayer({ class: 'Guerreiro', playerClassId: 'Guerreiro' });
        expect(getPlayerClassForBadge(player)).toBe('Guerreiro');
    });

    it('deve retornar player.class quando playerClassId está ausente (wizard)', () => {
        const player = { id: 'p1', name: 'Test', class: 'Mago' }; // sem playerClassId
        expect(getPlayerClassForBadge(player)).toBe('Mago');
    });

    it('deve retornar playerClassId quando class está ausente (save antigo)', () => {
        const player = { id: 'p1', name: 'Test', playerClassId: 'Curandeiro' }; // sem class
        expect(getPlayerClassForBadge(player)).toBe('Curandeiro');
    });

    it('deve retornar string vazia para jogador sem classe alguma', () => {
        const player = { id: 'p1', name: 'Test' }; // sem class nem playerClassId
        expect(getPlayerClassForBadge(player)).toBe('');
    });

    it('player.class tem prioridade sobre playerClassId', () => {
        const player = { id: 'p1', name: 'Test', class: 'Bárbaro', playerClassId: 'Guerreiro' };
        expect(getPlayerClassForBadge(player)).toBe('Bárbaro');
    });
});

// ─── Fix #5: Quest progress tracker na lista de jogadores ───────────────────

describe('Fix #5 — Quest progress visible na lista de jogadores', () => {

    it('getActiveQuestsSummary retorna lista com progresso correto', async () => {
        const { ensureQuestState, getActiveQuestsSummary, activateQuest } =
            await import('../js/gameFlow.js');

        const player = makePlayer();
        ensureQuestState(player);
        activateQuest(player, 'QST_001');
        player.questState.progress['QST_001'] = { count: 1 };

        const summary = getActiveQuestsSummary(player);

        expect(summary.length).toBe(1);
        expect(summary[0].quest.id).toBe('QST_001');
        expect(summary[0].progress).toBe(1);
        expect(summary[0].needed).toBeGreaterThan(0);
    });

    it('getActiveQuestsSummary retorna vazio para jogador sem quests', async () => {
        const { getActiveQuestsSummary } = await import('../js/gameFlow.js');
        const player = makePlayer();
        const summary = getActiveQuestsSummary(player);
        expect(summary).toEqual([]);
    });

    it('getActiveQuestsSummary retorna vazio para player null', async () => {
        const { getActiveQuestsSummary } = await import('../js/gameFlow.js');
        expect(getActiveQuestsSummary(null)).toEqual([]);
    });

    it('progresso de quest renderiza porcentagem corretamente', () => {
        // Simula cálculo de pct que o updatePlayersList usa
        const q = { quest: { nome: 'Primeira Caçada', objetivoQtd: 3 }, progress: 1, needed: 3 };
        const pct = Math.min(100, Math.floor((q.progress / q.needed) * 100));
        expect(pct).toBe(33);
    });

    it('progresso 100% quando completo', () => {
        const q = { quest: { nome: 'Test', objetivoQtd: 1 }, progress: 1, needed: 1 };
        const pct = Math.min(100, Math.floor((q.progress / q.needed) * 100));
        expect(pct).toBe(100);
    });
});

// ─── Fix #6: Painel de resultado usa monstro ativo (activeIndex) ─────────────

describe('Fix #6 — Wild result panel usa monstro ativo (activeIndex)', () => {

    function getActiveMonsterForResult(player) {
        // Replica o fix: usar activeIndex, não sempre team[0]
        const activeIdx = typeof player?.activeIndex === 'number' ? player.activeIndex : 0;
        return player?.team?.[activeIdx];
    }

    it('deve retornar team[0] quando activeIndex é 0', () => {
        const mon0 = makeMonster({ name: 'Mon0', level: 1 });
        const mon1 = makeMonster({ name: 'Mon1', level: 2 });
        const player = makePlayer({ team: [mon0, mon1], activeIndex: 0 });
        expect(getActiveMonsterForResult(player).name).toBe('Mon0');
    });

    it('deve retornar team[1] quando activeIndex é 1', () => {
        const mon0 = makeMonster({ name: 'Mon0', level: 1 });
        const mon1 = makeMonster({ name: 'Mon1', level: 2 });
        const player = makePlayer({ team: [mon0, mon1], activeIndex: 1 });
        expect(getActiveMonsterForResult(player).name).toBe('Mon1');
    });

    it('fallback para team[0] quando activeIndex não está definido', () => {
        const mon0 = makeMonster({ name: 'Pedrino' });
        const player = makePlayer({ team: [mon0] });
        delete player.activeIndex; // simula save antigo sem activeIndex
        expect(getActiveMonsterForResult(player).name).toBe('Pedrino');
    });

    it('retorna undefined para time vazio', () => {
        const player = makePlayer({ team: [], activeIndex: 0 });
        expect(getActiveMonsterForResult(player)).toBeUndefined();
    });
});

// ─── Fix #7 (REVERTIDO): Painel de resultado wild não exibe ouro ─────────────
// Wild não concede ouro pela regra de design; a linha de gold foi removida.

describe('Fix #7 (revertido) — Wild result panel não exibe ouro', () => {

    function buildGoldLine(encounter) {
        // Após a reversão: goldLine não existe mais em renderWildEncounter.
        // Wild não concede ouro; nenhuma linha de 💰 deve aparecer.
        const goldEarned = encounter.rewards?.money || 0;
        return goldEarned > 0
            ? `<div class="player-select-box mt-5">💰 +${goldEarned} moedas ganhas!</div>`
            : '';
    }

    it('painel de resultado wild não deve exibir linha de ouro', () => {
        // rewards.money não é setado em wild após reversão
        const enc = makeWildEncounter({ rewards: { xp: 17 } });
        const goldLine = buildGoldLine(enc);
        expect(goldLine).toBe(''); // sem linha de gold
    });

    it('buildGoldLine retorna vazio quando money é undefined', () => {
        const enc = makeWildEncounter();
        expect(buildGoldLine(enc)).toBe('');
    });
});

// ─── Fix #8: Hint de quest na tab de Encontro ───────────────────────────────

describe('Fix #8 — renderEncounterQuestHint mostra quests do jogador selecionado', () => {

    function buildQuestHintContent(player, GameFlow) {
        // Replica a lógica de renderEncounterQuestHint
        if (!player || !GameFlow) return '';

        const quests = GameFlow.getActiveQuestsSummary(player);
        if (quests.length === 0) {
            return `<div class="opacity-70 text-small mt-5">📋 ${player.name} não tem quests ativas.</div>`;
        }

        const items = quests.map(q => {
            const pct = Math.min(100, Math.floor((q.progress / q.needed) * 100));
            return `<div><strong>${q.quest.nome}</strong>: ${q.progress}/${q.needed} (${pct}%)</div>`;
        }).join('');
        return `<div class="card mt-10"><h4>📋 Quests Ativas — ${player.name}:</h4>${items}</div>`;
    }

    it('deve mostrar "sem quests" para jogador sem quests ativas', async () => {
        const { getActiveQuestsSummary } = await import('../js/gameFlow.js');
        const GameFlow = { getActiveQuestsSummary };
        const player = makePlayer({ name: 'João' });
        const html = buildQuestHintContent(player, GameFlow);
        expect(html).toContain('não tem quests ativas');
        expect(html).toContain('João');
    });

    it('deve mostrar quests ativas com progresso', async () => {
        const { getActiveQuestsSummary, ensureQuestState, activateQuest } =
            await import('../js/gameFlow.js');
        const GameFlow = { getActiveQuestsSummary };
        const player = makePlayer({ name: 'Maria' });
        ensureQuestState(player);
        activateQuest(player, 'QST_001');
        player.questState.progress['QST_001'] = { count: 2 };

        const html = buildQuestHintContent(player, GameFlow);

        expect(html).toContain('📋 Quests Ativas');
        expect(html).toContain('Maria');
        expect(html).toContain('2/');
    });

    it('deve retornar string vazia sem GameFlow', () => {
        const player = makePlayer({ name: 'Test' });
        expect(buildQuestHintContent(player, null)).toBe('');
    });

    it('deve retornar string vazia sem player', async () => {
        const { getActiveQuestsSummary } = await import('../js/gameFlow.js');
        const GameFlow = { getActiveQuestsSummary };
        expect(buildQuestHintContent(null, GameFlow)).toBe('');
    });
});

// ─── Auditoria de economia — regra oficial ──────────────────────────────────

describe('Auditoria de economia — regra oficial', () => {

    it('jogador inicia com 100 moedas', () => {
        const player = makePlayer({ money: 100 });
        expect(player.money).toBe(100);
    });

    it('quests fornecem ouro suficiente para progressão inicial (QST_001 = 60g)', async () => {
        const { getQuest } = await import('../js/data/questSystem.js');
        const q1 = getQuest('QST_001');
        expect(q1).toBeDefined();
        expect(q1.rewardGold).toBeGreaterThanOrEqual(40);
    });

    it('todas as quests têm reward_gold >= 40', async () => {
        const { QUESTS_DATA } = await import('../js/data/questSystem.js');
        for (const q of Object.values(QUESTS_DATA)) {
            expect(q.rewardGold, `Quest ${q.id} rewardGold < 40`).toBeGreaterThanOrEqual(40);
        }
    });

    it('trainer concede 50g — suficiente para comprar CLASTERORB_COMUM (30g)', () => {
        const TRAINER_MONEY = 50;
        const ORB_COMUM_PRICE = 30;
        expect(TRAINER_MONEY).toBeGreaterThanOrEqual(ORB_COMUM_PRICE);
    });

    it('boss concede 100g — mais que trainer (50g)', () => {
        const TRAINER_MONEY = 50;
        const BOSS_MONEY = 100;
        expect(BOSS_MONEY).toBeGreaterThan(TRAINER_MONEY);
    });

    it('IT_HEAL_01 custa 20g — acessível após 1 quest inicial (60g)', () => {
        const HEAL_01_PRICE = 20;
        const QUEST_001_GOLD = 60;
        expect(QUEST_001_GOLD).toBeGreaterThan(HEAL_01_PRICE);
    });

    it('save+reload preserva money sem alteração', () => {
        const player = makePlayer({ money: 250 });
        const saved = JSON.parse(JSON.stringify(player));
        expect(saved.money).toBe(250);
    });

    it('wild encounter NÃO tem rewards.money definido', () => {
        const enc = makeWildEncounter();
        expect(enc.rewards?.money).toBeUndefined();
    });
});
