/**
 * QUESTS INTEGRITY TESTS
 *
 * Valida integridade dos dados de quests e drops.
 * Cobertura:
 *  - QUESTS.csv: esquema, campos obrigatórios, referências
 *  - questSystem.js: dados JS, funções de acesso
 *  - Coerência de progressão: chain, recompensas crescentes
 *  - Biomas cobertos: todos os 8 locais têm pelo menos 1 quest
 */

import { describe, it, expect } from 'vitest';
import {
    parseCSV,
    loadMonstersJson,
    loadLocationsJson,
    buildValidItemIds
} from './helpers.js';
import {
    QUESTS_DATA,
    QUEST_OBJECTIVE_TYPES,
    getQuest,
    getQuestsByLocation,
    isQuestAvailable,
    getNextQuest,
    getQuestChain
} from '../js/data/questSystem.js';

const VALID_OBJECTIVE_TYPES = new Set(Object.values(QUEST_OBJECTIVE_TYPES));
const TOTAL_QUESTS = 16;

// ── QUESTS.csv — Estrutura ─────────────────────────────────────────────────

describe('QUESTS.csv - Estrutura e Campos', () => {

    const quests = parseCSV('QUESTS.csv');

    it('deve ter 16 quests', () => {
        expect(quests.length).toBe(TOTAL_QUESTS);
    });

    it('IDs de quests não devem estar duplicados', () => {
        const ids = quests.map(q => q.quest_id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('todos os IDs devem seguir o padrão QST_XXX', () => {
        for (const q of quests) {
            expect(
                q.quest_id.startsWith('QST_'),
                `"${q.quest_id}" não segue padrão QST_`
            ).toBe(true);
        }
    });

    it('todos os quests devem ter campos obrigatórios não vazios', () => {
        const required = ['quest_id', 'nome', 'descricao', 'local_id',
                          'tipo_objetivo', 'objetivo_qtd', 'reward_xp', 'reward_gold'];
        for (const q of quests) {
            for (const field of required) {
                expect(
                    q[field],
                    `${q.quest_id} falta campo "${field}"`
                ).toBeTruthy();
            }
        }
    });

    it('tipo_objetivo deve ser valor válido', () => {
        for (const q of quests) {
            expect(
                VALID_OBJECTIVE_TYPES.has(q.tipo_objetivo),
                `${q.quest_id}: tipo_objetivo="${q.tipo_objetivo}" inválido`
            ).toBe(true);
        }
    });

    it('objetivo_qtd deve ser inteiro positivo', () => {
        for (const q of quests) {
            const qtd = Number(q.objetivo_qtd);
            expect(
                Number.isInteger(qtd) && qtd >= 1,
                `${q.quest_id}: objetivo_qtd="${q.objetivo_qtd}" deve ser inteiro >= 1`
            ).toBe(true);
        }
    });

    it('reward_xp e reward_gold devem ser números positivos', () => {
        for (const q of quests) {
            expect(
                Number(q.reward_xp) > 0,
                `${q.quest_id}: reward_xp deve ser positivo`
            ).toBe(true);
            expect(
                Number(q.reward_gold) > 0,
                `${q.quest_id}: reward_gold deve ser positivo`
            ).toBe(true);
        }
    });
});

// ── QUESTS.csv — Referências ───────────────────────────────────────────────

describe('QUESTS.csv - Referências Válidas', () => {

    const quests = parseCSV('QUESTS.csv');
    const questIds = new Set(quests.map(q => q.quest_id));
    const monData = loadMonstersJson();
    const monsterIds = new Set(monData.monsters.map(m => m.id));
    const locData = loadLocationsJson();
    const validLocIds = new Set(locData.locations.map(l => l.id));
    const validItemIds = buildValidItemIds();

    it('local_id deve referenciar local existente', () => {
        for (const q of quests) {
            expect(
                validLocIds.has(q.local_id),
                `${q.quest_id}: local_id="${q.local_id}" não existe em locations.json`
            ).toBe(true);
        }
    });

    it('pre_req deve referenciar quest existente (quando preenchido)', () => {
        for (const q of quests) {
            if (q.pre_req) {
                expect(
                    questIds.has(q.pre_req),
                    `${q.quest_id}: pre_req="${q.pre_req}" não existe`
                ).toBe(true);
            }
        }
    });

    it('next_quest_id deve referenciar quest existente (quando preenchido)', () => {
        for (const q of quests) {
            if (q.next_quest_id) {
                expect(
                    questIds.has(q.next_quest_id),
                    `${q.quest_id}: next_quest_id="${q.next_quest_id}" não existe`
                ).toBe(true);
            }
        }
    });

    it('objetivo_monster_id deve referenciar monstro existente (quando preenchido)', () => {
        for (const q of quests) {
            if (q.objetivo_monster_id) {
                expect(
                    monsterIds.has(q.objetivo_monster_id),
                    `${q.quest_id}: objetivo_monster_id="${q.objetivo_monster_id}" não existe no catálogo`
                ).toBe(true);
            }
        }
    });

    it('reward_item_id deve referenciar item válido (quando preenchido)', () => {
        for (const q of quests) {
            if (q.reward_item_id) {
                expect(
                    validItemIds.has(q.reward_item_id),
                    `${q.quest_id}: reward_item_id="${q.reward_item_id}" não é item válido`
                ).toBe(true);
            }
        }
    });

    it('quests derrotar_boss devem ter objetivo_monster_id preenchido', () => {
        for (const q of quests) {
            if (q.tipo_objetivo === 'derrotar_boss') {
                expect(
                    q.objetivo_monster_id,
                    `${q.quest_id}: tipo derrotar_boss requer objetivo_monster_id`
                ).toBeTruthy();
            }
        }
    });

    it('quests capturar específico devem ter objetivo_monster_id no catálogo', () => {
        for (const q of quests) {
            if (q.tipo_objetivo === 'capturar' && q.objetivo_monster_id) {
                expect(
                    monsterIds.has(q.objetivo_monster_id),
                    `${q.quest_id}: monstro de captura "${q.objetivo_monster_id}" não existe`
                ).toBe(true);
            }
        }
    });
});

// ── QUESTS.csv — Coerência de Progressão ──────────────────────────────────

describe('QUESTS.csv - Progressão e Cobertura de Biomas', () => {

    const quests = parseCSV('QUESTS.csv');
    const locData = loadLocationsJson();
    const allLocIds = new Set(locData.locations.map(l => l.id));
    const questsByLoc = {};
    for (const q of quests) {
        questsByLoc[q.local_id] = questsByLoc[q.local_id] || [];
        questsByLoc[q.local_id].push(q);
    }

    it('todos os 8 biomas devem ter pelo menos 1 quest', () => {
        for (const locId of allLocIds) {
            expect(
                (questsByLoc[locId] || []).length,
                `${locId} não tem nenhuma quest`
            ).toBeGreaterThanOrEqual(1);
        }
    });

    it('LOC_001 (tutorial) deve ter pelo menos 2 quests', () => {
        expect((questsByLoc['LOC_001'] || []).length).toBeGreaterThanOrEqual(2);
    });

    it('recompensas de XP devem crescer da campina para a arena', () => {
        // QST_001 (tutorial) deve ter XP menor que QST_016 (boss final)
        const q001 = quests.find(q => q.quest_id === 'QST_001');
        const q016 = quests.find(q => q.quest_id === 'QST_016');
        expect(Number(q016.reward_xp)).toBeGreaterThan(Number(q001.reward_xp));
    });

    it('bosses devem ter reward_xp maior que quests básicas do mesmo bioma', () => {
        const bossQuests = quests.filter(q => q.tipo_objetivo === 'derrotar_boss');
        const wildQuests = quests.filter(q => q.tipo_objetivo === 'derrotar_wild');

        // Só testar se existirem quests selvagens para calcular a média
        if (wildQuests.length === 0) return;

        // Todos os bosses devem ter XP > média das quests selvagens
        const wildAvgXp = wildQuests.reduce((sum, q) => sum + Number(q.reward_xp), 0) / wildQuests.length;
        for (const bq of bossQuests) {
            expect(
                Number(bq.reward_xp),
                `Boss ${bq.quest_id} deveria ter XP maior que quests selvagens`
            ).toBeGreaterThan(wildAvgXp);
        }
    });

    it('deve haver pelo menos 4 quests de tipo derrotar_boss (8 biomas = 4 bosses)', () => {
        const bossQuests = quests.filter(q => q.tipo_objetivo === 'derrotar_boss');
        expect(bossQuests.length).toBeGreaterThanOrEqual(4);
    });

    it('não deve haver ciclos de pré-requisito (sem deps circulares)', () => {
        const questIds = quests.map(q => q.quest_id);
        const preReqMap = {};
        for (const q of quests) {
            preReqMap[q.quest_id] = q.pre_req || null;
        }

        function hasCycle(questId, visited = new Set()) {
            if (visited.has(questId)) return true;
            visited.add(questId);
            const preReq = preReqMap[questId];
            if (preReq) return hasCycle(preReq, visited);
            return false;
        }

        for (const id of questIds) {
            expect(
                hasCycle(id),
                `Quest "${id}" tem ciclo de pré-requisito`
            ).toBe(false);
        }
    });

    it('QST_001 não deve ter pré-requisito (primeira quest da cadeia)', () => {
        const q001 = quests.find(q => q.quest_id === 'QST_001');
        expect(q001.pre_req).toBeFalsy();
    });

    it('QST_016 (boss final) deve ter maior reward_xp de todas', () => {
        const q016 = quests.find(q => q.quest_id === 'QST_016');
        const maxXp = Math.max(...quests.map(q => Number(q.reward_xp)));
        expect(Number(q016.reward_xp)).toBe(maxXp);
    });
});

// ── questSystem.js — Dados e Funções ──────────────────────────────────────

describe('questSystem.js - Dados e Funções', () => {

    it('QUESTS_DATA deve ter 16 quests', () => {
        expect(Object.keys(QUESTS_DATA).length).toBe(TOTAL_QUESTS);
    });

    it('todos os IDs em QUESTS_DATA devem ser acessíveis por getQuest()', () => {
        for (const id of Object.keys(QUESTS_DATA)) {
            const q = getQuest(id);
            expect(q).not.toBeNull();
            expect(q.id).toBe(id);
        }
    });

    it('getQuest() deve retornar null para ID inexistente', () => {
        expect(getQuest('QST_999')).toBeNull();
        expect(getQuest(null)).toBeNull();
        expect(getQuest('')).toBeNull();
    });

    it('getQuestsByLocation() deve retornar array de quests do local', () => {
        const loc001 = getQuestsByLocation('LOC_001');
        expect(Array.isArray(loc001)).toBe(true);
        expect(loc001.length).toBeGreaterThanOrEqual(2);
        for (const q of loc001) {
            expect(q.localId).toBe('LOC_001');
        }
    });

    it('getQuestsByLocation() deve retornar array vazio para local sem quests', () => {
        const result = getQuestsByLocation('LOC_999');
        expect(result).toEqual([]);
    });

    it('isQuestAvailable() deve retornar true para QST_001 (sem pré-req)', () => {
        expect(isQuestAvailable('QST_001', [])).toBe(true);
    });

    it('isQuestAvailable() deve retornar false se pré-req não completado', () => {
        expect(isQuestAvailable('QST_002', [])).toBe(false);
    });

    it('isQuestAvailable() deve retornar true se pré-req completado', () => {
        expect(isQuestAvailable('QST_002', ['QST_001'])).toBe(true);
    });

    it('isQuestAvailable() deve retornar false para ID inexistente', () => {
        expect(isQuestAvailable('QST_999', ['QST_001'])).toBe(false);
    });

    it('getNextQuest() deve retornar próxima quest da cadeia', () => {
        const next = getNextQuest('QST_001');
        expect(next).not.toBeNull();
        expect(next.id).toBe('QST_002');
    });

    it('getNextQuest() deve retornar null para quest final', () => {
        expect(getNextQuest('QST_016')).toBeNull();
    });

    it('getNextQuest() deve retornar null para ID inexistente', () => {
        expect(getNextQuest('QST_999')).toBeNull();
    });

    it('getQuestChain() deve retornar todas as 16 quests em ordem válida', () => {
        const chain = getQuestChain();
        expect(chain.length).toBe(TOTAL_QUESTS);

        // Verificar que cada quest vem depois do seu pré-requisito
        const seen = new Set();
        for (const q of chain) {
            if (q.preReq) {
                expect(
                    seen.has(q.preReq),
                    `Quest "${q.id}" aparece antes do pré-req "${q.preReq}" na cadeia`
                ).toBe(true);
            }
            seen.add(q.id);
        }
    });

    it('QUEST_OBJECTIVE_TYPES deve ter os 4 tipos esperados', () => {
        const types = Object.values(QUEST_OBJECTIVE_TYPES);
        expect(types).toContain('derrotar_wild');
        expect(types).toContain('capturar');
        expect(types).toContain('derrotar_treinador');
        expect(types).toContain('derrotar_boss');
    });
});

// ── questSystem.js ↔ QUESTS.csv — Consistência Cruzada ────────────────────

describe('questSystem.js ↔ QUESTS.csv - Consistência', () => {

    const quests = parseCSV('QUESTS.csv');

    it('QUESTS_DATA deve ter os mesmos IDs que QUESTS.csv', () => {
        const csvIds = new Set(quests.map(q => q.quest_id));
        const jsIds = new Set(Object.keys(QUESTS_DATA));
        expect(jsIds).toEqual(csvIds);
    });

    it('reward_xp do JS deve coincidir com CSV', () => {
        for (const q of quests) {
            const jsQuest = QUESTS_DATA[q.quest_id];
            expect(
                jsQuest.rewardXp,
                `${q.quest_id}: rewardXp JS (${jsQuest.rewardXp}) ≠ CSV (${q.reward_xp})`
            ).toBe(Number(q.reward_xp));
        }
    });

    it('tipo_objetivo do JS deve coincidir com CSV', () => {
        for (const q of quests) {
            const jsQuest = QUESTS_DATA[q.quest_id];
            expect(
                jsQuest.tipoObjetivo,
                `${q.quest_id}: tipoObjetivo JS ≠ CSV`
            ).toBe(q.tipo_objetivo);
        }
    });

    it('local_id do JS deve coincidir com CSV', () => {
        for (const q of quests) {
            const jsQuest = QUESTS_DATA[q.quest_id];
            expect(
                jsQuest.localId,
                `${q.quest_id}: localId JS ≠ CSV`
            ).toBe(q.local_id);
        }
    });
});
