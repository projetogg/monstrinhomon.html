/**
 * GROUP BATTLE END TESTS (PR-battle-end)
 *
 * Testes do pipeline canônico de encerramento de batalha em grupo.
 *
 * Cobertura obrigatória (conforme issue):
 *  1.  Vitória trainer solo — recompensas corretas
 *  2.  Vitória trainer com grupo — recompensas para TODOS
 *  3.  Vitória boss solo — recompensas corretas (bônus boss)
 *  4.  Vitória boss com grupo — recompensas para TODOS
 *  5.  Derrota solo — sem recompensas
 *  6.  Derrota em grupo — sem recompensas
 *  7.  Recompensa aplicada UMA vez só (idempotência money)
 *  8.  Drops aplicados UMA vez (idempotência dropsGranted)
 *  9.  Quest progress aplicado UMA vez (idempotência questsProcessed)
 * 10.  Money concedido apenas para trainer/boss (não wild)
 * 11.  Drops para TODOS os participantes (não só player[0])
 * 12.  Quest progress para TODOS os participantes
 * 13.  Participantes com playerName, xp e money corretos no retorno
 * 14.  Modal não exibe recompensas para derrota (participants vazio)
 * 15.  Regressão: enc.kind vs enc.type (bug de 'boss' não reconhecido)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    processGroupVictoryRewards,
    COMBAT_REWARDS
} from '../js/combat/groupRewards.js';

// ──────────────────────────────────────────────────────────────────────────────
// Factories de fixture
// ──────────────────────────────────────────────────────────────────────────────

function makePlayer(id, overrides = {}) {
    return {
        id,
        name: `Jogador ${id}`,
        money: 0,
        inventory: {},
        team: [{ hp: 30, hpMax: 30, atk: 8, def: 4 }],
        activeIndex: 0,
        ...overrides
    };
}

function makeVictoryEnc(type, participantIds) {
    return {
        id: `enc_${Date.now()}`,
        type,
        result: 'victory',
        finished: true,
        participants: [...participantIds],
        enemies: [{ name: 'Inimigo', hp: 0, hpMax: 30 }],
        log: [],
        rewardsGranted: true,   // XP já processado
        moneyGranted:   false,
        dropsGranted:   false,
        questsProcessed: false
    };
}

/**
 * Cria deps mockados para processGroupVictoryRewards.
 * Permite inspecionar o que foi chamado via spies simples.
 */
function makeDeps(players, overrides = {}) {
    const moneyLog = [];
    const dropLog  = [];
    const questLog = [];

    return {
        state: { players },
        helpers: {
            awardMoney: (player, amount) => {
                moneyLog.push({ playerId: player.id, amount });
                player.money = (player.money || 0) + amount;
            },
            getDropTableForEncounter: overrides.getDropTableForEncounter
                ?? (() => null),
            generateDrops: overrides.generateDrops
                ?? (() => []),
            addDropsToInventory: (player, drops) => {
                dropLog.push({ playerId: player.id, drops });
            },
            formatDropsLog: (drops) =>
                drops.map(d => `  • ${d.qty}x ${d.name}`),
            handlePostEncounterFlow: (player, enc, id, deps) => {
                questLog.push({ playerId: player.id });
                return { log: [], completed: [], activated: [] };
            },
            createQuestDeps: () => ({})
        },
        _spies: { moneyLog, dropLog, questLog }
    };
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. CONSTANTES DE RECOMPENSA
// ──────────────────────────────────────────────────────────────────────────────

describe('COMBAT_REWARDS — constantes', () => {
    it('trainer concede 50g e 30 XP', () => {
        expect(COMBAT_REWARDS.trainer.money).toBe(50);
        expect(COMBAT_REWARDS.trainer.xp).toBe(30);
    });

    it('boss concede 100g e 50 XP', () => {
        expect(COMBAT_REWARDS.boss.money).toBe(100);
        expect(COMBAT_REWARDS.boss.xp).toBe(50);
    });

    it('boss dá mais recompensas que trainer', () => {
        expect(COMBAT_REWARDS.boss.money).toBeGreaterThan(COMBAT_REWARDS.trainer.money);
        expect(COMBAT_REWARDS.boss.xp).toBeGreaterThan(COMBAT_REWARDS.trainer.xp);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. RESULTADO NÃO-VITÓRIA: sem recompensas
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — derrota/retirada', () => {
    it('5. derrota solo não concede recompensas', () => {
        const p1 = makePlayer('p1');
        const enc = { result: 'defeat', participants: ['p1'], type: 'group_trainer', log: [] };
        const deps = makeDeps([p1]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        expect(participants).toHaveLength(0);
        expect(deps._spies.moneyLog).toHaveLength(0);
        expect(p1.money).toBe(0);
    });

    it('6. derrota em grupo não concede recompensas', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const enc = { result: 'defeat', participants: ['p1', 'p2'], type: 'boss', log: [] };
        const deps = makeDeps([p1, p2]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        expect(participants).toHaveLength(0);
        expect(deps._spies.moneyLog).toHaveLength(0);
    });

    it('14. retirada não retorna participantes com recompensas', () => {
        const p1 = makePlayer('p1');
        const enc = { result: 'retreat', participants: ['p1'], type: 'group_trainer', log: [] };
        const deps = makeDeps([p1]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        expect(participants).toHaveLength(0);
        expect(deps._spies.moneyLog).toHaveLength(0);
    });

    it('enc null → retorna participants vazio sem erros', () => {
        const deps = makeDeps([]);
        const { participants } = processGroupVictoryRewards(null, deps);
        expect(participants).toHaveLength(0);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. VITÓRIA — DINHEIRO (MONEY)
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — money', () => {
    it('1. trainer solo concede 50g', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(50);
        expect(deps._spies.moneyLog).toHaveLength(1);
        expect(deps._spies.moneyLog[0]).toEqual({ playerId: 'p1', amount: 50 });
    });

    it('2. trainer com grupo concede 50g para CADA participante', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const p3 = makePlayer('p3');
        const enc = makeVictoryEnc('group_trainer', ['p1', 'p2', 'p3']);
        const deps = makeDeps([p1, p2, p3]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(50);
        expect(p2.money).toBe(50);
        expect(p3.money).toBe(50);
        expect(deps._spies.moneyLog).toHaveLength(3);
    });

    it('3. boss solo concede 100g', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('boss', ['p1']);
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(100);
        expect(deps._spies.moneyLog[0].amount).toBe(100);
    });

    it('4. boss com grupo concede 100g para CADA participante', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const enc = makeVictoryEnc('boss', ['p1', 'p2']);
        const deps = makeDeps([p1, p2]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(100);
        expect(p2.money).toBe(100);
        expect(deps._spies.moneyLog).toHaveLength(2);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. IDEMPOTÊNCIA: sem duplicação de recompensas
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — idempotência', () => {
    it('7. money NÃO duplica se moneyGranted já estiver true', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        enc.moneyGranted = true;
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(0);
        expect(deps._spies.moneyLog).toHaveLength(0);
    });

    it('7. chamar duas vezes não duplica money', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);
        processGroupVictoryRewards(enc, deps); // segunda chamada deve ser no-op

        expect(p1.money).toBe(50); // só uma vez
        expect(deps._spies.moneyLog).toHaveLength(1);
    });

    it('8. drops NÃO duplicam se dropsGranted já estiver true', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        enc.dropsGranted = true;
        const deps = makeDeps([p1], {
            getDropTableForEncounter: () => 'TABLE_1',
            generateDrops: () => [{ name: 'Petisco', qty: 1 }]
        });

        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.dropLog).toHaveLength(0);
    });

    it('8. drops não duplicam em duas chamadas', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1], {
            getDropTableForEncounter: () => 'TABLE_1',
            generateDrops: () => [{ name: 'Petisco', qty: 1 }]
        });

        processGroupVictoryRewards(enc, deps);
        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.dropLog).toHaveLength(1);
    });

    it('9. quest progress NÃO duplica se questsProcessed já estiver true', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        enc.questsProcessed = true;
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.questLog).toHaveLength(0);
    });

    it('9. quest progress não duplica em duas chamadas', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);
        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.questLog).toHaveLength(1);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. DROPS: todos os participantes recebem drops
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — drops', () => {
    it('11. todos os participantes recebem drops (não só player[0])', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const enc = makeVictoryEnc('group_trainer', ['p1', 'p2']);
        const deps = makeDeps([p1, p2], {
            getDropTableForEncounter: () => 'TABLE_1',
            generateDrops: () => [{ name: 'Petisco', qty: 1 }]
        });

        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.dropLog).toHaveLength(2);
        const playerIds = deps._spies.dropLog.map(d => d.playerId);
        expect(playerIds).toContain('p1');
        expect(playerIds).toContain('p2');
    });

    it('sem tabela de drops → nenhum drop distribuído', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1], {
            getDropTableForEncounter: () => null
        });

        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.dropLog).toHaveLength(0);
    });

    it('drops adicionados ao log do encounter', () => {
        const p1 = makePlayer('p1', { name: 'João' });
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1], {
            getDropTableForEncounter: () => 'TABLE_1',
            generateDrops: () => [{ name: 'Petisco', qty: 2 }]
        });

        processGroupVictoryRewards(enc, deps);

        expect(enc.log.some(l => l.includes('Drops de João'))).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 6. QUEST PROGRESS: todos os participantes
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — quest progress', () => {
    it('12. quest progress chamado para TODOS os participantes', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const p3 = makePlayer('p3');
        const enc = makeVictoryEnc('group_trainer', ['p1', 'p2', 'p3']);
        const deps = makeDeps([p1, p2, p3]);

        processGroupVictoryRewards(enc, deps);

        expect(deps._spies.questLog).toHaveLength(3);
        const questPlayerIds = deps._spies.questLog.map(q => q.playerId);
        expect(questPlayerIds).toContain('p1');
        expect(questPlayerIds).toContain('p2');
        expect(questPlayerIds).toContain('p3');
    });

    it('linhas de log de quest são adicionadas ao enc.log', () => {
        const p1 = makePlayer('p1');
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const questLines = ['🏆 Quest concluída: "Primeira Batalha"!', '💰 +60 moedas!'];
        const depsOverride = {
            state: { players: [p1] },
            helpers: {
                awardMoney: () => {},
                getDropTableForEncounter: () => null,
                generateDrops: () => [],
                addDropsToInventory: () => {},
                formatDropsLog: () => [],
                handlePostEncounterFlow: () => ({ log: questLines, completed: [], activated: [] }),
                createQuestDeps: () => ({})
            },
            _spies: { moneyLog: [], dropLog: [], questLog: [] }
        };

        processGroupVictoryRewards(enc, depsOverride);

        expect(enc.log.some(l => l.includes('Quest concluída'))).toBe(true);
        expect(enc.log.some(l => l.includes('+60 moedas'))).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 7. RETORNO: lista de participantes para o modal
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — retorno participants', () => {
    it('13. trainer retorna participante com playerName, xp=30, money=50', () => {
        const p1 = makePlayer('p1', { name: 'João' });
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        expect(participants).toHaveLength(1);
        expect(participants[0].playerName).toBe('João');
        expect(participants[0].xp).toBe(30);
        expect(participants[0].money).toBe(50);
    });

    it('13. boss retorna participante com xp=50, money=100', () => {
        const p1 = makePlayer('p1', { name: 'Maria' });
        const enc = makeVictoryEnc('boss', ['p1']);
        const deps = makeDeps([p1]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        expect(participants).toHaveLength(1);
        expect(participants[0].playerName).toBe('Maria');
        expect(participants[0].xp).toBe(50);
        expect(participants[0].money).toBe(100);
    });

    it('retorna participante para cada ID em enc.participants', () => {
        const p1 = makePlayer('p1', { name: 'João' });
        const p2 = makePlayer('p2', { name: 'Maria' });
        const enc = makeVictoryEnc('group_trainer', ['p1', 'p2']);
        const deps = makeDeps([p1, p2]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        expect(participants).toHaveLength(2);
        expect(participants.map(p => p.playerName)).toContain('João');
        expect(participants.map(p => p.playerName)).toContain('Maria');
    });

    it('usa enc.type (não enc.kind) para selecionar recompensas — regressão', () => {
        const p1 = makePlayer('p1');
        // Simular bug antigo: enc.kind = undefined, enc.type = 'boss'
        const enc = makeVictoryEnc('boss', ['p1']);
        delete enc.kind; // garantir que kind não existe
        const deps = makeDeps([p1]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        // Deve usar COMBAT_REWARDS.boss (100g), não trainer (50g)
        expect(participants[0].money).toBe(100);
        expect(p1.money).toBe(100);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 8. REGRESSÃO: player ausente em state.players
// ──────────────────────────────────────────────────────────────────────────────

describe('processGroupVictoryRewards — robustez', () => {
    it('ignora participante que não está em state.players', () => {
        const p1 = makePlayer('p1');
        // p2 não está no state
        const enc = makeVictoryEnc('group_trainer', ['p1', 'p2_missing']);
        const deps = makeDeps([p1]);

        const { participants } = processGroupVictoryRewards(enc, deps);

        // Só p1 deve aparecer
        expect(participants).toHaveLength(1);
        expect(participants[0].playerName).toContain('p1');
        // Money só para p1
        expect(deps._spies.moneyLog).toHaveLength(1);
        expect(deps._spies.moneyLog[0].playerId).toBe('p1');
    });

    it('lista de participants vazia não lança erro', () => {
        const enc = makeVictoryEnc('group_trainer', []);
        const deps = makeDeps([]);

        expect(() => processGroupVictoryRewards(enc, deps)).not.toThrow();
        const { participants } = processGroupVictoryRewards(enc, deps);
        expect(participants).toHaveLength(0);
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// 9. REGRESSÃO: fluxo completo trainer solo vs boss solo
// ──────────────────────────────────────────────────────────────────────────────

describe('Regressão — fluxo completo', () => {
    it('vitória trainer solo: flags, money, sem drops, quest processada', () => {
        const p1 = makePlayer('p1', { name: 'Hero' });
        const enc = makeVictoryEnc('group_trainer', ['p1']);
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);

        // Flags definidas
        expect(enc.moneyGranted).toBe(true);
        expect(enc.dropsGranted).toBe(true);
        expect(enc.questsProcessed).toBe(true);

        // Money correto
        expect(p1.money).toBe(50);

        // Sem drops (nenhuma tabela)
        expect(deps._spies.dropLog).toHaveLength(0);

        // Quest processada
        expect(deps._spies.questLog).toHaveLength(1);
        expect(deps._spies.questLog[0].playerId).toBe('p1');
    });

    it('vitória boss solo: flags, money boss, quest processada', () => {
        const p1 = makePlayer('p1', { name: 'Hero' });
        const enc = makeVictoryEnc('boss', ['p1']);
        const deps = makeDeps([p1]);

        processGroupVictoryRewards(enc, deps);

        expect(enc.moneyGranted).toBe(true);
        expect(p1.money).toBe(100);
        expect(deps._spies.questLog).toHaveLength(1);
    });

    it('vitória trainer grupo: todos recebem money e quest', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const p3 = makePlayer('p3');
        const enc = makeVictoryEnc('group_trainer', ['p1', 'p2', 'p3']);
        const deps = makeDeps([p1, p2, p3]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(50);
        expect(p2.money).toBe(50);
        expect(p3.money).toBe(50);
        expect(deps._spies.questLog).toHaveLength(3);
        expect(enc.moneyGranted).toBe(true);
        expect(enc.dropsGranted).toBe(true);
        expect(enc.questsProcessed).toBe(true);
    });

    it('vitória boss grupo: todos recebem money=100 e quest', () => {
        const p1 = makePlayer('p1');
        const p2 = makePlayer('p2');
        const enc = makeVictoryEnc('boss', ['p1', 'p2']);
        const deps = makeDeps([p1, p2]);

        processGroupVictoryRewards(enc, deps);

        expect(p1.money).toBe(100);
        expect(p2.money).toBe(100);
        expect(deps._spies.questLog).toHaveLength(2);
    });
});
