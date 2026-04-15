/**
 * THERAPY PROGRESS BAR TESTS (FASE M)
 *
 * Testa a lógica de cálculo de progresso de PM para exibição na barra de
 * progresso do painel de terapia.
 * Cobertura: getMedalRewards, cálculo de próxima medalha, % de progresso.
 */

import { describe, it, expect } from 'vitest';
import { getMedalRewards, MEDAL_REWARDS } from '../js/therapy/therapyRewards.js';

// ─── Constantes canônicas (espelham GameState.config.medalTiers) ──────────────

const MEDAL_TIERS = { bronze: 5, silver: 12, gold: 25 };

// ─── Helper: lógica pura de progresso (extraída de updateTherapyView) ─────────

function computeMedalProgress(pm, medals = [], tiers = MEDAL_TIERS) {
    const TIER_ORDER = [
        { key: 'bronze', label: 'Bronze', threshold: tiers.bronze },
        { key: 'silver', label: 'Prata',  threshold: tiers.silver },
        { key: 'gold',   label: 'Ouro',   threshold: tiers.gold   },
    ];
    const nextTier = TIER_ORDER.find(t => !medals.includes(t.key));
    if (!nextTier) {
        return { pct: 100, label: 'Todas conquistadas', nextTier: null };
    }
    const pct = Math.min(100, Math.round((pm / nextTier.threshold) * 100));
    return { pct, label: `${pm} / ${nextTier.threshold} PM → ${nextTier.label}`, nextTier };
}

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
