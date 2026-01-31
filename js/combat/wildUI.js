/**
 * WILD COMBAT UI - Feedback Visual e DOM
 * 
 * Funções que manipulam DOM, animações e áudio
 * Side effects permitidos: DOM manipulation, audio playback
 */

/**
 * Captura o valor do input de d20
 * 
 * @returns {number|null} Valor do dado (1-20) ou null se inválido
 */
export function getCombatInputRoll() {
    const diceInput = document.getElementById('diceRoll');
    const roll = parseInt(diceInput?.value || '0');
    return (roll >= 1 && roll <= 20) ? roll : null;
}

/**
 * Limpa o input de d20 após uso
 */
export function clearCombatInput() {
    const diceInput = document.getElementById('diceRoll');
    if (diceInput) diceInput.value = '';
}

/**
 * Toca o som apropriado baseado no resultado do ataque
 * 
 * @param {number} d20Roll - Resultado do dado
 * @param {boolean} hit - Se o ataque acertou
 * @param {boolean} isCrit - Se foi crítico (d20=20)
 * @param {object} audio - Objeto Audio com método playSfx
 */
export function playAttackFeedback(d20Roll, hit, isCrit, audio) {
    if (!audio || !audio.playSfx) return;
    
    if (isCrit) {
        audio.playSfx("crit");
    } else if (!hit || d20Roll === 1) {
        audio.playSfx("miss");
    } else {
        audio.playSfx("hit");
    }
}

/**
 * Exibe feedback visual de dano
 * 
 * @param {string} target - ID do elemento alvo ('wildPlayerBox' | 'wildEnemyBox')
 * @param {number} damage - Quantidade de dano
 * @param {boolean} isCrit - Se foi crítico
 * @param {object} uiHelpers - { flashTarget, showFloatingText }
 */
export function showDamageFeedback(target, damage, isCrit, uiHelpers) {
    if (!uiHelpers) return;
    
    setTimeout(() => {
        if (uiHelpers.showFloatingText) {
            uiHelpers.showFloatingText(target, `-${damage}`, isCrit ? 'crit' : 'damage');
        }
        if (uiHelpers.flashTarget) {
            uiHelpers.flashTarget(target, isCrit ? 'crit' : 'hit');
        }
    }, 50);
}

/**
 * Exibe feedback visual de erro/miss
 * 
 * @param {string} target - ID do elemento alvo
 * @param {object} uiHelpers - { flashTarget }
 */
export function showMissFeedback(target, uiHelpers) {
    if (!uiHelpers || !uiHelpers.flashTarget) return;
    
    setTimeout(() => {
        uiHelpers.flashTarget(target, 'fail');
    }, 50);
}

/**
 * Exibe UI de vitória e toca som
 * 
 * @param {object} encounter - Dados do encontro
 * @param {object} audio - Objeto Audio
 */
export function showVictoryUI(encounter, audio) {
    if (!audio || !audio.playSfx) return;
    
    // Idempotência: só toca uma vez
    if (!encounter._winSfxPlayed) {
        audio.playSfx("win");
        encounter._winSfxPlayed = true;
    }
}
