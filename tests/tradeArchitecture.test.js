/**
 * TRADE ARCHITECTURE TESTS (PR-C)
 *
 * Estado final esperado:
 * - Sem runtime legado de Trade
 * - Fonte canônica única em js/combat/tradeSystem.js
 * - UI canônica via js/ui/tradeUI.js
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import {
    validateTrade,
    executeTrade,
    getTradeableMonsters,
    getTradeSuggestions,
} from '../js/combat/tradeSystem.js';

const REPO_ROOT = new URL('..', import.meta.url);
const readRepoFile = (relativePath) => fs.readFileSync(new URL(relativePath, REPO_ROOT), 'utf8');
const existsRepoFile = (relativePath) => fs.existsSync(new URL(relativePath, REPO_ROOT));

describe('Trade arquitetura — estado final canônico', () => {
    it('index.html não importa nem expõe TradeSystem legado', () => {
        const indexHtml = readRepoFile('index.html');

        expect(indexHtml).not.toContain("import * as TradeSystem from './js/trade/tradeSystem.js';");
        expect(indexHtml).not.toContain('window.TradeSystem = TradeSystem');
        expect(indexHtml).not.toContain('window.TradeSystem');
    });

    it('arquivo legado foi removido', () => {
        expect(existsRepoFile('js/trade/tradeSystem.js')).toBe(false);
    });

    it('TradeUI continua apontando para o sistema canônico', () => {
        const tradeUI = readRepoFile('js/ui/tradeUI.js');
        expect(tradeUI).toContain("from '../combat/tradeSystem.js'");
        expect(tradeUI).toContain('export { executeTrade, validateTrade, getTradeSuggestions, getTradeableMonsters };');
    });

    it('não há imports de ../js/trade/tradeSystem.js nos testes de Trade migrados', () => {
        const migratedTests = [
            'tests/tradeSystem.trade.test.js',
            'tests/tradeUI.test.js',
            'tests/tradeSaveLoad.test.js',
        ];

        for (const file of migratedTests) {
            const source = readRepoFile(file);
            expect(source).not.toContain("../js/trade/tradeSystem.js");
        }
    });
});

describe('Trade arquitetura — API canônica disponível', () => {
    it('módulo canônico expõe API principal de Trade', () => {
        expect(typeof validateTrade).toBe('function');
        expect(typeof executeTrade).toBe('function');
        expect(typeof getTradeableMonsters).toBe('function');
        expect(typeof getTradeSuggestions).toBe('function');
    });
});
