/**
 * FLEE ACTION TESTS (PR-03)
 *
 * Testes para a fuga individual canônica (PATCH_CANONICO_COMBATE_V2.2 BLOCO 11).
 * Cobertura:
 *   - checkFleeCanonical: DC normal/intimidating/elite, SPD, total, sucesso/falha
 *   - FLEE_DC: constantes exportadas
 *   - executeWildFlee: sucesso, falha + contra-ataque, boss bloqueado, invalid
 *   - executeGroupFlee: sucesso, falha (turno gasto), boss bloqueado, all-fled → retreat
 */

import { describe, it, expect } from 'vitest';
import { checkFleeCanonical, FLEE_DC } from '../js/combat/wildCore.js';
import { executeWildFlee } from '../js/combat/wildActions.js';
import { executeGroupFlee } from '../js/combat/groupActions.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMonster(overrides = {}) {
    return {
        id: 'm1', name: 'Testinho', class: 'Guerreiro',
        hp: 30, hpMax: 40, atk: 7, def: 5, spd: 5,
        ene: 8, eneMax: 10, level: 3,
        buffs: [],
        ...overrides,
    };
}

function makeWildEncounter(overrides = {}) {
    return {
        id: 'enc_test',
        wildMonster: makeMonster({ id: 'wm1', name: 'Inimigo', spd: 3 }),
        log: [],
        active: true,
        ...overrides,
    };
}

function makeGroupDeps(overrides = {}) {
    const enc = overrides.enc ?? makeGroupEncounter();
    const player = overrides.player ?? makePlayer();
    const mon = overrides.mon ?? makeMonster({ id: 'pm1' });

    return {
        state: {
            currentEncounter: enc,
            players: [player],
            config: {},
        },
        core: {
            getCurrentActor: () => ({ id: player.id, side: 'player' }),
            hasAlivePlayers: () => true,
            hasAliveEnemies: () => true,
            getCurrentActor: (e) => e.turnOrder?.[e.turnIndex ?? 0] ?? null,
        },
        helpers: {
            getPlayerById: () => player,
            getActiveMonsterOfPlayer: () => mon,
            log: (e, msg) => e.log.push(msg),
            handleVictoryRewards: () => {},
        },
        audio: { playSfx: () => {} },
        storage: { save: () => {} },
        ui: { render: () => {} },
        rollD20: overrides.rollD20 ?? (() => 10),
        fleeType: overrides.fleeType ?? 'normal',
        ...overrides,
    };
}

function makePlayer(overrides = {}) {
    return { id: 'p1', name: 'Treinador', class: 'Guerreiro', team: [], activeIndex: 0, ...overrides };
}

function makeGroupEncounter(overrides = {}) {
    return {
        id: 'genc_test',
        type: 'group',
        participants: ['p1'],
        turnOrder: [{ id: 'p1', side: 'player' }],
        turnIndex: 0,
        finished: false,
        log: [],
        enemies: {},
        ...overrides,
    };
}

// ─── checkFleeCanonical ───────────────────────────────────────────────────────

describe('checkFleeCanonical', () => {
    describe('FLEE_DC constantes', () => {
        it('normal = 12', () => expect(FLEE_DC.normal).toBe(12));
        it('intimidating = 16', () => expect(FLEE_DC.intimidating).toBe(16));
        it('elite = 18', () => expect(FLEE_DC.elite).toBe(18));
    });

    describe('retorna estrutura completa', () => {
        it('deve retornar roll, spd, dc, total, success', () => {
            const mon = makeMonster({ spd: 5 });
            const result = checkFleeCanonical(mon, 10);
            expect(result).toMatchObject({ roll: 10, spd: 5, dc: 12, total: 15, success: true });
        });
    });

    describe('DC normal (12)', () => {
        it('d20=7 + SPD=5 = 12 → sucesso exato', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 7);
            expect(result.total).toBe(12);
            expect(result.success).toBe(true);
        });

        it('d20=6 + SPD=5 = 11 → falha', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 6);
            expect(result.success).toBe(false);
        });

        it('d20=20 + SPD=1 = 21 → sucesso fácil', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 1 }), 20);
            expect(result.success).toBe(true);
        });

        it('d20=1 + SPD=1 = 2 → falha', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 1 }), 1);
            expect(result.success).toBe(false);
        });
    });

    describe('DC intimidating (16)', () => {
        it('d20=11 + SPD=5 = 16 → sucesso exato', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 11, 'intimidating');
            expect(result.total).toBe(16);
            expect(result.success).toBe(true);
        });

        it('d20=10 + SPD=5 = 15 → falha', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 10, 'intimidating');
            expect(result.success).toBe(false);
        });
    });

    describe('DC elite (18)', () => {
        it('d20=13 + SPD=5 = 18 → sucesso exato', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 13, 'elite');
            expect(result.total).toBe(18);
            expect(result.success).toBe(true);
        });

        it('d20=12 + SPD=5 = 17 → falha', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 12, 'elite');
            expect(result.success).toBe(false);
        });
    });

    describe('SPD com buff ativo', () => {
        it('buff de +2 SPD aumenta total', () => {
            // buff format: { type, power, duration }
            const mon = makeMonster({ spd: 3, buffs: [{ type: 'spd', power: 2, duration: 2 }] });
            const result = checkFleeCanonical(mon, 8);
            // SPD efetivo = 3 + 2 = 5; total = 8 + 5 = 13 >= 12
            expect(result.spd).toBe(5);
            expect(result.total).toBe(13);
            expect(result.success).toBe(true);
        });
    });

    describe('fleeType desconhecido → usa normal', () => {
        it('fleeType inválido usa DC normal (12)', () => {
            const result = checkFleeCanonical(makeMonster({ spd: 5 }), 7, 'desconhecido');
            expect(result.dc).toBe(12);
        });
    });
});

// ─── executeWildFlee ──────────────────────────────────────────────────────────

describe('executeWildFlee', () => {
    const baseDeps = {
        classAdvantages: {},
        getBasicPower: () => 7,
        eneRegenData: {},
    };

    it('sucesso: encounter.active = false, result = fled', () => {
        const enc = makeWildEncounter();
        const mon = makeMonster({ spd: 5 });

        const result = executeWildFlee({
            encounter: enc,
            playerMonster: mon,
            fleeType: 'normal',
            dependencies: { ...baseDeps, rollD20: () => 10 }, // 10 + 5 = 15 >= 12
        });

        expect(result).toEqual({ success: true, result: 'fled' });
        expect(enc.active).toBe(false);
        expect(enc.result).toBe('fled');
        expect(enc.log.some(l => l.includes('✅'))).toBe(true);
    });

    it('falha: result = ongoing, encounter ainda ativo', () => {
        const enc = makeWildEncounter();
        const mon = makeMonster({ spd: 1 });

        const result = executeWildFlee({
            encounter: enc,
            playerMonster: mon,
            fleeType: 'normal',
            dependencies: {
                ...baseDeps,
                rollD20: () => 1, // 1 + 1 = 2 < 12
                rollD20EnemyD20: () => 5, // contra-ataque inimigo fraco
            },
        });

        // Pode ser 'ongoing' (sobreviveu ao contra-ataque) ou 'defeat'
        expect(result.success).toBe(true);
        expect(['ongoing', 'defeat']).toContain(result.result);
        expect(enc.log.some(l => l.includes('❌'))).toBe(true);
    });

    it('DC elite exige d20 alto para fugir', () => {
        const enc = makeWildEncounter();
        const mon = makeMonster({ spd: 5 });

        // 10 + 5 = 15 < 18 (elite DC) → falha
        const result = executeWildFlee({
            encounter: enc,
            playerMonster: mon,
            fleeType: 'elite',
            dependencies: { ...baseDeps, rollD20: () => 10 },
        });

        expect(['ongoing', 'defeat']).toContain(result.result);
    });

    it('sem wildMonster retorna invalid', () => {
        const result = executeWildFlee({
            encounter: { log: [] },
            playerMonster: makeMonster(),
            dependencies: baseDeps,
        });

        expect(result).toEqual({ success: false, result: 'invalid' });
    });

    it('log contém roll, SPD, total e DC', () => {
        const enc = makeWildEncounter();
        const mon = makeMonster({ spd: 5 });

        executeWildFlee({
            encounter: enc,
            playerMonster: mon,
            fleeType: 'normal',
            dependencies: { ...baseDeps, rollD20: () => 10 },
        });

        const fleeLog = enc.log.find(l => l.includes('SPD'));
        expect(fleeLog).toBeTruthy();
        expect(fleeLog).toContain('DC 12');
    });
});

// ─── executeGroupFlee ─────────────────────────────────────────────────────────

describe('executeGroupFlee', () => {
    it('sucesso: participante removido, grupo continua', () => {
        const enc = makeGroupEncounter({ participants: ['p1', 'p2'] });
        const deps = makeGroupDeps({ enc, rollD20: () => 15 }); // 15 + 5 = 20 >= 12

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(true);
        expect(result.result).toBe('fled');
        expect(enc.participants).not.toContain('p1');
        expect(enc.participants).toContain('p2');
        expect(enc.finished).toBeFalsy();
    });

    it('sucesso com único participante → result=retreat', () => {
        const enc = makeGroupEncounter({ participants: ['p1'] });
        const deps = makeGroupDeps({ enc, rollD20: () => 15 });

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(true);
        expect(result.result).toBe('fled');
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('retreat');
    });

    it('falha: turno avança, participante permanece', () => {
        const mon = makeMonster({ id: 'pm1', spd: 1, hp: 30, hpMax: 40 });
        const player = makePlayer({ team: [mon], activeIndex: 0 });
        const enc = makeGroupEncounter({ participants: [player.id] });
        const deps = makeGroupDeps({
            enc,
            player,
            mon,
            rollD20: () => 1, // 1 + 1 = 2 < 12
        });

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(true);
        expect(result.result).toBe('failed');
        expect(enc.participants).toContain(player.id);
        expect(enc.finished).toBeFalsy();
    });

    it('boss: retorna boss_no_flee sem rolar dado', () => {
        const enc = makeGroupEncounter({ type: 'boss' });
        const rollFn = () => { throw new Error('não deve rolar dado em boss'); };
        const deps = makeGroupDeps({ enc, rollD20: rollFn });

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(false);
        expect(result.reason).toBe('boss_no_flee');
    });

    it('not_player_turn: retorna reason correto', () => {
        const enc = makeGroupEncounter();
        const deps = makeGroupDeps({ enc });
        deps.core.getCurrentActor = () => ({ id: 'e1', side: 'enemy' });

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(false);
        expect(result.reason).toBe('not_player_turn');
    });

    it('sem encounter: retorna no_encounter', () => {
        const deps = makeGroupDeps({});
        deps.state.currentEncounter = null;

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(false);
        expect(result.reason).toBe('no_encounter');
    });

    it('DC intimidating (16) exige roll alto', () => {
        const mon = makeMonster({ id: 'pm1', spd: 5, hp: 30, hpMax: 40 });
        const player = makePlayer({ team: [mon], activeIndex: 0 });
        const enc = makeGroupEncounter({ participants: [player.id] });
        const deps = makeGroupDeps({
            enc,
            player,
            mon,
            rollD20: () => 10, // 10 + 5 = 15 < 16
            fleeType: 'intimidating',
        });

        const result = executeGroupFlee(deps);

        expect(result.result).toBe('failed');
        expect(enc.participants).toContain(player.id);
    });

    it('log contém informação da rolagem', () => {
        const enc = makeGroupEncounter({ participants: ['p1'] });
        const deps = makeGroupDeps({ enc, rollD20: () => 12 }); // 12 + 5 = 17 >= 12

        executeGroupFlee(deps);

        const fleeLog = enc.log.find(l => l.includes('SPD'));
        expect(fleeLog).toBeTruthy();
        expect(fleeLog).toContain('DC 12');
    });
});
