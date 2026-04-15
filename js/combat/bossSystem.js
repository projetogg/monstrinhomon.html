/**
 * BOSS SYSTEM — PR-05 (Fase 1, parte C)
 *
 * Implementa:
 *   - applyBossMultipliers: HP×2.5, ATK×1.5, DEF×1.5
 *   - checkBossPhaseTransition: HP ≤ 50% → ATK +20% (uma vez por batalha)
 *   - applyStatusToBoss: imunidade a STUN e ROOT
 *
 * ZERO side effects além do objeto passado como parâmetro.
 * Compatível com o sistema de injeção de dependência dos combatActions.
 */

// ── Multiplicadores de Boss ──────────────────────────────────────────────────

/** @type {{ hp: number, atk: number, def: number }} */
export const BOSS_MULTIPLIERS = {
    hp:  2.5,
    atk: 1.5,
    def: 1.5,
};

// Status imunes para bosses (não podem ser aplicados)
export const BOSS_IMMUNE_STATUS = ['stun', 'root', 'paralysis'];

// Fator de ATK adicional na transição para Fase 2
export const BOSS_PHASE2_ATK_MULT = 1.20;

/**
 * Aplica multiplicadores canônicos de boss em um inimigo recém-criado.
 *
 * Modifica o objeto `enemy` diretamente (inline mutation intencional para
 * manter compatibilidade com o pipeline de criação de encounter).
 *
 * Fórmulas:
 *   hpMax = round(hpMax * 2.5), hp = hpMax (HP cheio ao início)
 *   atk   = round(atk   * 1.5)
 *   def   = round(def   * 1.5)
 *
 * Também define:
 *   enemy.isBoss = true
 *   enemy.noFlee = true  (jogadores não podem fugir — verificado em executeGroupFlee)
 *   enemy._phase = 1     (fase atual, inicia em 1)
 *   enemy._phase2Done = false (flag de transição única)
 *
 * @param {object} enemy - Objeto de instância de inimigo (atk, def, hp, hpMax)
 * @returns {object} O mesmo objeto mutado (para encadeamento)
 */
export function applyBossMultipliers(enemy) {
    if (!enemy) return enemy;

    enemy.hpMax = Math.round((Number(enemy.hpMax) || 0) * BOSS_MULTIPLIERS.hp);
    enemy.hp    = enemy.hpMax; // começa com HP cheio

    enemy.atk   = Math.round((Number(enemy.atk)   || 0) * BOSS_MULTIPLIERS.atk);
    enemy.def   = Math.round((Number(enemy.def)   || 0) * BOSS_MULTIPLIERS.def);

    enemy.isBoss      = true;
    enemy.noFlee      = true;
    enemy._phase      = 1;
    enemy._phase2Done = false;

    return enemy;
}

/**
 * Verifica e aplica a transição para Fase 2 do boss.
 *
 * Critério: HP atual ≤ 50% do hpMax.
 * Efeito (uma única vez por batalha, controlado por `_phase2Done`):
 *   - ATK do boss × 1.20 (+20%)
 *   - `_phase` muda para 2
 *   - `_phase2Done = true` (para não ser aplicado novamente)
 *
 * @param {object} boss    - Objeto de inimigo com { hp, hpMax, atk, _phase, _phase2Done }
 * @param {Array}  [log]   - Array de log para inserir mensagem (opcional)
 * @returns {{ transitioned: boolean, atkDelta: number }}
 */
export function checkBossPhaseTransition(boss, log = null) {
    if (!boss || !boss.isBoss) return { transitioned: false, atkDelta: 0 };
    if (boss._phase2Done) return { transitioned: false, atkDelta: 0 };

    const hpPct = boss.hpMax > 0 ? boss.hp / boss.hpMax : 1;
    if (hpPct > 0.5) return { transitioned: false, atkDelta: 0 };

    // Transição para Fase 2
    const prevAtk = Number(boss.atk) || 0;
    boss.atk = Math.round(prevAtk * BOSS_PHASE2_ATK_MULT);
    boss._phase = 2;
    boss._phase2Done = true;

    const atkDelta = boss.atk - prevAtk;

    if (Array.isArray(log)) {
        log.push(`⚡ FASE 2! ${boss.name || 'Boss'} fica furioso! ATK +${atkDelta} (+20%)!`);
    }

    return { transitioned: true, atkDelta };
}

/**
 * Verifica se um boss é imune a um status.
 *
 * Bosses são imunes a: stun, root, paralysis (BOSS_IMMUNE_STATUS).
 *
 * @param {object} target     - Alvo do status (verificado se isBoss=true)
 * @param {string} statusName - Nome do status a aplicar (ex: 'stun', 'root')
 * @returns {boolean} true se o boss é imune (status deve ser bloqueado)
 */
export function isBossImmuneToStatus(target, statusName) {
    if (!target?.isBoss) return false;
    return BOSS_IMMUNE_STATUS.includes(String(statusName).toLowerCase());
}

/**
 * FASE VII-E — Ataque em área do Boss (atinge todos na linha da frente).
 *
 * Critério de alvo: alvos com position === 'front' (ou posição padrão se sem posições).
 * Dano = max(1, boss.atk - target.def + 3) por alvo.
 *
 * @param {object} boss    - Objeto boss (precisa de atk, name)
 * @param {Array}  targets - Array de { playerId, monster, position }
 * @param {object} deps    - { helpers }
 * @param {object} enc     - Encounter (para log e posições)
 * @returns {{ hitTargets: string[], totalDamage: number }}
 */
export function bossAoeAttack(boss, targets, deps, enc) {
    const { helpers } = deps;
    const bossName = boss.name || 'Boss';
    const bossAtk = Number(boss.atk) || 1;

    // Alvos na linha da frente (ou todos se sem posições)
    const frontTargets = targets.filter(t => {
        const pos = enc?.positions?.[t.playerId] || 'front';
        return pos === 'front';
    });
    const aoeTargets = frontTargets.length > 0 ? frontTargets : targets;

    const hitTargets = [];
    let totalDamage = 0;

    for (const t of aoeTargets) {
        const mon = t.monster;
        if (!mon || (Number(mon.hp) || 0) <= 0) continue;

        const monDef = Number(mon.def) || 0;
        const dmg = Math.max(1, bossAtk - monDef + 3);
        mon.hp = Math.max(0, (Number(mon.hp) || 0) - dmg);
        totalDamage += dmg;
        hitTargets.push(t.playerId);

        const monName = mon.nickname || mon.name || mon.nome || 'Monstrinho';
        if (helpers?.log) {
            helpers.log(enc, `💥 ${bossName} (AoE Fase 2) acertou ${monName} por ${dmg} de dano!`);
        }
    }

    return { hitTargets, totalDamage };
}

/**
 * FASE VII-E — Boss Curandeiro Fase 2: 40% de chance de curar aliado com HP < 40%.
 *
 * @param {object} boss    - Objeto boss
 * @param {Array}  allies  - Array de inimigos aliados do boss (exc. o próprio boss)
 * @param {object} deps    - { helpers }
 * @param {object} enc     - Encounter (para log)
 * @returns {{ healed: boolean, allyName?: string, healAmt?: number }}
 */
export function bossPhase2HealAlly(boss, allies, deps, enc) {
    const { helpers } = deps;
    const bossName = boss.name || 'Boss';

    const weakAlly = (allies || []).find(e =>
        e && (Number(e.hp) || 0) > 0 &&
        (Number(e.hp) || 0) / Math.max(1, Number(e.hpMax) || 1) < 0.40
    );

    if (!weakAlly) return { healed: false };
    if (Math.random() >= 0.40) return { healed: false };

    const allyHpMax = Number(weakAlly.hpMax) || 1;
    const healAmt = Math.round(allyHpMax * 0.30);
    weakAlly.hp = Math.min(allyHpMax, (Number(weakAlly.hp) || 0) + healAmt);

    const allyName = weakAlly.name || weakAlly.nome || 'Aliado';
    if (helpers?.log) {
        helpers.log(enc, `💚 ${bossName} (Boss Fase 2) curou ${allyName} em ${healAmt} HP!`);
    }

    return { healed: true, allyName, healAmt };
}
