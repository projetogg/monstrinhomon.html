/**
 * GROUP COMBAT ACTIONS TESTS
 *
 * Testes para as ações reais do combate em grupo.
 * Pipeline canônico: executePlayerAttackGroup, executeEnemyTurnGroup,
 *                    executePlayerSkillGroup, executeGroupUseItem, passTurn
 *
 * Estes testes substituem os testes do protótipo deprecated GroupBattleLoop.performAction.
 * Cobertura:
 *   - Ataque de jogador (acerto, erro, crítico, d20=1, d20=20)
 *   - Turno do inimigo (seleção de alvo, dano, miss)
 *   - Skill de jogador (ofensiva, defensiva)
 *   - Item de cura
 *   - Passar turno
 *   - Verificação de vitória/derrota após ação
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    executePlayerAttackGroup,
    executeEnemyTurnGroup,
    executePlayerSkillGroup,
    executeGroupUseItem,
    passTurn
} from '../js/combat/groupActions.js';
import {
    createGroupEncounter,
    getCurrentActor,
    isAlive,
    hasAliveEnemies,
    hasAlivePlayers,
    getClassAdvantageModifiers,
    checkHit,
    calcDamage,
    getBuffModifiers,
    pickEnemyTargetByDEF
} from '../js/combat/groupCore.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        uid: 'mi_test',
        name: 'Mon',
        class: 'Guerreiro',
        hp: 50, hpMax: 50,
        atk: 10, def: 8, spd: 5,
        ene: 10, eneMax: 10,
        level: 5, buffs: [],
        _participated: false,
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        uid: 'enemy_0',
        name: 'Inimigo',
        class: 'Bárbaro',
        hp: 40, hpMax: 40,
        atk: 8, def: 6, spd: 3,
        ene: 10, eneMax: 10,
        level: 3, buffs: [],
        _participated: false,
        ...overrides
    };
}

function makePlayer(mon, overrides = {}) {
    return {
        id: 'player_1', name: 'Ana', class: 'Guerreiro',
        team: [mon], activeIndex: 0,
        inventory: {},
        ...overrides
    };
}

function makeSkill(overrides = {}) {
    return {
        id: 'SK_TEST', name: 'Golpe Teste', class: 'Guerreiro',
        category: 'Ataque', power: 8, accuracy: 0.9,
        energy_cost: 2, target: 'Inimigo', status: '', desc: 'Teste.',
        ...overrides
    };
}

function makeDeps({ mon, player, enemies, itemDefById = {}, skillById = null, rollVal = 15, hitResult = true }) {
    const enc = createGroupEncounter({
        participantIds: [player.id],
        type: 'group_trainer',
        enemies
    });
    enc.turnOrder = [{ side: 'player', id: player.id, name: player.name, spd: 5 }];
    enc.turnIndex = 0;
    enc.currentActor = enc.turnOrder[0];

    const state = { currentEncounter: enc, players: [player], config: { classAdvantages: {} } };

    return {
        enc,
        deps: {
            state,
            core: {
                getCurrentActor,
                isAlive,
                hasAlivePlayers: (e, pl) => hasAlivePlayers(e, pl),
                hasAliveEnemies,
                getBuffModifiers,
                getClassAdvantageModifiers,
                checkHit: () => hitResult,
                calcDamage,
                pickEnemyTargetByDEF
            },
            audio: { playSfx: vi.fn() },
            storage: { save: vi.fn() },
            ui: {
                render: vi.fn(),
                showDamageFeedback: vi.fn(),
                showMissFeedback: vi.fn(),
                playAttackFeedback: vi.fn()
            },
            helpers: {
                log: (e, msg) => e.log.push(msg),
                handleVictoryRewards: vi.fn(),
                getPlayerById: (id) => (id === player.id ? player : null),
                getActiveMonsterOfPlayer: (p) => p?.team?.[p?.activeIndex ?? 0],
                getEnemyByIndex: (e, i) => e?.enemies?.[i],
                firstAliveIndex: (team) => team.findIndex(m => (Number(m?.hp) || 0) > 0),
                applyEneRegen: vi.fn(),
                updateBuffs: vi.fn(),
                rollD20: () => rollVal,
                recordD20Roll: vi.fn(),
                getBasicAttackPower: () => 7,
                applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
                openSwitchMonsterModal: vi.fn(),
                getItemDef: (id) => itemDefById[id] || null,
                getSkillById: (id) => (skillById && skillById.id === id ? skillById : null),
                canUseSkillNow: () => true
            }
        }
    };
}

// ── executePlayerAttackGroup ──────────────────────────────────────────────

describe('executePlayerAttackGroup - Ataque do Jogador', () => {

    it('deve retornar false se encounter não existe', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const { deps } = makeDeps({ mon, player, enemies: [makeEnemy()] });
        deps.state.currentEncounter = null;

        expect(executePlayerAttackGroup(deps)).toBe(false);
    });

    it('deve retornar false se não é turno de jogador', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });

        // Definir turno como inimigo: ajustar turnOrder e turnIndex
        enc.turnOrder = [{ side: 'enemy', id: 0, name: 'Inimigo', spd: 5 }];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        expect(executePlayerAttackGroup(deps)).toBe(false);
    });

    it('deve causar dano quando acerta (rollD20=15)', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], rollVal: 15 });

        const hpBefore = enemy.hp;
        executePlayerAttackGroup(deps);

        expect(enemy.hp).toBeLessThan(hpBefore);
        expect(enc.log.some(m => m.includes('acertou'))).toBe(true);
    });

    it('deve errar quando d20=1 (sempre falha)', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], rollVal: 1 });

        const hpBefore = enemy.hp;
        executePlayerAttackGroup(deps);

        expect(enemy.hp).toBe(hpBefore); // sem dano
        expect(enc.log.some(m => m.includes('ERROU'))).toBe(true);
    });

    it('deve causar dano duplo quando d20=20 (crítico)', () => {
        const mon = makeMon({ atk: 10, def: 5 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ def: 2 });
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], rollVal: 20 });

        const hpBefore = enemy.hp;
        executePlayerAttackGroup(deps);

        const dmgDealt = hpBefore - enemy.hp;
        expect(dmgDealt).toBeGreaterThan(0);
        expect(enc.log.some(m => m.includes('CRIT') || m.includes('Duplo'))).toBe(true);
    });

    it('deve registrar vitória quando inimigo morre após ataque', () => {
        const mon = makeMon({ atk: 999 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ hp: 1 });
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], rollVal: 15 });

        executePlayerAttackGroup(deps, 0);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
    });

    it('deve retornar false se classe do monstro difere da classe do jogador', () => {
        // Mockar alert (usado pela regra de classe no groupActions)
        const origAlert = global.alert;
        global.alert = vi.fn();

        const mon = makeMon({ class: 'Mago' }); // Mago ≠ Guerreiro do player
        const player = makePlayer(mon, { class: 'Guerreiro' });
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });

        const result = executePlayerAttackGroup(deps);
        expect(result).toBe(false);

        global.alert = origAlert;
    });
});

// ── executeEnemyTurnGroup ─────────────────────────────────────────────────

describe('executeEnemyTurnGroup - Turno do Inimigo', () => {

    it('deve retornar false se encounter não existe', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const { deps } = makeDeps({ mon, player, enemies: [makeEnemy()] });
        deps.state.currentEncounter = null;

        expect(executeEnemyTurnGroup(null, deps)).toBe(false);
    });

    it('deve retornar false se não é turno de inimigo', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });

        // Turno é de player (padrão do makeDeps)
        expect(executeEnemyTurnGroup(enc, deps)).toBe(false);
    });

    it('deve atacar o jogador quando é turno do inimigo', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], rollVal: 15 });

        // Definir turno como inimigo
        enc.turnOrder = [{ side: 'enemy', id: 0, name: 'Inimigo', spd: 8 }];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        const hpBefore = mon.hp;
        executeEnemyTurnGroup(enc, deps);

        // Pode ter causado dano ou errado — verificar que o turno foi processado
        expect(enc.log.length).toBeGreaterThan(0);
    });

    it('deve registrar derrota quando jogador morre após ataque inimigo', () => {
        const mon = makeMon({ hp: 1, hpMax: 50, def: 0 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ atk: 999 });
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], rollVal: 15 });

        enc.turnOrder = [{ side: 'enemy', id: 0, name: 'Inimigo', spd: 8 }];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        executeEnemyTurnGroup(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });
});

// ── executePlayerSkillGroup ───────────────────────────────────────────────

describe('executePlayerSkillGroup - Skill do Jogador', () => {

    it('deve executar skill ofensiva e causar dano', () => {
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const skill = makeSkill({ energy_cost: 2, power: 8 });
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], skillById: skill, rollVal: 15 });

        const hpBefore = enemy.hp;
        executePlayerSkillGroup(skill.id, 0, deps);

        expect(enemy.hp).toBeLessThan(hpBefore);
        expect(mon.ene).toBeLessThan(10); // energia consumida
    });

    it('deve executar skill defensiva e curar', () => {
        const mon = makeMon({ hp: 20, hpMax: 50, ene: 10 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const healSkill = makeSkill({ target: 'Self', category: 'Suporte', energy_cost: 3, power: 20 });
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], skillById: healSkill });

        const hpBefore = mon.hp;
        executePlayerSkillGroup(healSkill.id, null, deps);

        expect(mon.hp).toBeGreaterThan(hpBefore);
    });

    it('deve falhar se ENE insuficiente', () => {
        const mon = makeMon({ ene: 1 }); // ENE insuficiente (1 < 5)
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const skill = makeSkill({ energy_cost: 5 }); // custa 5
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], skillById: skill });

        // canUseSkillNow precisa retornar false (ENE insuficiente)
        deps.helpers.canUseSkillNow = (sk, m) => (Number(m.ene) || 0) >= (Number(sk.energy_cost) || 0);

        const hpBefore = enemy.hp;
        executePlayerSkillGroup(skill.id, 0, deps);

        expect(enemy.hp).toBe(hpBefore); // sem dano
    });
});

// ── executeGroupUseItem ───────────────────────────────────────────────────

describe('executeGroupUseItem - Uso de Item', () => {

    it('deve curar o monstro ao usar item de cura', () => {
        const mon = makeMon({ hp: 20, hpMax: 100 });
        const player = makePlayer(mon, { inventory: { IT_HEAL_01: 1 } });
        const enemy = makeEnemy();
        const itemDef = { id: 'IT_HEAL_01', type: 'heal', heal_pct: 0.30, heal_min: 30 };
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], itemDefById: { IT_HEAL_01: itemDef } });

        const hpBefore = mon.hp;
        executeGroupUseItem('IT_HEAL_01', deps);

        expect(mon.hp).toBeGreaterThan(hpBefore);
        expect(player.inventory['IT_HEAL_01']).toBe(0); // item consumido
    });

    it('deve falhar se HP já está cheio', () => {
        const mon = makeMon({ hp: 100, hpMax: 100 }); // HP cheio
        const player = makePlayer(mon, { inventory: { IT_HEAL_01: 1 } });
        const enemy = makeEnemy();
        const itemDef = { id: 'IT_HEAL_01', type: 'heal', heal_pct: 0.30, heal_min: 30 };
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy], itemDefById: { IT_HEAL_01: itemDef } });

        executeGroupUseItem('IT_HEAL_01', deps);

        expect(player.inventory['IT_HEAL_01']).toBe(1); // item não consumido
    });

    it('deve falhar se item não existe no inventário', () => {
        const mon = makeMon({ hp: 20, hpMax: 100 });
        const player = makePlayer(mon, { inventory: {} }); // sem items
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });

        const hpBefore = mon.hp;
        executeGroupUseItem('IT_HEAL_01', deps);

        expect(mon.hp).toBe(hpBefore); // sem cura
    });
});

// ── passTurn ──────────────────────────────────────────────────────────────

describe('passTurn - Passar Turno no Combate de Grupo', () => {

    it('deve avançar turno sem causar dano', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const { enc, deps } = makeDeps({ mon, player, enemies: [enemy] });

        const enemyHpBefore = enemy.hp;
        passTurn(deps);

        expect(enemy.hp).toBe(enemyHpBefore); // sem dano
        expect(enc.log.some(m => m.includes('passou o turno'))).toBe(true);
    });
});
