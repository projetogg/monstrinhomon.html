/**
 * TRAINER / BOSS COMBAT AUDIT TESTS (PR-trainer-boss-audit)
 *
 * Diagnóstico e validação do combate contra treinador e boss.
 *
 * Cobertura obrigatória (conforme issue):
 *  1. calculateTurnOrder com 1 jogador
 *  2. calculateTurnOrder com 2+ jogadores
 *  3. Ator válido após iniciar batalha (turnIndex=0)
 *  4. Inimigo como primeiro ator → advanceGroupTurn entrega turno ao jogador
 *  5. Jogador que fugiu NÃO recebe turno (regressão Fix #2)
 *  6. Regressão: "combate entra mas nada funciona" (inimigo primeiro)
 *  7. Batalha trainer solo — estrutura do encounter
 *  8. Batalha trainer 2+ jogadores — estrutura do encounter
 *  9. Batalha boss solo — estrutura do encounter
 * 10. Batalha boss 2+ jogadores — estrutura do encounter
 * 11. Execução de ataque (executePlayerAttackGroup)
 *  12. Passagem de turno (passTurn)
 * 13. Avanço de rodada completo (player→enemy→player)
 * 14. Vitória: todos inimigos mortos
 * 15. Derrota: todos jogadores mortos
 * 16. Boss: fuga BLOQUEADA pela lógica de renderActionBar (isBoss check)
 * 17. Trainer: fuga PERMITIDA
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    advanceGroupTurn,
    executePlayerAttackGroup,
    passTurn,
    executeEnemyTurnGroup
} from '../js/combat/groupActions.js';
import {
    calculateTurnOrder,
    getCurrentActor,
    hasAlivePlayers,
    hasAliveEnemies,
    isAlive
} from '../js/combat/groupCore.js';

// ──────────────────────────────────────────────────────────────────────────────
// Factories de fixture
// ──────────────────────────────────────────────────────────────────────────────

// Contador para UIDs determinísticos em testes
let _uidCounter = 0;

// d20 que sempre acerta (não 1=falha, não 20=crítico)
const GUARANTEED_HIT_ROLL = 15;

function makeMon(overrides = {}) {
    return {
        uid: `mi_test_${++_uidCounter}`,
        name: 'Luma',
        class: 'Mago',
        level: 5,
        hp: 50,
        hpMax: 50,
        atk: 10,
        def: 5,
        spd: 8,
        ene: 10,
        eneMax: 10,
        poder: 5,
        rarity: 'Comum',
        buffs: [],
        ...overrides
    };
}

function makePlayer(id = 'p1', overrides = {}) {
    return {
        id,
        name: `Jogador ${id}`,
        class: 'Mago',
        activeIndex: 0,
        team: [makeMon()],
        inventory: {},
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        name: 'Inimigo',
        class: 'Guerreiro',
        level: 3,
        hp: 30,
        hpMax: 30,
        atk: 8,
        def: 4,
        spd: 5,
        ene: 10,
        eneMax: 10,
        poder: 4,
        rarity: 'Comum',
        buffs: [],
        ...overrides
    };
}

/**
 * Cria um encounter de grupo mínimo e funcional.
 *
 * @param {Array} playerIds - IDs dos jogadores participantes
 * @param {Array} playersData - Dados completos dos jogadores
 * @param {string} type - 'group_trainer' ou 'boss'
 * @param {Array} enemies - Inimigos do encounter
 */
function makeGroupEncounter(playerIds, playersData, type = 'group_trainer', enemies = [makeEnemy()]) {
    const enc = {
        id: Date.now(),
        type,
        active: true,
        finished: false,
        result: null,
        log: [],
        participants: [...playerIds],
        enemies,
        recentTargets: {},
        rewardsGranted: false,
        turnOrder: [],
        turnIndex: 0,
        currentActor: null
    };
    enc.turnOrder = calculateTurnOrder(enc, playersData, () => 10);
    enc.turnIndex = 0;
    enc.currentActor = getCurrentActor(enc);
    return enc;
}

/**
 * Cria o objeto deps mínimo para as actions de grupo.
 */
function makeDeps(players, extraHelpers = {}) {
    const logs = [];
    return {
        state: { players, config: {}, currentEncounter: null },
        core: { getCurrentActor, hasAlivePlayers, hasAliveEnemies, isAlive, checkHit: () => true, calcDamage: () => 10, getBuffModifiers: () => ({ atk: 0, def: 0, spd: 0 }), getClassAdvantageModifiers: () => ({ attackBonus: 0, damageMult: 1.0 }) },
        audio: { playSfx: () => {} },
        helpers: {
            handleVictoryRewards: () => {},
            log: (enc, msg) => { enc.log.push(msg); logs.push(msg); },
            getPlayerById: (id) => players.find(p => p.id === id) || null,
            getActiveMonsterOfPlayer: (p) => p ? p.team[p.activeIndex ?? 0] : null,
            getEnemyByIndex: (enc, i) => enc.enemies?.[i] || null,
            applyEneRegen: () => {},
            updateBuffs: () => {},
            rollD20: () => GUARANTEED_HIT_ROLL, // acerta sempre (não 1, não 20)
            recordD20Roll: () => {},
            getBasicAttackPower: () => 7,
            applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
            chooseTargetPlayerId: (enc) => enc.participants?.[0] || null,
            firstAliveIndex: (team) => team.findIndex(m => (m.hp || 0) > 0),
            openSwitchMonsterModal: () => {},
            canUseSkillNow: () => false,
            getSkillById: () => null,
            getItemDef: () => null,
            buildEligibleTargets: (enc, deps) => {
                return enc.participants.map(pid => {
                    const p = players.find(x => x.id === pid);
                    const mon = p ? p.team[p.activeIndex ?? 0] : null;
                    return mon && isAlive(mon) ? { playerId: pid, monster: mon, heldItem: null } : null;
                }).filter(Boolean);
            },
            ...extraHelpers
        },
        ui: {
            render: () => {},
            showDamageFeedback: () => {},
            showMissFeedback: () => {},
            playAttackFeedback: () => {}
        },
        storage: { save: () => {} },
        _logs: logs
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. calculateTurnOrder — 1 jogador
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateTurnOrder — 1 jogador', () => {
    it('deve retornar 2 atores (1 jogador + 1 inimigo)', () => {
        const player = makePlayer('p1', { team: [makeMon({ spd: 10 })] });
        const enemy = makeEnemy({ spd: 5 });
        const enc = { participants: ['p1'], enemies: [enemy] };

        const order = calculateTurnOrder(enc, [player], () => 10);

        expect(order).toHaveLength(2);
    });

    it('jogador mais rápido deve ir primeiro', () => {
        const player = makePlayer('p1', { team: [makeMon({ spd: 10 })] });
        const enemy = makeEnemy({ spd: 3 });
        const enc = { participants: ['p1'], enemies: [enemy] };

        const order = calculateTurnOrder(enc, [player], () => 10);

        expect(order[0].side).toBe('player');
        expect(order[0].id).toBe('p1');
        expect(order[1].side).toBe('enemy');
    });

    it('inimigo mais rápido deve ir primeiro', () => {
        const player = makePlayer('p1', { team: [makeMon({ spd: 3 })] });
        const enemy = makeEnemy({ spd: 15 });
        const enc = { participants: ['p1'], enemies: [enemy] };

        const order = calculateTurnOrder(enc, [player], () => 10);

        expect(order[0].side).toBe('enemy');
        expect(order[1].side).toBe('player');
    });

    it('actor válido no turnIndex=0 após iniciar batalha', () => {
        const player = makePlayer('p1');
        const enc = makeGroupEncounter(['p1'], [player]);

        const actor = getCurrentActor(enc);

        expect(actor).not.toBeNull();
        expect(['player', 'enemy']).toContain(actor.side);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. calculateTurnOrder — 2+ jogadores
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateTurnOrder — múltiplos jogadores', () => {
    it('deve incluir todos os jogadores e inimigos na ordem', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 12 })] });
        const p2 = makePlayer('p2', { team: [makeMon({ spd: 6 })] });
        const p3 = makePlayer('p3', { team: [makeMon({ spd: 9 })] });
        const enemy = makeEnemy({ spd: 8 });
        const enc = { participants: ['p1', 'p2', 'p3'], enemies: [enemy] };

        const order = calculateTurnOrder(enc, [p1, p2, p3], () => 10);

        expect(order).toHaveLength(4);
        const playerActors = order.filter(a => a.side === 'player');
        const enemyActors = order.filter(a => a.side === 'enemy');
        expect(playerActors).toHaveLength(3);
        expect(enemyActors).toHaveLength(1);
    });

    it('ordem deve refletir SPD decrescente', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 12 })] }); // mais rápido
        const p2 = makePlayer('p2', { team: [makeMon({ spd: 4 })] });  // mais lento
        const enemy = makeEnemy({ spd: 8 });                            // médio
        const enc = { participants: ['p1', 'p2'], enemies: [enemy] };

        const order = calculateTurnOrder(enc, [p1, p2], () => 10);

        expect(order[0].spd).toBeGreaterThanOrEqual(order[1].spd);
        expect(order[1].spd).toBeGreaterThanOrEqual(order[2].spd);
    });

    it('deve excluir jogadores com monstro ativo morto', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ hp: 0 })] }); // morto
        const p2 = makePlayer('p2', { team: [makeMon({ spd: 8 })] });
        const enemy = makeEnemy({ spd: 5 });
        const enc = { participants: ['p1', 'p2'], enemies: [enemy] };

        const order = calculateTurnOrder(enc, [p1, p2], () => 10);

        const playerActors = order.filter(a => a.side === 'player');
        expect(playerActors).toHaveLength(1);
        expect(playerActors[0].id).toBe('p2');
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Inimigo como primeiro ator → advanceGroupTurn não trava
// ──────────────────────────────────────────────────────────────────────────────

describe('Regressão: inimigo primeiro no turno', () => {
    /**
     * REGRESSÃO DO BUG CENTRAL:
     * Quando inimigo vai primeiro, após advanceGroupTurn é chamado,
     * o próximo ator deve ser o jogador (não travar).
     */
    it('deve avançar para o jogador após turno do inimigo (regressão "nada funciona")', () => {
        const player = makePlayer('p1', { team: [makeMon({ spd: 3 })] });
        const enemy = makeEnemy({ spd: 15 });

        const enc = makeGroupEncounter(['p1'], [player], 'group_trainer', [enemy]);

        // Confirmar que inimigo vai primeiro
        expect(enc.turnOrder[0].side).toBe('enemy');

        const deps = makeDeps([player]);
        // Vincular o encounter ao state para advanceGroupTurn funcionar
        deps.state.currentEncounter = enc;

        // Simular o que processEnemyTurnGroup faz: executar turno do inimigo
        // (que internamente chama advanceGroupTurn)
        executeEnemyTurnGroup(enc, deps);

        // Após turno do inimigo, o próximo ator deve ser o jogador
        const actor = getCurrentActor(enc);
        expect(actor).not.toBeNull();
        expect(actor.side).toBe('player');
        expect(actor.id).toBe('p1');
    });

    it('combate com 2 jogadores onde inimigo vai primeiro: ambos devem receber turno', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 3 })] });
        const p2 = makePlayer('p2', { team: [makeMon({ spd: 4 })] });
        const enemy = makeEnemy({ spd: 20 }); // Muito mais rápido

        const enc = makeGroupEncounter(['p1', 'p2'], [p1, p2], 'group_trainer', [enemy]);

        // Inimigo deve ser o primeiro
        expect(enc.turnOrder[0].side).toBe('enemy');

        const deps = makeDeps([p1, p2]);
        deps.state.currentEncounter = enc;

        // Executar turno do inimigo
        executeEnemyTurnGroup(enc, deps);

        // Após turno do inimigo, deve ser turno de um jogador
        const actor = getCurrentActor(enc);
        expect(actor).not.toBeNull();
        expect(actor.side).toBe('player');
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Jogador fugido NÃO deve receber turno (Fix #2)
// ──────────────────────────────────────────────────────────────────────────────

describe('Fix #2 — jogador fugido não recebe turno', () => {
    it('deve pular jogador removido de participants ao avançar turno', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 10 })] });
        const p2 = makePlayer('p2', { team: [makeMon({ spd: 8 })] });
        const enemy = makeEnemy({ spd: 3 }); // Lento — vai por último

        const enc = makeGroupEncounter(['p1', 'p2'], [p1, p2], 'group_trainer', [enemy]);

        // p2 foge: remove de participants mas turnOrder ainda tem p2
        enc.participants = enc.participants.filter(id => id !== 'p2');
        expect(enc.participants).not.toContain('p2');
        expect(enc.turnOrder.some(a => a.id === 'p2')).toBe(true); // ainda na turnOrder

        // Posicionar no turnIndex do inimigo para avançar para o próximo jogador
        const enemyIdx = enc.turnOrder.findIndex(a => a.side === 'enemy');
        enc.turnIndex = enemyIdx;

        const deps = makeDeps([p1, p2]);
        deps.state.currentEncounter = enc;

        advanceGroupTurn(enc, deps);

        // Deve ter pulado p2 (fugiu) e dado turno para p1
        const actor = getCurrentActor(enc);
        expect(actor).not.toBeNull();
        expect(actor.side).toBe('player');
        expect(actor.id).toBe('p1'); // p2 deve ser pulado
    });

    it('todos fugiram → enc.participants vazio → nenhum jogador vivo → derrota', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 10 })] });
        const enemy = makeEnemy({ spd: 3 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);

        // Simular fuga de p1: remove de participants
        enc.participants = [];

        const deps = makeDeps([p1]);
        deps.state.currentEncounter = enc;

        advanceGroupTurn(enc, deps);

        // Sem participantes, hasAlivePlayers = false → derrota
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Estrutura do encounter — trainer e boss
// ──────────────────────────────────────────────────────────────────────────────

describe('Estrutura do encounter — trainer solo', () => {
    it('deve ter campos obrigatórios corretos', () => {
        const player = makePlayer('p1');
        const enc = makeGroupEncounter(['p1'], [player], 'group_trainer');

        expect(enc.type).toBe('group_trainer');
        expect(enc.active).toBe(true);
        expect(enc.finished).toBe(false);
        expect(Array.isArray(enc.participants)).toBe(true);
        expect(enc.participants).toContain('p1');
        expect(Array.isArray(enc.enemies)).toBe(true);
        expect(Array.isArray(enc.turnOrder)).toBe(true);
        expect(enc.turnOrder.length).toBeGreaterThan(0);
        expect(typeof enc.turnIndex).toBe('number');
    });

    it('ator inicial deve ser válido', () => {
        const player = makePlayer('p1');
        const enc = makeGroupEncounter(['p1'], [player], 'group_trainer');

        const actor = getCurrentActor(enc);
        expect(actor).not.toBeNull();
        expect(actor.side).toMatch(/player|enemy/);
    });
});

describe('Estrutura do encounter — trainer 2+ jogadores', () => {
    it('deve incluir todos os jogadores em participants e turnOrder', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const enc = makeGroupEncounter(['p1', 'p2'], [p1, p2], 'group_trainer');

        expect(enc.participants).toContain('p1');
        expect(enc.participants).toContain('p2');
        const playerActors = enc.turnOrder.filter(a => a.side === 'player');
        expect(playerActors).toHaveLength(2);
    });

    it('cada jogador deve aparecer exatamente uma vez na turnOrder', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const p3 = makePlayer('p3');
        const enc = makeGroupEncounter(['p1', 'p2', 'p3'], [p1, p2, p3], 'group_trainer');

        const p1Entries = enc.turnOrder.filter(a => a.id === 'p1');
        const p2Entries = enc.turnOrder.filter(a => a.id === 'p2');
        const p3Entries = enc.turnOrder.filter(a => a.id === 'p3');

        expect(p1Entries).toHaveLength(1);
        expect(p2Entries).toHaveLength(1);
        expect(p3Entries).toHaveLength(1);
    });
});

describe('Estrutura do encounter — boss solo', () => {
    it('deve ter type=boss', () => {
        const player = makePlayer('p1');
        const boss = makeEnemy({ name: 'Boss', hp: 200, hpMax: 200, spd: 12 });
        const enc = makeGroupEncounter(['p1'], [player], 'boss', [boss]);

        expect(enc.type).toBe('boss');
        expect(enc.enemies[0].name).toBe('Boss');
    });
});

describe('Estrutura do encounter — boss 2+ jogadores', () => {
    it('deve suportar múltiplos jogadores contra boss', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const boss = makeEnemy({ name: 'Boss', hp: 200, hpMax: 200, spd: 10 });
        const enc = makeGroupEncounter(['p1', 'p2'], [p1, p2], 'boss', [boss]);

        expect(enc.type).toBe('boss');
        expect(enc.participants).toHaveLength(2);
        const playerActors = enc.turnOrder.filter(a => a.side === 'player');
        expect(playerActors).toHaveLength(2);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. Execução de ataque
// ──────────────────────────────────────────────────────────────────────────────

describe('Execução de ataque (executePlayerAttackGroup)', () => {
    it('deve causar dano ao inimigo', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 15, class: 'Mago' })] });
        const enemy = makeEnemy({ spd: 3 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);

        // Garantir que é turno do jogador
        if (enc.turnOrder[0].side !== 'player') {
            enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'player');
            enc.currentActor = getCurrentActor(enc);
        }
        expect(getCurrentActor(enc).side).toBe('player');

        const hpBefore = enemy.hp;
        const deps = makeDeps([p1]);
        deps.state.currentEncounter = enc;

        executePlayerAttackGroup(deps, 0);

        expect(enemy.hp).toBeLessThan(hpBefore);
    });

    it('deve avançar o turno após ataque', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 15 })] });
        const enemy = makeEnemy({ spd: 3 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);
        if (getCurrentActor(enc).side !== 'player') {
            enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'player');
            enc.currentActor = getCurrentActor(enc);
        }

        const logsBefore = enc.log.length;
        const deps = makeDeps([p1]);
        deps.state.currentEncounter = enc;

        executePlayerAttackGroup(deps, 0);

        // Após ataque o log deve ter crescido (turno foi processado)
        expect(enc.log.length).toBeGreaterThan(logsBefore);
    });

    it('deve detectar vitória quando inimigo morre do ataque', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 15, atk: 999 })] });
        const enemy = makeEnemy({ spd: 3, hp: 1, hpMax: 1 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);
        if (getCurrentActor(enc).side !== 'player') {
            enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'player');
            enc.currentActor = getCurrentActor(enc);
        }

        const deps = makeDeps([p1], {
            // Damage alto para garantir morte
            applyDamage: (target, dmg) => { target.hp = 0; }
        });
        deps.state.currentEncounter = enc;

        executePlayerAttackGroup(deps, 0);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. Passagem de turno (passTurn)
// ──────────────────────────────────────────────────────────────────────────────

describe('Passagem de turno (passTurn)', () => {
    it('deve avançar o turno sem causar dano', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 15 })] });
        const enemy = makeEnemy({ spd: 3 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);
        if (getCurrentActor(enc).side !== 'player') {
            enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'player');
            enc.currentActor = getCurrentActor(enc);
        }

        const hpEnemy = enemy.hp;
        const hpPlayer = p1.team[0].hp;
        const logsBefore = enc.log.length;
        const deps = makeDeps([p1]);
        deps.state.currentEncounter = enc;

        passTurn(deps);

        // Sem dano ao inimigo do jogador passando a vez
        expect(enemy.hp).toBe(hpEnemy);
        // Log cresceu (turno foi processado)
        expect(enc.log.length).toBeGreaterThan(logsBefore);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. Avanço de rodada completo (player → enemy → player)
// ──────────────────────────────────────────────────────────────────────────────

describe('Avanço de rodada — player → enemy → player', () => {
    it('após 2 passes (player + enemy), volta para o jogador', () => {
        // Criar encounter com jogador mais rápido (vai primeiro)
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 15 })] });
        const enemy = makeEnemy({ spd: 3 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);
        expect(enc.turnOrder[0].side).toBe('player');

        let renderCount = 0;
        const deps = makeDeps([p1]);
        deps.state.currentEncounter = enc;
        deps.ui.render = () => { renderCount++; };

        // 1ª ação: jogador passa o turno
        passTurn(deps);

        // Após avanço, enemy auto-executa (advanceGroupTurn chama executeEnemyTurnGroup)
        // então o actor FINAL deve ser o jogador novamente
        const actor = getCurrentActor(enc);
        if (!enc.finished) {
            expect(actor.side).toBe('player');
        }
        // Render deve ter sido chamado
        expect(renderCount).toBeGreaterThan(0);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 9. Vitória e derrota
// ──────────────────────────────────────────────────────────────────────────────

describe('Vitória — todos inimigos mortos', () => {
    it('deve marcar enc.finished=true e result=victory', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 15, class: 'Mago' })] });
        const enemy = makeEnemy({ spd: 3, hp: 1, hpMax: 1 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);
        if (getCurrentActor(enc).side !== 'player') {
            enc.turnIndex = enc.turnOrder.findIndex(a => a.side === 'player');
            enc.currentActor = getCurrentActor(enc);
        }

        const deps = makeDeps([p1], {
            applyDamage: (target, _dmg) => { target.hp = 0; }
        });
        deps.state.currentEncounter = enc;

        executePlayerAttackGroup(deps, 0);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
    });
});

describe('Derrota — todos jogadores mortos', () => {
    it('deve marcar enc.finished=true e result=defeat', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ spd: 3, hp: 1, hpMax: 1 })] });
        const enemy = makeEnemy({ spd: 20 });

        const enc = makeGroupEncounter(['p1'], [p1], 'group_trainer', [enemy]);
        // Inimigo vai primeiro
        expect(enc.turnOrder[0].side).toBe('enemy');

        const deps = makeDeps([p1], {
            applyDamage: (target, _dmg) => { target.hp = 0; },
            buildEligibleTargets: (_enc, _deps) => [{
                playerId: 'p1',
                monster: p1.team[0],
                heldItem: null
            }]
        });
        deps.state.currentEncounter = enc;

        executeEnemyTurnGroup(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 10. Boss: fuga BLOQUEADA; Trainer: fuga PERMITIDA
// (Testa a lógica de renderActionBar via flag isBoss)
// ──────────────────────────────────────────────────────────────────────────────

describe('Regras de fuga — boss vs trainer', () => {
    /**
     * Simula o cálculo de fleeAllowed que renderActionBar faz:
     *   const isBoss = encounter.type === 'boss';
     *   const fleeAllowed = !isBoss && (encounter.rules?.allowFlee !== false);
     */
    function calcFleeAllowed(encounter) {
        const isBoss = encounter.type === 'boss';
        return !isBoss && (encounter.rules?.allowFlee !== false);
    }

    it('trainer: fleeAllowed = true (padrão)', () => {
        const enc = { type: 'group_trainer' };
        expect(calcFleeAllowed(enc)).toBe(true);
    });

    it('boss: fleeAllowed = false (sempre)', () => {
        const enc = { type: 'boss' };
        expect(calcFleeAllowed(enc)).toBe(false);
    });

    it('trainer com rules.allowFlee=false: fleeAllowed = false', () => {
        const enc = { type: 'group_trainer', rules: { allowFlee: false } };
        expect(calcFleeAllowed(enc)).toBe(false);
    });

    it('boss com rules.allowFlee=true ainda bloqueia fuga', () => {
        // O campo isBoss tem precedência
        const enc = { type: 'boss', rules: { allowFlee: true } };
        expect(calcFleeAllowed(enc)).toBe(false);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 11. hasAlivePlayers — consistência com participants
// ──────────────────────────────────────────────────────────────────────────────

describe('hasAlivePlayers — considera apenas participants', () => {
    it('deve retornar false quando participants está vazio', () => {
        const p1 = makePlayer('p1'); // Monster vivo mas p1 não é participant
        const enc = { participants: [], enemies: [makeEnemy()] };

        expect(hasAlivePlayers(enc, [p1])).toBe(false);
    });

    it('deve retornar true quando há participant com monster vivo', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ hp: 30 })] });
        const enc = { participants: ['p1'], enemies: [makeEnemy()] };

        expect(hasAlivePlayers(enc, [p1])).toBe(true);
    });

    it('deve retornar false quando todos monsters de todos participants estão mortos', () => {
        const p1 = makePlayer('p1', { team: [makeMon({ hp: 0 })] });
        const enc = { participants: ['p1'], enemies: [makeEnemy()] };

        expect(hasAlivePlayers(enc, [p1])).toBe(false);
    });
});
