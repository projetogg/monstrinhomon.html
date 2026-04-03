/**
 * CANON SPECIES ID — EVOLUTION GUARD TESTS (Fase 7.3 / atualizado Fase 8)
 *
 * Objetivo: proteger a decisão arquitetural de que canonSpeciesId é resolvido
 * uma única vez na criação da instância e deve ser preservado ao longo de
 * evoluções, mesmo quando o templateId muda.
 *
 * Risco documentado na Fase 7.2 (contexto histórico):
 *   - Antes da Fase 8, templates evoluídos (ex: MON_010B) NÃO tinham entrada
 *     em RUNTIME_TO_CANON_SPECIES. Rederivar canonSpeciesId a partir do
 *     templateId evoluído retornaria null, quebrando passivas/kit swap.
 *
 * Estado após Fase 8:
 *   - Templates evoluídos das 4 classes MVP SÃO mapeados explicitamente no bridge.
 *   - A proteção central continua válida: canonSpeciesId é definido na CRIAÇÃO
 *     da instância e PRESERVADO na instância durante evoluções (applyEvolution
 *     tem guard que não redefine canonSpeciesId).
 *
 * Cobertura:
 *   - resolveCanonSpeciesId (speciesBridge) — confirma estado pós-Fase 8
 *   - resolvePassiveModifier (speciesPassives) — confirma que lê canonSpeciesId da instância
 *   - applyKitSwaps / getEffectiveSkills (kitSwap) — confirma que leem canonSpeciesId da instância
 *   - Simulação completa de evolução: templateId muda, canonSpeciesId permanece
 */

import { describe, it, expect } from 'vitest';
import { resolveCanonSpeciesId, resolveAndApply } from '../js/canon/speciesBridge.js';
import { resolvePassiveModifier } from '../js/canon/speciesPassives.js';
import { applyKitSwaps, getEffectiveSkills } from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Helpers de fixture
// ---------------------------------------------------------------------------

/**
 * Cria uma instância mínima de monstrinho com canonSpeciesId definido.
 * Representa o estado APÓS createMonsterInstanceFromTemplate() para um
 * template base mapeado.
 */
function makeInstance(overrides = {}) {
    return {
        templateId: 'MON_010',
        instanceId: 'mi_test_001',
        name: 'Ferrozimon',
        class: 'Guerreiro',
        level: 1,
        hp: 30, hpMax: 30,
        ene: 10, eneMax: 10,
        atk: 7, def: 9, spd: 4,
        canonSpeciesId: 'shieldhorn',
        canonAppliedOffsets: { def: 1, atk: -1 },
        unlockedSkillSlots: 1,
        appliedKitSwaps: [],
        blockedKitSwaps: [],
        ...overrides,
    };
}

/**
 * Simula a evolução mínima — apenas o que applyEvolution() faz ao templateId.
 * Não toca em canonSpeciesId (comportamento correto e protegido).
 */
function simulateEvolution(instance, nextTemplateId) {
    const evolved = { ...instance };
    evolved.templateId = nextTemplateId;
    evolved.name = nextTemplateId === 'MON_010B' ? 'Cavalheiromon' : 'Forma Evoluída';
    // canonSpeciesId NÃO é alterado — essa é a regra
    return evolved;
}

// ---------------------------------------------------------------------------
// Parte 1 — Bridge: estado dos templates evoluídos após Fase 8
// ---------------------------------------------------------------------------

describe('speciesBridge — templates evoluídos no bridge (pós-Fase 8)', () => {

    it('MON_010 (base) está mapeado para shieldhorn', () => {
        expect(resolveCanonSpeciesId('MON_010')).toBe('shieldhorn');
    });

    it('MON_010B (evoluído) está mapeado para shieldhorn — adicionado explicitamente na Fase 8', () => {
        // Fase 8 adicionou explicitamente os estágios evoluídos das classes MVP ao bridge.
        // A proteção central permanece: canonSpeciesId deve ser lido da INSTÂNCIA,
        // não rederivado a cada acesso. Evoluções adicionadas ao bridge são explícitas
        // e auditáveis, não derivações automáticas.
        expect(resolveCanonSpeciesId('MON_010B')).toBe('shieldhorn');
    });

    it('MON_010C (estágio avançado) está mapeado para shieldhorn — Fase 8', () => {
        expect(resolveCanonSpeciesId('MON_010C')).toBe('shieldhorn');
    });

    it('outros templates mapeados base continuam funcionando', () => {
        expect(resolveCanonSpeciesId('MON_007')).toBe('emberfang');
        expect(resolveCanonSpeciesId('MON_003')).toBe('moonquill');
        expect(resolveCanonSpeciesId('MON_004')).toBe('floracura');
    });

    it('templates evoluídos fora do catálogo ainda retornam null', () => {
        // MON_007B, MON_003B, MON_004B não existem no catálogo e não foram adicionados.
        expect(resolveCanonSpeciesId('MON_007B')).toBeNull();
        expect(resolveCanonSpeciesId('MON_003B')).toBeNull();
        expect(resolveCanonSpeciesId('MON_004B')).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Parte 2 — canonSpeciesId sobrevive à evolução (proteção principal)
// ---------------------------------------------------------------------------

describe('canonSpeciesId — preservado após simulação de evolução', () => {

    it('canonSpeciesId permanece shieldhorn após evolução para MON_010B', () => {
        const base = makeInstance({ templateId: 'MON_010', canonSpeciesId: 'shieldhorn' });
        const evolved = simulateEvolution(base, 'MON_010B');

        expect(evolved.templateId).toBe('MON_010B');   // templateId mudou
        expect(evolved.canonSpeciesId).toBe('shieldhorn'); // canonSpeciesId preservado
    });

    it('canonSpeciesId permanece emberfang após evolução', () => {
        const base = makeInstance({
            templateId: 'MON_007',
            class: 'Bárbaro',
            canonSpeciesId: 'emberfang',
        });
        const evolved = simulateEvolution(base, 'MON_007B');

        expect(evolved.templateId).toBe('MON_007B');
        expect(evolved.canonSpeciesId).toBe('emberfang');
    });

    it('canonSpeciesId permanece moonquill após evolução', () => {
        const base = makeInstance({
            templateId: 'MON_003',
            class: 'Mago',
            canonSpeciesId: 'moonquill',
            canonAppliedOffsets: { ene: 1, agi: -1 },
        });
        const evolved = simulateEvolution(base, 'MON_003B');

        expect(evolved.templateId).toBe('MON_003B');
        expect(evolved.canonSpeciesId).toBe('moonquill');
    });

    it('canonSpeciesId permanece floracura após evolução', () => {
        const base = makeInstance({
            templateId: 'MON_004',
            class: 'Curandeiro',
            canonSpeciesId: 'floracura',
        });
        const evolved = simulateEvolution(base, 'MON_004B');

        expect(evolved.templateId).toBe('MON_004B');
        expect(evolved.canonSpeciesId).toBe('floracura');
    });

    it('canonSpeciesId da instância prevalece — leitura via instância é o padrão correto', () => {
        // A proteção central: canonSpeciesId é lido da INSTÂNCIA, não rederivado.
        // Após Fase 8, MON_010B também está no bridge (retorna 'shieldhorn'),
        // mas o padrão de uso correto continua sendo ler da instância.
        // A instância carrega o canonSpeciesId definido na criação, que não muda.
        const base = makeInstance({ templateId: 'MON_010', canonSpeciesId: 'shieldhorn' });
        const evolved = simulateEvolution(base, 'MON_010B');

        // Ler da instância = correto e eficiente
        expect(evolved.canonSpeciesId).toBe('shieldhorn'); // ← isso é o que deve acontecer

        // A instância não foi alterada pelo simulateEvolution (apenas templateId muda)
        expect(evolved.templateId).toBe('MON_010B');
    });
});

// ---------------------------------------------------------------------------
// Parte 3 — Passiva continua funcional após evolução
// ---------------------------------------------------------------------------

describe('resolvePassiveModifier — lê canonSpeciesId da instância (não templateId)', () => {

    it('passiva shieldhorn funciona em instância base (MON_010)', () => {
        const instance = makeInstance({ templateId: 'MON_010', canonSpeciesId: 'shieldhorn' });
        const context = { event: 'on_hit_received', isFirstHitThisTurn: true };
        const modifier = resolvePassiveModifier(instance, context);

        expect(modifier).not.toBeNull();
        expect(modifier.damageReduction).toBe(1);
    });

    it('passiva shieldhorn continua funcional após evolução para MON_010B', () => {
        const base = makeInstance({ templateId: 'MON_010', canonSpeciesId: 'shieldhorn' });
        const evolved = simulateEvolution(base, 'MON_010B');

        const context = { event: 'on_hit_received', isFirstHitThisTurn: true };
        const modifier = resolvePassiveModifier(evolved, context);

        // canonSpeciesId ainda é shieldhorn na instância — passiva funciona
        expect(modifier).not.toBeNull();
        expect(modifier.damageReduction).toBe(1);
    });

    it('passiva NÃO funcionaria se canonSpeciesId fosse apagado (simulação do bug)', () => {
        const base = makeInstance({ templateId: 'MON_010', canonSpeciesId: 'shieldhorn' });
        const brokenEvolved = { ...base, templateId: 'MON_010B', canonSpeciesId: null };

        const context = { event: 'on_hit_received', isFirstHitThisTurn: true };
        const modifier = resolvePassiveModifier(brokenEvolved, context);

        // Sem canonSpeciesId: passiva silenciosamente desaparece
        expect(modifier).toBeNull();
    });

    it('passiva emberfang continua funcional após evolução', () => {
        const base = makeInstance({
            templateId: 'MON_007',
            class: 'Bárbaro',
            canonSpeciesId: 'emberfang',
        });
        const evolved = simulateEvolution(base, 'MON_007B');

        // hpPct passado no contexto (emberfang dispara apenas quando hpPct > 0.70)
        const context = { event: 'on_attack', isOffensiveSkill: true, hpPct: 0.85 };
        const modifier = resolvePassiveModifier(evolved, context);

        expect(modifier).not.toBeNull();
        expect(modifier.atkBonus).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// Parte 4 — Kit swap continua funcional após evolução
// ---------------------------------------------------------------------------

describe('applyKitSwaps / getEffectiveSkills — leem canonSpeciesId da instância', () => {

    // Skills mock para a classe Guerreiro (slot 1 = skill de identidade)
    const mockGuerreiroSkills = [
        { id: 'skl_ataque_basico', name: 'Ataque Básico', type: 'DAMAGE', power: 10, energy_cost: 0 },
        { id: 'skl_defesa', name: 'Defesa', type: 'BUFF', power: 0, energy_cost: 2 },
    ];

    it('applyKitSwaps aplica swap corretamente em instância base', () => {
        const instance = makeInstance({
            templateId: 'MON_010',
            canonSpeciesId: 'shieldhorn',
            unlockedSkillSlots: 1,
        });

        const result = applyKitSwaps(instance, mockGuerreiroSkills);
        // shieldhorn aplica swap no slot 1 (identidade)
        expect(result.appliedKitSwaps.length).toBeGreaterThan(0);
        // slot 1 → índice 0, verifica que o swap foi registrado para o slot correto
        expect(result.appliedKitSwaps[0].slot).toBe(1);
        expect(result.appliedKitSwaps[0].replacementId).toBe('shieldhorn_heavy_strike');
    });

    it('applyKitSwaps continua funcionando após evolução (templateId mudou, canonSpeciesId não)', () => {
        const base = makeInstance({
            templateId: 'MON_010',
            canonSpeciesId: 'shieldhorn',
            unlockedSkillSlots: 1,
        });
        const evolved = simulateEvolution(base, 'MON_010B');

        const result = applyKitSwaps(evolved, mockGuerreiroSkills);
        // canonSpeciesId ainda é shieldhorn — swap ainda se aplica
        expect(result.appliedKitSwaps.length).toBeGreaterThan(0);
        expect(result.appliedKitSwaps[0].slot).toBe(1);
        expect(result.appliedKitSwaps[0].replacementId).toBe('shieldhorn_heavy_strike');
    });

    it('applyKitSwaps NÃO funcionaria se canonSpeciesId fosse null (simulação do bug)', () => {
        const brokenEvolved = makeInstance({
            templateId: 'MON_010B',
            canonSpeciesId: null, // ← o que aconteceria com rederivaçao errada
            unlockedSkillSlots: 1,
        });

        const result = applyKitSwaps(brokenEvolved, mockGuerreiroSkills);
        // Sem canonSpeciesId: sem swap aplicado
        expect(result.appliedKitSwaps.length).toBe(0);
        expect(result.blockedKitSwaps.length).toBe(0);
    });

    it('getEffectiveSkills retorna kit com swap aplicado após evolução', () => {
        const base = makeInstance({
            templateId: 'MON_010',
            canonSpeciesId: 'shieldhorn',
            unlockedSkillSlots: 1,
            promotedKitSwaps: [],
        });
        const evolved = simulateEvolution(base, 'MON_010B');

        // getEffectiveSkills lê KIT_SWAP_TABLE via canonSpeciesId da instância,
        // não via templateId — portanto continua funcionando após evolução.
        const effectiveSkills = getEffectiveSkills(evolved, mockGuerreiroSkills);
        // shieldhorn substitui skills[0] (slot 1) por Golpe Pesado I
        expect(effectiveSkills[0].name).toBe('Golpe Pesado I');
        expect(effectiveSkills[0]._kitSwapId).toBe('shieldhorn_heavy_strike');
    });
});

// ---------------------------------------------------------------------------
// Parte 5 — resolveAndApply: comportamento correto para templates base vs evoluídos
// ---------------------------------------------------------------------------

describe('resolveAndApply — uso único na criação, correto comportamento para evoluídos', () => {

    const baseStats = { hpMax: 30, atk: 7, def: 9, spd: 4, eneMax: 10 };

    it('retorna canonSpeciesId válido para template base mapeado', () => {
        const result = resolveAndApply('MON_010', baseStats);
        expect(result.canonSpeciesId).toBe('shieldhorn');
    });

    it('retorna canonSpeciesId válido para template evoluído mapeado na Fase 8', () => {
        // Após Fase 8, MON_010B está explicitamente no bridge → retorna shieldhorn.
        const result = resolveAndApply('MON_010B', baseStats);
        expect(result.canonSpeciesId).toBe('shieldhorn');
        // (canonAppliedOffsets depende do canonLoader estar carregado)
    });

    it('retorna null para template não mapeado (sem espécie canônica)', () => {
        const result = resolveAndApply('MON_100', baseStats);
        expect(result.canonSpeciesId).toBeNull();
    });

    it('stats são preservados sem modificação para templates não mapeados', () => {
        const result = resolveAndApply('MON_100', baseStats);
        expect(result.stats.hpMax).toBe(baseStats.hpMax);
        expect(result.stats.atk).toBe(baseStats.atk);
        expect(result.stats.def).toBe(baseStats.def);
    });
});
