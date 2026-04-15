/**
 * boxSystem.js — Fase U
 *
 * Funções puras do sistema de Caixa (Box/PC) sem dependência de GameState.
 * Cada função recebe os dados necessários como parâmetros.
 */

/** Capacidade máxima total da Caixa compartilhada. */
export const BOX_MAX_TOTAL = 100;

/**
 * Verifica se um monstro pode ser adicionado à Caixa.
 * @param {Array} box - Array atual de slots da Caixa
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canAddToBox(box) {
    if (!Array.isArray(box)) return { ok: false, reason: 'Box inválida' };
    if (box.length >= BOX_MAX_TOTAL) {
        return { ok: false, reason: `Box está cheia (${BOX_MAX_TOTAL}/${BOX_MAX_TOTAL})` };
    }
    return { ok: true };
}

/**
 * Adiciona um monstro à Caixa.
 * Muta o array `box` in-place.
 * @param {Array} box - Array de slots (mutado)
 * @param {string} ownerPlayerId
 * @param {object} monster
 * @returns {{ success: boolean, slotId?: string, message?: string }}
 */
export function addMonsterToBox(box, ownerPlayerId, monster) {
    const check = canAddToBox(box);
    if (!check.ok) {
        return { success: false, message: check.reason };
    }

    const slotId = 'BX_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    box.push({ slotId, ownerPlayerId, monster });
    return { success: true, slotId };
}

/**
 * Remove um slot da Caixa pelo slotId.
 * Muta o array `box` in-place.
 * @param {Array} box
 * @param {string} slotId
 * @returns {{ success: boolean, slot?: object, message?: string }}
 */
export function removeMonsterFromBox(box, slotId) {
    if (!Array.isArray(box)) return { success: false, message: 'Box inválida' };
    const idx = box.findIndex(s => s.slotId === slotId);
    if (idx === -1) return { success: false, message: 'Slot não encontrado' };

    const [slot] = box.splice(idx, 1);
    return { success: true, slot };
}

/**
 * Retorna o número de slots que um jogador possui na Caixa.
 * @param {Array} box
 * @param {string} playerId
 * @returns {number}
 */
export function getBoxUsage(box, playerId) {
    if (!Array.isArray(box)) return 0;
    return box.filter(s => s.ownerPlayerId === playerId).length;
}

/**
 * Move um monstro do time para a Caixa.
 * Muta `player.team` e `box` in-place.
 * @param {object} player - Objeto do jogador (com team e activeIndex)
 * @param {Array} box - Array de slots da Caixa (mutado)
 * @param {number} teamIndex - Índice no time
 * @param {{ firstAliveIndex?: Function }} [opts]
 * @returns {{ success: boolean, message?: string }}
 */
export function moveTeamToBox(player, box, teamIndex, opts = {}) {
    if (!player) return { success: false, message: 'Jogador não encontrado' };
    if (!player.team || teamIndex < 0 || teamIndex >= player.team.length) {
        return { success: false, message: 'Índice de equipe inválido' };
    }

    const monster = player.team[teamIndex];
    if (!monster) return { success: false, message: 'Monstrinho não encontrado' };

    const result = addMonsterToBox(box, player.id, monster);
    if (!result.success) return result;

    // Remove do time
    player.team.splice(teamIndex, 1);

    // Ajusta activeIndex para que permaneça válido após o splice
    if (typeof player.activeIndex === 'number') {
        if (player.activeIndex === teamIndex) {
            const firstAlive = opts.firstAliveIndex ? opts.firstAliveIndex(player.team) : 0;
            player.activeIndex = firstAlive >= 0 ? firstAlive : 0;
        } else if (player.activeIndex > teamIndex) {
            player.activeIndex--;
        }
    }

    return { success: true, message: `${monster.name} enviado para Box` };
}

/**
 * Move um monstro da Caixa para o time do jogador.
 * Muta `player.team` e `box` in-place.
 * @param {object} player - Objeto do jogador (com team)
 * @param {Array} box - Array de slots da Caixa (mutado)
 * @param {string} slotId
 * @param {{ maxTeamSize?: number }} [opts]
 * @returns {{ success: boolean, message?: string }}
 */
export function moveBoxToTeam(player, box, slotId, opts = {}) {
    if (!player) return { success: false, message: 'Jogador não encontrado' };

    const maxTeamSize = opts.maxTeamSize || 6;
    if (player.team && player.team.length >= maxTeamSize) {
        return { success: false, message: `Equipe cheia (${maxTeamSize}/${maxTeamSize})` };
    }

    if (!Array.isArray(box)) return { success: false, message: 'Box inválida' };
    const slotIndex = box.findIndex(s => s.slotId === slotId);
    if (slotIndex === -1) return { success: false, message: 'Slot não encontrado' };

    const slot = box[slotIndex];
    if (slot.ownerPlayerId !== player.id) {
        return { success: false, message: 'Este monstrinho não é seu' };
    }

    if (!player.team) player.team = [];
    player.team.push(slot.monster);
    box.splice(slotIndex, 1);

    return { success: true, message: `${slot.monster.name} retirado da Box` };
}

// Exposição global para uso a partir do escopo inline do index.html
if (typeof window !== 'undefined') {
    window.BoxSystem = {
        BOX_MAX_TOTAL,
        canAddToBox,
        addMonsterToBox,
        removeMonsterFromBox,
        getBoxUsage,
        moveTeamToBox,
        moveBoxToTeam,
    };
}
