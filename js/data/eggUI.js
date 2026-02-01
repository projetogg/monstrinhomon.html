/**
 * EGG UI INTEGRATION (PR14A + PR14B)
 * 
 * Integração do sistema de ovos com a UI do jogo
 * Adiciona botões "Chocar" para ovos no inventário
 * PR14B: Integra modal de eclosão visual
 */

import { hatchEgg, getEggInfo, isValidEgg } from './eggHatcher.js';
import { showEggHatchModal } from '../ui/eggHatchModal.js';

/**
 * Manipula o clique no botão "Chocar" de um ovo
 * PR14B: Adiciona modal de eclosão antes de mostrar resultado
 * 
 * @param {string} playerId - ID do jogador
 * @param {string} eggItemId - ID do ovo
 * @param {object} gameState - Estado global do jogo
 * @param {Function} saveCallback - Função para salvar o estado
 * @param {Function} updateCallback - Função para atualizar a UI
 * @param {Function} toastCallback - Função para mostrar mensagens
 */
export async function handleHatchEgg(playerId, eggItemId, gameState, saveCallback, updateCallback, toastCallback) {
    try {
        // Chamar função de choque
        const result = hatchEgg(gameState, playerId, eggItemId);
        
        if (result.success) {
            // PR14B: Mostrar modal de eclosão com o monstro nascido
            await showEggHatchModal(result.monster);
            
            // Salvar estado (após modal fechar)
            if (saveCallback) saveCallback();
            
            // Atualizar UI
            if (updateCallback) updateCallback();
            
            // Mostrar mensagem de sucesso (toast menor, modal já mostrou)
            if (toastCallback) {
                toastCallback(`${result.monster.name} adicionado ao seu time! 🎉`);
            }
            
            return true;
        } else {
            // Mostrar mensagem de erro (sem modal)
            if (toastCallback) {
                toastCallback(result.message);
            } else {
                alert(result.message);
            }
            
            return false;
        }
    } catch (error) {
        console.error('[EggUI] Error hatching egg:', error);
        const message = `Erro ao chocar ovo: ${error.message}`;
        if (toastCallback) {
            toastCallback(message);
        } else {
            alert(message);
        }
        return false;
    }
}

/**
 * Renderiza HTML do botão para ovos no inventário
 * 
 * @param {string} playerId - ID do jogador
 * @param {string} eggItemId - ID do ovo
 * @param {number} quantity - Quantidade de ovos
 * @returns {string} HTML do botão
 */
export function renderEggActionButton(playerId, eggItemId, quantity) {
    if (quantity <= 0) {
        return '';
    }
    
    return `
        <button 
            class="btn btn-primary" 
            style="width: 100%; margin-top: 0.5rem;"
            onclick="window.hatchEggUI('${playerId}', '${eggItemId}')"
        >
            🐣 Chocar Ovo
        </button>
    `;
}

/**
 * Inicializa o sistema de UI de ovos
 * Registra funções globais necessárias
 * 
 * @param {object} options - Opções de inicialização
 * @param {object} options.gameState - Estado global do jogo
 * @param {Function} options.saveGame - Função para salvar
 * @param {Function} options.updateViews - Função para atualizar UI
 * @param {Function} options.showToast - Função para mostrar mensagens
 */
export function initEggUI(options) {
    const { gameState, saveGame, updateViews, showToast } = options;
    
    // Registrar função global para hatching
    window.hatchEggUI = function(playerId, eggItemId) {
        handleHatchEgg(
            playerId,
            eggItemId,
            gameState,
            saveGame,
            updateViews,
            showToast
        );
    };
    
    console.log('[EggUI] Egg hatching system initialized');
}

/**
 * Verifica se um item é um ovo e retorna suas informações
 * Helper para UI
 * 
 * @param {string} itemId - ID do item
 * @returns {object|null} Informações do ovo ou null
 */
export function checkIfEgg(itemId) {
    if (!isValidEgg(itemId)) {
        return null;
    }
    
    return getEggInfo(itemId);
}
