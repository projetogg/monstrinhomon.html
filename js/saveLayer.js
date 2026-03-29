/**
 * SaveLayer - Camada canônica de save/load para Monstrinhomon
 *
 * ARQUITETURA: auto-save (monstrinhomon_state) é a fonte de verdade.
 * Slots são snapshots manuais que espelham o auto-save quando o
 * jogo é salvo via saveActiveGame().
 *
 * REGRA: nenhuma tela deve chamar StorageManager.saveState() ou
 * StorageManager.saveSlot() diretamente fora desta camada, salvo
 * exceção explicitamente documentada.
 *
 * API pública:
 *   SaveLayer.getActiveSlot()                        → número do slot ativo ou null
 *   SaveLayer.setActiveSlot(slot)                    → atualiza GameState.saveSlot + StorageManager
 *   SaveLayer.saveActiveGame(gameState, buildEnv)    → salva auto-save + espelha no slot ativo
 *   SaveLayer.loadActiveGame()                       → carrega do auto-save (fonte de verdade)
 *   SaveLayer.syncMainStateAndSlot(gameState, bEnv)  → força slot ativo a espelhar auto-save
 */

const SaveLayer = (() => {
    'use strict';

    // ─── Dependências externas ────────────────────────────────────────────────
    // StorageManager deve estar carregado antes deste módulo (ver index.html script order).
    // GameState deve estar disponível em window.GameState no contexto do browser.

    /**
     * Retorna o slot ativo atual.
     * Prioridade: GameState.saveSlot > StorageManager.getLastSlot() > null
     * @returns {number|null}
     */
    function getActiveSlot() {
        try {
            const gs = (typeof window !== 'undefined') ? window.GameState : null;
            const fromState = gs && gs.saveSlot;
            if (fromState && [1, 2, 3].includes(Number(fromState))) {
                return Number(fromState);
            }
            const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
            if (sm) return sm.getLastSlot();
        } catch (e) {
            console.error('[SaveLayer] getActiveSlot falhou:', e);
        }
        return null;
    }

    /**
     * Define o slot ativo.
     * Atualiza GameState.saveSlot E StorageManager.setLastSlot para manter consistência.
     * @param {number} slot - Slot válido: 1, 2 ou 3
     * @returns {boolean} true se bem-sucedido
     */
    function setActiveSlot(slot) {
        const n = Number(slot);
        if (![1, 2, 3].includes(n)) {
            console.error('[SaveLayer] setActiveSlot: slot inválido:', slot);
            return false;
        }
        try {
            const gs = (typeof window !== 'undefined') ? window.GameState : null;
            if (gs) gs.saveSlot = n;

            const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
            if (sm) sm.setLastSlot(n);

            console.log('[SaveLayer] Slot ativo definido:', n);
            return true;
        } catch (e) {
            console.error('[SaveLayer] setActiveSlot falhou:', e);
            return false;
        }
    }

    /**
     * Salva o jogo via camada canônica:
     * 1. Salva auto-save (monstrinhomon_state) — fonte de verdade
     * 2. Se há slot ativo, espelha o estado no slot (snapshot)
     *
     * @param {object} gameState - Estado do jogo a salvar
     * @param {function} [buildEnvelopeFn] - Função que constrói o envelope do slot (opcional)
     * @returns {{ autoSaved: boolean, slotSaved: boolean, slot: number|null }}
     */
    function saveActiveGame(gameState, buildEnvelopeFn) {
        // Etapa 1: auto-save (fonte de verdade)
        let autoSaved = false;
        try {
            const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
            if (!sm) {
                console.error('[SaveLayer] saveActiveGame: StorageManager não disponível');
                return { autoSaved: false, slotSaved: false, slot: null };
            }
            autoSaved = sm.saveState(gameState);
        } catch (e) {
            console.error('[SaveLayer] saveActiveGame: falha no auto-save:', e);
            return { autoSaved: false, slotSaved: false, slot: null };
        }

        // Etapa 2: espelhar no slot ativo (se houver)
        const slot = getActiveSlot();
        let slotSaved = true; // default true se não há slot ativo (nada a fazer)

        if (slot && typeof buildEnvelopeFn === 'function') {
            slotSaved = false;
            try {
                const envelope = buildEnvelopeFn(gameState);
                const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
                if (sm) slotSaved = sm.saveSlot(slot, envelope);
                else console.error('[SaveLayer] saveActiveGame: StorageManager ausente para slot');
            } catch (e) {
                console.error('[SaveLayer] saveActiveGame: falha ao espelhar no slot', slot, e);
            }
        }

        return { autoSaved, slotSaved, slot };
    }

    /**
     * Carrega o jogo do auto-save (fonte de verdade).
     * Nunca carrega diretamente de um slot (slots são snapshots).
     * @returns {{ state: object|null, loaded: boolean, migrated: boolean, notes: string[] }}
     */
    function loadActiveGame() {
        try {
            const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
            if (!sm) {
                console.error('[SaveLayer] loadActiveGame: StorageManager não disponível');
                return { state: null, loaded: false, migrated: false, notes: ['StorageManager ausente'] };
            }
            return sm.loadState();
        } catch (e) {
            console.error('[SaveLayer] loadActiveGame falhou:', e);
            return { state: null, loaded: false, migrated: false, notes: [e.message] };
        }
    }

    /**
     * Sincroniza o slot ativo com o auto-save atual.
     * Útil para garantir que o slot não fique desatualizado.
     *
     * @param {object} gameState - Estado atual do jogo
     * @param {function} buildEnvelopeFn - Função que constrói o envelope
     * @returns {{ synced: boolean, slot: number|null, reason: string|null }}
     */
    function syncMainStateAndSlot(gameState, buildEnvelopeFn) {
        const slot = getActiveSlot();
        if (!slot) {
            return { synced: false, slot: null, reason: 'Nenhum slot ativo definido' };
        }
        if (typeof buildEnvelopeFn !== 'function') {
            return { synced: false, slot, reason: 'buildEnvelopeFn ausente ou inválida' };
        }
        try {
            const envelope = buildEnvelopeFn(gameState);
            const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
            if (!sm) return { synced: false, slot, reason: 'StorageManager ausente' };

            const ok = sm.saveSlot(slot, envelope);
            if (ok) {
                console.log('[SaveLayer] Slot', slot, 'sincronizado com auto-save.');
            }
            return { synced: ok, slot, reason: ok ? null : 'StorageManager.saveSlot retornou false' };
        } catch (e) {
            console.error('[SaveLayer] syncMainStateAndSlot falhou:', e);
            return { synced: false, slot, reason: e.message };
        }
    }

    // ─── API pública ──────────────────────────────────────────────────────────
    return {
        getActiveSlot,
        setActiveSlot,
        saveActiveGame,
        loadActiveGame,
        syncMainStateAndSlot,
    };
})();

// Expõe globalmente
if (typeof window !== 'undefined') {
    window.SaveLayer = SaveLayer;
}
