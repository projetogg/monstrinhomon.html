/**
 * SPECIES PASSIVES TESTS (Fase 4)
 *
 * Testes para js/canon/speciesPassives.js
 * Cobertura:
 *   - resolvePassiveModifier() — principal API pública
 *   - Passiva shieldhorn: damageReduction em on_hit_received
 *   - Passiva emberfang: atkBonus em on_attack quando HP > 70%
 *   - Fallback seguro: instâncias sem canonSpeciesId
 *   - Fallback seguro: species sem passiva implementada
 *   - getActivePassiveIds() — auditoria de cobertura
 *   - hasPassive() — verificação de disponibilidade
 *   - Integração com wildActions: passivas aplicadas corretamente no combate
 */

import { describe, it, expect, vi } from 'vitest';
import {
    resolvePassiveModifier,
    getActivePassiveIds,
    hasPassive,
} from '../js/canon/speciesPassives.js';
import {
    executeWildAttack,
} from '../js/combat/wildActions.js';

// ---------------------------------------------------------------------------
// Helpers de instância para testes de passivas
// ---------------------------------------------------------------------------

function makeInstance(canonSpeciesId, hp = 80, hpMax = 80) {
    return { canonSpeciesId, hp, hpMax, name: 'Test', class: 'Guerreiro' };
}

// ===========================================================================
// resolvePassiveModifier() — fallback seguro
// ===========================================================================

describe('speciesPassives — fallback seguro', () => {

    it('deve retornar null para instância sem canonSpeciesId', () => {
        const instance = { hp: 80, hpMax: 80, name: 'SemEspecie' };
        expect(resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });

    it('deve retornar null para instância null', () => {
        expect(resolvePassiveModifier(null, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });

    it('deve retornar null para instância undefined', () => {
        expect(resolvePassiveModifier(undefined, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });

    it('deve retornar null para species sem passiva implementada (moonquill)', () => {
        const instance = makeInstance('moonquill');
        expect(resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });

    it('deve retornar null para species sem passiva implementada (floracura)', () => {
        const instance = makeInstance('floracura');
        expect(resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });

    it('deve retornar null para species_id desconhecido', () => {
        const instance = makeInstance('inexistente');
        expect(resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });

    it('deve retornar null quando o evento não dispara a passiva', () => {
        // shieldhorn só dispara em on_hit_received
        const instance = makeInstance('shieldhorn');
        expect(resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1 })).toBeNull();
    });
});

// ===========================================================================
// Passiva: shieldhorn — damageReduction
// ===========================================================================

describe('speciesPassives — shieldhorn (damageReduction)', () => {

    it('deve retornar damageReduction: 1 no evento on_hit_received', () => {
        const instance = makeInstance('shieldhorn');
        const mod = resolvePassiveModifier(instance, { event: 'on_hit_received', hpPct: 0.5 });
        expect(mod).not.toBeNull();
        expect(mod.damageReduction).toBe(1);
    });

    it('deve disparar independentemente do HP% no on_hit_received', () => {
        const instance = makeInstance('shieldhorn');
        // HP cheio
        expect(resolvePassiveModifier(instance, { event: 'on_hit_received', hpPct: 1.0 })?.damageReduction).toBe(1);
        // HP crítico
        expect(resolvePassiveModifier(instance, { event: 'on_hit_received', hpPct: 0.1 })?.damageReduction).toBe(1);
        // HP = 0 (derrota iminente)
        expect(resolvePassiveModifier(instance, { event: 'on_hit_received', hpPct: 0 })?.damageReduction).toBe(1);
    });

    it('NÃO deve disparar no evento on_attack', () => {
        const instance = makeInstance('shieldhorn');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.5 });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar em evento desconhecido', () => {
        const instance = makeInstance('shieldhorn');
        const mod = resolvePassiveModifier(instance, { event: 'on_heal', hpPct: 0.5 });
        expect(mod).toBeNull();
    });
});

// ===========================================================================
// Passiva: emberfang — atkBonus condicional em HP > 70%
// ===========================================================================

describe('speciesPassives — emberfang (atkBonus)', () => {

    it('deve retornar atkBonus: 1 quando HP > 70% no on_attack', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.75 });
        expect(mod).not.toBeNull();
        expect(mod.atkBonus).toBe(1);
    });

    it('deve retornar atkBonus: 1 com HP = 100%', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1.0 });
        expect(mod?.atkBonus).toBe(1);
    });

    it('deve retornar atkBonus: 1 com HP = 71% (acima de 70%)', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.71 });
        expect(mod?.atkBonus).toBe(1);
    });

    it('NÃO deve disparar com HP = 70% exato (limite não inclusivo)', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.70 });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar com HP = 50%', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.50 });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar com HP = 0%', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0 });
        expect(mod).toBeNull();
    });

    it('NÃO deve disparar no evento on_hit_received', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_hit_received', hpPct: 1.0 });
        expect(mod).toBeNull();
    });

    it('deve retornar null (não disparar) quando hpPct não é fornecido', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack' });
        expect(mod).toBeNull(); // hpPct ?? 0 → 0, que não é > 70%
    });
});

// ===========================================================================
// Utilitários de auditoria
// ===========================================================================

describe('speciesPassives — getActivePassiveIds()', () => {

    it('deve retornar lista com os IDs de passivas ativas', () => {
        const ids = getActivePassiveIds();
        expect(Array.isArray(ids)).toBe(true);
        expect(ids).toContain('shieldhorn');
        expect(ids).toContain('emberfang');
    });

    it('deve conter exatamente 2 passivas na Fase 4.0', () => {
        expect(getActivePassiveIds()).toHaveLength(2);
    });

    it('NÃO deve incluir passivas diferidas (moonquill, floracura)', () => {
        const ids = getActivePassiveIds();
        expect(ids).not.toContain('moonquill');
        expect(ids).not.toContain('floracura');
    });
});

describe('speciesPassives — hasPassive()', () => {

    it('deve retornar true para shieldhorn', () => {
        expect(hasPassive('shieldhorn')).toBe(true);
    });

    it('deve retornar true para emberfang', () => {
        expect(hasPassive('emberfang')).toBe(true);
    });

    it('deve retornar false para moonquill (passiva diferida)', () => {
        expect(hasPassive('moonquill')).toBe(false);
    });

    it('deve retornar false para floracura (passiva diferida)', () => {
        expect(hasPassive('floracura')).toBe(false);
    });

    it('deve retornar false para species desconhecido', () => {
        expect(hasPassive('inexistente')).toBe(false);
    });

    it('deve retornar false para null', () => {
        expect(hasPassive(null)).toBe(false);
    });
});

// ===========================================================================
// Integração: passiva shieldhorn aplicada no executeWildAttack
// ===========================================================================

// Mock de dependências mínimas para executeWildAttack
function makeDependencies(overrides = {}) {
    return {
        getBasicPower: vi.fn(() => 10),
        classAdvantages: {},
        eneRegenData: { Guerreiro: { pct: 0.10, min: 1 } },
        rollD20: vi.fn(() => 15),
        recordD20Roll: vi.fn(),
        tutorialOnAction: vi.fn(),
        audio: null,
        ui: null,
        handleVictoryRewards: vi.fn(),
        updateFriendship: vi.fn(),
        showToast: vi.fn(),
        ...overrides,
    };
}

function makePlayerMon(overrides = {}) {
    return {
        id: 'pm_1', name: 'Starter', class: 'Guerreiro',
        hp: 80, hpMax: 80, atk: 7, def: 4, poder: 10,
        ene: 10, eneMax: 20, buffs: [], ...overrides,
    };
}

function makeWild(overrides = {}) {
    return {
        id: 'w_1', name: 'Selvagem', class: 'Guerreiro',
        hp: 50, hpMax: 80, atk: 6, def: 3, poder: 8,
        ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null,
        ...overrides,
    };
}

function makeEncounter(wild) {
    return {
        id: 'enc_1', type: 'wild', active: true,
        wildMonster: wild,
        selectedPlayerId: 'p1',
        log: [], rewardsGranted: false,
    };
}

function makePlayer() {
    return { id: 'p1', name: 'Jogador', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
}

describe('speciesPassives — integração executeWildAttack (shieldhorn defensor)', () => {

    it('wildMonster shieldhorn recebe -1 de dano quando playerMonster acerta', () => {
        // Monstrinho player sem passiva; wildMonster com shieldhorn
        const playerMon = makePlayerMon({ atk: 7 });
        const wild = makeWild({ canonSpeciesId: 'shieldhorn', hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDependencies({ rollD20: () => 15 }); // garante acerto

        // Dano esperado sem passiva: max(1, 7 + 10 - 3) = 14
        // Com shieldhorn: max(1, 14 - 1) = 13
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        const hpAfter = enc.wildMonster.hp;
        // HP inicial 50, esperado 50-13 = 37 (com passiva) vs 50-14 = 36 (sem)
        expect(hpAfter).toBe(37); // passiva reduziu 1 ponto de dano
    });

    it('log de combate deve registrar a passiva shieldhorn', () => {
        const playerMon = makePlayerMon({ atk: 7 });
        const wild = makeWild({ canonSpeciesId: 'shieldhorn', hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDependencies({ rollD20: () => 15 });

        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        const hasShieldLog = enc.log.some(l => l.includes('🛡️') && l.includes('Selvagem'));
        expect(hasShieldLog).toBe(true);
    });

    it('wildMonster sem passiva não recebe redução de dano', () => {
        const playerMon = makePlayerMon({ atk: 7 });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 }); // sem canonSpeciesId
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDependencies({ rollD20: () => 15 });

        // Dano esperado: max(1, 7 + 10 - 3) = 14 → HP = 50 - 14 = 36
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(enc.wildMonster.hp).toBe(36);
    });
});

describe('speciesPassives — integração executeWildAttack (emberfang atacante)', () => {

    it('playerMonster emberfang com HP > 70% recebe +1 ATK (dano aumenta)', () => {
        // HP > 70%: 80/80 = 100%
        const playerMon = makePlayerMon({ atk: 7, hp: 80, hpMax: 80, canonSpeciesId: 'emberfang' });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDependencies({ rollD20: () => 15 });

        // Sem passiva: max(1, 7 + 10 - 3) = 14 → HP = 36
        // Com passiva: max(1, 8 + 10 - 3) = 15 → HP = 35
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(enc.wildMonster.hp).toBe(35); // +1 ATK via emberfang
    });

    it('log de combate deve registrar a passiva emberfang', () => {
        const playerMon = makePlayerMon({ atk: 7, hp: 80, hpMax: 80, canonSpeciesId: 'emberfang' });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const deps = makeDependencies({ rollD20: () => 15 });

        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        const hasEmberfangLog = enc.log.some(l => l.includes('✨') && l.includes('ATK'));
        expect(hasEmberfangLog).toBe(true);
    });

    it('playerMonster emberfang com HP = 70% NÃO recebe bônus', () => {
        // HP = 70%: 56/80
        const playerMon = makePlayerMon({ atk: 7, hp: 56, hpMax: 80, canonSpeciesId: 'emberfang' });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const deps = makeDependencies({ rollD20: () => 15 });

        // Sem passiva (70% não > 70%): max(1, 7 + 10 - 3) = 14 → HP = 36
        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(enc.wildMonster.hp).toBe(36);
    });

    it('playerMonster emberfang com HP < 70% NÃO recebe bônus', () => {
        // HP = 50%
        const playerMon = makePlayerMon({ atk: 7, hp: 40, hpMax: 80, canonSpeciesId: 'emberfang' });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const deps = makeDependencies({ rollD20: () => 15 });

        // Sem passiva: max(1, 7 + 10 - 3) = 14 → HP = 36
        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(enc.wildMonster.hp).toBe(36);
    });
});

describe('speciesPassives — sem regressão em combate padrão', () => {

    it('ataque sem nenhuma passiva produz o mesmo dano de antes (regressão)', () => {
        const playerMon = makePlayerMon({ atk: 7, hp: 80, hpMax: 80 }); // sem canonSpeciesId
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 }); // sem canonSpeciesId
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDependencies({ rollD20: () => 15 });

        // Dano esperado: max(1, 7 + 10 - 3) = 14
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(enc.wildMonster.hp).toBe(36); // 50 - 14 = 36 — sem alteração
    });

    it('miss (d20=1) não aplica passiva e não altera HP', () => {
        const playerMon = makePlayerMon({ canonSpeciesId: 'emberfang', hp: 80, hpMax: 80 });
        const wild = makeWild({ canonSpeciesId: 'shieldhorn', hp: 50, hpMax: 80 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        // rollD20=1 para o player, e () => 1 também para inimigo (falha ambos)
        const deps = makeDependencies({ rollD20: () => 1 });

        // d20=1 = falha crítica — player erra; inimigo também rola 1 (miss)
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 1, dependencies: deps });

        // HP do wild não deve mudar (player errou)
        expect(enc.wildMonster.hp).toBe(50);
    });
});
