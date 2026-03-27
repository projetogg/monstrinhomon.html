/**
 * SHOP SYSTEM - js/shopSystem.js
 *
 * Módulo de loja/economia básica do Monstrinhomon.
 * Contém funções puras (sem efeitos colaterais) para validar e executar
 * transações de compra e venda.
 *
 * Todas as funções que modificam estado retornam um NOVO objeto player,
 * nunca mutando o original.
 *
 * Exportações:
 *   getSellPrice(itemDef)                  → number|null
 *   canBuy(player, itemDef, qty)           → { ok, reason }
 *   executeBuy(player, itemDef, qty)       → player atualizado
 *   canSell(player, itemDef, qty)          → { ok, reason }
 *   executeSell(player, itemDef, qty)      → player atualizado
 *   getShopCatalog(allItems)              → itens disponíveis para compra
 *   getSellableInventory(player, allItems) → itens do inventário vendáveis
 */

/**
 * Calcula o preço de venda de um item.
 *
 * Regras:
 * - Se buy não for número ou buy <= 1: retorna null (não vendável)
 * - Se item tiver sell explícito: usa esse valor
 * - Caso contrário: fallback de 50% do buy price (floor)
 * - Garante: sell >= 1
 * - Garante: sell < buy (nunca igual ou maior)
 *
 * @param {object} itemDef - Definição do item
 * @returns {number|null} Preço de venda ou null se não vendável
 */
export function getSellPrice(itemDef) {
    try {
        const buy = itemDef?.price?.buy;

        // Não vendável se sem preço de compra ou buy <= 1
        if (typeof buy !== 'number' || buy <= 1) {
            return null;
        }

        const rawSell = itemDef?.price?.sell;
        let sell = (typeof rawSell === 'number') ? rawSell : Math.floor(buy * 0.5);

        // Mínimo de 1
        sell = Math.max(1, sell);

        // Garantia: sell < buy
        sell = Math.min(sell, buy - 1);

        return sell;

    } catch (_) {
        return null;
    }
}

/**
 * Verifica se um jogador pode comprar qty unidades de um item.
 *
 * @param {object} player  - Objeto do jogador (com money e inventory)
 * @param {object} itemDef - Definição do item (com price.buy)
 * @param {number} qty     - Quantidade a comprar (padrão 1)
 * @returns {{ ok: boolean, reason: string|null }}
 */
export function canBuy(player, itemDef, qty = 1) {
    if (!player) return { ok: false, reason: 'Jogador inválido.' };
    if (!itemDef) return { ok: false, reason: 'Item inválido.' };

    if (!Number.isInteger(qty) || qty < 1) {
        return { ok: false, reason: 'Quantidade inválida.' };
    }

    const buy = itemDef?.price?.buy;
    if (typeof buy !== 'number' || buy <= 0) {
        return { ok: false, reason: 'Item não está disponível para compra.' };
    }

    const totalCost = buy * qty;
    const playerMoney = player.money || 0;

    if (playerMoney < totalCost) {
        return {
            ok: false,
            reason: `Saldo insuficiente. Você tem ${playerMoney} e precisa de ${totalCost}.`
        };
    }

    return { ok: true, reason: null };
}

/**
 * Executa a compra de qty unidades de um item para o jogador.
 * Não valida — use canBuy() antes.
 * Retorna um NOVO objeto player com money e inventory atualizados.
 *
 * @param {object} player  - Objeto do jogador
 * @param {object} itemDef - Definição do item
 * @param {number} qty     - Quantidade a comprar (padrão 1)
 * @returns {object} Novo objeto player atualizado
 */
export function executeBuy(player, itemDef, qty = 1) {
    const totalCost = itemDef.price.buy * qty;

    const newInventory = { ...(player.inventory || {}) };
    newInventory[itemDef.id] = (newInventory[itemDef.id] || 0) + qty;

    return { ...player, money: (player.money || 0) - totalCost, inventory: newInventory };
}

/**
 * Verifica se um jogador pode vender qty unidades de um item.
 *
 * @param {object} player  - Objeto do jogador
 * @param {object} itemDef - Definição do item
 * @param {number} qty     - Quantidade a vender (padrão 1)
 * @returns {{ ok: boolean, reason: string|null }}
 */
export function canSell(player, itemDef, qty = 1) {
    if (!player) return { ok: false, reason: 'Jogador inválido.' };
    if (!itemDef) return { ok: false, reason: 'Item inválido.' };

    if (!Number.isInteger(qty) || qty < 1) {
        return { ok: false, reason: 'Quantidade inválida.' };
    }

    const sellPrice = getSellPrice(itemDef);
    if (sellPrice === null) {
        return { ok: false, reason: 'Este item não pode ser vendido.' };
    }

    const owned = player.inventory?.[itemDef.id] || 0;
    if (owned < qty) {
        return {
            ok: false,
            reason: `Você não tem ${qty}x ${itemDef.name}. Você tem apenas ${owned}x.`
        };
    }

    // Verifica se item está equipado em algum monstro do time
    if (player.team && Array.isArray(player.team)) {
        const equippedMonster = player.team.find(m => m?.equippedItem === itemDef.id);
        if (equippedMonster) {
            return {
                ok: false,
                reason: `Não é possível vender item equipado. ${itemDef.name} está equipado em ${equippedMonster.name}.`
            };
        }
    }

    return { ok: true, reason: null };
}

/**
 * Executa a venda de qty unidades de um item do jogador.
 * Não valida — use canSell() antes.
 * Retorna um NOVO objeto player com money e inventory atualizados.
 *
 * @param {object} player  - Objeto do jogador
 * @param {object} itemDef - Definição do item
 * @param {number} qty     - Quantidade a vender (padrão 1)
 * @returns {object} Novo objeto player atualizado
 */
export function executeSell(player, itemDef, qty = 1) {
    const sellPrice = getSellPrice(itemDef);
    const totalValue = sellPrice * qty;

    const newInventory = { ...(player.inventory || {}) };
    const newQty = (newInventory[itemDef.id] || 0) - qty;

    if (newQty <= 0) {
        delete newInventory[itemDef.id];
    } else {
        newInventory[itemDef.id] = newQty;
    }

    return { ...player, money: (player.money || 0) + totalValue, inventory: newInventory };
}

/**
 * Retorna o catálogo da loja: todos os itens com preço de compra definido.
 *
 * @param {Array} allItems - Array de definições de itens
 * @returns {Array} Itens disponíveis para compra na loja
 */
export function getShopCatalog(allItems) {
    if (!Array.isArray(allItems)) return [];
    return allItems.filter(item =>
        item &&
        item.price &&
        typeof item.price.buy === 'number' &&
        item.price.buy > 0 &&
        !item.deprecated
    );
}

/**
 * Retorna os itens do inventário do jogador que podem ser vendidos.
 * Exclui itens equipados e itens sem preço de venda.
 *
 * @param {object} player   - Objeto do jogador
 * @param {Array}  allItems - Array de definições de itens
 * @returns {Array} Array de { itemDef, qty, sellPrice }
 */
export function getSellableInventory(player, allItems) {
    if (!player || !Array.isArray(allItems)) return [];

    const inventory = player.inventory || {};

    // Monta set de itens equipados no time
    const equippedIds = new Set();
    if (player.team && Array.isArray(player.team)) {
        player.team.forEach(m => {
            if (m?.equippedItem) equippedIds.add(m.equippedItem);
        });
    }

    const result = [];

    for (const [itemId, qty] of Object.entries(inventory)) {
        if (!qty || qty <= 0) continue;
        if (equippedIds.has(itemId)) continue;

        const itemDef = allItems.find(i => i.id === itemId);
        if (!itemDef) continue;

        const sellPrice = getSellPrice(itemDef);
        if (sellPrice === null) continue;

        result.push({ itemDef, qty, sellPrice });
    }

    return result;
}
