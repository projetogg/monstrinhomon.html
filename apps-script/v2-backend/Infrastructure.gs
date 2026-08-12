/** Infraestrutura compartilhada do backend V2. */
const V2Backend = (() => {
  'use strict';

  class BackendError extends Error {
    constructor(code, message, details) {
      super(message);
      this.name = 'BackendError';
      this.code = code || 'BACKEND_ERROR';
      this.details = details || null;
    }
  }

  const Time = Object.freeze({
    nowUtcIso() { return new Date().toISOString(); },
    assertIsoUtc(value, field) {
      if (value == null || value === '') return;
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
        throw new BackendError('VALIDATION_ERROR', (field || 'timestamp') + ' deve ser ISO-8601 UTC.');
      }
    },
  });

  const Config = Object.freeze({
    keys: Object.freeze({
      SPREADSHEET_ID: 'V2_BACKEND_SPREADSHEET_ID',
      ENVIRONMENT: 'V2_ENVIRONMENT',
      RUNTIME_SOURCE_REF: 'V2_RUNTIME_SOURCE_REF',
    }),
    getAll() {
      const props = PropertiesService.getScriptProperties();
      return {
        spreadsheetId: props.getProperty(this.keys.SPREADSHEET_ID) || '',
        environment: (props.getProperty(this.keys.ENVIRONMENT) || '').toUpperCase(),
        runtimeSourceRef: props.getProperty(this.keys.RUNTIME_SOURCE_REF) || 'main',
      };
    },
    require() {
      const cfg = this.getAll();
      if (!cfg.spreadsheetId) throw new BackendError('BACKEND_UNAVAILABLE', 'V2_BACKEND_SPREADSHEET_ID não configurado.');
      if (!['DEV', 'PROD'].includes(cfg.environment)) throw new BackendError('BACKEND_UNAVAILABLE', 'V2_ENVIRONMENT deve ser DEV ou PROD.');
      return cfg;
    },
    setInitial(spreadsheetId, environment, runtimeSourceRef) {
      const env = String(environment || '').toUpperCase();
      if (!spreadsheetId) throw new BackendError('VALIDATION_ERROR', 'Spreadsheet ID obrigatório.');
      if (!['DEV', 'PROD'].includes(env)) throw new BackendError('VALIDATION_ERROR', 'Ambiente deve ser DEV ou PROD.');
      PropertiesService.getScriptProperties().setProperties({
        [this.keys.SPREADSHEET_ID]: String(spreadsheetId),
        [this.keys.ENVIRONMENT]: env,
        [this.keys.RUNTIME_SOURCE_REF]: String(runtimeSourceRef || 'main'),
      });
      return this.getAll();
    },
  });

  const Id = Object.freeze({
    newId(prefix) {
      const p = String(prefix || '').trim();
      if (!p) throw new BackendError('VALIDATION_ERROR', 'Prefixo de ID obrigatório.');
      return p + Utilities.getUuid().replace(/-/g, '').toLowerCase();
    },
  });

  const Hash = Object.freeze({
    sha256Hex(value) {
      const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
      return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16).padStart(2, '0'))).join('');
    },
  });

  const Json = Object.freeze({
    parse(value, field) {
      if (value == null || value === '') return null;
      if (typeof value === 'object') return value;
      try { return JSON.parse(String(value)); }
      catch (err) { throw new BackendError('VALIDATION_ERROR', (field || 'JSON') + ' inválido.'); }
    },
    stringify(value) {
      if (value == null) return '';
      return JSON.stringify(value);
    },
  });

  const Lock = Object.freeze({
    withWriteLock(fn, timeoutMs) {
      const lock = LockService.getScriptLock();
      const timeout = Number(timeoutMs || 10000);
      if (!lock.tryLock(timeout)) throw new BackendError('CONFLICT', 'Backend ocupado por outra gravação. Tente novamente.');
      try { return fn(); }
      finally { lock.releaseLock(); }
    },
  });

  const ErrorModel = Object.freeze({
    ok(data) { return { ok: true, data: data == null ? null : data }; },
    fail(err) {
      const e = err instanceof BackendError ? err : new BackendError('INTERNAL_ERROR', 'Erro interno do backend.');
      console.error('[V2Backend]', e.code, e.message);
      return { ok: false, error: { code: e.code, message: e.message, details: e.details || undefined } };
    },
  });

  const SheetGateway = Object.freeze({
    open() {
      const cfg = Config.require();
      return SpreadsheetApp.openById(cfg.spreadsheetId);
    },
    sheet(title) {
      const sheet = this.open().getSheetByName(title);
      if (!sheet) throw new BackendError('SCHEMA_MISMATCH', 'Aba ausente: ' + title);
      return sheet;
    },
    headers(title) {
      return V2BackendSchema.headersFor(title);
    },
    readAll(title) {
      const sheet = this.sheet(title);
      const headers = this.headers(title);
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return [];
      const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
      return values.filter(row => row.some(v => v !== '' && v != null)).map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = normalizeCell(row[i]); });
        return obj;
      });
    },
    append(title, obj) {
      const sheet = this.sheet(title);
      const headers = this.headers(title);
      const row = headers.map(h => serializeCell(obj[h]));
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length).setValues([row]);
      return obj;
    },
    replaceRow(title, rowNumber, obj) {
      const sheet = this.sheet(title);
      const headers = this.headers(title);
      const row = headers.map(h => serializeCell(obj[h]));
      sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row]);
      return obj;
    },
    find(title, predicate) {
      return this.readAll(title).filter(predicate);
    },
    findOne(title, predicate) {
      return this.readAll(title).find(predicate) || null;
    },
    locateByPrimaryKey(title, id) {
      const spec = V2BackendSchema.getSheetSpecByTitle(title);
      if (!spec || !spec.primaryKey) throw new BackendError('VALIDATION_ERROR', 'Aba sem PK simples: ' + title);
      const sheet = this.sheet(title);
      const headers = this.headers(title);
      const keyIndex = headers.indexOf(spec.primaryKey);
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) return null;
      const values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
      for (let i = 0; i < values.length; i++) {
        if (String(values[i][keyIndex]) === String(id)) {
          const obj = {};
          headers.forEach((h, j) => { obj[h] = normalizeCell(values[i][j]); });
          return { rowNumber: i + 2, value: obj };
        }
      }
      return null;
    },
    validateHeaders() {
      const problems = [];
      V2BackendSchema.listSheetSpecs().forEach(spec => {
        const sheet = this.open().getSheetByName(spec.title);
        if (!sheet) { problems.push({ code: 'MISSING_SHEET', sheet: spec.title }); return; }
        const expected = spec.columns.map(c => c.name);
        const actual = sheet.getRange(1, 1, 1, expected.length).getValues()[0].map(String);
        if (expected.join('|') !== actual.join('|')) problems.push({ code: 'HEADER_MISMATCH', sheet: spec.title, expected, actual });
      });
      return problems;
    },
  });

  function normalizeCell(value) {
    if (value === '') return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  }
  function serializeCell(value) {
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
  }

  const Repository = Object.freeze({
    getById(title, id) {
      const found = SheetGateway.locateByPrimaryKey(title, id);
      return found ? found.value : null;
    },
    requireById(title, id) {
      const row = this.getById(title, id);
      if (!row) throw new BackendError('NOT_FOUND', title + ': registro não encontrado.');
      return row;
    },
    insert(title, obj) {
      const spec = V2BackendSchema.getSheetSpecByTitle(title);
      if (spec.primaryKey && obj[spec.primaryKey]) {
        if (this.getById(title, obj[spec.primaryKey])) throw new BackendError('DUPLICATE', spec.primaryKey + ' duplicado.');
      }
      assertLogicalUnique(title, obj, spec);
      return SheetGateway.append(title, obj);
    },
    updateVersioned(title, id, expectedVersion, patch, actorEmail) {
      const spec = V2BackendSchema.getSheetSpecByTitle(title);
      if (!spec || spec.immutable || spec.appendOnly) throw new BackendError('FORBIDDEN', 'Entidade imutável/append-only: ' + title);
      const found = SheetGateway.locateByPrimaryKey(title, id);
      if (!found) throw new BackendError('NOT_FOUND', 'Registro não encontrado.');
      const current = found.value;
      if (Number(current.Version) !== Number(expectedVersion)) throw new BackendError('CONFLICT', 'Versão desatualizada.', { currentVersion: current.Version });
      const next = Object.assign({}, current, patch || {}, { UpdatedAt: Time.nowUtcIso(), UpdatedBy: actorEmail, Version: Number(current.Version) + 1 });
      SheetGateway.replaceRow(title, found.rowNumber, next);
      return next;
    },
    listByField(title, field, value) { return SheetGateway.find(title, row => String(row[field]) === String(value)); },
  });

  function assertLogicalUnique(title, obj, spec) {
    (spec.logicalUnique || []).forEach(fields => {
      const duplicate = SheetGateway.findOne(title, row => fields.every(f => String(row[f]) === String(obj[f])));
      if (duplicate) throw new BackendError('DUPLICATE', 'Chave lógica duplicada em ' + title + ': ' + fields.join('+'));
    });
  }

  return Object.freeze({ BackendError, Time, Config, Id, Hash, Json, Lock, ErrorModel, SheetGateway, Repository });
})();
