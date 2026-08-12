/** Ferramentas administrativas e de integridade da Etapa 11. */
const V2BackendAdmin = (() => {
  'use strict';
  const B = V2Backend;
  const S = V2BackendSchema.SHEETS;

  function initializeBackend() {
    const actor = V2Services.AuthService.requireAdmin();
    const ss = B.SheetGateway.open();
    const result = { createdSheets: [], existingSheets: [], schemaVersion: V2BackendSchema.VERSION };
    V2BackendSchema.listSheetSpecs().forEach(spec => {
      let sheet = ss.getSheetByName(spec.title);
      if (!sheet) {
        sheet = ss.insertSheet(spec.title);
        result.createdSheets.push(spec.title);
      } else result.existingSheets.push(spec.title);
      const expected = spec.columns.map(c => c.name);
      const current = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, Math.max(expected.length, sheet.getLastColumn())).getValues()[0] : [];
      const hasAny = current.some(v => String(v || '').trim() !== '');
      if (!hasAny) {
        sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
        sheet.setFrozenRows(1);
      } else {
        const actual = current.slice(0, expected.length).map(String);
        if (actual.join('|') !== expected.join('|')) throw new B.BackendError('SCHEMA_MISMATCH', 'Headers divergentes em ' + spec.title);
      }
    });
    upsertSystemValue('SchemaVersion', V2BackendSchema.VERSION, actor.email);
    upsertSystemValue('Environment', B.Config.require().environment, actor.email);
    upsertSystemValue('RuntimeBoundary', 'V2_OPERATIONAL_ONLY', actor.email);
    upsertSystemValue('AuthMode', 'EXECUTE_AS_USER_ALLOWLIST', actor.email);
    return result;
  }

  function healthCheck() {
    const user = V2Services.AuthService.requireTherapist();
    const cfg = B.Config.require();
    const problems = B.SheetGateway.validateHeaders();
    const system = B.SheetGateway.readAll(S.SYSTEM.title);
    const schemaRow = system.find(r => r.Key === 'SchemaVersion');
    if (!schemaRow || schemaRow.Value !== V2BackendSchema.VERSION) problems.push({ code: 'VERSION_MISMATCH', expected: V2BackendSchema.VERSION, actual: schemaRow && schemaRow.Value });
    return { ok: problems.length === 0, environment: cfg.environment, actor: user.email, schemaVersion: V2BackendSchema.VERSION, problems };
  }

  function integrityCheck() {
    V2Services.AuthService.requireAdmin();
    const issues = [];
    const players = indexBy(B.SheetGateway.readAll(S.PLAYERS.title), 'PlayerID');
    const objectives = indexBy(B.SheetGateway.readAll(S.OBJECTIVES.title), 'ObjectiveID');
    const versions = indexBy(B.SheetGateway.readAll(S.OBJECTIVE_VERSIONS.title), 'ObjectiveVersionID');
    const sessions = B.SheetGateway.readAll(S.SESSIONS.title);
    const monsters = B.SheetGateway.readAll(S.MONSTER_INSTANCES.title);
    const holdings = B.SheetGateway.readAll(S.INVENTORY_HOLDINGS.title);
    const attrs = B.SheetGateway.readAll(S.PLAYER_ATTRIBUTES.title);
    const obs = B.SheetGateway.readAll(S.OBSERVATIONS.title);
    const events = B.SheetGateway.readAll(S.EVENTS.title);

    detectDuplicate(S.PLAYERS.title, Object.values(players).map(x => x.PlayerID), issues);
    detectCompositeDuplicate(S.PLAYER_ATTRIBUTES.title, attrs, r => r.PlayerID + '|' + r.AttributeID, issues);
    detectCompositeDuplicate(S.INVENTORY_HOLDINGS.title, holdings, r => r.PlayerID + '|' + r.ItemID, issues);

    holdings.forEach(r => {
      if (!players[r.PlayerID]) issues.push(issue('ORPHAN_PLAYER', S.INVENTORY_HOLDINGS.title, r.PlayerID));
      if (Number(r.Quantity) < 0) issues.push(issue('NEGATIVE_QUANTITY', S.INVENTORY_HOLDINGS.title, r.PlayerID + ':' + r.ItemID));
    });
    attrs.forEach(r => { if (!players[r.PlayerID]) issues.push(issue('ORPHAN_PLAYER', S.PLAYER_ATTRIBUTES.title, r.PlayerID)); });
    monsters.forEach(r => {
      if (!players[r.PlayerID]) issues.push(issue('ORPHAN_PLAYER', S.MONSTER_INSTANCES.title, r.MonsterInstanceID));
      if (r.Location === 'TEAM' && (r.TeamSlot == null || r.TeamSlot === '')) issues.push(issue('TEAM_SLOT_MISSING', S.MONSTER_INSTANCES.title, r.MonsterInstanceID));
      if (r.Location !== 'TEAM' && r.TeamSlot != null && r.TeamSlot !== '') issues.push(issue('TEAM_SLOT_OUTSIDE_TEAM', S.MONSTER_INSTANCES.title, r.MonsterInstanceID));
    });
    Object.values(players).forEach(p => {
      if (p.FeaturedMonsterInstanceID) {
        const m = monsters.find(x => x.MonsterInstanceID === p.FeaturedMonsterInstanceID);
        if (!m || m.PlayerID !== p.PlayerID) issues.push(issue('INVALID_FEATURED_MONSTER', S.PLAYERS.title, p.PlayerID));
      }
    });

    const openByPlayer = {};
    sessions.forEach(s => {
      if (!players[s.PlayerID]) issues.push(issue('ORPHAN_PLAYER', S.SESSIONS.title, s.SessionID));
      if (s.Status === 'OPEN') {
        openByPlayer[s.PlayerID] = (openByPlayer[s.PlayerID] || 0) + 1;
        if (openByPlayer[s.PlayerID] > 1) issues.push(issue('MULTIPLE_OPEN_SESSIONS', S.SESSIONS.title, s.PlayerID));
      }
    });

    obs.forEach(o => {
      const session = sessions.find(s => s.SessionID === o.SessionID);
      const objective = objectives[o.ObjectiveID];
      const version = versions[o.ObjectiveVersionID];
      if (!session) issues.push(issue('ORPHAN_SESSION', S.OBSERVATIONS.title, o.ObservationID));
      if (!objective) issues.push(issue('ORPHAN_OBJECTIVE', S.OBSERVATIONS.title, o.ObservationID));
      if (!version) issues.push(issue('ORPHAN_OBJECTIVE_VERSION', S.OBSERVATIONS.title, o.ObservationID));
      if (session && objective && session.PlayerID !== objective.PlayerID) issues.push(issue('CROSS_PLAYER_OBSERVATION', S.OBSERVATIONS.title, o.ObservationID));
      if (version && objective && version.ObjectiveID !== objective.ObjectiveID) issues.push(issue('WRONG_OBJECTIVE_VERSION', S.OBSERVATIONS.title, o.ObservationID));
    });

    const eventIndex = indexBy(events, 'EventID');
    events.forEach(e => {
      if (!players[e.PlayerID]) issues.push(issue('ORPHAN_PLAYER', S.EVENTS.title, e.EventID));
      if (e.ReversalOfEventID && !eventIndex[e.ReversalOfEventID]) issues.push(issue('INVALID_REVERSAL', S.EVENTS.title, e.EventID));
      if (e.ReversalOfEventID === e.EventID) issues.push(issue('SELF_REVERSAL', S.EVENTS.title, e.EventID));
    });

    return { ok: issues.length === 0, issueCount: issues.length, issues };
  }

  function seedDevelopmentData() {
    const actor = V2Services.AuthService.requireAdmin();
    const cfg = B.Config.require();
    if (cfg.environment !== 'DEV') throw new B.BackendError('FORBIDDEN', 'Seed sintético só pode rodar em DEV.');
    const existing = B.SheetGateway.findOne(S.PLAYERS.title, p => p.DisplayCode === 'TEST-STAGE11');
    if (existing) return { reused: true, playerId: existing.PlayerID };
    const player = V2Services.PlayerService.createPlayer({ displayName: 'Criança Teste', displayCode: 'TEST-STAGE11' });
    console.log('[V2Backend] Seed DEV criado', player.PlayerID, 'por', actor.email);
    return { reused: false, playerId: player.PlayerID };
  }

  function validateBackendSchema() {
    V2Services.AuthService.requireAdmin();
    const problems = B.SheetGateway.validateHeaders();
    return { ok: problems.length === 0, problems };
  }

  function upsertSystemValue(key, value, actorEmail) {
    const sheet = B.SheetGateway.sheet(S.SYSTEM.title);
    const headers = B.SheetGateway.headers(S.SYSTEM.title);
    const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
    const keyCol = headers.indexOf('Key');
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][keyCol]) === key) {
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([[key, value, B.Time.nowUtcIso(), actorEmail]]);
        return;
      }
    }
    B.SheetGateway.append(S.SYSTEM.title, { Key: key, Value: value, UpdatedAt: B.Time.nowUtcIso(), UpdatedBy: actorEmail });
  }
  function indexBy(rows, field) { const out = {}; rows.forEach(r => { if (r[field]) out[r[field]] = r; }); return out; }
  function detectDuplicate(sheet, values, issues) { const seen = new Set(); values.forEach(v => { if (seen.has(v)) issues.push(issue('DUPLICATE_KEY', sheet, v)); seen.add(v); }); }
  function detectCompositeDuplicate(sheet, rows, keyFn, issues) { const seen = new Set(); rows.forEach(r => { const k = keyFn(r); if (seen.has(k)) issues.push(issue('DUPLICATE_LOGICAL_KEY', sheet, k)); seen.add(k); }); }
  function issue(code, sheet, ref) { return { code, sheet, ref: String(ref || '') }; }

  return Object.freeze({ initializeBackend, healthCheck, integrityCheck, seedDevelopmentData, validateBackendSchema });
})();

function v2HealthCheck() {
  try { return V2Backend.ErrorModel.ok(V2BackendAdmin.healthCheck()); }
  catch (err) { return V2Backend.ErrorModel.fail(err); }
}
function v2IntegrityCheck() {
  try { return V2Backend.ErrorModel.ok(V2BackendAdmin.integrityCheck()); }
  catch (err) { return V2Backend.ErrorModel.fail(err); }
}
