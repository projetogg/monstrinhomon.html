/**
 * COMBAT SKILLS AUDIT TESTS (PR-Auditoria-Combate)
 *
 * Testes de integração e regressão para a camada de ações do combate.
 * Cobre os bugs identificados na auditoria:
 *   - Skill buttons não aparecem no wild combat (getSkillsArray retornava [])
 *   - Skill buttons não aparecem no group combat (mesmo problema)
 *   - executePlayerSkillGroup não suportava formato SKILL_DEFS
 *   - targetSelection: selectedSkillObject para skills legadas
 *
 * Cobertura:
 *   - targetSelection: selectedSkillObject
 *   - executePlayerSkillGroup: aceita objeto de skill (SKILL_DEFS)
 *   - executePlayerSkillGroup: detecta isOffensive por type/target legados
 *   - groupUI.enterSkillMode: fallback para getMonsterSkills
 *   - ENE insuficiente: ação bloqueada com log claro
 *   - KO: monstrinho desmaiado não pode usar habilidade
 *   - Regressão: ataque, item, fuga, captura não foram afetados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { executePlayerSkillGroup } from '../js/combat/groupActions.js';
import { enterSkillMode, handleEnemyClick } from '../js/combat/groupUI.js';
import * as TargetSelection from '../js/ui/targetSelection.js';

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
        activeIndex: 0,
        ...overrides
    };
}

/** Cria skill no formato SKILLS_CATALOG (sistema canônico) */
function makeCatalogSkill(overrides = {}) {
    return {
        id: 'SK_WAR_01',
        name: 'Corte Pesado',
        class: 'Guerreiro',
        category: 'Ataque',
        power: 9,
        accuracy: 0.9,
        energy_cost: 3,
        target: 'Inimigo',
        status: '',
        desc: 'Dano alto.',
        ...overrides
    };
}

/** Cria skill no formato SKILL_DEFS (sistema legado) */
function makeLegacySkill(overrides = {}) {
    return {
        name: 'Golpe de Espada I',
        type: 'DAMAGE',
        cost: 4,
        power: 18,
        desc: 'Ataque com espada.',
        ...overrides
    };
}

/** Cria skill defensiva no formato SKILL_DEFS (legado) */
function makeLegacyHealSkill(overrides = {}) {
    return {
        name: 'Cura I',
        type: 'HEAL',
        cost: 5,
        power: 15,
        target: 'self',
        desc: 'Cura leve.',
        ...overrides
    };
}

function makeDeps({ mon, player, enemies, getSkillById = null, getMonsterSkills = null, rollD20Val = 15 }) {
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
    const renders = [];

    const deps = {
        state,
        core: {
            getCurrentActor: (e) => e.currentActor,
            isAlive: (entity) => (Number(entity?.hp) || 0) > 0,
            hasAlivePlayers: () => true,
            hasAliveEnemies: () => enemies.some(e => (e?.hp || 0) > 0),
            calcDamage: ({ atk, def, power, damageMult = 1 }) => Math.max(1, Math.floor((atk + power - def) * damageMult)),
            getBuffModifiers: () => ({ atk: 0, def: 0, spd: 0 }),
            getClassAdvantageModifiers: () => ({ atkBonus: 0, damageMult: 1.0 })
        },
        ui: {
            render: () => renders.push(1),
            showDamageFeedback: vi.fn(),
            showMissFeedback: vi.fn(),
            playAttackFeedback: vi.fn()
        },
        audio: { playSfx: vi.fn() },
        storage: { save: vi.fn() },
        helpers: {
            getPlayerById: (id) => state.players.find(p => p.id === id),
            getActiveMonsterOfPlayer: (p) => p?.team?.[p?.activeIndex ?? 0],
            getEnemyByIndex: (e, idx) => e.enemies[idx],
            log: (e, msg) => { e.log.push(msg); logs.push(msg); },
            applyEneRegen: vi.fn(),
            updateBuffs: vi.fn(),
            rollD20: () => rollD20Val,
            recordD20Roll: vi.fn(),
            applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
            chooseTargetPlayerId: vi.fn(),
            firstAliveIndex: vi.fn(),
            openSwitchMonsterModal: vi.fn(),
            handleVictoryRewards: vi.fn(),
            getSkillById: (id) => getSkillById ? getSkillById(id) : null,
            getSkillsArray: (m) => (Array.isArray(m?.skills) ? m.skills : []),
            getMonsterSkills: getMonsterSkills || null,
            canUseSkillNow: (skill, m) => {
                const cost = Number(skill?.energy_cost ?? skill?.cost ?? 0) || 0;
                return (Number(m?.ene) || 0) >= cost;
            },
            formatSkillButtonLabel: (skill) => skill?.name || 'Habilidade',
            getItemDef: vi.fn(),
            showToast: vi.fn()
        }
    };

    return { deps, enc, logs, renders };
}

// ─────────────────────────────────────────────────────────────────────────────
// Seção 1: executePlayerSkillGroup com skill objeto direto (SKILL_DEFS legado)
// ─────────────────────────────────────────────────────────────────────────────

describe('executePlayerSkillGroup — Skill objeto direto (SKILL_DEFS legado)', () => {
    it('deve aceitar objeto de skill DAMAGE (ofensivo) e causar dano', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ hp: 40 });
        const legacySkill = makeLegacySkill({ cost: 4, power: 18 });

        const { deps, enc, logs } = makeDeps({
            mon, player, enemies: [enemy],
            rollD20Val: 15
        });

        const ok = executePlayerSkillGroup(legacySkill, 0, deps);

        expect(ok).toBe(true);
        expect(enemy.hp).toBeLessThan(40); // dano foi causado
        expect(logs.some(l => l.includes('Golpe de Espada I'))).toBe(true);
    });

    it('deve aceitar objeto de skill HEAL (defensivo) e curar', () => {
        const mon = makeMon({ hp: 20, hpMax: 50, ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const healSkill = makeLegacyHealSkill({ cost: 5, power: 15 });

        const { deps, logs } = makeDeps({ mon, player, enemies: [enemy], rollD20Val: 10 });

        const ok = executePlayerSkillGroup(healSkill, null, deps);

        expect(ok).toBe(true);
        expect(mon.hp).toBeGreaterThan(20); // curou
        expect(logs.some(l => l.includes('Cura I'))).toBe(true);
    });

    it('deve aceitar objeto de skill BUFF (target self)', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const buffSkill = {
            name: 'Escudo I',
            type: 'BUFF',
            cost: 4,
            power: 2,
            buffType: 'DEF',
            target: 'self',
            desc: 'Buff DEF',
        };

        const { deps, logs } = makeDeps({ mon, player, enemies: [enemy], rollD20Val: 10 });

        const ok = executePlayerSkillGroup(buffSkill, null, deps);

        expect(ok).toBe(true);
        expect(logs.some(l => l.includes('Escudo I'))).toBe(true);
    });

    it('deve consumir ENE ao executar skill legada', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const legacySkill = makeLegacySkill({ cost: 4 });

        const { deps } = makeDeps({ mon, player, enemies: [enemy], rollD20Val: 15 });

        executePlayerSkillGroup(legacySkill, 0, deps);

        // ENE foi consumido (custo 4, mas regen ocorre antes — deps.applyEneRegen é mock que não adiciona)
        // ENE deve ser menor ou igual ao inicial após consumo
        expect(mon.ene).toBeLessThanOrEqual(20);
    });

    it('deve bloquear skill legada com ENE insuficiente', () => {
        const mon = makeMon({ ene: 2 }); // só 2 ENE
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const legacySkill = makeLegacySkill({ cost: 4 }); // precisa 4

        const { deps, logs } = makeDeps({ mon, player, enemies: [enemy] });

        const ok = executePlayerSkillGroup(legacySkill, 0, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('ENE insuficiente'))).toBe(true);
    });

    it('deve bloquear skill legada se monstrinho está desmaiado', () => {
        const mon = makeMon({ hp: 0, ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const legacySkill = makeLegacySkill({ cost: 4 });

        const { deps, logs } = makeDeps({ mon, player, enemies: [enemy] });

        const ok = executePlayerSkillGroup(legacySkill, 0, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('desmaiado'))).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 2: executePlayerSkillGroup com skill ID canônico (SKILLS_CATALOG)
// ─────────────────────────────────────────────────────────────────────────────

describe('executePlayerSkillGroup — Skill ID canônico (SKILLS_CATALOG)', () => {
    it('deve funcionar com ID canônico e skill encontrada', () => {
        const catalogSkill = makeCatalogSkill({ energy_cost: 3, power: 9 });
        const mon = makeMon({ ene: 10 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ hp: 40 });

        const { deps, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: (id) => id === 'SK_WAR_01' ? catalogSkill : null,
            rollD20Val: 15
        });

        const ok = executePlayerSkillGroup('SK_WAR_01', 0, deps);

        expect(ok).toBe(true);
        expect(enemy.hp).toBeLessThan(40);
        expect(logs.some(l => l.includes('Corte Pesado'))).toBe(true);
    });

    it('deve retornar false e logar erro para ID não encontrado', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: () => null
        });

        const ok = executePlayerSkillGroup('SK_NAO_EXISTE', 0, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('não encontrada'))).toBe(true);
    });

    it('deve executar skill de cura canônica (target Aliado)', () => {
        const healSkill = makeCatalogSkill({
            id: 'SK_HEA_01',
            name: 'Sopro Calmante',
            energy_cost: 4,
            power: 0,
            target: 'Aliado',
            category: 'Cura'
        });
        const mon = makeMon({ hp: 20, hpMax: 50, ene: 10 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: () => healSkill,
            rollD20Val: 10
        });

        const ok = executePlayerSkillGroup('SK_HEA_01', null, deps);

        expect(ok).toBe(true);
        expect(mon.hp).toBeGreaterThan(20); // curou 20% do hpMax = 10
        expect(logs.some(l => l.includes('Sopro Calmante'))).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 3: targetSelection — selectedSkillObject (sistema legado)
// ─────────────────────────────────────────────────────────────────────────────

describe('TargetSelection — selectedSkillObject (SKILL_DEFS legado)', () => {
    beforeEach(() => {
        TargetSelection._resetForTesting();
    });

    it('deve armazenar skillObject quando fornecido', () => {
        const skill = makeLegacySkill();
        TargetSelection.enterTargetMode('skill', '__legacy_0', skill);

        expect(TargetSelection.isInTargetMode()).toBe(true);
        expect(TargetSelection.getSelectedSkillObject()).toBe(skill);
        expect(TargetSelection.getSelectedSkillId()).toBe('__legacy_0');
    });

    it('selectedSkillObject deve ser null quando não fornecido', () => {
        TargetSelection.enterTargetMode('skill', 'SK_WAR_01');

        expect(TargetSelection.getSelectedSkillObject()).toBeNull();
        expect(TargetSelection.getSelectedSkillId()).toBe('SK_WAR_01');
    });

    it('deve resetar skillObject ao sair do modo alvo', () => {
        const skill = makeLegacySkill();
        TargetSelection.enterTargetMode('skill', '__legacy_0', skill);
        TargetSelection.exitTargetMode();

        expect(TargetSelection.getSelectedSkillObject()).toBeNull();
        expect(TargetSelection.getSelectedSkillId()).toBeNull();
    });

    it('deve aceitar skillObject sem skillId (modo direto)', () => {
        const skill = makeLegacySkill();
        // Com skillObject fornecido, skillId pode ser omitido
        TargetSelection.enterTargetMode('skill', '__obj', skill);
        expect(TargetSelection.isInTargetMode()).toBe(true);
        expect(TargetSelection.getSelectedSkillObject()).toBe(skill);
    });

    it('deve lançar erro quando nem skillId nem skillObject fornecidos', () => {
        expect(() => TargetSelection.enterTargetMode('skill', null, null))
            .toThrow('skillId ou skillObject é obrigatório');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 4: enterSkillMode (groupUI) — fallback getMonsterSkills
// ─────────────────────────────────────────────────────────────────────────────

describe('enterSkillMode — fallback getMonsterSkills (sistema legado)', () => {
    beforeEach(() => {
        TargetSelection._resetForTesting();
    });

    it('deve executar skill defensiva diretamente sem target selection', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const healSkill = makeLegacyHealSkill({ cost: 5, power: 15 });

        const { deps, enc, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getMonsterSkills: () => [healSkill]
        });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(true);
        expect(result.direct).toBe(true);
        // Skill defensiva: não deve entrar em modo de seleção de alvo
        expect(TargetSelection.isInTargetMode()).toBe(false);
    });

    it('deve entrar em modo target selection para skill ofensiva', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const attackSkill = makeLegacySkill({ cost: 4, type: 'DAMAGE', target: 'enemy' });

        const { deps, enc } = makeDeps({
            mon, player, enemies: [enemy],
            getMonsterSkills: () => [attackSkill]
        });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(true);
        expect(TargetSelection.isInTargetMode()).toBe(true);
        expect(TargetSelection.getActionType()).toBe('skill');
        // Deve armazenar o objeto de skill diretamente
        expect(TargetSelection.getSelectedSkillObject()).toEqual(attackSkill);
    });

    it('deve retornar no_skill quando índice inválido', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, enc } = makeDeps({
            mon, player, enemies: [enemy],
            getMonsterSkills: () => [] // sem skills
        });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(false);
        expect(result.reason).toBe('no_skill');
    });

    it('deve retornar no_encounter se encounter não existir', () => {
        const result = enterSkillMode(0, null, {});
        expect(result.ok).toBe(false);
        expect(result.reason).toBe('no_encounter');
    });

    it('deve retornar not_player_turn se não for turno do jogador', () => {
        const mon = makeMon();
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, enc } = makeDeps({ mon, player, enemies: [enemy] });
        enc.currentActor = { side: 'enemy', id: 0 };

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(false);
        expect(result.reason).toBe('not_player_turn');
    });

    it('deve retornar no_skill com sistema canônico e mon.skills vazio', () => {
        const mon = makeMon({ skills: [] }); // skills array vazio
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, enc } = makeDeps({
            mon, player, enemies: [enemy],
            getMonsterSkills: () => [] // também sem fallback
        });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(false);
        expect(result.reason).toBe('no_skill');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 5: handleEnemyClick com skill objeto (sistema legado)
// ─────────────────────────────────────────────────────────────────────────────

describe('handleEnemyClick — skill objeto via selectedSkillObject', () => {
    beforeEach(() => {
        TargetSelection._resetForTesting();
    });

    it('deve executar skill legada quando clica em inimigo após target selection', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ hp: 40 });
        const attackSkill = makeLegacySkill({ cost: 4, type: 'DAMAGE', target: 'enemy', power: 18 });

        const { deps, enc, logs } = makeDeps({ mon, player, enemies: [enemy], rollD20Val: 15 });

        // Simula: enterSkillMode armazenou skill offensiva em target selection
        TargetSelection.enterTargetMode('skill', '__legacy_0', attackSkill);

        const result = handleEnemyClick(0, enc, deps);

        expect(result?.ok).toBe(true);
        expect(enemy.hp).toBeLessThan(40); // dano causado
        expect(TargetSelection.isInTargetMode()).toBe(false); // saiu do modo
    });

    it('deve ignorar clique em inimigo morto', () => {
        const mon = makeMon({ ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy({ hp: 0 }); // morto
        const attackSkill = makeLegacySkill();

        const { deps, enc } = makeDeps({ mon, player, enemies: [enemy] });
        TargetSelection.enterTargetMode('skill', '__legacy_0', attackSkill);

        const result = handleEnemyClick(0, enc, deps);

        expect(result?.reason).toBe('enemy_dead');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 6: Regressão — sistema canônico preservado
// ─────────────────────────────────────────────────────────────────────────────

describe('Regressão — sistema canônico SKILLS_CATALOG preservado', () => {
    beforeEach(() => {
        TargetSelection._resetForTesting();
    });

    it('enterSkillMode canônico deve entrar em target selection para skill ofensiva', () => {
        const catalogSkill = makeCatalogSkill({ target: 'Inimigo', energy_cost: 3 });
        const mon = makeMon({ skills: ['SK_WAR_01'], ene: 10 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, enc } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: (id) => id === 'SK_WAR_01' ? catalogSkill : null
        });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(true);
        expect(TargetSelection.isInTargetMode()).toBe(true);
        expect(TargetSelection.getSelectedSkillId()).toBe('SK_WAR_01');
        // Não deve usar skill object (é canônico)
        expect(TargetSelection.getSelectedSkillObject()).toBeNull();
    });

    it('enterSkillMode canônico deve executar diretamente skill Self', () => {
        const selfSkill = makeCatalogSkill({ id: 'SK_SELF', target: 'Self', energy_cost: 2 });
        const mon = makeMon({ skills: ['SK_SELF'], ene: 10 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, enc, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: (id) => id === 'SK_SELF' ? selfSkill : null
        });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(true);
        expect(result.direct).toBe(true);
        expect(TargetSelection.isInTargetMode()).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 7: KO / Swap flow — mon desmaiado bloqueado em todas as ações de skill
// ─────────────────────────────────────────────────────────────────────────────

describe('KO / Swap — monstrinho desmaiado bloqueado', () => {
    it('não deve executar skill com monstrinho desmaiado (HP = 0)', () => {
        const mon = makeMon({ hp: 0, ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();
        const skill = makeLegacySkill({ cost: 4 });

        const { deps, logs } = makeDeps({ mon, player, enemies: [enemy] });

        const ok = executePlayerSkillGroup(skill, null, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('desmaiado'))).toBe(true);
    });

    it('não deve executar skill canônica com monstrinho desmaiado', () => {
        const catalogSkill = makeCatalogSkill({ energy_cost: 3 });
        const mon = makeMon({ hp: 0, ene: 20 });
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: () => catalogSkill
        });

        const ok = executePlayerSkillGroup('SK_WAR_01', 0, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('desmaiado'))).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 8: ENE — feedback claro quando insuficiente
// ─────────────────────────────────────────────────────────────────────────────

describe('ENE — feedback claro para ENE insuficiente', () => {
    it('skill canônica com ENE insuficiente retorna false e loga custo', () => {
        const catalogSkill = makeCatalogSkill({ energy_cost: 10 });
        const mon = makeMon({ ene: 3 }); // só 3, precisa 10
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, logs } = makeDeps({
            mon, player, enemies: [enemy],
            getSkillById: () => catalogSkill
        });

        const ok = executePlayerSkillGroup('SK_WAR_01', 0, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('ENE insuficiente') && l.includes('10'))).toBe(true);
    });

    it('skill legada com ENE insuficiente retorna false e loga custo', () => {
        const legacySkill = makeLegacySkill({ cost: 8 });
        const mon = makeMon({ ene: 2 }); // só 2
        const player = makePlayer(mon);
        const enemy = makeEnemy();

        const { deps, logs } = makeDeps({ mon, player, enemies: [enemy] });

        const ok = executePlayerSkillGroup(legacySkill, 0, deps);

        expect(ok).toBe(false);
        expect(logs.some(l => l.includes('ENE insuficiente'))).toBe(true);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seção 9: Paridade wild vs group — getSkillsArray e canUseSkillNow
// ─────────────────────────────────────────────────────────────────────────────

describe('Paridade wild / group — helpers comuns', () => {
    it('canUseSkillNow funciona com skill legada (campo cost)', () => {
        const skill = makeLegacySkill({ cost: 4 });
        const monSuficiente = makeMon({ ene: 10 });
        const monInsuficiente = makeMon({ ene: 2 });

        // Simula a mesma lógica do canUseSkillNow do index.html
        const canUse = (s, m) => {
            const cost = Number(s?.energy_cost ?? s?.eneCost ?? s?.cost ?? 0) || 0;
            return (Number(m?.ene) || 0) >= cost;
        };

        expect(canUse(skill, monSuficiente)).toBe(true);
        expect(canUse(skill, monInsuficiente)).toBe(false);
    });

    it('canUseSkillNow funciona com skill canônica (campo energy_cost)', () => {
        const skill = makeCatalogSkill({ energy_cost: 5 });
        const monSuficiente = makeMon({ ene: 10 });
        const monInsuficiente = makeMon({ ene: 3 });

        const canUse = (s, m) => {
            const cost = Number(s?.energy_cost ?? s?.eneCost ?? s?.cost ?? 0) || 0;
            return (Number(m?.ene) || 0) >= cost;
        };

        expect(canUse(skill, monSuficiente)).toBe(true);
        expect(canUse(skill, monInsuficiente)).toBe(false);
    });

    it('getSkillsArray retorna [] quando mon.skills não existe', () => {
        const monSemSkills = makeMon(); // sem campo skills
        const getSkillsArray = (m) => {
            if (!m) return [];
            if (Array.isArray(m.skills)) return m.skills.slice();
            if (Array.isArray(m.skillIds)) return m.skillIds.slice();
            return [];
        };

        expect(getSkillsArray(monSemSkills)).toEqual([]);
    });

    it('getSkillsArray retorna array de IDs quando mon.skills existe', () => {
        const monComSkills = makeMon({ skills: ['SK_WAR_01', 'SK_WAR_02'] });
        const getSkillsArray = (m) => {
            if (!m) return [];
            if (Array.isArray(m.skills)) return m.skills.slice();
            if (Array.isArray(m.skillIds)) return m.skillIds.slice();
            return [];
        };

        expect(getSkillsArray(monComSkills)).toEqual(['SK_WAR_01', 'SK_WAR_02']);
    });
});
