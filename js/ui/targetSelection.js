/**
 * TARGET SELECTION UI STATE (Camada 3)
 * 
 * Módulo simples para gerenciar o estado de seleção de alvo durante batalhas.
 * 
 * Estado interno:
 * - selectingTarget: boolean - Se está em modo de seleção
 * - actionType: "attack" | "skill" | null - Tipo de ação sendo selecionada
 * - selectedSkillId: string | null - ID da skill selecionada (se actionType === "skill")
 * - selectedSkillObject: object | null - Objeto de skill direto (sistema legado SKILL_DEFS)
 * 
 * REGRAS:
 * - Estado é resetado após cada ação
 * - Não permite entrar em modo alvo se não for turno do jogador
 * - Modo alvo é cancelável (botão ou clique fora)
 */

// Estado interno privado
let _state = {
    selectingTarget: false,
    actionType: null,
    selectedSkillId: null,
    selectedSkillObject: null
};

/**
 * Entra em modo de seleção de alvo
 * 
 * @param {string} actionType - "attack" ou "skill"
 * @param {string|null} skillId - ID da skill (obrigatório se actionType === "skill")
 * @param {object|null} skillObject - Objeto de skill direto (sistema legado SKILL_DEFS, opcional)
 * @throws {Error} Se actionType inválido ou skillId não fornecido para skill
 */
export function enterTargetMode(actionType, skillId = null, skillObject = null) {
    if (actionType !== "attack" && actionType !== "skill") {
        throw new Error(`actionType deve ser "attack" ou "skill", recebido: ${actionType}`);
    }
    
    if (actionType === "skill" && !skillId && !skillObject) {
        throw new Error("skillId ou skillObject é obrigatório quando actionType === 'skill'");
    }
    
    _state = {
        selectingTarget: true,
        actionType,
        selectedSkillId: skillId,
        selectedSkillObject: skillObject
    };
}

/**
 * Sai do modo de seleção de alvo (reset completo)
 */
export function exitTargetMode() {
    _state = {
        selectingTarget: false,
        actionType: null,
        selectedSkillId: null,
        selectedSkillObject: null
    };
}

/**
 * Verifica se está em modo de seleção de alvo
 * 
 * @returns {boolean}
 */
export function isInTargetMode() {
    return _state.selectingTarget === true;
}

/**
 * Obtém o tipo de ação atual
 * 
 * @returns {string|null} "attack", "skill" ou null
 */
export function getActionType() {
    return _state.actionType;
}

/**
 * Obtém o ID da skill selecionada (se aplicável)
 * 
 * @returns {string|null}
 */
export function getSelectedSkillId() {
    return _state.selectedSkillId;
}

/**
 * Obtém o objeto de skill direto (sistema legado SKILL_DEFS), se disponível.
 * Retorna null se foi usado ID canônico.
 * 
 * @returns {object|null}
 */
export function getSelectedSkillObject() {
    return _state.selectedSkillObject;
}

/**
 * Obtém estado completo (para debug/testes)
 * 
 * @returns {Object} Clone do estado interno
 */
export function getState() {
    return { ..._state };
}

/**
 * Reset forçado do estado (para testes)
 * @private
 */
export function _resetForTesting() {
    _state = {
        selectingTarget: false,
        actionType: null,
        selectedSkillId: null,
        selectedSkillObject: null
    };
}
