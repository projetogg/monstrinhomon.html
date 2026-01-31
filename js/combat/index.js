/**
 * COMBAT MODULE - API Pública
 * 
 * Exporta todas as funções de combate organizadas por categoria
 */

import * as WildCore from './wildCore.js';
import * as WildActions from './wildActions.js';
import * as WildUI from './wildUI.js';

export const Combat = {
    Core: WildCore,
    Actions: WildActions,
    UI: WildUI
};

export default Combat;
