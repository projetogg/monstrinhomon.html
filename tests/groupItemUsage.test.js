/**
 * GROUP ITEM USAGE TESTS (PR5B + Fase XXI Sprint I3)
 *
 * Testes para executeGroupUseItem:
 * - Cura com heal_pct e heal_min
 * - Consumo correto do inventário
 * - Validações (HP cheio, desmaiado, sem item)
 * - Suporte a múltiplos tipos de item (IT_HEAL_01/02/03)
 * - Item tático (type: 'tatico') aplica buff DEF (Sprint I3)
 *
 * Também cobre validateItem (heal) em itemsLoader.js
 */

import { describe, it, expect, vi } from 'vitest';
import { executeGroupUseItem } from '../js/combat/groupActions.js';
import { validateItem } from '../js/data/itemsLoader.js';

// ---------------------------------------------------------------------------
// Helpers para criar mocks
// ---------------------------------------------------------------------------

function makeMon(overrides = {}) {
    return {
        id: 'mi_test',
        name: 'TestMon',
        class: 'Guerreiro',
        hp: 30,
        hpMax: 100,
        atk: 10,
        def: 8,
        level: 5,
        buffs: [],
        ...overrides
    };
}

function makePlayer(mon, inventory = {}, overrides = {}) {
    return {
        id: 'player_1',
        name: 'Ana',
        class: 'Guerreiro',
        team: [mon],
        inventory: { ...inventory },
        ...overrides
    };
}

const HEAL_01 = {
    id: 'IT_HEAL_01',
    name: 'Petisco de Cura',
    type: 'heal',
    heal_pct: 0.30,
    heal_min: 30,
    emoji: '💚'
};

const HEAL_02 = {
    id: 'IT_HEAL_02',
    name: 'Ração Revigorante',
    type: 'heal',
    heal_pct: 0.55,
    heal_min: 60,
    emoji: '🍖'
};

const HEAL_03 = {
    id: 'IT_HEAL_03',
    name: 'Elixir Máximo',
    type: 'heal',
    heal_pct: 1.00,
    heal_min: 999,
    emoji: '✨'
};

function makeDeps({ mon, player, itemDefById = {} }) {
    const enc = {
        active: true,
        finished: false,
        participants: [player.id],
        enemies: [{ hp: 30, hpMax: 30 }],
        turnOrder: [{ side: 'player', id: player.id, name: player.name }],
        turnIndex: 0,
        log: [],
        currentActor: { side: 'player', id: player.id, name: player.name }
    };

    const state = {
        currentEncounter: enc,
        players: [player],
        config: {}
    };

    const deps = {
        state,
        core: {
            getCurrentActor: (e) => e.currentActor,
            isAlive: (entity) => (Number(entity?.hp) || 0) > 0,
            hasAlivePlayers: () => true,
            hasAliveEnemies: () => true
        },
        ui: {
            render: vi.fn(),
            showDamageFeedback: vi.fn(),
            showMissFeedback: vi.fn(),
            playAttackFeedback: vi.fn()
        },
        audio: { playSfx: vi.fn() },
        storage: { save: vi.fn() },
        helpers: {
            getPlayerById: (id) => state.players.find(p => p.id === id),
            getActiveMonsterOfPlayer: (p) => p?.team?.[0],
            getEnemyByIndex: (e, idx) => e.enemies[idx],
            log: (e, msg) => e.log.push(msg),
            applyEneRegen: vi.fn(),
            updateBuffs: vi.fn(),
            rollD20: () => 10,
            recordD20Roll: vi.fn(),
            getBasicAttackPower: () => 5,
            applyDamage: vi.fn(),
            chooseTargetPlayerId: vi.fn(),
            firstAliveIndex: vi.fn(),
            openSwitchMonsterModal: vi.fn(),
            handleVictoryRewards: vi.fn(),
            getSkillById: () => null,
            canUseSkillNow: () => false,
            getItemDef: (id) => itemDefById[id] || null
        }
    };

    return { deps, enc };
}

// ---------------------------------------------------------------------------
// validateItem - tipo heal
// ---------------------------------------------------------------------------

describe('validateItem - Tipo heal (itemsLoader)', () => {
    it('deve aceitar item heal válido com todos os campos', () => {
        const item = {
            id: 'IT_HEAL_01',
            name: 'Petisco de Cura',
            type: 'heal',
            heal_pct: 0.30,
            heal_min: 30
        };
        expect(validateItem(item)).toBe(true);
    });

    it('deve aceitar item heal com heal_pct = 1.0 (Elixir Máximo)', () => {
        const item = {
            id: 'IT_HEAL_03',
            name: 'Elixir Máximo',
            type: 'heal',
            heal_pct: 1.00,
            heal_min: 999
        };
        expect(validateItem(item)).toBe(true);
    });

    it('deve rejeitar item heal sem heal_pct', () => {
        const item = {
            id: 'IT_HEAL_X',
            name: 'Cura Sem Percentual',
            type: 'heal',
            heal_min: 30
        };
        expect(validateItem(item)).toBe(false);
    });

    it('deve rejeitar item heal com heal_pct inválido (>1)', () => {
        const item = {
            id: 'IT_HEAL_X',
            name: 'Cura Excessiva',
            type: 'heal',
            heal_pct: 1.5,
            heal_min: 30
        };
        expect(validateItem(item)).toBe(false);
    });

    it('deve rejeitar item heal com heal_min negativo', () => {
        const item = {
            id: 'IT_HEAL_X',
            name: 'Cura Negativa',
            type: 'heal',
            heal_pct: 0.30,
            heal_min: -10
        };
        expect(validateItem(item)).toBe(false);
    });

    it('deve rejeitar item sem name', () => {
        const item = {
            id: 'IT_HEAL_X',
            type: 'heal',
            heal_pct: 0.30,
            heal_min: 30
        };
        expect(validateItem(item)).toBe(false);
    });

    it('deve continuar aceitando itens held corretamente', () => {
        const item = {
            id: 'IT_ATK_COMUM',
            name: 'Amuleto',
            type: 'held',
            tier: 'comum',
            stats: { atk: 2, def: 0 },
            break: { enabled: true, chance: 0.15 }
        };
        expect(validateItem(item)).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// executeGroupUseItem - Cura básica
// ---------------------------------------------------------------------------

describe('executeGroupUseItem - Cura básica (IT_HEAL_01)', () => {
    it('deve curar o monstrinho com 30% do hpMax', () => {
        const mon = makeMon({ hp: 20, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 3 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        executeGroupUseItem('IT_HEAL_01', deps);

        // 30% de 100 = 30, min 30, então cura 30 HP
        expect(mon.hp).toBe(50); // 20 + 30
    });

    it('deve aplicar heal_min quando percentual resulta em menos', () => {
        const mon = makeMon({ hp: 5, hpMax: 50 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        executeGroupUseItem('IT_HEAL_01', deps);

        // 30% de 50 = 15, mas heal_min = 30 → cura 30
        expect(mon.hp).toBe(35); // 5 + 30
    });

    it('não deve ultrapassar hpMax ao curar', () => {
        const mon = makeMon({ hp: 90, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 2 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        executeGroupUseItem('IT_HEAL_01', deps);

        expect(mon.hp).toBe(100); // capado ao hpMax
    });

    it('deve consumir 1 item do inventário', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 3 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        executeGroupUseItem('IT_HEAL_01', deps);

        expect(player.inventory['IT_HEAL_01']).toBe(2);
    });

    it('deve retornar true em uso bem-sucedido', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        const result = executeGroupUseItem('IT_HEAL_01', deps);
        expect(result).toBe(true);
    });

    it('deve logar mensagem com nome do item e HP recuperado', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 2 });
        const { deps, enc } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        executeGroupUseItem('IT_HEAL_01', deps);

        const logText = enc.log.join(' ');
        expect(logText).toContain('Petisco de Cura');
        expect(logText).toContain('HP');
    });

    it('deve tocar som de cura', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        executeGroupUseItem('IT_HEAL_01', deps);

        expect(deps.audio.playSfx).toHaveBeenCalledWith('heal');
    });
});

// ---------------------------------------------------------------------------
// executeGroupUseItem - IT_HEAL_02 e IT_HEAL_03
// ---------------------------------------------------------------------------

describe('executeGroupUseItem - Múltiplos tipos de item', () => {
    it('deve curar 55% com IT_HEAL_02 (Ração Revigorante)', () => {
        const mon = makeMon({ hp: 10, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_02': 2 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_02': HEAL_02 } });

        executeGroupUseItem('IT_HEAL_02', deps);

        // 55% de 100 = 55, min 60 → cura 60 HP
        expect(mon.hp).toBe(70); // 10 + 60
    });

    it('deve curar HP completo com IT_HEAL_03 (Elixir Máximo)', () => {
        const mon = makeMon({ hp: 1, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_03': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_03': HEAL_03 } });

        executeGroupUseItem('IT_HEAL_03', deps);

        expect(mon.hp).toBe(100); // 1 + 999 = capped 100
    });

    it('deve usar fallback 30%/30 quando getItemDef retorna null', () => {
        const mon = makeMon({ hp: 20, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_DESCONHECIDO': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: {} });

        executeGroupUseItem('IT_HEAL_DESCONHECIDO', deps);

        // Fallback: 30% de 100 = 30, min 30 → cura 30
        expect(mon.hp).toBe(50);
    });

    it('deve consumir o item correto do inventário', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, {
            'IT_HEAL_01': 5,
            'IT_HEAL_02': 2,
            'IT_HEAL_03': 1
        });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_02': HEAL_02 } });

        executeGroupUseItem('IT_HEAL_02', deps);

        // Apenas IT_HEAL_02 deve ser decrementado
        expect(player.inventory['IT_HEAL_01']).toBe(5);
        expect(player.inventory['IT_HEAL_02']).toBe(1);
        expect(player.inventory['IT_HEAL_03']).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// executeGroupUseItem - Validações
// ---------------------------------------------------------------------------

describe('executeGroupUseItem - Validações', () => {
    it('deve retornar false se HP está cheio', () => {
        const mon = makeMon({ hp: 100, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 3 });
        const { deps, enc } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        const result = executeGroupUseItem('IT_HEAL_01', deps);

        expect(result).toBe(false);
        expect(player.inventory['IT_HEAL_01']).toBe(3); // não consumido
        expect(enc.log.some(l => l.includes('HP já está cheio'))).toBe(true);
    });

    it('deve retornar false se monstrinho está desmaiado (hp = 0)', () => {
        const mon = makeMon({ hp: 0, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 1 });
        const { deps, enc } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        const result = executeGroupUseItem('IT_HEAL_01', deps);

        expect(result).toBe(false);
        expect(mon.hp).toBe(0); // sem cura
        expect(enc.log.some(l => l.includes('desmaiado'))).toBe(true);
    });

    it('deve retornar false se jogador não tem o item', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, {}); // sem itens
        const { deps, enc } = makeDeps({ mon, player, itemDefById: { 'IT_HEAL_01': HEAL_01 } });

        const result = executeGroupUseItem('IT_HEAL_01', deps);

        expect(result).toBe(false);
        expect(enc.log.some(l => l.includes('não tem esse item'))).toBe(true);
    });

    it('deve retornar false se encounter não existe', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 1 });
        const { deps } = makeDeps({ mon, player });
        deps.state.currentEncounter = null;

        const result = executeGroupUseItem('IT_HEAL_01', deps);
        expect(result).toBe(false);
    });

    it('deve retornar false se não é turno de jogador', () => {
        const mon = makeMon({ hp: 30, hpMax: 100 });
        const player = makePlayer(mon, { 'IT_HEAL_01': 1 });
        const { deps } = makeDeps({ mon, player });
        // Simular turno do inimigo
        deps.state.currentEncounter.currentActor = { side: 'enemy', id: 'enemy_0', name: 'Inimigo' };

        const result = executeGroupUseItem('IT_HEAL_01', deps);
        expect(result).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// Sprint I3 — Item tático em batalha de grupo
// ---------------------------------------------------------------------------

const SHIELD_ITEM = {
    id: 'IT_TATICO_01',
    name: 'Escudo Protetor',
    type: 'tatico',
    shield: 3,
    duration: 2,
    emoji: '🛡️'
};

const SHIELD_ITEM_DEFAULT = {
    id: 'IT_TATICO_02',
    name: 'Escudo Básico',
    type: 'tatico',
    // sem campo shield/duration — usa defaults (2, 2)
    emoji: '🛡️'
};

describe('executeGroupUseItem - Item tático (Sprint I3)', () => {
    it('deve aplicar buff DEF ao monstrinho ativo', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_01': 2 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        const result = executeGroupUseItem('IT_TATICO_01', deps);

        expect(result).toBe(true);
        expect(mon.buffs).toHaveLength(1);
        expect(mon.buffs[0].type).toBe('def');
        expect(mon.buffs[0].power).toBe(3);
        expect(mon.buffs[0].duration).toBe(2);
    });

    it('deve consumir 1 item tático do inventário', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_01': 3 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        executeGroupUseItem('IT_TATICO_01', deps);

        expect(player.inventory['IT_TATICO_01']).toBe(2);
    });

    it('deve usar valores default de shield(2) e duration(2) quando ausentes no item', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_02': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_02': SHIELD_ITEM_DEFAULT } });

        executeGroupUseItem('IT_TATICO_02', deps);

        expect(mon.buffs[0].power).toBe(2);
        expect(mon.buffs[0].duration).toBe(2);
    });

    it('deve logar mensagem de item tático com nome e bônus', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_01': 1 });
        const { deps, enc } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        executeGroupUseItem('IT_TATICO_01', deps);

        const log = enc.log.join(' ');
        expect(log).toContain('Escudo Protetor');
        expect(log).toContain('DEF +3');
    });

    it('não deve curar HP ao usar item tático', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_01': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        executeGroupUseItem('IT_TATICO_01', deps);

        expect(mon.hp).toBe(50); // HP não muda
    });

    it('deve retornar false ao usar item tático sem ter o item', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, {}); // sem item
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        const result = executeGroupUseItem('IT_TATICO_01', deps);

        expect(result).toBe(false);
        expect(mon.buffs).toHaveLength(0);
    });

    it('deve permitir uso de item tático mesmo com HP cheio', () => {
        const mon = makeMon({ hp: 100, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_01': 1 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        const result = executeGroupUseItem('IT_TATICO_01', deps);

        expect(result).toBe(true);
        expect(mon.buffs).toHaveLength(1);
    });

    it('deve empilhar buffs se usar item tático duas vezes', () => {
        const mon = makeMon({ hp: 50, hpMax: 100, buffs: [] });
        const player = makePlayer(mon, { 'IT_TATICO_01': 2 });
        const { deps } = makeDeps({ mon, player, itemDefById: { 'IT_TATICO_01': SHIELD_ITEM } });

        executeGroupUseItem('IT_TATICO_01', deps);
        deps.state.currentEncounter.currentActor = { side: 'player', id: player.id };
        executeGroupUseItem('IT_TATICO_01', deps);

        expect(mon.buffs).toHaveLength(2);
    });
});
