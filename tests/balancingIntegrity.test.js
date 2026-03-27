/**
 * BALANCING INTEGRITY TESTS (UX Loop + Balanceamento Base)
 *
 * Protege a consistência mínima de:
 *  - Preços de itens (venda < compra, sem negativos)
 *  - Progressão de recompensas de quests (sem regressão severa)
 *  - Recompensas de quests referenciam itens existentes e não deprecados
 *  - Drop tables referenciam itens existentes
 *  - Chances de drop estão no intervalo [0, 1]
 */

import { describe, it, expect } from 'vitest';
import { parseCSV, loadItemsJson, buildValidItemIds } from './helpers.js';

// ── Dados ──────────────────────────────────────────────────────────────────

const questsCSV  = parseCSV('QUESTS.csv');
const dropsCSV   = parseCSV('DROPS.csv');
const itemsData  = loadItemsJson();
const validItems = buildValidItemIds();

/** Mapa item_id → definição completa */
const itemsById  = new Map(itemsData.items.map(i => [i.id, i]));

// ── Preços de Itens ────────────────────────────────────────────────────────

describe('Preços de Itens — Consistência', () => {

    it('todos os itens com preço de compra devem ter buy > 0', () => {
        for (const item of itemsData.items) {
            if (item.price?.buy !== undefined) {
                expect(item.price.buy, `${item.id}.price.buy deve ser > 0`).toBeGreaterThan(0);
            }
        }
    });

    it('todos os itens com preço de venda explícito devem ter sell < buy', () => {
        for (const item of itemsData.items) {
            const buy  = item.price?.buy;
            const sell = item.price?.sell;
            if (typeof buy === 'number' && typeof sell === 'number') {
                expect(sell, `${item.id}: sell (${sell}) deve ser < buy (${buy})`).toBeLessThan(buy);
            }
        }
    });

    it('itens curáveis devem ter heal_pct entre 0 e 1', () => {
        for (const item of itemsData.items) {
            if (item.type === 'heal' && item.heal_pct !== undefined) {
                expect(item.heal_pct, `${item.id}.heal_pct`).toBeGreaterThan(0);
                expect(item.heal_pct, `${item.id}.heal_pct`).toBeLessThanOrEqual(1);
            }
        }
    });

    it('itens de captura devem ter capture_bonus_pp >= 0', () => {
        for (const item of itemsData.items) {
            if (item.type === 'capture' && item.capture_bonus_pp !== undefined) {
                expect(item.capture_bonus_pp, `${item.id}.capture_bonus_pp`).toBeGreaterThanOrEqual(0);
            }
        }
    });
});

// ── Recompensas de Quests ──────────────────────────────────────────────────

describe('Recompensas de Quests — Validade e Progressão', () => {

    it('QST_001 não deve usar item deprecado (IT_CAP_02)', () => {
        const q001 = questsCSV.find(q => q.quest_id === 'QST_001');
        expect(q001, 'QST_001 deve existir').toBeDefined();
        expect(q001.reward_item_id, 'QST_001 não deve recompensar IT_CAP_02 (deprecado)').not.toBe('IT_CAP_02');
    });

    it('todos os reward_item_id não vazios devem referenciar itens existentes', () => {
        for (const q of questsCSV) {
            const itemId = q.reward_item_id?.trim();
            if (!itemId) continue;
            expect(
                validItems.has(itemId),
                `Quest ${q.quest_id}: reward_item_id "${itemId}" não existe em items.json/CLASTERORB`
            ).toBe(true);
        }
    });

    it('nenhuma quest deve recompensar um item marcado como deprecated', () => {
        for (const q of questsCSV) {
            const itemId = q.reward_item_id?.trim();
            if (!itemId) continue;
            const itemDef = itemsById.get(itemId);
            if (itemDef) {
                expect(
                    itemDef.deprecated,
                    `Quest ${q.quest_id}: reward_item_id "${itemId}" está marcado como deprecated`
                ).toBeFalsy();
            }
        }
    });

    it('reward_xp deve ser > 0 em todas as quests', () => {
        for (const q of questsCSV) {
            const xp = Number(q.reward_xp);
            expect(xp, `Quest ${q.quest_id}: reward_xp deve ser > 0`).toBeGreaterThan(0);
        }
    });

    it('reward_gold deve ser > 0 em todas as quests', () => {
        for (const q of questsCSV) {
            const gold = Number(q.reward_gold);
            expect(gold, `Quest ${q.quest_id}: reward_gold deve ser > 0`).toBeGreaterThan(0);
        }
    });

    it('QST_002 deve ter reward_xp >= reward_xp de QST_001 (sem regressão de captura)', () => {
        const q001 = questsCSV.find(q => q.quest_id === 'QST_001');
        const q002 = questsCSV.find(q => q.quest_id === 'QST_002');
        expect(Number(q002.reward_xp)).toBeGreaterThanOrEqual(Number(q001.reward_xp));
    });

    it('quests de boss (QST_008, QST_012, QST_016) devem ter reward_gold > quests básicas', () => {
        const basicGold = questsCSV
            .filter(q => ['QST_001', 'QST_002', 'QST_003'].includes(q.quest_id))
            .map(q => Number(q.reward_gold));
        const maxBasic = Math.max(...basicGold);

        const bossIds = ['QST_008', 'QST_012', 'QST_016'];
        for (const qid of bossIds) {
            const q = questsCSV.find(q => q.quest_id === qid);
            if (!q) continue;
            expect(
                Number(q.reward_gold),
                `${qid} (boss) deve ter mais gold que quests básicas (${maxBasic})`
            ).toBeGreaterThan(maxBasic);
        }
    });
});

// ── Drop Tables ────────────────────────────────────────────────────────────

describe('Drop Tables — Validade', () => {

    it('todos os item_id em DROPS.csv devem existir em items.json/CLASTERORB', () => {
        for (const row of dropsCSV) {
            const itemId = row.item_id?.trim();
            if (!itemId) continue;
            expect(
                validItems.has(itemId),
                `Drop table ${row.drop_table_id}: item_id "${itemId}" não encontrado`
            ).toBe(true);
        }
    });

    it('chances de drop devem estar entre 0 e 1', () => {
        for (const row of dropsCSV) {
            const chance = Number(row.chance);
            expect(chance, `${row.drop_table_id}/${row.item_id}: chance deve ser >= 0`).toBeGreaterThanOrEqual(0);
            expect(chance, `${row.drop_table_id}/${row.item_id}: chance deve ser <= 1`).toBeLessThanOrEqual(1);
        }
    });

    it('min_qty deve ser >= 1 em todas as entradas de drop', () => {
        for (const row of dropsCSV) {
            const minQty = Number(row.min_qty);
            expect(minQty, `${row.drop_table_id}/${row.item_id}: min_qty >= 1`).toBeGreaterThanOrEqual(1);
        }
    });

    it('max_qty deve ser >= min_qty em todas as entradas de drop', () => {
        for (const row of dropsCSV) {
            const minQty = Number(row.min_qty);
            const maxQty = Number(row.max_qty);
            expect(maxQty, `${row.drop_table_id}/${row.item_id}: max_qty >= min_qty`).toBeGreaterThanOrEqual(minQty);
        }
    });

    it('DROP_001 (selvagem básico) deve ter chance de CLASTERORB_COMUM >= 0.40', () => {
        const row = dropsCSV.find(r => r.drop_table_id === 'DROP_001' && r.item_id === 'CLASTERORB_COMUM');
        expect(row, 'DROP_001 deve ter linha de CLASTERORB_COMUM').toBeDefined();
        expect(Number(row.chance)).toBeGreaterThanOrEqual(0.40);
    });
});
