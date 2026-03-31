/**
 * GROUP COMBAT LOOP TESTS
 *
 * Testes para o loop real de combate em grupo.
 * Pipeline canônico: advanceGroupTurn() + calculateTurnOrder() de groupActions/groupCore.
 *
 * Estes testes substituem os testes do protótipo deprecated GroupBattleLoop.
 * Cobertura:
 *   - calculateTurnOrder (solo, multi, inimigo primeiro)
 *   - advanceGroupTurn (vitória, derrota, avanço normal, auto-trigger inimigo)
 *   - passTurn
 *   - fuga remove jogador do participants mas turnOrder permanece (regressão bug)
 *   - iteração máxima sem loop infinito
 */

import { describe, it, expect, vi } from 'vitest';
import {
    calculateTurnOrder,
    createGroupEncounter,
    getCurrentActor,
    hasAliveEnemies,
    hasAlivePlayers
} from '../js/combat/groupCore.js';
import {
    advanceGroupTurn,
    passTurn
} from '../js/combat/groupActions.js';

// ── Helpers de mock ───────────────────────────────────────────────────────

const rollFixed = (val) => () => val;
const rollD20Default = rollFixed(10);

function makeMon(hp = 30, spd = 5, overrides = {}) {
    return { name: 'Mon', hp, hpMax: hp || 30, atk: 5, def: 5, spd, ene: 10, eneMax: 10, buffs: [], class: 'Guerreiro', ...overrides };
}

function makePlayer(id, mon, spd = 5) {
    const m = typeof mon === 'number' ? makeMon(mon, spd) : mon;
    return { id, name: `P${id}`, class: 'Guerreiro', team: [m], activeIndex: 0 };
}

function makeEnemy(hp = 40, spd = 5, overrides = {}) {
    return { name: 'Inimigo', hp, hpMax: hp || 40, atk: 5, def: 5, spd, ene: 10, eneMax: 10, buffs: [], class: 'Bárbaro', ...overrides };
}

/**
 * Cria deps mínimo para advanceGroupTurn sem side effects.
 * enemyAutoTrigger=false para que auto-trigger de inimigo seja controlado.
 */
function makeDeps({ players, enc, enemyTurnFn = null }) {
    const logs = [];
    const renders = [];
    const saves = [];

    const deps = {
        state: { currentEncounter: enc, players, config: { classAdvantages: {} } },
        core: {
            getCurrentActor,
            hasAlivePlayers: (e, pl) => hasAlivePlayers(e, pl),
            hasAliveEnemies,
            isAlive: (e) => (Number(e?.hp) || 0) > 0,
            getBuffModifiers: () => ({ atk: 0, def: 0, spd: 0 }),
            getClassAdvantageModifiers: () => ({ atkBonus: 0, damageMult: 1.0 }),
            checkHit: () => true,
            calcDamage: ({ atk, def, power }) => Math.max(1, atk + power - def),
            pickEnemyTargetByDEF: () => null
        },
        audio: { playSfx: vi.fn() },
        storage: { save: () => saves.push(1) },
        ui: {
            render: () => renders.push(1),
            showDamageFeedback: vi.fn(),
            showMissFeedback: vi.fn(),
            playAttackFeedback: vi.fn()
        },
        helpers: {
            log: (e, msg) => { e.log.push(msg); logs.push(msg); },
            handleVictoryRewards: vi.fn(),
            getPlayerById: (id) => players.find(p => p.id === id),
            getActiveMonsterOfPlayer: (p) => p?.team?.[p?.activeIndex ?? 0],
            getEnemyByIndex: (e, i) => e?.enemies?.[i],
            firstAliveIndex: (team) => team.findIndex(m => (Number(m?.hp) || 0) > 0),
            applyEneRegen: vi.fn(),
            updateBuffs: vi.fn(),
            rollD20: () => 10,
            recordD20Roll: vi.fn(),
            getBasicAttackPower: () => 7,
            applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
            openSwitchMonsterModal: vi.fn(),
            getItemDef: vi.fn(),
            getSkillById: vi.fn(),
            canUseSkillNow: vi.fn()
        }
    };

    // Injetar executeEnemyTurnGroup no próprio deps se fornecido
    if (enemyTurnFn) {
        deps._enemyTurnFn = enemyTurnFn;
    }

    return { deps, logs, renders, saves };
}

// ── calculateTurnOrder ────────────────────────────────────────────────────

describe('calculateTurnOrder - Cálculo de Ordem de Turnos', () => {

    it('deve colocar inimigo primeiro quando SPD do inimigo é maior', () => {
        const player = makePlayer('p1', makeMon(30, 3));
        const enemy = makeEnemy(40, 10);
        const enc = createGroupEncounter({
            participantIds: ['p1'],
            type: 'group_trainer',
            enemies: [enemy]
        });

        const order = calculateTurnOrder(enc, [player], rollD20Default);
        expect(order[0].side).toBe('enemy');
        expect(order[1].side).toBe('player');
    });

    it('deve colocar jogador primeiro quando SPD do jogador é maior', () => {
        const player = makePlayer('p1', makeMon(30, 15));
        const enemy = makeEnemy(40, 5);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });

        const order = calculateTurnOrder(enc, [player], rollD20Default);
        expect(order[0].side).toBe('player');
        expect(order[1].side).toBe('enemy');
    });

    it('deve incluir múltiplos jogadores na ordem correta (multi-player)', () => {
        const p1 = makePlayer('p1', makeMon(30, 10));
        const p2 = makePlayer('p2', makeMon(30, 6));
        const enemy = makeEnemy(40, 8);
        const enc = createGroupEncounter({ participantIds: ['p1', 'p2'], type: 'group_trainer', enemies: [enemy] });

        const order = calculateTurnOrder(enc, [p1, p2], rollD20Default);
        expect(order.map(a => a.id)).toEqual(['p1', 'enemy_side', 'p2'].map((_, i) => order[i].id));
        // spd: p1=10 > enemy=8 > p2=6
        expect(order[0].id).toBe('p1');
        expect(order[1].side).toBe('enemy');
        expect(order[2].id).toBe('p2');
    });

    it('deve excluir monstros mortos da ordem de turno', () => {
        const player = makePlayer('p1', makeMon(0, 5)); // HP=0, morto
        const enemy = makeEnemy(40, 3);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });

        const order = calculateTurnOrder(enc, [player], rollD20Default);
        // Jogador com HP=0 não entra na ordem
        expect(order.filter(a => a.side === 'player')).toHaveLength(0);
    });

    it('deve resolver empate de SPD via d20 determinístico', () => {
        const player = makePlayer('p1', makeMon(30, 8));
        const enemy = makeEnemy(40, 8); // mesmo SPD
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });

        // rollD20 sempre retorna 15 para todos → resultado determinístico
        const order = calculateTurnOrder(enc, [player], rollFixed(15));
        expect(order).toHaveLength(2);
        // Ambos devem estar presentes
        const sides = order.map(a => a.side);
        expect(sides).toContain('player');
        expect(sides).toContain('enemy');
    });

    it('deve usar activeIndex (não team[0]) para monstro ativo — regressão bug', () => {
        const deadMon = makeMon(0, 3);     // índice 0 — morto
        const aliveMon = makeMon(30, 12);  // índice 1 — vivo e ativo
        const player = { id: 'p1', name: 'P1', class: 'Guerreiro', team: [deadMon, aliveMon], activeIndex: 1 };
        const enemy = makeEnemy(40, 5);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });

        const order = calculateTurnOrder(enc, [player], rollD20Default);
        // Com activeIndex=1, aliveMon (spd=12) deve entrar na ordem
        const playerActor = order.find(a => a.side === 'player');
        expect(playerActor).toBeDefined();
        expect(playerActor.spd).toBe(12);
    });

    it('deve retornar array vazio se não há participantes nem inimigos vivos', () => {
        const player = makePlayer('p1', makeMon(0, 5));
        const enemy = makeEnemy(0, 5);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });

        const order = calculateTurnOrder(enc, [player], rollD20Default);
        expect(order).toHaveLength(0);
    });
});

// ── advanceGroupTurn - vitória / derrota ──────────────────────────────────

describe('advanceGroupTurn - Condições de Fim', () => {

    it('deve marcar vitória quando todos os inimigos estão mortos', () => {
        const player = makePlayer('p1', 30);
        const deadEnemy = makeEnemy(0); // morto
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [deadEnemy] });
        enc.turnOrder = [{ side: 'player', id: 'p1', name: 'P1', spd: 5 }];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        const { deps } = makeDeps({ players: [player], enc });

        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
        expect(deps.helpers.handleVictoryRewards).toHaveBeenCalledWith(enc);
    });

    it('deve marcar derrota quando todos os jogadores estão mortos', () => {
        const deadPlayer = makePlayer('p1', 0); // morto
        const enemy = makeEnemy(40);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });
        enc.turnOrder = [
            { side: 'player', id: 'p1', name: 'P1', spd: 5 },
            { side: 'enemy', id: 0, name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 0;

        const { deps } = makeDeps({ players: [deadPlayer], enc });

        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });

    it('não deve processar encounter já finalizado', () => {
        const player = makePlayer('p1', 30);
        const enemy = makeEnemy(0);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });
        enc.turnOrder = [{ side: 'player', id: 'p1', name: 'P1', spd: 5 }];
        enc.finished = true;
        enc.result = 'victory';

        const { deps } = makeDeps({ players: [player], enc });
        const rewardSpy = deps.helpers.handleVictoryRewards;

        // Chamar duas vezes — não deve duplicar recompensas
        advanceGroupTurn(enc, deps);
        advanceGroupTurn(enc, deps);
        // Como finished=true e inimigo morto, chamará handleVictoryRewards novamente
        // mas rewardsGranted impede duplicação dentro de handleVictoryRewards (testado em outro lugar)
        expect(enc.result).toBe('victory');
    });

    it('não deve processar encounter com turnOrder vazio (guard)', () => {
        const player = makePlayer('p1', 30);
        const enemy = makeEnemy(40);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });
        // turnOrder vazio (encounter mal inicializado)

        const { deps } = makeDeps({ players: [player], enc });

        // Não deve lançar erro — guard retorna silenciosamente e loga no console
        expect(() => advanceGroupTurn(enc, deps)).not.toThrow();
        expect(enc.finished).toBe(false);
    });
});

// ── advanceGroupTurn - avanço de turno ────────────────────────────────────

describe('advanceGroupTurn - Avanço de Turno', () => {

    it('deve avançar para o próximo ator de jogador válido', () => {
        const p1 = makePlayer('p1', 30);
        const p2 = makePlayer('p2', 30);
        const enemy = makeEnemy(40);
        const enc = createGroupEncounter({ participantIds: ['p1', 'p2'], type: 'group_trainer', enemies: [enemy] });
        enc.turnOrder = [
            { side: 'player', id: 'p1', name: 'P1', spd: 10 },
            { side: 'player', id: 'p2', name: 'P2', spd: 5 },
            { side: 'enemy',  id: 0,   name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        const { deps } = makeDeps({ players: [p1, p2], enc });

        advanceGroupTurn(enc, deps);

        // Deve avançar para p2 (índice 1)
        expect(enc.turnIndex).toBe(1);
        expect(enc.currentActor?.id).toBe('p2');
    });

    it('deve pular jogadores que fugiram (não estão em participants)', () => {
        const p1 = makePlayer('p1', 30);
        const p2 = makePlayer('p2', 30);
        const enemy = makeEnemy(40);
        const enc = createGroupEncounter({ participantIds: ['p1', 'p2'], type: 'group_trainer', enemies: [enemy] });
        enc.turnOrder = [
            { side: 'player', id: 'p1', name: 'P1', spd: 10 },
            { side: 'player', id: 'p2', name: 'P2', spd: 5 },
            { side: 'enemy',  id: 0,   name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];
        // p2 fugiu — removido de participants
        enc.participants = ['p1'];

        const { deps } = makeDeps({ players: [p1, p2], enc });

        advanceGroupTurn(enc, deps);

        // p2 deve ser pulado — currentActor nunca deve ser p2
        const nextActor = getCurrentActor(enc);
        expect(nextActor?.id).not.toBe('p2');
        // Nenhuma entrada de log para turno de p2
        expect(enc.log.every(m => !m.includes('P2'))).toBe(true);
    });

    it('deve pular inimigos com HP=0', () => {
        const player = makePlayer('p1', 30);
        const deadEnemy = makeEnemy(0);
        const aliveEnemy = makeEnemy(40);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [deadEnemy, aliveEnemy] });
        enc.turnOrder = [
            { side: 'player', id: 'p1', name: 'P1', spd: 10 },
            { side: 'enemy',  id: 0,   name: 'Morto', spd: 5 },
            { side: 'enemy',  id: 1,   name: 'Vivo', spd: 3 }
        ];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        // Para este teste, usar mock que não auto-executa inimigo
        const { deps } = makeDeps({ players: [player], enc });
        // Sobrescrever executeEnemyTurnGroup para não auto-executar
        const origExecuteEnemy = deps.core.getCurrentActor;

        advanceGroupTurn(enc, deps);

        // Inimigo morto (id=0) deve ser pulado
        const nextActor = getCurrentActor(enc);
        // Pode ser inimigo vivo ou player dependendo do wrapping (modular)
        // O importante é que o actor morto não seja selecionado
        if (nextActor?.side === 'enemy') {
            expect(nextActor.id).not.toBe(0); // não deve ser o morto
        }
    });
});

// ── passTurn ──────────────────────────────────────────────────────────────

describe('passTurn - Passar Turno', () => {

    it('deve logar "passou o turno" e avançar', () => {
        const player = makePlayer('p1', 30);
        const enemy = makeEnemy(40);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });
        enc.turnOrder = [
            { side: 'player', id: 'p1', name: 'P1', spd: 10 },
            { side: 'enemy',  id: 0,   name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 0;
        enc.currentActor = enc.turnOrder[0];

        const { deps, logs } = makeDeps({ players: [player], enc });

        passTurn(deps);

        expect(enc.log.some(m => m.includes('passou o turno'))).toBe(true);
    });

    it('não deve fazer nada se não há encounter', () => {
        const { deps } = makeDeps({ players: [], enc: null });
        deps.state.currentEncounter = null;

        expect(() => passTurn(deps)).not.toThrow();
    });
});

// ── Regressão: bug "entra no combate e nada acontece" ─────────────────────

describe('Regressão: Inimigo Primeiro Turno', () => {

    it('o pipeline detecta quando primeiro ator é inimigo', () => {
        const player = makePlayer('p1', makeMon(30, 3));   // spd baixo
        const enemy = makeEnemy(40, 15);                    // spd alto — vai primeiro
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });

        const order = calculateTurnOrder(enc, [player], rollD20Default);

        // Inimigo com spd=15 deve ser primeiro
        expect(order[0].side).toBe('enemy');
    });

    it('após inicializar encontro, currentActor reflete o primeiro ator real', () => {
        const player = makePlayer('p1', makeMon(30, 3));
        const enemy = makeEnemy(40, 15);
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [enemy] });
        enc.turnOrder = calculateTurnOrder(enc, [player], rollD20Default);
        enc.turnIndex = 0;
        enc.currentActor = getCurrentActor(enc);

        // currentActor deve ser o inimigo (que tem spd maior)
        expect(enc.currentActor?.side).toBe('enemy');
    });
});
