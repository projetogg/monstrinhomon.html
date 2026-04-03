/**
 * SPECIES BRIDGE — Fase 3 de integração canônica
 *
 * Ponte explícita entre IDs/templates do runtime e species_ids canônicos.
 * Aplica offsets de stats de espécie durante a criação de instâncias.
 *
 * O que este módulo FAZ:
 *  - Mapeamento explícito e auditável: runtime templateId → canon species_id
 *  - Resolução de offsets via canonLoader
 *  - Aplicação aditiva de offsets sobre stats base já calculados pelo runtime
 *  - Registro de metadados canônicos na instância (canonSpeciesId, canonAppliedOffsets)
 *  - Fallback seguro: instâncias sem mapeamento funcionam normalmente, sem offsets
 *  - Detecção de drift: utilitários para identificar templates sem mapeamento (Fase 3.1)
 *
 * O que este módulo NÃO faz (reservado para fases futuras):
 *  - Passivas de espécie
 *  - Kit swap (substituição de habilidades)
 *  - Desbloqueio de slots por nível
 *  - Evolução automática
 *  - Substituição de monsters.json
 *
 * ── MANUTENÇÃO DO BRIDGE ─────────────────────────────────────────────────────
 *
 * Para adicionar um novo mapeamento:
 *  1. Abra design/canon/species.json e confirme o species_id desejado.
 *  2. Adicione uma entrada em RUNTIME_TO_CANON_SPECIES com justificativa.
 *  3. Execute os testes: npx vitest run tests/speciesBridge.test.js
 *  4. Confirme que getEligibleUnmappedTemplateIds() não lista mais esse template.
 *
 * Para detectar templates elegíveis sem mapeamento:
 *  - Importe getEligibleUnmappedTemplateIds() e chame-a com o catálogo.
 *  - Templates de estágio base (sem sufixo) e classe com espécie canônica
 *    disponível são sinalizados como elegíveis para mapeamento futuro.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSpeciesStatOffsets } from './canonLoader.js';

// ---------------------------------------------------------------------------
// Tabela explícita de mapeamento runtime → cânone
//
// REGRAS:
//   - Cada entrada é uma decisão de design deliberada, não inferência automática.
//   - Nunca adicionar entrada sem justificativa documentada no comentário.
//   - Um template pode mapear para uma espécie canônica mesmo que os nomes difiram.
//   - Múltiplos templates podem compartilhar a mesma espécie (mesmo arquétipo).
//   - Templates sem entrada nesta tabela continuam funcionando com stats legados.
//
// DIVERGÊNCIAS DOCUMENTADAS (Fase 3):
//   - Nenhum template runtime tem o mesmo nome que uma espécie canônica.
//     Os nomes canônicos (Escudicorno, Presabrasa, etc.) são criaturas de design,
//     não os monstros do catálogo atual. Mapeamentos abaixo são por arquétipo e
//     classe, não por nome.
//   - Espécies canônicas "moonquill" e "floracura" têm offsets ene+1 / agi-1,
//     que se aplicam ao eneMax e spd do runtime respectivamente.
//   - Templates das linhas evolutivas (MON_002B, MON_010B, etc.) herdam o
//     mapeamento do estágio base apenas se compartilharem o mesmo arquétipo.
//     Evoluções que mudam arquétipo devem ter entrada própria ou nenhuma.
// ---------------------------------------------------------------------------
export const RUNTIME_TO_CANON_SPECIES = {
    // ── Guerreiro — arquétipo tank_puro (shieldhorn) ────────────────────────
    // Ferrozimon: DEF 9 vs ATK 7 — perfil tank mais claro do catálogo
    'MON_010': 'shieldhorn',
    // Pedrino: ATK 7, DEF 6 — guerreiro equilibrado; offsets (def+1, atk-1)
    //   o inclinam para o arquétipo defensivo sem distorcer o personagem.
    'MON_002': 'shieldhorn',
    // Cascalhimon: ATK 6, DEF 8, SPD 3 — segundo perfil mais tanky do catálogo
    //   (DEF alta, velocidade mínima). Ajuste ideal para shieldhorn.
    'MON_026': 'shieldhorn',

    // ── Bárbaro — arquétipo burst_agressivo (emberfang) ─────────────────────
    // Trovão: ATK 8, DEF 4 — alto dano, fragilidade intencional
    'MON_007': 'emberfang',
    // Tamborilhomon: mesmo arquétipo burst, mesma classe
    'MON_021': 'emberfang',
    // Tigrumo: ATK 9, DEF 4 — ATK ainda maior que Trovão; perfil burst inequívoco
    'MON_029': 'emberfang',

    // ── Mago — arquétipo controle_leve (moonquill) ──────────────────────────
    // Faíscari: Mago Comum, ENE 10 — perfil ENE-alto e controle
    'MON_003': 'moonquill',
    // Lagartomon: ENE 8, ATK 6 — menos agressivo que Faíscari; bom fit para
    //   controle_leve (offset ene+1 reforça foco em energia/controle).
    'MON_014': 'moonquill',
    // Coralimon: ATK 5, DEF 6, ENE 8 — mago defensivo/controle; DEF acima da
    //   média para Mago sugere estilo de suporte + controle, coerente com moonquill.
    'MON_024': 'moonquill',

    // ── Curandeiro — arquétipo cura_estavel (floracura) ─────────────────────
    // Ninfolha: ENE 12, ATK 4 — suporte sustentado; mapeamento original Fase 3
    'MON_004': 'floracura',
    // Gotimon: ENE 9, ATK 4 — healer estável; offset (hp+1, ene+1, agi-1)
    //   reforça o papel de suporte sem distorcer o personagem.
    'MON_020': 'floracura',
    // Nutrilo: ENE 11, ATK 3 — perfil de suporte mais puro do catálogo;
    //   ATK mínimo e ENE alto são o arquétipo floracura em sua forma mais clara.
    'MON_028': 'floracura',

    // ── Sem mapeamento — justificativas ─────────────────────────────────────
    // MON_100 (Rato-de-Lama, Guerreiro): ATK 5, DEF 3, HP 20 — stats fracos
    //   sem perfil defensivo claro; não se encaixa em tank_puro. Sem mapeamento.
};

// ---------------------------------------------------------------------------
// Classes de runtime que possuem ao menos uma espécie canônica disponível.
// Atualizar se novas espécies forem adicionadas a design/canon/species.json.
// ---------------------------------------------------------------------------
const CLASSES_WITH_CANON_SPECIES = new Set([
    'Guerreiro',   // shieldhorn (warrior)
    'Bárbaro',     // emberfang (barbarian)
    'Mago',        // moonquill (mage)
    'Curandeiro',  // floracura (healer)
]);

// ---------------------------------------------------------------------------
// Mapeamento de campos de offset canônico → nomes de stat no runtime
// Canon usa "agi" para o que o runtime chama de "spd".
// ---------------------------------------------------------------------------
const OFFSET_TO_RUNTIME = {
    hp:  'hpMax',   // offset de HP aplica-se ao hpMax
    atk: 'atk',
    def: 'def',
    ene: 'eneMax',  // offset de ENE aplica-se ao eneMax
    agi: 'spd',     // canon agi === runtime spd
};

// ---------------------------------------------------------------------------
// Funções puras (sem dependência de estado externo — fáceis de testar)
// ---------------------------------------------------------------------------

/**
 * Resolve o species_id canônico a partir de um templateId runtime.
 * Usa exclusivamente a tabela RUNTIME_TO_CANON_SPECIES — sem heurística.
 *
 * @param {string|null} templateId - ID do template (ex: 'MON_010')
 * @returns {string|null} species_id canônico ou null se não mapeado
 */
export function resolveCanonSpeciesId(templateId) {
    if (!templateId) return null;
    return RUNTIME_TO_CANON_SPECIES[templateId] || null;
}

/**
 * Aplica offsets canônicos a um objeto de stats do runtime.
 * Todos os offsets são aditivos. Nenhum stat pode cair abaixo de 1.
 *
 * @param {{ hpMax: number, atk: number, def: number, spd: number, eneMax: number }} stats
 *   Stats base já calculados pelo runtime (após levelMult e rarityMult).
 * @param {{ hp?: number, atk?: number, def?: number, ene?: number, agi?: number }|null} offsets
 *   Offsets canônicos de base_stat_offsets da espécie. null = noop.
 * @returns {{ stats: object, applied: object|null }}
 *   stats: novo objeto com offsets aplicados; applied: mapa dos offsets efetivamente não-zero.
 */
export function applyStatOffsets(stats, offsets) {
    const result = { ...stats };
    if (!offsets) return { stats: result, applied: null };

    const applied = {};
    for (const [canonKey, runtimeKey] of Object.entries(OFFSET_TO_RUNTIME)) {
        const delta = offsets[canonKey];
        if (typeof delta === 'number' && delta !== 0) {
            result[runtimeKey] = Math.max(1, (result[runtimeKey] || 0) + delta);
            applied[canonKey] = delta;
        }
    }

    return { stats: result, applied: Object.keys(applied).length > 0 ? applied : null };
}

// ---------------------------------------------------------------------------
// Função de alto nível para uso no runtime
// ---------------------------------------------------------------------------

/**
 * Resolve espécie canônica de um template, busca offsets via canonLoader
 * e os aplica ao conjunto de stats fornecido.
 *
 * Fallback seguro: se não houver mapeamento, species inativa ou dados canônicos
 * não carregados, retorna os stats originais sem modificação.
 *
 * @param {string} templateId - ID do template runtime (ex: 'MON_010')
 * @param {{ hpMax: number, atk: number, def: number, spd: number, eneMax: number }} stats
 *   Stats base calculados pelo runtime.
 * @returns {{ stats: object, canonSpeciesId: string|null, canonAppliedOffsets: object|null }}
 */
export function resolveAndApply(templateId, stats) {
    const speciesId = resolveCanonSpeciesId(templateId);
    if (!speciesId) {
        return { stats: { ...stats }, canonSpeciesId: null, canonAppliedOffsets: null };
    }

    let offsets = null;
    try {
        offsets = getSpeciesStatOffsets(speciesId);
    } catch (err) {
        console.warn('[speciesBridge] getSpeciesStatOffsets falhou; usando fallback.', err);
    }

    const { stats: adjusted, applied } = applyStatOffsets(stats, offsets);
    return { stats: adjusted, canonSpeciesId: speciesId, canonAppliedOffsets: applied };
}

// ---------------------------------------------------------------------------
// Utilitários de governança / detecção de drift (Fase 3.1)
// ---------------------------------------------------------------------------

/**
 * Retorna todos os templateIds do catálogo que ainda não têm mapeamento
 * na tabela RUNTIME_TO_CANON_SPECIES.
 *
 * Útil para auditoria e para detectar drift quando novos templates são
 * adicionados ao catálogo sem receber mapeamento de espécie.
 *
 * @param {Array<{id: string}>} catalog - Array de templates do MONSTER_CATALOG.
 * @returns {string[]} Array de templateIds sem mapeamento.
 */
export function getUnmappedTemplateIds(catalog) {
    if (!Array.isArray(catalog)) return [];
    return catalog
        .filter(t => t && t.id && !RUNTIME_TO_CANON_SPECIES[t.id])
        .map(t => t.id);
}

/**
 * Retorna os templateIds de estágio base (sem sufixo de letra) que ainda não
 * têm mapeamento, MAS pertencem a uma classe que já possui espécie canônica.
 *
 * Estes são os candidatos prioritários para receber mapeamento futuro,
 * pois são o estágio de entrada da linha evolutiva e têm classe com design
 * canônico disponível.
 *
 * Heurística de estágio base: templateId sem sufixo de letra (ex: MON_002, não MON_002B).
 *
 * @param {Array<{id: string, class: string}>} catalog - Array de templates do MONSTER_CATALOG.
 * @returns {Array<{id: string, class: string}>} Candidatos elegíveis sem mapeamento.
 */
export function getEligibleUnmappedTemplateIds(catalog) {
    if (!Array.isArray(catalog)) return [];
    return catalog.filter(t => {
        if (!t || !t.id) return false;
        if (RUNTIME_TO_CANON_SPECIES[t.id]) return false;          // já mapeado
        if (!CLASSES_WITH_CANON_SPECIES.has(t.class)) return false; // classe sem species
        // Estágio base: ID termina em dígito, sem sufixo de letra
        return /^MON_\d+$/.test(t.id);
    }).map(t => ({ id: t.id, class: t.class }));
}

/**
 * Resumo de cobertura do bridge para diagnóstico.
 * Retorna contagens e listas úteis para logging ou relatórios.
 *
 * @param {Array<{id: string, class: string}>} catalog
 * @returns {{ total: number, mapped: number, unmapped: number, eligibleUnmapped: Array }}
 */
export function getBridgeCoverageReport(catalog) {
    if (!Array.isArray(catalog)) {
        return { total: 0, mapped: 0, unmapped: 0, eligibleUnmapped: [] };
    }
    const total = catalog.filter(t => t && t.id).length;
    const unmappedIds = getUnmappedTemplateIds(catalog);
    const eligible = getEligibleUnmappedTemplateIds(catalog);
    return {
        total,
        mapped: total - unmappedIds.length,
        unmapped: unmappedIds.length,
        eligibleUnmapped: eligible,
    };
}


