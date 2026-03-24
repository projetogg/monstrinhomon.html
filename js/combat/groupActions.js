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
 * Constrói array de alvos elegíveis para IA
 * 
 * Critérios de elegibilidade:
 * - Participante do encounter
 * - Monstrinho ativo vivo (hp > 0)
 * - Não fugiu (futuro: verificar flag de fuga)
 * 
 * @param {object} enc - Encounter ativo
 * @param {object} deps - Dependências (state, helpers)
 * @returns {array} Array de alvos: [{ playerId, monster, heldItem }]
 */
export function buildEligibleTargets(enc, deps) {
    const { state, helpers } = deps;
    const targets = [];
    
    for (const playerId of (enc.participants || [])) {
        const player = helpers.getPlayerById(playerId);
        if (!player) continue;
        
        const monster = helpers.getActiveMonsterOfPlayer(player);
        if (!monster || !GroupCore.isAlive(monster)) continue;
        
        // Buscar item equipado (se houver)
        let heldItem = null;
        if (monster.heldItemId) {
            heldItem = helpers.getItemById?.(monster.heldItemId) || null;
        }
        
        targets.push({
            playerId: playerId,
            monster: monster,
            heldItem: heldItem
        });
    }
    
    return targets;
}

/**
 * Resolve o índice do inimigo alvo.
 * Se `targetIndex` for fornecido, usa-o; caso contrário, procura o primeiro inimigo vivo.
 *
 * @param {object} enc - Encounter atual
 * @param {number|null} targetIndex - Índice preferencial ou null
 * @param {object} core - GroupCore (usado para isAlive)
 * @returns {number} Índice do inimigo alvo
 */
function resolveEnemyIndex(enc, targetIndex, core) {
    if (targetIndex != null) return targetIndex;
    let idx = 0;
    while (idx < (enc.enemies?.length || 0) && !core.isAlive(enc.enemies[idx])) idx++;
    return idx;
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
export function executePlayerAttackGroup(deps, targetEnemyIndex = null) {
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

    // Alvo: inimigo especificado ou primeiro inimigo vivo
    const enemyIndex = resolveEnemyIndex(enc, targetEnemyIndex, core);

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
    // Bug Fix #3: Adicionar classAdvantages como 4º parâmetro
    const hit = !alwaysMiss && (isCrit || core.checkHit(d20, mon, enemy, state.config?.classAdvantages));

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

    // Bug Fix #4: Usar getClassAdvantageModifiers() corretamente
    const classAdv = core.getClassAdvantageModifiers(
        mon.class,
        enemy.class,
        state.config?.classAdvantages
    );

    const dmg = core.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,
        power: powerUsed,
        damageMult: classAdv.damageMult
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

    // IA v1: Escolhe alvo por DEF (aggro)
    // Inicializar recentTargets se não existir
    if (!enc.recentTargets) {
        enc.recentTargets = {};
    }
    
    const eligibleTargets = buildEligibleTargets(enc, deps);
    const targetPid = GroupCore.pickEnemyTargetByDEF(eligibleTargets, enc.recentTargets);
    
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
    // Bug Fix #5: Adicionar classAdvantages como 4º parâmetro
    const hit = !alwaysMiss && (isCrit || core.checkHit(d20, enemy, targetMon, state.config?.classAdvantages));
    
    // Feature 3.8: Record d20 roll
    const rollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
    helpers.recordD20Roll(enc, enemyName, d20, rollType);

    // Feature 4.4: Enemy attack sound (group)
    ui.playAttackFeedback(d20, hit, isCrit, audio);

    if (!hit) {
        helpers.log(enc, `🎲 ${enemyName} rolou ${d20} e ERROU o ataque em ${targetName} (${targetMonName}).`);
        
        // Feature 3.8: Flash fail on enemy
        // Bug Fix #8: Usar actor.id diretamente (já é o índice)
        ui.showMissFeedback(`grpE_${actor.id}`);
        
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

    // Bug Fix #4: Usar getClassAdvantageModifiers() corretamente
    const classAdv = core.getClassAdvantageModifiers(
        enemy.class,
        targetMon?.class,
        state.config?.classAdvantages
    );

    const dmg = core.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,
        power: powerUsed,
        damageMult: classAdv.damageMult
    });
    
    // Apply damage
    helpers.applyDamage(targetMon, dmg);
    
    // PR11B: Marcar que o monstro do jogador participou (recebeu dano)
    markAsParticipated(targetMon);
    // PR11B: Marcar que o inimigo participou (causou dano)
    markAsParticipated(enemy);
    
    // IA v1: Atualizar recentTargets para focusPenalty
    enc.recentTargets[targetPid] = (enc.recentTargets[targetPid] || 0) + 1;

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
            log: (msg) => helpers.log(enc, msg),
            notify: (monster, itemDef) => {
                if (typeof window.showToast === 'function') {
                    window.showToast(`💥 ${itemDef.name} quebrou!`, 'warning');
                }
            }
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
            log: (msg) => helpers.log(enc, msg),
            notify: (monster, itemDef) => {
                if (typeof window.showToast === 'function') {
                    window.showToast(`💥 ${itemDef.name} quebrou!`, 'warning');
                }
            }
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

/**
 * CAMADA 4C: Executa skill real do jogador em combate de grupo
 *
 * Suporta:
 * - Habilidades de Ataque/Controle (target: 'Inimigo' ou 'Área') → dano + rolagem d20
 * - Habilidades de Cura/Suporte (target: 'Aliado' ou 'Self') → cura/buff no caster
 *
 * @param {string} skillId         - ID da skill (ex: 'SK_WAR_01')
 * @param {number|null} enemyIndex - Índice do inimigo alvo (para skills ofensivas)
 * @param {object} deps            - Dependências injetadas (mesmo padrão de executePlayerAttackGroup)
 * @returns {boolean} true se a ação foi executada com sucesso
 */
export function executePlayerSkillGroup(skillId, enemyIndex, deps) {
    const { state, core, ui, audio, storage, helpers } = deps;

    const enc = state.currentEncounter;
    if (!enc || enc.finished) return false;

    const actor = core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return false;

    const player = helpers.getPlayerById(actor.id);
    const mon = helpers.getActiveMonsterOfPlayer(player);
    if (!player || !mon) return false;

    // PR11B: Marcar monstro como participante
    markAsParticipated(mon);

    if (!core.isAlive(mon)) {
        helpers.log(enc, "⚠️ Seu monstrinho está desmaiado. Não pode usar habilidades.");
        storage.save();
        ui.render();
        return false;
    }

    // Buscar definição da skill
    const skill = helpers.getSkillById(skillId);
    if (!skill) {
        helpers.log(enc, `⚠️ Habilidade não encontrada: ${skillId}`);
        storage.save();
        ui.render();
        return false;
    }

    // Verificar ENE suficiente
    if (!helpers.canUseSkillNow(skill, mon)) {
        const cost = Number(skill.energy_cost ?? skill.eneCost ?? skill.cost ?? 0) || 0;
        helpers.log(enc, `⚠️ ENE insuficiente para ${skill.name} (custo: ${cost}, atual: ${mon.ene ?? 0}).`);
        storage.save();
        ui.render();
        return false;
    }

    // Aplicar ENE REGEN e buffs no início do turno
    helpers.applyEneRegen(mon, enc);
    helpers.updateBuffs(mon);

    // Consumir ENE
    const eneCost = Number(skill.energy_cost ?? skill.eneCost ?? skill.cost ?? 0) || 0;
    mon.ene = Math.max(0, (Number(mon.ene) || 0) - eneCost);

    const attackerName = player.name || player.nome || actor.name || "Jogador";
    const monName = mon.nickname || mon.name || mon.nome || "Monstrinho";
    const skillName = skill.name || skillId;
    const skillTarget = skill.target || '';
    const skillCategory = skill.category || '';

    // Habilidades ofensivas: Inimigo ou Área de ataque
    const isOffensive = skillTarget === 'Inimigo' ||
        (skillTarget === 'Área' && (skillCategory === 'Ataque' || skillCategory === 'Controle'));

    if (isOffensive) {
        // Localizar alvo inimigo usando helper compartilhado
        const tIdx = resolveEnemyIndex(enc, enemyIndex, core);

        const enemy = helpers.getEnemyByIndex(enc, tIdx);
        if (!enemy || !core.isAlive(enemy)) {
            helpers.log(enc, "ℹ️ Não há inimigos vivos para usar a habilidade.");
            storage.save();
            ui.render();
            return false;
        }

        const enemyName = enemy.name || enemy.nome || "Inimigo";

        // Rolagem d20 para acurácia da skill
        const d20 = helpers.rollD20();
        const alwaysMiss = (d20 === 1);
        const isCrit = (d20 === 20);
        // Calcular threshold de acerto: accuracy 0-1 → d20 > (1-accuracy)*20
        const missThreshold = Math.round((1 - (Number(skill.accuracy) || 1)) * 20);
        const hit = !alwaysMiss && (isCrit || d20 > missThreshold);

        const rollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
        helpers.recordD20Roll(enc, attackerName, d20, rollType);
        ui.playAttackFeedback(d20, hit, isCrit, audio);

        if (!hit) {
            helpers.log(enc, `✨ ${attackerName} (${monName}) usou ${skillName} e ERROU! (rolou ${d20})`);
            ui.showMissFeedback(`grpP_${actor.id}`);
            advanceGroupTurn(enc, deps);
            storage.save();
            ui.render();
            return true;
        }

        // Calcular dano com poder da skill
        const atkMods = core.getBuffModifiers(mon);
        const effectiveAtk = Math.max(1, (Number(mon.atk) || 0) + atkMods.atk);
        const defMods = core.getBuffModifiers(enemy);
        const effectiveDef = Math.max(1, (Number(enemy.def) || 0) + defMods.def);
        const classAdv = core.getClassAdvantageModifiers(
            mon.class,
            enemy.class,
            state.config?.classAdvantages
        );

        let power = Number(skill.power) || 0;
        if (isCrit) power = power * 2;

        const dmg = core.calcDamage({
            atk: effectiveAtk,
            def: effectiveDef,
            power: power,
            damageMult: classAdv.damageMult
        });

        helpers.applyDamage(enemy, dmg);
        markAsParticipated(enemy);

        const critText = isCrit ? ' CRÍTICO! 🌟' : '';
        helpers.log(enc, `✨ ${attackerName} (${monName}) usou ${skillName}! ${enemyName} recebe ${dmg} de dano!${critText}`);
        ui.showDamageFeedback(`grpE_${tIdx}`, dmg, isCrit);

        if (!core.isAlive(enemy)) {
            helpers.log(enc, `🏁 ${enemyName} foi derrotado!`);
        }

    } else {
        // Habilidades defensivas: Cura / Suporte (Self, Aliado, Área de suporte)
        const healPower = Number(skill.power) || 0;
        const hpMax = Number(mon.hpMax) || 1;
        // Se power = 0, cura 20% do HP máximo
        const healAmt = healPower > 0 ? healPower : Math.round(hpMax * 0.20);
        mon.hp = Math.min(hpMax, (Number(mon.hp) || 0) + healAmt);
        helpers.log(enc, `💚 ${monName} usou ${skillName}! Recuperou ${healAmt} HP!`);
    }

    advanceGroupTurn(enc, deps);
    storage.save();
    ui.render();
    return true;
}
