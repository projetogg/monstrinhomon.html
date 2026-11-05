import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateConfig, mirror, buildExperiments, runExperiment, measure, wilson, differenceInterval } from '../scripts/experiment-turn-order-v22.mjs';
import { simulateScenario } from '../js/combat/combatSimulationHarness.js';
const config = JSON.parse(readFileSync(new URL('../experiments/configs/turn-order-v22.json', import.meta.url)));
const data = Object.fromEntries([['monstersJson','data/monsters.json'],['skillsJson','data/skills.json'],['matchupsJson','design/canon/class_matchups.json']]
  .map(([key,path])=>[key,JSON.parse(readFileSync(new URL('../'+path,import.meta.url)))]));
test('rejeita orçamento fracionário, infinito, níveis repetidos e seed ausente',()=>{
  for(const bad of [{runs:NaN},{runs:1.5},{runs:Infinity},{maxTurns:0},{levels:[1,1]},{seed:''},{includeSelfControls:null}])
    assert.throws(()=>validateConfig({...config,...bad}));
});
test('deduplica confrontos recíprocos e preserva a matriz selecionada de 20 casos',()=>{
  const cases=buildExperiments(data,config);
  assert.equal(cases.length,20);assert.equal(cases.filter(x=>x.control).length,8);
  assert.equal(new Set(cases.map(x=>x.id)).size,20);
  assert.throws(()=>buildExperiments(data,{...config,pairs:[['Guerreiro','Classe inexistente']]}));
});
test('espelhamento troca identidade, skills e política sem mutar; dupla troca é identidade',()=>{
  const s={...buildExperiments(data,config)[0],playerActionProfile:'basic',enemyActionProfile:'mixed',playerSkill:{id:'A'},enemySkill:{id:'B'}};
  const original=structuredClone(s),m=mirror(s);
  assert.deepEqual(m.player,s.enemy);assert.deepEqual(m.enemySkill,s.playerSkill);
  assert.equal(m.playerActionProfile,'mixed');assert.equal(m.enemyActionProfile,'basic');
  m.player.hp=0;assert.deepEqual(s,original);assert.deepEqual(mirror(mirror(s)),s);
});
test('mantém contagens e repetibilidade exatas com dados reais',()=>{
  const small={...config,runs:8,replicates:1};const a=runExperiment(data,small),b=runExperiment(data,small);
  assert.deepEqual(a,b);
  for(const r of a)for(const counts of [r.aFirst,r.bFirst]){
    assert.equal(counts.aWins+counts.bWins+counts.draws,8);
    assert.ok(counts.turns>=8&&counts.turns<=8*config.maxTurns);
  }
});
test('observação opcional não altera o resultado padrão nem o RNG',()=>{
  const s=buildExperiments(data,config)[0],options={runs:50,seed:'preservacao'};
  const original=simulateScenario(s,options),observed=simulateScenario(s,{...options,includeBattleRuns:true});
  const {battleRuns,...rest}=observed;assert.deepEqual(rest,original);assert.equal(battleRuns.length,50);
  assert.ok(!('battleRuns' in original));
});
test('intervalos preservam extremos, simetria e incluem zero no controle nulo',()=>{
  assert.ok(wilson(0,100)[0]<1e-10);assert.equal(wilson(100,100)[1],1);
  const a={aWins:60,n:100},b={aWins:40,n:100};
  const ci=differenceInterval(a,b),reverse=differenceInterval(b,a);
  assert.ok(Math.abs(ci[0]+reverse[1])<1e-10);assert.ok(Math.abs(ci[1]+reverse[0])<1e-10);
  const nil=differenceInterval(a,a);assert.ok(nil[0]<0&&nil[1]>0);
});
test('limite curto contabiliza empate sem convertê-lo em vitória de B',()=>{
  const s=buildExperiments(data,config).find(x=>x.control);
  s.player.hpMax=s.enemy.hpMax=100000;
  for(const reverse of [false,true]){const r=measure(s,{...config,runs:10,maxTurns:1},reverse);
    assert.equal(r.draws,10);assert.equal(r.aWins,0);assert.equal(r.bWins,0);}
});
test('controle letal detecta vantagem de ordem com o motor real e remapeia vitória de A',()=>{
  const s=buildExperiments(data,config).find(x=>x.control);
  for(const actor of [s.player,s.enemy]){actor.hpMax=1;actor.atk=100;actor.def=1;}
  const c={...config,runs:200};const first=measure(s,c),second=measure(s,c,true);
  assert.ok(first.aWins>160);assert.ok(second.aWins<40);
});
