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

    it('unlockNode é idempotente', () => {
        const state = { data: { completedNodes: [] } };
        expect(unlockNode('LOC_002', state)).toBe(true);
        expect(unlockNode('LOC_002', state)).toBe(false);
        expect(state.data.completedNodes).toEqual(['LOC_002']);
    });
});

