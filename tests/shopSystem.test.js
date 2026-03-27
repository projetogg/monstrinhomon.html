/**
 * SHOP SYSTEM TESTS (Loja e Economia Básica)
 *
 * Testa as funções puras do módulo js/shopSystem.js:
 * - getSellPrice
 * - canBuy / executeBuy
 * - canSell / executeSell
 * - getShopCatalog
 * - getSellableInventory
 *
 * Também valida integração com itens reais do data/items.json.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    getSellPrice,
    canBuy,
    executeBuy,
    canSell,
    executeSell,
    getShopCatalog,
    getSellableInventory
} from '../js/shopSystem.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Helpers ───────────────────────────────────────────────────────────────

function loadRealItems() {
    const raw = readFileSync(join(process.cwd(), 'data/items.json'), 'utf8');
    return JSON.parse(raw).items;
}

function makePlayer(overrides = {}) {
    return {
        id: 'player_test',
        name: 'Testador',
        class: 'Guerreiro',
        money: 200,
        inventory: { 'IT_ATK_COMUM': 3, 'IT_HEAL_01': 5 },
        team: [],
        ...overrides
    };
}

const ITEM_ATK_COMUM = {
    id: 'IT_ATK_COMUM',
    name: 'Amuleto de Força',
    type: 'held',
    tier: 'comum',
    price: { buy: 50 }
};

const ITEM_HEAL_01 = {
    id: 'IT_HEAL_01',
    name: 'Petisco de Cura',
    type: 'heal',
    price: { buy: 20, sell: 5 }
};

const ITEM_CLASTERORB_COMUM = {
    id: 'CLASTERORB_COMUM',
    name: 'ClasterOrb Comum',
    type: 'capture',
    price: { buy: 30, sell: 10 }
};

const ITEM_CLASTERORB_INCOMUM = {
    id: 'CLASTERORB_INCOMUM',
    name: 'ClasterOrb Incomum',
    type: 'capture',
    price: { buy: 80, sell: 25 }
};

const ITEM_CLASTERORB_RARA = {
    id: 'CLASTERORB_RARA',
    name: 'ClasterOrb Rara',
    type: 'capture',
    price: { buy: 150, sell: 50 }
};

const ITEM_NO_PRICE = {
    id: 'IT_NO_PRICE',
    name: 'Item Sem Preço',
    type: 'held',
    price: {}
};

const ITEM_DEPRECATED = {
    id: 'IT_CAP_02',
    name: 'Orbe Reforçado',
    type: 'capture',
    deprecated: true,
    price: { buy: 80, sell: 25 }
};

// ─── getSellPrice ──────────────────────────────────────────────────────────

describe('getSellPrice', () => {
    it('retorna null para item sem price', () => {
        expect(getSellPrice({})).toBe(null);
        expect(getSellPrice({ price: {} })).toBe(null);
    });

    it('retorna null para buy <= 1', () => {
        expect(getSellPrice({ price: { buy: 1 } })).toBe(null);
        expect(getSellPrice({ price: { buy: 0 } })).toBe(null);
        expect(getSellPrice({ price: { buy: -10 } })).toBe(null);
    });

    it('retorna null para tipos inválidos de buy', () => {
        expect(getSellPrice({ price: { buy: '50' } })).toBe(null);
        expect(getSellPrice({ price: { buy: null } })).toBe(null);
        expect(getSellPrice(null)).toBe(null);
        expect(getSellPrice(undefined)).toBe(null);
    });

    it('usa 50% fallback quando não há sell explícito', () => {
        // floor(50 * 0.5) = 25
        expect(getSellPrice({ price: { buy: 50 } })).toBe(25);
        // floor(30 * 0.5) = 15
        expect(getSellPrice({ price: { buy: 30 } })).toBe(15);
        // floor(80 * 0.5) = 40
        expect(getSellPrice({ price: { buy: 80 } })).toBe(40);
    });

    it('usa sell explícito quando presente', () => {
        expect(getSellPrice({ price: { buy: 20, sell: 5 } })).toBe(5);
        expect(getSellPrice({ price: { buy: 80, sell: 25 } })).toBe(25);
    });

    it('garante sell < buy (nunca igual ou maior)', () => {
        expect(getSellPrice({ price: { buy: 50, sell: 50 } })).toBe(49);
        expect(getSellPrice({ price: { buy: 50, sell: 100 } })).toBe(49);
    });

    it('garante sell >= 1', () => {
        expect(getSellPrice({ price: { buy: 2 } })).toBe(1);
        expect(getSellPrice({ price: { buy: 50, sell: 0 } })).toBe(1);
        expect(getSellPrice({ price: { buy: 50, sell: -5 } })).toBe(1);
    });

    it('garante sell < buy para todos os preços válidos', () => {
        const prices = [2, 5, 10, 20, 30, 50, 80, 120, 150, 200, 250, 500, 1000, 3000];
        for (const buy of prices) {
            const sell = getSellPrice({ price: { buy } });
            expect(sell).not.toBe(null);
            expect(sell).toBeGreaterThan(0);
            expect(sell).toBeLessThan(buy);
        }
    });

    it('calcula corretamente para itens reais de captura', () => {
        // CLASTERORB_COMUM: buy=30, sell=10 (explícito)
        expect(getSellPrice(ITEM_CLASTERORB_COMUM)).toBe(10);
        // CLASTERORB_INCOMUM: buy=80, sell=25 (explícito)
        expect(getSellPrice(ITEM_CLASTERORB_INCOMUM)).toBe(25);
        // CLASTERORB_RARA: buy=150, sell=50 (explícito)
        expect(getSellPrice(ITEM_CLASTERORB_RARA)).toBe(50);
    });
});

// ─── canBuy ────────────────────────────────────────────────────────────────

describe('canBuy', () => {
    it('retorna ok=false para player inválido', () => {
        const result = canBuy(null, ITEM_ATK_COMUM, 1);
        expect(result.ok).toBe(false);
        expect(result.reason).toBeTruthy();
    });

    it('retorna ok=false para item inválido', () => {
        const player = makePlayer();
        const result = canBuy(player, null, 1);
        expect(result.ok).toBe(false);
    });

    it('retorna ok=false para quantidade inválida', () => {
        const player = makePlayer();
        expect(canBuy(player, ITEM_ATK_COMUM, 0).ok).toBe(false);
        expect(canBuy(player, ITEM_ATK_COMUM, -1).ok).toBe(false);
        expect(canBuy(player, ITEM_ATK_COMUM, 1.5).ok).toBe(false);
    });

    it('retorna ok=false para item sem preço de compra', () => {
        const player = makePlayer();
        const result = canBuy(player, ITEM_NO_PRICE, 1);
        expect(result.ok).toBe(false);
    });

    it('retorna ok=false quando saldo insuficiente', () => {
        // player tem 200, ITEM_ATK_COMUM custa 50, qty=5 = 250
        const player = makePlayer({ money: 200 });
        const result = canBuy(player, ITEM_ATK_COMUM, 5);
        expect(result.ok).toBe(false);
        expect(result.reason).toContain('200');
        expect(result.reason).toContain('250');
    });

    it('retorna ok=true com saldo suficiente', () => {
        const player = makePlayer({ money: 200 });
        const result = canBuy(player, ITEM_ATK_COMUM, 1); // custa 50
        expect(result.ok).toBe(true);
        expect(result.reason).toBe(null);
    });

    it('retorna ok=true compra exata (saldo = custo)', () => {
        const player = makePlayer({ money: 50 });
        const result = canBuy(player, ITEM_ATK_COMUM, 1); // custa exatamente 50
        expect(result.ok).toBe(true);
    });

    it('funciona para itens de captura (ClasterOrb)', () => {
        const player = makePlayer({ money: 100 });
        expect(canBuy(player, ITEM_CLASTERORB_COMUM, 3).ok).toBe(true);   // 3×30 = 90
        expect(canBuy(player, ITEM_CLASTERORB_INCOMUM, 2).ok).toBe(false); // 2×80 = 160
    });
});

// ─── executeBuy ────────────────────────────────────────────────────────────

describe('executeBuy', () => {
    it('deduz o custo do saldo do jogador', () => {
        const player = makePlayer({ money: 200 });
        const updated = executeBuy(player, ITEM_ATK_COMUM, 1);
        // 200 - 50 = 150
        expect(updated.money).toBe(150);
    });

    it('adiciona item ao inventário', () => {
        const player = makePlayer({ money: 200, inventory: {} });
        const updated = executeBuy(player, ITEM_ATK_COMUM, 1);
        expect(updated.inventory['IT_ATK_COMUM']).toBe(1);
    });

    it('incrementa item existente no inventário', () => {
        const player = makePlayer({ money: 200, inventory: { 'IT_ATK_COMUM': 3 } });
        const updated = executeBuy(player, ITEM_ATK_COMUM, 2);
        expect(updated.inventory['IT_ATK_COMUM']).toBe(5);
    });

    it('não muta o objeto original do jogador', () => {
        const player = makePlayer({ money: 200, inventory: { 'IT_ATK_COMUM': 1 } });
        const updated = executeBuy(player, ITEM_ATK_COMUM, 1);
        expect(player.money).toBe(200);
        expect(player.inventory['IT_ATK_COMUM']).toBe(1);
        expect(updated.money).toBe(150);
        expect(updated.inventory['IT_ATK_COMUM']).toBe(2);
        expect(updated.inventory).not.toBe(player.inventory);
    });

    it('executa compra múltipla corretamente', () => {
        const player = makePlayer({ money: 300, inventory: {} });
        const updated = executeBuy(player, ITEM_CLASTERORB_COMUM, 3); // 3×30 = 90
        expect(updated.money).toBe(210);
        expect(updated.inventory['CLASTERORB_COMUM']).toBe(3);
    });

    it('mantém outros dados do player intactos', () => {
        const player = makePlayer({ money: 200 });
        const updated = executeBuy(player, ITEM_ATK_COMUM, 1);
        expect(updated.id).toBe(player.id);
        expect(updated.name).toBe(player.name);
        expect(updated.class).toBe(player.class);
    });
});

// ─── canSell ───────────────────────────────────────────────────────────────

describe('canSell', () => {
    it('retorna ok=false para player inválido', () => {
        expect(canSell(null, ITEM_HEAL_01, 1).ok).toBe(false);
    });

    it('retorna ok=false para item inválido', () => {
        const player = makePlayer();
        expect(canSell(player, null, 1).ok).toBe(false);
    });

    it('retorna ok=false para quantidade inválida', () => {
        const player = makePlayer({ inventory: { 'IT_HEAL_01': 5 } });
        expect(canSell(player, ITEM_HEAL_01, 0).ok).toBe(false);
        expect(canSell(player, ITEM_HEAL_01, -1).ok).toBe(false);
        expect(canSell(player, ITEM_HEAL_01, 1.5).ok).toBe(false);
    });

    it('retorna ok=false para item sem preço de venda (buy <= 1)', () => {
        const player = makePlayer({ inventory: { 'IT_NO_PRICE': 1 } });
        expect(canSell(player, ITEM_NO_PRICE, 1).ok).toBe(false);
    });

    it('retorna ok=false quando não tem quantidade suficiente', () => {
        const player = makePlayer({ inventory: { 'IT_HEAL_01': 2 } });
        const result = canSell(player, ITEM_HEAL_01, 5);
        expect(result.ok).toBe(false);
        expect(result.reason).toContain('2x');
    });

    it('retorna ok=false quando item está equipado no time', () => {
        const player = makePlayer({
            inventory: { 'IT_ATK_COMUM': 1 },
            team: [{ name: 'Guerreirin', equippedItem: 'IT_ATK_COMUM' }]
        });
        const result = canSell(player, ITEM_ATK_COMUM, 1);
        expect(result.ok).toBe(false);
        expect(result.reason).toContain('Guerreirin');
    });

    it('retorna ok=true para venda válida', () => {
        const player = makePlayer({ inventory: { 'IT_HEAL_01': 5 } });
        const result = canSell(player, ITEM_HEAL_01, 2);
        expect(result.ok).toBe(true);
        expect(result.reason).toBe(null);
    });

    it('retorna ok=true quando time existe mas item não está equipado', () => {
        const player = makePlayer({
            inventory: { 'IT_HEAL_01': 3 },
            team: [{ name: 'Guerreirin', equippedItem: 'IT_ATK_COMUM' }]
        });
        expect(canSell(player, ITEM_HEAL_01, 1).ok).toBe(true);
    });

    it('funciona para ClasterOrbs', () => {
        const player = makePlayer({ inventory: { 'CLASTERORB_COMUM': 10 } });
        expect(canSell(player, ITEM_CLASTERORB_COMUM, 5).ok).toBe(true);
        expect(canSell(player, ITEM_CLASTERORB_COMUM, 11).ok).toBe(false);
    });
});

// ─── executeSell ───────────────────────────────────────────────────────────

describe('executeSell', () => {
    it('credita o valor correto ao saldo do jogador', () => {
        // IT_HEAL_01: sell=5 → 2×5 = 10
        const player = makePlayer({ money: 50, inventory: { 'IT_HEAL_01': 5 } });
        const updated = executeSell(player, ITEM_HEAL_01, 2);
        expect(updated.money).toBe(60);
    });

    it('decrementa a quantidade no inventário', () => {
        const player = makePlayer({ inventory: { 'IT_HEAL_01': 5 } });
        const updated = executeSell(player, ITEM_HEAL_01, 2);
        expect(updated.inventory['IT_HEAL_01']).toBe(3);
    });

    it('remove o item do inventário quando quantidade chega a zero', () => {
        const player = makePlayer({ inventory: { 'IT_HEAL_01': 2 } });
        const updated = executeSell(player, ITEM_HEAL_01, 2);
        expect(updated.inventory['IT_HEAL_01']).toBeUndefined();
        expect('IT_HEAL_01' in updated.inventory).toBe(false);
    });

    it('não muta o objeto original do jogador', () => {
        const player = makePlayer({ money: 50, inventory: { 'IT_HEAL_01': 5 } });
        const updated = executeSell(player, ITEM_HEAL_01, 1);
        expect(player.money).toBe(50);
        expect(player.inventory['IT_HEAL_01']).toBe(5);
        expect(updated.money).toBe(55);
        expect(updated.inventory['IT_HEAL_01']).toBe(4);
        expect(updated.inventory).not.toBe(player.inventory);
    });

    it('vende ClasterOrb corretamente', () => {
        // CLASTERORB_INCOMUM: sell=25 → 3×25 = 75
        const player = makePlayer({ money: 100, inventory: { 'CLASTERORB_INCOMUM': 5 } });
        const updated = executeSell(player, ITEM_CLASTERORB_INCOMUM, 3);
        expect(updated.money).toBe(175);
        expect(updated.inventory['CLASTERORB_INCOMUM']).toBe(2);
    });

    it('mantém outros dados do player intactos', () => {
        const player = makePlayer({ inventory: { 'IT_HEAL_01': 3 } });
        const updated = executeSell(player, ITEM_HEAL_01, 1);
        expect(updated.id).toBe(player.id);
        expect(updated.name).toBe(player.name);
        expect(updated.class).toBe(player.class);
    });
});

// ─── getShopCatalog ────────────────────────────────────────────────────────

describe('getShopCatalog', () => {
    it('retorna array vazio para input inválido', () => {
        expect(getShopCatalog(null)).toEqual([]);
        expect(getShopCatalog(undefined)).toEqual([]);
        expect(getShopCatalog('invalid')).toEqual([]);
    });

    it('filtra itens sem preço de compra', () => {
        const items = [ITEM_ATK_COMUM, ITEM_NO_PRICE, ITEM_HEAL_01];
        const catalog = getShopCatalog(items);
        expect(catalog).toHaveLength(2);
        expect(catalog.find(i => i.id === 'IT_NO_PRICE')).toBeUndefined();
    });

    it('exclui itens deprecated', () => {
        const items = [ITEM_ATK_COMUM, ITEM_HEAL_01, ITEM_DEPRECATED];
        const catalog = getShopCatalog(items);
        expect(catalog.find(i => i.id === 'IT_CAP_02')).toBeUndefined();
    });

    it('inclui ClasterOrbs na loja', () => {
        const items = [ITEM_CLASTERORB_COMUM, ITEM_CLASTERORB_INCOMUM, ITEM_CLASTERORB_RARA];
        const catalog = getShopCatalog(items);
        expect(catalog).toHaveLength(3);
        expect(catalog.map(i => i.id)).toContain('CLASTERORB_COMUM');
        expect(catalog.map(i => i.id)).toContain('CLASTERORB_INCOMUM');
        expect(catalog.map(i => i.id)).toContain('CLASTERORB_RARA');
    });

    it('integra com itens reais do items.json', () => {
        const realItems = loadRealItems();
        const catalog = getShopCatalog(realItems);

        // Catálogo não deve estar vazio
        expect(catalog.length).toBeGreaterThan(0);

        // IT_CAP_02 (deprecated) não deve aparecer
        expect(catalog.find(i => i.id === 'IT_CAP_02')).toBeUndefined();

        // ClasterOrbs devem aparecer
        expect(catalog.find(i => i.id === 'CLASTERORB_COMUM')).toBeDefined();
        expect(catalog.find(i => i.id === 'CLASTERORB_INCOMUM')).toBeDefined();
        expect(catalog.find(i => i.id === 'CLASTERORB_RARA')).toBeDefined();

        // Itens de cura devem aparecer
        expect(catalog.find(i => i.id === 'IT_HEAL_01')).toBeDefined();
        expect(catalog.find(i => i.id === 'IT_HEAL_02')).toBeDefined();
        expect(catalog.find(i => i.id === 'IT_HEAL_03')).toBeDefined();

        // Todos os itens do catálogo devem ter preço válido
        for (const item of catalog) {
            expect(typeof item.price.buy).toBe('number');
            expect(item.price.buy).toBeGreaterThan(0);
        }
    });
});

// ─── getSellableInventory ──────────────────────────────────────────────────

describe('getSellableInventory', () => {
    it('retorna vazio para player inválido', () => {
        expect(getSellableInventory(null, [])).toEqual([]);
        expect(getSellableInventory(undefined, [])).toEqual([]);
    });

    it('retorna vazio para itens inválidos', () => {
        const player = makePlayer();
        expect(getSellableInventory(player, null)).toEqual([]);
        expect(getSellableInventory(player, undefined)).toEqual([]);
    });

    it('retorna somente itens do inventário com preço de venda', () => {
        const player = makePlayer({
            inventory: { 'IT_ATK_COMUM': 2, 'IT_HEAL_01': 3, 'IT_NO_PRICE': 1 }
        });
        const allItems = [ITEM_ATK_COMUM, ITEM_HEAL_01, ITEM_NO_PRICE];
        const sellable = getSellableInventory(player, allItems);

        // IT_NO_PRICE não tem sell price válido
        expect(sellable.find(e => e.itemDef.id === 'IT_NO_PRICE')).toBeUndefined();
        expect(sellable.find(e => e.itemDef.id === 'IT_ATK_COMUM')).toBeDefined();
        expect(sellable.find(e => e.itemDef.id === 'IT_HEAL_01')).toBeDefined();
    });

    it('exclui itens equipados no time', () => {
        const player = makePlayer({
            inventory: { 'IT_ATK_COMUM': 2, 'IT_HEAL_01': 3 },
            team: [{ name: 'Guerreirin', equippedItem: 'IT_ATK_COMUM' }]
        });
        const allItems = [ITEM_ATK_COMUM, ITEM_HEAL_01];
        const sellable = getSellableInventory(player, allItems);

        // IT_ATK_COMUM está equipado → não aparece
        expect(sellable.find(e => e.itemDef.id === 'IT_ATK_COMUM')).toBeUndefined();
        expect(sellable.find(e => e.itemDef.id === 'IT_HEAL_01')).toBeDefined();
    });

    it('inclui qty e sellPrice corretos em cada entrada', () => {
        const player = makePlayer({
            inventory: { 'IT_HEAL_01': 4 },
            team: []
        });
        const allItems = [ITEM_HEAL_01];
        const sellable = getSellableInventory(player, allItems);

        expect(sellable).toHaveLength(1);
        const entry = sellable[0];
        expect(entry.qty).toBe(4);
        expect(entry.sellPrice).toBe(5);   // sell explícito = 5
        expect(entry.itemDef.id).toBe('IT_HEAL_01');
    });

    it('ignora entradas com qty 0 ou negativo', () => {
        const player = makePlayer({
            inventory: { 'IT_ATK_COMUM': 0, 'IT_HEAL_01': -1, 'CLASTERORB_COMUM': 2 }
        });
        const allItems = [ITEM_ATK_COMUM, ITEM_HEAL_01, ITEM_CLASTERORB_COMUM];
        const sellable = getSellableInventory(player, allItems);

        expect(sellable).toHaveLength(1);
        expect(sellable[0].itemDef.id).toBe('CLASTERORB_COMUM');
    });
});

// ─── Integração canBuy → executeBuy ───────────────────────────────────────

describe('Fluxo completo de compra', () => {
    it('compra com saldo suficiente atualiza inventário e saldo', () => {
        const player = makePlayer({ money: 200, inventory: {} });
        const check = canBuy(player, ITEM_CLASTERORB_INCOMUM, 2); // 2×80 = 160
        expect(check.ok).toBe(true);
        const updated = executeBuy(player, ITEM_CLASTERORB_INCOMUM, 2);
        expect(updated.money).toBe(40);
        expect(updated.inventory['CLASTERORB_INCOMUM']).toBe(2);
    });

    it('bloqueia compra sem saldo suficiente', () => {
        const player = makePlayer({ money: 50 });
        const check = canBuy(player, ITEM_CLASTERORB_RARA, 1); // custa 150
        expect(check.ok).toBe(false);
    });

    it('compra sequencial acumula itens e decrementa saldo', () => {
        let player = makePlayer({ money: 300, inventory: {} });

        const check1 = canBuy(player, ITEM_CLASTERORB_COMUM, 3); // 3×30 = 90
        expect(check1.ok).toBe(true);
        player = executeBuy(player, ITEM_CLASTERORB_COMUM, 3);
        expect(player.money).toBe(210);
        expect(player.inventory['CLASTERORB_COMUM']).toBe(3);

        const check2 = canBuy(player, ITEM_HEAL_01, 5); // 5×20 = 100
        expect(check2.ok).toBe(true);
        player = executeBuy(player, ITEM_HEAL_01, 5);
        expect(player.money).toBe(110);
        expect(player.inventory['IT_HEAL_01']).toBe(5);
    });
});

// ─── Integração canSell → executeSell ─────────────────────────────────────

describe('Fluxo completo de venda', () => {
    it('venda com quantidade válida atualiza inventário e saldo', () => {
        const player = makePlayer({ money: 0, inventory: { 'CLASTERORB_COMUM': 5 } });
        const check = canSell(player, ITEM_CLASTERORB_COMUM, 3); // 3×10 = 30
        expect(check.ok).toBe(true);
        const updated = executeSell(player, ITEM_CLASTERORB_COMUM, 3);
        expect(updated.money).toBe(30);
        expect(updated.inventory['CLASTERORB_COMUM']).toBe(2);
    });

    it('impede venda de item não possuído', () => {
        const player = makePlayer({ inventory: {} });
        const check = canSell(player, ITEM_CLASTERORB_COMUM, 1);
        expect(check.ok).toBe(false);
    });

    it('impede venda de item sem preço de venda', () => {
        const player = makePlayer({ inventory: { 'IT_NO_PRICE': 1 } });
        const check = canSell(player, ITEM_NO_PRICE, 1);
        expect(check.ok).toBe(false);
    });

    it('impede lucro na revenda (sell sempre < buy)', () => {
        // Comprar um item e tentar vender por mais do que custou
        const player = makePlayer({ money: 200, inventory: {} });
        let p = executeBuy(player, ITEM_ATK_COMUM, 1); // buy=50

        const check = canSell(p, ITEM_ATK_COMUM, 1);
        expect(check.ok).toBe(true);

        const p2 = executeSell(p, ITEM_ATK_COMUM, 1);
        // sell = floor(50 * 0.5) = 25
        expect(p2.money).toBeLessThan(player.money); // ainda perdeu dinheiro
        expect(p2.money).toBe(200 - 50 + 25); // = 175
    });
});

// ─── Integridade do items.json ─────────────────────────────────────────────

describe('Integridade dos itens em data/items.json', () => {
    let realItems;

    beforeEach(() => {
        realItems = loadRealItems();
    });

    it('arquivo carrega sem erros', () => {
        expect(Array.isArray(realItems)).toBe(true);
        expect(realItems.length).toBeGreaterThan(0);
    });

    it('CLASTERORB_COMUM está presente com preço correto', () => {
        const item = realItems.find(i => i.id === 'CLASTERORB_COMUM');
        expect(item).toBeDefined();
        expect(item.type).toBe('capture');
        expect(item.price.buy).toBe(30);
        expect(item.price.sell).toBe(10);
        expect(item.capture_bonus_pp).toBe(0);
    });

    it('CLASTERORB_INCOMUM está presente com preço correto', () => {
        const item = realItems.find(i => i.id === 'CLASTERORB_INCOMUM');
        expect(item).toBeDefined();
        expect(item.type).toBe('capture');
        expect(item.price.buy).toBe(80);
        expect(item.price.sell).toBe(25);
        expect(item.capture_bonus_pp).toBe(10);
    });

    it('CLASTERORB_RARA está presente com preço correto', () => {
        const item = realItems.find(i => i.id === 'CLASTERORB_RARA');
        expect(item).toBeDefined();
        expect(item.type).toBe('capture');
        expect(item.price.buy).toBe(150);
        expect(item.price.sell).toBe(50);
        expect(item.capture_bonus_pp).toBe(20);
    });

    it('IT_CAP_02 está presente como deprecated', () => {
        const item = realItems.find(i => i.id === 'IT_CAP_02');
        expect(item).toBeDefined();
        expect(item.deprecated).toBe(true);
        expect(item.replacedBy).toBe('CLASTERORB_INCOMUM');
    });

    it('todos os itens com preço de venda têm sell < buy', () => {
        for (const item of realItems) {
            if (item.price?.buy && item.price?.sell) {
                expect(item.price.sell).toBeLessThan(item.price.buy);
            }
        }
    });

    it('não existem IDs duplicados', () => {
        const ids = realItems.map(i => i.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('catálogo da loja não inclui itens deprecated', () => {
        const catalog = getShopCatalog(realItems);
        const deprecated = catalog.filter(i => i.deprecated === true);
        expect(deprecated).toHaveLength(0);
    });
});
