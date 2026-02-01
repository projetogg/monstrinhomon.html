/**
 * ITEM UI HELPERS - PR12B
 * 
 * Pure functions for formatting equipped item information in combat UI
 * No side effects - only data transformation
 */

import { getItemById } from '../data/itemsLoader.js';

/**
 * Formata label do item equipado com bônus de stats
 * 
 * @param {object} itemDef - Definição do item de items.json
 * @returns {string} Label formatado (ex: "Amuleto de Força (+2 ATK)")
 */
export function formatItemBonusLabel(itemDef) {
    if (!itemDef || !itemDef.stats) {
        return '';
    }
    
    const bonuses = [];
    
    if (itemDef.stats.atk > 0) {
        bonuses.push(`+${itemDef.stats.atk} ATK`);
    }
    if (itemDef.stats.def > 0) {
        bonuses.push(`+${itemDef.stats.def} DEF`);
    }
    
    if (bonuses.length === 0) {
        return itemDef.name;
    }
    
    return `${itemDef.name} (${bonuses.join(', ')})`;
}

/**
 * Formata informação de chance de quebra
 * Mostra apenas para itens que podem quebrar (break.enabled = true)
 * 
 * @param {object} itemDef - Definição do item de items.json
 * @returns {string} Label de quebra (ex: "Quebra: 15%") ou string vazia
 */
export function formatBreakChanceLabel(itemDef) {
    if (!itemDef || !itemDef.break || !itemDef.break.enabled) {
        return '';
    }
    
    const chancePercent = Math.round(itemDef.break.chance * 100);
    return `Quebra: ${chancePercent}%`;
}

/**
 * Formata informação completa do item equipado
 * Combina nome, bônus e chance de quebra
 * 
 * @param {string} itemId - ID do item equipado
 * @returns {string} Label completo do item ou "Nenhum item equipado"
 */
export function formatEquippedItemInfo(itemId) {
    if (!itemId) {
        return 'Nenhum item equipado';
    }
    
    const itemDef = getItemById(itemId);
    if (!itemDef) {
        return 'Item desconhecido';
    }
    
    const bonusLabel = formatItemBonusLabel(itemDef);
    const breakLabel = formatBreakChanceLabel(itemDef);
    
    if (breakLabel) {
        return `${bonusLabel} | ${breakLabel}`;
    }
    
    return bonusLabel;
}

/**
 * Retorna HTML para exibir item equipado no painel de combate
 * 
 * @param {object} monster - Monstrinho com possível heldItemId
 * @returns {string} HTML formatado
 */
export function renderEquippedItemHTML(monster) {
    if (!monster) {
        return '';
    }
    
    const itemInfo = formatEquippedItemInfo(monster.heldItemId);
    const icon = monster.heldItemId ? '⚔️' : '🔸';
    
    return `<div class="equipped-item-info"><strong>${icon} Item:</strong> ${itemInfo}</div>`;
}

/**
 * Formata mensagem de quebra de item para notificação
 * 
 * @param {string} itemName - Nome do item que quebrou
 * @returns {string} Mensagem formatada (ex: "💥 Amuleto de Força quebrou!")
 */
export function formatBreakNotification(itemName) {
    return `💥 ${itemName} quebrou!`;
}
