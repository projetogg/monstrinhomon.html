/**
 * SPECIES PASSIVES — Fase 4 (4.0 + 4.1)
 *
 * Sistema de passivas canônicas de espécie.
 *
 * O que este módulo FAZ:
 *  - Define passivas simples, locais e testáveis por species_id canônico.
 *  - Expõe uma função pura: resolvePassiveModifier(instance, context) → modifier | null
 *  - Fallback seguro: instâncias sem canonSpeciesId ou sem passiva retornam null.
 *  - Fase 4.1: suporta passivas com estado de combate via contexto (isFirstHeal, isDebuff).
 *    O estado em si (encounter.passiveState) é gerenciado pelo caller (wildActions.js).
 *
 * O que este módulo NÃO faz (reservado para fases futuras):
 *  - Passivas em cadeia ou com múltiplos triggers por turno
 *  - Passivas de equipe (efeito de grupo)
 *  - Kit swap (substituição de habilidades)
 *  - Gerenciamento de estado de combate (responsabilidade do caller)
 *
 * ── ADICIONAR NOVA PASSIVA ────────────────────────────────────────────────────
 *
 *  1. Adicione uma entrada em PASSIVE_HANDLERS com o species_id como chave.
 *  2. O handler recebe (instance, context) e retorna um modifier ou null.
 *  3. modifier: { atkBonus?, damageReduction?, healBonus?, spdBuff? }
 *  4. context: { event, hpPct?, isFirstHeal?, isDebuff? }
 *  5. Execute os testes: npx vitest run tests/speciesPassives.test.js
 *
 * ── EVENTOS SUPORTADOS ────────────────────────────────────────────────────────
 *
 *  'on_attack'       — instância está atacando (jogador ou selvagem)
 *  'on_hit_received' — instância está recebendo um hit confirmado
 *  'on_heal_item'    — instância usou um item de cura (Fase 4.1)
 *  'on_skill_used'   — instância usou uma habilidade (Fase 4.1)
 *
 * ── MODIFICADORES SUPORTADOS ─────────────────────────────────────────────────
 *
 *  atkBonus         — bônus aditivo ao ATK efetivo (antes do calcDamage)
 *  damageReduction  — redução aditiva ao dano final (antes do applyDamageToHP)
 *  healBonus        — bônus flat de HP adicionado à cura (Fase 4.1)
 *  spdBuff          — buff temporário de SPD: { power: number, duration: number } (Fase 4.1)
 *
 * ── ESTADO DE COMBATE (encounter.passiveState) ───────────────────────────────
 *
 *  Gerenciado PELO CALLER (wildActions.js), não por este módulo.
 *  Estrutura mínima para Fase 4.1:
 *    { floracuraHealUsed: boolean }
 *  O caller inicializa lazily, passa flags como contexto para os handlers,
 *  e atualiza o estado após o modifier ser aplicado.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Tabela de passivas — uma entrada por species_id canônico.
//
// Cada handler: (instance, context) → modifier | null
// Retornar null = passiva não dispara nesta situação.
//
// PASSIVAS IMPLEMENTADAS (Fase 4.0):
//   shieldhorn — Guerreiro / tank_puro
//   emberfang  — Bárbaro  / burst_agressivo
//
// PASSIVAS IMPLEMENTADAS (Fase 4.1):
//   floracura  — Curandeiro / cura_estavel
//   moonquill  — Mago      / controle_leve
// ---------------------------------------------------------------------------
const PASSIVE_HANDLERS = {
    /**
     * shieldhorn (Guerreiro, arquétipo tank_puro)
     *
     * Passiva canônica: "Quando está na frente, recebe +1 de mitigação
     * no primeiro ataque sofrido por turno."
     *
     * Implementação Fase 4.0 (simplificada):
     *   Reduz todo dano recebido em 1 ponto (mínimo de dano final = 1).
     *   A versão completa "apenas primeiro ataque por turno" requer tracking
     *   de turno que ainda não existe no pipeline wild — diferido para Fase 4.2.
     */
    shieldhorn: (_instance, context) => {
        if (context.event !== 'on_hit_received') return null;
        return { damageReduction: 1 };
    },

    /**
     * emberfang (Bárbaro, arquétipo burst_agressivo)
     *
     * Passiva canônica: "Ao usar habilidade ofensiva, recebe +1 no confronto
     * se estiver com HP acima de 70%."
     *
     * Implementação Fase 4.0 (simplificada):
     *   Aplica +1 ATK em qualquer ataque (básico ou habilidade) quando HP > 70%.
     *   A restrição "apenas habilidade ofensiva" requer tracking do tipo de ação
     *   que ainda não é propagado ao módulo de passivas — diferido para Fase 4.2.
     */
    emberfang: (_instance, context) => {
        if (context.event !== 'on_attack') return null;
        if ((context.hpPct ?? 0) > 0.70) {
            return { atkBonus: 1 };
        }
        return null;
    },

    /**
     * floracura (Curandeiro, arquétipo cura_estavel)
     *
     * Passiva canônica: "A primeira cura alvo único de cada combate recebe
     * pequeno bônus."
     *
     * Implementação Fase 4.1:
     *   No evento 'on_heal_item', retorna { healBonus: 3 } apenas se o contexto
     *   indicar que é a primeira cura do combate (isFirstHeal === true).
     *   O caller (wildActions.js) é responsável por rastrear encounter.passiveState
     *   e passar isFirstHeal no contexto. Após o modifier ser aplicado, o caller
     *   marca passiveState.floracuraHealUsed = true para impedir novas ativações.
     */
    floracura: (_instance, context) => {
        if (context.event !== 'on_heal_item') return null;
        if (!context.isFirstHeal) return null;
        return { healBonus: 3 };
    },

    /**
     * moonquill (Mago, arquétipo controle_leve)
     *
     * Passiva canônica: "Se aplicar debuff, ganha +1 AGI até o próximo turno."
     *
     * Implementação Fase 4.1:
     *   No evento 'on_skill_used', retorna { spdBuff: { power: 1, duration: 1 } }
     *   se o contexto indicar que a habilidade usada é um debuff (isDebuff === true).
     *   O caller determina se a skill é debuff: type === 'BUFF' + target === 'enemy' + power < 0.
     *   O buff é adicionado ao array buffs do monstro pelo caller usando o sistema
     *   de buffs existente (updateBuffs remove após 1 turno).
     *   AGI não existe como stat separado no runtime — mapeado para SPD/spd.
     */
    moonquill: (_instance, context) => {
        if (context.event !== 'on_skill_used') return null;
        if (!context.isDebuff) return null;
        return { spdBuff: { power: 1, duration: 1 } };
    },
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Resolve o modificador de passiva para uma instância numa situação específica.
 *
 * Fallback seguro: retorna null se:
 *  - a instância não tem canonSpeciesId;
 *  - não há passiva implementada para esse species_id;
 *  - o handler lança uma exceção.
 *
 * @param {{ canonSpeciesId?: string }} instance - Instância com metadado canônico.
 * @param {{ event: string, hpPct?: number, isFirstHeal?: boolean, isDebuff?: boolean }} context
 * @returns {{ atkBonus?: number, damageReduction?: number, healBonus?: number, spdBuff?: { power: number, duration: number } }|null}
 */
export function resolvePassiveModifier(instance, context) {
    if (!instance?.canonSpeciesId) return null;
    const handler = PASSIVE_HANDLERS[instance.canonSpeciesId];
    if (!handler) return null;
    try {
        return handler(instance, context) ?? null;
    } catch (err) {
        console.warn('[speciesPassives] passive handler falhou; usando fallback.', err);
        return null;
    }
}

/**
 * Retorna os species_ids que têm passiva implementada nesta fase.
 * Útil para auditoria e relatórios de cobertura.
 *
 * @returns {string[]}
 */
export function getActivePassiveIds() {
    return Object.keys(PASSIVE_HANDLERS);
}

/**
 * Verifica se um species_id tem passiva implementada.
 *
 * @param {string|null} speciesId
 * @returns {boolean}
 */
export function hasPassive(speciesId) {
    return speciesId != null &&
        Object.prototype.hasOwnProperty.call(PASSIVE_HANDLERS, speciesId);
}
