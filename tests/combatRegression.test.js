/**
 * COMBAT REGRESSION TESTS (PR-combate-fix)
 *
 * Testes de regressão para os bugs de combate corrigidos:
 *
 * 1. WILD COMBAT – vitória aplica XP ao monstro ativo do jogador
 * 2. GROUP COMBAT – advanceGroupTurn usa activeIndex (não team[0])
 *    após troca de monstro, evitando turnos infinitos do inimigo
 * 3. GROUP COMBAT – jogador recupera o turno após troca de monstro
 * 4. GROUP COMBAT – detecção de fim de batalha permanece correta
 * 5. GROUP COMBAT – turno do inimigo executa sem recursão infinita
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { giveXP, handleVictoryRewards } from '../js/progression/xpActions.js';
import { advanceGroupTurn, executeEnemyTurnGroup } from '../js/combat/groupActions.js';
import * as GroupCore from '../js/combat/groupCore.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de fixture
// ─────────────────────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        id: 'mi_test',
        name: 'Luma',
        class: 'Mago',
        level: 5,
        xp: 0,
        xpNeeded: 70,
        hp: 50,
        hpMax: 50,
        atk: 10,
        def: 5,
        spd: 8,
        ene: 10,
        eneMax: 10,
        poder: 5,
        rarity: 'Comum',
        ...overrides
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'player_1',
        name: 'Jogador',
        class: 'Mago',
        activeIndex: 0,
        team: [makeMon()],
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        name: 'Selvagem',
        class: 'Guerreiro',
        level: 3,
        xp: 0,
        xpNeeded: 50,
        hp: 30,
        hpMax: 30,
        atk: 8,
        def: 4,
        spd: 5,
        ene: 10,
        eneMax: 10,
        poder: 4,
        rarity: 'Comum',
        ...overrides
    };
}

function makeProgressionDeps(players) {
    return {
        state: { players, currentEncounter: null },
        constants: { DEFAULT_FRIENDSHIP: 50 },
        helpers: {
            updateStats: () => {},
            calculateBattleXP: (_enemy, _type) => 30,
            ensureMonsterProgressFields: (mon) => {
                mon.xp = mon.xp ?? 0;
                mon.xpNeeded = mon.xpNeeded ?? 47;
            },
            getFriendshipBonuses: () => ({ xpMultiplier: 1.0 }),
            formatFriendshipBonusPercent: () => 0,
            calcXpNeeded: (l) => Math.round(40 + 6 * l + 0.6 * l * l),
            recalculateStatsFromTemplate: () => {},
            updateFriendship: () => {},
            maybeEvolveAfterLevelUp: () => {},
            maybeUpgradeSkillsModelB: () => {}
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Wild combat – XP aplicado ao monstro ativo
// ─────────────────────────────────────────────────────────────────────────────

describe('Wild Combat – aplicação de XP (handleVictoryRewards)', () => {
    it('deve dar XP ao monstro vivo após vitória 1v1', () => {
        const player = makePlayer();
        const enc = {
            type: 'wild',
            log: [],
            wildMonster: makeEnemy(),
            selectedPlayerId: 'player_1'
        };

        const deps = makeProgressionDeps([player]);
        handleVictoryRewards(deps, enc);

        expect(enc.rewardsGranted).toBe(true);
        expect(player.team[0].xp).toBe(30);
        expect(enc.log.some(l => l.includes('30 XP'))).toBe(true);
    });

    it('não deve dar XP a monstro com HP = 0', () => {
        const player = makePlayer({ team: [makeMon({ hp: 0 })] });
        const enc = {
            type: 'wild',
            log: [],
            wildMonster: makeEnemy(),
            selectedPlayerId: 'player_1'
        };

        const deps = makeProgressionDeps([player]);
        handleVictoryRewards(deps, enc);

        expect(player.team[0].xp).toBe(0);
    });

    it('não deve dar XP duas vezes (idempotência)', () => {
        const player = makePlayer();
        const enc = {
            type: 'wild',
            log: [],
            wildMonster: makeEnemy(),
            selectedPlayerId: 'player_1'
        };

        const deps = makeProgressionDeps([player]);
        handleVictoryRewards(deps, enc);
        handleVictoryRewards(deps, enc); // segunda chamada deve ser ignorada

        expect(player.team[0].xp).toBe(30); // não dobrado
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2 & 3. Group Combat – advanceGroupTurn usa activeIndex correto
// ─────────────────────────────────────────────────────────────────────────────

describe('Group Combat – advanceGroupTurn usa activeIndex (BUG FIX #1)', () => {

    /**
     * Monta um encounter de grupo simples: 1 jogador, 1 inimigo.
     * O jogador tem 2 monstros; o primeiro está morto; o ativo é team[1].
     */
    function makeGroupEnc({ playerActiveIndex = 0 } = {}) {
        const player = {
            id: 'p1',
            name: 'Ana',
            class: 'Mago',
            activeIndex: playerActiveIndex,
            team: [
                makeMon({ id: 'mi_dead', name: 'Morto', hp: 0, hpMax: 50 }),
                makeMon({ id: 'mi_alive', name: 'Vivo', hp: 40, hpMax: 50 })
            ]
        };
        const enemy = makeEnemy();
        const enc = {
            id: 1,
            type: 'group_trainer',
            active: true,
            finished: false,
            result: null,
            log: [],
            participants: ['p1'],
            enemies: [enemy],
            recentTargets: {},
            turnOrder: [
                { side: 'player', id: 'p1', name: 'Ana', spd: 8 },
                { side: 'enemy', id: 0, name: 'Selvagem', spd: 5 }
            ],
            turnIndex: 1 // posicionado no inimigo (ele acabou de agir)
        };
        return { player, enemy, enc };
    }

    it('deve identificar jogador como ativo quando activeIndex aponta para monstro vivo (team[1])', () => {
        const { player, enc } = makeGroupEnc({ playerActiveIndex: 1 });

        const logs = [];
        const deps = {
            state: { players: [player], config: {} },
            core: GroupCore,
            audio: { playSfx: () => {} },
            helpers: {
                handleVictoryRewards: () => {},
                log: (e, msg) => { e.log.push(msg); logs.push(msg); },
                getPlayerById: (id) => player,
                getActiveMonsterOfPlayer: (p) => p.team[p.activeIndex],
                getEnemyByIndex: (e, i) => e.enemies[i],
                applyEneRegen: () => {},
                updateBuffs: () => {},
                rollD20: () => 10,
                recordD20Roll: () => {},
                getBasicAttackPower: () => 5,
                applyDamage: () => {},
                firstAliveIndex: (team) => team.findIndex(m => m.hp > 0),
                openSwitchMonsterModal: () => {},
                buildEligibleTargets: () => [],
                canUseSkillNow: () => false,
                getSkillById: () => null,
                getItemDef: () => null,
                chooseTargetPlayerId: () => null
            },
            ui: {
                render: () => {},
                showDamageFeedback: () => {},
                showMissFeedback: () => {},
                playAttackFeedback: () => {}
            },
            storage: { save: () => {} }
        };

        // Avança o turno: estava no inimigo (turnIndex=1), deve avançar para player (turnIndex=0)
        advanceGroupTurn(enc, deps);

        // O ator atual deve ser o jogador (p1), pois team[1] está vivo
        const currentActor = GroupCore.getCurrentActor(enc);
        expect(currentActor).not.toBeNull();
        expect(currentActor.side).toBe('player');
        expect(currentActor.id).toBe('p1');
    });

    it('deve pular jogador quando activeIndex aponta para monstro morto (regressão team[0])', () => {
        // activeIndex = 0, mas team[0].hp = 0 → jogador deve ser pulado
        const { player, enc } = makeGroupEnc({ playerActiveIndex: 0 });
        // team[0] está morto (hp=0) e activeIndex=0 → o ator não deve ser jogador

        const logs = [];
        const deps = {
            state: { players: [player], config: {} },
            core: GroupCore,
            audio: { playSfx: () => {} },
            helpers: {
                handleVictoryRewards: () => {},
                log: (e, msg) => { e.log.push(msg); logs.push(msg); },
                getPlayerById: (id) => player,
                getActiveMonsterOfPlayer: (p) => p.team[p.activeIndex],
                getEnemyByIndex: (e, i) => e.enemies[i],
                applyEneRegen: () => {},
                updateBuffs: () => {},
                rollD20: () => 10,
                recordD20Roll: () => {},
                getBasicAttackPower: () => 5,
                applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
                firstAliveIndex: (team) => team.findIndex(m => m.hp > 0),
                openSwitchMonsterModal: () => {},
                buildEligibleTargets: () => [],
                canUseSkillNow: () => false,
                getSkillById: () => null,
                getItemDef: () => null,
                chooseTargetPlayerId: () => null
            },
            ui: {
                render: () => {},
                showDamageFeedback: () => {},
                showMissFeedback: () => {},
                playAttackFeedback: () => {}
            },
            storage: { save: () => {} }
        };

        advanceGroupTurn(enc, deps);

        // Quando team[0] está morto e activeIndex=0, o jogador é pulado
        // e o inimigo (team[0] → enemy[0]) fica como ator atual
        const currentActor = GroupCore.getCurrentActor(enc);
        // O loop deve ter avançado para o inimigo (skip player com activeIndex=0 morto)
        expect(currentActor).not.toBeNull();
        // Neste cenário o inimigo deve ser o ator (player foi pulado corretamente)
        expect(currentActor.side).toBe('enemy');
    });

    it('não deve criar recursão infinita com player ativo vivo após troca de monstro', () => {
        // Simula o cenário pós-switch: jogador trocou para team[1] (vivo)
        // A função não deve chamar executeEnemyTurnGroup em loop
        const { player, enc } = makeGroupEnc({ playerActiveIndex: 1 });

        let enemyTurnCount = 0;
        const deps = {
            state: { players: [player], config: {} },
            core: GroupCore,
            audio: { playSfx: () => {} },
            helpers: {
                handleVictoryRewards: () => {},
                log: (e, msg) => e.log.push(msg),
                getPlayerById: (id) => player,
                getActiveMonsterOfPlayer: (p) => p.team[p.activeIndex],
                getEnemyByIndex: (e, i) => e.enemies[i],
                applyEneRegen: () => {},
                updateBuffs: () => {},
                rollD20: () => 10,
                recordD20Roll: () => {},
                getBasicAttackPower: () => 5,
                applyDamage: () => {},
                firstAliveIndex: (team) => team.findIndex(m => m.hp > 0),
                openSwitchMonsterModal: () => {},
                canUseSkillNow: () => false,
                getSkillById: () => null,
                getItemDef: () => null,
                chooseTargetPlayerId: () => null
            },
            ui: {
                render: () => {},
                showDamageFeedback: () => {},
                showMissFeedback: () => {},
                playAttackFeedback: () => {}
            },
            storage: { save: () => {} }
        };

        // Não deve lançar stack overflow nem chamar turno do inimigo
        expect(() => advanceGroupTurn(enc, deps)).not.toThrow();

        // O ator deve ser o jogador (não o inimigo)
        const actor = GroupCore.getCurrentActor(enc);
        expect(actor.side).toBe('player');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Group Combat – detecção de vitória permanece correta
// ─────────────────────────────────────────────────────────────────────────────

describe('Group Combat – fim de batalha', () => {

    it('deve detectar vitória quando todos os inimigos morrem', () => {
        const player = makePlayer();
        const enc = {
            id: 1,
            type: 'group_trainer',
            active: true,
            finished: false,
            result: null,
            log: [],
            participants: ['player_1'],
            enemies: [makeEnemy({ hp: 0 })], // inimigo morto
            recentTargets: {},
            _winSfxPlayed: false,
            turnOrder: [
                { side: 'player', id: 'player_1', name: 'Ana', spd: 8 },
                { side: 'enemy', id: 0, name: 'Selvagem', spd: 5 }
            ],
            turnIndex: 0
        };

        const deps = {
            state: { players: [player], config: {} },
            core: GroupCore,
            audio: { playSfx: () => {} },
            helpers: {
                handleVictoryRewards: () => {},
                log: (e, msg) => e.log.push(msg),
                getPlayerById: (id) => player,
                getActiveMonsterOfPlayer: (p) => p.team[p.activeIndex ?? 0],
                getEnemyByIndex: (e, i) => e.enemies[i],
                applyEneRegen: () => {},
                updateBuffs: () => {}
            },
            ui: { render: () => {} },
            storage: { save: () => {} }
        };

        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
        expect(enc.active).toBe(false);
    });

    it('deve detectar derrota quando todos os jogadores perdem todos monstros', () => {
        const player = makePlayer({ team: [makeMon({ hp: 0 })] });
        const enc = {
            id: 1,
            type: 'group_trainer',
            active: true,
            finished: false,
            result: null,
            log: [],
            participants: ['player_1'],
            enemies: [makeEnemy()], // inimigo vivo
            recentTargets: {},
            _loseSfxPlayed: false,
            turnOrder: [
                { side: 'player', id: 'player_1', name: 'Ana', spd: 8 },
                { side: 'enemy', id: 0, name: 'Selvagem', spd: 5 }
            ],
            turnIndex: 0
        };

        const deps = {
            state: { players: [player], config: {} },
            core: GroupCore,
            audio: { playSfx: () => {} },
            helpers: {
                handleVictoryRewards: () => {},
                log: (e, msg) => e.log.push(msg),
                getPlayerById: (id) => player,
                getActiveMonsterOfPlayer: (p) => p.team[p.activeIndex ?? 0],
                getEnemyByIndex: (e, i) => e.enemies[i],
                applyEneRegen: () => {},
                updateBuffs: () => {}
            },
            ui: { render: () => {} },
            storage: { save: () => {} }
        };

        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
        expect(enc.active).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Group Combat – handleVictoryRewards em batalha de grupo
// ─────────────────────────────────────────────────────────────────────────────

describe('Group Combat – distribuição de XP após vitória', () => {

    it('deve dar XP para todos os participantes vivos', () => {
        const p1 = makePlayer({ id: 'p1' });
        const p2 = makePlayer({ id: 'p2', team: [makeMon({ name: 'Bolha', xp: 0, xpNeeded: 70, hp: 40 })] });

        const enc = {
            type: 'group',
            log: [],
            participants: ['p1', 'p2'],
            enemies: [makeEnemy()]
        };

        const deps = makeProgressionDeps([p1, p2]);
        handleVictoryRewards(deps, enc);

        expect(p1.team[0].xp).toBe(30);
        expect(p2.team[0].xp).toBe(30);
        expect(enc.rewardsGranted).toBe(true);
    });

    it('não deve dar XP a participante com monstro morto', () => {
        const p1 = makePlayer({ id: 'p1', team: [makeMon({ hp: 0 })] }); // morto
        const p2 = makePlayer({ id: 'p2', team: [makeMon({ hp: 40 })] }); // vivo

        const enc = {
            type: 'group',
            log: [],
            participants: ['p1', 'p2'],
            enemies: [makeEnemy()]
        };

        const deps = makeProgressionDeps([p1, p2]);
        handleVictoryRewards(deps, enc);

        expect(p1.team[0].xp).toBe(0); // morto não recebe
        expect(p2.team[0].xp).toBe(30); // vivo recebe
    });
});
