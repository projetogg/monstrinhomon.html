/**
 * GROUP BATTLE REWARDS (PR-battle-end)
 *
 * Módulo canônico de processamento de recompensas de fim de batalha em grupo.
 *
 * ── RESPONSABILIDADES ────────────────────────────────────────────────────
 * Este módulo concentra SOMENTE regra de recompensa de grupo/boss:
 *   • Money (ouro): trainer=50g, boss=100g por participante
 *   • Drops:         itens gerados por tabela do encontro, para TODOS os participantes
 *   • Quest progress: progresso de quest para TODOS os participantes
 *
 * ── O QUE NÃO ESTÁ AQUI ──────────────────────────────────────────────────
 *   • XP de batalha → js/progression/xpActions.js (handleVictoryRewards)
 *   • Modal / UI    → js/ui/battleEndModal.js
 *   • Detecção de fim / turno → groupActions.js (advanceGroupTurn)
 *   • Save / render → index.html (após modal fechar)
 *
 * ── IDEMPOTÊNCIA ─────────────────────────────────────────────────────────
 * Cada seção é protegida por flag no encounter:
 *   enc.moneyGranted    → ouro já concedido
 *   enc.dropsGranted    → drops já gerados/distribuídos
 *   enc.questsProcessed → progresso de quest já aplicado
 * Isso garante que nenhuma recompensa seja duplicada, mesmo que a função
 * seja chamada mais de uma vez por rerender ou bug de race condition.
 *
 * ── PIPELINE CANÔNICO DE FIM DE BATALHA ──────────────────────────────────
 *   1. enc.finished + enc.result definidos em advanceGroupTurn
 *   2. XP distribuído por Progression.Actions.handleVictoryRewards (enc.rewardsGranted)
 *   3. processGroupVictoryRewards (este módulo) cuida de money/drops/quests
 *   4. BattleEndModal.showBattleEndModal exibe o resultado (enc._modalShown)
 *   5. Cleanup: currentEncounter=null, save, render
 *
 * ── DEPENDENCY INJECTION ─────────────────────────────────────────────────
 * Sem acesso direto a GameState, DOM, Data ou GameFlow.
 * Todas as dependências são injetadas via deps.helpers.
 */

/**
 * Constantes de recompensa por tipo de batalha.
 * XP é exibido no modal mas o valor efetivo vem de calculateBattleXP
 * (processado em Progression.Actions.handleVictoryRewards antes do modal).
 */
export const COMBAT_REWARDS = {
    trainer: { xp: 30, money: 50 },
    boss:    { xp: 50, money: 100 }
};

/**
 * Processa todas as recompensas de vitória em batalha de grupo (trainer ou boss).
 *
 * Idempotente: cada seção verifica sua flag antes de executar.
 * Retorna a lista de participantes já formatada para o modal.
 *
 * @param {Object}   enc  - Encounter com enc.result === 'victory'
 * @param {Object}   deps
 * @param {Object}   deps.state                              - { players: Array }
 * @param {Object}   deps.helpers
 * @param {Function} deps.helpers.awardMoney                 - (player, amount) → void
 * @param {Function} deps.helpers.getDropTableForEncounter   - (type, localId) → string|null
 * @param {Function} deps.helpers.generateDrops              - (tableId) → Array
 * @param {Function} deps.helpers.addDropsToInventory        - (player, drops) → void
 * @param {Function} deps.helpers.formatDropsLog             - (drops) → string[]
 * @param {Function} deps.helpers.handlePostEncounterFlow    - (player, enc, id, deps) → { log }
 * @param {Function} deps.helpers.createQuestDeps            - () → Object
 *
 * @returns {{ participants: Array<{playerName: string, xp: number, money: number}> }}
 */
export function processGroupVictoryRewards(enc, deps) {
    const { state, helpers } = deps;
    const participants = [];

    if (!enc || enc.result !== 'victory') return { participants };

    const rewards = enc.type === 'boss' ? COMBAT_REWARDS.boss : COMBAT_REWARDS.trainer;
    const eligibleIds = enc.participants || [];

    // ── Money (ouro) ─────────────────────────────────────────────────────
    // Somente group_trainer e boss concedem ouro.
    // Batalhas selvagens NÃO concedem ouro (regra de design).
    if (!enc.moneyGranted) {
        enc.moneyGranted = true;
        for (const pid of eligibleIds) {
            const player = state.players.find(p => p.id === pid);
            if (!player) continue;
            helpers.awardMoney(player, rewards.money);
        }
    }

    // ── Drops ────────────────────────────────────────────────────────────
    // Todos os participantes recebem drops da tabela do encontro.
    // Flag dropsGranted previne duplicação caso esta função seja chamada duas vezes.
    if (!enc.dropsGranted) {
        enc.dropsGranted = true;
        const dropTableId = helpers.getDropTableForEncounter(enc.type, enc.localId || null);
        if (dropTableId) {
            for (const pid of eligibleIds) {
                const player = state.players.find(p => p.id === pid);
                if (!player) continue;
                const drops = helpers.generateDrops(dropTableId);
                if (drops && drops.length > 0) {
                    helpers.addDropsToInventory(player, drops);
                    enc.log = enc.log || [];
                    const logLines = helpers.formatDropsLog(drops);
                    enc.log.push(`📦 Drops de ${player.name || player.nome}:`);
                    for (const line of logLines.slice(1)) {
                        enc.log.push(line);
                    }
                }
            }
        }
    }

    // ── Quest progress ────────────────────────────────────────────────────
    // Todos os participantes têm seu progresso de quest processado.
    // Flag questsProcessed previne duplicação.
    if (!enc.questsProcessed) {
        enc.questsProcessed = true;
        for (const pid of eligibleIds) {
            const player = state.players.find(p => p.id === pid);
            if (!player) continue;
            const questDeps = helpers.createQuestDeps();
            const result = helpers.handlePostEncounterFlow(player, enc, null, questDeps);
            enc.log = enc.log || [];
            for (const line of (result.log || [])) {
                enc.log.push(line);
            }
        }
    }

    // ── Construir lista de participantes para o modal ─────────────────────
    for (const pid of eligibleIds) {
        const player = state.players.find(p => p.id === pid);
        if (!player) continue;
        participants.push({
            playerName: player.name || player.nome || pid,
            xp:    rewards.xp,
            money: rewards.money
        });
    }

    return { participants };
}

/**
 * Processa recompensas terapêuticas de fim de batalha.
 *
 * Regras:
 * - Se nenhum participante fugiu: +20% XP para todos (bônus de cooperação)
 * - Se algum jogador curou aliado (therapyLog): registra "Amizade +5"
 *
 * Idempotente: protegida por enc._therapyRewardsProcessed.
 *
 * @param {object} enc  - Encounter com enc.result === 'victory'
 * @param {object} deps - { state, helpers }
 * @returns {{ highlights: string[] }}
 */
export function processTherapyRewards(enc, deps) {
    const highlights = [];
    if (!enc || enc.result !== 'victory') return { highlights };
    if (enc._therapyRewardsProcessed) return { highlights };
    enc._therapyRewardsProcessed = true;

    const { state, helpers } = deps;
    const therapyLog = enc.therapyLog || [];

    // Bônus de cooperação: nenhum participante fugiu
    const anyFled = therapyLog.some(e => e.event === 'flee');
    if (!anyFled) {
        enc.therapyNobodyFled = true;
        highlights.push('🤝 Ninguém fugiu! +20% XP de bônus para todos.');
        const eligibleIds = enc.participants || [];
        for (const pid of eligibleIds) {
            const player = state.players.find(p => p.id === pid);
            if (!player) continue;
            const activeMon = player.team?.[player.activeIndex ?? 0];
            if (!activeMon) continue;
            const xpBonus = Math.round((Number(activeMon.xp) || 0) * 0.20);
            if (xpBonus > 0 && helpers?.addXP) {
                helpers.addXP(activeMon, xpBonus);
            }
        }
    }

    // Bônus de amizade: algum jogador curou aliado
    const anyAllyHeal = therapyLog.some(e => e.event === 'ally_heal');
    if (anyAllyHeal) {
        highlights.push('💚 Amizade +5: alguém curou um aliado!');
    }

    return { highlights };
}
