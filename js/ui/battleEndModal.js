/**
 * BATTLE END MODAL (CAMADA 4)
 * 
 * Modal bloqueante que exibe o resultado da batalha e recompensas.
 * Baseado no eggHatchModal - usa Promise para garantir bloqueio correto.
 * 
 * ESTADOS:
 * 1. Victory: "🏁 Vocês venceram juntos!" + recompensas + botão verde
 * 2. Defeat: "A batalha acabou. Vamos tentar de novo?" + botão neutro
 * 3. Retreat: "Vocês recuaram. Sem recompensas ao fugir." + botão neutro
 * 
 * GARANTIAS:
 * - Modal é bloqueante (nada clicável por trás)
 * - Apenas o botão "Continuar" fecha o modal
 * - Promise resolve apenas quando usuário confirma
 * - Travas de interação enquanto modal aberto
 * 
 * API:
 * - showBattleEndModal({ result, participants, rewards }): Promise<void>
 * - closeBattleEndModal(): void (interna, chamada pelo botão)
 */

// Variável global para resolver a Promise do modal
let _modalResolve = null;

/**
 * Cria o elemento do modal no DOM (se não existir)
 * @returns {HTMLElement} Elemento do modal
 */
function getOrCreateModalElement() {
    let modal = document.getElementById('battleEndModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'battleEndModal';
        modal.className = 'modal-overlay-fixed';
        modal.style.display = 'none';
        
        // Prevent clicks from bubbling
        modal.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        document.body.appendChild(modal);
    }
    
    return modal;
}

/**
 * Fecha o modal e resolve a Promise
 */
export function closeBattleEndModal() {
    const modal = document.getElementById('battleEndModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Resolve a Promise para desbloquear o fluxo
    if (_modalResolve) {
        _modalResolve();
        _modalResolve = null;
    }
}

/**
 * Renderiza conteúdo para VITÓRIA
 */
function renderVictoryContent(participants, rewards) {
    let html = '';
    
    html += '<h2 style="color: #4CAF50; font-size: 28px; margin-bottom: 20px; text-align: center;">🏁 Vocês venceram juntos!</h2>';
    
    html += '<div class="modal-body" style="padding: 20px; background: rgba(76, 175, 80, 0.1); border-radius: 8px;">';
    
    // Recompensas por jogador
    html += '<div style="margin-bottom: 15px;">';
    html += '<h3 style="color: #333; font-size: 18px; margin-bottom: 10px;">💰 Recompensas:</h3>';
    
    for (const participant of participants) {
        const { playerName, xp, money } = participant;
        html += '<div style="padding: 8px; margin: 5px 0; background: white; border-radius: 5px;">';
        html += `<strong>${playerName}:</strong> `;
        html += `<span style="color: #2196F3;">+${xp} XP</span> | `;
        html += `<span style="color: #FFA726;">+${money} moedas</span>`;
        html += '</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    return html;
}

/**
 * Renderiza conteúdo para DERROTA
 */
function renderDefeatContent() {
    let html = '';
    
    html += '<h2 style="color: #666; font-size: 28px; margin-bottom: 20px; text-align: center;">A batalha acabou</h2>';
    
    html += '<div class="modal-body" style="padding: 20px; background: rgba(158, 158, 158, 0.1); border-radius: 8px;">';
    html += '<p style="font-size: 18px; text-align: center; color: #555;">Vamos tentar de novo?</p>';
    html += '</div>';
    
    return html;
}

/**
 * Renderiza conteúdo para RETIRADA
 */
function renderRetreatContent() {
    let html = '';
    
    html += '<h2 style="color: #666; font-size: 28px; margin-bottom: 20px; text-align: center;">Vocês recuaram</h2>';
    
    html += '<div class="modal-body" style="padding: 20px; background: rgba(255, 152, 0, 0.1); border-radius: 8px;">';
    html += '<p style="font-size: 16px; text-align: center; color: #555; margin-bottom: 10px;">A batalha foi interrompida.</p>';
    html += '<p style="font-size: 14px; text-align: center; color: #777; font-style: italic;">⚠️ Sem recompensas ao fugir</p>';
    html += '</div>';
    
    return html;
}

/**
 * Exibe modal de fim de batalha
 * 
 * @param {Object} params - Parâmetros do modal
 * @param {string} params.result - Resultado: "victory", "defeat" ou "retreat"
 * @param {Array<Object>} params.participants - Array de participantes com recompensas
 * @param {Object} params.rewards - Objeto de recompensas (opcional, para compatibilidade)
 * @returns {Promise<void>} Promise que resolve quando modal é fechado
 * 
 * Exemplo de participants:
 * [
 *   { playerName: "João", xp: 30, money: 50 },
 *   { playerName: "Maria", xp: 30, money: 50 }
 * ]
 */
export function showBattleEndModal(params) {
    const { result, participants = [], rewards = {} } = params;
    
    return new Promise((resolve) => {
        // Guardar resolve para ser chamado quando fechar
        _modalResolve = resolve;
        
        const modal = getOrCreateModalElement();
        
        // Montar conteúdo baseado no resultado
        let content = '<div class="modal-content-card" style="max-width: 500px; padding: 30px;">';
        
        if (result === 'victory') {
            content += renderVictoryContent(participants, rewards);
            content += '<button class="btn btn-success btn-large" onclick="window.BattleEndModal.close()" style="width: 100%; margin-top: 20px; font-size: 18px;">✅ Continuar</button>';
        } else if (result === 'defeat') {
            content += renderDefeatContent();
            content += '<button class="btn btn-secondary btn-large" onclick="window.BattleEndModal.close()" style="width: 100%; margin-top: 20px; font-size: 18px;">🔄 Continuar</button>';
        } else if (result === 'retreat') {
            content += renderRetreatContent();
            content += '<button class="btn btn-warning btn-large" onclick="window.BattleEndModal.close()" style="width: 100%; margin-top: 20px; font-size: 18px;">👍 Continuar</button>';
        }
        
        content += '</div>';
        
        modal.innerHTML = content;
        modal.style.display = 'flex';
        
        // Safety timeout (5 minutos)
        setTimeout(() => {
            if (_modalResolve) {
                console.warn('[BattleEndModal] Safety timeout - fechando modal automaticamente');
                closeBattleEndModal();
            }
        }, 5 * 60 * 1000);
    });
}

/**
 * Verifica se o modal está aberto
 * @returns {boolean}
 */
export function isModalOpen() {
    const modal = document.getElementById('battleEndModal');
    return modal && modal.style.display !== 'none';
}

// Exportar objeto para window (compatibilidade com onclick)
if (typeof window !== 'undefined') {
    window.BattleEndModal = {
        show: showBattleEndModal,
        close: closeBattleEndModal,
        isOpen: isModalOpen
    };
}
