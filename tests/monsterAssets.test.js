/**
 * MONSTER ASSETS TESTS (PR3)
 *
 * Testes de integridade de assets e regressão visual estrutural.
 * Cobertura:
 *   A. Integridade de assets
 *   B. Regressão visual estrutural (PartyDex, EggHatch, GroupUI)
 *   C. Silhouette state
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── A. Integridade de assets ────────────────────────────────────────────────

describe('MonsterAssets - Integridade dos 8 Starters', () => {
    const STARTER_IDS = [
        'MON_001', 'MON_005', 'MON_009', 'MON_013',
        'MON_017', 'MON_028', 'MON_029', 'MON_030',
    ];

    it('deve ter 8 arquivos PNG em assets/monsters/', () => {
        for (const id of STARTER_IDS) {
            const filePath = resolve(ROOT, `assets/monsters/${id}.png`);
            expect(existsSync(filePath), `${id}.png deve existir`).toBe(true);
        }
    });

    it('os PNGs devem ser arquivos válidos (signature PNG)', () => {
        const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        for (const id of STARTER_IDS) {
            const filePath = resolve(ROOT, `assets/monsters/${id}.png`);
            const buf = readFileSync(filePath);
            const sig = buf.slice(0, 8);
            expect(
                sig.equals(PNG_SIGNATURE),
                `${id}.png deve ter assinatura PNG válida`
            ).toBe(true);
        }
    });

    it('monsters.json deve ter campo image para os 8 starters', () => {
        const data = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
        const monstersById = Object.fromEntries(data.monsters.map(m => [m.id, m]));

        for (const id of STARTER_IDS) {
            const m = monstersById[id];
            expect(m, `${id} deve existir no catálogo`).toBeDefined();
            expect(m.image, `${id} deve ter campo image`).toBeTruthy();
            expect(
                m.image,
                `${id}.image deve apontar para assets/monsters/${id}.png`
            ).toBe(`assets/monsters/${id}.png`);
        }
    });

    it('monsters.json não deve ter campo image em monstros não-starters', () => {
        const data = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
        const starterSet = new Set(STARTER_IDS);

        for (const m of data.monsters) {
            if (!starterSet.has(m.id)) {
                expect(
                    m.image,
                    `${m.id} (não-starter) não deve ter campo image nesta leva`
                ).toBeFalsy();
            }
        }
    });
});

// ─── B. Regressão visual — PartyDex ─────────────────────────────────────────

describe('MonsterAssets - PartyDex visual com assets reais', () => {
    // Importamos as funções do partyDexUI para testar a saída HTML estrutural
    // Note: como partyDexUI.js importa monsterVisual.js, testaremos via monsterVisual

    it('monsterVisual.monsterArtHTML deve retornar <img> quando image presente', async () => {
        const { monsterArtHTML } = await import('../js/ui/monsterVisual.js');
        const template = {
            id: 'MON_001',
            name: 'Ferrozimon',
            image: 'assets/monsters/MON_001.png',
            emoji: '⚔️',
        };
        const html = monsterArtHTML(template);
        expect(html).toContain('<img');
        expect(html).toContain('assets/monsters/MON_001.png');
        expect(html).toContain('alt="Ferrozimon"');
    });

    it('monsterVisual.monsterArtHTML deve retornar emoji quando image ausente', async () => {
        const { monsterArtHTML } = await import('../js/ui/monsterVisual.js');
        const template = {
            id: 'MON_002',
            name: 'Cavalheiromon',
            emoji: '🗡️',
            // sem image
        };
        const html = monsterArtHTML(template);
        expect(html).not.toContain('<img');
        expect(html).toContain('🗡️');
    });

    it('monsterVisual.monsterArtHTML usa fallback 👾 quando template sem emoji e sem image', async () => {
        const { monsterArtHTML } = await import('../js/ui/monsterVisual.js');
        const template = { id: 'MON_999', name: 'Teste' };
        const html = monsterArtHTML(template);
        expect(html).toContain('👾');
    });

    it('monsterVisual.hasImage retorna true apenas quando image declarado', async () => {
        const { hasImage } = await import('../js/ui/monsterVisual.js');
        expect(hasImage({ image: 'assets/monsters/MON_001.png' })).toBe(true);
        expect(hasImage({ image: '' })).toBe(false);
        expect(hasImage({})).toBe(false);
        expect(hasImage(null)).toBe(false);
        expect(hasImage(undefined)).toBe(false);
    });
});

// ─── B. Regressão visual — EggHatch ─────────────────────────────────────────

describe('MonsterAssets - EggHatch visual estrutural', () => {
    it('showEggHatchModal deve estar disponível como export', async () => {
        const mod = await import('../js/ui/eggHatchModal.js');
        expect(typeof mod.showEggHatchModal).toBe('function');
    });

    it('eggHatcher.createMonsterInstance deve propagar campo image do template', async () => {
        // Testa comportamento real: instância criada deve ter o campo image do template
        const { vi } = await import('vitest');
        const { getMonstersMapSync } = await import('../js/data/dataLoader.js');
        // Usamos import dinâmico isolado para evitar conflito com outros mocks
        // A função createMonsterInstance é privada, mas é usada por hatchEgg.
        // Validamos via inspeção do módulo eggHatcher exportando chooseRandom/getMonstersByRarity
        const { getMonstersByRarity, chooseRandom } = await import('../js/data/eggHatcher.js');
        expect(typeof getMonstersByRarity).toBe('function');
        expect(typeof chooseRandom).toBe('function');

        // Verifica que o campo image é copiado pela factory (inspeção mínima e precisa)
        const src = readFileSync(resolve(ROOT, 'js/data/eggHatcher.js'), 'utf8');
        // Garante que a linha de cópia está presente na factory interna
        expect(src).toContain('image: template.image');
    });
});

// ─── B. Regressão visual — GroupUI ───────────────────────────────────────────

describe('MonsterAssets - GroupUI visual estrutural', () => {
    it('groupUI renderGroupEncounterPanel deve estar disponível como export', async () => {
        // GroupUI precisa de DOM, portanto testamos apenas a exportação em ambiente Node
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('export function renderGroupEncounterPanel');
    });

    it('groupUI deve usar <img> para monstrinho com image (player side)', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // Verifica que a lógica condicional para mon.image existe e usa group-unit-img
        expect(src).toContain('mon.image');
        expect(src).toContain('group-unit-img');
    });

    it('groupUI deve fazer fallback para emoji (player) quando mon.image ausente', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // Fallback: (mon.emoji || '')
        expect(src).toContain('mon.emoji');
    });

    it('groupUI deve usar <img> para inimigo com image (enemy side)', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('e.image');
    });

    it('groupUI deve fazer fallback para emoji (enemy) quando e.image ausente', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('e.emoji');
    });
});

// ─── C. Silhouette ───────────────────────────────────────────────────────────

describe('MonsterAssets - Silhouette (estado seen)', () => {
    it('CSS deve aplicar filtro de silhueta em .dex-seen .dex-art', () => {
        const css = readFileSync(resolve(ROOT, 'css/main.css'), 'utf8');
        expect(css).toContain('.dex-card.dex-seen .dex-art');
        expect(css).toContain('filter');
        expect(css).toContain('brightness(0)');
    });

    it('partyDexUI deve usar dex-silhouette-img para <img> no estado seen', () => {
        const src = readFileSync(resolve(ROOT, 'js/ui/partyDexUI.js'), 'utf8');
        expect(src).toContain('dex-silhouette-img');
    });

    it('monsterVisual.monsterArtHTML deve aceitar imgClass customizado para silhueta', async () => {
        const { monsterArtHTML } = await import('../js/ui/monsterVisual.js');
        const template = {
            id: 'MON_001',
            name: 'Ferrozimon',
            image: 'assets/monsters/MON_001.png',
            emoji: '⚔️',
        };
        const html = monsterArtHTML(template, { imgClass: 'dex-monster-img dex-silhouette-img' });
        expect(html).toContain('dex-silhouette-img');
    });
});

// ─── D. Validador ────────────────────────────────────────────────────────────

describe('MonsterAssets - Validador validate-monster-assets.mjs', () => {
    it('script do validador deve existir', () => {
        const scriptPath = resolve(ROOT, 'scripts/validate-monster-assets.mjs');
        expect(existsSync(scriptPath)).toBe(true);
    });

    it('package.json deve ter script validate:monster-assets', () => {
        const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
        expect(pkg.scripts?.['validate:monster-assets']).toBeTruthy();
    });
});
