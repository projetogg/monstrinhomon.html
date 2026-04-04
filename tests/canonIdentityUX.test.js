/**
 * CANON IDENTITY UX TESTS (Fase 14)
 *
 * Testes para a telemetria de identidades canônicas no runtime.
 * Garante que passivas, kit_swap e promoções são legíveis nos logs de combate.
 *
 * Cobertura:
 *   - _passiveLabel(): mapeamento espécie → rótulo amigável por evento
 *   - Passivas ATK em executeWildAttack: incluem nome da espécie no log
 *   - Passiva shieldhorn: log com "(Escudo Territorial)"
 *   - Passiva floracura: log com "(Cura Eficiente)"
 *   - Passiva moonquill: log com "(Controle Arcano)"
 *   - Passiva emberfang skill: log com "(Fúria Crescente)"
 *   - Shadowsting: mensagem de carga clara e sem jargão técnico
 *   - Bellwave: mensagem de ritmo clara e sem jargão técnico
 *   - kit_swap I: badge 🌟 no log ao usar habilidade
 *   - kit_swap II (promoção): badge ⭐ no log ao usar habilidade
 *   - Retrocompatibilidade: monsters sem canonSpeciesId continuam funcionando
 */

import { describe, it, expect, vi } from 'vitest';
import {
    _passiveLabel,
    executeWildAttack,
    executeWildSkill,
    executeWildItemUse,
} from '../js/combat/wildActions.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeMonster(overrides = {}) {
    return {
        name: 'Monstrinho',
        class: 'Guerreiro',
        hp: 50, hpMax: 50,
        atk: 5, def: 4, spd: 5,
        ene: 10, eneMax: 10,
        buffs: [],
        ...overrides,
    };
}

function makeWild(overrides = {}) {
    return {
        name: 'Selvagem',
        class: 'Ladino',
        hp: 40, hpMax: 40,
        atk: 4, def: 3, spd: 4,
        ene: 6, eneMax: 6,
        buffs: [],
        skill: null,
        aggression: 80,
        ...overrides,
    };
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

function makePlayer() {
    return { name: 'Jogador', class: 'Guerreiro', inventory: {}, money: 0 };
}

const CLASS_ADV = {};
const ENE_REGEN = { Guerreiro: { pct: 0.10, min: 1 }, Ladino: { pct: 0.10, min: 1 }, Mago: { pct: 0.10, min: 1 } };

function makeDeps(overrides = {}) {
    return {
        eneRegenData: ENE_REGEN,
        classAdvantages: CLASS_ADV,
        getBasicPower: () => 7,
        rollD20: () => 15, // sempre acerta (sem crit)
        recordD20Roll: () => {},
        audio: null,
        ui: null,
        handleVictoryRewards: () => {},
        updateFriendship: () => {},
        tutorialOnAction: () => {},
        ...overrides,
    };
}

function makeSkillDeps(useSkillFn, overrides = {}) {
    return {
        ...makeDeps(overrides),
        getMonsterSkills: () => overrides._skills || [],
        useSkill: useSkillFn || vi.fn(() => true),
    };
}

const DEBUFF_SKILL = {
    name: 'Neblina Arcana',
    type: 'BUFF',
    buffType: 'ATK',
    target: 'enemy',
    power: -3,
    duration: 2,
    cost: 5,
    _kitSwapId: 'moonquill_arcane_veil',
};

const PROMOTED_SKILL = {
    name: 'Golpe Pesado II',
    type: 'DAMAGE',
    power: 30,
    cost: 8,
    _kitSwapId: 'shieldhorn_heavy_strike_ii',
};

const KITSWAP_SKILL_I = {
    name: 'Instinto Protetor I',
    type: 'BUFF',
    buffType: 'DEF',
    target: 'self',
    power: 2,
    duration: 1,
    cost: 3,
    _kitSwapId: 'wildpace_rugged_stance',
};

// ── Parte 1: _passiveLabel ─────────────────────────────────────────────────────

describe('_passiveLabel — mapeamento espécie → rótulo amigável (Fase 14)', () => {

    it('shieldhorn / on_hit_received → "Escudo Territorial"', () => {
        expect(_passiveLabel('shieldhorn', 'on_hit_received')).toBe('Escudo Territorial');
    });

    it('emberfang / on_attack → "Fúria Crescente"', () => {
        expect(_passiveLabel('emberfang', 'on_attack')).toBe('Fúria Crescente');
    });

    it('floracura / on_heal_item → "Cura Eficiente"', () => {
        expect(_passiveLabel('floracura', 'on_heal_item')).toBe('Cura Eficiente');
    });

    it('swiftclaw / on_attack → "Primeiro Ataque"', () => {
        expect(_passiveLabel('swiftclaw', 'on_attack')).toBe('Primeiro Ataque');
    });

    it('shadowsting / on_attack → "Golpe Furtivo"', () => {
        expect(_passiveLabel('shadowsting', 'on_attack')).toBe('Golpe Furtivo');
    });

    it('bellwave / on_attack → "Cadência Rítmica"', () => {
        expect(_passiveLabel('bellwave', 'on_attack')).toBe('Cadência Rítmica');
    });

    it('moonquill / on_skill_used → "Controle Arcano"', () => {
        expect(_passiveLabel('moonquill', 'on_skill_used')).toBe('Controle Arcano');
    });

    it('wildpace / on_attack → "Instinto Selvagem"', () => {
        expect(_passiveLabel('wildpace', 'on_attack')).toBe('Instinto Selvagem');
    });

    it('espécie desconhecida → null (fallback seguro)', () => {
        expect(_passiveLabel('inexistente', 'on_attack')).toBeNull();
        expect(_passiveLabel(null, 'on_attack')).toBeNull();
        expect(_passiveLabel(undefined, 'on_attack')).toBeNull();
    });

    it('evento incompatível para espécie → null (não mistura eventos)', () => {
        // shieldhorn só dispara em on_hit_received, não em on_attack
        expect(_passiveLabel('shieldhorn', 'on_attack')).toBeNull();
        // moonquill só dispara em on_skill_used
        expect(_passiveLabel('moonquill', 'on_attack')).toBeNull();
    });

});

// ── Parte 2: Passivas ATK — log com nome da espécie ──────────────────────────

describe('executeWildAttack — log de passiva ATK com identidade canônica (Fase 14)', () => {

    it('wildpace: log de passiva inclui "(Instinto Selvagem)"', () => {
        const pm = makeMonster({
            canonSpeciesId: 'wildpace',
            hp: 10, hpMax: 50, // HP < 40% para wildpace disparar
        });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        executeWildAttack({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            d20Roll: 15,
            dependencies: makeDeps(),
        });
        const hasWildpaceLog = enc.log.some(l => l.includes('Instinto Selvagem') && l.includes('ATK'));
        expect(hasWildpaceLog).toBe(true);
    });

    it('swiftclaw: log de passiva inclui "(Primeiro Ataque)"', () => {
        const pm = makeMonster({
            canonSpeciesId: 'swiftclaw',
        });
        const wild = makeWild();
        const enc = makeEncounter(wild);
        executeWildAttack({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            d20Roll: 15,
            dependencies: makeDeps(),
        });
        const hasSwiftclawLog = enc.log.some(l => l.includes('Primeiro Ataque') && l.includes('ATK'));
        expect(hasSwiftclawLog).toBe(true);
    });

    it('monster sem canonSpeciesId: log genérico funciona sem label', () => {
        const pm = makeMonster({ hp: 10, hpMax: 50 }); // HP < 40% mas sem espécie
        const wild = makeWild();
        const enc = makeEncounter(wild);
        expect(() =>
            executeWildAttack({
                encounter: enc,
                player: makePlayer(),
                playerMonster: pm,
                d20Roll: 15,
                dependencies: makeDeps(),
            })
        ).not.toThrow();
    });

    it('bellwave com charge: log de passiva inclui "(Cadência Rítmica)"', () => {
        const pm = makeMonster({ canonSpeciesId: 'bellwave' });
        const wild = makeWild();
        const enc = makeEncounter(wild, {
            passiveState: { bellwaveRhythmCharged: true },
        });
        executeWildAttack({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            d20Roll: 15,
            dependencies: makeDeps(),
        });
        const hasBellLog = enc.log.some(l => l.includes('Cadência Rítmica') && l.includes('ATK'));
        expect(hasBellLog).toBe(true);
    });

    it('shadowsting com charge: log de passiva inclui "(Golpe Furtivo)"', () => {
        const pm = makeMonster({ canonSpeciesId: 'shadowsting' });
        const wild = makeWild();
        const enc = makeEncounter(wild, {
            passiveState: { shadowstingDebuffCharged: true },
        });
        executeWildAttack({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            d20Roll: 15,
            dependencies: makeDeps(),
        });
        const hasShadowLog = enc.log.some(l => l.includes('Golpe Furtivo') && l.includes('ATK'));
        expect(hasShadowLog).toBe(true);
    });

});

// ── Parte 3: shieldhorn — log com "(Escudo Territorial)" ─────────────────────

describe('executeWildAttack — shieldhorn: log de defesa com identidade (Fase 14)', () => {

    it('shieldhorn wild: log inclui "(Escudo Territorial)" quando bloqueia', () => {
        const pm = makeMonster({ atk: 5 });
        const wild = makeWild({ canonSpeciesId: 'shieldhorn', def: 3 });
        const enc = makeEncounter(wild);
        executeWildAttack({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            d20Roll: 15,
            dependencies: makeDeps(),
        });
        const hasShieldLog = enc.log.some(l => l.includes('🛡️') && l.includes('Escudo Territorial'));
        expect(hasShieldLog).toBe(true);
    });

    it('monster sem canonSpeciesId: log de shieldhorn permanece com "Passiva" (fallback)', () => {
        const pm = makeMonster({ atk: 5 });
        const wild = makeWild({ canonSpeciesId: 'shieldhorn', def: 3 }); // espécie no wild, não no player
        const enc = makeEncounter(wild);
        executeWildAttack({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            d20Roll: 15,
            dependencies: makeDeps(),
        });
        // Deve existir algum log de shieldhorn (🛡️ sempre presente)
        const hasShieldLog = enc.log.some(l => l.includes('🛡️'));
        expect(hasShieldLog).toBe(true);
    });

});

// ── Parte 4: moonquill — log com "(Controle Arcano)" ─────────────────────────

describe('executeWildSkill — moonquill: log SPD com identidade (Fase 14)', () => {

    it('moonquill: log de passiva SPD inclui "(Controle Arcano)"', () => {
        const pm = makeMonster({ canonSpeciesId: 'moonquill', class: 'Mago', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [DEBUFF_SKILL],
            rollD20: () => 20, // crit — não importa, enemy turn não derrota
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasMoonLog = enc.log.some(l => l.includes('Controle Arcano') && l.includes('SPD'));
        expect(hasMoonLog).toBe(true);
    });

});

// ── Parte 5: shadowsting — mensagem de carga legível ─────────────────────────

describe('executeWildSkill — shadowsting: mensagem de carga amigável (Fase 14)', () => {

    it('shadowsting: após debuff, log menciona "Golpe Furtivo" e "próximo"', () => {
        const pm = makeMonster({ canonSpeciesId: 'shadowsting', class: 'Ladino', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const SHADOW_DEBUFF_SKILL = {
            name: 'Marcar',
            type: 'BUFF',
            buffType: 'DEF',
            target: 'enemy',
            power: -2,
            duration: 2,
            cost: 4,
        };

        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [SHADOW_DEBUFF_SKILL],
            rollD20: () => 1, // enemy sempre erra
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasShadowCharge = enc.log.some(l =>
            l.includes('Golpe Furtivo') && (l.includes('carga') || l.includes('próximo'))
        );
        expect(hasShadowCharge).toBe(true);
    });

    it('shadowsting: mensagem de carga não diz "execução ativada" (jargão técnico removido)', () => {
        const pm = makeMonster({ canonSpeciesId: 'shadowsting', class: 'Ladino', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const SHADOW_DEBUFF_SKILL = {
            name: 'Marcar',
            type: 'BUFF',
            buffType: 'DEF',
            target: 'enemy',
            power: -2,
            duration: 2,
            cost: 4,
        };

        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [SHADOW_DEBUFF_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasJargon = enc.log.some(l => l.includes('carga de execução ativada'));
        expect(hasJargon).toBe(false);
    });

});

// ── Parte 6: bellwave — mensagem de ritmo legível ────────────────────────────

describe('executeWildSkill — bellwave: mensagem de ritmo amigável (Fase 14)', () => {

    it('bellwave: log menciona "Cadência Rítmica" e "ritmo"', () => {
        const pm = makeMonster({ canonSpeciesId: 'bellwave', class: 'Bardo', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const ANY_SKILL = {
            name: 'Nota Suave',
            type: 'BUFF',
            buffType: 'ATK',
            target: 'self',
            power: 1,
            duration: 1,
            cost: 3,
        };

        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [ANY_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasBellLog = enc.log.some(l => l.includes('Cadência Rítmica') && l.includes('ritmo'));
        expect(hasBellLog).toBe(true);
    });

    it('bellwave: mensagem não usa jargão "ritmo carregado" sem contexto', () => {
        const pm = makeMonster({ canonSpeciesId: 'bellwave', class: 'Bardo', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const ANY_SKILL = {
            name: 'Nota Suave',
            type: 'BUFF',
            buffType: 'ATK',
            target: 'self',
            power: 1,
            duration: 1,
            cost: 3,
        };

        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [ANY_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        // Nova mensagem NÃO deve ser apenas "Passiva X: ritmo carregado" — deve incluir nome da passiva
        const hasPlainJargon = enc.log.some(l => l === `🎵 Passiva ${pm.name}: ritmo carregado`);
        expect(hasPlainJargon).toBe(false);
    });

});

// ── Parte 7: kit_swap log — badge no log de uso ───────────────────────────────

describe('useSkill (via executeWildSkill) — badge kit_swap no log (Fase 14)', () => {

    it('skill com _kitSwapId (não _ii): log deve incluir "🌟 Habilidade especial"', () => {
        const pm = makeMonster({ canonSpeciesId: 'wildpace', class: 'Animalista', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        // useSkill é a dependência injetada — simulamos o comportamento de index.html
        const useSkillWithBadge = vi.fn((attacker, skill, defender, encounter) => {
            // Simula a lógica de useSkill em index.html (Fase 14)
            encounter.log = encounter.log || [];
            encounter.log.push(`✨ ${attacker.name} usa ${skill.name}! (-${skill.cost} ENE)`);
            if (skill._kitSwapId) {
                const isPromoted = skill._kitSwapId.endsWith('_ii');
                if (isPromoted) {
                    encounter.log.push(`⭐ Habilidade especial da espécie (Promoção II)!`);
                } else {
                    encounter.log.push(`🌟 Habilidade especial da espécie!`);
                }
            }
            return true;
        });

        const deps = makeSkillDeps(useSkillWithBadge, {
            _skills: [KITSWAP_SKILL_I],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasBadge = enc.log.some(l => l.includes('🌟') && l.includes('Habilidade especial'));
        expect(hasBadge).toBe(true);
    });

    it('skill com _kitSwapId _ii (promoção): log deve incluir "⭐" e "Promoção"', () => {
        const pm = makeMonster({ canonSpeciesId: 'shieldhorn', class: 'Guerreiro', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const useSkillWithBadge = vi.fn((attacker, skill, defender, encounter) => {
            encounter.log = encounter.log || [];
            encounter.log.push(`✨ ${attacker.name} usa ${skill.name}! (-${skill.cost} ENE)`);
            if (skill._kitSwapId) {
                const isPromoted = skill._kitSwapId.endsWith('_ii');
                if (isPromoted) {
                    encounter.log.push(`⭐ Habilidade especial da espécie (Promoção II)!`);
                } else {
                    encounter.log.push(`🌟 Habilidade especial da espécie!`);
                }
            }
            return true;
        });

        const deps = makeSkillDeps(useSkillWithBadge, {
            _skills: [PROMOTED_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasPromoBadge = enc.log.some(l => l.includes('⭐') && l.includes('Promoção'));
        expect(hasPromoBadge).toBe(true);
    });

    it('skill sem _kitSwapId: não gera badge de kit_swap', () => {
        const pm = makeMonster({ class: 'Guerreiro', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const REGULAR_SKILL = { name: 'Golpe Básico', type: 'DAMAGE', power: 15, cost: 3 };
        const useSkillNoKitSwap = vi.fn((attacker, skill, defender, encounter) => {
            encounter.log = encounter.log || [];
            encounter.log.push(`✨ ${attacker.name} usa ${skill.name}! (-${skill.cost} ENE)`);
            if (skill._kitSwapId) {
                encounter.log.push(`🌟 Habilidade especial da espécie!`);
            }
            return true;
        });

        const deps = makeSkillDeps(useSkillNoKitSwap, {
            _skills: [REGULAR_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasBadge = enc.log.some(l => l.includes('🌟') || (l.includes('⭐') && l.includes('Promoção')));
        expect(hasBadge).toBe(false);
    });

});

// ── Parte 8: floracura — log com "(Cura Eficiente)" ──────────────────────────

describe('executeWildItemUse — floracura: log de cura com identidade (Fase 14)', () => {

    function makeItemDeps() {
        return {
            ...makeDeps(),
            getItemDef: () => ({ name: 'Petisco', emoji: '🍖', heal_pct: 0.30, heal_min: 5 }),
        };
    }

    it('floracura: log de bônus de cura inclui "(Cura Eficiente)"', () => {
        const pm = makeMonster({ canonSpeciesId: 'floracura', hp: 20, hpMax: 80 });
        const wild = makeWild({ hp: 30 });
        const enc = makeEncounter(wild);
        const player = { ...makePlayer(), inventory: { 'IT_HEAL_01': 3 } };

        executeWildItemUse({
            encounter: enc,
            player,
            playerMonster: pm,
            itemId: 'IT_HEAL_01',
            dependencies: makeItemDeps(),
        });

        const hasCuraLog = enc.log.some(l => l.includes('Cura Eficiente') && l.includes('HP') && l.includes('primeira cura'));
        expect(hasCuraLog).toBe(true);
    });

});

// ── Parte 9: emberfang skill — log com "(Fúria Crescente)" ───────────────────

describe('executeWildSkill — emberfang: log ATK skill com identidade (Fase 14)', () => {

    it('emberfang: skill ofensiva com HP>70% gera log com "(Fúria Crescente)"', () => {
        const pm = makeMonster({
            canonSpeciesId: 'emberfang',
            class: 'Bárbaro',
            hp: 50, hpMax: 50, // HP > 70%
            ene: 10, buffs: [],
        });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);

        const OFFENSIVE_SKILL = { name: 'Explosão Bruta I', type: 'DAMAGE', power: 32, cost: 8, _kitSwapId: 'emberfang_brutal_burst' };
        const deps = makeSkillDeps(vi.fn(() => true), {
            _skills: [OFFENSIVE_SKILL],
            rollD20: () => 1,
        });

        executeWildSkill({
            encounter: enc,
            player: makePlayer(),
            playerMonster: pm,
            skillIndex: 0,
            dependencies: deps,
        });

        const hasFuriaLog = enc.log.some(l => l.includes('Fúria Crescente') && l.includes('ATK') && l.includes('skill ofensiva'));
        expect(hasFuriaLog).toBe(true);
    });

});

// ── Parte 10: retrocompatibilidade ─────────────────────────────────────────────

describe('Retrocompatibilidade — monsters sem canonSpeciesId (Fase 14)', () => {

    it('executeWildAttack não quebra sem canonSpeciesId no player ou wild', () => {
        const pm = makeMonster(); // sem canonSpeciesId
        const wild = makeWild(); // sem canonSpeciesId
        const enc = makeEncounter(wild);
        expect(() =>
            executeWildAttack({
                encounter: enc,
                player: makePlayer(),
                playerMonster: pm,
                d20Roll: 15,
                dependencies: makeDeps(),
            })
        ).not.toThrow();
    });

    it('executeWildSkill não quebra sem canonSpeciesId', () => {
        const pm = makeMonster({ class: 'Guerreiro', ene: 10, buffs: [] });
        const wild = makeWild({ hp: 50 });
        const enc = makeEncounter(wild);
        const SKILL = { name: 'Golpe', type: 'DAMAGE', power: 15, cost: 3 };
        const deps = makeSkillDeps(vi.fn(() => true), { _skills: [SKILL], rollD20: () => 1 });
        expect(() =>
            executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps })
        ).not.toThrow();
    });

    it('_passiveLabel retorna null para null/undefined graciosamente', () => {
        expect(_passiveLabel(null, 'on_attack')).toBeNull();
        expect(_passiveLabel(undefined, 'on_hit_received')).toBeNull();
        expect(_passiveLabel('', 'on_attack')).toBeNull();
    });

});
