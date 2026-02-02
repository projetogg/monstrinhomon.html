/**
 * COMBAT MODULE - API Pública
 * 
 * Exporta todas as funções de combate organizadas por categoria
 * 
 * PR4: Wild 1v1 combat (implementado)
 * PR5A: Group/Boss combat (stubs apenas - implementação em PR futuro)
 * PR##: GroupBattleState v1.0 (estrutura completa)
 */

import * as WildCore from './wildCore.js';
import * as WildActions from './wildActions.js';
import * as WildUI from './wildUI.js';
import * as GroupCore from './groupCore.js';
import * as GroupActions from './groupActions.js';
import * as GroupUI from './groupUI.js';
import * as ItemBreakage from './itemBreakage.js';
import * as GroupBattleState from './groupBattleState.js';

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
        BattleState: GroupBattleState
    },
    // Boss reutiliza Group (não precisa de módulo separado)
    // Boss é apenas uma variação de grupo (encounterType diferente)
    Boss: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI,
        BattleState: GroupBattleState
    },
    // PR11B: Item Breakage System
    ItemBreakage: ItemBreakage
};

export default Combat;
