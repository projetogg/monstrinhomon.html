/**
 * MONSTER ASSETS INTEGRITY TESTS (PR1)
 *
 * Testes de integridade do sistema de assets visuais de monstrinhos.
 * Cobertura:
 *  - leitura e estrutura do catálogo
 *  - presença do campo image nos 8 starters
 *  - formato válido de paths de imagem
 *  - ausência de colisões de path
 *  - convenção assets/monsters/MON_XXX.png
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── IDs dos starters que devem ter campo image na PR1 ───────────────────────

const STARTER_IDS_COM_IMAGE = [
    'MON_001', // Ferrozimon  (Guerreiro)
    'MON_005', // Dinomon     (Bardo)
    'MON_009', // Miaumon     (Caçador)
    'MON_013', // Lagartomon  (Mago)
    'MON_017', // Luvursomon  (Animalista)
    'MON_028', // Nutrilo     (Curandeiro)
    'MON_029', // Tigrumo     (Bárbaro)
    'MON_030', // Furtilhon   (Ladino)
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadMonstersJson() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('Catálogo — Leitura e Estrutura', () => {
    it('deve carregar data/monsters.json sem erros', () => {
        expect(() => loadMonstersJson()).not.toThrow();
    });

    it('deve ter campo "monsters" como array', () => {
        const data = loadMonstersJson();
        expect(Array.isArray(data.monsters)).toBe(true);
    });

    it('deve ter ao menos um monstrinho', () => {
        const data = loadMonstersJson();
        expect(data.monsters.length).toBeGreaterThan(0);
    });

    it('não deve ter IDs duplicados', () => {
        const data = loadMonstersJson();
        const ids = data.monsters.map(m => m.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
    });

    it('todos os monstros com image devem manter o campo emoji', () => {
        const data = loadMonstersJson();
        for (const m of data.monsters) {
            if (m.image !== undefined) {
                expect(m.emoji, `${m.id} tem image mas não tem emoji`).toBeDefined();
                expect(typeof m.emoji).toBe('string');
            }
        }
    });
});

describe('Campo image — Starters da Primeira Leva', () => {
    const data = loadMonstersJson();
    const monsterMap = new Map(data.monsters.map(m => [m.id, m]));

    it('todos os 8 starters devem existir no catálogo', () => {
        for (const id of STARTER_IDS_COM_IMAGE) {
            expect(monsterMap.has(id), `Starter ${id} não encontrado no catálogo`).toBe(true);
        }
    });

    it('todos os 8 starters devem ter campo image definido', () => {
        for (const id of STARTER_IDS_COM_IMAGE) {
            const m = monsterMap.get(id);
            expect(m?.image, `${id} não tem campo image`).toBeDefined();
        }
    });

    it('campo image dos starters deve ser string não-vazia', () => {
        for (const id of STARTER_IDS_COM_IMAGE) {
            const m = monsterMap.get(id);
            expect(typeof m?.image).toBe('string');
            expect(m?.image.trim().length).toBeGreaterThan(0);
        }
    });

    it('monstros que não são starters não devem ter campo image', () => {
        const starterSet = new Set(STARTER_IDS_COM_IMAGE);
        for (const m of data.monsters) {
            if (!starterSet.has(m.id)) {
                expect(m.image, `${m.id} não é starter mas tem campo image`).toBeUndefined();
            }
        }
    });
});

describe('Campo image — Formato de Path', () => {
    const data = loadMonstersJson();
    const monstersComImage = data.monsters.filter(m => m.image !== undefined);

    it('paths devem começar com "assets/monsters/"', () => {
        for (const m of monstersComImage) {
            expect(
                m.image.startsWith('assets/monsters/'),
                `${m.id}: path "${m.image}" não começa com "assets/monsters/"`
            ).toBe(true);
        }
    });

    it('paths devem terminar com ".png"', () => {
        for (const m of monstersComImage) {
            expect(
                m.image.endsWith('.png'),
                `${m.id}: path "${m.image}" não termina com ".png"`
            ).toBe(true);
        }
    });

    it('paths devem seguir convenção assets/monsters/MON_XXX.png', () => {
        const pattern = /^assets\/monsters\/MON_[A-Z0-9]+\.png$/;
        for (const m of monstersComImage) {
            expect(
                pattern.test(m.image),
                `${m.id}: path "${m.image}" não segue convenção MON_XXX.png`
            ).toBe(true);
        }
    });

    it('nome do arquivo deve ser baseado no ID do monstrinho', () => {
        for (const m of monstersComImage) {
            const expectedFilename = `${m.id}.png`;
            const actualFilename = m.image.split('/').pop();
            expect(
                actualFilename,
                `${m.id}: esperado "${expectedFilename}", encontrado "${actualFilename}"`
            ).toBe(expectedFilename);
        }
    });

    it('detecta formato inválido de path (não deve haver nenhum no catálogo)', () => {
        const pattern = /^assets\/monsters\/MON_[A-Z0-9]+\.png$/;
        const invalids = monstersComImage.filter(m => !pattern.test(m.image));
        expect(invalids).toHaveLength(0);
    });
});

describe('Campo image — Colisões de Path', () => {
    const data = loadMonstersJson();
    const monstersComImage = data.monsters.filter(m => m.image !== undefined);

    it('não deve haver dois monstrinhos apontando para o mesmo path', () => {
        const pathCount = new Map();
        for (const m of monstersComImage) {
            if (!pathCount.has(m.image)) pathCount.set(m.image, []);
            pathCount.get(m.image).push(m.id);
        }

        const collisions = [...pathCount.entries()].filter(([, ids]) => ids.length > 1);
        expect(
            collisions,
            `Colisões detectadas: ${JSON.stringify(collisions)}`
        ).toHaveLength(0);
    });

    it('deve ter exatamente 8 paths únicos (um por starter)', () => {
        const paths = new Set(monstersComImage.map(m => m.image));
        expect(paths.size).toBe(STARTER_IDS_COM_IMAGE.length);
    });
});

describe('Convenção de Nomenclatura — assets/monsters/', () => {
    it('cada starter deve ter path no formato assets/monsters/MON_XXX.png', () => {
        const data = loadMonstersJson();
        const monsterMap = new Map(data.monsters.map(m => [m.id, m]));
        const pattern = /^assets\/monsters\/MON_[A-Z0-9]+\.png$/;

        for (const id of STARTER_IDS_COM_IMAGE) {
            const m = monsterMap.get(id);
            expect(
                pattern.test(m?.image || ''),
                `${id}: path inválido "${m?.image}"`
            ).toBe(true);
        }
    });

    it('paths declarados devem conter o prefixo correto "assets/monsters/"', () => {
        const data = loadMonstersJson();
        const monstersComImage = data.monsters.filter(m => m.image !== undefined);
        for (const m of monstersComImage) {
            expect(m.image).toMatch(/^assets\/monsters\//);
        }
    });
});
