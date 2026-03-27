/**
 * COMBAT HARDENING TESTS
 *
 * Edge cases e estabilidade do fluxo de combate.
 *
 * Cenários cobertos:
 * 1.  XP vai para o monstro ATIVO (activeIndex), não para team[0], em vitória wild
 * 2.  XP vai para o monstro ATIVO (activeIndex), não para team[0], em vitória de grupo
 * 3.  XP não é dado duas vezes (flag rewardsGranted)
 * 4.  XP não é dado a monstro morto (hp = 0)
 * 5.  XP em grupo: apenas participantes vivos recebem
 * 6.  XP em grupo com 2 jogadores: cada um recebe no SEU monstro ativo
 * 7.  advanceGroupTurn detecta vitória mesmo quando `participants` é vazio
 * 8.  advanceGroupTurn detecta derrota com múltiplos jogadores (estados mistos)
 * 9.  findPlayerNeedingSwitch retorna null quando não há substituto
 * 10. Inimigo morto antes da sua vez: advanceGroupTurn pula e avança para próximo
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { giveXP, handleVictoryRewards } from '../js/progression/xpActions.js';
import { advanceGroupTurn, buildEligibleTargets } from '../js/combat/groupActions.js';
import * as GroupCore from '../js/combat/groupCore.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

let _monCounter = 0;
beforeEach(() => { _monCounter = 0; });
function makeMon(overrides = {}) {
    return {
        id: `mi_test_${++_monCounter}`,
        name: 'TestMon',
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
        name: 'Ana',
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

/** Cria deps mínimos para handleVictoryRewards */
function makeProgressionDeps(players) {
    return {
        state: { players, currentEncounter: null },
        constants: { DEFAULT_FRIENDSHIP: 50 },
        helpers: {
            updateStats: () => {},
            calculateBattleXP: () => 30,
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

/** Cria deps mínimos para advanceGroupTurn */
function makeGroupDeps(players) {
    return {
        state: { players, config: {} },
        core: GroupCore,
        audio: { playSfx: () => {} },
        helpers: {
            handleVictoryRewards: () => {},
            log: (e, msg) => (e.log = e.log || []) && e.log.push(msg),
            getPlayerById: (id) => players.find(p => p.id === id),
            getActiveMonsterOfPlayer: (p) => p.team[p.activeIndex ?? 0],
            getEnemyByIndex: (e, i) => e.enemies[i],
            applyEneRegen: () => {},
            updateBuffs: () => {},
            rollD20: () => 10,
            recordD20Roll: () => {},
            getBasicAttackPower: () => 5,
            applyDamage: (t, d) => { t.hp = Math.max(0, t.hp - d); },
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
}

// ─────────────────────────────────────────────────────────────────────────────
// 1-4. XP distribution – handleVictoryRewards
// ─────────────────────────────────────────────────────────────────────────────

describe('XP distribution – handleVictoryRewards (hardening)', () => {

    it('deve dar XP ao monstro ATIVO (activeIndex=1) e não a team[0] em vitória wild', () => {
        // team[0] está morto, team[1] é o ativo
        const deadMon  = makeMon({ id: 'mi_dead', name: 'Morto', hp: 0 });
        const aliveMon = makeMon({ id: 'mi_alive', name: 'Vivo', hp: 40, xp: 0 });
        const player = makePlayer({
            activeIndex: 1,
            team: [deadMon, aliveMon]
        });
        const enc = {
            type: 'wild',
            log: [],
            wildMonster: makeEnemy(),
            selectedPlayerId: 'player_1'
        };

        const deps = makeProgressionDeps([player]);
        handleVictoryRewards(deps, enc);

        // XP deve ir para team[1] (ativo), não para team[0] (morto)
        expect(aliveMon.xp).toBe(30);
        expect(deadMon.xp).toBe(0);
    });

    it('deve dar XP ao monstro ATIVO (activeIndex=2) em vitória de grupo', () => {
        const dead0 = makeMon({ id: 'mi_d0', hp: 0, xp: 0 });
        const dead1 = makeMon({ id: 'mi_d1', hp: 0, xp: 0 });
        const alive2 = makeMon({ id: 'mi_a2', hp: 30, xp: 0 });
        const player = makePlayer({
            id: 'p1',
            activeIndex: 2,
            team: [dead0, dead1, alive2]
        });
        const enc = {
            type: 'group_trainer',
            log: [],
            participants: ['p1'],
            enemies: [makeEnemy({ hp: 0 })],
            wildMonster: null,
            rewardsGranted: false
        };

        const deps = makeProgressionDeps([player]);
        handleVictoryRewards(deps, enc);

        // XP deve ir para team[2] (ativo), não para team[0]
        expect(alive2.xp).toBe(30);
        expect(dead0.xp).toBe(0);
        expect(dead1.xp).toBe(0);
    });

    it('não deve dar XP duas vezes (rewardsGranted flag)', () => {
        const player = makePlayer();
        const enc = {
            type: 'wild',
            log: [],
            wildMonster: makeEnemy(),
            selectedPlayerId: 'player_1'
        };

        const deps = makeProgressionDeps([player]);
        handleVictoryRewards(deps, enc);
        handleVictoryRewards(deps, enc); // segunda chamada deve ser no-op

        expect(player.team[0].xp).toBe(30);
    });

    it('não deve dar XP a monstro com hp = 0 (monstro ativo morto)', () => {
        const player = makePlayer({ team: [makeMon({ hp: 0, xp: 0 })] });
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

    it('deve dar XP para cada participante vivo no seu monstro ativo em grupo com 2 jogadores', () => {
        const mon1 = makeMon({ id: 'mi_1', xp: 0, hp: 40 });
        const mon2 = makeMon({ id: 'mi_2', xp: 0, hp: 35 });
        const p1 = makePlayer({ id: 'p1', activeIndex: 0, team: [mon1] });
        const p2 = makePlayer({ id: 'p2', activeIndex: 0, team: [mon2] });
        const enc = {
            type: 'group_trainer',
            log: [],
            participants: ['p1', 'p2'],
            enemies: [makeEnemy({ hp: 0 })],
            rewardsGranted: false
        };

        const deps = makeProgressionDeps([p1, p2]);
        handleVictoryRewards(deps, enc);

        // Ambos devem receber XP
        expect(mon1.xp).toBe(30);
        expect(mon2.xp).toBe(30);
    });

    it('não deve dar XP ao participante com monstro ativo morto em grupo', () => {
        const aliveMon = makeMon({ id: 'mi_alive', xp: 0, hp: 40 });
        const deadMon  = makeMon({ id: 'mi_dead',  xp: 0, hp: 0 });
        const p1 = makePlayer({ id: 'p1', activeIndex: 0, team: [aliveMon] });
        const p2 = makePlayer({ id: 'p2', activeIndex: 0, team: [deadMon] });
        const enc = {
            type: 'group_trainer',
            log: [],
            participants: ['p1', 'p2'],
            enemies: [makeEnemy({ hp: 0 })],
            rewardsGranted: false
        };

        const deps = makeProgressionDeps([p1, p2]);
        handleVictoryRewards(deps, enc);

        expect(aliveMon.xp).toBe(30);
        expect(deadMon.xp).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. advanceGroupTurn – cenários extras de fim de batalha
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceGroupTurn – edge cases de fim de batalha', () => {

    it('deve detectar vitória mesmo quando participants está vazio', () => {
        const player = makePlayer();
        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false, result: null,
            log: [], participants: [],
            enemies: [makeEnemy({ hp: 0 })],
            recentTargets: {}, _winSfxPlayed: false,
            turnOrder: [{ side: 'player', id: 'player_1', name: 'Ana', spd: 8 }],
            turnIndex: 0
        };

        const deps = makeGroupDeps([player]);
        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
    });

    it('deve detectar derrota com múltiplos jogadores — todos com monstros mortos', () => {
        const p1 = makePlayer({ id: 'p1', team: [makeMon({ hp: 0 })] });
        const p2 = makePlayer({ id: 'p2', team: [makeMon({ hp: 0 })] });
        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false, result: null,
            log: [], participants: ['p1', 'p2'],
            enemies: [makeEnemy()],
            recentTargets: {}, _loseSfxPlayed: false,
            turnOrder: [
                { side: 'player', id: 'p1', name: 'P1', spd: 8 },
                { side: 'player', id: 'p2', name: 'P2', spd: 7 },
                { side: 'enemy',  id: 0,    name: 'E',  spd: 5 }
            ],
            turnIndex: 0
        };

        const deps = makeGroupDeps([p1, p2]);
        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });

    it('deve continuar batalha quando um jogador perdeu todos mas outro tem monstro vivo (estado misto)', () => {
        // p1: monstro morto → eliminado
        // p2: monstro vivo → batalha deve continuar
        const p1 = makePlayer({ id: 'p1', activeIndex: 0, team: [makeMon({ hp: 0 })] });
        const p2 = makePlayer({ id: 'p2', activeIndex: 0, team: [makeMon({ hp: 40 })] });
        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false, result: null,
            log: [], participants: ['p1', 'p2'],
            enemies: [makeEnemy()],
            recentTargets: {}, _winSfxPlayed: false, _loseSfxPlayed: false,
            turnOrder: [
                { side: 'player', id: 'p1', name: 'P1', spd: 8 },
                { side: 'player', id: 'p2', name: 'P2', spd: 7 },
                { side: 'enemy',  id: 0,    name: 'E',  spd: 5 }
            ],
            turnIndex: 0
        };

        const deps = makeGroupDeps([p1, p2]);
        advanceGroupTurn(enc, deps);

        // Batalha continua — p2 ainda tem monstro vivo
        expect(enc.finished).toBe(false);
        expect(enc.result).toBeNull();
    });

    it('deve pular inimigo morto e não travar no turnOrder', () => {
        const player = makePlayer({ id: 'p1', activeIndex: 0, team: [makeMon({ hp: 40 })] });
        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false, result: null,
            log: [], participants: ['p1'],
            // 2 inimigos, primeiro morto, segundo vivo
            enemies: [makeEnemy({ hp: 0 }), makeEnemy({ hp: 20 })],
            recentTargets: {},
            turnOrder: [
                { side: 'player', id: 'p1', name: 'P1', spd: 8 },
                { side: 'enemy',  id: 0,    name: 'E0', spd: 5 },
                { side: 'enemy',  id: 1,    name: 'E1', spd: 3 }
            ],
            // Partindo do turnIndex 0 (player), próximo será enemy[0] que está morto
            turnIndex: 0
        };

        const deps = makeGroupDeps([player]);
        // Não deve lançar nem travar
        expect(() => advanceGroupTurn(enc, deps)).not.toThrow();
        // A batalha não deve ter terminado — E1 ainda está vivo
        expect(enc.finished).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. buildEligibleTargets – jogador sem monstro ativo ou monstro morto
// ─────────────────────────────────────────────────────────────────────────────

describe('buildEligibleTargets – inimigo sem alvo válido', () => {

    it('retorna lista vazia quando todos os monstros ativos estão mortos', () => {
        const player = makePlayer({ id: 'p1', activeIndex: 0, team: [makeMon({ hp: 0 })] });
        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false,
            participants: ['p1'], enemies: [makeEnemy()], recentTargets: {}
        };

        const deps = makeGroupDeps([player]);
        const targets = buildEligibleTargets(enc, deps);

        expect(targets).toHaveLength(0);
    });

    it('retorna apenas jogadores com monstro ativo vivo', () => {
        const p1 = makePlayer({ id: 'p1', activeIndex: 0, team: [makeMon({ hp: 0 })] });
        const p2 = makePlayer({ id: 'p2', activeIndex: 0, team: [makeMon({ hp: 30 })] });
        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false,
            participants: ['p1', 'p2'], enemies: [makeEnemy()], recentTargets: {}
        };

        const deps = makeGroupDeps([p1, p2]);
        const targets = buildEligibleTargets(enc, deps);

        // Só p2 tem monstro ativo vivo
        expect(targets).toHaveLength(1);
        expect(targets[0].playerId).toBe('p2');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. advanceGroupTurn – sem recursão infinita quando nenhum alvo disponível
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceGroupTurn – sem trava quando nenhum alvo válido', () => {

    it('não deve gerar stack overflow quando todos os monstros ativos estão mortos mas há substituto', () => {
        // Simula o cenário de cadeia: inimigo age, monstro ativo morreu, jogador tem substituto
        // (o modal de troca deve ser aberto em vez de recursão)
        const deadMon  = makeMon({ id: 'mi_dead',  hp: 0 });
        const aliveMon = makeMon({ id: 'mi_alive', hp: 30 });
        const player = makePlayer({ id: 'p1', activeIndex: 0, team: [deadMon, aliveMon] });

        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false, result: null,
            log: [], participants: ['p1'],
            enemies: [makeEnemy()],
            recentTargets: {},
            turnOrder: [
                { side: 'player', id: 'p1', name: 'P1', spd: 8 },
                { side: 'enemy',  id: 0,    name: 'E',  spd: 5 }
            ],
            // turnIndex = 1 → vez do inimigo (inimigo vai atacar mas não encontra alvo)
            turnIndex: 1
        };

        let modalOpened = false;
        const deps = {
            ...makeGroupDeps([player]),
            helpers: {
                ...makeGroupDeps([player]).helpers,
                openSwitchMonsterModal: () => { modalOpened = true; }
            }
        };

        // Não deve estourar a pilha
        expect(() => advanceGroupTurn(enc, deps)).not.toThrow();
        // A batalha não deve ter terminado (o jogador tem substituto)
        expect(enc.finished).toBe(false);
    });

    it('deve detectar derrota quando não há alvo E não há substituto', () => {
        const player = makePlayer({ id: 'p1', activeIndex: 0, team: [makeMon({ hp: 0 })] });

        const enc = {
            id: 1, type: 'group_trainer', active: true, finished: false, result: null,
            log: [], participants: ['p1'],
            enemies: [makeEnemy()],
            recentTargets: {},
            turnOrder: [
                { side: 'player', id: 'p1', name: 'P1', spd: 8 },
                { side: 'enemy',  id: 0,    name: 'E',  spd: 5 }
            ],
            // Vez do inimigo
            turnIndex: 1
        };

        const deps = makeGroupDeps([player]);
        advanceGroupTurn(enc, deps);

        // Sem substituto → derrota
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });
});
