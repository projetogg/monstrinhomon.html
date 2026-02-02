/**
 * GROUP COMBAT CORE - Funções Puras
 * 
 * PR5B: Implementação real das funções puras do combate em grupo/boss
 * 
 * Todas as funções aqui são 100% determinísticas e testáveis
 * ZERO side effects (sem DOM, sem state mutation, sem I/O)
 * 
 * Dependency Injection: todas as dependências externas (GameState, players, rollD20)
 * são passadas como parâmetros
 */

// Re-export shared combat mechanics from Wild 1v1 combat module (PR4)
// Estas funções são reutilizadas tanto em wild quanto em group/boss combat
// checkHit: verifica se ataque acerta baseado em d20 + ATK vs DEF
// calcDamage: calcula dano final com fórmula ATK + POWER - DEF
// getBuffModifiers: retorna modificadores de buffs ativos (+ATK, +DEF, +SPD)
export { checkHit, calcDamage, getBuffModifiers, getClassAdvantageModifiers } from './wildCore.js';

// Import for internal use in this module
import { getBuffModifiers as _getBuffModifiers } from './wildCore.js';

/**
 * Retorna ator atual do encounter baseado em turnIndex
 * 
 * PURE: Sem side effects, apenas leitura de dados
 * 
 * @param {object} enc - Encounter de grupo
 * @returns {object|null} Ator atual ou null
 */
export function getCurrentActor(enc) {
    if (!enc || !enc.turnOrder || enc.turnOrder.length === 0) return null;
    const idx = Number(enc.turnIndex) || 0;
    return enc.turnOrder[idx] || null;
}

/**
 * Verifica se há jogadores vivos no encounter
 * 
 * PURE: Sem side effects, recebe dados por parâmetro (dependency injection)
 * 
 * @param {object} enc - Encounter de grupo
 * @param {array} playersData - Array com dados dos jogadores: [{ id, team: [monsters] }]
 * @returns {boolean} true se algum jogador tem monstrinho vivo
 */
export function hasAlivePlayers(enc, playersData) {
    for (const pid of (enc.participants || [])) {
        const player = playersData.find(p => p.id === pid);
        if (!player || !Array.isArray(player.team)) continue;
        
        // Check if player has any alive monster in team
        for (const monster of player.team) {
            if (isAlive(monster)) return true;
        }
    }
    return false;
}

/**
 * Verifica se há inimigos vivos no encounter
 * 
 * PURE: Sem side effects, apenas leitura de dados
 * 
 * @param {object} enc - Encounter de grupo
 * @returns {boolean} true se algum inimigo tem HP > 0
 */
export function hasAliveEnemies(enc) {
    for (const e of (enc.enemies || [])) {
        if (isAlive(e)) return true;
    }
    return false;
}

/**
 * IA - escolhe alvo com menor HP%
 * 
 * PURE: Recebe array de targets já preparado (sem acessar GameState)
 * 
 * @param {array} targets - Array de targets: [{ id, hp, hpMax }]
 * @returns {string|null} ID do alvo escolhido ou null
 */
export function chooseTargetByLowestHP(targets) {
    if (!targets || targets.length === 0) return null;
    
    let best = null;
    for (const target of targets) {
        const hp = Number(target.hp) || 0;
        const hpMax = Number(target.hpMax) || 1;
        const pct = hp / hpMax;
        
        if (!best || pct < best.pct) {
            best = { id: target.id, pct };
        }
    }
    
    return best ? best.id : null;
}

/**
 * Calcula defesa efetiva de um monstrinho
 * 
 * PURE: effectiveDef = monster.def + itemBonus + buffBonus
 * 
 * @param {object} monster - Monstrinho
 * @param {object|null} heldItem - Item equipado (ou null)
 * @returns {number} Defesa efetiva
 */
export function calculateEffectiveDefense(monster, heldItem = null) {
    const baseDef = Number(monster?.def) || 0;
    const itemBonus = Number(heldItem?.stats?.def) || 0;
    const buffMods = _getBuffModifiers(monster);
    const buffBonus = Number(buffMods?.def) || 0;
    
    return baseDef + itemBonus + buffBonus;
}

/**
 * IA v1 - Escolhe alvo baseado em DEF (aggro)
 * 
 * PURE: Sistema de pontuação com múltiplos fatores
 * 
 * Fórmula de Score:
 * score = aggroDEF + posBonus + finisherBonus + noise - focusPenalty
 * 
 * - aggroDEF: DEF normalizada (0-24), tanks naturalmente atraem
 * - posBonus: neutro (8) por enquanto, futuro: grid/distance
 * - finisherBonus: HP baixo (0-16), ajuda a finalizar
 * - noise: aleatoriedade (-6 a +6), comportamento não-robótico
 * - focusPenalty: anti-repetição (8 por hit recente), espalha dano
 * 
 * Seleção: Top 3 ponderado (60% top1, 30% top2, 10% top3)
 * 
 * @param {array} targets - Array de alvos elegíveis: [{ id, playerId, monster, heldItem }]
 * @param {object} recentTargets - Mapa de IDs recentes: { playerId: hitCount }
 * @param {function} rngFn - Função random (0-1) para testes determinísticos
 * @returns {string|null} playerId do alvo escolhido ou null
 */
export function pickEnemyTargetByDEF(targets, recentTargets = {}, rngFn = Math.random) {
    if (!targets || targets.length === 0) return null;
    
    // Calcular scores para cada alvo
    const scored = [];
    
    // Primeiro passo: coletar todas as DEFs para normalização
    const defs = targets.map(t => calculateEffectiveDefense(t.monster, t.heldItem));
    const defMin = Math.min(...defs);
    const defMax = Math.max(...defs);
    const defRange = Math.max(1, defMax - defMin);
    
    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const def = defs[i];
        
        // A) aggroDEF: DEF normalizada (0-24)
        const defNorm = (def - defMin) / defRange;
        const aggroDEF = defNorm * 24;
        
        // B) posBonus: neutro por enquanto
        const posBonus = 8;
        
        // C) finisherBonus: HP% baixo
        const hp = Number(target.monster?.hp) || 0;
        const hpMax = Number(target.monster?.hpMax) || 1;
        const hpPct = hp / hpMax;
        const finisherBonus = clamp((1 - hpPct) * 16, 0, 16);
        
        // D) noise: aleatoriedade (-6 a +6)
        const noise = (rngFn() * 12) - 6;
        
        // E) focusPenalty: penalidade por repetição
        const recentHits = recentTargets[target.playerId] || 0;
        const focusPenalty = recentHits * 8;
        
        // Score total
        const score = aggroDEF + posBonus + finisherBonus + noise - focusPenalty;
        
        scored.push({
            playerId: target.playerId,
            score: score,
            _debug: { aggroDEF, posBonus, finisherBonus, noise, focusPenalty, def }
        });
    }
    
    // Ordenar por score descendente
    scored.sort((a, b) => b.score - a.score);
    
    // Seleção ponderada: top 3
    // 60% top1, 30% top2, 10% top3
    const roll = rngFn();
    
    if (scored.length === 1) {
        return scored[0].playerId;
    } else if (scored.length === 2) {
        return roll < 0.60 ? scored[0].playerId : scored[1].playerId;
    } else {
        // 3 ou mais alvos
        if (roll < 0.60) {
            return scored[0].playerId;  // 60%
        } else if (roll < 0.90) {
            return scored[1].playerId;  // 30%
        } else {
            return scored[2].playerId;  // 10%
        }
    }
}

/**
 * Calcula ordem de turnos baseada em SPD
 * 
 * PURE: Recebe rollD20Fn por parâmetro para permitir testes determinísticos
 * 
 * @param {object} enc - Encounter de grupo
 * @param {array} playersData - Array com dados dos jogadores: [{ id, name, team: [monsters] }]
 * @param {function} rollD20Fn - Função para rolar d20 (dependency injection)
 * @returns {array} Array de atores ordenados por SPD + tiebreak
 */
export function calculateTurnOrder(enc, playersData, rollD20Fn) {
    const order = [];
    
    // Adicionar jogadores participantes
    for (const pid of (enc.participants || [])) {
        const p = playersData.find(x => x.id === pid);
        if (!p) continue;
        
        const mon = p.team?.[0];
        if (!mon) continue;
        
        const hp = Number(mon.hp) || 0;
        if (hp <= 0) continue;
        
        order.push({
            side: "player",
            id: pid,
            name: p.name || p.nome || "Jogador",
            spd: Number(mon.spd) || 0,
            _tiebreak: null
        });
    }
    
    // Adicionar inimigos
    for (let i = 0; i < (enc.enemies || []).length; i++) {
        const e = enc.enemies[i];
        if (!e) continue;
        
        const hp = Number(e.hp) || 0;
        if (hp <= 0) continue;
        
        order.push({
            side: "enemy",
            id: i,
            name: e.name || e.nome || `Inimigo ${i + 1}`,
            spd: Number(e.spd) || 0,
            _tiebreak: null
        });
    }
    
    // Ordenar por SPD descendente
    order.sort((a, b) => (b.spd - a.spd));
    
    // Desempate por grupos de mesmo SPD
    let blockStart = 0;
    while (blockStart < order.length) {
        let blockEnd = blockStart + 1;
        while (blockEnd < order.length && order[blockEnd].spd === order[blockStart].spd) {
            blockEnd++;
        }
        
        // [blockStart, blockEnd) é o bloco empatado
        if (blockEnd - blockStart > 1) {
            // Rolar d20 para cada membro do bloco empatado
            for (let index = blockStart; index < blockEnd; index++) {
                order[index]._tiebreak = rollD20Fn();
            }
            // Ordenar bloco por tiebreak (maior primeiro)
            const sortedBlock = order.slice(blockStart, blockEnd).sort((a, b) => (b._tiebreak - a._tiebreak));
            for (let index = 0; index < sortedBlock.length; index++) {
                order[blockStart + index] = sortedBlock[index];
            }
        }
        
        blockStart = blockEnd;
    }
    
    return order;
}

/**
 * Verifica se entidade está viva (HP > 0)
 * 
 * PURE: Sem side effects, apenas leitura de dados
 * 
 * @param {object} entity - Monstrinho ou inimigo
 * @returns {boolean} true se HP > 0
 */
export function isAlive(entity) {
    return (Number(entity?.hp) || 0) > 0;
}

/**
 * Clamp de número entre min e max
 * 
 * PURE: Sem side effects, matemática pura
 * 
 * @param {number} n - Número a clampar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {number} Número clampado
 */
export function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
