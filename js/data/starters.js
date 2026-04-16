/**
 * STARTERS MODULE — Fonte única de verdade para starters por classe
 *
 * Este módulo é a ÚNICA definição canônica de STARTER_BY_CLASS.
 * Deve ser consumido por:
 *  - runtime (index.html, via import)
 *  - testes (tests/starterFlow.test.js, via import direto)
 *
 * Não duplicar este mapeamento em nenhum outro arquivo.
 *
 * Histórico de IDs bugados (para migração de saves contaminados):
 *  - Bardo:      MON_011 (Felinomon/Caçador/Raro) — corrigido para MON_005
 *  - Guerreiro:  MON_010 (Gatunamon/Caçador/Incomum) — corrigido para MON_001
 *  - Mago:       MON_014 (Salamandromon/Mago/Incomum) — corrigido para MON_013
 *  - Caçador:    MON_013 (Lagartomon/Mago/Comum) — corrigido para MON_009
 *  - Animalista: MON_012 (Panterezamon/Caçador/Místico) — corrigido para MON_017
 */

/**
 * Mapeamento de classe do jogador → starter inicial.
 * Cada entrada contém:
 *  - monsterId: ID canônico do template no catálogo (monsters.json)
 *  - eggName:   nome exibido no ovo antes do hatch
 *  - eggEmoji:  emoji do ovo
 *
 * @type {Record<string, {monsterId: string, eggName: string, eggEmoji: string}>}
 */
export const STARTER_BY_CLASS = {
    'Bardo':      { monsterId: 'MON_005', eggName: 'Ovo Harmônico', eggEmoji: '🥚🎵' },
    'Guerreiro':  { monsterId: 'MON_001', eggName: 'Ovo da Guarda', eggEmoji: '🥚⚔️' },
    'Mago':       { monsterId: 'MON_013', eggName: 'Ovo Arcano',    eggEmoji: '🥚🔮' },
    'Curandeiro': { monsterId: 'MON_028', eggName: 'Ovo Vital',     eggEmoji: '🥚🌿' },
    'Caçador':    { monsterId: 'MON_009', eggName: 'Ovo Selvagem',  eggEmoji: '🥚🏹' },
    'Animalista': { monsterId: 'MON_017', eggName: 'Ovo Primal',    eggEmoji: '🥚🐾' },
    'Bárbaro':    { monsterId: 'MON_029', eggName: 'Ovo Feroz',     eggEmoji: '🥚🐯' },
    'Ladino':     { monsterId: 'MON_030', eggName: 'Ovo Sombrio',   eggEmoji: '🥚🦊' },
};

/**
 * Mapeamento de starters bugados (gerados pelo runtime antes da correção).
 * Chave: classe do jogador → monsterId incorreto que era atribuído.
 *
 * Usado APENAS para migração de saves antigos contaminados.
 * Não usar para nenhuma outra finalidade.
 *
 * @type {Record<string, string>}
 */
export const LEGACY_BUGGY_STARTER_IDS = {
    'Bardo':      'MON_011',
    'Guerreiro':  'MON_010',
    'Mago':       'MON_014',
    'Caçador':    'MON_013',
    'Animalista': 'MON_012',
};

/**
 * Verifica se o starterMonsterId de um jogador é o ID bugado para sua classe.
 * Retorna true apenas se o ID salvo corresponde exatamente ao mapeamento bugado
 * histórico daquela classe específica — nunca classifica como contaminado se
 * o ID pode ser legítimo para outra classe.
 *
 * @param {string} cls - Classe do jogador
 * @param {string} starterMonsterId - ID salvo em player.starterMonsterId
 * @returns {boolean}
 */
export function isContaminatedStarterId(cls, starterMonsterId) {
    const legacyId = LEGACY_BUGGY_STARTER_IDS[cls];
    if (!legacyId) return false;
    return starterMonsterId === legacyId;
}

/**
 * Migra player.starterMonsterId se estiver contaminado pelo bug histórico.
 * Atualiza APENAS o campo de metadado starterMonsterId — NÃO altera team/box.
 *
 * @param {Object} player
 * @returns {boolean} true se alguma migração foi aplicada
 */
export function migrateContaminatedStarterMeta(player) {
    if (!player || !player.starterGranted || !player.class || !player.starterMonsterId) {
        return false;
    }
    if (!isContaminatedStarterId(player.class, player.starterMonsterId)) {
        return false;
    }
    const correct = STARTER_BY_CLASS[player.class]?.monsterId;
    if (!correct) return false;

    console.warn(
        `[StarterMigration] ${player.name} (${player.class}): starterMonsterId ${player.starterMonsterId} → ${correct} (metadado corrigido; time NÃO alterado)`
    );
    player.starterMonsterId = correct;
    return true;
}
