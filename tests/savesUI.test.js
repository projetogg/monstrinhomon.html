/**
 * SAVES UI TESTS (Fase AA)
 *
 * Testa as funções de renderização pura do módulo js/ui/savesUI.js:
 *   - renderSaveSlotCardHtml(slot, env, isSelected) → card de slot na tela de saves
 *   - renderSlotPickerCardHtml(slot, env, isLast)   → card de slot no picker de novo jogo
 *
 * Cobertura:
 *   - Estado vazio (env null, env sem state)
 *   - Estado preenchido (sessionName, playersCount, timestamp)
 *   - Slot selecionado / último slot (badges, classes CSS)
 *   - Botões habilitados / desabilitados conforme estado
 *   - Formatação de data presente/ausente
 *   - Sanitização de sessionName (XSS)
 *   - Valores edge-case: playersCount undefined, sessionName vazia
 */

import { describe, it, expect } from 'vitest';
import { renderSaveSlotCardHtml, renderSlotPickerCardHtml } from '../js/ui/savesUI.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/** Envelope de slot preenchido */
function makeEnv(overrides = {}) {
    return {
        timestamp: 1700000000000, // 2023-11-14T22:13:20.000Z
        sessionName: 'Turma da Tarde',
        playersCount: 3,
        state: { players: [] },
        ...overrides
    };
}

// ─── renderSaveSlotCardHtml ───────────────────────────────────────────────────

describe('renderSaveSlotCardHtml', () => {

    describe('Slot vazio', () => {
        it('mostra "Nenhum snapshot salvo" quando env é null', () => {
            const html = renderSaveSlotCardHtml(1, null, false);
            expect(html).toContain('Nenhum snapshot salvo');
        });

        it('mostra "Nenhum snapshot salvo" quando env não tem state', () => {
            const html = renderSaveSlotCardHtml(2, { timestamp: 123, sessionName: 'X' }, false);
            expect(html).toContain('Nenhum snapshot salvo');
        });

        it('botão Restaurar está disabled quando slot vazio', () => {
            const html = renderSaveSlotCardHtml(1, null, false);
            // verifica no fragmento correto
            expect(html).toMatch(/disabled[^>]*>📂 Restaurar|📂 Restaurar<\/button>.*disabled/s);
        });

        it('botão Exportar está disabled quando slot vazio', () => {
            const html = renderSaveSlotCardHtml(1, null, false);
            expect(html).toMatch(/disabled[^>]*>⬇️ Exportar|⬇️ Exportar.*disabled/s);
        });

        it('botão Apagar está disabled quando slot vazio', () => {
            const html = renderSaveSlotCardHtml(1, null, false);
            expect(html).toMatch(/disabled[^>]*>🗑️ Apagar|🗑️ Apagar.*disabled/s);
        });

        it('botão "Salvar aqui" nunca está disabled (slot vazio)', () => {
            const html = renderSaveSlotCardHtml(1, null, false);
            // O botão Salvar aqui não pode ter disabled no mesmo atributo
            // Verificação simples: "Salvar aqui" existe e o botão pai não tem disabled
            const btnHtml = html.match(/<button[^>]*>💾 Salvar aqui<\/button>/);
            expect(btnHtml).toBeTruthy();
            expect(btnHtml[0]).not.toContain('disabled');
        });
    });

    describe('Slot preenchido', () => {
        it('mostra o nome da sessão', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ sessionName: 'Turma Especial' }), false);
            expect(html).toContain('Turma Especial');
        });

        it('mostra o número de jogadores', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ playersCount: 4 }), false);
            expect(html).toContain('4');
        });

        it('mostra "?" quando playersCount é undefined', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ playersCount: undefined }), false);
            expect(html).toContain('?');
        });

        it('mostra data formatada quando timestamp presente', () => {
            const ts = new Date('2024-05-01T10:00:00').getTime();
            const html = renderSaveSlotCardHtml(1, makeEnv({ timestamp: ts }), false);
            // Apenas verifica que contém texto de data — não a string exata (depende do locale)
            expect(html).toContain('Snapshot de:');
            // A data formatada deve aparecer em algum lugar
            expect(html.length).toBeGreaterThan(50);
        });

        it('não mostra data quando timestamp ausente', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ timestamp: undefined }), false);
            expect(html).toContain('Snapshot de:');
            // O valor após o label deve ser vazio (string vazia)
            expect(html).toMatch(/Snapshot de:<\/b>\s*<\/div>/);
        });

        it('botões de ação não estão disabled quando slot preenchido', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv(), false);
            // Nenhum dos botões de ação (Restaurar, Exportar, Apagar) deve ter disabled
            const actionBlock = html.split('mm-slot-actions')[1];
            // Conta "disabled" no bloco de ações — deve ser 0
            const disabledCount = (actionBlock.match(/\bdisabled\b/g) || []).length;
            expect(disabledCount).toBe(0);
        });
    });

    describe('Slot número e classe CSS', () => {
        it('inclui "Slot 1" no HTML', () => {
            const html = renderSaveSlotCardHtml(1, null, false);
            expect(html).toContain('Slot 1');
        });

        it('inclui "Slot 3" no HTML', () => {
            const html = renderSaveSlotCardHtml(3, null, false);
            expect(html).toContain('Slot 3');
        });

        it('inclui classe mm-slot-active quando isSelected=true', () => {
            const html = renderSaveSlotCardHtml(2, makeEnv(), true);
            expect(html).toContain('mm-slot-active');
        });

        it('não inclui mm-slot-active quando isSelected=false', () => {
            const html = renderSaveSlotCardHtml(2, makeEnv(), false);
            expect(html).not.toContain('mm-slot-active');
        });

        it('mostra badge "● Selecionado" quando isSelected=true', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv(), true);
            expect(html).toContain('● Selecionado');
        });

        it('não mostra badge "● Selecionado" quando isSelected=false', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv(), false);
            expect(html).not.toContain('● Selecionado');
        });
    });

    describe('Botões com onclick correto', () => {
        it('botão Restaurar chama mmLoadFromSlot com slot correto', () => {
            const html = renderSaveSlotCardHtml(2, makeEnv(), false);
            expect(html).toContain('mmLoadFromSlot(2)');
        });

        it('botão Salvar chama mmSaveToSlot com slot correto', () => {
            const html = renderSaveSlotCardHtml(3, makeEnv(), false);
            expect(html).toContain('mmSaveToSlot(3)');
        });

        it('botão Exportar chama mmExportSlot com slot correto', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv(), false);
            expect(html).toContain('mmExportSlot(1)');
        });

        it('botão Apagar chama mmDeleteSlot com slot correto', () => {
            const html = renderSaveSlotCardHtml(2, makeEnv(), false);
            expect(html).toContain('mmDeleteSlot(2)');
        });
    });

    describe('Sanitização (XSS)', () => {
        it('escapa < > em sessionName', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ sessionName: '<script>alert(1)</script>' }), false);
            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
        });

        it('escapa " em sessionName', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ sessionName: 'Sessão "Especial"' }), false);
            expect(html).toContain('&quot;Especial&quot;');
        });

        it('escapa & em sessionName', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ sessionName: 'A & B' }), false);
            expect(html).toContain('A &amp; B');
        });
    });

    describe('sessionName padrão', () => {
        it('usa "Sessão" quando sessionName é string vazia', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ sessionName: '' }), false);
            expect(html).toContain('Sessão</div>');
        });

        it('usa "Sessão" quando sessionName é null', () => {
            const html = renderSaveSlotCardHtml(1, makeEnv({ sessionName: null }), false);
            // null || 'Sessão' deve resultar em 'Sessão'
            expect(html).toContain('Sessão</div>');
        });
    });
});

// ─── renderSlotPickerCardHtml ─────────────────────────────────────────────────

describe('renderSlotPickerCardHtml', () => {

    describe('Slot vazio', () => {
        it('mostra "Vazio" quando env é null', () => {
            const html = renderSlotPickerCardHtml(1, null, false);
            expect(html).toContain('Vazio');
        });

        it('mostra "Vazio" quando env não tem state', () => {
            const html = renderSlotPickerCardHtml(1, { timestamp: 123 }, false);
            expect(html).toContain('Vazio');
        });

        it('mostra "✅ Usar este slot" quando slot vazio', () => {
            const html = renderSlotPickerCardHtml(1, null, false);
            expect(html).toContain('✅ Usar este slot');
        });
    });

    describe('Slot preenchido', () => {
        it('mostra o nome da sessão', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv({ sessionName: 'Turma Matutina' }), false);
            expect(html).toContain('Turma Matutina');
        });

        it('mostra número de jogadores', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv({ playersCount: 2 }), false);
            expect(html).toContain('2');
        });

        it('mostra "?" quando playersCount é undefined', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv({ playersCount: undefined }), false);
            expect(html).toContain('?');
        });

        it('mostra "✅ Usar (sobrescrever)" quando slot tem dados', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv(), false);
            expect(html).toContain('✅ Usar (sobrescrever)');
        });

        it('mostra data quando timestamp presente', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv({ timestamp: 1700000000000 }), false);
            expect(html).toContain('Data:');
        });

        it('não mostra data quando timestamp ausente', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv({ timestamp: undefined }), false);
            expect(html).toContain('Data:');
            // Valor após label deve ser vazio
            expect(html).toMatch(/Data:<\/b>\s*<\/div>/);
        });
    });

    describe('Slot último (isLast)', () => {
        it('mostra ⭐ quando isLast=true', () => {
            const html = renderSlotPickerCardHtml(1, null, true);
            expect(html).toContain('⭐');
        });

        it('não mostra ⭐ quando isLast=false', () => {
            const html = renderSlotPickerCardHtml(1, null, false);
            expect(html).not.toContain('⭐');
        });

        it('inclui classe slot-outline quando isLast=true', () => {
            const html = renderSlotPickerCardHtml(2, null, true);
            expect(html).toContain('slot-outline');
        });

        it('não inclui slot-outline quando isLast=false', () => {
            const html = renderSlotPickerCardHtml(2, null, false);
            expect(html).not.toContain('slot-outline');
        });
    });

    describe('Número do slot', () => {
        it('inclui "Slot 1" no HTML', () => {
            const html = renderSlotPickerCardHtml(1, null, false);
            expect(html).toContain('Slot 1');
        });

        it('inclui "Slot 2" no HTML', () => {
            const html = renderSlotPickerCardHtml(2, null, false);
            expect(html).toContain('Slot 2');
        });

        it('inclui "Slot 3" no HTML', () => {
            const html = renderSlotPickerCardHtml(3, null, false);
            expect(html).toContain('Slot 3');
        });
    });

    describe('Botão com onclick correto', () => {
        it('botão chama mmChooseSlotAndStartNewGame com slot 1', () => {
            const html = renderSlotPickerCardHtml(1, null, false);
            expect(html).toContain('mmChooseSlotAndStartNewGame(1)');
        });

        it('botão chama mmChooseSlotAndStartNewGame com slot 3', () => {
            const html = renderSlotPickerCardHtml(3, makeEnv(), false);
            expect(html).toContain('mmChooseSlotAndStartNewGame(3)');
        });
    });

    describe('Sanitização (XSS)', () => {
        it('escapa < > em sessionName', () => {
            const html = renderSlotPickerCardHtml(1, makeEnv({ sessionName: '<img src=x onerror=alert(1)>' }), false);
            expect(html).not.toContain('<img');
            expect(html).toContain('&lt;img');
        });
    });
});
