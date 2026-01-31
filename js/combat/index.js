/**
 * COMBAT MODULE - API Pública
 * 
 * Exporta todas as funções de combate organizadas por categoria
 * 
 * PR4: Wild 1v1 combat (implementado)
 * PR5A: Group/Boss combat (stubs apenas - implementação em PR futuro)
 */

import * as WildCore from './wildCore.js';
import * as WildActions from './wildActions.js';
import * as WildUI from './wildUI.js';
import * as GroupCore from './groupCore.js';
import * as GroupActions from './groupActions.js';
import * as GroupUI from './groupUI.js';

export const Combat = {
    Wild: {
        Core: WildCore,
        Actions: WildActions,
        UI: WildUI
    },
    Group: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI
    },
    // Boss reutiliza Group (não precisa de módulo separado)
    // Boss é apenas uma variação de grupo (encounterType diferente)
    Boss: {
        Core: GroupCore,
        Actions: GroupActions,
        UI: GroupUI
    }
};

export default Combat;
