/**
 * Quest UI — js/ui/questUI.js
 *
 * Funções puras de geração de HTML para quests.
 * Sem DOM, sem GameFlow, sem GameState — dependências injetadas como parâmetros.
 *
 * Exportações:
 *   renderQuestTrackerEntries(entries, maxVisible)                                                      → string HTML
 *   renderQuestEntryHtml(quest, progress, needed)                                                       → string HTML
 *   renderPendingRewardEntryHtml(quest, playerId, questId)                                              → string HTML
 *   renderPlayerQuestSectionHtml(player, activeQuestsSummary, pendingRewardIds, claimedCompletedIds, getQuest) → string HTML
 */

/**
 * Gera HTML para a lista de entradas do painel tracker de quests (Home).
 *
 * Cada entrada em `entries` deve ter: { quest, progress, needed, playerName }.
 * Exibe até `maxVisible` entradas; adiciona dica "+N quests" caso haja mais.
 *
 * @param {{ quest: object, progress: number, needed: number, playerName: string }[]} entries
 * @param {number} maxVisible - Número máximo de entradas visíveis.
 * @returns {string} HTML das entradas visíveis + dica de extras.
 */
export function renderQuestTrackerEntries(entries, maxVisible) {
    const visible = entries.slice(0, maxVisible);
    const extra = entries.length - maxVisible;

    let html = visible.map(({ quest, progress, needed, playerName }) => {
        const pct = needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 0;
        const progressText = `Progresso: ${progress}/${needed} · 💰${quest.rewardGold} · ⭐${quest.rewardXp}XP`;
        return `
                        <div class="quest-tracker-entry">
                            <div class="quest-header">
                                <strong title="${quest.nome}">${quest.nome}</strong>
                                <span class="text-small text-muted" title="${playerName}">(${playerName})</span>
                            </div>
                            <div class="quest-progress-bar">
                                <div class="quest-progress-fill" style="width:${pct}%"></div>
                            </div>
                            <div class="text-small" title="${progressText}">${progressText}</div>
                        </div>
                    `;
    }).join('');

    if (extra > 0) {
        html += `<div class="quest-more-hint">+${extra} quest${extra > 1 ? 's' : ''} — veja o Grupo</div>`;
    }

    return html;
}

/**
 * Gera HTML para uma quest ativa individual (aba Missões).
 *
 * Inclui cabeçalho, localização, descrição, barra de progresso e recompensas.
 *
 * @param {object} quest     - Objeto da quest (nome, descricao, localId, rewardXp, rewardGold, rewardItemId).
 * @param {number} progress  - Progresso atual.
 * @param {number} needed    - Total necessário para concluir.
 * @returns {string} HTML do card de quest ativa.
 */
export function renderQuestEntryHtml(quest, progress, needed) {
    const pct = needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 0;
    const localLabel = quest.localId ? ` · 📍 ${quest.localId}` : '';

    let html = `<div class="quest-tracker-entry" style="margin-bottom:10px;">`;
    html += `  <div class="quest-header">`;
    html += `    <strong>${quest.nome}</strong>`;
    html += `    <span class="text-small text-muted">${localLabel}</span>`;
    html += `  </div>`;
    html += `  <div class="text-small" style="color:#666;margin:3px 0;">${quest.descricao || ''}</div>`;
    html += `  <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${pct}%"></div></div>`;
    html += `  <div class="text-small" style="margin-top:3px;">`;
    html += `    Progresso: ${progress}/${needed}`;
    if (quest.rewardXp)     html += ` · ⭐ ${quest.rewardXp} XP`;
    if (quest.rewardGold)   html += ` · 💰 ${quest.rewardGold}`;
    if (quest.rewardItemId) html += ` · 🎁 ${quest.rewardItemId}`;
    html += `  </div>`;
    html += `</div>`;

    return html;
}

/**
 * Gera HTML para o cartão de recompensa pendente de coleta (aba Missões).
 *
 * Inclui nome da quest concluída e botão "🎁 Coletar Recompensa".
 * O botão chama `claimQuestRewardUI(playerId, questId)` via onclick inline.
 *
 * @param {object} quest    - Objeto da quest (nome, rewardXp, rewardGold, rewardItemId).
 * @param {string} playerId - ID do jogador dono da recompensa.
 * @param {string} questId  - ID da quest.
 * @returns {string} HTML do cartão de recompensa pendente.
 */
export function renderPendingRewardEntryHtml(quest, playerId, questId) {
    let html = `<div class="quest-tracker-entry" style="margin-bottom:8px;border-left:3px solid #e67e22;padding-left:8px;">`;
    html += `  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">`;
    html += `    <strong style="font-size:13px;">✅ ${quest.nome}</strong>`;
    html += `    <button class="btn btn-warning btn-sm" onclick="claimQuestRewardUI('${playerId}', '${questId}')" style="font-size:12px;padding:4px 10px;">`;
    html += `      🎁 Coletar Recompensa`;
    html += `    </button>`;
    html += `  </div>`;
    html += `  <div class="text-small" style="color:#888;margin-top:3px;">`;
    if (quest.rewardXp)     html += `⭐ +${quest.rewardXp} XP `;
    if (quest.rewardGold)   html += `💰 +${quest.rewardGold} `;
    if (quest.rewardItemId) html += `🎁 ${quest.rewardItemId}`;
    html += `  </div>`;
    html += `</div>`;

    return html;
}

/**
 * Gera HTML para a seção completa de quests de um jogador (aba Missões).
 *
 * Agrega:
 *  - Quests ativas (via renderQuestEntryHtml)
 *  - Recompensas pendentes (via renderPendingRewardEntryHtml)
 *  - Quests concluídas e já coletadas (bloco <details> colapsado)
 *
 * @param {object}   player               - Objeto do jogador (id, name/nome).
 * @param {{ quest: object, progress: number, needed: number }[]} activeQuestsSummary
 * @param {string[]} pendingRewardIds      - IDs de quests com recompensa disponível.
 * @param {string[]} claimedCompletedIds   - IDs de quests concluídas e coletadas.
 * @param {function} getQuest              - Função `(questId: string) => object|null`.
 * @returns {string} HTML do card do jogador com todas as seções de quest.
 */
export function renderPlayerQuestSectionHtml(player, activeQuestsSummary, pendingRewardIds, claimedCompletedIds, getQuest) {
    const playerName = player.name || player.nome || player.id;

    let html = `<div class="card" style="margin-bottom:12px;">`;
    html += `<h3 style="margin-bottom:10px;">👤 ${playerName}</h3>`;

    // — Quests Ativas —
    if (activeQuestsSummary.length > 0) {
        html += `<div style="margin-bottom:10px;"><strong style="font-size:13px;color:#555;">🗺️ Ativas (${activeQuestsSummary.length})</strong></div>`;
        for (const { quest, progress, needed } of activeQuestsSummary) {
            html += renderQuestEntryHtml(quest, progress, needed);
        }
    } else {
        html += `<p class="text-muted text-small">Nenhuma missão ativa.</p>`;
    }

    // — Recompensas Pendentes de Coleta —
    if (pendingRewardIds.length > 0) {
        html += `<div style="margin-top:10px;margin-bottom:6px;">`;
        html += `<strong style="font-size:13px;color:#e67e22;">🎁 Recompensas disponíveis (${pendingRewardIds.length})</strong>`;
        html += `</div>`;
        for (const qid of pendingRewardIds) {
            const q = getQuest(qid);
            if (!q) continue;
            html += renderPendingRewardEntryHtml(q, player.id, qid);
        }
    }

    // — Quests Concluídas (recompensas já coletadas) —
    if (claimedCompletedIds.length > 0) {
        html += `<details style="margin-top:8px;">`;
        html += `<summary style="cursor:pointer;font-size:13px;color:#27ae60;font-weight:600;">`;
        html += `✅ Concluídas (${claimedCompletedIds.length})</summary>`;
        html += `<ul style="margin:6px 0 0 16px;padding:0;">`;
        for (const qid of claimedCompletedIds) {
            const q = getQuest(qid);
            const label = q ? `${q.nome} <span style="color:#aaa;font-size:11px;">(${qid})</span>` : qid;
            html += `<li style="font-size:12px;color:#555;margin:2px 0;">${label}</li>`;
        }
        html += `</ul></details>`;
    }

    html += `</div>`;
    return html;
}
