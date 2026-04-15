/**
 * GAME FLOW MODULE
 *
 * Coordena o loop jogável completo:
 *   entrar em local → encontro → batalha/captura → drops + XP → progressão de quest
 *
 * Design:
 * - Funções PURAS com Dependency Injection (mesmo padrão de xpActions.js)
 * - Sem acesso direto a GameState — recebe dependências via `deps`
 * - Testável em Node/Vitest sem DOM
 *
 * Quest state por jogador (player.questState):
 * {
 *   activeQuestIds:    string[]   — quests em andamento
 *   completedQuestIds: string[]   — quests concluídas
 *   progress: {
 *     [questId]: {
 *       count: number  — progresso atual (ex: monstros derrotados)
 *     }
 *   }
 * }
 *
 * Encounter esperado (enc):
 * {
 *   type:              'wild' | 'group_trainer' | 'boss'
 *   localId:           'LOC_001' ... 'LOC_008'  (opcional, para drops e quests)
 *   result:            'victory' | 'flee' | 'defeat'
 *   capturedMonsterId: string | null   (templateId do monstro capturado)
 *   wildMonster:       Object | null   (instância do monstro selvagem)
 *   enemies:           Object[]        (inimigos em batalha em grupo)
 * }
 */

import {
    QUESTS_DATA,
    getQuest,
    isQuestAvailable,
    getNextQuest
} from './data/questSystem.js';

// ═══════════════════════════════════════════════════
// INICIALIZAÇÃO DE ESTADO DE QUEST
// ═══════════════════════════════════════════════════

/**
 * Garante que o jogador tenha o campo questState inicializado.
 * Idempotente — pode ser chamado várias vezes.
 * @param {Object} player
 */
export function ensureQuestState(player) {
    if (!player) return;
    if (!player.questState || typeof player.questState !== 'object') {
        player.questState = {
            activeQuestIds:    [],
            completedQuestIds: [],
            progress:          {}
        };
    }
    if (!Array.isArray(player.questState.activeQuestIds))    player.questState.activeQuestIds    = [];
    if (!Array.isArray(player.questState.completedQuestIds)) player.questState.completedQuestIds = [];
    if (!player.questState.progress || typeof player.questState.progress !== 'object') {
        player.questState.progress = {};
    }
}

// ═══════════════════════════════════════════════════
// ATIVAÇÃO DE QUESTS
// ═══════════════════════════════════════════════════

/**
 * Ativa uma quest para o jogador, se disponível e não ativa/concluída.
 * @param {Object} player
 * @param {string} questId
 * @returns {boolean} true se ativada com sucesso
 */
export function activateQuest(player, questId) {
    if (!player || !questId) return false;
    ensureQuestState(player);

    const qs = player.questState;

    // Já concluída ou já ativa → ignorar
    if (qs.completedQuestIds.includes(questId)) return false;
    if (qs.activeQuestIds.includes(questId)) return false;

    // Verificar pré-requisito
    if (!isQuestAvailable(questId, qs.completedQuestIds)) return false;

    qs.activeQuestIds.push(questId);
    // Inicializar progresso
    if (!qs.progress[questId]) {
        qs.progress[questId] = { count: 0 };
    }
    return true;
}

/**
 * Ativa automaticamente a quest inicial (QST_001) se o jogador ainda não
 * tiver nenhuma quest ativa ou concluída.
 * Útil para jogadores novos ou recém-criados.
 * @param {Object} player
 * @returns {boolean} true se QST_001 foi ativada
 */
export function autoActivateFirstQuest(player) {
    if (!player) return false;
    ensureQuestState(player);

    const qs = player.questState;
    if (qs.activeQuestIds.length === 0 && qs.completedQuestIds.length === 0) {
        return activateQuest(player, 'QST_001');
    }
    return false;
}

// ═══════════════════════════════════════════════════
// MAPEAMENTO: TIPO DE ENCOUNTER → TIPO DE OBJETIVO
// ═══════════════════════════════════════════════════

/**
 * Extrai o templateId principal de um encontro.
 * Para 'wild': templateId do wildMonster.
 * Para 'group_trainer' / 'boss': templateId do primeiro inimigo.
 * @param {Object} enc
 * @returns {string|null}
 */
function getEncounterTemplateId(enc) {
    if (!enc) return null;
    if (enc.wildMonster) {
        return enc.wildMonster.templateId || enc.wildMonster.monsterId || null;
    }
    if (enc.enemies && enc.enemies.length > 0) {
        return enc.enemies[0].templateId || enc.enemies[0].monsterId || null;
    }
    return null;
}

/**
 * Mapeia o tipo de encontro para o tipo de objetivo de quest.
 * @param {string} encType - 'wild' | 'group_trainer' | 'boss' | 'trainer'
 * @returns {string} - objetivo tipo
 */
function encTypeToObjective(encType) {
    const t = String(encType || '').toLowerCase();
    if (t === 'boss')                         return 'derrotar_boss';
    if (t === 'trainer' || t === 'group_trainer') return 'derrotar_treinador';
    return 'derrotar_wild';
}

// ═══════════════════════════════════════════════════
// PROGRESSÃO DE QUEST
// ═══════════════════════════════════════════════════

/**
 * Verifica se um encontro completado progride um objetivo de quest.
 * Não muta estado — apenas retorna true/false.
 *
 * @param {Object} quest    - dados da quest (de QUESTS_DATA)
 * @param {Object} enc      - encontro finalizado
 * @param {string} [capturedMonsterId] - templateId capturado (se captura)
 * @returns {boolean}
 */
function encounterMatchesQuestObjective(quest, enc, capturedMonsterId) {
    if (!quest || !enc) return false;

    const localId = enc.localId || enc.location;

    // Quest requer local específico
    if (quest.localId && localId && quest.localId !== localId) return false;

    const type = quest.tipoObjetivo;

    if (type === 'capturar') {
        if (!capturedMonsterId) return false;
        // Se a quest tem monstro específico, verificar
        if (quest.objetivoMonsterId && quest.objetivoMonsterId !== capturedMonsterId) return false;
        return true;
    }

    if (type === 'derrotar_wild') {
        return encTypeToObjective(enc.type) === 'derrotar_wild';
    }

    if (type === 'derrotar_treinador') {
        return encTypeToObjective(enc.type) === 'derrotar_treinador';
    }

    if (type === 'derrotar_boss') {
        if (encTypeToObjective(enc.type) !== 'derrotar_boss') return false;
        // Se a quest tem monstro específico (o boss), verificar templateId
        if (quest.objetivoMonsterId) {
            const bossTemplateId = getEncounterTemplateId(enc);
            return bossTemplateId === quest.objetivoMonsterId;
        }
        return true;
    }

    return false;
}

/**
 * Processa o progresso de todas as quests ativas após um encontro bem-sucedido.
 * Retorna lista de quests concluídas nesta chamada.
 *
 * @param {Object} player              - jogador ativo
 * @param {Object} enc                 - encontro finalizado (resultado = 'victory')
 * @param {string} [capturedMonsterId] - templateId capturado (ou null)
 * @param {Object} [log]               - array de log para appender mensagens
 * @returns {string[]}                 - IDs das quests concluídas nesta chamada
 */
export function processQuestProgress(player, enc, capturedMonsterId, log) {
    if (!player || !enc) return [];

    ensureQuestState(player);
    const qs = player.questState;
    const logArr = Array.isArray(log) ? log : [];
    const completed = [];

    for (const questId of [...qs.activeQuestIds]) {
        const quest = getQuest(questId);
        if (!quest) continue;

        // Verificar se este encontro conta para a quest
        if (!encounterMatchesQuestObjective(quest, enc, capturedMonsterId)) continue;

        // Incrementar progresso
        qs.progress[questId] = qs.progress[questId] || { count: 0 };
        qs.progress[questId].count += 1;

        const progress = qs.progress[questId].count;
        const needed   = quest.objetivoQtd || 1;

        logArr.push(`📋 Quest "${quest.nome}": ${progress}/${needed}`);

        // Verificar conclusão
        if (progress >= needed) {
            completed.push(questId);
        }
    }

    return completed;
}

// ═══════════════════════════════════════════════════
// CONCLUSÃO E RECOMPENSAS
// ═══════════════════════════════════════════════════

/**
 * Conclui uma quest, aplica recompensas ao jogador e ativa a próxima
 * quest da cadeia se disponível.
 *
 * @param {Object} player    - jogador
 * @param {string} questId   - ID da quest a concluir
 * @param {Object} deps      - dependências injetadas (ver abaixo)
 * @param {Array}  [logArr]  - array de log
 *
 * deps esperado:
 * {
 *   addItemToInventory(player, itemId, qty),   // adicionar item ao inventário
 *   addMoneyToPlayer(player, amount),          // adicionar dinheiro
 *   addQuestXP(player, xp)                    // adicionar XP global de quest (opcional)
 * }
 *
 * @returns {boolean} true se concluída com sucesso
 */
export function completeQuest(player, questId, deps, logArr) {
    if (!player || !questId) return false;
    ensureQuestState(player);

    const qs = player.questState;

    // Verificar que a quest está ativa
    const idx = qs.activeQuestIds.indexOf(questId);
    if (idx === -1) return false;

    const quest = getQuest(questId);
    if (!quest) return false;

    const log = Array.isArray(logArr) ? logArr : [];

    // Mover de ativa para concluída
    qs.activeQuestIds.splice(idx, 1);
    if (!qs.completedQuestIds.includes(questId)) {
        qs.completedQuestIds.push(questId);
    }

    log.push(`🏆 Quest concluída: "${quest.nome}"!`);

    // Aplicar recompensas via DI
    if (deps) {
        if (typeof deps.addMoneyToPlayer === 'function' && quest.rewardGold > 0) {
            deps.addMoneyToPlayer(player, quest.rewardGold);
            log.push(`💰 +${quest.rewardGold} moedas!`);
        }

        if (typeof deps.addItemToInventory === 'function' && quest.rewardItemId) {
            deps.addItemToInventory(player, quest.rewardItemId, 1);
            log.push(`🎁 Item: ${quest.rewardItemId}!`);
        }

        if (typeof deps.addQuestXP === 'function' && quest.rewardXp > 0) {
            deps.addQuestXP(player, quest.rewardXp);
            log.push(`⭐ +${quest.rewardXp} XP de quest!`);
        }
    }

    // Ativar próxima quest da cadeia
    const next = getNextQuest(questId);
    if (next && activateQuest(player, next.id)) {
        log.push(`🗺️ Nova quest: "${next.nome}"!`);
    } else if (next) {
        // Próxima existe mas pré-req não atendido ainda (não deveria acontecer na cadeia linear)
        // Silencioso — não logar erro
    }

    return true;
}

// ═══════════════════════════════════════════════════
// ORQUESTRADOR PRINCIPAL: after-encounter
// ═══════════════════════════════════════════════════

/**
 * Ponto central de pós-encontro.
 * Deve ser chamado APÓS handleVictoryRewards (XP e drops).
 *
 * Fluxo:
 * 1. Processar progresso de quests ativas
 * 2. Para cada quest concluída: completeQuest() → recompensas + ativar próxima
 * 3. Retornar resultado para o chamador logar/mostrar na UI
 *
 * @param {Object} player              - jogador que participou do encontro
 * @param {Object} enc                 - encontro finalizado
 * @param {string} [capturedMonsterId] - templateId capturado (captura bem-sucedida) ou null
 * @param {Object} deps                - dependências (ver completeQuest)
 * @returns {{ completed: string[], activated: string[], log: string[] }}
 */
export function handlePostEncounterFlow(player, enc, capturedMonsterId, deps) {
    const log = [];

    if (!player || !enc) return { completed: [], activated: [], log };

    // Garantir que a quest inicial esteja ativa
    autoActivateFirstQuest(player);

    const completedIds = processQuestProgress(player, enc, capturedMonsterId, log);

    const activatedIds = [];
    for (const questId of completedIds) {
        const nextQuestBefore = getNextQuest(questId);
        completeQuest(player, questId, deps, log);

        // Detectar qual quest foi ativada
        if (nextQuestBefore) {
            ensureQuestState(player);
            if (player.questState.activeQuestIds.includes(nextQuestBefore.id)) {
                activatedIds.push(nextQuestBefore.id);
            }
        }
    }

    return { completed: completedIds, activated: activatedIds, log };
}

// ═══════════════════════════════════════════════════
// HELPERS DE LEITURA
// ═══════════════════════════════════════════════════

/**
 * Retorna o resumo de quests ativas do jogador (para exibição na UI).
 * @param {Object} player
 * @returns {Array<{quest: Object, progress: number, needed: number}>}
 */
export function getActiveQuestsSummary(player) {
    if (!player) return [];
    ensureQuestState(player);

    const qs = player.questState;
    return qs.activeQuestIds.map(qid => {
        const quest = getQuest(qid);
        if (!quest) return null;
        const progress = qs.progress[qid]?.count || 0;
        return { quest, progress, needed: quest.objetivoQtd || 1 };
    }).filter(Boolean);
}

/**
 * Retorna se o jogador já concluiu determinada quest.
 * @param {Object} player
 * @param {string} questId
 * @returns {boolean}
 */
export function hasCompletedQuest(player, questId) {
    if (!player || !questId) return false;
    ensureQuestState(player);
    return player.questState.completedQuestIds.includes(questId);
}

// Re-exporta utilitários do questSystem para acesso via window.GameFlow
export { getQuest, QUESTS_DATA } from './data/questSystem.js';
