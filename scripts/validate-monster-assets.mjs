/**
 * validate-monster-assets.mjs — Validador de Assets Visuais dos Monstrinhos
 *
 * Verifica integridade dos assets declarados em data/monsters.json.
 *
 * Regras:
 *   - Se `image` estiver declarado, o arquivo DEVE existir → ERRO (exit 1)
 *   - Nome do arquivo deve ser exatamente `<id>.png` (sem espaços/aliases) → ERRO
 *   - Colisão de path (dois monstros apontando para o mesmo arquivo) → ERRO
 *   - Monstros sem `image` são permitidos (fallback por emoji)
 *
 * Uso: node scripts/validate-monster-assets.mjs
 *      npm run validate:monster-assets
 *
 * Códigos de saída:
 *   0 = todos os assets válidos
 *   1 = erro(s) encontrado(s)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

function error(ctx, msg) {
    console.error(`  ❌ [${ctx}] ${msg}`);
    errors++;
}

function warn(ctx, msg) {
    // Warnings são informativos apenas — não afetam o exit code.
    // Apenas erros (via error()) causam exit 1.
    console.warn(`  ⚠️  [${ctx}] ${msg}`);
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

console.log('🖼️  Validação de Assets — Monstrinhomon');
console.log('='.repeat(50));

const data = loadJSON('data/monsters.json');

if (!data?.monsters || !Array.isArray(data.monsters)) {
    error('monsters.json', 'Campo "monsters" ausente ou não é array');
    process.exit(1);
}

const monsters = data.monsters;
console.log(`\n📦 ${monsters.length} monstros carregados`);

const pathsSeen = new Map(); // path → id (detecção de colisão)
let withImage = 0;
let withoutImage = 0;

for (const m of monsters) {
    const ctx = `monster:${m.id || '(sem id)'}`;

    if (!m.image) {
        withoutImage++;
        continue; // Monstros sem image são permitidos (fallback emoji)
    }

    withImage++;
    const declaredPath = m.image;

    // Regra 1: nome do arquivo deve ser exatamente `<id>.png`
    const expectedFilename = `${m.id}.png`;
    const actualFilename = basename(declaredPath);
    if (actualFilename !== expectedFilename) {
        error(ctx, `Nome inválido: "${actualFilename}" (esperado: "${expectedFilename}")`);
    }

    // Regra 2: extensão deve ser .png
    if (extname(declaredPath).toLowerCase() !== '.png') {
        error(ctx, `Extensão inválida em "${declaredPath}" (esperado: .png)`);
    }

    // Regra 3: sem espaços no path
    if (declaredPath.includes(' ')) {
        error(ctx, `Path com espaço: "${declaredPath}"`);
    }

    // Regra 4: colisão de path
    if (pathsSeen.has(declaredPath)) {
        error(ctx, `Colisão de path: "${declaredPath}" já declarado por "${pathsSeen.get(declaredPath)}"`);
    } else {
        pathsSeen.set(declaredPath, m.id);
    }

    // Regra 5: arquivo deve existir → ERRO (não warning)
    const fullPath = resolve(ROOT, declaredPath);
    if (!existsSync(fullPath)) {
        error(ctx, `Asset declarado mas arquivo ausente: "${declaredPath}"`);
    }
}

console.log(`\n  📊 Com imagem declarada:  ${withImage}`);
console.log(`  📊 Sem imagem (emoji):    ${withoutImage}`);

// ─── Resumo ──────────────────────────────────────────────────────────────────

console.log('\n' + '='.repeat(50));
if (errors === 0 && warnings === 0) {
    console.log('✅ Todos os assets válidos! Nenhum erro ou aviso encontrado.');
} else {
    if (errors > 0) console.error(`❌ ${errors} erro(s) encontrado(s)`);
    if (warnings > 0) console.warn(`⚠️  ${warnings} aviso(s) encontrado(s)`);
}

process.exit(errors > 0 ? 1 : 0);
