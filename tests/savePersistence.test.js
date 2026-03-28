/**
 * SAVE PERSISTENCE TESTS (PR-PERSIST)
 *
 * Testes de regressão para o sistema de save/persistência do Monstrinhomon.
 * Cobertura:
 *   - normalizeGameState preserva campos válidos e preenche ausentes
 *   - mmFinishNewGame reseta TODO o GameState (sem vazamento de dados)
 *   - mmContinue usa o estado já carregado pelo init() em vez de reload do slot
 *   - mmHasSave detecta auto-save (monstrinhomon_state) e slots
 *   - save + reload é idempotente (campos críticos preservados)
 *   - saves/slots diferentes não compartilham dados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Helpers de Factory ────────────────────────────────────────────────────

function makeDefaultConfig() {
    return {
        maxTeamSize: 6,
        maxLevel: 100,
        levelExpo: 1.5,
        battleXpBase: 15,
        captureModel: 'threshold_no_dice',
        classAdvantages: {
            'Guerreiro': { strong: 'Ladino', weak: 'Curandeiro' },
            'Ladino': { strong: 'Mago', weak: 'Guerreiro' },
            'Mago': { strong: 'Bárbaro', weak: 'Ladino' },
            'Bárbaro': { strong: 'Caçador', weak: 'Mago' },
            'Caçador': { strong: 'Bardo', weak: 'Bárbaro' },
            'Bardo': { strong: 'Curandeiro', weak: 'Caçador' },
            'Curandeiro': { strong: 'Guerreiro', weak: 'Bardo' },
            'Animalista': { strong: null, weak: null }
        },
        captureThreshold: {
            'Comum': 0.25, 'Incomum': 0.20, 'Raro': 0.15,
            'Místico': 0.10, 'Lendário': 0.05
        },
        rarityPower: {
            'Comum': 1.00, 'Incomum': 1.08, 'Raro': 1.18,
            'Místico': 1.32, 'Lendário': 1.50
        },
        rarityXP: {
            'Comum': 1.00, 'Incomum': 1.05, 'Raro': 1.10,
            'Místico': 1.15, 'Lendário': 1.25
        },
        fleeBase: {
            'Comum': 10, 'Incomum': 12, 'Raro': 15,
            'Místico': 18, 'Lendário': 25
        },
        medalTiers: { bronze: 5, silver: 12, gold: 25 },
        friendshipConfig: {
            battleWin: 2, battleLoss: -5, useHealItem: 5,
            levelUp: 3, faint: -3
        },
        minWildGold: 5,
        wildGoldPerLevel: 2
    };
}

function makeGameState(overrides = {}) {
    return {
        players: [],
        monsters: [],
        sessions: [],
        currentSession: null,
        currentEncounter: null,
        objectives: [],
        therapistMode: false,
        sharedBox: [],
        ui: { activePlayerId: null, boxViewedPlayerId: null, boxPageIndex: 0 },
        meta: { saveVersion: 1 },
        monstrodex: { seen: [], captured: [] },
        partyDex: { entries: {}, meta: { lastMilestoneAwarded: 0 } },
        partyMoney: 0,
        stats: {
            battlesWon: 0, battlesLost: 0, captureAttempts: 0,
            capturesSuccessful: 0, totalXpGained: 0, totalMoneyEarned: 0,
            currentWinStreak: 0, highestWinStreak: 0
        },
        config: makeDefaultConfig(),
        ...overrides
    };
}

function makePlayer(overrides = {}) {
    return {
        id: `p_${Date.now()}_test`,
        name: 'TestPlayer',
        class: 'Guerreiro',
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
        xp: 0,
        hp: 32,
        hpMax: 32,
        ene: 10,
        eneMax: 10,
        buffs: [],
        statusEffects: [],
        friendship: 50,
        ...overrides
    };
}

// ─── Extração da lógica de normalizeGameState (para testar isoladamente) ──

/**
 * Replica a lógica de normalizeGameState do index.html (linhas 1814-1981).
 * Mantida em sincronia com a implementação real.
 * ATENÇÃO: se normalizeGameState em index.html mudar, atualizar aqui também.
 */
function normalizeGameState(state, configDefaults) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
        return {
            players: [],
            monsters: [],
            sessions: [],
            currentSession: null,
            currentEncounter: null,
            objectives: [],
            therapistMode: false,
            meta: { saveVersion: 1 },
            config: configDefaults
        };
    }

    if (!state.meta || typeof state.meta !== 'object' || Array.isArray(state.meta)) {
        state.meta = { saveVersion: 1 };
    } else if (state.meta.saveVersion === undefined) {
        state.meta.saveVersion = 1;
    }

    if (!Array.isArray(state.players)) state.players = [];
    if (!Array.isArray(state.monsters)) state.monsters = [];
    if (!Array.isArray(state.sessions)) state.sessions = [];
    if (!Array.isArray(state.objectives)) state.objectives = [];
    if (!Array.isArray(state.sharedBox)) state.sharedBox = [];

    if (!state.ui || typeof state.ui !== 'object' || Array.isArray(state.ui)) {
        state.ui = { activePlayerId: null, boxViewedPlayerId: null, boxPageIndex: 0 };
    }

    // Normalizar jogadores
    if (state.players) {
        state.players.forEach(player => {
            if (!player || typeof player !== 'object') return;
            if (!Array.isArray(player.team)) player.team = [];
            if (!Array.isArray(player.box)) player.box = [];
            if (!player.inventory || typeof player.inventory !== 'object' || Array.isArray(player.inventory)) {
                player.inventory = {};
            }
        });
    }

    // CORREÇÃO BUG PERSISTÊNCIA: garantir campos do config
    if (!state.config || typeof state.config !== 'object') {
        state.config = configDefaults;
    } else {
        Object.keys(configDefaults).forEach(key => {
            if (state.config[key] === undefined) {
                state.config[key] = configDefaults[key];
            }
        });
    }

    return state;
}

// ─── Extração da lógica de mmFinishNewGame (parte de reset) ───────────────

/**
 * Replica o reset de GameState feito em mmFinishNewGame() após a correção.
 * Corresponde ao bloco "Clear existing state" em index.html (linhas ~9631-9651).
 * ATENÇÃO: se mmFinishNewGame() em index.html mudar o reset, atualizar aqui também.
 */
function resetGameStateForNewGame(GameState) {
    GameState.players = [];
    GameState.monsters = [];
    GameState.sessions = [];
    GameState.currentSession = null;
    GameState.currentEncounter = null;
    GameState.sharedBox = [];
    GameState.partyDex = { entries: {}, meta: { lastMilestoneAwarded: 0 } };
    GameState.partyMoney = 0;
    GameState.monstrodex = { seen: [], captured: [] };
    GameState.stats = {
        battlesWon: 0, battlesLost: 0, captureAttempts: 0,
        capturesSuccessful: 0, totalXpGained: 0, totalMoneyEarned: 0,
        currentWinStreak: 0, highestWinStreak: 0
    };
    GameState.meta = { saveVersion: 1 };
    GameState.ui = { activePlayerId: null, boxViewedPlayerId: null, boxPageIndex: 0 };
}

// ─── Extração da lógica de mmContinue ────────────────────────────────────

/**
 * Replica a lógica central de mmContinue() após a correção.
 * Corresponde a index.html, função mmContinue() (linhas ~9424-9468).
 * Retorna 'loaded-in-memory' | 'loaded-from-slot' | 'no-save'
 * ATENÇÃO: se mmContinue() em index.html mudar, atualizar aqui também.
 */
function mmContinueLogic(GameState, getLastSlot, readSlot, onLoaded) {
    // Se init() já carregou estado válido, usar diretamente
    const hasLoadedGame = Array.isArray(GameState.players) && GameState.players.length > 0;
    if (hasLoadedGame) {
        onLoaded('loaded-in-memory');
        return 'loaded-in-memory';
    }

    // Fallback: tentar slot
    const lastSlot = getLastSlot();
    const slotNum = lastSlot ? parseInt(lastSlot, 10) : 1;
    if ([1, 2, 3].includes(slotNum)) {
        const env = readSlot(slotNum);
        if (env && env.state) {
            Object.assign(GameState, env.state);
            GameState.saveSlot = slotNum;
            onLoaded('loaded-from-slot');
            return 'loaded-from-slot';
        }
    }

    return 'no-save';
}

// ─── Extração da lógica de mmHasSave ─────────────────────────────────────

/**
 * Replica a lógica de mmHasSave() após a correção.
 * Corresponde a index.html, função mmHasSave() (linhas ~8901-8923).
 * ATENÇÃO: se mmHasSave() em index.html mudar, atualizar aqui também.
 */
function mmHasSaveLogic(loadMainState, readSlot) {
    // Verificar auto-save principal
    try {
        const result = loadMainState();
        if (result.loaded && result.state &&
            Array.isArray(result.state.players) && result.state.players.length > 0) {
            return true;
        }
    } catch(e) {}

    // Fallback: verificar slots
    for (let slot = 1; slot <= 3; slot++) {
        const env = readSlot(slot);
        if (env && env.state) return true;
    }
    return false;
}

// ══════════════════════════════════════════════════════════════════════════
// TESTES
// ══════════════════════════════════════════════════════════════════════════

describe('normalizeGameState - Preservação e Preenchimento de Config', () => {
    const configDefaults = makeDefaultConfig();

    it('deve preservar config completo do save sem modificações', () => {
        const state = makeGameState();
        state.config.maxTeamSize = 8; // valor personalizado
        const result = normalizeGameState(state, configDefaults);
        // Valor personalizado deve ser preservado
        expect(result.config.maxTeamSize).toBe(8);
    });

    it('deve preencher friendshipConfig ausente em save antigo', () => {
        const state = makeGameState();
        delete state.config.friendshipConfig; // simula save antigo
        const result = normalizeGameState(state, configDefaults);
        expect(result.config.friendshipConfig).toBeDefined();
        expect(result.config.friendshipConfig.battleWin).toBe(2);
        expect(result.config.friendshipConfig.battleLoss).toBe(-5);
    });

    it('deve preencher rarityPower ausente em save antigo', () => {
        const state = makeGameState();
        delete state.config.rarityPower;
        const result = normalizeGameState(state, configDefaults);
        expect(result.config.rarityPower).toBeDefined();
        expect(result.config.rarityPower['Lendário']).toBe(1.50);
    });

    it('deve preencher fleeBase ausente em save antigo', () => {
        const state = makeGameState();
        delete state.config.fleeBase;
        const result = normalizeGameState(state, configDefaults);
        expect(result.config.fleeBase).toBeDefined();
        expect(result.config.fleeBase['Lendário']).toBe(25);
    });

    it('deve preencher medalTiers ausente em save antigo', () => {
        const state = makeGameState();
        delete state.config.medalTiers;
        const result = normalizeGameState(state, configDefaults);
        expect(result.config.medalTiers).toBeDefined();
        expect(result.config.medalTiers.bronze).toBe(5);
    });

    it('não deve sobrescrever valor personalizado existente no config', () => {
        const state = makeGameState();
        state.config.battleXpBase = 25; // diferente do default (15)
        const result = normalizeGameState(state, configDefaults);
        // Valor salvo deve prevalecer sobre o default
        expect(result.config.battleXpBase).toBe(25);
    });

    it('deve substituir config completamente ausente por defaults', () => {
        const state = makeGameState();
        state.config = null;
        const result = normalizeGameState(state, configDefaults);
        expect(result.config).toBeDefined();
        expect(result.config.maxTeamSize).toBe(6);
        expect(result.config.friendshipConfig).toBeDefined();
    });

    it('deve garantir sharedBox é array', () => {
        const state = makeGameState();
        delete state.sharedBox;
        const result = normalizeGameState(state, configDefaults);
        expect(Array.isArray(result.sharedBox)).toBe(true);
    });

    it('deve garantir players é array', () => {
        const state = makeGameState();
        state.players = null;
        const result = normalizeGameState(state, configDefaults);
        expect(Array.isArray(result.players)).toBe(true);
    });

    it('deve retornar estado default seguro para state inválido (null)', () => {
        const result = normalizeGameState(null, configDefaults);
        expect(Array.isArray(result.players)).toBe(true);
        expect(result.config).toBeDefined();
        expect(result.meta.saveVersion).toBe(1);
    });

    it('deve retornar estado default seguro para state inválido (array)', () => {
        const result = normalizeGameState([], configDefaults);
        expect(Array.isArray(result.players)).toBe(true);
    });
});

describe('normalizeGameState - Preservação de Dados do Jogador', () => {
    const configDefaults = makeDefaultConfig();

    it('deve preservar money do jogador', () => {
        const state = makeGameState();
        const player = makePlayer({ money: 500 });
        state.players = [player];
        const result = normalizeGameState(state, configDefaults);
        expect(result.players[0].money).toBe(500);
    });

    it('deve preservar team do jogador com monstros', () => {
        const state = makeGameState();
        const monster = makeMonster({ name: 'Pedrino', level: 10 });
        const player = makePlayer({ team: [monster] });
        state.players = [player];
        const result = normalizeGameState(state, configDefaults);
        expect(result.players[0].team.length).toBe(1);
        expect(result.players[0].team[0].name).toBe('Pedrino');
        expect(result.players[0].team[0].level).toBe(10);
    });

    it('deve preservar inventário do jogador', () => {
        const state = makeGameState();
        const player = makePlayer({
            inventory: { 'CLASTERORB_COMUM': 5, 'IT_HEAL_01': 3 }
        });
        state.players = [player];
        const result = normalizeGameState(state, configDefaults);
        expect(result.players[0].inventory['CLASTERORB_COMUM']).toBe(5);
        expect(result.players[0].inventory['IT_HEAL_01']).toBe(3);
    });

    it('deve garantir team é array para jogador sem team', () => {
        const state = makeGameState();
        const player = makePlayer();
        delete player.team;
        state.players = [player];
        const result = normalizeGameState(state, configDefaults);
        expect(Array.isArray(result.players[0].team)).toBe(true);
    });

    it('deve garantir inventory é objeto para jogador sem inventory', () => {
        const state = makeGameState();
        const player = makePlayer();
        delete player.inventory;
        state.players = [player];
        const result = normalizeGameState(state, configDefaults);
        expect(typeof result.players[0].inventory).toBe('object');
        expect(Array.isArray(result.players[0].inventory)).toBe(false);
    });
});

describe('resetGameStateForNewGame - Isolamento de Saves', () => {
    it('deve resetar players para array vazio', () => {
        const gs = makeGameState();
        gs.players = [makePlayer({ name: 'Antigo' })];
        resetGameStateForNewGame(gs);
        expect(gs.players).toEqual([]);
    });

    it('deve resetar stats para zeros', () => {
        const gs = makeGameState();
        gs.stats.battlesWon = 42;
        gs.stats.capturesSuccessful = 10;
        resetGameStateForNewGame(gs);
        expect(gs.stats.battlesWon).toBe(0);
        expect(gs.stats.capturesSuccessful).toBe(0);
    });

    it('deve resetar sharedBox para array vazio', () => {
        const gs = makeGameState();
        gs.sharedBox = [{ slotId: 'BX_001', ownerPlayerId: 'p1', monster: makeMonster() }];
        resetGameStateForNewGame(gs);
        expect(gs.sharedBox).toEqual([]);
    });

    it('deve resetar partyDex para estado inicial', () => {
        const gs = makeGameState();
        gs.partyDex.entries = { 'MON_001': { seen: true, captured: true } };
        gs.partyDex.meta.lastMilestoneAwarded = 10;
        resetGameStateForNewGame(gs);
        expect(gs.partyDex.entries).toEqual({});
        expect(gs.partyDex.meta.lastMilestoneAwarded).toBe(0);
    });

    it('deve resetar partyMoney para zero', () => {
        const gs = makeGameState();
        gs.partyMoney = 999;
        resetGameStateForNewGame(gs);
        expect(gs.partyMoney).toBe(0);
    });

    it('deve resetar monstrodex para listas vazias', () => {
        const gs = makeGameState();
        gs.monstrodex = { seen: ['MON_001', 'MON_002'], captured: ['MON_001'] };
        resetGameStateForNewGame(gs);
        expect(gs.monstrodex.seen).toEqual([]);
        expect(gs.monstrodex.captured).toEqual([]);
    });

    it('deve resetar meta.saveVersion para 1', () => {
        const gs = makeGameState();
        gs.meta.saveVersion = 99;
        resetGameStateForNewGame(gs);
        expect(gs.meta.saveVersion).toBe(1);
    });

    it('deve resetar ui para estado inicial', () => {
        const gs = makeGameState();
        gs.ui.activePlayerId = 'p_old';
        gs.ui.boxPageIndex = 5;
        resetGameStateForNewGame(gs);
        expect(gs.ui.activePlayerId).toBeNull();
        expect(gs.ui.boxPageIndex).toBe(0);
    });

    it('deve resetar currentEncounter e currentSession', () => {
        const gs = makeGameState();
        gs.currentEncounter = { type: 'wild', active: true };
        gs.currentSession = { id: 'sess_old', name: 'Sessão Antiga' };
        resetGameStateForNewGame(gs);
        expect(gs.currentEncounter).toBeNull();
        expect(gs.currentSession).toBeNull();
    });

    it('deve preservar therapistMode (preferência do dispositivo)', () => {
        const gs = makeGameState({ therapistMode: true });
        resetGameStateForNewGame(gs);
        expect(gs.therapistMode).toBe(true); // não deve ser resetado
    });

    it('deve preservar config (configurações do jogo)', () => {
        const gs = makeGameState();
        gs.config.maxTeamSize = 8;
        resetGameStateForNewGame(gs);
        expect(gs.config.maxTeamSize).toBe(8); // não deve ser resetado
    });

    it('novo save não herda battlesWon do save anterior', () => {
        const gs = makeGameState();
        gs.players = [makePlayer({ name: 'Antigo' })];
        gs.stats.battlesWon = 50;
        gs.stats.capturesSuccessful = 20;

        resetGameStateForNewGame(gs);
        gs.players = [makePlayer({ name: 'Novo' })];

        expect(gs.stats.battlesWon).toBe(0);
        expect(gs.stats.capturesSuccessful).toBe(0);
        expect(gs.players[0].name).toBe('Novo');
    });

    it('dois saves consecutivos não compartilham partyDex', () => {
        const gs = makeGameState();
        // Simular primeiro jogo
        gs.players = [makePlayer({ name: 'Jogo1' })];
        gs.partyDex.entries['MON_001'] = { seen: true, captured: true };
        gs.partyMoney = 100;

        // Iniciar segundo jogo
        resetGameStateForNewGame(gs);
        gs.players = [makePlayer({ name: 'Jogo2' })];

        expect(gs.partyDex.entries).toEqual({});
        expect(gs.partyMoney).toBe(0);
        expect(gs.players[0].name).toBe('Jogo2');
    });
});

describe('mmContinueLogic - Uso do Estado Carregado pelo init()', () => {
    it('deve usar estado em memória se players já carregados pelo init()', () => {
        const gs = makeGameState();
        gs.players = [makePlayer({ name: 'JogadorCarregado', money: 500 })];

        const getLastSlot = vi.fn(() => 1);
        const readSlot = vi.fn(() => ({
            state: makeGameState({ players: [makePlayer({ name: 'SlotAntigo', money: 10 })] })
        }));
        const onLoaded = vi.fn();

        const result = mmContinueLogic(gs, getLastSlot, readSlot, onLoaded);

        expect(result).toBe('loaded-in-memory');
        expect(readSlot).not.toHaveBeenCalled(); // não deve ler o slot
        expect(gs.players[0].name).toBe('JogadorCarregado'); // progresso preservado
        expect(gs.players[0].money).toBe(500); // money preservado
    });

    it('deve carregar do slot se GameState está vazio (init não carregou nada)', () => {
        const gs = makeGameState();
        gs.players = []; // estado vazio

        const slotState = makeGameState({
            players: [makePlayer({ name: 'DoSlot', money: 200 })]
        });
        const getLastSlot = vi.fn(() => 1);
        const readSlot = vi.fn(() => ({ state: slotState }));
        const onLoaded = vi.fn();

        const result = mmContinueLogic(gs, getLastSlot, readSlot, onLoaded);

        expect(result).toBe('loaded-from-slot');
        expect(gs.players[0].name).toBe('DoSlot');
    });

    it('deve retornar no-save se GameState vazio e slots também vazios', () => {
        const gs = makeGameState();
        gs.players = [];

        const getLastSlot = vi.fn(() => 1);
        const readSlot = vi.fn(() => null);
        const onLoaded = vi.fn();

        const result = mmContinueLogic(gs, getLastSlot, readSlot, onLoaded);

        expect(result).toBe('no-save');
        expect(onLoaded).not.toHaveBeenCalled();
    });

    it('não deve sobrescrever progresso do auto-save com dados mais antigos do slot', () => {
        const gs = makeGameState();
        // Auto-save tem 50 batalhas ganhas
        gs.players = [makePlayer({ name: 'Com Progresso' })];
        gs.stats.battlesWon = 50;

        // Slot tem estado mais antigo (0 batalhas)
        const slotState = makeGameState({
            players: [makePlayer({ name: 'Estado Antigo do Slot' })]
        });
        slotState.stats = { battlesWon: 0, battlesLost: 0 };

        const getLastSlot = vi.fn(() => 1);
        const readSlot = vi.fn(() => ({ state: slotState }));
        const onLoaded = vi.fn();

        mmContinueLogic(gs, getLastSlot, readSlot, onLoaded);

        // Progresso deve ser preservado (slot não foi carregado)
        expect(gs.stats.battlesWon).toBe(50);
        expect(gs.players[0].name).toBe('Com Progresso');
    });

    it('deve usar slot correto retornado por getLastSlot', () => {
        const gs = makeGameState();
        gs.players = []; // estado vazio

        const slot3State = makeGameState({
            players: [makePlayer({ name: 'Slot3Player' })]
        });
        const getLastSlot = vi.fn(() => 3); // último slot era o 3
        const readSlot = vi.fn(slot => slot === 3 ? { state: slot3State } : null);
        const onLoaded = vi.fn();

        const result = mmContinueLogic(gs, getLastSlot, readSlot, onLoaded);

        expect(result).toBe('loaded-from-slot');
        expect(readSlot).toHaveBeenCalledWith(3);
        expect(gs.players[0].name).toBe('Slot3Player');
    });
});

describe('mmHasSaveLogic - Detecção de Save', () => {
    it('deve retornar true se auto-save tem jogadores válidos', () => {
        const mainState = makeGameState({
            players: [makePlayer({ name: 'JogadorSalvo' })]
        });
        const loadMainState = vi.fn(() => ({ loaded: true, state: mainState }));
        const readSlot = vi.fn(() => null);

        expect(mmHasSaveLogic(loadMainState, readSlot)).toBe(true);
        expect(readSlot).not.toHaveBeenCalled(); // não precisa verificar slots
    });

    it('deve retornar false se auto-save está vazio e slots também', () => {
        const loadMainState = vi.fn(() => ({ loaded: false, state: null }));
        const readSlot = vi.fn(() => null);

        expect(mmHasSaveLogic(loadMainState, readSlot)).toBe(false);
    });

    it('deve retornar true se auto-save vazio mas slot tem dados', () => {
        const loadMainState = vi.fn(() => ({
            loaded: true,
            state: makeGameState({ players: [] }) // auto-save sem jogadores
        }));
        const slotEnv = { state: makeGameState({ players: [makePlayer()] }) };
        const readSlot = vi.fn(slot => slot === 1 ? slotEnv : null);

        expect(mmHasSaveLogic(loadMainState, readSlot)).toBe(true);
    });

    it('deve retornar false se auto-save tem players vazios e slots vazios', () => {
        const loadMainState = vi.fn(() => ({
            loaded: true,
            state: makeGameState({ players: [] })
        }));
        const readSlot = vi.fn(() => null);

        expect(mmHasSaveLogic(loadMainState, readSlot)).toBe(false);
    });

    it('deve retornar true se auto-save falhar mas slot tiver dados', () => {
        const loadMainState = vi.fn(() => { throw new Error('Erro de acesso'); });
        const slotEnv = { state: makeGameState({ players: [makePlayer()] }) };
        const readSlot = vi.fn(slot => slot === 2 ? slotEnv : null);

        expect(mmHasSaveLogic(loadMainState, readSlot)).toBe(true);
    });
});

describe('Idempotência: salvar e carregar mantém integridade', () => {
    const configDefaults = makeDefaultConfig();

    it('normalizeGameState é idempotente (chamadas repetidas não alteram o resultado)', () => {
        const state = makeGameState();
        const player = makePlayer({ money: 250 });
        player.team = [makeMonster({ level: 7, hp: 25, hpMax: 32 })];
        state.players = [player];

        const result1 = normalizeGameState(JSON.parse(JSON.stringify(state)), configDefaults);
        const result2 = normalizeGameState(JSON.parse(JSON.stringify(result1)), configDefaults);

        expect(result2.players[0].money).toBe(250);
        expect(result2.players[0].team[0].level).toBe(7);
        expect(result2.players[0].team[0].hp).toBe(25);
    });

    it('save-load preserva questState do jogador', () => {
        const state = makeGameState();
        const player = makePlayer({
            questState: {
                activeQuestIds: ['quest_01'],
                completedQuestIds: ['quest_00'],
                progress: { 'quest_01': { count: 3 } }
            }
        });
        state.players = [player];

        // Simular save/load: JSON roundtrip + normalize
        const loaded = JSON.parse(JSON.stringify(state));
        const result = normalizeGameState(loaded, configDefaults);

        expect(result.players[0].questState.activeQuestIds).toEqual(['quest_01']);
        expect(result.players[0].questState.completedQuestIds).toEqual(['quest_00']);
        expect(result.players[0].questState.progress['quest_01'].count).toBe(3);
    });

    it('save-load preserva money do jogador', () => {
        const state = makeGameState();
        const player = makePlayer({ money: 750 });
        state.players = [player];

        const loaded = JSON.parse(JSON.stringify(state));
        const result = normalizeGameState(loaded, configDefaults);

        expect(result.players[0].money).toBe(750);
    });

    it('save-load preserva inventário completo', () => {
        const state = makeGameState();
        const player = makePlayer({
            inventory: { 'CLASTERORB_COMUM': 3, 'IT_HEAL_01': 5, 'CLASTERORB_RARA': 1 }
        });
        state.players = [player];

        const loaded = JSON.parse(JSON.stringify(state));
        const result = normalizeGameState(loaded, configDefaults);

        expect(result.players[0].inventory['CLASTERORB_COMUM']).toBe(3);
        expect(result.players[0].inventory['IT_HEAL_01']).toBe(5);
        expect(result.players[0].inventory['CLASTERORB_RARA']).toBe(1);
    });

    it('save-load preserva activeIndex do jogador', () => {
        const state = makeGameState();
        const player = makePlayer({ activeIndex: 2 });
        state.players = [player];

        const loaded = JSON.parse(JSON.stringify(state));
        const result = normalizeGameState(loaded, configDefaults);

        expect(result.players[0].activeIndex).toBe(2);
    });

    it('save-load preserva nível e XP do monstrinho', () => {
        const state = makeGameState();
        const monster = makeMonster({ level: 15, xp: 120, hp: 40, hpMax: 50 });
        const player = makePlayer({ team: [monster] });
        state.players = [player];

        const loaded = JSON.parse(JSON.stringify(state));
        const result = normalizeGameState(loaded, configDefaults);

        const loadedMonster = result.players[0].team[0];
        expect(loadedMonster.level).toBe(15);
        expect(loadedMonster.xp).toBe(120);
        expect(loadedMonster.hp).toBe(40);
        expect(loadedMonster.hpMax).toBe(50);
    });

    it('save-load preserva encounters e progresso', () => {
        const state = makeGameState();
        state.stats.battlesWon = 12;
        state.stats.capturesSuccessful = 5;
        state.partyDex.entries['MON_001'] = { seen: true, captured: true };

        const loaded = JSON.parse(JSON.stringify(state));
        const result = normalizeGameState(loaded, configDefaults);

        expect(result.stats.battlesWon).toBe(12);
        expect(result.stats.capturesSuccessful).toBe(5);
        expect(result.partyDex.entries['MON_001']).toEqual({ seen: true, captured: true });
    });
});

describe('Isolamento entre Saves/Slots', () => {
    it('dois GameStates criados independentemente não compartilham referências', () => {
        const gs1 = makeGameState();
        gs1.players = [makePlayer({ name: 'Player1' })];

        const gs2 = makeGameState();
        gs2.players = [makePlayer({ name: 'Player2' })];

        // Modificar gs2 não deve afetar gs1
        gs2.players[0].money = 9999;

        expect(gs1.players[0].money).toBe(100); // não contaminado
        expect(gs1.players[0].name).toBe('Player1');
    });

    it('mmBuildSaveEnvelope deve fazer deep clone (JSON roundtrip)', () => {
        const gs = makeGameState();
        gs.players = [makePlayer({ money: 300 })];

        // Simular mmBuildSaveEnvelope
        const envelope = {
            version: 'mm_slot_v1',
            timestamp: Date.now(),
            state: JSON.parse(JSON.stringify(gs))
        };

        // Modificar GameState após criar envelope não deve alterar envelope
        gs.players[0].money = 9999;

        expect(envelope.state.players[0].money).toBe(300); // snapshot preservado
    });

    it('carregar slot não deve vazar dados do slot para outra sessão', () => {
        // Simular slot 1 com dados do Jogo A
        const slotAState = makeGameState();
        slotAState.players = [makePlayer({ name: 'JogoA', money: 500 })];
        slotAState.stats.battlesWon = 30;

        // Simular slot 2 com dados do Jogo B
        const slotBState = makeGameState();
        slotBState.players = [makePlayer({ name: 'JogoB', money: 200 })];
        slotBState.stats.battlesWon = 5;

        // Carregar slot 1
        const gs = makeGameState();
        Object.assign(gs, JSON.parse(JSON.stringify(slotAState)));

        // Verificar que só dados do Jogo A estão em GameState
        expect(gs.players[0].name).toBe('JogoA');
        expect(gs.players[0].money).toBe(500);
        expect(gs.stats.battlesWon).toBe(30);

        // Slot B não deve ter sido afetado
        expect(slotBState.players[0].name).toBe('JogoB');
        expect(slotBState.stats.battlesWon).toBe(5);
    });
});
