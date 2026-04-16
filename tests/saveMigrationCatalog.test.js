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
    LEGACY_FINGERPRINTS,
    isLegacyTemplateId,
    matchesLegacyTemplateFingerprint,
    migrateMonsterInstance,
    migrateAllInstances,
    collectAllMonsterInstances,
    collectPossessedTemplateIds,
    rebuildDexFromPossession,
    applyCatalogMigration,
    postMigrationCanonicalRebuild,
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

    it('recalcula stats do template após migração (HP preservado por percentual)', () => {
        // MON_010 (level 5) → MON_001 (Ferrozimon, Guerreiro, Comum)
        // levelMult = 1 + 4*0.1 = 1.4, rarityMult = 1.0
        // hpMax  = floor(29 * 1.4) = 40
        // atk    = floor(7  * 1.4 * 1.0) = 9
        // def    = floor(9  * 1.4 * 1.0) = 12
        // eneMax = floor(10 + 2*4) = 18
        // HP%: 18/35 ≈ 0.5143 → newHp = round(40 * 0.5143) = 21
        const mon = makeInstance('MON_010', { level: 5, hp: 18, hpMax: 35, atk: 9, def: 12 });
        migrateMonsterInstance(mon);

        expect(mon.hpMax).toBe(40);
        expect(mon.hp).toBe(21);   // HP por percentual, não 18 bruto
        expect(mon.atk).toBe(9);   // calculado do template (coincide)
        expect(mon.def).toBe(12);  // calculado do template (coincide)
        expect(mon.eneMax).toBe(18);
        expect(mon.unlockedSkillSlots).toBe(2); // level 5 >= 5 → 2 slots
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

    it('reconciliação preserva HP por percentual (não valor bruto)', () => {
        // MON_010 (level 30) → MON_001 → reconcilia para MON_003 (Raro)
        // MON_003: baseHp=50, baseAtk=14, baseDef=16 | rarity=Raro (mult=1.18)
        // levelMult = 1 + 29*0.1 = 3.9
        // hpMax  = floor(50 * 3.9) = 195
        // HP%: 25/50 = 0.5 → newHp = round(195 * 0.5) = 98
        const mon = makeInstance('MON_010', { level: 30, hp: 25, hpMax: 50 });
        migrateMonsterInstance(mon);

        expect(mon.hpMax).toBe(195);
        expect(mon.hp).toBe(98);   // HP por percentual, não 25 bruto
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

// ─── J. matchesLegacyTemplateFingerprint ─────────────────────────────────────

describe('matchesLegacyTemplateFingerprint — proteção por fingerprint', () => {
    it('instância legítima de Ferrozimon (Guerreiro) passa pelo fingerprint', () => {
        const sig = LEGACY_FINGERPRINTS['MON_010'];
        const inst = { templateId: 'MON_010', class: 'Guerreiro', rarity: 'Comum' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(true);
    });

    it('instância com class desconhecida passa pelo fingerprint (benefício da dúvida)', () => {
        const sig = LEGACY_FINGERPRINTS['MON_010'];
        const inst = { templateId: 'MON_010', class: 'Desconhecido', rarity: 'Comum' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(true);
    });

    it('instância com class ausente passa pelo fingerprint (benefício da dúvida)', () => {
        const sig = LEGACY_FINGERPRINTS['MON_010'];
        const inst = { templateId: 'MON_010' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(true);
    });

    it('instância já migrada de Gatunamon (Caçador) em MON_010 é BLOQUEADA', () => {
        // MON_010 novo = Gatunamon/Caçador; fingerprint espera Guerreiro
        const sig = LEGACY_FINGERPRINTS['MON_010'];
        const inst = { templateId: 'MON_010', class: 'Caçador', rarity: 'Incomum' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(false);
    });

    it('instância já migrada de Felinomon (Caçador) em MON_011 é BLOQUEADA', () => {
        const sig = LEGACY_FINGERPRINTS['MON_011'];
        const inst = { templateId: 'MON_011', class: 'Caçador', rarity: 'Raro' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(false);
    });

    it('instância já migrada Salamandromon (Mago/Incomum) em MON_014 é BLOQUEADA via rarity', () => {
        // CASO CRÍTICO: novo MON_014 = Salamandromon/Mago/Incomum
        //              legado MON_014 = base Lagartomon/Mago/Comum
        // class é IGUAL em ambos → rarity deve ser o tiebreaker
        const sig = LEGACY_FINGERPRINTS['MON_014'];
        const inst = { templateId: 'MON_014', class: 'Mago', rarity: 'Incomum' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(false);
    });

    it('instância legítima Lagartomon base (Mago/Comum) em MON_014 é PERMITIDA', () => {
        const sig = LEGACY_FINGERPRINTS['MON_014'];
        const inst = { templateId: 'MON_014', class: 'Mago', rarity: 'Comum' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(true);
    });

    it('instância com rarity desconhecida e class ambígua é PERMITIDA (benefício da dúvida)', () => {
        // MON_014 com class=Mago mas rarity ausente → não bloquear
        const sig = LEGACY_FINGERPRINTS['MON_014'];
        const inst = { templateId: 'MON_014', class: 'Mago' };
        expect(matchesLegacyTemplateFingerprint(inst, sig)).toBe(true);
    });

    it('LEGACY_FINGERPRINTS cobre exatamente os 20 IDs do CATALOG_REBASE_MAP', () => {
        const mapKeys  = new Set(Object.keys(CATALOG_REBASE_MAP));
        const fpKeys   = new Set(Object.keys(LEGACY_FINGERPRINTS));
        expect(fpKeys.size).toBe(mapKeys.size);
        for (const k of mapKeys) expect(fpKeys.has(k)).toBe(true);
    });
});

// ─── K. Fingerprint bloqueia migração de save já migrado (sobreposição de IDs) ──

describe('migrateMonsterInstance — fingerprint guard em ID sobreposto', () => {
    it('MON_010 com class=Caçador (já é Gatunamon) NÃO é remapeado para Ferrozimon', () => {
        // Cenário: MON_013B foi migrado para MON_010 (Gatunamon/Caçador).
        // Se a migração rodar de novo, MON_010 está no mapa (→ MON_001 Ferrozimon/Guerreiro).
        // O fingerprint deve bloquear (class=Caçador ≠ fingerprint.class=Guerreiro).
        const mon = makeInstance('MON_010', { class: 'Caçador', rarity: 'Incomum', name: 'Gatunamon', level: 15 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_010');
        expect(mon.class).toBe('Caçador');
        expect(mon.name).toBe('Gatunamon');
        expect(result.notes.some(n => n.includes('FINGERPRINT'))).toBe(true);
    });

    it('MON_013 com class=Mago (já é Lagartomon) NÃO é remapeado para Miaumon/Caçador', () => {
        // Cenário: MON_014 foi migrado para MON_013 (Lagartomon/Mago/Comum).
        // fingerprint de MON_013 espera class=Caçador → bloqueia.
        const mon = makeInstance('MON_013', { class: 'Mago', rarity: 'Comum', name: 'Lagartomon', level: 5 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_013');
        expect(mon.class).toBe('Mago');
    });

    it('MON_014 com class=Mago rarity=Incomum (Salamandromon) NÃO é remapeado para Lagartomon', () => {
        // Cenário crítico com class ambígua: MON_014B foi migrado para MON_014 (Salamandromon/Mago/Incomum).
        // Fingerprint de MON_014 espera rarity=Comum → tiebreaker bloqueia.
        const mon = makeInstance('MON_014', { class: 'Mago', rarity: 'Incomum', name: 'Salamandromon', level: 20 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_014');
        expect(mon.name).toBe('Salamandromon');
    });

    it('MON_014 com class=Mago rarity=Comum (legado base) É migrado para MON_013', () => {
        const mon = makeInstance('MON_014', { class: 'Mago', rarity: 'Comum', level: 5 });
        const result = migrateMonsterInstance(mon);

        expect(result.migrated).toBe(true);
        expect(mon.templateId).toBe('MON_013');
        expect(mon.class).toBe('Mago');
    });
});

// ─── L. Stats recalculados corretamente após migração ────────────────────────

describe('migrateMonsterInstance — recalcular stats do template final', () => {
    it('MON_010 nível 10 → MON_001: stats corretos para Ferrozimon nível 10', () => {
        // MON_001 (Comum, rarityMult=1.0), level=10
        // levelMult = 1 + 9*0.1 = 1.9
        // hpMax  = floor(29 * 1.9) = 55
        // atk    = floor(7  * 1.9 * 1.0) = 13
        // def    = floor(9  * 1.9 * 1.0) = 17
        // eneMax = floor(10 + 2*9) = 28
        // unlockedSkillSlots: level 10 >= 5 → 2 slots
        const mon = makeInstance('MON_010', { level: 10 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_001');
        expect(mon.hpMax).toBe(55);
        expect(mon.atk).toBe(13);
        expect(mon.def).toBe(17);
        expect(mon.eneMax).toBe(28);
        expect(mon.unlockedSkillSlots).toBe(2);
    });

    it('MON_010 nível 30 reconcilia para MON_003: stats corretos para Kinguespinhomon nível 30', () => {
        // MON_003 (Raro, rarityMult=1.18), level=30
        // levelMult = 1 + 29*0.1 = 3.9
        // hpMax  = floor(50 * 3.9) = 195
        // atk    = floor(14 * 3.9 * 1.18) = 64
        // def    = floor(16 * 3.9 * 1.18) = 73
        // eneMax = floor(10 + 2*29) = 68
        // unlockedSkillSlots: level 30 >= 30 → 4 slots
        const mon = makeInstance('MON_010', { level: 30 });
        migrateMonsterInstance(mon);

        expect(mon.templateId).toBe('MON_003');
        expect(mon.hpMax).toBe(195);
        expect(mon.atk).toBe(64);
        expect(mon.def).toBe(73);
        expect(mon.eneMax).toBe(68);
        expect(mon.unlockedSkillSlots).toBe(4);
    });

    it('monstro fainted (hp=0) permanece fainted após recalcular stats', () => {
        const mon = makeInstance('MON_010', { level: 10, hp: 0, hpMax: 20 });
        migrateMonsterInstance(mon);

        expect(mon.hp).toBe(0);
        expect(mon.hpMax).toBeGreaterThan(0); // hpMax recalculado
    });

    it('monstro com HP cheio mantém HP cheio após recalcular (100% → 100%)', () => {
        const mon = makeInstance('MON_010', { level: 5, hp: 30, hpMax: 30 });
        migrateMonsterInstance(mon);

        // HP cheio → percentual 1.0 → hp deve igualar hpMax após recálculo
        expect(mon.hp).toBe(mon.hpMax);
    });

    it('ENE é clampada ao novo eneMax após recalcular', () => {
        // Instância com ENE excessiva em relação ao novo eneMax
        const mon = makeInstance('MON_010', { level: 1, ene: 999, eneMax: 999 });
        migrateMonsterInstance(mon);

        // level 1 → eneMax = floor(10 + 2*0) = 10
        expect(mon.eneMax).toBe(10);
        expect(mon.ene).toBe(10); // clampado
    });

    it('unlockedSkillSlots atualizado corretamente por nível', () => {
        const cases = [
            { level: 1,  expected: 1 },
            { level: 4,  expected: 1 },
            { level: 5,  expected: 2 },
            { level: 14, expected: 2 },
            { level: 15, expected: 3 },
            { level: 29, expected: 3 },
            { level: 30, expected: 4 },
            { level: 99, expected: 4 },
        ];
        for (const { level, expected } of cases) {
            const mon = makeInstance('MON_010', { level });
            migrateMonsterInstance(mon);
            expect(mon.unlockedSkillSlots).toBe(expected);
        }
    });

    it('poder é atualizado como floor(atk * 0.5)', () => {
        const mon = makeInstance('MON_010', { level: 10 });
        migrateMonsterInstance(mon);
        // atk=13 → poder = floor(13 * 0.5) = 6
        expect(mon.poder).toBe(6);
    });
});

// ─── M. Idempotência real (fingerprint, não só saveVersion) ──────────────────

describe('migrateMonsterInstance — idempotência baseada em fingerprint', () => {
    it('segunda migração de instância já migrada (via sobreposição de ID) é bloqueada', () => {
        // 1ª migração: MON_013B → MON_010 (Gatunamon, Caçador, Incomum)
        const mon = makeInstance('MON_013B', { level: 15, class: 'Caçador', rarity: 'Incomum' });
        const first = migrateMonsterInstance(mon);
        expect(first.migrated).toBe(true);
        expect(mon.templateId).toBe('MON_010');
        expect(mon.class).toBe('Caçador');

        // 2ª migração: MON_010 é chave no mapa (→ MON_001), mas fingerprint bloqueia
        // pois class=Caçador ≠ fingerprint.class=Guerreiro
        const second = migrateMonsterInstance(mon);
        expect(second.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_010');
        expect(mon.class).toBe('Caçador');
    });

    it('segunda migração de MON_014B → MON_014 (Salamandromon) é bloqueada via rarity', () => {
        // 1ª migração: MON_014B → MON_014 (Salamandromon, Mago, Incomum)
        const mon = makeInstance('MON_014B', { level: 20, class: 'Mago', rarity: 'Incomum' });
        const first = migrateMonsterInstance(mon);
        expect(first.migrated).toBe(true);
        expect(mon.templateId).toBe('MON_014');

        // 2ª migração: MON_014 está no mapa (→ MON_013), mas rarity=Incomum ≠ fingerprint.rarity=Comum → bloqueada
        const second = migrateMonsterInstance(mon);
        expect(second.migrated).toBe(false);
        expect(mon.templateId).toBe('MON_014');
        expect(mon.name).toBe('Salamandromon');
    });

    it('save sem versão + IDs canônicos não sofre migração espúria', () => {
        const state = makeState({
            meta: {},  // sem saveVersion!
            players: [{
                team: [
                    makeInstance('MON_001', { class: 'Guerreiro', rarity: 'Comum',   name: 'Ferrozimon' }),
                    makeInstance('MON_009', { class: 'Caçador',   rarity: 'Comum',   name: 'Miaumon'    }),
                    makeInstance('MON_013', { class: 'Mago',      rarity: 'Comum',   name: 'Lagartomon' }),
                ],
                box: [],
            }],
        });

        applyCatalogMigration(state);

        // Nenhuma instância deve ter mudado (MON_001, MON_009, MON_013 são IDs canônicos)
        expect(state.players[0].team[0].templateId).toBe('MON_001');
        expect(state.players[0].team[1].templateId).toBe('MON_009');
        expect(state.players[0].team[2].templateId).toBe('MON_013');
    });
});

// ─── N. Novos campos: stage, xpNeeded, _pendingCanonicalRebuild ──────────────

describe('migrateMonsterInstance — campos canonicalizados (stage / xpNeeded / flags)', () => {
    it('define stage correto para cada posição na chain (Ferrozimon)', () => {
        // MON_001 = stage 0, MON_002 = stage 1, MON_003 = stage 2, MON_004 = stage 3
        const cases = [
            { legacyId: 'MON_010',  expectedStage: 0 },  // → MON_001
            { legacyId: 'MON_010B', expectedStage: 1 },  // → MON_002
            { legacyId: 'MON_010C', expectedStage: 2 },  // → MON_003
            { legacyId: 'MON_010D', expectedStage: 3 },  // → MON_004
        ];
        for (const { legacyId, expectedStage } of cases) {
            const mon = makeInstance(legacyId, { level: 1 });
            migrateMonsterInstance(mon);
            expect(mon.stage).toBe(expectedStage);
        }
    });

    it('reconciliação por nível actualiza stage para o estágio correto', () => {
        // MON_010 level 30 → reconiclia para MON_003 (stage 2)
        const mon = makeInstance('MON_010', { level: 30 });
        migrateMonsterInstance(mon);
        expect(mon.templateId).toBe('MON_003');
        expect(mon.stage).toBe(2);
    });

    it('stage é consistente para todas as linhas (Miaumon, Lagartomon, Luvursomon, Dinomon)', () => {
        const cases = [
            // Linha Miaumon (Caçador)
            { legacyId: 'MON_013',  expectedTemplate: 'MON_009', expectedStage: 0 },
            { legacyId: 'MON_013B', expectedTemplate: 'MON_010', expectedStage: 1 },
            { legacyId: 'MON_013C', expectedTemplate: 'MON_011', expectedStage: 2 },
            { legacyId: 'MON_013D', expectedTemplate: 'MON_012', expectedStage: 3 },
            // Linha Lagartomon (Mago)
            { legacyId: 'MON_014',  expectedTemplate: 'MON_013', expectedStage: 0 },
            { legacyId: 'MON_014B', expectedTemplate: 'MON_014', expectedStage: 1 },
            // Linha Luvursomon (Animalista)
            { legacyId: 'MON_012',  expectedTemplate: 'MON_017', expectedStage: 0 },
            { legacyId: 'MON_012C', expectedTemplate: 'MON_019', expectedStage: 2 },
            // Linha Dinomon (Bardo)
            { legacyId: 'MON_011',  expectedTemplate: 'MON_005', expectedStage: 0 },
            { legacyId: 'MON_011D', expectedTemplate: 'MON_008', expectedStage: 3 },
        ];
        for (const { legacyId, expectedTemplate, expectedStage } of cases) {
            const mon = makeInstance(legacyId, { level: 1 });
            migrateMonsterInstance(mon);
            expect(mon.templateId).toBe(expectedTemplate);
            expect(mon.stage).toBe(expectedStage);
        }
    });

    it('xpNeeded é definido após migração (fórmula: round(40 + 6L + 0.6L²))', () => {
        const cases = [
            { level: 1,  xpNeeded: Math.round(40 + 6 + 0.6) },   // 47
            { level: 5,  xpNeeded: Math.round(40 + 30 + 15) },    // 85
            { level: 10, xpNeeded: Math.round(40 + 60 + 60) },    // 160
            { level: 25, xpNeeded: Math.round(40 + 150 + 375) },  // 565
        ];
        for (const { level, xpNeeded } of cases) {
            const mon = makeInstance('MON_010', { level });
            migrateMonsterInstance(mon);
            expect(mon.xpNeeded).toBe(xpNeeded);
        }
    });

    it('instância migrada tem _pendingCanonicalRebuild=true (aguardando Phase 2)', () => {
        const mon = makeInstance('MON_010', { level: 5 });
        migrateMonsterInstance(mon);
        expect(mon._pendingCanonicalRebuild).toBe(true);
    });

    it('instância migrada tem _migratedFromLegacy=true e _legacyTemplateId correto', () => {
        const mon = makeInstance('MON_013B', { level: 10 });
        migrateMonsterInstance(mon);
        expect(mon._migratedFromLegacy).toBe(true);
        expect(mon._legacyTemplateId).toBe('MON_013B');
    });

    it('instância NÃO migrada não recebe _pendingCanonicalRebuild', () => {
        const mon = makeInstance('MON_001', { class: 'Guerreiro', rarity: 'Comum', level: 5 });
        migrateMonsterInstance(mon);
        expect(mon._pendingCanonicalRebuild).toBeUndefined();
        expect(mon._migratedFromLegacy).toBeUndefined();
    });
});

// ─── O. Phase 2 — postMigrationCanonicalRebuild ──────────────────────────────

/**
 * Mock factory para testes de Phase 2.
 * Simula createMonsterInstanceFromTemplate usando dados do MIGRATION_CATALOG
 * embutido. Inclui campos extras que a factory real adiciona (SpeciesBridge, KitSwap).
 */
function mockCanonicalFactory(templateId, level) {
    // Dados simulados baseados no MIGRATION_CATALOG
    const catalog = {
        'MON_001': { name: 'Ferrozimon',      class: 'Guerreiro', rarity: 'Comum',   emoji: '⚔️', evolvesTo: 'MON_002', evolvesAt: 12, baseHp: 29, baseAtk: 7,  baseDef: 9,  baseSpd: 4  },
        'MON_002': { name: 'Cavalheiromon',   class: 'Guerreiro', rarity: 'Incomum', emoji: '🗡️', evolvesTo: 'MON_003', evolvesAt: 25, baseHp: 39, baseAtk: 10, baseDef: 12, baseSpd: 5  },
        'MON_003': { name: 'Kinguespinhomon', class: 'Guerreiro', rarity: 'Raro',    emoji: '🛡️', evolvesTo: 'MON_004', evolvesAt: 45, baseHp: 50, baseAtk: 14, baseDef: 16, baseSpd: 6  },
        'MON_009': { name: 'Miaumon',         class: 'Caçador',   rarity: 'Comum',   emoji: '🐱', evolvesTo: 'MON_010', evolvesAt: 12, baseHp: 25, baseAtk: 8,  baseDef: 4,  baseSpd: 9  },
        'MON_010': { name: 'Gatunamon',       class: 'Caçador',   rarity: 'Incomum', emoji: '🐈', evolvesTo: 'MON_011', evolvesAt: 25, baseHp: 32, baseAtk: 10, baseDef: 6,  baseSpd: 12 },
        'MON_013': { name: 'Lagartomon',      class: 'Mago',      rarity: 'Comum',   emoji: '🦎', evolvesTo: 'MON_014', evolvesAt: 12, baseHp: 24, baseAtk: 6,  baseDef: 4,  baseSpd: 6  },
    };

    const tpl = catalog[templateId];
    if (!tpl) return null;

    const lvl        = Math.max(1, Number(level) || 1);
    const RARITY_POWER = { Comum: 1.0, Incomum: 1.08, Raro: 1.18, Místico: 1.32, Lendário: 1.50 };
    const rarityMult = RARITY_POWER[tpl.rarity] || 1.0;
    const lvMult     = 1 + (lvl - 1) * 0.1;

    const hpMax  = Math.floor(tpl.baseHp  * lvMult);
    const atk    = Math.floor(tpl.baseAtk * lvMult * rarityMult);
    const def    = Math.floor(tpl.baseDef * lvMult * rarityMult);
    const spd    = Math.floor(tpl.baseSpd * lvMult * rarityMult);
    const eneMax = Math.floor(10 + 2 * (lvl - 1));
    const poder  = Math.floor(atk * 0.5);
    const xpNeeded = Math.round(40 + 6 * lvl + 0.6 * lvl * lvl);

    return {
        templateId, name: tpl.name, class: tpl.class, rarity: tpl.rarity,
        emoji: tpl.emoji, evolvesTo: tpl.evolvesTo ?? null, evolvesAt: tpl.evolvesAt ?? null,
        level: lvl, xp: 0, xpNeeded,
        hp: hpMax, hpMax, ene: eneMax, eneMax, atk, def, spd, poder,
        unlockedSkillSlots: lvl >= 30 ? 4 : lvl >= 15 ? 3 : lvl >= 5 ? 2 : 1,
        friendship: 50,
        // Simula campos extras que a factory real adiciona
        canonSpeciesId: templateId,
        canonAppliedOffsets: {},
        appliedKitSwaps: [],
        stage: 0,  // factory real sempre cria em stage 0
    };
}

describe('postMigrationCanonicalRebuild — Phase 2 canônica', () => {
    it('recria instância migrada usando a factory canônica', () => {
        const mon = makeInstance('MON_010', { level: 5, hp: 18, hpMax: 35 });
        migrateMonsterInstance(mon);  // Phase 1: templateId=MON_001, hpMax=40

        expect(mon._pendingCanonicalRebuild).toBe(true);

        const state = makeState({ players: [{ team: [mon], box: [] }] });
        const result = postMigrationCanonicalRebuild(state, mockCanonicalFactory);

        expect(result.rebuilt).toBe(1);
        expect(result.skipped).toBe(0);
        expect(result.errors).toHaveLength(0);

        // flag limpa após Phase 2
        expect(mon._pendingCanonicalRebuild).toBeUndefined();

        // Stats vêm da factory (valores canônicos)
        expect(mon.name).toBe('Ferrozimon');
        expect(mon.class).toBe('Guerreiro');
        expect(mon.templateId).toBe('MON_001');
        expect(mon.canonSpeciesId).toBe('MON_001');
        expect(mon.appliedKitSwaps).toBeDefined();
    });

    it('preserva progresso legítimo após Phase 2', () => {
        const mon = makeInstance('MON_010', {
            level: 5,
            xp: 77,
            hp: 18, hpMax: 35,  // ~51.4% HP
            ene: 8, eneMax: 20,
            friendship: 75,
            status: 'poisoned',
            isShiny: true,
            equippedItem: 'item_potion',
            id: 'mi_test_preserve_01',
            instanceId: 'mi_test_preserve_01',
            ownerId: 'player_01',
            createdAt: '2026-01-01T00:00:00Z',
        });
        migrateMonsterInstance(mon);  // Phase 1

        const state = makeState({ players: [{ team: [mon], box: [] }] });
        postMigrationCanonicalRebuild(state, mockCanonicalFactory);

        // Progressão preservada
        expect(mon.level).toBe(5);
        expect(mon.xp).toBe(77);
        expect(mon.friendship).toBe(75);
        expect(mon.status).toBe('poisoned');
        expect(mon.isShiny).toBe(true);
        expect(mon.equippedItem).toBe('item_potion');
        expect(mon.id).toBe('mi_test_preserve_01');
        expect(mon.instanceId).toBe('mi_test_preserve_01');
        expect(mon.ownerId).toBe('player_01');
        expect(mon.createdAt).toBe('2026-01-01T00:00:00Z');

        // HP por percentual do hpMax canônico
        // Phase 1 hpMax=40, hp=21 (round(40 * 18/35))
        // Phase 2 hpMax=40 (mesmo valor na factory mock), hp = round(40 * oldHpPct)
        expect(mon.hpMax).toBeGreaterThan(0);
        expect(mon.hp).toBeGreaterThanOrEqual(1);
        expect(mon.hp).toBeLessThanOrEqual(mon.hpMax);
    });

    it('monstro fainted permanece fainted após Phase 2', () => {
        const mon = makeInstance('MON_010', { level: 5, hp: 0, hpMax: 30 });
        migrateMonsterInstance(mon);

        const state = makeState({ players: [{ team: [mon], box: [] }] });
        postMigrationCanonicalRebuild(state, mockCanonicalFactory);

        expect(mon.hp).toBe(0);
    });

    it('instâncias sem _pendingCanonicalRebuild são ignoradas (idempotência real)', () => {
        // Instância canônica atual (sem legado)
        const mon = makeInstance('MON_001', { class: 'Guerreiro', rarity: 'Comum', level: 5 });
        const originalName = mon.name;
        const originalHpMax = mon.hpMax;

        const state = makeState({ players: [{ team: [mon], box: [] }] });
        const result = postMigrationCanonicalRebuild(state, mockCanonicalFactory);

        // Não foi alterada
        expect(result.rebuilt).toBe(0);
        expect(result.skipped).toBe(1);
        expect(mon.name).toBe(originalName);
        expect(mon.hpMax).toBe(originalHpMax);
    });

    it('chamar Phase 2 duas vezes não produz dupla transformação', () => {
        const mon = makeInstance('MON_010', { level: 5, hp: 18, hpMax: 35 });
        migrateMonsterInstance(mon);  // Phase 1

        const state = makeState({ players: [{ team: [mon], box: [] }] });
        postMigrationCanonicalRebuild(state, mockCanonicalFactory);  // Phase 2

        const hpAfterFirst = mon.hp;
        const hpMaxAfterFirst = mon.hpMax;

        // Segunda chamada: sem _pendingCanonicalRebuild → nada muda
        const result2 = postMigrationCanonicalRebuild(state, mockCanonicalFactory);
        expect(result2.rebuilt).toBe(0);
        expect(mon.hp).toBe(hpAfterFirst);
        expect(mon.hpMax).toBe(hpMaxAfterFirst);
    });

    it('factory retornando null gera skip sem crash', () => {
        const mon = makeInstance('MON_010', { level: 5 });
        migrateMonsterInstance(mon);

        // Factory que sempre retorna null
        const state = makeState({ players: [{ team: [mon], box: [] }] });
        const result = postMigrationCanonicalRebuild(state, () => null);

        expect(result.rebuilt).toBe(0);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('nulo');
    });

    it('chamada sem factory (undefined) retorna imediatamente sem crash', () => {
        const state = makeState();
        const result = postMigrationCanonicalRebuild(state, undefined);
        expect(result.rebuilt).toBe(0);
        expect(result.errors).toHaveLength(1);
    });
});

// ─── P. Cross-class warning após migração ────────────────────────────────────

describe('applyCatalogMigration — cross-class warnings no time', () => {
    it('detecta monstro migrado cross-class no time do jogador', () => {
        // Simula Guerreiro com monstro Caçador no time por erro de mapeamento.
        // _migratedFromLegacy=true sinaliza que veio de migração.
        const caçadorMon = makeInstance('MON_009', {
            class: 'Caçador', name: 'Miaumon',
            _migratedFromLegacy: true,
            _legacyTemplateId: 'MON_013',
        });

        const state = makeState({
            players: [{
                id: 'p1', name: 'Alice', class: 'Guerreiro',
                team: [caçadorMon],
                box: [],
            }],
        });

        // applyCatalogMigration não vai migrar este monstro (templateId já canônico),
        // mas se fosse migrado com _migratedFromLegacy, o warning deveria aparecer.
        const result = applyCatalogMigration(state);

        // Warning detectado para o monstro Caçador no time do Guerreiro
        expect(result.crossClassWarnings.length).toBeGreaterThanOrEqual(1);
        expect(result.crossClassWarnings[0]).toContain('Guerreiro');
        expect(result.crossClassWarnings[0]).toContain('Caçador');
        expect(result.crossClassWarnings[0]).toContain('CROSS-CLASS');
    });

    it('monstro da classe correta do jogador não gera warning', () => {
        const guerreiroMon = makeInstance('MON_001', {
            class: 'Guerreiro', name: 'Ferrozimon',
            _migratedFromLegacy: true,
            _legacyTemplateId: 'MON_010',
        });

        const state = makeState({
            players: [{
                id: 'p1', name: 'Bob', class: 'Guerreiro',
                team: [guerreiroMon],
                box: [],
            }],
        });

        const result = applyCatalogMigration(state);
        expect(result.crossClassWarnings.length).toBe(0);
    });

    it('save sem monstros migrados no time não gera warnings', () => {
        const state = makeState({
            players: [{
                id: 'p1', class: 'Mago',
                team: [makeInstance('MON_013', { class: 'Mago', name: 'Lagartomon' })],
                box: [],
            }],
        });

        const result = applyCatalogMigration(state);
        // Sem _migratedFromLegacy → sem warning
        expect(result.crossClassWarnings.length).toBe(0);
    });
});

// ─── Q. Guerreiro nunca cai em linha felina; Mago nunca cai em linha errada ───

describe('migração canônica — linha correta garantida por classe', () => {
    it('Guerreiro antigo (MON_010x) permanece na linha Ferrozimon/Guerreiro', () => {
        const cases = ['MON_010', 'MON_010B', 'MON_010C', 'MON_010D'];
        for (const legacyId of cases) {
            const mon = makeInstance(legacyId, { class: 'Guerreiro', level: 1 });
            migrateMonsterInstance(mon);
            // Nunca vai para linha felina (MON_009-012/Caçador)
            expect(mon.class).toBe('Guerreiro');
            expect(['MON_001','MON_002','MON_003','MON_004']).toContain(mon.templateId);
        }
    });

    it('Caçador antigo (MON_013x) permanece na linha Miaumon/Caçador', () => {
        const cases = ['MON_013', 'MON_013B', 'MON_013C', 'MON_013D'];
        for (const legacyId of cases) {
            const mon = makeInstance(legacyId, { class: 'Caçador', level: 1 });
            migrateMonsterInstance(mon);
            expect(mon.class).toBe('Caçador');
            expect(['MON_009','MON_010','MON_011','MON_012']).toContain(mon.templateId);
        }
    });

    it('Mago antigo (MON_014x) permanece na linha Lagartomon/Mago', () => {
        const cases = ['MON_014B', 'MON_014C', 'MON_014D'];
        for (const legacyId of cases) {
            const mon = makeInstance(legacyId, { class: 'Mago', level: 1 });
            migrateMonsterInstance(mon);
            expect(mon.class).toBe('Mago');
            expect(['MON_013','MON_014','MON_015','MON_016']).toContain(mon.templateId);
        }
    });

    it('Bardo antigo (MON_011x) permanece na linha Dinomon/Bardo', () => {
        const cases = ['MON_011', 'MON_011B', 'MON_011C', 'MON_011D'];
        for (const legacyId of cases) {
            const mon = makeInstance(legacyId, { class: 'Bardo', level: 1 });
            migrateMonsterInstance(mon);
            expect(mon.class).toBe('Bardo');
            expect(['MON_005','MON_006','MON_007','MON_008']).toContain(mon.templateId);
        }
    });

    it('Animalista antigo (MON_012x) permanece na linha Luvursomon/Animalista', () => {
        const cases = ['MON_012', 'MON_012B', 'MON_012C', 'MON_012D'];
        for (const legacyId of cases) {
            const mon = makeInstance(legacyId, { class: 'Animalista', level: 1 });
            migrateMonsterInstance(mon);
            expect(mon.class).toBe('Animalista');
            expect(['MON_017','MON_018','MON_019','MON_020']).toContain(mon.templateId);
        }
    });

    it('reconciliação por nível não salta para outra linha de classe', () => {
        // Guerreiro nível 50 deve ir para MON_004 (Arconouricomon), não para outra classe
        const mon = makeInstance('MON_010', { class: 'Guerreiro', level: 50 });
        migrateMonsterInstance(mon);
        expect(mon.templateId).toBe('MON_004');
        expect(mon.class).toBe('Guerreiro');
        expect(mon.name).toBe('Arconouricomon');
    });

    it('Caçador nível 30 reconcilia para Felinomon (MON_011), não para linha errada', () => {
        // Caçador antigo MON_013 nível 30 → MON_009 → reconcilia para MON_010 (nível 30 >= 25) → e vai além?
        // MON_010 evolvesAt=25, nível 30 >= 25 → avança para MON_011 (evolvesAt=45)
        // nível 30 < 45 → fica em MON_011? NÃO: MON_010 evolvesAt=25, MON_011 evolvesAt=45
        // Walk: MON_009(evolvesAt=12,30>=12→MON_010) → MON_010(evolvesAt=25,30>=25→MON_011) → MON_011(evolvesAt=45,30<45→stop)
        const mon = makeInstance('MON_013', { class: 'Caçador', level: 30 });
        migrateMonsterInstance(mon);
        expect(mon.templateId).toBe('MON_011');
        expect(mon.class).toBe('Caçador');
        expect(mon.name).toBe('Felinomon');
    });
});
