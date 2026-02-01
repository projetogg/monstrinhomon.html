/**
 * WILD COMBAT ACTIONS - Lógica de Ações
 * 
 * Funções que modificam state, mas não mexem em DOM diretamente
 * Recebem dependências por parâmetro (dependency injection)
 */

import * as WildCore from './wildCore.js';
import * as WildUI from './wildUI.js';
import { initializeBattleParticipation, markAsParticipated, processBattleItemBreakage } from './itemBreakage.js';

/**
 * Inicializa participação de batalha para wild 1v1
 * Deve ser chamado no início do encounter
 * 
 * @param {object} playerMonster - Monstrinho do jogador
 * @param {object} wildMonster - Monstrinho selvagem (opcional)
 */
export function initializeWildBattleParticipation(playerMonster, wildMonster = null) {
    const monsters = [playerMonster];
    if (wildMonster) monsters.push(wildMonster);
    initializeBattleParticipation(monsters);
}

/**
 * Executa um turno completo de ataque wild 1v1
 * 
 * @param {object} params - Parâmetros do ataque
 * @param {object} params.encounter - Encontro atual
 * @param {object} params.player - Jogador atual
 * @param {object} params.playerMonster - Monstrinho do jogador
 * @param {number} params.d20Roll - Resultado do dado
 * @param {object} params.dependencies - Dependências externas
 * @returns {object} { success: boolean, result?: string, reason?: string }
 */
export function executeWildAttack({ encounter, player, playerMonster, d20Roll, dependencies }) {
    try {
        if (!encounter?.wildMonster) {
            return { success: false, reason: 'no_encounter' };
        }
        
        encounter.log = encounter.log || [];
        
        // PR11B: Marcar que o monstro do jogador participou (executou ação)
        markAsParticipated(playerMonster);
        
        // Aplicar regeneração de ENE
        applyEneRegen(playerMonster, encounter, dependencies.eneRegenData);
        
        // Atualizar buffs (reduzir duração)
        updateBuffs(playerMonster);
        
        // Verificar crítico/falha
        const critResult = processCritical(d20Roll, player, encounter);
        
        // FASE 1: Ataque do jogador
        encounter.log.push(`🎲 ${player.name}'s ${playerMonster.name} rolls ${d20Roll} (ATK: ${playerMonster.atk})`);
        
        // Gravar roll no histórico
        if (dependencies.recordD20Roll) {
            const rollType = critResult.isCrit20 ? 'crit' : critResult.isFail1 ? 'fail' : 'normal';
            dependencies.recordD20Roll(encounter, player.name, d20Roll, rollType);
        }
        
        // d20=1 sempre erra, d20=20 sempre acerta
        const playerHit = critResult.isFail1 ? false : (
            critResult.isCrit20 ? true : 
            WildCore.checkHit(d20Roll, playerMonster, encounter.wildMonster, dependencies.classAdvantages)
        );
        
        // Tocar som
        WildUI.playAttackFeedback(d20Roll, playerHit, critResult.isCrit20, dependencies.audio);
        
        if (playerHit) {
            // Calcular dano
            let power = dependencies.getBasicPower(playerMonster.class);
            if (critResult.isCrit20 && critResult.critBonus === 'double_power') {
                power *= 2; // Dobrar POWER antes do cálculo
            }
            
            const atkMods = WildCore.getBuffModifiers(playerMonster);
            const effectiveAtk = Math.max(1, playerMonster.atk + atkMods.atk);
            
            const defMods = WildCore.getBuffModifiers(encounter.wildMonster);
            const effectiveDef = Math.max(1, encounter.wildMonster.def + defMods.def);
            
            const classAdv = WildCore.getClassAdvantageModifiers(
                playerMonster.class,
                encounter.wildMonster.class,
                dependencies.classAdvantages
            );
            
            const damage = WildCore.calcDamage({
                atk: effectiveAtk,
                def: effectiveDef,
                power: power,
                damageMult: classAdv.damageMult
            });
            
            // Aplicar dano
            encounter.wildMonster.hp = WildCore.applyDamageToHP(encounter.wildMonster.hp, damage);
            encounter.log.push(`💥 ${playerMonster.name} hits! Deals ${damage} damage!`);
            
            // PR11B: Marcar que o monstro selvagem participou (recebeu dano)
            markAsParticipated(encounter.wildMonster);
            
            // Tutorial hook
            if (dependencies.tutorialOnAction) {
                dependencies.tutorialOnAction("attack");
            }
            
            // Feedback visual (via UI)
            WildUI.showDamageFeedback('wildEnemyBox', damage, critResult.isCrit20, dependencies.ui);
            
            // Verificar vitória
            if (encounter.wildMonster.hp <= 0) {
                return handleVictory(encounter, player, playerMonster, dependencies);
            }
        } else {
            // Miss
            if (critResult.isFail1) {
                encounter.log.push(`💀 FALHA CRÍTICA! Ataque erra automaticamente!`);
            } else {
                encounter.log.push(`❌ ${playerMonster.name} misses!`);
            }
            
            WildUI.showMissFeedback('wildPlayerBox', dependencies.ui);
        }
        
        // FASE 2: Contra-ataque do inimigo (se ainda vivo)
        if (encounter.wildMonster.hp > 0) {
            const enemyResult = processEnemyCounterattack(
                encounter,
                encounter.wildMonster,
                playerMonster,
                dependencies
            );
            
            if (enemyResult.defeated) {
                return handleDefeat(encounter, player, playerMonster, dependencies);
            }
        }
        
        return { success: true, encounter };
        
    } catch (error) {
        console.error('Attack execution failed:', error);
        return { success: false, reason: error.message };
    }
}

/**
 * Aplica regeneração de ENE no início do turno
 */
function applyEneRegen(monster, encounter, eneRegenData) {
    try {
        if (!monster || !monster.class) return;
        
        const regenData = eneRegenData[monster.class] || { pct: 0.10, min: 1 };
        const eneGain = Math.max(regenData.min, Math.ceil(monster.eneMax * regenData.pct));
        
        monster.ene = Math.min(monster.eneMax, monster.ene + eneGain);
        
        if (encounter && encounter.log) {
            encounter.log.push(`⚡ ${monster.name} regenerou ${eneGain} ENE (${monster.ene}/${monster.eneMax})`);
        }
    } catch (error) {
        console.error('Failed to apply ENE regen:', error);
    }
}

/**
 * Atualiza buffs (reduz duração e remove expirados)
 */
function updateBuffs(monster) {
    try {
        if (!monster || !monster.buffs) return;
        
        monster.buffs = monster.buffs.filter(buff => {
            buff.duration--;
            return buff.duration > 0;
        });
    } catch (error) {
        console.error('Failed to update buffs:', error);
    }
}

/**
 * Processa crítico d20=20 ou falha d20=1
 * 
 * @returns {object} { isCrit20, isFail1, critBonus, logEntries }
 */
function processCritical(d20Roll, player, encounter) {
    const result = WildCore.checkCriticalRoll(d20Roll);
    result.critBonus = null;
    
    if (result.isCrit20) {
        encounter.log.push(`⭐ CRÍTICO 20! ⭐`);
        
        // Escolher bônus aleatório
        const bonusRoll = Math.floor(Math.random() * 3);
        if (bonusRoll === 0) {
            result.critBonus = 'double_power';
            encounter.log.push(`💥 Poder dobrado neste ataque!`);
        } else if (bonusRoll === 1) {
            result.critBonus = 'item';
            player.inventory = player.inventory || {};
            player.inventory['IT_HEAL_01'] = (player.inventory['IT_HEAL_01'] || 0) + 1;
            encounter.log.push(`🎁 Ganhou 1 Petisco de Cura!`);
        } else {
            result.critBonus = 'money';
            const moneyGain = 20 + Math.floor(Math.random() * 31); // 20-50
            player.money = (player.money || 0) + moneyGain;
            encounter.log.push(`💰 Ganhou ${moneyGain} moedas!`);
        }
    }
    
    return result;
}

/**
 * Processa contra-ataque do inimigo
 * 
 * @returns {object} { defeated: boolean }
 */
function processEnemyCounterattack(encounter, wildMonster, playerMonster, dependencies) {
    const wildSkill = wildMonster.skill;
    
    // IA: 50% chance de usar habilidade se tiver ENE
    const useSkill = wildSkill && 
                     (wildMonster.ene || 0) >= wildSkill.energy_cost && 
                     Math.random() < 0.5;
    
    if (useSkill) {
        return processEnemySkillAttack(encounter, wildMonster, playerMonster, wildSkill, dependencies);
    } else {
        return processEnemyBasicAttack(encounter, wildMonster, playerMonster, dependencies);
    }
}

/**
 * Processa ataque de habilidade do inimigo
 */
function processEnemySkillAttack(encounter, wildMonster, playerMonster, wildSkill, dependencies) {
    wildMonster.ene -= wildSkill.energy_cost;
    encounter.log.push(`✨ ${wildMonster.name} usa ${wildSkill.name}! (-${wildSkill.energy_cost} ENE)`);
    
    const enemyRoll = Math.floor(Math.random() * 20) + 1;
    const enemyHit = WildCore.checkHit(enemyRoll, wildMonster, playerMonster, dependencies.classAdvantages);
    encounter.log.push(`🎲 ${wildMonster.name} rolls ${enemyRoll}`);
    
    // Gravar roll
    if (dependencies.recordD20Roll) {
        const enemyRollType = enemyRoll === 20 ? 'crit' : enemyRoll === 1 ? 'fail' : 'normal';
        dependencies.recordD20Roll(encounter, wildMonster.name, enemyRoll, enemyRollType);
    }
    
    if (enemyHit) {
        const baseDamage = wildMonster.atk + wildSkill.power - playerMonster.def;
        const damage = Math.max(1, baseDamage);
        playerMonster.hp = WildCore.applyDamageToHP(playerMonster.hp, damage);
        encounter.log.push(`💥 ${wildSkill.name} acerta! Causa ${damage} de dano!`);
        
        // PR11B: Marcar que o jogador participou (recebeu dano)
        markAsParticipated(playerMonster);
        // PR11B: Marcar que o selvagem participou (causou dano)
        markAsParticipated(wildMonster);
        
        WildUI.showDamageFeedback('wildPlayerBox', damage, enemyRoll === 20, dependencies.ui);
        
        return { defeated: playerMonster.hp <= 0 };
    } else {
        encounter.log.push(`❌ ${wildSkill.name} erra!`);
        WildUI.showMissFeedback('wildEnemyBox', dependencies.ui);
        return { defeated: false };
    }
}

/**
 * Processa ataque básico do inimigo
 */
function processEnemyBasicAttack(encounter, wildMonster, playerMonster, dependencies) {
    const enemyRoll = Math.floor(Math.random() * 20) + 1;
    const enemyHit = WildCore.checkHit(enemyRoll, wildMonster, playerMonster, dependencies.classAdvantages);
    encounter.log.push(`🎲 Wild ${wildMonster.name} rolls ${enemyRoll} (ATK: ${wildMonster.atk})`);
    
    // Gravar roll
    if (dependencies.recordD20Roll) {
        const enemyRollType = enemyRoll === 20 ? 'crit' : enemyRoll === 1 ? 'fail' : 'normal';
        dependencies.recordD20Roll(encounter, wildMonster.name, enemyRoll, enemyRollType);
    }
    
    if (enemyHit) {
        const damage = WildCore.calculateDamage(
            wildMonster,
            playerMonster,
            dependencies.getBasicPower,
            dependencies.classAdvantages
        );
        playerMonster.hp = WildCore.applyDamageToHP(playerMonster.hp, damage);
        encounter.log.push(`💥 ${wildMonster.name} hits! Deals ${damage} damage!`);
        
        // PR11B: Marcar que o jogador participou (recebeu dano)
        markAsParticipated(playerMonster);
        // PR11B: Marcar que o selvagem participou (causou dano)
        markAsParticipated(wildMonster);
        
        WildUI.showDamageFeedback('wildPlayerBox', damage, enemyRoll === 20, dependencies.ui);
        
        return { defeated: playerMonster.hp <= 0 };
    } else {
        encounter.log.push(`❌ ${wildMonster.name} misses!`);
        WildUI.showMissFeedback('wildEnemyBox', dependencies.ui);
        return { defeated: false };
    }
}

/**
 * Processa vitória
 */
function handleVictory(encounter, player, playerMonster, dependencies) {
    // Amizade
    if (dependencies.updateFriendship) {
        dependencies.updateFriendship(playerMonster, 'battleWin');
    }
    
    encounter.log.push(`🏆 ${encounter.wildMonster.name} fainted! Victory!`);
    
    // Som de vitória
    WildUI.showVictoryUI(encounter, dependencies.audio);
    
    // Recompensas
    if (dependencies.handleVictoryRewards) {
        dependencies.handleVictoryRewards(encounter);
    }
    
    // PR11B: Processar quebra de itens
    const breakResults = processBattleItemBreakage([playerMonster], {
        log: (msg) => encounter.log.push(msg)
    });
    
    // Finalizar encontro
    encounter.active = false;
    
    return { success: true, result: 'victory' };
}

/**
 * Processa derrota
 */
function handleDefeat(encounter, player, playerMonster, dependencies) {
    // Amizade
    if (dependencies.updateMultipleFriendshipEvents) {
        dependencies.updateMultipleFriendshipEvents(playerMonster, ['faint', 'battleLoss']);
    }
    
    encounter.log.push(`😵 ${playerMonster.name} desmaiou!`);
    playerMonster.status = 'fainted';
    
    // Stats
    if (dependencies.updateStats) {
        dependencies.updateStats('battlesLost', 1);
    }
    
    // PR11B: Processar quebra de itens
    const breakResults = processBattleItemBreakage([playerMonster], {
        log: (msg) => encounter.log.push(msg)
    });
    
    // Finalizar encontro
    encounter.active = false;
    
    return { success: true, result: 'defeat' };
}
