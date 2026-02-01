/**
 * EGG HATCHER MODULE (PR14A)
 * 
 * Sistema de choque de ovos baseado em raridade.
 * 
 * REGRAS:
 * - Cada ovo choca SOMENTE monstros da mesma raridade
 * - Pool é criado dinamicamente do catálogo
 * - Auto-save apenas após sucesso
 * - Validações de segurança (time cheio, pool vazio, qty > 0)
 * 
 * Funções exportadas:
 * - chooseRandom(list, rng): Escolhe elemento aleatório de uma lista
 * - getMonstersByRarity(rarity): Retorna array de templates filtrados por raridade
 * - hatchEgg(state, playerId, eggItemId): Choca um ovo e retorna resultado
 */

import { getMonstersMapSync } from './dataLoader.js';
import { getItemById } from './itemsLoader.js';

/**
 * Escolhe um elemento aleatório de uma lista
 * Função pura para facilitar testes
 * 
 * @param {Array} list - Lista de elementos
 * @param {Function} rng - Função random (padrão: Math.random)
 * @returns {*} Elemento escolhido ou null se lista vazia
 */
export function chooseRandom(list, rng = Math.random) {
    if (!Array.isArray(list) || list.length === 0) {
        return null;
    }
    
    const index = Math.floor(rng() * list.length);
    return list[index];
}

/**
 * Retorna array de templates de monstros filtrados por raridade
 * 
 * @param {string} rarity - Raridade desejada (ex: "Comum", "Incomum", "Raro", "Místico", "Lendário")
 * @returns {Array<Object>} Array de templates ou array vazio se não encontrou
 */
export function getMonstersByRarity(rarity) {
    try {
        // Tentar obter do cache JSON-first
        const monstersMap = getMonstersMapSync();
        
        if (!monstersMap || monstersMap.size === 0) {
            console.warn('[EggHatcher] Monsters cache not loaded or empty');
            return [];
        }
        
        // Converter Map para array e filtrar por raridade
        const filtered = [];
        for (const [id, monster] of monstersMap.entries()) {
            if (monster.rarity === rarity) {
                filtered.push(monster);
            }
        }
        
        console.log(`[EggHatcher] Found ${filtered.length} monsters with rarity "${rarity}"`);
        return filtered;
        
    } catch (error) {
        console.error('[EggHatcher] Error getting monsters by rarity:', error);
        return [];
    }
}

/**
 * Cria uma nova instância de Monstrinho a partir de um template
 * 
 * @param {Object} template - Template do monstro
 * @param {number} level - Nível inicial (padrão: 1)
 * @returns {Object} Instância do monstro
 */
function createMonsterInstance(template, level = 1) {
    const instance = {
        id: `mi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        monsterId: template.id,
        name: template.name,
        class: template.class,
        rarity: template.rarity,
        emoji: template.emoji || '❓',
        level: level,
        xp: 0,
        hp: template.baseHp || 30,
        hpMax: template.baseHp || 30,
        atk: template.baseAtk || 5,
        def: template.baseDef || 3,
        spd: template.baseSpd || 5,
        ene: template.baseEne || 6,
        eneMax: template.baseEne || 6,
        heldItemId: null,
        buffs: []
    };
    
    // Campos de evolução (opcionais)
    if (template.evolvesTo) {
        instance.evolvesTo = template.evolvesTo;
    }
    if (template.evolvesAt) {
        instance.evolvesAt = template.evolvesAt;
    }
    
    return instance;
}

/**
 * Choca um ovo do inventário do jogador
 * 
 * @param {Object} state - Estado global do jogo
 * @param {string} playerId - ID do jogador
 * @param {string} eggItemId - ID do item de ovo (ex: "EGG_C")
 * @returns {Object} { success: boolean, message: string, monster?: Object }
 */
export function hatchEgg(state, playerId, eggItemId) {
    try {
        // 1. Validar estado e jogador
        if (!state || !state.players || !Array.isArray(state.players)) {
            return {
                success: false,
                message: 'Estado do jogo inválido.'
            };
        }
        
        const player = state.players.find(p => p.id === playerId);
        if (!player) {
            return {
                success: false,
                message: 'Jogador não encontrado.'
            };
        }
        
        // Garantir estruturas existem
        if (!player.inventory || typeof player.inventory !== 'object') {
            player.inventory = {};
        }
        if (!Array.isArray(player.team)) {
            player.team = [];
        }
        if (!Array.isArray(player.box)) {
            player.box = [];
        }
        
        // 2. Validar que o jogador tem o ovo
        const eggQty = Number(player.inventory[eggItemId]) || 0;
        if (eggQty <= 0) {
            return {
                success: false,
                message: `Você não tem ${eggItemId} no inventário.`
            };
        }
        
        // 3. Buscar definição do item
        const itemDef = getItemById(eggItemId);
        if (!itemDef) {
            return {
                success: false,
                message: 'Item de ovo não encontrado.'
            };
        }
        
        // 4. Validar que é um ovo
        if (itemDef.category !== 'egg') {
            return {
                success: false,
                message: 'Este item não é um ovo.'
            };
        }
        
        // 5. Extrair raridade do efeito
        const hatchEffect = itemDef.effects?.find(e => e.type === 'hatch_egg');
        if (!hatchEffect || !hatchEffect.rarity) {
            return {
                success: false,
                message: 'Ovo não possui efeito de choque válido.'
            };
        }
        
        const targetRarity = hatchEffect.rarity;
        
        // 6. Montar pool de monstros da raridade
        const pool = getMonstersByRarity(targetRarity);
        if (pool.length === 0) {
            return {
                success: false,
                message: `Nenhum Monstrinhomon ${targetRarity} disponível ainda.`
            };
        }
        
        // 7. Validar que o time não está cheio (máximo 6)
        const teamSize = player.team.length;
        const boxSize = player.box.length;
        const totalMonsters = teamSize + boxSize;
        
        const MAX_TEAM_SIZE = 6;
        const MAX_TOTAL_MONSTERS = 100; // limite de segurança para box + team
        
        if (totalMonsters >= MAX_TOTAL_MONSTERS) {
            return {
                success: false,
                message: 'Você atingiu o limite máximo de Monstrinhomons (100). Libere espaço antes de chocar ovos.'
            };
        }
        
        // 8. Escolher template aleatório do pool (uniforme)
        const template = chooseRandom(pool);
        if (!template) {
            return {
                success: false,
                message: 'Erro ao selecionar Monstrinhomon do pool.'
            };
        }
        
        // 9. Criar instância do monstro (nível 1, xp 0, hp cheio)
        const newMonster = createMonsterInstance(template, 1);
        
        // 10. Adicionar ao time (se tiver espaço) ou à box
        if (teamSize < MAX_TEAM_SIZE) {
            player.team.push(newMonster);
        } else {
            player.box.push(newMonster);
        }
        
        // 11. Decrementar ovo do inventário
        player.inventory[eggItemId] = eggQty - 1;
        if (player.inventory[eggItemId] <= 0) {
            delete player.inventory[eggItemId];
        }
        
        // 12. Retornar sucesso (salvamento será feito pelo caller)
        const location = teamSize < MAX_TEAM_SIZE ? 'time' : 'box';
        return {
            success: true,
            message: `🎉 Nasceu: ${newMonster.name} (${newMonster.rarity})! Adicionado ao ${location}.`,
            monster: newMonster
        };
        
    } catch (error) {
        console.error('[EggHatcher] Error hatching egg:', error);
        return {
            success: false,
            message: `Erro ao chocar ovo: ${error.message}`
        };
    }
}

/**
 * Valida se um item é um ovo válido
 * 
 * @param {string} itemId - ID do item
 * @returns {boolean} true se é um ovo válido
 */
export function isValidEgg(itemId) {
    try {
        const itemDef = getItemById(itemId);
        if (!itemDef) return false;
        
        if (itemDef.category !== 'egg') return false;
        
        const hatchEffect = itemDef.effects?.find(e => e.type === 'hatch_egg');
        if (!hatchEffect || !hatchEffect.rarity) return false;
        
        return true;
    } catch (error) {
        console.error('[EggHatcher] Error validating egg:', error);
        return false;
    }
}

/**
 * Retorna informações sobre um ovo
 * 
 * @param {string} itemId - ID do item de ovo
 * @returns {Object|null} { name, rarity, description } ou null se não for ovo
 */
export function getEggInfo(itemId) {
    try {
        const itemDef = getItemById(itemId);
        if (!itemDef || itemDef.category !== 'egg') {
            return null;
        }
        
        const hatchEffect = itemDef.effects?.find(e => e.type === 'hatch_egg');
        if (!hatchEffect) {
            return null;
        }
        
        return {
            id: itemDef.id,
            name: itemDef.name,
            rarity: hatchEffect.rarity,
            description: itemDef.description,
            price: itemDef.price
        };
    } catch (error) {
        console.error('[EggHatcher] Error getting egg info:', error);
        return null;
    }
}
