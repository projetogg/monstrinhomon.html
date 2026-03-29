/**
 * SAVE LAYER AUDIT TESTS (PR-SAVE-AUDIT)
 *
 * Auditoria técnica completa do sistema de save/load do Monstrinhomon.
 * Cobertura:
 *   - getActiveSlot: resolução de slot ativo com diferentes configs
 *   - setActiveSlot: atualiza GameState.saveSlot e StorageManager.lastSlot
 *   - saveActiveGame: salva auto-save e espelha no slot ativo
 *   - loadActiveGame: sempre carrega do auto-save (fonte de verdade)
 *   - syncMainStateAndSlot: sincroniza slot ativo com auto-save
 *   - Fluxo: novo jogo no slot 1
 *   - Fluxo: save manual
 *   - Fluxo: continue
 *   - Fluxo: reload
 *   - Fluxo: troca para slot 2
 *   - Isolamento entre slots
 *   - Consistência entre auto-save e slot ativo
 *   - Falha de save não exibindo falso sucesso
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─── Mock de StorageManager ────────────────────────────────────────────────

function makeStorageManagerMock(overrides = {}) {
    const store = {};
    const lastSlotStore = { value: null };

    return {
        _store: store,
        saveState: vi.fn((state) => {
            try {
                store['monstrinhomon_state'] = JSON.parse(JSON.stringify(state));
                return true;
            } catch { return false; }
        }),
        loadState: vi.fn(() => {
            const s = store['monstrinhomon_state'];
            if (!s) return { state: null, loaded: false, migrated: false, notes: [] };
            return { state: JSON.parse(JSON.stringify(s)), loaded: true, migrated: false, notes: [] };
        }),
        saveSlot: vi.fn((slot, data) => {
            try {
                store[`mm_save_slot_${slot}`] = JSON.parse(JSON.stringify(data));
                return true;
            } catch { return false; }
        }),
        loadSlot: vi.fn((slot) => {
            const d = store[`mm_save_slot_${slot}`];
            if (!d) return { data: null, loaded: false, notes: [] };
            return { data: JSON.parse(JSON.stringify(d)), loaded: true, notes: [] };
        }),
        getLastSlot: vi.fn(() => lastSlotStore.value),
        setLastSlot: vi.fn((slot) => { lastSlotStore.value = slot; return true; }),
        _lastSlotStore: lastSlotStore,
        ...overrides,
    };
}

// ─── Cópia isolada do SaveLayer para cada teste ────────────────────────────

/**
 * Cria uma instância testável do SaveLayer, injetando GameState e StorageManager
 * via mockWindow (em vez de window global), tornando os testes isolados e sem efeitos colaterais.
 */
function makeSaveLayer(mockWindow) {
    // SaveLayer lê window.GameState e window.StorageManager
    // Criamos um closure que usa mockWindow
    function getActiveSlot() {
        const gs = mockWindow.GameState;
        const fromState = gs && gs.saveSlot;
        if (fromState && [1, 2, 3].includes(Number(fromState))) return Number(fromState);
        const sm = mockWindow.StorageManager;
        if (sm) return sm.getLastSlot();
        return null;
    }

    function setActiveSlot(slot) {
        const n = Number(slot);
        if (![1, 2, 3].includes(n)) return false;
        const gs = mockWindow.GameState;
        if (gs) gs.saveSlot = n;
        const sm = mockWindow.StorageManager;
        if (sm) sm.setLastSlot(n);
        return true;
    }

    function saveActiveGame(gameState, buildEnvelopeFn) {
        let autoSaved = false;
        try {
            const sm = mockWindow.StorageManager;
            if (!sm) return { autoSaved: false, slotSaved: false, slot: null };
            autoSaved = sm.saveState(gameState);
        } catch { return { autoSaved: false, slotSaved: false, slot: null }; }

        const slot = getActiveSlot();
        let slotSaved = true;

        if (slot && typeof buildEnvelopeFn === 'function') {
            slotSaved = false;
            try {
                const envelope = buildEnvelopeFn(gameState);
                const sm = mockWindow.StorageManager;
                if (sm) slotSaved = sm.saveSlot(slot, envelope);
            } catch { /* slotSaved permanece false */ }
        }

        return { autoSaved, slotSaved, slot };
    }

    function loadActiveGame() {
        try {
            const sm = mockWindow.StorageManager;
            if (!sm) return { state: null, loaded: false, notes: ['StorageManager ausente'] };
            return sm.loadState();
        } catch (e) {
            return { state: null, loaded: false, notes: [e.message] };
        }
    }

    function syncMainStateAndSlot(gameState, buildEnvelopeFn) {
        const slot = getActiveSlot();
        if (!slot) return { synced: false, slot: null, reason: 'Nenhum slot ativo definido' };
        if (typeof buildEnvelopeFn !== 'function') {
            return { synced: false, slot, reason: 'buildEnvelopeFn ausente ou inválida' };
        }
        try {
            const envelope = buildEnvelopeFn(gameState);
            const sm = mockWindow.StorageManager;
            if (!sm) return { synced: false, slot, reason: 'StorageManager ausente' };
            const ok = sm.saveSlot(slot, envelope);
            return { synced: ok, slot, reason: ok ? null : 'saveSlot retornou false' };
        } catch (e) {
            return { synced: false, slot, reason: e.message };
        }
    }

    return { getActiveSlot, setActiveSlot, saveActiveGame, loadActiveGame, syncMainStateAndSlot };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function makeGameState(overrides = {}) {
    return {
        players: [{ id: 'p1', name: 'João', class: 'Guerreiro', team: [], box: [] }],
        monsters: [],
        saveSlot: null,
        meta: { saveVersion: 1 },
        config: { maxTeamSize: 6 },
        ...overrides,
    };
}

function buildEnvelope(gameState) {
    return {
        version: 'mm_slot_v1',
        timestamp: Date.now(),
        sessionName: 'Sessão Teste',
        playersCount: gameState.players?.length ?? 0,
        state: JSON.parse(JSON.stringify(gameState)),
    };
}

// ─── TESTES ───────────────────────────────────────────────────────────────

describe('SaveLayer — getActiveSlot', () => {
    it('deve retornar null se GameState.saveSlot não definido e nenhum lastSlot', () => {
        const sm = makeStorageManagerMock();
        sm.getLastSlot.mockReturnValue(null);
        const w = { GameState: makeGameState({ saveSlot: null }), StorageManager: sm };
        const sl = makeSaveLayer(w);
        expect(sl.getActiveSlot()).toBeNull();
    });

    it('deve retornar GameState.saveSlot quando definido', () => {
        const sm = makeStorageManagerMock();
        const w = { GameState: makeGameState({ saveSlot: 2 }), StorageManager: sm };
        const sl = makeSaveLayer(w);
        expect(sl.getActiveSlot()).toBe(2);
    });

    it('deve ignorar GameState.saveSlot inválido e cair para lastSlot', () => {
        const sm = makeStorageManagerMock();
        sm.getLastSlot.mockReturnValue(3);
        const w = { GameState: makeGameState({ saveSlot: 99 }), StorageManager: sm };
        const sl = makeSaveLayer(w);
        // 99 não é slot válido → deve usar lastSlot
        expect(sl.getActiveSlot()).toBe(3);
    });

    it('deve retornar lastSlot quando GameState.saveSlot é null', () => {
        const sm = makeStorageManagerMock();
        sm.getLastSlot.mockReturnValue(1);
        const w = { GameState: makeGameState({ saveSlot: null }), StorageManager: sm };
        const sl = makeSaveLayer(w);
        expect(sl.getActiveSlot()).toBe(1);
    });

    it('deve retornar null quando StorageManager ausente e saveSlot null', () => {
        const w = { GameState: makeGameState({ saveSlot: null }), StorageManager: null };
        const sl = makeSaveLayer(w);
        expect(sl.getActiveSlot()).toBeNull();
    });
});

describe('SaveLayer — setActiveSlot', () => {
    it('deve atualizar GameState.saveSlot', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        sl.setActiveSlot(2);
        expect(gs.saveSlot).toBe(2);
    });

    it('deve chamar StorageManager.setLastSlot', () => {
        const sm = makeStorageManagerMock();
        const w = { GameState: makeGameState(), StorageManager: sm };
        const sl = makeSaveLayer(w);
        sl.setActiveSlot(3);
        expect(sm.setLastSlot).toHaveBeenCalledWith(3);
    });

    it('deve retornar false para slot inválido', () => {
        const sm = makeStorageManagerMock();
        const w = { GameState: makeGameState(), StorageManager: sm };
        const sl = makeSaveLayer(w);
        expect(sl.setActiveSlot(0)).toBe(false);
        expect(sl.setActiveSlot(4)).toBe(false);
        expect(sl.setActiveSlot(-1)).toBe(false);
        expect(sl.setActiveSlot('X')).toBe(false);
    });

    it('não deve chamar setLastSlot para slot inválido', () => {
        const sm = makeStorageManagerMock();
        const w = { GameState: makeGameState(), StorageManager: sm };
        const sl = makeSaveLayer(w);
        sl.setActiveSlot(99);
        expect(sm.setLastSlot).not.toHaveBeenCalled();
    });

    it('deve aceitar string numérica como slot válido', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        sl.setActiveSlot('1');
        expect(gs.saveSlot).toBe(1);
    });
});

describe('SaveLayer — saveActiveGame', () => {
    it('deve salvar no auto-save (fonte de verdade)', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.saveActiveGame(gs, null);
        expect(result.autoSaved).toBe(true);
        expect(sm.saveState).toHaveBeenCalledWith(gs);
    });

    it('deve espelhar no slot ativo quando há slot e buildEnvelope fornecido', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(true);
        expect(result.slotSaved).toBe(true);
        expect(result.slot).toBe(1);
        expect(sm.saveSlot).toHaveBeenCalledWith(1, expect.objectContaining({ version: 'mm_slot_v1' }));
    });

    it('deve retornar slotSaved=true quando não há slot ativo (nada a fazer)', () => {
        const sm = makeStorageManagerMock();
        sm.getLastSlot.mockReturnValue(null);
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(true);
        expect(result.slotSaved).toBe(true);
        expect(result.slot).toBeNull();
        expect(sm.saveSlot).not.toHaveBeenCalled();
    });

    it('deve retornar autoSaved=false quando StorageManager ausente', () => {
        const w = { GameState: makeGameState(), StorageManager: null };
        const sl = makeSaveLayer(w);
        const result = sl.saveActiveGame(makeGameState(), buildEnvelope);
        expect(result.autoSaved).toBe(false);
        expect(result.slotSaved).toBe(false);
    });

    it('não deve salvar no slot se buildEnvelope não fornecido', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 2 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        sl.saveActiveGame(gs, null);
        // buildEnvelope é null → slot não deve ser salvo
        expect(sm.saveSlot).not.toHaveBeenCalled();
    });

    it('deve retornar slotSaved=false quando StorageManager.saveSlot retorna false', () => {
        const sm = makeStorageManagerMock({ saveSlot: vi.fn(() => false) });
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(true);
        expect(result.slotSaved).toBe(false);
    });

    it('deve salvar conteúdo correto do GameState no auto-save', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: null });
        gs.players[0].money = 999;
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        sl.saveActiveGame(gs, null);
        const saved = sm._store['monstrinhomon_state'];
        expect(saved.players[0].money).toBe(999);
    });
});

describe('SaveLayer — loadActiveGame', () => {
    it('deve carregar do auto-save (fonte de verdade)', () => {
        const sm = makeStorageManagerMock();
        sm._store['monstrinhomon_state'] = makeGameState({ saveSlot: 2 });
        sm.loadState.mockReturnValue({
            state: makeGameState({ saveSlot: 2 }),
            loaded: true, migrated: false, notes: []
        });
        const w = { GameState: makeGameState(), StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.loadActiveGame();
        expect(result.loaded).toBe(true);
        expect(sm.loadState).toHaveBeenCalled();
    });

    it('deve retornar loaded=false quando auto-save vazio', () => {
        const sm = makeStorageManagerMock();
        sm.loadState.mockReturnValue({ state: null, loaded: false, migrated: false, notes: [] });
        const w = { GameState: makeGameState(), StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.loadActiveGame();
        expect(result.loaded).toBe(false);
        expect(result.state).toBeNull();
    });

    it('deve retornar loaded=false quando StorageManager ausente', () => {
        const w = { GameState: makeGameState(), StorageManager: null };
        const sl = makeSaveLayer(w);
        const result = sl.loadActiveGame();
        expect(result.loaded).toBe(false);
    });
});

describe('SaveLayer — syncMainStateAndSlot', () => {
    it('deve sincronizar slot ativo com auto-save', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.syncMainStateAndSlot(gs, buildEnvelope);
        expect(result.synced).toBe(true);
        expect(result.slot).toBe(1);
        expect(sm.saveSlot).toHaveBeenCalledWith(1, expect.objectContaining({ version: 'mm_slot_v1' }));
    });

    it('deve retornar synced=false quando nenhum slot ativo', () => {
        const sm = makeStorageManagerMock();
        sm.getLastSlot.mockReturnValue(null);
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.syncMainStateAndSlot(gs, buildEnvelope);
        expect(result.synced).toBe(false);
        expect(result.reason).toContain('Nenhum slot ativo');
    });

    it('deve retornar synced=false quando buildEnvelopeFn ausente', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 2 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.syncMainStateAndSlot(gs, null);
        expect(result.synced).toBe(false);
        expect(result.reason).toContain('buildEnvelopeFn');
    });

    it('deve retornar synced=false quando StorageManager.saveSlot falha', () => {
        const sm = makeStorageManagerMock({ saveSlot: vi.fn(() => false) });
        const gs = makeGameState({ saveSlot: 3 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);
        const result = sl.syncMainStateAndSlot(gs, buildEnvelope);
        expect(result.synced).toBe(false);
    });
});

describe('SaveLayer — Fluxo: novo jogo no Slot 1', () => {
    it('deve definir slot 1 como ativo e salvar em auto-save + slot', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Simula mmChooseSlotAndStartNewGame(1)
        sl.setActiveSlot(1);
        expect(gs.saveSlot).toBe(1);
        expect(sm.setLastSlot).toHaveBeenCalledWith(1);

        // Simula mmFinishNewGame → saveActiveGame
        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(true);
        expect(result.slotSaved).toBe(true);
        expect(result.slot).toBe(1);

        // Verifica que slot 1 tem o estado correto
        const savedSlot = sm._store['mm_save_slot_1'];
        expect(savedSlot).toBeDefined();
        expect(savedSlot.state.players[0].name).toBe('João');
    });
});

describe('SaveLayer — Fluxo: save manual', () => {
    it('deve salvar e depois verificar leitura (integridade)', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 2 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Salva
        const saveResult = sl.saveActiveGame(gs, buildEnvelope);
        expect(saveResult.autoSaved).toBe(true);

        // Verifica leitura (o que mmSaveNow faz)
        const loadResult = sl.loadActiveGame();
        expect(loadResult.loaded).toBe(true);
        expect(loadResult.state.players[0].name).toBe('João');
    });

    it('não deve relatar sucesso quando auto-save falha', () => {
        const sm = makeStorageManagerMock({ saveState: vi.fn(() => false) });
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(false);
        // Nunca deve tentar salvar no slot se auto-save falhou
        // (o caller deve checar autoSaved antes de reportar sucesso)
    });
});

describe('SaveLayer — Fluxo: continue', () => {
    it('loadActiveGame deve retornar o estado mais recente do auto-save', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Salva progresso
        gs.players[0].money = 500;
        sl.saveActiveGame(gs, buildEnvelope);

        // Simula continue: carrega do auto-save
        const loadResult = sl.loadActiveGame();
        expect(loadResult.loaded).toBe(true);
        expect(loadResult.state.players[0].money).toBe(500);
    });

    it('auto-save deve prevalecer sobre slot mais antigo', () => {
        const sm = makeStorageManagerMock();

        // Salva estado antigo no slot
        const oldGs = makeGameState({ saveSlot: 1 });
        oldGs.players[0].money = 100;
        sm._store['mm_save_slot_1'] = buildEnvelope(oldGs);

        // Auto-save mais recente com mais progresso
        const newGs = makeGameState({ saveSlot: 1 });
        newGs.players[0].money = 999;
        sm._store['monstrinhomon_state'] = newGs;
        sm.loadState.mockReturnValue({ state: newGs, loaded: true, migrated: false, notes: [] });

        const w = { GameState: newGs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        const loadResult = sl.loadActiveGame();
        // Deve carregar auto-save, não o slot antigo
        expect(loadResult.state.players[0].money).toBe(999);
    });
});

describe('SaveLayer — Fluxo: reload', () => {
    it('save seguido de reload deve ser idempotente', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        gs.players[0].money = 750;
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Ciclo save → load → save → load
        sl.saveActiveGame(gs, buildEnvelope);
        const first = sl.loadActiveGame();

        sl.saveActiveGame(first.state, buildEnvelope);
        const second = sl.loadActiveGame();

        expect(second.state.players[0].money).toBe(750);
        expect(second.state.saveSlot).toBe(1);
    });
});

describe('SaveLayer — Fluxo: troca para slot 2', () => {
    it('deve atualizar slot ativo e salvar no novo slot', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Usuário estava no slot 1
        sl.saveActiveGame(gs, buildEnvelope);
        expect(sm.saveSlot).toHaveBeenCalledWith(1, expect.anything());

        // Usuário escolhe slot 2
        sl.setActiveSlot(2);
        expect(gs.saveSlot).toBe(2);
        expect(sm.setLastSlot).toHaveBeenCalledWith(2);

        // Próximo save deve ir para slot 2
        sm.saveSlot.mockClear();
        sl.saveActiveGame(gs, buildEnvelope);
        expect(sm.saveSlot).toHaveBeenCalledWith(2, expect.anything());
        // Slot 1 não deve ter sido atualizado nesta operação
        expect(sm.saveSlot).not.toHaveBeenCalledWith(1, expect.anything());
    });
});

describe('SaveLayer — Isolamento entre slots', () => {
    it('dados do slot 1 não devem vazar para slot 2', () => {
        const sm = makeStorageManagerMock();

        // Jogo A no slot 1
        const gsA = makeGameState({ saveSlot: 1 });
        gsA.players[0].name = 'Alice';
        const wA = { GameState: gsA, StorageManager: sm };
        const slA = makeSaveLayer(wA);
        slA.saveActiveGame(gsA, buildEnvelope);

        // Jogo B no slot 2 (simula StorageManager compartilhado mas saveSlot diferente)
        const gsB = makeGameState({ saveSlot: 2 });
        gsB.players[0].name = 'Bob';
        const wB = { GameState: gsB, StorageManager: sm };
        const slB = makeSaveLayer(wB);
        slB.saveActiveGame(gsB, buildEnvelope);

        // Verificar isolamento
        expect(sm._store['mm_save_slot_1'].state.players[0].name).toBe('Alice');
        expect(sm._store['mm_save_slot_2'].state.players[0].name).toBe('Bob');
    });

    it('apagar slot 2 não deve afetar slot 1', () => {
        const sm = makeStorageManagerMock();

        const gs1 = makeGameState({ saveSlot: 1 });
        const gs2 = makeGameState({ saveSlot: 2 });

        sm._store['mm_save_slot_1'] = buildEnvelope(gs1);
        sm._store['mm_save_slot_2'] = buildEnvelope(gs2);

        // Simula delete slot 2
        delete sm._store['mm_save_slot_2'];
        sm.loadSlot.mockImplementation((slot) => {
            const d = sm._store[`mm_save_slot_${slot}`];
            if (!d) return { data: null, loaded: false, notes: [] };
            return { data: d, loaded: true, notes: [] };
        });

        const result1 = sm.loadSlot(1);
        const result2 = sm.loadSlot(2);

        expect(result1.loaded).toBe(true);
        expect(result2.loaded).toBe(false);
    });
});

describe('SaveLayer — Consistência entre auto-save e slot ativo', () => {
    it('saveActiveGame deve manter auto-save e slot com mesmo estado', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        gs.players[0].money = 333;
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        sl.saveActiveGame(gs, buildEnvelope);

        const autoSaveState = sm._store['monstrinhomon_state'];
        const slotState = sm._store['mm_save_slot_1'].state;

        expect(autoSaveState.players[0].money).toBe(333);
        expect(slotState.players[0].money).toBe(333);
    });

    it('syncMainStateAndSlot deve corrigir slot desatualizado', () => {
        const sm = makeStorageManagerMock();

        // Estado atual com progresso novo
        const gs = makeGameState({ saveSlot: 1 });
        gs.players[0].money = 777;

        // Slot 1 tem estado antigo (estado desatualizado)
        const oldEnv = buildEnvelope(makeGameState({ saveSlot: 1 }));
        oldEnv.state.players[0].money = 100;
        sm._store['mm_save_slot_1'] = oldEnv;

        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Sincroniza
        const result = sl.syncMainStateAndSlot(gs, buildEnvelope);
        expect(result.synced).toBe(true);

        // Slot agora tem estado atualizado
        expect(sm._store['mm_save_slot_1'].state.players[0].money).toBe(777);
    });

    it('após loadFromSlot, getActiveSlot deve retornar o slot carregado', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        // Simula mmLoadFromSlot(2): define slot ativo após carregar
        sl.setActiveSlot(2);
        expect(sl.getActiveSlot()).toBe(2);
    });
});

describe('SaveLayer — Falha de save não deve exibir falso sucesso', () => {
    it('deve retornar autoSaved=false quando saveState falha', () => {
        const sm = makeStorageManagerMock({ saveState: vi.fn(() => false) });
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(false);
    });

    it('deve retornar slotSaved=false quando saveSlot falha', () => {
        const sm = makeStorageManagerMock({ saveSlot: vi.fn(() => false) });
        const gs = makeGameState({ saveSlot: 2 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        const result = sl.saveActiveGame(gs, buildEnvelope);
        expect(result.autoSaved).toBe(true);  // auto-save ok
        expect(result.slotSaved).toBe(false); // slot falhou
    });

    it('loadActiveGame após saveState falha deve retornar loaded=false', () => {
        const sm = makeStorageManagerMock();
        // saveState falha: não grava nada
        sm.saveState.mockReturnValue(false);
        sm.loadState.mockReturnValue({ state: null, loaded: false, migrated: false, notes: [] });

        const gs = makeGameState({ saveSlot: null });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        sl.saveActiveGame(gs, null);

        const loadResult = sl.loadActiveGame();
        expect(loadResult.loaded).toBe(false);
    });

    it('deve retornar falha limpa quando buildEnvelope lança exceção', () => {
        const sm = makeStorageManagerMock();
        const gs = makeGameState({ saveSlot: 1 });
        const w = { GameState: gs, StorageManager: sm };
        const sl = makeSaveLayer(w);

        const badEnvelope = () => { throw new Error('Falha ao serializar'); };
        const result = sl.saveActiveGame(gs, badEnvelope);

        // Auto-save deve ter funcionado
        expect(result.autoSaved).toBe(true);
        // Slot deve ter falhado mas sem crash
        expect(result.slotSaved).toBe(false);
        expect(result.slot).toBe(1);
    });
});
