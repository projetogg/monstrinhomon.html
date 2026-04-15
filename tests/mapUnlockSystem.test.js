import { describe, it, expect } from 'vitest';
import { checkUnlock, unlockNode } from '../js/encounter/mapUnlockSystem.js';

describe('MapUnlockSystem - desbloqueio de nós', () => {
    it('desbloqueia regra always', () => {
        expect(checkUnlock({ unlockRule: { type: 'always' } }, new Set())).toBe(true);
    });

    it('desbloqueia complete_node quando pré-requisito foi concluído', () => {
        const node = { unlockRule: { type: 'complete_node', nodeId: 'LOC_001' } };
        expect(checkUnlock(node, new Set(['LOC_001']))).toBe(true);
        expect(checkUnlock(node, new Set())).toBe(false);
    });

    it('desbloqueia complete_node com array em vez de Set', () => {
        const node = { unlockRule: { type: 'complete_node', nodeId: 'LOC_001' } };
        expect(checkUnlock(node, ['LOC_001'])).toBe(true);
        expect(checkUnlock(node, [])).toBe(false);
    });

    it('desbloqueia unlockDefault:true independente da regra', () => {
        const node = { unlockDefault: true, unlockRule: { type: 'complete_node', nodeId: 'LOC_999' } };
        expect(checkUnlock(node, new Set())).toBe(true);
    });

    it('retorna false para nó null', () => {
        expect(checkUnlock(null, new Set())).toBe(false);
    });

    // ── XVII-A: win_n_battles_in_node ──────────────────────────────────────

    it('desbloqueia win_n_battles_in_node quando wildWins >= n', () => {
        const node = { unlockRule: { type: 'win_n_battles_in_node', nodeId: 'LOC_001', n: 2 } };
        expect(checkUnlock(node, new Set(), { LOC_001: { wildWins: 2 } })).toBe(true);
        expect(checkUnlock(node, new Set(), { LOC_001: { wildWins: 3 } })).toBe(true);
    });

    it('bloqueia win_n_battles_in_node quando wildWins < n', () => {
        const node = { unlockRule: { type: 'win_n_battles_in_node', nodeId: 'LOC_001', n: 2 } };
        expect(checkUnlock(node, new Set(), { LOC_001: { wildWins: 1 } })).toBe(false);
        expect(checkUnlock(node, new Set(), {})).toBe(false);
        // sem terceiro argumento → nodeFlags vazio por padrão
        expect(checkUnlock(node, new Set())).toBe(false);
    });

    it('win_n_battles_in_node usa n=1 quando n não informado', () => {
        const node = { unlockRule: { type: 'win_n_battles_in_node', nodeId: 'LOC_001' } };
        expect(checkUnlock(node, new Set(), { LOC_001: { wildWins: 1 } })).toBe(true);
        expect(checkUnlock(node, new Set(), { LOC_001: { wildWins: 0 } })).toBe(false);
    });

    // ── XVII-A: defeat_boss ────────────────────────────────────────────────

    it('desbloqueia defeat_boss quando bossDefeated === true', () => {
        const node = { unlockRule: { type: 'defeat_boss', nodeId: 'BOSS_FOREST_01' } };
        expect(checkUnlock(node, new Set(), { BOSS_FOREST_01: { bossDefeated: true } })).toBe(true);
    });

    it('bloqueia defeat_boss quando bossDefeated !== true', () => {
        const node = { unlockRule: { type: 'defeat_boss', nodeId: 'BOSS_FOREST_01' } };
        expect(checkUnlock(node, new Set(), { BOSS_FOREST_01: { bossDefeated: false } })).toBe(false);
        expect(checkUnlock(node, new Set(), {})).toBe(false);
        expect(checkUnlock(node, new Set())).toBe(false);
    });

    // ── unlockNode ─────────────────────────────────────────────────────────

    it('unlockNode é idempotente', () => {
        const state = { data: { completedNodes: [] } };
        expect(unlockNode('LOC_002', state)).toBe(true);
        expect(unlockNode('LOC_002', state)).toBe(false);
        expect(state.data.completedNodes).toEqual(['LOC_002']);
    });

    it('unlockNode chama state.save() ao inserir', () => {
        let saved = false;
        const state = { data: { completedNodes: [] }, save: () => { saved = true; } };
        unlockNode('LOC_003', state);
        expect(saved).toBe(true);
    });

    it('unlockNode retorna false para nodeId vazio ou state null', () => {
        expect(unlockNode('', {})).toBe(false);
        expect(unlockNode('LOC_001', null)).toBe(false);
    });
});

