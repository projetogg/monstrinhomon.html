/**
 * ENEMY SKILLS IA TESTS (XVII-E)
 *
 * Testes para a inteligência artificial de seleção de skill dos inimigos.
 * Cobertura:
 * - Mago com ENE ≥ 2 → sempre usa skill (Dano amplificado)
 * - Guerreiro com HP < 40% e ENE ≥ 1 → Postura Defensiva
 * - Curandeiro com aliado fraco → ação heal
 * - Nível ≥ 10 com kit disponível e Math.random < 0.40 → ENE debitado
 * - ENE insuficiente → ataque básico (sem deducted ENE)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeEnemyTurnGroup } from '../js/combat/groupActions.js';
import {
    createGroupEncounter,
    getCurrentActor,
    isAlive,
    hasAlivePlayers,
    hasAliveEnemies,
    getClassAdvantageModifiers,
    calcDamage,
    getBuffModifiers,
    pickEnemyTargetByDEF
} from '../js/combat/groupCore.js';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        uid: 'mi_hero',
        name: 'Heroi',
        class: 'Guerreiro',
        hp: 50, hpMax: 50,
        atk: 10, def: 8, spd: 5,
        ene: 10, eneMax: 10,
        level: 5, buffs: [],
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
        ...overrides
    };
}

function makePlayer(mon) {
    return {
        id: 'player_1', name: 'Jogador', class: 'Guerreiro',
        team: [mon], activeIndex: 0,
        inventory: {}
    };
}

function makeEncWithEnemyTurn(enemies, player, rollVal = 15) {
    const mon = makePlayer(player);
    const enc = createGroupEncounter({
        participantIds: [player.id],
        type: 'group_trainer',
        enemies
    });
    // Definir ator atual como o primeiro inimigo
    enc.turnOrder = [{ side: 'enemy', id: 0, name: enemies[0].name, spd: enemies[0].spd || 3 }];
    enc.turnIndex = 0;
    enc.currentActor = enc.turnOrder[0];
    enc.positions = { [player.id]: 'front' };
    enc.log = [];

    const logs = [];
    const playerObj = player;

    const deps = {
        state: { currentEncounter: enc, players: [playerObj], config: { classAdvantages: {} } },
        core: {
            getCurrentActor,
            isAlive,
            hasAlivePlayers: (e, pl) => hasAlivePlayers(e, pl),
            hasAliveEnemies,
            getBuffModifiers,
            getClassAdvantageModifiers,
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
            log: (e, msg) => { logs.push(msg); if (e?.log) e.log.push(msg); },
            handleVictoryRewards: vi.fn(),
            getPlayerById: id => id === playerObj.id ? playerObj : null,
            getActiveMonsterOfPlayer: p => p?.team?.[p?.activeIndex ?? 0],
            getEnemyByIndex: (e, i) => e?.enemies?.[i],
            firstAliveIndex: team => team.findIndex(m => (Number(m?.hp) || 0) > 0),
            applyEneRegen: vi.fn(),
            updateBuffs: vi.fn(),
            rollD20: () => rollVal,
            recordD20Roll: vi.fn(),
            getBasicAttackPower: () => 7,
            applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
            openSwitchMonsterModal: vi.fn(),
            getItemDef: () => null,
            getSkillById: () => null,
            canUseSkillNow: () => true
        }
    };

    return { enc, deps, logs };
}

// ── Testes ─────────────────────────────────────────────────────────────────

describe('IA inimigo - seleção de skill', () => {

    describe('Mago com ENE ≥ 2 usa skill ofensiva', () => {
        it('registra "Dano amplificado" no log quando Mago tem ENE suficiente', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            const enemy = makeEnemy({ class: 'Mago', hp: 40, hpMax: 40, ene: 5, level: 1 });
            const { deps, logs } = makeEncWithEnemyTurn([enemy], player);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            expect(logs.some(l => l.includes('amplificado'))).toBe(true);
        });

        it('debita ENE do Mago ao usar skill (custo ≥ 1)', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            const enemy = makeEnemy({ class: 'Mago', hp: 40, hpMax: 40, ene: 5, level: 1 });
            const { deps } = makeEncWithEnemyTurn([enemy], player);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            expect(enemy.ene).toBeLessThan(5);
        });
    });

    describe('Mago com ENE < 2 faz ataque básico', () => {
        it('não registra "amplificado" quando ENE insuficiente', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            const enemy = makeEnemy({ class: 'Mago', hp: 40, hpMax: 40, ene: 1, level: 1 });
            const { deps, logs } = makeEncWithEnemyTurn([enemy], player);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            expect(logs.some(l => l.includes('amplificado'))).toBe(false);
        });
    });

    describe('Guerreiro usa Postura Defensiva com HP baixo', () => {
        it('registra "Postura Defensiva" no log quando HP < 40% e ENE ≥ 1', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            // HP = 15 de 40 = 37.5% → abaixo de 40%
            const enemy = makeEnemy({ class: 'Guerreiro', hp: 15, hpMax: 40, ene: 3, level: 3 });
            const { deps, logs } = makeEncWithEnemyTurn([enemy], player);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            expect(logs.some(l => l.includes('Postura Defensiva'))).toBe(true);
        });

        it('Guerreiro com HP > 40% faz ataque básico (sem Postura)', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            // HP = 30 de 40 = 75% → acima de 40%
            const enemy = makeEnemy({ class: 'Guerreiro', hp: 30, hpMax: 40, ene: 3, level: 3 });
            const { deps, logs } = makeEncWithEnemyTurn([enemy], player);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            expect(logs.some(l => l.includes('Postura Defensiva'))).toBe(false);
        });
    });

    describe('Curandeiro cura aliado fraco', () => {
        it('registra cura quando aliado tem HP < 40%', () => {
            const hero = makeMon();
            const player = makePlayer(hero);

            // Curandeiro com aliado fraco
            const healer = makeEnemy({ class: 'Curandeiro', hp: 40, hpMax: 40, ene: 5, level: 5 });
            // Adicionar uid para distinguir
            healer.uid = 'healer';
            const ally = makeEnemy({ class: 'Bárbaro', hp: 10, hpMax: 40, ene: 5, level: 3 });
            ally.uid = 'ally';
            ally.name = 'AligoFraco';

            const { enc, deps, logs } = makeEncWithEnemyTurn([healer, ally], player);

            // Ajustar turnOrder para healer ser o ator
            enc.turnOrder = [{ side: 'enemy', id: 0, name: healer.name, spd: 5 }];
            enc.turnIndex = 0;
            enc.currentActor = enc.turnOrder[0];

            executeEnemyTurnGroup(enc, deps);

            expect(logs.some(l => l.includes('curou'))).toBe(true);
        });
    });

    describe('Nível ≥ 10 com kit disponível usa skill', () => {
        it('debita ENE quando nível ≥ 10, ENE suficiente e random < 0.40', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            // Animalista nível 10, ENE 2 — esk_wild_strike custa 2
            const enemy = makeEnemy({ class: 'Animalista', hp: 40, hpMax: 40, ene: 2, level: 10 });
            const { deps } = makeEncWithEnemyTurn([enemy], player);

            // Mock Math.random para forçar uso de skill (< 0.40)
            const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            // ENE debitado (de 2 → 0) porque skill foi usada
            expect(enemy.ene).toBeLessThan(2);

            randSpy.mockRestore();
        });

        it('NÃO usa skill quando nível ≥ 10, ENE suficiente mas random ≥ 0.40', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            // Caçador nível 10, ENE 2
            const enemy = makeEnemy({ class: 'Caçador', hp: 40, hpMax: 40, ene: 2, level: 10 });
            const eneBefore = enemy.ene;
            const { deps } = makeEncWithEnemyTurn([enemy], player);

            // Mock Math.random para forçar ataque básico (≥ 0.40)
            const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0.80);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            // ENE não debitado — skill não usada
            expect(enemy.ene).toBe(eneBefore);

            randSpy.mockRestore();
        });

        it('não usa skill quando ENE insuficiente mesmo com nível ≥ 10', () => {
            const hero = makeMon();
            const player = makePlayer(hero);
            // Animalista nível 10, ENE 0 — não pode pagar nenhuma skill
            const enemy = makeEnemy({ class: 'Animalista', hp: 40, hpMax: 40, ene: 0, level: 10 });
            const { deps } = makeEncWithEnemyTurn([enemy], player);

            const randSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

            executeEnemyTurnGroup(deps.state.currentEncounter, deps);

            // ENE permanece 0
            expect(enemy.ene).toBe(0);

            randSpy.mockRestore();
        });
    });
});
