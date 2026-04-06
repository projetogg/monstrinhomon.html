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
import { isOffensiveSkill } from './skillResolver.js';

/**
 * Passivas de combate por classe — aplicadas após cálculo de dano base.
 * defenseBonus: redução percentual de dano recebido (ex.: 0.15 = -15%)
 * attackBonus: aumento percentual de dano causado (ex.: 0.10 = +10%)
 */
const CLASS_COMBAT_PASSIVES = {
    'Guerreiro':  { defenseBonus: 0.15 },  // resistência passiva: -15% dano recebido
    'Bárbaro':    { defenseBonus: 0.10 },  // resistência passiva: -10% dano recebido
    'Curandeiro': { defenseBonus: 0.10 },  // resistência passiva: -10% dano recebido
    'Ladino':     { attackBonus:  0.10 },  // precisão: +10% dano causado
};

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
        powerUsed = Math.round(basicPower * 1.5); // A1: crit ×1.5 (era ×2)
        helpers.log(enc, `💥 CRIT 20! ${monName} ativou Poder Reforçado!`);
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

    let dmg = core.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,
        power: powerUsed,
        damageMult: classAdv.damageMult
    });

    // A4: Passiva ofensiva do atacante (Ladino +10% dano)
    const atkClassPassive = CLASS_COMBAT_PASSIVES[mon.class];
    if (atkClassPassive?.attackBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 + atkClassPassive.attackBonus)));
    }

    // A4: Passiva defensiva do defensor (Guerreiro/Bárbaro/Curandeiro)
    const defClassPassive = CLASS_COMBAT_PASSIVES[enemy.class];
    if (defClassPassive?.defenseBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 - defClassPassive.defenseBonus)));
    }
    
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
/**
 * Verifica participantes com ativo morto e trata corretamente cada caso:
 * - Com substitutos elegíveis (classe-válidos): retorna o primeiro para abrir modal de troca.
 * - Sem substitutos elegíveis: elimina da batalha (remove de enc.participants) e loga.
 *
 * Chamada internamente por executeEnemyTurnGroup quando não há alvo válido.
 * Também pode ser usada por advanceGroupTurn para detectar necessidade de troca.
 *
 * @param {object} enc  - Encounter ativo
 * @param {object} deps - Dependências injetadas
 * @returns {object|null} primeiro jogador que precisa trocar (tem substitutos), ou null
 */
function findPlayerNeedingSwitch(enc, deps) {
    const { helpers, state } = deps;
    let firstNeedingSwitch = null;
    // Itera em cópia para permitir mutação de enc.participants durante o loop
    for (const pid of [...(enc.participants || [])]) {
        const p = helpers.getPlayerById(pid);
        if (!p) continue;
        const activeMon = helpers.getActiveMonsterOfPlayer(p);
        if (!GroupCore.isAlive(activeMon)) {
            // Verificar substitutos elegíveis respeitando restrição de classe
            const subs = GroupCore.getEligibleSubstitutes(p, state.config);
            if (subs.length > 0) {
                if (!firstNeedingSwitch) firstNeedingSwitch = p;
            } else {
                // Sem substitutos válidos: eliminar da batalha
                enc.participants = (enc.participants || []).filter(id => id !== pid);
                helpers.log(enc, `💀 ${p.name || p.nome} não tem mais monstrinhos válidos e saiu da batalha!`);
            }
        }
    }
    return firstNeedingSwitch;
}

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
        // BUG FIX: Se um jogador tem o monstro ativo morto mas possui substituto vivo,
        // abrir o modal de troca em vez de chamar advanceGroupTurn recursivamente
        // (causaria loop infinito enquanto o jogador não tiver monstro ativo vivo).
        const playerNeedingSwitch = findPlayerNeedingSwitch(enc, deps);
        if (playerNeedingSwitch) {
            storage.save();
            ui.render();
            setTimeout(() => helpers.openSwitchMonsterModal(playerNeedingSwitch, enc), 100);
        } else {
            // Nenhum substituto disponível — avançar turno normalmente (vai detectar derrota)
            advanceGroupTurn(enc, deps);
            storage.save();
            ui.render();
        }
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
        powerUsed = Math.round(basicPower * 1.5); // A1: crit ×1.5 (era ×2)
        helpers.log(enc, `💥 CRIT 20! ${enemyName} ativou Poder Reforçado!`);
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

    let dmg = core.calcDamage({
        atk: effectiveAtk,
        def: effectiveDef,
        power: powerUsed,
        damageMult: classAdv.damageMult
    });

    // A4: Passiva ofensiva do inimigo atacante (Ladino +10% dano)
    const atkClassPassive = CLASS_COMBAT_PASSIVES[enemy.class];
    if (atkClassPassive?.attackBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 + atkClassPassive.attackBonus)));
    }

    // A4: Passiva defensiva do defensor (Guerreiro/Bárbaro/Curandeiro)
    const defClassPassive = CLASS_COMBAT_PASSIVES[targetMon?.class];
    if (defClassPassive?.defenseBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 - defClassPassive.defenseBonus)));
    }
    
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
        
        // Verificar substitutos elegíveis respeitando restrição de classe (GAME_RULES.md)
        const eligibleSubs = GroupCore.getEligibleSubstitutes(targetPlayer, state.config);
        if (eligibleSubs.length > 0) {
            // Jogador tem substitutos válidos — abrir modal de troca
            storage.save();
            ui.render();
            
            // Chamar modal de troca (render já executou; modal será exibido sobre a UI atualizada)
            helpers.openSwitchMonsterModal(targetPlayer, enc);
            return true; // Don't advance turn yet - modal will handle it
        } else {
            // Jogador sem substitutos válidos: eliminar da batalha
            enc.participants = (enc.participants || []).filter(pid => pid !== targetPlayer.id);
            helpers.log(enc, `💀 ${targetName} não tem mais monstrinhos válidos e saiu da batalha!`);
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

    // ── Guard: encounter mal inicializado ─────────────────────────────────
    // Se turnOrder estiver vazio ou ausente, o encounter não foi preparado
    // corretamente. Logar e abortar em vez de silenciar o bug.
    // CAUSA PROVÁVEL: calculateTurnOrder() não foi chamado antes do loop.
    if (!enc) return;
    if (!enc.turnOrder || enc.turnOrder.length === 0) {
        if (typeof console !== 'undefined') {
            console.error(
                '[advanceGroupTurn] turnOrder vazio — encounter mal inicializado:',
                enc?.id,
                '— Chame calculateTurnOrder() antes de iniciar o loop de combate.'
            );
        }
        return;
    }
    
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
                // Preferir showToast injetado via deps; fallback para window.showToast (global legado)
                const toastFn = helpers.showToast ?? (typeof window !== 'undefined' ? window.showToast : null);
                if (typeof toastFn === 'function') {
                    toastFn(`💥 ${itemDef.name} quebrou!`, 'warning');
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
                // Preferir showToast injetado via deps; fallback para window.showToast (global legado)
                const toastFn = helpers.showToast ?? (typeof window !== 'undefined' ? window.showToast : null);
                if (typeof toastFn === 'function') {
                    toastFn(`💥 ${itemDef.name} quebrou!`, 'warning');
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
        
        // Validar se ator ainda está vivo e ainda está participando
        if (actor.side === "player") {
            // FIX: pular jogadores que fugiram (não estão mais em enc.participants)
            if (!enc.participants?.includes(actor.id)) continue;

            const p = state.players.find(x => x.id === actor.id);
            // BUG FIX: usar monstro ativo (activeIndex), não sempre team[0]
            // Após troca de monstro, team[0] pode estar morto mas activeIndex aponta para um vivo
            const activeIdx = typeof p?.activeIndex === 'number' ? p.activeIndex : 0;
            const mon = p?.team?.[activeIdx];
            if (mon && (Number(mon.hp) || 0) > 0) break; // ativo vivo → turno válido

            // Ativo morto: verificar substitutos elegíveis (respeitando restrição de classe)
            if (p) {
                const subs = GroupCore.getEligibleSubstitutes(p, state.config);
                if (subs.length > 0) {
                    // Tem substitutos → pausar aqui e abrir modal de troca
                    enc.currentActor = core.getCurrentActor(enc);
                    if (helpers.openSwitchMonsterModal) {
                        helpers.openSwitchMonsterModal(p, enc);
                    }
                    return; // aguarda a seleção do modal antes de continuar
                } else {
                    // Sem substitutos válidos → eliminar da batalha, continuar loop
                    enc.participants = (enc.participants || []).filter(pid => pid !== actor.id);
                    helpers.log(enc, `💀 ${p.name || p.nome} não tem mais monstrinhos válidos e saiu da batalha!`);
                }
            }
            // continue: procura próximo ator válido
        } else {
            const e = enc.enemies?.[actor.id];
            if (e && (Number(e.hp) || 0) > 0) break;
        }
        
    } while (loops < maxLoops);

    // Verificar derrota após possíveis eliminações no loop acima
    // (pode ocorrer quando todos os jogadores foram eliminados por falta de substitutos)
    if (!core.hasAlivePlayers(enc, state.players) && !enc.finished) {
        enc.finished = true;
        enc.result = "defeat";
        enc.active = false;
        enc.log = enc.log || [];
        enc.log.push("💀 Derrota... Todos os participantes foram eliminados.");

        if (!enc._loseSfxPlayed) {
            audio.playSfx("lose");
            enc._loseSfxPlayed = true;
        }

        // PR11B: Processar quebra de itens (usa state.players para capturar todos)
        const allPlayerMonsters = [];
        for (const player of (state.players || [])) {
            if (Array.isArray(player.team)) {
                allPlayerMonsters.push(...player.team);
            }
        }
        processBattleItemBreakage(allPlayerMonsters, {
            log: (msg) => helpers.log(enc, msg),
            notify: (monster, itemDef) => {
                const toastFn = helpers.showToast ?? (typeof window !== 'undefined' ? window.showToast : null);
                if (typeof toastFn === 'function') {
                    toastFn(`💥 ${itemDef.name} quebrou!`, 'warning');
                }
            }
        });

        return;
    }
    
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
 * Processa fuga de um jogador no combate em grupo.
 *
 * Lógica canônica: verificação de boss, remoção do participante,
 * detecção de fim de batalha (todos fugiram → retreat), avanço de turno.
 * A confirmação UI (window.confirm) fica no wrapper de index.html.
 *
 * Retorna { ok, reason? }:
 *   reason: 'no_encounter' | 'boss_no_flee' | 'not_player_turn' | 'no_player'
 *
 * @param {object} deps - Dependências injetadas (mesmo padrão dos demais actions)
 * @returns {{ ok: boolean, reason?: string }}
 */
export function executeGroupFlee(deps) {
    const { state, core, helpers, storage, ui } = deps;
    const enc = state.currentEncounter;
    if (!enc || enc.finished) return { ok: false, reason: 'no_encounter' };

    if (enc.type === 'boss') {
        return { ok: false, reason: 'boss_no_flee' };
    }

    const actor = core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return { ok: false, reason: 'not_player_turn' };

    const player = helpers.getPlayerById(actor.id);
    if (!player) return { ok: false, reason: 'no_player' };

    helpers.log(enc, `🏃 ${player.name || player.nome} fugiu da batalha!`);

    // Remover participante
    if (enc.participants) {
        enc.participants = enc.participants.filter(pid => pid !== player.id);
    }

    // Verificar se todos fugiram
    if (!enc.participants || enc.participants.length === 0) {
        enc.finished = true;
        enc.result = 'retreat';
        helpers.log(enc, '🏁 Todos os participantes fugiram. Batalha encerrada.');
    } else {
        advanceGroupTurn(enc, deps);
    }

    storage?.save?.();
    ui?.render?.();

    return { ok: true };
}

/**
 * CAMADA 4C: Executa skill do jogador em combate de grupo.
 *
 * Recebe skill no formato operacional único (via resolveMonsterSkills):
 *   { name, type: 'DAMAGE'|'HEAL'|'BUFF', cost, target: 'enemy'|'self'|'ally', power, desc }
 *
 * Também aceita ID string como fallback de compatibilidade (legacy).
 *
 * @param {object|string} skillOrId  - Skill no formato operacional único OU ID string (compat.)
 * @param {number|null}   enemyIndex - Índice do inimigo alvo (para skills ofensivas)
 * @param {object}        deps       - Dependências injetadas
 * @returns {boolean} true se a ação foi executada com sucesso
 */
export function executePlayerSkillGroup(skillOrId, enemyIndex, deps) {
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

    // Resolver skill: aceita objeto normalizado (caminho principal) ou ID string (compat. legada)
    let skill;
    if (skillOrId && typeof skillOrId === 'object') {
        skill = skillOrId; // formato operacional normalizado
    } else {
        skill = helpers.getSkillById ? helpers.getSkillById(skillOrId) : null;
    }
    if (!skill) {
        helpers.log(enc, `⚠️ Habilidade não encontrada: ${skillOrId}`);
        storage.save();
        ui.render();
        return false;
    }

    // Verificar ENE suficiente — 'cost' é o campo canônico do formato operacional
    if (!helpers.canUseSkillNow(skill, mon)) {
        const cost = Number(skill.cost ?? skill.energy_cost ?? 0) || 0;
        helpers.log(enc, `⚠️ ENE insuficiente para ${skill.name} (custo: ${cost}, atual: ${mon.ene ?? 0}).`);
        storage.save();
        ui.render();
        return false;
    }

    // Aplicar ENE REGEN e buffs no início do turno
    helpers.applyEneRegen(mon, enc);
    helpers.updateBuffs(mon);

    // Consumir ENE — 'cost' é canônico; energy_cost é compat. legada
    const eneCost = Number(skill.cost ?? skill.energy_cost ?? 0) || 0;
    mon.ene = Math.max(0, (Number(mon.ene) || 0) - eneCost);

    const attackerName = player.name || player.nome || actor.name || "Jogador";
    const monName = mon.nickname || mon.name || mon.nome || "Monstrinho";
    const skillName = skill.name || 'Habilidade';

    // Detectar ofensividade pelo formato operacional normalizado:
    //   target 'enemy'/'area' = ofensivo
    //   type 'DAMAGE' = também ofensivo (segurança para skills não normalizadas)
    //   target 'Inimigo'/'Área' = compat. legada SKILLS_CATALOG
    // Detectar ofensividade via skillResolver (fonte única, sem duplicação)
    const isOffensive = isOffensiveSkill(skill);

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
        if (isCrit) power = Math.round(power * 1.5); // A1: crit ×1.5 (era ×2)

        let dmg = core.calcDamage({
            atk: effectiveAtk,
            def: effectiveDef,
            power: power,
            damageMult: classAdv.damageMult,
            defMult: 1.5  // A2: DEF mais relevante contra habilidades
        });

        // A4: Passiva ofensiva do atacante (Ladino +10% dano)
        const skillAtkPassive = CLASS_COMBAT_PASSIVES[mon.class];
        if (skillAtkPassive?.attackBonus) {
            dmg = Math.max(1, Math.round(dmg * (1 + skillAtkPassive.attackBonus)));
        }

        // A4: Passiva defensiva do defensor
        const skillDefPassive = CLASS_COMBAT_PASSIVES[enemy.class];
        if (skillDefPassive?.defenseBonus) {
            dmg = Math.max(1, Math.round(dmg * (1 - skillDefPassive.defenseBonus)));
        }

        // A1: Cap de dano por turno: máximo 60% do HP máximo do defensor
        const skillEnemyHpMax = Number(enemy.hpMax) || 100;
        dmg = Math.min(dmg, Math.round(skillEnemyHpMax * 0.6));

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

/**
 * PR5B: Executa uso de item de cura em combate de grupo
 *
 * Suporta itens do tipo 'heal' definidos em data/items.json.
 * Consome o item do inventário do jogador, aplica cura ao monstrinho ativo
 * e avança o turno.
 *
 * @param {string} itemId - ID do item (ex: 'IT_HEAL_01')
 * @param {object} deps   - Dependências injetadas (mesmo padrão de executePlayerAttackGroup)
 * @returns {boolean} true se o item foi usado com sucesso
 */
export function executeGroupUseItem(itemId, deps) {
    const { state, core, ui, audio, storage, helpers } = deps;

    const enc = state.currentEncounter;
    if (!enc || enc.finished) return false;

    const actor = core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return false;

    const player = helpers.getPlayerById(actor.id);
    const mon = helpers.getActiveMonsterOfPlayer(player);
    if (!player || !mon) return false;

    const hp = Number(mon.hp) || 0;
    const hpMax = Number(mon.hpMax) || 1;

    if (hp <= 0) {
        helpers.log(enc, "⚠️ Monstrinho está desmaiado. Não pode usar itens.");
        storage.save();
        ui.render();
        return false;
    }

    if (hp >= hpMax) {
        helpers.log(enc, "ℹ️ HP já está cheio. Item não é necessário.");
        storage.save();
        ui.render();
        return false;
    }

    // Verificar item no inventário do jogador
    const itemCount = Number(player.inventory?.[itemId]) || 0;
    if (itemCount <= 0) {
        helpers.log(enc, "⚠️ Você não tem esse item.");
        storage.save();
        ui.render();
        return false;
    }

    // Buscar definição do item (suporta items.json via getItemDef)
    const itemDef = helpers.getItemDef(itemId);
    const healPct = Number(itemDef?.heal_pct ?? 0.30);
    const healMin = Number(itemDef?.heal_min ?? 30);
    const itemName = itemDef?.name ?? itemId;
    const itemEmoji = itemDef?.emoji ?? '💊';

    // Consumir item do inventário
    player.inventory[itemId] = Math.max(0, itemCount - 1);

    // Calcular e aplicar cura
    const healAmount = Math.max(healMin, Math.floor(hpMax * healPct));
    const newHp = Math.min(hpMax, hp + healAmount);
    const healed = newHp - hp;
    mon.hp = newHp;

    const playerName = player.name || player.nome || "Jogador";
    const monName = mon.nickname || mon.name || mon.nome || "Monstrinho";
    const remaining = player.inventory[itemId];

    helpers.log(enc, `${itemEmoji} ${playerName} usou ${itemName}! (Restam: ${remaining})`);
    helpers.log(enc, `✨ ${monName} recuperou ${healed} HP! (${mon.hp}/${hpMax})`);

    // Som de cura
    audio.playSfx("heal");

    advanceGroupTurn(enc, deps);
    storage.save();
    ui.render();
    return true;
}
