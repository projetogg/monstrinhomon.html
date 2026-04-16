/**
 * QUEST UI TESTS (Fase AC)
 *
 * Testes para js/ui/questUI.js
 * Cobertura: renderQuestTrackerEntries, renderQuestEntryHtml,
 *            renderPendingRewardEntryHtml, renderPlayerQuestSectionHtml
 */

import { describe, it, expect } from 'vitest';
import {
    renderQuestTrackerEntries,
    renderQuestEntryHtml,
    renderPendingRewardEntryHtml,
    renderPlayerQuestSectionHtml,
} from '../js/ui/questUI.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const questA = {
    nome: 'Derrote 3 Monstrinhos',
    descricao: 'Vença 3 batalhas selvagens.',
    localId: 'floresta_01',
    rewardXp: 50,
    rewardGold: 20,
    rewardItemId: null,
};

const questB = {
    nome: 'Coletar Ervas',
    descricao: null,
    localId: null,
    rewardXp: 0,
    rewardGold: 0,
    rewardItemId: 'item_erva_rara',
};

// ---------------------------------------------------------------------------
// renderQuestTrackerEntries
// ---------------------------------------------------------------------------
describe('QuestUI - renderQuestTrackerEntries', () => {
    it('deve retornar string vazia para array vazio', () => {
        expect(renderQuestTrackerEntries([], 2)).toBe('');
    });

    it('deve renderizar uma entrada com nome da quest e do jogador', () => {
        const entries = [{ quest: questA, progress: 1, needed: 3, playerName: 'Bia' }];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('Derrote 3 Monstrinhos');
        expect(html).toContain('(Bia)');
        expect(html).toContain('quest-tracker-entry');
    });

    it('deve calcular porcentagem corretamente', () => {
        const entries = [{ quest: questA, progress: 2, needed: 4, playerName: 'João' }];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('width:50%');
    });

    it('deve limitar a porcentagem a 100%', () => {
        const entries = [{ quest: questA, progress: 10, needed: 3, playerName: 'Ana' }];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('width:100%');
    });

    it('deve exibir 0% quando needed=0', () => {
        const entries = [{ quest: questA, progress: 0, needed: 0, playerName: 'X' }];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('width:0%');
    });

    it('deve mostrar dica "+N quests" quando houver mais entradas que maxVisible', () => {
        const entries = [
            { quest: questA, progress: 1, needed: 3, playerName: 'Bia' },
            { quest: questB, progress: 0, needed: 1, playerName: 'Leo' },
            { quest: questA, progress: 2, needed: 3, playerName: 'Ana' },
        ];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('+1 quest');
        expect(html).toContain('veja o Grupo');
    });

    it('deve mostrar "+N quests" no plural quando extra > 1', () => {
        const entries = [
            { quest: questA, progress: 1, needed: 3, playerName: 'A' },
            { quest: questA, progress: 1, needed: 3, playerName: 'B' },
            { quest: questA, progress: 1, needed: 3, playerName: 'C' },
            { quest: questA, progress: 1, needed: 3, playerName: 'D' },
        ];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('+2 quests');
    });

    it('não deve mostrar dica quando número de entradas é igual a maxVisible', () => {
        const entries = [
            { quest: questA, progress: 1, needed: 3, playerName: 'Bia' },
            { quest: questB, progress: 0, needed: 1, playerName: 'Leo' },
        ];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).not.toContain('quest-more-hint');
    });

    it('não deve renderizar entradas além de maxVisible', () => {
        const entries = [
            { quest: questA, progress: 1, needed: 3, playerName: 'Bia' },
            { quest: questB, progress: 0, needed: 1, playerName: 'Leo' },
            { quest: questA, progress: 2, needed: 3, playerName: 'OCULTO' },
        ];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).not.toContain('(OCULTO)');
    });

    it('deve incluir texto de progresso com recompensas', () => {
        const entries = [{ quest: questA, progress: 1, needed: 3, playerName: 'X' }];
        const html = renderQuestTrackerEntries(entries, 2);
        expect(html).toContain('Progresso: 1/3');
        expect(html).toContain('💰20');
        expect(html).toContain('⭐50XP');
    });
});

// ---------------------------------------------------------------------------
// renderQuestEntryHtml
// ---------------------------------------------------------------------------
describe('QuestUI - renderQuestEntryHtml', () => {
    it('deve conter o nome da quest', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        expect(html).toContain('Derrote 3 Monstrinhos');
    });

    it('deve conter a descrição quando presente', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        expect(html).toContain('Vença 3 batalhas selvagens.');
    });

    it('deve tolerar descrição nula', () => {
        const html = renderQuestEntryHtml(questB, 0, 1);
        expect(html).toContain('quest-tracker-entry');
    });

    it('deve exibir localId quando presente', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        expect(html).toContain('📍 floresta_01');
    });

    it('não deve exibir localId quando ausente', () => {
        const html = renderQuestEntryHtml(questB, 0, 1);
        expect(html).not.toContain('📍');
    });

    it('deve calcular porcentagem corretamente', () => {
        const html = renderQuestEntryHtml(questA, 2, 4);
        expect(html).toContain('width:50%');
    });

    it('deve exibir rewardXp quando presente', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        expect(html).toContain('⭐ 50 XP');
    });

    it('não deve exibir rewardXp quando zero', () => {
        const html = renderQuestEntryHtml(questB, 0, 1);
        expect(html).not.toContain('⭐');
    });

    it('deve exibir rewardGold quando presente', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        expect(html).toContain('💰 20');
    });

    it('não deve exibir rewardGold quando zero', () => {
        const html = renderQuestEntryHtml(questB, 0, 1);
        expect(html).not.toContain('💰');
    });

    it('deve exibir rewardItemId quando presente', () => {
        const html = renderQuestEntryHtml(questB, 0, 1);
        expect(html).toContain('🎁 item_erva_rara');
    });

    it('não deve exibir rewardItemId quando nulo', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        // questA não tem rewardItemId, portanto não há 🎁 item_
        expect(html).not.toContain('item_');
    });

    it('deve incluir barra de progresso', () => {
        const html = renderQuestEntryHtml(questA, 1, 3);
        expect(html).toContain('quest-progress-bar');
        expect(html).toContain('quest-progress-fill');
    });
});

// ---------------------------------------------------------------------------
// renderPendingRewardEntryHtml
// ---------------------------------------------------------------------------
describe('QuestUI - renderPendingRewardEntryHtml', () => {
    it('deve conter nome da quest com ✅', () => {
        const html = renderPendingRewardEntryHtml(questA, 'p1', 'quest_01');
        expect(html).toContain('✅ Derrote 3 Monstrinhos');
    });

    it('deve conter botão de coleta com ids corretos', () => {
        const html = renderPendingRewardEntryHtml(questA, 'player_abc', 'quest_xyz');
        expect(html).toContain("claimQuestRewardUI('player_abc', 'quest_xyz')");
        expect(html).toContain('🎁 Coletar Recompensa');
    });

    it('deve ter borda laranja característica', () => {
        const html = renderPendingRewardEntryHtml(questA, 'p1', 'q1');
        expect(html).toContain('border-left:3px solid #e67e22');
    });

    it('deve exibir recompensas de XP quando presente', () => {
        const html = renderPendingRewardEntryHtml(questA, 'p1', 'q1');
        expect(html).toContain('⭐ +50 XP');
    });

    it('não deve exibir XP quando zero', () => {
        const html = renderPendingRewardEntryHtml(questB, 'p1', 'q1');
        expect(html).not.toContain('⭐');
    });

    it('deve exibir recompensas de gold quando presente', () => {
        const html = renderPendingRewardEntryHtml(questA, 'p1', 'q1');
        expect(html).toContain('💰 +20');
    });

    it('não deve exibir gold quando zero', () => {
        const html = renderPendingRewardEntryHtml(questB, 'p1', 'q1');
        expect(html).not.toContain('💰');
    });

    it('deve exibir rewardItemId quando presente', () => {
        const html = renderPendingRewardEntryHtml(questB, 'p1', 'q1');
        expect(html).toContain('🎁 item_erva_rara');
    });

    it('não deve exibir rewardItemId quando nulo', () => {
        const html = renderPendingRewardEntryHtml(questA, 'p1', 'q1');
        // questA não tem rewardItemId
        expect(html).not.toContain('item_');
    });
});

// ---------------------------------------------------------------------------
// renderPlayerQuestSectionHtml
// ---------------------------------------------------------------------------
describe('QuestUI - renderPlayerQuestSectionHtml', () => {
    const player = { id: 'player_bia', name: 'Bia' };

    it('deve exibir nome do jogador', () => {
        const html = renderPlayerQuestSectionHtml(player, [], [], [], () => null);
        expect(html).toContain('👤 Bia');
    });

    it('deve usar player.nome quando player.name estiver ausente', () => {
        const p = { id: 'p1', nome: 'Leo' };
        const html = renderPlayerQuestSectionHtml(p, [], [], [], () => null);
        expect(html).toContain('👤 Leo');
    });

    it('deve usar player.id quando name e nome estiverem ausentes', () => {
        const p = { id: 'player_99' };
        const html = renderPlayerQuestSectionHtml(p, [], [], [], () => null);
        expect(html).toContain('👤 player_99');
    });

    it('deve mostrar mensagem de nenhuma missão ativa quando activeQuestsSummary vazio', () => {
        const html = renderPlayerQuestSectionHtml(player, [], [], [], () => null);
        expect(html).toContain('Nenhuma missão ativa.');
    });

    it('deve renderizar quests ativas quando presentes', () => {
        const activeQuestsSummary = [{ quest: questA, progress: 1, needed: 3 }];
        const html = renderPlayerQuestSectionHtml(player, activeQuestsSummary, [], [], () => null);
        expect(html).toContain('🗺️ Ativas (1)');
        expect(html).toContain('Derrote 3 Monstrinhos');
    });

    it('deve renderizar múltiplas quests ativas', () => {
        const activeQuestsSummary = [
            { quest: questA, progress: 1, needed: 3 },
            { quest: questB, progress: 0, needed: 1 },
        ];
        const html = renderPlayerQuestSectionHtml(player, activeQuestsSummary, [], [], () => null);
        expect(html).toContain('🗺️ Ativas (2)');
        expect(html).toContain('Derrote 3 Monstrinhos');
        expect(html).toContain('Coletar Ervas');
    });

    it('deve renderizar recompensas pendentes quando presentes', () => {
        const getQuest = (qid) => qid === 'quest_01' ? questA : null;
        const html = renderPlayerQuestSectionHtml(player, [], ['quest_01'], [], getQuest);
        expect(html).toContain('🎁 Recompensas disponíveis (1)');
        expect(html).toContain('✅ Derrote 3 Monstrinhos');
        expect(html).toContain("claimQuestRewardUI('player_bia', 'quest_01')");
    });

    it('deve ignorar recompensas pendentes cujo quest não foi encontrado por getQuest', () => {
        const html = renderPlayerQuestSectionHtml(player, [], ['quest_inexistente'], [], () => null);
        // O cabeçalho da seção aparece (IDs válidos), mas o cartão individual é omitido
        expect(html).toContain('Recompensas disponíveis (1)');
        expect(html).not.toContain('claimQuestRewardUI');
    });

    it('deve renderizar bloco de concluídas quando claimedCompletedIds tiver itens', () => {
        const getQuest = (qid) => qid === 'quest_01' ? questA : null;
        const html = renderPlayerQuestSectionHtml(player, [], [], ['quest_01'], getQuest);
        expect(html).toContain('✅ Concluídas (1)');
        expect(html).toContain('Derrote 3 Monstrinhos');
        expect(html).toContain('<details');
    });

    it('deve exibir apenas questId quando getQuest retornar null para concluídas', () => {
        const html = renderPlayerQuestSectionHtml(player, [], [], ['quest_xyz'], () => null);
        expect(html).toContain('quest_xyz');
    });

    it('não deve renderizar bloco de concluídas quando claimedCompletedIds vazio', () => {
        const html = renderPlayerQuestSectionHtml(player, [], [], [], () => null);
        expect(html).not.toContain('<details');
    });

    it('deve retornar uma div.card envolvendo tudo', () => {
        const html = renderPlayerQuestSectionHtml(player, [], [], [], () => null);
        expect(html).toContain('<div class="card"');
        expect(html.trim()).toMatch(/^<div class="card"/);
        expect(html.trim()).toMatch(/<\/div>$/);
    });
});
