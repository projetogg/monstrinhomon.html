/**
 * BATTLE SWAP — Funções puras de categorização e elegibilidade de troca em batalha
 *
 * Módulo canônico para decidir quem pode entrar em batalha, quem não pode, e por quê.
 * Não acessa DOM nem GameState. Recebe dados por parâmetro.
 *
 * Regra oficial (GAME_RULES.md):
 *   — BATALHA: o jogador só pode USAR em combate Monstrinhos da MESMA classe do jogador.
 *   — Exceção: masterMode libera restrição de classe.
 *   — Monstrinho desmaiado (hp <= 0) não pode entrar independentemente da classe.
 *
 * Categorias de um monstrinho no contexto de troca:
 *   'active'        — é o monstrinho ativo atual (não pode ser trocado para si mesmo)
 *   'eligible'      — vivo + mesma classe (ou masterMode) → pode entrar
 *   'blocked_ko'    — desmaiado (hp <= 0)
 *   'blocked_class' — vivo mas de classe diferente (sem masterMode)
 */

/**
 * Verifica se um monstrinho está vivo (hp > 0).
 * @param {object} mon
 * @returns {boolean}
 */
function _isAlive(mon) {
    return mon != null && (Number(mon.hp) || 0) > 0;
}

/**
 * Categoriza cada monstrinho do time de um jogador para o contexto de troca em batalha.
 *
 * @param {object} player  - { team: [], activeIndex: number, class: string }
 * @param {object} [config] - { masterMode?: boolean }
 * @returns {Array<{monster: object, index: number, category: string, reason: string}>}
 */
export function categorizeBattleTeam(player, config = {}) {
    if (!player || !Array.isArray(player.team)) return [];

    const activeIdx = typeof player.activeIndex === 'number' ? player.activeIndex : 0;
    const playerClass = player.class || '';
    const masterMode = Boolean(config?.masterMode);

    return player.team.map((mon, idx) => {
        if (!mon) return null;

        if (idx === activeIdx) {
            return { monster: mon, index: idx, category: 'active', reason: 'Em batalha agora' };
        }

        if (!_isAlive(mon)) {
            return { monster: mon, index: idx, category: 'blocked_ko', reason: 'Desmaiado' };
        }

        if (!masterMode && mon.class !== playerClass) {
            const monClass = mon.class || '?';
            return {
                monster: mon,
                index: idx,
                category: 'blocked_class',
                reason: `Fora da classe (${monClass} ≠ ${playerClass})`,
            };
        }

        return { monster: mon, index: idx, category: 'eligible', reason: 'Elegível' };
    }).filter(Boolean);
}

/**
 * Retorna label curto e legível para o jogador dado uma categoria de troca.
 *
 * @param {string} category - 'active'|'eligible'|'blocked_ko'|'blocked_class'
 * @param {string} [reason] - motivo detalhado (opcional, para fallback)
 * @returns {string}
 */
export function getSwapStatus(category, reason) {
    switch (category) {
        case 'active':        return '▶ Em batalha';
        case 'eligible':      return '✅ Elegível';
        case 'blocked_ko':    return '💀 Desmaiado';
        case 'blocked_class': return '⛔ Fora da classe';
        default:              return reason || '—';
    }
}

/**
 * Verifica se o jogador tem pelo menos um monstrinho elegível para substituição
 * (vivo, mesma classe ou masterMode, diferente do ativo).
 *
 * @param {object} player
 * @param {object} [config]
 * @returns {boolean}
 */
export function hasEligibleSwap(player, config = {}) {
    const entries = categorizeBattleTeam(player, config);
    return entries.some(e => e.category === 'eligible');
}

/**
 * Verifica se o jogador pode fazer troca MANUAL neste momento.
 * A troca manual exige:
 *   — pelo menos 1 monstrinho elegível
 *   — monstrinho ativo deve estar vivo (troca manual ≠ substituição forçada após KO)
 *
 * @param {object} player
 * @param {object} [config]
 * @returns {boolean}
 */
export function canManualSwap(player, config = {}) {
    if (!player || !Array.isArray(player.team)) return false;
    const activeIdx = typeof player.activeIndex === 'number' ? player.activeIndex : 0;
    const activeMon = player.team[activeIdx];
    if (!_isAlive(activeMon)) return false; // ativo KO → troca forçada, não manual
    return hasEligibleSwap(player, config);
}
