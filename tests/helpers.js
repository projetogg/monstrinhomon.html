/**
 * TEST HELPERS - Utilitários compartilhados entre testes de integridade
 *
 * Funções auxiliares para carregar dados e parsear CSVs nos testes.
 * Usado por: questsIntegrity.test.js, dropsIntegrity.test.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// ── Parsers ────────────────────────────────────────────────────────────────

/**
 * Parseia um arquivo CSV retornando array de objetos com as colunas como chaves.
 * Suporta aspas duplas para campos com vírgulas.
 *
 * @param {string} filename - Caminho relativo ao cwd (ex: 'QUESTS.csv')
 * @returns {Object[]} - Array de linhas como objetos
 */
export function parseCSV(filename) {
    const raw = readFileSync(join(process.cwd(), filename), 'utf-8');
    const lines = raw.trim().split('\n');
    const header = lines[0].split(',');

    function splitLine(line) {
        const cols = [];
        let current = '';
        let inQuotes = false;
        for (const ch of line) {
            if (ch === '"') { inQuotes = !inQuotes; }
            else if (ch === ',' && !inQuotes) { cols.push(current); current = ''; }
            else { current += ch; }
        }
        cols.push(current);
        return cols;
    }

    return lines.slice(1).filter(l => l.trim()).map(line => {
        const cols = splitLine(line);
        const obj = {};
        header.forEach((h, i) => { obj[h.trim()] = (cols[i] || '').trim(); });
        return obj;
    });
}

// ── Loaders ────────────────────────────────────────────────────────────────

/** Carrega e retorna data/monsters.json */
export function loadMonstersJson() {
    const raw = readFileSync(join(process.cwd(), 'data/monsters.json'), 'utf-8');
    return JSON.parse(raw);
}

/** Carrega e retorna data/locations.json */
export function loadLocationsJson() {
    const raw = readFileSync(join(process.cwd(), 'data/locations.json'), 'utf-8');
    return JSON.parse(raw);
}

/** Carrega e retorna data/items.json */
export function loadItemsJson() {
    const raw = readFileSync(join(process.cwd(), 'data/items.json'), 'utf-8');
    return JSON.parse(raw);
}

// ── Conjuntos de IDs válidos ───────────────────────────────────────────────

/**
 * Retorna conjunto de IDs de itens válidos.
 * Inclui itens de data/items.json + CLASTERORB_* + IDs legados (IT_CAP_*).
 *
 * @returns {Set<string>}
 */
export function buildValidItemIds() {
    const items = loadItemsJson();
    const set = new Set(items.items.map(i => i.id));
    // Itens do sistema de drops (CLASTERORB_*)
    set.add('CLASTERORB_COMUM');
    set.add('CLASTERORB_INCOMUM');
    set.add('CLASTERORB_RARA');
    // IDs legados com mapeamento definido em dropSystem.js
    set.add('IT_CAP_01');
    set.add('IT_CAP_02');
    return set;
}
