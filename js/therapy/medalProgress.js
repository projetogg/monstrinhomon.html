/**
 * MEDAL PROGRESS MODULE (FASE W)
 *
 * Módulo puro: sem acesso a GameState, sem DOM, sem save().
 * Centraliza a lógica de progresso e detecção de medalhas terapêuticas.
 *
 * Funções exportadas:
 *   computeMedalProgress(pm, medals, tiers)  → { pct, label, nextTier }
 *   checkNewMedal(pm, medals, tiers)         → 'bronze' | 'silver' | 'gold' | null
 *
 * Constantes exportadas:
 *   DEFAULT_MEDAL_TIERS  — thresholds canônicos de PM por medalha
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Thresholds canônicos de PM para cada nível de medalha.
 * Espelha GameState.config.medalTiers — usados como fallback quando
 * o config não está disponível.
 */
export const DEFAULT_MEDAL_TIERS = { bronze: 5, silver: 12, gold: 25 };

/**
 * Ordem das medalhas do mais fácil para o mais difícil.
 * Usada para determinar a "próxima" medalha a ser conquistada.
 *
 * Nota: emoji e label são dados de apresentação mas vivem aqui para
 * evitar duplicação entre index.html e testes.
 */
export const MEDAL_TIER_ORDER = [
    { key: 'bronze', label: 'Bronze', emoji: '🥉' },
    { key: 'silver', label: 'Prata',  emoji: '🥈' },
    { key: 'gold',   label: 'Ouro',   emoji: '🥇' },
];

// ─── Funções puras ────────────────────────────────────────────────────────────

/**
 * Calcula o progresso de PM para exibição na barra de progresso.
 *
 * @param {number} pm      - Pontos de medalha acumulados pelo jogador
 * @param {string[]} medals - Medalhas já conquistadas (['bronze', 'silver', ...])
 * @param {object} [tiers]  - Thresholds de PM (default: DEFAULT_MEDAL_TIERS)
 * @returns {{ pct: number, label: string, nextTier: object | null }}
 *   - pct:      percentual de progresso (0–100)
 *   - label:    texto descritivo para exibição
 *   - nextTier: próximo tier a conquistar, ou null se todas conquistadas
 */
export function computeMedalProgress(pm, medals = [], tiers = DEFAULT_MEDAL_TIERS) {
    const orderedTiers = MEDAL_TIER_ORDER.map(t => ({
        ...t,
        threshold: tiers[t.key] ?? DEFAULT_MEDAL_TIERS[t.key],
    }));

    const nextTier = orderedTiers.find(t => !medals.includes(t.key));

    if (!nextTier) {
        return { pct: 100, label: 'Todas conquistadas', nextTier: null };
    }

    const pct = Math.min(100, Math.round((pm / nextTier.threshold) * 100));
    const label = `${pm} / ${nextTier.threshold} PM → ${nextTier.label}`;
    return { pct, label, nextTier };
}

/**
 * Determina se uma nova medalha foi conquistada com base nos PM atuais.
 *
 * Verifica em ordem crescente de dificuldade (bronze → prata → ouro).
 * Retorna a primeira medalha que ainda não foi conquistada e cujo threshold
 * já foi atingido, ou null se nenhuma nova medalha foi conquistada.
 *
 * @param {number} pm      - Pontos de medalha acumulados
 * @param {string[]} medals - Medalhas já conquistadas
 * @param {object} [tiers]  - Thresholds de PM (default: DEFAULT_MEDAL_TIERS)
 * @returns {'bronze' | 'silver' | 'gold' | null}
 */
export function checkNewMedal(pm, medals = [], tiers = DEFAULT_MEDAL_TIERS) {
    const safeTiers = { ...DEFAULT_MEDAL_TIERS, ...tiers };

    if (pm >= safeTiers.gold   && !medals.includes('gold'))   return 'gold';
    if (pm >= safeTiers.silver && !medals.includes('silver')) return 'silver';
    if (pm >= safeTiers.bronze && !medals.includes('bronze')) return 'bronze';
    return null;
}

// ─── Exposição global (compatibilidade com código não-module) ─────────────────
if (typeof window !== 'undefined') {
    window.MedalProgress = { computeMedalProgress, checkNewMedal, DEFAULT_MEDAL_TIERS, MEDAL_TIER_ORDER };
}
