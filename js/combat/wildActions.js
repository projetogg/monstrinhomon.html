/**
 * WILD COMBAT ACTIONS - Lógica de Ações
 * 
 * Funções que modificam state, mas não mexem em DOM diretamente
 * Recebem dependências por parâmetro (dependency injection)
 */

import * as WildCore from './wildCore.js';
import * as WildUI from './wildUI.js';
import { initializeBattleParticipation, markAsParticipated, processBattleItemBreakage } from './itemBreakage.js';
import { resolvePassiveModifier } from '../canon/speciesPassives.js';

// Fase 13.1: IDs dos kit swaps de execução do shadowsting.
// Centralizados aqui para facilitar manutenção quando novas versões forem adicionadas.
const SHADOWSTING_KIT_SWAP_IDS = ['shadowsting_ambush_strike', 'shadowsting_ambush_strike_ii'];

/**
 * Rola d20 usando função injetada ou fallback para Math.random.
 * Centraliza o fallback para evitar duplicação entre funções de IA.
 *
 * @param {object} dependencies - Dependências do combate
 * @returns {number} Valor do d20 (1-20)
 */
function rollEnemyD20(dependencies) {
    if (typeof dependencies.rollD20 === 'function') {
        return dependencies.rollD20();
    }
    return Math.floor(Math.random() * 20) + 1;
}

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
        
        // Fase 11.2: bônus de agilidade por SPD (±1 no check de acerto)
        const playerEffSpd = WildCore.getEffectiveSpd(playerMonster);
        const wildEffSpd = WildCore.getEffectiveSpd(encounter.wildMonster);
        const playerSpdBonus = WildCore.getSpdAdvantage(playerMonster, encounter.wildMonster);
        if (playerSpdBonus !== 0) {
            encounter.log.push(`⚡ Agilidade: ${playerMonster.name} ${playerSpdBonus > 0 ? '+1' : '-1'} (SPD ${playerEffSpd} vs ${wildEffSpd})`);
        }

        // d20=1 sempre erra, d20=20 sempre acerta
        const playerHit = critResult.isFail1 ? false : (
            critResult.isCrit20 ? true : 
            WildCore.checkHit(d20Roll, playerMonster, encounter.wildMonster, dependencies.classAdvantages, playerSpdBonus)
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
            let effectiveAtk = Math.max(1, playerMonster.atk + atkMods.atk);

            // Passiva canônica — atacante (emberfang: não dispara em ataque básico;
            // swiftclaw: +1 ATK no primeiro ataque do combate;
            // shadowsting: +1 ATK em ataque básico se debuff foi aplicado antes) — Fase 4.2 / Fase 9 / Fase 10
            // bellwave: +1 ATK em ataque básico se qualquer skill foi usada antes — Fase 11
            const passiveStateAtk = encounter.passiveState || (encounter.passiveState = {});
            const atkPassive = resolvePassiveModifier(playerMonster, {
                event: 'on_attack',
                hpPct: playerMonster.hpMax > 0 ? playerMonster.hp / playerMonster.hpMax : 0,
                isOffensiveSkill: false, // Fase 4.2: ataque básico → emberfang não dispara
                isFirstAttackOfCombat: !passiveStateAtk.swiftclawFirstStrikeDone, // Fase 9
                hasShadowstingCharge: !!passiveStateAtk.shadowstingDebuffCharged, // Fase 10
                hasBellwaveRhythmCharge: !!passiveStateAtk.bellwaveRhythmCharged, // Fase 11
            });
            if (atkPassive?.atkBonus) {
                effectiveAtk = Math.max(1, effectiveAtk + atkPassive.atkBonus);
                encounter.log.push(`✨ Passiva ${playerMonster.name}: +${atkPassive.atkBonus} ATK`);
                passiveStateAtk.swiftclawFirstStrikeDone = true; // Fase 9: consome bônus de primeiro ataque
                passiveStateAtk.shadowstingDebuffCharged = false; // Fase 10: consome carga de debuff
                passiveStateAtk.bellwaveRhythmCharged = false; // Fase 11: consome carga de ritmo
            }
            
            const defMods = WildCore.getBuffModifiers(encounter.wildMonster);
            const effectiveDef = Math.max(1, encounter.wildMonster.def + defMods.def);
            
            const classAdv = WildCore.getClassAdvantageModifiers(
                playerMonster.class,
                encounter.wildMonster.class,
                dependencies.classAdvantages
            );
            
            let damage = WildCore.calcDamage({
                atk: effectiveAtk,
                def: effectiveDef,
                power: power,
                damageMult: classAdv.damageMult
            });

            // Passiva canônica — defensor (shieldhorn: -1 dano; jogador só ataca 1x por turno)
            const defPassive = resolvePassiveModifier(encounter.wildMonster, {
                event: 'on_hit_received',
                hpPct: encounter.wildMonster.hpMax > 0 ? encounter.wildMonster.hp / encounter.wildMonster.hpMax : 0,
                isFirstHitThisTurn: true, // Fase 4.2: jogador ataca apenas uma vez por turno
            });
            if (defPassive?.damageReduction) {
                const reducedDamage = Math.max(1, damage - defPassive.damageReduction);
                if (reducedDamage < damage) {
                    encounter.log.push(`🛡️ Passiva ${encounter.wildMonster.name}: -${damage - reducedDamage} dano`);
                }
                damage = reducedDamage;
            }
            
            // Aplicar dano
            encounter.wildMonster.hp = WildCore.applyDamageToHP(encounter.wildMonster.hp, damage);
            encounter.log.push(`💥 ${playerMonster.name} acerta! Causa ${damage} de dano!`);
            
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
        
        // Bug Fix #10: Validar eneRegenData antes de usar
        if (!eneRegenData) {
            console.warn('ENE regen data not provided, skipping regeneration');
            return;
        }
        
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
    // Fase 4.2: reset do estado de turno do shieldhorn — novo ciclo de ataque inimigo
    const passiveState = encounter.passiveState || (encounter.passiveState = {});
    passiveState.shieldhornBlockedThisTurn = false;

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
    
    // Usar rollEnemyD20 centralizado (injeta dependencies.rollD20 ou fallback Math.random)
    const enemyRoll = rollEnemyD20(dependencies);
    const alwaysMiss = (enemyRoll === 1);
    const isCrit = (enemyRoll === 20);
    // Fase 11.2: bônus de agilidade por SPD para o inimigo (contra o jogador)
    const enemySpdBonusSkill = WildCore.getSpdAdvantage(wildMonster, playerMonster);
    const enemyHit = !alwaysMiss && (isCrit || WildCore.checkHit(enemyRoll, wildMonster, playerMonster, dependencies.classAdvantages, enemySpdBonusSkill));
    encounter.log.push(`🎲 ${wildMonster.name} rolls ${enemyRoll}`);
    
    // Gravar roll
    if (dependencies.recordD20Roll) {
        const enemyRollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
        dependencies.recordD20Roll(encounter, wildMonster.name, enemyRoll, enemyRollType);
    }

    // Passiva canônica — moonquill (wild): +1 SPD ao aplicar debuff — Fase 4.3
    // A skill foi "usada" (ENE consumido) independentemente de acertar ou errar.
    // Simetria: mesmo critério de debuff usado no lado do player (executeWildSkill).
    const isWildDebuff =
        wildSkill.type === 'BUFF' &&
        (wildSkill.target === 'enemy' || wildSkill.target === 'Inimigo') &&
        (wildSkill.power || 0) < 0;
    const wildSkillPassive = resolvePassiveModifier(wildMonster, {
        event: 'on_skill_used',
        skillType: wildSkill.type, // Fase 4.3: tipo da skill explícito
        isDebuff: isWildDebuff,
    });
    if (wildSkillPassive?.spdBuff) {
        wildMonster.buffs = wildMonster.buffs || [];
        wildMonster.buffs.push({
            type: 'spd',
            power: wildSkillPassive.spdBuff.power,
            duration: wildSkillPassive.spdBuff.duration,
            source: 'moonquill_passive',
        });
        encounter.log.push(
            `✨ Passiva ${wildMonster.name}: +${wildSkillPassive.spdBuff.power} SPD por ${wildSkillPassive.spdBuff.duration} turno(s)`
        );
    }

    if (enemyHit) {
        const atkMods = WildCore.getBuffModifiers(wildMonster);
        let effectiveAtk = Math.max(1, wildMonster.atk + atkMods.atk);

        // Passiva canônica — atacante selvagem (emberfang: +1 ATK em skill ofensiva com HP > 70%)
        const atkPassive = resolvePassiveModifier(wildMonster, {
            event: 'on_attack',
            hpPct: wildMonster.hpMax > 0 ? wildMonster.hp / wildMonster.hpMax : 0,
            isOffensiveSkill: wildSkill.type === 'DAMAGE', // Fase 4.2: emberfang só em skill ofensiva
        });
        if (atkPassive?.atkBonus) {
            effectiveAtk = Math.max(1, effectiveAtk + atkPassive.atkBonus);
            encounter.log.push(`✨ Passiva ${wildMonster.name}: +${atkPassive.atkBonus} ATK`);
        }
        
        const defMods = WildCore.getBuffModifiers(playerMonster);
        const effectiveDef = Math.max(1, playerMonster.def + defMods.def);
        
        const classAdv = WildCore.getClassAdvantageModifiers(
            wildMonster.class,
            playerMonster.class,
            dependencies.classAdvantages
        );
        
        let damage = WildCore.calcDamage({
            atk: effectiveAtk,
            def: effectiveDef,
            power: wildSkill.power,
            damageMult: classAdv.damageMult
        });

        // Passiva canônica — defensor (shieldhorn: -1 dano no primeiro hit do turno)
        const passiveState = encounter.passiveState || (encounter.passiveState = {});
        const defPassive = resolvePassiveModifier(playerMonster, {
            event: 'on_hit_received',
            hpPct: playerMonster.hpMax > 0 ? playerMonster.hp / playerMonster.hpMax : 0,
            isFirstHitThisTurn: !passiveState.shieldhornBlockedThisTurn, // Fase 4.2
        });
        if (defPassive?.damageReduction) {
            const reducedDamage = Math.max(1, damage - defPassive.damageReduction);
            if (reducedDamage < damage) {
                encounter.log.push(`🛡️ Passiva ${playerMonster.name}: -${damage - reducedDamage} dano`);
            }
            damage = reducedDamage;
            passiveState.shieldhornBlockedThisTurn = true; // Fase 4.2: marca turno como consumido
        }
        
        playerMonster.hp = WildCore.applyDamageToHP(playerMonster.hp, damage);
        encounter.log.push(`💥 ${wildSkill.name} acerta! Causa ${damage} de dano!`);
        
        // PR11B: Marcar que o jogador participou (recebeu dano)
        markAsParticipated(playerMonster);
        // PR11B: Marcar que o selvagem participou (causou dano)
        markAsParticipated(wildMonster);
        
        WildUI.showDamageFeedback('wildPlayerBox', damage, isCrit, dependencies.ui);
        
        return { defeated: playerMonster.hp <= 0 };
    } else {
        if (alwaysMiss) {
            encounter.log.push(`💀 FALHA CRÍTICA! ${wildMonster.name} erra!`);
        } else {
            encounter.log.push(`❌ ${wildSkill.name} erra!`);
        }
        WildUI.showMissFeedback('wildEnemyBox', dependencies.ui);
        return { defeated: false };
    }
}

/**
 * Processa ataque básico do inimigo
 */
function processEnemyBasicAttack(encounter, wildMonster, playerMonster, dependencies) {
    // Usar rollEnemyD20 centralizado (injeta dependencies.rollD20 ou fallback Math.random)
    const enemyRoll = rollEnemyD20(dependencies);
    const alwaysMiss = (enemyRoll === 1);
    const isCrit = (enemyRoll === 20);
    // Fase 11.2: bônus de agilidade por SPD para o inimigo (contra o jogador)
    const enemySpdBonusBasic = WildCore.getSpdAdvantage(wildMonster, playerMonster);
    const enemyHit = !alwaysMiss && (isCrit || WildCore.checkHit(enemyRoll, wildMonster, playerMonster, dependencies.classAdvantages, enemySpdBonusBasic));
    encounter.log.push(`🎲 Wild ${wildMonster.name} rolls ${enemyRoll} (ATK: ${wildMonster.atk})`);
    
    // Gravar roll
    if (dependencies.recordD20Roll) {
        const enemyRollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
        dependencies.recordD20Roll(encounter, wildMonster.name, enemyRoll, enemyRollType);
    }
    
    if (enemyHit) {
        // Calcular ATK efetivo explicitamente para permitir injeção de passivas
        const atkMods = WildCore.getBuffModifiers(wildMonster);
        let effectiveAtk = Math.max(1, wildMonster.atk + atkMods.atk);

        // Passiva canônica — atacante selvagem (emberfang: não dispara em ataque básico)
        const atkPassive = resolvePassiveModifier(wildMonster, {
            event: 'on_attack',
            hpPct: wildMonster.hpMax > 0 ? wildMonster.hp / wildMonster.hpMax : 0,
            isOffensiveSkill: false, // Fase 4.2: ataque básico → emberfang não dispara
        });
        if (atkPassive?.atkBonus) {
            effectiveAtk = Math.max(1, effectiveAtk + atkPassive.atkBonus);
            encounter.log.push(`✨ Passiva ${wildMonster.name}: +${atkPassive.atkBonus} ATK`);
        }

        const defMods = WildCore.getBuffModifiers(playerMonster);
        const effectiveDef = Math.max(1, playerMonster.def + defMods.def);

        const classAdv = WildCore.getClassAdvantageModifiers(
            wildMonster.class,
            playerMonster.class,
            dependencies.classAdvantages
        );
        const basicPower = dependencies.getBasicPower(wildMonster.class);

        let damage = WildCore.calcDamage({
            atk: effectiveAtk,
            def: effectiveDef,
            power: basicPower,
            damageMult: classAdv.damageMult
        });

        // Passiva canônica — defensor (shieldhorn: -1 dano no primeiro hit do turno)
        const passiveState = encounter.passiveState || (encounter.passiveState = {});
        const defPassive = resolvePassiveModifier(playerMonster, {
            event: 'on_hit_received',
            hpPct: playerMonster.hpMax > 0 ? playerMonster.hp / playerMonster.hpMax : 0,
            isFirstHitThisTurn: !passiveState.shieldhornBlockedThisTurn, // Fase 4.2
        });
        if (defPassive?.damageReduction) {
            const reducedDamage = Math.max(1, damage - defPassive.damageReduction);
            if (reducedDamage < damage) {
                encounter.log.push(`🛡️ Passiva ${playerMonster.name}: -${damage - reducedDamage} dano`);
            }
            damage = reducedDamage;
            passiveState.shieldhornBlockedThisTurn = true; // Fase 4.2: marca turno como consumido
        }

        playerMonster.hp = WildCore.applyDamageToHP(playerMonster.hp, damage);
        encounter.log.push(`💥 ${wildMonster.name} acerta! Causa ${damage} de dano!`);
        
        // PR11B: Marcar que o jogador participou (recebeu dano)
        markAsParticipated(playerMonster);
        // PR11B: Marcar que o selvagem participou (causou dano)
        markAsParticipated(wildMonster);
        
        WildUI.showDamageFeedback('wildPlayerBox', damage, isCrit, dependencies.ui);
        
        return { defeated: playerMonster.hp <= 0 };
    } else {
        if (alwaysMiss) {
            encounter.log.push(`💀 FALHA CRÍTICA! ${wildMonster.name} erra!`);
        } else {
            encounter.log.push(`❌ ${wildMonster.name} misses!`);
        }
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
        log: (msg) => encounter.log.push(msg),
        notify: (monster, itemDef) => {
            if (dependencies.showToast) {
                dependencies.showToast(`💥 ${itemDef.name} quebrou!`, 'warning');
            }
        }
    });
    
    // Finalizar encontro
    encounter.active = false;
    
    return { success: true, result: 'victory' };
}

// ─────────────────────────────────────────────────────────────────────────────
// TURNO COMPLETO DO INIMIGO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executa o turno completo do selvagem como contra-ataque após ação do jogador.
 *
 * Arquitectura:
 * - "Turno completo" = ENE regen + atualização de buffs + decisão de IA + resolução de ataque
 * - Difere do `processEnemyCounterattack` (reação imediata usada na falha de captura):
 *   aquela não regenera ENE nem atualiza buffs, porque é uma reação pontual,
 *   não um turno estratégico do inimigo.
 *
 * Usado por: executeWildSkill, executeWildCaptureAction, executeWildItemUse
 * (qualquer ação do jogador que concede um turno completo ao inimigo)
 *
 * @param {object} params
 * @param {object} params.encounter      - Encontro atual (muta log)
 * @param {object} params.wildMonster    - Monstrinho selvagem
 * @param {object} params.playerMonster  - Monstrinho do jogador
 * @param {object} params.dependencies   - Dependências injetadas (eneRegenData, classAdvantages, etc.)
 * @returns {{ defeated: boolean }}
 */
export function executeWildEnemyFullTurn({ encounter, wildMonster, playerMonster, dependencies }) {
    // 1. ENE regen do selvagem (começo de turno)
    applyEneRegen(wildMonster, encounter, dependencies.eneRegenData);

    // 2. Atualização de buffs (reduz durações)
    updateBuffs(wildMonster);

    // 3. Decisão de IA + resolução de ataque
    return processEnemyCounterattack(encounter, wildMonster, playerMonster, dependencies);
}

// ─────────────────────────────────────────────────────────────────────────────
// AÇÕES DO JOGADOR — Pipelines Modulares
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executa o uso de uma habilidade do jogador no combate selvagem.
 *
 * Pipeline:
 * 1. Valida estado (monstrinho vivo, classe correta, skill disponível, ENE)
 * 2. Aplica ENE regen + atualiza buffs do monstrinho do jogador
 * 3. Executa habilidade via dependencies.useSkill()
 * 4. Verifica condição terminal (selvagem derrotado → vitória)
 * 5. Se não terminal: executa turno completo do inimigo
 *
 * @param {object} params
 * @param {object} params.encounter      - Encontro atual
 * @param {object} params.player         - Jogador ativo
 * @param {object} params.playerMonster  - Monstrinho ativo do jogador
 * @param {number} params.skillIndex     - Índice da habilidade (0, 1, 2)
 * @param {object} params.dependencies   - Dependências injetadas:
 *   getMonsterSkills {function}     (monster) → skills[] — lista de skills disponíveis
 *   useSkill {function}             (attacker, skill, target, encounter) → boolean
 *   handleVictoryRewards {function} (encounter) → void
 *   tutorialOnAction {function?}    (type) → void
 *   markAsParticipated {function?}  (monster) → void
 *   eneRegenData {object}           tabela de regen por classe
 *   classAdvantages {object}        tabela de vantagens de classe
 *   getBasicPower {function}        (monsterClass) → number
 *   audio {object?}                 { playSfx }
 *   rollD20 {function?}             () → number
 * @returns {{ success: boolean, result: string }}
 *   result: 'victory' | 'defeat' | 'ongoing' | 'invalid' | 'error'
 */
export function executeWildSkill({ encounter, player, playerMonster, skillIndex, dependencies }) {
    try {
        const wildMonster = encounter?.wildMonster;
        if (!wildMonster) return { success: false, result: 'invalid' };

        encounter.log = encounter.log || [];

        // Validar ENE suficiente antes de regen (regen acontece no início do turno)
        const skills = dependencies.getMonsterSkills(playerMonster);
        if (!skills || skillIndex >= skills.length || !skills[skillIndex]) {
            return { success: false, result: 'invalid' };
        }
        const skill = skills[skillIndex];

        if ((playerMonster.ene || 0) < skill.cost) {
            return { success: false, result: 'invalid' };
        }

        // ENE regen do jogador no início do turno
        applyEneRegen(playerMonster, encounter, dependencies.eneRegenData);

        // Atualizar buffs do jogador
        updateBuffs(playerMonster);

        // Passiva canônica — emberfang (+1 ATK em skill ofensiva com HP > 70%) — Fase 4.2
        // swiftclaw (+1 ATK no primeiro ataque do combate) — Fase 9
        // Nota: shadowsting via resolvePassiveModifier NÃO dispara em skill ofensiva qualquer
        //   (isOffensiveSkill: true nunca ativa shadowsting via passive handler).
        //   A execução canônica do shadowsting (Golpe Furtivo) é tratada em bloco dedicado abaixo.
        // Nota: bellwave NÃO dispara em skill (isOffensiveSkill: true nunca ativa bellwave) — Fase 11
        // Aplica como buff temporário antes de useSkill para que getBuffModifiers o inclua.
        // Removido imediatamente após a skill para não persistir ao turno do inimigo.
        const isOffensiveSkill = skill.type === 'DAMAGE';
        const passiveStateSkill = encounter.passiveState || (encounter.passiveState = {});
        const emberfangMod = resolvePassiveModifier(playerMonster, {
            event: 'on_attack',
            hpPct: playerMonster.hpMax > 0 ? playerMonster.hp / playerMonster.hpMax : 0,
            isOffensiveSkill,
            isFirstAttackOfCombat: !passiveStateSkill.swiftclawFirstStrikeDone, // Fase 9
            hasShadowstingCharge: false, // Fase 10: passive handler nunca ativa shadowsting em skill
            hasBellwaveRhythmCharge: false, // Fase 11: skill nunca ativa bellwave (só ataque básico)
        });
        if (emberfangMod?.atkBonus) {
            playerMonster.buffs = playerMonster.buffs || [];
            playerMonster.buffs.push({
                type: 'atk',
                power: emberfangMod.atkBonus,
                duration: 1,
                source: 'emberfang_passive',
            });
            encounter.log.push(`✨ Passiva ${playerMonster.name}: +${emberfangMod.atkBonus} ATK (skill ofensiva)`);
            passiveStateSkill.swiftclawFirstStrikeDone = true; // Fase 9: consome bônus de primeiro ataque
        }

        // Fase 13.1: shadowsting — Golpe Furtivo (kit swap de execução) consome carga de debuff.
        // Loop canônico do Ladino: debuff (skill legada) → carga → Golpe Furtivo (+1 ATK execução).
        // O buff é aplicado antes de useSkill (mesmo padrão de emberfang) para que
        // getBuffModifiers inclua o bônus no cálculo de dano da skill.
        // Distinção vs bellwave: shadowsting exige debuff prévio; bellwave aceita qualquer skill.
        const isShadowstingKitSwap = playerMonster.canonSpeciesId === 'shadowsting' &&
            SHADOWSTING_KIT_SWAP_IDS.includes(skill._kitSwapId);
        const shadowstingExecutionActive = isShadowstingKitSwap && !!passiveStateSkill.shadowstingDebuffCharged;
        if (shadowstingExecutionActive) {
            playerMonster.buffs = playerMonster.buffs || [];
            playerMonster.buffs.push({ type: 'atk', power: 1, duration: 1, source: 'shadowsting_passive' });
            encounter.log.push(`✨ Passiva ${playerMonster.name}: +1 ATK (execução furtiva)`);
        }

        // Executar habilidade
        const success = dependencies.useSkill(playerMonster, skill, wildMonster, encounter);

        // Remover buffs temporários de passiva que não devem persistir ao turno inimigo.
        playerMonster.buffs = (playerMonster.buffs || []).filter(b => b.source !== 'emberfang_passive');
        // Fase 13.1: remover buff de execução furtiva e consumir carga após Golpe Furtivo.
        if (shadowstingExecutionActive) {
            playerMonster.buffs = (playerMonster.buffs || []).filter(b => b.source !== 'shadowsting_passive');
            passiveStateSkill.shadowstingDebuffCharged = false; // consome janela de execução
        }

        if (!success) return { success: false, result: 'invalid' };

        // Passiva canônica — moonquill (+1 SPD ao aplicar debuff)
        // Debuff = habilidade BUFF direcionada ao inimigo com poder negativo
        const isDebuff =
            skill.type === 'BUFF' &&
            (skill.target === 'enemy' || skill.target === 'Inimigo') &&
            (skill.power || 0) < 0;
        const skillPassive = resolvePassiveModifier(playerMonster, {
            event: 'on_skill_used',
            hpPct: playerMonster.hpMax > 0 ? playerMonster.hp / playerMonster.hpMax : 0,
            skillType: skill.type,  // Fase 4.3: tipo da skill explícito no contexto
            isDebuff,
        });
        if (skillPassive?.spdBuff) {
            playerMonster.buffs = playerMonster.buffs || [];
            playerMonster.buffs.push({
                type: 'spd',
                power: skillPassive.spdBuff.power,
                duration: skillPassive.spdBuff.duration,
                source: 'moonquill_passive',
            });
            encounter.log.push(
                `✨ Passiva ${playerMonster.name}: +${skillPassive.spdBuff.power} SPD por ${skillPassive.spdBuff.duration} turno(s)`
            );
        }

        // shadowsting: carregar bônus de execução quando debuff foi aplicado — Fase 10
        // A carga ativa a passiva on_attack no próximo ataque básico do player.
        // isDebuff é reutilizado do check de moonquill acima (mesma definição semântica).
        if (isDebuff && playerMonster.canonSpeciesId === 'shadowsting') {
            const passiveStateShadow = encounter.passiveState || (encounter.passiveState = {});
            passiveStateShadow.shadowstingDebuffCharged = true;
            encounter.log.push(`🎯 Passiva ${playerMonster.name}: carga de execução ativada`);
        }

        // bellwave: carregar bônus rítmico quando qualquer skill é usada — Fase 11
        // A carga ativa a passiva on_attack no próximo ataque básico do player.
        // Diferente de shadowsting: qualquer skill carrega o ritmo, não apenas debuffs.
        if (playerMonster.canonSpeciesId === 'bellwave') {
            const passiveStateBell = encounter.passiveState || (encounter.passiveState = {});
            passiveStateBell.bellwaveRhythmCharged = true;
            encounter.log.push(`🎵 Passiva ${playerMonster.name}: ritmo carregado`);
        }

        // Marcar participação (item breakage)
        if (dependencies.markAsParticipated) {
            dependencies.markAsParticipated(playerMonster);
        }

        // Tutorial hook
        if (dependencies.tutorialOnAction) dependencies.tutorialOnAction('skill');

        // Verificar vitória
        if (wildMonster.hp <= 0) {
            encounter.log.push(`🏆 ${wildMonster.name} foi derrotado!`);
            if (dependencies.handleVictoryRewards) dependencies.handleVictoryRewards(encounter);
            encounter.active = false;
            encounter.result = 'victory';
            return { success: true, result: 'victory' };
        }

        // Turno completo do inimigo
        const counterResult = executeWildEnemyFullTurn({
            encounter, wildMonster, playerMonster, dependencies,
        });
        if (counterResult.defeated) {
            encounter.log.push(`😵 ${playerMonster.name} desmaiou!`);
            playerMonster.status = 'fainted';
            encounter.active = false;
            encounter.result = 'defeat';
            return { success: true, result: 'defeat' };
        }

        return { success: true, result: 'ongoing' };
    } catch (error) {
        console.error('executeWildSkill failed:', error);
        return { success: false, result: 'error' };
    }
}

/**
 * Executa a ação de captura comportamental (reduz agressividade do selvagem).
 *
 * Pipeline:
 * 1. Valida estado (ambos vivos, não resolvido, ação de classe definida)
 * 2. Aplica ação de captura da classe do jogador (reduz aggression)
 * 3. Se aggression <= terminal → resolução comportamental:
 *    - concede rewards + tutorial hook + mantém encounter ativo para ClasterOrb
 * 4. Se ainda não resolvido → turno completo do inimigo
 *
 * @param {object} params
 * @param {object} params.encounter      - Encontro atual
 * @param {object} params.player         - Jogador ativo
 * @param {object} params.playerMonster  - Monstrinho ativo do jogador
 * @param {object} params.dependencies   - Dependências injetadas:
 *   captureActions {object}         mapa classe → ação (CAPTURE_ACTIONS)
 *   aggrTerminal {number}           threshold para resolução comportamental (AGGR_TERMINAL)
 *   handleVictoryRewards {function} (encounter) → void
 *   tutorialOnAction {function?}    (type) → void
 *   eneRegenData {object}           tabela de regen por classe
 *   classAdvantages {object}        tabela de vantagens de classe
 *   getBasicPower {function}        (monsterClass) → number
 *   audio {object?}                 { playSfx }
 *   rollD20 {function?}             () → number
 * @returns {{ success: boolean, result: string, behaviorallyResolved?: boolean }}
 *   result: 'behavioral_resolve' | 'defeat' | 'ongoing' | 'invalid' | 'error'
 */
export function executeWildCaptureAction({ encounter, player, playerMonster, dependencies }) {
    try {
        const wildMonster = encounter?.wildMonster;
        if (!wildMonster) return { success: false, result: 'invalid' };

        encounter.log = encounter.log || [];

        // Obter ação da classe do jogador
        const action = dependencies.captureActions?.[player.class];
        if (!action) return { success: false, result: 'invalid' };

        // Aplicar ação ao selvagem (reduz agressividade)
        const aggBefore = wildMonster.aggression ?? 100;
        WildCore.applyCaptureAction(wildMonster, action);

        encounter.log.push(
            `${action.emoji} ${player.name} usou ${action.name}! ` +
            `Agressividade: ${aggBefore} → ${wildMonster.aggression}`
        );

        // Resolução comportamental: selvagem totalmente calmo
        if (wildMonster.aggression <= (dependencies.aggrTerminal ?? 0)) {
            wildMonster.aggression = 0;
            encounter.behaviorallyResolved = true;
            encounter.log.push(
                `🌿 ${wildMonster.name} está completamente calmo/rendido! ` +
                `(Trilha Comportamental) Pronto para captura!`
            );
            if (dependencies.handleVictoryRewards) dependencies.handleVictoryRewards(encounter);
            if (dependencies.tutorialOnAction) dependencies.tutorialOnAction('capture');
            // Encounter permanece ativo para que o jogador use uma ClasterOrb
            return { success: true, result: 'behavioral_resolve', behaviorallyResolved: true };
        }

        // Selvagem contra-ataca com turno completo
        encounter.log.push(`⚔️ ${wildMonster.name} reage!`);
        const counterResult = executeWildEnemyFullTurn({
            encounter, wildMonster, playerMonster, dependencies,
        });
        if (counterResult.defeated) {
            encounter.log.push(`😵 ${playerMonster.name} desmaiou!`);
            playerMonster.status = 'fainted';
            encounter.result = 'defeat';
            encounter.active = false;
            return { success: true, result: 'defeat' };
        }

        return { success: true, result: 'ongoing' };
    } catch (error) {
        console.error('executeWildCaptureAction failed:', error);
        return { success: false, result: 'error' };
    }
}

/**
 * Executa o uso de um item de cura durante o combate selvagem.
 *
 * Pipeline:
 * 1. Valida estado (jogador e item disponíveis, monstrinho vivo, HP não cheio)
 * 2. Consome 1 item do inventário + aplica cura
 * 3. Hooks de amizade, tutorial e som
 * 4. Callback de feedback visual (DOM — fica no caller)
 * 5. Se selvagem vivo → turno completo do inimigo
 *
 * Nota: o feedback visual (showFloatingText) é um efeito de DOM. O módulo dispara
 * `dependencies.onHealVisualFeedback(actualHeal)` e o caller decide quando/como
 * exibir o texto flutuante.
 *
 * @param {object} params
 * @param {object} params.encounter      - Encontro atual
 * @param {object} params.player         - Jogador ativo
 * @param {object} params.playerMonster  - Monstrinho ativo do jogador
 * @param {string} params.itemId         - ID do item a usar
 * @param {object} params.dependencies   - Dependências injetadas:
 *   getItemDef {function}           (itemId) → { name, emoji, heal_pct, heal_min }
 *   updateFriendship {function?}    (monster, event) → void
 *   tutorialOnAction {function?}    (type) → void
 *   audio {object?}                 { playSfx }
 *   onHealVisualFeedback {function?} (actualHeal) → void — callback de DOM (opcional)
 *   eneRegenData {object}           tabela de regen por classe
 *   classAdvantages {object}        tabela de vantagens de classe
 *   getBasicPower {function}        (monsterClass) → number
 *   rollD20 {function?}             () → number
 * @returns {{ success: boolean, result: string, actualHeal?: number }}
 *   result: 'healed' | 'defeat' | 'ongoing' | 'invalid' | 'error'
 */
export function executeWildItemUse({ encounter, player, playerMonster, itemId, dependencies }) {
    try {
        const wildMonster = encounter?.wildMonster;
        if (!wildMonster) return { success: false, result: 'invalid' };

        encounter.log = encounter.log || [];

        // Obter definição do item
        const itemDef = dependencies.getItemDef(itemId);
        const itemName  = itemDef?.name  || itemId;
        const healPct   = Number(itemDef?.heal_pct) || 0.30;
        const healMin   = Number(itemDef?.heal_min)  || 30;
        const itemEmoji = itemDef?.emoji || '💚';

        // Consumir 1 unidade do item
        player.inventory = player.inventory || {};
        player.inventory[itemId]--;
        encounter.log.push(
            `${itemEmoji} ${player.name} usou ${itemName}! (Restam: ${player.inventory[itemId]})`
        );

        // Aplicar cura
        const healAmount = Math.max(healMin, Math.floor(playerMonster.hpMax * healPct));
        const hpBefore   = playerMonster.hp;
        playerMonster.hp = Math.min(playerMonster.hpMax, playerMonster.hp + healAmount);
        const actualHeal = playerMonster.hp - hpBefore;

        // Passiva canônica — floracura (bônus na primeira cura do combate)
        // passiveState é inicializado lazily no encounter para não poluir o objeto de encontro
        // nos casos em que nenhuma passiva com estado dispara.
        const passiveState = encounter.passiveState || (encounter.passiveState = {});
        const healPassive = resolvePassiveModifier(playerMonster, {
            event: 'on_heal_item',
            hpPct: playerMonster.hpMax > 0 ? hpBefore / playerMonster.hpMax : 0,
            isFirstHeal: !passiveState.floracuraHealUsed,
        });
        if (healPassive?.healBonus) {
            const bonus = Math.min(healPassive.healBonus, playerMonster.hpMax - playerMonster.hp);
            if (bonus > 0) {
                playerMonster.hp += bonus;
                encounter.log.push(`✨ Passiva ${playerMonster.name}: +${bonus} HP (primeira cura)`);
            }
            // Marca independentemente de bonus > 0 (HP pode já estar cheio)
            passiveState.floracuraHealUsed = true;
        }

        encounter.log.push(
            `✨ ${playerMonster.name} recuperou ${actualHeal} HP! (${playerMonster.hp}/${playerMonster.hpMax})`
        );

        // Amizade
        if (dependencies.updateFriendship) dependencies.updateFriendship(playerMonster, 'useHealItem');

        // Tutorial hook
        if (dependencies.tutorialOnAction) dependencies.tutorialOnAction('item');

        // Som de cura
        if (dependencies.audio?.playSfx) dependencies.audio.playSfx('heal');

        // Callback visual (DOM — responsabilidade do caller)
        if (dependencies.onHealVisualFeedback) dependencies.onHealVisualFeedback(actualHeal);

        // Turno completo do inimigo (se ainda vivo)
        if (wildMonster.hp > 0) {
            encounter.log.push(`⚔️ Vez do inimigo...`);
            const counterResult = executeWildEnemyFullTurn({
                encounter, wildMonster, playerMonster, dependencies,
            });
            if (counterResult.defeated) {
                if (dependencies.updateFriendship) dependencies.updateFriendship(playerMonster, 'faint');
                encounter.log.push(`💀 ${playerMonster.name} desmaiou! Derrota!`);
                if (dependencies.audio?.playSfx && !encounter._loseSfxPlayed) {
                    dependencies.audio.playSfx('lose');
                    encounter._loseSfxPlayed = true;
                }
                playerMonster.status = 'fainted';
                encounter.result = 'defeat';
                encounter.active = false;
                return { success: true, result: 'defeat', actualHeal };
            }
        }

        return { success: true, result: 'ongoing', actualHeal };
    } catch (error) {
        console.error('executeWildItemUse failed:', error);
        return { success: false, result: 'error' };
    }
}

/**
 * Executa uma tentativa de fuga de um encontro selvagem.
 *
 * Fase 11.2: SPD agora importa de verdade para a fuga.
 * A chance de fuga é determinística baseada em SPD relativo (playerMonster vs wildMonster),
 * e só uma chance aleatória decide o resultado — mas a probabilidade é controlada por SPD.
 *
 * Pipeline:
 * 1. Calcula fleeChance via WildCore.calculateFleeChance (SPD-based)
 * 2. Rola fuga (dependencies.rollFlee ou Math.random * 100)
 * 3. Se fugiu: encounter.active = false, result = 'fled'
 * 4. Se falhou: inimigo contra-ataca imediatamente (consequência)
 *
 * Impacto em espécies:
 * - bellwave: Nota Discordante (-2 SPD inimigo) aumenta diretamente fleeChance em +4%
 * - moonquill: spdBuff (+1 SPD) aumenta fleeChance em +2%
 *
 * @param {object} params
 * @param {object} params.encounter      - Encontro atual
 * @param {object} params.playerMonster  - Monstrinho do jogador
 * @param {number} params.fleeBaseChance - Chance base de fuga (% por raridade, ex: 10–25)
 * @param {object} params.dependencies   - Dependências injetadas:
 *   rollFlee {function?}            () → number [0,100) — para testes determinísticos
 *   eneRegenData {object}           tabela de regen por classe
 *   classAdvantages {object}        tabela de vantagens de classe
 *   getBasicPower {function}        (monsterClass) → number
 *   rollD20 {function?}             () → number
 * @returns {{ success: boolean, result: string }}
 *   result: 'fled' | 'ongoing' | 'defeat' | 'invalid' | 'error'
 */
export function executeWildFlee({ encounter, playerMonster, fleeBaseChance, dependencies }) {
    try {
        const wildMonster = encounter?.wildMonster;
        if (!wildMonster) return { success: false, result: 'invalid' };

        encounter.log = encounter.log || [];

        // Calcular chance de fuga baseada em SPD efetivo (Fase 11.2)
        const fleeChance = WildCore.calculateFleeChance(playerMonster, wildMonster, fleeBaseChance ?? 15);
        const playerSpd = WildCore.getEffectiveSpd(playerMonster);
        const wildSpd = WildCore.getEffectiveSpd(wildMonster);

        encounter.log.push(
            `🏃 ${playerMonster.name} tenta fugir! (SPD ${playerSpd} vs ${wildSpd} → ${fleeChance}% de chance)`
        );

        // Rolar tentativa de fuga (0–100)
        const fleeRoll = typeof dependencies?.rollFlee === 'function'
            ? dependencies.rollFlee()
            : Math.random() * 100;

        if (fleeRoll < fleeChance) {
            encounter.log.push(`✅ Fugiu com sucesso! (${Math.round(fleeRoll)} < ${fleeChance})`);
            encounter.active = false;
            encounter.result = 'fled';
            return { success: true, result: 'fled' };
        }

        // Fuga falhou: inimigo contra-ataca imediatamente (reação, sem ENE regen)
        encounter.log.push(`❌ Fuga falhou! (${Math.round(fleeRoll)} >= ${fleeChance}) ${wildMonster.name} contra-ataca!`);
        const counterResult = processEnemyCounterattack(encounter, wildMonster, playerMonster, dependencies);
        if (counterResult.defeated) {
            encounter.log.push(`😵 ${playerMonster.name} desmaiou!`);
            playerMonster.status = 'fainted';
            encounter.active = false;
            encounter.result = 'defeat';
            return { success: true, result: 'defeat' };
        }

        return { success: true, result: 'ongoing' };
    } catch (error) {
        console.error('executeWildFlee failed:', error);
        return { success: false, result: 'error' };
    }
}

/**
 * Executa uma tentativa de captura de monstrinho selvagem.
 *
 * Pipeline canônico:
 * 1. Consome 1 ClasterOrb do inventário do jogador
 * 2. Calcula o capture score (Trilha Física + Trilha Comportamental + bônus de Orb)
 * 3. Se score >= threshold → captura bem-sucedida:
 *    - delega side-effects de posse a dependencies.onCaptureSuccess(player, monster, logFn)
 *    - dispara tutorialOnAction("capture") e updateStats
 *    - marca encounter.active = false
 * 4. Se score < threshold → falha:
 *    - selvagem reage com um ataque imediato básico (sem ENE regen — é uma reação, não um turno completo)
 *    - usa processEnemyCounterattack, que respeita d20=1/20, vantagem de classe e crit
 *    - se jogador for derrotado, marca derrota e encounter.active = false
 *
 * Diferença intencional vs _enemyWildCounterattack (index.html):
 * - Captura falha → reação imediata (sem ENE regen, sem buff update, sem skill check)
 * - Outros turnos  → turno completo do inimigo (ENE regen + buffs + IA skill)
 * Isso é um design deliberado: o selvagem reage com raiva, não executa um turno estratégico.
 *
 * Nota: tutorialOnAction("capture") é chamado somente em sucesso de captura por ClasterOrb.
 * Se o encuentro já foi resolvido comportamentalmente (behaviorallyResolved), useCaptureAction
 * já terá chamado tutorialOnAction("capture") naquele momento — a chamada aqui é harmless
 * porque o tutorial estará inativo (getTutorialStep() retorna null) e a função retorna cedo.
 *
 * @param {object} params
 * @param {object} params.encounter      - Encontro atual (muta log, active, result)
 * @param {object} params.player         - Jogador (muta inventory)
 * @param {object} params.playerMonster  - Monstrinho ativo do jogador (pode ser null)
 * @param {object} params.orbInfo        - { id, name, emoji, capture_bonus_pp }
 * @param {object} params.dependencies   - Dependências injetadas:
 *   captureThreshold {number}       score mínimo para esta raridade (ex: 35 para Comum)
 *   onCaptureSuccess {function}     (player, monster, logFn) → void — side-effects de posse
 *   tutorialOnAction {function?}    (type) → void
 *   updateStats {function?}         (key, delta) → void
 *   audio {object?}                 { playSfx }
 *   classAdvantages {object}        tabela de vantagens de classe
 *   getBasicPower {function}        (monsterClass) → number
 *   rollD20 {function?}             () → number (opcional, fallback Math.random)
 *   recordD20Roll {function?}       (enc, name, roll, type) → void (opcional)
 * @returns {{ success: boolean, captured: boolean, result: string }}
 *   Retorna sempre um objeto de resultado:
 *   - success=false + result='no_encounter'  → wildMonster ausente
 *   - success=false + result='error'         → exceção interna
 *   - success=true  + result='captured'      → captura bem-sucedida
 *   - success=true  + result='ongoing'       → falha, encounter continua ativo
 *   - success=true  + result='defeat'        → falha + jogador derrotado no contra-ataque
 */
export function executeWildCapture({ encounter, player, playerMonster, orbInfo, dependencies }) {
    try {
        const monster = encounter?.wildMonster;
        if (!monster) return { success: false, captured: false, result: 'no_encounter' };

        encounter.log = encounter.log || [];

        // 1. Consumir 1 orb
        player.inventory = player.inventory || {};
        player.inventory[orbInfo.id] = (player.inventory[orbInfo.id] || 1) - 1;
        encounter.log.push(
            `${orbInfo.emoji} ${player.name} usou ${orbInfo.name}! (Restam: ${player.inventory[orbInfo.id]})`
        );

        // 2. Calcular score dual-track (HP + Agressividade + Orb)
        const score   = WildCore.calculateCaptureScore(monster, orbInfo.capture_bonus_pp);
        const needed  = dependencies.captureThreshold ?? 45;
        const readiness = WildCore.getCaptureReadinessLabel(score);

        encounter.log.push(
            `🎯 ${readiness.emoji} ${readiness.text} — Score: ${score}/100 (precisava: ${needed}) ` +
            `[Trilha Física:${Math.round((1 - monster.hp / monster.hpMax) * 50)}pts | ` +
            `Trilha Comportamental:${Math.round((1 - (monster.aggression ?? 100) / 100) * 50)}pts | ` +
            `Orb:+${orbInfo.capture_bonus_pp}pts]`
        );

        if (dependencies.updateStats) dependencies.updateStats('captureAttempts', 1);

        if (score >= needed) {
            // ── CAPTURA BEM-SUCEDIDA ──────────────────────────────────────────────
            encounter.log.push(`✅ SUCESSO! ${monster.name} foi capturado!`);
            if (dependencies.audio?.playSfx) dependencies.audio.playSfx('capture_ok');

            monster.ownerId = player.id;

            // Side-effects de posse (team/box/Dex): delegados ao caller para isolar globals
            if (dependencies.onCaptureSuccess) {
                dependencies.onCaptureSuccess(player, monster, (msg) => encounter.log.push(msg));
            }

            if (dependencies.updateStats) dependencies.updateStats('capturesSuccessful', 1);
            if (dependencies.tutorialOnAction) dependencies.tutorialOnAction('capture');

            encounter.active = false;
            return { success: true, captured: true, result: 'captured' };

        } else {
            // ── CAPTURA FALHOU — selvagem reage com ataque imediato ──────────────
            encounter.log.push(`❌ FALHA! ${monster.name} quebrou livre!`);
            if (dependencies.audio?.playSfx) dependencies.audio.playSfx('capture_fail');

            if (playerMonster && playerMonster.hp > 0) {
                encounter.log.push(`⚡ ${monster.name} contra-ataca!`);
                // Reação imediata: sem ENE regen / buff update (design intencional)
                const counterResult = processEnemyCounterattack(
                    encounter, monster, playerMonster, dependencies
                );
                if (counterResult.defeated) {
                    encounter.log.push(`😵 ${playerMonster.name} desmaiou!`);
                    playerMonster.status = 'fainted';
                    encounter.result = 'defeat';
                    encounter.active = false;
                    return { success: true, captured: false, result: 'defeat' };
                }
            }

            return { success: true, captured: false, result: 'ongoing' };
        }
    } catch (error) {
        console.error('Capture execution failed:', error);
        return { success: false, captured: false, result: 'error' };
    }
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
        log: (msg) => encounter.log.push(msg),
        notify: (monster, itemDef) => {
            if (dependencies.showToast) {
                dependencies.showToast(`💥 ${itemDef.name} quebrou!`, 'warning');
            }
        }
    });
    
    // Finalizar encontro
    encounter.active = false;
    
    return { success: true, result: 'defeat' };
}
