/**
 * SAVES UI - js/ui/savesUI.js
 *
 * Funções de renderização puras para a tela de saves e slot picker.
 * Retornam HTML como string — sem manipulação de DOM, sem efeitos colaterais.
 *
 * Exportações:
 *   renderSaveSlotCardHtml(slot, env, isSelected) → string HTML de um card de slot de save
 *   renderSlotPickerCardHtml(slot, env, isLast)   → string HTML de um card do slot picker
 *
 * Dependências externas (passadas via parâmetro ou resolvidas internamente):
 *   - escapeHtml: sanitização de texto do usuário (incluída neste módulo)
 */

// ─── Utilitário ───────────────────────────────────────────────────────────────

/**
 * Escapa caracteres HTML especiais para evitar injeção.
 * @param {string} text
 * @returns {string}
 */
function _escapeHtml(text) {
    if (typeof text !== 'string') return String(text ?? '');
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Formata um timestamp numérico para exibição localizada em pt-BR.
 * @param {number|undefined} timestamp
 * @returns {string} String formatada ou string vazia
 */
function _formatDate(timestamp) {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('pt-BR');
}

// ─── Renders ──────────────────────────────────────────────────────────────────

/**
 * Renderiza o card HTML de um slot de save para a tela de saves.
 *
 * @param {number}  slot       - Número do slot (1, 2 ou 3)
 * @param {object|null} env    - Envelope do slot: { timestamp, sessionName, playersCount, state }
 *                               Null ou sem `state` indica slot vazio.
 * @param {boolean} isSelected - true se este é o slot manual associado (destino de snapshots)
 * @returns {string} HTML como string
 */
export function renderSaveSlotCardHtml(slot, env, isSelected) {
    const empty = !env || !env.state;
    const date  = _formatDate(env?.timestamp);

    const selectedBadge = isSelected
        ? `<span style="color:#4ade80;font-weight:bold;margin-left:8px;" title="Slot manual selecionado para próximos snapshots">● Selecionado</span>`
        : '';

    const meta = empty
        ? `<div class="mm-slot-meta">Nenhum snapshot salvo</div>`
        : `<div class="mm-slot-meta">
             <div><b>Sessão:</b> ${_escapeHtml(env.sessionName || 'Sessão')}</div>
             <div><b>Jogadores:</b> ${env.playersCount ?? '?'}</div>
             <div><b>Snapshot de:</b> ${date}</div>
           </div>`;

    const disabledAttr = empty ? 'disabled' : '';

    return `
        <div class="mm-slot${isSelected ? ' mm-slot-active' : ''}">
            <h3>Slot ${slot}${selectedBadge}</h3>
            ${meta}
            <div class="mm-slot-actions">
                <button class="mm-btn w-auto" ${disabledAttr} onclick="mmLoadFromSlot(${slot})">📂 Restaurar</button>
                <button class="mm-btn w-auto" onclick="mmSaveToSlot(${slot})">💾 Salvar aqui</button>
                <button class="mm-btn w-auto" ${disabledAttr} onclick="mmExportSlot(${slot})">⬇️ Exportar</button>
                <button class="mm-btn w-auto" ${disabledAttr} onclick="mmDeleteSlot(${slot})">🗑️ Apagar</button>
            </div>
        </div>
    `;
}

/**
 * Renderiza o card HTML de um slot para o slot picker do novo jogo.
 *
 * @param {number}  slot   - Número do slot (1, 2 ou 3)
 * @param {object|null} env - Envelope do slot (mesma estrutura de renderSaveSlotCardHtml)
 * @param {boolean} isLast - true se este foi o último slot utilizado (destaca com ⭐)
 * @returns {string} HTML como string
 */
export function renderSlotPickerCardHtml(slot, env, isLast) {
    const empty = !env || !env.state;
    const date  = _formatDate(env?.timestamp);

    const meta = empty
        ? `<div class="mm-slot-meta">Vazio</div>`
        : `<div class="mm-slot-meta">
             <div><b>Sessão:</b> ${_escapeHtml(env.sessionName || 'Sessão')}</div>
             <div><b>Jogadores:</b> ${env.playersCount ?? '?'}</div>
             <div><b>Data:</b> ${date}</div>
           </div>`;

    const btnLabel = empty ? '✅ Usar este slot' : '✅ Usar (sobrescrever)';

    return `
        <div class="mm-slot ${isLast ? 'slot-outline' : ''}">
            <h3 class="my-0 mb-6">Slot ${slot} ${isLast ? '⭐' : ''}</h3>
            ${meta}
            <div class="mm-slot-actions">
                <button class="mm-btn w-auto" onclick="mmChooseSlotAndStartNewGame(${slot})">
                    ${btnLabel}
                </button>
            </div>
        </div>
    `;
}
