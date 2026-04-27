/**
 * WILD COMBAT CORE - Funções Puras
 * 
 * Todas as funções aqui são 100% determinísticas e testáveis
 * ZERO side effects (sem DOM, sem state mutation, sem I/O)
 * 
 * Dependency Injection: todas as dependências externas (GameState, MM_TABLES)
 * são passadas como parâmetros
 */

// ── PR-03: Fuga canônica (BLOCO 11 do Patch v2.2) ────────────────────────────

/**
 * DCs de fuga canônicos (PATCH_CANONICO_COMBATE_V2.2 BLOCO 11).
 * Fórmula: d20 + SPD >= DC_fuga
 */
export const FLEE_DC = {
    normal:       12,
    intimidating: 16,
    elite:        18,
};

/**
 * Verifica se uma tentativa de fuga canônica é bem-sucedida.
 *
 * Fórmula: d20 + SPD >= DC_fuga
 *
 * @param {object} monster   - Monstrinho que tenta fugir (precisa de .spd ou campos de buff)
 * @param {number} d20Roll   - Resultado do d20 (1–20)
 * @param {string} [fleeType='normal'] - Tipo do encontro: 'normal' | 'intimidating' | 'elite'
 * @returns {{ success: boolean, roll: number, spd: number, dc: number, total: number }}
 */
export function checkFleeCanonical(monster, d20Roll, fleeType = 'normal') {
    const spd = getEffectiveSpd(monster);
    const dc  = FLEE_DC[fleeType] ?? FLEE_DC.normal;
    const total = d20Roll + spd;
    return { success: total >= dc, roll: d20Roll, spd, dc, total };
}

/**
 * Verifica se um ataque acerta o alvo
 * 
 * @param {number} d20Roll - Resultado do dado (1-20)
 * @param {object} attacker - Monstrinho atacante
 * @param {object} defender - Monstrinho defensor
 * @param {object} classAdvantages - Tabela de vantagens de classe
 * @param {number} [spdBonus=0] - Bônus de agilidade por SPD (+1, 0 ou -1) — Fase 11.2
 * @returns {boolean} true se acerta, false se erra
 * 
 * REGRA: d20 + ATK + bônus_classe + bônus_agilidade >= DEF
 * Bônus de classe: +2 se vantagem, -2 se desvantagem
 * Bônus de agilidade (Fase 11.2): +1 se SPD_atacante >= SPD_defensor + 3; -1 se inverso
 */
export function checkHit(d20Roll, attacker, defender, classAdvantages, spdBonus = 0) {
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
        
        // Fase 11.2: bônus de agilidade por SPD (±1, leve)
        const totalAtk = d20Roll + atkMod + atkBonus + spdBonus;
        return totalAtk >= defValue;
    } catch (error) {
        console.error('Hit check failed:', error);
        return false;
    }
}

/**
 * Resolve acerto em confronto de dados (ataque vs defesa).
 * Fórmula: (d20A + ATK + bônus + SPD) >= (d20D + DEF)
 *
 * @param {number} attackRoll
 * @param {number} defenseRoll
 * @param {object} attacker
 * @param {object} defender
 * @param {object} classAdvantages
 * @param {number} spdBonus
 * @returns {boolean}
 */
export function checkHitDiceClash(attackRoll, defenseRoll, attacker, defender, classAdvantages, spdBonus = 0) {
    if (!attacker || !defender) return false;
    const atkMod = attacker.atk || 5;
    const defValue = defender.def || 3;
    const classAdv = classAdvantages?.[attacker.class];
    let atkBonus = 0;
    if (classAdv?.strong === defender.class) atkBonus = 2;
    else if (classAdv?.weak === defender.class) atkBonus = -2;

    const offensiveTotal = attackRoll + atkMod + atkBonus + spdBonus;
    const defensiveTotal = defenseRoll + defValue;
    return offensiveTotal >= defensiveTotal;
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE SPD — Fase 11.2
//
// SPD passou a influenciar dois pontos reais do runtime:
//   1. Bônus de agilidade no acerto (±1 ATK no checkHit)
//   2. Chance de fuga (flee chance baseada em SPD relativo)
//
// As funções abaixo são 100% puras e testáveis.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Diferença mínima de SPD para ativar bônus/penalidade de agilidade.
 * Threshold conservador: evita que diferenças triviais de SPD alterem o hit check.
 * - bellwave (SPD 12) + Nota Discordante I (-2 enemy SPD): diff 4 ≥ 3 → +1 bônus
 * - moonquill com spdBuff (+1 SPD) vs enemy SPD 5: diff 3 ≥ 3 → +1 bônus
 */
const SPD_ADVANTAGE_THRESHOLD = 3;

/**
 * Calcula o SPD efetivo de um monstrinho, aplicando buffs/debuffs ativos.
 *
 * @param {object} monster - Monstrinho (com .spd e .buffs opcional)
 * @returns {number} SPD efetivo (mínimo 1)
 *
 * Fase 11.2: ponto central para consumo real de mods.spd.
 * Qualquer buff/debuff de SPD (ex.: Nota Discordante, moonquill spdBuff)
 * passa a afetar resultados reais de combate via esta função.
 */
export function getEffectiveSpd(monster) {
    if (!monster) return 1;
    const baseSpd = monster.spd || 1;
    const mods = getBuffModifiers(monster);
    return Math.max(1, baseSpd + mods.spd);
}

/**
 * Calcula o bônus de agilidade baseado em SPD relativo entre atacante e defensor.
 *
 * @param {object} attacker - Monstrinho atacante
 * @param {object} defender - Monstrinho defensor
 * @returns {number} +1 se atacante mais rápido (diff ≥ SPD_ADVANTAGE_THRESHOLD),
 *                   -1 se mais lento (diff ≤ -SPD_ADVANTAGE_THRESHOLD), 0 neutro
 *
 * Design conservador (Fase 11.2):
 * - SPD_ADVANTAGE_THRESHOLD=3: evita que qualquer diferença trivial de SPD mude o hit
 * - Nota Discordante I (-2 SPD inimigo) cruzará o threshold quando bellwave
 *   já tem vantagem de velocidade moderada → Nota passa a importar de verdade
 * - moonquill spdBuff (+1 SPD) cruzará o threshold quando o Mago estava a 2
 *   pontos da vantagem → buff deixa de ser cosmético
 * - Bonus máximo: ±1 (análogo à 1/4 do bônus de classe) — sem dominância
 */
export function getSpdAdvantage(attacker, defender) {
    const diff = getEffectiveSpd(attacker) - getEffectiveSpd(defender);
    if (diff >= SPD_ADVANTAGE_THRESHOLD) return 1;
    if (diff <= -SPD_ADVANTAGE_THRESHOLD) return -1;
    return 0;
}

/**
 * Calcula a chance de fuga de um encontro selvagem, baseada em SPD relativo.
 *
 * @param {object} playerMonster - Monstrinho do jogador (com .spd e .buffs)
 * @param {object} wildMonster - Monstrinho selvagem (com .spd e .buffs)
 * @param {number} [baseChance=15] - Chance base de fuga em % (típico: 10–25 por raridade)
 * @returns {number} Chance de fuga em % (clampada a [5, 95])
 *
 * Fórmula: baseChance + (playerSpd - wildSpd) * 2
 * - +2% por ponto de SPD a favor do jogador
 * - -2% por ponto de SPD a favor do inimigo
 * - Nota Discordante (-2 SPD inimigo): +4% de chance de fuga adicional
 * - moonquill spdBuff (+1 SPD): +2% de chance de fuga adicional
 * - Clampado em [5%, 95%]: sempre há risco mínimo ou máximo razoável
 */
export function calculateFleeChance(playerMonster, wildMonster, baseChance = 15) {
    const playerSpd = getEffectiveSpd(playerMonster);
    const wildSpd = getEffectiveSpd(wildMonster);
    const spdDiff = playerSpd - wildSpd;
    return Math.min(95, Math.max(5, Math.round(baseChance + spdDiff * 2)));
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
export function calcDamage({ atk, def, power, damageMult = 1.0, defMult = 1.0 }) {
    try {
        // FÓRMULA: ATK + POWER - DEF * defMult (GAME_RULES.md)
        // defMult > 1 aumenta relevância de DEF (ex.: 1.5 contra habilidades)
        const base = atk + power - Math.round(def * defMult);
        
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

/**
 * Resolve o resultado de um d20 aplicando as regras especiais de crítico e falha.
 *
 * - d20 = 1  → isFail=true  → sempre erra (falha crítica), independente de ATK/DEF
 * - d20 = 20 → isCrit=true  → sempre acerta (acerto crítico), independente de ATK/DEF
 * - d20 2-19 → resolve normalmente via checkHit()
 *
 * Esta é a função canônica para resolver contra-ataques inimigos.
 * Substitui `_resolveEnemyD20Hit` que estava inline no index.html.
 *
 * @param {number} roll            - Resultado do d20 (1-20)
 * @param {object} attacker        - Monstrinho atacante
 * @param {object} defender        - Monstrinho defensor
 * @param {object} classAdvantages - Tabela de vantagens de classe (opcional)
 * @returns {{ hit: boolean, isCrit: boolean, isFail: boolean }}
 */
export function resolveD20Hit(roll, attacker, defender, classAdvantages) {
    const isCrit = (roll === 20);
    const isFail = (roll === 1);
    const hit = isFail ? false : (isCrit ? true : checkHit(roll, attacker, defender, classAdvantages));
    return { hit, isCrit, isFail };
}

// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE CAPTURA SELVAGEM — Duas Trilhas
//
// Capture Score = f(HP, Agressividade) + bônus de orb
// Trilha Física          (HP):          hpScore   = (1 - hp/hpMax) * 50
// Trilha Comportamental  (Agressividade): aggrScore = (1 - aggression/100) * 50
// Ambas as trilhas têm peso máximo igual (50 pontos cada).
// Classes de suporte (Curandeiro, Bardo, Animalista) chegam ao score pela
// trilha comportamental sem depender de dano bruto.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ações de captura por classe.
 *
 * Design de duas trilhas:
 * - Trilha Física   (HP):         classes ofensivas são naturalmente mais eficientes
 * - Trilha Comportamental (Agressividade): classes de suporte são naturalmente mais eficientes
 *
 * aggDelta — redução de agressividade por ação (negativo = acalma o selvagem)
 */
export const CAPTURE_ACTIONS = {
    // Suporte — trilha comportamental forte
    Curandeiro: { id: 'calm',       name: 'Acalmar',       emoji: '🌿', aggDelta: -40 },
    Bardo:      { id: 'sing',       name: 'Melodia Suave', emoji: '🎵', aggDelta: -35 },
    Animalista: { id: 'bond',       name: 'Criar Vínculo', emoji: '🐾', aggDelta: -30 },
    // Híbrido — redução moderada de agressividade
    Ladino:     { id: 'distract',   name: 'Distrair',      emoji: '🌑', aggDelta: -25 },
    Mago:       { id: 'charm',      name: 'Enfeitiçar',    emoji: '🔮', aggDelta: -20 },
    // Ofensivo — conter fisicamente, reduz menos agressividade
    Guerreiro:  { id: 'contain',    name: 'Conter',        emoji: '⚔️', aggDelta: -20 },
    Caçador:    { id: 'trap',       name: 'Imobilizar',    emoji: '🏹', aggDelta: -20 },
    Bárbaro:    { id: 'intimidate', name: 'Intimidar',     emoji: '⚡', aggDelta: -15 },
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
    const hpMax      = Math.max(1, Number(monster?.hpMax ?? 1)); // clamp mínimo 1 (evita NaN por divisão por zero)
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
}
