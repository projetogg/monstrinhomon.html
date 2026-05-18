/**
 * WILD LOOP SMOKE TEST — regressão automática do MVP 0.3
 *
 * Decisão técnica: teste Vitest/integration (Opção B), porque o projeto ainda
 * não possui uma configuração Playwright dedicada ao fluxo. O teste exercita
 * módulos reais (starters, wildActions, wildCore, xpActions, StorageManager e
 * SaveLayer) sem rede, sem fontes externas e sem assets visuais.
 *
 * TODO(MVP 0.4): promover este roteiro para Playwright E2E quando a UI de
 * decisão estiver estabilizada para interação ponta-a-ponta no navegador.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { STARTER_BY_CLASS } from '../js/data/starters.js';
import { executeWildAttack, executeWildCapture } from '../js/combat/wildActions.js';
import { handleVictoryRewards } from '../js/progression/xpActions.js';
import { calculateBattleXP } from '../js/progression/xpCore.js';
import { getFriendshipBonuses, DEFAULT_FRIENDSHIP } from '../js/progression/friendshipSystem.js';

const monstersPath = resolve(__dirname, '../data/monsters.json');
const CATALOG = JSON.parse(readFileSync(monstersPath, 'utf-8')).monsters;

const CLASS_ADVANTAGES = {
    Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
    Ladino: { strong: 'Mago', weak: 'Guerreiro' },
    Mago: { strong: 'Bárbaro', weak: 'Ladino' },
    Bárbaro: { strong: 'Caçador', weak: 'Mago' },
    Caçador: { strong: 'Bardo', weak: 'Bárbaro' },
    Bardo: { strong: 'Curandeiro', weak: 'Caçador' },
    Curandeiro: { strong: 'Guerreiro', weak: 'Bardo' },
    Animalista: { strong: null, weak: null },
};

const BASIC_ATTACK_POWER = {
    Guerreiro: 7,
    Mago: 7,
    Curandeiro: 8,
    Bárbaro: 9,
    Ladino: 8,
    Bardo: 7,
    Caçador: 8,
    Animalista: 7,
};

const RARITY_POWER = {
    Comum: 1.00,
    Incomum: 1.08,
    Raro: 1.18,
    Místico: 1.32,
    Lendário: 1.50,
};

const RARITY_XP = {
    Comum: 1.00,
    Incomum: 1.05,
    Raro: 1.10,
    Místico: 1.15,
    Lendário: 1.25,
};

const ENE_REGEN_BY_CLASS = {
    Mago: { pct: 0.18, min: 3 },
    Curandeiro: { pct: 0.18, min: 3 },
    Bardo: { pct: 0.14, min: 2 },
    Caçador: { pct: 0.14, min: 2 },
    Ladino: { pct: 0.14, min: 2 },
    Animalista: { pct: 0.12, min: 2 },
    Bárbaro: { pct: 0.12, min: 2 },
    Guerreiro: { pct: 0.10, min: 1 },
};

function calcXpNeeded(level) {
    const L = Math.max(1, Number(level) || 1);
    return Math.round(40 + 6 * L + 0.6 * (L * L));
}

function templateById(templateId) {
    const template = CATALOG.find(m => m.id === templateId);
    expect(template, `Template ${templateId} deve existir no catálogo real`).toBeTruthy();
    return template;
}

function createMonsterInstanceFromTemplate(templateId, level = 1, overrides = {}) {
    const template = templateById(templateId);
    const finalRarity = overrides.rarity || template.rarity || 'Comum';
    const rarityMult = RARITY_POWER[finalRarity] || 1;
    const levelMult = 1 + (level - 1) * 0.1;
    const hpMax = Math.floor((template.baseHp || 30) * levelMult);
    const atk = Math.floor((template.baseAtk || 5) * levelMult * rarityMult);
    const def = Math.floor((template.baseDef || 3) * levelMult * rarityMult);
    const spd = Math.floor((template.baseSpd || 5) * levelMult * rarityMult);
    const eneMax = Math.floor(10 + 2 * (level - 1));

    return {
        templateId: template.id,
        instanceId: overrides.instanceId || `mi_smoke_${template.id}_${level}_${Math.random().toString(36).slice(2, 8)}`,
        name: template.name,
        nickname: template.name,
        emoji: template.emoji || '👾',
        class: template.class,
        rarity: finalRarity,
        level,
        xp: 0,
        xpNeeded: calcXpNeeded(level),
        hp: hpMax,
        hpMax,
        ene: eneMax,
        eneMax,
        atk,
        def,
        spd,
        poder: Math.floor(atk * 0.5),
        status: 'healthy',
        buffs: [],
        friendship: DEFAULT_FRIENDSHIP,
        ...overrides,
    };
}

function makeInitialGameState() {
    const playerClass = 'Mago';
    const starterInfo = STARTER_BY_CLASS[playerClass];
    expect(starterInfo?.monsterId, 'Starter de Mago deve estar mapeado').toBe('MON_013');

    const player = {
        id: 'player_smoke_1',
        name: 'Smoke Criança',
        class: playerClass,
        money: 100,
        afterlifeCurrency: 0,
        activeIndex: 0,
        team: [],
        box: [],
        starterGranted: false,
        inventory: {
            CLASTERORB_COMUM: 5,
            CLASTERORB_INCOMUM: 2,
            CLASTERORB_RARA: 1,
            IT_HEAL_01: 3,
        },
    };

    const starter = createMonsterInstanceFromTemplate(starterInfo.monsterId, 5, {
        ownerId: player.id,
        instanceId: 'mi_smoke_starter_mago',
    });
    player.team.push(starter);
    player.starterGranted = true;
    player.starterMonsterId = starterInfo.monsterId;

    return {
        players: [player],
        monsters: [],
        sessions: [{ id: 'sess_smoke_1', name: 'Sessão Smoke' }],
        currentSession: { id: 'sess_smoke_1', name: 'Sessão Smoke' },
        currentEncounter: null,
        sharedBox: [],
        partyMoney: 0,
        monstrodex: { seen: [], captured: [] },
        stats: {
            battlesWon: 0,
            battlesLost: 0,
            captureAttempts: 0,
            capturesSuccessful: 0,
            totalXpGained: 0,
            totalMoneyEarned: 0,
            currentWinStreak: 0,
            highestWinStreak: 0,
        },
        starterFlowCompleted: true,
        config: {
            maxTeamSize: 6,
            maxLevel: 100,
            battleXpBase: 15,
            classAdvantages: CLASS_ADVANTAGES,
            rarityXP: RARITY_XP,
        },
        meta: { saveVersion: 1 },
        ui: { activePlayerId: player.id },
    };
}

function validateStarterConsistency(state) {
    const player = state?.players?.[0];
    const starter = player?.team?.[0];
    const expectedStarterId = STARTER_BY_CLASS[player?.class]?.monsterId;

    if (!player?.starterGranted || !expectedStarterId) {
        return { ok: false, reason: 'starter_missing' };
    }
    if (player.starterMonsterId !== expectedStarterId) {
        return { ok: false, reason: 'starter_metadata_mismatch' };
    }
    if (!starter) {
        return { ok: false, reason: 'starter_instance_missing' };
    }
    if (starter.templateId !== expectedStarterId) {
        return { ok: false, reason: 'starter_instance_template_mismatch' };
    }
    if (starter.class !== player.class) {
        return { ok: false, reason: 'starter_instance_class_mismatch' };
    }
    if ((starter.hp || 0) <= 0) {
        return { ok: false, reason: 'starter_instance_hp_invalid' };
    }

    return { ok: true, reason: null };
}

function startSmokeWildBattle(state) {
    const player = state.players[0];
    const wild = createMonsterInstanceFromTemplate('MON_029', 3, {
        instanceId: 'wild_smoke_barbaro',
        aggression: 20,
        skill: null,
        hp: 18,
        hpMax: 100,
    });

    state.currentEncounter = {
        id: 'enc_smoke_wild_1',
        type: 'wild',
        active: true,
        selectedPlayerId: player.id,
        wildMonster: wild,
        log: ['🧪 Smoke: Wild Loop mínimo iniciado.'],
        rewardsGranted: false,
        behaviorallyResolved: false,
    };

    state.monstrodex.seen.push(wild.templateId);
    return state.currentEncounter;
}

function makeProgressionDeps(state) {
    return {
        state,
        constants: { DEFAULT_FRIENDSHIP, maxLevel: state.config.maxLevel },
        helpers: {
            ensureMonsterProgressFields(mon) {
                mon.level = Math.max(1, Number(mon.level) || 1);
                mon.xp = Math.max(0, Number(mon.xp) || 0);
                mon.xpNeeded = Math.max(1, Number(mon.xpNeeded) || calcXpNeeded(mon.level));
                if (mon.hpMax == null && mon.maxHp != null) mon.hpMax = mon.maxHp;
                if (mon.hp == null && mon.hpMax != null) mon.hp = mon.hpMax;
            },
            calcXpNeeded,
            recalculateStatsFromTemplate() {},
            getFriendshipBonuses,
            formatFriendshipBonusPercent: (mult) => Math.round((mult - 1) * 100),
            updateFriendship() {},
            maybeEvolveAfterLevelUp() {},
            maybeUpgradeSkillsModelB() {},
            calculateBattleXP: (enemy, battleType) => calculateBattleXP(enemy, battleType, state.config),
            updateStats: (key, delta) => {
                state.stats[key] = (state.stats[key] || 0) + delta;
            },
        },
    };
}

function makeWildDeps(state) {
    return {
        classAdvantages: state.config.classAdvantages,
        getBasicPower: (monsterClass) => BASIC_ATTACK_POWER[monsterClass] || 7,
        eneRegenData: ENE_REGEN_BY_CLASS,
        audio: { playSfx: vi.fn() },
        ui: { flashTarget: vi.fn(), showFloatingText: vi.fn(), updateDiceClash: vi.fn() },
        rollD20: () => 1,
        tutorialOnAction: vi.fn(),
        updateFriendship: vi.fn(),
        updateMultipleFriendshipEvents: vi.fn(),
        showToast: vi.fn(),
        updateStats: (key, delta) => {
            state.stats[key] = (state.stats[key] || 0) + delta;
        },
        handleVictoryRewards: (encounter) => handleVictoryRewards(makeProgressionDeps(state), encounter),
        onCaptureSuccess: (player, monster, log) => {
            const captured = createMonsterInstanceFromTemplate(monster.templateId, monster.level || 1, {
                instanceId: 'mi_smoke_captured_barbaro',
                ownerId: player.id,
                hp: monster.hp,
                hpMax: monster.hpMax,
                aggression: monster.aggression,
            });
            if (player.team.length < state.config.maxTeamSize) {
                player.team.push(captured);
                log(`📦 ${captured.name} entrou no time de ${player.name}.`);
            } else {
                state.sharedBox.push({ ownerId: player.id, monster: captured });
                log(`📦 ${captured.name} foi enviado para a Box.`);
            }
            if (!state.monstrodex.captured.includes(captured.templateId)) {
                state.monstrodex.captured.push(captured.templateId);
            }
        },
    };
}

function createLocalStorageMock() {
    const store = new Map();
    return {
        getItem: vi.fn((key) => (store.has(key) ? store.get(key) : null)),
        setItem: vi.fn((key, value) => { store.set(key, String(value)); }),
        removeItem: vi.fn((key) => { store.delete(key); }),
        clear: vi.fn(() => { store.clear(); }),
        key: vi.fn((index) => Array.from(store.keys())[index] ?? null),
        get length() { return store.size; },
    };
}

async function installStorageStack(state) {
    vi.resetModules();
    const localStorage = createLocalStorageMock();
    globalThis.localStorage = localStorage;
    globalThis.window = { localStorage, GameState: state };
    await import('../js/storage.js');
    await import('../js/saveLayer.js');
    return { localStorage, SaveLayer: globalThis.window.SaveLayer };
}

describe('Smoke MVP 0.3 — Wild Loop mínimo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete globalThis.window;
        delete globalThis.localStorage;
    });

    it('abre estado inicial equivalente, batalha/captura e preserva progresso no save/continue', async () => {
        const state = makeInitialGameState();
        const player = state.players[0];
        const starter = player.team[0];
        const starterValidation = validateStarterConsistency(state);

        expect(starterValidation.ok).toBe(true);
        expect(player.class).toBe('Mago');
        expect(player.starterGranted).toBe(true);
        expect(player.starterMonsterId).toBe('MON_013');
        expect(starter.templateId).toBe('MON_013');
        expect(starter.class).toBe(player.class);
        expect(starter.hp).toBeGreaterThan(0);

        const encounter = startSmokeWildBattle(state);
        expect(state.currentEncounter).toBeTruthy();
        expect(encounter.active).toBe(true);
        expect(encounter.type).toBe('wild');
        expect(encounter.wildMonster.templateId).toBe('MON_029');
        expect(encounter.wildMonster.hp).toBeGreaterThan(0);

        const hpBeforeAttack = encounter.wildMonster.hp;
        const playerHpBeforeAttack = starter.hp;
        const attackResult = executeWildAttack({
            encounter,
            player,
            playerMonster: starter,
            d20Roll: 15,
            defenderRoll: 1,
            dependencies: makeWildDeps(state),
        });

        expect(attackResult.success).toBe(true);
        expect(encounter.wildMonster.hp).toBeLessThan(hpBeforeAttack);
        expect(starter.hp).toBe(playerHpBeforeAttack);
        expect(encounter.log.some(line => line.includes('acerta') || line.includes('Causa'))).toBe(true);

        let terminalResult = attackResult.result;
        if (encounter.active) {
            const teamSizeBeforeCapture = player.team.length;
            const orbsBeforeCapture = player.inventory.CLASTERORB_COMUM;
            const captureResult = executeWildCapture({
                encounter,
                player,
                playerMonster: starter,
                orbInfo: {
                    id: 'CLASTERORB_COMUM',
                    name: 'ClasterOrb Comum',
                    emoji: '⚪',
                    capture_bonus_pp: 0,
                },
                dependencies: {
                    ...makeWildDeps(state),
                    captureThreshold: 35,
                },
            });
            terminalResult = captureResult.result;

            expect(captureResult.success).toBe(true);
            expect(captureResult.captured).toBe(true);
            expect(player.inventory.CLASTERORB_COMUM).toBe(orbsBeforeCapture - 1);
            expect(player.team.length).toBe(teamSizeBeforeCapture + 1);
            expect(player.team.at(-1).templateId).toBe('MON_029');
            expect(state.stats.captureAttempts).toBe(1);
            expect(state.stats.capturesSuccessful).toBe(1);
        }

        expect(['captured', 'victory']).toContain(terminalResult);
        expect(encounter.active).toBe(false);
        expect(
            state.stats.capturesSuccessful > 0 ||
            state.stats.battlesWon > 0 ||
            state.stats.totalXpGained > 0 ||
            player.team.length > 1
        ).toBe(true);

        const { SaveLayer } = await installStorageStack(state);
        expect(SaveLayer, 'SaveLayer deve estar disponível via bootstrap global').toBeTruthy();

        const saveResult = SaveLayer.saveActiveGame(state, (gameState) => ({
            version: 1,
            savedAt: '2026-05-18T00:00:00.000Z',
            state: gameState,
        }));
        expect(saveResult.autoSaved).toBe(true);

        const loaded = SaveLayer.loadActiveGame();
        expect(loaded.loaded).toBe(true);

        const continuedState = loaded.state;
        expect(continuedState.players).toHaveLength(1);
        expect(continuedState.players[0].starterMonsterId).toBe('MON_013');
        expect(continuedState.players[0].team[0].templateId).toBe('MON_013');
        expect(continuedState.players[0].team.length).toBe(player.team.length);
        expect(continuedState.stats.captureAttempts).toBe(state.stats.captureAttempts);
        expect(continuedState.stats.capturesSuccessful).toBe(state.stats.capturesSuccessful);
        expect(continuedState.monstrodex.seen).toContain('MON_029');
        expect(continuedState.monstrodex.captured).toContain('MON_029');
        expect(continuedState.currentEncounter.active).toBe(false);
    });

    it('deve falhar validação quando starterMonsterId não corresponde à classe do jogador', () => {
        const state = makeInitialGameState();
        state.players[0].starterMonsterId = 'MON_001';

        const starterValidation = validateStarterConsistency(state);
        expect(starterValidation.ok).toBe(false);
        expect(starterValidation.reason).toBe('starter_metadata_mismatch');
    });

    it('captura falha consome orb e mantém encounter ativo', () => {
        const state = makeInitialGameState();
        const player = state.players[0];
        const starter = player.team[0];
        const encounter = startSmokeWildBattle(state);
        const orbsBeforeCapture = player.inventory.CLASTERORB_COMUM;

        encounter.wildMonster.hp = encounter.wildMonster.hpMax;
        encounter.wildMonster.aggression = 100;

        const captureResult = executeWildCapture({
            encounter,
            player,
            playerMonster: starter,
            orbInfo: {
                id: 'CLASTERORB_COMUM',
                name: 'ClasterOrb Comum',
                emoji: '⚪',
                capture_bonus_pp: 0,
            },
            dependencies: {
                ...makeWildDeps(state),
                // HP cheio + agressividade máxima => score próximo de 0.
                // threshold alto garante falha de captura; rollD20=1 evita derrota no contra-ataque.
                captureThreshold: 95,
                rollD20: () => 1,
            },
        });

        expect(captureResult.success).toBe(true);
        expect(captureResult.captured).toBe(false);
        expect(captureResult.result).toBe('ongoing');
        expect(player.inventory.CLASTERORB_COMUM).toBe(orbsBeforeCapture - 1);
        expect(encounter.active).toBe(true);
    });

    it('com time cheio, captura bem-sucedida envia monstro para box', () => {
        const state = makeInitialGameState();
        const player = state.players[0];
        const encounter = startSmokeWildBattle(state);
        const starter = player.team[0];

        while (player.team.length < state.config.maxTeamSize) {
            player.team.push(
                createMonsterInstanceFromTemplate('MON_001', 3, {
                    instanceId: `mi_smoke_fill_${player.team.length}`,
                    ownerId: player.id,
                })
            );
        }

        encounter.wildMonster.hp = 0;
        encounter.wildMonster.aggression = 0;
        const teamSizeBeforeCapture = player.team.length;
        const boxSizeBeforeCapture = state.sharedBox.length;

        const captureResult = executeWildCapture({
            encounter,
            player,
            playerMonster: starter,
            orbInfo: {
                id: 'CLASTERORB_COMUM',
                name: 'ClasterOrb Comum',
                emoji: '⚪',
                capture_bonus_pp: 0,
            },
            dependencies: {
                ...makeWildDeps(state),
                captureThreshold: 35,
            },
        });

        expect(captureResult.success).toBe(true);
        expect(captureResult.captured).toBe(true);
        expect(player.team.length).toBe(teamSizeBeforeCapture);
        expect(state.sharedBox.length).toBe(boxSizeBeforeCapture + 1);
        expect(state.sharedBox.at(-1).ownerId).toBe(player.id);
        expect(state.sharedBox.at(-1).monster.templateId).toBe('MON_029');
    });

    it('save corrompido aciona fallback seguro no continue', async () => {
        const state = makeInitialGameState();
        const { localStorage, SaveLayer } = await installStorageStack(state);

        localStorage.setItem('monstrinhomon_state', '{ json-inválido');
        const loaded = SaveLayer.loadActiveGame();

        expect(loaded.loaded).toBe(false);
        expect(loaded.state).toBeNull();
        expect(loaded.notes.some(note => note.includes('Corrupted save'))).toBe(true);
        expect(localStorage.getItem('monstrinhomon_corrupted_backup')).toBe('{ json-inválido');
    });

    it('monstro ativo com 0 HP não deve executar ação de ataque', () => {
        const state = makeInitialGameState();
        const player = state.players[0];
        const starter = player.team[0];
        const encounter = startSmokeWildBattle(state);

        starter.hp = 0;
        const attackResult = executeWildAttack({
            encounter,
            player,
            playerMonster: starter,
            d20Roll: 15,
            defenderRoll: 1,
            dependencies: makeWildDeps(state),
        });

        expect(attackResult.success).toBe(false);
        expect(attackResult.reason).toBe('invalid_actor');
    });

    it('wild encounter inválido falha de forma segura', () => {
        const state = makeInitialGameState();
        const player = state.players[0];
        const starter = player.team[0];
        const invalidEncounter = {
            id: 'enc_smoke_invalid',
            type: 'wild',
            active: true,
            log: [],
        };

        const attackResult = executeWildAttack({
            encounter: invalidEncounter,
            player,
            playerMonster: starter,
            d20Roll: 15,
            defenderRoll: 1,
            dependencies: makeWildDeps(state),
        });

        expect(attackResult.success).toBe(false);
        expect(attackResult.reason).toBe('no_encounter');
        expect(invalidEncounter.active).toBe(true);
    });
});
