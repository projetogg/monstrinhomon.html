/**
 * BASIC CARDS CATALOG — MVP 0.4 / Issue 1
 *
 * Fonte única de verdade para cartas básicas (1 por classe).
 * Nesta etapa, runtimeAction é apenas declarativo (string), sem execução.
 */

const CARD_ID_REGEX = /^CARD_[A-Z0-9_]+$/;

export const BASIC_CARDS = [
    {
        id: 'CARD_GUERREIRO_GOLPE_FIRME',
        name: 'Golpe Firme',
        class: 'Guerreiro',
        cost: 1,
        type: 'attack',
        target: 'enemy',
        childText: 'Um golpe forte e seguro!',
        technicalEffect: 'Executa ataque básico com efeito previsível.',
        runtimeAction: 'basic_attack',
        mvp: true,
    },
    {
        id: 'CARD_MAGO_FAISCA_ARCANA',
        name: 'Faísca Arcana',
        class: 'Mago',
        cost: 1,
        type: 'attack',
        target: 'enemy',
        childText: 'Uma faísca brilhante no inimigo!',
        technicalEffect: 'Executa ataque básico com rotulagem arcana.',
        runtimeAction: 'basic_attack',
        mvp: true,
    },
    {
        id: 'CARD_CURANDEIRO_TOQUE_CALMO',
        name: 'Toque Calmo',
        class: 'Curandeiro',
        cost: 1,
        type: 'heal',
        target: 'self',
        childText: 'Um toque que acalma e recupera.',
        technicalEffect: 'Declara ação de cura básica sem ultrapassar HP máximo.',
        runtimeAction: 'basic_heal',
        mvp: true,
    },
    {
        id: 'CARD_BARBARO_ARRANQUE_BRUTO',
        name: 'Arranque Bruto',
        class: 'Bárbaro',
        cost: 2,
        type: 'attack',
        target: 'enemy',
        childText: 'Ataque com toda a coragem!',
        technicalEffect: 'Declara ataque básico com variante de potência.',
        runtimeAction: 'basic_attack_plus',
        mvp: true,
    },
    {
        id: 'CARD_LADINO_PASSO_RAPIDO',
        name: 'Passo Rápido',
        class: 'Ladino',
        cost: 1,
        type: 'utility',
        target: 'self',
        childText: 'Movimento rápido e esperto!',
        technicalEffect: 'Declara ação utilitária de agilidade para próximo passo.',
        runtimeAction: 'quick_step',
        mvp: true,
    },
    {
        id: 'CARD_BARDO_CANCAO_FOCO',
        name: 'Canção do Foco',
        class: 'Bardo',
        cost: 1,
        type: 'support',
        target: 'self',
        childText: 'Uma canção para jogar melhor!',
        technicalEffect: 'Declara buff de foco sem empilhamento nesta etapa.',
        runtimeAction: 'focus_song',
        mvp: true,
    },
    {
        id: 'CARD_CACADOR_MIRA_CUIDADOSA',
        name: 'Mira Cuidadosa',
        class: 'Caçador',
        cost: 1,
        type: 'attack',
        target: 'enemy',
        childText: 'Respira fundo e acerta o alvo!',
        technicalEffect: 'Declara ataque com intenção de precisão.',
        runtimeAction: 'aimed_attack',
        mvp: true,
    },
    {
        id: 'CARD_ANIMALISTA_LACO_AMIGO',
        name: 'Laço Amigo',
        class: 'Animalista',
        cost: 1,
        type: 'capture_support',
        target: 'enemy',
        childText: 'Conecte-se com o monstrinho!',
        technicalEffect: 'Declara suporte de captura com bônus temporário controlado.',
        runtimeAction: 'capture_boost',
        mvp: true,
    },
];

export const BASIC_CARDS_BY_CLASS = BASIC_CARDS.reduce((acc, card) => {
    if (!acc[card.class]) acc[card.class] = [];
    acc[card.class].push(card);
    return acc;
}, {});

export function getAllBasicCards() {
    return [...BASIC_CARDS];
}

export function getBasicCardById(id) {
    return BASIC_CARDS.find(card => card.id === id) || null;
}

export function getBasicCardsByClass(className) {
    if (!className || typeof className !== 'string') return [];
    return [...(BASIC_CARDS_BY_CLASS[className] || [])];
}

export function isValidBasicCard(card) {
    if (!card || typeof card !== 'object') return false;

    const requiredFields = [
        'id', 'name', 'class', 'cost', 'type', 'target',
        'childText', 'technicalEffect', 'runtimeAction', 'mvp',
    ];

    for (const field of requiredFields) {
        if (card[field] === undefined || card[field] === null) return false;
    }

    if (typeof card.id !== 'string' || !CARD_ID_REGEX.test(card.id)) return false;
    if (typeof card.name !== 'string' || !card.name.trim()) return false;
    if (typeof card.class !== 'string' || !card.class.trim()) return false;
    if (typeof card.cost !== 'number' || card.cost < 0) return false;
    if (typeof card.type !== 'string' || !card.type.trim()) return false;
    if (typeof card.target !== 'string' || !card.target.trim()) return false;
    if (typeof card.childText !== 'string' || !card.childText.trim()) return false;
    if (typeof card.technicalEffect !== 'string' || !card.technicalEffect.trim()) return false;
    if (typeof card.runtimeAction !== 'string' || !card.runtimeAction.trim()) return false;
    if (typeof card.mvp !== 'boolean') return false;

    return true;
}

export function validateBasicCardsCatalog(cards = BASIC_CARDS) {
    const errors = [];
    if (!Array.isArray(cards)) {
        return { valid: false, errors: ['Catálogo deve ser um array.'] };
    }

    const ids = new Set();
    for (const card of cards) {
        if (!isValidBasicCard(card)) {
            errors.push(`Carta inválida: ${card?.id || 'SEM_ID'}`);
            continue;
        }
        if (ids.has(card.id)) {
            errors.push(`ID duplicado: ${card.id}`);
        }
        ids.add(card.id);
    }

    return { valid: errors.length === 0, errors };
}
