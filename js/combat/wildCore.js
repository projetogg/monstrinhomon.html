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
 * FÓRMULA BASE: floor(POWER * (ATK / (ATK + DEF))) * damageMult
 * DANO MÍNIMO: sempre 1
 * 
 * VANTAGEM DE CLASSE (Dano):
 * - Vantagem: 1.10 (110% do dano base)
 * - Desvantagem: 0.90 (90% do dano base)
 * - Neutro: 1.0 (100% do dano base)
 * 
 * EXEMPLO:
 * ATK=10, DEF=5, POWER=15
 * ratio = 10/(10+5) = 0.666
 * baseD = floor(15 * 0.666) = floor(9.99) = 9
 * finalD = floor(9 * 1.0) = 9
 */
export function calcDamage({ atk, def, power, damageMult = 1.0 }) {
    try {
        // ratio = ATK / (ATK + DEF)
        const ratio = atk / (atk + def);
        
        // danoBase = floor(POWER * ratio)
        const baseD = Math.floor(power * ratio);
        
        // Aplicar multiplicador de classe
        const finalD = Math.floor(baseD * damageMult);
        
        // Dano mínimo sempre 1
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
