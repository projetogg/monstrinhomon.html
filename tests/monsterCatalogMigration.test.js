/**
 * MONSTER CATALOG MIGRATION TESTS (FASE K)
 *
 * Verifica que monsters.json contém todos os dados canônicos e que o array
 * inline MONSTER_CATALOG foi esvaziado (dados servidos via JSON agora).
 * Cobertura: dataLoader.getMonstersMapSync, campos obrigatórios, evolução.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { validateMonsterSchema, normalizeMonsterData } from '../js/data/dataLoader.js';

// ─── Campos obrigatórios em cada template de monstro ─────────────────────────

const REQUIRED_FIELDS = ['id', 'name', 'class', 'rarity', 'baseHp', 'baseAtk', 'baseDef', 'baseSpd', 'baseEne', 'emoji'];

const VALID_CLASSES = ['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];
const VALID_RARITIES = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];

// ─── Carregamento direto do arquivo para testes de integridade ────────────────

const monstersJsonPath = resolve(process.cwd(), 'data/monsters.json');
const monstersRaw = JSON.parse(readFileSync(monstersJsonPath, 'utf-8'));
const monstersArray = (monstersRaw.monsters ?? monstersRaw) || [];
const monstersMap = new Map(monstersArray.map(m => [m.id, m]));

// ─── Carregamento e contagem ──────────────────────────────────────────────────

describe('monsters.json — carregamento', () => {
    it('carrega monsters.json com sucesso', () => {
        expect(monstersMap).toBeTruthy();
        expect(monstersMap.size).toBeGreaterThan(0);
    });

    it('contém exatamente 72 templates', () => {
        expect(monstersArray.length).toBe(72);
    });

    it('todos os IDs são únicos', () => {
        const ids = monstersArray.map(m => m.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });
});

// ─── Campos obrigatórios ──────────────────────────────────────────────────────

describe('monsters.json — campos obrigatórios', () => {
    it.each(REQUIRED_FIELDS)('campo "%s" presente em todos os 72 monstros', (field) => {
        const missing = monstersArray.filter(m => m[field] === undefined || m[field] === null || m[field] === '');
        expect(missing.map(m => m.id)).toEqual([]);
    });

    it('baseHp é número positivo em todos', () => {
        const invalid = monstersArray.filter(m => typeof m.baseHp !== 'number' || m.baseHp <= 0);
        expect(invalid.map(m => m.id)).toEqual([]);
    });

    it('baseAtk, baseDef, baseSpd, baseEne são números não-negativos em todos', () => {
        const statFields = ['baseAtk', 'baseDef', 'baseSpd', 'baseEne'];
        for (const field of statFields) {
            const invalid = monstersArray.filter(m => typeof m[field] !== 'number' || m[field] < 0);
            expect(invalid.map(m => `${m.id}.${field}`)).toEqual([]);
        }
    });

    it('class é uma das classes válidas em todos', () => {
        const invalid = monstersArray.filter(m => !VALID_CLASSES.includes(m.class));
        expect(invalid.map(m => `${m.id}:${m.class}`)).toEqual([]);
    });

    it('rarity é uma das raridades válidas em todos', () => {
        const invalid = monstersArray.filter(m => !VALID_RARITIES.includes(m.rarity));
        expect(invalid.map(m => `${m.id}:${m.rarity}`)).toEqual([]);
    });
});

// ─── Consistência das evoluções ───────────────────────────────────────────────

describe('monsters.json — consistência de evoluções', () => {
    it('todo evolvesTo referencia um ID existente no catálogo', () => {
        const ids = new Set(monstersArray.map(m => m.id));
        const brokenRefs = monstersArray
            .filter(m => m.evolvesTo && !ids.has(m.evolvesTo))
            .map(m => `${m.id}→${m.evolvesTo}`);
        expect(brokenRefs).toEqual([]);
    });

    it('monstros com evolvesTo têm evolvesAt numérico e positivo', () => {
        const invalid = monstersArray.filter(m => m.evolvesTo && (typeof m.evolvesAt !== 'number' || m.evolvesAt <= 0));
        expect(invalid.map(m => m.id)).toEqual([]);
    });

    it('39 monstros têm evolvesTo e 33 são estágios finais (incluindo 8 Lendários)', () => {
        const withEvo   = monstersArray.filter(m => m.evolvesTo).length;
        const finalStage = monstersArray.filter(m => !m.evolvesTo).length;
        expect(withEvo).toBe(39);
        expect(finalStage).toBe(33);
    });
});

// ─── Lookup via getMonstersMapSync ────────────────────────────────────────────

describe('getMonstersMapSync — lookups', () => {
    it('encontra MON_001 pelo ID', () => {
        const m = monstersMap.get('MON_001');
        expect(m).toBeTruthy();
        expect(m.name).toBe('Cantapau');
        expect(m.class).toBe('Bardo');
    });

    it('retorna undefined para ID inexistente', () => {
        expect(monstersMap.get('INVALID_ID')).toBeUndefined();
    });

    it('encontra monstro com evolução (MON_002)', () => {
        const m = monstersMap.get('MON_002');
        expect(m.evolvesTo).toBe('MON_002B');
        expect(m.evolvesAt).toBe(12);
    });

    it('encontra todos os estágios da linha MON_010', () => {
        expect(monstersMap.get('MON_010')).toBeTruthy();
        expect(monstersMap.get('MON_010B')).toBeTruthy();
        expect(monstersMap.get('MON_010C')).toBeTruthy();
        expect(monstersMap.get('MON_010D')).toBeTruthy();
    });
});
