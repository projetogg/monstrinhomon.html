import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkEvolution, applyEvolution, getEvolutionTarget } from '../js/progression/evolutionSystem.js';

function loadBootstrapCatalog() {
    const raw = readFileSync(resolve(process.cwd(), 'data/monsters.bootstrap.json'), 'utf8');
    const parsed = JSON.parse(raw);
    return (parsed.monsters || []).map(mon => ({
        id: mon.id,
        name: mon.name,
        class: mon.primaryClass || mon.class || mon.classes?.[0] || 'Neutro',
        rarity: mon.rarity,
        baseHp: mon.stats?.hp || 30,
        baseAtk: mon.stats?.atk || 5,
        baseDef: mon.stats?.def || 3,
        baseSpd: mon.stats?.spd || 5,
        baseEne: mon.stats?.ene || 6,
        evolvesTo: mon.evolution?.evolvesTo || null,
        evolvesAt: mon.evolution?.method?.level || null,
    }));
}

describe('Evolution Integration - bootstrap real', () => {
    it('evolui Ferrozimon -> Cavalheiromon -> Kinguespinhomon no nível correto', () => {
        const catalog = loadBootstrapCatalog();

        const ferrozimon = catalog.find(m => m.id === 'ferrozimon');
        expect(ferrozimon).toBeTruthy();

        const mon = {
            id: 'mi_ferro_01',
            name: ferrozimon.name,
            class: ferrozimon.class,
            rarity: ferrozimon.rarity,
            level: 11,
            hp: 58,
            hpMax: 58,
            atk: 14,
            def: 18,
            spd: 8,
            ene: 8,
            eneMax: 8,
            evolvesTo: ferrozimon.evolvesTo,
            evolvesAt: ferrozimon.evolvesAt,
            buffs: [],
        };

        mon.level = 12;
        const evo1 = checkEvolution(mon);
        expect(evo1.canEvolve).toBe(true);
        const target1 = getEvolutionTarget(evo1.targetId, catalog);
        expect(target1?.id).toBe('cavalheiromon');
        applyEvolution(mon, target1);
        expect(mon.name).toBe('Cavalheiromon');
        expect(mon.evolvesTo).toBe('kinguespinhomon');
        expect(mon.evolvesAt).toBe(25);

        mon.level = 25;
        const evo2 = checkEvolution(mon);
        expect(evo2.canEvolve).toBe(true);
        const target2 = getEvolutionTarget(evo2.targetId, catalog);
        expect(target2?.id).toBe('kinguespinhomon');
        applyEvolution(mon, target2);
        expect(mon.name).toBe('Kinguespinhomon');
    });
});

