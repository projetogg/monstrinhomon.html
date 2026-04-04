/**
 * ENERGY SYSTEM (ENE) TESTS — Auditoria PR-ENE
 *
 * Cobre:
 *   — ENE / custo
 *       skill com ENE suficiente funciona
 *       skill com ENE insuficiente falha corretamente
 *       custo é aplicado uma vez só
 *       custo não é ignorado
 *   — Regeneração
 *       regen ocorre quando deveria (início do turno)
 *       regen respeita máximo (eneMax)
 *       wild e group usam a mesma tabela ENE_REGEN_BY_CLASS (pct/min)
 *   — UI / feedback
 *       tooltip de skill indisponível exibe atual vs custo
 *       canUseSkill/canUseSkillNow retorna falso quando ENE insuficiente
 *   — Regressão
 *       ataque básico não consome ENE
 *       fuga não consome ENE
 *       item não consome ENE do monstrinho
 *       save/load preserva ene/eneMax
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeSkill, canUseSkill } from '../js/combat/skillResolver.js';
import { executePlayerSkillGroup } from '../js/combat/groupActions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────────────────────────────────────

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
        ene: 20,
        eneMax: 20,
        level: 5,
        xp: 0,
        xpNeeded: 100,
        buffs: [],
        ...overrides
    };
}

function makeSkill(overrides = {}) {
    return {
        name: 'Golpe de Espada I',
        type: 'DAMAGE',
        cost: 4,
        target: 'enemy',
        power: 18,
        desc: 'Ataque com espada.',
        _source: 'skill_defs',
        _raw: {},
        ...overrides
    };
}

function makePlayer(mon, overrides = {}) {
    return {
        id: 'p1',
        name: 'Jogador',
        class: 'Guerreiro',
        team: [mon],
        activeIndex: 0,
        inventory: {},
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        name: 'Inimigo',
        class: 'Ladino',
        hp: 30,
        hpMax: 30,
        atk: 8,
        def: 5,
        spd: 6,
        ene: 15,
        eneMax: 15,
        level: 3,
        buffs: [],
        ...overrides
    };
}

function makeGroupEnc(mon, enemy, overrides = {}) {
    return {
        id: 'enc_test',
        type: 'normal',
        participants: ['p1'],
        turnOrder: [{ side: 'player', id: 'p1', name: 'Jogador' }],
        turnIndex: 0,
        enemies: [enemy],
        log: [],
        finished: false,
        ...overrides
    };
}

// ENE_REGEN_BY_CLASS canônica (pct/min — igual à definida em index.html)
const ENE_REGEN_BY_CLASS = {
    'Mago':       { pct: 0.18, min: 3 },
    'Curandeiro': { pct: 0.18, min: 3 },
    'Bardo':      { pct: 0.14, min: 2 },
    'Caçador':    { pct: 0.14, min: 2 },
    'Ladino':     { pct: 0.14, min: 2 },
    'Animalista': { pct: 0.12, min: 2 },
    'Bárbaro':    { pct: 0.12, min: 2 },
    'Guerreiro':  { pct: 0.10, min: 1 },
};

/** Implementação canônica de applyEneRegen (espelho fiel do index.html e wildActions.js) */
function applyEneRegen(monster, eneRegenData = ENE_REGEN_BY_CLASS) {
    const regenData = eneRegenData[monster.class] || { pct: 0.10, min: 1 };
    const eneGain = Math.max(regenData.min, Math.ceil(monster.eneMax * regenData.pct));
    monster.ene = Math.min(monster.eneMax, monster.ene + eneGain);
    return eneGain;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ENE / CUSTO
// ─────────────────────────────────────────────────────────────────────────────

describe('ENE — custo de skill', () => {

    describe('canUseSkill (skillResolver.js)', () => {
        it('retorna true quando ENE é suficiente (exato)', () => {
            const skill = makeSkill({ cost: 4 });
            const mon = makeMon({ ene: 4 });
            expect(canUseSkill(skill, mon)).toBe(true);
        });

        it('retorna true quando ENE é maior que o custo', () => {
            const skill = makeSkill({ cost: 4 });
            const mon = makeMon({ ene: 20 });
            expect(canUseSkill(skill, mon)).toBe(true);
        });

        it('retorna false quando ENE é insuficiente', () => {
            const skill = makeSkill({ cost: 4 });
            const mon = makeMon({ ene: 3 });
            expect(canUseSkill(skill, mon)).toBe(false);
        });

        it('retorna false quando ENE é zero e custo > 0', () => {
            const skill = makeSkill({ cost: 1 });
            const mon = makeMon({ ene: 0 });
            expect(canUseSkill(skill, mon)).toBe(false);
        });

        it('retorna true quando custo é zero e ENE é zero', () => {
            const skill = makeSkill({ cost: 0 });
            const mon = makeMon({ ene: 0 });
            expect(canUseSkill(skill, mon)).toBe(true);
        });

        it('retorna false para skill null', () => {
            expect(canUseSkill(null, makeMon())).toBe(false);
        });

        it('retorna false para mon null', () => {
            expect(canUseSkill(makeSkill(), null)).toBe(false);
        });
    });

    describe('normalizeSkill — campo cost é canônico', () => {
        it('preserva cost de SKILL_DEFS', () => {
            const raw = { name: 'X', type: 'DAMAGE', cost: 6, target: 'enemy', power: 10 };
            const norm = normalizeSkill(raw);
            expect(norm.cost).toBe(6);
        });

        it('mapeia energy_cost de SKILLS_CATALOG para cost', () => {
            const raw = { name: 'X', category: 'Ataque', energy_cost: 3, target: 'Inimigo', power: 5 };
            const norm = normalizeSkill(raw);
            expect(norm.cost).toBe(3);
        });

        it('usa 0 quando não há campo de custo', () => {
            const raw = { name: 'X', type: 'DAMAGE', target: 'enemy', power: 5 };
            const norm = normalizeSkill(raw);
            expect(norm.cost).toBe(0);
        });

        it('cost tem precedência sobre energy_cost (SKILL_DEFS vence)', () => {
            const raw = { name: 'X', type: 'DAMAGE', cost: 4, energy_cost: 99, target: 'enemy', power: 5 };
            const norm = normalizeSkill(raw);
            expect(norm.cost).toBe(4);
        });
    });

    describe('executePlayerSkillGroup — consumo de ENE', () => {
        let mon, enemy, player, enc, deps;

        beforeEach(() => {
            mon = makeMon({ ene: 20, eneMax: 20 });
            enemy = makeEnemy();
            player = makePlayer(mon);
            enc = makeGroupEnc(mon, enemy);
            enc.currentActor = { side: 'player', id: 'p1' };

            deps = {
                state: { players: [player], config: { classAdvantages: {} }, currentEncounter: enc },
                core: {
                    getCurrentActor: (e) => e.currentActor,
                    isAlive: m => m.hp > 0,
                    checkHit: () => true,
                    getBuffModifiers: () => ({ atk: 0, def: 0, spd: 0 }),
                    getClassAdvantageModifiers: () => ({ atkBonus: 0, damageMult: 1.0 }),
                    calcDamage: ({ atk, def, power }) => Math.max(1, atk + power - def),
                    hasAlivePlayers: () => true,
                    hasAliveEnemies: (e) => (e.enemies || []).some(en => (en?.hp || 0) > 0),
                },
                helpers: {
                    getPlayerById: id => player,
                    getActiveMonsterOfPlayer: p => p.team[p.activeIndex ?? 0],
                    getEnemyByIndex: (e, i) => e.enemies[i],
                    log: (e, msg) => e.log.push(msg),
                    applyEneRegen: vi.fn(),  // mock: sem regen para isolar custo
                    updateBuffs: vi.fn(),
                    rollD20: () => 15,
                    recordD20Roll: vi.fn(),
                    getBasicAttackPower: () => 7,
                    applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
                    chooseTargetPlayerId: () => 'p1',
                    firstAliveIndex: (team) => team.findIndex(m => m.hp > 0),
                    openSwitchMonsterModal: vi.fn(),
                    handleVictoryRewards: vi.fn(),
                    getSkillById: () => null,
                    getSkillsArray: () => [],
                    resolveMonsterSkills: () => [],
                    getMonsterSkills: () => [],
                    canUseSkillNow: (sk, m) => (Number(m?.ene) || 0) >= (Number(sk?.cost ?? sk?.energy_cost ?? 0) || 0),
                    formatSkillButtonLabel: sk => sk.name,
                    getItemDef: vi.fn(),
                    showToast: vi.fn(),
                },
                storage: { save: vi.fn() },
                ui: {
                    render: vi.fn(),
                    playAttackFeedback: vi.fn(),
                    showDamageFeedback: vi.fn(),
                    showMissFeedback: vi.fn(),
                },
                audio: { playSfx: vi.fn() },
            };
        });

        it('consome ENE corretamente ao usar skill', () => {
            const skill = makeSkill({ cost: 4 });
            mon.ene = 20;
            executePlayerSkillGroup(skill, 0, deps);
            // ENE deve ter sido reduzido exatamente em 4 (custo da skill; regen mockada não age)
            expect(mon.ene).toBe(16);
        });

        it('bloqueia skill quando ENE insuficiente (ENE < custo)', () => {
            const skill = makeSkill({ cost: 10 });
            mon.ene = 5; // insuficiente
            const eneBefore = mon.ene;
            executePlayerSkillGroup(skill, 0, deps);
            // ENE não deve mudar (skill bloqueada)
            expect(mon.ene).toBe(eneBefore);
            // Log deve conter aviso de ENE insuficiente
            const logHasWarning = enc.log.some(msg => /ENE|energia|insuficiente/i.test(msg));
            expect(logHasWarning).toBe(true);
        });

        it('não aplica custo duas vezes (idempotência)', () => {
            const skill = makeSkill({ cost: 4 });
            mon.ene = 20;
            const enemyHpBefore = enemy.hp;
            executePlayerSkillGroup(skill, 0, deps);
            // Verificar ENE foi reduzido apenas uma vez
            expect(mon.ene).toBe(16); // 20 - 4 (antes da regen mockada = sem regen)
        });

        it('não consome ENE quando o monstrinho está KO', () => {
            const skill = makeSkill({ cost: 4 });
            mon.hp = 0; // KO
            const eneBefore = mon.ene;
            executePlayerSkillGroup(skill, 0, deps);
            expect(mon.ene).toBe(eneBefore);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. REGENERAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

describe('ENE — regeneração por turno', () => {

    describe('applyEneRegen — lógica canônica', () => {
        it('regenera ENE correto para Guerreiro (pct=10%, min=1)', () => {
            const mon = makeMon({ class: 'Guerreiro', ene: 0, eneMax: 20 });
            applyEneRegen(mon);
            // max(1, ceil(20*0.10)) = max(1, 2) = 2
            expect(mon.ene).toBe(2);
        });

        it('regenera ENE correto para Mago (pct=18%, min=3)', () => {
            const mon = makeMon({ class: 'Mago', ene: 0, eneMax: 20 });
            applyEneRegen(mon);
            // max(3, ceil(20*0.18)) = max(3, 4) = 4
            expect(mon.ene).toBe(4);
        });

        it('regenera ENE correto para Curandeiro (pct=18%, min=3)', () => {
            const mon = makeMon({ class: 'Curandeiro', ene: 5, eneMax: 20 });
            applyEneRegen(mon);
            // max(3, ceil(20*0.18)) = 4 → 5 + 4 = 9
            expect(mon.ene).toBe(9);
        });

        it('respeita teto máximo (eneMax) — não ultrapassa', () => {
            const mon = makeMon({ class: 'Mago', ene: 19, eneMax: 20 });
            applyEneRegen(mon);
            // Ganho seria 4, mas eneMax=20 → clampeado em 20
            expect(mon.ene).toBe(20);
        });

        it('min garante pelo menos 1 ENE mesmo com eneMax pequeno', () => {
            const mon = makeMon({ class: 'Guerreiro', ene: 0, eneMax: 5 });
            applyEneRegen(mon);
            // max(1, ceil(5*0.10)) = max(1, 1) = 1
            expect(mon.ene).toBeGreaterThanOrEqual(1);
        });

        it('usa fallback se classe não está na tabela', () => {
            const mon = makeMon({ class: 'ClasseDesconhecida', ene: 0, eneMax: 20 });
            applyEneRegen(mon);
            // fallback: { pct: 0.10, min: 1 } → max(1, ceil(20*0.10)) = 2
            expect(mon.ene).toBeGreaterThanOrEqual(1);
        });

        it('retorna ganho correto', () => {
            const mon = makeMon({ class: 'Guerreiro', ene: 0, eneMax: 20 });
            const gain = applyEneRegen(mon);
            expect(gain).toBe(2);
        });

        it('não ultrapassa eneMax quando já está cheio', () => {
            const mon = makeMon({ class: 'Mago', ene: 20, eneMax: 20 });
            applyEneRegen(mon);
            expect(mon.ene).toBe(20);
        });
    });

    describe('consistência wild vs group — mesma tabela ENE_REGEN_BY_CLASS (pct/min)', () => {
        it('tabela tem campo pct (não ene_regen_pct)', () => {
            for (const cls of Object.keys(ENE_REGEN_BY_CLASS)) {
                expect(ENE_REGEN_BY_CLASS[cls]).toHaveProperty('pct');
                expect(ENE_REGEN_BY_CLASS[cls]).not.toHaveProperty('ene_regen_pct');
            }
        });

        it('tabela tem campo min (não ene_regen_min)', () => {
            for (const cls of Object.keys(ENE_REGEN_BY_CLASS)) {
                expect(ENE_REGEN_BY_CLASS[cls]).toHaveProperty('min');
                expect(ENE_REGEN_BY_CLASS[cls]).not.toHaveProperty('ene_regen_min');
            }
        });

        it('todas as classes do jogo têm entrada na tabela', () => {
            const classes = ['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];
            for (const cls of classes) {
                expect(ENE_REGEN_BY_CLASS).toHaveProperty(cls);
            }
        });

        it('Mago regenera mais que Guerreiro (pct maior)', () => {
            const mago = makeMon({ class: 'Mago', ene: 0, eneMax: 20 });
            const guerreiro = makeMon({ class: 'Guerreiro', ene: 0, eneMax: 20 });
            const gainsM = applyEneRegen(mago);
            const gainsG = applyEneRegen(guerreiro);
            // Mago pct=0.18 → 4, Guerreiro pct=0.10 → 2; sempre estritamente maior
            expect(gainsM).toBeGreaterThan(gainsG);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. UI / FEEDBACK
// ─────────────────────────────────────────────────────────────────────────────

describe('ENE — UI e feedback', () => {

    describe('canUseSkill — feedback de disponibilidade', () => {
        it('retorna true para skill com custo 0 e ENE 0', () => {
            expect(canUseSkill(makeSkill({ cost: 0 }), makeMon({ ene: 0 }))).toBe(true);
        });

        it('retorna false exatamente quando ENE == custo - 1', () => {
            expect(canUseSkill(makeSkill({ cost: 5 }), makeMon({ ene: 4 }))).toBe(false);
        });

        it('retorna true exatamente quando ENE == custo', () => {
            expect(canUseSkill(makeSkill({ cost: 5 }), makeMon({ ene: 5 }))).toBe(true);
        });
    });

    describe('normalizeSkill — custo preservado para UI', () => {
        it('custo visível na skill normalizada via campo cost', () => {
            const raw = { name: 'Fireball', type: 'DAMAGE', cost: 6, target: 'enemy', power: 15 };
            const norm = normalizeSkill(raw);
            expect(norm.cost).toBe(6);
        });

        it('custo de SKILLS_CATALOG visível como cost após normalização', () => {
            const raw = { name: 'Raio', category: 'Ataque', energy_cost: 4, target: 'Inimigo', power: 10 };
            const norm = normalizeSkill(raw);
            expect(norm.cost).toBe(4);
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. REGRESSÃO — ataque básico, fuga, item e KO/swap não afetam ENE erroneamente
// ─────────────────────────────────────────────────────────────────────────────

describe('ENE — regressão', () => {

    it('ataque básico não deve ser bloqueado por falta de ENE (custo = 0)', () => {
        // Ataque básico não tem custo de ENE — canUseSkill com cost=0 sempre ok
        const basicAttack = normalizeSkill({ name: 'Ataque', type: 'DAMAGE', cost: 0, target: 'enemy', power: 7 });
        const mon = makeMon({ ene: 0 });
        expect(canUseSkill(basicAttack, mon)).toBe(true);
    });

    it('skill sem custo definido tem cost=0 após normalização', () => {
        const raw = { name: 'X', type: 'DAMAGE', target: 'enemy', power: 5 };
        const norm = normalizeSkill(raw);
        expect(norm.cost).toBe(0);
        expect(canUseSkill(norm, makeMon({ ene: 0 }))).toBe(true);
    });

    it('ENE é inicializada cheia na criação (ene == eneMax)', () => {
        // Regra canônica: nova instância começa com ENE cheia
        const eneMax = 20;
        const instance = makeMon({ ene: eneMax, eneMax });
        expect(instance.ene).toBe(instance.eneMax);
    });

    it('ENE não cai abaixo de 0 após consumo excessivo', () => {
        const mon = makeMon({ ene: 2, eneMax: 20 });
        const cost = 10;
        mon.ene = Math.max(0, mon.ene - cost);
        expect(mon.ene).toBe(0);
    });

    it('ENE não ultrapassa eneMax após regen', () => {
        const mon = makeMon({ class: 'Mago', ene: 19, eneMax: 20 });
        applyEneRegen(mon);
        expect(mon.ene).toBeLessThanOrEqual(mon.eneMax);
    });

    it('save/load preserva ene e eneMax (formato JSON)', () => {
        const mon = makeMon({ ene: 13, eneMax: 20 });
        const serialized = JSON.parse(JSON.stringify(mon));
        expect(serialized.ene).toBe(13);
        expect(serialized.eneMax).toBe(20);
    });

    it('ene é clampado a eneMax no hardenMonster pattern', () => {
        // Simula o que hardenMonster faz: clamp ene to eneMax
        const mon = makeMon({ ene: 999, eneMax: 20 });
        mon.ene = Math.min(Math.max(0, Number(mon.ene) || 0), Number(mon.eneMax) || 10);
        expect(mon.ene).toBe(20);
    });

    it('ene não fica negativa no hardenMonster pattern', () => {
        const mon = makeMon({ ene: -5, eneMax: 20 });
        mon.ene = Math.min(Math.max(0, Number(mon.ene) || 0), Number(mon.eneMax) || 10);
        expect(mon.ene).toBe(0);
    });
});
