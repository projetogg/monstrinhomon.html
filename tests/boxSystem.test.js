/**
 * Box System Tests — Fase U
 *
 * Testes das funções puras do módulo js/data/boxSystem.js.
 * Cobertura: BOX_MAX_TOTAL, canAddToBox, addMonsterToBox, removeMonsterFromBox,
 *            getBoxUsage, moveTeamToBox, moveBoxToTeam.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    BOX_MAX_TOTAL,
    canAddToBox,
    addMonsterToBox,
    removeMonsterFromBox,
    getBoxUsage,
    moveTeamToBox,
    moveBoxToTeam,
} from '../js/data/boxSystem.js';

// ---------------------------------------------------------------------------
// Helpers de fixture
// ---------------------------------------------------------------------------

function makeMonster(id, name = 'Mon', cls = 'Mago', level = 5) {
    return { instanceId: id, name, class: cls, level, hp: 30, hpMax: 30 };
}

function makePlayer(id, teamMonsters = [], cls = 'Mago') {
    return { id, name: id, class: cls, team: [...teamMonsters], activeIndex: 0, inventory: {} };
}

// ---------------------------------------------------------------------------
// BOX_MAX_TOTAL
// ---------------------------------------------------------------------------

describe('BOX_MAX_TOTAL', () => {
    it('deve ser 100', () => {
        expect(BOX_MAX_TOTAL).toBe(100);
    });
});

// ---------------------------------------------------------------------------
// canAddToBox
// ---------------------------------------------------------------------------

describe('canAddToBox()', () => {
    it('deve permitir adição quando a box está vazia', () => {
        expect(canAddToBox([])).toEqual({ ok: true });
    });

    it('deve permitir adição quando a box está parcialmente cheia', () => {
        const box = Array.from({ length: 50 }, (_, i) => ({ slotId: `s${i}` }));
        expect(canAddToBox(box)).toEqual({ ok: true });
    });

    it('deve rejeitar quando a box está cheia (100 slots)', () => {
        const box = Array.from({ length: 100 }, (_, i) => ({ slotId: `s${i}` }));
        const result = canAddToBox(box);
        expect(result.ok).toBe(false);
        expect(result.reason).toContain('cheia');
    });

    it('deve rejeitar box inválida (não-array)', () => {
        expect(canAddToBox(null).ok).toBe(false);
        expect(canAddToBox(undefined).ok).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// addMonsterToBox
// ---------------------------------------------------------------------------

describe('addMonsterToBox()', () => {
    let box;

    beforeEach(() => { box = []; });

    it('deve adicionar monstro à box e retornar slotId', () => {
        const monster = makeMonster('m1');
        const result = addMonsterToBox(box, 'player_1', monster);

        expect(result.success).toBe(true);
        expect(typeof result.slotId).toBe('string');
        expect(result.slotId.startsWith('BX_')).toBe(true);
        expect(box).toHaveLength(1);
        expect(box[0].ownerPlayerId).toBe('player_1');
        expect(box[0].monster).toEqual(monster);
    });

    it('deve rejeitar quando a box está cheia', () => {
        for (let i = 0; i < 100; i++) {
            box.push({ slotId: `s${i}`, ownerPlayerId: 'p1', monster: makeMonster(`m${i}`) });
        }
        const result = addMonsterToBox(box, 'player_1', makeMonster('mNew'));
        expect(result.success).toBe(false);
        expect(result.message).toContain('cheia');
    });

    it('deve permitir múltiplos donos na mesma box', () => {
        addMonsterToBox(box, 'player_1', makeMonster('m1'));
        addMonsterToBox(box, 'player_2', makeMonster('m2'));
        expect(box).toHaveLength(2);
        expect(box[0].ownerPlayerId).toBe('player_1');
        expect(box[1].ownerPlayerId).toBe('player_2');
    });
});

// ---------------------------------------------------------------------------
// removeMonsterFromBox
// ---------------------------------------------------------------------------

describe('removeMonsterFromBox()', () => {
    let box;
    let slotId;

    beforeEach(() => {
        box = [];
        const result = addMonsterToBox(box, 'player_1', makeMonster('m1'));
        slotId = result.slotId;
    });

    it('deve remover slot existente e retornar o slot', () => {
        const result = removeMonsterFromBox(box, slotId);
        expect(result.success).toBe(true);
        expect(result.slot.slotId).toBe(slotId);
        expect(box).toHaveLength(0);
    });

    it('deve retornar success:false para slotId inexistente', () => {
        const result = removeMonsterFromBox(box, 'slot_inexistente');
        expect(result.success).toBe(false);
        expect(box).toHaveLength(1); // não removeu nada
    });

    it('deve retornar success:false para box inválida', () => {
        expect(removeMonsterFromBox(null, slotId).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// getBoxUsage
// ---------------------------------------------------------------------------

describe('getBoxUsage()', () => {
    it('deve retornar 0 para box vazia', () => {
        expect(getBoxUsage([], 'player_1')).toBe(0);
    });

    it('deve contar apenas os slots do jogador correto', () => {
        const box = [];
        addMonsterToBox(box, 'player_1', makeMonster('m1'));
        addMonsterToBox(box, 'player_1', makeMonster('m2'));
        addMonsterToBox(box, 'player_2', makeMonster('m3'));

        expect(getBoxUsage(box, 'player_1')).toBe(2);
        expect(getBoxUsage(box, 'player_2')).toBe(1);
    });

    it('deve retornar 0 para box inválida', () => {
        expect(getBoxUsage(null, 'player_1')).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// moveTeamToBox
// ---------------------------------------------------------------------------

describe('moveTeamToBox()', () => {
    let box;
    let player;

    beforeEach(() => {
        box = [];
        player = makePlayer('player_1', [
            makeMonster('m1', 'Faíscari'),
            makeMonster('m2', 'Cantapau'),
        ]);
        player.activeIndex = 0;
    });

    it('deve mover monstro do time para a box', () => {
        const result = moveTeamToBox(player, box, 0);

        expect(result.success).toBe(true);
        expect(player.team).toHaveLength(1);
        expect(player.team[0].instanceId).toBe('m2');
        expect(box).toHaveLength(1);
        expect(box[0].monster.instanceId).toBe('m1');
    });

    it('deve ajustar activeIndex quando o monstro ativo é removido', () => {
        player.activeIndex = 0; // aponta para m1 (índice 0)
        // firstAliveIndex retorna 0 (m2 fica no índice 0 após splice)
        const result = moveTeamToBox(player, box, 0, {
            firstAliveIndex: (team) => (team.length > 0 ? 0 : -1),
        });

        expect(result.success).toBe(true);
        expect(player.activeIndex).toBe(0);
    });

    it('deve decrementar activeIndex quando monstro removido é anterior ao ativo', () => {
        player.activeIndex = 1; // aponta para m2
        moveTeamToBox(player, box, 0); // remove m1 (índice 0)
        expect(player.activeIndex).toBe(0); // 1 - 1
    });

    it('deve manter activeIndex quando monstro removido é posterior ao ativo', () => {
        player.activeIndex = 0; // aponta para m1 — mas usamos firstAliveIndex mock
        // Vamos testar com activeIndex=0 e removendo índice 1
        player.activeIndex = 0;
        moveTeamToBox(player, box, 1); // remove m2
        expect(player.activeIndex).toBe(0); // não muda
    });

    it('deve retornar erro para jogador null', () => {
        expect(moveTeamToBox(null, box, 0).success).toBe(false);
    });

    it('deve retornar erro para índice inválido', () => {
        expect(moveTeamToBox(player, box, 999).success).toBe(false);
        expect(moveTeamToBox(player, box, -1).success).toBe(false);
    });

    it('deve rejeitar se a box estiver cheia', () => {
        for (let i = 0; i < 100; i++) {
            box.push({ slotId: `s${i}`, ownerPlayerId: 'player_1', monster: makeMonster(`f${i}`) });
        }
        const result = moveTeamToBox(player, box, 0);
        expect(result.success).toBe(false);
        expect(player.team).toHaveLength(2); // time não foi alterado
    });
});

// ---------------------------------------------------------------------------
// moveBoxToTeam
// ---------------------------------------------------------------------------

describe('moveBoxToTeam()', () => {
    let box;
    let player;
    let slotId;

    beforeEach(() => {
        box = [];
        player = makePlayer('player_1', [makeMonster('m1', 'Faíscari')]);
        const result = addMonsterToBox(box, 'player_1', makeMonster('m2', 'Cantapau'));
        slotId = result.slotId;
    });

    it('deve mover monstro da box para o time', () => {
        const result = moveBoxToTeam(player, box, slotId, { maxTeamSize: 6 });

        expect(result.success).toBe(true);
        expect(player.team).toHaveLength(2);
        expect(player.team[1].instanceId).toBe('m2');
        expect(box).toHaveLength(0);
    });

    it('deve rejeitar quando o time está cheio', () => {
        while (player.team.length < 6) {
            player.team.push(makeMonster(`fill_${player.team.length}`));
        }
        const result = moveBoxToTeam(player, box, slotId, { maxTeamSize: 6 });
        expect(result.success).toBe(false);
        expect(result.message).toContain('cheia');
    });

    it('deve rejeitar slot de outro jogador', () => {
        const boxP2 = [];
        const r = addMonsterToBox(boxP2, 'player_2', makeMonster('m3'));
        const otherSlotId = r.slotId;

        // Coloca ambos na mesma box
        box.push(boxP2[0]);

        const result = moveBoxToTeam(player, box, otherSlotId, { maxTeamSize: 6 });
        expect(result.success).toBe(false);
        expect(result.message).toContain('não é seu');
    });

    it('deve rejeitar slotId inexistente', () => {
        const result = moveBoxToTeam(player, box, 'slot_invalido', { maxTeamSize: 6 });
        expect(result.success).toBe(false);
    });

    it('deve rejeitar player null', () => {
        expect(moveBoxToTeam(null, box, slotId).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Testes de integração — moveTeamToBox + moveBoxToTeam + getBoxUsage
// ---------------------------------------------------------------------------

describe('Integração — ciclo completo time ↔ box', () => {
    it('deve permitir mover dois jogadores para a box e de volta', () => {
        const box = [];
        const p1 = makePlayer('player_1', [makeMonster('m1'), makeMonster('m2')]);
        const p2 = makePlayer('player_2', [makeMonster('m3')]);

        // p1 envia m1 para box
        moveTeamToBox(p1, box, 0);
        // p2 envia m3 para box
        moveTeamToBox(p2, box, 0);

        expect(getBoxUsage(box, 'player_1')).toBe(1);
        expect(getBoxUsage(box, 'player_2')).toBe(1);

        // p1 retira seu monstro
        const p1Slot = box.find(s => s.ownerPlayerId === 'player_1');
        const r1 = moveBoxToTeam(p1, box, p1Slot.slotId, { maxTeamSize: 6 });
        expect(r1.success).toBe(true);
        expect(getBoxUsage(box, 'player_1')).toBe(0);
        expect(getBoxUsage(box, 'player_2')).toBe(1);
    });

    it('p1 não pode retirar monstro da box de p2', () => {
        const box = [];
        const p1 = makePlayer('player_1', [makeMonster('m1')]);
        const p2 = makePlayer('player_2', [makeMonster('m2')]);

        moveTeamToBox(p2, box, 0);
        const p2Slot = box[0];

        const result = moveBoxToTeam(p1, box, p2Slot.slotId, { maxTeamSize: 6 });
        expect(result.success).toBe(false);
        expect(box).toHaveLength(1);
    });
});

