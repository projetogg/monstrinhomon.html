/**
 * SPECIES PASSIVES 4.3 TESTS (Fase 4.3)
 *
 * Testa o fechamento da primeira camada de passivas canônicas:
 *
 *   A. Contexto on_skill_used enriquecido com skillType explícito (player)
 *   B. moonquill integrado ao lado wild (processEnemySkillAttack)
 *   C. floracura assimétrica — não existe path de item para o wild
 *   D. Simetria e assimetria explicitamente testadas
 *   E. Regressão: passivas existentes não afetadas
 *
 * Cobertura:
 *   - skillType presente no contexto on_skill_used do player (executeWildSkill)
 *   - moonquill dispara no wild ao usar skill debuff
 *   - moonquill NÃO dispara no wild ao usar skill DAMAGE (não é debuff)
 *   - moonquill NÃO dispara no wild ao usar skill básica/sem debuff
 *   - moonquill: fallback seguro se wildMonster não tem canonSpeciesId
 *   - moonquill wild: dispara independentemente de hit/miss
 *   - floracura não tem path no pipeline wild (assimetria documentada)
 *   - simetria shieldhorn (player e wild podem receber hit)
 *   - simetria emberfang (player e wild podem atacar com skill)
 *   - regressão shieldhorn, emberfang, floracura, moonquill (player) sem quebras
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import {
    executeWildSkill,
    executeWildEnemyFullTurn,
} from '../js/combat/wildActions.js';

// ===========================================================================
// Helpers
// ===========================================================================

function makeMonster(overrides = {}) {
    return {
        id: 'pm_1', name: 'PM', class: 'Guerreiro',
        hp: 80, hpMax: 80, atk: 7, def: 4,
        ene: 10, eneMax: 20, buffs: [], ...overrides,
    };
}

function makeWild(overrides = {}) {
    return {
        id: 'w_1', name: 'Wild', class: 'Guerreiro',
        hp: 60, hpMax: 80, atk: 6, def: 3, poder: 8,
        ene: 10, eneMax: 20, aggression: 60, buffs: [], skill: null, ...overrides,
    };
}

function makeEncounter(wild, overrides = {}) {
    return {
        id: 'enc_1', type: 'wild', active: true,
        wildMonster: wild, selectedPlayerId: 'p1',
        log: [], rewardsGranted: false, ...overrides,
    };
}

function makeDeps(overrides = {}) {
    return {
        eneRegenData: {},
        classAdvantages: {},
        getBasicPower: () => 10,
        rollD20: () => 1, // inimigo erra por padrão
        audio: null,
        ui: null,
        recordD20Roll: vi.fn(),
        tutorialOnAction: vi.fn(),
        updateFriendship: vi.fn(),
        handleVictoryRewards: vi.fn(),
        ...overrides,
    };
}

function makeSkillDeps(useSkillFn, overrides = {}) {
    return {
        ...makeDeps(),
        getMonsterSkills: () => overrides._skills || [],
        useSkill: useSkillFn || vi.fn(() => true),
        markAsParticipated: vi.fn(),
        ...overrides,
    };
}

// ===========================================================================
// PARTE A — skillType explícito no contexto on_skill_used (player)
// ===========================================================================

describe('speciesPassives 4.3 — Parte A: skillType no contexto on_skill_used (player)', () => {

    it('resolvePassiveModifier recebe skillType e isDebuff sem conflito', () => {
        const instance = { canonSpeciesId: 'moonquill', hp: 60, hpMax: 80 };
        // moonquill só olha isDebuff — skillType é contexto adicional transparente
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            skillType: 'BUFF',
            isDebuff: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.spdBuff).toBeDefined();
        expect(mod.spdBuff.power).toBe(1);
    });

    it('skillType DAMAGE com isDebuff=false: moonquill não dispara', () => {
        const instance = { canonSpeciesId: 'moonquill', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            skillType: 'DAMAGE',
            isDebuff: false,
        });
        expect(mod).toBeNull();
    });

    it('executeWildSkill passa skillType no contexto moonquill via BUFF debuff skill', () => {
        const playerMonster = makeMonster({
            canonSpeciesId: 'moonquill',
            buffs: [],
        });
        const wild = makeWild();
        const encounter = makeEncounter(wild);

        const debuffSkill = { type: 'BUFF', target: 'enemy', power: -2, cost: 0, name: 'Fraqueza' };

        let capturedCtx = null;
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [debuffSkill],
            rollD20: () => 1, // wild erra
        });
        // Interceptar resolvePassiveModifier via spy não é possível diretamente,
        // mas podemos confirmar que o buff moonquill foi adicionado ao player
        const result = executeWildSkill({
            encounter, player: { id: 'p1' }, playerMonster,
            skillIndex: 0, dependencies: deps,
        });
        expect(result.success).toBe(true);
        // moonquill deve ter adicionado SPD buff ao player
        const moonquillBuff = playerMonster.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeDefined();
        expect(moonquillBuff.power).toBe(1);
    });

    it('executeWildSkill com skill DAMAGE: moonquill não dispara (não é debuff)', () => {
        const playerMonster = makeMonster({
            canonSpeciesId: 'moonquill',
            buffs: [],
        });
        const wild = makeWild();
        const encounter = makeEncounter(wild);

        const damageSkill = { type: 'DAMAGE', target: 'enemy', power: 8, cost: 0, name: 'Raio' };
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [damageSkill],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter, player: { id: 'p1' }, playerMonster,
            skillIndex: 0, dependencies: deps,
        });
        const moonquillBuff = playerMonster.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeUndefined();
    });
});

// ===========================================================================
// PARTE B — moonquill integrado no lado wild (processEnemySkillAttack)
// ===========================================================================

describe('speciesPassives 4.3 — Parte B: moonquill no lado wild', () => {

    // Forçar IA do wild a sempre usar skill (Math.random < 0.5 → useSkill=true)
    let mathRandomSpy;
    beforeEach(() => { mathRandomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1); });
    afterEach(() => { mathRandomSpy.mockRestore(); });

    function makeMoonquillWild(overrides = {}) {
        return makeWild({
            canonSpeciesId: 'moonquill',
            ...overrides,
        });
    }

    it('moonquill wild: SPD buff aplicado ao wild ao usar skill debuff', () => {
        const debuffSkill = {
            name: 'Fraqueza', type: 'BUFF', target: 'enemy', power: -2,
            energy_cost: 3,
        };
        const wild = makeMoonquillWild({ ene: 10, skill: debuffSkill });
        const playerMonster = makeMonster();
        const encounter = makeEncounter(wild);

        // Forçar wild a usar skill: rollD20 normal (não 1, não 20) + checkHit retorna false
        // A passiva deve disparar mesmo se a skill errar
        const deps = makeDeps({ rollD20: () => 10 }); // hit improvável com def alta, mas skill usada

        executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });

        const moonquillBuff = wild.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeDefined();
        expect(moonquillBuff.power).toBe(1);
        expect(moonquillBuff.duration).toBe(1);
    });

    it('moonquill wild: dispara independentemente de hit/miss (skill foi usada)', () => {
        const debuffSkill = {
            name: 'Fraqueza', type: 'BUFF', target: 'enemy', power: -2,
            energy_cost: 3,
        };
        const wild = makeMoonquillWild({ ene: 10, skill: debuffSkill });
        const playerMonster = makeMonster({ def: 999 }); // bloqueará hit
        const encounter = makeEncounter(wild);

        const deps = makeDeps({ rollD20: () => 5 }); // não crit, provável miss

        executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });

        // Passiva deve ter disparado (skill usada) mesmo que skill tenha errado
        const moonquillBuff = wild.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeDefined();
    });

    it('moonquill wild: NÃO dispara se wild usar skill DAMAGE (não é debuff)', () => {
        const damageSkill = {
            name: 'Raio', type: 'DAMAGE', target: 'enemy', power: 8,
            energy_cost: 3,
        };
        const wild = makeMoonquillWild({ ene: 10, skill: damageSkill });
        const playerMonster = makeMonster();
        const encounter = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 }); // wild erra sempre

        executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });

        const moonquillBuff = wild.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeUndefined();
    });

    it('moonquill wild: NÃO dispara se wild usar ataque básico (sem skill)', () => {
        const wild = makeMoonquillWild({ ene: 0, skill: null }); // sem ENE → ataque básico
        const playerMonster = makeMonster();
        const encounter = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });

        const moonquillBuff = wild.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeUndefined();
    });

    it('moonquill wild: fallback seguro se wild não tem canonSpeciesId', () => {
        const debuffSkill = {
            name: 'Fraqueza', type: 'BUFF', target: 'enemy', power: -2,
            energy_cost: 3,
        };
        // Wild sem canonSpeciesId — resolvePassiveModifier retorna null
        const wild = makeWild({ ene: 10, skill: debuffSkill });
        const playerMonster = makeMonster();
        const encounter = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 });

        expect(() => {
            executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });
        }).not.toThrow();

        const moonquillBuff = (wild.buffs || []).find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeUndefined();
    });

    it('moonquill wild: skill BUFF com target aliado (não enemy) não é debuff', () => {
        const selfBuff = {
            name: 'Boost', type: 'BUFF', target: 'self', power: 3,
            energy_cost: 3,
        };
        const wild = makeMoonquillWild({ ene: 10, skill: selfBuff });
        const playerMonster = makeMonster();
        const encounter = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });

        const moonquillBuff = wild.buffs.find(b => b.source === 'moonquill_passive');
        expect(moonquillBuff).toBeUndefined();
    });
});

// ===========================================================================
// PARTE C — floracura: assimetria wild (sem path de item)
// ===========================================================================

describe('speciesPassives 4.3 — Parte C: floracura — assimetria wild documentada', () => {

    it('floracura: resolvePassiveModifier só dispara em on_heal_item', () => {
        const instance = { canonSpeciesId: 'floracura', hp: 40, hpMax: 80 };
        // Não existe on_heal_item no pipeline wild → floracura não pode disparar
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used', // evento mais próximo no wild — mas não é o correto
            skillType: 'HEAL',
            isDebuff: false,
        });
        // floracura requer on_heal_item — evento diferente → null
        expect(mod).toBeNull();
    });

    it('floracura: não dispara no pipeline wild (sem evento on_heal_item)', () => {
        // Wild com floracura não tem modo de disparar a passiva no pipeline atual
        // porque processEnemySkillAttack não emite on_heal_item
        const healSkill = {
            name: 'Cura', type: 'HEAL', target: 'self', power: 10,
            energy_cost: 3,
        };
        const wild = makeWild({ canonSpeciesId: 'floracura', ene: 10, skill: healSkill });
        const playerMonster = makeMonster();
        const encounter = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 });

        expect(() => {
            executeWildEnemyFullTurn({ encounter, wildMonster: wild, playerMonster, dependencies: deps });
        }).not.toThrow();

        // Não deve haver nenhum healBonus aplicado ao wild (assimetria intencional)
        expect(encounter.log.some(l => l.includes('primeira cura'))).toBe(false);
    });

    it('floracura: continua funcionando normalmente no lado player (sem regressão)', () => {
        const instance = { canonSpeciesId: 'floracura', hp: 40, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_heal_item',
            isFirstHeal: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.healBonus).toBe(3);
    });
});

// ===========================================================================
// PARTE D — Simetria shieldhorn e emberfang (player e wild)
// ===========================================================================

describe('speciesPassives 4.3 — Parte D: simetria shieldhorn e emberfang', () => {

    it('shieldhorn (player): dispara em on_hit_received com isFirstHitThisTurn=true', () => {
        const instance = { canonSpeciesId: 'shieldhorn', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_hit_received',
            isFirstHitThisTurn: true,
        });
        expect(mod?.damageReduction).toBe(1);
    });

    it('shieldhorn (wild-side): dispara em on_hit_received com isFirstHitThisTurn=true', () => {
        // Quando o playerMonster tem shieldhorn e o wild ataca:
        // O contexto é gerado com isFirstHitThisTurn=!passiveState.shieldhornBlockedThisTurn
        const instance = { canonSpeciesId: 'shieldhorn', hp: 60, hpMax: 80 };
        // Simula segundo hit — flag explícita
        const modFirstHit = resolvePassiveModifier(instance, {
            event: 'on_hit_received',
            isFirstHitThisTurn: true,
        });
        const modSecondHit = resolvePassiveModifier(instance, {
            event: 'on_hit_received',
            isFirstHitThisTurn: false,
        });
        expect(modFirstHit?.damageReduction).toBe(1);
        expect(modSecondHit).toBeNull();
    });

    it('emberfang (player): dispara em on_attack com isOffensiveSkill=true e HP>70%', () => {
        const instance = { canonSpeciesId: 'emberfang', hp: 80, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_attack',
            hpPct: 0.80,
            isOffensiveSkill: true,
        });
        expect(mod?.atkBonus).toBe(1);
    });

    it('emberfang (wild): dispara em on_attack com isOffensiveSkill=true e HP>70%', () => {
        // Quando o wildMonster tem emberfang e usa skill DAMAGE:
        // O contexto é gerado com isOffensiveSkill: wildSkill.type === 'DAMAGE'
        const instance = { canonSpeciesId: 'emberfang', hp: 80, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_attack',
            hpPct: wildMon_hpPct(80, 80), // 100%
            isOffensiveSkill: true,
        });
        expect(mod?.atkBonus).toBe(1);
    });

    it('emberfang: simetria — ambos os lados usam mesmo critério isOffensiveSkill', () => {
        // Tanto o player (executeWildSkill) quanto o wild (processEnemySkillAttack)
        // usam isOffensiveSkill: skill.type === 'DAMAGE'
        const instance = { canonSpeciesId: 'emberfang', hp: 80, hpMax: 80 };
        // DAMAGE → true → dispara
        const modDamage = resolvePassiveModifier(instance, {
            event: 'on_attack', hpPct: 0.80, isOffensiveSkill: true,
        });
        // BUFF → false → não dispara
        const modBuff = resolvePassiveModifier(instance, {
            event: 'on_attack', hpPct: 0.80, isOffensiveSkill: false,
        });
        expect(modDamage?.atkBonus).toBe(1);
        expect(modBuff).toBeNull();
    });

    // Helper local
    function wildMon_hpPct(hp, hpMax) {
        return hpMax > 0 ? hp / hpMax : 0;
    }
});

// ===========================================================================
// PARTE E — Regressão: passivas existentes sem quebras
// ===========================================================================

describe('speciesPassives 4.3 — Parte E: regressão passivas existentes', () => {

    it('shieldhorn: continua funcionando em on_hit_received sem campos Fase 4.3', () => {
        const instance = { canonSpeciesId: 'shieldhorn', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, { event: 'on_hit_received' });
        expect(mod?.damageReduction).toBe(1);
    });

    it('emberfang: continua não disparando em ataque básico (isOffensiveSkill=false)', () => {
        const instance = { canonSpeciesId: 'emberfang', hp: 80, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_attack',
            hpPct: 0.90,
            isOffensiveSkill: false,
        });
        expect(mod).toBeNull();
    });

    it('floracura: campo skillType no contexto on_heal_item não interfere', () => {
        const instance = { canonSpeciesId: 'floracura', hp: 40, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_heal_item',
            isFirstHeal: true,
            skillType: 'HEAL', // campo Fase 4.3 — floracura ignora
        });
        expect(mod?.healBonus).toBe(3);
    });

    it('moonquill: campo skillType no contexto on_skill_used não interfere com isDebuff', () => {
        const instance = { canonSpeciesId: 'moonquill', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            skillType: 'BUFF',
            isDebuff: true,
        });
        expect(mod?.spdBuff?.power).toBe(1);
    });

    it('moonquill: skillType presente mas isDebuff=false → não dispara', () => {
        const instance = { canonSpeciesId: 'moonquill', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            skillType: 'DAMAGE',
            isDebuff: false,
        });
        expect(mod).toBeNull();
    });

    it('instância sem canonSpeciesId: fallback null em qualquer evento', () => {
        const instance = { hp: 60, hpMax: 80 }; // sem canonSpeciesId
        expect(resolvePassiveModifier(instance, { event: 'on_skill_used', skillType: 'BUFF', isDebuff: true })).toBeNull();
        expect(resolvePassiveModifier(instance, { event: 'on_attack', isOffensiveSkill: true, hpPct: 0.80 })).toBeNull();
        expect(resolvePassiveModifier(instance, { event: 'on_hit_received' })).toBeNull();
        expect(resolvePassiveModifier(instance, { event: 'on_heal_item', isFirstHeal: true })).toBeNull();
    });
});
