/**
 * BATTLE SWAP (Fase 20)
 *
 * Funções puras para categorizar e validar trocas de monstrinhos em batalha.
 *
 * REGRA (GAME_RULES.md):
 *   Em batalha, o jogador só pode usar monstrinhos da MESMA CLASSE do jogador.
 *   Exceção: config.masterMode desativa a restrição.
 *
 * Cada membro da equipe recebe uma categoria:
 *   - 'active'         → monstrinho ativo no momento
 *   - 'eligible'       → pode entrar (vivo, mesma classe, não é o ativo)
 *   - 'blocked_class'  → fora da classe do jogador (vivo, mas inelegível por regra)
 *   - 'blocked_ko'     → desmaiado (HP ≤ 0)
 *
 * Estas funções são usadas pelos modais de troca forçada (KO) e troca manual
 * para garantir vocabulário e lógica coerentes com a Fase 19 (classEligibility.js).
 */

/**
 * Categoriza todos os membros da equipe de um jogador para exibição no modal de troca.
 *
 * PURE: sem side effects. Não acessa DOM nem GameState.
 *
 * @param {object} player  - Jogador com { team, activeIndex, class }
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {{
 *   active:        Array<{ monster: object, index: number }>,
 *   eligible:      Array<{ monster: object, index: number }>,
 *   blocked_class: Array<{ monster: object, index: number }>,
 *   blocked_ko:    Array<{ monster: object, index: number }>
 * }}
 */
export function categorizeBattleTeam(player, config = {}) {
    const result = {
        active: [],
        eligible: [],
        blocked_class: [],
        blocked_ko: []
    };

    if (!player || !Array.isArray(player.team)) return result;

    const activeIdx = typeof player.activeIndex === 'number' ? player.activeIndex : 0;
    const playerClass = player.class || '';
    const masterMode = config?.masterMode || false;

    player.team.forEach((mon, idx) => {
        if (!mon) return;

        const hp = Number(mon.hp) || 0;
        const isAlive = hp > 0;
        const isActive = idx === activeIdx;

        if (isActive) {
            result.active.push({ monster: mon, index: idx });
            return;
        }

        if (!isAlive) {
            result.blocked_ko.push({ monster: mon, index: idx });
            return;
        }

        // Vivo e não-ativo: verificar elegibilidade por classe
        const monClass = mon.class || '';
        if (!masterMode && playerClass && monClass !== playerClass) {
            result.blocked_class.push({ monster: mon, index: idx });
            return;
        }

        result.eligible.push({ monster: mon, index: idx });
    });

    return result;
}

/**
 * Verifica se o jogador tem pelo menos um substituto elegível disponível.
 *
 * PURE: sem side effects.
 *
 * @param {object} player   - Jogador com { team, activeIndex, class }
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {boolean}
 */
export function hasEligibleSwap(player, config = {}) {
    return categorizeBattleTeam(player, config).eligible.length > 0;
}

/**
 * Retorna o motivo de bloqueio de um monstrinho para exibição na UI.
 *
 * @param {object} monster  - Monstrinho da equipe
 * @param {number} index    - Índice na equipe
 * @param {object} player   - Jogador com { activeIndex, class }
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {{ category: string, label: string, title: string }}
 */
export function getSwapStatus(monster, index, player, config = {}) {
    if (!monster || !player) {
        return { category: 'blocked_ko', label: '💀 Indisponível', title: 'Dados inválidos' };
    }

    const activeIdx = typeof player.activeIndex === 'number' ? player.activeIndex : 0;
    const hp = Number(monster.hp) || 0;
    const isAlive = hp > 0;
    const masterMode = config?.masterMode || false;

    if (index === activeIdx) {
        return { category: 'active', label: '▶ Ativo', title: 'Este monstrinho está em campo agora' };
    }

    if (!isAlive) {
        return { category: 'blocked_ko', label: '💀 Derrotado', title: 'HP zerado — não pode entrar em campo' };
    }

    const playerClass = player.class || '';
    const monClass = monster.class || '';

    if (masterMode) {
        return { category: 'eligible', label: '✔ Elegível', title: 'Modo Mestre: restrição de classe desativada' };
    }

    if (!playerClass) {
        return { category: 'blocked_class', label: '✖ Jogador sem classe', title: 'Jogador não tem classe definida' };
    }

    if (!monClass) {
        return { category: 'blocked_class', label: '✖ Sem classe', title: 'Monstrinho não tem classe definida' };
    }

    if (monClass !== playerClass) {
        return {
            category: 'blocked_class',
            label: '✖ Fora da classe',
            title: `Classe ${monClass} — este treinador é da classe ${playerClass}. Troque com outro jogador!`
        };
    }

    return {
        category: 'eligible',
        label: '✔ Pode entrar',
        title: `Classe ${monClass} — pode batalhar com este treinador`
    };
}

/**
 * Verifica se uma troca manual é permitida no momento.
 * A troca manual é permitida quando:
 *   - O monstrinho ativo está vivo (troca voluntária durante o turno)
 *   - E há pelo menos um substituto elegível
 *
 * PURE: sem side effects.
 *
 * @param {object} player   - Jogador com { team, activeIndex, class }
 * @param {object} [config] - Opções { masterMode?: boolean }
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canManualSwap(player, config = {}) {
    if (!player || !Array.isArray(player.team)) {
        return { allowed: false, reason: 'Jogador sem equipe' };
    }

    const activeIdx = typeof player.activeIndex === 'number' ? player.activeIndex : 0;
    const activeMon = player.team[activeIdx];
    const activeHp = Number(activeMon?.hp) || 0;

    if (activeHp <= 0) {
        return { allowed: false, reason: 'Ativo já está derrotado — use a troca forçada' };
    }

    const hasSwap = hasEligibleSwap(player, config);
    if (!hasSwap) {
        return { allowed: false, reason: 'Nenhum substituto elegível disponível' };
    }

    return { allowed: true };
}
