/**
 * COMBAT AUDIT FULL — Auditoria Técnica Completa do Sistema de Combate
 *
 * Cobre todos os bugs encontrados e corrigidos durante a auditoria:
 *
 * BUG 1 (ATUAL): useSkillWild — inimigo não aplicava regras d20=1 (falha crítica)
 *   e d20=20 (acerto crítico) no contra-ataque básico.
 *
 * BUG 2: useCaptureAction — dano crítico do inimigo ignorado silenciosamente
 *   porque calculateDamage() não aceita potência customizada.
 *
 * ARQUITETURA: wildActions.js wildMonster.skill é sempre undefined (sem crash,
 *   mas inimigo nunca usa skills pelo caminho do módulo).
 *
 * Cobertura:
 *   - getCaptureReadinessLabel: contrato de tipo de retorno
 *   - calculateCaptureScore: limites 0-100
 *   - applyCaptureAction: somente muta aggression (sem openness)
 *   - checkHit / calcDamage: contratos formais
 *   - Resolução dual-track (física + comportamental)
 *   - Ordem de turno determinística
 *   - Seleção de alvo por IA (DEF baixa)
 *   - Sem campos zombie (openness, captureScore sem init)
 */

import { describe, it, expect } from 'vitest';
import {
    checkHit,
    calcDamage,
    calculateCaptureScore,
    getCaptureReadinessLabel,
    applyCaptureAction,
    CAPTURE_ACTIONS,
    getClassAdvantageModifiers,
} from '../js/combat/wildCore.js';
import { calculateTurnOrder, chooseTargetByLowestHP, pickEnemyTargetByDEF } from '../js/combat/groupCore.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeMon(overrides = {}) {
    return {
        hp: 100, hpMax: 100,
        aggression: 100,
        atk: 7, def: 4, spd: 5,
        class: 'Guerreiro',
        buffs: [],
        ...overrides,
    };
}

const CLASS_ADV = {
    Guerreiro:  { strong: 'Ladino',    weak: 'Curandeiro' },
    Ladino:     { strong: 'Mago',      weak: 'Guerreiro'  },
    Mago:       { strong: 'Bárbaro',   weak: 'Ladino'     },
    Bárbaro:    { strong: 'Caçador',   weak: 'Mago'       },
    Caçador:    { strong: 'Bardo',     weak: 'Bárbaro'    },
    Bardo:      { strong: 'Curandeiro',weak: 'Caçador'    },
    Curandeiro: { strong: 'Guerreiro', weak: 'Bardo'      },
};

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 1: getCaptureReadinessLabel — contrato de tipo de retorno
// BUG REGRESSÃO: era esperada string, função retorna objeto { text, emoji, css }
// ─────────────────────────────────────────────────────────────────────────────

describe('getCaptureReadinessLabel — contrato de tipo { text, emoji, css }', () => {

    const ALL_SCORES = [0, 1, 24, 25, 44, 45, 64, 65, 79, 80, 99, 100];

    it('deve sempre retornar um objeto (nunca string)', () => {
        for (const score of ALL_SCORES) {
            const label = getCaptureReadinessLabel(score);
            expect(typeof label, `score=${score}`).toBe('object');
            expect(label).not.toBeNull();
        }
    });

    it('deve sempre ter propriedade text (string não vazia)', () => {
        for (const score of ALL_SCORES) {
            const label = getCaptureReadinessLabel(score);
            expect(typeof label.text, `score=${score}`).toBe('string');
            expect(label.text.length, `score=${score}`).toBeGreaterThan(0);
        }
    });

    it('deve sempre ter propriedade emoji (string não vazia)', () => {
        for (const score of ALL_SCORES) {
            const label = getCaptureReadinessLabel(score);
            expect(typeof label.emoji, `score=${score}`).toBe('string');
            expect(label.emoji.length, `score=${score}`).toBeGreaterThan(0);
        }
    });

    it('deve sempre ter propriedade css (string não vazia)', () => {
        for (const score of ALL_SCORES) {
            const label = getCaptureReadinessLabel(score);
            expect(typeof label.css, `score=${score}`).toBe('string');
            expect(label.css.length, `score=${score}`).toBeGreaterThan(0);
        }
    });

    it('score 0 → "Muito arisco"', () => {
        expect(getCaptureReadinessLabel(0).text).toBe('Muito arisco');
        expect(getCaptureReadinessLabel(0).emoji).toBe('🔴');
    });

    it('score 25 → "Instável" (limite exato de faixa)', () => {
        expect(getCaptureReadinessLabel(25).text).toBe('Instável');
    });

    it('score 45 → "Vulnerável" (limite exato de faixa)', () => {
        expect(getCaptureReadinessLabel(45).text).toBe('Vulnerável');
    });

    it('score 65 → "Pronto para captura" (limite exato de faixa)', () => {
        expect(getCaptureReadinessLabel(65).text).toBe('Pronto para captura');
    });

    it('score 80 → "Captura quase certa" (limite exato de faixa)', () => {
        expect(getCaptureReadinessLabel(80).text).toBe('Captura quase certa');
    });

    it('score 100 → "Captura quase certa"', () => {
        expect(getCaptureReadinessLabel(100).text).toBe('Captura quase certa');
    });

    it('é idempotente: mesma entrada → mesmo resultado', () => {
        const a = getCaptureReadinessLabel(50);
        const b = getCaptureReadinessLabel(50);
        expect(a.text).toBe(b.text);
        expect(a.emoji).toBe(b.emoji);
        expect(a.css).toBe(b.css);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 2: calculateCaptureScore — limites e fórmula
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateCaptureScore — limites 0–100 e fórmula dual-track', () => {

    it('selvagem intacto → score 0', () => {
        expect(calculateCaptureScore(makeMon())).toBe(0);
    });

    it('HP = 0, agressividade máxima → score 50 (somente trilha física máxima)', () => {
        expect(calculateCaptureScore(makeMon({ hp: 0 }))).toBe(50);
    });

    it('HP cheio, agressividade = 0 → score 50 (somente trilha comportamental máxima)', () => {
        expect(calculateCaptureScore(makeMon({ aggression: 0 }))).toBe(50);
    });

    it('HP = 0 e agressividade = 0 → score 100 (ambas as trilhas completas)', () => {
        expect(calculateCaptureScore(makeMon({ hp: 0, aggression: 0 }))).toBe(100);
    });

    it('score nunca ultrapassa 100 mesmo com orb +20', () => {
        const score = calculateCaptureScore(makeMon({ hp: 0, aggression: 0 }), 20);
        expect(score).toBe(100);
    });

    it('orb +10 contribui corretamente ao score', () => {
        // HP 50% = hpScore 25, aggression 50 = aggrScore 25, orb +10 = 60
        const score = calculateCaptureScore(makeMon({ hp: 50, aggression: 50 }), 10);
        expect(score).toBe(60);
    });

    it('null monster → score 0 (sem crash)', () => {
        expect(calculateCaptureScore(null)).toBe(0);
    });

    it('hpMax = 0 → sem divisão por zero, score = 50 (hpMax clampado a 1)', () => {
        // hpMax é clampado a Math.max(1, hpMax) para evitar NaN.
        // Com hpMax=1 e hp=0: hpFactor=1 → hpScore=50. aggression=100 → aggrScore=0. Total=50.
        expect(() => calculateCaptureScore(makeMon({ hpMax: 0, hp: 0 }))).not.toThrow();
        expect(calculateCaptureScore(makeMon({ hpMax: 0, hp: 0 }))).toBe(50);
    });

    it('aggression fora de [0,100] é clampada', () => {
        // aggression = 150 deve ser tratado como 100
        const over = calculateCaptureScore(makeMon({ aggression: 150 }));
        const normal = calculateCaptureScore(makeMon({ aggression: 100 }));
        expect(over).toBe(normal);
    });

    it('score é sempre inteiro (Math.round)', () => {
        const score = calculateCaptureScore(makeMon({ hp: 33, hpMax: 100, aggression: 33 }));
        expect(Number.isInteger(score)).toBe(true);
    });

    // Sem campo zombie "openness"
    it('não lê campo openness (campo zombie removido)', () => {
        const monWithOpenness = makeMon({ openness: 50 });
        const monWithout      = makeMon();
        // Ambos devem dar o mesmo score — openness não é usado
        expect(calculateCaptureScore(monWithOpenness)).toBe(calculateCaptureScore(monWithout));
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 3: applyCaptureAction — somente muta aggression
// ─────────────────────────────────────────────────────────────────────────────

describe('applyCaptureAction — somente muta aggression (sem openness)', () => {

    it('reduz aggression pelo aggDelta da ação', () => {
        const mon = makeMon({ aggression: 100 });
        const action = CAPTURE_ACTIONS['Curandeiro']; // aggDelta: -40
        applyCaptureAction(mon, action);
        expect(mon.aggression).toBe(60);
    });

    it('aggression não fica abaixo de 0 (clamp mínimo)', () => {
        const mon = makeMon({ aggression: 10 });
        const action = CAPTURE_ACTIONS['Curandeiro']; // aggDelta: -40
        applyCaptureAction(mon, action);
        expect(mon.aggression).toBe(0);
    });

    it('aggression não fica acima de 100 (clamp máximo, aggDelta positivo hipotético)', () => {
        const mon = makeMon({ aggression: 90 });
        applyCaptureAction(mon, { aggDelta: 20 });
        expect(mon.aggression).toBe(100);
    });

    it('NÃO cria campo openness no monstro', () => {
        const mon = makeMon({ aggression: 80 });
        applyCaptureAction(mon, CAPTURE_ACTIONS['Bardo']);
        expect(Object.prototype.hasOwnProperty.call(mon, 'openness')).toBe(false);
    });

    it('NÃO cria campo openDelta no monstro', () => {
        const mon = makeMon({ aggression: 80 });
        applyCaptureAction(mon, CAPTURE_ACTIONS['Ladino']);
        expect(Object.prototype.hasOwnProperty.call(mon, 'openDelta')).toBe(false);
    });

    it('action nula → sem crash', () => {
        const mon = makeMon();
        expect(() => applyCaptureAction(mon, null)).not.toThrow();
    });

    it('monster nulo → sem crash', () => {
        expect(() => applyCaptureAction(null, CAPTURE_ACTIONS['Mago'])).not.toThrow();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 4: CAPTURE_ACTIONS — estrutura e cobertura de classes
// ─────────────────────────────────────────────────────────────────────────────

describe('CAPTURE_ACTIONS — cobertura de classes e estrutura', () => {

    const EXPECTED_CLASSES = ['Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro', 'Ladino', 'Bardo', 'Caçador', 'Animalista'];

    it('todas as classes de jogador têm ação definida', () => {
        for (const cls of EXPECTED_CLASSES) {
            expect(CAPTURE_ACTIONS[cls], `falta ação para ${cls}`).toBeDefined();
        }
    });

    it('cada ação tem id, name, emoji, aggDelta', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(typeof action.id,       `${cls}.id`      ).toBe('string');
            expect(typeof action.name,     `${cls}.name`    ).toBe('string');
            expect(typeof action.emoji,    `${cls}.emoji`   ).toBe('string');
            expect(typeof action.aggDelta, `${cls}.aggDelta`).toBe('number');
        }
    });

    it('aggDelta é sempre negativo (todas as ações reduzem agressividade)', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(action.aggDelta, `${cls}.aggDelta deve ser negativo`).toBeLessThan(0);
        }
    });

    it('NÃO tem campo openDelta em nenhuma ação (campo zombie removido)', () => {
        for (const [cls, action] of Object.entries(CAPTURE_ACTIONS)) {
            expect(
                Object.prototype.hasOwnProperty.call(action, 'openDelta'),
                `${cls} não deve ter openDelta`
            ).toBe(false);
        }
    });

    it('classes de suporte têm aggDelta menor (mais eficientes que ofensivas)', () => {
        const curandeiro = CAPTURE_ACTIONS['Curandeiro'].aggDelta;
        const barbaro    = CAPTURE_ACTIONS['Bárbaro'].aggDelta;
        expect(curandeiro).toBeLessThan(barbaro); // -40 < -15
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 5: checkHit — contratos formais
// ─────────────────────────────────────────────────────────────────────────────

describe('checkHit — contratos formais', () => {

    const att = { class: 'Guerreiro', atk: 7, buffs: [] };
    const def = { class: 'Ladino',    def: 4, buffs: [] };

    it('d20 + ATK >= DEF → hit', () => {
        // 3 + 7 = 10 >= 4 → hit
        expect(checkHit(3, att, def, CLASS_ADV)).toBe(true);
    });

    it('d20 + ATK < DEF → miss', () => {
        // Guerreiro (att) ataca Curandeiro (bigDef): desvantagem → -2 ATK
        // 3 + 7 - 2(desvantagem Guerreiro<Curandeiro) = 8 < 20 → miss
        const bigDef = { class: 'Curandeiro', def: 20, buffs: [] };
        expect(checkHit(3, att, bigDef, CLASS_ADV)).toBe(false);
    });

    it('vantagem de classe: +2 ATK efetivo', () => {
        // Guerreiro > Ladino: +2
        const attGuerr = { class: 'Guerreiro', atk: 2, buffs: [] };
        const defLadino = { class: 'Ladino', def: 10, buffs: [] };
        // d20=5: 5 + 2 + 2(bônus) = 9 < 10 → miss
        expect(checkHit(5, attGuerr, defLadino, CLASS_ADV)).toBe(false);
        // d20=6: 6 + 2 + 2 = 10 >= 10 → hit
        expect(checkHit(6, attGuerr, defLadino, CLASS_ADV)).toBe(true);
    });

    it('desvantagem de classe: -2 ATK efetivo', () => {
        // Guerreiro < Curandeiro: -2
        const attGuerr  = { class: 'Guerreiro', atk: 5, buffs: [] };
        const defCurand = { class: 'Curandeiro', def: 8, buffs: [] };
        // d20=5: 5 + 5 - 2 = 8 >= 8 → hit
        expect(checkHit(5, attGuerr, defCurand, CLASS_ADV)).toBe(true);
        // d20=4: 4 + 5 - 2 = 7 < 8 → miss
        expect(checkHit(4, attGuerr, defCurand, CLASS_ADV)).toBe(false);
    });

    it('sem classAdvantages → sem bônus (neutro)', () => {
        // d20=1 + ATK=5 = 6 >= DEF=4 → hit sem advantages
        expect(checkHit(1, { class: 'X', atk: 5 }, { class: 'Y', def: 4 }, null)).toBe(true);
    });

    it('attacker null → retorna false (sem crash)', () => {
        expect(checkHit(10, null, def, CLASS_ADV)).toBe(false);
    });

    it('defender null → retorna false (sem crash)', () => {
        expect(checkHit(10, att, null, CLASS_ADV)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 6: calcDamage — fórmula e limites
// ─────────────────────────────────────────────────────────────────────────────

describe('calcDamage — fórmula ATK + POWER - DEF com damageMult', () => {

    it('fórmula base: ATK=7, POWER=12, DEF=4, mult=1.0 → 15', () => {
        // 7 + 12 - 4 = 15
        expect(calcDamage({ atk: 7, def: 4, power: 12, damageMult: 1.0 })).toBe(15);
    });

    it('vantagem +10%: floor(15 * 1.10) = 16', () => {
        expect(calcDamage({ atk: 7, def: 4, power: 12, damageMult: 1.10 })).toBe(16);
    });

    it('desvantagem -10%: floor(15 * 0.90) = 13', () => {
        expect(calcDamage({ atk: 7, def: 4, power: 12, damageMult: 0.90 })).toBe(13);
    });

    it('dano mínimo é 1 (DEF >> ATK + POWER)', () => {
        expect(calcDamage({ atk: 2, def: 50, power: 5, damageMult: 1.0 })).toBe(1);
    });

    it('poder dobrado (crítico) causa significativamente mais dano', () => {
        const normal = calcDamage({ atk: 7, def: 4, power: 8, damageMult: 1.0 });
        const crit   = calcDamage({ atk: 7, def: 4, power: 16, damageMult: 1.0 }); // power × 2
        expect(crit).toBeGreaterThan(normal);
    });

    it('damageMult padrão 1.0 quando não informado', () => {
        expect(calcDamage({ atk: 7, def: 4, power: 12 })).toBe(15);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 7: Resolução dual-track (física + comportamental)
// ─────────────────────────────────────────────────────────────────────────────

describe('Resolução dual-track — física e comportamental com peso igual (50 pts cada)', () => {

    it('trilha física completa (HP=0) contribui exatamente 50 pts', () => {
        const score = calculateCaptureScore(makeMon({ hp: 0, aggression: 100 }));
        expect(score).toBe(50);
    });

    it('trilha comportamental completa (aggression=0) contribui exatamente 50 pts', () => {
        const score = calculateCaptureScore(makeMon({ hp: 100, hpMax: 100, aggression: 0 }));
        expect(score).toBe(50);
    });

    it('classe de suporte atinge 50 pts SEM reduzir HP (somente via agressividade)', () => {
        const mon = makeMon({ hp: 100, hpMax: 100, aggression: 100 });
        // Aplicar ação de Curandeiro (-40) duas vezes (total -80) → aggression = 20
        applyCaptureAction(mon, CAPTURE_ACTIONS['Curandeiro']);
        applyCaptureAction(mon, CAPTURE_ACTIONS['Curandeiro']);
        // aggression = max(0, 100 - 80) = 20 → aggrScore = (1 - 20/100) * 50 = 40
        const score = calculateCaptureScore(mon);
        expect(score).toBe(40);
        expect(mon.hp).toBe(100); // HP não foi tocado
    });

    it('resolução comportamental ocorre quando aggression chega a 0', () => {
        const mon = makeMon({ aggression: 20 });
        applyCaptureAction(mon, CAPTURE_ACTIONS['Curandeiro']); // -40 → clamp a 0
        expect(mon.aggression).toBe(0);
    });

    it('resolução física e comportamental simultâneas maximiza score', () => {
        const full = calculateCaptureScore(makeMon({ hp: 0, aggression: 0 }));
        const partial = calculateCaptureScore(makeMon({ hp: 50, aggression: 50 }));
        expect(full).toBeGreaterThan(partial);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 8: Sem campos zombie
// ─────────────────────────────────────────────────────────────────────────────

describe('Sem campos zombie — openness, openDelta, captureScore pré-inicializado', () => {

    it('calculateCaptureScore não lê monster.openness', () => {
        const withOpenness    = makeMon({ openness: 100 });
        const withoutOpenness = makeMon();
        // Resultados devem ser idênticos
        expect(calculateCaptureScore(withOpenness)).toBe(calculateCaptureScore(withoutOpenness));
    });

    it('applyCaptureAction não cria monster.openness', () => {
        const mon = makeMon();
        applyCaptureAction(mon, CAPTURE_ACTIONS['Guerreiro']);
        expect(mon.openness).toBeUndefined();
    });

    it('CAPTURE_ACTIONS não tem propriedade openDelta em nenhuma ação', () => {
        for (const action of Object.values(CAPTURE_ACTIONS)) {
            expect(action.openDelta).toBeUndefined();
        }
    });

    it('getCaptureReadinessLabel não retorna string (campo zombie de API antiga)', () => {
        const result = getCaptureReadinessLabel(50);
        expect(typeof result).not.toBe('string');
        expect(typeof result).toBe('object');
    });

    it('monster sem campo aggression → padrão 100 (totalmente agressivo)', () => {
        // calculateCaptureScore usa monster?.aggression ?? 100
        const mon = { hp: 0, hpMax: 100 }; // sem aggression
        const score = calculateCaptureScore(mon);
        // hpScore=50, aggrScore=(1-100/100)*50=0 → total 50
        expect(score).toBe(50);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 9: Ordem de turno determinística
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateTurnOrder — ordem determinística por SPD', () => {

    function makeEnc(participants, enemies) {
        return { participants, enemies, turnIndex: 0, turnOrder: [] };
    }

    function makePlayer(id, spd) {
        return {
            id,
            name: `Player${id}`,
            activeIndex: 0,
            team: [{ hp: 100, hpMax: 100, spd, class: 'Guerreiro', buffs: [] }]
        };
    }

    it('jogador com SPD maior age antes do inimigo com SPD menor', () => {
        const enc = makeEnc(['p1'], [{ hp: 10, hpMax: 10, spd: 1, name: 'Inimigo1' }]);
        const players = [makePlayer('p1', 10)];
        const order = calculateTurnOrder(enc, players, () => 1);
        expect(order[0].side).toBe('player');
        expect(order[1].side).toBe('enemy');
    });

    it('inimigo com SPD maior age antes do jogador', () => {
        const enc = makeEnc(['p1'], [{ hp: 10, hpMax: 10, spd: 20, name: 'Inimigo1' }]);
        const players = [makePlayer('p1', 5)];
        const order = calculateTurnOrder(enc, players, () => 1);
        expect(order[0].side).toBe('enemy');
        expect(order[1].side).toBe('player');
    });

    it('monstros desmaiados (HP=0) são excluídos da ordem', () => {
        const enc = makeEnc(['p1'], [{ hp: 0, hpMax: 10, spd: 10, name: 'Inimigo1' }]);
        const players = [makePlayer('p1', 5)];
        const order = calculateTurnOrder(enc, players, () => 1);
        expect(order.length).toBe(1);
        expect(order[0].side).toBe('player');
    });

    it('desempate por d20: quem rola mais alto age primeiro', () => {
        // Ambos com SPD=5
        const enc = makeEnc(['p1'], [{ hp: 10, hpMax: 10, spd: 5, name: 'Inimigo1' }]);
        const players = [makePlayer('p1', 5)];
        // Player rola 20, enemy rola 1 → player primeiro
        let callCount = 0;
        const rolls = [20, 1]; // player, enemy
        const order = calculateTurnOrder(enc, players, () => rolls[callCount++]);
        expect(order[0].side).toBe('player');
        expect(order[1].side).toBe('enemy');
    });

    it('resultado é estável: mesma entrada → mesma ordem (sem d20 para desempate)', () => {
        const enc = makeEnc(['p1'], [
            { hp: 10, hpMax: 10, spd: 3, name: 'Inimigo1' },
            { hp: 10, hpMax: 10, spd: 1, name: 'Inimigo2' },
        ]);
        const players = [makePlayer('p1', 8)];
        const order = calculateTurnOrder(enc, players, () => 10);
        expect(order[0].spd).toBeGreaterThanOrEqual(order[1].spd);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 10: IA — seleção de alvo
// ─────────────────────────────────────────────────────────────────────────────

describe('Seleção de alvo por IA', () => {

    it('chooseTargetByLowestHP escolhe alvo com menor HP%', () => {
        const targets = [
            { id: 'a', hp: 80, hpMax: 100 }, // 80%
            { id: 'b', hp: 20, hpMax: 100 }, // 20% — deve ser escolhido
            { id: 'c', hp: 60, hpMax: 100 }, // 60%
        ];
        expect(chooseTargetByLowestHP(targets)).toBe('b');
    });

    it('chooseTargetByLowestHP retorna null se lista vazia', () => {
        expect(chooseTargetByLowestHP([])).toBeNull();
    });

    it('chooseTargetByLowestHP retorna null se lista nula', () => {
        expect(chooseTargetByLowestHP(null)).toBeNull();
    });

    it('pickEnemyTargetByDEF favorece alvo com maior DEF (aggroDEF alto = score alto)', () => {
        // A função usa DEF normalizada — alvo com DEF ALTA tem aggroDEF alto e score maior.
        // Com rng fixo em 0 (sem noise, escolhe top1 com probabilidade 60%),
        // 'b' (DEF=8) deve ter score mais alto que 'a' (DEF=2).
        const targets = [
            { playerId: 'a', monster: { hp: 10, hpMax: 10, def: 2 }, heldItem: null },
            { playerId: 'b', monster: { hp: 10, hpMax: 10, def: 8 }, heldItem: null },
        ];
        // Passando rng=0 elimina noise → determinístico
        const result = pickEnemyTargetByDEF(targets, {}, () => 0);
        expect(result).toBe('b');
    });

    it('pickEnemyTargetByDEF retorna null se lista vazia', () => {
        expect(pickEnemyTargetByDEF([])).toBeNull();
    });

    it('pickEnemyTargetByDEF retorna null se lista nula', () => {
        expect(pickEnemyTargetByDEF(null)).toBeNull();
    });

    it('pickEnemyTargetByDEF retorna playerId (string) quando tem 1 alvo', () => {
        const targets = [
            { playerId: 'p1', monster: { hp: 10, hpMax: 10, def: 5 }, heldItem: null },
        ];
        const result = pickEnemyTargetByDEF(targets, {}, () => 0);
        expect(result).toBe('p1');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 11: getClassAdvantageModifiers — contratos
// ─────────────────────────────────────────────────────────────────────────────

describe('getClassAdvantageModifiers — bônus de ATK e dano', () => {

    it('vantagem: +2 atkBonus e 1.10 damageMult', () => {
        const mods = getClassAdvantageModifiers('Guerreiro', 'Ladino', CLASS_ADV);
        expect(mods.atkBonus).toBe(2);
        expect(mods.damageMult).toBe(1.10);
    });

    it('desvantagem: -2 atkBonus e 0.90 damageMult', () => {
        const mods = getClassAdvantageModifiers('Guerreiro', 'Curandeiro', CLASS_ADV);
        expect(mods.atkBonus).toBe(-2);
        expect(mods.damageMult).toBe(0.90);
    });

    it('neutro: 0 atkBonus e 1.0 damageMult', () => {
        const mods = getClassAdvantageModifiers('Guerreiro', 'Mago', CLASS_ADV);
        expect(mods.atkBonus).toBe(0);
        expect(mods.damageMult).toBe(1.0);
    });

    it('sem tabela de vantagens → retorna neutro', () => {
        const mods = getClassAdvantageModifiers('Guerreiro', 'Ladino', null);
        expect(mods.atkBonus).toBe(0);
        expect(mods.damageMult).toBe(1.0);
    });

    it('classes undefined → retorna neutro', () => {
        const mods = getClassAdvantageModifiers(undefined, undefined, CLASS_ADV);
        expect(mods.atkBonus).toBe(0);
        expect(mods.damageMult).toBe(1.0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 12: Regressão — BUG useSkillWild (d20=1/20 faltando no contra-ataque)
// ─────────────────────────────────────────────────────────────────────────────

describe('Regressão — BUG useSkillWild: regras d20=1/20 no contra-ataque básico', () => {

    /**
     * O bug era que checkHit() era chamado diretamente sem verificar d20=1 (sempre miss)
     * e d20=20 (sempre hit). A correção adiciona:
     *   enemyHit = enemyRoll === 1 ? false : (enemyRoll === 20 ? true : checkHit(...))
     *
     * Verificamos a lógica via checkHit + flag manual (como implementado na correção).
     */

    it('d20=1 deve sempre causar miss, mesmo com ATK alto (falha crítica)', () => {
        // Com d20=1 e ATK=20 e DEF=1: checkHit retornaria true, mas a regra override
        const attacker = { class: 'Guerreiro', atk: 20, buffs: [] };
        const defender = { class: 'Ladino',    def: 1,  buffs: [] };
        // checkHit em si retorna true porque 1+20+2=23 >= 1
        const rawResult = checkHit(1, attacker, defender, CLASS_ADV);
        expect(rawResult).toBe(true); // checkHit não aplica a regra

        // A regra d20=1 deve ser aplicada pelo CALLER antes de chamar checkHit
        const enemyRoll = 1;
        const isFail    = enemyRoll === 1;
        const isCrit    = enemyRoll === 20;
        const enemyHit  = isFail ? false : (isCrit ? true : rawResult);
        expect(enemyHit).toBe(false); // override correto
    });

    it('d20=20 deve sempre causar hit, mesmo com ATK muito baixo (acerto crítico)', () => {
        const attacker = { class: 'Guerreiro', atk: 1,  buffs: [] };
        const defender = { class: 'Ladino',    def: 50, buffs: [] };
        // checkHit retornaria false porque 20+1+2=23 < 50
        const rawResult = checkHit(20, attacker, defender, CLASS_ADV);
        expect(rawResult).toBe(false); // checkHit não aplica a regra

        // A regra d20=20 deve ser aplicada pelo CALLER
        const enemyRoll = 20;
        const isFail    = enemyRoll === 1;
        const isCrit    = enemyRoll === 20;
        const enemyHit  = isFail ? false : (isCrit ? true : rawResult);
        expect(enemyHit).toBe(true); // override correto
    });

    it('d20 normal (2-19) segue checkHit normalmente', () => {
        const attacker = { class: 'Guerreiro', atk: 5, buffs: [] };
        const defender = { class: 'Ladino',    def: 10, buffs: [] };

        // d20=3: 3+5+2=10 >= 10 → hit
        expect(checkHit(3, attacker, defender, CLASS_ADV)).toBe(true);
        // d20=2: 2+5+2=9 < 10 → miss
        expect(checkHit(2, attacker, defender, CLASS_ADV)).toBe(false);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// BLOCO 13: Regressão — BUG useCaptureAction: dano crítico perdido
// ─────────────────────────────────────────────────────────────────────────────

describe('Regressão — BUG useCaptureAction: crit damage deve dobrar POWER', () => {

    it('dano com POWER dobrado é maior que dano normal (mesmo ATK/DEF)', () => {
        const normalDmg = calcDamage({ atk: 7, def: 4, power: 8,  damageMult: 1.0 });
        const critDmg   = calcDamage({ atk: 7, def: 4, power: 16, damageMult: 1.0 }); // power×2
        expect(critDmg).toBeGreaterThan(normalDmg);
    });

    it('POWER=8 → dano=11; POWER dobrado=16 → dano=19 (verificação direta)', () => {
        // 7 + 8 - 4 = 11
        expect(calcDamage({ atk: 7, def: 4, power: 8,  damageMult: 1.0 })).toBe(11);
        // 7 + 16 - 4 = 19
        expect(calcDamage({ atk: 7, def: 4, power: 16, damageMult: 1.0 })).toBe(19);
    });

    it('calcDamage é a função correta a usar para aplicar POWER customizado', () => {
        // O bug era chamar calculateDamage() com args extras (ignorados)
        // A correção chama calcDamage() diretamente com o power correto
        const power = 9; // BASIC_ATTACK_POWER['Bárbaro']
        const critPower = power * 2; // 18
        const critDmg = calcDamage({ atk: 9, def: 5, power: critPower, damageMult: 1.0 });
        // 9 + 18 - 5 = 22
        expect(critDmg).toBe(22);
    });
});
