/**
 * EVOLUTION SYSTEM TESTS (FASE G)
 *
 * Testa as funções puras do módulo evolutionSystem.js.
 * Cobertura: getEvolutionData, checkEvolution, executeEvolution
 */

import { describe, it, expect } from 'vitest';
import {
    getEvolutionData,
    checkEvolution,
    executeEvolution
} from '../js/data/evolutionSystem.js';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const templateComum = {
    id: 'MON_001',
    name: 'Cantapau',
    class: 'Bardo',
    rarity: 'Comum',
    baseHp: 28,
    emoji: '🎵',
    evolvesTo: 'MON_001B',
    evolvesAt: 12
};

const templateFinalStage = {
    id: 'MON_001D',
    name: 'LendaMon',
    class: 'Bardo',
    rarity: 'Lendário',
    baseHp: 80,
    emoji: '🎸'
    // sem evolvesTo / evolvesAt
};

const templateLegacyFields = {
    id: 'MON_002',
    name: 'Pedrino',
    class: 'Guerreiro',
    rarity: 'Comum',
    baseHp: 32,
    emoji: '⚔️',
    evolve_to: 'MON_002B',  // campo legado
    evolve_at: 12            // campo legado
};

const nextTemplate = {
    id: 'MON_001B',
    name: 'Cantapimon',
    class: 'Bardo',
    rarity: 'Incomum',
    baseHp: 40,
    emoji: '🎶'
};

// ─── getEvolutionData ────────────────────────────────────────────────────────

describe('getEvolutionData', () => {
    it('retorna null para template null', () => {
        expect(getEvolutionData(null)).toBeNull();
    });

    it('retorna null para template sem evolvesTo', () => {
        expect(getEvolutionData(templateFinalStage)).toBeNull();
    });

    it('extrai dados de evolução canônicos (evolvesTo / evolvesAt)', () => {
        const evo = getEvolutionData(templateComum);
        expect(evo).toEqual({ toId: 'MON_001B', atLv: 12 });
    });

    it('extrai dados de evolução com campos legados (evolve_to / evolve_at)', () => {
        const evo = getEvolutionData(templateLegacyFields);
        expect(evo).toEqual({ toId: 'MON_002B', atLv: 12 });
    });

    it('retorna null se evolvesAt for 0 ou negativo', () => {
        expect(getEvolutionData({ ...templateComum, evolvesAt: 0  })).toBeNull();
        expect(getEvolutionData({ ...templateComum, evolvesAt: -1 })).toBeNull();
    });

    it('retorna null se evolvesTo for string vazia', () => {
        expect(getEvolutionData({ ...templateComum, evolvesTo: '' })).toBeNull();
    });
});

// ─── checkEvolution ──────────────────────────────────────────────────────────

describe('checkEvolution', () => {
    it('retorna shouldEvolve=false para monster null', () => {
        const result = checkEvolution(null, templateComum);
        expect(result).toEqual({ shouldEvolve: false, newTemplateId: null });
    });

    it('retorna shouldEvolve=false para template null', () => {
        const result = checkEvolution({ level: 15 }, null);
        expect(result).toEqual({ shouldEvolve: false, newTemplateId: null });
    });

    it('retorna shouldEvolve=false quando nível abaixo do threshold', () => {
        const result = checkEvolution({ level: 11 }, templateComum);
        expect(result).toEqual({ shouldEvolve: false, newTemplateId: null });
    });

    it('retorna shouldEvolve=true exatamente no nível de evolução', () => {
        const result = checkEvolution({ level: 12 }, templateComum);
        expect(result).toEqual({ shouldEvolve: true, newTemplateId: 'MON_001B' });
    });

    it('retorna shouldEvolve=true acima do nível de evolução', () => {
        const result = checkEvolution({ level: 20 }, templateComum);
        expect(result).toEqual({ shouldEvolve: true, newTemplateId: 'MON_001B' });
    });

    it('retorna shouldEvolve=false para estágio final (sem evolvesTo)', () => {
        const result = checkEvolution({ level: 99 }, templateFinalStage);
        expect(result).toEqual({ shouldEvolve: false, newTemplateId: null });
    });
});

// ─── executeEvolution ────────────────────────────────────────────────────────

describe('executeEvolution', () => {
    it('retorna { oldName: null, newName: null } se newTemplate for null', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', level: 12, hp: 20, hpMax: 28 };
        const result = executeEvolution(mon, null);
        expect(result).toEqual({ oldName: null, newName: null });
        // monstro não deve ser alterado
        expect(mon.monsterId).toBe('MON_001');
        expect(mon.name).toBe('Cantapau');
    });

    it('atualiza identidade do monstro (monsterId)', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', level: 12, hp: 20, hpMax: 28 };
        executeEvolution(mon, nextTemplate);
        expect(mon.monsterId).toBe('MON_001B');
    });

    it('atualiza nome, emoji, classe e raridade', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', class: 'Bardo', rarity: 'Comum', level: 12, hp: 20, hpMax: 28 };
        executeEvolution(mon, nextTemplate);
        expect(mon.name).toBe('Cantapimon');
        expect(mon.emoji).toBe('🎶');
        expect(mon.class).toBe('Bardo');
        expect(mon.rarity).toBe('Incomum');
    });

    it('preserva HP% após evolução', () => {
        // HP% = 50%
        const mon = { monsterId: 'MON_001', level: 12, hp: 14, hpMax: 28 };
        executeEvolution(mon, nextTemplate);
        // hpMax novo = floor(40 * (1 + 11*0.1)) = floor(40 * 2.1) = floor(84) = 84
        const expectedHpMax = Math.floor(40 * (1 + 11 * 0.1));
        expect(mon.hpMax).toBe(expectedHpMax);
        // HP = floor(84 * 0.5) = 42
        expect(mon.hp).toBe(Math.floor(expectedHpMax * 0.5));
    });

    it('garante HP mínimo de 1 após evolução', () => {
        const mon = { monsterId: 'MON_001', level: 12, hp: 0, hpMax: 28 };
        executeEvolution(mon, nextTemplate);
        expect(mon.hp).toBeGreaterThanOrEqual(1);
    });

    it('usa templateId se monsterId não existir', () => {
        const mon = { templateId: 'MON_001', level: 12, hp: 20, hpMax: 28 };
        executeEvolution(mon, nextTemplate);
        expect(mon.templateId).toBe('MON_001B');
    });

    it('retorna { oldName, newName } com os nomes corretos', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', level: 12, hp: 20, hpMax: 28 };
        const result = executeEvolution(mon, nextTemplate);
        expect(result).toEqual({ oldName: 'Cantapau', newName: 'Cantapimon' });
    });
});

// ─── executeEvolution — opts (rarityMult, hpPct) ────────────────────────────

describe('executeEvolution — opts.rarityMult', () => {
    it('aplica rarityMult=1.08 no cálculo do hpMax', () => {
        const mon = { monsterId: 'MON_001', level: 1, hp: 28, hpMax: 28 };
        executeEvolution(mon, nextTemplate, { rarityMult: 1.08 });
        // hpMax = floor(40 * (1 + 0*0.1) * 1.08) = floor(40 * 1.08) = floor(43.2) = 43
        expect(mon.hpMax).toBe(43);
    });

    it('rarityMult padrão = 1.0 se não fornecido', () => {
        const mon = { monsterId: 'MON_001', level: 1, hp: 28, hpMax: 28 };
        executeEvolution(mon, nextTemplate);
        // hpMax = floor(40 * 1.0 * 1.0) = 40
        expect(mon.hpMax).toBe(40);
    });

    it('ignora rarityMult inválido e usa 1.0', () => {
        const mon = { monsterId: 'MON_001', level: 1, hp: 28, hpMax: 28 };
        executeEvolution(mon, nextTemplate, { rarityMult: NaN });
        expect(mon.hpMax).toBe(40);
    });
});

describe('executeEvolution — opts.hpPct', () => {
    it('usa opts.hpPct em vez do HP% atual', () => {
        // HP atual = 50% mas queremos preservar 80%
        const mon = { monsterId: 'MON_001', level: 1, hp: 14, hpMax: 28 };
        executeEvolution(mon, nextTemplate, { hpPct: 0.8 });
        const expectedHpMax = 40;
        expect(mon.hpMax).toBe(expectedHpMax);
        expect(mon.hp).toBe(Math.floor(expectedHpMax * 0.8)); // 32
    });

    it('usa HP% atual se opts.hpPct for null', () => {
        const mon = { monsterId: 'MON_001', level: 1, hp: 14, hpMax: 28 }; // 50%
        executeEvolution(mon, nextTemplate, { hpPct: null });
        expect(mon.hp).toBe(Math.floor(40 * 0.5)); // 20
    });

    it('usa HP% atual se opts.hpPct não for fornecido', () => {
        const mon = { monsterId: 'MON_001', level: 1, hp: 14, hpMax: 28 }; // 50%
        executeEvolution(mon, nextTemplate);
        expect(mon.hp).toBe(Math.floor(40 * 0.5)); // 20
    });
});

describe('executeEvolution — oldName com nickname', () => {
    it('usa nickname como oldName se existir', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', nickname: 'Meu Pet', level: 1, hp: 28, hpMax: 28 };
        const { oldName } = executeEvolution(mon, nextTemplate);
        expect(oldName).toBe('Meu Pet');
    });

    it('usa name como oldName se não tiver nickname', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', level: 1, hp: 28, hpMax: 28 };
        const { oldName } = executeEvolution(mon, nextTemplate);
        expect(oldName).toBe('Cantapau');
    });

    it('newName retorna nome do novo template', () => {
        const mon = { monsterId: 'MON_001', name: 'Cantapau', level: 1, hp: 28, hpMax: 28 };
        const { newName } = executeEvolution(mon, nextTemplate);
        expect(newName).toBe('Cantapimon');
    });
});
