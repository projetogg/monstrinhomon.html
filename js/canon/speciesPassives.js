/**
 * SPECIES PASSIVES — Fase 4 (4.0 + 4.1 + 4.2 + 4.3)
 *
 * Sistema de passivas canônicas de espécie.
 *
 * O que este módulo FAZ:
 *  - Define passivas simples, locais e testáveis por species_id canônico.
 *  - Expõe uma função pura: resolvePassiveModifier(instance, context) → modifier | null
 *  - Fallback seguro: instâncias sem canonSpeciesId ou sem passiva retornam null.
 *  - Fase 4.1: suporta passivas com estado de combate via contexto (isFirstHeal, isDebuff).
 *  - Fase 4.2: semântica de gatilho explícita (isOffensiveSkill, isFirstHitThisTurn).
 *    O estado em si (encounter.passiveState) é gerenciado pelo caller (wildActions.js).
 *  - Fase 4.3: contexto de on_skill_used enriquecido com skillType explícito.
 *    moonquill integrado ao lado wild (processEnemySkillAttack).
 *    floracura permanece assimétrica: wild não tem path de item de cura.
 *  - Fase 10: shadowsting (Ladino) — on_attack (basic only), hasShadowstingCharge.
 *    Bônus de execução após debuff aplicado; player-side apenas nesta fase.
 *    State: encounter.passiveState.shadowstingDebuffCharged (set em executeWildSkill).
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
 *  4. context: { event, hpPct?, isOffensiveSkill?, isFirstHitThisTurn?, isFirstHeal?, isDebuff? }
 *  5. Execute os testes: npx vitest run tests/speciesPassives.test.js
 *
 * ── EVENTOS SUPORTADOS ────────────────────────────────────────────────────────
 *
 *  'on_attack'       — instância está atacando
 *                      context.isOffensiveSkill: true = skill DAMAGE | false = ataque básico
 *                      context.isFirstAttackOfCombat: true = primeiro ataque do combate (Fase 9)
 *                      context.hasShadowstingCharge: true = debuff foi aplicado antes (Fase 10)
 *  'on_hit_received' — instância está recebendo um hit confirmado
 *                      context.isFirstHitThisTurn: true = primeiro hit da rodada (padrão)
 *  'on_heal_item'    — instância usou um item de cura (Fase 4.1)
 *                      context.isFirstHeal: true = primeira cura do combate
 *  'on_skill_used'   — instância usou qualquer habilidade (Fase 4.1)
 *                      context.skillType: 'DAMAGE'|'BUFF'|'HEAL'|... (Fase 4.3: explícito)
 *                      context.isDebuff: true = skill BUFF com target enemy e power < 0
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
 *  encounter.passiveState = {
 *      floracuraHealUsed: boolean,         // Fase 4.1: bônus da primeira cura consumido
 *      shieldhornBlockedThisTurn: boolean, // Fase 4.2: mitigação do turno já consumida
 *  }
 *  O caller inicializa lazily, passa flags como contexto para os handlers,
 *  e atualiza o estado após o modifier ser aplicado.
 *  shieldhornBlockedThisTurn é resetado no início de cada ciclo de ataque inimigo
 *  (em processEnemyCounterattack).
 *
 * ── SIMETRIA PLAYER / WILD (Fase 4.3) ────────────────────────────────────────
 *
 *  Passiva         | Player | Wild  | Motivo da assimetria (se houver)
 *  --------------- | ------ | ----- | -----------------------------------------
 *  shieldhorn      | ✅     | ✅    | Defensor recebe hit — ambos os lados suportam
 *  emberfang       | ✅     | ✅    | Atacante usa skill — ambos os lados suportam
 *  moonquill       | ✅     | ✅    | Wild usa skill debuff via processEnemySkillAttack
 *  floracura       | ✅     | ❌    | Wild não tem path de item de cura no pipeline atual
 *  swiftclaw       | ✅     | ❌    | Wild-side adiado (Fase 9); monstros selvagens
 *                  |        |       | raramente têm estado de "primeiro ataque" distinto
 *  shadowsting     | ✅     | ❌    | Wild-side adiado (Fase 10); estado de debuff carregado
 *                  |        |       | requer tracking de turno não disponível no wild pipeline
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Tabela de passivas — uma entrada por species_id canônico.
//
// Cada handler: (instance, context) → modifier | null
// Retornar null = passiva não dispara nesta situação.
//
// PASSIVAS IMPLEMENTADAS (Fase 4.0 → refinadas em 4.2):
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
     * Implementação Fase 4.2 (semântica canônica):
     *   Reduz dano recebido em 1 ponto APENAS no primeiro hit do turno.
     *   context.isFirstHitThisTurn (boolean, padrão: true se ausente) controla o gate.
     *   O caller (wildActions.js) rastreia passiveState.shieldhornBlockedThisTurn
     *   e reseta no início de cada ciclo de ataque inimigo (processEnemyCounterattack).
     */
    shieldhorn: (_instance, context) => {
        if (context.event !== 'on_hit_received') return null;
        // isFirstHitThisTurn: undefined é tratado como true (compatível com callers antigos)
        if (context.isFirstHitThisTurn === false) return null;
        return { damageReduction: 1 };
    },

    /**
     * emberfang (Bárbaro, arquétipo burst_agressivo)
     *
     * Passiva canônica: "Ao usar habilidade ofensiva, recebe +1 no confronto
     * se estiver com HP acima de 70%."
     *
     * Implementação Fase 4.2 (semântica canônica):
     *   Aplica +1 ATK APENAS quando context.isOffensiveSkill === true (skill de DAMAGE).
     *   NÃO dispara em ataque básico (isOffensiveSkill: false).
     *   O caller passa isOffensiveSkill explicitamente em todos os pontos de integração.
     */
    emberfang: (_instance, context) => {
        if (context.event !== 'on_attack') return null;
        // Apenas skill ofensiva (tipo DAMAGE) — não ataque básico
        if (!context.isOffensiveSkill) return null;
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
     * swiftclaw (Caçador, arquétipo striker_veloz)
     *
     * Passiva canônica: "No primeiro ataque do combate, recebe +1 bônus de ataque."
     *
     * Implementação Fase 9:
     *   No evento 'on_attack', retorna { atkBonus: 1 } apenas se o contexto
     *   indicar que é o primeiro ataque do combate (isFirstAttackOfCombat === true).
     *   O caller (wildActions.js) rastreia encounter.passiveState.swiftclawFirstStrikeDone
     *   e passa isFirstAttackOfCombat no contexto. Após o modifier ser aplicado,
     *   o caller marca swiftclawFirstStrikeDone = true para impedir novas ativações.
     *
     * Simetria: player-side apenas (Fase 9). Wild-side pode ser adicionado em fase futura
     *   caso seja necessário (sem impacto no design atual, pois monstros selvagens
     *   raramente mantêm estado de "primeiro ataque do combate" de forma distinta).
     */
    swiftclaw: (_instance, context) => {
        // _instance não é necessário: o bônus não depende de stats da instância,
        // apenas do estado de combate (isFirstAttackOfCombat) passado no contexto.
        if (context.event !== 'on_attack') return null;
        if (!context.isFirstAttackOfCombat) return null;
        return { atkBonus: 1 };
    },

    /**
     * moonquill (Mago, arquétipo controle_leve)
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
    /**
     * shadowsting (Ladino, arquétipo oportunista_furtivo) — Fase 10
     *
     * Passiva canônica: "Após aplicar debuff ao inimigo, o próximo ataque
     * básico recebe +1 bônus de ataque."
     *
     * Diferenciação de swiftclaw:
     *   swiftclaw: bônus one-time no PRIMEIRO ataque do combate (abertura direta).
     *   shadowsting: bônus CONDICIONAL no ataque básico seguinte ao debuff aplicado.
     *     Requer setup (usar skill debuff) — cria loop tático: debuff → execução.
     *     Recarregável: pode ativar múltiplas vezes por combate (uma vez por debuff).
     *     NÃO dispara em skill ofensiva — apenas em ataque básico (execução).
     *
     * Implementação Fase 10:
     *   No evento 'on_attack' com isOffensiveSkill === false (ataque básico),
     *   retorna { atkBonus: 1 } apenas se context.hasShadowstingCharge === true.
     *   O caller (wildActions.js) rastreia encounter.passiveState.shadowstingDebuffCharged:
     *     - SET em executeWildSkill quando isDebuff === true e a skill é do player shadowsting.
     *     - CONSUMIDO (reset para false) após o atkBonus ser aplicado no ataque básico.
     *   Nota: isOffensiveSkill: false é o sinal de ataque básico — garante que o bônus
     *   é de "execução" e não amplifica ainda mais uma skill ofensiva do shadowsting.
     *
     * Simetria: player-side apenas (Fase 10). Wild-side não implementado: o pipeline
     *   wild não rastreia "qual skill foi usada no turno anterior" de forma distinta.
     */
    shadowsting: (_instance, context) => {
        if (context.event !== 'on_attack') return null;
        // Apenas ataque básico (não skill) — identidade de "execução após setup"
        if (context.isOffensiveSkill) return null;
        if (!context.hasShadowstingCharge) return null;
        return { atkBonus: 1 };
    },
};

/**
 * Resolve o modificador de passiva para uma instância numa situação específica.
 *
 * Fallback seguro: retorna null se:
 *  - a instância não tem canonSpeciesId;
 *  - não há passiva implementada para esse species_id;
 *  - o handler lança uma exceção.
 *
 * @param {{ canonSpeciesId?: string }} instance - Instância com metadado canônico.
 * @param {{
 *   event: string,
 *   hpPct?: number,
 *   isOffensiveSkill?: boolean,      // Fase 4.2: true = DAMAGE skill, false = basic attack
 *   isFirstHitThisTurn?: boolean,    // Fase 4.2: undefined/true = primeiro hit do turno
 *   isFirstHeal?: boolean,           // Fase 4.1: true = primeira cura do combate
 *   skillType?: string,              // Fase 4.3: tipo da skill ('DAMAGE'|'BUFF'|'HEAL'|...)
 *   isDebuff?: boolean,              // Fase 4.1: true = skill debuff (BUFF+enemy+power<0)
 *   isFirstAttackOfCombat?: boolean, // Fase 9: true = primeiro ataque do combate (swiftclaw)
 *   hasShadowstingCharge?: boolean,  // Fase 10: true = debuff aplicado, bônus disponível (shadowsting)
 * }} context
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
