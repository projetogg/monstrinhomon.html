/**
 * SPECIES PASSIVES 4.2 TESTS (Fase 4.2)
 *
 * Testa refinamentos das passivas shieldhorn e emberfang:
 *
 *   A. shieldhorn — apenas primeiro hit do turno inimigo
 *   B. emberfang  — apenas skill ofensiva (DAMAGE), não ataque básico
 *   C. Semântica de contexto explícita (isOffensiveSkill, isFirstHitThisTurn)
 *   D. Reset do passiveState entre turnos
 *   E. Regressão: floracura e moonquill não afetados
 *   F. Simulação: emberfang via executeWildSkill (canal correto Fase 4.2)
 *
 * Cobertura:
 *   - shieldhorn: dispara com isFirstHitThisTurn=true (padrão)
 *   - shieldhorn: não dispara com isFirstHitThisTurn=false (segundo hit)
 *   - shieldhorn: passiveState.shieldhornBlockedThisTurn marcado após disparo
 *   - shieldhorn: reset em processEnemyCounterattack (via executeWildEnemyFullTurn)
 *   - emberfang: dispara com isOffensiveSkill=true e HP > 70%
 *   - emberfang: NÃO dispara com isOffensiveSkill=false (ataque básico)
 *   - emberfang: NÃO dispara com isOffensiveSkill=undefined (ataque básico sem flag)
 *   - emberfang: via executeWildSkill com skill DAMAGE e HP > 70%
 *   - emberfang: NÃO via executeWildSkill com skill não-DAMAGE
 *   - Contextos semanticamente corretos em todos os pontos de integração
 */

import { describe, it, expect, vi } from 'vitest';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import {
    executeWildAttack,
    executeWildSkill,
    executeWildEnemyFullTurn,
} from '../js/combat/wildActions.js';

// ===========================================================================
// Helpers
// ===========================================================================

function makeMonster(overrides = {}) {
    return {
        id: 'pm_1', name: 'PM', class: 'Bardo',
        hp: 80, hpMax: 80, atk: 7, def: 4,
        ene: 10, eneMax: 20, buffs: [], ...overrides,
    };
}

function makeWild(overrides = {}) {
    return {
        id: 'w_1', name: 'Wild', class: 'Bardo',
        hp: 60, hpMax: 80, atk: 6, def: 3, poder: 8,
        ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null, ...overrides,
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'p1', name: 'Jogador', class: 'Bardo',
        inventory: {}, team: [], money: 0, ...overrides,
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
// PARTE A — shieldhorn: handler puro com isFirstHitThisTurn
// ===========================================================================

describe('speciesPassives 4.2 — shieldhorn: isFirstHitThisTurn', () => {

    function makeShieldhorn(overrides = {}) {
        return { canonSpeciesId: 'shieldhorn', hp: 60, hpMax: 80, ...overrides };
    }

    it('dispara com isFirstHitThisTurn=true (padrão canônico)', () => {
        const mod = resolvePassiveModifier(makeShieldhorn(), {
            event: 'on_hit_received',
            hpPct: 0.75,
            isFirstHitThisTurn: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.damageReduction).toBe(1);
    });

    it('NÃO dispara com isFirstHitThisTurn=false (segundo hit do turno)', () => {
        const mod = resolvePassiveModifier(makeShieldhorn(), {
            event: 'on_hit_received',
            hpPct: 0.75,
            isFirstHitThisTurn: false,
        });
        expect(mod).toBeNull();
    });

    it('dispara quando isFirstHitThisTurn está ausente no contexto (retrocompatível)', () => {
        // undefined é tratado como true — compatibilidade com callers antigos
        const mod = resolvePassiveModifier(makeShieldhorn(), {
            event: 'on_hit_received',
            hpPct: 0.75,
        });
        expect(mod).not.toBeNull();
        expect(mod.damageReduction).toBe(1);
    });

    it('NÃO dispara em on_attack mesmo com isFirstHitThisTurn=true', () => {
        const mod = resolvePassiveModifier(makeShieldhorn(), {
            event: 'on_attack',
            hpPct: 0.75,
            isFirstHitThisTurn: true,
        });
        expect(mod).toBeNull();
    });

    it('NÃO dispara em on_heal_item', () => {
        const mod = resolvePassiveModifier(makeShieldhorn(), {
            event: 'on_heal_item',
            hpPct: 0.75,
            isFirstHitThisTurn: true,
        });
        expect(mod).toBeNull();
    });

    it('retorna null para instância sem canonSpeciesId', () => {
        expect(resolvePassiveModifier(
            { hp: 60, hpMax: 80 },
            { event: 'on_hit_received', isFirstHitThisTurn: true }
        )).toBeNull();
    });
});

// ===========================================================================
// PARTE B — emberfang: handler puro com isOffensiveSkill
// ===========================================================================

describe('speciesPassives 4.2 — emberfang: isOffensiveSkill', () => {

    function makeEmberfang(hp = 80, hpMax = 80) {
        return { canonSpeciesId: 'emberfang', hp, hpMax };
    }

    it('dispara com isOffensiveSkill=true e HP > 70%', () => {
        const mod = resolvePassiveModifier(makeEmberfang(), {
            event: 'on_attack',
            hpPct: 0.80,
            isOffensiveSkill: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.atkBonus).toBe(1);
    });

    it('NÃO dispara com isOffensiveSkill=false (ataque básico) mesmo com HP > 70%', () => {
        const mod = resolvePassiveModifier(makeEmberfang(), {
            event: 'on_attack',
            hpPct: 0.80,
            isOffensiveSkill: false,
        });
        expect(mod).toBeNull();
    });

    it('NÃO dispara quando isOffensiveSkill está ausente no contexto (semântica Fase 4.2)', () => {
        // undefined é falsy → emberfang não dispara sem flag explícita
        const mod = resolvePassiveModifier(makeEmberfang(), {
            event: 'on_attack',
            hpPct: 0.80,
        });
        expect(mod).toBeNull();
    });

    it('NÃO dispara com isOffensiveSkill=true mas HP = 70% (limite não inclusivo)', () => {
        const mod = resolvePassiveModifier(makeEmberfang(56, 80), {
            event: 'on_attack',
            hpPct: 0.70,
            isOffensiveSkill: true,
        });
        expect(mod).toBeNull();
    });

    it('NÃO dispara com isOffensiveSkill=true mas HP < 70%', () => {
        const mod = resolvePassiveModifier(makeEmberfang(50, 80), {
            event: 'on_attack',
            hpPct: 0.625,
            isOffensiveSkill: true,
        });
        expect(mod).toBeNull();
    });

    it('NÃO dispara em on_hit_received com isOffensiveSkill=true', () => {
        const mod = resolvePassiveModifier(makeEmberfang(), {
            event: 'on_hit_received',
            hpPct: 0.80,
            isOffensiveSkill: true,
        });
        expect(mod).toBeNull();
    });

    it('retorna null para instância sem canonSpeciesId', () => {
        expect(resolvePassiveModifier(
            { hp: 80, hpMax: 80 },
            { event: 'on_attack', hpPct: 0.80, isOffensiveSkill: true }
        )).toBeNull();
    });
});

// ===========================================================================
// PARTE C — Integração: shieldhorn via executeWildEnemyFullTurn + reset de estado
// ===========================================================================

describe('speciesPassives 4.2 — shieldhorn integração e reset de passiveState', () => {

    it('passiveState.shieldhornBlockedThisTurn resetado no início de cada turno inimigo', () => {
        // Quando executeWildEnemyFullTurn é chamado, processEnemyCounterattack reseta o flag
        const pm = makeMonster({ canonSpeciesId: 'shieldhorn', hp: 80, hpMax: 80 });
        const wild = makeWild({ hp: 60 });
        const enc = makeEncounter(wild);
        // Pré-setar como se shieldhorn já tivesse disparado
        enc.passiveState = { shieldhornBlockedThisTurn: true };

        // rollD20=1 → inimigo erra, sem dano, mas o reset deve acontecer
        const deps = makeDeps({ rollD20: () => 1 });
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });

        // Após o turno inimigo, o flag deve ter sido resetado (e ficou false, pois sem hit)
        expect(enc.passiveState.shieldhornBlockedThisTurn).toBe(false);
    });

    it('shieldhorn reduz dano no primeiro hit do turno (hit confirmado)', () => {
        // ATK=7, POWER=10, DEF=4 → dano base = max(1, 7+10-4) = 13
        // Com shieldhorn: max(1, 13-1) = 12
        const pm = makeMonster({ canonSpeciesId: 'shieldhorn', hp: 80, hpMax: 80, def: 4 });
        const wild = makeWild({ atk: 7, hp: 60 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 15 }); // inimigo acerta

        const hpBefore = pm.hp;
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });

        expect(pm.hp).toBe(hpBefore - 12); // dano mitigado em 1
    });

    it('shieldhorn: passiveState.shieldhornBlockedThisTurn=true após primeiro hit', () => {
        const pm = makeMonster({ canonSpeciesId: 'shieldhorn', hp: 80, hpMax: 80, def: 4 });
        const wild = makeWild({ atk: 7, hp: 60 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 15 });

        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });

        // Após hit confirmado com shieldhorn, flag deve estar true
        expect(enc.passiveState?.shieldhornBlockedThisTurn).toBe(true);
    });

    it('shieldhorn: dois turnos inimigos consecutivos — ambos mitigam (reset entre turnos)', () => {
        // Cada turno reseta o flag → shieldhorn mitiga em AMBOS os turnos
        const pm = makeMonster({ canonSpeciesId: 'shieldhorn', hp: 80, hpMax: 80, def: 4 });
        const wild = makeWild({ atk: 7, hp: 60 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 15 });

        const hpBefore = pm.hp;

        // Primeiro turno inimigo: shieldhorn mitiga (-1)
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        const hpAfterTurn1 = pm.hp;
        expect(hpBefore - hpAfterTurn1).toBe(12); // 13-1=12

        // Segundo turno inimigo: flag é resetado → shieldhorn mitiga novamente
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        const hpAfterTurn2 = pm.hp;
        expect(hpAfterTurn1 - hpAfterTurn2).toBe(12); // novamente 12 (mitiga)
    });

    it('shieldhorn: log registra a mitigação', () => {
        const pm = makeMonster({ canonSpeciesId: 'shieldhorn', hp: 80, hpMax: 80, def: 4 });
        const wild = makeWild({ atk: 7, hp: 60 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 15 });

        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });

        const hasShieldLog = enc.log.some(l => l.includes('🛡️') && l.includes('Passiva'));
        expect(hasShieldLog).toBe(true);
    });

    it('sem canonSpeciesId: nenhuma mitigação mesmo com flag isFirstHitThisTurn=true', () => {
        const pm = makeMonster({ hp: 80, hpMax: 80, def: 4 }); // sem canonSpeciesId
        const wild = makeWild({ atk: 7, hp: 60 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 15 });

        const hpBefore = pm.hp;
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });

        // Sem passiva: max(1, 7+10-4) = 13 de dano
        expect(hpBefore - pm.hp).toBe(13);
    });
});

// ===========================================================================
// PARTE D — Integração: emberfang via executeWildSkill (canal correto Fase 4.2)
// ===========================================================================

const DAMAGE_SKILL = {
    id: 'sk_atk', name: 'Magia Elemental I',
    type: 'DAMAGE', power: 20, cost: 4,
    target: 'Inimigo',
};

const BUFF_SKILL = {
    id: 'sk_buff', name: 'Escudo I',
    type: 'BUFF', target: 'self', power: 2,
    buffType: 'DEF', duration: 2, cost: 4,
};

const DEBUFF_SKILL = {
    id: 'sk_debuff', name: 'Enfraquecer I',
    type: 'BUFF', target: 'enemy', power: -2,
    buffType: 'ATK', duration: 2, cost: 4,
};

describe('speciesPassives 4.2 — emberfang via executeWildSkill', () => {

    it('emberfang: buff ATK adicionado antes de useSkill com skill DAMAGE e HP > 70%', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        let capturedBuffs = null;
        // Captura os buffs do attacker no momento em que useSkill é chamado
        const useSkill = vi.fn((attacker) => {
            capturedBuffs = [...(attacker.buffs || [])];
            return true;
        });
        const deps = makeSkillDeps(useSkill, { _skills: [DAMAGE_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // O buff emberfang deve ter sido visto dentro de useSkill
        const emberfangBuff = capturedBuffs?.find(b => b.source === 'emberfang_passive');
        expect(emberfangBuff).toBeDefined();
        expect(emberfangBuff.power).toBe(1);
        expect(emberfangBuff.type).toBe('atk');
    });

    it('emberfang: buff removido do array buffs após useSkill (não persiste)', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), { _skills: [DAMAGE_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Após a skill, o buff emberfang deve ter sido removido
        const emberfangBuff = pm.buffs.find(b => b.source === 'emberfang_passive');
        expect(emberfangBuff).toBeUndefined();
    });

    it('emberfang: log registra o bônus de ATK ao usar skill ofensiva', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), { _skills: [DAMAGE_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const hasEmberfangLog = enc.log.some(l => l.includes('✨') && l.includes('ATK') && l.includes('skill ofensiva'));
        expect(hasEmberfangLog).toBe(true);
    });

    it('emberfang: NÃO dispara em skill BUFF (mesmo com HP > 70%)', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        let capturedBuffs = null;
        const useSkill = vi.fn((attacker) => {
            capturedBuffs = [...(attacker.buffs || [])];
            return true;
        });
        const deps = makeSkillDeps(useSkill, { _skills: [BUFF_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const emberfangBuff = capturedBuffs?.find(b => b.source === 'emberfang_passive');
        expect(emberfangBuff).toBeUndefined();
    });

    it('emberfang: NÃO dispara em skill debuff (BUFF+enemy)', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        let capturedBuffs = null;
        const useSkill = vi.fn((attacker) => {
            capturedBuffs = [...(attacker.buffs || [])];
            return true;
        });
        const deps = makeSkillDeps(useSkill, { _skills: [DEBUFF_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const emberfangBuff = capturedBuffs?.find(b => b.source === 'emberfang_passive');
        expect(emberfangBuff).toBeUndefined();
    });

    it('emberfang: NÃO dispara em skill DAMAGE com HP = 70% (limite não inclusivo)', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 56, hpMax: 80, ene: 10, buffs: [] }); // 70%
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        let capturedBuffs = null;
        const useSkill = vi.fn((attacker) => {
            capturedBuffs = [...(attacker.buffs || [])];
            return true;
        });
        const deps = makeSkillDeps(useSkill, { _skills: [DAMAGE_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const emberfangBuff = capturedBuffs?.find(b => b.source === 'emberfang_passive');
        expect(emberfangBuff).toBeUndefined();
    });

    it('instância sem canonSpeciesId: nenhum buff de emberfang em skill DAMAGE', () => {
        const pm = makeMonster({ hp: 80, hpMax: 80, ene: 10, buffs: [] }); // sem canonSpeciesId
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        let capturedBuffs = null;
        const useSkill = vi.fn((attacker) => {
            capturedBuffs = [...(attacker.buffs || [])];
            return true;
        });
        const deps = makeSkillDeps(useSkill, { _skills: [DAMAGE_SKILL], rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(capturedBuffs?.find(b => b.source === 'emberfang_passive')).toBeUndefined();
    });
});

// ===========================================================================
// PARTE E — executeWildAttack: emberfang NÃO dispara (ataque básico)
// ===========================================================================

describe('speciesPassives 4.2 — executeWildAttack: emberfang não dispara', () => {

    it('emberfang com HP > 70%: sem bônus ATK em ataque básico', () => {
        // ATK=7, POWER=10, DEF=3 → dano = max(1, 7+10-3) = 14 (sem emberfang)
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, atk: 7 });
        const wild = makeWild({ hp: 50, def: 3 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 }); // inimigo erra

        const hpBefore = wild.hp;
        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: pm, d20Roll: 15, dependencies: deps });

        expect(hpBefore - wild.hp).toBe(14); // sem +1 ATK de emberfang
    });

    it('nenhum log de passiva ATK em ataque básico com emberfang', () => {
        const pm = makeMonster({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80, atk: 7 });
        const wild = makeWild({ hp: 50, def: 3 });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 });

        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: pm, d20Roll: 15, dependencies: deps });

        const hasAtkLog = enc.log.some(l => l.includes('✨') && l.includes('ATK'));
        expect(hasAtkLog).toBe(false);
    });
});

// ===========================================================================
// PARTE F — Semântica de contexto: todos os pontos de integração
// ===========================================================================

describe('speciesPassives 4.2 — semântica de contexto nos pontos de integração', () => {

    it('shieldhorn: isFirstHitThisTurn=true em player vs wild (executeWildAttack)', () => {
        // Quando player ataca wild com shieldhorn, deve sempre passar isFirstHitThisTurn=true
        // pois player só ataca 1x por turno → shieldhorn sempre mitiga
        const pm = makeMonster({ atk: 7, hp: 80 });
        const wild = makeWild({ hp: 50, def: 3, canonSpeciesId: 'shieldhorn' });
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 1 });

        const hpBefore = wild.hp;
        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: pm, d20Roll: 15, dependencies: deps });

        // dano = max(1, 7+10-3) = 14 → com shieldhorn = 13
        expect(hpBefore - wild.hp).toBe(13);
    });

    it('emberfang: isOffensiveSkill=false em processEnemyBasicAttack', () => {
        // Inimigo com emberfang usando ataque básico: NÃO deve receber bônus ATK
        // wild(atk=7), pm(def=4) → dano = max(1, 7+10-4) = 13 (sem emberfang)
        const pm = makeMonster({ hp: 80, hpMax: 80, def: 4 });
        const wild = makeWild({ atk: 7, hp: 60, canonSpeciesId: 'emberfang' }); // inimigo com emberfang
        const enc = makeEncounter(wild);
        const deps = makeDeps({ rollD20: () => 15 });

        const hpBefore = pm.hp;
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });

        // Sem bônus emberfang em ataque básico → dano = 13
        expect(hpBefore - pm.hp).toBe(13);
    });

    it('emberfang: isOffensiveSkill=true em processEnemySkillAttack com skill DAMAGE', () => {
        // Inimigo com emberfang usando skill DAMAGE e HP > 70%: recebe +1 ATK
        // wild(atk=7), skill.power=15, pm(def=4) → dano = max(1, (7+1)+15-4) = 19
        const pm = makeMonster({ hp: 80, hpMax: 80, def: 4 });
        const enemySkill = { energy_cost: 2, power: 15, name: 'Ataque', type: 'DAMAGE' };
        const wild = makeWild({ atk: 7, hp: 70, hpMax: 80, ene: 10, canonSpeciesId: 'emberfang', skill: enemySkill });
        const enc = makeEncounter(wild);
        // rollD20=15 → inimigo acerta com skill
        const deps = makeDeps({ rollD20: () => 15 });

        const hpBefore = pm.hp;
        // Forçar uso de skill: garantir que a IA escolherá skill (ene >= energy_cost)
        // O código usa Math.random() < 0.5 para decidir skill vs basic — mock para skill
        const origRandom = Math.random;
        Math.random = () => 0.1; // < 0.5 → usa skill
        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        Math.random = origRandom;

        // HP wild = 70/80 = 87.5% > 70% → emberfang ativo
        // Dano = max(1, (7+1) + 15 - 4) = 19
        expect(hpBefore - pm.hp).toBe(19);
    });
});

// ===========================================================================
// PARTE G — Regressão: floracura e moonquill não afetados por Fase 4.2
// ===========================================================================

describe('speciesPassives 4.2 — regressão floracura e moonquill', () => {

    it('floracura: handler não afetado por novos campos isOffensiveSkill e isFirstHitThisTurn', () => {
        const instance = { canonSpeciesId: 'floracura', hp: 40, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_heal_item',
            hpPct: 0.5,
            isFirstHeal: true,
            isOffensiveSkill: false,    // campo novo Fase 4.2 — não afeta floracura
            isFirstHitThisTurn: true,   // campo novo Fase 4.2 — não afeta floracura
        });
        expect(mod).not.toBeNull();
        expect(mod.healBonus).toBe(3);
    });

    it('moonquill: handler não afetado por novos campos isOffensiveSkill e isFirstHitThisTurn', () => {
        const instance = { canonSpeciesId: 'moonquill', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            hpPct: 0.75,
            isDebuff: true,
            isOffensiveSkill: false,    // campo novo Fase 4.2 — não afeta moonquill
            isFirstHitThisTurn: true,   // campo novo Fase 4.2 — não afeta moonquill
        });
        expect(mod).not.toBeNull();
        expect(mod.spdBuff).toBeDefined();
        expect(mod.spdBuff.power).toBe(1);
    });

    it('moonquill: floracura NÃO ativa em on_skill_used', () => {
        const instance = { canonSpeciesId: 'floracura', hp: 40, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            isDebuff: true,
        });
        expect(mod).toBeNull();
    });

    it('shieldhorn NÃO ativa em on_skill_used', () => {
        const instance = { canonSpeciesId: 'shieldhorn', hp: 60, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_skill_used',
            isDebuff: true,
            isFirstHitThisTurn: true,
        });
        expect(mod).toBeNull();
    });

    it('emberfang NÃO ativa em on_heal_item', () => {
        const instance = { canonSpeciesId: 'emberfang', hp: 80, hpMax: 80 };
        const mod = resolvePassiveModifier(instance, {
            event: 'on_heal_item',
            isFirstHeal: true,
            isOffensiveSkill: true,
        });
        expect(mod).toBeNull();
    });
});
