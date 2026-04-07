/**
 * WILD PLAYER ACTIONS TESTS (Modularização Wild Combat)
 *
 * Testa os pipelines modulares das ações do jogador:
 *   - executeWildSkill
 *   - executeWildCaptureAction
 *   - executeWildItemUse
 *   - executeWildEnemyFullTurn
 *   - resolveD20Hit (wildCore.js)
 *
 * Cobertura:
 * - Pipeline correto: validar → ação → condição terminal → turno inimigo
 * - Regressão de d20=1 (falha crítica) e d20=20 (crítico)
 * - Regressão de dual-track (trilha comportamental)
 * - Regressão de vitória/derrota/rewards
 * - Turno completo do inimigo: ENE regen + buffs + counter
 * - Diferença entre turno completo e reação imediata
 * - Dependency injection (sem globals)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    executeWildSkill,
    executeWildCaptureAction,
    executeWildItemUse,
    executeWildEnemyFullTurn,
    executeWildAttack,
} from '../js/combat/wildActions.js';
import {
    resolveD20Hit,
    CAPTURE_ACTIONS,
} from '../js/combat/wildCore.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeWild(overrides = {}) {
    return {
        id: 'wild_1', name: 'Selvagem', class: 'Guerreiro',
        rarity: 'Comum',
        hp: 80, hpMax: 80,
        atk: 6, def: 3, poder: 8,
        ene: 5, eneMax: 20,
        aggression: 60,
        buffs: [],
        skill: null,
        ...overrides,
    };
}

function makePlayerMon(overrides = {}) {
    return {
        id: 'pm_1', name: 'Starter', class: 'Guerreiro',
        rarity: 'Comum',
        hp: 80, hpMax: 80,
        atk: 7, def: 4, poder: 10,
        ene: 10, eneMax: 20,
        buffs: [],
        ...overrides,
    };
}

function makePlayer(overrides = {}) {
    return {
        id: 'p1', name: 'Jogador', class: 'Guerreiro',
        inventory: { IT_HEAL_01: 3 },
        team: [],
        ...overrides,
    };
}

function makeEncounter(wild) {
    return {
        id: 'enc_1', type: 'wild',
        active: true,
        wildMonster: wild,
        selectedPlayerId: 'p1',
        log: [],
        rewardsGranted: false,
    };
}

const NO_REGEN = {};  // vazio → applyEneRegen não regen (regenData ausente)

function makeBaseDeps(overrides = {}) {
    return {
        eneRegenData: NO_REGEN,
        classAdvantages: {},
        getBasicPower: () => 10,
        rollD20: () => 15,
        audio: { playSfx: vi.fn() },
        ...overrides,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1: resolveD20Hit (wildCore.js)
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveD20Hit', () => {
    const attacker = { atk: 5, class: 'Guerreiro' };
    const defender = { def: 10, class: 'Ladino' };

    it('d20=1 → isFail=true, hit=false (falha crítica)', () => {
        const r = resolveD20Hit(1, attacker, defender, {});
        expect(r.isFail).toBe(true);
        expect(r.hit).toBe(false);
        expect(r.isCrit).toBe(false);
    });

    it('d20=20 → isCrit=true, hit=true (crítico garantido)', () => {
        const r = resolveD20Hit(20, attacker, defender, {});
        expect(r.isCrit).toBe(true);
        expect(r.hit).toBe(true);
        expect(r.isFail).toBe(false);
    });

    it('d20=15 → resolve normalmente via checkHit', () => {
        // roll=15, atk=5 → total=20 >= def=10 → hit
        const r = resolveD20Hit(15, { atk: 5, class: 'Guerreiro' }, { def: 10, class: 'Ladino' }, {});
        expect(r.isFail).toBe(false);
        expect(r.isCrit).toBe(false);
        expect(r.hit).toBe(true);
    });

    it('d20=5, atk=1 → pode errar com defesa alta', () => {
        // roll=5, atk=1 → total=6 < def=20 → miss
        const r = resolveD20Hit(5, { atk: 1, class: 'Guerreiro' }, { def: 20, class: 'Ladino' }, {});
        expect(r.hit).toBe(false);
        expect(r.isCrit).toBe(false);
        expect(r.isFail).toBe(false);
    });

    it('classAdvantages afetam o resultado (vantagem → mais fácil acertar)', () => {
        // Com vantagem: atk+2 → total aumenta
        const adv = { Guerreiro: { strong: 'Ladino', weak: 'Curandeiro' } };
        const borderRoll = 5; // sem vantagem: 5+1=6 < def=8 → miss; com vantagem: 5+1+2=8 >= 8 → hit
        const hitWithAdv = resolveD20Hit(borderRoll, { atk: 1, class: 'Guerreiro' }, { def: 8, class: 'Ladino' }, adv);
        const hitNoAdv   = resolveD20Hit(borderRoll, { atk: 1, class: 'Guerreiro' }, { def: 8, class: 'Ladino' }, {});
        expect(hitWithAdv.hit).toBe(true);
        expect(hitNoAdv.hit).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: executeWildEnemyFullTurn
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildEnemyFullTurn', () => {

    it('retorna { defeated: false } se inimigo erra (d20=1)', () => {
        const wild = makeWild();
        const pm   = makePlayerMon();
        const enc  = makeEncounter(wild);
        const deps = makeBaseDeps({ rollD20: () => 1 });

        const r = executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        expect(r.defeated).toBe(false);
        expect(pm.hp).toBe(80); // sem dano
    });

    it('retorna { defeated: true } se causa dano suficiente para matar (d20=20 + power alto)', () => {
        const wild = makeWild({ atk: 999, def: 1 });
        const pm   = makePlayerMon({ hp: 1, def: 1 });
        const enc  = makeEncounter(wild);
        const deps = makeBaseDeps({ rollD20: () => 20, getBasicPower: () => 1000 });

        const r = executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        expect(r.defeated).toBe(true);
        expect(pm.hp).toBe(0);
    });

    it('ENE regen do inimigo é aplicado antes do ataque (diferente de reação imediata)', () => {
        const wild = makeWild({ ene: 0, eneMax: 20, class: 'Guerreiro' });
        const enc  = makeEncounter(wild);
        const deps = makeBaseDeps({
            eneRegenData: { Guerreiro: { pct: 0.5, min: 5 } }, // regen 50% → +10 ENE
            rollD20: () => 1,  // inimigo erra (para não matar player)
        });

        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: makePlayerMon(), dependencies: deps });

        // ENE deve ter aumentado (regen foi aplicado)
        expect(wild.ene).toBeGreaterThan(0);
    });

    it('log registra o d20 roll do inimigo', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const deps = makeBaseDeps({ rollD20: () => 10 });

        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: makePlayerMon(), dependencies: deps });

        expect(enc.log.join(' ')).toMatch(/10/); // roll=10 deve aparecer no log
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: executeWildSkill
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildSkill', () => {

    const baseSkill = { id: 'sk_1', name: 'Golpe', cost: 5, power: 15 };

    function makeSkillDeps(overrides = {}) {
        return {
            ...makeBaseDeps(overrides),
            getMonsterSkills: (m) => [baseSkill],
            useSkill: vi.fn((attacker, skill, target, enc) => {
                // Simula uso de habilidade: reduz HP do target
                target.hp = Math.max(0, target.hp - 15);
                return true;
            }),
            handleVictoryRewards: vi.fn(),
            tutorialOnAction: vi.fn(),
            markAsParticipated: vi.fn(),
        };
    }

    it('retorna ongoing após skill com sucesso sem vitória nem derrota', () => {
        const wild = makeWild({ hp: 50 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 10 });
        const deps = makeSkillDeps({ rollD20: () => 1 }); // inimigo falha

        const r = executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });
        expect(r.result).toBe('ongoing');
        expect(r.success).toBe(true);
    });

    it('retorna victory quando selvagem morre com a skill', () => {
        const wild = makeWild({ hp: 1 }); // morrerá com o ataque
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 10 });
        const deps = makeSkillDeps();

        const r = executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });
        expect(r.result).toBe('victory');
        expect(enc.active).toBe(false);
    });

    it('retorna defeat quando inimigo contra-ataca e mata', () => {
        const wild = makeWild({ hp: 50, atk: 999 }); // vai sobreviver ao skill mas matar jogador
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 1, ene: 10, def: 1 });
        // useSkill não mata o selvagem (hp=50-15=35), mas inimigo contra-ataca com d20=20 + poder alto
        const deps = makeSkillDeps({ rollD20: () => 20, getBasicPower: () => 1000 });

        const r = executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });
        expect(r.result).toBe('defeat');
        expect(pm.status).toBe('fainted');
        expect(enc.active).toBe(false);
    });

    it('retorna invalid se ENE insuficiente', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 0 }); // ENE = 0, skill.cost = 5
        const deps = makeSkillDeps();

        const r = executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });
        expect(r.result).toBe('invalid');
        expect(r.success).toBe(false);
    });

    it('retorna invalid se skillIndex fora dos limites', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 20 });
        const deps = makeSkillDeps();

        const r = executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 99, dependencies: deps });
        expect(r.result).toBe('invalid');
    });

    it('chama tutorialOnAction("skill") após skill bem-sucedida', () => {
        const wild = makeWild({ hp: 50 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 10 });
        const deps = makeSkillDeps({ rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(deps.tutorialOnAction).toHaveBeenCalledWith('skill');
    });

    it('chama markAsParticipated após skill bem-sucedida', () => {
        const wild = makeWild({ hp: 50 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 10 });
        const deps = makeSkillDeps({ rollD20: () => 1 });

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(deps.markAsParticipated).toHaveBeenCalledWith(pm);
    });

    it('chama handleVictoryRewards quando selvagem é derrotado', () => {
        const wild = makeWild({ hp: 1 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ ene: 10 });
        const deps = makeSkillDeps();

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(deps.handleVictoryRewards).toHaveBeenCalledWith(enc);
    });

    it('retorna invalid se encounter.wildMonster for undefined', () => {
        const enc  = { log: [], active: true };
        const deps = makeSkillDeps();

        const r = executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: makePlayerMon({ ene: 10 }), skillIndex: 0, dependencies: deps });
        expect(r.result).toBe('invalid');
        expect(r.success).toBe(false);
    });

    it('não contra-ataca se inimigo foi derrotado pela skill (vitória imediata)', () => {
        const wild = makeWild({ hp: 1 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 80, ene: 10 });
        const deps = makeSkillDeps({ rollD20: () => 20, getBasicPower: () => 1000 });

        // Crit d20=20 + power=1000 deveria matar jogador se houvesse contra-ataque
        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        // HP do jogador não deve ter caído (sem contra-ataque)
        expect(pm.hp).toBe(80);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: executeWildCaptureAction
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildCaptureAction', () => {

    function makeCaptureActionDeps(overrides = {}) {
        return {
            ...makeBaseDeps(overrides),
            captureActions: CAPTURE_ACTIONS,  // tabela real de ações
            aggrTerminal: 10,                 // resolução quando aggression <= 10
            handleVictoryRewards: vi.fn(),
            tutorialOnAction: vi.fn(),
        };
    }

    it('reduz agressividade e retorna ongoing se não terminou', () => {
        const wild = makeWild({ aggression: 80 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon();
        const deps = makeCaptureActionDeps({
            rollD20: () => 1, // inimigo falha
        });

        const r = executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: pm, dependencies: deps });
        expect(r.success).toBe(true);
        expect(r.result).toBe('ongoing');
        expect(wild.aggression).toBeLessThan(80); // reduziu
    });

    it('retorna behavioral_resolve quando aggression <= aggrTerminal', () => {
        const wild = makeWild({ aggression: 5 }); // já baixo, ação vai resolver
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon();
        const deps = makeCaptureActionDeps({ aggrTerminal: 20 });

        const r = executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: pm, dependencies: deps });
        expect(r.result).toBe('behavioral_resolve');
        expect(r.behaviorallyResolved).toBe(true);
        expect(enc.behaviorallyResolved).toBe(true);
        expect(wild.aggression).toBe(0);
    });

    it('encounter.active permanece true após behavioral_resolve (esperando ClasterOrb)', () => {
        const wild = makeWild({ aggression: 5 });
        const enc  = makeEncounter(wild);
        const deps = makeCaptureActionDeps({ aggrTerminal: 20 });

        executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: makePlayerMon(), dependencies: deps });

        expect(enc.active).toBe(true);
    });

    it('chama handleVictoryRewards e tutorialOnAction("capture") na resolução comportamental', () => {
        const wild = makeWild({ aggression: 5 });
        const enc  = makeEncounter(wild);
        const deps = makeCaptureActionDeps({ aggrTerminal: 20 });

        executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: makePlayerMon(), dependencies: deps });

        expect(deps.handleVictoryRewards).toHaveBeenCalledWith(enc);
        expect(deps.tutorialOnAction).toHaveBeenCalledWith('capture');
    });

    it('não contra-ataca após resolução comportamental (selvagem está calmo)', () => {
        const wild = makeWild({ aggression: 5, atk: 999 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 80 });
        const deps = makeCaptureActionDeps({ aggrTerminal: 20, rollD20: () => 20 });

        executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: pm, dependencies: deps });

        // Sem contra-ataque: HP intacto
        expect(pm.hp).toBe(80);
    });

    it('inimigo contra-ataca com turno completo após ação comportamental sem resolução', () => {
        const wild = makeWild({ aggression: 80, atk: 999, def: 1 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 80, def: 1 });
        const deps = makeCaptureActionDeps({ rollD20: () => 15, getBasicPower: () => 50 });

        executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: pm, dependencies: deps });

        // Dano aplicado pelo contra-ataque
        expect(pm.hp).toBeLessThan(80);
    });

    it('retorna defeat quando inimigo mata jogador no contra-ataque', () => {
        const wild = makeWild({ aggression: 80, atk: 999, def: 1 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 1, def: 1 });
        const deps = makeCaptureActionDeps({ rollD20: () => 20, getBasicPower: () => 1000 });

        const r = executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: pm, dependencies: deps });
        expect(r.result).toBe('defeat');
        expect(pm.status).toBe('fainted');
        expect(enc.active).toBe(false);
    });

    it('retorna invalid se classe do jogador não tem ação de captura', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const deps = makeCaptureActionDeps({ captureActions: {} });

        const r = executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'ClasseNova' }), playerMonster: makePlayerMon(), dependencies: deps });
        expect(r.result).toBe('invalid');
        expect(r.success).toBe(false);
    });

    it('log registra ação usada e variação de agressividade', () => {
        const wild = makeWild({ aggression: 80 });
        const enc  = makeEncounter(wild);
        const deps = makeCaptureActionDeps({ rollD20: () => 1 });

        executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: 'Curandeiro' }), playerMonster: makePlayerMon(), dependencies: deps });

        const logText = enc.log.join(' ');
        expect(logText).toContain('Agressividade');
        expect(logText).toContain('80 →');
    });

    it('cada classe do CAPTURE_ACTIONS reduz agressividade ao aplicar sua ação', () => {
        const classes = Object.keys(CAPTURE_ACTIONS);
        expect(classes.length).toBeGreaterThan(0);

        for (const cls of classes) {
            const wild = makeWild({ aggression: 80 });
            const enc  = makeEncounter(wild);
            const deps = makeCaptureActionDeps({ rollD20: () => 1 });
            executeWildCaptureAction({ encounter: enc, player: makePlayer({ class: cls }), playerMonster: makePlayerMon(), dependencies: deps });
            expect(wild.aggression).toBeLessThan(80);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5: executeWildItemUse
// ─────────────────────────────────────────────────────────────────────────────

describe('executeWildItemUse', () => {

    const ITEM_ID = 'IT_HEAL_01';
    const itemDef = { name: 'Petisco de Cura', emoji: '🍖', heal_pct: 0.30, heal_min: 5 };

    function makeItemDeps(overrides = {}) {
        return {
            ...makeBaseDeps(overrides),
            getItemDef: vi.fn(() => itemDef),
            updateFriendship: vi.fn(),
            tutorialOnAction: vi.fn(),
            onHealVisualFeedback: vi.fn(),
        };
    }

    it('cura o monstrinho do jogador e retorna ongoing', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40, hpMax: 80 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 2 } });
        const deps = makeItemDeps({ rollD20: () => 1 }); // inimigo falha

        const r = executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });
        expect(r.success).toBe(true);
        expect(r.result).toBe('ongoing');
        expect(pm.hp).toBeGreaterThan(40); // curou
        expect(r.actualHeal).toBeGreaterThan(0);
    });

    it('consome 1 item do inventário', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40, hpMax: 80 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 3 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        expect(player.inventory.IT_HEAL_01).toBe(2);
    });

    it('não cura além do HP máximo', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 79, hpMax: 80 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        expect(pm.hp).toBe(80); // não pode passar do máximo
    });

    it('chama tutorialOnAction("item")', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        expect(deps.tutorialOnAction).toHaveBeenCalledWith('item');
    });

    it('chama updateFriendship("useHealItem")', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        expect(deps.updateFriendship).toHaveBeenCalledWith(pm, 'useHealItem');
    });

    it('toca som "heal"', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        expect(deps.audio.playSfx).toHaveBeenCalledWith('heal');
    });

    it('chama onHealVisualFeedback com actualHeal', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40, hpMax: 80 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        expect(deps.onHealVisualFeedback).toHaveBeenCalled();
        const [calledHeal] = deps.onHealVisualFeedback.mock.calls[0];
        expect(calledHeal).toBeGreaterThan(0);
    });

    it('inimigo contra-ataca com turno completo após uso de item', () => {
        const wild = makeWild({ atk: 999, def: 1 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 80, def: 1 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 15, getBasicPower: () => 50 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        // Primeiro cura, depois sofre dano
        expect(pm.hp).toBeLessThanOrEqual(pm.hpMax);
    });

    it('retorna defeat quando inimigo mata o jogador após uso de item', () => {
        const wild = makeWild({ atk: 999, def: 1 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 1, def: 1 }); // quase morto
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 20, getBasicPower: () => 1000 });

        const r = executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });
        // Mesmo curando um pouco, o crit+poder altíssimo mata
        expect(r.result).toBe('defeat');
        expect(pm.status).toBe('fainted');
        expect(enc.active).toBe(false);
    });

    it('log registra cura com HP antes/depois', () => {
        const wild = makeWild();
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40, hpMax: 80 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 1 });

        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        const logText = enc.log.join(' ');
        expect(logText).toContain('recuperou');
        expect(logText).toContain('HP');
    });

    it('não contra-ataca se selvagem.hp = 0 (já derrotado antes do item)', () => {
        const wild = makeWild({ hp: 0 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 40 });
        const player = makePlayer({ inventory: { IT_HEAL_01: 1 } });
        const deps = makeItemDeps({ rollD20: () => 20 }); // crit se chamado

        const hpBefore = pm.hp;
        executeWildItemUse({ encounter: enc, player, playerMonster: pm, itemId: ITEM_ID, dependencies: deps });

        // HP aumentou pela cura mas não caiu por contra-ataque
        expect(pm.hp).toBeGreaterThan(hpBefore);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6: Distinção arquitetural: turno completo vs reação imediata
// ─────────────────────────────────────────────────────────────────────────────

describe('Arquitetura: turno completo vs reação imediata', () => {

    it('executeWildEnemyFullTurn aplica ENE regen; reação imediata não (executeWildCapture)', async () => {
        // O executeWildCapture (falha de captura) usa processEnemyCounterattack
        // sem ENE regen. O turno completo usa executeWildEnemyFullTurn que aplica regen.
        // Testamos que o turno completo altera ENE e a reação imediata não.

        const { executeWildCapture } = await import('../js/combat/wildActions.js');

        // Turno completo: ENE deve aumentar
        const wild1 = makeWild({ ene: 0, eneMax: 20, hp: 100, aggression: 100 });
        const enc1  = makeEncounter(wild1);
        const deps1 = makeBaseDeps({
            eneRegenData: { Guerreiro: { pct: 0.5, min: 5 } },
            rollD20: () => 1,
        });
        executeWildEnemyFullTurn({ encounter: enc1, wildMonster: wild1, playerMonster: makePlayerMon(), dependencies: deps1 });
        const eneAfterFullTurn = wild1.ene;

        // Reação imediata (executeWildCapture falha): ENE deve permanecer 0
        const wild2 = makeWild({ ene: 0, eneMax: 20, hp: 100, aggression: 100 });
        const enc2  = makeEncounter(wild2);
        const orbInfo = { id: 'ORB_1', name: 'Orb', emoji: '⚪', capture_bonus_pp: 0 };
        const player  = makePlayer({ inventory: { ORB_1: 1 } });
        const deps2 = {
            ...makeBaseDeps({ eneRegenData: { Guerreiro: { pct: 0.5, min: 5 } }, rollD20: () => 1 }),
            captureThreshold: 999, // garante falha → reação imediata
            onCaptureSuccess: vi.fn(),
            updateStats: vi.fn(),
            tutorialOnAction: vi.fn(),
        };
        executeWildCapture({ encounter: enc2, player, playerMonster: makePlayerMon(), orbInfo, dependencies: deps2 });
        const eneAfterQuickReaction = wild2.ene;

        // Turno completo regenou; reação imediata não
        expect(eneAfterFullTurn).toBeGreaterThan(0);
        expect(eneAfterQuickReaction).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 7: Regressão de d20 crítico e falha
// ─────────────────────────────────────────────────────────────────────────────

describe('Regressão d20 crítico e falha no turno completo', () => {

    it('d20=1 no turno completo do inimigo: sem dano ao jogador (falha crítica)', () => {
        const wild = makeWild({ atk: 999 });
        const pm   = makePlayerMon({ hp: 80 });
        const enc  = makeEncounter(wild);
        const deps = makeBaseDeps({ rollD20: () => 1 });

        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        expect(pm.hp).toBe(80);
    });

    it('d20=20 no turno completo: sempre acerta (crítico)', () => {
        const wild = makeWild({ atk: 1, def: 100 }); // sem vantagem de atk
        const pm   = makePlayerMon({ hp: 80, def: 100 }); // DEF altíssima
        const enc  = makeEncounter(wild);
        const deps = makeBaseDeps({ rollD20: () => 20 });

        executeWildEnemyFullTurn({ encounter: enc, wildMonster: wild, playerMonster: pm, dependencies: deps });
        // d20=20 garante acerto, dano mínimo = 1
        expect(pm.hp).toBeLessThan(80);
    });

    it('d20=1 em executeWildSkill: inimigo falha, jogador não perde HP no counter', () => {
        const wild = makeWild({ hp: 50 });
        const enc  = makeEncounter(wild);
        const pm   = makePlayerMon({ hp: 80, ene: 10 });

        const deps = {
            ...makeBaseDeps({ rollD20: () => 1 }),
            getMonsterSkills: () => [{ id: 'sk1', name: 'Golpe', cost: 5, power: 15 }],
            useSkill: vi.fn((a, s, t, e) => { t.hp = Math.max(0, t.hp - 10); return true; }),
            handleVictoryRewards: vi.fn(),
            tutorialOnAction: vi.fn(),
            markAsParticipated: vi.fn(),
        };

        executeWildSkill({ encounter: enc, player: makePlayer(), playerMonster: pm, skillIndex: 0, dependencies: deps });

        expect(pm.hp).toBe(80); // inimigo falhou (d20=1), sem dano
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 8: F1 — CLASS_COMBAT_PASSIVES no wild combat (Fase F)
// ─────────────────────────────────────────────────────────────────────────────

describe('F1 — CLASS_COMBAT_PASSIVES no wild combat', () => {

    function makeBasicDeps(overrides = {}) {
        return {
            getBasicPower: vi.fn(() => 10),
            classAdvantages: {},
            eneRegenData: { Bardo: { pct: 0.12, min: 2 } },
            rollD20: vi.fn(() => 15),
            recordD20Roll: vi.fn(),
            tutorialOnAction: vi.fn(),
            audio: null,
            ui: { showDamageFeedback: vi.fn(), showMissFeedback: vi.fn(), showVictoryUI: vi.fn() },
            handleVictoryRewards: vi.fn(),
            updateFriendship: vi.fn(),
            showToast: vi.fn(),
            markAsParticipated: vi.fn(),
            ...overrides,
        };
    }

    it('Ladino (+10% dano): causa mais dano que classe neutra', () => {
        // Ladino tem attackBonus: 0.10 → +10% dano
        const wildNeutral = { id: 'w1', name: 'W', class: 'Bardo', hp: 100, hpMax: 100, atk: 4, def: 3, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
        const wildNeutral2 = { ...wildNeutral, hp: 100 };
        const encNeutral = { id: 'enc1', type: 'wild', active: true, wildMonster: wildNeutral, selectedPlayerId: 'p1', log: [], rewardsGranted: false };
        const encLadino = { id: 'enc2', type: 'wild', active: true, wildMonster: wildNeutral2, selectedPlayerId: 'p1', log: [], rewardsGranted: false };

        const pmNeutral = { id: 'pm1', name: 'PM', class: 'Bardo', hp: 80, hpMax: 80, atk: 7, def: 4, ene: 10, eneMax: 20, buffs: [] };
        const pmLadino = { ...pmNeutral, id: 'pm2', class: 'Ladino' };
        const player = { id: 'p1', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };

        const deps = makeBasicDeps();
        executeWildAttack({ encounter: encNeutral, player, playerMonster: pmNeutral, d20Roll: 15, dependencies: deps });
        executeWildAttack({ encounter: encLadino, player, playerMonster: pmLadino, d20Roll: 15, dependencies: deps });

        const dmgNeutral = 100 - wildNeutral.hp;
        const dmgLadino  = 100 - wildNeutral2.hp;

        expect(dmgLadino).toBeGreaterThan(dmgNeutral); // Ladino causa mais dano
    });

    it('Guerreiro (-15% dano recebido): toma menos dano que classe neutra', () => {
        // Guerreiro tem defenseBonus: 0.15 → -15% dano recebido como wild monster
        const wildGuerreiro = { id: 'w1', name: 'W', class: 'Guerreiro', hp: 100, hpMax: 100, atk: 4, def: 3, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
        const wildBardo     = { ...wildGuerreiro, id: 'w2', hp: 100, class: 'Bardo' };
        const encG = { id: 'enc1', type: 'wild', active: true, wildMonster: wildGuerreiro, selectedPlayerId: 'p1', log: [], rewardsGranted: false };
        const encB = { id: 'enc2', type: 'wild', active: true, wildMonster: wildBardo,     selectedPlayerId: 'p1', log: [], rewardsGranted: false };

        const pm     = { id: 'pm1', name: 'PM', class: 'Bardo', hp: 80, hpMax: 80, atk: 7, def: 4, ene: 10, eneMax: 20, buffs: [] };
        const player = { id: 'p1', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const deps   = makeBasicDeps();

        executeWildAttack({ encounter: encG, player, playerMonster: pm, d20Roll: 15, dependencies: { ...deps } });
        executeWildAttack({ encounter: encB, player, playerMonster: { ...pm }, d20Roll: 15, dependencies: deps });

        const dmgGuerreiro = 100 - wildGuerreiro.hp;
        const dmgBardo     = 100 - wildBardo.hp;

        expect(dmgGuerreiro).toBeLessThan(dmgBardo); // Guerreiro toma menos dano
    });

    it('F2 — Ladino: aplica -1 DEF ao wild no primeiro ataque básico', () => {
        const wild = { id: 'w1', name: 'W', class: 'Bardo', hp: 100, hpMax: 100, atk: 4, def: 5, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
        const enc  = { id: 'enc1', type: 'wild', active: true, wildMonster: wild, selectedPlayerId: 'p1', log: [], rewardsGranted: false };
        const pm   = { id: 'pm1', name: 'PM', class: 'Ladino', hp: 80, hpMax: 80, atk: 7, def: 4, ene: 10, eneMax: 20, buffs: [] };
        const player = { id: 'p1', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const deps = makeBasicDeps();

        const defBefore = wild.def;
        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: deps });

        expect(wild.def).toBe(defBefore - 1); // DEF do wild reduziu em 1
        expect(enc.log.some(l => l.includes('Golpe Furtivo'))).toBe(true);
    });

    it('F2 — Ladino: debuff de DEF só ocorre no primeiro ataque (não repete)', () => {
        const wild = { id: 'w1', name: 'W', class: 'Bardo', hp: 200, hpMax: 200, atk: 4, def: 5, poder: 8, ene: 5, eneMax: 20, aggression: 60, buffs: [], skill: null };
        const enc  = { id: 'enc1', type: 'wild', active: true, wildMonster: wild, selectedPlayerId: 'p1', log: [], rewardsGranted: false };
        const pm   = { id: 'pm1', name: 'PM', class: 'Ladino', hp: 80, hpMax: 80, atk: 7, def: 4, ene: 10, eneMax: 20, buffs: [] };
        const player = { id: 'p1', name: 'J', class: 'Guerreiro', inventory: {}, team: [], money: 0 };
        const deps = makeBasicDeps({ rollD20: () => 15 });

        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: deps });
        const defAfterFirst = wild.def;
        executeWildAttack({ encounter: enc, player, playerMonster: pm, d20Roll: 15, dependencies: deps });

        expect(wild.def).toBe(defAfterFirst); // DEF não diminuiu mais
    });
});
