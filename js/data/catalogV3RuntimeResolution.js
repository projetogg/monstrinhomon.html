/**
 * CATALOG V3 — RESOLUÇÃO DE NAMESPACE E ATIVAÇÃO SEGURA
 *
 * Objetivo:
 * - Preservar os IDs canônicos do catálogo v3 para design/documentação.
 * - Evitar colisão com o runtime vivo em MON_021–030.
 * - Fornecer uma camada explícita de tradução canonId -> runtimeId.
 *
 * Princípio central:
 * - O catálogo v3 é autoritativo em design.
 * - O runtime atual NÃO deve ser sobrescrito em IDs já ocupados.
 * - Quando há colisão, o runtime recebe IDs seguros em uma faixa reservada.
 */

export const CATALOG_V3_RUNTIME_NAMESPACE_VERSION = 'v3-runtime-safe-1';

/**
 * Faixa reservada para ativação segura das famílias canônicas que colidem com
 * o runtime atual. Mantém as famílias contíguas no runtime.
 *
 * 021–024 -> 121–124
 * 025–028 -> 125–128
 * 029–032 -> 129–132
 */
export const CATALOG_V3_CANONICAL_TO_RUNTIME_ID = Object.freeze({
  MON_021: 'MON_121',
  MON_022: 'MON_122',
  MON_023: 'MON_123',
  MON_024: 'MON_124',
  MON_025: 'MON_125',
  MON_026: 'MON_126',
  MON_027: 'MON_127',
  MON_028: 'MON_128',
  MON_029: 'MON_129',
  MON_030: 'MON_130',
  MON_031: 'MON_131',
  MON_032: 'MON_132',
});

export const CATALOG_V3_RUNTIME_TO_CANONICAL_ID = Object.freeze(
  Object.fromEntries(
    Object.entries(CATALOG_V3_CANONICAL_TO_RUNTIME_ID).map(([canonId, runtimeId]) => [runtimeId, canonId])
  )
);

/**
 * IDs canônicos ainda bloqueados para ativação no runtime.
 * Os stats podem existir no artefato oficial, mas não devem entrar no jogo vivo
 * antes de arte + playtest.
 */
export const CATALOG_V3_BLOCKED_CANONICAL_IDS = Object.freeze([
  'MON_029',
  'MON_030',
  'MON_031',
  'MON_032',
]);

/**
 * Renomes obrigatórios no runtime para eliminar colisões semânticas.
 *
 * Caso atual:
 * - MON_024 do catálogo v3 é Arcanumon (Curandeiro)
 * - MON_102 do runtime atual também estava nomeado Arcanumon (Mago Lendário)
 */
export const CATALOG_V3_RUNTIME_RENAMES = Object.freeze({
  MON_102: 'Arcanomagusmon',
});

/**
 * Retorna o runtimeId seguro para um canonId do catálogo v3.
 * Se não houver colisão, retorna o próprio canonId.
 */
export function toCatalogV3RuntimeId(canonId) {
  return CATALOG_V3_CANONICAL_TO_RUNTIME_ID[canonId] || canonId;
}

/**
 * Retorna o canonId correspondente a um runtimeId.
 * Se não houver alias, retorna o próprio runtimeId.
 */
export function toCatalogV3CanonicalId(runtimeId) {
  return CATALOG_V3_RUNTIME_TO_CANONICAL_ID[runtimeId] || runtimeId;
}

/**
 * Informa se um canonId ainda está bloqueado para ativação no runtime.
 */
export function isCatalogV3BlockedCanonicalId(canonId) {
  return CATALOG_V3_BLOCKED_CANONICAL_IDS.includes(canonId);
}

/**
 * Informa se um runtimeId pertence à faixa segura reservada do catálogo v3.
 */
export function isCatalogV3ReservedRuntimeId(runtimeId) {
  return Object.prototype.hasOwnProperty.call(CATALOG_V3_RUNTIME_TO_CANONICAL_ID, runtimeId);
}
