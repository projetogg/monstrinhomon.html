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
import { checkBossPhaseTransition, bossAoeAttack, bossPhase2HealAlly } from './bossSystem.js';
import { resolveConfrontation, computeGroupDamage, RC_CATEGORY, applyBuff } from './groupCombatFormula.js';
import {
    getDefensiveBonus, lineHasAlive, filterReachableTargets,
    assignDefaultPositions, autoAdvancePositions, suggestPosition, POSITION, RANGE_BY_CLASS
} from './positionSystem.js';

/**
 * Passivas de combate por classe — aplicadas após cálculo de dano base.
 * defenseBonus: redução percentual de dano recebido (ex.: 0.15 = -15%)
 * attackBonus: aumento percentual de dano causado (ex.: 0.10 = +10%)
 */

/**
 * FASE VII-D — Kit de skills de inimigos por classe (espelho de data/enemySkills.json)
 * Inimigos nível >= minLevel podem usar estas skills.
 * Mantido em sincronia com data/enemySkills.json (IDs imutáveis).
 */
const ENEMY_SKILL_KIT = {
    'Guerreiro':  [
        { id: 'esk_guard_stance', name: 'Postura Defensiva', type: 'BUFF',   target: 'self',  cost: 1, power: 0, effect: 'def_up', minLevel: 1 },
        { id: 'esk_shield_bash',  name: 'Golpe de Escudo',   type: 'DAMAGE', target: 'enemy', cost: 2, power: 5, minLevel: 10 },
    ],
    'Mago': [
        { id: 'esk_arcane_bolt',  name: 'Raio Arcano', type: 'DAMAGE', target: 'enemy', cost: 2, power: 8,  minLevel: 1 },
        { id: 'esk_arcane_surge', name: 'Surto Arcano', type: 'DAMAGE', target: 'enemy', cost: 4, power: 14, minLevel: 10 },
    ],
    'Curandeiro': [
        { id: 'esk_ally_heal',   name: 'Cura Aliado',    type: 'HEAL',   target: 'ally',  cost: 2, power: 0, minLevel: 1 },
        { id: 'esk_group_heal',  name: 'Cura em Área',   type: 'HEAL',   target: 'area',  cost: 4, power: 0, minLevel: 10 },
    ],
    'Bárbaro': [
        { id: 'esk_rage_strike', name: 'Golpe Furioso', type: 'DAMAGE', target: 'enemy', cost: 2, power: 7, minLevel: 1 },
        { id: 'esk_berserk',     name: 'Berserk',       type: 'BUFF',   target: 'self',  cost: 3, power: 0, effect: 'atk_up', minLevel: 10 },
    ],
    'Ladino': [
        { id: 'esk_backstab',    name: 'Golpe Pelas Costas', type: 'DAMAGE', target: 'enemy', cost: 2, power: 6, minLevel: 1 },
        { id: 'esk_shadow_step', name: 'Passo das Sombras',  type: 'BUFF',   target: 'self',  cost: 2, power: 0, effect: 'evasion_up', minLevel: 10 },
    ],
    'Bardo': [
        { id: 'esk_battle_song', name: 'Canção de Batalha', type: 'BUFF',   target: 'ally',  cost: 2, power: 0, effect: 'atk_up', minLevel: 1 },
        { id: 'esk_dissonance',  name: 'Dissonância',       type: 'DAMAGE', target: 'enemy', cost: 3, power: 5, minLevel: 10 },
    ],
    'Caçador': [
        { id: 'esk_aimed_shot', name: 'Tiro Preciso', type: 'DAMAGE', target: 'enemy', cost: 2, power: 7, minLevel: 1 },
        { id: 'esk_trap',       name: 'Armadilha',    type: 'BUFF',   target: 'enemy', cost: 3, power: 0, effect: 'def_down', minLevel: 10 },
    ],
    'Animalista': [
        { id: 'esk_wild_strike', name: 'Golpe Selvagem',    type: 'DAMAGE', target: 'enemy', cost: 2, power: 6, minLevel: 1 },
        { id: 'esk_pack_howl',   name: 'Uivo de Alcateia', type: 'BUFF',   target: 'ally',  cost: 3, power: 0, effect: 'atk_up', minLevel: 10 },
    ],
};

/**
 * Retorna a melhor skill disponível para um inimigo dado seu nível e ENE atual.
 * Prefere skills de maior poder que o inimigo possa pagar.
 *
 * @param {string} enemyClass - Classe do inimigo
 * @param {number} level      - Nível do inimigo
 * @param {number} ene        - ENE atual do inimigo
 * @returns {{ skill: object, canUse: boolean }}
 */
function getBestEnemySkill(enemyClass, level, ene) {
    const kit = ENEMY_SKILL_KIT[enemyClass] || [];
    // Filtrar por nível mínimo e ENE disponível
    const available = kit.filter(s => level >= s.minLevel && ene >= s.cost);
    if (available.length === 0) return { skill: null, canUse: false };
    // Preferir skill de maior poder (ou buff se não houver damage)
    const sorted = [...available].sort((a, b) => (b.power || 0) - (a.power || 0));
    return { skill: sorted[0], canUse: true };
}

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
 * Aplica o bônus passivo do Caçador: +N de dano plano vs alvo com HP < 50%.
 * Centralizado para evitar duplicação em ataque básico e skill.
 *
 * @param {number} dmg        - Dano atual
 * @param {object} target     - Alvo (precisa de .hp e .hpMax)
 * @param {object} classPass  - Entrada do CLASS_COMBAT_PASSIVES do atacante
 * @returns {number} Dano ajustado (mínimo 1)
 */
function applyHunterWeakTargetBonus(dmg, target, classPass) {
    if (!classPass?.weakTargetAtkBonus || !target) return dmg;
    const tHp = Number(target.hp) || 0;
    const tHpMax = Number(target.hpMax) || 1;
    if (tHp / tHpMax < 0.50) {
        return Math.max(1, dmg + classPass.weakTargetAtkBonus);
    }
    return dmg;
}

/**
 * Calibra HP dos inimigos em batalhas de grupo (não boss).
 * 1 inimigo → ×1.0; 2 → ×0.75; 3+ → ×0.60
 * Executado uma vez por encontro (guard: enc._hpCalibrated).
 *
 * @param {object} enc - Encounter
 */
function calibrateEnemyHP(enc) {
    if (enc._hpCalibrated || enc.type === 'boss') return;
    enc._hpCalibrated = true;
    const count = (enc.enemies || []).filter(e => e).length;
    if (count <= 1) return;
    const mult = count === 2 ? 0.75 : 0.60;
    for (const e of (enc.enemies || [])) {
        if (!e) continue;
        const origHp = Number(e.hpMax) || 1;
        const newHpMax = Math.max(1, Math.round(origHp * mult));
        e.hpMax = newHpMax;
        e.hp = Math.min(Number(e.hp) || newHpMax, newHpMax);
    }
}

/**
 * Garante que o encounter tem posições inicializadas.
 * Chamado automaticamente antes do primeiro uso de enc.positions.
 *
 * @param {object} enc  - Encounter atual
 * @param {object} deps - Dependências
 */
function ensurePositions(enc, deps) {
    if (enc.positions) return;
    const { state } = deps;
    const playerIds = enc.participants || [];
    const playerData = {};
    for (const pid of playerIds) {
        const p = state.players.find(x => x.id === pid);
        const mon = p?.team?.[p.activeIndex ?? 0];
        if (mon) playerData[pid] = { class: mon.class };
    }
    const playerPositions = assignDefaultPositions(playerIds, playerData);
    const enemyPositions = {};
    for (let i = 0; i < (enc.enemies || []).length; i++) {
        const e = enc.enemies[i];
        if (e) enemyPositions[`enemy_${i}`] = suggestPosition(e.class) || POSITION.FRONT;
    }
    enc.positions = { ...playerPositions, ...enemyPositions };
}

/**
 * Retorna o posMod defensivo de um alvo.
 *
 * @param {object} enc        - Encounter
 * @param {string} targetKey  - 'pid' para jogador, 'enemy_N' para inimigo
 * @param {string} side       - 'player'|'enemy'
 * @param {Array}  combatantList - Lista de {id, side, position, hp}
 * @returns {number} 0, 1 ou 2
 */
function getTargetPosMod(enc, targetKey, side, combatantList) {
    const pos = enc.positions?.[targetKey] || POSITION.FRONT;
    const frontHasAlly = lineHasAlive(combatantList, POSITION.FRONT, side);
    return getDefensiveBonus(pos, frontHasAlly);
}

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

    // FASE I/II: garantir posições
    ensurePositions(enc, deps);

    // Alvo: inimigo especificado ou primeiro inimigo vivo
    const enemyIndex = resolveEnemyIndex(enc, targetEnemyIndex, core);

    const enemy = helpers.getEnemyByIndex(enc, enemyIndex);
    if (!enemy || !core.isAlive(enemy)) {
        helpers.log(enc, "ℹ️ Não há inimigos vivos para atacar.");
        storage.save();
        ui.render();
        return false;
    }

    const attackerName = player.name || player.nome || actor.name || "Jogador";
    const monName = mon.nickname || mon.name || mon.nome || "Monstrinho";
    const enemyName = enemy.name || enemy.nome || "Inimigo";

    // Rolagens bilaterais: jogador ataca, inimigo defende
    const d20A = helpers.rollD20();
    const d20D = helpers.rollD20();
    const isCrit = (d20A === 20);
    const alwaysMiss = (d20A === 1);
    const rollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
    helpers.recordD20Roll(enc, attackerName, d20A, rollType);
    ui.playAttackFeedback(d20A, true, isCrit, audio);

    // Modificadores de classe
    const classAdv = core.getClassAdvantageModifiers(mon.class, enemy.class, state.config?.classAdvantages);

    // Buffs
    const atkMods = core.getBuffModifiers(mon);
    const defMods = core.getBuffModifiers(enemy);
    const effectiveAtk = Math.max(1, (Number(mon.atk) || 0) + atkMods.atk);
    const effectiveDef = Math.max(1, (Number(enemy.def) || 0) + defMods.def);

    // Posição defensiva do inimigo
    const enemyCombatants = (enc.enemies || []).map((e, i) => ({
        id: `enemy_${i}`, side: 'enemy',
        position: enc.positions?.[`enemy_${i}`] || POSITION.FRONT,
        hp: Number(e?.hp) || 0,
    }));
    const posMod = getTargetPosMod(enc, `enemy_${enemyIndex}`, 'enemy', enemyCombatants);

    // MARK: -2 buffDef para inimigo marcado
    const markDebuff = (enc.markedEnemyIndex === enemyIndex) ? -2 : 0;

    // Resolver confronto bilateral (FASE I)
    const confrontResult = resolveConfrontation({
        d20A, d20D,
        atkAtk: effectiveAtk,
        atkDef: effectiveDef,
        atkLvl: Number(mon.level) || 1,
        defLvl: Number(enemy.level) || 1,
        classModAtk: classAdv.atkBonus,
        posMod,
        buffOff: 0,
        buffDef: markDebuff,
    });

    const isHit = !alwaysMiss && confrontResult.category !== RC_CATEGORY.FALHA_TOTAL;

    if (!isHit) {
        helpers.log(enc, `🎲 ${attackerName} (${monName}) rolou d20A:${d20A} vs d20D:${d20D} → RC${confrontResult.rc} ERROU. ${enemyName} esquivou!`);
        ui.showMissFeedback(`grpP_${actor.id}`);
        advanceGroupTurn(enc, deps);
        storage.save();
        ui.render();
        return true;
    }

    // Calcular dano via fórmula canônica
    const basicPower = helpers.getBasicAttackPower(mon.class);
    const lvlDiff = (Number(mon.level) || 1) - (Number(enemy.level) || 1);

    const { damage: baseDmg, isIlusory } = computeGroupDamage({
        pwr: basicPower,
        atk: effectiveAtk,
        lvlDiff,
        defEnemy: effectiveDef,
        damageMult: classAdv.damageMult,
        critBonus: confrontResult.critDmgBonus,
        category: confrontResult.category,
        d20ANatural: confrontResult.d20ANatural,
        d20DNatural: confrontResult.d20DNatural,
    });

    let dmg = baseDmg;

    // A4: Passiva ofensiva do atacante (Ladino +10% dano)
    const atkClassPassive = CLASS_COMBAT_PASSIVES[mon.class];
    if (atkClassPassive?.attackBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 + atkClassPassive.attackBonus)));
    }
    // Passiva Caçador: +2 dano plano vs alvo HP < 50%
    dmg = applyHunterWeakTargetBonus(dmg, enemy, atkClassPassive);

    // PR-02: passiva de espécie do atacante
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

    // A4: Passiva defensiva do defensor
    const defClassPassive = CLASS_COMBAT_PASSIVES[enemy.class];
    if (defClassPassive?.defenseBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 - defClassPassive.defenseBonus)));
    }

    // PR-02: passiva de espécie do defensor
    const defSpeciesPassive = fireCombatEvent(enemy, ON_HIT, {
        hpPct: (Number(enemy.hpMax) || 1) > 0 ? (Number(enemy.hp) || 0) / (Number(enemy.hpMax) || 1) : 0,
        isFirstHitThisTurn: true,
    });
    if (defSpeciesPassive?.damageReduction) {
        const reduced = Math.max(1, dmg - defSpeciesPassive.damageReduction);
        if (reduced < dmg) helpers.log(enc, `🛡️ Passiva ${enemyName}: -${dmg - reduced} dano`);
        dmg = reduced;
    }

    helpers.applyDamage(enemy, dmg);
    checkBossPhaseTransition(enemy, enc.log);
    markAsParticipated(enemy);

    // Log RC detalhado
    const rcLabel = confrontResult.category === RC_CATEGORY.ACERTO_FORTE ? 'Acerto Forte ×1.25'
        : confrontResult.category === RC_CATEGORY.ACERTO_NORMAL ? 'Acerto Normal ×1.00'
        : confrontResult.category === RC_CATEGORY.ACERTO_REDUZIDO ? 'Acerto Reduzido ×0.60'
        : 'Contato Neutralizado';
    const critText = isCrit ? ' 💥CRIT!' : '';
    const ilusText = isIlusory ? ' (ilusório)' : '';
    helpers.log(enc, `🎲 ${attackerName} (${monName}) d20A:${d20A}/d20D:${d20D} RC${confrontResult.rc} → ${rcLabel}${critText} | acertou ${enemyName} ${dmg} dano${ilusText}`);

    storage.save();
    ui.render();
    ui.showDamageFeedback(`grpE_${enemyIndex}`, dmg, isCrit);

    if (!core.isAlive(enemy)) {
        helpers.log(enc, `🏁 ${enemyName} foi derrotado!`);
        fireCombatEvent(enemy, ON_KO, { hpPct: 0 });
        // FASE II: autoAdvancePositions após KO de inimigo
        if (enc.positions) {
            const updatedCombatants = (enc.enemies || []).map((e, i) => ({
                id: `enemy_${i}`, side: 'enemy',
                position: enc.positions?.[`enemy_${i}`] || POSITION.FRONT,
                hp: Number(e?.hp) || 0,
            }));
            const enemyPosEntries = Object.fromEntries(
                Object.entries(enc.positions).filter(([k]) => k.startsWith('enemy_'))
            );
            enc.positions = { ...enc.positions, ...autoAdvancePositions(enemyPosEntries, updatedCombatants, 'enemy') };
        }
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
 * - Outros (nível ≥ 10): usa melhor skill do kit se ENE suficiente
 * - Outros: ataque básico
 *
 * @param {object} enemy - Monstrinho inimigo
 * @param {object} enc   - Encounter atual
 * @returns {{ action: string, skill?: object }} action = 'attack'|'skill'|'heal'|'pass'
 */
function selectEnemyAction(enemy, enc) {
    const enemyClass = enemy.class || '';
    const enemyHp = Number(enemy.hp) || 0;
    const enemyHpMax = Number(enemy.hpMax) || 1;
    const enemyHpPct = enemyHp / enemyHpMax;
    const enemyEne = Number(enemy.ene) || 0;
    const enemyLevel = Number(enemy.level) || 1;

    if (enemyClass === 'Curandeiro') {
        // Verifica se algum aliado inimigo tem HP < 40%
        const weakAlly = (enc.enemies || []).find(e =>
            e !== enemy &&
            (Number(e.hp) || 0) > 0 &&
            (Number(e.hp) || 0) / Math.max(1, Number(e.hpMax) || 1) < 0.40
        );
        if (weakAlly) return { action: 'heal' };
    }

    if (enemyClass === 'Bardo') {
        // 30% chance de bufar aliado com maior ATK se ENE ≥ 2
        const aliveAllies = (enc.enemies || []).filter(e =>
            e !== enemy && (Number(e.hp) || 0) > 0
        );
        if (aliveAllies.length >= 1 && enemyEne >= 2 && Math.random() < 0.30) {
            return { action: 'skill' };
        }
    }

    if (enemyClass === 'Mago') {
        // FASE VII-D: usar kit se nível ≥ 10; fallback para skill genérica
        const { skill, canUse } = getBestEnemySkill(enemyClass, enemyLevel, enemyEne);
        if (canUse && skill) return { action: 'skill', skill };
        if (enemyEne >= 2) return { action: 'skill' };
    }

    if (enemyClass === 'Guerreiro') {
        // Postura Defensiva se HP < 40%
        if (enemyHpPct < 0.40 && enemyEne >= 1) {
            const { skill } = getBestEnemySkill(enemyClass, enemyLevel, enemyEne);
            return { action: 'skill', skill: skill || null };
        }
    }

    // FASE VII-D: Outros inimigos nível ≥ 10 podem usar skills do kit (40% chance)
    if (enemyLevel >= 10) {
        const { skill, canUse } = getBestEnemySkill(enemyClass, enemyLevel, enemyEne);
        if (canUse && skill && Math.random() < 0.40) {
            return { action: 'skill', skill };
        }
    }

    return { action: 'attack' };
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

    // FASE I/II/V: garantir posições e calibrar HP
    ensurePositions(enc, deps);
    calibrateEnemyHP(enc);

    // IA v1: Escolhe alvo por DEF (aggro)
    // Inicializar recentTargets se não existir
    if (!enc.recentTargets) {
        enc.recentTargets = {};
    }
    
    const eligibleTargets = buildEligibleTargets(enc, deps);

    // FASE VII-A: filtrar alvos acessíveis pelo alcance da classe do inimigo
    const enemyPos = enc.positions?.[`enemy_${actor.id}`] || POSITION.FRONT;
    const reachableFormatted = eligibleTargets.map(t => ({
        id: t.playerId,
        position: enc.positions?.[t.playerId] || POSITION.FRONT,
        hp: Number(t.monster?.hp) || 0,
        _orig: t,
    }));
    const reachableFiltered = filterReachableTargets(reachableFormatted, enemy.class, enemyPos);
    // Fallback: se nenhum alvo acessível (todos atrás de proteção), usar todos
    const reachableIds = new Set((reachableFiltered.length > 0 ? reachableFiltered : reachableFormatted).map(t => t.id));
    const reachableTargets = eligibleTargets.filter(t => reachableIds.has(t.playerId));

    const targetPid = GroupCore.pickEnemyTargetByDEF(reachableTargets, enc.recentTargets);
    
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
    const { action: enemyAction, skill: enemySelectedSkill = null } = selectEnemyAction(enemy, enc);
    const enemyClass = enemy.class || '';
    const enemyName = enemy.name || actor.name || "Inimigo";

    // FASE VII-E: Boss Fase 2 — chance de AoE ou cura de aliado antes do ataque normal
    if (enemy.isBoss && enemy._phase === 2) {
        // 35% chance de atacar todos na linha da frente
        if (Math.random() < 0.35 && eligibleTargets.length > 0) {
            const { hitTargets } = bossAoeAttack(enemy, eligibleTargets, deps, enc);
            if (hitTargets.length > 0) {
                ui.render();
                advanceGroupTurn(enc, deps);
                storage.save();
                ui.render();
                return true;
            }
        }
        // 40% chance de curar aliado
        const bossAllies = (enc.enemies || []).filter(e => e && e !== enemy && (Number(e.hp) || 0) > 0);
        if (bossAllies.length > 0) {
            bossPhase2HealAlly(enemy, bossAllies, deps, enc);
        }
    }

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

    // FASE VII-D: Skill do kit (BUFF/DAMAGE não-Guerreiro/Mago) — aplicar antes do ataque
    if (enemyAction === 'skill' && enemySelectedSkill &&
        enemyClass !== 'Guerreiro' && enemyClass !== 'Mago') {
        const sk = enemySelectedSkill;
        const skCost = Number(sk.cost) || 0;
        if ((Number(enemy.ene) || 0) >= skCost) {
            enemy.ene = Math.max(0, (Number(enemy.ene) || 0) - skCost);
            if (sk.type === 'BUFF' && sk.target === 'self') {
                applyBuff(enemy, { type: sk.effect || 'atk', power: 1, duration: 2, source: sk.name });
                helpers.log(enc, `✨ ${enemyName} usou ${sk.name}! (+1 ${sk.effect || 'buff'} por 2 turnos)`);
                advanceGroupTurn(enc, deps);
                storage.save();
                ui.render();
                return true;
            }
            if (sk.type === 'BUFF' && sk.target === 'ally') {
                const ally = (enc.enemies || []).find(e => e !== enemy && (Number(e.hp) || 0) > 0);
                if (ally) {
                    applyBuff(ally, { type: sk.effect || 'atk', power: 1, duration: 2, source: sk.name });
                    helpers.log(enc, `🎵 ${enemyName} usou ${sk.name} em ${ally.name || 'Aliado'}! (+1 ${sk.effect || 'buff'} por 2 turnos)`);
                    advanceGroupTurn(enc, deps);
                    storage.save();
                    ui.render();
                    return true;
                }
            }
            // DAMAGE skill: aplica power adicional no próximo ataque (via flag)
            // O poder extra é processado abaixo como bônus de dano
        }
    }

    // Guerreiro: Postura Defensiva quando HP baixo
    if (enemyAction === 'skill' && enemyClass === 'Guerreiro') {
        const skCost = enemySelectedSkill?.cost || 1;
        if ((Number(enemy.ene) || 0) >= skCost) {
            enemy.ene = Math.max(0, (Number(enemy.ene) || 0) - skCost);
            applyBuff(enemy, { type: 'def', power: 2, duration: 1, source: 'Postura Defensiva' });
            helpers.log(enc, `🛡️ ${enemyName} (Guerreiro) assumiu Postura Defensiva! DEF +2 por 1 turno.`);
            advanceGroupTurn(enc, deps);
            storage.save();
            ui.render();
            return true;
        }
    }

    // Mago: marcar que deve aplicar bônus de dano neste ataque (usando estado do encounter, não mutando o inimigo)
    let magoDmgBonus = false;
    if (enemyAction === 'skill' && enemyClass === 'Mago') {
        // FASE VII-D: usar custo da skill selecionada se disponível
        const magoCost = enemySelectedSkill?.cost || 2;
        if ((Number(enemy.ene) || 0) >= magoCost) {
            enemy.ene = Math.max(0, (Number(enemy.ene) || 0) - magoCost);
            magoDmgBonus = true;
        }
    }

    // Ladino: alvo com menor HP% em vez do maior DEF
    let finalTargetPid = targetPid;
    if (enemyClass === 'Ladino' && reachableTargets.length > 0) {
        const weakest = reachableTargets.reduce((w, t) => {
            const pct = (Number(t.monster.hp) || 0) / Math.max(1, Number(t.monster.hpMax) || 1);
            const wPct = w ? (Number(w.monster.hp) || 0) / Math.max(1, Number(w.monster.hpMax) || 1) : 1;
            return pct < wPct ? t : w;
        }, null);
        if (weakest) finalTargetPid = weakest.playerId;
    }

    // FASE III: TAUNT — inimigo deve focar no portador de TAUNT
    if (enc.tauntActiveId != null) {
        const tauntTarget = eligibleTargets.find(t => t.monster?.id === enc.tauntActiveId);
        if (tauntTarget) {
            finalTargetPid = tauntTarget.playerId;
        } else {
            // Portador derrotado — limpar TAUNT
            enc.tauntActiveId = null;
            enc.tauntActiveMonName = null;
        }
    }

    const targetPlayer = helpers.getPlayerById(finalTargetPid);
    const targetMon = helpers.getActiveMonsterOfPlayer(targetPlayer);
    const targetName = targetPlayer?.name || targetPlayer?.nome || "Jogador";
    const targetMonName = targetMon?.nickname || targetMon?.name || targetMon?.nome || "Monstrinho";

    // Rolagens bilaterais: inimigo ataca, jogador defende
    const d20A = helpers.rollD20();
    const d20D = helpers.rollD20();
    const isCrit = (d20A === 20);
    const alwaysMiss = (d20A === 1);
    const rollType = isCrit ? 'crit' : alwaysMiss ? 'fail' : 'normal';
    helpers.recordD20Roll(enc, enemyName, d20A, rollType);
    ui.playAttackFeedback(d20A, true, isCrit, audio);

    // Modificadores de classe
    const classAdv = core.getClassAdvantageModifiers(enemy.class, targetMon?.class, state.config?.classAdvantages);

    // Buffs
    const atkMods = core.getBuffModifiers(enemy);
    const defMods = core.getBuffModifiers(targetMon);
    const effectiveAtk = Math.max(1, (Number(enemy.atk) || 0) + atkMods.atk);
    const effectiveDef = Math.max(1, (Number(targetMon?.def) || 0) + defMods.def);

    // Posição defensiva do jogador alvo
    const playerCombatants = (enc.participants || []).map(pid => {
        const p = helpers.getPlayerById(pid);
        const m = helpers.getActiveMonsterOfPlayer(p);
        return { id: pid, side: 'player', position: enc.positions?.[pid] || POSITION.FRONT, hp: Number(m?.hp) || 0 };
    });
    const playerPosMod = getTargetPosMod(enc, finalTargetPid, 'player', playerCombatants);

    // Resolver confronto bilateral (FASE I — inimigo ataca)
    const confrontResult = resolveConfrontation({
        d20A, d20D,
        atkAtk: effectiveAtk,
        atkDef: effectiveDef,
        atkLvl: Number(enemy.level) || 1,
        defLvl: Number(targetMon?.level) || 1,
        classModAtk: classAdv.atkBonus,
        posMod: playerPosMod,
        buffOff: 0,
        buffDef: 0,
    });

    const isHit = !alwaysMiss && confrontResult.category !== RC_CATEGORY.FALHA_TOTAL;

    if (!isHit) {
        helpers.log(enc, `🎲 ${enemyName} rolou d20A:${d20A} vs d20D:${d20D} → RC${confrontResult.rc} ERROU. ${targetName} (${targetMonName}) esquivou!`);
        ui.showMissFeedback(`grpE_${actor.id}`);
        advanceGroupTurn(enc, deps);
        storage.save();
        ui.render();
        return true;
    }

    // Calcular dano via fórmula canônica
    const basicPower = helpers.getBasicAttackPower(enemy.class);
    const lvlDiff = (Number(enemy.level) || 1) - (Number(targetMon?.level) || 1);

    const { damage: baseDmg } = computeGroupDamage({
        pwr: basicPower,
        atk: effectiveAtk,
        lvlDiff,
        defEnemy: effectiveDef,
        damageMult: classAdv.damageMult,
        critBonus: confrontResult.critDmgBonus,
        category: confrontResult.category,
        d20ANatural: confrontResult.d20ANatural,
        d20DNatural: confrontResult.d20DNatural,
    });

    let dmg = baseDmg;

    // A4: Passiva ofensiva do inimigo atacante (Ladino +10% dano)
    const atkClassPassive = CLASS_COMBAT_PASSIVES[enemy.class];
    if (atkClassPassive?.attackBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 + atkClassPassive.attackBonus)));
    }

    // IA Mago: bônus de dano de skill (+20%)
    if (magoDmgBonus) {
        dmg = Math.max(1, Math.round(dmg * 1.20));
        helpers.log(enc, `🔮 ${enemyName} (Mago) usou skill ofensiva! Dano amplificado!`);
    }

    // PR-02: passiva de espécie do inimigo atacante (on_attack)
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

    // A4: Passiva defensiva do defensor
    const defClassPassive = CLASS_COMBAT_PASSIVES[targetMon?.class];
    if (defClassPassive?.defenseBonus) {
        dmg = Math.max(1, Math.round(dmg * (1 - defClassPassive.defenseBonus)));
    }

    // PR-02: passiva de espécie do defensor
    if (targetMon) {
        const targetDefSpeciesPassive = fireCombatEvent(targetMon, ON_HIT, {
            hpPct: (Number(targetMon.hpMax) || 1) > 0 ? (Number(targetMon.hp) || 0) / (Number(targetMon.hpMax) || 1) : 0,
            isFirstHitThisTurn: true,
        });
        if (targetDefSpeciesPassive?.damageReduction) {
            const reduced = Math.max(1, dmg - targetDefSpeciesPassive.damageReduction);
            if (reduced < dmg) helpers.log(enc, `🛡️ Passiva ${targetMonName}: -${dmg - reduced} dano`);
            dmg = reduced;
        }
    }

    helpers.applyDamage(targetMon, dmg);
    markAsParticipated(targetMon);
    markAsParticipated(enemy);
    enc.recentTargets[finalTargetPid] = (enc.recentTargets[finalTargetPid] || 0) + 1;

    const rcLabelEnemy = confrontResult.category === RC_CATEGORY.ACERTO_FORTE ? 'Acerto Forte ×1.25'
        : confrontResult.category === RC_CATEGORY.ACERTO_NORMAL ? 'Acerto Normal ×1.00'
        : confrontResult.category === RC_CATEGORY.ACERTO_REDUZIDO ? 'Acerto Reduzido ×0.60'
        : 'Contato Neutralizado';
    const critTextEnemy = isCrit ? ' 💥CRIT!' : '';
    helpers.log(enc, `🎲 ${enemyName} d20A:${d20A}/d20D:${d20D} RC${confrontResult.rc} → ${rcLabelEnemy}${critTextEnemy} | ${targetName} (${targetMonName}) ${dmg} dano`);

    storage.save();
    ui.render();
    ui.showDamageFeedback(`grpP_${finalTargetPid}`, dmg, isCrit);

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
    // FASE III: Rastrear rodadas e limpar TAUNT/MARK ao final de cada rodada
    const nextTurnIndex = ((Number(enc.turnIndex) || 0) + 1) % enc.turnOrder.length;
    if (nextTurnIndex === 0) {
        // Nova rodada iniciada
        enc._roundNumber = (enc._roundNumber || 1) + 1;
        // Limpar TAUNT e MARK: efeitos duram apenas 1 rodada
        enc.tauntActiveId = null;
        enc.tauntActiveMonName = null;
        enc.markedEnemyIndex = undefined;
    }

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
        enc.therapyLog = enc.therapyLog || [];
        enc.therapyLog.push({ event: 'flee', playerId: player.id });
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

    // TAUNT: ativa provocação por 1 turno; usa mon.id como identificador canônico
    if (skill.effect === 'taunt' || skill.type === 'TAUNT') {
        // Preferir mon.id para identificação consistente; fallback ao nome apenas se id ausente
        enc.tauntActiveId = mon.id ?? null;
        enc.tauntActiveMonName = monName; // campo auxiliar apenas para log/exibição
        helpers.log(enc, `🎯 ${monName} usou ${skillName}! TAUNT ativo: inimigos focam neste alvo!`);
        return;
    }

    // MARK: marca inimigo (pega o primeiro vivo)
    if (skill.effect === 'mark') {
        const enemies = enc.enemies || [];
        const markIdx = enemies.findIndex(e => (Number(e?.hp) || 0) > 0);
        if (markIdx !== -1) {
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
        enc.therapyLog = enc.therapyLog || [];
        enc.therapyLog.push({ event: 'ally_heal', playerId: player?.id, skillName });
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

        // Passiva Caçador: +2 de dano plano vs alvo com HP < 50%
        dmg = applyHunterWeakTargetBonus(dmg, enemy, skillAtkPassive);

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

/**
 * FASE VII-B — Ação de Mover Posição
 *
 * Permite ao jogador ativo ciclar sua posição de batalha:
 * front → mid → back → front
 *
 * Consome o turno do jogador. Não consome ENE.
 *
 * @param {object} deps - Dependências injetadas
 * @returns {boolean} true se a ação foi executada
 */
export function executeGroupMove(deps) {
    const { state, core, ui, storage, helpers } = deps;
    const enc = state.currentEncounter;

    if (!enc || enc.finished) return false;

    const actor = core.getCurrentActor(enc);
    if (!actor || actor.side !== 'player') return false;

    const player = helpers.getPlayerById(actor.id);
    if (!player) return false;

    const mon = helpers.getActiveMonsterOfPlayer(player);
    if (!mon || !core.isAlive(mon)) return false;

    // Garantir posições inicializadas
    ensurePositions(enc, deps);

    // Ciclar posição: front → mid → back → front
    const cycle = { front: POSITION.MID, mid: POSITION.BACK, back: POSITION.FRONT };
    const currentPos = enc.positions[actor.id] || POSITION.FRONT;
    const newPos = cycle[currentPos] || POSITION.FRONT;
    enc.positions[actor.id] = newPos;

    const posLabels = { front: 'Linha da Frente', mid: 'Meio', back: 'Retaguarda' };
    const playerName = player.name || player.nome || 'Jogador';
    const monName = mon.nickname || mon.name || mon.nome || 'Monstrinho';
    helpers.log(enc, `📍 ${playerName} (${monName}) moveu para ${posLabels[newPos] || newPos}!`);

    advanceGroupTurn(enc, deps);
    storage.save();
    ui.render();
    return true;
}
