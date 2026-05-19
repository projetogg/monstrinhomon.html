/**
 * WILD LOOP NEGATIVE TEST — cenários de falha do MVP 0.3
 *
 * Complementa wildLoopSmoke.test.js com cenários negativos essenciais.
 * Testa comportamento do sistema quando:
 * - starter errado é usado
 * - captura falha
 * - team está cheio
 * - save está corrompido
 * - monstro com 0 HP tenta agir
 * - encounter inválido
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
        instanceId: overrides.instanceId || `mi_neg_${template.id}_${level}_${Math.random().toString(36).slice(2, 8)}`,
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

function makeInitialGameState(playerClass = 'Mago') {
    const starterInfo = STARTER_BY_CLASS[playerClass];
    expect(starterInfo?.monsterId, `Starter de ${playerClass} deve estar mapeado`).toBeTruthy();

    const player = {
        id: 'player_neg_1',
        name: 'Negative Test',
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
        instanceId: 'mi_neg_starter',
    });
    player.team.push(starter);
    player.starterGranted = true;
    player.starterMonsterId = starterInfo.monsterId;

    return {
        players: [player],
        monsters: [],
        sessions: [{ id: 'sess_neg_1', name: 'Sessão Negative' }],
        currentSession: { id: 'sess_neg_1', name: 'Sessão Negative' },
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

function startWildBattle(state, wildTemplateId = 'MON_029', wildLevel = 3) {
    const player = state.players[0];
    const wild = createMonsterInstanceFromTemplate(wildTemplateId, wildLevel, {
        instanceId: 'wild_neg_test',
        aggression: 20,
        skill: null,
    });

    state.currentEncounter = {
        id: 'enc_neg_wild',
        type: 'wild',
        active: true,
        selectedPlayerId: player.id,
        wildMonster: wild,
        log: ['🧪 Negative Test: Wild battle iniciada.'],
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
        onCaptureSuccess: (player, monster, logFn) => {
            const captured = createMonsterInstanceFromTemplate(monster.templateId, monster.level || 1, {
                instanceId: 'mi_neg_captured',
                ownerId: player.id,
                hp: monster.hp,
                hpMax: monster.hpMax,
                aggression: monster.aggression,
            });
            if (player.team.length < state.config.maxTeamSize) {
                player.team.push(captured);
                logFn(`📦 ${captured.name} entrou no time de ${player.name}.`);
            } else {
                state.sharedBox.push({ ownerId: player.id, monster: captured });
                logFn(`📦 ${captured.name} foi enviado para a Box.`);
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

describe('Negative MVP 0.3 — Cenários de Falha', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete globalThis.window;
        delete globalThis.localStorage;
    });

    describe('Starter incorreto', () => {
        it('deve falhar se jogador usa starter de classe errada', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];

            // Validar que o starter correto foi atribuído
            expect(player.class).toBe('Mago');
            expect(player.starterMonsterId).toBe('MON_013'); // Lagartomon (Mago)
            expect(player.team[0].templateId).toBe('MON_013');
            expect(player.team[0].class).toBe('Mago');

            // Tentar adicionar um starter de Guerreiro (MON_001) manualmente
            const wrongStarter = createMonsterInstanceFromTemplate('MON_001', 5, {
                ownerId: player.id,
                instanceId: 'mi_wrong_starter',
            });

            // Verificar que é de classe diferente
            expect(wrongStarter.class).toBe('Guerreiro');
            expect(wrongStarter.class).not.toBe(player.class);

            // Adicionar ao team
            player.team.push(wrongStarter);

            // Tentar usar o starter errado em batalha
            const encounter = startWildBattle(state);
            const attackResult = executeWildAttack({
                encounter,
                player,
                playerMonster: wrongStarter,
                d20Roll: 15,
                defenderRoll: 1,
                dependencies: makeWildDeps(state),
            });

            expect(attackResult.success).toBe(false);
            expect(attackResult.reason).toBe('class_mismatch');
        });
    });

    describe('Captura falha', () => {
        it('deve consumir orb e manter encontro ativo quando captura falha', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            const encounter = startWildBattle(state);

            // Definir HP alto e agressão alta para garantir falha
            // Score = (1 - hp/hpMax) * 50 + (1 - aggression/100) * 50 + orb_bonus
            // Com hp=hpMax e aggression=100: score = 0 + 0 + 0 = 0
            encounter.wildMonster.hp = encounter.wildMonster.hpMax;
            encounter.wildMonster.aggression = 100;

            const orbsBeforeCapture = player.inventory.CLASTERORB_COMUM;
            const teamSizeBeforeCapture = player.team.length;

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
                    captureThreshold: 35, // Score = 0 < 35, garantido falhar
                },
            });

            // Captura deve falhar
            expect(captureResult.success).toBe(true); // operação executada com sucesso
            expect(captureResult.captured).toBe(false); // mas não capturou

            // Orb deve ter sido consumido
            expect(player.inventory.CLASTERORB_COMUM).toBe(orbsBeforeCapture - 1);

            // Team não deve ter aumentado
            expect(player.team.length).toBe(teamSizeBeforeCapture);

            // Encontro deve continuar ativo se não derrotou
            if (captureResult.result === 'ongoing') {
                expect(encounter.active).toBe(true);
            }

            // Stats devem registrar a tentativa
            expect(state.stats.captureAttempts).toBe(1);
            expect(state.stats.capturesSuccessful).toBe(0);
        });
    });

    describe('Team cheio', () => {
        it('deve enviar captura para box quando team está cheio', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            // Encher o time até o limite (maxTeamSize = 6)
            while (player.team.length < state.config.maxTeamSize) {
                const filler = createMonsterInstanceFromTemplate('MON_013', 3, {
                    ownerId: player.id,
                });
                player.team.push(filler);
            }

            expect(player.team.length).toBe(state.config.maxTeamSize);

            const encounter = startWildBattle(state);

            // Definir HP baixo e agressão baixa para garantir sucesso
            // Score = (1 - 1/100) * 50 + (1 - 0/100) * 50 + 0 = 49.5 + 50 = ~99
            encounter.wildMonster.hp = 1;
            encounter.wildMonster.aggression = 0;

            const sharedBoxSizeBefore = state.sharedBox.length;

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
                    captureThreshold: 35, // Score ~99 > 35, garantido sucesso
                },
            });

            // Captura deve ter sucesso
            expect(captureResult.success).toBe(true);
            expect(captureResult.captured).toBe(true);

            // Team não deve ter aumentado (já está cheio)
            expect(player.team.length).toBe(state.config.maxTeamSize);

            // Box deve ter aumentado
            expect(state.sharedBox.length).toBe(sharedBoxSizeBefore + 1);

            // Verificar que o monstro está na box
            const boxEntry = state.sharedBox[state.sharedBox.length - 1];
            expect(boxEntry.ownerId).toBe(player.id);
            expect(boxEntry.monster.templateId).toBe(encounter.wildMonster.templateId);
        });
    });

    describe('Save corrompido', () => {
        it('deve acionar fallback seguro quando save está corrompido', async () => {
            const state = makeInitialGameState('Mago');
            const { SaveLayer, localStorage } = await installStorageStack(state);

            // Salvar um estado válido primeiro
            const saveResult = SaveLayer.saveActiveGame(state, (gameState) => ({
                version: 1,
                savedAt: '2026-05-18T00:00:00.000Z',
                state: gameState,
            }));
            expect(saveResult.autoSaved).toBe(true);

            // Corromper o save manualmente
            const corruptedData = '{"invalid": "json", unclosed:';
            localStorage.setItem('monstrinhomon_state', corruptedData);

            // Tentar carregar
            const loadResult = SaveLayer.loadActiveGame();

            // Deve falhar graciosamente
            expect(loadResult.loaded).toBe(false);
            expect(loadResult.state).toBeFalsy();
        });

        it('deve lidar com save vazio', async () => {
            const state = makeInitialGameState('Mago');
            const { SaveLayer, localStorage } = await installStorageStack(state);

            // Garantir que não há save
            localStorage.clear();

            // Tentar carregar
            const loadResult = SaveLayer.loadActiveGame();

            // Deve retornar indicação de não carregado
            expect(loadResult.loaded).toBe(false);
        });
    });

    describe('Monstro com 0 HP', () => {
        it('não deve permitir ataque quando monstro do jogador tem 0 HP', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            // Definir HP do starter para 0
            starter.hp = 0;

            const encounter = startWildBattle(state);

            const attackResult = executeWildAttack({
                encounter,
                player,
                playerMonster: starter,
                d20Roll: 15,
                defenderRoll: 1,
                dependencies: makeWildDeps(state),
            });

            expect(starter.hp).toBe(0);
            expect(attackResult.success).toBe(false);
            expect(attackResult.reason).toBe('player_monster_fainted');
        });
    });

    describe('Encounter inválido', () => {
        it('deve falhar de forma segura quando encounter não existe', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            // Não criar encounter (deixar null)
            state.currentEncounter = null;

            const attackResult = executeWildAttack({
                encounter: state.currentEncounter,
                player,
                playerMonster: starter,
                d20Roll: 15,
                defenderRoll: 1,
                dependencies: makeWildDeps(state),
            });

            // Deve retornar sucesso=false com reason apropriado
            expect(attackResult.success).toBe(false);
            expect(attackResult.reason).toBe('no_encounter');
        });

        it('deve falhar de forma segura quando wildMonster não existe', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            // Criar encounter mas sem wildMonster
            state.currentEncounter = {
                id: 'enc_invalid',
                type: 'wild',
                active: true,
                selectedPlayerId: player.id,
                wildMonster: null, // null em vez de objeto
                log: [],
            };

            const attackResult = executeWildAttack({
                encounter: state.currentEncounter,
                player,
                playerMonster: starter,
                d20Roll: 15,
                defenderRoll: 1,
                dependencies: makeWildDeps(state),
            });

            // Deve retornar sucesso=false
            expect(attackResult.success).toBe(false);
            expect(attackResult.reason).toBe('no_encounter');
        });

        it('deve falhar captura quando encounter não existe', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            const captureResult = executeWildCapture({
                encounter: null,
                player,
                playerMonster: starter,
                orbInfo: {
                    id: 'CLASTERORB_COMUM',
                    name: 'ClasterOrb Comum',
                    emoji: '⚪',
                    capture_bonus_pp: 0,
                },
                dependencies: makeWildDeps(state),
            });

            // Deve retornar sucesso=false
            expect(captureResult.success).toBe(false);
            expect(captureResult.captured).toBe(false);
            expect(captureResult.result).toBe('no_encounter');
        });
    });

    describe('Inventário vazio', () => {
        it('deve bloquear captura quando não há orb disponível', () => {
            const state = makeInitialGameState('Mago');
            const player = state.players[0];
            const starter = player.team[0];

            const encounter = startWildBattle(state);

            // Zerar orbs
            player.inventory.CLASTERORB_COMUM = 0;

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

            expect(player.inventory.CLASTERORB_COMUM).toBe(0);
            expect(captureResult.success).toBe(false);
            expect(captureResult.captured).toBe(false);
            expect(captureResult.result).toBe('invalid');
            expect(captureResult.reason).toBe('no_capture_item');
        });
    });
});
