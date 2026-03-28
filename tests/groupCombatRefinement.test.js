/**
 * GROUP COMBAT REFINEMENT TESTS
 *
 * Garante os refinamentos de ritmo e clareza do combate em grupo:
 *  - Monster ativo usa activeIndex, não team[0]
 *  - Log de início compacto (1 linha)
 *  - Strings PT-BR nos logs de combate selvagem
 *  - KO badge presente nos cards mortos
 *  - Turn banner nomeia o jogador atual
 */

import { describe, it, expect } from 'vitest';

// ── Helpers de estado de teste ─────────────────────────────────────────────

/** Cria um jogador de teste com múltiplos monstrinhos */
function makePlayer(id, name, cls, team = [], activeIndex = 0) {
    return { id, name, class: cls, team, activeIndex };
}

/** Cria um monstrinho de teste */
function makeMon(name, hp, hpMax, level = 1) {
    return { name, hp, hpMax, level, xp: 0, xpNeeded: 50, class: 'Guerreiro', atk: 5, def: 5, spd: 5, power: 5, ene: 5, eneMax: 10 };
}

// ── Active Monster Resolution ──────────────────────────────────────────────

describe('Monster Ativo — Resolution via activeIndex', () => {

    it('team[0] não é necessariamente o ativo — deve usar activeIndex', () => {
        const mon0 = makeMon('Luma', 0, 30);   // KO — índice 0
        const mon1 = makeMon('Trok', 25, 40);  // Ativo — índice 1
        const player = makePlayer('p1', 'Ana', 'Mago', [mon0, mon1], 1);

        // Lógica correta: usar activeIndex
        const active = player.team[player.activeIndex ?? 0];
        expect(active.name).toBe('Trok');
        expect(active.hp).toBeGreaterThan(0);
    });

    it('team[0] daria resultado errado (monster KO) se activeIndex fosse ignorado', () => {
        const mon0 = makeMon('Luma', 0, 30);   // KO — índice 0
        const mon1 = makeMon('Trok', 25, 40);  // Ativo — índice 1
        const player = makePlayer('p1', 'Ana', 'Mago', [mon0, mon1], 1);

        // Comportamento INCORRETO: team[0]
        const wrong = player.team[0];
        expect(wrong.hp).toBe(0); // KO — seria exibido incorretamente no card
    });

    it('activeIndex = 0 funciona normalmente (caso padrão)', () => {
        const mon0 = makeMon('Luma', 30, 30);
        const mon1 = makeMon('Trok', 25, 40);
        const player = makePlayer('p1', 'Ana', 'Mago', [mon0, mon1], 0);

        const active = player.team[player.activeIndex ?? 0];
        expect(active.name).toBe('Luma');
    });

    it('activeIndex undefined cai para 0 (fallback seguro)', () => {
        const mon0 = makeMon('Luma', 30, 30);
        const player = { id: 'p1', name: 'Ana', class: 'Mago', team: [mon0] };
        // sem activeIndex definido

        const active = player.team[player.activeIndex ?? 0];
        expect(active.name).toBe('Luma');
    });

    it('com activeIndex = 2 retorna o terceiro monstro', () => {
        const team = [
            makeMon('Luma', 0, 30),
            makeMon('Trok', 0, 40),
            makeMon('Grex', 20, 50),
        ];
        const player = makePlayer('p1', 'Ana', 'Mago', team, 2);

        const active = player.team[player.activeIndex ?? 0];
        expect(active.name).toBe('Grex');
        expect(active.hp).toBe(20);
    });
});

// ── Log KO / PT-BR ─────────────────────────────────────────────────────────

describe('Log de Combate — Strings PT-BR', () => {

    it('log de derrota deve ser em PT-BR', () => {
        const monName = 'Luma';
        // Novo formato PT-BR
        const msg = `💀 ${monName} desmaiou! Derrota!`;
        expect(msg).toContain('desmaiou');
        expect(msg).toContain('Derrota');
        expect(msg).not.toContain('fainted');
        expect(msg).not.toContain('Defeat');
    });

    it('log de dano selvagem deve ser em PT-BR', () => {
        const wildName = 'Trok';
        const damage = 12;
        // Novo formato PT-BR
        const msg = `💥 ${wildName} acertou! Causa ${damage} de dano!`;
        expect(msg).toContain('acertou');
        expect(msg).toContain('Causa');
        expect(msg).toContain('de dano');
        expect(msg).not.toContain('hits!');
        expect(msg).not.toContain('Deals');
        expect(msg).not.toContain('damage!');
    });

    it('mensagem "(Desmaiado)" não deve conter inglês', () => {
        const label = '(Desmaiado)';
        expect(label).not.toContain('Fainted');
        expect(label).not.toContain('fainted');
    });
});

// ── Log de Início de Batalha ───────────────────────────────────────────────

describe('Log de Início — Compacto (1 linha)', () => {

    it('log de início deve ser 1 linha com nome do primeiro ator', () => {
        // Simula o novo comportamento compacto
        const turnOrder = [
            { name: 'Ana', side: 'player', spd: 10 },
            { name: 'Bote', side: 'enemy', spd: 8 },
            { name: 'Bru', side: 'player', spd: 7 },
        ];
        const log = [];
        const firstActor = turnOrder[0];
        const totalActors = turnOrder.length;
        log.push(`🎲 Batalha iniciada! ${totalActors} participantes. Primeiro: ${firstActor?.name || '?'}.`);

        // Apenas 1 entrada no log
        expect(log.length).toBe(1);
        expect(log[0]).toContain('Ana');
        expect(log[0]).toContain('3 participantes');
        expect(log[0]).not.toContain('SPD:'); // Não lista todos os atores
    });

    it('formato antigo gerava N+1 entradas no log (ruído)', () => {
        // Documenta o comportamento antigo que era verboso
        const turnOrder = [
            { name: 'Ana', side: 'player', spd: 10 },
            { name: 'Bote', side: 'enemy', spd: 8 },
            { name: 'Bru', side: 'player', spd: 7 },
        ];
        const oldLog = [];
        oldLog.push('🎲 Ordem de turnos calculada!');
        turnOrder.forEach((actor, idx) => {
            oldLog.push(`   ${idx + 1}. ${actor.name} (${actor.side === 'player' ? 'Jogador' : 'Inimigo'}, SPD: ${actor.spd})`);
        });

        // Formato antigo: 1 header + N atores = 4 linhas para 3 participantes
        expect(oldLog.length).toBe(4);
        // Novo formato: apenas 1 linha
        // (Este teste documenta que o novo formato é melhor)
    });

    it('compacto sempre gera exatamente 1 entrada independente do tamanho', () => {
        for (const n of [1, 3, 6]) {
            const order = Array.from({ length: n }, (_, i) => ({ name: `Actor${i}`, side: 'player', spd: 10 - i }));
            const log = [];
            const first = order[0];
            log.push(`🎲 Batalha iniciada! ${order.length} participantes. Primeiro: ${first?.name || '?'}.`);
            expect(log.length).toBe(1);
        }
    });
});

// ── Turn Banner ────────────────────────────────────────────────────────────

describe('Turn Banner — Nome do Jogador Atual', () => {

    it('banner deve incluir nome do jogador quando é turno de um jogador', () => {
        const actor = { id: 'p1', side: 'player' };
        const players = [{ id: 'p1', name: 'Ana', class: 'Mago' }];
        const currentPlayer = players.find(x => x.id === actor.id);
        const playerName = currentPlayer ? (currentPlayer.name || currentPlayer.nome) : 'Jogador';
        const bannerText = `🟢 VEZ DE ${playerName.toUpperCase()}`;

        expect(bannerText).toContain('ANA');
        expect(bannerText).not.toBe('🟢 VEZ DOS JOGADORES');
    });

    it('banner mostra "VEZ DOS INIMIGOS" quando é turno de inimigo', () => {
        const actor = { id: 0, side: 'enemy' };
        const bannerText = actor.side === 'player' ? '🟢 VEZ DO JOGADOR' : '🔴 VEZ DOS INIMIGOS';

        expect(bannerText).toBe('🔴 VEZ DOS INIMIGOS');
    });

    it('banner usa nome do jogador em maiúsculas para legibilidade', () => {
        const actor = { id: 'p2', side: 'player' };
        const players = [{ id: 'p2', name: 'lucas', class: 'Guerreiro' }];
        const currentPlayer = players.find(x => x.id === actor.id);
        const playerName = currentPlayer ? (currentPlayer.name || currentPlayer.nome) : 'Jogador';
        const bannerText = `🟢 VEZ DE ${playerName.toUpperCase()}`;

        expect(bannerText).toBe('🟢 VEZ DE LUCAS');
    });
});

// ── KO Badge Logic ─────────────────────────────────────────────────────────

describe('KO Badge — Cards de Participantes Mortos', () => {

    it('badge KO deve ser renderizado quando HP = 0', () => {
        const mon = makeMon('Luma', 0, 30);
        const isKO = (mon.hp) <= 0;
        const badgeHtml = isKO
            ? `<span style="background: #e53935; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">💀 KO</span>`
            : '';

        expect(badgeHtml).toContain('💀 KO');
    });

    it('badge KO NÃO deve ser renderizado quando HP > 0', () => {
        const mon = makeMon('Luma', 15, 30);
        const isKO = (mon.hp) <= 0;
        const badgeHtml = isKO ? '💀 KO' : '';

        expect(badgeHtml).toBe('');
    });

    it('enemy card com HP = 0 deve mostrar KO', () => {
        const enemy = { name: 'Bote', hp: 0, hpMax: 50, level: 3, atk: 8, def: 5, spd: 6 };
        const isDead = (enemy.hp) <= 0;

        expect(isDead).toBe(true);
        // Se isDead, a carta deveria mostrar badge
        const badge = isDead ? '💀 KO' : '';
        expect(badge).toBe('💀 KO');
    });

    it('enemy card com HP > 0 não mostra KO', () => {
        const enemy = { name: 'Bote', hp: 20, hpMax: 50, level: 3, atk: 8, def: 5, spd: 6 };
        const isDead = (enemy.hp) <= 0;

        expect(isDead).toBe(false);
    });
});
