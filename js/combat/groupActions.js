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
import { fireCombatEvent, ON_ATTACK, ON_HIT, ON_KO, ON_TURN_START, ON_HEAL_ITEM, ON_SKILL_USED } from './combatEvents.js';
import { checkFleeCanonical } from './wildCore.js';
import { checkBossPhaseTransition } from './bossSystem.js';

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
    'Mago':       { skillDmgBonus: 0.10 },           // +10% dano skill quando ENE > 50%
    'Bardo':      { allyCountAtkBonus: true },   // +1 ACC por aliado vivo
    'Caçador':    { weakTargetAtkBonus: 2 },     // +2 ATK vs alvo com HP < 50%
    'Animalista': { firstAttackHits: true },     // 1º ataque do combate sempre acerta
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

    // PR-02: on_turn_start — início do turno do jogador (após regen/buffs, antes da ação)
    fireCombatEvent(mon, ON_TURN_START, {
        hpPct: (Number(mon.hpMax) || 1) > 0 ? (Number(mon.hp) || 0) / (Number(mon.hpMax) || 1) : 0,
    });

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

    // Passiva Caçador: +2 de dano plano vs alvo com HP < 50% (aplicado após cálculo de dano base)
    if (atkClassPassive?.weakTargetAtkBonus) {
        const eHp = Number(enemy.hp) || 0;
        const eHpMax = Number(enemy.hpMax) || 1;
        if (eHp / eHpMax < 0.50) {
            dmg = Math.max(1, dmg + atkClassPassive.weakTargetAtkBonus);
        }
    }

    // PR-02: passiva de espécie do atacante (on_attack — ataque básico)
    const passiveStateAtk = enc.passiveState || (enc.passiveState = {});
    const atkSpeciesPassive = fireCombatEvent(mon, ON_ATTACK, {
        hpPct: (Number(mon.hpMax) || 1) > 0 ? (Number(mon.hp) || 0) / (Number(mon.hpMax) || 1) : 0,
        isOffensiveSkill: false,
        isFirstAttackOfCombat: !passiveStateAtk.swiftclawFirstStrikeDone,
        hasShadowstingCharge: !!passiveStateAtk.shadowstingDebuffCharged,
        hasBellwaveRhythmCharge: !!passiveStateAtk.bellwaveRhythmCharged,
    });
    if (atkSpeciesPassive?.atkBonus) {
        dmg = Math.max(1, dmg + atkSpeciesPassive.atkBonus);
        helpers.log(enc, `✨ Passiva ${monName}: +${atkSpeciesPassive.atkBonus} ATK`);
        passiveStateAtk.swiftclawFirstStrikeDone = true;
        passiveStateAtk.shadowstingDebuffCharged = false;
        passiveStateAtk.bellwaveRhythmCharged = false;
    }

    // A4: Passiva defensiva do defensor (Guerreiro/Bárbaro/Curandeiro)
    const defClassPassive = CLASS_COMBAT_PASSIVES[enemy.class];
    if (defClassPassive?.defenseBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 - defClassPassive.defenseBonus)));
    }

    // PR-02: passiva de espécie do defensor (on_hit — primeiro hit do turno)
    const defSpeciesPassive = fireCombatEvent(enemy, ON_HIT, {
        hpPct: (Number(enemy.hpMax) || 1) > 0 ? (Number(enemy.hp) || 0) / (Number(enemy.hpMax) || 1) : 0,
        isFirstHitThisTurn: true,
    });
    if (defSpeciesPassive?.damageReduction) {
        const reduced = Math.max(1, dmg - defSpeciesPassive.damageReduction);
        if (reduced < dmg) {
            helpers.log(enc, `🛡️ Passiva ${enemyName}: -${dmg - reduced} dano`);
        }
        dmg = reduced;
    }
    
    // Apply damage
    helpers.applyDamage(enemy, dmg);
    
    // PR-05: Verificar transição de Fase 2 do boss após receber dano
    checkBossPhaseTransition(enemy, enc.log);

    // PR11B: Marcar que o inimigo participou (recebeu dano)
    markAsParticipated(enemy);

    helpers.log(enc, `🎲 ${attackerName} (${monName}) rolou ${d20} e acertou ${enemyName} causando ${dmg} de dano!`);
    
    // Feature 3.8: Visual feedback
    storage.save();
    ui.render();
    ui.showDamageFeedback(`grpE_${enemyIndex}`, dmg, isCrit);

    if (!core.isAlive(enemy)) {
        helpers.log(enc, `🏁 ${enemyName} foi derrotado!`);
        // PR-02: on_ko — inimigo derrotado
        fireCombatEvent(enemy, ON_KO, { hpPct: 0 });
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

/**
 * Seleciona ação do inimigo com base na sua classe.
 *
 * Comportamento por classe:
 * - Curandeiro: cura aliado mais fraco se algum tem HP < 40%
 * - Bardo: 30% de chance de bufar aliado com maior ATK (se ENE ≥ 2)
 * - Mago: usa skill ofensiva se ENE ≥ custo
 * - Ladino: ataca o jogador com menor HP% (não o de maior DEF)
 * - Guerreiro: Postura Defensiva se HP < 40%
 * - Outros: ataque básico
 *
 * @param {object} enemy - Monstrinho inimigo
 * @param {object} enc   - Encounter atual
 * @returns {string} 'attack'|'skill'|'heal'|'pass'
 */
function selectEnemyAction(enemy, enc) {
    const enemyClass = enemy.class || '';
    const enemyHp = Number(enemy.hp) || 0;
    const enemyHpMax = Number(enemy.hpMax) || 1;
    const enemyHpPct = enemyHp / enemyHpMax;
    const enemyEne = Number(enemy.ene) || 0;

    if (enemyClass === 'Curandeiro') {
        // Verifica se algum aliado inimigo tem HP < 40%
        const weakAlly = (enc.enemies || []).find(e =>
            e !== enemy &&
            (Number(e.hp) || 0) > 0 &&
            (Number(e.hp) || 0) / Math.max(1, Number(e.hpMax) || 1) < 0.40
        );
        if (weakAlly) return 'heal';
    }

    if (enemyClass === 'Bardo') {
        // 30% chance de bufar aliado com maior ATK se ENE ≥ 2
        const aliveAllies = (enc.enemies || []).filter(e =>
            e !== enemy && (Number(e.hp) || 0) > 0
        );
        if (aliveAllies.length >= 1 && enemyEne >= 2 && Math.random() < 0.30) {
            return 'skill';
        }
    }

    if (enemyClass === 'Mago') {
        // Usa skill ofensiva se tiver ENE suficiente (custo mínimo = 2)
        if (enemyEne >= 2) return 'skill';
    }

    if (enemyClass === 'Guerreiro') {
        // Postura Defensiva se HP < 40%
        if (enemyHpPct < 0.40 && enemyEne >= 1) return 'skill';
    }

    return 'attack';
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

    // PR-02: on_turn_start — início do turno do inimigo (após regen/buffs, antes da ação)
    fireCombatEvent(enemy, ON_TURN_START, {
        hpPct: (Number(enemy.hpMax) || 1) > 0 ? (Number(enemy.hp) || 0) / (Number(enemy.hpMax) || 1) : 0,
    });

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

    // IA por classe: selecionar ação e resolver alvos especiais
    const enemyAction = selectEnemyAction(enemy, enc);
    const enemyClass = enemy.class || '';
    const enemyName = enemy.name || actor.name || "Inimigo";

    // Curandeiro: curar aliado mais fraco antes de atacar
    if (enemyAction === 'heal') {
        const weakestAlly = (enc.enemies || [])
            .filter(e => e !== enemy && (Number(e.hp) || 0) > 0)
            .reduce((weakest, e) => {
                const pct = (Number(e.hp) || 0) / Math.max(1, Number(e.hpMax) || 1);
                const weakPct = weakest ? (Number(weakest.hp) || 0) / Math.max(1, Number(weakest.hpMax) || 1) : 1;
                return pct < weakPct ? e : weakest;
            }, null);
        if (weakestAlly) {
            const allyHpMax = Number(weakestAlly.hpMax) || 1;
            const healAmt = Math.round(allyHpMax * 0.25);
            weakestAlly.hp = Math.min(allyHpMax, (Number(weakestAlly.hp) || 0) + healAmt);
            const allyName = weakestAlly.name || weakestAlly.nome || 'Aliado';
            helpers.log(enc, `💚 ${enemyName} (Curandeiro) curou ${allyName} em ${healAmt} HP!`);
            advanceGroupTurn(enc, deps);
            storage.save();
            ui.render();
            return true;
        }
    }

    // Guerreiro: Postura Defensiva quando HP baixo
    if (enemyAction === 'skill' && enemyClass === 'Guerreiro') {
        if ((Number(enemy.ene) || 0) >= 1) {
            enemy.ene = Math.max(0, (Number(enemy.ene) || 0) - 1);
            enemy.buffs = enemy.buffs || [];
            enemy.buffs.push({ type: 'def', power: 2, duration: 1, source: 'Postura Defensiva' });
            helpers.log(enc, `🛡️ ${enemyName} (Guerreiro) assumiu Postura Defensiva! DEF +2 por 1 turno.`);
            advanceGroupTurn(enc, deps);
            storage.save();
            ui.render();
            return true;
        }
    }

    // Mago: marcar que deve aplicar bônus de dano neste ataque
    if (enemyAction === 'skill' && enemyClass === 'Mago') {
        const magoCost = 2;
        if ((Number(enemy.ene) || 0) >= magoCost) {
            enemy.ene = Math.max(0, (Number(enemy.ene) || 0) - magoCost);
            enemy._magoDmgBonus = true;
        }
    }

    // Ladino: alvo com menor HP% em vez do maior DEF
    let finalTargetPid = targetPid;
    if (enemyClass === 'Ladino' && eligibleTargets.length > 0) {
        const weakest = eligibleTargets.reduce((w, t) => {
            const pct = (Number(t.monster.hp) || 0) / Math.max(1, Number(t.monster.hpMax) || 1);
            const wPct = w ? (Number(w.monster.hp) || 0) / Math.max(1, Number(w.monster.hpMax) || 1) : 1;
            return pct < wPct ? t : w;
        }, null);
        if (weakest) finalTargetPid = weakest.playerId;
    }

    const targetPlayer = helpers.getPlayerById(finalTargetPid);
    const targetMon = helpers.getActiveMonsterOfPlayer(targetPlayer);
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

    // IA Mago: bônus de dano de skill (+20%)
    if (enemy._magoDmgBonus) {
        dmg = Math.max(1, Math.round(dmg * 1.20));
        helpers.log(enc, `🔮 ${enemyName} (Mago) usou skill ofensiva! Dano amplificado!`);
        delete enemy._magoDmgBonus;
    }

    // PR-02: passiva de espécie do inimigo atacante (on_attack — ataque básico)
    const passiveStateEnemy = enc.passiveState || (enc.passiveState = {});
    const enemyAtkSpeciesPassive = fireCombatEvent(enemy, ON_ATTACK, {
        hpPct: (Number(enemy.hpMax) || 1) > 0 ? (Number(enemy.hp) || 0) / (Number(enemy.hpMax) || 1) : 0,
        isOffensiveSkill: false,
        hasShadowstingCharge: !!passiveStateEnemy[`${enemy.id}_shadowsting`],
        hasBellwaveRhythmCharge: !!passiveStateEnemy[`${enemy.id}_bellwave`],
    });
    if (enemyAtkSpeciesPassive?.atkBonus) {
        dmg = Math.max(1, dmg + enemyAtkSpeciesPassive.atkBonus);
        helpers.log(enc, `✨ Passiva ${enemyName}: +${enemyAtkSpeciesPassive.atkBonus} ATK`);
    }

    // A4: Passiva defensiva do defensor (Guerreiro/Bárbaro/Curandeiro)
    const defClassPassive = CLASS_COMBAT_PASSIVES[targetMon?.class];
    if (defClassPassive?.defenseBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 - defClassPassive.defenseBonus)));
    }

    // PR-02: passiva de espécie do alvo defensor (on_hit — primeiro hit do turno)
    if (targetMon) {
        const targetDefSpeciesPassive = fireCombatEvent(targetMon, ON_HIT, {
            hpPct: (Number(targetMon.hpMax) || 1) > 0 ? (Number(targetMon.hp) || 0) / (Number(targetMon.hpMax) || 1) : 0,
            isFirstHitThisTurn: true,
        });
        if (targetDefSpeciesPassive?.damageReduction) {
            const reduced = Math.max(1, dmg - targetDefSpeciesPassive.damageReduction);
            if (reduced < dmg) {
                helpers.log(enc, `🛡️ Passiva ${targetMonName}: -${dmg - reduced} dano`);
            }
            dmg = reduced;
        }
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
        // PR-02: on_ko — monstro do jogador derrotado
        if (targetMon) fireCombatEvent(targetMon, ON_KO, { hpPct: 0 });
        
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
 * PR-03: Fuga canônica (PATCH_CANONICO_COMBATE_V2.2 BLOCO 11).
 * Fórmula: d20 + SPD >= DC_fuga  (Normal=12, Intimidating=16, Elite=18)
 *
 * Sucesso: monstrinho ativo removido do combate, turno gasto, grupo continua.
 * Falha:   turno gasto, próximo na fila age normalmente.
 * Boss:    fuga proibida.
 *
 * Retorna { ok, reason? }:
 *   reason: 'no_encounter' | 'boss_no_flee' | 'not_player_turn' | 'no_player' | 'no_monster'
 *
 * @param {object} deps - Dependências injetadas (mesmo padrão dos demais actions)
 *   deps.rollD20 {function?} - () → number 1–20 (para testes determinísticos)
 *   deps.fleeType {string?}  - 'normal' | 'intimidating' | 'elite' (default: 'normal')
 * @returns {{ ok: boolean, reason?: string, result?: string }}
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

    const mon = helpers.getActiveMonsterOfPlayer(player);
    if (!mon) return { ok: false, reason: 'no_monster' };

    // PR-03: rolar d20 canônico
    const rollFn = typeof deps.rollD20 === 'function' ? deps.rollD20
                 : typeof deps.helpers?.rollD20 === 'function' ? deps.helpers.rollD20
                 : () => Math.floor(Math.random() * 20) + 1;
    const fleeType = deps.fleeType ?? enc.fleeType ?? 'normal';
    const fleeCheck = checkFleeCanonical(mon, rollFn(), fleeType);

    helpers.log(enc,
        `🏃 ${player.name || player.nome}'s ${mon.name} tenta fugir! (🎲${fleeCheck.roll} + SPD ${fleeCheck.spd} = ${fleeCheck.total} vs DC ${fleeCheck.dc})`
    );

    if (!fleeCheck.success) {
        helpers.log(enc, `❌ Fuga falhou! (${fleeCheck.total} < ${fleeCheck.dc}) Turno perdido.`);
        advanceGroupTurn(enc, deps);
        storage?.save?.();
        ui?.render?.();
        return { ok: true, result: 'failed' };
    }

    helpers.log(enc, `✅ ${mon.name} fugiu com sucesso! (${fleeCheck.total} >= ${fleeCheck.dc})`);

    // Remover participante da batalha
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

    return { ok: true, result: 'fled' };
}

/**
 * Executa habilidade não-ofensiva com dispatch por tipo/target/effect.
 *
 * Suporta:
 * - skill.target === 'ally': registra intenção e pede seleção de aliado
 * - skill.target === 'area' com HEAL: cura todos os aliados vivos
 * - skill.type === 'TAUNT' ou skill.effect === 'taunt': seta tauntActiveId
 * - skill.type === 'BUFF' com target === 'ally': seta buff no aliado
 * - skill.effect === 'mark': marca inimigo
 * - Default: cura próprio monstrinho
 *
 * @param {object} skill - Skill no formato operacional normalizado
 * @param {object} context - { mon, monName, player, attackerName, enc, deps }
 */
function executeNonOffensiveSkillGroup(skill, context) {
    const { mon, monName, player, attackerName, enc, deps } = context;
    const { state, helpers } = deps;
    const skillName = skill.name || 'Habilidade';

    // TAUNT: ativa provocação por 1 turno
    if (skill.effect === 'taunt' || skill.type === 'TAUNT') {
        enc.tauntActiveId = mon.id || monName;
        helpers.log(enc, `🎯 ${monName} usou ${skillName}! TAUNT ativo: inimigos focam neste alvo!`);
        return;
    }

    // MARK: marca inimigo (pega o primeiro vivo)
    if (skill.effect === 'mark') {
        let markIdx = 0;
        const enemies = enc.enemies || [];
        while (markIdx < enemies.length &&
               (Number(enemies[markIdx]?.hp) || 0) <= 0) markIdx++;
        if (markIdx < enemies.length) {
            enc.markedEnemyIndex = markIdx;
            const markedEnemy = enemies[markIdx];
            const markedName = markedEnemy?.name || markedEnemy?.nome || 'Inimigo';
            helpers.log(enc, `🎯 ${monName} usou ${skillName}! ${markedName} foi MARCADO!`);
        } else {
            helpers.log(enc, `🎯 ${monName} usou ${skillName}! Nenhum inimigo vivo para marcar.`);
        }
        return;
    }

    // Cura em área (todos os aliados vivos)
    if ((skill.type === 'HEAL') &&
        (skill.target === 'area' || skill.target === 'group')) {
        let totalCurado = 0;
        for (const pid of (enc.participants || [])) {
            const p = helpers.getPlayerById(pid);
            const allyMon = helpers.getActiveMonsterOfPlayer(p);
            if (!allyMon || (Number(allyMon.hp) || 0) <= 0) continue;
            const allyHpMax = Number(allyMon.hpMax) || 1;
            const healAmt = Math.round(allyHpMax * 0.25);
            allyMon.hp = Math.min(allyHpMax, (Number(allyMon.hp) || 0) + healAmt);
            totalCurado += healAmt;
        }
        helpers.log(enc, `💚 ${monName} usou ${skillName}! Todos os aliados recuperaram ~25% HP! (total: ${totalCurado})`);
        return;
    }

    // Buff de aliado: registrar intenção pendente para seleção
    if (skill.type === 'BUFF' && skill.target === 'ally') {
        const actor = deps.core.getCurrentActor(enc);
        enc.pendingAllySkill = { skillId: skill.id || skill.name, actorId: actor?.id };
        helpers.log(enc, `✨ ${monName} prepara ${skillName}! Selecione um aliado.`);
        return;
    }

    // Skill de suporte para aliado específico
    if (skill.target === 'ally') {
        const actor = deps.core.getCurrentActor(enc);
        enc.pendingAllySkill = { skillId: skill.id || skill.name, actorId: actor?.id };
        helpers.log(enc, `✨ ${monName} prepara ${skillName}! Selecione um aliado.`);
        return;
    }

    // Default: auto-cura próprio monstrinho
    const healPower = Number(skill.power) || 0;
    const hpMax = Number(mon.hpMax) || 1;
    const healAmt = healPower > 0 ? healPower : Math.round(hpMax * 0.20);
    mon.hp = Math.min(hpMax, (Number(mon.hp) || 0) + healAmt);
    helpers.log(enc, `💚 ${monName} usou ${skillName}! Recuperou ${healAmt} HP!`);
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

        // Passiva Mago: +10% dano de skill quando ENE > 50%
        if (skillAtkPassive?.skillDmgBonus) {
            const ene = Number(mon.ene) || 0;
            const eneMax = Number(mon.eneMax) || 10;
            if (eneMax > 0 && ene / eneMax > 0.50) {
                dmg = Math.max(1, Math.round(dmg * (1 + skillAtkPassive.skillDmgBonus)));
            }
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
        // PR-05: Verificar transição de Fase 2 do boss após receber dano (skill)
        checkBossPhaseTransition(enemy, enc.log);
        markAsParticipated(enemy);

        const critText = isCrit ? ' CRÍTICO! 🌟' : '';
        helpers.log(enc, `✨ ${attackerName} (${monName}) usou ${skillName}! ${enemyName} recebe ${dmg} de dano!${critText}`);
        ui.showDamageFeedback(`grpE_${tIdx}`, dmg, isCrit);

        if (!core.isAlive(enemy)) {
            helpers.log(enc, `🏁 ${enemyName} foi derrotado!`);
        }

    } else {
        // Habilidades não-ofensivas: despacha para executeNonOffensiveSkillGroup
        executeNonOffensiveSkillGroup(skill, {
            mon, monName, player, attackerName, enc, deps,
        });

        // Se há skill pendente de aliado, pausar aqui (aguarda seleção)
        if (enc.pendingAllySkill) {
            storage.save();
            ui.render();
            return true;
        }
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

    // PR-02: on_heal_item — passiva de espécie ao usar item de cura (floracura)
    const passiveStateHeal = enc.passiveState || (enc.passiveState = {});
    const healSpeciesPassive = fireCombatEvent(mon, ON_HEAL_ITEM, {
        hpPct: hpMax > 0 ? hp / hpMax : 0,
        isFirstHeal: !passiveStateHeal.floracuraHealUsed,
    });
    if (healSpeciesPassive?.healBonus) {
        const bonus = Math.min(healSpeciesPassive.healBonus, hpMax - mon.hp);
        if (bonus > 0) {
            mon.hp += bonus;
        const monNameForLog = mon.nickname || mon.name || mon.nome || "Monstrinho";
            helpers.log(enc, `✨ Passiva ${monNameForLog}: +${bonus} HP (primeira cura)`);
        }
        passiveStateHeal.floracuraHealUsed = true;
    }

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
