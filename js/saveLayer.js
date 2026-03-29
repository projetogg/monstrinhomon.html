/**
 * SaveLayer - Camada canônica de save/load para Monstrinhomon
 *
 * ═══════════════════════════════════════════════════════════════════
 * ARQUITETURA: monstrinhomon_state é a ÚNICA fonte de verdade
 * ═══════════════════════════════════════════════════════════════════
 *
 * - `monstrinhomon_state` (auto-save): fonte de verdade da sessão atual.
 *   Todo o progresso ao longo do jogo é gravado aqui continuamente.
 *
 * - `mm_save_slot_N` (slots): snapshots manuais do estado principal.
 *   São cópias pontuais — NÃO acompanham o auto-save em tempo real.
 *   Usar um slot não cria uma segunda sessão viva.
 *
 * ═══════════════════════════════════════════════════════════════════
 * O QUE É O "SLOT ATIVO"
 * ═══════════════════════════════════════════════════════════════════
 *
 * O "slot ativo" (GameState.saveSlot / lastSlot) é APENAS um metadado
 * operacional: indica qual slot manual o usuário selecionou como
 * destino de snapshots. NÃO indica a fonte da sessão atual.
 *
 * Em outras palavras:
 *   - slot ativo = slot preferido para salvar snapshot manual
 *   - slot ativo ≠ fonte de progresso atual
 *
 * A sessão atual é sempre lida de `monstrinhomon_state`.
 * Um slot pode estar ausente, desatualizado ou diferente do auto-save
 * — isso é normal e esperado.
 *
 * ═══════════════════════════════════════════════════════════════════
 * FLUXOS CORRETOS
 * ═══════════════════════════════════════════════════════════════════
 *
 * Continue:     lê monstrinhomon_state (auto-save). Nunca lê slot diretamente.
 * Load Slot:    restaura snapshot do slot → grava em monstrinhomon_state
 *               → atualiza associação operacional do slot.
 * Save Manual:  grava monstrinhomon_state (auto-save) + cria snapshot no slot ativo.
 * Troca de slot: apenas atualiza metadado operacional. Não altera auto-save.
 *
 * ═══════════════════════════════════════════════════════════════════
 * REGRA: nenhuma tela deve chamar StorageManager.saveState() ou
 * StorageManager.saveSlot() diretamente fora desta camada, salvo
 * exceção explicitamente documentada.
 * ═══════════════════════════════════════════════════════════════════
 *
 * API pública:
 *   SaveLayer.getActiveSlot()                        → slot manual associado (metadado) ou null
 *   SaveLayer.setActiveSlot(slot)                    → define o slot manual associado
 *   SaveLayer.saveActiveGame(gameState, buildEnv)    → auto-save + snapshot no slot associado
 *   SaveLayer.loadActiveGame()                       → carrega do auto-save (fonte de verdade)
 *   SaveLayer.syncMainStateAndSlot(gameState, bEnv)  → força snapshot do slot a espelhar auto-save
 */

const SaveLayer = (() => {
    'use strict';

    // ─── Dependências externas ────────────────────────────────────────────────
    // StorageManager deve estar carregado antes deste módulo (ver index.html script order).
    // GameState deve estar disponível em window.GameState no contexto do browser.

    /**
     * Retorna o slot manual associado à sessão atual (metadado operacional).
     * Prioridade: GameState.saveSlot > StorageManager.getLastSlot() > null
     *
     * ATENÇÃO: este valor indica o slot preferido para snapshots manuais.
     * NÃO indica de onde a sessão atual foi carregada.
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
     * Define o slot manual associado (metadado operacional).
     * Registra o slot em GameState.saveSlot e StorageManager.lastSlot de forma
     * centralizada, garantindo consistência entre as duas referências.
     *
     * ATENÇÃO: esta operação NÃO altera o auto-save nem a sessão atual.
     * Apenas indica qual slot receberá o próximo snapshot manual.
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

            console.log('[SaveLayer] Slot manual associado definido:', n);
            return true;
        } catch (e) {
            console.error('[SaveLayer] setActiveSlot falhou:', e);
            return false;
        }
    }

    /**
     * Salva o jogo via camada canônica:
     * 1. Grava auto-save (monstrinhomon_state) — fonte de verdade da sessão
     * 2. Se há slot manual associado E buildEnvelopeFn fornecido, grava snapshot no slot
     *
     * Falha no snapshot do slot NÃO invalida o auto-save.
     * O resultado indica cada operação separadamente.
     *
     * @param {object} gameState - Estado do jogo a salvar
     * @param {function} [buildEnvelopeFn] - Função que constrói o envelope do slot (opcional)
     * @returns {{ autoSaved: boolean, slotSaved: boolean, slot: number|null }}
     */
    function saveActiveGame(gameState, buildEnvelopeFn) {
        // Etapa 1: auto-save (fonte de verdade) — deve ser bem-sucedido antes de qualquer snapshot
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

        // Se o auto-save falhou, não gravar snapshot — estado pode estar inconsistente
        if (!autoSaved) {
            console.error('[SaveLayer] saveActiveGame: auto-save falhou; snapshot de slot cancelado');
            return { autoSaved: false, slotSaved: false, slot: null };
        }

        // Etapa 2: snapshot no slot manual associado (se houver)
        const slot = getActiveSlot();
        let slotSaved = true; // default true se não há slot associado (nada a fazer)

        if (slot && typeof buildEnvelopeFn === 'function') {
            slotSaved = false;
            try {
                const envelope = buildEnvelopeFn(gameState);
                const sm = (typeof window !== 'undefined') ? window.StorageManager : null;
                if (sm) slotSaved = sm.saveSlot(slot, envelope);
                else console.error('[SaveLayer] saveActiveGame: StorageManager ausente para snapshot do slot');
            } catch (e) {
                console.error('[SaveLayer] saveActiveGame: falha ao gravar snapshot no slot', slot, e);
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
     * Grava snapshot do slot manual associado com o estado atual do auto-save.
     * Útil para manter o slot sincronizado após saves frequentes do auto-save.
     *
     * NOTA: esta função só atualiza o snapshot do slot. Não altera o auto-save.
     * O slot pode ficar desatualizado entre saves manuais — isso é intencional.
     *
     * @param {object} gameState - Estado atual do jogo
     * @param {function} buildEnvelopeFn - Função que constrói o envelope
     * @returns {{ synced: boolean, slot: number|null, reason: string|null }}
     */
    function syncMainStateAndSlot(gameState, buildEnvelopeFn) {
        const slot = getActiveSlot();
        if (!slot) {
            return { synced: false, slot: null, reason: 'Nenhum slot manual associado' };
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
                console.log('[SaveLayer] Snapshot do slot', slot, 'atualizado com estado atual.');
            }
            return { synced: ok, slot, reason: ok ? null : 'Falha ao gravar snapshot; verifique armazenamento' };
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
