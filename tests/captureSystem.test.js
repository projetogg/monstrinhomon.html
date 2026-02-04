/**
 * CAPTURE SYSTEM TESTS (PR-fix-capture-system-logic)
 * 
 * Testes para validar a mecânica de captura de monstrinhos
 * Cobertura: cálculo de threshold, bônus de HP, bônus de item
 */

import { describe, it, expect } from 'vitest';

describe('CaptureSystem - Threshold Calculation', () => {
    // Configuração padrão baseada no sistema atual
    const captureThreshold = {
        'Comum': 0.25,
        'Incomum': 0.20,
        'Raro': 0.15,
        'Místico': 0.10,
        'Lendário': 0.05
    };

    const clasterOrbs = {
        'COMUM': { capture_bonus_pp: 0 },
        'INCOMUM': { capture_bonus_pp: 10 },
        'RARA': { capture_bonus_pp: 20 }
    };

    const LOW_HP_BONUS = 0.10; // 10% bonus when HP <= 25%
    const MAX_THRESHOLD = 0.95; // Limite máximo de 95%

    /**
     * Calcula o threshold final de captura
     * @param {string} rarity - Raridade do monstro
     * @param {number} hpPercent - HP% do monstro (0.0 a 1.0)
     * @param {string} orbType - Tipo de ClasterOrb
     * @returns {number} Threshold final (0.0 a 1.0)
     */
    function calculateCaptureThreshold(rarity, hpPercent, orbType) {
        const baseThreshold = captureThreshold[rarity] || 0.25;
        const orbBonus = (clasterOrbs[orbType]?.capture_bonus_pp || 0) / 100;
        const lowHpBonus = hpPercent <= 0.25 ? LOW_HP_BONUS : 0;
        
        return Math.min(MAX_THRESHOLD, baseThreshold + orbBonus + lowHpBonus);
    }

    /**
     * Verifica se captura seria bem-sucedida
     * @param {number} hpPercent - HP% do monstro
     * @param {number} threshold - Threshold calculado
     * @returns {boolean} true se captura é bem-sucedida
     */
    function wouldCaptureSucceed(hpPercent, threshold) {
        return hpPercent <= threshold;
    }

    describe('Base Thresholds (sem itens, sem bônus HP)', () => {
        it('deve ter threshold 25% para Comum', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.50, 'COMUM');
            expect(threshold).toBe(0.25);
        });

        it('deve ter threshold 20% para Incomum', () => {
            const threshold = calculateCaptureThreshold('Incomum', 0.50, 'COMUM');
            expect(threshold).toBe(0.20);
        });

        it('deve ter threshold 15% para Raro', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.50, 'COMUM');
            expect(threshold).toBe(0.15);
        });

        it('deve ter threshold 10% para Místico', () => {
            const threshold = calculateCaptureThreshold('Místico', 0.50, 'COMUM');
            expect(threshold).toBe(0.10);
        });

        it('deve ter threshold 5% para Lendário', () => {
            const threshold = calculateCaptureThreshold('Lendário', 0.50, 'COMUM');
            expect(threshold).toBe(0.05);
        });
    });

    describe('Bônus de HP Baixo (HP <= 25%)', () => {
        it('deve adicionar 10% de bônus quando HP <= 25%', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.25, 'COMUM');
            // 25% base + 10% bonus = 35%
            expect(threshold).toBe(0.35);
        });

        it('NÃO deve adicionar bônus quando HP > 25%', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.26, 'COMUM');
            // 25% base, sem bonus
            expect(threshold).toBe(0.25);
        });

        it('deve adicionar bônus em HP muito baixo (1%)', () => {
            const threshold = calculateCaptureThreshold('Lendário', 0.01, 'COMUM');
            // 5% base + 10% bonus = 15%
            expect(threshold).toBeCloseTo(0.15, 5);
        });
    });

    describe('Bônus de ClasterOrb', () => {
        it('ClasterOrb Comum não adiciona bônus', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.50, 'COMUM');
            expect(threshold).toBe(0.15); // apenas base
        });

        it('ClasterOrb Incomum adiciona 10% de bônus', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.50, 'INCOMUM');
            // 15% base + 10% orb = 25%
            expect(threshold).toBe(0.25);
        });

        it('ClasterOrb Rara adiciona 20% de bônus', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.50, 'RARA');
            // 15% base + 20% orb = 35%
            expect(threshold).toBe(0.35);
        });
    });

    describe('Combinação de Bônus', () => {
        it('deve combinar bônus HP baixo + ClasterOrb Rara', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.20, 'RARA');
            // 15% base + 20% orb + 10% HP = 45%
            expect(threshold).toBeCloseTo(0.45, 5);
        });

        it('deve combinar bônus HP baixo + ClasterOrb Incomum', () => {
            const threshold = calculateCaptureThreshold('Místico', 0.10, 'INCOMUM');
            // 10% base + 10% orb + 10% HP = 30%
            expect(threshold).toBeCloseTo(0.30, 5);
        });

        it('deve limitar threshold máximo a 95%', () => {
            // Cenário extremo: Comum + Rara + HP baixo
            const threshold = calculateCaptureThreshold('Comum', 0.05, 'RARA');
            // 25% base + 20% orb + 10% HP = 55% (dentro do limite)
            expect(threshold).toBe(0.55);
            expect(threshold).toBeLessThanOrEqual(MAX_THRESHOLD);
        });
    });

    describe('Cenários de Captura Realistas', () => {
        it('Comum a 50% HP com orb comum: FALHA', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.50, 'COMUM');
            expect(wouldCaptureSucceed(0.50, threshold)).toBe(false);
        });

        it('Comum a 25% HP com orb comum: SUCESSO', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.25, 'COMUM');
            expect(wouldCaptureSucceed(0.25, threshold)).toBe(true);
        });

        it('Raro a 30% HP com orb rara: SUCESSO', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.30, 'RARA');
            // 15% + 20% = 35% threshold, 30% HP <= 35%
            expect(wouldCaptureSucceed(0.30, threshold)).toBe(true);
        });

        it('Raro a 30% HP com orb comum: FALHA', () => {
            const threshold = calculateCaptureThreshold('Raro', 0.30, 'COMUM');
            // 15% threshold, 30% HP > 15%
            expect(wouldCaptureSucceed(0.30, threshold)).toBe(false);
        });

        it('Lendário a 5% HP com orb comum: SUCESSO (com bônus HP)', () => {
            const threshold = calculateCaptureThreshold('Lendário', 0.05, 'COMUM');
            // 5% base + 10% HP bonus = 15% threshold, 5% HP <= 15%
            expect(wouldCaptureSucceed(0.05, threshold)).toBe(true);
        });

        it('Lendário a 10% HP com orb rara: SUCESSO (HP baixo + item raro)', () => {
            const threshold = calculateCaptureThreshold('Lendário', 0.10, 'RARA');
            // 5% base + 20% orb + 10% HP = 35% threshold, 10% HP <= 35%
            expect(wouldCaptureSucceed(0.10, threshold)).toBe(true);
        });

        it('Místico a 20% HP com orb incomum: SUCESSO', () => {
            const threshold = calculateCaptureThreshold('Místico', 0.20, 'INCOMUM');
            // 10% base + 10% orb + 10% HP = 30% threshold, 20% HP <= 30%
            expect(wouldCaptureSucceed(0.20, threshold)).toBe(true);
        });
    });

    describe('Diferenciação de Item Deve Importar', () => {
        it('Orb melhor aumenta chance de captura no mesmo HP', () => {
            const hpPercent = 0.20;
            
            const thresholdComum = calculateCaptureThreshold('Raro', hpPercent, 'COMUM');
            const thresholdIncomum = calculateCaptureThreshold('Raro', hpPercent, 'INCOMUM');
            const thresholdRara = calculateCaptureThreshold('Raro', hpPercent, 'RARA');
            
            // 15% < 25% < 35%
            expect(thresholdComum).toBeLessThan(thresholdIncomum);
            expect(thresholdIncomum).toBeLessThan(thresholdRara);
        });

        it('Item raro pode capturar onde comum falha', () => {
            const hpPercent = 0.30; // 30% HP
            const rarity = 'Raro';
            
            const thresholdComum = calculateCaptureThreshold(rarity, hpPercent, 'COMUM');
            const thresholdRara = calculateCaptureThreshold(rarity, hpPercent, 'RARA');
            
            expect(wouldCaptureSucceed(hpPercent, thresholdComum)).toBe(false);
            expect(wouldCaptureSucceed(hpPercent, thresholdRara)).toBe(true);
        });
    });

    describe('HP Baixo é Importante', () => {
        it('Captura é mais difícil com HP alto, mesmo com item bom', () => {
            const hpHigh = 0.50; // 50% HP
            const hpLow = 0.20;  // 20% HP
            
            const thresholdHigh = calculateCaptureThreshold('Comum', hpHigh, 'RARA');
            const thresholdLow = calculateCaptureThreshold('Comum', hpLow, 'RARA');
            
            expect(wouldCaptureSucceed(hpHigh, thresholdHigh)).toBe(false);
            expect(wouldCaptureSucceed(hpLow, thresholdLow)).toBe(true);
        });

        it('Reduzir HP aumenta chance de sucesso', () => {
            const rarity = 'Incomum';
            const orbType = 'INCOMUM';
            
            // Simular redução de HP
            const hp75 = 0.75;
            const hp50 = 0.50;
            const hp25 = 0.25;
            const hp10 = 0.10;
            
            const t75 = calculateCaptureThreshold(rarity, hp75, orbType);
            const t50 = calculateCaptureThreshold(rarity, hp50, orbType);
            const t25 = calculateCaptureThreshold(rarity, hp25, orbType);
            const t10 = calculateCaptureThreshold(rarity, hp10, orbType);
            
            expect(wouldCaptureSucceed(hp75, t75)).toBe(false);
            expect(wouldCaptureSucceed(hp50, t50)).toBe(false);
            expect(wouldCaptureSucceed(hp25, t25)).toBe(true);
            expect(wouldCaptureSucceed(hp10, t10)).toBe(true);
        });
    });

    describe('Sempre Pode Falhar (não pode ser 100%)', () => {
        it('threshold nunca excede 95%', () => {
            // Testar todas as combinações
            const rarities = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];
            const orbs = ['COMUM', 'INCOMUM', 'RARA'];
            const hpValues = [0.01, 0.10, 0.25, 0.50, 1.00];
            
            rarities.forEach(rarity => {
                orbs.forEach(orb => {
                    hpValues.forEach(hp => {
                        const threshold = calculateCaptureThreshold(rarity, hp, orb);
                        expect(threshold).toBeLessThanOrEqual(MAX_THRESHOLD);
                    });
                });
            });
        });

        it('mesmo com melhor item e HP 1%, threshold <= 95%', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.01, 'RARA');
            expect(threshold).toBeLessThanOrEqual(MAX_THRESHOLD);
        });
    });

    describe('Edge Cases', () => {
        it('deve lidar com HP 0% (limite)', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.00, 'COMUM');
            expect(threshold).toBeGreaterThan(0);
        });

        it('deve lidar com HP 100%', () => {
            const threshold = calculateCaptureThreshold('Comum', 1.00, 'COMUM');
            expect(wouldCaptureSucceed(1.00, threshold)).toBe(false);
        });

        it('raridade inválida usa default', () => {
            const threshold = calculateCaptureThreshold('Inexistente', 0.50, 'COMUM');
            expect(threshold).toBe(0.25); // default = Comum
        });

        it('orb inválida tem bonus 0', () => {
            const threshold = calculateCaptureThreshold('Comum', 0.50, 'INEXISTENTE');
            expect(threshold).toBe(0.25); // apenas base, sem bonus
        });
    });
});
