/**
 * BATTLE SWAP TESTS (Fase 20 — PR20)
 *
 * Testes para as funções puras de categorização e validação de troca de
 * monstrinhos em batalha.
 *
 * Cobertura:
 *   - categorizeBattleTeam: equipes mistas, masterMode, dados ausentes
 *   - hasEligibleSwap: com e sem substitutos válidos
 *   - getSwapStatus: todos os estados possíveis (active/eligible/blocked_class/blocked_ko)
 *   - canManualSwap: ativo vivo/morto, com/sem substituto, edge cases
 */

import { describe, it, expect } from 'vitest';
import {
    categorizeBattleTeam,
    hasEligibleSwap,
    getSwapStatus,
    canManualSwap
} from '../js/combat/battleSwap.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeMonster(overrides = {}) {
    return {
        id: overrides.id !== undefined ? overrides.id : 'm1',
        name: overrides.name !== undefined ? overrides.name : 'TestMon',
        class: overrides.class !== undefined ? overrides.class : 'Guerreiro',
        hp: overrides.hp !== undefined ? overrides.hp : 30,
        hpMax: overrides.hpMax !== undefined ? overrides.hpMax : 50,
        level: overrides.level !== undefined ? overrides.level : 1,
        ...overrides
    };
}

function makePlayer(overrides = {}) {
    return {
        id: overrides.id !== undefined ? overrides.id : 'p1',
        name: overrides.name !== undefined ? overrides.name : 'Treinador',
        class: overrides.class !== undefined ? overrides.class : 'Guerreiro',
        activeIndex: overrides.activeIndex !== undefined ? overrides.activeIndex : 0,
        team: overrides.team !== undefined ? overrides.team : []
    };
}

// Equipe mista para a maioria dos testes:
//   [0] Guerreiro vivo (ativo)
//   [1] Guerreiro vivo (elegível)
//   [2] Mago vivo (fora da classe)
//   [3] Guerreiro derrotado (KO)
function makeMixedTeam() {
    return [
        makeMonster({ id: 'm0', name: 'AtivaMon', class: 'Guerreiro', hp: 30 }),   // [0] ativo
        makeMonster({ id: 'm1', name: 'ReservaMon', class: 'Guerreiro', hp: 25 }), // [1] elegível
        makeMonster({ id: 'm2', name: 'MagoMon', class: 'Mago', hp: 20 }),         // [2] fora da classe
        makeMonster({ id: 'm3', name: 'KOMon', class: 'Guerreiro', hp: 0 })        // [3] KO
    ];
}

// ─── categorizeBattleTeam ─────────────────────────────────────────────────────

describe('categorizeBattleTeam', () => {

    describe('Equipe mista — classe Guerreiro, activeIndex=0', () => {
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team: makeMixedTeam() });
        const cats = categorizeBattleTeam(player);

        it('ativo: apenas o índice 0', () => {
            expect(cats.active).toHaveLength(1);
            expect(cats.active[0].index).toBe(0);
        });

        it('elegível: apenas o índice 1 (Guerreiro vivo, não-ativo)', () => {
            expect(cats.eligible).toHaveLength(1);
            expect(cats.eligible[0].index).toBe(1);
        });

        it('blocked_class: apenas o índice 2 (Mago vivo)', () => {
            expect(cats.blocked_class).toHaveLength(1);
            expect(cats.blocked_class[0].index).toBe(2);
        });

        it('blocked_ko: apenas o índice 3 (Guerreiro morto)', () => {
            expect(cats.blocked_ko).toHaveLength(1);
            expect(cats.blocked_ko[0].index).toBe(3);
        });

        it('soma total = tamanho da equipe', () => {
            const total = cats.active.length + cats.eligible.length + cats.blocked_class.length + cats.blocked_ko.length;
            expect(total).toBe(4);
        });
    });

    describe('masterMode desativa restrição de classe', () => {
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team: makeMixedTeam() });
        const cats = categorizeBattleTeam(player, { masterMode: true });

        it('Mago vivo passa a ser elegível com masterMode', () => {
            // índice 1 (Guerreiro) e índice 2 (Mago) devem ser elegíveis
            expect(cats.eligible).toHaveLength(2);
        });

        it('blocked_class fica vazio com masterMode', () => {
            expect(cats.blocked_class).toHaveLength(0);
        });
    });

    describe('Equipe com todos KO (exceto ativo)', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Guerreiro', hp: 0 }),
            makeMonster({ class: 'Guerreiro', hp: 0 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const cats = categorizeBattleTeam(player);

        it('sem elegíveis', () => { expect(cats.eligible).toHaveLength(0); });
        it('dois KO', () => { expect(cats.blocked_ko).toHaveLength(2); });
    });

    describe('Equipe só com ativo', () => {
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team: [makeMonster({ class: 'Guerreiro', hp: 30 })] });
        const cats = categorizeBattleTeam(player);

        it('só ativo, sem elegíveis nem bloqueados', () => {
            expect(cats.active).toHaveLength(1);
            expect(cats.eligible).toHaveLength(0);
            expect(cats.blocked_class).toHaveLength(0);
            expect(cats.blocked_ko).toHaveLength(0);
        });
    });

    describe('Jogador null ou team inválido', () => {
        it('player null → todas as categorias vazias', () => {
            const cats = categorizeBattleTeam(null);
            expect(cats.active).toHaveLength(0);
            expect(cats.eligible).toHaveLength(0);
            expect(cats.blocked_class).toHaveLength(0);
            expect(cats.blocked_ko).toHaveLength(0);
        });

        it('team não-array → todas as categorias vazias', () => {
            const cats = categorizeBattleTeam({ team: null });
            expect(cats.eligible).toHaveLength(0);
        });
    });

    describe('activeIndex inválido (ausente → 0)', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Guerreiro', hp: 25 })
        ];
        const player = { id: 'p1', class: 'Guerreiro', team }; // sem activeIndex

        it('usa índice 0 como ativo por padrão', () => {
            const cats = categorizeBattleTeam(player);
            expect(cats.active[0].index).toBe(0);
            expect(cats.eligible[0].index).toBe(1);
        });
    });

    describe('Monstrinho sem classe', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: '', hp: 25 }) // sem classe
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });

        it('monstrinho sem classe vai para blocked_class', () => {
            const cats = categorizeBattleTeam(player);
            expect(cats.blocked_class).toHaveLength(1);
        });
    });
});

// ─── hasEligibleSwap ──────────────────────────────────────────────────────────

describe('hasEligibleSwap', () => {

    it('true quando há substituto da mesma classe vivo', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Guerreiro', hp: 25 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        expect(hasEligibleSwap(player)).toBe(true);
    });

    it('false quando todos substitutos são de outra classe', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Mago', hp: 25 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        expect(hasEligibleSwap(player)).toBe(false);
    });

    it('false quando todos substitutos estão KO', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Guerreiro', hp: 0 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        expect(hasEligibleSwap(player)).toBe(false);
    });

    it('true com masterMode mesmo com classes diferentes', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Mago', hp: 25 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        expect(hasEligibleSwap(player, { masterMode: true })).toBe(true);
    });

    it('false com player null', () => {
        expect(hasEligibleSwap(null)).toBe(false);
    });
});

// ─── getSwapStatus ────────────────────────────────────────────────────────────

describe('getSwapStatus', () => {
    const player = makePlayer({ class: 'Guerreiro', activeIndex: 0 });

    it('ativo → category active, label "▶ Ativo"', () => {
        const mon = makeMonster({ class: 'Guerreiro', hp: 30 });
        const status = getSwapStatus(mon, 0, player);
        expect(status.category).toBe('active');
        expect(status.label).toContain('Ativo');
    });

    it('elegível → category eligible, label "✔ Pode entrar"', () => {
        const mon = makeMonster({ class: 'Guerreiro', hp: 25 });
        const status = getSwapStatus(mon, 1, player);
        expect(status.category).toBe('eligible');
        expect(status.label).toContain('Pode entrar');
    });

    it('classe diferente → category blocked_class, label "✖ Fora da classe"', () => {
        const mon = makeMonster({ class: 'Mago', hp: 20 });
        const status = getSwapStatus(mon, 2, player);
        expect(status.category).toBe('blocked_class');
        expect(status.label).toContain('Fora da classe');
    });

    it('classe diferente → title menciona ambas as classes', () => {
        const mon = makeMonster({ class: 'Bardo', hp: 20 });
        const status = getSwapStatus(mon, 2, player);
        expect(status.title).toContain('Bardo');
        expect(status.title).toContain('Guerreiro');
    });

    it('hp=0 → category blocked_ko, label "💀 Derrotado"', () => {
        const mon = makeMonster({ class: 'Guerreiro', hp: 0 });
        const status = getSwapStatus(mon, 1, player);
        expect(status.category).toBe('blocked_ko');
        expect(status.label).toContain('Derrotado');
    });

    it('masterMode + classe diferente → eligible', () => {
        const mon = makeMonster({ class: 'Mago', hp: 20 });
        const status = getSwapStatus(mon, 1, player, { masterMode: true });
        expect(status.category).toBe('eligible');
    });

    it('monstrinho null → blocked_ko', () => {
        const status = getSwapStatus(null, 0, player);
        expect(status.category).toBe('blocked_ko');
    });

    it('player null → blocked_ko', () => {
        const mon = makeMonster({ class: 'Guerreiro', hp: 30 });
        const status = getSwapStatus(mon, 0, null);
        expect(status.category).toBe('blocked_ko');
    });

    it('monstrinho sem classe → blocked_class', () => {
        const mon = makeMonster({ class: '', hp: 20 });
        const status = getSwapStatus(mon, 1, player);
        expect(status.category).toBe('blocked_class');
    });

    it('jogador sem classe → blocked_class (para monstrinho vivo não-ativo)', () => {
        const playerNoClass = makePlayer({ class: '', activeIndex: 0 });
        const mon = makeMonster({ class: 'Guerreiro', hp: 25 });
        const status = getSwapStatus(mon, 1, playerNoClass);
        expect(status.category).toBe('blocked_class');
    });
});

// ─── canManualSwap ────────────────────────────────────────────────────────────

describe('canManualSwap', () => {

    it('allowed=true quando ativo vivo e há substituto elegível', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Guerreiro', hp: 20 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const result = canManualSwap(player);
        expect(result.allowed).toBe(true);
    });

    it('allowed=false quando ativo já está KO', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 0 }), // ativo KO
            makeMonster({ class: 'Guerreiro', hp: 25 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const result = canManualSwap(player);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBeTruthy();
    });

    it('allowed=false quando sem substituto elegível (todos fora da classe)', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Mago', hp: 25 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const result = canManualSwap(player);
        expect(result.allowed).toBe(false);
    });

    it('allowed=false quando sem substituto (equipe com 1 membro)', () => {
        const team = [makeMonster({ class: 'Guerreiro', hp: 30 })];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const result = canManualSwap(player);
        expect(result.allowed).toBe(false);
    });

    it('allowed=true com masterMode mesmo com classes diferentes', () => {
        const team = [
            makeMonster({ class: 'Guerreiro', hp: 30 }),
            makeMonster({ class: 'Mago', hp: 25 })
        ];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const result = canManualSwap(player, { masterMode: true });
        expect(result.allowed).toBe(true);
    });

    it('allowed=false com player null', () => {
        const result = canManualSwap(null);
        expect(result.allowed).toBe(false);
        expect(result.reason).toBeTruthy();
    });

    it('retorna reason descritivo quando bloqueado', () => {
        const team = [makeMonster({ class: 'Guerreiro', hp: 30 })];
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const result = canManualSwap(player);
        expect(typeof result.reason).toBe('string');
        expect(result.reason.length).toBeGreaterThan(0);
    });
});

// ─── Cenários de integração ───────────────────────────────────────────────────

describe('Cenários de integração — troca forçada por KO', () => {

    it('equipe com 3 elegíveis → todos aparecem como eligible', () => {
        const team = [
            makeMonster({ class: 'Mago', hp: 0 }),  // ativo KO
            makeMonster({ class: 'Mago', hp: 30 }),
            makeMonster({ class: 'Mago', hp: 25 }),
            makeMonster({ class: 'Mago', hp: 20 })
        ];
        const player = makePlayer({ class: 'Mago', activeIndex: 0, team });
        const cats = categorizeBattleTeam(player);
        expect(cats.eligible).toHaveLength(3);
        expect(cats.blocked_ko).toHaveLength(0);
    });

    it('equipe com 0 elegíveis → hasEligibleSwap retorna false', () => {
        const team = [
            makeMonster({ class: 'Bardo', hp: 10 }), // ativo
            makeMonster({ class: 'Mago', hp: 15 }),  // fora da classe
            makeMonster({ class: 'Bardo', hp: 0 })   // KO
        ];
        const player = makePlayer({ class: 'Bardo', activeIndex: 0, team });
        expect(hasEligibleSwap(player)).toBe(false);
    });

    it('todas as categorias presentes na equipe mista', () => {
        const team = makeMixedTeam();
        const player = makePlayer({ class: 'Guerreiro', activeIndex: 0, team });
        const cats = categorizeBattleTeam(player);
        expect(cats.active).toHaveLength(1);
        expect(cats.eligible).toHaveLength(1);
        expect(cats.blocked_class).toHaveLength(1);
        expect(cats.blocked_ko).toHaveLength(1);
    });
});

describe('Cenários de integração — troca manual', () => {

    it('canManualSwap true mesmo com membros KO e fora da classe, contanto que haja elegível', () => {
        const team = [
            makeMonster({ class: 'Curandeiro', hp: 30 }),  // ativo (vivo)
            makeMonster({ class: 'Mago', hp: 20 }),         // fora da classe
            makeMonster({ class: 'Curandeiro', hp: 0 }),   // KO
            makeMonster({ class: 'Curandeiro', hp: 15 })   // elegível
        ];
        const player = makePlayer({ class: 'Curandeiro', activeIndex: 0, team });
        expect(canManualSwap(player).allowed).toBe(true);
    });
});

describe('Fallback — dados ausentes não quebram', () => {

    it('team com entries null/undefined são ignorados', () => {
        const player = { id: 'p1', class: 'Guerreiro', activeIndex: 0, team: [null, undefined, makeMonster({ class: 'Guerreiro', hp: 10 })] };
        expect(() => categorizeBattleTeam(player)).not.toThrow();
    });

    it('getSwapStatus não lança com dados inválidos', () => {
        expect(() => getSwapStatus(undefined, 0, {})).not.toThrow();
        expect(() => getSwapStatus({}, NaN, null)).not.toThrow();
    });

    it('canManualSwap não lança com team vazio', () => {
        const player = makePlayer({ team: [] });
        expect(() => canManualSwap(player)).not.toThrow();
    });
});
