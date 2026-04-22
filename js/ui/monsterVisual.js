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
 */export function monsterArtHTML(template, opts = {}) {
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
 * Resolve e retorna HTML de arte a partir de uma instância de Monstrinho.
 *
 * REGRA: `image` não é persistida na instância — é derivada do template via `templateId`.
 * Compatibilidade reversa: se o template não for encontrado (ex.: instância legada),
 * usa `instance.image` se presente, ou emoji como último recurso.
 *
 * @param {Object} instance - Instância de Monstrinho (com templateId ou monsterId)
 * @param {Map|Array|null} catalog - Catálogo de templates (Map<id,template> ou Array)
 * @param {Object} [opts] - Mesmas opções de monsterArtHTML
 * @returns {string} HTML string
 */
export function resolveArtFromInstance(instance, catalog, opts = {}) {
    if (!instance) return '';

    // 1. Deriva template do catálogo pelo templateId
    const tid = instance.templateId || instance.monsterId;
    let template = null;
    if (tid && catalog) {
        if (catalog instanceof Map) {
            template = catalog.get(tid) || null;
        } else if (Array.isArray(catalog)) {
            template = catalog.find(t => t.id === tid) || null;
        }
    }

    if (template) {
        return monsterArtHTML(template, opts);
    }

    // 2. Compatibilidade reversa: instância carregada com image (save legado)
    if (instance.image) {
        const { imgClass = 'monster-art-img', alt = instance.name || 'Monstrinho' } = opts;
        return `<img src="${escapeAttr(instance.image)}" alt="${escapeAttr(alt)}" class="${escapeAttr(imgClass)}" draggable="false">`;
    }

    // 3. Fallback final: emoji
    const { emojiClass = 'monster-art-emoji', alt = instance.name || 'Monstrinho' } = opts;
    return `<span class="${escapeAttr(emojiClass)}" aria-label="${escapeAttr(alt)}">${instance.emoji || '👾'}</span>`;
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

// Exporta funções globalmente para uso no browser via window.
// Necessário porque index.html carrega scripts via <script type="module"> mas também
// usa scripts não-módulo que acessam helpers diretamente pelo window.
// O padrão ES module (import/export) é usado para os testes e outros módulos JS.
if (typeof window !== 'undefined') {
    window.MonsterVisual = { monsterArtHTML, hasImage, resolveArtFromInstance };
}
