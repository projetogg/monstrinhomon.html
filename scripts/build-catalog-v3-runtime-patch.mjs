import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  toCatalogV3RuntimeId,
  isCatalogV3BlockedCanonicalId,
  CATALOG_V3_RUNTIME_NAMESPACE_VERSION,
  CATALOG_V3_RUNTIME_RENAMES,
} from '../js/data/catalogV3RuntimeResolution.js';

const CSV_PATH = join(process.cwd(), 'docs', 'catalog_v3', 'monstrinhomon_status_oficial.csv');
const OFFICIAL_JSON_PATH = join(process.cwd(), 'docs', 'catalog_v3', 'monstrinhomon_status_oficial.json');
const RUNTIME_PATCH_PATH = join(process.cwd(), 'docs', 'catalog_v3', 'monstrinhomon_status_runtime_patch.json');

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  out.push(current);
  return out;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(Boolean);

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (cols[index] || '').trim();
    });
    return row;
  });
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeOfficialRow(row) {
  return {
    id: row.id,
    name: row.name,
    class: row.class,
    raridade: row.raridade,
    estagio: row.estagio,
    familia_evolutiva: row.familia_evolutiva,
    hp: toNumber(row.hp),
    atk: toNumber(row.atk),
    def: toNumber(row.def),
    ene: toNumber(row.ene),
    agi: toNumber(row.agi),
    papel_tatico: row.papel_tatico,
    origem_decisao: row.origem_decisao,
    status_confianca: row.status_confianca,
    justificativa_curta: row.justificativa_curta,
    observacoes: row.observacoes,
  };
}

function inferNamingStatus(observacoes) {
  return /Nome provisório/i.test(observacoes || '') ? 'provisional' : 'confirmed';
}

function sortByStage(rows) {
  const order = { Base: 0, Evo1: 1, Evo2: 2, Evo3: 3, Solo: 9 };
  return [...rows].sort((a, b) => (order[a.estagio] ?? 99) - (order[b.estagio] ?? 99));
}

function attachEvolutionHints(runtimeRows) {
  const groups = new Map();

  for (const row of runtimeRows) {
    const family = row.catalogV3.familyId;
    if (!groups.has(family)) groups.set(family, []);
    groups.get(family).push(row);
  }

  for (const rows of groups.values()) {
    const ordered = sortByStage(rows);
    for (let i = 0; i < ordered.length; i++) {
      const current = ordered[i];
      const next = ordered[i + 1] || null;
      current.catalogV3.proposedEvolvesTo = next ? next.id : null;
      current.catalogV3.proposedEvolutionStage = current.estagio;
    }
  }
}

function buildRuntimeRow(official) {
  const canonId = official.id;
  const runtimeId = toCatalogV3RuntimeId(canonId);
  const blocked = isCatalogV3BlockedCanonicalId(canonId);

  return {
    id: runtimeId,
    canonId,
    name: official.name,
    class: official.class,
    rarity: official.raridade,
    baseHp: official.hp,
    baseAtk: official.atk,
    baseDef: official.def,
    baseSpd: official.agi,
    baseEne: official.ene,
    runtimeEnabled: !blocked,
    ...(blocked ? { blockReason: 'no_art' } : {}),
    namingStatus: inferNamingStatus(official.observacoes),
    catalogV3: {
      namespaceVersion: CATALOG_V3_RUNTIME_NAMESPACE_VERSION,
      canonId,
      familyId: official.familia_evolutiva,
      stage: official.estagio,
      role: official.papel_tatico,
      sourceOrigin: official.origem_decisao,
      confidence: official.status_confianca,
      note: official.observacoes,
      importBlocked: blocked,
    },
  };
}

function main() {
  const csvText = readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCsv(csvText);

  const official = rows.map(normalizeOfficialRow);
  const runtimeRows = official.map(buildRuntimeRow);
  attachEvolutionHints(runtimeRows);

  const officialJson = {
    version: 1,
    generatedFrom: 'docs/catalog_v3/monstrinhomon_status_oficial.csv',
    monsters: official,
  };

  const runtimePatch = {
    version: 1,
    namespaceVersion: CATALOG_V3_RUNTIME_NAMESPACE_VERSION,
    generatedFrom: 'docs/catalog_v3/monstrinhomon_status_oficial.csv',
    runtimeRenamePlan: CATALOG_V3_RUNTIME_RENAMES,
    monsters: runtimeRows,
  };

  mkdirSync(dirname(OFFICIAL_JSON_PATH), { recursive: true });
  writeFileSync(OFFICIAL_JSON_PATH, JSON.stringify(officialJson, null, 2));
  writeFileSync(RUNTIME_PATCH_PATH, JSON.stringify(runtimePatch, null, 2));

  console.log(`Generated ${OFFICIAL_JSON_PATH}`);
  console.log(`Generated ${RUNTIME_PATCH_PATH}`);
}

main();
