/**
 * TRADE SAVE/LOAD PERSISTENCE TESTS
 *
 * Cobertura de regressão para o fluxo de Trade canônico:
 *   - trade bilateral (helper de proposta/aceite de teste sobre API canônica)
 *   - consistência de ownerId após trade
 *   - consistência de time (sem undefined, activeIndex válido)
 *   - consistência com Box (time↔Box, time cheio, sem duplicação)
 *   - persistência pós-trade via save/load (JSON round-trip)
 *   - therapy log (registrado, sem duplicação, não bloqueia se ausente)
 *   - bloqueios sem mutação de estado (KO, ativo em batalha, entrada inválida)
 *
 * Fonte canônica:
 *   - js/combat/tradeSystem.js  (executeTrade, validateTrade)
 */

import { describe, it, expect } from 'vitest';
import {
    executeTrade,
} from '../js/combat/tradeSystem.js';

/**
 * Shim de compatibilidade para cenários legados de persistência:
 * - O módulo legado real foi removido no PR-C.
 * - Estes helpers são restritos ao escopo de teste para manter cobertura
 *   histórica (proposta/aceite) sem reintroduzir dependência de runtime legado.
 * - A intenção é preservar os cenários originais que validavam o padrão de
 *   adaptação durante a migração, agora exercendo a API canônica por baixo.
 */
const TRADE_ERROR_LEGACY = {
    INVALID_PLAYER:       'INVALID_PLAYER',
    SAME_PLAYER:          'SAME_PLAYER',
    MONSTER_NOT_FOUND:    'MONSTER_NOT_FOUND',
    MONSTER_IN_BATTLE:    'MONSTER_IN_BATTLE',
    MONSTER_KO:           'MONSTER_KO',
    INVALID_INSTANCE:     'INVALID_INSTANCE',
};

function findMonsterLocation(player, instanceId, sharedBox = []) {
    const team = Array.isArray(player?.team) ? player.team : [];
    const teamIndex = team.findIndex(m => m && (m.id === instanceId || m.instanceId === instanceId));
    if (teamIndex >= 0) {
        return { monster: team[teamIndex], teamIndex, fromBox: false };
    }

    const slot = sharedBox.find(s =>
        s?.ownerPlayerId === player?.id &&
        s?.monster &&
        (s.monster.id === instanceId || s.monster.instanceId === instanceId)
    );
    if (slot?.monster) {
        return { monster: slot.monster, teamIndex: -1, fromBox: true };
    }

    return { monster: null, teamIndex: -1, fromBox: false };
}

function validateTradeLegacy(fromPlayer, toPlayer, instanceId, context = {}) {
    if (!fromPlayer || typeof fromPlayer !== 'object') {
        return { valid: false, error: TRADE_ERROR_LEGACY.INVALID_PLAYER };
    }
    if (!toPlayer || typeof toPlayer !== 'object') {
        return { valid: false, error: TRADE_ERROR_LEGACY.INVALID_PLAYER };
    }
    if (fromPlayer.id === toPlayer.id) {
        return { valid: false, error: TRADE_ERROR_LEGACY.SAME_PLAYER };
    }
    if (!instanceId || typeof instanceId !== 'string') {
        return { valid: false, error: TRADE_ERROR_LEGACY.INVALID_INSTANCE };
    }

    const team = Array.isArray(fromPlayer.team) ? fromPlayer.team : [];
    const monIdx = team.findIndex(m => m && (m.id === instanceId || m.instanceId === instanceId));
    if (monIdx === -1) {
        return { valid: false, error: TRADE_ERROR_LEGACY.MONSTER_NOT_FOUND };
    }

    const mon = team[monIdx];
    if (context.inBattle && fromPlayer.activeIndex === monIdx) {
        return { valid: false, error: TRADE_ERROR_LEGACY.MONSTER_IN_BATTLE };
    }
    if (Number(mon.hp) <= 0) {
        return { valid: false, error: TRADE_ERROR_LEGACY.MONSTER_KO };
    }

    return { valid: true, error: null };
}

function proposeTradeAction(fromPlayer, toPlayer, instanceId, context = {}) {
    const validation = validateTradeLegacy(fromPlayer, toPlayer, instanceId, context);
    if (!validation.valid) {
        return { ok: false, trade: null, error: validation.error };
    }

    const team = Array.isArray(fromPlayer.team) ? fromPlayer.team : [];
    const mon = team.find(m => m && (m.id === instanceId || m.instanceId === instanceId));

    return {
        ok: true,
        trade: {
            fromPlayerId: fromPlayer.id,
            toPlayerId: toPlayer.id,
            instanceId,
            targetInstanceId: typeof context.targetInstanceId === 'string' ? context.targetInstanceId : null,
            monsterName: mon?.nickname || mon?.name || instanceId,
            createdAt: Date.now(),
        },
        error: null,
    };
}

function acceptTrade(trade, fromPlayer, toPlayer, context = {}) {
    if (!trade || !fromPlayer || !toPlayer) {
        return { ok: false, error: TRADE_ERROR_LEGACY.INVALID_PLAYER, monsterName: null };
    }

    if (trade.targetInstanceId) {
        const sharedBox = Array.isArray(context.sharedBox) ? context.sharedBox : [];
        const therapyLog = Array.isArray(context.therapyLog) ? context.therapyLog : null;
        const inBattle = !!context.inBattle;

        const offered = findMonsterLocation(fromPlayer, trade.instanceId, sharedBox);
        const requested = findMonsterLocation(toPlayer, trade.targetInstanceId, sharedBox);
        if (!offered.monster || !requested.monster) {
            return { ok: false, error: TRADE_ERROR_LEGACY.MONSTER_NOT_FOUND, monsterName: null };
        }

        if (inBattle && !offered.fromBox && fromPlayer.activeIndex === offered.teamIndex) {
            return { ok: false, error: TRADE_ERROR_LEGACY.MONSTER_IN_BATTLE, monsterName: null };
        }
        if (inBattle && !requested.fromBox && toPlayer.activeIndex === requested.teamIndex) {
            return { ok: false, error: TRADE_ERROR_LEGACY.MONSTER_IN_BATTLE, monsterName: null };
        }
        if (Number(offered.monster.hp) <= 0 || Number(requested.monster.hp) <= 0) {
            return { ok: false, error: TRADE_ERROR_LEGACY.MONSTER_KO, monsterName: null };
        }

        const result = executeTrade(fromPlayer, offered.monster, toPlayer, requested.monster, therapyLog, sharedBox);
        if (!result.success) {
            return { ok: false, error: result.log?.[0] || 'TRADE_FAILED', monsterName: null };
        }

        return {
            ok: true,
            error: null,
            monsterName: offered.monster.nickname || offered.monster.name || trade.instanceId,
        };
    }

    const validation = validateTradeLegacy(fromPlayer, toPlayer, trade.instanceId, context);
    if (!validation.valid) {
        return { ok: false, error: validation.error, monsterName: null };
    }

    const team = Array.isArray(fromPlayer.team) ? fromPlayer.team : [];
    const monIdx = team.findIndex(m => m && (m.id === trade.instanceId || m.instanceId === trade.instanceId));
    if (monIdx === -1) {
        return { ok: false, error: TRADE_ERROR_LEGACY.MONSTER_NOT_FOUND, monsterName: null };
    }

    const [mon] = team.splice(monIdx, 1);
    if (!Array.isArray(toPlayer.team)) toPlayer.team = [];
    toPlayer.team.push(mon);

    if (typeof fromPlayer.activeIndex === 'number' && fromPlayer.activeIndex >= team.length) {
        fromPlayer.activeIndex = Math.max(0, team.length - 1);
    }

    return { ok: true, error: null, monsterName: mon.nickname || mon.name || trade.instanceId };
}

// ─── Helpers de persistência ──────────────────────────────────────────────────

/**
 * Simula o ciclo save/load via JSON round-trip.
 * Equivale ao que StorageManager.saveState() + loadState() faz no browser:
 * serializa com JSON.stringify e re-hidrata com JSON.parse.
 */
function saveLoadRoundTrip(state) {
    return JSON.parse(JSON.stringify(state));
}

/**
 * Coleta todos os IDs de monstrinhos presentes no estado
 * (times + sharedBox) para detectar duplicações ou perdas.
 */
function collectAllMonsterIds(players, sharedBox = []) {
    const ids = [];
    for (const p of players) {
        for (const m of (p.team || [])) {
            if (m) ids.push(m.id ?? m.instanceId);
        }
    }
    for (const slot of sharedBox) {
        if (slot?.monster) ids.push(slot.monster.id ?? slot.monster.instanceId);
    }
    return ids;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeMon = (id, cls, overrides = {}) => ({
    id,
    instanceId: id,
    name: `Mon-${id}`,
    class: cls,
    hp: 30,
    hpMax: 30,
    level: 5,
    ownerId: null,
    ...overrides,
});

const makePlayer = (id, cls, team = [], overrides = {}) => ({
    id,
    name: `Jogador-${id}`,
    class: cls,
    team: [...team],
    activeIndex: 0,
    ...overrides,
});

const makeBoxSlot = (slotId, ownerId, monster) => ({
    slotId,
    ownerPlayerId: ownerId,
    monster,
});

// ─── 1. Trade bilateral via helper de compatibilidade de teste ────────────────

describe('Persistência — fluxo bilateral com shims de compatibilidade de teste', () => {
    it('executa troca time×time com sucesso pelo adapter', () => {
        const monA = makeMon('mi_a1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_a2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_b1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_b2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        const proposal = proposeTradeAction(pA, pB, 'mi_a1', { targetInstanceId: 'mi_b1' });
        expect(proposal.ok).toBe(true);
        expect(proposal.trade.targetInstanceId).toBe('mi_b1');

        const result = acceptTrade(proposal.trade, pA, pB, { sharedBox: [] });
        expect(result.ok).toBe(true);
        expect(pA.team.some(m => m.id === 'mi_b1')).toBe(true);
        expect(pB.team.some(m => m.id === 'mi_a1')).toBe(true);
        expect(pA.team.some(m => m.id === 'mi_a1')).toBe(false);
        expect(pB.team.some(m => m.id === 'mi_b1')).toBe(false);
    });

    it('executa troca com monstro da Box de toPlayer via adapter', () => {
        const monA = makeMon('mi_a1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_a2', 'Mago', { ownerId: 'pA' });
        const monTeamB = makeMon('mi_b1', 'Guerreiro', { ownerId: 'pB' });
        const monTeamB2 = makeMon('mi_b2', 'Mago', { ownerId: 'pB' });
        const monBoxB = makeMon('mi_box_b', 'Mago', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const sharedBox = [makeBoxSlot('slot_b1', 'pB', monBoxB)];

        const proposal = proposeTradeAction(pA, pB, 'mi_a1', { targetInstanceId: 'mi_box_b' });
        expect(proposal.ok).toBe(true);

        const result = acceptTrade(proposal.trade, pA, pB, { sharedBox });
        expect(result.ok).toBe(true);
        expect(pA.team.some(m => m.id === 'mi_box_b')).toBe(true);
        expect(pB.team.some(m => m.id === 'mi_a1') ||
               sharedBox.some(s => s.monster?.id === 'mi_a1')).toBe(true);
    });

    it('adapter delega para caminho canônico quando targetInstanceId está presente', () => {
        // Verifica que o resultado final é equivalente ao executado pelo módulo canônico
        const monA = makeMon('mi_c1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_c2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_d1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_d2', 'Guerreiro', { ownerId: 'pB' });

        // Caminho pelo adapter
        const pA_leg = makePlayer('pA', 'Mago', [
            { ...monA }, { ...monA2 }
        ]);
        const pB_leg = makePlayer('pB', 'Guerreiro', [
            { ...monB }, { ...monB2 }
        ]);
        const proposal = proposeTradeAction(pA_leg, pB_leg, 'mi_c1', { targetInstanceId: 'mi_d1' });
        acceptTrade(proposal.trade, pA_leg, pB_leg, { sharedBox: [] });

        // Caminho canônico direto
        const pA_can = makePlayer('pA', 'Mago', [
            { ...monA }, { ...monA2 }
        ]);
        const pB_can = makePlayer('pB', 'Guerreiro', [
            { ...monB }, { ...monB2 }
        ]);
        const monARef = pA_can.team.find(m => m.id === 'mi_c1');
        const monBRef = pB_can.team.find(m => m.id === 'mi_d1');
        executeTrade(pA_can, monARef, pB_can, monBRef);

        // Ambos devem resultar no mesmo arranjo de ownership
        expect(pA_leg.team.some(m => m.id === 'mi_d1')).toBe(pA_can.team.some(m => m.id === 'mi_d1'));
        expect(pB_leg.team.some(m => m.id === 'mi_c1')).toBe(pB_can.team.some(m => m.id === 'mi_c1'));
    });
});

// ─── 2. Consistência de ownerId após trade ────────────────────────────────────

describe('Consistência de ownerId após trade', () => {
    it('ownerId é atualizado corretamente em troca canônica time×time', () => {
        const monA = makeMon('mi_e1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_e2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_f1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_f2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        executeTrade(pA, monA, pB, monB);

        expect(monA.ownerId).toBe('pB');
        expect(monB.ownerId).toBe('pA');
    });

    it('ownerId é atualizado pelo helper bilateral de compatibilidade', () => {
        const monA = makeMon('mi_g1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_g2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_h1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_h2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        const proposal = proposeTradeAction(pA, pB, 'mi_g1', { targetInstanceId: 'mi_h1' });
        acceptTrade(proposal.trade, pA, pB, { sharedBox: [] });

        // Localizar os objetos nos novos donos
        const monAInPB = pB.team.find(m => m.id === 'mi_g1');
        const monBInPA = pA.team.find(m => m.id === 'mi_h1');

        expect(monAInPB?.ownerId).toBe('pB');
        expect(monBInPA?.ownerId).toBe('pA');
    });

    it('nenhum monstrinho fica com ownerId do antigo dono após trade canônico', () => {
        const monA = makeMon('mi_i1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_i2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_j1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_j2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        executeTrade(pA, monA, pB, monB);

        // monA deve estar no time de pB com ownerId = 'pB'
        const miA = pB.team.find(m => m.id === 'mi_i1');
        expect(miA).toBeDefined();
        expect(miA.ownerId).not.toBe('pA');

        // monB deve estar no time de pA com ownerId = 'pA'
        const miB = pA.team.find(m => m.id === 'mi_j1');
        expect(miB).toBeDefined();
        expect(miB.ownerId).not.toBe('pB');
    });
});

// ─── 3. Consistência de time após trade ───────────────────────────────────────

describe('Consistência de time após trade', () => {
    it('times continuam arrays válidos após trade canônico', () => {
        const pA = makePlayer('pA', 'Mago', [
            makeMon('mi_k1', 'Guerreiro'),
            makeMon('mi_k2', 'Mago'),
        ]);
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_l1', 'Mago'),
            makeMon('mi_l2', 'Guerreiro'),
        ]);

        executeTrade(pA, pA.team[0], pB, pB.team[0]);

        expect(Array.isArray(pA.team)).toBe(true);
        expect(Array.isArray(pB.team)).toBe(true);
        expect(pA.team).toHaveLength(2);
        expect(pB.team).toHaveLength(2);
    });

    it('não há entradas undefined no time após trade canônico', () => {
        const pA = makePlayer('pA', 'Mago', [
            makeMon('mi_m1', 'Guerreiro'),
            makeMon('mi_m2', 'Mago'),
        ]);
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_n1', 'Mago'),
            makeMon('mi_n2', 'Guerreiro'),
        ]);

        executeTrade(pA, pA.team[0], pB, pB.team[0]);

        pA.team.forEach(m => expect(m).toBeDefined());
        pB.team.forEach(m => expect(m).toBeDefined());
    });

    it('activeIndex continua válido após trade de monstrinho não-ativo', () => {
        const pA = makePlayer('pA', 'Mago', [
            makeMon('mi_o1', 'Mago'),       // activeIndex=0, não trocado
            makeMon('mi_o2', 'Guerreiro'),  // este é trocado
        ]);
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_p1', 'Mago'),
            makeMon('mi_p2', 'Guerreiro'),
        ]);
        pA.activeIndex = 0;

        executeTrade(pA, pA.team[1], pB, pB.team[0]);

        expect(pA.activeIndex).toBeGreaterThanOrEqual(0);
        expect(pA.activeIndex).toBeLessThan(pA.team.length);
        const activeMonA = pA.team[pA.activeIndex];
        expect(activeMonA).toBeDefined();
    });

    it('activeIndex é reajustado quando o monstrinho ativo é trocado', () => {
        const active = makeMon('mi_q1', 'Guerreiro', { hp: 30 });
        const other = makeMon('mi_q2', 'Mago', { hp: 25 });
        const pA = makePlayer('pA', 'Mago', [active, other]);
        pA.activeIndex = 0; // active é o ativo

        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_r1', 'Mago', { hp: 30 }),
            makeMon('mi_r2', 'Guerreiro', { hp: 30 }),
        ]);

        executeTrade(pA, active, pB, pB.team[0]);

        // activeIndex deve ser válido e apontar para monstro com HP > 0
        expect(pA.activeIndex).toBeGreaterThanOrEqual(0);
        expect(pA.activeIndex).toBeLessThan(pA.team.length);
        const newActive = pA.team[pA.activeIndex];
        expect(newActive).toBeDefined();
        expect(Number(newActive.hp)).toBeGreaterThan(0);
    });

    it('nenhum monstrinho é duplicado após trade bilateral canônico', () => {
        const monA = makeMon('mi_s1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_s2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_t1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_t2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const sharedBox = [];

        executeTrade(pA, monA, pB, monB, null, sharedBox);

        const allIds = collectAllMonsterIds([pA, pB], sharedBox);
        const uniqueIds = new Set(allIds);
        expect(allIds).toHaveLength(uniqueIds.size);
    });

    it('nenhum monstrinho é perdido após trade bilateral canônico', () => {
        const monA = makeMon('mi_u1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_u2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_v1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_v2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const sharedBox = [];

        const idsBefore = collectAllMonsterIds([pA, pB], sharedBox);
        executeTrade(pA, monA, pB, monB, null, sharedBox);
        const idsAfter = collectAllMonsterIds([pA, pB], sharedBox);

        // Mesmos IDs, mesma contagem
        expect(idsAfter.sort()).toEqual(idsBefore.sort());
    });
});

// ─── 4. Consistência com Box após trade ───────────────────────────────────────

describe('Consistência com Box após trade', () => {
    it('trade time×Box — monstro da Box vai ao time de destino se houver vaga', () => {
        const monBoxA = makeMon('mi_box1', 'Guerreiro', { ownerId: 'pA' });
        const pA = makePlayer('pA', 'Mago', [makeMon('mi_a_team', 'Mago')]);
        const monTeamB = makeMon('mi_b_team1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('mi_b_team2', 'Guerreiro', { ownerId: 'pB' });
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const sharedBox = [makeBoxSlot('slot_a1', 'pA', monBoxA)];

        // pA troca monBoxA (da Box) com monTeamB (do time de pB)
        const result = executeTrade(pA, monBoxA, pB, monTeamB, null, sharedBox);
        expect(result.success).toBe(true);

        // monBoxA deve estar no time de pB (pB tinha 2 membros, substituiu monTeamB)
        expect(pB.team.some(m => m.id === 'mi_box1')).toBe(true);
        // monTeamB deve estar no time de pA (pA tinha 1 membro, recebe via push)
        expect(pA.team.some(m => m.id === 'mi_b_team1')).toBe(true);
    });

    it('trade time×Box — monstro recebido vai para Box quando time de destino está cheio', () => {
        const fullTeam = Array.from({ length: 6 }, (_, i) =>
            makeMon(`mi_full_${i}`, 'Mago', { ownerId: 'pA' })
        );
        const pA = makePlayer('pA', 'Mago', fullTeam);
        const monBoxA = makeMon('mi_box_full', 'Guerreiro', { ownerId: 'pA' });
        const monTeamB = makeMon('mi_b_full1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('mi_b_full2', 'Guerreiro', { ownerId: 'pB' });
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const sharedBox = [makeBoxSlot('slot_full', 'pA', monBoxA)];

        const result = executeTrade(pA, monBoxA, pB, monTeamB, null, sharedBox);
        expect(result.success).toBe(true);

        // time de pA ainda cheio (6 membros)
        expect(pA.team.filter(Boolean)).toHaveLength(6);
        // monTeamB não coube no time de pA — foi para Box
        const pABoxSlots = sharedBox.filter(s => s.ownerPlayerId === 'pA');
        expect(pABoxSlots.some(s => s.monster.id === 'mi_b_full1')).toBe(true);
    });

    it('não há monstro duplicado entre time e Box após trade', () => {
        const monBoxA = makeMon('mi_box_dup', 'Guerreiro', { ownerId: 'pA' });
        const pA = makePlayer('pA', 'Mago', [makeMon('mi_a_dup', 'Mago')]);
        const monTeamB = makeMon('mi_b_dup1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('mi_b_dup2', 'Guerreiro', { ownerId: 'pB' });
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const sharedBox = [makeBoxSlot('slot_dup', 'pA', monBoxA)];

        executeTrade(pA, monBoxA, pB, monTeamB, null, sharedBox);

        const allIds = collectAllMonsterIds([pA, pB], sharedBox);
        const uniqueIds = new Set(allIds);
        expect(allIds).toHaveLength(uniqueIds.size);
    });

    it('não há monstro perdido entre time e Box após trade box↔box', () => {
        const monBoxA = makeMon('mi_ba', 'Guerreiro', { ownerId: 'pA' });
        const monBoxB = makeMon('mi_bb', 'Mago', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [makeMon('mi_at', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [makeMon('mi_bt', 'Guerreiro')]);
        const sharedBox = [
            makeBoxSlot('sA', 'pA', monBoxA),
            makeBoxSlot('sB', 'pB', monBoxB),
        ];

        const idsBefore = collectAllMonsterIds([pA, pB], sharedBox);
        executeTrade(pA, monBoxA, pB, monBoxB, null, sharedBox);
        const idsAfter = collectAllMonsterIds([pA, pB], sharedBox);

        expect(idsAfter.sort()).toEqual(idsBefore.sort());
    });
});

// ─── 5. Persistência pós-trade (save/load round-trip) ────────────────────────

describe('Persistência pós-trade — save/load round-trip', () => {
    it('troca bilateral canônica persiste após JSON round-trip', () => {
        const monA = makeMon('mi_per_a1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_per_a2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_per_b1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_per_b2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const state = { players: [pA, pB], sharedBox: [] };

        executeTrade(pA, monA, pB, monB, null, state.sharedBox);

        const loaded = saveLoadRoundTrip(state);

        const loadedA = loaded.players.find(p => p.id === 'pA');
        const loadedB = loaded.players.find(p => p.id === 'pB');

        // Após load, monA (mi_per_a1) deve estar no time de pB
        expect(loadedB.team.some(m => m.id === 'mi_per_a1')).toBe(true);
        // Após load, monB (mi_per_b1) deve estar no time de pA
        expect(loadedA.team.some(m => m.id === 'mi_per_b1')).toBe(true);
        // Não há duplicação
        const allIds = collectAllMonsterIds(loaded.players, loaded.sharedBox);
        expect(allIds).toHaveLength(new Set(allIds).size);
    });

    it('troca bilateral via helper de compatibilidade persiste após JSON round-trip', () => {
        const monA = makeMon('mi_leg_a1', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_leg_a2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_leg_b1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_leg_b2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const state = { players: [pA, pB], sharedBox: [] };

        const proposal = proposeTradeAction(pA, pB, 'mi_leg_a1', { targetInstanceId: 'mi_leg_b1' });
        acceptTrade(proposal.trade, pA, pB, { sharedBox: state.sharedBox });

        const loaded = saveLoadRoundTrip(state);

        const loadedA = loaded.players.find(p => p.id === 'pA');
        const loadedB = loaded.players.find(p => p.id === 'pB');

        expect(loadedB.team.some(m => m.id === 'mi_leg_a1')).toBe(true);
        expect(loadedA.team.some(m => m.id === 'mi_leg_b1')).toBe(true);
    });

    it('ownerId persiste corretamente após save/load', () => {
        const monA = makeMon('mi_own_a', 'Guerreiro', { ownerId: 'pA' });
        const monA2 = makeMon('mi_own_a2', 'Mago', { ownerId: 'pA' });
        const monB = makeMon('mi_own_b', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_own_b2', 'Guerreiro', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const state = { players: [pA, pB], sharedBox: [] };

        executeTrade(pA, monA, pB, monB, null, state.sharedBox);

        const loaded = saveLoadRoundTrip(state);

        const loadedA = loaded.players.find(p => p.id === 'pA');
        const loadedB = loaded.players.find(p => p.id === 'pB');

        const miAInB = loadedB.team.find(m => m.id === 'mi_own_a');
        const miBInA = loadedA.team.find(m => m.id === 'mi_own_b');

        expect(miAInB?.ownerId).toBe('pB');
        expect(miBInA?.ownerId).toBe('pA');
    });

    it('activeIndex persiste e aponta para monstro válido após save/load', () => {
        const active = makeMon('mi_act_a', 'Guerreiro', { hp: 30 });
        const other = makeMon('mi_act_a2', 'Mago', { hp: 20 });
        const pA = makePlayer('pA', 'Mago', [active, other]);
        pA.activeIndex = 0;

        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_act_b', 'Mago', { hp: 30 }),
            makeMon('mi_act_b2', 'Guerreiro', { hp: 30 }),
        ]);
        const state = { players: [pA, pB], sharedBox: [] };

        // Trocar o monstro ativo de pA
        executeTrade(pA, active, pB, pB.team[0], null, state.sharedBox);

        const loaded = saveLoadRoundTrip(state);
        const loadedA = loaded.players.find(p => p.id === 'pA');

        expect(loadedA.activeIndex).toBeGreaterThanOrEqual(0);
        expect(loadedA.activeIndex).toBeLessThan(loadedA.team.length);
        const newActive = loadedA.team[loadedA.activeIndex];
        expect(newActive).toBeDefined();
        expect(Number(newActive.hp)).toBeGreaterThan(0);
    });

    it('times e Box ficam consistentes após save/load de troca com Box', () => {
        const monBoxA = makeMon('mi_box_per', 'Guerreiro', { ownerId: 'pA' });
        const pA = makePlayer('pA', 'Mago', [makeMon('mi_at_per', 'Mago')]);
        const monTeamB = makeMon('mi_bt_per1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('mi_bt_per2', 'Guerreiro', { ownerId: 'pB' });
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const sharedBox = [makeBoxSlot('slot_per', 'pA', monBoxA)];
        const state = { players: [pA, pB], sharedBox };

        executeTrade(pA, monBoxA, pB, monTeamB, null, sharedBox);

        const loaded = saveLoadRoundTrip(state);
        const allIds = collectAllMonsterIds(loaded.players, loaded.sharedBox);

        // Sem duplicação
        expect(allIds).toHaveLength(new Set(allIds).size);
        // Todos os times são arrays
        loaded.players.forEach(p => {
            expect(Array.isArray(p.team)).toBe(true);
        });
        // sharedBox é array
        expect(Array.isArray(loaded.sharedBox)).toBe(true);
    });
});

// ─── 6. Therapy log ───────────────────────────────────────────────────────────

describe('Therapy log — registro correto', () => {
    it('registra exatamente um evento no therapyLog para uma única troca canônica', () => {
        const monA = makeMon('mi_tlog_a1', 'Guerreiro');
        const monA2 = makeMon('mi_tlog_a2', 'Mago');
        const monB = makeMon('mi_tlog_b1', 'Mago');
        const monB2 = makeMon('mi_tlog_b2', 'Guerreiro');
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const therapyLog = [];

        executeTrade(pA, monA, pB, monB, therapyLog);

        expect(therapyLog).toHaveLength(1);
        expect(therapyLog[0].event).toBe('trade');
    });

    it('evento no therapyLog contém IDs corretos dos monstrinhos trocados', () => {
        const monA = makeMon('mi_ev_a1', 'Guerreiro');
        const monA2 = makeMon('mi_ev_a2', 'Mago');
        const monB = makeMon('mi_ev_b1', 'Mago');
        const monB2 = makeMon('mi_ev_b2', 'Guerreiro');
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const therapyLog = [];

        executeTrade(pA, monA, pB, monB, therapyLog);

        expect(therapyLog[0].playerAId).toBe('pA');
        expect(therapyLog[0].playerBId).toBe('pB');
        expect(therapyLog[0].monAId).toBe('mi_ev_a1');
        expect(therapyLog[0].monBId).toBe('mi_ev_b1');
    });

    it('ausência de therapyLog não impede a troca', () => {
        const monA = makeMon('mi_nolog_a1', 'Guerreiro');
        const monA2 = makeMon('mi_nolog_a2', 'Mago');
        const monB = makeMon('mi_nolog_b1', 'Mago');
        const monB2 = makeMon('mi_nolog_b2', 'Guerreiro');
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);

        // Sem therapyLog (null)
        const result = executeTrade(pA, monA, pB, monB, null);
        expect(result.success).toBe(true);
    });

    it('therapyLog não é duplicado em uma única troca via helper de compatibilidade', () => {
        const monA = makeMon('mi_dup_log_a1', 'Guerreiro');
        const monA2 = makeMon('mi_dup_log_a2', 'Mago');
        const monB = makeMon('mi_dup_log_b1', 'Mago');
        const monB2 = makeMon('mi_dup_log_b2', 'Guerreiro');
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const therapyLog = [];

        const proposal = proposeTradeAction(pA, pB, 'mi_dup_log_a1', { targetInstanceId: 'mi_dup_log_b1' });
        acceptTrade(proposal.trade, pA, pB, { sharedBox: [], therapyLog });

        // Exatamente um evento para uma troca
        expect(therapyLog).toHaveLength(1);
    });

    it('therapyLog persiste corretamente após save/load', () => {
        const monA = makeMon('mi_tlog_per_a1', 'Guerreiro');
        const monA2 = makeMon('mi_tlog_per_a2', 'Mago');
        const monB = makeMon('mi_tlog_per_b1', 'Mago');
        const monB2 = makeMon('mi_tlog_per_b2', 'Guerreiro');
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const state = { players: [pA, pB], sharedBox: [], therapyLog: [] };

        executeTrade(pA, monA, pB, monB, state.therapyLog);

        const loaded = saveLoadRoundTrip(state);

        expect(Array.isArray(loaded.therapyLog)).toBe(true);
        expect(loaded.therapyLog).toHaveLength(1);
        expect(loaded.therapyLog[0].event).toBe('trade');
        expect(loaded.therapyLog[0].monAId).toBe('mi_tlog_per_a1');
    });
});

// ─── 7. Bloqueios — trade inválido não altera estado ─────────────────────────

describe('Bloqueios — trade inválido não altera estado', () => {
    it('monstro KO (hp=0) do cedente não pode ser trocado via helper de compatibilidade', () => {
        const koMon = makeMon('mi_ko1', 'Guerreiro', { hp: 0 });
        const other = makeMon('mi_ko2', 'Mago', { hp: 30 });
        const pA = makePlayer('pA', 'Mago', [koMon, other]);
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_ko_b1', 'Mago', { hp: 30 }),
            makeMon('mi_ko_b2', 'Guerreiro', { hp: 30 }),
        ]);
        const teamABefore = [...pA.team.map(m => m.id)];
        const teamBBefore = [...pB.team.map(m => m.id)];

        const proposal = proposeTradeAction(pA, pB, 'mi_ko1');
        expect(proposal.ok).toBe(false);
        expect(proposal.error).toBe(TRADE_ERROR_LEGACY.MONSTER_KO);

        // Estado não alterado
        expect(pA.team.map(m => m.id)).toEqual(teamABefore);
        expect(pB.team.map(m => m.id)).toEqual(teamBBefore);
    });

    it('monstro KO do receptor bloqueia o adapter bilateral no acceptTrade', () => {
        const monA = makeMon('mi_kor_a1', 'Guerreiro', { hp: 30 });
        const monA2 = makeMon('mi_kor_a2', 'Mago', { hp: 30 });
        const monBKO = makeMon('mi_kor_b_ko', 'Mago', { hp: 0 });
        const monB2 = makeMon('mi_kor_b2', 'Guerreiro', { hp: 30 });
        const pA = makePlayer('pA', 'Mago', [monA, monA2]);
        const pB = makePlayer('pB', 'Guerreiro', [monBKO, monB2]);
        const teamABefore = [...pA.team.map(m => m.id)];
        const teamBBefore = [...pB.team.map(m => m.id)];

        const proposal = proposeTradeAction(pA, pB, 'mi_kor_a1', { targetInstanceId: 'mi_kor_b_ko' });
        // proposeTradeAction valida apenas o cedente, então pode ser ok aqui
        // O bloqueio ocorre no acceptTrade
        const result = acceptTrade(proposal.trade, pA, pB, { sharedBox: [] });
        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR_LEGACY.MONSTER_KO);

        // Estado não alterado
        expect(pA.team.map(m => m.id)).toEqual(teamABefore);
        expect(pB.team.map(m => m.id)).toEqual(teamBBefore);
    });

    it('monstro ativo em batalha não pode ser trocado via helper de compatibilidade', () => {
        const activeMon = makeMon('mi_batt1', 'Guerreiro', { hp: 30 });
        const other = makeMon('mi_batt2', 'Mago', { hp: 30 });
        const pA = makePlayer('pA', 'Mago', [activeMon, other]);
        pA.activeIndex = 0;
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_batt_b1', 'Mago', { hp: 30 }),
            makeMon('mi_batt_b2', 'Guerreiro', { hp: 30 }),
        ]);
        const teamABefore = [...pA.team.map(m => m.id)];

        const result = proposeTradeAction(pA, pB, 'mi_batt1', { inBattle: true });
        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR_LEGACY.MONSTER_IN_BATTLE);

        expect(pA.team.map(m => m.id)).toEqual(teamABefore);
    });

    it('monstro de ambos ativos em batalha — adapter bilateral bloqueia no acceptTrade', () => {
        const activeMon = makeMon('mi_batt_bi_a', 'Guerreiro', { hp: 30 });
        const other = makeMon('mi_batt_bi_a2', 'Mago', { hp: 30 });
        const pA = makePlayer('pA', 'Mago', [activeMon, other]);
        pA.activeIndex = 0;

        const activeMonB = makeMon('mi_batt_bi_b', 'Mago', { hp: 30 });
        const otherB = makeMon('mi_batt_bi_b2', 'Guerreiro', { hp: 30 });
        const pB = makePlayer('pB', 'Guerreiro', [activeMonB, otherB]);
        pB.activeIndex = 0;

        const teamABefore = [...pA.team.map(m => m.id)];
        const teamBBefore = [...pB.team.map(m => m.id)];

        // proposeTradeAction verifica apenas cedente (mi_batt_bi_a) com inBattle=true
        const proposal = proposeTradeAction(pA, pB, 'mi_batt_bi_a', {
            targetInstanceId: 'mi_batt_bi_b',
        });
        // proposta pode falhar no cedente em batalha
        if (proposal.ok) {
            const result = acceptTrade(proposal.trade, pA, pB, {
                sharedBox: [],
                inBattle: true,
            });
            expect(result.ok).toBe(false);
        } else {
            expect(proposal.ok).toBe(false);
        }

        // Estado não alterado
        expect(pA.team.map(m => m.id)).toEqual(teamABefore);
        expect(pB.team.map(m => m.id)).toEqual(teamBBefore);
    });

    it('jogador inexistente retorna erro sem alterar estado', () => {
        const monA = makeMon('mi_inv_a1', 'Guerreiro', { hp: 30 });
        const pA = makePlayer('pA', 'Mago', [monA, makeMon('mi_inv_a2', 'Mago')]);
        const teamABefore = [...pA.team.map(m => m.id)];

        const result = proposeTradeAction(null, pA, 'mi_inv_a1');
        expect(result.ok).toBe(false);
        expect(result.error).toBe(TRADE_ERROR_LEGACY.INVALID_PLAYER);

        expect(pA.team.map(m => m.id)).toEqual(teamABefore);
    });

    it('monstro inexistente retorna erro sem alterar estado', () => {
        const pA = makePlayer('pA', 'Mago', [
            makeMon('mi_miss_a1', 'Guerreiro'),
            makeMon('mi_miss_a2', 'Mago'),
        ]);
        const pB = makePlayer('pB', 'Guerreiro', [
            makeMon('mi_miss_b1', 'Mago'),
            makeMon('mi_miss_b2', 'Guerreiro'),
        ]);
        const teamABefore = [...pA.team.map(m => m.id)];
        const teamBBefore = [...pB.team.map(m => m.id)];

        const proposal = proposeTradeAction(pA, pB, 'mi_inexistente');
        expect(proposal.ok).toBe(false);
        expect(proposal.error).toBe(TRADE_ERROR_LEGACY.MONSTER_NOT_FOUND);

        expect(pA.team.map(m => m.id)).toEqual(teamABefore);
        expect(pB.team.map(m => m.id)).toEqual(teamBBefore);
    });

    it('trade inválido (canônico) não salva estado corrompido — round-trip seguro', () => {
        // Tentativa de troca inválida (pA com apenas 1 monstro)
        const onlyMon = makeMon('mi_inv_c1', 'Guerreiro', { ownerId: 'pA' });
        const pA = makePlayer('pA', 'Mago', [onlyMon]); // só 1 — inválido
        const monB = makeMon('mi_inv_d1', 'Mago', { ownerId: 'pB' });
        const monB2 = makeMon('mi_inv_d2', 'Guerreiro', { ownerId: 'pB' });
        const pB = makePlayer('pB', 'Guerreiro', [monB, monB2]);
        const state = { players: [pA, pB], sharedBox: [] };

        const result = executeTrade(pA, onlyMon, pB, monB, null, state.sharedBox);
        expect(result.success).toBe(false);

        // State não alterado — round-trip deve refletir estado original
        const loaded = saveLoadRoundTrip(state);
        const loadedA = loaded.players.find(p => p.id === 'pA');
        const loadedB = loaded.players.find(p => p.id === 'pB');

        expect(loadedA.team.some(m => m.id === 'mi_inv_c1')).toBe(true);
        expect(loadedB.team.some(m => m.id === 'mi_inv_d1')).toBe(true);
        expect(loadedA.team.some(m => m.id === 'mi_inv_d1')).toBe(false);
        expect(loadedB.team.some(m => m.id === 'mi_inv_c1')).toBe(false);
    });
});
