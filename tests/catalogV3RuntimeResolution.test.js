import { describe, it, expect } from 'vitest';
import {
  CATALOG_V3_CANONICAL_TO_RUNTIME_ID,
  CATALOG_V3_RUNTIME_TO_CANONICAL_ID,
  CATALOG_V3_BLOCKED_CANONICAL_IDS,
  CATALOG_V3_RUNTIME_RENAMES,
  toCatalogV3RuntimeId,
  toCatalogV3CanonicalId,
  isCatalogV3BlockedCanonicalId,
  isCatalogV3ReservedRuntimeId,
} from '../js/data/catalogV3RuntimeResolution.js';

describe('CatalogV3RuntimeResolution', () => {
  it('deve mapear a faixa canônica conflitante para a faixa segura de runtime', () => {
    expect(toCatalogV3RuntimeId('MON_021')).toBe('MON_121');
    expect(toCatalogV3RuntimeId('MON_024')).toBe('MON_124');
    expect(toCatalogV3RuntimeId('MON_029')).toBe('MON_129');
    expect(toCatalogV3RuntimeId('MON_032')).toBe('MON_132');
  });

  it('deve manter IDs não conflitantes sem alteração', () => {
    expect(toCatalogV3RuntimeId('MON_001')).toBe('MON_001');
    expect(toCatalogV3RuntimeId('MON_033')).toBe('MON_033');
    expect(toCatalogV3RuntimeId('MON_078')).toBe('MON_078');
  });

  it('deve reverter runtimeId seguro para canonId original', () => {
    expect(toCatalogV3CanonicalId('MON_121')).toBe('MON_021');
    expect(toCatalogV3CanonicalId('MON_128')).toBe('MON_028');
    expect(toCatalogV3CanonicalId('MON_132')).toBe('MON_032');
  });

  it('deve marcar corretamente a família bloqueada por arte', () => {
    expect(isCatalogV3BlockedCanonicalId('MON_029')).toBe(true);
    expect(isCatalogV3BlockedCanonicalId('MON_030')).toBe(true);
    expect(isCatalogV3BlockedCanonicalId('MON_031')).toBe(true);
    expect(isCatalogV3BlockedCanonicalId('MON_032')).toBe(true);
    expect(isCatalogV3BlockedCanonicalId('MON_028')).toBe(false);
  });

  it('não deve produzir runtimeIds duplicados na tabela de namespace', () => {
    const runtimeIds = Object.values(CATALOG_V3_CANONICAL_TO_RUNTIME_ID);
    const unique = new Set(runtimeIds);
    expect(unique.size).toBe(runtimeIds.length);
  });

  it('o mapa reverso deve ser consistente com o mapa direto', () => {
    for (const [canonId, runtimeId] of Object.entries(CATALOG_V3_CANONICAL_TO_RUNTIME_ID)) {
      expect(CATALOG_V3_RUNTIME_TO_CANONICAL_ID[runtimeId]).toBe(canonId);
    }
  });

  it('deve identificar corretamente runtimeIds reservados do catálogo v3', () => {
    expect(isCatalogV3ReservedRuntimeId('MON_121')).toBe(true);
    expect(isCatalogV3ReservedRuntimeId('MON_132')).toBe(true);
    expect(isCatalogV3ReservedRuntimeId('MON_020')).toBe(false);
    expect(isCatalogV3ReservedRuntimeId('MON_102')).toBe(false);
  });

  it('deve declarar o renome obrigatório para eliminar colisão de nome em MON_102', () => {
    expect(CATALOG_V3_RUNTIME_RENAMES.MON_102).toBe('Arcanomagusmon');
  });

  it('a lista de bloqueados deve estar contida no namespace canônico reservado', () => {
    for (const canonId of CATALOG_V3_BLOCKED_CANONICAL_IDS) {
      expect(Object.keys(CATALOG_V3_CANONICAL_TO_RUNTIME_ID)).toContain(canonId);
    }
  });
});
