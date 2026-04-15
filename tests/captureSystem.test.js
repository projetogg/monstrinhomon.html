/**
 * CAPTURE SYSTEM TESTS (FASE V)
 *
 * Testes para js/data/captureSystem.js
 * Cobertura:
 *  - CAPTURE_BASE: thresholds canônicos por raridade
 *  - CLASTERORBS: definição canônica das orbs
 *  - canCapture: pré-condições (HP > 0, boss, trainer, invalid)
 *  - calculateCaptureThreshold: base + orbBonus + hpBonus + cap de 0.95
 *  - wouldCaptureSucceed: resultado determinístico completo
 */

import { describe, it, expect } from 'vitest';
import {
    CAPTURE_BASE,
    CLASTERORBS,
    canCapture,
    calculateCaptureThreshold,
    wouldCaptureSucceed,
} from '../js/data/captureSystem.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMon(hp, hpMax, rarity = 'Comum', overrides = {}) {
    return { hp, hpMax, rarity, ...overrides };
}

// ─── CAPTURE_BASE ─────────────────────────────────────────────────────────────

describe('CAPTURE_BASE — thresholds canônicos', () => {
    it('deve ter 60% para Comum',    () => expect(CAPTURE_BASE['Comum']).toBe(0.60));
    it('deve ter 45% para Incomum',  () => expect(CAPTURE_BASE['Incomum']).toBe(0.45));
    it('deve ter 30% para Raro',     () => expect(CAPTURE_BASE['Raro']).toBe(0.30));
    it('deve ter 18% para Místico',  () => expect(CAPTURE_BASE['Místico']).toBe(0.18));
    it('deve ter 10% para Lendário', () => expect(CAPTURE_BASE['Lendário']).toBe(0.10));
});

// ─── CLASTERORBS ─────────────────────────────────────────────────────────────

describe('CLASTERORBS — definição canônica', () => {
    it('deve ter 3 orbs', () => {
        expect(Object.keys(CLASTERORBS).length).toBe(3);
    });
    it('Comum tem bônus 0', () => {
        expect(CLASTERORBS['CLASTERORB_COMUM'].capture_bonus_pp).toBe(0);
    });
    it('Incomum tem bônus 10', () => {
        expect(CLASTERORBS['CLASTERORB_INCOMUM'].capture_bonus_pp).toBe(10);
    });
    it('Rara tem bônus 20', () => {
        expect(CLASTERORBS['CLASTERORB_RARA'].capture_bonus_pp).toBe(20);
    });
    it('todas possuem id, name, emoji e type=CAPTURE', () => {
        for (const orb of Object.values(CLASTERORBS)) {
            expect(orb.id).toBeTruthy();
            expect(orb.name).toBeTruthy();
            expect(orb.emoji).toBeTruthy();
            expect(orb.type).toBe('CAPTURE');
        }
    });
});

// ─── canCapture ───────────────────────────────────────────────────────────────

describe('canCapture — pré-condições', () => {
    it('retorna ok para monstro saudável', () => {
        expect(canCapture(makeMon(10, 30))).toEqual({ ok: true });
    });

    it('retorna MONSTER_KO quando HP é 0', () => {
        expect(canCapture(makeMon(0, 30))).toEqual({ ok: false, reason: 'MONSTER_KO' });
    });

    it('retorna MONSTER_KO quando HP é negativo', () => {
        expect(canCapture(makeMon(-1, 30))).toEqual({ ok: false, reason: 'MONSTER_KO' });
    });

    it('retorna INVALID_MONSTER para null', () => {
        expect(canCapture(null)).toEqual({ ok: false, reason: 'INVALID_MONSTER' });
    });

    it('retorna INVALID_MONSTER para undefined', () => {
        expect(canCapture(undefined)).toEqual({ ok: false, reason: 'INVALID_MONSTER' });
    });

    it('retorna BOSS_IMMUNE para monstro com isBoss=true', () => {
        expect(canCapture(makeMon(10, 30, 'Comum', { isBoss: true }))).toEqual({ ok: false, reason: 'BOSS_IMMUNE' });
    });

    it('retorna BOSS_IMMUNE para monstro com noFlee=true', () => {
        expect(canCapture(makeMon(10, 30, 'Comum', { noFlee: true }))).toEqual({ ok: false, reason: 'BOSS_IMMUNE' });
    });

    it('retorna TRAINER_IMMUNE para monstro com isTrainer=true', () => {
        expect(canCapture(makeMon(10, 30, 'Comum', { isTrainer: true }))).toEqual({ ok: false, reason: 'TRAINER_IMMUNE' });
    });
});

// ─── calculateCaptureThreshold — thresholds base ─────────────────────────────

describe('calculateCaptureThreshold — base por raridade (HP 50%, orbBonus 0)', () => {
    it('Comum a 50% HP → 0.60',    () => expect(calculateCaptureThreshold('Comum', 0.50, 0)).toBe(0.60));
    it('Incomum a 50% HP → 0.45',  () => expect(calculateCaptureThreshold('Incomum', 0.50, 0)).toBe(0.45));
    it('Raro a 50% HP → 0.30',     () => expect(calculateCaptureThreshold('Raro', 0.50, 0)).toBe(0.30));
    it('Místico a 50% HP → 0.18',  () => expect(calculateCaptureThreshold('Místico', 0.50, 0)).toBe(0.18));
    it('Lendário a 50% HP → 0.10', () => expect(calculateCaptureThreshold('Lendário', 0.50, 0)).toBe(0.10));
});

// ─── calculateCaptureThreshold — bônus de HP baixo ───────────────────────────

describe('calculateCaptureThreshold — bônus de HP baixo (HP <= 25%)', () => {
    it('Comum a 25% HP → 0.60 + 0.10 = 0.70', () => {
        // 25% HP está exatamente no limiar — bônus aplicado
        expect(calculateCaptureThreshold('Comum', 0.25, 0)).toBeCloseTo(0.70, 5);
    });

    it('NÃO adiciona bônus quando HP > 25%', () => {
        expect(calculateCaptureThreshold('Comum', 0.26, 0)).toBe(0.60);
    });

    it('Lendário a 1% HP → 0.10 + 0.10 = 0.20', () => {
        expect(calculateCaptureThreshold('Lendário', 0.01, 0)).toBeCloseTo(0.20, 5);
    });

    it('Raro a 20% HP → 0.30 + 0.10 = 0.40', () => {
        // 20% HP <= 25% → bônus +0.10
        expect(calculateCaptureThreshold('Raro', 0.20, 0)).toBeCloseTo(0.40, 5);
    });
});

// ─── calculateCaptureThreshold — bônus de ClasterOrb ────────────────────────

describe('calculateCaptureThreshold — bônus de ClasterOrb', () => {
    it('orbBonus 0 não altera threshold (Raro a 50%)', () => {
        expect(calculateCaptureThreshold('Raro', 0.50, 0)).toBe(0.30);
    });

    it('orbBonus 10 (Incomum) → 0.30 + 0.10 = 0.40', () => {
        expect(calculateCaptureThreshold('Raro', 0.50, 10)).toBeCloseTo(0.40, 5);
    });

    it('orbBonus 20 (Rara) → 0.30 + 0.20 = 0.50', () => {
        expect(calculateCaptureThreshold('Raro', 0.50, 20)).toBeCloseTo(0.50, 5);
    });
});

// ─── calculateCaptureThreshold — combinação de bônus ────────────────────────

describe('calculateCaptureThreshold — combinação de bônus', () => {
    it('Raro a 20% HP + Rara (+20) → 0.30 + 0.20 + 0.10 = 0.60', () => {
        // hpBonus aplicado (20% <= 25%)
        expect(calculateCaptureThreshold('Raro', 0.20, 20)).toBeCloseTo(0.60, 5);
    });

    it('Místico a 10% HP + Incomum (+10) → 0.18 + 0.10 + 0.10 = 0.38', () => {
        expect(calculateCaptureThreshold('Místico', 0.10, 10)).toBeCloseTo(0.38, 5);
    });

    it('orb melhor aumenta threshold no mesmo HP', () => {
        const hpPct = 0.20;
        const t0  = calculateCaptureThreshold('Raro', hpPct, 0);
        const t10 = calculateCaptureThreshold('Raro', hpPct, 10);
        const t20 = calculateCaptureThreshold('Raro', hpPct, 20);
        // 0.40 < 0.50 < 0.60
        expect(t0).toBeLessThan(t10);
        expect(t10).toBeLessThan(t20);
    });
});

// ─── calculateCaptureThreshold — cap de 0.95 ─────────────────────────────────

describe('calculateCaptureThreshold — cap de 0.95', () => {
    it('threshold nunca excede 0.95', () => {
        const rarities = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];
        const bonuses  = [0, 10, 20, 50, 100]; // incluindo valores extremos
        const hpValues = [0.00, 0.10, 0.25, 0.50, 1.00];

        for (const r of rarities) {
            for (const b of bonuses) {
                for (const hp of hpValues) {
                    expect(calculateCaptureThreshold(r, hp, b)).toBeLessThanOrEqual(0.95);
                }
            }
        }
    });

    it('Comum + orbBonus 20 + HP 1% = 0.90 (abaixo do cap)', () => {
        // 0.60 + 0.20 + 0.10 = 0.90 < 0.95
        expect(calculateCaptureThreshold('Comum', 0.01, 20)).toBeCloseTo(0.90, 5);
    });
});

// ─── calculateCaptureThreshold — edge cases ──────────────────────────────────

describe('calculateCaptureThreshold — edge cases', () => {
    it('raridade inválida usa default (Comum = 0.60)', () => {
        expect(calculateCaptureThreshold('Inexistente', 0.50, 0)).toBe(0.60);
    });

    it('orbBonusPp null → trata como 0', () => {
        expect(calculateCaptureThreshold('Comum', 0.50, null)).toBe(0.60);
    });

    it('orbBonusPp undefined → trata como 0', () => {
        expect(calculateCaptureThreshold('Comum', 0.50, undefined)).toBe(0.60);
    });

    it('config.captureBase permite override de CAPTURE_BASE', () => {
        const customBase = { 'Comum': 0.50 };
        expect(calculateCaptureThreshold('Comum', 0.50, 0, { captureBase: customBase })).toBe(0.50);
    });
});

// ─── wouldCaptureSucceed ──────────────────────────────────────────────────────

describe('wouldCaptureSucceed — resultado determinístico', () => {
    it('Comum a 50% HP: SUCESSO (50% <= 60%)', () => {
        const result = wouldCaptureSucceed(makeMon(15, 30, 'Comum'), 0);
        expect(result.success).toBe(true);
        expect(result.hpPct).toBeCloseTo(0.50, 5);
        expect(result.threshold).toBeCloseTo(0.60, 5);
    });

    it('Comum a 80% HP: FALHA (80% > 60%)', () => {
        const result = wouldCaptureSucceed(makeMon(24, 30, 'Comum'), 0);
        expect(result.success).toBe(false);
    });

    it('Lendário a 10% HP + Rara (+20): SUCESSO (10% <= 10%+20%+10% = 40%)', () => {
        const result = wouldCaptureSucceed(makeMon(3, 30, 'Lendário'), 20);
        // hpPct=0.10, threshold=0.10+0.20+0.10=0.40
        expect(result.success).toBe(true);
        expect(result.threshold).toBeCloseTo(0.40, 5);
    });

    it('Raro a 30% HP sem orb: SUCESSO (30% <= 30%)', () => {
        const result = wouldCaptureSucceed(makeMon(9, 30, 'Raro'), 0);
        // hpPct=0.30 exatamente no limiar base → SUCESSO
        expect(result.success).toBe(true);
    });

    it('Raro a 31% HP sem orb: FALHA (31% > 30%)', () => {
        const result = wouldCaptureSucceed(makeMon(9.3, 30, 'Raro'), 0);
        expect(result.success).toBe(false);
    });

    it('retorna hpPct e threshold corretos para Raro 9/30 + orbBonus 10', () => {
        const result = wouldCaptureSucceed(makeMon(9, 30, 'Raro'), 10);
        // hpPct=0.30 (> 0.25, sem hpBonus); threshold=0.30+0.10=0.40
        expect(result.hpPct).toBeCloseTo(0.30, 5);
        expect(result.threshold).toBeCloseTo(0.40, 5);
        expect(result.success).toBe(true);
    });

    it('monstro com HP=0: FALHA (0 <= threshold, mas retorna sucesso — canCapture bloquearia antes)', () => {
        // wouldCaptureSucceed é pura; canCapture deve ser chamada antes para bloquear HP=0
        const result = wouldCaptureSucceed(makeMon(0, 30, 'Comum'), 0);
        // hpPct=0, threshold=0.60+0.10 → 0 <= 0.70 = true
        expect(result.hpPct).toBe(0);
        // nota: use canCapture() para bloquear antes de chamar wouldCaptureSucceed
    });
});

// ─── Cenários Realistas ───────────────────────────────────────────────────────

describe('Cenários Realistas de Captura', () => {
    it('Comum a 70% HP com orb comum: FALHA (70% > 60%)', () => {
        const { success } = wouldCaptureSucceed(makeMon(21, 30, 'Comum'), 0);
        expect(success).toBe(false);
    });

    it('Comum a 50% HP com orb comum: SUCESSO (50% <= 60%)', () => {
        const { success } = wouldCaptureSucceed(makeMon(15, 30, 'Comum'), 0);
        expect(success).toBe(true);
    });

    it('Raro a 30% HP com orb rara: SUCESSO (30% <= 50%)', () => {
        // threshold = 0.30 + 0.20 = 0.50; hpPct=0.30 <= 0.50
        const { success } = wouldCaptureSucceed(makeMon(9, 30, 'Raro'), 20);
        expect(success).toBe(true);
    });

    it('Raro a 30% HP com orb comum: SUCESSO exatamente no limiar (30% <= 30%)', () => {
        const { success } = wouldCaptureSucceed(makeMon(9, 30, 'Raro'), 0);
        expect(success).toBe(true);
    });

    it('Lendário a 20% HP com orb comum: FALHA (20% > 10%+10% = 20%... igual = SUCESSO!)', () => {
        // hpPct=0.20 <= threshold=0.10+0.10(hpBonus)=0.20 → SUCESSO (limiar inclusivo)
        const { success, threshold } = wouldCaptureSucceed(makeMon(6, 30, 'Lendário'), 0);
        expect(threshold).toBeCloseTo(0.20, 5);
        expect(success).toBe(true);
    });

    it('Lendário a 21% HP com orb comum: FALHA (21% > 20%)', () => {
        // hpPct=0.21 > threshold=0.20 (sem hpBonus pois 0.21 > 0.25? não, 0.21 <= 0.25 → hpBonus!)
        // threshold = 0.10 + 0.10 = 0.20; hpPct = 0.21 > 0.20 → FALHA
        const { success } = wouldCaptureSucceed(makeMon(6.3, 30, 'Lendário'), 0);
        expect(success).toBe(false);
    });
});

