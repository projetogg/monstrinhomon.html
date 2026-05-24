/**
 * TRADE ARCHITECTURE TESTS (ISSUE: consolidar sistemas paralelos)
 *
 * Diagnóstico objetivo da arquitetura atual de Trade:
 * - módulos ativos em runtime
 * - cobertura de testes existente
 * - diferença de API entre módulos
 * - fonte canônica via TradeUI
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import {
    validateTrade as validateTradeCombat,
    executeTrade,
    getTradeableMonsters,
    getTradeSuggestions,
} from '../js/combat/tradeSystem.js';
import {
    validateTrade as validateTradeLegacy,
    proposeTradeAction,
    acceptTrade,
} from '../js/trade/tradeSystem.js';

const REPO_ROOT = new URL('..', import.meta.url);
const readRepoFile = (relativePath) => fs.readFileSync(new URL(relativePath, REPO_ROOT), 'utf8');

describe('Trade arquitetura — runtime e cobertura', () => {
    it('index.html mantém compatibilidade do modal via window.TradeSystem com contexto bilateral', () => {
        const indexHtml = readRepoFile('index.html');
        expect(indexHtml).toContain("import * as TradeSystem from './js/trade/tradeSystem.js';");
        expect(indexHtml).toContain('window.TradeSystem.proposeTradeAction(');
        expect(indexHtml).toContain('window.TradeSystem.acceptTrade(');
        expect(indexHtml).toContain('targetInstanceId: toInstanceId');
        expect(indexHtml).toContain('sharedBox: GameState.sharedBox || []');
    });

    it('TradeUI aponta para sistema canônico em js/combat/tradeSystem.js', () => {
        const tradeUI = readRepoFile('js/ui/tradeUI.js');
        expect(tradeUI).toContain("from '../combat/tradeSystem.js'");
        expect(tradeUI).toContain('export { executeTrade, validateTrade, getTradeSuggestions, getTradeableMonsters };');
    });

    it('testes atuais cobrem explicitamente os dois módulos de Trade', () => {
        const testsForCombat = [
            'tests/tradeSystem.test.js',
            'tests/tradeHardening.test.js',
            'tests/phaseXviBugScan.test.js',
        ];
        const testsForLegacy = [
            'tests/tradeSystem.trade.test.js',
            'tests/tradeUI.test.js',
        ];

        for (const file of testsForCombat) {
            const source = readRepoFile(file);
            expect(source).toContain("../js/combat/tradeSystem.js");
        }
        for (const file of testsForLegacy) {
            const source = readRepoFile(file);
            expect(source).toContain("../js/trade/tradeSystem.js");
        }
    });
});

describe('Trade arquitetura — diferenças de API', () => {
    it('módulo canônico expõe API bilateral com Box/sugestões', () => {
        expect(typeof validateTradeCombat).toBe('function');
        expect(typeof executeTrade).toBe('function');
        expect(typeof getTradeableMonsters).toBe('function');
        expect(typeof getTradeSuggestions).toBe('function');
    });

    it('módulo legado expõe API de proposta/aceite unilateral', () => {
        expect(typeof validateTradeLegacy).toBe('function');
        expect(typeof proposeTradeAction).toBe('function');
        expect(typeof acceptTrade).toBe('function');
    });

    it('módulo legado está adaptado para consumir lógica canônica quando bilateral', () => {
        const legacySource = readRepoFile('js/trade/tradeSystem.js');
        expect(legacySource).toContain("from '../combat/tradeSystem.js'");
        expect(legacySource).toContain('validateCanonicalTrade');
        expect(legacySource).toContain('executeCanonicalTrade');
    });
});
