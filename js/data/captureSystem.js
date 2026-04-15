/**
 * CAPTURE SYSTEM — Lógica Determinística de Captura (FASE V)
 *
 * Módulo puro: sem acesso a GameState, sem DOM, sem side effects.
 * Implementa a regra canônica de captura por HP% e raridade.
 *
 * GAME_RULES §1 (CAPTURE_BASE):
 *   Captura é DETERMINÍSTICA — sem rolagem de dado.
 *   Critério: HP% <= Threshold_final
 *   Threshold_final = min(0.95, BASE_por_raridade + orbBonus + hpBonus)
 *
 * Funções exportadas:
 *   CAPTURE_BASE                        — thresholds canônicos por raridade
 *   CLASTERORBS                         — definição canônica das orbs de captura
 *   canCapture(monster)                 — valida pré-condições
 *   calculateCaptureThreshold(...)      — calcula threshold final
 *   wouldCaptureSucceed(monster, ...)   — resultado determinístico completo
 */

// ─── Thresholds base por raridade ─────────────────────────────────────────────

/**
 * Thresholds canônicos de HP% para captura por raridade (CAPTURE_BASE).
 * Alinhados com GAME_RULES.md e GameState.config.captureThreshold.
 */
export const CAPTURE_BASE = {
    'Comum':    0.60,   // 60% HP — acessível para iniciantes
    'Incomum':  0.45,   // 45% HP
    'Raro':     0.30,   // 30% HP — requer enfraquecimento
    'Místico':  0.18,   // 18% HP — desafiador
    'Lendário': 0.10,   // 10% HP — muito difícil
};

// Fallback quando raridade não está na tabela (usa Comum como padrão)
const CAPTURE_BASE_DEFAULT = CAPTURE_BASE['Comum'];

// Limite máximo do threshold final
const CAPTURE_MAX = 0.95;

// HP% abaixo do qual se aplica bônus de HP baixo
const LOW_HP_BOUNDARY = 0.25;
const LOW_HP_BONUS    = 0.10;

// ─── ClasterOrbs ──────────────────────────────────────────────────────────────

/**
 * Definição canônica das ClasterOrbs de captura.
 * Fonte única de verdade — elimina duplicata inline em index.html.
 */
export const CLASTERORBS = {
    'CLASTERORB_COMUM':   { id: 'CLASTERORB_COMUM',   name: 'ClasterOrb Comum',   type: 'CAPTURE', capture_bonus_pp: 0,  emoji: '⚪' },
    'CLASTERORB_INCOMUM': { id: 'CLASTERORB_INCOMUM', name: 'ClasterOrb Incomum', type: 'CAPTURE', capture_bonus_pp: 10, emoji: '🔵' },
    'CLASTERORB_RARA':    { id: 'CLASTERORB_RARA',    name: 'ClasterOrb Rara',    type: 'CAPTURE', capture_bonus_pp: 20, emoji: '🟣' },
};

// ─── canCapture ───────────────────────────────────────────────────────────────

/**
 * Valida se as pré-condições para tentar captura estão satisfeitas.
 *
 * PURE: não acessa GameState nem DOM.
 *
 * @param {object} monster - Instância do monstro selvagem
 * @returns {{ ok: boolean, reason?: string }}
 */
export function canCapture(monster) {
    if (!monster || typeof monster !== 'object') {
        return { ok: false, reason: 'INVALID_MONSTER' };
    }
    if (monster.hp <= 0) {
        return { ok: false, reason: 'MONSTER_KO' };
    }
    if (monster.isBoss || monster.noFlee) {
        return { ok: false, reason: 'BOSS_IMMUNE' };
    }
    if (monster.isTrainer) {
        return { ok: false, reason: 'TRAINER_IMMUNE' };
    }
    return { ok: true };
}

// ─── calculateCaptureThreshold ────────────────────────────────────────────────

/**
 * Calcula o threshold final de captura (fórmula HP%-based).
 *
 * Threshold_final = min(0.95, BASE + orbBonus + hpBonus)
 *   onde hpBonus = +0.10 se hpPct <= 0.25
 *
 * @param {string} rarity      - Raridade do monstro ('Comum', 'Incomum', 'Raro', 'Místico', 'Lendário')
 * @param {number} hpPct       - HP atual como fração (0.0 a 1.0)
 * @param {number} orbBonusPp  - Bônus da ClasterOrb em pontos percentuais (ex: 10 → +0.10)
 * @param {object} [config]    - Opções adicionais
 * @param {object} [config.captureBase] - Override da tabela CAPTURE_BASE por raridade
 * @returns {number} Threshold final no intervalo [0.0, 0.95]
 */
export function calculateCaptureThreshold(rarity, hpPct, orbBonusPp = 0, config = {}) {
    const base     = (config.captureBase ?? CAPTURE_BASE)[rarity] ?? CAPTURE_BASE_DEFAULT;
    const orbBonus = (orbBonusPp || 0) / 100;
    const hpBonus  = hpPct <= LOW_HP_BOUNDARY ? LOW_HP_BONUS : 0;

    return Math.min(CAPTURE_MAX, base + orbBonus + hpBonus);
}

// ─── wouldCaptureSucceed ──────────────────────────────────────────────────────

/**
 * Resultado determinístico de uma tentativa de captura.
 *
 * Captura bem-sucedida quando: hpPct <= threshold
 *
 * @param {object} monster     - Instância do monstro (com .hp, .hpMax, .rarity)
 * @param {number} orbBonusPp  - Bônus da ClasterOrb em pontos percentuais
 * @param {object} [config]    - Passado integralmente a calculateCaptureThreshold
 * @returns {{ success: boolean, threshold: number, hpPct: number }}
 */
export function wouldCaptureSucceed(monster, orbBonusPp = 0, config = {}) {
    const hpMax    = Math.max(1, Number(monster?.hpMax ?? 1));
    const hpPct    = Math.min(1, Math.max(0, Number(monster?.hp ?? 0) / hpMax));
    const rarity   = monster?.rarity ?? 'Comum';
    const threshold = calculateCaptureThreshold(rarity, hpPct, orbBonusPp, config);

    return {
        success: hpPct <= threshold,
        threshold,
        hpPct,
    };
}
