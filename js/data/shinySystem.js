/**
 * SHINY SYSTEM MODULE (FASE T)
 *
 * Módulo puro: sem acesso a GameState, sem DOM, sem save().
 * Centraliza a lógica de geração de Monstrinhos shiny por raridade.
 *
 * Funções exportadas:
 *   rollShiny(rarity, rng)     → boolean (true = é shiny)
 *   isShinyRoll(chance, rng)   → boolean (primitivo, para testes)
 *
 * Constantes exportadas:
 *   SHINY_CHANCE_BY_RARITY     → object { [rarity]: chance (0–1) }
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Probabilidade de gerar um Monstrinho shiny por raridade.
 * Monstrinhos mais raros têm chance ligeiramente maior.
 */
export const SHINY_CHANCE_BY_RARITY = {
    Comum:    0.010, // 1.0%
    Incomum:  0.012, // 1.2%
    Raro:     0.016, // 1.6%
    Místico:  0.022, // 2.2%
    Lendário: 0.030, // 3.0%
};

/** Chance padrão quando a raridade é desconhecida */
export const SHINY_CHANCE_DEFAULT = 0.010;

// ─── Funções puras ────────────────────────────────────────────────────────────

/**
 * Determina se um Monstrinho é shiny ao ser gerado.
 * Função pura: aceita RNG injetável para facilitar testes.
 *
 * @param {string} rarity - Raridade do monstrinho (ex: 'Comum', 'Raro')
 * @param {function} [rng=Math.random] - Função que retorna número em [0, 1)
 * @returns {boolean} true se o Monstrinho é shiny
 */
export function rollShiny(rarity, rng = Math.random) {
    const chance = SHINY_CHANCE_BY_RARITY[rarity] ?? SHINY_CHANCE_DEFAULT;
    return rng() < chance;
}
