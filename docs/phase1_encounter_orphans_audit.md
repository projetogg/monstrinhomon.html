# Auditoria de Órfãos de Encontro — Fase 1 (phase1-hard-replace-runtime)

**Data:** 2026-04-16  
**Branch:** `copilot/migrationphase1-runtime-rebuild`  
**Autor:** Copilot Agent  

---

## Objetivo

Verificar se algum `MON_ID` referenciado em arquivos de encontro/localização deixou de existir em `data/monsters.json` após a migração da Fase 1 (`phase1-hard-replace-runtime`), identificando a origem do erro de runtime:

```
TypeError: Cannot read properties of null (reading 'rarity')
```

---

## Arquivos Auditados

| Arquivo | Tipo | IDs Referenciados | Órfãos |
|---|---|---|---|
| `data/locations.json` | speciesPoolsByRarity por área | 55 refs únicas | **0** |
| `data/worldMap.json` | bossMeta / encounterPool nodes | 4 refs únicas | **0** |
| `ENCOUNTERS.csv` | colunas de MON_ID por encontro | 50 refs | **0** |
| `QUESTS.csv` | objetivo_monster_id | 10 refs | **0** |

**Total de IDs únicos referenciados:** 59  
**Referências quebradas (órfãos):** **0**

---

## IDs Existentes em `data/monsters.json`

```
MON_001  MON_002  MON_003  MON_004
MON_005  MON_006  MON_007  MON_008
MON_009  MON_010  MON_011  MON_012
MON_013  MON_014  MON_015  MON_016
MON_017  MON_018  MON_019  MON_020
MON_021  MON_021B MON_021C
MON_022  MON_022B MON_022C
MON_023  MON_023B MON_023C
MON_024  MON_024B MON_024C
MON_025  MON_025B MON_025C
MON_026  MON_026B MON_026C
MON_027  MON_027B MON_027C
MON_028  MON_028B MON_028C
MON_029  MON_029B MON_029C
MON_030  MON_030B MON_030C
MON_100  MON_101  MON_102  MON_103
MON_104  MON_105  MON_106  MON_107  MON_108
```

**Total:** 57 monstros (incluindo stages B/C e legendários)

---

## Conclusão da Auditoria de Dados

**Nenhum ID órfão encontrado nos dados.** O catálogo `data/monsters.json` está consistente com todos os arquivos de encontro.

---

## Causa Raiz do Erro de Runtime

Apesar dos dados estarem corretos, o erro `TypeError: Cannot read properties of null (reading 'rarity')` ocorria porque `startEncounter()` em `index.html` não verificava o retorno de `createMonsterInstanceFromTemplate()` antes de usar o resultado.

`createMonsterInstanceFromTemplate()` retorna `null` quando o template não é encontrado (linha 3097):

```javascript
if (!template) {
    console.warn(`[Factory] Template not found: ${templateId}`);
    return null;  // ← retorno nulo não verificado pelo chamador
}
```

O chamador (linha 4271-4279) acessava diretamente:

```javascript
encounter.wildMonster = createMonsterInstanceFromTemplate(wildTemplateId, ...);
// ↓ crash se wildMonster === null:
encounter.wildMonster.isShiny = generateShinyChance(encounter.wildMonster.rarity);
```

---

## Correção Aplicada

Adicionada verificação de guarda em `startEncounter()` logo após a chamada de `createMonsterInstanceFromTemplate()`:

```javascript
encounter.wildMonster = createMonsterInstanceFromTemplate(
    wildTemplateId,
    wildLevel,
    null,
    { id: 'wild_' + Date.now() }
);

// GUARDA: template não encontrado → erro claro em vez de TypeError genérico
if (!encounter.wildMonster) {
    throw new Error(`Encounter template not found: ${wildTemplateId}`);
}
```

Isso garante que:
- Se o template não existir, o erro lançado é explícito e rastreável.
- Nunca acessa `.rarity` em `null`.
- O log existente em `createMonsterInstanceFromTemplate` (`[Factory] Template not found: ...`) é preservado.

---

## Teste Adicionado

Arquivo: `tests/encounterTemplateGuard.test.js`

Cobre o caso de `wildTemplateId` inexistente, garantindo que `createMonsterInstanceFromTemplate` retorna `null` e que a guarda de runtime funciona corretamente.

---

## Risco Remanescente

| Risco | Severidade | Mitigação |
|---|---|---|
| Novo ID adicionado ao `locations.json` sem estar em `monsters.json` | Médio | Erro claro agora lançado; teste de integridade em `catalogIntegrity.test.js` cobre schema |
| Fallback aleatório (`getMonstersArray()`) com catálogo vazio | Baixo | Bloco `if (!allMonsters \|\| allMonsters.length === 0)` já existente |
| `EncounterPool`/`EncounterEngine` retornando `speciesId` inexistente | Baixo | Agora coberto pela guarda adicionada |
