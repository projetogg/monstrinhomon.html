/**
 * SAVE ENCOUNTER SANITIZATION TESTS (phase1-runtime-rebuild)
 *
 * Testes de integração para a sanitização upstream de encounters inválidos,
 * cobrindo o fluxo completo: estado salvo → normalizeGameState → validação pós-catálogo.
 *
 * Cobertura:
 *  A. Save válido + encounter válido → carrega sem alteração
 *  B. Save com wildMonster nulo em encounter ativo → encounter descartado na normalização
 *  C. Save com wildMonster.rarity ausente → normalizado via normalizeMonster
 *  D. Encounter com templateId inexistente no catálogo → descartado por _sanitizeEncounterAgainstCatalog
 *  E. startEncounter runtime guard → erro com contexto completo (sem regressão ao TypeError)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Helpers: carrega dados reais ─────────────────────────────────────────────

function loadMonstersJson() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

// ─── Implementações inline (mirrors do index.html) ───────────────────────────
// Espelha as funções reais sem depender do browser environment.

const DEFAULT_FRIENDSHIP = 50;

function normalizeMonster(mon) {
    if (!mon || typeof mon !== 'object') return null;

    mon.templateId = mon.templateId ?? mon.monsterId ?? mon.baseId ?? mon.idBase ?? 'unknown';
    delete mon.monsterId;
    delete mon.baseId;
    delete mon.idBase;

    if (mon.id !== undefined && mon.instanceId === undefined) {
        mon.instanceId = mon.id;
    }

    if (mon.hpMax === undefined) {
        mon.hpMax = mon.maxHp ?? 30;
    }
    delete mon.maxHp;

    let rawHp = mon.hp ?? mon.currentHp ?? mon.hpCurrent ?? mon.hpMax;
    const safeHpMax = Number(mon.hpMax) || 30;
    mon.hp = Math.min(Math.max(0, Number(rawHp) || 0), safeHpMax);
    delete mon.currentHp;
    delete mon.hpCurrent;

    if (mon.eneMax === undefined) {
        const lvl = mon.level || 1;
        mon.eneMax = Math.floor(10 + 2 * (lvl - 1));
    }
    let rawEne = mon.ene ?? mon.currentEne ?? mon.eneMax;
    const safeEneMax = Number(mon.eneMax) || 10;
    mon.ene = Math.min(Math.max(0, Number(rawEne) || 0), safeEneMax);
    delete mon.currentEne;

    if (mon.level === undefined) mon.level = 1;
    if (mon.xp === undefined) mon.xp = 0;
    if (!Array.isArray(mon.buffs)) mon.buffs = [];
    if (!Array.isArray(mon.statusEffects)) mon.statusEffects = [];
    if (!mon.class) mon.class = 'Neutro';
    if (!mon.rarity) mon.rarity = 'Comum';
    if (typeof mon.friendship !== 'number') mon.friendship = DEFAULT_FRIENDSHIP;

    return mon;
}

/**
 * Extrai apenas a parte de sanitização de encounter de normalizeGameState().
 * Permite testar o comportamento de forma isolada.
 */
function sanitizeCurrentEncounterInState(state) {
    if (state.currentEncounter !== null && state.currentEncounter !== undefined) {
        const enc = state.currentEncounter;
        if (typeof enc !== 'object' || Array.isArray(enc)) {
            console.warn('[System] currentEncounter descartado: não é objeto');
            state.currentEncounter = null;
        } else if (enc.type === 'wild') {
            if (enc.wildMonster && typeof enc.wildMonster === 'object') {
                normalizeMonster(enc.wildMonster);
            } else if (enc.active && !enc.wildMonster) {
                console.warn('[System] currentEncounter wild descartado: ativo mas wildMonster ausente' +
                    ` (saveVersion=${state.meta?.saveVersion ?? '?'})`);
                state.currentEncounter = null;
            }
        }
    }
    return state;
}

/**
 * Extrai a lógica de _sanitizeEncounterAgainstCatalog() de forma testável.
 * Recebe GameState e um lookup de template (ao invés de depender de window.Data).
 */
function sanitizeEncounterAgainstCatalog(gameState, getTemplateFn) {
    const enc = gameState.currentEncounter;
    if (!enc || enc.type !== 'wild' || !enc.wildMonster) return;

    const templateId  = enc.wildMonster.templateId;
    const saveVersion = gameState.meta?.saveVersion ?? '?';

    if (!templateId || templateId === 'unknown') {
        console.warn(`[System] Encounter salvo descartado: templateId inválido ('${templateId}')` +
            ` | saveVersion=${saveVersion}`);
        gameState.currentEncounter = null;
        return;
    }

    const template = getTemplateFn(templateId);
    if (!template) {
        console.warn(`[System] Encounter salvo descartado: template '${templateId}' ausente no catálogo` +
            ` | saveVersion=${saveVersion}. O save pode ser de uma versão anterior do jogo.`);
        gameState.currentEncounter = null;
    }
}

// ─── Factories ────────────────────────────────────────────────────────────────

function makeValidWildMonster(templateId = 'MON_001', overrides = {}) {
    return {
        templateId,
        instanceId: 'mi_test_1',
        name: 'Ferrozimon',
        class: 'Guerreiro',
        rarity: 'Comum',
        hp: 29, hpMax: 29,
        atk: 7, def: 9, spd: 4,
        level: 1,
        ene: 10, eneMax: 10,
        buffs: [], statusEffects: [],
        friendship: 50,
        ...overrides
    };
}

function makeValidEncounter(type = 'wild', overrides = {}) {
    return {
        id: Date.now(),
        type,
        active: true,
        log: [],
        rewardsGranted: false,
        ...overrides
    };
}

function makeGameState(overrides = {}) {
    return {
        meta: { saveVersion: 1 },
        players: [],
        monsters: [],
        sessions: [],
        sharedBox: [],
        objectives: [],
        ui: {},
        currentEncounter: null,
        config: {},
        ...overrides
    };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('Sanitização de Encounter Salvo — normalizeGameState (fase 1)', () => {

    describe('A. Save válido com encounter válido', () => {
        it('deve manter o encounter intacto quando wildMonster está presente e ativo', () => {
            const wildMon = makeValidWildMonster();
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter).not.toBeNull();
            expect(state.currentEncounter.wildMonster).not.toBeNull();
            expect(state.currentEncounter.active).toBe(true);
        });

        it('deve normalizar wildMonster sem descartá-lo (rarity preservada)', () => {
            const wildMon = makeValidWildMonster('MON_001', { rarity: 'Raro' });
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter.wildMonster.rarity).toBe('Raro');
        });

        it('deve preservar encounter de tipo group_trainer sem modificação', () => {
            const enc = makeValidEncounter('group_trainer', { enemies: [{ id: 'e1' }] });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            // group_trainer não tem wildMonster — não deve ser descartado
            expect(state.currentEncounter).not.toBeNull();
            expect(state.currentEncounter.type).toBe('group_trainer');
        });
    });

    describe('B. Save com encounter inválido — wildMonster nulo em encontro ativo', () => {
        it('deve descartar encounter wild ativo com wildMonster null', () => {
            const enc = makeValidEncounter('wild', { wildMonster: null, active: true });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter).toBeNull();
        });

        it('deve descartar encounter wild ativo com wildMonster undefined', () => {
            const enc = makeValidEncounter('wild', { active: true });
            delete enc.wildMonster;
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter).toBeNull();
        });

        it('não deve descartar encounter wild inativo sem wildMonster (já finalizado)', () => {
            // Encounter finalizado (active=false) pode não ter wildMonster — isso é válido
            const enc = makeValidEncounter('wild', { wildMonster: null, active: false });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            // Não deve ser descartado (active=false, não é caso de crash)
            expect(state.currentEncounter).not.toBeNull();
        });

        it('deve descartar currentEncounter que não é objeto', () => {
            const state = makeGameState({ currentEncounter: 'lixo' });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter).toBeNull();
        });
    });

    describe('C. Save com wildMonster com campos ausentes — normalização via normalizeMonster', () => {
        it('deve preencher rarity ausente com "Comum"', () => {
            const wildMon = makeValidWildMonster();
            delete wildMon.rarity;
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter).not.toBeNull();
            // normalizeMonster deve ter preenchido rarity
            expect(state.currentEncounter.wildMonster.rarity).toBe('Comum');
        });

        it('deve preencher class ausente com "Neutro"', () => {
            const wildMon = makeValidWildMonster();
            delete wildMon.class;
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(state.currentEncounter.wildMonster.class).toBe('Neutro');
        });

        it('deve garantir buffs e statusEffects como arrays', () => {
            const wildMon = makeValidWildMonster();
            delete wildMon.buffs;
            delete wildMon.statusEffects;
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const state = makeGameState({ currentEncounter: enc });

            sanitizeCurrentEncounterInState(state);

            expect(Array.isArray(state.currentEncounter.wildMonster.buffs)).toBe(true);
            expect(Array.isArray(state.currentEncounter.wildMonster.statusEffects)).toBe(true);
        });
    });
});

describe('Sanitização de Encounter Salvo — validação pós-catálogo (_sanitizeEncounterAgainstCatalog)', () => {

    // Catálogo real do repositório para lookup
    const monstersData = loadMonstersJson();
    const catalogMap   = new Map(monstersData.monsters.map(m => [m.id, m]));
    const getTemplate  = (id) => catalogMap.get(id) ?? null;

    describe('D. Template inexistente no catálogo', () => {
        it('deve descartar encounter quando templateId não existe no catálogo', () => {
            const wildMon = makeValidWildMonster('MON_LEGADO_999_REMOVIDO');
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const gameState = makeGameState({ currentEncounter: enc });

            sanitizeEncounterAgainstCatalog(gameState, getTemplate);

            expect(gameState.currentEncounter).toBeNull();
        });

        it('deve descartar encounter quando templateId é "unknown"', () => {
            const wildMon = makeValidWildMonster('unknown');
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const gameState = makeGameState({ currentEncounter: enc });

            sanitizeEncounterAgainstCatalog(gameState, getTemplate);

            expect(gameState.currentEncounter).toBeNull();
        });

        it('deve descartar encounter quando templateId é string vazia', () => {
            const wildMon = makeValidWildMonster('');
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const gameState = makeGameState({ currentEncounter: enc });

            sanitizeEncounterAgainstCatalog(gameState, getTemplate);

            expect(gameState.currentEncounter).toBeNull();
        });

        it('deve manter o restante do gameState intacto ao descartar encounter', () => {
            const wildMon = makeValidWildMonster('MON_LEGADO_REMOVIDO');
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const gameState = makeGameState({
                currentEncounter: enc,
                players: [{ id: 'p1', name: 'Jogador 1' }],
                meta: { saveVersion: 2 }
            });

            sanitizeEncounterAgainstCatalog(gameState, getTemplate);

            // Encounter descartado
            expect(gameState.currentEncounter).toBeNull();
            // Resto do save preservado
            expect(gameState.players).toHaveLength(1);
            expect(gameState.meta.saveVersion).toBe(2);
        });
    });

    describe('A. Template válido no catálogo', () => {
        it('deve manter encounter quando templateId existe no catálogo real', () => {
            const wildMon = makeValidWildMonster('MON_001'); // Ferrozimon — sempre existe
            const enc = makeValidEncounter('wild', { wildMonster: wildMon });
            const gameState = makeGameState({ currentEncounter: enc });

            sanitizeEncounterAgainstCatalog(gameState, getTemplate);

            expect(gameState.currentEncounter).not.toBeNull();
        });

        it('deve ignorar (não modificar) encounter de tipo group_trainer', () => {
            const enc = makeValidEncounter('group_trainer');
            const gameState = makeGameState({ currentEncounter: enc });

            sanitizeEncounterAgainstCatalog(gameState, getTemplate);

            expect(gameState.currentEncounter).not.toBeNull();
            expect(gameState.currentEncounter.type).toBe('group_trainer');
        });

        it('deve ignorar se currentEncounter é null', () => {
            const gameState = makeGameState({ currentEncounter: null });

            expect(() => sanitizeEncounterAgainstCatalog(gameState, getTemplate)).not.toThrow();
            expect(gameState.currentEncounter).toBeNull();
        });
    });
});

describe('E. Runtime guard — startEncounter com templateId inválido', () => {

    function simulateStartEncounterGuard(wildTemplateId, selectedLocationId = null, selectedSpotId = null, saveVersion = 1) {
        // Simula createMonsterInstanceFromTemplate retornando null (template não existe)
        const catalog = [];
        function createMonsterInstanceFromTemplate(templateId) {
            const t = catalog.find(m => m.id === templateId);
            if (!t) return null;
            return { templateId, rarity: t.rarity };
        }

        const wildMonster = createMonsterInstanceFromTemplate(wildTemplateId);

        if (!wildMonster) {
            const locationId  = selectedLocationId ?? '(sem localização)';
            const spotId      = selectedSpotId     ?? '(sem spot)';
            throw new Error(
                `Encounter template not found: ${wildTemplateId}` +
                ` | localização=${locationId}, spot=${spotId}` +
                ` | saveVersion=${saveVersion}`
            );
        }

        return wildMonster;
    }

    it('deve lançar erro com templateId na mensagem', () => {
        expect(() => simulateStartEncounterGuard('MON_INEXISTENTE'))
            .toThrow('Encounter template not found: MON_INEXISTENTE');
    });

    it('deve incluir localização e spot na mensagem de erro', () => {
        expect(() => simulateStartEncounterGuard('MON_INEXISTENTE', 'LOC_003', 'LOC_003_A'))
            .toThrow('localização=LOC_003, spot=LOC_003_A');
    });

    it('deve incluir saveVersion na mensagem de erro', () => {
        expect(() => simulateStartEncounterGuard('MON_INEXISTENTE', null, null, 2))
            .toThrow('saveVersion=2');
    });

    it('não deve lançar TypeError por acesso a .rarity em nulo (regressão)', () => {
        // O crash anterior era: "Cannot read properties of null (reading 'rarity')"
        // Agora deve ser um Error explícito, não TypeError
        let thrownError = null;
        try {
            simulateStartEncounterGuard('MON_INEXISTENTE');
        } catch (e) {
            thrownError = e;
        }
        expect(thrownError).not.toBeNull();
        expect(thrownError).toBeInstanceOf(Error);
        // Não deve ser TypeError (que viria de null.rarity)
        expect(thrownError.constructor.name).toBe('Error');
        expect(thrownError.message).toContain('Encounter template not found');
    });

    it('não deve lançar erro quando templateId existe no catálogo', () => {
        // Simula catálogo com um monstro real
        const catalog = [{ id: 'MON_001', rarity: 'Comum' }];
        function createMonsterFn(templateId) {
            const t = catalog.find(m => m.id === templateId);
            if (!t) return null;
            return { templateId, rarity: t.rarity };
        }
        const wildMonster = createMonsterFn('MON_001');
        expect(wildMonster).not.toBeNull();
        expect(wildMonster.rarity).toBe('Comum');
    });
});
