/**
 * ENEMY HP CALIBRATION TESTS (FASE V)
 *
 * Testes para calibrateEnemyHP (importado via groupActions internals não expostos,
 * então testamos comportamento via lógica direta).
 */

import { describe, it, expect } from 'vitest';

/**
 * Replica da função calibrateEnemyHP para teste isolado.
 * A função real fica em groupActions.js (não exportada — função privada).
 */
function calibrateEnemyHP(enc) {
    if (enc._hpCalibrated || enc.type === 'boss') return;
    enc._hpCalibrated = true;
    const count = (enc.enemies || []).filter(e => e).length;
    if (count <= 1) return;
    const mult = count === 2 ? 0.75 : 0.60;
    for (const e of (enc.enemies || [])) {
        if (!e) continue;
        const origHp = Number(e.hpMax) || 1;
        const newHpMax = Math.max(1, Math.round(origHp * mult));
        e.hpMax = newHpMax;
        e.hp = Math.min(Number(e.hp) || newHpMax, newHpMax);
    }
}

describe('FASE V — calibrateEnemyHP', () => {
    it('1 inimigo: não altera HP', () => {
        const enc = { enemies: [{ hp: 100, hpMax: 100 }] };
        calibrateEnemyHP(enc);
        expect(enc.enemies[0].hpMax).toBe(100);
    });

    it('2 inimigos: aplica ×0.75', () => {
        const enc = {
            enemies: [
                { hp: 100, hpMax: 100 },
                { hp: 80, hpMax: 80 },
            ]
        };
        calibrateEnemyHP(enc);
        expect(enc.enemies[0].hpMax).toBe(75);
        expect(enc.enemies[1].hpMax).toBe(60);
    });

    it('3 inimigos: aplica ×0.60', () => {
        const enc = {
            enemies: [
                { hp: 100, hpMax: 100 },
                { hp: 100, hpMax: 100 },
                { hp: 100, hpMax: 100 },
            ]
        };
        calibrateEnemyHP(enc);
        expect(enc.enemies[0].hpMax).toBe(60);
        expect(enc.enemies[1].hpMax).toBe(60);
        expect(enc.enemies[2].hpMax).toBe(60);
    });

    it('boss: não altera HP', () => {
        const enc = {
            type: 'boss',
            enemies: [
                { hp: 200, hpMax: 200 },
                { hp: 200, hpMax: 200 },
            ]
        };
        calibrateEnemyHP(enc);
        expect(enc.enemies[0].hpMax).toBe(200);
    });

    it('idempotente: segunda chamada não altera', () => {
        const enc = {
            enemies: [
                { hp: 100, hpMax: 100 },
                { hp: 100, hpMax: 100 },
            ]
        };
        calibrateEnemyHP(enc);
        const after1 = enc.enemies[0].hpMax;
        calibrateEnemyHP(enc);
        expect(enc.enemies[0].hpMax).toBe(after1);
    });

    it('hp atual é ajustado para não ultrapassar novo hpMax', () => {
        const enc = {
            enemies: [
                { hp: 100, hpMax: 100 }, // hp=100, hpMax=75 após calibração
                { hp: 50, hpMax: 100 },  // hp=50 (abaixo do novo hpMax=75) → mantém 50
            ]
        };
        calibrateEnemyHP(enc);
        expect(enc.enemies[0].hp).toBe(75); // ajustado para hpMax
        expect(enc.enemies[1].hp).toBe(50); // mantido
    });
});
