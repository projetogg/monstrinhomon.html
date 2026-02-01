/**
 * XP CORE TESTS (PR8A)
 * 
 * Testes para funções puras do xpCore.js
 * Cobertura: calculateBattleXP
 */

import { describe, it, expect } from 'vitest';
import { calculateBattleXP } from '../js/progression/xpCore.js';

describe('calculateBattleXP - Cálculo de XP de Batalha', () => {
    
    // Config padrão para testes
    const defaultConfig = {
        battleXpBase: 15,
        rarityXP: {
            'Comum': 1.00,
            'Incomum': 1.05,
            'Raro': 1.10,
            'Místico': 1.15,
            'Lendário': 1.25
        }
    };

    describe('Cálculo Base', () => {
        it('deve calcular XP corretamente para inimigo nível 1 comum', () => {
            const enemy = { level: 1, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 1*2) * 1.0 = 17
            expect(xp).toBe(17);
        });

        it('deve calcular XP corretamente para inimigo nível 5 comum', () => {
            const enemy = { level: 5, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 5*2) * 1.0 = 25
            expect(xp).toBe(25);
        });

        it('deve calcular XP corretamente para inimigo nível 10 comum', () => {
            const enemy = { level: 10, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 10*2) * 1.0 = 35
            expect(xp).toBe(35);
        });

        it('deve calcular XP corretamente para inimigo nível 50 comum', () => {
            const enemy = { level: 50, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 50*2) * 1.0 = 115
            expect(xp).toBe(115);
        });
    });

    describe('Multiplicadores de Raridade', () => {
        it('deve aplicar multiplicador de raridade Incomum (1.05)', () => {
            const enemy = { level: 5, rarity: 'Incomum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 5*2) * 1.05 = 26.25 -> floor = 26
            expect(xp).toBe(26);
        });

        it('deve aplicar multiplicador de raridade Raro (1.10)', () => {
            const enemy = { level: 10, rarity: 'Raro' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 10*2) * 1.10 = 38.5 -> floor = 38
            expect(xp).toBe(38);
        });

        it('deve aplicar multiplicador de raridade Místico (1.15)', () => {
            const enemy = { level: 10, rarity: 'Místico' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 10*2) * 1.15 = 40.25 -> floor = 40
            expect(xp).toBe(40);
        });

        it('deve aplicar multiplicador de raridade Lendário (1.25)', () => {
            const enemy = { level: 10, rarity: 'Lendário' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 10*2) * 1.25 = 43.75 -> floor = 43
            expect(xp).toBe(43);
        });

        it('deve usar 1.0 quando raridade não existe no config', () => {
            const enemy = { level: 5, rarity: 'Desconhecida' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 5*2) * 1.0 = 25
            expect(xp).toBe(25);
        });
    });

    describe('Boss Bonus', () => {
        it('deve aplicar 1.5x bonus para boss', () => {
            const enemy = { level: 10, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, 'boss', defaultConfig);
            // ((15 + 10*2) * 1.0) * 1.5 = 35 * 1.5 = 52.5 -> floor = 52
            expect(xp).toBe(52);
        });

        it('deve aplicar boss bonus case-insensitive', () => {
            const enemy = { level: 10, rarity: 'Comum' };
            const xpLower = calculateBattleXP(enemy, 'boss', defaultConfig);
            const xpUpper = calculateBattleXP(enemy, 'BOSS', defaultConfig);
            const xpMixed = calculateBattleXP(enemy, 'Boss', defaultConfig);
            expect(xpLower).toBe(52);
            expect(xpUpper).toBe(52);
            expect(xpMixed).toBe(52);
        });

        it('deve combinar raridade + boss bonus', () => {
            const enemy = { level: 10, rarity: 'Lendário' };
            const xp = calculateBattleXP(enemy, 'boss', defaultConfig);
            // ((15 + 10*2) * 1.25) * 1.5 = 43 * 1.5 = 64.5 -> floor = 64
            expect(xp).toBe(64);
        });

        it('não deve aplicar bonus para encontros não-boss', () => {
            const enemy = { level: 10, rarity: 'Comum' };
            const xpWild = calculateBattleXP(enemy, 'wild', defaultConfig);
            const xpGroup = calculateBattleXP(enemy, 'group', defaultConfig);
            expect(xpWild).toBe(35);
            expect(xpGroup).toBe(35);
        });
    });

    describe('Fallbacks e Edge Cases', () => {
        it('deve usar campo "raridade" se "rarity" não existir', () => {
            const enemy = { level: 5, raridade: 'Raro' }; // raridade em português
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            expect(xp).toBe(27); // (15 + 5*2) * 1.10 = 27.5 -> floor = 27
        });

        it('deve usar nível mínimo 1 se não fornecido', () => {
            const enemy = { rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 1*2) * 1.0 = 17
            expect(xp).toBe(17);
        });

        it('deve usar nível mínimo 1 se nível for 0', () => {
            const enemy = { level: 0, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            expect(xp).toBe(17);
        });

        it('deve usar nível mínimo 1 se nível for negativo', () => {
            const enemy = { level: -5, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            expect(xp).toBe(17);
        });

        it('deve usar battleXpBase padrão (15) se config vazio', () => {
            const enemy = { level: 5, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, {});
            // (15 + 5*2) * 1.0 = 25
            expect(xp).toBe(25);
        });

        it('deve usar battleXpBase customizado', () => {
            const enemy = { level: 5, rarity: 'Comum' };
            const customConfig = { battleXpBase: 20, rarityXP: {} };
            const xp = calculateBattleXP(enemy, null, customConfig);
            // (20 + 5*2) * 1.0 = 30
            expect(xp).toBe(30);
        });

        it('deve retornar mínimo 1 XP mesmo com valores muito baixos', () => {
            const enemy = { level: 1, rarity: 'Comum' };
            const lowConfig = { battleXpBase: 0, rarityXP: { 'Comum': 0.01 } };
            const xp = calculateBattleXP(enemy, null, lowConfig);
            expect(xp).toBeGreaterThanOrEqual(1);
        });

        it('deve lidar com inimigo null/undefined', () => {
            const xp = calculateBattleXP(null, null, defaultConfig);
            // level padrão 1, raridade null -> mult 1.0
            expect(xp).toBe(17);
        });
    });

    describe('Consistência', () => {
        it('deve retornar sempre o mesmo valor para mesmos inputs', () => {
            const enemy = { level: 10, rarity: 'Raro' };
            const xp1 = calculateBattleXP(enemy, null, defaultConfig);
            const xp2 = calculateBattleXP(enemy, null, defaultConfig);
            const xp3 = calculateBattleXP(enemy, null, defaultConfig);
            expect(xp1).toBe(xp2);
            expect(xp2).toBe(xp3);
        });

        it('deve ser determinístico (sem aleatoriedade)', () => {
            const enemy = { level: 15, rarity: 'Místico' };
            const results = Array.from({ length: 100 }, () => 
                calculateBattleXP(enemy, 'boss', defaultConfig)
            );
            const firstResult = results[0];
            expect(results.every(xp => xp === firstResult)).toBe(true);
        });
    });

    describe('Níveis Altos', () => {
        it('deve calcular corretamente para nível 100', () => {
            const enemy = { level: 100, rarity: 'Comum' };
            const xp = calculateBattleXP(enemy, null, defaultConfig);
            // (15 + 100*2) * 1.0 = 215
            expect(xp).toBe(215);
        });

        it('deve calcular corretamente para nível 100 boss lendário', () => {
            const enemy = { level: 100, rarity: 'Lendário' };
            const xp = calculateBattleXP(enemy, 'boss', defaultConfig);
            // ((15 + 100*2) * 1.25) * 1.5 = 268 * 1.5 = 402 -> floor = 402
            expect(xp).toBe(402);
        });
    });
});
