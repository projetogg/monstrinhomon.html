/**
 * CATALOG MIGRATION — Fase K / Rebase Fase 1
 *
 * Corrige instâncias de monstros salvas com templateIds pré-rebase (Fase 1)
 * que agora apontam para espécies diferentes no catálogo atual.
 *
 * PROBLEMA:
 *   Após o rebase da Fase 1, o catálogo reaproveitou IDs numéricos para novas
 *   famílias. Instâncias salvas com o templateId antigo (ex.: MON_010 = linha
 *   Ferrozimon) agora resolvem para uma espécie completamente diferente no
 *   catálogo novo (ex.: MON_010 = Gatunamon/Caçador).
 *
 * SOLUÇÃO:
 *   Migração explícita e versionada (saveVersion 1 → 2).
 *   1. Remapear templateId de instâncias legadas usando CATALOG_REBASE_MAP.
 *   2. Reconstruir campos derivados (name, class, rarity, emoji, evolvesTo,
 *      evolvesAt, canonSpeciesId) a partir dos dados embutidos do catálogo novo.
 *   3. Reconciliar evolução: avançar pelo chain evolutivo se level já ultrapassou
 *      thresholds (estratégia B — reconciliar no estágio correto para o nível,
 *      preservando HP e stats existentes).
 *   4. Reconstruir partyDex.entries e monstrodex a partir da posse real.
 *
 * IDEMPOTÊNCIA:
 *   A migração é protegida por saveVersion. Uma vez aplicada (saveVersion >= 2),
 *   não é reexecutada. Funções individuais são seguras para chamadas múltiplas.
 *
 * ESCOPO:
 *   Módulo 100% puro — sem side effects, sem DOM, sem import de estado global.
 *   Todas as funções recebem dados via parâmetro.
 *
 * MÓDULO AUTORITATIVO:
 *   Este módulo é a fonte de verdade para o mapeamento de rebase da Fase 1.
 *   Qualquer outro mapeamento de IDs deve referenciar este arquivo.
 */

// ── Mapeamento de IDs legados → IDs canônicos atuais (Rebase Fase 1) ──────────
//
// CHAVE  = templateId antigo (pré-rebase, pode ainda existir em saves)
// VALOR  = templateId novo  (catálogo atual, monsters.json v1)
//
// Linhas mapeadas:
//   MON_010x → MON_001–MON_004  (Ferrozimon / Guerreiro)
//   MON_011x → MON_005–MON_008  (Dinomon / Bardo)
//   MON_013x → MON_009–MON_012  (Miaumon / Caçador)
//   MON_014x → MON_013–MON_016  (Lagartomon / Mago)
//   MON_012x → MON_017–MON_020  (Luvursomon / Animalista)
//
// ATENÇÃO: os novos IDs MON_009–MON_016 coincidem com antigas chaves de outras
// linhas. A migração é segura porque é executada UMA ÚNICA VEZ (versão 2) —
// após aplicada, o save não contém mais chaves legadas.
export const CATALOG_REBASE_MAP = {
    // Linha Ferrozimon (antigo MON_010x → novo MON_001–004)
    'MON_010':  'MON_001',
    'MON_010B': 'MON_002',
    'MON_010C': 'MON_003',
    'MON_010D': 'MON_004',

    // Linha Dinomon (antigo MON_011x → novo MON_005–008)
    'MON_011':  'MON_005',
    'MON_011B': 'MON_006',
    'MON_011C': 'MON_007',
    'MON_011D': 'MON_008',

    // Linha Miaumon (antigo MON_013x → novo MON_009–012)
    'MON_013':  'MON_009',
    'MON_013B': 'MON_010',
    'MON_013C': 'MON_011',
    'MON_013D': 'MON_012',

    // Linha Lagartomon (antigo MON_014x → novo MON_013–016)
    'MON_014':  'MON_013',
    'MON_014B': 'MON_014',
    'MON_014C': 'MON_015',
    'MON_014D': 'MON_016',

    // Linha Luvursomon (antigo MON_012x → novo MON_017–020)
    'MON_012':  'MON_017',
    'MON_012B': 'MON_018',
    'MON_012C': 'MON_019',
    'MON_012D': 'MON_020',
};

// ── Dados mínimos do catálogo para os 20 IDs migrados ────────────────────────
//
// Embutidos aqui para que a migração possa rodar SINCRONAMENTE durante o load,
// antes da carga assíncrona de monsters.json.
//
// Campos: name, class, rarity, emoji, evolvesTo (null = estágio final), evolvesAt
//
// Fonte: data/monsters.json versão 1 (inspecionada em 2026-01-25).
// Se monsters.json for atualizado, manter este bloco em sincronia.
const MIGRATION_CATALOG = {
    // ── Linha Ferrozimon (Guerreiro) ─────────────────────────────────────────
    'MON_001': { name: 'Ferrozimon',      class: 'Guerreiro', rarity: 'Comum',   emoji: '⚔️', evolvesTo: 'MON_002', evolvesAt: 12 },
    'MON_002': { name: 'Cavalheiromon',   class: 'Guerreiro', rarity: 'Incomum', emoji: '🗡️', evolvesTo: 'MON_003', evolvesAt: 25 },
    'MON_003': { name: 'Kinguespinhomon', class: 'Guerreiro', rarity: 'Raro',    emoji: '🛡️', evolvesTo: 'MON_004', evolvesAt: 45 },
    'MON_004': { name: 'Arconouricomon',  class: 'Guerreiro', rarity: 'Místico', emoji: '👑', evolvesTo: null,      evolvesAt: null },

    // ── Linha Dinomon (Bardo) ────────────────────────────────────────────────
    'MON_005': { name: 'Dinomon',           class: 'Bardo', rarity: 'Comum',   emoji: '🎵', evolvesTo: 'MON_006', evolvesAt: 12 },
    'MON_006': { name: 'Guitarapitormon',   class: 'Bardo', rarity: 'Incomum', emoji: '🎸', evolvesTo: 'MON_007', evolvesAt: 25 },
    'MON_007': { name: 'TRockmon',          class: 'Bardo', rarity: 'Raro',    emoji: '🎹', evolvesTo: 'MON_008', evolvesAt: 45 },
    'MON_008': { name: 'Giganotometalmon',  class: 'Bardo', rarity: 'Místico', emoji: '🎻', evolvesTo: null,      evolvesAt: null },

    // ── Linha Miaumon (Caçador) ──────────────────────────────────────────────
    'MON_009': { name: 'Miaumon',     class: 'Caçador', rarity: 'Comum',   emoji: '🐱', evolvesTo: 'MON_010', evolvesAt: 12 },
    'MON_010': { name: 'Gatunamon',   class: 'Caçador', rarity: 'Incomum', emoji: '🐈', evolvesTo: 'MON_011', evolvesAt: 25 },
    'MON_011': { name: 'Felinomon',   class: 'Caçador', rarity: 'Raro',    emoji: '🐆', evolvesTo: 'MON_012', evolvesAt: 45 },
    'MON_012': { name: 'Panterezamon',class: 'Caçador', rarity: 'Místico', emoji: '🐅', evolvesTo: null,      evolvesAt: null },

    // ── Linha Lagartomon (Mago) ──────────────────────────────────────────────
    'MON_013': { name: 'Lagartomon',    class: 'Mago', rarity: 'Comum',   emoji: '🦎', evolvesTo: 'MON_014', evolvesAt: 12 },
    'MON_014': { name: 'Salamandromon', class: 'Mago', rarity: 'Incomum', emoji: '🔥', evolvesTo: 'MON_015', evolvesAt: 25 },
    'MON_015': { name: 'Dracoflamemon', class: 'Mago', rarity: 'Raro',    emoji: '🐉', evolvesTo: 'MON_016', evolvesAt: 45 },
    'MON_016': { name: 'Wizardragomon', class: 'Mago', rarity: 'Místico', emoji: '✨', evolvesTo: null,      evolvesAt: null },

    // ── Linha Luvursomon (Animalista) ────────────────────────────────────────
    'MON_017': { name: 'Luvursomon', class: 'Animalista', rarity: 'Comum',   emoji: '🐻', evolvesTo: 'MON_018', evolvesAt: 12 },
    'MON_018': { name: 'Manoplamon', class: 'Animalista', rarity: 'Incomum', emoji: '🐾', evolvesTo: 'MON_019', evolvesAt: 25 },
    'MON_019': { name: 'BestBearmon',class: 'Animalista', rarity: 'Raro',    emoji: '🦁', evolvesTo: 'MON_020', evolvesAt: 45 },
    'MON_020': { name: 'Ursauramon',  class: 'Animalista', rarity: 'Místico', emoji: '🔱', evolvesTo: null,      evolvesAt: null },
};

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Retorna o templateId canônico de uma instância.
 * Suporta os campos legados monsterId, baseId, idBase por compatibilidade.
 * @param {Object} mon
 * @returns {string|null}
 */
function getInstanceTemplateId(mon) {
    if (!mon || typeof mon !== 'object') return null;
    return mon.templateId || mon.monsterId || mon.baseId || mon.idBase || null;
}

/**
 * Verifica se um ID pertence ao mapeamento legado (é uma chave de CATALOG_REBASE_MAP).
 * @param {string|null} id
 * @returns {boolean}
 */
export function isLegacyTemplateId(id) {
    return typeof id === 'string' && Object.prototype.hasOwnProperty.call(CATALOG_REBASE_MAP, id);
}

// ── Migração de instância individual ─────────────────────────────────────────

/**
 * Migra uma instância de monstro in-place:
 *   1. Remapeia templateId usando CATALOG_REBASE_MAP.
 *   2. Atualiza name, class, rarity, emoji, evolvesTo, evolvesAt a partir de
 *      MIGRATION_CATALOG (dados embutidos do catálogo novo).
 *   3. Reconcilia evolução (Estratégia B): avança pelo chain evolutivo até o
 *      estágio correto para o level atual, SEM recalcular HP/stats.
 *
 * Se o templateId NÃO for legado, a instância não é alterada.
 *
 * @param {Object} monster - Instância de monstrinho (mutada in-place)
 * @returns {{ migrated: boolean, oldId: string|null, finalId: string|null, notes: string[] }}
 */
export function migrateMonsterInstance(monster) {
    const notes = [];

    if (!monster || typeof monster !== 'object') {
        return { migrated: false, oldId: null, finalId: null, notes: ['Instância inválida'] };
    }

    const rawId = getInstanceTemplateId(monster);
    if (!rawId) {
        return { migrated: false, oldId: null, finalId: null, notes: ['templateId ausente'] };
    }

    const newId = CATALOG_REBASE_MAP[rawId];
    if (!newId) {
        // Não é um ID legado — sem migração necessária
        return { migrated: false, oldId: rawId, finalId: rawId, notes: [] };
    }

    let currentId   = newId;
    let currentData = MIGRATION_CATALOG[newId];

    if (!currentData) {
        notes.push(`[AVISO] Template ${newId} não encontrado em MIGRATION_CATALOG; migração de ID apenas`);
        monster.templateId = newId;
        delete monster.monsterId;
        delete monster.baseId;
        delete monster.idBase;
        return { migrated: true, oldId: rawId, finalId: newId, notes };
    }

    // ── Passo 1: aplicar dados do estágio inicial mapeado ────────────────────
    monster.templateId    = newId;
    delete monster.monsterId;
    delete monster.baseId;
    delete monster.idBase;

    monster.name          = currentData.name;
    monster.class         = currentData.class;
    monster.rarity        = currentData.rarity;
    monster.emoji         = currentData.emoji;
    monster.evolvesTo     = currentData.evolvesTo  ?? null;
    monster.evolvesAt     = currentData.evolvesAt  ?? null;

    notes.push(`Migrado: ${rawId} → ${newId}`);

    // ── Passo 2: reconciliar evolução (Estratégia B) ─────────────────────────
    // Avança pelo chain até encontrar o estágio correto para o level atual.
    // HP e stats numéricos são PRESERVADOS (não recalculados).
    const level = Math.max(1, Number(monster.level) || 1);

    while (currentData.evolvesTo && currentData.evolvesAt != null) {
        if (level < currentData.evolvesAt) break;

        const nextId   = currentData.evolvesTo;
        const nextData = MIGRATION_CATALOG[nextId];
        if (!nextData) break; // chain interrompida — parar aqui

        currentId   = nextId;
        currentData = nextData;

        monster.templateId = currentId;
        monster.name       = currentData.name;
        monster.class      = currentData.class;
        monster.rarity     = currentData.rarity;
        monster.emoji      = currentData.emoji;
        monster.evolvesTo  = currentData.evolvesTo  ?? null;
        monster.evolvesAt  = currentData.evolvesAt  ?? null;

        notes.push(`Evolução reconciliada → ${currentId} (level ${level} >= ${currentData.evolvesAt ?? '—'})`);
    }

    // ── Passo 3: atualizar canonSpeciesId se presente ────────────────────────
    if (monster.canonSpeciesId !== undefined) {
        monster.canonSpeciesId = currentId;
    }

    return { migrated: true, oldId: rawId, finalId: currentId, notes };
}

// ── Iteração sobre todas as instâncias do estado ──────────────────────────────

/**
 * Coleta todas as instâncias de monstros encontradas no estado do jogo.
 * Percorre: players[].team, players[].box, sharedBox[].monster, monsters[].
 *
 * @param {Object} state - GameState
 * @returns {Object[]} Array de referências às instâncias (objetos originais)
 */
export function collectAllMonsterInstances(state) {
    if (!state || typeof state !== 'object') return [];

    const instances = [];

    // players[].team e players[].box
    if (Array.isArray(state.players)) {
        for (const player of state.players) {
            if (!player) continue;
            if (Array.isArray(player.team)) {
                for (const mon of player.team) { if (mon) instances.push(mon); }
            }
            if (Array.isArray(player.box)) {
                for (const mon of player.box) { if (mon) instances.push(mon); }
            }
        }
    }

    // sharedBox[].monster
    if (Array.isArray(state.sharedBox)) {
        for (const slot of state.sharedBox) {
            if (slot && slot.monster) instances.push(slot.monster);
        }
    }

    // monsters[] (lista global legada)
    if (Array.isArray(state.monsters)) {
        for (const mon of state.monsters) { if (mon) instances.push(mon); }
    }

    // currentEncounter.wildMonster (encontro salvo)
    if (state.currentEncounter && state.currentEncounter.wildMonster) {
        instances.push(state.currentEncounter.wildMonster);
    }

    return instances;
}

/**
 * Migra todas as instâncias de monstros do estado.
 * Retorna um relatório com contagens e detalhes.
 *
 * @param {Object} state - GameState (mutado in-place)
 * @returns {{ total: number, migrated: number, skipped: number, details: object[] }}
 */
export function migrateAllInstances(state) {
    const instances = collectAllMonsterInstances(state);
    let migratedCount = 0;
    let skippedCount  = 0;
    const details = [];

    for (const mon of instances) {
        const result = migrateMonsterInstance(mon);
        if (result.migrated) {
            migratedCount++;
            details.push(result);
        } else {
            skippedCount++;
        }
    }

    return { total: instances.length, migrated: migratedCount, skipped: skippedCount, details };
}

// ── Reconstrução da Dex a partir da posse real ────────────────────────────────

/**
 * Coleta todos os templateIds atualmente possuídos (team + box + sharedBox).
 * Apenas instâncias com templateId válido são contadas.
 * IDs legados remanescentes são mapeados para os novos (fallback seguro).
 *
 * @param {Object} state - GameState
 * @returns {Set<string>} Set de templateIds possuídos
 */
export function collectPossessedTemplateIds(state) {
    const owned = new Set();

    if (!state) return owned;

    if (Array.isArray(state.players)) {
        for (const player of state.players) {
            if (!player) continue;
            if (Array.isArray(player.team)) {
                for (const mon of player.team) {
                    const id = getInstanceTemplateId(mon);
                    if (id) owned.add(CATALOG_REBASE_MAP[id] ?? id);
                }
            }
            if (Array.isArray(player.box)) {
                for (const mon of player.box) {
                    const id = getInstanceTemplateId(mon);
                    if (id) owned.add(CATALOG_REBASE_MAP[id] ?? id);
                }
            }
        }
    }

    if (Array.isArray(state.sharedBox)) {
        for (const slot of state.sharedBox) {
            if (slot && slot.monster) {
                const id = getInstanceTemplateId(slot.monster);
                if (id) owned.add(CATALOG_REBASE_MAP[id] ?? id);
            }
        }
    }

    return owned;
}

/**
 * Reconstrói partyDex.entries e monstrodex a partir da posse real.
 *
 * Estratégia (fallback seguro):
 *   - Entradas legadas (IDs que fazem parte do CATALOG_REBASE_MAP) são removidas.
 *   - Para cada monstro possuído: marcado como seen=true, captured=true.
 *   - Entradas de IDs não-legados que já existiam (possivelmente corretas) são
 *     preservadas, exceto se o ID for legado.
 *   - monstrodex.seen e monstrodex.captured são reconstruídos para incluir
 *     todos os IDs possuídos (remoção de legados, adição dos novos).
 *
 * @param {Object} state - GameState (mutado in-place)
 * @returns {{ removedLegacy: string[], addedNew: string[] }}
 */
export function rebuildDexFromPossession(state) {
    if (!state) return { removedLegacy: [], addedNew: [] };

    const ownedIds  = collectPossessedTemplateIds(state);
    const legacySet = new Set(Object.keys(CATALOG_REBASE_MAP));
    const removed   = [];
    const added     = [];

    // ── partyDex ─────────────────────────────────────────────────────────────
    if (!state.partyDex) state.partyDex = { entries: {}, meta: { lastMilestoneAwarded: 0 } };
    if (!state.partyDex.entries) state.partyDex.entries = {};

    // Remover entradas com IDs legados da partyDex
    for (const key of Object.keys(state.partyDex.entries)) {
        if (legacySet.has(key)) {
            delete state.partyDex.entries[key];
            removed.push(key);
        }
    }

    // Adicionar/garantir entradas para todos os IDs possuídos
    for (const id of ownedIds) {
        const existing = state.partyDex.entries[id];
        if (!existing) {
            state.partyDex.entries[id] = { seen: true, captured: true };
            added.push(id);
        } else {
            // Garantir captured=true para IDs que o jogador possui
            existing.seen     = true;
            existing.captured = true;
        }
    }

    // ── monstrodex (sistema legado) ───────────────────────────────────────────
    if (!state.monstrodex) state.monstrodex = { seen: [], captured: [] };
    if (!Array.isArray(state.monstrodex.seen))     state.monstrodex.seen     = [];
    if (!Array.isArray(state.monstrodex.captured)) state.monstrodex.captured = [];

    // Remover IDs legados de seen e captured
    state.monstrodex.seen     = state.monstrodex.seen.filter(id     => !legacySet.has(id));
    state.monstrodex.captured = state.monstrodex.captured.filter(id => !legacySet.has(id));

    // Adicionar IDs possuídos que ainda não estejam nos arrays
    for (const id of ownedIds) {
        if (!state.monstrodex.seen.includes(id))     state.monstrodex.seen.push(id);
        if (!state.monstrodex.captured.includes(id)) state.monstrodex.captured.push(id);
    }

    return { removedLegacy: removed, addedNew: added };
}

// ── Ponto de entrada principal ────────────────────────────────────────────────

/**
 * Aplica a migração completa de catálogo ao estado do jogo.
 *
 * Etapas:
 *   1. migrateAllInstances    — remapeia templateIds e reconstrói campos derivados
 *   2. rebuildDexFromPossession — reconstrói Dex a partir da posse real
 *
 * NÃO verifica saveVersion — o chamador (migrateSaveIfNeeded) é responsável pelo
 * controle de versão. Esta função é idempotente para saves já migrados porque:
 *   - IDs canônicos atuais não estão em CATALOG_REBASE_MAP
 *   - Dex rebuild é idempotente
 *
 * @param {Object} state - GameState (mutado in-place)
 * @returns {{ instanceStats: object, dexStats: object, notes: string[] }}
 */
export function applyCatalogMigration(state) {
    const notes = [];

    if (!state || typeof state !== 'object') {
        notes.push('[CatalogMigration] Estado inválido — migração ignorada');
        return { instanceStats: null, dexStats: null, notes };
    }

    // Etapa 1: migrar instâncias
    const instanceStats = migrateAllInstances(state);
    notes.push(
        `[CatalogMigration] Instâncias: ${instanceStats.total} total, ` +
        `${instanceStats.migrated} migradas, ${instanceStats.skipped} sem alteração`
    );
    for (const d of instanceStats.details) {
        notes.push(`  ↳ ${d.notes.join(' | ')}`);
    }

    // Etapa 2: reconstruir Dex
    const dexStats = rebuildDexFromPossession(state);
    notes.push(
        `[CatalogMigration] Dex: ${dexStats.removedLegacy.length} entradas legadas removidas, ` +
        `${dexStats.addedNew.length} novas adicionadas`
    );

    return { instanceStats, dexStats, notes };
}
