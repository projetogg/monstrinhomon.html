/**
 * GROUP SKILL EXECUTION TESTS (CAMADA 4C)
 *
 * Testes para as funcionalidades da Camada 4C:
 * - executePlayerAttackGroup com targetEnemyIndex
 * - executePlayerSkillGroup (skills ofensivas e defensivas)
 *
 * Cobertura: parâmetros, lógica de acerto, dano, cura, ENE
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    executePlayerAttackGroup,
    executePlayerSkillGroup
} from '../js/combat/groupActions.js';

// ---------------------------------------------------------------------------
// Helpers para criar mocks
// ---------------------------------------------------------------------------

function makeMon(overrides = {}) {
    return {
        id: 'mi_test',
        name: 'TestMon',
        class: 'Guerreiro',
        hp: 50,
        hpMax: 50,
        atk: 10,
        def: 8,
        spd: 5,
        ene: 10,
        eneMax: 10,
        level: 5,
        buffs: [],
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        id: 'enemy_0',
        name: 'Inimigo',
        class: 'Bárbaro',
        hp: 40,
        hpMax: 40,
        atk: 8,
        def: 6,
        spd: 3,
        level: 3,
        buffs: [],
        ...overrides
    };
}

function makePlayer(mon, overrides = {}) {
    return {
        id: 'player_1',
        name: 'Ana',
        class: 'Guerreiro',
        team: [mon],
        ...overrides
    };
}

function makeSkill(overrides = {}) {
    return {
        id: 'SK_TEST',
        name: 'Golpe Teste',
        class: 'Guerreiro',
        category: 'Ataque',
        power: 8,
        accuracy: 0.9,
        energy_cost: 2,
        target: 'Inimigo',
        status: '',
        desc: 'Teste.',
        ...overrides
    };
}

function makeDeps({ mon, player, enemies, skillById = null, rollD20Val = 15, hitResult = true }) {
    const enc = {
        active: true,
        finished: false,
        participants: [player.id],
        enemies: enemies,
        turnOrder: [{ side: 'player', id: player.id, name: player.name }],
        turnIndex: 0,
        log: [],
        currentActor: { side: 'player', id: player.id, name: player.name }
    };

    const state = {
        currentEncounter: enc,
        players: [player],
        config: { classAdvantages: {} }
    };

    const logs = [];

    const deps = {
        state,
        core: {
            getCurrentActor: (e) => e.currentActor,
            isAlive: (entity) => (Number(entity?.hp) || 0) > 0,
            hasAlivePlayers: () => true,
            hasAliveEnemies: () => enemies.some(e => (e?.hp || 0) > 0),
            checkHit: (d20, attacker, defender) => hitResult,
            calcDamage: ({ atk, def, power, damageMult = 1 }) => Math.max(1, Math.floor((atk + power - def) * damageMult)),
            getBuffModifiers: () => ({ atk: 0, def: 0, spd: 0 }),
            getClassAdvantageModifiers: () => ({ atkBonus: 0, damageMult: 1.0 })
        },
        ui: {
            render: vi.fn(),
            showDamageFeedback: vi.fn(),
            showMissFeedback: vi.fn(),
            playAttackFeedback: vi.fn()
        },
        audio: { playSfx: vi.fn() },
        storage: { save: vi.fn() },
        helpers: {
            getPlayerById: (id) => state.players.find(p => p.id === id),
            getActiveMonsterOfPlayer: (p) => p?.team?.[0],
            getEnemyByIndex: (e, idx) => e.enemies[idx],
            log: (e, msg) => { e.log.push(msg); logs.push(msg); },
            applyEneRegen: vi.fn(),
            updateBuffs: vi.fn(),
            rollD20: () => rollD20Val,
            recordD20Roll: vi.fn(),
            getBasicAttackPower: () => 5,
            applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
            chooseTargetPlayerId: vi.fn(),
            firstAliveIndex: vi.fn(),
            openSwitchMonsterModal: vi.fn(),
            handleVictoryRewards: vi.fn(),
            getSkillById: (id) => skillById,
            canUseSkillNow: (skill, m) => (m.ene >= Number(skill.cost ?? skill.energy_cost ?? 0))
        }
    };

    return { deps, enc, logs };
}

// ---------------------------------------------------------------------------
// executePlayerAttackGroup - targetEnemyIndex
// ---------------------------------------------------------------------------

describe('executePlayerAttackGroup - Parâmetro targetEnemyIndex', () => {
    it('deve usar o primeiro inimigo vivo quando targetEnemyIndex é null', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ hp: 0 }), makeEnemy({ name: 'Segundo', hp: 30 })];
        const { deps, enc } = makeDeps({ mon, player, enemies, rollD20Val: 15 });

        executePlayerAttackGroup(deps, null);

        // O segundo inimigo (índice 1) deve ter recebido dano
        expect(enemies[1].hp).toBeLessThan(30);
        // O primeiro inimigo (morto) não deveria ser afetado
        expect(enemies[0].hp).toBe(0);
    });

    it('deve atacar o inimigo especificado por targetEnemyIndex', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ name: 'Primo', hp: 40 }), makeEnemy({ name: 'Segundo', hp: 40 })];
        const { deps } = makeDeps({ mon, player, enemies, rollD20Val: 15 });

        executePlayerAttackGroup(deps, 1); // alvo: inimigo índice 1

        // Apenas o segundo inimigo deve ter recebido dano
        expect(enemies[1].hp).toBeLessThan(40);
        expect(enemies[0].hp).toBe(40); // não foi afetado
    });

    it('deve retornar true em ataque bem-sucedido', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const { deps } = makeDeps({ mon, player, enemies, rollD20Val: 15 });

        const result = executePlayerAttackGroup(deps, 0);
        expect(result).toBe(true);
    });

    it('deve retornar false se não há encounter ativo', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const { deps } = makeDeps({ mon, player, enemies: [] });
        deps.state.currentEncounter = null;

        const result = executePlayerAttackGroup(deps, 0);
        expect(result).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// executePlayerSkillGroup - Skills ofensivas
// ---------------------------------------------------------------------------

describe('executePlayerSkillGroup - Skills Ofensivas (Ataque)', () => {
    it('deve causar dano ao inimigo com skill de ataque', () => {
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ hp: 40 })];
        const skill = makeSkill({ power: 8, energy_cost: 2, target: 'Inimigo' });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 15 });

        executePlayerSkillGroup('SK_TEST', 0, deps);

        expect(enemies[0].hp).toBeLessThan(40);
    });

    it('deve consumir ENE ao usar skill', () => {
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ energy_cost: 3, target: 'Inimigo' });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 15 });

        executePlayerSkillGroup('SK_TEST', 0, deps);

        expect(mon.ene).toBe(7); // 10 - 3
    });

    it('deve falhar se ENE insuficiente', () => {
        const mon = makeMon({ ene: 1 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ energy_cost: 5, target: 'Inimigo' });
        const { deps, enc } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 15 });

        const result = executePlayerSkillGroup('SK_TEST', 0, deps);

        expect(result).toBe(false);
        expect(enc.log.some(l => l.includes('ENE insuficiente'))).toBe(true);
        // Inimigo não deve ter recebido dano
        expect(enemies[0].hp).toBe(40);
    });

    it('deve registrar ERROU quando d20 = 1 (miss automático)', () => {
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ accuracy: 0.9, target: 'Inimigo' });
        const { deps, enc } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 1 });

        executePlayerSkillGroup('SK_TEST', 0, deps);

        expect(enc.log.some(l => l.includes('ERROU'))).toBe(true);
        expect(enemies[0].hp).toBe(40); // sem dano
    });

    it('deve aplicar dano duplo em CRÍTICO (d20 = 20)', () => {
        const mon = makeMon({ ene: 10, atk: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ def: 2, hp: 100 })];
        const skill = makeSkill({ power: 8, accuracy: 0.9, target: 'Inimigo' });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 20 });

        const hpBefore = enemies[0].hp;
        executePlayerSkillGroup('SK_TEST', 0, deps);
        const dmgCrit = hpBefore - enemies[0].hp;

        // Reset e testar sem crítico
        enemies[0].hp = 100;
        mon.ene = 10;
        const { deps: deps2 } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 15 });
        executePlayerSkillGroup('SK_TEST', 0, deps2);
        const dmgNormal = 100 - enemies[0].hp;

        expect(dmgCrit).toBeGreaterThan(dmgNormal);
    });

    it('deve retornar false se skill não encontrada', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const { deps, enc } = makeDeps({ mon, player, enemies, skillById: null });

        const result = executePlayerSkillGroup('SK_INEXISTENTE', 0, deps);

        expect(result).toBe(false);
        expect(enc.log.some(l => l.includes('não encontrada'))).toBe(true);
    });

    it('deve logar nome da skill e inimigo no log de combate', () => {
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ name: 'DragãoTest' })];
        const skill = makeSkill({ name: 'Golpe Total', target: 'Inimigo' });
        const { deps, enc } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 15 });

        executePlayerSkillGroup('SK_TEST', 0, deps);

        const joined = enc.log.join(' ');
        expect(joined).toContain('Golpe Total');
        expect(joined).toContain('DragãoTest');
    });
});



// ---------------------------------------------------------------------------
// executePlayerSkillGroup - Passivas de espécie
// ---------------------------------------------------------------------------

describe('executePlayerSkillGroup - Passivas de espécie', () => {
    const offensiveSkill = (overrides = {}) => ({
        id: 'SK_SPECIES_DAMAGE',
        name: 'Golpe de Espécie',
        type: 'DAMAGE',
        target: 'enemy',
        power: 8,
        cost: 2,
        accuracy: 1,
        ...overrides,
    });

    const debuffSkill = (overrides = {}) => ({
        id: 'SK_SPECIES_DEBUFF',
        name: 'Debuff de Espécie',
        type: 'BUFF',
        target: 'enemy',
        power: -1,
        cost: 1,
        accuracy: 1,
        ...overrides,
    });

    function runSkill({ monOverrides = {}, skill = offensiveSkill(), rollD20Val = 15, preState = null }) {
        const mon = makeMon(monOverrides);
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ hp: 100, hpMax: 100, def: 6 })];
        const { deps, enc } = makeDeps({ mon, player, enemies, rollD20Val });
        if (preState) enc.passiveState = { ...preState };
        const hpBefore = enemies[0].hp;
        const result = executePlayerSkillGroup(skill, 0, deps);
        return { mon, enemy: enemies[0], enc, result, damage: hpBefore - enemies[0].hp };
    }

    it('emberfang adiciona +1 ATK antes do cálculo da skill ofensiva', () => {
        const base = runSkill({ monOverrides: { canonSpeciesId: null } });
        const passive = runSkill({ monOverrides: { canonSpeciesId: 'emberfang' } });

        expect(passive.damage).toBe(base.damage + 1);
        expect(passive.enc.log.some(line => line.includes('+1 ATK (skill)'))).toBe(true);
    });

    it('emberfang preserva o limite estrito e não ativa exatamente em 70% de HP', () => {
        const base = runSkill({ monOverrides: { hp: 35, hpMax: 50, canonSpeciesId: null } });
        const boundary = runSkill({ monOverrides: { hp: 35, hpMax: 50, canonSpeciesId: 'emberfang' } });

        expect(boundary.damage).toBe(base.damage);
    });

    it('swiftclaw aplica a abertura na primeira skill e registra o consumo', () => {
        const base = runSkill({ monOverrides: { canonSpeciesId: null } });
        const first = runSkill({ monOverrides: { canonSpeciesId: 'swiftclaw' } });

        expect(first.damage).toBe(base.damage + 1);
        expect(first.enc.passiveState.swiftclawFirstStrikeDone).toBe(true);
    });

    it('swiftclaw não concede novo bônus quando a abertura já foi consumida', () => {
        const base = runSkill({ monOverrides: { canonSpeciesId: null } });
        const consumed = runSkill({
            monOverrides: { canonSpeciesId: 'swiftclaw' },
            preState: { swiftclawFirstStrikeDone: true },
        });

        expect(consumed.damage).toBe(base.damage);
    });

    it('moonquill recebe +1 SPD por 1 turno após usar debuff', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'moonquill' },
            skill: debuffSkill(),
        });

        expect(result.mon.buffs).toEqual(expect.arrayContaining([
            expect.objectContaining({
                type: 'spd',
                power: 1,
                duration: 1,
                source: 'moonquill_passive',
            }),
        ]));
    });

    it('shadowsting cria carga após utilizar debuff', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'shadowsting' },
            skill: debuffSkill(),
        });

        expect(result.enc.passiveState.shadowstingDebuffCharged).toBe(true);
    });

    it('bellwave cria carga após qualquer skill válida', () => {
        const result = runSkill({ monOverrides: { canonSpeciesId: 'bellwave' } });

        expect(result.enc.passiveState.bellwaveRhythmCharged).toBe(true);
    });

    it('skill ofensiva que erra ainda despacha ON_SKILL_USED para bellwave', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'bellwave' },
            rollD20Val: 1,
        });

        expect(result.damage).toBe(0);
        expect(result.enc.passiveState.bellwaveRhythmCharged).toBe(true);
    });

    it('ENE insuficiente não cria carga nem estado de passiva', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'bellwave', ene: 0 },
            skill: offensiveSkill({ cost: 2 }),
        });

        expect(result.result).toBe(false);
        expect(result.enc.passiveState).toBeUndefined();
        expect(result.mon.buffs).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// executePlayerSkillGroup - Skills defensivas (Cura/Suporte)
// ---------------------------------------------------------------------------

describe('executePlayerSkillGroup - Skills Defensivas (Cura/Suporte)', () => {
    it('deve curar o caster com skill de Cura (power > 0)', () => {
        const mon = makeMon({ hp: 20, hpMax: 50, ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ category: 'Cura', power: 15, target: 'Aliado', accuracy: 1 });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 10 });

        executePlayerSkillGroup('SK_TEST', null, deps);

        expect(mon.hp).toBe(35); // 20 + 15
    });

    it('deve curar 20% do hpMax quando skill de Cura tem power = 0', () => {
        const mon = makeMon({ hp: 20, hpMax: 50, ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ category: 'Cura', power: 0, target: 'Aliado', accuracy: 1 });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 10 });

        executePlayerSkillGroup('SK_TEST', null, deps);

        expect(mon.hp).toBe(30); // 20 + round(50*0.20) = 20 + 10
    });

    it('não deve ultrapassar hpMax na cura', () => {
        const mon = makeMon({ hp: 48, hpMax: 50, ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ category: 'Cura', power: 30, target: 'Self', accuracy: 1 });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 10 });

        executePlayerSkillGroup('SK_TEST', null, deps);

        expect(mon.hp).toBe(50); // capped ao hpMax
    });

    it('deve logar mensagem de cura com HP recuperado', () => {
        const mon = makeMon({ hp: 20, hpMax: 50, ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ name: 'Sopro Calmante', category: 'Cura', power: 10, target: 'Aliado', accuracy: 1 });
        const { deps, enc } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 10 });

        executePlayerSkillGroup('SK_TEST', null, deps);

        expect(enc.log.some(l => l.includes('Sopro Calmante'))).toBe(true);
        expect(enc.log.some(l => l.includes('10 HP'))).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// executePlayerSkillGroup - Validações gerais
// ---------------------------------------------------------------------------

describe('executePlayerSkillGroup - Validações Gerais', () => {
    it('deve retornar false se encounter não existe', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const skill = makeSkill();
        const { deps } = makeDeps({ mon, player, enemies: [], skillById: skill });
        deps.state.currentEncounter = null;

        const result = executePlayerSkillGroup('SK_TEST', 0, deps);
        expect(result).toBe(false);
    });

    it('deve retornar false se monstrinho está desmaiado', () => {
        const mon = makeMon({ hp: 0 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill();
        const { deps, enc } = makeDeps({ mon, player, enemies, skillById: skill });

        const result = executePlayerSkillGroup('SK_TEST', 0, deps);

        expect(result).toBe(false);
        expect(enc.log.some(l => l.includes('desmaiado'))).toBe(true);
    });

    it('deve retornar true em execução bem-sucedida', () => {
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemies = [makeEnemy()];
        const skill = makeSkill({ target: 'Inimigo' });
        const { deps } = makeDeps({ mon, player, enemies, skillById: skill, rollD20Val: 15 });

        const result = executePlayerSkillGroup('SK_TEST', 0, deps);
        expect(result).toBe(true);
    });
});
