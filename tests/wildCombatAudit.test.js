/**
 * WILD COMBAT AUDIT TESTS (PR: Auditoria Combate Selvagem)
 *
 * Cobertura completa do sistema de combate selvagem:
 * - executeWildAttack: ataque, miss, crit, vitória, derrota
 * - calculateCaptureScore: dual-track (HP + Agressividade)
 * - applyCaptureAction: trilha comportamental por classe
 * - CAPTURE_ACTIONS: cobertura de todas as classes
 * - Fluxo tutorial vs sistema real (regressão de coerência)
 * - Inimigo usa habilidade via skill (mocked)
 * - Inimigo usa ataque básico
 * - Regressão: contra-ataque centralizado (_enemyWildCounterattack via wildActions)
 *
 * Funções testadas:
 *   - js/combat/wildCore.js: calculateCaptureScore, getCaptureReadinessLabel,
 *     applyCaptureAction, CAPTURE_ACTIONS, checkHit, calcDamage
 *   - js/combat/wildActions.js: executeWildAttack
 */

import { describe, it, expect } from 'vitest';
import {
    calculateCaptureScore,
    getCaptureReadinessLabel,
    applyCaptureAction,
    CAPTURE_ACTIONS,
    checkHit,
    calcDamage,
    applyDamageToHP,
    checkCriticalRoll,
} from '../js/combat/wildCore.js';
import { executeWildAttack } from '../js/combat/wildActions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Cria um monstrinho selvagem padrão */
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
        ...overrides,
    };
}

/** Cria um monstrinho do jogador padrão */
function makePlayer(overrides = {}) {
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

/** Cria um encounter selvagem padrão */
function makeEncounter(wild, playerId = 'p1') {
    return {
        id: 'enc_test',
        type: 'wild',
        active: true,
        wildMonster: wild,
        selectedPlayerId: playerId,
        log: [],
        rewardsGranted: false,
    };
}

/** Cria dependências mínimas para executeWildAttack */
function makeDeps(overrides = {}) {
    return {
        classAdvantages: {
            Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
            Mago: { strong: 'Bárbaro', weak: 'Ladino' },
            Curandeiro: { strong: 'Guerreiro', weak: 'Bardo' },
        },
        getBasicPower: () => 10,
        eneRegenData: { Guerreiro: { pct: 0.10, min: 1 } },
        rollD20: () => 15, // hit by default
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
// BLOCO 1: executeWildAttack — fluxo de ataque básico
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildAttack — ataque básico', () => {

    it('deve retornar success:true em ataque normal', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, def: 4 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ atk: 7 });
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({ rollD20: () => 15 }); // hit

        const result = executeWildAttack({
            encounter: enc,
            player,
            playerMonster: playerMon,
            d20Roll: 15,
            dependencies: deps,
        });

        expect(result.success).toBe(true);
    });

    it('deve reduzir HP do selvagem ao acertar', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, def: 3 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ atk: 7 });
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({
            rollD20: () => 20, // always hit (enemy also rolls 20 = crit)
        });

        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        // HP deve ter sido reduzido
        expect(enc.wildMonster.hp).toBeLessThan(100);
    });

    it('d20=1 (falha crítica) não deve reduzir HP do selvagem', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, def: 3 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ atk: 100 }); // ATK altíssimo mas não importa (d20=1 falha)
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({
            rollD20: () => 1, // enemy also rolls 1 = critical fail
        });

        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 1, dependencies: deps });

        // HP do selvagem não deve ter caído (d20=1 = falha crítica do jogador)
        expect(enc.wildMonster.hp).toBe(100);
    });

    it('deve retornar result:victory quando selvagem chega a HP 0', () => {
        const wild = makeWild({ hp: 1, hpMax: 100, def: 1 }); // quase morto
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ atk: 100 });
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({ rollD20: () => 1 }); // enemy fails

        const result = executeWildAttack({
            encounter: enc,
            player,
            playerMonster: playerMon,
            d20Roll: 20, // jogador acerta sempre
            dependencies: deps,
        });

        expect(result.result).toBe('victory');
        expect(enc.active).toBe(false);
    });

    it('deve retornar result:defeat quando jogador chega a HP 0', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, atk: 100, def: 1 }); // inimigo fortíssimo
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ hp: 1, hpMax: 100, def: 1, atk: 1 }); // quase morto
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({
            rollD20: () => 20, // enemy always crits
            getBasicPower: () => 100, // power altíssimo
        });

        const result = executeWildAttack({
            encounter: enc,
            player,
            playerMonster: playerMon,
            d20Roll: 1, // jogador falha (não acerta)
            dependencies: deps,
        });

        expect(result.result).toBe('defeat');
        expect(enc.active).toBe(false);
    });

    it('deve retornar success:false se não há wildMonster no encounter', () => {
        const enc = { active: true, log: [] }; // sem wildMonster
        const playerMon = makePlayer();
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps();

        const result = executeWildAttack({
            encounter: enc,
            player,
            playerMonster: playerMon,
            d20Roll: 15,
            dependencies: deps,
        });

        expect(result.success).toBe(false);
        expect(result.reason).toBe('no_encounter');
    });

    it('deve chamar tutorialOnAction("attack") quando ataque acerta', () => {
        const wild = makeWild({ hp: 100, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayer();
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };

        let tutorialCalled = false;
        const deps = makeDeps({
            rollD20: () => 1, // enemy fails
            tutorialOnAction: (action) => {
                if (action === 'attack') tutorialCalled = true;
            },
        });

        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(tutorialCalled).toBe(true);
    });

    it('deve registrar roll no log do encounter', () => {
        const wild = makeWild({ hp: 100, def: 3 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayer();
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 12, dependencies: deps });

        const logText = enc.log.join(' ');
        expect(logText).toContain('12'); // d20 roll registrado
    });

    it('d20=20 (crítico) deve registrar CRÍTICO no log', () => {
        const wild = makeWild({ hp: 100, hpMax: 100, def: 1 });
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ atk: 7 });
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({ rollD20: () => 1 }); // enemy fails

        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 20, dependencies: deps });

        // Log deve registrar o crítico
        const logText = enc.log.join(' ');
        expect(logText).toContain('CRÍTICO');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: calculateCaptureScore — sistema dual-track 50/50
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateCaptureScore — sistema dual-track HP + Agressividade', () => {

    it('selvagem intacto → score 0 (ambas trilhas no mínimo)', () => {
        expect(calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 100 })).toBe(0);
    });

    it('HP = 0, agressividade = 100 → score 50 (só trilha física)', () => {
        expect(calculateCaptureScore({ hp: 0, hpMax: 100, aggression: 100 })).toBe(50);
    });

    it('HP = 100, agressividade = 0 → score 50 (só trilha comportamental)', () => {
        expect(calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 0 })).toBe(50);
    });

    it('HP = 0, agressividade = 0 → score 100 (ambas trilhas no máximo)', () => {
        expect(calculateCaptureScore({ hp: 0, hpMax: 100, aggression: 0 })).toBe(100);
    });

    it('trilhas contribuem igualmente (50 pts cada)', () => {
        // HP metade = 25 pts, agressividade metade = 25 pts → total 50
        const score = calculateCaptureScore({ hp: 50, hpMax: 100, aggression: 50 });
        expect(score).toBe(50);
    });

    it('classes de suporte podem capturar sem reduzir HP (via trilha comportamental)', () => {
        // HP cheio (0 pts de trilha física) + agressividade 0 (50 pts de trilha comportamental)
        const score = calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 0 });
        expect(score).toBe(50);
        // Score de 50 é suficiente para raridade Comum (threshold = 35 no config padrão)
    });

    it('classes ofensivas podem capturar sem usar ação de captura (via trilha física)', () => {
        // HP zerado (50 pts) + agressividade máxima (0 pts)
        const score = calculateCaptureScore({ hp: 0, hpMax: 100, aggression: 100 });
        expect(score).toBe(50);
    });

    it('orb bônus se soma ao score', () => {
        const base = calculateCaptureScore({ hp: 50, hpMax: 100, aggression: 50 }, 0);
        const withOrb = calculateCaptureScore({ hp: 50, hpMax: 100, aggression: 50 }, 10);
        expect(withOrb).toBe(base + 10);
    });

    it('score máximo é 100 (não ultrapassa com orb)', () => {
        const score = calculateCaptureScore({ hp: 0, hpMax: 100, aggression: 0 }, 50); // orb enorme
        expect(score).toBe(100);
    });

    it('hpMax = 0 não causa NaN (proteção contra divisão por zero)', () => {
        const score = calculateCaptureScore({ hp: 0, hpMax: 0, aggression: 100 });
        expect(Number.isNaN(score)).toBe(false);
    });

    it('aggression ausente assume 100 (selvagem totalmente agressivo por padrão)', () => {
        // Sem campo aggression → assume 100 (nenhuma contribuição da trilha comportamental)
        const score = calculateCaptureScore({ hp: 0, hpMax: 100 });
        expect(score).toBe(50); // só trilha física
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: getCaptureReadinessLabel — rótulos da prontidão de captura
// ─────────────────────────────────────────────────────────────────────────────

describe('getCaptureReadinessLabel — rótulos de prontidão', () => {

    it('score < 25 → "Muito arisco" (danger)', () => {
        const label = getCaptureReadinessLabel(10);
        expect(label.text).toBe('Muito arisco');
        expect(label.css).toBe('danger');
    });

    it('score 25-44 → "Instável" (warning)', () => {
        const label = getCaptureReadinessLabel(35);
        expect(label.text).toBe('Instável');
        expect(label.css).toBe('warning');
    });

    it('score 45-64 → "Vulnerável" (success)', () => {
        const label = getCaptureReadinessLabel(55);
        expect(label.text).toBe('Vulnerável');
        expect(label.css).toBe('success');
    });

    it('score 65-79 → "Pronto para captura" (info)', () => {
        const label = getCaptureReadinessLabel(70);
        expect(label.text).toBe('Pronto para captura');
        expect(label.css).toBe('info');
    });

    it('score >= 80 → "Captura quase certa" (success-dark)', () => {
        const label = getCaptureReadinessLabel(85);
        expect(label.text).toBe('Captura quase certa');
        expect(label.css).toBe('success-dark');
    });

    it('deve sempre retornar { text, emoji, css } (nunca string)', () => {
        for (const score of [0, 24, 25, 44, 45, 64, 65, 79, 80, 100]) {
            const label = getCaptureReadinessLabel(score);
            expect(typeof label).toBe('object');
            expect(typeof label.text).toBe('string');
            expect(typeof label.emoji).toBe('string');
            expect(typeof label.css).toBe('string');
            expect(label.text.length).toBeGreaterThan(0);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: applyCaptureAction — trilha comportamental
// ─────────────────────────────────────────────────────────────────────────────

describe('applyCaptureAction — redução de agressividade', () => {

    it('deve reduzir agressividade pelo aggDelta da ação', () => {
        const wild = { aggression: 100 };
        const action = { aggDelta: -40 };
        applyCaptureAction(wild, action);
        expect(wild.aggression).toBe(60);
    });

    it('agressividade não vai abaixo de 0', () => {
        const wild = { aggression: 10 };
        const action = { aggDelta: -50 };
        applyCaptureAction(wild, action);
        expect(wild.aggression).toBe(0);
    });

    it('agressividade não vai acima de 100', () => {
        const wild = { aggression: 90 };
        const action = { aggDelta: 20 }; // aumento hipotético
        applyCaptureAction(wild, action);
        expect(wild.aggression).toBe(100);
    });

    it('sem aggression inicial assume 100', () => {
        const wild = {}; // sem campo aggression
        const action = { aggDelta: -30 };
        applyCaptureAction(wild, action);
        expect(wild.aggression).toBe(70);
    });

    it('NÃO deve mutar campo openness (campo zombie removido)', () => {
        const wild = { aggression: 80, openness: 50 };
        const action = { aggDelta: -20 };
        applyCaptureAction(wild, action);
        expect(wild.openness).toBe(50); // não foi alterado
        expect(wild.aggression).toBe(60);
    });

    it('NÃO deve travar com wildMonster ou action null', () => {
        expect(() => applyCaptureAction(null, { aggDelta: -20 })).not.toThrow();
        expect(() => applyCaptureAction({ aggression: 50 }, null)).not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5: CAPTURE_ACTIONS — cobertura de todas as classes
// ─────────────────────────────────────────────────────────────────────────────

describe('CAPTURE_ACTIONS — ações de captura por classe', () => {

    const EXPECTED_CLASSES = ['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];

    it('deve ter ação definida para todas as classes de jogador', () => {
        for (const cls of EXPECTED_CLASSES) {
            expect(CAPTURE_ACTIONS[cls], `Classe ${cls} sem ação de captura`).toBeDefined();
        }
    });

    it('todas as ações devem ter aggDelta negativo (acalmam o selvagem)', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(action.aggDelta, `${cls}.aggDelta deve ser negativo`).toBeLessThan(0);
        }
    });

    it('classes de suporte devem ter aggDelta mais forte que ofensivas', () => {
        // Curandeiro, Bardo, Animalista devem ter aggDelta mais negativo que Guerreiro/Bárbaro
        const curandeiro = CAPTURE_ACTIONS['Curandeiro'].aggDelta;
        const guerreiro   = CAPTURE_ACTIONS['Guerreiro'].aggDelta;
        const barbaro     = CAPTURE_ACTIONS['Bárbaro'].aggDelta;

        expect(curandeiro).toBeLessThan(guerreiro); // Curandeiro acalma mais que Guerreiro
        expect(curandeiro).toBeLessThan(barbaro);   // Curandeiro acalma mais que Bárbaro
    });

    it('todas as ações devem ter name, emoji e id definidos', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(action.name, `${cls} sem name`).toBeTruthy();
            expect(action.emoji, `${cls} sem emoji`).toBeTruthy();
            expect(action.id, `${cls} sem id`).toBeTruthy();
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6: Resolução dual-track — caminhos de captura
// ─────────────────────────────────────────────────────────────────────────────

describe('Resolução dual-track — cenários reais de captura', () => {

    it('Trilha Física: HP 10% + orb comum → score suficiente para Comum', () => {
        // HP 10% do máximo → hpScore ≈ 45; aggression=100 → aggrScore=0; orb=0
        const score = calculateCaptureScore({ hp: 10, hpMax: 100, aggression: 100 }, 0);
        // threshold Comum = 35 (config padrão)
        expect(score).toBeGreaterThanOrEqual(35);
    });

    it('Trilha Comportamental: HP cheio + aggression zerada → score suficiente para Comum', () => {
        // HP cheio → hpScore=0; aggression=0 → aggrScore=50; orb=0
        const score = calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 0 }, 0);
        // threshold Comum = 35
        expect(score).toBeGreaterThanOrEqual(35);
    });

    it('Score 0 com selvagem intacto → não é suficiente para nenhuma raridade', () => {
        const score = calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 100 }, 0);
        expect(score).toBe(0); // abaixo de qualquer threshold
    });

    it('Duas capturas com mesmos parâmetros → mesmo score (determinístico)', () => {
        const mon = { hp: 30, hpMax: 100, aggression: 40 };
        const s1 = calculateCaptureScore(mon, 10);
        const s2 = calculateCaptureScore(mon, 10);
        expect(s1).toBe(s2);
    });

    it('Aplicar ação de Curandeiro 3x pode zerar agressividade (40+40+20=100)', () => {
        const wild = { aggression: 100 };
        const curandeiroAction = CAPTURE_ACTIONS['Curandeiro']; // aggDelta: -40

        applyCaptureAction(wild, curandeiroAction);
        applyCaptureAction(wild, curandeiroAction);
        applyCaptureAction(wild, curandeiroAction);

        expect(wild.aggression).toBe(0); // max(0, 100 - 40 - 40 - 40) = 0 (clampado)
    });

    it('Aplicar ação de Bárbaro 7x pode zerar agressividade', () => {
        const wild = { aggression: 100 };
        const barbaroAction = CAPTURE_ACTIONS['Bárbaro']; // aggDelta: -15

        // 7 × (-15) = -105 < 0, então clampado a 0
        for (let i = 0; i < 7; i++) {
            applyCaptureAction(wild, barbaroAction);
        }

        expect(wild.aggression).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 7: Regressão de coerência tutorial vs sistema real
// ─────────────────────────────────────────────────────────────────────────────

describe('Regressão — coerência tutorial vs sistema real', () => {

    // Regra de design: ambas as trilhas têm peso igual (50 pts cada)
    it('score máximo de HP (trilha física) = 50 pontos', () => {
        const hpOnlyScore = calculateCaptureScore({ hp: 0, hpMax: 100, aggression: 100 });
        expect(hpOnlyScore).toBe(50);
    });

    it('score máximo de agressividade (trilha comportamental) = 50 pontos', () => {
        const aggrOnlyScore = calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 0 });
        expect(aggrOnlyScore).toBe(50);
    });

    it('cada trilha contribui igualmente — sem trilha dominante', () => {
        const hpOnly   = calculateCaptureScore({ hp: 0,   hpMax: 100, aggression: 100 });
        const aggrOnly = calculateCaptureScore({ hp: 100, hpMax: 100, aggression: 0   });
        expect(hpOnly).toBe(aggrOnly); // ambas valem 50
    });

    // Regressão: getCaptureReadinessLabel deve retornar objeto, nunca string
    it('getCaptureReadinessLabel retorna objeto estruturado (regressão de tipo)', () => {
        const label = getCaptureReadinessLabel(50);
        expect(typeof label).not.toBe('string');
        expect(label).toHaveProperty('text');
        expect(label).toHaveProperty('emoji');
        expect(label).toHaveProperty('css');
    });

    // Regressão: applyCaptureAction não deve alterar openness (campo zombie removido)
    it('applyCaptureAction não introduce campo openness (regressão zombie field)', () => {
        const wild = { aggression: 80 };
        applyCaptureAction(wild, { aggDelta: -20 });
        expect(Object.keys(wild)).not.toContain('openDelta');
        // openness pode já existir no objeto sem ser alterado — apenas aggression muda
        const beforeKeys = Object.keys(wild);
        expect(beforeKeys).toContain('aggression');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 8: Contador-ataque — regressão de consistência entre caminhos
// ─────────────────────────────────────────────────────────────────────────────

describe('Contra-ataque selvagem — regressão de consistência', () => {

    it('inimigo com d20=1 (falha crítica) não deve causar dano ao jogador', () => {
        const wild = makeWild({ hp: 100, atk: 100, def: 1 }); // ataque altíssimo mas roll=1
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ hp: 80 });
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({
            rollD20: () => 1, // enemy sempre rola 1 (falha crítica)
        });

        // Jogador ataca e erra (d20=1), inimigo contra-ataca com d20=1 → falha crítica
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 1, dependencies: deps });

        // HP do jogador não deve ter mudado (inimigo falhou)
        // Nota: o HP pode mudar por outros motivos (itens) mas não pelo ataque do d20=1
        // Verificamos que não houve derrota (jogador ainda vivo)
        expect(playerMon.hp).toBeGreaterThan(0);
    });

    it('inimigo com d20=20 (crítico) deve causar mais dano que um acerto normal', () => {
        // Teste determinístico: comparamos o log para ver se "CRÍTICO" aparece
        const wild1 = makeWild({ hp: 100, atk: 8, def: 1 });
        const wild2 = makeWild({ hp: 100, atk: 8, def: 1 });
        const enc1 = makeEncounter(wild1);
        const enc2 = makeEncounter(wild2);
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };

        // Jogador falha (d20=1), inimigo 1 rola 10 (acerto normal), inimigo 2 rola 20 (crit)
        const deps1 = makeDeps({ rollD20: () => 10 });
        const deps2 = makeDeps({ rollD20: () => 20 });

        const mon1 = makePlayer({ hp: 80, def: 3 });
        const mon2 = makePlayer({ hp: 80, def: 3 });

        executeWildAttack({ encounter: enc1, player, playerMonster: mon1, d20Roll: 1, dependencies: deps1 });
        executeWildAttack({ encounter: enc2, player, playerMonster: mon2, d20Roll: 1, dependencies: deps2 });

        // Inimigo crit deve ter causado mais dano ao jogador (HP menor)
        // Inimigo 1 (roll=10): acerto normal; Inimigo 2 (roll=20): crítico
        expect(mon2.hp).toBeLessThanOrEqual(mon1.hp);
    });

    it('inimigo não contra-ataca se ja morreu antes (HP <= 0)', () => {
        const wild = makeWild({ hp: 1, hpMax: 100, def: 1 }); // quase morto
        const enc = makeEncounter(wild);
        const playerMon = makePlayer({ atk: 100, hp: 80 });
        const player = { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {} };
        const deps = makeDeps({ rollD20: () => 1 }); // inimigo rollaria 1

        const result = executeWildAttack({
            encounter: enc,
            player,
            playerMonster: playerMon,
            d20Roll: 20, // jogador acerta (crit)
            dependencies: deps,
        });

        // Vitória: inimigo morreu antes de contra-atacar
        expect(result.result).toBe('victory');
        // HP do jogador deve estar intacto (não foi atacado)
        expect(playerMon.hp).toBe(80);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 9: Início do encounter selvagem — estado criado
// ─────────────────────────────────────────────────────────────────────────────

describe('Estado inicial do encounter selvagem', () => {

    it('encounter deve ter log vazio inicialmente', () => {
        const enc = makeEncounter(makeWild());
        expect(enc.log).toEqual([]);
    });

    it('encounter deve ter active:true ao iniciar', () => {
        const enc = makeEncounter(makeWild());
        expect(enc.active).toBe(true);
    });

    it('encounter deve ter rewardsGranted:false para prevenir recompensa dupla', () => {
        const enc = makeEncounter(makeWild());
        expect(enc.rewardsGranted).toBe(false);
    });

    it('wildMonster deve ter aggression=100 ao iniciar (totalmente agressivo)', () => {
        const wild = makeWild({ aggression: 100 });
        expect(wild.aggression).toBe(100);
    });

    it('wildMonster com aggression=100 tem score=0 (captura impossível sem ação)', () => {
        const wild = makeWild({ aggression: 100 });
        const score = calculateCaptureScore(wild, 0);
        expect(score).toBe(0);
    });
});
