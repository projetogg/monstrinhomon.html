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

    it('deve retornar atkBonus: 1 quando HP > 70% e isOffensiveSkill=true', () => {
        // Fase 4.2: emberfang exige isOffensiveSkill:true (skill DAMAGE)
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.75, isOffensiveSkill: true });
        expect(mod).not.toBeNull();
        expect(mod.atkBonus).toBe(1);
    });

    it('deve retornar atkBonus: 1 com HP = 100% e isOffensiveSkill=true', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 1.0, isOffensiveSkill: true });
        expect(mod?.atkBonus).toBe(1);
    });

    it('deve retornar atkBonus: 1 com HP = 71% e isOffensiveSkill=true (acima de 70%)', () => {
        const instance = makeInstance('emberfang');
        const mod = resolvePassiveModifier(instance, { event: 'on_attack', hpPct: 0.71, isOffensiveSkill: true });
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

    it('deve conter exatamente 6 passivas na Fase 10', () => {
        // Atualizado em Fase 4.1: moonquill e floracura implementadas.
        // Atualizado em Fase 9: swiftclaw (Caçador) implementada.
        // Atualizado em Fase 10: shadowsting (Ladino) implementada.
        // Atualizar junto com cada nova passiva adicionada.
        expect(getActivePassiveIds()).toHaveLength(6);
    });

    it('deve incluir moonquill e floracura implementadas na Fase 4.1', () => {
        const ids = getActivePassiveIds();
        expect(ids).toContain('moonquill');
        expect(ids).toContain('floracura');
    });
});

describe('speciesPassives — hasPassive()', () => {

    it('deve retornar true para shieldhorn', () => {
        expect(hasPassive('shieldhorn')).toBe(true);
    });

    it('deve retornar true para emberfang', () => {
        expect(hasPassive('emberfang')).toBe(true);
    });

    it('deve retornar true para moonquill (implementada na Fase 4.1)', () => {
        expect(hasPassive('moonquill')).toBe(true);
    });

    it('deve retornar true para floracura (implementada na Fase 4.1)', () => {
        expect(hasPassive('floracura')).toBe(true);
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

    it('playerMonster emberfang em ATAQUE BÁSICO: NÃO recebe +1 ATK (Fase 4.2)', () => {
        // Fase 4.2: emberfang só dispara em skill ofensiva, não em ataque básico
        const playerMon = makePlayerMon({ atk: 7, hp: 80, hpMax: 80, canonSpeciesId: 'emberfang' });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const player = makePlayer();
        const deps = makeDependencies({ rollD20: () => 15 });

        // Sem bônus de emberfang em ataque básico: max(1, 7 + 10 - 3) = 14 → HP = 36
        executeWildAttack({ encounter: enc, player, playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        expect(enc.wildMonster.hp).toBe(36); // sem +1 ATK de emberfang em ataque básico
    });

    it('log de combate NÃO deve registrar emberfang em ataque básico (Fase 4.2)', () => {
        // Fase 4.2: emberfang não dispara em ataque básico → sem log de passiva
        const playerMon = makePlayerMon({ atk: 7, hp: 80, hpMax: 80, canonSpeciesId: 'emberfang' });
        const wild = makeWild({ hp: 50, hpMax: 80, def: 3 });
        const enc = makeEncounter(wild);
        const deps = makeDependencies({ rollD20: () => 15 });

        executeWildAttack({ encounter: enc, player: makePlayer(), playerMonster: playerMon, d20Roll: 15, dependencies: deps });

        const hasEmberfangLog = enc.log.some(l => l.includes('✨') && l.includes('ATK'));
        expect(hasEmberfangLog).toBe(false); // emberfang não disparou
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
