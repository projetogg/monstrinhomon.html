/**
 * GROUP COMBAT INTEGRATION LAYER
 *
 * Camada explícita de montagem das deps entre index.html e os módulos de combate.
 * Cada factory recebe os serviços do app como parâmetros e retorna o objeto `deps`
 * no formato exato esperado pelo módulo de destino.
 *
 * ── ANTES ────────────────────────────────────────────────────────────────────
 * index.html definia createGroupCombatDeps() e createGroupRewardsDeps() inline,
 * misturando conhecimento estrutural de DI com o código da página.
 *
 * ── DEPOIS ───────────────────────────────────────────────────────────────────
 * index.html fornece AppServices concretos (GameState, helpers, Audio, etc.).
 * Este módulo sabe montar o objeto `deps` que cada módulo de combate espera.
 *
 * Separação de responsabilidades:
 *   index.html          → fornece AppServices concretos
 *   groupIntegration.js → monta deps no formato correto (este arquivo)
 *   groupActions/UI/Rewards → consomem deps
 */

// ── Tipos de AppServices (JSDoc) ─────────────────────────────────────────────

/**
 * @typedef {Object} GroupCombatHelpers
 * @property {Function} getPlayerById              - (id) → player | null
 * @property {Function} getActiveMonsterOfPlayer   - (player) → monster | null
 * @property {Function} getEnemyByIndex            - (enc, idx) → enemy | null
 * @property {Function} log                        - (enc, msg) → void
 * @property {Function} applyEneRegen              - (mon, enc) → void
 * @property {Function} updateBuffs               - (mon) → void
 * @property {Function} rollD20                   - () → number
 * @property {Function} recordD20Roll             - (enc, name, roll, type) → void
 * @property {Function} getBasicAttackPower       - (cls) → number
 * @property {Function} applyDamage               - (target, dmg) → {oldHp, newHp, fainted}
 * @property {Function} chooseTargetPlayerId       - (enc) → string | null
 * @property {Function} firstAliveIndex           - (team) → number
 * @property {Function} openSwitchMonsterModal    - (player, enc) → void
 * @property {Function} handleVictoryRewards      - (enc) → void
 * @property {Function} getSkillById              - (id) → skill | null
 * @property {Function} getSkillsArray            - (mon) → string[]
 * @property {Function} canUseSkillNow            - (skill, mon) → boolean
 * @property {Function} getItemDef                - (id) → itemDef | null
 * @property {Function} [showToast]              - (msg, type?) → void (opcional, reduz window.showToast)
 */

/**
 * @typedef {Object} GroupCombatAppServices
 * @property {Object}            state    - GameState ({currentEncounter, players, config})
 * @property {Object}            core     - GroupCore (funções puras)
 * @property {Object}            audio    - Audio ({playSfx})
 * @property {Function}          render   - renderEncounter() — repinta o painel
 * @property {Function}          save     - saveToLocalStorage()
 * @property {Object}            uiFns    - {showDamageFeedback, showMissFeedback, playAttackFeedback}
 * @property {GroupCombatHelpers} helpers - Helpers do app
 */

/**
 * Monta `deps` para o pipeline de ações de combate em grupo.
 * Consumido por: groupActions.js (executePlayerAttackGroup, advanceGroupTurn, etc.)
 *
 * @param {GroupCombatAppServices} app
 * @returns {Object} deps no formato de groupActions.js
 */
export function buildGroupCombatDeps(app) {
    return {
        state: app.state,
        core: app.core,
        ui: {
            render: app.render,
            showDamageFeedback: app.uiFns.showDamageFeedback,
            showMissFeedback: app.uiFns.showMissFeedback,
            playAttackFeedback: app.uiFns.playAttackFeedback
        },
        audio: app.audio,
        storage: { save: app.save },
        helpers: app.helpers
    };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GroupRewardsHelpers
 * @property {Function} awardMoney                - (player, amount) → void
 * @property {Function} getDropTableForEncounter  - (type, localId) → string | null
 * @property {Function} generateDrops             - (tableId) → Array
 * @property {Function} addDropsToInventory       - (player, drops) → void
 * @property {Function} formatDropsLog            - (drops) → string[]
 * @property {Function} handlePostEncounterFlow   - (player, enc, capturedId, questDeps) → {log}
 * @property {Function} createQuestDeps           - () → Object
 */

/**
 * @typedef {Object} GroupRewardsAppServices
 * @property {Object}              state          - GameState ({players})
 * @property {GroupRewardsHelpers} rewardHelpers  - Helpers de recompensa do app
 */

/**
 * Monta `deps` para processamento de recompensas de fim de batalha em grupo.
 * Consumido por: groupRewards.js (processGroupVictoryRewards)
 *
 * @param {GroupRewardsAppServices} app
 * @returns {Object} deps no formato de groupRewards.js
 */
export function buildGroupRewardsDeps(app) {
    return {
        state: app.state,
        helpers: app.rewardHelpers
    };
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} GroupUIHelpers
 * @property {Function} renderTutorialBanner      - (enc) → string (HTML)
 * @property {Function} ensureXpFields            - (mon) → void
 * @property {Function} calcXpNeeded              - (level) → number
 * @property {Function} getSkillsArray            - (mon) → string[]
 * @property {Function} getSkillById              - (id) → skill | null
 * @property {Function} formatSkillButtonLabel    - (skill, mon) → string
 * @property {Function} canUseSkillNow            - (skill, mon) → boolean
 * @property {Function} saveToLocalStorage        - () → void
 * @property {Function} maybeToastFromLog         - (enc) → void
 * @property {Function} maybeSfxFromLog           - (enc) → void
 * @property {Function} formatEquippedItemDisplay - (mon) → string
 * @property {Function} getItemDef                - (id) → itemDef | null
 */

/**
 * @typedef {Object} GroupUIRenderAppServices
 * @property {Object}        state               - GameState
 * @property {Object}        core                - GroupCore
 * @property {Function}      showBattleEnd       - showBattleEndModalWrapper(enc, state)
 * @property {Function}      isInTargetMode      - () → boolean
 * @property {Function}      getTargetActionType - () → string | null
 * @property {GroupUIHelpers} uiHelpers          - Helpers de UI do app
 */

/**
 * Monta `deps` para renderização do painel de combate em grupo.
 * Consumido por: groupUI.js (renderGroupEncounterPanel)
 *
 * @param {GroupUIRenderAppServices} app
 * @returns {Object} deps no formato de groupUI.js
 */
export function buildGroupUIRenderDeps(app) {
    return {
        state: app.state,
        core: app.core,
        helpers: {
            ...app.uiHelpers,
            showBattleEndModal: app.showBattleEnd,
            isInTargetMode: app.isInTargetMode,
            getTargetActionType: app.getTargetActionType
        }
    };
}
