/**
 * COMBAT EVENTS TESTS (PR-02)
 *
 * Testes para o módulo de contratos internos de combate.
 * Cobertura: fireCombatEvent, constantes de eventos, integração com speciesPassives.
 */

import { describe, it, expect } from 'vitest';
import {
    fireCombatEvent,
    ON_TURN_START,
    ON_ATTACK,
    ON_HIT,
    ON_KO,
    ON_SWAP,
    ON_HEAL_ITEM,
    ON_SKILL_USED,
} from '../js/combat/combatEvents.js';

// ── Instâncias de teste ──────────────────────────────────────────────────────

const makeInstance = (canonSpeciesId, hp = 30, hpMax = 30) => ({
    canonSpeciesId,
    name: canonSpeciesId ?? 'sem-espécie',
    hp,
    hpMax,
    atk: 5,
    def: 4,
    class: 'Guerreiro',
    buffs: [],
});

describe('combatEvents — constantes canônicas', () => {
    it('ON_TURN_START é string válida', () => {
        expect(typeof ON_TURN_START).toBe('string');
        expect(ON_TURN_START).toBeTruthy();
    });

    it('ON_ATTACK é string válida', () => {
        expect(typeof ON_ATTACK).toBe('string');
        expect(ON_ATTACK).toBe('on_attack');
    });

    it('ON_HIT mapeia para evento de recebimento de hit', () => {
        expect(typeof ON_HIT).toBe('string');
        // on_hit_received é o nome usado em speciesPassives.js (shieldhorn)
        expect(ON_HIT).toBe('on_hit_received');
    });

    it('ON_KO é string válida', () => {
        expect(typeof ON_KO).toBe('string');
        expect(ON_KO).toBeTruthy();
    });

    it('ON_SWAP é string válida', () => {
        expect(typeof ON_SWAP).toBe('string');
        expect(ON_SWAP).toBeTruthy();
    });

    it('ON_HEAL_ITEM é string válida', () => {
        expect(typeof ON_HEAL_ITEM).toBe('string');
        expect(ON_HEAL_ITEM).toBe('on_heal_item');
    });

    it('ON_SKILL_USED é string válida', () => {
        expect(typeof ON_SKILL_USED).toBe('string');
        expect(ON_SKILL_USED).toBe('on_skill_used');
    });

    it('todos os eventos são strings distintas', () => {
        const events = [ON_TURN_START, ON_ATTACK, ON_HIT, ON_KO, ON_SWAP, ON_HEAL_ITEM, ON_SKILL_USED];
        const unique = new Set(events);
        expect(unique.size).toBe(events.length);
    });
});

describe('combatEvents — fireCombatEvent', () => {
    it('retorna null para instância sem canonSpeciesId', () => {
        const instance = makeInstance(null);
        const result = fireCombatEvent(instance, ON_ATTACK, { hpPct: 0.5, isOffensiveSkill: false });
        expect(result).toBeNull();
    });

    it('retorna null para instância undefined', () => {
        const result = fireCombatEvent(undefined, ON_ATTACK, {});
        expect(result).toBeNull();
    });

    it('retorna null para espécie sem passiva registrada', () => {
        const instance = makeInstance('especie_inexistente');
        const result = fireCombatEvent(instance, ON_ATTACK, { hpPct: 0.5, isOffensiveSkill: false });
        expect(result).toBeNull();
    });

    it('retorna null para eventos sem passiva (on_turn_start, on_ko, on_swap)', () => {
        const instance = makeInstance('shieldhorn');
        expect(fireCombatEvent(instance, ON_TURN_START, { hpPct: 0.8 })).toBeNull();
        expect(fireCombatEvent(instance, ON_KO, { hpPct: 0 })).toBeNull();
        expect(fireCombatEvent(instance, ON_SWAP, { context: 'ko' })).toBeNull();
    });

    it('payload é passado corretamente ao handler (shieldhorn — on_hit)', () => {
        // shieldhorn: on_hit_received → { damageReduction: 1 } se isFirstHitThisTurn=true
        const instance = makeInstance('shieldhorn');
        const result = fireCombatEvent(instance, ON_HIT, {
            hpPct: 0.8,
            isFirstHitThisTurn: true,
        });
        expect(result).not.toBeNull();
        expect(result?.damageReduction).toBe(1);
    });

    it('shieldhorn NÃO retorna redução quando isFirstHitThisTurn=false', () => {
        const instance = makeInstance('shieldhorn');
        const result = fireCombatEvent(instance, ON_HIT, {
            hpPct: 0.8,
            isFirstHitThisTurn: false,
        });
        expect(result).toBeNull();
    });

    it('floracura — on_heal_item com isFirstHeal=true retorna healBonus', () => {
        const instance = makeInstance('floracura');
        const result = fireCombatEvent(instance, ON_HEAL_ITEM, {
            hpPct: 0.4,
            isFirstHeal: true,
        });
        expect(result).not.toBeNull();
        expect(typeof result?.healBonus).toBe('number');
        expect(result.healBonus).toBeGreaterThan(0);
    });

    it('floracura — on_heal_item com isFirstHeal=false retorna null', () => {
        const instance = makeInstance('floracura');
        const result = fireCombatEvent(instance, ON_HEAL_ITEM, {
            hpPct: 0.4,
            isFirstHeal: false,
        });
        expect(result).toBeNull();
    });

    it('emberfang — on_attack skill ofensiva com HP > 70% retorna atkBonus', () => {
        const instance = makeInstance('emberfang');
        const result = fireCombatEvent(instance, ON_ATTACK, {
            hpPct: 0.8,  // > 0.70
            isOffensiveSkill: true,
        });
        expect(result).not.toBeNull();
        expect(typeof result?.atkBonus).toBe('number');
        expect(result.atkBonus).toBeGreaterThan(0);
    });

    it('emberfang — on_attack básico (isOffensiveSkill=false) retorna null', () => {
        const instance = makeInstance('emberfang');
        const result = fireCombatEvent(instance, ON_ATTACK, {
            hpPct: 0.8,
            isOffensiveSkill: false,
        });
        expect(result).toBeNull();
    });

    it('wildpace — on_attack com hpPct < 0.40 retorna atkBonus', () => {
        const instance = makeInstance('wildpace');
        const result = fireCombatEvent(instance, ON_ATTACK, {
            hpPct: 0.35,
            isOffensiveSkill: false,
        });
        expect(result).not.toBeNull();
        expect(result?.atkBonus).toBeGreaterThan(0);
    });

    it('wildpace — on_attack com hpPct >= 0.40 retorna null', () => {
        const instance = makeInstance('wildpace');
        const result = fireCombatEvent(instance, ON_ATTACK, {
            hpPct: 0.40,
            isOffensiveSkill: false,
        });
        expect(result).toBeNull();
    });

    it('moonquill — on_skill_used com isDebuff=true retorna spdBuff', () => {
        const instance = makeInstance('moonquill');
        const result = fireCombatEvent(instance, ON_SKILL_USED, {
            hpPct: 0.6,
            isDebuff: true,
        });
        expect(result).not.toBeNull();
        expect(result?.spdBuff).toBeDefined();
        expect(typeof result.spdBuff.power).toBe('number');
        expect(typeof result.spdBuff.duration).toBe('number');
    });

    it('moonquill — on_skill_used com isDebuff=false retorna null', () => {
        const instance = makeInstance('moonquill');
        const result = fireCombatEvent(instance, ON_SKILL_USED, {
            hpPct: 0.6,
            isDebuff: false,
        });
        expect(result).toBeNull();
    });

    it('payload vazio não causa erro (shieldhorn dispara pois isFirstHitThisTurn ausente = true)', () => {
        const instance = makeInstance('shieldhorn');
        expect(() => fireCombatEvent(instance, ON_HIT, {})).not.toThrow();
        // isFirstHitThisTurn ausente → undefined → tratado como true (design canônico)
        const result = fireCombatEvent(instance, ON_HIT, {});
        expect(result?.damageReduction).toBe(1);
    });

    it('evento desconhecido não causa erro (retorna null)', () => {
        const instance = makeInstance('shieldhorn');
        expect(() => fireCombatEvent(instance, 'evento_inexistente', {})).not.toThrow();
        expect(fireCombatEvent(instance, 'evento_inexistente', {})).toBeNull();
    });
});

describe('combatEvents — integração com on_turn_start, on_ko, on_swap (contratos sem passiva)', () => {
    it('on_turn_start: todas as espécies retornam null (sem passiva ainda)', () => {
        const especies = ['shieldhorn', 'emberfang', 'floracura', 'swiftclaw',
                          'shadowsting', 'bellwave', 'moonquill', 'wildpace'];
        for (const especie of especies) {
            const instance = makeInstance(especie);
            const result = fireCombatEvent(instance, ON_TURN_START, { hpPct: 0.5 });
            expect(result).toBeNull();
        }
    });

    it('on_ko: todas as espécies retornam null (sem passiva ainda)', () => {
        const especies = ['shieldhorn', 'emberfang', 'floracura'];
        for (const especie of especies) {
            const instance = makeInstance(especie);
            const result = fireCombatEvent(instance, ON_KO, { hpPct: 0 });
            expect(result).toBeNull();
        }
    });

    it('on_swap: todas as espécies retornam null (sem passiva ainda)', () => {
        const especies = ['shieldhorn', 'swiftclaw', 'wildpace'];
        for (const especie of especies) {
            const instance = makeInstance(especie);
            const result = fireCombatEvent(instance, ON_SWAP, { context: 'ko' });
            expect(result).toBeNull();
        }
    });
});
