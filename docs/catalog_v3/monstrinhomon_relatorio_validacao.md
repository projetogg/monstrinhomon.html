# Monstrinhomon — Relatório de Validação e Consolidação Oficial
**Versão:** v3.0 — Final  
**Gerado em:** Análise completa multi-iteração (4 rodadas de auditoria)  
**Arquivos de entrada:** Monsters_Runtime (base_mestra), catalogo_tecnico_mestre (DEX v3), monstrinhomon_v3_base_completa.xlsx

---

## 1. HIERARQUIA FINAL DE FONTES

| Tipo de dado | Fonte Primária | Fonte Secundária | Fonte Suspeita |
|---|---|---|---|
| Stats HP/ATK/DEF/ENE/AGI (MON_001-020) | `Monsters_Runtime` — base_mestra | — | `MONSTROS.csv` (descartar) |
| Stats MON_021-078 | `Sheet 3` base_completa (calibrada) | `Class_Baselines` + `Evolution_Growth` | Stats runtime em IDs 021-030 (pertencem a outros monstros) |
| IDs, nomes canônicos, classes, famílias | `catalogo_tecnico_mestre` — DEX v3 | `github_export_runtime` — DEX v3 | Nomes legados runtime |
| Regras de classe, matchups, baselines | `Class_Baselines` — base_mestra | `Balance_Params` | — |
| Deltas evolutivos de referência | `Evolution_Growth` — base_mestra | — | — |

**Nota crítica:** `baseSpd` do runtime = `AGI` nesta base. Verificado por cruzamento em 20 monstros. Campos são semanticamente idênticos com rótulos diferentes.

---

## 2. VALIDAÇÃO FINAL DA AUDITORIA REFINADA

| Achado | Status | Entra na base? | Exige teste prático? |
|---|---|---|---|
| MON_004 ENE/AGI trocados (SPD=8, ENE=9 runtime) | **CONFIRMADO** | Sim — ENE=9, AGI=8 | Não |
| Namespace MON_021-030 conflitante | **CONFIRMADO** | Documentado; insolúvel na planilha | Não (engenharia) |
| Arcanumon duplicado (MON_024 vs MON_102) | **CONFIRMADO** | Documentado; MON_102 precisa renomear | Não (engenharia) |
| Titanmon HP=65 ainda viola hierarquia vs Guerreiro HP=63 | **REVISADO (falha v2)** | Sim — corrigido para HP=62 | Não |
| Tempestamon ATK=ENE=14 quebrava identidade de Mago | **CONFIRMADO** | Sim — ATK=13, ENE=15 | Não |
| Brisamon TOT=66 abaixo da banda Curandeiro Incomum | **CONFIRMADO** | Sim — calibrado para TOT=70 | Não |
| Ferragmon delta +27 excede faixa observada (máx 23) | **CONFIRMADO** | Sim — delta corrigido para +24 | Não |
| Urramon (2-stage Raro) igualava Bestigrar (3-stage Raro) | **CONFIRMADO** | Sim — TOT=100→98 | Não |
| Flechamon/Disparamon AGI excessiva | **CONFIRMADO** | Sim — AGI reduzidas (-1 cada) | Não |
| Risco de redundância entre 4 famílias de Curandeiro | **AINDA INCERTO** | Parcial — stats diferenciam, percepção requer skills | Sim — playtest |
| MONSTROS.csv legado obsoleto | **CONFIRMADO** | Documentado; mover para /archive | Não |

---

## 3. VALIDAÇÃO DO ARTEFATO MARKDOWN ANTERIOR

### Erros identificados e corrigidos

| Erro | Tipo | Resolução |
|---|---|---|
| MON_004 listado com AGI=9, ENE=8 em versões anteriores | ERRO_DE_DADO | Corrigido: ENE=9, AGI=8 (alinhado com runtime) |
| Titanmon HP=65 ainda acima de Guerreiro Místico HP=63 | ERRO_DE_DADO | Corrigido: HP=62 |
| Brisamon TOT=66 (versão v2) | ERRO_DE_DADO | Corrigido: TOT=70 |
| Ferragmon delta=27 | ERRO_DE_DADO | Corrigido: HP=50, DEF=16, TOT=92, delta=24 |
| Urramon TOT=100 igualava Bestigrar 3-stage Raro | ERRO_DE_DADO | Corrigido: HP=55, TOT=98 |
| Flechamon AGI=15 (Incomum Base = Felinomon Raro) | ERRO_DE_DADO | Corrigido: AGI=14 |
| Disparamon AGI=18 (Raro = Panterezamon Místico) | ERRO_DE_DADO | Corrigido: AGI=17 |

**Nenhum ERRO_ESTRUTURAL encontrado.** A arquitetura de colunas e vocabulário fixo estava correta no Markdown anterior.

---

## 4. LÓGICA SISTÊMICA FINAL

### Bandas de referência por raridade (FATO DE FONTE — runtime, n=51 ex-Lendários)

| Raridade | HP | ATK | DEF | AGI | ENE | Total |
|---|---|---|---|---|---|---|
| Comum | 20–34 | 3–9 | 3–9 | 3–11 | 4–11 | 36–57 |
| Incomum | 28–46 | 5–13 | 4–12 | 4–14 | 5–14 | 62–77 |
| Raro | 36–60 | 7–17 | 6–16 | 4–17 | 6–17 | 77–100 |
| Místico | 48–68 | 15–18 | 9–17 | 8–18 | 8–18 | 101–116 |

### Assinaturas por classe (base final verificada)

| Classe | Dom. não-HP | AVG ATK | AVG DEF | AVG ENE | AVG AGI |
|---|---|---|---|---|---|
| Guerreiro | DEF (13,4) | 10,8 | 13,4 | 5,8 | 5,1 |
| Bárbaro | ATK (15,7) | 15,7 | 8,2 | 5,8 | 6,2 |
| Mago | ENE (12,2) | 9,8 | 5,8 | 12,2 | 8,4 |
| Curandeiro | ENE (14,6) | 5,6 | 7,7 | 14,6 | 6,8 |
| Bardo | AGI (11,0) | 8,7 | 6,6 | 9,9 | 11,0 |
| Ladino | AGI (15,4) | 12,6 | 5,6 | 8,3 | 15,4 |
| Caçador | AGI (13,6) | 12,0 | 6,1 | 6,3 | 13,6 |
| Animalista | equilibrado | 10,7 | 9,5 | 7,5 | 7,6 |

### Deltas evolutivos (FATO DE FONTE — runtime)

| Transição | Faixa | Média |
|---|---|---|
| Base→Evo1 | 13–20 | 16,8 |
| Evo1→Evo2 | 15–23 | 19,1 |
| Evo2→Evo3 | 19–27 | 23,1 |
| 2-stage (Incomum→Raro) | 20–24 recomendado | 19,1 referência |

---

## 5. CRITÉRIOS FINAIS DE BALANCEAMENTO

### Regras invioláveis (FATO DE FONTE)

1. **ENE > ATK para qualquer Mago** — 100% consistência runtime. Zero exceções.
2. **Bárbaro HP < Guerreiro HP em qualquer estágio comparável** — baseline canônico + runtime.
3. **AGI de Ladino > AGI de Caçador na mesma raridade** — verificado 4/4 raridades.
4. **DEF de Guerreiro > DEF de Bárbaro em qualquer estágio** — verificado 4/4 raridades.
5. **Curandeiro ATK máximo = 10 (Místico)** — derivado da curva runtime (3→5→7→10).
6. **Total de Raro 2-stage < Total de Raro 3-stage mesma classe** — lógica de catálogo.

### Testes de coerência — resultado final

| Teste | Resultado |
|---|---|
| ENE > ATK para todos os 10 Magos | PASS ✓ |
| Bárbaro Místico HP=62 < Guerreiro Místico HP=63 | PASS ✓ |
| Ladino AGI > Caçador AGI (4 raridades) | PASS ✓ |
| Curandeiro ATK ≤ 10 em todos estágios | PASS ✓ |
| Bárbaro DEF < Guerreiro DEF (4 raridades) | PASS ✓ |
| Totais dentro das bandas de raridade (±5) | PASS ✓ |
| Deltas evolutivos dentro de 12–27 | PASS ✓ |

---

## 6. RESUMO DE IMPORTAÇÃO

| Categoria | Quantidade | IDs |
|---|---|---|
| FATO_CONFIRMADO | 20 | MON_001–020 |
| PROPOSTA_CONSOLIDADA | 54 | MON_021–028, MON_033–078 |
| PROPOSTA_AINDA_ABERTA | 4 | MON_029, MON_030, MON_031, MON_032 |
| **Total** | **78** | — |

---

## 7. REGISTROS QUE NÃO DEVEM SER IMPORTADOS

| ID | Nome | Motivo |
|---|---|---|
| MON_029 | Sombramon | runtimeEnabled=False. Família bloqueada por falta de arte. |
| MON_030 | Furtimon | Dependente de MON_029. Mesmo bloqueio. |
| MON_031 | Umbromon | Dependente de MON_029. Mesmo bloqueio. |
| MON_032 | Feralmon | Dependente de MON_029. Verificar first-strike AGI=21 antes de liberar. |

---

## 8. CONFLITOS AINDA ABERTOS

### Conflito 1 — Namespace MON_021-030 (CRÍTICO)
**Problema:** 10 IDs usam monstros diferentes no runtime vs DEX v3.  
**Impacto:** Importação direta sobrescreve monstros runtime existentes.  
**Solução:** Script de mapeamento `runtime_ID → DEX_v3_ID` antes de qualquer import.

### Conflito 2 — Arcanumon nome duplicado (CRÍTICO)
**Problema:** MON_102 runtime = Arcanumon (Mago). MON_024 DEX v3 = Arcanumon (Curandeiro).  
**Solução:** Renomear MON_102 no runtime antes de importar MON_024.

### Conflito 3 — MONSTROS.csv obsoleto (ALTO)
**Problema:** CSV na raiz diverge em 8/9 entradas do runtime.  
**Solução:** Mover para `/archive`. Remover todas as referências em scripts ativos.

### Conflito 4 — Nomes provisórios (MÉDIO)
**Problema:** ~35 monstros (MON_034, 037–068) têm `namingStatus=needs_verification`.  
**Solução:** Revisão criativa antes de indexar no frontend. Importar com flag `naming_status=provisional`.

### Conflito 5 — Família Ladino bloqueada (BAIXO, aguarda arte)
**Problema:** MON_029-032 têm arte faltando. runtimeEnabled=False.  
**Solução:** Desbloquear após aprovação de arte. Stats já estão definidos e coerentes.

---

## 9. PONTOS QUE EXIGEM VALIDAÇÃO PRÁTICA

| Ponto | Por quê não resolve só em planilha |
|---|---|
| Feralmon AGI=21 + ATK=20 first-strike | Depende da fórmula de combate (COMBATE_FORMULA_V2.md) e ordem de turnos |
| Etermon HP=22 (Comum mais frágil) | Depende de UX — jogador infantil pode se frustrar sem testar |
| Colossauromon AGI=11 < Rugirockmon AGI=12 | Runtime é FATO, mas contra-intuitivo. Documentado, não alterado. |
| Redundância entre 4 famílias de Curandeiro | Depende de diferenciação de skills ou biomas — insolúvel em stats |

---

## 10. COMO TRANSFORMAR EM IMPORTAÇÃO NO PROJETO

### Passos obrigatórios antes do import

```
1. Criar tabela: runtime_id → dex_v3_id (para IDs 021-030)
2. Renomear MON_102 no monsters.json
3. Mover MONSTROS.csv para /archive/
4. Script de importação: csv.agi → json.baseSpd
5. Validar pós-import:
   - ENE > ATK para todos os Magos
   - Bárbaro HP < Guerreiro HP no Místico
   - Ladino AGI > Caçador AGI por raridade
```

### Para monstros com nomes provisórios

```json
{
  "namingStatus": "provisional",
  "runtimeEnabled": true
}
```

### Para monstros bloqueados (MON_029-032)

```json
{
  "runtimeEnabled": false,
  "blockReason": "no_art"
}
```

---

## 11. FONTE OFICIAL DO PROJETO

**A tabela `monstrinhomon_status_oficial.csv` / `.json` gerada neste relatório é a fonte oficial de stats.**  

Ela é derivada de:
- Runtime para MON_001-020 (FATO_CONFIRMADO)
- Análise sistêmica calibrada para MON_021-078 (PROPOSTA_CONSOLIDADA/AINDA_ABERTA)
- 7 testes de coerência aprovados
- 4 iterações de auditoria

**Próxima atualização recomendada:** após execução do Damage_Simulator com os 5 outliers mais extremos (Titanmon ATK=22, Feralmon AGI=21, Arcanumon ENE=22, Panterezamon AGI=18, Arcanodracomon ENE=18).
