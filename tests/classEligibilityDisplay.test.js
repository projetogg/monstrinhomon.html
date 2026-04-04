/**
 * CLASS ELIGIBILITY DISPLAY TESTS (Fase 19)
 *
 * Testes para a lógica de elegibilidade por classe para combate.
 * Cobertura: isEligibleForBattle, getEligibilityLabel, renderEligibilityBadge,
 *            fallbacks, casos especiais.
 */

import { describe, it, expect } from 'vitest';
import {
    isEligibleForBattle,
    getEligibilityLabel,
    renderEligibilityBadge
} from '../js/combat/classEligibility.js';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makePlayer(cls) {
    return { id: 'p1', name: 'Treinador', class: cls };
}

function makeMonster(cls, name = 'TestMon') {
    return { id: 'm1', name, class: cls, hp: 30, hpMax: 100, level: 1 };
}

// ─── isEligibleForBattle ──────────────────────────────────────────────────────

describe('isEligibleForBattle', () => {

    describe('Caso normal: mesma classe → elegível', () => {
        it('Guerreiro + Guerreiro → true', () => {
            expect(isEligibleForBattle(makeMonster('Guerreiro'), makePlayer('Guerreiro'))).toBe(true);
        });

        it('Mago + Mago → true', () => {
            expect(isEligibleForBattle(makeMonster('Mago'), makePlayer('Mago'))).toBe(true);
        });

        it('Curandeiro + Curandeiro → true', () => {
            expect(isEligibleForBattle(makeMonster('Curandeiro'), makePlayer('Curandeiro'))).toBe(true);
        });

        it('Bárbaro + Bárbaro → true', () => {
            expect(isEligibleForBattle(makeMonster('Bárbaro'), makePlayer('Bárbaro'))).toBe(true);
        });

        it('Ladino + Ladino → true', () => {
            expect(isEligibleForBattle(makeMonster('Ladino'), makePlayer('Ladino'))).toBe(true);
        });

        it('Bardo + Bardo → true', () => {
            expect(isEligibleForBattle(makeMonster('Bardo'), makePlayer('Bardo'))).toBe(true);
        });

        it('Caçador + Caçador → true', () => {
            expect(isEligibleForBattle(makeMonster('Caçador'), makePlayer('Caçador'))).toBe(true);
        });

        it('Animalista + Animalista → true', () => {
            expect(isEligibleForBattle(makeMonster('Animalista'), makePlayer('Animalista'))).toBe(true);
        });
    });

    describe('Caso normal: classes diferentes → inelegível', () => {
        it('Mago vs Guerreiro → false', () => {
            expect(isEligibleForBattle(makeMonster('Mago'), makePlayer('Guerreiro'))).toBe(false);
        });

        it('Bardo vs Ladino → false', () => {
            expect(isEligibleForBattle(makeMonster('Bardo'), makePlayer('Ladino'))).toBe(false);
        });

        it('Animalista vs Curandeiro → false', () => {
            expect(isEligibleForBattle(makeMonster('Animalista'), makePlayer('Curandeiro'))).toBe(false);
        });
    });

    describe('masterMode desativa restrição de classe', () => {
        it('Mago vs Guerreiro com masterMode → true', () => {
            expect(isEligibleForBattle(makeMonster('Mago'), makePlayer('Guerreiro'), { masterMode: true })).toBe(true);
        });

        it('qualquer classe com masterMode → true', () => {
            expect(isEligibleForBattle(makeMonster('Bardo'), makePlayer('Bárbaro'), { masterMode: true })).toBe(true);
        });
    });

    describe('Fallbacks e casos especiais', () => {
        it('monster null → false', () => {
            expect(isEligibleForBattle(null, makePlayer('Guerreiro'))).toBe(false);
        });

        it('player null → false', () => {
            expect(isEligibleForBattle(makeMonster('Guerreiro'), null)).toBe(false);
        });

        it('ambos null → false', () => {
            expect(isEligibleForBattle(null, null)).toBe(false);
        });

        it('monster sem classe → false', () => {
            expect(isEligibleForBattle({ id: 'm1', name: 'X', hp: 10 }, makePlayer('Guerreiro'))).toBe(false);
        });

        it('player sem classe → false', () => {
            expect(isEligibleForBattle(makeMonster('Guerreiro'), { id: 'p1', name: 'P' })).toBe(false);
        });

        it('ambos sem classe → false', () => {
            expect(isEligibleForBattle({ id: 'm1', name: 'X' }, { id: 'p1', name: 'P' })).toBe(false);
        });
    });
});

// ─── getEligibilityLabel ──────────────────────────────────────────────────────

describe('getEligibilityLabel', () => {

    describe('Monstrinho elegível', () => {
        it('retorna eligible=true para mesma classe', () => {
            const label = getEligibilityLabel(makeMonster('Guerreiro'), makePlayer('Guerreiro'));
            expect(label.eligible).toBe(true);
        });

        it('texto contém "Elegível"', () => {
            const label = getEligibilityLabel(makeMonster('Mago'), makePlayer('Mago'));
            expect(label.text).toContain('Elegível');
        });

        it('title menciona que pode batalhar', () => {
            const label = getEligibilityLabel(makeMonster('Bardo'), makePlayer('Bardo'));
            expect(label.title).toMatch(/batalhar/i);
        });
    });

    describe('Monstrinho inelegível', () => {
        it('retorna eligible=false para classe diferente', () => {
            const label = getEligibilityLabel(makeMonster('Mago'), makePlayer('Guerreiro'));
            expect(label.eligible).toBe(false);
        });

        it('texto contém "Fora da classe"', () => {
            const label = getEligibilityLabel(makeMonster('Bardo'), makePlayer('Ladino'));
            expect(label.text).toContain('Fora da classe');
        });

        it('title menciona a classe do monstrinho e do jogador', () => {
            const label = getEligibilityLabel(makeMonster('Mago'), makePlayer('Guerreiro'));
            expect(label.title).toContain('Mago');
            expect(label.title).toContain('Guerreiro');
        });
    });

    describe('masterMode', () => {
        it('retorna eligible=true com masterMode', () => {
            const label = getEligibilityLabel(makeMonster('Mago'), makePlayer('Guerreiro'), { masterMode: true });
            expect(label.eligible).toBe(true);
        });

        it('texto menciona Modo Mestre', () => {
            const label = getEligibilityLabel(makeMonster('Mago'), makePlayer('Guerreiro'), { masterMode: true });
            expect(label.text).toContain('Mestre');
        });
    });

    describe('Fallbacks', () => {
        it('monster null → eligible=false', () => {
            const label = getEligibilityLabel(null, makePlayer('Guerreiro'));
            expect(label.eligible).toBe(false);
        });

        it('player null → eligible=false', () => {
            const label = getEligibilityLabel(makeMonster('Guerreiro'), null);
            expect(label.eligible).toBe(false);
        });

        it('player sem classe → texto informativo', () => {
            const label = getEligibilityLabel(makeMonster('Guerreiro'), { id: 'p1', name: 'P' });
            expect(label.eligible).toBe(false);
            expect(label.text).toBeTruthy();
        });

        it('monster sem classe → texto informativo', () => {
            const label = getEligibilityLabel({ id: 'm1', name: 'X' }, makePlayer('Guerreiro'));
            expect(label.eligible).toBe(false);
            expect(label.text).toBeTruthy();
        });
    });
});

// ─── renderEligibilityBadge ───────────────────────────────────────────────────

describe('renderEligibilityBadge', () => {

    describe('HTML gerado para elegível', () => {
        it('contém a classe CSS eligibility-badge--eligible', () => {
            const html = renderEligibilityBadge(makeMonster('Guerreiro'), makePlayer('Guerreiro'));
            expect(html).toContain('eligibility-badge--eligible');
        });

        it('contém "Elegível" no texto', () => {
            const html = renderEligibilityBadge(makeMonster('Mago'), makePlayer('Mago'));
            expect(html).toContain('Elegível');
        });

        it('é um elemento span', () => {
            const html = renderEligibilityBadge(makeMonster('Bardo'), makePlayer('Bardo'));
            expect(html).toMatch(/^<span/);
            expect(html).toContain('</span>');
        });
    });

    describe('HTML gerado para inelegível', () => {
        it('contém a classe CSS eligibility-badge--ineligible', () => {
            const html = renderEligibilityBadge(makeMonster('Mago'), makePlayer('Guerreiro'));
            expect(html).toContain('eligibility-badge--ineligible');
        });

        it('contém "Fora da classe" no texto', () => {
            const html = renderEligibilityBadge(makeMonster('Bardo'), makePlayer('Ladino'));
            expect(html).toContain('Fora da classe');
        });

        it('tem atributo title com informação da restrição', () => {
            const html = renderEligibilityBadge(makeMonster('Mago'), makePlayer('Guerreiro'));
            expect(html).toContain('title=');
        });
    });

    describe('masterMode', () => {
        it('usa classe CSS eligible mesmo com classes diferentes', () => {
            const html = renderEligibilityBadge(makeMonster('Mago'), makePlayer('Guerreiro'), { masterMode: true });
            expect(html).toContain('eligibility-badge--eligible');
        });
    });

    describe('Fallbacks — não quebra', () => {
        it('monster null retorna string', () => {
            const html = renderEligibilityBadge(null, makePlayer('Guerreiro'));
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        it('player null retorna string', () => {
            const html = renderEligibilityBadge(makeMonster('Guerreiro'), null);
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Coexistência com badges de prontidão (Fase 17)', () => {
        it('badge de elegibilidade não contém "readiness-badge"', () => {
            const html = renderEligibilityBadge(makeMonster('Guerreiro'), makePlayer('Guerreiro'));
            expect(html).not.toContain('readiness-badge');
        });

        it('badge inelegível não contém "readiness-badge"', () => {
            const html = renderEligibilityBadge(makeMonster('Mago'), makePlayer('Guerreiro'));
            expect(html).not.toContain('readiness-badge');
        });
    });
});

// ─── Cenários de equipe mista ────────────────────────────────────────────────

describe('Cenários de equipe com classes mistas', () => {

    const player = makePlayer('Guerreiro');

    const team = [
        makeMonster('Guerreiro', 'Mon A'),
        makeMonster('Mago', 'Mon B'),
        makeMonster('Guerreiro', 'Mon C'),
        makeMonster('Bardo', 'Mon D'),
    ];

    it('identifica corretamente elegíveis e inelegíveis na equipe', () => {
        const results = team.map(mon => isEligibleForBattle(mon, player));
        // A e C são Guerreiro (elegíveis), B e D não
        expect(results).toEqual([true, false, true, false]);
    });

    it('todos inelegíveis quando jogador é Caçador', () => {
        const cacador = makePlayer('Caçador');
        const results = team.map(mon => isEligibleForBattle(mon, cacador));
        expect(results.every(r => r === false)).toBe(true);
    });

    it('todos elegíveis com masterMode independente da classe', () => {
        const results = team.map(mon => isEligibleForBattle(mon, player, { masterMode: true }));
        expect(results.every(r => r === true)).toBe(true);
    });
});
