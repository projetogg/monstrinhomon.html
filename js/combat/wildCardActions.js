import { getBasicCardById } from '../data/basicCards.js';
import { resolveMonsterCurrentEne, resolveMonsterEffectiveClass } from './monsterRuntimeFields.js';

export const SUPPORTED_WILD_CARD_ID = 'CARD_GUERREIRO_GOLPE_FIRME';

function isAlive(monster) {
  return !!monster && Number(monster.hp) > 0;
}

export function executeBasicCardAction({ cardId, player, playerMonster, encounter, dependencies = {} }) {
  const card = getBasicCardById(cardId);
  if (!card) return { success: false, reason: 'card_not_found' };
  if (card.id !== SUPPORTED_WILD_CARD_ID) return { success: false, reason: 'unsupported_card' };
  if (card.runtimeAction !== 'basic_attack') return { success: false, reason: 'unsupported_runtime_action' };

  if (!player || typeof player !== 'object') return { success: false, reason: 'invalid_player' };
  if (player.class !== 'Guerreiro') return { success: false, reason: 'class_mismatch' };

  if (!playerMonster || typeof playerMonster !== 'object') return { success: false, reason: 'invalid_player_monster' };
  const resolvedClass = resolveMonsterEffectiveClass(playerMonster, {
    resolveMonsterTemplate: dependencies.resolveMonsterTemplate,
  });
  if (resolvedClass.value !== 'Guerreiro') return { success: false, reason: 'class_mismatch' };
  if (!isAlive(playerMonster)) return { success: false, reason: 'player_monster_fainted' };

  const currentEne = resolveMonsterCurrentEne(playerMonster);
  if (currentEne < card.cost) return { success: false, reason: 'insufficient_ene' };

  if (!encounter || encounter.active !== true) return { success: false, reason: 'invalid_encounter' };
  if (!isAlive(encounter.wildMonster)) return { success: false, reason: 'invalid_wild_monster' };

  const executeWildAttack = dependencies.executeWildAttack;
  if (typeof executeWildAttack !== 'function') return { success: false, reason: 'missing_attack_pipeline' };

  if (playerMonster.class !== resolvedClass.value) {
    playerMonster.class = resolvedClass.value;
  }
  if (playerMonster.ene !== currentEne) {
    playerMonster.ene = currentEne;
  }

  // Consome ENE só após validações; se pipeline falhar, rollback para consistência.
  playerMonster.ene = currentEne - card.cost;

  const attackResult = executeWildAttack();
  if (!attackResult?.success) {
    playerMonster.ene = currentEne;
    return { success: false, reason: 'attack_pipeline_failed', details: attackResult?.reason || null };
  }

  return {
    success: true,
    reason: 'card_executed',
    cardId: card.id,
    runtimeAction: card.runtimeAction,
    attackResult,
  };
}
