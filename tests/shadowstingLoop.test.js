/**
 * SHADOWSTING LOOP TESTS (Fase 13.1)
 *
 * Testa a correção cirúrgica do loop interno do shadowsting (Ladino).
 *
 * PROBLEMA IDENTIFICADO (Fase 13):
 *   - Passiva shadowsting: debuff → carga → ataque básico com +1 ATK.
 *   - Kit swap "Golpe Furtivo I" (DAMAGE) NÃO alimentava nem consumia a carga.
 *   - Desconexão: a "execução canônica" (Golpe Furtivo) não participava do loop.
 *
 * SOLUÇÃO (Fase 13.1):
 *   - Golpe Furtivo I/II detecta carga ativa (shadowstingDebuffCharged) ao executar.
 *   - Aplica +1 ATK via buff temporário (padrão emberfang) antes de useSkill().
 *   - Consome a carga após a execução.
 *   - Ataque básico com carga CONTINUA funcionando (nenhuma regressão).
 *
 * DISTINÇÃO VS BELLWAVE (preservada):
 *   - bellwave: QUALQUER skill carrega o ritmo → básico consome.
 *   - shadowsting: APENAS DEBUFF carrega → Golpe Furtivo OU básico consome.
 *   - Golpe Furtivo (DAMAGE) NÃO carrega a passiva (apenas a consome).
 *
 * Cobertura:
 *   - Loop antigo: Golpe Furtivo SEM carga → sem bônus (comportamento correto)
 *   - Loop corrigido: debuff → Golpe Furtivo → +1 ATK aplicado e carga consumida
 *   - Regressão: debuff → ataque básico → +1 ATK (caminho legado preservado)
 *   - Distinção vs bellwave: Golpe Furtivo NÃO carrega a passiva
 *   - Promoção: Golpe Furtivo II também consome carga
 *   - Instância sem canonSpeciesId: sem efeito (fallback seguro)
 *   - Carga NÃO persiste entre combates (isolamento de encounter)
 */

import { describe, it, expect, vi } from 'vitest';
import { executeWildSkill, executeWildAttack } from '../js/combat/wildActions.js';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';

// ---------------------------------------------------------------------------
// Mock canonLoader (necessário para speciesPassives.js)
// ---------------------------------------------------------------------------
vi.mock('../js/canon/canonLoader.js', () => ({
    getCanonSpeciesData: vi.fn(() => null),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeShadowsting(overrides = {}) {
    return {
        id: 'mi_shadowsting_test',
        name: 'Corvimon',
        class: 'Ladino',
        canonSpeciesId: 'shadowsting',
        hp: 60, hpMax: 60,
        atk: 7, def: 3, poder: 8,
        ene: 15, eneMax: 20,
        buffs: [],
        ...overrides,
    };
}

function makeBellwave(overrides = {}) {
    return {
        id: 'mi_bellwave_test',
        name: 'Zunzumon',
        class: 'Bardo',
        canonSpeciesId: 'bellwave',
        hp: 50, hpMax: 50,
        atk: 6, def: 3, poder: 7,
        ene: 12, eneMax: 18,
        buffs: [],
        ...overrides,
    };
}

function makeWild(overrides = {}) {
    return {
        id: 'wild_test',
        name: 'Inimigomon',
        class: 'Guerreiro',
        hp: 80, hpMax: 80,
        atk: 5, def: 4, poder: 6,
        ene: 0, eneMax: 10,
        buffs: [],
        aggression: 100,
        ...overrides,
    };
}

function makePlayer(overrides = {}) {
    return { id: 'p1', name: 'Jogador', class: 'Ladino', inventory: {}, ...overrides };
}

function makeEncounter(wild, overrides = {}) {
    return {
        id: 'enc_test',
        type: 'wild',
        active: true,
        wildMonster: wild,
        selectedPlayerId: 'p1',
        log: [],
        rewardsGranted: false,
        ...overrides,
    };
}

/** Skill debuff: alimenta a carga de shadowsting */
const DEBUFF_SKILL = {
    id: 'sk_enfraquecer', name: 'Enfraquecer I',
    type: 'BUFF', target: 'enemy', power: -2,
    buffType: 'ATK', duration: 2, cost: 4,
};

/** Golpe Furtivo I — kit swap canônico do shadowsting (DAMAGE) */
const GOLPE_FURTIVO_I = {
    id: 'rogue_ambush',
    _kitSwapId: 'shadowsting_ambush_strike',
    name: 'Golpe Furtivo I',
    type: 'DAMAGE',
    cost: 5,
    power: 22,
    desc: 'Golpe furtivo de execução. Devastador após debuff preparado.',
};

/** Golpe Furtivo II — kit swap promovido (DAMAGE) */
const GOLPE_FURTIVO_II = {
    id: 'rogue_ambush_ii',
    _kitSwapId: 'shadowsting_ambush_strike_ii',
    name: 'Golpe Furtivo II',
    type: 'DAMAGE',
    cost: 6,
    power: 28,
    desc: 'Golpe furtivo aprimorado. Execução devastadora após debuff.',
};

/** Ataque básico do Ladino — sem _kitSwapId */
const ATAQUE_BASICO_LADINO = {
    id: 'rogue_basic', name: 'Ataque Preciso I',
    type: 'DAMAGE', cost: 4, power: 19,
};

/** Nota Discordante I — kit swap do bellwave (DEBUFF SPD) */
const NOTA_DISCORDANTE = {
    id: 'bard_discordant',
    _kitSwapId: 'bellwave_discordant_note',
    name: 'Nota Discordante I',
    type: 'BUFF', target: 'enemy', power: -2,
    buffType: 'SPD', duration: 2, cost: 4,
};

function makeSkillDeps(skills, useSkillFn, overrides = {}) {
    return {
        eneRegenData: {},
        classAdvantages: {},
        getBasicPower: () => 10,
        rollD20: () => 1, // inimigo falha sempre (sem contra-ataque)
        getMonsterSkills: () => skills,
        useSkill: useSkillFn || vi.fn(() => true),
        handleVictoryRewards: vi.fn(),
        tutorialOnAction: vi.fn(),
        markAsParticipated: vi.fn(),
        audio: { playSfx: vi.fn() },
        ui: { flashTarget: vi.fn(), showFloatingText: vi.fn() },
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// PARTE 1 — Loop antigo: Golpe Furtivo SEM carga → sem bônus ATK
// ---------------------------------------------------------------------------

describe('shadowsting — Golpe Furtivo sem carga prévia (sem bônus)', () => {

    it('usar Golpe Furtivo sem debuff prévio não aplica buff de ATK', () => {
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        // enc.passiveState não inicializado → nenhuma carga ativa

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Nenhum buff de execução deve ter sido aplicado ou permanecer
        const execBuff = pm.buffs.find(b => b.source === 'shadowsting_passive');
        expect(execBuff).toBeUndefined();
    });

    it('usar Golpe Furtivo sem carga não emite log de passiva execução', () => {
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const hasExecLog = enc.log.some(l => l.includes('execução furtiva'));
        expect(hasExecLog).toBe(false);
    });

    it('carga não é criada só por usar Golpe Furtivo (DAMAGE não carrega passiva)', () => {
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Golpe Furtivo (DAMAGE) não deve ativar a carga de debuff
        expect(enc.passiveState?.shadowstingDebuffCharged).toBeFalsy();
    });

});

// ---------------------------------------------------------------------------
// PARTE 2 — Loop corrigido: debuff → Golpe Furtivo → +1 ATK + carga consumida
// ---------------------------------------------------------------------------

describe('shadowsting — loop canônico corrigido: debuff → Golpe Furtivo → execução', () => {

    it('após debuff, Golpe Furtivo I aplica buff temporário de +1 ATK antes de useSkill', () => {
        const pm = makeShadowsting({ ene: 12 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        // Simular carga já ativa (como se debuff tivesse sido usado antes)
        enc.passiveState = { shadowstingDebuffCharged: true };

        let atkDuringSkill = null;
        const useSkillFn = vi.fn((attacker, skill, defender) => {
            // Captura o estado dos buffs DURANTE a execução da skill
            atkDuringSkill = (attacker.buffs || []).find(b => b.source === 'shadowsting_passive');
            defender.hp -= 10; // simula dano
            return true;
        });

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], useSkillFn);

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // O buff deve ter estado presente DURANTE useSkill
        expect(atkDuringSkill).toBeDefined();
        expect(atkDuringSkill.type).toBe('atk');
        expect(atkDuringSkill.power).toBe(1);
        expect(atkDuringSkill.duration).toBe(1);
    });

    it('após debuff, Golpe Furtivo I remove o buff temporário após execução', () => {
        const pm = makeShadowsting({ ene: 12 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn((a, sk, d) => { d.hp -= 5; return true; }));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Após execução, o buff temporário não deve persistir
        const execBuff = pm.buffs.find(b => b.source === 'shadowsting_passive');
        expect(execBuff).toBeUndefined();
    });

    it('após debuff, Golpe Furtivo I consome a carga (shadowstingDebuffCharged = false)', () => {
        const pm = makeShadowsting({ ene: 12 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(enc.passiveState.shadowstingDebuffCharged).toBe(false);
    });

    it('após debuff, Golpe Furtivo I emite log de execução furtiva', () => {
        const pm = makeShadowsting({ ene: 12 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const hasExecLog = enc.log.some(l => l.includes('execução furtiva'));
        expect(hasExecLog).toBe(true);
    });

    it('log de execução furtiva menciona o nome do monstrinho', () => {
        const pm = makeShadowsting({ ene: 12, name: 'Corvimon Teste' });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const execLog = enc.log.find(l => l.includes('execução furtiva') && l.includes('Corvimon Teste'));
        expect(execLog).toBeDefined();
    });

    it('loop completo: usar debuff (Enfraquecer) carrega; depois Golpe Furtivo consome', () => {
        const pm = makeShadowsting({ ene: 20 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        // PASSO 1: usar Enfraquecer I (debuff) → carrega shadowstingDebuffCharged
        const depsDebuff = makeSkillDeps([DEBUFF_SKILL], vi.fn(() => true));
        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: depsDebuff });

        expect(enc.passiveState?.shadowstingDebuffCharged).toBe(true); // carga ativa

        // PASSO 2: usar Golpe Furtivo I → consome carga e aplica bônus
        const depsExec = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));
        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: depsExec });

        expect(enc.passiveState.shadowstingDebuffCharged).toBe(false); // carga consumida
        const execLog = enc.log.some(l => l.includes('execução furtiva'));
        expect(execLog).toBe(true); // log de execução emitido
    });

    it('segunda Golpe Furtivo sem nova carga: sem bônus (carga já consumida)', () => {
        const pm = makeShadowsting({ ene: 20 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        // Carga ativa inicialmente
        enc.passiveState = { shadowstingDebuffCharged: true };

        // Primeiro Golpe Furtivo: consome carga
        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));
        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const logAfterFirst = enc.log.filter(l => l.includes('execução furtiva')).length;
        expect(logAfterFirst).toBe(1); // apenas 1 execução

        // Segundo Golpe Furtivo: sem carga → sem bônus
        enc.log = []; // reset log
        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        const hasSecondExec = enc.log.some(l => l.includes('execução furtiva'));
        expect(hasSecondExec).toBe(false); // sem nova execução
    });

});

// ---------------------------------------------------------------------------
// PARTE 3 — Promoção: Golpe Furtivo II também funciona no loop
// ---------------------------------------------------------------------------

describe('shadowsting — Golpe Furtivo II (promovido) também consome carga', () => {

    it('Golpe Furtivo II com carga ativa aplica buff de ATK', () => {
        const pm = makeShadowsting({ ene: 15 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        let atkDuringSkill = null;
        const useSkillFn = vi.fn((attacker) => {
            atkDuringSkill = (attacker.buffs || []).find(b => b.source === 'shadowsting_passive');
            return true;
        });

        const deps = makeSkillDeps([GOLPE_FURTIVO_II], useSkillFn);

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(atkDuringSkill).toBeDefined();
        expect(atkDuringSkill.power).toBe(1);
    });

    it('Golpe Furtivo II consome a carga (shadowstingDebuffCharged = false)', () => {
        const pm = makeShadowsting({ ene: 15 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_II], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(enc.passiveState.shadowstingDebuffCharged).toBe(false);
    });

});

// ---------------------------------------------------------------------------
// PARTE 4 — Regressão: ataque básico com carga ainda funciona (caminho legado)
// ---------------------------------------------------------------------------

describe('shadowsting — regressão: ataque básico com carga (Fase 10, sem mudança)', () => {

    it('passiva shadowsting: on_attack + isOffensiveSkill:false + carga → atkBonus: 1', () => {
        const pm = makeShadowsting();
        const mod = resolvePassiveModifier(pm, {
            event: 'on_attack',
            isOffensiveSkill: false, // ataque básico
            hasShadowstingCharge: true,
        });
        expect(mod).not.toBeNull();
        expect(mod.atkBonus).toBe(1);
    });

    it('passiva shadowsting: on_attack + hasShadowstingCharge:false → null', () => {
        const pm = makeShadowsting();
        const mod = resolvePassiveModifier(pm, {
            event: 'on_attack',
            isOffensiveSkill: false,
            hasShadowstingCharge: false,
        });
        expect(mod).toBeNull();
    });

    it('passiva shadowsting: on_attack + isOffensiveSkill:true → null (skill ofensiva direta)', () => {
        const pm = makeShadowsting();
        const mod = resolvePassiveModifier(pm, {
            event: 'on_attack',
            isOffensiveSkill: true,
            hasShadowstingCharge: true,
        });
        // Via resolvePassiveModifier, skill ofensiva nunca ativa shadowsting
        expect(mod).toBeNull();
    });

    it('ataque básico com carga (via executeWildAttack): carga é consumida no basic attack', () => {
        const pm = makeShadowsting({ atk: 7, def: 3, hp: 60, hpMax: 60 });
        const wild = makeWild({ hp: 50, def: 3 });
        const enc = makeEncounter(wild);
        // Carga ativa → ataque básico deve consumir via caminho existente (Fase 10)
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = {
            classAdvantages: {},
            getBasicPower: () => 10,
            eneRegenData: {},
            rollD20: () => 15, // hit
            audio: { playSfx: vi.fn() },
            ui: { flashTarget: vi.fn(), showFloatingText: vi.fn() },
            tutorialOnAction: vi.fn(),
            handleVictoryRewards: vi.fn(),
            updateFriendship: vi.fn(),
            updateMultipleFriendshipEvents: vi.fn(),
            updateStats: vi.fn(),
            showToast: vi.fn(),
        };

        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: pm, d20Roll: 15, dependencies: deps });

        // Carga deve ter sido consumida pelo ataque básico
        expect(enc.passiveState.shadowstingDebuffCharged).toBe(false);
    });

});

// ---------------------------------------------------------------------------
// PARTE 5 — Distinção vs bellwave: Golpe Furtivo NÃO carrega passiva
// ---------------------------------------------------------------------------

describe('shadowsting vs bellwave — distinção preservada', () => {

    it('shadowsting: Golpe Furtivo (DAMAGE) NÃO carrega shadowstingDebuffCharged', () => {
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        // Sem carga inicial

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Golpe Furtivo (DAMAGE) não deve criar carga — só debuff cria
        expect(enc.passiveState?.shadowstingDebuffCharged).toBeFalsy();
    });

    it('bellwave: Nota Discordante (debuff) CARREGA bellwaveRhythmCharged', () => {
        // Para bellwave, QUALQUER skill carrega, incluindo debuff
        const pm = makeBellwave({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        const deps = makeSkillDeps([NOTA_DISCORDANTE], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // bellwave: debuff carrega ritmo
        expect(enc.passiveState?.bellwaveRhythmCharged).toBe(true);
    });

    it('shadowsting: debuff carrega shadowstingDebuffCharged (correto)', () => {
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        const deps = makeSkillDeps([DEBUFF_SKILL], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(enc.passiveState?.shadowstingDebuffCharged).toBe(true);
        // NÃO deve ter carregado bellwave (espécies diferentes)
        expect(enc.passiveState?.bellwaveRhythmCharged).toBeFalsy();
    });

    it('shadowsting com Golpe Furtivo: NÃO ativa bellwaveRhythmCharged', () => {
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(enc.passiveState?.bellwaveRhythmCharged).toBeFalsy();
    });

    it('bellwave: Nota Discordante não ativa shadowstingDebuffCharged em instância bellwave', () => {
        const pm = makeBellwave({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);

        const deps = makeSkillDeps([NOTA_DISCORDANTE], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(enc.passiveState?.shadowstingDebuffCharged).toBeFalsy();
        expect(enc.passiveState?.bellwaveRhythmCharged).toBe(true);
    });

    it('shadowsting requer debuff específico; bellwave aceita qualquer skill — diferença fundamental', () => {
        // shadowsting: skill DAMAGE (Golpe Furtivo) NÃO carrega
        const pmS = makeShadowsting({ ene: 10 });
        const encS = makeEncounter(makeWild());
        const depsS = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));
        executeWildSkill({ encounter: encS, player: makePlayer(), playerMonster: pmS, skillIndex: 0, dependencies: depsS });
        expect(encS.passiveState?.shadowstingDebuffCharged).toBeFalsy();

        // bellwave: skill DAMAGE (qualquer) SIM carrega
        const pmB = makeBellwave({ ene: 10 });
        const encB = makeEncounter(makeWild());
        const DAMAGE_SKILL = { id: 'sk_dmg', name: 'Golpe', type: 'DAMAGE', cost: 4, power: 15 };
        const depsB = makeSkillDeps([DAMAGE_SKILL], vi.fn(() => true));
        executeWildSkill({ encounter: encB, player: makePlayer(), playerMonster: pmB, skillIndex: 0, dependencies: depsB });
        expect(encB.passiveState?.bellwaveRhythmCharged).toBe(true);
    });

});

// ---------------------------------------------------------------------------
// PARTE 6 — Fallback seguro: sem canonSpeciesId, sem _kitSwapId errado
// ---------------------------------------------------------------------------

describe('shadowsting — fallback e casos de borda', () => {

    it('instância sem canonSpeciesId: Golpe Furtivo não ativa nada', () => {
        const pm = makeShadowsting({ ene: 10, canonSpeciesId: undefined });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Sem canonSpeciesId: nenhum buff canônico
        expect(pm.buffs.find(b => b.source === 'shadowsting_passive')).toBeUndefined();
    });

    it('skill DAMAGE sem _kitSwapId não ativa execução furtiva mesmo com carga', () => {
        // Ataque básico Ladino (sem _kitSwapId) não deve receber bônus via bloco kit swap
        // (mas pode receber via caminho existente de resolvePassiveModifier em basic attack)
        const pm = makeShadowsting({ ene: 10 });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        enc.passiveState = { shadowstingDebuffCharged: true };

        const SKILL_SEM_ID = { id: 'rogue_basic', name: 'Ataque Preciso I', type: 'DAMAGE', cost: 4, power: 19 };
        const deps = makeSkillDeps([SKILL_SEM_ID], vi.fn(() => true));

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // Nenhum buff de 'shadowsting_passive' (padrão kit swap) foi aplicado
        expect(pm.buffs.find(b => b.source === 'shadowsting_passive')).toBeUndefined();
        // A carga NÃO é consumida (skill sem kit swap não é execução canônica)
        expect(enc.passiveState.shadowstingDebuffCharged).toBe(true);
    });

    it('carga de um encounter não vaza para outro encounter', () => {
        const pm = makeShadowsting({ ene: 12 });

        // Encounter 1: carga ativa, usa Golpe Furtivo → consome
        const enc1 = makeEncounter(makeWild());
        enc1.passiveState = { shadowstingDebuffCharged: true };
        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));
        executeWildSkill({ encounter: enc1, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });
        expect(enc1.passiveState.shadowstingDebuffCharged).toBe(false);

        // Encounter 2: novo combate, sem carga
        const enc2 = makeEncounter(makeWild());
        expect(enc2.passiveState?.shadowstingDebuffCharged).toBeFalsy();
    });

    it('Golpe Furtivo não afeta outras espécies com carga ativa no mesmo encounter', () => {
        // Cenário improvável mas importante: encounter tem wildMonster com outro canonSpeciesId
        const pm = makeShadowsting({ ene: 10 });
        // Mas pm é shadowsting — verificar que bellwave vizinho não é afetado
        const pmB = makeBellwave({ ene: 10 });
        const enc = makeEncounter(makeWild());
        enc.passiveState = { shadowstingDebuffCharged: true, bellwaveRhythmCharged: false };

        const deps = makeSkillDeps([GOLPE_FURTIVO_I], vi.fn(() => true));

        // Shadowsting usa Golpe Furtivo
        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // shadowsting consumiu sua carga
        expect(enc.passiveState.shadowstingDebuffCharged).toBe(false);
        // bellwave não foi afetado
        expect(enc.passiveState.bellwaveRhythmCharged).toBe(false);
    });

});
