/**
 * validate-monster-assets.mjs — Validação de Assets Visuais de Monstrinhos
 *
 * Verifica a consistência entre campos `image` em data/monsters.json
 * e os arquivos físicos em assets/monsters/.
 *
 * Comportamento durante a transição (antes dos PNGs existirem):
 *  - campo `image` declarado sem arquivo físico → AVISO (⚠️), não erro fatal
 *  - colisão de paths (dois monstros apontando para o mesmo arquivo) → ERRO
 *  - path com formato inválido (não começa com assets/monsters/) → ERRO
 *  - assets órfãos (arquivo sem entrada no catálogo) → AVISO
 *
 * Códigos de saída:
 *   0 = validação passou (pode haver avisos)
 *   1 = erros críticos encontrados
 *
 * Uso:
 *   node scripts/validate-monster-assets.mjs
 *   npm run validate:monster-assets
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ─── Constantes ──────────────────────────────────────────────────────────────

const MONSTERS_JSON = resolve(ROOT, 'data/monsters.json');
const ASSETS_DIR = resolve(ROOT, 'assets/monsters');
const EXPECTED_PATH_PREFIX = 'assets/monsters/';
const EXPECTED_PATH_PATTERN = /^assets\/monsters\/MON_[A-Z0-9]+\.png$/;

// ─── Contadores ───────────────────────────────────────────────────────────────

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

function info(msg) {
    console.log(`  ℹ️  ${msg}`);
}

// ─── Carga do catálogo ───────────────────────────────────────────────────────

function loadMonsters() {
    if (!existsSync(MONSTERS_JSON)) {
        error('IO', `Arquivo não encontrado: ${MONSTERS_JSON}`);
        return null;
    }
    try {
        const data = JSON.parse(readFileSync(MONSTERS_JSON, 'utf8'));
        if (!Array.isArray(data.monsters)) {
            error('Schema', 'data/monsters.json deve ter campo "monsters" como array');
            return null;
        }
        return data.monsters;
    } catch (e) {
        error('IO', `Falha ao carregar monsters.json: ${e.message}`);
        return null;
    }
}

// ─── Leitura de assets físicos ───────────────────────────────────────────────

function listPhysicalAssets() {
    if (!existsSync(ASSETS_DIR)) {
        info(`Diretório ${ASSETS_DIR} não existe ainda (normal antes dos PNGs serem entregues)`);
        return new Set();
    }
    const files = readdirSync(ASSETS_DIR)
        .filter(f => f !== '.gitkeep' && f.endsWith('.png'));
    return new Set(files);
}

// ─── Validações ──────────────────────────────────────────────────────────────

function validateImageFields(monsters) {
    const monstersWithImage = monsters.filter(m => m.image !== undefined);

    if (monstersWithImage.length === 0) {
        info('Nenhum monstrinho tem campo "image" declarado');
        return { monstersWithImage: [], pathMap: new Map() };
    }

    ok(`${monstersWithImage.length} monstrinhos com campo "image" encontrados`);

    const pathMap = new Map(); // path → [monsterIds]

    for (const m of monstersWithImage) {
        // Validar tipo
        if (typeof m.image !== 'string' || m.image.trim() === '') {
            error('Schema', `${m.id}: campo "image" deve ser string não-vazia (encontrado: ${JSON.stringify(m.image)})`);
            continue;
        }

        const imagePath = m.image.trim();

        // Validar formato do path
        if (!EXPECTED_PATH_PATTERN.test(imagePath)) {
            error('Convenção', `${m.id}: path inválido "${imagePath}" — esperado formato "assets/monsters/MON_XXX.png"`);
        }

        // Registrar para detecção de colisões
        if (!pathMap.has(imagePath)) {
            pathMap.set(imagePath, []);
        }
        pathMap.get(imagePath).push(m.id);
    }

    return { monstersWithImage, pathMap };
}

function validateNoDuplicatePaths(pathMap) {
    let hasDuplicates = false;
    for (const [path, ids] of pathMap) {
        if (ids.length > 1) {
            error('Colisão', `Path "${path}" usado por múltiplos monstrinhos: ${ids.join(', ')}`);
            hasDuplicates = true;
        }
    }
    if (!hasDuplicates && pathMap.size > 0) {
        ok(`Nenhuma colisão de path detectada (${pathMap.size} paths únicos)`);
    }
}

function validatePhysicalFiles(monstersWithImage, physicalAssets) {
    let missingCount = 0;
    let presentCount = 0;

    for (const m of monstersWithImage) {
        if (!m.image || typeof m.image !== 'string') continue;

        const filename = basename(m.image.trim());

        if (physicalAssets.has(filename)) {
            presentCount++;
        } else {
            warn(
                'Asset Ausente',
                `${m.id} (${m.name}): "${m.image}" declarado mas arquivo físico não encontrado — normal antes da entrega dos PNGs`
            );
            missingCount++;
        }
    }

    if (presentCount > 0) {
        ok(`${presentCount} asset(s) físico(s) presente(s) e declarados no catálogo`);
    }
    if (missingCount > 0) {
        info(`${missingCount} asset(s) ainda não entregues (apenas avisos — não falha CI nesta fase)`);
    }
}

function validateOrphanAssets(pathMap, physicalAssets) {
    // Conjunto de filenames esperados pelo catálogo
    const expectedFilenames = new Set();
    for (const path of pathMap.keys()) {
        expectedFilenames.add(basename(path));
    }

    let orphanCount = 0;
    for (const file of physicalAssets) {
        if (!expectedFilenames.has(file)) {
            warn('Órfão', `Asset "${file}" encontrado em assets/monsters/ sem entrada no catálogo`);
            orphanCount++;
        }
    }

    if (orphanCount === 0 && physicalAssets.size > 0) {
        ok('Nenhum asset órfão encontrado');
    }
}

function validateAssetFilenameConvention(physicalAssets) {
    for (const file of physicalAssets) {
        const expectedPattern = /^MON_[A-Z0-9]+\.png$/;
        if (!expectedPattern.test(file)) {
            error('Convenção', `Asset "${file}" não segue convenção MON_XXX.png`);
        }
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('\n🔍 Validando assets visuais de monstrinhos...\n');

const monsters = loadMonsters();

if (monsters) {
    const physicalAssets = listPhysicalAssets();

    info(`${monsters.length} monstrinhos no catálogo`);
    info(`${physicalAssets.size} arquivo(s) físico(s) em assets/monsters/`);
    console.log('');

    // 1. Validar campos image no catálogo
    const { monstersWithImage, pathMap } = validateImageFields(monsters);

    // 2. Detectar colisões de path
    validateNoDuplicatePaths(pathMap);

    // 3. Verificar arquivos físicos vs declarados
    validatePhysicalFiles(monstersWithImage, physicalAssets);

    // 4. Detectar assets órfãos
    validateOrphanAssets(pathMap, physicalAssets);

    // 5. Verificar convenção dos assets físicos
    validateAssetFilenameConvention(physicalAssets);
}

// ─── Resultado ───────────────────────────────────────────────────────────────

console.log('');
console.log('─'.repeat(60));

if (errors > 0) {
    console.error(`\n💥 Validação FALHOU: ${errors} erro(s), ${warnings} aviso(s)\n`);
    process.exit(1);
} else if (warnings > 0) {
    console.log(`\n✅ Validação passou com ${warnings} aviso(s) (não críticos)\n`);
    process.exit(0);
} else {
    console.log('\n✅ Validação passou sem erros nem avisos\n');
    process.exit(0);
}
