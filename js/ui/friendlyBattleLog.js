/**
 * FRIENDLY BATTLE LOG (CAMADA 4B)
 *
 * Exibe as últimas 3 a 5 ações do combate em linguagem simples e amigável.
 * Substitui o log técnico de 20 entradas por uma visão focada e legível
 * para crianças e terapeutas.
 *
 * API:
 * - renderFriendlyBattleLog(logEntries, opts): string (HTML)
 * - scrollFriendlyLogToBottom(containerId): void
 */

/** Número padrão de entradas exibidas */
const DEFAULT_MAX_ENTRIES = 5;

/** ID padrão do container DOM */
const DEFAULT_CONTAINER_ID = 'friendlyBattleLog';

/**
 * Escapa caracteres especiais de HTML para prevenir XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Sanitiza um ID de elemento HTML, permitindo apenas caracteres seguros
 * (letras, dígitos, hífens e underscores).
 * @param {string} id
 * @returns {string}
 */
function sanitizeId(id) {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Renderiza o log amigável de combate com as últimas N ações.
 *
 * @param {Array<string>} logEntries - Array de strings do log (encounter.log)
 * @param {object}        [opts]
 * @param {number}        [opts.maxEntries=5]   - Quantas entradas mostrar (3–5)
 * @param {string}        [opts.containerId]    - ID do elemento para auto-scroll
 * @returns {string} HTML pronto para inserir no DOM
 */
export function renderFriendlyBattleLog(logEntries, opts = {}) {
    const maxEntries = (opts.maxEntries != null) ? opts.maxEntries : DEFAULT_MAX_ENTRIES;
    const containerId = sanitizeId(opts.containerId || DEFAULT_CONTAINER_ID);

    const entries = Array.isArray(logEntries) ? logEntries : [];
    const recent = entries.slice(-maxEntries);

    let html = '<div class="mt-20">';
    html += '<h4>📜 Últimas Ações:</h4>';
    html += `<div id="${containerId}" style="`;
    html += 'background: #f5f5f5; padding: 10px; border-radius: 5px; ';
    html += 'max-height: 150px; overflow-y: auto;';
    html += '">';

    if (recent.length === 0) {
        html += '<div style="color: #999; font-style: italic; text-align: center; padding: 8px 0;">';
        html += 'Nenhuma ação ainda...';
        html += '</div>';
    } else {
        for (const entry of recent) {
            html += '<div style="';
            html += 'padding: 5px 2px; font-size: 15px; ';
            html += 'border-bottom: 1px solid rgba(0,0,0,0.06); line-height: 1.4;';
            html += `">${escapeHtml(entry)}</div>`;
        }
    }

    html += '</div>';
    html += '</div>';

    return html;
}

/**
 * Rola o container do log até o final, exibindo as ações mais recentes.
 * Deve ser chamado após inserir o HTML no DOM.
 *
 * @param {string} [containerId] - ID do container (padrão: 'friendlyBattleLog')
 */
export function scrollFriendlyLogToBottom(containerId) {
    if (typeof document === 'undefined') return;
    const id = sanitizeId(containerId || DEFAULT_CONTAINER_ID);
    const container = document.getElementById(id);
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}
