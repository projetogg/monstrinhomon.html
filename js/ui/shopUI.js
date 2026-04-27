/**
 * SHOP UI - js/ui/shopUI.js
 *
 * Funções de renderização puras para a loja do Monstrinhomon.
 * Retornam HTML como string — sem manipulação de DOM, sem efeitos colaterais.
 *
 * Exportações:
 *   renderShopItems(items, config)               → string HTML dos itens da loja
 *   renderPlayerInventory(player, items, config) → string HTML do inventário do jogador
 */

import { getSellPrice } from '../shopSystem.js';

// Mapeamento de tier para cor de destaque
const TIER_COLORS = {
    'comum':    '#999',
    'incomum':  '#2ecc71',
    'raro':     '#3498db',
    'mistico':  '#9b59b6',
    'lendario': '#f39c12'
};

// Categorias de itens compráveis (tipo → label de exibição)
const ITEM_CATEGORY_LABELS = {
    'held':    { label: '⚔️ Equipamentos', order: 1 },
    'capture': { label: '🪃 Captura',       order: 2 },
    'heal':    { label: '🍖 Consumíveis',   order: 3 },
    'egg':     { label: '🥚 Ovos',          order: 4 },
    '?':       { label: '📦 Outros',        order: 5 },
};

/**
 * Retorna a cor de destaque do tier de um item.
 * @param {string} tier - Tier do item
 * @returns {string} Cor CSS
 */
function getTierColor(tier) {
    return TIER_COLORS[tier] || '#999';
}

/**
 * Renderiza a lista de itens disponíveis para compra na loja.
 *
 * @param {Array}  items  - Array de definições de itens (todos ou pré-filtrados)
 * @param {object} config - Contexto do jogador: { money, inventory, playerId }
 * @returns {string} HTML como string
 */
export function renderShopItems(items, config = {}) {
    const { money = 0, inventory = {}, playerId = '' } = config;

    if (!Array.isArray(items) || items.length === 0) {
        return '<p>Nenhum item disponível.</p>';
    }

    // Filtra itens que podem ser comprados
    const buyableItems = items.filter(item => item && item.price && typeof item.price.buy === 'number' && item.price.buy > 0);

    if (buyableItems.length === 0) {
        return '<p>Nenhum item disponível para compra.</p>';
    }

    // Agrupa itens por categoria (held, capture, heal, egg, ?)
    const groups = {};
    for (const item of buyableItems) {
        const cat = item.type || item.category || '?';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    }

    // Ordena grupos por ordem de exibição
    const sortedCats = Object.keys(groups).sort((a, b) => {
        const oa = (ITEM_CATEGORY_LABELS[a] || ITEM_CATEGORY_LABELS['?']).order;
        const ob = (ITEM_CATEGORY_LABELS[b] || ITEM_CATEGORY_LABELS['?']).order;
        return oa - ob;
    });

    let html = '';

    for (const cat of sortedCats) {
        const catInfo = ITEM_CATEGORY_LABELS[cat] || ITEM_CATEGORY_LABELS['?'];
        const catItems = [...groups[cat]].sort((a, b) => a.price.buy - b.price.buy);

        html += `<div class="shop-category-section">
            <h4 class="shop-category-title">${catInfo.label}</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem;">`;

        for (const item of catItems) {
            const price     = item.price.buy;
            const canAfford = money >= price;
            const owned     = inventory[item.id] || 0;
            const tierColor = getTierColor(item.tier);
            const isEgg     = item.type === 'egg' || item.category === 'egg';

            const tierBadge = isEgg
                ? '<span class="shop-badge" style="background:#f39c12;">🥚 OVO</span>'
                : item.tier
                    ? `<span class="shop-badge" style="background:${tierColor};">${item.tier.toUpperCase()}</span>`
                    : '';

            const statsBadge = item.stats
                ? `<p class="shop-item-stats">
                    ${item.stats.atk > 0 ? `⚔️ ATK +${item.stats.atk}` : ''}
                    ${item.stats.atk > 0 && item.stats.def > 0 ? ' · ' : ''}
                    ${item.stats.def > 0 ? `🛡️ DEF +${item.stats.def}` : ''}
                   </p>`
                : '';

            const breakBadge = item.break?.enabled
                ? `<p class="shop-item-break">⚠️ Pode quebrar (${Math.round(item.break.chance * 100)}%)</p>`
                : '';

            html += `
                <div class="shop-item-card" style="border-left: 3px solid ${tierColor};">
                    <div class="shop-item-header">
                        <span class="shop-item-name">${item.name}</span>
                        ${tierBadge}
                    </div>
                    <p class="shop-item-desc">${item.description}</p>
                    ${statsBadge}${breakBadge}
                    <div class="shop-item-footer">
                        <span class="shop-item-owned">Você tem: ${owned}×</span>
                        <div class="shop-item-buy">
                            <strong class="shop-item-price">💰 ${price}</strong>
                            <button
                                class="btn btn-sm ${canAfford ? 'btn-success' : 'btn-secondary'}"
                                onclick="buyItem('${playerId}', '${item.id}')"
                                ${!canAfford ? 'disabled' : ''}
                                title="${!canAfford ? 'Ouro insuficiente' : 'Comprar ' + item.name}"
                            >${canAfford ? '+ Comprar' : '✗ Sem ouro'}</button>
                        </div>
                    </div>
                </div>
            `;
        }

        html += '</div></div>';
    }

    return html;
}

/**
 * Renderiza o inventário do jogador para venda.
 *
 * @param {object} player - Objeto do jogador (com inventory, team, id)
 * @param {Array}  items  - Array de definições de todos os itens do catálogo
 * @param {object} config - Opções adicionais (reservado para expansão futura)
 * @returns {string} HTML como string
 */
export function renderPlayerInventory(player, items, config = {}) {
    if (!player) return '<p>Nenhum jogador selecionado.</p>';

    const inventory = player.inventory || {};
    const allItems  = Array.isArray(items) ? items : [];

    const inventoryEntries = Object.entries(inventory).filter(([, qty]) => qty > 0);

    if (inventoryEntries.length === 0) {
        return '<p>Seu inventário está vazio.</p>';
    }

    // Ordena por nome
    inventoryEntries.sort((a, b) => {
        const itemA = allItems.find(i => i.id === a[0]);
        const itemB = allItems.find(i => i.id === b[0]);
        return (itemA?.name || '').localeCompare(itemB?.name || '');
    });

    // Monta set de itens equipados no time
    const equippedItems = new Set();
    if (player.team && Array.isArray(player.team)) {
        player.team.forEach(monster => {
            if (monster?.heldItemId) equippedItems.add(monster.heldItemId);
        });
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">';

    for (const [itemId, qty] of inventoryEntries) {
        const item = allItems.find(i => i.id === itemId);

        if (!item) {
            html += `
                <div class="card" style="margin: 0; padding: 1rem; background: #f8f8f8;">
                    <h4 style="margin-top: 0; color: #999;">Item desconhecido (${itemId})</h4>
                    <p style="font-size: 0.85em; color: #555;"><strong>Quantidade:</strong> ${qty}x</p>
                    <p style="font-size: 0.85em; color: #999;">Este item não está mais no catálogo.</p>
                </div>
            `;
            continue;
        }

        const sellPrice  = getSellPrice(item);
        const isEquipped = equippedItems.has(itemId);
        const canSell    = sellPrice !== null && !isEquipped;
        const isEgg      = item.category === 'egg';
        const tierColor  = getTierColor(item.tier);

        const tierBadge = isEgg
            ? `<p style="font-size: 0.9em; color: ${tierColor}; font-weight: bold;">🥚 OVO</p>`
            : `<p style="font-size: 0.9em; color: #666;">
                <span style="color: ${tierColor}; font-weight: bold; text-transform: uppercase;">${item.tier}</span>
               </p>`;

        const statsBadge = !isEgg && item.stats
            ? `<p style="font-size: 0.85em; color: #555;">
                <strong>Stats:</strong>
                ${item.stats.atk > 0 ? `⚔️ ATK +${item.stats.atk}` : ''}${item.stats.atk > 0 && item.stats.def > 0 ? ' ' : ''}${item.stats.def > 0 ? `🛡️ DEF +${item.stats.def}` : ''}
               </p>`
            : '';

        const equippedWarning = isEquipped
            ? '<p style="font-size: 0.85em; color: #e74c3c;">⚠️ Item equipado em um monstro</p>'
            : '';

        const actionBlock = isEgg
            ? `<button
                   class="btn btn-success"
                   onclick="hatchEggFromInventory('${player.id}', '${itemId}')"
                   style="width: 100%; margin-top: 0.5rem;"
               >
                   🐣 Chocar Ovo
               </button>`
            : `<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                   ${sellPrice !== null
                       ? `<strong style="font-size: 1.1em;">💰 Vender por ${sellPrice}</strong>`
                       : `<span style="font-size: 0.9em; color: #999;">Não vendável</span>`}
                   <button
                       class="btn ${canSell ? 'btn-warning' : 'btn-secondary'}"
                       onclick="sellItem('${player.id}', '${itemId}', 1)"
                       ${!canSell ? 'disabled' : ''}
                       style="${!canSell ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                       title="${isEquipped ? 'Não é possível vender item equipado' : (sellPrice === null ? 'Este item não pode ser vendido' : 'Vender 1x')}"
                   >
                       ${canSell ? `💵 Vender (${sellPrice})` : (isEquipped ? '🔒 Equipado' : '✗ Não vendável')}
                   </button>
               </div>`;

        html += `
            <div class="card" style="margin: 0; padding: 1rem; border-left: 4px solid ${tierColor};">
                <h4 style="margin-top: 0;">${item.name}</h4>
                ${tierBadge}
                <p style="font-size: 0.9em;">${item.description}</p>
                ${statsBadge}
                <p style="font-size: 0.85em; color: #555;"><strong>Você tem:</strong> ${qty}x</p>
                ${equippedWarning}
                ${actionBlock}
            </div>
        `;
    }

    html += '</div>';
    return html;
}
