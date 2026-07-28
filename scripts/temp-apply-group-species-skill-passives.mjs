import { readFileSync, writeFileSync } from 'node:fs';

function replaceOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: encontrado ${count} vez(es), esperado 1`);
  }
  return source.replace(before, after);
}

const actionsPath = 'js/combat/groupActions.js';
const parityPath = 'tests/speciesPassiveModeParityV22.test.js';
const skillTestPath = 'tests/groupSkillExecution.test.js';

let actions = readFileSync(actionsPath, 'utf8');
let parity = readFileSync(parityPath, 'utf8');
let skillTests = readFileSync(skillTestPath, 'utf8');

const skillHelpers = `/**
 * Despacha ON_ATTACK para uma skill válida do jogador e gerencia o estado
 * compartilhado das passivas de espécie.
 *
 * O modificador retornado é aplicado pelo caller ao ATK efetivo da skill
 * ofensiva. Skills não ofensivas ainda podem consumir a abertura do swiftclaw,
 * preservando a semântica já caracterizada no Wild.
 */
function resolvePlayerSpeciesSkillAttack(skill, context) {
    const { mon, monName, enc, helpers } = context;
    const passiveState = enc.passiveState || (enc.passiveState = {});
    const offensive = isOffensiveSkill(skill);
    const modifier = fireCombatEvent(mon, ON_ATTACK, {
        hpPct: (Number(mon.hpMax) || 1) > 0 ? (Number(mon.hp) || 0) / (Number(mon.hpMax) || 1) : 0,
        isOffensiveSkill: offensive,
        isFirstAttackOfCombat: !passiveState.swiftclawFirstStrikeDone,
        hasShadowstingCharge: false,
        hasBellwaveRhythmCharge: false,
    });

    if (modifier?.atkBonus) {
        helpers.log(enc, \`✨ Passiva \${monName}: +\${modifier.atkBonus} ATK (skill)\`);
        passiveState.swiftclawFirstStrikeDone = true;
    }

    return modifier;
}

/**
 * Despacha ON_SKILL_USED exatamente uma vez após uma skill válida ter sido
 * consumida. O helper aplica moonquill e produz as cargas de shadowsting e
 * bellwave; o ataque básico continua responsável por consumir as cargas.
 */
function dispatchPlayerSpeciesSkillUsed(skill, context) {
    const { mon, monName, enc, helpers } = context;
    const passiveState = enc.passiveState || (enc.passiveState = {});
    const skillType = String(
        skill.type ||
        (skill.category === 'Cura' ? 'HEAL' : skill.category === 'Suporte' ? 'BUFF' : 'DAMAGE')
    ).toUpperCase();
    const target = skill.target || '';
    const isDebuff =
        skillType === 'BUFF' &&
        (target === 'enemy' || target === 'Inimigo') &&
        (Number(skill.power) || 0) < 0;

    const modifier = fireCombatEvent(mon, ON_SKILL_USED, {
        hpPct: (Number(mon.hpMax) || 1) > 0 ? (Number(mon.hp) || 0) / (Number(mon.hpMax) || 1) : 0,
        skillType,
        isDebuff,
    });

    if (modifier?.spdBuff) {
        applyBuff(mon, {
            type: 'spd',
            power: modifier.spdBuff.power,
            duration: modifier.spdBuff.duration,
            source: 'moonquill_passive',
        });
        helpers.log(
            enc,
            \`✨ Passiva \${monName}: +\${modifier.spdBuff.power} SPD por \${modifier.spdBuff.duration} turno(s)\`,
        );
    }

    if (isDebuff && mon.canonSpeciesId === 'shadowsting') {
        passiveState.shadowstingDebuffCharged = true;
        helpers.log(enc, \`🗡️ Passiva \${monName}: carga de debuff preparada para o próximo ataque básico\`);
    }

    if (mon.canonSpeciesId === 'bellwave') {
        passiveState.bellwaveRhythmCharged = true;
        helpers.log(enc, \`🎵 Passiva \${monName}: ritmo carregado para o próximo ataque básico\`);
    }
}

`;

const skillMarker = `/**
 * CAMADA 4C: Executa skill do jogador em combate de grupo.`;
actions = replaceOnce(actions, skillMarker, skillHelpers + skillMarker, 'inserção dos helpers de skill');

actions = replaceOnce(
  actions,
  `    const isOffensive = isOffensiveSkill(skill);

    if (isOffensive) {`,
  `    const isOffensive = isOffensiveSkill(skill);

    if (isOffensive) {`,
  'âncora de ofensividade',
);

actions = replaceOnce(
  actions,
  `        const enemyName = enemy.name || enemy.nome || "Inimigo";

        // Rolagem d20 para acurácia da skill`,
  `        const enemyName = enemy.name || enemy.nome || "Inimigo";

        // Passivas de espécie no uso de skill — ON_ATTACK.
        // O evento ocorre após a validação do alvo e antes da resolução da ação.
        const skillSpeciesAttack = resolvePlayerSpeciesSkillAttack(skill, {
            mon, monName, enc, helpers,
        });

        // Rolagem d20 para acurácia da skill`,
  'ON_ATTACK da skill ofensiva',
);

actions = replaceOnce(
  actions,
  `        if (!hit) {
            helpers.log(enc, \`✨ \${attackerName} (\${monName}) usou \${skillName} e ERROU! (rolou \${d20})\`);
            ui.showMissFeedback(\`grpP_\${actor.id}\`);
            advanceGroupTurn(enc, deps);`,
  `        if (!hit) {
            helpers.log(enc, \`✨ \${attackerName} (\${monName}) usou \${skillName} e ERROU! (rolou \${d20})\`);
            ui.showMissFeedback(\`grpP_\${actor.id}\`);
            dispatchPlayerSpeciesSkillUsed(skill, { mon, monName, enc, helpers });
            advanceGroupTurn(enc, deps);`,
  'ON_SKILL_USED no miss',
);

actions = replaceOnce(
  actions,
  `        const effectiveAtk = Math.max(1, (Number(mon.atk) || 0) + atkMods.atk);
        const defMods = core.getBuffModifiers(enemy);`,
  `        const effectiveAtk = Math.max(1, (Number(mon.atk) || 0) + atkMods.atk);
        const effectiveAtkForSkill = Math.max(
            1,
            effectiveAtk + (Number(skillSpeciesAttack?.atkBonus) || 0),
        );
        const defMods = core.getBuffModifiers(enemy);`,
  'ATK efetivo da skill',
);

actions = replaceOnce(
  actions,
  `        let dmg = core.calcDamage({
            atk: effectiveAtk,`,
  `        let dmg = core.calcDamage({
            atk: effectiveAtkForSkill,`,
  'atkBonus antes de calcDamage',
);

actions = replaceOnce(
  actions,
  `        ui.showDamageFeedback(\`grpE_\${tIdx}\`, dmg, isCrit);

        if (!core.isAlive(enemy)) {`,
  `        ui.showDamageFeedback(\`grpE_\${tIdx}\`, dmg, isCrit);
        dispatchPlayerSpeciesSkillUsed(skill, { mon, monName, enc, helpers });

        if (!core.isAlive(enemy)) {`,
  'ON_SKILL_USED após acerto',
);

actions = replaceOnce(
  actions,
  `    } else {
        // Habilidades não-ofensivas: despacha para executeNonOffensiveSkillGroup
        executeNonOffensiveSkillGroup(skill, {`,
  `    } else {
        // Mesmo contrato do Wild: uma skill válida também despacha ON_ATTACK,
        // permitindo que swiftclaw consuma a abertura na primeira ação de skill.
        resolvePlayerSpeciesSkillAttack(skill, { mon, monName, enc, helpers });

        // Habilidades não-ofensivas: despacha para executeNonOffensiveSkillGroup
        executeNonOffensiveSkillGroup(skill, {`,
  'ON_ATTACK da skill não ofensiva',
);

actions = replaceOnce(
  actions,
  `        executeNonOffensiveSkillGroup(skill, {
            mon, monName, player, attackerName, enc, deps,
        });

        // Se há skill pendente de aliado`,
  `        executeNonOffensiveSkillGroup(skill, {
            mon, monName, player, attackerName, enc, deps,
        });
        dispatchPlayerSpeciesSkillUsed(skill, { mon, monName, enc, helpers });

        // Se há skill pendente de aliado`,
  'ON_SKILL_USED da skill não ofensiva',
);

parity = replaceOnce(
  parity,
  `  it('Wild dispara eventos de skill e prepara cargas; Group ainda não', () => {
    expect(wildSkill).toContain('fireCombatEvent(playerMonster, ON_ATTACK');
    expect(wildSkill).toContain('fireCombatEvent(playerMonster, ON_SKILL_USED');
    expect(wildSkill).toContain('shadowstingDebuffCharged = true');
    expect(wildSkill).toContain('bellwaveRhythmCharged = true');

    expect(groupSkill).not.toContain('fireCombatEvent(');
    expect(groupSkill).not.toContain('shadowstingDebuffCharged = true');
    expect(groupSkill).not.toContain('bellwaveRhythmCharged = true');
  });`,
  `  it('Wild e Group despacham eventos de skill e preparam as mesmas cargas', () => {
    expect(wildSkill).toContain('fireCombatEvent(playerMonster, ON_ATTACK');
    expect(wildSkill).toContain('fireCombatEvent(playerMonster, ON_SKILL_USED');
    expect(wildSkill).toContain('shadowstingDebuffCharged = true');
    expect(wildSkill).toContain('bellwaveRhythmCharged = true');

    expect(groupSkill).toContain('fireCombatEvent(mon, ON_ATTACK');
    expect(groupSkill).toContain('fireCombatEvent(mon, ON_SKILL_USED');
    expect(groupSkill).toContain('shadowstingDebuffCharged = true');
    expect(groupSkill).toContain('bellwaveRhythmCharged = true');
    expect(groupSkill).toContain('atk: effectiveAtkForSkill');
  });`,
  'teste estrutural de eventos de skill',
);

skillTests = replaceOnce(
  skillTests,
  `            canUseSkillNow: (skill, m) => (m.ene >= (skill.energy_cost || 0))`,
  `            canUseSkillNow: (skill, m) => (m.ene >= Number(skill.cost ?? skill.energy_cost ?? 0))`,
  'helper de custo canônico',
);

const behaviorTests = `

// ---------------------------------------------------------------------------
// executePlayerSkillGroup - Passivas de espécie
// ---------------------------------------------------------------------------

describe('executePlayerSkillGroup - Passivas de espécie', () => {
    const offensiveSkill = (overrides = {}) => ({
        id: 'SK_SPECIES_DAMAGE',
        name: 'Golpe de Espécie',
        type: 'DAMAGE',
        target: 'enemy',
        power: 8,
        cost: 2,
        accuracy: 1,
        ...overrides,
    });

    const debuffSkill = (overrides = {}) => ({
        id: 'SK_SPECIES_DEBUFF',
        name: 'Debuff de Espécie',
        type: 'BUFF',
        target: 'enemy',
        power: -1,
        cost: 1,
        accuracy: 1,
        ...overrides,
    });

    function runSkill({ monOverrides = {}, skill = offensiveSkill(), rollD20Val = 15, preState = null }) {
        const mon = makeMon(monOverrides);
        const player = makePlayer(mon);
        const enemies = [makeEnemy({ hp: 100, hpMax: 100, def: 6 })];
        const { deps, enc } = makeDeps({ mon, player, enemies, rollD20Val });
        if (preState) enc.passiveState = { ...preState };
        const hpBefore = enemies[0].hp;
        const result = executePlayerSkillGroup(skill, 0, deps);
        return { mon, enemy: enemies[0], enc, result, damage: hpBefore - enemies[0].hp };
    }

    it('emberfang adiciona +1 ATK antes do cálculo da skill ofensiva', () => {
        const base = runSkill({ monOverrides: { canonSpeciesId: null } });
        const passive = runSkill({ monOverrides: { canonSpeciesId: 'emberfang' } });

        expect(passive.damage).toBe(base.damage + 1);
        expect(passive.enc.log.some(line => line.includes('+1 ATK (skill)'))).toBe(true);
    });

    it('emberfang preserva o limite estrito e não ativa exatamente em 70% de HP', () => {
        const base = runSkill({ monOverrides: { hp: 35, hpMax: 50, canonSpeciesId: null } });
        const boundary = runSkill({ monOverrides: { hp: 35, hpMax: 50, canonSpeciesId: 'emberfang' } });

        expect(boundary.damage).toBe(base.damage);
    });

    it('swiftclaw aplica a abertura na primeira skill e registra o consumo', () => {
        const base = runSkill({ monOverrides: { canonSpeciesId: null } });
        const first = runSkill({ monOverrides: { canonSpeciesId: 'swiftclaw' } });

        expect(first.damage).toBe(base.damage + 1);
        expect(first.enc.passiveState.swiftclawFirstStrikeDone).toBe(true);
    });

    it('swiftclaw não concede novo bônus quando a abertura já foi consumida', () => {
        const base = runSkill({ monOverrides: { canonSpeciesId: null } });
        const consumed = runSkill({
            monOverrides: { canonSpeciesId: 'swiftclaw' },
            preState: { swiftclawFirstStrikeDone: true },
        });

        expect(consumed.damage).toBe(base.damage);
    });

    it('moonquill recebe +1 SPD por 1 turno após usar debuff', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'moonquill' },
            skill: debuffSkill(),
        });

        expect(result.mon.buffs).toEqual(expect.arrayContaining([
            expect.objectContaining({
                type: 'spd',
                power: 1,
                duration: 1,
                source: 'moonquill_passive',
            }),
        ]));
    });

    it('shadowsting cria carga após utilizar debuff', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'shadowsting' },
            skill: debuffSkill(),
        });

        expect(result.enc.passiveState.shadowstingDebuffCharged).toBe(true);
    });

    it('bellwave cria carga após qualquer skill válida', () => {
        const result = runSkill({ monOverrides: { canonSpeciesId: 'bellwave' } });

        expect(result.enc.passiveState.bellwaveRhythmCharged).toBe(true);
    });

    it('skill ofensiva que erra ainda despacha ON_SKILL_USED para bellwave', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'bellwave' },
            rollD20Val: 1,
        });

        expect(result.damage).toBe(0);
        expect(result.enc.passiveState.bellwaveRhythmCharged).toBe(true);
    });

    it('ENE insuficiente não cria carga nem estado de passiva', () => {
        const result = runSkill({
            monOverrides: { canonSpeciesId: 'bellwave', ene: 0 },
            skill: offensiveSkill({ cost: 2 }),
        });

        expect(result.result).toBe(false);
        expect(result.enc.passiveState).toBeUndefined();
        expect(result.mon.buffs).toEqual([]);
    });
});
`;

const defensiveMarker = `// ---------------------------------------------------------------------------
// executePlayerSkillGroup - Skills defensivas (Cura/Suporte)
// ---------------------------------------------------------------------------`;
skillTests = replaceOnce(
  skillTests,
  defensiveMarker,
  behaviorTests + '\n' + defensiveMarker,
  'inserção dos testes comportamentais',
);

writeFileSync(actionsPath, actions);
writeFileSync(parityPath, parity);
writeFileSync(skillTestPath, skillTests);

console.log('Passivas de espécie integradas ao caminho de skills Group.');
