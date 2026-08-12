/** Lifecycle explícito das operações idempotentes da V2. */
const V2OperationLifecycle = (() => {
  'use strict';
  const B = V2Backend;
  const S = V2BackendSchema.SHEETS;

  function beginOrGet(input) {
    const actor = V2Services.AuthService.requireTherapist();
    const key = required(input && input.idempotencyKey, 'IdempotencyKey');
    const requestHash = B.Hash.sha256Hex(B.Json.stringify((input && input.request) || {}));
    return B.Lock.withWriteLock(() => {
      const prior = B.SheetGateway.findOne(S.OPERATIONS.title, row => row.IdempotencyKey === key);
      if (prior) {
        if (prior.RequestHash !== requestHash) {
          throw new B.BackendError('CONFLICT', 'IdempotencyKey já foi usada com outro payload.');
        }
        return { reused: true, operation: prior };
      }
      const now = B.Time.nowUtcIso();
      const row = {
        OperationID: B.Id.newId(V2BackendSchema.ID_PREFIX.OPERATION), IdempotencyKey: key,
        OperationType: required(input.operationType, 'OperationType'), PlayerID: optional(input.playerId), Status: 'STARTED',
        ActorEmail: actor.email, RequestHash: requestHash, ResultRef: '', StartedAt: now, CommittedAt: '', FailedAt: '', ErrorCode: '',
      };
      B.Repository.insert(S.OPERATIONS.title, row);
      return { reused: false, operation: row };
    });
  }

  function commit(operationId, resultRef) {
    V2Services.AuthService.requireTherapist();
    return B.Lock.withWriteLock(() => updateState(operationId, 'COMMITTED', {
      ResultRef: optional(resultRef), CommittedAt: B.Time.nowUtcIso(), FailedAt: '', ErrorCode: '',
    }));
  }

  function fail(operationId, errorCode) {
    V2Services.AuthService.requireTherapist();
    return B.Lock.withWriteLock(() => updateState(operationId, 'FAILED', {
      FailedAt: B.Time.nowUtcIso(), ErrorCode: required(errorCode, 'ErrorCode'),
    }));
  }

  function getByIdempotencyKey(key) {
    V2Services.AuthService.requireTherapist();
    return B.SheetGateway.findOne(S.OPERATIONS.title, row => row.IdempotencyKey === key);
  }

  function updateState(operationId, targetStatus, patch) {
    const found = B.SheetGateway.locateByPrimaryKey(S.OPERATIONS.title, operationId);
    if (!found) throw new B.BackendError('NOT_FOUND', 'Operation não encontrada.');
    const current = found.value;
    if (current.Status === 'COMMITTED') {
      if (targetStatus === 'COMMITTED') return current;
      throw new B.BackendError('CONFLICT', 'Operation já foi COMMITTED e não pode retroceder.');
    }
    if (current.Status === 'FAILED' && targetStatus === 'COMMITTED') {
      throw new B.BackendError('CONFLICT', 'Operation FAILED exige nova política/retry explícito.');
    }
    const next = Object.assign({}, current, patch || {}, { Status: targetStatus });
    B.SheetGateway.replaceRow(S.OPERATIONS.title, found.rowNumber, next);
    return next;
  }

  function required(value, field) {
    const s = String(value == null ? '' : value).trim();
    if (!s) throw new B.BackendError('VALIDATION_ERROR', field + ' obrigatório.');
    return s;
  }
  function optional(value) { return value == null ? '' : String(value).trim(); }

  return Object.freeze({ beginOrGet, commit, fail, getByIdempotencyKey });
})();
