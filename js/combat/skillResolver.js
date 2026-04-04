/**
 * SKILL RESOLVER — Módulo canônico de normalização de habilidades
 *
 * DECISÃO ARQUITETURAL (PR-Unificação-Skills):
 *   O sistema canônico de habilidades em runtime é o SKILL_DEFS.
 *   Toda habilidade usada em combate (wild ou group) deve passar por este módulo
 *   e ser representada no formato operacional único antes de chegar à UI e à execução.
 *
 * FORMATO OPERACIONAL ÚNICO (runtime):
 *   {
 *     name    : string        — nome exibido
 *     type    : 'DAMAGE'|'HEAL'|'BUFF'  — tipo normalizado
 *     cost    : number        — custo em ENE
 *     target  : 'enemy'|'self'|'ally'   — alvo normalizado
 *     power   : number        — poder base
 *     desc    : string        — descrição
 *     buffType?   : string    — (BUFF apenas)
 *     duration?   : number    — (BUFF apenas)
 *     debuffType? : string    — (BUFF com debuff, ex: Fúria)
 *     debuffPower?: number    — (BUFF com debuff)
 *     _source : 'skill_defs'|'skills_catalog'|'kit_swap'  — origem
 *     _raw    : object        — objeto original (para compatibilidade)
 *   }
 *
 * FONTES SUPORTADAS:
 *   • SKILL_DEFS (canônica) — { type, cost, target: 'enemy'/'self'/'ally', power }
 *   • KitSwap objects — mesmo formato de SKILL_DEFS + _kitSwapId
 *   • SKILLS_CATALOG (futura/migração) — { energy_cost, category, target: 'Inimigo'/... }
 */

/**
 * Mapeamento de target textual (SKILLS_CATALOG) para target normalizado.
 */
const TARGET_NORMALIZE = {
    'Inimigo': 'enemy',
    'Área':    'enemy',  // dano em área = ofensivo
    'Aliado':  'ally',
    'Self':    'self',
    'Todos':   'enemy',  // AoE ofensivo
};

/**
 * Mapeamento de category (SKILLS_CATALOG) para type normalizado.
 */
const CATEGORY_TO_TYPE = {
    'Ataque':   'DAMAGE',
    'Controle': 'DAMAGE',  // controle também causa efeito ofensivo
    'Cura':     'HEAL',
    'Suporte':  'BUFF',
};

/**
 * Normaliza um objeto de skill de qualquer formato para o formato operacional único.
 *
 * Compatível com:
 * - SKILL_DEFS: { type, cost, target: 'enemy'/'self'/'ally', power, ... }
 * - KitSwap: mesmo que SKILL_DEFS + _kitSwapId
 * - SKILLS_CATALOG: { energy_cost, category, target: 'Inimigo'/..., ... }
 *
 * @param {object} rawSkill - Objeto de skill em qualquer formato
 * @returns {object|null} Skill no formato operacional único, ou null se inválida
 */
export function normalizeSkill(rawSkill) {
    if (!rawSkill || typeof rawSkill !== 'object') return null;

    const name = rawSkill.name || rawSkill.nome || 'Habilidade';

    // Custo: SKILL_DEFS/KitSwap usa 'cost'; SKILLS_CATALOG usa 'energy_cost'
    const cost = Number(rawSkill.cost ?? rawSkill.energy_cost ?? rawSkill.eneCost ?? 0) || 0;

    // Tipo: SKILL_DEFS tem 'type'; SKILLS_CATALOG usa 'category'
    let type = (rawSkill.type || '').toUpperCase();
    if (!type && rawSkill.category) {
        type = CATEGORY_TO_TYPE[rawSkill.category] || 'DAMAGE';
    }
    if (!type) type = 'DAMAGE';

    // Alvo: SKILL_DEFS já está normalizado ('enemy'/'self'/'ally')
    // SKILLS_CATALOG usa 'Inimigo'/'Self'/'Aliado'/'Área'
    const rawTarget = rawSkill.target || '';
    const target = TARGET_NORMALIZE[rawTarget] || rawTarget || 'enemy';

    // Poder e descrição
    const power = Number(rawSkill.power ?? rawSkill.POWER ?? rawSkill.pwr ?? 0) || 0;
    const desc = rawSkill.desc || rawSkill.descricao || rawSkill.description || '';

    // Detectar origem
    let source = 'skill_defs';
    if (rawSkill._kitSwapId) source = 'kit_swap';
    else if (rawSkill.energy_cost !== undefined && rawSkill.cost === undefined) source = 'skills_catalog';

    const normalized = {
        name,
        type,
        cost,
        target,
        power,
        desc,
        _source: source,
        _raw: rawSkill,
    };

    // Preservar campos opcionais de BUFF
    if (rawSkill.buffType !== undefined)   normalized.buffType   = rawSkill.buffType;
    if (rawSkill.duration !== undefined)   normalized.duration   = rawSkill.duration;
    if (rawSkill.debuffType !== undefined) normalized.debuffType = rawSkill.debuffType;
    if (rawSkill.debuffPower !== undefined) normalized.debuffPower = rawSkill.debuffPower;

    // Preservar campos de KitSwap (telemetria, Fase 14)
    if (rawSkill._kitSwapId !== undefined) normalized._kitSwapId = rawSkill._kitSwapId;

    return normalized;
}

/**
 * Normaliza um array de skills brutas.
 *
 * @param {Array} rawSkills - Array de objetos de skill em qualquer formato
 * @returns {Array} Array de skills no formato operacional único (sem nulos)
 */
export function resolveFromRawArray(rawSkills) {
    if (!Array.isArray(rawSkills)) return [];
    return rawSkills.map(normalizeSkill).filter(Boolean);
}

/**
 * Verifica se o monstro tem ENE suficiente para usar uma skill normalizada.
 *
 * @param {object} skill - Skill no formato operacional único (tem `cost`)
 * @param {object} mon   - Instância do Monstrinho (tem `ene`)
 * @returns {boolean}
 */
export function canUseSkill(skill, mon) {
    if (!skill || !mon) return false;
    return (Number(mon.ene) || 0) >= (Number(skill.cost) || 0);
}

/**
 * Verifica se uma skill normalizada é ofensiva (exige seleção de inimigo como alvo).
 *
 * Uma skill é ofensiva se o alvo normalizado é 'enemy' (ou 'area', tratado como ofensivo).
 *
 * @param {object} skill - Skill no formato operacional único
 * @returns {boolean}
 */
export function isOffensiveSkill(skill) {
    if (!skill) return false;
    return skill.target === 'enemy' || skill.target === 'area';
}
