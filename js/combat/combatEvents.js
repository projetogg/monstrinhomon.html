/**
 * COMBAT EVENTS — PR-02
 *
 * Contratos internos do sistema de combate.
 *
 * Este módulo define:
 *   1. Nomes canônicos de eventos de combate (COMBAT_EVENTS)
 *   2. Contratos de payload de cada evento (JSDoc)
 *   3. Função de despacho central: fireCombatEvent(instance, event, payload)
 *
 * Propósito: substituir chamadas espalhadas a resolvePassiveModifier por um
 * ponto único de despacho com contratos verificáveis, facilitando:
 *   - Passivas de espécie em solo E grupo (Fase 0B do Patch v2.2)
 *   - Adição de novos eventos (on_turn_start, on_ko, on_swap) sem modificar
 *     cada arquivo de ação separadamente
 *   - Testes unitários dos contratos de evento
 *
 * Hierarquia de autoridade: Patch Canônico v2.2 > este módulo > wildActions / groupActions
 */

import { resolvePassiveModifier } from '../canon/speciesPassives.js';

// ── Nomes canônicos de eventos ───────────────────────────────────────────────

/**
 * Evento: início do turno do ator.
 * Payload: { hpPct: number }
 * Momento: imediatamente antes da ação do ator (após ENE regen e atualização de buffs).
 */
export const ON_TURN_START = 'on_turn_start';

/**
 * Evento: instância está executando um ataque (básico ou skill).
 * Payload: {
 *   hpPct: number,
 *   isOffensiveSkill: boolean,       // false = ataque básico
 *   isFirstAttackOfCombat?: boolean, // swiftclaw
 *   hasShadowstingCharge?: boolean,  // shadowsting
 *   hasBellwaveRhythmCharge?: boolean, // bellwave
 * }
 */
export const ON_ATTACK = 'on_attack';

/**
 * Evento: instância recebeu um hit confirmado.
 * Alias de 'on_hit_received' em speciesPassives (mantém compatibilidade).
 * Payload: {
 *   hpPct: number,
 *   isFirstHitThisTurn?: boolean,
 *     // ATENÇÃO: se ausente/undefined, handlers canônicos tratam como `true`
 *     // (retrocompatibilidade com callers que não rastreiam por turno).
 *     // Passe explicitamente `false` para indicar que o hit não é o primeiro do turno.
 * }
 */
export const ON_HIT = 'on_hit_received';

/**
 * Evento: instância chegou a HP = 0 (KO confirmado).
 * Payload: { hpPct: 0, killer?: object }
 * Nota: nenhuma passiva usa este evento ainda; contrato reservado para Fase 1+.
 */
export const ON_KO = 'on_ko';

/**
 * Evento: instância entrou em campo como substituta.
 * Payload: { context?: string }   // 'ko' | 'manual'
 * Nota: nenhuma passiva usa este evento ainda; contrato reservado para Fase 1+.
 */
export const ON_SWAP = 'on_swap';

/**
 * Evento: instância usou um item de cura.
 * Payload: { hpPct: number, isFirstHeal?: boolean }
 */
export const ON_HEAL_ITEM = 'on_heal_item';

/**
 * Evento: instância usou uma skill (qualquer tipo).
 * Payload: { event: 'on_skill_used', skillType?: string, isDebuff?: boolean }
 */
export const ON_SKILL_USED = 'on_skill_used';

// ── Dispatcher central ───────────────────────────────────────────────────────

/**
 * Despacha um evento de combate para a passiva de espécie da instância.
 *
 * Esta é a única função que deve ser chamada para disparar passivas de espécie.
 * Tanto wildActions.js quanto groupActions.js devem usar esta função em vez de
 * chamar resolvePassiveModifier diretamente.
 *
 * @param {object} instance  - Instância do monstrinho (precisa de canonSpeciesId)
 * @param {string} event     - Nome do evento (use as constantes deste módulo)
 * @param {object} [payload] - Payload do evento (varia por evento — ver JSDoc acima)
 * @returns {{ atkBonus?: number, damageReduction?: number, healBonus?: number,
 *             spdBuff?: object }|null}
 *   Modificador retornado pela passiva, ou null se nenhuma passiva disparou.
 */
export function fireCombatEvent(instance, event, payload = {}) {
    return resolvePassiveModifier(instance, { event, ...payload }) ?? null;
}
