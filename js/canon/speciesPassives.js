/**
 * SPECIES PASSIVES — Fase 4 inicial
 *
 * Sistema de passivas canônicas de espécie.
 *
 * O que este módulo FAZ:
 *  - Define passivas simples, locais e testáveis por species_id canônico.
 *  - Expõe uma função pura: resolvePassiveModifier(instance, context) → modifier | null
 *  - Fallback seguro: instâncias sem canonSpeciesId ou sem passiva retornam null.
 *
 * O que este módulo NÃO faz (reservado para fases futuras):
 *  - Passivas em cadeia ou com múltiplos triggers por turno
 *  - Passivas de equipe (efeito de grupo)
 *  - Kit swap (substituição de habilidades)
 *  - Tracking automático de estado de combate
 *
 * ── ADICIONAR NOVA PASSIVA ────────────────────────────────────────────────────
 *
 *  1. Adicione uma entrada em PASSIVE_HANDLERS com o species_id como chave.
 *  2. O handler recebe (instance, context) e retorna um modifier ou null.
 *  3. modifier: { atkBonus?: number, damageReduction?: number }
 *  4. context: { event: string, hpPct: number }
 *  5. Execute os testes: npx vitest run tests/speciesPassives.test.js
 *
 * ── EVENTOS SUPORTADOS ────────────────────────────────────────────────────────
 *
 *  'on_attack'       — instância está atacando (jogador ou selvagem)
 *  'on_hit_received' — instância está recebendo um hit confirmado
 *
 * ── MODIFICADORES SUPORTADOS ─────────────────────────────────────────────────
 *
 *  atkBonus         — bônus aditivo ao ATK efetivo (antes do calcDamage)
 *  damageReduction  — redução aditiva ao dano final (antes do applyDamageToHP)
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
// PASSIVAS DIFERIDAS:
//   moonquill  — requer tracking de debuff aplicado → Fase 4.1
//   floracura  — requer tracking de "primeira cura do combate" no pipeline
//                de skill/item de cura → Fase 4.1
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
     *   de turno que ainda não existe no pipeline wild — diferido para Fase 4.1.
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
     *   que ainda não é propagado ao módulo de passivas — diferido para Fase 4.1.
     */
    emberfang: (_instance, context) => {
        if (context.event !== 'on_attack') return null;
        if ((context.hpPct ?? 0) > 0.70) {
            return { atkBonus: 1 };
        }
        return null;
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
 * @param {{ event: string, hpPct?: number }} context - Contexto da situação.
 * @returns {{ atkBonus?: number, damageReduction?: number }|null}
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
