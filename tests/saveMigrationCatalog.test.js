/**
 * SAVE MIGRATION — CATALOG REBASE FASE 1 TESTS
 *
 * Testes para js/data/catalogMigration.js
 *
 * Cobertura:
 *   A. Instância antiga com templateId legado → migração correta
 *   B. Evolução após migração (nível abaixo do threshold)
 *   C. Nível já acima do marco → reconciliação para estágio correto
 *   D. Dex stale + team migrado → Dex reconstruída a partir da posse real
 *   E. Classe do jogador — não gerada artificialmente errada por migração
 *   F. Save atual já coerente → sem regressão (idempotência)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    CATALOG_REBASE_MAP,
    isLegacyTemplateId,
    migrateMonsterInstance,
    migrateAllInstances,
    collectAllMonsterInstances,
    collectPossessedTemplateIds,
    rebuildDexFromPossession,
    applyCatalogMigration,
} from '../js/data/catalogMigration.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

/** Cria uma instância de monstro com campos mínimos. */
function makeInstance(templateId, overrides = {}) {
    return {
        instanceId: `mi_test_${Math.random().toString(36).slice(2)}`,
        templateId,
        name: 'Placeholder',
        class: 'Desconhecido',
        rarity: 'Comum',
        emoji: '❓',
        level: 1,
        xp: 0,
        hp: 30, hpMax: 30,
        atk: 5, def: 5, spd: 5, eneMax: 8, ene: 8,
        evolvesTo: null,
        evolvesAt: null,
        buffs: [],
        statusEffects: [],
        ...overrides,
    };
}

/** Estado mínimo de jogo com um jogador e um monstro no time. */
function makeState(overrides = {}) {
    return {
        meta: { saveVersion: 1 },
        players: [],
        monsters: [],
        sharedBox: [],
        partyDex: { entries: {}, meta: { lastMilestoneAwarded: 0 } },
        monstrodex: { seen: [], captured: [] },
        ...overrides,
    };
}

// ─── A. Instância com templateId legado ──────────────────────────────────────

describe('migrateMonsterInstance — templateId legado', () => {
    it('migra MON_010 para MON_001 (linha Ferrozimon)', () => {
        const mon = makeInstance('MON_010', { level: 5 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(true);
        expect(result.oldId).toBe('MON_010');
        expect(mon.templateId).toBe('MON_001');
        expect(mon.name).toBe('Ferrozimon');
        expect(mon.class).toBe('Guerreiro');
        expect(mon.rarity).toBe('Comum');
        expect(mon.emoji).toBe('⚔️');
        expect(mon.evolvesTo).toBe('MON_002');
        expect(mon.evolvesAt).toBe(12);
    });

    it('migra MON_013 para MON_009 (linha Miaumon)', () => {
        const mon = makeInstance('MON_013', { level: 3 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(true);
        expect(mon.templateId).toBe('MON_009');
        expect(mon.name).toBe('Miaumon');
        expect(mon.class).toBe('Caçador');
    });

    it('migra MON_014 para MON_013 (linha Lagartomon)', () => {
        const mon = makeInstance('MON_014', { level: 2 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_013');
        expect(mon.name).toBe('Lagartomon');
        expect(mon.class).toBe('Mago');
    });

    it('migra MON_012 para MON_017 (linha Luvursomon)', () => {
        const mon = makeInstance('MON_012', { level: 1 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_017');
        expect(mon.name).toBe('Luvursomon');
        expect(mon.class).toBe('Animalista');
    });

    it('migra MON_011 para MON_005 (linha Dinomon)', () => {
        const mon = makeInstance('MON_011', { level: 1 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_005');
        expect(mon.name).toBe('Dinomon');
        expect(mon.class).toBe('Bardo');
    });

    it('migra todos os 20 IDs legados corretamente (classe coerente)', () => {
        // Mapa esperado de ID legado → classe canônica que deve resultar
        const expectedClass = {
            'MON_010': 'Guerreiro', 'MON_010B': 'Guerreiro', 'MON_010C': 'Guerreiro', 'MON_010D': 'Guerreiro',
            'MON_011': 'Bardo',     'MON_011B': 'Bardo',     'MON_011C': 'Bardo',     'MON_011D': 'Bardo',
            'MON_013': 'Caçador',   'MON_013B': 'Caçador',   'MON_013C': 'Caçador',   'MON_013D': 'Caçador',
            'MON_014': 'Mago',      'MON_014B': 'Mago',      'MON_014C': 'Mago',      'MON_014D': 'Mago',
            'MON_012': 'Animalista','MON_012B': 'Animalista','MON_012C': 'Animalista', 'MON_012D': 'Animalista',
        };
        for (const [oldId] of Object.entries(CATALOG_REBASE_MAP)) {
            const mon = makeInstance(oldId, { level: 1 });
            const result = migrateMonsterInstance(mon);
            expect(result.migrated).toBe(true);
            expect(result.oldId).toBe(oldId);
            // templateId foi alterado (não é mais o legado)
            expect(mon.templateId).not.toBe(oldId);
            // Classe deve estar correta para a linha
            expect(mon.class).toBe(expectedClass[oldId]);
        }
    });

    it('remove campos legados monsterId/baseId/idBase após migração', () => {
        const mon = {
            monsterId: 'MON_010',
            baseId: 'MON_010',
            idBase: 'MON_010',
            name: 'Velho',
            level: 1,
        };
        migrateMonsterInstance(mon);

        expect(mon.monsterId).toBeUndefined();
        expect(mon.baseId).toBeUndefined();
        expect(mon.idBase).toBeUndefined();
        expect(mon.templateId).toBe('MON_001');
    });

    it('não altera instância com ID canônico atual (sem migração)', () => {
        const mon = makeInstance('MON_001', { level: 5, name: 'Ferrozimon' });
        const original = { ...mon };
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_001');
        expect(mon.name).toBe(original.name);
    });

    it('não altera instância com ID não mapeado (ex.: MON_021)', () => {
        const mon = makeInstance('MON_021', { level: 5, name: 'Tamborilhomon' });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_021');
        expect(mon.name).toBe('Tamborilhomon');
    });

    it('preserva HP e stats numéricos após migração', () => {
        const mon = makeInstance('MON_010', { level: 5, hp: 18, hpMax: 35, atk: 9, def: 12 });
        migrateMonsterInstance(mon);

        // HP e stats existentes devem ser preservados (não recalculados)
        expect(mon.hp).toBe(18);
        expect(mon.hpMax).toBe(35);
        expect(mon.atk).toBe(9);
        expect(mon.def).toBe(12);
    });

    it('atualiza canonSpeciesId se presente', () => {
        const mon = makeInstance('MON_010', { level: 5, canonSpeciesId: 'shieldhorn' });
        migrateMonsterInstance(mon);

        // canonSpeciesId deve ser atualizado para o novo templateId
        expect(mon.canonSpeciesId).toBe(mon.templateId);
    });
});

// ─── B. Evolução após migração (nível abaixo do threshold) ───────────────────

describe('migrateMonsterInstance — evolução (nível abaixo do threshold)', () => {
    it('instância migrada de MON_010B (nível 5) fica em MON_002 com evolução correta', () => {
        // MON_010B → MON_002 (evolvesAt=25); nível 5 < 25
        const mon = makeInstance('MON_010B', { level: 5 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_002');
        expect(mon.name).toBe('Cavalheiromon');
        expect(mon.evolvesTo).toBe('MON_003');
        expect(mon.evolvesAt).toBe(25);
    });

    it('instância migrada de MON_013B (nível 15) fica em MON_010 com evolução correta', () => {
        // MON_013B → MON_010 (evolvesAt=25); nível 15 < 25
        const mon = makeInstance('MON_013B', { level: 15 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_010');
        expect(mon.name).toBe('Gatunamon');
        expect(mon.evolvesTo).toBe('MON_011');
        expect(mon.evolvesAt).toBe(25);
    });

    it('instância migrada de MON_014B (nível 20) fica em MON_014 sem avançar', () => {
        // MON_014B → MON_014 (Salamandromon, evolvesAt=25); nível 20 < 25
        const mon = makeInstance('MON_014B', { level: 20 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_014');
        expect(mon.name).toBe('Salamandromon');
        expect(mon.evolvesTo).toBe('MON_015');
        expect(mon.evolvesAt).toBe(25);
    });
});

// ─── C. Nível já acima do marco — reconciliação retroativa ───────────────────

describe('migrateMonsterInstance — reconciliação evolutiva retroativa', () => {
    it('instância legada no estágio base com nível 15 avança para estágio 2 (MON_001 → MON_002)', () => {
        // MON_010 (antigo base) → MON_001 (novo base, evolvesAt=12)
        // Nível 15 >= 12 → deve avançar para MON_002 (evolvesAt=25)
        // Nível 15 < 25 → para aqui
        const mon = makeInstance('MON_010', { level: 15 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(true);
        expect(mon.templateId).toBe('MON_002');
        expect(mon.name).toBe('Cavalheiromon');
        expect(mon.class).toBe('Guerreiro');
        expect(mon.evolvesTo).toBe('MON_003');
        expect(mon.evolvesAt).toBe(25);
    });

    it('instância legada no estágio base com nível 30 avança para estágio 3 (MON_001 → MON_003)', () => {
        // MON_010 → MON_001 (evolvesAt=12) → MON_002 (evolvesAt=25) → MON_003 (evolvesAt=45)
        // Nível 30: 30 >= 12, 30 >= 25, 30 < 45 → para em MON_003
        const mon = makeInstance('MON_010', { level: 30 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_003');
        expect(mon.name).toBe('Kinguespinhomon');
        expect(mon.evolvesTo).toBe('MON_004');
        expect(mon.evolvesAt).toBe(45);
    });

    it('instância legada no estágio base com nível 50 chega ao estágio final (MON_001 → MON_004)', () => {
        // Nível 50 >= 45 → MON_004 (sem evolução)
        const mon = makeInstance('MON_010', { level: 50 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_004');
        expect(mon.name).toBe('Arconouricomon');
        expect(mon.evolvesTo).toBe(null);
        expect(mon.evolvesAt).toBe(null);
    });

    it('instância em estágio intermediário legado com nível alto avança mais (MON_011B nível 50)', () => {
        // MON_011B → MON_006 (evolvesAt=25) → MON_007 (evolvesAt=45) → MON_008 (sem evolução)
        // Nível 50 >= 25, >= 45 → MON_008
        const mon = makeInstance('MON_011B', { level: 50 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_008');
        expect(mon.name).toBe('Giganotometalmon');
        expect(mon.evolvesTo).toBe(null);
    });

    it('instância no estágio final legado não avança além (MON_010D nível 99)', () => {
        // MON_010D → MON_004 (sem evolução)
        const mon = makeInstance('MON_010D', { level: 99 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_004');
        expect(mon.evolvesTo).toBe(null);
        expect(mon.evolvesAt).toBe(null);
    });

    it('reconciliação preserva HP existente', () => {
        const mon = makeInstance('MON_010', { level: 30, hp: 25, hpMax: 50 });
        migrateMonsterInstance(mon);

        // HP deve ser preservado (estratégia B — não recalcular)
        expect(mon.hp).toBe(25);
        expect(mon.hpMax).toBe(50);
    });
});

// ─── D. Dex stale + team migrado → Dex reconstruída ─────────────────────────

describe('rebuildDexFromPossession — Dex stale', () => {
    it('remove entradas legadas da partyDex', () => {
        const state = makeState({
            players: [{ team: [makeInstance('MON_001')], box: [] }],
            partyDex: {
                entries: {
                    'MON_010': { seen: true, captured: true }, // legado
                    'MON_001': { seen: true, captured: true }, // já correto
                },
                meta: { lastMilestoneAwarded: 0 },
            },
        });

        const result = rebuildDexFromPossession(state);

        expect(result.removedLegacy).toContain('MON_010');
        expect(state.partyDex.entries['MON_010']).toBeUndefined();
        expect(state.partyDex.entries['MON_001']).toBeDefined();
        expect(state.partyDex.entries['MON_001'].captured).toBe(true);
    });

    it('adiciona entradas para monstros possuídos que não estavam na Dex', () => {
        const state = makeState({
            players: [{ team: [makeInstance('MON_001'), makeInstance('MON_009')], box: [] }],
        });

        const result = rebuildDexFromPossession(state);

        expect(result.addedNew).toContain('MON_001');
        expect(result.addedNew).toContain('MON_009');
        expect(state.partyDex.entries['MON_001'].captured).toBe(true);
        expect(state.partyDex.entries['MON_009'].captured).toBe(true);
    });

    it('remove IDs legados do monstrodex.seen e monstrodex.captured', () => {
        const state = makeState({
            players: [{ team: [makeInstance('MON_001')], box: [] }],
            monstrodex: {
                seen: ['MON_010', 'MON_011', 'MON_001'],
                captured: ['MON_010', 'MON_001'],
            },
        });

        rebuildDexFromPossession(state);

        expect(state.monstrodex.seen).not.toContain('MON_010');
        expect(state.monstrodex.seen).not.toContain('MON_011');
        expect(state.monstrodex.seen).toContain('MON_001');
        expect(state.monstrodex.captured).not.toContain('MON_010');
        expect(state.monstrodex.captured).toContain('MON_001');
    });

    it('considera monstros na sharedBox como possuídos', () => {
        // Usa ID canônico atual para testar travessia da sharedBox
        const state = makeState({
            sharedBox: [
                { monster: makeInstance('MON_026'), owner: 'player_1' },
            ],
        });

        rebuildDexFromPossession(state);

        expect(state.partyDex.entries['MON_026']).toBeDefined();
        expect(state.partyDex.entries['MON_026'].captured).toBe(true);
    });

    it('considera monstros no box por jogador como possuídos', () => {
        const state = makeState({
            players: [
                { team: [], box: [makeInstance('MON_017')] },
            ],
        });

        rebuildDexFromPossession(state);

        expect(state.partyDex.entries['MON_017'].captured).toBe(true);
        expect(state.monstrodex.captured).toContain('MON_017');
    });

    it('mantém entradas não-legadas já existentes na partyDex', () => {
        const state = makeState({
            players: [{ team: [makeInstance('MON_021')], box: [] }],
            partyDex: {
                entries: {
                    'MON_021': { seen: true, captured: true },
                    'MON_026': { seen: true, captured: false },
                },
                meta: { lastMilestoneAwarded: 0 },
            },
        });

        rebuildDexFromPossession(state);

        // Entrada não-legada existente deve ser preservada
        expect(state.partyDex.entries['MON_026']).toBeDefined();
        expect(state.partyDex.entries['MON_021'].captured).toBe(true);
    });

    it('mapeamento de ID legado em posse → coloca o ID novo na Dex', () => {
        // Team ainda com ID legado (antes da migração de instâncias)
        const legacyMon = { templateId: 'MON_010', level: 5 };
        const state = makeState({ players: [{ team: [legacyMon], box: [] }] });

        rebuildDexFromPossession(state);

        // O ID legado MON_010 → novo MON_001 deve estar na Dex
        expect(state.partyDex.entries['MON_001']).toBeDefined();
        expect(state.partyDex.entries['MON_001'].captured).toBe(true);
        // O ID legado não deve aparecer
        expect(state.partyDex.entries['MON_010']).toBeUndefined();
    });
});

// ─── E. Classe do jogador — não distorcida por migração ──────────────────────

describe('applyCatalogMigration — restrição de classe', () => {
    it('time do Guerreiro não fica com monstro da classe errada após migração', () => {
        // Antes do rebase: MON_010 = linha Ferrozimon (Guerreiro)
        // Após rebase sem migração: MON_010 = Gatunamon (Caçador) — ERRADO
        // Após migração: MON_010 deve virar MON_001 (Ferrozimon, Guerreiro) — CORRETO
        const guerreiroMon = makeInstance('MON_010', { level: 5 });
        const state = makeState({
            players: [{
                id: 'player_1',
                name: 'Guerreiro',
                class: 'Guerreiro',
                team: [guerreiroMon],
                box: [],
            }],
        });

        applyCatalogMigration(state);

        const migratedMon = state.players[0].team[0];
        expect(migratedMon.templateId).toBe('MON_001');
        expect(migratedMon.class).toBe('Guerreiro');
        // Não deve ser Caçador (que seria se o ID fosse resolvido sem migração)
        expect(migratedMon.class).not.toBe('Caçador');
    });

    it('monstro da linha Miaumon preserva classe Caçador após migração de MON_013', () => {
        const mon = makeInstance('MON_013', { level: 8 });
        const state = makeState({
            players: [{ team: [mon], box: [] }],
        });

        applyCatalogMigration(state);

        expect(state.players[0].team[0].class).toBe('Caçador');
    });

    it('monstro da linha Lagartomon preserva classe Mago após migração de MON_014', () => {
        const mon = makeInstance('MON_014', { level: 8 });
        const state = makeState({
            players: [{ team: [mon], box: [] }],
        });

        applyCatalogMigration(state);

        expect(state.players[0].team[0].class).toBe('Mago');
    });
});

// ─── F. Save atual já coerente — sem regressão (idempotência) ────────────────

describe('applyCatalogMigration — idempotência', () => {
    it('migração em save com IDs canônicos atuais não altera nada', () => {
        const mon = makeInstance('MON_001', {
            level: 5,
            name: 'Ferrozimon',
            class: 'Guerreiro',
            rarity: 'Comum',
            evolvesTo: 'MON_002',
            evolvesAt: 12,
        });
        const state = makeState({
            players: [{ team: [mon], box: [] }],
            partyDex: {
                entries: { 'MON_001': { seen: true, captured: true } },
                meta: { lastMilestoneAwarded: 0 },
            },
            monstrodex: { seen: ['MON_001'], captured: ['MON_001'] },
        });

        const before = JSON.parse(JSON.stringify(state));
        const result = applyCatalogMigration(state);

        // Nenhuma instância deve ter sido migrada
        expect(result.instanceStats.migrated).toBe(0);
        // Dados do monstro permanecem iguais
        expect(state.players[0].team[0].templateId).toBe('MON_001');
        expect(state.players[0].team[0].name).toBe(before.players[0].team[0].name);
    });

    it('segunda chamada de migração é segura (idempotente)', () => {
        const mon = makeInstance('MON_010', { level: 5 });
        const state = makeState({
            players: [{ team: [mon], box: [] }],
        });

        // Primeira chamada
        applyCatalogMigration(state);
        const afterFirst = JSON.parse(JSON.stringify(state));

        // Segunda chamada
        applyCatalogMigration(state);

        // Deve produzir exatamente o mesmo resultado
        expect(state.players[0].team[0].templateId).toBe(afterFirst.players[0].team[0].templateId);
        expect(state.players[0].team[0].name).toBe(afterFirst.players[0].team[0].name);
        expect(state.players[0].team[0].class).toBe(afterFirst.players[0].team[0].class);
    });

    it('migração em save vazio não lança erro', () => {
        const state = makeState();
        expect(() => applyCatalogMigration(state)).not.toThrow();
    });

    it('migração com state null retorna graciosamente', () => {
        const result = applyCatalogMigration(null);
        expect(result.instanceStats).toBeNull();
    });
});

// ─── G. Integração: migrateAllInstances ──────────────────────────────────────

describe('migrateAllInstances — integração', () => {
    it('percorre team, box, sharedBox e monsters[] do estado', () => {
        const state = makeState({
            players: [{
                team: [makeInstance('MON_010')],
                box:  [makeInstance('MON_011')],
            }],
            sharedBox: [
                { monster: makeInstance('MON_012') },
            ],
            monsters: [makeInstance('MON_013')],
        });

        const stats = migrateAllInstances(state);

        expect(stats.migrated).toBe(4);
        expect(stats.total).toBe(4);
        expect(state.players[0].team[0].templateId).toBe('MON_001');
        expect(state.players[0].box[0].templateId).toBe('MON_005');
        expect(state.sharedBox[0].monster.templateId).toBe('MON_017');
        expect(state.monsters[0].templateId).toBe('MON_009');
    });

    it('retorna contagem correta de migrados vs ignorados', () => {
        const state = makeState({
            players: [{
                team: [
                    makeInstance('MON_010'),  // legado
                    makeInstance('MON_001'),  // atual
                    makeInstance('MON_021'),  // atual, não mapeado
                ],
                box: [],
            }],
        });

        const stats = migrateAllInstances(state);

        expect(stats.total).toBe(3);
        expect(stats.migrated).toBe(1);
        expect(stats.skipped).toBe(2);
    });
});

// ─── H. isLegacyTemplateId ───────────────────────────────────────────────────

describe('isLegacyTemplateId', () => {
    it.each(Object.keys(CATALOG_REBASE_MAP))('identifica %s como ID legado', (id) => {
        expect(isLegacyTemplateId(id)).toBe(true);
    });

    it.each(['MON_001', 'MON_021', 'MON_100', 'MON_101', 'INVALID'])(
        'não identifica %s como ID legado', (id) => {
            expect(isLegacyTemplateId(id)).toBe(false);
        }
    );
});

// ─── I. Cobertura do mapa de rebase ──────────────────────────────────────────

describe('CATALOG_REBASE_MAP — cobertura', () => {
    it('contém exatamente 20 entradas', () => {
        expect(Object.keys(CATALOG_REBASE_MAP).length).toBe(20);
    });

    it('todos os valores são IDs canônicos (MON_001–MON_020)', () => {
        const values = Object.values(CATALOG_REBASE_MAP);
        for (const v of values) {
            expect(v).toMatch(/^MON_0(0[1-9]|1[0-9]|20)$/);
        }
    });

    it('nenhum valor duplicado (cada novo ID mapeado exatamente uma vez)', () => {
        const values = Object.values(CATALOG_REBASE_MAP);
        const unique = new Set(values);
        expect(unique.size).toBe(values.length);
    });

    it('nenhuma chave coincide com seus próprios valores (sem auto-mapeamento)', () => {
        for (const [key, value] of Object.entries(CATALOG_REBASE_MAP)) {
            expect(key).not.toBe(value);
        }
    });
});
