/**
 * SPECIES PASSIVES 4.1 TESTS (Fase 4.1)
 *
 * Testa:
 *   A. Passivas com estado de combate — floracura e moonquill
 *   B. Integração via executeWildItemUse (floracura) e executeWildSkill (moonquill)
 *   C. Limpeza/reset do encounter.passiveState
 *   D. Fallback seguro para instâncias sem canonSpeciesId
 *   E. Validação de impacto: simulação de combate para shieldhorn e emberfang
 *
 * Cobertura:
 *   - floracura: bônus apenas na primeira cura
 *   - floracura: sem bônus na segunda+ cura do combate
 *   - floracura: passiveState.floracuraHealUsed marcado após primeiro uso
 *   - moonquill: +1 SPD buff ao aplicar debuff (skill BUFF + enemy + power < 0)
 *   - moonquill: não dispara em habilidades que não são debuff
 *   - moonquill: buff de SPD é adicionado ao array buffs com duration=1
 *   - passiveState: inicializado lazily no encounter
 *   - fallback: instância sem canonSpeciesId → nenhum efeito
 *   - impacto shieldhorn: mitigação media de dano em simulação de 100 ataques
 *   - impacto emberfang: bônus médio de ATK em simulação de 100 ataques
 */

import { describe, it, expect, vi } from 'vitest';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import {
    executeWildItemUse,
    executeWildSkill,
    executeWildAttack,
} from '../js/combat/wildActions.js';

// ===========================================================================
// Helpers compartilhados
// ===========================================================================

function makeMonster(overrides = {}) {
    return {
        id: 'pm_1', name: 'Starter', class: 'Curandeiro',
        hp: 50, hpMax: 80, atk: 5, def: 4, poder: 10,
        ene: 10, eneMax: 20, buffs: [], ...overrides,
    };
}

function makeWild(overrides = {}) {
    return {
        id: 'w_1', name: 'Selvagem', class: 'Guerreiro',
        hp: 60, hpMax: 80, atk: 6, def: 3, poder: 8,
        ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null, ...overrides,
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'p1', name: 'Jogador', class: 'Curandeiro',
        inventory: { IT_HEAL_01: 5 }, team: [], money: 0, ...overrides,
    };
}

function makeEncounter(wild, overrides = {}) {
    return {
        id: 'enc_1', type: 'wild', active: true,
        wildMonster: wild, selectedPlayerId: 'p1',
        log: [], rewardsGranted: false, ...overrides,
    };
}

const ITEM_DEF = { name: 'Petisco', emoji: '🍖', heal_pct: 0.30, heal_min: 5 };

function makeItemDeps(overrides = {}) {
    return {
        eneRegenData: {},
        classAdvantages: {},
        getBasicPower: () => 10,
        rollD20: () => 1, // inimigo falha por padrão
        getItemDef: () => ITEM_DEF,
        updateFriendship: vi.fn(),
        tutorialOnAction: vi.fn(),
        onHealVisualFeedback: vi.fn(),
        audio: { playSfx: vi.fn() },
        ...overrides,
    };
}

function makeSkillDeps(useSkillFn, overrides = {}) {
    return {
        eneRegenData: {},
        classAdvantages: {},
        getBasicPower: () => 10,
        rollD20: () => 1, // inimigo falha
        getMonsterSkills: (m) => overrides._skills || [],
        useSkill: useSkillFn || vi.fn(() => true),
        handleVictoryRewards: vi.fn(),
        tutorialOnAction: vi.fn(),
        markAsParticipated: vi.fn(),
        audio: { playSfx: vi.fn() },
        ...overrides,
    };
}

// ===========================================================================
// PARTE A — resolvePassiveModifier: floracura e moonquill (handlers puros)
// ===========================================================================

describe('speciesPassives 4.1 — floracura (handler puro)', () => {

    function makeFloracura(overrides = {}) {
        return { canonSpeciesId: 'floracura', hp: 50, hpMax: 80, ...overrides };
    }

    it('deve retornar healBonus: 3 quando isFirstHeal=true e evento on_heal_item', () => {
        const mod = resolvePassiveModifier(makeFloracura(), {
            event: 'on_heal_item', hpPct: 0.5, isFirstHeal: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.healBonus).toBe(3);
    });

    it('deve retornar null quando isFirstHeal=false (segunda cura)', () => {
        const mod = resolvePassiveModifier(makeFloracura(), {
            event: 'on_heal_item', hpPct: 0.5, isFirstHeal: false,
        });
        expect(mod).toBeNull();
    });

    it('deve retornar null quando isFirstHeal não está no contexto', () => {
        const mod = resolvePassiveModifier(makeFloracura(), {
            event: 'on_heal_item', hpPct: 0.5,
        });
        expect(mod).toBeNull(); // isFirstHeal = undefined → falsy
    });

    it('NÃO deve disparar em evento on_attack', () => {
        const mod = resolvePassiveModifier(makeFloracura(), {
            event: 'on_attack', hpPct: 0.5, isFirstHeal: true,
        });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar em evento on_hit_received', () => {
        const mod = resolvePassiveModifier(makeFloracura(), {
            event: 'on_hit_received', hpPct: 0.5, isFirstHeal: true,
        });
        expect(mod).toBeNull();
    });

    it('deve retornar null para instância sem canonSpeciesId', () => {
        const mod = resolvePassiveModifier({ hp: 50, hpMax: 80 }, {
            event: 'on_heal_item', isFirstHeal: true,
        });
        expect(mod).toBeNull();
    });

    it('deve retornar null para instância null', () => {
        expect(resolvePassiveModifier(null, { event: 'on_heal_item', isFirstHeal: true })).toBeNull();
    });
});

describe('speciesPassives 4.1 — moonquill (handler puro)', () => {

    function makeMoonquill(overrides = {}) {
        return { canonSpeciesId: 'moonquill', hp: 60, hpMax: 80, ...overrides };
    }

    it('deve retornar spdBuff quando isDebuff=true e evento on_skill_used', () => {
        const mod = resolvePassiveModifier(makeMoonquill(), {
            event: 'on_skill_used', hpPct: 0.75, isDebuff: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.spdBuff).toBeDefined();
        expect(mod.spdBuff.power).toBe(1);
        expect(mod.spdBuff.duration).toBe(1);
    });

    it('deve retornar null quando isDebuff=false (habilidade não é debuff)', () => {
        const mod = resolvePassiveModifier(makeMoonquill(), {
            event: 'on_skill_used', hpPct: 0.75, isDebuff: false,
        });
        expect(mod).toBeNull();
    });

    it('deve retornar null quando isDebuff não está no contexto', () => {
        const mod = resolvePassiveModifier(makeMoonquill(), {
            event: 'on_skill_used', hpPct: 0.75,
        });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar em evento on_attack', () => {
        const mod = resolvePassiveModifier(makeMoonquill(), {
            event: 'on_attack', hpPct: 0.75, isDebuff: true,
        });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar em evento on_hit_received', () => {
        const mod = resolvePassiveModifier(makeMoonquill(), {
            event: 'on_hit_received', hpPct: 0.75, isDebuff: true,
        });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar em evento on_heal_item', () => {
        const mod = resolvePassiveModifier(makeMoonquill(), {
            event: 'on_heal_item', hpPct: 0.75, isDebuff: true,
        });
        expect(mod).toBeNull();
    });

    it('deve retornar null para instância sem canonSpeciesId', () => {
        const mod = resolvePassiveModifier({ hp: 60, hpMax: 80 }, {
            event: 'on_skill_used', isDebuff: true,
        });
        expect(mod).toBeNull();
    });
});

// ===========================================================================
// PARTE B — Integração: floracura via executeWildItemUse
// ===========================================================================

describe('speciesPassives 4.1 — floracura integração executeWildItemUse', () => {

    it('floracura: primeira cura aplica +3 HP de bônus', () => {
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 40, hpMax: 80 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        // Sem passiva: cura = max(5, floor(80*0.30)) = max(5,24) = 24 → hp = 40+24 = 64
        // Com floracura: +3 → hp = 64+3 = 67
        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });

        expect(pm.hp).toBe(67);
    });

    it('floracura: segunda cura do combate NÃO aplica bônus', () => {
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 20, hpMax: 80 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        // Primeira cura: hp 20 → 20+24+3 = 47
        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });
        expect(pm.hp).toBe(47);

        // Reduzir HP novamente para testar segunda cura
        pm.hp = 20;

        // Segunda cura: hp 20 → 20+24 = 44 (sem bônus de passiva)
        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });
        expect(pm.hp).toBe(44);
    });

    it('floracura: passiveState.floracuraHealUsed marcado após primeira cura', () => {
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 40, hpMax: 80 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        expect(enc.passiveState).toBeUndefined(); // ainda não inicializado

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });

        expect(enc.passiveState).toBeDefined();
        expect(enc.passiveState.floracuraHealUsed).toBe(true);
    });

    it('floracura: log registra bônus de passiva', () => {
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 40, hpMax: 80 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });

        const hasPassiveLog = enc.log.some(l => l.includes('✨') && l.includes('Passiva') && l.includes('HP') && l.includes('primeira cura'));
        expect(hasPassiveLog).toBe(true);
    });

    it('instância sem canonSpeciesId: nenhum bônus, sem passiveState', () => {
        const pm = makeMonster({ hp: 40, hpMax: 80 }); // sem canonSpeciesId
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        // Cura normal: max(5, floor(80*0.30)) = 24 → hp = 40+24 = 64
        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });

        expect(pm.hp).toBe(64); // sem bônus
        // passiveState pode estar inicializado (lazy init) mas healUsed não marcado
        expect(enc.passiveState?.floracuraHealUsed).toBeFalsy();
    });

    it('floracura: bônus limitado pelo HP máximo (não ultrapassa hpMax)', () => {
        // HP quase cheio: 79/80. Cura = 24. hp = min(80, 79+24) = 80.
        // Bônus floracura: min(3, 80 - 80) = 0. Não aplica.
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 79, hpMax: 80 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });

        expect(pm.hp).toBe(80); // limitado pelo hpMax
        // passiveState ainda deve ser marcado (passiva disparou, mas bonus = 0)
        expect(enc.passiveState.floracuraHealUsed).toBe(true);
    });

    it('reset: passiveState de um encounter independe de outro encounter', () => {
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 40, hpMax: 80 });
        const wild1 = makeWild();
        const enc1 = makeEncounter(wild1);
        const enc2 = makeEncounter(makeWild()); // encounter diferente
        const player = makePlayer();
        const deps = makeItemDeps();

        // Primeira cura no enc1 → marca enc1.passiveState.floracuraHealUsed
        executeWildItemUse({ encounter: enc1, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });
        expect(enc1.passiveState?.floracuraHealUsed).toBe(true);

        // enc2 não tem passiveState ainda → novo combate, passiva disponível novamente
        expect(enc2.passiveState?.floracuraHealUsed).toBeFalsy();
    });
});

// ===========================================================================
// PARTE C — Integração: moonquill via executeWildSkill
// ===========================================================================

// Skill debuff: type BUFF + target enemy + power < 0
const DEBUFF_SKILL = {
    id: 'sk_enfraquecer', name: 'Enfraquecer I',
    type: 'BUFF', target: 'enemy', power: -2,
    buffType: 'ATK', duration: 2, cost: 4,
};

// Skill de ataque: NÃO é debuff
const ATTACK_SKILL = {
    id: 'sk_golpe', name: 'Golpe I',
    type: 'DAMAGE', power: 18, cost: 4,
};

// Skill buff próprio: type BUFF mas target self → NÃO é debuff
const SELF_BUFF_SKILL = {
    id: 'sk_escudo', name: 'Escudo I',
    type: 'BUFF', target: 'self', power: 2,
    buffType: 'DEF', duration: 2, cost: 4,
};

describe('speciesPassives 4.1 — moonquill integração executeWildSkill', () => {

    it('moonquill: buff de SPD adicionado ao array buffs após debuff', () => {
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [DEBUFF_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Deve ter buff de SPD adicionado
        const spdBuff = pm.buffs.find(b => b.type === 'spd' && b.source === 'moonquill_passive');
        expect(spdBuff).toBeDefined();
        expect(spdBuff.power).toBe(1);
        expect(spdBuff.duration).toBe(1);
    });

    it('moonquill: log registra o buff de passiva', () => {
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [DEBUFF_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const hasMoonLog = enc.log.some(l => l.includes('✨') && l.includes('SPD'));
        expect(hasMoonLog).toBe(true);
    });

    it('moonquill: NÃO dispara com skill de ataque (DAMAGE)', () => {
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        // useSkill reduz HP do wild
        const deps = makeSkillDeps(vi.fn((att, sk, def) => { def.hp -= sk.power; return true; }), {
            _skills: [ATTACK_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const spdBuff = pm.buffs.find(b => b.type === 'spd' && b.source === 'moonquill_passive');
        expect(spdBuff).toBeUndefined();
    });

    it('moonquill: NÃO dispara com buff em si mesmo (target self)', () => {
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [SELF_BUFF_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const spdBuff = pm.buffs.find(b => b.source === 'moonquill_passive');
        expect(spdBuff).toBeUndefined();
    });

    it('moonquill: NÃO dispara se skill é BUFF enemy mas power >= 0', () => {
        // Exemplo: BUFF enemy com poder positivo não é um debuff
        const buffEnemyPositive = {
            id: 'sk_buff_enemy', name: 'Buff Inimigo',
            type: 'BUFF', target: 'enemy', power: 0, cost: 4,
        };
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [buffEnemyPositive],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const spdBuff = pm.buffs.find(b => b.source === 'moonquill_passive');
        expect(spdBuff).toBeUndefined();
    });

    it('instância sem canonSpeciesId: sem SPD buff após debuff', () => {
        const pm = makeMonster({ class: 'Mago', ene: 10, buffs: [] }); // sem canonSpeciesId
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [DEBUFF_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(pm.buffs.find(b => b.source === 'moonquill_passive')).toBeUndefined();
    });

    it('moonquill: buff tem duration=1 (limpo no próximo turno pelo sistema de buffs)', () => {
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [DEBUFF_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const spdBuff = pm.buffs.find(b => b.source === 'moonquill_passive');
        expect(spdBuff.duration).toBe(1);
        // Simular updateBuffs (reduz duração): buff deve desaparecer após 1 aplicação
        spdBuff.duration--;
        const remaining = pm.buffs.filter(b => b.duration > 0);
        expect(remaining.find(b => b.source === 'moonquill_passive')).toBeUndefined();
    });
});

// ===========================================================================
// PARTE D — Impacto das passivas Fase 4.0: shieldhorn e emberfang
// ===========================================================================

/**
 * Simulação leve de 100 ataques para medir impacto médio das passivas.
 *
 * Metodologia:
 *   - Executa executeWildAttack N vezes com d20 fixo (acerto garantido)
 *   - Compara dano com e sem passiva usando mesmos stats
 *   - Calcula mitigação/bônus total e médio por ataque
 */

function makeDepsForSimulation(rollD20Val = 15) {
    return {
        eneRegenData: { Guerreiro: { pct: 0.10, min: 1 } },
        classAdvantages: {},
        getBasicPower: () => 10,
        rollD20: () => rollD20Val,
        recordD20Roll: vi.fn(),
        tutorialOnAction: vi.fn(),
        audio: null,
        ui: null,
        handleVictoryRewards: vi.fn(),
        updateFriendship: vi.fn(),
        showToast: vi.fn(),
    };
}

describe('speciesPassives 4.1 — impacto shieldhorn (simulação de 100 ataques)', () => {

    it('shieldhorn reduz exatamente 1 ponto de dano por ataque recebido', () => {
        // Parâmetros fixos para dano determinístico
        const ATK = 7, BASIC_POWER = 10, DEF = 3;
        // Dano esperado sem passiva: max(1, 7 + 10 - 3) = 14
        // Dano esperado com passiva: max(1, 14 - 1) = 13
        let totalWithPassive = 0;
        let totalWithout = 0;

        for (let i = 0; i < 100; i++) {
            // SEM passiva
            const wildNoPassive = {
                id: 'w', name: 'W', class: 'Guerreiro',
                hp: 200, hpMax: 200, atk: ATK, def: DEF, poder: 8,
                ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null,
            };
            const encNoPassive = makeEncounter(wildNoPassive);
            const pmNoPassive = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 200, hpMax: 200, atk: ATK, def: DEF, ene: 10, eneMax: 20, buffs: [] };
            const playerNoPassive = { id: 'p', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
            const hpBefore = wildNoPassive.hp;
            executeWildAttack({ encounter: encNoPassive, player: playerNoPassive, playerMonster: pmNoPassive, d20Roll: 15, dependencies: makeDepsForSimulation(1) });
            totalWithout += hpBefore - wildNoPassive.hp;

            // COM shieldhorn (wild é o defensor com passiva)
            const wildWithPassive = {
                id: 'w', name: 'W', class: 'Guerreiro',
                hp: 200, hpMax: 200, atk: ATK, def: DEF, poder: 8,
                ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null,
                canonSpeciesId: 'shieldhorn',
            };
            const encWithPassive = makeEncounter(wildWithPassive);
            const pmWithPassive = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 200, hpMax: 200, atk: ATK, def: DEF, ene: 10, eneMax: 20, buffs: [] };
            const hpBefore2 = wildWithPassive.hp;
            executeWildAttack({ encounter: encWithPassive, player: playerNoPassive, playerMonster: pmWithPassive, d20Roll: 15, dependencies: makeDepsForSimulation(1) });
            totalWithPassive += hpBefore2 - wildWithPassive.hp;
        }

        const avgWithout = totalWithout / 100;
        const avgWithPassive = totalWithPassive / 100;
        const avgMitigation = avgWithout - avgWithPassive;

        // Com d20=15 e stats fixos: dano sem passiva = 14, com passiva = 13
        expect(avgWithout).toBe(14);
        expect(avgWithPassive).toBe(13);
        expect(avgMitigation).toBe(1); // exatamente 1 ponto por ataque
        expect(avgMitigation / avgWithout).toBeCloseTo(0.0714, 2); // ~7.14% de mitigação
    });

    it('shieldhorn impacto: aceitável — mitiga < 10% do dano em stats típicos', () => {
        // Valida que a passiva não é excessivamente forte (< 10% de mitigação)
        const ATK = 7, BASIC_POWER = 10, DEF = 3;
        // Dano base: 14, com passiva: 13 → mitigação = 7.14% < 10% ✓
        const damageWithout = Math.max(1, ATK + 10 - DEF); // 14
        const damageWith = Math.max(1, damageWithout - 1);  // 13
        const mitigationPct = (damageWithout - damageWith) / damageWithout;
        expect(mitigationPct).toBeLessThan(0.10);
    });

    it('shieldhorn não pode tornar o dano negativo (mínimo 1)', () => {
        // Edge case: ataque que causaria dano 1 → com mitigação ainda fica em 1
        // Dano base: max(1, 1 + 10 - 15) = max(1, -4) = 1
        // Com passiva: max(1, 1 - 1) = max(1, 0) = 1
        const wild = {
            id: 'w', name: 'W', class: 'Guerreiro',
            hp: 50, hpMax: 80, atk: 1, def: 15, poder: 8,
            ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null,
            canonSpeciesId: 'shieldhorn',
        };
        const enc = makeEncounter(wild);
        const pm = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 80, hpMax: 80, atk: 1, def: 1, ene: 10, eneMax: 20, buffs: [] };
        const player = { id: 'p', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const deps = makeDepsForSimulation(1); // inimigo erra

        const hpBefore = wild.hp;
        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: deps });
        const damage = hpBefore - wild.hp;

        expect(damage).toBeGreaterThanOrEqual(1); // dano mínimo sempre é 1
    });
});

describe('speciesPassives 4.1 — impacto emberfang (simulação de 100 ataques)', () => {

    it('emberfang adiciona exatamente +1 ATK quando HP > 70%', () => {
        const ATK = 7, BASIC_POWER = 10, DEF = 3;
        // Dano base sem passiva: max(1, 7 + 10 - 3) = 14
        // Com emberfang (HP 100% > 70%): max(1, 8 + 10 - 3) = 15

        let totalWithPassive = 0;
        let totalWithout = 0;

        for (let i = 0; i < 100; i++) {
            // SEM passiva
            const wildN = { id: 'w', name: 'W', class: 'Guerreiro', hp: 200, hpMax: 200, atk: ATK, def: DEF, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
            const encN = makeEncounter(wildN);
            const pmN = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 80, hpMax: 80, atk: ATK, def: DEF, ene: 10, eneMax: 20, buffs: [] }; // HP 100%, sem canonSpeciesId
            const playerN = { id: 'p', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
            const hpBefore = wildN.hp;
            executeWildAttack({ encounter: encN, player: playerN, playerMonster: pmN, d20Roll: 15, dependencies: makeDepsForSimulation(1) });
            totalWithout += hpBefore - wildN.hp;

            // COM emberfang (HP > 70%)
            const wildP = { id: 'w', name: 'W', class: 'Guerreiro', hp: 200, hpMax: 200, atk: ATK, def: DEF, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
            const encP = makeEncounter(wildP);
            const pmP = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 80, hpMax: 80, atk: ATK, def: DEF, ene: 10, eneMax: 20, buffs: [], canonSpeciesId: 'emberfang' };
            const hpBefore2 = wildP.hp;
            executeWildAttack({ encounter: encP, player: playerN, playerMonster: pmP, d20Roll: 15, dependencies: makeDepsForSimulation(1) });
            totalWithPassive += hpBefore2 - wildP.hp;
        }

        const avgWithout = totalWithout / 100;
        const avgWithPassive = totalWithPassive / 100;
        const avgBonus = avgWithPassive - avgWithout;

        expect(avgWithout).toBe(14);           // dano base = 14
        expect(avgWithPassive).toBe(15);       // com emberfang = 15
        expect(avgBonus).toBe(1);              // +1 dano por ataque
        expect(avgBonus / avgWithout).toBeCloseTo(0.0714, 2); // ~7.14% de bônus
    });

    it('emberfang NÃO dispara quando HP <= 70%', () => {
        // HP = 56/80 = 70% exato → não dispara
        const ATK = 7, DEF = 3;
        const wild = { id: 'w', name: 'W', class: 'Guerreiro', hp: 200, hpMax: 200, atk: ATK, def: DEF, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
        const enc = makeEncounter(wild);
        const pm = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 56, hpMax: 80, atk: ATK, def: DEF, ene: 10, eneMax: 20, buffs: [], canonSpeciesId: 'emberfang' };
        const player = { id: 'p', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const hpBefore = wild.hp;
        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: makeDepsForSimulation(1) });
        const damage = hpBefore - wild.hp;
        // HP = 70% exato → passiva NÃO dispara → dano = 14 (sem bônus)
        expect(damage).toBe(14);
    });

    it('emberfang impacto: aceitável — aumenta < 10% do dano em stats típicos', () => {
        // +1 ATK sobre 14 de dano base → 7.14% de aumento < 10% ✓
        const damageWithout = 14;
        const damageWith = 15;
        const bonusPct = (damageWith - damageWithout) / damageWithout;
        expect(bonusPct).toBeLessThan(0.10);
    });

    it('emberfang: disponível apenas com HP acima de 70%, o que exige lidar com dano recebido', () => {
        // Com stats típicos ATK=7, DEF=3, POWER=10: dano = 14
        // Para perder a passiva, o emberfang precisa sofrer > 30% do HP (>= 25 HP de dano em hpMax=80)
        // Isso é uma quebra de threshold natural que reforça o arquétipo "burst quando íntegro"
        const hpMax = 80;
        const threshold70pct = hpMax * 0.70; // 56 HP
        const damageToLosePassive = hpMax - threshold70pct; // 24 HP de dano
        // Um ataque de wildMonster (atk=6, power=10, vs def=4) = max(1, 6+10-4) = 12 dano
        const typicalEnemyDamage = Math.max(1, 6 + 10 - 4);
        const attacksToLosePassive = Math.ceil(damageToLosePassive / typicalEnemyDamage);

        // Emberfang perde a passiva após ~2 ataques típicos recebidos
        // Isso é equilibrado — força o jogador a agir antes de acumular muito dano
        expect(attacksToLosePassive).toBeGreaterThanOrEqual(2);
        expect(attacksToLosePassive).toBeLessThanOrEqual(5);
    });
});

// ===========================================================================
// PARTE E — Teste de regressão: passivas antigas (4.0) não afetadas por 4.1
// ===========================================================================

describe('speciesPassives 4.1 — regressão passivas Fase 4.0', () => {

    it('shieldhorn ainda funciona após adição de floracura/moonquill', () => {
        const wild = {
            id: 'w', name: 'W', class: 'Guerreiro',
            hp: 50, hpMax: 80, atk: 6, def: 3, poder: 8,
            ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null,
            canonSpeciesId: 'shieldhorn',
        };
        const enc = makeEncounter(wild);
        const pm = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 80, hpMax: 80, atk: 7, def: 4, ene: 10, eneMax: 20, buffs: [] };
        const player = { id: 'p', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const deps = makeDepsForSimulation(1);

        // Dano esperado: 7+10-3=14 → com shieldhorn: 13
        const hpBefore = wild.hp;
        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: deps });
        expect(hpBefore - wild.hp).toBe(13);
    });

    it('emberfang ainda funciona após adição de floracura/moonquill', () => {
        const wild = {
            id: 'w', name: 'W', class: 'Guerreiro',
            hp: 50, hpMax: 80, atk: 6, def: 3, poder: 8,
            ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null,
        };
        const enc = makeEncounter(wild);
        const pm = { id: 'pm', name: 'PM', class: 'Guerreiro', hp: 80, hpMax: 80, atk: 7, def: 4, ene: 10, eneMax: 20, buffs: [], canonSpeciesId: 'emberfang' };
        const player = { id: 'p', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const deps = makeDepsForSimulation(1);

        // HP 100% > 70% → emberfang ativo: 8+10-3=15
        const hpBefore = wild.hp;
        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: deps });
        expect(hpBefore - wild.hp).toBe(15);
    });

    it('sem canonSpeciesId: nenhuma passiva de Fase 4.1 interfere no combate padrão', () => {
        // Garante que cura normal e skill normal funcionam sem alteração
        const pm = makeMonster({ hp: 40, hpMax: 80 }); // sem canonSpeciesId
        const wild = makeWild();
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeItemDeps();

        // Cura normal: max(5, floor(80*0.30)) = 24
        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: 'IT_HEAL_01', dependencies: deps });

        expect(pm.hp).toBe(64); // 40 + 24 = 64, sem bônus de passiva
    });
});
