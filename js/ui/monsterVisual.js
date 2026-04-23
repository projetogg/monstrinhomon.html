/**
 * monsterVisual.js — Helper canônico de render visual de monstrinhos
 *
 * Este módulo é a ÚNICA base autorizada para gerar HTML visual de monstrinho.
 * Toda UI que precisar exibir um monstrinho deve usar este helper.
 *
 * Regras:
 *  - se monster.image existir → gerar <img>
 *  - senão → gerar <span> com emoji (fallback)
 *  - sempre incluir alt/aria-label com o nome do monstrinho
 *  - não acessar DOM diretamente
 *  - não mutar o objeto de entrada
 *
 * Uso:
 *   import { getMonsterVisualHTML } from './monsterVisual.js';
 *   elemento.innerHTML = getMonsterVisualHTML(monster, { size: 'md', variant: 'dex' });
 *
 * Variantes suportadas (variant):
 *  - 'dex'       → card da Monstrodex (120px, fundo suave, moldura)
 *  - 'box'       → card de equipe/caixa (64px, fundo neutro, borda fina)
 *  - 'battle'    → card de combate (80px, integrado ao dark theme)
 *  - 'inline'    → miniatura inline junto a texto (28px)
 *  - 'silhouette'→ ativa silhouette automaticamente (açúcar sintático)
 */

/**
 * Tamanhos de exibição suportados.
 * @type {string[]}
 */
const VALID_SIZES = ['sm', 'md', 'lg'];

/**
 * Tamanho padrão quando não especificado.
 * @type {string}
 */
const DEFAULT_SIZE = 'md';

/**
 * Variantes contextuais suportadas.
 * @type {string[]}
 */
const VALID_VARIANTS = ['dex', 'box', 'battle', 'inline', 'silhouette'];

/**
 * Retorna os dados visuais de um monstrinho: qual tipo de render usar e os valores.
 *
 * @param {Object} monster - Objeto do monstrinho (do catálogo ou instância)
 * @param {string} [monster.name] - Nome do monstrinho
 * @param {string} [monster.emoji] - Emoji fallback
 * @param {string} [monster.image] - Path do asset de imagem (opcional)
 * @returns {{ type: 'image'|'emoji', src: string|null, emoji: string|null, name: string }}
 */
export function getMonsterVisualData(monster) {
    if (!monster || typeof monster !== 'object') {
        return { type: 'emoji', src: null, emoji: '❓', name: 'Desconhecido' };
    }

    const name = monster.name || 'Monstrinho';
    const emoji = monster.emoji || '❓';

    if (monster.image && typeof monster.image === 'string' && monster.image.trim() !== '') {
        return { type: 'image', src: monster.image.trim(), emoji, name };
    }

    return { type: 'emoji', src: null, emoji, name };
}

/**
 * Gera o HTML de exibição visual de um monstrinho.
 *
 * @param {Object} monster - Objeto do monstrinho (do catálogo ou instância)
 * @param {Object} [options={}] - Opções de renderização
 * @param {'sm'|'md'|'lg'} [options.size='md'] - Tamanho do visual
 * @param {boolean} [options.silhouette=false] - Aplicar efeito de silhueta
 * @param {'dex'|'box'|'battle'|'inline'|'silhouette'} [options.variant] - Variante contextual
 * @param {string} [options.extraClass=''] - Classes CSS adicionais
 * @returns {string} HTML pronto para inserção via innerHTML
 */
export function getMonsterVisualHTML(monster, options = {}) {
    const size = VALID_SIZES.includes(options.size) ? options.size : DEFAULT_SIZE;
    const variant = VALID_VARIANTS.includes(options.variant) ? options.variant : null;
    // variant 'silhouette' ativa silhouette automaticamente (açúcar sintático)
    const silhouette = options.silhouette === true || variant === 'silhouette';
    const extraClass = (options.extraClass && typeof options.extraClass === 'string')
        ? ' ' + options.extraClass.trim()
        : '';

    const visual = getMonsterVisualData(monster);

    const sizeClass = `monster-visual--${size}`;
    const variantClass = variant ? ` monster-visual--variant-${variant}` : '';
    const silhouetteClass = silhouette ? ' monster-silhouette' : '';
    const baseClasses = `monster-visual ${sizeClass}${variantClass}${silhouetteClass}${extraClass}`;

    if (visual.type === 'image') {
        return `<img class="${baseClasses}" src="${_escapeAttr(visual.src)}" alt="${_escapeAttr(visual.name)}">`;
    }

    return `<span class="${baseClasses} monster-emoji" aria-label="${_escapeAttr(visual.name)}">${visual.emoji}</span>`;
}

/**
 * Escapa caracteres especiais para uso seguro em atributos HTML.
 * Função interna — não exportar.
 *
 * @param {string} str
 * @returns {string}
 */
function _escapeAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
