/**
 * ENCOUNTER TEMPLATES — Testes de integridade dos 40 templates (ENC_001–ENC_040)
 *
 * Valida que:
 *  - encounterTemplates.json contém todos os IDs referenciados em worldMap.json
 *  - Cada template tem os campos obrigatórios
 *  - Todos os monster IDs em cada template existem em monsters.json
 *  - Drop table IDs referenciados são válidos (DROP_001–DROP_008)
 *  - Distribuição de tipos por local: wild, group_trainer, boss
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Loaders ─────────────────────────────────────────────────────────────────

function loadEncounterTemplates() {
    const raw = readFileSync(join(process.cwd(), 'data/encounterTemplates.json'), 'utf-8');
    return JSON.parse(raw);
}

function loadWorldMap() {
    const raw = readFileSync(join(process.cwd(), 'data/worldMap.json'), 'utf-8');
    return JSON.parse(raw);
}

function loadMonsters() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const VALID_TYPES     = ['wild', 'group_trainer', 'boss'];
const VALID_DROP_IDS  = new Set(['DROP_001','DROP_002','DROP_003','DROP_004','DROP_005','DROP_006','DROP_007','DROP_008']);
const VALID_LOC_IDS   = new Set(['LOC_001','LOC_002','LOC_003','LOC_004','LOC_005','LOC_006','LOC_007','LOC_008']);

// ─── Fixtures carregados uma vez ──────────────────────────────────────────────

const encData      = loadEncounterTemplates();
const worldMapData = loadWorldMap();
const monstersData = loadMonsters();

const templates     = encData.templates;
const templateById  = new Map(templates.map(t => [t.id, t]));
const validMonIds   = new Set(monstersData.monsters.map(m => m.id));

// IDs de encounter referenciados no worldMap
const worldMapNodes = worldMapData.nodes;
const referencedEncIds = new Set(
    worldMapNodes.flatMap(n => n.encounterPool || [])
);

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('encounterTemplates.json — Estrutura geral', () => {
    it('arquivo deve ter campo "templates" como array', () => {
        expect(Array.isArray(templates)).toBe(true);
    });

    it('deve ter pelo menos 40 templates', () => {
        expect(templates.length).toBeGreaterThanOrEqual(40);
    });

    it('IDs devem ser únicos', () => {
        const ids = templates.map(t => t.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });
});

describe('encounterTemplates.json — Cobertura do worldMap', () => {
    it('todos os IDs referenciados no worldMap devem existir nos templates', () => {
        const missing = [...referencedEncIds].filter(id => !templateById.has(id));
        expect(
            missing,
            `IDs referenciados no worldMap sem template: ${missing.join(', ')}`
        ).toHaveLength(0);
    });

    it('deve cobrir ENC_001 a ENC_040', () => {
        const missing = [];
        for (let i = 1; i <= 40; i++) {
            const id = `ENC_${String(i).padStart(3, '0')}`;
            if (!templateById.has(id)) missing.push(id);
        }
        expect(missing, `Templates faltando: ${missing.join(', ')}`).toHaveLength(0);
    });
});

describe('encounterTemplates.json — Campos obrigatórios por template', () => {
    it.each(templates)('$id deve ter todos os campos obrigatórios', (t) => {
        expect(t.id,          `${t.id}: campo "id" ausente`).toBeTruthy();
        expect(t.locationId,  `${t.id}: campo "locationId" ausente`).toBeTruthy();
        expect(t.type,        `${t.id}: campo "type" ausente`).toBeTruthy();
        expect(t.monsters,    `${t.id}: campo "monsters" ausente`).toBeTruthy();
        expect(t.minLevel,    `${t.id}: campo "minLevel" ausente`).toBeDefined();
        expect(t.maxLevel,    `${t.id}: campo "maxLevel" ausente`).toBeDefined();
        expect(t.rewardXp,    `${t.id}: campo "rewardXp" ausente`).toBeDefined();
        expect(t.rewardGold,  `${t.id}: campo "rewardGold" ausente`).toBeDefined();
        expect(t.dropTableId, `${t.id}: campo "dropTableId" ausente`).toBeTruthy();
    });
});

describe('encounterTemplates.json — Validação de tipos e valores', () => {
    it.each(templates)('$id: tipo deve ser válido', (t) => {
        expect(VALID_TYPES, `${t.id}: tipo inválido "${t.type}"`).toContain(t.type);
    });

    it.each(templates)('$id: locationId deve ser LOC_001–LOC_008', (t) => {
        expect(VALID_LOC_IDS.has(t.locationId), `${t.id}: locationId inválido "${t.locationId}"`).toBe(true);
    });

    it.each(templates)('$id: monsters deve ser array não-vazio', (t) => {
        expect(Array.isArray(t.monsters)).toBe(true);
        expect(t.monsters.length, `${t.id}: monsters vazio`).toBeGreaterThan(0);
    });

    it.each(templates)('$id: minLevel <= maxLevel', (t) => {
        expect(t.minLevel).toBeGreaterThanOrEqual(1);
        expect(t.maxLevel).toBeGreaterThanOrEqual(t.minLevel);
    });

    it.each(templates)('$id: rewardXp e rewardGold devem ser positivos', (t) => {
        expect(t.rewardXp).toBeGreaterThan(0);
        expect(t.rewardGold).toBeGreaterThan(0);
    });

    it.each(templates)('$id: dropTableId deve ser DROP_001–DROP_008', (t) => {
        expect(VALID_DROP_IDS.has(t.dropTableId), `${t.id}: dropTableId inválido "${t.dropTableId}"`).toBe(true);
    });
});

describe('encounterTemplates.json — Referências a monsters.json', () => {
    it('todos os monster IDs em monsters[] devem existir em monsters.json', () => {
        const orphans = [];
        for (const t of templates) {
            for (const monId of t.monsters) {
                if (!validMonIds.has(monId)) {
                    orphans.push(`${monId} em ${t.id}`);
                }
            }
        }
        expect(orphans, `IDs órfãos:\n${orphans.join('\n')}`).toHaveLength(0);
    });
});

describe('encounterTemplates.json — Distribuição por local', () => {
    const MAIN_LOCS = ['LOC_001','LOC_002','LOC_003','LOC_004','LOC_005','LOC_006','LOC_007','LOC_008'];

    for (const locId of MAIN_LOCS) {
        it(`${locId} deve ter ao menos 1 encontro wild`, () => {
            const wilds = templates.filter(t => t.locationId === locId && t.type === 'wild');
            expect(wilds.length, `${locId}: sem encontros wild`).toBeGreaterThanOrEqual(1);
        });

        it(`${locId} deve ter ao menos 1 treinador ou boss`, () => {
            const nonWild = templates.filter(t => t.locationId === locId && t.type !== 'wild');
            expect(nonWild.length, `${locId}: sem treinador/boss`).toBeGreaterThanOrEqual(1);
        });
    }

    it('LOC_002–LOC_008 devem ter ao menos 1 boss cada', () => {
        const missing = [];
        for (const locId of MAIN_LOCS.filter(l => l !== 'LOC_001')) {
            const bosses = templates.filter(t => t.locationId === locId && t.type === 'boss');
            if (bosses.length === 0) missing.push(locId);
        }
        expect(missing, `Locais sem boss: ${missing.join(', ')}`).toHaveLength(0);
    });
});

describe('encounterTemplates.json — Progressão de XP por local', () => {
    const locOrder = ['LOC_001','LOC_002','LOC_003','LOC_004','LOC_005','LOC_006','LOC_007','LOC_008'];

    it('boss de LOC_008 deve ter mais XP que boss de LOC_002', () => {
        const boss008 = templates.find(t => t.locationId === 'LOC_008' && t.type === 'boss');
        const boss002 = templates.find(t => t.locationId === 'LOC_002' && t.type === 'boss');
        expect(boss008).toBeDefined();
        expect(boss002).toBeDefined();
        expect(boss008.rewardXp).toBeGreaterThan(boss002.rewardXp);
    });

    it('wild de LOC_008 deve ter mais XP que wild de LOC_001', () => {
        const wild008 = templates.find(t => t.locationId === 'LOC_008' && t.type === 'wild');
        const wild001 = templates.find(t => t.locationId === 'LOC_001' && t.type === 'wild');
        expect(wild008.rewardXp).toBeGreaterThan(wild001.rewardXp);
    });
});
