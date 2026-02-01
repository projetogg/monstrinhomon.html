/**
 * ITEM BREAKAGE MODULE - PR11B
 * 
 * Sistema anti-frustração de quebra de itens equipados.
 * 
 * REGRAS OFICIAIS:
 * 1. Item só quebra se o monstro participou da batalha
 * 2. Participação = entrou em campo OU agiu OU causou/recebeu dano
 * 3. Flag temporária: participatedThisBattle (não salvar em storage)
 * 4. Quebra acontece no FINAL da batalha (victory/defeat/flee)
 * 5. Itens místicos/lendários nunca quebram (break.enabled = false)
 */

import { getItemById } from '../data/itemsLoader.js';

/**
 * Inicializa flags de participação no início da batalha
 * Reseta participatedThisBattle = false para todos os monstros envolvidos
 * 
 * @param {Array} monsters - Array de monstros (player team + enemies se aplicável)
 */
export function initializeBattleParticipation(monsters) {
    if (!Array.isArray(monsters)) return;
    
    for (const mon of monsters) {
        if (mon && typeof mon === 'object') {
            mon.participatedThisBattle = false;
        }
    }
}

/**
 * Marca um monstro como participante da batalha
 * Deve ser chamado quando:
 * - Monstro entra em campo como ativo
 * - Monstro executa qualquer ação (ataque, skill, passar turno)
 * - Monstro causa dano
 * - Monstro recebe dano
 * 
 * @param {object} monster - Monstrinho
 */
export function markAsParticipated(monster) {
    if (!monster || typeof monster !== 'object') return;
    monster.participatedThisBattle = true;
}

/**
 * Verifica se um monstro participou da batalha
 * @param {object} monster - Monstrinho
 * @returns {boolean} true se participou
 */
export function hasParticipated(monster) {
    if (!monster || typeof monster !== 'object') return false;
    return monster.participatedThisBattle === true;
}

/**
 * Processa quebra de item equipado após a batalha
 * 
 * LÓGICA OFICIAL:
 * 1. Se item não existe ou não está equipado → retorna sem fazer nada
 * 2. Se monstro não participou → retorna sem fazer nada
 * 3. Se item tem break.enabled = false → retorna sem fazer nada
 * 4. Rola Math.random() contra break.chance
 * 5. Se quebrou: remove item do slot, retorna info
 * 
 * @param {object} monster - Monstrinho com possível heldItemId
 * @param {object} options - { log: function, notify: function }
 * @returns {object} { broke: boolean, itemName: string|null }
 */
export function handleHeldItemBreak(monster, options = {}) {
    const result = { broke: false, itemName: null };
    
    // 1. Validações básicas
    if (!monster || typeof monster !== 'object') {
        return result;
    }
    
    if (!monster.heldItemId) {
        return result; // Nenhum item equipado
    }
    
    // 2. Verificar participação (REGRA CHAVE)
    if (!hasParticipated(monster)) {
        return result; // Não participou = não quebra
    }
    
    // 3. Buscar definição do item
    const itemDef = getItemById(monster.heldItemId);
    if (!itemDef) {
        console.warn('[ItemBreakage] Item não encontrado:', monster.heldItemId);
        return result;
    }
    
    // 4. Verificar se item pode quebrar
    if (!itemDef.break || !itemDef.break.enabled) {
        return result; // Item indestrutível (místico/lendário)
    }
    
    // 5. Rolar quebra
    const roll = Math.random();
    if (roll < itemDef.break.chance) {
        // QUEBROU!
        result.broke = true;
        result.itemName = itemDef.name;
        
        // Remover item do slot (NÃO retorna ao inventário)
        monster.heldItemId = null;
        
        // Logging
        if (options.log && typeof options.log === 'function') {
            options.log(`💔 ${itemDef.name} quebrou após a batalha!`);
        }
        
        // Notificação
        if (options.notify && typeof options.notify === 'function') {
            options.notify(monster, itemDef);
        }
        
        console.log(`[ItemBreakage] ${monster.name}'s ${itemDef.name} broke (roll=${roll.toFixed(3)}, chance=${itemDef.break.chance})`);
    }
    
    return result;
}

/**
 * Processa quebra de itens para todos os monstros após a batalha
 * Deve ser chamado UMA VEZ no final da batalha (victory/defeat/flee)
 * 
 * @param {Array} monsters - Array de monstros do jogador
 * @param {object} options - { log: function, notify: function }
 * @returns {Array} Array de resultados de quebra
 */
export function processBattleItemBreakage(monsters, options = {}) {
    if (!Array.isArray(monsters)) return [];
    
    const results = [];
    for (const monster of monsters) {
        const result = handleHeldItemBreak(monster, options);
        if (result.broke) {
            results.push({
                monsterName: monster.name,
                itemName: result.itemName
            });
        }
    }
    
    return results;
}

/**
 * Calcula bônus de stats de item equipado
 * Útil para aplicar modificadores em combate
 * 
 * @param {object} monster - Monstrinho
 * @returns {object} { atk: number, def: number }
 */
export function getHeldItemBonuses(monster) {
    if (!monster || !monster.heldItemId) {
        return { atk: 0, def: 0 };
    }
    
    const itemDef = getItemById(monster.heldItemId);
    if (!itemDef || !itemDef.stats) {
        return { atk: 0, def: 0 };
    }
    
    return {
        atk: Number(itemDef.stats.atk) || 0,
        def: Number(itemDef.stats.def) || 0
    };
}
