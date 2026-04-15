/**
 * TRADE HARDENING TESTS (FASE XX — Sprint T)
 *
 * Testes para o sistema de trocas estendido com suporte à Box.
 * Cobertura: getTradeableMonsters (box), validateTrade (box), executeTrade (box),
 *            getTradeSuggestions (box), edge cases de time mínimo
 */

import { describe, it, expect } from 'vitest';
import {
    validateTrade,
    executeTrade,
    getTradeableMonsters,
    getTradeSuggestions,
    TRADE_ERROR,
} from '../js/combat/tradeSystem.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeMon = (id, cls, overrides = {}) => ({
    id,
    name: `Mon-${id}`,
    class: cls,
    hp: 30, hpMax: 30,
    level: 5,
    ownerId: null,
    ...overrides,
});

const makePlayer = (id, cls, team = []) => ({
    id,
    name: `Jogador-${id}`,
    class: cls,
    team,
    activeIndex: 0,
});

const makeBoxSlot = (slotId, ownerId, monster) => ({
    slotId,
    ownerPlayerId: ownerId,
    monster,
});

// ─── getTradeableMonsters com Box ─────────────────────────────────────────────

describe('getTradeableMonsters — Box', () => {
    it('deve incluir monstrinhos da Box de classes diferentes', () => {
        const player = makePlayer('p1', 'Mago', [makeMon('m1', 'Mago')]);
        const boxSlots = [
            makeBoxSlot('s1', 'p1', makeMon('m2', 'Guerreiro')),
            makeBoxSlot('s2', 'p1', makeMon('m3', 'Bardo')),
        ];

        const result = getTradeableMonsters(player, boxSlots);
        // m1 (Mago) não entra (mesma classe); m2 e m3 entram
        expect(result).toHaveLength(2);
        expect(result.map(m => m.id)).toContain('m2');
        expect(result.map(m => m.id)).toContain('m3');
    });

    it('deve excluir monstrinhos da Box da mesma classe do jogador', () => {
        const player = makePlayer('p1', 'Mago', []);
        const boxSlots = [
            makeBoxSlot('s1', 'p1', makeMon('m1', 'Mago')),   // mesma classe — excluir
            makeBoxSlot('s2', 'p1', makeMon('m2', 'Caçador')), // diferente — incluir
        ];

        const result = getTradeableMonsters(player, boxSlots);
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('m2');
    });

    it('deve marcar monstrinhos da Box com _boxSlotId', () => {
        const player = makePlayer('p1', 'Mago', []);
        const boxSlots = [makeBoxSlot('slot_abc', 'p1', makeMon('m1', 'Guerreiro'))];

        const result = getTradeableMonsters(player, boxSlots);
        expect(result).toHaveLength(1);
        expect(result[0]._boxSlotId).toBe('slot_abc');
    });

    it('não deve marcar monstrinhos do time com _boxSlotId', () => {
        const mon = makeMon('m1', 'Guerreiro');
        const player = makePlayer('p1', 'Mago', [mon]);

        const result = getTradeableMonsters(player);
        expect(result).toHaveLength(1);
        expect(result[0]._boxSlotId).toBeUndefined();
    });

    it('não deve incluir monstrinhos da Box de outros jogadores', () => {
        const player = makePlayer('p1', 'Mago', []);
        const boxSlots = [makeBoxSlot('s1', 'p2', makeMon('m1', 'Guerreiro'))]; // dono é p2

        const result = getTradeableMonsters(player, boxSlots);
        expect(result).toHaveLength(0);
    });
});

// ─── validateTrade com Box ────────────────────────────────────────────────────

describe('validateTrade — Box', () => {
    it('deve aceitar troca quando monA está na Box de playerA', () => {
        const monBox = makeMon('m_box', 'Guerreiro');
        const monTeamB = makeMon('m_b1', 'Mago');
        const monTeamB2 = makeMon('m_b2', 'Mago');
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]); // só 1 no time (ok porque monBox é da box)
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const box = [makeBoxSlot('s1', 'pA', monBox)];

        const result = validateTrade(pA, monBox, pB, monTeamB, box);
        expect(result.valid).toBe(true);
    });

    it('deve aceitar troca quando ambos os monstrinhos estão nas Boxes', () => {
        const monBoxA = makeMon('m_boxA', 'Guerreiro');
        const monBoxB = makeMon('m_boxB', 'Mago');
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [makeMon('m_b1', 'Guerreiro')]);
        const box = [
            makeBoxSlot('s1', 'pA', monBoxA),
            makeBoxSlot('s2', 'pB', monBoxB),
        ];

        const result = validateTrade(pA, monBoxA, pB, monBoxB, box);
        expect(result.valid).toBe(true);
    });

    it('deve rejeitar quando monA está na Box de outro jogador', () => {
        const monBox = makeMon('m_box', 'Guerreiro');
        const monTeamB = makeMon('m_b1', 'Mago');
        const monTeamB2 = makeMon('m_b2', 'Mago');
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago'), makeMon('m_a2', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        // monBox pertence a 'pB', não a 'pA'
        const box = [makeBoxSlot('s1', 'pB', monBox)];

        const result = validateTrade(pA, monBox, pB, monTeamB, box);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.MONSTER_NOT_FOUND);
    });

    it('deve exigir mínimo de time apenas quando o monstrinho vem do time', () => {
        const monTeamA = makeMon('m_a1', 'Guerreiro');
        const monTeamB = makeMon('m_b1', 'Mago');
        const monTeamB2 = makeMon('m_b2', 'Mago');
        const pA = makePlayer('pA', 'Mago', [monTeamA]); // só 1 no time
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);

        // Tentativa de trocar do time com só 1 membro — deve falhar
        const result = validateTrade(pA, monTeamA, pB, monTeamB);
        expect(result.valid).toBe(false);
        expect(result.reason).toBe(TRADE_ERROR.EMPTY_TEAM);
    });
});

// ─── executeTrade com Box ─────────────────────────────────────────────────────

describe('executeTrade — Box', () => {
    it('deve remover monstrinho da Box de playerA e adicionar ao time de playerB', () => {
        const monBox = makeMon('m_box', 'Guerreiro', { ownerId: 'pA' });
        const monTeamB = makeMon('m_b1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('m_b2', 'Mago', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const box = [makeBoxSlot('s1', 'pA', monBox)];

        const result = executeTrade(pA, monBox, pB, monTeamB, null, box);

        expect(result.success).toBe(true);
        // monBox saiu da box
        expect(box).toHaveLength(0);
        // monTeamB foi para o time de pA
        expect(pA.team).toContain(monTeamB);
        // monBox foi para o time de pB (substituiu monTeamB no índice 0)
        expect(pB.team).toContain(monBox);
    });

    it('deve colocar monstrinho recebido na Box se o time de destino estiver cheio', () => {
        const monBox = makeMon('m_box', 'Guerreiro', { ownerId: 'pA' });
        // pA tem time cheio (6 monstrinhos)
        const fullTeam = Array.from({ length: 6 }, (_, i) => makeMon(`m_a${i}`, 'Mago', { ownerId: 'pA' }));
        const pA = makePlayer('pA', 'Mago', fullTeam);
        const monTeamB = makeMon('m_b1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('m_b2', 'Mago', { ownerId: 'pB' });
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const box = [makeBoxSlot('s1', 'pA', monBox)];

        const result = executeTrade(pA, monBox, pB, monTeamB, null, box);

        expect(result.success).toBe(true);
        // monTeamB não coube no time de pA — foi para a box
        const pABoxSlots = box.filter(s => s.ownerPlayerId === 'pA');
        expect(pABoxSlots).toHaveLength(1);
        expect(pABoxSlots[0].monster).toBe(monTeamB);
        // Time de pA mantém 6 membros
        expect(pA.team.filter(Boolean)).toHaveLength(6);
    });

    it('deve atualizar ownerId do monstrinho da Box após a troca', () => {
        const monBox = makeMon('m_box', 'Guerreiro', { ownerId: 'pA' });
        const monTeamB = makeMon('m_b1', 'Mago', { ownerId: 'pB' });
        const monTeamB2 = makeMon('m_b2', 'Mago', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const box = [makeBoxSlot('s1', 'pA', monBox)];

        executeTrade(pA, monBox, pB, monTeamB, null, box);

        expect(monBox.ownerId).toBe('pB');
        expect(monTeamB.ownerId).toBe('pA');
    });

    it('deve suportar troca box↔box entre dois jogadores', () => {
        const monBoxA = makeMon('m_boxA', 'Guerreiro', { ownerId: 'pA' });
        const monBoxB = makeMon('m_boxB', 'Mago', { ownerId: 'pB' });
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [makeMon('m_b1', 'Guerreiro')]);
        const box = [
            makeBoxSlot('sA', 'pA', monBoxA),
            makeBoxSlot('sB', 'pB', monBoxB),
        ];

        const result = executeTrade(pA, monBoxA, pB, monBoxB, null, box);

        expect(result.success).toBe(true);
        // Ambas as boxes originais foram removidas
        expect(box.filter(s => s.slotId === 'sA')).toHaveLength(0);
        expect(box.filter(s => s.slotId === 'sB')).toHaveLength(0);
        // Ambos receberam no time (times tinham 1 membro < 6)
        expect(pA.team).toContain(monBoxB);
        expect(pB.team).toContain(monBoxA);
    });

    it('deve registrar evento no therapyLog para troca com Box', () => {
        const monBox = makeMon('m_box', 'Guerreiro');
        const monTeamB = makeMon('m_b1', 'Mago');
        const monTeamB2 = makeMon('m_b2', 'Mago');
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const box = [makeBoxSlot('s1', 'pA', monBox)];
        const therapyLog = [];

        executeTrade(pA, monBox, pB, monTeamB, therapyLog, box);

        expect(therapyLog).toHaveLength(1);
        expect(therapyLog[0].event).toBe('trade');
        expect(therapyLog[0].monAId).toBe('m_box');
    });
});

// ─── getTradeSuggestions com Box ──────────────────────────────────────────────

describe('getTradeSuggestions — Box', () => {
    it('deve sugerir pares usando monstrinhos da Box', () => {
        // pA tem na Box um Guerreiro (útil para pB que é Guerreiro)
        const monBoxA = makeMon('m_boxA', 'Guerreiro');
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        // pB tem no time um Mago (útil para pA que é Mago)
        const monTeamB = makeMon('m_b1', 'Mago');
        const monTeamB2 = makeMon('m_b2', 'Guerreiro');
        const pB = makePlayer('pB', 'Guerreiro', [monTeamB, monTeamB2]);
        const box = [makeBoxSlot('s1', 'pA', monBoxA)];

        const suggestions = getTradeSuggestions(pA, pB, box);
        expect(suggestions.length).toBeGreaterThan(0);
        const suggBoxA = suggestions.find(s => s.monA.id === 'm_boxA' && s.monB.id === 'm_b1');
        expect(suggBoxA).toBeDefined();
    });

    it('deve incluir monstrinhos da Box nos dois lados das sugestões', () => {
        const monBoxA = makeMon('m_boxA', 'Guerreiro'); // pA oferece da box
        const monBoxB = makeMon('m_boxB', 'Mago');      // pB oferece da box
        const pA = makePlayer('pA', 'Mago', [makeMon('m_a1', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [makeMon('m_b1', 'Guerreiro')]);
        const box = [
            makeBoxSlot('sA', 'pA', monBoxA),
            makeBoxSlot('sB', 'pB', monBoxB),
        ];

        const suggestions = getTradeSuggestions(pA, pB, box);
        const suggBoth = suggestions.find(s => s.monA._boxSlotId === 'sA' && s.monB._boxSlotId === 'sB');
        expect(suggBoth).toBeDefined();
    });

    it('deve retornar array vazio se sharedBox está vazio e times não têm pares úteis', () => {
        const pA = makePlayer('pA', 'Mago', [makeMon('m1', 'Mago'), makeMon('m2', 'Mago')]);
        const pB = makePlayer('pB', 'Guerreiro', [makeMon('m3', 'Curandeiro'), makeMon('m4', 'Bardo')]);

        const suggestions = getTradeSuggestions(pA, pB, []);
        expect(suggestions).toHaveLength(0);
    });
});
