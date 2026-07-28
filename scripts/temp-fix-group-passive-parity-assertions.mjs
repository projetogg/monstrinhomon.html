import { readFileSync, writeFileSync } from 'node:fs';

const path = 'tests/speciesPassiveModeParityV22.test.js';
let source = readFileSync(path, 'utf8');

const before = `    expect(groupSkill).toContain('fireCombatEvent(mon, ON_ATTACK');
    expect(groupSkill).toContain('fireCombatEvent(mon, ON_SKILL_USED');
    expect(groupSkill).toContain('shadowstingDebuffCharged = true');
    expect(groupSkill).toContain('bellwaveRhythmCharged = true');
    expect(groupSkill).toContain('atk: effectiveAtkForSkill');`;

const after = `    expect(groupSkill).toContain('resolvePlayerSpeciesSkillAttack');
    expect(groupSkill).toContain('dispatchPlayerSpeciesSkillUsed');
    expect(groupSkill).toContain('atk: effectiveAtkForSkill');
    expect(GROUP_SOURCE).toContain('fireCombatEvent(mon, ON_ATTACK');
    expect(GROUP_SOURCE).toContain('fireCombatEvent(mon, ON_SKILL_USED');
    expect(GROUP_SOURCE).toContain('shadowstingDebuffCharged = true');
    expect(GROUP_SOURCE).toContain('bellwaveRhythmCharged = true');`;

const count = source.split(before).length - 1;
if (count !== 1) {
  throw new Error(`bloco de asserções Group encontrado ${count} vez(es), esperado 1`);
}

source = source.replace(before, after);
writeFileSync(path, source);
console.log('Asserções estruturais ajustadas ao escopo real dos helpers.');
