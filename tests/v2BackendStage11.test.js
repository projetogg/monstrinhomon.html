import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, '../apps-script/v2-backend');

function loadSchema() {
  const source = fs.readFileSync(path.join(backendDir, 'SchemaRegistry.gs'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\n;globalThis.__schema = V2BackendSchema;`, context);
  return context.__schema;
}

describe('V2 Backend Stage 11', () => {
  it('mantém exatamente as 15 tabelas físicas da fundação', () => {
    const schema = loadSchema();
    const specs = schema.listSheetSpecs();
    expect(specs).toHaveLength(15);
    expect(new Set(specs.map(s => s.title)).size).toBe(15);
    expect(specs.map(s => s.title)).toEqual([
      '00_SYSTEM', '01_ACCESS', '02_PLAYERS', '03_ATTRIBUTE_DEFINITIONS', '04_PLAYER_ATTRIBUTES',
      '05_MONSTER_INSTANCES', '06_INVENTORY_HOLDINGS', '07_OBJECTIVES', '08_OBJECTIVE_VERSIONS',
      '09_SESSIONS', '10_OBSERVATIONS', '11_EVENTS', '12_OPERATIONS', '13_RUNTIME_CACHE', '14_SCHEMA_MIGRATIONS',
    ]);
  });

  it('preserva entidades históricas como imutáveis/append-only onde exigido', () => {
    const S = loadSchema().SHEETS;
    expect(S.OBJECTIVE_VERSIONS.immutable).toBe(true);
    expect(S.OBSERVATIONS.immutable).toBe(true);
    expect(S.EVENTS.immutable).toBe(true);
    expect(S.EVENTS.appendOnly).toBe(true);
    expect(S.SCHEMA_MIGRATIONS.appendOnly).toBe(true);
  });

  it('preserva chaves lógicas críticas', () => {
    const S = loadSchema().SHEETS;
    expect(S.PLAYER_ATTRIBUTES.logicalUnique).toEqual([['PlayerID', 'AttributeID']]);
    expect(S.INVENTORY_HOLDINGS.logicalUnique).toEqual([['PlayerID', 'ItemID']]);
    expect(S.OBJECTIVE_VERSIONS.logicalUnique).toEqual([['ObjectiveID', 'RevisionNumber']]);
    expect(S.OBSERVATIONS.logicalUnique).toEqual([['ObservationChainID', 'RevisionNumber']]);
    expect(S.SESSIONS.invariants).toContain('MAX_ONE_EDITABLE_SESSION_PER_PLAYER');
  });

  it('mantém o MVP terapêutico limitado aos cinco tipos de medida aprovados', () => {
    const E = loadSchema().ENUMS;
    expect(E.MEASUREMENT_TYPES).toEqual(['OPPORTUNITY_RATIO', 'COUNT', 'DURATION', 'LATENCY', 'BINARY']);
    expect(E.REWARD_TYPES).toEqual(['ATTRIBUTE', 'MONEY', 'ITEM']);
  });

  it('não promove Level/XP para autoridade do backend de MonsterInstance nesta etapa', () => {
    const cols = loadSchema().SHEETS.MONSTER_INSTANCES.columns.map(c => c.name);
    expect(cols).not.toContain('Level');
    expect(cols).not.toContain('XP');
    expect(cols).toContain('CurrentTemplateID');
    expect(cols).toContain('RuntimeInstanceRef');
  });

  it('todos os arquivos .gs compilam como JavaScript e não acessam o save local do runtime', () => {
    const files = fs.readdirSync(backendDir).filter(name => name.endsWith('.gs'));
    expect(files.length).toBeGreaterThanOrEqual(5);
    for (const name of files) {
      const source = fs.readFileSync(path.join(backendDir, name), 'utf8');
      expect(() => new vm.Script(source, { filename: name })).not.toThrow();
      expect(source).not.toMatch(/monstrinhomon_state/);
      expect(source).not.toMatch(/StorageManager\.(saveState|loadState|saveSlot)/);
    }
  });
});
