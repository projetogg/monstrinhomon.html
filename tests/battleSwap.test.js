/**
 * BATTLE SWAP TESTS (PR-20)
 *
 * Testes para js/combat/battleSwap.js
 * Cobertura: categorizeBattleTeam, hasEligibleSwap, getSwapStatus, canManualSwap
 */

import { describe, it, expect } from 'vitest';
import {
    categorizeBattleTeam,
    hasEligibleSwap,
    getSwapStatus,
    canManualSwap,
} from '../js/combat/battleSwap.js';

// ── Fixtures ─────────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        name: 'Luma',
        class: 'Mago',
        hp: 30,
        hpMax: 30,
        level: 1,
        emoji: '✨',
        ...overrides,
    };
}

function makePlayer(teamOverrides = [], activeIndex = 0, playerClass = 'Mago') {
    return {
        id: 'player_01',
        name: 'Alice',
        class: playerClass,
        activeIndex,
        team: teamOverrides,
    };
}

// ── categorizeBattleTeam ──────────────────────────────────────────────────────

describe('categorizeBattleTeam', () => {

    describe('entrada inválida', () => {
        it('retorna [] para player null', () => {
            expect(categorizeBattleTeam(null)).toEqual([]);
        });

        it('retorna [] para player sem team', () => {
            expect(categorizeBattleTeam({ class: 'Mago' })).toEqual([]);
        });

        it('retorna [] para team vazio', () => {
            const p = makePlayer([]);
            expect(categorizeBattleTeam(p)).toEqual([]);
        });

        it('ignora slots null/undefined no team', () => {
            const p = makePlayer([null, makeMon(), undefined]);
            const result = categorizeBattleTeam(p);
            // null e undefined filtrados
            expect(result.length).toBe(1);
        });
    });

    describe('categoria "active"', () => {
        it('marca activeIndex como active', () => {
            const active = makeMon({ name: 'Ativo' });
            const bench = makeMon({ name: 'Banco' });
            const p = makePlayer([active, bench], 0);
            const result = categorizeBattleTeam(p);
            expect(result[0].category).toBe('active');
            expect(result[0].monster.name).toBe('Ativo');
        });

        it('active não é afetado pelo hp (mesmo com hp=0)', () => {
            const dead = makeMon({ hp: 0 });
            const p = makePlayer([dead], 0);
            const result = categorizeBattleTeam(p);
            expect(result[0].category).toBe('active');
        });

        it('usa activeIndex=0 por default', () => {
            const p = { class: 'Mago', team: [makeMon(), makeMon()] };
            const result = categorizeBattleTeam(p);
            expect(result[0].category).toBe('active');
        });
    });

    describe('categoria "eligible"', () => {
        it('bench vivo + mesma classe → eligible', () => {
            const active = makeMon();
            const bench = makeMon({ name: 'Bench' });
            const p = makePlayer([active, bench], 0, 'Mago');
            const result = categorizeBattleTeam(p);
            expect(result[1].category).toBe('eligible');
        });

        it('masterMode ignora classe → eligible mesmo com classe diferente', () => {
            const active = makeMon();
            const bench = makeMon({ class: 'Guerreiro' });
            const p = makePlayer([active, bench], 0, 'Mago');
            const result = categorizeBattleTeam(p, { masterMode: true });
            expect(result[1].category).toBe('eligible');
        });

        it('eligible tem reason "Elegível"', () => {
            const p = makePlayer([makeMon(), makeMon()], 0, 'Mago');
            const result = categorizeBattleTeam(p);
            expect(result[1].reason).toBe('Elegível');
        });
    });

    describe('categoria "blocked_ko"', () => {
        it('bench com hp=0 → blocked_ko', () => {
            const p = makePlayer([makeMon(), makeMon({ hp: 0 })], 0);
            const result = categorizeBattleTeam(p);
            expect(result[1].category).toBe('blocked_ko');
        });

        it('bench com hp negativo → blocked_ko', () => {
            const p = makePlayer([makeMon(), makeMon({ hp: -5 })], 0);
            const result = categorizeBattleTeam(p);
            expect(result[1].category).toBe('blocked_ko');
        });

        it('blocked_ko tem reason "Desmaiado"', () => {
            const p = makePlayer([makeMon(), makeMon({ hp: 0 })], 0);
            const result = categorizeBattleTeam(p);
            expect(result[1].reason).toBe('Desmaiado');
        });

        it('blocked_ko prevalece sobre classe diferente', () => {
            // KO + classe diferente → blocked_ko (não blocked_class)
            const p = makePlayer([makeMon(), makeMon({ hp: 0, class: 'Guerreiro' })], 0, 'Mago');
            const result = categorizeBattleTeam(p);
            expect(result[1].category).toBe('blocked_ko');
        });
    });

    describe('categoria "blocked_class"', () => {
        it('bench vivo com classe diferente → blocked_class', () => {
            const p = makePlayer([makeMon(), makeMon({ class: 'Guerreiro' })], 0, 'Mago');
            const result = categorizeBattleTeam(p);
            expect(result[1].category).toBe('blocked_class');
        });

        it('blocked_class inclui nomes de classe no reason', () => {
            const p = makePlayer([makeMon(), makeMon({ class: 'Bardo' })], 0, 'Mago');
            const result = categorizeBattleTeam(p);
            expect(result[1].reason).toContain('Bardo');
            expect(result[1].reason).toContain('Mago');
        });

        it('masterMode remove blocked_class', () => {
            const p = makePlayer([makeMon(), makeMon({ class: 'Guerreiro' })], 0, 'Mago');
            const resultNormal = categorizeBattleTeam(p, { masterMode: false });
            const resultMaster = categorizeBattleTeam(p, { masterMode: true });
            expect(resultNormal[1].category).toBe('blocked_class');
            expect(resultMaster[1].category).toBe('eligible');
        });
    });

    describe('preserva índice original', () => {
        it('result[n].index corresponde à posição real no team', () => {
            const p = makePlayer([makeMon(), makeMon(), makeMon({ class: 'Guerreiro' })], 0, 'Mago');
            const result = categorizeBattleTeam(p);
            expect(result[0].index).toBe(0);
            expect(result[1].index).toBe(1);
            expect(result[2].index).toBe(2);
        });
    });

    describe('time misto (3 monstrinhos)', () => {
        it('categoriza corretamente time com active/eligible/blocked_ko/blocked_class', () => {
            const active    = makeMon({ name: 'A', class: 'Mago', hp: 30 });
            const eligible  = makeMon({ name: 'B', class: 'Mago', hp: 20 });
            const ko        = makeMon({ name: 'C', class: 'Mago', hp: 0 });
            const wrongClass = makeMon({ name: 'D', class: 'Bardo', hp: 25 });

            const p = makePlayer([active, eligible, ko, wrongClass], 0, 'Mago');
            const result = categorizeBattleTeam(p);

            expect(result[0].category).toBe('active');
            expect(result[1].category).toBe('eligible');
            expect(result[2].category).toBe('blocked_ko');
            expect(result[3].category).toBe('blocked_class');
        });
    });
});

// ── getSwapStatus ─────────────────────────────────────────────────────────────

describe('getSwapStatus', () => {
    it('active → "▶ Em batalha"', () => {
        expect(getSwapStatus('active')).toBe('▶ Em batalha');
    });

    it('eligible → "✅ Elegível"', () => {
        expect(getSwapStatus('eligible')).toBe('✅ Elegível');
    });

    it('blocked_ko → "💀 Desmaiado"', () => {
        expect(getSwapStatus('blocked_ko')).toBe('💀 Desmaiado');
    });

    it('blocked_class → "⛔ Fora da classe"', () => {
        expect(getSwapStatus('blocked_class')).toBe('⛔ Fora da classe');
    });

    it('categoria desconhecida com reason → retorna reason', () => {
        expect(getSwapStatus('unknown', 'motivo qualquer')).toBe('motivo qualquer');
    });

    it('categoria desconhecida sem reason → retorna "—"', () => {
        expect(getSwapStatus('unknown')).toBe('—');
    });
});

// ── hasEligibleSwap ───────────────────────────────────────────────────────────

describe('hasEligibleSwap', () => {
    it('retorna false para player null', () => {
        expect(hasEligibleSwap(null)).toBe(false);
    });

    it('retorna false quando só tem o ativo (bench vazio)', () => {
        const p = makePlayer([makeMon()], 0);
        expect(hasEligibleSwap(p)).toBe(false);
    });

    it('retorna false quando bench só tem KO', () => {
        const p = makePlayer([makeMon(), makeMon({ hp: 0 })], 0);
        expect(hasEligibleSwap(p)).toBe(false);
    });

    it('retorna false quando bench só tem classe diferente', () => {
        const p = makePlayer([makeMon(), makeMon({ class: 'Guerreiro' })], 0, 'Mago');
        expect(hasEligibleSwap(p)).toBe(false);
    });

    it('retorna true quando há ao menos um elegível', () => {
        const p = makePlayer([makeMon(), makeMon()], 0, 'Mago');
        expect(hasEligibleSwap(p)).toBe(true);
    });

    it('retorna true com masterMode mesmo com classe diferente', () => {
        const p = makePlayer([makeMon(), makeMon({ class: 'Guerreiro' })], 0, 'Mago');
        expect(hasEligibleSwap(p, { masterMode: true })).toBe(true);
    });

    it('retorna true quando há elegível entre bloqueados', () => {
        const p = makePlayer([
            makeMon(),
            makeMon({ hp: 0 }),
            makeMon({ class: 'Bardo' }),
            makeMon({ name: 'Ok' }),
        ], 0, 'Mago');
        expect(hasEligibleSwap(p)).toBe(true);
    });
});

// ── canManualSwap ─────────────────────────────────────────────────────────────

describe('canManualSwap', () => {
    it('retorna false para player null', () => {
        expect(canManualSwap(null)).toBe(false);
    });

    it('retorna false para player sem team', () => {
        expect(canManualSwap({ class: 'Mago' })).toBe(false);
    });

    it('retorna false quando ativo está KO (troca forçada, não manual)', () => {
        const active = makeMon({ hp: 0 });
        const bench = makeMon();
        const p = makePlayer([active, bench], 0, 'Mago');
        expect(canManualSwap(p)).toBe(false);
    });

    it('retorna false quando ativo está vivo mas não há elegível', () => {
        const p = makePlayer([makeMon(), makeMon({ hp: 0 })], 0, 'Mago');
        expect(canManualSwap(p)).toBe(false);
    });

    it('retorna true quando ativo está vivo e há elegível', () => {
        const p = makePlayer([makeMon(), makeMon()], 0, 'Mago');
        expect(canManualSwap(p)).toBe(true);
    });

    it('masterMode permite troca mesmo com classes diferentes', () => {
        const p = makePlayer([makeMon(), makeMon({ class: 'Guerreiro' })], 0, 'Mago');
        expect(canManualSwap(p, { masterMode: false })).toBe(false);
        expect(canManualSwap(p, { masterMode: true })).toBe(true);
    });

    it('retorna false quando activeIndex inválido e hp do índice 0 é 0', () => {
        const p = makePlayer([makeMon({ hp: 0 }), makeMon()], 0, 'Mago');
        expect(canManualSwap(p)).toBe(false);
    });
});
