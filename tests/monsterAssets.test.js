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

    it('eggHatcher NÃO deve copiar image para a instância (PR3.1: image é dado do template)', async () => {
        // Regra arquitetural: image não é persistida na instância — derivar do template via templateId
        const src = readFileSync(resolve(ROOT, 'js/data/eggHatcher.js'), 'utf8');
        // A linha de cópia direta deve ter sido removida
        expect(src).not.toContain('image: template.image');
    });

    it('eggHatcher.createMonsterInstance deve incluir templateId ou monsterId para derivação de imagem', async () => {
        // A instância deve ter templateId ou monsterId para a UI derivar a imagem do catálogo
        const src = readFileSync(resolve(ROOT, 'js/data/eggHatcher.js'), 'utf8');
        expect(src).toMatch(/monsterId\s*:/);
    });

    it('eggHatchModal deve importar monsterArtHTML de monsterVisual.js (render canônico)', () => {
        const src = readFileSync(resolve(ROOT, 'js/ui/eggHatchModal.js'), 'utf8');
        expect(src).toContain('monsterVisual.js');
        expect(src).toContain('monsterArtHTML');
    });

    it('eggHatchModal.showEggHatchModal deve aceitar template como segundo parâmetro', () => {
        const src = readFileSync(resolve(ROOT, 'js/ui/eggHatchModal.js'), 'utf8');
        // Assinatura deve incluir template como segundo parâmetro
        expect(src).toMatch(/showEggHatchModal\s*\([^)]*template/);
    });
});

// ─── B. Regressão visual — GroupUI ───────────────────────────────────────────

describe('MonsterAssets - GroupUI visual estrutural', () => {
    it('groupUI renderGroupEncounterPanel deve estar disponível como export', async () => {
        // GroupUI precisa de DOM, portanto testamos apenas a exportação em ambiente Node
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('export function renderGroupEncounterPanel');
    });

    it('groupUI deve derivar imagem via templateId usando resolveUnitArt (não mon.image direto)', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // Deve usar a função helper de resolução canônica
        expect(src).toContain('resolveUnitArt');
        expect(src).toContain('group-unit-img');
    });

    it('groupUI deve importar getMonstersMapSync para lookup de template', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('getMonstersMapSync');
    });

    it('groupUI.resolveUnitArt deve fazer fallback para mon.image (compatibilidade com saves legados)', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // Fallback de compatibilidade reversa: mon.image se template não encontrado
        expect(src).toContain('mon.image');
    });

    it('groupUI.resolveUnitArt deve fazer fallback para emoji quando sem image', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // resolveUnitArt usa mon.emoji para ambos jogadores e inimigos (parâmetro genérico)
        expect(src).toContain('mon.emoji');
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

// ─── E. Arquitetura PR3.1 — image derivada do template, não persistida ────────

describe('MonsterAssets - PR3.1 Arquitetura: image derivada do template', () => {
    it('monsterVisual.js deve exportar resolveArtFromInstance', async () => {
        const mod = await import('../js/ui/monsterVisual.js');
        expect(typeof mod.resolveArtFromInstance).toBe('function');
    });

    it('resolveArtFromInstance deve retornar <img> quando template encontrado no catálogo (Map)', async () => {
        const { resolveArtFromInstance } = await import('../js/ui/monsterVisual.js');
        const catalog = new Map([
            ['MON_001', { id: 'MON_001', name: 'Ferrozimon', image: 'assets/monsters/MON_001.png', emoji: '⚔️' }],
        ]);
        const instance = { templateId: 'MON_001', name: 'Ferrozimon', emoji: '⚔️' };
        const html = resolveArtFromInstance(instance, catalog, { imgClass: 'group-unit-img' });
        expect(html).toContain('<img');
        expect(html).toContain('assets/monsters/MON_001.png');
        expect(html).toContain('group-unit-img');
    });

    it('resolveArtFromInstance deve retornar emoji quando template sem image', async () => {
        const { resolveArtFromInstance } = await import('../js/ui/monsterVisual.js');
        const catalog = new Map([
            ['MON_999', { id: 'MON_999', name: 'SemImagem', emoji: '🔥' }],
        ]);
        const instance = { templateId: 'MON_999', name: 'SemImagem', emoji: '🔥' };
        const html = resolveArtFromInstance(instance, catalog);
        expect(html).toContain('🔥');
        expect(html).not.toContain('<img');
    });

    it('resolveArtFromInstance deve aceitar Array como catálogo', async () => {
        const { resolveArtFromInstance } = await import('../js/ui/monsterVisual.js');
        const catalog = [
            { id: 'MON_001', name: 'Ferrozimon', image: 'assets/monsters/MON_001.png', emoji: '⚔️' },
        ];
        const instance = { templateId: 'MON_001', name: 'Ferrozimon' };
        const html = resolveArtFromInstance(instance, catalog);
        expect(html).toContain('<img');
        expect(html).toContain('MON_001.png');
    });

    it('resolveArtFromInstance deve usar mon.image como fallback (compatibilidade save legado)', async () => {
        const { resolveArtFromInstance } = await import('../js/ui/monsterVisual.js');
        // Sem catálogo, mas instância tem image (save antigo)
        const instance = { name: 'LegadoMon', image: 'assets/monsters/MON_001.png', emoji: '⚔️' };
        const html = resolveArtFromInstance(instance, null);
        expect(html).toContain('<img');
        expect(html).toContain('MON_001.png');
    });

    it('resolveArtFromInstance deve usar monsterId como fallback de ID (saves com schema antigo)', async () => {
        const { resolveArtFromInstance } = await import('../js/ui/monsterVisual.js');
        const catalog = new Map([
            ['MON_005', { id: 'MON_005', name: 'Dinomon', image: 'assets/monsters/MON_005.png', emoji: '🎵' }],
        ]);
        // Instância com monsterId (schema antigo do eggHatcher)
        const instance = { monsterId: 'MON_005', name: 'Dinomon', emoji: '🎵' };
        const html = resolveArtFromInstance(instance, catalog);
        expect(html).toContain('<img');
        expect(html).toContain('MON_005.png');
    });

    it('createMonsterInstanceFromTemplate em index.html NÃO deve copiar image', () => {
        const src = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
        // Linha de cópia direta de image para instância foi removida
        expect(src).not.toMatch(/image\s*:\s*template\.image/);
    });

    it('createMonsterInstanceFromTemplate em index.html deve registrar templateId para derivação', () => {
        const src = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
        expect(src).toContain('templateId: template.id');
    });

    it('showEggHatchModal deve receber template na chamada em index.html', () => {
        const src = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
        // Call site passa template como segundo argumento
        expect(src).toMatch(/showEggHatchModal\s*\(\s*newMonster\s*,\s*template\s*\)/);
    });
});
