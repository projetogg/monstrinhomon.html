/**
 * GROUP ENCOUNTER STATE TESTS
 *
 * Testes para a estrutura de estado canônica do combate em grupo.
 * Pipeline canônico: groupCore.createGroupEncounter() + validateGroupEncounter()
 *
 * Estes testes substituem os testes do protótipo deprecated GroupBattleState.
 * Cobertura: createGroupEncounter, validateGroupEncounter, assertValidActor,
 *            getCurrentActor, hasAlivePlayers, hasAliveEnemies
 */

import { describe, it, expect } from 'vitest';
import {
    createGroupEncounter,
    validateGroupEncounter,
    assertValidActor,
    getCurrentActor,
    hasAlivePlayers,
    hasAliveEnemies,
    isAlive
} from '../js/combat/groupCore.js';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeEnemy(overrides = {}) {
    return { name: 'Inimigo', hp: 40, hpMax: 40, atk: 5, def: 5, spd: 5, class: 'Guerreiro', ...overrides };
}

function makePlayer(id, monHp = 30) {
    return {
        id,
        name: `Jogador ${id}`,
        class: 'Guerreiro',
        team: [{ name: 'Mon', hp: monHp, hpMax: 30, atk: 5, def: 5, spd: 5 }],
        activeIndex: 0
    };
}

// ── createGroupEncounter ──────────────────────────────────────────────────

describe('createGroupEncounter - Fábrica Canônica', () => {

    it('deve criar encounter trainer com campos canônicos corretos', () => {
        const enc = createGroupEncounter({
            participantIds: ['p1', 'p2'],
            type: 'group_trainer',
            enemies: [makeEnemy()]
        });

        expect(enc.type).toBe('group_trainer');
        expect(enc.active).toBe(true);
        expect(enc.finished).toBe(false);
        expect(enc.result).toBeNull();
        expect(enc.participants).toEqual(['p1', 'p2']);
        expect(enc.enemies).toHaveLength(1);
        expect(enc.turnOrder).toEqual([]);
        expect(enc.turnIndex).toBe(0);
        expect(enc.currentActor).toBeNull();
        expect(enc.rewardsGranted).toBe(false);
        expect(typeof enc.id).toBe('number');
    });

    it('deve criar encounter boss com tipo correto', () => {
        const enc = createGroupEncounter({
            participantIds: ['p1'],
            type: 'boss',
            enemies: [makeEnemy({ name: 'Boss', hp: 200 })]
        });

        expect(enc.type).toBe('boss');
        expect(enc.enemies[0].name).toBe('Boss');
    });

    it('deve criar cópia independente de participantIds', () => {
        const ids = ['p1', 'p2'];
        const enc = createGroupEncounter({ participantIds: ids, type: 'group_trainer', enemies: [makeEnemy()] });
        ids.push('p3');
        expect(enc.participants).toHaveLength(2); // não foi afetado pela mutação
    });

    it('deve criar cópia independente de enemies', () => {
        const enemyArr = [makeEnemy()];
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: enemyArr });
        enemyArr.push(makeEnemy());
        expect(enc.enemies).toHaveLength(1); // não foi afetado
    });

    it('deve inicializar recentTargets como objeto vazio', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        expect(enc.recentTargets).toEqual({});
    });

    it('deve lançar erro se participantIds for vazio', () => {
        expect(() => createGroupEncounter({ participantIds: [], type: 'group_trainer', enemies: [makeEnemy()] }))
            .toThrow('participantIds deve ser array não vazio');
    });

    it('deve lançar erro se participantIds não for array', () => {
        expect(() => createGroupEncounter({ participantIds: 'p1', type: 'group_trainer', enemies: [makeEnemy()] }))
            .toThrow('participantIds deve ser array não vazio');
    });

    it('deve lançar erro se type for inválido', () => {
        expect(() => createGroupEncounter({ participantIds: ['p1'], type: 'wild', enemies: [makeEnemy()] }))
            .toThrow("type deve ser 'group_trainer' ou 'boss'");
    });

    it('deve lançar erro se type for undefined', () => {
        expect(() => createGroupEncounter({ participantIds: ['p1'], enemies: [makeEnemy()] }))
            .toThrow("type deve ser 'group_trainer' ou 'boss'");
    });

    it('deve lançar erro se enemies for vazio', () => {
        expect(() => createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [] }))
            .toThrow('enemies deve ser array não vazio');
    });

    it('deve lançar erro se enemies não for array', () => {
        expect(() => createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: null }))
            .toThrow('enemies deve ser array não vazio');
    });

    it('deve gerar IDs únicos em chamadas consecutivas', () => {
        const enc1 = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        const enc2 = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        // IDs são únicos graças ao contador monotónico (timestamp * 1000 + contador)
        expect(typeof enc1.id).toBe('number');
        expect(typeof enc2.id).toBe('number');
        expect(enc1.id).not.toBe(enc2.id);
    });
});

// ── validateGroupEncounter ────────────────────────────────────────────────

describe('validateGroupEncounter - Validação de Estrutura', () => {

    it('deve retornar valid=true para encounter bem inicializado', () => {
        const enc = createGroupEncounter({
            participantIds: ['p1'],
            type: 'group_trainer',
            enemies: [makeEnemy()]
        });
        enc.turnOrder = [{ side: 'player', id: 'p1', name: 'Ana', spd: 5 }];

        const result = validateGroupEncounter(enc);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('deve retornar valid=false para encounter null', () => {
        const result = validateGroupEncounter(null);
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toMatch(/null/);
    });

    it('deve detectar type inválido', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.type = 'wild';
        const result = validateGroupEncounter(enc);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('type'))).toBe(true);
    });

    it('deve detectar participants vazio', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.participants = [];
        const result = validateGroupEncounter(enc);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('participants'))).toBe(true);
    });

    it('deve detectar enemies vazio', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.enemies = [];
        const result = validateGroupEncounter(enc);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('enemies'))).toBe(true);
    });

    it('deve detectar turnOrder não-array', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.turnOrder = null;
        const result = validateGroupEncounter(enc);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('turnOrder'))).toBe(true);
    });

    it('deve detectar turnIndex não-número', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.turnIndex = '0';
        const result = validateGroupEncounter(enc);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('turnIndex'))).toBe(true);
    });

    it('deve acumular múltiplos erros', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.type = 'bad';
        enc.participants = [];
        const result = validateGroupEncounter(enc);
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
});

// ── assertValidActor ──────────────────────────────────────────────────────

describe('assertValidActor - Guard de Ator', () => {

    it('não deve lançar erro quando ator e turnOrder são válidos', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.turnOrder = [{ side: 'player', id: 'p1', name: 'Ana', spd: 5 }];
        const actor = getCurrentActor(enc);

        expect(() => assertValidActor(actor, enc, 'teste')).not.toThrow();
    });

    it('deve lançar erro descritivo quando turnOrder é vazio', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        // turnOrder vazio (padrão da fábrica)

        expect(() => assertValidActor(null, enc, 'inicioTurno'))
            .toThrow('turnOrder vazio');
    });

    it('deve lançar erro descritivo quando actor é null mesmo com turnOrder preenchido', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.turnOrder = [{ side: 'player', id: 'p1', name: 'Ana', spd: 5 }];
        enc.turnIndex = 99; // fora do array

        const actor = getCurrentActor(enc); // retorna null
        expect(actor).toBeNull();

        expect(() => assertValidActor(actor, enc, 'contextoTeste'))
            .toThrow('currentActor é null');
    });

    it('deve lançar erro quando encounter é null', () => {
        expect(() => assertValidActor(null, null, 'teste'))
            .toThrow();
    });
});

// ── getCurrentActor ───────────────────────────────────────────────────────

describe('getCurrentActor - Leitura de Ator Atual', () => {

    it('deve retornar ator no índice correto', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.turnOrder = [
            { side: 'player', id: 'p1', name: 'Ana', spd: 8 },
            { side: 'enemy',  id: 0,    name: 'Inimigo', spd: 3 }
        ];
        enc.turnIndex = 1;

        const actor = getCurrentActor(enc);
        expect(actor.side).toBe('enemy');
        expect(actor.id).toBe(0);
    });

    it('deve retornar null quando enc é null', () => {
        expect(getCurrentActor(null)).toBeNull();
    });

    it('deve retornar null quando turnOrder é vazio', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        expect(getCurrentActor(enc)).toBeNull();
    });

    it('deve retornar null quando turnIndex está fora do array', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.turnOrder = [{ side: 'player', id: 'p1', name: 'Ana', spd: 5 }];
        enc.turnIndex = 5;
        expect(getCurrentActor(enc)).toBeNull();
    });
});

// ── hasAlivePlayers / hasAliveEnemies ─────────────────────────────────────

describe('hasAlivePlayers - Detecção de Jogadores Vivos', () => {

    it('deve retornar true quando jogador participante tem monstro vivo', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        const players = [makePlayer('p1', 25)];
        expect(hasAlivePlayers(enc, players)).toBe(true);
    });

    it('deve retornar false quando monstro está com HP=0', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        const players = [makePlayer('p1', 0)];
        expect(hasAlivePlayers(enc, players)).toBe(false);
    });

    it('deve ignorar jogadores que não estão em participants', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        const players = [
            makePlayer('p1', 0),  // participante com HP=0
            makePlayer('p2', 30)  // NÃO participante com HP>0
        ];
        // Apenas p1 está em participants — resultado deve ser false
        expect(hasAlivePlayers(enc, players)).toBe(false);
    });

    it('deve retornar true se qualquer participante tem monstro vivo', () => {
        const enc = createGroupEncounter({ participantIds: ['p1', 'p2'], type: 'group_trainer', enemies: [makeEnemy()] });
        const players = [makePlayer('p1', 0), makePlayer('p2', 30)];
        expect(hasAlivePlayers(enc, players)).toBe(true);
    });
});

describe('hasAliveEnemies - Detecção de Inimigos Vivos', () => {

    it('deve retornar true quando há inimigo vivo', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy({ hp: 20 })] });
        expect(hasAliveEnemies(enc)).toBe(true);
    });

    it('deve retornar false quando todos os inimigos estão com HP=0', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy({ hp: 0 })] });
        expect(hasAliveEnemies(enc)).toBe(false);
    });

    it('deve retornar true se pelo menos um inimigo está vivo', () => {
        const enc = createGroupEncounter({
            participantIds: ['p1'],
            type: 'group_trainer',
            enemies: [makeEnemy({ hp: 0 }), makeEnemy({ hp: 15 })]
        });
        expect(hasAliveEnemies(enc)).toBe(true);
    });

    it('deve retornar false para enemies array vazio', () => {
        const enc = createGroupEncounter({ participantIds: ['p1'], type: 'group_trainer', enemies: [makeEnemy()] });
        enc.enemies = []; // simular estado inválido pós-batalha
        expect(hasAliveEnemies(enc)).toBe(false);
    });
});
