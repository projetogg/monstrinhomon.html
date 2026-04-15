/**
 * TRADE UI — FASE IX
 *
 * Painel de trocas entre jogadores. Renderiza HTML, sem estado.
 * Depende de tradeSystem.js para a lógica.
 */

import { getTradeableMonsters, getTradeSuggestions, validateTrade, executeTrade } from '../combat/tradeSystem.js';

// ── Constantes ─────────────────────────────────────────────────────────────────

const RARITY_COLOR = {
    Comum: '#7f8c8d',
    Incomum: '#27ae60',
    Raro: '#2980b9',
    Místico: '#8e44ad',
    Lendário: '#e67e22',
};

// ── Funções internas ───────────────────────────────────────────────────────────

/**
 * Renderiza card de monstrinho para a troca.
 * @param {object} mon       - Monstrinho
 * @param {string} playerId  - ID do jogador dono
 * @param {string} role      - 'A' ou 'B'
 * @returns {string} HTML
 */
function renderMonCard(mon, playerId, role) {
    const name = mon.nickname || mon.name || mon.nome || '?';
    const cls = mon.class || '?';
    const rarity = mon.rarity || 'Comum';
    const hp = Number(mon.hp) || 0;
    const hpMax = Number(mon.hpMax) || 1;
    const hpPct = Math.round((hp / hpMax) * 100);
    const color = RARITY_COLOR[rarity] || '#555';
    const emoji = mon.emoji || '🐾';

    return `
<div class="trade-mon-card" data-mon-id="${mon.id}" data-player-id="${playerId}" data-role="${role}"
     style="cursor:pointer;padding:10px;border:2px solid #ddd;border-radius:8px;margin:4px;background:#fff;
            transition:border-color 0.2s;"
     onclick="window.tradeSelectMon && window.tradeSelectMon('${role}', '${mon.id}', '${playerId}')">
  <div style="font-size:22px;text-align:center;">${emoji}</div>
  <div style="font-weight:bold;font-size:13px;text-align:center;">${name}</div>
  <div style="font-size:11px;text-align:center;color:${color};">${rarity} • ${cls}</div>
  <div style="font-size:10px;text-align:center;color:#888;">HP ${hp}/${hpMax} (${hpPct}%)</div>
</div>`;
}

/**
 * Renderiza painel de seleção para um lado da troca.
 * @param {object} player - Jogador
 * @param {string} role   - 'A' ou 'B'
 * @param {string|null} selectedMonId - ID do monstrinho selecionado
 * @returns {string} HTML
 */
function renderPlayerSide(player, role, selectedMonId) {
    const name = player.name || player.nome || 'Jogador';
    const cls = player.class || '?';
    const tradeable = getTradeableMonsters(player);

    let html = `<div style="flex:1;min-width:180px;">`;
    html += `<h4 style="font-size:14px;margin-bottom:6px;">👤 ${name} <span style="color:#888;font-size:11px;">(${cls})</span></h4>`;

    if (tradeable.length === 0) {
        html += `<p style="font-size:12px;color:#999;">Nenhum Monstrinho para trocar (todos são da sua classe).</p>`;
    } else {
        html += `<div style="display:flex;flex-wrap:wrap;gap:4px;">`;
        for (const mon of tradeable) {
            const isSelected = mon.id === selectedMonId;
            const borderStyle = isSelected ? '2px solid #3498db' : '2px solid #ddd';
            html += renderMonCard(mon, player.id, role).replace('border:2px solid #ddd', `border:${borderStyle}`);
        }
        html += `</div>`;
    }
    html += `</div>`;
    return html;
}

// ── renderTradePanel ───────────────────────────────────────────────────────────

/**
 * Renderiza o painel de trocas completo.
 *
 * @param {object} state     - GameState com players e currentSession
 * @param {object} tradeState - Estado local da UI { selectedA, selectedB, playerAId, playerBId }
 * @returns {string} HTML completo do painel
 */
export function renderTradePanel(state, tradeState = {}) {
    const players = (state.players || []).filter(Boolean);

    if (players.length < 2) {
        return `<div style="padding:20px;text-align:center;color:#999;">
            <p>⚠️ É necessário pelo menos 2 jogadores para trocar Monstrinhos.</p>
        </div>`;
    }

    const { selectedA = null, selectedB = null, playerAId, playerBId } = tradeState;

    const playerA = players.find(p => p.id === playerAId) || players[0];
    const playerB = players.find(p => p.id === playerBId) || players[1];

    // Sugestões de troca
    const suggestions = getTradeSuggestions(playerA, playerB);
    let suggestionsHtml = '';
    if (suggestions.length > 0) {
        const s = suggestions[0];
        const nameA = s.monA.nickname || s.monA.name || '?';
        const nameB = s.monB.nickname || s.monB.name || '?';
        suggestionsHtml = `
<div style="background:rgba(52,152,219,0.1);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;">
  💡 <strong>Sugestão:</strong> ${playerA.name || 'A'} troca ${nameA} por ${nameB} de ${playerB.name || 'B'}
  <button style="margin-left:8px;font-size:11px;padding:2px 8px;"
          onclick="window.tradeApplySuggestion && window.tradeApplySuggestion('${s.monA.id}', '${s.monB.id}')">
    Aplicar
  </button>
</div>`;
    }

    // Seleções atuais
    const selA = selectedA ? (playerA.team || []).find(m => m && m.id === selectedA) : null;
    const selB = selectedB ? (playerB.team || []).find(m => m && m.id === selectedB) : null;

    const btnLabel = selA && selB ? '🔄 Confirmar Troca' : '🔄 Selecione um Monstrinho de cada lado';
    const btnDisabled = (!selA || !selB) ? 'disabled' : '';

    let html = `<div class="trade-panel" style="padding:16px;">`;
    html += `<h3 style="font-size:16px;margin-bottom:12px;">🔄 Troca de Monstrinhos</h3>`;
    html += suggestionsHtml;

    // Seletor de jogadores
    html += `<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;">`;
    html += `<select onchange="window.tradeSetPlayerA && window.tradeSetPlayerA(this.value)" style="flex:1;padding:6px;border-radius:6px;">`;
    for (const p of players) {
        const sel = p.id === playerA.id ? 'selected' : '';
        html += `<option value="${p.id}" ${sel}>${p.name || p.nome || p.id}</option>`;
    }
    html += `</select>`;
    html += `<span style="line-height:32px;font-size:18px;">↔</span>`;
    html += `<select onchange="window.tradeSetPlayerB && window.tradeSetPlayerB(this.value)" style="flex:1;padding:6px;border-radius:6px;">`;
    for (const p of players) {
        const sel = p.id === playerB.id ? 'selected' : '';
        html += `<option value="${p.id}" ${sel}>${p.name || p.nome || p.id}</option>`;
    }
    html += `</select>`;
    html += `</div>`;

    // Colunas de seleção
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">`;
    html += renderPlayerSide(playerA, 'A', selectedA);
    html += renderPlayerSide(playerB, 'B', selectedB);
    html += `</div>`;

    // Confirmação
    if (selA && selB) {
        const nameA = selA.nickname || selA.name || '?';
        const nameB = selB.nickname || selB.name || '?';
        html += `<div style="text-align:center;font-size:13px;margin-bottom:8px;color:#555;">
            <strong>${playerA.name || 'A'}</strong> dá <strong>${nameA}</strong>
            → <strong>${playerB.name || 'B'}</strong> por <strong>${nameB}</strong>
        </div>`;
    }

    html += `<div style="text-align:center;">`;
    html += `<button class="btn btn-primary" ${btnDisabled}
                     onclick="window.tradeConfirm && window.tradeConfirm()"
                     style="padding:10px 24px;font-size:14px;">
        ${btnLabel}
    </button>`;
    html += `</div>`;
    html += `</div>`;

    return html;
}

// ── Exports de utilidade ───────────────────────────────────────────────────────

export { executeTrade, validateTrade, getTradeSuggestions, getTradeableMonsters };
