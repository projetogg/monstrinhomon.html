/**
 * MONSTER ASSETS TESTS (PR3 / Leva 2)
 *
 * Testes de integridade de assets e regressão visual estrutural.
 * Cobertura:
 *   A. Integridade de assets — lote completo MON_001-020 + starters MON_028-030
 *   B. Regressão visual estrutural (PartyDex, EggHatch, GroupUI)
 *   C. Silhouette state
 *   D. Validador
 *   E. Arquitetura PR3.1
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── A. Integridade de assets ────────────────────────────────────────────────

describe('MonsterAssets - Integridade do Lote MON_001-020', () => {
    // Lote completo: 5 famílias × 4 evoluções (001-004, 005-008, 009-012, 013-016, 017-020)
    const LOTE_IDS = [
        'MON_001', 'MON_002', 'MON_003', 'MON_004',
        'MON_005', 'MON_006', 'MON_007', 'MON_008',
        'MON_009', 'MON_010', 'MON_011', 'MON_012',
        'MON_013', 'MON_014', 'MON_015', 'MON_016',
        'MON_017', 'MON_018', 'MON_019', 'MON_020',
    ];

    // MON_028-030 são starters de lotes anteriores — image legítima, mantida
    const LOTE_ANTERIOR_IDS = ['MON_028', 'MON_029', 'MON_030'];

    it('deve ter 20 arquivos PNG em assets/monsters/ (lote MON_001-020)', () => {
        for (const id of LOTE_IDS) {
            const filePath = resolve(ROOT, `assets/monsters/${id}.png`);
            expect(existsSync(filePath), `${id}.png deve existir`).toBe(true);
        }
    });

    it('os 20 PNGs devem ser arquivos válidos (signature PNG)', () => {
        const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
        for (const id of LOTE_IDS) {
            const filePath = resolve(ROOT, `assets/monsters/${id}.png`);
            const buf = readFileSync(filePath);
            const sig = buf.slice(0, 8);
            expect(
                sig.equals(PNG_SIGNATURE),
                `${id}.png deve ter assinatura PNG válida`
            ).toBe(true);
        }
    });

    it('monsters.json deve ter campo image para todos os 20 do lote', () => {
        const data = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
        const monstersById = Object.fromEntries(data.monsters.map(m => [m.id, m]));

        for (const id of LOTE_IDS) {
            const m = monstersById[id];
            expect(m, `${id} deve existir no catálogo`).toBeDefined();
            expect(m.image, `${id} deve ter campo image`).toBeTruthy();
            expect(
                m.image,
                `${id}.image deve apontar para assets/monsters/${id}.png`
            ).toBe(`assets/monsters/${id}.png`);
        }
    });

    it('monsters.json deve manter campo image nos starters do lote anterior (MON_028-030)', () => {
        const data = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
        const monstersById = Object.fromEntries(data.monsters.map(m => [m.id, m]));

        for (const id of LOTE_ANTERIOR_IDS) {
            const m = monstersById[id];
            expect(m, `${id} deve existir no catálogo`).toBeDefined();
            expect(m.image, `${id} deve manter campo image do lote anterior`).toBeTruthy();
            expect(m.image).toBe(`assets/monsters/${id}.png`);
        }
    });

    it('guard rail: MON_021-027 NÃO devem ter campo image (bloqueados — editorial pendente)', () => {
        const data = JSON.parse(readFileSync(resolve(ROOT, 'data/monsters.json'), 'utf8'));
        const BLOCKED_IDS = ['MON_021', 'MON_022', 'MON_023', 'MON_024', 'MON_025', 'MON_026', 'MON_027'];

        for (const m of data.monsters) {
            if (BLOCKED_IDS.includes(m.id)) {
                expect(
                    m.image,
                    `${m.id} (bloqueado) não deve ter campo image — conflito editorial pendente`
                ).toBeFalsy();
            }
        }
    });
});

// ─── B. Regressão visual — PartyDex ─────────────────────────────────────────

describe('MonsterAssets - PartyDex visual com assets reais', () => {
    // Testa via getMonsterVisualHTML (API canônica do novo monsterVisual.js)

    it('monsterVisual.getMonsterVisualHTML deve retornar <img> quando image presente', async () => {
        const { getMonsterVisualHTML } = await import('../js/ui/monsterVisual.js');
        const template = {
            id: 'MON_001',
            name: 'Ferrozimon',
            image: 'assets/monsters/MON_001.png',
            emoji: '⚔️',
        };
        const html = getMonsterVisualHTML(template);
        expect(html).toContain('<img');
        expect(html).toContain('assets/monsters/MON_001.png');
        expect(html).toContain('alt="Ferrozimon"');
    });

    it('monsterVisual.getMonsterVisualHTML deve retornar emoji quando image ausente', async () => {
        const { getMonsterVisualHTML } = await import('../js/ui/monsterVisual.js');
        const template = {
            id: 'MON_002',
            name: 'Cavalheiromon',
            emoji: '🗡️',
            // sem image
        };
        const html = getMonsterVisualHTML(template);
        expect(html).not.toContain('<img');
        expect(html).toContain('🗡️');
    });

    it('monsterVisual.getMonsterVisualHTML usa fallback ❓ quando template sem emoji e sem image', async () => {
        const { getMonsterVisualHTML } = await import('../js/ui/monsterVisual.js');
        const template = { id: 'MON_999', name: 'Teste' };
        const html = getMonsterVisualHTML(template);
        expect(html).toContain('❓');
    });

    it('monsterVisual.getMonsterVisualData retorna type=image apenas quando image declarado', async () => {
        const { getMonsterVisualData } = await import('../js/ui/monsterVisual.js');
        expect(getMonsterVisualData({ image: 'assets/monsters/MON_001.png', name: 'X', emoji: '⚔️' }).type).toBe('image');
        expect(getMonsterVisualData({ image: '', name: 'X', emoji: '⚔️' }).type).toBe('emoji');
        expect(getMonsterVisualData({ name: 'X', emoji: '⚔️' }).type).toBe('emoji');
        expect(getMonsterVisualData(null).type).toBe('emoji');
        expect(getMonsterVisualData(undefined).type).toBe('emoji');
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

    it('eggHatchModal deve importar getMonsterVisualHTML de monsterVisual.js (render canônico)', () => {
        const src = readFileSync(resolve(ROOT, 'js/ui/eggHatchModal.js'), 'utf8');
        expect(src).toContain('monsterVisual.js');
        expect(src).toContain('getMonsterVisualHTML');
    });

    it('eggHatchModal.showEggHatchModal deve estar disponível como export de função', async () => {
        const src = readFileSync(resolve(ROOT, 'js/ui/eggHatchModal.js'), 'utf8');
        expect(src).toContain('showEggHatchModal');
    });
});

// ─── B. Regressão visual — GroupUI ───────────────────────────────────────────

describe('MonsterAssets - GroupUI visual estrutural', () => {
    it('groupUI renderGroupEncounterPanel deve estar disponível como export', async () => {
        // GroupUI precisa de DOM, portanto testamos apenas a exportação em ambiente Node
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('export function renderGroupEncounterPanel');
    });

    it('groupUI deve usar getMonsterVisualHTML para renderizar unidades (não resolveUnitArt)', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // API canônica: getMonsterVisualHTML de monsterVisual.js
        expect(src).toContain('getMonsterVisualHTML');
        expect(src).toContain('monsterVisual.js');
    });

    it('groupUI deve importar getMonsterVisualHTML de monsterVisual.js', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain('getMonsterVisualHTML');
    });

    it('groupUI aplica size sm para miniaturas das unidades', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        expect(src).toContain("size: 'sm'");
    });

    it('groupUI NÃO deve conter resolveUnitArt (função removida na refatoração)', () => {
        const src = readFileSync(resolve(ROOT, 'js/combat/groupUI.js'), 'utf8');
        // resolveUnitArt foi substituído por getMonsterVisualHTML
        expect(src).not.toContain('resolveUnitArt');
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

    it('partyDexUI deve usar opção silhouette:true de getMonsterVisualHTML para estado seen', () => {
        const src = readFileSync(resolve(ROOT, 'js/ui/partyDexUI.js'), 'utf8');
        expect(src).toContain('silhouette: true');
    });

    it('monsterVisual.getMonsterVisualHTML deve aceitar opção silhouette:true', async () => {
        const { getMonsterVisualHTML } = await import('../js/ui/monsterVisual.js');
        const template = {
            id: 'MON_001',
            name: 'Ferrozimon',
            image: 'assets/monsters/MON_001.png',
            emoji: '⚔️',
        };
        const html = getMonsterVisualHTML(template, { silhouette: true });
        expect(html).toContain('monster-silhouette');
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

// ─── E. Arquitetura — image derivada do template, não persistida ────────

describe('MonsterAssets - Arquitetura: image derivada do template', () => {
    it('monsterVisual.js deve exportar getMonsterVisualHTML', async () => {
        const mod = await import('../js/ui/monsterVisual.js');
        expect(typeof mod.getMonsterVisualHTML).toBe('function');
    });

    it('monsterVisual.js deve exportar getMonsterVisualData', async () => {
        const mod = await import('../js/ui/monsterVisual.js');
        expect(typeof mod.getMonsterVisualData).toBe('function');
    });

    it('getMonsterVisualHTML deve retornar <img> quando monster tem image', async () => {
        const { getMonsterVisualHTML } = await import('../js/ui/monsterVisual.js');
        const monster = { id: 'MON_001', name: 'Ferrozimon', image: 'assets/monsters/MON_001.png', emoji: '⚔️' };
        const html = getMonsterVisualHTML(monster, { size: 'sm' });
        expect(html).toContain('<img');
        expect(html).toContain('assets/monsters/MON_001.png');
    });

    it('getMonsterVisualHTML deve retornar emoji quando monster sem image', async () => {
        const { getMonsterVisualHTML } = await import('../js/ui/monsterVisual.js');
        const monster = { id: 'MON_999', name: 'SemImagem', emoji: '🔥' };
        const html = getMonsterVisualHTML(monster);
        expect(html).toContain('🔥');
        expect(html).not.toContain('<img');
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

    it('eggHatcher.js NÃO deve copiar image para a instância', () => {
        const src = readFileSync(resolve(ROOT, 'js/data/eggHatcher.js'), 'utf8');
        expect(src).not.toContain('image: template.image');
    });
});
