import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildBaselineScenarios, simulateScenario, selectBaseTemplates, scaleMonsterTemplate,
  selectTierOneDamageSkills, buildClassAdvantages } from '../js/combat/combatSimulationHarness.js';

export const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export function validateConfig(config) {
  if (!config || !/^[A-Za-z0-9_-]+$/.test(config.id ?? '')) throw Error('ID inválido');
  if (typeof config.seed !== 'string' || !config.seed.length || config.seed.length > 200) throw Error('Seed inválida');
  for (const [key, max] of [['runs', 10000], ['maxTurns', 200]]) {
    if (!Number.isInteger(config[key]) || config[key] < 1 || config[key] > max) throw Error(`Limite inválido: ${key}`);
  }
  if (!Array.isArray(config.levels) || !config.levels.length || config.levels.length > 5 ||
      new Set(config.levels).size !== config.levels.length ||
      config.levels.some(n => !Number.isInteger(n) || n < 1 || n > 30)) throw Error('Níveis inválidos');
  if (typeof config.includeSelfControls !== 'boolean') throw Error('Controle inválido');
  if (!Number.isInteger(config.replicates) || config.replicates < 1 || config.replicates > 5) throw Error('Réplicas inválidas');
  if (!Array.isArray(config.pairs) || !config.pairs.length || config.pairs.some(p => !Array.isArray(p) || p.length !== 2 || p.some(c => typeof c !== 'string'))) throw Error('Pares inválidos');
  if (!Array.isArray(config.selfClasses) || config.selfClasses.some(c => typeof c !== 'string')) throw Error('Classes inválidas');
  return config;
}

// A identidade física A/B acompanha combatente, skill e política; o harness permanece intacto.
export function mirror(scenario) {
  return { ...structuredClone(scenario), player: structuredClone(scenario.enemy), enemy: structuredClone(scenario.player),
    playerSkill: structuredClone(scenario.enemySkill), enemySkill: structuredClone(scenario.playerSkill),
    playerActionProfile: scenario.enemyActionProfile, enemyActionProfile: scenario.playerActionProfile };
}

export function buildExperiments(data, config) {
  validateConfig(config);
  const unique = new Map();
  const pairKeys = config.pairs.map(pair => [...pair].sort().join(':'));
  const available = new Set(Object.keys(selectBaseTemplates(data.monstersJson)));
  if ([...config.pairs.flat(), ...config.selfClasses].some(c => !available.has(c))) throw Error('Classe desconhecida');
  for (const scenario of buildBaselineScenarios({ ...data, levels: config.levels })) {
    if (!pairKeys.includes([scenario.player.class, scenario.enemy.class].sort().join(':'))) continue;
    const ids = [scenario.player.id, scenario.enemy.id].sort();
    const key = `${ids.join(':')}:L${scenario.player.level}:${scenario.playerActionProfile}`;
    if (!unique.has(key)) unique.set(key, { ...scenario, id: key, control: false });
  }
  if (config.includeSelfControls) {
    const skills = selectTierOneDamageSkills(data.skillsJson);
    for (const template of Object.values(selectBaseTemplates(data.monstersJson))) {
      if (!config.selfClasses.includes(template.class)) continue;
      for (const level of config.levels) for (const profile of ['basic', 'mixed']) {
        const combatant = scaleMonsterTemplate(template, level);
        const id = `${template.id}:self:L${level}:${profile}`;
        unique.set(id, { id, label: `${template.class} espelhado L${level} ${profile}`, control: true,
          player: combatant, enemy: structuredClone(combatant), playerSkill: skills[template.class] ?? null,
          enemySkill: skills[template.class] ?? null, playerActionProfile: profile, enemyActionProfile: profile,
          classAdvantages: buildClassAdvantages(data.matchupsJson), initialEnergyRatio: 0, passivesEnabled: true });
      }
    }
  }
  if (unique.size !== (new Set(pairKeys).size + (config.includeSelfControls ? new Set(config.selfClasses).size : 0)) * config.levels.length * 2) throw Error('Matriz solicitada incompleta');
  if (unique.size === 0 || unique.size * config.runs * 2 * config.replicates > 1000000) throw Error('Orçamento de batalhas inválido');
  return [...unique.values()];
}

export function measure(scenario, config, reverse = false) {
  const input = reverse ? mirror(scenario) : scenario;
  const counts = { n: config.runs, aWins: 0, bWins: 0, draws: 0, turns: 0, attacks: 0, skillUses: 0, eneSpent: 0,
    actionsA: 0, actionsB: 0, hpA: 0, hpB: 0, effectiveDamageA: 0, effectiveDamageB: 0,
    noResponse: 0, firstActorFinalBlows: 0, turnHistogram: {} };
  for (let i = 0; i < config.runs; i++) {
    // Streams distintos: não alegamos pareamento de rolagens por combatente.
    const seed = `${config.seed}:${scenario.id}:${reverse ? 'B-first' : 'A-first'}:${i}`;
    const { summary: s, battleRuns: [battle] } = simulateScenario(input, { runs: 1, seed, maxTurns: config.maxTurns, includeBattleRuns: true });
    const aWon = reverse ? s.winRate === 0 && s.drawRate === 0 : s.winRate === 1;
    if (s.drawRate === 1) counts.draws++;
    else if (aWon) counts.aWins++;
    else counts.bWins++;
    counts.turns += s.ttk.mean;
    counts.attacks += s.actions.attacks;
    counts.skillUses += s.actions.skillUses;
    counts.eneSpent += s.actions.eneSpent;
    const playerHp = Math.max(0, battle.playerHpFinal), enemyHp = Math.max(0, battle.enemyHpFinal);
    const hpA = reverse ? enemyHp : playerHp, hpB = reverse ? playerHp : enemyHp;
    counts.hpA += hpA; counts.hpB += hpB;
    counts.effectiveDamageA += scenario.enemy.hpMax - hpB;
    counts.effectiveDamageB += scenario.player.hpMax - hpA;
    counts.actionsA += reverse ? Math.floor(s.actions.attacks/2) : Math.ceil(s.actions.attacks/2);
    counts.actionsB += reverse ? Math.ceil(s.actions.attacks/2) : Math.floor(s.actions.attacks/2);
    if (s.actions.attacks === 1) counts.noResponse++;
    if (battle.winner === 'player') counts.firstActorFinalBlows++;
    counts.turnHistogram[battle.turns] = (counts.turnHistogram[battle.turns] ?? 0) + 1;
  }
  return summarize(counts);
}

export function wilson(wins, n) {
  const z = 1.959963984540054, p = wins/n, d = 1+z*z/n;
  const center = (p+z*z/(2*n))/d, half = z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
  return [Math.max(0,center-half),Math.min(1,center+half)];
}
export function differenceInterval(a,b) {
  const p=a.aWins/a.n,q=b.aWins/b.n,[la,ua]=wilson(a.aWins,a.n),[lb,ub]=wilson(b.aWins,b.n);
  return [Math.max(-1,p-q-Math.hypot(p-la,ub-q))*100,Math.min(1,p-q+Math.hypot(ua-p,q-lb))*100];
}
function summarize(counts) {
  const ordered=Object.entries(counts.turnHistogram).sort((a,b)=>Number(a[0])-Number(b[0]));
  const at=index=>{let cumulative=0;for(const [turns,n] of ordered){cumulative+=n;if(index<cumulative)return Number(turns);}};
  const quantile=p=>{const x=(counts.n-1)*p,l=Math.floor(x),u=Math.ceil(x);return at(l)+(at(u)-at(l))*(x-l);};
  return {...counts,aWinRate:counts.aWins/counts.n,aWinInterval95:wilson(counts.aWins,counts.n),meanTurns:counts.turns/counts.n,
    medianTurns:quantile(.5),p10Turns:quantile(.1),p90Turns:quantile(.9),meanHpA:counts.hpA/counts.n,meanHpB:counts.hpB/counts.n};
}
function pool(rows) {
  const counts={};
  for(const key of ['n','aWins','bWins','draws','turns','attacks','skillUses','eneSpent','actionsA','actionsB','hpA','hpB','effectiveDamageA','effectiveDamageB','noResponse','firstActorFinalBlows']) counts[key]=rows.reduce((sum,r)=>sum+r[key],0);
  counts.turnHistogram={};for(const r of rows)for(const [t,n] of Object.entries(r.turnHistogram))counts.turnHistogram[t]=(counts.turnHistogram[t]??0)+n;
  return summarize(counts);
}
export function runExperiment(data, config) {
  const scenarios = buildExperiments(data, config);
  return scenarios.map(scenario => {
    const bySeed=Array.from({length:config.replicates},(_,i)=>{
      const c={...config,seed:`${config.seed}:replicate-${i+1}`};
      return {seed:c.seed,aFirst:measure(scenario,c),bFirst:measure(scenario,c,true)};
    });
    const aFirst=pool(bySeed.map(r=>r.aFirst)),bFirst=pool(bySeed.map(r=>r.bFirst));
    return { id: scenario.id, control: scenario.control, scenario,
      aFirst, bFirst, bySeed, deltaWinPercentagePoints: 100 * (aFirst.aWinRate - bFirst.aWinRate),deltaInterval95: differenceInterval(aFirst,bFirst) };
  });
}

export function renderReport(payload) {
  return ['# Experimento de ordem — harness V2.2', '', 'Status: PROPOSAL | Domain: técnica | Authority: nenhuma',
    `VerifiedAgainst: ${payload.sourceCommit}`, 'Supersedes: nenhum', '',
    `Execução: ${payload.id}. Seed: ${payload.config.seed}. ${payload.results.length} pares × 2 ordens × ${payload.config.runs} batalhas × ${payload.config.replicates} sementes.`,
    'A é sempre o mesmo combatente; A-primeiro e B-primeiro trocam todos os campos associados ao papel.',
    'Streams de RNG distintos por ordem e batalha. IC95 por proporção: Wilson; diferença: Newcombe para amostras independentes. Intervalos exploratórios, sem correção por múltiplas comparações.', '',
    '| Cenário | Controle idêntico | A vence, A primeiro | A vence, B primeiro | Delta p.p. [IC95] | Turnos A/B primeiro | Empates A/B primeiro |',
    '|---|---|---:|---:|---:|---:|---:|',
    ...payload.results.map(r => `| ${r.scenario.label} | ${r.control ? 'sim' : 'não'} | ${(100*r.aFirst.aWinRate).toFixed(2)}% | ${(100*r.bFirst.aWinRate).toFixed(2)}% | ${r.deltaWinPercentagePoints.toFixed(2)} [${r.deltaInterval95.map(n=>n.toFixed(2)).join('; ')}] | ${r.aFirst.meanTurns.toFixed(2)} / ${r.bFirst.meanTurns.toFixed(2)} | ${r.aFirst.draws} / ${r.bFirst.draws} |`), '',
    '## Duração, HP e oportunidades', '',
    '| Cenário | Mediana A/B primeiro | P10–P90 A primeiro | P10–P90 B primeiro | HP A final A/B primeiro | Ações médias A/B (A primeiro) | Ações médias A/B (B primeiro) | Sem resposta A/B primeiro |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
    ...payload.results.map(r=>`| ${r.scenario.label} | ${r.aFirst.medianTurns}/${r.bFirst.medianTurns} | ${r.aFirst.p10Turns}–${r.aFirst.p90Turns} | ${r.bFirst.p10Turns}–${r.bFirst.p90Turns} | ${r.aFirst.meanHpA.toFixed(2)}/${r.bFirst.meanHpA.toFixed(2)} | ${(r.aFirst.actionsA/r.aFirst.n).toFixed(2)}/${(r.aFirst.actionsB/r.aFirst.n).toFixed(2)} | ${(r.bFirst.actionsA/r.bFirst.n).toFixed(2)}/${(r.bFirst.actionsB/r.bFirst.n).toFixed(2)} | ${r.aFirst.noResponse}/${r.bFirst.noResponse} |`), '',
    '## Recursos e dano efetivo', '',
    '| Cenário | Dano médio A causa/recebe (A primeiro) | Dano médio A causa/recebe (B primeiro) | ENE total média A/B primeiro | Skills totais médias A/B primeiro |',
    '|---|---:|---:|---:|---:|',
    ...payload.results.map(r=>`| ${r.scenario.label} | ${(r.aFirst.effectiveDamageA/r.aFirst.n).toFixed(2)}/${(r.aFirst.effectiveDamageB/r.aFirst.n).toFixed(2)} | ${(r.bFirst.effectiveDamageA/r.bFirst.n).toFixed(2)}/${(r.bFirst.effectiveDamageB/r.bFirst.n).toFixed(2)} | ${(r.aFirst.eneSpent/r.aFirst.n).toFixed(2)}/${(r.bFirst.eneSpent/r.bFirst.n).toFixed(2)} | ${(r.aFirst.skillUses/r.aFirst.n).toFixed(2)}/${(r.bFirst.skillUses/r.bFirst.n).toFixed(2)} |`), '',
    '## Limites', '', ...payload.limitations.map(x => `- ${x}`), '',
    `Hash dos resultados: ${payload.resultsHash}`, ''].join('\n');
}

export function main(argv = process.argv.slice(2)) {
  const args = { config: 'experiments/configs/turn-order-v22.json', output: 'artifacts/turn-order-v22', 'source-commit': process.env.GITHUB_SHA };
  for (let i=0;i<argv.length;i+=2) {
    const key = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !(key in args) || !argv[i+1]) throw Error('Argumento inválido');
    args[key] = argv[i+1];
  }
  if (!/^[0-9a-f]{40}$/.test(args['source-commit'] ?? '')) throw Error('Informe --source-commit com SHA completo');
  const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
  const config = validateConfig(readJson(args.config));
  const sources = ['js/combat/combatSimulationHarness.js', 'js/combat/groupCombatFormula.js', 'data/monsters.json',
    'data/skills.json', 'design/canon/class_matchups.json', 'scripts/experiment-turn-order-v22.mjs', args.config];
  const sourceHashes = Object.fromEntries(sources.map(path => [path, digest(readFileSync(path, 'utf8'))]));
  const data = { monstersJson: readJson('data/monsters.json'), skillsJson: readJson('data/skills.json'), matchupsJson: readJson('design/canon/class_matchups.json') };
  const started=performance.now();
  const results = runExperiment(data, config);
  const payload = { schemaVersion: 1, id: config.id, generatedAt: new Date().toISOString(), sourceCommit: args['source-commit'],
    runtime: process.version, elapsedMs: Math.round(performance.now()-started), engine: 'combatSimulationHarness-v2.2', policy: 'basic ou mixed do harness; ENE inicial zero',
    config, configHash: digest(config), sourceHashes, resultsHash: digest(results), results,
    limitations: ['Mede apenas o harness 1×1, sem tabuleiro, grupos, cura, itens, IA completa ou passivas de espécie.',
      'Não implementa nem valida SPD + d6; a divergência DIV-INIT-01 permanece aberta.',
      'mixed usa a primeira skill ofensiva estágio 0; Curandeiro sem skill ofensiva retorna ao básico.',
      'Níveis acima de 1 usam crescimento sintético do harness, sem garantir evolução natural.',
      'Contadores de ações/ENE são totais dos dois lados; turnos incluem batalhas encerradas no limite.',
      'Amostra fixa; diferenças pequenas podem ser ruído de Monte Carlo. Nenhuma decisão de balanceamento.',
      'Dano efetivo é HP perdido, com HP final limitado a zero; não inclui overkill. Ações por lado inferidas da alternância estrita, incluindo falhas.',
      'sourceCommit é referência declarada; hashes dos bytes executados são a evidência exata.'] };
  mkdirSync(dirname(resolve(args.output)), { recursive: true });
  writeFileSync(`${args.output}.json`, JSON.stringify(payload, null, 2)+'\n');
  writeFileSync(`${args.output}.md`, renderReport(payload));
  console.log(JSON.stringify({ id: payload.id, pairs: results.length, battles: results.length*2*config.runs*config.replicates, resultsHash: payload.resultsHash }));
  return payload;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch(error) { console.error(error.message); process.exitCode=1; }
}
