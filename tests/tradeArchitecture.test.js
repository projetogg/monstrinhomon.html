/**
 * TRADE ARCHITECTURE TESTS (ISSUE: consolidar sistemas paralelos)
 *
 * Diagnóstico objetivo da arquitetura atual de Trade:
 * - módulos ativos em runtime
 * - cobertura de testes existente
 * - diferença de API entre módulos
 * - fonte canônica via TradeUI
 *
 * GUARDRAIL DE REMOÇÃO (adicionado em 2026-05-25):
 * Os testes da seção "módulo legado — guardrails de remoção segura"
 * garantem que as pré-condições documentadas em
 * docs/trade_legacy_removal_plan.md continuem satisfeitas enquanto
 * o módulo legado existir.
 * NÃO remover esses guardrails até que o módulo legado seja removido.
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
    it('index.html mantém modal legado com execução canônica via TradeUI', () => {
        const indexHtml = readRepoFile('index.html');
        expect(indexHtml).toContain("import * as TradeSystem from './js/trade/tradeSystem.js';");
        expect(indexHtml).not.toContain('window.TradeSystem.proposeTradeAction(');
        expect(indexHtml).not.toContain('window.TradeSystem.acceptTrade(');
        expect(indexHtml).toContain('function executeTradeFromModal(');
        expect(indexHtml).toContain('window.TradeUI.executeTrade(');
        expect(indexHtml).toContain('getLegacyTradeModalCandidates(toPlayerId)');
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

describe('Trade arquitetura — módulo legado marcado como deprecated', () => {
    it('js/trade/tradeSystem.js contém aviso @deprecated explícito', () => {
        const legacySource = readRepoFile('js/trade/tradeSystem.js');
        expect(legacySource).toContain('@deprecated');
    });

    it('js/trade/tradeSystem.js contém aviso de compatibilidade temporária', () => {
        const legacySource = readRepoFile('js/trade/tradeSystem.js');
        expect(legacySource.toLowerCase()).toContain('compatibilidade temporária');
    });

    it('js/trade/tradeSystem.js ainda importa o canônico (é um adapter, não foi removida a ponte)', () => {
        const legacySource = readRepoFile('js/trade/tradeSystem.js');
        expect(legacySource).toContain("from '../combat/tradeSystem.js'");
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

describe('Trade arquitetura — módulo legado — guardrails de remoção segura', () => {
    // ATENÇÃO: estes testes garantem que o legado NÃO seja removido prematuramente.
    // Remover estes testes somente após confirmar pré-condições de
    // docs/trade_legacy_removal_plan.md Seção 5.

    it('window.TradeSystem ainda é exposto como compatibilidade temporária em index.html', () => {
        // Pré-condição de remoção: nenhuma chamada runtime depender de window.TradeSystem.
        // Enquanto isso não for verdade, este teste deve continuar verde.
        const indexHtml = readRepoFile('index.html');
        expect(indexHtml).toContain('window.TradeSystem = TradeSystem');
    });

    it('openTradeModal ainda existe como ponto de entrada do modal legado', () => {
        // Pré-condição de remoção: openTradeModal migrado para caminho canônico (PR-A).
        const indexHtml = readRepoFile('index.html');
        expect(indexHtml).toContain('function openTradeModal(');
        expect(indexHtml).toContain('window.openTradeModal');
    });

    it('executeTradeFromModal ainda existe como executor do modal legado', () => {
        // Pré-condição de remoção: executeTradeFromModal removido/substituído após migração concluída.
        const indexHtml = readRepoFile('index.html');
        expect(indexHtml).toContain('function executeTradeFromModal(');
        expect(indexHtml).toContain('window.executeTradeFromModal');
    });

    it('js/trade/tradeSystem.js ainda existe (não foi removido prematuramente)', () => {
        // Pré-condição de remoção: todas as condições da Seção 5 de
        // docs/trade_legacy_removal_plan.md cumpridas (PR-C).
        const legacySource = readRepoFile('js/trade/tradeSystem.js');
        expect(legacySource).toBeTruthy();
    });

    it('plano de remoção do legado existe e documenta o processo', () => {
        // Garante que docs/trade_legacy_removal_plan.md existe.
        const plan = readRepoFile('docs/trade_legacy_removal_plan.md');
        expect(plan).toContain('Plano de Remoção Segura do Legado de Trade');
        expect(plan).toContain('Pré-condições para remoção futura');
    });
});
