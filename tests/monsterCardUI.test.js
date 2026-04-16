/**
 * MONSTER CARD UI TESTS (Fase AB)
 *
 * Testes para js/ui/monsterCardUI.js
 * Cobertura: renderSpeciesIdentityBlock, renderTeamReadinessIndicator, renderEligibilityBadgeForTeam
 */

import { describe, it, expect } from 'vitest';
import {
    renderSpeciesIdentityBlock,
    renderTeamReadinessIndicator,
    renderEligibilityBadgeForTeam
} from '../js/ui/monsterCardUI.js';

// ---------------------------------------------------------------------------
// renderSpeciesIdentityBlock
// ---------------------------------------------------------------------------
describe('MonsterCardUI - renderSpeciesIdentityBlock', () => {
    it('deve retornar string vazia quando speciesDisplay for undefined', () => {
        expect(renderSpeciesIdentityBlock({}, undefined)).toBe('');
    });

    it('deve retornar string vazia quando speciesDisplay não tiver getSpeciesDisplayInfo', () => {
        expect(renderSpeciesIdentityBlock({}, {})).toBe('');
    });

    it('deve retornar string vazia quando a espécie não existir (hasSpecies=false)', () => {
        const speciesDisplay = {
            getSpeciesDisplayInfo: () => ({ hasSpecies: false })
        };
        expect(renderSpeciesIdentityBlock({}, speciesDisplay)).toBe('');
    });

    it('deve conter speciesLabel e passiveName quando a espécie existir', () => {
        const speciesDisplay = {
            getSpeciesDisplayInfo: () => ({
                hasSpecies: true,
                isPromoted: false,
                hasKitSwap: false,
                speciesLabel: 'Lumineon',
                archetype: 'Guardião',
                passiveName: 'Luz Etérea',
                passiveDesc: 'Brilha no escuro',
                kitSwapName: null,
                nextMilestone: null
            })
        };
        const html = renderSpeciesIdentityBlock({ id: 'm1' }, speciesDisplay);
        expect(html).toContain('Lumineon');
        expect(html).toContain('Luz Etérea');
        expect(html).toContain('species-identity__header');
        expect(html).toContain('species-identity__passive');
    });

    it('deve renderizar kit_swap sem classe --promoted quando isPromoted=false', () => {
        const speciesDisplay = {
            getSpeciesDisplayInfo: () => ({
                hasSpecies: true,
                isPromoted: false,
                hasKitSwap: true,
                speciesLabel: 'Trokulus',
                archetype: 'Colosso',
                passiveName: 'Pedra Viva',
                passiveDesc: 'Resistente',
                kitSwapName: 'Golpe de Pedra',
                nextMilestone: null
            })
        };
        const html = renderSpeciesIdentityBlock({ id: 'm2' }, speciesDisplay);
        expect(html).toContain('Golpe de Pedra');
        expect(html).toContain('species-identity__kit');
        expect(html).not.toContain('species-identity__kit--promoted');
        // badge sem promoção usa 🌟
        expect(html).toContain('🌟');
    });

    it('deve usar classe --promoted e ⭐ quando isPromoted=true', () => {
        const speciesDisplay = {
            getSpeciesDisplayInfo: () => ({
                hasSpecies: true,
                isPromoted: true,
                hasKitSwap: true,
                speciesLabel: 'Auralux',
                archetype: 'Ascendido',
                passiveName: 'Áurea Divina',
                passiveDesc: 'Poderoso',
                kitSwapName: 'Fúria Solar',
                nextMilestone: null
            })
        };
        const html = renderSpeciesIdentityBlock({ id: 'm3' }, speciesDisplay);
        expect(html).toContain('species-identity__kit--promoted');
        expect(html).toContain('⭐');
        expect(html).toContain('(Promoção)');
    });

    it('deve renderizar milestone quando nextMilestone estiver presente', () => {
        const speciesDisplay = {
            getSpeciesDisplayInfo: () => ({
                hasSpecies: true,
                isPromoted: false,
                hasKitSwap: false,
                speciesLabel: 'Ventux',
                archetype: 'Ágil',
                passiveName: 'Rajada',
                passiveDesc: 'Rápido',
                kitSwapName: null,
                nextMilestone: 'Nv. 15: Desbloqueio'
            })
        };
        const html = renderSpeciesIdentityBlock({ id: 'm4' }, speciesDisplay);
        expect(html).toContain('species-identity__milestone');
        expect(html).toContain('Nv. 15: Desbloqueio');
        expect(html).toContain('⏳');
    });

    it('não deve renderizar milestone quando nextMilestone for null', () => {
        const speciesDisplay = {
            getSpeciesDisplayInfo: () => ({
                hasSpecies: true,
                isPromoted: false,
                hasKitSwap: false,
                speciesLabel: 'Ventux',
                archetype: 'Ágil',
                passiveName: 'Rajada',
                passiveDesc: 'Rápido',
                kitSwapName: null,
                nextMilestone: null
            })
        };
        const html = renderSpeciesIdentityBlock({ id: 'm5' }, speciesDisplay);
        expect(html).not.toContain('species-identity__milestone');
    });
});

// ---------------------------------------------------------------------------
// renderTeamReadinessIndicator
// ---------------------------------------------------------------------------
describe('MonsterCardUI - renderTeamReadinessIndicator', () => {
    it('deve retornar string vazia quando speciesDisplay for undefined', () => {
        expect(renderTeamReadinessIndicator({}, undefined)).toBe('');
    });

    it('deve retornar string vazia quando speciesDisplay não tiver getTeamReadinessIndicator', () => {
        expect(renderTeamReadinessIndicator({}, {})).toBe('');
    });

    it('deve retornar string vazia quando getTeamReadinessIndicator retornar null', () => {
        const speciesDisplay = { getTeamReadinessIndicator: () => null };
        expect(renderTeamReadinessIndicator({}, speciesDisplay)).toBe('');
    });

    it('deve retornar string vazia para state desconhecido', () => {
        const speciesDisplay = { getTeamReadinessIndicator: () => ({ state: 'unknown', targetLevel: 5 }) };
        expect(renderTeamReadinessIndicator({}, speciesDisplay)).toBe('');
    });

    it('deve renderizar badge ✅ para state=complete', () => {
        const speciesDisplay = { getTeamReadinessIndicator: () => ({ state: 'complete' }) };
        const html = renderTeamReadinessIndicator({ id: 'm1' }, speciesDisplay);
        expect(html).toContain('readiness-badge--complete');
        expect(html).toContain('✅ Completo');
    });

    it('deve renderizar badge ⚡ com nível correto para state=near_promo', () => {
        const speciesDisplay = { getTeamReadinessIndicator: () => ({ state: 'near_promo', targetLevel: 12 }) };
        const html = renderTeamReadinessIndicator({ id: 'm1' }, speciesDisplay);
        expect(html).toContain('readiness-badge--near');
        expect(html).toContain('⚡ Nv.12');
        expect(html).toContain('Promoção no Nv. 12');
    });

    it('deve renderizar badge ⚡ com nível correto para state=near_unlock', () => {
        const speciesDisplay = { getTeamReadinessIndicator: () => ({ state: 'near_unlock', targetLevel: 8 }) };
        const html = renderTeamReadinessIndicator({ id: 'm1' }, speciesDisplay);
        expect(html).toContain('readiness-badge--near');
        expect(html).toContain('⚡ Nv.8');
        expect(html).toContain('Habilidade especial no Nv. 8');
    });
});

// ---------------------------------------------------------------------------
// renderEligibilityBadgeForTeam
// ---------------------------------------------------------------------------
describe('MonsterCardUI - renderEligibilityBadgeForTeam', () => {
    it('deve retornar string vazia quando classEligibility for undefined', () => {
        expect(renderEligibilityBadgeForTeam({}, {}, undefined)).toBe('');
    });

    it('deve retornar string vazia quando classEligibility não tiver renderEligibilityBadge', () => {
        expect(renderEligibilityBadgeForTeam({}, {}, {})).toBe('');
    });

    it('deve delegar para classEligibility.renderEligibilityBadge e retornar seu resultado', () => {
        const classEligibility = {
            renderEligibilityBadge: (monster, player) =>
                `<span>✔ Elegível ${monster.id} ${player.id}</span>`
        };
        const html = renderEligibilityBadgeForTeam(
            { id: 'mon1' },
            { id: 'player1' },
            classEligibility
        );
        expect(html).toBe('<span>✔ Elegível mon1 player1</span>');
    });

    it('deve retornar string vazia quando classEligibility.renderEligibilityBadge retornar vazio', () => {
        const classEligibility = { renderEligibilityBadge: () => '' };
        expect(renderEligibilityBadgeForTeam({}, {}, classEligibility)).toBe('');
    });
});
