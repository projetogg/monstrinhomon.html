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
 * @param {string} ownerClass - Classe do jogador dono
 * @returns {string} HTML
 */
function renderMonCard(mon, playerId, role, ownerClass) {
    const name = mon.nickname || mon.name || mon.nome || '?';
    const cls = mon.class || '?';
    const rarity = mon.rarity || 'Comum';
    const hp = Number(mon.hp) || 0;
    const hpMax = Number(mon.hpMax) || 1;
    const hpPct = Math.round((hp / hpMax) * 100);
    const color = RARITY_COLOR[rarity] || '#555';
    const emoji = mon.emoji || '🐾';
    const fromBox = !!mon._boxSlotId;

    const classBadge = cls === ownerClass
        ? `<div style="font-size:10px;text-align:center;color:#2e7d32;font-weight:700;">✔ Na sua classe</div>`
        : `<div style="font-size:10px;text-align:center;color:#b71c1c;font-weight:700;">🔄 Trocar!</div>`;

    const boxBadge = fromBox
        ? `<div style="font-size:9px;text-align:center;color:#7f8c8d;font-style:italic;">📦 Da Box</div>`
        : '';

    return `
<div class="trade-mon-card" data-mon-id="${mon.id}" data-player-id="${playerId}" data-role="${role}"
     style="cursor:pointer;padding:10px;border:2px solid #ddd;border-radius:8px;margin:4px;background:#fff;
            transition:border-color 0.2s;"
     onclick="window.tradeSelectMon && window.tradeSelectMon('${role}', '${mon.id}', '${playerId}')">
  <div style="font-size:22px;text-align:center;">${emoji}</div>
  <div style="font-weight:bold;font-size:13px;text-align:center;">${name}</div>
  <div style="font-size:11px;text-align:center;margin:3px 0;">
    <span class="dex-badge-class" data-class="${cls}">${cls}</span>
    <span style="color:${color};font-size:10px;display:block;margin-top:2px;">${rarity}</span>
  </div>
  ${classBadge}
  ${boxBadge}
  <div style="font-size:10px;text-align:center;color:#888;">HP ${hp}/${hpMax} (${hpPct}%)</div>
</div>`;
}

/**
 * Renderiza painel de seleção para um lado da troca.
 * @param {object}      player       - Jogador
 * @param {string}      role         - 'A' ou 'B'
 * @param {string|null} selectedMonId - ID do monstrinho selecionado
 * @param {Array}       [sharedBox]  - Slots da Box compartilhada
 * @returns {string} HTML
 */
function renderPlayerSide(player, role, selectedMonId, sharedBox = []) {
    const name = player.name || player.nome || 'Jogador';
    const cls = player.class || '?';
    const tradeable = getTradeableMonsters(player, sharedBox);
    const teamTradeable = tradeable.filter(m => !m._boxSlotId);
    const boxTradeable  = tradeable.filter(m =>  m._boxSlotId);

    let html = `<div style="flex:1;min-width:180px;">`;
    html += `<h4 style="font-size:14px;margin-bottom:6px;">👤 ${name} <span style="color:#888;font-size:11px;">(${cls})</span></h4>`;

    if (tradeable.length === 0) {
        html += `<p style="font-size:12px;color:#999;">Nenhum Monstrinho para trocar (todos são da sua classe).</p>`;
    } else {
        // Monstrinhos do time
        if (teamTradeable.length > 0) {
            html += `<div style="font-size:11px;color:#555;margin-bottom:4px;font-weight:600;">🏅 Time</div>`;
            html += `<div style="display:flex;flex-wrap:wrap;gap:4px;">`;
            for (const mon of teamTradeable) {
                const isSelected = mon.id === selectedMonId;
                const borderStyle = isSelected ? '2px solid #3498db' : '2px solid #ddd';
                html += renderMonCard(mon, player.id, role, player.class).replace('border:2px solid #ddd', `border:${borderStyle}`);
            }
            html += `</div>`;
        }

        // Monstrinhos da Box
        if (boxTradeable.length > 0) {
            html += `<div style="font-size:11px;color:#7f8c8d;margin:8px 0 4px;font-weight:600;">📦 Box</div>`;
            html += `<div style="display:flex;flex-wrap:wrap;gap:4px;">`;
            for (const mon of boxTradeable) {
                const isSelected = mon.id === selectedMonId;
                const borderStyle = isSelected ? '2px solid #3498db' : '2px solid #aaa';
                html += renderMonCard(mon, player.id, role, player.class)
                    .replace('border:2px solid #ddd', `border:${borderStyle}`)
                    .replace('background:#fff', 'background:#f8f9fa');
            }
            html += `</div>`;
        }
    }
    html += `</div>`;
    return html;
}

// ── renderTradePanel ───────────────────────────────────────────────────────────

/**
 * Renderiza o painel de trocas completo.
 *
 * @param {object} state     - GameState com players, currentSession e sharedBox
 * @param {object} tradeState - Estado local da UI { selectedA, selectedB, playerAId, playerBId }
 * @returns {string} HTML completo do painel
 */
export function renderTradePanel(state, tradeState = {}) {
    const players = (state.players || []).filter(Boolean);
    const sharedBox = state.sharedBox || [];

    if (players.length < 2) {
        return `<div style="padding:20px;text-align:center;color:#999;">
            <p>⚠️ É necessário pelo menos 2 jogadores para trocar Monstrinhos.</p>
        </div>`;
    }

    const { selectedA = null, selectedB = null, playerAId, playerBId, pendingProposal = null } = tradeState;

    const playerA = players.find(p => p.id === playerAId) || players[0];
    const playerB = players.find(p => p.id === playerBId) || players[1];

    // Sugestões de troca (inclui Box)
    const suggestions = getTradeSuggestions(playerA, playerB, sharedBox);
    let suggestionsHtml = '';
    if (suggestions.length > 0) {
        const s = suggestions[0];
        const nameA = s.monA.nickname || s.monA.name || '?';
        const nameB = s.monB.nickname || s.monB.name || '?';
        const srcA  = s.monA._boxSlotId ? ' (Box)' : '';
        const srcB  = s.monB._boxSlotId ? ' (Box)' : '';
        suggestionsHtml = `
<div style="background:rgba(52,152,219,0.1);border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;">
  💡 <strong>Sugestão:</strong> ${playerA.name || 'A'} troca ${nameA}${srcA} por ${nameB}${srcB} de ${playerB.name || 'B'}
  <button style="margin-left:8px;font-size:11px;padding:2px 8px;"
          onclick="window.tradeApplySuggestion && window.tradeApplySuggestion('${s.monA.id}', '${s.monB.id}')">
    Aplicar
  </button>
</div>`;
    }

    // Seleções atuais (verifica time E box)
    const findMon = (player, monId) => {
        if (!monId) return null;
        const fromTeam = (player.team || []).find(m => m && m.id === monId);
        if (fromTeam) return fromTeam;
        const slot = sharedBox.find(s => s.ownerPlayerId === player.id && s.monster?.id === monId);
        return slot ? { ...slot.monster, _boxSlotId: slot.slotId } : null;
    };
    const selA = findMon(playerA, selectedA);
    const selB = findMon(playerB, selectedB);

    const btnLabel = selA && selB ? '📨 Propor Troca' : '🔄 Selecione um Monstrinho de cada lado';
    const btnDisabled = (!selA || !selB || pendingProposal) ? 'disabled' : '';

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

    // Colunas de seleção (com Box)
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">`;
    html += renderPlayerSide(playerA, 'A', selectedA, sharedBox);
    html += renderPlayerSide(playerB, 'B', selectedB, sharedBox);
    html += `</div>`;

    // Confirmação
    if (selA && selB) {
        const nameA = selA.nickname || selA.name || '?';
        const nameB = selB.nickname || selB.name || '?';
        const srcA  = selA._boxSlotId ? ' (Box)' : '';
        const srcB  = selB._boxSlotId ? ' (Box)' : '';
        html += `<div style="text-align:center;font-size:13px;margin-bottom:8px;color:#555;">
            <strong>${playerA.name || 'A'}</strong> dá <strong>${nameA}${srcA}</strong>
            → <strong>${playerB.name || 'B'}</strong> por <strong>${nameB}${srcB}</strong>
        </div>`;
    }

    if (pendingProposal) {
        const proposer  = players.find(p => p.id === pendingProposal.playerAId);
        const receiver  = players.find(p => p.id === pendingProposal.playerBId);
        html += `<div style="background:rgba(241,196,15,0.12);border:1px solid rgba(241,196,15,0.45);border-radius:8px;padding:10px;margin:12px 0;text-align:center;">
            <div style="font-size:13px;margin-bottom:8px;">📨 <strong>${proposer?.name || 'Jogador A'}</strong> propôs troca para <strong>${receiver?.name || 'Jogador B'}</strong>.</div>
            <button class="btn btn-success" onclick="window.tradeAccept && window.tradeAccept()" style="margin-right:8px;">✅ Aceitar</button>
            <button class="btn btn-secondary" onclick="window.tradeReject && window.tradeReject()">❌ Recusar</button>
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
