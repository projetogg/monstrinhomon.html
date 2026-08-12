/** Serviços de domínio da Etapa 11. Não executa o motor terapêutico→lúdico. */
const V2Services = (() => {
  'use strict';
  const B = V2Backend;
  const S = V2BackendSchema.SHEETS;
  const P = V2BackendSchema.ID_PREFIX;

  const AuthService = Object.freeze({
    getCurrentUser() {
      const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
      if (!email) throw new B.BackendError('UNAUTHORIZED', 'Não foi possível identificar o usuário Google ativo. O Web App deve executar como o usuário que acessa.');
      const access = B.SheetGateway.findOne(S.ACCESS.title, row => String(row.Email || '').trim().toLowerCase() === email && row.Status === 'ACTIVE');
      if (!access) throw new B.BackendError('FORBIDDEN', 'Usuário não autorizado no backend V2.');
      return { accessId: access.AccessID, email, displayName: access.DisplayName, role: access.Role };
    },
    requireTherapist() {
      const user = this.getCurrentUser();
      if (!['THERAPIST', 'ADMIN'].includes(user.role)) throw new B.BackendError('FORBIDDEN', 'Permissão de terapeuta necessária.');
      return user;
    },
    requireAdmin() {
      const user = this.getCurrentUser();
      if (user.role !== 'ADMIN') throw new B.BackendError('FORBIDDEN', 'Permissão de administrador necessária.');
      return user;
    },
  });

  const PlayerService = Object.freeze({
    listHomePlayers() {
      AuthService.requireTherapist();
      return B.SheetGateway.readAll(S.PLAYERS.title)
        .filter(p => p.Status === 'ACTIVE')
        .map(p => ({ playerId: p.PlayerID, displayName: p.DisplayName, displayCode: p.DisplayCode, playerClassId: p.PlayerClassID, avatarRef: p.AvatarRef }));
    },
    getPlayer(playerId) {
      AuthService.requireTherapist();
      return B.Repository.requireById(S.PLAYERS.title, playerId);
    },
    createPlayer(input) {
      const actor = AuthService.requireAdmin();
      const now = B.Time.nowUtcIso();
      const player = {
        PlayerID: B.Id.newId(P.PLAYER), DisplayName: requiredText(input && input.displayName, 'DisplayName'),
        DisplayCode: optionalText(input && input.displayCode), PlayerClassID: optionalText(input && input.playerClassId), AvatarRef: optionalText(input && input.avatarRef),
        Status: 'ACTIVE', FeaturedMonsterInstanceID: '', CreatedAt: now, CreatedBy: actor.email, UpdatedAt: now, UpdatedBy: actor.email, Version: 1,
      };
      return B.Lock.withWriteLock(() => B.Repository.insert(S.PLAYERS.title, player));
    },
    archivePlayer(playerId, expectedVersion) {
      const actor = AuthService.requireAdmin();
      return B.Lock.withWriteLock(() => B.Repository.updateVersioned(S.PLAYERS.title, playerId, expectedVersion, { Status: 'ARCHIVED' }, actor.email));
    },
  });

  const ObjectiveService = Object.freeze({
    createObjective(playerId, label) {
      const actor = AuthService.requireTherapist();
      B.Repository.requireById(S.PLAYERS.title, playerId);
      const now = B.Time.nowUtcIso();
      const obj = { ObjectiveID: B.Id.newId(P.OBJECTIVE), PlayerID: playerId, Label: requiredText(label, 'Label'), Status: 'ACTIVE',
        CreatedAt: now, CreatedBy: actor.email, ArchivedAt: '', ArchivedBy: '', UpdatedAt: now, UpdatedBy: actor.email, Version: 1 };
      return B.Lock.withWriteLock(() => B.Repository.insert(S.OBJECTIVES.title, obj));
    },
    createVersion(objectiveId, config) {
      const actor = AuthService.requireTherapist();
      const objective = B.Repository.requireById(S.OBJECTIVES.title, objectiveId);
      const prior = B.Repository.listByField(S.OBJECTIVE_VERSIONS.title, 'ObjectiveID', objectiveId);
      const revision = prior.reduce((m, row) => Math.max(m, Number(row.RevisionNumber) || 0), 0) + 1;
      validateMeasurementConfig(config);
      const now = B.Time.nowUtcIso();
      const row = {
        ObjectiveVersionID: B.Id.newId(P.OBJECTIVE_VERSION), ObjectiveID: objective.ObjectiveID, RevisionNumber: revision,
        OperationalDefinition: requiredText(config.operationalDefinition, 'OperationalDefinition'), MeasurementType: config.measurementType,
        MeasurementConfigJSON: B.Json.stringify(config.measurementConfig || {}), CriterionOperator: config.criterionOperator,
        CriterionThreshold: config.criterionThreshold == null ? '' : config.criterionThreshold, CriterionConfigJSON: B.Json.stringify(config.criterionConfig || {}),
        RewardType: config.rewardType, RewardTargetID: optionalText(config.rewardTargetId), RewardAmount: Number(config.rewardAmount),
        EffectiveFrom: config.effectiveFrom || now, EffectiveTo: optionalText(config.effectiveTo), CreatedAt: now, CreatedBy: actor.email,
      };
      return B.Lock.withWriteLock(() => B.Repository.insert(S.OBJECTIVE_VERSIONS.title, row));
    },
    archiveObjective(objectiveId, expectedVersion) {
      const actor = AuthService.requireTherapist();
      return B.Lock.withWriteLock(() => B.Repository.updateVersioned(S.OBJECTIVES.title, objectiveId, expectedVersion,
        { Status: 'ARCHIVED', ArchivedAt: B.Time.nowUtcIso(), ArchivedBy: actor.email }, actor.email));
    },
  });

  const SessionService = Object.freeze({
    open(playerId) {
      const actor = AuthService.requireTherapist();
      B.Repository.requireById(S.PLAYERS.title, playerId);
      return B.Lock.withWriteLock(() => {
        const editable = B.Repository.listByField(S.SESSIONS.title, 'PlayerID', playerId).find(row => row.Status === 'OPEN');
        if (editable) throw new B.BackendError('CONFLICT', 'Já existe uma sessão aberta para este Player.', { sessionId: editable.SessionID });
        const now = B.Time.nowUtcIso();
        const session = { SessionID: B.Id.newId(P.SESSION), PlayerID: playerId, Status: 'OPEN', StartedAt: now, StartedBy: actor.email,
          CompletedAt: '', CompletedBy: '', ReopenCount: 0, LastReopenedAt: '', LastReopenedBy: '', LastReopenReason: '', CreatedAt: now, UpdatedAt: now, Version: 1 };
        return B.Repository.insert(S.SESSIONS.title, session);
      });
    },
    complete(sessionId, expectedVersion) {
      const actor = AuthService.requireTherapist();
      return B.Lock.withWriteLock(() => {
        const session = B.Repository.requireById(S.SESSIONS.title, sessionId);
        if (session.Status !== 'OPEN') throw new B.BackendError('CONFLICT', 'A sessão não está aberta.');
        return B.Repository.updateVersioned(S.SESSIONS.title, sessionId, expectedVersion,
          { Status: 'COMPLETED', CompletedAt: B.Time.nowUtcIso(), CompletedBy: actor.email }, actor.email);
      });
    },
    reopen(sessionId, expectedVersion, reason) {
      const actor = AuthService.requireTherapist();
      const why = requiredText(reason, 'Motivo da reabertura');
      return B.Lock.withWriteLock(() => {
        const session = B.Repository.requireById(S.SESSIONS.title, sessionId);
        if (session.Status !== 'COMPLETED') throw new B.BackendError('CONFLICT', 'Somente sessões concluídas podem ser reabertas.');
        const existing = B.Repository.listByField(S.SESSIONS.title, 'PlayerID', session.PlayerID).find(row => row.Status === 'OPEN');
        if (existing) throw new B.BackendError('CONFLICT', 'Já existe outra sessão aberta para este Player.', { sessionId: existing.SessionID });
        const now = B.Time.nowUtcIso();
        const updated = B.Repository.updateVersioned(S.SESSIONS.title, sessionId, expectedVersion, {
          Status: 'OPEN', ReopenCount: Number(session.ReopenCount || 0) + 1, LastReopenedAt: now, LastReopenedBy: actor.email, LastReopenReason: why,
        }, actor.email);
        EventService.appendPrimitive({ PlayerID: session.PlayerID, EventType: 'SESSION_REOPENED', SourceType: 'SESSION', SourceID: sessionId,
          PayloadJSON: { reason: why, reopenCount: updated.ReopenCount }, OccurredAt: now, CreatedBy: actor.email });
        return updated;
      });
    },
  });

  const ObservationService = Object.freeze({
    createRevision(input) {
      const actor = AuthService.requireTherapist();
      return B.Lock.withWriteLock(() => {
        const session = B.Repository.requireById(S.SESSIONS.title, input.sessionId);
        if (session.Status !== 'OPEN') throw new B.BackendError('CONFLICT', 'A sessão precisa estar aberta para registrar observação.');
        const objective = B.Repository.requireById(S.OBJECTIVES.title, input.objectiveId);
        const version = B.Repository.requireById(S.OBJECTIVE_VERSIONS.title, input.objectiveVersionId);
        if (session.PlayerID !== objective.PlayerID) throw new B.BackendError('VALIDATION_ERROR', 'Session e Objective pertencem a Players diferentes.');
        if (version.ObjectiveID !== objective.ObjectiveID) throw new B.BackendError('VALIDATION_ERROR', 'ObjectiveVersion não pertence ao Objective informado.');
        if (version.MeasurementType !== input.measurementType) throw new B.BackendError('VALIDATION_ERROR', 'MeasurementType diverge da ObjectiveVersion.');
        validateMeasurementPayload(input.measurementType, input.measurementPayload);
        const existing = B.Repository.listByField(S.OBSERVATIONS.title, 'SessionID', session.SessionID).filter(o => o.ObjectiveID === objective.ObjectiveID);
        const revision = existing.reduce((m, o) => Math.max(m, Number(o.RevisionNumber) || 0), 0) + 1;
        const chainId = existing.length ? existing[0].ObservationChainID : B.Id.newId(P.OBSERVATION_CHAIN);
        const previous = existing.sort((a, b) => Number(b.RevisionNumber) - Number(a.RevisionNumber))[0] || null;
        const row = {
          ObservationID: B.Id.newId(P.OBSERVATION), ObservationChainID: chainId, RevisionNumber: revision, PlayerID: session.PlayerID,
          SessionID: session.SessionID, ObjectiveID: objective.ObjectiveID, ObjectiveVersionID: version.ObjectiveVersionID, MeasurementType: input.measurementType,
          MeasurementPayloadJSON: B.Json.stringify(input.measurementPayload), ShortNote: optionalText(input.shortNote),
          SupersedesObservationID: previous ? previous.ObservationID : '', CreatedAt: B.Time.nowUtcIso(), CreatedBy: actor.email,
        };
        return B.Repository.insert(S.OBSERVATIONS.title, row);
      });
    },
  });

  const EventService = Object.freeze({
    appendPrimitive(input) {
      const now = B.Time.nowUtcIso();
      const row = {
        EventID: B.Id.newId(P.EVENT), PlayerID: input.PlayerID, EventType: requiredText(input.EventType, 'EventType'), SourceType: requiredText(input.SourceType, 'SourceType'),
        SourceID: optionalText(input.SourceID), TargetType: optionalText(input.TargetType), TargetID: optionalText(input.TargetID),
        DeltaNumber: input.DeltaNumber == null ? '' : Number(input.DeltaNumber), PayloadJSON: B.Json.stringify(input.PayloadJSON || null),
        RuleSnapshotJSON: B.Json.stringify(input.RuleSnapshotJSON || null), OccurredAt: input.OccurredAt || now, CreatedAt: now,
        CreatedBy: input.CreatedBy || AuthService.requireTherapist().email, ReversalOfEventID: optionalText(input.ReversalOfEventID), OperationID: optionalText(input.OperationID),
      };
      return B.Repository.insert(S.EVENTS.title, row);
    },
    listByPlayer(playerId) { AuthService.requireTherapist(); return B.Repository.listByField(S.EVENTS.title, 'PlayerID', playerId); },
  });

  const OperationService = Object.freeze({
    begin(input) {
      const actor = AuthService.requireTherapist();
      const key = requiredText(input.idempotencyKey, 'IdempotencyKey');
      const prior = B.SheetGateway.findOne(S.OPERATIONS.title, row => row.IdempotencyKey === key);
      if (prior) return prior;
      const now = B.Time.nowUtcIso();
      const row = { OperationID: B.Id.newId(P.OPERATION), IdempotencyKey: key, OperationType: requiredText(input.operationType, 'OperationType'),
        PlayerID: optionalText(input.playerId), Status: 'STARTED', ActorEmail: actor.email, RequestHash: B.Hash.sha256Hex(B.Json.stringify(input.request || {})),
        ResultRef: '', StartedAt: now, CommittedAt: '', FailedAt: '', ErrorCode: '' };
      return B.Repository.insert(S.OPERATIONS.title, row);
    },
  });

  const ProjectionService = Object.freeze({
    childFicha(playerId) {
      AuthService.requireTherapist();
      const p = B.Repository.requireById(S.PLAYERS.title, playerId);
      const attrs = B.Repository.listByField(S.PLAYER_ATTRIBUTES.title, 'PlayerID', playerId).map(a => ({ attributeId: a.AttributeID, currentValue: a.CurrentValue }));
      const monsters = B.Repository.listByField(S.MONSTER_INSTANCES.title, 'PlayerID', playerId).filter(m => m.Location === 'TEAM');
      return { playerId: p.PlayerID, displayName: p.DisplayName, displayCode: p.DisplayCode, playerClassId: p.PlayerClassID, avatarRef: p.AvatarRef,
        featuredMonsterInstanceId: p.FeaturedMonsterInstanceID, attributes: attrs, team: monsters.map(safeMonster) };
    },
    collection(playerId) { AuthService.requireTherapist(); return B.Repository.listByField(S.MONSTER_INSTANCES.title, 'PlayerID', playerId).map(safeMonster); },
    inventory(playerId) { AuthService.requireTherapist(); return B.Repository.listByField(S.INVENTORY_HOLDINGS.title, 'PlayerID', playerId).map(i => ({ itemId: i.ItemID, quantity: i.Quantity })); },
    recordOverview(playerId) {
      AuthService.requireTherapist();
      return {
        objectives: B.Repository.listByField(S.OBJECTIVES.title, 'PlayerID', playerId),
        sessions: B.Repository.listByField(S.SESSIONS.title, 'PlayerID', playerId),
      };
    },
  });

  function safeMonster(m) {
    return { monsterInstanceId: m.MonsterInstanceID, currentTemplateId: m.CurrentTemplateID, nickname: m.Nickname, location: m.Location,
      teamSlot: m.TeamSlot, friendship: m.Friendship, heldItemId: m.HeldItemID };
  }
  function requiredText(value, field) {
    const s = String(value == null ? '' : value).trim();
    if (!s) throw new B.BackendError('VALIDATION_ERROR', field + ' obrigatório.');
    return s;
  }
  function optionalText(value) { return value == null ? '' : String(value).trim(); }
  function validateMeasurementConfig(config) {
    if (!config) throw new B.BackendError('VALIDATION_ERROR', 'Configuração obrigatória.');
    if (!V2BackendSchema.ENUMS.MEASUREMENT_TYPES.includes(config.measurementType)) throw new B.BackendError('VALIDATION_ERROR', 'MeasurementType inválido.');
    if (!V2BackendSchema.ENUMS.CRITERION_OPERATORS.includes(config.criterionOperator)) throw new B.BackendError('VALIDATION_ERROR', 'CriterionOperator inválido.');
    if (!V2BackendSchema.ENUMS.REWARD_TYPES.includes(config.rewardType)) throw new B.BackendError('VALIDATION_ERROR', 'RewardType inválido.');
    if (!Number.isFinite(Number(config.rewardAmount)) || Number(config.rewardAmount) < 0) throw new B.BackendError('VALIDATION_ERROR', 'RewardAmount inválido.');
  }
  function validateMeasurementPayload(type, payload) {
    const p = payload || {};
    if (type === 'OPPORTUNITY_RATIO') {
      const opportunities = Number(p.opportunities); const targetResponses = Number(p.targetResponses);
      if (!Number.isInteger(opportunities) || opportunities < 0 || !Number.isInteger(targetResponses) || targetResponses < 0 || targetResponses > opportunities) {
        throw new B.BackendError('VALIDATION_ERROR', 'Payload de OPPORTUNITY_RATIO inválido.');
      }
    } else if (type === 'COUNT') {
      if (!Number.isInteger(Number(p.count)) || Number(p.count) < 0) throw new B.BackendError('VALIDATION_ERROR', 'COUNT inválido.');
    } else if (type === 'DURATION' || type === 'LATENCY') {
      if (!Number.isFinite(Number(p.milliseconds)) || Number(p.milliseconds) < 0) throw new B.BackendError('VALIDATION_ERROR', type + ' inválido.');
    } else if (type === 'BINARY') {
      if (typeof p.value !== 'boolean') throw new B.BackendError('VALIDATION_ERROR', 'BINARY exige boolean explícito.');
    } else throw new B.BackendError('VALIDATION_ERROR', 'MeasurementType inválido.');
  }

  return Object.freeze({ AuthService, PlayerService, ObjectiveService, SessionService, ObservationService, EventService, OperationService, ProjectionService });
})();

/** Único dispatcher público recomendado para google.script.run. */
function v2Api(method, payload) {
  try {
    const p = payload || {};
    const routes = {
      getHomePlayers: () => V2Services.PlayerService.listHomePlayers(),
      getChildFicha: () => V2Services.ProjectionService.childFicha(p.playerId),
      getCollection: () => V2Services.ProjectionService.collection(p.playerId),
      getInventory: () => V2Services.ProjectionService.inventory(p.playerId),
      getRecordOverview: () => V2Services.ProjectionService.recordOverview(p.playerId),
      openSession: () => V2Services.SessionService.open(p.playerId),
      completeSession: () => V2Services.SessionService.complete(p.sessionId, p.expectedVersion),
      reopenSession: () => V2Services.SessionService.reopen(p.sessionId, p.expectedVersion, p.reason),
      createObservationRevision: () => V2Services.ObservationService.createRevision(p),
    };
    if (!routes[method]) throw new V2Backend.BackendError('NOT_FOUND', 'Método de API desconhecido.');
    return V2Backend.ErrorModel.ok(routes[method]());
  } catch (err) { return V2Backend.ErrorModel.fail(err); }
}
