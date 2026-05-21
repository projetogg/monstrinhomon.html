const VALID_MONSTER_CLASSES = new Set([
    'Guerreiro',
    'Mago',
    'Curandeiro',
    'Bárbaro',
    'Ladino',
    'Bardo',
    'Caçador',
    'Animalista',
]);

function normalizeClassCandidate(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return VALID_MONSTER_CLASSES.has(trimmed) ? trimmed : null;
}

export function resolveMonsterEffectiveClass(monster, options = {}) {
    if (!monster || typeof monster !== 'object') {
        return { value: null, source: 'missing_monster' };
    }

    const directClass = normalizeClassCandidate(monster.class);
    if (directClass) {
        return { value: directClass, source: 'class' };
    }

    const monsterClass = normalizeClassCandidate(monster.monsterClass);
    if (monsterClass) {
        return { value: monsterClass, source: 'monsterClass' };
    }

    const roleClass = normalizeClassCandidate(monster.role);
    if (roleClass) {
        return { value: roleClass, source: 'role' };
    }

    if (Array.isArray(monster.classes)) {
        const classesClass = monster.classes
            .map(normalizeClassCandidate)
            .find(Boolean);
        if (classesClass) {
            return { value: classesClass, source: 'classes' };
        }
    }

    const templateClass = normalizeClassCandidate(monster.template?.class);
    if (templateClass) {
        return { value: templateClass, source: 'template.class' };
    }

    const templateId = monster.templateId ?? monster.monsterId ?? monster.baseId ?? monster.idBase ?? null;
    const resolveMonsterTemplate = options.resolveMonsterTemplate;
    if (templateId && typeof resolveMonsterTemplate === 'function') {
        const template = resolveMonsterTemplate(templateId);
        const resolvedTemplateClass = normalizeClassCandidate(template?.class);
        if (resolvedTemplateClass) {
            return { value: resolvedTemplateClass, source: 'catalog' };
        }
    }

    return { value: null, source: 'unresolved' };
}

export function resolveMonsterCurrentEne(monster) {
    if (!monster || typeof monster !== 'object') return 0;
    const parsed = Number(monster.ene ?? monster.currentEne ?? monster.energy ?? 0);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
}
