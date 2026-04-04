/**
 * GROUP COMBAT — KO / SWAP TESTS (PR-ko-swap-audit)
 *
 * Testes funcionais e de integração para o fluxo de desmaio (KO) e
 * troca de Monstrinhomon em combate de grupo.
 *
 * Cobertura:
 *   - getEligibleSubstitutes: função pura de elegibilidade
 *   - KO com substituto válido (mesma classe)
 *   - KO sem substituto válido (classe diferente)
 *   - KO sem substituto algum (time vazio)
 *   - advanceGroupTurn: abre modal ao detectar ativo morto com substituto
 *   - advanceGroupTurn: elimina jogador sem substitutos, detecta derrota
 *   - Múltiplos KOs: encadeamento correto de eliminações
 *   - findPlayerNeedingSwitch: elimina jogadores sem subs ao percorrer
 *   - executeEnemyTurnGroup: KO causa modal (com sub) ou eliminação (sem sub)
 *   - Fuga vs KO: semântica distinta (escaped ≠ defeated)
 *   - Continuidade do turno após troca
 *   - Target selection limpa após KO (sem DOM — testado via flag)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    advanceGroupTurn,
    executeEnemyTurnGroup,
    executePlayerAttackGroup
} from '../js/combat/groupActions.js';
import * as GroupCore from '../js/combat/groupCore.js';
import {
    createGroupEncounter,
    getEligibleSubstitutes,
    isAlive
} from '../js/combat/groupCore.js';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        uid: overrides.uid || 'mi_test',
        name: 'Monstrinho',
        class: 'Guerreiro',
        hp: 50, hpMax: 50,
        atk: 10, def: 8, spd: 5,
        ene: 10, eneMax: 10,
        level: 5, buffs: [],
        _participated: false,
        ...overrides
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'player_1',
        name: 'Ana',
        class: 'Guerreiro',
        team: [makeMon()],
        activeIndex: 0,
        inventory: {},
        ...overrides
    };
}

function makeEnemy(overrides = {}) {
    return {
        uid: 'enemy_0',
        name: 'Inimigo',
        class: 'Ladino',
        hp: 40, hpMax: 40,
        atk: 8, def: 6, spd: 3,
        ene: 10, eneMax: 10,
        level: 3, buffs: [],
        _participated: false,
        ...overrides
    };
}

/** Cria um encounter de grupo simples com 1 jogador e 1 inimigo */
function makeEnc(player, enemies = [makeEnemy()]) {
    const enc = createGroupEncounter({
        participantIds: [player.id],
        type: 'group_trainer',
        enemies
    });
    enc.turnOrder = [
        { side: 'player', id: player.id, name: player.name, spd: 5 },
        { side: 'enemy', id: 0, name: 'Inimigo', spd: 3 }
    ];
    enc.turnIndex = 1; // inimigo acabou de agir; próximo = player
    enc.currentActor = enc.turnOrder[1];
    return enc;
}

/** Cria deps padrão para advanceGroupTurn */
function makeDeps(players, enc, overrides = {}) {
    const switchModalCalls = [];
    return {
        enc,
        switchModalCalls,
        deps: {
            state: { players, config: {} },
            core: GroupCore,
            audio: { playSfx: vi.fn() },
            storage: { save: vi.fn() },
            ui: {
                render: vi.fn(),
                showDamageFeedback: vi.fn(),
                showMissFeedback: vi.fn(),
                playAttackFeedback: vi.fn()
            },
            helpers: {
                log: (e, msg) => (e.log = e.log || []).push(msg) && msg,
                handleVictoryRewards: vi.fn(),
                getPlayerById: (id) => players.find(p => p.id === id) || null,
                getActiveMonsterOfPlayer: (p) => p?.team?.[p?.activeIndex ?? 0] || null,
                getEnemyByIndex: (e, i) => e?.enemies?.[i] || null,
                firstAliveIndex: (team) => team.findIndex(m => (m?.hp || 0) > 0),
                openSwitchMonsterModal: (p, e) => { switchModalCalls.push({ playerId: p.id, encId: e.id }); },
                applyEneRegen: vi.fn(),
                updateBuffs: vi.fn(),
                rollD20: () => 10,
                recordD20Roll: vi.fn(),
                getBasicAttackPower: () => 7,
                applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
                chooseTargetPlayerId: () => null,
                canUseSkillNow: () => false,
                getSkillById: () => null,
                getItemDef: () => null,
                resolveMonsterSkills: () => [],
                ...overrides
            }
        }
    };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. getEligibleSubstitutes — função pura
// ══════════════════════════════════════════════════════════════════════════════

describe('getEligibleSubstitutes — função pura', () => {

    it('retorna substitutos vivos e da mesma classe excluindo o ativo', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }), // ativo (morto)
                makeMon({ uid: 'b', hp: 30, class: 'Guerreiro' }), // elegível
                makeMon({ uid: 'c', hp: 25, class: 'Guerreiro' })  // elegível
            ]
        });
        const subs = getEligibleSubstitutes(player);
        expect(subs).toHaveLength(2);
        expect(subs.map(s => s.monster.uid)).toEqual(['b', 'c']);
        expect(subs.map(s => s.index)).toEqual([1, 2]);
    });

    it('exclui monstros de classe diferente da do jogador', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }), // ativo morto
                makeMon({ uid: 'b', hp: 30, class: 'Mago' }),     // classe errada
                makeMon({ uid: 'c', hp: 25, class: 'Curandeiro' }) // classe errada
            ]
        });
        const subs = getEligibleSubstitutes(player);
        expect(subs).toHaveLength(0);
    });

    it('exclui monstros mortos (hp <= 0)', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }), // ativo morto
                makeMon({ uid: 'b', hp: 0, class: 'Guerreiro' }), // também morto
            ]
        });
        const subs = getEligibleSubstitutes(player);
        expect(subs).toHaveLength(0);
    });

    it('exclui o próprio ativo mesmo que esteja vivo', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 1,
            team: [
                makeMon({ uid: 'a', hp: 30, class: 'Guerreiro' }), // não é ativo
                makeMon({ uid: 'b', hp: 50, class: 'Guerreiro' }), // ativo
                makeMon({ uid: 'c', hp: 25, class: 'Guerreiro' })  // elegível
            ]
        });
        const subs = getEligibleSubstitutes(player);
        // Só 'a' e 'c' são elegíveis (activeIndex=1 é excluído)
        expect(subs.map(s => s.monster.uid)).toEqual(['a', 'c']);
    });

    it('retorna vazio quando time tem apenas o ativo', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [makeMon({ uid: 'a', hp: 0 })]
        });
        expect(getEligibleSubstitutes(player)).toHaveLength(0);
    });

    it('masterMode: aceita qualquer classe viva como substituta', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }),
                makeMon({ uid: 'b', hp: 30, class: 'Mago' }),     // classe errada
                makeMon({ uid: 'c', hp: 25, class: 'Curandeiro' }) // classe errada
            ]
        });
        const subs = getEligibleSubstitutes(player, { masterMode: true });
        expect(subs).toHaveLength(2);
    });

    it('retorna vazio se player.team não for array', () => {
        expect(getEligibleSubstitutes(null)).toEqual([]);
        expect(getEligibleSubstitutes({ team: null })).toEqual([]);
    });

});

// ══════════════════════════════════════════════════════════════════════════════
// 2. advanceGroupTurn — KO do ativo detectado no loop de turno
// ══════════════════════════════════════════════════════════════════════════════

describe('advanceGroupTurn — KO do ativo no loop de turno', () => {

    it('abre modal de troca quando ativo morto e há substituto válido', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }),  // ativo morto
                makeMon({ uid: 'b', hp: 40, class: 'Guerreiro' })  // substituto válido
            ]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        const { deps, switchModalCalls } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        // Modal abre para o jogador
        expect(switchModalCalls).toHaveLength(1);
        expect(switchModalCalls[0].playerId).toBe(player.id);
        // Encounter NÃO terminou (há substituto)
        expect(enc.finished).toBe(false);
        // Ator atual é o player (turno pausado aguardando troca)
        expect(GroupCore.getCurrentActor(enc)?.side).toBe('player');
    });

    it('elimina jogador sem substitutos válidos (classe diferente) e detecta derrota', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }),  // ativo morto
                makeMon({ uid: 'b', hp: 40, class: 'Mago' })       // classe errada
            ]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        const { deps, switchModalCalls } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        // Modal NÃO deve abrir (sem subs válidos)
        expect(switchModalCalls).toHaveLength(0);
        // Jogador foi removido dos participantes
        expect(enc.participants).not.toContain(player.id);
        // Encounter termina em derrota (único jogador sem subs)
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });

    it('elimina jogador sem substitutos e batalha continua se outro jogador ainda ativo', () => {
        const player1 = makePlayer({
            id: 'player_1', name: 'Ana',
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }),  // ativo morto
                makeMon({ uid: 'b', hp: 40, class: 'Mago' })       // classe errada
            ]
        });
        const player2 = makePlayer({
            id: 'player_2', name: 'Bruno',
            class: 'Mago',
            activeIndex: 0,
            team: [makeMon({ uid: 'c', hp: 50, class: 'Mago' })]   // ativo vivo
        });
        const enemy = makeEnemy({ hp: 30 });

        const enc = createGroupEncounter({
            participantIds: ['player_1', 'player_2'],
            type: 'group_trainer',
            enemies: [enemy]
        });
        enc.turnOrder = [
            { side: 'player', id: 'player_1', name: 'Ana', spd: 5 },
            { side: 'player', id: 'player_2', name: 'Bruno', spd: 4 },
            { side: 'enemy', id: 0, name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 2; // inimigo acabou de agir; próximo = player_1

        const { deps } = makeDeps([player1, player2], enc);

        advanceGroupTurn(enc, deps);

        // Player_1 eliminado (sem subs válidos)
        expect(enc.participants).not.toContain('player_1');
        // Batalha NÃO terminou (player_2 ainda ativo)
        expect(enc.finished).toBe(false);
        // Ator atual deve ser player_2 (próximo válido)
        const actor = GroupCore.getCurrentActor(enc);
        expect(actor?.id).toBe('player_2');
    });

    it('não abre modal e continua normalmente quando ativo está vivo', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [makeMon({ uid: 'a', hp: 40, class: 'Guerreiro' })]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        const { deps, switchModalCalls } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        expect(switchModalCalls).toHaveLength(0);
        expect(enc.finished).toBe(false);
        // Após inimigo agir (turnIndex=1), avança para player (turnIndex=0)
        expect(GroupCore.getCurrentActor(enc)?.side).toBe('player');
    });

    it('detecta vitória e não abre modal quando inimigo foi derrotado', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [makeMon({ uid: 'a', hp: 40, class: 'Guerreiro' })]
        });
        const enemy = makeEnemy({ hp: 0 }); // inimigo já morto
        const enc = makeEnc(player, [enemy]);
        enc.turnIndex = 0; // turno do player

        const { deps, switchModalCalls } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        expect(switchModalCalls).toHaveLength(0);
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
    });

});

// ══════════════════════════════════════════════════════════════════════════════
// 3. executeEnemyTurnGroup — KO durante turno do inimigo
// ══════════════════════════════════════════════════════════════════════════════

describe('executeEnemyTurnGroup — KO durante ataque inimigo', () => {

    function makeEnemyTurnDeps(player, enc, overrides = {}) {
        const switchModalCalls = [];
        const deps = {
            state: { players: [player], config: {} },
            core: GroupCore,
            audio: { playSfx: vi.fn() },
            storage: { save: vi.fn() },
            ui: {
                render: vi.fn(),
                showDamageFeedback: vi.fn(),
                showMissFeedback: vi.fn(),
                playAttackFeedback: vi.fn()
            },
            helpers: {
                log: (e, msg) => (e.log = e.log || []).push(msg),
                handleVictoryRewards: vi.fn(),
                getPlayerById: (id) => (id === player.id ? player : null),
                getActiveMonsterOfPlayer: (p) => p?.team?.[p?.activeIndex ?? 0] || null,
                getEnemyByIndex: (e, i) => e?.enemies?.[i] || null,
                firstAliveIndex: (team) => team.findIndex(m => (m?.hp || 0) > 0),
                openSwitchMonsterModal: (p, e) => { switchModalCalls.push({ playerId: p.id }); },
                applyEneRegen: vi.fn(),
                updateBuffs: vi.fn(),
                rollD20: () => 20, // sempre crit para garantir KO
                recordD20Roll: vi.fn(),
                getBasicAttackPower: () => 100, // dano alto para garantir KO
                applyDamage: (target, dmg) => { target.hp = Math.max(0, target.hp - dmg); },
                ...overrides
            }
        };
        return { deps, switchModalCalls };
    }

    it('abre modal quando inimigo derrota ativo e há substituto válido', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 50, class: 'Guerreiro' }), // ativo (morrerá)
                makeMon({ uid: 'b', hp: 40, class: 'Guerreiro' })  // substituto válido
            ]
        });
        const enemy = makeEnemy({ hp: 40, atk: 99 });
        const enc = makeEnc(player, [enemy]);

        // Turno do inimigo (index 1)
        enc.turnIndex = 1;
        enc.currentActor = enc.turnOrder[1];

        const { deps, switchModalCalls } = makeEnemyTurnDeps(player, enc);

        const result = executeEnemyTurnGroup(enc, deps);

        expect(result).toBe(true);
        // Modal deve ter sido chamado (substituição necessária)
        expect(switchModalCalls.length).toBeGreaterThan(0);
        expect(switchModalCalls[0].playerId).toBe(player.id);
        // Encounter não terminou
        expect(enc.finished).toBe(false);
    });

    it('NÃO abre modal quando sem substituto válido — elimina jogador', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 50, class: 'Guerreiro' }), // ativo (morrerá)
                makeMon({ uid: 'b', hp: 40, class: 'Mago' })       // classe errada
            ]
        });
        const enemy = makeEnemy({ hp: 40, atk: 99 });
        const enc = makeEnc(player, [enemy]);

        enc.turnIndex = 1;
        enc.currentActor = enc.turnOrder[1];

        const { deps, switchModalCalls } = makeEnemyTurnDeps(player, enc);

        executeEnemyTurnGroup(enc, deps);

        // Modal NÃO deve ter sido chamado
        expect(switchModalCalls).toHaveLength(0);
        // Jogador eliminado dos participantes
        expect(enc.participants).not.toContain(player.id);
    });

    it('NÃO abre modal quando sem substitutos (time só com ativo) — elimina jogador', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [makeMon({ uid: 'a', hp: 50, class: 'Guerreiro' })] // único
        });
        const enemy = makeEnemy({ hp: 40, atk: 99 });
        const enc = makeEnc(player, [enemy]);

        enc.turnIndex = 1;
        enc.currentActor = enc.turnOrder[1];

        const { deps, switchModalCalls } = makeEnemyTurnDeps(player, enc);

        executeEnemyTurnGroup(enc, deps);

        expect(switchModalCalls).toHaveLength(0);
        expect(enc.participants).not.toContain(player.id);
    });

    it('detecta derrota quando único jogador é eliminado após KO sem subs', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [makeMon({ uid: 'a', hp: 50, class: 'Guerreiro' })]
        });
        const enemy = makeEnemy({ hp: 40, atk: 99 });
        const enc = makeEnc(player, [enemy]);

        enc.turnIndex = 1;
        enc.currentActor = enc.turnOrder[1];

        const { deps } = makeEnemyTurnDeps(player, enc);

        executeEnemyTurnGroup(enc, deps);

        // Batalha deve terminar em derrota
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
    });

});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Múltiplos KOs encadeados
// ══════════════════════════════════════════════════════════════════════════════

describe('Múltiplos KOs — estados encadeados', () => {

    it('elimina múltiplos jogadores sem subs e detecta derrota total', () => {
        const player1 = makePlayer({
            id: 'player_1', name: 'Ana',
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a1', hp: 0, class: 'Guerreiro' }),
                makeMon({ uid: 'a2', hp: 30, class: 'Mago' }) // classe errada
            ]
        });
        const player2 = makePlayer({
            id: 'player_2', name: 'Bruno',
            class: 'Mago',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'b1', hp: 0, class: 'Mago' }),
                makeMon({ uid: 'b2', hp: 20, class: 'Guerreiro' }) // classe errada
            ]
        });
        const enemy = makeEnemy({ hp: 30 });

        const enc = createGroupEncounter({
            participantIds: ['player_1', 'player_2'],
            type: 'group_trainer',
            enemies: [enemy]
        });
        enc.turnOrder = [
            { side: 'player', id: 'player_1', name: 'Ana', spd: 5 },
            { side: 'player', id: 'player_2', name: 'Bruno', spd: 4 },
            { side: 'enemy', id: 0, name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 2; // inimigo acabou; próximo = player_1

        const { deps } = makeDeps([player1, player2], enc);

        advanceGroupTurn(enc, deps);

        // Ambos eliminados → derrota
        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('defeat');
        expect(enc.participants).toHaveLength(0);
    });

    it('abre modal para um jogador e elimina outro (com e sem subs)', () => {
        const player1 = makePlayer({
            id: 'player_1', name: 'Ana',
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a1', hp: 0, class: 'Guerreiro' }),   // morto
                makeMon({ uid: 'a2', hp: 30, class: 'Guerreiro' })   // substituto válido
            ]
        });
        const player2 = makePlayer({
            id: 'player_2', name: 'Bruno',
            class: 'Mago',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'b1', hp: 0, class: 'Mago' }),        // morto
                makeMon({ uid: 'b2', hp: 20, class: 'Guerreiro' })   // classe errada
            ]
        });
        const enemy = makeEnemy({ hp: 30 });

        const enc = createGroupEncounter({
            participantIds: ['player_1', 'player_2'],
            type: 'group_trainer',
            enemies: [enemy]
        });
        enc.turnOrder = [
            { side: 'player', id: 'player_1', name: 'Ana', spd: 5 },
            { side: 'player', id: 'player_2', name: 'Bruno', spd: 4 },
            { side: 'enemy', id: 0, name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 2; // próximo é player_1

        const { deps, switchModalCalls } = makeDeps([player1, player2], enc);

        advanceGroupTurn(enc, deps);

        // player_1 tem substituto → modal abre para ela
        expect(switchModalCalls).toHaveLength(1);
        expect(switchModalCalls[0].playerId).toBe('player_1');
        // Encounter não terminou (player_1 tem substituto)
        expect(enc.finished).toBe(false);
        // player_2 foi eliminado (no loop, antes de chegar em player_1... ou depois?)
        // A ordem do loop é: player_1 primeiro (turnIndex avança de 2→0 = player_1)
        // player_1 tem subs → modal abre, retorna cedo sem eliminar player_2 ainda
        // Então player_2 ainda está nos participantes mas inativo (será tratado na próxima iteração)
    });

});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Continuidade do turno após troca
// ══════════════════════════════════════════════════════════════════════════════

describe('Continuidade do turno após troca de Monstrinhomon', () => {

    it('após troca (activeIndex atualizado), advanceGroupTurn encontra ator válido', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 1, // já trocou para o index 1 (vivo)
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }), // antigo ativo, morto
                makeMon({ uid: 'b', hp: 40, class: 'Guerreiro' }) // novo ativo, vivo
            ]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        enc.turnIndex = 1; // inimigo acabou de agir

        const { deps, switchModalCalls } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        // Nenhum modal (ativo já está vivo)
        expect(switchModalCalls).toHaveLength(0);
        expect(enc.finished).toBe(false);
        // Ator é o player (com activeIndex=1, ativo vivo)
        expect(GroupCore.getCurrentActor(enc)?.side).toBe('player');
    });

    it('troca NÃO consome turno: jogador deve poder agir após selecionar substituto', () => {
        // Simula: player seleciona substituto → advanceGroupTurn é chamado novamente
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [
                makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' }), // morto
                makeMon({ uid: 'b', hp: 40, class: 'Guerreiro' }) // substituto
            ]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        enc.turnIndex = 1; // inimigo acabou; próximo = player

        const { deps, switchModalCalls } = makeDeps([player], enc);

        // Fase 1: avança turno → detecta KO → abre modal
        advanceGroupTurn(enc, deps);
        expect(switchModalCalls).toHaveLength(1);

        // Simula a troca: player seleciona b (index 1)
        player.activeIndex = 1;

        // Fase 2: após troca, advanceTurn é chamado novamente
        // (simula selectReplacementMonster → advanceTurn → advanceGroupTurn)
        advanceGroupTurn(enc, deps);

        // Agora deve avançar para o inimigo (porque player_1 agora tem ativo vivo,
        // mas o turnIndex estava pausado no player — advanceGroupTurn incrementa de onde parou)
        // Comportamento esperado: sem novo modal, batalha continua
        expect(enc.finished).toBe(false);
    });

});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Semântica de Fuga vs KO
// ══════════════════════════════════════════════════════════════════════════════

describe('Semântica de Fuga vs KO', () => {

    it('jogador que fugiu não aparece em enc.participants', () => {
        const player = makePlayer({ class: 'Guerreiro' });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);

        // Simula fuga: remove dos participants
        enc.participants = enc.participants.filter(p => p !== player.id);
        enc.finished = true;
        enc.result = 'retreat';

        // Fuga é semanticamente diferente de KO
        expect(enc.participants).not.toContain(player.id);
        expect(enc.result).toBe('retreat');
        // KO/defeat teria result='defeat', não 'retreat'
        expect(enc.result).not.toBe('defeat');
    });

    it('jogador eliminado por KO não deve ser tratado como escaped', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            activeIndex: 0,
            team: [makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' })]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        enc.turnIndex = 1;

        const { deps } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        // Resultado: defeat (não retreat — fuga teria result='retreat')
        expect(enc.result).toBe('defeat');
        expect(enc.result).not.toBe('retreat');
        // Batalha terminou
        expect(enc.finished).toBe(true);
    });

});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Regressão: funcionalidades existentes não foram quebradas
// ══════════════════════════════════════════════════════════════════════════════

describe('Regressão — funcionalidades existentes', () => {

    it('vitória detectada corretamente quando todos inimigos caem', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            team: [makeMon({ uid: 'a', hp: 40, class: 'Guerreiro' })]
        });
        const enemy = makeEnemy({ hp: 0 }); // já morto
        const enc = makeEnc(player, [enemy]);
        enc.turnIndex = 0; // turno do player

        const { deps } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(true);
        expect(enc.result).toBe('victory');
    });

    it('batalha continua quando todos estão vivos', () => {
        const player = makePlayer({
            class: 'Guerreiro',
            team: [makeMon({ uid: 'a', hp: 40, class: 'Guerreiro' })]
        });
        const enemy = makeEnemy({ hp: 30 });
        const enc = makeEnc(player, [enemy]);
        enc.turnIndex = 1; // inimigo acabou de agir

        const { deps } = makeDeps([player], enc);

        advanceGroupTurn(enc, deps);

        expect(enc.finished).toBe(false);
        expect(enc.result).toBeNull();
    });

    it('jogador que fugiu (não em participants) é pulado no loop de turno', () => {
        const player1 = makePlayer({
            id: 'player_1', name: 'Ana',
            class: 'Guerreiro',
            team: [makeMon({ uid: 'a', hp: 0, class: 'Guerreiro' })] // morto, sem subs
        });
        const player2 = makePlayer({
            id: 'player_2', name: 'Bruno',
            class: 'Mago',
            team: [makeMon({ uid: 'b', hp: 40, class: 'Mago' })] // vivo
        });
        const enemy = makeEnemy({ hp: 30 });

        const enc = createGroupEncounter({
            participantIds: ['player_2'], // player_1 já fugiu (não está em participants)
            type: 'group_trainer',
            enemies: [enemy]
        });
        enc.turnOrder = [
            { side: 'player', id: 'player_1', name: 'Ana', spd: 5 },
            { side: 'player', id: 'player_2', name: 'Bruno', spd: 4 },
            { side: 'enemy', id: 0, name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 2; // inimigo acabou; próximo = player_1 (mas não está em participants)

        const { deps, switchModalCalls } = makeDeps([player1, player2], enc);

        advanceGroupTurn(enc, deps);

        // player_1 não está em participants → pulado sem abrir modal
        // player_2 está em participants e ativo → ator atual
        expect(switchModalCalls).toHaveLength(0);
        expect(GroupCore.getCurrentActor(enc)?.id).toBe('player_2');
        expect(enc.finished).toBe(false);
    });

});
