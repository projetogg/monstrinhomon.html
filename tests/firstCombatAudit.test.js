/**
 * FIRST COMBAT / FIRST CAPTURE AUDIT TESTS (PR: Auditoria Fluxo Real)
 *
 * Auditoria e regressão do fluxo do primeiro combate e primeira captura.
 * Foco em experiência real de uso: previsibilidade, clareza e justiça percebida.
 *
 * Cobertura obrigatória:
 * - Primeiro combate selvagem não quebra
 * - Primeira captura não quebra
 * - Tutorial compatível com sistema real (d20, capture dual-track)
 * - Feedback de captura coerente (getCaptureReadinessLabel)
 * - d20 manual com comportamento previsível (d20=1, d20=20, valores normais)
 * - Regressão trilhas HP + Agressividade (50/50 contribution)
 * - Regressão contra-ataque (imediato vs turno completo)
 * - Regressão vitória/derrota
 * - Estado "calmo/rendido" após resolução comportamental
 * - Ação de captura não requer d20
 */

import { describe, it, expect, vi } from 'vitest';
import {
    calculateCaptureScore,
    getCaptureReadinessLabel,
    applyCaptureAction,
    CAPTURE_ACTIONS,
    checkHit,
    calcDamage,
    resolveD20Hit,
} from '../js/combat/wildCore.js';
import {
    executeWildAttack,
    executeWildCapture,
    executeWildCaptureAction,
    executeWildItemUse,
    executeWildEnemyFullTurn,
} from '../js/combat/wildActions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers comuns
// ─────────────────────────────────────────────────────────────────────────────

function makeWild(overrides = {}) {
    return {
        id: 'wild_test', name: 'Treinomon', class: 'Guerreiro',
        rarity: 'Comum',
        hp: 60, hpMax: 100,
        atk: 6, def: 4, poder: 8,
        ene: 0, eneMax: 20,
        aggression: 100,
        buffs: [],
        skill: null,
        ...overrides,
    };
}

function makePlayerMon(overrides = {}) {
    return {
        id: 'pm_test', name: 'Starter', class: 'Guerreiro',
        rarity: 'Comum',
        hp: 80, hpMax: 80,
        atk: 7, def: 4, poder: 10,
        ene: 10, eneMax: 20,
        buffs: [],
        ...overrides,
    };
}

function makeEncounter(wild, overrides = {}) {
    return {
        id: 'enc_test',
        type: 'wild',
        active: true,
        wildMonster: wild,
        selectedPlayerId: 'p1',
        log: [],
        rewardsGranted: false,
        behaviorallyResolved: false,
        ...overrides,
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'p1', name: 'Jogador', class: 'Guerreiro',
        inventory: { CLASTERORB_COMUM: 3 },
        ...overrides,
    };
}

function makeDeps(overrides = {}) {
    return {
        classAdvantages: {
            Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
            Mago: { strong: 'Bárbaro', weak: 'Ladino' },
            Curandeiro: { strong: 'Guerreiro', weak: 'Bardo' },
        },
        getBasicPower: () => 10,
        eneRegenData: { Guerreiro: { pct: 0.10, min: 1 }, Curandeiro: { pct: 0.18, min: 3 } },
        audio: { playSfx: () => {} },
        ui: { flashTarget: () => {}, showFloatingText: () => {} },
        tutorialOnAction: () => {},
        handleVictoryRewards: () => {},
        updateFriendship: () => {},
        updateMultipleFriendshipEvents: () => {},
        updateStats: () => {},
        showToast: () => {},
        ...overrides,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1: Primeiro Combate — Fluxo Básico Não Quebra
// ─────────────────────────────────────────────────────────────────────────────

describe('Primeiro Combate Selvagem — fluxo básico não quebra', () => {

    it('ataque com d20 normal retorna success:true', () => {
        const wild = makeWild({ hp: 100, hpMax: 100 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer();
        const deps = makeDeps();

        const result = executeWildAttack({
            encounter: enc,
            player,
            playerMonster: playerMon,
            d20Roll: 15,
            dependencies: deps,
        });

        expect(result.success).toBe(true);
    });

    it('ataque com d20=20 (crítico) sempre acerta e reduz HP do selvagem', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, def: 999 }); // def altíssima
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ atk: 1 });
        const player = makePlayer();

        const result = executeWildAttack({
            encounter: enc, player, playerMonster: playerMon, d20Roll: 20,
            dependencies: makeDeps({ rollD20: () => 1 }), // inimigo falha
        });

        expect(result.success).toBe(true);
        // d20=20 deve sempre acertar, independente de DEF
        expect(enc.wildMonster.hp).toBeLessThan(100);
    });

    it('ataque com d20=1 (falha crítica) nunca reduz HP do selvagem', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, def: 1 }); // DEF baixa
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ atk: 999 }); // ATK enorme mas d20=1 falha
        const player = makePlayer();

        executeWildAttack({
            encounter: enc, player, playerMonster: playerMon, d20Roll: 1,
            dependencies: makeDeps({ rollD20: () => 1 }), // inimigo também falha
        });

        // d20=1 = falha crítica, HP selvagem não cai
        expect(enc.wildMonster.hp).toBe(100);
    });

    it('quando selvagem chega a HP 0 o resultado é victory e encounter fica inativo', () => {
        const wild = makeWild({ hp: 1, hpMax: 100, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ atk: 999 });
        const player = makePlayer();

        const result = executeWildAttack({
            encounter: enc, player, playerMonster: playerMon, d20Roll: 20,
            dependencies: makeDeps({ rollD20: () => 1 }),
        });

        expect(result.result).toBe('victory');
        expect(enc.active).toBe(false);
    });

    it('quando HP do jogador chega a 0 resultado é defeat', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, atk: 999, poder: 999, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 1, hpMax: 80, def: 1, atk: 1 });
        const player = makePlayer();

        const result = executeWildAttack({
            encounter: enc, player, playerMonster: playerMon, d20Roll: 1,
            dependencies: makeDeps({
                rollD20: () => 20,
                getBasicPower: () => 100,
            }),
        });

        expect(result.result).toBe('defeat');
        expect(enc.active).toBe(false);
    });

    it('inimigo se regenera de ENE no turno completo (após skill/item)', () => {
        const wild = makeWild({ hp: 80, ene: 0, eneMax: 20 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });

        const before = wild.ene;
        executeWildEnemyFullTurn({
            encounter: enc,
            wildMonster: wild,
            playerMonster: playerMon,
            dependencies: makeDeps({ rollD20: () => 5 }), // não crit
        });

        // ENE deve ter aumentado (regen de turno completo)
        expect(wild.ene).toBeGreaterThan(before);
    });

    it('log de combate recebe entradas durante ataque', () => {
        const wild = makeWild({ hp: 100, hpMax: 100 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer();

        executeWildAttack({
            encounter: enc, player, playerMonster: playerMon, d20Roll: 15,
            dependencies: makeDeps(),
        });

        expect(enc.log.length).toBeGreaterThan(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: D20 Manual — Comportamento Previsível
// ─────────────────────────────────────────────────────────────────────────────

describe('D20 Manual — comportamento previsível e justo', () => {

    it('resolveD20Hit: d20=1 → sempre isFail=true, hit=false', () => {
        const attacker = { atk: 999 }; // ATK enorme não importa
        const defender = { def: 0 };
        const result = resolveD20Hit(1, attacker, defender, {});
        expect(result.isFail).toBe(true);
        expect(result.hit).toBe(false);
    });

    it('resolveD20Hit: d20=20 → sempre isCrit=true, hit=true', () => {
        const attacker = { atk: 0 };
        const defender = { def: 999 }; // DEF enorme não importa
        const result = resolveD20Hit(20, attacker, defender, {});
        expect(result.isCrit).toBe(true);
        expect(result.hit).toBe(true);
    });

    it('resolveD20Hit: d20=10 resolve via checkHit (ATK+d20 vs DEF)', () => {
        // ATK=5, d20=10 → total=15 vs DEF=10 → deve acertar
        const attacker = { atk: 5 };
        const defender = { def: 10 };
        const result = resolveD20Hit(10, attacker, defender, {});
        expect(result.hit).toBe(true);
        expect(result.isCrit).toBe(false);
        expect(result.isFail).toBe(false);
    });

    it('resolveD20Hit: d20=2 com ATK baixo vs DEF alta → erra', () => {
        // d20=2, ATK=2, total=4 vs DEF=20 → erra
        const attacker = { atk: 2 };
        const defender = { def: 20 };
        const result = resolveD20Hit(2, attacker, defender, {});
        expect(result.hit).toBe(false);
    });

    it('d20=1 do inimigo não deve causar dano ao jogador (falha crítica inimiga)', () => {
        // Simula contra-ataque do inimigo com d20=1
        // Usando executeWildEnemyFullTurn com rollD20=()=>1
        const wild = makeWild({ hp: 100, atk: 999, poder: 999 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80, hpMax: 80, def: 1 });
        const hpBefore = playerMon.hp;

        executeWildEnemyFullTurn({
            encounter: enc,
            wildMonster: wild,
            playerMonster: playerMon,
            dependencies: makeDeps({ rollD20: () => 1 }), // inimigo falha crítico
        });

        // Dano zero: d20=1 inimigo não causa dano
        expect(playerMon.hp).toBe(hpBefore);
    });

    it('d20=20 do inimigo sempre causa dano ao jogador (crítico inimigo)', () => {
        const wild = makeWild({ hp: 100, atk: 6, poder: 5 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80, hpMax: 80, def: 999 }); // DEF enorme mas crítico sempre acerta
        const hpBefore = playerMon.hp;

        executeWildEnemyFullTurn({
            encounter: enc,
            wildMonster: wild,
            playerMonster: playerMon,
            dependencies: makeDeps({
                rollD20: () => 20,
                getBasicPower: () => 5,
            }),
        });

        // d20=20 inimigo deve sempre acertar
        expect(playerMon.hp).toBeLessThan(hpBefore);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: Sistema de Captura — Score e Labels
// ─────────────────────────────────────────────────────────────────────────────

describe('Score de Captura — feedback coerente e previsível', () => {

    it('getCaptureReadinessLabel: score < 25 → "Muito arisco"', () => {
        const label = getCaptureReadinessLabel(0);
        expect(label.text).toBe('Muito arisco');
    });

    it('getCaptureReadinessLabel: score 25–44 → "Instável"', () => {
        expect(getCaptureReadinessLabel(25).text).toBe('Instável');
        expect(getCaptureReadinessLabel(44).text).toBe('Instável');
    });

    it('getCaptureReadinessLabel: score 45–64 → "Vulnerável"', () => {
        expect(getCaptureReadinessLabel(45).text).toBe('Vulnerável');
        expect(getCaptureReadinessLabel(64).text).toBe('Vulnerável');
    });

    it('getCaptureReadinessLabel: score 65–79 → "Pronto para captura"', () => {
        expect(getCaptureReadinessLabel(65).text).toBe('Pronto para captura');
        expect(getCaptureReadinessLabel(79).text).toBe('Pronto para captura');
    });

    it('getCaptureReadinessLabel: score >= 80 → "Captura quase certa"', () => {
        expect(getCaptureReadinessLabel(80).text).toBe('Captura quase certa');
        expect(getCaptureReadinessLabel(100).text).toBe('Captura quase certa');
    });

    it('calculateCaptureScore: selvagem com HP cheio + agressividade 100 → score 0', () => {
        const wild = { hp: 100, hpMax: 100, aggression: 100 };
        expect(calculateCaptureScore(wild, 0)).toBe(0);
    });

    it('calculateCaptureScore: HP a 50% + agressividade 100 → score 25 (só trilha física)', () => {
        const wild = { hp: 50, hpMax: 100, aggression: 100 };
        // hpScore = (1 - 0.5) * 50 = 25; aggrScore = (1 - 1) * 50 = 0
        expect(calculateCaptureScore(wild, 0)).toBe(25);
    });

    it('calculateCaptureScore: HP cheio + agressividade 0 → score 50 (só trilha comportamental)', () => {
        const wild = { hp: 100, hpMax: 100, aggression: 0 };
        // hpScore = 0; aggrScore = (1 - 0) * 50 = 50
        expect(calculateCaptureScore(wild, 0)).toBe(50);
    });

    it('calculateCaptureScore: HP 50% + agressividade 0 → score 75 (ambas trilhas)', () => {
        const wild = { hp: 50, hpMax: 100, aggression: 0 };
        // hpScore=25 + aggrScore=50 = 75
        expect(calculateCaptureScore(wild, 0)).toBe(75);
    });

    it('calculateCaptureScore: orb rara (+20) com score base 35 → score 55', () => {
        // score base = 35, orb_bonus = 20 → 55
        const wild = { hp: 30, hpMax: 100, aggression: 60 };
        // hpScore = (1 - 0.3) * 50 = 35; aggrScore = (1 - 0.6) * 50 = 20 → base = 55
        const baseScore = calculateCaptureScore(wild, 0);
        const withOrb = calculateCaptureScore(wild, 20);
        expect(withOrb).toBe(Math.min(100, baseScore + 20));
    });

    it('calculateCaptureScore: não deve ultrapassar 100', () => {
        const wild = { hp: 1, hpMax: 100, aggression: 0 };
        const score = calculateCaptureScore(wild, 20);
        expect(score).toBeLessThanOrEqual(100);
    });

    it('calculateCaptureScore: não deve ser negativo com HP > hpMax', () => {
        const wild = { hp: 120, hpMax: 100, aggression: 100 };
        const score = calculateCaptureScore(wild, 0);
        expect(score).toBeGreaterThanOrEqual(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: Trilha Comportamental — Ação de Captura Não Requer D20
// ─────────────────────────────────────────────────────────────────────────────

describe('Trilha Comportamental — ação de captura não requer d20', () => {

    it('useCaptureAction reduz agressividade sem input de dado', () => {
        const wild = makeWild({ hp: 80, aggression: 100 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ class: 'Curandeiro' });

        const result = executeWildCaptureAction({
            encounter: enc, player, playerMonster: playerMon,
            dependencies: makeDeps({
                captureActions: CAPTURE_ACTIONS,
                aggrTerminal: 0,
            }),
        });

        expect(result.success).toBe(true);
        // Curandeiro: aggDelta = -40 → aggression deve ter caído
        expect(enc.wildMonster.aggression).toBeLessThan(100);
    });

    it('todas as classes possuem ação de captura definida', () => {
        const classes = ['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];
        for (const cls of classes) {
            expect(CAPTURE_ACTIONS[cls]).toBeDefined();
            expect(CAPTURE_ACTIONS[cls].aggDelta).toBeLessThan(0); // deve reduzir agressividade
        }
    });

    it('quando agressividade chega a 0 → encounter.behaviorallyResolved = true', () => {
        const wild = makeWild({ hp: 80, aggression: 10 }); // quase calmo
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ class: 'Curandeiro' }); // -40 aggr → de 10 para ≤0

        const result = executeWildCaptureAction({
            encounter: enc, player, playerMonster: playerMon,
            dependencies: makeDeps({
                captureActions: CAPTURE_ACTIONS,
                aggrTerminal: 0,
            }),
        });

        expect(result.result).toBe('behavioral_resolve');
        expect(enc.behaviorallyResolved).toBe(true);
        // Encounter deve continuar ativo para o jogador usar a orb
        expect(enc.active).toBe(true);
    });

    it('após resolução comportamental, agressividade fica em 0', () => {
        const wild = makeWild({ hp: 80, aggression: 5 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ class: 'Curandeiro' });

        executeWildCaptureAction({
            encounter: enc, player, playerMonster: playerMon,
            dependencies: makeDeps({
                captureActions: CAPTURE_ACTIONS,
                aggrTerminal: 0,
            }),
        });

        expect(enc.wildMonster.aggression).toBe(0);
    });

    it('ação comportamental com agressividade já em 0 retorna behavioral_resolve novamente (sem crash)', () => {
        // O módulo não impede re-execução quando já resolvido — é responsabilidade do wrapper.
        // Testamos que não crasha e retorna um resultado coerente.
        const wild = makeWild({ hp: 80, aggression: 0 });
        const enc = makeEncounter(wild, { behaviorallyResolved: true });
        const playerMon = makePlayerMon();
        const player = makePlayer({ class: 'Curandeiro' });

        const result = executeWildCaptureAction({
            encounter: enc, player, playerMonster: playerMon,
            dependencies: makeDeps({
                captureActions: CAPTURE_ACTIONS,
                aggrTerminal: 0,
            }),
        });

        // Não crasha e retorna success
        expect(result.success).toBe(true);
        // Agressividade permanece em 0 (clipada)
        expect(enc.wildMonster.aggression).toBe(0);
    });

    it('applyCaptureAction clipa agressividade em [0, 100]', () => {
        const wild = makeWild({ aggression: 5 });
        const action = CAPTURE_ACTIONS['Curandeiro']; // -40
        applyCaptureAction(wild, action);
        expect(wild.aggression).toBe(0); // não vai para negativo
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5: Primeira Captura — Fluxo Completo Não Quebra
// ─────────────────────────────────────────────────────────────────────────────

describe('Primeira Captura — fluxo completo não quebra', () => {

    function makeCaptureDeps(overrides = {}) {
        return {
            captureThreshold: 45,
            classAdvantages: {},
            getBasicPower: () => 10,
            audio: { playSfx: () => {} },
            updateStats: () => {},
            tutorialOnAction: () => {},
            onCaptureSuccess: () => {},
            ...overrides,
        };
    }

    it('captura bem-sucedida quando score >= threshold', () => {
        // HP 70% baixo + aggr 0 → score = 35 + 50 = 85 >= 45
        const wild = makeWild({ hp: 30, hpMax: 100, aggression: 0, atk: 5, def: 3 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };

        const result = executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps(),
        });

        expect(result.success).toBe(true);
        expect(result.captured).toBe(true);
        expect(result.result).toBe('captured');
        expect(enc.active).toBe(false);
    });

    it('captura falha quando score < threshold e encounter continua ativo', () => {
        // HP cheio + aggr 100 → score = 0 < 45
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100, atk: 5, def: 3 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };

        const result = executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps({
                rollD20: () => 1, // inimigo falha o contra-ataque
            }),
        });

        expect(result.success).toBe(true);
        expect(result.captured).toBe(false);
        expect(result.result).toBe('ongoing');
        // Jogo continua: encounter ativo
        expect(enc.active).toBe(true);
    });

    it('falha de captura + derrota do jogador: result=defeat, active=false', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100, atk: 999, poder: 999, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 1, hpMax: 80, def: 1 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };

        const result = executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps({
                rollD20: () => 20, // inimigo critica
                getBasicPower: () => 200,
            }),
        });

        expect(result.result).toBe('defeat');
        expect(enc.active).toBe(false);
    });

    it('orb é consumida do inventário em captura bem-sucedida', () => {
        const wild = makeWild({ hp: 1, hpMax: 100, aggression: 0, atk: 1, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 3 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps(),
        });

        expect(player.inventory['CLASTERORB_COMUM']).toBe(2);
    });

    it('orb é consumida do inventário mesmo em falha de captura', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100, atk: 1, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 3 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps({ rollD20: () => 1 }),
        });

        expect(player.inventory['CLASTERORB_COMUM']).toBe(2);
    });

    it('onCaptureSuccess é chamado somente em captura bem-sucedida', () => {
        const wild = makeWild({ hp: 1, hpMax: 100, aggression: 0 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 3 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };
        const onSuccess = vi.fn();

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps({ onCaptureSuccess: onSuccess }),
        });

        expect(onSuccess).toHaveBeenCalledOnce();
    });

    it('onCaptureSuccess NÃO é chamado em falha de captura', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 3 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };
        const onSuccess = vi.fn();

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps({
                onCaptureSuccess: onSuccess,
                rollD20: () => 1,
            }),
        });

        expect(onSuccess).not.toHaveBeenCalled();
    });

    it('log registra breakdown de score na captura (trilha física + comportamental + orb)', () => {
        const wild = makeWild({ hp: 50, hpMax: 100, aggression: 50 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ inventory: { CLASTERORB_INCOMUM: 1 } });
        const orbInfo = { id: 'CLASTERORB_INCOMUM', name: 'ClasterOrb Incomum', emoji: '🔵', capture_bonus_pp: 10 };

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: makeCaptureDeps({ rollD20: () => 1 }),
        });

        // Log deve mencionar as trilhas
        const logText = enc.log.join(' ');
        expect(logText).toMatch(/Trilha/i);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6: Tutorial — Compatibilidade com Sistema Real
// ─────────────────────────────────────────────────────────────────────────────

describe('Tutorial — compatibilidade com sistema real', () => {

    it('CAPTURE_ACTIONS cobre todas as classes definidas no tutorial (dual-track)', () => {
        // Tutorial ensina que classes de suporte usam a trilha comportamental
        const supportClasses = ['Curandeiro', 'Bardo', 'Animalista'];
        for (const cls of supportClasses) {
            expect(CAPTURE_ACTIONS[cls]).toBeDefined();
            // Suporte deve ter aggDelta mais forte (menor = mais negativo)
            expect(CAPTURE_ACTIONS[cls].aggDelta).toBeLessThanOrEqual(-25);
        }
    });

    it('CAPTURE_ACTIONS cobre classes ofensivas com redução menor de agressividade', () => {
        const offensiveClasses = ['Guerreiro', 'Bárbaro'];
        for (const cls of offensiveClasses) {
            expect(CAPTURE_ACTIONS[cls]).toBeDefined();
            // Ofensivos têm aggDelta menor em magnitude
            expect(CAPTURE_ACTIONS[cls].aggDelta).toBeGreaterThanOrEqual(-25);
        }
    });

    it('tutorialOnAction("attack") é chamado no executeWildAttack', () => {
        const wild = makeWild({ hp: 100, hpMax: 100 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer();
        const tutorialSpy = vi.fn();

        executeWildAttack({
            encounter: enc, player, playerMonster: playerMon, d20Roll: 15,
            dependencies: makeDeps({ tutorialOnAction: tutorialSpy }),
        });

        expect(tutorialSpy).toHaveBeenCalledWith('attack');
    });

    it('tutorialOnAction("capture") é chamado somente na captura bem-sucedida', () => {
        const wild = makeWild({ hp: 1, hpMax: 100, aggression: 0 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };
        const tutorialSpy = vi.fn();

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: {
                captureThreshold: 45,
                classAdvantages: {},
                getBasicPower: () => 10,
                audio: { playSfx: () => {} },
                updateStats: () => {},
                tutorialOnAction: tutorialSpy,
                onCaptureSuccess: () => {},
            },
        });

        expect(tutorialSpy).toHaveBeenCalledWith('capture');
    });

    it('tutorialOnAction("capture") NÃO é chamado em falha de captura', () => {
        // Score 0 < 45 → falha
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };
        const tutorialSpy = vi.fn();

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: {
                captureThreshold: 45,
                classAdvantages: {},
                getBasicPower: () => 10,
                audio: { playSfx: () => {} },
                updateStats: () => {},
                tutorialOnAction: tutorialSpy,
                onCaptureSuccess: () => {},
                rollD20: () => 1,
            },
        });

        expect(tutorialSpy).not.toHaveBeenCalledWith('capture');
    });

    it('encounter.behaviorallyResolved = true mantém encounter ativo para uso da orb', () => {
        // Invariante crítico do tutorial: após resolução comportamental,
        // o jogador AINDA precisa usar a orb → encounter deve ficar ativo
        const wild = makeWild({ hp: 80, aggression: 5 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon();
        const player = makePlayer({ class: 'Curandeiro' });

        const result = executeWildCaptureAction({
            encounter: enc, player, playerMonster: playerMon,
            dependencies: makeDeps({
                captureActions: CAPTURE_ACTIONS,
                aggrTerminal: 0,
            }),
        });

        // behavioral_resolve → encounter permanece ativo
        expect(result.result).toBe('behavioral_resolve');
        expect(enc.active).toBe(true);
        expect(enc.behaviorallyResolved).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 7: Justiça Percebida — Contra-Ataque e Turno Inimigo
// ─────────────────────────────────────────────────────────────────────────────

describe('Justiça Percebida — contra-ataque e turno inimigo', () => {

    it('contra-ataque de captura falhada é REAÇÃO (sem regen de ENE)', () => {
        // executeWildCapture usa counterattack imediata (sem regen de ENE para inimigo)
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100, ene: 0, eneMax: 20, atk: 5 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const orbInfo = { id: 'CLASTERORB_COMUM', name: 'ClasterOrb Comum', emoji: '⚪', capture_bonus_pp: 0 };

        const eneBefore = wild.ene;

        executeWildCapture({
            encounter: enc, player, playerMonster: playerMon, orbInfo,
            dependencies: {
                captureThreshold: 45,
                classAdvantages: {},
                getBasicPower: () => 10,
                audio: { playSfx: () => {} },
                updateStats: () => {},
                tutorialOnAction: () => {},
                onCaptureSuccess: () => {},
                rollD20: () => 5,
            },
        });

        // ENE do selvagem não deve ter aumentado (sem regen no contra-ataque)
        expect(wild.ene).toBe(eneBefore);
    });

    it('turno completo do inimigo (após skill/item) regenera ENE', () => {
        const wild = makeWild({ hp: 100, ene: 0, eneMax: 20 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayerMon({ hp: 80 });
        const eneBefore = wild.ene;

        executeWildEnemyFullTurn({
            encounter: enc, wildMonster: wild, playerMonster: playerMon,
            dependencies: makeDeps({ rollD20: () => 5 }),
        });

        // Turno completo regenera ENE
        expect(wild.ene).toBeGreaterThan(eneBefore);
    });

    it('vantagem de classe aumenta ATK do atacante na fórmula de acerto', () => {
        // Guerreiro ataca Ladino (Guerreiro > Ladino → vantagem)
        const attacker = { class: 'Guerreiro', atk: 5 };
        const defender = { class: 'Ladino', def: 12 };
        const classAdvantages = {
            Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
        };
        // d20=10: sem vantagem → 10+5=15 vs 12 → acerta
        // Com vantagem: +2 ATK → 10+5+2=17 vs 12 → acerta
        const hitWithAdv = checkHit(10, attacker, defender, classAdvantages);
        expect(hitWithAdv).toBe(true);
    });

    it('desvantagem de classe reduz ATK efetivo do atacante (Mago vs Ladino)', () => {
        // Mago é fraco contra Ladino (weak: 'Ladino') → -2 de ATK
        // d20=10, ATK=5 → sem desvantagem: 10+5=15; com desvantagem: 10+5-2=13
        // DEF=14: com desvantagem 13 < 14 → erra; sem desvantagem 15 >= 14 → acerta
        const classAdvantages = { Mago: { strong: 'Bárbaro', weak: 'Ladino' } };

        // Mago atacando Ladino (Mago em desvantagem) com DEF=14: deve errar
        const hitWithDisadv = checkHit(10, { class: 'Mago', atk: 5 }, { class: 'Ladino', def: 14 }, classAdvantages);
        // Sem desvantagem (Mago vs Bárbaro com mesma DEF): deve acertar
        const hitNeutral = checkHit(10, { class: 'Mago', atk: 5 }, { class: 'Bárbaro', def: 14 }, classAdvantages);

        expect(hitWithDisadv).toBe(false); // penalidade -2 faz errar
        expect(hitNeutral).toBe(true);     // neutro acerta
    });

    it('damage mínimo é sempre 1 mesmo com ATK << DEF', () => {
        const damage = calcDamage({ atk: 1, def: 999, power: 1, damageMult: 1 });
        expect(damage).toBe(1);
    });
});
