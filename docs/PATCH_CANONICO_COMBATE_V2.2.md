# PATCH CANÔNICO DE COMBATE v2.2

> **Monstrinhomon — Documento de congelamento operacional**  
> **Data:** 2026-04-07  
> **Status:** Errata vinculante — substitui qualquer leitura ambígua dos documentos anteriores  
> **Escopo:** combate, atributos, habilidades, boss, posicionamento — sem alterar regras de captura, terapia ou economia

---

## MÉTODO: como este patch foi produzido

1. Foram lidos todos os documentos canônicos em `docs/` (v2.0/v2.1/v2.4) e `GAME_RULES.md`
2. Foram lidos os arquivos de runtime: `js/combat/wildCore.js`, `js/combat/wildActions.js`, `js/combat/groupActions.js`, `index.html` (tabelas MM_TABLES)
3. Foram lidos os dados: `MONSTROS.csv`, `monsters.json`
4. Cada conflito foi identificado por par de fontes e classificado por tipo

**Tipos de situação:**
- ✅ **CONFIRMADO** — regra igual em todas as fontes
- ⚠️ **CONFLITO MENOR** — documentos concordam, código diverge
- 🔴 **CONFLITO GRAVE** — fontes documentais divergem entre si
- 🟡 **DECISÃO DO AUTOR NECESSÁRIA** — conflito sem resolução suficiente nas fontes

---

## CLÁUSULA DE AUTORIDADE DOCUMENTAL

A partir deste patch, a autoridade do sistema de combate fica congelada da seguinte forma:

| Nível | Fonte | Papel |
|---|---|---|
| **1 — Autoridade máxima** | **Documento Mestre + `docs/PATCH_CANONICO_COMBATE_V2.2.md`** | Interpretados em conjunto; vencem qualquer outra fonte sem exceção |
| 2 — Documentos auxiliares subordinados | `docs/COMBATE_FORMULA_V2.md`, `docs/POSICIONAMENTO_V2.md`, `docs/HABILIDADES_POR_CLASSE_V2.md`, `docs/ATRIBUTOS_BASE_POR_CLASSE_V2.md`, `docs/TABELA_ENCONTROS_V2.md`, `docs/MATRIZ_MESTRA_BALANCEAMENTO.md` | Válidos apenas quando **compatíveis** com o nível 1 |
| 3 — Legado parcialmente válido | `GAME_RULES.md §1–§2` (classes, ciclo de vantagens) | Ainda vigente onde não contradiz o nível 1 |
| 4 — Legado revogado | `GAME_RULES.md §3–§10` (fórmulas, skills, ENE, captura) | Substituído pelo nível 1; usar apenas como referência histórica |
| 5 — Runtime atual | código em `js/combat/` e `index.html` | Reflete estado de implementação, não autoridade de regra |
| 6 — Análises auxiliares | diagnósticos, propostas, análises de conflito | Informativas; sem força de regra |

### Regra interpretativa obrigatória

- O **Documento Mestre, interpretado em conjunto com `docs/PATCH_CANONICO_COMBATE_V2.2.md`**, é a autoridade máxima do combate.
- **Nenhum documento auxiliar em `docs/`** pode sobrescrever o Documento Mestre sem revisão explícita do autor.
- A formulação anterior ("docs/* vence GAME_RULES.md §3–§10 sem exceção") era incorreta por ser abrangente demais — ela foi revogada por esta cláusula.
- Onde houver conflito entre qualquer combinação de documentos auxiliares, `GAME_RULES.md`, runtime atual ou análises auxiliares: **vence o Documento Mestre + Patch Canônico v2.2**.
- Um documento auxiliar que contradiga o Documento Mestre não é canônico — é um rascunho não aprovado.

---

## BLOCO 1 — FÓRMULA DE CONFRONTO E DANO

### 1.1 Matriz de conflito

| Aspecto | GAME_RULES.md §3 (v1, legado) | docs/COMBATE_FORMULA_V2.md (canônico v2.1) | Código atual | Decisão |
|---|---|---|---|---|
| Rolagem de ataque | `d20 + ATK + bônus_classe >= DEF` (unilateral) | `RC = (d20A + ATK + ...) − (d20D + ceil(DEF/2) + ...)` (bilateral) | Unilateral: `d20 + atkMod + spdBonus >= defValue` | ⚠️ **docs/COMBATE_FORMULA_V2.md vence** — GAME_RULES.md §3 é legado v1 não removido |
| Rolagem de defesa | Inexistente | d20D bilateral | Inexistente | ⚠️ **implementar d20D** |
| DEF no confronto | DEF integral como limiar | `DEF_confronto = ceil(DEF/2)` | DEF integral | ⚠️ **migrar para `ceil(DEF/2)`** |
| 5 faixas de RC | Inexistente (hit/miss binário) | Falha Total / Contato Neut. / Acerto Red. / Normal / Forte | Hit/miss binário | ⚠️ **implementar 5 faixas** |
| DanoBase | `ratio = ATK/(ATK+DEF); danoBase = floor(POWER × ratio)` | `DanoBase = PWR + ATK + ModNível − floor(DEF/2)` | `ATK + POWER − DEF × defMult` (intermediário) | 🔴 **CONFLITO GRAVE — vence docs/COMBATE_FORMULA_V2.md** |
| Mitigação | ratio-based | `floor(DEF/2)` | `def * defMult` | ⚠️ **migrar para `floor(DEF/2)`** |
| Dano mínimo | `max(1, danoBase)` | 1 se houve acerto válido | `max(1, ...)` | ✅ **CONFIRMADO — manter** |
| Multiplicador de faixa | Inexistente | ×0 / ×0 / ×0.60 / ×1.00 / ×1.25 | Inexistente | ⚠️ **implementar** |
| ModNível (tabela discreta ±5) | Inexistente | Tabela 11 faixas, máx ±5 | Inexistente | ⚠️ **implementar** |

### 1.2 Decisão congelada para v2.2

**FÓRMULA DE CONFRONTO VIGENTE:**
```
RC = (d20A + ATK_atacante + BônusAção + ModNível + ModClasse + BuffOfensivo)
   − (d20D + ceil(DEF_defensor/2) + ModPosição + BuffDefensivo)
```

**FÓRMULA DE DANO VIGENTE:**
```
DanoBase = PWR_ação + ATK_atacante + ModNívelDano − floor(DEF_defensor/2)
DanoFinal = max(minDano, floor(DanoBase × mult_faixa))
```

**5 FAIXAS VIGENTES:**

| RC | Faixa | Multiplicador |
|---|---|---|
| ≤ −8 | Falha Total | ×0 |
| −7 a −3 | Contato Neutralizado | ×0 (ou 1 fixo — ver §1.3) |
| −2 a +3 | Acerto Reduzido | ×0.60 (mín 1) |
| +4 a +10 | Acerto Normal | ×1.00 |
| ≥ +11 | Acerto Forte | ×1.25 |

**ModNível:** tabela discreta ±5 conforme `docs/COMBATE_FORMULA_V2.md §5.2`

### 1.3 Regras especiais de nível (confirmadas)

- **Superioridade real** (atac. ≥10 lv acima): Contato Neut. → Acerto Red., exceto nat. 1/20
- **Dano ilusório** (atac. ≥10 lv abaixo): DanoFinal = 1 em Contato Neut. ou Acerto Red.
- **Contato Neutralizado**: DanoFinal = 0, exceto se atac. não for ≥10 lv abaixo → DanoFinal = 1

---

## BLOCO 2 — CRÍTICO E DADOS NATURAIS

### 2.1 Conflito

| Fonte | O que diz |
|---|---|
| GAME_RULES.md §3.4 (v1, legado) | Nat 20: acerto automático + 1 de 3 bônus aleatórios (Poder×2 / Item / Moedas) |
| docs/COMBATE_FORMULA_V2.md §5.4 | Nat 20 atacante: +4 RC e +20% dano final; Nat 1 atacante: −6 RC; Nat 20 defensor: −5 RC; Nat 1 defensor: +4 RC |
| Código atual | Nat 20: `isCrit = true` (acerto automático) + `damageMult × 1.5` |

> **Conflito:** GAME_RULES.md v1 descreve "bônus aleatórios" (item / moeda / poder×2) para crítico. O código implementa acerto automático + ×1.5. `docs/COMBATE_FORMULA_V2.md` define crítico como +4 RC e +20% dano — **não é acerto automático**.

### 2.2 Decisão

🟡 **DECISÃO DO AUTOR NECESSÁRIA:**

> **Opção A:** manter os bônus aleatórios (item / moeda / poder×2) como feature de UX, aplicados além do +20% de dano da v2.1. Os dois sistemas coexistem.  
> **Opção B:** abolir os bônus aleatórios e usar apenas +4 RC e +20% dano (v2.1 puro).

> **Recomendação (sem força de decisão):** Opção A preserva uma feature apreciada pelas crianças (surpresa do crítico) sem contradizer a fórmula matemática. Nat 20 = +4 RC + +20% dano + bônus aleatório de UX.

**Congelado até decisão:** nat 20 do atacante = +4 RC (não acerto automático), +20% dano final. O sistema de bônus aleatório (item/moeda/poder×2) fica marcado como **feature de UX opcional**, separada da fórmula matemática.

---

## BLOCO 3 — ATRIBUTO DE VELOCIDADE: SPD vs AGI

### 3.1 Conflito

| Fonte | Campo técnico usado | Significado |
|---|---|---|
| `MONSTROS.csv` (catálogo) | `base_spd`, `spd_at_level` | Campo real no catálogo de dados |
| `monsters.json` (runtime) | campo `spd` em instâncias | Campo real em runtime |
| `js/combat/wildCore.js` | `monster.spd`, `getEffectiveSpd()`, `SPD_ADVANTAGE_THRESHOLD` | Campo técnico ativo no combate |
| `docs/COMBATE_FORMULA_V2.md` | `AGI` | Nome canônico do atributo |
| `docs/ATRIBUTOS_BASE_POR_CLASSE_V2.md` | `AGI` (coluna, valores, crescimento) | Tabela de balanceamento usa AGI |
| `docs/TABELA_ENCONTROS_V2.md §11.2` | `d20 + AGI ≥ DC_fuga` | Fórmula de fuga usa AGI |
| `GAME_RULES.md §PLAYER OBJECT` (v1) | `speed` implícito | Campo legado |

> **Situação:** catálogo, runtime e código usam `spd`. Documentos canônicos v2 usam `AGI`. Os valores numéricos coincidem nos casos verificados, mas é nominalmente inconsistente.

### 3.2 Decisão

🟡 **DECISÃO DO AUTOR NECESSÁRIA:**

> **Opção A:** `AGI` passa a ser o campo técnico oficial. `spd` renomeado para `agi` em instâncias, catálogos e código. Migração de save obrigatória (`spd` como fallback).  
> **Opção B:** `spd` continua como campo técnico interno. `AGI` é apenas o nome de design nos documentos. Sem migração necessária.

> **Recomendação:** Opção B é menos arriscada e produz o mesmo resultado funcional. Renomear é custo sem benefício funcional imediato.

**Congelado:** `spd` continua como campo técnico vigente. Qualquer novo código deve usar `monster.spd` — não criar campo `agi` em paralelo. A iniciativa e a fuga usam `spd` internamente.

---

## BLOCO 4 — VALORES DE ENE REGEN

### 4.1 Conflito

| Classe | GAME_RULES.md §4.3 | docs/HABILIDADES_POR_CLASSE_V2.md §11.2 | Código atual (ENE_REGEN_BY_CLASS) |
|---|---|---|---|
| Mago | 18%, min 3 | 18%, min 3 | **14%, min 2** ❌ |
| Curandeiro | 18%, min 3 | 18%, min 3 | **14%, min 2** ❌ |
| Bardo | 14%, min 2 | 14%, min 2 | **12%, min 2** ❌ |
| Caçador | 14%, min 2 | 14%, min 2 | **12%, min 2** ❌ |
| Ladino | 14%, min 2 | 14%, min 2 | **12%, min 2** ❌ |
| Animalista | 12%, min 2 | 12%, min 2 | **10%, min 1** ❌ |
| Bárbaro | 12%, min 2 | 12%, min 2 | **10%, min 1** ❌ |
| Guerreiro | 10%, min 1 | 10%, min 1 | 10%, min 1 ✅ |

> Divergência real em 7 das 8 classes. Os dois documentos canônicos concordam; o código está atrasado.

### 4.2 Decisão

✅ **RESOLVIDO — valores dos documentos canônicos são a autoridade:**

| Classe | pct | min |
|---|---|---|
| Mago | 0.18 | 3 |
| Curandeiro | 0.18 | 3 |
| Bardo | 0.14 | 2 |
| Caçador | 0.14 | 2 |
| Ladino | 0.14 | 2 |
| Animalista | 0.12 | 2 |
| Bárbaro | 0.12 | 2 |
| Guerreiro | 0.10 | 1 |

**Ação necessária:** atualizar `ENE_REGEN_BY_CLASS` em `index.html` e `MM_TABLES.ENERGY_REGEN` para estes valores.

---

## BLOCO 5 — POWER BÁSICO (PWR) DO ATAQUE SEM ENE

### 5.1 Conflito

| Classe | GAME_RULES.md §4.1 (v1) | docs/COMBATE_FORMULA_V2.md §9.1 | Código atual (BASIC_ATTACK_POWER) |
|---|---|---|---|
| Guerreiro | 10 | 3 | **7** |
| Bárbaro | 13 | 4 | **9** |
| Mago | 11 | 3 | **7** |
| Curandeiro | 11 | 2 | **8** |
| Ladino | 12 | 3 | **8** |
| Bardo | 10 | 2 | **7** |
| Caçador | 12 | 3 | **8** |
| Animalista | 11 | 3 | **7** |

> O código está em estado intermediário (nem v1, nem v2). Os valores de PWR canônicos (2–4) foram calculados para funcionar com a fórmula v2.1 **e** com os atributos canônicos Lv1 de `ATRIBUTOS_BASE_POR_CLASSE_V2.md`. Como o catálogo atual tem atributos diferentes dos canônicos v2, adotar PWR v2.1 sem recalibrar o catálogo produziria combates desequilibrados.

### 5.2 Decisão

🟡 **DECISÃO DO AUTOR NECESSÁRIA (bloqueante — ver §DECISÕES):**

> **Opção A:** migrar PWR **e** atributos do catálogo simultaneamente para os valores v2.1  
> **Opção B:** manter PWR e atributos atuais, adotar fórmula v2.1 com valores intermediários do código  
> **Opção C:** definir valores de PWR de transição para o catálogo atual, sem ainda adotar atributos v2

**Congelado:** PWR atual mantido até que a decisão de calibração seja tomada. As duas migrações (PWR + catálogo) devem ser feitas juntas ou nenhuma agora.

---

## BLOCO 6 — ATRIBUTOS BASE DO CATÁLOGO vs CANÔNICO v2

### 6.1 Conflito (exemplos representativos, Lv1)

| Monstrinho | Classe | Catálogo (MONSTROS.csv) | Canônico v2.1 (ATRIBUTOS_BASE) |
|---|---|---|---|
| Cantapau | Bardo | HP 28, ATK 6, DEF 4, SPD 5, ENE 8 | HP 18, ATK 4, DEF 3, AGI 5, ENE 7 |
| Pedrino | Guerreiro | HP 32, ATK 7, DEF 6, SPD 3, ENE 6 | HP 24, ATK 5, DEF 8, AGI 3, ENE 4 |
| Faíscari | Mago | HP 26, ATK 8, DEF 3, SPD 4, ENE 10 | HP 18, ATK 7, DEF 3, AGI 4, ENE 7 |
| Ninfolha | Curandeiro | HP 30, ATK 4, DEF 4, SPD 3, ENE 12 | HP 19, ATK 4, DEF 3, AGI 3, ENE 8 |

> Divergências sérias em HP (catálogo 28–32 vs canônico 17–24). DEF do Guerreiro é radicalmente diferente (catálogo 6 vs canônico 8). As simulações de balanceamento de `ATRIBUTOS_BASE_POR_CLASSE_V2.md §8` **não são válidas para o catálogo atual**.

### 6.2 Decisão

🟡 **DECISÃO DO AUTOR NECESSÁRIA (bloqueante — ver §DECISÕES):**

> **Opção A:** recalibrar catálogo para valores v2.1 (exige migração de saves)  
> **Opção B:** manter catálogo atual, ajustar fórmulas/PWR para viabilidade  
> **Opção C:** usar catálogo atual agora, documentar delta com v2.1, planejar recalibração para fase futura

**Congelado:** catálogo atual mantido. Referências de "quantos acertos para KO" do Documento Mestre não são válidas até recalibração.

---

## BLOCO 7 — PASSIVAS DE CLASSE (v1)

### 7.1 Conflito

| Passiva | Presente no código | Presente nos documentos canônicos |
|---|---|---|
| Guerreiro −15% dano recebido | ✅ `wildActions.js` e `groupActions.js` | ❌ Nenhum documento menciona |
| Bárbaro −10% dano recebido | ✅ | ❌ |
| Curandeiro −10% dano recebido | ✅ | ❌ |
| Ladino +10% dano causado | ✅ | ❌ |
| Ladino −1 DEF inimigo no primeiro ataque básico | ✅ `passiveState.ladinoFirstStrikeDone` | ❌ |

> Estas passivas foram implementadas sem formalização no Documento Mestre. Não contradizem nenhuma regra documentada, mas também não têm autoridade canônica.

### 7.2 Decisão

🟡 **DECISÃO DO AUTOR NECESSÁRIA (bloqueante — ver §DECISÕES):**

> **Opção A:** formalizar como regra canônica (adicionar ao GAME_RULES.md e Matriz Mestra)  
> **Opção B:** revogar — o sistema v2.1 já tem `ModClasse (+2/−2 RC, ×1.10/×0.90 dano)` como representação de identidade de classe  
> **Opção C:** manter como mecânica de "passiva de espécie" futura, não de classe genérica

**Congelado:** passivas de classe v1 **permanecem ativas no código** até decisão explícita. Nenhuma nova passiva de classe deve ser criada enquanto as existentes não forem formalizadas ou revogadas.

---

## BLOCO 8 — BOSS: ATRIBUTOS E FASES

### 8.1 Status

| Aspecto | docs/TABELA_ENCONTROS_V2.md §7.2–7.3 | Código atual |
|---|---|---|
| HP ×2.5 | ✅ Canônico e explícito | ❌ Não implementado como multiplicador |
| ATK ×1.5 | ✅ Canônico | ❌ Não implementado |
| DEF ×1.5 | ✅ Canônico | ❌ Não implementado |
| Imunidade a STUN | ✅ Canônico | ❌ Não implementado |
| Imunidade a ROOT | ✅ Canônico | ❌ Não implementado |
| Imunidade a debuff de AGI/SPD | ❌ Boss **NÃO** é imune (doc diz "Não") | — |
| Fase 2: HP ≤ 50%, ATK +20% | ✅ Canônico | ❌ Não implementado |
| Habilidades únicas individuais | ✅ Canônico (definidas por boss) | ❌ Não definidas ainda |

> As fases mínimas de boss **existem e estão no Documento Mestre**. O que ainda não existe são as habilidades únicas individuais de cada boss (que são por definição específicas de cada criatura).

### 8.2 Decisão

✅ **RESOLVIDO — boss mínimo canônico:**

```
Boss mínimo canônico:
- HP_boss  = HP_padrão_do_nível × 2.5
- ATK_boss = ATK_padrão_do_nível × 1.5
- DEF_boss = DEF_padrão_do_nível × 1.5
- Imune a: STUN, ROOT
- NÃO imune a: debuff de AGI/SPD
- Fuga proibida (para o jogador)
- Captura proibida (exceto eventos especiais marcados)
- Fase 1: HP 100%–51%, comportamento padrão
- Fase 2: HP ≤ 50%, ATK adicional +20%, aggro muda (re-prioriza alvos)

Habilidades únicas de boss: FUTURO — definidas individualmente por boss.
```

---

## BLOCO 9 — POSICIONAMENTO E ALCANCE

### 9.1 Status

Sem conflitos entre documentos. `docs/POSICIONAMENTO_V2.md` é único, marcado como canônico.

✅ **CONFIRMADO — sistema canônico:**

```
Grade: Frente / Meio / Trás por lado (inimigos e aliados)
Máx. 2 por linha
Bônus defensivo: +0 (Frente) / +1 (Meio) / +2 (Trás)
Bônus só válido se linha à frente tiver pelo menos 1 aliado vivo
Linha vazia → de trás avança automaticamente (sem custo de turno)

Alcance base:
  Guerreiro:  Curto  (só Frente inimiga)
  Bárbaro:    Curto  (só Frente inimiga)
  Mago:       Longo  (Frente + Meio + Trás)
  Curandeiro: Médio  (ofensivo: Frente + Meio; cura: qualquer linha aliada)
  Bardo:      Longo  (ataque e debuff: qualquer linha; buff: qualquer aliado)
  Ladino:     Médio  (Frente + Meio)
  Caçador:    Longo  (qualquer linha)
  Animalista: Curto  (só Frente inimiga)

Modificador de posição do atacante:
  Posição Frente: sem mudança
  Posição Meio:   +1 linha de alcance (Curto → Médio; Médio → Longo)
  Posição Trás:   −1 linha de alcance (Médio → Curto; Longo → Médio)
  (Alcance mínimo = 0; não pode atacar ninguém se resultar em nenhuma linha)

ModPosição no confronto (bônus defensivo em d20D):
  Frente: +0
  Meio:   +1 (só se Frente aliada tiver pelo menos 1 vivo)
  Trás:   +2 (só se ambas Frente e Meio aliadas tiverem pelo menos 1 vivo)

Posicionamento só existe em batalhas de grupo.
Em solo (wild), não há grade. Alcance é sempre válido.
```

---

## BLOCO 10 — ORDEM DE TURNO

### 10.1 Conflito

| Aspecto | docs/COMBATE_FORMULA_V2.md §3 | GAME_RULES.md §3.3 (v1) | Código atual |
|---|---|---|---|
| Iniciativa | `AGI + d6`, maior age primeiro | Jogador escolhe, depois inimigo contra-ataca (sem iniciativa explícita) | Ordem fixa: jogador sempre primeiro em solo; alternado. Em grupo: `turnOrder` por AGI/SPD |
| Recalculação | Por rodada se AGI/posição mudar | Sem menção | Não implementado |
| Empate | Monstrinhomon do jogador age antes | Sem menção | Não implementado |

### 10.2 Decisão

✅ **RESOLVIDO — iniciativa canônica:**

```
Iniciativa = SPD (= AGI nos docs) + d6, calculado no início do encontro
Maior valor age primeiro
Empate: monstrinhomon do jogador age antes do inimigo
Recalculação: apenas se SPD de algum combatente foi modificado por debuff na rodada anterior
Solo: ordem alterna (jogador → inimigo) — simplificação válida para 1v1
Grupo: turnOrder por iniciativa, recalculado quando SPD muda
```

---

## BLOCO 11 — KO, SWAP E FUGA

### 11.1 Canônico confirmado (sem conflito entre documentos)

```
KO (HP = 0):
  - Monstrinhomon marcado como fainted
  - Removido do turnOrder
  - Linha atualizada (avanço automático se vazia)
  - Jogador escolhe substituto (sem custo de turno)
  - Se sem substituto: jogador eliminado do grupo (batalha continua)

Swap estratégico (iniciativa do jogador):
  - Consome o turno inteiro do slot sendo substituído
  - Substituto entra na mesma posição do anterior
  - ENE do substituto: 100% (campo cheio)
  - Buffs/debuffs do anterior: NÃO transferidos
  - Substituto age a partir do próximo turno

Fuga individual:
  - Somente para monstrinhomon ativo, usando seu turno
  - Fórmula: d20 + SPD ≥ DC_fuga (Normal 12, Intimidating 16, Elite 18)
  - Sucesso: removido do combate, turno gasto
  - Falha: turno gasto, inimigo pode contra-atacar
  - Resultado: batalha continua, não encerra grupo
  - Boss: fuga proibida

Troca de posição (grupo):
  - Mover 1 linha: consome o turno inteiro
  - Mover 2 linhas diretamente: não permitido (requer 2 turnos)
  - Ladino Slot 3 (Passo Sombrio): reposicionamento gratuito sem custo de turno
  - Animalista Slot 4 (Forma Bestial): mobilidade livre durante transformação
```

### 11.2 Estado do código

- Swap por KO: modal existe, integração com turnOrder tem lacunas ⚠️
- Swap estratégico: implementado ✅
- ENE 100% no substituto: **incerto** — não confirmado no código ⚠️
- Buffs não transferidos: **incerto** — não confirmado no código ⚠️
- Fuga individual: ❌ ausente
- Troca de posição: ❌ ausente

---

## BLOCO 12 — SKILLS: SLOTS, NOMES E PROGRESSÃO

### 12.1 Status

| Aspecto | docs/HABILIDADES_POR_CLASSE_V2.md | Código atual |
|---|---|---|
| Estrutura de 4 slots | ✅ Canônico | ❌ Não implementado (sistema diferente) |
| Slot 1 sem ENE, sempre disponível | ✅ | ❌ Não implementado desta forma |
| Progressão por nível (1/5/10/15/22/30/40) | ✅ Canônico | ❌ Progressão diferente |
| Nomes canônicos (Golpe Firme, Pancada Selvagem...) | ✅ Canônico | ❌ Nomes v1 ainda no runtime |
| TAUNT (Guerreiro Slot 3) | ✅ Canônico | ❌ Ausente |
| Passo Sombrio / reposicionamento (Ladino Slot 3) | ✅ Canônico | ❌ Ausente |
| Marcar Alvo (Caçador Slot 3) | ✅ Canônico | ❌ Ausente |
| Tempestade Arcana — AoE (Mago Slot 4) | ✅ Canônico | ❌ Ausente |
| Cura em Área (Curandeiro Slot 4) | ✅ Canônico | ❌ Ausente |

### 12.2 Decisão

⚠️ **Migração dependente do Bloco 5 (PWR) e Bloco 6 (atributos):**

Os valores numéricos de PWR dos slots precisam ser ajustados para o catálogo atual antes de implementar. Os efeitos especiais (TAUNT, marcação, AoE, Passo Sombrio) são canônicos e podem ser implementados independentemente do PWR.

**Congelado:** nomes e estrutura de slots são canônicos v2.1. Valores de PWR dependem da decisão de calibração.

---

## BLOCO 13 — PRIORIDADE DE ALVO DA IA

### 13.1 Status

✅ **Canônico confirmado** (`docs/POSICIONAMENTO_V2.md §5`):

```
IA inimiga escolhe alvo:
1. Linha mais à frente que esteja dentro do alcance do inimigo
2. Dentro dessa linha: alvo com menor HP atual
3. 20% de chance de atacar aleatoriamente dentro da linha acessível (imprevisibilidade)
4. Se algum aliado tem TAUNT ativo: IA DEVE atacar o provocador (sobrescreve regras 1–3)
5. TAUNT é cancelado se o provocador desmaiar ou sair da linha
6. Boss com imunidade a controle: imune a TAUNT
```

⚠️ **Estado do código:** IA usa menor DEF sem grade de linhas. Grade de posicionamento ainda não existe.

---

## PATCH CANÔNICO DE COMBATE v2.2 — TABELA CONSOLIDADA

| Sistema / Regra | Status | Decisão final |
|---|---|---|
| **Fórmula de confronto** | ✅ RESOLVIDO | RC bilateral; 5 faixas — conforme COMBATE_FORMULA_V2.md |
| **Fórmula de dano** | ✅ RESOLVIDO | `PWR + ATK + ModNível − floor(DEF/2)` |
| **DEF no confronto** | ✅ RESOLVIDO | `ceil(DEF/2)` |
| **Mitigação** | ✅ RESOLVIDO | `floor(DEF/2)` |
| **5 faixas de RC** | ✅ RESOLVIDO | Tabela §BLOCO 1 |
| **ModNível** | ✅ RESOLVIDO | Tabela discreta ±5 |
| **Crítico (nat 20)** | 🟡 AUTOR | +4 RC e +20% dano canônicos; bônus aleatório (item/moeda) é decisão de UX |
| **SPD vs AGI** | 🟡 AUTOR | `spd` é o campo técnico vigente; renomear para `agi` é opcional |
| **ENE regen** | ✅ RESOLVIDO | Tabela §BLOCO 4 |
| **PWR básico** | 🟡 AUTOR (BLOQUEANTE) | Dependente de decisão sobre calibração do catálogo |
| **Atributos do catálogo** | 🟡 AUTOR (BLOQUEANTE) | Recalibrar para v2.1 ou manter atual + ajustar PWR |
| **Passivas de classe v1** | 🟡 AUTOR (BLOQUEANTE) | Formalizar ou revogar — não criar novas enquanto existentes |
| **Posicionamento** | ✅ RESOLVIDO | 3 linhas, máx 2/linha, bônus +0/+1/+2 |
| **Alcance por classe** | ✅ RESOLVIDO | Tabela §BLOCO 9 |
| **ModPosição no d20D** | ✅ RESOLVIDO | +0/+1/+2 com condição de cobertura |
| **Avanço automático de linha** | ✅ RESOLVIDO | Linha vazia → trás avança sem custo |
| **Iniciativa** | ✅ RESOLVIDO | SPD + d6; empate → jogador primeiro |
| **KO/swap** | ✅ RESOLVIDO | Sem custo de turno no KO; com custo no swap estratégico |
| **ENE do substituto** | ✅ RESOLVIDO | 100% |
| **Buffs no swap** | ✅ RESOLVIDO | Não transferidos |
| **Fuga individual** | ✅ RESOLVIDO | `d20 + SPD ≥ DC`; boss proibido; grupo continua |
| **Troca de posição** | ✅ RESOLVIDO | 1 linha = 1 turno; Ladino Slot 3 gratuito |
| **Boss stats mínimos** | ✅ RESOLVIDO | HP×2.5, ATK×1.5, DEF×1.5 |
| **Boss imunidades** | ✅ RESOLVIDO | Imune a STUN e ROOT; NÃO imune a debuff de SPD |
| **Boss fases** | ✅ RESOLVIDO | Fase 2 em HP ≤ 50%: ATK +20% adicional |
| **Boss habilidades únicas** | 🟡 AUTOR | Futuro — definidas individualmente por boss |
| **Skills — estrutura 4 slots** | ✅ RESOLVIDO | Conforme HABILIDADES_POR_CLASSE_V2.md |
| **Skills — progressão** | ✅ RESOLVIDO | Lv 1/5/10/15/22/30/40+ |
| **Skills — nomes canônicos** | ✅ RESOLVIDO | Conforme HABILIDADES_POR_CLASSE_V2.md |
| **Skills — valores de PWR** | 🟡 AUTOR | Dependente da decisão sobre catálogo |
| **TAUNT, Passo Sombrio, Marcar Alvo, AoE** | ✅ RESOLVIDO | Canônicos; implementar após posicionamento |
| **Prioridade de alvo IA** | ✅ RESOLVIDO | Frente → menor HP → 20% aleatório → TAUNT |
| **Passivas de espécie** | ✅ RESOLVIDO | Valem em solo E grupo — atualmente ausentes no grupo |
| **Captura** | ✅ RESOLVIDO | Apenas solo; não se aplica ao combate de grupo |
| **Restrição de classe em batalha** | ✅ RESOLVIDO | Jogador usa apenas própria classe; exceção mestre/debug |
| **GAME_RULES.md §3–§10** | ✅ RESOLVIDO | Legado v1; Documento Mestre + Patch v2.2 vencem em conflito |

---

## DECISÕES DO AUTOR QUE BLOQUEIAM IMPLEMENTAÇÃO

### 🔴 DECISÃO BLOQUEANTE A — PWR básico e calibração do catálogo

**Pergunta:** o catálogo de monstrinhos será recalibrado para os valores de `ATRIBUTOS_BASE_POR_CLASSE_V2.md`, ou os valores atuais serão mantidos com PWR ajustado?

**Opções:**
- A: migrar PWR **e** atributos do catálogo simultaneamente para v2.1
- B: manter catálogo atual, adotar fórmula v2.1 com valores intermediários do código
- C: catálogo atual + PWR de transição, recalibração planejada para fase futura

**Impacto se não decidido:** combates podem ser muito longos ou muito curtos; resultados divergem dos exemplos do Documento Mestre.

---

### 🔴 DECISÃO BLOQUEANTE B — Passivas de classe v1

**Pergunta:** as passivas (Guerreiro −15%, Bárbaro −10%, Curandeiro −10%, Ladino +10%) são regra oficial ou legado a revogar?

**Opções:**
- A: formalizar no GAME_RULES.md e na Matriz Mestra
- B: revogar — o sistema v2.1 tem ModClasse como representação de identidade
- C: manter como passiva de espécie futura, não de classe genérica

**Impacto se não decidido:** ao migrar para a fórmula v2.1, essas passivas podem se acumular com os ModClasse novos, causando double-counting de identidade de classe.

---

### 🟡 DECISÃO NÃO-BLOQUEANTE C — SPD vs AGI (renomeação)

**Pergunta:** `spd` é renomeado para `agi` no código e no catálogo?

**Impacto se não decidido:** nenhum — `spd` funciona como AGI. Pode ficar como está.

---

### 🟡 DECISÃO NÃO-BLOQUEANTE D — Bônus aleatório do crítico

**Pergunta:** o sistema de bônus aleatórios (item/moeda/poder×2) ao tirar nat 20 é mantido como feature de UX, eliminado, ou formalizado?

**Impacto se não decidido:** pode ser implementado em paralelo com +4 RC e +20% dano. Os dois não se excluem se o bônus aleatório for tratado como "prêmio narrativo" separado do cálculo.

---

## PRÓXIMA AÇÃO

**Antes de qualquer Fase 0 de código:** o autor responde às Decisões A e B.

Com A e B respondidas, o plano de implementação pode avançar sem ambiguidade canônica na seguinte sequência:

```
Fase 0B  — Higiene arquitetônica
           (passivas de espécie no grupo, deprecated explícito, reduzir duplicação,
            confirmar KO/swap e estado)

Fase 1   — Loop robusto de grupo
           (KO/swap, fuga individual, turnOrder confiável, passivas iguais solo/grupo)

Fase 2   — Posicionamento mínimo funcional
           (Frente/Meio/Trás, bônus defensivo, avanço automático de linha)

Fase 3   — Alcance por classe
           (alvo válido, IA por linha, proteção e exposição)

Fase 4   — UX do posicionamento
           (leitura infantil, alvos desabilitados, proteção visível)

Fase 5   — Migração de skills e efeitos táticos
           (TAUNT, marcação, AoE Mago, mobilidade Ladino/Animalista)

Fase 6   — Balanceamento sistêmico
           (somente depois que tudo acima já existe de verdade)
```
