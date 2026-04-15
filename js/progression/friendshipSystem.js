/**
 * FRIENDSHIP SYSTEM MODULE (FASE R / FASE X)
 *
 * Módulo puro: sem acesso a GameState, sem DOM, sem save().
 * Contém a lógica canônica de amizade entre jogador e monstrinho.
 *
 * Funções exportadas:
 *   getFriendshipLevel(friendship)                         → número de 1 a 5
 *   getFriendshipIcon(friendship)                          → emoji de coração
 *   getFriendshipBonuses(friendship)                       → objeto com bônus
 *   formatFriendshipBonusPercent(multiplier)               → número inteiro (%)
 *   applyFriendshipDelta(friendship, delta)                → número clamped [0,100]
 *   applyFriendshipEvent(monster, eventKey, config, log)   → void (muta monster.friendship)
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Valor padrão de amizade ao criar uma instância de monstrinho */
export const DEFAULT_FRIENDSHIP = 50;

/**
 * Ícones por nível de amizade (índice = nível - 1)
 * Nível 1 = 🖤  …  Nível 5 = ❤️
 */
export const FRIENDSHIP_ICONS = ['🖤', '🤍', '💛', '💚', '❤️'];

/**
 * Thresholds de nível de amizade.
 * Nível é definido pelo MAIOR threshold que a amizade atinge.
 */
export const FRIENDSHIP_THRESHOLDS = [0, 25, 50, 75, 100];

// ─── Funções puras ────────────────────────────────────────────────────────────

/**
 * Retorna o nível de amizade (1–5) para um valor numérico.
 * @param {number} friendship - Valor de amizade (0–100)
 * @returns {number}
 */
export function getFriendshipLevel(friendship) {
    const val = Number(friendship) || 0;
    if (val >= 100) return 5;
    if (val >= 75)  return 4;
    if (val >= 50)  return 3;
    if (val >= 25)  return 2;
    return 1;
}

/**
 * Retorna o emoji representando o nível de amizade.
 * @param {number} friendship - Valor de amizade (0–100)
 * @returns {string}
 */
export function getFriendshipIcon(friendship) {
    const level = getFriendshipLevel(friendship);
    return FRIENDSHIP_ICONS[level - 1];
}

/**
 * Calcula os bônus de combate e progressão baseados no nível de amizade.
 * @param {number} friendship - Valor de amizade (0–100)
 * @returns {{ xpMultiplier: number, critChance: number, statBonus: number, surviveChance: number }}
 */
export function getFriendshipBonuses(friendship) {
    const level = getFriendshipLevel(friendship);
    const bonuses = {
        xpMultiplier:  1.0,
        critChance:    0,
        statBonus:     0,
        surviveChance: 0,
    };

    if (level >= 2) bonuses.xpMultiplier = 1.05;  // +5% XP
    if (level >= 3) bonuses.critChance   = 0.05;  // +5% crítico
    if (level >= 4) {
        bonuses.xpMultiplier = 1.10; // +10% XP (upgrade do nível 2)
        bonuses.statBonus    = 1;    // +1 stats
    }
    // Nível 5: surviveChance reservado para implementação futura
    // if (level >= 5) bonuses.surviveChance = 0.10;

    return bonuses;
}

/**
 * Formata o percentual de bônus de amizade para exibição.
 * @param {number} multiplier - Multiplicador de XP (ex: 1.05)
 * @returns {number} Percentual inteiro (ex: 5)
 */
export function formatFriendshipBonusPercent(multiplier) {
    return Math.round((Number(multiplier) - 1) * 100);
}

/**
 * Aplica uma variação de amizade e retorna o novo valor clamped entre 0 e 100.
 * Função pura: não modifica o objeto monstro.
 * @param {number} current - Valor atual de amizade
 * @param {number} delta   - Variação (positiva ou negativa)
 * @returns {number}
 */
export function applyFriendshipDelta(current, delta) {
    const base = Number(current);
    if (!isFinite(base)) return DEFAULT_FRIENDSHIP;
    return Math.max(0, Math.min(100, base + (Number(delta) || 0)));
}

/**
 * Aplica um evento de amizade a um monstro, atualizando monster.friendship e
 * empurrando mensagens de marco ao array de log fornecido.
 *
 * Substitui a lógica interna de updateFriendship() em index.html.
 * Os efeitos colaterais (GameState, save) ficam a cargo do chamador.
 *
 * @param {Object}        monster   - Instância do monstrinho (mutado em .friendship)
 * @param {string}        eventKey  - Chave do evento (ex: 'win', 'faint')
 * @param {Object|null}   config    - GameState.config.friendshipConfig (mapa evento→delta)
 * @param {Array|null}    log       - Array de log do encontro atual (recebe mensagens de marco)
 */
export function applyFriendshipEvent(monster, eventKey, config, log = null) {
    if (!monster || typeof monster !== 'object') return;

    // Inicializa friendship se ausente
    if (typeof monster.friendship !== 'number') {
        monster.friendship = DEFAULT_FRIENDSHIP;
    }

    if (!config) return; // sem config → sem mudança

    const change = config[eventKey] || 0;
    const oldFriendship = monster.friendship;

    monster.friendship = Math.max(0, Math.min(100, monster.friendship + change));

    // Mensagens de marco (empurradas ao log do encontro se fornecido)
    if (Array.isArray(log)) {
        const label = monster.nickname || monster.name || 'Monstrinho';
        if (monster.friendship === 100 && oldFriendship < 100) {
            log.push(`💖 ${label} atingiu amizade máxima!`);
        } else if (monster.friendship >= 75 && oldFriendship < 75) {
            log.push(`💚 ${label} está muito feliz!`);
        } else if (monster.friendship >= 50 && oldFriendship < 50) {
            log.push(`💛 ${label} está se aproximando de você!`);
        }
    }
}

// ─── Exposição global (compatibilidade com código não-module) ─────────────────
if (typeof window !== 'undefined') {
    window.FriendshipSystem = {
        DEFAULT_FRIENDSHIP, FRIENDSHIP_ICONS, FRIENDSHIP_THRESHOLDS,
        getFriendshipLevel, getFriendshipIcon, getFriendshipBonuses,
        formatFriendshipBonusPercent, applyFriendshipDelta, applyFriendshipEvent,
    };
}
