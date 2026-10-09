import { describe, expect, it, vi } from 'vitest';
import { executeWildAttack, executeWildSkill } from '../js/combat/wildActions.js';

function makeFight() {
    const mon = {
        id: 'swift_1', name: 'Swift', class: 'Caçador', canonSpeciesId: 'swiftclaw',
        hp: 100, hpMax: 100, atk: 10, def: 6, spd: 10, ene: 30, eneMax: 30,
        level: 10, buffs: [],
    };
    const wildMonster = {
        id: 'enemy_1', name: 'Alvo', class: 'Mago', hp: 300, hpMax: 300,
        atk: 1, def: 3, spd: 5, ene: 0, eneMax: 10, level: 10, buffs: [],
    };
    const player = { id: 'p1', name: 'Jogador', class: 'Caçador', inventory: {}, team: [mon] };
    const encounter = {
        id: 'wild_312', active: true, selectedPlayerId: player.id, wildMonster, log: [],
    };
    const damage = { name: 'Flecha I', type: 'DAMAGE', target: 'enemy', power: 10, cost: 2 };
    const control = {
        name: 'Armadilha I', type: 'BUFF', target: 'enemy',
        power: -2, buffType: 'SPD', duration: 1, cost: 2,
    };
    let damageLands = true;
    let skillIsValid = true;
    const observedAtk = [];
    const deps = {
        getMonsterSkills: () => [damage, control],
        useSkill: vi.fn((attacker, skill, enemy) => {
            if (!skillIsValid) return false;
            if (skill.type === 'DAMAGE') {
                const attackBonus = attacker.buffs
                    .filter(buff => buff?.type === 'atk')
                    .reduce((sum, buff) => sum + buff.power, 0);
                observedAtk.push(attacker.atk + attackBonus);
                if (damageLands) enemy.hp = Math.max(0, enemy.hp - 12);
            }
            return true;
        }),
        eneRegenData: {}, classAdvantages: {}, getBasicPower: () => 8,
        rollD20: () => 1, recordD20Roll: vi.fn(),
        tutorialOnAction: vi.fn(), markAsParticipated: vi.fn(),
        handleVictoryRewards: vi.fn(), audio: null,
        ui: { showFloatingText: vi.fn(), flashTarget: vi.fn(), updateDiceClash: vi.fn() },
    };
    return {
        mon, wildMonster, player, encounter, damage, control, deps, observedAtk,
        setDamageLands: value => { damageLands = value; },
        setSkillIsValid: value => { skillIsValid = value; },
        useSkillIndex: index => executeWildSkill({
            encounter, player, playerMonster: mon, skillIndex: index, dependencies: deps,
        }),
        basic: (attackRoll, defenseRoll) => executeWildAttack({
            encounter, player, playerMonster: mon,
            d20Roll: attackRoll, defenderRoll: defenseRoll, dependencies: deps,
        }),
    };
}

describe('DEC-SP04-OPENING-01 — swiftclaw primeiro acerto no Wild', () => {
    it('skill de controle não ativa nem consome; DAMAGE posterior é beneficiada', () => {
        const f = makeFight();
        f.useSkillIndex(1);
        expect(f.encounter.passiveState?.swiftclawFirstStrikeDone).not.toBe(true);
        expect(f.encounter.log.filter(line => line.includes('Passiva Swift'))).toHaveLength(0);
        f.useSkillIndex(0);
        expect(f.observedAtk).toEqual([11]);
        expect(f.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
        f.useSkillIndex(0);
        expect(f.observedAtk).toEqual([11, 10]);
        expect(f.encounter.log.filter(line => line.includes('Passiva Swift'))).toHaveLength(1);
    });

    it('skill DAMAGE que não atinge HP não consome abertura nem registra ativação', () => {
        const f = makeFight();
        f.setDamageLands(false);
        f.useSkillIndex(0);
        expect(f.observedAtk).toEqual([11]); // bônus provisório visto no cálculo
        expect(f.encounter.passiveState?.swiftclawFirstStrikeDone).not.toBe(true);
        expect(f.encounter.log.filter(line => line.includes('Passiva Swift'))).toHaveLength(0);
        expect(f.mon.buffs.filter(buff => buff.source === 'emberfang_passive')).toHaveLength(0);
        f.setDamageLands(true);
        f.useSkillIndex(0);
        expect(f.observedAtk).toEqual([11, 11]);
        expect(f.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
        expect(f.encounter.log.filter(line => line.includes('Passiva Swift'))).toHaveLength(1);
    });

    it('falha do adapter e ENE insuficiente não ativam nem consomem', () => {
        const f = makeFight();
        f.mon.ene = 0;
        const invalid = f.useSkillIndex(0);
        expect(invalid.success).toBe(false);
        expect(f.encounter.passiveState?.swiftclawFirstStrikeDone).not.toBe(true);
        f.mon.ene = 30;
        f.setSkillIsValid(false);
        expect(f.useSkillIndex(0).success).toBe(false);
        expect(f.encounter.passiveState?.swiftclawFirstStrikeDone).not.toBe(true);
        expect(f.encounter.log.filter(line => line.includes('Passiva Swift'))).toHaveLength(0);
        f.setSkillIsValid(true);
        expect(f.useSkillIndex(0).success).toBe(true);
        expect(f.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
    });

    it('básico que erra preserva abertura para uma skill acertada', () => {
        const f = makeFight();
        f.basic(1, 20);
        expect(f.encounter.passiveState?.swiftclawFirstStrikeDone).not.toBe(true);
        f.useSkillIndex(0);
        expect(f.observedAtk).toEqual([11]);
        expect(f.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
    });

    it('básico confirmado usa abertura e impede bônus em skill seguinte', () => {
        const f = makeFight();
        f.basic(20, 1);
        expect(f.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
        f.useSkillIndex(0);
        expect(f.observedAtk).toEqual([10]);
        expect(f.encounter.log.filter(line => line.includes('Passiva Swift'))).toHaveLength(1);
    });

    it('outro encontro começa com a abertura disponível', () => {
        const first = makeFight();
        first.useSkillIndex(0);
        const second = makeFight();
        second.useSkillIndex(0);
        expect(first.observedAtk).toEqual([11]);
        expect(second.observedAtk).toEqual([11]);
        expect(second.encounter.passiveState.swiftclawFirstStrikeDone).toBe(true);
    });
});
