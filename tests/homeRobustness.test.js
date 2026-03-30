/**
 * HOME ROBUSTEZ — CONTEÚDO EXTREMO E ACESSIBILIDADE (PR final)
 *
 * Valida que a Home lida corretamente com:
 * 1. Nome de missão longo (> 60 caracteres)
 * 2. Nome de jogador longo (> 40 caracteres)
 * 3. Mais entradas do que o limite visível (MAX_VISIBLE = 2)
 * 4. Presença de title= em todos os elementos que podem ser truncados
 * 5. Ausência de erros de renderização com conteúdo extremo
 *
 * Estratégia: replica a lógica de geração HTML de renderQuestTrackerPanel
 * (função pura extratível de index.html) e testa seus resultados.
 */

import { describe, it, expect } from 'vitest';

// ── Réplica da lógica de renderização de quest entries ────────────────────────
// Espelho direto do código em renderQuestTrackerPanel (index.html).
// Qualquer mudança naquele bloco deve ser refletida aqui.
function buildQuestEntries(players, getActiveQuestsSummaryFn, MAX_VISIBLE = 2) {
    const entries = [];
    for (const player of players) {
        const summary = getActiveQuestsSummaryFn(player);
        for (const { quest, progress, needed } of summary) {
            const pct = needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 0;
            const playerName = player.name || player.nome || player.id;
            const progressText = `Progresso: ${progress}/${needed} · 💰${quest.rewardGold} · ⭐${quest.rewardXp}XP`;
            entries.push(`
                <div class="quest-tracker-entry">
                    <div class="quest-header">
                        <strong title="${quest.nome}">${quest.nome}</strong>
                        <span class="text-small text-muted" title="${playerName}">(${playerName})</span>
                    </div>
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width:${pct}%"></div>
                    </div>
                    <div class="text-small" title="${progressText}">${progressText}</div>
                </div>
            `);
        }
    }

    if (entries.length === 0) return '<p class="text-muted">Nenhuma quest ativa no momento.</p>';

    const visible = entries.slice(0, MAX_VISIBLE);
    const extra = entries.length - MAX_VISIBLE;
    let html = visible.join('');
    if (extra > 0) {
        html += `<div class="quest-more-hint">+${extra} quest${extra > 1 ? 's' : ''} — veja o Grupo</div>`;
    }
    return html;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Conta quantas vezes uma substring aparece em um texto */
function countOccurrences(str, sub) {
    let count = 0;
    let pos = str.indexOf(sub);
    while (pos !== -1) {
        count++;
        pos = str.indexOf(sub, pos + 1);
    }
    return count;
}

// ── Dados de teste ─────────────────────────────────────────────────────────────

const LONG_QUEST_NAME = 'Derrote os Guardiões do Bosque Proibido e Recupere o Amuleto Sagrado';
const LONG_PLAYER_NAME = 'Alexandrina dos Santos Oliveira da Silva Pereira';
const SHORT_QUEST_NAME = 'Treino básico';
const SHORT_PLAYER_NAME = 'Ana';

function makeQuest(nome, rewardGold = 100, rewardXp = 50) {
    return { nome, rewardGold, rewardXp };
}

function summaryOf(quest, progress = 3, needed = 5) {
    return [{ quest, progress, needed }];
}

// ── Testes ─────────────────────────────────────────────────────────────────────

describe('Home – Robustez de conteúdo extremo', () => {

    describe('Cenário 1: Nome de missão longo (> 60 chars)', () => {
        const players = [{ name: SHORT_PLAYER_NAME }];
        const summary = summaryOf(makeQuest(LONG_QUEST_NAME));
        const html = buildQuestEntries(players, () => summary);

        it('deve renderizar sem erros (string não vazia)', () => {
            expect(html.length).toBeGreaterThan(0);
            expect(html).not.toContain('Nenhuma quest ativa');
        });

        it('deve conter o nome completo da missão no title do strong', () => {
            expect(html).toContain(`title="${LONG_QUEST_NAME}"`);
        });

        it('deve conter o nome da missão visível no conteúdo do strong', () => {
            expect(html).toContain(`>${LONG_QUEST_NAME}<`);
        });

        it('title e conteúdo do strong devem ser idênticos', () => {
            // Garante que não houve truncamento prematuro no JS
            const occurrencesInTitle = countOccurrences(html, `title="${LONG_QUEST_NAME}"`);
            const occurrencesInContent = countOccurrences(html, `>${LONG_QUEST_NAME}<`);
            expect(occurrencesInTitle).toBe(1);
            expect(occurrencesInContent).toBe(1);
        });
    });

    describe('Cenário 2: Nome de jogador longo (> 40 chars)', () => {
        const players = [{ name: LONG_PLAYER_NAME }];
        const summary = summaryOf(makeQuest(SHORT_QUEST_NAME));
        const html = buildQuestEntries(players, () => summary);

        it('deve renderizar sem erros', () => {
            expect(html.length).toBeGreaterThan(0);
        });

        it('deve conter o nome completo do jogador no title do span', () => {
            expect(html).toContain(`title="${LONG_PLAYER_NAME}"`);
        });

        it('deve exibir o nome completo do jogador no conteúdo do span', () => {
            expect(html).toContain(`(${LONG_PLAYER_NAME})`);
        });
    });

    describe('Cenário 3: Mais entradas do que MAX_VISIBLE (5 jogadores, 1 quest cada)', () => {
        const players = [
            { name: 'Jogador 1', _questIdx: 1 },
            { name: 'Jogador 2', _questIdx: 2 },
            { name: 'Jogador 3', _questIdx: 3 },
            { name: 'Jogador 4', _questIdx: 4 },
            { name: 'Jogador 5', _questIdx: 5 },
        ];
        const html = buildQuestEntries(players, (p) =>
            summaryOf(makeQuest(`Quest do Jogador ${p._questIdx}`)));

        it('deve renderizar exatamente 2 entradas visíveis', () => {
            expect(countOccurrences(html, 'quest-tracker-entry')).toBe(2);
        });

        it('deve exibir o contador "+3 quests" para o excedente', () => {
            expect(html).toContain('+3 quests');
        });

        it('deve conter a classe quest-more-hint', () => {
            expect(html).toContain('quest-more-hint');
        });
    });

    describe('Acessibilidade – title em todos os elementos truncáveis', () => {
        const players = [
            { name: LONG_PLAYER_NAME },
            { name: 'Bob' },
        ];
        const makeSummaryFor = (player) =>
            player.name === LONG_PLAYER_NAME
                ? summaryOf(makeQuest(LONG_QUEST_NAME))
                : summaryOf(makeQuest('Quest simples'));

        const html = buildQuestEntries(players, makeSummaryFor);

        it('cada strong deve ter title com o nome da quest', () => {
            expect(html).toContain(`title="${LONG_QUEST_NAME}"`);
            expect(html).toContain('title="Quest simples"');
        });

        it('cada span de jogador deve ter title com o nome do jogador', () => {
            expect(html).toContain(`title="${LONG_PLAYER_NAME}"`);
            expect(html).toContain('title="Bob"');
        });

        it('cada div de progresso deve ter title com o texto completo', () => {
            // O título do progresso inclui os valores de recompensa
            expect(html).toContain('title="Progresso:');
            expect(html).toContain('💰100');
            expect(html).toContain('⭐50XP');
        });
    });

    describe('Conteúdo textual mais extenso que o caso padrão', () => {
        // Simula uma quest com valores altos de reward (texto mais longo)
        const bigRewardQuest = makeQuest(
            'Expedição ao Covil do Dragão de Gelo Ancestral',
            99999,
            88888
        );
        const players = [{ name: 'Herói Lendário da Ordem do Cristal Prismático' }];
        const html = buildQuestEntries(players, () => summaryOf(bigRewardQuest, 999, 1000));

        it('deve renderizar o texto de progresso completo no title', () => {
            const expected = 'Progresso: 999/1000 · 💰99999 · ⭐88888XP';
            expect(html).toContain(`title="${expected}"`);
        });

        it('deve exibir a mesma informação no conteúdo visível', () => {
            expect(html).toContain('999/1000');
            expect(html).toContain('💰99999');
            expect(html).toContain('⭐88888XP');
        });

        it('deve calcular corretamente a porcentagem (99.9% → 100%)', () => {
            // 999/1000 = 99.9% → arredonda para 100 → width:100%
            expect(html).toContain('width:100%');
        });
    });
});
