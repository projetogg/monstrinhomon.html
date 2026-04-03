/**
 * SLOT UNLOCKS — Fase 5 de integração canônica
 *
 * Determina quais slots de habilidade estão desbloqueados para um nível dado.
 * Usa `design/canon/level_progression.json` via canonLoader como source of truth.
 * Fallback seguro: tabela hardcoded que espelha o mesmo JSON.
 *
 * O que este módulo FAZ:
 *  - Expõe `getUnlockedSlotsForLevel(level)` — função pura e testável
 *  - Expõe `getSlotUnlockTable()` — para observabilidade e debug
 *  - Expõe `SLOT_UNLOCK_SOURCE` — metadado de rastreabilidade
 *  - Reseta cache via `_resetSlotUnlockCache()` (testes)
 *
 * O que este módulo NÃO faz (reservado para fases futuras):
 *  - kit_swap (substituição de habilidades por slot)
 *  - migração total de skills.json
 *  - refactor do motor de combate
 *  - progressão completa de habilidades além dos slots
 *
 * DIVERGÊNCIAS DOCUMENTADAS:
 *  - O sistema legado usa `stage` (0-3) como gating de skills em getMonsterSkills().
 *    Este módulo usa `level` conforme a camada canônica. Os dois sistemas coexistem;
 *    `unlockedSkillSlots` é um metadado adicional na instância, não substitui o legado.
 *  - Levels 31-100 não têm entradas em level_progression.json (cobertura Fase 2: 1-30).
 *    Para esses níveis, o máximo de 4 slots é mantido (todos desbloqueados).
 *
 * ESTRUTURA DE DADOS (level_progression.json):
 *  { "levels_1_to_30": [{ "level": N, "unlocks": ["slot_1", ...] }] }
 *  Unlocks do tipo "slot_N" determinam o slotCount; outros tipos (ex: "slot_1_or_2_upgrade")
 *  são ignorados por este módulo (irrelevantes para contagem de slots).
 */

import { getAllLevelMilestones } from './canonLoader.js';

// ---------------------------------------------------------------------------
// Fallback hardcoded — espelha design/canon/level_progression.json (Fase 5)
// Atualizar aqui SE e SOMENTE SE o JSON mudar os thresholds de slot.
// ---------------------------------------------------------------------------
const SLOT_UNLOCK_FALLBACK = [
    { level: 1,  slotCount: 1 },
    { level: 5,  slotCount: 2 },
    { level: 15, slotCount: 3 },
    { level: 30, slotCount: 4 },
];

// Padrão que identifica unlocks de slot na progressão canônica (ex: "slot_1", "slot_4")
// Ignora variantes como "slot_1_or_2_upgrade" (underscores após o número)
const SLOT_UNLOCK_PATTERN = /^slot_(\d+)$/;

// Cache da tabela de desbloqueio (populado na primeira chamada, resetável em testes)
let _slotUnlockTable = null;

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/**
 * Constrói a tabela de desbloqueio a partir dos marcos canônicos indexados por nível.
 * Filtra apenas entries do tipo "slot_N" e os ordena por slotCount crescente.
 *
 * @param {Object} milestones - { [level]: string[] } vindo de getAllLevelMilestones()
 * @returns {Array<{ level: number, slotCount: number }>}
 */
function _buildSlotUnlockTable(milestones) {
    const entries = [];
    for (const [levelStr, unlocks] of Object.entries(milestones)) {
        const level = Number(levelStr);
        if (!Number.isFinite(level) || level < 1) continue;
        for (const unlock of (unlocks || [])) {
            const match = SLOT_UNLOCK_PATTERN.exec(unlock);
            if (match) {
                entries.push({ level, slotCount: Number(match[1]) });
            }
        }
    }
    // Ordena por slotCount (garante leitura correta em getUnlockedSlotsForLevel)
    entries.sort((a, b) => a.slotCount - b.slotCount);
    return entries;
}

/**
 * Retorna a tabela de desbloqueio de slots.
 * Tenta usar canonLoader; recorre ao fallback hardcoded se não disponível.
 *
 * @returns {Array<{ level: number, slotCount: number }>}
 */
function _getSlotTable() {
    if (_slotUnlockTable) return _slotUnlockTable;

    try {
        const milestones = getAllLevelMilestones();
        if (milestones && Object.keys(milestones).length > 0) {
            const table = _buildSlotUnlockTable(milestones);
            if (table.length > 0) {
                _slotUnlockTable = table;
                return _slotUnlockTable;
            }
        }
    } catch (_err) {
        // canonLoader não está pronto ainda — usar fallback
    }

    return SLOT_UNLOCK_FALLBACK;
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Retorna o número de slots de habilidade desbloqueados para um nível dado.
 *
 * Regra: um slot está desbloqueado quando o nível do monstrinho >= nível de desbloqueio.
 * Retorna o maior slotCount cujo level de desbloqueio <= nível atual.
 *
 * Cobertura canônica:
 *  - Nível  1 → 1 slot  (slot_1)
 *  - Nível  5 → 2 slots (slot_2)
 *  - Nível 15 → 3 slots (slot_3)
 *  - Nível 30 → 4 slots (slot_4)
 *  - Níveis 31-100 → 4 slots (máximo, sem entrada no JSON)
 *
 * Fallback seguro: retorna sempre pelo menos 1 (slot_1 nunca é negado).
 *
 * @param {number} level - Nível atual do monstrinho (1-100)
 * @returns {number} Número de slots desbloqueados (1-4)
 */
export function getUnlockedSlotsForLevel(level) {
    const lvl = Math.max(1, Number(level) || 0);
    const table = _getSlotTable();

    let unlocked = 1; // slot_1 sempre garantido como mínimo
    for (const entry of table) {
        if (entry.level <= lvl) {
            unlocked = Math.max(unlocked, entry.slotCount);
        }
    }

    return unlocked;
}

/**
 * Retorna a tabela de níveis de desbloqueio de slots para observabilidade.
 * Útil para UI, debug e preparação futura para kit_swap.
 *
 * @returns {Array<{ level: number, slotCount: number }>} Cópia ordenada da tabela
 */
export function getSlotUnlockTable() {
    return _getSlotTable().slice();
}

/**
 * Rastreabilidade: informa a origem dos dados de desbloqueio de slots.
 * Valor é o caminho do arquivo JSON de design que define os thresholds.
 */
export const SLOT_UNLOCK_SOURCE = 'design/canon/level_progression.json';

/**
 * Reseta o cache de tabela de slots (útil para testes que precisam
 * forçar reload após mock de canonLoader).
 */
export function _resetSlotUnlockCache() {
    _slotUnlockTable = null;
}
