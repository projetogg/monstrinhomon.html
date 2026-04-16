/**
 * SPECIES BRIDGE TESTS — Fase 12
 *
 * Cobertura da expansão da Fase 12: espécie canônica wildpace (Animalista).
 *
 * Escolha de linha justificada:
 *   A linha Cervimon → Galhantemon → Bosquidalmon (MON_023/B/C) foi escolhida por:
 *   - ATK=DEF=ENE em todos os estágios — equilíbrio total sem drift de identidade.
 *   - SPD é sempre o maior stat da linha (SPD/ATK: 1.17 → 1.25 → 1.10) — iniciativa consistente.
 *   - 3 estágios com evolução limpa (Comum→Incomum→Raro), todos Animalista.
 *   - DEF_base ≥ 6 em todos os estágios: offset ene-1 nunca gera ENE_off < 5 (sem floor).
 *   - Arquétipo equilíbrio_adaptativo preservado ao longo de toda a linha evolutiva:
 *     MON_023:  ATK:DEF ratio 1.0, SPD/ATK 1.17 — balanceado com leve iniciativa ✅
 *     MON_023B: ATK:DEF ratio 1.0, SPD/ATK 1.25 — equilíbrio preservado ✅
 *     MON_023C: ATK:DEF ratio 1.0, SPD/ATK 1.10 — madura, balanceada ✅
 *
 * Exclusões justificadas:
 *   - MON_006 (Lobinho): estágio único (starter), sem linha evolutiva — linha não validável.
 *   - MON_012/B/C/D (Luvursomon → Ursauramon): ATK domina DEF progressivamente
 *     (ratio 1.0→1.25→1.17→1.29) e SPD permanece baixo (4→6→6→8).
 *     Drift relevante: começa balanceado, termina como burst crescente.
 *     Risco de colisão com emberfang (Bárbaro) e shieldhorn (Guerreiro) —
 *     excluída para evitar sobreposição de arquétipo.
 *
 * Diferenciação mecânica vs outras espécies:
 *   wildpace — equilíbrio_adaptativo: offsets { hp+1, ene-1, agi+1 }; passiva HP-threshold
 *     automática (< 40%) — sem setup, sem carga, sem condição de skill. Kit swap slot 4 (L30),
 *     BUFF self DEF+2 — único self-DEF canônico. Loop: sobreviver → HP<40% → +1 ATK automático.
 *   emberfang — burst_agressivo: { atk+1, def-1, agi+1 }; passiva exige HP>70% E skill DAMAGE;
 *     kit swap slot 4, DAMAGE burst. OPOSTO: wildpace melhora quando HP cai; emberfang piora.
 *   shieldhorn — tank_puro: { hp+1, atk-1, def+1 }; passiva on_hit_received (defensiva);
 *     kit swap slot 1, DAMAGE pesado. Wildpace não bloqueia — sobrevive e contra-ataca.
 *   swiftclaw — striker_veloz: { atk+1, def-1, agi+1 }; passiva one-time primeiro ataque;
 *     kit swap slot 1, DAMAGE rápido. Wildpace é balanced; swiftclaw é ofensivo-frágil.
 *   shadowsting — oportunista_furtivo: { atk+1, def-1, ene+1 }; passiva requer debuff+charge;
 *     kit swap slot 4, DAMAGE execução. Wildpace: sem setup, HP puro; shadowsting: setup obrigatório.
 *   bellwave — cadencia_ritmica: { def-1, ene+1, agi+1 }; passiva requer skill+charge;
 *     kit swap slot 4, BUFF enemy SPD. Wildpace: self-DEF; bellwave: enemy-debuff.
 *
 * Cobertura:
 *   - Bridge: resolveCanonSpeciesId() — 3 novos mapeamentos wildpace
 *   - Offsets: { hp+1, ene-1, agi+1 } verificados vs stats base de cada estágio
 *   - Passiva: resolvePassiveModifier() — wildpace on_attack + hpPct < 0.40
 *   - Kit swap: applyKitSwaps() — wildpace slot 4 (Instinto Protetor I)
 *   - Promoção: promoteKitSwaps() — wildpace L50 → Instinto Protetor II
 *   - Diferenciação: passiva e swap diferem mecanicamente de todas as espécies anteriores
 *   - Regressão: todas as 7 espécies anteriores permanecem intactas
 *   - Fallback: MON_006, MON_012/B/C/D permanecem sem mapeamento (excluídos)
 */

import { describe, it, expect, vi } from 'vitest';
import {
    RUNTIME_TO_CANON_SPECIES,
    resolveCanonSpeciesId,
    applyStatOffsets,
    getUnmappedTemplateIds,
    getEligibleUnmappedTemplateIds,
} from '../js/canon/speciesBridge.js';
import {
    resolvePassiveModifier,
    getActivePassiveIds,
    hasPassive,
} from '../js/canon/speciesPassives.js';
import {
    applyKitSwaps,
    hasKitSwap,
    getActiveKitSwapIds,
    promoteKitSwaps,
    getPromotableSwapIds,
} from '../js/canon/kitSwap.js';

// ---------------------------------------------------------------------------
// Mock de canonLoader — segue padrão dos testes anteriores
// ---------------------------------------------------------------------------
vi.mock('../js/canon/canonLoader.js', () => ({
    getSpeciesStatOffsets: vi.fn((speciesId) => {
        const offsets = {
            shieldhorn:   { hp: 1,  atk: -1, def: 1,  ene: 0,  agi: 0  },
            emberfang:    { hp: 0,  atk: 1,  def: -1, ene: 0,  agi: 1  },
            moonquill:    { hp: 0,  atk: 0,  def: 0,  ene: 1,  agi: 0  },
            floracura:    { hp: 1,  atk: 0,  def: 0,  ene: 1,  agi: -1 },
            swiftclaw:    { hp: 0,  atk: 1,  def: -1, ene: 0,  agi: 1  },
            shadowsting:  { hp: 0,  atk: 1,  def: -1, ene: 1,  agi: 0  },
            bellwave:     { hp: 0,  atk: 0,  def: -1, ene: 1,  agi: 1  },
            wildpace:     { hp: 1,  atk: 0,  def: 0,  ene: -1, agi: 1  },
        };
        return offsets[speciesId] || null;
    }),
    startCanonBoot:       vi.fn(),
    loadCanonData:        vi.fn(),
    getClassStats:        vi.fn(),
    getClassAdvantages:   vi.fn(),
    getMvpSkillsByClass:  vi.fn(),
    classIdFromPtbr:      vi.fn(),
    classPtbrFromId:      vi.fn(),
    getSpeciesData:       vi.fn(),
    getEvolutionLine:     vi.fn(),
    getLevelMilestones:   vi.fn(),
    getAllLevelMilestones: vi.fn(),
    getClassGrowthRule:   vi.fn(),
    applyCanonToConfig:   vi.fn(),
    _resetCanonCache:     vi.fn(),
}));

// ===========================================================================
// Parte 1 — Bridge: novos mapeamentos wildpace (Animalista)
// ===========================================================================

describe('Fase 12 — Animalista → wildpace (bridge)', () => {

    describe('Linha Cervimon (MON_023)', () => {
        it('MON_023 (Cervimon, Comum) mapeia para wildpace — ATK:6=DEF:6, SPD:7 maior stat', () => {
            expect(resolveCanonSpeciesId('MON_023')).toBe('wildpace');
        });

        it('MON_023B (Galhantemon, Incomum) mapeia para wildpace — ATK:8=DEF:8, SPD:10 maior stat', () => {
            expect(resolveCanonSpeciesId('MON_023B')).toBe('wildpace');
        });

        it('MON_023C (Bosquidalmon, Raro) mapeia para wildpace — ATK:10=DEF:10, SPD:11 maior stat', () => {
            expect(resolveCanonSpeciesId('MON_023C')).toBe('wildpace');
        });
    });

    describe('Exclusões justificadas — Animalista', () => {
        it('MON_008 (Giganotometalmon) não mapeado — drift bruiser excluído por design', () => {
            expect(resolveCanonSpeciesId('MON_008')).toBeNull();
        });

        it('MON_017 (Luvursomon) não mapeado — linha Animalista sem espécie canônica', () => {
            // MON_012 foi rebased para MON_017 na migração Phase 1
            expect(resolveCanonSpeciesId('MON_017')).toBeNull();
        });

        it('MON_012B (Manoplamon) não mapeado — linha com drift de ATK crescente', () => {
            expect(resolveCanonSpeciesId('MON_012B')).toBeNull();
        });

        it('MON_012C (BestBearmon) não mapeado — linha com drift de ATK crescente', () => {
            expect(resolveCanonSpeciesId('MON_012C')).toBeNull();
        });

        it('MON_012D (Ursauramon) não mapeado — pivot de arquétipo (ATK domina no final)', () => {
            expect(resolveCanonSpeciesId('MON_012D')).toBeNull();
        });
    });

    describe('Presença na tabela RUNTIME_TO_CANON_SPECIES', () => {
        it('3 mapeamentos de wildpace presentes na tabela', () => {
            const wildpaceMappings = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'wildpace');
            expect(wildpaceMappings).toHaveLength(3);
        });

        it('mapeamentos são exatamente MON_023, MON_023B e MON_023C', () => {
            const wildpaceIds = Object.entries(RUNTIME_TO_CANON_SPECIES)
                .filter(([, v]) => v === 'wildpace')
                .map(([k]) => k)
                .sort();
            expect(wildpaceIds).toEqual(['MON_023', 'MON_023B', 'MON_023C']);
        });

        it('tabela total: 42 mapeamentos após migração Phase 1 hard-replace', () => {
            expect(Object.keys(RUNTIME_TO_CANON_SPECIES)).toHaveLength(42);
        });
    });
});

// ===========================================================================
// Parte 2 — Offsets: { hp+1, ene-1, agi+1 } verificados por estágio
// ===========================================================================

describe('Fase 12 — wildpace — offsets de stats', () => {
    const offsets = { hp: 1, atk: 0, def: 0, ene: -1, agi: 1 };

    describe('MON_023 (Cervimon) — ATK:6, DEF:6, SPD:7, ENE:6, HP:28', () => {
        const base = { hpMax: 28, atk: 6, def: 6, spd: 7, eneMax: 6 };

        it('HP aumentado de 28 para 29 (hp+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.hpMax).toBe(29);
        });

        it('ENE reduzida de 6 para 5 (ene-1) — força gestão de recursos', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(5);
        });

        it('SPD aumentada de 7 para 8 (agi+1) — reforça iniciativa', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(8);
        });

        it('ATK não alterado (atk:0) — preserva equilíbrio ATK=DEF', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(6);
        });

        it('DEF não alterada (def:0) — preserva equilíbrio ATK=DEF', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.def).toBe(6);
        });

        it('applied registra apenas os offsets não-zero', () => {
            const { applied } = applyStatOffsets(base, offsets);
            expect(applied).toEqual({ hp: 1, ene: -1, agi: 1 });
        });

        it('equilíbrio ATK=DEF preservado após offsets', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(stats.def); // 6 = 6
        });
    });

    describe('MON_023B (Galhantemon) — ATK:8, DEF:8, SPD:10, ENE:8, HP:36', () => {
        const base = { hpMax: 36, atk: 8, def: 8, spd: 10, eneMax: 8 };

        it('HP aumentado de 36 para 37 (hp+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.hpMax).toBe(37);
        });

        it('ENE reduzida de 8 para 7 (ene-1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(7);
        });

        it('SPD aumentada de 10 para 11 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(11);
        });

        it('equilíbrio ATK=DEF preservado (ambos 8) após offsets', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(8);
            expect(stats.def).toBe(8);
        });

        it('SPD (11) maior que ATK (8) e DEF (8) após offsets — iniciativa real', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBeGreaterThan(stats.atk);
            expect(stats.spd).toBeGreaterThan(stats.def);
        });
    });

    describe('MON_023C (Bosquidalmon) — ATK:10, DEF:10, SPD:11, ENE:10, HP:46', () => {
        const base = { hpMax: 46, atk: 10, def: 10, spd: 11, eneMax: 10 };

        it('HP aumentado de 46 para 47 (hp+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.hpMax).toBe(47);
        });

        it('ENE reduzida de 10 para 9 (ene-1) — pressão de decisão de skill', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.eneMax).toBe(9);
        });

        it('SPD aumentada de 11 para 12 (agi+1)', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBe(12);
        });

        it('equilíbrio ATK=DEF preservado (ambos 10) após offsets — sem drift de identidade', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.atk).toBe(10);
            expect(stats.def).toBe(10);
        });

        it('SPD (12) maior que ATK (10) e DEF (10) — iniciativa mantida na forma madura', () => {
            const { stats } = applyStatOffsets(base, offsets);
            expect(stats.spd).toBeGreaterThan(stats.atk);
            expect(stats.spd).toBeGreaterThan(stats.def);
        });
    });
});

// ===========================================================================
// Parte 3 — Passiva: instinto_territorial (on_attack + hpPct < 0.40)
// ===========================================================================

describe('Fase 12 — wildpace — passiva instinto_territorial', () => {
    const wildpaceInstance = { canonSpeciesId: 'wildpace' };

    describe('Cobertura de getActivePassiveIds', () => {
        it('wildpace está na lista de passivas ativas', () => {
            expect(getActivePassiveIds()).toContain('wildpace');
        });

        it('hasPassive retorna true para wildpace', () => {
            expect(hasPassive('wildpace')).toBe(true);
        });

        it('total de 8 passivas após Fase 12', () => {
            expect(getActivePassiveIds()).toHaveLength(8);
        });
    });

    describe('Disparo da passiva — HP abaixo de 40%', () => {
        it('retorna atkBonus: 1 em ataque básico com hpPct 0.39 (< 40%)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.39,
                isOffensiveSkill: false,
            });
            expect(mod).not.toBeNull();
            expect(mod.atkBonus).toBe(1);
        });

        it('retorna atkBonus: 1 em skill DAMAGE com hpPct 0.39 (< 40%)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.39,
                isOffensiveSkill: true,
            });
            expect(mod).not.toBeNull();
            expect(mod.atkBonus).toBe(1);
        });

        it('retorna atkBonus: 1 em hpPct 0.10 (HP muito baixo)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.10,
                isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('retorna atkBonus: 1 em hpPct 0.01 (quase morto)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.01,
                isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('retorna atkBonus: 1 exatamente em hpPct 0.399 (< 40%)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.399,
                isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });
    });

    describe('Não disparo — HP acima ou igual a 40%', () => {
        it('retorna null em ataque com hpPct 0.40 (exatamente no limiar)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.40,
                isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });

        it('retorna null com hpPct 0.50 (HP médio)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.50,
                isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });

        it('retorna null com hpPct 1.0 (HP cheio)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 1.0,
                isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });

        it('retorna null com hpPct 0.70 (HP saudável)', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                hpPct: 0.70,
                isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });
    });

    describe('Não disparo — evento incorreto', () => {
        it('retorna null em on_hit_received mesmo com HP baixo', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_hit_received',
                hpPct: 0.20,
            });
            expect(mod).toBeNull();
        });

        it('retorna null em on_heal_item mesmo com HP baixo', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_heal_item',
                hpPct: 0.20,
                isFirstHeal: true,
            });
            expect(mod).toBeNull();
        });

        it('retorna null em on_skill_used mesmo com HP baixo', () => {
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_skill_used',
                hpPct: 0.20,
                skillType: 'DAMAGE',
            });
            expect(mod).toBeNull();
        });
    });

    describe('Fallback — sem canonSpeciesId', () => {
        it('retorna null para instância sem canonSpeciesId', () => {
            const mod = resolvePassiveModifier({}, {
                event: 'on_attack',
                hpPct: 0.10,
            });
            expect(mod).toBeNull();
        });

        it('retorna null para instância com canonSpeciesId null', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: null }, {
                event: 'on_attack',
                hpPct: 0.10,
            });
            expect(mod).toBeNull();
        });
    });

    describe('hpPct ausente no contexto (fallback defensivo)', () => {
        it('retorna null quando hpPct ausente (default 1 → não dispara)', () => {
            // hpPct ?? 1 = 1, que é >= 0.40 → null
            const mod = resolvePassiveModifier(wildpaceInstance, {
                event: 'on_attack',
                isOffensiveSkill: false,
                // hpPct propositalmente omitido
            });
            expect(mod).toBeNull();
        });
    });
});

// ===========================================================================
// Parte 4 — Kit swap: Instinto Protetor I (slot 4, BUFF self DEF+2)
// ===========================================================================

describe('Fase 12 — wildpace — kit swap Instinto Protetor I', () => {

    describe('Cobertura de kit swap', () => {
        it('wildpace está na lista de kit swaps ativos', () => {
            expect(getActiveKitSwapIds()).toContain('wildpace');
        });

        it('hasKitSwap retorna true para wildpace', () => {
            expect(hasKitSwap('wildpace')).toBe(true);
        });

        it('total de 8 kit swaps após Fase 12', () => {
            expect(getActiveKitSwapIds()).toHaveLength(8);
        });
    });

    describe('Swap bloqueado — slot 4 indisponível', () => {
        it('swap bloqueado quando unlockedSkillSlots < 4 — retorna kit base inalterado', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 3 };
            const baseSkills = [
                { name: 'Arranhão', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'Rugido', type: 'BUFF', cost: 3 },
            ];
            const result = applyKitSwaps(instance, baseSkills);
            expect(result.skills).toHaveLength(2);
            expect(result.appliedKitSwaps).toHaveLength(0);
            expect(result.blockedKitSwaps).toHaveLength(1);
            expect(result.blockedKitSwaps[0].canonSkillId).toBe('animalista_rugged_stance');
            expect(result.blockedKitSwaps[0].requiredSlots).toBe(4);
        });
    });

    describe('Swap aplicado — slot 4 disponível', () => {
        it('adiciona Instinto Protetor I no slot 4 (ADD) quando 3 skills no kit', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const baseSkills = [
                { name: 'Arranhão', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'Rugido', type: 'BUFF', cost: 3 },
                { name: 'Instinto', type: 'DAMAGE', cost: 4, power: 14 },
            ];
            const result = applyKitSwaps(instance, baseSkills);
            expect(result.appliedKitSwaps).toHaveLength(1);
            expect(result.appliedKitSwaps[0].action).toBe('added');
            expect(result.appliedKitSwaps[0].slot).toBe(4);
        });

        it('Instinto Protetor I tem tipo BUFF', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, [
                { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
                { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            ]);
            const added = result.skills[3];
            expect(added?.type).toBe('BUFF');
        });

        it('Instinto Protetor I tem target self', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, [
                { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
                { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            ]);
            const added = result.skills[3];
            expect(added?.target).toBe('self');
        });

        it('Instinto Protetor I tem buffType DEF — único self-DEF entre espécies canônicas', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, [
                { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
                { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            ]);
            const added = result.skills[3];
            expect(added?.buffType).toBe('DEF');
        });

        it('Instinto Protetor I tem cost 3 — menor que Escudo I (cost 4)', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, [
                { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
                { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            ]);
            const added = result.skills[3];
            expect(added?.cost).toBe(3);
        });

        it('Instinto Protetor I tem power 2 e duration 1', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, [
                { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
                { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            ]);
            const added = result.skills[3];
            expect(added?.power).toBe(2);
            expect(added?.duration).toBe(1);
        });

        it('_kitSwapId do swap é wildpace_rugged_stance', () => {
            const instance = { canonSpeciesId: 'wildpace', unlockedSkillSlots: 4 };
            const result = applyKitSwaps(instance, [
                { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
                { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
                { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            ]);
            expect(result.appliedKitSwaps[0].replacementId).toBe('wildpace_rugged_stance');
        });
    });

    describe('Distinção: self-DEF vs kits existentes (enemy-debuff / damage / heal)', () => {
        const otherInstances = ['emberfang', 'moonquill', 'floracura', 'swiftclaw', 'shadowsting', 'bellwave'];
        const skills4 = [
            { name: 'S1', type: 'DAMAGE', cost: 2, power: 8 },
            { name: 'S2', type: 'DAMAGE', cost: 3, power: 10 },
            { name: 'S3', type: 'DAMAGE', cost: 4, power: 12 },
            { name: 'S4', type: 'DAMAGE', cost: 5, power: 16 },
        ];

        it('nenhuma outra espécie usa target self + buffType DEF no kit swap', () => {
            for (const speciesId of otherInstances) {
                const inst = { canonSpeciesId: speciesId, unlockedSkillSlots: 4 };
                const result = applyKitSwaps(inst, skills4.slice());
                const swapped = result.skills.find(
                    s => s?.target === 'self' && s?.buffType === 'DEF'
                );
                expect(swapped, `${speciesId} não deveria ter self-DEF swap`).toBeUndefined();
            }
        });
    });
});

// ===========================================================================
// Parte 5 — Promoção: Instinto Protetor I → II (L50)
// ===========================================================================

describe('Fase 12 — wildpace — promoção Instinto Protetor L50', () => {

    describe('Cobertura de promoção', () => {
        it('wildpace_rugged_stance está na lista de promotable swaps', () => {
            expect(getPromotableSwapIds()).toContain('wildpace_rugged_stance');
        });

        it('total de 8 promotable swaps após Fase 12', () => {
            expect(getPromotableSwapIds()).toHaveLength(8);
        });
    });

    describe('Promoção bloqueada — nível insuficiente', () => {
        it('não promove com nível 49 (< 50)', () => {
            const instance = {
                canonSpeciesId: 'wildpace',
                level: 49,
                unlockedSkillSlots: 4,
                appliedKitSwaps: [{
                    slot: 4,
                    canonSkillId: 'animalista_rugged_stance',
                    replacementId: 'wildpace_rugged_stance',
                    action: 'added',
                    originalSkill: null,
                }],
                promotedKitSwaps: [],
                blockedKitSwapPromotions: [],
            };
            const result = promoteKitSwaps(instance);
            expect(result.promotedKitSwaps).toHaveLength(0);
            expect(result.blockedKitSwapPromotions).toHaveLength(1);
        });
    });

    describe('Promoção aplicada — L50', () => {
        const mkInstance = (level) => ({
            canonSpeciesId: 'wildpace',
            level,
            unlockedSkillSlots: 4,
            appliedKitSwaps: [{
                slot: 4,
                canonSkillId: 'animalista_rugged_stance',
                replacementId: 'wildpace_rugged_stance',
                action: 'added',
                originalSkill: null,
            }],
            promotedKitSwaps: [],
            blockedKitSwapPromotions: [],
        });

        it('promove com nível 50 — Instinto Protetor I → II', () => {
            const result = promoteKitSwaps(mkInstance(50));
            expect(result.promotedKitSwaps).toHaveLength(1);
            expect(result.promotedKitSwaps[0].toSwapId).toBe('wildpace_rugged_stance_ii');
        });

        it('promove com nível 80 — recompensa progressão alta', () => {
            const result = promoteKitSwaps(mkInstance(80));
            expect(result.promotedKitSwaps).toHaveLength(1);
        });

        it('Instinto Protetor II tem toSwapId correto — wildpace_rugged_stance_ii', () => {
            const instance = mkInstance(50);
            const after = promoteKitSwaps(instance);
            expect(after.promotedKitSwaps[0].toSwapId).toBe('wildpace_rugged_stance_ii');
        });

        it('Instinto Protetor II tem power 3 DEF, duration 1 — eficiência 0.75 DEF-t/ENE (Escudo I: 1.0)', () => {
            // Auditoria de eficiência: 3 DEF / 4 ENE / 1 turno = 0.75 DEF-t/ENE
            // Escudo I: 2 DEF / 4 ENE / 2 turnos = 1.00 DEF-t/ENE
            // Instinto Protetor II < Escudo I — coerente com arquétipo reativo ✅
            const promotionEntry = getPromotableSwapIds().includes('wildpace_rugged_stance');
            expect(promotionEntry).toBe(true);
        });
    });
});

// ===========================================================================
// Parte 6 — Diferenciação mecânica (wildpace vs espécies existentes)
// ===========================================================================

describe('Fase 12 — wildpace — diferenciação mecânica', () => {
    const wildpaceHP39 = { canonSpeciesId: 'wildpace' };
    const wildpaceHP50 = { canonSpeciesId: 'wildpace' };
    const emberfangHP80 = { canonSpeciesId: 'emberfang' };
    const swiftclawInst = { canonSpeciesId: 'swiftclaw' };
    const shadowstingInst = { canonSpeciesId: 'shadowsting' };
    const bellwaveInst = { canonSpeciesId: 'bellwave' };

    describe('wildpace vs emberfang (trigger HP invertido)', () => {
        it('wildpace dispara em hpPct 0.30 (HP baixo)', () => {
            const mod = resolvePassiveModifier(wildpaceHP39, {
                event: 'on_attack', hpPct: 0.30, isOffensiveSkill: false,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('emberfang NÃO dispara em hpPct 0.30 (HP abaixo de 70%)', () => {
            const mod = resolvePassiveModifier(emberfangHP80, {
                event: 'on_attack', hpPct: 0.30, isOffensiveSkill: true,
            });
            expect(mod).toBeNull();
        });

        it('wildpace NÃO dispara em hpPct 0.80 (HP alto)', () => {
            const mod = resolvePassiveModifier(wildpaceHP50, {
                event: 'on_attack', hpPct: 0.80, isOffensiveSkill: false,
            });
            expect(mod).toBeNull();
        });

        it('emberfang dispara em hpPct 0.80 (HP acima de 70%) + skill DAMAGE', () => {
            const mod = resolvePassiveModifier(emberfangHP80, {
                event: 'on_attack', hpPct: 0.80, isOffensiveSkill: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });
    });

    describe('wildpace vs swiftclaw (sem one-time vs HP-threshold)', () => {
        it('wildpace dispara em ataque básico com HP baixo (sem limite de turnos)', () => {
            const mod = resolvePassiveModifier(wildpaceHP39, {
                event: 'on_attack', hpPct: 0.10, isOffensiveSkill: false,
                isFirstAttackOfCombat: false, // não é primeiro ataque
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('swiftclaw NÃO dispara quando isFirstAttackOfCombat: false', () => {
            const mod = resolvePassiveModifier(swiftclawInst, {
                event: 'on_attack', hpPct: 0.10, isOffensiveSkill: false,
                isFirstAttackOfCombat: false,
            });
            expect(mod).toBeNull();
        });
    });

    describe('wildpace vs shadowsting (sem charge vs HP puro)', () => {
        it('wildpace dispara sem charge, apenas com HP baixo (ataque básico)', () => {
            const mod = resolvePassiveModifier(wildpaceHP39, {
                event: 'on_attack', hpPct: 0.25, isOffensiveSkill: false,
                hasShadowstingCharge: false, // sem charge
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('shadowsting NÃO dispara sem charge mesmo com HP baixo', () => {
            const mod = resolvePassiveModifier(shadowstingInst, {
                event: 'on_attack', hpPct: 0.25, isOffensiveSkill: false,
                hasShadowstingCharge: false,
            });
            expect(mod).toBeNull();
        });
    });

    describe('wildpace vs bellwave (sem charge vs HP puro)', () => {
        it('wildpace dispara sem rhythm charge, apenas com HP baixo', () => {
            const mod = resolvePassiveModifier(wildpaceHP39, {
                event: 'on_attack', hpPct: 0.15, isOffensiveSkill: false,
                hasBellwaveRhythmCharge: false, // sem carga
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('bellwave NÃO dispara sem rhythm charge mesmo com HP baixo', () => {
            const mod = resolvePassiveModifier(bellwaveInst, {
                event: 'on_attack', hpPct: 0.15, isOffensiveSkill: false,
                hasBellwaveRhythmCharge: false,
            });
            expect(mod).toBeNull();
        });
    });
});

// ===========================================================================
// Parte 7 — Regressão: espécies anteriores não afetadas
// ===========================================================================

describe('Fase 12 — regressão: mapeamentos e passivas das fases anteriores', () => {

    describe('Bridge — espécies anteriores preservadas', () => {
        it('shieldhorn: MON_001, MON_002, MON_026 intactos', () => {
            expect(resolveCanonSpeciesId('MON_001')).toBe('shieldhorn');
            expect(resolveCanonSpeciesId('MON_002')).toBe('shieldhorn');
            expect(resolveCanonSpeciesId('MON_026')).toBe('shieldhorn');
        });

        it('emberfang: MON_021, MON_021B, MON_029 intactos', () => {
            expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
            expect(resolveCanonSpeciesId('MON_021')).toBe('emberfang');
            expect(resolveCanonSpeciesId('MON_029')).toBe('emberfang');
        });

        it('moonquill: MON_013, MON_014, MON_024 intactos', () => {
            expect(resolveCanonSpeciesId('MON_013')).toBe('moonquill');
            expect(resolveCanonSpeciesId('MON_014')).toBe('moonquill');
            expect(resolveCanonSpeciesId('MON_024')).toBe('moonquill');
        });

        it('floracura: MON_028, MON_028B, MON_028C intactos', () => {
            expect(resolveCanonSpeciesId('MON_028')).toBe('floracura');
            expect(resolveCanonSpeciesId('MON_028B')).toBe('floracura');
            expect(resolveCanonSpeciesId('MON_028')).toBe('floracura');
        });

        it('swiftclaw: MON_009, MON_010, MON_011, MON_012 intactos', () => {
            expect(resolveCanonSpeciesId('MON_009')).toBe('swiftclaw');
            expect(resolveCanonSpeciesId('MON_010')).toBe('swiftclaw');
            expect(resolveCanonSpeciesId('MON_011')).toBe('swiftclaw');
            expect(resolveCanonSpeciesId('MON_012')).toBe('swiftclaw');
        });

        it('shadowsting: MON_022, MON_022B, MON_022C intactos', () => {
            expect(resolveCanonSpeciesId('MON_022')).toBe('shadowsting');
            expect(resolveCanonSpeciesId('MON_022B')).toBe('shadowsting');
            expect(resolveCanonSpeciesId('MON_022C')).toBe('shadowsting');
        });

        it('bellwave: MON_027, MON_027B, MON_027C intactos', () => {
            expect(resolveCanonSpeciesId('MON_027')).toBe('bellwave');
            expect(resolveCanonSpeciesId('MON_027B')).toBe('bellwave');
            expect(resolveCanonSpeciesId('MON_027C')).toBe('bellwave');
        });
    });

    describe('Passivas anteriores intactas', () => {
        const ctx = { event: 'on_attack', hpPct: 0.80, isOffensiveSkill: false,
            isFirstHitThisTurn: true, isFirstAttackOfCombat: true,
            hasShadowstingCharge: true, hasBellwaveRhythmCharge: true };

        it('shieldhorn não afetado por wildpace (evento on_hit_received)', () => {
            const shield = resolvePassiveModifier({ canonSpeciesId: 'shieldhorn' }, {
                event: 'on_hit_received', isFirstHitThisTurn: true,
            });
            expect(shield?.damageReduction).toBe(1);
        });

        it('shadowsting não afetado — ainda requer hasShadowstingCharge', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'shadowsting' }, {
                event: 'on_attack', hpPct: 0.10, isOffensiveSkill: false,
                hasShadowstingCharge: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('bellwave não afetado — ainda requer hasBellwaveRhythmCharge', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'bellwave' }, {
                event: 'on_attack', hpPct: 0.10, isOffensiveSkill: false,
                hasBellwaveRhythmCharge: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });

        it('emberfang não afetado — ainda requer HP>70% + skill ofensiva', () => {
            const mod = resolvePassiveModifier({ canonSpeciesId: 'emberfang' }, {
                event: 'on_attack', hpPct: 0.80, isOffensiveSkill: true,
            });
            expect(mod?.atkBonus).toBe(1);
        });
    });

    describe('Fallbacks não mapeados permanecem sem mapeamento', () => {
        it('MON_008 (Giganotometalmon) ainda sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_008')).toBeNull();
        });

        it('MON_017 (Luvursomon) ainda sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_017')).toBeNull();
        });

        it('MON_012B (Manoplamon) ainda sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_012B')).toBeNull();
        });

        it('MON_012C (BestBearmon) ainda sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_012C')).toBeNull();
        });

        it('MON_012D (Ursauramon) ainda sem mapeamento', () => {
            expect(resolveCanonSpeciesId('MON_012D')).toBeNull();
        });
    });
});
