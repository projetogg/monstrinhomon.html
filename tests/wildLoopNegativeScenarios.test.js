/**
 * WILD LOOP MVP 0.3 — CENÁRIOS NEGATIVOS MÍNIMOS (PR-NEG-WILDLOOP)
 *
 * Complementa o smoke test positivo (tests/wildLoopSmoke.test.js) com falhas
 * essenciais do fluxo Wild Loop, sem Playwright/E2E.
 *
 * Cobertura:
 * - starter errado (classe do monstro ≠ classe do jogador) deve falhar em batalha
 * - captura falha consome orb e mantém encounter ativo
 * - team cheio envia captura para box (via onCaptureSuccess)
 * - save corrompido aciona fallback seguro (backup + loaded=false)
 * - monstro ativo com 0 HP não pode executar ação
 * - wild encounter inválido falha com segurança (sem throw)
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { executeWildAttack, executeWildCapture } from '../js/combat/wildActions.js';
import { STARTER_BY_CLASS } from '../js/data/starters.js';

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

function templateById(templateId) {
    const template = CATALOG.find(m => m.id === templateId);
    expect(template, `Template ${templateId} deve existir no catálogo real`).toBeTruthy();
    return template;
}

function makePlayer(overrides = {}) {
    return {
        id: 'p_neg_1',
        name: 'Jogador Negativo',
        class: 'Mago',
        inventory: { CLASTERORB_COMUM: 2 },
        team: [],
        box: [],
        money: 0,
        ...overrides,
    };
}

function makeMonsterInstance(templateId, overrides = {}) {
    const template = templateById(templateId);
    return {
        templateId: template.id,
        instanceId: overrides.instanceId || `mi_neg_${template.id}_${Math.random().toString(36).slice(2, 8)}`,
        name: template.name,
        class: template.class,
        rarity: template.rarity || 'Comum',
        level: overrides.level ?? 5,
        hpMax: overrides.hpMax ?? 60,
        hp: overrides.hp ?? (overrides.hpMax ?? 60),
        eneMax: overrides.eneMax ?? 20,
        ene: overrides.ene ?? 10,
        atk: overrides.atk ?? 10,
        def: overrides.def ?? 5,
        spd: overrides.spd ?? 10,
        poder: overrides.poder ?? 7,
        aggression: overrides.aggression ?? 60,
        buffs: overrides.buffs ?? [],
        status: overrides.status ?? 'healthy',
        ...overrides,
    };
}

function makeEncounter(wildMonsterOverrides = {}, overrides = {}) {
    const wild = makeMonsterInstance('MON_029', {
        instanceId: 'wild_neg_1',
        hp: 60,
        hpMax: 80,
        aggression: 100,
        ...wildMonsterOverrides,
    });
    return {
        id: 'enc_neg_1',
        type: 'wild',
        active: true,
        selectedPlayerId: 'p_neg_1',
        wildMonster: wild,
        log: [],
        rewardsGranted: false,
        behaviorallyResolved: false,
        ...overrides,
    };
}

function makeWildDeps(overrides = {}) {
    return {
        eneRegenData: ENE_REGEN_BY_CLASS,
        classAdvantages: CLASS_ADVANTAGES,
        getBasicPower: () => 7,
        rollD20: () => 1,
        audio: { playSfx: vi.fn() },
        ui: null,
        tutorialOnAction: vi.fn(),
        updateFriendship: vi.fn(),
        updateMultipleFriendshipEvents: vi.fn(),
        showToast: vi.fn(),
        updateStats: vi.fn(),
        handleVictoryRewards: vi.fn(),
        ...overrides,
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

async function installStorageStack(gameState) {
    vi.resetModules();
    const localStorage = createLocalStorageMock();
    globalThis.localStorage = localStorage;
    globalThis.window = { localStorage, GameState: gameState };
    await import('../js/storage.js');
    await import('../js/saveLayer.js');
    return { localStorage, SaveLayer: globalThis.window.SaveLayer };
}

afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.window;
    delete globalThis.localStorage;
});

describe('Wild Loop MVP 0.3 — cenários negativos essenciais', () => {
    it('starter errado (classe do monstro ≠ classe do jogador) deve falhar ao atacar', () => {
        const player = makePlayer({ class: 'Mago' });
        const wrongStarter = makeMonsterInstance(STARTER_BY_CLASS.Guerreiro.monsterId, {
            instanceId: 'mi_wrong_starter',
        }); // Guerreiro no lugar de Mago

        expect(wrongStarter.class).toBe('Guerreiro');
        expect(player.class).toBe('Mago');

        const encounter = makeEncounter();
        const wildHpBefore = encounter.wildMonster.hp;

        const r = executeWildAttack({
            encounter,
            player,
            playerMonster: wrongStarter,
            d20Roll: 15,
            defenderRoll: 1,
            dependencies: makeWildDeps(),
        });

        expect(r.success).toBe(false);
        expect(r.reason).toBe('class_mismatch');
        expect(encounter.wildMonster.hp).toBe(wildHpBefore);
        expect(encounter.active).toBe(true);
    });

    it('captura falha consome orb e mantém encounter ativo', () => {
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const playerMonster = makeMonsterInstance(STARTER_BY_CLASS[player.class].monsterId, {
            instanceId: 'mi_starter_ok',
        });
        const encounter = makeEncounter({ hp: 80, hpMax: 80, aggression: 100 });

        const orbsBefore = player.inventory.CLASTERORB_COMUM;
        const r = executeWildCapture({
            encounter,
            player,
            playerMonster,
            orbInfo: { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 },
            dependencies: {
                ...makeWildDeps(),
                captureThreshold: 101, // impossível: score máximo é 100
            },
        });

        expect(r.success).toBe(true);
        expect(r.captured).toBe(false);
        expect(r.result).toBe('ongoing');
        expect(player.inventory.CLASTERORB_COMUM).toBe(orbsBefore - 1);
        expect(encounter.active).toBe(true);
    });

    it('team cheio envia captura para box (sharedBox) em sucesso', () => {
        const sharedBox = [];
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 1 }, team: [] });
        const starter = makeMonsterInstance(STARTER_BY_CLASS[player.class].monsterId, { instanceId: 'mi_team_0' });
        player.team.push(starter);

        const encounter = makeEncounter({ hp: 0, aggression: 0 }); // score alto
        const deps = makeWildDeps({
            captureThreshold: 0,
            onCaptureSuccess: (p, monster, log) => {
                const captured = { templateId: monster.templateId, instanceId: 'mi_box_1', class: monster.class };
                if (p.team.length < 1) {
                    p.team.push(captured);
                    log('📦 Capturado entrou no time.');
                } else {
                    sharedBox.push({ ownerId: p.id, monster: captured });
                    log('📦 Capturado foi enviado para a Box.');
                }
            },
        });

        const teamSizeBefore = player.team.length;
        const r = executeWildCapture({
            encounter,
            player,
            playerMonster: starter,
            orbInfo: { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 },
            dependencies: deps,
        });

        expect(r.success).toBe(true);
        expect(r.captured).toBe(true);
        expect(encounter.active).toBe(false);
        expect(player.team.length).toBe(teamSizeBefore);
        expect(sharedBox).toHaveLength(1);
        expect(sharedBox[0].ownerId).toBe(player.id);
        expect(sharedBox[0].monster.templateId).toBe('MON_029');
    });

    it('save corrompido aciona fallback seguro (backup + loaded=false)', async () => {
        const { localStorage, SaveLayer } = await installStorageStack({});
        expect(SaveLayer).toBeTruthy();

        const rawCorrupt = '{not-json';
        localStorage.setItem('monstrinhomon_state', rawCorrupt);

        const loaded = SaveLayer.loadActiveGame();
        expect(loaded.loaded).toBe(false);
        expect(loaded.state).toBe(null);
        expect(localStorage.getItem('monstrinhomon_corrupted_backup')).toBe(rawCorrupt);
        expect(Array.isArray(loaded.notes)).toBe(true);
        expect(loaded.notes.join(' ')).toContain('Corrupted save');
    });

    it('monstro ativo com 0 HP não deve permitir ataque (ação inválida)', () => {
        const player = makePlayer({ class: 'Mago' });
        const starter = makeMonsterInstance(STARTER_BY_CLASS[player.class].monsterId, {
            instanceId: 'mi_fainted',
            hp: 0,
        });
        const encounter = makeEncounter();

        const wildHpBefore = encounter.wildMonster.hp;
        const r = executeWildAttack({
            encounter,
            player,
            playerMonster: starter,
            d20Roll: 15,
            defenderRoll: 1,
            dependencies: makeWildDeps(),
        });

        expect(r.success).toBe(false);
        expect(r.reason).toBe('player_monster_fainted');
        expect(encounter.wildMonster.hp).toBe(wildHpBefore);
        expect(encounter.active).toBe(true);
    });

    it('wild encounter inválido falha de forma segura (sem throw)', () => {
        const player = makePlayer();
        const starter = makeMonsterInstance(STARTER_BY_CLASS[player.class].monsterId);

        expect(() => {
            const r = executeWildAttack({
                encounter: null,
                player,
                playerMonster: starter,
                d20Roll: 15,
                defenderRoll: 1,
                dependencies: makeWildDeps(),
            });
            expect(r.success).toBe(false);
            expect(r.reason).toBe('no_encounter');
        }).not.toThrow();

        expect(() => {
            const r = executeWildCapture({
                encounter: { id: 'enc_invalid', type: 'wild', active: true, log: [] }, // sem wildMonster
                player,
                playerMonster: starter,
                orbInfo: { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 },
                dependencies: { ...makeWildDeps(), captureThreshold: 45 },
            });
            expect(r.success).toBe(false);
            expect(r.result).toBe('no_encounter');
        }).not.toThrow();
    });
});

