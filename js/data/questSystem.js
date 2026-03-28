/**
 * QUEST SYSTEM MODULE
 *
 * Sistema de dados de quests do jogo Monstrinhomon.
 * Fonte canônica: QUESTS.csv → implementado como constantes JS estáticas.
 *
 * Cadeia de 16 quests cobrindo todos os 8 biomas:
 *   LOC_001 (Tutorial)   → QST_001, QST_002
 *   LOC_002 (Floresta)   → QST_003, QST_004
 *   LOC_003 (Minas)      → QST_005, QST_006
 *   LOC_004 (Ruínas)     → QST_007, QST_008
 *   LOC_005 (Costa)      → QST_009, QST_010  [rota opcional]
 *   LOC_006 (Vulcânica)  → QST_011, QST_012
 *   LOC_007 (Noturna)    → QST_013, QST_014  [rota opcional]
 *   LOC_008 (Arena)      → QST_015, QST_016
 */

// ═══════════════════════════════════════════════════
// TIPOS DE OBJETIVO
// ═══════════════════════════════════════════════════

/** Tipos válidos de objetivo de quest */
export const QUEST_OBJECTIVE_TYPES = {
    DERROTAR_WILD:      'derrotar_wild',
    CAPTURAR:           'capturar',
    DERROTAR_TREINADOR: 'derrotar_treinador',
    DERROTAR_BOSS:      'derrotar_boss'
};

// ═══════════════════════════════════════════════════
// DADOS DAS QUESTS
// ═══════════════════════════════════════════════════

/**
 * Todas as quests do jogo, indexadas por ID.
 *
 * Campos:
 *  - id             {string}      ID único (QST_XXX)
 *  - nome           {string}      Nome exibido ao jogador
 *  - descricao      {string}      Descrição do objetivo
 *  - localId        {string}      Local onde a quest acontece (LOC_XXX)
 *  - preReq         {string|null} ID da quest pré-requisito (ou null)
 *  - tipoObjetivo   {string}      Tipo de objetivo (ver QUEST_OBJECTIVE_TYPES)
 *  - objetivoMonsterId {string|null} ID do monstro alvo (para capturar/boss)
 *  - objetivoQtd    {number}      Quantidade necessária (1 para boss/trainer)
 *  - rewardXp       {number}      XP de recompensa
 *  - rewardGold     {number}      Ouro de recompensa
 *  - rewardItemId   {string|null} ID do item de recompensa (ou null)
 *  - nextQuestId    {string|null} Próxima quest na cadeia (ou null)
 */
export const QUESTS_DATA = {
    // ── CAMPINA INICIAL (LOC_001) ─────────────────────────────────────────
    'QST_001': {
        id:               'QST_001',
        nome:             'O Ovo Perdido',
        descricao:        'Encontre o Ovo Perdido na Campina Inicial e vença o Treinador Novato.',
        localId:          'LOC_001',
        preReq:           null,
        tipoObjetivo:     'derrotar_treinador',
        objetivoMonsterId: null,
        objetivoQtd:      1,
        rewardXp:         80,
        rewardGold:       60,
        rewardItemId:     'CLASTERORB_COMUM',
        nextQuestId:      'QST_002'
    },
    'QST_002': {
        id:               'QST_002',
        nome:             'Primeira Captura',
        descricao:        'Capture 1 monstrinho selvagem na Campina Inicial.',
        localId:          'LOC_001',
        preReq:           'QST_001',
        tipoObjetivo:     'capturar',
        objetivoMonsterId: null,
        objetivoQtd:      1,
        rewardXp:         80,
        rewardGold:       50,
        rewardItemId:     'IT_HEAL_01',
        nextQuestId:      'QST_003'
    },

    // ── FLORESTA VERDE (LOC_002) ──────────────────────────────────────────
    'QST_003': {
        id:               'QST_003',
        nome:             'Rastros na Floresta',
        descricao:        'Derrote 3 monstrinhos selvagens na Floresta Verde.',
        localId:          'LOC_002',
        preReq:           'QST_002',
        tipoObjetivo:     'derrotar_wild',
        objetivoMonsterId: null,
        objetivoQtd:      3,
        rewardXp:         120,
        rewardGold:       70,
        rewardItemId:     'IT_HEAL_01',
        nextQuestId:      'QST_004'
    },
    'QST_004': {
        id:               'QST_004',
        nome:             'O Cervo da Floresta',
        descricao:        'Capture um Cervimon na Floresta Verde.',
        localId:          'LOC_002',
        preReq:           'QST_003',
        tipoObjetivo:     'capturar',
        objetivoMonsterId: 'MON_023',
        objetivoQtd:      1,
        rewardXp:         150,
        rewardGold:       80,
        rewardItemId:     'CLASTERORB_INCOMUM',
        nextQuestId:      'QST_005'
    },

    // ── MINAS E CAVERNAS (LOC_003) ────────────────────────────────────────
    'QST_005': {
        id:               'QST_005',
        nome:             'Mineradores Endurecidos',
        descricao:        'Derrote o Treinador Minerador nas Minas e Cavernas.',
        localId:          'LOC_003',
        preReq:           'QST_004',
        tipoObjetivo:     'derrotar_treinador',
        objetivoMonsterId: null,
        objetivoQtd:      1,
        rewardXp:         200,
        rewardGold:       100,
        rewardItemId:     'IT_HEAL_02',
        nextQuestId:      'QST_006'
    },
    'QST_006': {
        id:               'QST_006',
        nome:             'Pedra e Metal',
        descricao:        'Capture um Ferrozimon nas Minas e Cavernas.',
        localId:          'LOC_003',
        preReq:           'QST_005',
        tipoObjetivo:     'capturar',
        objetivoMonsterId: 'MON_010',
        objetivoQtd:      1,
        rewardXp:         180,
        rewardGold:       90,
        rewardItemId:     'CLASTERORB_INCOMUM',
        nextQuestId:      'QST_007'
    },

    // ── RUÍNAS ANTIGAS (LOC_004) ──────────────────────────────────────────
    'QST_007': {
        id:               'QST_007',
        nome:             'Guardiões das Ruínas',
        descricao:        'Derrote o Guardião das Ruínas Antigas.',
        localId:          'LOC_004',
        preReq:           'QST_006',
        tipoObjetivo:     'derrotar_treinador',
        objetivoMonsterId: null,
        objetivoQtd:      1,
        rewardXp:         280,
        rewardGold:       140,
        rewardItemId:     'IT_HEAL_02',
        nextQuestId:      'QST_008'
    },
    'QST_008': {
        id:               'QST_008',
        nome:             'O Espectro Ancestral',
        descricao:        'Derrote o Boss das Ruínas: TRockmon.',
        localId:          'LOC_004',
        preReq:           'QST_007',
        tipoObjetivo:     'derrotar_boss',
        objetivoMonsterId: 'MON_011C',
        objetivoQtd:      1,
        rewardXp:         400,
        rewardGold:       200,
        rewardItemId:     'EGG_U',
        nextQuestId:      'QST_011'
    },

    // ── COSTA E LAGOS (LOC_005) — rota opcional ───────────────────────────
    'QST_009': {
        id:               'QST_009',
        nome:             'Tesouro das Águas',
        descricao:        'Capture um Coralimon na Costa e Lagos.',
        localId:          'LOC_005',
        preReq:           'QST_005',
        tipoObjetivo:     'capturar',
        objetivoMonsterId: 'MON_024',
        objetivoQtd:      1,
        rewardXp:         220,
        rewardGold:       110,
        rewardItemId:     'IT_HEAL_02',
        nextQuestId:      null
    },
    'QST_010': {
        id:               'QST_010',
        nome:             'O Abismo Cristalino',
        descricao:        'Derrote o Abissalquimon nas profundezas da Costa e Lagos.',
        localId:          'LOC_005',
        preReq:           'QST_009',
        tipoObjetivo:     'derrotar_boss',
        objetivoMonsterId: 'MON_024C',
        objetivoQtd:      1,
        rewardXp:         350,
        rewardGold:       175,
        rewardItemId:     'EGG_U',
        nextQuestId:      null
    },

    // ── ZONA VULCÂNICA (LOC_006) ──────────────────────────────────────────
    'QST_011': {
        id:               'QST_011',
        nome:             'Calor do Inferno',
        descricao:        'Derrote 3 monstrinhos selvagens na Zona Vulcânica.',
        localId:          'LOC_006',
        preReq:           'QST_008',
        tipoObjetivo:     'derrotar_wild',
        objetivoMonsterId: null,
        objetivoQtd:      3,
        rewardXp:         350,
        rewardGold:       175,
        rewardItemId:     'IT_HEAL_02',
        nextQuestId:      'QST_012'
    },
    'QST_012': {
        id:               'QST_012',
        nome:             'O Rei das Chamas',
        descricao:        'Derrote o Boss Vulcânico: Wizardragomon.',
        localId:          'LOC_006',
        preReq:           'QST_011',
        tipoObjetivo:     'derrotar_boss',
        objetivoMonsterId: 'MON_014D',
        objetivoQtd:      1,
        rewardXp:         600,
        rewardGold:       300,
        rewardItemId:     'EGG_R',
        nextQuestId:      'QST_015'
    },

    // ── FLORESTA NOTURNA (LOC_007) — rota opcional ────────────────────────
    'QST_013': {
        id:               'QST_013',
        nome:             'Sombras da Noite',
        descricao:        'Capture um Noxcorvomon na Floresta Noturna.',
        localId:          'LOC_007',
        preReq:           'QST_007',
        tipoObjetivo:     'capturar',
        objetivoMonsterId: 'MON_022B',
        objetivoQtd:      1,
        rewardXp:         300,
        rewardGold:       150,
        rewardItemId:     'IT_HEAL_03',
        nextQuestId:      null
    },
    'QST_014': {
        id:               'QST_014',
        nome:             'Caçada nas Trevas',
        descricao:        'Derrote o Caçador Noturno na Floresta Noturna.',
        localId:          'LOC_007',
        preReq:           'QST_013',
        tipoObjetivo:     'derrotar_treinador',
        objetivoMonsterId: null,
        objetivoQtd:      1,
        rewardXp:         380,
        rewardGold:       190,
        rewardItemId:     'EGG_U',
        nextQuestId:      null
    },

    // ── ARENA DOS CONFLITOS (LOC_008) ─────────────────────────────────────
    'QST_015': {
        id:               'QST_015',
        nome:             'Desafio da Arena',
        descricao:        'Derrote o Campeão da Arena dos Conflitos.',
        localId:          'LOC_008',
        preReq:           'QST_012',
        tipoObjetivo:     'derrotar_treinador',
        objetivoMonsterId: null,
        objetivoQtd:      1,
        rewardXp:         500,
        rewardGold:       250,
        rewardItemId:     'EGG_R',
        nextQuestId:      'QST_016'
    },
    'QST_016': {
        id:               'QST_016',
        nome:             'O Grande Campeão',
        descricao:        'Derrote o Boss da Arena: BestBearmon.',
        localId:          'LOC_008',
        preReq:           'QST_015',
        tipoObjetivo:     'derrotar_boss',
        objetivoMonsterId: 'MON_012C',
        objetivoQtd:      1,
        rewardXp:         800,
        rewardGold:       400,
        rewardItemId:     'EGG_M',
        nextQuestId:      null
    }
};

// ═══════════════════════════════════════════════════
// FUNÇÕES DE ACESSO
// ═══════════════════════════════════════════════════

/**
 * Retorna os dados de uma quest específica.
 * @param {string} questId - ID da quest (ex: 'QST_001')
 * @returns {Object|null} - Dados da quest ou null se não existir
 */
export function getQuest(questId) {
    return QUESTS_DATA[questId] || null;
}

/**
 * Retorna todas as quests de um local específico.
 * @param {string} localId - ID do local (ex: 'LOC_001')
 * @returns {Object[]} - Array de quests do local
 */
export function getQuestsByLocation(localId) {
    return Object.values(QUESTS_DATA).filter(q => q.localId === localId);
}

/**
 * Verifica se uma quest está disponível para o jogador.
 * Uma quest está disponível se não tiver pré-requisito ou
 * se o pré-requisito já foi completado.
 *
 * @param {string} questId - ID da quest a verificar
 * @param {string[]} completedQuestIds - IDs das quests já completadas
 * @returns {boolean} - true se a quest está disponível
 */
export function isQuestAvailable(questId, completedQuestIds) {
    const quest = QUESTS_DATA[questId];
    if (!quest) return false;
    if (!quest.preReq) return true;
    const completed = new Set(completedQuestIds || []);
    return completed.has(quest.preReq);
}

/**
 * Retorna a próxima quest na cadeia principal após completar uma quest.
 * @param {string} questId - ID da quest completada
 * @returns {Object|null} - Próxima quest ou null
 */
export function getNextQuest(questId) {
    const quest = QUESTS_DATA[questId];
    if (!quest || !quest.nextQuestId) return null;
    return QUESTS_DATA[quest.nextQuestId] || null;
}

/**
 * Retorna todas as quests ordenadas por cadeia de dependência.
 * Quests sem pré-requisito vêm primeiro.
 * @returns {Object[]} - Array de quests em ordem de dependência
 */
export function getQuestChain() {
    const sorted = [];
    const visited = new Set();
    const inStack = new Set(); // guard contra ciclos durante recursão

    function visit(questId) {
        if (visited.has(questId)) return;
        if (inStack.has(questId)) return; // ciclo detectado — ignorar
        inStack.add(questId);
        const quest = QUESTS_DATA[questId];
        if (quest && quest.preReq) visit(quest.preReq);
        inStack.delete(questId);
        visited.add(questId);
        if (quest) sorted.push(quest);
    }

    Object.keys(QUESTS_DATA).forEach(visit);
    return sorted;
}
