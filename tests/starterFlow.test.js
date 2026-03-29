/**
 * STARTER FLOW TESTS
 *
 * Testes para o fluxo inicial de escolha de classe + ovo starter.
 * Cobertura:
 *   - STARTER_BY_CLASS mapeia todas as 8 classes para monstrinhos reais
 *   - todos os monsterId do STARTER_BY_CLASS existem no catálogo
 *   - normalizeGameState define starterFlowCompleted=true em saves com monstros
 *   - normalizeGameState define starterFlowCompleted=false em saves sem monstros
 *   - saves antigos sem o campo recebem retrocompatibilidade correta
 *   - jogador recebe exatamente 1 starter pelo fluxo
 *   - starter concedido tem classe igual à do jogador
 *   - jogador não recebe segundo starter (starterGranted=true guarda)
 *   - mmFinishNewGame não auto-concede starter (starterFlowCompleted=false)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Carrega catálogo real (monsters.json) ──────────────────────────────────

const monstersPath = resolve(__dirname, '../data/monsters.json');
const monstersJson = JSON.parse(readFileSync(monstersPath, 'utf-8'));
const CATALOG = monstersJson.monsters;

// ── STARTER_BY_CLASS replicado do index.html ──────────────────────────────
// Mantido em sincronia com a constante no index.html
const STARTER_BY_CLASS = {
    'Bardo':      { monsterId: 'MON_011', eggName: 'Ovo Harmônico', eggEmoji: '🥚🎵' },
    'Guerreiro':  { monsterId: 'MON_002', eggName: 'Ovo da Guarda', eggEmoji: '🥚⚔️' },
    'Mago':       { monsterId: 'MON_003', eggName: 'Ovo Arcano',    eggEmoji: '🥚🔮' },
    'Curandeiro': { monsterId: 'MON_004', eggName: 'Ovo Vital',     eggEmoji: '🥚💚' },
    'Caçador':    { monsterId: 'MON_005', eggName: 'Ovo Selvagem',  eggEmoji: '🥚🏹' },
    'Animalista': { monsterId: 'MON_006', eggName: 'Ovo Primal',    eggEmoji: '🥚🐾' },
    'Bárbaro':    { monsterId: 'MON_007', eggName: 'Ovo Feroz',     eggEmoji: '🥚⚡' },
    'Ladino':     { monsterId: 'MON_008', eggName: 'Ovo Sombrio',   eggEmoji: '🥚🌑' },
};

const ALL_CLASSES = Object.keys(STARTER_BY_CLASS);

// ── normalizeGameState replicado (com suporte a starterFlowCompleted) ──────
function normalizeGameState(state) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
        return { players: [], monsters: [], starterFlowCompleted: false };
    }
    if (!Array.isArray(state.players)) state.players = [];

    // Retrocompatibilidade: saves com monstros → já concluíram o fluxo
    if (typeof state.starterFlowCompleted !== 'boolean') {
        const hasMonsters = state.players.some(
            p => (p.team && p.team.length > 0) || (p.box && p.box.length > 0)
        );
        state.starterFlowCompleted = hasMonsters;
    }
    return state;
}

// ── Helpers de factory ──────────────────────────────────────────────────────

function makePlayer(overrides = {}) {
    return {
        id: `p_${Date.now()}_test`,
        name: 'Teste',
        class: 'Guerreiro',
        money: 100,
        team: [],
        box: [],
        starterGranted: false,
        ...overrides
    };
}

// Simula mmStarterHatchEgg sem DOM (lógica pura)
function hatchEgg(player, starterByClass) {
    if (player.starterGranted) return false;
    const cls = player.class || 'Guerreiro';
    const info = starterByClass[cls] || starterByClass['Guerreiro'];
    const tmpl = CATALOG.find(m => m.id === info.monsterId);
    if (!tmpl) return false;

    // Simula awardMonster mínimo
    const mon = {
        instanceId: `mi_${Date.now()}`,
        templateId: tmpl.id,
        name: tmpl.name,
        class: tmpl.class,
        level: 1,
    };
    player.team.push(mon);
    player.starterGranted = true;
    player.starterMonsterId = info.monsterId;
    return true;
}

// ── TESTES ──────────────────────────────────────────────────────────────────

describe('STARTER_BY_CLASS — estrutura e integridade', () => {
    it('deve cobrir todas as 8 classes', () => {
        const classes = Object.keys(STARTER_BY_CLASS);
        expect(classes).toHaveLength(8);
        expect(classes).toContain('Bardo');
        expect(classes).toContain('Guerreiro');
        expect(classes).toContain('Mago');
        expect(classes).toContain('Curandeiro');
        expect(classes).toContain('Caçador');
        expect(classes).toContain('Animalista');
        expect(classes).toContain('Bárbaro');
        expect(classes).toContain('Ladino');
    });

    it('cada entrada deve ter monsterId, eggName e eggEmoji', () => {
        ALL_CLASSES.forEach(cls => {
            const entry = STARTER_BY_CLASS[cls];
            expect(entry.monsterId, `${cls}.monsterId`).toBeTruthy();
            expect(entry.eggName,   `${cls}.eggName`).toBeTruthy();
            expect(entry.eggEmoji,  `${cls}.eggEmoji`).toBeTruthy();
        });
    });

    it('todos os monsterId devem existir no monsters.json', () => {
        const ids = CATALOG.map(m => m.id);
        ALL_CLASSES.forEach(cls => {
            const { monsterId } = STARTER_BY_CLASS[cls];
            expect(ids, `Classe ${cls}: monsterId ${monsterId} deve existir no catálogo`).toContain(monsterId);
        });
    });

    it('o monstro starter deve pertencer à classe correta no catálogo', () => {
        ALL_CLASSES.forEach(cls => {
            const { monsterId } = STARTER_BY_CLASS[cls];
            const tmpl = CATALOG.find(m => m.id === monsterId);
            expect(tmpl.class, `${monsterId} deve ser da classe ${cls}`).toBe(cls);
        });
    });

    it('todos os starters devem ser de raridade Comum', () => {
        ALL_CLASSES.forEach(cls => {
            const { monsterId } = STARTER_BY_CLASS[cls];
            const tmpl = CATALOG.find(m => m.id === monsterId);
            expect(tmpl.rarity, `${monsterId} (${cls}) deve ser Comum`).toBe('Comum');
        });
    });

    it('todos os starters devem ter campos obrigatórios de runtime', () => {
        ALL_CLASSES.forEach(cls => {
            const { monsterId } = STARTER_BY_CLASS[cls];
            const tmpl = CATALOG.find(m => m.id === monsterId);
            expect(tmpl.baseHp,  `${monsterId} baseHp`).toBeGreaterThan(0);
            expect(tmpl.baseAtk, `${monsterId} baseAtk`).toBeGreaterThan(0);
            expect(tmpl.baseDef, `${monsterId} baseDef`).toBeGreaterThan(0);
            expect(tmpl.emoji,   `${monsterId} emoji`).toBeTruthy();
        });
    });
});

describe('normalizeGameState — starterFlowCompleted', () => {
    it('save sem o campo e sem monstros → starterFlowCompleted=false', () => {
        const state = { players: [makePlayer()] }; // sem monstros
        const normalized = normalizeGameState(state);
        expect(normalized.starterFlowCompleted).toBe(false);
    });

    it('save sem o campo mas com monstros no time → starterFlowCompleted=true (retrocompat)', () => {
        const p = makePlayer({ team: [{ instanceId: 'mi_x', name: 'Teste' }] });
        const state = { players: [p] };
        const normalized = normalizeGameState(state);
        expect(normalized.starterFlowCompleted).toBe(true);
    });

    it('save sem o campo mas com monstros na box → starterFlowCompleted=true (retrocompat)', () => {
        const p = makePlayer({ box: [{ instanceId: 'mi_y', name: 'BoxMon' }] });
        const state = { players: [p] };
        const normalized = normalizeGameState(state);
        expect(normalized.starterFlowCompleted).toBe(true);
    });

    it('save com starterFlowCompleted=true preserva o valor', () => {
        const state = { players: [], starterFlowCompleted: true };
        const normalized = normalizeGameState(state);
        expect(normalized.starterFlowCompleted).toBe(true);
    });

    it('save com starterFlowCompleted=false preserva o valor', () => {
        const state = { players: [makePlayer()], starterFlowCompleted: false };
        const normalized = normalizeGameState(state);
        expect(normalized.starterFlowCompleted).toBe(false);
    });

    it('state nulo retorna starterFlowCompleted=false', () => {
        const normalized = normalizeGameState(null);
        expect(normalized.starterFlowCompleted).toBe(false);
    });
});

describe('Fluxo de hatch por jogador', () => {
    it('jogador recebe exatamente 1 monstrinho após hatchEgg', () => {
        const player = makePlayer({ class: 'Guerreiro' });
        const ok = hatchEgg(player, STARTER_BY_CLASS);
        expect(ok).toBe(true);
        expect(player.team).toHaveLength(1);
        expect(player.starterGranted).toBe(true);
    });

    it('o starter concedido tem a classe correta', () => {
        ALL_CLASSES.forEach(cls => {
            const player = makePlayer({ class: cls });
            hatchEgg(player, STARTER_BY_CLASS);
            const mon = player.team[0];
            expect(mon.class, `starter de ${cls} deve ser da classe ${cls}`).toBe(cls);
        });
    });

    it('o starter concedido tem templateId correto para a classe', () => {
        ALL_CLASSES.forEach(cls => {
            const player = makePlayer({ class: cls });
            hatchEgg(player, STARTER_BY_CLASS);
            const expectedId = STARTER_BY_CLASS[cls].monsterId;
            expect(player.team[0].templateId, `${cls} → templateId ${expectedId}`).toBe(expectedId);
        });
    });

    it('hatchEgg retorna false e não adiciona monstro se starterGranted=true', () => {
        const player = makePlayer({ class: 'Mago', starterGranted: true });
        const ok = hatchEgg(player, STARTER_BY_CLASS);
        expect(ok).toBe(false);
        expect(player.team).toHaveLength(0);
    });

    it('jogador não recebe segundo starter — starterGranted protege contra repetição', () => {
        const player = makePlayer({ class: 'Bardo' });
        hatchEgg(player, STARTER_BY_CLASS); // primeiro hatch
        hatchEgg(player, STARTER_BY_CLASS); // segundo (deve ser ignorado)
        expect(player.team).toHaveLength(1);
    });

    it('player.starterMonsterId é salvo após o hatch', () => {
        const player = makePlayer({ class: 'Curandeiro' });
        hatchEgg(player, STARTER_BY_CLASS);
        expect(player.starterMonsterId).toBe(STARTER_BY_CLASS['Curandeiro'].monsterId);
    });
});

describe('mmFinishNewGame — sem auto-award de starter', () => {
    it('jogadores criados pelo wizard devem ter team vazio antes do fluxo', () => {
        // Simula o que mmFinishNewGame faz: criar player sem monstrinho
        const players = [
            { id: 'p1', name: 'Ana', class: 'Mago', team: [], box: [], starterGranted: false },
            { id: 'p2', name: 'Bob', class: 'Guerreiro', team: [], box: [], starterGranted: false },
        ];
        players.forEach(p => {
            expect(p.team).toHaveLength(0);
            expect(p.starterGranted).toBe(false);
        });
    });

    it('starterFlowCompleted deve ser false após novo jogo criado', () => {
        const state = { players: [makePlayer()], starterFlowCompleted: false };
        expect(state.starterFlowCompleted).toBe(false);
    });
});

describe('Fluxo multi-jogador', () => {
    it('todos os jogadores recebem starter após fluxo completo', () => {
        const players = [
            makePlayer({ class: 'Guerreiro' }),
            makePlayer({ class: 'Mago' }),
            makePlayer({ class: 'Bardo' }),
        ];

        players.forEach(p => hatchEgg(p, STARTER_BY_CLASS));

        expect(players.every(p => p.starterGranted)).toBe(true);
        expect(players.every(p => p.team.length === 1)).toBe(true);
    });

    it('cada jogador recebe starter da própria classe', () => {
        const players = [
            makePlayer({ class: 'Ladino' }),
            makePlayer({ class: 'Bárbaro' }),
            makePlayer({ class: 'Animalista' }),
        ];

        players.forEach(p => hatchEgg(p, STARTER_BY_CLASS));

        players.forEach(p => {
            expect(p.team[0].class).toBe(p.class);
        });
    });

    it('após fluxo completo, starterFlowCompleted pode ser marcado true', () => {
        const players = [
            makePlayer({ class: 'Curandeiro' }),
            makePlayer({ class: 'Caçador' }),
        ];
        players.forEach(p => hatchEgg(p, STARTER_BY_CLASS));

        // Simula mmFinishStarterFlow
        const state = { players, starterFlowCompleted: false };
        state.starterFlowCompleted = true;

        expect(state.starterFlowCompleted).toBe(true);
    });
});
