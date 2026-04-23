import { describe, it, expect } from 'vitest';
import {
    renderMonsterCard,
    renderTeamReorderList,
    renderPlayerTeamSection
} from '../js/ui/playerPanelUI.js';

describe('PlayerPanelUI - renderMonsterCard', () => {
    it('deve retornar vazio quando monstrinho for inválido', () => {
        expect(renderMonsterCard(null)).toBe('');
    });

    it('deve renderizar fallback de emoji, HP=0 e badge shiny', () => {
        const html = renderMonsterCard({
            name: 'Luma',
            class: 'Mago',
            rarity: 'Raro',
            level: 5,
            hp: 0,
            hpMax: 20,
            xp: 30,
            isShiny: true
        });

        // O helper usa ❓ como fallback quando o monstrinho não tem emoji
        expect(html).toContain('monster-visual');
        expect(html).toContain('⭐ SHINY ⭐');
        expect(html).toContain('0/20 HP');
        expect(html).toContain('style="width: 0%"');
    });
});

describe('PlayerPanelUI - renderTeamReorderList', () => {
    it('deve renderizar mensagem quando time estiver vazio', () => {
        const html = renderTeamReorderList({ id: 'p1', team: [] });
        expect(html).toContain('No monsters in team.');
    });

    it('deve marcar monstrinho KO e fora da classe', () => {
        const player = {
            id: 'p1',
            activeIndex: 0,
            team: [
                { id: 'm1', name: 'Trok', rarity: 'Comum', level: 3, hp: 0, hpMax: 20 }
            ]
        };

        const html = renderTeamReorderList(player, {
            isAlive: () => false,
            isEligibleForBattle: () => false,
            renderEligibilityBadgeForTeam: () => '<span>✖ Fora da classe</span>'
        });

        expect(html).toContain('team-member-card--ineligible');
        expect(html).toContain('(Desmaiado)');
        expect(html).toContain('✖ Fora da classe');
    });
});

describe('PlayerPanelUI - renderPlayerTeamSection', () => {
    it('deve renderizar seção completa com stats e fallback sem quests', () => {
        const player = {
            id: 'player_1',
            name: 'Ana',
            class: 'Mago',
            money: 12,
            afterlifeCurrency: 4,
            team: [{ id: 'm1', name: 'Luma', rarity: 'Comum', level: 2, hp: 10, hpMax: 10 }]
        };

        const html = renderPlayerTeamSection(player, {
            maxTeamSize: 6,
            getPlayerBoxSize: () => 3,
            getActiveQuestsSummary: () => [],
            teamReorderDeps: { isAlive: () => true }
        });

        expect(html).toContain('Ana');
        expect(html).toContain('💰 12');
        expect(html).toContain('⭐ 4');
        expect(html).toContain('🐾 Time: 1/6');
        expect(html).toContain('📦 Box: 3');
        expect(html).toContain('📋 Nenhuma quest ativa.');
    });
});
