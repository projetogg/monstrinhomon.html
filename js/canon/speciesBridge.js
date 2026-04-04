/**
 * SPECIES BRIDGE — Fase 3 / Fase 8 de integração canônica
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

    // ── Guerreiro — evoluções da linha Pedrino (shieldhorn) ─────────────────
    // Pedronar: ATK 10, DEF 8 — continua equilibrado/defensivo; offsets
    //   (def+1, atk-1) reforçam o arquétipo shieldhorn sem distorcer.
    'MON_002B': 'shieldhorn',
    // Pedragon: ATK 14, DEF 11 — DEF cresce proporcionalmente ao ATK;
    //   mantém o perfil defensivo da linha evolutiva.
    'MON_002C': 'shieldhorn',

    // ── Guerreiro — evoluções da linha Ferrozimon (shieldhorn) ──────────────
    // Cavalheiromon: ATK 10, DEF 12 — DEF claramente dominante; arquétipo
    //   tank_puro inequívoco nesta evolução.
    'MON_010B': 'shieldhorn',
    // Kinguespinhomon: ATK 14, DEF 16 — DEF dominante; perfil tank mais
    //   pronunciado que o estágio base.
    'MON_010C': 'shieldhorn',
    // Arconouricomon: ATK 17, DEF 17 — alto em ambos, mas DEF não fica atrás
    //   de ATK; mantém identidade tank da linha.
    'MON_010D': 'shieldhorn',

    // ── Guerreiro — evoluções da linha Cascalhimon (shieldhorn) ─────────────
    // Muralhimon: ATK 9, DEF 12 — perfil fortemente defensivo; evolução
    //   natural do tank Cascalhimon.
    'MON_026B': 'shieldhorn',
    // Bastiaomon: ATK 11, DEF 16 — DEF muito acima de ATK; arquétipo
    //   tank_puro em sua forma mais clara nesta linha.
    'MON_026C': 'shieldhorn',

    // ── Bárbaro — evoluções da linha Tamborilhomon (emberfang) ──────────────
    // Rufamon: ATK 11, DEF 8 — ATK alto; mantém arquétipo burst da linha.
    'MON_021B': 'emberfang',
    // Trovatambormon: ATK 14, DEF 10 — ATK cresce consistentemente; perfil
    //   burst_agressivo preservado.
    'MON_021C': 'emberfang',

    // ── Bárbaro — evoluções da linha Tigrumo (emberfang) ────────────────────
    // Rugigron: ATK 13, DEF 6 — alto ATK, fragilidade intencional;
    //   arquétipo burst inequívoco.
    'MON_029B': 'emberfang',
    // Bestigrar: ATK 17, DEF 9 — ATK muito alto; fragil relativo; perfil
    //   emberfang em sua forma mais pronunciada.
    'MON_029C': 'emberfang',

    // ── Mago — evoluções da linha Lagartomon (moonquill) ────────────────────
    // Salamandromon: ATK 8, DEF 6, ENE 11 — ENE dominante sobre ATK/DEF;
    //   controle_leve preservado.
    'MON_014B': 'moonquill',
    // Dracoflamemon: ATK 12, DEF 8, ENE 14 — ENE cresce mais que ATK;
    //   arquétipo de controle se acentua na evolução.
    'MON_014C': 'moonquill',
    // Wizardragomon: ATK 15, DEF 10, ENE 18 — ENE muito dominante;
    //   forma mais pura do arquétipo controle_leve na linha.
    'MON_014D': 'moonquill',

    // ── Mago — evoluções da linha Coralimon (moonquill) ─────────────────────
    // Recifalmon: ATK 8, DEF 7, ENE 12 — ENE dominante, perfil defensivo/
    //   controle mantido; encaixa moonquill.
    'MON_024B': 'moonquill',
    // Abissalquimon: ATK 10, DEF 9, ENE 15 — ENE claramente dominante;
    //   controle_leve inequívoco.
    'MON_024C': 'moonquill',

    // ── Curandeiro — evoluções da linha Gotimon (floracura) ─────────────────
    // Lirialmon: ATK 6, DEF 6, ENE 12 — ENE alto, perfil healer estável;
    //   offset (hp+1, ene+1, agi-1) continua coerente.
    'MON_020B': 'floracura',
    // Serafloramon: ATK 7, DEF 9, ENE 16 — ENE dominante, DEF acima da
    //   média; suporte defensivo — floracura claro.
    'MON_020C': 'floracura',

    // ── Curandeiro — evoluções da linha Nutrilo (floracura) ─────────────────
    // Silvelio: ATK 5, DEF 7, ENE 14 — suporte quase puro; ATK mínimo
    //   e ENE alto são o arquétipo floracura continuado.
    'MON_028B': 'floracura',
    // Auravelo: ATK 7, DEF 10, ENE 17 — ENE muito dominante, DEF alta;
    //   healer defensivo de alta sustentação — floracura inequívoco.
    'MON_028C': 'floracura',

    // ── Caçador — arquétipo striker_veloz (swiftclaw) — Fase 9 ───────────────
    // Miaumon: ATK 8, DEF 4, SPD 9 — ATK:DEF 2.0, alta velocidade relativa;
    //   arquétipo striker_veloz inequívoco. Starter canônico da classe.
    'MON_013': 'swiftclaw',
    // Pulimbon: ATK 6, DEF 4, SPD 10 — ratio 1.5, SPD levemente maior que Miaumon;
    //   linha alternativa com foco ainda maior em velocidade pura.
    'MON_025': 'swiftclaw',

    // ── Caçador — evoluções da linha Miaumon (swiftclaw) ─────────────────────
    // Gatunamon: ATK 10, DEF 6, SPD 12 — ratio 1.67; arquétipo preservado.
    'MON_013B': 'swiftclaw',
    // Felinomon: ATK 14, DEF 7, SPD 15 — ratio 2.0; striker_veloz se acentua.
    'MON_013C': 'swiftclaw',
    // Panterezamon: ATK 18, DEF 9, SPD 18 — ratio 2.0; forma mais pura do arquétipo.
    'MON_013D': 'swiftclaw',

    // ── Caçador — evoluções da linha Pulimbon (swiftclaw) ────────────────────
    // Flecharelmon: ATK 10, DEF 5, SPD 14 — ratio 2.0; SPD cresce mais que ATK;
    //   velocidade se torna mais pronunciada que no estágio base.
    'MON_025B': 'swiftclaw',
    // Relampejomon: ATK 12, DEF 6, SPD 17 — ratio 2.0; SPD claramente dominante;
    //   forma mais veloz da linha — striker_veloz inequívoco.
    'MON_025C': 'swiftclaw',

    // ── Ladino — arquétipo oportunista_furtivo (shadowsting) — Fase 10 ──────
    // Corvimon: ATK 7, DEF 4, SPD 10, ENE 6 — perfil ladino mais limpo do catálogo.
    //   ENE/ATK = 0.86 (mais alto que swiftclaw 0.50) — sustenta loop debuff→execução.
    //   Linha 3 estágios (Comum → Incomum → Raro): arquétipo consistente do início ao fim.
    'MON_022': 'shadowsting',
    // Noxcorvomon: ATK 10, DEF 5, SPD 12, ENE 8 — ENE/ATK 0.80; identidade preservada.
    'MON_022B': 'shadowsting',
    // Umbraquimonom: ATK 14, DEF 7, SPD 16, ENE 10 — forma madura; ainda skill-oriented.
    'MON_022C': 'shadowsting',

    // ── Bardo — arquétipo cadencia_ritmica (bellwave) — Fase 11 ─────────────
    // Zunzumon: ATK 4, DEF 4, SPD 11, ENE 8 — perfil de Bardo mais coerente do catálogo.
    //   SPD/ATK = 2.75 e ENE/ATK = 2.0 — claramente não é striker nem tank.
    //   Linha 3 estágios (Comum → Incomum → Raro): arquétipo preservado em todos.
    //   Offset (def-1, ene+1, agi+1): reforça velocidade e energia sem esconder fragilidade.
    //   DEF_off = max(1, 4-1) = 3 — sem risco de floor em nenhum estágio.
    'MON_027': 'bellwave',
    // Melodimon: ATK 6, DEF 4, SPD 14, ENE 10 — SPD/ATK 2.33, ENE/ATK 1.67;
    //   arquétipo cadencia_ritmica preservado; SPD e ENE dominam sobre ATK.
    'MON_027B': 'bellwave',
    // Rainhassommon: ATK 8, DEF 6, SPD 15, ENE 12 — SPD/ATK 1.875, ENE/ATK 1.5;
    //   forma madura; SPD e ENE mantêm dominância relativa sobre ATK e DEF.
    'MON_027C': 'bellwave',

    // ── Sem mapeamento — justificativas ─────────────────────────────────────
    // MON_100 (Rato-de-Lama, Guerreiro): ATK 5, DEF 3, HP 20 — stats fracos
    //   sem perfil defensivo claro; não se encaixa em tank_puro. Sem mapeamento.
    //
    // MON_005 (Garruncho, Caçador Comum): sem linha evolutiva (estágio único);
    //   sem dados de bootstrap para validar o arquétipo ao longo da linha completa.
    //   Não mapeado por falta de linha canônica validável (princípio: Fase 9).
    //
    // MON_008 (Sombrio, Ladino Comum): sem linha evolutiva (estágio único);
    //   mesma razão que Garruncho — sem linha completa para validar o arquétipo.
    //   Não mapeado em Fase 10 por falta de linha canônica validável.
    //
    // MON_030/B/C (Furtilhon, Velurino, Sombrifur): DEF_base=3 em MON_030 gera
    //   DEF_off=2 com shadowsting (def-1) — floor marginal e perigoso.
    //   ENE/ATK = 0.75 (mais baixo que Corvimon 0.86) — perfil mais similar a
    //   swiftclaw do que ao arquétipo oportunista_furtivo. Excluído da Fase 10.
    //
    // MON_001 (Cantapau, Bardo Comum): sem linha evolutiva (estágio único);
    //   mesma razão que Garruncho e Sombrio — sem linha completa para validar.
    //   Não mapeado em Fase 11.
    //
    // MON_011/B/C/D (Dinomon → Giganotometalmon, Bardo): drift de arquétipo em MON_011D.
    //   Estágios 1-3 têm SPD/ATK ≥ 1.09 (perfil de bardo veloz), mas MON_011D tem
    //   ATK 16, DEF 12 e SPD 11 — SPD cai abaixo de ATK, perfil vira bruiser pesado.
    //   Drift relevante de identidade no estágio final → linha excluída da Fase 11.
    //
    // ── Animalista — arquétipo equilíbrio_adaptativo (wildpace) — Fase 12 ────
    // Linha escolhida: Cervimon → Galhantemon → Bosquidalmon (MON_023/B/C).
    // Critério: ATK=DEF=ENE em todos os estágios; SPD sempre o maior stat da linha.
    //   MON_023: ATK 6, DEF 6, SPD 7, ENE 6 — balanceado, SPD ligeiramente acima
    //   MON_023B: ATK 8, DEF 8, SPD 10, ENE 8 — equilíbrio preservado, SPD cresce mais
    //   MON_023C: ATK 10, DEF 10, SPD 11, ENE 10 — ATK=DEF=ENE; SPD ainda acima
    // Identidade única: sem drift em nenhum estágio — arquétipo coerente do início ao fim.
    //
    // Linhas excluídas desta fase:
    //   MON_006 (Lobinho): estágio único, sem linha evolutiva — linha não validável.
    //   MON_012/B/C/D (Luvursomon → Ursauramon): ATK domina DEF progressivamente
    //     (1.0→1.25→1.17→1.29) com SPD baixo e constante — drift de burst crescente.
    //     Risco de sobreposição com emberfang (Bárbaro) e shieldhorn (Guerreiro).
    //     Excluída para evitar colisão de arquétipo.
    //
    // Cervimon: ATK 6, DEF 6, SPD 7 — ATK:DEF 1.0; SPD/ATK 1.17; equilíbrio base
    'MON_023': 'wildpace',
    // Galhantemon: ATK 8, DEF 8, SPD 10 — ATK:DEF 1.0; SPD/ATK 1.25; equilíbrio preservado
    'MON_023B': 'wildpace',
    // Bosquidalmon: ATK 10, DEF 10, SPD 11 — ATK:DEF 1.0; SPD ligeiramente acima; identidade estável
    'MON_023C': 'wildpace',
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
    'Caçador',     // swiftclaw (hunter) — Fase 9
    'Ladino',      // shadowsting (rogue) — Fase 10
    'Bardo',       // bellwave (bard) — Fase 11
    'Animalista',  // wildpace (animalista) — Fase 12
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
 * ── DECISÃO ARQUITETURAL (Fase 7.3) ─────────────────────────────────────────
 *
 * Esta função é chamada UMA ÚNICA VEZ, durante a criação da instância em
 * createMonsterInstanceFromTemplate(). O resultado (canonSpeciesId) é
 * armazenado diretamente na instância e NÃO deve ser recalculado depois.
 *
 * REGRA: canonSpeciesId é a identidade canônica da espécie resolvida no
 * momento da criação. Ele é PRESERVADO ao longo de evoluções.
 *
 * Por que não rederivar após a evolução?
 *   - Quando um monstrinho evolui, seu templateId muda (ex: MON_010 → MON_010B).
 *   - MON_010B NÃO tem entrada na tabela RUNTIME_TO_CANON_SPECIES —
 *     apenas os templates base (estágio 0) são mapeados.
 *   - Rederivar a partir do templateId pós-evolução retornaria null,
 *     apagando silenciosamente a identidade de espécie e quebrando:
 *       • passivas (resolvePassiveModifier lê canonSpeciesId)
 *       • kit swap (applyKitSwaps/getEffectiveSkills leem canonSpeciesId)
 *       • promoção de kit swap (promoteKitSwaps lê canonSpeciesId)
 *
 * COMO EXPANDIR NO FUTURO:
 *   - Se uma evolução precisar de espécie canônica diferente, adicione uma
 *     entrada explícita para o templateId evoluído em RUNTIME_TO_CANON_SPECIES,
 *     com justificativa documentada. Não toque em canonSpeciesId da instância
 *     diretamente no fluxo de evolução.
 *
 * ─────────────────────────────────────────────────────────────────────────────
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


