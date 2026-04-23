/**
 * MONSTER VISUAL INTEGRATION TESTS (PR2)
 *
 * Testes de integração da camada visual `monsterVisual.js` nas UIs:
 * - partyDexUI.js (renderMonsterCard)
 * - eggHatchModal.js (buildHatchResultHTML)
 * - groupUI.js (buildSwapCard)
 *
 * Cobertura:
 *  - estados da Dex (unknown/seen/captured) com e sem image
 *  - egg hatch com e sem image
 *  - swap card com e sem image
 *  - ausência de image não quebra HTML
 *  - helper é o único caminho de render visual
 */

import { describe, it, expect } from 'vitest';
import { renderMonsterCard } from '../js/ui/partyDexUI.js';
import { buildHatchResultHTML } from '../js/ui/eggHatchModal.js';
import { buildSwapCard } from '../js/combat/groupUI.js';
import { renderMonsterCard as renderPlayerMonsterCard } from '../js/ui/playerPanelUI.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const templateComImagem = {
    id: 'MON_001',
    name: 'Ferrozimon',
    class: 'Guerreiro',
    rarity: 'Comum',
    emoji: '⚔️',
    image: 'assets/monsters/MON_001.png',
    baseHp: 29,
    baseAtk: 7,
    baseDef: 9,
};

const templateSemImagem = {
    id: 'MON_002',
    name: 'Cavalheiromon',
    class: 'Guerreiro',
    rarity: 'Incomum',
    emoji: '🗡️',
    baseHp: 39,
    baseAtk: 10,
    baseDef: 12,
};

const monsterHatchComImagem = {
    id: 'MI_001',
    name: 'Ferrozimon',
    class: 'Guerreiro',
    rarity: 'Comum',
    emoji: '⚔️',
    image: 'assets/monsters/MON_001.png',
    level: 1,
    hp: 29,
    hpMax: 29,
};

const monsterHatchSemImagem = {
    id: 'MI_002',
    name: 'Cavalheiromon',
    class: 'Guerreiro',
    rarity: 'Incomum',
    emoji: '🗡️',
    level: 1,
    hp: 39,
    hpMax: 39,
};

// BattleSwap mock mínimo para buildSwapCard
const mockBattleSwap = {
    getSwapStatus: () => ({ category: 'eligible', title: 'OK', label: 'Disponível' }),
};

const swapMonsterComImagem = {
    id: 'mi_001',
    name: 'Ferrozimon',
    class: 'Guerreiro',
    rarity: 'Comum',
    emoji: '⚔️',
    image: 'assets/monsters/MON_001.png',
    level: 5,
    hp: 29,
    hpMax: 29,
};

const swapMonsterSemImagem = {
    id: 'mi_002',
    name: 'Cavalheiromon',
    class: 'Guerreiro',
    rarity: 'Incomum',
    emoji: '🗡️',
    level: 3,
    hp: 39,
    hpMax: 39,
};

const mockPlayer = { id: 'p1', name: 'Ana', class: 'Guerreiro' };

// ─── PartyDexUI — estado unknown ────────────────────────────────────────────

describe('PartyDex - estado unknown', () => {
    it('deve renderizar ❓ + "???" para estado unknown', () => {
        const html = renderMonsterCard(templateComImagem, 'unknown');
        expect(html).toContain('❓');
        expect(html).toContain('???');
    });

    it('não deve revelar nome no estado unknown', () => {
        const html = renderMonsterCard(templateComImagem, 'unknown');
        expect(html).not.toContain('Ferrozimon');
    });

    it('deve usar classe dex-unknown', () => {
        const html = renderMonsterCard(templateComImagem, 'unknown');
        expect(html).toContain('dex-unknown');
    });

    it('não deve revelar nome do monstrinho em unknown', () => {
        const html = renderMonsterCard(templateComImagem, 'unknown');
        expect(html).not.toContain('Ferrozimon');
    });
});

// ─── PartyDexUI — estado seen ────────────────────────────────────────────────

describe('PartyDex - estado seen com image', () => {
    it('deve gerar <img> com silhueta quando template tem image', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('<img');
        expect(html).toContain('monster-silhouette');
    });

    it('deve usar src correto', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('src="assets/monsters/MON_001.png"');
    });

    it('não deve revelar nome em seen (nem em alt/aria-label)', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).not.toContain('Ferrozimon');
        expect(html).toContain('???');
    });

    it('deve usar classe dex-seen', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('dex-seen');
    });
});

describe('PartyDex - estado seen sem image (fallback emoji)', () => {
    it('deve gerar <span> com emoji com silhueta quando template não tem image', () => {
        const html = renderMonsterCard(templateSemImagem, 'seen');
        expect(html).toContain('<span');
        expect(html).toContain('monster-silhouette');
        expect(html).toContain('🗡️');
    });

    it('não deve gerar <img> sem image', () => {
        const html = renderMonsterCard(templateSemImagem, 'seen');
        expect(html).not.toContain('<img');
    });

    it('não deve revelar nome em seen fallback (nem em aria-label)', () => {
        const html = renderMonsterCard(templateSemImagem, 'seen');
        expect(html).not.toContain('Cavalheiromon');
        expect(html).toContain('???');
    });
});

// ─── PartyDexUI — estado captured ────────────────────────────────────────────

describe('PartyDex - estado captured com image', () => {
    it('deve gerar <img> sem silhueta para captured com image', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('<img');
        expect(html).not.toContain('monster-silhouette');
    });

    it('deve mostrar src correto', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('src="assets/monsters/MON_001.png"');
    });

    it('deve revelar nome em captured', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('Ferrozimon');
    });

    it('deve usar classe dex-captured', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('dex-captured');
    });
});

describe('PartyDex - estado captured sem image (fallback emoji)', () => {
    it('deve gerar <span> com emoji para captured sem image', () => {
        const html = renderMonsterCard(templateSemImagem, 'captured');
        expect(html).toContain('<span');
        expect(html).toContain('🗡️');
    });

    it('não deve gerar <img> sem image', () => {
        const html = renderMonsterCard(templateSemImagem, 'captured');
        expect(html).not.toContain('<img');
    });

    it('deve mostrar nome em captured fallback', () => {
        const html = renderMonsterCard(templateSemImagem, 'captured');
        expect(html).toContain('Cavalheiromon');
    });
});

describe('PartyDex - helper canônico como único caminho', () => {
    it('HTML de seen deve usar classes monster-visual', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('monster-visual');
    });

    it('HTML de captured deve usar classes monster-visual', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('monster-visual');
    });

    it('ausência de image não deve lançar erro', () => {
        expect(() => renderMonsterCard(templateSemImagem, 'captured')).not.toThrow();
        expect(() => renderMonsterCard(templateSemImagem, 'seen')).not.toThrow();
        expect(() => renderMonsterCard(templateSemImagem, 'unknown')).not.toThrow();
    });
});

// ─── Egg Hatch — buildHatchResultHTML ────────────────────────────────────────

describe('EggHatch - buildHatchResultHTML com image', () => {
    it('deve gerar <img> quando monster tem image', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('<img');
    });

    it('deve incluir src correto', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('src="assets/monsters/MON_001.png"');
    });

    it('deve incluir o nome do monstrinho', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('Ferrozimon');
    });

    it('deve incluir a classe do monstrinho', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('Guerreiro');
    });

    it('deve incluir a raridade', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('Comum');
    });

    it('deve usar classes monster-visual', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('monster-visual');
    });
});

describe('EggHatch - buildHatchResultHTML sem image (fallback emoji)', () => {
    it('deve gerar <span> com emoji quando monster não tem image', () => {
        const html = buildHatchResultHTML(monsterHatchSemImagem);
        expect(html).toContain('<span');
        expect(html).toContain('🗡️');
    });

    it('não deve gerar <img> sem image', () => {
        const html = buildHatchResultHTML(monsterHatchSemImagem);
        expect(html).not.toContain('<img');
    });

    it('deve incluir o nome em fallback', () => {
        const html = buildHatchResultHTML(monsterHatchSemImagem);
        expect(html).toContain('Cavalheiromon');
    });

    it('deve incluir o botão de confirmar', () => {
        const html = buildHatchResultHTML(monsterHatchSemImagem);
        expect(html).toContain('Confirmar');
    });

    it('ausência de image não deve lançar erro', () => {
        expect(() => buildHatchResultHTML(monsterHatchSemImagem)).not.toThrow();
    });
});

// ─── GroupUI — buildSwapCard ─────────────────────────────────────────────────

describe('GroupUI - buildSwapCard com image', () => {
    const defaultArgs = {
        monster: swapMonsterComImagem,
        index: 0,
        player: mockPlayer,
        encId: 'enc_test',
        context: 'manual',
        masterMode: false,
        BattleSwap: mockBattleSwap,
    };

    it('deve gerar <img> quando monster tem image', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).toContain('<img');
    });

    it('deve incluir src correto', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).toContain('src="assets/monsters/MON_001.png"');
    });

    it('deve incluir o nome do monstrinho', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).toContain('Ferrozimon');
    });

    it('deve usar classes monster-visual', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).toContain('monster-visual');
    });
});

describe('GroupUI - buildSwapCard sem image (fallback emoji)', () => {
    const defaultArgs = {
        monster: swapMonsterSemImagem,
        index: 1,
        player: mockPlayer,
        encId: 'enc_test',
        context: 'manual',
        masterMode: false,
        BattleSwap: mockBattleSwap,
    };

    it('deve gerar <span> com emoji quando monster não tem image', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).toContain('<span');
        expect(html).toContain('🗡️');
    });

    it('não deve gerar <img> sem image', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).not.toContain('<img');
    });

    it('deve incluir o nome do monstrinho', () => {
        const html = buildSwapCard(defaultArgs);
        expect(html).toContain('Cavalheiromon');
    });

    it('ausência de image não deve lançar erro', () => {
        expect(() => buildSwapCard(defaultArgs)).not.toThrow();
    });
});

// ─── Regressão geral ─────────────────────────────────────────────────────────

describe('Regressão - ausência de image não quebra nenhum UI', () => {
    it('partyDex renderMonsterCard unknown sem image — não lança', () => {
        expect(() => renderMonsterCard({ id: 'X', name: 'X', emoji: '❓' }, 'unknown')).not.toThrow();
    });

    it('partyDex renderMonsterCard seen sem image — gera HTML válido', () => {
        const html = renderMonsterCard({ id: 'X', name: 'X', emoji: '❓' }, 'seen');
        expect(html.length).toBeGreaterThan(0);
        expect(html).toContain('dex-seen');
    });

    it('partyDex renderMonsterCard captured sem image — gera HTML válido', () => {
        const html = renderMonsterCard({ id: 'X', name: 'TesteMon', emoji: '🔥', rarity: 'Comum', class: 'Mago' }, 'captured');
        expect(html).toContain('TesteMon');
        expect(html).toContain('monster-visual');
    });

    it('buildHatchResultHTML sem image — gera HTML válido', () => {
        const html = buildHatchResultHTML({ name: 'TesteMon', class: 'Mago', rarity: 'Raro', emoji: '🔮', level: 1, hp: 30, hpMax: 30 });
        expect(html).toContain('TesteMon');
        expect(html).toContain('monster-visual');
    });

    it('buildSwapCard sem image — gera HTML válido', () => {
        const html = buildSwapCard({
            monster: { name: 'TesteMon', emoji: '🔥', level: 1, hp: 10, hpMax: 10, class: 'Mago' },
            index: 0,
            player: mockPlayer,
            encId: 'enc_x',
            context: 'manual',
            masterMode: false,
            BattleSwap: mockBattleSwap,
        });
        expect(html).toContain('TesteMon');
        expect(html).toContain('monster-visual');
    });
});

// ─── Rollout: Dex — tamanho e variante ───────────────────────────────────────

describe('Rollout - Dex usa monster-visual--lg e variant dex', () => {
    it('captured com image deve usar monster-visual--lg', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('monster-visual--lg');
    });

    it('captured com image deve usar monster-visual--variant-dex', () => {
        const html = renderMonsterCard(templateComImagem, 'captured');
        expect(html).toContain('monster-visual--variant-dex');
    });

    it('seen com image deve usar monster-visual--lg', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('monster-visual--lg');
    });

    it('seen com image deve usar monster-visual--variant-dex', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('monster-visual--variant-dex');
    });

    it('seen continua ativando monster-silhouette', () => {
        const html = renderMonsterCard(templateComImagem, 'seen');
        expect(html).toContain('monster-silhouette');
    });

    it('captured sem image deve usar monster-visual--lg (emoji)', () => {
        const html = renderMonsterCard(templateSemImagem, 'captured');
        expect(html).toContain('monster-visual--lg');
        expect(html).toContain('monster-visual--variant-dex');
    });
});

// ─── Rollout: playerPanelUI.renderMonsterCard usa monster-visual ─────────────

const monsterParaCard = {
    id: 'MI_TEST',
    name: 'Testemon',
    class: 'Mago',
    rarity: 'Comum',
    emoji: '🔮',
    image: 'assets/monsters/MON_001.png',
    level: 5,
    hp: 40,
    hpMax: 40,
    xp: 0,
};

const monsterParaCardSemImagem = {
    id: 'MI_TEST2',
    name: 'Testemon2',
    class: 'Guerreiro',
    rarity: 'Incomum',
    emoji: '⚔️',
    level: 3,
    hp: 30,
    hpMax: 30,
    xp: 0,
};

describe('Rollout - playerPanelUI.renderMonsterCard usa helper visual', () => {
    it('deve gerar monster-visual em vez de apenas emoji direto', () => {
        const html = renderPlayerMonsterCard(monsterParaCard);
        expect(html).toContain('monster-visual');
    });

    it('deve gerar <img> quando monster tem image', () => {
        const html = renderPlayerMonsterCard(monsterParaCard);
        expect(html).toContain('<img');
    });

    it('deve usar variant box', () => {
        const html = renderPlayerMonsterCard(monsterParaCard);
        expect(html).toContain('monster-visual--variant-box');
    });

    it('deve gerar <span> com emoji quando monster não tem image', () => {
        const html = renderPlayerMonsterCard(monsterParaCardSemImagem);
        expect(html).toContain('<span');
        expect(html).toContain('⚔️');
    });

    it('ausência de image não deve quebrar o card', () => {
        expect(() => renderPlayerMonsterCard(monsterParaCardSemImagem)).not.toThrow();
    });

    it('card sem image deve conter monster-visual', () => {
        const html = renderPlayerMonsterCard(monsterParaCardSemImagem);
        expect(html).toContain('monster-visual');
    });
});

// ─── Rollout: eggHatch usa size lg ───────────────────────────────────────────

describe('Rollout - eggHatch usa monster-visual--lg', () => {
    it('buildHatchResultHTML com image deve usar monster-visual--lg', () => {
        const html = buildHatchResultHTML(monsterHatchComImagem);
        expect(html).toContain('monster-visual--lg');
    });

    it('buildHatchResultHTML sem image deve usar monster-visual--lg (emoji)', () => {
        const html = buildHatchResultHTML(monsterHatchSemImagem);
        expect(html).toContain('monster-visual--lg');
    });
});
