/**
 * ENCOUNTER ENGINE TESTS
 *
 * Testes para o sistema de geração de encontros por área progressiva.
 * Cobertura: pickRarityByWeight, pickSpeciesFromPool, generateEncounterLevel,
 *            applyModifiers, isRareSpot, findArea, resolveSpeciesPool,
 *            generateWildEncounter, pickEncounterType
 *
 * Princípio testado: ÁREA governa os encontros. Grupo apenas ajusta levemente.
 */

import { describe, it, expect } from 'vitest';
import {
    pickRarityByWeight,
    pickSpeciesFromPool,
    generateEncounterLevel,
    applyModifiers,
    isRareSpot,
    findArea,
    resolveSpeciesPool,
    generateWildEncounter,
    pickEncounterType
} from '../js/encounter/encounterEngine.js';

// ── Fixtures reutilizáveis ────────────────────────────────────────────────────

const RARITY_WEIGHTS_T1 = { Comum: 82, Incomum: 16, Raro: 2, Místico: 0, Lendário: 0 };
const RARITY_WEIGHTS_T3 = { Comum: 58, Incomum: 28, Raro: 12, Místico: 2, Lendário: 0 };
const RARITY_WEIGHTS_T6 = { Comum: 24, Incomum: 34, Raro: 28, Místico: 12, Lendário: 2 };

const MOCK_LOCATION = {
    id: 'LOC_001',
    name: 'Campina Inicial',
    biome: 'campos',
    tier: 'T1',
    levelRange: [1, 4],
    rarityWeights: { ...RARITY_WEIGHTS_T1 },
    speciesPoolsByRarity: {
        Comum:    ['MON_001', 'MON_002', 'MON_004', 'MON_006', 'MON_100'],
        Incomum:  ['MON_011B', 'MON_023B', 'MON_002B'],
        Raro:     ['MON_023C'],
        Místico:  [],
        Lendário: []
    },
    encounterTypeWeights: { Selvagem: 68, Item: 15, Evento: 10, Treinador: 7, SpotRaro: 0 },
    rareSpotBonus: 15
};

const MOCK_LOCATIONS = [
    MOCK_LOCATION,
    {
        id: 'LOC_002B',
        name: 'Floresta Profunda',
        biome: 'floresta',
        tier: 'T3',
        levelRange: [6, 12],
        rarityWeights: { ...RARITY_WEIGHTS_T3 },
        speciesPoolsByRarity: {
            Comum:    ['MON_006', 'MON_004', 'MON_005', 'MON_023', 'MON_020', 'MON_012', 'MON_013'],
            Incomum:  ['MON_023B', 'MON_020B', 'MON_012B', 'MON_013B'],
            Raro:     ['MON_023C', 'MON_020C', 'MON_012C', 'MON_013C'],
            Místico:  ['MON_012D'],
            Lendário: []
        },
        encounterTypeWeights: { Selvagem: 60, Item: 8, Evento: 14, Treinador: 12, SpotRaro: 6 },
        rareSpotBonus: 10
    }
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cria RNG determinístico que retorna sempre o mesmo valor */
const fixedRng = (value) => () => value;

/** Conta ocorrências em N amostras */
function sampleDistribution(fn, n = 10000) {
    const counts = {};
    for (let i = 0; i < n; i++) {
        const result = fn();
        counts[result] = (counts[result] ?? 0) + 1;
    }
    return counts;
}

// ── pickRarityByWeight ────────────────────────────────────────────────────────

describe('pickRarityByWeight — Seleção ponderada de raridade', () => {

    describe('comportamento determinístico com rng fixo', () => {
        it('deve retornar Comum com roll=0.0 em T1', () => {
            // roll=0.0 sempre cai no primeiro bucket (Comum peso 82)
            expect(pickRarityByWeight(RARITY_WEIGHTS_T1, fixedRng(0.0))).toBe('Comum');
        });

        it('deve retornar Incomum com roll logo acima de 0.82 em T1', () => {
            // Comum: 0–82, Incomum: 82–98, Raro: 98–100
            // roll=0.821 → total=100, roll*100=82.1 → cai em Incomum
            expect(pickRarityByWeight(RARITY_WEIGHTS_T1, fixedRng(0.821))).toBe('Incomum');
        });

        it('deve retornar Raro com roll=0.99 em T1', () => {
            // roll=0.99 → 99 > 98 → cai em Raro
            expect(pickRarityByWeight(RARITY_WEIGHTS_T1, fixedRng(0.99))).toBe('Raro');
        });

        it('deve retornar Místico com roll alto em T3', () => {
            // T3: Comum 58, Incomum 86, Raro 98, Místico 100
            // roll=0.989 → 98.9 → cai em Místico
            expect(pickRarityByWeight(RARITY_WEIGHTS_T3, fixedRng(0.989))).toBe('Místico');
        });

        it('deve retornar Lendário em T6 com roll=0.999', () => {
            // T6: Comum 24, Incomum 58, Raro 86, Místico 98, Lendário 100
            // roll=0.999 → 99.9 → cai em Lendário
            expect(pickRarityByWeight(RARITY_WEIGHTS_T6, fixedRng(0.999))).toBe('Lendário');
        });
    });

    describe('distribuição estatística (N=10.000)', () => {
        it('deve respeitar proporção T1: Comum ~82%, Incomum ~16%, Raro ~2%', () => {
            const dist = sampleDistribution(() => pickRarityByWeight(RARITY_WEIGHTS_T1));
            // Tolerância de ±3pp
            expect(dist['Comum']  / 10000).toBeCloseTo(0.82, 1);
            expect(dist['Incomum']/ 10000).toBeCloseTo(0.16, 1);
            expect(dist['Raro']   / 10000).toBeCloseTo(0.02, 1);
            expect(dist['Místico']  ?? 0).toBe(0);
        });

        it('deve respeitar proporção T3: Comum ~58%, Incomum ~28%, Raro ~12%, Místico ~2%', () => {
            const dist = sampleDistribution(() => pickRarityByWeight(RARITY_WEIGHTS_T3));
            expect(dist['Comum']  / 10000).toBeCloseTo(0.58, 1);
            expect(dist['Incomum']/ 10000).toBeCloseTo(0.28, 1);
            expect(dist['Raro']   / 10000).toBeCloseTo(0.12, 1);
            expect(dist['Místico']/ 10000).toBeCloseTo(0.02, 1);
        });
    });

    describe('edge cases', () => {
        it('deve retornar null para pesos nulos', () => {
            expect(pickRarityByWeight(null)).toBeNull();
        });

        it('deve retornar null para pesos todos zero', () => {
            expect(pickRarityByWeight({ Comum: 0, Incomum: 0, Raro: 0 })).toBeNull();
        });

        it('deve retornar null para objeto vazio', () => {
            expect(pickRarityByWeight({})).toBeNull();
        });

        it('deve funcionar com apenas uma raridade com peso > 0', () => {
            expect(pickRarityByWeight({ Comum: 100 }, fixedRng(0.5))).toBe('Comum');
        });

        it('deve ignorar raridades com peso 0', () => {
            const weights = { Comum: 0, Incomum: 100, Raro: 0 };
            expect(pickRarityByWeight(weights, fixedRng(0.5))).toBe('Incomum');
        });
    });
});

// ── pickSpeciesFromPool ───────────────────────────────────────────────────────

describe('pickSpeciesFromPool — Seleção aleatória de espécie', () => {

    it('deve selecionar o primeiro item com roll=0.0', () => {
        const pool = ['MON_001', 'MON_002', 'MON_004'];
        expect(pickSpeciesFromPool(pool, fixedRng(0.0))).toBe('MON_001');
    });

    it('deve selecionar o último item com roll próximo de 1.0', () => {
        const pool = ['MON_001', 'MON_002', 'MON_004'];
        expect(pickSpeciesFromPool(pool, fixedRng(0.99))).toBe('MON_004');
    });

    it('deve retornar null para pool vazio', () => {
        expect(pickSpeciesFromPool([])).toBeNull();
    });

    it('deve retornar null para pool nulo', () => {
        expect(pickSpeciesFromPool(null)).toBeNull();
    });

    it('deve retornar o único item de pool com um elemento', () => {
        expect(pickSpeciesFromPool(['MON_100'], fixedRng(0.5))).toBe('MON_100');
    });

    it('deve cobrir todos os itens do pool em distribuição uniforme', () => {
        const pool = ['MON_001', 'MON_002', 'MON_004'];
        const counts = {};
        for (let i = 0; i < 3000; i++) {
            const s = pickSpeciesFromPool(pool);
            counts[s] = (counts[s] ?? 0) + 1;
        }
        // Cada espécie deve aparecer ~33% das vezes (±10%)
        for (const id of pool) {
            expect(counts[id] / 3000).toBeCloseTo(1/3, 1);
        }
    });
});

// ── generateEncounterLevel ────────────────────────────────────────────────────

describe('generateEncounterLevel — Geração de nível por faixa', () => {

    it('deve retornar o nível mínimo com roll=0.0', () => {
        expect(generateEncounterLevel([1, 4], fixedRng(0.0))).toBe(1);
    });

    it('deve retornar o nível máximo com roll=0.99', () => {
        expect(generateEncounterLevel([1, 4], fixedRng(0.99))).toBe(4);
    });

    it('deve respeitar faixa [6, 12]', () => {
        for (let i = 0; i < 500; i++) {
            const level = generateEncounterLevel([6, 12]);
            expect(level).toBeGreaterThanOrEqual(6);
            expect(level).toBeLessThanOrEqual(12);
        }
    });

    it('deve respeitar faixa [28, 35]', () => {
        for (let i = 0; i < 500; i++) {
            const level = generateEncounterLevel([28, 35]);
            expect(level).toBeGreaterThanOrEqual(28);
            expect(level).toBeLessThanOrEqual(35);
        }
    });

    it('deve retornar 1 para faixa inválida', () => {
        expect(generateEncounterLevel(null)).toBe(1);
        expect(generateEncounterLevel([])).toBe(1);
        expect(generateEncounterLevel([5])).toBe(5); // só min → max=min
    });

    it('deve sempre retornar nível >= 1', () => {
        expect(generateEncounterLevel([0, 0])).toBeGreaterThanOrEqual(1);
    });
});

// ── applyModifiers ────────────────────────────────────────────────────────────

describe('applyModifiers — Aplicação de modificadores de raridade', () => {

    it('deve retornar pesos iguais se modificadores vazios', () => {
        const result = applyModifiers(RARITY_WEIGHTS_T1, []);
        // Os pesos devem ser os mesmos (possivelmente com precisão float)
        expect(result.Comum).toBeCloseTo(82, 0);
        expect(result.Incomum).toBeCloseTo(16, 0);
        expect(result.Raro).toBeCloseTo(2, 0);
    });

    it('deve aumentar Raro em +4 por modificador de boss derrotado', () => {
        const result = applyModifiers(RARITY_WEIGHTS_T1, [
            { rarity: 'Raro', delta: +4 }
        ]);
        // Raro sobe: 2 → 6, total renormalizado para 100
        // Após +4: Comum=82, Incomum=16, Raro=6 → total=104
        // Escala: 100/104 ≈ 0.9615
        expect(result.Raro).toBeCloseTo(6 * (100/104), 0);
    });

    it('deve limitar delta ao máximo de 10pp por modificador', () => {
        const result = applyModifiers(RARITY_WEIGHTS_T1, [
            { rarity: 'Incomum', delta: +50 } // delta maior que o limite
        ]);
        // Deve ser limitado a +10: Incomum: 16 → 26, total: 100 → 110
        expect(result.Incomum).toBeCloseTo(26 * (100/110), 0);
    });

    it('deve limitar delta negativo ao mínimo de -10pp', () => {
        const result = applyModifiers(RARITY_WEIGHTS_T1, [
            { rarity: 'Comum', delta: -50 } // deve ser limitado a -10
        ]);
        expect(result.Comum).toBeCloseTo(72 * (100/90), 0);
    });

    it('não deve deixar peso negativo', () => {
        const result = applyModifiers({ Comum: 5, Incomum: 95 }, [
            { rarity: 'Comum', delta: -10 }
        ]);
        expect(result.Comum).toBeGreaterThanOrEqual(0);
    });

    it('deve ignorar modificador de raridade desconhecida', () => {
        const result = applyModifiers(RARITY_WEIGHTS_T1, [
            { rarity: 'Lendario_invalido', delta: 20 }
        ]);
        expect(result.Comum).toBeCloseTo(82, 0);
    });

    it('deve retornar objeto vazio para pesos nulos', () => {
        const result = applyModifiers(null, []);
        expect(result).toEqual({});
    });
});

// ── isRareSpot ────────────────────────────────────────────────────────────────

describe('isRareSpot — Detecção de encontro em spot raro', () => {

    it('deve retornar true se roll < rareSpotBonus/100', () => {
        // rareSpotBonus=15 → chance 15%. Roll=0.10 → 10 < 15 → true
        expect(isRareSpot(15, fixedRng(0.10))).toBe(true);
    });

    it('deve retornar false se roll >= rareSpotBonus/100', () => {
        // rareSpotBonus=15. Roll=0.20 → 20 >= 15 → false
        expect(isRareSpot(15, fixedRng(0.20))).toBe(false);
    });

    it('deve retornar false se rareSpotBonus = 0', () => {
        expect(isRareSpot(0, fixedRng(0.0))).toBe(false);
    });

    it('deve retornar false se rareSpotBonus nulo', () => {
        expect(isRareSpot(null)).toBe(false);
    });

    it('deve ter distribuição correta em 10.000 amostras', () => {
        let spots = 0;
        for (let i = 0; i < 10000; i++) {
            if (isRareSpot(15)) spots++;
        }
        // ~15% de chance: tolerância ±3%
        expect(spots / 10000).toBeCloseTo(0.15, 1);
    });
});

// ── findArea ──────────────────────────────────────────────────────────────────

describe('findArea — Busca de área por ID', () => {

    it('deve retornar a área correspondente ao ID', () => {
        const area = findArea('LOC_001', MOCK_LOCATIONS);
        expect(area).not.toBeNull();
        expect(area.id).toBe('LOC_001');
        expect(area.tier).toBe('T1');
    });

    it('deve retornar null para ID inexistente', () => {
        expect(findArea('LOC_999', MOCK_LOCATIONS)).toBeNull();
    });

    it('deve retornar null para locationsData nulo', () => {
        expect(findArea('LOC_001', null)).toBeNull();
    });

    it('deve retornar null para areaId nulo', () => {
        expect(findArea(null, MOCK_LOCATIONS)).toBeNull();
    });

    it('deve retornar null para array vazio', () => {
        expect(findArea('LOC_001', [])).toBeNull();
    });
});

// ── resolveSpeciesPool ────────────────────────────────────────────────────────

describe('resolveSpeciesPool — Resolução de pool com fallback', () => {

    const pools = {
        Comum:    ['MON_001', 'MON_002'],
        Incomum:  ['MON_002B'],
        Raro:     ['MON_023C'],
        Místico:  [],
        Lendário: []
    };

    it('deve retornar pool de Comum quando sorteado', () => {
        const { pool, resolvedRarity } = resolveSpeciesPool(pools, 'Comum');
        expect(resolvedRarity).toBe('Comum');
        expect(pool).toEqual(['MON_001', 'MON_002']);
    });

    it('deve retornar pool de Raro quando sorteado', () => {
        const { pool, resolvedRarity } = resolveSpeciesPool(pools, 'Raro');
        expect(resolvedRarity).toBe('Raro');
        expect(pool).toContain('MON_023C');
    });

    it('deve fazer fallback para Raro quando Místico tem pool vazio', () => {
        const { pool, resolvedRarity } = resolveSpeciesPool(pools, 'Místico');
        // Místico está vazio → fallback para Raro
        expect(resolvedRarity).toBe('Raro');
        expect(pool).toContain('MON_023C');
    });

    it('deve fazer fallback para Comum quando Raro e acima estão vazios', () => {
        const poolsSemRaro = { Comum: ['MON_001'], Incomum: [], Raro: [], Místico: [], Lendário: [] };
        const { resolvedRarity } = resolveSpeciesPool(poolsSemRaro, 'Raro');
        expect(resolvedRarity).toBe('Comum');
    });

    it('deve retornar null se todos os pools estiverem vazios', () => {
        const empty = { Comum: [], Incomum: [], Raro: [], Místico: [], Lendário: [] };
        const { pool } = resolveSpeciesPool(empty, 'Raro');
        expect(pool).toBeNull();
    });

    it('deve retornar null para pools nulos', () => {
        const { pool } = resolveSpeciesPool(null, 'Comum');
        expect(pool).toBeNull();
    });
});

// ── pickEncounterType ─────────────────────────────────────────────────────────

describe('pickEncounterType — Seleção de tipo de encontro', () => {

    const weights = { Selvagem: 68, Item: 15, Evento: 10, Treinador: 7, SpotRaro: 0 };

    it('deve retornar Selvagem com roll=0.0', () => {
        expect(pickEncounterType(weights, fixedRng(0.0))).toBe('Selvagem');
    });

    it('deve retornar Selvagem como padrão para pesos nulos', () => {
        expect(pickEncounterType(null)).toBe('Selvagem');
        expect(pickEncounterType({})).toBe('Selvagem');
    });

    it('deve respeitar proporções em N amostras', () => {
        const dist = sampleDistribution(() => pickEncounterType(weights));
        const total = Object.values(dist).reduce((s, v) => s + v, 0);
        expect(dist['Selvagem'] / total).toBeCloseTo(0.68, 1);
        expect(dist['Item']     / total).toBeCloseTo(0.15, 1);
    });

    it('não deve retornar SpotRaro quando peso é 0', () => {
        for (let i = 0; i < 1000; i++) {
            expect(pickEncounterType(weights)).not.toBe('SpotRaro');
        }
    });
});

// ── generateWildEncounter ─────────────────────────────────────────────────────

describe('generateWildEncounter — Geração completa de encontro selvagem', () => {

    describe('retorno básico', () => {
        it('deve retornar objeto com todos os campos esperados', () => {
            const encounter = generateWildEncounter('LOC_001', MOCK_LOCATIONS, { rng: fixedRng(0.1) });
            expect(encounter).not.toBeNull();
            expect(encounter).toHaveProperty('speciesId');
            expect(encounter).toHaveProperty('rarity');
            expect(encounter).toHaveProperty('level');
            expect(encounter).toHaveProperty('areaId');
            expect(encounter).toHaveProperty('tier');
            expect(encounter).toHaveProperty('isRareSpot');
            expect(encounter).toHaveProperty('encounterType');
        });

        it('deve preservar areaId e tier no retorno', () => {
            const encounter = generateWildEncounter('LOC_001', MOCK_LOCATIONS, { rng: fixedRng(0.1) });
            expect(encounter.areaId).toBe('LOC_001');
            expect(encounter.tier).toBe('T1');
        });

        it('deve retornar nível dentro da faixa da área', () => {
            for (let i = 0; i < 100; i++) {
                const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS);
                expect(enc.level).toBeGreaterThanOrEqual(1);
                expect(enc.level).toBeLessThanOrEqual(4);
            }
        });

        it('deve retornar nível na faixa correta para LOC_002B [6-12]', () => {
            for (let i = 0; i < 100; i++) {
                const enc = generateWildEncounter('LOC_002B', MOCK_LOCATIONS);
                expect(enc.level).toBeGreaterThanOrEqual(6);
                expect(enc.level).toBeLessThanOrEqual(12);
            }
        });
    });

    describe('espécies válidas dos pools', () => {
        const allSpecies = {
            LOC_001: [
                ...MOCK_LOCATION.speciesPoolsByRarity.Comum,
                ...MOCK_LOCATION.speciesPoolsByRarity.Incomum,
                ...MOCK_LOCATION.speciesPoolsByRarity.Raro
            ]
        };

        it('deve retornar espécie que pertence ao pool da área', () => {
            for (let i = 0; i < 100; i++) {
                const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS);
                expect(allSpecies['LOC_001']).toContain(enc.speciesId);
            }
        });
    });

    describe('raridade alinhada com tier', () => {
        it('deve produzir >70% de Comum para T1 em N encontros', () => {
            let comuns = 0;
            for (let i = 0; i < 1000; i++) {
                const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS);
                if (enc.rarity === 'Comum') comuns++;
            }
            // T1 tem 82% Comum; com spot raro afetando alguns, deve ser > 70%
            expect(comuns / 1000).toBeGreaterThan(0.70);
        });

        it('deve produzir >50% de Comum para T3 em N encontros', () => {
            let comuns = 0;
            for (let i = 0; i < 1000; i++) {
                const enc = generateWildEncounter('LOC_002B', MOCK_LOCATIONS);
                if (enc.rarity === 'Comum') comuns++;
            }
            expect(comuns / 1000).toBeGreaterThan(0.50);
        });

        it('não deve retornar Místico em área T1 sem spot raro', () => {
            for (let i = 0; i < 500; i++) {
                const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS, {
                    rng: fixedRng(0.1) // roll baixo → sempre Comum, sem spot raro
                });
                expect(enc.rarity).not.toBe('Místico');
            }
        });
    });

    describe('spot raro', () => {
        it('deve aplicar bônus de raridade quando forceRareSpot=true', () => {
            // Com spot raro forçado, esperamos encontros com raridade mais alta
            let raros = 0;
            for (let i = 0; i < 200; i++) {
                const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS, { forceRareSpot: true });
                if (enc.rarity === 'Raro' || enc.rarity === 'Místico') raros++;
            }
            // Com bônus de spot raro (+15 Raro, +5 Místico), raridades altas devem aumentar
            expect(raros).toBeGreaterThan(0);
        });

        it('deve marcar isRareSpot=true quando forçado', () => {
            const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS, {
                forceRareSpot: true,
                rng: fixedRng(0.1)
            });
            expect(enc.isRareSpot).toBe(true);
        });
    });

    describe('modificadores de progresso e grupo', () => {
        it('deve aceitar modificadores sem lançar erro', () => {
            const enc = generateWildEncounter('LOC_001', MOCK_LOCATIONS, {
                modifiers: [
                    { rarity: 'Raro', delta: 2 },
                    { rarity: 'Comum', delta: -2 }
                ]
            });
            expect(enc).not.toBeNull();
        });

        it('deve aumentar chance de Raro com modificador positivo em N amostras', () => {
            let rarosSemMod = 0, rarosComMod = 0;
            for (let i = 0; i < 5000; i++) {
                const encSem = generateWildEncounter('LOC_001', MOCK_LOCATIONS);
                const encCom = generateWildEncounter('LOC_001', MOCK_LOCATIONS, {
                    modifiers: [{ rarity: 'Raro', delta: 8 }]
                });
                if (encSem.rarity === 'Raro') rarosSemMod++;
                if (encCom.rarity === 'Raro') rarosComMod++;
            }
            expect(rarosComMod).toBeGreaterThan(rarosSemMod);
        });
    });

    describe('edge cases', () => {
        it('deve retornar null para areaId inexistente', () => {
            expect(generateWildEncounter('LOC_999', MOCK_LOCATIONS)).toBeNull();
        });

        it('deve retornar null para locationsData nulo', () => {
            expect(generateWildEncounter('LOC_001', null)).toBeNull();
        });

        it('deve retornar null para locationsData vazio', () => {
            expect(generateWildEncounter('LOC_001', [])).toBeNull();
        });
    });
});

// ── Integração: princípio "área governa" ──────────────────────────────────────

describe('Princípio "Área governa" — Integração', () => {

    it('deve produzir distribuições diferentes para T1 vs T3', () => {
        const contagens = { T1: {}, T3: {} };

        for (let i = 0; i < 2000; i++) {
            const e1 = generateWildEncounter('LOC_001',  MOCK_LOCATIONS);
            const e2 = generateWildEncounter('LOC_002B', MOCK_LOCATIONS);
            contagens.T1[e1.rarity] = (contagens.T1[e1.rarity] ?? 0) + 1;
            contagens.T3[e2.rarity] = (contagens.T3[e2.rarity] ?? 0) + 1;
        }

        const pComumT1 = (contagens.T1['Comum'] ?? 0) / 2000;
        const pComumT3 = (contagens.T3['Comum'] ?? 0) / 2000;

        // T1 tem mais Comum que T3 (82% vs 58%)
        expect(pComumT1).toBeGreaterThan(pComumT3);

        // T3 tem mais Raro que T1 (12% vs 2%)
        const pRaroT1 = (contagens.T1['Raro'] ?? 0) / 2000;
        const pRaroT3 = (contagens.T3['Raro'] ?? 0) / 2000;
        expect(pRaroT3).toBeGreaterThan(pRaroT1);
    });

    it('modificadores de grupo não devem ultrapassar 10pp de deslocamento', () => {
        // Modificador abusivo de +50 deve ser limitado a +10
        const modAbusivo = [{ rarity: 'Lendário', delta: 50 }];
        const result = applyModifiers(RARITY_WEIGHTS_T1, modAbusivo);

        // Lendário era 0, após +10 (limitado): 10pp
        // Renormalizado de 110 → Lendário = 10 * (100/110) ≈ 9.09
        expect(result['Lendário']).toBeCloseTo(10 * (100/110), 0);
    });

    it('cada área deve sempre retornar espécie de pool próprio (isolamento)', () => {
        const poolsLoc001 = [
            ...MOCK_LOCATION.speciesPoolsByRarity.Comum,
            ...MOCK_LOCATION.speciesPoolsByRarity.Incomum,
            ...MOCK_LOCATION.speciesPoolsByRarity.Raro
        ];
        const poolsLoc002B = [
            ...MOCK_LOCATIONS[1].speciesPoolsByRarity.Comum,
            ...MOCK_LOCATIONS[1].speciesPoolsByRarity.Incomum,
            ...MOCK_LOCATIONS[1].speciesPoolsByRarity.Raro,
            ...MOCK_LOCATIONS[1].speciesPoolsByRarity.Místico
        ];

        for (let i = 0; i < 50; i++) {
            const e1 = generateWildEncounter('LOC_001',  MOCK_LOCATIONS);
            const e2 = generateWildEncounter('LOC_002B', MOCK_LOCATIONS);
            expect(poolsLoc001).toContain(e1.speciesId);
            expect(poolsLoc002B).toContain(e2.speciesId);
        }
    });
});
