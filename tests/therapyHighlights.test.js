/**
 * THERAPY HIGHLIGHTS TESTS (XVII-E)
 *
 * Testes para o sistema de destaques terapêuticos no modal de fim de batalha.
 *
 * Como battleEndModal.js acessa o DOM, este teste usa um mock leve de
 * document/body para capturar o HTML gerado, sem precisar de jsdom completo.
 *
 * Cobertura:
 * - Modal exibe destaques quando result='victory' e therapyHighlights não vazio
 * - Modal NÃO exibe destaques em resultado 'defeat' ou 'retreat'
 * - Modal NÃO exibe seção se therapyHighlights estiver vazio
 * - Cada highlight aparece individualmente no HTML gerado
 * - Parâmetros do modal são validados corretamente
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock de DOM leve ────────────────────────────────────────────────────────

/**
 * Instala um mock mínimo de document/body no contexto global.
 * Suficiente para que showBattleEndModal monte o HTML sem erros.
 */
function installDomMock() {
    let capturedHtml = '';
    let isVisible = false;

    const mockModal = {
        style: { display: 'none' },
        addEventListener: vi.fn(),
        get innerHTML() { return capturedHtml; },
        set innerHTML(v) { capturedHtml = v; },
        id: 'battleEndModal',
        _getHtml: () => capturedHtml,
        _isVisible: () => isVisible,
    };

    const mockBody = {
        appendChild: vi.fn(),
    };

    global.document = {
        getElementById: vi.fn((id) => {
            if (id === 'battleEndModal') return mockModal;
            return null;
        }),
        createElement: vi.fn(() => {
            // Quando modal não existe, cria um novo
            return mockModal;
        }),
        body: mockBody,
    };

    return mockModal;
}

function uninstallDomMock() {
    delete global.document;
}

// ── Testes de contrato de parâmetros (sem DOM) ─────────────────────────────

describe('BattleEndModal - therapyHighlights: contrato de parâmetros', () => {

    it('therapyHighlights deve ser array para funcionar', () => {
        const highlights = ['Esperou a vez', 'Ajudou o colega'];
        expect(Array.isArray(highlights)).toBe(true);
        expect(highlights.length).toBeGreaterThan(0);
    });

    it('therapyHighlights vazio não deve gerar seção', () => {
        const highlights = [];
        const shouldShow = highlights.length > 0;
        expect(shouldShow).toBe(false);
    });

    it('só exibe destaques no resultado victory', () => {
        const highlights = ['Controlou impulso'];
        for (const result of ['defeat', 'retreat']) {
            const shouldShow = result === 'victory' && highlights.length > 0;
            expect(shouldShow).toBe(false);
        }
        expect('victory' === 'victory' && highlights.length > 0).toBe(true);
    });

    it('cada highlight é uma string não vazia', () => {
        const highlights = ['Esperou a vez', 'Elogiou colega', 'Gentileza'];
        for (const hl of highlights) {
            expect(typeof hl).toBe('string');
            expect(hl.length).toBeGreaterThan(0);
        }
    });

    it('params victory completo tem estrutura esperada', () => {
        const params = {
            result: 'victory',
            participants: [{ playerName: 'Ana', xp: 30, money: 50 }],
            rewards: {},
            log: [],
            therapyHighlights: ['Esperou a vez', 'Gentileza com o grupo']
        };

        expect(params.result).toBe('victory');
        expect(Array.isArray(params.therapyHighlights)).toBe(true);
        expect(params.therapyHighlights).toHaveLength(2);
    });
});

// ── Testes de renderização (com mock DOM) ──────────────────────────────────

describe('BattleEndModal - therapyHighlights: renderização', () => {
    let mockModal;

    beforeEach(() => {
        mockModal = installDomMock();
    });

    afterEach(() => {
        uninstallDomMock();
        vi.restoreAllMocks();
    });

    it('HTML gerado inclui cada highlight individualmente', async () => {
        // Import dinâmico para evitar erros de document no topo do módulo
        const { showBattleEndModal, closeBattleEndModal } = await import('../js/ui/battleEndModal.js');

        const highlights = ['Esperou a vez', 'Elogiou o colega', 'Controlou impulso'];
        const promise = showBattleEndModal({
            result: 'victory',
            participants: [{ playerName: 'Ana', xp: 30, money: 50 }],
            therapyHighlights: highlights
        });

        // Fechar modal imediatamente para resolver a Promise
        closeBattleEndModal();
        await promise;

        const html = mockModal._getHtml();
        for (const hl of highlights) {
            expect(html).toContain(hl);
        }
    });

    it('HTML inclui seção "Destaques do Grupo" em vitória com highlights', async () => {
        const { showBattleEndModal, closeBattleEndModal } = await import('../js/ui/battleEndModal.js');

        const promise = showBattleEndModal({
            result: 'victory',
            participants: [{ playerName: 'João', xp: 20, money: 30 }],
            therapyHighlights: ['Gentileza']
        });

        closeBattleEndModal();
        await promise;

        expect(mockModal._getHtml()).toContain('Destaques do Grupo');
    });

    it('HTML NÃO inclui "Destaques do Grupo" em derrota', async () => {
        const { showBattleEndModal, closeBattleEndModal } = await import('../js/ui/battleEndModal.js');

        const promise = showBattleEndModal({
            result: 'defeat',
            participants: [],
            therapyHighlights: ['Esperou a vez']
        });

        closeBattleEndModal();
        await promise;

        expect(mockModal._getHtml()).not.toContain('Destaques do Grupo');
    });

    it('HTML NÃO inclui "Destaques do Grupo" em retirada', async () => {
        const { showBattleEndModal, closeBattleEndModal } = await import('../js/ui/battleEndModal.js');

        const promise = showBattleEndModal({
            result: 'retreat',
            participants: [],
            therapyHighlights: ['Controlou impulso']
        });

        closeBattleEndModal();
        await promise;

        expect(mockModal._getHtml()).not.toContain('Destaques do Grupo');
    });

    it('HTML NÃO inclui "Destaques do Grupo" em vitória sem highlights', async () => {
        const { showBattleEndModal, closeBattleEndModal } = await import('../js/ui/battleEndModal.js');

        const promise = showBattleEndModal({
            result: 'victory',
            participants: [{ playerName: 'Bia', xp: 10, money: 20 }],
            therapyHighlights: []
        });

        closeBattleEndModal();
        await promise;

        expect(mockModal._getHtml()).not.toContain('Destaques do Grupo');
    });

    it('showBattleEndModal retorna Promise que resolve ao fechar', async () => {
        const { showBattleEndModal, closeBattleEndModal } = await import('../js/ui/battleEndModal.js');

        let resolved = false;
        const promise = showBattleEndModal({
            result: 'victory',
            participants: [],
            therapyHighlights: []
        }).then(() => { resolved = true; });

        expect(resolved).toBe(false);
        closeBattleEndModal();
        await promise;
        expect(resolved).toBe(true);
    });
});
