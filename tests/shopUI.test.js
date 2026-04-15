/**
 * SHOP UI TESTS (Fase Z)
 *
 * Testa as funções de renderização pura do módulo js/ui/shopUI.js:
 * - renderShopItems(items, config)               → HTML dos itens da loja
 * - renderPlayerInventory(player, items, config) → HTML do inventário do jogador
 *
 * Cobertura:
 * - Itens aparecem corretamente (nome, tier, descrição)
 * - Preços estão formatados (💰 X)
 * - Botões de compra são emitidos com playerId e itemId corretos
 * - Botões de venda são emitidos com playerId, itemId e qty corretos
 * - Estados desabilitados (sem dinheiro, item equipado, não vendável)
 * - Itens do tipo ovo (egg) mostram botão de chocar
 * - Edge cases: arrays vazios, jogador sem inventário, etc.
 */

import { describe, it, expect } from 'vitest';
import { renderShopItems, renderPlayerInventory } from '../js/ui/shopUI.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeItem(overrides = {}) {
    return {
        id: 'IT_ATK_COMUM',
        name: 'Amuleto de Força',
        description: 'Aumenta o ataque.',
        tier: 'comum',
        category: 'equipment',
        price: { buy: 50, sell: 25 },
        stats: { atk: 2, def: 0 },
        ...overrides
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'player_01',
        name: 'Testador',
        class: 'Guerreiro',
        money: 200,
        inventory: {},
        team: [],
        ...overrides
    };
}

// ─── renderShopItems ──────────────────────────────────────────────────────────

describe('renderShopItems', () => {

    describe('Lista vazia / sem itens comprável', () => {
        it('retorna mensagem quando array de itens é vazio', () => {
            const html = renderShopItems([], { money: 100, inventory: {}, playerId: 'p1' });
            expect(html).toContain('Nenhum item disponível');
        });

        it('retorna mensagem quando nenhum item tem price.buy', () => {
            const items = [makeItem({ price: {} }), makeItem({ price: { buy: 0 } })];
            const html = renderShopItems(items, { money: 100, inventory: {}, playerId: 'p1' });
            expect(html).toContain('Nenhum item disponível para compra');
        });

        it('retorna mensagem quando items não é array', () => {
            const html = renderShopItems(null, { money: 100 });
            expect(html).toContain('Nenhum item disponível');
        });
    });

    describe('Exibição de item', () => {
        it('mostra o nome do item', () => {
            const items = [makeItem({ name: 'Espada Sagrada' })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('Espada Sagrada');
        });

        it('mostra a descrição do item', () => {
            const items = [makeItem({ description: 'Uma espada muito poderosa.' })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('Uma espada muito poderosa.');
        });

        it('mostra o tier do item', () => {
            const items = [makeItem({ tier: 'raro' })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('raro');
        });

        it('mostra badge de ovo para itens do tipo egg', () => {
            const items = [makeItem({ category: 'egg', name: 'Ovo Comum' })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('🥚 OVO');
        });

        it('mostra stats quando disponíveis', () => {
            const items = [makeItem({ stats: { atk: 3, def: 0 } })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('ATK +3');
        });

        it('mostra aviso de quebra quando break.enabled = true', () => {
            const items = [makeItem({ break: { enabled: true, chance: 0.3 } })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('Pode quebrar');
            expect(html).toContain('30%');
        });

        it('mostra quantidade que o jogador possui', () => {
            const items = [makeItem({ id: 'IT_X' })];
            const html = renderShopItems(items, { money: 200, inventory: { 'IT_X': 3 }, playerId: 'p1' });
            expect(html).toContain('3x');
        });
    });

    describe('Formatação de preço', () => {
        it('mostra o preço com ícone de moeda', () => {
            const items = [makeItem({ price: { buy: 75 } })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('💰 75');
        });

        it('ordena itens por preço crescente', () => {
            const items = [
                makeItem({ id: 'item_caro',   name: 'Item Caro',   price: { buy: 200 } }),
                makeItem({ id: 'item_barato', name: 'Item Barato', price: { buy: 10  } }),
                makeItem({ id: 'item_medio',  name: 'Item Médio',  price: { buy: 50  } })
            ];
            const html = renderShopItems(items, { money: 500, inventory: {}, playerId: 'p1' });
            const posBa = html.indexOf('Item Barato');
            const posMd = html.indexOf('Item Médio');
            const posCa = html.indexOf('Item Caro');
            expect(posBa).toBeLessThan(posMd);
            expect(posMd).toBeLessThan(posCa);
        });
    });

    describe('Botões de compra', () => {
        it('botão de comprar contém playerId e itemId corretos', () => {
            const items = [makeItem({ id: 'IT_ESPADA', price: { buy: 50 } })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'player_42' });
            expect(html).toContain("buyItem('player_42', 'IT_ESPADA')");
        });

        it('botão habilitado quando jogador pode pagar', () => {
            const items = [makeItem({ price: { buy: 50 } })];
            const html = renderShopItems(items, { money: 200, inventory: {}, playerId: 'p1' });
            expect(html).toContain('✓ Comprar');
            expect(html).not.toContain('disabled');
        });

        it('botão desabilitado quando jogador não tem dinheiro suficiente', () => {
            const items = [makeItem({ price: { buy: 500 } })];
            const html = renderShopItems(items, { money: 50, inventory: {}, playerId: 'p1' });
            expect(html).toContain('✗ Sem dinheiro');
            expect(html).toContain('disabled');
        });

        it('botão desabilitado quando money = 0 e item tem preço', () => {
            const items = [makeItem({ price: { buy: 10 } })];
            const html = renderShopItems(items, { money: 0, inventory: {}, playerId: 'p1' });
            expect(html).toContain('disabled');
        });

        it('botão habilitado quando money exatamente igual ao preço', () => {
            const items = [makeItem({ price: { buy: 100 } })];
            const html = renderShopItems(items, { money: 100, inventory: {}, playerId: 'p1' });
            expect(html).toContain('✓ Comprar');
        });
    });

    describe('Config defaults', () => {
        it('funciona sem config (usa defaults)', () => {
            const items = [makeItem({ price: { buy: 10 } })];
            // money default = 0, então botão deve estar desabilitado
            const html = renderShopItems(items);
            expect(html).toContain('disabled');
        });
    });
});

// ─── renderPlayerInventory ────────────────────────────────────────────────────

describe('renderPlayerInventory', () => {

    describe('Estados vazios / sem jogador', () => {
        it('retorna mensagem quando player é null', () => {
            const html = renderPlayerInventory(null, []);
            expect(html).toContain('Nenhum jogador selecionado');
        });

        it('retorna mensagem quando inventário está vazio', () => {
            const player = makePlayer({ inventory: {} });
            const html = renderPlayerInventory(player, []);
            expect(html).toContain('Seu inventário está vazio');
        });

        it('retorna mensagem quando todos os itens têm qty = 0', () => {
            const player = makePlayer({ inventory: { 'IT_X': 0 } });
            const html = renderPlayerInventory(player, [makeItem({ id: 'IT_X' })]);
            expect(html).toContain('Seu inventário está vazio');
        });
    });

    describe('Exibição de item no inventário', () => {
        it('mostra o nome do item', () => {
            const item = makeItem({ id: 'IT_X', name: 'Poção de Cura' });
            const player = makePlayer({ inventory: { 'IT_X': 2 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('Poção de Cura');
        });

        it('mostra a quantidade que o jogador tem', () => {
            const item = makeItem({ id: 'IT_X' });
            const player = makePlayer({ inventory: { 'IT_X': 5 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('5x');
        });

        it('mostra a descrição do item', () => {
            const item = makeItem({ id: 'IT_X', description: 'Cura 50% do HP.' });
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('Cura 50% do HP.');
        });

        it('mostra o tier do item', () => {
            const item = makeItem({ id: 'IT_X', tier: 'incomum' });
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('incomum');
        });

        it('mostra placeholder para item desconhecido (não está no catálogo)', () => {
            const player = makePlayer({ inventory: { 'ID_ANTIGO': 1 } });
            const html = renderPlayerInventory(player, []);
            expect(html).toContain('Item desconhecido');
            expect(html).toContain('ID_ANTIGO');
        });
    });

    describe('Preço de venda', () => {
        it('mostra o preço de venda quando item é vendável', () => {
            // buy=50, sell não explícito → floor(50*0.5)=25
            const item = makeItem({ id: 'IT_X', price: { buy: 50 } });
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('Vender por 25');
        });

        it('mostra preço de venda explícito quando definido', () => {
            const item = makeItem({ id: 'IT_X', price: { buy: 100, sell: 30 } });
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('Vender por 30');
        });

        it('mostra "Não vendável" para item sem preço de compra', () => {
            const item = makeItem({ id: 'IT_X', price: {} });
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('Não vendável');
        });
    });

    describe('Botões de venda', () => {
        it('botão de vender contém playerId, itemId e qty=1 corretos', () => {
            const item = makeItem({ id: 'IT_ESPADA', price: { buy: 50 } });
            const player = makePlayer({ id: 'player_42', inventory: { 'IT_ESPADA': 2 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain("sellItem('player_42', 'IT_ESPADA', 1)");
        });

        it('botão habilitado quando item pode ser vendido', () => {
            const item = makeItem({ id: 'IT_X', price: { buy: 50 } });
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            // botão de venda (btn-warning) não deve ter disabled
            expect(html).toContain('btn-warning');
            expect(html).not.toContain('disabled');
        });

        it('botão desabilitado quando item está equipado', () => {
            const item = makeItem({ id: 'IT_X', price: { buy: 50 } });
            const player = makePlayer({
                inventory: { 'IT_X': 1 },
                team: [{ heldItemId: 'IT_X', name: 'Monstro A' }]
            });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('🔒 Equipado');
            expect(html).toContain('disabled');
        });

        it('botão desabilitado quando item não tem preço de venda', () => {
            const item = makeItem({ id: 'IT_X', price: { buy: 1 } }); // buy=1 → não vendável
            const player = makePlayer({ inventory: { 'IT_X': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('✗ Não vendável');
            expect(html).toContain('disabled');
        });

        it('mostra aviso de item equipado', () => {
            const item = makeItem({ id: 'IT_X', price: { buy: 50 } });
            const player = makePlayer({
                inventory: { 'IT_X': 1 },
                team: [{ heldItemId: 'IT_X', name: 'Monstro A' }]
            });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('⚠️ Item equipado em um monstro');
        });
    });

    describe('Itens do tipo ovo (egg)', () => {
        it('mostra badge de ovo', () => {
            const item = makeItem({ id: 'EGG_C', category: 'egg', name: 'Ovo Comum' });
            const player = makePlayer({ inventory: { 'EGG_C': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain('🥚 OVO');
        });

        it('mostra botão de chocar ovo com playerId e itemId corretos', () => {
            const item = makeItem({ id: 'EGG_C', category: 'egg' });
            const player = makePlayer({ id: 'player_99', inventory: { 'EGG_C': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).toContain("hatchEggFromInventory('player_99', 'EGG_C')");
            expect(html).toContain('🐣 Chocar Ovo');
        });

        it('não mostra botão de vender para ovos', () => {
            const item = makeItem({ id: 'EGG_C', category: 'egg', price: { buy: 100 } });
            const player = makePlayer({ inventory: { 'EGG_C': 1 } });
            const html = renderPlayerInventory(player, [item]);
            expect(html).not.toContain('sellItem');
        });
    });

    describe('Múltiplos itens e ordenação', () => {
        it('ordena itens por nome alfabeticamente', () => {
            const itemA = makeItem({ id: 'IT_A', name: 'Zzz Amuleto' });
            const itemB = makeItem({ id: 'IT_B', name: 'Aaa Poção' });
            const player = makePlayer({ inventory: { 'IT_A': 1, 'IT_B': 1 } });
            const html = renderPlayerInventory(player, [itemA, itemB]);
            const posA = html.indexOf('Zzz Amuleto');
            const posB = html.indexOf('Aaa Poção');
            expect(posB).toBeLessThan(posA);
        });

        it('renderiza múltiplos itens no inventário', () => {
            const item1 = makeItem({ id: 'IT_1', name: 'Item Um', price: { buy: 20 } });
            const item2 = makeItem({ id: 'IT_2', name: 'Item Dois', price: { buy: 40 } });
            const player = makePlayer({ inventory: { 'IT_1': 2, 'IT_2': 3 } });
            const html = renderPlayerInventory(player, [item1, item2]);
            expect(html).toContain('Item Um');
            expect(html).toContain('Item Dois');
        });
    });
});
