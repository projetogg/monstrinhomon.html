/**
 * XP ACTIONS MODULE (PR8B)
 * Funções de orquestração de progressão com Dependency Injection
 * Pode tocar state, storage, UI, audio, templates (via DI)
 */

/**
 * Dá XP para um monstro e processa level ups
 * @param {Object} deps - Dependências injetadas
 * @param {Object} mon - Monstro que receberá XP
 * @param {number} amount - Quantidade de XP
 * @param {Array} logArr - Array de log (opcional)
 */
export function giveXP(deps, mon, amount, logArr) {
    if (!mon) return;
    
    deps.helpers.ensureMonsterProgressFields(mon);
    
    const baseXpGain = Math.max(0, Number(amount) || 0);
    if (baseXpGain <= 0) return;
    
    // SISTEMA DE AMIZADE: Aplicar multiplicador de XP baseado em amizade
    const friendshipBonuses = deps.helpers.getFriendshipBonuses(
        mon.friendship || deps.constants.DEFAULT_FRIENDSHIP
    );
    const xpGain = Math.round(baseXpGain * friendshipBonuses.xpMultiplier);
    
    const name = mon.nickname || mon.name || mon.nome || "Monstrinho";
    mon.xp += xpGain;
    
    // Logar no array fornecido ou no encounter atual
    const log = Array.isArray(logArr) ? logArr : (deps.state.currentEncounter?.log || []);
    if (Array.isArray(log)) {
        const bonusText = friendshipBonuses.xpMultiplier > 1.0 
            ? ` (Bônus Amizade: +${deps.helpers.formatFriendshipBonusPercent(friendshipBonuses.xpMultiplier)}%)`
            : '';
        log.push(`🧪 ${name} ganhou +${xpGain} XP.${bonusText}`);
    }
    
    // Loop de level ups (pode subir múltiplos níveis de uma vez)
    while (mon.xp >= mon.xpNeeded) {
        mon.xp -= mon.xpNeeded;
        levelUpMonster(deps, mon, log);
    }
}

/**
 * Processa um level up para o monstro
 * @param {Object} deps - Dependências injetadas
 * @param {Object} mon - Monstro que vai subir de nível
 * @param {Array} logArr - Array de log (opcional)
 */
export function levelUpMonster(deps, mon, logArr) {
    if (!mon) return;
    
    deps.helpers.ensureMonsterProgressFields(mon);
    
    // Capturar HP% ANTES do level up para preservar na evolução
    const hpPctBeforeLevelUp = Math.max(0, Number(mon.hp) || 0) / Math.max(1, Number(mon.hpMax) || 1);
    
    mon.level++;
    
    // Aumentar HP Max (fórmula oficial: hpMax * 1.04 + 2)
    const hpMax = Number(mon.hpMax) || Number(mon.maxHp) || 1;
    mon.hpMax = Math.floor(hpMax * 1.04 + 2);
    
    // Curar completamente ao subir de nível
    mon.hp = mon.hpMax;
    
    // Atualizar ENE Max (cresce com level)
    const baseEne = 10; // base padrão
    const eneGrowth = 2; // crescimento por nível
    mon.eneMax = Math.floor(baseEne + eneGrowth * (mon.level - 1));
    mon.ene = mon.eneMax; // Restaurar ENE ao subir de nível
    
    // Recalcular stats baseado no novo nível
    deps.helpers.recalculateStatsFromTemplate(mon);
    
    // Próximo XP necessário
    mon.xpNeeded = deps.helpers.calcXpNeeded(mon.level);
    
    // Log com emoji especial
    const log = Array.isArray(logArr) ? logArr : (deps.state.currentEncounter?.log || []);
    const name = mon.nickname || mon.name || mon.nome || "Monstrinho";
    if (Array.isArray(log)) {
        log.push(`✨ ${name} subiu para o nível ${mon.level}!`);
    }
    
    // SISTEMA DE AMIZADE: Ganhar amizade ao subir de nível
    deps.helpers.updateFriendship(mon, 'levelUp');
    
    // Verificar e aplicar evolução após level up (passa o HP% original)
    deps.helpers.maybeEvolveAfterLevelUp(mon, log, hpPctBeforeLevelUp);
    
    // Verificar e aplicar upgrade de skills (Feature 3.6)
    deps.helpers.maybeUpgradeSkillsModelB(mon, log);
}

/**
 * Processa recompensas de vitória (XP, itens, moeda, amizade)
 * @param {Object} deps - Dependências injetadas
 * @param {Object} enc - Encounter object
 */
export function handleVictoryRewards(deps, enc) {
    if (!enc || enc.rewardsGranted) return;
    enc.rewardsGranted = true;
    
    enc.log = enc.log || [];
    
    // Determinar inimigo derrotado principal (primeiro inimigo)
    const defeated = (enc.enemies && enc.enemies[0]) ? enc.enemies[0] : enc.wildMonster;
    if (!defeated) {
        enc.log.push("ℹ️ (XP) Não foi possível identificar inimigo derrotado.");
        return;
    }
    
    // FASE 1 POKEMON: Rastrear vitória
    deps.helpers.updateStats('battlesWon', 1);
    
    // Calcular XP
    const xp = deps.helpers.calculateBattleXP(defeated, enc.type);
    enc.rewards = enc.rewards || {};
    enc.rewards.xp = xp;
    enc.log.push(`🏅 Recompensa: ${xp} XP.`);
    
    // FASE 1 POKEMON: Rastrear XP total ganho
    deps.helpers.updateStats('totalXpGained', xp);
    
    // Distribuir XP baseado no tipo de batalha
    const isGroup = String(enc.type || '').includes("group") || 
                   String(enc.type || '').toLowerCase() === "boss" ||
                   enc.participants?.length > 0;
    
    if (isGroup) {
        // Grupo: cada participante vivo recebe XP completo
        for (const pid of (enc.participants || [])) {
            const p = deps.state.players.find(x => x.id === pid);
            const mon = p?.team?.[0];
            if (!mon || (Number(mon.hp) || 0) <= 0) continue;
            giveXP(deps, mon, xp, enc.log);
        }
    } else {
        // 1v1: jogador atual (ou primeiro se não especificado)
        let player = null;
        if (enc.selectedPlayerId || enc.currentPlayerId) {
            player = deps.state.players.find(p => 
                p.id === (enc.selectedPlayerId || enc.currentPlayerId)
            );
        }
        if (!player) player = deps.state.players?.[0] || null;
        
        const mon = player?.team?.[0];
        if (mon && (Number(mon.hp) || 0) > 0) {
            giveXP(deps, mon, xp, enc.log);
        }
    }
}

/**
 * Recalcula stats do monstro baseado no nível e raridade
 * (Incluído para completude, mas delegates para helper)
 * @param {Object} deps - Dependências injetadas
 * @param {Object} mon - Monstro para recalcular
 */
export function recalculateStatsFromTemplate(deps, mon) {
    deps.helpers.recalculateStatsFromTemplate(mon);
}
