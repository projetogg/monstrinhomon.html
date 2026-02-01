/**
 * EGG HATCH MODAL (PR14B)
 * 
 * Modal visual de eclosão de ovo com feedback emocional.
 * Não altera nenhuma mecânica - apenas mostra melhor o que já acontece.
 * 
 * ESTADOS:
 * 1. Incubação (300-500ms): "🥚 Ovo chocando..."
 * 2. Nascimento: Exibe dados do Monstrinho nascido
 * 
 * Funções exportadas:
 * - showEggHatchModal(monster): Mostra modal completo (incubação + resultado)
 */

/**
 * Cria o elemento do modal no DOM (se não existir)
 * @returns {HTMLElement} Elemento do modal
 */
function getOrCreateModalElement() {
    let modal = document.getElementById('eggHatchModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'eggHatchModal';
        modal.className = 'modal-overlay-fixed';
        modal.style.display = 'none';
        
        // Conteúdo do modal
        modal.innerHTML = `
            <div class="modal-content-card egg-hatch-modal">
                <div id="eggHatchContent"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    return modal;
}

/**
 * Mostra estado de incubação (Stage 1)
 * @param {HTMLElement} modal - Elemento do modal
 */
function showIncubationState(modal) {
    const content = modal.querySelector('#eggHatchContent');
    
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; margin-bottom: 15px;">🥚</div>
            <h2 style="color: var(--primary); margin-bottom: 10px;">Ovo chocando…</h2>
            <p style="color: #666; font-size: 16px;">Algo se mexe dentro do ovo</p>
            <div style="margin-top: 20px; font-size: 30px;">⏳</div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

/**
 * Mostra resultado do nascimento (Stage 2)
 * @param {HTMLElement} modal - Elemento do modal
 * @param {Object} monster - Dados do Monstrinho nascido
 */
function showBirthResult(modal, monster) {
    const content = modal.querySelector('#eggHatchContent');
    
    // Mapear raridade para emoji
    const rarityEmoji = {
        'Comum': '🟢',
        'Incomum': '🔵',
        'Raro': '🟣',
        'Místico': '🟡',
        'Lendário': '🔴'
    };
    
    const rarityColor = {
        'Comum': '#4CAF50',
        'Incomum': '#2196F3',
        'Raro': '#9C27B0',
        'Místico': '#FFC107',
        'Lendário': '#F44336'
    };
    
    const emoji = rarityEmoji[monster.rarity] || '⚪';
    const color = rarityColor[monster.rarity] || '#808080';
    
    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
            <h2 style="color: var(--success); margin-bottom: 20px;">Um Monstrinhomon nasceu!</h2>
            
            <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); 
                        border-radius: 15px; 
                        padding: 20px; 
                        margin: 20px 0;
                        border: 3px solid ${color};">
                <div style="font-size: 40px; margin-bottom: 10px;">${monster.emoji || '❓'}</div>
                <div style="font-size: 24px; font-weight: bold; color: var(--dark); margin-bottom: 10px;">
                    ${monster.name}
                </div>
                <div style="font-size: 16px; color: #666; margin-bottom: 5px;">
                    <strong>Classe:</strong> ${monster.class}
                </div>
                <div style="font-size: 16px; color: ${color}; font-weight: bold;">
                    <strong>Raridade:</strong> ${emoji} ${monster.rarity}
                </div>
                <div style="font-size: 14px; color: #888; margin-top: 10px;">
                    Nível ${monster.level} • HP: ${monster.hp}/${monster.hpMax}
                </div>
            </div>
            
            <button 
                class="btn btn-success btn-large" 
                onclick="window.closeEggHatchModal()"
                style="width: 100%; margin-top: 10px;">
                ✨ Confirmar
            </button>
        </div>
    `;
    
    // Tocar som de nascimento (se disponível)
    playHatchSound();
}

/**
 * Toca som de nascimento
 * Usa sistema de áudio existente se disponível
 */
function playHatchSound() {
    try {
        // Verificar se existe arquivo de som
        const audio = new Audio('audio/egg_hatch.wav');
        audio.volume = 0.5; // Volume moderado
        
        audio.play().catch(err => {
            // Ignorar erro se som não disponível ou autoplay bloqueado
            console.log('[EggHatchModal] Could not play hatch sound:', err.message);
        });
    } catch (error) {
        // Ignorar erro silenciosamente - som é opcional
        console.log('[EggHatchModal] Hatch sound not available');
    }
}

/**
 * Fecha o modal
 */
function closeModal() {
    const modal = document.getElementById('eggHatchModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Mostra modal completo de eclosão de ovo
 * Sequência: Incubação (400ms) → Nascimento
 * 
 * @param {Object} monster - Dados do Monstrinho nascido
 * @returns {Promise} Promise que resolve quando modal é fechado
 */
export function showEggHatchModal(monster) {
    return new Promise((resolve) => {
        // Criar/obter modal
        const modal = getOrCreateModalElement();
        
        // Registrar função global de fechar
        window.closeEggHatchModal = () => {
            closeModal();
            resolve();
        };
        
        // Stage 1: Incubação
        showIncubationState(modal);
        
        // Stage 2: Após 400ms, mostrar resultado
        setTimeout(() => {
            showBirthResult(modal, monster);
        }, 400);
    });
}

/**
 * Inicializa o sistema de modal de ovos
 * Registra event listeners e funções globais
 */
export function initEggHatchModal() {
    console.log('[EggHatchModal] Egg hatch modal system initialized');
}
