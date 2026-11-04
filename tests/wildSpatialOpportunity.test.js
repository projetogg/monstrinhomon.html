import { expect, test } from 'vitest';
import * as Wild from '../js/combat/wildActions.js';

function scenario() {
    const unit = (name, className, species) => ({
        name, class: className, canonSpeciesId: species, hp: 40, hpMax: 40,
        ene: 6, eneMax: 10, level: 1, atk: 8, def: 5, spd: 5, buffs: [],
    });
    const playerMonster = unit('Ferrozimon', 'Guerreiro', 'shieldhorn');
    const wildMonster = unit('Miaumon', 'Caçador', 'swiftclaw');
    const player = { id: 'demo', name: 'Demo', class: playerMonster.class, team: [playerMonster] };
    const encounter = { wildMonster, active: true, log: [], selectedPlayerId: player.id };
    const dependencies = { classAdvantages: {}, eneRegenData: {}, getBasicPower: () => 7, rollD20: () => 13 };
    return { encounter, player, playerMonster, dependencies };
}

test('o ataque isolado preserva o dano no alvo e não resolve reação', () => {
    const regular = scenario();
    const isolated = scenario();
    for (const options of [regular, isolated]) {
        const result = Wild.executeWildAttack({
            ...options, d20Roll: 17, defenderRoll: 5, deferEnemyResponse: options === isolated,
        });
        expect(result.success).toBe(true);
    }
    expect(regular.encounter.wildMonster.hp).toBeLessThan(40);
    expect(isolated.encounter.wildMonster.hp).toBe(regular.encounter.wildMonster.hp);
    expect(isolated.playerMonster.hp).toBe(40);
    expect(regular.encounter.log.filter(line => line.includes('Wild Miaumon ATK'))).toHaveLength(1);
    expect(isolated.encounter.log.filter(line => line.includes('Wild Miaumon ATK'))).toHaveLength(0);
});

test('a técnica isolada preserva efeito e custo, sem resolver reação', () => {
    const skill = { type: 'DAMAGE', target: 'enemy', name: 'Golpe Pesado I', cost: 3, power: 9 };
    const isolated = scenario();
    const regular = scenario();
    for (const options of [regular, isolated]) {
        const { dependencies } = options;
        dependencies.getMonsterSkills = () => [skill];
        dependencies.useSkill = (actor, move, target, encounter) =>
            Wild.applyWildSkillEffect(actor, move, target, encounter, dependencies.classAdvantages);
        const result = Wild.executeWildSkill({ ...options, skillIndex: 0, deferEnemyResponse: options === isolated });
        expect(result.success).toBe(true);
    }
    expect(isolated.playerMonster.ene).toBe(4);
    expect(isolated.encounter.wildMonster.hp).toBe(regular.encounter.wildMonster.hp);
    expect(isolated.encounter.wildMonster.hp).toBe(28);
    expect(isolated.playerMonster.hp).toBe(40);
    expect(regular.encounter.log.filter(line => line.includes('Wild Miaumon ATK'))).toHaveLength(1);
    expect(isolated.encounter.log.filter(line => line.includes('Wild Miaumon ATK'))).toHaveLength(0);
});

test('passar e atacar aplicam início de oportunidade uma vez, e somente atacar afeta o alvo', () => {
    const setup = scenario();
    const enemy = setup.encounter.wildMonster;
    const player = setup.playerMonster;
    setup.dependencies.rollD20 = (() => { let index = 0; return () => [18, 5][index++ % 2]; })();
    expect(Wild.executeWildPlayerPass(setup).success).toBe(true);
    expect(player.ene).toBe(7);
    expect(Wild.executeWildEnemyOpportunity({ ...setup, action: 'pass' }).success).toBe(true);
    expect(enemy.ene).toBe(7);
    expect(player.hp).toBe(40);
    expect(Wild.executeWildEnemyOpportunity({ ...setup, action: 'basic' }).success).toBe(true);
    expect(enemy.ene).toBe(8);
    expect(player.hp).toBeLessThan(40);
    expect(setup.encounter.log.filter(line => line.includes('Wild Miaumon ATK'))).toHaveLength(1);
});

test('a extração de dano preserva DEF fracionária e multiplicador do Wild legado', () => {
    expect(Wild.calculateWildSkillDamage({ atk: 8, def: 5.5, power: 9, damageMult: 1.1 })).toBe(12);
});

test('o laboratório pode manter o crítico e suprimir o prêmio cosmético', () => {
    const setup = scenario();
    setup.dependencies.criticalRewards = false;
    Wild.executeWildAttack({ ...setup, d20Roll: 20, defenderRoll: 1, deferEnemyResponse: true });
    expect(setup.encounter.log.filter(line => line.includes('CRÍTICO 20'))).toHaveLength(1);
    expect(setup.encounter.log.filter(line => /Ganhou|inspiração/.test(line))).toHaveLength(0);
});
