/**
 * CANON LOADER — Fases 1 e 2 de integração da camada canônica de dados
 *
 * Carrega os arquivos JSON de design/canon/ e expõe funções de consulta.
 * Escopo MVP Fase 1: classes, matchups e habilidades das 4 classes centrais.
 * Escopo Fase 2: espécies, linhas evolutivas e marcos de progressão por nível.
 *
 * O que este módulo NÃO faz (reservado para fases posteriores):
 *  - substituição da fórmula de combate (faixas canônicas)
 *  - migração total de skills.json ou monsters.json
 *  - refactor de wildCore.js / groupActions.js
 *  - integração completa de espécies ao catálogo runtime
 */

// ---------------------------------------------------------------------------
// Mapeamento explícito entre nomes PT-BR do motor e IDs canônicos em inglês
// ---------------------------------------------------------------------------
const CLASS_MAP_PTBR_TO_ID = {
    'Guerreiro':  'warrior',
    'Bárbaro':    'barbarian',
    'Mago':       'mage',
    'Curandeiro': 'healer',
    'Bardo':      'bard',
    'Ladino':     'rogue',
    'Caçador':    'hunter',
    'Animalista': 'animalist',
};

const CLASS_MAP_ID_TO_PTBR = Object.fromEntries(
    Object.entries(CLASS_MAP_PTBR_TO_ID).map(([pt, id]) => [id, pt])
);

// Subconjunto MVP Fase 1 (apenas estas 4 classes são processadas agora)
// Fases posteriores devem expandir este conjunto para incluir Bardo, Ladino, Caçador, Animalista.
// Nota: esta restrição afeta apenas a indexação de habilidades em _indexMvpSkills.
const MVP_PHASE1_CLASSES = new Set(['Guerreiro', 'Bárbaro', 'Mago', 'Curandeiro']);

// ---------------------------------------------------------------------------
// Cache em memória — evita fetches repetidos
// ---------------------------------------------------------------------------
let _canonData = null; // { classes, matchups, skillsMvp, species, evolutionLines, levelProgression }

// Pre-carregamento: promise iniciada imediatamente no parse do módulo.
// Isso garante que o carregamento comece o mais cedo possível — antes de init().
// A promise é reutilizada por qualquer chamada subsequente a loadCanonData().
let _canonBootPromise = null;

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Fetch seguro de JSON relativo à raiz do projeto.
 * @param {string} path - caminho relativo a partir da raiz (ex: 'design/canon/classes.json')
 * @returns {Promise<any>}
 */
async function _fetchJson(path) {
    // Suporta tanto execução no browser (import.meta.url) quanto em testes Node
    let baseUrl = '';
    try {
        if (typeof import.meta !== 'undefined' && import.meta.url) {
            // js/canon/canonLoader.js → subir 2 níveis para chegar à raiz
            const url = new URL('../../' + path, import.meta.url);
            baseUrl = url.href;
        }
    } catch (err) {
        // Falha no build da URL (ex: ambiente Node sem suporte completo a import.meta.url).
        // O fetch usará um caminho relativo simples como fallback.
        console.debug('[canonLoader] URL absoluta indisponível; usando caminho relativo (ambiente Node).', err);
        baseUrl = '../../' + path;
    }

    const response = await fetch(baseUrl);
    if (!response.ok) {
        throw new Error(`[canonLoader] Falha ao carregar ${path}: ${response.status}`);
    }
    return response.json();
}

// ---------------------------------------------------------------------------
// Transformação dos dados do cânone
// ---------------------------------------------------------------------------

/**
 * Converte `classes_ptbr` do class_matchups.json para o formato usado pelo motor:
 * { 'NomeClasse': { strong: 'NomeClasse', weak: 'NomeClasse' }, ... }
 *
 * Divergência documentada:
 *   O ciclo canônico (class_matchups.json → classes_ptbr) é diferente do ciclo
 *   original em GAME_RULES.md/copilot-instructions. Por exemplo:
 *     - Canônico: Guerreiro > Ladino, fraco contra Mago
 *     - Original:  Guerreiro > Ladino, fraco contra Curandeiro
 *   A Fase 1 adota o cânone como source of truth, conforme instrução.
 *   Qualquer impacto nas sessões salvas deve ser avaliado antes da produção.
 *
 * @param {Object} matchupsJson - conteúdo de class_matchups.json
 * @returns {Object} mapa no formato do motor
 */
function _buildClassAdvantagesFromCanon(matchupsJson) {
    const ptbrTable = matchupsJson.classes_ptbr || {};
    const result = {};

    for (const [className, data] of Object.entries(ptbrTable)) {
        const strong = data.strong_against || null;
        const weak   = data.weak_against   || null;
        result[className] = { strong, weak };
    }

    // Garante que classes ausentes no cânone não causem erros (fallback neutro)
    for (const className of Object.keys(CLASS_MAP_PTBR_TO_ID)) {
        if (!result[className]) {
            result[className] = { strong: null, weak: null };
        }
    }

    return result;
}

/**
 * Indexa array de classes canônicas por ID e por nome PT-BR.
 * @param {Array} classesArray
 * @returns {{ byId: Object, byPtbr: Object }}
 */
function _indexClasses(classesArray) {
    const byId    = {};
    const byPtbr  = {};
    for (const cls of classesArray) {
        byId[cls.id] = cls;
        if (cls.name_pt) byPtbr[cls.name_pt] = cls;
    }
    return { byId, byPtbr };
}

/**
 * Agrupa habilidades MVP por classe (nome PT-BR), filtrando pelo subconjunto MVP.
 * @param {Array} skillsArray
 * @returns {Object} { 'Guerreiro': [...], 'Mago': [...], ... }
 */
function _indexMvpSkills(skillsArray) {
    const result = {};
    for (const skill of skillsArray) {
        const ptbr = CLASS_MAP_ID_TO_PTBR[skill.class_id];
        if (!ptbr || !MVP_PHASE1_CLASSES.has(ptbr)) continue;
        if (!result[ptbr]) result[ptbr] = [];
        result[ptbr].push(skill);
    }
    return result;
}

// ---------------------------------------------------------------------------
// Fase 2 — Transformação: species, evolution_lines, level_progression
// ---------------------------------------------------------------------------

/**
 * Indexa array de espécies canônicas por ID e por nome PT-BR.
 * @param {Array} speciesArray
 * @returns {{ byId: Object, byPtbr: Object }}
 */
function _indexSpecies(speciesArray) {
    const byId   = {};
    const byPtbr = {};
    for (const sp of speciesArray) {
        byId[sp.id] = sp;
        if (sp.name_pt) byPtbr[sp.name_pt] = sp;
    }
    return { byId, byPtbr };
}

/**
 * Indexa linhas evolutivas por line_id, class_id e por species_id de cada estágio.
 * @param {Array} linesArray
 * @returns {{ byLineId: Object, byClassId: Object, bySpeciesId: Object }}
 */
function _indexEvolutionLines(linesArray) {
    const byLineId    = {};
    const byClassId   = {};
    const bySpeciesId = {};

    for (const line of linesArray) {
        byLineId[line.line_id]    = line;
        byClassId[line.class_id]  = line;

        for (const stage of (line.stages || [])) {
            if (stage.species_id) {
                bySpeciesId[stage.species_id] = line;
            }
        }
    }

    return { byLineId, byClassId, bySpeciesId };
}

/**
 * Indexa marcos de progressão por nível.
 * Retorna { byLevel: { [level]: string[] }, classGrowthRules: Object }
 * @param {Object} progressionJson - conteúdo de level_progression.json
 * @returns {{ byLevel: Object, classGrowthRules: Object }}
 */
function _indexLevelProgression(progressionJson) {
    const byLevel          = {};
    const milestones       = progressionJson.levels_1_to_30 || [];
    const classGrowthRules = progressionJson.class_growth_rules || {};

    for (const entry of milestones) {
        byLevel[entry.level] = entry.unlocks || [];
    }

    return { byLevel, classGrowthRules };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Inicia o carregamento canônico o mais cedo possível (chamado no parse do módulo).
 * Idempotente: chamadas repetidas retornam a mesma promise.
 * @returns {Promise<{ classes, matchups, skillsMvp, species, evolutionLines, levelProgression }>}
 */
export function startCanonBoot() {
    if (!_canonBootPromise) {
        _canonBootPromise = _loadCanonDataInternal();
    }
    return _canonBootPromise;
}

/**
 * Carrega todos os arquivos de cânone (Fases 1 e 2).
 * Idempotente: chamadas subsequentes retornam o cache.
 * @returns {Promise<{ classes: Object, matchups: Object, skillsMvp: Object, species: Object, evolutionLines: Object, levelProgression: Object }>}
 */
export async function loadCanonData() {
    return startCanonBoot();
}

/**
 * Aplica dados canônicos a um objeto de configuração do GameState.
 * Deve ser chamado com `await` dentro do boot, após loadFromLocalStorage().
 *
 * Comportamento de fallback: se o carregamento falhar, a config não é modificada
 * e o motor continua com a tabela hardcoded existente.
 *
 * @param {Object} config - GameState.config (mutado no local)
 * @returns {Promise<void>}
 */
export async function applyCanonToConfig(config) {
    if (!config) return;
    try {
        await startCanonBoot();
        const advantages = _buildClassAdvantagesFromCanon(_canonData.matchups);
        if (advantages && Object.keys(advantages).length > 0) {
            config.classAdvantages = advantages;
            console.log('[canonLoader] classAdvantages aplicado via cânone.');
        }
    } catch (err) {
        // Fallback seguro: config permanece inalterada com a tabela hardcoded de classAdvantages
        console.warn('[canonLoader] applyCanonToConfig falhou; mantendo config legada.', err);
    }
}

// ---------------------------------------------------------------------------
// Implementação interna do carregamento
// ---------------------------------------------------------------------------

/**
 * Efetua o carregamento real dos 6 JSONs e preenche _canonData.
 * @private
 */
async function _loadCanonDataInternal() {
    if (_canonData) return _canonData;

    const [classesRaw, matchupsRaw, skillsMvpRaw, speciesRaw, evolutionLinesRaw, levelProgressionRaw] = await Promise.all([
        _fetchJson('design/canon/classes.json'),
        _fetchJson('design/canon/class_matchups.json'),
        _fetchJson('design/canon/skills_mvp_phase1.json'),
        _fetchJson('design/canon/species.json'),
        _fetchJson('design/canon/evolution_lines.json'),
        _fetchJson('design/canon/level_progression.json'),
    ]);

    _canonData = {
        classes:          _indexClasses(classesRaw),
        matchups:         matchupsRaw,
        skillsMvp:        _indexMvpSkills(skillsMvpRaw),
        species:          _indexSpecies(speciesRaw),
        evolutionLines:   _indexEvolutionLines(evolutionLinesRaw),
        levelProgression: _indexLevelProgression(levelProgressionRaw),
    };

    console.log('[canonLoader] Dados canônicos carregados (Fases 1 e 2).');
    return _canonData;
}

/**
 * Retorna os stats canônicos de uma classe.
 * @param {string} classNameOrId - nome PT-BR (ex: 'Guerreiro') ou ID (ex: 'warrior')
 * @returns {Object|null}
 */
export function getClassStats(classNameOrId) {
    if (!_canonData) {
        console.warn('[canonLoader] getClassStats chamado antes de loadCanonData()');
        return null;
    }
    const { byId, byPtbr } = _canonData.classes;
    return byPtbr[classNameOrId] || byId[classNameOrId] || null;
}

/**
 * Retorna a tabela de vantagens de classe no formato do motor:
 * { 'NomeClasse': { strong: 'NomeClasse', weak: 'NomeClasse' }, ... }
 * @returns {Object}
 */
export function getClassAdvantages() {
    if (!_canonData) {
        console.warn('[canonLoader] getClassAdvantages chamado antes de loadCanonData()');
        return {};
    }
    return _buildClassAdvantagesFromCanon(_canonData.matchups);
}

/**
 * Retorna as habilidades MVP de uma classe.
 * @param {string} classNameOrId - nome PT-BR ou ID canônico
 * @returns {Array} lista de habilidades (vazia se não encontrado)
 */
export function getMvpSkillsByClass(classNameOrId) {
    if (!_canonData) {
        console.warn('[canonLoader] getMvpSkillsByClass chamado antes de loadCanonData()');
        return [];
    }
    // Resolve nome PT-BR a partir do ID se necessário
    const ptbr = CLASS_MAP_ID_TO_PTBR[classNameOrId] || classNameOrId;
    return _canonData.skillsMvp[ptbr] || [];
}

/**
 * Reseta o cache e a promise de boot (útil para testes).
 */
export function _resetCanonCache() {
    _canonData = null;
    _canonBootPromise = null;
}

// ---------------------------------------------------------------------------
// Fase 2 — API pública: espécies, linhas evolutivas, progressão por nível
// ---------------------------------------------------------------------------

/**
 * Retorna os dados canônicos de uma espécie.
 * Divergência: não há mapeamento automático entre IDs runtime (ex: m_luma)
 * e IDs canônicos (ex: moonquill). A ponte deve ser feita pelo runtime quando necessário.
 *
 * @param {string} speciesId - ID canônico (ex: 'shieldhorn') ou nome PT-BR (ex: 'Escudicorno')
 * @returns {Object|null}
 */
export function getSpeciesData(speciesId) {
    if (!_canonData) {
        console.warn('[canonLoader] getSpeciesData chamado antes de loadCanonData()');
        return null;
    }
    const { byId, byPtbr } = _canonData.species;
    return byId[speciesId] || byPtbr[speciesId] || null;
}

/**
 * Retorna a linha evolutiva de uma espécie ou linha.
 * Aceita: line_id (ex: 'shieldhorn_line'), species_id de qualquer estágio, ou class_id.
 *
 * @param {string} idOrLineId
 * @returns {Object|null}
 */
export function getEvolutionLine(idOrLineId) {
    if (!_canonData) {
        console.warn('[canonLoader] getEvolutionLine chamado antes de loadCanonData()');
        return null;
    }
    const { byLineId, byClassId, bySpeciesId } = _canonData.evolutionLines;
    return byLineId[idOrLineId] || bySpeciesId[idOrLineId] || byClassId[idOrLineId] || null;
}

/**
 * Retorna os marcos de desbloqueio para um nível específico.
 * Cobertura: levels 1-30 (Fase 2). Níveis 31-100 retornam array vazio.
 *
 * @param {number} level
 * @returns {string[]} lista de unlocks (ex: ['slot_1', 'slot_2'])
 */
export function getLevelMilestones(level) {
    if (!_canonData) {
        console.warn('[canonLoader] getLevelMilestones chamado antes de loadCanonData()');
        return [];
    }
    return _canonData.levelProgression.byLevel[level] || [];
}

/**
 * Retorna todos os marcos de progressão indexados por nível.
 * @returns {Object} { [level]: string[] }
 */
export function getAllLevelMilestones() {
    if (!_canonData) {
        console.warn('[canonLoader] getAllLevelMilestones chamado antes de loadCanonData()');
        return {};
    }
    return _canonData.levelProgression.byLevel;
}

/**
 * Retorna a regra de crescimento de stats para uma classe canônica.
 * @param {string} classIdOrPtbr - ID canônico (ex: 'warrior') ou nome PT-BR (ex: 'Guerreiro')
 * @returns {string|null} descrição textual da regra de crescimento
 */
export function getClassGrowthRule(classIdOrPtbr) {
    if (!_canonData) {
        console.warn('[canonLoader] getClassGrowthRule chamado antes de loadCanonData()');
        return null;
    }
    const id = CLASS_MAP_PTBR_TO_ID[classIdOrPtbr] || classIdOrPtbr;
    return _canonData.levelProgression.classGrowthRules[id] || null;
}

/**
 * Retorna os offsets de stats de uma espécie aplicados sobre os stats base da classe.
 * Os offsets são aditivos (ex: hp+1, atk-1).
 *
 * Uso consultivo: o motor atual não aplica esses offsets automaticamente.
 * A integração completa está reservada para Fase 3+.
 *
 * @param {string} speciesId - ID canônico ou nome PT-BR da espécie
 * @returns {{ hp: number, atk: number, def: number, ene: number, agi: number }|null}
 */
export function getSpeciesStatOffsets(speciesId) {
    const sp = getSpeciesData(speciesId);
    if (!sp) return null;
    return sp.base_stat_offsets || null;
}

/**
 * Converte nome PT-BR para ID canônico.
 * @param {string} ptbr
 * @returns {string|null}
 */
export function classIdFromPtbr(ptbr) {
    return CLASS_MAP_PTBR_TO_ID[ptbr] || null;
}

/**
 * Converte ID canônico para nome PT-BR.
 * @param {string} id
 * @returns {string|null}
 */
export function classPtbrFromId(id) {
    return CLASS_MAP_ID_TO_PTBR[id] || null;
}
