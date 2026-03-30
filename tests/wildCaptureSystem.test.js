/**
 * WILD CAPTURE SYSTEM TESTS
 *
 * Testa o sistema de captura selvagem de duas trilhas:
 * - Trilha Física   (HP): reduzir HP → score alto → captura
 * - Trilha Comportamental (Agressividade): reduzir Agressividade → score alto → captura
 *
 * Cobertura:
 * - calculateCaptureScore (HP + Agressividade)
 * - getCaptureReadinessLabel
 * - applyCaptureAction
 * - CAPTURE_ACTIONS (por classe)
 * - Resolução comportamental (aggression ≤ 0)
 * - Resolução física (HP baixo)
 * - HP = 0 impede captura
 * - Suporte consegue captura sem dano alto
 * - Classes ofensivas resolvem pela trilha física
 * - Trainer/boss NÃO usa lógica selvagem
 */

import { describe, it, expect } from 'vitest';
import {
    calculateCaptureScore,
    getCaptureReadinessLabel,
    applyCaptureAction,
    CAPTURE_ACTIONS,
} from '../js/combat/wildCore.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Cria um selvagem padrão (HP cheio, totalmente agressivo) */
function makeMon(overrides = {}) {
    return {
        hp: 100, hpMax: 100,
        aggression: 100,
        ...overrides,
    };
}

// ── calculateCaptureScore ──────────────────────────────────────────────────

describe('calculateCaptureScore — fórmula 50/50 (HP + Agressividade)', () => {

    it('selvagem intacto (HP cheio, agressividade máxima) → score 0', () => {
        const score = calculateCaptureScore(makeMon());
        expect(score).toBe(0);
    });

    it('HP = 0 e agressividade máxima → score 50 (somente trilha física no máximo)', () => {
        const score = calculateCaptureScore(makeMon({ hp: 0 }));
        expect(score).toBe(50);
    });

    it('agressividade = 0 e HP cheio → score 50 (somente trilha comportamental no máximo)', () => {
        const score = calculateCaptureScore(makeMon({ aggression: 0 }));
        expect(score).toBe(50);
    });

    it('HP = 0 e agressividade = 0 → score 100 (ambas trilhas no máximo)', () => {
        const score = calculateCaptureScore(makeMon({ hp: 0, aggression: 0 }));
        expect(score).toBe(100);
    });

    it('HP na metade, agressividade na metade → score ~50', () => {
        const score = calculateCaptureScore(makeMon({ hp: 50, aggression: 50 }));
        // hpScore = 0.5 * 50 = 25; aggrScore = 0.5 * 50 = 25 → 50
        expect(score).toBe(50);
    });

    it('orb comum (+0pts) não altera score', () => {
        const base = calculateCaptureScore(makeMon({ hp: 50 }));
        const withOrb = calculateCaptureScore(makeMon({ hp: 50 }), 0);
        expect(base).toBe(withOrb);
    });

    it('orb incomum (+10pts) aumenta score em 10', () => {
        const base = calculateCaptureScore(makeMon({ hp: 50 }), 0);
        const withOrb = calculateCaptureScore(makeMon({ hp: 50 }), 10);
        expect(withOrb).toBe(base + 10);
    });

    it('orb rara (+20pts) aumenta score em 20', () => {
        const base = calculateCaptureScore(makeMon({ hp: 50 }), 0);
        const withOrb = calculateCaptureScore(makeMon({ hp: 50 }), 20);
        expect(withOrb).toBe(base + 20);
    });

    it('score não ultrapassa 100', () => {
        const score = calculateCaptureScore(makeMon({ hp: 0, aggression: 0 }), 20);
        expect(score).toBe(100);
    });

    it('HP negativo tratado como 0 (sem score negativo)', () => {
        const score = calculateCaptureScore(makeMon({ hp: -10 }));
        expect(score).toBeGreaterThanOrEqual(0);
    });

    it('monster null/undefined → retorna 0', () => {
        expect(calculateCaptureScore(null)).toBe(0);
        expect(calculateCaptureScore(undefined)).toBe(0);
    });

    it('aggression ausente → assume 100 (totalmente agressivo)', () => {
        const mon = { hp: 100, hpMax: 100 };
        const score = calculateCaptureScore(mon);
        expect(score).toBe(0); // HP cheio + agressividade máxima implícita
    });

    it('HP 20% restante → hpScore = 40 pts', () => {
        const mon = makeMon({ hp: 20, aggression: 100 });
        // hpScore = (1 - 20/100)*50 = 0.8*50 = 40
        expect(calculateCaptureScore(mon)).toBe(40);
    });

    it('agressividade 25 → aggrScore = 37 ou 38 pts (arredondado)', () => {
        const mon = makeMon({ hp: 100, aggression: 25 });
        // aggrScore = (1 - 25/100)*50 = 0.75*50 = 37.5 → 38 (round)
        expect(calculateCaptureScore(mon)).toBe(38);
    });
});

// ── getCaptureReadinessLabel ───────────────────────────────────────────────

describe('getCaptureReadinessLabel — rótulos de prontidão', () => {

    it('score 0 → "Muito arisco" 🔴', () => {
        const label = getCaptureReadinessLabel(0);
        expect(label.text).toBe('Muito arisco');
        expect(label.emoji).toBe('🔴');
    });

    it('score 24 → ainda "Muito arisco"', () => {
        expect(getCaptureReadinessLabel(24).text).toBe('Muito arisco');
    });

    it('score 25 → "Instável" 🟡', () => {
        expect(getCaptureReadinessLabel(25).text).toBe('Instável');
        expect(getCaptureReadinessLabel(25).emoji).toBe('🟡');
    });

    it('score 44 → ainda "Instável"', () => {
        expect(getCaptureReadinessLabel(44).text).toBe('Instável');
    });

    it('score 45 → "Vulnerável" 🟢', () => {
        expect(getCaptureReadinessLabel(45).text).toBe('Vulnerável');
    });

    it('score 65 → "Pronto para captura" 🔵', () => {
        expect(getCaptureReadinessLabel(65).text).toBe('Pronto para captura');
    });

    it('score 80 → "Captura quase certa" ✅', () => {
        expect(getCaptureReadinessLabel(80).text).toBe('Captura quase certa');
    });

    it('score 100 → "Captura quase certa"', () => {
        expect(getCaptureReadinessLabel(100).text).toBe('Captura quase certa');
    });
});

// ── CAPTURE_ACTIONS ────────────────────────────────────────────────────────

describe('CAPTURE_ACTIONS — ações de captura por classe', () => {

    const classes = ['Curandeiro', 'Bardo', 'Animalista', 'Ladino', 'Mago', 'Guerreiro', 'Caçador', 'Bárbaro'];

    it('todas as 8 classes têm ação definida', () => {
        for (const cls of classes) {
            expect(CAPTURE_ACTIONS[cls], `Classe ${cls} deve ter ação`).toBeTruthy();
        }
    });

    it('todas as ações têm id, name, emoji e aggDelta', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(action.id, `${cls}.id`).toBeTruthy();
            expect(action.name, `${cls}.name`).toBeTruthy();
            expect(action.emoji, `${cls}.emoji`).toBeTruthy();
            expect(typeof action.aggDelta, `${cls}.aggDelta`).toBe('number');
        }
    });

    it('todas as ações têm aggDelta negativo (sempre reduzem agressividade)', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(action.aggDelta, `${cls}.aggDelta deve ser negativo`).toBeLessThan(0);
        }
    });

    it('classes de suporte (Curandeiro, Bardo, Animalista) têm aggDelta mais alto que Bárbaro', () => {
        const supportMin = Math.min(
            Math.abs(CAPTURE_ACTIONS.Curandeiro.aggDelta),
            Math.abs(CAPTURE_ACTIONS.Bardo.aggDelta),
            Math.abs(CAPTURE_ACTIONS.Animalista.aggDelta)
        );
        const barbaroAbs = Math.abs(CAPTURE_ACTIONS.Bárbaro.aggDelta);
        expect(supportMin).toBeGreaterThan(barbaroAbs);
    });

    it('Curandeiro consegue zerar agressividade em ≤ 3 ações', () => {
        let aggression = 100;
        const action = CAPTURE_ACTIONS.Curandeiro;
        let turns = 0;
        while (aggression > 0 && turns < 20) {
            aggression = Math.max(0, aggression + action.aggDelta);
            turns++;
        }
        expect(turns).toBeLessThanOrEqual(3);
        expect(aggression).toBe(0);
    });

    it('Bardo consegue zerar agressividade em ≤ 4 ações', () => {
        let aggression = 100;
        const action = CAPTURE_ACTIONS.Bardo;
        let turns = 0;
        while (aggression > 0 && turns < 20) {
            aggression = Math.max(0, aggression + action.aggDelta);
            turns++;
        }
        expect(turns).toBeLessThanOrEqual(4);
    });
});

// ── applyCaptureAction ─────────────────────────────────────────────────────

describe('applyCaptureAction — aplicar ação ao selvagem', () => {

    it('reduz agressividade corretamente', () => {
        const mon = makeMon({ aggression: 80 });
        applyCaptureAction(mon, CAPTURE_ACTIONS.Curandeiro); // aggDelta = -40
        expect(mon.aggression).toBe(40);
    });

    it('agressividade não vai abaixo de 0', () => {
        const mon = makeMon({ aggression: 10 });
        applyCaptureAction(mon, CAPTURE_ACTIONS.Curandeiro); // aggDelta = -40
        expect(mon.aggression).toBe(0);
    });

    it('agressividade não ultrapassa 100 (ações com delta positivo hipotético)', () => {
        const mon = makeMon({ aggression: 95 });
        applyCaptureAction(mon, { aggDelta: 20, openDelta: 0 });
        expect(mon.aggression).toBe(100);
    });

    it('ação null não lança exceção', () => {
        const mon = makeMon();
        expect(() => applyCaptureAction(mon, null)).not.toThrow();
    });

    it('monster null não lança exceção', () => {
        expect(() => applyCaptureAction(null, CAPTURE_ACTIONS.Curandeiro)).not.toThrow();
    });
});

// ── Trilha Física: Curandeiro sem dano ────────────────────────────────────

describe('Trilha Comportamental — suporte resolve sem dano alto', () => {

    it('Curandeiro zera agressividade em 3 ações (HP cheio) → score 50, viável para Comum (need=35)', () => {
        const mon = makeMon({ hp: 100, hpMax: 100, aggression: 100 });
        const action = CAPTURE_ACTIONS.Curandeiro;
        // Aplicar 3 ações
        applyCaptureAction(mon, action); // -40 → 60
        applyCaptureAction(mon, action); // -40 → 20
        applyCaptureAction(mon, action); // -40 → 0 (clamp)
        expect(mon.aggression).toBe(0);
        const score = calculateCaptureScore(mon);
        expect(score).toBe(50); // aggrScore = 50, hpScore = 0
        // Comum threshold = 35 → sucesso
        expect(score).toBeGreaterThanOrEqual(35);
    });

    it('Curandeiro + orb comum (HP cheio, aggr=0): score 50 ≥ 35 (Comum)', () => {
        const mon = makeMon({ hp: 100, hpMax: 100, aggression: 0 });
        const score = calculateCaptureScore(mon, 0);
        expect(score).toBe(50);
        expect(score).toBeGreaterThanOrEqual(35);
    });

    it('Curandeiro + orb incomum (HP cheio, aggr=0): score 60 ≥ 45 (Incomum)', () => {
        const mon = makeMon({ hp: 100, hpMax: 100, aggression: 0 });
        const score = calculateCaptureScore(mon, 10);
        expect(score).toBe(60);
        expect(score).toBeGreaterThanOrEqual(45);
    });

    it('Animalista zera agressividade em ≤ 4 ações (HP cheio) → captura Comum possível', () => {
        const mon = makeMon({ hp: 100, hpMax: 100, aggression: 100 });
        const action = CAPTURE_ACTIONS.Animalista;
        let turns = 0;
        while (mon.aggression > 0 && turns < 10) {
            applyCaptureAction(mon, action);
            turns++;
        }
        expect(mon.aggression).toBe(0);
        expect(turns).toBeLessThanOrEqual(4);
        expect(calculateCaptureScore(mon)).toBeGreaterThanOrEqual(35);
    });
});

// ── Trilha Física: classes ofensivas ──────────────────────────────────────

describe('Trilha Física — classes ofensivas resolvem por HP', () => {

    it('HP 10% restante, agressividade 100 → score 45 (≥ Comum=35, quase Incomum=45)', () => {
        const mon = makeMon({ hp: 10, hpMax: 100, aggression: 100 });
        // hpScore = 0.9*50 = 45; aggrScore = 0
        const score = calculateCaptureScore(mon);
        expect(score).toBe(45);
    });

    it('HP 10% + orb incomum (+10) → score 55 ≥ Incomum (45)', () => {
        const mon = makeMon({ hp: 10, hpMax: 100, aggression: 100 });
        expect(calculateCaptureScore(mon, 10)).toBe(55);
        expect(calculateCaptureScore(mon, 10)).toBeGreaterThanOrEqual(45);
    });

    it('HP 20% + orb rara → score suficiente para Raro (58)', () => {
        const mon = makeMon({ hp: 20, hpMax: 100, aggression: 100 });
        // hpScore = 0.8*50 = 40; + 20 orb = 60 ≥ 58
        const score = calculateCaptureScore(mon, 20);
        expect(score).toBeGreaterThanOrEqual(58);
    });
});

// ── HP = 0 impede captura ─────────────────────────────────────────────────

describe('HP = 0 impede captura', () => {

    it('monster com HP=0 tem score de HP máximo (50) mas não pode ser capturado (validação de runtime)', () => {
        // A validação HP>0 é feita em attemptCapture() no index.html (não nesta função pura).
        // Este teste documenta que calculateCaptureScore ainda computa um score para hp=0,
        // mas a função attemptCapture deve bloquear antes de chegar aqui.
        const mon = makeMon({ hp: 0, aggression: 100 });
        const score = calculateCaptureScore(mon);
        expect(score).toBe(50); // computacionalmente válido
        // A proteção é feita no índice: if (monster.hp <= 0) → alert + return
    });
});

// ── Trainer/Boss NÃO usa lógica selvagem ─────────────────────────────────

describe('Diferenciação de modos de encontro', () => {

    it('calculateCaptureScore não modifica monster (função pura)', () => {
        const mon = makeMon({ hp: 50, aggression: 60 });
        const before = { hp: mon.hp, aggression: mon.aggression };
        calculateCaptureScore(mon, 10);
        expect(mon.hp).toBe(before.hp);
        expect(mon.aggression).toBe(before.aggression);
    });

    it('CAPTURE_ACTIONS não contém classe Trainer ou Boss', () => {
        expect(CAPTURE_ACTIONS['Trainer']).toBeUndefined();
        expect(CAPTURE_ACTIONS['Boss']).toBeUndefined();
    });

    it('getCaptureReadinessLabel é idempotente (mesma entrada → mesmo resultado)', () => {
        const a = getCaptureReadinessLabel(50);
        const b = getCaptureReadinessLabel(50);
        expect(a.text).toBe(b.text);
        expect(a.emoji).toBe(b.emoji);
    });
});

// ── Regressão de runtime ──────────────────────────────────────────────────

describe('Regressão de runtime — funções não devem ser undefined', () => {

    it('calculateCaptureScore está definida e é função', () => {
        expect(typeof calculateCaptureScore).toBe('function');
    });

    it('getCaptureReadinessLabel está definida e é função', () => {
        expect(typeof getCaptureReadinessLabel).toBe('function');
    });

    it('applyCaptureAction está definida e é função', () => {
        expect(typeof applyCaptureAction).toBe('function');
    });

    it('CAPTURE_ACTIONS está definido e é objeto', () => {
        expect(typeof CAPTURE_ACTIONS).toBe('object');
        expect(CAPTURE_ACTIONS).not.toBeNull();
    });

    it('todas as 8 classes têm ação válida (sem undefined inesperado)', () => {
        const expected = ['Curandeiro', 'Bardo', 'Animalista', 'Ladino', 'Mago', 'Guerreiro', 'Caçador', 'Bárbaro'];
        for (const cls of expected) {
            expect(CAPTURE_ACTIONS[cls]).toBeDefined();
        }
    });
});
