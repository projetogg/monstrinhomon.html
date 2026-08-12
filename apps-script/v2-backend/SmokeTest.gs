/** Smoke test controlado, somente DEV. Sufixo '_' impede chamada via cliente. */
function v2RunDevelopmentSmokeTest_() {
  const cfg = V2Backend.Config.require();
  if (cfg.environment !== 'DEV') throw new V2Backend.BackendError('FORBIDDEN', 'Smoke test só pode rodar em DEV.');
  const actor = V2Services.AuthService.requireAdmin();
  const run = Date.now().toString(36);
  const player = V2Services.PlayerService.createPlayer({ displayName: 'Criança Teste ' + run, displayCode: 'SMOKE-' + run });
  const objective = V2Services.ObjectiveService.createObjective(player.PlayerID, 'Objetivo sintético de smoke test');
  const version = V2Services.ObjectiveService.createVersion(objective.ObjectiveID, {
    operationalDefinition: 'Dado sintético para validar persistência estrutural da Etapa 11.',
    measurementType: 'OPPORTUNITY_RATIO', measurementConfig: {}, criterionOperator: '>=', criterionThreshold: 0.8,
    criterionConfig: {}, rewardType: 'MONEY', rewardTargetId: '', rewardAmount: 1,
  });
  const session = V2Services.SessionService.open(player.PlayerID);
  const observation = V2Services.ObservationService.createRevision({
    sessionId: session.SessionID, objectiveId: objective.ObjectiveID, objectiveVersionId: version.ObjectiveVersionID,
    measurementType: 'OPPORTUNITY_RATIO', measurementPayload: { opportunities: 5, targetResponses: 4 }, shortNote: 'SMOKE DEV',
  });
  const completed = V2Services.SessionService.complete(session.SessionID, session.Version);
  const reopened = V2Services.SessionService.reopen(completed.SessionID, completed.Version, 'Smoke test de reabertura');
  const completedAgain = V2Services.SessionService.complete(reopened.SessionID, reopened.Version);
  const archived = V2Services.PlayerService.archivePlayer(player.PlayerID, player.Version);
  const health = V2BackendAdmin.healthCheck();
  const integrity = V2BackendAdmin.integrityCheck();
  console.log('[V2Smoke] concluído por', actor.email, player.PlayerID);
  return {
    ok: Boolean(health.ok && integrity.ok), playerId: player.PlayerID, objectiveId: objective.ObjectiveID,
    objectiveVersionId: version.ObjectiveVersionID, sessionId: completedAgain.SessionID, observationId: observation.ObservationID,
    playerArchived: archived.Status === 'ARCHIVED', health, integrity,
  };
}
