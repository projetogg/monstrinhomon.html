/**
 * THERAPY PROGRESS BAR TESTS (FASE M + FASE W)
 *
 * Testa a lógica de cálculo de progresso de PM para exibição na barra de
 * progresso do painel de terapia.
 * Cobertura: getMedalRewards, computeMedalProgress, checkNewMedal.
 *
 * FASE W: computeMedalProgress e checkNewMedal movidos para
 *         js/therapy/medalProgress.js (módulo puro).
 */

import { describe, it, expect } from 'vitest';
import { getMedalRewards, MEDAL_REWARDS } from '../js/therapy/therapyRewards.js';
import {
    computeMedalProgress,
    checkNewMedal,
    DEFAULT_MEDAL_TIERS,
} from '../js/therapy/medalProgress.js';

// ─── Constantes canônicas (espelham GameState.config.medalTiers) ──────────────

const MEDAL_TIERS = DEFAULT_MEDAL_TIERS;

// ─── getMedalRewards ─────────────────────────────────────────────────────────

describe('getMedalRewards', () => {
    it('retorna recompensas de bronze corretas', () => {
        const r = getMedalRewards('bronze');
        expect(r).toEqual({ xp: 20, moeda: 1 });
    });

    it('retorna recompensas de prata corretas', () => {
        const r = getMedalRewards('silver');
        expect(r).toEqual({ xp: 50, moeda: 3 });
    });

    it('retorna recompensas de ouro corretas', () => {
        const r = getMedalRewards('gold');
        expect(r).toEqual({ xp: 150, moeda: 7 });
    });

    it('retorna null para medalha desconhecida', () => {
        expect(getMedalRewards('platinum')).toBeNull();
        expect(getMedalRewards(null)).toBeNull();
        expect(getMedalRewards(undefined)).toBeNull();
    });

    it('MEDAL_REWARDS exportado tem as três chaves esperadas', () => {
        expect(Object.keys(MEDAL_REWARDS).sort()).toEqual(['bronze', 'gold', 'silver']);
    });
});

// ─── Cálculo de progresso de PM ───────────────────────────────────────────────

describe('computeMedalProgress — sem medalhas conquistadas', () => {
    it('0 PM → 0% para bronze', () => {
        const { pct, nextTier } = computeMedalProgress(0, []);
        expect(pct).toBe(0);
        expect(nextTier.key).toBe('bronze');
    });

    it('3 PM → 60% para bronze (3/5)', () => {
        const { pct } = computeMedalProgress(3, []);
        expect(pct).toBe(60);
    });

    it('5 PM → 100% para bronze', () => {
        const { pct } = computeMedalProgress(5, []);
        expect(pct).toBe(100);
    });

    it('PM acima do threshold fica truncado em 100%', () => {
        const { pct } = computeMedalProgress(99, []);
        expect(pct).toBe(100);
    });
});

describe('computeMedalProgress — bronze já conquistado', () => {
    it('0 PM com bronze → aponta para prata, 0%', () => {
        const { pct, nextTier } = computeMedalProgress(5, ['bronze']);
        expect(nextTier.key).toBe('silver');
        // 5/12 = 41.67% ≈ 42%
        expect(pct).toBe(42);
    });

    it('12 PM com bronze → 100% para prata', () => {
        const { pct } = computeMedalProgress(12, ['bronze']);
        expect(pct).toBe(100);
    });
});

describe('computeMedalProgress — bronze e prata conquistados', () => {
    it('aponta para ouro', () => {
        const { nextTier } = computeMedalProgress(12, ['bronze', 'silver']);
        expect(nextTier.key).toBe('gold');
    });

    it('18 PM com bronze+prata → 72% para ouro (18/25)', () => {
        const { pct } = computeMedalProgress(18, ['bronze', 'silver']);
        expect(pct).toBe(72);
    });
});

describe('computeMedalProgress — todas conquistadas', () => {
    it('retorna pct=100 e nextTier=null', () => {
        const { pct, nextTier } = computeMedalProgress(30, ['bronze', 'silver', 'gold']);
        expect(pct).toBe(100);
        expect(nextTier).toBeNull();
    });

    it('label indica todas conquistadas', () => {
        const { label } = computeMedalProgress(30, ['bronze', 'silver', 'gold']);
        expect(label).toContain('Todas');
    });
});

describe('computeMedalProgress — tiers customizados', () => {
    it('respeita tiers personalizados', () => {
        const customTiers = { bronze: 10, silver: 20, gold: 50 };
        const { pct, nextTier } = computeMedalProgress(5, [], customTiers);
        expect(nextTier.key).toBe('bronze');
        expect(pct).toBe(50); // 5/10
    });
});

// ─── checkNewMedal (FASE W) ───────────────────────────────────────────────────

describe('checkNewMedal — sem medalhas', () => {
    it('retorna null quando PM < bronze', () => {
        expect(checkNewMedal(0, [])).toBeNull();
        expect(checkNewMedal(4, [])).toBeNull();
    });

    it('retorna bronze quando PM >= 5', () => {
        expect(checkNewMedal(5, [])).toBe('bronze');
        expect(checkNewMedal(10, [])).toBe('bronze');
    });
});

describe('checkNewMedal — bronze já conquistado', () => {
    it('retorna null quando PM < prata', () => {
        expect(checkNewMedal(5, ['bronze'])).toBeNull();
        expect(checkNewMedal(11, ['bronze'])).toBeNull();
    });

    it('retorna silver quando PM >= 12', () => {
        expect(checkNewMedal(12, ['bronze'])).toBe('silver');
        expect(checkNewMedal(20, ['bronze'])).toBe('silver');
    });
});

describe('checkNewMedal — bronze e prata conquistados', () => {
    it('retorna null quando PM < ouro', () => {
        expect(checkNewMedal(12, ['bronze', 'silver'])).toBeNull();
        expect(checkNewMedal(24, ['bronze', 'silver'])).toBeNull();
    });

    it('retorna gold quando PM >= 25', () => {
        expect(checkNewMedal(25, ['bronze', 'silver'])).toBe('gold');
        expect(checkNewMedal(99, ['bronze', 'silver'])).toBe('gold');
    });
});

describe('checkNewMedal — todas conquistadas', () => {
    it('retorna null quando todas as medalhas já foram conquistadas', () => {
        expect(checkNewMedal(99, ['bronze', 'silver', 'gold'])).toBeNull();
    });
});

describe('checkNewMedal — ouro tem prioridade sobre prata', () => {
    it('retorna gold quando PM >= ouro e prata ainda não conquistada', () => {
        // Caso incomum: prata não conquistada mas PM já passou do ouro
        expect(checkNewMedal(30, ['bronze'])).toBe('gold');
    });
});

describe('checkNewMedal — tiers customizados', () => {
    it('respeita tiers personalizados', () => {
        const customTiers = { bronze: 10, silver: 20, gold: 50 };
        expect(checkNewMedal(9, [], customTiers)).toBeNull();
        expect(checkNewMedal(10, [], customTiers)).toBe('bronze');
        expect(checkNewMedal(50, ['bronze', 'silver'], customTiers)).toBe('gold');
    });
});

describe('DEFAULT_MEDAL_TIERS (FASE W)', () => {
    it('tem os três tiers canônicos', () => {
        expect(DEFAULT_MEDAL_TIERS.bronze).toBe(5);
        expect(DEFAULT_MEDAL_TIERS.silver).toBe(12);
        expect(DEFAULT_MEDAL_TIERS.gold).toBe(25);
    });
});
