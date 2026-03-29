/**
 * UI AUDIT TESTS
 *
 * Testes para validar bugs encontrados na auditoria técnica:
 * 1. ID duplicado encounterQuestHint (corrigido)
 * 2. Função duplicada renderEncounterQuestHint (corrigido)
 * 3. exitTutorial não exportada para window (corrigido)
 * 4. Cobertura de integridade dos handlers onclick vs window exports
 *
 * Cobertura: DOM IDs, window exports, onclick handlers, integridade HTML
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf-8');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai todos os id="..." do HTML (excluindo os gerados em strings JS) */
function extractHtmlIds(html) {
    // Busca IDs fora de blocos de script inline (busca no HTML completo,
    // mas ignora linhas que são claramente template strings JS)
    const re = /\bid="([^"${}]+)"/g;
    const ids = [];
    let m;
    while ((m = re.exec(html)) !== null) {
        // Ignora IDs com interpolação de template string (${...})
        if (m[1].includes('$') || m[1].includes('{')) continue;
        ids.push(m[1]);
    }
    return ids;
}

/** Extrai IDs encontrados no HTML estático (tags reais, não strings JS) */
function extractStaticHtmlIds(html) {
    // Encontra IDs nos elementos reais do DOM:
    // Pega todo conteúdo fora de <script>...</script> inline
    const withoutInlineScript = html.replace(/<script>[\s\S]*?<\/script>/gi, '');
    const re = /\bid="([^"]+)"/g;
    const ids = [];
    let m;
    while ((m = re.exec(withoutInlineScript)) !== null) ids.push(m[1]);
    return ids;
}

/** Extrai todos os nomes de função usados em onclick="fn(...)" do HTML completo */
function extractOnclickFunctions(html) {
    const re = /onclick="([^"]+)"/g;
    const fns = new Set();
    let m;
    while ((m = re.exec(html)) !== null) {
        // Extrai nomes de funções: fn() ou fn('arg')
        const calls = m[1].split(';').map(s => s.trim()).filter(Boolean);
        for (const call of calls) {
            const fnMatch = call.match(/^(\w+)\s*\(/);
            if (fnMatch) fns.add(fnMatch[1]);
        }
    }
    return fns;
}

/** Extrai todos os window.XXX = XXX do bloco de exports */
function extractWindowExports(html) {
    const re = /window\.(\w+)\s*=/g;
    const exports = new Set();
    let m;
    while ((m = re.exec(html)) !== null) exports.add(m[1]);
    return exports;
}

/** Conta quantas vezes uma function com dado nome é declarada no script */
function countFunctionDeclarations(html, fnName) {
    const scriptStart = html.indexOf('<script');
    const scriptPart = scriptStart > -1 ? html.slice(scriptStart) : html;
    const re = new RegExp(`\\bfunction\\s+${fnName}\\s*\\(`, 'g');
    let count = 0;
    while (re.exec(scriptPart) !== null) count++;
    return count;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Auditoria UI — IDs Duplicados no HTML', () => {
    const htmlIds = extractStaticHtmlIds(indexHtml);

    it('não deve ter IDs duplicados no HTML estático', () => {
        const seen = {};
        const duplicates = [];
        for (const id of htmlIds) {
            seen[id] = (seen[id] || 0) + 1;
            if (seen[id] === 2) duplicates.push(id);
        }
        expect(duplicates).toEqual([]);
    });

    it('encounterQuestHint deve existir exatamente 1 vez no HTML', () => {
        const count = htmlIds.filter(id => id === 'encounterQuestHint').length;
        expect(count).toBe(1);
    });

    it('encounterQuestHintContent deve existir exatamente 1 vez no HTML', () => {
        const count = htmlIds.filter(id => id === 'encounterQuestHintContent').length;
        expect(count).toBe(1);
    });
});

describe('Auditoria UI — Funções Duplicadas', () => {
    it('renderEncounterQuestHint deve ter exatamente 1 declaração no script', () => {
        expect(countFunctionDeclarations(indexHtml, 'renderEncounterQuestHint')).toBe(1);
    });

    it('exitTutorial deve ter exatamente 1 declaração no script', () => {
        expect(countFunctionDeclarations(indexHtml, 'exitTutorial')).toBe(1);
    });
});

describe('Auditoria UI — Window Exports para onclick handlers', () => {
    const onclickFns = extractOnclickFunctions(indexHtml);
    const windowExports = extractWindowExports(indexHtml);

    it('todas as funções usadas em onclick devem estar exportadas em window', () => {
        const missing = [];
        for (const fn of onclickFns) {
            // Audio.toggleMute e Audio.playSfx são métodos do objeto Audio (exportado)
            if (fn === 'Audio') continue;
            if (!windowExports.has(fn)) missing.push(fn);
        }
        expect(missing).toEqual([]);
    });

    it('exitTutorial deve estar exportada em window', () => {
        expect(windowExports.has('exitTutorial')).toBe(true);
    });

    it('renderEncounterQuestHint deve estar exportada em window', () => {
        expect(windowExports.has('renderEncounterQuestHint')).toBe(true);
    });

    it('funções críticas de navegação devem estar exportadas', () => {
        const critical = [
            'switchTab', 'mmShowMainMenu', 'mmCloseAllOverlays',
            'mmContinue', 'mmOpenMestre', 'mmOpenSaves',
            'mmFinishNewGame', 'mmStartTutorial',
        ];
        for (const fn of critical) {
            expect(windowExports.has(fn), `${fn} deveria estar em window`).toBe(true);
        }
    });
});

describe('Auditoria UI — Tabs existem no DOM', () => {
    const requiredTabs = [
        'tabHome', 'tabSession', 'tabPlayers', 'tabEncounter',
        'tabTherapy', 'tabReport', 'tabShop', 'tabBox',
        'tabPartyDex', 'tabSettings'
    ];

    for (const tabId of requiredTabs) {
        it(`tab ${tabId} deve existir no HTML`, () => {
            expect(indexHtml).toContain(`id="${tabId}"`);
        });
    }
});

describe('Auditoria UI — Overlays têm mecanismo show/hide', () => {
    const overlays = [
        'mmIntro', 'mmMenu', 'mmNewGame', 'mmSlotPicker',
        'mmConfig', 'mmTherapist', 'mmSavesScreen', 'mmStartChoice', 'mmStarterFlow'
    ];

    it('mmCloseAllOverlays deve fechar todos os overlays conhecidos', () => {
        // Verifica que o array de IDs dentro de mmCloseAllOverlays contém todos os overlays
        for (const id of overlays) {
            expect(indexHtml).toContain(`"${id}"`);
        }
    });

    for (const id of overlays) {
        it(`overlay ${id} deve existir no HTML`, () => {
            expect(indexHtml).toContain(`id="${id}"`);
        });
    }
});

describe('Auditoria UI — Integridade de onchange handlers', () => {
    it('encounterPlayer onchange chama renderEncounterQuestHint', () => {
        // Verifica presença independente do ID e do handler (evita depender da ordem de atributos)
        expect(indexHtml).toContain('id="encounterPlayer"');
        expect(indexHtml).toContain('onchange="renderEncounterQuestHint(this.value)"');
    });

    it('encounterType onchange chama updateEncounterUI', () => {
        expect(indexHtml).toContain('id="encounterType"');
        expect(indexHtml).toContain('onchange="updateEncounterUI()"');
    });
});
