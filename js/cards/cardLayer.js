/**
 * CARD LAYER — lookup visual puro em data/cards.json.
 * Não altera mecânica, não faz kit swap e não decide execução de combate.
 */

const CARD_DATA_PATH = 'data/cards.json';

let cardCatalogCache = null;
let cardCatalogIndexCache = null;

function buildCardIndex(catalog) {
    const index = new Map();
    if (!catalog || !Array.isArray(catalog.cards)) return index;

    for (const card of catalog.cards) {
        if (!card || typeof card !== 'object') continue;
        const className = String(card.class || '').trim();
        const groupKey = String(card.groupKey || '').trim();
        if (!className || !groupKey) continue;
        index.set(`${className}::${groupKey}`, card);
    }
    return index;
}

function getStage(card, stageIndex) {
    if (!card || !card.stages || typeof card.stages !== 'object') {
        return { stage: null, usedDefaultStage: false, reason: 'invalid_card_stages' };
    }

    const direct = card.stages[String(stageIndex)];
    if (direct) {
        return { stage: direct, usedDefaultStage: false, reason: null };
    }

    const fallbackIndex = Number(card.default_stageIndex);
    const fallback = card.stages[String(fallbackIndex)];
    if (fallback) {
        return { stage: fallback, usedDefaultStage: true, reason: 'missing_stage_fallback_to_default' };
    }

    return { stage: null, usedDefaultStage: false, reason: 'missing_stage_and_default' };
}

function parseStageIndex(rawStageIndex) {
    const parsed = Number(rawStageIndex);
    return Number.isFinite(parsed) ? parsed : 0;
}

export async function loadCardCatalog({ fetchImpl = fetch, path = CARD_DATA_PATH } = {}) {
    if (cardCatalogCache) return cardCatalogCache;

    const response = await fetchImpl(path);
    if (!response.ok) {
        throw new Error(`Falha ao carregar cards.json (${response.status})`);
    }
    const payload = await response.json();
    cardCatalogCache = payload;
    cardCatalogIndexCache = buildCardIndex(payload);
    return cardCatalogCache;
}

export function setCardCatalogForTests(catalog) {
    cardCatalogCache = catalog || null;
    cardCatalogIndexCache = buildCardIndex(cardCatalogCache);
}

export function clearCardCatalogCache() {
    cardCatalogCache = null;
    cardCatalogIndexCache = null;
}

export function getCardCatalogSync() {
    return cardCatalogCache;
}

export function findCardForSkill(skill, options = {}) {
    if (!skill || typeof skill !== 'object') {
        return { card: null, stage: null, reason: 'invalid_skill', usedDefaultStage: false };
    }

    const catalog = options.catalog || cardCatalogCache;
    const index = options.index || cardCatalogIndexCache;
    if (!catalog || !index) {
        return { card: null, stage: null, reason: 'catalog_not_loaded', usedDefaultStage: false };
    }

    const className = String(skill.class || '').trim();
    const groupKey = String(skill.groupKey || '').trim();
    if (!className || !groupKey) {
        return { card: null, stage: null, reason: 'missing_class_or_groupKey', usedDefaultStage: false };
    }

    const card = index.get(`${className}::${groupKey}`) || null;
    if (!card) {
        return { card: null, stage: null, reason: 'unmapped_class_group', usedDefaultStage: false };
    }

    const stageIndex = parseStageIndex(skill.stageIndex);
    const stageResult = getStage(card, stageIndex);
    if (!stageResult.stage) {
        return {
            card,
            stage: null,
            reason: stageResult.reason || 'missing_stage',
            usedDefaultStage: stageResult.usedDefaultStage,
        };
    }

    return {
        card,
        stage: stageResult.stage,
        reason: stageResult.reason,
        usedDefaultStage: stageResult.usedDefaultStage,
    };
}
