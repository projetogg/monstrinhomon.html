/** Cache reconstruível de referências runtime. Não é fonte canônica. */
const V2RuntimeReferenceService = (() => {
  'use strict';
  const B = V2Backend;
  const S = V2BackendSchema.SHEETS;
  const RAW_BASE = 'https://raw.githubusercontent.com/projetogg/monstrinhomon.html/';

  function refreshJsonArray(domain, sourcePath, sourceRef) {
    const actor = V2Services.AuthService.requireAdmin();
    const d = required(domain, 'domain').toUpperCase();
    const path = required(sourcePath, 'sourcePath').replace(/^\/+/, '');
    const ref = required(sourceRef || B.Config.require().runtimeSourceRef || 'main', 'sourceRef');
    const url = RAW_BASE + encodeURIComponent(ref) + '/' + path.split('/').map(encodeURIComponent).join('/');
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (response.getResponseCode() !== 200) throw new B.BackendError('BACKEND_UNAVAILABLE', 'Falha ao buscar fonte runtime.', { responseCode: response.getResponseCode(), sourcePath: path, sourceRef: ref });
    let payload;
    try { payload = JSON.parse(response.getContentText()); }
    catch (err) { throw new B.BackendError('VALIDATION_ERROR', 'Fonte runtime não contém JSON válido.'); }
    if (!Array.isArray(payload)) throw new B.BackendError('VALIDATION_ERROR', 'refreshJsonArray exige JSON raiz em array.');

    const fetchedAt = B.Time.nowUtcIso();
    const entries = payload.map(item => {
      if (!item || item.id == null || item.id === '') throw new B.BackendError('VALIDATION_ERROR', 'Registro runtime sem id em ' + path);
      const json = JSON.stringify(item);
      return {
        CacheKey: d + ':' + String(item.id), Domain: d, CanonicalID: String(item.id), SourcePath: path,
        SourceRef: ref, PayloadHash: B.Hash.sha256Hex(json), PayloadJSON: json, FetchedAt: fetchedAt,
      };
    });

    return B.Lock.withWriteLock(() => {
      const other = B.SheetGateway.readAll(S.RUNTIME_CACHE.title).filter(row => row.Domain !== d);
      const merged = other.concat(entries);
      const sheet = B.SheetGateway.sheet(S.RUNTIME_CACHE.title);
      const headers = B.SheetGateway.headers(S.RUNTIME_CACHE.title);
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
      if (merged.length) {
        const rows = merged.map(row => headers.map(h => row[h] == null ? '' : row[h]));
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
      console.log('[V2RuntimeCache] atualizado', d, entries.length, 'registros por', actor.email, 'ref', ref);
      return { domain: d, count: entries.length, sourcePath: path, sourceRef: ref, fetchedAt };
    });
  }

  function listDomain(domain) {
    V2Services.AuthService.requireTherapist();
    const d = required(domain, 'domain').toUpperCase();
    return B.SheetGateway.readAll(S.RUNTIME_CACHE.title).filter(row => row.Domain === d).map(row => ({
      canonicalId: row.CanonicalID, sourcePath: row.SourcePath, sourceRef: row.SourceRef, payloadHash: row.PayloadHash,
      payload: B.Json.parse(row.PayloadJSON, 'RuntimeCache.PayloadJSON'), fetchedAt: row.FetchedAt,
    }));
  }

  function required(value, field) {
    const s = String(value == null ? '' : value).trim();
    if (!s) throw new B.BackendError('VALIDATION_ERROR', field + ' obrigatório.');
    return s;
  }

  return Object.freeze({ refreshJsonArray, listDomain });
})();
