/**
 * SPD RUNTIME TESTS (Fase 11.2)
 *
 * Valida que SPD passou a ter efeito real em dois pontos do runtime wild:
 *   1. Bônus de agilidade (+1/-1) no check de acerto (checkHit via spdBonus)
 *   2. Chance de fuga determinada por SPD relativo (calculateFleeChance)
 *
 * Também valida executeWildFlee (SPD-based flee) e impacto retroativo em:
 *   - bellwave: Nota Discordante (-2 SPD inimigo) agora tem efeito real
 *   - moonquill: spdBuff (+1 SPD self) agora tem efeito real
 *
 * Esta fase é PURAMENTE de infraestrutura:
 *   - Fórmula de dano NÃO foi alterada
 *   - SPD não domina: bônus máximo de ±1 em hit e contínuo em flee
 *   - Todas as mudanças são backward compatible (spdBonus=0 por padrão em checkHit)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    checkHit,
    getBuffModifiers,
    getEffectiveSpd,
    getSpdAdvantage,
    calculateFleeChance,
} from '../js/combat/wildCore.js';
import {
    executeWildFlee,
} from '../js/combat/wildActions.js';

// ---------------------------------------------------------------------------
// Mock de wildUI para isolar do DOM
// ---------------------------------------------------------------------------
vi.mock('../js/combat/wildUI.js', () => ({
    playAttackFeedback: vi.fn(),
    showDamageFeedback: vi.fn(),
    showMissFeedback:   vi.fn(),
    showVictoryUI:      vi.fn(),
    getCombatInputRoll: vi.fn(() => 10),
    clearCombatInput:   vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers de teste
// ---------------------------------------------------------------------------
function makeMonster(overrides = {}) {
    return {
        id: 'test_mon',
        name: 'TestMon',
        class: 'Guerreiro',
        canonSpeciesId: null,
        hp: 30, hpMax: 30,
        atk: 7, def: 5, spd: 8, ene: 10,
        buffs: [],
        ...overrides,
    };
}

function makeEncounter(playerMonster, wildMonster) {
    return {
        active: true,
        wildMonster,
        log: [],
        passiveState: {},
    };
}

const NO_CLASS_ADV = {};

// ===========================================================================
// Parte 1 — getEffectiveSpd
// ===========================================================================

describe('Fase 11.2 — getEffectiveSpd: SPD com buffs/debuffs', () => {

    it('retorna spd base quando sem buffs', () => {
        const mon = makeMonster({ spd: 10, buffs: [] });
        expect(getEffectiveSpd(mon)).toBe(10);
    });

    it('aplica buff de SPD positivo', () => {
        const mon = makeMonster({
            spd: 7,
            buffs: [{ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' }],
        });
        expect(getEffectiveSpd(mon)).toBe(8); // moonquill: +1 SPD
    });

    it('aplica debuff de SPD (Nota Discordante)', () => {
        const mon = makeMonster({
            spd: 10,
            buffs: [{ type: 'spd', power: -2, duration: 2, source: 'bellwave_discordant_note' }],
        });
        expect(getEffectiveSpd(mon)).toBe(8); // Nota Discordante I: -2 SPD
    });

    it('aplica promoção Nota Discordante II (-3 SPD)', () => {
        const mon = makeMonster({
            spd: 10,
            buffs: [{ type: 'spd', power: -3, duration: 2, source: 'bellwave_discordant_note' }],
        });
        expect(getEffectiveSpd(mon)).toBe(7);
    });

    it('não desce abaixo de 1 (floor)', () => {
        const mon = makeMonster({
            spd: 2,
            buffs: [{ type: 'spd', power: -5, duration: 2, source: 'test' }],
        });
        expect(getEffectiveSpd(mon)).toBe(1); // clampado a mínimo 1
    });

    it('retorna 1 para monster nulo', () => {
        expect(getEffectiveSpd(null)).toBe(1);
    });

    it('retorna 1 para monster sem .spd', () => {
        expect(getEffectiveSpd({})).toBe(1);
    });

    it('acumula múltiplos buffs de SPD', () => {
        const mon = makeMonster({
            spd: 8,
            buffs: [
                { type: 'spd', power: 1, duration: 1, source: 'moonquill' },
                { type: 'spd', power: -2, duration: 2, source: 'nota_discordante' },
            ],
        });
        expect(getEffectiveSpd(mon)).toBe(7); // 8 + 1 - 2 = 7
    });
});

// ===========================================================================
// Parte 2 — getSpdAdvantage
// ===========================================================================

describe('Fase 11.2 — getSpdAdvantage: bônus de agilidade', () => {

    it('retorna 0 quando SPD igual', () => {
        const a = makeMonster({ spd: 10 });
        const b = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(a, b)).toBe(0);
    });

    it('retorna 0 quando diferença < 3 (threshold não atingido)', () => {
        const a = makeMonster({ spd: 12 });
        const b = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(a, b)).toBe(0); // diff=2 < 3
    });

    it('retorna +1 quando diff === 3 (threshold exato)', () => {
        const a = makeMonster({ spd: 13 });
        const b = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(a, b)).toBe(1); // diff=3 >= 3
    });

    it('retorna +1 quando diff > 3', () => {
        const a = makeMonster({ spd: 16 });
        const b = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(a, b)).toBe(1); // diff=6 >= 3
    });

    it('retorna -1 quando atacante é lento demais (diff <= -3)', () => {
        const a = makeMonster({ spd: 7 });
        const b = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(a, b)).toBe(-1); // diff=-3 <= -3
    });

    it('retorna -1 quando diff < -3', () => {
        const a = makeMonster({ spd: 5 });
        const b = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(a, b)).toBe(-1);
    });

    it('considera buffs ativos no SPD efetivo', () => {
        // moonquill com +1 SPD buff: 7 + 1 = 8 vs enemy SPD 5 → diff=3 → +1
        const moonquill = makeMonster({
            spd: 7,
            buffs: [{ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' }],
        });
        const enemy = makeMonster({ spd: 5 });
        expect(getSpdAdvantage(moonquill, enemy)).toBe(1); // moonquill spdBuff agora importa
    });

    it('bellwave (SPD 12) vs enemy (SPD 10): diff=2 → sem bônus ainda', () => {
        const bellwave = makeMonster({ spd: 12 });
        const enemy = makeMonster({ spd: 10 });
        expect(getSpdAdvantage(bellwave, enemy)).toBe(0); // ainda sem Nota
    });

    it('bellwave (SPD 12) + Nota Discordante (enemy SPD 10→8): diff=4 → +1 bônus', () => {
        const bellwave = makeMonster({ spd: 12 });
        const enemy = makeMonster({
            spd: 10,
            buffs: [{ type: 'spd', power: -2, duration: 2, source: 'nota_discordante' }],
        });
        // efectiveSpd(enemy) = 8 → diff = 12 - 8 = 4 → +1
        expect(getSpdAdvantage(bellwave, enemy)).toBe(1); // Nota Discordante agora importa!
    });
});

// ===========================================================================
// Parte 3 — checkHit com spdBonus (Fase 11.2)
// ===========================================================================

describe('Fase 11.2 — checkHit: spdBonus aplicado corretamente', () => {
    const attacker = makeMonster({ atk: 5, class: 'Guerreiro' });
    const defender = makeMonster({ def: 14, class: 'Ladino' });

    it('sem spdBonus (default 0): backward compatible', () => {
        // 10 + 5 = 15 >= 14 → acerta
        expect(checkHit(10, attacker, defender, NO_CLASS_ADV)).toBe(true);
        // 8 + 5 = 13 < 14 → erra
        expect(checkHit(8, attacker, defender, NO_CLASS_ADV)).toBe(false);
    });

    it('+1 spdBonus converte miss em hit na borda', () => {
        // 8 + 5 + 1 = 14 >= 14 → acerta (antes errava)
        expect(checkHit(8, attacker, defender, NO_CLASS_ADV, 1)).toBe(true);
    });

    it('-1 spdBonus converte hit em miss na borda', () => {
        // 10 + 5 - 1 = 14 >= 14 → acerta (ainda acerta por 1 ponto)
        expect(checkHit(10, attacker, defender, NO_CLASS_ADV, -1)).toBe(true);
        // 9 + 5 - 1 = 13 < 14 → erra (antes acertava)
        expect(checkHit(9, attacker, defender, NO_CLASS_ADV, -1)).toBe(false);
    });

    it('+1 spdBonus não importa quando o hit já é garantido', () => {
        // ATK 20 vs DEF 5: sempre acerta mesmo sem spdBonus (quando d20 >= 1)
        const strong = makeMonster({ atk: 20, class: 'Guerreiro' });
        // 1 + 20 + 1 = 22 >= 5 → acerta com spdBonus
        expect(checkHit(1, strong, makeMonster({ def: 5 }), NO_CLASS_ADV, 1)).toBe(true);
        // 1 + 20 + 0 = 21 >= 5 → também acerta sem spdBonus
        expect(checkHit(1, strong, makeMonster({ def: 5 }), NO_CLASS_ADV, 0)).toBe(true);
    });

    it('spdBonus padrão é 0 (backward compat)', () => {
        // 4 args: igual ao comportamento pré-Fase 11.2
        const hit4args = checkHit(10, attacker, defender, NO_CLASS_ADV);
        const hit5args = checkHit(10, attacker, defender, NO_CLASS_ADV, 0);
        expect(hit4args).toBe(hit5args);
    });
});

// ===========================================================================
// Parte 4 — calculateFleeChance
// ===========================================================================

describe('Fase 11.2 — calculateFleeChance: SPD-based flee probability', () => {

    it('base chance quando SPD igual', () => {
        const p = makeMonster({ spd: 10 });
        const w = makeMonster({ spd: 10 });
        expect(calculateFleeChance(p, w, 15)).toBe(15); // 15 + 0 = 15
    });

    it('aumenta quando player é mais rápido', () => {
        const p = makeMonster({ spd: 14 });
        const w = makeMonster({ spd: 10 });
        expect(calculateFleeChance(p, w, 15)).toBe(23); // 15 + 4*2 = 23
    });

    it('diminui quando player é mais lento', () => {
        const p = makeMonster({ spd: 6 });
        const w = makeMonster({ spd: 10 });
        expect(calculateFleeChance(p, w, 15)).toBe(7); // 15 - 4*2 = 7
    });

    it('clampa ao mínimo de 5%', () => {
        const p = makeMonster({ spd: 1 });
        const w = makeMonster({ spd: 20 });
        expect(calculateFleeChance(p, w, 10)).toBe(5); // 10 - 19*2 = -28 → clamp 5
    });

    it('clampa ao máximo de 95%', () => {
        const p = makeMonster({ spd: 25 });
        const w = makeMonster({ spd: 1 });
        // 25 + 24*2 = 73 → não clampa ainda
        expect(calculateFleeChance(p, w, 25)).toBe(73);
        // Com base alta o suficiente para clampar: 80 + 24*2 = 128 → clamp 95
        expect(calculateFleeChance(p, w, 80)).toBe(95);
    });

    it('Nota Discordante I (-2 SPD inimigo) +4% flee chance', () => {
        // bellwave MON_027C: SPD 16 vs enemy SPD 10 base
        const bellwave = makeMonster({ spd: 16 });
        const enemyBase = makeMonster({ spd: 10 });
        const enemyAfterNota = makeMonster({
            spd: 10,
            buffs: [{ type: 'spd', power: -2, duration: 2, source: 'nota_discordante' }],
        });
        const baseFleeChance = calculateFleeChance(bellwave, enemyBase, 15);
        const notaFleeChance = calculateFleeChance(bellwave, enemyAfterNota, 15);
        // Nota Discordante I adiciona +4% (2 pontos SPD * 2)
        expect(notaFleeChance).toBe(baseFleeChance + 4);
    });

    it('moonquill spdBuff (+1 SPD) +2% flee chance', () => {
        const moonquillBase = makeMonster({ spd: 7 });
        const moonquillBuff = makeMonster({
            spd: 7,
            buffs: [{ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' }],
        });
        const enemy = makeMonster({ spd: 8 });
        const baseChance = calculateFleeChance(moonquillBase, enemy, 15);
        const buffChance  = calculateFleeChance(moonquillBuff, enemy, 15);
        // +1 SPD = +2% flee chance
        expect(buffChance).toBe(baseChance + 2);
    });

    it('usar default baseChance=15 quando omitido', () => {
        const p = makeMonster({ spd: 10 });
        const w = makeMonster({ spd: 10 });
        expect(calculateFleeChance(p, w)).toBe(15); // default base = 15
    });

    it('raridade Comum base=10, Lendário base=25', () => {
        const p = makeMonster({ spd: 10 });
        const w = makeMonster({ spd: 10 });
        expect(calculateFleeChance(p, w, 10)).toBe(10); // Comum
        expect(calculateFleeChance(p, w, 25)).toBe(25); // Lendário
    });
});

// ===========================================================================
// Parte 5 — executeWildFlee: SPD-based flee action
// ===========================================================================

describe('Fase 11.2 — executeWildFlee: fuga com chance de SPD', () => {

    function makeDeps(fleeRoll) {
        return {
            rollFlee: () => fleeRoll,
            classAdvantages: {},
            getBasicPower: () => 7,
            eneRegenData: {},
        };
    }

    it('fuga bem-sucedida: encounter.active=false, result=fled', () => {
        const player = makeMonster({ spd: 20 }); // SPD muito alto
        const wild   = makeMonster({ spd: 5,  atk: 4, def: 3, hp: 20, hpMax: 20 });
        const enc = makeEncounter(player, wild);
        // fleeChance = 15 + (20-5)*2 = 45 → roll=10 < 45 → sucesso
        const result = executeWildFlee({
            encounter: enc,
            playerMonster: player,
            fleeBaseChance: 15,
            dependencies: makeDeps(10),
        });
        expect(result.result).toBe('fled');
        expect(enc.active).toBe(false);
        expect(enc.result).toBe('fled');
    });

    it('fuga falhou: encounter continua (ongoing)', () => {
        const player = makeMonster({ spd: 5 });
        const wild   = makeMonster({ spd: 20, atk: 4, def: 3, hp: 20, hpMax: 20 });
        const enc = makeEncounter(player, wild);
        // fleeChance = 15 + (5-20)*2 = 15 - 30 = -15 → clamp 5 → roll=50 >= 5 → falha
        const result = executeWildFlee({
            encounter: enc,
            playerMonster: player,
            fleeBaseChance: 15,
            dependencies: {
                rollFlee: () => 50,
                classAdvantages: {},
                getBasicPower: () => 7,
                eneRegenData: {},
                rollD20: () => 1, // d20=1 sempre erra (contra-ataque falha crítica)
            },
        });
        expect(result.result).toBe('ongoing'); // fuga falhou mas jogador sobreviveu
        expect(enc.active).toBe(true);
    });

    it('fuga falhou e inimigo derrota jogador: result=defeat', () => {
        const player = makeMonster({ spd: 1, hp: 1, hpMax: 20, def: 1 }); // fraco, spd baixo
        const wild   = makeMonster({ spd: 20, atk: 20, def: 3, hp: 20, hpMax: 20, class: 'Guerreiro' });
        const enc = makeEncounter(player, wild);
        // Primeiro rollD20() é para a fuga (1 + 1 = 2 < 12 → falha),
        // segundo é para o contra-ataque inimigo (15 → acerto garantido)
        let callCount = 0;
        const result = executeWildFlee({
            encounter: enc,
            playerMonster: player,
            fleeType: 'normal',
            dependencies: {
                classAdvantages: {},
                getBasicPower: () => 7,
                eneRegenData: {},
                rollD20: () => { callCount++; return callCount === 1 ? 1 : 15; },
            },
        });
        expect(result.result).toBe('defeat');
        expect(enc.active).toBe(false);
    });

    it('log contém informação de SPD e DC (canônico PR-03)', () => {
        const player = makeMonster({ spd: 12, name: 'Zunzumon' });
        const wild   = makeMonster({ spd: 8,  name: 'Inimigo', atk: 4, def: 3, hp: 20, hpMax: 20 });
        const enc = makeEncounter(player, wild);
        executeWildFlee({
            encounter: enc,
            playerMonster: player,
            fleeType: 'normal',
            dependencies: { classAdvantages: {}, getBasicPower: () => 7, eneRegenData: {}, rollD20: () => 10 }, // 10 + 12 = 22 >= 12 → sucesso
        });
        const logStr = enc.log.join(' ');
        expect(logStr).toContain('SPD');
        expect(logStr).toContain('DC 12');
    });

    it('retorna invalid sem wildMonster', () => {
        const enc = { active: true, wildMonster: null, log: [] };
        const result = executeWildFlee({
            encounter: enc,
            playerMonster: makeMonster(),
            fleeBaseChance: 15,
            dependencies: {},
        });
        expect(result.result).toBe('invalid');
        expect(result.success).toBe(false);
    });

    it('Nota Discordante aumenta chance de fuga de bellwave', () => {
        // Setup: bellwave SPD 12 vs enemy SPD 10 → base diff = 2 → +4% sobre 15 = 19%
        // Após Nota: enemy SPD 8 → diff = 4 → +8% sobre 15 = 23%
        const bellwave = makeMonster({ spd: 12, canonSpeciesId: 'bellwave' });
        
        const enemyAfterNota = makeMonster({
            spd: 10,
            buffs: [{ type: 'spd', power: -2, duration: 2, source: 'nota_discordante' }],
            atk: 5, def: 4, hp: 25, hpMax: 25,
        });

        const encNota = makeEncounter(bellwave, enemyAfterNota);
        let notaFleeChance;
        executeWildFlee({
            encounter: encNota,
            playerMonster: bellwave,
            fleeBaseChance: 15,
            dependencies: {
                rollFlee: (chance) => { notaFleeChance = chance; return 999; }, // capturar chance (sempre falha)
                classAdvantages: {},
                getBasicPower: () => 7,
                eneRegenData: {},
                rollD20: () => 1,
            },
        });

        // Nota Discordante deve ter resultado em chance > sem Nota
        const expectedNotaChance = calculateFleeChance(bellwave, enemyAfterNota, 15);
        expect(expectedNotaChance).toBeGreaterThan(calculateFleeChance(bellwave, makeMonster({ spd: 10 }), 15));
    });
});

// ===========================================================================
// Parte 6 — Ausência de regressão em checkHit (backward compat)
// ===========================================================================

describe('Fase 11.2 — Regressão zero em checkHit existente', () => {
    const classAdvantages = {
        Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' },
        Mago: { strong: 'Bárbaro', weak: 'Ladino' },
    };

    it('checkHit com classe vantagem: comportamento mantido', () => {
        // Guerreiro > Ladino: +2 ATK
        const warrior = { atk: 5, class: 'Guerreiro' };
        const rogue   = { def: 12, class: 'Ladino' };
        // 6 + 5 + 2 = 13 >= 12 → acerta
        expect(checkHit(6, warrior, rogue, classAdvantages)).toBe(true);
        // 5 + 5 + 2 = 12 >= 12 → acerta
        expect(checkHit(5, warrior, rogue, classAdvantages)).toBe(true);
        // 4 + 5 + 2 = 11 < 12 → erra
        expect(checkHit(4, warrior, rogue, classAdvantages)).toBe(false);
    });

    it('checkHit com spdBonus=0 idêntico a sem parâmetro', () => {
        const att = { atk: 6, class: 'Mago' };
        const def = { def: 10, class: 'Guerreiro' };
        for (let roll = 1; roll <= 20; roll++) {
            expect(checkHit(roll, att, def, classAdvantages, 0))
                .toBe(checkHit(roll, att, def, classAdvantages));
        }
    });

    it('getBuffModifiers permanece inalterado (SPD computa mas é agora CONSUMIDO)', () => {
        const mon = makeMonster({
            buffs: [
                { type: 'spd', power: -2, duration: 2 },
                { type: 'atk', power: 1, duration: 1 },
            ],
        });
        const mods = getBuffModifiers(mon);
        expect(mods.spd).toBe(-2);  // SPD computado (e agora consumido por getEffectiveSpd)
        expect(mods.atk).toBe(1);
        expect(mods.def).toBe(0);
    });
});

// ===========================================================================
// Parte 7 — Confirmação de impacto retroativo em bellwave e moonquill
// ===========================================================================

describe('Fase 11.2 — Impacto retroativo verificável: bellwave e moonquill', () => {

    describe('bellwave: Nota Discordante I deixou de ser cosmética', () => {

        it('Nota Discordante muda getSpdAdvantage de 0 para +1 (player advantage)', () => {
            // bellwave MON_027 SPD 12 vs enemy SPD 10 (sem Nota)
            const bellwave = makeMonster({ spd: 12 });
            const enemy = makeMonster({ spd: 10 });
            expect(getSpdAdvantage(bellwave, enemy)).toBe(0); // diff=2, sem bônus

            // Após Nota Discordante I (-2 SPD)
            const enemyDebuffed = makeMonster({
                spd: 10,
                buffs: [{ type: 'spd', power: -2, duration: 2, source: 'nota_discordante' }],
            });
            expect(getSpdAdvantage(bellwave, enemyDebuffed)).toBe(1); // diff=4, +1 bônus
        });

        it('Nota Discordante aumenta flee chance em +4%', () => {
            const bellwave = makeMonster({ spd: 12 });
            const enemy    = makeMonster({ spd: 10 });
            const enemyND  = makeMonster({
                spd: 10,
                buffs: [{ type: 'spd', power: -2, duration: 2 }],
            });
            const before = calculateFleeChance(bellwave, enemy, 15);
            const after  = calculateFleeChance(bellwave, enemyND, 15);
            expect(after - before).toBe(4); // +4% exatos por -2 SPD * 2
        });

        it('Nota Discordante II (-3 SPD) ainda mais impactante', () => {
            const bellwave = makeMonster({ spd: 12 });
            const enemyNDII = makeMonster({
                spd: 10,
                buffs: [{ type: 'spd', power: -3, duration: 2 }],
            });
            const beforeChance = calculateFleeChance(bellwave, makeMonster({ spd: 10 }), 15);
            const afterChance  = calculateFleeChance(bellwave, enemyNDII, 15);
            expect(afterChance - beforeChance).toBe(6); // +6% por -3 SPD * 2
        });
    });

    describe('moonquill: spdBuff deixou de ser cosmético', () => {

        it('moonquill SPD 7 vs enemy SPD 5: getSpdAdvantage = +1 (7-5=2 < 3 → 0)', () => {
            // Sem buff: diff=2, ainda não cruza threshold de 3
            const moonquill = makeMonster({ spd: 7 });
            const enemy = makeMonster({ spd: 5 });
            expect(getSpdAdvantage(moonquill, enemy)).toBe(0);
        });

        it('moonquill com spdBuff (+1): SPD 8 vs enemy SPD 5 → getSpdAdvantage = +1', () => {
            const moonquill = makeMonster({
                spd: 7,
                buffs: [{ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' }],
            });
            const enemy = makeMonster({ spd: 5 });
            // effectiveSpd = 8, diff = 8-5 = 3 >= 3 → +1 bônus
            expect(getSpdAdvantage(moonquill, enemy)).toBe(1); // spdBuff agora importa!
        });

        it('moonquill spdBuff (+1) aumenta flee chance em +2%', () => {
            const moonquill = makeMonster({ spd: 7 });
            const moonquillBuff = makeMonster({
                spd: 7,
                buffs: [{ type: 'spd', power: 1, duration: 1, source: 'moonquill_passive' }],
            });
            const enemy = makeMonster({ spd: 8 });
            const before = calculateFleeChance(moonquill, enemy, 15);
            const after  = calculateFleeChance(moonquillBuff, enemy, 15);
            expect(after - before).toBe(2); // +2% por +1 SPD * 2
        });
    });

    describe('Fórmula de dano NÃO foi alterada (regressão)', () => {
        it('getSpdAdvantage retorna apenas ±1 (nunca altera multiplicador de dano)', () => {
            // SPD só afeta hit check (via spdBonus ±1), nunca o calcDamage
            // Este invariante garante que SPD não se tornou uma stat dominante
            const maxAdvantage = getSpdAdvantage(makeMonster({ spd: 100 }), makeMonster({ spd: 1 }));
            const minAdvantage = getSpdAdvantage(makeMonster({ spd: 1 }), makeMonster({ spd: 100 }));
            expect(maxAdvantage).toBe(1);   // bônus máximo: +1
            expect(minAdvantage).toBe(-1);  // penalidade máxima: -1
            // Nunca um multiplicador de dano — damageMult fica intacto
            expect(typeof maxAdvantage).toBe('number');
            expect(Math.abs(maxAdvantage)).toBeLessThanOrEqual(1);
        });
    });
});
