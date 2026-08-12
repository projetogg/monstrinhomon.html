/**
 * Bootstrap inicial executado manualmente no editor do Apps Script.
 * O sufixo '_' impede exposição via google.script.run.
 */
function v2ConfigureAndBootstrap_(spreadsheetId, environment) {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('Não foi possível identificar o usuário Google ativo para bootstrap.');
  V2Backend.Config.setInitial(spreadsheetId, environment, 'main');
  const ss = SpreadsheetApp.openById(spreadsheetId);

  V2BackendSchema.listSheetSpecs().forEach(spec => {
    let sheet = ss.getSheetByName(spec.title);
    if (!sheet) sheet = ss.insertSheet(spec.title);
    const headers = spec.columns.map(c => c.name);
    const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0].map(String);
    const hasAny = current.some(v => v.trim() !== '');
    if (!hasAny) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    } else if (current.join('|') !== headers.join('|')) {
      throw new Error('SCHEMA_MISMATCH em ' + spec.title + '. Bootstrap não alterou dados.');
    }
  });

  const accessSheet = ss.getSheetByName(V2BackendSchema.SHEETS.ACCESS.title);
  const accessHeaders = V2BackendSchema.headersFor(V2BackendSchema.SHEETS.ACCESS.title);
  const accessRows = accessSheet.getLastRow() < 2 ? [] : accessSheet.getRange(2, 1, accessSheet.getLastRow() - 1, accessHeaders.length).getValues();
  const hasAdmin = accessRows.some(row => String(row[1] || '').trim().toLowerCase() === email && row[4] === 'ACTIVE');
  const now = new Date().toISOString();
  if (!hasAdmin) {
    accessSheet.appendRow([
      V2Backend.Id.newId(V2BackendSchema.ID_PREFIX.ACCESS), email, email.split('@')[0], 'ADMIN', 'ACTIVE',
      now, email, now, email, 1,
    ]);
  }

  const systemSheet = ss.getSheetByName(V2BackendSchema.SHEETS.SYSTEM.title);
  upsertBootstrapSystem_(systemSheet, 'SchemaVersion', V2BackendSchema.VERSION, email);
  upsertBootstrapSystem_(systemSheet, 'Environment', String(environment).toUpperCase(), email);
  upsertBootstrapSystem_(systemSheet, 'RuntimeBoundary', 'V2_OPERATIONAL_ONLY', email);
  upsertBootstrapSystem_(systemSheet, 'AuthMode', 'EXECUTE_AS_USER_ALLOWLIST', email);
  upsertBootstrapSystem_(systemSheet, 'TimeStorage', 'ISO_8601_UTC_STRING', email);

  return { ok: true, environment: String(environment).toUpperCase(), adminEmail: email, schemaVersion: V2BackendSchema.VERSION };
}

function upsertBootstrapSystem_(sheet, key, value, email) {
  const headers = V2BackendSchema.headersFor(V2BackendSchema.SHEETS.SYSTEM.title);
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]) === key) {
      sheet.getRange(i + 2, 1, 1, 4).setValues([[key, value, new Date().toISOString(), email]]);
      return;
    }
  }
  sheet.appendRow([key, value, new Date().toISOString(), email]);
}
