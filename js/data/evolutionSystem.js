/**
 * EVOLUTION SYSTEM — Funções puras de evolução (FASE G)
 *
 * Módulo sem side-effects: não acessa estado global, não toca DOM, não faz fetch.
 * As funções integradas ao game loop (maybeEvolveAfterLevelUp) continuam em index.html;
 * este módulo exporta versões puras testáveis dessas lógicas.
 */

/**
 * Extrai dados de evolução de um template de monstro.
 * Suporta múltiplos nomes de campo para compatibilidade com legado.
 *
 * @param {Object|null} template - Template do monstro (da monsters.json / MONSTER_CATALOG)
 * @returns {{ toId: string, atLv: number } | null}
 */
export function getEvolutionData(template) {
    if (!template) return null;

    const evolvesTo = template.evolvesTo ?? template.evolve_to ?? template.evoluiPara ?? null;
    const evolvesAt = template.evolvesAt ?? template.evolve_at ?? template.evoluiNoNivel ?? null;

    const toId = evolvesTo != null ? String(evolvesTo) : '';
    const atLv = evolvesAt != null ? Number(evolvesAt) : NaN;

    if (!toId || !Number.isFinite(atLv) || atLv <= 0) return null;

    return { toId, atLv };
}

/**
 * Verifica se um monstro atingiu o nível de evolução dado seu template atual.
 *
 * @param {Object} monster - Instância de monstro com campo `level`
 * @param {Object} template - Template atual do monstro (estágio corrente)
 * @returns {{ shouldEvolve: boolean, newTemplateId: string | null }}
 */
export function checkEvolution(monster, template) {
    if (!monster || !template) return { shouldEvolve: false, newTemplateId: null };

    const evo = getEvolutionData(template);
    if (!evo) return { shouldEvolve: false, newTemplateId: null };

    const level = Math.max(1, Number(monster.level) || 1);
    if (level < evo.atLv) return { shouldEvolve: false, newTemplateId: null };

    return { shouldEvolve: true, newTemplateId: evo.toId };
}

/**
 * Executa a evolução de forma pura: atualiza os campos da instância in-place
 * com os dados do novo template, preservando o HP% atual.
 *
 * @param {Object} monster     - Instância de monstro (mutado in-place)
 * @param {Object} newTemplate - Template da forma evoluída
 * @param {Object} [opts]      - Opções opcionais:
 *   @param {number}   [opts.rarityMult=1.0] - Multiplicador de raridade para hpMax
 *   @param {number|null} [opts.hpPct]       - HP% a preservar; se omitido, usa HP% atual
 * @returns {{ oldName: string, newName: string }} Nomes antes e depois (para log externo)
 */
export function executeEvolution(monster, newTemplate, opts = {}) {
    if (!monster || !newTemplate) return { oldName: null, newName: null };

    const rarityMult = Number.isFinite(Number(opts.rarityMult)) ? Number(opts.rarityMult) : 1.0;

    // Preservar HP% (usa override se fornecido, senão calcula do estado atual)
    let hpPct;
    if (opts.hpPct != null && Number.isFinite(opts.hpPct)) {
        hpPct = opts.hpPct;
    } else {
        const oldHp    = Math.max(0, Number(monster.hp)    || 0);
        const oldHpMax = Math.max(1, Number(monster.hpMax) || 1);
        hpPct = oldHp / oldHpMax;
    }

    const oldName = monster.nickname || monster.name || monster.nome || 'Monstrinho';
    const newName = newTemplate.name || newTemplate.nome || oldName;

    // Atualizar identidade (compatível com múltiplos campos de ID)
    if (monster.monsterId  != null) monster.monsterId  = String(newTemplate.id);
    else if (monster.templateId != null) monster.templateId = String(newTemplate.id);
    else monster.monsterId = String(newTemplate.id);

    // Atualizar campos visuais e de gameplay
    if (newTemplate.name   || newTemplate.nome)       monster.name   = newTemplate.name   || newTemplate.nome;
    if (newTemplate.emoji)                             monster.emoji  = newTemplate.emoji;
    if (newTemplate.class  || newTemplate.classe)      monster.class  = newTemplate.class  || newTemplate.classe;
    if (newTemplate.rarity || newTemplate.raridade)    monster.rarity = newTemplate.rarity || newTemplate.raridade;

    // Recalcular hpMax com base no baseHp do novo template
    const baseHp = Number(newTemplate.baseHp ?? newTemplate.hpBase ?? newTemplate.hp) || Math.max(1, Number(monster.hpMax) || 1);
    const level  = Math.max(1, Number(monster.level) || 1);
    const lvMult = 1 + (level - 1) * 0.1;

    monster.hpMax = Math.floor(baseHp * lvMult * rarityMult);
    monster.hp    = Math.max(1, Math.floor(monster.hpMax * hpPct));

    return { oldName, newName };
}
