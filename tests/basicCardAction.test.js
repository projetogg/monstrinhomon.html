import { describe, it, expect, vi } from 'vitest';
import { executeBasicCardAction, SUPPORTED_WILD_CARD_ID } from '../js/combat/wildCardActions.js';

function makeBase() {
  return {
    player: { id: 'P1', class: 'Guerreiro' },
    playerMonster: { id: 'M1', class: 'Guerreiro', hp: 20, ene: 3 },
    encounter: { active: true, wildMonster: { id: 'W1', hp: 18 } },
  };
}

describe('executeBasicCardAction', () => {
  it('executa Golpe Firme com sucesso, consome 1 ENE e delega ao ataque básico', () => {
    const ctx = makeBase();
    const executeWildAttack = vi.fn(() => ({ success: true, result: 'ongoing' }));

    const result = executeBasicCardAction({
      cardId: SUPPORTED_WILD_CARD_ID,
      ...ctx,
      dependencies: { executeWildAttack }
    });

    expect(result.success).toBe(true);
    expect(result.reason).toBe('card_executed');
    expect(result.runtimeAction).toBe('basic_attack');
    expect(ctx.playerMonster.ene).toBe(2);
    expect(executeWildAttack).toHaveBeenCalledTimes(1);
  });

  it('não executa com ENE insuficiente', () => {
    const ctx = makeBase();
    ctx.playerMonster.ene = 0;
    const executeWildAttack = vi.fn(() => ({ success: true }));
    const result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, dependencies: { executeWildAttack } });
    expect(result).toEqual({ success: false, reason: 'insufficient_ene' });
    expect(ctx.playerMonster.ene).toBe(0);
    expect(executeWildAttack).not.toHaveBeenCalled();
  });

  it('não executa com classe errada', () => {
    const ctx = makeBase();
    ctx.player.class = 'Mago';
    const result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('class_mismatch');
    expect(ctx.playerMonster.ene).toBe(3);
  });

  it('não executa quando a classe do monstrinho não é Guerreiro', () => {
    const ctx = makeBase();
    ctx.playerMonster.class = 'Mago';
    const executeWildAttack = vi.fn();
    const result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, dependencies: { executeWildAttack } });
    expect(result.reason).toBe('class_mismatch');
    expect(ctx.playerMonster.ene).toBe(3);
    expect(executeWildAttack).not.toHaveBeenCalled();
  });

  it('executa com shape legado quando a classe efetiva vem do template canônico', () => {
    const ctx = makeBase();
    ctx.playerMonster.class = 'Neutro';
    ctx.playerMonster.templateId = 'MON_001';
    delete ctx.playerMonster.ene;
    ctx.playerMonster.currentEne = 3;
    const executeWildAttack = vi.fn(() => ({ success: true, result: 'ongoing' }));

    const result = executeBasicCardAction({
      cardId: SUPPORTED_WILD_CARD_ID,
      ...ctx,
      dependencies: {
        executeWildAttack,
        resolveMonsterTemplate: (templateId) => templateId === 'MON_001'
          ? { id: 'MON_001', class: 'Guerreiro' }
          : null,
      }
    });

    expect(result.success).toBe(true);
    expect(ctx.playerMonster.class).toBe('Guerreiro');
    expect(ctx.playerMonster.ene).toBe(2);
    expect(executeWildAttack).toHaveBeenCalledTimes(1);
  });

  it('retorna card_not_found para carta inexistente', () => {
    const ctx = makeBase();
    const result = executeBasicCardAction({ cardId: 'CARD_X', ...ctx, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('card_not_found');
  });

  it('retorna unsupported_card para outras cartas', () => {
    const ctx = makeBase();
    const result = executeBasicCardAction({ cardId: 'CARD_MAGO_FAISCA_ARCANA', ...ctx, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('unsupported_card');
  });

  it('não executa com playerMonster HP 0', () => {
    const ctx = makeBase();
    ctx.playerMonster.hp = 0;
    const result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('player_monster_fainted');
    expect(ctx.playerMonster.ene).toBe(3);
  });

  it('não executa com encounter inválido ou wildMonster inválido', () => {
    const ctx = makeBase();
    let result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, encounter: { active: false }, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('invalid_encounter');

    result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, encounter: { active: true, wildMonster: null }, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('invalid_wild_monster');

    result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, encounter: { active: true, wildMonster: { hp: 0 } }, dependencies: { executeWildAttack: vi.fn() } });
    expect(result.reason).toBe('invalid_wild_monster');
  });

  it('faz rollback de ENE se pipeline de ataque falhar', () => {
    const ctx = makeBase();
    const result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, dependencies: { executeWildAttack: () => ({ success: false, reason: 'x' }) } });
    expect(result.reason).toBe('attack_pipeline_failed');
    expect(ctx.playerMonster.ene).toBe(3);
  });

  it('não consome ENE se o pipeline de ataque não foi fornecido', () => {
    const ctx = makeBase();
    const result = executeBasicCardAction({ cardId: SUPPORTED_WILD_CARD_ID, ...ctx, dependencies: {} });
    expect(result.reason).toBe('missing_attack_pipeline');
    expect(ctx.playerMonster.ene).toBe(3);
  });
});
