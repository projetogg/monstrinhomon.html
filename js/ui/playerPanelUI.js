/**
 * Player Panel UI
 * Extração de renderização do painel de jogadores (Fase Q).
 */

import { getMonsterVisualHTML } from './monsterVisual.js';

function clampPercent(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
}

function safeText(value, fallback = '') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value);
}

function defaultRenderSpeciesIdentityBlock() {
    return '';
}

export function renderMonsterCard(monster, options = {}) {
    try {
        if (!monster) return '';

        const hpPercent = clampPercent(((monster.hp || 0) / (monster.hpMax || 1)) * 100);
        const xpNeeded = (monster.level || 1) * 100;
        const xpPercent = clampPercent(((monster.xp || 0) / xpNeeded) * 100);

        const defaultFriendship = options.defaultFriendship ?? 50;
        const friendship = monster.friendship ?? defaultFriendship;
        const getFriendshipIcon = options.getFriendshipIcon || (() => '🤝');
        const getFriendshipLevel = options.getFriendshipLevel || (() => 1);
        const getFriendshipBonuses = options.getFriendshipBonuses || (() => ({}));
        const formatFriendshipBonusPercent = options.formatFriendshipBonusPercent || (() => 0);
        const renderSpeciesIdentityBlock = options.renderSpeciesIdentityBlock || defaultRenderSpeciesIdentityBlock;

        const friendshipIcon = getFriendshipIcon(friendship);
        const friendshipLevel = getFriendshipLevel(friendship);
        const friendshipBonuses = getFriendshipBonuses(friendship);

        let friendshipTooltip = `Nível de Amizade: ${friendshipLevel}/5`;
        if ((friendshipBonuses.xpMultiplier || 1) > 1.0) {
            friendshipTooltip += `\nBônus XP: +${formatFriendshipBonusPercent(friendshipBonuses.xpMultiplier)}%`;
        }
        if ((friendshipBonuses.critChance || 0) > 0) {
            friendshipTooltip += `\nChance Crítico: +${friendshipBonuses.critChance * 100}%`;
        }
        if ((friendshipBonuses.statBonus || 0) > 0) {
            friendshipTooltip += `\nBônus Stats: +${friendshipBonuses.statBonus}`;
        }

        return `
            <div class="monster-card ${safeText(monster.class, 'common')}">
                <div class="monster-card-portrait">${getMonsterVisualHTML(monster, { variant: 'box', size: 'md' })}</div>
                <strong>${safeText(monster.name, 'Unknown')}</strong>
                ${monster.isShiny ? '<div class="badge badge-shiny">⭐ SHINY ⭐</div>' : ''}
                <div class="badge badge-${safeText(monster.rarity, 'common')}">${safeText(monster.rarity, 'common')}</div>
                <div>Lv ${monster.level || 1}</div>
                <div class="progress-bar h-30">
                    <div class="progress-fill hp" style="width: ${hpPercent}%"></div>
                </div>
                <small>${monster.hp || 0}/${monster.hpMax || 0} HP</small>
                <div class="progress-bar h-15">
                    <div class="progress-fill xp" style="width: ${xpPercent}%"></div>
                </div>
                <small>${monster.xp || 0}/${xpNeeded} XP</small>

                <div class="friendship-indicator" title="${friendshipTooltip}">
                    ${friendshipIcon} <span class="friendship-text">${friendship}/100</span>
                    <div class="friendship-bar">
                        <div class="friendship-fill" style="width: ${clampPercent(friendship)}%"></div>
                    </div>
                </div>
                ${renderSpeciesIdentityBlock(monster)}
            </div>
        `;
    } catch (error) {
        console.error('Failed to render monster card:', error);
        return '<div class="monster-card">Error</div>';
    }
}

export function renderTeamReorderList(player, deps = {}) {
    try {
        if (!player || !Array.isArray(player.team) || player.team.length === 0) {
            return '<p class="text-muted">No monsters in team.</p>';
        }

        const isAlive = deps.isAlive || ((entity) => (entity?.hp || 0) > 0);
        const renderEquipableItems = deps.renderEquipableItems || (() => '');
        const getItemById = deps.getItemById || (() => null);
        const isReadyForKitSwap = deps.isReadyForKitSwap || (() => false);
        const isEligibleForBattle = deps.isEligibleForBattle || (() => true);
        const renderEligibilityBadgeForTeam = deps.renderEligibilityBadgeForTeam || (() => '');
        const renderTeamReadinessIndicator = deps.renderTeamReadinessIndicator || (() => '');
        const actionNames = deps.actionNames || {};

        const moveUpAction = actionNames.moveUp || 'moveTeamMemberUp';
        const moveDownAction = actionNames.moveDown || 'moveTeamMemberDown';
        const openTradeAction = actionNames.openTrade || 'openTradeModal';
        const applyKitSwapAction = actionNames.applyKitSwap || 'applyKitSwapRetroactive';
        const unequipItemAction = actionNames.unequipItem || 'unequipItem';

        let html = '<div class="team-reorder-container">';

        player.team.forEach((monster, index) => {
            if (!monster) return;

            const isActive = index === (player.activeIndex ?? 0);
            const alive = isAlive(monster);
            const hpPercent = clampPercent(((monster.hp || 0) / (monster.hpMax || 1)) * 100);

            let equippedItemHtml = `
                <div class="text-small mt-5">
                    🎒 <em>Nenhum item equipado</em>
                </div>
            `;

            if (monster.heldItemId) {
                const itemDef = getItemById(monster.heldItemId);
                if (itemDef) {
                    const atkBonus = itemDef.stats?.atk || 0;
                    const defBonus = itemDef.stats?.def || 0;
                    let statsText = '';
                    if (atkBonus > 0) statsText += `+${atkBonus} ATK `;
                    if (defBonus > 0) statsText += `+${defBonus} DEF`;
                    equippedItemHtml = `
                        <div class="text-small mt-5">
                            🎒 <strong>${itemDef.name}</strong> (${statsText.trim()})
                            <button class="btn btn-xs" onclick="${unequipItemAction}('${player.id}', ${index})">Remover</button>
                        </div>
                    `;
                }
            }

            const readyForSwap = isReadyForKitSwap(monster);
            const kitApplyHtml = readyForSwap
                ? `<div class="mt-5"><button class="kit-apply-cta" onclick="${applyKitSwapAction}('${monster.instanceId}')">🌟 Aplicar habilidade especial</button></div>`
                : '';

            const eligible = isEligibleForBattle(monster, player);
            const eligibilityHtml = renderEligibilityBadgeForTeam(monster, player);
            const ineligibleClass = eligible ? '' : ' team-member-card--ineligible';
            const instanceRef = monster.instanceId || monster.id || '';

            html += `
                <div class="team-member-card ${isActive ? 'team-member-card-active' : 'team-member-card-inactive'}${ineligibleClass}">
                    <span class="team-member-index">${index + 1}.</span>
                    <div class="team-member-info">
                        ${getMonsterVisualHTML(monster, { variant: 'inline', size: 'sm' })}
                        <strong>${safeText(monster.name, 'Unknown')}</strong>
                        <span class="badge badge-${safeText(monster.rarity, 'common')}">${safeText(monster.rarity, 'Comum')}</span>
                        Lv${monster.level || 1}
                        ${eligibilityHtml}
                        ${renderTeamReadinessIndicator(monster)}
                        ${!alive ? '<span class="color-error text-bold"> (Desmaiado)</span>' : ''}
                        <div class="progress-bar h-15 mt-5">
                            <div class="progress-fill hp" style="width: ${hpPercent}%"></div>
                        </div>
                        <small>${monster.hp || 0}/${monster.hpMax || 0} HP</small>
                        ${kitApplyHtml}
                        ${equippedItemHtml}
                    </div>
                    <div class="team-member-buttons">
                        ${index > 0 ? `<button class="btn btn-sm-arrow" onclick="${moveUpAction}('${player.id}', ${index})">▲</button>` : '<span style="height:20px;display:block;"></span>'}
                        ${index < player.team.length - 1 ? `<button class="btn btn-sm-arrow" onclick="${moveDownAction}('${player.id}', ${index})">▼</button>` : ''}
                        ${alive && !isActive ? `<button class="btn btn-xs btn-trade" title="Trocar com outro jogador" onclick="${openTradeAction}('${player.id}', '${instanceRef}')">🔄</button>` : ''}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        html += renderEquipableItems(player);

        return html;
    } catch (error) {
        console.error('Failed to render team reorder list:', error);
        return '<p class="color-error">Error rendering team list</p>';
    }
}

export function renderPlayerTeamSection(player, deps = {}) {
    if (!player) return '';

    const getPlayerBoxSize = deps.getPlayerBoxSize || (() => 0);
    const getActiveQuestsSummary = deps.getActiveQuestsSummary || (() => []);
    const maxTeamSize = deps.maxTeamSize ?? 6;

    const teamCount = player.team?.length || 0;
    const boxCount = getPlayerBoxSize(player.id);
    const playerClass = player.class || player.playerClassId || '';

    const quests = getActiveQuestsSummary(player);
    let questHtml = '';
    if (quests.length > 0) {
        const questItems = quests.map(q => {
            const needed = Number(q.needed) || 0;
            const pct = needed > 0 ? Math.min(100, Math.floor((q.progress / needed) * 100)) : 0;
            return `<div class="mb-5">
                <strong>${q.quest.nome}</strong>: ${q.progress}/${q.needed}
                <div class="progress-bar h-10 mt-3">
                    <div class="progress-fill xp" style="width: ${pct}%"></div>
                </div>
            </div>`;
        }).join('');
        questHtml = `<div class="mt-10"><h4 class="m-0 mb-6">📋 Quests Ativas:</h4>${questItems}</div>`;
    } else {
        questHtml = '<div class="mt-8 opacity-70 text-small">📋 Nenhuma quest ativa.</div>';
    }

    const teamReorderHtml = renderTeamReorderList(player, deps.teamReorderDeps || {});

    return `
        <div class="card group-player-card" data-class="${playerClass}">
            <div class="group-player-header">
                <span class="group-player-name">${player.name}</span>
                <div class="badge badge-${playerClass}" data-class="${playerClass}">${playerClass}</div>
            </div>
            <div class="group-player-stats">
                <span class="group-stat-pill">💰 ${player.money || 0}</span>
                <span class="group-stat-pill">⭐ ${player.afterlifeCurrency || 0}</span>
                <span class="group-stat-pill">🐾 Time: ${teamCount}/${maxTeamSize}</span>
                <span class="group-stat-pill">📦 Box: ${boxCount}</span>
            </div>
            ${questHtml}
            <details class="team-reorder-section">
                <summary style="cursor:pointer;font-weight:700;padding:6px 0;list-style:none;">⚔️ Time (${teamCount})</summary>
                <p class="text-small text-muted mb-10">O primeiro monstrinho vivo começa na batalha. Use as setas para reordenar.</p>
                ${teamReorderHtml}
            </details>
        </div>
    `;
}

if (typeof window !== 'undefined') {
    window.PlayerPanelUI = {
        renderMonsterCard,
        renderTeamReorderList,
        renderPlayerTeamSection
    };
}
