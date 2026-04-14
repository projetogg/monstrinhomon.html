/**
 * BATTLE INITIALIZATION TESTS (Bug Audit)
 *
 * Testes para funções de inicialização de batalha sem cobertura prévia:
 *   - initializeGroupBattleParticipation (groupActions.js)
 *   - initializeWildBattleParticipation (wildActions.js)
 *
 * Cobertura:
 *   - Inicialização de flags participatedThisBattle em batalha em grupo
 *   - Inicialização de flags em batalha wild (1v1)
 *   - Comportamento com arrays vazios / null / undefined
 *   - Garantia de que flags não se propagam entre batalhas
 */

import { describe, it, expect } from 'vitest';
import { initializeGroupBattleParticipation } from '../js/combat/groupActions.js';
import { initializeWildBattleParticipation } from '../js/combat/wildActions.js';

// ─── Factories ───────────────────────────────────────────────────────────────

function makeMonster(id, overrides = {}) {
    return {
        instanceId: id,
        name: `Mon_${id}`,
        hp: 30, hpMax: 30,
        atk: 5, def: 3,
        level: 1,
        class: 'Guerreiro',
        ...overrides
    };
}

// ─── initializeGroupBattleParticipation ──────────────────────────────────────

describe('initializeGroupBattleParticipation', () => {
    it('deve inicializar participatedThisBattle=false em todos os monstros do jogador', () => {
        const player1 = makeMonster('p1', { participatedThisBattle: true });
        const player2 = makeMonster('p2', { participatedThisBattle: true });

        initializeGroupBattleParticipation([player1, player2]);

        expect(player1.participatedThisBattle).toBe(false);
        expect(player2.participatedThisBattle).toBe(false);
    });

    it('deve inicializar participatedThisBattle em inimigos também', () => {
        const player = makeMonster('p1');
        const enemy1 = makeMonster('e1', { participatedThisBattle: true });
        const enemy2 = makeMonster('e2', { participatedThisBattle: true });

        initializeGroupBattleParticipation([player], [enemy1, enemy2]);

        expect(enemy1.participatedThisBattle).toBe(false);
        expect(enemy2.participatedThisBattle).toBe(false);
    });

    it('não deve lançar erro com array de inimigos vazio', () => {
        const player = makeMonster('p1');
        expect(() => initializeGroupBattleParticipation([player], [])).not.toThrow();
    });

    it('deve funcionar sem o segundo argumento (inimigos omitidos)', () => {
        const player = makeMonster('p1', { participatedThisBattle: true });
        expect(() => initializeGroupBattleParticipation([player])).not.toThrow();
        expect(player.participatedThisBattle).toBe(false);
    });

    it('deve incluir tanto jogadores quanto inimigos na inicialização', () => {
        const player = makeMonster('p1', { participatedThisBattle: true });
        const enemy = makeMonster('e1', { participatedThisBattle: true });

        initializeGroupBattleParticipation([player], [enemy]);

        // Ambos devem ter sido resetados
        expect(player.participatedThisBattle).toBe(false);
        expect(enemy.participatedThisBattle).toBe(false);
    });

    it('deve lidar com array de jogadores vazio sem erro', () => {
        expect(() => initializeGroupBattleParticipation([])).not.toThrow();
    });

    it('deve ignorar entradas null/undefined no array', () => {
        const player = makeMonster('p1', { participatedThisBattle: true });
        expect(() => initializeGroupBattleParticipation([player, null, undefined])).not.toThrow();
        expect(player.participatedThisBattle).toBe(false);
    });

    it('garante que flags não se propagam entre batalhas consecutivas', () => {
        const mon = makeMonster('p1');

        // Primeira batalha: mon participa
        initializeGroupBattleParticipation([mon]);
        mon.participatedThisBattle = true;
        expect(mon.participatedThisBattle).toBe(true);

        // Segunda batalha: flag deve ser resetada
        initializeGroupBattleParticipation([mon]);
        expect(mon.participatedThisBattle).toBe(false);
    });
});

// ─── initializeWildBattleParticipation ───────────────────────────────────────

describe('initializeWildBattleParticipation', () => {
    it('deve inicializar participatedThisBattle=false no monstro do jogador', () => {
        const player = makeMonster('p1', { participatedThisBattle: true });

        initializeWildBattleParticipation(player);

        expect(player.participatedThisBattle).toBe(false);
    });

    it('deve inicializar participatedThisBattle no monstro wild quando fornecido', () => {
        const player = makeMonster('p1', { participatedThisBattle: true });
        const wild   = makeMonster('w1', { participatedThisBattle: true });

        initializeWildBattleParticipation(player, wild);

        expect(player.participatedThisBattle).toBe(false);
        expect(wild.participatedThisBattle).toBe(false);
    });

    it('deve funcionar sem o segundo argumento (monstro wild null)', () => {
        const player = makeMonster('p1', { participatedThisBattle: true });
        expect(() => initializeWildBattleParticipation(player, null)).not.toThrow();
        expect(player.participatedThisBattle).toBe(false);
    });

    it('garante isolamento entre batalhas wild consecutivas', () => {
        const mon = makeMonster('p1');

        // Primeira batalha: marca participação
        initializeWildBattleParticipation(mon);
        mon.participatedThisBattle = true;

        // Segunda batalha: deve resetar
        initializeWildBattleParticipation(mon);
        expect(mon.participatedThisBattle).toBe(false);
    });
});
