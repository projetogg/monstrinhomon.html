/**
 * CANON LOADER TESTS (Fases 1 e 2)
 *
 * Testes para js/canon/canonLoader.js
 * Cobertura: mapeamento de classes, transformação de matchups, indexação de habilidades MVP,
 *            espécies, linhas evolutivas e marcos de progressão por nível
 *
 * Esses testes exercitam as funções puras/síncronas do módulo.
 * As funções assíncronas (loadCanonData) são testadas via mocks de fetch.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    getClassStats,
    getClassAdvantages,
    getMvpSkillsByClass,
    classIdFromPtbr,
    classPtbrFromId,
    loadCanonData,
    startCanonBoot,
    applyCanonToConfig,
    getSpeciesData,
    getEvolutionLine,
    getLevelMilestones,
    getAllLevelMilestones,
    getClassGrowthRule,
    getSpeciesStatOffsets,
    _resetCanonCache,
} from '../js/canon/canonLoader.js';

// ---------------------------------------------------------------------------
// Dados de teste que espelham os arquivos JSON reais
// ---------------------------------------------------------------------------

const MOCK_CLASSES = [
    { id: 'warrior',   name_pt: 'Guerreiro',  role: 'tank_protecao',        base_stats: { hp: 24, atk: 5, def: 8 } },
    { id: 'barbarian', name_pt: 'Bárbaro',    role: 'burst_pressao',        base_stats: { hp: 22, atk: 8, def: 4 } },
    { id: 'mage',      name_pt: 'Mago',       role: 'ofensivo_tecnico',     base_stats: { hp: 18, atk: 7, def: 3 } },
    { id: 'healer',    name_pt: 'Curandeiro', role: 'sustentacao',          base_stats: { hp: 19, atk: 4, def: 3 } },
    { id: 'bard',      name_pt: 'Bardo',      role: 'buff_debuff',          base_stats: { hp: 18, atk: 4, def: 3 } },
    { id: 'rogue',     name_pt: 'Ladino',     role: 'execucao_mobilidade',  base_stats: { hp: 17, atk: 7, def: 2 } },
    { id: 'hunter',    name_pt: 'Caçador',    role: 'pressao_distancia',    base_stats: { hp: 19, atk: 6, def: 3 } },
    { id: 'animalist', name_pt: 'Animalista', role: 'adaptacao',            base_stats: { hp: 21, atk: 6, def: 5 } },
];

const MOCK_MATCHUPS = {
    version: '1.0',
    classes_ptbr: {
        'Guerreiro':  { strong_against: 'Ladino',     weak_against: 'Mago' },
        'Bárbaro':    { strong_against: 'Curandeiro', weak_against: 'Guerreiro' },
        'Mago':       { strong_against: 'Guerreiro',  weak_against: 'Caçador' },
        'Curandeiro': { strong_against: 'Bárbaro',    weak_against: 'Bardo' },
        'Bardo':      { strong_against: 'Curandeiro', weak_against: 'Animalista' },
        'Ladino':     { strong_against: 'Caçador',    weak_against: 'Guerreiro' },
        'Caçador':    { strong_against: 'Mago',       weak_against: 'Ladino' },
        'Animalista': { strong_against: 'Bardo',      weak_against: 'Bárbaro' },
    },
    classes_canonical: {
        warrior:   { strong_against: 'rogue',      weak_against: 'mage' },
        barbarian: { strong_against: 'healer',     weak_against: 'warrior' },
        mage:      { strong_against: 'warrior',    weak_against: 'hunter' },
        healer:    { strong_against: 'barbarian',  weak_against: 'bard' },
        bard:      { strong_against: 'healer',     weak_against: 'animalist' },
        rogue:     { strong_against: 'hunter',     weak_against: 'warrior' },
        hunter:    { strong_against: 'mage',       weak_against: 'rogue' },
        animalist: { strong_against: 'bard',       weak_against: 'barbarian' },
    },
};

const MOCK_SKILLS_MVP = [
    { id: 'warrior_basic_strike', class_id: 'warrior',   slot: 1, name_pt: 'Golpe Firme',      unlock_level: 1,  energy_cost: 0, power: 3 },
    { id: 'warrior_heavy_slash',  class_id: 'warrior',   slot: 2, name_pt: 'Corte Pesado',     unlock_level: 5,  energy_cost: 2, power: 5 },
    { id: 'warrior_guard_ally',   class_id: 'warrior',   slot: 4, name_pt: 'Proteger Aliado',  unlock_level: 30, energy_cost: 4, power: 0 },
    { id: 'mage_arcane_burst',    class_id: 'mage',      slot: 1, name_pt: 'Rajada Arcana',    unlock_level: 1,  energy_cost: 0, power: 3 },
    { id: 'mage_ether_blast',     class_id: 'mage',      slot: 2, name_pt: 'Explosão Etérea',  unlock_level: 5,  energy_cost: 2, power: 5 },
    { id: 'healer_light_touch',   class_id: 'healer',    slot: 1, name_pt: 'Toque de Luz',     unlock_level: 1,  energy_cost: 0, power: 2 },
    { id: 'barbarian_wild_smash', class_id: 'barbarian', slot: 1, name_pt: 'Pancada Selvagem', unlock_level: 1,  energy_cost: 0, power: 4 },
    // Classe fora do MVP deve ser ignorada
    { id: 'bard_song',            class_id: 'bard',      slot: 1, name_pt: 'Canção',           unlock_level: 1,  energy_cost: 0, power: 2 },
];

// Fase 2 — Mock data: espécies, linhas evolutivas, progressão
const MOCK_SPECIES = [
    {
        id: 'shieldhorn', name_pt: 'Escudicorno', class_id: 'warrior', rarity: 'comum',
        archetype: 'tank_puro',
        base_stat_offsets: { hp: 1, atk: -1, def: 1, ene: 0, agi: 0 },
        passive: 'Quando está na frente, recebe +1 de mitigação no primeiro ataque sofrido por turno.',
        kit_swap: { replace_skill_id: 'warrior_basic_strike', with_concept: 'Básico mais pesado e menos veloz' },
    },
    {
        id: 'emberfang', name_pt: 'Presabrasa', class_id: 'barbarian', rarity: 'incomum',
        archetype: 'burst_agressivo',
        base_stat_offsets: { hp: 0, atk: 1, def: -1, ene: 0, agi: 1 },
        passive: 'Ao usar habilidade ofensiva, recebe +1 no confronto se estiver com HP acima de 70%.',
        kit_swap: { replace_skill_id: 'barbarian_berserk', with_concept: 'Explosão de 1 turno ainda mais agressiva' },
    },
    {
        id: 'moonquill', name_pt: 'Plumalua', class_id: 'mage', rarity: 'comum',
        archetype: 'controle_leve',
        base_stat_offsets: { hp: 0, atk: 0, def: 0, ene: 1, agi: 0 },
        passive: 'Se aplicar debuff, ganha +1 AGI até o próximo turno.',
        kit_swap: { replace_skill_id: 'mage_arcane_storm', with_concept: 'Assinatura com menos dano e mais controle' },
    },
];

const MOCK_EVOLUTION_LINES = [
    {
        line_id: 'shieldhorn_line', class_id: 'warrior',
        stages: [
            { stage: 1, species_id: 'shieldhorn', name_pt: 'Escudicorno', level_at: 1 },
            { stage: 2, name_pt: 'Basticorno', level_at: 12 },
            { stage: 3, name_pt: 'Aegishorn',  level_at: 25 },
        ],
        progression_identity: 'Cada evolução reforça sustentação e proteção.',
    },
    {
        line_id: 'emberfang_line', class_id: 'barbarian',
        stages: [
            { stage: 1, species_id: 'emberfang', name_pt: 'Presabrasa',   level_at: 1 },
            { stage: 2, name_pt: 'Furiagume',    level_at: 12 },
            { stage: 3, name_pt: 'Infernomord',  level_at: 25 },
        ],
        progression_identity: 'Aumenta burst e risco; nunca vira tank.',
    },
];

const MOCK_LEVEL_PROGRESSION = {
    levels_1_to_30: [
        { level: 1,  unlocks: ['slot_1'] },
        { level: 5,  unlocks: ['slot_2'] },
        { level: 10, unlocks: ['slot_1_or_2_upgrade'] },
        { level: 15, unlocks: ['slot_3'] },
        { level: 22, unlocks: ['slot_2_or_3_upgrade'] },
        { level: 30, unlocks: ['slot_4'] },
    ],
    class_growth_rules: {
        warrior:   'Priorizar HP/DEF, ATK moderado, AGI baixa',
        barbarian: 'Priorizar ATK, HP bom, DEF moderada/baixa',
        mage:      'Priorizar ENE/ATK, baixa sustentação',
        healer:    'Priorizar ENE, HP moderado, ATK baixo',
    },
};

// ---------------------------------------------------------------------------
// Helpers para mock de fetch
// ---------------------------------------------------------------------------

function makeFetchMock(classesData, matchupsData, skillsData, speciesData, evolutionLinesData, levelProgressionData) {
    return vi.fn(async (url) => {
        const urlStr = String(url);
        let data;
        if (urlStr.includes('classes.json'))           data = classesData;
        else if (urlStr.includes('class_matchups'))    data = matchupsData;
        else if (urlStr.includes('skills_mvp'))        data = skillsData;
        else if (urlStr.includes('species.json'))      data = speciesData;
        else if (urlStr.includes('evolution_lines'))   data = evolutionLinesData;
        else if (urlStr.includes('level_progression')) data = levelProgressionData;
        else throw new Error('URL inesperada: ' + urlStr);
        return { ok: true, json: async () => data };
    });
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('canonLoader — mapeamento de classes', () => {

    it('deve converter nome PT-BR para ID canônico', () => {
        expect(classIdFromPtbr('Guerreiro')).toBe('warrior');
        expect(classIdFromPtbr('Bárbaro')).toBe('barbarian');
        expect(classIdFromPtbr('Mago')).toBe('mage');
        expect(classIdFromPtbr('Curandeiro')).toBe('healer');
        expect(classIdFromPtbr('Bardo')).toBe('bard');
        expect(classIdFromPtbr('Ladino')).toBe('rogue');
        expect(classIdFromPtbr('Caçador')).toBe('hunter');
        expect(classIdFromPtbr('Animalista')).toBe('animalist');
    });

    it('deve retornar null para classe desconhecida em classIdFromPtbr', () => {
        expect(classIdFromPtbr('Dragão')).toBeNull();
        expect(classIdFromPtbr('')).toBeNull();
    });

    it('deve converter ID canônico para nome PT-BR', () => {
        expect(classPtbrFromId('warrior')).toBe('Guerreiro');
        expect(classPtbrFromId('barbarian')).toBe('Bárbaro');
        expect(classPtbrFromId('mage')).toBe('Mago');
        expect(classPtbrFromId('healer')).toBe('Curandeiro');
        expect(classPtbrFromId('bard')).toBe('Bardo');
        expect(classPtbrFromId('rogue')).toBe('Ladino');
        expect(classPtbrFromId('hunter')).toBe('Caçador');
        expect(classPtbrFromId('animalist')).toBe('Animalista');
    });

    it('deve retornar null para ID desconhecido em classPtbrFromId', () => {
        expect(classPtbrFromId('wizard')).toBeNull();
        expect(classPtbrFromId('')).toBeNull();
    });

    it('mapeamento deve ser simétrico (PT-BR ↔ ID)', () => {
        const ptbrNames = ['Guerreiro', 'Bárbaro', 'Mago', 'Curandeiro', 'Bardo', 'Ladino', 'Caçador', 'Animalista'];
        for (const name of ptbrNames) {
            const id = classIdFromPtbr(name);
            expect(id).not.toBeNull();
            expect(classPtbrFromId(id)).toBe(name);
        }
    });
});

describe('canonLoader — funções antes de loadCanonData()', () => {

    beforeEach(() => {
        _resetCanonCache();
    });

    it('getClassStats deve retornar null e emitir aviso antes de carregar', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = getClassStats('Guerreiro');
        expect(result).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('getClassStats'));
        warn.mockRestore();
    });

    it('getClassAdvantages deve retornar objeto vazio antes de carregar', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = getClassAdvantages();
        expect(result).toEqual({});
        warn.mockRestore();
    });

    it('getMvpSkillsByClass deve retornar array vazio antes de carregar', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const result = getMvpSkillsByClass('Guerreiro');
        expect(result).toEqual([]);
        warn.mockRestore();
    });
});

describe('canonLoader — loadCanonData()', () => {

    beforeEach(() => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve carregar sem lançar erros', async () => {
        const data = await loadCanonData();
        expect(data).toBeDefined();
        expect(data.classes).toBeDefined();
        expect(data.matchups).toBeDefined();
        expect(data.skillsMvp).toBeDefined();
    });

    it('deve ser idempotente (cache evita fetch duplo)', async () => {
        await loadCanonData();
        await loadCanonData();
        // fetch deve ter sido chamado 6 vezes (uma por arquivo: 3 Fase 1 + 3 Fase 2)
        expect(global.fetch).toHaveBeenCalledTimes(6);
    });

    it('getClassStats deve funcionar após carregar (por nome PT-BR)', async () => {
        await loadCanonData();
        const stats = getClassStats('Guerreiro');
        expect(stats).not.toBeNull();
        expect(stats.id).toBe('warrior');
        expect(stats.base_stats.hp).toBe(24);
    });

    it('getClassStats deve funcionar após carregar (por ID canônico)', async () => {
        await loadCanonData();
        const stats = getClassStats('warrior');
        expect(stats).not.toBeNull();
        expect(stats.name_pt).toBe('Guerreiro');
    });

    it('getClassStats deve retornar null para classe desconhecida', async () => {
        await loadCanonData();
        expect(getClassStats('Dragão')).toBeNull();
        expect(getClassStats('wizard')).toBeNull();
    });
});

describe('canonLoader — getClassAdvantages()', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar tabela com todas as 8 classes', () => {
        const adv = getClassAdvantages();
        const classes = ['Guerreiro', 'Bárbaro', 'Mago', 'Curandeiro', 'Bardo', 'Ladino', 'Caçador', 'Animalista'];
        for (const cls of classes) {
            expect(adv[cls]).toBeDefined();
        }
    });

    it('deve ter formato { strong, weak } compatível com o motor', () => {
        const adv = getClassAdvantages();
        for (const [, val] of Object.entries(adv)) {
            expect(val).toHaveProperty('strong');
            expect(val).toHaveProperty('weak');
        }
    });

    it('Guerreiro deve ser forte contra Ladino e fraco contra Mago (cânone)', () => {
        const adv = getClassAdvantages();
        expect(adv['Guerreiro'].strong).toBe('Ladino');
        expect(adv['Guerreiro'].weak).toBe('Mago');
    });

    it('Mago deve ser forte contra Guerreiro e fraco contra Caçador (cânone)', () => {
        const adv = getClassAdvantages();
        expect(adv['Mago'].strong).toBe('Guerreiro');
        expect(adv['Mago'].weak).toBe('Caçador');
    });

    it('Bárbaro deve ser forte contra Curandeiro e fraco contra Guerreiro (cânone)', () => {
        const adv = getClassAdvantages();
        expect(adv['Bárbaro'].strong).toBe('Curandeiro');
        expect(adv['Bárbaro'].weak).toBe('Guerreiro');
    });

    it('Curandeiro deve ser forte contra Bárbaro e fraco contra Bardo (cânone)', () => {
        const adv = getClassAdvantages();
        expect(adv['Curandeiro'].strong).toBe('Bárbaro');
        expect(adv['Curandeiro'].weak).toBe('Bardo');
    });
});

describe('canonLoader — getMvpSkillsByClass()', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar habilidades do Guerreiro (por nome PT-BR)', () => {
        const skills = getMvpSkillsByClass('Guerreiro');
        expect(skills.length).toBeGreaterThan(0);
        const ids = skills.map(s => s.id);
        expect(ids).toContain('warrior_basic_strike');
        expect(ids).toContain('warrior_heavy_slash');
    });

    it('deve retornar habilidades do Guerreiro (por ID canônico)', () => {
        const skills = getMvpSkillsByClass('warrior');
        expect(skills.length).toBeGreaterThan(0);
        expect(skills[0].class_id).toBe('warrior');
    });

    it('deve retornar habilidades do Mago', () => {
        const skills = getMvpSkillsByClass('Mago');
        const ids = skills.map(s => s.id);
        expect(ids).toContain('mage_arcane_burst');
    });

    it('deve retornar habilidades do Bárbaro', () => {
        const skills = getMvpSkillsByClass('Bárbaro');
        const ids = skills.map(s => s.id);
        expect(ids).toContain('barbarian_wild_smash');
    });

    it('habilidade de Bardo (fora do MVP fase 1) não deve aparecer', () => {
        // Verificação: MOCK_SKILLS_MVP contém a entrada do Bardo (bard_song)
        expect(MOCK_SKILLS_MVP.some(s => s.class_id === 'bard')).toBe(true);
        // Mesmo com a entrada presente no arquivo, _indexMvpSkills deve filtrá-la
        const skills = getMvpSkillsByClass('Bardo');
        expect(skills).toEqual([]);
    });

    it('classes fora do MVP fase 1 (Ladino, Caçador, Animalista) devem retornar array vazio', () => {
        // Mesmo que existissem entradas no arquivo, seriam filtradas pelo MVP_PHASE1_CLASSES
        for (const cls of ['Ladino', 'Caçador', 'Animalista']) {
            expect(getMvpSkillsByClass(cls)).toEqual([]);
        }
    });

    it('deve retornar array vazio para classe desconhecida', () => {
        const skills = getMvpSkillsByClass('Dragão');
        expect(skills).toEqual([]);
    });

    it('ataque básico do Guerreiro não deve ter custo de energia', () => {
        const skills = getMvpSkillsByClass('Guerreiro');
        const basic = skills.find(s => s.slot === 1);
        expect(basic).toBeDefined();
        expect(basic.energy_cost).toBe(0);
    });

    it('habilidade especial do Guerreiro (slot 2) deve ter custo de energia', () => {
        const skills = getMvpSkillsByClass('Guerreiro');
        const special = skills.find(s => s.slot === 2);
        expect(special).toBeDefined();
        expect(special.energy_cost).toBeGreaterThan(0);
    });
});

describe('canonLoader — tratamento de erro em loadCanonData()', () => {

    beforeEach(() => {
        _resetCanonCache();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve lançar erro se fetch falhar', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
        await expect(loadCanonData()).rejects.toThrow('[canonLoader]');
    });

    it('deve lançar erro se fetch rejeitar', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
        await expect(loadCanonData()).rejects.toThrow('Network error');
    });
});

describe('canonLoader — startCanonBoot()', () => {

    beforeEach(() => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar a mesma promise em chamadas múltiplas (idempotente)', async () => {
        const p1 = startCanonBoot();
        const p2 = startCanonBoot();
        expect(p1).toBe(p2);
        await p1;
        // fetch deve ter sido chamado 6 vezes no total (3 Fase 1 + 3 Fase 2)
        expect(global.fetch).toHaveBeenCalledTimes(6);
    });

    it('deve carregar os dados quando aguardado', async () => {
        await startCanonBoot();
        // Após o boot, getClassAdvantages deve funcionar
        const adv = getClassAdvantages();
        expect(adv['Guerreiro']).toBeDefined();
    });
});

describe('canonLoader — applyCanonToConfig()', () => {

    beforeEach(() => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve sobrescrever classAdvantages no config após carregar', async () => {
        const config = {
            classAdvantages: {
                'Guerreiro': { strong: 'Ladino', weak: 'Curandeiro' }, // tabela legada
            }
        };
        await applyCanonToConfig(config);
        // Deve ter substituído pela tabela canônica
        expect(config.classAdvantages['Guerreiro'].weak).toBe('Mago');
        expect(config.classAdvantages['Mago']).toBeDefined();
    });

    it('deve funcionar com startCanonBoot já iniciado (sem fetch duplo)', async () => {
        startCanonBoot(); // simula o início precoce no parse do módulo
        const config = { classAdvantages: {} };
        await applyCanonToConfig(config);
        // fetch chamado 6 vezes (não duplicado — promise compartilhada entre startCanonBoot e applyCanonToConfig)
        expect(global.fetch).toHaveBeenCalledTimes(6);
        expect(config.classAdvantages['Guerreiro']).toBeDefined();
    });

    it('deve ser seguro com config null (não lança erro)', async () => {
        await expect(applyCanonToConfig(null)).resolves.toBeUndefined();
    });

    it('deve ser seguro com config undefined (não lança erro)', async () => {
        await expect(applyCanonToConfig(undefined)).resolves.toBeUndefined();
    });

    it('não deve modificar config se o fetch falhar', async () => {
        _resetCanonCache();
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
        const originalAdvantages = { 'Guerreiro': { strong: 'Ladino', weak: 'Curandeiro' } };
        const config = { classAdvantages: { ...originalAdvantages } };
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        await applyCanonToConfig(config);

        // Config não modificada — fallback seguro
        expect(config.classAdvantages['Guerreiro'].weak).toBe('Curandeiro');
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('applyCanonToConfig falhou'), expect.any(Error));
        warn.mockRestore();
    });
});

// ===========================================================================
// Fase 2 — getSpeciesData()
// ===========================================================================

describe('canonLoader — getSpeciesData() (Fase 2)', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar espécie por ID canônico', () => {
        const sp = getSpeciesData('shieldhorn');
        expect(sp).not.toBeNull();
        expect(sp.id).toBe('shieldhorn');
        expect(sp.class_id).toBe('warrior');
        expect(sp.archetype).toBe('tank_puro');
    });

    it('deve retornar espécie por nome PT-BR', () => {
        const sp = getSpeciesData('Escudicorno');
        expect(sp).not.toBeNull();
        expect(sp.id).toBe('shieldhorn');
    });

    it('deve retornar espécie Presabrasa por ID', () => {
        const sp = getSpeciesData('emberfang');
        expect(sp).not.toBeNull();
        expect(sp.name_pt).toBe('Presabrasa');
        expect(sp.rarity).toBe('incomum');
    });

    it('deve retornar null para ID inexistente', () => {
        expect(getSpeciesData('especie_desconhecida')).toBeNull();
    });

    it('deve retornar null antes de loadCanonData()', () => {
        _resetCanonCache();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(getSpeciesData('shieldhorn')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('getSpeciesData'));
        warn.mockRestore();
    });
});

// ===========================================================================
// Fase 2 — getSpeciesStatOffsets()
// ===========================================================================

describe('canonLoader — getSpeciesStatOffsets() (Fase 2)', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar offsets de shieldhorn (hp+1, atk-1, def+1)', () => {
        const offsets = getSpeciesStatOffsets('shieldhorn');
        expect(offsets).toEqual({ hp: 1, atk: -1, def: 1, ene: 0, agi: 0 });
    });

    it('deve retornar offsets de emberfang (atk+1, def-1, agi+1)', () => {
        const offsets = getSpeciesStatOffsets('emberfang');
        expect(offsets).toEqual({ hp: 0, atk: 1, def: -1, ene: 0, agi: 1 });
    });

    it('deve aceitar nome PT-BR', () => {
        const offsets = getSpeciesStatOffsets('Escudicorno');
        expect(offsets).not.toBeNull();
        expect(offsets.def).toBe(1);
    });

    it('deve retornar null para espécie inexistente', () => {
        expect(getSpeciesStatOffsets('fantasma')).toBeNull();
    });
});

// ===========================================================================
// Fase 2 — getEvolutionLine()
// ===========================================================================

describe('canonLoader — getEvolutionLine() (Fase 2)', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar linha por line_id', () => {
        const line = getEvolutionLine('shieldhorn_line');
        expect(line).not.toBeNull();
        expect(line.line_id).toBe('shieldhorn_line');
        expect(line.stages).toHaveLength(3);
    });

    it('deve retornar linha por species_id do estágio 1', () => {
        const line = getEvolutionLine('shieldhorn');
        expect(line).not.toBeNull();
        expect(line.line_id).toBe('shieldhorn_line');
    });

    it('deve retornar linha de emberfang por species_id', () => {
        const line = getEvolutionLine('emberfang');
        expect(line).not.toBeNull();
        expect(line.line_id).toBe('emberfang_line');
    });

    it('deve retornar linha por class_id', () => {
        const line = getEvolutionLine('warrior');
        expect(line).not.toBeNull();
        expect(line.line_id).toBe('shieldhorn_line');
    });

    it('deve retornar null para linha inexistente', () => {
        expect(getEvolutionLine('especie_sem_linha')).toBeNull();
    });

    it('deve retornar o estágio correto de nível de evolução', () => {
        const line = getEvolutionLine('shieldhorn_line');
        expect(line.stages[0].level_at).toBe(1);
        expect(line.stages[1].level_at).toBe(12);
        expect(line.stages[2].level_at).toBe(25);
    });

    it('deve retornar null antes de loadCanonData()', () => {
        _resetCanonCache();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(getEvolutionLine('shieldhorn_line')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('getEvolutionLine'));
        warn.mockRestore();
    });
});

// ===========================================================================
// Fase 2 — getLevelMilestones() e getAllLevelMilestones()
// ===========================================================================

describe('canonLoader — getLevelMilestones() (Fase 2)', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar slot_1 no nível 1', () => {
        expect(getLevelMilestones(1)).toEqual(['slot_1']);
    });

    it('deve retornar slot_2 no nível 5', () => {
        expect(getLevelMilestones(5)).toEqual(['slot_2']);
    });

    it('deve retornar slot_3 no nível 15', () => {
        expect(getLevelMilestones(15)).toEqual(['slot_3']);
    });

    it('deve retornar slot_4 no nível 30', () => {
        expect(getLevelMilestones(30)).toEqual(['slot_4']);
    });

    it('deve retornar array vazio para nível sem milestone', () => {
        expect(getLevelMilestones(7)).toEqual([]);
    });

    it('deve retornar array vazio para nível acima de 30 (Fase 2 cobre apenas 1-30)', () => {
        expect(getLevelMilestones(50)).toEqual([]);
        expect(getLevelMilestones(100)).toEqual([]);
    });

    it('getAllLevelMilestones deve retornar todos os marcos indexados por nível', () => {
        const all = getAllLevelMilestones();
        expect(all[1]).toEqual(['slot_1']);
        expect(all[5]).toEqual(['slot_2']);
        expect(all[30]).toEqual(['slot_4']);
        // Nível sem marco não aparece na tabela
        expect(all[7]).toBeUndefined();
    });

    it('deve retornar array vazio antes de loadCanonData()', () => {
        _resetCanonCache();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(getLevelMilestones(1)).toEqual([]);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('getLevelMilestones'));
        warn.mockRestore();
    });
});

// ===========================================================================
// Fase 2 — getClassGrowthRule()
// ===========================================================================

describe('canonLoader — getClassGrowthRule() (Fase 2)', () => {

    beforeEach(async () => {
        _resetCanonCache();
        global.fetch = makeFetchMock(MOCK_CLASSES, MOCK_MATCHUPS, MOCK_SKILLS_MVP, MOCK_SPECIES, MOCK_EVOLUTION_LINES, MOCK_LEVEL_PROGRESSION);
        await loadCanonData();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete global.fetch;
    });

    it('deve retornar regra de crescimento por ID canônico', () => {
        const rule = getClassGrowthRule('warrior');
        expect(rule).toContain('HP/DEF');
    });

    it('deve retornar regra de crescimento por nome PT-BR', () => {
        const rule = getClassGrowthRule('Guerreiro');
        expect(rule).toContain('HP/DEF');
    });

    it('deve retornar regra de Bárbaro', () => {
        const rule = getClassGrowthRule('barbarian');
        expect(rule).toContain('ATK');
    });

    it('deve retornar null para classe sem regra definida na Fase 2', () => {
        // Bardo, Ladino, Caçador, Animalista não têm regra nos dados de mock
        expect(getClassGrowthRule('bard')).toBeNull();
    });

    it('deve retornar null antes de loadCanonData()', () => {
        _resetCanonCache();
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(getClassGrowthRule('warrior')).toBeNull();
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('getClassGrowthRule'));
        warn.mockRestore();
    });
});
