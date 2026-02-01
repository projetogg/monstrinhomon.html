/**
 * GROUP COMBAT ACTIONS - Ações de Combate
 * 
 * PR5C: Implementação real extraída de index.html
 * 
 * Funções que modificam state, mas não mexem diretamente em DOM
 * Recebem dependências por parâmetro (dependency injection)
 */

import * as GroupCore from './groupCore.js';
import { initializeBattleParticipation, markAsParticipated, processBattleItemBreakage } from './itemBreakage.js';

/**
 * PR11B: Inicializa participação de batalha para group/boss
 * Deve ser chamado no início do encounter
 * 
 * @param {Array} playerMonsters - Monstrinhos dos jogadores
 * @param {Array} enemies - Inimigos (opcional)
 */
export function initializeGroupBattleParticipation(playerMonsters, enemies = []) {
    const monsters = [...playerMonsters, ...enemies];
    initializeBattleParticipation(monsters);
}

/**
 * PR5C: Executa ataque do jogador em combate de grupo
 * 
 * Extraído de: index.html groupAttack() (linhas 3546-3681)
 * 
 * @param {object} deps - Dependências injetadas
 * @param {object} deps.state - GameState
 * @param {object} deps.core - GroupCore functions
 * @param {object} deps.ui - UI functions
 * @param {object} deps.audio - Audio object
 * @param {object} deps.storage - Storage functions
 * @param {object} deps.helpers - Helper functions from index.html
 * @returns {boolean} true se ataque foi executado
 */
export function executePlayerAttackGroup(deps) {
    const { state, core, ui, audio, storage, helpers } = deps;
    
    const enc = state.currentEncounter;
    if (!enc || enc.finished) return false;

    const actor = core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return false;

    const player = helpers.getPlayerById(actor.id);
    const mon = helpers.getActiveMonsterOfPlayer(player);
    if (!player || !mon) return false;

    // PR11B: Marcar monstro como participante (entrou em campo como ativo)
    markAsParticipated(mon);

    // GAME_RULES.md: Em batalha, só pode usar monstros da mesma classe do jogador
    if (mon.class !== player.class) {
        alert(`⚠️ ${player.name}: Você só pode usar monstrinhos da classe ${player.class} em batalha!\n\nEste ${mon.name} é da classe ${mon.class}.\nREGRA: Em batalha, você só pode usar monstrinhos da SUA classe.`);
        return false;
    }

    if (!core.isAlive(mon)) {
        helpers.log(enc, "⚠️ Seu monstrinho está desmaiado. Não pode atacar.");
        storage.save();
        ui.render();
        return false;
    }

    // Aplicar ENE REGEN no início do turno do jogador
    helpers.applyEneRegen(mon, enc);
    
    // Atualizar buffs (reduzir duração)
    helpers.updateBuffs(mon);

    // Alvo: primeiro inimigo vivo
    let enemyIndex = 0;
    while (enemyIndex < (enc.enemies?.length || 0) && !core.isAlive(enc.enemies[enemyIndex])) enemyIndex++;

    const enemy = helpers.getEnemyByIndex(enc, enemyIndex);
    if (!enemy || !core.isAlive(enemy)) {
        helpers.log(enc, "ℹ️ Não há inimigos vivos para atacar.");
        storage.save();
        ui.render();
        return false;
    }

    const d20 = helpers.rollD20();
    
    const alwaysMiss = (d20 === 1);
    const isCrit = (d20 === 20);
    const hit = !alwaysMiss && (isCrit || core.checkHit(d20, mon, enemy));

    const attackerName = player.name || player.nome || actor.name || "Jogador";
    const monName = mon.nickname || mon.name || mon.nome || "Monstrinho";
    const enemyName = enemy.name || enemy.nome || "Inimigo";
    
    // Feature 3.8: Record d20 roll
    const rollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
    helpers.recordD20Roll(enc, attackerName, d20, rollType);

    // Feature 4.4: Play attack sound
    ui.playAttackFeedback(d20, hit, isCrit, audio);

    if (!hit) {
        helpers.log(enc, `🎲 ${attackerName} (${monName}) rolou ${d20} e ERROU o ataque em ${enemyName}.`);
        
        // Feature 3.8: Flash fail on player
        ui.showMissFeedback(`grpP_${actor.id}`);
        
        advanceGroupTurn(enc, deps);
        storage.save();
        ui.render();
        return true;
    }

    // POWER básico
    const basicPower = helpers.getBasicAttackPower(mon.class);
    let powerUsed = basicPower;

    if (isCrit) {
        powerUsed = basicPower * 2;
        helpers.log(enc, `💥 CRIT 20! ${monName} ativou Poder Duplo!`);
    }

    // Aplicar modificadores de buff
    const atkMods = core.getBuffModifiers(mon);
    const effectiveAtk = Math.max(1, (Number(mon.atk) || 0) + atkMods.atk);
    
    const defMods = core.getBuffModifiers(enemy);
    const effectiveDef = Math.max(1, (Number(enemy.def) || 0) + defMods.def);

    // Calcular vantagem de classe
    const classAdv = state.config?.classAdvantages?.[mon.class];
    let damageMult = 1.0;
    if (classAdv?.strong === enemy.class) {
        damageMult = 1.10;
    } else if (classAdv?.weak === enemy.class) {
        damageMult = 0.90;
    }

    const dmg = core.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,
        power: powerUsed,
        damageMult: damageMult
    });
    
    // Apply damage
    helpers.applyDamage(enemy, dmg);
    
    // PR11B: Marcar que o inimigo participou (recebeu dano)
    markAsParticipated(enemy);

    helpers.log(enc, `🎲 ${attackerName} (${monName}) rolou ${d20} e acertou ${enemyName} causando ${dmg} de dano!`);
    
    // Feature 3.8: Visual feedback
    storage.save();
    ui.render();
    ui.showDamageFeedback(`grpE_${enemyIndex}`, dmg, isCrit);

    if (!core.isAlive(enemy)) {
        helpers.log(enc, `🏁 ${enemyName} foi derrotado!`);
    }

    advanceGroupTurn(enc, deps);
    storage.save();
    ui.render();
    return true;
}

/**
 * PR5C: Processa turno do inimigo em combate de grupo
 * 
 * Extraído de: index.html processEnemyTurnGroup() (linhas 3689-3833)
 * 
 * @param {object} enc - Encounter ativo
 * @param {object} deps - Dependências injetadas
 * @returns {boolean} true se turno foi processado
 */
export function executeEnemyTurnGroup(enc, deps) {
    const { state, core, ui, audio, storage, helpers } = deps;
    
    if (!enc || enc.finished) return false;

    const actor = core.getCurrentActor(enc);
    if (!actor || actor.side !== 'enemy') return false;

    const enemy = helpers.getEnemyByIndex(enc, actor.id);
    if (!enemy || !core.isAlive(enemy)) {
        advanceGroupTurn(enc, deps);
        storage.save();
        ui.render();
        return false;
    }

    // Aplicar ENE REGEN no início do turno do inimigo
    helpers.applyEneRegen(enemy, enc);
    
    // Atualizar buffs (reduzir duração)
    helpers.updateBuffs(enemy);

    // Escolhe alvo (menor HP%)
    const targetPid = helpers.chooseTargetPlayerId(enc);
    if (!targetPid) {
        advanceGroupTurn(enc, deps);
        storage.save();
        ui.render();
        return false;
    }

    const targetPlayer = helpers.getPlayerById(targetPid);
    const targetMon = helpers.getActiveMonsterOfPlayer(targetPlayer);

    const enemyName = enemy.name || actor.name || "Inimigo";
    const targetName = targetPlayer?.name || targetPlayer?.nome || "Jogador";
    const targetMonName = targetMon?.nickname || targetMon?.name || targetMon?.nome || "Monstrinho";

    const d20 = helpers.rollD20();

    const alwaysMiss = (d20 === 1);
    const isCrit = (d20 === 20);
    const hit = !alwaysMiss && (isCrit || core.checkHit(d20, enemy, targetMon));
    
    // Feature 3.8: Record d20 roll
    const rollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
    helpers.recordD20Roll(enc, enemyName, d20, rollType);

    // Feature 4.4: Enemy attack sound (group)
    ui.playAttackFeedback(d20, hit, isCrit, audio);

    if (!hit) {
        helpers.log(enc, `🎲 ${enemyName} rolou ${d20} e ERROU o ataque em ${targetName} (${targetMonName}).`);
        
        // Feature 3.8: Flash fail on enemy
        const enemyIndex = enc.enemies.indexOf(enemy);
        ui.showMissFeedback(`grpE_${enemyIndex}`);
        
        advanceGroupTurn(enc, deps);
        storage.save();
        ui.render();
        return true;
    }

    // POWER básico do inimigo
    const basicPower = helpers.getBasicAttackPower(enemy.class);
    let powerUsed = basicPower;

    if (isCrit) {
        powerUsed = basicPower * 2;
        helpers.log(enc, `💥 CRIT 20! ${enemyName} ativou Poder Duplo!`);
    }

    // Aplicar modificadores de buff
    const atkMods = core.getBuffModifiers(enemy);
    const effectiveAtk = Math.max(1, (Number(enemy.atk) || 0) + atkMods.atk);
    
    const defMods = core.getBuffModifiers(targetMon);
    const effectiveDef = Math.max(1, (Number(targetMon?.def) || 0) + defMods.def);

    // Calcular vantagem de classe
    const classAdv = state.config?.classAdvantages?.[enemy.class];
    let damageMult = 1.0;
    if (classAdv?.strong === targetMon?.class) {
        damageMult = 1.10;
    } else if (classAdv?.weak === targetMon?.class) {
        damageMult = 0.90;
    }

    const dmg = core.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,
        power: powerUsed,
        damageMult: damageMult
    });
    
    // Apply damage
    helpers.applyDamage(targetMon, dmg);
    
    // PR11B: Marcar que o monstro do jogador participou (recebeu dano)
    markAsParticipated(targetMon);
    // PR11B: Marcar que o inimigo participou (causou dano)
    markAsParticipated(enemy);

    helpers.log(enc, `🎲 ${enemyName} rolou ${d20} e acertou ${targetName} (${targetMonName}) causando ${dmg} de dano!`);
    
    // Feature 3.8: Visual feedback
    storage.save();
    ui.render();
    ui.showDamageFeedback(`grpP_${targetPid}`, dmg, isCrit);

    if (!core.isAlive(targetMon)) {
        helpers.log(enc, `💀 ${targetName} (${targetMonName}) foi derrotado!`);
        
        // Check if player has other alive monsters
        const aliveIdx = helpers.firstAliveIndex(targetPlayer.team);
        if (aliveIdx >= 0) {
            // Player has other monsters - need to switch
            // Save state and open modal
            storage.save();
            ui.render();
            
            // Open modal for replacement (async)
            setTimeout(() => {
                helpers.openSwitchMonsterModal(targetPlayer, enc);
            }, 100);
            return true; // Don't advance turn yet - modal will handle it
        } else {
            // Player has no more monsters - they're out
            helpers.log(enc, `⚠️ ${targetName} não tem mais monstrinhos vivos!`);
        }
    }

    advanceGroupTurn(enc, deps);
    storage.save();
    ui.render();
    return true;
}

/**
 * PR5C: Avança para próximo turno válido
 * 
 * Extraído de: index.html advanceTurn() (linhas 3238-3314)
 * 
 * @param {object} enc - Encounter ativo
 * @param {object} deps - Dependências injetadas
 */
export function advanceGroupTurn(enc, deps) {
    const { state, core, audio, helpers } = deps;
    
    if (!enc || !enc.turnOrder || enc.turnOrder.length === 0) return;
    
    // Verificar condições de fim
    const alivePlayers = core.hasAlivePlayers(enc, state.players);
    const aliveEnemies = core.hasAliveEnemies(enc);
    
    if (!aliveEnemies) {
        enc.finished = true;
        enc.result = "victory";
        enc.active = false;
        enc.log = enc.log || [];
        enc.log.push("🏁 Vitória! Todos os inimigos foram derrotados.");
        
        // Feature 4.4: Victory sound (com idempotência)
        if (!enc._winSfxPlayed) {
            audio.playSfx("win");
            enc._winSfxPlayed = true;
        }
        
        // Distribuir recompensas (XP) com idempotência
        helpers.handleVictoryRewards(enc);
        
        // PR11B: Processar quebra de itens para todos os jogadores
        const allPlayerMonsters = [];
        for (const pid of (enc.participants || [])) {
            const player = state.players.find(p => p.id === pid);
            if (player && Array.isArray(player.team)) {
                allPlayerMonsters.push(...player.team);
            }
        }
        processBattleItemBreakage(allPlayerMonsters, {
            log: (msg) => helpers.log(enc, msg)
        });
        
        return;
    }
    
    if (!alivePlayers) {
        enc.finished = true;
        enc.result = "defeat";
        enc.active = false;
        enc.log = enc.log || [];
        enc.log.push("💀 Derrota... Todos os participantes foram derrotados.");
        
        // Feature 4.4: Defeat sound (com idempotência)
        if (!enc._loseSfxPlayed) {
            audio.playSfx("lose");
            enc._loseSfxPlayed = true;
        }
        
        // PR11B: Processar quebra de itens para todos os jogadores
        const allPlayerMonsters = [];
        for (const pid of (enc.participants || [])) {
            const player = state.players.find(p => p.id === pid);
            if (player && Array.isArray(player.team)) {
                allPlayerMonsters.push(...player.team);
            }
        }
        processBattleItemBreakage(allPlayerMonsters, {
            log: (msg) => helpers.log(enc, msg)
        });
        
        return;
    }
    
    // Avançar para próximo ator válido
    const maxLoops = enc.turnOrder.length + 2;
    let loops = 0;
    
    do {
        enc.turnIndex = ((Number(enc.turnIndex) || 0) + 1) % enc.turnOrder.length;
        loops++;
        
        const actor = core.getCurrentActor(enc);
        if (!actor) break;
        
        // Validar se ator ainda está vivo
        if (actor.side === "player") {
            const p = state.players.find(x => x.id === actor.id);
            const mon = p?.team?.[0];
            if (mon && (Number(mon.hp) || 0) > 0) break;
        } else {
            const e = enc.enemies?.[actor.id];
            if (e && (Number(e.hp) || 0) > 0) break;
        }
        
    } while (loops < maxLoops);
    
    // Atualizar currentActor
    enc.currentActor = core.getCurrentActor(enc);
    
    // Auto-trigger turno do inimigo
    const actorNow = core.getCurrentActor(enc);
    if (actorNow && actorNow.side === "enemy" && !enc.finished) {
        executeEnemyTurnGroup(enc, deps);
    } else if (actorNow) {
        enc.log = enc.log || [];
        enc.log.push(`⏺️ Turno: ${actorNow.name}`);
    }
}

/**
 * PR5C: Passa turno sem ação
 * 
 * Extraído de: index.html groupPassTurn() (linhas 3320-3337)
 * 
 * @param {object} deps - Dependências injetadas
 */
export function passTurn(deps) {
    const { state, core, storage, ui } = deps;
    
    const enc = state.currentEncounter;
    if (!enc) return;
    
    const actor = core.getCurrentActor(enc);
    if (!actor) return;
    
    enc.log.push(`▶️ ${actor.name} passou o turno`);
    
    advanceGroupTurn(enc, deps);
    storage.save();
    ui.render();
}
