/**
 * WILD COMBAT CORE - Funções Puras
 * 
 * Todas as funções aqui são 100% determinísticas e testáveis
 * ZERO side effects (sem DOM, sem state mutation, sem I/O)
 * 
 * Dependency Injection: todas as dependências externas (GameState, MM_TABLES)
 * são passadas como parâmetros
 */

/**
 * Verifica se um ataque acerta o alvo
 * 
 * @param {number} d20Roll - Resultado do dado (1-20)
 * @param {object} attacker - Monstrinho atacante
 * @param {object} defender - Monstrinho defensor
 * @param {object} classAdvantages - Tabela de vantagens de classe
 * @returns {boolean} true se acerta, false se erra
 * 
 * REGRA: d20 + ATK + bônus_classe >= DEF
 * Bônus de classe: +2 se vantagem, -2 se desvantagem
 */
export function checkHit(d20Roll, attacker, defender, classAdvantages) {
    try {
        if (!attacker || !defender) return false;
        
        const atkMod = attacker.atk || 5;
        const defValue = defender.def || 3;
        
        // Vantagem de classe: +2 ATK se forte, -2 ATK se fraco
        let atkBonus = 0;
        if (classAdvantages && attacker.class && defender.class) {
            const classAdv = classAdvantages[attacker.class];
            if (classAdv?.strong === defender.class) {
                atkBonus = 2;
            } else if (classAdv?.weak === defender.class) {
                atkBonus = -2;
            }
        }
        
        const totalAtk = d20Roll + atkMod + atkBonus;
        return totalAtk >= defValue;
    } catch (error) {
        console.error('Hit check failed:', error);
        return false;
    }
}

/**
 * Calcula dano de um ataque
 * 
 * @param {object} params - Parâmetros de dano
 * @param {number} params.atk - Ataque efetivo (com buffs)
 * @param {number} params.def - Defesa efetiva (com buffs)
 * @param {number} params.power - Poder da habilidade/ataque
 * @param {number} params.damageMult - Multiplicador (1.0 padrão, 1.10 vantagem, 0.90 desvantagem)
 * @returns {number} Dano final (mínimo 1)
 * 
 * FÓRMULA (alinhada com GAME_RULES.md):
 * base = ATK + POWER - DEF
 * final = max(1, floor(base * damageMult))
 * 
 * VANTAGEM DE CLASSE (Dano):
 * - Vantagem: 1.10 (110% do dano base)
 * - Desvantagem: 0.90 (90% do dano base)
 * - Neutro: 1.0 (100% do dano base)
 * 
 * EXEMPLO:
 * ATK=10, DEF=5, POWER=15
 * base = 10 + 15 - 5 = 20
 * finalD = max(1, floor(20 * 1.0)) = 20
 */
export function calcDamage({ atk, def, power, damageMult = 1.0 }) {
    try {
        // FÓRMULA: ATK + POWER - DEF (GAME_RULES.md)
        const base = atk + power - def;
        
        // Aplicar multiplicador de classe e garantir dano mínimo 1
        const finalD = Math.floor(base * damageMult);
        return Math.max(1, finalD);
    } catch (error) {
        console.error('Damage calculation failed:', error);
        return 1;
    }
}

/**
 * Calcula modificadores de buffs ativos
 * 
 * @param {object} monster - Monstrinho com array de buffs
 * @returns {object} {atk: number, def: number, spd: number}
 */
export function getBuffModifiers(monster) {
    try {
        if (!monster || !monster.buffs) return { atk: 0, def: 0, spd: 0 };
        
        const mods = { atk: 0, def: 0, spd: 0 };
        
        monster.buffs.forEach(buff => {
            const type = buff.type.toLowerCase();
            if (type === 'atk') mods.atk += buff.power;
            else if (type === 'def') mods.def += buff.power;
            else if (type === 'spd') mods.spd += buff.power;
        });
        
        return mods;
    } catch (error) {
        console.error('Failed to get buff modifiers:', error);
        return { atk: 0, def: 0, spd: 0 };
    }
}

/**
 * Wrapper de compatibilidade - calcula dano com ataque básico
 * Aplica automaticamente buffs e vantagens de classe
 * 
 * @param {object} attacker - Monstrinho atacante
 * @param {object} defender - Monstrinho defensor
 * @param {function} getBasicPower - Função que retorna POWER básico por classe
 * @param {object} classAdvantages - Tabela de vantagens de classe
 * @returns {number} Dano final
 * 
 * FLUXO:
 * 1. Obtém stats base (atk, def)
 * 2. Aplica modificadores de buffs
 * 3. Obtém POWER básico da classe
 * 4. Calcula multiplicador de classe
 * 5. Chama calcDamage() com todos os parâmetros
 */
export function calculateDamage(attacker, defender, getBasicPower, classAdvantages) {
    try {
        if (!attacker || !defender) return 1;
        
        const atkValue = attacker.atk || 5;
        const defValue = defender.def || 3;
        
        // POWER básico por classe
        const basicPower = getBasicPower(attacker.class);
        
        // Aplicar modificadores de buff
        const atkMods = getBuffModifiers(attacker);
        const effectiveAtk = Math.max(1, atkValue + atkMods.atk);
        
        const defMods = getBuffModifiers(defender);
        const effectiveDef = Math.max(1, defValue + defMods.def);
        
        // Vantagem de classe: +10% dano se forte, -10% dano se fraco
        let damageMult = 1.0;
        if (classAdvantages && attacker.class && defender.class) {
            const classAdv = classAdvantages[attacker.class];
            if (classAdv?.strong === defender.class) {
                damageMult = 1.10;
            } else if (classAdv?.weak === defender.class) {
                damageMult = 0.90;
            }
        }
        
        return calcDamage({
            atk: effectiveAtk,
            def: effectiveDef,
            power: basicPower,
            damageMult: damageMult
        });
    } catch (error) {
        console.error('Failed to calculate damage:', error);
        return 1;
    }
}

/**
 * Extrai lógica de vantagem de classe
 * Retorna modificadores de ataque e dano
 * 
 * @param {string} attackerClass - Classe do atacante
 * @param {string} defenderClass - Classe do defensor
 * @param {object} classAdvantages - Tabela de vantagens
 * @returns {object} { atkBonus: number, damageMult: number }
 */
export function getClassAdvantageModifiers(attackerClass, defenderClass, classAdvantages) {
    const result = { atkBonus: 0, damageMult: 1.0 };
    
    if (!classAdvantages || !attackerClass || !defenderClass) {
        return result;
    }
    
    const classAdv = classAdvantages[attackerClass];
    if (!classAdv) return result;
    
    if (classAdv.strong === defenderClass) {
        result.atkBonus = 2;
        result.damageMult = 1.10;
    } else if (classAdv.weak === defenderClass) {
        result.atkBonus = -2;
        result.damageMult = 0.90;
    }
    
    return result;
}

/**
 * Aplica dano ao HP (puro)
 * 
 * @param {number} currentHP - HP atual
 * @param {number} damage - Dano a aplicar
 * @returns {number} Novo HP (mínimo 0)
 */
export function applyDamageToHP(currentHP, damage) {
    return Math.max(0, currentHP - damage);
}

/**
 * Verifica se é crítico (d20=20) ou falha crítica (d20=1)
 * 
 * @param {number} d20Roll - Resultado do dado
 * @returns {object} { isCrit20: boolean, isFail1: boolean }
 */
export function checkCriticalRoll(d20Roll) {
    return {
        isCrit20: d20Roll === 20,
        isFail1: d20Roll === 1
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE CAPTURA SELVAGEM — Multi-eixo
//
// Capture Score = f(HP, Agressividade, Abertura) + bônus de orb
// Cada eixo contribui independentemente, permitindo que classes de suporte
// (Curandeiro, Bardo, Animalista) capturem sem depender de dano bruto.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ações de captura por classe.
 *
 * Design de duas trilhas:
 * - Trilha Física   (HP):         classes ofensivas são naturalmente mais eficientes
 * - Trilha Comportamental (Agressividade): classes de suporte são naturalmente mais eficientes
 *
 * aggDelta  — redução de agressividade por ação (negativo = acalma o selvagem)
 * openDelta — mantido por retrocompatibilidade, sem efeito no score atual
 */
export const CAPTURE_ACTIONS = {
    // Suporte — trilha comportamental forte
    Curandeiro: { id: 'calm',       name: 'Acalmar',       emoji: '🌿', aggDelta: -40, openDelta:  0 },
    Bardo:      { id: 'sing',       name: 'Melodia Suave', emoji: '🎵', aggDelta: -35, openDelta:  0 },
    Animalista: { id: 'bond',       name: 'Criar Vínculo', emoji: '🐾', aggDelta: -30, openDelta:  0 },
    // Híbrido — redução moderada de agressividade
    Ladino:     { id: 'distract',   name: 'Distrair',      emoji: '🌑', aggDelta: -25, openDelta:  0 },
    Mago:       { id: 'charm',      name: 'Enfeitiçar',    emoji: '🔮', aggDelta: -20, openDelta:  0 },
    // Ofensivo — conter fisicamente, reduz menos agressividade
    Guerreiro:  { id: 'contain',    name: 'Conter',        emoji: '⚔️', aggDelta: -20, openDelta:  0 },
    Caçador:    { id: 'trap',       name: 'Imobilizar',    emoji: '🏹', aggDelta: -20, openDelta:  0 },
    Bárbaro:    { id: 'intimidate', name: 'Intimidar',     emoji: '⚡', aggDelta: -15, openDelta:  0 },
};

/**
 * Calcula o Capture Score para um selvagem — sistema de duas trilhas.
 *
 * Fórmula simplificada (HP + Agressividade, contribuição igual):
 *   hpScore    = (1 - hp/hpMax) * 50   → 0 HP cheio, 50 HP = 0
 *   aggrScore  = (1 - aggression/100) * 50 → 0 totalmente agressivo, 50 totalmente calmo
 *   finalScore = min(100, hpScore + aggrScore + orbBonusPp)
 *
 * Isso permite que:
 * - Classes ofensivas cheguem ao score reduzindo HP
 * - Classes de suporte cheguem ao score reduzindo Agressividade
 * - Ambas as estratégias têm igual peso máximo (50 pontos cada)
 *
 * @param {object} monster      - Monstrinho selvagem (com hp, hpMax, aggression?)
 * @param {number} orbBonusPp   - Bônus da orb em pontos percentuais (0, 10 ou 20)
 * @returns {number} Capture Score (0–100)
 */
export function calculateCaptureScore(monster, orbBonusPp = 0) {
    if (!monster) return 0;
    const hp         = Number(monster?.hp   ?? 0);
    const hpMax      = Number(monster?.hpMax ?? 1);
    const aggression = Math.min(100, Math.max(0, Number(monster?.aggression ?? 100)));

    const hpFactor  = Math.max(0, 1 - hp / hpMax);
    const hpScore   = hpFactor * 50;
    const aggrScore = (1 - aggression / 100) * 50;

    return Math.min(100, Math.round(hpScore + aggrScore + orbBonusPp));
}

/**
 * Retorna rótulo de prontidão para captura com base no score.
 *
 * @param {number} score - Capture Score (0–100)
 * @returns {{ text: string, emoji: string, css: string }}
 */
export function getCaptureReadinessLabel(score) {
    if (score < 25) return { text: 'Muito arisco',        emoji: '🔴', css: 'danger' };
    if (score < 45) return { text: 'Instável',            emoji: '🟡', css: 'warning' };
    if (score < 65) return { text: 'Vulnerável',          emoji: '🟢', css: 'success' };
    if (score < 80) return { text: 'Pronto para captura', emoji: '🔵', css: 'info' };
    return               { text: 'Captura quase certa',  emoji: '✅', css: 'success-dark' };
}

/**
 * Aplica uma ação de captura ao estado do selvagem.
 * ATENÇÃO: muta `wildMonster` diretamente (não é função pura).
 *
 * @param {object} wildMonster - Estado mutável do selvagem
 * @param {object} action      - Entrada de CAPTURE_ACTIONS (aggDelta)
 */
export function applyCaptureAction(wildMonster, action) {
    if (!wildMonster || !action) return;
    wildMonster.aggression = Math.max(0, Math.min(100, (wildMonster.aggression ?? 100) + action.aggDelta));
    // openDelta mantido por retrocompatibilidade; openness não afeta o score atual
    if (action.openDelta !== undefined && wildMonster.openness !== undefined) {
        wildMonster.openness = Math.max(0, Math.min(100, (wildMonster.openness ?? 0) + action.openDelta));
    }
}
