/**
 * KIT SWAP — Fase 6 de integração canônica
 * Normalizado em Fase 6.1 após auditoria de impacto.
 *
 * Primeira camada funcional de kit_swap canônico.
 * Permite que a espécie influencie a composição do kit de habilidades
 * de forma controlada, auditável e reversível.
 *
 * O que este módulo FAZ:
 *  - Define `KIT_SWAP_TABLE`: mapeamento espécie → definição de swap por slot.
 *  - Expõe `applyKitSwaps(instance, skills)`: função pura que aplica swaps
 *    no array de skills e retorna metadados de observabilidade.
 *  - Expõe `hasKitSwap(speciesId)`: verificação rápida de espécie com swap.
 *  - Expõe `getActiveKitSwapIds()`: lista de espécies com swap implementado.
 *  - Fallback total: sem canonSpeciesId, sem bridge, slot bloqueado ou swap
 *    inválido → kit legado retornado sem modificação.
 *
 * O que este módulo NÃO faz (reservado para fases futuras):
 *  - Migração completa do runtime para skills canônicas.
 *  - Reescrita de getMonsterSkills().
 *  - Evolução automática de skills.
 *  - Swaps em cadeia ou múltiplos por espécie.
 *  - Expansão em massa do catálogo de skills.
 *
 * ── FILOSOFIA DOS SWAPS (Fase 6.1) ───────────────────────────────────────────
 *
 *  Esta camada de swap é dividida em dois papéis distintos por slot:
 *
 *  SLOT 1 — Identidade base de espécie (available desde o nível 1):
 *   O swap de slot 1 expressa o arquétipo desde o primeiro combate.
 *   É uma variação do ataque básico da classe que reflete a personalidade
 *   da espécie: mesma família, custo maior, impacto diferente.
 *   Exemplo: shieldhorn troca velocidade por força bruta no golpe básico.
 *
 *  SLOT 4 — Assinatura avançada de espécie (desbloqueado em nível 30):
 *   O swap de slot 4 adiciona uma skill exclusiva que não existe no SKILL_DEFS
 *   legado para esse slot. É a marca de identidade do monstrinho ao maturar.
 *   Cada assinatura enfatiza o ponto forte do arquétipo (burst, controle, sustain).
 *   Nunca supera o teto de dano/suporte do tier 3 legado da mesma classe.
 *
 *  PRINCÍPIO DE CALIBRAÇÃO (auditado na Fase 6.1):
 *   Cada swap foi comparado a skills equivalentes no SKILL_DEFS.
 *   A eficiência por ENE de skills de controle/suporte não pode ser mais
 *   do que ~50% superior às skills análogas de outras classes no mesmo nível.
 *   Skills de dano ficam dentro da faixa tier-1 a tier-2 da classe respectiva.
 *
 * ── ESCOPO (Fase 6) ───────────────────────────────────────────────────────────
 *
 *  Espécies com swap implementado (apenas as já maduras no bridge):
 *   - shieldhorn (Guerreiro):  slot 1 — sempre desbloqueado
 *   - emberfang  (Bárbaro):    slot 4 — requer nível 30
 *   - moonquill  (Mago):       slot 4 — requer nível 30
 *   - floracura  (Curandeiro): slot 4 — requer nível 30
 *   - swiftclaw  (Caçador):    slot 1 — sempre desbloqueado (Fase 9)
 *   - shadowsting (Ladino):   slot 4 — requer nível 30 (Fase 10)
 *   - bellwave   (Bardo):     slot 4 — requer nível 30 (Fase 11)
 *
 * ── REGRAS DO SWAP ────────────────────────────────────────────────────────────
 *
 *  1. O swap respeita o número do slot (1-indexed, espelhando level_progression.json).
 *  2. O swap só é aplicado se `instance.unlockedSkillSlots >= targetSlot`.
 *  3. Se o slot-alvo já existe no array: REPLACE (substitui a skill existente).
 *  4. Se o slot-alvo está além do array atual: ADD (adiciona a skill ao array).
 *  5. Se o slot está bloqueado: swap não ocorre, metadado vai para blockedKitSwaps.
 *  6. Se canonSpeciesId ausente, espécie sem swap ou erro: skills inalteradas.
 *
 * ── METADADOS DE OBSERVABILIDADE ──────────────────────────────────────────────
 *
 *  Retornados por applyKitSwaps():
 *   appliedKitSwaps: [{ slot, canonSkillId, replacementId, action, originalSkill }]
 *   blockedKitSwaps: [{ slot, canonSkillId, reason, requiredSlots, currentSlots }]
 *
 *  Armazenados na instância pelo caller (createMonsterInstanceFromTemplate):
 *   instance.appliedKitSwaps  — swaps aplicados nesta instância
 *   instance.blockedKitSwaps  — swaps bloqueados por slot ainda não desbloqueado
 *
 * ── REFERÊNCIAS ───────────────────────────────────────────────────────────────
 *
 *  design/canon/species.json        — define kit_swap.replace_skill_id e with_concept
 *  design/canon/skills.json         — define canonSkillId e slot canônico
 *  design/canon/level_progression.json — define thresholds de slot unlock
 *  js/canon/slotUnlocks.js          — expõe getUnlockedSlotsForLevel()
 *  js/canon/speciesBridge.js        — expõe resolveCanonSpeciesId()
 *
 * NOTA SOBRE SKILLS DE SUBSTITUIÇÃO:
 *  As skills de substituição abaixo são skills de runtime com a mesma estrutura
 *  do SKILL_DEFS (type, cost, power, etc.) e realizam o conceito descrito em
 *  species.json[kit_swap.with_concept]. NÃO são skills canônicas completas —
 *  são a primeira camada funcional que concretiza o conceito de design.
 *  O campo `_kitSwapId` serve como ID rastreável único para cada swap.
 */

// ---------------------------------------------------------------------------
// Tabela de swaps — uma entrada por species_id canônico.
//
// Estrutura de cada entrada:
//   targetSlot:   número do slot alvo (1-indexed), espelha design/canon/skills.json
//   canonSkillId: ID canônico da skill que seria substituída (auditabilidade)
//   replacement:  objeto de skill runtime (mesma estrutura do SKILL_DEFS)
//
// ESPÉCIES IMPLEMENTADAS (Fase 6 → Fase 10):
//   shieldhorn — Guerreiro / tank_puro      → slot 1 (sempre disponível)
//   emberfang  — Bárbaro  / burst_agressivo → slot 4 (nível 30)
//   moonquill  — Mago     / controle_leve   → slot 4 (nível 30)
//   floracura  — Curandeiro / cura_estavel  → slot 4 (nível 30)
//   swiftclaw  — Caçador  / striker_veloz   → slot 1 (sempre disponível) — Fase 9
//   shadowsting — Ladino  / oportunista_furtivo → slot 4 (nível 30) — Fase 10
//
// AUDITORIA FASE 6.1 — valores verificados contra SKILL_DEFS e fórmulas do runtime:
//
//   shieldhorn Golpe Pesado I  (cost 6, pwr 22):
//     Golpe de Espada I (referência): cost 4, pwr 18 → 4.50 pwr/ENE
//     Golpe Pesado I (swap):          cost 6, pwr 22 → 3.67 pwr/ENE (−18.4%)
//     Menos eficiente em ENE, mais força por hit — coerente com tank_puro. ✅
//
//   emberfang Explosão Bruta I (cost 8, pwr 32):
//     Golpe Brutal I (tier 1): cost 6, pwr 24 → 4.00 pwr/ENE
//     Golpe Brutal II (tier 2): cost 8, pwr 32 → 4.00 pwr/ENE (igual ao tier 2)
//     Golpe Brutal III (teto):  cost 12, pwr 38 → 3.17 pwr/ENE (abaixo do teto) ✅
//     Slot 4 = ADD (sem slot legado para Bárbaro). Dentro da faixa tier 1-2. ✅
//
//   moonquill Véu Arcano I (cost 4, pwr −3 ATK, 2 turnos) [AJUSTADO Fase 6.1]:
//     Enfraquecer I (Ladino, ref): cost 4, −2 ATK, 1t → 0.5 ATK-t/ENE
//     Enfraquecer II (Ladino, ref): cost 6, −3 ATK, 2t → 1.0 ATK-t/ENE
//     Véu Arcano I pré-ajuste (cost 3): −3 ATK, 2t → 2.0 ATK-t/ENE (2× acima do ref) ❌
//     Véu Arcano I pós-ajuste (cost 4): −3 ATK, 2t → 1.5 ATK-t/ENE (+50% sobre Ladino) ✅
//     Custo elevado de 3 → 4 para manter <2× a eficiência do Ladino. ✅
//
//   floracura Cura Eficiente I (cost 3, pwr 10):
//     Cura I (slot 1, ref): cost 5, pwr 15 → 3.00 HP/ENE
//     Cura Eficiente I:     cost 3, pwr 10 → 3.33 HP/ENE (+11% eficiência)
//     Menos cura absoluta que slot 1 (10 vs 15) — sustain deliberado. ✅
//     Slot 4 = ADD (sem slot legado para Curandeiro). Dentro do teto (Cura III: 4.0 HP/ENE). ✅
//
//   bellwave Nota Discordante I (cost 4, pwr −2 SPD, 2 turnos) — Fase 11:
//     moonquill Véu Arcano I (ref): cost 4, -3 ATK, 2t → 1.50 ATK-t/ENE
//     shadowsting Golpe Furtivo I (ref): cost 5, pwr 22 (dano) → 4.40 pwr/ENE
//     Nota Discordante I: cost 4, -2 SPD, 2t → 1.00 SPD-t/ENE (conservador vs moonquill)
//     SPD debuff é situacionalmente forte (impede inimigo de agir primeiro) — por isso
//     a eficiência 1.0 SPD-t/ENE fica abaixo de moonquill (1.5 ATK-t/ENE). ✅
//     Slot 4 = ADD (sem slot legado de Bardo neste slot). Diferente de moonquill (ATK debuff). ✅
// ---------------------------------------------------------------------------
const KIT_SWAP_TABLE = {
    /**
     * shieldhorn (Guerreiro, arquétipo tank_puro)
     *
     * Conceito: "Básico mais pesado e menos veloz"
     * Slot alvo: 1 (warrior_basic_strike, nível 1 — sempre desbloqueado)
     * Efeito: Golpe Pesado I substitui o primeiro ataque básico de Guerreiro.
     *   Mais poder (22 vs 18) e maior custo de ENE (6 vs 4) —
     *   reflete o arquétipo tank_puro que troca velocidade por força bruta.
     */
    shieldhorn: {
        targetSlot: 1,
        canonSkillId: 'warrior_basic_strike',
        replacement: {
            _kitSwapId: 'shieldhorn_heavy_strike',
            name: 'Golpe Pesado I',
            type: 'DAMAGE',
            cost: 6,
            power: 22,
            desc: 'Golpe lento e pesado. Mais força, menos agilidade.',
        },
    },

    /**
     * emberfang (Bárbaro, arquétipo burst_agressivo)
     *
     * Conceito: "Explosão de 1 turno ainda mais agressiva"
     * Slot alvo: 4 (barbarian_berserk, nível 30 — unlock tardio)
     * Efeito: Explosão Bruta I adiciona uma assinatura de alto risco/recompensa
     *   ao slot 4, disponível apenas quando o monstrinho alcança nível suficiente.
     */
    emberfang: {
        targetSlot: 4,
        canonSkillId: 'barbarian_berserk',
        replacement: {
            _kitSwapId: 'emberfang_brutal_burst',
            name: 'Explosão Bruta I',
            type: 'DAMAGE',
            cost: 8,
            power: 32,
            desc: 'Explosão agressiva em 1 turno. Alto risco, alto impacto.',
        },
    },

    /**
     * moonquill (Mago, arquétipo controle_leve)
     *
     * Conceito: "Assinatura com menos dano e mais controle"
     * Slot alvo: 4 (mage_arcane_storm, nível 30 — unlock tardio)
     * Efeito: Véu Arcano I troca dano em área por debuff de controle —
     *   reduz ATK do inimigo por 2 turnos, coerente com controle_leve.
     *
     * AJUSTE Fase 6.1 — custo corrigido de 3 → 4:
     *   Pré-ajuste (cost 3): 2.0 ATK-t/ENE — 2× mais eficiente que Enfraquecer II
     *   (Ladino: −3 ATK, 2t, cost 6 → 1.0 ATK-t/ENE). Isso é excessivo.
     *   Pós-ajuste (cost 4): 1.5 ATK-t/ENE — +50% vs Ladino, justificado pelo
     *   perfil de controle do Mago e pelo melhor regen de ENE (18% vs 14%).
     */
    moonquill: {
        targetSlot: 4,
        canonSkillId: 'mage_arcane_storm',
        replacement: {
            _kitSwapId: 'moonquill_arcane_veil',
            name: 'Véu Arcano I',
            type: 'BUFF',
            cost: 4,
            power: -3,
            buffType: 'ATK',
            target: 'enemy',
            duration: 2,
            desc: 'Envolve o inimigo em névoa arcana. Menos dano, mais controle.',
        },
    },

    /**
     * floracura (Curandeiro, arquétipo cura_estavel)
     *
     * Conceito: "Cura em área mais fraca, porém mais eficiente"
     * Slot alvo: 4 (healer_group_heal, nível 30 — unlock tardio)
     * Efeito: Cura Eficiente I cura com poder menor mas custo de ENE baixo —
     *   permite sustain prolongado, coerente com cura_estavel.
     */
    floracura: {
        targetSlot: 4,
        canonSkillId: 'healer_group_heal',
        replacement: {
            _kitSwapId: 'floracura_efficient_heal',
            name: 'Cura Eficiente I',
            type: 'HEAL',
            cost: 3,
            power: 10,
            target: 'ally',
            desc: 'Cura de área fraca mas eficiente em ENE. Bom para suporte prolongado.',
        },
    },

    /**
     * swiftclaw (Caçador, arquétipo striker_veloz) — Fase 9
     *
     * Conceito: "Flecha rápida com menor custo e maior pressão de abertura"
     * Slot alvo: 1 (hunter_basic_shot, nível 1 — sempre desbloqueado)
     * Efeito: Flecha Certeira I substitui o ataque básico do Caçador.
     *   Menor custo de ENE (3 vs 4) e menor poder absoluto (15 vs 19),
     *   mas mais eficiente por ENE (5.0 vs 4.75 pwr/ENE) —
     *   reflete o arquétipo striker_veloz que prioriza ataques frequentes
     *   e pressão sustentada sobre burst de um único hit.
     *
     * AUDITORIA (Fase 9):
     *   Flecha Poderosa I (ref slot 1 Caçador): cost 4, power 19 → 4.75 pwr/ENE
     *   Flecha Certeira I (swap):               cost 3, power 15 → 5.00 pwr/ENE (+5.3%)
     *   Poder absoluto menor (15 vs 19, −21%); eficiência levemente acima — coerente. ✅
     *   Slot 1 = REPLACE (substitui a skill existente no slot 1).
     */
    swiftclaw: {
        targetSlot: 1,
        canonSkillId: 'hunter_basic_shot',
        replacement: {
            _kitSwapId: 'swiftclaw_precise_shot',
            name: 'Flecha Certeira I',
            type: 'DAMAGE',
            cost: 3,
            power: 15,
            desc: 'Flecha rápida e precisa. Menor custo, pressão de abertura sustentada.',
        },
    },

    /**
     * shadowsting (Ladino, arquétipo oportunista_furtivo) — Fase 10
     *
     * Conceito: "Golpe de execução após setup de debuff"
     * Slot alvo: 4 (rogue_ambush, nível 30 — desbloqueio tardio)
     * Efeito: Golpe Furtivo I é a assinatura de execução — disponível quando o
     *   shadowsting maturou e pode explorar o loop debuff→execução de forma plena.
     *
     * DIFERENCIAÇÃO DE SWIFTCLAW:
     *   swiftclaw usa slot 1 (sempre disponível) — identidade de abertura rápida.
     *   shadowsting usa slot 4 (requer L30) — identidade de oportunismo tardio.
     *   swiftclaw: DAMAGE puro de alta eficiência (5.00 pwr/ENE, cadência alta).
     *   shadowsting: DAMAGE de execução (4.40 pwr/ENE) — sinérgico com passiva que
     *     ativa ANTES (debuff → ataque básico com carga), não com o swap em si.
     *     O swap é o encerramento da jogada, não o gatilho.
     *
     * AUDITORIA:
     *   Ataque Preciso I (Ladino, ref tier 1): cost 4, pwr 19 → 4.75 pwr/ENE
     *   Ataque Preciso II (Ladino, ref tier 2): cost 6, pwr 24 → 4.00 pwr/ENE
     *   Golpe Furtivo I (swap):                 cost 5, pwr 22 → 4.40 pwr/ENE
     *   Dentro da faixa tier 1-2 (4.00–4.75). Poder absoluto (22) abaixo do teto
     *   Ataque Preciso III (30). Custo intermediário (5) sinaliza o caráter tático. ✅
     */
    shadowsting: {
        targetSlot: 4,
        canonSkillId: 'rogue_ambush',
        replacement: {
            _kitSwapId: 'shadowsting_ambush_strike',
            name: 'Golpe Furtivo I',
            type: 'DAMAGE',
            cost: 5,
            power: 22,
            desc: 'Golpe furtivo de execução. Devastador após debuff preparado.',
        },
    },

    /**
     * bellwave (Bardo, arquétipo cadencia_ritmica) — Fase 11
     *
     * Conceito: "Nota discordante — debuff de SPD no inimigo, identidade rítmica"
     * Slot alvo: 4 (bard_dissonance, nível 30 — desbloqueio tardio)
     * Efeito: Nota Discordante I adiciona debuff de SPD ao inimigo.
     *   Reduz a velocidade do oponente por 2 turnos — o inimigo age depois.
     *   Sinérgico com o arquétipo de alta velocidade do bellwave:
     *   bellwave age primeiro → usa Nota Discordante → inimigo fica ainda mais lento
     *   → próximo turno, bellwave usa ataque básico com bônus rítmico da passiva.
     *
     * DIFERENCIAÇÃO DE MOONQUILL:
     *   moonquill: ATK debuff (−3 ATK do inimigo) — reduz dano do oponente.
     *   bellwave: SPD debuff (−2 SPD do inimigo) — reduz velocidade do oponente.
     *   moonquill: recompensado com +1 SPD PRÓPRIO (passiva on_skill_used+isDebuff).
     *   bellwave: usa debuff para CARREGAR RITMO (passiva on_attack after any skill).
     *   Loop moonquill: debuffar → ganhar velocidade → controlar melhor.
     *   Loop bellwave: usar skill → carregar ritmo → atacar com bônus → repetir.
     *   O foco do bellwave é a alternância cadenciada; o foco do moonquill é o controle.
     *
     * AUDITORIA (Fase 11):
     *   moonquill Véu Arcano I (ref SPD-adjacent debuff): cost 4, -3 ATK, 2t → 1.50 ATK-t/ENE
     *   Nota Discordante I: cost 4, -2 SPD, 2t → 1.00 SPD-t/ENE (−33% vs moonquill)
     *   SPD debuff é mais forte situacionalmente (nega prioridade de turno), por isso
     *   a eficiência 1.0 SPD-t/ENE é intencional — mais conservadora. ✅
     *   Slot 4 = ADD (sem slot 4 legado para Bardo). Tipo BUFF+enemy+power<0 → é debuff. ✅
     */
    bellwave: {
        targetSlot: 4,
        canonSkillId: 'bard_dissonance',
        replacement: {
            _kitSwapId: 'bellwave_discordant_note',
            name: 'Nota Discordante I',
            type: 'BUFF',
            cost: 4,
            power: -2,
            buffType: 'SPD',
            target: 'enemy',
            duration: 2,
            desc: 'Nota dissonante que desorienta o ritmo do inimigo. Reduz velocidade por 2 turnos.',
        },
    },
};

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Aplica kit swaps ao array de skills baseado na espécie canônica da instância.
 *
 * Fallback seguro: retorna as skills originais sem modificação quando:
 *  - instance não tem canonSpeciesId;
 *  - não há swap definido para a espécie;
 *  - o slot alvo está bloqueado (targetSlot > unlockedSkillSlots);
 *  - qualquer exceção interna.
 *
 * @param {{
 *   canonSpeciesId?: string|null,
 *   unlockedSkillSlots?: number,
 * }} instance - Instância com metadados canônicos (Fase 3 + Fase 5).
 * @param {Array<object>} skills - Array de skills base (ex: retorno de getMonsterSkills()).
 * @returns {{
 *   skills: Array<object>,
 *   appliedKitSwaps: Array<{slot:number, canonSkillId:string, replacementId:string, action:string, originalSkill:string|null}>,
 *   blockedKitSwaps: Array<{slot:number, canonSkillId:string, reason:string, requiredSlots:number, currentSlots:number}>,
 * }}
 */
export function applyKitSwaps(instance, skills) {
    const baseSkills = Array.isArray(skills) ? skills : [];

    // Fallback: sem espécie canônica → kit legado inalterado
    if (!instance?.canonSpeciesId) {
        return {
            skills: baseSkills.slice(),
            appliedKitSwaps: [],
            blockedKitSwaps: [],
        };
    }

    const swapDef = KIT_SWAP_TABLE[instance.canonSpeciesId];

    // Fallback: espécie sem swap definido → kit legado inalterado
    if (!swapDef) {
        return {
            skills: baseSkills.slice(),
            appliedKitSwaps: [],
            blockedKitSwaps: [],
        };
    }

    const { targetSlot, canonSkillId, replacement } = swapDef;
    const unlockedSlots = typeof instance.unlockedSkillSlots === 'number'
        ? instance.unlockedSkillSlots
        : 1; // fallback mínimo seguro

    // Verificar se o slot está desbloqueado
    if (targetSlot > unlockedSlots) {
        return {
            skills: baseSkills.slice(),
            appliedKitSwaps: [],
            blockedKitSwaps: [{
                slot: targetSlot,
                canonSkillId,
                reason: 'slot_not_unlocked',
                requiredSlots: targetSlot,
                currentSlots: unlockedSlots,
            }],
        };
    }

    // Aplicar swap — índice 0-based no array de skills
    const idx = targetSlot - 1;
    const newSkills = baseSkills.slice();
    let originalSkill = null;
    let action;

    if (idx < newSkills.length) {
        // Slot já existe no array: substituir
        const existing = newSkills[idx];
        originalSkill = existing?.name ?? existing?._kitSwapId ?? null;
        newSkills[idx] = { ...replacement };
        action = 'replaced';
    } else {
        // Slot além do array atual: estender e adicionar
        // Preenche gaps com null (não deveria ocorrer em operação normal)
        while (newSkills.length < idx) {
            newSkills.push(null);
        }
        newSkills.push({ ...replacement });
        action = 'added';
    }

    return {
        skills: newSkills,
        appliedKitSwaps: [{
            slot: targetSlot,
            canonSkillId,
            replacementId: replacement._kitSwapId,
            action,
            originalSkill,
        }],
        blockedKitSwaps: [],
    };
}

/**
 * Verifica se um species_id tem kit swap implementado nesta fase.
 *
 * @param {string|null} speciesId
 * @returns {boolean}
 */
export function hasKitSwap(speciesId) {
    return speciesId != null &&
        Object.prototype.hasOwnProperty.call(KIT_SWAP_TABLE, speciesId);
}

/**
 * Retorna os species_ids com kit swap implementado.
 * Útil para auditoria e relatórios de cobertura.
 *
 * @returns {string[]}
 */
export function getActiveKitSwapIds() {
    return Object.keys(KIT_SWAP_TABLE);
}

/**
 * Rastreabilidade: fonte de design dos kit_swaps desta fase.
 */
export const KIT_SWAP_SOURCE = 'design/canon/species.json';

// ---------------------------------------------------------------------------
// Tabela de promoções — Fase 7
//
// Mapeia `_kitSwapId` da Fase 6 → condição de promoção + skill promovida.
//
// Regras de promoção:
//   canonSpeciesId  : deve coincidir com instance.canonSpeciesId (segurança)
//   minLevel        : nível mínimo para a promoção ser desbloqueada
//   targetSlot      : slot alvo (herdado do swap original; verificado contra unlockedSkillSlots)
//   promoted        : nova skill que substitui a versão I ao ser promovida
//
// CALIBRAÇÃO (Fase 7) — eficiência verificada contra referências da Fase 6.1:
//
//   shieldhorn_heavy_strike_ii  (cost 8, pwr 30, L20):
//     Versão I:        cost 6, pwr 22 → 3.67 pwr/ENE
//     Versão II:       cost 8, pwr 30 → 3.75 pwr/ENE (+2.2% eficiência)
//     Ref tier-2 WAR: cost 8, pwr 32 → 4.00 pwr/ENE  (abaixo) ✅
//     Aumento modesto — tank_puro ganha força, não velocidade.
//
//   emberfang_brutal_burst_ii   (cost 10, pwr 38, L50):
//     Versão I:        cost 8, pwr 32 → 4.00 pwr/ENE (= tier 2)
//     Versão II:       cost 10, pwr 38 → 3.80 pwr/ENE (entre tier 2 e tier 3)
//     Ref tier-3 BAR: cost 12, pwr 38 → 3.17 pwr/ENE  (mesmo poder bruto, ENE menor) ✅
//     Mesmo teto de dano do tier 3, mais barato — coerente com nível 50.
//
//   moonquill_arcane_veil_ii    (cost 5, -4 ATK, 2t, L50):
//     Versão I:        cost 4, -3 ATK, 2t → 1.50 ATK-t/ENE
//     Versão II:       cost 5, -4 ATK, 2t → 1.60 ATK-t/ENE (+6.7%)
//     Ref Ladino Enfraquecer II: cost 6, -3 ATK, 2t → 1.00 ATK-t/ENE
//     1.60 está 60% acima do Ladino — justificado pela progressão de nível 50. ✅
//     Mantém duração estável para controle previsível.
//
//   floracura_efficient_heal_ii (cost 4, pwr 14, L50):
//     Versão I:        cost 3, pwr 10 → 3.33 HP/ENE
//     Versão II:       cost 4, pwr 14 → 3.50 HP/ENE (+5.1%)
//     Ref teto Cura III:  4.00 HP/ENE  (ainda abaixo do teto) ✅
//     Sustain progressivo sem quebrar o teto de cura estabelecido.
// ---------------------------------------------------------------------------
const KIT_SWAP_PROMOTION_TABLE = {
    /**
     * shieldhorn (Guerreiro, tank_puro) — slot 1 — promoção no nível 20
     * Golpe Pesado I → Golpe Pesado II
     * Nível 20 é pré-slot-4 (L30): dá progressão intermediária ao tank.
     */
    shieldhorn_heavy_strike: {
        canonSpeciesId: 'shieldhorn',
        targetSlot: 1,
        minLevel: 20,
        promotedSwapId: 'shieldhorn_heavy_strike_ii',
        promoted: {
            _kitSwapId: 'shieldhorn_heavy_strike_ii',
            name: 'Golpe Pesado II',
            type: 'DAMAGE',
            cost: 8,
            power: 30,
            desc: 'Golpe devastador aprimorado. Força bruta elevada ao máximo do arquétipo.',
        },
    },

    /**
     * emberfang (Bárbaro, burst_agressivo) — slot 4 — promoção no nível 50
     * Explosão Bruta I → Explosão Bruta II
     * Slot 4 já desbloqueado em L30; promoção em L50 recompensa progressão alta.
     */
    emberfang_brutal_burst: {
        canonSpeciesId: 'emberfang',
        targetSlot: 4,
        minLevel: 50,
        promotedSwapId: 'emberfang_brutal_burst_ii',
        promoted: {
            _kitSwapId: 'emberfang_brutal_burst_ii',
            name: 'Explosão Bruta II',
            type: 'DAMAGE',
            cost: 10,
            power: 38,
            desc: 'Explosão agressiva aprimorada. Impacto do tier 3 com custo de ENE menor.',
        },
    },

    /**
     * moonquill (Mago, controle_leve) — slot 4 — promoção no nível 50
     * Véu Arcano I → Véu Arcano II
     * Debuff levemente mais potente; duração mantida para previsibilidade.
     */
    moonquill_arcane_veil: {
        canonSpeciesId: 'moonquill',
        targetSlot: 4,
        minLevel: 50,
        promotedSwapId: 'moonquill_arcane_veil_ii',
        promoted: {
            _kitSwapId: 'moonquill_arcane_veil_ii',
            name: 'Véu Arcano II',
            type: 'BUFF',
            cost: 5,
            power: -4,
            buffType: 'ATK',
            target: 'enemy',
            duration: 2,
            desc: 'Névoa arcana intensificada. Controle superior com eficiência progressiva.',
        },
    },

    /**
     * floracura (Curandeiro, cura_estavel) — slot 4 — promoção no nível 50
     * Cura Eficiente I → Cura Eficiente II
     * Sustain progressivo abaixo do teto de Cura III.
     */
    floracura_efficient_heal: {
        canonSpeciesId: 'floracura',
        targetSlot: 4,
        minLevel: 50,
        promotedSwapId: 'floracura_efficient_heal_ii',
        promoted: {
            _kitSwapId: 'floracura_efficient_heal_ii',
            name: 'Cura Eficiente II',
            type: 'HEAL',
            cost: 4,
            power: 14,
            target: 'ally',
            desc: 'Cura eficiente aprimorada. Sustain superior ainda abaixo do teto de Cura III.',
        },
    },

    /**
     * swiftclaw (Caçador, striker_veloz) — slot 1 — promoção no nível 20 — Fase 9
     * Flecha Certeira I → Flecha Certeira II
     * Nível 20 é pré-slot-4 (L30): dá progressão intermediária ao striker veloz.
     * Eficiência mantida (5.0 pwr/ENE); poder absoluto aumenta sem superar tier 3.
     *
     * AUDITORIA:
     *   Flecha Poderosa II (ref tier 2): cost 6, power 24 → 4.00 pwr/ENE
     *   Flecha Certeira II (promoted):   cost 4, power 20 → 5.00 pwr/ENE (+25% eficiência)
     *   Poder absoluto menor (20 vs 24, −17%); eficiência superior — coerente com speedster. ✅
     *   Flecha Poderosa III (teto tier 3): cost 8, power 30 → 3.75 pwr/ENE (abaixo do swap). ✅
     */
    swiftclaw_precise_shot: {
        canonSpeciesId: 'swiftclaw',
        targetSlot: 1,
        minLevel: 20,
        promotedSwapId: 'swiftclaw_precise_shot_ii',
        promoted: {
            _kitSwapId: 'swiftclaw_precise_shot_ii',
            name: 'Flecha Certeira II',
            type: 'DAMAGE',
            cost: 4,
            power: 20,
            desc: 'Flecha certeira aprimorada. Velocidade e precisão elevadas ao máximo do arquétipo.',
        },
    },

    /**
     * shadowsting (Ladino, oportunista_furtivo) — slot 4 — promoção no nível 50 — Fase 10
     * Golpe Furtivo I → Golpe Furtivo II
     * Slot 4 desbloqueado em L30; promoção em L50 recompensa progressão alta.
     *
     * AUDITORIA:
     *   Golpe Furtivo I (versão I):  cost 5, pwr 22 → 4.40 pwr/ENE
     *   Golpe Furtivo II (promoted): cost 6, pwr 28 → 4.67 pwr/ENE (+6.1%)
     *   Ataque Preciso I (teto tier 1): cost 4, pwr 19 → 4.75 pwr/ENE
     *   Ataque Preciso III (teto abs): cost 8, pwr 30 → 3.75 pwr/ENE
     *   Promovido fica dentro da faixa tier 1-2 (4.00–4.75). Poder absoluto (28)
     *   abaixo do teto Ataque Preciso III (30). Diferenciação de swiftclaw: ✅
     *     swiftclaw_ii: cost 4, pwr 20 → 5.00 pwr/ENE (cadência alta, burst menor)
     *     shadowsting_ii: cost 6, pwr 28 → 4.67 pwr/ENE (burst maior, custo maior)
     *   Os dois promovidos têm filosofia oposta mesmo sendo ambos DAMAGE. ✅
     */
    shadowsting_ambush_strike: {
        canonSpeciesId: 'shadowsting',
        targetSlot: 4,
        minLevel: 50,
        promotedSwapId: 'shadowsting_ambush_strike_ii',
        promoted: {
            _kitSwapId: 'shadowsting_ambush_strike_ii',
            name: 'Golpe Furtivo II',
            type: 'DAMAGE',
            cost: 6,
            power: 28,
            desc: 'Golpe furtivo aprimorado. Execução maximizada após setup de debuff.',
        },
    },

    /**
     * bellwave (Bardo, cadencia_ritmica) — slot 4 — promoção no nível 50 — Fase 11
     * Nota Discordante I → Nota Discordante II
     * Slot 4 desbloqueado em L30; promoção em L50 recompensa progressão alta.
     *
     * AUDITORIA:
     *   Nota Discordante I (versão I):  cost 4, -2 SPD, 2t → 1.00 SPD-t/ENE
     *   Nota Discordante II (promoted): cost 5, -3 SPD, 2t → 1.20 SPD-t/ENE (+20%)
     *   moonquill Véu Arcano II (ref L50): cost 5, -4 ATK, 2t → 1.60 ATK-t/ENE
     *   Nota Discordante II ainda abaixo do Véu Arcano II (1.20 vs 1.60) —
     *   SPD debuff mais conservador que ATK debuff por ser situacionalmente forte. ✅
     *   Progressão modesta: +20% eficiência em SPD-t/ENE ao nível 50. ✅
     */
    bellwave_discordant_note: {
        canonSpeciesId: 'bellwave',
        targetSlot: 4,
        minLevel: 50,
        promotedSwapId: 'bellwave_discordant_note_ii',
        promoted: {
            _kitSwapId: 'bellwave_discordant_note_ii',
            name: 'Nota Discordante II',
            type: 'BUFF',
            cost: 5,
            power: -3,
            buffType: 'SPD',
            target: 'enemy',
            duration: 2,
            desc: 'Nota discordante intensificada. Desorientação rítmica ainda mais profunda.',
        },
    },
};

// ---------------------------------------------------------------------------
// API pública — Fase 7: Promoção de kit_swaps
// ---------------------------------------------------------------------------

/**
 * Verifica e aplica promoções de kit_swap com base no estado atual da instância.
 *
 * A promoção ocorre quando:
 *   1. instance.canonSpeciesId está presente;
 *   2. instance.appliedKitSwaps contém um swap com promoção definida;
 *   3. instance.level >= promoção.minLevel;
 *   4. instance.unlockedSkillSlots >= promoção.targetSlot;
 *   5. canonSpeciesId coincide com o da promoção (verificação de segurança).
 *
 * Fallback total: sem canonSpeciesId, sem swaps aplicados, ou sem condição → retorna
 * arrays vazios e updated=false, sem modificar a instância.
 *
 * @param {{
 *   canonSpeciesId?: string|null,
 *   appliedKitSwaps?: Array<{slot:number, canonSkillId:string, replacementId:string, action:string, originalSkill:string|null}>,
 *   unlockedSkillSlots?: number,
 *   level?: number,
 *   promotedKitSwaps?: Array,
 * }} instance - Instância do monstrinho com metadados canônicos.
 * @returns {{
 *   promotedKitSwaps: Array<{
 *     fromSwapId: string,
 *     toSwapId: string,
 *     slot: number,
 *     canonSkillId: string,
 *     promotedSkill: object,
 *     level: number,
 *   }>,
 *   blockedKitSwapPromotions: Array<{
 *     swapId: string,
 *     reason: string,
 *     [key: string]: any,
 *   }>,
 *   updated: boolean,
 * }}
 */
export function promoteKitSwaps(instance) {
    const promotedKitSwaps = [];
    const blockedKitSwapPromotions = [];

    // Fallback: sem espécie canônica → não há swaps canônicos para promover
    if (!instance?.canonSpeciesId) {
        return { promotedKitSwaps, blockedKitSwapPromotions, updated: false };
    }

    const appliedSwaps = Array.isArray(instance.appliedKitSwaps) ? instance.appliedKitSwaps : [];

    // Sem swaps aplicados → nada a promover
    if (appliedSwaps.length === 0) {
        return { promotedKitSwaps, blockedKitSwapPromotions, updated: false };
    }

    const currentLevel = typeof instance.level === 'number' ? instance.level : 1;
    const unlockedSlots = typeof instance.unlockedSkillSlots === 'number'
        ? instance.unlockedSkillSlots
        : 1;

    // Mapa de promoções já realizadas (para evitar promover duas vezes)
    const alreadyPromotedSwapIds = new Set(
        Array.isArray(instance.promotedKitSwaps)
            ? instance.promotedKitSwaps.map(p => p.fromSwapId)
            : []
    );

    for (const applied of appliedSwaps) {
        const swapId = applied?.replacementId;
        if (!swapId) continue;

        // Verificar se já foi promovido anteriormente
        if (alreadyPromotedSwapIds.has(swapId)) continue;

        const promotionDef = KIT_SWAP_PROMOTION_TABLE[swapId];

        // Sem promoção definida para este swap → não bloqueia, apenas ignora
        if (!promotionDef) continue;

        // Verificar consistência de espécie (segurança adicional)
        if (promotionDef.canonSpeciesId !== instance.canonSpeciesId) {
            blockedKitSwapPromotions.push({
                swapId,
                reason: 'species_mismatch',
                requiredSpecies: promotionDef.canonSpeciesId,
                currentSpecies: instance.canonSpeciesId,
                promotedSwapId: promotionDef.promotedSwapId,
            });
            continue;
        }

        // Verificar slot desbloqueado
        if (promotionDef.targetSlot > unlockedSlots) {
            blockedKitSwapPromotions.push({
                swapId,
                reason: 'slot_not_unlocked',
                targetSlot: promotionDef.targetSlot,
                currentSlots: unlockedSlots,
                promotedSwapId: promotionDef.promotedSwapId,
            });
            continue;
        }

        // Verificar nível mínimo
        if (currentLevel < promotionDef.minLevel) {
            blockedKitSwapPromotions.push({
                swapId,
                reason: 'level_not_reached',
                currentLevel,
                minLevel: promotionDef.minLevel,
                promotedSwapId: promotionDef.promotedSwapId,
            });
            continue;
        }

        // Condições atendidas: promover
        promotedKitSwaps.push({
            fromSwapId: swapId,
            toSwapId: promotionDef.promotedSwapId,
            slot: applied.slot,
            canonSkillId: applied.canonSkillId,
            promotedSkill: { ...promotionDef.promoted },
            level: currentLevel,
        });
    }

    return {
        promotedKitSwaps,
        blockedKitSwapPromotions,
        updated: promotedKitSwaps.length > 0,
    };
}

/**
 * Retorna os _kitSwapIds que possuem promoção definida nesta fase.
 * Útil para auditoria e testes de cobertura.
 *
 * @returns {string[]}
 */
export function getPromotableSwapIds() {
    return Object.keys(KIT_SWAP_PROMOTION_TABLE);
}

/**
 * Rastreabilidade: tabela de promoções (exposta para auditoria).
 * Não modificar diretamente — use as funções exportadas.
 */
export { KIT_SWAP_PROMOTION_TABLE };

// ---------------------------------------------------------------------------
// API pública — Fase 7.1: Kit efetivo para runtime
// ---------------------------------------------------------------------------

/**
 * Resolve o kit efetivo final de um monstrinho, aplicando:
 *   1. Kit swap de espécie (Fase 6 — KIT_SWAP_TABLE), se o slot estiver desbloqueado.
 *   2. Promoção de kit swap (Fase 7 — KIT_SWAP_PROMOTION_TABLE), se existir e o
 *      monstrinho já tiver a promoção registrada em `instance.promotedKitSwaps`.
 *
 * Esta função é a ponte entre os metadados canônicos e o runtime de combate.
 * É chamada por `getMonsterSkills()` em `index.html` para garantir que swaps e
 * promoções afetam as skills efetivamente usadas em combate, UI e progressão.
 *
 * Fallbacks seguros:
 *  - Sem `canonSpeciesId` → retorna baseSkills inalteradas (kit legado).
 *  - Espécie sem swap → retorna baseSkills inalteradas.
 *  - Slot bloqueado (unlockedSkillSlots < targetSlot) → retorna baseSkills inalteradas.
 *  - Promoção inexistente → usa skill do swap base (versão I).
 *  - Qualquer erro interno → retorna baseSkills inalteradas com warn.
 *
 * @param {{
 *   canonSpeciesId?: string|null,
 *   unlockedSkillSlots?: number,
 *   appliedKitSwaps?: Array,
 *   promotedKitSwaps?: Array<{slot:number, promotedSkill:object}>,
 * }} instance - Instância do monstrinho com metadados canônicos.
 * @param {Array<object>} baseSkills - Skills base (retorno de getMonsterSkills legado).
 * @returns {Array<object>} Kit efetivo com swap/promoção aplicados.
 */
export function getEffectiveSkills(instance, baseSkills) {
    try {
        const skills = Array.isArray(baseSkills) ? baseSkills.slice() : [];

        // Fallback: sem espécie canônica → kit legado
        if (!instance?.canonSpeciesId) return skills;

        const swapDef = KIT_SWAP_TABLE[instance.canonSpeciesId];

        // Sem swap definido para esta espécie → kit legado
        if (!swapDef) return skills;

        const { targetSlot, replacement } = swapDef;
        const unlockedSlots = typeof instance.unlockedSkillSlots === 'number'
            ? instance.unlockedSkillSlots
            : 1;

        // Slot bloqueado → kit legado
        if (targetSlot > unlockedSlots) return skills;

        // Determinar qual skill usar: promoção (versão II+) ou swap base (versão I)
        let effectiveSkill = { ...replacement };

        if (Array.isArray(instance.promotedKitSwaps) && instance.promotedKitSwaps.length > 0) {
            const promo = instance.promotedKitSwaps.find(p => p.slot === targetSlot && p.promotedSkill);
            if (promo) {
                effectiveSkill = { ...promo.promotedSkill };
            }
        }

        // Aplicar skill efetiva no índice correto (0-based)
        const idx = targetSlot - 1;
        if (idx < skills.length) {
            skills[idx] = effectiveSkill;
        } else {
            // Preenche lacunas com null quando targetSlot está além do array atual.
            // Isso ocorre para swaps de slot 4 (ADD) em instâncias com <4 skills legadas.
            // Os slots intermediários nulos são ignorados na renderização e no combate.
            while (skills.length < idx) skills.push(null);
            skills.push(effectiveSkill);
        }

        return skills;
    } catch (err) {
        console.warn('[KitSwap] getEffectiveSkills falhou; usando kit legado.', err);
        return Array.isArray(baseSkills) ? baseSkills.slice() : [];
    }
}
