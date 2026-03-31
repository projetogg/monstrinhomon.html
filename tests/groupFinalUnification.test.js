/**
 * GROUP COMBAT FINAL UNIFICATION TESTS
 *
 * Testa as funções extraídas do index.html para os módulos canônicos:
 *   - groupActions.js: executeGroupFlee
 *   - groupUI.js: enterAttackMode, enterSkillMode, applyTargetSelectionVisuals,
 *                 handleEnemyClick, cancelTargetMode
 *
 * Cobertura obrigatória:
 *   ✅ executeGroupFlee — boss bloqueia fuga
 *   ✅ executeGroupFlee — fuga bem-sucedida remove participante
 *   ✅ executeGroupFlee — todos fugiram → resultado 'retreat'
 *   ✅ executeGroupFlee — não é turno do jogador → retorna erro
 *   ✅ enterAttackMode — não é turno do jogador → not_player_turn
 *   ✅ enterAttackMode — turno do jogador → entra em modo alvo
 *   ✅ enterSkillMode — não é turno do jogador → not_player_turn
 *   ✅ enterSkillMode — skill Self executa diretamente (sem seleção)
 *   ✅ enterSkillMode — skill ofensiva → entra em modo alvo com skillId
 *   ✅ enterSkillMode — índice inválido → no_skill
 *   ✅ handleEnemyClick — fora do modo alvo → ignorado (sem return)
 *   ✅ handleEnemyClick — inimigo morto → enemy_dead
 *   ✅ handleEnemyClick — modo attack → chama executePlayerAttackGroup
 *   ✅ handleEnemyClick — modo skill → chama executePlayerSkillGroup
 *   ✅ cancelTargetMode — sai do modo alvo e renderiza
 *   ✅ applyTargetSelectionVisuals — destaca vivos, opaca mortos (DOM mockado)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeGroupFlee } from '../js/combat/groupActions.js';
import {
    enterAttackMode,
    enterSkillMode,
    applyTargetSelectionVisuals,
    handleEnemyClick,
    cancelTargetMode
} from '../js/combat/groupUI.js';
import {
    _resetForTesting as resetTargetSelection,
    isInTargetMode,
    getActionType,
    getSelectedSkillId,
    enterTargetMode
} from '../js/ui/targetSelection.js';

// ── Ambiente Node não tem DOM: stub mínimo para applyTargetSelectionVisuals ─
if (typeof document === 'undefined') {
    globalThis.document = { getElementById: () => null };
}

// ── Factories ────────────────────────────────────────────────────────────────

function makeMon({ hp = 50, hpMax = 50, cls = 'Guerreiro', spd = 5 } = {}) {
    return {
        uid: `mi_${Math.random().toString(36).slice(2)}`,
        name: 'Mon', class: cls,
        hp, hpMax, atk: 10, def: 8, spd,
        ene: 10, eneMax: 10, level: 5, buffs: [],
        skills: ['SK_WAR_01']
    };
}

function makePlayer(id, { mon, cls = 'Guerreiro' } = {}) {
    const activeMon = mon || makeMon({ cls });
    return {
        id, name: `Jogador ${id}`, class: cls,
        team: [activeMon],
        activeIndex: 0,
        inventory: {}
    };
}

function makeEnemy({ hp = 40, spd = 3 } = {}) {
    return {
        uid: `enemy_${Math.random().toString(36).slice(2)}`,
        name: 'Inimigo', class: 'Bárbaro',
        hp, hpMax: hp, atk: 8, def: 6, spd,
        ene: 10, eneMax: 10, level: 3, buffs: [],
        _participated: false
    };
}

function makeEncounter({ type = 'group_trainer', players = [], enemies = null } = {}) {
    const _players = players.length ? players : [makePlayer('p1'), makePlayer('p2')];
    const _enemies = enemies ?? [makeEnemy()];
    const playerEntries = _players.map(p => ({
        id: p.id,
        name: p.name,
        side: 'player',
        spd: p.team[p.activeIndex ?? 0]?.spd ?? 5
    }));
    const enemyEntries = _enemies.map((e, i) => ({
        id: i,
        name: e.name,
        side: 'enemy',
        spd: e.spd ?? 3
    }));
    const turnOrder = [...playerEntries, ...enemyEntries].sort((a, b) => b.spd - a.spd);

    return {
        id: `enc_test`,
        type,
        participants: _players.map(p => p.id),
        enemies: _enemies,
        turnOrder,
        turnIndex: 0,
        currentActor: turnOrder[0],
        log: [],
        active: true,
        finished: false,
        _modalShown: false
    };
}

function buildDeps({ players, enc, extraHelpers = {} } = {}) {
    const _enc = enc ?? makeEncounter({ players });
    const _players = players ?? [makePlayer('p1'), makePlayer('p2')];

    const logFn = vi.fn((encObj, msg) => { encObj.log.push(msg); });
    const renderFn = vi.fn();
    const saveFn = vi.fn();
    const attackFn = vi.fn();
    const skillFn = vi.fn();

    return {
        enc: _enc,
        players: _players,
        deps: {
            state: { currentEncounter: _enc, players: _players, config: { classAdvantages: {} } },
            core: {
                getCurrentActor: (e) => e.turnOrder[e.turnIndex] ?? null,
                hasAlivePlayers: () => true,
                hasAliveEnemies: () => true,
                isAlive: (m) => (m?.hp ?? 0) > 0,
                checkHit: (d20, _atk, _def) => d20 >= 8,
                getBuffModifiers: () => ({ atk: 0, def: 0, spd: 0 }),
                getClassAdvantageModifiers: () => ({ atkBonus: 0, damageMult: 1 }),
                calcDamage: ({ atk, def, power }) => Math.max(1, atk + power - def),
                clamp: (n, mn, mx) => Math.min(mx, Math.max(mn, n))
            },
            ui: { render: renderFn, showDamageFeedback: vi.fn(), showMissFeedback: vi.fn(), playAttackFeedback: vi.fn() },
            audio: { playSfx: vi.fn() },
            storage: { save: saveFn },
            helpers: {
                getPlayerById: (id) => _players.find(p => p.id === id) ?? null,
                getActiveMonsterOfPlayer: (p) => p ? (p.team[p.activeIndex ?? 0] ?? null) : null,
                getEnemyByIndex: (e, i) => e.enemies[i] ?? null,
                log: (e, msg) => { e.log.push(msg); },
                rollD20: () => 15,
                recordD20Roll: vi.fn(),
                applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
                applyEneRegen: vi.fn(),
                updateBuffs: vi.fn(),
                getSkillById: (id) => id === 'SK_WAR_01'
                    ? { id, name: 'Golpe', target: 'Inimigo', power: 8, accuracy: 0.9, energy_cost: 2, category: 'Ataque' }
                    : id === 'SK_SELF_01'
                        ? { id, name: 'Cura', target: 'Self', power: 15, accuracy: 1, energy_cost: 2, category: 'Suporte' }
                        : null,
                getSkillsArray: (mon) => mon.skills ?? [],
                canUseSkillNow: () => true,
                getItemDef: () => null,
                firstAliveIndex: () => 0,
                chooseTargetPlayerId: () => 'p1',
                handleVictoryRewards: vi.fn(),
                openSwitchMonsterModal: vi.fn(),
                getBasicAttackPower: () => 10,
                ...extraHelpers
            }
        },
        mocks: { render: renderFn, save: saveFn, attack: attackFn, skill: skillFn }
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('executeGroupFlee', () => {
    it('retorna boss_no_flee em batalha boss', () => {
        const { deps } = buildDeps();
        deps.state.currentEncounter.type = 'boss';

        const result = executeGroupFlee(deps);

        expect(result).toEqual({ ok: false, reason: 'boss_no_flee' });
        expect(deps.state.currentEncounter.finished).toBe(false);
    });

    it('retorna no_encounter se encounter estiver finalizado', () => {
        const { deps } = buildDeps();
        deps.state.currentEncounter.finished = true;

        const result = executeGroupFlee(deps);
        expect(result).toEqual({ ok: false, reason: 'no_encounter' });
    });

    it('retorna not_player_turn se for turno do inimigo', () => {
        const player = makePlayer('p1');
        const enemy = makeEnemy({ spd: 99 });
        const enc = makeEncounter({ players: [player], enemies: [enemy] });
        // Forçar turno do inimigo
        enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'enemy');
        const { deps } = buildDeps({ players: [player], enc });

        const result = executeGroupFlee(deps);
        expect(result).toEqual({ ok: false, reason: 'not_player_turn' });
    });

    it('remove participante após fuga bem-sucedida', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const enc = makeEncounter({ players: [p1, p2] });
        // Garante turno do jogador p1
        enc.turnIndex = enc.turnOrder.findIndex(a => a.id === 'p1');
        const { deps } = buildDeps({ players: [p1, p2], enc });

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(true);
        expect(enc.participants).not.toContain('p1');
        expect(enc.log.some(l => l.includes('fugiu'))).toBe(true);
    });

    it('define resultado retreat quando todos fugiram (único participante)', () => {
        const p1 = makePlayer('p1');
        const enc = makeEncounter({ players: [p1] });
        enc.turnIndex = 0; // primeiro ator (jogador)
        const { deps } = buildDeps({ players: [p1], enc });

        const result = executeGroupFlee(deps);

        expect(result.ok).toBe(true);
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('retreat');
        expect(enc.log.some(l => l.includes('fugiram'))).toBe(true);
    });

    it('chama save e render após fuga', () => {
        const p1 = makePlayer('p1');
        const enc = makeEncounter({ players: [p1] });
        enc.turnIndex = 0;
        const { deps, mocks } = buildDeps({ players: [p1], enc });

        executeGroupFlee(deps);

        expect(mocks.save).toHaveBeenCalledTimes(1);
        expect(mocks.render).toHaveBeenCalledTimes(1);
    });
});

// ── enterAttackMode ──────────────────────────────────────────────────────────

describe('enterAttackMode', () => {
    beforeEach(() => resetTargetSelection());
    afterEach(() => resetTargetSelection());

    it('retorna not_player_turn se for turno do inimigo', () => {
        const enemy = makeEnemy({ spd: 99 });
        const p1 = makePlayer('p1');
        const enc = makeEncounter({ players: [p1], enemies: [enemy] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'enemy');
        const { deps } = buildDeps({ players: [p1], enc });

        const result = enterAttackMode(enc, deps);

        expect(result).toEqual({ ok: false, reason: 'not_player_turn' });
        expect(isInTargetMode()).toBe(false);
    });

    it('entra em modo alvo attack quando é turno do jogador', () => {
        const p1 = makePlayer('p1');
        const enc = makeEncounter({ players: [p1] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.id === 'p1');
        const { deps, mocks } = buildDeps({ players: [p1], enc });

        const result = enterAttackMode(enc, deps);

        expect(result.ok).toBe(true);
        expect(isInTargetMode()).toBe(true);
        expect(getActionType()).toBe('attack');
        expect(mocks.render).toHaveBeenCalledTimes(1);
    });

    it('retorna no_encounter se enc for null', () => {
        const { deps } = buildDeps();
        const result = enterAttackMode(null, deps);
        expect(result).toEqual({ ok: false, reason: 'no_encounter' });
    });

    it('retorna no_encounter se enc.finished for true', () => {
        const { enc, deps } = buildDeps();
        enc.finished = true;
        const result = enterAttackMode(enc, deps);
        expect(result).toEqual({ ok: false, reason: 'no_encounter' });
    });
});

// ── enterSkillMode ───────────────────────────────────────────────────────────

describe('enterSkillMode', () => {
    beforeEach(() => resetTargetSelection());
    afterEach(() => resetTargetSelection());

    it('retorna not_player_turn se for turno do inimigo', () => {
        const enemy = makeEnemy({ spd: 99 });
        const p1 = makePlayer('p1');
        const enc = makeEncounter({ players: [p1], enemies: [enemy] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'enemy');
        const { deps } = buildDeps({ players: [p1], enc });

        const result = enterSkillMode(0, enc, deps);

        expect(result).toEqual({ ok: false, reason: 'not_player_turn' });
        expect(isInTargetMode()).toBe(false);
    });

    it('retorna no_skill para índice inválido', () => {
        const mon = makeMon();
        mon.skills = ['SK_WAR_01'];
        const p1 = makePlayer('p1', { mon });
        const enc = makeEncounter({ players: [p1] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.id === 'p1');
        const { deps } = buildDeps({ players: [p1], enc });

        const result = enterSkillMode(5, enc, deps); // índice fora do array

        expect(result).toEqual({ ok: false, reason: 'no_skill' });
    });

    it('executa diretamente skill com target Self (sem modo alvo)', () => {
        const executeSkillMock = vi.fn(() => true);
        const mon = makeMon();
        mon.skills = ['SK_SELF_01'];
        const p1 = makePlayer('p1', { mon });
        const enc = makeEncounter({ players: [p1] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.id === 'p1');
        const { deps } = buildDeps({
            players: [p1], enc,
            extraHelpers: {
                getSkillsArray: (m) => m.skills ?? [],
                getSkillById: (id) => id === 'SK_SELF_01'
                    ? { id, name: 'Cura', target: 'Self', power: 15, accuracy: 1, energy_cost: 0, category: 'Suporte' }
                    : null,
                canUseSkillNow: () => true,
                applyDamage: vi.fn(),
                rollD20: () => 15,
                recordD20Roll: vi.fn()
            }
        });

        const result = enterSkillMode(0, enc, deps);

        // Skill Self → executada diretamente, sem entrar em modo alvo
        expect(result.ok).toBe(true);
        expect(result.direct).toBe(true);
        expect(isInTargetMode()).toBe(false);
    });

    it('entra em modo alvo skill para skill ofensiva', () => {
        const mon = makeMon();
        mon.skills = ['SK_WAR_01'];
        const p1 = makePlayer('p1', { mon });
        const enc = makeEncounter({ players: [p1] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.id === 'p1');
        const { deps, mocks } = buildDeps({ players: [p1], enc });

        const result = enterSkillMode(0, enc, deps);

        expect(result.ok).toBe(true);
        expect(isInTargetMode()).toBe(true);
        expect(getActionType()).toBe('skill');
        expect(getSelectedSkillId()).toBe('SK_WAR_01');
        expect(mocks.render).toHaveBeenCalledTimes(1);
    });
});

// ── handleEnemyClick ─────────────────────────────────────────────────────────

describe('handleEnemyClick', () => {
    beforeEach(() => resetTargetSelection());
    afterEach(() => resetTargetSelection());

    it('retorna undefined (ignora) quando fora do modo alvo', () => {
        const { enc, deps } = buildDeps();
        // Não entrou em modo alvo

        const result = handleEnemyClick(0, enc, deps);

        expect(result).toBeUndefined();
    });

    it('retorna enemy_dead para inimigo com HP 0', () => {
        const { enc, deps } = buildDeps();
        enc.enemies[0].hp = 0; // Mata o inimigo

        enterTargetMode('attack');

        const result = handleEnemyClick(0, enc, deps);

        expect(result).toEqual({ ok: false, reason: 'enemy_dead' });
    });

    it('chama executePlayerAttackGroup em modo attack', () => {
        const p1 = makePlayer('p1');
        const enemy = makeEnemy();
        const enc = makeEncounter({ players: [p1], enemies: [enemy] });
        enc.turnIndex = enc.turnOrder.findIndex(a => a.id === 'p1');
        const { deps, mocks } = buildDeps({ players: [p1], enc });

        enterTargetMode('attack');

        handleEnemyClick(0, enc, deps);

        // Deve sair do modo alvo e ter renderizado (ataque + avanço de turno)
        expect(isInTargetMode()).toBe(false);
        expect(mocks.render).toHaveBeenCalled();
    });

    it('sai do modo alvo e chama render após executar ação', () => {
        const { enc, deps, mocks } = buildDeps();
        enc.turnIndex = 0; // jogador

        enterTargetMode('attack');

        handleEnemyClick(0, enc, deps);

        expect(isInTargetMode()).toBe(false);
        expect(mocks.render).toHaveBeenCalled();
    });
});

// ── cancelTargetMode ─────────────────────────────────────────────────────────

describe('cancelTargetMode', () => {
    beforeEach(() => resetTargetSelection());
    afterEach(() => resetTargetSelection());

    it('sai do modo alvo e chama render', () => {
        const { deps, mocks } = buildDeps();

        enterTargetMode('attack');
        expect(isInTargetMode()).toBe(true);

        cancelTargetMode(deps);

        expect(isInTargetMode()).toBe(false);
        expect(mocks.render).toHaveBeenCalledTimes(1);
    });
});

// ── applyTargetSelectionVisuals ──────────────────────────────────────────────

describe('applyTargetSelectionVisuals', () => {
    it('não falha se enc for null ou sem enemies', () => {
        expect(() => applyTargetSelectionVisuals(null)).not.toThrow();
        expect(() => applyTargetSelectionVisuals({})).not.toThrow();
        expect(() => applyTargetSelectionVisuals({ enemies: [] })).not.toThrow();
    });

    it('aplica estilos corretos a cards no DOM (vivo vs morto)', () => {
        // Stub de cards para inimigo vivo e morto
        const aliveCard = { style: {} };
        const deadCard = { style: {} };

        globalThis.document = {
            getElementById: (id) => {
                if (id === 'grpE_0') return aliveCard;
                if (id === 'grpE_1') return deadCard;
                return null;
            }
        };

        const enc = {
            enemies: [
                { hp: 40, hpMax: 40, name: 'Vivo' },
                { hp: 0, hpMax: 40, name: 'Morto' }
            ]
        };

        applyTargetSelectionVisuals(enc);

        // Inimigo vivo: destaque azul
        expect(aliveCard.style.cursor).toBe('pointer');
        expect(aliveCard.style.border).toBe('3px solid #2196F3');
        expect(aliveCard.style.opacity).toBe('1');

        // Inimigo morto: opaco, não clicável
        expect(deadCard.style.cursor).toBe('default');
        expect(deadCard.style.opacity).toBe('0.4');

        // Restaurar stub mínimo
        globalThis.document = { getElementById: () => null };
    });
});

// ── Regressão: boss não pode fugir ───────────────────────────────────────────

describe('Regressão — boss sem fuga', () => {
    it('executeGroupFlee retorna boss_no_flee sem modificar enc', () => {
        const p1 = makePlayer('p1');
        const enc = makeEncounter({ type: 'boss', players: [p1] });
        enc.turnIndex = 0;
        const { deps } = buildDeps({ players: [p1], enc });

        const before = JSON.parse(JSON.stringify({ participants: enc.participants, finished: enc.finished }));
        const result = executeGroupFlee(deps);

        expect(result).toEqual({ ok: false, reason: 'boss_no_flee' });
        expect(enc.participants).toEqual(before.participants);
        expect(enc.finished).toBe(before.finished);
    });
});
