/** Fundação de migrations do schema V2. */
const V2Migrations = (() => {
  'use strict';
  const B = V2Backend;
  const S = V2BackendSchema.SHEETS;

  const REGISTRY = Object.freeze([
    Object.freeze({ id: 'MIG_0001', from: '0.0.0', to: '0.1.0', description: 'Bootstrap inicial do schema da Etapa 11.' }),
  ]);

  function getApplied() {
    return B.SheetGateway.readAll(S.SCHEMA_MIGRATIONS.title);
  }

  function status() {
    V2Services.AuthService.requireAdmin();
    const applied = new Set(getApplied().filter(r => r.Status === 'APPLIED').map(r => r.MigrationID));
    return REGISTRY.map(m => Object.assign({}, m, { applied: applied.has(m.id) }));
  }

  /**
   * Etapa 11 não executa migrations destrutivas automaticamente.
   * Esta função apenas valida que o bootstrap MIG_0001 está registrado.
   */
  function validateBootstrapMigration() {
    V2Services.AuthService.requireAdmin();
    const applied = getApplied().find(r => r.MigrationID === 'MIG_0001' && r.Status === 'APPLIED');
    if (!applied) throw new B.BackendError('SCHEMA_MISMATCH', 'MIG_0001 não registrada como APPLIED. Execute o bootstrap controlado.');
    if (applied.ToVersion !== V2BackendSchema.VERSION) throw new B.BackendError('VERSION_MISMATCH', 'Migration bootstrap não corresponde ao Schema Registry.');
    return { ok: true, migrationId: applied.MigrationID, schemaVersion: applied.ToVersion };
  }

  return Object.freeze({ REGISTRY, status, validateBootstrapMigration });
})();
