/**
 * WILD CAPTURE FLOW TESTS (Modularização Final do Combate Selvagem)
 *
 * Testa o pipeline canônico de captura selvagem via executeWildCapture():
 *
 * - Sucesso de captura (score >= threshold)
 * - Falha de captura com contra-ataque (score < threshold)
 * - Falha de captura + derrota do jogador
 * - Captura sem playerMonster ativo (jogador desmaiado)
 * - d20 crítico/falha no contra-ataque de falha
 * - Orb consumida em ambos os caminhos (sucesso e falha)
 * - updateStats chamado corretamente
 * - onCaptureSuccess callback chamado somente em sucesso
 * - tutorialOnAction("capture") chamado somente em sucesso
 * - encounter.active = false em sucesso e em derrota
 * - encounter.active = true após falha sem derrota (jogo continua)
 * - log registra breakdown de score (Trilha Física, Trilha Comportamental, Orb)
 * - Regressão: processEnemyCounterattack usa classAdvantages injetado (sem global)
 * - Regressão: d20=1 (falha crítica) não causa dano ao jogador
 * - Regressão: d20=20 (crítico) causa mais dano no contra-ataque de falha
 * - Coerência com dual-track: score combina HP e Agressividade (50/50)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    executeWildCapture,
} from '../js/combat/wildActions.js';
import {
    calculateCaptureScore,
} from '../js/combat/wildCore.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Cria um monstrinho selvagem padrão (HP cheio, totalmente agressivo) */
function makeWild(overrides = {}) {
    return {
        id: 'wild_test',
        name: 'Treinomon',
        class: 'Guerreiro',
        rarity: 'Comum',
        hp: 100, hpMax: 100,
        atk: 6, def: 4, poder: 8,
        ene: 0, eneMax: 20,
        aggression: 100,
        buffs: [],
        skill: null, // sem habilidade → sempre ataque básico no contra-ataque
        ...overrides,
    };
}

/** Cria um monstrinho do jogador padrão */
function makePlayerMon(overrides = {}) {
    return {
        id: 'player_mon_test',
        name: 'Starter',
        class: 'Guerreiro',
        rarity: 'Comum',
        hp: 80, hpMax: 80,
        atk: 7, def: 4, poder: 10,
        ene: 10, eneMax: 20,
        buffs: [],
        ...overrides,
    };
}

/** Cria um jogador padrão com 1 orb comum no inventário */
function makePlayer(overrides = {}) {
    return {
        id: 'p1',
        name: 'Jogador',
        class: 'Guerreiro',
        inventory: { CLASTERORB_COMUM: 3 },
        team: [],
        ...overrides,
    };
}

/** Cria um encounter selvagem padrão */
function makeEncounter(wild) {
    return {
        id: 'enc_test',
        type: 'wild',
        active: true,
        wildMonster: wild,
        selectedPlayerId: 'p1',
        log: [],
        rewardsGranted: false,
    };
}

/** Info de uma ClasterOrb comum */
const ORB_COMUM = {
    id: 'CLASTERORB_COMUM',
    name: 'ClasterOrb Comum',
    emoji: '⚪',
    capture_bonus_pp: 0,
};

const ORB_INCOMUM = {
    id: 'CLASTERORB_INCOMUM',
    name: 'ClasterOrb Incomum',
    emoji: '🔵',
    capture_bonus_pp: 10,
};

const ORB_RARA = {
    id: 'CLASTERORB_RARA',
    name: 'ClasterOrb Rara',
    emoji: '🟣',
    capture_bonus_pp: 20,
};

/** Dependências padrão injetáveis (sem globals) */
function makeDeps(overrides = {}) {
    return {
        captureThreshold: 35,        // threshold de Comum
        classAdvantages: {
            Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
        },
        getBasicPower: () => 10,
        rollD20: () => 15,           // acerto normal por padrão
        audio: { playSfx: vi.fn() },
        updateStats: vi.fn(),
        tutorialOnAction: vi.fn(),
        onCaptureSuccess: vi.fn(),
        ...overrides,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1: Sucesso de captura
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCapture — sucesso de captura', () => {

    it('retorna { success: true, captured: true, result: "captured" } quando score >= threshold', () => {
        // HP=0 + aggression=0 → score=100 >> threshold=35
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon();
        const deps = makeDeps();

        const result = executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.success).toBe(true);
        expect(result.captured).toBe(true);
        expect(result.result).toBe('captured');
    });

    it('marca encounter.active = false após captura bem-sucedida', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(enc.active).toBe(false);
    });

    it('NÃO contra-ataca após captura bem-sucedida', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 80 });
        const deps = makeDeps({ rollD20: () => 20 }); // se chamasse, seria crit

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        // HP do jogador não deve ter caído
        expect(playerMon.hp).toBe(80);
    });

    it('chama onCaptureSuccess com (player, monster, logFn)', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.onCaptureSuccess).toHaveBeenCalledOnce();
        const [calledPlayer, calledMonster] = deps.onCaptureSuccess.mock.calls[0];
        expect(calledPlayer).toBe(player);
        expect(calledMonster).toBe(wild);
    });

    it('chama tutorialOnAction("capture") após sucesso', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.tutorialOnAction).toHaveBeenCalledWith('capture');
    });

    it('chama updateStats("captureAttempts", 1) e updateStats("capturesSuccessful", 1)', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.updateStats).toHaveBeenCalledWith('captureAttempts', 1);
        expect(deps.updateStats).toHaveBeenCalledWith('capturesSuccessful', 1);
    });

    it('consome 1 orb do inventário do jogador', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 2 } });
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(player.inventory.CLASTERORB_COMUM).toBe(1);
    });

    it('toca som "capture_ok" no sucesso', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.audio.playSfx).toHaveBeenCalledWith('capture_ok');
    });

    it('seta monster.ownerId = player.id', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer({ id: 'p_hero' });
        const deps = makeDeps();

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(wild.ownerId).toBe('p_hero');
    });

    it('log contém breakdown de score (Trilha Física + Trilha Comportamental + Orb)', () => {
        const wild = makeWild({ hp: 50, hpMax: 100, aggression: 50 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ captureThreshold: 0 }); // garante sucesso com qualquer score

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        const logText = enc.log.join(' ');
        expect(logText).toContain('Trilha Física');
        expect(logText).toContain('Trilha Comportamental');
        expect(logText).toContain('Orb');
    });

    it('orb com bônus maior (incomum) ajuda a capturar raridades mais altas', () => {
        // Raro: threshold alto; com orb rara o score sobe 20pts
        const wild = makeWild({ hp: 30, hpMax: 100, aggression: 60 });
        const enc = makeEncounter(wild);
        const player = makePlayer({ inventory: { CLASTERORB_RARA: 1 } });
        const deps = makeDeps({ captureThreshold: 65 }); // difícil sem orb

        // Score sem orb: HP 70% dano → 35pts; aggression 40% calm → 20pts = 55 < 65
        // Score com orb rara: 55 + 20 = 75 >= 65 → sucesso!
        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_RARA, dependencies: deps });

        expect(result.captured).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: Falha de captura (score < threshold)
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCapture — falha de captura', () => {

    it('retorna { success: true, captured: false, result: "ongoing" } quando score < threshold e jogador sobrevive', () => {
        // selvagem intacto → score=0 < threshold=35
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 }); // inimigo falha d20=1

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.success).toBe(true);
        expect(result.captured).toBe(false);
        expect(result.result).toBe('ongoing');
    });

    it('encounter.active permanece true após falha sem derrota (jogo continua)', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 }); // inimigo falha

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(enc.active).toBe(true);
    });

    it('NÃO chama onCaptureSuccess em falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.onCaptureSuccess).not.toHaveBeenCalled();
    });

    it('NÃO chama tutorialOnAction em falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.tutorialOnAction).not.toHaveBeenCalled();
    });

    it('consome 1 orb mesmo em falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 3 } });
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(player.inventory.CLASTERORB_COMUM).toBe(2);
    });

    it('toca som "capture_fail" em falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.audio.playSfx).toHaveBeenCalledWith('capture_fail');
    });

    it('chama updateStats("captureAttempts", 1) mesmo em falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(deps.updateStats).toHaveBeenCalledWith('captureAttempts', 1);
        expect(deps.updateStats).not.toHaveBeenCalledWith('capturesSuccessful', expect.anything());
    });

    it('log contém "quebrou livre" em falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(enc.log.join(' ')).toContain('quebrou livre');
    });

    it('contra-ataque do inimigo ocorre após falha (se playerMonster vivo)', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 100, def: 1 }); // ataque altíssimo
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 80, def: 1 });
        const deps = makeDeps({ rollD20: () => 15 }); // inimigo acerta

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        // HP do jogador deve ter diminuído (sofreu dano)
        expect(playerMon.hp).toBeLessThan(80);
    });

    it('d20=1 no contra-ataque (falha crítica) não causa dano ao jogador', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 80 });
        const deps = makeDeps({ rollD20: () => 1 }); // falha crítica

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        // d20=1 = falha crítica → sem dano
        expect(playerMon.hp).toBe(80);
    });

    it('NÃO contra-ataca se playerMonster for null', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ rollD20: () => 20 }); // crit se chamado

        // Não deve lançar erro
        expect(() => {
            executeWildCapture({ encounter: enc, player, playerMonster: null, orbInfo: ORB_COMUM, dependencies: deps });
        }).not.toThrow();

        expect(enc.active).toBe(true); // falha sem derrota
    });

    it('NÃO contra-ataca se playerMonster.hp = 0', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 0 }); // já desmaiado
        const deps = makeDeps({ rollD20: () => 20 }); // crit se chamado

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        // Log não deve ter log de contra-ataque
        const logText = enc.log.join(' ');
        expect(logText).not.toContain('contra-ataca');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: Falha de captura + derrota do jogador
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCapture — falha de captura com derrota do jogador', () => {

    it('retorna { captured: false, result: "defeat" } quando jogador é derrotado no contra-ataque', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 999, def: 1 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 1, def: 1 }); // quase morto
        const deps = makeDeps({
            rollD20: () => 20,      // crit para garantir dano máximo
            getBasicPower: () => 100, // poder altíssimo
        });

        const result = executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.captured).toBe(false);
        expect(result.result).toBe('defeat');
    });

    it('encounter.active = false após derrota', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 999, def: 1 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 1, def: 1 });
        const deps = makeDeps({
            rollD20: () => 20,
            getBasicPower: () => 100,
        });

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        expect(enc.active).toBe(false);
    });

    it('encounter.result = "defeat" após derrota', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 999, def: 1 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 1, def: 1 });
        const deps = makeDeps({
            rollD20: () => 20,
            getBasicPower: () => 100,
        });

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        expect(enc.result).toBe('defeat');
    });

    it('playerMonster.status = "fainted" após derrota', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 999, def: 1 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 1, def: 1 });
        const deps = makeDeps({
            rollD20: () => 20,
            getBasicPower: () => 100,
        });

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        expect(playerMon.status).toBe('fainted');
    });

    it('log contém mensagem de derrota após desmaiou', () => {
        const wild = makeWild({ hp: 100, aggression: 100, atk: 999, def: 1 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 1, def: 1 });
        const deps = makeDeps({
            rollD20: () => 20,
            getBasicPower: () => 100,
        });

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        expect(enc.log.join(' ')).toContain('desmaiou');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: Guardas e edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCapture — guardas e edge cases', () => {

    it('retorna no_encounter se encounter.wildMonster for undefined', () => {
        const enc = { log: [], active: true }; // sem wildMonster
        const player = makePlayer();
        const deps = makeDeps();

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.success).toBe(false);
        expect(result.result).toBe('no_encounter');
    });

    it('orb incomum bônus=10 incrementa score', () => {
        const wild = makeWild({ hp: 100, aggression: 100 }); // score base = 0
        const enc = makeEncounter(wild);
        const player = makePlayer({ inventory: { CLASTERORB_INCOMUM: 1 } });
        const deps = makeDeps({
            captureThreshold: 5, // threshold muito baixo para garantir sucesso com bônus
        });

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_INCOMUM, dependencies: deps });

        // score=0 + bônus=10 = 10 >= threshold=5 → sucesso
        expect(result.captured).toBe(true);
    });

    it('captureThreshold muito alto → falha garantida mesmo com HP=0 e aggression=0', () => {
        const wild = makeWild({ hp: 0, aggression: 0 }); // score base = 100
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({
            captureThreshold: 101, // impossível atingir
            rollD20: () => 1,       // inimigo falha (sem dano)
        });

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.captured).toBe(false);
    });

    it('duas tentativas consecutivas consomem 2 orbs', () => {
        const wild1 = makeWild({ hp: 100, aggression: 100 });
        const wild2 = makeWild({ hp: 100, aggression: 100 });
        const enc1 = makeEncounter(wild1);
        const enc2 = makeEncounter(wild2);
        const player = makePlayer({ inventory: { CLASTERORB_COMUM: 3 } });
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildCapture({ encounter: enc1, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });
        executeWildCapture({ encounter: enc2, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(player.inventory.CLASTERORB_COMUM).toBe(1); // 3 - 2 = 1
    });

    it('não lança exceção se audio for undefined', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ audio: undefined });

        expect(() => {
            executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });
        }).not.toThrow();
    });

    it('não lança exceção se tutorialOnAction for undefined', () => {
        const wild = makeWild({ hp: 0, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ tutorialOnAction: undefined });

        expect(() => {
            executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });
        }).not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5: Regressão dual-track (integração com calculateCaptureScore)
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCapture — regressão dual-track', () => {

    it('classes de suporte podem capturar sem reduzir HP (via trilha comportamental)', () => {
        // HP cheio (score físico = 0) + aggression = 0 (score comportamental = 50) = 50 >= 35
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 0 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ captureThreshold: 35 });

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.captured).toBe(true);
    });

    it('classes ofensivas podem capturar somente via trilha física (HP zerado)', () => {
        // HP=0 (score=50) + aggression=100 (score=0) = 50 >= 35
        const wild = makeWild({ hp: 0, hpMax: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ captureThreshold: 35 });

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.captured).toBe(true);
    });

    it('selvagem intacto (HP=100, aggression=100) → score=0 → falha com threshold=35', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDeps({ captureThreshold: 35, rollD20: () => 1 });

        const result = executeWildCapture({ encounter: enc, player, playerMonster: makePlayerMon(), orbInfo: ORB_COMUM, dependencies: deps });

        expect(result.captured).toBe(false);
    });

    it('score é determinístico (mesmas entradas → mesmo resultado)', () => {
        const mon1 = makeWild({ hp: 40, hpMax: 100, aggression: 30 });
        const mon2 = makeWild({ hp: 40, hpMax: 100, aggression: 30 });
        const s1 = calculateCaptureScore(mon1, 0);
        const s2 = calculateCaptureScore(mon2, 0);
        expect(s1).toBe(s2);
    });

    it('ambas trilhas têm peso 50/50 — nenhuma domina', () => {
        const physicalOnly  = calculateCaptureScore({ hp: 0,   hpMax: 100, aggression: 100 }, 0); // só física
        const behavioralOnly = calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 0   }, 0); // só comportamental
        expect(physicalOnly).toBe(behavioralOnly); // ambas = 50
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6: Regressão de pipeline canônico (contra-ataque usa deps, não globals)
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCapture — regressão: contra-ataque usa dependency injection', () => {

    it('classAdvantages é respeitado no contra-ataque (vantagem → mais dano)', () => {
        // Guerreiro ataca Curandeiro → Curandeiro tem vantagem sobre Guerreiro → mais dano
        const wild = makeWild({ hp: 100, aggression: 100, atk: 10, def: 1, class: 'Curandeiro' });
        const enc1 = makeEncounter(makeWild({ hp: 100, aggression: 100, atk: 10, def: 1, class: 'Curandeiro' }));
        const enc2 = makeEncounter(makeWild({ hp: 100, aggression: 100, atk: 10, def: 1, class: 'Curandeiro' }));
        const player = makePlayer();

        // deps1: Curandeiro tem vantagem (strong) sobre Guerreiro → damageMult=1.10
        const deps1 = makeDeps({
            rollD20: () => 15,
            classAdvantages: { Curandeiro: { strong: 'Guerreiro', weak: 'Bardo' } },
        });
        // deps2: sem vantagem (neutro) → damageMult=1.0
        const deps2 = makeDeps({
            rollD20: () => 15,
            classAdvantages: {},
        });

        const mon1 = makePlayerMon({ hp: 80, def: 3, class: 'Guerreiro' });
        const mon2 = makePlayerMon({ hp: 80, def: 3, class: 'Guerreiro' });

        executeWildCapture({ encounter: enc1, player, playerMonster: mon1, orbInfo: ORB_COMUM, dependencies: deps1 });
        executeWildCapture({ encounter: enc2, player: makePlayer(), playerMonster: mon2, orbInfo: ORB_COMUM, dependencies: deps2 });

        // Com vantagem de classe, o dano deve ser maior (HP menor)
        expect(mon1.hp).toBeLessThan(mon2.hp);
    });

    it('rollD20 injetado é usado no contra-ataque de falha', () => {
        const wild = makeWild({ hp: 100, aggression: 100 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const playerMon = makePlayerMon({ hp: 80 });

        let rollCount = 0;
        const deps = makeDeps({
            rollD20: () => {
                rollCount++;
                return 1; // falha crítica
            },
        });

        executeWildCapture({ encounter: enc, player, playerMonster: playerMon, orbInfo: ORB_COMUM, dependencies: deps });

        // rollD20 deve ter sido chamado ao menos 1 vez (contra-ataque)
        expect(rollCount).toBeGreaterThan(0);
        // HP intacto (d20=1 → falha crítica)
        expect(playerMon.hp).toBe(80);
    });
});
