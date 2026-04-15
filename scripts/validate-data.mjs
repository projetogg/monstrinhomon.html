/**
 * validate-data.mjs — Script de Validação de Integridade dos Dados
 *
 * Verifica: monsters.json, items.json, skills.json, worldMap.json
 * Uso: node scripts/validate-data.mjs
 *      npm run validate-data
 *
 * Códigos de saída:
 *   0 = todos os dados válidos
 *   1 = erros encontrados (dados inválidos)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Constantes canônicas ────────────────────────────────────────────────────

const VALID_CLASSES = [
    'Guerreiro', 'Mago', 'Curandeiro', 'Bárbaro',
    'Ladino', 'Bardo', 'Caçador', 'Animalista'
];

const VALID_RARITIES = ['Comum', 'Incomum', 'Raro', 'Místico', 'Lendário'];

const VALID_ITEM_TYPES = ['captura', 'cura', 'tatico', 'held', 'heal', 'capture'];

// ─── Helpers ────────────────────────────────────────────────────────────────

let errors = 0;
let warnings = 0;

function error(context, msg) {
    console.error(`  ❌ [${context}] ${msg}`);
    errors++;
}

function warn(context, msg) {
    console.warn(`  ⚠️  [${context}] ${msg}`);
    warnings++;
}

function ok(msg) {
    console.log(`  ✅ ${msg}`);
}

function loadJSON(relativePath) {
    const fullPath = resolve(ROOT, relativePath);
    try {
        return JSON.parse(readFileSync(fullPath, 'utf8'));
    } catch (e) {
        error('IO', `Falha ao carregar ${relativePath}: ${e.message}`);
        return null;
    }
}

function findDuplicateIds(arr, idField = 'id') {
    const seen = new Set();
    const dups = [];
    for (const item of arr) {
        const id = item[idField];
        if (seen.has(id)) dups.push(id);
        else seen.add(id);
    }
    return dups;
}

// ─── Validação: monsters.json ────────────────────────────────────────────────

function validateMonsters(data) {
    console.log('\n📦 monsters.json');

    if (!data?.monsters || !Array.isArray(data.monsters)) {
        error('monsters.json', 'Campo "monsters" ausente ou não é array');
        return;
    }

    const monsters = data.monsters;
    ok(`${monsters.length} monstros carregados`);

    // IDs duplicados
    const dups = findDuplicateIds(monsters);
    if (dups.length) error('monsters.json', `IDs duplicados: ${dups.join(', ')}`);
    else ok('Nenhum ID duplicado');

    // Campos obrigatórios e valores válidos
    const classesFound = new Set();
    for (const m of monsters) {
        const ctx = `monster:${m.id || '(sem id)'}`;
        if (!m.id) { error(ctx, 'Campo "id" ausente'); continue; }
        if (!m.name) error(ctx, 'Campo "name" ausente');
        if (!VALID_CLASSES.includes(m.class)) error(ctx, `Classe inválida: "${m.class}"`);
        else classesFound.add(m.class);
        if (!VALID_RARITIES.includes(m.rarity)) error(ctx, `Raridade inválida: "${m.rarity}"`);
        if (!m.baseHp || typeof m.baseHp !== 'number' || m.baseHp <= 0) {
            error(ctx, `baseHp inválido: ${m.baseHp}`);
        }
        // Alertas de balanceamento de HP base por raridade
        const HP_RANGES = {
            Comum: [20, 35], Incomum: [30, 45], Raro: [40, 60],
            Místico: [55, 75], Lendário: [70, 100]
        };
        const range = HP_RANGES[m.rarity];
        if (range && m.baseHp && (m.baseHp < range[0] || m.baseHp > range[1])) {
            warn(ctx, `baseHp ${m.baseHp} fora do range recomendado [${range[0]}-${range[1]}] para ${m.rarity}`);
        }
    }

    // Cobertura de classes
    const missingClasses = VALID_CLASSES.filter(c => !classesFound.has(c));
    if (missingClasses.length) warn('monsters.json', `Classes sem monstros: ${missingClasses.join(', ')}`);
    else ok('Todas as classes têm ao menos um monstro');
}

// ─── Validação: items.json ───────────────────────────────────────────────────

function validateItems(data) {
    console.log('\n🎒 items.json');

    if (!data?.items || !Array.isArray(data.items)) {
        error('items.json', 'Campo "items" ausente ou não é array');
        return;
    }

    const items = data.items;
    ok(`${items.length} itens carregados`);

    const dups = findDuplicateIds(items);
    if (dups.length) error('items.json', `IDs duplicados: ${dups.join(', ')}`);
    else ok('Nenhum ID duplicado');

    for (const item of items) {
        const ctx = `item:${item.id || '(sem id)'}`;
        if (!item.id) { error(ctx, 'Campo "id" ausente'); continue; }
        if (!item.name) error(ctx, 'Campo "name" ausente');

        // Itens com categoria "egg" têm validação própria
        if (item.category === 'egg') {
            if (typeof item.stackable !== 'boolean') error(ctx, 'Campo "stackable" ausente ou inválido para egg');
            if (!Array.isArray(item.effects)) error(ctx, 'Campo "effects" ausente para egg');
            continue;
        }

        // Outros itens devem ter tipo
        if (!item.type) {
            error(ctx, 'Campo "type" ausente');
            continue;
        }

        if (item.type === 'held') {
            if (!item.tier) error(ctx, 'Campo "tier" ausente para item held');
            if (!item.stats || typeof item.stats.atk !== 'number' || typeof item.stats.def !== 'number') {
                error(ctx, 'Campo "stats" inválido para item held');
            }
            if (!item.break || typeof item.break.enabled !== 'boolean' || typeof item.break.chance !== 'number') {
                error(ctx, 'Campo "break" inválido para item held');
            }
            if (item.break && (item.break.chance < 0 || item.break.chance > 1)) {
                error(ctx, `break.chance ${item.break.chance} fora do range [0-1]`);
            }
        } else if (item.type === 'heal') {
            if (typeof item.heal_pct !== 'number' || item.heal_pct < 0 || item.heal_pct > 1) {
                error(ctx, `heal_pct inválido: ${item.heal_pct}`);
            }
            if (typeof item.heal_min !== 'number' || item.heal_min < 0) {
                error(ctx, `heal_min inválido: ${item.heal_min}`);
            }
        } else if (item.type === 'capture') {
            if (typeof item.capture_bonus_pp !== 'number' || item.capture_bonus_pp < 0) {
                error(ctx, `capture_bonus_pp inválido: ${item.capture_bonus_pp}`);
            }
        }
    }
}

// ─── Validação: skills.json ──────────────────────────────────────────────────

function validateSkills(data) {
    console.log('\n⚔️  skills.json');

    if (!data?.skills || !Array.isArray(data.skills)) {
        error('skills.json', 'Campo "skills" ausente ou não é array');
        return;
    }

    const skills = data.skills;
    ok(`${skills.length} skills carregadas`);

    const dups = findDuplicateIds(skills);
    if (dups.length) error('skills.json', `IDs duplicados: ${dups.join(', ')}`);
    else ok('Nenhum ID duplicado');

    const classesFound = new Set();
    for (const s of skills) {
        const ctx = `skill:${s.id || '(sem id)'}`;
        if (!s.id) { error(ctx, 'Campo "id" ausente'); continue; }
        if (!s.name) error(ctx, 'Campo "name" ausente');
        if (!VALID_CLASSES.includes(s.class)) error(ctx, `Classe inválida: "${s.class}"`);
        else classesFound.add(s.class);
        if (s.power === undefined || s.power === null) error(ctx, 'Campo "power" ausente');
        if (s.energy_cost === undefined || s.energy_cost === null) error(ctx, 'Campo "energy_cost" ausente');
    }

    // Cobertura de classes
    const missingClasses = VALID_CLASSES.filter(c => !classesFound.has(c));
    if (missingClasses.length) error('skills.json', `Classes sem skills: ${missingClasses.join(', ')}`);
    else ok('Todas as classes têm ao menos uma skill');
}

// ─── Validação: worldMap.json ────────────────────────────────────────────────

function validateWorldMap(data, monsterIds) {
    console.log('\n🗺️  worldMap.json');

    if (!data?.nodes || !Array.isArray(data.nodes)) {
        error('worldMap.json', 'Campo "nodes" ausente ou não é array');
        return;
    }

    const nodes = data.nodes;
    ok(`${nodes.length} nós no mapa`);

    // IDs duplicados de nós
    const nodeIds = nodes.map(n => n.nodeId);
    const nodeDups = nodeIds.filter((id, i) => nodeIds.indexOf(id) !== i);
    if (nodeDups.length) error('worldMap.json', `nodeIds duplicados: ${nodeDups.join(', ')}`);
    else ok('Nenhum nodeId duplicado');

    let bossCount = 0;
    let bossWithLevel = 0;
    let invalidMonsterRefs = 0;

    for (const node of nodes) {
        const ctx = `node:${node.nodeId || '(sem id)'}`;

        if (!node.nodeId) { error(ctx, 'Campo "nodeId" ausente'); continue; }
        if (!node.type) error(ctx, 'Campo "type" ausente');

        // Verificar bossMeta
        if (node.bossMeta) {
            bossCount++;
            if (!node.bossMeta.bossLevel) {
                error(ctx, 'bossMeta sem "bossLevel"');
            } else {
                bossWithLevel++;
            }
        }

        // Verificar encounterPool com IDs de monstros válidos
        if (node.encounterPool && Array.isArray(node.encounterPool)) {
            for (const enc of node.encounterPool) {
                if (enc.monsterId && !monsterIds.has(enc.monsterId)) {
                    error(ctx, `monsterId inválido no encounterPool: "${enc.monsterId}"`);
                    invalidMonsterRefs++;
                }
            }
        }

        // Verificar connections (apenas alertas)
        if (node.connections) {
            for (const conn of node.connections) {
                if (!nodeIds.includes(conn)) {
                    warn(ctx, `connection aponta para nodeId inexistente: "${conn}"`);
                }
            }
        }
    }

    if (bossCount > 0) {
        ok(`${bossCount} boss(es) encontrados, ${bossWithLevel} com bossLevel`);
    }
    if (invalidMonsterRefs === 0) ok('Todas as referências de monstros em encounterPool são válidas');
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('🔍 Validação de Dados — Monstrinhomon');
console.log('='.repeat(50));

const monstersData = loadJSON('data/monsters.json');
const itemsData    = loadJSON('data/items.json');
const skillsData   = loadJSON('data/skills.json');
const worldMapData = loadJSON('data/worldMap.json');

const monsterIds = new Set(
    (monstersData?.monsters || []).map(m => m.id)
);

if (monstersData)  validateMonsters(monstersData);
if (itemsData)     validateItems(itemsData);
if (skillsData)    validateSkills(skillsData);
if (worldMapData)  validateWorldMap(worldMapData, monsterIds);

// ─── Resumo ──────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
    console.log('✅ Todos os dados válidos! Nenhum erro ou aviso encontrado.');
} else {
    if (errors > 0) console.error(`❌ ${errors} erro(s) encontrado(s)`);
    if (warnings > 0) console.warn(`⚠️  ${warnings} aviso(s) encontrado(s)`);
}

process.exit(errors > 0 ? 1 : 0);
