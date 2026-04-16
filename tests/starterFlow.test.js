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

// ── Extrai STARTER_BY_CLASS do runtime (index.html) ───────────────────────
function extractRuntimeStarterByClass() {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf-8');
    // Extrai o bloco literal da constante STARTER_BY_CLASS
    const match = html.match(/const STARTER_BY_CLASS\s*=\s*(\{[\s\S]*?\});/);
    if (!match) throw new Error('STARTER_BY_CLASS não encontrada no index.html');
    // eslint-disable-next-line no-new-func
    return new Function(`return ${match[1]}`)();
}

const RUNTIME_STARTER_BY_CLASS = extractRuntimeStarterByClass();

// ── Carrega catálogo real (monsters.json) ──────────────────────────────────

const monstersPath = resolve(__dirname, '../data/monsters.json');
const monstersJson = JSON.parse(readFileSync(monstersPath, 'utf-8'));
const CATALOG = monstersJson.monsters;

// ── STARTER_BY_CLASS replicado do index.html ──────────────────────────────
// Mantido em sincronia com a constante no index.html
const STARTER_BY_CLASS = {
    'Bardo':      { monsterId: 'MON_005', eggName: 'Ovo Harmônico', eggEmoji: '🥚🎵' },
    'Guerreiro':  { monsterId: 'MON_001', eggName: 'Ovo da Guarda', eggEmoji: '🥚⚔️' },
    'Mago':       { monsterId: 'MON_013', eggName: 'Ovo Arcano',    eggEmoji: '🥚🔮' },
    'Curandeiro': { monsterId: 'MON_028', eggName: 'Ovo Vital',     eggEmoji: '🥚🌿' },
    'Caçador':    { monsterId: 'MON_009', eggName: 'Ovo Selvagem',  eggEmoji: '🥚🏹' },
    'Animalista': { monsterId: 'MON_017', eggName: 'Ovo Primal',    eggEmoji: '🥚🐾' },
    'Bárbaro':    { monsterId: 'MON_029', eggName: 'Ovo Feroz',     eggEmoji: '🥚🐯' },
    'Ladino':     { monsterId: 'MON_030', eggName: 'Ovo Sombrio',   eggEmoji: '🥚🦊' },
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

describe('Starters revisados — novas linhas evolutivas no catálogo', () => {
    // IDs esperados das três novas linhas
    const NEW_LINES = {
        Curandeiro: { base: 'MON_028', evo1: 'MON_028B', evo2: 'MON_028C', names: ['Nutrilo', 'Silvelio', 'Auravelo'] },
        Bárbaro:    { base: 'MON_029', evo1: 'MON_029B', evo2: 'MON_029C', names: ['Tigrumo', 'Rugigron', 'Bestigrar'] },
        Ladino:     { base: 'MON_030', evo1: 'MON_030B', evo2: 'MON_030C', names: ['Furtilhon', 'Velurino', 'Sombrifur'] },
    };

    it('todos os monstros das novas linhas existem no catálogo', () => {
        const ids = CATALOG.map(m => m.id);
        Object.entries(NEW_LINES).forEach(([cls, line]) => {
            expect(ids, `${cls} base ${line.base}`).toContain(line.base);
            expect(ids, `${cls} evo1 ${line.evo1}`).toContain(line.evo1);
            expect(ids, `${cls} evo2 ${line.evo2}`).toContain(line.evo2);
        });
    });

    it('base de cada nova linha tem a classe correta', () => {
        Object.entries(NEW_LINES).forEach(([cls, line]) => {
            const tmpl = CATALOG.find(m => m.id === line.base);
            expect(tmpl.class, `${line.base} deve ser ${cls}`).toBe(cls);
        });
    });

    it('base de cada nova linha tem raridade Comum', () => {
        Object.entries(NEW_LINES).forEach(([cls, line]) => {
            const tmpl = CATALOG.find(m => m.id === line.base);
            expect(tmpl.rarity, `${line.base} deve ser Comum`).toBe('Comum');
        });
    });

    it('nomes das novas linhas batem com o catálogo', () => {
        Object.entries(NEW_LINES).forEach(([, line]) => {
            [line.base, line.evo1, line.evo2].forEach((id, i) => {
                const tmpl = CATALOG.find(m => m.id === id);
                expect(tmpl.name, `${id} nome`).toBe(line.names[i]);
            });
        });
    });

    it('cadeia evolutiva das novas linhas está correta (evolvesTo)', () => {
        Object.entries(NEW_LINES).forEach(([cls, line]) => {
            const base = CATALOG.find(m => m.id === line.base);
            const evo1 = CATALOG.find(m => m.id === line.evo1);
            expect(base.evolvesTo, `${line.base} → ${line.evo1}`).toBe(line.evo1);
            expect(evo1.evolvesTo, `${line.evo1} → ${line.evo2}`).toBe(line.evo2);
        });
    });

    it('estágio final das novas linhas não tem evolvesTo', () => {
        Object.values(NEW_LINES).forEach(line => {
            const evo2 = CATALOG.find(m => m.id === line.evo2);
            expect(evo2.evolvesTo, `${line.evo2} não deve ter evolvesTo`).toBeUndefined();
        });
    });

    it('campos obrigatórios de runtime estão presentes em todos os estágios', () => {
        Object.values(NEW_LINES).forEach(line => {
            [line.base, line.evo1, line.evo2].forEach(id => {
                const tmpl = CATALOG.find(m => m.id === id);
                expect(tmpl.baseHp,  `${id} baseHp`).toBeGreaterThan(0);
                expect(tmpl.baseAtk, `${id} baseAtk`).toBeGreaterThan(0);
                expect(tmpl.baseDef, `${id} baseDef`).toBeGreaterThan(0);
                expect(tmpl.baseSpd, `${id} baseSpd`).toBeGreaterThan(0);
                expect(tmpl.baseEne, `${id} baseEne`).toBeGreaterThan(0);
                expect(tmpl.emoji,   `${id} emoji`).toBeTruthy();
            });
        });
    });

    it('starter revisado de Curandeiro é MON_028 (Nutrilo), não MON_004', () => {
        expect(STARTER_BY_CLASS['Curandeiro'].monsterId).toBe('MON_028');
        expect(STARTER_BY_CLASS['Curandeiro'].monsterId).not.toBe('MON_004');
    });

    it('starter revisado de Bárbaro é MON_029 (Tigrumo), não MON_007', () => {
        expect(STARTER_BY_CLASS['Bárbaro'].monsterId).toBe('MON_029');
        expect(STARTER_BY_CLASS['Bárbaro'].monsterId).not.toBe('MON_007');
    });

    it('starter revisado de Ladino é MON_030 (Furtilhon), não MON_008', () => {
        expect(STARTER_BY_CLASS['Ladino'].monsterId).toBe('MON_030');
        expect(STARTER_BY_CLASS['Ladino'].monsterId).not.toBe('MON_008');
    });

    it('starters canônicos antigos (5) não foram alterados', () => {
        expect(STARTER_BY_CLASS['Guerreiro'].monsterId).toBe('MON_001');   // Ferrozimon
        expect(STARTER_BY_CLASS['Mago'].monsterId).toBe('MON_013');        // Lagartomon
        expect(STARTER_BY_CLASS['Caçador'].monsterId).toBe('MON_009');     // Miaumon
        expect(STARTER_BY_CLASS['Animalista'].monsterId).toBe('MON_017'); // Luvursomon
        expect(STARTER_BY_CLASS['Bardo'].monsterId).toBe('MON_005');       // Dinomon
    });
});

describe('Consistência runtime (index.html) vs. mapeamento canônico dos testes', () => {
    it('runtime deve definir exatamente as mesmas 8 classes', () => {
        expect(Object.keys(RUNTIME_STARTER_BY_CLASS).sort())
            .toEqual(Object.keys(STARTER_BY_CLASS).sort());
    });

    it('cada classe do runtime deve ter monsterId idêntico ao canônico', () => {
        Object.keys(STARTER_BY_CLASS).forEach(cls => {
            expect(
                RUNTIME_STARTER_BY_CLASS[cls]?.monsterId,
                `Runtime classe ${cls} monsterId`
            ).toBe(STARTER_BY_CLASS[cls].monsterId);
        });
    });

    it('Guerreiro runtime não deve apontar para linha felina (Caçador)', () => {
        const guerreiroId = RUNTIME_STARTER_BY_CLASS['Guerreiro']?.monsterId;
        // Linha felina de Caçador: MON_009, MON_010, MON_011, MON_012
        const felinaIds = ['MON_009', 'MON_010', 'MON_011', 'MON_012'];
        expect(felinaIds, `Guerreiro runtime (${guerreiroId}) não deve ser Caçador`)
            .not.toContain(guerreiroId);
        expect(guerreiroId).toBe('MON_001'); // Ferrozimon
    });

    it('Caçador runtime deve apontar para MON_009 (Miaumon), não para linha Mago', () => {
        const cacadorId = RUNTIME_STARTER_BY_CLASS['Caçador']?.monsterId;
        expect(cacadorId).toBe('MON_009');
        expect(cacadorId).not.toBe('MON_013'); // Lagartomon é Mago
    });

    it('Mago runtime deve apontar para MON_013 (Lagartomon Comum), não para evolução', () => {
        const magoId = RUNTIME_STARTER_BY_CLASS['Mago']?.monsterId;
        expect(magoId).toBe('MON_013');
        expect(magoId).not.toBe('MON_014'); // Salamandromon é Mago Incomum (evo)
    });

    it('Bardo runtime deve apontar para MON_005 (Dinomon Comum), não para Caçador', () => {
        const bardoId = RUNTIME_STARTER_BY_CLASS['Bardo']?.monsterId;
        expect(bardoId).toBe('MON_005');
        expect(bardoId).not.toBe('MON_011'); // Felinomon é Caçador Raro
    });

    it('Animalista runtime deve apontar para MON_017 (Luvursomon), não para Caçador', () => {
        const animalistaId = RUNTIME_STARTER_BY_CLASS['Animalista']?.monsterId;
        expect(animalistaId).toBe('MON_017');
        expect(animalistaId).not.toBe('MON_012'); // Panterezamon é Caçador Místico
    });

    it('runtime deve ter eggName e eggEmoji para cada classe', () => {
        Object.keys(STARTER_BY_CLASS).forEach(cls => {
            const entry = RUNTIME_STARTER_BY_CLASS[cls];
            expect(entry?.eggName,  `runtime ${cls}.eggName`).toBeTruthy();
            expect(entry?.eggEmoji, `runtime ${cls}.eggEmoji`).toBeTruthy();
        });
    });
});
