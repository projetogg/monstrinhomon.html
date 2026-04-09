/**
 * COMBAT MODULE - API Pública
 * 
 * Exporta todas as funções de combate organizadas por categoria
 * 
 * PR4: Wild 1v1 combat (implementado)
 * PR5A: Group/Boss combat (stubs apenas - implementação em PR futuro)
 * PR##: GroupBattleState v1.0 (estrutura completa)
 * PASSO 3: GroupBattleLoop v1.0 (loop de batalha)
 *
 * ── PIPELINE CANÔNICO ────────────────────────────────────────────────────
 * Combat.Group.Core    → groupCore.js    (funções puras, createGroupEncounter)
 * Combat.Group.Actions → groupActions.js (loop + ações de combate)
 * Combat.Group.UI      → groupUI.js      (renderização)
 *
 * Combat.Group.BattleState / BattleLoop → DEPRECATED (protótipos não usados)
 *   Não usam o estado real (GameState.currentEncounter). Mantidos apenas
 *   por compatibilidade. NÃO adicionar novas funcionalidades neles.
 * ─────────────────────────────────────────────────────────────────────────
 */

import * as WildCore from './wildCore.js';
import * as WildActions from './wildActions.js';
import * as WildUI from './wildUI.js';
import * as GroupCore from './groupCore.js';
import * as GroupActions from './groupActions.js';
import * as GroupUI from './groupUI.js';
import * as GroupIntegration from './groupIntegration.js';
import * as ItemBreakage from './itemBreakage.js';
import * as GroupBattleState from './groupBattleState.js';
import * as GroupBattleLoop from './groupBattleLoop.js';
import * as GroupRewards from './groupRewards.js';
import * as CombatEvents from './combatEvents.js';

export const Combat = {
    Wild: {
        Core: WildCore,
        Actions: WildActions,
        UI: WildUI
    },
    Group: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI,
        Rewards: GroupRewards,
        Integration: GroupIntegration,
        BattleState: GroupBattleState,
        BattleLoop: GroupBattleLoop
    },
    // Boss reutiliza Group (não precisa de módulo separado)
    // Boss é apenas uma variação de grupo (encounterType diferente)
    Boss: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI,
        Rewards: GroupRewards,
        BattleState: GroupBattleState,
        BattleLoop: GroupBattleLoop
    },
    // PR11B: Item Breakage System
    ItemBreakage: ItemBreakage,
    // PR-02: Contratos internos de combate (eventos canônicos)
    CombatEvents: CombatEvents,
};

export default Combat;
