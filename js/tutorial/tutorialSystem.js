/**
 * TUTORIAL SYSTEM MODULE (FASE Y)
 *
 * Módulo puro: sem acesso a GameState, sem DOM, sem save().
 * Contém a lógica canônica do sistema de tutorial.
 *
 * Funções exportadas:
 *   ensureTutorialState(tutState)                   → objeto de estado normalizado
 *   getTutorialStep(tutState, steps)                → step atual ou null
 *   tutorialAllows(tutState, steps, actionKey)      → boolean
 *   advanceTutorial(tutState, steps, type)          → { changed, completed, finished, tutState }
 *   buildTutorialEnemyData(level)                   → objeto de dados do inimigo de treino
 */

// ─── Estado padrão ────────────────────────────────────────────────────────────

/** Estrutura inicial do estado do tutorial */
export const DEFAULT_TUTORIAL_STATE = { active: false, stepIndex: 0, done: {} };

// ─── Funções puras ────────────────────────────────────────────────────────────

/**
 * Normaliza e retorna um objeto de estado de tutorial válido.
 * Não muta GameState — retorna novo objeto seguro para uso pelo chamador.
 *
 * @param {Object|null} tutState - GameState.tutorial (pode ser null/undefined)
 * @returns {{ active: boolean, stepIndex: number, done: Object }}
 */
export function ensureTutorialState(tutState) {
    if (!tutState || typeof tutState !== 'object') {
        return { ...DEFAULT_TUTORIAL_STATE, done: {} };
    }
    return {
        active:    typeof tutState.active === 'boolean' ? tutState.active : false,
        stepIndex: typeof tutState.stepIndex === 'number' ? tutState.stepIndex : 0,
        done:      (tutState.done && typeof tutState.done === 'object') ? tutState.done : {},
    };
}

/**
 * Retorna o step atual do tutorial ou null se não estiver ativo.
 *
 * @param {Object}   tutState - Estado do tutorial (de ensureTutorialState)
 * @param {Array}    steps    - Array de TUTORIAL_STEPS
 * @returns {Object|null}
 */
export function getTutorialStep(tutState, steps) {
    if (!tutState?.active) return null;
    if (!Array.isArray(steps)) return null;
    return steps[tutState.stepIndex] || null;
}

/**
 * Verifica se uma ação específica é permitida no step atual.
 * Retorna true se o tutorial não está ativo.
 *
 * @param {Object}  tutState  - Estado do tutorial
 * @param {Array}   steps     - Array de TUTORIAL_STEPS
 * @param {string}  actionKey - Chave da ação (ex: 'attack', 'skill', 'capture')
 * @returns {boolean}
 */
export function tutorialAllows(tutState, steps, actionKey) {
    const step = getTutorialStep(tutState, steps);
    if (!step) return true; // tutorial inativo → tudo permitido
    const lock = step.lock || {};
    if (typeof lock[actionKey] === 'undefined') return true;
    return !!lock[actionKey];
}

/**
 * Registra uma ação concluída e verifica se o step atual foi completado.
 * Retorna novo estado + metadados — NÃO muta o objeto de entrada.
 *
 * @param {Object} tutState - Estado atual do tutorial
 * @param {Array}  steps    - Array de TUTORIAL_STEPS
 * @param {string} type     - Tipo de ação executada (ex: 'attack', 'skill', 'capture')
 * @returns {{
 *   changed:      boolean,   // true se o state mudou
 *   completed:    boolean,   // true se o step atual foi concluído
 *   finished:     boolean,   // true se era o último step
 *   nextStepIndex: number|null, // índice do próximo step (null se acabou)
 *   tutState:     Object     // novo estado do tutorial
 * }}
 */
export function advanceTutorial(tutState, steps, type) {
    const step = getTutorialStep(tutState, steps);
    if (!step) return { changed: false, completed: false, finished: false, nextStepIndex: null, tutState };

    // Atualiza contador de ações do step atual
    const newDone = { ...tutState.done, [type]: (tutState.done[type] || 0) + 1 };
    const req     = step.required || {};
    const completed = Object.keys(req).every(k => (newDone[k] || 0) >= req[k]);

    if (!completed) {
        // Step em andamento — apenas atualiza done
        return { changed: true, completed: false, finished: false, nextStepIndex: null, tutState: { ...tutState, done: newDone } };
    }

    // Step concluído — verifica se era o último
    const isLast = tutState.stepIndex >= steps.length - 1;
    if (isLast) {
        return {
            changed:       true,
            completed:     true,
            finished:      true,
            nextStepIndex: null,
            tutState:      { ...tutState, done: newDone, active: false },
        };
    }

    // Avança para o próximo step
    const nextIndex = Math.min(steps.length - 1, tutState.stepIndex + 1);
    return {
        changed:       true,
        completed:     true,
        finished:      false,
        nextStepIndex: nextIndex,
        tutState:      { ...tutState, done: {}, stepIndex: nextIndex },
    };
}

/**
 * Retorna os dados base para o inimigo de treino do tutorial (fallback puro).
 * Não depende de GameState nem de templates — usado quando o catálogo não está disponível.
 *
 * @param {number} level - Nível do inimigo de treino
 * @returns {Object}
 */
export function buildTutorialEnemyData(level) {
    const lvl = Math.max(1, Math.floor(Number(level)) || 1);
    return {
        name:    'Treinomon',
        level:   lvl,
        hpMax:   25 + lvl * 5,
        hp:      25 + lvl * 5,
        atk:     4 + lvl,
        def:     3 + lvl,
        spd:     5,
        ene:     0,
        eneMax:  0,
        class:   'Guerreiro',
        rarity:  'Comum',
        emoji:   '🐾',
        poder:   6,
    };
}

// ─── Exposição global (compatibilidade com código não-module) ─────────────────
if (typeof window !== 'undefined') {
    window.TutorialSystem = {
        DEFAULT_TUTORIAL_STATE,
        ensureTutorialState,
        getTutorialStep,
        tutorialAllows,
        advanceTutorial,
        buildTutorialEnemyData,
    };
}
