/**
 * COMBAT UX POLISH TESTS (Polimento Final do Combate)
 *
 * Protege os ajustes de polimento UX:
 *  - Integridade dos dados de cura (items.json — IT_HEAL_*)
 *  - Bônus de orbe consistentes com valores reais de captura (CLASTERORB_*)
 *  - Fórmula de cura correta para cada item
 *  - Ordem de prioridade dos itens de cura (mais fraco → mais forte)
 */

import { describe, it, expect } from 'vitest';
import { loadItemsJson } from './helpers.js';

const itemsData = loadItemsJson();

/** Mapa id → item */
const byId = new Map(itemsData.items.map(i => [i.id, i]));

// ── Itens de Cura — Integridade de Dados ──────────────────────────────────

describe('Itens de Cura — Integridade de Dados', () => {

    const HEAL_IDS = ['IT_HEAL_01', 'IT_HEAL_02', 'IT_HEAL_03'];

    it('todos os IT_HEAL_* devem existir em items.json', () => {
        for (const id of HEAL_IDS) {
            expect(byId.has(id), `${id} deve existir em items.json`).toBe(true);
        }
    });

    it('todos os IT_HEAL_* devem ter type = "heal"', () => {
        for (const id of HEAL_IDS) {
            const item = byId.get(id);
            if (!item) continue;
            expect(item.type, `${id}.type deve ser "heal"`).toBe('heal');
        }
    });

    it('todos os IT_HEAL_* devem ter heal_pct entre 0 e 1', () => {
        for (const id of HEAL_IDS) {
            const item = byId.get(id);
            if (!item) continue;
            expect(item.heal_pct, `${id}.heal_pct deve ser > 0`).toBeGreaterThan(0);
            expect(item.heal_pct, `${id}.heal_pct deve ser <= 1`).toBeLessThanOrEqual(1);
        }
    });

    it('todos os IT_HEAL_* devem ter heal_min >= 1', () => {
        for (const id of HEAL_IDS) {
            const item = byId.get(id);
            if (!item) continue;
            expect(item.heal_min, `${id}.heal_min deve ser >= 1`).toBeGreaterThanOrEqual(1);
        }
    });

    it('todos os IT_HEAL_* devem ter emoji definido', () => {
        for (const id of HEAL_IDS) {
            const item = byId.get(id);
            if (!item) continue;
            expect(item.emoji, `${id}.emoji deve estar definido`).toBeTruthy();
        }
    });

    it('todos os IT_HEAL_* devem ter name definido', () => {
        for (const id of HEAL_IDS) {
            const item = byId.get(id);
            if (!item) continue;
            expect(item.name, `${id}.name deve estar definido`).toBeTruthy();
        }
    });
});

// ── Itens de Cura — Fórmulas e Progressão ─────────────────────────────────

describe('Itens de Cura — Fórmulas e Progressão', () => {

    it('IT_HEAL_01 deve ter heal_pct = 0.30 (30%)', () => {
        const item = byId.get('IT_HEAL_01');
        expect(item?.heal_pct).toBe(0.30);
    });

    it('IT_HEAL_02 deve ter heal_pct = 0.55 (55%)', () => {
        const item = byId.get('IT_HEAL_02');
        expect(item?.heal_pct).toBe(0.55);
    });

    it('IT_HEAL_03 deve ter heal_pct = 1.00 (100%)', () => {
        const item = byId.get('IT_HEAL_03');
        expect(item?.heal_pct).toBe(1.00);
    });

    it('IT_HEAL_01 deve ter heal_min = 30', () => {
        const item = byId.get('IT_HEAL_01');
        expect(item?.heal_min).toBe(30);
    });

    it('IT_HEAL_02 deve ter heal_min = 60', () => {
        const item = byId.get('IT_HEAL_02');
        expect(item?.heal_min).toBe(60);
    });

    it('IT_HEAL_03 deve ter heal_min >= 999 (cura total)', () => {
        const item = byId.get('IT_HEAL_03');
        expect(item?.heal_min, 'IT_HEAL_03.heal_min deve ser >= 999').toBeGreaterThanOrEqual(999);
    });

    it('heal_pct deve crescer: IT_HEAL_01 < IT_HEAL_02 < IT_HEAL_03', () => {
        const h1 = byId.get('IT_HEAL_01')?.heal_pct;
        const h2 = byId.get('IT_HEAL_02')?.heal_pct;
        const h3 = byId.get('IT_HEAL_03')?.heal_pct;
        expect(h1).toBeLessThan(h2);
        expect(h2).toBeLessThan(h3);
    });

    it('heal_min deve crescer: IT_HEAL_01 < IT_HEAL_02 < IT_HEAL_03', () => {
        const m1 = byId.get('IT_HEAL_01')?.heal_min;
        const m2 = byId.get('IT_HEAL_02')?.heal_min;
        const m3 = byId.get('IT_HEAL_03')?.heal_min;
        expect(m1).toBeLessThan(m2);
        expect(m2).toBeLessThan(m3);
    });

    it('preço de compra deve crescer: IT_HEAL_01 < IT_HEAL_02 < IT_HEAL_03', () => {
        const p1 = byId.get('IT_HEAL_01')?.price?.buy;
        const p2 = byId.get('IT_HEAL_02')?.price?.buy;
        const p3 = byId.get('IT_HEAL_03')?.price?.buy;
        expect(p1).toBeLessThan(p2);
        expect(p2).toBeLessThan(p3);
    });

    it('fórmula de cura deve usar max(heal_min, floor(hpMax * heal_pct))', () => {
        // Monstrinho com hpMax = 100
        const hpMax = 100;

        const i1 = byId.get('IT_HEAL_01');
        const i2 = byId.get('IT_HEAL_02');
        const i3 = byId.get('IT_HEAL_03');

        // IT_HEAL_01: max(30, floor(100 * 0.30)) = max(30, 30) = 30
        const h1 = Math.max(i1.heal_min, Math.floor(hpMax * i1.heal_pct));
        expect(h1).toBe(30);

        // IT_HEAL_02: max(60, floor(100 * 0.55)) = max(60, 55) = 60
        const h2 = Math.max(i2.heal_min, Math.floor(hpMax * i2.heal_pct));
        expect(h2).toBe(60);

        // IT_HEAL_03: max(999, floor(100 * 1.00)) = 999 → restaura tudo
        const h3 = Math.max(i3.heal_min, Math.floor(hpMax * i3.heal_pct));
        expect(h3).toBeGreaterThanOrEqual(hpMax);
    });

    it('IT_HEAL_01 em hpMax = 200: cura 60 (30% > 30 mín)', () => {
        const item = byId.get('IT_HEAL_01');
        const hpMax = 200;
        const heal = Math.max(item.heal_min, Math.floor(hpMax * item.heal_pct));
        // max(30, floor(200 * 0.30)) = max(30, 60) = 60
        expect(heal).toBe(60);
    });
});

// ── Orbes de Captura — Bônus Corretos ─────────────────────────────────────

describe('Orbes de Captura — Bônus Corretos (CLASTERORB)', () => {

    it('CLASTERORB_COMUM deve ter capture_bonus_pp = 0', () => {
        const orb = byId.get('CLASTERORB_COMUM');
        expect(orb?.capture_bonus_pp).toBe(0);
    });

    it('CLASTERORB_INCOMUM deve ter capture_bonus_pp = 10 (+10% real)', () => {
        const orb = byId.get('CLASTERORB_INCOMUM');
        expect(orb?.capture_bonus_pp).toBe(10);
    });

    it('CLASTERORB_RARA deve ter capture_bonus_pp = 20 (+20% real)', () => {
        const orb = byId.get('CLASTERORB_RARA');
        expect(orb?.capture_bonus_pp).toBe(20);
    });

    it('bônus de orbe em decimal (pp/100): COMUM=0, INCOMUM=0.10, RARA=0.20', () => {
        const comum   = byId.get('CLASTERORB_COMUM')?.capture_bonus_pp   ?? -1;
        const incomum = byId.get('CLASTERORB_INCOMUM')?.capture_bonus_pp ?? -1;
        const rara    = byId.get('CLASTERORB_RARA')?.capture_bonus_pp    ?? -1;

        expect(comum / 100).toBe(0);
        expect(incomum / 100).toBeCloseTo(0.10);
        expect(rara / 100).toBeCloseTo(0.20);
    });

    it('bônus deve crescer: COMUM < INCOMUM < RARA', () => {
        const comum   = byId.get('CLASTERORB_COMUM')?.capture_bonus_pp   ?? -1;
        const incomum = byId.get('CLASTERORB_INCOMUM')?.capture_bonus_pp ?? -1;
        const rara    = byId.get('CLASTERORB_RARA')?.capture_bonus_pp    ?? -1;

        expect(comum).toBeLessThan(incomum);
        expect(incomum).toBeLessThan(rara);
    });

    it('preço de compra de orbes deve crescer: COMUM < INCOMUM < RARA', () => {
        const p1 = byId.get('CLASTERORB_COMUM')?.price?.buy;
        const p2 = byId.get('CLASTERORB_INCOMUM')?.price?.buy;
        const p3 = byId.get('CLASTERORB_RARA')?.price?.buy;
        expect(p1).toBeLessThan(p2);
        expect(p2).toBeLessThan(p3);
    });
});
