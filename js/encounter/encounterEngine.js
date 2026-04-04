/**
 * ENCOUNTER ENGINE — Sistema de Geração de Encontros por Área Progressiva
 *
 * Implementa a lógica oficial de geração de encontros selvagens baseada em área/tier.
 * Todas as funções são puras (zero side effects, zero DOM, zero state global).
 *
 * Algoritmo oficial (10 passos):
 *  1. Ler areaId
 *  2. Ler tier, faixa de nível e rarityWeights da área
 *  3. Aplicar modificadores de progresso global
 *  4. Aplicar modificadores leves de grupo
 *  5. Sortear raridade final
 *  6. Selecionar espécie do pool da raridade
 *  7. Sortear nível dentro da faixa da área
 *  8. Aplicar chance de forma evoluída permitida pela área
 *  9. Verificar se é spot raro / hidden encounter / evento
 * 10. Iniciar combate
 *
 * Regra-chave: ÁREA governa. Grupo apenas ajusta levemente (máx ±10pp por raridade).
 */

// Raridades válidas em ordem de peso
const RARITY_ORDER = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];

// Limite máximo de deslocamento por modificador de grupo (em pontos percentuais)
const MAX_GROUP_MODIFIER_SHIFT = 10;

/**
 * Seleciona uma raridade com base nos pesos da área.
 * Usa rolagem ponderada: percorre a lista de raridades somando os pesos
 * até ultrapassar um valor aleatório entre 0 e total.
 *
 * @param {Object} rarityWeights - Pesos por raridade. Ex: { Comum: 82, Incomum: 16, Raro: 2, Místico: 0, Lendário: 0 }
 * @param {Function} rng - Função de randomização que retorna [0, 1). Padrão: Math.random
 * @returns {string|null} Raridade selecionada, ou null se pesos inválidos
 */
export function pickRarityByWeight(rarityWeights, rng = Math.random) {
    if (!rarityWeights || typeof rarityWeights !== 'object') return null;

    // Filtrar apenas raridades com peso > 0 e na ordem canônica
    const entries = RARITY_ORDER
        .filter(r => (rarityWeights[r] ?? 0) > 0)
        .map(r => ({ rarity: r, weight: rarityWeights[r] }));

    if (entries.length === 0) return null;

    const total = entries.reduce((sum, e) => sum + e.weight, 0);
    if (total <= 0) return null;

    const roll = rng() * total;
    let accumulated = 0;

    for (const entry of entries) {
        accumulated += entry.weight;
        if (roll < accumulated) {
            return entry.rarity;
        }
    }

    // Fallback para último com peso (cobertura de imprecisão de float)
    return entries[entries.length - 1].rarity;
}

/**
 * Seleciona aleatoriamente uma espécie de um pool.
 *
 * @param {Array<string>} pool - Array de IDs de espécies
 * @param {Function} rng - Função de randomização que retorna [0, 1)
 * @returns {string|null} ID da espécie selecionada, ou null se pool vazio
 */
export function pickSpeciesFromPool(pool, rng = Math.random) {
    if (!Array.isArray(pool) || pool.length === 0) return null;
    const index = Math.floor(rng() * pool.length);
    return pool[index] ?? null;
}

/**
 * Gera o nível do encontro dentro da faixa de nível da área.
 * A distribuição é uniforme dentro do intervalo [min, max].
 *
 * @param {Array<number>} levelRange - [min, max] inclusos
 * @param {Function} rng - Função de randomização que retorna [0, 1)
 * @returns {number} Nível gerado
 */
export function generateEncounterLevel(levelRange, rng = Math.random) {
    if (!Array.isArray(levelRange) || levelRange.length === 0) return 1;

    const [min, max = min] = levelRange;
    const minLevel = Math.max(1, Math.floor(min));
    const maxLevel = Math.max(minLevel, Math.floor(max));

    return minLevel + Math.floor(rng() * (maxLevel - minLevel + 1));
}

/**
 * Aplica modificadores externos (progresso global, grupo) aos pesos de raridade base.
 * Cada modificador pode ajustar o peso de uma raridade em até MAX_GROUP_MODIFIER_SHIFT pp.
 * Os pesos resultantes são normalizados para manter a soma original.
 *
 * Formato de modificador:
 * { rarity: 'Raro', delta: +4 }   → adiciona 4pp ao peso de Raro
 * { rarity: 'Comum', delta: -5 }  → remove 5pp do peso de Comum
 *
 * @param {Object} baseWeights - Pesos base da área (não são modificados)
 * @param {Array<Object>} modifiers - Lista de modificadores [{ rarity, delta }]
 * @returns {Object} Pesos ajustados (mesmas chaves, valores renormalizados)
 */
export function applyModifiers(baseWeights, modifiers = []) {
    if (!baseWeights || typeof baseWeights !== 'object') return {};

    // Clone para não mutar o objeto original
    const adjusted = { ...baseWeights };

    // Aplicar cada modificador com limite de deslocamento
    for (const mod of modifiers) {
        if (!mod || !mod.rarity || typeof mod.delta !== 'number') continue;
        if (!RARITY_ORDER.includes(mod.rarity)) continue;

        const clampedDelta = Math.max(-MAX_GROUP_MODIFIER_SHIFT, Math.min(MAX_GROUP_MODIFIER_SHIFT, mod.delta));
        const current = adjusted[mod.rarity] ?? 0;
        adjusted[mod.rarity] = Math.max(0, current + clampedDelta);
    }

    // Renormalizar para manter soma original
    const originalTotal = Object.values(baseWeights).reduce((s, v) => s + (v ?? 0), 0);
    const adjustedTotal = Object.values(adjusted).reduce((s, v) => s + (v ?? 0), 0);

    if (adjustedTotal > 0 && originalTotal > 0 && adjustedTotal !== originalTotal) {
        const scale = originalTotal / adjustedTotal;
        for (const rarity of RARITY_ORDER) {
            if (adjusted[rarity] !== undefined) {
                adjusted[rarity] = adjusted[rarity] * scale;
            }
        }
    }

    return adjusted;
}

/**
 * Aplica modificadores ao encounterTypeWeights (Selvagem, Item, Evento, Treinador, SpotRaro).
 * Funciona analogamente a applyModifiers(), mas opera sobre tipos de encontro.
 * Cada modificador ajusta o peso de um tipo em até MAX_GROUP_MODIFIER_SHIFT pp.
 *
 * @param {Object} baseWeights - Pesos base por tipo (não são modificados)
 * @param {Array<{type: string, delta: number}>} modifiers - Lista de modificadores
 * @returns {Object} Pesos ajustados (renormalizados para manter soma original)
 */
export function applyEncounterTypeModifiers(baseWeights, modifiers = []) {
    if (!baseWeights || typeof baseWeights !== 'object') return {};

    const adjusted = { ...baseWeights };

    for (const mod of modifiers) {
        if (!mod || typeof mod.type !== 'string' || typeof mod.delta !== 'number') continue;
        const clampedDelta = Math.max(-MAX_GROUP_MODIFIER_SHIFT, Math.min(MAX_GROUP_MODIFIER_SHIFT, mod.delta));
        const current = adjusted[mod.type] ?? 0;
        adjusted[mod.type] = Math.max(0, current + clampedDelta);
    }

    // Renormalizar para manter soma original
    const originalTotal = Object.values(baseWeights).reduce((s, v) => s + (v ?? 0), 0);
    const adjustedTotal = Object.values(adjusted).reduce((s, v) => s + (v ?? 0), 0);

    if (adjustedTotal > 0 && originalTotal > 0 && adjustedTotal !== originalTotal) {
        const scale = originalTotal / adjustedTotal;
        for (const key of Object.keys(adjusted)) {
            adjusted[key] = adjusted[key] * scale;
        }
    }

    return adjusted;
}

const RARE_SPOT_RARO_BONUS    = 15;
const RARE_SPOT_MISTICO_BONUS =  5;
const RARE_SPOT_COMUM_PENALTY = -15;

/** (encontro especial com bônus de raridade).
 * A chance base é definida pela área (rareSpotBonus, em pontos percentuais adicionados a Raro).
 *
 * @param {number} rareSpotBonus - Bônus da área em pp (ex: 15 = 15% a mais de chance de spot raro)
 * @param {Function} rng - Função de randomização
 * @returns {boolean} true se é um spot raro
 */
export function isRareSpot(rareSpotBonus, rng = Math.random) {
    if (!rareSpotBonus || rareSpotBonus <= 0) return false;
    // rareSpotBonus é em pontos percentuais (0–100)
    return rng() * 100 < rareSpotBonus;
}

/**
 * Encontra os dados de uma área pelo ID.
 *
 * @param {string} areaId - ID da área (ex: 'LOC_001')
 * @param {Array<Object>} locationsData - Array de objetos de localização
 * @returns {Object|null} Dados da área, ou null se não encontrada
 */
export function findArea(areaId, locationsData) {
    if (!areaId || !Array.isArray(locationsData)) return null;
    return locationsData.find(loc => loc.id === areaId) ?? null;
}

/**
 * Resolve o pool de espécies para uma raridade, com fallback para raridade inferior
 * se o pool da raridade sorteada estiver vazio.
 *
 * @param {Object} speciesPoolsByRarity - Pools por raridade
 * @param {string} rarity - Raridade sorteada
 * @returns {{ pool: Array<string>|null, resolvedRarity: string|null }}
 */
export function resolveSpeciesPool(speciesPoolsByRarity, rarity) {
    if (!speciesPoolsByRarity || !rarity) return { pool: null, resolvedRarity: null };

    const rarityIndex = RARITY_ORDER.indexOf(rarity);
    if (rarityIndex < 0) return { pool: null, resolvedRarity: null };

    // Tentar a raridade sorteada primeiro; se vazia, descer para raridade inferior
    for (let i = rarityIndex; i >= 0; i--) {
        const r = RARITY_ORDER[i];
        const pool = speciesPoolsByRarity[r];
        if (Array.isArray(pool) && pool.length > 0) {
            return { pool, resolvedRarity: r };
        }
    }

    return { pool: null, resolvedRarity: null };
}

/**
 * Gera um encontro selvagem completo para uma área.
 *
 * Retorna um objeto com todas as informações necessárias para iniciar o combate:
 * - speciesId: ID da espécie do Monstrinho selvagem
 * - rarity: raridade sorteada (pode diferir da raridade da espécie se pool vazio)
 * - level: nível do encontro
 * - areaId: área de origem
 * - tier: tier da área
 * - isRareSpot: se é um encontro em spot especial
 * - encounterType: tipo de encontro sorteado (Selvagem/Item/Evento/Treinador/SpotRaro)
 *
 * @param {string} areaId - ID da área
 * @param {Array<Object>} locationsData - Array de localizações (de locations.json)
 * @param {Object} [options] - Opções de geração
 * @param {Array<Object>} [options.modifiers] - Modificadores de raridade [{ rarity, delta }]
 * @param {Array<Object>} [options.encounterTypeModifiers] - Modificadores de tipo de encontro [{ type, delta }]
 * @param {number} [options.levelDelta] - Deslocamento inteiro aplicado ao nível sorteado
 * @param {Function} [options.rng] - Função de randomização (padrão: Math.random)
 * @param {boolean} [options.forceRareSpot] - Força spot raro (para testes/eventos)
 * @returns {Object|null} Dados do encontro, ou null se área inválida
 */
export function generateWildEncounter(areaId, locationsData, options = {}) {
    const { modifiers = [], encounterTypeModifiers = [], levelDelta = 0, rng = Math.random, forceRareSpot = false } = options;

    // Passo 1–2: Ler área
    const area = findArea(areaId, locationsData);
    if (!area) return null;

    const { tier, levelRange, rarityWeights, speciesPoolsByRarity, encounterTypeWeights, rareSpotBonus } = area;

    if (!rarityWeights || !speciesPoolsByRarity || !levelRange) return null;

    // Passo 9: Verificar spot raro antes de aplicar modificadores
    const spotRaro = forceRareSpot || isRareSpot(rareSpotBonus, rng);

    // Passo 3–4: Aplicar modificadores de progresso e grupo
    const modifiedWeights = applyModifiers(rarityWeights, modifiers);

    // Bônus adicional de raridade em spot raro
    let finalWeights = modifiedWeights;
    if (spotRaro && speciesPoolsByRarity['Raro']?.length > 0) {
        finalWeights = applyModifiers(modifiedWeights, [
            { rarity: 'Raro',    delta: RARE_SPOT_RARO_BONUS },
            { rarity: 'Místico', delta: RARE_SPOT_MISTICO_BONUS },
            { rarity: 'Comum',   delta: RARE_SPOT_COMUM_PENALTY }
        ]);
    }

    // Passo 5: Sortear raridade
    const pickedRarity = pickRarityByWeight(finalWeights, rng);
    if (!pickedRarity) return null;

    // Passo 6: Selecionar espécie do pool (com fallback)
    const { pool, resolvedRarity } = resolveSpeciesPool(speciesPoolsByRarity, pickedRarity);
    if (!pool) return null;

    const speciesId = pickSpeciesFromPool(pool, rng);
    if (!speciesId) return null;

    // Passo 7: Sortear nível (com delta de spot)
    const rawLevel = generateEncounterLevel(levelRange, rng);
    const level = Math.max(1, rawLevel + Math.round(levelDelta));

    // Passo 8: Tipo de encontro (com modificadores de spot)
    const finalTypeWeights = encounterTypeModifiers.length > 0
        ? applyEncounterTypeModifiers(encounterTypeWeights ?? {}, encounterTypeModifiers)
        : encounterTypeWeights;
    const encounterType = pickEncounterType(finalTypeWeights, rng);

    return {
        speciesId,
        rarity: resolvedRarity,
        level,
        areaId,
        tier: tier ?? null,
        isRareSpot: spotRaro,
        encounterType
    };
}

/**
 * Seleciona o tipo de encontro com base nos pesos da área.
 *
 * @param {Object} encounterTypeWeights - Pesos por tipo (Selvagem, Item, Evento, Treinador, SpotRaro)
 * @param {Function} rng - Função de randomização
 * @returns {string} Tipo de encontro selecionado
 */
export function pickEncounterType(encounterTypeWeights, rng = Math.random) {
    if (!encounterTypeWeights || typeof encounterTypeWeights !== 'object') return 'Selvagem';

    const entries = Object.entries(encounterTypeWeights).filter(([, w]) => (w ?? 0) > 0);
    if (entries.length === 0) return 'Selvagem';

    const total = entries.reduce((s, [, w]) => s + w, 0);
    const roll = rng() * total;
    let accumulated = 0;

    for (const [type, weight] of entries) {
        accumulated += weight;
        if (roll < accumulated) return type;
    }

    return entries[entries.length - 1][0];
}
