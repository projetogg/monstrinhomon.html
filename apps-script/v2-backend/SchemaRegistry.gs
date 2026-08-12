/**
 * Schema Registry do backend V2.
 * Fonte técnica versionada do schema físico usado nas planilhas privadas.
 * Não contém dados reais, regras de combate ou catálogo runtime duplicado.
 */
const V2BackendSchema = (() => {
  'use strict';

  const VERSION = '0.1.0';

  const SHEETS = Object.freeze({
    SYSTEM: spec('00_SYSTEM', 'Key', [
      c('Key', 'STRING', true, 'PK', false),
      c('Value', 'STRING', true, null, true),
      c('UpdatedAt', 'ISO_UTC', true, null, true),
      c('UpdatedBy', 'EMAIL', true, null, true, true),
    ]),
    ACCESS: spec('01_ACCESS', 'AccessID', [
      c('AccessID', 'ID', true, 'PK', false), c('Email', 'EMAIL', true, 'UNIQUE', true, true),
      c('DisplayName', 'STRING', true), c('Role', 'ENUM', true), c('Status', 'ENUM', true),
      auditCreated(), auditCreatedBy(), auditUpdated(), auditUpdatedBy(), versionCol(),
    ], { logicalUnique: [['Email']] }),
    PLAYERS: spec('02_PLAYERS', 'PlayerID', [
      c('PlayerID', 'ID', true, 'PK', false), c('DisplayName', 'STRING', true),
      c('DisplayCode', 'STRING', false), c('PlayerClassID', 'RUNTIME_ID', false), c('AvatarRef', 'STRING', false),
      c('Status', 'ENUM', true), c('FeaturedMonsterInstanceID', 'ID', false, 'FK'),
      auditCreated(), auditCreatedBy(), auditUpdated(), auditUpdatedBy(), versionCol(),
    ]),
    ATTRIBUTE_DEFINITIONS: spec('03_ATTRIBUTE_DEFINITIONS', 'AttributeID', [
      c('AttributeID', 'ID', true, 'PK', false), c('Name', 'STRING', true), c('ShortName', 'STRING', false),
      c('DescriptionLudic', 'STRING', false), c('DisplayOrder', 'INTEGER', true), c('Status', 'ENUM', true),
      auditCreated(), auditCreatedBy(), auditUpdated(), auditUpdatedBy(), versionCol(),
    ]),
    PLAYER_ATTRIBUTES: spec('04_PLAYER_ATTRIBUTES', null, [
      c('PlayerID', 'ID', true, 'FK', false), c('AttributeID', 'ID', true, 'FK', false),
      c('CurrentValue', 'NUMBER', true), auditCreated(), auditCreatedBy(), auditUpdated(), auditUpdatedBy(), versionCol(),
    ], { logicalUnique: [['PlayerID', 'AttributeID']] }),
    MONSTER_INSTANCES: spec('05_MONSTER_INSTANCES', 'MonsterInstanceID', [
      c('MonsterInstanceID', 'ID', true, 'PK', false), c('PlayerID', 'ID', true, 'FK', false),
      c('CurrentTemplateID', 'RUNTIME_ID', true), c('RuntimeInstanceRef', 'STRING', false), c('Nickname', 'STRING', false),
      c('Location', 'ENUM', true), c('TeamSlot', 'INTEGER', false), c('Friendship', 'NUMBER', false),
      c('HeldItemID', 'RUNTIME_ID', false), c('Status', 'ENUM', true),
      auditCreated(), auditCreatedBy(), auditUpdated(), auditUpdatedBy(), versionCol(),
    ]),
    INVENTORY_HOLDINGS: spec('06_INVENTORY_HOLDINGS', null, [
      c('PlayerID', 'ID', true, 'FK', false), c('ItemID', 'RUNTIME_ID', true, null, false), c('Quantity', 'INTEGER', true),
      auditCreated(), auditCreatedBy(), auditUpdated(), auditUpdatedBy(), versionCol(),
    ], { logicalUnique: [['PlayerID', 'ItemID']] }),
    OBJECTIVES: spec('07_OBJECTIVES', 'ObjectiveID', [
      c('ObjectiveID', 'ID', true, 'PK', false), c('PlayerID', 'ID', true, 'FK', false), c('Label', 'STRING', true, null, true, true),
      c('Status', 'ENUM', true), auditCreated(), auditCreatedBy(), c('ArchivedAt', 'ISO_UTC', false),
      c('ArchivedBy', 'EMAIL', false, null, true, true), auditUpdated(), auditUpdatedBy(), versionCol(),
    ]),
    OBJECTIVE_VERSIONS: spec('08_OBJECTIVE_VERSIONS', 'ObjectiveVersionID', [
      c('ObjectiveVersionID', 'ID', true, 'PK', false), c('ObjectiveID', 'ID', true, 'FK', false), c('RevisionNumber', 'INTEGER', true, null, false),
      c('OperationalDefinition', 'STRING', true, null, false, true), c('MeasurementType', 'ENUM', true, null, false),
      c('MeasurementConfigJSON', 'JSON', false, null, false, true), c('CriterionOperator', 'ENUM', true, null, false),
      c('CriterionThreshold', 'NUMBER_OR_STRING', false, null, false), c('CriterionConfigJSON', 'JSON', false, null, false, true),
      c('RewardType', 'ENUM', true, null, false), c('RewardTargetID', 'STRING', false, null, false), c('RewardAmount', 'NUMBER', true, null, false),
      c('EffectiveFrom', 'ISO_UTC', true, null, false), c('EffectiveTo', 'ISO_UTC', false, null, false),
      auditCreated(), auditCreatedBy(),
    ], { immutable: true, logicalUnique: [['ObjectiveID', 'RevisionNumber']] }),
    SESSIONS: spec('09_SESSIONS', 'SessionID', [
      c('SessionID', 'ID', true, 'PK', false), c('PlayerID', 'ID', true, 'FK', false), c('Status', 'ENUM', true),
      c('StartedAt', 'ISO_UTC', true), c('StartedBy', 'EMAIL', true, null, false, true), c('CompletedAt', 'ISO_UTC', false),
      c('CompletedBy', 'EMAIL', false, null, true, true), c('ReopenCount', 'INTEGER', true), c('LastReopenedAt', 'ISO_UTC', false),
      c('LastReopenedBy', 'EMAIL', false, null, true, true), c('LastReopenReason', 'STRING', false, null, true, true),
      auditCreated(), auditUpdated(), versionCol(),
    ], { invariants: ['MAX_ONE_EDITABLE_SESSION_PER_PLAYER'] }),
    OBSERVATIONS: spec('10_OBSERVATIONS', 'ObservationID', [
      c('ObservationID', 'ID', true, 'PK', false), c('ObservationChainID', 'ID', true, null, false), c('RevisionNumber', 'INTEGER', true, null, false),
      c('PlayerID', 'ID', true, 'FK', false), c('SessionID', 'ID', true, 'FK', false), c('ObjectiveID', 'ID', true, 'FK', false),
      c('ObjectiveVersionID', 'ID', true, 'FK', false), c('MeasurementType', 'ENUM', true, null, false),
      c('MeasurementPayloadJSON', 'JSON', true, null, false, true), c('ShortNote', 'STRING', false, null, false, true),
      c('SupersedesObservationID', 'ID', false, 'FK', false), auditCreated(), auditCreatedBy(),
    ], { immutable: true, logicalUnique: [['ObservationChainID', 'RevisionNumber']] }),
    EVENTS: spec('11_EVENTS', 'EventID', [
      c('EventID', 'ID', true, 'PK', false), c('PlayerID', 'ID', true, 'FK', false), c('EventType', 'ENUM', true, null, false),
      c('SourceType', 'ENUM', true, null, false), c('SourceID', 'STRING', false, null, false), c('TargetType', 'ENUM', false, null, false),
      c('TargetID', 'STRING', false, null, false), c('DeltaNumber', 'NUMBER', false, null, false), c('PayloadJSON', 'JSON', false, null, false, true),
      c('RuleSnapshotJSON', 'JSON', false, null, false, true), c('OccurredAt', 'ISO_UTC', true, null, false),
      auditCreated(), auditCreatedBy(), c('ReversalOfEventID', 'ID', false, 'FK', false), c('OperationID', 'ID', false, 'FK', false),
    ], { immutable: true, appendOnly: true }),
    OPERATIONS: spec('12_OPERATIONS', 'OperationID', [
      c('OperationID', 'ID', true, 'PK', false), c('IdempotencyKey', 'STRING', true, 'UNIQUE', false), c('OperationType', 'ENUM', true, null, false),
      c('PlayerID', 'ID', false, 'FK', false), c('Status', 'ENUM', true), c('ActorEmail', 'EMAIL', true, null, false, true),
      c('RequestHash', 'STRING', true, null, false), c('ResultRef', 'STRING', false), c('StartedAt', 'ISO_UTC', true, null, false),
      c('CommittedAt', 'ISO_UTC', false), c('FailedAt', 'ISO_UTC', false), c('ErrorCode', 'STRING', false),
    ], { appendOnly: false, logicalUnique: [['IdempotencyKey']] }),
    RUNTIME_CACHE: spec('13_RUNTIME_CACHE', 'CacheKey', [
      c('CacheKey', 'STRING', true, 'PK', false), c('Domain', 'ENUM', true), c('CanonicalID', 'RUNTIME_ID', true), c('SourcePath', 'STRING', true),
      c('SourceRef', 'STRING', true), c('PayloadHash', 'STRING', true), c('PayloadJSON', 'JSON', true), c('FetchedAt', 'ISO_UTC', true),
    ], { rebuildable: true }),
    SCHEMA_MIGRATIONS: spec('14_SCHEMA_MIGRATIONS', 'MigrationID', [
      c('MigrationID', 'STRING', true, 'PK', false), c('FromVersion', 'STRING', true, null, false), c('ToVersion', 'STRING', true, null, false),
      c('AppliedAt', 'ISO_UTC', true, null, false), c('AppliedBy', 'EMAIL', true, null, false, true), c('CodeRef', 'STRING', true, null, false),
      c('Checksum', 'STRING', true, null, false), c('Status', 'ENUM', true, null, false),
    ], { immutable: true, appendOnly: true }),
  });

  const ENUMS = Object.freeze({
    ROLES: ['ADMIN', 'THERAPIST'],
    ACCESS_STATUS: ['ACTIVE', 'DISABLED'],
    PLAYER_STATUS: ['ACTIVE', 'ARCHIVED'],
    OBJECTIVE_STATUS: ['ACTIVE', 'PAUSED', 'ARCHIVED'],
    SESSION_STATUS: ['OPEN', 'COMPLETED', 'VOIDED'],
    MONSTER_LOCATION: ['TEAM', 'BOX', 'ARCHIVED'],
    MEASUREMENT_TYPES: ['OPPORTUNITY_RATIO', 'COUNT', 'DURATION', 'LATENCY', 'BINARY'],
    CRITERION_OPERATORS: ['>=', '>', '<=', '<', '=='],
    REWARD_TYPES: ['ATTRIBUTE', 'MONEY', 'ITEM'],
    OPERATION_STATUS: ['STARTED', 'COMMITTED', 'FAILED'],
  });

  const ID_PREFIX = Object.freeze({
    ACCESS: 'ACC_', PLAYER: 'PLY_', ATTRIBUTE: 'ATR_', MONSTER_INSTANCE: 'MONI_', OBJECTIVE: 'OBJ_',
    OBJECTIVE_VERSION: 'OBJV_', SESSION: 'SES_', OBSERVATION: 'OBS_', OBSERVATION_CHAIN: 'OBSC_', EVENT: 'EVT_', OPERATION: 'OP_',
  });

  function c(name, type, required, key, mutable, sensitive) {
    return Object.freeze({ name, type, required: Boolean(required), key: key || null, mutable: mutable !== false, sensitive: Boolean(sensitive) });
  }
  function auditCreated() { return c('CreatedAt', 'ISO_UTC', true, null, false); }
  function auditCreatedBy() { return c('CreatedBy', 'EMAIL', true, null, false, true); }
  function auditUpdated() { return c('UpdatedAt', 'ISO_UTC', true); }
  function auditUpdatedBy() { return c('UpdatedBy', 'EMAIL', true, null, true, true); }
  function versionCol() { return c('Version', 'INTEGER', true); }
  function spec(title, primaryKey, columns, extra) {
    return Object.freeze(Object.assign({ title, primaryKey: primaryKey || null, columns: Object.freeze(columns) }, extra || {}));
  }
  function listSheetSpecs() { return Object.keys(SHEETS).map(k => SHEETS[k]); }
  function getSheetSpecByTitle(title) { return listSheetSpecs().find(s => s.title === title) || null; }
  function headersFor(title) {
    const s = getSheetSpecByTitle(title);
    if (!s) throw new Error('Schema desconhecido: ' + title);
    return s.columns.map(col => col.name);
  }

  return Object.freeze({ VERSION, SHEETS, ENUMS, ID_PREFIX, listSheetSpecs, getSheetSpecByTitle, headersFor });
})();
