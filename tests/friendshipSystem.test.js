/**
 * FRIENDSHIP SYSTEM TESTS (FASE R / FASE X)
 *
 * Testa as funções puras do módulo friendshipSystem.js.
 * Cobertura: getFriendshipLevel, getFriendshipIcon, getFriendshipBonuses,
 *            formatFriendshipBonusPercent, applyFriendshipDelta,
 *            applyFriendshipEvent
 */

import { describe, it, expect } from 'vitest';
import {
    DEFAULT_FRIENDSHIP,
    FRIENDSHIP_ICONS,
    getFriendshipLevel,
    getFriendshipIcon,
    getFriendshipBonuses,
    formatFriendshipBonusPercent,
    applyFriendshipDelta,
    applyFriendshipEvent,
} from '../js/progression/friendshipSystem.js';

// ─── Constantes ───────────────────────────────────────────────────────────────

describe('FriendshipSystem — constantes', () => {
    it('DEFAULT_FRIENDSHIP é 50', () => {
        expect(DEFAULT_FRIENDSHIP).toBe(50);
    });

    it('FRIENDSHIP_ICONS tem 5 entradas', () => {
        expect(FRIENDSHIP_ICONS).toHaveLength(5);
    });
});

// ─── getFriendshipLevel ───────────────────────────────────────────────────────

describe('getFriendshipLevel', () => {
    it('retorna nível 1 para valores < 25', () => {
        expect(getFriendshipLevel(0)).toBe(1);
        expect(getFriendshipLevel(1)).toBe(1);
        expect(getFriendshipLevel(24)).toBe(1);
    });

    it('retorna nível 2 para valores 25–49', () => {
        expect(getFriendshipLevel(25)).toBe(2);
        expect(getFriendshipLevel(49)).toBe(2);
    });

    it('retorna nível 3 para valores 50–74', () => {
        expect(getFriendshipLevel(50)).toBe(3);
        expect(getFriendshipLevel(74)).toBe(3);
    });

    it('retorna nível 4 para valores 75–99', () => {
        expect(getFriendshipLevel(75)).toBe(4);
        expect(getFriendshipLevel(99)).toBe(4);
    });

    it('retorna nível 5 para valor 100', () => {
        expect(getFriendshipLevel(100)).toBe(5);
    });

    it('aceita string numérica sem erro', () => {
        expect(getFriendshipLevel('80')).toBe(4);
    });

    it('retorna nível 1 para NaN', () => {
        expect(getFriendshipLevel(NaN)).toBe(1);
    });
});

// ─── getFriendshipIcon ────────────────────────────────────────────────────────

describe('getFriendshipIcon', () => {
    it('retorna 🖤 para amizade < 25', () => {
        expect(getFriendshipIcon(0)).toBe('🖤');
        expect(getFriendshipIcon(24)).toBe('🖤');
    });

    it('retorna 🤍 para amizade 25–49', () => {
        expect(getFriendshipIcon(25)).toBe('🤍');
        expect(getFriendshipIcon(49)).toBe('🤍');
    });

    it('retorna 💛 para amizade 50–74', () => {
        expect(getFriendshipIcon(50)).toBe('💛');
    });

    it('retorna 💚 para amizade 75–99', () => {
        expect(getFriendshipIcon(75)).toBe('💚');
    });

    it('retorna ❤️ para amizade 100', () => {
        expect(getFriendshipIcon(100)).toBe('❤️');
    });
});

// ─── getFriendshipBonuses ─────────────────────────────────────────────────────

describe('getFriendshipBonuses', () => {
    it('nível 1 (amizade 0): sem bônus', () => {
        const b = getFriendshipBonuses(0);
        expect(b.xpMultiplier).toBe(1.0);
        expect(b.critChance).toBe(0);
        expect(b.statBonus).toBe(0);
    });

    it('nível 2 (amizade 25): +5% XP', () => {
        const b = getFriendshipBonuses(25);
        expect(b.xpMultiplier).toBe(1.05);
        expect(b.critChance).toBe(0);
    });

    it('nível 3 (amizade 50): +5% XP + 5% crítico', () => {
        const b = getFriendshipBonuses(50);
        expect(b.xpMultiplier).toBe(1.05);
        expect(b.critChance).toBe(0.05);
    });

    it('nível 4 (amizade 75): +10% XP + 5% crítico + 1 stat', () => {
        const b = getFriendshipBonuses(75);
        expect(b.xpMultiplier).toBe(1.10);
        expect(b.critChance).toBe(0.05);
        expect(b.statBonus).toBe(1);
    });

    it('nível 5 (amizade 100): mesmo bônus do nível 4 (surviveChance futuro)', () => {
        const b = getFriendshipBonuses(100);
        expect(b.xpMultiplier).toBe(1.10);
        expect(b.statBonus).toBe(1);
    });

    it('retorna objeto com todas as chaves esperadas', () => {
        const b = getFriendshipBonuses(50);
        expect(b).toHaveProperty('xpMultiplier');
        expect(b).toHaveProperty('critChance');
        expect(b).toHaveProperty('statBonus');
        expect(b).toHaveProperty('surviveChance');
    });
});

// ─── formatFriendshipBonusPercent ─────────────────────────────────────────────

describe('formatFriendshipBonusPercent', () => {
    it('1.0 → 0%', () => {
        expect(formatFriendshipBonusPercent(1.0)).toBe(0);
    });

    it('1.05 → 5%', () => {
        expect(formatFriendshipBonusPercent(1.05)).toBe(5);
    });

    it('1.10 → 10%', () => {
        expect(formatFriendshipBonusPercent(1.10)).toBe(10);
    });

    it('1.08 → 8%', () => {
        expect(formatFriendshipBonusPercent(1.08)).toBe(8);
    });
});

// ─── applyFriendshipDelta ─────────────────────────────────────────────────────

describe('applyFriendshipDelta', () => {
    it('soma delta corretamente', () => {
        expect(applyFriendshipDelta(50, 10)).toBe(60);
    });

    it('subtrai delta corretamente', () => {
        expect(applyFriendshipDelta(50, -10)).toBe(40);
    });

    it('clampea em 0 quando resultado é negativo', () => {
        expect(applyFriendshipDelta(5, -20)).toBe(0);
    });

    it('clampea em 100 quando resultado ultrapassa máximo', () => {
        expect(applyFriendshipDelta(95, 20)).toBe(100);
    });

    it('mantém 0 para delta 0', () => {
        expect(applyFriendshipDelta(0, 0)).toBe(0);
    });

    it('retorna DEFAULT_FRIENDSHIP para valor inválido', () => {
        expect(applyFriendshipDelta(NaN, 10)).toBe(DEFAULT_FRIENDSHIP);
    });

    it('retorna DEFAULT_FRIENDSHIP para undefined', () => {
        expect(applyFriendshipDelta(undefined, 5)).toBe(DEFAULT_FRIENDSHIP);
    });
});

// ─── applyFriendshipEvent ─────────────────────────────────────────────────────

describe('applyFriendshipEvent', () => {
    const makeMonster = (friendship = 50) => ({ name: 'Luma', friendship });
    const config = { win: 5, faint: -10, capture: 15 };

    it('aplica delta positivo corretamente', () => {
        const mon = makeMonster(50);
        applyFriendshipEvent(mon, 'win', config, null);
        expect(mon.friendship).toBe(55);
    });

    it('aplica delta negativo corretamente', () => {
        const mon = makeMonster(50);
        applyFriendshipEvent(mon, 'faint', config, null);
        expect(mon.friendship).toBe(40);
    });

    it('clampea em 0 para resultado negativo', () => {
        const mon = makeMonster(5);
        applyFriendshipEvent(mon, 'faint', config, null);
        expect(mon.friendship).toBe(0);
    });

    it('clampea em 100 para resultado que ultrapassa máximo', () => {
        const mon = makeMonster(90);
        applyFriendshipEvent(mon, 'capture', config, null);
        expect(mon.friendship).toBe(100);
    });

    it('evento desconhecido não muda friendship', () => {
        const mon = makeMonster(50);
        applyFriendshipEvent(mon, 'evento_inexistente', config, null);
        expect(mon.friendship).toBe(50);
    });

    it('inicializa friendship se ausente', () => {
        const mon = { name: 'Trok' };
        applyFriendshipEvent(mon, 'win', config, null);
        expect(mon.friendship).toBe(DEFAULT_FRIENDSHIP + 5);
    });

    it('retorna silenciosamente para monster inválido', () => {
        expect(() => applyFriendshipEvent(null, 'win', config, null)).not.toThrow();
        expect(() => applyFriendshipEvent(undefined, 'win', config, null)).not.toThrow();
    });

    it('retorna silenciosamente sem config', () => {
        const mon = makeMonster(50);
        applyFriendshipEvent(mon, 'win', null, null);
        expect(mon.friendship).toBe(50); // não mudou
    });

    it('empurra mensagem de marco ao atingir 50', () => {
        const mon = makeMonster(45);
        const log = [];
        applyFriendshipEvent(mon, 'win', config, log);
        expect(log.length).toBe(1);
        expect(log[0]).toContain('💛');
        expect(log[0]).toContain('Luma');
    });

    it('empurra mensagem de marco ao atingir 75', () => {
        const mon = makeMonster(70);
        const log = [];
        applyFriendshipEvent(mon, 'capture', config, log);
        expect(log.length).toBe(1);
        expect(log[0]).toContain('💚');
    });

    it('empurra mensagem de marco ao atingir 100', () => {
        const mon = makeMonster(85);
        const log = [];
        applyFriendshipEvent(mon, 'capture', config, log);
        expect(log.length).toBe(1);
        expect(log[0]).toContain('💖');
    });

    it('não empurra mensagem se já estava no marco', () => {
        const mon = makeMonster(75);
        const log = [];
        applyFriendshipEvent(mon, 'win', config, log);
        expect(log.length).toBe(0); // já estava em >= 75
    });

    it('não empurra mensagem se log for null', () => {
        const mon = makeMonster(45);
        expect(() => applyFriendshipEvent(mon, 'win', config, null)).not.toThrow();
    });

    it('usa nickname em mensagens de marco quando disponível', () => {
        const mon = { name: 'Luma', nickname: 'LuminoZão', friendship: 45 };
        const log = [];
        applyFriendshipEvent(mon, 'win', config, log);
        expect(log[0]).toContain('LuminoZão');
    });
});
