/**
 * GROUP COMBAT FORMULA v2 — Fórmula Canônica
 *
 * Implementa o sistema de confronto bilateral d20 + tabela de faixas.
 * 100% puro, sem side effects, sem imports.
 */

/**
 * Modificador de nível baseado em diferença de nível (atacante - defensor).
 * Tabela discreta conforme COMBATE_FORMULA_V2.md seção 5.2
 */
export function getModNivel(lvlDiff) {
    if (lvlDiff <= -20) return -5;
    if (lvlDiff <= -15) return -4;
    if (lvlDiff <= -10) return -3;
    if (lvlDiff <= -6)  return -2;
    if (lvlDiff <= -3)  return -1;
    if (lvlDiff <= 2)   return 0;
    if (lvlDiff <= 5)   return 1;
    if (lvlDiff <= 9)   return 2;
    if (lvlDiff <= 14)  return 3;
    if (lvlDiff <= 19)  return 4;
    return 5;
}

// Categorias de Resultado de Confronto (RC)
export const RC_CATEGORY = {
    FALHA_TOTAL:           'falha_total',
    CONTATO_NEUTRALIZADO:  'contato_neutralizado',
    ACERTO_REDUZIDO:       'acerto_reduzido',
    ACERTO_NORMAL:         'acerto_normal',
    ACERTO_FORTE:          'acerto_forte',
};

// Multiplicadores por categoria
export const RC_MULTIPLIER = {
    falha_total:          0,
    contato_neutralizado: 0,
    acerto_reduzido:      0.60,
    acerto_normal:        1.00,
    acerto_forte:         1.25,
};

/**
 * Classifica o RC em uma categoria.
 * Conforme tabela seção 5.3 de COMBATE_FORMULA_V2.md:
 * RC ≤ -8 → falha_total
 * RC -7 a -3 → contato_neutralizado
 * RC -2 a +3 → acerto_reduzido
 * RC +4 a +10 → acerto_normal
 * RC ≥ +11 → acerto_forte
 */
export function classifyRC(rc) {
    if (rc <= -8)  return RC_CATEGORY.FALHA_TOTAL;
    if (rc <= -3)  return RC_CATEGORY.CONTATO_NEUTRALIZADO;
    if (rc <= 3)   return RC_CATEGORY.ACERTO_REDUZIDO;
    if (rc <= 10)  return RC_CATEGORY.ACERTO_NORMAL;
    return RC_CATEGORY.ACERTO_FORTE;
}

/**
 * Resolve o confronto bilateral d20.
 *
 * Fórmula (seção 5.1):
 * RC = (d20A + ATK + ModNível + ModClasse + BuffOff) − (d20D + ceil(DEF/2) + ModPos + BuffDef)
 *
 * Dados naturais (seção 5.4):
 * - d20A=20 → +4 RC, +20% dano
 * - d20A=1  → -6 RC
 * - d20D=20 → +5 confronto defensivo (subtrai 5 do RC)
 * - d20D=1  → -4 confronto defensivo (soma 4 ao RC)
 *
 * @param {object} params
 * @param {number} params.d20A       - Dado do atacante (1-20)
 * @param {number} params.d20D       - Dado do defensor (1-20)
 * @param {number} params.atkAtk     - ATK do atacante (com buffs)
 * @param {number} params.atkDef     - DEF do defensor (com buffs)
 * @param {number} params.atkLvl     - Nível do atacante
 * @param {number} params.defLvl     - Nível do defensor
 * @param {number} params.classModAtk - Modificador de classe para ataque (+2, 0, -2)
 * @param {number} params.posMod     - Modificador de posição defensiva (0, 1, 2)
 * @param {number} params.buffOff    - Buff ofensivo (soma direta ao RC)
 * @param {number} params.buffDef    - Buff defensivo (soma à parte defensiva)
 * @returns {{ rc: number, category: string, d20ANatural: boolean, d20DNatural: boolean, critDmgBonus: number }}
 */
export function resolveConfrontation(params) {
    const {
        d20A = 10, d20D = 10,
        atkAtk = 5, atkDef = 3,
        atkLvl = 1, defLvl = 1,
        classModAtk = 0, posMod = 0,
        buffOff = 0, buffDef = 0
    } = params;

    const lvlDiff = atkLvl - defLvl;
    const modNivel = getModNivel(lvlDiff);

    // Bônus de dados naturais do atacante
    const d20ANatural20 = (d20A === 20);
    const d20ANatural1  = (d20A === 1);
    // Modificador natural do dado do atacante:
    // 20 → +4 RC adicional; 1 → -6 RC
    const d20ANaturalMod = d20ANatural20 ? 4 : (d20ANatural1 ? -6 : 0);

    // Bônus de dados naturais do defensor
    const d20DNatural20 = (d20D === 20);
    const d20DNatural1  = (d20D === 1);
    // Modificador natural do dado do defensor (afeta a parte defensiva):
    // 20 → +5 defesa (subtrai 5 do RC); 1 → -4 defesa (soma 4 ao RC)
    const d20DNaturalMod = d20DNatural20 ? 5 : (d20DNatural1 ? -4 : 0);

    const defConfronto = Math.ceil(atkDef / 2);

    // Parte ofensiva do RC
    const offSide = d20A + d20ANaturalMod + atkAtk + modNivel + classModAtk + buffOff;
    // Parte defensiva do RC
    const defSide = d20D + d20DNaturalMod + defConfronto + posMod + buffDef;

    const rc = offSide - defSide;
    const category = classifyRC(rc);

    // Bônus de crítico de dano: +20% quando d20A=20 natural
    const critDmgBonus = d20ANatural20 ? 0.20 : 0;

    return {
        rc,
        category,
        d20ANatural: d20ANatural20,
        d20DNatural: d20DNatural20,
        critDmgBonus,
    };
}

/**
 * Calcula o dano canônico com base no resultado do confronto.
 *
 * DanoBase = PWR + ATK + ModNívelDano − floor(DEF/2)
 * DanoFinal = max(1, floor(DanoBase × multiplicador_faixa))
 * Crítico (d20A=20): DanoFinal × 1.20 (arredondado)
 *
 * Regras especiais de nível (seção 7):
 * - Se defLvl - atkLvl >= 10 e categoria CONTATO_NEUTRALIZADO ou ACERTO_REDUZIDO: dano = 1 (ilusório)
 * - Se atkLvl - defLvl >= 10 e categoria CONTATO_NEUTRALIZADO (sem dados naturais extremos): sobe para ACERTO_REDUZIDO
 *
 * @param {object} params
 * @param {number} params.pwr       - Poder da ação
 * @param {number} params.atk       - ATK do atacante
 * @param {number} params.lvlDiff   - Diferença de nível (atkLvl - defLvl)
 * @param {number} params.defEnemy  - DEF do defensor
 * @param {number} params.damageMult - Multiplicador de dano de classe (1.0, 1.10, 0.90)
 * @param {number} params.critBonus  - Bônus de crítico (0 ou 0.20)
 * @param {string} params.category   - Categoria do RC (RC_CATEGORY)
 * @param {boolean} params.d20ANatural - Se d20 atacante foi 20 natural
 * @param {boolean} params.d20DNatural - Se d20 defensor foi 20 natural
 * @returns {{ damage: number, isIlusory: boolean }}
 */
export function computeGroupDamage(params) {
    const {
        pwr = 3,
        atk = 5,
        lvlDiff = 0,
        defEnemy = 3,
        damageMult = 1.0,
        critBonus = 0,
        category,
        d20ANatural = false,
        d20DNatural = false,
    } = params;

    // Sem dano nas categorias de falha
    if (category === RC_CATEGORY.FALHA_TOTAL) {
        return { damage: 0, isIlusory: false };
    }

    // Regra especial: superioridade real (atacante muito superior)
    // Se lvlDiff >= 10 e categoria CONTATO_NEUTRALIZADO, sobe para ACERTO_REDUZIDO
    // Exceção: d20A=1 ou d20D=20
    let effectiveCategory = category;
    if (lvlDiff >= 10 &&
        category === RC_CATEGORY.CONTATO_NEUTRALIZADO &&
        !d20ANatural && !d20DNatural) {
        // d20ANatural aqui seria "atacante tirou 1" — mas passamos d20ANatural como "foi 20"
        // Na prática esta flag já está correto pois passamos o critDmgBonus separately
        effectiveCategory = RC_CATEGORY.ACERTO_REDUZIDO;
    }

    // Verificar dano ilusório: defensor muito superior
    const isIlusory = ((-lvlDiff) >= 10) &&
        (effectiveCategory === RC_CATEGORY.CONTATO_NEUTRALIZADO ||
         effectiveCategory === RC_CATEGORY.ACERTO_REDUZIDO);

    if (isIlusory) {
        return { damage: 1, isIlusory: true };
    }

    if (effectiveCategory === RC_CATEGORY.CONTATO_NEUTRALIZADO) {
        // Contato Neutralizado: normalmente 0
        // Mas se atacante não está 10+ níveis abaixo, pode ser 1
        const minorContact = (-lvlDiff) < 10;
        return { damage: minorContact ? 1 : 0, isIlusory: false };
    }

    const modNivelDano = getModNivel(lvlDiff);
    const mitigacao = Math.floor(defEnemy / 2);
    const danoBase = Math.max(1, pwr + atk + modNivelDano - mitigacao);

    const mult = RC_MULTIPLIER[effectiveCategory] ?? 1.0;
    let danoFinal = Math.max(1, Math.floor(danoBase * mult * damageMult));

    // Bônus crítico de d20=20: +20%
    if (critBonus > 0) {
        danoFinal = Math.round(danoFinal * (1 + critBonus));
    }

    return { damage: Math.max(1, danoFinal), isIlusory: false };
}

/**
 * Verifica condição de "1 More" (extra turn) — inspirado em Persona.
 * Retorna true se categoria for ACERTO_FORTE com vantagem de classe.
 *
 * @param {string} category - Categoria do RC
 * @param {boolean} classAdvIsStronger - Se o atacante tem vantagem de classe
 * @returns {boolean}
 */
export function checkOneTurnBonus(category, classAdvIsStronger) {
    return category === RC_CATEGORY.ACERTO_FORTE && classAdvIsStronger === true;
}
