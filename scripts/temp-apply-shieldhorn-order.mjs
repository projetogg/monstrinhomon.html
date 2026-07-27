import { readFileSync, writeFileSync } from 'node:fs';

const wildPath = 'js/combat/wildActions.js';
const testPath = 'tests/speciesPassiveModeParityV22.test.js';

let wild = readFileSync(wildPath, 'utf8');
let tests = readFileSync(testPath, 'utf8');

function replaceExactlyOnce(source, before, after, label) {
  const count = source.split(before).length - 1;
  if (count !== 1) {
    throw new Error(`${label}: encontrado ${count} vez(es), esperado 1`);
  }
  return source.replace(before, after);
}

const oldWild = `            // Passiva canônica — defensor (shieldhorn: -1 dano; jogador só ataca 1x por turno)
            const defPassive = fireCombatEvent(encounter.wildMonster, ON_HIT, {
                hpPct: encounter.wildMonster.hpMax > 0 ? encounter.wildMonster.hp / encounter.wildMonster.hpMax : 0,
                isFirstHitThisTurn: true, // Fase 4.2: jogador ataca apenas uma vez por turno
            });
            if (defPassive?.damageReduction) {
                const reducedDamage = Math.max(1, damage - defPassive.damageReduction);
                if (reducedDamage < damage) {
                    const shieldLabel = _passiveLabel(encounter.wildMonster.canonSpeciesId, 'on_hit_received');
                    encounter.log.push(
                        shieldLabel
                            ? \`🛡️ Passiva \${encounter.wildMonster.name} (\${shieldLabel}): -\${damage - reducedDamage} dano\`
                            : \`🛡️ Passiva \${encounter.wildMonster.name}: -\${damage - reducedDamage} dano\`
                    );
                }
                damage = reducedDamage;
            }

            // F1: Passiva de classe do atacante (Ladino +10% dano)
            const atkClassPassive = CLASS_COMBAT_PASSIVES[playerMonster.class];
            if (atkClassPassive?.attackBonus) {
                damage = Math.max(1, Math.round(damage * (1 + atkClassPassive.attackBonus)));
            }

            // F1: Passiva de classe do defensor (Guerreiro/Bárbaro/Curandeiro)
            const defClassPassive = CLASS_COMBAT_PASSIVES[encounter.wildMonster.class];
            if (defClassPassive?.defenseBonus) {
                damage = Math.max(1, Math.round(damage * (1 - defClassPassive.defenseBonus)));
            }
`;

const newWild = `            // F1: Passiva de classe do atacante (Ladino +10% dano)
            const atkClassPassive = CLASS_COMBAT_PASSIVES[playerMonster.class];
            if (atkClassPassive?.attackBonus) {
                damage = Math.max(1, Math.round(damage * (1 + atkClassPassive.attackBonus)));
            }

            // F1: Passiva de classe do defensor (Guerreiro/Bárbaro/Curandeiro)
            // DEC-SPECIES-DEF-01: mitigação percentual ocorre antes da redução plana de espécie.
            const defClassPassive = CLASS_COMBAT_PASSIVES[encounter.wildMonster.class];
            if (defClassPassive?.defenseBonus) {
                damage = Math.max(1, Math.round(damage * (1 - defClassPassive.defenseBonus)));
            }

            // Passiva canônica — defensor (shieldhorn: -1 dano; jogador só ataca 1x por turno)
            const defPassive = fireCombatEvent(encounter.wildMonster, ON_HIT, {
                hpPct: encounter.wildMonster.hpMax > 0 ? encounter.wildMonster.hp / encounter.wildMonster.hpMax : 0,
                isFirstHitThisTurn: true, // Fase 4.2: jogador ataca apenas uma vez por turno
            });
            if (defPassive?.damageReduction) {
                const reducedDamage = Math.max(1, damage - defPassive.damageReduction);
                if (reducedDamage < damage) {
                    const shieldLabel = _passiveLabel(encounter.wildMonster.canonSpeciesId, 'on_hit_received');
                    encounter.log.push(
                        shieldLabel
                            ? \`🛡️ Passiva \${encounter.wildMonster.name} (\${shieldLabel}): -\${damage - reducedDamage} dano\`
                            : \`🛡️ Passiva \${encounter.wildMonster.name}: -\${damage - reducedDamage} dano\`
                    );
                }
                damage = reducedDamage;
            }
`;

wild = replaceExactlyOnce(wild, oldWild, newWild, 'pipeline Wild');

const oldStructure = `  it('caracteriza a ordem divergente entre shieldhorn e passiva defensiva de classe', () => {
    const wildSpeciesIndex = wildBasic.indexOf('const defPassive = fireCombatEvent');
    const wildClassIndex = wildBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');
    const groupClassIndex = groupBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');
    const groupSpeciesIndex = groupBasic.indexOf('const defSpeciesPassive = fireCombatEvent');

    expect(wildSpeciesIndex).toBeGreaterThanOrEqual(0);
    expect(wildClassIndex).toBeGreaterThan(wildSpeciesIndex);
    expect(groupClassIndex).toBeGreaterThanOrEqual(0);
    expect(groupSpeciesIndex).toBeGreaterThan(groupClassIndex);
  });
`;

const newStructure = `  it('aplica resistência de classe antes de shieldhorn nos dois modos', () => {
    const wildClassIndex = wildBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');
    const wildSpeciesIndex = wildBasic.indexOf('const defPassive = fireCombatEvent');
    const groupClassIndex = groupBasic.indexOf('const defClassPassive = CLASS_COMBAT_PASSIVES');
    const groupSpeciesIndex = groupBasic.indexOf('const defSpeciesPassive = fireCombatEvent');

    expect(wildClassIndex).toBeGreaterThanOrEqual(0);
    expect(wildSpeciesIndex).toBeGreaterThan(wildClassIndex);
    expect(groupClassIndex).toBeGreaterThanOrEqual(0);
    expect(groupSpeciesIndex).toBeGreaterThan(groupClassIndex);
  });
`;

tests = replaceExactlyOnce(tests, oldStructure, newStructure, 'teste estrutural');
tests = replaceExactlyOnce(
  tests,
  "it('DRIFT: a ordem de shieldhorn e resistência de Guerreiro muda o dano em cenário de fronteira', () => {",
  "it('PARITY: shieldhorn reduz após a resistência de Guerreiro nos dois modos', () => {",
  'título do cenário',
);
tests = replaceExactlyOnce(
  tests,
  '    expect(wildShield.damage).toBe(3);',
  '    expect(wildShield.damage).toBe(2);',
  'dano Wild com shieldhorn',
);
tests = replaceExactlyOnce(
  tests,
  `    expect(groupShield.damage).toBe(2);
  });`,
  `    expect(groupShield.damage).toBe(2);
    expect(wildBase.damage).toBe(groupBase.damage);
    expect(wildShield.damage).toBe(groupShield.damage);
  });`,
  'igualdades de paridade',
);

writeFileSync(wildPath, wild);
writeFileSync(testPath, tests);
console.log('DEC-SPECIES-DEF-01 aplicada de forma determinística.');
