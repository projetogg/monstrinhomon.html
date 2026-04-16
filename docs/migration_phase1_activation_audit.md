# Auditoria de Ativação — Fase 1 Runtime Rebuild

**Data:** 2026-04-15  
**Branch:** `copilot/migrationphase1-runtime-rebuild`  
**Auditor:** Agente de Migração Sênior  
**Decisão:** `BLOCKED`

---

## 1. Fontes de Verdade Auditadas

| Arquivo | Papel |
|---|---|
| `docs/migration_phase1_runtime_rebuild.md` | Documento de decisão da Fase 1 |
| `docs/migration_phase1_runtime_candidate.json` | Candidato de runtime proposto (20 monstros) |
| `docs/migration_phase1_id_remap.json` | Tabela de remapeamento semântico |
| `data/monsters.json` | Catálogo vivo do runtime (72 templates) |
| `data/locations.json` | Mapa de locais com referências a IDs de monstros |
| `js/canon/speciesBridge.js` | Tabela explícita runtime-ID → arquétipo canônico |
| `tests/monsterCatalogMigration.test.js` | Testes de integridade do catálogo |
| `tests/speciesBridgeFase8.test.js` | Testes do speciesBridge — evoluções das 4 classes MVP |

---

## 2. Referências de IDs Encontradas

### 2.1 `data/locations.json`

IDs de monstros referenciados (63 IDs únicos, ~250 referências totais):

```
MON_001(4), MON_002(4), MON_002B(5), MON_003(2), MON_004(7),
MON_005(3), MON_006(6), MON_007(5), MON_008(3),
MON_010(5), MON_010B(5), MON_010C(5), MON_010D(4),
MON_011(3), MON_011B(6), MON_011C(2), MON_011D(2),
MON_012(4), MON_012B(5), MON_012C(4), MON_012D(3),
MON_013(5), MON_013B(5), MON_013C(5), MON_013D(4),
MON_014(4), MON_014B(4), MON_014C(4), MON_014D(4),
MON_020(5), MON_020B(5), MON_020C(5),
MON_021(7), MON_021B(7), MON_021C(7),
MON_022(5), MON_022B(5), MON_022C(5),
MON_023(2), MON_023B(5), MON_023C(6),
MON_024(3), MON_024B(4), MON_024C(3),
MON_025(6), MON_025B(6), MON_025C(6),
MON_026(4), MON_026B(4), MON_026C(4),
MON_027(3), MON_027B(4), MON_027C(5),
MON_028(3), MON_028B(3), MON_028C(3),
MON_029(4), MON_029B(4), MON_029C(4),
MON_030(5), MON_030B(5), MON_030C(5),
MON_100(3)
```

### 2.2 `js/canon/speciesBridge.js`

Mapeamentos explícitos `templateId → arquétipo`:

| ID Mapeado | Arquétipo | Criatura Atual (runtime) |
|---|---|---|
| MON_002 | shieldhorn | Pedrino (Guerreiro) |
| MON_002B | shieldhorn | Pedronar (Guerreiro) |
| MON_002C | shieldhorn | Pedragon (Guerreiro) |
| MON_003 | moonquill | Faíscari (Mago) |
| MON_004 | floracura | Ninfolha (Curandeiro) |
| MON_007 | emberfang | Trovão (Bárbaro) |
| MON_010 | shieldhorn | Ferrozimon (Guerreiro) |
| MON_010B | shieldhorn | Cavalheiromon (Guerreiro) |
| MON_010C | shieldhorn | Kinguespinhomon (Guerreiro) |
| MON_010D | shieldhorn | Arconouricomon (Guerreiro) |
| MON_011 | bellwave | Dinomon (Bardo) |
| MON_011B | bellwave | Guitarapitormon (Bardo) |
| MON_011C | bellwave | TRockmon (Bardo) |
| MON_013 | swiftclaw | Miaumon (Caçador) |
| MON_013B | swiftclaw | Gatunamon (Caçador) |
| MON_013C | swiftclaw | Felinomon (Caçador) |
| MON_013D | swiftclaw | Panterezamon (Caçador) |
| MON_014 | moonquill | Lagartomon (Mago) |
| MON_014B | moonquill | Salamandromon (Mago) |
| MON_014C | moonquill | Dracoflamemon (Mago) |
| MON_014D | moonquill | Wizardragomon (Mago) |
| MON_020 | floracura | Gotimon (Curandeiro) |
| MON_020B | floracura | Lirialmon (Curandeiro) |
| MON_020C | floracura | Serafloramon (Curandeiro) |
| MON_021 | emberfang | Tamborilhomon (Bárbaro) |
| MON_021B | emberfang | Rufamon (Bárbaro) |
| MON_021C | emberfang | Trovatambormon (Bárbaro) |
| MON_022 | shadowsting | Corvimon (Ladino) |
| MON_022B | shadowsting | Noxcorvomon (Ladino) |
| MON_022C | shadowsting | Umbraquimonom (Ladino) |
| MON_023 | wildpace | Cervimon (Animalista) |
| MON_023B | wildpace | Galhantemon (Animalista) |
| MON_023C | wildpace | Bosquidalmon (Animalista) |
| MON_024 | moonquill | Coralimon (Mago) |
| MON_024B | moonquill | Recifalmon (Mago) |
| MON_024C | moonquill | Abissalquimon (Mago) |
| MON_025 | swiftclaw | Pulimbon (Caçador) |
| MON_025B | swiftclaw | Flecharelmon (Caçador) |
| MON_025C | swiftclaw | Relampejomon (Caçador) |
| MON_026 | shieldhorn | Cascalhimon (Guerreiro) |
| MON_026B | shieldhorn | Muralhimon (Guerreiro) |
| MON_026C | shieldhorn | Bastiaomon (Guerreiro) |
| MON_027 | bellwave | Zunzumon (Bardo) |
| MON_027B | bellwave | Melodimon (Bardo) |
| MON_027C | bellwave | Rainhassommon (Bardo) |
| MON_028 | floracura | Nutrilo (Curandeiro) |
| MON_028B | floracura | Silvelio (Curandeiro) |
| MON_028C | floracura | Auravelo (Curandeiro) |
| MON_029 | emberfang | Tigrumo (Bárbaro) |
| MON_029B | emberfang | Rugigron (Bárbaro) |
| MON_029C | emberfang | Bestigrar (Bárbaro) |

### 2.3 `tests/monsterCatalogMigration.test.js`

Asserções fixas que dependem do catálogo atual:

| Asserção | Valor Esperado Atual |
|---|---|
| `monstersArray.length` | 72 |
| `MON_001.name` | `'Cantapau'` |
| `MON_001.class` | `'Bardo'` |
| `MON_002.evolvesTo` | `'MON_002B'` |
| `MON_002.evolvesAt` | `12` |
| `MON_010` existe | `true` |
| `MON_010B` existe | `true` |
| `MON_010C` existe | `true` |
| `MON_010D` existe | `true` |
| monstros com `evolvesTo` | `39` |
| monstros sem `evolvesTo` (finais) | `33` |

---

## 3. Colisões Detectadas

### 3.1 Colisões Semânticas de ID em `data/locations.json`

Ao ativar o candidato, os IDs abaixo passariam a significar outro conceito:

| ID | Criatura Atual (runtime) | Classe Atual | Criatura no Candidato | Classe Candidato | Colisão? |
|---|---|---|---|---|---|
| MON_001 | Cantapau | Bardo | Ferrozimon | Guerreiro | ✅ COLISÃO (4 refs) |
| MON_002 | Pedrino | Guerreiro | Cavalheiromon | Guerreiro | ⚠️ NOME/ESTÁGIO |
| MON_003 | Faíscari | Mago | Kinguespinhomon | Guerreiro | ✅ COLISÃO (2 refs) |
| MON_004 | Ninfolha | Curandeiro | Arconouricomon | Guerreiro | ✅ COLISÃO (7 refs) |
| MON_005 | Garruncho | Caçador | Dinomon | Bardo | ✅ COLISÃO (3 refs) |
| MON_006 | Lobinho | Animalista | Guitarapitormon | Bardo | ✅ COLISÃO (6 refs) |
| MON_007 | Trovão | Bárbaro | TRockmon | Bardo | ✅ COLISÃO (5 refs) |
| MON_008 | Sombrio | Ladino | Giganotometalmon | Bardo | ✅ COLISÃO (3 refs) |
| MON_010 | Ferrozimon | Guerreiro | Gatunamon | Caçador | ✅ COLISÃO (5 refs) |
| MON_011 | Dinomon | Bardo | Felinomon | Caçador | ✅ COLISÃO (3 refs) |
| MON_012 | Luvursomon | Animalista | Panterezamon | Caçador | ✅ COLISÃO (4 refs) |
| MON_013 | Miaumon | Caçador | Lagartomon | Mago | ✅ COLISÃO (5 refs) |
| MON_014 | Lagartomon | Mago | Salamandromon | Mago | ⚠️ ESTÁGIO |
| MON_020 | Gotimon | Curandeiro | Ursauramon | Animalista | ✅ COLISÃO (5 refs) |

**Total de referências em locations.json afetadas por colisão de classe:** ≥ 41 referências diretas  
(Não contabilizadas as referências secundárias via B/C/D que se tornariam órfãs)

### 3.2 Colisões Semânticas em `js/canon/speciesBridge.js`

Após ativação do candidato, os mapeamentos abaixo ficariam semanticamente errados:

| ID | Mapeamento Atual | Criatura Após Candidato | Problema |
|---|---|---|---|
| MON_003 | moonquill (Mago controle) | Kinguespinhomon (Guerreiro) | Guerreiro mapeado como Mago |
| MON_004 | floracura (Curandeiro suporte) | Arconouricomon (Guerreiro) | Guerreiro mapeado como Curandeiro |
| MON_007 | emberfang (Bárbaro burst) | TRockmon (Bardo) | Bardo mapeado como Bárbaro |
| MON_010 | shieldhorn (Guerreiro tank) | Gatunamon (Caçador) | Caçador mapeado como Guerreiro |
| MON_011 | bellwave (Bardo velocidade) | Felinomon (Caçador) | Caçador mapeado como Bardo |
| MON_013 | swiftclaw (Caçador velocidade) | Lagartomon (Mago) | Mago mapeado como Caçador |
| MON_020 | floracura (Curandeiro suporte) | Ursauramon (Animalista) | Animalista mapeado como Curandeiro |

**Total de colisões de arquétipo em speciesBridge:** 7 colisões diretas de classe

### 3.3 IDs Órfãos em `js/canon/speciesBridge.js` Após Ativação

O candidato remove/substitui estes IDs, que o speciesBridge ainda referenciaria:

```
MON_002B, MON_002C              (linha Pedrino — desapareceriam do catálogo)
MON_010B, MON_010C, MON_010D   (linha Ferrozimon — desapareceriam)
MON_011B, MON_011C             (linha Dinomon — desapareceriam)
MON_013B, MON_013C, MON_013D   (linha Miaumon — desapareceriam)
MON_014B, MON_014C, MON_014D   (linha Lagartomon — desapareceriam)
MON_020B, MON_020C             (linha Gotimon — desapareceriam)
```

**Total de IDs órfãos criados no speciesBridge:** 14 entradas apontando para IDs inexistentes

### 3.4 IDs Órfãos em `data/locations.json` Após Ativação

O candidato não inclui estes IDs que existem no catálogo atual e são referenciados em locations.json:

```
MON_002B(5 refs), MON_010B(5 refs), MON_010C(5 refs), MON_010D(4 refs),
MON_011B(6 refs), MON_011C(2 refs), MON_011D(2 refs),
MON_012B(5 refs), MON_012C(4 refs), MON_012D(3 refs),
MON_013B(5 refs), MON_013C(5 refs), MON_013D(4 refs),
MON_014B(4 refs), MON_014C(4 refs), MON_014D(4 refs),
MON_020B(5 refs), MON_020C(5 refs),
MON_021(7 refs), MON_021B(7 refs), MON_021C(7 refs),
MON_022(5 refs), MON_022B(5 refs), MON_022C(5 refs),
...e mais 30 IDs com referências ativas
```

**Nota:** O candidato cobre apenas 20 IDs (MON_001–MON_020). O runtime tem 72 templates; a ativação do candidato substituiria apenas o bloco inicial. Contudo, os IDs de B/C/D que EXISTEM no runtime e são referenciados em locations.json passariam a não ter correspondência nos novos IDs do candidato (que usa numeração contínua: MON_001, MON_002, MON_003, MON_004 para a linha Guerreiro, sem sufixos B/C/D).

### 3.5 Quebra de Famílias Evolutivas

O candidato usa numeração contínua (MON_001 → MON_002 → MON_003 → MON_004) em vez de sufixos B/C/D. Após ativação:

- MON_002B (Pedronar, Guerreiro) continuaria no runtime **sem ser apontado** por nenhum `evolvesTo`
- MON_002C (Pedragon, Guerreiro) idem
- MON_010B (Cavalheiromon) idem — tornando-se duplicata semântica de MON_002 (candidato)
- MON_010C (Kinguespinhomon) — duplicata semântica de MON_003 (candidato)
- MON_010D (Arconouricomon) — duplicata semântica de MON_004 (candidato)
- Resultado: catálogo com **criaturas duplicadas sob IDs diferentes**, causando confusão no gameplay e trocas entre jogadores.

### 3.6 Testes que Quebrariam Imediatamente

| Teste | Motivo da Quebra |
|---|---|
| `contém exatamente 72 templates` | Candidato altera semântica sem mudar contagem, mas a contagem futura seria inconsistente |
| `MON_001.name = 'Cantapau'` | Candidato: MON_001 = Ferrozimon |
| `MON_001.class = 'Bardo'` | Candidato: MON_001.class = 'Guerreiro' |
| `MON_002.evolvesTo = 'MON_002B'` | Candidato: MON_002.evolvesTo = 'MON_003' |
| `MON_010` família (B, C, D) existe | Candidato: MON_010 = Gatunamon sem B/C/D |
| `39 monstros têm evolvesTo` | Número muda com as novas entradas do candidato |
| speciesBridge: `MON_010 → shieldhorn` | MON_010 vira Caçador; shieldhorn é arquétipo Guerreiro |
| speciesBridge: `MON_011 → bellwave` | MON_011 vira Caçador; bellwave é arquétipo Bardo |
| speciesBridge: `MON_013 → swiftclaw` | MON_013 vira Mago; swiftclaw é arquétipo Caçador |
| speciesBridge: `MON_020 → floracura` | MON_020 vira Animalista; floracura é arquétipo Curandeiro |

---

## 4. Status de Segurança da Ativação

| Critério | Status |
|---|---|
| IDs únicos preservados | ❌ Reutilização de IDs com semântica diferente |
| `evolvesTo` aponta para ID existente | ❌ Famílias ativas (B/C/D) ficariam sem pai |
| `locations.json` sem IDs órfãos | ❌ 14+ IDs removidos que têm referências ativas |
| `speciesBridge.js` sem IDs removidos | ❌ 14 entradas apontariam para IDs inexistentes |
| Arquétipos do speciesBridge preservados | ❌ 7 colisões de classe/arquétipo |
| Testes de catálogo passando | ❌ ≥ 5 asserções quebram imediatamente |
| Sem duplicatas semânticas no catálogo | ❌ Criaturas duplicadas em IDs antigos e novos |

---

## 5. Lista de Bloqueios

### BLOQUEIO-01 — Colisão de Classe em Locais (CRÍTICO)
Locais do mapa referenciam MON_001 como Bardo, MON_003 como Mago, MON_004 como Curandeiro, etc. O candidato reutiliza esses IDs para criaturas de classes diferentes. Isso alteraria silenciosamente a ecologia e progressão de dificuldade das áreas.

### BLOQUEIO-02 — Colisão de Arquétipo no speciesBridge (CRÍTICO)
Sete mapeamentos no speciesBridge ficariam semanticamente invertidos (ex.: `MON_010 → shieldhorn` aplicaria offsets de tank a um Caçador ágil).

### BLOQUEIO-03 — IDs Órfãos no speciesBridge (ALTO)
Catorze entradas do speciesBridge apontariam para IDs que desapareceriam com a ativação (ex.: `MON_010B → shieldhorn` sem MON_010B no catálogo).

### BLOQUEIO-04 — IDs Órfãos em locations.json (ALTO)
O candidato não inclui os sufixos B/C/D das famílias. Referências como MON_010B (5 vezes), MON_011B (6 vezes), MON_013B (5 vezes) etc. em locations.json apontariam para IDs não existentes no novo catálogo.

### BLOQUEIO-05 — Duplicatas Semânticas no Catálogo (ALTO)
Após a ativação, o runtime teria Ferrozimon em MON_001 E MON_010, Cavalheiromon em MON_002 E MON_010B, etc. — criaturas fisicamente duplicadas sob IDs diferentes, o que corromperia a experiência de captura e troca.

### BLOQUEIO-06 — Quebra de Testes (MÉDIO)
Ao menos 5 asserções fixas em `monsterCatalogMigration.test.js` e várias em `speciesBridgeFase8.test.js` quebrariam imediatamente. Os testes não foram atualizados para o candidato.

### BLOQUEIO-07 — Candidato Incompleto (ESTRUTURAL)
O candidato cobre apenas 20 dos 72 templates. A ativação parcial sem o remapeamento completo de locations.json, speciesBridge.js e testes no **mesmo patch** viola a regra operacional documentada em `migration_phase1_runtime_rebuild.md`.

---

## 6. Decisão Final

```
STATUS: BLOCKED
```

O candidato `docs/migration_phase1_runtime_candidate.json` **não pode ser ativado** no estado atual.

Os 7 bloqueios acima impedem a ativação segura. O principal problema estrutural é a **reutilização de IDs já ocupados por criaturas de classe diferente**, que causaria colisões semânticas em cascata em todas as camadas do sistema (locais, bridge, testes, save files de jogadores).

---

## 7. Próximo Passo Mínimo para Destravar

Ver `docs/migration_phase1_runtime_candidate_reconciled.json` para o candidato corrigido.

O menor próximo passo necessário é:

1. **Preservar os IDs existentes** das famílias canônicas Phase 1 (que já existem no runtime como MON_010/B/C/D, MON_011/B/C/D, etc.)
2. **Criar um plano de deprecação** para os monstros legados MON_001–MON_008 antes de reutilizar esses IDs
3. **Só então**, em uma fase futura, executar o rebase numérico (MON_010 → MON_001 etc.) com patch único que atualize locations.json, speciesBridge.js e testes simultaneamente

O candidato reconciliado propõe exatamente isso: as famílias Phase 1 documentadas com seus **IDs atuais estáveis**, dual class mantida apenas como campo futuro, e os pré-requisitos do rebase explicitamente listados.
