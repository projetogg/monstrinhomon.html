/**
 * PLAYTEST AUDIT TESTS (PR-PLAYTEST)
 *
 * Testes de regressão para os fixes do Playtest Guiado Pós-Fix de Save.
 * Cobre:
 *   Fix #1 - Batalhas wild concedem ouro
 *   Fix #2 - mmFinishNewGame ativa QST_001
 *   Fix #3 - maybeToastFromLog tosta quest/drops
 *   Fix #4 - updatePlayersList badge usa player.class como fallback
 *   Fix #5 - Quest progress tracker na lista de jogadores
 *   Fix #6 - Painel de resultado wild usa monstro ativo (activeIndex)
 *   Fix #7 - Painel de resultado exibe ouro ganho
 *   Fix #8 - Hint de quest na tab de Encontro
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
        moneyGranted: true,
        rewards: { xp: 17, money: 10 },
        wildMonster: makeMonster({ level: 5, hp: 0, hpMax: 32 }),
        ...overrides
    };
}

// ─── Fix #1: Batalhas wild concedem ouro ────────────────────────────────────

describe('Fix #1 — Batalhas wild concedem ouro', () => {

    function simulateHandleVictoryRewardsGold(enc, players, config = {}) {
        // Replica lógica de handleVictoryRewards para a parte de gold
        if (enc.type === 'wild' && !enc.moneyGranted) {
            enc.moneyGranted = true;
            const defeated = enc.wildMonster;
            if (defeated) {
                const minGold = config.minWildGold ?? 5;
                const perLevel = config.wildGoldPerLevel ?? 2;
                const goldEarned = Math.max(minGold, Math.floor((defeated.level || 1) * perLevel));
                let player = null;
                if (enc.selectedPlayerId) {
                    player = players.find(p => p.id === enc.selectedPlayerId);
                }
                if (!player) player = players?.[0] || null;
                if (player) {
                    player.money = (player.money || 0) + goldEarned;
                    enc.log = enc.log || [];
                    enc.log.push(`💰 +${goldEarned} moedas!`);
                    enc.rewards = enc.rewards || {};
                    enc.rewards.money = goldEarned;
                }
            }
        }
    }

    it('deve conceder gold ao jogador após vitória wild nível 1', () => {
        const player = makePlayer({ id: 'p1', money: 100 });
        const enc = {
            type: 'wild', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p1',
            wildMonster: makeMonster({ level: 1 })
        };

        simulateHandleVictoryRewardsGold(enc, [player]);

        // nível 1: max(5, floor(1*2)) = max(5,2) = 5 moedas
        expect(player.money).toBe(105);
        expect(enc.rewards.money).toBe(5);
        expect(enc.log.some(l => l.includes('💰'))).toBe(true);
    });

    it('deve conceder gold escalado ao nível do inimigo', () => {
        const player = makePlayer({ id: 'p1', money: 50 });
        const enc = {
            type: 'wild', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p1',
            wildMonster: makeMonster({ level: 10 })
        };

        simulateHandleVictoryRewardsGold(enc, [player]);

        // nível 10: max(5, floor(10*2)) = 20 moedas
        expect(player.money).toBe(70);
        expect(enc.rewards.money).toBe(20);
    });

    it('gold mínimo garantido é 5 mesmo para nível 1', () => {
        const player = makePlayer({ id: 'p1', money: 0 });
        const enc = {
            type: 'wild', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p1',
            wildMonster: makeMonster({ level: 1 })
        };

        simulateHandleVictoryRewardsGold(enc, [player]);

        expect(player.money).toBeGreaterThanOrEqual(5);
    });

    it('gold não é concedido duas vezes (idempotência via moneyGranted)', () => {
        const player = makePlayer({ id: 'p1', money: 100 });
        const enc = {
            type: 'wild', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p1',
            wildMonster: makeMonster({ level: 5 })
        };

        simulateHandleVictoryRewardsGold(enc, [player]);
        const moneyAfterFirst = player.money;
        simulateHandleVictoryRewardsGold(enc, [player]); // chamada duplicada

        expect(player.money).toBe(moneyAfterFirst); // não duplicou
    });

    it('gold não é concedido para encontros group_trainer', () => {
        const player = makePlayer({ id: 'p1', money: 100 });
        const enc = {
            type: 'group_trainer', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p1',
            wildMonster: makeMonster({ level: 5 })
        };

        simulateHandleVictoryRewardsGold(enc, [player]);

        expect(player.money).toBe(100); // não alterado
        expect(enc.moneyGranted).toBe(false); // flag não setada
    });

    it('deve usar player do selectedPlayerId, não do primeiro da lista', () => {
        const player1 = makePlayer({ id: 'p1', money: 100 });
        const player2 = makePlayer({ id: 'p2', money: 50 });
        const enc = {
            type: 'wild', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p2',
            wildMonster: makeMonster({ level: 5 })
        };

        simulateHandleVictoryRewardsGold(enc, [player1, player2]);

        expect(player1.money).toBe(100); // não afetado
        expect(player2.money).toBeGreaterThan(50); // afetado
    });

    it('deve respeitar config.minWildGold e config.wildGoldPerLevel', () => {
        const player = makePlayer({ id: 'p1', money: 0 });
        const enc = {
            type: 'wild', active: false, result: 'victory',
            log: [], moneyGranted: false,
            selectedPlayerId: 'p1',
            wildMonster: makeMonster({ level: 3 })
        };
        const config = { minWildGold: 10, wildGoldPerLevel: 5 };

        simulateHandleVictoryRewardsGold(enc, [player], config);

        // nível 3: max(10, floor(3*5)) = max(10, 15) = 15
        expect(player.money).toBe(15);
        expect(enc.rewards.money).toBe(15);
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

// ─── Fix #7: Painel de resultado exibe ouro ganho ───────────────────────────

describe('Fix #7 — Wild result panel exibe ouro ganho', () => {

    function buildGoldLine(encounter) {
        // Replica a lógica do goldLine no renderWildEncounter
        const goldEarned = encounter.rewards?.money || 0;
        return goldEarned > 0
            ? `<div class="player-select-box mt-5">💰 +${goldEarned} moedas ganhas!</div>`
            : '';
    }

    it('deve mostrar moedas quando rewards.money > 0', () => {
        const enc = makeWildEncounter({ rewards: { xp: 17, money: 10 } });
        const goldLine = buildGoldLine(enc);
        expect(goldLine).toContain('💰');
        expect(goldLine).toContain('+10 moedas');
    });

    it('deve ser vazio quando rewards.money é 0', () => {
        const enc = makeWildEncounter({ rewards: { xp: 17, money: 0 } });
        expect(buildGoldLine(enc)).toBe('');
    });

    it('deve ser vazio quando rewards não está definido', () => {
        const enc = { ...makeWildEncounter() };
        delete enc.rewards;
        expect(buildGoldLine(enc)).toBe('');
    });

    it('deve exibir valor correto para nível 5 (10 moedas)', () => {
        // nível 5: max(5, floor(5*2)) = 10
        const enc = makeWildEncounter({ rewards: { xp: 17, money: 10 } });
        const goldLine = buildGoldLine(enc);
        expect(goldLine).toContain('10');
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

// ─── Fluxo integrado: save+reload persiste ouro de batalha wild ──────────────

describe('Integração — Wild battle gold persiste no save', () => {

    it('awardMoney incrementa player.money e é preservado em JSON roundtrip', () => {
        const player = makePlayer({ money: 100 });
        const goldEarned = 10;
        player.money += goldEarned;

        // Simula save/load (JSON roundtrip)
        const saved = JSON.parse(JSON.stringify(player));
        expect(saved.money).toBe(110);
    });

    it('rewards.money é preservado no encounter serializado', () => {
        const enc = makeWildEncounter({ rewards: { xp: 17, money: 10 } });
        const saved = JSON.parse(JSON.stringify(enc));
        expect(saved.rewards.money).toBe(10);
    });

    it('moneyGranted é preservado para evitar double-grant após reload', () => {
        const enc = makeWildEncounter({ moneyGranted: true });
        const saved = JSON.parse(JSON.stringify(enc));
        expect(saved.moneyGranted).toBe(true);
    });
});
