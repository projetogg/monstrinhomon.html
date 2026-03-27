/**
 * DROP SYSTEM TESTS
 * 
 * Testes para o sistema de drops/loot em batalhas.
 * Cobertura: generateDrops, addDropsToInventory, formatDropsLog,
 *            getDropTableForEncounter, resolveItemId, DROP_TABLES
 */

import { describe, it, expect } from 'vitest';
import {
    generateDrops,
    addDropsToInventory,
    formatDropsLog,
    getDropTableForEncounter,
    resolveItemId,
    DROP_TABLES
} from '../js/data/dropSystem.js';

// ═══════════════════════════════════════════════════
// Helpers para RNG determinístico
// ═══════════════════════════════════════════════════

/**
 * Cria uma função RNG que retorna valores predefinidos em sequência
 * @param {number[]} values - Valores a retornar (0.0 - 1.0)
 * @returns {Function} - RNG determinístico
 */
function createDeterministicRng(values) {
    let index = 0;
    return () => {
        const val = values[index % values.length];
        index++;
        return val;
    };
}

// ═══════════════════════════════════════════════════
// DROP_TABLES
// ═══════════════════════════════════════════════════

describe('DROP_TABLES - Estrutura de Dados', () => {

    it('deve ter tabela DROP_001 para encontros selvagens', () => {
        expect(DROP_TABLES['DROP_001']).toBeDefined();
        expect(DROP_TABLES['DROP_001'].id).toBe('DROP_001');
        expect(DROP_TABLES['DROP_001'].entries).toBeInstanceOf(Array);
        expect(DROP_TABLES['DROP_001'].entries.length).toBeGreaterThan(0);
    });

    it('deve ter tabela DROP_002 para treinadores', () => {
        expect(DROP_TABLES['DROP_002']).toBeDefined();
        expect(DROP_TABLES['DROP_002'].id).toBe('DROP_002');
        expect(DROP_TABLES['DROP_002'].entries).toBeInstanceOf(Array);
        expect(DROP_TABLES['DROP_002'].entries.length).toBeGreaterThan(0);
    });

    it('DROP_001 deve ter CLASTERORB_COMUM (35%) e IT_HEAL_01 (25%)', () => {
        const entries = DROP_TABLES['DROP_001'].entries;
        const orb = entries.find(e => e.itemId === 'CLASTERORB_COMUM');
        const heal = entries.find(e => e.itemId === 'IT_HEAL_01');
        
        expect(orb).toBeDefined();
        expect(orb.chance).toBe(0.35);
        expect(orb.minQty).toBe(1);
        expect(orb.maxQty).toBe(1);
        
        expect(heal).toBeDefined();
        expect(heal.chance).toBe(0.25);
        expect(heal.minQty).toBe(1);
        expect(heal.maxQty).toBe(2);
    });

    it('DROP_002 deve ter chances maiores que DROP_001', () => {
        const wild = DROP_TABLES['DROP_001'].entries;
        const trainer = DROP_TABLES['DROP_002'].entries;
        
        const wildOrb = wild.find(e => e.itemId === 'CLASTERORB_COMUM');
        const trainerOrb = trainer.find(e => e.itemId === 'CLASTERORB_COMUM');
        
        expect(trainerOrb.chance).toBeGreaterThan(wildOrb.chance);
    });

    it('todas as entradas devem ter campos obrigatórios', () => {
        for (const [tableId, table] of Object.entries(DROP_TABLES)) {
            for (const entry of table.entries) {
                expect(entry.itemId).toBeTruthy();
                expect(typeof entry.chance).toBe('number');
                expect(entry.chance).toBeGreaterThan(0);
                expect(entry.chance).toBeLessThanOrEqual(1);
                expect(entry.minQty).toBeGreaterThanOrEqual(1);
                expect(entry.maxQty).toBeGreaterThanOrEqual(entry.minQty);
            }
        }
    });
});

// ═══════════════════════════════════════════════════
// resolveItemId
// ═══════════════════════════════════════════════════

describe('resolveItemId - Mapeamento de IDs Legados', () => {

    it('deve converter IT_CAP_01 para CLASTERORB_COMUM', () => {
        expect(resolveItemId('IT_CAP_01')).toBe('CLASTERORB_COMUM');
    });

    it('deve converter IT_CAP_02 para CLASTERORB_INCOMUM', () => {
        expect(resolveItemId('IT_CAP_02')).toBe('CLASTERORB_INCOMUM');
    });

    it('deve manter IDs atuais sem mudança', () => {
        expect(resolveItemId('CLASTERORB_COMUM')).toBe('CLASTERORB_COMUM');
        expect(resolveItemId('IT_HEAL_01')).toBe('IT_HEAL_01');
    });

    it('deve retornar o próprio ID se não for legado', () => {
        expect(resolveItemId('ITEM_NOVO')).toBe('ITEM_NOVO');
    });
});

// ═══════════════════════════════════════════════════
// generateDrops
// ═══════════════════════════════════════════════════

describe('generateDrops - Geração de Drops', () => {

    it('deve retornar array vazio para tabela inexistente', () => {
        const drops = generateDrops('DROP_999');
        expect(drops).toEqual([]);
    });

    it('deve retornar array vazio para ID null/undefined', () => {
        expect(generateDrops(null)).toEqual([]);
        expect(generateDrops(undefined)).toEqual([]);
        expect(generateDrops('')).toEqual([]);
    });

    it('deve gerar todos os drops quando RNG sempre retorna 0', () => {
        // RNG = 0.0 < qualquer chance, então TUDO dropa
        const rng = createDeterministicRng([0.0]);
        const drops = generateDrops('DROP_001', rng);
        
        expect(drops.length).toBe(2);
        expect(drops[0].itemId).toBe('CLASTERORB_COMUM');
        expect(drops[1].itemId).toBe('IT_HEAL_01');
    });

    it('deve gerar zero drops quando RNG sempre retorna 0.99', () => {
        // RNG = 0.99 > qualquer chance em DROP_001, então NADA dropa
        const rng = createDeterministicRng([0.99]);
        const drops = generateDrops('DROP_001', rng);
        
        expect(drops.length).toBe(0);
    });

    it('deve gerar apenas orb quando RNG retorna [0.10, 0.90]', () => {
        // Primeiro roll 0.10 < 0.35 (orb dropa)
        // Segundo roll 0.90 > 0.25 (heal NÃO dropa)
        const rng = createDeterministicRng([0.10, 0.90]);
        const drops = generateDrops('DROP_001', rng);
        
        expect(drops.length).toBe(1);
        expect(drops[0].itemId).toBe('CLASTERORB_COMUM');
        expect(drops[0].qty).toBe(1); // min=max=1 para orb
    });

    it('deve gerar apenas heal quando RNG retorna [0.50, 0.10]', () => {
        // Primeiro roll 0.50 > 0.35 (orb NÃO dropa)
        // Segundo roll 0.10 < 0.25 (heal dropa)
        // Terceiro roll para qty: usaremos 0.10 → qty = 1 + floor(0.10 * 2) = 1
        const rng = createDeterministicRng([0.50, 0.10, 0.10]);
        const drops = generateDrops('DROP_001', rng);
        
        expect(drops.length).toBe(1);
        expect(drops[0].itemId).toBe('IT_HEAL_01');
        expect(drops[0].qty).toBeGreaterThanOrEqual(1);
        expect(drops[0].qty).toBeLessThanOrEqual(2);
    });

    it('deve respeitar min/max qty para heals (1-2)', () => {
        // Forçar drop do heal com qty máxima
        // Roll chance: 0.0 (dropa), Roll qty: 0.99 → qty = min(2, 1 + floor(0.99 * 2)) = 2
        const rng = createDeterministicRng([0.99, 0.0, 0.99]); // skip orb, drop heal, max qty
        const drops = generateDrops('DROP_001', rng);
        
        const heal = drops.find(d => d.itemId === 'IT_HEAL_01');
        expect(heal).toBeDefined();
        expect(heal.qty).toBe(2);
    });

    it('deve clampar qty quando RNG retorna exatamente 1.0', () => {
        // Edge case: rngFn pode retornar 1.0 (Math.random não, mas custom sim)
        // Sem clamp: 1 + floor(1.0 * 2) = 3 (>maxQty!)
        // Com clamp: min(2, 3) = 2
        const rng = createDeterministicRng([0.0, 0.0, 1.0]); // orb dropa (qty=1=1), heal dropa, qty clamped
        const drops = generateDrops('DROP_001', rng);
        
        const heal = drops.find(d => d.itemId === 'IT_HEAL_01');
        expect(heal).toBeDefined();
        expect(heal.qty).toBeLessThanOrEqual(2);
    });

    it('deve usar Math.random como fallback quando rngFn não fornecido', () => {
        // Apenas verificar que não lança erro
        const drops = generateDrops('DROP_001');
        expect(Array.isArray(drops)).toBe(true);
    });

    it('deve funcionar com DROP_002 (treinador)', () => {
        const rng = createDeterministicRng([0.0]); // tudo dropa
        const drops = generateDrops('DROP_002', rng);
        
        expect(drops.length).toBe(2);
        expect(drops[0].itemId).toBe('CLASTERORB_COMUM');
        expect(drops[1].itemId).toBe('IT_HEAL_01');
    });

    it('DROP_002 deve dropar orb com chance 50%', () => {
        // Roll 0.49 < 0.50 → dropa
        const rng = createDeterministicRng([0.49, 0.99]);
        const drops = generateDrops('DROP_002', rng);
        
        expect(drops.length).toBe(1);
        expect(drops[0].itemId).toBe('CLASTERORB_COMUM');
    });

    it('cada drop deve ter qty >= 1', () => {
        const rng = createDeterministicRng([0.0, 0.0]); // tudo dropa
        const drops = generateDrops('DROP_001', rng);
        
        for (const drop of drops) {
            expect(drop.qty).toBeGreaterThanOrEqual(1);
        }
    });
});

// ═══════════════════════════════════════════════════
// addDropsToInventory
// ═══════════════════════════════════════════════════

describe('addDropsToInventory - Adicionar ao Inventário', () => {

    it('deve adicionar drops ao inventário vazio', () => {
        const player = { inventory: {} };
        const drops = [
            { itemId: 'CLASTERORB_COMUM', qty: 1 },
            { itemId: 'IT_HEAL_01', qty: 2 }
        ];
        
        const result = addDropsToInventory(player, drops);
        
        expect(result).toBe(true);
        expect(player.inventory['CLASTERORB_COMUM']).toBe(1);
        expect(player.inventory['IT_HEAL_01']).toBe(2);
    });

    it('deve somar aos itens existentes no inventário', () => {
        const player = { inventory: { 'CLASTERORB_COMUM': 3, 'IT_HEAL_01': 1 } };
        const drops = [
            { itemId: 'CLASTERORB_COMUM', qty: 1 },
            { itemId: 'IT_HEAL_01', qty: 2 }
        ];
        
        addDropsToInventory(player, drops);
        
        expect(player.inventory['CLASTERORB_COMUM']).toBe(4);
        expect(player.inventory['IT_HEAL_01']).toBe(3);
    });

    it('deve criar inventory se não existir', () => {
        const player = {};
        const drops = [{ itemId: 'IT_HEAL_01', qty: 1 }];
        
        addDropsToInventory(player, drops);
        
        expect(player.inventory).toBeDefined();
        expect(player.inventory['IT_HEAL_01']).toBe(1);
    });

    it('deve retornar false para drops vazio', () => {
        const player = { inventory: {} };
        expect(addDropsToInventory(player, [])).toBe(false);
    });

    it('deve retornar false para player null', () => {
        expect(addDropsToInventory(null, [{ itemId: 'X', qty: 1 }])).toBe(false);
    });

    it('deve retornar false para drops null', () => {
        expect(addDropsToInventory({}, null)).toBe(false);
    });

    it('deve ignorar drops com qty <= 0', () => {
        const player = { inventory: {} };
        const drops = [
            { itemId: 'CLASTERORB_COMUM', qty: 0 },
            { itemId: 'IT_HEAL_01', qty: -1 }
        ];
        
        const result = addDropsToInventory(player, drops);
        
        expect(result).toBe(false);
        expect(player.inventory['CLASTERORB_COMUM']).toBeUndefined();
    });

    it('deve ignorar drops sem itemId', () => {
        const player = { inventory: {} };
        const drops = [{ qty: 1 }];
        
        const result = addDropsToInventory(player, drops);
        expect(result).toBe(false);
    });
});

// ═══════════════════════════════════════════════════
// formatDropsLog
// ═══════════════════════════════════════════════════

describe('formatDropsLog - Formatação de Log', () => {

    it('deve formatar drops com nomes e emojis', () => {
        const drops = [
            { itemId: 'CLASTERORB_COMUM', qty: 1 },
            { itemId: 'IT_HEAL_01', qty: 2 }
        ];
        
        const lines = formatDropsLog(drops);
        
        expect(lines.length).toBe(3); // header + 2 items
        expect(lines[0]).toContain('🎁');
        expect(lines[1]).toContain('ClasterOrb Comum');
        expect(lines[1]).toContain('x1');
        expect(lines[2]).toContain('Petisco de Cura');
        expect(lines[2]).toContain('x2');
    });

    it('deve retornar array vazio para drops vazio', () => {
        expect(formatDropsLog([])).toEqual([]);
        expect(formatDropsLog(null)).toEqual([]);
        expect(formatDropsLog(undefined)).toEqual([]);
    });

    it('deve usar emoji padrão para item desconhecido', () => {
        const drops = [{ itemId: 'ITEM_NOVO', qty: 1 }];
        const lines = formatDropsLog(drops);
        
        expect(lines[1]).toContain('📦');
        expect(lines[1]).toContain('ITEM_NOVO');
    });

    it('deve aceitar mapa de nomes customizado', () => {
        const drops = [{ itemId: 'CUSTOM_ITEM', qty: 3 }];
        const customMap = {
            'CUSTOM_ITEM': { name: 'Item Customizado', emoji: '🌟' }
        };
        
        const lines = formatDropsLog(drops, customMap);
        
        expect(lines[1]).toContain('🌟');
        expect(lines[1]).toContain('Item Customizado');
        expect(lines[1]).toContain('x3');
    });
});

// ═══════════════════════════════════════════════════
// getDropTableForEncounter
// ═══════════════════════════════════════════════════

describe('getDropTableForEncounter - Mapeamento Tipo → Tabela', () => {

    it('deve retornar DROP_001 para wild', () => {
        expect(getDropTableForEncounter('wild')).toBe('DROP_001');
    });

    it('deve retornar DROP_002 para group_trainer', () => {
        expect(getDropTableForEncounter('group_trainer')).toBe('DROP_002');
    });

    it('deve retornar DROP_002 para trainer', () => {
        expect(getDropTableForEncounter('trainer')).toBe('DROP_002');
    });

    it('deve retornar DROP_003 para boss', () => {
        expect(getDropTableForEncounter('boss')).toBe('DROP_003');
    });

    it('deve ser case-insensitive', () => {
        expect(getDropTableForEncounter('WILD')).toBe('DROP_001');
        expect(getDropTableForEncounter('Boss')).toBe('DROP_003');
    });

    it('deve retornar null para tipo desconhecido', () => {
        expect(getDropTableForEncounter('event')).toBeNull();
        expect(getDropTableForEncounter('unknown')).toBeNull();
    });

    it('deve retornar null para null/undefined', () => {
        expect(getDropTableForEncounter(null)).toBeNull();
        expect(getDropTableForEncounter(undefined)).toBeNull();
        expect(getDropTableForEncounter('')).toBeNull();
    });
});

// ═══════════════════════════════════════════════════
// Integração: generateDrops + addDropsToInventory
// ═══════════════════════════════════════════════════

describe('Integração - Fluxo completo de drop', () => {

    it('deve gerar e adicionar drops ao jogador em fluxo completo', () => {
        const player = { inventory: { 'CLASTERORB_COMUM': 2 } };
        
        // Simular vitória em encontro selvagem
        const dropTableId = getDropTableForEncounter('wild');
        const rng = createDeterministicRng([0.0, 0.0, 0.5]); // tudo dropa, heal qty = 1+floor(0.5*2) = 2
        
        const drops = generateDrops(dropTableId, rng);
        addDropsToInventory(player, drops);
        
        // Orb: 2 + 1 = 3
        expect(player.inventory['CLASTERORB_COMUM']).toBe(3);
        // Heal: 0 + 2 = 2
        expect(player.inventory['IT_HEAL_01']).toBe(2);
    });

    it('deve gerar log formatado corretamente', () => {
        const rng = createDeterministicRng([0.0]);
        const drops = generateDrops('DROP_001', rng);
        const log = formatDropsLog(drops);
        
        expect(log.length).toBeGreaterThan(0);
        expect(log[0]).toContain('🎁');
    });

    it('não deve adicionar nada quando todos os rolls falham', () => {
        const player = { inventory: { 'CLASTERORB_COMUM': 5 } };
        
        const rng = createDeterministicRng([0.99]); // nada dropa
        const drops = generateDrops('DROP_001', rng);
        addDropsToInventory(player, drops);
        
        expect(player.inventory['CLASTERORB_COMUM']).toBe(5); // sem mudança
    });
});
