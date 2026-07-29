import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { executeWildSkill } from '../js/combat/wildActions.js';
import { executePlayerSkillGroup } from '../js/combat/groupActions.js';

const WILD_SOURCE = readFileSync(new URL('../js/combat/wildActions.js', import.meta.url), 'utf8');
const GROUP_SOURCE = readFileSync(new URL('../js/combat/groupActions.js', import.meta.url), 'utf8');

function makeMonster(canonSpeciesId = null, overrides = {}) {
    return {
        id: 'mon_1',
        name: 'Mon',
        class: 'Bardo',
        hp: 100,
        hpMax: 100,
        atk: 10,
        def: 6,
        spd: 5,
        ene: 10,
        eneMax: 10,
        level: 5,
        buffs: [],
        canonSpeciesId,
        ...overrides,
    };
}

function makeEnemy(overrides = {}) {
    return {
        id: 'enemy_1',
        name: 'Alvo',
        class: 'Bardo',
        hp: 1,
        hpMax: 1,
        atk: 1,
        def: 1,
        spd: 1,
        ene: 0,
        eneMax: 10,
        level: 1,
        buffs: [],
        ...overrides,
    };
}

function makeOffensiveSkill(overrides = {}) {
    return {
        id: 'SK_FINAL_DAMAGE',
        name: 'Golpe Final',
        type: 'DAMAGE',
        target: 'enemy',
        power: 8,
        cost: 1,
        accuracy: 1,
        ...overrides,
    };
}

function makeDebuffSkill(overrides = {}) {
    return {
        id: 'SK_FINAL_DEBUFF',
        name: 'Debuff Final',
        type: 'BUFF',
        target: 'enemy',
        power: -1,
        cost: 1,
        accuracy: 1,
        ...overrides,
    };
}

function atkWithBuffs(mon) {
    const bonus = (mon.buffs || [])
        .filter(buff => buff?.type === 'atk')
        .reduce((sum, buff) => sum + (Number(buff.power) || 0), 0);
    return (Number(mon.atk) || 0) + bonus;
}

function buffModifiers(entity) {
    const result = { atk: 0, def: 0, spd: 0 };
    for (const buff of (entity?.buffs || [])) {
        if (buff?.type in result) result[buff.type] += Number(buff.power) || 0;
    }
    return result;
}

function runWildSkill({ speciesId = null, monOverrides = {}, skill = makeOffensiveSkill() }) {
    const mon = makeMonster(speciesId, monOverrides);
    const enemy = makeEnemy();
    const player = {
        id: 'p1',
        name: 'Jogador',
        class: mon.class,
        team: [mon],
        inventory: {},
    };
    const encounter = {
        id: 'wild_final',
        type: 'wild',
        active: true,
        selectedPlayerId: player.id,
        wildMonster: enemy,
        log: [],
    };
    let observedAtk = null;

    const result = executeWildSkill({
        encounter,
        player,
        playerMonster: mon,
        skillIndex: 0,
        dependencies: {
            eneRegenData: {},
            classAdvantages: {},
            getBasicPower: () => 7,
            rollD20: () => 1,
            audio: null,
            ui: null,
            getMonsterSkills: () => [skill],
            useSkill: vi.fn((attacker, _skill, target) => {
                observedAtk = atkWithBuffs(attacker);
                target.hp = 0;
                return true;
            }),
            handleVictoryRewards: vi.fn(),
            tutorialOnAction: vi.fn(),
            markAsParticipated: vi.fn(),
        },
    });

    return { mon, enemy, encounter, result, observedAtk };
}

function runGroupSkill({ speciesId = null, monOverrides = {}, skill = makeOffensiveSkill() }) {
    const mon = makeMonster(speciesId, monOverrides);
    const enemy = makeEnemy();
    const player = {
        id: 'p1',
        name: 'Jogador',
        class: mon.class,
        team: [mon],
        inventory: {},
    };
    const encounter = {
        id: 'group_final',
        type: 'group',
        active: true,
        finished: false,
        participants: [player.id],
        enemies: [enemy],
        turnOrder: [{ side: 'player', id: player.id, name: player.name }],
        turnIndex: 0,
        currentActor: { side: 'player', id: player.id, name: player.name },
        log: [],
    };
    const state = {
        currentEncounter: encounter,
        players: [player],
        config: { classAdvantages: {} },
    };
    let observedAtk = null;

    const deps = {
        state,
        core: {
            getCurrentActor: enc => enc.currentActor,
            isAlive: entity => (Number(entity?.hp) || 0) > 0,
            hasAlivePlayers: () => true,
            hasAliveEnemies: enc => (enc.enemies || []).some(target => (Number(target?.hp) || 0) > 0),
            getBuffModifiers: buffModifiers,
            getClassAdvantageModifiers: () => ({ atkBonus: 0, damageMult: 1 }),
            calcDamage: ({ atk }) => {
                observedAtk = atk;
                return 10;
            },
        },
        ui: {
            render: vi.fn(),
            showDamageFeedback: vi.fn(),
            showMissFeedback: vi.fn(),
            playAttackFeedback: vi.fn(),
        },
        audio: { playSfx: vi.fn() },
        storage: { save: vi.fn() },
        helpers: {
            getPlayerById: id => state.players.find(candidate => candidate.id === id),
            getActiveMonsterOfPlayer: candidate => candidate?.team?.[0] || null,
            getEnemyByIndex: (enc, index) => enc.enemies?.[index] || null,
            applyEneRegen: vi.fn(),
            updateBuffs: vi.fn(),
            rollD20: () => 15,
            recordD20Roll: vi.fn(),
            log: (enc, message) => enc.log.push(message),
            applyDamage: (target, damage) => {
                target.hp = Math.max(0, (Number(target.hp) || 0) - damage);
            },
            getSkillById: () => skill,
            canUseSkillNow: (candidateSkill, candidateMon) =>
                (Number(candidateMon.ene) || 0) >= Number(candidateSkill.cost ?? candidateSkill.energy_cost ?? 0),
            applyEneRegenData: vi.fn(),
            chooseTargetPlayerId: vi.fn(),
            firstAliveIndex: vi.fn(() => 0),
            handleVictoryRewards: vi.fn(),
            openSwitchMonsterModal: vi.fn(),
            getBasicAttackPower: () => 7,
        },
    };

    const result = executePlayerSkillGroup(skill, 0, deps);
    return { mon, enemy, encounter, result, observedAtk };
}

function comparableSpdBuffs(result) {
    return (result.mon.buffs || [])
        .filter(buff => buff?.source === 'moonquill_passive')
        .map(buff => ({ type: buff.type, power: buff.power, duration: buff.duration }));
}

describe('Passivas de espécie v2.2 — revalidação final Wild × Group', () => {
    it('PARITY: emberfang adiciona o mesmo +1 ATK em skill ofensiva bem-sucedida', () => {
        const wildBase = runWildSkill({ speciesId: null });
        const wildPassive = runWildSkill({ speciesId: 'emberfang' });
        const groupBase = runGroupSkill({ speciesId: null });
        const groupPassive = runGroupSkill({ speciesId: 'emberfang' });

        expect(wildPassive.observedAtk - wildBase.observedAtk).toBe(1);
        expect(groupPassive.observedAtk - groupBase.observedAtk).toBe(1);
        expect(wildPassive.observedAtk).toBe(groupPassive.observedAtk);
    });

    it('PARITY: emberfang preserva o limite estrito de 70% nos dois modos', () => {
        const wild = runWildSkill({
            speciesId: 'emberfang',
            monOverrides: { hp: 70, hpMax: 100 },
        });
        const group = runGroupSkill({
            speciesId: 'emberfang',
            monOverrides: { hp: 70, hpMax: 100 },
        });

        expect(wild.observedAtk).toBe(10);
        expect(group.observedAtk).toBe(10);
    });

    it('PARITY: swiftclaw aplica o mesmo bônus e consome a abertura na primeira skill', () => {
        const wild = runWildSkill({ speciesId: 'swiftclaw' });
        const group = runGroupSkill({ speciesId: 'swiftclaw' });

        expect(wild.observedAtk).toBe(11);
        expect(group.observedAtk).toBe(11);
        expect(wild.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
        expect(group.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
    });

    it('PARITY: moonquill produz o mesmo buff de SPD após debuff bem-sucedido', () => {
        const skill = makeDebuffSkill();
        const wild = runWildSkill({ speciesId: 'moonquill', skill });
        const group = runGroupSkill({ speciesId: 'moonquill', skill });

        expect(comparableSpdBuffs(wild)).toEqual([
            { type: 'spd', power: 1, duration: 1 },
        ]);
        expect(comparableSpdBuffs(group)).toEqual(comparableSpdBuffs(wild));
    });

    it('PARITY: shadowsting cria a mesma carga após debuff bem-sucedido', () => {
        const skill = makeDebuffSkill();
        const wild = runWildSkill({ speciesId: 'shadowsting', skill });
        const group = runGroupSkill({ speciesId: 'shadowsting', skill });

        expect(wild.encounter.passiveState.shadowstingDebuffCharged).toBe(true);
        expect(group.encounter.passiveState.shadowstingDebuffCharged).toBe(true);
    });

    it('PARITY: bellwave cria a mesma carga após skill válida bem-sucedida', () => {
        const wild = runWildSkill({ speciesId: 'bellwave' });
        const group = runGroupSkill({ speciesId: 'bellwave' });

        expect(wild.encounter.passiveState.bellwaveRhythmCharged).toBe(true);
        expect(group.encounter.passiveState.bellwaveRhythmCharged).toBe(true);
    });

    it('PARITY: wildpace adiciona o mesmo +1 ATK em skill com HP abaixo de 40%', () => {
        const wild = runWildSkill({
            speciesId: 'wildpace',
            monOverrides: { hp: 30, hpMax: 100 },
        });
        const group = runGroupSkill({
            speciesId: 'wildpace',
            monOverrides: { hp: 30, hpMax: 100 },
        });

        expect(wild.observedAtk).toBe(11);
        expect(group.observedAtk).toBe(11);
    });

    it('PARITY: ENE insuficiente não cria estado de passiva em nenhum modo', () => {
        const skill = makeOffensiveSkill({ cost: 2 });
        const wild = runWildSkill({
            speciesId: 'bellwave',
            monOverrides: { ene: 0 },
            skill,
        });
        const group = runGroupSkill({
            speciesId: 'bellwave',
            monOverrides: { ene: 0 },
            skill,
        });

        expect(wild.result).toEqual({ success: false, result: 'invalid' });
        expect(group.result).toBe(false);
        expect(wild.encounter.passiveState).toBeUndefined();
        expect(group.encounter.passiveState).toBeUndefined();
    });

    it('EVIDENCE_GAP: Wild não expõe localmente erro de acurácia como o Group', () => {
        const wildFailureIndex = WILD_SOURCE.indexOf("if (!success) return { success: false, result: 'invalid' }");
        const wildSkillUsedIndex = WILD_SOURCE.indexOf('fireCombatEvent(playerMonster, ON_SKILL_USED');
        const groupMissIndex = GROUP_SOURCE.indexOf('if (!hit) {');
        const groupMissDispatchIndex = GROUP_SOURCE.indexOf(
            'dispatchPlayerSpeciesSkillUsed(skill, { mon, monName, enc, helpers });',
            groupMissIndex,
        );

        expect(wildFailureIndex).toBeGreaterThanOrEqual(0);
        expect(wildSkillUsedIndex).toBeGreaterThan(wildFailureIndex);
        expect(groupMissIndex).toBeGreaterThanOrEqual(0);
        expect(groupMissDispatchIndex).toBeGreaterThan(groupMissIndex);
    });
});
