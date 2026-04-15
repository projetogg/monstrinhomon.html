/**
 * EVOLUTION SYSTEM — FASE VIII
 *
 * Motor de evolução 100% puro (sem side effects, sem DOM, sem imports).
 * Compatível com o pipeline existente em index.html (maybeEvolveAfterLevelUp).
 *
 * FUNÇÕES EXPORTADAS:
 *   checkEvolution(monster)              → { canEvolve, targetId }
 *   applyEvolution(monster, newTemplate) → void (muta monster in-place)
 *   getEvolutionTarget(monsterId, catalog) → template | null
 *
 * CAMPOS ESPERADOS NO MONSTER:
 *   - level      {number}
 *   - evolvesAt  {number}  — nível mínimo para evoluir
 *   - evolvesTo  {string}  — ID do template alvo
 *
 * CAMPOS MANTIDOS APÓS EVOLUÇÃO:
 *   - id, level, xp, xpNeeded, nickname, owner, ownerId, heldItemId
 *   - buffs (zerados), skills (mantidos), canonSpeciesId (atualizado)
 *
 * CAMPOS ATUALIZADOS APÓS EVOLUÇÃO:
 *   - name, class, emoji, rarity
 *   - baseHp → hpMax (+10%)
 *   - baseAtk → atk (+10%)
 *   - baseDef → def (+10%)
 *   - baseSpd → spd (+10%)
 *   - baseEne → eneMax (+10%)
 *   - evolvesTo, evolvesAt (herdados do novo template ou zerados)
 *
 * HIERARQUIA: Documento Mestre > PATCH_CANONICO_COMBATE_V2.2.md > este módulo
 */

// ── Constante de boost por evolução ──────────────────────────────────────────

/** Cada stat sobe 10% ao evoluir (round). */
export const EVOLUTION_STAT_BOOST = 0.10;

// ── checkEvolution ────────────────────────────────────────────────────────────

/**
 * Verifica se um monstro pode evoluir agora.
 *
 * Critérios:
 *   1. monster.evolvesTo existe e não é null/undefined
 *   2. monster.level >= monster.evolvesAt
 *
 * @param {object} monster - Instância de monstrinho
 * @returns {{ canEvolve: boolean, targetId: string|null }}
 */
export function checkEvolution(monster) {
    if (!monster) return { canEvolve: false, targetId: null };

    const targetId = monster.evolvesTo ?? null;
    if (!targetId) return { canEvolve: false, targetId: null };

    const level = Number(monster.level) || 1;
    const evolvesAt = Number(monster.evolvesAt) || Infinity;

    if (level < evolvesAt) return { canEvolve: false, targetId };

    return { canEvolve: true, targetId };
}

// ── getEvolutionTarget ────────────────────────────────────────────────────────

/**
 * Busca o template de evolução do monstro pelo ID de destino.
 *
 * @param {string} targetId - ID do template destino (monster.evolvesTo)
 * @param {Array}  catalog  - Array de templates de monstros (data catalog)
 * @returns {object|null} Template encontrado ou null
 */
export function getEvolutionTarget(targetId, catalog) {
    if (!targetId || !Array.isArray(catalog)) return null;
    return catalog.find(t => t.id === targetId) ?? null;
}

// ── applyEvolution ────────────────────────────────────────────────────────────

/**
 * Aplica a evolução a um monstro in-place usando o template destino.
 *
 * Muta o objeto `monster` diretamente (inline mutation intencional,
 * compatível com o pipeline de index.html).
 *
 * Stats recebem boost de +10% (EVOLUTION_STAT_BOOST) sobre os valores base
 * do novo template. Se o novo template não tiver stats base, os stats atuais
 * do monstro são aumentados em +10% como fallback.
 *
 * @param {object} monster     - Instância do monstro (será mutada)
 * @param {object} newTemplate - Template do monstro destino (do catalog)
 * @param {Array}  [log]       - Array de log (opcional)
 * @returns {void}
 */
export function applyEvolution(monster, newTemplate, log = null) {
    if (!monster || !newTemplate) return;

    const oldName = monster.nickname || monster.name || monster.nome || 'Monstrinho';
    const newName = newTemplate.name || newTemplate.nome || oldName;

    // ── Atualizar campos de identidade ───────────────────────────────────
    monster.name = newName;
    monster.nome = newName;
    if (newTemplate.class)  monster.class  = newTemplate.class;
    if (newTemplate.emoji)  monster.emoji  = newTemplate.emoji;
    if (newTemplate.rarity) monster.rarity = newTemplate.rarity;
    if (newTemplate.id)     monster.canonSpeciesId = newTemplate.id;

    // ── Atualizar stats (+10% sobre base do novo template ou sobre atual) ─
    const boost = 1 + EVOLUTION_STAT_BOOST;

    const newBaseHp  = Number(newTemplate.baseHp)  || Number(monster.hpMax)  || 1;
    const newBaseAtk = Number(newTemplate.baseAtk) || Number(monster.atk)    || 1;
    const newBaseDef = Number(newTemplate.baseDef) || Number(monster.def)    || 1;
    const newBaseSpd = Number(newTemplate.baseSpd) || Number(monster.spd)    || 1;
    const newBaseEne = Number(newTemplate.baseEne) || Number(monster.eneMax) || 1;

    monster.hpMax  = Math.round(newBaseHp  * boost);
    monster.hp     = monster.hpMax; // cura total ao evoluir
    monster.atk    = Math.round(newBaseAtk * boost);
    monster.def    = Math.round(newBaseDef * boost);
    monster.spd    = Math.round(newBaseSpd * boost);
    monster.eneMax = Math.round(newBaseEne * boost);
    monster.ene    = monster.eneMax;

    // ── Herdar cadeia de evolução do novo template ────────────────────────
    monster.evolvesTo = newTemplate.evolvesTo ?? null;
    monster.evolvesAt = newTemplate.evolvesAt ?? null;

    // ── Limpar buffs (não transferidos para a nova forma) ─────────────────
    monster.buffs = [];

    // ── Log ───────────────────────────────────────────────────────────────
    if (Array.isArray(log)) {
        log.push(`🌟 ${oldName} evoluiu para ${newName}!`);
    }
}
