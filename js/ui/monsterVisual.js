/**
 * monsterVisual.js — Helper de Visual dos Monstrinhos
 *
 * Funções utilitárias para renderizar a arte dos monstrinhos nas UIs.
 * Lógica centralizada para:
 *   - Usar <img> quando template.image está declarado
 *   - Fallback para emoji quando image não está presente
 *   - Silhueta (estado "seen") via CSS filter
 *
 * REGRAS:
 *   - Monstrinhos com `image` declarado usam <img> em todas as UIs
 *   - Monstrinhos sem `image` usam o emoji como fallback
 *   - A silhueta é aplicada via CSS (filter: brightness(0)) na classe pai
 *   - Não alterar lógica de jogo aqui — apenas apresentação
 */

/**
 * Retorna o HTML do elemento visual principal do monstrinho.
 * Usa <img> se template.image existir; senão, usa emoji em <span>.
 *
 * @param {Object} template - Template do monstrinho (do catalog)
 * @param {Object} [opts]
 * @param {string} [opts.imgClass] - Classe CSS para o <img>
 * @param {string} [opts.emojiClass] - Classe CSS para o <span> de emoji
 * @param {string} [opts.alt] - Texto alt para o <img>
 * @returns {string} HTML string
 */
export function monsterArtHTML(template, opts = {}) {
    if (!template) return '';

    const {
        imgClass   = 'monster-art-img',
        emojiClass = 'monster-art-emoji',
        alt        = template.name || 'Monstrinho',
    } = opts;

    if (template.image) {
        return `<img
            src="${escapeAttr(template.image)}"
            alt="${escapeAttr(alt)}"
            class="${escapeAttr(imgClass)}"
            draggable="false"
        >`;
    }

    return `<span class="${escapeAttr(emojiClass)}" aria-label="${escapeAttr(alt)}">${template.emoji || '👾'}</span>`;
}

/**
 * Retorna true se o template possui um asset de imagem declarado.
 * @param {Object} template
 * @returns {boolean}
 */
export function hasImage(template) {
    return !!(template && template.image);
}

/**
 * Escapa atributos HTML para evitar XSS em strings interpoladas.
 * @param {string} str
 * @returns {string}
 */
function escapeAttr(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Exporta para uso no browser via window global (index.html)
if (typeof window !== 'undefined') {
    window.MonsterVisual = { monsterArtHTML, hasImage };
}
