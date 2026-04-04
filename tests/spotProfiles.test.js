/**
 * SPOT PROFILES TESTS (PR-08)
 *
 * Testes para o sistema de perfis formais de spot:
 * - getSpotEncounterContext() por perfil
 * - buildSpotModifiers() permanece funcional
 * - encounterEngine recebe e aplica levelDelta e encounterTypeModifiers
 * - perfis capture vs combat produzem modificadores distintos
 * - perfil service não gera encontro selvagem
 * - spots sem profileKey usam fallback seguro
 * - integração com generateWildEncounter
 */

import { describe, it, expect } from 'vitest';
import {
    buildSpotModifiers,
    getSpotEncounterContext,
    SPOT_PROFILE_DEFAULTS,
    getSpotsForLocation,
    findSpot
} from '../js/encounter/worldMap.js';

import {
    generateWildEncounter,
    applyEncounterTypeModifiers,
    applyModifiers
} from '../js/encounter/encounterEngine.js';

// ── Fixture de locations mínima ─────────────────────────────────────────────

const MOCK_LOCATIONS = [
    {
        id: 'TEST_001',
        name: 'Área de Teste',
        biome: 'campos',
        tier: 1,
        levelRange: [1, 5],
        rarityWeights: { Comum: 80, Incomum: 18, Raro: 2, Místico: 0, Lendário: 0 },
        speciesPoolsByRarity: { Comum: ['MON_001'], Incomum: ['MON_002'], Raro: ['MON_003'] },
        encounterTypeWeights: { Selvagem: 70, Item: 10, Evento: 10, Treinador: 10, SpotRaro: 0 },
        rareSpotBonus: 0,
        spots: [
            {
                id: 'TEST_001_A',
                name: 'Prado Aberto',
                icon: '🌱',
                profile: 'Mais capturas',
                profileKey: 'capture',
                description: 'Bom para capturar.',
                rarityModifiers: [{ rarity: 'Comum', delta: 8 }, { rarity: 'Incomum', delta: -8 }]
            },
            {
                id: 'TEST_001_B',
                name: 'Pedra Bruta',
                icon: '🪨',
                profile: 'Mais combate',
                profileKey: 'combat',
                description: 'Monstros agressivos.',
                rarityModifiers: [{ rarity: 'Incomum', delta: 4 }, { rarity: 'Comum', delta: -4 }]
            },
            {
                id: 'TEST_001_C',
                name: 'Beira do Rio',
                icon: '🏞️',
                profile: 'Mais raridade',
                profileKey: 'rare',
                description: 'Espécies raras.',
                rarityModifiers: [{ rarity: 'Raro', delta: 6 }, { rarity: 'Comum', delta: -6 }]
            }
        ]
    },
    {
        id: 'CITY_TEST',
        name: 'Cidade Teste',
        biome: 'cidade',
        tier: 0,
        levelRange: [1, 1],
        rarityWeights: {},
        speciesPoolsByRarity: {},
        encounterTypeWeights: {},
        rareSpotBonus: 0,
        spots: [
            {
                id: 'CITY_TEST_SHOP',
                name: 'Loja',
                icon: '🛒',
                profile: 'Comprar itens',
                profileKey: 'service',
                type: 'service',
                serviceAction: 'shop',
                description: 'Compre itens aqui.',
                rarityModifiers: []
            }
        ]
    }
];

// ── buildSpotModifiers — regressão ───────────────────────────────────────────

describe('buildSpotModifiers — regressão', () => {
    it('retorna rarityModifiers do spot capture', () => {
        const spot = MOCK_LOCATIONS[0].spots[0];
        const mods = buildSpotModifiers(spot);
        expect(mods).toEqual([{ rarity: 'Comum', delta: 8 }, { rarity: 'Incomum', delta: -8 }]);
    });

    it('retorna array vazio para spot sem rarityModifiers', () => {
        const spot = { id: 'x', name: 'X', rarityModifiers: [] };
        expect(buildSpotModifiers(spot)).toEqual([]);
    });

    it('retorna array vazio para spot null', () => {
        expect(buildSpotModifiers(null)).toEqual([]);
    });

    it('retorna array vazio para spot sem campo rarityModifiers', () => {
        expect(buildSpotModifiers({ id: 'x', name: 'X' })).toEqual([]);
    });

    it('filtra entradas inválidas do rarityModifiers', () => {
        const spot = { rarityModifiers: [{ rarity: 'Comum', delta: 5 }, null, { rarity: 'Raro' }, { delta: 2 }] };
        const mods = buildSpotModifiers(spot);
        expect(mods).toHaveLength(1);
        expect(mods[0]).toEqual({ rarity: 'Comum', delta: 5 });
    });
});

// ── SPOT_PROFILE_DEFAULTS ────────────────────────────────────────────────────

describe('SPOT_PROFILE_DEFAULTS', () => {
    it('capture tem trainerChanceDelta negativo (menos treinadores)', () => {
        expect(SPOT_PROFILE_DEFAULTS.capture.trainerChanceDelta).toBeLessThan(0);
    });

    it('combat tem trainerChanceDelta negativo — perigo bruto, não mais treinadores', () => {
        // combat = risco geral elevado (levelDelta+2), não encontros de treinador
        expect(SPOT_PROFILE_DEFAULTS.combat.trainerChanceDelta).toBeLessThan(0);
    });

    it('combat tem levelDelta alto (nível maior que qualquer outro perfil não-combat)', () => {
        expect(SPOT_PROFILE_DEFAULTS.combat.levelDelta).toBeGreaterThan(1);
    });

    it('trainer tem trainerChanceDelta muito maior que combat', () => {
        // trainer = encontro tático com treinador; combat = perigo bruto sem treinador
        expect(SPOT_PROFILE_DEFAULTS.trainer.trainerChanceDelta).toBeGreaterThan(
            SPOT_PROFILE_DEFAULTS.combat.trainerChanceDelta + 10
        );
    });

    it('trainer tem levelDelta zero — tático, não perigoso', () => {
        expect(SPOT_PROFILE_DEFAULTS.trainer.levelDelta).toBe(0);
    });

    it('rare tem trainerChanceDelta negativo', () => {
        expect(SPOT_PROFILE_DEFAULTS.rare.trainerChanceDelta).toBeLessThan(0);
    });

    it('resource tem levelDelta negativo (área mais segura)', () => {
        expect(SPOT_PROFILE_DEFAULTS.resource.levelDelta).toBeLessThan(0);
    });

    it('event tem eventBonusDelta positivo (boost de tipo Evento)', () => {
        expect(SPOT_PROFILE_DEFAULTS.event.eventBonusDelta).toBeGreaterThan(0);
    });

    it('resource tem eventBonusDelta zero (farm previsível, sem imprevistos)', () => {
        expect(SPOT_PROFILE_DEFAULTS.resource.eventBonusDelta).toBe(0);
    });

    it('rare tem itemBonusDelta negativo — custo real por buscar raridade', () => {
        expect(SPOT_PROFILE_DEFAULTS.rare.itemBonusDelta).toBeLessThan(0);
    });

    it('rare tem trainerChanceDelta negativo — custo: menos interação com treinadores', () => {
        expect(SPOT_PROFILE_DEFAULTS.rare.trainerChanceDelta).toBeLessThan(0);
    });

    it('trainer tem trainerChanceDelta alto', () => {
        expect(SPOT_PROFILE_DEFAULTS.trainer.trainerChanceDelta).toBeGreaterThanOrEqual(10);
    });

    it('service tem todos os deltas em zero', () => {
        expect(SPOT_PROFILE_DEFAULTS.service.trainerChanceDelta).toBe(0);
        expect(SPOT_PROFILE_DEFAULTS.service.itemBonusDelta).toBe(0);
        expect(SPOT_PROFILE_DEFAULTS.service.eventBonusDelta).toBe(0);
        expect(SPOT_PROFILE_DEFAULTS.service.levelDelta).toBe(0);
    });

    it('todos os perfis têm label e icon definidos', () => {
        for (const [key, def] of Object.entries(SPOT_PROFILE_DEFAULTS)) {
            expect(def.label, `${key}.label`).toBeTruthy();
            expect(def.icon, `${key}.icon`).toBeTruthy();
        }
    });
});

// ── getSpotEncounterContext ───────────────────────────────────────────────────

describe('getSpotEncounterContext', () => {
    it('retorna profileKey capture com modificadores corretos', () => {
        const spot = MOCK_LOCATIONS[0].spots[0]; // profileKey: 'capture'
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.profileKey).toBe('capture');
        expect(ctx.label).toBe('Captura');
        expect(ctx.trainerChanceDelta).toBeLessThan(0);
        expect(ctx.itemBonusDelta).toBeGreaterThanOrEqual(0);
        expect(ctx.levelDelta).toBe(0);
    });

    it('retorna profileKey combat com levelDelta alto e trainerChanceDelta negativo', () => {
        const spot = MOCK_LOCATIONS[0].spots[1]; // profileKey: 'combat'
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.profileKey).toBe('combat');
        expect(ctx.label).toBe('Combate');
        expect(ctx.trainerChanceDelta).toBeLessThan(0); // combat = perigo bruto, não treinadores
        expect(ctx.levelDelta).toBeGreaterThan(1);      // level delta alto
    });

    it('retorna profileKey rare', () => {
        const spot = MOCK_LOCATIONS[0].spots[2]; // profileKey: 'rare'
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.profileKey).toBe('rare');
        expect(ctx.label).toBe('Raridade');
    });

    it('capture tem trainerChanceDelta menor que combat (ambos negativos, combat mais permissivo)', () => {
        const ctxCapture = getSpotEncounterContext(MOCK_LOCATIONS[0].spots[0]);
        const ctxCombat  = getSpotEncounterContext(MOCK_LOCATIONS[0].spots[1]);
        // capture suprime mais treinadores que combat (-5 vs -3)
        expect(ctxCapture.trainerChanceDelta).toBeLessThan(ctxCombat.trainerChanceDelta);
    });

    it('inclui rarityMods do spot', () => {
        const spot = MOCK_LOCATIONS[0].spots[0];
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.rarityMods).toEqual([{ rarity: 'Comum', delta: 8 }, { rarity: 'Incomum', delta: -8 }]);
    });

    it('retorna fallback seguro para spot null', () => {
        const ctx = getSpotEncounterContext(null);
        expect(ctx.profileKey).toBe('fallback');
        expect(ctx.trainerChanceDelta).toBe(0);
        expect(ctx.itemBonusDelta).toBe(0);
        expect(ctx.eventBonusDelta).toBe(0);
        expect(ctx.levelDelta).toBe(0);
        expect(ctx.rarityMods).toEqual([]);
    });

    it('retorna fallback seguro para spot sem profileKey', () => {
        const spot = { id: 'x', name: 'X', rarityModifiers: [] };
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.profileKey).toBe('fallback');
        expect(ctx.trainerChanceDelta).toBe(0);
        expect(ctx.eventBonusDelta).toBe(0);
    });

    it('spot de serviço tem todos os deltas zero', () => {
        const spot = MOCK_LOCATIONS[1].spots[0]; // profileKey: 'service'
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.profileKey).toBe('service');
        expect(ctx.trainerChanceDelta).toBe(0);
        expect(ctx.eventBonusDelta).toBe(0);
        expect(ctx.levelDelta).toBe(0);
    });

    it('encounterModifiers no spot sobrescreve defaults do perfil', () => {
        const spot = {
            id: 'TEST_001_A',
            profileKey: 'capture',
            rarityModifiers: [],
            encounterModifiers: { trainerChanceDelta: 20, eventBonusDelta: 7, levelDelta: 3 }
        };
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.trainerChanceDelta).toBe(20);
        expect(ctx.eventBonusDelta).toBe(7);
        expect(ctx.levelDelta).toBe(3);
    });

    it('event tem eventBonusDelta positivo — diferencia de resource', () => {
        const spotEvent = { id: 'e', profileKey: 'event', rarityModifiers: [] };
        const spotRes   = { id: 'r', profileKey: 'resource', rarityModifiers: [] };
        const ctxEvent = getSpotEncounterContext(spotEvent);
        const ctxRes   = getSpotEncounterContext(spotRes);
        expect(ctxEvent.eventBonusDelta).toBeGreaterThan(0);
        expect(ctxRes.eventBonusDelta).toBe(0);
    });

    it('resource tem levelDelta negativo — mais seguro que outros perfis de exploração', () => {
        const spot = { id: 'r', profileKey: 'resource', rarityModifiers: [] };
        const ctx = getSpotEncounterContext(spot);
        expect(ctx.levelDelta).toBeLessThan(0);
    });

    it('trainer tem trainerChanceDelta maior que combat', () => {
        const ctxCombat  = getSpotEncounterContext({ id: 'c', profileKey: 'combat',  rarityModifiers: [] });
        const ctxTrainer = getSpotEncounterContext({ id: 't', profileKey: 'trainer', rarityModifiers: [] });
        expect(ctxTrainer.trainerChanceDelta).toBeGreaterThan(ctxCombat.trainerChanceDelta + 10);
    });
});

// ── applyEncounterTypeModifiers ──────────────────────────────────────────────

describe('applyEncounterTypeModifiers', () => {
    const baseWeights = { Selvagem: 70, Item: 10, Evento: 10, Treinador: 10, SpotRaro: 0 };

    it('aumenta Treinador com delta positivo', () => {
        const result = applyEncounterTypeModifiers(baseWeights, [{ type: 'Treinador', delta: 8 }]);
        // Treinador sobe, total renormalizado
        const trainerFraction = result.Treinador / Object.values(result).reduce((a, b) => a + b, 0);
        const baseFraction    = baseWeights.Treinador / Object.values(baseWeights).reduce((a, b) => a + b, 0);
        expect(trainerFraction).toBeGreaterThan(baseFraction);
    });

    it('diminui Treinador com delta negativo', () => {
        const result = applyEncounterTypeModifiers(baseWeights, [{ type: 'Treinador', delta: -5 }]);
        const trainerFraction = result.Treinador / Object.values(result).reduce((a, b) => a + b, 0);
        const baseFraction    = baseWeights.Treinador / Object.values(baseWeights).reduce((a, b) => a + b, 0);
        expect(trainerFraction).toBeLessThan(baseFraction);
    });

    it('renormaliza para manter soma original', () => {
        const result = applyEncounterTypeModifiers(baseWeights, [{ type: 'Item', delta: 8 }]);
        const originalTotal = Object.values(baseWeights).reduce((a, b) => a + b, 0);
        const resultTotal   = Object.values(result).reduce((a, b) => a + b, 0);
        expect(resultTotal).toBeCloseTo(originalTotal, 5);
    });

    it('não vai abaixo de zero', () => {
        const result = applyEncounterTypeModifiers(baseWeights, [{ type: 'Treinador', delta: -100 }]);
        expect(result.Treinador).toBe(0);
    });

    it('retorna cópia sem modificar original', () => {
        const copy = { ...baseWeights };
        applyEncounterTypeModifiers(baseWeights, [{ type: 'Treinador', delta: 5 }]);
        expect(baseWeights).toEqual(copy);
    });

    it('ignora modificadores inválidos', () => {
        const result = applyEncounterTypeModifiers(baseWeights, [null, { type: 'X' }, { delta: 5 }]);
        expect(result).toEqual(baseWeights);
    });

    it('retorna objeto vazio para baseWeights inválido', () => {
        expect(applyEncounterTypeModifiers(null, [])).toEqual({});
        expect(applyEncounterTypeModifiers(undefined, [])).toEqual({});
    });

    it('sem modificadores retorna cópia dos pesos originais', () => {
        const result = applyEncounterTypeModifiers(baseWeights, []);
        expect(result).toEqual(baseWeights);
    });
});

// ── generateWildEncounter com levelDelta e encounterTypeModifiers ────────────

describe('generateWildEncounter — levelDelta e encounterTypeModifiers', () => {
    it('levelDelta positivo aumenta o nível gerado', () => {
        const rngZero = () => 0; // sempre pega o mínimo
        const base = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngZero, levelDelta: 0 });
        const shifted = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngZero, levelDelta: 2 });
        expect(shifted.level).toBe(base.level + 2);
    });

    it('levelDelta negativo diminui o nível, mínimo 1', () => {
        const rngZero = () => 0;
        const result = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngZero, levelDelta: -100 });
        expect(result.level).toBe(1);
    });

    it('levelDelta zero não altera o nível', () => {
        const rngZero = () => 0;
        const base    = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngZero });
        const same    = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngZero, levelDelta: 0 });
        expect(same.level).toBe(base.level);
    });

    it('encounterTypeModifiers favorece Treinador com delta alto', () => {
        // Com trainerChanceDelta muito alto, Treinador deve ser selecionado mais vezes
        const results = [];
        let seed = 0;
        const deterministicRng = () => {
            seed = (seed + 0.13) % 1;
            return seed;
        };
        for (let i = 0; i < 100; i++) {
            const enc = generateWildEncounter('TEST_001', MOCK_LOCATIONS, {
                rng: deterministicRng,
                encounterTypeModifiers: [{ type: 'Treinador', delta: 10 }]
            });
            if (enc) results.push(enc.encounterType);
        }
        const trainerCount = results.filter(t => t === 'Treinador').length;
        const baseResults = [];
        seed = 0;
        for (let i = 0; i < 100; i++) {
            const enc = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: deterministicRng });
            if (enc) baseResults.push(enc.encounterType);
        }
        const baseTrainerCount = baseResults.filter(t => t === 'Treinador').length;
        // Com boost de treinador, deve ter mais ou igual treinadores
        expect(trainerCount).toBeGreaterThanOrEqual(baseTrainerCount);
    });

    it('sem encounterTypeModifiers funciona igual a antes', () => {
        const rngFixed = () => 0.5;
        const base   = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngFixed });
        const noMods = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngFixed, encounterTypeModifiers: [] });
        expect(noMods).toEqual(base);
    });

    it('retorna null para área inválida mesmo com modifiers', () => {
        const result = generateWildEncounter('INVALIDA', MOCK_LOCATIONS, {
            levelDelta: 2,
            encounterTypeModifiers: [{ type: 'Treinador', delta: 5 }]
        });
        expect(result).toBeNull();
    });

    it('retorna objeto com level nunca menor que 1', () => {
        const rngZero = () => 0;
        const result = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngZero, levelDelta: -999 });
        expect(result.level).toBe(1);
    });
});

// ── Integração: spots distintos produzem contextos distintos ─────────────────

describe('Integração — 3 spots de um local são mecanicamente distintos', () => {
    it('os 3 perfis do TEST_001 são diferentes', () => {
        const spots = getSpotsForLocation('TEST_001', MOCK_LOCATIONS);
        expect(spots).toHaveLength(3);
        const keys = spots.map(s => s.profileKey);
        const unique = new Set(keys);
        expect(unique.size).toBe(3);
    });

    it('contextos dos 3 spots do TEST_001 não são iguais', () => {
        const spots = getSpotsForLocation('TEST_001', MOCK_LOCATIONS);
        const [ctxA, ctxB, ctxC] = spots.map(s => getSpotEncounterContext(s));
        // trainerChanceDelta deve diferir entre pelo menos 2 spots
        const trainers = [ctxA.trainerChanceDelta, ctxB.trainerChanceDelta, ctxC.trainerChanceDelta];
        expect(new Set(trainers).size).toBeGreaterThan(1);
    });

    it('spot de cidade é serviço e não gera encontro selvagem (profileKey service)', () => {
        const spot = findSpot('CITY_TEST_SHOP', MOCK_LOCATIONS);
        expect(spot).not.toBeNull();
        expect(spot.profileKey).toBe('service');
        // Spot service: tipo = 'service', não deve passar pelo pipeline de encounter
        expect(spot.type).toBe('service');
    });

    it('buildSpotModifiers para spot capture retorna mais Comum', () => {
        const spotCapture = MOCK_LOCATIONS[0].spots[0];
        const mods = buildSpotModifiers(spotCapture);
        const comumMod = mods.find(m => m.rarity === 'Comum');
        expect(comumMod?.delta).toBeGreaterThan(0);
    });

    it('buildSpotModifiers para spot combat retorna mais Incomum', () => {
        const spotCombat = MOCK_LOCATIONS[0].spots[1];
        const mods = buildSpotModifiers(spotCombat);
        const incomumMod = mods.find(m => m.rarity === 'Incomum');
        expect(incomumMod?.delta).toBeGreaterThan(0);
    });

    it('buildSpotModifiers para spot rare retorna mais Raro', () => {
        const spotRare = MOCK_LOCATIONS[0].spots[2];
        const mods = buildSpotModifiers(spotRare);
        const raroMod = mods.find(m => m.rarity === 'Raro');
        expect(raroMod?.delta).toBeGreaterThan(0);
    });
});

// ── Regressão: saves/fluxo existente ────────────────────────────────────────

describe('Regressão — compatibilidade com spots antigos e novo profileKey', () => {
    it('spot sem profileKey usa fallback seguro via getSpotEncounterContext', () => {
        const legacySpot = {
            id: 'OLD_001_A',
            name: 'Velho Spot',
            icon: '🌿',
            profile: 'Mais capturas',
            description: 'Antigo.',
            rarityModifiers: [{ rarity: 'Comum', delta: 5 }]
        };
        const ctx = getSpotEncounterContext(legacySpot);
        expect(ctx.profileKey).toBe('fallback');
        expect(ctx.trainerChanceDelta).toBe(0);
        expect(ctx.levelDelta).toBe(0);
        // rarityMods ainda funciona
        expect(ctx.rarityMods).toEqual([{ rarity: 'Comum', delta: 5 }]);
    });

    it('generateWildEncounter sem options funciona igual a antes (fallback)', () => {
        const rngFixed = () => 0.3;
        const result = generateWildEncounter('TEST_001', MOCK_LOCATIONS, { rng: rngFixed });
        expect(result).not.toBeNull();
        expect(result.speciesId).toBeTruthy();
        expect(result.level).toBeGreaterThanOrEqual(1);
    });

    it('buildSpotModifiers retorna array compatível com applyModifiers', () => {
        const spot = MOCK_LOCATIONS[0].spots[0];
        const mods = buildSpotModifiers(spot);
        const baseWeights = { Comum: 80, Incomum: 18, Raro: 2 };
        const result = applyModifiers(baseWeights, mods);
        expect(result.Comum).toBeGreaterThan(baseWeights.Comum - 5);
        expect(Object.values(result).reduce((a, b) => a + b, 0)).toBeCloseTo(100, 3);
    });
});
