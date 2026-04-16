/**
 * COMBAT MODULE - API Pública
 *
 * Exporta todas as funções de combate organizadas por categoria.
 *
 * ── PIPELINE CANÔNICO ────────────────────────────────────────────────────
 * Combat.Wild.Core    → wildCore.js    (funções puras, d20, captura, fuga)
 * Combat.Wild.Actions → wildActions.js (loop 1v1)
 * Combat.Wild.UI      → wildUI.js      (renderização wild)
 *
 * Combat.Group.Core    → groupCore.js    (funções puras, createGroupEncounter)
 * Combat.Group.Actions → groupActions.js (loop + ações de combate)
 * Combat.Group.UI      → groupUI.js      (renderização grupo/boss)
 * Combat.Group.Rewards → groupRewards.js (recompensas pós-batalha)
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
    },
    // Boss reutiliza Group (não precisa de módulo separado)
    // Boss é apenas uma variação de grupo (encounterType diferente)
    Boss: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI,
        Rewards: GroupRewards,
    },
    // PR11B: Item Breakage System
    ItemBreakage: ItemBreakage,
    // PR-02: Contratos internos de combate (eventos canônicos)
    CombatEvents: CombatEvents,
};

export default Combat;
